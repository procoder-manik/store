import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { mergeSettings } from "@/lib/settings";
import { ruleLive } from "@/lib/free-delivery";
import { deleteZone, saveFreeDelivery, saveZone, toggleZone } from "./actions";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";

export default async function Shipping() {
  const supabase = await createClient();
  const [{ data }, { data: rows }] = await Promise.all([supabase.from("shipping_zones").select("*").order("sort").order("fee"), supabase.from("site_settings").select("key, value").eq("key", "free_delivery")]);
  const offer = mergeSettings((rows ?? []) as { key: string; value: unknown }[]).freeDelivery;
  const live = ruleLive(offer);
  const announce = (slot: string) => `/admin/banners?${new URLSearchParams({ slot, title: `Free delivery over ৳${offer.amount.toLocaleString("en-US")}`, text: offer.zones.length ? "In selected areas." : "Everywhere we deliver.", link: "/offers", button: "See offers", design: "gold" })}`;
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Shipping</h1>
      <p className="mt-1 text-sm text-muted">Each delivery area has a flat fee. Run one free delivery offer for the whole store, or give an area its own amount.</p>
      <form action={saveFreeDelivery} className="mt-6 grid max-w-3xl gap-4 rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold">Free delivery offer</h2>
          <span className={`rounded-pill px-2.5 py-0.5 text-xs font-medium ${live ? "bg-emerald-500/10 text-emerald-700" : "bg-paper text-muted"}`}>{live ? "Running now" : "Not running"}</span>
        </div>
        <p className="text-xs text-muted">Shoppers see this by themselves on product pages, in the cart and at checkout, along with how much more they need to spend. The amount is checked before any discount. If an area below has its own lower amount, the lower one wins.</p>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={offer.enabled} /> Run this offer</label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs font-medium text-muted" htmlFor="fd-amount">Free delivery on orders of (৳) or more</label><input id="fd-amount" name="amount" type="number" min={0} step={1} defaultValue={offer.amount || ""} placeholder="10000" className={input} /></div>
          <div><label className="mb-1 block text-xs font-medium text-muted" htmlFor="fd-end">Last day (optional)</label><input id="fd-end" name="endsAt" type="date" defaultValue={offer.endsAt} className={input} /></div>
        </div>
        <fieldset className="grid gap-2 text-sm">
          <legend className="mb-1 text-xs font-medium text-muted">Which areas</legend>
          <label className="flex items-center gap-2"><input type="radio" name="scope" value="all" defaultChecked={offer.zones.length === 0} /> Every delivery area</label>
          <label className="flex items-center gap-2"><input type="radio" name="scope" value="some" defaultChecked={offer.zones.length > 0} /> Only these areas:</label>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pl-6">
            {(data ?? []).map((z) => <label key={z.id} className="flex items-center gap-2"><input type="checkbox" name="zones" value={z.id} defaultChecked={offer.zones.includes(z.id)} /> {z.name}</label>)}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink">Save offer</button>
          {offer.amount > 0 && <>
            <Link href={announce("home")} className="rounded-pill border border-line px-4 py-2 text-sm font-medium hover:bg-paper">Make a banner for it</Link>
            <Link href={announce("popup")} className="rounded-pill border border-line px-4 py-2 text-sm font-medium hover:bg-paper">Make a popup for it</Link>
          </>}
        </div>
      </form>
      <h2 className="mt-8 font-display text-lg font-semibold">Delivery areas</h2>
      <div className="mt-3 grid gap-3">
        {(data ?? []).map((z) => (
          <div key={z.id} className="grid gap-3 rounded-xl border border-line bg-surface p-4 md:grid-cols-[1fr_140px_180px_auto]">
            <form action={saveZone} className="contents">
              <input type="hidden" name="id" value={z.id} />
              <input name="name" aria-label="Area name" defaultValue={z.name} required className={input} />
              <input name="fee" aria-label="Fee" type="number" min={0} step="0.01" defaultValue={z.fee} required className={input} />
              <input name="free_over" aria-label="Free delivery over" type="number" min={0} step="0.01" defaultValue={z.free_over ?? ""} placeholder="Free over (optional)" className={input} />
              <button className="rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">Save</button>
            </form>
            <div className="flex gap-4 text-xs md:col-span-4">
              <form action={toggleZone}><input type="hidden" name="id" value={z.id} /><input type="hidden" name="active" value={String(z.active)} /><button className="underline">{z.active ? "Turn off" : "Turn on"}</button></form>
              <form action={deleteZone}><input type="hidden" name="id" value={z.id} /><button className="text-red-600 underline">Delete</button></form>
              {!z.active && <span className="text-muted">Hidden from checkout</span>}
            </div>
          </div>
        ))}
      </div>
      <h2 className="mt-8 font-display text-lg font-semibold">Add delivery area</h2>
      <form action={saveZone} className="mt-3 grid max-w-3xl gap-3 md:grid-cols-[1fr_140px_180px_auto]">
        <input name="name" placeholder="Area name" required className={input} />
        <input name="fee" type="number" min={0} step="0.01" placeholder="Fee" required className={input} />
        <input name="free_over" type="number" min={0} step="0.01" placeholder="Free over (optional)" className={input} />
        <button className="rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">Add</button>
      </form>
    </>
  );
}
