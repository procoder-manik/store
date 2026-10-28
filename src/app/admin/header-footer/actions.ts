"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { FOOTER_STYLES, HEADER_STYLES, type FooterStyleId, type HeaderStyleId } from "@/lib/layout-styles";

const url = z.string().trim().max(300).refine((v) => v === "" || v.startsWith("https://"), "Social links must start with https://");
const href = z.string().trim().max(200).refine((v) => v === "" || v.startsWith("/") || v.startsWith("https://"), "The button link must start with / or https://");
const schema = z.object({
  header: z.object({
    style: z.enum(HEADER_STYLES.map((s) => s.id) as [HeaderStyleId, ...HeaderStyleId[]]),
    sticky: z.boolean(), showSearch: z.boolean(), showAccount: z.boolean(), showWishlist: z.boolean(), showThemeToggle: z.boolean(), uppercaseMenu: z.boolean(),
    topBar: z.object({ enabled: z.boolean(), text: z.string().trim().max(120) }),
    cta: z.object({ label: z.string().trim().max(24), href }),
  }),
  footer: z.object({
    style: z.enum(FOOTER_STYLES.map((s) => s.id) as [FooterStyleId, ...FooterStyleId[]]),
    showPayments: z.boolean(), showTrust: z.boolean(),
    social: z.object({ facebook: url, instagram: url, youtube: url, tiktok: url }),
  }),
});

export async function saveLayoutStyle(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  if ((p.data.header.cta.label === "") !== (p.data.header.cta.href === "")) return { ok: false, error: "The header button needs both a label and a link, or leave both empty." };
  let ctx;
  try { ctx = await requireAdmin("layout.style"); } catch (e) { return { ok: false, error: (e as Error).message }; }
  // Saved under their own keys, so the menu editor (which saves "header" and "footer") never overwrites these.
  const { error } = await ctx.supabase.from("site_settings").upsert([
    { key: "header_style", value: p.data.header, is_public: true },
    { key: "footer_style", value: p.data.footer, is_public: true },
  ]);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
