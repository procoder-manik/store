import { NextResponse } from "next/server";
import { mfaRequired } from "@/lib/admin";
import { formatPrice } from "@/lib/config";
import { getPublicSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!p || !["staff", "manager", "super_admin"].includes(p.role)) return new NextResponse("Forbidden", { status: 403 });
  if (mfaRequired()) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") return new NextResponse("Two-step verification required", { status: 403 });
  }
  const { data: o } = await supabase.from("orders").select("*, order_items(name_snapshot, unit_price, qty)").eq("id", id).maybeSingle();
  if (!o) return new NextResponse("Not found", { status: 404 });
  const { brand } = await getPublicSettings();
  const a = (o.shipping_address ?? {}) as { district?: string; address?: string };
  const items = o.order_items as { name_snapshot: string; unit_price: number | string; qty: number }[];
  const due = o.payment_status === "paid" ? 0 : Number(o.total);

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Invoice #${esc(o.order_no)}</title><meta name="robots" content="noindex">
<style>
*{box-sizing:border-box}body{font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#15171c;margin:0;padding:32px;max-width:780px;margin-inline:auto;font-size:14px}
h1{font-size:26px;margin:0}h2{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin:0 0 6px}
.row{display:flex;justify-content:space-between;gap:24px;margin-bottom:28px}table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:12px;color:#6b7280;border-bottom:2px solid #15171c;padding:8px 0}td{padding:10px 0;border-bottom:1px solid #e3e6eb}
.r{text-align:right}.tot td{border:0;padding:4px 0}.big td{font-size:17px;font-weight:700;padding-top:10px;border-top:2px solid #15171c}
.due{margin-top:18px;padding:14px;border:2px solid #15171c;border-radius:10px;font-size:16px;font-weight:700}
button{margin-bottom:20px;padding:10px 18px;border-radius:999px;border:1px solid #15171c;background:#fff;font-size:14px;cursor:pointer}
@media print{button{display:none}body{padding:0}}
</style></head><body>
<button onclick="window.print()">Print</button>
<div class="row"><div><h1>${esc(brand.name)}</h1><p style="margin:4px 0 0;color:#6b7280">Invoice and packing slip</p></div><div class="r"><h2>Order</h2><strong>#${esc(o.order_no)}</strong><br>${esc(new Date(o.created_at).toLocaleDateString("en-GB", { dateStyle: "long" }))}</div></div>
<div class="row"><div><h2>Deliver to</h2><strong>${esc(o.guest_name)}</strong><br>${esc(o.guest_phone)}<br>${esc(a.address)}<br>${esc(a.district)}</div><div class="r"><h2>Payment</h2>${o.payment_method === "sslcommerz" ? "Online" : "Cash on delivery"}<br>${esc(o.payment_status)}${o.courier ? `<br><br><h2>Courier</h2>${esc(o.courier)}${o.tracking_code ? `<br>${esc(o.tracking_code)}` : ""}` : ""}</div></div>
<table><thead><tr><th>Item</th><th class="r">Price</th><th class="r">Qty</th><th class="r">Total</th></tr></thead><tbody>
${items.map((i) => `<tr><td>${esc(i.name_snapshot)}</td><td class="r">${esc(formatPrice(Number(i.unit_price)))}</td><td class="r">${esc(i.qty)}</td><td class="r">${esc(formatPrice(Number(i.unit_price) * i.qty))}</td></tr>`).join("")}
</tbody></table>
<table class="tot" style="margin-top:12px;width:280px;margin-left:auto"><tr><td>Subtotal</td><td class="r">${esc(formatPrice(Number(o.subtotal)))}</td></tr><tr><td>Delivery</td><td class="r">${esc(formatPrice(Number(o.shipping_fee)))}</td></tr>${Number(o.discount) > 0 ? `<tr><td>Discount</td><td class="r">-${esc(formatPrice(Number(o.discount)))}</td></tr>` : ""}<tr class="big"><td>Total</td><td class="r">${esc(formatPrice(Number(o.total)))}</td></tr></table>
<div class="due">${due > 0 ? `Cash to collect on delivery: ${esc(formatPrice(due))}` : "Paid. Nothing to collect."}</div>
${o.note ? `<p style="margin-top:18px"><strong>Customer note:</strong> ${esc(o.note)}</p>` : ""}
</body></html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'" } });
}
