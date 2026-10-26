"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

export async function createBundle(fd: FormData) {
  const p = z.object({
    name: z.string().trim().min(1, "Add a bundle name").max(80),
    percent: z.coerce.number().gt(0, "Discount must be above 0").max(90, "Discount cannot be above 90"),
    ids: z.array(z.string().uuid()).min(2, "Choose 2 to 4 products").max(4, "Choose 2 to 4 products"),
  }).safeParse({ name: fd.get("name"), percent: fd.get("percent"), ids: fd.getAll("p") });
  if (!p.success) throw new Error(p.error.issues[0].message);
  const { supabase } = await requireAdmin("bundle.create");
  const { error } = await supabase.from("bundles").insert({ name: p.data.name, discount_percent: p.data.percent, product_ids: [...new Set(p.data.ids)] });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/bundles");
  revalidatePath("/", "layout");
}

export async function toggleBundle(fd: FormData) {
  const id = z.string().uuid().parse(fd.get("id"));
  const { supabase } = await requireAdmin("bundle.toggle");
  await supabase.from("bundles").update({ active: fd.get("active") !== "true" }).eq("id", id);
  revalidatePath("/admin/bundles");
  revalidatePath("/", "layout");
}

export async function deleteBundle(fd: FormData) {
  const id = z.string().uuid().parse(fd.get("id"));
  const { supabase } = await requireAdmin("bundle.delete");
  await supabase.from("bundles").delete().eq("id", id);
  revalidatePath("/admin/bundles");
  revalidatePath("/", "layout");
}
