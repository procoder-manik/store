import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import { QuickEdit } from "@/components/admin/QuickEdit";
import { imageUrl } from "@/lib/admin";
import { formatPrice } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import { copyProduct, deleteProduct, setProductStatus } from "./quick-actions";

const tab = "rounded-pill border px-3 py-1.5 text-sm transition";
const STATUSES = ["active", "draft", "archived"];

export default async function Products({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q = "" } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("products").select("id, slug, name, status, base_price, tags, offer_ends_at, product_variants(stock), product_images(path, sort)").order("created_at", { ascending: false });
  if (status && STATUSES.includes(status)) query = query.eq("status", status);
  const term = q.trim().replace(/[%,()]/g, "");
  if (term) query = query.ilike("name", `%${term}%`);
  const first = await query;
  // offer_ends_at only exists once the latest database file has been run.
  const { data } = first.error ? await supabase.from("products").select("id, slug, name, status, base_price, tags, product_variants(stock), product_images(path, sort)").order("created_at", { ascending: false }) : first;
  const rows = (data ?? []) as unknown as { id: string; slug: string; name: string; status: string; base_price: number | string; offer_ends_at?: string | null; product_variants: { stock: number }[]; product_images: { path: string; sort: number }[] }[];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new" className="rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">Add product</Link>
      </div>
      <p className="mt-1 text-sm text-muted">Open a product for the full form, or use Quick edit to change the name, price and status right here.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {["all", ...STATUSES].map((s) => (
          <Link key={s} href={s === "all" ? "/admin/products" : `/admin/products?status=${s}`} className={`${tab} ${(status ?? "all") === s ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}>{s === "all" ? "All" : s === "active" ? "Live" : s === "draft" ? "Drafts" : "Archived"}</Link>
        ))}
        <form className="ml-auto flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search by name" className="w-56 rounded-pill border border-line bg-surface px-4 py-2 text-sm" />
          <button className="rounded-pill border border-line px-4 py-2 text-sm hover:bg-surface">Search</button>
        </form>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr><th className="p-3 font-medium">Product</th><th className="p-3 font-medium">Status</th><th className="p-3 text-right font-medium">Price</th><th className="p-3 font-medium">Stock</th><th className="p-3 text-right font-medium">Actions</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted">No products here. Add your first product to start.</td></tr>}
            {rows.map((p) => {
              const stock = p.product_variants.reduce((n, v) => n + v.stock, 0);
              const imgs = [...p.product_images].sort((a, b) => a.sort - b.sort);
              const live = p.status === "active";
              return (
                <tr key={p.id} className="border-b border-line align-top last:border-0">
                  <td className="p-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-medium hover:underline">
                      {imgs[0] ? <img src={imageUrl(imgs[0].path)} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <span className="h-11 w-11 rounded-lg bg-paper" />}
                      <span>{p.name}{p.offer_ends_at && new Date(p.offer_ends_at) > new Date() && <span className="ml-2 rounded-pill bg-red-500/10 px-2 py-0.5 text-xs font-normal text-red-600">Offer running</span>}</span>
                    </Link>
                    <div className="mt-1 pl-14"><QuickEdit id={p.id} name={p.name} price={Number(p.base_price)} status={p.status} /></div>
                  </td>
                  <td className="p-3"><span className={`rounded-pill px-2.5 py-0.5 text-xs font-medium ${live ? "bg-emerald-500/15 text-emerald-700" : p.status === "draft" ? "bg-amber-500/15 text-amber-700" : "bg-paper text-muted"}`}>{live ? "Live" : p.status === "draft" ? "Draft" : "Archived"}</span></td>
                  <td className="p-3 text-right tabular-nums">{formatPrice(Number(p.base_price))}</td>
                  <td className={`p-3 ${stock === 0 ? "font-medium text-red-600" : ""}`}>{stock}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center justify-end gap-3 text-xs">
                      <form action={setProductStatus}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value={live ? "draft" : "active"} /><button className="underline">{live ? "Hide" : "Make live"}</button></form>
                      <form action={copyProduct}><input type="hidden" name="id" value={p.id} /><button className="inline-flex items-center gap-1 underline"><Copy size={11} /> Copy</button></form>
                      {live && <a href={`/product/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 underline">View <ExternalLink size={10} /></a>}
                      {p.status !== "archived" && <form action={deleteProduct}><input type="hidden" name="id" value={p.id} /><button className="text-red-600 underline">Archive</button></form>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
