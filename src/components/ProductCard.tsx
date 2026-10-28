"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ShoppingBag, Zap } from "lucide-react";
import type { Product } from "@/lib/demo-products";
import { formatPrice } from "@/lib/config";
import { useCart } from "@/lib/cart";
import { HeartButton } from "./ListButtons";
import { OfferCountdown } from "./OfferCountdown";
import { ProductArt } from "./ProductArt";
import { QuickBuy, type Zone } from "./QuickBuy";
import { TagBadge } from "./TagBadge";
import { useZones } from "./ZonesProvider";

export function ProductCard({ p, zones }: { p: Product; zones?: Zone[] }) {
  const fromContext = useZones();
  const areas = zones ?? fromContext;
  const { add, setOpen } = useCart();
  const [added, setAdded] = useState(false);
  const [quick, setQuick] = useState(false);
  const soldOut = (p.variants?.length ?? 0) > 0 && p.variants!.every((v) => v.stock <= 0);
  const onSale = (p.compareAt ?? 0) > p.basePrice || p.tags.includes("sale");
  const off = (p.compareAt ?? 0) > p.basePrice ? Math.round((1 - p.basePrice / (p.compareAt as number)) * 100) : 0;
  const tagOrder = ["sale", "hot", "bestseller", "new", "featured"] as const;
  const badges = tagOrder.filter((t) => (t === "sale" ? onSale : p.tags.includes(t))).slice(0, 2);
  const swatches = p.hasColors === false ? [] : p.colors;
  // "Add to cart" never opens a popup: it drops the first in-stock option straight into the cart.
  // To choose another colour or size first, the shopper uses "Buy now" or opens the product page.
  const variant = p.variants?.find((v) => v.stock > 0) ?? p.variants?.[0];

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (soldOut) return;
    const swatch = swatches.find((c) => c.name === variant?.colorName) ?? swatches[0];
    add({ id: p.id, variantId: variant?.id, name: p.name, color: swatch?.name ?? "", size: variant?.size ?? p.sizes[0] ?? "", price: p.basePrice + (variant?.priceDelta ?? 0), image: p.image, kind: p.kind, hex: swatch?.hex }, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
    setOpen(true);
  }

  return (
    <div className="group relative">
      <Link href={`/product/${p.slug}`} className="block">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
          {p.image ? (
            <>
              <img src={p.image} alt={p.name} loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105" />
              {p.images?.[1] && <img src={p.images[1].url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />}
            </>
          ) : (
            <ProductArt kind={p.kind} color={p.colors[0].hex} className="aspect-[4/5] w-full transition duration-500 group-hover:scale-105" />
          )}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {soldOut ? <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-paper">Sold out</span> : badges.map((t) => <TagBadge key={t} tag={t} text={t === "sale" && off > 0 ? `-${off}%` : undefined} />)}
          </div>
          {p.offerEndsAt && !soldOut && <span className="absolute bottom-3 left-3"><OfferCountdown endsAt={p.offerEndsAt} compact /></span>}
          {/* The buttons sit over the picture on a computer, and under the price on a phone. */}
          <div className="pointer-events-none absolute inset-x-2 bottom-2 hidden gap-2 opacity-0 transition duration-300 group-hover:pointer-events-auto group-hover:opacity-100 md:flex">
            <button onClick={quickAdd} disabled={soldOut} className="flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-surface/95 py-2.5 text-xs font-semibold shadow-lg backdrop-blur transition hover:bg-surface disabled:opacity-50">{added ? <><Check size={13} /> Added</> : <><ShoppingBag size={13} /> Add to cart</>}</button>
            <button onClick={(e) => { e.preventDefault(); if (!soldOut) setQuick(true); }} disabled={soldOut} className="flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-accent py-2.5 text-xs font-semibold text-accent-ink shadow-lg transition hover:opacity-90 disabled:opacity-50"><Zap size={13} /> Buy now</button>
          </div>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium leading-snug group-hover:underline">{p.name}</p>
            <p className="mt-1 text-sm">
              {formatPrice(p.basePrice)}
              {p.compareAt && p.compareAt > p.basePrice && <span className="ml-2 text-muted line-through">{formatPrice(p.compareAt)}</span>}
            </p>
          </div>
          {swatches.length > 0 && (
            <div className="mt-1 flex shrink-0 -space-x-1">
              {swatches.slice(0, 4).map((c) => <span key={c.name} title={c.name} style={{ background: c.hex }} className="h-4 w-4 rounded-full border border-line ring-2 ring-paper" />)}
              {swatches.length > 4 && <span className="pl-2 text-xs text-muted">+{swatches.length - 4}</span>}
            </div>
          )}
        </div>
      </Link>
      <div className="mt-2.5 flex gap-2 md:hidden">
        <button onClick={quickAdd} disabled={soldOut} className="flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-line py-2.5 text-xs font-semibold disabled:opacity-50">{added ? <><Check size={13} /> Added</> : "Add to cart"}</button>
        <button onClick={() => !soldOut && setQuick(true)} disabled={soldOut} className="flex-1 rounded-pill bg-accent py-2.5 text-xs font-semibold text-accent-ink disabled:opacity-50">Buy now</button>
      </div>
      <HeartButton id={p.id} className="absolute right-3 top-3" />
      {quick && <QuickBuy product={p} zones={areas} onClose={() => setQuick(false)} />}
    </div>
  );
}
