import { createClient } from "@/lib/supabase/server";
import { addBlock, removeBlock } from "./actions";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";

export default async function Fraud() {
  const supabase = await createClient();
  const { data } = await supabase.from("fraud_blacklist").select("*").order("created_at", { ascending: false });
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Fraud protection</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Blocked phone numbers, IP addresses and emails cannot place orders. The store also stops a phone number after 3 orders in 24 hours and an IP address after 8 orders in an hour. Orders from risky customers show a higher risk score in the orders list.</p>
      <form action={addBlock} className="mt-5 grid max-w-3xl gap-3 md:grid-cols-[140px_1fr_1fr_auto]">
        <select name="kind" className={input}><option value="phone">Phone</option><option value="ip">IP address</option><option value="email">Email</option></select>
        <input name="value" placeholder="Value to block" required className={input} />
        <input name="reason" placeholder="Reason (optional)" maxLength={200} className={input} />
        <button className="rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">Block</button>
      </form>
      <ul className="mt-6 max-w-3xl divide-y divide-line rounded-xl border border-line bg-surface">
        {(data ?? []).length === 0 && <li className="p-4 text-sm text-muted">Nothing blocked yet.</li>}
        {(data ?? []).map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-3 p-4 text-sm">
            <span><span className="mr-2 rounded-pill bg-paper px-2 py-0.5 text-xs capitalize text-muted">{b.kind}</span>{b.value}{b.reason && <span className="block text-xs text-muted">{b.reason}</span>}</span>
            <form action={removeBlock}><input type="hidden" name="id" value={b.id} /><button className="text-xs text-red-600 underline">Unblock</button></form>
          </li>
        ))}
      </ul>
    </>
  );
}
