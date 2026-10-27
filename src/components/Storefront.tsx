"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/demo-products";
import type { Cat } from "@/lib/catalog";
import { formatPrice } from "@/lib/config";
import { ProductPanel } from "./ProductPanel";
import { ProductArt } from "./ProductArt";
import type { Nudge } from "./3d/HangerRail";

const CardCarousel = dynamic(() => import("./3d/CardCarousel"), { ssr: false, loading: () => <div className="absolute inset-0 grid place-items-center text-sm text-muted"><span className="animate-pulse">Loading...</span></div> });
const HangerRail = dynamic(() => import("./3d/HangerRail"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-sm text-muted"><span className="animate-pulse">Hanging the rail...</span></div>,
});

export type RailVariant = "hanger" | "arc" | "coverflow" | "diagonal" | "stack" | "wave";
export type StorefrontProps = {
  products: Product[]; categories: Cat[];
  variant?: RailVariant; showHero?: boolean; heading?: string; sub?: string;
  button?: string; link?: string; button2?: string; link2?: string; level?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

export function Storefront({ products, categories, variant = "hanger", showHero = true, heading = "Pick it off the rail.", sub, button = "Shop everything", link = "/shop", button2 = "New in", link2 = "/shop?tag=new", level = "h1" }: StorefrontProps) {
  const Head = level;
  const { resolvedTheme } = useTheme();
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [colorIdx, setColorIdx] = useState(0);
  const [view, setView] = useState<"3d" | "2d" | null>(null);
  const [nudge, setNudge] = useState<Nudge>({ n: 0, dir: 1 });
  const [idx, setIdx] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const weak = (navigator.hardwareConcurrency ?? 4) <= 2;
    setView(reduced || weak ? "2d" : "3d");
  }, []);

  const list = useMemo(() => (category === "all" ? products : products.filter((p) => p.category === category)), [products, category]);
  const selected = list.find((p) => p.id === selectedId) ?? null;

  const select = (id: string | null) => {
    setSelectedId(id);
    setColorIdx(0);
    // On a phone, bring the whole rail into view so the product and its buttons fit on one screen.
    if (id && window.innerWidth < 768) window.setTimeout(() => { const el = stageRef.current; if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: "smooth" }); }, 50);
  };
  const pick = (c: string) => { setCategory(c); setSelectedId(null); setColorIdx(0); setIdx(0); };
  const go = (dir: 1 | -1) => {
    if (selectedId) {
      const p = list[list.findIndex((x) => x.id === selectedId) + dir];
      if (p) select(p.id);
    } else setNudge((n) => ({ n: n.n + 1, dir }));
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if (e.key === "Escape") setSelectedId(null);
      if (view === "3d" && e.key === "ArrowRight") go(1);
      if (view === "3d" && e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const arrow = "absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface/80 shadow-lg backdrop-blur-xl transition hover:bg-surface md:grid";
  const pills = (
    <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-pill border border-line bg-surface/85 p-1.5 shadow-lg backdrop-blur-xl">
      {[{ id: "all", label: "All" }, ...categories].map((c) => (
        <button key={c.id} onClick={() => pick(c.id)} aria-pressed={category === c.id} className={`shrink-0 rounded-pill px-4 py-2 text-sm transition ${category === c.id ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}>{c.label}</button>
      ))}
      {view === "3d" && list.length > 0 && <span aria-live="polite" className="shrink-0 border-l border-line px-3 text-sm tabular-nums text-muted">{Math.min(idx + 1, list.length)} / {list.length}</span>}
      {view && <button onClick={() => { setSelectedId(null); setView(view === "3d" ? "2d" : "3d"); }} className="shrink-0 rounded-pill px-3 py-2 text-sm text-muted hover:text-ink">{view === "3d" ? "Grid" : "3D"}</button>}
    </div>
  );
  const panel = selected && <ProductPanel key={selected.id} product={selected} colorIdx={colorIdx} onColor={setColorIdx} onClose={() => select(null)} />;

  return (
    <>
      {showHero && (
        <section className="mx-auto flex max-w-7xl flex-col gap-6 px-5 pb-6 pt-10 md:flex-row md:items-end md:justify-between md:px-10 md:pb-8 md:pt-14">
          <div className="max-w-2xl">
            <Head className="hero-in font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">{heading}</Head>
            <p className="hero-in-2 mt-3 max-w-lg text-sm leading-relaxed text-muted md:text-base">{sub ?? `${products.length} pieces for you, your bed and your home. Drag the rail, then tap anything to see it up close.`}</p>
          </div>
          <div className="hero-in-3 flex flex-wrap gap-2">
            {button && link && <Link href={link} className="rounded-pill bg-ink px-6 py-3 text-sm font-semibold text-paper shadow-lg transition hover:-translate-y-0.5">{button}</Link>}
            {button2 && link2 && <Link href={link2} className="rounded-pill border border-line bg-surface px-6 py-3 text-sm font-medium transition hover:-translate-y-0.5">{button2}</Link>}
          </div>
        </section>
      )}

      {view === "2d" ? (
        <section className="mx-auto max-w-7xl px-5 pb-10 md:px-10">
          <div className="mb-6 flex justify-center md:justify-start">{pills}</div>
          {list.length === 0 && <p className="py-16 text-center text-sm text-muted">No products here yet.</p>}
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {list.map((p) => (
              <button key={p.id} onClick={() => select(p.id)} className="group text-left">
                {p.image ? <img src={p.image} alt={p.name} loading="lazy" className="aspect-[4/5] w-full rounded-2xl border border-line object-cover transition group-hover:-translate-y-1" /> : <ProductArt kind={p.kind} color={p.colors[0].hex} className="aspect-[4/5] w-full rounded-2xl border border-line transition group-hover:-translate-y-1" />}
                <p className="mt-3 text-sm font-medium">{p.name}</p>
                <p className="text-sm text-muted">{formatPrice(p.basePrice)}</p>
              </button>
            ))}
          </div>
          {selected && (
            <div className="fixed inset-0 z-40">
              <div className="absolute inset-0 bg-black/40" onClick={() => select(null)} />
              {panel}
            </div>
          )}
        </section>
      ) : (
        <div className="px-3 pb-6 md:px-8 md:pb-10">
          <div ref={stageRef} className="stage relative mx-auto scroll-mt-20 h-[78dvh] min-h-[460px] max-h-[680px] max-w-7xl overflow-hidden rounded-3xl border border-line shadow-sm md:h-[clamp(440px,calc(100dvh-21rem),660px)]">
            <div className="grain pointer-events-none absolute inset-0" />
            <div aria-hidden className={`pointer-events-none absolute inset-0 z-[5] transition-opacity duration-500 ${selected ? "opacity-100" : "opacity-0"}`} style={{ background: "radial-gradient(55% 80% at 36% 52%, transparent 30%, rgba(8,10,14,0.38) 100%)" }} />
            {view === "3d" && list.length > 0 && (variant === "hanger" ? (
              <HangerRail products={list} selectedId={selectedId} colorHex={selected?.colors[colorIdx]?.hex ?? "#ffffff"} onSelect={select} dark={resolvedTheme === "dark"} nudge={nudge} onIndex={setIdx} />
            ) : (
              <CardCarousel layout={variant} products={list} selectedId={selectedId} colorHex="#ffffff" onSelect={select} dark={resolvedTheme === "dark"} nudge={nudge} onIndex={setIdx} />
            ))}
            {list.length === 0 && <p className="absolute inset-0 grid place-items-center text-sm text-muted">No products here yet.</p>}
            {view === "3d" && list.length > 1 && !selected && (
              <>
                <button aria-label="Previous" onClick={() => go(-1)} disabled={idx === 0} className={`${arrow} left-5 disabled:opacity-30`}><ChevronLeft size={20} /></button>
                <button aria-label="Next" onClick={() => go(1)} disabled={idx >= list.length - 1} className={`${arrow} right-5 disabled:opacity-30`}><ChevronRight size={20} /></button>
              </>
            )}
            {panel}
            <div className={`absolute inset-x-0 bottom-4 z-10 flex justify-center px-3 transition-opacity duration-300 ${selected ? "pointer-events-none opacity-0" : "opacity-100"}`}>{pills}</div>
          </div>
        </div>
      )}
    </>
  );
}
