import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { updateCoupon } from "../actions";

export const metadata = { title: "Edit coupon" };

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "grid gap-1 text-xs font-medium text-muted";
const asDate = (v: unknown) => (v ? new Date(v as string).toISOString().slice(0, 10) : "");

export default async function EditCoupon({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: c }, { products, categories }] = await Promise.all([supabase.from("coupons").select("*").eq("id", id).maybeSingle(), getCatalog()]);
  if (!c) notFound();
  const used = Number(c.used_count);
  const pickedProducts = new Set((c.product_ids as string[] | null) ?? []);
  const pickedCategories = new Set((c.category_ids as string[] | null) ?? []);

  return (
    <>
      <Link href="/admin/coupons" className="text-sm text-muted hover:underline">All coupons</Link>
      <h1 className="mt-2 font-display text-2xl font-semibold">Edit {c.code as string}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Change this coupon&apos;s discount and rules. The code stays the same so links and the Offers page keep working.{used > 0 ? ` Used ${used} time${used === 1 ? "" : "s"} so far.` : ""}</p>

      <form action={updateCoupon} className="mt-6 grid max-w-2xl gap-5">
        <input type="hidden" name="id" value={c.id as string} />

        <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold">Discount</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={label}>Discount type
              <select name="type" defaultValue={c.type as string} className={input}><option value="percent">Percent off</option><option value="fixed">Fixed amount off</option></select>
            </label>
            <label className={label}>Value <span className="font-normal">(percent, or ৳ amount — set 0 for free delivery only)</span>
              <input name="value" type="number" min={0} step="0.01" defaultValue={Number(c.value)} className={input} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="free_shipping" defaultChecked={!!c.free_shipping} className="h-4 w-4" /> Free delivery with this coupon</label>
        </section>

        <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold">When it works</h2>
          <label className={label}>Minimum order to use it <span className="font-normal">(optional)</span>
            <input name="min_subtotal" type="number" min={0} step="0.01" defaultValue={Number(c.min_subtotal) || ""} placeholder="None" className={input} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={label}>Starts on <span className="font-normal">(optional)</span><input name="starts_at" type="date" defaultValue={asDate(c.starts_at)} className={input} /></label>
            <label className={label}>Expires on <span className="font-normal">(optional)</span><input name="ends_at" type="date" defaultValue={asDate(c.ends_at)} className={input} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="first_order_only" defaultChecked={!!c.first_order_only} className="h-4 w-4" /> Only on a customer&apos;s first order</label>
        </section>

        <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold">How many times</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={label}>Total uses across everyone <span className="font-normal">(optional)</span>
              <input name="max_uses" type="number" min={Math.max(1, used)} step={1} defaultValue={(c.max_uses as number | null) ?? ""} placeholder="No limit" className={input} />
              {used > 0 && <span className="text-[11px] font-normal text-muted">Already used {used} time{used === 1 ? "" : "s"}, so this cannot go below {used}.</span>}
            </label>
            <label className={label}>Uses per customer <span className="font-normal">(optional)</span>
              <input name="per_customer_limit" type="number" min={1} step={1} defaultValue={(c.per_customer_limit as number | null) ?? ""} placeholder="No limit" className={input} />
              <span className="text-[11px] font-normal text-muted">Matched by phone, so 1 means each person can use it once.</span>
            </label>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold">Limit to certain items <span className="text-xs font-normal text-muted">(optional)</span></h2>
          <p className="text-xs text-muted">Leave everything unticked and the coupon works on any order. Tick products or categories and it only works when the cart holds at least one of them.</p>
          {categories.length > 0 && (
            <div>
              <p className={label}>Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs"><input type="checkbox" name="category_ids" value={cat.id} defaultChecked={pickedCategories.has(cat.id)} className="h-3.5 w-3.5" /> {cat.label}</label>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className={label}>Products</p>
            <div className="max-h-60 overflow-y-auto rounded-xl border border-line p-2">
              {products.length === 0 ? <p className="p-2 text-xs text-muted">No products yet.</p> : products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-paper"><input type="checkbox" name="product_ids" value={p.id} defaultChecked={pickedProducts.has(p.id)} className="h-4 w-4" /> <span className="truncate">{p.name}</span></label>
              ))}
            </div>
          </div>
        </section>

        <div className="flex gap-2">
          <button className="rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink">Save changes</button>
          <Link href="/admin/coupons" className="rounded-pill border border-line px-6 py-2.5 text-sm font-medium hover:bg-paper">Cancel</Link>
        </div>
      </form>
    </>
  );
}
