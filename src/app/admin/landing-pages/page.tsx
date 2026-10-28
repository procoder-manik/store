import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { setPageStatus } from "@/app/admin/products/quick-actions";

type L = { id: string; slug: string; title: string; status: string; offers: { qty: number; price: number }[]; products: { name: string } | { name: string }[] | null };
const row = "flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 text-sm";

export default async function LandingPages() {
  const supabase = await createClient();
  const [built, classic] = await Promise.all([
    supabase.from("pages").select("id, slug, title, status, blocks").eq("kind", "landing").order("created_at", { ascending: false }),
    supabase.from("landing_pages").select("id, slug, title, status, offers, products(name)").order("created_at", { ascending: false }),
  ]);
  const rows = (classic.data ?? []) as unknown as L[];
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Landing pages</h1>
        <Link href="/admin/landing-pages/builder/new" className="rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">New landing page</Link>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-muted">Design your own sales page for ads. Add a headline, pictures, benefits and questions in any order, then an order form with offers: single products, quantity prices, and combos of several products. Customers order right on the page.</p>
      {built.error && <p className="mt-4 text-sm text-muted">Run supabase-0012-landing-builder.sql in the Supabase SQL Editor, then refresh, to use the landing page builder.</p>}
      <ul className="mt-6 grid max-w-3xl gap-2">
        {!built.error && (built.data ?? []).length === 0 && <li className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">No landing pages yet. Press New landing page.</li>}
        {(built.data ?? []).map((r) => (
          <li key={r.id} className={row}>
            <span><Link href={`/admin/landing-pages/builder/${r.id}`} className="font-medium hover:underline">{r.title}</Link><span className="block text-xs text-muted">{(r.blocks as unknown[]).length} sections</span></span>
            <span className="flex items-center gap-4 text-right text-xs">
              <form action={setPageStatus}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value={r.status === "active" ? "draft" : "active"} /><button className="underline">{r.status === "active" ? "Unpublish" : "Publish"}</button></form>
              <span><span className={r.status === "active" ? "font-medium text-accent" : "text-muted"}>{r.status === "active" ? "Live" : "Draft"}</span><Link href={`/lp/${r.slug}`} className="block underline" target="_blank">/lp/{r.slug}</Link></span>
            </span>
          </li>
        ))}
      </ul>

      {rows.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-lg font-semibold">Classic landing pages</h2>
          <p className="mt-1 text-sm text-muted">The earlier one-product format. They keep working. <Link href="/admin/landing-pages/new" className="underline">Make a classic one</Link></p>
          <ul className="mt-3 grid max-w-3xl gap-2">
            {rows.map((r) => {
              const prod = Array.isArray(r.products) ? r.products[0] : r.products;
              return (
                <li key={r.id} className={row}>
                  <span><Link href={`/admin/landing-pages/${r.id}`} className="font-medium hover:underline">{r.title}</Link><span className="block text-xs text-muted">{prod?.name}, {r.offers.length} {r.offers.length === 1 ? "offer" : "offers"}</span></span>
                  <span className="text-right text-xs"><span className={r.status === "active" ? "font-medium text-accent" : "text-muted"}>{r.status === "active" ? "Live" : "Draft"}</span><Link href={`/lp/${r.slug}`} className="block underline" target="_blank">/lp/{r.slug}</Link></span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
