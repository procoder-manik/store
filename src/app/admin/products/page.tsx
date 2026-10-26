import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/config";
import { imageUrl } from "@/lib/admin";

export default async function Products() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, status, base_price, tags, product_variants(stock), product_images(path, sort)")
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">Add product</Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr><th className="p-3 font-medium">Product</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Price</th><th className="p-3 font-medium">Stock</th></tr>
          </thead>
          <tbody>
            {(data ?? []).length === 0 && <tr><td colSpan={4} className="p-6 text-muted">No products yet. Add your first product to start.</td></tr>}
            {(data ?? []).map((p) => {
              const stock = (p.product_variants as { stock: number }[]).reduce((n, v) => n + v.stock, 0);
              const imgs = (p.product_images as { path: string; sort: number }[]).sort((a, b) => a.sort - b.sort);
              return (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="p-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 font-medium hover:underline">
                      {imgs[0] ? <img src={imageUrl(imgs[0].path)} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 rounded-lg bg-paper" />}
                      {p.name}
                    </Link>
                  </td>
                  <td className="p-3 capitalize">{p.status}</td>
                  <td className="p-3">{formatPrice(Number(p.base_price))}</td>
                  <td className={`p-3 ${stock === 0 ? "text-red-600" : ""}`}>{stock}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
