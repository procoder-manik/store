import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/config";
import { PurchaseEvent } from "@/components/PurchaseEvent";

export const metadata: Metadata = { title: "Order received", robots: { index: false } };

type Item = { id: string; name_snapshot: string; unit_price: number | string; qty: number };

export default async function ThankYou({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createAdminClient();
  const { data: o } = await db
    .from("orders")
    .select("order_no, guest_name, subtotal, shipping_fee, discount, total, status, payment_method, payment_status, shipping_address, order_items(id, name_snapshot, unit_price, qty)")
    .eq("id", id)
    .maybeSingle();
  if (!o) notFound();
  const items = o.order_items as Item[];
  const addr = o.shipping_address as { district?: string };

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <PurchaseEvent orderNo={Number(o.order_no)} total={Number(o.total)} />
      <h1 className="font-display text-3xl font-semibold">Thank you, {String(o.guest_name).split(" ")[0]}.</h1>
      <p className="mt-3 text-sm text-muted">Order #{o.order_no} is received. {o.payment_status === "paid" ? "Your online payment is received and we will confirm your order shortly." : o.payment_method === "sslcommerz" ? "It is waiting for your online payment." : `We will call you shortly to confirm it. Pay in cash when it arrives${addr?.district ? ` in ${addr.district}` : ""}.`}</p>
      {o.payment_method === "sslcommerz" && o.payment_status !== "paid" && o.status === "pending" && <Link href={`/pay/${id}`} className="mt-3 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">Complete payment</Link>}
      <div className="mt-6 rounded-xl border border-line bg-surface p-5">
        <ul className="divide-y divide-line text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-3"><span>{i.name_snapshot} x {i.qty}</span><span>{formatPrice(Number(i.unit_price) * i.qty)}</span></li>
          ))}
        </ul>
        <dl className="mt-3 grid gap-2 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(Number(o.subtotal))}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{Number(o.shipping_fee) === 0 ? "Free" : formatPrice(Number(o.shipping_fee))}</dd></div>
          {Number(o.discount) > 0 && <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd>-{formatPrice(Number(o.discount))}</dd></div>}
          <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatPrice(Number(o.total))}</dd></div>
        </dl>
      </div>
      <p className="mt-6 text-sm text-muted">Keep your order number <span className="font-medium text-ink">#{o.order_no}</span>. You can follow it any time on the <Link href="/track" className="underline">tracking page</Link>.</p>
      <Link href="/" className="mt-4 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink">Keep shopping</Link>
    </main>
  );
}
