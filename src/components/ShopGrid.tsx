"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/demo-products";
import type { Cat } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

const field = "rounded-full border border-line bg-surface px-3 py-2 text-sm";

export function ShopGrid({ products, categories }: { products: Product[]; categories: Cat[] }) {
  const sp = useSearchParams();
  const [cat, setCat] = useState(sp.get("cat") ?? "all");
  const [sort, setSort] = useState("new");
  const [tag, setTag] = useState(sp.get("tag") ?? "all");
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [inStock, setInStock] = useState(false);

  const list = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let l = products.filter((p) =>
      words.every((w) => `${p.name} ${p.description} ${p.category} ${p.colors.map((c) => c.name).join(" ")}`.toLowerCase().includes(w)) &&
      (cat === "all" || p.category === cat) &&
      (tag === "all" || p.tags.includes(tag as Product["tags"][number])) &&
      (!inStock || !((p.variants?.length ?? 0) > 0 && p.variants!.every((v) => v.stock <= 0))));
    if (sort === "low") l = [...l].sort((a, b) => a.basePrice - b.basePrice);
    if (sort === "high") l = [...l].sort((a, b) => b.basePrice - a.basePrice);
    return l;
  }, [products, cat, sort, tag, inStock, q]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">Shop</h1>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this shop" aria-label="Search products" className="w-full rounded-full border border-line bg-surface px-5 py-2.5 text-sm sm:w-72" />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {[{ id: "all", label: "All" }, ...categories].map((c) => (
          <button key={c.id} aria-pressed={cat === c.id} onClick={() => setCat(c.id)} className={`rounded-full border px-4 py-2 text-sm transition ${cat === c.id ? "border-ink bg-ink text-paper" : "border-line bg-surface hover:border-ink"}`}>{c.label}</button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} className={field}>
          <option value="new">Newest</option><option value="low">Price, low to high</option><option value="high">Price, high to low</option>
        </select>
        <select aria-label="Filter by tag" value={tag} onChange={(e) => setTag(e.target.value)} className={field}>
          <option value="all">All products</option><option value="new">New</option><option value="hot">Popular</option><option value="featured">Featured</option><option value="sale">On sale</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> In stock only</label>
        <p className="ml-auto text-sm text-muted">{list.length} {list.length === 1 ? "product" : "products"}</p>
      </div>
      {list.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">Nothing matches these filters. Try clearing one.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </>
  );
}
