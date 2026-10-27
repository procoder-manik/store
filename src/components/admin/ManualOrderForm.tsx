"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createManualOrder } from "@/app/admin/orders/new/actions";
import { formatPrice } from "@/lib/config";

export type Option = { key: string; productId: string; variantId?: string; label: string; price: number; stock: number | null };
type Row = { key: string; qty: string };
const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";

export function ManualOrderForm({ options, zones }: { options: Option[]; zones: { id: string; name: string; fee: number }[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([{ key: "", qty: "1" }]);
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const byKey = new Map(options.map((o) => [o.key, o]));
  const subtotal = rows.reduce((n, r) => n + (byKey.get(r.key)?.price ?? 0) * (Number(r.qty) || 0), 0);
  const fee = zones.find((z) => z.id === zoneId)?.fee ?? 0;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const items = rows.filter((r) => r.key).map((r) => { const o = byKey.get(r.key) as Option; return { productId: o.productId, variantId: o.variantId, qty: Number(r.qty) || 1 }; });
    setError("");
    start(async () => {
      const r = await createManualOrder({ name: f.get("name"), phone: f.get("phone"), district: f.get("district"), address: f.get("address"), zoneId, note: f.get("note") ?? "", discount: Number(f.get("discount") || 0), paid, items });
      if (!r.ok) return setError(r.error);
      router.push(`/admin/orders/${r.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid max-w-3xl gap-5">
      <section className="grid gap-3 rounded-xl border border-line bg-surface p-5">
        <h2 className="font-display text-base font-semibold">Items</h2>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_80px_auto] items-center gap-2">
            <select aria-label="Item" value={r.key} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} className={input}>
              <option value="">Choose an item</option>
              {options.map((o) => <option key={o.key} value={o.key} disabled={o.stock !== null && o.stock <= 0}>{o.label} ({formatPrice(o.price)}{o.stock !== null ? `, ${o.stock} left` : ""})</option>)}
            </select>
            <input aria-label="Quantity" type="number" min={1} max={50} value={r.qty} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} className={input} />
            <button type="button" aria-label="Remove item" disabled={rows.length === 1} onClick={() => setRows(rows.filter((_, j) => j !== i))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper disabled:opacity-30"><Trash2 size={14} /></button>
          </div>
        ))}
        <button type="button" onClick={() => setRows([...rows, { key: "", qty: "1" }])} className="w-fit text-sm underline">Add another item</button>
      </section>

      <section className="grid gap-3 rounded-xl border border-line bg-surface p-5">
        <h2 className="font-display text-base font-semibold">Customer</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={label}>Name</label><input name="name" required className={input} /></div>
          <div><label className={label}>Mobile number</label><input name="phone" required inputMode="tel" placeholder="01712345678" className={input} /></div>
          <div><label className={label}>Delivery area</label><select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={input}>{zones.map((z) => <option key={z.id} value={z.id}>{z.name} ({formatPrice(z.fee)})</option>)}</select></div>
          <div><label className={label}>District</label><input name="district" required className={input} /></div>
        </div>
        <div><label className={label}>Full address</label><textarea name="address" required rows={2} className={input} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={label}>Order note (optional)</label><input name="note" maxLength={300} className={input} /></div>
          <div><label className={label}>Extra discount in taka (optional)</label><input name="discount" type="number" min={0} step="1" className={input} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} /> Already paid (for example by personal bKash). The courier will collect nothing.</label>
      </section>

      <p className="text-sm text-muted">Items {formatPrice(subtotal)} plus delivery {formatPrice(fee)} before discounts. The exact total is worked out when you create the order.</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={pending || zones.length === 0} className="w-fit rounded-pill bg-accent px-7 py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Creating..." : "Create order"}</button>
    </form>
  );
}
