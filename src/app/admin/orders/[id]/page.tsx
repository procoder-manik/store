import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/config";
import { addOrderNote, bookSteadfast, changeStatus, saveShipment } from "../actions";
import { steadfastConfigured } from "@/lib/steadfast";

const NEXT: Record<string, { to: string; label: string }[]> = {
  pending: [{ to: "confirmed", label: "Confirm order" }, { to: "cancelled", label: "Cancel order" }],
  confirmed: [{ to: "processing", label: "Start processing" }, { to: "cancelled", label: "Cancel order" }],
  processing: [{ to: "shipped", label: "Mark as shipped" }, { to: "cancelled", label: "Cancel order" }],
  shipped: [{ to: "delivered", label: "Mark as delivered" }, { to: "returned", label: "Mark as returned" }],
  delivered: [{ to: "returned", label: "Mark as returned" }],
};

type Item = { id: string; name_snapshot: string; unit_price: number | string; qty: number };
type Ev = { id: string; status: string; note: string | null; created_at: string };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: o } = await supabase.from("orders").select("*, order_items(id, name_snapshot, unit_price, qty), order_events(id, status, note, created_at)").eq("id", id).single();
  if (!o) notFound();
  const items = o.order_items as Item[];
  const events = [...(o.order_events as Ev[])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const { data: pays } = await supabase.from("payments").select("tran_id, amount, status, method, created_at").eq("order_id", id).order("created_at", { ascending: false });
  const addr = o.shipping_address as { district?: string; address?: string };
  const actions = NEXT[o.status] ?? [];

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-muted hover:underline">All orders</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-2xl font-semibold">Order #{o.order_no} <span className="ml-2 text-base font-normal capitalize text-muted">{o.status}</span></h1><span className="flex gap-2"><a href={`/admin/orders/${o.id}/label`} target="_blank" className="rounded-pill border border-line px-4 py-2 text-sm font-medium hover:bg-paper">Parcel label</a><a href={`/admin/orders/${o.id}/invoice`} target="_blank" className="rounded-pill border border-line px-4 py-2 text-sm font-medium hover:bg-paper">Invoice</a></span></div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-5">
          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="font-display text-base font-semibold">Items</h2>
            <ul className="mt-2 divide-y divide-line text-sm">
              {items.map((i) => <li key={i.id} className="flex justify-between gap-3 py-3"><span>{i.name_snapshot} x {i.qty}</span><span>{formatPrice(Number(i.unit_price) * i.qty)}</span></li>)}
            </ul>
            <dl className="mt-3 grid gap-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(Number(o.subtotal))}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery ({o.zone})</dt><dd>{formatPrice(Number(o.shipping_fee))}</dd></div>
              {Number(o.discount) > 0 && <div className="flex justify-between"><dt className="text-muted">Discount {o.coupon_code ? `(${o.coupon_code})` : ""}</dt><dd>-{formatPrice(Number(o.discount))}</dd></div>}
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatPrice(Number(o.total))}</dd></div>
            </dl>
          </section>
          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="font-display text-base font-semibold">History</h2>
            <ul className="mt-2 grid gap-2 text-sm">
              {events.map((e) => <li key={e.id}><span className="font-medium capitalize">{e.status}</span> <span className="text-muted">{new Date(e.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}{e.note ? `, ${e.note}` : ""}</span></li>)}
            </ul>
            <form action={addOrderNote} className="mt-4 flex gap-2 border-t border-line pt-4"><input type="hidden" name="id" value={o.id} /><input name="note" required maxLength={300} placeholder="Add an internal note" className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 py-2 text-sm" /><button className="shrink-0 rounded-pill border border-line px-4 text-sm font-medium hover:bg-paper">Add</button></form>
          </section>
        </div>

        <aside className="grid h-fit gap-5">
          <section className="rounded-xl border border-line bg-surface p-5 text-sm">
            <h2 className="font-display text-base font-semibold">Customer</h2>
            <p className="mt-2 font-medium">{o.guest_name}</p>
            <p><a href={`tel:${o.guest_phone}`} className="underline">{o.guest_phone}</a></p>
            {o.guest_email && <p className="text-muted">{o.guest_email}</p>}
            <p className="mt-2 text-muted">{addr?.address}, {addr?.district}</p>
            {o.note && <p className="mt-2">Note: {o.note}</p>}
            {(pays ?? []).length > 0 && (
              <ul className="mt-3 grid gap-1 border-t border-line pt-3 text-xs text-muted">
                {(pays ?? []).map((x) => <li key={x.tran_id}>{x.tran_id}: {formatPrice(Number(x.amount))}, <span className="capitalize">{x.status}</span>{x.method ? `, ${x.method}` : ""}</li>)}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted">Payment: {o.payment_method?.toUpperCase()} ({o.payment_status}). Risk score {o.risk_score}. IP {o.ip}</p>
          </section>
          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="font-display text-base font-semibold">Shipment</h2>
            <form action={saveShipment} className="mt-3 grid gap-2">
              <input type="hidden" name="id" value={o.id} />
              <input name="courier" list="couriers" maxLength={40} defaultValue={o.courier ?? ""} placeholder="Courier, like Steadfast or Pathao" className="rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
              <datalist id="couriers">{["Steadfast", "Pathao", "RedX", "eCourier", "Paperfly", "Sundarban", "SA Paribahan"].map((c) => <option key={c} value={c} />)}</datalist>
              <input name="tracking" maxLength={60} defaultValue={o.tracking_code ?? ""} placeholder="Tracking number" className="rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
              <button className="rounded-pill border border-line py-2 text-sm font-medium hover:bg-paper">Save shipment</button>
            </form>
            {o.consignment_id && <p className="mt-3 text-xs text-muted">Booked with Steadfast. Consignment {o.consignment_id}.</p>}
            {steadfastConfigured() && !o.consignment_id && ["confirmed", "processing"].includes(o.status) && (
              <form action={bookSteadfast} className="mt-3"><input type="hidden" name="id" value={o.id} /><button className="w-full rounded-pill bg-ink py-2.5 text-sm font-semibold text-paper">Book with Steadfast</button><p className="mt-2 text-xs text-muted">Sends the name, phone, address and cash to collect.</p></form>
            )}
          </section>
          {actions.length > 0 && (
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="font-display text-base font-semibold">Update status</h2>
              {o.payment_status === "paid" && <p className="mt-2 text-xs text-muted">This order is paid online. If you cancel or return it, refund the customer from your SSLCommerz panel.</p>}
              <div className="mt-3 grid gap-2">
                {actions.map((a) => (
                  <form key={a.to} action={changeStatus} className="grid gap-2">
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="status" value={a.to} />
                    {a.to === "shipped" && <><input name="courier" list="couriers" maxLength={40} defaultValue={o.courier ?? ""} placeholder="Courier (optional)" className="rounded-xl border border-line bg-paper px-3 py-2 text-sm" /><input name="tracking" maxLength={60} defaultValue={o.tracking_code ?? ""} placeholder="Tracking number (optional)" className="rounded-xl border border-line bg-paper px-3 py-2 text-sm" /></>}
                    <input name="note" maxLength={300} placeholder="Note (optional)" className="rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
                    <button className={`rounded-pill py-2.5 text-sm font-semibold ${a.to === "cancelled" || a.to === "returned" ? "border border-line text-red-600" : "bg-accent text-accent-ink"}`}>{a.label}</button>
                  </form>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
