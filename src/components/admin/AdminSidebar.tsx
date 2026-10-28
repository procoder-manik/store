"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Boxes, FileText, HeartPulse, Link2, FolderTree, GalleryHorizontal, LayoutDashboard, Mail, Menu, Package, PanelsTopLeft, Rocket, ScrollText,
  Receipt, Search, Settings, CreditCard, PanelTop, ShieldAlert, ShoppingBag, ShoppingCart, Sparkles, Star, Store, TicketPercent, Truck, Users, X,
} from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

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
    { href: "/admin/audit", label: "Audit log", icon: ScrollText },
    { href: "/admin/health", label: "Health check", icon: HeartPulse },
  ] },
];

function Nav({ path }: { path: string }) {
  const on = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`));
  return (
    <nav aria-label="Admin" className="grid gap-6">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-1.5 text-xs text-muted">{g.title}</p>
          <ul className="grid gap-0.5">
            {g.items.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} aria-current={on(href) ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${on(href) ? "bg-accent/10 font-medium text-accent" : "text-ink/80 hover:bg-paper hover:text-ink"}`}>
                  <Icon size={17} strokeWidth={on(href) ? 2.2 : 1.8} />{label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar({ brand }: { brand: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const body = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center justify-between px-2 pt-1">
        <Link href="/admin" className="font-display text-lg font-semibold tracking-tight">{brand}<span className="ml-2 rounded-pill bg-paper px-2 py-0.5 align-middle text-xs font-normal text-muted">Admin</span></Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1"><Nav path={path} /></div>
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
      </div>
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
