import { notFound } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DashboardView, type DashData } from "@/components/admin/dashboard/DashboardView";

/** Local preview of the dashboard with sample data, so the design can be checked without signing in. Not available in production. */
export default function Preview() {
  if (process.env.NODE_ENV === "production") notFound();
  const labels = Array.from({ length: 30 }, (_, i) => `${i + 1} Oct`);
  const vals = labels.map((_, i) => Math.round(9000 + Math.sin(i / 3) * 4000 + (i % 7 === 0 ? 6000 : 0) + i * 260));
  const points = labels.map((label, i) => ({ label, value: vals[i], orders: Math.max(1, Math.round(vals[i] / 2600)) }));
  const data: DashData = {
    name: "Manik", rangeKey: "30d", rangeLabel: "30 days",
    ranges: [["7d", "7 days"], ["15d", "15 days"], ["30d", "30 days"], ["3m", "3 months"], ["6m", "6 months"], ["1y", "1 year"]].map(([key, label]) => ({ key, label })),
    points, previous: vals.map((v, i) => Math.round(v * (0.78 + Math.cos(i / 4) * 0.08))),
    revenue: vals.reduce((a, b) => a + b, 0), revenuePrev: Math.round(vals.reduce((a, b) => a + b, 0) * 0.82),
    orders: points.reduce((a, p) => a + p.orders, 0), ordersPrev: Math.round(points.reduce((a, p) => a + p.orders, 0) * 1.06),
    today: { orders: 7, revenue: 18450 },
    statuses: [{ status: "delivered", orders: 62 }, { status: "shipped", orders: 14 }, { status: "processing", orders: 9 }, { status: "pending", orders: 6 }, { status: "cancelled", orders: 5 }, { status: "returned", orders: 2 }],
    top: [{ name: "Everyday Pullover Hoodie", units: 41, revenue: 75850 }, { name: "Linen Bedsheet Set", units: 19, revenue: 60800 }, { name: "Heavyweight Boxy Tee", units: 52, revenue: 44200 }, { name: "Ceramic Table Lamp", units: 11, revenue: 34100 }, { name: "Round Wall Mirror", units: 12, revenue: 28800 }],
    low: [{ sku: "a", name: "Zip-Up Hoodie", label: "Navy, M", stock: 0 }, { sku: "b", name: "Heavyweight Boxy Tee", label: "Sage, XL", stock: 2 }, { sku: "c", name: "Pillow Cover Set", label: "Teal, Standard", stock: 4 }],
    recent: [
      { id: "1", order_no: 1042, name: "Rahim Uddin", total: 3200, status: "pending", paid: false, created_at: new Date().toISOString() },
      { id: "2", order_no: 1041, name: "Sumaiya Akter", total: 1850, status: "confirmed", paid: true, created_at: new Date(Date.now() - 36e5).toISOString() },
      { id: "3", order_no: 1040, name: "Tanvir Hasan", total: 5400, status: "shipped", paid: false, created_at: new Date(Date.now() - 5 * 36e5).toISOString() },
      { id: "4", order_no: 1039, name: "Nusrat Jahan", total: 950, status: "delivered", paid: true, created_at: new Date(Date.now() - 26 * 36e5).toISOString() },
    ],
    attention: { pending: 6, reviews: 2, abandoned: 3, lowStock: 3 },
  };
  return (
    <div data-theme="studio" className="min-h-dvh bg-paper text-ink lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <AdminSidebar brand="Loomhaus" />
      <main data-admin-main className="min-w-0 px-4 py-6 md:px-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-6xl"><DashboardView {...data} /></div></main>
    </div>
  );
}
