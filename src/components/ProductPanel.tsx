"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { Product } from "@/lib/demo-products";
import { ProductBuy } from "./ProductBuy";

type Props = { product: Product; colorIdx: number; onColor: (i: number) => void; onClose: () => void };

const sum = "flex cursor-pointer list-none items-center justify-between py-3 text-sm font-medium";

export function ProductPanel({ product, colorIdx, onColor, onClose }: Props) {
  return (
    <section aria-label={product.name} className="panel-in absolute inset-x-3 bottom-3 z-20 max-h-[78%] overflow-y-auto rounded-3xl border border-line bg-surface/95 p-6 shadow-2xl backdrop-blur-xl md:inset-x-auto md:bottom-6 md:right-6 md:top-6 md:max-h-none md:w-[390px]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold leading-tight">{product.name}</h2>
        <button aria-label="Close" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-paper"><X size={18} /></button>
      </div>
      {product.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.tags.map((t) => <span key={t} className="rounded-full border border-line px-2.5 py-0.5 text-xs capitalize text-muted">{t}</span>)}
        </div>
      )}
      <div className="mt-4"><ProductBuy product={product} colorIdx={colorIdx} onColor={onColor} /></div>

      <div className="mt-6 divide-y divide-line border-t border-line">
        <details open>
          <summary className={sum}>Description</summary>
          <p className="whitespace-pre-line pb-3 text-sm leading-relaxed text-muted">{product.description}</p>
        </details>
        <details>
          <summary className={sum}>Delivery and payment</summary>
          <p className="pb-3 text-sm leading-relaxed text-muted">Pay in cash when your order arrives. Delivery fees for inside and outside Dhaka are shown at checkout.</p>
        </details>
      </div>
      <Link href={`/product/${product.slug}`} className="mt-4 block rounded-full border border-line py-3 text-center text-sm font-medium hover:bg-paper">View full details</Link>
    </section>
  );
}
