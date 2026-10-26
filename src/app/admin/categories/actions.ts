"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, slugify } from "@/lib/admin";

const idSchema = z.string().uuid();

export async function createCategory(formData: FormData) {
  const name = z.string().trim().min(1).max(80).parse(formData.get("name"));
  const { supabase } = await requireAdmin("category.create");
  const { error } = await supabase.from("categories").insert({ name, slug: slugify(name) });
  if (error) throw new Error(error.code === "23505" ? "A category with that name already exists" : error.message);
  revalidatePath("/admin/categories");
}

export async function toggleCategory(formData: FormData) {
  const id = idSchema.parse(formData.get("id"));
  const active = formData.get("active") === "true";
  const { supabase } = await requireAdmin("category.toggle");
  await supabase.from("categories").update({ active: !active }).eq("id", id);
  revalidatePath("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  const id = idSchema.parse(formData.get("id"));
  const { supabase } = await requireAdmin("category.delete");
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/categories");
}

export async function updateCategory(formData: FormData) {
  const d = z.object({ id: z.string().uuid(), name: z.string().trim().min(1, "Add a name").max(80), sort: z.coerce.number().int().min(0).max(999) }).parse({ id: formData.get("id"), name: formData.get("name"), sort: formData.get("sort") });
  const { supabase } = await requireAdmin("category.update");
  await supabase.from("categories").update({ name: d.name, sort: d.sort }).eq("id", d.id);
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}
