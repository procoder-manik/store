"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { AUTO_EMAILS, loadAutoEmails, renderAuto, type AutoKey } from "@/lib/auto-emails";
import { SAMPLE_VARS } from "@/lib/auto-sample";
import { emailConfigured, sendEmails } from "@/lib/email";
import { getPublicSettings } from "@/lib/settings";
import { isAllowedImageUrl } from "@/lib/utils";

const keys = AUTO_EMAILS.map((d) => d.key) as [AutoKey, ...AutoKey[]];
const link = z.string().trim().max(300).refine((v) => v === "" || v.startsWith("/") || v.startsWith("https://"), "Links must start with / or https://");
const schema = z.object({
  key: z.enum(keys),
  enabled: z.boolean(),
  subject: z.string().trim().min(1, "Add a subject line").max(150),
  heading: z.string().trim().min(1, "Add a heading").max(120),
  body: z.string().trim().min(1, "Write the email text").max(4000),
  buttonText: z.string().trim().max(40),
  buttonUrl: link,
  imageUrl: z.union([z.literal(""), z.string().max(500).refine(isAllowedImageUrl, "The image link must come from Pexels, Unsplash or Pixabay")]),
});

export async function saveAutoEmail(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  let ctx;
  try { ctx = await requireAdmin("email.auto.save"); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const { key, ...tpl } = p.data;
  const { data } = await ctx.supabase.from("site_settings").select("value").eq("key", "auto_emails").maybeSingle();
  const value = { ...((data?.value ?? {}) as object), [key]: tpl };
  const { error } = await ctx.supabase.from("site_settings").upsert({ key: "auto_emails", value, is_public: false, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/emails/automatic");
  return { ok: true };
}

export async function resetAutoEmail(key: string): Promise<{ ok: boolean }> {
  const k = z.enum(keys).parse(key);
  const { supabase } = await requireAdmin("email.auto.reset");
  const { data } = await supabase.from("site_settings").select("value").eq("key", "auto_emails").maybeSingle();
  const value = { ...((data?.value ?? {}) as Record<string, unknown>) };
  delete value[k];
  await supabase.from("site_settings").upsert({ key: "auto_emails", value, is_public: false, updated_at: new Date().toISOString() }, { onConflict: "key" });
  revalidatePath("/admin/emails/automatic");
  return { ok: true };
}

export async function sendAutoTest(input: unknown): Promise<{ ok: boolean; message: string }> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, message: p.error.issues[0].message };
  const { user } = await requireAdmin("email.auto.test");
  if (!emailConfigured()) return { ok: false, message: "Add RESEND_API_KEY and EMAIL_FROM to .env.local first, then restart the server." };
  if (!user.email) return { ok: false, message: "Your account has no email address." };
  const { brand } = await getPublicSettings();
  const { key: _k, ...tpl } = p.data;
  void _k;
  const all = await loadAutoEmails();
  const m = renderAuto({ ...all[p.data.key], ...tpl }, { ...SAMPLE_VARS, brand: brand.name }, brand);
  const r = await sendEmails([{ to: user.email, subject: `[Test] ${m.subject}`, html: m.html, text: m.text }], "test");
  return r.sent ? { ok: true, message: `Test sent to ${user.email}. Check your inbox and spam folder.` } : { ok: false, message: r.error ?? "Could not send." };
}
