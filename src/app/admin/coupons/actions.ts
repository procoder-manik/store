"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

const blankNull = (v: unknown) => (v === "" || v == null ? null : v);

const coupon = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Code needs 3 to 30 letters, numbers, dashes or underscores"),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().gt(0).max(10_000_000),
  min_subtotal: z.coerce.number().min(0).max(10_000_000),
  max_uses: z.preprocess(blankNull, z.coerce.number().int().min(1).max(10_000_000).nullable()),
  ends_at: z.preprocess(blankNull, z.string().max(30).nullable()),
}).refine((c) => c.type !== "percent" || c.value <= 100, { message: "A percent coupon cannot be above 100" });

export async function createCoupon(formData: FormData) {
  const d = coupon.parse({
    code: formData.get("code"), type: formData.get("type"), value: formData.get("value"),
    min_subtotal: formData.get("min_subtotal") || 0, max_uses: formData.get("max_uses"), ends_at: formData.get("ends_at"),
  });
  const { supabase } = await requireAdmin("coupon.create");
  const { error } = await supabase.from("coupons").insert({ ...d, ends_at: d.ends_at ? new Date(`${d.ends_at}T23:59:59`).toISOString() : null });
  if (error) throw new Error(error.code === "23505" ? "That coupon code already exists" : error.message);
  revalidatePath("/admin/coupons");
}

export async function toggleCoupon(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const active = formData.get("active") === "true";
  const { supabase } = await requireAdmin("coupon.toggle");
  await supabase.from("coupons").update({ active: !active }).eq("id", id);
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const { supabase } = await requireAdmin("coupon.delete");
  await supabase.from("coupons").delete().eq("id", id);
  revalidatePath("/admin/coupons");
}
