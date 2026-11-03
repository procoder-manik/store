import Link from "next/link";
import { notFound } from "next/navigation";
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
  const { data: c } = await supabase.from("coupons").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();
  const used = Number(c.used_count);

  return (
    <>
      <Link href="/admin/coupons" className="text-sm text-muted hover:underline">All coupons</Link>
      <h1 className="mt-2 font-display text-2xl font-semibold">Edit {c.code as string}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Change this coupon&apos;s discount and rules. The code stays the same so links and the Offers page keep working.{used > 0 ? ` Used ${used} time${used === 1 ? "" : "s"} so far.` : ""}</p>

      <form action={updateCoupon} className="mt-6 grid max-w-xl gap-4">
        <input type="hidden" name="id" value={c.id as string} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>Discount type
            <select name="type" defaultValue={c.type as string} className={input}><option value="percent">Percent off</option><option value="fixed">Fixed amount off</option></select>
          </label>
          <label className={label}>Value <span className="font-normal">(percent, or ৳ amount)</span>
            <input name="value" type="number" min={1} step="0.01" required defaultValue={Number(c.value)} className={input} />
          </label>
        </div>

        <label className={label}>Minimum order to use it <span className="font-normal">(optional)</span>
          <input name="min_subtotal" type="number" min={0} step="0.01" defaultValue={Number(c.min_subtotal) || ""} placeholder="None" className={input} />
        </label>

        <label className={label}>How many times it can be used in total <span className="font-normal">(optional)</span>
          <input name="max_uses" type="number" min={Math.max(1, used)} step={1} defaultValue={(c.max_uses as number | null) ?? ""} placeholder="No limit" className={input} />
          {used > 0 && <span className="text-[11px] font-normal text-muted">Already used {used} time{used === 1 ? "" : "s"}, so the limit cannot go below {used}.</span>}
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>Starts on <span className="font-normal">(optional)</span>
            <input name="starts_at" type="date" defaultValue={asDate(c.starts_at)} className={input} />
          </label>
          <label className={label}>Expires on <span className="font-normal">(optional)</span>
            <input name="ends_at" type="date" defaultValue={asDate(c.ends_at)} className={input} />
          </label>
        </div>

        <div className="flex gap-2">
          <button className="rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink">Save changes</button>
          <Link href="/admin/coupons" className="rounded-pill border border-line px-6 py-2.5 text-sm font-medium hover:bg-paper">Cancel</Link>
        </div>
      </form>
    </>
  );
}
