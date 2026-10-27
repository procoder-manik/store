import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/config";
import { addNote } from "../../actions";

export default async function Customer({ params }: { params: Promise<{ phone: string }> }) {
  const { phone } = await params;
  if (!/^01\d{9}$/.test(phone)) notFound();
  const supabase = await createClient();
  const [{ data: orders }, { data: notes }] = await Promise.all([
    supabase.from("orders").select("id, order_no, status, total, created_at, guest_name, guest_email, shipping_address").eq("guest_phone", phone).order("created_at", { ascending: false }),
    supabase.from("crm_notes").select("id, note, created_at").eq("phone", phone).order("created_at", { ascending: false }),
  ]);
  if (!orders || orders.length === 0) notFound();
  const last = orders[0];
  const spent = orders.filter((o) => !["cancelled", "returned"].includes(o.status)).reduce((n, o) => n + Number(o.total), 0);
  const addr = last.shipping_address as { district?: string; address?: string };

  return (
    <>
      <Link href="/admin/crm" className="text-sm text-muted hover:underline">All customers</Link>
      <h1 className="mt-2 font-display text-2xl font-semibold">{last.guest_name}</h1>
      <p className="mt-1 text-sm text-muted"><a href={`tel:${phone}`} className="underline">{phone}</a>{last.guest_email ? `, ${last.guest_email}` : ""}. {addr?.address}, {addr?.district}. Spent {formatPrice(spent)} over {orders.length} {orders.length === 1 ? "order" : "orders"}.</p>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold">Orders</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {orders.map((o) => <li key={o.id} className="flex justify-between py-3"><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">#{o.order_no}<span className="ml-2 text-xs font-normal capitalize text-muted">{o.status}</span></Link><span>{formatPrice(Number(o.total))}</span></li>)}
          </ul>
        </section>
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold">Notes</h2>
          <form action={addNote} className="mt-3 grid gap-2"><input type="hidden" name="phone" value={phone} /><textarea name="note" required maxLength={1000} rows={2} placeholder="Add a note about this customer" className="rounded-xl border border-line bg-paper px-3 py-2 text-sm" /><button className="w-fit rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">Save note</button></form>
          <ul className="mt-4 grid gap-3 text-sm">
            {(notes ?? []).length === 0 && <li className="text-muted">No notes yet.</li>}
            {(notes ?? []).map((n) => <li key={n.id}><p className="whitespace-pre-line">{n.note}</p><p className="text-xs text-muted">{new Date(n.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p></li>)}
          </ul>
        </section>
      </div>
    </>
  );
}
