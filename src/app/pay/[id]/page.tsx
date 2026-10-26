import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/config";
import { PayNow } from "@/components/PayNow";

export const metadata: Metadata = { title: "Complete your payment", robots: { index: false } };

export default async function Pay({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ s?: string }> }) {
  const { id } = await params;
  const { s } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: o } = await createAdminClient().from("orders").select("order_no, total, status, payment_method, payment_status").eq("id", id).maybeSingle();
  if (!o) notFound();
  if (o.payment_status === "paid" || o.payment_method !== "sslcommerz" || o.status !== "pending") redirect(`/thank-you/${id}`);
  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <h1 className="font-display text-2xl font-semibold">Complete your payment</h1>
      <p className="mt-2 text-sm text-muted">Order #{o.order_no}, {formatPrice(Number(o.total))}. Your items are held for a short time while you pay.</p>
      {(s === "failed" || s === "cancelled") && <p role="alert" className="mt-4 rounded-xl border border-line bg-paper p-4 text-sm">{s === "failed" ? "The payment did not go through. You were not charged for this attempt." : "The payment was cancelled."} You can try again or choose cash on delivery.</p>}
      <PayNow orderId={id} total={Number(o.total)} />
    </main>
  );
}
