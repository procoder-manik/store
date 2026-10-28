"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderEmail, type OrderEmailKind } from "@/lib/order-emails";
import { sendAutoEmail } from "@/lib/auto-emails";
import { rewardReferrer } from "@/lib/credit";
import { formatPrice } from "@/lib/config";
import { bookSteadfastParcel } from "@/lib/steadfast";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"]),
  note: z.string().max(300),
  courier: z.string().trim().max(40).optional(),
  tracking: z.string().trim().max(60).optional(),
});

export async function changeStatus(formData: FormData) {
  const d = schema.parse({
    id: formData.get("id"), status: formData.get("status"), note: String(formData.get("note") ?? ""),
    courier: String(formData.get("courier") ?? "") || undefined, tracking: String(formData.get("tracking") ?? "") || undefined,
  });
  await applyStatus(d);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${d.id}`);
  revalidatePath("/admin");
}

/** Used by the order page and by the quick actions in the list. */
export async function applyStatus(d: { id: string; status: string; note: string; courier?: string; tracking?: string }) {
  const { user } = await requireStaff("order.status");
  const db = createAdminClient();
  const { data: before } = await db.from("orders").select("status").eq("id", d.id).maybeSingle();
  // Any status can be chosen, including going back. The database keeps stock, credit and rewards right.
  const { error } = await db.rpc("force_order_status", { p_order: d.id, p_status: d.status, p_actor: user.id, p_note: d.note || null });
  if (error) {
    // Older databases do not have the flexible function yet, so the guarded one is used.
    if (/force_order_status/.test(error.message) && /(function|schema cache)/i.test(error.message)) {
      const old = await db.rpc("set_order_status", { p_order: d.id, p_status: d.status, p_actor: user.id, p_note: d.note || null });
      if (old.error) throw new Error(old.error.message.includes("BAD_TRANSITION") ? "That change needs the latest database update (file 0015) to go backwards." : old.error.message);
    } else throw new Error(error.message.includes("OUT_OF_STOCK") ? "Cannot reopen this order because an item is out of stock now." : error.message);
  }
  if (d.courier || d.tracking) await db.from("orders").update({ ...(d.courier ? { courier: d.courier } : {}), ...(d.tracking ? { tracking_code: d.tracking } : {}) }).eq("id", d.id);
  if (d.status === "cancelled" && d.note) await db.from("orders").update({ cancel_reason: d.note }).eq("id", d.id);

  const { data: o } = await db.from("orders").select("order_no, guest_name, guest_email, total, payment_status, courier, tracking_code, order_items(name_snapshot, qty)").eq("id", d.id).maybeSingle();
  const ORDER = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"];
  const from = ORDER.indexOf((before?.status as string) ?? ""), to = ORDER.indexOf(d.status);
  const movedBack = from >= 0 && to >= 0 && to < from; // correcting a mistake, so the customer is not emailed again
  if (o?.guest_email && !movedBack && d.status !== "pending") {
    const items = ((o.order_items ?? []) as { name_snapshot: string; qty: number }[]).map((i) => `${i.name_snapshot} x ${i.qty}`);
    await sendOrderEmail(d.status as OrderEmailKind, { orderId: d.id, email: o.guest_email as string, name: o.guest_name as string, orderNo: Number(o.order_no), total: Number(o.total), paid: o.payment_status === "paid", courier: (o.courier as string) ?? undefined, trackingCode: (o.tracking_code as string) ?? undefined, items, reason: d.note });
  }
  if (d.status === "delivered" && before?.status !== "delivered") await rewardReferrer(d.id);
}

/** One click from the orders list: move an order to its next step. */
export async function quickStatus(formData: FormData) {
  const d = z.object({ id: z.string().uuid(), status: z.enum(["confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"]) })
    .parse({ id: formData.get("id"), status: formData.get("status") });
  await applyStatus({ ...d, note: "" });
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

/** Pick any status from a list, on the order page or in the orders list. */
export async function setAnyStatus(formData: FormData) {
  const d = z.object({
    id: z.string().uuid(),
    status: z.enum(["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"]),
    note: z.string().max(300),
  }).parse({ id: formData.get("id"), status: formData.get("status"), note: String(formData.get("note") ?? "") });
  await applyStatus(d);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${d.id}`);
  revalidatePath("/admin");
}

export async function refundOrder(formData: FormData) {
  const d = z.object({
    id: z.string().uuid(),
    amount: z.coerce.number().positive("Enter how much to refund"),
    method: z.enum(["manual", "store_credit", "gateway"]),
    note: z.string().trim().max(200),
  }).parse({ id: formData.get("id"), amount: formData.get("amount"), method: formData.get("method"), note: String(formData.get("note") ?? "") });
  const { user } = await requireStaff("order.refund");
  const db = createAdminClient();
  const { error } = await db.rpc("record_refund", { p_order: d.id, p_amount: d.amount, p_method: d.method, p_note: d.note || null, p_actor: user.id });
  if (error) {
    const m = error.message;
    throw new Error(m.includes("NOT_PAID") ? "This order is not marked as paid, so there is nothing to refund. For cash on delivery, cancel or return the order instead." : m.includes("BAD_AMOUNT") ? "That amount is more than what is left to refund." : m.includes("NO_ACCOUNT") ? "This customer ordered as a guest, so store credit cannot be given. Choose another method." : m);
  }
  const { data: o } = await db.from("orders").select("order_no, guest_name, guest_email").eq("id", d.id).maybeSingle();
  if (o?.guest_email) {
    const methods: Record<string, string> = { manual: "sent by hand", store_credit: "added to your store credit", gateway: "returned to your original payment" };
    await sendAutoEmail("order_refunded", o.guest_email as string, { name: String(o.guest_name).split(" ")[0], order_no: String(o.order_no), amount: formatPrice(d.amount), method: methods[d.method] });
  }
  revalidatePath(`/admin/orders/${d.id}`);
  revalidatePath("/admin/orders");
}

export async function saveShipment(formData: FormData) {
  const d = z.object({ id: z.string().uuid(), courier: z.string().trim().max(40), tracking: z.string().trim().max(60) }).parse({ id: formData.get("id"), courier: formData.get("courier") ?? "", tracking: formData.get("tracking") ?? "" });
  const { supabase } = await requireStaff("order.shipment");
  const { error } = await supabase.from("orders").update({ courier: d.courier || null, tracking_code: d.tracking || null }).eq("id", d.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/orders/${d.id}`);
}

/** Staff checked a bKash, Nagad, Rocket, Upay or bank payment in the wallet or bank app and mark the result here. */
export async function verifyPayment(formData: FormData) {
  const d = z.object({ id: z.string().uuid(), result: z.enum(["received", "not_found"]) }).parse({ id: formData.get("id"), result: formData.get("result") });
  const { supabase, user } = await requireStaff("order.verify_payment");
  const { data: o } = await supabase.from("orders").select("status, payment_status, payment_method").eq("id", d.id).maybeSingle();
  if (!o) throw new Error("Order not found");
  if (o.payment_status !== "unpaid") throw new Error("This payment was already marked.");
  const { error } = await createAdminClient().from("orders").update({ payment_status: d.result === "received" ? "paid" : "failed" }).eq("id", d.id).eq("payment_status", "unpaid");
  if (error) throw new Error(error.message);
  await supabase.from("order_events").insert({ order_id: d.id, status: o.status, note: d.result === "received" ? "Payment checked and received." : "Payment could not be found. Contact the customer before sending the order.", actor: user.id });
  revalidatePath(`/admin/orders/${d.id}`);
  revalidatePath("/admin/orders");
}

export async function addOrderNote(formData: FormData) {
  const d = z.object({ id: z.string().uuid(), note: z.string().trim().min(1, "Write a note").max(300) }).parse({ id: formData.get("id"), note: formData.get("note") });
  const { supabase, user } = await requireStaff("order.note");
  const { data: o } = await supabase.from("orders").select("status").eq("id", d.id).maybeSingle();
  if (!o) throw new Error("Order not found");
  const { error } = await supabase.from("order_events").insert({ order_id: d.id, status: o.status, note: d.note, actor: user.id });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/orders/${d.id}`);
}

export async function bookSteadfast(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  await requireStaff("order.steadfast");
  const db = createAdminClient();
  const { data: o } = await db.from("orders").select("order_no, total, guest_name, guest_phone, note, payment_status, consignment_id, shipping_address").eq("id", id).maybeSingle();
  if (!o) throw new Error("Order not found");
  if (o.consignment_id) throw new Error("This order is already booked.");
  const a = o.shipping_address as { district?: string; address?: string };
  const r = await bookSteadfastParcel({ invoice: String(o.order_no), name: o.guest_name as string, phone: o.guest_phone as string, address: `${a?.address ?? ""}, ${a?.district ?? ""}`, cod: o.payment_status === "paid" ? 0 : Number(o.total), note: (o.note as string) ?? "" });
  if (!r.ok) throw new Error(r.error);
  await db.from("orders").update({ courier: "Steadfast", consignment_id: r.consignmentId, tracking_code: r.trackingCode }).eq("id", id);
  revalidatePath(`/admin/orders/${id}`);
}
