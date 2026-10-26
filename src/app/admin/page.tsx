import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/config";
import { SalesChart } from "@/components/admin/SalesChart";

const RANGES = {
  "7d": { label: "7 days", days: 7, bucket: "day" },
  "15d": { label: "15 days", days: 15, bucket: "day" },
  "30d": { label: "30 days", days: 30, bucket: "day" },
  "3m": { label: "3 months", days: 90, bucket: "week" },
  "6m": { label: "6 months", days: 182, bucket: "week" },
  "1y": { label: "1 year", days: 365, bucket: "month" },
} as const;

type Row = { bucket: string; orders: number; revenue: number | string };
type Top = { name: string; units: number; revenue: number | string };
type St = { status: string; orders: number };
type Low = { sku: string; color_name: string | null; size: string | null; stock: number; products: { name: string } | { name: string }[] | null };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const key = (range && range in RANGES ? range : "30d") as keyof typeof RANGES;
  const r = RANGES[key];
  const args = { p_from: new Date(Date.now() - r.days * 864e5).toISOString(), p_to: new Date(Date.now() + 3600e3).toISOString() };

  const supabase = await createClient();
  const [series, top, status, pending, low] = await Promise.all([
    supabase.rpc("sales_series", { ...args, p_bucket: r.bucket }),
    supabase.rpc("top_products", args),
    supabase.rpc("status_counts", args),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("product_variants").select("sku, color_name, size, stock, products(name)").lte("stock", 5).order("stock").limit(8),
  ]);

  if (series.error) {
    return (
      <>
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="mt-4 max-w-xl text-sm text-muted">The sales reports are not set up yet. Run the file supabase-0004-dashboard.sql in the Supabase SQL Editor, then refresh this page.</p>
      </>
    );
  }

  const rows = (series.data ?? []) as Row[];
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", r.bucket === "month" ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" });
  const points = rows.map((x) => ({ label: fmt(x.bucket), value: Number(x.revenue), orders: Number(x.orders) }));
  const revenue = points.reduce((n, p) => n + p.value, 0);
  const orders = points.reduce((n, p) => n + p.orders, 0);
  const tops = (top.data ?? []) as Top[];
  const sts = (status.data ?? []) as St[];
  const lows = (low.data ?? []) as unknown as Low[];

  const card = "rounded-xl border border-line bg-surface p-5";
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          {(Object.keys(RANGES) as (keyof typeof RANGES)[]).map((k) => (
            <Link key={k} href={`/admin?range=${k}`} className={`rounded-full border px-3 py-1.5 ${k === key ? "border-accent bg-accent text-accent-ink" : "border-line"}`}>{RANGES[k].label}</Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={card}><p className="text-xs text-muted">Sales ({r.label})</p><p className="mt-2 font-display text-2xl font-semibold">{formatPrice(revenue)}</p></div>
        <div className={card}><p className="text-xs text-muted">Orders</p><p className="mt-2 font-display text-2xl font-semibold">{orders}</p></div>
        <div className={card}><p className="text-xs text-muted">Average order</p><p className="mt-2 font-display text-2xl font-semibold">{formatPrice(orders ? Math.round(revenue / orders) : 0)}</p></div>
        <Link href="/admin/orders?status=pending" className={`${card} hover:border-accent`}><p className="text-xs text-muted">Waiting for confirmation</p><p className="mt-2 font-display text-2xl font-semibold">{pending.count ?? 0}</p></Link>
      </div>

      <section className={`${card} mt-4`}>
        <h2 className="font-display text-base font-semibold">Sales by {r.bucket}</h2>
        <p className="text-xs text-muted">Cancelled and returned orders are not counted. Hover a bar to see the numbers.</p>
        <div className="mt-3"><SalesChart points={points} /></div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className={card}>
          <h2 className="font-display text-base font-semibold">Top products</h2>
          <ul className="mt-3 grid gap-3 text-sm">
            {tops.length === 0 && <li className="text-muted">No sales in this period.</li>}
            {tops.map((t) => <li key={t.name} className="flex justify-between gap-3"><span>{t.name}<span className="block text-xs text-muted">{t.units} sold</span></span><span>{formatPrice(Number(t.revenue))}</span></li>)}
          </ul>
        </section>
        <section className={card}>
          <h2 className="font-display text-base font-semibold">Orders by status</h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {sts.length === 0 && <li className="text-muted">No orders in this period.</li>}
            {sts.map((s) => <li key={s.status} className="flex justify-between capitalize"><span>{s.status}</span><span>{s.orders}</span></li>)}
          </ul>
        </section>
        <section className={card}>
          <h2 className="font-display text-base font-semibold">Low stock</h2>
          <ul className="mt-3 grid gap-3 text-sm">
            {lows.length === 0 && <li className="text-muted">Everything is well stocked.</li>}
            {lows.map((l) => {
              const prod = Array.isArray(l.products) ? l.products[0] : l.products;
              return <li key={l.sku} className="flex justify-between gap-3"><span>{prod?.name}<span className="block text-xs text-muted">{[l.color_name, l.size].filter(Boolean).join(", ") || l.sku}</span></span><span className={l.stock === 0 ? "text-red-600" : ""}>{l.stock} left</span></li>;
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
