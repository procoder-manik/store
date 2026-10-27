"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import type { Product } from "@/lib/demo-products";
import type { Block } from "@/lib/blocks";
import { formatPrice } from "@/lib/config";
import { placeLandingOrderV2 } from "@/app/lp/order-actions";
import { Heading } from "./Heading";
import { ProductArt } from "./ProductArt";

export type Zone = { id: string; name: string; fee: number; freeOver: number | null };
type OrderBlockData = Extract<Block, { type: "order" }>;
type Pick = { color: string; size: string };

const input = "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm";

export function OrderBlock({ block, products, zones, slug, preview = false }: { block: OrderBlockData; products: Product[]; zones: Zone[]; slug: string; preview?: boolean }) {
  const router = useRouter();
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const [chosen, setChosen] = useState<string[]>(() => (block.offers[0] ? [block.offers[0].id] : []));
  const [picks, setPicks] = useState<Record<string, Pick>>({});
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const offers = block.offers.filter((o) => o.items.every((i) => byId.has(i.productId)));
  const sel = offers.filter((o) => chosen.includes(o.id));
  const key = (offerId: string, productId: string) => `${offerId}:${productId}`;
  const pickFor = (offerId: string, p: Product): Pick => picks[key(offerId, p.id)] ?? { color: p.hasColors === false ? "" : p.colors[0].name, size: p.sizes[1] ?? p.sizes[0] ?? "" };
  const variantFor = (p: Product, pk: Pick) => p.variants?.find((v) => v.colorName === pk.color && v.size === pk.size);

  const subtotal = sel.reduce((n, o) => n + o.price, 0);
  const zone = zones.find((z) => z.id === zoneId);
  const shipping = zone ? (zone.freeOver != null && subtotal >= zone.freeOver ? 0 : zone.fee) : 0;
  const worth = (o: (typeof offers)[number]) => o.items.reduce((n, i) => n + (byId.get(i.productId)?.basePrice ?? 0) * i.qty, 0);

  // How many of each variant the chosen offers need, so stock is checked across all of them together.
  const need = new Map<string, number>();
  for (const o of sel) for (const it of o.items) {
    const p = byId.get(it.productId) as Product;
    if (!p.variants?.length) continue;
    const v = variantFor(p, pickFor(o.id, p));
    if (v) need.set(v.id, (need.get(v.id) ?? 0) + it.qty);
  }
  const problem = (() => {
    for (const o of sel) for (const it of o.items) {
      const p = byId.get(it.productId) as Product;
      if (!p.variants?.length) continue;
      const v = variantFor(p, pickFor(o.id, p));
      if (!v) return `${p.name}: choose an available color and size.`;
      if ((need.get(v.id) ?? 0) > v.stock) return `${p.name} (${[v.colorName, v.size].filter(Boolean).join(", ")}): only ${v.stock} left.`;
    }
    return "";
  })();

  function toggle(id: string) {
    setChosen((c) => (block.multi ? (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]) : [id]));
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (preview) return setError("This is a preview. Orders work on the live page.");
    if (sel.length === 0) return setError("Choose at least one offer.");
    if (problem) return setError(problem);
    const f = new FormData(e.currentTarget);
    const selections = sel.map((o) => ({ offerId: o.id, picks: Object.fromEntries(o.items.flatMap((it) => { const p = byId.get(it.productId) as Product; const v = p.variants?.length ? variantFor(p, pickFor(o.id, p)) : undefined; return v ? [[p.id, v.id]] : []; })) }));
    start(async () => {
      const r = await placeLandingOrderV2({ slug, selections, zoneId, name: String(f.get("name")), phone: String(f.get("phone")), district: String(f.get("district")), address: String(f.get("address")), note: String(f.get("note") ?? ""), website: String(f.get("website") ?? "") });
      if (!r.ok) return setError(r.error);
      router.push(`/thank-you/${r.id}`);
    });
  }

  return (
    <section id="order" className="mx-auto max-w-3xl px-5 py-10 md:py-14">
      {block.heading && <Heading as={block.level} className="text-center font-display text-3xl font-semibold md:text-4xl">{block.heading}</Heading>}
      <form onSubmit={submit} className="mt-8 grid gap-6 rounded-3xl border border-line bg-surface p-5 md:p-8">
        <div className="grid gap-3" role={block.multi ? "group" : "radiogroup"} aria-label="Offers">
          {block.multi && <p className="text-xs text-muted">You can choose more than one.</p>}
          {offers.map((o) => {
            const on = chosen.includes(o.id);
            const save = worth(o) - o.price;
            return (
              <div key={o.id} className={`rounded-2xl border-2 transition ${on ? "border-accent bg-accent/5" : "border-line"}`}>
                <label className="flex cursor-pointer items-start gap-3 p-4">
                  <input type={block.multi ? "checkbox" : "radio"} name="offer" checked={on} onChange={() => toggle(o.id)} className="mt-1" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2"><span className="font-medium">{o.label}</span>{o.badge && <span className="rounded-pill bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-ink">{o.badge}</span>}{save > 0 && <span className="rounded-pill bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Save {formatPrice(save)}</span>}</span>
                    <span className="mt-2 flex flex-wrap gap-2">
                      {o.items.map((it) => { const p = byId.get(it.productId) as Product; return <span key={it.productId} className="flex items-center gap-2 rounded-xl border border-line bg-surface p-1.5 pr-3 text-xs">{p.image ? <img src={p.image} alt="" className="h-9 w-7 rounded object-cover" /> : <ProductArt kind={p.kind} color={p.colors[0].hex} className="h-9 w-7 rounded" />}{p.name}{it.qty > 1 ? ` x ${it.qty}` : ""}</span>; })}
                    </span>
                  </span>
                  <span className="text-right"><span className="block font-display text-xl font-semibold tabular-nums">{formatPrice(o.price)}</span>{save > 0 && <span className="block text-xs text-muted line-through">{formatPrice(worth(o))}</span>}</span>
                </label>
                {on && o.items.some((it) => (byId.get(it.productId)?.variants?.length ?? 0) > 0) && (
                  <div className="grid gap-3 border-t border-line/70 p-4">
                    {o.items.map((it) => {
                      const p = byId.get(it.productId) as Product;
                      if (!p.variants?.length) return null;
                      const pk = pickFor(o.id, p);
                      const set = (patch: Partial<Pick>) => setPicks((s) => ({ ...s, [key(o.id, p.id)]: { ...pk, ...patch } }));
                      const ok = (color: string, size: string) => { const v = p.variants?.find((x) => x.colorName === color && x.size === size); return !!v && v.stock >= it.qty; };
                      return (
                        <div key={p.id} className="grid gap-2 text-sm">
                          <p className="font-medium">{p.name}</p>
                          <div className="flex flex-wrap items-center gap-3">
                            {p.hasColors !== false && <div className="flex gap-2">{p.colors.map((c) => <button type="button" key={c.name} aria-label={c.name} aria-pressed={pk.color === c.name} onClick={() => set({ color: c.name })} style={{ background: c.hex }} className={`h-8 w-8 rounded-full border border-line ${pk.color === c.name ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : ""}`} />)}</div>}
                            {p.sizes.length > 0 && <div className="flex flex-wrap gap-1.5">{p.sizes.map((s) => <button type="button" key={s} aria-pressed={pk.size === s} onClick={() => set({ size: s })} className={`h-9 min-w-10 rounded-lg border px-3 text-xs ${pk.size === s ? "border-ink bg-ink text-paper" : "border-line"} ${ok(pk.color, s) ? "" : "line-through opacity-45"}`}>{s}</button>)}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid gap-3">
          <input name="name" required placeholder="Full name" autoComplete="name" className={input} />
          <input name="phone" required inputMode="tel" placeholder="Mobile number, like 01712345678" autoComplete="tel" className={input} />
          <div className="grid gap-3 sm:grid-cols-2">
            <select aria-label="Delivery area" value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={input}>{zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select>
            <input name="district" required placeholder="District" className={input} />
          </div>
          <textarea name="address" required minLength={6} rows={2} placeholder="Full address" autoComplete="street-address" className={input} />
          <input name="note" placeholder="Note (optional)" maxLength={300} className={input} />
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        </div>

        <dl className="grid gap-2 border-t border-line pt-5 text-sm">
          {sel.map((o) => <div key={o.id} className="flex justify-between gap-3"><dt className="text-muted">{o.label}</dt><dd className="tabular-nums">{formatPrice(o.price)}</dd></div>)}
          <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{shipping === 0 && sel.length > 0 ? "Free" : formatPrice(shipping)}</dd></div>
          <div className="flex justify-between text-base font-semibold"><dt>Total, pay on delivery</dt><dd className="tabular-nums">{formatPrice(subtotal + shipping)}</dd></div>
        </dl>
        {(error || problem) && <p role="alert" className="text-sm text-red-600">{error || problem}</p>}
        <button disabled={pending || sel.length === 0 || zones.length === 0} className="flex items-center justify-center gap-2 rounded-pill bg-accent py-4 text-base font-semibold text-accent-ink transition hover:opacity-90 disabled:opacity-50">{pending ? "Placing order..." : <><Check size={18} /> {block.cta || "Order now"}</>}</button>
        <p className="text-center text-xs text-muted">We will call you to confirm. You pay in cash when it arrives.</p>
      </form>
    </section>
  );
}
