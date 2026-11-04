"use client";

import Link from "next/link";
import { useState } from "react";
import { Banknote, Play, RotateCcw, Truck } from "lucide-react";
import type { Product } from "@/lib/demo-products";
import { OfferCountdown } from "./OfferCountdown";
import { TagBadge } from "./TagBadge";
import { ProductBuy } from "./ProductBuy";
import { ProductArt } from "./ProductArt";
import { ProductCard } from "./ProductCard";
import { SITE_URL } from "@/lib/config";

export function ProductDetail({ product, related, pairs, reviews, bundle, whatsapp, category }: { product: Product; related: Product[]; pairs: Product[]; reviews: React.ReactNode; bundle?: React.ReactNode; whatsapp?: string; category?: { id: string; label: string } }) {
  const [colorIdx, setColorIdx] = useState(0);
  const [img, setImg] = useState(0);
  const images = product.images ?? [];
  // A video, when there is one, takes the first slot so it plays before anyone sees the photos.
  const off = product.video ? 1 : 0;
  const isVideo = off === 1 && img === 0;
  const shown = images[img - off];
  const [zoom, setZoom] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:underline">Home</Link> / <Link href="/shop" className="hover:underline">Shop</Link> / {category && <><Link href={`/category/${category.id}`} className="hover:underline">{category.label}</Link> / </>}<span className="text-ink">{product.name}</span>
      </nav>
      <div className="grid gap-8 md:grid-cols-2 md:gap-14">
        <div className="md:sticky md:top-24 md:self-start">
          {isVideo ? (
            <div className="overflow-hidden rounded-[18px] bg-black">
              <video key={product.video} src={product.video} poster={images[0]?.url} controls autoPlay muted loop playsInline preload="metadata" className="aspect-[4/5] w-full object-contain" />
            </div>
          ) : shown ? (
            <div
              style={{ background: `color-mix(in srgb, ${product.colors[colorIdx]?.hex ?? product.colors[0].hex} 17%, var(--surface))` }} className="overflow-hidden rounded-[18px]"
              onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); }}
              onMouseLeave={() => setZoom(null)}
            >
              <img src={shown.url} alt={shown.alt} style={zoom ? { transformOrigin: zoom, transform: "scale(1.7)" } : undefined} className="aspect-[4/5] w-full cursor-zoom-in object-contain p-[8%] drop-shadow-[0_22px_24px_rgba(15,31,28,0.22)] transition-transform duration-200" />
            </div>
          ) : (
            <ProductArt kind={product.kind} color={product.colors[colorIdx]?.hex ?? product.colors[0].hex} className="aspect-[4/5] w-full rounded-3xl" />
          )}
          {images.length + off > 1 && (
            <div className="mt-3 flex gap-2 no-scrollbar overflow-x-auto">
              {off === 1 && (
                <button aria-label="Play video" aria-pressed={img === 0} onClick={() => setImg(0)} className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-black ${img === 0 ? "border-ink" : "border-line"}`}>
                  {images[0] && <img src={images[0].url} alt="" className="h-full w-full object-cover opacity-80" />}
                  <span aria-hidden className="absolute inset-0 grid place-items-center"><span className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-black"><Play size={13} fill="currentColor" /></span></span>
                </button>
              )}
              {images.map((im, i) => (
                <button key={im.url} aria-label={`Image ${i + 1}`} aria-pressed={i + off === img} onClick={() => setImg(i + off)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border ${i + off === img ? "border-ink" : "border-line"}`}>
                  <img src={im.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-bold leading-[1.02]">{product.name}</h1>
          {product.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.tags.map((t) => <TagBadge key={t} tag={t} size="md" />)}
            </div>
          )}
          {product.offerEndsAt && <div className="mt-5"><OfferCountdown endsAt={product.offerEndsAt} /></div>}
          <div className="mt-6"><ProductBuy product={product} colorIdx={colorIdx} onColor={setColorIdx} /></div>
          {whatsapp && <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, I am interested in ${product.name}: ${SITE_URL}/product/${product.slug}`)}`} target="_blank" rel="noopener noreferrer" className="mt-4 block rounded-pill border border-line py-3 text-center text-sm font-medium hover:bg-paper">Ask or order on WhatsApp</a>}
          <div className="mt-8 border-t border-line pt-6">
            <h2 className="text-sm font-medium">About this product</h2>
            <p className="mt-2 max-w-prose whitespace-pre-line text-sm leading-relaxed text-muted">{product.description}</p>
          </div>
          <ul className="mt-6 grid gap-3 rounded-2xl bg-surface p-4 text-sm">
            {[[Banknote, "Cash on delivery", "Check your parcel, then pay."], [Truck, "Delivery across Bangladesh", "The fee is shown at checkout."], [RotateCcw, "Wrong or damaged item?", "Tell us and we will make it right."]].map(([Icon, t, d]) => {
              const I = Icon as typeof Truck;
              return <li key={t as string} className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent"><I size={16} /></span><span><span className="block font-medium">{t as string}</span><span className="text-muted">{d as string}</span></span></li>;
            })}
          </ul>
        </div>
      </div>

      {bundle}

      {pairs.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold">Goes well with</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4">{pairs.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      )}

      {reviews}

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-semibold">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4">{related.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      )}
    </main>
  );
}
