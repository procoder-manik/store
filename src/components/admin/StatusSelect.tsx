"use client";

import { useRef } from "react";
import { ORDER_STATUSES, statusLabel } from "@/lib/order-status";
import { setAnyStatus } from "@/app/admin/orders/actions";

/** Choose any status for an order. Asks before changing, so a slip of the mouse does nothing. */
export function StatusSelect({ id, current }: { id: string; current: string }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={setAnyStatus} className="inline-block">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={current}
        aria-label="Change status"
        onChange={(e) => {
          if (e.target.value === current) return;
          if (confirm(`Change this order to "${statusLabel(e.target.value)}"?`)) form.current?.requestSubmit();
          else e.target.value = current;
        }}
        className="rounded-pill border border-line bg-surface py-1.5 pl-3 pr-8 text-xs"
      >
        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
      </select>
    </form>
  );
}
