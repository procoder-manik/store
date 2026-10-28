import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Gift, MapPin, Package, User as UserIcon } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { ReferralCard } from "@/components/ReferralCard";
import { formatPrice } from "@/lib/config";
import { CREDIT, creditBalance } from "@/lib/credit";
import { statusColor, statusLabel } from "@/lib/order-status";
import { createClient } from "@/lib/supabase/server";
import { addAddress, deleteAddress, saveProfile, setDefaultAddress } from "./actions";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm";
const card = "rounded-2xl border border-line bg-surface p-5";
const btn = "rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink";
const h2 = "flex items-center gap-2 font-display text-xl font-semibold";

export default async function Account() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");
  const [{ data: profile }, { data: orders }, { data: addrs }, balance] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, referral_code").eq("id", user.id).maybeSingle(),
    supabase.from("orders").select("id, order_no, status, total, created_at, order_items(name_snapshot, qty)").order("created_at", { ascending: false }).limit(20),
    supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at"),
    creditBalance(user.id),
  ]);
  const { data: credits } = await supabase.from("credit_ledger").select("id, delta, kind, note, created_at").order("created_at", { ascending: false }).limit(8);
  const live = (orders ?? []).filter((o) => !["delivered", "cancelled", "returned"].includes(o.status as string));
  const past = (orders ?? []).filter((o) => ["delivered", "cancelled", "returned"].includes(o.status as string));
  const KINDS: Record<string, string> = { referral_reward: "Referral reward", redeem: "Used on an order", redeem_reversal: "Returned to you", refund_credit: "Refund", manual: "Added by the shop" };

  const row = (o: { id: string; order_no: number; status: string; total: number | string; created_at: string; order_items?: { name_snapshot: string; qty: number }[] }) => (
    <Link key={o.id} href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-3 p-4 text-sm transition hover:bg-paper">
      <span className="min-w-0">
        <span className="font-medium">Order #{o.order_no}</span>
        <span className="block truncate text-xs text-muted">{(o.order_items ?? []).map((i) => `${i.name_snapshot} x ${i.qty}`).join(", ") || new Date(o.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="font-medium tabular-nums">{formatPrice(Number(o.total))}</span>
        <span className="mt-0.5 flex items-center justify-end gap-1.5 text-xs text-muted"><span style={{ background: statusColor(o.status) }} className="h-2 w-2 rounded-full" />{statusLabel(o.status)}</span>
      </span>
    </Link>
  );

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Hello, {profile?.full_name?.split(" ")[0] ?? "there"}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className={card}><p className="text-xs text-muted">Store credit</p><p className="mt-1 font-display text-2xl font-semibold text-accent">{formatPrice(balance)}</p><p className="mt-1 text-xs text-muted">{balance >= CREDIT.minBalanceToUse ? "Taken off your next order" : `Usable from ${formatPrice(CREDIT.minBalanceToUse)}`}</p></div>
        <div className={card}><p className="text-xs text-muted">Orders on the way</p><p className="mt-1 font-display text-2xl font-semibold">{live.length}</p><p className="mt-1 text-xs text-muted">{live.length > 0 ? statusLabel(live[0].status as string) : "Nothing in transit"}</p></div>
        <div className={card}><p className="text-xs text-muted">Orders placed</p><p className="mt-1 font-display text-2xl font-semibold">{(orders ?? []).length}</p><p className="mt-1 text-xs text-muted">Thank you for shopping with us</p></div>
      </div>

      {live.length > 0 && (
        <section className="mt-8">
          <h2 className={h2}><Package size={18} /> On the way</h2>
          <div className={`${card} mt-3 divide-y divide-line p-0`}>{live.map(row)}</div>
        </section>
      )}

      <section className="mt-8">
        <h2 className={h2}><Gift size={18} /> Refer a friend</h2>
        <p className="mt-1 text-sm text-muted">Share your link. When a friend orders and receives it, you get {CREDIT.rewardPercent}% of their order as store credit, up to {formatPrice(CREDIT.rewardMax)}. Credit covers up to {Math.round(CREDIT.maxShareOfOrder * 100)}% of your next order.</p>
        <div className="mt-3"><ReferralCard code={(profile?.referral_code as string) ?? ""} /></div>
        {(credits ?? []).length > 0 && (
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface text-sm">
            {(credits ?? []).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 p-3.5">
                <span>{KINDS[c.kind as string] ?? "Credit"}{c.note && <span className="block text-xs text-muted">{c.note}</span>}</span>
                <span className={`shrink-0 font-medium tabular-nums ${Number(c.delta) > 0 ? "text-emerald-700" : "text-muted"}`}>{Number(c.delta) > 0 ? "+" : ""}{formatPrice(Number(c.delta))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-8">
          <h2 className={h2}><Package size={18} /> Past orders</h2>
          <div className={`${card} mt-3 divide-y divide-line p-0`}>{past.map(row)}</div>
        </section>
      )}
      {(orders ?? []).length === 0 && <p className={`${card} mt-8 text-sm text-muted`}>No orders yet. <Link href="/shop" className="underline">Start shopping</Link>.</p>}

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className={h2}><MapPin size={18} /> Saved addresses</h2>
          <div className="mt-3 grid gap-3">
            {(addrs ?? []).map((a) => (
              <div key={a.id} className={card}>
                <p className="text-sm font-medium">{a.label || a.name} {a.is_default && <span className="ml-1 rounded-pill bg-paper px-2 py-0.5 text-xs font-normal text-muted">Default</span>}</p>
                <p className="mt-1 text-sm text-muted">{a.name}, {a.phone}<br />{a.address}, {a.district}</p>
                <div className="mt-3 flex gap-4 text-xs">
                  {!a.is_default && <form action={setDefaultAddress}><input type="hidden" name="id" value={a.id} /><button className="underline">Make default</button></form>}
                  <form action={deleteAddress}><input type="hidden" name="id" value={a.id} /><button className="text-red-600 underline">Delete</button></form>
                </div>
              </div>
            ))}
            <details className={card}>
              <summary className="cursor-pointer text-sm font-medium">Add an address</summary>
              <form action={addAddress} className="mt-4 grid gap-3">
                <input name="label" placeholder="Label, like Home" maxLength={30} className={input} />
                <input name="name" placeholder="Receiver name" required className={input} />
                <input name="phone" placeholder="Mobile number" required inputMode="tel" className={input} />
                <input name="district" placeholder="District" required className={input} />
                <textarea name="address" placeholder="Full address" required rows={2} className={input} />
                <button className={`${btn} w-fit`}>Save address</button>
              </form>
            </details>
          </div>
        </section>

        <section>
          <h2 className={h2}><UserIcon size={18} /> Your details</h2>
          <form action={saveProfile} className={`${card} mt-3 grid gap-3`}>
            <input name="name" defaultValue={profile?.full_name ?? ""} placeholder="Full name" required className={input} />
            <input name="phone" defaultValue={profile?.phone ?? ""} placeholder="Mobile number" inputMode="tel" className={input} />
            <button className={`${btn} w-fit`}>Save</button>
          </form>
          <p className="mt-3 text-xs text-muted">Need help with an order? <Link href="/contact" className="underline">Contact us</Link> or <Link href="/track" className="underline">track an order</Link>.</p>
        </section>
      </div>
    </main>
  );
}
