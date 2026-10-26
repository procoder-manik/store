import { createClient } from "@/lib/supabase/server";
import { createBundle, deleteBundle, toggleBundle } from "./actions";

const input = "rounded-xl border border-line bg-surface px-3 py-2 text-sm";

export default async function Bundles() {
  const supabase = await createClient();
  const [{ data: bundles, error }, { data: products }] = await Promise.all([
    supabase.from("bundles").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("id, name").eq("status", "active").order("name"),
  ]);
  const names = new Map((products ?? []).map((p) => [p.id as string, p.name as string]));
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Buy-together bundles</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Pick 2 to 4 products and a discount. The product pages show a "buy together" box, and the discount applies at checkout whenever a customer has one of each in the cart. If a product is in several bundles, the best discount is used.</p>
      {error && <p className="mt-4 text-sm text-muted">Run supabase-0007-pages-bundles.sql in the Supabase SQL Editor, then refresh.</p>}
      <form action={createBundle} className="mt-5 grid max-w-2xl gap-4 rounded-xl border border-line bg-surface p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <input name="name" required maxLength={80} placeholder="Bundle name, like Winter set" className={input} />
          <input name="percent" type="number" required min={1} max={90} step="0.5" placeholder="Discount %" className={input} />
        </div>
        <fieldset className="grid max-h-56 gap-1 overflow-y-auto">
          <legend className="mb-1 text-xs font-medium text-muted">Products (choose 2 to 4)</legend>
          {(products ?? []).map((p) => <label key={p.id as string} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-paper"><input type="checkbox" name="p" value={p.id as string} />{p.name as string}</label>)}
        </fieldset>
        <button className="w-fit rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink">Create bundle</button>
      </form>
      <ul className="mt-6 grid max-w-2xl gap-3">
        {!error && (bundles ?? []).length === 0 && <li className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">No bundles yet.</li>}
        {(bundles ?? []).map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 text-sm">
            <span className={b.active ? "" : "text-muted line-through"}><span className="font-medium">{b.name}</span> <span className="text-accent">{Number(b.discount_percent)}% off</span><span className="block text-xs text-muted">{(b.product_ids as string[]).map((id) => names.get(id) ?? "Unavailable product").join(", ")}</span></span>
            <span className="flex gap-4 text-xs">
              <form action={toggleBundle}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="active" value={String(b.active)} /><button className="underline">{b.active ? "Turn off" : "Turn on"}</button></form>
              <form action={deleteBundle}><input type="hidden" name="id" value={b.id} /><button className="text-red-600 underline">Delete</button></form>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
