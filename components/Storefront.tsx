"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/demo-products";
import type { Cat } from "@/lib/catalog";
import { formatPrice } from "@/lib/config";
import { ProductPanel } from "./ProductPanel";
import { ProductArt } from "./ProductArt";
import type { Nudge } from "./3d/HangerRail";

const HangerRail = dynamic(() => import("./3d/HangerRail"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-sm text-muted"><span className="animate-pulse">Hanging the rail...</span></div>,
});

export function Storefront({ products, categories }: { products: Product[]; categories: Cat[] }) {
  const { resolvedTheme } = useTheme();
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [colorIdx, setColorIdx] = useState(0);
  const [view, setView] = useState<"3d" | "2d" | null>(null);
  const [nudge, setNudge] = useState<Nudge>({ n: 0, dir: 1 });
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const weak = (navigator.hardwareConcurrency ?? 4) <= 2;
    setView(reduced || weak ? "2d" : "3d");
  }, []);

  const list = useMemo(() => (category === "all" ? products : products.filter((p) => p.category === category)), [products, category]);
  const selected = list.find((p) => p.id === selectedId) ?? null;

  const select = (id: string | null) => { setSelectedId(id); setColorIdx(0); };
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

  return (
    <div className="stage relative h-[calc(100dvh-6rem)] overflow-hidden">
      <div className="grain pointer-events-none absolute inset-0" />
      <div aria-hidden className={`pointer-events-none absolute inset-0 z-[5] transition-opacity duration-500 ${selected ? "opacity-100" : "opacity-0"}`} style={{ background: "radial-gradient(55% 80% at 36% 52%, transparent 30%, rgba(8,10,14,0.38) 100%)" }} />

      {view !== "2d" && (
        <div className={`pointer-events-none absolute left-5 top-5 z-10 max-w-sm transition-opacity duration-300 max-sm:[&_a]:hidden max-sm:[&_p]:hidden md:left-10 md:top-9 ${selected ? "opacity-0" : "opacity-100"}`}>
        <h1 className="hero-in font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">Pick it off<br />the rail.</h1>
        <p className="hero-in-2 mt-4 max-w-xs text-sm leading-relaxed text-muted md:text-base">{products.length} pieces for you, your bed and your home. Drag the rail, then tap anything to see it up close.</p>
        <div className="hero-in-3 pointer-events-auto mt-6 flex flex-wrap gap-2">
          <Link href="/shop" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper shadow-lg transition hover:-translate-y-0.5">Shop everything</Link>
          <Link href="/shop?tag=new" className="rounded-full border border-line bg-surface/80 px-6 py-3 text-sm font-medium backdrop-blur transition hover:-translate-y-0.5">New in</Link>
        </div>
      </div>
      )}

      {view === "3d" && list.length > 0 && (
        <HangerRail products={list} selectedId={selectedId} colorHex={selected?.colors[colorIdx]?.hex ?? "#ffffff"} onSelect={select} dark={resolvedTheme === "dark"} nudge={nudge} onIndex={setIdx} />
      )}
      {list.length === 0 && <p className="absolute inset-0 grid place-items-center text-sm text-muted">No products here yet.</p>}

      {view === "3d" && list.length > 1 && !selected && (
        <>
          <button aria-label="Previous" onClick={() => go(-1)} disabled={idx === 0} className={`${arrow} left-5 disabled:opacity-30`}><ChevronLeft size={20} /></button>
          <button aria-label="Next" onClick={() => go(1)} disabled={idx >= list.length - 1} className={`${arrow} right-5 disabled:opacity-30`}><ChevronRight size={20} /></button>
        </>
      )}

      {view === "2d" && (
        <div className="absolute inset-0 overflow-y-auto px-5 pb-28 pt-8 md:px-10 md:pt-12">
          <div className="mb-10 max-w-md">
        <h1 className="hero-in font-display text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">Pick it off<br />the rail.</h1>
        <p className="hero-in-2 mt-4 max-w-xs text-sm leading-relaxed text-muted md:text-base">{products.length} pieces for you, your bed and your home. Drag the rail, then tap anything to see it up close.</p>
        <div className="hero-in-3 pointer-events-auto mt-6 flex flex-wrap gap-2">
          <Link href="/shop" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper shadow-lg transition hover:-translate-y-0.5">Shop everything</Link>
          <Link href="/shop?tag=new" className="rounded-full border border-line bg-surface/80 px-6 py-3 text-sm font-medium backdrop-blur transition hover:-translate-y-0.5">New in</Link>
        </div>
      </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {list.map((p) => (
              <button key={p.id} onClick={() => select(p.id)} className="group text-left">
                {p.image ? <img src={p.image} alt={p.name} loading="lazy" className="aspect-[4/5] w-full rounded-2xl border border-line object-cover transition group-hover:-translate-y-1" /> : <ProductArt kind={p.kind} color={p.colors[0].hex} className="aspect-[4/5] w-full rounded-2xl border border-line transition group-hover:-translate-y-1" />}
                <p className="mt-3 text-sm font-medium">{p.name}</p>
                <p className="text-sm text-muted">{formatPrice(p.basePrice)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && <ProductPanel key={selected.id} product={selected} colorIdx={colorIdx} onColor={setColorIdx} onClose={() => select(null)} />}

      <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center px-3">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-surface/80 p-1.5 shadow-lg backdrop-blur-xl">
          {[{ id: "all", label: "All" }, ...categories].map((c) => (
            <button key={c.id} onClick={() => pick(c.id)} aria-pressed={category === c.id} className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${category === c.id ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}>{c.label}</button>
          ))}
          {view === "3d" && list.length > 0 && <span aria-live="polite" className="shrink-0 border-l border-line px-3 text-sm tabular-nums text-muted">{Math.min(idx + 1, list.length)} / {list.length}</span>}
          {view && <button onClick={() => setView(view === "3d" ? "2d" : "3d")} className="shrink-0 rounded-full px-3 py-2 text-sm text-muted hover:text-ink">{view === "3d" ? "Grid" : "3D"}</button>}
        </div>
      </div>
    </div>
  );
}
