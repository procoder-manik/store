"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, Truck } from "lucide-react";
import type { Product } from "@/lib/demo-products";
import { formatPrice } from "@/lib/config";
import { preorderDate } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { trackAddToCart } from "@/lib/track";
import { ListButtons } from "./ListButtons";
import { FreeDeliveryNote } from "./FreeDeliveryNote";
import { Portal } from "./Portal";

type Props = { product: Product; colorIdx: number; onColor: (i: number) => void; compact?: boolean };

export function ProductBuy({ product, colorIdx, onColor, compact = false }: Props) {
  const router = useRouter();
  const [size, setSize] = useState(product.sizes[1] ?? product.sizes[0] ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);
  const buttons = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const setOpen = useCart((s) => s.setOpen);

  const hasColors = product.hasColors !== false;
  const color = product.colors[colorIdx] ?? product.colors[0];
  const find = (sz: string) => product.variants?.find((v) => v.colorName === (hasColors ? color.name : "") && v.size === sz);
  const variant = find(size);
  const tracked = (product.variants?.length ?? 0) > 0;
  const available = tracked ? !!variant && variant.stock > 0 : true;
  const price = product.basePrice + (variant ? variant.priceDelta : color.delta);
  const saving = product.compareAt && product.compareAt > price ? product.compareAt - price : 0;
  const maxQty = variant ? Math.max(1, Math.min(10, variant.stock)) : 10;
  const q = Math.min(qty, maxQty);
  const stockNote = !tracked || !variant ? "" : variant.stock <= 0 ? "Sold out in this option" : variant.stock <= 5 ? `Only ${variant.stock} left` : "In stock";

  const addToCart = () => {
    add({ id: product.id, variantId: variant?.id, name: product.name, color: hasColors ? color.name : "", size, price, image: product.image, kind: product.kind, hex: color.hex }, q);
    trackAddToCart({ id: product.id, name: product.name, price, qty: q });
  };
  const onAdd = () => { addToCart(); setAdded(true); setOpen(true); window.setTimeout(() => setAdded(false), 1800); };
  const buyNow = () => { addToCart(); router.push("/checkout"); };

  // On phones, keep a buy bar on screen once the main buttons have scrolled up out of view.
  useEffect(() => {
    const el = buttons.current;
    if (compact || !el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setPinned(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [compact]);

  const stepper = (
    <div className="inline-flex shrink-0 items-center rounded-pill border border-line">
      <button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, q - 1))} className="grid h-10 w-9 place-items-center"><Minus size={14} /></button>
      <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">{q}</span>
      <button aria-label="Increase quantity" onClick={() => setQty(Math.min(maxQty, q + 1))} className="grid h-10 w-9 place-items-center"><Plus size={14} /></button>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-display text-3xl font-semibold">{formatPrice(price)}</p>
        {saving > 0 && <p className="text-sm text-muted line-through">{formatPrice(product.compareAt as number)}</p>}
        {saving > 0 && <p className="rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">Save {formatPrice(saving)}</p>}
      </div>

      {hasColors && (
        <div className="mt-5">
          <p className="text-sm font-medium">Color <span className="font-normal text-muted">{color.name}</span></p>
          <div className="mt-2 flex flex-wrap gap-2.5">
            {product.colors.map((c, i) => (
              <button key={c.name} aria-label={c.name} aria-pressed={i === colorIdx} onClick={() => onColor(i)} style={{ background: c.hex }} className={`h-9 w-9 rounded-full border border-line transition ${i === colorIdx ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : "hover:scale-110"}`} />
            ))}
          </div>
        </div>
      )}

      {product.sizes.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-medium">Size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const v = find(s);
              const out = tracked && (!v || v.stock <= 0);
              return (
                <button key={s} aria-pressed={s === size} onClick={() => setSize(s)} className={`h-11 min-w-12 rounded-xl border px-3 text-sm transition ${s === size ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"} ${out ? "line-through opacity-45" : ""}`}>{s}</button>
              );
            })}
          </div>
        </div>
      )}

      {product.preorder && (
        <div className="mt-5 rounded-2xl border border-accent/40 bg-accent/5 p-4 text-sm">
          <p className="font-semibold">Pre-order{product.preorderDate ? `, expected ${preorderDate(product.preorderDate)}` : ""}</p>
          {saving > 0 && <p className="mt-1 text-muted">Pre-order price {formatPrice(price)}. Price after launch {formatPrice(product.compareAt as number)}. You save {formatPrice(saving)}.</p>}
          <p className="mt-1 text-muted">Pay the advance now to reserve yours, and the rest on delivery.</p>
        </div>
      )}

      {compact ? (
        <>
          <div className="mt-4 flex items-center gap-2">
            {stepper}
            <button disabled={!available} onClick={onAdd} className="flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-accent py-3 text-sm font-semibold text-accent-ink transition active:scale-[0.99] disabled:opacity-40">{added ? <><Check size={15} /> Added</> : available ? "Add to cart" : "Sold out"}</button>
            <button disabled={!available} onClick={buyNow} className={`flex-1 rounded-pill bg-ink py-3 text-sm font-semibold text-paper transition active:scale-[0.99] disabled:opacity-40 ${product.preorder ? "btn-preorder" : ""}`}>{product.preorder ? "Pre-order now" : "Buy now"}</button>
          </div>
          {stockNote && <p className={`mt-2 text-xs ${available ? "text-muted" : "text-red-600"}`}>{stockNote}</p>}
        </>
      ) : (
        <>
          <div className="mt-5 flex items-center gap-4">{stepper}{stockNote && <p className={`text-sm ${available ? "text-muted" : "text-red-600"}`}>{stockNote}</p>}</div>
          <div ref={buttons} className="mt-5 grid gap-2.5">
            <button disabled={!available} onClick={onAdd} className="flex items-center justify-center gap-2 rounded-pill bg-accent py-3.5 text-sm font-semibold text-accent-ink transition active:scale-[0.99] disabled:opacity-40">
              {added ? <><Check size={16} /> Added to cart</> : available ? "Add to cart" : "Sold out"}
            </button>
            <button disabled={!available} onClick={buyNow} className={`rounded-pill bg-ink py-3.5 text-sm font-semibold text-paper transition active:scale-[0.99] disabled:opacity-40 ${product.preorder ? "btn-preorder" : ""}`}>{product.preorder ? "Pre-order now" : "Buy now"}</button>
          </div>
        </>
      )}
      {pinned && (
        <Portal>
          <div className="buy-bar pop-in fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl md:hidden">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 pr-1">
                <p className="truncate text-xs text-muted">{product.name}{size ? ` · ${size}` : ""}</p>
                <p className="font-display text-lg font-semibold leading-tight tabular-nums">{formatPrice(price)}</p>
              </div>
              <button disabled={!available} onClick={onAdd} className="rounded-pill bg-accent px-4 py-3 text-sm font-semibold text-accent-ink transition active:scale-[0.98] disabled:opacity-40">{added ? <Check size={16} /> : available ? "Add" : "Sold out"}</button>
              <button disabled={!available} onClick={buyNow} className={`rounded-pill bg-ink px-4 py-3 text-sm font-semibold text-paper transition active:scale-[0.98] disabled:opacity-40 ${product.preorder ? "btn-preorder" : ""}`}>{product.preorder ? "Pre-order" : "Buy now"}</button>
            </div>
          </div>
        </Portal>
      )}
      <p className="mt-3 flex items-center gap-2 text-xs text-muted"><Truck size={14} /> {product.preorder ? "Delivered when it arrives." : "Pay the rest in cash when it arrives."}</p>
      <FreeDeliveryNote className="mt-2" />
      <ListButtons id={product.id} />
    </div>
  );
}
