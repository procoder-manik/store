"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

const idOnly = z.object({ id: z.string().uuid() });

/** Quick edits from the product list, so small changes need no page load. */
export async function quickProduct(fd: FormData) {
  const d = z.object({
    id: z.string().uuid(),
    name: z.string().trim().min(1, "Add a name").max(120),
    price: z.coerce.number().min(0).max(10_000_000),
    status: z.enum(["draft", "active", "archived"]),
  }).parse({ id: fd.get("id"), name: fd.get("name"), price: fd.get("price"), status: fd.get("status") });
  const { supabase } = await requireAdmin("product.quick");
  const { error } = await supabase.from("products").update({ name: d.name, base_price: d.price, status: d.status }).eq("id", d.id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
}

export async function setProductStatus(fd: FormData) {
  const d = z.object({ id: z.string().uuid(), status: z.enum(["draft", "active", "archived"]) }).parse({ id: fd.get("id"), status: fd.get("status") });
  const { supabase } = await requireAdmin("product.status");
  const { error } = await supabase.from("products").update({ status: d.status }).eq("id", d.id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
}

export async function setPageStatus(fd: FormData) {
  const d = z.object({ id: z.string().uuid(), status: z.enum(["draft", "active"]) }).parse({ id: fd.get("id"), status: fd.get("status") });
  const { supabase } = await requireAdmin("page.status");
  const { error } = await supabase.from("pages").update({ status: d.status }).eq("id", d.id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/pages");
  revalidatePath("/admin/landing-pages");
  revalidatePath("/", "layout");
}

export async function deleteProduct(fd: FormData) {
  const { id } = idOnly.parse({ id: fd.get("id") });
  const { supabase } = await requireAdmin("product.delete");
  // Archive instead of deleting, so past orders keep their product details.
  const { error } = await supabase.from("products").update({ status: "archived" }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
}

/** Copies a product from the list. The copy is a draft, so it can be edited before going live. */
export async function copyProduct(fd: FormData) {
  const { id } = idOnly.parse({ id: fd.get("id") });
  const { duplicateProduct } = await import("./actions");
  const r = await duplicateProduct(id);
  if (!r.ok) throw new Error(r.error);
  revalidatePath("/admin/products");
}
