import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { BUILTIN } from "@/lib/builtin-pages";
import { createClient } from "@/lib/supabase/server";
import { setPageStatus } from "@/app/admin/products/quick-actions";

const row = "flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 text-sm";

export default async function Pages() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pages").select("id, slug, title, status, blocks").order("created_at", { ascending: false });
  const all = data ?? [];
  const bySlug = new Map(all.map((p) => [p.slug as string, p]));
  const custom = all.filter((p) => !BUILTIN.some((b) => b.slug === p.slug));
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Pages</h1>
        <Link href="/admin/pages/new" className="rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">New page</Link>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-muted">Every page of your store is here. Open any of them to change the text, add or remove sections, and put them in the order you want.</p>
      {error && <p className="mt-4 text-sm text-muted">Run supabase-0007-pages-bundles.sql in the Supabase SQL Editor, then refresh.</p>}

      <h2 className="mt-8 font-display text-lg font-semibold">Store pages</h2>
      <ul className="mt-3 grid max-w-3xl gap-2">
        {BUILTIN.map((b) => {
          const p = bySlug.get(b.slug);
          const live = p?.status === "active";
          return (
            <li key={b.slug} className={row}>
              <span><Link href={`/admin/pages/builtin/${b.slug}`} className="font-medium hover:underline">{b.title}</Link><span className="block text-xs text-muted">{live ? `Your version is live, ${(p!.blocks as unknown[]).length} sections` : p ? "Your draft is saved. The built-in version is still showing." : "Built-in version. Open it to edit."}</span></span>
              <span className="flex items-center gap-4 text-xs">{p && <form action={setPageStatus}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value={live ? "draft" : "active"} /><button className="underline">{live ? "Use built-in" : "Use mine"}</button></form>}<Link href={b.path} target="_blank" className="flex items-center gap-1 underline">{b.path} <ExternalLink size={11} /></Link><Link href={`/admin/pages/builtin/${b.slug}`} className="rounded-pill border border-line px-3 py-1.5 font-medium hover:bg-paper">Edit</Link></span>
            </li>
          );
        })}
        <li className={row}>
          <span><span className="font-medium">Contact us</span><span className="block text-xs text-muted">Has the contact form. Change phone, email and address in Settings.</span></span>
          <span className="flex items-center gap-4 text-xs"><Link href="/contact" target="_blank" className="flex items-center gap-1 underline">/contact <ExternalLink size={11} /></Link><Link href="/admin/settings" className="rounded-pill border border-line px-3 py-1.5 font-medium hover:bg-paper">Settings</Link></span>
        </li>
      </ul>

      <h2 className="mt-10 font-display text-lg font-semibold">Your own pages</h2>
      <ul className="mt-3 grid max-w-3xl gap-2">
        {!error && custom.length === 0 && <li className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">None yet. Make pages like Offers or Our story with New page.</li>}
        {custom.map((p) => (
          <li key={p.id} className={row}>
            <span><Link href={`/admin/pages/${p.id}`} className="font-medium hover:underline">{p.title}</Link><span className="block text-xs text-muted">{(p.blocks as unknown[]).length} sections</span></span>
            <span className="flex items-center gap-4 text-right text-xs">
              <form action={setPageStatus}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value={p.status === "active" ? "draft" : "active"} /><button className="underline">{p.status === "active" ? "Unpublish" : "Publish"}</button></form>
              <span><span className={p.status === "active" ? "font-medium text-accent" : "text-muted"}>{p.status === "active" ? "Live" : "Draft"}</span><Link href={`/p/${p.slug}`} target="_blank" className="block underline">/p/{p.slug}</Link></span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
