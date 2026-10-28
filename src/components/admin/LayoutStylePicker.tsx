"use client";

import { useState, useTransition } from "react";
import { saveLayoutStyle } from "@/app/admin/header-footer/actions";
import { FOOTER_STYLES, HEADER_STYLES, type FooterStyleCfg, type FooterStyleId, type HeaderStyleCfg, type HeaderStyleId } from "@/lib/layout-styles";
import type { Cat } from "@/lib/catalog";
import type { Settings } from "@/lib/settings";
import { InfoTip } from "./InfoTip";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";

/** A tiny line drawing of each design, so you can compare them at a glance. */
function B({ w, dark, h = 3, c }: { w: number | string; dark?: boolean; h?: number; c?: string }) {
  return <span style={{ width: w, height: h }} className={`block shrink-0 rounded-full ${c ?? (dark ? "bg-white/70" : "bg-ink/35")}`} />;
}
function HeaderThumb({ id }: { id: HeaderStyleId }) {
  const nav = <div className="flex gap-1.5"><B w={14} /><B w={14} /><B w={14} /></div>;
  const dots = <div className="flex gap-1"><B w={5} h={5} /><B w={5} h={5} /><B w={5} h={5} c="bg-accent" /></div>;
  if (id === "centered") return <div className="grid gap-1.5"><div className="grid grid-cols-3 items-center"><span /><B w={26} h={6} c="bg-ink/70" /><div className="flex justify-end">{dots}</div></div><div className="flex justify-center">{nav}</div></div>;
  if (id === "marketplace") return <div className="grid gap-1.5"><div className="flex items-center gap-2"><B w={20} h={6} c="bg-ink/70" /><span className="h-3.5 flex-1 rounded-full border border-ink/25" />{dots}</div><div className="flex gap-1.5"><B w={12} /><B w={12} /><B w={12} /><B w={12} /></div></div>;
  if (id === "split") return <div className="grid grid-cols-3 items-center"><div className="flex gap-1.5"><B w={11} /><B w={11} /></div><div className="flex justify-center"><B w={24} h={6} c="bg-ink/70" /></div><div className="flex justify-end">{dots}</div></div>;
  if (id === "bold") return <div className="-m-2 grid gap-1.5 rounded bg-ink p-2"><div className="flex justify-between"><B w={24} dark /><B w={18} dark /></div><div className="flex items-center gap-2"><B w={20} h={6} dark /><div className="flex gap-1.5"><B w={11} dark /><B w={11} dark /></div><span className="ml-auto h-3.5 w-9 rounded-full bg-accent" /></div></div>;
  return <div className="flex items-center gap-2"><B w={22} h={6} c="bg-ink/70" />{nav}<div className="ml-auto">{dots}</div></div>;
}
function FooterThumb({ id }: { id: FooterStyleId }) {
  const col = <div className="grid gap-1"><B w={14} c="bg-ink/60" /><B w={18} /><B w={14} /><B w={16} /></div>;
  if (id === "minimal") return <div className="grid justify-items-center gap-1.5"><B w={30} h={5} c="bg-ink/70" /><div className="flex gap-1.5"><B w={12} /><B w={12} /><B w={12} /><B w={12} /></div><div className="flex gap-1"><B w={14} h={5} /><B w={14} h={5} /></div></div>;
  if (id === "dark") return <div className="-m-2 grid gap-2 rounded bg-ink p-2"><div className="flex items-center justify-between rounded bg-accent/30 p-1.5"><B w={30} dark /><span className="h-3 w-12 rounded-full bg-white/80" /></div><div className="flex gap-3"><B w={20} h={5} dark /><div className="grid gap-1"><B w={14} dark /><B w={18} dark /></div><div className="grid gap-1"><B w={14} dark /><B w={18} dark /></div></div></div>;
  if (id === "contact") return <div className="flex gap-3"><div className="grid w-1/3 gap-1 rounded border border-ink/25 p-1.5"><B w={20} c="bg-ink/60" /><B w={26} /><B w={22} /></div>{col}{col}</div>;
  if (id === "compact") return <div className="grid gap-2"><div className="flex items-center justify-between"><B w={22} h={5} c="bg-ink/70" /><div className="flex gap-1.5"><B w={12} /><B w={12} /><B w={12} /></div></div><div className="flex justify-between border-t border-ink/15 pt-1.5"><B w={30} /><B w={24} /></div></div>;
  return <div className="grid gap-2"><div className="flex gap-3 border-b border-ink/15 pb-1.5"><B w={22} /><B w={22} /><B w={22} /></div><div className="flex gap-3"><B w={22} h={5} c="bg-ink/70" />{col}{col}</div></div>;
}

function Toggle({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} /> {children}</label>;
}

type Props = { header: HeaderStyleCfg; footer: FooterStyleCfg; brand: Settings["brand"]; links: { label: string; href: string }[]; footerData: Settings["footer"]; contact: Settings["contact"]; categories: Cat[]; payments: string[] };

export function LayoutStylePicker({ header, footer, brand, links, footerData, contact, categories, payments }: Props) {
  const [h, setH] = useState(header);
  const [f, setF] = useState(footer);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const sh = (p: Partial<HeaderStyleCfg>) => { setMsg(null); setH((x) => ({ ...x, ...p })); };
  const sf = (p: Partial<FooterStyleCfg>) => { setMsg(null); setF((x) => ({ ...x, ...p })); };

  const card = (on: boolean) => `grid gap-3 rounded-xl border p-3 text-left transition ${on ? "border-accent ring-2 ring-accent/30" : "border-line hover:border-ink/40"}`;

  return (
    <form onSubmit={(e) => { e.preventDefault(); setMsg(null); start(async () => { const r = await saveLayoutStyle({ header: h, footer: f }); setMsg(r.ok ? { ok: true, text: "Saved. Your store now uses this header and footer." } : { ok: false, text: r.error ?? "Could not save." }); }); }} className="grid max-w-5xl gap-10">
      <section className="grid gap-4">
        <h2 className="font-display text-lg font-semibold">Header<InfoTip text="The bar at the top of every page with your logo, menu, search and cart. Pick the design that fits how many products and categories you have." /></h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HEADER_STYLES.map((s) => (
            <button key={s.id} type="button" aria-pressed={h.style === s.id} onClick={() => sh({ style: s.id })} className={card(h.style === s.id)}>
              <div className="overflow-hidden rounded-lg border border-line bg-paper p-2.5"><HeaderThumb id={s.id} /></div>
              <span><span className="block text-sm font-medium">{s.name}{h.style === s.id && <span className="ml-2 text-xs font-normal text-accent">Selected</span>}</span><span className="text-xs text-muted">{s.desc}</span></span>
            </button>
          ))}
        </div>
        <div className="grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2">
          <Toggle on={h.sticky} onChange={(v) => sh({ sticky: v })}>Stay at the top while scrolling<InfoTip text="Keeps the menu and cart in reach while visitors scroll, which makes buying easier." /></Toggle>
          <Toggle on={h.showSearch} onChange={(v) => sh({ showSearch: v })}>Show search</Toggle>
          <Toggle on={h.showAccount} onChange={(v) => sh({ showAccount: v })}>Show account icon</Toggle>
          <Toggle on={h.showWishlist} onChange={(v) => sh({ showWishlist: v })}>Show wishlist icon</Toggle>
          <Toggle on={h.showThemeToggle} onChange={(v) => sh({ showThemeToggle: v })}>Show light and dark button</Toggle>
          <Toggle on={h.uppercaseMenu} onChange={(v) => sh({ uppercaseMenu: v })}>Menu in CAPITAL LETTERS</Toggle>
          <Toggle on={h.topBar.enabled} onChange={(v) => sh({ topBar: { ...h.topBar, enabled: v } })}>Show a thin strip above the header<InfoTip text="A small strip for a short message, your phone number and a Track order link." /></Toggle>
          <div><label className={label}>Words in that strip (your phone number is added by itself)</label><input className={input} maxLength={120} value={h.topBar.text} onChange={(e) => sh({ topBar: { ...h.topBar, text: e.target.value } })} /></div>
          <div><label className={label}>Header button text (optional)</label><input className={input} maxLength={24} placeholder="Shop now" value={h.cta.label} onChange={(e) => sh({ cta: { ...h.cta, label: e.target.value } })} /></div>
          <div><label className={label}>Header button link</label><input className={input} placeholder="/shop" value={h.cta.href} onChange={(e) => sh({ cta: { ...h.cta, href: e.target.value } })} /></div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Preview</p>
          <div className="pointer-events-none overflow-hidden rounded-xl border border-line bg-paper" aria-hidden>
            <Header brand={brand.name} logo={brand.logo} links={links} categories={categories} cfg={{ ...h, sticky: false }} contact={{ phone: contact.phone, whatsapp: contact.whatsapp }} />
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="font-display text-lg font-semibold">Footer<InfoTip text="The area at the bottom of every page. It builds trust with contact details, policies and the payment methods you accept." /></h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FOOTER_STYLES.map((s) => (
            <button key={s.id} type="button" aria-pressed={f.style === s.id} onClick={() => sf({ style: s.id })} className={card(f.style === s.id)}>
              <div className="overflow-hidden rounded-lg border border-line bg-paper p-2.5"><FooterThumb id={s.id} /></div>
              <span><span className="block text-sm font-medium">{s.name}{f.style === s.id && <span className="ml-2 text-xs font-normal text-accent">Selected</span>}</span><span className="text-xs text-muted">{s.desc}</span></span>
            </button>
          ))}
        </div>
        <div className="grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2">
          <Toggle on={f.showPayments} onChange={(v) => sf({ showPayments: v })}>Show the payment methods you accept<InfoTip text="Shows the payment methods you turned on, so buyers feel safe before checkout." /></Toggle>
          <Toggle on={f.showTrust} onChange={(v) => sf({ showTrust: v })}>Show the delivery promises strip (classic and dark)</Toggle>
          {(["facebook", "instagram", "youtube", "tiktok"] as const).map((k) => (
            <div key={k}><label className={`${label} capitalize`}>{k} link (optional)</label><input className={input} placeholder="https://" value={f.social[k]} onChange={(e) => sf({ social: { ...f.social, [k]: e.target.value } })} /></div>
          ))}
          <p className="text-xs text-muted sm:col-span-2">The about text, link columns and copyright line are edited under Site and menu. Phone and WhatsApp come from Settings.</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-muted">Preview</p>
          <div className="pointer-events-none max-h-[420px] overflow-hidden rounded-xl border border-line bg-paper" aria-hidden>
            <Footer categories={categories} brand={brand} footer={footerData} contact={contact} cfg={f} payments={payments} />
          </div>
        </div>
      </section>

      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
      <button disabled={pending} className="w-fit rounded-pill bg-accent px-7 py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Saving..." : "Save header and footer"}</button>
    </form>
  );
}
