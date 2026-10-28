"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { getAudience } from "@/lib/audience";
import { SITE_URL } from "@/lib/config";
import { getPublicSettings } from "@/lib/settings";
import { emailDesignSchema, legacyToDesign, renderEmailDesign, type EmailDesign } from "@/lib/email-builder";
import { getCatalog } from "@/lib/catalog";
import { emailConfigured, sendEmails, unsubUrl } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAllowedImageUrl } from "@/lib/utils";

const link = z.string().trim().max(300).refine((v) => v === "" || v.startsWith("/") || v.startsWith("https://"), "Links must start with / or https://");
const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Add a template name").max(80),
  subject: z.string().trim().min(1, "Add a subject line").max(150),
  heading: z.string().trim().min(1, "Add a heading").max(120),
  body: z.string().trim().min(1, "Write the email text").max(4000),
  buttonText: z.string().trim().max(40),
  buttonUrl: link,
  imageUrl: z.union([z.literal(""), z.string().max(500).refine(isAllowedImageUrl, "The image link must come from Pexels, Unsplash or Pixabay")]),
});

export async function saveTemplate(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const d = p.data;
  let ctx;
  try { ctx = await requireAdmin("email.template.save"); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const row = { name: d.name, subject: d.subject, heading: d.heading, body: d.body, button_text: d.buttonText || null, button_url: d.buttonUrl || null, image_url: d.imageUrl || null, updated_at: new Date().toISOString() };
  const q = ctx.supabase.from("email_templates");
  const { error } = d.id ? await q.update(row).eq("id", d.id) : await q.insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/emails");
  return { ok: true };
}

/** Saves an email made in the builder. */
export async function saveDesign(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const p = z.object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, "Add an email name").max(80),
    subject: z.string().trim().min(1, "Add a subject line").max(150),
    design: emailDesignSchema,
  }).safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const d = p.data;
  let ctx;
  try { ctx = await requireAdmin("email.design.save"); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const row = { name: d.name, subject: d.subject, heading: d.subject, body: "Designed email", button_text: null, button_url: null, image_url: null, blocks: d.design, updated_at: new Date().toISOString() };
  const q = ctx.supabase.from("email_templates");
  const { error } = d.id ? await q.update(row).eq("id", d.id) : await q.insert(row);
  if (error) return { ok: false, error: /blocks/.test(error.message) ? "Run supabase/migrations/0018_email_builder.sql in the Supabase SQL Editor, then try again." : error.message };
  revalidatePath("/admin/emails");
  return { ok: true };
}

export async function deleteTemplate(id: string) {
  const uuid = z.string().uuid().parse(id);
  const { supabase } = await requireAdmin("email.template.delete");
  await supabase.from("email_templates").delete().eq("id", uuid);
  revalidatePath("/admin/emails");
}

type Tpl = { id: string; name: string; subject: string; heading: string; body: string; button_text: string | null; button_url: string | null; image_url: string | null; blocks?: unknown };

/** The saved design, or a plain older template turned into blocks. */
function designOf(t: Tpl): EmailDesign {
  const p = emailDesignSchema.safeParse(t.blocks);
  return p.success ? p.data : legacyToDesign(t);
}

function render(t: Tpl, email: string, name: string, withUnsub: boolean, brand: string, logo: string, products: Awaited<ReturnType<typeof getCatalog>>["products"]) {
  const first = name.split(" ")[0] || "there";
  const fill = (s: string) => s.replace(/\{\{\s*name\s*\}\}/gi, first);
  return {
    subject: fill(t.subject),
    ...renderEmailDesign({ design: designOf(t), products, brand, logo, siteUrl: SITE_URL, firstName: first, unsubscribeUrl: withUnsub ? unsubUrl(email) : undefined }),
  };
}

export async function sendTest(id: string): Promise<{ ok: boolean; message: string }> {
  const uuid = z.string().uuid().parse(id);
  const { user } = await requireAdmin("email.test");
  if (!emailConfigured()) return { ok: false, message: "Add RESEND_API_KEY and EMAIL_FROM to .env.local first." };
  if (!user.email) return { ok: false, message: "Your account has no email." };
  const { data: t } = await createAdminClient().from("email_templates").select("*").eq("id", uuid).maybeSingle();
  if (!t) return { ok: false, message: "Template not found." };
  const [{ brand }, { products }] = await Promise.all([getPublicSettings(), getCatalog()]);
  const m = render(t as Tpl, user.email, "there", true, brand.name, brand.logo, products);
  const r = await sendEmails([{ to: user.email, subject: `[Test] ${m.subject}`, html: m.html, text: m.text }]);
  return r.sent ? { ok: true, message: `Test sent to ${user.email}.` } : { ok: false, message: r.error ?? "Could not send." };
}

const LIMIT = 500;

export async function sendCampaign(input: unknown): Promise<{ ok: boolean; message: string }> {
  const p = z.object({ templateId: z.string().uuid(), audience: z.enum(["subscribers", "customers", "vip"]) }).safeParse(input);
  if (!p.success) return { ok: false, message: "Choose a template and an audience." };
  await requireAdmin("email.campaign");
  if (!emailConfigured()) return { ok: false, message: "Add RESEND_API_KEY and EMAIL_FROM to .env.local first." };
  const db = createAdminClient();
  const { data: t } = await db.from("email_templates").select("*").eq("id", p.data.templateId).maybeSingle();
  if (!t) return { ok: false, message: "Template not found." };
  const people = await getAudience(db, p.data.audience);
  if (people.length === 0) return { ok: false, message: "Nobody with an email address is in this audience yet." };
  if (people.length > LIMIT) return { ok: false, message: `This audience has ${people.length} people. The limit for one send is ${LIMIT}.` };
  const [{ brand: b }, { products }] = await Promise.all([getPublicSettings(), getCatalog()]);
  const msgs = people.map((x) => { const m = render(t as Tpl, x.email, x.name, true, b.name, b.logo, products); return { to: x.email, subject: m.subject, html: m.html, text: m.text }; });
  const r = await sendEmails(msgs);
  await db.from("email_campaigns").insert({ template_id: t.id, name: (t as Tpl).name, audience: p.data.audience, sent_count: r.sent, failed_count: r.failed });
  revalidatePath("/admin/emails");
  return r.sent > 0 ? { ok: true, message: `Sent to ${r.sent} ${r.sent === 1 ? "person" : "people"}${r.failed ? `, ${r.failed} failed (${r.error ?? "unknown error"})` : ""}.` } : { ok: false, message: r.error ?? "Nothing was sent." };
}
