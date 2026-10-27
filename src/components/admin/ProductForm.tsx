"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Star, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/config";
import { imageUrl as publicUrl, isAllowedImageUrl, slugify } from "@/lib/utils";
import { deleteProduct, duplicateProduct, saveProduct } from "@/app/admin/products/actions";
import { generateField, generateProductDetails } from "@/app/admin/products/ai";

type V = { id?: string; sku: string; colorName: string; colorHex: string; size: string; priceDelta: string; stock: string };
type Img = { path: string; alt: string };
export type ProductInitial = {
  id?: string; name: string; slug: string; kind: string; categoryId: string; description: string;
  basePrice: string; compareAtPrice: string; tags: string[]; status: string;
  seoTitle: string; seoDescription: string; variants: V[]; images: Img[]; relatedIds: string[];
};

const EMPTY: ProductInitial = {
  name: "", slug: "", kind: "tee", categoryId: "", description: "", basePrice: "", compareAtPrice: "",
  tags: [], status: "draft", seoTitle: "", seoDescription: "", variants: [], images: [], relatedIds: [],
};
const TAGS = ["new", "hot", "featured", "sale"] as const;
const MIME: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
type FieldKey = "description" | "seoTitle" | "seoDescription" | "slug" | "colors" | "sizes";
const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";

export function ProductForm({ categories, initial = EMPTY, allProducts = [] }: { categories: { id: string; name: string }[]; initial?: ProductInitial; allProducts?: { id: string; name: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const [genColors, setGenColors] = useState("");
  const [genSizes, setGenSizes] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState<FieldKey | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const set = <K extends keyof ProductInitial>(k: K, v: ProductInitial[K]) => setF((p) => ({ ...p, [k]: v }));
  const setVariant = (i: number, patch: Partial<V>) => set("variants", f.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  function generate() {
    const colors = genColors.split(",").map((s) => s.trim()).filter(Boolean).map((s) => { const [n, h] = s.split(":"); return { n: n.trim(), h: (h ?? "").trim() }; });
    const sizes = genSizes.split(",").map((s) => s.trim()).filter(Boolean);
    const prefix = (f.slug || f.name).toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 8) || "SKU";
    const made: V[] = [];
    for (const c of colors.length ? colors : [{ n: "", h: "" }]) {
      for (const s of sizes.length ? sizes : [""]) {
        const sku = [prefix, c.n, s].filter(Boolean).join("-").toUpperCase().replace(/[^A-Z0-9-]+/g, "");
        if (!f.variants.some((v) => v.sku === sku)) made.push({ sku, colorName: c.n, colorHex: c.h, size: s, priceDelta: "0", stock: "0" });
      }
    }
    set("variants", [...f.variants, ...made]);
  }

  async function autofill() {
    setError("");
    setAiBusy(true);
    const r = await generateProductDetails({ name: f.name, kind: f.kind, categories: categories.map((c) => c.name) });
    setAiBusy(false);
    if (!r.ok) return setError(r.error);
    const d = r.data;
    const pick = (cur: string, next: string) => (replace || !cur ? next : cur);
    const cat = categories.find((c) => c.name.toLowerCase() === (d.categoryName ?? "").toLowerCase());
    setF((p) => ({
      ...p,
      kind: replace || !p.id ? d.kind : p.kind,
      categoryId: pick(p.categoryId, cat?.id ?? p.categoryId),
      slug: pick(p.slug, d.slug),
      description: pick(p.description, d.description),
      seoTitle: pick(p.seoTitle, d.seoTitle),
      seoDescription: pick(p.seoDescription, d.seoDescription),
    }));
    setGenColors((c) => pick(c, d.colors.map((x) => `${x.name}:${x.hex}`).join(", ")));
    setGenSizes((z) => pick(z, d.sizes.join(", ")));
  }

  async function gen(field: FieldKey) {
    setError("");
    setBusy(field);
    const r = await generateField({ field, name: f.name, kind: f.kind, description: f.description, category: categories.find((c) => c.id === f.categoryId)?.name ?? "" });
    setBusy(null);
    if (!r.ok) return setError(r.error);
    if (field === "colors") setGenColors(r.text);
    else if (field === "sizes") setGenSizes(r.text);
    else set(field, r.text);
  }

  const aiIcon = (field: FieldKey, cls = "") => (
    <button type="button" title="Generate with AI" aria-label={`Generate ${field} with AI`} onClick={() => gen(field)} disabled={busy !== null || f.name.trim().length < 2} className={`grid h-7 w-7 place-items-center rounded-full text-accent hover:bg-paper disabled:opacity-40 ${busy === field ? "animate-pulse" : ""} ${cls}`}>
      <Sparkles size={14} />
    </button>
  );
  const lbl = (text: string, field: FieldKey) => (
    <div className="mb-1 flex items-center justify-between"><label className="text-xs font-medium text-muted">{text}</label>{aiIcon(field)}</div>
  );

  function addUrl() {
    const u = urlInput.trim();
    if (!isAllowedImageUrl(u)) return setError("Paste a direct https image link from Pexels, Unsplash or Pixabay.");
    if (f.images.length >= 12) return setError("You can add up to 12 images.");
    setError("");
    set("images", [...f.images, { path: u, alt: f.name }]);
    setUrlInput("");
  }

  async function onFiles(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    setError("");
    const sb = createClient();
    const added: Img[] = [];
    for (const file of Array.from(files)) {
      const ext = MIME[file.type];
      if (!ext || file.size > 5 * 1024 * 1024) { setError(`${file.name}: use JPG, PNG, WebP or AVIF under 5 MB`); continue; }
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: err } = await sb.storage.from("product-images").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
      if (err) { setError(err.message); continue; }
      added.push({ path, alt: "" });
    }
    set("images", [...f.images, ...added].slice(0, 12));
    setUploading(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      id: f.id,
      name: f.name,
      slug: f.slug,
      kind: f.kind,
      categoryId: f.categoryId || null,
      description: f.description,
      basePrice: Number(f.basePrice),
      compareAtPrice: f.compareAtPrice === "" ? null : Number(f.compareAtPrice),
      tags: f.tags,
      status: f.status,
      seoTitle: f.seoTitle,
      seoDescription: f.seoDescription,
      variants: f.variants.map((v) => ({ id: v.id, sku: v.sku, colorName: v.colorName, colorHex: v.colorHex, size: v.size, priceDelta: Number(v.priceDelta || 0), stock: Number(v.stock || 0) })),
      images: f.images,
      relatedIds: f.relatedIds,
    };
    start(async () => {
      const r = await saveProduct(payload);
      if (!r.ok) return setError(r.error);
      router.push("/admin/products");
      router.refresh();
    });
  }

  function remove() {
    if (!f.id || !confirm("Delete this product? This cannot be undone.")) return;
    start(async () => {
      const r = await deleteProduct(f.id as string);
      if (!r.ok) return setError(r.error ?? "Could not delete");
      router.push("/admin/products");
      router.refresh();
    });
  }

  const box = "rounded-xl border border-line bg-surface p-5";
  const label = "mb-1 block text-xs font-medium text-muted";

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-5">
        <section className={`${box} grid gap-4`}>
          <div><label className={label}>Name</label><input className={input} required maxLength={120} value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={autofill} disabled={aiBusy || f.name.trim().length < 2} className="rounded-pill border border-accent px-4 py-2 text-sm font-medium text-accent disabled:opacity-40">{aiBusy ? "Writing..." : "Auto-fill with AI"}</button>
            <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} /> Replace fields I already filled</label>
          </div>
          <div>{lbl("Description", "description")}<textarea className={input} rows={5} maxLength={5000} data-no-ai value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={label}>Price (BDT)</label><input className={input} type="number" min={0} step="0.01" required value={f.basePrice} onChange={(e) => set("basePrice", e.target.value)} /></div>
            <div><label className={label}>Compare-at price</label><input className={input} type="number" min={0} step="0.01" value={f.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} /></div>
          </div>
        </section>

        <section className={box}>
          <h2 className="font-display text-base font-semibold">Images</h2>
          <p className="mt-1 text-xs text-muted">The first image is the main image. JPG, PNG, WebP or AVIF, up to 5 MB each.</p>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {f.images.map((im, i) => (
              <div key={im.path} className="group relative">
                <img src={publicUrl(im.path)} alt={im.alt} className="aspect-square w-full rounded-lg border border-line object-cover" />
                {i === 0 && <span className="absolute left-1 top-1 rounded-pill bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-ink">Main</span>}
                <div className="absolute right-1 top-1 flex gap-1">
                  {i !== 0 && <button type="button" aria-label="Make main image" onClick={() => set("images", [im, ...f.images.filter((_, j) => j !== i)])} className="grid h-7 w-7 place-items-center rounded-full bg-surface/90"><Star size={14} /></button>}
                  <button type="button" aria-label="Remove image" onClick={() => set("images", f.images.filter((_, j) => j !== i))} className="grid h-7 w-7 place-items-center rounded-full bg-surface/90"><Trash2 size={14} /></button>
                </div>
                <input aria-label="Alt text" placeholder="Alt text" maxLength={200} value={im.alt} onChange={(e) => set("images", f.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} className="mt-1 w-full rounded-lg border border-line bg-surface px-2 py-1 text-xs" />
              </div>
            ))}
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploading || f.images.length >= 12} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} className="mt-3 text-sm" />
          {uploading && <p className="mt-2 text-xs text-muted">Uploading...</p>}
          <div className="mt-3 flex gap-2">
            <input className={input} placeholder="Or paste an image link from Pexels, Unsplash or Pixabay" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
            <button type="button" onClick={addUrl} className="shrink-0 rounded-pill border border-line px-4 py-2 text-sm font-medium hover:bg-paper">Add</button>
          </div>
        </section>

        <section className={box}>
          <h2 className="font-display text-base font-semibold">Variants</h2>
          <p className="mt-1 text-xs text-muted">Each color and size gets its own SKU, price change and stock. Final price = base price + price change.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <div className="relative"><input className={`${input} pr-9`} placeholder="Colors: Sage:#8fa88b, Ink:#23262d" data-no-ai value={genColors} onChange={(e) => setGenColors(e.target.value)} />{aiIcon("colors", "absolute right-1.5 top-1.5")}</div>
            <div className="relative"><input className={`${input} pr-9`} placeholder="Sizes: S, M, L, XL" data-no-ai value={genSizes} onChange={(e) => setGenSizes(e.target.value)} />{aiIcon("sizes", "absolute right-1.5 top-1.5")}</div>
            <button type="button" onClick={generate} className="rounded-pill border border-line px-4 py-2 text-sm font-medium hover:bg-paper">Generate</button>
          </div>
          <div className="mt-4 overflow-x-auto">
            {f.variants.length > 0 && (
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs text-muted"><tr><th className="pb-2 font-medium">SKU</th><th className="pb-2 font-medium">Color</th><th className="pb-2 font-medium">Hex</th><th className="pb-2 font-medium">Size</th><th className="pb-2 font-medium">Price change</th><th className="pb-2 font-medium">Stock</th><th /></tr></thead>
                <tbody>
                  {f.variants.map((v, i) => (
                    <tr key={v.id ?? i}>
                      <td className="pr-2 pb-2"><input aria-label="SKU" className={input} value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value })} /></td>
                      <td className="pr-2 pb-2"><input aria-label="Color name" className={input} value={v.colorName} onChange={(e) => setVariant(i, { colorName: e.target.value })} /></td>
                      <td className="pr-2 pb-2"><input aria-label="Color hex" className={input} placeholder="#aabbcc" value={v.colorHex} onChange={(e) => setVariant(i, { colorHex: e.target.value })} /></td>
                      <td className="pr-2 pb-2"><input aria-label="Size" className={input} value={v.size} onChange={(e) => setVariant(i, { size: e.target.value })} /></td>
                      <td className="pr-2 pb-2"><input aria-label="Price change" className={input} type="number" step="0.01" value={v.priceDelta} onChange={(e) => setVariant(i, { priceDelta: e.target.value })} /></td>
                      <td className="pr-2 pb-2"><input aria-label="Stock" className={input} type="number" min={0} step={1} value={v.stock} onChange={(e) => setVariant(i, { stock: e.target.value })} /></td>
                      <td className="pb-2"><button type="button" aria-label="Remove variant" onClick={() => set("variants", f.variants.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <button type="button" onClick={() => set("variants", [...f.variants, { sku: "", colorName: "", colorHex: "", size: "", priceDelta: "0", stock: "0" }])} className="mt-2 text-sm underline">Add one variant</button>
        </section>

        {allProducts.filter((x) => x.id !== f.id).length > 0 && (
          <section className={box}>
            <h2 className="font-display text-base font-semibold">Goes well with</h2>
            <p className="mt-1 text-xs text-muted">Products you pick here are suggested on this product&apos;s page as upsell and cross-sell items (up to 12).</p>
            <div className="mt-3 grid max-h-52 gap-1 overflow-y-auto">
              {allProducts.filter((x) => x.id !== f.id).map((x) => (
                <label key={x.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-paper">
                  <input type="checkbox" checked={f.relatedIds.includes(x.id)} disabled={!f.relatedIds.includes(x.id) && f.relatedIds.length >= 12} onChange={() => set("relatedIds", f.relatedIds.includes(x.id) ? f.relatedIds.filter((y) => y !== x.id) : [...f.relatedIds, x.id])} />
                  {x.name}
                </label>
              ))}
            </div>
          </section>
        )}

        <section className={`${box} grid gap-4`}>
          <h2 className="font-display text-base font-semibold">Search listing</h2>
          <div>{lbl(`Page title (${f.seoTitle.length}/70)`, "seoTitle")}<input className={input} maxLength={70} data-no-ai value={f.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} /></div>
          <div>{lbl(`Meta description (${f.seoDescription.length}/170)`, "seoDescription")}<textarea className={input} rows={3} maxLength={170} data-no-ai value={f.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} /></div>
          <div>{lbl("Page address", "slug")}<input className={input} placeholder="Auto from name" data-no-ai value={f.slug} onChange={(e) => set("slug", e.target.value)} /><p className="mt-1 break-all text-xs text-muted">{`${SITE_URL}/product/${f.slug || slugify(f.name) || "..."}`}</p></div>
        </section>
      </div>

      <aside className="grid h-fit gap-5 lg:sticky lg:top-20">
        <section className={`${box} grid gap-4`}>
          <div>
            <label className={label}>Status</label>
            <select className={input} value={f.status} onChange={(e) => set("status", e.target.value)}>
              <option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className={label}>Type</label>
            <select className={input} value={f.kind} onChange={(e) => set("kind", e.target.value)}>
              <option value="tee">T-shirt</option><option value="hoodie">Hoodie</option><option value="cover">Bedding or cover</option><option value="decor">Home decor</option>
            </select>
          </div>
          <div>
            <label className={label}>Category</label>
            <select className={input} value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">None</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <span className={label}>Tags</span>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <button key={t} type="button" aria-pressed={f.tags.includes(t)} onClick={() => set("tags", f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t])} className={`rounded-pill border px-3 py-1 text-xs capitalize ${f.tags.includes(t) ? "border-accent bg-accent text-accent-ink" : "border-line"}`}>{t}</button>
              ))}
            </div>
          </div>
        </section>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={pending || uploading} className="rounded-pill bg-accent py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Saving..." : "Save product"}</button>
        {f.id && <button type="button" disabled={pending} onClick={() => start(async () => { const r = await duplicateProduct(f.id as string); if (!r.ok) return setError(r.error); router.push(`/admin/products/${r.id}`); router.refresh(); })} className="rounded-pill border border-line py-3 text-sm font-medium hover:bg-paper disabled:opacity-50">Duplicate as a draft</button>}
        {f.id && <button type="button" onClick={remove} disabled={pending} className="rounded-pill border border-line py-3 text-sm text-red-600 disabled:opacity-50">Delete product</button>}
      </aside>
    </form>
  );
}
