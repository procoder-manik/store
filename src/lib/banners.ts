import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

import type { Banner, BannerDesign } from "@/lib/banner-config";

export * from "@/lib/banner-config";

export const getBanners = cache(async (): Promise<Banner[]> => {
  const sb = createPublicClient();
  if (!sb) return [];
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("banners")
    .select("id, title, subtitle, image, link, button, slot, design")
    .eq("active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("sort")
    .limit(40);
  if (error) return [];
  return (data ?? []).map((b) => ({ id: b.id as string, title: (b.title as string) ?? "", subtitle: (b.subtitle as string) ?? "", image: (b.image as string) ?? "", link: (b.link as string) ?? "", button: (b.button as string) ?? "", slot: (b.slot as string) ?? "home", design: ((b.design as BannerDesign) ?? "image") }));
});
