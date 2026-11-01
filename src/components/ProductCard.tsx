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
  const tagOrder = ["sale", "bestseller", "new"] as const;
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

  const tint = p.colors[0]?.hex ?? "#d9dbe0";
  return (
    <div className="group relative flex flex-col">
      <div style={{ background: `color-mix(in srgb, ${tint} 17%, var(--surface))` }} className="relative overflow-hidden rounded-[14px] transition duration-500 md:group-hover:shadow-[0_22px_44px_-26px_rgba(15,31,28,0.55)]">
        <Link href={`/product/${p.slug}`} className="block" aria-label={p.name}>
          {p.image ? (
            <img src={p.image} alt={p.name} loading="lazy" className="aspect-[4/5] w-full object-contain p-[10%] drop-shadow-[0_16px_18px_rgba(15,31,28,0.2)] transition duration-700 ease-out md:group-hover:-translate-y-1.5 md:group-hover:scale-[1.06]" />
          ) : (
            <ProductArt kind={p.kind} color={p.colors[0].hex} className="aspect-[4/5] w-full" />
          )}
        </Link>
        <div className="pointer-events-none absolute left-2.5 top-2.5">
          {soldOut ? <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-paper">Sold out</span> : badges.map((t) => <TagBadge key={t} tag={t} text={t === "sale" && off > 0 ? `${off}% off` : undefined} />)}
        </div>
        {p.offerEndsAt && !soldOut && <span className="absolute bottom-3 left-3"><OfferCountdown endsAt={p.offerEndsAt} compact /></span>}
        <button onClick={quickAdd} disabled={soldOut} aria-label={added ? `${p.name} added to cart` : `Add ${p.name} to cart`} className="absolute bottom-2.5 right-2.5 grid h-10 w-10 place-items-center rounded-full bg-surface text-ink shadow-md transition hover:bg-accent hover:text-accent-ink active:scale-95 disabled:opacity-40">{added ? <Check size={17} /> : <ShoppingBag size={17} strokeWidth={1.6} />}</button>
      </div>
      <Link href={`/product/${p.slug}`} className="mt-3 block text-[14px] font-medium leading-snug md:text-[15px]">{p.name}</Link>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <p className={`text-[15px] tabular-nums ${off > 0 ? "text-[var(--madder)]" : ""}`}>{formatPrice(p.basePrice)}</p>
        {off > 0 && <p className="text-[13px] tabular-nums text-muted line-through">{formatPrice(p.compareAt as number)}</p>}
      </div>
      <div className="mt-auto pt-3">
        <button onClick={() => !soldOut && setQuick(true)} disabled={soldOut} className="h-10 w-full rounded-full border border-ink/25 text-[13px] font-medium transition hover:border-accent hover:bg-accent hover:text-accent-ink active:scale-[0.98] disabled:opacity-40">Buy now</button>
      </div>
      <HeartButton id={p.id} className="absolute right-2.5 top-2.5" />
      {quick && <QuickBuy product={p} zones={areas} onClose={() => setQuick(false)} />}
    </div>
  );
}
