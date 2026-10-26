"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

const num = (max: number) => z.coerce.number().min(0).max(max);
const optNum = z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().min(0).max(10_000_000).nullable());

const zone = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(60), fee: num(100000), free_over: optNum });

export async function saveZone(formData: FormData) {
  const d = zone.parse({ id: formData.get("id") || undefined, name: formData.get("name"), fee: formData.get("fee"), free_over: formData.get("free_over") });
  const { supabase } = await requireAdmin("shipping.save");
  const row = { name: d.name, fee: d.fee, free_over: d.free_over };
  const { error } = d.id ? await supabase.from("shipping_zones").update(row).eq("id", d.id) : await supabase.from("shipping_zones").insert(row);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
}

export async function toggleZone(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const active = formData.get("active") === "true";
  const { supabase } = await requireAdmin("shipping.toggle");
  await supabase.from("shipping_zones").update({ active: !active }).eq("id", id);
  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
}

export async function deleteZone(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const { supabase } = await requireAdmin("shipping.delete");
  await supabase.from("shipping_zones").delete().eq("id", id);
  revalidatePath("/admin/shipping");
  revalidatePath("/checkout");
}
