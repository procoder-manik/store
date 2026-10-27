import { createClient } from "@/lib/supabase/server";
import { createBanner, deleteBanner, toggleBanner } from "./actions";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";

export default async function Banners() {
  const supabase = await createClient();
  const { data } = await supabase.from("banners").select("*").order("sort").order("title");
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Banners</h1>
      <p className="mt-1 text-sm text-muted">Banners show in a row on the home page under the rail. Without an image they use a plain color background.</p>
      <form action={createBanner} className="mt-5 grid max-w-3xl gap-3 sm:grid-cols-2">
        <input name="title" required maxLength={80} placeholder="Title" className={input} />
        <input name="subtitle" maxLength={160} placeholder="Subtitle (optional)" className={input} />
        <input name="image" placeholder="Image link (Pexels, Unsplash or Pixabay, optional)" className={`${input} sm:col-span-2`} />
        <input name="link" placeholder="Link, like /shop?cat=hoodies" className={input} />
        <input name="button" maxLength={30} placeholder="Button text" className={input} />
        <input name="sort" type="number" min={0} placeholder="Order (0 shows first)" className={input} />
        <button className="w-fit rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink">Add banner</button>
      </form>
      <ul className="mt-6 grid max-w-3xl gap-3">
        {(data ?? []).length === 0 && <li className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">No banners yet.</li>}
        {(data ?? []).map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 text-sm">
            <span className={b.active ? "" : "text-muted line-through"}><span className="font-medium">{b.title}</span><span className="block text-xs text-muted">{b.subtitle}</span></span>
            <span className="flex gap-4 text-xs">
              <form action={toggleBanner}><input type="hidden" name="id" value={b.id} /><input type="hidden" name="active" value={String(b.active)} /><button className="underline">{b.active ? "Hide" : "Show"}</button></form>
              <form action={deleteBanner}><input type="hidden" name="id" value={b.id} /><button className="text-red-600 underline">Delete</button></form>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
