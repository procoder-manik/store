import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { createCoupon, deleteCoupon, toggleCoupon, toggleOfferCoupon } from "./actions";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";

export default async function Coupons() {
  const supabase = await createClient();
  const [{ data }, { data: off }] = await Promise.all([supabase.from("coupons").select("*").order("code"), supabase.from("site_settings").select("value").eq("key", "offers").maybeSingle()]);
  const shown = ((off?.value ?? {}) as { coupons?: string[] }).coupons ?? [];
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Coupons</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Coupons are private until you choose &quot;Show on Offers page&quot;. Then customers can claim them on <Link href="/offers" className="underline">your Offers page</Link>, and the code is applied at checkout by itself.</p>
      <form action={createCoupon} className="mt-5 grid max-w-4xl gap-3 md:grid-cols-3">
        <input name="code" placeholder="Code, like EID10" required maxLength={30} className={input} />
        <select name="type" className={input}><option value="percent">Percent off</option><option value="fixed">Fixed amount off</option></select>
        <input name="value" type="number" min={0} step="0.01" placeholder="Value (0 for free delivery only)" required className={input} />
        <input name="min_subtotal" type="number" min={0} step="0.01" placeholder="Minimum order (optional)" className={input} />
        <input name="max_uses" type="number" min={1} step={1} placeholder="Max uses (optional)" className={input} />
        <label className="grid gap-1 text-xs text-muted">Starts on (optional)<input name="starts_at" type="date" className={input} /></label>
        <label className="grid gap-1 text-xs text-muted">Expires on (optional)<input name="ends_at" type="date" className={input} /></label>
        <input name="per_customer_limit" type="number" min={1} step={1} placeholder="Uses per customer (optional)" className={input} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="free_shipping" className="h-4 w-4" /> Free delivery</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="first_order_only" className="h-4 w-4" /> First order only</label>
        <p className="text-xs text-muted md:col-span-3">Add the coupon, then press Edit to limit it to certain products or categories.</p>
        <button className="rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink md:col-span-3 md:w-40">Add coupon</button>
      </form>
      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted"><tr><th className="p-3 font-medium">Code</th><th className="p-3 font-medium">Discount</th><th className="p-3 font-medium">Minimum</th><th className="p-3 font-medium">Used</th><th className="p-3 font-medium">Expires</th><th /></tr></thead>
          <tbody>
            {(data ?? []).length === 0 && <tr><td colSpan={6} className="p-6 text-muted">No coupons yet. Add one above.</td></tr>}
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className={`p-3 font-medium ${c.active ? "" : "text-muted line-through"}`}>{c.code}</td>
                <td className="p-3">{c.type === "percent" ? `${Number(c.value)}%` : `৳${Number(c.value)}`}</td>
                <td className="p-3">{Number(c.min_subtotal) > 0 ? `৳${Number(c.min_subtotal)}` : "None"}</td>
                <td className="p-3">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                <td className="p-3 text-muted">{c.ends_at ? new Date(c.ends_at).toLocaleDateString("en-GB") : "Never"}</td>
                <td className="flex flex-wrap gap-3 p-3 text-xs">
                  <Link href={`/admin/coupons/${c.id}`} className="font-medium underline">Edit</Link>
                  <form action={toggleOfferCoupon}><input type="hidden" name="code" value={c.code} /><button className={shown.includes(c.code) ? "font-semibold text-emerald-700 underline" : "underline"}>{shown.includes(c.code) ? "On Offers page" : "Show on Offers page"}</button></form>
                  <form action={toggleCoupon}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="active" value={String(c.active)} /><button className="underline">{c.active ? "Turn off" : "Turn on"}</button></form>
                  <form action={deleteCoupon}><input type="hidden" name="id" value={c.id} /><button className="text-red-600 underline">Delete</button></form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
