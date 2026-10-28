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
import { creditBalance, referrerFromCode, usableCredit } from "@/lib/credit";
import { getPublicSettings } from "@/lib/settings";
import { availableMethods } from "@/lib/payments";

/** How much store credit this signed-in person may spend on an order of this size. */
async function creditFor(wanted: boolean, totalBeforeCredit: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { credit: 0, balance: 0 };
  const balance = await creditBalance(user.id);
  return { credit: wanted ? usableCredit(balance, totalBeforeCredit) : 0, balance };
}

const cart = z.array(z.object({ productId: z.string().uuid("Demo products cannot be ordered"), variantId: z.string().uuid().optional(), qty: z.number().int().min(1).max(10) })).min(1, "Your cart is empty").max(30);

const quoteSchema = z.object({ items: cart, zoneId: z.string().uuid(), coupon: z.string().max(40).optional(), bump: z.boolean().optional(), useCredit: z.boolean().optional() });

export async function quoteOrder(input: unknown): Promise<Priced> {
  const p = quoteSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  if (!(await rateLimit(`quote:${await clientIp()}`, 120, 600))) return { ok: false, error: "Please slow down for a moment." };
  try {
    const priced = await priceCart(p.data.items, p.data.zoneId, p.data.coupon, p.data.bump);
    if (!priced.ok) return priced;
    const { credit, balance } = await creditFor(p.data.useCredit ?? false, priced.total);
    return { ...priced, total: priced.total - credit, creditUsed: credit, creditBalance: balance };
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
  paymentMethod: z.string().trim().max(20),
  payerNumber: z.string().trim().max(40).optional(),
  trxId: z.string().trim().max(40).optional(),
  useCredit: z.boolean().optional(),
  ref: z.string().trim().max(12).optional(),
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

  // The customer's choice is checked against what the store really offers. Nothing from the browser is trusted.
  const settings = await getPublicSettings();
  const method = availableMethods(settings.payments, { sslReady: sslConfigured() }).find((m) => m.id === d.paymentMethod);
  if (!method) return { ok: false, error: "That payment method is not available right now. Please choose another one." };
  const online = method.id === "sslcommerz";

  // Manual methods (bKash, Nagad, Rocket, Upay, bank): the customer sends the money, then tells us how to find it.
  let trxId = "";
  let payer = "";
  if (method.manual) {
    trxId = (d.trxId ?? "").replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z0-9]{6,24}$/.test(trxId)) return { ok: false, error: `Enter the transaction ID from your ${method.name} confirmation (letters and numbers only).` };
    if (method.id === "bank") payer = (d.payerNumber ?? "").slice(0, 40);
    else {
      payer = normalizePhone(d.payerNumber ?? "") ?? "";
      if (!payer) return { ok: false, error: `Enter the ${method.name} number you sent the money from, like 01712345678.` };
    }
  }

  try {
    if (online) await createAdminClient().rpc("expire_unpaid_orders"); // frees stock held by unpaid online orders
    if (method.manual) {
      const { count } = await createAdminClient().from("orders").select("id", { count: "exact", head: true }).eq("payment_trx_id", trxId);
      if ((count ?? 0) > 0) return { ok: false, error: "That transaction ID was already used on another order. Please check it, or call us." };
    }
    const priced = await priceCart(d.items, d.zoneId, d.coupon, d.bump);
    if (!priced.ok) return priced;
    if (d.coupon && !priced.couponCode) return { ok: false, error: priced.couponError ?? "That coupon code is not valid." };

    const h = await headers();
    const rawIp = (h.get("x-forwarded-for") ?? "").split(",")[0].trim();
    const ip = /^[0-9a-fA-F:.]{3,45}$/.test(rawIp) ? rawIp : "unknown";

    const { credit } = await creditFor(d.useCredit ?? false, priced.total);
    const total = priced.total - credit;
    const referrerId = d.ref ? await referrerFromCode(d.ref) : null;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    // Signed-in staff are testing their own store, so the "too many orders" speed limits do not apply to them.
    let staff = false;
    if (user) {
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      staff = ["staff", "manager", "super_admin"].includes(String(prof?.role));
    }

    const fraud = await checkFraud({ phone, ip, email: d.email.toLowerCase(), total });
    if (fraud.block && !(staff && fraud.reason !== "blacklist")) {
      // Customers always get the same vague message. The reason goes to the server log, and to staff.
      console.warn(`[order-blocked] reason=${fraud.reason} phone=***${phone.slice(-4)} ip=${ip}`);
      return { ok: false, error: staff ? `Blocked by fraud protection (${fraud.reason}). Customers only see a general message. See Admin > Fraud protection.` : GENERIC };
    }

    const db = createAdminClient();
    const { data, error } = await db.rpc("create_order", {
      o: {
        user_id: user?.id ?? "",
        name: d.name,
        phone,
        email: d.email.toLowerCase(),
        payment_method: method.id,
        subtotal: priced.subtotal,
        shipping_fee: priced.shipping,
        discount: priced.discount,
        total,
        credit_used: credit,
        referrer_id: referrerId ?? "",
        coupon_code: priced.couponCode ?? "",
        shipping_address: { district: d.district, address: d.address },
        risk_score: fraud.score,
        zone: priced.zoneName,
        ip,
        // The payment details are also kept in the note, so they are never lost even if the order columns are missing.
        note: [d.note, method.manual ? `${method.name} payment: TrxID ${trxId}${payer ? `, sent from ${payer}` : ""}` : ""].filter(Boolean).join(" | ").slice(0, 400),
      },
      items: priced.lines.map((l) => ({ product_id: l.productId, variant_id: l.variantId ?? "", name: l.name, unit_price: l.unitPrice, qty: l.qty })),
    });
    if (error) {
      if (error.message.includes("OUT_OF_STOCK")) return { ok: false, error: "Sorry, an item just sold out. Please review your cart." };
      if (error.message.includes("COUPON_UNAVAILABLE")) return { ok: false, error: "That coupon is no longer available." };
      if (error.message.includes("NO_CREDIT")) return { ok: false, error: "Your store credit changed. Please refresh the page and try again." };
      return { ok: false, error: "Something went wrong placing your order. Please try again." };
    }
    const created = data as { id: string; order_no: number };
    if (method.manual) {
      const { error: trxErr } = await db.from("orders").update({ payment_trx_id: trxId, payment_sender: payer }).eq("id", created.id);
      if (trxErr) console.error("[order] could not save the transaction id on the order. Run migration 0017.", trxErr.message);
    }
    try {
      await db.from("abandoned_carts").update({ recovered: true }).eq("recovered", false).eq("phone", phone);
      if (d.email) await db.from("abandoned_carts").update({ recovered: true }).eq("recovered", false).eq("email", d.email.toLowerCase());
    } catch { /* best effort */ }
    if (online) {
      const pay = await startPayment(created.id);
      return pay.ok ? { ok: true, id: created.id, payUrl: pay.url } : { ok: true, id: created.id };
    }
    if (d.email) await sendOrderEmail("placed", { email: d.email.toLowerCase(), name: d.name, orderId: created.id, orderNo: Number(created.order_no), total, items: priced.lines.map((l) => `${l.name} x ${l.qty}`) });
    return { ok: true, id: created.id };
  } catch {
    return { ok: false, error: "Checkout is not available right now." };
  }
}
