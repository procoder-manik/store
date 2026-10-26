"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { Kind } from "@/lib/demo-products";
import { formatPrice } from "@/lib/config";
import { ProductArt } from "./ProductArt";

type Hit = { name: string; slug: string; price: number; image: string; kind: Kind; color: string };

export function SearchOverlay() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => { if (open) window.setTimeout(() => input.current?.focus(), 30); }, [open]);
  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    setBusy(true);
    const t = window.setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q.trim())}`).then((r) => r.json()).then((d) => setHits(d.items ?? [])).catch(() => setHits([])).finally(() => setBusy(false));
    }, 180);
    return () => window.clearTimeout(t);
  }, [q]);

  const close = () => { setOpen(false); setQ(""); };
  return (
    <>
      <button aria-label="Search products" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-surface"><Search size={18} /></button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Search" onClick={close} className="fixed inset-0 z-[60] bg-black/40 px-4 pt-[12vh] backdrop-blur-sm">
          <div onClick={(e) => e.stopPropagation()} className="pop-in mx-auto max-w-xl overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl">
            <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) { router.push(`/shop?q=${encodeURIComponent(q.trim())}`); close(); } }} className="flex items-center gap-3 border-b border-line px-5">
              <Search size={18} className="text-muted" />
              <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hoodies, bedsheets, lamps..." aria-label="Search" className="h-16 min-w-0 flex-1 bg-transparent text-base outline-none" />
              <button type="button" aria-label="Close search" onClick={close} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper"><X size={16} /></button>
            </form>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {q.trim().length < 2 && <p className="px-4 py-6 text-sm text-muted">Type at least two letters. Press Enter to see every match.</p>}
              {q.trim().length >= 2 && !busy && hits.length === 0 && <p className="px-4 py-6 text-sm text-muted">No products match. Try another word.</p>}
              {hits.map((h) => (
                <Link key={h.slug} href={`/product/${h.slug}`} onClick={close} className="flex items-center gap-4 rounded-2xl p-2 transition hover:bg-paper">
                  {h.image ? <img src={h.image} alt="" className="h-14 w-12 rounded-lg border border-line object-cover" /> : <ProductArt kind={h.kind} color={h.color} className="h-14 w-12 rounded-lg border border-line" />}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{h.name}</span>
                  <span className="text-sm text-muted">{formatPrice(h.price)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
