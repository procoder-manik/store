"use client";

import { useState, useTransition } from "react";
import { trackOrder } from "@/app/track/actions";
import { formatPrice } from "@/lib/config";
import { OrderTimeline } from "./OrderTimeline";

type Found = { orderNo: number; status: string; total: number; courier: string | null; trackingCode: string | null; events: { status: string; created_at: string }[] };
const input = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm";

export function TrackForm() {
  const [error, setError] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError(""); setFound(null);
    start(async () => {
      const r = await trackOrder({ orderNo: f.get("orderNo"), phone: f.get("phone") });
      if (!r.ok) return setError(r.error);
      setFound(r);
    });
  }

  return (
    <>
      <form onSubmit={submit} className="mt-6 grid gap-3">
        <input name="orderNo" required inputMode="numeric" placeholder="Order number, like 1042" className={input} />
        <input name="phone" required inputMode="tel" placeholder="Mobile number used for the order" className={input} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={pending} className="rounded-pill bg-accent py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Checking..." : "Track order"}</button>
      </form>
      {found && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <p className="text-sm"><span className="font-medium">Order #{found.orderNo}</span> <span className="text-muted">({formatPrice(found.total)})</span></p>
          {found.courier && <p className="mt-3 text-sm text-muted">Courier: <span className="text-ink">{found.courier}</span>{found.trackingCode ? <>. Tracking number: <span className="select-all text-ink">{found.trackingCode}</span></> : null}</p>}
          <div className="mt-4"><OrderTimeline status={found.status} events={found.events} /></div>
        </div>
      )}
    </>
  );
}
