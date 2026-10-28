import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/config";
import { NEXT_STEPS, ORDER_STATUSES, statusColor, statusLabel } from "@/lib/order-status";
import { createClient } from "@/lib/supabase/server";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { quickStatus } from "./actions";

const tab = "rounded-pill border px-3 py-1.5 text-sm transition";

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q = "" } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("orders").select("id, order_no, guest_name, guest_phone, total, status, payment_status, risk_score, created_at, courier").order("created_at", { ascending: false }).limit(100);
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
  const term = q.trim().replace(/[%,()]/g, "");
  if (term) {
    const n = Number(term.replace(/^#/, ""));
    query = Number.isInteger(n) && n > 0 ? query.eq("order_no", n) : query.or(`guest_name.ilike.%${term}%,guest_phone.ilike.%${term}%`);
  }
  const { data } = await query;
  const rows = data ?? [];
  const keep = (s?: string) => (s ? `?status=${s}` : "");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Orders</h1>
        <span className="flex items-center gap-4 text-sm">
          <Link href="/admin/orders/new" className="rounded-pill bg-accent px-5 py-2 font-semibold text-accent-ink">Add an order</Link>
          <a href="/admin/orders/labels?status=confirmed" target="_blank" className="underline">Print labels</a>
          <a href={`/admin/orders/export${keep(status)}`} className="underline">Download CSV</a>
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">Click anywhere on a row to open the order. Use the button on the right to move it to its next step without opening it.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {["all", ...ORDER_STATUSES].map((s) => (
          <Link key={s} href={s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`} className={`${tab} ${(status ?? "all") === s ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}>{s === "all" ? "All" : statusLabel(s)}</Link>
        ))}
        <form className="ml-auto flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Order number, name or phone" className="w-60 rounded-pill border border-line bg-surface px-4 py-2 text-sm" />
          <button className="rounded-pill border border-line px-4 py-2 text-sm hover:bg-surface">Search</button>
        </form>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr><th className="p-3 font-medium">Order</th><th className="p-3 font-medium">Customer</th><th className="p-3 text-right font-medium">Total</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Risk</th><th className="p-3 font-medium">Placed</th><th className="p-3 text-right font-medium">Next step or change</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted">No orders here yet.</td></tr>}
            {rows.map((o) => {
              const next = NEXT_STEPS[o.status as string] ?? [];
              return (
                <tr key={o.id} className="relative border-b border-line last:border-0 transition hover:bg-paper">
                  <td className="p-3 font-medium">
                    {/* This link covers the whole row, so a click anywhere opens the order. */}
                    <Link href={`/admin/orders/${o.id}`} className="after:absolute after:inset-0 hover:underline">#{o.order_no}</Link>
                  </td>
                  <td className="p-3">{o.guest_name}<span className="block text-xs text-muted">{o.guest_phone}</span></td>
                  <td className="p-3 text-right font-medium tabular-nums">{formatPrice(Number(o.total))}</td>
                  <td className="p-3"><span className="inline-flex items-center gap-2"><span style={{ background: statusColor(o.status as string) }} className="h-2 w-2 shrink-0 rounded-full" />{statusLabel(o.status as string)}{o.payment_status === "paid" && <span className="rounded-pill bg-accent/10 px-2 py-0.5 text-xs text-accent">Paid</span>}{o.payment_status === "refunded" && <span className="rounded-pill bg-paper px-2 py-0.5 text-xs text-muted">Refunded</span>}</span></td>
                  <td className={`p-3 ${Number(o.risk_score) >= 40 ? "font-medium text-red-600" : "text-muted"}`}>{o.risk_score}</td>
                  <td className="p-3 text-muted">{new Date(o.created_at as string).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="relative z-10 p-3 text-right">
                    <span className="inline-flex items-center gap-2">
                      {next.length > 0 && !["cancelled", "returned"].includes(next[0].to) && (
                        <form action={quickStatus} className="inline-flex items-center gap-1">
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="status" value={next[0].to} />
                          <button className="inline-flex items-center gap-1 rounded-pill border border-line bg-surface px-3 py-1.5 text-xs font-medium transition hover:border-ink">{next[0].label} <ChevronRight size={13} /></button>
                        </form>
                      )}
                      <StatusSelect id={o.id as string} current={o.status as string} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
