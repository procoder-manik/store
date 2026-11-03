"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

const blankNull = (v: unknown) => (v === "" || v == null ? null : v);
const percentOk = (c: { type: string; value: number }) => c.type !== "percent" || c.value <= 100;
const percentMsg = { message: "A percent coupon cannot be above 100" };

// The rules a coupon carries, shared by the add and the edit forms. The code is set once and not changed later.
const rules = {
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().gt(0).max(10_000_000),
  min_subtotal: z.coerce.number().min(0).max(10_000_000),
  max_uses: z.preprocess(blankNull, z.coerce.number().int().min(1).max(10_000_000).nullable()),
  starts_at: z.preprocess(blankNull, z.string().max(30).nullable()),
  ends_at: z.preprocess(blankNull, z.string().max(30).nullable()),
};
const coupon = z.object({ code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Code needs 3 to 30 letters, numbers, dashes or underscores"), ...rules }).refine(percentOk, percentMsg);
const editable = z.object(rules).refine(percentOk, percentMsg);

// A date box gives the day; a start begins at 00:00 and an end runs to the last second of that day.
const dayStart = (d: string | null) => (d ? new Date(`${d}T00:00:00`).toISOString() : null);
const dayEnd = (d: string | null) => (d ? new Date(`${d}T23:59:59`).toISOString() : null);

export async function createCoupon(formData: FormData) {
  const d = coupon.parse({
    code: formData.get("code"), type: formData.get("type"), value: formData.get("value"),
    min_subtotal: formData.get("min_subtotal") || 0, max_uses: formData.get("max_uses"), starts_at: formData.get("starts_at"), ends_at: formData.get("ends_at"),
  });
  const { supabase } = await requireAdmin("coupon.create");
  const { error } = await supabase.from("coupons").insert({ ...d, starts_at: dayStart(d.starts_at), ends_at: dayEnd(d.ends_at) });
  if (error) throw new Error(error.code === "23505" ? "That coupon code already exists" : error.message);
  revalidatePath("/admin/coupons");
}

export async function updateCoupon(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const d = editable.parse({
    type: formData.get("type"), value: formData.get("value"), min_subtotal: formData.get("min_subtotal") || 0,
    max_uses: formData.get("max_uses"), starts_at: formData.get("starts_at"), ends_at: formData.get("ends_at"),
  });
  const { supabase } = await requireAdmin("coupon.update");
  const { error } = await supabase.from("coupons").update({ type: d.type, value: d.value, min_subtotal: d.min_subtotal, max_uses: d.max_uses, starts_at: dayStart(d.starts_at), ends_at: dayEnd(d.ends_at) }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
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

/** Puts a coupon on the public Offers page, or takes it off. All other coupons stay private. */
export async function toggleOfferCoupon(formData: FormData) {
  const code = z.string().regex(/^[A-Z0-9_-]{3,30}$/).parse(formData.get("code"));
  const { supabase } = await requireAdmin("coupon.offers-page");
  const { data } = await supabase.from("site_settings").select("value").eq("key", "offers").maybeSingle();
  const cur = ((data?.value ?? {}) as { coupons?: string[] }).coupons ?? [];
  const coupons = cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code];
  const { error } = await supabase.from("site_settings").upsert({ key: "offers", value: { coupons }, is_public: true });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  revalidatePath("/admin/coupons");
}
