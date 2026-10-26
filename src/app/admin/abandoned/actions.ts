"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { SITE_URL, formatPrice } from "@/lib/config";
import { getPublicSettings } from "@/lib/settings";
import { brandedEmail } from "@/lib/email-html";
import { emailConfigured, sendEmails, unsubUrl } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

type Item = { name: string; color: string; size: string; price: number; qty: number };

export async function sendReminder(fd: FormData) {
  const id = z.string().uuid().parse(fd.get("id"));
  await requireAdmin("abandoned.reminder");
  if (!emailConfigured()) throw new Error("Add RESEND_API_KEY and EMAIL_FROM to .env.local first.");
  const db = createAdminClient();
  const { data: c } = await db.from("abandoned_carts").select("*").eq("id", id).maybeSingle();
  if (!c?.email || c.recovered) throw new Error("This cart has no email or was already recovered.");
  const { data: out } = await db.from("email_optouts").select("email").eq("email", c.email).maybeSingle();
  if (out) throw new Error("This person unsubscribed from emails.");
  const items = c.items as Item[];
  const first = (c.name as string | null)?.split(" ")[0] ?? "there";
  const { html, text } = brandedEmail({
    brand: (await getPublicSettings()).brand.name, siteUrl: SITE_URL, heading: `You left something behind, ${first}`,
    body: `Your cart is saved.\n\n${items.map((i) => `- ${i.name}${[i.color, i.size].filter(Boolean).length ? ` (${[i.color, i.size].filter(Boolean).join(", ")})` : ""} x ${i.qty}`).join("\n")}\n\nTotal: ${formatPrice(Number(c.total))}. Pay in cash when it arrives.`,
    buttonText: "Finish my order", buttonUrl: `/restore/${c.id}`, unsubscribeUrl: unsubUrl(c.email),
  });
  const r = await sendEmails([{ to: c.email, subject: "Your cart is waiting", html, text }]);
  if (r.sent === 0) throw new Error(r.error ?? "The email could not be sent.");
  await db.from("abandoned_carts").update({ reminded_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/abandoned");
}

export async function dismissCart(fd: FormData) {
  const id = z.string().uuid().parse(fd.get("id"));
  const { supabase } = await requireAdmin("abandoned.dismiss");
  await supabase.from("abandoned_carts").update({ recovered: true }).eq("id", id);
  revalidatePath("/admin/abandoned");
}
