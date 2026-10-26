"use server";

import { z } from "zod";
import { requireStaff } from "@/lib/admin";
import { priceCart } from "@/lib/checkout";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/utils";

const schema = z.object({
  name: z.string().trim().min(2, "Enter the customer name").max(80),
  phone: z.string().trim().max(20),
  district: z.string().trim().min(2, "Enter the district").max(60),
  address: z.string().trim().min(6, "Enter the full address").max(300),
  zoneId: z.string().uuid("Choose a delivery area"),
  note: z.string().trim().max(300),
  discount: z.number().min(0).max(10_000_000),
  paid: z.boolean(),
  items: z.array(z.object({ productId: z.string().uuid(), variantId: z.string().uuid().optional(), qty: z.number().int().min(1).max(50) })).min(1, "Add at least one item").max(30),
});

/** Orders taken by phone or chat. Prices come from the database, and stock is held the same way as web orders. */
export async function createManualOrder(input: unknown): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const d = p.data;
  const phone = normalizePhone(d.phone);
  if (!phone) return { ok: false, error: "Enter a valid mobile number, like 01712345678." };
  let ctx;
  try { ctx = await requireStaff("order.manual"); } catch (e) { return { ok: false, error: (e as Error).message }; }
  try {
    const priced = await priceCart(d.items, d.zoneId);
    if (!priced.ok) return priced;
    const discount = Math.min(priced.subtotal, priced.discount + d.discount);
    const total = priced.subtotal + priced.shipping - discount;
    const db = createAdminClient();
    const { data, error } = await db.rpc("create_order", {
      o: { user_id: "", name: d.name, phone, email: "", payment_method: "cod", subtotal: priced.subtotal, shipping_fee: priced.shipping, discount, total, coupon_code: "", shipping_address: { district: d.district, address: d.address }, risk_score: 0, zone: priced.zoneName, ip: "admin", note: d.note },
      items: priced.lines.map((l) => ({ product_id: l.productId, variant_id: l.variantId ?? "", name: l.name, unit_price: l.unitPrice, qty: l.qty })),
    });
    if (error) return { ok: false, error: error.message.includes("OUT_OF_STOCK") ? "One of the items just sold out." : "Could not create the order. Please try again." };
    const id = (data as { id: string }).id;
    await db.from("orders").update({ source: "phone", ...(d.paid ? { payment_status: "paid" } : {}) }).eq("id", id);
    await db.rpc("set_order_status", { p_order: id, p_status: "confirmed", p_actor: ctx.user.id, p_note: "Phone order" });
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Could not create the order right now." };
  }
}
