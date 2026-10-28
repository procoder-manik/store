"use client";

import type { HeadingLevel } from "@/lib/blocks";
import { Heading } from "./Heading";
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

/** Mixes a colour with black, so any product colour becomes a deep background that white text can sit on. */
function deep(hex: string, amount: number) {
  const n = parseInt((hex || "#444444").replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const c = (v: number) => Math.round(v * (1 - amount)).toString(16).padStart(2, "0");
  return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

export type RailVariant = "hanger" | "hanger-wire" | "hanger-gold" | "hanger-velvet" | "arc" | "coverflow" | "diagonal" | "stack" | "wave";
export type StorefrontProps = {
  products: Product[]; categories: Cat[];
  variant?: RailVariant; showHero?: boolean; heading?: string; sub?: string;
  button?: string; link?: string; button2?: string; link2?: string; defaultView?: "3d" | "grid"; level?: HeadingLevel;
  /** Full width: one deep colour background that follows the product in front and fades as the rail moves. */
  full?: boolean;
};

export function Storefront({ products, categories, variant = "hanger", showHero = true, heading = "Pick it off the rail.", sub, button = "Shop everything", link = "/shop", button2 = "New in", link2 = "/shop?tag=new", defaultView = "3d", level = "h1", full = false }: StorefrontProps) {
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
    setView(reduced || weak || defaultView === "grid" ? "2d" : "3d");
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

  const arrow = `absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border shadow-lg backdrop-blur-xl transition md:grid ${full ? "border-white/25 bg-white/10 text-white hover:bg-white/20" : "border-line bg-surface/80 hover:bg-surface"}`;
  const pills = (
    <div className={`no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-full border p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)] backdrop-blur-xl ${full ? "border-white/20 bg-white/10" : "border-white/55 bg-white/30 dark:border-white/15 dark:bg-white/10"}`}>
      {[{ id: "all", label: "All products" }, ...categories].map((c) => (
        <button key={c.id} onClick={() => pick(c.id)} aria-pressed={category === c.id} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition ${category === c.id ? "bg-black/45 text-white shadow-inner backdrop-blur-md" : (full ? "text-white/80 hover:text-white" : "text-ink/75 hover:bg-white/35 hover:text-ink dark:text-white/75 dark:hover:text-white")}`}>{c.label}</button>
      ))}
      {view === "3d" && list.length > 0 && <span aria-live="polite" className={`shrink-0 px-3 text-[13px] tabular-nums ${full ? "text-white/65" : "text-ink/60 dark:text-white/60"}`}>{Math.min(idx + 1, list.length)} / {list.length}</span>}
      {view && <button onClick={() => { setSelectedId(null); setView(view === "3d" ? "2d" : "3d"); }} className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-medium transition ${full ? "text-white/80 hover:text-white" : "text-ink/75 hover:bg-white/35 hover:text-ink dark:text-white/75"}`}>{view === "3d" ? "Grid" : "3D"}</button>}
    </div>
  );
  const panel = selected && <ProductPanel key={selected.id} product={selected} colorIdx={colorIdx} onColor={setColorIdx} onClose={() => select(null)} />;

  // Full width: a deep background in the colour of the product in front. Each product has its own layer, so the colour fades as the rail moves.
  const cur = selected ? Math.max(0, list.findIndex((p) => p.id === selectedId)) : Math.min(idx, Math.max(0, list.length - 1));
  const bg = full && (
    <>
      {list.map((q, i) => {
        const hex = (i === cur && selected ? selected.colors[colorIdx]?.hex : q.colors[0]?.hex) ?? "#334155";
        return <div key={q.id} aria-hidden className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-1000" style={{ opacity: i === cur ? 1 : 0, background: `radial-gradient(ellipse 80% 90% at 50% 42%, ${deep(hex, 0.4)} 0%, ${deep(hex, 0.74)} 60%, ${deep(hex, 0.9)} 100%)` }} />;
      })}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,255,255,0.10),transparent)]" />
    </>
  );

  const content = (
    <>
      {showHero && (
        <section className={`mx-auto max-w-7xl pb-4 pt-7 md:pb-5 md:pt-10 ${full ? "px-3 md:px-8" : "px-5 md:px-10"}`}>
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="max-w-2xl">
              <p className={`hero-in flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] ${full ? "text-white/70" : "text-muted"}`}>
                <span className="h-px w-8 bg-accent" />{products.length} pieces in store
              </p>
              <Heading as={level} className="hero-in mt-3 font-display text-[clamp(2.2rem,5.2vw,3.8rem)] font-semibold leading-[0.98] tracking-tight">{heading}</Heading>
              <p className={`hero-in-2 mt-3 max-w-md text-base leading-relaxed ${full ? "text-white/80" : "text-muted"}`}>{sub ?? "Clothing, bedding and home decor, delivered across Bangladesh. Drag the rail, then tap anything to see it up close."}</p>
              <div className="hero-in-3 mt-5 flex flex-wrap items-center gap-3">
                {button && link && <Link href={link} className={`rounded-pill px-7 py-3.5 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5 ${full ? "bg-white text-black" : "bg-ink text-paper"}`}>{button}</Link>}
                {button2 && link2 && <Link href={link2} className={`group inline-flex items-center gap-1.5 rounded-pill border px-6 py-3.5 text-sm font-medium transition hover:-translate-y-0.5 ${full ? "border-white/30 bg-white/10 text-white" : "border-line bg-surface"}`}>{button2}<span aria-hidden className="transition group-hover:translate-x-0.5">&rarr;</span></Link>}
              </div>
            </div>
            <ul className={`hero-in-3 hidden shrink-0 gap-5 border-l pl-7 text-sm md:grid ${full ? "border-white/20 [&_.text-muted]:text-white/70" : "border-line"}`}>
              <li><span className="block font-display text-xl font-semibold">Cash on delivery</span><span className="text-muted">Check it, then pay</span></li>
              <li><span className="block font-display text-xl font-semibold">All 64 districts</span><span className="text-muted">Inside and outside Dhaka</span></li>
            </ul>
          </div>
        </section>
      )}

      {view === "2d" ? (
        <section className={`mx-auto max-w-7xl pb-10 ${full ? "px-3 md:px-8" : "px-5 md:px-10"}`}>
          <div className="mb-6 flex justify-center md:justify-start">{pills}</div>
          {list.length === 0 && <p className="py-16 text-center text-sm text-muted">No products here yet.</p>}
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {list.map((p) => (
              <button key={p.id} onClick={() => select(p.id)} className="group text-left">
                {p.image ? <img src={p.image} alt={p.name} loading="lazy" className="aspect-[4/5] w-full rounded-2xl border border-line object-cover transition group-hover:-translate-y-1" /> : <ProductArt kind={p.kind} color={p.colors[0].hex} className="aspect-[4/5] w-full rounded-2xl border border-line transition group-hover:-translate-y-1" />}
                <p className="mt-3 text-sm font-medium">{p.name}</p>
                <p className={`text-sm ${full ? "text-white/70" : "text-muted"}`}>{formatPrice(p.basePrice)}</p>
              </button>
            ))}
          </div>
          {selected && (
            <div className="fixed inset-0 z-40 text-ink">
              <div className="absolute inset-0 bg-black/40" onClick={() => select(null)} />
              {panel}
            </div>
          )}
        </section>
      ) : (
        <div className={full ? "pb-6 md:pb-10" : "px-3 pb-6 md:px-8 md:pb-10"}>
          <div ref={stageRef} className={`relative scroll-mt-20 h-[78dvh] min-h-[460px] max-h-[680px] overflow-hidden md:h-[clamp(430px,calc(100dvh-19rem),640px)] ${full ? "" : "stage mx-auto max-w-7xl rounded-3xl border border-line shadow-sm"}`}>
            {!full && <div className="grain pointer-events-none absolute inset-0" />}
            <div aria-hidden className={`pointer-events-none absolute inset-0 z-[5] transition-opacity duration-500 ${selected ? "opacity-100" : "opacity-0"}`} style={{ background: "radial-gradient(55% 80% at 36% 52%, transparent 30%, rgba(8,10,14,0.38) 100%)" }} />
            {view === "3d" && list.length > 0 && (variant.startsWith("hanger") ? (
              <HangerRail products={list} selectedId={selectedId} colorHex={selected?.colors[colorIdx]?.hex ?? "#ffffff"} onSelect={select} dark={full || resolvedTheme === "dark"} nudge={nudge} onIndex={setIdx} style={variant === "hanger-wire" ? "wire" : variant === "hanger-gold" ? "gold" : variant === "hanger-velvet" ? "velvet" : "wood"} />
            ) : (
              <CardCarousel layout={variant as "arc" | "coverflow" | "diagonal" | "stack" | "wave"} products={list} selectedId={selectedId} colorHex="#ffffff" onSelect={select} dark={full || resolvedTheme === "dark"} nudge={nudge} onIndex={setIdx} />
            ))}
            {list.length === 0 && <p className="absolute inset-0 grid place-items-center text-sm text-muted">No products here yet.</p>}
            {view === "3d" && list.length > 1 && !selected && (
              <>
                <button aria-label="Previous" onClick={() => go(-1)} disabled={idx === 0} className={`${arrow} ${full ? "left-[var(--g,1.25rem)]" : "left-5"} disabled:opacity-30`}><ChevronLeft size={20} /></button>
                <button aria-label="Next" onClick={() => go(1)} disabled={idx >= list.length - 1} className={`${arrow} ${full ? "right-[var(--g,1.25rem)]" : "right-5"} disabled:opacity-30`}><ChevronRight size={20} /></button>
              </>
            )}
            {full ? <div className="pointer-events-none absolute inset-0 z-20 mx-auto max-w-7xl text-ink [&>*]:pointer-events-auto">{panel}</div> : panel}
            <div className={`absolute inset-x-0 bottom-4 z-10 flex justify-center px-3 transition-opacity duration-300 ${selected ? "pointer-events-none opacity-0" : "opacity-100"}`}>{pills}</div>
          </div>
        </div>
      )}
    </>
  );

  return full ? <div className="relative isolate overflow-hidden bg-[#10141b] text-white">{bg}{content}</div> : content;
}
