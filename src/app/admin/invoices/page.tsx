import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/config";

export default async function Invoices({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("orders").select("id, order_no, guest_name, guest_phone, total, status, payment_status, payment_method, created_at").order("created_at", { ascending: false }).limit(100);
  const term = q.trim().replace(/[%,()]/g, "");
  if (term) {
    const n = Number(term.replace(/^INV-/i, ""));
    query = Number.isInteger(n) && n > 0 ? query.eq("order_no", n) : query.or(`guest_name.ilike.%${term}%,guest_phone.ilike.%${term}%`);
  }
  const { data } = await query;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Invoices</h1>
        <span className="flex gap-4 text-sm"><a href="/admin/orders/labels?status=confirmed" target="_blank" className="underline">Print labels for confirmed orders</a><a href="/admin/orders/export" className="underline">Download CSV</a></span>
      </div>
      <p className="mt-1 text-sm text-muted">One invoice per order. Open one to view, print or save it as a PDF. Customers can open the same invoice from their order page and their email.</p>
      <form className="mt-4 flex gap-2"><input name="q" defaultValue={q} placeholder="Invoice number, name or phone" className="w-72 rounded-pill border border-line bg-surface px-4 py-2 text-sm" /><button className="rounded-pill border border-line px-4 py-2 text-sm hover:bg-surface">Search</button></form>
      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted"><tr><th className="p-3 font-medium">Invoice</th><th className="p-3 font-medium">Customer</th><th className="p-3 font-medium">Date</th><th className="p-3 text-right font-medium">Total</th><th className="p-3 font-medium">Payment</th><th className="p-3 font-medium">Order</th><th /></tr></thead>
          <tbody>
            {(data ?? []).length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted">No invoices match.</td></tr>}
            {(data ?? []).map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0">
                <td className="p-3 font-medium">INV-{o.order_no}</td>
                <td className="p-3">{o.guest_name}<span className="block text-xs text-muted">{o.guest_phone}</span></td>
                <td className="p-3 text-muted">{new Date(o.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</td>
                <td className="p-3 text-right font-medium tabular-nums">{formatPrice(Number(o.total))}</td>
                <td className="p-3">{o.payment_status === "paid" ? <span className="rounded-pill bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Paid</span> : <span className="rounded-pill bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700">{o.payment_method === "sslcommerz" ? "Unpaid" : "COD"}</span>}</td>
                <td className="p-3 capitalize text-muted">{o.status}</td>
                <td className="p-3 text-right text-xs"><a href={`/admin/orders/${o.id}/invoice`} target="_blank" className="font-medium text-accent underline">Invoice</a><a href={`/admin/orders/${o.id}/label`} target="_blank" className="ml-3 underline">Label</a><Link href={`/admin/orders/${o.id}`} className="ml-3 underline">Order</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
