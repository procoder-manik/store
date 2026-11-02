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
