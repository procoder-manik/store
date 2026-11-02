"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/client";

const KEY = "promo-v2";
const DAY = 86_400_000;
type Seen = { offer: string; shown: number; last: number; claimed: boolean };

function read(offer: string): Seen | null {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as Seen) : null;
    // A new code or title is a new offer, so it starts again from zero.
    return v && v.offer === offer ? v : { offer, shown: 0, last: 0, claimed: false };
  } catch {
    return null; // Storage is blocked. Better to stay quiet than to show it on every page.
  }
}

function write(v: Seen) {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage blocked */ }
}

export function PromoPopup({ p }: { p: Settings["popup"] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const blocked = /^\/(admin|checkout|thank-you|login|reset-password|mfa|pay)/.test(path);
  const offer = `${p.code}|${p.title}`;

  useEffect(() => {
    if (!p.enabled || blocked) return;
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const seen = read(offer);
      if (!seen) return;
      try {
        if (sessionStorage.getItem("promo-seen")) return; // once per visit, whatever the other rules say
        if (p.hideAfterOrder && localStorage.getItem("promo-ordered")) return;
      } catch { return; }
      if (p.stopAfterClaim && seen.claimed) return;
      if (seen.shown >= p.maxShows) return;
      if (seen.shown > 0 && Date.now() - seen.last < p.gapDays * DAY) return;
      if (p.hideSignedIn) {
        try { if ((await createClient().auth.getSession()).data.session) return; } catch { /* treat as signed out */ }
      }
      if (cancelled) return;

      const show = () => {
        try { if (sessionStorage.getItem("promo-seen")) return; sessionStorage.setItem("promo-seen", "1"); } catch { return; }
        write({ ...seen, shown: seen.shown + 1, last: Date.now() });
        setOpen(true);
      };
      if (p.trigger === "delay") {
        const t = window.setTimeout(show, p.delay * 1000);
        cleanup = () => window.clearTimeout(t);
        return;
      }
      const out = (e: MouseEvent) => { if (e.clientY <= 0 && !e.relatedTarget) show(); };
      const fallback = window.setTimeout(show, 30000);
      document.addEventListener("mouseout", out);
      cleanup = () => { document.removeEventListener("mouseout", out); window.clearTimeout(fallback); };
    })();

    return () => { cancelled = true; cleanup(); };
  }, [p.enabled, p.trigger, p.delay, p.maxShows, p.gapDays, p.hideAfterOrder, p.hideSignedIn, p.stopAfterClaim, offer, blocked]);

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  if (!open || blocked) return null;

  const claim = () => { const seen = read(offer); if (seen) write({ ...seen, claimed: true }); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(p.code); setCopied(true); } catch { /* clipboard blocked */ }
    claim();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={p.title} onClick={() => setOpen(false)} className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="pop-in relative w-full max-w-md rounded-3xl bg-surface p-8 shadow-2xl">
        <button ref={closeBtn} aria-label="Close" onClick={() => setOpen(false)} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full hover:bg-paper"><X size={18} /></button>
        <h2 className="pr-8 font-display text-2xl font-semibold leading-tight">{p.title}</h2>
        {p.text && <p className="mt-2 text-sm text-muted">{p.text}</p>}
        {p.code && (
          <button onClick={copy} className="mt-5 flex w-full items-center justify-between rounded-2xl border border-dashed border-accent px-5 py-4">
            <span className="font-display text-xl tracking-wider">{p.code}</span>
            <span className="text-sm text-accent">{copied ? "Copied" : "Copy code"}</span>
          </button>
        )}
        <Link href="/shop" onClick={() => { claim(); setOpen(false); }} className="mt-4 block rounded-pill bg-accent py-3 text-center text-sm font-semibold text-accent-ink">{p.button || "Shop now"}</Link>
      </div>
    </div>
  );
}
