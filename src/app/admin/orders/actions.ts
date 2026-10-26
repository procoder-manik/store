"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderEmail } from "@/lib/order-emails";
import { bookSteadfastParcel } from "@/lib/steadfast";

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["confirmed", "processing", "shipped", "delivered", "cancelled", "returned"]),
  note: z.string().max(300),
  courier: z.string().trim().max(40).optional(),
  tracking: z.string().trim().max(60).optional(),
});

export async function changeStatus(formData: FormData) {
  const d = schema.parse({
    id: formData.get("id"), status: formData.get("status"), note: String(formData.get("note") ?? ""),
    courier: String(formData.get("courier") ?? "") || undefined, tracking: String(formData.get("tracking") ?? "") || undefined,
  });
  const { user } = await requireStaff("order.status");
  const db = createAdminClient();
  const { error } = await db.rpc("set_order_status", { p_order: d.id, p_status: d.status, p_actor: user.id, p_note: d.note || null });
  if (error) throw new Error(error.message.includes("BAD_TRANSITION") ? "That status change is not allowed from the current status." : error.message);
  if (d.courier || d.tracking) await db.from("orders").update({ ...(d.courier ? { courier: d.courier } : {}), ...(d.tracking ? { tracking_code: d.tracking } : {}) }).eq("id", d.id);
  if (d.status === "shipped" || d.status === "delivered") {
    const { data: o } = await db.from("orders").select("order_no, guest_name, guest_email, total, payment_status, courier, tracking_code").eq("id", d.id).maybeSingle();
    if (o?.guest_email) await sendOrderEmail(d.status, { email: o.guest_email as string, name: o.guest_name as string, orderNo: Number(o.order_no), total: Number(o.total), paid: o.payment_status === "paid", courier: (o.courier as string) ?? undefined, trackingCode: (o.tracking_code as string) ?? undefined });
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${d.id}`);
}

export async function saveShipment(formData: FormData) {
  const d = z.object({ id: z.string().uuid(), courier: z.string().trim().max(40), tracking: z.string().trim().max(60) }).parse({ id: formData.get("id"), courier: formData.get("courier") ?? "", tracking: formData.get("tracking") ?? "" });
  const { supabase } = await requireStaff("order.shipment");
  const { error } = await supabase.from("orders").update({ courier: d.courier || null, tracking_code: d.tracking || null }).eq("id", d.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/orders/${d.id}`);
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
