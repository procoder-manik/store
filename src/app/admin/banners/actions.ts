"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function saveBanner(fd: FormData) {
  const picked = String(fd.get("slot") ?? "home");
  const r = schema.safeParse({
    id: fd.get("id") || undefined,
    slot: picked === "custom" ? String(fd.get("customSlot") ?? "") : picked,
    design: fd.get("design"), title: fd.get("title") ?? "", subtitle: fd.get("subtitle") ?? "", image: fd.get("image") ?? "", link: fd.get("link") ?? "", button: fd.get("button") ?? "", sort: fd.get("sort") || 0,
    starts_at: fd.get("startsAt") ?? "", ends_at: fd.get("endsAt") ?? "",
  });
  if (!r.success) throw new Error(r.error.issues[0].message);
  const { id, ...d } = r.data;
  if (d.design === "image" && !d.image) throw new Error("Add a picture, or choose one of the ready-made designs.");
  if (d.design !== "image" && !d.title) throw new Error("Ready-made designs need a title.");
  const { supabase } = await requireAdmin(id ? "banner.update" : "banner.create");
  const row = { ...d, title: d.title, subtitle: d.subtitle || null, image: d.image || null, link: d.link || null, button: d.button || null };
  const { error } = id ? await supabase.from("banners").update(row).eq("id", id) : await supabase.from("banners").insert(row);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/admin/banners");
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
