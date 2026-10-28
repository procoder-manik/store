"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/utils";
import { sendAutoEmail } from "@/lib/auto-emails";
import { getPublicSettings } from "@/lib/settings";
import { clientIp, rateLimit } from "@/lib/ratelimit";

type R = { ok: boolean; message: string };

export async function subscribe(input: unknown): Promise<R> {
  const p = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email").max(120), website: z.string() }).safeParse(input);
  if (!p.success) return { ok: false, message: p.error.issues[0].message };
  if (p.data.website) return { ok: true, message: "Thanks, you are on the list." };
  if (!(await rateLimit(`sub:${await clientIp()}`, 5, 600))) return { ok: false, message: "Too many tries. Please wait a few minutes." };
  try {
    const db = createAdminClient();
    const { error } = await db.from("leads").insert({ email: p.data.email, source: "newsletter" });
    if (error && error.code !== "23505") return { ok: false, message: "Could not save your email. Please try again." };
    await db.from("leads").update({ unsubscribed: false }).eq("email", p.data.email);
    await db.from("email_optouts").delete().eq("email", p.data.email);
    await welcome(p.data.email);
    return { ok: true, message: "Thanks, you are on the list." };
  } catch {
    return { ok: false, message: "Sign up is not available right now." };
  }
}

export async function chatLead(input: unknown): Promise<R> {
  const p = z.object({ name: z.string().trim().min(2, "Enter your name").max(80), phone: z.string().trim().max(20), message: z.string().trim().max(300) }).safeParse(input);
  if (!p.success) return { ok: false, message: p.error.issues[0].message };
  const phone = normalizePhone(p.data.phone);
  if (!phone) return { ok: false, message: "Enter a valid mobile number, like 01712345678." };
  if (!(await rateLimit(`lead:${await clientIp()}`, 5, 600))) return { ok: false, message: "Too many tries. Please wait a few minutes." };
  try {
    const { error } = await createAdminClient().from("leads").insert({ name: p.data.name, phone, source: "chatbot", notes: p.data.message || null });
    if (error) return { ok: false, message: "Could not save your details. Please try again." };
    return { ok: true, message: "Thank you. We will contact you soon." };
  } catch {
    return { ok: false, message: "Not available right now." };
  }
}

export async function sendContact(input: unknown): Promise<R> {
  const p = z.object({
    name: z.string().trim().min(2, "Enter your name").max(80),
    phone: z.string().trim().max(20),
    email: z.string().trim().toLowerCase().email("Enter a valid email so we can confirm your message").max(120),
    message: z.string().trim().min(10, "Write a few words so we can help").max(1000),
    website: z.string(),
  }).safeParse(input);
  if (!p.success) return { ok: false, message: p.error.issues[0].message };
  if (p.data.website) return { ok: true, message: "Thank you. We will get back to you soon." };
  const phone = normalizePhone(p.data.phone);
  if (!phone) return { ok: false, message: "Enter a valid mobile number, like 01712345678." };
  if (!(await rateLimit(`contact:${await clientIp()}`, 4, 600))) return { ok: false, message: "Too many messages. Please wait a few minutes." };
  try {
    const db = createAdminClient();
    let { error } = await db.from("leads").insert({ name: p.data.name, phone, email: p.data.email, source: "contact", notes: p.data.message });
    // The same person can write more than once. If their email is already saved as a lead, keep the message and put the email in the notes.
    if (error?.code === "23505") ({ error } = await db.from("leads").insert({ name: p.data.name, phone, source: "contact", notes: `Email: ${p.data.email}\n${p.data.message}` }));
    if (error) return { ok: false, message: process.env.NODE_ENV !== "production" ? `Could not save: ${error.message}. Open Admin, Health check.` : "Could not send your message. Please try again." };
    await notifyContact({ name: p.data.name, phone, email: p.data.email, message: p.data.message });
    return { ok: true, message: "Thank you. We will get back to you soon." };
  } catch (e) {
    console.error("[contact] could not send:", (e as Error).message);
    return { ok: false, message: process.env.NODE_ENV !== "production" ? `${(e as Error).message}. Open Admin, Health check.` : "Messages are not available right now. Please call us." };
  }
}

/** Thanks the sender and tells the store about the message, in the wording set under Email marketing, Automatic emails. */
async function notifyContact(m: { name: string; phone: string; email: string; message: string }) {
  try {
    const { contact } = await getPublicSettings();
    const vars = { name: m.name.split(" ")[0] || "there", phone: m.phone, email: m.email || "not given", message: m.message };
    if (m.email) await sendAutoEmail("contact_received", m.email, vars);
    if (contact.email) await sendAutoEmail("contact_alert", contact.email, { ...vars, name: m.name });
  } catch (e) {
    console.error("[email] contact email failed:", (e as Error).message);
  }
}

async function welcome(email: string) {
  try { await sendAutoEmail("welcome", email, {}); } catch (e) { console.error("[email] welcome email failed:", (e as Error).message); }
}
