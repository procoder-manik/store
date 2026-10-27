"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import type { Product } from "@/lib/demo-products";
import { formatPrice } from "@/lib/config";
import { placeLandingOrder } from "@/app/lp/actions";
import { ProductArt } from "./ProductArt";

export type Offer = { qty: number; price: number; label: string };
export type LandingData = { slug: string; headline: string; subheadline: string; bullets: string[]; heroImage: string; cta: string; offers: Offer[] };
type Zone = { id: string; name: string; fee: number; freeOver: number | null };

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm";

export function LandingView({ landing, product, zones }: { landing: LandingData; product: Product; zones: Zone[] }) {
  const router = useRouter();
  const [offerQty, setOfferQty] = useState(landing.offers[0].qty);
  const [colorIdx, setColorIdx] = useState(0);
  const [size, setSize] = useState(product.sizes[1] ?? product.sizes[0] ?? "");
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const offer = landing.offers.find((o) => o.qty === offerQty) ?? landing.offers[0];
  const hasColors = product.hasColors !== false;
  const color = product.colors[colorIdx] ?? product.colors[0];
  const find = (sz: string) => product.variants?.find((v) => v.colorName === (hasColors ? color.name : "") && v.size === sz);
  const tracked = (product.variants?.length ?? 0) > 0;
  const variant = find(size);
  const ok = !tracked || (!!variant && variant.stock >= offer.qty);
  const zone = zones.find((z) => z.id === zoneId);
  const shipping = zone ? (zone.freeOver != null && offer.price >= zone.freeOver ? 0 : zone.fee) : 0;
  const img = landing.heroImage || product.image;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    start(async () => {
      const r = await placeLandingOrder({
        slug: landing.slug, qty: offer.qty, variantId: variant?.id, name: String(f.get("name")), phone: String(f.get("phone")), zoneId,
        district: String(f.get("district")), address: String(f.get("address")), note: String(f.get("note") ?? ""), website: String(f.get("website") ?? ""),
      });
      if (!r.ok) return setError(r.error);
      router.push(`/thank-you/${r.id}`);
    });
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-10 px-5 py-8 md:grid-cols-2 md:gap-14 md:py-14">
      <div className="md:sticky md:top-24 md:self-start">
        {img ? <img src={img} alt={product.name} className="aspect-[4/5] w-full rounded-3xl border border-line object-cover" /> : <ProductArt kind={product.kind} color={color.hex} className="aspect-[4/5] w-full rounded-3xl border border-line" />}
      </div>

      <div>
        <h1 className="font-display text-3xl font-semibold leading-tight md:text-4xl">{landing.headline}</h1>
        {landing.subheadline && <p className="mt-3 text-muted">{landing.subheadline}</p>}
        {landing.bullets.length > 0 && (
          <ul className="mt-5 grid gap-2.5">
            {landing.bullets.map((b) => <li key={b} className="flex items-start gap-2.5 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-accent" />{b}</li>)}
          </ul>
        )}

        <form onSubmit={submit} id="order" className="mt-8 grid gap-4 rounded-3xl border border-line bg-surface p-5 md:p-6">
          <div className="grid gap-2" role="radiogroup" aria-label="Choose your offer">
            {landing.offers.map((o) => {
              const normal = product.basePrice * o.qty;
              const save = normal - o.price;
              return (
                <label key={o.qty} className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 p-4 ${offerQty === o.qty ? "border-accent bg-accent/5" : "border-line"}`}>
                  <span className="flex items-center gap-3 text-sm"><input type="radio" name="offer" checked={offerQty === o.qty} onChange={() => setOfferQty(o.qty)} /><span className="font-medium">{o.label || `Buy ${o.qty}`}</span>{save > 0 && <span className="rounded-pill bg-accent/10 px-2 py-0.5 text-xs text-accent">Save {formatPrice(save)}</span>}</span>
                  <span className="font-display text-lg font-semibold">{formatPrice(o.price)}</span>
                </label>
              );
            })}
          </div>

          {hasColors && (
            <div>
              <p className="text-sm font-medium">Color <span className="font-normal text-muted">{color.name}</span></p>
              <div className="mt-2 flex flex-wrap gap-2.5">{product.colors.map((c, i) => <button type="button" key={c.name} aria-label={c.name} aria-pressed={i === colorIdx} onClick={() => setColorIdx(i)} style={{ background: c.hex }} className={`h-9 w-9 rounded-full border border-line ${i === colorIdx ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : ""}`} />)}</div>
            </div>
          )}
          {product.sizes.length > 0 && (
            <div>
              <p className="text-sm font-medium">Size</p>
              <div className="mt-2 flex flex-wrap gap-2">{product.sizes.map((s) => { const v = find(s); const out = tracked && (!v || v.stock < offer.qty); return <button type="button" key={s} aria-pressed={s === size} onClick={() => setSize(s)} className={`h-11 min-w-12 rounded-xl border px-3 text-sm ${s === size ? "border-ink bg-ink text-paper" : "border-line"} ${out ? "line-through opacity-45" : ""}`}>{s}</button>; })}</div>
            </div>
          )}

          <input name="name" required placeholder="Full name" autoComplete="name" className={input} />
          <input name="phone" required inputMode="tel" placeholder="Mobile number, like 01712345678" autoComplete="tel" className={input} />
          <div className="grid gap-3 sm:grid-cols-2">
            <select aria-label="Delivery area" value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={input}>{zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select>
            <input name="district" required placeholder="District" className={input} />
          </div>
          <textarea name="address" required minLength={6} rows={2} placeholder="Full address" autoComplete="street-address" className={input} />
          <input name="note" placeholder="Note (optional)" maxLength={300} className={input} />
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          <dl className="grid gap-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">{offer.label || `Buy ${offer.qty}`}</dt><dd>{formatPrice(offer.price)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>Total, pay on delivery</dt><dd>{formatPrice(offer.price + shipping)}</dd></div>
          </dl>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button disabled={pending || !ok || zones.length === 0} className="rounded-pill bg-accent py-3.5 text-sm font-semibold text-accent-ink disabled:opacity-50">{!ok ? "Not enough stock in this option" : pending ? "Placing order..." : landing.cta}</button>
        </form>
      </div>
    </main>
  );
}
