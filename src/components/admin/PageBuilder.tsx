"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, GripVertical, Trash2 } from "lucide-react";
import { deletePage, savePage } from "@/app/admin/pages/actions";
import { BLOCK_LABELS, newBlock, type Block, type BlockType } from "@/lib/blocks";
import type { Product } from "@/lib/demo-products";
import type { Cat } from "@/lib/catalog";
import { slugify } from "@/lib/utils";
import { BlockRenderer } from "@/components/Blocks";

export type PageInitial = { id?: string; slug: string; title: string; description: string; status: string; blocks: Block[] };
const EMPTY: PageInitial = { slug: "", title: "", description: "", status: "draft", blocks: [] };
const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";
const TYPES = Object.keys(BLOCK_LABELS) as BlockType[];

function F({ l, children }: { l: string; children: React.ReactNode }) { return <div><label className={label}>{l}</label>{children}</div>; }

function Fields({ b, set, cats }: { b: Block; set: (p: Record<string, unknown>) => void; cats: Cat[] }) {
  const t = (k: string, v: string, l: string, max = 200) => <F l={l}><input className={input} maxLength={max} value={v} onChange={(e) => set({ [k]: e.target.value })} /></F>;
  switch (b.type) {
    case "hero": return <>{t("heading", b.heading, "Heading", 120)}{t("sub", b.sub, "Sub text", 240)}{t("image", b.image, "Background image link (Pexels, Unsplash or Pixabay)", 500)}<div className="grid grid-cols-2 gap-3">{t("button", b.button, "Button text", 30)}{t("link", b.link, "Button link", 300)}</div><F l="Text position"><select className={input} value={b.align} onChange={(e) => set({ align: e.target.value })}><option value="left">Left</option><option value="center">Center</option></select></F></>;
    case "text": return <>{t("heading", b.heading, "Heading (optional)", 120)}<F l="Text (blank line between paragraphs)"><textarea className={input} rows={5} maxLength={4000} value={b.body} onChange={(e) => set({ body: e.target.value })} /></F></>;
    case "products": return <>{t("title", b.title, "Title", 80)}<F l="Show"><select className={input} value={b.source} onChange={(e) => set({ source: e.target.value })}><option value="all">Newest products</option><option value="category">One category</option><option value="tag">A tag</option></select></F>
      {b.source === "category" && <F l="Category"><select className={input} value={b.category} onChange={(e) => set({ category: e.target.value })}><option value="">Choose</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></F>}
      {b.source === "tag" && <F l="Tag"><select className={input} value={b.tag} onChange={(e) => set({ tag: e.target.value })}>{["new", "hot", "featured", "sale"].map((x) => <option key={x}>{x}</option>)}</select></F>}
      <F l="How many (2 to 12)"><input type="number" min={2} max={12} className={input} value={b.count} onChange={(e) => set({ count: Math.min(12, Math.max(2, Number(e.target.value) || 4)) })} /></F></>;
    case "categories": return t("title", b.title, "Title", 80);
    case "banner": return <>{t("title", b.title, "Title", 80)}{t("sub", b.sub, "Sub text", 160)}{t("image", b.image, "Image link", 500)}<div className="grid grid-cols-2 gap-3">{t("button", b.button, "Button text", 30)}{t("link", b.link, "Link", 300)}</div></>;
    case "image": return <>{t("image", b.image, "Image link (Pexels, Unsplash or Pixabay)", 500)}{t("caption", b.caption, "Caption", 160)}{t("link", b.link, "Link (optional)", 300)}</>;
    case "cta": return <>{t("heading", b.heading, "Heading", 120)}{t("text", b.text, "Text", 240)}<div className="grid grid-cols-2 gap-3">{t("button", b.button, "Button text", 30)}{t("link", b.link, "Link", 300)}</div></>;
    case "features": return <>{t("title", b.title, "Title", 80)}{b.items.map((it, i) => <div key={i} className="grid gap-2 rounded-xl border border-line p-3"><div className="flex gap-2"><input aria-label="Feature title" placeholder="Title" maxLength={60} className={input} value={it.title} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} /><button type="button" aria-label="Remove" onClick={() => set({ items: b.items.filter((_, j) => j !== i) })} className="px-2"><Trash2 size={14} /></button></div><input aria-label="Feature text" placeholder="Text" maxLength={200} className={input} value={it.text} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} /></div>)}{b.items.length < 6 && <button type="button" onClick={() => set({ items: [...b.items, { title: "", text: "" }] })} className="w-fit text-sm underline">Add a feature</button>}</>;
    case "faq": return <>{t("title", b.title, "Title", 80)}{b.items.map((it, i) => <div key={i} className="grid gap-2 rounded-xl border border-line p-3"><div className="flex gap-2"><input aria-label="Question" placeholder="Question" maxLength={160} className={input} value={it.q} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} /><button type="button" aria-label="Remove" onClick={() => set({ items: b.items.filter((_, j) => j !== i) })} className="px-2"><Trash2 size={14} /></button></div><textarea aria-label="Answer" placeholder="Answer" rows={2} maxLength={800} className={input} value={it.a} onChange={(e) => set({ items: b.items.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} /></div>)}{b.items.length < 12 && <button type="button" onClick={() => set({ items: [...b.items, { q: "", a: "" }] })} className="w-fit text-sm underline">Add a question</button>}</>;
  }
}

export function PageBuilder({ initial = EMPTY, products, categories }: { initial?: PageInitial; products: Product[]; categories: Cat[] }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [open, setOpen] = useState<string | null>(initial.blocks[0]?.id ?? null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const blocks = f.blocks;
  const setBlocks = (b: Block[]) => setF((p) => ({ ...p, blocks: b }));
  const insert = (b: Block, at: number) => { const c = [...blocks]; c.splice(at, 0, b); setBlocks(c); setOpen(b.id); };
  const mv = (from: number, to: number) => { if (to < 0 || to >= blocks.length || from === to) return; const c = [...blocks]; const [x] = c.splice(from, 1); c.splice(to, 0, x); setBlocks(c); };
  const patch = (i: number, p: Record<string, unknown>) => setBlocks(blocks.map((b, j) => (j === i ? ({ ...b, ...p } as Block) : b)));

  function drop(i: number, e: React.DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer.getData("block") as BlockType;
    if (type && TYPES.includes(type)) insert(newBlock(type), i);
    else if (dragIdx !== null) mv(dragIdx, dragIdx < i ? i - 1 : i);
    setDragIdx(null); setOver(null);
  }

  function save() {
    setError("");
    start(async () => {
      const r = await savePage({ id: f.id, slug: f.slug || slugify(f.title), title: f.title, description: f.description, status: f.status, blocks });
      if (!r.ok) return setError(r.error);
      router.push("/admin/pages");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[440px_1fr]">
      <div className="grid content-start gap-5">
        <section className="grid gap-3 rounded-xl border border-line bg-surface p-5">
          <F l="Page title"><input className={input} maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></F>
          <div className="grid grid-cols-2 gap-3">
            <F l="Address (/p/...)"><input className={input} placeholder="Auto from title" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} /></F>
            <F l="Status"><select className={input} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="draft">Draft</option><option value="active">Live</option></select></F>
          </div>
          <F l={`Search description (${f.description.length}/170)`}><textarea className={input} rows={2} maxLength={170} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></F>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <p className="text-sm font-medium">Add a block</p>
          <p className="mt-1 text-xs text-muted">Click to add at the end, or drag one into the list.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TYPES.map((t) => <button key={t} type="button" draggable onDragStart={(e) => e.dataTransfer.setData("block", t)} onClick={() => insert(newBlock(t), blocks.length)} className="cursor-grab rounded-full border border-line px-3 py-1.5 text-sm hover:border-ink">{BLOCK_LABELS[t]}</button>)}
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
              {open === b.id && <div className="grid gap-3 border-t border-line p-4"><Fields b={b} set={(p) => patch(i, p)} cats={categories} /></div>}
            </div>
          ))}
        </section>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="button" disabled={pending} onClick={save} className="rounded-full bg-accent px-7 py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Saving..." : "Save page"}</button>
          {f.id && <button type="button" disabled={pending} onClick={() => { if (confirm("Delete this page?")) start(async () => { await deletePage(f.id as string); router.push("/admin/pages"); router.refresh(); }); }} className="rounded-full border border-line px-6 py-3 text-sm text-red-600">Delete</button>}
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-2 text-xs font-medium text-muted">Live preview</p>
        <div className="max-h-[80vh] overflow-y-auto rounded-xl border border-line bg-paper">
          {blocks.length === 0 ? <p className="p-10 text-center text-sm text-muted">Your page appears here as you add blocks.</p> : <BlockRenderer blocks={blocks} products={products} categories={categories} />}
        </div>
      </div>
    </div>
  );
}
