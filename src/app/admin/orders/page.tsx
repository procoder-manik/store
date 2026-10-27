import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/config";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("orders").select("id, order_no, guest_name, guest_phone, total, status, payment_status, risk_score, created_at").order("created_at", { ascending: false }).limit(100);
  if (status && STATUSES.includes(status)) q = q.eq("status", status);
  const { data } = await q;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Orders</h1>
        <span className="flex items-center gap-4 text-sm"><a href="/admin/orders/labels?status=confirmed" target="_blank" className="underline">Print labels</a><a href={`/admin/orders/export${status && STATUSES.includes(status) ? `?status=${status}` : ""}`} className="underline">Download CSV</a><Link href="/admin/orders/new" className="rounded-pill bg-accent px-5 py-2 font-semibold text-accent-ink">New phone order</Link></span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {["all", ...STATUSES].map((s) => (
          <Link key={s} href={s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`} className={`rounded-pill border px-3 py-1 capitalize ${(status ?? "all") === s ? "border-accent bg-accent text-accent-ink" : "border-line"}`}>{s}</Link>
        ))}
      </div>
      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted"><tr><th className="p-3 font-medium">Order</th><th className="p-3 font-medium">Customer</th><th className="p-3 font-medium">Total</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Risk</th><th className="p-3 font-medium">Placed</th></tr></thead>
          <tbody>
            {(data ?? []).length === 0 && <tr><td colSpan={6} className="p-6 text-muted">No orders here yet.</td></tr>}
            {(data ?? []).map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0">
                <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">#{o.order_no}</Link></td>
                <td className="p-3">{o.guest_name}<span className="block text-xs text-muted">{o.guest_phone}</span></td>
                <td className="p-3">{formatPrice(Number(o.total))}</td>
                <td className="p-3 capitalize">{o.status}{o.payment_status === "paid" && <span className="ml-2 rounded-pill bg-accent/10 px-2 py-0.5 text-xs normal-case text-accent">Paid</span>}</td>
                <td className={`p-3 ${o.risk_score >= 40 ? "font-medium text-red-600" : ""}`}>{o.risk_score}</td>
                <td className="p-3 text-muted">{new Date(o.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
