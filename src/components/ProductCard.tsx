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
      <div className="relative overflow-hidden bg-surface">
        <Link href={`/product/${p.slug}`} className="block" aria-label={p.name}>
          {p.image ? (
            <>
              <img src={p.image} alt={p.name} loading="lazy" className="aspect-[3/4] w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.03]" />
              {p.images?.[1] && <img src={p.images[1].url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:opacity-100" />}
            </>
          ) : (
            <ProductArt kind={p.kind} color={p.colors[0].hex} className="aspect-[3/4] w-full" />
          )}
        </Link>
        <div className="pointer-events-none absolute left-2 top-2">
          {soldOut ? <span className="bg-ink px-2 py-0.5 text-[11px] font-medium text-paper">Sold out</span> : badges.map((t) => <TagBadge key={t} tag={t} text={t === "sale" && off > 0 ? `${off}% off` : undefined} />)}
        </div>
        {p.offerEndsAt && !soldOut && <span className="absolute bottom-3 left-3"><OfferCountdown endsAt={p.offerEndsAt} compact /></span>}
        <div className="absolute inset-x-0 bottom-0 hidden translate-y-full gap-px transition duration-300 group-focus-within:translate-y-0 group-hover:translate-y-0 md:flex">
          <button onClick={quickAdd} disabled={soldOut} className="h-11 flex-1 bg-surface text-[13px] font-medium text-ink transition hover:bg-ink hover:text-paper disabled:opacity-50">{added ? "Added" : "Add to cart"}</button>
          <button onClick={() => !soldOut && setQuick(true)} disabled={soldOut} className="h-11 flex-1 bg-accent text-[13px] font-medium text-accent-ink transition hover:opacity-90 disabled:opacity-50">Buy now</button>
        </div>
      </div>
      <Link href={`/product/${p.slug}`} className="mt-3 block text-[14px] leading-snug md:text-[15px]">{p.name}</Link>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <p className={`text-[14px] tabular-nums ${off > 0 ? "text-[var(--madder)]" : "text-muted"}`}>{formatPrice(p.basePrice)}</p>
        {off > 0 && <p className="text-[13px] tabular-nums text-muted line-through">{formatPrice(p.compareAt as number)}</p>}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-2 md:hidden">
        <button onClick={() => !soldOut && setQuick(true)} disabled={soldOut} className="py-2 text-[13px] font-medium underline underline-offset-4 disabled:opacity-40">Buy now</button>
        <button onClick={quickAdd} disabled={soldOut} aria-label={added ? `${p.name} added to cart` : `Add ${p.name} to cart`} className="grid h-10 w-10 place-items-center disabled:opacity-40">{added ? <Check size={17} /> : <ShoppingBag size={17} strokeWidth={1.5} />}</button>
      </div>
      <HeartButton id={p.id} className="absolute right-2 top-2" />
      {quick && <QuickBuy product={p} zones={areas} onClose={() => setQuick(false)} />}
    </div>
  );
}
