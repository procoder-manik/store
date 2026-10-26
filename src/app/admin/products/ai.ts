"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { getPublicSettings } from "@/lib/settings";
import { callAI } from "@/lib/ai";

const inputSchema = z.object({
  name: z.string().trim().min(2, "Type the product name first").max(120),
  kind: z.enum(["tee", "hoodie", "cover", "decor"]),
  categories: z.array(z.string().max(80)).max(50),
});

const outputSchema = z.object({
  kind: z.enum(["tee", "hoodie", "cover", "decor"]),
  categoryName: z.string().nullable(),
  slug: z.string(),
  description: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  colors: z.array(z.object({ name: z.string(), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) })).max(8),
  sizes: z.array(z.string()).max(10),
});

export type AiProduct = {
  kind: "tee" | "hoodie" | "cover" | "decor";
  categoryName: string | null;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  colors: { name: string; hex: string }[];
  sizes: string[];
};

export async function generateProductDetails(input: unknown): Promise<{ ok: true; data: AiProduct } | { ok: false; error: string }> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try { await requireAdmin(); } catch (e) { return { ok: false, error: (e as Error).message }; }

  const { name, kind, categories } = parsed.data;
  const brandName = (await getPublicSettings()).brand.name;
  const system =
    `You write product listings for "${brandName}", an online store selling clothing (T-shirts, hoodies), bedding and covers, and home decor in Bangladesh. ` +
    `Reply with one JSON object only, no markdown. Never invent materials, certifications or numbers that the product name does not imply. ` +
    `Write in the same language as the product name (English if unsure). No em dashes.`;
  const user =
    `Product name: ${name}\nCurrent type guess: ${kind}\nExisting categories: ${categories.join(", ") || "none"}\n\n` +
    `Return JSON with exactly these keys:\n` +
    `kind: one of tee, hoodie, cover, decor (best match)\n` +
    `categoryName: the best matching existing category name, or null\n` +
    `slug: lowercase url slug using a-z, 0-9 and dashes\n` +
    `description: 90 to 140 words, plain paragraphs, benefits first, no hype\n` +
    `seoTitle: at most 60 characters, includes the product name\n` +
    `seoDescription: at most 155 characters, includes a reason to click\n` +
    `colors: 3 to 5 likely colors as {name, hex}\n` +
    `sizes: sizes that suit this product type (S to XL for clothing, Single/Double/King for bedding, empty array for decor)`;

  const t = await callAI(system, user, true);
  if (!t.ok) return t;
  const text = t.text;

  try {
    const raw = JSON.parse(text.replace(/^```(?:json)?|```$/gm, "").trim());
    const out = outputSchema.parse(raw);
    return {
      ok: true,
      data: {
        ...out,
        slug: out.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120),
        description: out.description.slice(0, 2000),
        seoTitle: out.seoTitle.slice(0, 70),
        seoDescription: out.seoDescription.slice(0, 170),
        colors: out.colors.slice(0, 6),
        sizes: out.sizes.slice(0, 8).map((s) => s.slice(0, 20)),
      },
    };
  } catch {
    return { ok: false, error: "The AI reply was not in the expected format. Try again." };
  }
}

const fieldSchema = z.object({
  field: z.enum(["description", "seoTitle", "seoDescription", "slug", "colors", "sizes"]),
  name: z.string().trim().min(2, "Type the product name first").max(120),
  kind: z.enum(["tee", "hoodie", "cover", "decor"]),
  category: z.string().max(80),
  description: z.string().max(2000),
});

const FIELD_TASK: Record<string, string> = {
  description: "Write the product description: 90 to 140 words, plain paragraphs, benefits first, no hype.",
  seoTitle: "Write the SEO page title: at most 60 characters, includes the product name.",
  seoDescription: "Write the SEO meta description: at most 155 characters, includes a reason to click.",
  slug: "Write the URL slug: lowercase a-z, 0-9 and dashes only.",
  colors: "List 3 to 5 likely colors as Name:#hex pairs separated by commas, like Sage:#8fa88b, Ink:#23262d.",
  sizes: "List the sizes that suit this product type separated by commas (S, M, L, XL for clothing; Single, Double, King for bedding). For home decor reply with a single dash.",
};

/** Generates one field only, so each AI icon in the form fills exactly its own field. */
export async function generateField(input: unknown): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const parsed = fieldSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  try { await requireAdmin(); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const d = parsed.data;

  const brandName = (await getPublicSettings()).brand.name;
  const system =
    `You write product listings for "${brandName}", an online store selling clothing, bedding and covers, and home decor in Bangladesh. ` +
    `Reply with the requested text only: no quotes, no labels, no markdown. Never invent materials, certifications or numbers the product name does not imply. ` +
    `Write in the same language as the product name (English if unsure). No em dashes.`;
  const user =
    `Product name: ${d.name}\nType: ${d.kind}\nCategory: ${d.category || "none"}\n` +
    (d.description && d.field !== "description" ? `Description: ${d.description.slice(0, 800)}\n` : "") +
    `\nTask: ${FIELD_TASK[d.field]}`;

  const t = await callAI(system, user, false);
  if (!t.ok) return t;
  let out = t.text.replace(/```[a-z]*|```/g, "").trim().replace(/^["']|["']$/g, "").trim();

  if (d.field === "slug") out = out.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
  else if (d.field === "seoTitle") out = out.slice(0, 70);
  else if (d.field === "seoDescription") out = out.slice(0, 170);
  else if (d.field === "description") out = out.slice(0, 2000);
  else if (d.field === "colors") {
    const ok = out.split(",").map((x) => x.trim()).filter((x) => /^[^:]{1,40}:#[0-9a-fA-F]{6}$/.test(x));
    if (ok.length === 0) return { ok: false, error: "The AI reply was not in the expected format. Try again." };
    out = ok.slice(0, 6).join(", ");
  } else if (d.field === "sizes") {
    out = out === "-" ? "" : out.split(",").map((x) => x.trim().slice(0, 20)).filter(Boolean).slice(0, 8).join(", ");
  }
  return { ok: true, text: out };
}
