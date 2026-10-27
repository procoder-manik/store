"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { makeSlug } from "@/lib/slug";

const idSchema = z.string().uuid();

export async function createCategory(formData: FormData) {
  const name = z.string().trim().min(1).max(80).parse(formData.get("name"));
  const { supabase } = await requireAdmin("category.create");
  const { error } = await supabase.from("categories").insert({ name, slug: makeSlug("", name, "category") });
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
  const d = z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(1, "Add a name").max(80),
    sort: z.coerce.number().int().min(0).max(999),
    slug: z.string().trim().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "The address can only use lowercase letters, numbers and dashes"),
    description: z.string().trim().max(400),
  }).parse({ id: formData.get("id"), name: formData.get("name"), sort: formData.get("sort"), slug: formData.get("slug"), description: formData.get("description") ?? "" });
  const { supabase } = await requireAdmin("category.update");
  const { data: before } = await supabase.from("categories").select("slug").eq("id", d.id).maybeSingle();
  const { error } = await supabase.from("categories").update({ name: d.name, sort: d.sort, slug: d.slug, description: d.description || null }).eq("id", d.id);
  if (error) throw new Error(error.code === "23505" ? "Another category already uses that address" : error.message);
  if (before?.slug && before.slug !== d.slug) {
    await supabase.from("redirects").delete().eq("from_path", `/category/${d.slug}`);
    await supabase.from("redirects").upsert({ from_path: `/category/${before.slug}`, to_path: `/category/${d.slug}` }, { onConflict: "from_path" });
  }
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}
