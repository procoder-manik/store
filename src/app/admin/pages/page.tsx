import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Pages() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pages").select("id, slug, title, status, blocks").order("created_at", { ascending: false });
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Pages</h1>
        <Link href="/admin/pages/new" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">New page</Link>
      </div>
      <p className="mt-1 max-w-xl text-sm text-muted">Build pages like About, Offers or Size guide by adding blocks. Add a live page to your menu under Site and menu.</p>
      {error && <p className="mt-4 text-sm text-muted">Run supabase-0007-pages-bundles.sql in the Supabase SQL Editor, then refresh.</p>}
      <ul className="mt-6 grid max-w-3xl gap-3">
        {!error && (data ?? []).length === 0 && <li className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">No pages yet.</li>}
        {(data ?? []).map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 text-sm">
            <span><Link href={`/admin/pages/${p.id}`} className="font-medium hover:underline">{p.title}</Link><span className="block text-xs text-muted">{(p.blocks as unknown[]).length} blocks</span></span>
            <span className="text-right text-xs"><span className={p.status === "active" ? "font-medium text-accent" : "text-muted"}>{p.status === "active" ? "Live" : "Draft"}</span><Link href={`/p/${p.slug}`} target="_blank" className="block underline">/p/{p.slug}</Link></span>
          </li>
        ))}
      </ul>
    </>
  );
}
