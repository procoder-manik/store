import "server-only";
import { SITE_URL, formatPrice } from "@/lib/config";
import { getPublicSettings } from "@/lib/settings";
import { brandedEmail } from "@/lib/email-html";
import { emailConfigured, sendEmails } from "@/lib/email";

type Info = { email: string; name: string; orderNo: number; total: number; items?: string[]; paid?: boolean; courier?: string; trackingCode?: string };

/** Order emails use the same branded layout as campaigns. Failures are swallowed so ordering never breaks. */
export async function sendOrderEmail(kind: "placed" | "shipped" | "delivered", o: Info) {
  if (!o.email || !emailConfigured()) return;
  const brand = (await getPublicSettings()).brand.name;
  const first = o.name.split(" ")[0];
  const copy = {
    placed: { subject: `Order #${o.orderNo} received`, heading: `Thank you, ${first}`, body: `We received order #${o.orderNo} and will call you shortly to confirm it.\n\n${(o.items ?? []).map((i) => `- ${i}`).join("\n")}\n\n${o.paid ? `Paid online: ${formatPrice(o.total)}` : `Total to pay on delivery: ${formatPrice(o.total)}`}`, button: "Track your order" },
    shipped: { subject: `Order #${o.orderNo} is on the way`, heading: "Your order is on the way", body: `Order #${o.orderNo} has been handed to our delivery partner. ${o.paid ? "Your payment is already received." : `Please keep ${formatPrice(o.total)} ready to pay on delivery.`}${o.courier ? `\n\nCourier: ${o.courier}${o.trackingCode ? `, tracking number ${o.trackingCode}` : ""}.` : ""}`, button: "Track your order" },
    delivered: { subject: `Order #${o.orderNo} delivered`, heading: "Delivered, enjoy it", body: `Order #${o.orderNo} has been delivered. Thank you for shopping with ${brand}.`, button: "Shop again" },
  }[kind];
  const { html, text } = brandedEmail({ brand, heading: copy.heading, body: copy.body, buttonText: copy.button, buttonUrl: kind === "delivered" ? "/shop" : "/track", siteUrl: SITE_URL, footer: `This is an order update from ${brand}.` });
  try { await sendEmails([{ to: o.email, subject: copy.subject, html, text }]); } catch { /* never block orders */ }
}
