export type Pt = { label: string; value: number; orders: number };

const compact = (v: number) => (v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(v));

export function SalesChart({ points }: { points: Pt[] }) {
  const W = 720, H = 260, L = 48, R = 8, T = 12, B = 30;
  const max = Math.max(1, ...points.map((p) => p.value));
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const bw = (W - L - R) / Math.max(1, points.length);
  const gap = Math.min(6, bw * 0.25);
  const every = Math.ceil(points.length / 7);
  const y = (v: number) => T + (H - T - B) * (1 - v / top);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Sales by period">
      {[0, 1, 2, 3, 4].map((i) => {
        const v = (top / 4) * i;
        return (
          <g key={i}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{compact(v)}</text>
          </g>
        );
      })}
      {points.map((p, i) => {
        const h = Math.max(p.value > 0 ? 3 : 0, (H - T - B) * (p.value / top));
        const x = L + i * bw + gap / 2;
        return (
          <g key={i}>
            <rect x={x} y={H - B - h} width={Math.max(2, bw - gap)} height={h} rx="3" fill="var(--accent)">
              <title>{`${p.label}: ৳${p.value.toLocaleString("en-US")} from ${p.orders} ${p.orders === 1 ? "order" : "orders"}`}</title>
            </rect>
            {i % every === 0 && <text x={x + (bw - gap) / 2} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--muted)">{p.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}
