"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X } from "lucide-react";
import { quickProduct } from "@/app/admin/products/quick-actions";

const input = "w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm";

/** Change a product's name, price and status without leaving the list. */
export function QuickEdit({ id, name, price, status }: { id: string; name: string; price: number; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name, price: String(price), status });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (!open) return <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-muted underline hover:text-ink"><Pencil size={12} /> Quick edit</button>;

  return (
    <div className="mt-2 grid gap-2 rounded-xl border border-line bg-paper p-3">
      <div className="flex items-center justify-between"><span className="text-xs font-medium">Quick edit</span><button aria-label="Close" onClick={() => setOpen(false)}><X size={14} /></button></div>
      <input aria-label="Name" className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <input aria-label="Price" type="number" min={0} step="0.01" className={input} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
        <select aria-label="Status" className={input} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="active">Live in the shop</option>
          <option value="draft">Draft, hidden</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        disabled={pending}
        onClick={() => start(async () => {
          const fd = new FormData();
          fd.set("id", id); fd.set("name", f.name); fd.set("price", f.price); fd.set("status", f.status);
          try { await quickProduct(fd); setOpen(false); router.refresh(); } catch (e) { setError((e as Error).message); }
        })}
        className="rounded-pill bg-accent py-2 text-xs font-semibold text-accent-ink disabled:opacity-50"
      >{pending ? "Saving..." : "Save"}</button>
    </div>
  );
}
