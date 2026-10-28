import Link from "next/link";
import { Banknote, LifeBuoy, Truck } from "lucide-react";
import type { Cat } from "@/lib/catalog";
import type { Settings } from "@/lib/settings";
import { DEFAULT_FOOTER_STYLE, type FooterStyleCfg } from "@/lib/layout-styles";
import { NewsletterForm } from "./NewsletterForm";

type Col = { title: string; links: { label: string; href: string }[] };
type Props = { categories: Cat[]; brand: Settings["brand"]; footer: Settings["footer"]; contact: Settings["contact"]; cfg?: FooterStyleCfg; payments?: string[] };

export function Footer({ categories, brand, footer, contact, cfg = DEFAULT_FOOTER_STYLE, payments = [] }: Props) {
  const cols: Col[] = footer.columns.length
    ? footer.columns
    : [
        { title: "Shop", links: [{ label: "All products", href: "/shop" }, ...categories.map((c) => ({ label: c.label, href: `/category/${c.id}` }))] },
        { title: "Help", links: [{ label: "Track your order", href: "/track" }, { label: "Delivery", href: "/shipping" }, { label: "Returns and exchanges", href: "/returns" }, { label: "Size guide", href: "/size-guide" }, { label: "Questions", href: "/faq" }, { label: "Contact us", href: "/contact" }] },
        { title: "Company", links: [{ label: "About us", href: "/about" }, { label: "My account", href: "/account" }, { label: "Privacy policy", href: "/privacy" }, { label: "Terms of service", href: "/terms" }] },
      ];
  const about = footer.about || `${brand.tagline}. Order online and pay the way that suits you.`;
  const copy = footer.copyright || `\u00a9 ${new Date().getFullYear()} ${brand.name}. All rights reserved.`;
  const flat = cols.flatMap((c) => c.links);
  const social = [["Facebook", cfg.social.facebook], ["Instagram", cfg.social.instagram], ["YouTube", cfg.social.youtube], ["TikTok", cfg.social.tiktok], ["WhatsApp", contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : ""]].filter(([, u]) => u);
  const dark = cfg.style === "dark";
  const mute = dark ? "text-paper/65" : "text-muted";
  const hover = dark ? "hover:text-paper" : "hover:text-ink";
  const wrapCls = dark ? "bg-ink text-paper" : "border-t border-line bg-surface";

  const socials = social.length > 0 && (
    <ul className="flex flex-wrap gap-2">{social.map(([n, u]) => <li key={n}><a href={u} target="_blank" rel="noopener noreferrer" className={`rounded-pill border px-3.5 py-1.5 text-xs font-medium transition ${dark ? "border-white/20 hover:bg-white/10" : "border-line hover:border-ink"}`}>{n}</a></li>)}</ul>
  );
  const pay = cfg.showPayments && payments.length > 0 && (
    <div className="flex flex-wrap items-center gap-2"><span className={`text-xs ${mute}`}>We accept</span>{payments.map((n) => <span key={n} className={`rounded-md border px-2.5 py-1 text-xs font-medium ${dark ? "border-white/20" : "border-line bg-paper"}`}>{n}</span>)}</div>
  );
  const colsGrid = (
    <>
      {cols.map((c) => (
        <div key={c.title}>
          <p className="text-sm font-medium">{c.title}</p>
          <ul className={`mt-3 grid gap-2 text-sm ${mute}`}>{c.links.map((l) => <li key={l.label + l.href}><Link href={l.href} className={hover}>{l.label}</Link></li>)}</ul>
        </div>
      ))}
    </>
  );
  const phoneLines = (contact.phone || contact.whatsapp) && (
    <p className="mt-4 grid gap-1 text-sm">
      {contact.phone && <a href={`tel:${contact.phone}`} className="hover:underline">Call {contact.phone}</a>}
      {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:underline">Chat on WhatsApp</a>}
    </p>
  );
  const bottom = <p className={`border-t px-5 py-5 text-center text-xs ${dark ? "border-white/10 text-paper/60" : "border-line text-muted"}`}>{copy}</p>;

  if (cfg.style === "minimal") {
    return (
      <footer className={`mt-24 ${wrapCls}`}>
        <div className="mx-auto grid max-w-4xl justify-items-center gap-6 px-5 py-12 text-center">
          <p className="font-display text-2xl font-semibold">{brand.name}</p>
          <p className={`max-w-md text-sm ${mute}`}>{about}</p>
          <ul className={`flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm ${mute}`}>{flat.slice(0, 10).map((l) => <li key={l.label + l.href}><Link href={l.href} className={hover}>{l.label}</Link></li>)}</ul>
          {socials}
          {pay}
          {footer.newsletter && <div className="w-full max-w-sm text-left"><NewsletterForm /></div>}
        </div>
        {bottom}
      </footer>
    );
  }

  if (cfg.style === "compact") {
    return (
      <footer className={`mt-24 ${wrapCls}`}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-6 md:flex-row">
          <p className="font-display text-lg font-semibold">{brand.name}</p>
          <ul className={`flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-sm ${mute}`}>{flat.slice(0, 8).map((l) => <li key={l.label + l.href}><Link href={l.href} className={hover}>{l.label}</Link></li>)}</ul>
          {socials}
        </div>
        {<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-line px-5 py-4 text-xs text-muted md:flex-row"><span>{copy}</span>{pay}</div>}
      </footer>
    );
  }

  if (cfg.style === "contact") {
    const rows = [["Phone", contact.phone ? <a key="p" href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a> : null], ["WhatsApp", contact.whatsapp ? <a key="w" href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:underline">Chat with us</a> : null], ["Email", contact.email ? <a key="e" href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a> : null], ["Address", contact.address || null], ["Hours", contact.hours || null]].filter(([, v]) => v);
    return (
      <footer className={`mt-24 ${wrapCls}`}>
        <div style={{ ["--n" as string]: Math.min(cols.length, 3) } as React.CSSProperties} className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:[grid-template-columns:1.3fr_repeat(var(--n),minmax(0,1fr))]">
          <div className="rounded-3xl border border-line bg-paper p-6">
            <p className="font-display text-xl font-semibold">Talk to us</p>
            <p className="mt-1 text-sm text-muted">{about}</p>
            {rows.length > 0 && <dl className="mt-4 grid gap-2 text-sm">{rows.map(([k, v]) => <div key={k as string} className="grid grid-cols-[72px_1fr] gap-2"><dt className="text-muted">{k as string}</dt><dd className="font-medium">{v as React.ReactNode}</dd></div>)}</dl>}
            <div className="mt-4">{socials}</div>
          </div>
          {cols.slice(0, 3).map((c) => (
            <div key={c.title}>
              <p className="text-sm font-medium">{c.title}</p>
              <ul className="mt-3 grid gap-2 text-sm text-muted">{c.links.map((l) => <li key={l.label + l.href}><Link href={l.href} className="hover:text-ink">{l.label}</Link></li>)}</ul>
            </div>
          ))}
        </div>
        {cfg.showPayments && payments.length > 0 && <div className="mx-auto max-w-6xl px-5 pb-8">{pay}</div>}
        {bottom}
      </footer>
    );
  }

  const trust = cfg.showTrust && (
    <div className={`border-b ${dark ? "border-white/10" : "border-line"}`}>
      <ul className="mx-auto grid max-w-6xl gap-4 px-5 py-7 text-sm sm:grid-cols-3">
        {[[Banknote, "Pay your way", "Cash on delivery, bKash, Nagad and more."], [Truck, "Delivery across Bangladesh", "Inside and outside Dhaka."], [LifeBuoy, "Help when you need it", "Call, WhatsApp or write to us."]].map(([Icon, t, d]) => {
          const I = Icon as typeof Truck;
          return <li key={t as string} className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent"><I size={18} /></span><span><span className="block font-medium">{t as string}</span><span className={mute}>{d as string}</span></span></li>;
        })}
      </ul>
    </div>
  );

  return (
    <footer className={`mt-24 ${wrapCls}`}>
      {dark && footer.newsletter && (
        <div className="border-b border-white/10 bg-accent/15">
          <div className="mx-auto grid max-w-6xl items-center gap-5 px-5 py-9 md:grid-cols-2">
            <div><p className="font-display text-2xl font-semibold">Get new arrivals and offers</p><p className="mt-1 text-sm text-paper/70">Join our email list. No spam.</p></div>
            <div className="text-ink"><NewsletterForm /></div>
          </div>
        </div>
      )}
      {trust}
      <div style={{ ["--n" as string]: cols.length } as React.CSSProperties} className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:[grid-template-columns:1.4fr_repeat(var(--n),minmax(0,1fr))]">
        <div>
          <p className="font-display text-xl font-semibold">{brand.name}</p>
          <p className={`mt-3 max-w-xs text-sm ${mute}`}>{about}</p>
          {phoneLines}
          {!dark && footer.newsletter && <NewsletterForm />}
          {social.length > 0 && <div className="mt-4">{socials}</div>}
        </div>
        {colsGrid}
      </div>
      {pay && <div className="mx-auto max-w-6xl px-5 pb-8">{pay}</div>}
      {bottom}
    </footer>
  );
}
