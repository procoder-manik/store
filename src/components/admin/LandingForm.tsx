"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteLanding, saveLanding } from "@/app/admin/landing-pages/actions";
import { slugify } from "@/lib/utils";

type Offer = { qty: string; price: string; label: string };
export type LandingInitial = { id?: string; slug: string; title: string; productId: string; headline: string; subheadline: string; bullets: string; heroImage: string; cta: string; status: string; offers: Offer[] };
const EMPTY: LandingInitial = { slug: "", title: "", productId: "", headline: "", subheadline: "", bullets: "", heroImage: "", cta: "Order now", status: "draft", offers: [{ qty: "1", price: "", label: "Buy 1" }] };
const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";

export function LandingForm({ products, initial = EMPTY }: { products: { id: string; name: string; price: number }[]; initial?: LandingInitial }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const set = <K extends keyof LandingInitial>(k: K, v: LandingInitial[K]) => setF((p) => ({ ...p, [k]: v }));
  const setOffer = (i: number, patch: Partial<Offer>) => set("offers", f.offers.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const product = products.find((p) => p.id === f.productId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      id: f.id, slug: f.slug || slugify(f.title), title: f.title, productId: f.productId, headline: f.headline, subheadline: f.subheadline,
      bullets: f.bullets.split("\n").map((b) => b.trim()).filter(Boolean), heroImage: f.heroImage, cta: f.cta, status: f.status,
      offers: f.offers.map((o) => ({ qty: Number(o.qty), price: Number(o.price), label: o.label })),
    };
    start(async () => {
      const r = await saveLanding(payload);
      if (!r.ok) return setError(r.error);
      router.push("/admin/landing-pages");
      router.refresh();
    });
  }

  const box = "rounded-xl border border-line bg-surface p-5 grid gap-4";
  return (
    <form onSubmit={submit} className="grid max-w-3xl gap-5">
      <section className={box}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Page name</label><input className={input} required maxLength={120} value={f.title} onChange={(e) => set("title", e.target.value)} /></div>
          <div><label className={label}>Page address (/lp/...)</label><input className={input} placeholder="Auto from name" value={f.slug} onChange={(e) => set("slug", e.target.value)} /></div>
        </div>
        <div>
          <label className={label}>Product</label>
          <select className={input} required value={f.productId} onChange={(e) => set("productId", e.target.value)}>
            <option value="">Choose a product</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div><label className={label}>Headline</label><input className={input} required maxLength={120} value={f.headline} onChange={(e) => set("headline", e.target.value)} /></div>
        <div><label className={label}>Sub headline</label><input className={input} maxLength={240} value={f.subheadline} onChange={(e) => set("subheadline", e.target.value)} /></div>
        <div><label className={label}>Benefits (one per line, up to 8)</label><textarea className={input} rows={4} value={f.bullets} onChange={(e) => set("bullets", e.target.value)} /></div>
        <div><label className={label}>Hero image link (optional, Pexels, Unsplash or Pixabay)</label><input className={input} value={f.heroImage} onChange={(e) => set("heroImage", e.target.value)} /></div>
      </section>

      <section className={box}>
        <div>
          <h2 className="font-display text-base font-semibold">Quantity offers</h2>
          <p className="mt-1 text-xs text-muted">The price is the total for that quantity, for example 2 pieces for 1600. {product ? `Normal price is ${product.price} each.` : ""}</p>
        </div>
        {f.offers.map((o, i) => (
          <div key={i} className="grid grid-cols-[80px_1fr_1fr_auto] items-end gap-2">
            <div><label className={label}>Quantity</label><input className={input} type="number" min={1} max={20} value={o.qty} onChange={(e) => setOffer(i, { qty: e.target.value })} /></div>
            <div><label className={label}>Total price</label><input className={input} type="number" min={1} step="0.01" value={o.price} onChange={(e) => setOffer(i, { price: e.target.value })} /></div>
            <div><label className={label}>Label</label><input className={input} maxLength={40} placeholder={`Buy ${o.qty || 1}`} value={o.label} onChange={(e) => setOffer(i, { label: e.target.value })} /></div>
            <button type="button" aria-label="Remove offer" disabled={f.offers.length === 1} onClick={() => set("offers", f.offers.filter((_, j) => j !== i))} className="grid h-10 w-10 place-items-center rounded-full hover:bg-paper disabled:opacity-30"><Trash2 size={14} /></button>
          </div>
        ))}
        {f.offers.length < 5 && <button type="button" onClick={() => set("offers", [...f.offers, { qty: String(f.offers.length + 1), price: "", label: "" }])} className="w-fit text-sm underline">Add an offer</button>}
      </section>

      <section className={box}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Button text</label><input className={input} required maxLength={30} value={f.cta} onChange={(e) => set("cta", e.target.value)} /></div>
          <div><label className={label}>Status</label><select className={input} value={f.status} onChange={(e) => set("status", e.target.value)}><option value="draft">Draft</option><option value="active">Live</option></select></div>
        </div>
      </section>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button disabled={pending} className="rounded-pill bg-accent px-7 py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Saving..." : "Save landing page"}</button>
        {f.id && <button type="button" disabled={pending} onClick={() => { if (confirm("Delete this landing page?")) start(async () => { await deleteLanding(f.id as string); router.push("/admin/landing-pages"); router.refresh(); }); }} className="rounded-pill border border-line px-6 py-3 text-sm text-red-600">Delete</button>}
      </div>
    </form>
  );
}
