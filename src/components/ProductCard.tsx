"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
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
  const badges = tagOrder.filter((t) => (t === "sale" ? onSale : p.tags.includes(t))).slice(0, 1);
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
    <div className="group relative flex flex-col">
      <Link href={`/product/${p.slug}`} className="block">
        <div className="stitch relative overflow-hidden rounded-2xl bg-surface">
          {p.image ? (
            <>
              <img src={p.image} alt={p.name} loading="lazy" className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
              {p.images?.[1] && <img src={p.images[1].url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />}
            </>
          ) : (
            <ProductArt kind={p.kind} color={p.colors[0].hex} className="aspect-[4/5] w-full transition duration-700 group-hover:scale-[1.04]" />
          )}
          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {soldOut ? <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-paper">Sold out</span> : badges.map((t) => <TagBadge key={t} tag={t} text={t === "sale" && off > 0 ? `${off}% off` : undefined} />)}
          </div>
          {p.offerEndsAt && !soldOut && <span className="absolute bottom-3 left-3"><OfferCountdown endsAt={p.offerEndsAt} compact /></span>}
        </div>
        <p className="mt-3 text-sm font-medium leading-snug md:text-[15px]">{p.name}</p>
      </Link>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className={`text-[15px] font-bold tabular-nums ${off > 0 ? "text-[var(--madder)]" : ""}`}>{formatPrice(p.basePrice)}</p>
        {off > 0 && <p className="text-sm tabular-nums text-muted line-through">{formatPrice(p.compareAt as number)}</p>}
        {swatches.length > 1 && (
          <div className="ml-auto flex items-center gap-1" aria-label={`${swatches.length} colours`}>
            {swatches.slice(0, 3).map((c) => <span key={c.name} title={c.name} style={{ background: c.hex }} className="h-3 w-3 rounded-full ring-1 ring-ink/15" />)}
            {swatches.length > 3 && <span className="text-xs text-muted">+{swatches.length - 3}</span>}
          </div>
        )}
      </div>
      <div className="mt-auto flex gap-2 pt-3">
        <button onClick={() => !soldOut && setQuick(true)} disabled={soldOut} className="h-11 min-w-0 flex-1 rounded-pill bg-accent text-sm font-semibold text-accent-ink transition active:scale-[0.98] disabled:opacity-40 md:hover:bg-ink md:hover:text-paper">Buy now</button>
        <button onClick={quickAdd} disabled={soldOut} aria-label={added ? `${p.name} added to cart` : `Add ${p.name} to cart`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface transition hover:border-ink active:scale-95 disabled:opacity-40">{added ? <Check size={17} className="text-accent" /> : <ShoppingBag size={17} />}</button>
      </div>
      <HeartButton id={p.id} className="absolute right-2.5 top-2.5" />
      {quick && <QuickBuy product={p} zones={areas} onClose={() => setQuick(false)} />}
    </div>
  );
}
