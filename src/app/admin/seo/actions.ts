"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { callAI } from "@/lib/ai";
import { getPublicSettings } from "@/lib/settings";

const out = z.object({ title: z.string(), description: z.string(), keyword: z.string() });
const sysPrompt = (brand: string) => `You write search listings for "${brand}", an online store in Bangladesh. Reply with one JSON object only. Never invent facts the product info does not support. Match the language of the product name. No em dashes.`;

type P = { id: string; name: string; kind: string; description: string | null; seo: { title?: string; description?: string; keyword?: string } | null };

async function seoFor(p: P): Promise<{ title: string; description: string; keyword: string } | string> {
  const user = `Product: ${p.name}\nType: ${p.kind}\nDescription: ${(p.description ?? "").slice(0, 700)}\n\nReturn JSON with keys: title (at most 60 characters, includes the product name), description (at most 155 characters, gives a reason to click), keyword (the main 2 to 4 word search phrase).`;
  const r = await callAI(sysPrompt((await getPublicSettings()).brand.name), user, true);
  if (!r.ok) return r.error;
  try {
    const o = out.parse(JSON.parse(r.text.replace(/^```(?:json)?|```$/gm, "").trim()));
    return { title: o.title.slice(0, 70), description: o.description.slice(0, 170), keyword: o.keyword.slice(0, 60) };
  } catch {
    return "The AI reply was not in the expected format. Try again.";
  }
}

export async function generateSeoFor(id: string): Promise<{ ok: true; title: string; description: string } | { ok: false; error: string }> {
  const uuid = z.string().uuid().parse(id);
  const { supabase } = await requireAdmin("seo.generate");
  const { data: p } = await supabase.from("products").select("id, name, kind, description, seo").eq("id", uuid).maybeSingle();
  if (!p) return { ok: false, error: "Product not found." };
  const r = await seoFor(p as P);
  if (typeof r === "string") return { ok: false, error: r };
  const { error } = await supabase.from("products").update({ seo: { ...((p as P).seo ?? {}), ...r }, updated_at: new Date().toISOString() }).eq("id", uuid);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/seo");
  revalidatePath("/", "layout");
  return { ok: true, title: r.title, description: r.description };
}

/** Fills missing listings a few at a time so each click stays quick. */
export async function bulkSeo(): Promise<{ ok: boolean; done: number; remaining: number; error?: string }> {
  const { supabase } = await requireAdmin("seo.bulk");
  const { data } = await supabase.from("products").select("id, name, kind, description, seo").order("created_at", { ascending: false });
  const missing = ((data ?? []) as P[]).filter((p) => !p.seo?.title || !p.seo?.description);
  const batch = missing.slice(0, 5);
  let done = 0, error: string | undefined;
  for (const p of batch) {
    const r = await seoFor(p);
    if (typeof r === "string") { error = r; break; }
    const { error: e } = await supabase.from("products").update({ seo: { ...(p.seo ?? {}), ...r } }).eq("id", p.id);
    if (e) { error = e.message; break; }
    done++;
  }
  revalidatePath("/admin/seo");
  revalidatePath("/", "layout");
  return { ok: !error, done, remaining: Math.max(0, missing.length - done), error };
}

export async function imagePrompts(id: string): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const uuid = z.string().uuid().parse(id);
  const { supabase } = await requireAdmin("seo.prompts");
  const { data: p } = await supabase.from("products").select("name, kind, description").eq("id", uuid).maybeSingle();
  if (!p) return { ok: false, error: "Product not found." };
  const r = await callAI(
    `You write prompts for AI image generators and photographers' briefs for online store product photos. Plain text only, no markdown, no em dashes.`,
    `Product: ${p.name} (${p.kind}). ${String(p.description ?? "").slice(0, 400)}\n\nWrite 3 short prompts, one per line, starting with a label: Studio (clean white background), Lifestyle (natural setting), Detail (close-up of fabric or material). Each prompt is one sentence and does not add features the product does not have.`,
    false,
  );
  return r.ok ? { ok: true, text: r.text.trim() } : { ok: false, error: r.error };
}
