import { paymentLabel } from "@/lib/payments";
import { code128 } from "@/lib/barcode";
import { formatPrice } from "@/lib/config";

export type InvoiceOrder = {
  id: string; order_no: number; created_at: string; guest_name: string; guest_phone: string; guest_email: string | null;
  shipping_address: { district?: string; address?: string } | null;
  subtotal: number | string; shipping_fee: number | string; discount: number | string; total: number | string;
  payment_method: string | null; payment_status: string; status: string; note: string | null; courier: string | null; tracking_code: string | null;
  order_items: { name_snapshot: string; unit_price: number | string; qty: number }[];
};
type Brand = { name: string; tagline?: string; logo?: string };
type Contact = { phone: string; email: string; address: string };

export const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (n: number | string) => esc(formatPrice(Number(n)));
export const invoiceNo = (n: number) => `INV-${n}`;
const logoTag = (b: Brand) => (b.logo && b.logo.startsWith("https://") ? `<img src="${esc(b.logo)}" alt="${esc(b.name)}" style="max-height:52px;max-width:200px;display:block">` : `<h1>${esc(b.name)}</h1>`);

const CSS = `*{box-sizing:border-box}body{font-family:-apple-system,"Segoe UI",Roboto,"Noto Sans Bengali","Hind Siliguri",Arial,sans-serif;color:#15171c;margin:0;font-size:14px}
h1{font-size:26px;margin:0}h2{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;margin:0 0 6px;font-weight:600}
.bar{display:flex;gap:10px;justify-content:center;padding:14px;background:#f5f6f8;border-bottom:1px solid #e3e6eb}
.bar button{padding:10px 20px;border-radius:999px;border:1px solid #15171c;background:#15171c;color:#fff;font-size:14px;cursor:pointer}
.bar button.alt{background:#fff;color:#15171c}
@media print{.bar{display:none}.page{box-shadow:none!important;margin:0!important}body{background:#fff}}`;

/** A clean invoice that customers and staff can print or save as a PDF from the browser. */
export function invoiceHtml(o: InvoiceOrder, brand: Brand, c: Contact): string {
  const a = o.shipping_address ?? {};
  const due = o.payment_status === "paid" ? 0 : Number(o.total);
  const online = o.payment_method === "sslcommerz";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(invoiceNo(o.order_no))}</title><style>${CSS}
body{background:#eceef2}.page{max-width:780px;margin:24px auto;background:#fff;padding:40px;box-shadow:0 4px 30px rgba(0,0,0,.08);border-radius:8px}
.row{display:flex;justify-content:space-between;gap:24px;margin-bottom:28px;flex-wrap:wrap}.r{text-align:right}
table{width:100%;border-collapse:collapse}th{text-align:left;font-size:12px;color:#6b7280;border-bottom:2px solid #15171c;padding:8px 0}td{padding:11px 0;border-bottom:1px solid #e3e6eb}
.tot{width:290px;margin-left:auto;margin-top:12px}.tot td{border:0;padding:4px 0}.tot .big td{font-size:17px;font-weight:700;padding-top:10px;border-top:2px solid #15171c}
.pill{display:inline-block;padding:3px 12px;border-radius:999px;font-size:12px;font-weight:600}.paid{background:#dcf5e7;color:#0f6b3a}.cod{background:#fff1d6;color:#8a5a00}
.due{margin-top:22px;padding:14px 16px;border:2px solid #15171c;border-radius:10px;font-size:16px;font-weight:700}
.foot{margin-top:30px;padding-top:16px;border-top:1px solid #e3e6eb;color:#6b7280;font-size:12px;text-align:center}
@media(max-width:600px){.page{padding:20px;margin:0;border-radius:0}.r{text-align:left}}</style></head><body>
<div class="bar"><button onclick="window.print()">Download or print (Save as PDF)</button></div>
<div class="page">
<div class="row"><div>${logoTag(brand)}${brand.tagline ? `<p style="margin:6px 0 0;color:#6b7280">${esc(brand.tagline)}</p>` : ""}<p style="margin:10px 0 0;color:#6b7280;font-size:13px;line-height:1.5">${[c.address, c.phone, c.email].filter(Boolean).map(esc).join("<br>")}</p></div>
<div class="r"><h2>Invoice</h2><strong style="font-size:20px">${esc(invoiceNo(o.order_no))}</strong><br>${esc(new Date(o.created_at).toLocaleDateString("en-GB", { dateStyle: "long" }))}<div style="margin-top:10px">${code128(invoiceNo(o.order_no), { height: 44, module: 1 })}</div></div></div>
<div class="row"><div><h2>Bill to</h2><strong>${esc(o.guest_name)}</strong><br>${esc(o.guest_phone)}${o.guest_email ? `<br>${esc(o.guest_email)}` : ""}<br>${esc(a.address)}${a.district ? `, ${esc(a.district)}` : ""}</div>
<div class="r"><h2>Payment</h2>${esc(online ? "Paid online" : paymentLabel(o.payment_method))}<br><span class="pill ${o.payment_status === "paid" ? "paid" : "cod"}">${o.payment_status === "paid" ? "PAID" : o.payment_method && o.payment_method !== "cod" && !online ? "PAYMENT BEING CHECKED" : "TO PAY ON DELIVERY"}</span>${o.courier ? `<br><br><h2>Courier</h2>${esc(o.courier)}${o.tracking_code ? `<br>${esc(o.tracking_code)}` : ""}` : ""}</div></div>
<table><thead><tr><th>Item</th><th class="r">Price</th><th class="r">Qty</th><th class="r">Total</th></tr></thead><tbody>
${o.order_items.map((i) => `<tr><td>${esc(i.name_snapshot)}</td><td class="r">${money(i.unit_price)}</td><td class="r">${esc(i.qty)}</td><td class="r">${money(Number(i.unit_price) * i.qty)}</td></tr>`).join("")}
</tbody></table>
<table class="tot"><tr><td>Subtotal</td><td class="r">${money(o.subtotal)}</td></tr><tr><td>Delivery</td><td class="r">${Number(o.shipping_fee) === 0 ? "Free" : money(o.shipping_fee)}</td></tr>${Number(o.discount) > 0 ? `<tr><td>Discount</td><td class="r">-${money(o.discount)}</td></tr>` : ""}<tr class="big"><td>Total</td><td class="r">${money(o.total)}</td></tr></table>
<div class="due">${due > 0 ? `Amount to pay on delivery: ${money(due)}` : "Paid in full. Nothing more to pay."}</div>
${o.note ? `<p style="margin-top:18px"><strong>Note:</strong> ${esc(o.note)}</p>` : ""}
<p class="foot">Thank you for shopping with ${esc(brand.name)}.</p>
</div></body></html>`;
}

/** A 100 x 150 mm parcel label with a barcode, the amount to collect and the customer details, so couriers need no extra work. */
export function labelHtml(orders: InvoiceOrder[], brand: Brand): string {
  const one = (o: InvoiceOrder) => {
    const a = o.shipping_address ?? {};
    const due = o.payment_status === "paid" ? 0 : Number(o.total);
    const items = o.order_items.map((i) => `${i.name_snapshot} x ${i.qty}`).join(", ");
    return `<section class="label">
<div class="top"><div>${brand.logo && brand.logo.startsWith("https://") ? `<img src="${esc(brand.logo)}" alt="" style="max-height:30px;max-width:130px">` : `<strong>${esc(brand.name)}</strong>`}</div><div class="r"><strong>${esc(invoiceNo(o.order_no))}</strong><br><small>${esc(new Date(o.created_at).toLocaleDateString("en-GB"))}</small></div></div>
<div class="cod ${due > 0 ? "" : "paid"}">${due > 0 ? `COD ${money(due)}` : "PAID"}</div>
<div class="to"><small>DELIVER TO</small><div class="name">${esc(o.guest_name)}</div><div class="phone">${esc(o.guest_phone)}</div><div>${esc(a.address)}${a.district ? `<br><strong>${esc(a.district)}</strong>` : ""}</div></div>
<div class="items"><small>ITEMS</small><div>${esc(items)}</div>${o.note ? `<div><small>NOTE</small> ${esc(o.note)}</div>` : ""}</div>
<div class="code">${code128(invoiceNo(o.order_no), { height: 54, module: 2 })}<div>${esc(invoiceNo(o.order_no))}${o.courier ? ` &middot; ${esc(o.courier)}${o.tracking_code ? ` ${esc(o.tracking_code)}` : ""}` : ""}</div></div>
</section>`;
  };
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Parcel labels</title><style>${CSS}
@page{size:100mm 150mm;margin:0}body{background:#eceef2}.wrap{display:grid;gap:16px;justify-content:center;padding:16px}
.label{width:100mm;height:150mm;background:#fff;border:1px solid #15171c;padding:6mm;display:flex;flex-direction:column;gap:3mm;page-break-after:always;overflow:hidden}
.top{display:flex;justify-content:space-between;align-items:flex-start;font-size:12px}.r{text-align:right}
.cod{font-size:26px;font-weight:800;border:3px solid #15171c;border-radius:6px;text-align:center;padding:2mm}.cod.paid{border-style:dashed}
.to{font-size:13px;line-height:1.35}.name{font-size:22px;font-weight:700;line-height:1.15}.phone{font-size:20px;font-weight:700;margin:1mm 0}
small{font-size:9px;color:#6b7280;letter-spacing:.06em}.items{font-size:12px;line-height:1.35;flex:1;overflow:hidden}
.code{text-align:center;font-size:12px}.code svg{max-width:100%;height:auto}
@media print{body{background:#fff}.wrap{padding:0;gap:0}.label{border:0;width:100mm;height:150mm}}</style></head><body>
<div class="bar"><button onclick="window.print()">Print ${orders.length} ${orders.length === 1 ? "label" : "labels"}</button></div>
<div class="wrap">${orders.map(one).join("")}</div></body></html>`;
}
