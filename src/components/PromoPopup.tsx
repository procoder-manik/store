"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Settings } from "@/lib/settings";

export function PromoPopup({ p }: { p: Settings["popup"] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const blocked = /^\/(admin|checkout|thank-you|login)/.test(path);

  useEffect(() => {
    if (!p.enabled || blocked) return;
    try { if (sessionStorage.getItem("promo-seen")) return; } catch { /* storage blocked */ }
    const show = () => { setOpen(true); try { sessionStorage.setItem("promo-seen", "1"); } catch { /* storage blocked */ } };
    if (p.trigger === "delay") {
      const t = window.setTimeout(show, p.delay * 1000);
      return () => window.clearTimeout(t);
    }
    const out = (e: MouseEvent) => { if (e.clientY <= 0 && !e.relatedTarget) show(); };
    const fallback = window.setTimeout(show, 30000);
    document.addEventListener("mouseout", out);
    return () => { document.removeEventListener("mouseout", out); window.clearTimeout(fallback); };
  }, [p.enabled, p.trigger, p.delay, blocked]);

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  if (!open || blocked) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(p.code); setCopied(true); } catch { /* clipboard blocked */ }
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
        <Link href="/shop" onClick={() => setOpen(false)} className="mt-4 block rounded-pill bg-accent py-3 text-center text-sm font-semibold text-accent-ink">{p.button || "Shop now"}</Link>
      </div>
    </div>
  );
}
