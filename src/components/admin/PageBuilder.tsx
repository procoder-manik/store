"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, ExternalLink, GripVertical, Plus, Trash2 } from "lucide-react";
import { deletePage, savePage } from "@/app/admin/pages/actions";
import { ANIMATIONS, BLOCK_GROUPS, BLOCK_LABELS, FONT_WEIGHTS, HEADING_LEVELS, HEADING_LEVEL_LABEL, RAIL_STYLES, SLIDER_STYLES, TAG_SIZE_PX, TEXT_CASES, newBlock, type Block, type BlockType, type HeadingLevel } from "@/lib/blocks";
import type { Product } from "@/lib/demo-products";
import type { Cat } from "@/lib/catalog";
import { formatPrice } from "@/lib/config";
import { slugify } from "@/lib/utils";
import { BlockRenderer } from "@/components/Blocks";
import { ImageField } from "./ImageField";
import { InfoTip } from "./InfoTip";

export type PageInitial = { id?: string; slug: string; title: string; description: string; status: string; blocks: Block[] };
const EMPTY: PageInitial = { slug: "", title: "", description: "", status: "draft", blocks: [] };
const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";
const ALL = BLOCK_GROUPS.flatMap((g) => g.types);
const LANDING: BlockType[] = ["hero", "herofull", "slider", "sliderfull", "split", "trust", "html", "bannerfull", "spotlight", "richtext", "text", "image", "features", "faq", "cta", "banner", "products", "newsletter", "order", "marquee", "stats", "countdown", "gallery", "testimonials"];

function F({ l, children }: { l: string; children: React.ReactNode }) { return <div><label className={label}>{l}</label>{children}</div>; }
type Setter = (p: Record<string, unknown>) => void;

function ProductSelect({ products, value, onChange, empty = "Choose a product" }: { products: Product[]; value: string; onChange: (id: string) => void; empty?: string }) {
  return <select className={input} value={value} onChange={(e) => onChange(e.target.value)}><option value="">{empty}</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} ({formatPrice(p.basePrice)})</option>)}</select>;
}

type OrderB = Extract<Block, { type: "order" }>;
function OffersEditor({ b, set, products }: { b: OrderB; set: Setter; products: Product[] }) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const setOffer = (i: number, p: Record<string, unknown>) => set({ offers: b.offers.map((o, j) => (j === i ? { ...o, ...p } : o)) });
  return (
    <>
      <F l="Heading"><input className={input} maxLength={80} value={b.heading} onChange={(e) => set({ heading: e.target.value })} /></F>
      <div className="grid grid-cols-2 gap-3">
        <F l="Button text"><input className={input} maxLength={30} value={b.cta} onChange={(e) => set({ cta: e.target.value })} /></F>
        <F l="Customers can choose"><select className={input} value={b.multi ? "many" : "one"} onChange={(e) => set({ multi: e.target.value === "many" })}><option value="one">One offer (radio buttons)</option><option value="many">Several offers (checkboxes)</option></select></F>
      </div>
      <p className="text-xs text-muted">Each offer is a fixed price for a set of products. Examples: 1 tee for 850, 2 tees for 1,600, or a tee plus a hoodie for 2,500. You set the final price of the whole offer.</p>
      {b.offers.map((o, i) => {
        const worth = o.items.reduce((n, it) => n + (byId.get(it.productId)?.basePrice ?? 0) * it.qty, 0);
        return (
          <div key={o.id} className="grid gap-3 rounded-xl border border-line p-3">
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_110px]">
                <F l="Offer name"><input className={input} maxLength={60} placeholder="Buy 2, save more" value={o.label} onChange={(e) => setOffer(i, { label: e.target.value })} /></F>
                <F l="Badge (optional)"><input className={input} maxLength={24} placeholder="Best value" value={o.badge} onChange={(e) => setOffer(i, { badge: e.target.value })} /></F>
              </div>
              <button type="button" aria-label="Remove offer" onClick={() => set({ offers: b.offers.filter((_, j) => j !== i) })} className="mt-6 grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><Trash2 size={14} /></button>
            </div>
            <div className="grid gap-2">
              {o.items.map((it, k) => (
                <div key={k} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1"><ProductSelect products={products} value={it.productId} onChange={(id) => setOffer(i, { items: o.items.map((x, j) => (j === k ? { ...x, productId: id } : x)) })} /></div>
                  <input type="number" min={1} max={20} aria-label="Quantity" className={`${input} !w-16`} value={it.qty} onChange={(e) => setOffer(i, { items: o.items.map((x, j) => (j === k ? { ...x, qty: Math.min(20, Math.max(1, Number(e.target.value) || 1)) } : x)) })} />
                  <button type="button" aria-label="Remove product" onClick={() => setOffer(i, { items: o.items.filter((_, j) => j !== k) })} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><Trash2 size={13} /></button>
                </div>
              ))}
              {o.items.length < 4 && <button type="button" onClick={() => setOffer(i, { items: [...o.items, { productId: products[0]?.id ?? "", qty: 1 }] })} className="flex w-fit items-center gap-1 text-sm underline"><Plus size={13} /> Add a product to this offer</button>}
            </div>
            <div className="grid grid-cols-2 items-end gap-3">
              <F l="Price for the whole offer (BDT)"><input type="number" min={1} className={input} value={o.price || ""} onChange={(e) => setOffer(i, { price: Number(e.target.value) || 0 })} /></F>
              <p className="pb-2 text-xs text-muted">{worth > 0 ? <>Normal price {formatPrice(worth)}{o.price > 0 && worth > o.price ? <>, customer saves <span className="font-medium text-emerald-700">{formatPrice(worth - o.price)}</span></> : o.price > worth ? <span className="text-amber-700">, higher than normal</span> : null}</> : "Choose products"}</p>
            </div>
          </div>
        );
      })}
      {b.offers.length < 8 && <button type="button" onClick={() => set({ offers: [...b.offers, { id: crypto.randomUUID().slice(0, 8), label: "", badge: "", items: [], price: 0 }] })} className="flex w-fit items-center gap-1 text-sm underline"><Plus size={13} /> Add an offer</button>}
    </>
  );
}

/** Blocks that have no heading text, so there is nothing to style. */
const NO_HEADING: BlockType[] = ["marquee", "image", "banner", "bannerfull", "html", "trust"];
const num = (v: string, min: number, max: number) => { const n = Math.round(Number(v)); return v === "" || !Number.isFinite(n) ? undefined : Math.min(max, Math.max(min, n)); };

function StyleRow({ b, set }: { b: Block; set: Setter }) {
  const hasHeading = !NO_HEADING.includes(b.type);
  const mode = b.hsize ?? "design";
  const tagPx = TAG_SIZE_PX[b.level as HeadingLevel];
  return (
    <div className="mt-1 grid gap-3 border-t border-line pt-3">
      {hasHeading && (
        <>
          <p className="text-xs font-medium">Heading text</p>
          <div className="grid grid-cols-2 gap-3">
            <F l="Tag (what search engines read)">
              {/* Picking a tag also switches the size to that tag's own size, unless you typed a custom size. */}
              <select className={input} value={b.level} onChange={(e) => set({ level: e.target.value, ...(mode === "custom" ? {} : { hsize: "tag" }) })}>
                {HEADING_LEVELS.map((h) => <option key={h} value={h}>{HEADING_LEVEL_LABEL[h]}</option>)}
              </select>
            </F>
            <F l="Size">
              <select className={input} value={mode} onChange={(e) => { const v = e.target.value; set({ hsize: v, ...(v === "custom" && !b.hpx ? { hpx: tagPx } : {}) }); }}>
                <option value="design">Keep this section&apos;s own design size</option>
                <option value="tag">Match the tag ({b.level === "p" ? "paragraph" : b.level.toUpperCase()} = {tagPx}px)</option>
                <option value="custom">Custom size</option>
              </select>
            </F>
          </div>
          {mode === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <F l="Size on computers (px)"><input type="number" min={10} max={200} className={input} value={b.hpx ?? ""} onChange={(e) => set({ hpx: num(e.target.value, 10, 200) })} /></F>
              <F l="Size on phones (px, blank = automatic)"><input type="number" min={10} max={120} className={input} placeholder={String(Math.max(14, Math.round((b.hpx ?? tagPx) * 0.65)))} value={b.hpxm ?? ""} onChange={(e) => set({ hpxm: num(e.target.value, 10, 120) })} /></F>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <F l="Thickness (font weight)"><select className={input} value={b.hweight ?? ""} onChange={(e) => set({ hweight: e.target.value || undefined })}><option value="">Keep the design&apos;s weight</option>{FONT_WEIGHTS.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></F>
            <F l="Letters"><select className={input} value={b.hcase ?? ""} onChange={(e) => set({ hcase: e.target.value || undefined })}><option value="">Keep the design&apos;s style</option>{TEXT_CASES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></F>
          </div>
          {b.level === "h1" && <p className="-mt-1 text-xs text-muted">Use Heading 1 only once on a page. It is the main title search engines look for.</p>}
          {b.level === "p" && <p className="-mt-1 text-xs text-muted">A paragraph tag is plain text. Search engines will not treat it as a heading.</p>}
        </>
      )}
      <p className="text-xs font-medium">Space around this section (pixels)<InfoTip text="Padding is the space inside, around the content. Margin is the space outside, between this section and its neighbours. Leave a box empty to keep the section's own spacing. A negative margin pulls the next section closer." /></p>
      {([["Padding", ["pt", "pb", "pl", "pr"], 0], ["Margin", ["mt", "mb", "ml", "mr"], -100]] as const).map(([name, keys, min]) => (
        <div key={name} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {keys.map((k, n) => <F key={k} l={`${name} ${["top", "bottom", "left", "right"][n]}`}><input type="number" min={min} max={300} className={input} placeholder="auto" value={(b as unknown as Record<string, number | undefined>)[k] ?? ""} onChange={(e) => set({ [k]: num(e.target.value, min, 300) })} /></F>)}
        </div>
      ))}
      <div className="grid grid-cols-2 gap-3">
        <F l="When it appears"><select className={input} value={b.anim} onChange={(e) => set({ anim: e.target.value })}>{ANIMATIONS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></F>
      </div>
    </div>
  );
}

function Fields({ b, set, cats, products }: { b: Block; set: Setter; cats: Cat[]; products: Product[] }) {
  const t = (k: string, v: string, l: string, max = 200) => <F l={l}><input className={input} maxLength={max} value={v} onChange={(e) => set({ [k]: e.target.value })} /></F>;
  const ti = (k: string, v: string, l: string) => <ImageField key={b.id + k} value={v} label={l} onChange={(u) => set({ [k]: u })} />;
  const pair = (k1: string, v1: string, l1: string, k2: string, v2: string, l2: string) => <div className="grid grid-cols-2 gap-3">{t(k1, v1, l1, 30)}{t(k2, v2, l2, 300)}</div>;
  const source = (x: { source: string; category: string; tag: string }) => <>
    <F l="Show"><select className={input} value={x.source} onChange={(e) => set({ source: e.target.value })}><option value="all">All products</option><option value="category">One category</option><option value="tag">A tag</option></select></F>
    {x.source === "category" && <F l="Category"><select className={input} value={x.category} onChange={(e) => set({ category: e.target.value })}><option value="">Choose</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></F>}
    {x.source === "tag" && <F l="Tag"><select className={input} value={x.tag} onChange={(e) => set({ tag: e.target.value })}>{["new", "hot", "bestseller", "featured", "sale"].map((v) => <option key={v}>{v}</option>)}</select></F>}
  </>;
  switch (b.type) {
    case "hero":
    case "herofull": return <>{t("heading", b.heading, "Heading", 120)}{t("sub", b.sub, "Sub text", 240)}{ti("image", b.image, "Picture")}{pair("button", b.button, "Button text", "link", b.link, "Button link")}
      <F l="Layout"><select className={input} value={b.variant} onChange={(e) => set({ variant: e.target.value })}><option value="overlay">Image behind the text, text on the left</option><option value="center">Image behind the text, centered</option><option value="split">Text on one side, image on the other</option><option value="aurora">Moving glow, centered (modern)</option><option value="bold">Giant bold type with floating shapes</option></select></F></>;
    case "showcase":
    case "showcasefull": return <>{t("eyebrow", b.eyebrow, "Small label, top left", 40)}{t("heading", b.heading, "Heading", 120)}<F l="Text under the heading"><textarea className={input} rows={3} maxLength={300} value={b.sub} onChange={(e) => set({ sub: e.target.value })} /></F>{t("button", b.button, "Button text (opens the product on show)", 30)}{t("tagline", b.tagline, "Line at the bottom", 100)}
      {source(b)}
      <div className="grid grid-cols-2 gap-3">
        <F l="Change product every (seconds, 0 = never)"><input type="number" min={0} max={20} className={input} value={b.autoplay} onChange={(e) => set({ autoplay: Math.min(20, Math.max(0, Number(e.target.value) || 0)) })} /></F>
        <F l="Product pictures"><select className={input} value={b.fit} onChange={(e) => set({ fit: e.target.value })}><option value="cutout">Floating, no frame (best with transparent PNG)</option><option value="card">Framed photo</option></select></F>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={b.showNav} onChange={(e) => set({ showNav: e.target.checked })} /> Show the category buttons at the top</label>
      <p className="text-xs text-muted">Social links shown at the bottom left. Leave any empty to hide it.</p>
      {t("facebook", b.facebook, "Facebook link", 300)}{t("instagram", b.instagram, "Instagram link", 300)}{t("youtube", b.youtube, "YouTube link", 300)}{t("whatsapp", b.whatsapp, "WhatsApp link, like https://wa.me/8801712345678", 300)}</>;
    case "rail3d":
    case "rail3dfull": return <>{t("heading", b.heading, "Heading", 120)}{t("sub", b.sub, "Sub text (blank = automatic)", 240)}{pair("button", b.button, "Button text", "link", b.link, "Button link")}{pair("button2", b.button2, "Second button text", "link2", b.link2, "Second button link")}
      <F l="3D style"><select className={input} value={b.style} onChange={(e) => set({ style: e.target.value })}>{[...new Set(RAIL_STYLES.map((s) => s.group))].map((g) => <optgroup key={g} label={g}>{RAIL_STYLES.filter((s) => s.group === g).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>)}</select></F>
      <p className="-mt-1 text-xs text-muted">Hanger rail shows clothes on hangers. The other styles show your product photos as cards, so they suit real photos best.</p>
      {source(b)}<F l="Start as"><select className={input} value={b.defaultView} onChange={(e) => set({ defaultView: e.target.value })}><option value="3d">3D slider (visitors can switch to a grid)</option><option value="grid">A plain product grid (visitors can switch to 3D)</option></select></F>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={b.showHero} onChange={(e) => set({ showHero: e.target.checked })} /> Show the heading and buttons above the slider</label></>;
    case "slider":
    case "sliderfull": return <><F l="Slider style"><select className={input} value={b.style} onChange={(e) => set({ style: e.target.value })}>{SLIDER_STYLES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></F>{b.slides.map((s, i) => <div key={i} className="grid gap-2 rounded-xl border border-line p-3">
        <div className="flex gap-2"><input aria-label="Slide title" placeholder="Title" maxLength={80} className={input} value={s.title} onChange={(e) => set({ slides: b.slides.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />{b.slides.length > 1 && <button type="button" aria-label="Remove slide" onClick={() => set({ slides: b.slides.filter((_, j) => j !== i) })} className="px-2"><Trash2 size={14} /></button>}</div>
        <input aria-label="Slide text" placeholder="Text" maxLength={160} className={input} value={s.sub} onChange={(e) => set({ slides: b.slides.map((x, j) => (j === i ? { ...x, sub: e.target.value } : x)) })} />
        <ImageField key={`s${i}`} value={s.image} label="Slide picture" onChange={(u) => set({ slides: b.slides.map((x, j) => (j === i ? { ...x, image: u } : x)) })} />
        <div className="grid grid-cols-2 gap-2"><input aria-label="Button text" placeholder="Button text" maxLength={30} className={input} value={s.button} onChange={(e) => set({ slides: b.slides.map((x, j) => (j === i ? { ...x, button: e.target.value } : x)) })} /><input aria-label="Button link" placeholder="Button link" maxLength={300} className={input} value={s.link} onChange={(e) => set({ slides: b.slides.map((x, j) => (j === i ? { ...x, link: e.target.value } : x)) })} /></div>
      </div>)}{b.slides.length < 6 && <button type="button" onClick={() => set({ slides: [...b.slides, { title: "", sub: "", image: "", button: "", link: "" }] })} className="w-fit text-sm underline">Add a slide</button>}</>;
    case "spotlight": return <>{t("heading", b.heading, "Small heading above the name", 80)}<F l="Product"><ProductSelect products={products} value={b.productId} onChange={(id) => set({ productId: id })} empty="First product" /></F>{t("button", b.button, "Button text", 30)}</>;
    case "pagehead": return <>{t("title", b.title, "Title", 120)}<F l="Intro text"><textarea className={input} rows={3} maxLength={400} value={b.intro} onChange={(e) => set({ intro: e.target.value })} /></F></>;
    case "text": return <>{t("heading", b.heading, "Heading (optional)", 120)}<F l="Text (blank line between paragraphs, start a line with - for a bullet)"><textarea className={input} rows={7} maxLength={4000} value={b.body} onChange={(e) => set({ body: e.target.value })} /></F></>;
    case "richtext": {
      const parts = b.parts;
      const setPart = (i: number, patch: Record<string, unknown>) => set({ parts: parts.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
      const addPart = (kind: string) => set({ parts: [...parts, kind === "heading" ? { t: "heading", text: "A heading", level: "h2" } : kind === "paragraph" ? { t: "paragraph", text: "" } : kind === "list" ? { t: "list", items: [""] } : kind === "link" ? { t: "link", text: "Read more", href: "/shop", style: "link" } : kind === "quote" ? { t: "quote", text: "", by: "" } : { t: "divider" }] });
      return <>
        <F l="Width"><select className={input} value={b.width} onChange={(e) => set({ width: e.target.value })}><option value="narrow">Narrow, easy to read</option><option value="wide">Full width</option></select></F>
        {parts.map((x, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-line p-3">
            <div className="flex items-center justify-between gap-2 text-xs text-muted">
              <span className="capitalize">{x.t}</span>
              <span className="flex gap-1">
                <button type="button" aria-label="Move up" onClick={() => { if (i === 0) return; const c = [...parts]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; set({ parts: c }); }}><ArrowUp size={13} /></button>
                <button type="button" aria-label="Move down" onClick={() => { if (i === parts.length - 1) return; const c = [...parts]; [c[i + 1], c[i]] = [c[i], c[i + 1]]; set({ parts: c }); }}><ArrowDown size={13} /></button>
                <button type="button" aria-label="Remove" onClick={() => set({ parts: parts.filter((_, j) => j !== i) })}><Trash2 size={13} /></button>
              </span>
            </div>
            {x.t === "heading" && <div className="grid grid-cols-[1fr_90px] gap-2"><input className={input} maxLength={160} value={x.text} onChange={(e) => setPart(i, { text: e.target.value })} /><select className={input} value={x.level} onChange={(e) => setPart(i, { level: e.target.value })}>{HEADING_LEVELS.map((h) => <option key={h} value={h}>{h === "p" ? "P (text)" : h.toUpperCase()}</option>)}</select></div>}
            {x.t === "paragraph" && <textarea className={input} rows={4} maxLength={2000} value={x.text} onChange={(e) => setPart(i, { text: e.target.value })} />}
            {x.t === "list" && <textarea className={input} rows={4} placeholder="One item per line" value={x.items.join("\n")} onChange={(e) => setPart(i, { items: e.target.value.split("\n").map((v) => v.slice(0, 300)).slice(0, 12) })} />}
            {x.t === "quote" && <><textarea className={input} rows={3} maxLength={400} value={x.text} onChange={(e) => setPart(i, { text: e.target.value })} /><input className={input} maxLength={60} placeholder="Who said it" value={x.by} onChange={(e) => setPart(i, { by: e.target.value })} /></>}
            {x.t === "link" && <div className="grid gap-2 sm:grid-cols-3"><input className={input} maxLength={80} placeholder="Link text" value={x.text} onChange={(e) => setPart(i, { text: e.target.value })} /><input className={input} maxLength={300} placeholder="/shop or https://" value={x.href} onChange={(e) => setPart(i, { href: e.target.value })} /><select className={input} value={x.style} onChange={(e) => setPart(i, { style: e.target.value })}><option value="link">Plain link</option><option value="button">Filled button</option><option value="outline">Outlined button</option></select></div>}
          </div>
        ))}
        {parts.length < 40 && <div className="flex flex-wrap gap-2">{["heading", "paragraph", "list", "link", "quote", "divider"].map((k) => <button key={k} type="button" onClick={() => addPart(k)} className="rounded-pill border border-line px-3 py-1.5 text-xs capitalize hover:border-ink">Add {k}</button>)}</div>}
      </>;
    }
    case "products": return <>{t("title", b.title, "Title", 80)}{source(b)}<F l="How many (2 to 12)"><input type="number" min={2} max={12} className={input} value={b.count} onChange={(e) => set({ count: Math.min(12, Math.max(2, Number(e.target.value) || 4)) })} /></F></>;
    case "categories": return t("title", b.title, "Title", 80);
    case "banners": return <>{t("title", b.title, "Title (optional)", 80)}<p className="text-xs text-muted">Shows the banners you manage under Banners.</p></>;
    case "banner":
    case "bannerfull": return <>{t("title", b.title, "Title", 80)}{t("sub", b.sub, "Sub text", 160)}{ti("image", b.image, "Picture")}{pair("button", b.button, "Button text", "link", b.link, "Link")}</>;
    case "image": return <>{ti("image", b.image, "Picture")}{t("caption", b.caption, "Caption", 160)}{t("link", b.link, "Link (optional)", 300)}</>;
    case "newsletter": return <>{t("title", b.title, "Title", 80)}{t("text", b.text, "Text", 200)}</>;
    case "cta": return <>{t("heading", b.heading, "Heading", 120)}{t("text", b.text, "Text", 240)}{pair("button", b.button, "Button text", "link", b.link, "Link")}</>;
    case "marquee": return <>
      <F l="Phrases, one per line (up to 10)"><textarea className={input} rows={5} value={b.items.join("\n")} onChange={(e) => set({ items: e.target.value.split("\n").map((x) => x.slice(0, 60)).slice(0, 10) })} /></F>
      <div className="grid grid-cols-2 gap-3"><F l="Speed"><select className={input} value={b.speed} onChange={(e) => set({ speed: e.target.value })}><option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option></select></F><F l="Look"><select className={input} value={b.look} onChange={(e) => set({ look: e.target.value })}><option value="accent">Brand color</option><option value="dark">Dark</option><option value="plain">Light with lines</option></select></F></div></>;
    case "stats": return <>{t("title", b.title, "Title (optional)", 80)}{b.items.map((it, i) => <div key={i} className="grid grid-cols-[1fr_70px_auto] items-end gap-2 rounded-xl border border-line p-3">
        <F l="Label"><input className={input} maxLength={40} value={it.label} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} /></F>
        <F l="Ends with"><input className={input} maxLength={8} placeholder="+" value={it.suffix} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, suffix: e.target.value } : x)) })} /></F>
        <button type="button" aria-label="Remove" onClick={() => set({ items: b.items.filter((_, j) => j !== i) })} className="mb-2 px-1"><Trash2 size={14} /></button>
        <div className="col-span-3"><F l="Number it counts up to"><input type="number" min={0} className={input} value={it.value} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, value: Math.max(0, Number(e.target.value) || 0) } : x)) })} /></F></div></div>)}{b.items.length < 4 && <button type="button" onClick={() => set({ items: [...b.items, { value: 100, suffix: "", label: "" }] })} className="w-fit text-sm underline">Add a number</button>}</>;
    case "testimonials": return <>{t("title", b.title, "Title", 80)}<p className="text-xs text-muted">Use real words from real customers only.</p>{b.items.map((it, i) => <div key={i} className="grid gap-2 rounded-xl border border-line p-3">
        <textarea aria-label="What the customer said" placeholder="What the customer said" rows={3} maxLength={300} className={input} value={it.quote} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, quote: e.target.value } : x)) })} />
        <div className="flex gap-2"><input aria-label="Name" placeholder="Name" maxLength={60} className={input} value={it.name} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} /><input aria-label="Place or role" placeholder="City or role" maxLength={60} className={input} value={it.role} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)) })} /><button type="button" aria-label="Remove" onClick={() => set({ items: b.items.filter((_, j) => j !== i) })} className="px-2"><Trash2 size={14} /></button></div></div>)}{b.items.length < 6 && <button type="button" onClick={() => set({ items: [...b.items, { quote: "", name: "", role: "" }] })} className="w-fit text-sm underline">Add a review</button>}</>;
    case "countdown": return <>{t("title", b.title, "Title", 80)}{t("text", b.text, "Text", 200)}<F l="Offer ends on (your local time)"><input type="datetime-local" className={input} value={b.endsAt.slice(0, 16)} onChange={(e) => set({ endsAt: e.target.value })} /></F>{pair("button", b.button, "Button text", "link", b.link, "Button link")}</>;
    case "gallery": return <>{t("title", b.title, "Title (optional)", 80)}{b.images.map((it, i) => <div key={i} className="flex gap-2 rounded-xl border border-line p-3"><div className="grid flex-1 gap-2"><ImageField key={`g${i}`} value={it.src} label="Photo" onChange={(u) => set({ images: b.images.map((x, j) => (j === i ? { ...x, src: u } : x)) })} /><input aria-label="Caption" placeholder="Caption (optional)" maxLength={80} className={input} value={it.caption} onChange={(e) => set({ images: b.images.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)) })} /></div><button type="button" aria-label="Remove" onClick={() => set({ images: b.images.filter((_, j) => j !== i) })} className="px-2"><Trash2 size={14} /></button></div>)}{b.images.length < 8 && <button type="button" onClick={() => set({ images: [...b.images, { src: "", caption: "" }] })} className="w-fit text-sm underline">Add a photo</button>}</>;
    case "split": return <>{t("heading", b.heading, "Heading", 120)}<F l="Text (blank line between paragraphs)"><textarea className={input} rows={5} maxLength={2000} value={b.body} onChange={(e) => set({ body: e.target.value })} /></F>{ti("image", b.image, "Picture")}{pair("button", b.button, "Button text", "link", b.link, "Button link")}<F l="Picture on the"><select className={input} value={b.imageSide} onChange={(e) => set({ imageSide: e.target.value })}><option value="left">Left</option><option value="right">Right</option></select></F></>;
    case "trust": return <>{b.items.map((it, i) => <div key={i} className="grid gap-2 rounded-xl border border-line p-3"><div className="flex gap-2"><select aria-label="Icon" className={`${input} !w-32`} value={it.icon} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)) })}>{["truck", "shield", "refresh", "headset", "gift", "card", "clock", "star"].map((v) => <option key={v} value={v}>{v}</option>)}</select><input aria-label="Title" placeholder="Title" maxLength={60} className={input} value={it.title} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />{b.items.length > 1 && <button type="button" aria-label="Remove" onClick={() => set({ items: b.items.filter((_, j) => j !== i) })} className="px-2"><Trash2 size={14} /></button>}</div><input aria-label="Text" placeholder="Short text" maxLength={120} className={input} value={it.text} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} /></div>)}{b.items.length < 6 && <button type="button" onClick={() => set({ items: [...b.items, { icon: "star", title: "", text: "" }] })} className="w-fit text-sm underline">Add a badge</button>}</>;
    case "html": return <><F l="Your HTML, CSS and JavaScript"><textarea className={`${input} font-mono text-xs`} rows={16} spellCheck={false} maxLength={50000} value={b.code} onChange={(e) => set({ code: e.target.value })} /></F><p className="text-xs text-muted">It shows exactly as written, inside its own safe frame, so it cannot break the rest of your store. Use pictures from your uploads or Pexels, Unsplash and Pixabay. Google Fonts work too.</p></>;
    case "order": return <OffersEditor b={b} set={set} products={products} />;
    case "features": return <>{t("title", b.title, "Title", 80)}{b.items.map((it, i) => <div key={i} className="grid gap-2 rounded-xl border border-line p-3"><div className="flex gap-2"><input aria-label="Feature title" placeholder="Title" maxLength={60} className={input} value={it.title} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} /><button type="button" aria-label="Remove" onClick={() => set({ items: b.items.filter((_, j) => j !== i) })} className="px-2"><Trash2 size={14} /></button></div><input aria-label="Feature text" placeholder="Text" maxLength={200} className={input} value={it.text} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} /></div>)}{b.items.length < 6 && <button type="button" onClick={() => set({ items: [...b.items, { title: "", text: "" }] })} className="w-fit text-sm underline">Add a feature</button>}</>;
    case "faq": return <>{t("title", b.title, "Title", 80)}{b.items.map((it, i) => <div key={i} className="grid gap-2 rounded-xl border border-line p-3"><div className="flex gap-2"><input aria-label="Question" placeholder="Question" maxLength={160} className={input} value={it.q} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} /><button type="button" aria-label="Remove" onClick={() => set({ items: b.items.filter((_, j) => j !== i) })} className="px-2"><Trash2 size={14} /></button></div><textarea aria-label="Answer" placeholder="Answer" rows={2} maxLength={800} className={input} value={it.a} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} /></div>)}{b.items.length < 12 && <button type="button" onClick={() => set({ items: [...b.items, { q: "", a: "" }] })} className="w-fit text-sm underline">Add a question</button>}</>;
  }
}

type Props = {
  initial?: PageInitial; products: Product[]; categories: Cat[];
  kind?: "page" | "landing"; builtin?: { path: string } | null; zones?: { id: string; name: string; fee: number; freeOver: number | null }[];
};

export function PageBuilder({ initial = EMPTY, products, categories, kind = "page", builtin = null, zones = [] }: Props) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [open, setOpen] = useState<string | null>(initial.blocks[0]?.id ?? null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const allowed = kind === "landing" ? LANDING : ALL.filter((t) => t !== "order");
  const blocks = f.blocks;
  const setBlocks = (b: Block[]) => { setSaved(false); setF((p) => ({ ...p, blocks: b })); };
  const insert = (b: Block, at: number) => { const c = [...blocks]; c.splice(at, 0, b); setBlocks(c); setOpen(b.id); };
  const mv = (from: number, to: number) => { if (to < 0 || to >= blocks.length || from === to) return; const c = [...blocks]; const [x] = c.splice(from, 1); c.splice(to, 0, x); setBlocks(c); };
  const patch = (i: number, p: Record<string, unknown>) => setBlocks(blocks.map((b, j) => (j === i ? ({ ...b, ...p } as Block) : b)));

  function drop(i: number, e: React.DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer.getData("block") as BlockType;
    if (type && allowed.includes(type)) insert(newBlock(type), i);
    else if (dragIdx !== null) mv(dragIdx, dragIdx < i ? i - 1 : i);
    setDragIdx(null); setOver(null);
  }

  function save() {
    setError(""); setSaved(false);
    start(async () => {
      const r = await savePage({ id: f.id, slug: f.slug || slugify(f.title), title: f.title, description: f.description, status: f.status, blocks, kind });
      if (!r.ok) return setError(r.error);
      if (builtin) { setF((p) => ({ ...p, id: r.id })); setSaved(true); router.refresh(); return; }
      router.push(kind === "landing" ? "/admin/landing-pages" : "/admin/pages");
      router.refresh();
    });
  }

  const addr = kind === "landing" ? "/lp/" : "/p/";
  return (
    <div className="grid gap-6 lg:grid-cols-[440px_1fr]">
      <div className="grid content-start gap-5">
        <section className="grid gap-3 rounded-xl border border-line bg-surface p-5">
          <F l="Page title"><input className={input} maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></F>
          <div className="grid grid-cols-2 gap-3">
            {builtin ? <F l="Address"><input className={`${input} opacity-60`} value={builtin.path} readOnly /></F> : <F l={`Address (${addr}...)`}><input className={input} placeholder="Auto from title" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} /></F>}
            <F l="Status"><select className={input} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="active">{builtin ? "Live on the store" : "Live"}</option><option value="draft">{builtin ? "Hidden (visitors see the built-in version)" : "Draft"}</option></select></F>
          </div>
          <F l={`Search description (${f.description.length}/170)`}><textarea className={input} rows={2} maxLength={170} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></F>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm font-medium">Add a block</p>
          <p className="mt-1 text-xs text-muted">Click to add at the end, or drag one into the list. Open a block to edit it, drag the handle to reorder, delete the ones you do not want.</p>
          <div className="mt-3 grid gap-3">
            {BLOCK_GROUPS.map((g) => { const types = g.types.filter((t) => allowed.includes(t)); return types.length === 0 ? null : (
              <div key={g.title}><p className="mb-1.5 text-xs text-muted">{g.title}</p><div className="flex flex-wrap gap-2">{types.map((t) => <button key={t} type="button" draggable onDragStart={(e) => e.dataTransfer.setData("block", t)} onClick={() => insert(newBlock(t), blocks.length)} className="cursor-grab rounded-pill border border-line px-3 py-1.5 text-sm hover:border-ink">{BLOCK_LABELS[t]}</button>)}</div></div>
            ); })}
          </div>
        </section>

        <section onDragOver={(e) => e.preventDefault()} onDrop={(e) => drop(blocks.length, e)} className="grid gap-2">
          {blocks.length === 0 && <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">No blocks yet. Add your first block above.</p>}
          {blocks.map((b, i) => (
            <div key={b.id} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOver(i); }} onDrop={(e) => { e.stopPropagation(); drop(i, e); }} className={`rounded-xl border bg-surface ${over === i ? "border-accent" : "border-line"}`}>
              <div className="flex items-center gap-1 p-2">
                <span draggable onDragStart={() => setDragIdx(i)} onDragEnd={() => { setDragIdx(null); setOver(null); }} aria-label="Drag to reorder" className="grid h-8 w-8 cursor-grab place-items-center text-muted"><GripVertical size={16} /></span>
                <button type="button" onClick={() => setOpen(open === b.id ? null : b.id)} aria-expanded={open === b.id} className="flex flex-1 items-center gap-1 text-left text-sm font-medium">{open === b.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{BLOCK_LABELS[b.type]}</button>
                <button type="button" aria-label="Move up" onClick={() => mv(i, i - 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><ArrowUp size={14} /></button>
                <button type="button" aria-label="Move down" onClick={() => mv(i, i + 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><ArrowDown size={14} /></button>
                <button type="button" aria-label="Delete block" onClick={() => setBlocks(blocks.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><Trash2 size={14} /></button>
              </div>
              {open === b.id && <div className="grid gap-3 border-t border-line p-4"><Fields b={b} set={(p) => patch(i, p)} cats={categories} products={products} /><StyleRow b={b} set={(p) => patch(i, p)} /></div>}
            </div>
          ))}
        </section>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {saved && <p role="status" className={`rounded-lg p-3 text-sm ${f.status === "active" ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-800"}`}>{f.status === "active" ? "Saved and live. Visitors see this version now (it can take up to a minute to refresh for everyone)." : "Saved, but the status is not Live, so visitors still see the built-in version. Set the status to Live and save again."}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" disabled={pending} onClick={save} className="rounded-pill bg-accent px-7 py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Saving..." : "Save"}</button>
          {builtin && <a href={builtin.path} target="_blank" className="flex items-center gap-1 text-sm underline">View page <ExternalLink size={13} /></a>}
          {f.id && <button type="button" disabled={pending} onClick={() => { if (confirm(builtin ? "Go back to the built-in version? Your edits will be removed." : "Delete this page?")) start(async () => { await deletePage(f.id as string); router.push(builtin ? "/admin/pages" : kind === "landing" ? "/admin/landing-pages" : "/admin/pages"); router.refresh(); }); }} className="rounded-pill border border-line px-6 py-3 text-sm text-red-600">{builtin ? "Reset to built-in" : "Delete"}</button>}
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-2 text-xs font-medium text-muted">Live preview</p>
        <div className="max-h-[85vh] overflow-y-auto rounded-xl border border-line bg-paper">
          {blocks.length === 0 ? <p className="p-10 text-center text-sm text-muted">Your page appears here as you add blocks.</p> : <BlockRenderer blocks={blocks} products={products} categories={categories} zones={zones} slug={f.slug} preview />}
        </div>
      </div>
    </div>
  );
}
