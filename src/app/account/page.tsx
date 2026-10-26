import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/config";
import { SignOutButton } from "@/components/SignOutButton";
import { addAddress, deleteAddress, saveProfile, setDefaultAddress } from "./actions";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm";
const card = "rounded-2xl border border-line bg-surface p-5";
const btn = "rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink";

export default async function Account() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");
  const [{ data: profile }, { data: orders }, { data: addrs }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    supabase.from("orders").select("id, order_no, status, total, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at"),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Hello, {profile?.full_name?.split(" ")[0] ?? "there"}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Your orders</h2>
        <div className={`${card} mt-3 divide-y divide-line p-0`}>
          {(orders ?? []).length === 0 && <p className="p-5 text-sm text-muted">No orders yet. <Link href="/shop" className="underline">Start shopping</Link>.</p>}
          {(orders ?? []).map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-3 p-4 text-sm hover:bg-paper">
              <span><span className="font-medium">Order #{o.order_no}</span><span className="block text-xs text-muted">{new Date(o.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</span></span>
              <span className="text-right"><span className="font-medium">{formatPrice(Number(o.total))}</span><span className="block text-xs capitalize text-muted">{o.status}</span></span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="font-display text-xl font-semibold">Saved addresses</h2>
          <div className="mt-3 grid gap-3">
            {(addrs ?? []).map((a) => (
              <div key={a.id} className={card}>
                <p className="text-sm font-medium">{a.label || a.name} {a.is_default && <span className="ml-1 rounded-full bg-paper px-2 py-0.5 text-xs font-normal text-muted">Default</span>}</p>
                <p className="mt-1 text-sm text-muted">{a.name}, {a.phone}<br />{a.address}, {a.district}</p>
                <div className="mt-3 flex gap-4 text-xs">
                  {!a.is_default && <form action={setDefaultAddress}><input type="hidden" name="id" value={a.id} /><button className="underline">Make default</button></form>}
                  <form action={deleteAddress}><input type="hidden" name="id" value={a.id} /><button className="text-red-600 underline">Delete</button></form>
                </div>
              </div>
            ))}
            <form action={addAddress} className={`${card} grid gap-3`}>
              <p className="text-sm font-medium">Add an address</p>
              <input name="label" placeholder="Label, like Home" maxLength={30} className={input} />
              <input name="name" placeholder="Receiver name" required className={input} />
              <input name="phone" placeholder="Mobile number" required inputMode="tel" className={input} />
              <input name="district" placeholder="District" required className={input} />
              <textarea name="address" placeholder="Full address" required rows={2} className={input} />
              <button className={`${btn} w-fit`}>Save address</button>
            </form>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">Profile</h2>
          <form action={saveProfile} className={`${card} mt-3 grid gap-3`}>
            <input name="name" defaultValue={profile?.full_name ?? ""} placeholder="Full name" required className={input} />
            <input name="phone" defaultValue={profile?.phone ?? ""} placeholder="Mobile number" inputMode="tel" className={input} />
            <button className={`${btn} w-fit`}>Save profile</button>
          </form>
        </section>
      </div>
    </main>
  );
}
