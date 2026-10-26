import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm, type ProductInitial } from "@/components/admin/ProductForm";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: p }, { data: categories }, { data: allProducts }, { data: rel }] = await Promise.all([
    supabase.from("products").select("*, product_variants(*), product_images(path, alt, sort)").eq("id", id).single(),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("products").select("id, name").order("name"),
    supabase.from("product_relations").select("related_id").eq("product_id", id).order("sort"),
  ]);
  if (!p) notFound();

  const initial: ProductInitial = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    kind: p.kind,
    categoryId: p.category_id ?? "",
    description: p.description ?? "",
    basePrice: String(p.base_price),
    compareAtPrice: p.compare_at_price == null ? "" : String(p.compare_at_price),
    tags: p.tags ?? [],
    status: p.status,
    seoTitle: p.seo?.title ?? "",
    seoDescription: p.seo?.description ?? "",
    relatedIds: ((rel ?? []) as { related_id: string }[]).map((r) => r.related_id),
    variants: (p.product_variants ?? []).map((v: Record<string, unknown>) => ({
      id: v.id as string,
      sku: v.sku as string,
      colorName: (v.color_name as string) ?? "",
      colorHex: (v.color_hex as string) ?? "",
      size: (v.size as string) ?? "",
      priceDelta: String(v.price_delta),
      stock: String(v.stock),
    })),
    images: (p.product_images ?? []).sort((a: { sort: number }, b: { sort: number }) => a.sort - b.sort).map((i: { path: string; alt: string | null }) => ({ path: i.path, alt: i.alt ?? "" })),
  };

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-semibold">Edit product</h1>
      <ProductForm categories={categories ?? []} initial={initial} allProducts={allProducts ?? []} />
    </>
  );
}
