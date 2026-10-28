"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

const pad = (n: number) => String(n).padStart(2, "0");

/** A small timer on a product, shown only while the offer is still running. */
export function OfferCountdown({ endsAt, compact = false }: { endsAt: string; compact?: boolean }) {
  const end = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, []);
  if (now === null || Number.isNaN(end) || end <= now) return null;
  const left = end - now;
  const d = Math.floor(left / 864e5), h = Math.floor((left % 864e5) / 36e5), m = Math.floor((left % 36e5) / 6e4), s = Math.floor((left % 6e4) / 1e3);
  const text = d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
  if (compact) return <span className="inline-flex items-center gap-1 rounded-pill bg-red-500/10 px-2 py-0.5 text-xs font-medium tabular-nums text-red-600"><Timer size={11} />{text}</span>;
  return (
    <p role="timer" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-600">
      <Timer size={16} /> Offer ends in <span className="tabular-nums">{text}</span>
    </p>
  );
}
