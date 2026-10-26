"use server";

import { z } from "zod";
import { requireStaff } from "@/lib/admin";
import { callAI } from "@/lib/ai";
import { rateLimit } from "@/lib/ratelimit";
import { getPublicSettings } from "@/lib/settings";

const schema = z.object({
  page: z.string().max(120),
  label: z.string().max(160),
  current: z.string().max(4000),
  kind: z.enum(["short", "long", "price"]),
  maxLength: z.number().int().min(1).max(10000).optional(),
  context: z.array(z.object({ label: z.string().max(160), value: z.string().max(400) })).max(30),
});

/** Writes or improves one admin field, using the other fields on the same form as context. */
export async function aiAssist(input: unknown): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: "Could not read this field." };
  let ctx;
  try { ctx = await requireStaff(); } catch (e) { return { ok: false, error: (e as Error).message }; }
  if (!(await rateLimit(`ai:${ctx.user.id}`, 60, 600))) return { ok: false, error: "You have used AI a lot in the last few minutes. Please wait a little." };
  const d = p.data;
  const brand = (await getPublicSettings()).brand.name;

  const system =
    `You fill in one field in the admin panel of "${brand}", an online store in Bangladesh selling clothing, bedding and covers, and home decor. ` +
    `Use the other fields on the form as context. Reply with only the value for the field: no quotes, no labels, no markdown. ` +
    `Match the language of the existing content (English if unsure). Never invent facts such as materials, sizes, certifications or numbers that the context does not support. No em dashes.`;
  const how = d.kind === "price"
    ? "Reply with only a whole number: a sensible retail price in Bangladeshi taka for this item in this market. No currency sign, no words."
    : d.kind === "long" ? "Write 1 to 3 short, clear paragraphs." : "Reply with one line.";
  const user =
    `Admin page: ${d.page}\nField: ${d.label}\nCurrent value: ${d.current || "(empty)"}\n` +
    `Other fields on this form:\n${d.context.map((c) => `- ${c.label}: ${c.value}`).join("\n") || "(none)"}\n\n` +
    `Task: ${d.current ? "Improve the current value" : "Write a good value"} for the field "${d.label}". ${how}${d.maxLength ? ` Keep it under ${d.maxLength} characters.` : ""}`;

  const r = await callAI(system, user, false);
  if (!r.ok) return r;
  let text = r.text.replace(/```[a-z]*|```/g, "").trim().replace(/^["'\u201c]|["'\u201d]$/g, "").trim();
  if (d.kind === "price") {
    const n = text.replace(/,/g, "").match(/\d+(\.\d+)?/);
    if (!n) return { ok: false, error: "The AI did not return a price. Try again." };
    text = String(Math.round(Number(n[0])));
  } else if (d.kind === "short") text = text.split("\n")[0].trim();
  if (d.maxLength) text = text.slice(0, d.maxLength);
  return text ? { ok: true, text } : { ok: false, error: "The AI returned nothing. Try again." };
}
