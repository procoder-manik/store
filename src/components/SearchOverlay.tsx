"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { Kind } from "@/lib/demo-products";
import { formatPrice } from "@/lib/config";
import { sized } from "@/lib/utils";
import { ProductArt } from "./ProductArt";
import { Portal, useOverlay } from "./Portal";

type Hit = { name: string; slug: string; price: number; compareAt: number | null; image: string; kind: Kind; color: string };
type Cat = { id: string; label: string };

function Row({ h, id, active, onPick, onHover }: { h: Hit; id: string; active: boolean; onPick: () => void; onHover: () => void }) {
  return (
    <Link id={id} role="option" aria-selected={active} href={`/product/${h.slug}`} onClick={onPick} onMouseEnter={onHover} className={`group flex items-center gap-4 border-b border-ink/10 py-3 transition-[padding] duration-200 ${active ? "pl-2" : ""}`}>
      {h.image ? <img src={sized(h.image, 160)} alt="" loading="lazy" decoding="async" className="h-14 w-14 shrink-0 object-contain" /> : <ProductArt kind={h.kind} color={h.color} className="h-14 w-14 shrink-0" />}
      <span className={`min-w-0 flex-1 truncate text-base ${active ? "font-semibold" : ""}`}>{h.name}</span>
      <span className="shrink-0 text-right text-sm tabular-nums">
        {formatPrice(h.price)}
        {h.compareAt != null && <s className="ml-2 text-ink/60">{formatPrice(h.compareAt)}</s>}
      </span>
    </Link>
  );
}

export function SearchOverlay({ bar = false, dock = false }: { bar?: boolean; dock?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [start, setStart] = useState<{ items: Hit[]; cats: Cat[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const typed = q.trim();
  const searching = typed.length >= 2;

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => input.current?.focus(), 30);
    if (!start) fetch("/api/search").then((r) => r.json()).then((d) => setStart({ items: d.items ?? [], cats: d.cats ?? [] })).catch(() => {});
  }, [open, start]);
  useEffect(() => {
    setActive(-1);
    setFailed(false);
    if (!searching) { setHits([]); setCats([]); setBusy(false); return; }
    setBusy(true);
    const ctl = new AbortController();
    const t = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(typed)}`, { signal: ctl.signal })
        .then((r) => { if (!r.ok) throw new Error("search"); return r.json(); })
        .then((d) => { setHits(d.items ?? []); setCats(d.cats ?? []); setBusy(false); })
        .catch((e) => { if (e.name !== "AbortError") { setHits([]); setCats([]); setBusy(false); setFailed(true); } });
    }, 180);
    return () => { window.clearTimeout(t); ctl.abort(); };
  }, [typed, searching]);

  const close = useCallback(() => { setOpen(false); setQ(""); }, []);
  useOverlay(open, close);

  const list = searching ? hits : start?.items ?? [];
  const showAll = () => { if (typed) { router.push(`/shop?q=${encodeURIComponent(typed)}`); close(); } };
  const onKey = (e: React.KeyboardEvent) => {
    if (!list.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % list.length); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? list.length - 1 : a - 1)); }
  };
  const browse = searching ? cats : start?.cats ?? [];

  return (
    <>
      {dock ? (
        <button type="button" onClick={() => setOpen(true)} className="dock-item"><Search size={21} /><span>Search</span></button>
      ) : bar ? (
        <button type="button" aria-label="Search products" onClick={() => setOpen(true)} className="flex h-11 w-full items-center gap-2 border-b border-ink/25 bg-transparent px-1 text-left text-sm text-muted transition hover:border-ink"><Search size={16} /> Search products</button>
      ) : (
        <button aria-label="Search products" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-ink/10"><Search size={18} /></button>
      )}
      {open && (
        <Portal>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            onClick={(e) => { if (!(e.target as HTMLElement).closest("a, button, input")) close(); }}
            className="search-veil fixed inset-0 z-[70] overflow-y-auto text-ink"
          >
            <div className="search-rise mx-auto w-full max-w-3xl px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-[11vh]">
              <form onSubmit={(e) => { e.preventDefault(); if (active >= 0 && list[active]) { router.push(`/product/${list[active].slug}`); close(); } else showAll(); }} className="relative flex items-center gap-3 border-b border-ink/30 sm:gap-4">
                <Search size={22} className="shrink-0" aria-hidden />
                <input
                  ref={input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={onKey}
                  placeholder="Search the store"
                  aria-label="Search"
                  type="search"
                  enterKeyHint="search"
                  role="combobox"
                  aria-expanded={list.length > 0}
                  aria-controls="search-results"
                  aria-activedescendant={active >= 0 ? `search-row-${active}` : undefined}
                  autoComplete="off"
                  className="bare-input h-16 min-w-0 flex-1 bg-transparent font-display text-2xl outline-none placeholder:text-ink/50 sm:h-20 sm:text-4xl [&::-webkit-search-cancel-button]:hidden"
                />
                <button type="button" aria-label="Close search" onClick={close} className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition hover:bg-ink/10"><X size={20} /></button>
                <span aria-hidden className={`search-line absolute -bottom-px left-0 h-px w-full bg-accent ${busy ? "is-busy" : ""}`} />
              </form>

              {browse.length > 0 && (
                <nav aria-label="Categories" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {browse.map((c) => <Link key={c.id} href={`/category/${c.id}`} onClick={close} className="underline-offset-4 hover:underline">{c.label}</Link>)}
                </nav>
              )}

              {!searching && !!start?.items.length && <h2 className="mt-8 font-display text-lg">New in the store</h2>}
              {failed && <p role="alert" className="mt-8 text-base">Search did not respond. Press Enter to try the full results page.</p>}
              {searching && !busy && !failed && hits.length === 0 && (
                <p className="mt-8 text-base">Nothing matches &ldquo;{typed}&rdquo;. Try a shorter word, or <Link href="/shop" onClick={close} className="underline underline-offset-4">see all products</Link>.</p>
              )}
              <div id="search-results" role="listbox" aria-label="Products" className={searching ? "mt-4" : "mt-2"}>
                {list.map((h, i) => <Row key={h.slug} h={h} id={`search-row-${i}`} active={i === active} onPick={close} onHover={() => setActive(i)} />)}
              </div>
              {searching && hits.length > 0 && (
                <button type="button" onClick={showAll} className="mt-5 text-sm font-semibold underline underline-offset-4">See all results for &ldquo;{typed}&rdquo;</button>
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
