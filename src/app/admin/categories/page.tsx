import { createClient } from "@/lib/supabase/server";
import { createCategory, deleteCategory, toggleCategory, updateCategory } from "./actions";

const input = "rounded-xl border border-line bg-surface px-3 py-2 text-sm";

export default async function Categories() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("sort").order("name");

  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Categories</h1>
      <p className="mt-1 text-sm text-muted">Rename a category or change its order (0 shows first). If you change an address, the old one redirects to the new one automatically.</p>
      <form action={createCategory} className="mt-5 flex max-w-md gap-2">
        <input name="name" required maxLength={80} placeholder="New category name" className={`${input} w-full`} />
        <button className="shrink-0 rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">Add</button>
      </form>
      <ul className="mt-6 max-w-2xl divide-y divide-line rounded-xl border border-line bg-surface">
        {(data ?? []).length === 0 && <li className="p-4 text-sm text-muted">No categories yet. Add your first one above.</li>}
        {(data ?? []).map((c) => (
          <li key={c.id} className="grid gap-3 p-4">
            <form action={updateCategory} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input name="name" aria-label="Name" defaultValue={c.name} required maxLength={80} className={`${input} min-w-0 flex-1 ${c.active ? "" : "text-muted line-through"}`} />
              <input name="sort" aria-label="Order" type="number" min={0} max={999} defaultValue={c.sort} className={`${input} w-20`} />
              <button className="text-sm font-medium text-accent underline">Save</button>
              <div className="flex w-full items-center gap-2 text-xs text-muted"><span className="shrink-0">/category/</span><input name="slug" aria-label="Address" defaultValue={c.slug} required maxLength={80} className={`${input} min-w-0 flex-1`} data-no-ai /></div>
              <textarea name="description" aria-label="Description" defaultValue={c.description ?? ""} maxLength={400} rows={2} placeholder="Short text shown at the top of this category page and in search results" className={`${input} w-full`} />
            </form>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted">/category/{c.slug}</span>
              <form action={toggleCategory}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="active" value={String(c.active)} /><button className="underline">{c.active ? "Hide" : "Show"}</button></form>
              <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><button className="text-red-600 underline">Delete</button></form>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
