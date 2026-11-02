import { cache } from "react";
import { withRule } from "@/lib/free-delivery";
import { getPublicSettings } from "@/lib/settings";
import { createPublicClient } from "@/lib/supabase/public";
import type { Zone } from "@/components/QuickBuy";

/** Delivery areas, read once per request. */
export const getZones = cache(async (): Promise<Zone[]> => {
  const sb = createPublicClient();
  if (!sb) return [];
  const { data } = await sb.from("shipping_zones").select("id, name, fee, free_over").eq("active", true).order("sort").order("fee");
  const zones = (data ?? []).map((z) => ({ id: z.id as string, name: z.name as string, fee: Number(z.fee), freeOver: z.free_over == null ? null : Number(z.free_over) }));
  return withRule(zones, (await getPublicSettings()).freeDelivery);
});
