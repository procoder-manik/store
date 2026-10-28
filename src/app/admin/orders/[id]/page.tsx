import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { formatPrice } from "@/lib/config";
import { NEXT_STEPS, statusColor, statusLabel } from "@/lib/order-status";
import { steadfastConfigured } from "@/lib/steadfast";
import { createClient } from "@/lib/supabase/server";
import { addOrderNote, bookSteadfast, changeStatus, refundOrder, saveShipment, setAnyStatus, verifyPayment } from "../actions";
import { paymentLabel } from "@/lib/payments";

type Item = { id: string; name_snapshot: string; unit_price: number | string; qty: number };
type Ev = { id: string; status: string; note: string | null; created_at: string };
const card = "rounded-xl border border-line bg-surface p-5";
const field = "w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm";
const JOURNEY = ["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered"];

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: o } = await supabase.from("orders").select("*, order_items(id, name_snapshot, unit_price, qty), order_events(id, status, note, created_at)").eq("id", id).single();
  if (!o) notFound();
  const items = o.order_items as Item[];
  const events = [...(o.order_events as Ev[])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const [{ data: pays }, { data: refunds }] = await Promise.all([
    supabase.from("payments").select("tran_id, amount, status, method, created_at").eq("order_id", id).order("created_at", { ascending: false }),
    supabase.from("order_refunds").select("id, amount, method, note, created_at").eq("order_id", id).order("created_at", { ascending: false }),
  ]);
  const addr = o.shipping_address as { district?: string; address?: string };
  const actions = (NEXT_STEPS[o.status as string] ?? []).filter((a) => a.to !== "cancelled" && a.to !== "returned");
  const refunded = Number(o.refunded_amount ?? 0);
  const left = Number(o.total) - refunded;
  const done = JOURNEY.indexOf(o.status as string);
  const ended = ["cancelled", "returned"].includes(o.status as string);

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-muted hover:underline">All orders</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Order #{o.order_no}<span style={{ background: `${statusColor(o.status as string)}22`, color: statusColor(o.status as string) }} className="ml-3 rounded-pill px-3 py-1 align-middle text-sm font-medium">{statusLabel(o.status as string)}</span></h1>
        <span className="flex gap-2"><a href={`/admin/orders/${o.id}/label`} target="_blank" className="rounded-pill border border-line px-4 py-2 text-sm font-medium hover:bg-paper">Parcel label</a><a href={`/admin/orders/${o.id}/invoice`} target="_blank" className="rounded-pill border border-line px-4 py-2 text-sm font-medium hover:bg-paper">Invoice</a></span>
      </div>

      {!ended && (
        <ol className="mt-5 flex flex-wrap gap-1 text-xs">
          {JOURNEY.map((s, i) => (
            <li key={s} className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 ${i <= done ? "bg-accent/10 font-medium text-accent" : "bg-surface text-muted"}`}>
              {i <= done ? <Check size={12} /> : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />}{statusLabel(s)}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-5">
          <section className={card}>
            <h2 className="font-display text-base font-semibold">Items</h2>
            <ul className="mt-2 divide-y divide-line text-sm">
              {items.map((i) => <li key={i.id} className="flex justify-between gap-3 py-3"><span>{i.name_snapshot} x {i.qty}</span><span className="tabular-nums">{formatPrice(Number(i.unit_price) * i.qty)}</span></li>)}
            </ul>
            <dl className="mt-3 grid gap-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(Number(o.subtotal))}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery ({o.zone})</dt><dd>{formatPrice(Number(o.shipping_fee))}</dd></div>
              {Number(o.discount) > 0 && <div className="flex justify-between"><dt className="text-muted">Discount {o.coupon_code ? `(${o.coupon_code})` : ""}</dt><dd>-{formatPrice(Number(o.discount))}</dd></div>}
              {Number(o.credit_used ?? 0) > 0 && <div className="flex justify-between"><dt className="text-muted">Store credit used</dt><dd>-{formatPrice(Number(o.credit_used))}</dd></div>}
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(Number(o.total))}</dd></div>
              {refunded > 0 && <div className="flex justify-between text-muted"><dt>Refunded</dt><dd>-{formatPrice(refunded)}</dd></div>}
            </dl>
          </section>

          <section className={card}>
            <h2 className="font-display text-base font-semibold">History</h2>
            <ul className="mt-3 grid gap-2.5 text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span style={{ background: statusColor(e.status) }} className="mt-1.5 h-2 w-2 shrink-0 rounded-full" />
                  <span><span className="font-medium">{statusLabel(e.status)}</span> <span className="text-muted">{new Date(e.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>{e.note && <span className="block text-muted">{e.note}</span>}</span>
                </li>
              ))}
            </ul>
            <form action={addOrderNote} className="mt-4 flex gap-2 border-t border-line pt-4"><input type="hidden" name="id" value={o.id} /><input name="note" required maxLength={300} placeholder="Add an internal note" className={field} /><button className="shrink-0 rounded-pill border border-line px-4 text-sm hover:bg-paper">Add</button></form>
          </section>

          {(refunds ?? []).length > 0 && (
            <section className={card}>
              <h2 className="font-display text-base font-semibold">Refunds</h2>
              <ul className="mt-2 divide-y divide-line text-sm">
                {(refunds ?? []).map((r) => <li key={r.id} className="flex justify-between gap-3 py-2.5"><span>{formatPrice(Number(r.amount))} <span className="text-muted">{({ manual: "by hand", store_credit: "as store credit", gateway: "to the payment card" } as Record<string, string>)[r.method as string]}</span>{r.note && <span className="block text-xs text-muted">{r.note}</span>}</span><span className="shrink-0 text-xs text-muted">{new Date(r.created_at as string).toLocaleDateString("en-GB", { dateStyle: "medium" })}</span></li>)}
              </ul>
            </section>
          )}
        </div>

        <aside className="grid h-fit gap-5">
          {actions.length > 0 && (
            <section className={card}>
              <h2 className="font-display text-base font-semibold">What happens next</h2>
              <p className="mt-1 text-xs text-muted">The customer gets an email for each step, in the wording you set under Email marketing, Automatic emails.</p>
              <div className="mt-3 grid gap-2">
                {actions.map((a) => (
                  <form key={a.to} action={changeStatus} className="grid gap-2">
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="status" value={a.to} />
                    {a.to === "shipped" && <><input name="courier" list="couriers" maxLength={40} defaultValue={(o.courier as string) ?? ""} placeholder="Courier (optional)" className={field} /><input name="tracking" maxLength={60} defaultValue={(o.tracking_code as string) ?? ""} placeholder="Tracking number (optional)" className={field} /></>}
                    <input name="note" maxLength={300} placeholder={a.to === "cancelled" ? "Why are you cancelling? The customer sees this." : "Note (optional)"} className={field} />
                    <button className={`rounded-pill py-2.5 text-sm font-semibold ${a.to === "cancelled" || a.to === "returned" ? "border border-line text-red-600" : "bg-accent text-accent-ink"}`}>{a.label}</button>
                  </form>
                ))}
              </div>
            </section>
          )}

          <section className={card}>
            <h2 className="font-display text-base font-semibold">Set any status</h2>
            <p className="mt-1 text-xs text-muted">Made a mistake, or the plan changed? Pick any status, including going back. Stock, store credit and referral rewards are corrected for you. Going back does not email the customer.</p>
            <form action={setAnyStatus} className="mt-3 grid gap-2">
              <input type="hidden" name="id" value={o.id} />
              <select name="status" defaultValue={o.status as string} className={field}>
                {["pending", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"].map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
              <input name="note" maxLength={300} placeholder="Reason or note (optional)" className={field} />
              <button className="rounded-pill border border-line py-2.5 text-sm font-semibold hover:bg-paper">Apply this status</button>
            </form>
          </section>

          <section className={card}>
            <h2 className="font-display text-base font-semibold">Refund</h2>
            {o.payment_status === "paid" || o.payment_status === "partially_refunded" ? (
              <form action={refundOrder} className="mt-3 grid gap-2">
                <input type="hidden" name="id" value={o.id} />
                <input name="amount" type="number" step="0.01" min="1" max={left} defaultValue={left} required className={field} />
                <select name="method" className={field}>
                  <option value="manual">I sent the money by hand (bKash, cash)</option>
                  <option value="store_credit">Give it as store credit</option>
                  <option value="gateway">Returned through the payment gateway</option>
                </select>
                <input name="note" maxLength={200} placeholder="Note (optional)" className={field} />
                <button className="rounded-pill border border-line py-2.5 text-sm font-semibold text-red-600">Record a refund of up to {formatPrice(left)}</button>
                <p className="text-xs text-muted">This records the refund and emails the customer. Gateway refunds must also be made in your SSLCommerz panel.</p>
              </form>
            ) : (
              <p className="mt-2 text-sm text-muted">{o.payment_status === "refunded" ? "This order is fully refunded." : "Nothing to refund: this order has not been paid. For cash on delivery, cancel or return it instead."}</p>
            )}
          </section>

          <section className={`${card} text-sm`}>
            <h2 className="font-display text-base font-semibold">Customer</h2>
            <p className="mt-2 font-medium">{o.guest_name}</p>
            <p><a href={`tel:${o.guest_phone}`} className="underline">{o.guest_phone}</a></p>
            {o.guest_email && <p className="text-muted">{o.guest_email}</p>}
            <p className="mt-2 text-muted">{addr?.address}, {addr?.district}</p>
            {o.note && <p className="mt-2">Note: {o.note}</p>}
            {o.cancel_reason && <p className="mt-2 text-red-600">Cancelled: {o.cancel_reason}</p>}
            {(pays ?? []).length > 0 && <ul className="mt-3 grid gap-1 border-t border-line pt-3 text-xs text-muted">{(pays ?? []).map((x) => <li key={x.tran_id as string}>{x.tran_id}: {formatPrice(Number(x.amount))}, {x.status}{x.method ? `, ${x.method}` : ""}</li>)}</ul>}
            {o.payment_trx_id && (
              <div className="mt-3 rounded-xl border border-line bg-paper p-3">
                <p className="font-medium">{paymentLabel(o.payment_method as string)} payment to check</p>
                <p className="mt-1 text-xs text-muted">Transaction ID <span className="font-mono text-sm font-semibold text-ink">{o.payment_trx_id}</span>{o.payment_sender ? <>, sent from <span className="font-medium text-ink">{o.payment_sender}</span></> : null}, amount {formatPrice(Number(o.total))}.</p>
                {o.payment_status === "unpaid" ? (
                  <form action={verifyPayment} className="mt-2 flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={o.id} />
                    <button name="result" value="received" className="rounded-pill bg-accent px-4 py-2 text-xs font-semibold text-accent-ink">Payment received</button>
                    <button name="result" value="not_found" className="rounded-pill border border-line px-4 py-2 text-xs font-medium">Could not find it</button>
                  </form>
                ) : <p className="mt-2 text-xs font-medium">{o.payment_status === "paid" ? "Marked as paid." : o.payment_status === "failed" ? "Marked as not found." : `Status: ${o.payment_status}.`}</p>}
              </div>
            )}
            <p className="mt-3 text-xs text-muted">Payment: {paymentLabel(o.payment_method as string)} ({o.payment_status}). Risk score {o.risk_score}. IP {o.ip}</p>
          </section>

          <section className={card}>
            <h2 className="font-display text-base font-semibold">Shipment</h2>
            <form action={saveShipment} className="mt-3 grid gap-2">
              <input type="hidden" name="id" value={o.id} />
              <input name="courier" list="couriers" maxLength={40} defaultValue={(o.courier as string) ?? ""} placeholder="Courier, like Steadfast or Pathao" className={field} />
              <datalist id="couriers">{["Steadfast", "Pathao", "RedX", "eCourier", "Paperfly", "Sundarban", "SA Paribahan"].map((c) => <option key={c} value={c} />)}</datalist>
              <input name="tracking" maxLength={60} defaultValue={(o.tracking_code as string) ?? ""} placeholder="Tracking number" className={field} />
              <button className="rounded-pill border border-line py-2 text-sm font-medium hover:bg-paper">Save shipment</button>
            </form>
            {o.consignment_id && <p className="mt-3 text-xs text-muted">Booked with Steadfast. Consignment {o.consignment_id}.</p>}
            {steadfastConfigured() && !o.consignment_id && ["confirmed", "processing"].includes(o.status as string) && (
              <form action={bookSteadfast} className="mt-3"><input type="hidden" name="id" value={o.id} /><button className="w-full rounded-pill bg-ink py-2.5 text-sm font-semibold text-paper">Book with Steadfast</button></form>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
