"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { saveDesign } from "@/app/admin/emails/actions";
import { EBLOCK_INFO, EBLOCK_LABELS, newEmailBlock, renderEmailDesign, type EBlock, type EBlockType, type EmailDesign } from "@/lib/email-builder";
import type { Product } from "@/lib/demo-products";
import { formatPrice } from "@/lib/config";
import { ImageField } from "./ImageField";
import { InfoTip } from "./InfoTip";

export type BuilderInitial = { id?: string; name: string; subject: string; design: EmailDesign };
const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";
const TYPES = Object.keys(EBLOCK_LABELS) as EBlockType[];
type Setter = (p: Record<string, unknown>) => void;

function F({ l, info, children }: { l: string; info?: string; children: React.ReactNode }) {
  return <div><label className={label}>{l}{info && <InfoTip text={info} />}</label>{children}</div>;
}

export function EmailBuilder({ initial, products, brand, logo }: { initial: BuilderInitial; products: Product[]; brand: string; logo: string }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [open, setOpen] = useState<string | null>(initial.design.blocks[0]?.id ?? null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [mobile, setMobile] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const blocks = f.design.blocks;
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const setDesign = (d: Partial<EmailDesign>) => { setError(""); setF((p) => ({ ...p, design: { ...p.design, ...d } })); };
  const setBlocks = (b: EBlock[]) => setDesign({ blocks: b });
  const insert = (b: EBlock, at: number) => { const c = [...blocks]; c.splice(at, 0, b); setBlocks(c); setOpen(b.id); };
  const mv = (from: number, to: number) => { if (to < 0 || to >= blocks.length || from === to) return; const c = [...blocks]; const [x] = c.splice(from, 1); c.splice(to, 0, x); setBlocks(c); };
  const patch = (i: number, p: Record<string, unknown>) => setBlocks(blocks.map((b, j) => (j === i ? ({ ...b, ...p } as EBlock) : b)));

  /** Put a product into a products block, or start a new one. */
  function addProduct(pid: string, at: number) {
    const target = blocks[at];
    if (target?.type === "products") {
      if (target.items.length >= 12 || target.items.some((x) => x.productId === pid)) return;
      patch(at, { items: [...target.items, { productId: pid, percent: 0 }] });
      setOpen(target.id);
      return;
    }
    const nb = { ...(newEmailBlock("products") as Extract<EBlock, { type: "products" }>), items: [{ productId: pid, percent: 0 }] };
    insert(nb, Math.min(at, blocks.length));
  }
  function addProductQuick(pid: string) {
    let idx = -1;
    blocks.forEach((b, i) => { if (b.type === "products") idx = i; });
    addProduct(pid, idx >= 0 ? idx : blocks.length);
  }

  function drop(i: number, e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation();
    const pid = e.dataTransfer.getData("eproduct");
    const type = e.dataTransfer.getData("eblock") as EBlockType;
    if (pid) addProduct(pid, i);
    else if (type && TYPES.includes(type)) insert(newEmailBlock(type), i);
    else if (dragIdx !== null) mv(dragIdx, dragIdx < i ? i - 1 : i);
    setDragIdx(null); setOver(null);
  }

  const preview = useMemo(() => renderEmailDesign({ design: f.design, products, brand, logo, siteUrl: typeof window === "undefined" ? "" : window.location.origin, unsubscribeUrl: "#", firstName: "Rahim" }).html, [f.design, products, brand, logo]);

  function save() {
    setError("");
    start(async () => {
      const r = await saveDesign({ id: f.id, name: f.name, subject: f.subject, design: f.design });
      if (!r.ok) return setError(r.error);
      router.push("/admin/emails"); router.refresh();
    });
  }

  function fields(b: EBlock, set: Setter) {
    const t = (k: string, v: string, l: string, max = 200, info?: string) => <F l={l} info={info}><input className={input} maxLength={max} value={v} onChange={(e) => set({ [k]: e.target.value })} /></F>;
    switch (b.type) {
      case "hero": return <>
        {t("eyebrow", b.eyebrow, "Small label above the title", 40)}{t("heading", b.heading, "Title", 120)}{t("sub", b.sub, "Text under the title", 240)}
        <ImageField value={b.image} label="Banner picture (optional)" onChange={(u) => set({ image: u })} />
        <div className="grid grid-cols-2 gap-3">{t("button", b.button, "Button text", 30)}{t("link", b.link, "Button link, like /shop", 300)}</div>
        <F l="Look" info="Dark is bold and premium. Brand color uses your email color. Light is calm and clean."><select className={input} value={b.tone} onChange={(e) => set({ tone: e.target.value })}><option value="dark">Dark</option><option value="accent">Brand color</option><option value="light">Light</option></select></F></>;
      case "text": return <>{t("heading", b.heading, "Heading (optional)", 120)}<F l="Message" info="Leave a blank line between paragraphs. {{name}} becomes the customer's first name."><textarea className={input} rows={5} maxLength={3000} value={b.body} onChange={(e) => set({ body: e.target.value })} /></F>
        <F l="Align"><select className={input} value={b.align} onChange={(e) => set({ align: e.target.value })}><option value="left">Left</option><option value="center">Center</option></select></F></>;
      case "products": return <>
        <div className="grid grid-cols-2 gap-3">{t("title", b.title, "Title", 80)}{t("button", b.button, "Link text under each product", 30)}</div>
        {t("sub", b.sub, "Small line under the title", 160)}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={b.showPrice} onChange={(e) => set({ showPrice: e.target.checked })} /> Show prices<InfoTip text="Turn off to show only the picture and name, like a catalog." /></label>
        <F l="Discount for all products in this block (%)" info="Fills the percent for every product here. You can still change each one. The percent is shown in the email only. Create a coupon so customers really get it."><input type="number" min={0} max={90} className={input} placeholder="e.g. 20" onChange={(e) => { const v = Math.min(90, Math.max(0, Math.round(Number(e.target.value)) || 0)); set({ items: b.items.map((x) => ({ ...x, percent: v })) }); }} /></F>
        <div className="grid gap-2">
          {b.items.length === 0 && <p className="rounded-xl border border-dashed border-line p-4 text-center text-xs text-muted">Drag products here from the list, or press + next to a product.</p>}
          {b.items.map((it, k) => { const p = byId.get(it.productId); return (
            <div key={it.productId} className="flex items-center gap-2 rounded-xl border border-line p-2">
              {p?.image ? <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 rounded-lg bg-paper" />}
              <span className="min-w-0 flex-1 text-sm"><span className="block truncate font-medium">{p?.name ?? "Removed product"}</span><span className="text-xs text-muted">{p ? formatPrice(p.basePrice) : ""}</span></span>
              <input type="number" min={0} max={90} aria-label="Discount percent" value={it.percent} onChange={(e) => set({ items: b.items.map((x, j) => (j === k ? { ...x, percent: Math.min(90, Math.max(0, Math.round(Number(e.target.value)) || 0)) } : x)) })} className={`${input} !w-16`} /><span className="text-xs text-muted">%</span>
              <button type="button" aria-label="Remove product" onClick={() => set({ items: b.items.filter((_, j) => j !== k) })} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><Trash2 size={13} /></button>
            </div>); })}
        </div></>;
      case "offer": return <>{t("eyebrow", b.eyebrow, "Small label", 40)}{t("headline", b.headline, "Big offer text, like UP TO 30% OFF", 60)}{t("sub", b.sub, "Text under it", 200)}
        <div className="grid grid-cols-2 gap-3">{t("code", b.code, "Coupon code", 30, "Create the same code under Coupons so it works at checkout. Leave empty for no code.")}{t("endsText", b.endsText, "When it ends", 80)}</div></>;
      case "button": return <div className="grid grid-cols-3 gap-3">{t("text", b.text, "Text", 40)}{t("link", b.link, "Link", 300)}<F l="Align"><select className={input} value={b.align} onChange={(e) => set({ align: e.target.value })}><option value="center">Center</option><option value="left">Left</option></select></F></div>;
      case "image": return <><ImageField value={b.image} label="Picture" onChange={(u) => set({ image: u })} /><div className="grid grid-cols-2 gap-3">{t("caption", b.caption, "Caption (optional)", 120)}{t("link", b.link, "Link (optional)", 300)}</div></>;
      case "spacer": return <F l="Height (px)"><input type="number" min={8} max={80} className={input} value={b.size} onChange={(e) => set({ size: Math.min(80, Math.max(8, Number(e.target.value) || 24)) })} /></F>;
      default: return <p className="text-xs text-muted">Nothing to set. This is just a thin line.</p>;
    }
  }

  const shown = products.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 60);

  return (
    <div className="grid gap-6 xl:grid-cols-[480px_1fr]">
      <div className="grid content-start gap-5">
        <section className="grid gap-3 rounded-xl border border-line bg-surface p-5">
          <F l="Email name (only you see it)" info="A name to find this email later, like Eid Special 2026."><input className={input} maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></F>
          <F l="Subject line" info="What customers see in their inbox before they open it. Use {{name}} for their first name."><input className={input} maxLength={150} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></F>
          <div className="grid grid-cols-[1fr_90px] gap-3">
            <F l="Preview line" info="The grey line next to the subject in the inbox. It makes more people open the email."><input className={input} maxLength={120} value={f.design.preheader} onChange={(e) => setDesign({ preheader: e.target.value })} /></F>
            <F l="Color" info="Buttons, prices and lines in the email use this color."><input type="color" aria-label="Email color" value={f.design.accent} onChange={(e) => setDesign({ accent: e.target.value })} className="h-10 w-full cursor-pointer rounded-xl border border-line bg-surface" /></F>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm font-medium">Add a block<InfoTip text="An email is built from blocks stacked top to bottom. Click a block to add it at the end, or drag it to the exact place you want." /></p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TYPES.map((t) => <button key={t} type="button" draggable onDragStart={(e) => e.dataTransfer.setData("eblock", t)} onClick={() => insert(newEmailBlock(t), blocks.length)} title={EBLOCK_INFO[t]} className="cursor-grab rounded-pill border border-line px-3 py-1.5 text-sm hover:border-ink">{EBLOCK_LABELS[t]}</button>)}
          </div>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm font-medium">Your products<InfoTip text="Drag a product into a Products block, or onto the list below to start a new one. Or press + to add it to the last Products block. New products you add to the store appear here by themselves." /></p>
          <input className={`${input} mt-3`} placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
          <ul className="mt-3 grid max-h-64 gap-1.5 overflow-y-auto pr-1">
            {shown.length === 0 && <li className="p-3 text-xs text-muted">No products found.</li>}
            {shown.map((p) => (
              <li key={p.id} draggable onDragStart={(e) => e.dataTransfer.setData("eproduct", p.id)} className="flex cursor-grab items-center gap-2 rounded-xl border border-line p-1.5 text-sm hover:border-ink">
                {p.image ? <img src={p.image} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <span className="h-9 w-9 rounded-lg bg-paper" />}
                <span className="min-w-0 flex-1"><span className="block truncate">{p.name}</span><span className="text-xs text-muted">{formatPrice(p.basePrice)}</span></span>
                <button type="button" aria-label={`Add ${p.name}`} onClick={() => addProductQuick(p.id)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><Plus size={15} /></button>
              </li>
            ))}
          </ul>
        </section>

        <section onDragOver={(e) => e.preventDefault()} onDrop={(e) => drop(blocks.length, e)} className="grid gap-2">
          {blocks.length === 0 && <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">No blocks yet. Add one above, or drop a product here.</p>}
          {blocks.map((b, i) => (
            <div key={b.id} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOver(i); }} onDrop={(e) => drop(i, e)} className={`rounded-xl border bg-surface ${over === i ? "border-accent" : "border-line"}`}>
              <div className="flex items-center gap-1 p-2">
                <span draggable onDragStart={() => setDragIdx(i)} onDragEnd={() => { setDragIdx(null); setOver(null); }} aria-label="Drag to reorder" className="grid h-8 w-8 cursor-grab place-items-center text-muted"><GripVertical size={16} /></span>
                <button type="button" onClick={() => setOpen(open === b.id ? null : b.id)} aria-expanded={open === b.id} className="flex-1 text-left text-sm font-medium">{EBLOCK_LABELS[b.type]}{b.type === "products" && <span className="ml-2 text-xs font-normal text-muted">{b.items.length} products</span>}</button>
                <button type="button" aria-label="Move up" onClick={() => mv(i, i - 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><ArrowUp size={14} /></button>
                <button type="button" aria-label="Move down" onClick={() => mv(i, i + 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><ArrowDown size={14} /></button>
                <button type="button" aria-label="Delete block" onClick={() => setBlocks(blocks.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><Trash2 size={14} /></button>
              </div>
              {open === b.id && <div className="grid gap-3 border-t border-line p-4"><p className="text-xs text-muted">{EBLOCK_INFO[b.type]}</p>{fields(b, (p) => patch(i, p))}</div>}
            </div>
          ))}
        </section>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="button" disabled={pending} onClick={save} className="w-fit rounded-pill bg-accent px-7 py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Saving..." : "Save email"}</button>
      </div>

      <div className="min-w-0 xl:sticky xl:top-4 xl:self-start">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted">Live preview<InfoTip text="This is how the email looks in an inbox. Switch to Phone to check it on a small screen." /></p>
          <span className="flex gap-1 text-xs">
            <button type="button" onClick={() => setMobile(false)} aria-pressed={!mobile} className={`rounded-pill px-3 py-1 ${!mobile ? "bg-ink text-paper" : "border border-line"}`}>Computer</button>
            <button type="button" onClick={() => setMobile(true)} aria-pressed={mobile} className={`rounded-pill px-3 py-1 ${mobile ? "bg-ink text-paper" : "border border-line"}`}>Phone</button>
          </span>
        </div>
        <iframe title="Email preview" sandbox="" srcDoc={preview} className={`mx-auto h-[78vh] rounded-xl border border-line bg-white transition-all ${mobile ? "w-[390px] max-w-full" : "w-full"}`} />
      </div>
    </div>
  );
}
