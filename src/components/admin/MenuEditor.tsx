"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { saveSite } from "@/app/admin/menus/actions";
import type { Settings } from "@/lib/settings";

type L = { label: string; href: string };
const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const card = "rounded-xl border border-line bg-surface p-5 grid gap-4";
const label = "mb-1 block text-xs font-medium text-muted";

function move<T>(a: T[], i: number, d: number) {
  const j = i + d;
  if (j < 0 || j >= a.length) return a;
  const c = [...a];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
}

function LinkList({ links, onChange, max = 8 }: { links: L[]; onChange: (l: L[]) => void; max?: number }) {
  const set = (i: number, p: Partial<L>) => onChange(links.map((l, j) => (j === i ? { ...l, ...p } : l)));
  return (
    <div className="grid gap-2">
      {links.map((l, i) => (
        <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] items-center gap-2">
          <input aria-label="Link label" placeholder="Label" maxLength={40} value={l.label} onChange={(e) => set(i, { label: e.target.value })} className={input} />
          <input aria-label="Link address" list="link-suggest" placeholder="/shop" value={l.href} onChange={(e) => set(i, { href: e.target.value })} className={input} />
          <span className="flex">
            <button type="button" aria-label="Move up" onClick={() => onChange(move(links, i, -1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><ArrowUp size={14} /></button>
            <button type="button" aria-label="Move down" onClick={() => onChange(move(links, i, 1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><ArrowDown size={14} /></button>
            <button type="button" aria-label="Remove link" onClick={() => onChange(links.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper"><Trash2 size={14} /></button>
          </span>
        </div>
      ))}
      {links.length < max && <button type="button" onClick={() => onChange([...links, { label: "", href: "" }])} className="flex w-fit items-center gap-1.5 text-sm underline"><Plus size={14} /> Add a link</button>}
    </div>
  );
}

export function MenuEditor({ initial, suggestions }: { initial: Pick<Settings, "brand" | "header" | "footer">; suggestions: L[] }) {
  const [brand, setBrand] = useState(initial.brand);
  const [header, setHeader] = useState(initial.header.links);
  const [footer, setFooter] = useState(initial.footer);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const setCol = (i: number, p: Partial<Settings["footer"]["columns"][number]>) => setFooter({ ...footer, columns: footer.columns.map((c, j) => (j === i ? { ...c, ...p } : c)) });

  return (
    <form onSubmit={(e) => { e.preventDefault(); setMsg(null); start(async () => { const r = await saveSite({ brand, header: { links: header }, footer }); setMsg(r.ok ? { ok: true, text: "Saved. Your store is updated." } : { ok: false, text: r.error ?? "Could not save." }); }); }} className="grid max-w-3xl gap-5">
      <datalist id="link-suggest">{suggestions.map((s) => <option key={s.href} value={s.href}>{s.label}</option>)}</datalist>

      <section className={card}>
        <h2 className="font-display text-base font-semibold">Store name</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Name (shown in the header, footer, emails and browser tab)</label><input className={input} required maxLength={40} value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} /></div>
          <div><label className={label}>Tagline</label><input className={input} maxLength={120} value={brand.tagline} onChange={(e) => setBrand({ ...brand, tagline: e.target.value })} /></div>
        </div>
      </section>

      <section className={card}>
        <div><h2 className="font-display text-base font-semibold">Header menu</h2><p className="mt-1 text-xs text-muted">Links shown next to your store name. Start typing an address to pick a page, category or custom page.</p></div>
        <LinkList links={header} onChange={setHeader} />
      </section>

      <section className={card}>
        <div><h2 className="font-display text-base font-semibold">Footer</h2><p className="mt-1 text-xs text-muted">Leave the columns empty to use the automatic Shop and Help columns.</p></div>
        <div><label className={label}>About text</label><textarea className={input} rows={2} maxLength={240} value={footer.about} onChange={(e) => setFooter({ ...footer, about: e.target.value })} /></div>
        {footer.columns.map((c, i) => (
          <div key={i} className="grid gap-3 rounded-xl border border-line p-4">
            <div className="flex items-end gap-2">
              <div className="flex-1"><label className={label}>Column title</label><input className={input} maxLength={30} value={c.title} onChange={(e) => setCol(i, { title: e.target.value })} /></div>
              <button type="button" aria-label="Remove column" onClick={() => setFooter({ ...footer, columns: footer.columns.filter((_, j) => j !== i) })} className="grid h-10 w-10 place-items-center rounded-full hover:bg-paper"><Trash2 size={14} /></button>
            </div>
            <LinkList links={c.links} onChange={(links) => setCol(i, { links })} />
          </div>
        ))}
        {footer.columns.length < 4 && <button type="button" onClick={() => setFooter({ ...footer, columns: [...footer.columns, { title: "", links: [] }] })} className="flex w-fit items-center gap-1.5 text-sm underline"><Plus size={14} /> Add a column</button>}
        <div><label className={label}>Copyright line (optional)</label><input className={input} maxLength={160} value={footer.copyright} onChange={(e) => setFooter({ ...footer, copyright: e.target.value })} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={footer.newsletter} onChange={(e) => setFooter({ ...footer, newsletter: e.target.checked })} /> Show the email sign up form</label>
      </section>

      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-muted" : "text-red-600"}`}>{msg.text}</p>}
      <button disabled={pending} className="w-fit rounded-full bg-accent px-7 py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Saving..." : "Save changes"}</button>
    </form>
  );
}
