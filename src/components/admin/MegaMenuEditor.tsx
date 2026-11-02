"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";
import { saveMegaMenu } from "@/app/admin/mega-menu/actions";
import { MegaPanel } from "@/components/MegaPanel";
import type { Banner } from "@/lib/banner-config";
import type { Product } from "@/lib/demo-products";
import { MEGA_LAYOUTS, newColumn, showMenu, uid, type MegaColumn, type MegaLink, type MegaMenu, type PerkIcon } from "@/lib/mega-menu";
import { ImageField } from "./ImageField";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";
const small = "rounded-pill border border-line px-3 py-1.5 text-xs font-medium hover:bg-paper";
const KINDS: { kind: MegaColumn["kind"]; name: string; about: string }[] = [
  { kind: "links", name: "List of links", about: "Your own links" },
  { kind: "categories", name: "All categories", about: "Fills in by itself" },
  { kind: "products", name: "Products", about: "Chosen by you, or automatic" },
  { kind: "promo", name: "Offer or picture", about: "A banner, coupon or poster" },
  { kind: "perks", name: "Promises", about: "Icons, like free delivery" },
];
const ICONS: PerkIcon[] = ["truck", "card", "refresh", "shield", "headset", "gift", "clock", "star"];

type Props = { initial: MegaMenu[]; products: Product[]; categories: { id: string; label: string }[]; nav: MegaLink[]; banners: Banner[]; coupons: string[]; theme: string };

export function MegaMenuEditor({ initial, products, categories, nav, banners, coupons, theme }: Props) {
  const [menus, setMenus] = useState<MegaMenu[]>(initial);
  const [cur, setCur] = useState(initial[0]?.id ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [find, setFind] = useState("");
  const m = menus.find((x) => x.id === cur);

  const edit = (p: Partial<MegaMenu>) => { setMsg(null); setMenus((all) => all.map((x) => (x.id === cur ? { ...x, ...p } : x))); };
  const setCol = (id: string, p: object) => edit({ columns: m!.columns.map((c) => (c.id === id ? ({ ...c, ...p } as MegaColumn) : c)) });
  const move = (i: number, by: number) => { const c = [...m!.columns]; const [x] = c.splice(i, 1); c.splice(i + by, 0, x); edit({ columns: c }); };

  function addMenu(l: MegaLink) {
    const n: MegaMenu = { id: uid(), label: l.label, href: l.href, enabled: true, columns: MEGA_LAYOUTS[3].build(categories) };
    setMenus((all) => [...all, n]);
    setCur(n.id);
    setMsg(null);
  }

  function save() {
    setMsg(null);
    start(async () => {
      const r = await saveMegaMenu({ menus });
      setMsg(r.ok ? { ok: true, text: "Saved. The shop is updated." } : { ok: false, text: r.error ?? "Could not save." });
    });
  }

  const unused = nav.filter((n) => !menus.some((x) => x.href === n.href));

  return (
    <div className="grid max-w-5xl gap-5">
      <section className="rounded-xl border border-line bg-surface p-4">
        <p className="text-sm font-semibold">Your mega menus</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {menus.map((x) => <button key={x.id} type="button" onClick={() => setCur(x.id)} aria-pressed={x.id === cur} className={`rounded-pill border px-4 py-2 text-sm font-medium ${x.id === cur ? "border-ink bg-ink text-paper" : "border-line"} ${x.enabled ? "" : "opacity-60"}`}>{x.label}</button>)}
          {menus.length === 0 && <p className="text-sm text-muted">None yet. Choose a menu item below to start.</p>}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,16rem)_auto] sm:items-end">
          <div>
            <label className={label} htmlFor="mm-add">Add a mega menu to</label>
            <select id="mm-add" value="" onChange={(e) => { const n = nav.find((x) => x.href === e.target.value); if (n) addMenu(n); else if (e.target.value === "new") addMenu({ label: "New menu", href: "/shop" }); }} className={input}>
              <option value="">Choose a menu item</option>
              {unused.map((n) => <option key={n.href} value={n.href}>{n.label}</option>)}
              <option value="new">A new menu item of my own</option>
            </select>
          </div>
        </div>
      </section>

      {m && (
        <>
          <section className="grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2">
            <div><label className={label} htmlFor="mm-label">Name in the top menu</label><input id="mm-label" value={m.label} maxLength={40} onChange={(e) => edit({ label: e.target.value })} className={input} /></div>
            <div><label className={label} htmlFor="mm-href">Opens this page when clicked</label><input id="mm-href" value={m.href} maxLength={300} onChange={(e) => edit({ href: e.target.value })} className={input} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={m.enabled} onChange={(e) => edit({ enabled: e.target.checked })} /> Show this mega menu</label>
            <div className="text-right"><button type="button" onClick={() => { if (confirm(`Remove the ${m.label} mega menu?`)) { const left = menus.filter((x) => x.id !== m.id); setMenus(left); setCur(left[0]?.id ?? ""); } }} className="text-xs text-[var(--madder)] underline">Remove this mega menu</button></div>
          </section>

          <section className="rounded-xl border border-line bg-surface p-4">
            <p className="text-sm font-semibold">Start from a ready-made layout</p>
            <p className="mt-0.5 text-xs text-muted">This replaces the columns below with your real categories and products. Then edit anything.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {MEGA_LAYOUTS.map((l) => <button key={l.id} type="button" onClick={() => edit({ columns: l.build(categories) })} className="rounded-xl border border-line p-3 text-left transition hover:border-ink/40"><span className="block text-sm font-medium">{l.name}</span><span className="mt-0.5 block text-xs text-muted">{l.about}</span></button>)}
            </div>
          </section>

          <section className="rounded-xl bg-paper p-1">
            <p className="px-3 pb-2 pt-2 text-xs font-medium text-muted">Preview, using your live products</p>
            <div inert data-theme={theme} className="overflow-x-auto rounded-[24px] bg-paper"><div className="min-w-[760px]"><MegaPanel menu={showMenu(m, products, categories)} /></div></div>
          </section>

          <section className="grid gap-3">
            <p className="text-sm font-semibold">Columns, left to right</p>
            {m.columns.map((c, i) => (
              <div key={c.id} className="grid gap-3 rounded-xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{i + 1}. {KINDS.find((k) => k.kind === c.kind)?.name}</p>
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label="Move left" disabled={i === 0} onClick={() => move(i, -1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper disabled:opacity-30"><ArrowLeft size={14} /></button>
                    <button type="button" aria-label="Move right" disabled={i === m.columns.length - 1} onClick={() => move(i, 1)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-paper disabled:opacity-30"><ArrowRight size={14} /></button>
                    <button type="button" aria-label="Remove column" onClick={() => edit({ columns: m.columns.filter((x) => x.id !== c.id) })} className="grid h-8 w-8 place-items-center rounded-full text-[var(--madder)] hover:bg-paper"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div><label className={label}>Title</label><input value={c.title} maxLength={80} onChange={(e) => setCol(c.id, { title: e.target.value })} className={input} /></div>

                {c.kind === "links" && (
                  <div className="grid gap-2">
                    {c.links.map((l, j) => (
                      <div key={j} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <input aria-label="Link name" placeholder="Name" value={l.label} maxLength={60} onChange={(e) => setCol(c.id, { links: c.links.map((x, k) => (k === j ? { ...x, label: e.target.value } : x)) })} className={input} />
                        <input aria-label="Link address" placeholder="/category/pillows" value={l.href} maxLength={300} list="mm-pages" onChange={(e) => setCol(c.id, { links: c.links.map((x, k) => (k === j ? { ...x, href: e.target.value } : x)) })} className={input} />
                        <button type="button" aria-label="Remove link" onClick={() => setCol(c.id, { links: c.links.filter((_, k) => k !== j) })} className="grid h-9 w-9 place-items-center rounded-full text-[var(--madder)] hover:bg-paper"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setCol(c.id, { links: [...c.links, { label: "", href: "" }] })} className={`${small} w-fit`}>Add a link</button>
                  </div>
                )}

                {c.kind === "categories" && <p className="text-xs text-muted">Lists your live categories by itself.</p>}

                {c.kind === "products" && (
                  <div className="grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div><label className={label}>Which products</label><select value={c.source} onChange={(e) => setCol(c.id, { source: e.target.value })} className={input}><option value="pick">Ones I choose</option><option value="category">From a category</option><option value="hot">Labelled Hot</option><option value="new">Labelled New</option><option value="bestseller">Labelled Best seller</option><option value="sale">On sale</option><option value="preorder">Pre-order</option></select></div>
                      {c.source === "category" && <div><label className={label}>Category</label><select value={c.category} onChange={(e) => setCol(c.id, { category: e.target.value })} className={input}><option value="">Choose</option>{categories.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></div>}
                      {c.source !== "pick" && <div><label className={label}>How many</label><input type="number" min={1} max={8} value={c.count} onChange={(e) => setCol(c.id, { count: Math.min(8, Math.max(1, Number(e.target.value) || 1)) })} className={input} /></div>}
                      <div><label className={label}>Show as</label><select value={c.style} onChange={(e) => setCol(c.id, { style: e.target.value })} className={input}><option value="rows">Rows with a small picture</option><option value="cards">Cards with a big picture</option></select></div>
                    </div>
                    {c.source === "pick" && (
                      <div className="grid gap-2 rounded-lg bg-paper p-3">
                        <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Search products" aria-label="Search products" className={input} />
                        <ul className="grid max-h-56 gap-1 overflow-y-auto sm:grid-cols-2">
                          {[...products].sort((a, b) => Number(c.ids.includes(b.id)) - Number(c.ids.includes(a.id))).filter((p) => p.name.toLowerCase().includes(find.trim().toLowerCase())).map((p) => (
                            <li key={p.id}><label className="flex cursor-pointer items-center gap-2 rounded-lg p-1 text-sm hover:bg-surface"><input type="checkbox" checked={c.ids.includes(p.id)} disabled={!c.ids.includes(p.id) && c.ids.length >= 12} onChange={(e) => setCol(c.id, { ids: e.target.checked ? [...c.ids, p.id] : c.ids.filter((x) => x !== p.id) })} />{p.image && <img src={p.image} alt="" className="h-7 w-7 rounded object-contain" />}<span className="truncate">{p.name}</span></label></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {c.kind === "promo" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {banners.length > 0 && <div className="sm:col-span-2"><label className={label}>Copy from a banner (optional)</label><select value="" onChange={(e) => { const b = banners.find((x) => x.id === e.target.value); if (b) setCol(c.id, { title: b.title, text: b.subtitle, image: b.image, button: b.button, link: b.link }); }} className={input}><option value="">Choose a running offer</option>{banners.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}</select></div>}
                    <div className="sm:col-span-2"><label className={label}>Words</label><input value={c.text} maxLength={160} onChange={(e) => setCol(c.id, { text: e.target.value })} className={input} /></div>
                    <div><label className={label}>Button</label><input value={c.button} maxLength={30} onChange={(e) => setCol(c.id, { button: e.target.value })} className={input} /></div>
                    <div><label className={label}>Opens this page</label><input value={c.link} maxLength={300} list="mm-pages" onChange={(e) => setCol(c.id, { link: e.target.value })} className={input} /></div>
                    <div><label className={label}>Coupon code to show (optional)</label><input value={c.code} maxLength={30} list="mm-coupons" onChange={(e) => setCol(c.id, { code: e.target.value.toUpperCase() })} className={input} /></div>
                    <div className="sm:col-span-2"><ImageField key={c.id + c.image.slice(-8)} value={c.image} label="Picture (optional)" onChange={(u) => setCol(c.id, { image: u })} /></div>
                  </div>
                )}

                {c.kind === "perks" && (
                  <div className="grid gap-2">
                    {c.items.map((p, j) => (
                      <div key={j} className="grid gap-2 sm:grid-cols-[7rem_1fr_1fr_auto]">
                        <select aria-label="Icon" value={p.icon} onChange={(e) => setCol(c.id, { items: c.items.map((x, k) => (k === j ? { ...x, icon: e.target.value } : x)) })} className={input}>{ICONS.map((n) => <option key={n} value={n}>{n}</option>)}</select>
                        <input aria-label="Title" placeholder="Title" value={p.title} maxLength={60} onChange={(e) => setCol(c.id, { items: c.items.map((x, k) => (k === j ? { ...x, title: e.target.value } : x)) })} className={input} />
                        <input aria-label="Words" placeholder="Words" value={p.text} maxLength={100} onChange={(e) => setCol(c.id, { items: c.items.map((x, k) => (k === j ? { ...x, text: e.target.value } : x)) })} className={input} />
                        <button type="button" aria-label="Remove promise" onClick={() => setCol(c.id, { items: c.items.filter((_, k) => k !== j) })} className="grid h-9 w-9 place-items-center rounded-full text-[var(--madder)] hover:bg-paper"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    {c.items.length < 6 && <button type="button" onClick={() => setCol(c.id, { items: [...c.items, { icon: "gift", title: "", text: "" }] })} className={`${small} w-fit`}>Add a promise</button>}
                  </div>
                )}
              </div>
            ))}
            {m.columns.length < 6 && (
              <div className="grid gap-2 rounded-xl border border-dashed border-line p-4 sm:grid-cols-5">
                {KINDS.map((k) => <button key={k.kind} type="button" onClick={() => edit({ columns: [...m.columns, newColumn(k.kind)] })} className="rounded-lg border border-line p-2.5 text-left hover:border-ink/40"><span className="flex items-center gap-1 text-xs font-semibold"><Plus size={12} />{k.name}</span><span className="mt-0.5 block text-[11px] text-muted">{k.about}</span></button>)}
              </div>
            )}
          </section>
        </>
      )}

      <datalist id="mm-pages">{nav.map((n) => <option key={n.href} value={n.href}>{n.label}</option>)}</datalist>
      <datalist id="mm-coupons">{coupons.map((c) => <option key={c} value={c} />)}</datalist>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={pending} onClick={save} className="rounded-pill bg-accent px-7 py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Saving..." : "Save mega menus"}</button>
        {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-[var(--madder)]"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
