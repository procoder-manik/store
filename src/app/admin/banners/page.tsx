import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "@/components/admin/ActionForm";
import { ImageField } from "@/components/admin/ImageField";
import { BANNER_DESIGNS, BANNER_SLOTS, bannerShortcode } from "@/lib/banners";
import { OfferSlider } from "@/components/OfferSlider";
import { deleteBanner, saveBanner, toggleBanner } from "./actions";

export const metadata = { title: "Banners" };

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";
const local = (v: string | null) => (v ? new Date(v).toISOString().slice(0, 16) : "");

type Row = { id: string; title: string | null; subtitle: string | null; image: string | null; link: string | null; button: string | null; sort: number; active: boolean; slot: string | null; design: string | null; starts_at: string | null; ends_at: string | null };

export default async function Banners({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("banners").select("*").order("sort");
  const rows = (data ?? []) as Row[];
  const e = rows.find((r) => r.id === edit);
  const reserved = BANNER_SLOTS.some((s) => s.id === (e?.slot ?? "home"));
  const groups = [...new Set(rows.map((r) => r.slot ?? "home"))];

  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Banners</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Show offers as a slider that changes by itself. Use your own picture, or a ready-made design with your words. Every banner can open a page when clicked.</p>

      <ActionForm key={e?.id ?? "new"} action={saveBanner} goTo="/admin/banners" className="mt-5 grid max-w-3xl gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2">
        <h2 className="font-display text-base font-semibold sm:col-span-2">{e ? "Edit banner" : "Add a banner"}</h2>
        {e && <input type="hidden" name="id" value={e.id} />}
        <div>
          <label className={label} htmlFor="slot">Where it shows</label>
          <select id="slot" name="slot" defaultValue={reserved ? e?.slot ?? "home" : "custom"} className={input}>
            {BANNER_SLOTS.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.size})</option>)}
            <option value="custom">My own group, placed with a shortcode</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="customSlot">Group name, for your own group</label>
          <input id="customSlot" name="customSlot" defaultValue={reserved ? "" : e?.slot ?? ""} maxLength={40} placeholder="eid-offer" className={input} />
        </div>
        <div>
          <label className={label} htmlFor="design">Design</label>
          <select id="design" name="design" defaultValue={e?.design ?? "image"} className={input}>{BANNER_DESIGNS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        </div>
        <div>
          <label className={label} htmlFor="sort">Order (0 shows first)</label>
          <input id="sort" name="sort" type="number" min={0} max={999} defaultValue={e?.sort ?? 0} className={input} />
        </div>
        <div className="sm:col-span-2"><ImageField name="image" value={e?.image ?? ""} label="Picture (upload, choose from your library, or paste a link)" /></div>
        <div className="sm:col-span-2 -mt-2"><p className="text-xs text-muted">If your picture already has the words in it, leave the title and text empty.</p></div>
        <div><label className={label} htmlFor="title">Title</label><input id="title" name="title" defaultValue={e?.title ?? ""} maxLength={80} className={input} /></div>
        <div><label className={label} htmlFor="subtitle">Text (optional)</label><input id="subtitle" name="subtitle" defaultValue={e?.subtitle ?? ""} maxLength={160} className={input} /></div>
        <div><label className={label} htmlFor="link">Opens this page when clicked</label><input id="link" name="link" defaultValue={e?.link ?? ""} maxLength={200} placeholder="/category/pillows" className={input} /></div>
        <div><label className={label} htmlFor="button">Button words (optional)</label><input id="button" name="button" defaultValue={e?.button ?? ""} maxLength={30} className={input} /></div>
        <div><label className={label} htmlFor="startsAt">Start showing (optional)</label><input id="startsAt" name="startsAt" type="datetime-local" defaultValue={local(e?.starts_at ?? null)} className={input} /></div>
        <div><label className={label} htmlFor="endsAt">Stop showing (optional)</label><input id="endsAt" name="endsAt" type="datetime-local" defaultValue={local(e?.ends_at ?? null)} className={input} /></div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button className="w-fit rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink">{e ? "Save banner" : "Add banner"}</button>
          {e && <Link href="/admin/banners" className="text-sm text-muted underline">Cancel</Link>}
        </div>
      </ActionForm>

      {groups.length === 0 && <p className="mt-6 max-w-3xl rounded-xl border border-line bg-surface p-5 text-sm text-muted">No banners yet. Add your first one above.</p>}
      {groups.map((slot) => {
        const list = rows.filter((r) => (r.slot ?? "home") === slot);
        const known = BANNER_SLOTS.find((s) => s.id === slot);
        return (
          <section key={slot} className="mt-8 max-w-3xl">
            <h2 className="font-display text-lg font-semibold">{known?.name ?? `Group: ${slot}`}</h2>
            <p className="mt-1 text-xs text-muted">{known && slot !== "home" ? "Shows by itself." : "Add the Offer slider section in the page builder, or paste this shortcode into a page's text:"} {(!known || slot === "home") && <code className="select-all rounded bg-paper px-1.5 py-0.5 font-mono text-[12px] text-ink">{bannerShortcode(slot)}</code>}</p>
            <ul className="mt-3 grid gap-3">
              {list.map((b) => (
                <li key={b.id} className="overflow-hidden rounded-xl border border-line bg-surface text-sm">
                  <OfferSlider size="band" banners={[{ id: b.id, title: b.title ?? "", subtitle: b.subtitle ?? "", image: b.image ?? "", link: "", button: b.button ?? "", slot, design: (b.design ?? "image") as never }]} />
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3">
                    <span className={b.active ? "" : "text-muted line-through"}>{b.title || "Picture banner"}<span className="block text-xs text-muted">{b.link || "No link"}{b.ends_at ? `. Stops ${new Date(b.ends_at).toLocaleDateString("en-GB")}` : ""}</span></span>
                    <span className="flex gap-4 text-xs">
                      <Link href={`/admin/banners?edit=${b.id}`} className="underline">Edit</Link>
                      <form action={toggleBanner}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="active" value={String(b.active)} /><button className="underline">{b.active ? "Hide" : "Show"}</button></form>
                      <form action={deleteBanner}><input type="hidden" name="id" value={b.id} /><button className="text-[var(--madder)] underline">Delete</button></form>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
