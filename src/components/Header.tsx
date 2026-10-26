"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Heart, Menu, Monitor, Moon, ShoppingBag, Sun, User, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/lists";
import type { Cat } from "@/lib/catalog";
import { PalettePicker } from "./PalettePicker";
import { SearchOverlay } from "./SearchOverlay";

const ORDER = ["light", "dark", "system"] as const;
const icon = "grid h-10 w-10 place-items-center rounded-full transition hover:bg-surface";

export function Header({ brand, links, categories = [], palettePicker = false }: { brand: string; links: { label: string; href: string }[]; categories?: Cat[]; palettePicker?: boolean }) {
  const { theme, setTheme } = useTheme();
  const path = usePathname();
  const [mounted, setMounted] = useState(false);
  const [menu, setMenu] = useState(false);
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const setOpen = useCart((s) => s.setOpen);
  const wish = useWishlist((s) => s.ids.length);
  useEffect(() => setMounted(true), []);
  useEffect(() => setMenu(false), [path]);

  const next = ORDER[(ORDER.indexOf((theme ?? "light") as (typeof ORDER)[number]) + 1) % ORDER.length];
  const ThemeIcon = !mounted ? Sun : theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href.split("?")[0]));

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 md:px-8">
        <button aria-label="Open menu" onClick={() => setMenu(true)} className={`${icon} md:hidden`}><Menu size={20} /></button>
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">{brand}</Link>
        <nav aria-label="Main" className="ml-8 hidden items-center gap-1 text-sm md:flex">
          {links.map((l) => <Link key={l.label + l.href} href={l.href} className={`rounded-full px-3.5 py-2 transition ${active(l.href) ? "bg-surface font-medium text-ink" : "text-muted hover:text-ink"}`}>{l.label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center">
          <SearchOverlay />
          {palettePicker && <PalettePicker />}
          <button aria-label={`Switch to ${next} theme`} onClick={() => setTheme(next)} className={icon}><ThemeIcon size={18} /></button>
          <Link aria-label="My account" href="/account" className={`${icon} hidden sm:grid`}><User size={18} /></Link>
          <Link aria-label="Wishlist" href="/wishlist" className={`${icon} relative hidden sm:grid`}>
            <Heart size={18} />
            {mounted && wish > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold text-paper">{wish}</span>}
          </Link>
          <button aria-label="Open cart" onClick={() => setOpen(true)} className={`${icon} relative`}>
            <ShoppingBag size={18} />
            {mounted && count > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-ink">{count}</span>}
          </button>
        </div>
      </div>

      {menu && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenu(false)} />
          <nav className="panel-in absolute inset-y-0 left-0 flex w-[82%] max-w-sm flex-col overflow-y-auto bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-display text-xl font-semibold">{brand}</span>
              <button aria-label="Close menu" onClick={() => setMenu(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-paper"><X size={18} /></button>
            </div>
            <div className="mt-6 grid gap-1">
              {links.map((l) => <Link key={l.label + l.href} href={l.href} className="rounded-xl px-3 py-3 text-lg font-medium hover:bg-paper">{l.label}</Link>)}
            </div>
            {categories.length > 0 && (
              <div className="mt-6 border-t border-line pt-5">
                <p className="px-3 text-xs text-muted">Categories</p>
                <div className="mt-2 grid gap-1">{categories.map((c) => <Link key={c.id} href={`/shop?cat=${c.id}`} className="rounded-xl px-3 py-2.5 hover:bg-paper">{c.label}</Link>)}</div>
              </div>
            )}
            <div className="mt-auto grid gap-1 border-t border-line pt-5 text-sm">
              <Link href="/account" className="rounded-xl px-3 py-2.5 hover:bg-paper">My account</Link>
              <Link href="/wishlist" className="rounded-xl px-3 py-2.5 hover:bg-paper">Wishlist</Link>
              <Link href="/track" className="rounded-xl px-3 py-2.5 hover:bg-paper">Track your order</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
