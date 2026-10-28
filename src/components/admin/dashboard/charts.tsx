"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/config";
import { statusColor, statusLabel } from "@/lib/order-status";

export type Pt = { label: string; value: number; orders: number };
const compact = (v: number) => (v >= 100000 ? `${+(v / 100000).toFixed(1)}L` : v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(Math.round(v)));

/** Smooth line through the points that never overshoots, so a quiet day does not dip below zero. */
function smooth(p: [number, number][]) {
  const n = p.length;
  if (n < 2) return "";
  const dx: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) { dx.push(p[i + 1][0] - p[i][0]); m.push((p[i + 1][1] - p[i][1]) / dx[i]); }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]));
  t.push(m[n - 2]);
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < n - 1; i++) d += ` C${p[i][0] + dx[i] / 3},${p[i][1] + (t[i] * dx[i]) / 3} ${p[i + 1][0] - dx[i] / 3},${p[i + 1][1] - (t[i + 1] * dx[i]) / 3} ${p[i + 1][0]},${p[i + 1][1]}`;
  return d;
}

export function Sparkline({ values, up = true }: { values: number[]; up?: boolean }) {
  if (values.length < 2) return <div className="h-9" />;
  const max = Math.max(...values, 1), W = 96, H = 36;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - 3 - (v / max) * (H - 8)] as [number, number]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-9 w-24" aria-hidden>
      <path d={smooth(pts)} fill="none" stroke={up ? "var(--accent)" : "#d14343"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function RevenueChart({ points, previous }: { points: Pt[]; previous: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 760, H = 300, L = 52, R = 14, T = 16, B = 34;
  const max = Math.max(1, ...points.map((p) => p.value), ...previous);
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const n = points.length;
  const x = (i: number) => L + (n === 1 ? (W - L - R) / 2 : (i / (n - 1)) * (W - L - R));
  const y = (v: number) => T + (H - T - B) * (1 - v / top);
  const line: [number, number][] = points.map((p, i) => [x(i), y(p.value)]);
  const prev: [number, number][] = previous.slice(0, n).map((v, i) => [x(i), y(v)]);
  const path = smooth(line);
  const every = Math.ceil(n / 7);
  const h = hover === null ? null : points[hover];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none" role="img" aria-label="Sales over time"
        onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(n - 1, Math.round(((px - L) / (W - L - R)) * (n - 1))))); }}
        onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => { const v = (top / 4) * i; return <g key={i}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeDasharray={i === 0 ? "" : "3 4"} /><text x={L - 10} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{compact(v)}</text></g>; })}
        {n > 1 && <path d={`${path} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill="url(#rev)" />}
        {prev.length > 1 && <path d={smooth(prev)} fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />}
        {n > 1 ? <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" /> : <circle cx={x(0)} cy={y(points[0]?.value ?? 0)} r="4" fill="var(--accent)" />}
        {points.map((p, i) => i % every === 0 && <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--muted)">{p.label}</text>)}
        {hover !== null && h && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--accent)" strokeOpacity="0.4" />
            <circle cx={x(hover)} cy={y(h.value)} r="5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.5" />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > n * 0.7 ? "-105%" : "8px"})` }} className="pointer-events-none absolute top-2 z-10 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-xl">
          <p className="font-medium">{h.label}</p>
          <p className="mt-0.5 text-base font-semibold">{formatPrice(h.value)}</p>
          <p className="text-muted">{h.orders} {h.orders === 1 ? "order" : "orders"}{previous[hover] !== undefined ? `, before: ${formatPrice(previous[hover])}` : ""}</p>
        </div>
      )}
    </div>
  );
}

export function Donut({ items }: { items: { status: string; orders: number }[] }) {
  const total = items.reduce((n, i) => n + i.orders, 0);
  const R = 52, C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="h-32 w-32 shrink-0 -rotate-90" role="img" aria-label="Orders by status">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--line)" strokeWidth="16" />
        {total > 0 && items.map((i) => { const len = (i.orders / total) * C; const el = <circle key={i.status} cx="70" cy="70" r={R} fill="none" stroke={statusColor(i.status)} strokeWidth="16" strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-off} />; off += len; return el; })}
        <text x="70" y="66" textAnchor="middle" transform="rotate(90 70 70)" fontSize="22" fontWeight="700" fill="var(--ink)">{total}</text>
        <text x="70" y="84" textAnchor="middle" transform="rotate(90 70 70)" fontSize="10" fill="var(--muted)">orders</text>
      </svg>
      <ul className="grid min-w-0 flex-1 gap-1.5 text-sm">
        {items.length === 0 && <li className="text-muted">No orders in this period.</li>}
        {items.map((i) => <li key={i.status} className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><span style={{ background: statusColor(i.status) }} className="h-2.5 w-2.5 rounded-full" />{statusLabel(i.status)}</span><span className="tabular-nums text-muted">{i.orders}</span></li>)}
      </ul>
    </div>
  );
}
