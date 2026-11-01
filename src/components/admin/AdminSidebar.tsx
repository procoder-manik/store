"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes, FileText, HeartPulse, Link2, FolderTree, GalleryHorizontal, LayoutDashboard, Mail, Menu, Package, PanelsTopLeft, Rocket, ScrollText,
  MoreHorizontal, Plus, Receipt, Search, Settings, CreditCard, PanelTop, ShieldAlert, ShoppingBag, ShoppingCart, Sparkles, Star, Store, TicketPercent, Truck, Users, X,
} from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { adminHome, canOpen } from "@/lib/roles";

const GROUPS = [
  { title: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  { title: "Sales", items: [
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/invoices", label: "Invoices", icon: Receipt },
    { href: "/admin/abandoned", label: "Abandoned carts", icon: ShoppingCart },
    { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
    { href: "/admin/bundles", label: "Bundles", icon: Boxes },
    { href: "/admin/shipping", label: "Shipping", icon: Truck },
    { href: "/admin/payments", label: "Payment methods", icon: CreditCard },
    { href: "/admin/fraud", label: "Fraud protection", icon: ShieldAlert },
  ] },
  { title: "Catalog", items: [
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: FolderTree },
    { href: "/admin/reviews", label: "Reviews", icon: Star },
  ] },
  { title: "Marketing", items: [
    { href: "/admin/crm", label: "Customers", icon: Users },
    { href: "/admin/emails", label: "Email marketing", icon: Mail },
    { href: "/admin/landing-pages", label: "Landing pages", icon: Rocket },
    { href: "/admin/banners", label: "Banners", icon: GalleryHorizontal },
    { href: "/admin/seo", label: "Search listings", icon: Search },
  ] },
  { title: "Website", items: [
    { href: "/admin/pages", label: "Pages", icon: FileText },
    { href: "/admin/header-footer", label: "Header and footer", icon: PanelTop },
    { href: "/admin/menus", label: "Site and menu", icon: PanelsTopLeft },
    { href: "/admin/permalinks", label: "URLs and search", icon: Link2 },
    { href: "/admin/settings", label: "Settings", icon: Settings },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/audit", label: "Audit log", icon: ScrollText },
    { href: "/admin/health", label: "Health check", icon: HeartPulse },
  ] },
];

const CREATE = [
  { href: "/admin/products/new", label: "Add a product", icon: Plus },
  { href: "/admin/orders/new", label: "Enter a phone order", icon: Plus },
  { href: "/admin/coupons", label: "Create a coupon", icon: Plus },
];

/** Ctrl+K, or the search button: jump to any admin page, or look up an order or product by what you type. */
function CommandMenu({ onClose, role }: { onClose: () => void; role: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cur, setCur] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);

  const term = q.trim();
  const rows = useMemo(() => {
    const low = term.toLowerCase();
    const pages = [...CREATE, ...GROUPS.flatMap((g) => g.items)].filter((i) => canOpen(role, i.href) && (!low || i.label.toLowerCase().includes(low)));
    const find = term ? [
      { href: `/admin/orders?q=${encodeURIComponent(term)}`, label: `Find orders matching "${term}"`, icon: ShoppingBag },
      { href: `/admin/products?q=${encodeURIComponent(term)}`, label: `Find products matching "${term}"`, icon: Package },
    ].filter((i) => canOpen(role, i.href.split("?")[0])) : [];
    return [...pages, ...find];
  }, [term, role]);

  const go = (href: string) => { onClose(); router.push(href); };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") { e.preventDefault(); setCur((c) => Math.min(rows.length - 1, c + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCur((c) => Math.max(0, c - 1)); }
    if (e.key === "Enter" && rows[cur]) { e.preventDefault(); go(rows[cur].href); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Search the admin panel" onClick={onClose} className="fade-in fixed inset-0 z-[80] bg-black/40 px-3 pt-[8vh] backdrop-blur-sm md:pt-[14vh]">
      <div onClick={(e) => e.stopPropagation()} className="pop-in mx-auto max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={17} className="text-muted" />
          <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setCur(0); }} onKeyDown={key} placeholder="Search pages, order number, phone or product" aria-label="Search" className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none md:text-sm" style={{ border: 0, boxShadow: "none" }} />
          <button aria-label="Close" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><X size={15} /></button>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto p-2">
          {rows.map((r, i) => {
            const Icon = r.icon;
            return <li key={r.href + r.label}><button onMouseEnter={() => setCur(i)} onClick={() => go(r.href)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${i === cur ? "bg-accent/10 text-accent" : ""}`}><Icon size={16} />{r.label}</button></li>;
          })}
        </ul>
      </div>
    </div>
  );
}

function Nav({ path, pending, role }: { path: string; pending: number; role: string }) {
  const on = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`));
  return (
    <nav aria-label="Admin" className="grid gap-6">
      {GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => canOpen(role, i.href)) })).filter((g) => g.items.length > 0).map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-1.5 text-xs text-muted">{g.title}</p>
          <ul className="grid gap-0.5">
            {g.items.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} aria-current={on(href) ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${on(href) ? "bg-accent/10 font-medium text-accent" : "text-ink/80 hover:bg-paper hover:text-ink"}`}>
                  <Icon size={17} strokeWidth={on(href) ? 2.2 : 1.8} />{label}
                  {href === "/admin/orders" && pending > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">{pending}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({ brand, pending = 0, role = "super_admin" }: { brand: string; pending?: number; role?: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [cmd, setCmd] = useState(false);
  useEffect(() => { setOpen(false); setCmd(false); }, [path]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmd(true); } };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const tabs = [
    { href: "/admin", label: "Home", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/crm", label: "Customers", icon: Users },
  ].filter((t) => canOpen(role, t.href));
  const onTab = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  const body = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between px-2 pt-1">
        <Link href={adminHome(role)} className="font-display text-lg font-semibold tracking-tight">{brand}<span className="ml-2 rounded-pill bg-paper px-2 py-0.5 align-middle text-xs font-normal text-muted">Admin</span></Link>
      </div>
      <button onClick={() => setCmd(true)} className="flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm text-muted transition hover:border-ink/40"><Search size={15} /> Search<kbd className="ml-auto hidden rounded border border-line px-1.5 text-[11px] lg:block">Ctrl K</kbd></button>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1"><Nav path={path} pending={pending} role={role} /></div>
      <div className="grid gap-2 border-t border-line pt-4">
        <p className="flex items-center gap-2 px-2 text-xs text-muted"><Sparkles size={14} className="text-accent" /> Click any text box, then the spark, to write it with AI.</p>
        <div className="flex items-center gap-2">
          <Link href="/" target="_blank" className="flex flex-1 items-center justify-center gap-2 rounded-pill border border-line py-2 text-sm font-medium hover:bg-paper"><Store size={15} /> View store</Link>
          <SignOutButton />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur lg:hidden">
        <button aria-label="Open admin menu" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-paper"><Menu size={20} /></button>
        <span className="font-display font-semibold">{brand} admin</span>
        <button aria-label="Search the admin panel" onClick={() => setCmd(true)} className="ml-auto grid h-10 w-10 place-items-center rounded-full hover:bg-paper"><Search size={18} /></button>
      </div>
      {cmd && <CommandMenu role={role} onClose={() => setCmd(false)} />}
      <nav aria-label="Quick links" style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }} className="fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={onTab(href) ? "page" : undefined} className={`relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${onTab(href) ? "font-semibold text-accent" : "text-muted"}`}>
            <Icon size={19} />{label}
            {href === "/admin/orders" && pending > 0 && <span className="absolute left-1/2 top-1.5 ml-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-ink">{pending}</span>}
          </Link>
        ))}
        <button onClick={() => setOpen(true)} className="flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] text-muted"><MoreHorizontal size={19} /> More</button>
      </nav>
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-surface lg:block">{body}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="panel-in absolute inset-y-0 left-0 w-[84%] max-w-xs bg-surface shadow-2xl">
            <button aria-label="Close admin menu" onClick={() => setOpen(false)} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full hover:bg-paper"><X size={16} /></button>
            {body}
          </div>
        </div>
      )}
    </>
  );
}
