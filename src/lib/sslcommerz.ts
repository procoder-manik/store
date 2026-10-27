import "server-only";
import { SITE_URL } from "@/lib/config";
import { sendOrderEmail } from "@/lib/order-emails";
import { createAdminClient } from "@/lib/supabase/admin";

export const sslConfigured = () => !!(process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD);
const base = () => (process.env.SSLCOMMERZ_LIVE === "true" ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com");

type OrderRow = {
  id: string; order_no: number; total: number | string; status: string; payment_method: string | null; payment_status: string;
  guest_name: string; guest_phone: string; guest_email: string | null; shipping_address: { district?: string; address?: string } | null;
};

/** Opens a payment session for an unpaid online order and returns the gateway page to send the customer to. */
export async function startPayment(orderId: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!sslConfigured()) return { ok: false, error: "Online payment is not available right now." };
  const db = createAdminClient();
  const { data } = await db.from("orders").select("id, order_no, total, status, payment_method, payment_status, guest_name, guest_phone, guest_email, shipping_address").eq("id", orderId).maybeSingle();
  const o = data as OrderRow | null;
  if (!o || o.payment_method !== "sslcommerz" || o.payment_status !== "unpaid" || o.status !== "pending") return { ok: false, error: "This order cannot be paid online." };

  const amount = Number(o.total).toFixed(2);
  const tranId = `${o.order_no}-${Date.now().toString(36)}`;
  const { error: insErr } = await db.from("payments").insert({ order_id: o.id, tran_id: tranId, amount });
  if (insErr) return { ok: false, error: "Could not start the payment. Please try again." };

  const host = new URL(SITE_URL).hostname;
  const addr = o.shipping_address?.address ?? "Bangladesh";
  const district = o.shipping_address?.district ?? "Dhaka";
  const body = new URLSearchParams({
    store_id: process.env.SSLCOMMERZ_STORE_ID as string,
    store_passwd: process.env.SSLCOMMERZ_STORE_PASSWORD as string,
    total_amount: amount, currency: "BDT", tran_id: tranId,
    success_url: `${SITE_URL}/api/pay/sslcommerz/success`,
    fail_url: `${SITE_URL}/api/pay/sslcommerz/fail`,
    cancel_url: `${SITE_URL}/api/pay/sslcommerz/cancel`,
    ipn_url: `${SITE_URL}/api/pay/sslcommerz/ipn`,
    cus_name: o.guest_name, cus_email: o.guest_email || `orders@${host}`, cus_add1: addr, cus_city: district, cus_state: district,
    cus_postcode: "1000", cus_country: "Bangladesh", cus_phone: o.guest_phone,
    shipping_method: "Courier", ship_name: o.guest_name, ship_add1: addr, ship_city: district, ship_state: district, ship_postcode: "1000", ship_country: "Bangladesh",
    num_of_item: "1", product_name: `Order #${o.order_no}`, product_category: "General", product_profile: "physical-goods",
  });
  try {
    const res = await fetch(`${base()}/gwprocess/v4/api.php`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
    const j = (await res.json()) as { status?: string; GatewayPageURL?: string };
    if (j.status === "SUCCESS" && j.GatewayPageURL && j.GatewayPageURL.startsWith("https://")) return { ok: true, url: j.GatewayPageURL };
  } catch {
    // handled below
  }
  await db.from("payments").update({ status: "failed", updated_at: new Date().toISOString() }).eq("tran_id", tranId);
  return { ok: false, error: "The payment page could not be opened. Please try again, or choose cash on delivery." };
}

type Validation = { status?: string; tran_id?: string; amount?: string; currency_type?: string; risk_level?: string; card_type?: string; bank_tran_id?: string; card_issuer?: string; store_amount?: string };

/**
 * Confirms a payment with the gateway itself. Nothing the browser sends is trusted:
 * the amount, currency and transaction id must match what we saved when the session was opened.
 */
export async function settle(tranId: string, valId: string): Promise<{ orderId: string; paid: boolean; review?: boolean } | null> {
  if (!tranId || !valId || !sslConfigured()) return null;
  const db = createAdminClient();
  const { data: p } = await db.from("payments").select("id, order_id, amount, status").eq("tran_id", tranId).maybeSingle();
  if (!p) return null;
  if (p.status === "paid") return { orderId: p.order_id as string, paid: true };

  let v: Validation = {};
  try {
    const url = `${base()}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${encodeURIComponent(process.env.SSLCOMMERZ_STORE_ID as string)}&store_passwd=${encodeURIComponent(process.env.SSLCOMMERZ_STORE_PASSWORD as string)}&format=json`;
    v = (await (await fetch(url, { cache: "no-store" })).json()) as Validation;
  } catch {
    return { orderId: p.order_id as string, paid: false };
  }

  const good = (v.status === "VALID" || v.status === "VALIDATED") && v.tran_id === tranId && Math.abs(Number(v.amount) - Number(p.amount)) < 0.01 && (!v.currency_type || v.currency_type === "BDT");
  if (!good) {
    await db.from("payments").update({ status: "failed", val_id: valId, updated_at: new Date().toISOString() }).eq("id", p.id).eq("status", "initiated");
    return { orderId: p.order_id as string, paid: false };
  }

  const info = { card_type: v.card_type, bank_tran_id: v.bank_tran_id, card_issuer: v.card_issuer, risk_level: v.risk_level, store_amount: v.store_amount };
  if (v.risk_level === "1") {
    await db.from("payments").update({ status: "review", val_id: valId, method: v.card_type ?? null, raw: info, updated_at: new Date().toISOString() }).eq("id", p.id);
    await db.from("order_events").insert({ order_id: p.order_id, status: "pending", note: "Online payment was flagged as risky by the gateway. Check it in your SSLCommerz panel before confirming." });
    return { orderId: p.order_id as string, paid: false, review: true };
  }

  await db.from("payments").update({ status: "paid", val_id: valId, method: v.card_type ?? null, raw: info, updated_at: new Date().toISOString() }).eq("id", p.id);
  await db.from("orders").update({ payment_status: "paid" }).eq("id", p.order_id).eq("payment_status", "unpaid");
  await db.rpc("set_order_status", { p_order: p.order_id, p_status: "confirmed", p_actor: null, p_note: `Paid online${v.card_type ? ` (${v.card_type})` : ""}` });

  const { data: o } = await db.from("orders").select("order_no, total, guest_name, guest_email, order_items(name_snapshot, qty)").eq("id", p.order_id).maybeSingle();
  if (o?.guest_email) await sendOrderEmail("placed", { email: o.guest_email as string, name: o.guest_name as string, orderId: p.order_id as string, orderNo: Number(o.order_no), total: Number(o.total), paid: true, items: (o.order_items as { name_snapshot: string; qty: number }[]).map((i) => `${i.name_snapshot} x ${i.qty}`) });
  return { orderId: p.order_id as string, paid: true };
}

export async function markUnfinished(tranId: string, status: "failed" | "cancelled"): Promise<string | null> {
  if (!tranId) return null;
  const db = createAdminClient();
  const { data: p } = await db.from("payments").select("id, order_id").eq("tran_id", tranId).maybeSingle();
  if (!p) return null;
  await db.from("payments").update({ status, updated_at: new Date().toISOString() }).eq("id", p.id).eq("status", "initiated");
  return p.order_id as string;
}
