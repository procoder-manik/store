import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type L = { id: string; slug: string; title: string; status: string; offers: { qty: number; price: number }[]; products: { name: string } | { name: string }[] | null };

export default async function LandingPages() {
  const supabase = await createClient();
  const { data } = await supabase.from("landing_pages").select("id, slug, title, status, offers, products(name)").order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as L[];
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Landing pages</h1>
        <Link href="/admin/landing-pages/new" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">New landing page</Link>
      </div>
      <p className="mt-1 max-w-xl text-sm text-muted">One product, one offer, one order form. Use these pages for ads. Customers order straight from the page.</p>
      <ul className="mt-6 grid max-w-3xl gap-3">
        {rows.length === 0 && <li className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">No landing pages yet.</li>}
        {rows.map((r) => {
          const prod = Array.isArray(r.products) ? r.products[0] : r.products;
          return (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 text-sm">
              <span><Link href={`/admin/landing-pages/${r.id}`} className="font-medium hover:underline">{r.title}</Link><span className="block text-xs text-muted">{prod?.name}, {r.offers.length} {r.offers.length === 1 ? "offer" : "offers"}</span></span>
              <span className="text-right text-xs"><span className={r.status === "active" ? "font-medium text-accent" : "text-muted"}>{r.status === "active" ? "Live" : "Draft"}</span><Link href={`/lp/${r.slug}`} className="block underline" target="_blank">/lp/{r.slug}</Link></span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
