import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { CATEGORIES, DEMO_PRODUCTS, type ColorOpt, type Product } from "@/lib/demo-products";
import { imageUrl, slugify } from "@/lib/utils";

export type Cat = { id: string; label: string; description?: string };

type VRow = { id: string; color_name: string | null; color_hex: string | null; size: string | null; price_delta: number | string; stock: number };
type IRow = { path: string; alt: string | null; sort: number };
type Row = {
  id: string; slug: string; name: string; kind: Product["kind"]; description: string | null;
  base_price: number | string; compare_at_price: number | string | null; tags: string[] | null;
  seo: { title?: string; description?: string } | null;
  updated_at?: string | null;
  categories: { slug: string } | { slug: string }[] | null;
  product_variants: VRow[]; product_images: IRow[];
};

const SELECT =
  "id, slug, name, kind, description, base_price, compare_at_price, tags, seo, updated_at, categories(slug), product_variants(id, color_name, color_hex, size, price_delta, stock), product_images(path, alt, sort)";

function mapRow(r: Row): Product {
  const variants = (r.product_variants ?? []).map((v) => ({
    id: v.id,
    colorName: v.color_name ?? "",
    size: v.size ?? "",
    priceDelta: Number(v.price_delta),
    stock: v.stock,
  }));

  const colors: ColorOpt[] = [];
  for (const v of r.product_variants ?? []) {
    if (!v.color_name) continue;
    const existing = colors.find((c) => c.name === v.color_name);
    const delta = Number(v.price_delta);
    if (existing) existing.delta = Math.min(existing.delta, delta);
    else colors.push({ name: v.color_name, hex: v.color_hex ?? "#cfd2d8", delta });
  }
  const hasColors = colors.length > 0;
  if (!hasColors) colors.push({ name: "Default", hex: "#d9dbe0", delta: 0 });

  const sizes: string[] = [];
  for (const v of r.product_variants ?? []) if (v.size && !sizes.includes(v.size)) sizes.push(v.size);

  const imgs = [...(r.product_images ?? [])].sort((a, b) => a.sort - b.sort).map((i) => ({ url: imageUrl(i.path), alt: i.alt ?? r.name }));
  const cat = Array.isArray(r.categories) ? r.categories[0] : r.categories;

  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    kind: r.kind,
    category: cat?.slug ?? "",
    basePrice: Number(r.base_price),
    compareAt: r.compare_at_price == null ? null : Number(r.compare_at_price),
    tags: (r.tags ?? []) as Product["tags"],
    description: r.description ?? "",
    colors,
    hasColors,
    sizes,
    variants,
    image: imgs[0]?.url,
    images: imgs,
    seo: r.seo ?? {},
    updatedAt: r.updated_at ?? undefined,
  };
}

const demo = (): Product[] => DEMO_PRODUCTS.map((d) => ({ ...d, slug: slugify(d.name) }));

export const getCatalog = cache(async (): Promise<{ products: Product[]; categories: Cat[]; source: "db" | "demo" }> => {
  const sb = createPublicClient();
  if (!sb) return { source: "demo", products: demo(), categories: CATEGORIES.filter((c) => c.id !== "all") };

  const [prods, cats] = await Promise.all([
    sb.from("products").select(SELECT).eq("status", "active").order("created_at", { ascending: false }),
    sb.from("categories").select("slug, name, description").eq("active", true).order("sort").order("name"),
  ]);
  const rel = await sb.from("product_relations").select("product_id, related_id").order("sort");
  const relMap = new Map<string, string[]>();
  for (const r of (rel.error ? [] : rel.data ?? []) as { product_id: string; related_id: string }[]) relMap.set(r.product_id, [...(relMap.get(r.product_id) ?? []), r.related_id]);
  const products = ((prods.data ?? []) as unknown as Row[]).map(mapRow).map((p) => ({ ...p, related: relMap.get(p.id) ?? [] }));
  let catRows = cats.data as { slug: string; name: string; description?: string | null }[] | null;
  if (cats.error) catRows = ((await sb.from("categories").select("slug, name").eq("active", true).order("sort").order("name")).data ?? []) as typeof catRows; // description column not added yet
  const used = new Set(products.map((p) => p.category));
  const categories = (catRows ?? []).filter((c) => used.has(c.slug as string)).map((c) => ({ id: c.slug, label: c.name, description: c.description ?? undefined }));
  return { source: "db", products, categories };
});

export const getProduct = cache(async (slug: string): Promise<Product | null> => {
  const sb = createPublicClient();
  if (!sb) return demo().find((p) => p.slug === slug) ?? null;
  const { data } = await sb.from("products").select(SELECT).eq("slug", slug).eq("status", "active").maybeSingle();
  return data ? mapRow(data as unknown as Row) : null;
});
