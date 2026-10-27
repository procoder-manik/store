import "server-only";
import { SITE_URL, formatPrice } from "@/lib/config";
import { brandedEmail, fillTemplate } from "@/lib/email-html";
import { sendEmails } from "@/lib/email";
import { getPublicSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

export type AutoKey = "contact_received" | "contact_alert" | "welcome" | "order_placed" | "order_shipped" | "order_delivered";
export type AutoTpl = { enabled: boolean; subject: string; heading: string; body: string; buttonText: string; buttonUrl: string; imageUrl: string };
export type AutoDef = { key: AutoKey; label: string; when: string; vars: string[]; defaults: AutoTpl };

const T = (subject: string, heading: string, body: string, buttonText = "", buttonUrl = ""): AutoTpl => ({ enabled: true, subject, heading, body, buttonText, buttonUrl, imageUrl: "" });

export const AUTO_EMAILS: AutoDef[] = [
  { key: "contact_received", label: "Thank you for contacting us", when: "Sent to the person who fills in the Contact form.", vars: ["name", "message", "brand"], defaults: T("We received your message", "Thank you, {{name}}", "We received your message and will get back to you soon.\n\nYour message:\n{{message}}", "Visit the shop", "/shop") },
  { key: "contact_alert", label: "New contact message (to you)", when: "Sent to your store email (Settings, Contact) when someone writes to you.", vars: ["name", "phone", "email", "message", "brand"], defaults: T("New message from {{name}}", "New contact message", "From: {{name}}\nPhone: {{phone}}\nEmail: {{email}}\n\n{{message}}") },
  { key: "welcome", label: "Welcome to the email list", when: "Sent when someone joins your email list.", vars: ["brand"], defaults: T("Welcome to {{brand}}", "Welcome to {{brand}}", "Thank you for joining. We will send you new arrivals and offers, and nothing more than you would want in your inbox.", "See what is new", "/shop?tag=new") },
  { key: "order_placed", label: "Order received", when: "Sent right after a customer places an order (if they gave an email).", vars: ["name", "order_no", "total", "items", "payment", "invoice_line", "brand"], defaults: T("Order #{{order_no}} received", "Thank you, {{name}}", "We received order #{{order_no}} and will call you shortly to confirm it.\n\n{{items}}\n\n{{payment}}\n\n{{invoice_line}}", "Track your order", "/track") },
  { key: "order_shipped", label: "Order is on the way", when: "Sent when you mark an order as shipped.", vars: ["name", "order_no", "total", "payment_note", "courier", "invoice_line", "brand"], defaults: T("Order #{{order_no}} is on the way", "Your order is on the way", "Order #{{order_no}} has been handed to our delivery partner. {{payment_note}}\n\n{{courier}}\n\n{{invoice_line}}", "Track your order", "/track") },
  { key: "order_delivered", label: "Order delivered", when: "Sent when you mark an order as delivered.", vars: ["name", "order_no", "brand"], defaults: T("Order #{{order_no}} delivered", "Delivered, enjoy it", "Order #{{order_no}} has been delivered. Thank you for shopping with {{brand}}.", "Shop again", "/shop") },
];

/** Your saved wording, or the built-in wording where you have not changed it. */
export async function loadAutoEmails(): Promise<Record<AutoKey, AutoTpl>> {
  const out = Object.fromEntries(AUTO_EMAILS.map((d) => [d.key, { ...d.defaults }])) as Record<AutoKey, AutoTpl>;
  try {
    const { data } = await createAdminClient().from("site_settings").select("value").eq("key", "auto_emails").maybeSingle();
    const v = (data?.value ?? {}) as Partial<Record<AutoKey, Partial<AutoTpl>>>;
    for (const d of AUTO_EMAILS) if (v[d.key]) out[d.key] = { ...out[d.key], ...v[d.key] };
  } catch {
    // keep the built-in wording
  }
  return out;
}

export function renderAuto(t: AutoTpl, vars: Record<string, string>, brand: { name: string; logo: string }, opts: { unsubscribeUrl?: string } = {}) {
  const f = (s: string) => fillTemplate(s, vars);
  return {
    subject: f(t.subject),
    ...brandedEmail({ brand: brand.name, logo: brand.logo, siteUrl: SITE_URL, heading: f(t.heading), body: f(t.body), buttonText: t.buttonText || undefined, buttonUrl: t.buttonUrl || undefined, imageUrl: t.imageUrl || undefined, footer: `This email was sent by ${brand.name}.`, unsubscribeUrl: opts.unsubscribeUrl }),
  };
}

/** Sends one automatic email in your wording. Returns quietly if you switched it off. */
export async function sendAutoEmail(key: AutoKey, to: string, vars: Record<string, string>) {
  if (!to) return;
  const all = await loadAutoEmails();
  if (!all[key].enabled) return;
  const { brand } = await getPublicSettings();
  const m = renderAuto(all[key], { brand: brand.name, ...vars }, brand);
  await sendEmails([{ to, subject: m.subject, html: m.html, text: m.text }], key);
}

export const money = formatPrice;
