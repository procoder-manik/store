import "server-only";
import { cache } from "react";
import { getPublicSettings } from "@/lib/settings";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublicCoupon = { code: string; type: "percent" | "fixed"; value: number; minSubtotal: number; endsAt: string | null };

/**
 * Only the coupons the owner marked for the Offers page, and only while they still work.
 * Coupons are private in the database, so this picks out named fields with the server's own access.
 */
export const getPublicCoupons = cache(async (): Promise<PublicCoupon[]> => {
  const { offers } = await getPublicSettings();
  if (!offers.coupons.length) return [];
  try {
    const { data } = await createAdminClient().from("coupons").select("code, type, value, min_subtotal, max_uses, used_count, starts_at, ends_at, active").in("code", offers.coupons);
    const now = Date.now();
    return (data ?? [])
      .filter((c) => c.active && (!c.starts_at || new Date(c.starts_at).getTime() <= now) && (!c.ends_at || new Date(c.ends_at).getTime() >= now) && (c.max_uses == null || c.used_count < c.max_uses))
      .map((c) => ({ code: c.code as string, type: c.type as PublicCoupon["type"], value: Number(c.value), minSubtotal: Number(c.min_subtotal), endsAt: (c.ends_at as string | null) ?? null }));
  } catch {
    return [];
  }
});

/**
 * True when a code names a store coupon that no longer works: switched off, not started, finished, or fully used.
 * A code that matches no coupon is left alone, so the storefront only hides codes it knows are dead.
 * Used to stop the popup from advertising a coupon customers can no longer redeem.
 */
export const couponDead = cache(async (code: string): Promise<boolean> => {
  const c = code.trim();
  if (!c) return false;
  try {
    const { data } = await createAdminClient().from("coupons").select("active, max_uses, used_count, starts_at, ends_at").ilike("code", c).limit(1).maybeSingle();
    if (!data) return false; // not one of the store's coupons — the owner may hand it out another way
    const now = Date.now();
    const usable = data.active && (!data.starts_at || new Date(data.starts_at as string).getTime() <= now) && (!data.ends_at || new Date(data.ends_at as string).getTime() >= now) && (data.max_uses == null || Number(data.used_count) < Number(data.max_uses));
    return !usable;
  } catch {
    return false; // on any error, keep showing it rather than hide a working offer
  }
});
