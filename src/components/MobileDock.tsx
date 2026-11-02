"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { House, LayoutGrid, ShoppingBag, User, X } from "lucide-react";
import { formatPrice } from "@/lib/config";
import { useCart } from "@/lib/cart";
import { Portal, useOverlay } from "./Portal";
import { SearchOverlay } from "./SearchOverlay";

type L = { label: string; href: string };

// These pages have their own button at the bottom, or need the whole screen.
const HIDE = /^\/(checkout|thank-you|pay|login|reset-password|invoice)(\/|$)/;

function useCartSummary() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const total = useCart((s) => s.items.reduce((n, i) => n + i.qty * i.price, 0));
  return { count: ready ? count : 0, total: ready ? total : 0 };
}

/** Home, menu, cart, search and account within thumb's reach on a phone. Switched on or off in Admin, Settings. */
export function MobileDock({ links }: { links: L[] }) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const { count } = useCartSummary();
  const setOpen = useCart((s) => s.setOpen);
  const close = useCallback(() => setMenu(false), []);
  useOverlay(menu, close);
  useEffect(() => setMenu(false), [path]);
  if (HIDE.test(path)) return null;
  const on = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <>
      <nav aria-label="Quick links" className="mobile-dock fixed inset-x-0 bottom-0 z-40 bg-accent pb-[env(safe-area-inset-bottom)] text-accent-ink md:hidden">
        <div className="grid h-16 grid-cols-5">
          <Link href="/" aria-current={on("/") ? "page" : undefined} className="dock-item"><House size={21} /><span>Home</span></Link>
          <button type="button" aria-expanded={menu} onClick={() => setMenu(true)} className="dock-item"><LayoutGrid size={21} /><span>Menu</span></button>
          <button type="button" aria-label={`Open cart, ${count} items`} onClick={() => setOpen(true)} className="dock-item">
            <span className="relative">
              <ShoppingBag size={21} />
              {count > 0 && <span key={count} className="bump absolute -right-2.5 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-surface px-1 text-[10px] font-bold text-ink">{count}</span>}
            </span>
            <span>Cart</span>
          </button>
          <SearchOverlay dock />
          <Link href="/account" aria-current={on("/account") ? "page" : undefined} className="dock-item"><User size={21} /><span>Account</span></Link>
        </div>
      </nav>
      {menu && (
        <Portal>
          <div role="dialog" aria-modal="true" aria-label="Menu" onClick={close} className="fixed inset-0 z-[60] flex items-end bg-black/45 backdrop-blur-sm md:hidden">
            <div onClick={(e) => e.stopPropagation()} className="dock-sheet w-full rounded-t-[24px] bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 text-ink">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-display text-xl">Shop by</p>
                <button aria-label="Close menu" onClick={close} className="grid h-10 w-10 place-items-center rounded-full hover:bg-paper"><X size={18} /></button>
              </div>
              <ul className="grid max-h-[60dvh] grid-cols-2 gap-2 overflow-y-auto pb-1">
                {links.map((l) => (
                  <li key={l.label + l.href}><Link href={l.href} onClick={close} className="flex min-h-12 items-center rounded-xl border border-line px-3.5 py-2 text-sm font-medium transition hover:border-ink/40">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

/** The tab on the side of a phone screen that shows what is in the cart. Switched on or off in Admin, Settings. */
export function CartChip() {
  const path = usePathname();
  const { count, total } = useCartSummary();
  const setOpen = useCart((s) => s.setOpen);
  if (HIDE.test(path)) return null;
  return (
    <button type="button" aria-label={`Open cart, ${count} items, ${formatPrice(total)}`} onClick={() => setOpen(true)} className="cart-chip fixed right-0 top-1/2 z-30 w-[68px] -translate-y-1/2 overflow-hidden rounded-l-xl shadow-[0_10px_28px_-8px_rgba(0,0,0,0.45)] transition active:scale-95 md:hidden">
      <span className="flex flex-col items-center gap-0.5 bg-accent px-1 py-2 text-accent-ink">
        <ShoppingBag size={18} />
        <span className="text-[11px] font-medium leading-tight">{count} {count === 1 ? "Item" : "Items"}</span>
      </span>
      <span className="block truncate bg-surface px-1 py-1.5 text-center text-[12px] font-bold tabular-nums text-ink">{formatPrice(total)}</span>
    </button>
  );
}
