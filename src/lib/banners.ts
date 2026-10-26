import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type Banner = { id: string; title: string; subtitle: string; image: string; link: string; button: string };

export const getBanners = cache(async (): Promise<Banner[]> => {
  const sb = createPublicClient();
  if (!sb) return [];
  const { data, error } = await sb.from("banners").select("id, title, subtitle, image, link, button").eq("active", true).order("sort").limit(6);
  if (error) return [];
  return (data ?? []).map((b) => ({ id: b.id as string, title: b.title as string, subtitle: (b.subtitle as string) ?? "", image: (b.image as string) ?? "", link: (b.link as string) ?? "", button: (b.button as string) ?? "" }));
});
