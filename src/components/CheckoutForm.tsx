"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { ProductArt } from "./ProductArt";
import { formatPrice } from "@/lib/config";
import { placeOrder, quoteOrder } from "@/app/checkout/actions";
import { captureCart } from "@/app/checkout/capture";

export type Zone = { id: string; name: string; fee: number; freeOver: number | null };
export type BumpInfo = { headline: string; text: string; name: string; price: number; normalPrice: number };
export type Prefill = { name: string; phone: string; email: string; district: string; address: string };
type Quote = { subtotal: number; shipping: number; discount: number; bundleDiscount: number; total: number; couponError?: string };

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";

export function CheckoutForm({ zones, bump = null, prefill = null, onlineEnabled = false }: { zones: Zone[]; bump?: BumpInfo | null; prefill?: Prefill | null; onlineEnabled?: boolean }) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [bumpOn, setBumpOn] = useState(false);
  const [online, setOnline] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const lastCap = useRef("");
  useEffect(() => setMounted(true), []);

  const cartInput = items.map((i) => ({ productId: i.id, variantId: i.variantId, qty: i.qty }));
  const cartKey = JSON.stringify(cartInput);

  useEffect(() => {
    if (!mounted || !zoneId || items.length === 0) return;
    let live = true;
    quoteOrder({ items: JSON.parse(cartKey), zoneId, coupon, bump: bumpOn }).then((r) => {
      if (!live) return;
      if (!r.ok) { setQuote(null); setError(r.error); return; }
      setError("");
      setQuote({ subtotal: r.subtotal, shipping: r.shipping, discount: r.discount, bundleDiscount: r.bundleDiscount, total: r.total, couponError: r.couponError });
    });
    return () => { live = false; };
  }, [mounted, cartKey, zoneId, coupon, items.length, bumpOn]);

  function capture() {
    const el = formRef.current;
    if (!el || items.length === 0) return;
    const f = new FormData(el);
    const phone = String(f.get("phone") ?? ""), email = String(f.get("email") ?? "");
    if (!phone && !email) return;
    const key = `${phone}|${email}|${cartKey}`;
    if (key === lastCap.current) return;
    lastCap.current = key;
    void captureCart({ name: String(f.get("name") ?? ""), phone, email, items: items.map((i) => ({ id: i.id, variantId: i.variantId, name: i.name, color: i.color, size: i.size, price: i.price, qty: i.qty, image: i.image, kind: i.kind, hex: i.hex })) });
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const payload = {
      name: String(f.get("name")), phone: String(f.get("phone")), email: String(f.get("email") ?? ""),
      zoneId, district: String(f.get("district")), address: String(f.get("address")), note: String(f.get("note") ?? ""),
      coupon, bump: bumpOn, paymentMethod: online ? ("online" as const) : ("cod" as const), website: String(f.get("website") ?? ""), items: cartInput,
    };
    start(async () => {
      const r = await placeOrder(payload);
      if (!r.ok) return setError(r.error);
      clear();
      if (r.payUrl) window.location.assign(r.payUrl);
      else router.push(online ? `/pay/${r.id}` : `/thank-you/${r.id}`);
    });
  }

  if (!mounted) return <main className="mx-auto max-w-5xl px-5 py-12" />;
  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-display text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-3 text-sm text-muted">Pick something off the rail, then come back to check out.</p>
        <Link href="/" className="mt-5 inline-block rounded-pill bg-accent px-6 py-3 text-sm font-semibold text-accent-ink">Keep shopping</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 md:py-12">
      <h1 className="font-display text-3xl font-semibold">Checkout</h1>
      <form ref={formRef} onSubmit={submit} className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-4">
          <h2 className="font-display text-lg font-semibold">Delivery details</h2>
          <div><label className={label} htmlFor="name">Full name</label><input id="name" name="name" defaultValue={prefill?.name} required minLength={2} maxLength={80} autoComplete="name" className={input} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={label} htmlFor="phone">Mobile number</label><input id="phone" name="phone" onBlur={capture} defaultValue={prefill?.phone} required inputMode="tel" placeholder="01712345678" autoComplete="tel" className={input} /></div>
            <div><label className={label} htmlFor="email">Email (optional)</label><input id="email" name="email" type="email" onBlur={capture} defaultValue={prefill?.email} autoComplete="email" className={input} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="zone">Delivery area</label>
              <select id="zone" value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={input}>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div><label className={label} htmlFor="district">District</label><input id="district" name="district" defaultValue={prefill?.district} required maxLength={60} className={input} /></div>
          </div>
          <div><label className={label} htmlFor="address">Full address</label><textarea id="address" name="address" defaultValue={prefill?.address} required minLength={6} maxLength={300} rows={3} autoComplete="street-address" className={input} /></div>
          <div><label className={label} htmlFor="note">Order note (optional)</label><input id="note" name="note" maxLength={300} className={input} /></div>
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          {bump && (
            <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-dashed p-4 ${bumpOn ? "border-accent bg-accent/5" : "border-line"}`}>
              <input type="checkbox" checked={bumpOn} onChange={(e) => setBumpOn(e.target.checked)} className="mt-1" />
              <span className="text-sm"><span className="font-medium">{bump.headline}</span><span className="block text-muted">{bump.name}{bump.text ? `. ${bump.text}` : ""}</span><span className="mt-1 block font-medium">{formatPrice(bump.price)}{bump.normalPrice > bump.price && <span className="ml-2 font-normal text-muted line-through">{formatPrice(bump.normalPrice)}</span>}</span></span>
            </label>
          )}

          <h2 className="mt-2 font-display text-lg font-semibold">Payment</h2>
          <div className="grid gap-2 text-sm">
            <label className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-surface p-3 ${!online ? "border-accent" : "border-line"}`}><input type="radio" name="pay" checked={!online} onChange={() => setOnline(false)} /> Cash on delivery</label>
            {onlineEnabled ? (
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-surface p-3 ${online ? "border-accent" : "border-line"}`}><input type="radio" name="pay" checked={online} onChange={() => setOnline(true)} className="mt-1" /><span>Pay online<span className="block text-xs text-muted">bKash, Nagad, Rocket, cards and bank. You will be taken to a secure payment page.</span></span></label>
            ) : (
              <p className="rounded-xl border border-line p-3 text-muted">Online payment is coming soon.</p>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-surface p-5 lg:sticky lg:top-20">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {items.map((i) => (
              <li key={i.key} className="flex gap-3 py-3">
                {i.image ? <img src={i.image} alt="" className="h-16 w-12 shrink-0 rounded-lg border border-line object-cover" /> : <ProductArt kind={i.kind ?? "tee"} color={i.hex ?? "#cfd2d8"} className="h-16 w-12 shrink-0 rounded-lg border border-line" />}
                <span className="min-w-0 flex-1"><span className="block font-medium leading-snug">{i.name}</span><span className="text-xs text-muted">{[i.color, i.size].filter(Boolean).join(", ")}{(i.color || i.size) && ", "}x {i.qty}</span></span>
                <span className="font-medium tabular-nums">{formatPrice(i.price * i.qty)}</span>
              </li>
            ))}
            {bumpOn && bump && <li className="flex justify-between gap-3 py-3"><span>{bump.name}<span className="block text-xs text-muted">Extra offer x 1</span></span></li>}
          </ul>

          <div className="mt-3 flex gap-2">
            <input aria-label="Coupon code" placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} className={input} />
            <button type="button" onClick={() => setCoupon(couponInput.trim())} className="shrink-0 rounded-pill border border-line px-4 text-sm font-medium hover:bg-paper">Apply</button>
          </div>
          {quote?.couponError && <p className="mt-2 text-xs text-red-600">{quote.couponError}</p>}

          {quote && (
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(quote.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{quote.shipping === 0 ? "Free" : formatPrice(quote.shipping)}</dd></div>
              {quote.bundleDiscount > 0 && <div className="flex justify-between"><dt className="text-muted">Bundle savings</dt><dd>-{formatPrice(quote.bundleDiscount)}</dd></div>}
              {quote.discount - quote.bundleDiscount > 0 && <div className="flex justify-between"><dt className="text-muted">Coupon discount</dt><dd>-{formatPrice(quote.discount - quote.bundleDiscount)}</dd></div>}
              <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatPrice(quote.total)}</dd></div>
            </dl>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
          <button disabled={pending || !quote} className="mt-5 w-full rounded-pill bg-accent py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Placing order..." : online ? "Continue to payment" : "Place order"}</button>
          <p className="mt-3 text-center text-xs text-muted">We will call you to confirm. {online ? "Your payment is processed on a secure page." : "You pay in cash when it arrives."}</p>
        </aside>
      </form>
    </main>
  );
}
