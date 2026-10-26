import { createClient } from "@/lib/supabase/server";
import { deleteZone, saveZone, toggleZone } from "./actions";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";

export default async function Shipping() {
  const supabase = await createClient();
  const { data } = await supabase.from("shipping_zones").select("*").order("sort").order("fee");
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Shipping</h1>
      <p className="mt-1 text-sm text-muted">Each delivery area has a flat fee. Set a free delivery amount to waive the fee on bigger orders.</p>
      <div className="mt-6 grid gap-3">
        {(data ?? []).map((z) => (
          <div key={z.id} className="grid gap-3 rounded-xl border border-line bg-surface p-4 md:grid-cols-[1fr_140px_180px_auto]">
            <form action={saveZone} className="contents">
              <input type="hidden" name="id" value={z.id} />
              <input name="name" aria-label="Area name" defaultValue={z.name} required className={input} />
              <input name="fee" aria-label="Fee" type="number" min={0} step="0.01" defaultValue={z.fee} required className={input} />
              <input name="free_over" aria-label="Free delivery over" type="number" min={0} step="0.01" defaultValue={z.free_over ?? ""} placeholder="Free over (optional)" className={input} />
              <button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">Save</button>
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
        <button className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">Add</button>
      </form>
    </>
  );
}
