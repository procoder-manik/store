import { SITE_URL } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { deleteRedirect } from "./actions";

const card = "rounded-xl border border-line bg-surface p-5";

export default async function Permalinks() {
  const supabase = await createClient();
  const [{ data: reds, error }, { data: first }, { data: cat }] = await Promise.all([
    supabase.from("redirects").select("id, from_path, to_path, created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("products").select("slug").eq("status", "active").limit(1),
    supabase.from("categories").select("slug").eq("active", true).limit(1),
  ]);
  const rows: [string, string, string][] = [
    ["Home", "/", "Your 3D rail and featured sections"],
    ["All products", "/shop", "Search, sort and filter"],
    ["A category", `/category/${cat?.[0]?.slug ?? "hoodies"}`, "Set in Categories. Add a short description for search results"],
    ["A product", `/product/${first?.[0]?.slug ?? "everyday-hoodie"}`, "Set in the product form under Search listing"],
    ["A page you built", "/p/about-our-story", "Set in Pages"],
    ["Store pages", "/about, /faq, /contact, /shipping, /returns, /privacy, /terms, /size-guide", "Built in. Make a page with the same address to replace one"],
    ["Order tracking", "/track", "Customers need the order number and phone"],
  ];
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">URLs and search</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Short, readable addresses help customers trust a link and help search engines understand a page. These are the addresses your store uses.</p>

      <section className={`${card} mt-6`}>
        <h2 className="font-display text-base font-semibold">Address map</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs text-muted"><tr><th className="pb-2 pr-4 font-medium">Page</th><th className="pb-2 pr-4 font-medium">Address</th><th className="pb-2 font-medium">Where you control it</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map(([a, b, c]) => <tr key={a}><td className="py-2.5 pr-4 font-medium">{a}</td><td className="py-2.5 pr-4 font-mono text-xs">{b}</td><td className="py-2.5 text-muted">{c}</td></tr>)}
            </tbody>
          </table>
        </div>
        <ul className="mt-4 grid gap-1.5 text-sm text-muted">
          <li>Use lowercase words joined by dashes, like <span className="font-mono text-xs text-ink">black-cotton-hoodie</span>. Product names written only in Bangla get a short generated address, so type an English address for those.</li>
          <li>The old <span className="font-mono text-xs text-ink">/shop?cat=hoodies</span> style links already redirect to <span className="font-mono text-xs text-ink">/category/hoodies</span>.</li>
        </ul>
      </section>

      <section className={`${card} mt-4`}>
        <h2 className="font-display text-base font-semibold">Redirects</h2>
        <p className="mt-1 text-sm text-muted">When you rename the address of a product, category or page, the old address is sent to the new one automatically (a permanent redirect), so shared links and search rankings are not lost.</p>
        {error && <p className="mt-3 text-sm text-muted">Run supabase-0011-permalinks.sql in the Supabase SQL Editor, then refresh.</p>}
        <ul className="mt-4 divide-y divide-line text-sm">
          {!error && (reds ?? []).length === 0 && <li className="py-3 text-muted">No redirects yet. They appear here when you rename an address.</li>}
          {(reds ?? []).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3">
              <span className="min-w-0 break-all font-mono text-xs">{r.from_path} <span className="text-muted">to</span> {r.to_path}</span>
              <form action={deleteRedirect}><input type="hidden" name="id" value={r.id} /><button className="shrink-0 text-xs text-red-600 underline">Remove</button></form>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${card} mt-4`}>
        <h2 className="font-display text-base font-semibold">Search engine checklist</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          <li>Sitemap: <a href={`${SITE_URL}/sitemap.xml`} target="_blank" className="font-mono text-xs underline">{SITE_URL}/sitemap.xml</a>. Submit it in Google Search Console.</li>
          <li>Robots file: <a href={`${SITE_URL}/robots.txt`} target="_blank" className="font-mono text-xs underline">{SITE_URL}/robots.txt</a>. Private pages such as checkout and admin are already blocked.</li>
          <li>Add your Search Console code and analytics IDs under Settings, Tracking.</li>
          <li>Fill the search title and description of every product. Use Search listings to write them with AI in one click.</li>
          <li>Make sure <span className="font-mono text-xs">NEXT_PUBLIC_SITE_URL</span> is your real domain (now: <span className="font-mono text-xs">{SITE_URL}</span>).</li>
        </ul>
      </section>
    </>
  );
}
