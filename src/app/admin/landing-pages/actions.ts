"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { isAllowedImageUrl } from "@/lib/utils";

const schema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "The page address can only use lowercase letters, numbers and dashes"),
  title: z.string().trim().min(1, "Add a page name").max(120),
  productId: z.string().uuid("Choose a product"),
  headline: z.string().trim().min(1, "Add a headline").max(120),
  subheadline: z.string().trim().max(240),
  bullets: z.array(z.string().trim().min(1).max(120)).max(8),
  heroImage: z.union([z.literal(""), z.string().max(500).refine(isAllowedImageUrl, "The image link must come from Pexels, Unsplash or Pixabay")]),
  cta: z.string().trim().min(1, "Add button text").max(30),
  status: z.enum(["draft", "active"]),
  offers: z.array(z.object({ qty: z.number().int().min(1).max(20), price: z.number().gt(0).max(10_000_000), label: z.string().trim().max(40) })).min(1, "Add at least one offer").max(5),
}).refine((o) => new Set(o.offers.map((x) => x.qty)).size === o.offers.length, { message: "Each offer needs a different quantity" });

export async function saveLanding(input: unknown): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const d = p.data;
  let ctx;
  try { ctx = await requireAdmin("landing.save"); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const row = { slug: d.slug, title: d.title, product_id: d.productId, headline: d.headline, subheadline: d.subheadline || null, bullets: d.bullets, hero_image: d.heroImage || null, offers: d.offers, cta_text: d.cta, status: d.status, updated_at: new Date().toISOString() };
  const q = ctx.supabase.from("landing_pages");
  const { data, error } = d.id ? await q.update(row).eq("id", d.id).select("id").single() : await q.insert(row).select("id").single();
  if (error || !data) return { ok: false, error: error?.code === "23505" ? "That page address is already used." : error?.message ?? "Could not save" };
  revalidatePath("/admin/landing-pages");
  revalidatePath(`/lp/${d.slug}`);
  return { ok: true, id: data.id as string };
}

export async function deleteLanding(id: string) {
  const uuid = z.string().uuid().parse(id);
  const { supabase } = await requireAdmin("landing.delete");
  await supabase.from("landing_pages").delete().eq("id", uuid);
  revalidatePath("/admin/landing-pages");
}
