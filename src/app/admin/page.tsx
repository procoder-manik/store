import { createClient } from "@/lib/supabase/server";
import { DashboardView, type DashData } from "@/components/admin/dashboard/DashboardView";

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
  const now = Date.now();
  const from = new Date(now - r.days * 864e5);
  const cur = { p_from: from.toISOString(), p_to: new Date(now + 3600e3).toISOString() };
  const before = { p_from: new Date(from.getTime() - r.days * 864e5).toISOString(), p_to: from.toISOString() };
  const dhakaMidnight = new Date(Math.floor((now + 6 * 3600e3) / 864e5) * 864e5 - 6 * 3600e3).toISOString();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [series, prevSeries, top, status, pending, reviews, abandoned, low, recent, todayRows, profile] = await Promise.all([
    supabase.rpc("sales_series", { ...cur, p_bucket: r.bucket }),
    supabase.rpc("sales_series", { ...before, p_bucket: r.bucket }),
    supabase.rpc("top_products", cur),
    supabase.rpc("status_counts", cur),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("abandoned_carts").select("id", { count: "exact", head: true }).eq("recovered", false).lt("updated_at", new Date(now - 30 * 60e3).toISOString()),
    supabase.from("product_variants").select("sku, color_name, size, stock, products(name)").lte("stock", 5).order("stock").limit(6),
    supabase.from("orders").select("id, order_no, guest_name, total, status, payment_status, created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("orders").select("total, status").gte("created_at", dhakaMidnight).limit(2000),
    user ? supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  if (series.error) {
    return (
      <>
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="mt-4 max-w-xl text-sm text-muted">The sales reports are not set up yet. Run the file supabase-0004-dashboard.sql in the Supabase SQL Editor, then refresh this page.</p>
      </>
    );
  }

  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", r.bucket === "month" ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" });
  const rows = (series.data ?? []) as Row[];
  const prevRows = (prevSeries.data ?? []) as Row[];
  const points = rows.map((x) => ({ label: fmt(x.bucket), value: Number(x.revenue), orders: Number(x.orders) }));
  const sum = (a: Row[], k: "revenue" | "orders") => a.reduce((n, x) => n + Number(x[k]), 0);
  const live = ((todayRows.data ?? []) as { total: number | string; status: string }[]).filter((o) => !["cancelled", "returned"].includes(o.status));

  const data: DashData = {
    name: ((profile.data as { full_name?: string } | null)?.full_name ?? "").split(" ")[0],
    rangeKey: key,
    ranges: (Object.keys(RANGES) as (keyof typeof RANGES)[]).map((k) => ({ key: k, label: RANGES[k].label })),
    rangeLabel: RANGES[key].label,
    points,
    previous: prevRows.map((x) => Number(x.revenue)),
    revenue: sum(rows, "revenue"), revenuePrev: sum(prevRows, "revenue"), orders: sum(rows, "orders"), ordersPrev: sum(prevRows, "orders"),
    today: { orders: live.length, revenue: live.reduce((n, o) => n + Number(o.total), 0) },
    statuses: ((status.data ?? []) as St[]).map((s) => ({ status: s.status, orders: Number(s.orders) })),
    top: ((top.data ?? []) as Top[]).map((t) => ({ name: t.name, units: Number(t.units), revenue: Number(t.revenue) })),
    low: ((low.data ?? []) as unknown as Low[]).map((l) => ({ sku: l.sku, stock: l.stock, name: (Array.isArray(l.products) ? l.products[0] : l.products)?.name ?? l.sku, label: [l.color_name, l.size].filter(Boolean).join(", ") || l.sku })),
    recent: (recent.data ?? []).map((o) => ({ id: o.id as string, order_no: Number(o.order_no), name: o.guest_name as string, total: Number(o.total), status: o.status as string, paid: o.payment_status === "paid", created_at: o.created_at as string })),
    attention: { pending: pending.count ?? 0, reviews: reviews.count ?? 0, abandoned: abandoned.count ?? 0, lowStock: (low.data ?? []).length },
  };
  return <DashboardView {...data} />;
}
