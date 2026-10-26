"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startPaymentAction, switchToCod } from "@/app/pay/actions";
import { formatPrice } from "@/lib/config";

export function PayNow({ orderId, total }: { orderId: string; total: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="mt-6 grid gap-3">
      <button disabled={pending} onClick={() => { setError(""); start(async () => { const r = await startPaymentAction(orderId); if (r.ok) window.location.assign(r.url); else setError(r.error); }); }} className="rounded-full bg-accent py-3.5 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Opening payment..." : `Pay ${formatPrice(total)} online`}</button>
      <button disabled={pending} onClick={() => { setError(""); start(async () => { const r = await switchToCod(orderId); if (r.ok) router.push(`/thank-you/${orderId}`); else setError(r.error ?? "Could not change the order."); }); }} className="rounded-full border border-line py-3.5 text-sm font-medium hover:bg-paper disabled:opacity-50">Pay cash on delivery instead</button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
