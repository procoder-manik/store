"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { isAllowedImageUrl } from "@/lib/utils";

const schema = z.object({
  title: z.string().trim().min(1, "Add a title").max(80),
  subtitle: z.string().trim().max(160),
  image: z.union([z.literal(""), z.string().max(500).refine(isAllowedImageUrl, "The image link must come from Pexels, Unsplash or Pixabay")]),
  link: z.string().trim().max(200).refine((v) => v === "" || v.startsWith("/") || v.startsWith("https://"), "The link must start with / or https://"),
  button: z.string().trim().max(30),
  sort: z.coerce.number().int().min(0).max(999),
});

export async function createBanner(fd: FormData) {
  const r = schema.safeParse({ title: fd.get("title"), subtitle: fd.get("subtitle"), image: fd.get("image"), link: fd.get("link"), button: fd.get("button"), sort: fd.get("sort") || 0 });
  if (!r.success) throw new Error(r.error.issues[0].message);
  const { supabase } = await requireAdmin("banner.create");
  const { error } = await supabase.from("banners").insert({ ...r.data, subtitle: r.data.subtitle || null, image: r.data.image || null, link: r.data.link || null, button: r.data.button || null });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
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
