"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Settings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/client";
import { PopupCard } from "@/components/PopupCard";

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

const POS: Record<string, string> = {
  "bottom-right": "fixed bottom-0 right-0 z-[60] m-4 w-[calc(100%-2rem)] max-w-sm",
  "bottom-left": "fixed bottom-0 left-0 z-[60] m-4 w-[calc(100%-2rem)] max-w-sm",
  "top-right": "fixed right-0 top-0 z-[60] m-4 w-[calc(100%-2rem)] max-w-sm",
  "top-left": "fixed left-0 top-0 z-[60] m-4 w-[calc(100%-2rem)] max-w-sm",
  "bottom-bar": "fixed inset-x-0 bottom-0 z-[60]",
};

export function PromoPopup({ p }: { p: Settings["popup"] }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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
        const t = window.setTimeout(show, Math.max(0, p.delay) * 1000);
        cleanup = () => window.clearTimeout(t);
      } else if (p.trigger === "exit") {
        const out = (e: MouseEvent) => { if (e.clientY <= 0 && !e.relatedTarget) show(); };
        const fallback = window.setTimeout(show, 30000);
        document.addEventListener("mouseout", out);
        cleanup = () => { document.removeEventListener("mouseout", out); window.clearTimeout(fallback); };
      } else if (p.trigger === "scroll") {
        const onScroll = () => {
          const h = document.documentElement.scrollHeight - window.innerHeight;
          const pct = h > 0 ? (window.scrollY / h) * 100 : 100;
          if (pct >= Math.min(100, Math.max(5, p.scrollPercent))) show();
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        cleanup = () => window.removeEventListener("scroll", onScroll);
      } else {
        // click: count clicks, on a chosen area or anywhere, until the target number is reached
        let n = 0;
        const sel = p.clickSelector.trim();
        const onClick = (e: MouseEvent) => {
          const target = e.target as Element | null;
          if (sel) { try { if (!target?.closest(sel)) return; } catch { return; } }
          if (++n >= Math.max(1, p.clickCount)) show();
        };
        document.addEventListener("click", onClick, true);
        cleanup = () => document.removeEventListener("click", onClick, true);
      }
    })();

    return () => { cancelled = true; cleanup(); };
  }, [p.enabled, p.trigger, p.delay, p.scrollPercent, p.clickSelector, p.clickCount, p.maxShows, p.gapDays, p.hideAfterOrder, p.hideSignedIn, p.stopAfterClaim, offer, blocked]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  if (!open || blocked) return null;

  const claim = () => { const seen = read(offer); if (seen) write({ ...seen, claimed: true }); };
  const close = () => setOpen(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(p.code); setCopied(true); } catch { /* clipboard blocked */ }
    claim();
  };
  const go = () => { claim(); setOpen(false); router.push("/shop"); };

  const card = <PopupCard p={p} onClose={close} onCopy={copy} copied={copied} onButton={go} />;

  if (p.position === "center") {
    return (
      <div role="dialog" aria-modal="true" aria-label={p.title} onClick={close} className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
        <div onClick={(e) => e.stopPropagation()} className="pop-in w-full max-w-md">{card}</div>
      </div>
    );
  }
  return <div role="dialog" aria-label={p.title} className={`panel-in ${POS[p.position] ?? POS["bottom-right"]}`}>{card}</div>;
}
