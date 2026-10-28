"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Facebook, Heart, Instagram, MessageCircle, ShoppingBag, Youtube } from "lucide-react";
import type { Product } from "@/lib/demo-products";
import type { Cat } from "@/lib/catalog";
import type { HeadingLevel } from "@/lib/blocks";
import { Heading } from "./Heading";
import { formatPrice } from "@/lib/config";
import { useCart } from "@/lib/cart";
import { ProductArt } from "./ProductArt";

export type HeroSocial = { facebook?: string; instagram?: string; youtube?: string; whatsapp?: string };
type Props = {
  products: Product[]; categories: Cat[];
  eyebrow?: string; heading: string; sub: string; button: string; tagline: string; level?: HeadingLevel;
  social?: HeroSocial; autoplay?: number; fit?: "cutout" | "card"; showNav?: boolean;
};

/** Mixes a colour with black, so any product colour becomes a deep background that white text can sit on. */
function deep(hex: string, amount: number) {
  const n = parseInt((hex || "#444444").replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const c = (v: number) => Math.round(v * (1 - amount)).toString(16).padStart(2, "0");
  return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

/** Where a product sits, by how far it is from the one on show. The row of products runs along a diagonal. */
const POSES: Record<string, { x: number; y: number; s: number; o: number; blur: number; z: number }> = {
  "0": { x: 50, y: 50, s: 1, o: 1, blur: 0, z: 20 },
  "1": { x: 91, y: 90, s: 0.3, o: 0.95, blur: 0, z: 12 },
  "2": { x: 118, y: 122, s: 0.16, o: 0, blur: 0, z: 1 },
  "-1": { x: 15, y: 13, s: 0.46, o: 0.32, blur: 4, z: 6 },
  "-2": { x: -18, y: -26, s: 0.26, o: 0, blur: 4, z: 1 },
};

export function ProductHero({ products, categories, eyebrow = "", heading, sub, button, tagline, level = "h1", social = {}, autoplay = 6, fit = "cutout", showNav = true }: Props) {
  const { add, setOpen, items } = useCart();
  const [cat, setCat] = useState("all");
  const [cur, setCur] = useState(0);
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [colorPick, setColorPick] = useState<Record<string, number>>({});
  const [resumeAt, setResumeAt] = useState(0);
  const [mounted, setMounted] = useState(false);
  const touch = useRef<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const wheelLock = useRef(0);
  const cur_ = useRef(0);
  useEffect(() => setMounted(true), []);

  const list = useMemo(() => (cat === "all" ? products : products.filter((p) => p.category === cat)).slice(0, 12), [products, cat]);
  const n = list.length;
  const go = useCallback((to: number) => { setCur(n ? ((to % n) + n) % n : 0); setResumeAt(Date.now() + 6000); }, [n]);
  cur_.current = cur;

  // Changes by itself every few seconds. After you touch it, it waits a little before carrying on.
  useEffect(() => {
    if (n < 2 || !autoplay) return;
    const t = window.setInterval(() => {
      if (document.hidden || Date.now() < resumeAt) return;
      setCur((c) => (c + 1) % n);
    }, autoplay * 1000);
    return () => window.clearInterval(t);
  }, [n, autoplay, resumeAt]);

  // The mouse wheel moves through the products while the pointer is on the hero. At the first or last product the page scrolls on as usual.
  useEffect(() => {
    const el = stage.current;
    if (!el || n < 2) return;
    const onWheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(d) < 4) return;
      const c = cur_.current;
      if ((d > 0 && c >= n - 1) || (d < 0 && c <= 0)) return;
      e.preventDefault();
      const now = Date.now();
      if (now - wheelLock.current < 650) return;
      wheelLock.current = now;
      setCur(c + (d > 0 ? 1 : -1));
      setResumeAt(now + 6000);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [n]);

  if (n === 0) return null;
  const p = list[Math.min(cur, n - 1)];
  const sizeList = p.sizes ?? [];
  const size = sizes[p.id] ?? sizeList[1] ?? sizeList[0] ?? "";
  const colorIdx = Math.min(colorPick[p.id] ?? 0, p.colors.length - 1);
  const color = p.colors[colorIdx];
  const variantFor = (sz: string) => p.variants?.find((v) => (p.hasColors === false || v.colorName === color?.name) && (!sz || v.size === sz));
  const sizeOk = (sz: string) => !p.variants?.length || (variantFor(sz)?.stock ?? 0) > 0;
  const cartCount = mounted ? items.reduce((a, i) => a + i.qty, 0) : 0;

  const addToCart = () => {
    const v = variantFor(size);
    add({ id: p.id, variantId: v?.id, name: p.name, color: p.hasColors === false ? "" : color?.name ?? "", size, price: p.basePrice + (v?.priceDelta ?? 0), image: p.image, kind: p.kind, hex: color?.hex }, 1);
    setOpen(true);
  };

  const socials = [
    { href: social.facebook, Icon: Facebook, label: "Facebook" }, { href: social.instagram, Icon: Instagram, label: "Instagram" },
    { href: social.youtube, Icon: Youtube, label: "YouTube" }, { href: social.whatsapp, Icon: MessageCircle, label: "WhatsApp" },
  ].filter((s) => s.href);

  const circle = "grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 backdrop-blur transition hover:bg-white/25";

  return (
    <section aria-roledescription="carousel" aria-label="Featured products" className="mx-auto max-w-7xl px-3 py-4 md:px-8 md:py-6">
      <div
        ref={stage}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(cur + 1); if (e.key === "ArrowLeft") go(cur - 1); }}
        className="relative isolate flex flex-col gap-5 overflow-hidden rounded-3xl p-5 text-white shadow-2xl md:block md:h-[min(80dvh,700px)] md:min-h-[600px] md:gap-0 md:p-0"
        style={{ background: deep(color?.hex, 0.8) }}
      >
        {/* One background layer per product, so the whole card changes colour with a soft fade. */}
        {list.map((q, i) => (
          <div key={q.id} aria-hidden className="absolute inset-0 -z-10 transition-opacity duration-1000" style={{ opacity: i === cur ? 1 : 0, background: `radial-gradient(ellipse 75% 85% at 50% 42%, ${deep(q.colors[Math.min(colorPick[q.id] ?? 0, q.colors.length - 1)]?.hex, 0.38)} 0%, ${deep(q.colors[Math.min(colorPick[q.id] ?? 0, q.colors.length - 1)]?.hex, 0.72)} 62%, ${deep(q.colors[Math.min(colorPick[q.id] ?? 0, q.colors.length - 1)]?.hex, 0.86)} 100%)` }} />
        ))}

        {/* Top row */}
        <div className="relative z-30 order-1 flex items-center justify-between gap-3 md:absolute md:inset-x-[4%] md:top-[5%]">
          <span className="hidden min-w-24 text-xs font-medium uppercase tracking-[0.2em] text-white/70 md:block">{eyebrow}</span>
          {showNav && (
            <nav aria-label="Product groups" className="no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/15 bg-white/10 p-1.5 backdrop-blur-xl">
              {[{ id: "all", label: "All products" }, ...categories].map((c) => (
                <button key={c.id} onClick={() => { setCat(c.id); setCur(0); }} aria-pressed={cat === c.id} className={`shrink-0 rounded-full px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider transition ${cat === c.id ? "bg-white text-black" : "text-white/80 hover:text-white"}`}>{c.label}</button>
              ))}
            </nav>
          )}
          <span className="flex min-w-24 items-center justify-end gap-2">
            <Link href="/wishlist" aria-label="Wishlist" className={circle}><Heart size={15} /></Link>
            <button onClick={() => setOpen(true)} aria-label="Open cart" className={`${circle} relative`}><ShoppingBag size={15} />{cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-black">{cartCount}</span>}</button>
          </span>
        </div>

        {/* Text on the left */}
        <div className="relative z-30 order-2 md:absolute md:left-[4.5%] md:top-[21%] md:w-[33%]">
          <div className="mb-5 hidden gap-2 md:flex">
            <button aria-label="Previous product" onClick={() => go(cur - 1)} className={circle}><ChevronLeft size={16} /></button>
            <button aria-label="Next product" onClick={() => go(cur + 1)} className={circle}><ChevronRight size={16} /></button>
          </div>
          <Heading as={level} className="font-display text-[clamp(1.9rem,3.8vw,3rem)] font-semibold leading-[1.02] tracking-tight">{heading}</Heading>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">{sub}</p>
          <Link href={`/product/${p.slug}`} className="group mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition hover:-translate-y-0.5">
            {button} <ChevronRight size={15} className="transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* The products */}
        <div
          className="relative z-10 order-3 h-[330px] touch-pan-y md:absolute md:inset-0 md:h-auto"
          onPointerDown={(e) => { touch.current = e.clientX; }}
          onPointerUp={(e) => { if (touch.current !== null && Math.abs(e.clientX - touch.current) > 50) go(cur + (e.clientX < touch.current ? 1 : -1)); touch.current = null; }}
        >
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[48%] aspect-square w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_65%)]" />
          {list.map((q, i) => {
            let d = (((i - cur) % n) + n) % n;
            if (d > n / 2) d -= n;
            const pose = POSES[String(Math.max(-2, Math.min(2, d)))];
            const on = d === 0;
            return (
              <div
                key={q.id}
                onClick={() => { if (d === 1) go(cur + 1); if (d === -1) go(cur - 1); }}
                role={Math.abs(d) === 1 ? "button" : undefined}
                aria-label={Math.abs(d) === 1 ? `Show ${q.name}` : undefined}
                className={`absolute w-[min(62%,300px)] md:w-[min(31%,370px)] ${Math.abs(d) === 1 ? "cursor-pointer" : ""}`}
                style={{ left: `${pose.x}%`, top: `${pose.y}%`, zIndex: pose.z, opacity: pose.o, filter: pose.blur ? `blur(${pose.blur}px)` : undefined, transform: `translate(-50%, -50%) scale(${pose.s})`, transition: "all 1100ms cubic-bezier(0.22, 0.8, 0.2, 1)", pointerEvents: Math.abs(d) <= 1 ? "auto" : "none" }}
              >
                <div className={on ? "hero-float" : ""}>
                  {q.image ? (
                    <img src={q.image} alt={on ? q.name : ""} className={fit === "card" ? "aspect-[4/5] w-full rounded-2xl object-cover shadow-2xl" : "aspect-[4/5] w-full object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,0.45)]"} />
                  ) : (
                    <ProductArt bare kind={q.kind} color={q.colors[Math.min(colorPick[q.id] ?? 0, q.colors.length - 1)].hex} className="aspect-[4/5] w-full" />
                  )}
                </div>
                <div aria-hidden className="mx-auto -mt-2 h-4 w-3/4 rounded-[50%] bg-black/55 blur-md" />
              </div>
            );
          })}
        </div>

        {/* Price and size on the right */}
        <div key={p.id} className="hero-fade relative z-30 order-4 md:absolute md:right-[4.5%] md:top-[23%] md:text-right">
          <p className="max-w-[17rem] font-display text-xl font-semibold leading-snug md:ml-auto md:text-2xl">{p.name}</p>
          <p className="mt-1.5 font-display text-4xl font-semibold tracking-tight md:text-[2.6rem]">{formatPrice(p.basePrice)}</p>
          {p.compareAt && p.compareAt > p.basePrice && <p className="font-display text-2xl text-white/80 line-through decoration-2">{formatPrice(p.compareAt)}</p>}
          {p.hasColors !== false && p.colors.length > 1 && (
            <div className="mt-5 flex items-center gap-2.5 md:justify-end">
              <span className="text-xs text-white/75">Color:</span>
              {p.colors.map((c, i) => <button key={c.name} aria-label={c.name} aria-pressed={i === colorIdx} onClick={() => { setColorPick((m) => ({ ...m, [p.id]: i })); setResumeAt(Date.now() + 6000); }} style={{ background: c.hex }} className={`h-7 w-7 rounded-full border border-white/50 transition ${i === colorIdx ? "ring-2 ring-white ring-offset-2 ring-offset-transparent" : "opacity-80 hover:opacity-100"}`} />)}
            </div>
          )}
          {sizeList.length > 0 && (
            <>
              <p className="mt-5 text-xs text-white/75">Choose your size:</p>
              <div className="mt-2.5 flex flex-wrap gap-2 md:justify-end">
                {sizeList.map((sz) => (
                  <button key={sz} onClick={() => setSizes((s) => ({ ...s, [p.id]: sz }))} aria-pressed={sz === size} className={`grid h-11 min-w-11 place-items-center rounded-full px-2 text-sm transition ${sz === size ? "bg-white font-semibold text-black" : "bg-white/10 text-white hover:bg-white/22"} ${sizeOk(sz) ? "" : "line-through opacity-50"}`}>{sz}</button>
                ))}
              </div>
            </>
          )}
          <button onClick={addToCart} className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-semibold backdrop-blur transition hover:bg-white/20"><ShoppingBag size={13} /> Add to cart</button>
        </div>

        {/* Bottom: social links and the line under the product */}
        <div className="relative z-30 order-5 flex items-end justify-between gap-4 md:absolute md:inset-x-[4.5%] md:bottom-[5.5%]">
          <div className="flex min-w-24 gap-3">
            {socials.map(({ href, Icon, label }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-white/75 transition hover:text-white"><Icon size={16} /></a>)}
          </div>
          <p className="text-center font-display text-base leading-snug text-white/90 md:absolute md:bottom-0 md:left-1/2 md:-translate-x-1/2 md:text-lg">{tagline}</p>
          <div className="flex min-w-24 items-center justify-end gap-2 md:hidden">
            <button aria-label="Previous product" onClick={() => go(cur - 1)} className={circle}><ChevronLeft size={16} /></button>
            <button aria-label="Next product" onClick={() => go(cur + 1)} className={circle}><ChevronRight size={16} /></button>
          </div>
          <span className="hidden min-w-24 md:block" />
        </div>
      </div>
    </section>
  );
}
