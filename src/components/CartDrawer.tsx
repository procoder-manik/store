"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/config";

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove } = useCart();
  const total = items.reduce((n, i) => n + i.price * i.qty, 0);

  return (
    <>
      <div onClick={() => setOpen(false)} className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside aria-hidden={!open} className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-sm flex-col border-l border-line bg-surface transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <h2 className="font-display text-lg font-semibold">Your cart</h2>
          <button aria-label="Close cart" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <p className="py-10 text-sm text-muted">Your cart is empty. Pick something off the rail.</p>
          ) : (
            items.map((i) => (
              <div key={i.key} className="flex items-start justify-between gap-3 border-b border-line py-4">
                <div>
                  <p className="text-sm font-medium">{i.name}</p>
                  <p className="text-xs text-muted">{i.color}{i.size ? `, ${i.size}` : ""}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <button aria-label="Decrease" onClick={() => setQty(i.key, i.qty - 1)} className="h-7 w-7 rounded-full border border-line">-</button>
                    <span className="w-5 text-center">{i.qty}</span>
                    <button aria-label="Increase" onClick={() => setQty(i.key, i.qty + 1)} className="h-7 w-7 rounded-full border border-line">+</button>
                    <button onClick={() => remove(i.key)} className="ml-2 text-xs text-muted underline">Remove</button>
                  </div>
                </div>
                <p className="text-sm font-medium">{formatPrice(i.price * i.qty)}</p>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-line p-5">
          <div className="mb-4 flex justify-between text-sm"><span className="text-muted">Subtotal</span><span className="font-semibold">{formatPrice(total)}</span></div>
          <Link href="/checkout" onClick={() => setOpen(false)} className={`block rounded-full bg-accent py-3 text-center text-sm font-semibold text-accent-ink ${items.length === 0 ? "pointer-events-none opacity-40" : ""}`}>Checkout</Link>
        </div>
      </aside>
    </>
  );
}
