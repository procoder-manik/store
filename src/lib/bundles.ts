import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type Bundle = { id: string; name: string; productIds: string[]; percent: number };

export const getBundles = cache(async (): Promise<Bundle[]> => {
  const sb = createPublicClient();
  if (!sb) return [];
  const { data, error } = await sb.from("bundles").select("id, name, product_ids, discount_percent").eq("active", true);
  if (error) return [];
  return (data ?? []).map((b) => ({ id: b.id as string, name: b.name as string, productIds: b.product_ids as string[], percent: Number(b.discount_percent) }));
});
