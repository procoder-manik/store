"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Heart, Menu, Monitor, Moon, Phone, ShoppingBag, Sun, User, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/lists";
import type { Cat } from "@/lib/catalog";
import type { HeaderStyleCfg } from "@/lib/layout-styles";
import { DEFAULT_HEADER_STYLE } from "@/lib/layout-styles";
import { ThemePicker } from "./ThemePicker";
import { SearchOverlay } from "./SearchOverlay";

const ORDER = ["light", "dark", "system"] as const;
type L = { label: string; href: string };
type Props = { brand: string; logo?: string; links: L[]; categories?: Cat[]; themePicker?: boolean; cfg?: HeaderStyleCfg; contact?: { phone: string; whatsapp: string } };

export function Header({ brand, logo = "", links, categories = [], themePicker = false, cfg = DEFAULT_HEADER_STYLE, contact }: Props) {
  const { theme, setTheme } = useTheme();
  const path = usePathname();
  const [mounted, setMounted] = useState(false);
  const [menu, setMenu] = useState(false);
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const setOpen = useCart((s) => s.setOpen);
  const wish = useWishlist((s) => s.ids.length);
  useEffect(() => setMounted(true), []);
  useEffect(() => setMenu(false), [path]);

  const dark = cfg.style === "bold";
  const next = ORDER[(ORDER.indexOf((theme ?? "light") as (typeof ORDER)[number]) + 1) % ORDER.length];
  const ThemeIcon = !mounted ? Sun : theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href.split("?")[0]));
  const icon = `grid h-10 w-10 place-items-center rounded-full transition ${dark ? "hover:bg-white/10" : "hover:bg-surface"}`;
  const badge = (accent: boolean) => `absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold ${accent ? "bg-accent text-accent-ink" : "bg-ink text-paper"}`;
  const shell = `${cfg.sticky ? "sticky top-0" : "relative"} z-30 border-b ${dark ? "border-white/10 bg-ink text-paper" : "border-line/70 bg-paper/80 backdrop-blur-xl"}`;
  const navLink = (l: L) => (
    <Link key={l.label + l.href} href={l.href} className={`rounded-pill px-3.5 py-2 transition ${cfg.uppercaseMenu ? "text-xs font-semibold uppercase tracking-wider" : "text-sm"} ${active(l.href) ? (dark ? "bg-white/15 font-medium" : "bg-surface font-medium text-ink") : dark ? "text-paper/70 hover:text-paper" : "text-muted hover:text-ink"}`}>{l.label}</Link>
  );
  const logoEl = (big = false) => <Link href="/" className={`font-display font-semibold tracking-tight ${big ? "text-2xl md:text-3xl" : "text-xl"}`}>{logo ? <img src={logo} alt={brand} className={`${big ? "h-10" : "h-8"} max-w-[180px] object-contain`} /> : brand}</Link>;
  const burger = (cls = "") => <button aria-label="Open menu" onClick={() => setMenu(true)} className={`${icon} md:hidden ${cls}`}><Menu size={20} /></button>;

  const tools = (
    <div className="flex items-center">
      {cfg.showSearch && cfg.style !== "marketplace" && <SearchOverlay />}
      {themePicker && <ThemePicker />}
      {cfg.showThemeToggle && <button aria-label={mounted ? `Switch to ${next} mode` : "Change light or dark mode"} onClick={() => setTheme(next)} className={icon}><ThemeIcon size={18} /></button>}
      {cfg.showAccount && <Link aria-label="My account" href="/account" className={`${icon} hidden sm:grid`}><User size={18} /></Link>}
      {cfg.showWishlist && (
        <Link aria-label="Wishlist" href="/wishlist" className={`${icon} relative hidden sm:grid`}><Heart size={18} />{mounted && wish > 0 && <span className={badge(false)}>{wish}</span>}</Link>
      )}
      <button aria-label="Open cart" onClick={() => setOpen(true)} className={`${icon} relative`}><ShoppingBag size={18} />{mounted && count > 0 && <span className={badge(true)}>{count}</span>}</button>
      {cfg.cta.label && cfg.cta.href && <Link href={cfg.cta.href} className="ml-2 hidden rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition hover:opacity-90 md:inline-block">{cfg.cta.label}</Link>}
    </div>
  );

  const nav = (cls = "") => <nav aria-label="Main" className={`hidden items-center gap-1 md:flex ${cls}`}>{links.map(navLink)}</nav>;

  let body: React.ReactNode;
  if (cfg.style === "centered") {
    body = (
      <>
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 md:h-20 md:px-8">
          <div>{burger()}</div>
          {logoEl(true)}
          <div className="flex justify-end">{tools}</div>
        </div>
        <div className="hidden border-t border-line/60 md:block"><div className="mx-auto flex max-w-7xl justify-center px-8 py-1">{nav("!flex")}</div></div>
      </>
    );
  } else if (cfg.style === "split") {
    body = (
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 md:px-8">
        <div className="flex items-center">{burger()}{nav()}</div>
        {logoEl()}
        <div className="flex justify-end">{tools}</div>
      </div>
    );
  } else if (cfg.style === "marketplace") {
    const row2 = [...links, ...categories.slice(0, 6).map((c) => ({ label: c.label, href: `/category/${c.id}` }))];
    body = (
      <>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 md:h-[72px] md:gap-6 md:px-8">
          {burger()}
          {logoEl()}
          <div className="hidden min-w-0 flex-1 md:block">{cfg.showSearch && <SearchOverlay bar />}</div>
          <div className="ml-auto md:ml-0">{tools}</div>
        </div>
        {cfg.showSearch && <div className="px-3 pb-3 md:hidden"><SearchOverlay bar /></div>}
        <div className="hidden border-t border-line/60 md:block"><div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-8 py-1 no-scrollbar">{row2.map(navLink)}</div></div>
      </>
    );
  } else {
    body = (
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 md:px-8">
        {burger()}
        {logoEl()}
        {nav("ml-8")}
        <div className="ml-auto">{tools}</div>
      </div>
    );
  }

  const strip = (cfg.topBar.enabled || (cfg.style === "bold" && (contact?.phone || cfg.topBar.text))) && (cfg.topBar.text || contact?.phone) ? (
    <div className={`${dark ? "border-b border-white/10 bg-black/30 text-paper/80" : "border-b border-line/60 bg-surface text-muted"} text-xs`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-3 py-1.5 md:px-8">
        <span className="truncate">{cfg.topBar.text}</span>
        <span className="flex shrink-0 items-center gap-4">
          {contact?.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:underline"><Phone size={12} /> {contact.phone}</a>}
          <Link href="/track" className="hidden hover:underline sm:inline">Track your order</Link>
        </span>
      </div>
    </div>
  ) : null;

  return (
    <header className={shell}>
      {strip}
      {body}
      {menu && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenu(false)} />
          <nav className="panel-in absolute inset-y-0 left-0 flex w-[82%] max-w-sm flex-col overflow-y-auto bg-surface p-5 text-ink shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-display text-xl font-semibold">{brand}</span>
              <button aria-label="Close menu" onClick={() => setMenu(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-paper"><X size={18} /></button>
            </div>
            <div className="mt-6 grid gap-1">
              {links.map((l) => <Link key={l.label + l.href} href={l.href} className="rounded-xl px-3 py-3 text-lg font-medium hover:bg-paper">{l.label}</Link>)}
              {cfg.cta.label && cfg.cta.href && <Link href={cfg.cta.href} className="mt-2 rounded-pill bg-accent px-5 py-3 text-center text-sm font-semibold text-accent-ink">{cfg.cta.label}</Link>}
            </div>
            {categories.length > 0 && (
              <div className="mt-6 border-t border-line pt-5">
                <p className="px-3 text-xs text-muted">Categories</p>
                <div className="mt-2 grid gap-1">{categories.map((c) => <Link key={c.id} href={`/category/${c.id}`} className="rounded-xl px-3 py-2.5 hover:bg-paper">{c.label}</Link>)}</div>
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
