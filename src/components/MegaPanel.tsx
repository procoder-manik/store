"use client";

import Link from "next/link";
import { CreditCard, Clock, Gift, Headset, RefreshCw, ShieldCheck, Star, Truck } from "lucide-react";
import { formatPrice } from "@/lib/config";
import type { MegaProduct, PerkIcon, ShownColumn, ShownMenu } from "@/lib/mega-menu";

const ICONS: Record<PerkIcon, typeof Truck> = { truck: Truck, shield: ShieldCheck, refresh: RefreshCw, headset: Headset, gift: Gift, card: CreditCard, clock: Clock, star: Star };
const WIDTH: Record<ShownColumn["kind"], number> = { links: 1, products: 1.5, promo: 1.35, perks: 1.15 };

function Price({ p }: { p: MegaProduct }) {
  return <span className="text-xs tabular-nums text-muted">{formatPrice(p.price)}{p.compareAt != null && <s className="ml-1.5 opacity-70">{formatPrice(p.compareAt)}</s>}{p.preorder && <span className="btn-preorder ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]">Pre-order</span>}</span>;
}

function Column({ c, onPick }: { c: ShownColumn; onPick?: () => void }) {
  const title = "title" in c && c.title && c.kind !== "promo" ? <p className="mb-3 text-[13px] font-semibold tracking-[-0.01em]">{c.title}</p> : null;
  if (c.kind === "links") {
    return <div>{title}<ul className="grid gap-0.5">{c.links.map((l) => <li key={l.label + l.href}><Link href={l.href} onClick={onPick} className="block rounded-lg px-2 py-1.5 -mx-2 text-sm text-muted transition hover:bg-ink/[0.06] hover:text-ink">{l.label}</Link></li>)}</ul></div>;
  }
  if (c.kind === "products") {
    return (
      <div>
        {title}
        {c.style === "cards" ? (
          <ul className="grid grid-cols-3 gap-3">
            {c.products.map((p) => <li key={p.id}><Link href={`/product/${p.slug}`} onClick={onPick} className="group block"><span className="block aspect-square overflow-hidden rounded-xl bg-ink/[0.04]">{p.image && <img src={p.image} alt="" loading="lazy" className="h-full w-full object-contain p-1.5 transition duration-500 group-hover:scale-105" />}</span><span className="mt-1.5 block truncate text-[13px] font-medium">{p.name}</span><Price p={p} /></Link></li>)}
          </ul>
        ) : (
          <ul className="grid gap-1">
            {c.products.map((p) => <li key={p.id}><Link href={`/product/${p.slug}`} onClick={onPick} className="-mx-2 flex items-center gap-3 rounded-xl p-2 transition hover:bg-ink/[0.06]"><span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink/[0.04]">{p.image && <img src={p.image} alt="" loading="lazy" className="h-full w-full object-contain p-1" />}</span><span className="min-w-0"><span className="block truncate text-[13px] font-medium">{p.name}</span><Price p={p} /></span></Link></li>)}
          </ul>
        )}
        {c.products.length === 0 && <p className="text-xs text-muted">No products match yet.</p>}
      </div>
    );
  }
  if (c.kind === "promo") {
    const body = (
      <>
        {c.image && <img src={c.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
        {c.image && <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />}
        <span className="relative mt-auto grid gap-1.5 p-4">
          <span className="font-display text-xl leading-tight">{c.title}</span>
          {c.text && <span className="text-xs opacity-90">{c.text}</span>}
          {c.code && <span className="w-fit rounded-md border border-dashed border-current px-2 py-0.5 font-mono text-xs font-semibold">{c.code}</span>}
          {c.button && <span className="mt-1 w-fit rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black">{c.button}</span>}
        </span>
      </>
    );
    const cls = `relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl ${c.image ? "text-white" : "bg-accent text-accent-ink"}`;
    return c.link ? <Link href={c.link} onClick={onPick} className={cls}>{body}</Link> : <div className={cls}>{body}</div>;
  }
  return (
    <div>
      {title}
      <ul className="grid gap-3">
        {c.items.map((i) => { const I = ICONS[i.icon] ?? Truck; return <li key={i.title} className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/[0.06]"><I size={16} /></span><span className="min-w-0"><span className="block text-[13px] font-medium">{i.title}</span><span className="block text-xs text-muted">{i.text}</span></span></li>; })}
      </ul>
    </div>
  );
}

/** The wide panel under the top menu. The same drawing is used in the shop and in the Admin preview. */
export function MegaPanel({ menu, onPick }: { menu: ShownMenu; onPick?: () => void }) {
  return (
    <div style={{ gridTemplateColumns: menu.columns.map((c) => `minmax(0, ${c.kind === "products" && c.style === "cards" ? 2.1 : WIDTH[c.kind]}fr)`).join(" ") }} className="mega-panel grid gap-8 rounded-[24px] border border-ink/10 p-6 text-ink lg:p-7">
      {menu.columns.map((c) => <Column key={c.id} c={c} onPick={onPick} />)}
    </div>
  );
}

/** The same content stacked, for the phone menu. */
export function MegaStack({ menu, onPick }: { menu: ShownMenu; onPick?: () => void }) {
  return <div className="grid gap-5 px-3 pb-3 pt-1">{menu.columns.map((c) => <Column key={c.id} c={c.kind === "products" ? { ...c, style: "rows" } : c} onPick={onPick} />)}</div>;
}
