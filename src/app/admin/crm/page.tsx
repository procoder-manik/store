import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/config";
import { deleteLead, setLeadStatus } from "./actions";

type C = { phone: string; name: string; email: string | null; orders: number; spent: number | string; last_order: string; segment: string };
const SEGMENTS = ["all", "vip", "regular", "new", "inactive"];
const badge: Record<string, string> = { vip: "bg-amber-100 text-amber-900", inactive: "bg-paper text-muted", new: "bg-accent/10 text-accent", regular: "bg-paper text-ink" };

export default async function CRM({ searchParams }: { searchParams: Promise<{ tab?: string; seg?: string; q?: string }> }) {
  const { tab, seg = "all", q = "" } = await searchParams;
  const supabase = await createClient();
  const leadsTab = tab === "leads";

  const tabCls = (on: boolean) => `rounded-full border px-4 py-1.5 text-sm ${on ? "border-accent bg-accent text-accent-ink" : "border-line"}`;
  const head = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Customers and leads</h1>
        <a href={`/admin/crm/export?type=${leadsTab ? "leads" : "customers"}`} className="text-sm underline">Download CSV</a>
      </div>
      <div className="mt-4 flex gap-2"><Link href="/admin/crm" className={tabCls(!leadsTab)}>Customers</Link><Link href="/admin/crm?tab=leads" className={tabCls(leadsTab)}>Leads</Link></div>
    </>
  );

  if (leadsTab) {
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(200);
    return (
      <>
        {head}
        <p className="mt-3 text-sm text-muted">People who signed up for emails or left their number in the chat.</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted"><tr><th className="p-3 font-medium">Contact</th><th className="p-3 font-medium">Source</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Added</th><th /></tr></thead>
            <tbody>
              {(data ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-muted">No leads yet.</td></tr>}
              {(data ?? []).map((l) => (
                <tr key={l.id} className="border-b border-line align-top last:border-0">
                  <td className="p-3">{l.name && <span className="font-medium">{l.name}<br /></span>}{l.phone && <a href={`tel:${l.phone}`} className="underline">{l.phone}<br /></a>}{l.email}{l.notes && <span className="block text-xs text-muted">{l.notes}</span>}{l.unsubscribed && <span className="block text-xs text-red-600">Unsubscribed</span>}</td>
                  <td className="p-3 capitalize">{l.source}</td>
                  <td className="p-3">
                    <form action={setLeadStatus} className="flex gap-2"><input type="hidden" name="id" value={l.id} />
                      <select name="status" defaultValue={l.status} className="rounded-lg border border-line bg-surface px-2 py-1 text-xs">{["new", "contacted", "won", "lost"].map((s) => <option key={s}>{s}</option>)}</select>
                      <button className="text-xs underline">Save</button></form>
                  </td>
                  <td className="p-3 text-muted">{new Date(l.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</td>
                  <td className="p-3"><form action={deleteLead}><input type="hidden" name="id" value={l.id} /><button className="text-xs text-red-600 underline">Delete</button></form></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  const { data, error } = await supabase.rpc("crm_customers");
  if (error) return <>{head}<p className="mt-4 text-sm text-muted">Run supabase-0006-crm-email.sql in the Supabase SQL Editor, then refresh.</p></>;
  const needle = q.trim().toLowerCase();
  const rows = ((data ?? []) as C[]).filter((c) => (seg === "all" || c.segment === seg) && (!needle || `${c.name} ${c.phone} ${c.email ?? ""}`.toLowerCase().includes(needle))).slice(0, 200);

  return (
    <>
      {head}
      <form className="mt-4 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={q} placeholder="Search name, phone or email" className="w-64 rounded-full border border-line bg-surface px-4 py-2" />
        <select name="seg" defaultValue={seg} className="rounded-full border border-line bg-surface px-3 py-2 capitalize">{SEGMENTS.map((s) => <option key={s}>{s}</option>)}</select>
        <button className="rounded-full border border-line px-4 py-2">Filter</button>
      </form>
      <p className="mt-2 text-xs text-muted">VIP means 3 or more orders or ৳10,000 spent. Inactive means no order in 90 days.</p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted"><tr><th className="p-3 font-medium">Customer</th><th className="p-3 font-medium">Orders</th><th className="p-3 font-medium">Spent</th><th className="p-3 font-medium">Last order</th><th className="p-3 font-medium">Segment</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-muted">No customers match.</td></tr>}
            {rows.map((c) => (
              <tr key={c.phone} className="border-b border-line last:border-0">
                <td className="p-3"><Link href={`/admin/crm/customers/${c.phone}`} className="font-medium hover:underline">{c.name}</Link><span className="block text-xs text-muted">{c.phone}{c.email ? `, ${c.email}` : ""}</span></td>
                <td className="p-3">{Number(c.orders)}</td>
                <td className="p-3">{formatPrice(Number(c.spent))}</td>
                <td className="p-3 text-muted">{new Date(c.last_order).toLocaleDateString("en-GB", { dateStyle: "medium" })}</td>
                <td className="p-3"><span className={`rounded-full px-2.5 py-0.5 text-xs capitalize ${badge[c.segment]}`}>{c.segment}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
