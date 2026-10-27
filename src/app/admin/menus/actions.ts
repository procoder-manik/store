"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { isLogoUrl } from "@/lib/utils";

const link = z.object({
  label: z.string().trim().min(1, "Every link needs a label").max(40),
  href: z.string().trim().max(200).refine((v) => v.startsWith("/") || v.startsWith("https://"), "Links must start with / or https://"),
});

const schema = z.object({
  brand: z.object({ name: z.string().trim().min(1, "Add a store name").max(40), tagline: z.string().trim().max(120), logo: z.union([z.literal(""), z.string().max(500).refine(isLogoUrl, "The logo must be uploaded here or come from Pexels, Unsplash or Pixabay")]) }),
  header: z.object({ links: z.array(link).max(8) }),
  footer: z.object({
    about: z.string().trim().max(240),
    columns: z.array(z.object({ title: z.string().trim().min(1, "Every footer column needs a title").max(30), links: z.array(link).max(8) })).max(4),
    copyright: z.string().trim().max(160),
    newsletter: z.boolean(),
  }),
});

export async function saveSite(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  let ctx;
  try { ctx = await requireAdmin("site.save"); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const { error } = await ctx.supabase.from("site_settings").upsert([
    { key: "brand", value: p.data.brand, is_public: true },
    { key: "header", value: p.data.header, is_public: true },
    { key: "footer", value: p.data.footer, is_public: true },
  ]);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
