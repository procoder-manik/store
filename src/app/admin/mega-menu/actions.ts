"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { isAllowedImageUrl } from "@/lib/utils";

const text = (max: number) => z.string().trim().max(max);
const href = z.string().trim().max(300).refine((v) => v === "" || v.startsWith("/") || v.startsWith("https://"), "Links must start with / or https://");
const link = z.object({ label: text(60).min(1, "Every link needs a name"), href: href.refine((v) => v !== "", "Every link needs an address") });
const image = z.union([z.literal(""), z.string().max(500).refine(isAllowedImageUrl, "The picture must be uploaded here or come from Pexels, Unsplash or Pixabay")]);
const id = z.string().max(40);

const column = z.discriminatedUnion("kind", [
  z.object({ id, kind: z.literal("links"), title: text(60), links: z.array(link).max(30) }),
  z.object({ id, kind: z.literal("categories"), title: text(60) }),
  z.object({ id, kind: z.literal("products"), title: text(60), source: z.enum(["pick", "category", "new", "hot", "bestseller", "sale", "preorder"]), ids: z.array(z.string().uuid()).max(12), category: text(80), count: z.number().int().min(1).max(8), style: z.enum(["rows", "cards"]) }),
  z.object({ id, kind: z.literal("promo"), title: text(80), text: text(160), image, button: text(30), link: href, code: text(30) }),
  z.object({ id, kind: z.literal("perks"), title: text(60), items: z.array(z.object({ icon: z.enum(["truck", "shield", "refresh", "headset", "gift", "card", "clock", "star"]), title: text(60).min(1, "Every promise needs a title"), text: text(100) })).max(6) }),
]);
const menu = z.object({
  id,
  label: text(40).min(1, "Every menu needs a name"),
  href: href.refine((v) => v !== "", "Every menu needs a link"),
  enabled: z.boolean(),
  columns: z.array(column).max(6, "A menu can hold up to 6 columns, or it gets too crowded."),
});
const schema = z.object({ menus: z.array(menu).max(12) });

export async function saveMegaMenu(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  try {
    const { supabase } = await requireAdmin("mega-menu.save");
    const { error } = await supabase.from("site_settings").upsert({ key: "mega_menu", value: p.data, is_public: true });
    if (error) return { ok: false, error: error.message };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
  revalidatePath("/", "layout");
  return { ok: true };
}
