"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/config";
import { ProductArt } from "./ProductArt";

export function CartDrawer() {
  const { items, open, setOpen, setQty, remove } = useCart();
  const total = items.reduce((n, i) => n + i.price * i.qty, 0);
  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <>
      <div onClick={() => setOpen(false)} className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside aria-hidden={!open} aria-label="Cart" className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-white/30 bg-surface/90 shadow-[-30px_0_80px_-30px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <h2 className="font-display text-lg font-semibold">Your cart{count > 0 && <span className="ml-2 text-sm font-normal text-muted">{count} {count === 1 ? "item" : "items"}</span>}</h2>
          <button aria-label="Close cart" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-paper"><X size={18} /></button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="grid place-items-center gap-3 py-20 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-paper text-muted"><ShoppingBag size={24} /></span>
              <p className="text-sm text-muted">Your cart is empty.<br />Pick something off the rail.</p>
              <Link href="/shop" onClick={() => setOpen(false)} className="mt-1 rounded-pill border border-line px-5 py-2.5 text-sm font-medium hover:bg-paper">Browse the shop</Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((i) => (
                <li key={i.key} className="flex gap-4 py-4">
                  {i.image ? <img src={i.image} alt="" className="h-20 w-16 shrink-0 rounded-xl border border-line object-cover" /> : <ProductArt kind={i.kind ?? "tee"} color={i.hex ?? "#cfd2d8"} className="h-20 w-16 shrink-0 rounded-xl border border-line" />}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3"><p className="text-sm font-medium leading-snug">{i.name}</p><p className="text-sm font-medium tabular-nums">{formatPrice(i.price * i.qty)}</p></div>
                    <p className="mt-0.5 text-xs text-muted">{[i.color, i.size].filter(Boolean).join(", ")}{(i.color || i.size) && " · "}{formatPrice(i.price)} each</p>
                    <div className="mt-auto flex items-center gap-3 pt-2">
                      <div className="inline-flex items-center rounded-pill border border-line">
                        <button aria-label="Decrease" onClick={() => setQty(i.key, i.qty - 1)} className="grid h-8 w-8 place-items-center"><Minus size={13} /></button>
                        <span className="w-6 text-center text-sm tabular-nums">{i.qty}</span>
                        <button aria-label="Increase" onClick={() => setQty(i.key, Math.min(10, i.qty + 1))} className="grid h-8 w-8 place-items-center"><Plus size={13} /></button>
                      </div>
                      <button onClick={() => remove(i.key)} className="text-xs text-muted underline hover:text-ink">Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-line p-5">
          <div className="flex items-baseline justify-between"><span className="text-sm text-muted">Subtotal</span><span className="font-display text-xl font-semibold tabular-nums">{formatPrice(total)}</span></div>
          <p className="mt-1 text-xs text-muted">Delivery fee and any discount are shown at checkout. Pay in cash when it arrives.</p>
          <Link href="/checkout" onClick={() => setOpen(false)} className={`mt-4 block rounded-pill bg-accent py-3.5 text-center text-sm font-semibold text-accent-ink transition hover:opacity-90 ${items.length === 0 ? "pointer-events-none opacity-40" : ""}`}>Checkout</Link>
        </div>
      </aside>
    </>
  );
}
