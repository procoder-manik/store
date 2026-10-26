"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { Product } from "@/lib/demo-products";
import { formatPrice } from "@/lib/config";
import { useCart } from "@/lib/cart";
import { trackAddToCart } from "@/lib/track";
import { ProductArt } from "./ProductArt";

type Opt = { id: string; label: string; price: number };

function options(p: Product): Opt[] {
  return (p.variants ?? []).filter((v) => v.stock > 0).map((v) => ({ id: v.id, label: [v.colorName, v.size].filter(Boolean).join(", ") || "Standard", price: p.basePrice + v.priceDelta }));
}

export function BundleBox({ name, percent, products }: { name: string; percent: number; products: Product[] }) {
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);
  const [sel, setSel] = useState<Record<string, string>>(() => Object.fromEntries(products.map((p) => [p.id, options(p)[0]?.id ?? ""])));
  const [added, setAdded] = useState(false);

  const picks = products.map((p) => {
    const opts = options(p);
    const tracked = (p.variants?.length ?? 0) > 0;
    const o = opts.find((x) => x.id === sel[p.id]) ?? opts[0];
    return { p, opts, tracked, o, price: tracked ? o?.price ?? 0 : p.basePrice, ok: !tracked || !!o };
  });
  const allOk = picks.every((x) => x.ok);
  const sum = picks.reduce((n, x) => n + x.price, 0);
  const save = Math.round((sum * percent) / 100);

  function addAll() {
    for (const { p, o, price, tracked } of picks) {
      const v = tracked ? (p.variants ?? []).find((x) => x.id === o?.id) : undefined;
      add({ id: p.id, variantId: v?.id, name: p.name, color: v?.colorName ?? "", size: v?.size ?? "", price }, 1);
      trackAddToCart({ id: p.id, name: p.name, price, qty: 1 });
    }
    setAdded(true); setOpen(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <section className="mt-16 rounded-3xl border border-line bg-surface p-6 md:p-8" aria-label={name}>
      <h2 className="font-display text-2xl font-semibold">Buy together and save {percent}%</h2>
      <p className="mt-1 text-sm text-muted">{name}. The discount is applied at checkout when all of these are in your cart.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {picks.map(({ p, opts, tracked, price }) => (
          <div key={p.id} className="grid content-start gap-3">
            {p.image ? <img src={p.image} alt={p.name} loading="lazy" className="aspect-[4/5] w-full rounded-2xl border border-line object-cover" /> : <ProductArt kind={p.kind} color={p.colors[0].hex} className="aspect-[4/5] w-full rounded-2xl border border-line" />}
            <p className="text-sm font-medium">{p.name}</p>
            {tracked && (opts.length ? (
              <select aria-label={`Option for ${p.name}`} value={sel[p.id]} onChange={(e) => setSel({ ...sel, [p.id]: e.target.value })} className="rounded-xl border border-line bg-paper px-3 py-2 text-sm">
                {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            ) : <p className="text-sm text-red-600">Sold out</p>)}
            <p className="text-sm text-muted">{formatPrice(price)}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <p className="text-sm"><span className="text-muted">Together </span><span className="text-muted line-through">{formatPrice(sum)}</span> <span className="font-display text-xl font-semibold">{formatPrice(sum - save)}</span> <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent">Save {formatPrice(save)}</span></p>
        <button disabled={!allOk} onClick={addAll} className="flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-accent-ink disabled:opacity-40">{added ? <><Check size={16} /> Added</> : allOk ? "Add all to cart" : "Not available"}</button>
      </div>
    </section>
  );
}
