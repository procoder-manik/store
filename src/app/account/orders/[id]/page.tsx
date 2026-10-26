import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/config";
import { OrderTimeline } from "@/components/OrderTimeline";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

type Item = { id: string; name_snapshot: string; unit_price: number | string; qty: number };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: o } = await supabase.from("orders").select("*, order_items(id, name_snapshot, unit_price, qty), order_events(status, created_at)").eq("id", id).maybeSingle();
  if (!o) notFound();
  const items = o.order_items as Item[];
  const addr = o.shipping_address as { district?: string; address?: string };

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 md:py-12">
      <Link href="/account" className="text-sm text-muted hover:underline">My account</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold">Order #{o.order_no}</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <ul className="divide-y divide-line text-sm">
            {items.map((i) => <li key={i.id} className="flex justify-between gap-3 py-3"><span>{i.name_snapshot} x {i.qty}</span><span>{formatPrice(Number(i.unit_price) * i.qty)}</span></li>)}
          </ul>
          <dl className="mt-3 grid gap-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(Number(o.subtotal))}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{Number(o.shipping_fee) === 0 ? "Free" : formatPrice(Number(o.shipping_fee))}</dd></div>
            {Number(o.discount) > 0 && <div className="flex justify-between"><dt className="text-muted">Discount</dt><dd>-{formatPrice(Number(o.discount))}</dd></div>}
            <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{formatPrice(Number(o.total))}</dd></div>
          </dl>
          {o.courier && <p className="mt-3 text-sm">Courier: {o.courier}{o.tracking_code ? `, tracking number ${o.tracking_code}` : ""}</p>}
          <p className="mt-4 text-xs text-muted">Deliver to {addr?.address}, {addr?.district}. Payment: cash on delivery.</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5"><OrderTimeline status={o.status} events={o.order_events} /></div>
      </div>
    </main>
  );
}
