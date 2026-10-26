import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/config";
import { dismissCart, sendReminder } from "./actions";

type Item = { name: string; color: string; size: string; qty: number };

export default async function Abandoned() {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from("abandoned_carts").select("*").eq("recovered", false).lt("updated_at", cutoff).order("updated_at", { ascending: false }).limit(100);
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Abandoned carts</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Visitors who typed their phone or email at checkout but did not order within 30 minutes. Call them, or send a reminder email with a link that rebuilds their cart.</p>
      {error && <p className="mt-4 text-sm text-muted">Run supabase-0006-crm-email.sql in the Supabase SQL Editor, then refresh.</p>}
      <ul className="mt-6 grid max-w-3xl gap-3">
        {!error && (data ?? []).length === 0 && <li className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">No abandoned carts right now.</li>}
        {(data ?? []).map((c) => (
          <li key={c.id} className="rounded-xl border border-line bg-surface p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <span><span className="font-medium">{c.name || "Unknown"}</span><span className="block text-xs text-muted">{c.phone && <a href={`tel:${c.phone}`} className="underline">{c.phone}</a>}{c.phone && c.email ? ", " : ""}{c.email}</span></span>
              <span className="text-right"><span className="font-medium">{formatPrice(Number(c.total))}</span><span className="block text-xs text-muted">{new Date(c.updated_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span></span>
            </div>
            <p className="mt-2 text-muted">{(c.items as Item[]).map((i) => `${i.name} x ${i.qty}`).join(", ")}</p>
            <div className="mt-3 flex gap-4 text-xs">
              {c.email && <form action={sendReminder}><input type="hidden" name="id" value={c.id} /><button className="font-medium text-accent underline">{c.reminded_at ? "Send another reminder" : "Send reminder email"}</button></form>}
              <form action={dismissCart}><input type="hidden" name="id" value={c.id} /><button className="underline">Dismiss</button></form>
              {c.reminded_at && <span className="text-muted">Reminded {new Date(c.reminded_at).toLocaleDateString("en-GB")}</span>}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
