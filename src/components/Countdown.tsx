"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ endsAt }: { endsAt: string }) {
  const end = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, []);
  if (now === null || Number.isNaN(end)) return <div className="h-20" />;
  const left = Math.max(0, end - now);
  if (left === 0) return <p className="py-6 text-lg font-medium opacity-80">This offer has ended.</p>;
  const d = Math.floor(left / 864e5), h = Math.floor((left % 864e5) / 36e5), m = Math.floor((left % 36e5) / 6e4), s = Math.floor((left % 6e4) / 1e3);
  const cells: [string, number][] = [["Days", d], ["Hours", h], ["Minutes", m], ["Seconds", s]];
  return (
    <div role="timer" aria-label="Time left" className="flex justify-center gap-3 md:gap-4">
      {cells.map(([l, v]) => (
        <div key={l} className="min-w-16 rounded-2xl bg-white/10 px-3 py-3 text-center backdrop-blur md:min-w-24 md:px-5 md:py-4">
          <p className="font-display text-3xl font-semibold tabular-nums md:text-5xl">{pad(v)}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wider opacity-75 md:text-xs">{l}</p>
        </div>
      ))}
    </div>
  );
}
