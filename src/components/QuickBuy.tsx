"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, X } from "lucide-react";
import type { Product } from "@/lib/demo-products";
import { formatPrice } from "@/lib/config";
import { useCart } from "@/lib/cart";
import { placeOrder, quoteOrder } from "@/app/checkout/actions";
import { readRef } from "./RefCapture";
import { ProductArt } from "./ProductArt";
import { PaymentPicker } from "./PaymentPicker";
import { usePaymentMethods } from "./PaymentsProvider";

export type Zone = { id: string; name: string; fee: number; freeOver: number | null };
const input = "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm";

/** A short checkout for one product, opened from a product card. Prices and stock are checked on the server. */
export function QuickBuy({ product, zones, onClose }: { product: Product; zones: Zone[]; onClose: () => void }) {
  const router = useRouter();
  const { add, setOpen } = useCart();
  const [colorIdx, setColorIdx] = useState(0);
  const [size, setSize] = useState(product.sizes[1] ?? product.sizes[0] ?? "");
  const [qty, setQty] = useState(1);
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [quote, setQuote] = useState<{ subtotal: number; shipping: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const methods = usePaymentMethods();
  const [method, setMethod] = useState<string>(methods[0]?.id ?? "");
  const picked = methods.find((m) => m.id === method);

  const hasColors = product.hasColors !== false && product.colors.length > 0;
  const color = product.colors[colorIdx] ?? product.colors[0];
  const variant = useMemo(() => product.variants?.find((v) => (!hasColors || v.colorName === color?.name) && (!size || v.size === size)), [product.variants, hasColors, color, size]);
  const stock = variant?.stock ?? (product.variants?.length ? 0 : 99);
  const price = product.basePrice + (variant?.priceDelta ?? 0);
  const demo = !/^[0-9a-f-]{36}$/i.test(product.id);

  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); document.body.style.overflow = "hidden"; return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; }; }, [onClose]);

  useEffect(() => {
    if (!zoneId || demo || !variant) { setQuote(null); return; }
    let live = true;
    quoteOrder({ items: [{ productId: product.id, variantId: variant.id, qty }], zoneId }).then((r) => {
      if (!live) return;
      if (r.ok) { setQuote({ subtotal: r.subtotal, shipping: r.shipping, total: r.total }); setError(""); }
      else setError(r.error);
    });
    return () => { live = false; };
  }, [product.id, variant, qty, zoneId, demo]);

  function addToCart() {
    add({ id: product.id, variantId: variant?.id, name: product.name, color: hasColors ? color.name : "", size, price, image: product.image, kind: product.kind, hex: color?.hex }, qty);
    onClose();
    setOpen(true);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (demo) return setError("These are sample products. Add your own products to take orders.");
    if (!variant && product.variants?.length) return setError("Choose an available option.");
    const f = new FormData(e.currentTarget);
    start(async () => {
      const r = await placeOrder({
        name: String(f.get("name")), phone: String(f.get("phone")), email: String(f.get("email") ?? ""),
        zoneId, district: String(f.get("district")), address: String(f.get("address")), note: "", coupon: "",
        bump: false, useCredit: true, ref: readRef(), paymentMethod: method, payerNumber: String(f.get("payer") ?? ""), trxId: String(f.get("trxId") ?? ""), website: String(f.get("website") ?? ""),
        items: [{ productId: product.id, variantId: variant?.id, qty }],
      });
      if (!r.ok) return setError(r.error);
      onClose();
      if (r.payUrl) window.location.assign(r.payUrl);
      else router.push(method === "sslcommerz" ? `/pay/${r.id}` : `/thank-you/${r.id}`);
    });
  }

  const sizeOk = (s: string) => !product.variants?.length || product.variants.some((v) => (!hasColors || v.colorName === color?.name) && v.size === s && v.stock > 0);
  const base = color?.hex ?? "#3a3f48";
  const n = parseInt(base.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const mix = (k: number) => `rgb(${Math.round((n >> 16) * (1 - k))}, ${Math.round(((n >> 8) & 255) * (1 - k))}, ${Math.round((n & 255) * (1 - k))})`;
  const field = "w-full rounded-xl border border-white/40 bg-white/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/45 backdrop-blur focus-visible:bg-white/85 dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/45";
  const chip = (on: boolean) => `grid h-9 min-w-10 place-items-center rounded-full border px-3 text-sm transition ${on ? "border-white bg-white font-semibold text-black" : "border-white/25 bg-white/10 text-white hover:bg-white/20"}`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-md" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={`Order ${product.name}`} className="panel-in relative grid max-h-[94dvh] w-full overflow-hidden rounded-t-[28px] border border-white/25 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] sm:max-w-3xl sm:rounded-[28px] md:grid-cols-[0.92fr_1.08fr]">
        <button aria-label="Close" onClick={onClose} className="absolute right-3.5 top-3.5 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur transition hover:bg-black/40"><X size={16} /></button>

        {/* The product side: its own colour, with white text */}
        <div className="no-scrollbar relative flex flex-col gap-4 overflow-y-auto p-5 text-white md:max-h-[94dvh] md:p-7" style={{ background: `radial-gradient(ellipse 90% 70% at 50% 25%, ${mix(0.35)} 0%, ${mix(0.75)} 70%, ${mix(0.88)} 100%)` }}>
          <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-5">
            <div className="relative w-24 shrink-0 md:mx-auto md:w-[62%]">
              {product.image ? <img src={product.image} alt="" className="aspect-[4/5] w-full rounded-2xl object-cover shadow-2xl" /> : <ProductArt bare kind={product.kind} color={color?.hex ?? "#ccc"} className="aspect-[4/5] w-full" />}
            </div>
            <div className="min-w-0 pr-8 md:pr-0">
              <h2 className="font-display text-xl font-semibold leading-snug md:text-2xl">{product.name}</h2>
              <p className="mt-1 font-display text-2xl font-semibold">{formatPrice(price)}{product.compareAt && product.compareAt > price && <span className="ml-2 text-base font-normal text-white/70 line-through">{formatPrice(product.compareAt)}</span>}</p>
              <p className="mt-1 text-xs text-white/75">{stock > 0 ? (stock <= 5 ? `Only ${stock} left` : "In stock, ready to ship") : "Sold out in this option"}</p>
            </div>
          </div>
          <div className="grid gap-3.5">
            {hasColors && (
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="w-14 text-xs text-white/70">Color</span>
                {product.colors.map((c, i) => <button key={c.name} type="button" aria-label={c.name} aria-pressed={i === colorIdx} onClick={() => setColorIdx(i)} style={{ background: c.hex }} className={`h-8 w-8 rounded-full border border-white/40 transition ${i === colorIdx ? "ring-2 ring-white ring-offset-2 ring-offset-transparent" : "opacity-85 hover:opacity-100"}`} />)}
              </div>
            )}
            {product.sizes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-14 text-xs text-white/70">Size</span>
                {product.sizes.map((sz) => <button key={sz} type="button" aria-pressed={sz === size} onClick={() => setSize(sz)} className={`${chip(sz === size)} ${sizeOk(sz) ? "" : "line-through opacity-45"}`}>{sz}</button>)}
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <span className="w-14 text-xs text-white/70">Quantity</span>
              <div className="inline-flex items-center rounded-full border border-white/25 bg-white/10">
                <button type="button" aria-label="Less" onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-9 w-9 place-items-center"><Minus size={14} /></button>
                <span className="w-7 text-center text-sm tabular-nums">{qty}</span>
                <button type="button" aria-label="More" onClick={() => setQty(Math.min(10, Math.max(1, stock), qty + 1))} className="grid h-9 w-9 place-items-center"><Plus size={14} /></button>
              </div>
            </div>
          </div>
          <button type="button" onClick={addToCart} disabled={stock <= 0} className="mt-auto rounded-full border border-white/30 bg-white/10 py-3 text-sm font-medium backdrop-blur transition hover:bg-white/20 disabled:opacity-50">Add to cart instead</button>
        </div>

        {/* The form side: frosted glass, with solid enough colour that every word stays easy to read */}
        <form onSubmit={submit} className="no-scrollbar grid content-start gap-2.5 overflow-y-auto bg-white/85 p-5 backdrop-blur-2xl dark:bg-[#12151a]/88 md:max-h-[94dvh] md:p-7">
          <p className="font-display text-lg font-semibold">Where should we deliver it?</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <input name="name" required minLength={2} placeholder="Full name" autoComplete="name" className={field} />
            <input name="phone" required inputMode="tel" placeholder="01712345678" autoComplete="tel" className={field} />
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <select aria-label="Delivery area" value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={field}>{zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select>
            <input name="district" required placeholder="District" className={field} />
          </div>
          <textarea name="address" required minLength={6} rows={2} placeholder="Full address" autoComplete="street-address" className={field} />
          <input name="email" type="email" placeholder="Email (optional, for your invoice)" autoComplete="email" className={field} />
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <p className="mt-1 text-sm font-medium">Payment</p>
          <PaymentPicker methods={methods} value={method} onChange={setMethod} amount={quote?.total ?? price * qty} tone="glass" />

          <dl className="mt-1 grid gap-1.5 rounded-2xl border border-black/5 bg-white/70 p-4 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex justify-between"><dt className="text-ink/65 dark:text-white/65">Items</dt><dd className="tabular-nums">{formatPrice(quote?.subtotal ?? price * qty)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/65 dark:text-white/65">Delivery</dt><dd className="tabular-nums">{quote ? (quote.shipping === 0 ? "Free" : formatPrice(quote.shipping)) : "Calculated next"}</dd></div>
            <div className="mt-1 flex justify-between border-t border-black/10 pt-2.5 text-base font-semibold dark:border-white/10"><dt>{method === "cod" ? "Pay on delivery" : "Total"}</dt><dd className="tabular-nums">{formatPrice(quote?.total ?? price * qty)}</dd></div>
          </dl>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button disabled={pending || stock <= 0 || !picked} className="shine mt-1 flex items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-paper shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50">{pending ? "Placing order..." : <><Check size={16} /> {method === "cod" ? "Place order, pay on delivery" : method === "sslcommerz" ? "Continue to payment" : "Place order"}</>}</button>
          <p className="text-center text-xs text-ink/60 dark:text-white/60">We will call you to confirm. {method === "cod" ? "You pay in cash when it arrives." : picked?.manual ? "We check your payment before we send the order." : ""}</p>
        </form>
      </div>
    </div>
  );
}
