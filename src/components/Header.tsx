"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronDown, Heart, Menu, Moon, Phone, ShoppingBag, Sun, User, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/lists";
import type { Cat } from "@/lib/catalog";
import type { HeaderStyleCfg } from "@/lib/layout-styles";
import { DEFAULT_HEADER_STYLE } from "@/lib/layout-styles";
import type { ShownMenu } from "@/lib/mega-menu";
import { MegaPanel, MegaStack } from "./MegaPanel";
import { ThemePicker } from "./ThemePicker";
import { SearchOverlay } from "./SearchOverlay";
import { Portal, useOverlay } from "./Portal";

type L = { label: string; href: string };
type Props = { brand: string; logo?: string; links: L[]; categories?: Cat[]; themePicker?: boolean; cfg?: HeaderStyleCfg; contact?: { phone: string; whatsapp: string }; mega?: ShownMenu[] };

export function Header({ brand, logo = "", links, categories = [], themePicker = false, cfg = DEFAULT_HEADER_STYLE, contact, mega = [] }: Props) {
  const { theme, setTheme } = useTheme();
  const path = usePathname();
  const [mounted, setMounted] = useState(false);
  const [menu, setMenu] = useState(false);
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const setOpen = useCart((s) => s.setOpen);
  const wish = useWishlist((s) => s.ids.length);
  useEffect(() => setMounted(true), []);
  useEffect(() => setMenu(false), [path]);

  // The mega menu opens on pointing or keyboard focus, and waits a moment before closing, so moving down into it is easy.
  const [openMega, setOpenMega] = useState("");
  const [megaTop, setMegaTop] = useState(0);
  const [phoneOpen, setPhoneOpen] = useState("");
  const shut = useRef<number | undefined>(undefined);
  const panel = useRef<HTMLDivElement>(null);
  const holdMega = () => window.clearTimeout(shut.current);
  const showMega = (href: string) => {
    holdMega();
    setMegaTop(document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 64);
    setOpenMega(href);
  };
  const leaveMega = () => { holdMega(); shut.current = window.setTimeout(() => setOpenMega(""), 180); };
  const closeMega = useCallback(() => { holdMega(); setOpenMega(""); }, []);
  useEffect(() => closeMega(), [path, closeMega]);
  useEffect(() => {
    if (!openMega) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") closeMega(); };
    window.addEventListener("keydown", esc);
    window.addEventListener("scroll", closeMega, { passive: true });
    return () => { window.removeEventListener("keydown", esc); window.removeEventListener("scroll", closeMega); };
  }, [openMega, closeMega]);
  const megaOf = (href: string) => mega.find((m) => m.href === href);
  const closeMenu = useCallback(() => setMenu(false), []);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useOverlay(menu, closeMenu);

  const dark = cfg.style === "bold";
  const next = theme === "dark" ? "light" : "dark";
  const ThemeIcon = mounted && theme === "dark" ? Moon : Sun;
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href.split("?")[0]));
  const icon = `grid h-10 w-10 place-items-center rounded-full transition ${dark ? "hover:bg-white/10" : "hover:bg-surface"}`;
  const badge = (accent: boolean) => `absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold ${accent ? "bg-accent text-accent-ink" : "bg-ink text-paper"}`;
  const shell = `site-header ${scrolled ? "scrolled" : ""} ${cfg.sticky ? "sticky top-0" : "relative"} z-30 border-b ${dark ? "border-white/10 bg-ink text-paper" : "border-line/70 bg-paper/80 backdrop-blur-xl"}`;
  const navLink = (l: L) => (
    <Link key={l.label + l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined} {...(megaOf(l.href) ? { "aria-haspopup": "true" as const, "aria-expanded": openMega === l.href, onMouseEnter: () => showMega(l.href), onMouseLeave: leaveMega, onFocus: () => showMega(l.href), onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "ArrowDown") { e.preventDefault(); panel.current?.querySelector("a")?.focus(); } } } : {})} className={`thread inline-flex items-center gap-1 px-3.5 py-2 transition ${cfg.uppercaseMenu ? "text-xs font-semibold uppercase tracking-wider" : "text-sm font-medium"} ${active(l.href) ? (dark ? "text-paper" : "text-ink") : dark ? "text-paper/70 hover:text-paper" : "text-muted hover:text-ink"}`}>{l.label}{megaOf(l.href) && <ChevronDown size={13} className={`transition-transform ${openMega === l.href ? "rotate-180" : ""}`} />}</Link>
  );
  const logoEl = (big = false) => <Link href="/" className={`font-display ${big ? "text-2xl md:text-3xl" : "text-[25px]"}`}>{logo ? <img src={logo} alt={brand} className={`${big ? "h-10" : "h-8"} max-w-[180px] object-contain`} /> : brand}</Link>;
  const burger = (cls = "") => <button aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(true)} className={`${icon} shrink-0 md:hidden ${cls}`}><Menu size={20} /></button>;

  const tools = (
    <div className="flex items-center">
      {cfg.showSearch && cfg.style !== "marketplace" && <SearchOverlay />}
      {themePicker && <ThemePicker />}
      {cfg.showThemeToggle && <button aria-label={mounted ? `Switch to ${next} mode` : "Change light or dark mode"} onClick={() => setTheme(next)} className={`${icon} hidden sm:grid`}><ThemeIcon size={18} /></button>}
      {cfg.showAccount && <Link aria-label="My account" href="/account" className={`${icon} hidden sm:grid`}><User size={18} /></Link>}
      {cfg.showWishlist && (
        <Link aria-label="Wishlist" href="/wishlist" className={`${icon} relative hidden sm:grid`}><Heart size={18} />{mounted && wish > 0 && <span className={badge(false)}>{wish}</span>}</Link>
      )}
      <button aria-label="Open cart" onClick={() => setOpen(true)} className={`${icon} relative`}><ShoppingBag size={18} />{mounted && count > 0 && <span key={count} className={`bump ${badge(true)}`}>{count}</span>}</button>
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
      {openMega && megaOf(openMega) && (
        <Portal>
          <div ref={panel} onMouseEnter={holdMega} onMouseLeave={leaveMega} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) leaveMega(); }} style={{ top: megaTop }} className="mega-drop fixed inset-x-0 z-[29] hidden px-2 pt-1 md:block lg:px-4">
            <div className="mx-auto max-w-7xl"><MegaPanel menu={megaOf(openMega) as ShownMenu} onPick={closeMega} /></div>
          </div>
        </Portal>
      )}
      {menu && (
        <Portal>
        <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="fade-in absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={closeMenu} />
          <nav className="drawer-left absolute inset-y-0 left-0 flex h-dvh w-[84%] max-w-sm flex-col overflow-y-auto overscroll-contain bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-ink shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-display text-[25px]">{brand}</span>
              <button aria-label="Close menu" onClick={closeMenu} className="grid h-10 w-10 place-items-center rounded-full hover:bg-paper"><X size={18} /></button>
            </div>
            <div className="mt-6 grid gap-1">
              {links.map((l) => {
                const m = megaOf(l.href);
                return (
                  <div key={l.label + l.href}>
                    <div className="flex items-center">
                      <Link href={l.href} aria-current={active(l.href) ? "page" : undefined} className={`min-w-0 flex-1 rounded-xl px-3 py-3 font-display text-3xl hover:bg-paper ${active(l.href) ? "text-accent" : ""}`}>{l.label}</Link>
                      {m && <button type="button" aria-label={`More in ${l.label}`} aria-expanded={phoneOpen === l.href} onClick={() => setPhoneOpen(phoneOpen === l.href ? "" : l.href)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-paper"><ChevronDown size={18} className={`transition-transform ${phoneOpen === l.href ? "rotate-180" : ""}`} /></button>}
                    </div>
                    {m && phoneOpen === l.href && <MegaStack menu={m} onPick={closeMenu} />}
                  </div>
                );
              })}
              {cfg.cta.label && cfg.cta.href && <Link href={cfg.cta.href} className="mt-2 rounded-pill bg-accent px-5 py-3 text-center text-sm font-semibold text-accent-ink">{cfg.cta.label}</Link>}
            </div>
            {categories.some((c) => !links.some((l) => l.href === `/category/${c.id}`)) && (
              <div className="mt-6 border-t border-line pt-5">
                <p className="px-3 text-xs text-muted">Categories</p>
                <div className="mt-2 grid gap-1">{categories.filter((c) => !links.some((l) => l.href === `/category/${c.id}`)).map((c) => <Link key={c.id} href={`/category/${c.id}`} className="rounded-xl px-3 py-2.5 hover:bg-paper">{c.label}</Link>)}</div>
              </div>
            )}
            <div className="mt-auto grid gap-1 border-t border-line pt-5 text-sm">
              <Link href="/account" className="rounded-xl px-3 py-2.5 hover:bg-paper">My account</Link>
              <Link href="/wishlist" className="rounded-xl px-3 py-2.5 hover:bg-paper">Wishlist</Link>
              <Link href="/track" className="rounded-xl px-3 py-2.5 hover:bg-paper">Track your order</Link>
              {cfg.showThemeToggle && <button onClick={() => setTheme(next)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-paper"><ThemeIcon size={15} /> Switch to {next} mode</button>}
              {contact?.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-paper"><Phone size={15} /> Call {contact.phone}</a>}
            </div>
          </nav>
        </div>
        </Portal>
      )}
    </header>
  );
}
