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

const rule = z.object({
  enabled: z.boolean(),
  amount: z.coerce.number().min(0).max(10_000_000),
  zones: z.array(z.string().uuid()).max(200),
  endsAt: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Choose a valid last day"),
});

export async function saveFreeDelivery(formData: FormData) {
  const d = rule.parse({
    enabled: formData.get("enabled") === "on",
    amount: formData.get("amount") || 0,
    zones: formData.get("scope") === "some" ? formData.getAll("zones").map(String) : [],
    endsAt: formData.get("endsAt") ?? "",
  });
  if (d.enabled && d.amount <= 0) throw new Error("Enter the order amount that earns free delivery.");
  const { supabase } = await requireAdmin("shipping.free-delivery");
  const { error } = await supabase.from("site_settings").upsert({ key: "free_delivery", value: d, is_public: true });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
