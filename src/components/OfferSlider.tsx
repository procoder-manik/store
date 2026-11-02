"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Banner, BannerTemplate } from "@/lib/banner-config";

export type OfferSize = "strip" | "hero" | "band" | "square";

const FRAME: Record<OfferSize, string> = {
  strip: "h-11 md:h-14",
  hero: "aspect-[16/10] sm:aspect-[21/8] md:aspect-[3/1]",
  band: "aspect-[16/8] md:aspect-[4/1]",
  square: "aspect-square",
};
const DESIGN: Record<string, string> = {
  river: "bg-[#12332d] text-[#f5f5f1]",
  dusk: "bg-gradient-to-r from-[#7c2d12] via-[#c2541c] to-[#e39a3b] text-white",
  gold: "bg-[#f3ead6] text-[#3a2c12]",
  ink: "bg-[#111111] text-white",
  sand: "bg-[#e7e0d4] text-[#2b2620]",
  theme: "bg-accent text-accent-ink",
  glass: "banner-glass text-ink",
  flash: "bg-gradient-to-br from-[#b3122a] to-[#2a0a12] text-white",
  noir: "bg-[#0d0d0f] text-[#e6c88a]",
  rose: "bg-gradient-to-br from-[#f7e4e1] to-[#f1d3cf] text-[#4a2024]",
  sky: "bg-gradient-to-br from-[#dfeefa] to-[#c7def2] text-[#12324f]",
};
// These read best with the words in the middle.
const CENTERED = new Set(["flash", "noir", "glass"]);

function Slide({ b, size }: { b: Banner; size: OfferSize }) {
  const strip = size === "strip";
  // A picture you designed stays clean, unless you also typed words to show on it.
  const words = (b.design !== "image" || !b.image) && (b.title || b.subtitle);
  const overlay = b.design === "image" && b.image && b.title;
  const inner = (
    <>
      {b.image && b.design === "image" && <img src={b.image} alt={b.title} className="absolute inset-0 h-full w-full object-cover" />}
      {overlay && <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />}
      {(words || overlay) && (
        strip ? (
          <div className="relative flex h-full items-center justify-center gap-3 px-4 text-center text-[13px] md:text-sm">
            <span className="truncate font-medium">{b.title}</span>
            {b.subtitle && <span className="hidden truncate opacity-80 md:inline">{b.subtitle}</span>}
            {b.button && <span className="shrink-0 underline underline-offset-4">{b.button}</span>}
          </div>
        ) : (
          <div className={`relative flex h-full flex-col justify-center gap-2 p-6 md:gap-3 md:px-[6%] ${CENTERED.has(b.design) || size === "square" ? "items-center text-center" : ""}`}>
            <p className="max-w-2xl font-display text-[clamp(1.6rem,1rem+3.2vw,4rem)] font-normal leading-[1.05]">{b.title}</p>
            {b.subtitle && <p className="max-w-xl text-sm opacity-85 md:text-lg">{b.subtitle}</p>}
            {b.button && <span className="mt-1 w-fit rounded-full border border-current px-6 py-2.5 text-sm font-medium md:mt-3">{b.button}</span>}
          </div>
        )
      )}
    </>
  );
  const cls = `absolute inset-0 block ${b.design !== "image" || !b.image ? DESIGN[b.design] ?? DESIGN.river : "text-white"}`;
  return b.link ? <Link href={b.link} aria-label={b.title || "Offer"} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

/** Offers that change by themselves, with no arrows. It stops while the pointer rests on it, and for visitors who ask for less motion. */
export function OfferSlider({ banners, size = "hero" }: { banners: Banner[]; size?: OfferSize }) {
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = banners.length;
  useEffect(() => {
    if (n < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => { if (!document.hidden) setCur((c) => (c + 1) % n); }, 5000);
    return () => window.clearInterval(t);
  }, [n, paused]);
  if (n === 0) return null;
  const at = Math.min(cur, n - 1);
  return (
    <div role="group" aria-roledescription="carousel" aria-label="Offers" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} className={`relative w-full overflow-hidden ${FRAME[size]}`}>
      {banners.map((b, i) => (
        <div key={b.id} aria-hidden={i !== at} inert={i !== at} style={{ opacity: i === at ? 1 : 0, zIndex: i === at ? 1 : 0 }} className="absolute inset-0 transition-opacity duration-700">
          <Slide b={b} size={size} />
        </div>
      ))}
    </div>
  );
}

/** A group of banners placed by name, from a shortcode or a page section. Uses the banners it is given, or asks the server for them. */
export function OfferSlot({ slot, banners, size = "hero" }: { slot: string; banners?: Banner[]; size?: OfferSize }) {
  const [list, setList] = useState<Banner[] | null>(banners ? banners.filter((b) => b.slot === slot) : null);
  useEffect(() => {
    if (banners) return;
    let live = true;
    fetch(`/api/banners?slot=${encodeURIComponent(slot)}`).then((r) => r.json()).then((d) => { if (live) setList(d.items ?? []); }).catch(() => { if (live) setList([]); });
    return () => { live = false; };
  }, [slot, banners]);
  return list ? <OfferSlider banners={list} size={size} /> : null;
}

/** Shows once per visit, a moment after the page opens. */
export function BannerPopup({ banners }: { banners: Banner[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (banners.length === 0) return;
    try { if (sessionStorage.getItem("banner-popup-seen")) return; } catch { /* storage blocked */ }
    const t = window.setTimeout(() => { setOpen(true); try { sessionStorage.setItem("banner-popup-seen", "1"); } catch { /* storage blocked */ } }, 3000);
    return () => window.clearTimeout(t);
  }, [banners.length]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);
  if (!open || banners.length === 0) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Offer" className="fade-in fixed inset-0 z-[75] grid place-items-center bg-black/55 p-5" onClick={() => setOpen(false)}>
      <div onClick={(e) => e.stopPropagation()} className="pop-in relative aspect-square w-full max-w-md overflow-hidden rounded-[18px] shadow-2xl">
        <button aria-label="Close offer" onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/45 text-white"><X size={16} /></button>
        <Slide b={banners[0]} size="square" />
      </div>
    </div>
  );
}

/** A small live picture of a template, for choosing in Admin. */
export function TemplateCard({ t, slot, square = false, size = square ? "square" : "band" }: { t: BannerTemplate; slot: string; square?: boolean; size?: OfferSize }) {
  const q = new URLSearchParams({ slot, title: t.title, text: t.text, button: t.button, link: t.link, design: t.design });
  return (
    <Link href={`/admin/banners?${q}#banner-form`} className="group grid gap-1.5 text-left">
      <span className={`relative block overflow-hidden rounded-xl border border-line text-[10px] transition group-hover:border-ink/40 ${square ? "aspect-square" : "aspect-[2/1]"}`}>
        <span className={`tpl-mini absolute inset-0 block ${size}`}><Slide b={{ id: t.id, title: t.title, subtitle: t.text, image: "", link: "", button: t.button, slot, design: t.design }} size={size} /></span>
      </span>
      <span className="text-xs font-medium">{t.name}</span>
    </Link>
  );
}
