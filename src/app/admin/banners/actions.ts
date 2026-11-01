"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { isAllowedImageUrl } from "@/lib/utils";

const when = z.string().max(20).transform((v) => (v ? new Date(v).toISOString() : null));
const schema = z.object({
  id: z.string().uuid().optional(),
  slot: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,40}$/, "A group name can use only letters, numbers and dashes, like eid-offer."),
  design: z.enum(["image", "river", "dusk", "gold", "ink", "sand"]),
  title: z.string().trim().max(80),
  subtitle: z.string().trim().max(160),
  image: z.union([z.literal(""), z.string().max(500).refine(isAllowedImageUrl, "The image link must come from your uploads, Pexels, Unsplash or Pixabay")]),
  link: z.string().trim().max(200).refine((v) => v === "" || v.startsWith("/") || v.startsWith("https://"), "The link must start with / or https://"),
  button: z.string().trim().max(30),
  sort: z.coerce.number().int().min(0).max(999),
  starts_at: when,
  ends_at: when,
});

export async function saveBanner(fd: FormData): Promise<{ ok: boolean; error?: string }> {
  const picked = String(fd.get("slot") ?? "home");
  const r = schema.safeParse({
    id: fd.get("id") || undefined,
    slot: picked === "custom" ? String(fd.get("customSlot") ?? "") : picked,
    design: fd.get("design"), title: fd.get("title") ?? "", subtitle: fd.get("subtitle") ?? "", image: fd.get("image") ?? "", link: fd.get("link") ?? "", button: fd.get("button") ?? "", sort: fd.get("sort") || 0,
    starts_at: fd.get("startsAt") ?? "", ends_at: fd.get("endsAt") ?? "",
  });
  if (!r.success) return { ok: false, error: r.error.issues[0].message };
  const { id, ...d } = r.data;
  // A picture with no words can only be shown as a picture, whichever design was left selected.
  if (d.image && !d.title) d.design = "image";
  if (d.design === "image" && !d.image) return { ok: false, error: "Add a picture, or choose a ready-made design and type a title." };
  if (d.design !== "image" && !d.title) return { ok: false, error: "Type a title for this design, or add a picture." };
  let supabase;
  try { ({ supabase } = await requireAdmin(id ? "banner.update" : "banner.create")); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const row = { ...d, title: d.title, subtitle: d.subtitle || null, image: d.image || null, link: d.link || null, button: d.button || null };
  const { error } = id ? await supabase.from("banners").update(row).eq("id", id) : await supabase.from("banners").insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleBanner(fd: FormData) {
  const id = z.string().uuid().parse(fd.get("id"));
  const { supabase } = await requireAdmin("banner.toggle");
  await supabase.from("banners").update({ active: fd.get("active") !== "true" }).eq("id", id);
  revalidatePath("/", "layout");
}

export async function deleteBanner(fd: FormData) {
  const id = z.string().uuid().parse(fd.get("id"));
  const { supabase } = await requireAdmin("banner.delete");
  await supabase.from("banners").delete().eq("id", id);
  revalidatePath("/", "layout");
}
