import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";
import { INFO_SLUGS } from "@/lib/info-pages";
import { BUILTIN } from "@/lib/builtin-pages";
import { SITE_URL } from "@/lib/config";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getCatalog();
  const sb = createPublicClient();
  let rows: { slug: string; kind?: string }[] = [];
  if (sb) {
    const r = await sb.from("pages").select("slug, kind").eq("status", "active");
    rows = (r.error ? (await sb.from("pages").select("slug").eq("status", "active")).data : r.data) ?? [];
  }
  // Landing pages are for ads and the built-in pages have their own addresses, so neither goes in as /p/.
  const pages = rows.filter((p) => p.kind !== "landing" && !BUILTIN.some((b) => b.slug === p.slug));
  return [{ url: SITE_URL }, { url: `${SITE_URL}/shop` }, ...categories.map((c) => ({ url: `${SITE_URL}/category/${c.id}`, changeFrequency: "weekly" as const, priority: 0.8 })), ...INFO_SLUGS.map((s) => ({ url: `${SITE_URL}/${s}`, changeFrequency: "monthly" as const, priority: 0.4 })), ...pages.map((p) => ({ url: `${SITE_URL}/p/${p.slug}` })), ...products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, ...(p.updatedAt ? { lastModified: new Date(p.updatedAt) } : {}), changeFrequency: "weekly" as const, priority: 0.7 }))];
}
