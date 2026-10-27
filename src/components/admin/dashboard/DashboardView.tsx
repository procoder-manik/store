import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, ShoppingBag, ShoppingCart, Star } from "lucide-react";
import { formatPrice } from "@/lib/config";
import { Donut, RevenueChart, Sparkline, type Pt } from "./charts";
import { statusColor } from "./status-colors";

export type DashData = {
  name: string;
  rangeKey: string;
  ranges: { key: string; label: string }[];
  rangeLabel: string;
  points: Pt[];
  previous: number[];
  revenue: number; revenuePrev: number; orders: number; ordersPrev: number;
  today: { orders: number; revenue: number };
  statuses: { status: string; orders: number }[];
  top: { name: string; units: number; revenue: number }[];
  low: { sku: string; name: string; label: string; stock: number }[];
  recent: { id: string; order_no: number; name: string; total: number; status: string; paid: boolean; created_at: string }[];
  attention: { pending: number; reviews: number; abandoned: number; lowStock: number };
};

const card = "rounded-2xl border border-line bg-surface p-5";
const pct = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted">no earlier data</span>;
  const up = value >= 0;
  const I = up ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? "text-emerald-600" : "text-red-600"}`}><I size={14} />{Math.abs(value).toFixed(1)}%</span>;
}

function Stat({ label, value, delta, spark, up }: { label: string; value: string; delta: number | null; spark: number[]; up: boolean }) {
  return (
    <div className={card}>
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="font-display text-3xl font-semibold tracking-tight">{value}</p>
        <Sparkline values={spark} up={up} />
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted"><Delta value={delta} /> vs the period before</p>
    </div>
  );
}

export function DashboardView(d: DashData) {
  const aov = d.orders ? d.revenue / d.orders : 0;
  const aovPrev = d.ordersPrev ? d.revenuePrev / d.ordersPrev : 0;
  const maxTop = Math.max(1, ...d.top.map((t) => t.revenue));
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const items = [
    { href: "/admin/orders?status=pending", icon: ShoppingBag, label: "Orders to confirm", n: d.attention.pending },
    { href: "/admin/abandoned", icon: ShoppingCart, label: "Abandoned carts", n: d.attention.abandoned },
    { href: "/admin/reviews", icon: Star, label: "Reviews to approve", n: d.attention.reviews },
    { href: "/admin/products", icon: Boxes, label: "Low stock options", n: d.attention.lowStock },
  ];
  const allClear = items.every((i) => i.n === 0);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{greet}{d.name ? `, ${d.name}` : ""}</h1>
          <p className="mt-1 text-sm text-muted">Today: <span className="font-medium text-ink">{d.today.orders} {d.today.orders === 1 ? "order" : "orders"}</span> and <span className="font-medium text-ink">{formatPrice(d.today.revenue)}</span> in sales.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-pill border border-line bg-surface p-1 text-sm" role="group" aria-label="Time range">
          {d.ranges.map((r) => <Link key={r.key} href={`/admin?range=${r.key}`} aria-current={r.key === d.rangeKey ? "true" : undefined} className={`rounded-pill px-3.5 py-1.5 transition ${r.key === d.rangeKey ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}>{r.label}</Link>)}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label={`Sales, ${d.rangeLabel}`} value={formatPrice(d.revenue)} delta={pct(d.revenue, d.revenuePrev)} spark={d.points.map((p) => p.value)} up={d.revenue >= d.revenuePrev} />
        <Stat label="Orders" value={String(d.orders)} delta={pct(d.orders, d.ordersPrev)} spark={d.points.map((p) => p.orders)} up={d.orders >= d.ordersPrev} />
        <Stat label="Average order" value={formatPrice(Math.round(aov))} delta={pct(aov, aovPrev)} spark={d.points.map((p) => (p.orders ? p.value / p.orders : 0))} up={aov >= aovPrev} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className={card}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Sales</h2>
            <p className="flex items-center gap-3 text-xs text-muted"><span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-accent" /> This period</span><span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded border-t border-dashed border-muted" /> Before</span></p>
          </div>
          <div className="mt-3"><RevenueChart points={d.points} previous={d.previous} /></div>
        </section>

        <section className={card}>
          <h2 className="font-display text-lg font-semibold">Needs your attention</h2>
          {allClear ? (
            <p className="mt-4 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700">Everything is up to date. Nothing is waiting for you.</p>
          ) : (
            <ul className="mt-3 grid gap-1">
              {items.map(({ href, icon: Icon, label, n }) => (
                <li key={label}>
                  <Link href={href} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-paper">
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${n > 0 ? "bg-amber-500/15 text-amber-700" : "bg-paper text-muted"}`}><Icon size={17} /></span>
                    <span className="flex-1 text-sm">{label}</span>
                    <span className={`min-w-6 rounded-pill px-2 py-0.5 text-center text-xs font-semibold ${n > 0 ? "bg-amber-500 text-white" : "bg-paper text-muted"}`}>{n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className={card}>
          <h2 className="font-display text-lg font-semibold">Orders by status</h2>
          <div className="mt-4"><Donut items={d.statuses} /></div>
        </section>
        <section className={card}>
          <h2 className="font-display text-lg font-semibold">Top products</h2>
          <ul className="mt-4 grid gap-3.5">
            {d.top.length === 0 && <li className="text-sm text-muted">No sales in this period.</li>}
            {d.top.map((t) => (
              <li key={t.name}>
                <div className="flex justify-between gap-3 text-sm"><span className="min-w-0 truncate">{t.name}</span><span className="shrink-0 font-medium tabular-nums">{formatPrice(t.revenue)}</span></div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-paper"><div style={{ width: `${Math.max(4, (t.revenue / maxTop) * 100)}%` }} className="h-full rounded-pill bg-accent" /></div>
                <p className="mt-1 text-xs text-muted">{t.units} sold</p>
              </li>
            ))}
          </ul>
        </section>
        <section className={card}>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">Low stock {d.low.length > 0 && <AlertTriangle size={16} className="text-amber-600" />}</h2>
          <ul className="mt-4 grid gap-3">
            {d.low.length === 0 && <li className="text-sm text-muted">Everything is well stocked.</li>}
            {d.low.map((l) => (
              <li key={l.sku} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0"><span className="block truncate">{l.name}</span><span className="text-xs text-muted">{l.label}</span></span>
                <span className={`shrink-0 rounded-pill px-2.5 py-0.5 text-xs font-semibold ${l.stock === 0 ? "bg-red-500/15 text-red-700" : "bg-amber-500/15 text-amber-700"}`}>{l.stock === 0 ? "Sold out" : `${l.stock} left`}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={`${card} mt-4 !p-0`}>
        <div className="flex items-center justify-between px-5 pt-5"><h2 className="font-display text-lg font-semibold">Recent orders</h2><Link href="/admin/orders" className="text-sm text-muted underline hover:text-ink">View all</Link></div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-y border-line text-xs text-muted"><tr><th className="px-5 py-2.5 font-medium">Order</th><th className="px-3 py-2.5 font-medium">Customer</th><th className="px-3 py-2.5 font-medium">Status</th><th className="px-3 py-2.5 text-right font-medium">Total</th><th className="px-5 py-2.5 text-right font-medium">When</th></tr></thead>
            <tbody>
              {d.recent.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted">Orders will appear here as they come in.</td></tr>}
              {d.recent.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0 transition hover:bg-paper">
                  <td className="px-5 py-3"><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">#{o.order_no}</Link></td>
                  <td className="px-3 py-3">{o.name}</td>
                  <td className="px-3 py-3"><span className="inline-flex items-center gap-2 capitalize"><span style={{ background: statusColor(o.status) }} className="h-2 w-2 rounded-full" />{o.status}{o.paid && <span className="rounded-pill bg-accent/10 px-2 py-0.5 text-xs normal-case text-accent">Paid</span>}</span></td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums">{formatPrice(o.total)}</td>
                  <td className="px-5 py-3 text-right text-muted">{new Date(o.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
