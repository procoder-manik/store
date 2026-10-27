import Link from "next/link";
import { Banknote, LifeBuoy, Truck } from "lucide-react";
import type { Cat } from "@/lib/catalog";
import type { Settings } from "@/lib/settings";
import { NewsletterForm } from "./NewsletterForm";

export function Footer({ categories, brand, footer, contact }: { categories: Cat[]; brand: Settings["brand"]; footer: Settings["footer"]; contact: Settings["contact"] }) {
  const cols = footer.columns.length
    ? footer.columns
    : [
        { title: "Shop", links: [{ label: "All products", href: "/shop" }, ...categories.map((c) => ({ label: c.label, href: `/category/${c.id}` }))] },
        { title: "Help", links: [{ label: "Track your order", href: "/track" }, { label: "Delivery", href: "/shipping" }, { label: "Returns and exchanges", href: "/returns" }, { label: "Size guide", href: "/size-guide" }, { label: "Questions", href: "/faq" }, { label: "Contact us", href: "/contact" }] },
        { title: "Company", links: [{ label: "About us", href: "/about" }, { label: "My account", href: "/account" }, { label: "Privacy policy", href: "/privacy" }, { label: "Terms of service", href: "/terms" }] },
      ];
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="border-b border-line">
        <ul className="mx-auto grid max-w-6xl gap-4 px-5 py-7 text-sm sm:grid-cols-3">
          {[[Banknote, "Cash on delivery", "Check it, then pay."], [Truck, "Delivery across Bangladesh", "Inside and outside Dhaka."], [LifeBuoy, "Help when you need it", "Call, WhatsApp or write to us."]].map(([Icon, t, d]) => {
            const I = Icon as typeof Truck;
            return <li key={t as string} className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent"><I size={18} /></span><span><span className="block font-medium">{t as string}</span><span className="text-muted">{d as string}</span></span></li>;
          })}
        </ul>
      </div>
      <div style={{ ["--n" as string]: cols.length } as React.CSSProperties} className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:[grid-template-columns:1.4fr_repeat(var(--n),minmax(0,1fr))]">
        <div>
          <p className="font-display text-xl font-semibold">{brand.name}</p>
          <p className="mt-3 max-w-xs text-sm text-muted">{footer.about || `${brand.tagline}. Order online and pay in cash when it arrives.`}</p>
          {(contact.phone || contact.whatsapp) && (
            <p className="mt-4 grid gap-1 text-sm">
              {contact.phone && <a href={`tel:${contact.phone}`} className="hover:underline">Call {contact.phone}</a>}
              {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:underline">Chat on WhatsApp</a>}
            </p>
          )}
          {footer.newsletter && <NewsletterForm />}
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-medium">{c.title}</p>
            <ul className="mt-3 grid gap-2 text-sm text-muted">
              {c.links.map((l) => <li key={l.label + l.href}><Link href={l.href} className="hover:text-ink">{l.label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <p className="border-t border-line px-5 py-5 text-center text-xs text-muted">{footer.copyright || `\u00a9 ${new Date().getFullYear()} ${brand.name}. All rights reserved.`}</p>
    </footer>
  );
}
