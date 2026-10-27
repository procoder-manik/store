"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { makeSlug } from "@/lib/slug";
import { productSchema } from "@/lib/validators";

type Result = { ok: true; id: string } | { ok: false; error: string };

const dbError = (e: { code?: string; message: string }) =>
  e.code === "23505" ? "That slug or SKU is already used. Change it and save again." : e.message;

export async function saveProduct(input: unknown): Promise<Result> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  let ctx;
  try { ctx = await requireAdmin("product.save"); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const { supabase } = ctx;

  const row = {
    name: d.name,
    slug: makeSlug(d.slug, d.name, "product"),
    kind: d.kind,
    category_id: d.categoryId,
    description: d.description,
    base_price: d.basePrice,
    compare_at_price: d.compareAtPrice,
    tags: d.tags,
    status: d.status,
    seo: { title: d.seoTitle, description: d.seoDescription },
    updated_at: new Date().toISOString(),
  };

  let id = d.id;
  if (id) {
    const { data: before } = await supabase.from("products").select("slug").eq("id", id).maybeSingle();
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) return { ok: false, error: dbError(error) };
    // A renamed address keeps working: the old one sends visitors and search engines to the new one.
    if (before?.slug && before.slug !== row.slug) {
      await supabase.from("redirects").delete().eq("from_path", `/product/${row.slug}`);
      await supabase.from("redirects").upsert({ from_path: `/product/${before.slug}`, to_path: `/product/${row.slug}` }, { onConflict: "from_path" });
    }
  } else {
    let ins = await supabase.from("products").insert(row).select("id").single();
    if (ins.error?.code === "23505" && !d.slug) ins = await supabase.from("products").insert({ ...row, slug: `${row.slug}-${Math.random().toString(36).slice(2, 6)}` }).select("id").single(); // same name already used
    if (ins.error || !ins.data) return { ok: false, error: ins.error ? dbError(ins.error) : "Could not create product" };
    id = ins.data.id as string;
  }

  // Variants: remove deleted, update existing, insert new.
  const keep = d.variants.filter((v) => v.id).map((v) => v.id as string);
  const { data: existing } = await supabase.from("product_variants").select("id").eq("product_id", id);
  const drop = (existing ?? []).map((v) => v.id as string).filter((x) => !keep.includes(x));
  if (drop.length) await supabase.from("product_variants").delete().in("id", drop);

  for (const v of d.variants) {
    const vr = {
      product_id: id,
      sku: v.sku,
      color_name: v.colorName || null,
      color_hex: v.colorHex || null,
      size: v.size || null,
      price_delta: v.priceDelta,
      stock: v.stock,
    };
    const { error } = v.id
      ? await supabase.from("product_variants").update(vr).eq("id", v.id).eq("product_id", id)
      : await supabase.from("product_variants").insert(vr);
    if (error) return { ok: false, error: dbError(error) };
  }

  // Images: replace the set and delete files that were removed.
  const { data: oldImgs } = await supabase.from("product_images").select("path").eq("product_id", id);
  await supabase.from("product_images").delete().eq("product_id", id);
  if (d.images.length) {
    const { error } = await supabase.from("product_images").insert(d.images.map((im, i) => ({ product_id: id, path: im.path, alt: im.alt, sort: i })));
    if (error) return { ok: false, error: dbError(error) };
  }
  const removed = (oldImgs ?? []).map((i) => i.path as string).filter((p) => !d.images.some((im) => im.path === p) && !p.startsWith("https://"));
  if (removed.length) await supabase.storage.from("product-images").remove(removed);

  await supabase.from("product_relations").delete().eq("product_id", id);
  const rel = d.relatedIds.filter((x) => x !== id);
  if (rel.length) {
    const { error } = await supabase.from("product_relations").insert(rel.map((rid, i) => ({ product_id: id, related_id: rid, kind: "upsell", sort: i })));
    if (error) return { ok: false, error: "Could not save related products. Run supabase-0005-customer-selling.sql first." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true, id: id as string };
}

export async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "Invalid id" };
  let ctx;
  try { ctx = await requireAdmin("product.delete"); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const { supabase } = ctx;
  const { data: imgs } = await supabase.from("product_images").select("path").eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (imgs?.length) await supabase.storage.from("product-images").remove(imgs.map((i) => i.path as string).filter((p) => !p.startsWith("https://")));
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function duplicateProduct(id: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "Invalid id" };
  let ctx;
  try { ctx = await requireAdmin("product.duplicate"); } catch (e) { return { ok: false, error: (e as Error).message }; }
  const { supabase } = ctx;
  const { data: p } = await supabase.from("products").select("*, product_variants(*), product_images(path, alt, sort)").eq("id", id).maybeSingle();
  if (!p) return { ok: false, error: "Product not found." };
  const tag = Math.random().toString(36).slice(2, 6);
  const { data: np, error } = await supabase.from("products").insert({
    slug: `${p.slug}-copy-${tag}`.slice(0, 120), name: `${p.name} (copy)`.slice(0, 120), kind: p.kind, category_id: p.category_id, description: p.description,
    base_price: p.base_price, compare_at_price: p.compare_at_price, tags: p.tags, status: "draft", seo: {},
  }).select("id").single();
  if (error || !np) return { ok: false, error: error?.message ?? "Could not copy the product." };
  const variants = (p.product_variants ?? []) as { sku: string; color_name: string | null; color_hex: string | null; size: string | null; price_delta: number }[];
  if (variants.length) await supabase.from("product_variants").insert(variants.map((v) => ({ product_id: np.id, sku: `${v.sku}-C${tag}`.slice(0, 64), color_name: v.color_name, color_hex: v.color_hex, size: v.size, price_delta: v.price_delta, stock: 0 })));
  const imgs = ((p.product_images ?? []) as { path: string; alt: string | null; sort: number }[]).sort((a, b) => a.sort - b.sort);
  const copied: { product_id: string; path: string; alt: string | null; sort: number }[] = [];
  for (const im of imgs) {
    if (im.path.startsWith("https://")) { copied.push({ product_id: np.id, path: im.path, alt: im.alt, sort: copied.length }); continue; }
    // Files are copied, not shared, so deleting one product's photo never breaks the other.
    const dest = `${crypto.randomUUID()}.${im.path.split(".").pop() ?? "jpg"}`;
    const { error: ce } = await supabase.storage.from("product-images").copy(im.path, dest);
    if (!ce) copied.push({ product_id: np.id, path: dest, alt: im.alt, sort: copied.length });
  }
  if (copied.length) await supabase.from("product_images").insert(copied);
  revalidatePath("/admin/products");
  return { ok: true, id: np.id as string };
}
