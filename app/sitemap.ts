import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
import { INFO_SLUGS } from "@/lib/info-pages";
import { SITE_URL } from "@/lib/config";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products } = await getCatalog();
  const sb = createPublicClient();
  const { data: pages } = sb ? await sb.from("pages").select("slug").eq("status", "active") : { data: [] };
  return [{ url: SITE_URL }, { url: `${SITE_URL}/shop` }, ...INFO_SLUGS.map((s) => ({ url: `${SITE_URL}/${s}` })), ...(pages ?? []).map((p) => ({ url: `${SITE_URL}/p/${p.slug}` })), ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}` }))];
}
