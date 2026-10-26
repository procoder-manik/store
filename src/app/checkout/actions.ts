"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { priceCart, type Priced } from "@/lib/checkout";
import { checkFraud } from "@/lib/fraud";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/utils";
import { sendOrderEmail } from "@/lib/order-emails";
import { sslConfigured, startPayment } from "@/lib/sslcommerz";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const cart = z.array(z.object({ productId: z.string().uuid("Demo products cannot be ordered"), variantId: z.string().uuid().optional(), qty: z.number().int().min(1).max(10) })).min(1, "Your cart is empty").max(30);

const quoteSchema = z.object({ items: cart, zoneId: z.string().uuid(), coupon: z.string().max(40).optional(), bump: z.boolean().optional() });

export async function quoteOrder(input: unknown): Promise<Priced> {
  const p = quoteSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  if (!(await rateLimit(`quote:${await clientIp()}`, 120, 600))) return { ok: false, error: "Please slow down for a moment." };
  try {
    return await priceCart(p.data.items, p.data.zoneId, p.data.coupon, p.data.bump);
  } catch {
    return { ok: false, error: "Checkout is not available right now." };
  }
}

const orderSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z.string().trim().max(20),
  email: z.union([z.string().trim().email("Enter a valid email").max(120), z.literal("")]),
  zoneId: z.string().uuid("Choose a delivery area"),
  district: z.string().trim().min(2, "Enter your district").max(60),
  address: z.string().trim().min(6, "Enter your full address").max(300),
  note: z.string().trim().max(300),
  coupon: z.string().trim().max(40),
  paymentMethod: z.enum(["cod", "online"]),
  bump: z.boolean(),
  website: z.string(),
  items: cart,
});

type Placed = { ok: true; id: string; payUrl?: string } | { ok: false; error: string };
const GENERIC = "We could not place this order. Please contact us to complete it.";

export async function placeOrder(input: unknown): Promise<Placed> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.website) return { ok: false, error: GENERIC };
  if (!(await rateLimit(`order:${await clientIp()}`, 6, 600))) return { ok: false, error: "Too many orders from this connection. Please wait a few minutes or call us." };

  const phone = normalizePhone(d.phone);
  if (!phone) return { ok: false, error: "Enter a valid Bangladeshi mobile number, like 01712345678." };

  const online = d.paymentMethod === "online";
  if (online && !sslConfigured()) return { ok: false, error: "Online payment is not available right now. Please choose cash on delivery." };

  try {
    if (online) await createAdminClient().rpc("expire_unpaid_orders"); // frees stock held by unpaid online orders
    const priced = await priceCart(d.items, d.zoneId, d.coupon, d.bump);
    if (!priced.ok) return priced;
    if (d.coupon && !priced.couponCode) return { ok: false, error: priced.couponError ?? "That coupon code is not valid." };

    const h = await headers();
    const rawIp = (h.get("x-forwarded-for") ?? "").split(",")[0].trim();
    const ip = /^[0-9a-fA-F:.]{3,45}$/.test(rawIp) ? rawIp : "unknown";

    const fraud = await checkFraud({ phone, ip, email: d.email.toLowerCase(), total: priced.total });
    if (fraud.block) return { ok: false, error: GENERIC };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const db = createAdminClient();
    const { data, error } = await db.rpc("create_order", {
      o: {
        user_id: user?.id ?? "",
        name: d.name,
        phone,
        email: d.email.toLowerCase(),
        payment_method: online ? "sslcommerz" : "cod",
        subtotal: priced.subtotal,
        shipping_fee: priced.shipping,
        discount: priced.discount,
        total: priced.total,
        coupon_code: priced.couponCode ?? "",
        shipping_address: { district: d.district, address: d.address },
        risk_score: fraud.score,
        zone: priced.zoneName,
        ip,
        note: d.note,
      },
      items: priced.lines.map((l) => ({ product_id: l.productId, variant_id: l.variantId ?? "", name: l.name, unit_price: l.unitPrice, qty: l.qty })),
    });
    if (error) {
      if (error.message.includes("OUT_OF_STOCK")) return { ok: false, error: "Sorry, an item just sold out. Please review your cart." };
      if (error.message.includes("COUPON_UNAVAILABLE")) return { ok: false, error: "That coupon is no longer available." };
      return { ok: false, error: "Something went wrong placing your order. Please try again." };
    }
    const created = data as { id: string; order_no: number };
    try {
      await db.from("abandoned_carts").update({ recovered: true }).eq("recovered", false).eq("phone", phone);
      if (d.email) await db.from("abandoned_carts").update({ recovered: true }).eq("recovered", false).eq("email", d.email.toLowerCase());
    } catch { /* best effort */ }
    if (online) {
      const pay = await startPayment(created.id);
      return pay.ok ? { ok: true, id: created.id, payUrl: pay.url } : { ok: true, id: created.id };
    }
    if (d.email) await sendOrderEmail("placed", { email: d.email.toLowerCase(), name: d.name, orderNo: Number(created.order_no), total: priced.total, items: priced.lines.map((l) => `${l.name} x ${l.qty}`) });
    return { ok: true, id: created.id };
  } catch {
    return { ok: false, error: "Checkout is not available right now." };
  }
}
