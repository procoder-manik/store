"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatPrice } from "@/lib/config";

type Item = { name: string; city: string; product: string; price: number; ago: string };

export function SocialProof() {
  const path = usePathname();
  const [items, setItems] = useState<Item[]>([]);
  const [cur, setCur] = useState<Item | null>(null);
  const [off, setOff] = useState(false);
  const blocked = /^\/(admin|checkout|thank-you|login)/.test(path);

  useEffect(() => {
    try { if (sessionStorage.getItem("proof-off")) setOff(true); } catch { /* storage blocked */ }
    fetch("/api/social-proof").then((r) => r.json()).then((d) => setItems(d.items ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (off || blocked || items.length === 0) return;
    let n = 0;
    let t1: number | undefined;
    let t2: number | undefined;
    const cycle = () => {
      setCur(items[n % items.length]);
      t1 = window.setTimeout(() => { setCur(null); n++; t2 = window.setTimeout(cycle, 9000); }, 5500);
    };
    const start = window.setTimeout(cycle, 7000);
    return () => { window.clearTimeout(start); window.clearTimeout(t1); window.clearTimeout(t2); setCur(null); };
  }, [items, off, blocked]);

  if (!cur || off || blocked) return null;
  return (
    <div role="status" aria-live="polite" className="pop-in fixed bottom-20 left-3 z-40 flex max-w-[300px] items-start gap-3 rounded-2xl border border-line bg-surface/95 p-3 pr-9 shadow-xl backdrop-blur md:bottom-5 md:left-5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent font-display text-lg font-semibold text-accent-ink">{cur.name.charAt(0).toUpperCase()}</span>
      <p className="text-sm leading-snug">
        <span className="font-medium">{cur.name}</span> from {cur.city} bought <span className="font-medium">{cur.product}</span> for {formatPrice(cur.price)}
        <span className="mt-0.5 block text-xs text-muted">{cur.ago}</span>
      </p>
      <button aria-label="Hide these notifications" onClick={() => { setOff(true); try { sessionStorage.setItem("proof-off", "1"); } catch { /* storage blocked */ } }} className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-paper"><X size={12} /></button>
    </div>
  );
}
