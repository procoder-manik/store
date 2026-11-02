"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { InfoTip } from "./InfoTip";
import { SslKeys, type SslView } from "./SslKeys";
import { savePayments } from "@/app/admin/payments/actions";
import { CATALOG, type CatalogItem, type MethodCfg, type MethodGroup, type AdvanceCfg, type MethodId, type PaymentsSettings } from "@/lib/payments";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";
const GROUPS: { id: MethodGroup; title: string; note: string }[] = [
  { id: "cash", title: "Cash", note: "" },
  { id: "mobile", title: "Mobile wallets (customer sends money, you check it)", note: "Customers see your number, send the money, then type their number and the transaction ID. You check it in your wallet app and mark the order paid." },
  { id: "bank", title: "Bank", note: "" },
  { id: "gateway", title: "Payment gateways (pay on a secure page)", note: "Gateways take payment automatically. SSLCommerz works today: add your store ID and password below, and it takes bKash, Nagad, Rocket and cards on one secure page. The others are listed so you can see what is coming." },
];

function Switch({ on, onChange, disabled, name }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; name: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={`${name} on or off`} disabled={disabled} onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${on ? "bg-accent" : "bg-line"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function PaymentsEditor({ initial, sslReady, ssl, products }: { initial: PaymentsSettings; sslReady: boolean; ssl: SslView; products: { id: string; name: string; image: string; preorder: boolean }[] }) {
  const [find, setFind] = useState("");
  const [m, setM] = useState(initial.methods);
  const [adv, setAdv] = useState<AdvanceCfg>(initial.advance);
  const setA = (p: Partial<AdvanceCfg>) => { setMsg(null); setAdv((x) => ({ ...x, ...p })); };
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (id: MethodId, p: Partial<MethodCfg>) => { setMsg(null); setM((x) => ({ ...x, [id]: { ...x[id], ...p } })); };

  function card(c: CatalogItem) {
    const cfg = m[c.id];
    const listedOnly = !c.ready;
    return (
      <div key={c.id} className={`grid gap-3 rounded-xl border border-line bg-surface p-4 ${listedOnly ? "opacity-70" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 font-medium">{c.name}
              {listedOnly && <span className="rounded-pill bg-paper px-2 py-0.5 text-[11px] font-normal text-muted">Not connected yet</span>}
              {c.id === "sslcommerz" && <span className={`rounded-pill px-2 py-0.5 text-[11px] font-normal ${sslReady ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-800"}`}>{sslReady ? (ssl.live ? "Connected, live" : "Connected, sandbox") : "Keys needed"}</span>}
            </p>
            <p className="mt-0.5 text-xs text-muted">{c.blurb}</p>
          </div>
          <Switch name={c.name} on={cfg.enabled && c.ready} disabled={listedOnly} onChange={(v) => set(c.id, { enabled: v })} />
        </div>

        {c.manual && c.group === "mobile" && (
          <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
            <div><label className={label}>{c.name} number customers send money to</label><input className={input} inputMode="tel" placeholder="01712345678" value={cfg.account} onChange={(e) => set(c.id, { account: e.target.value })} /></div>
            <div><label className={label}>Account type<InfoTip text="Personal, Agent or Merchant, as set up in the wallet app. Customers see it so they use the right Send Money option." /></label><select className={input} value={cfg.accountType} onChange={(e) => set(c.id, { accountType: e.target.value as MethodCfg["accountType"] })}><option value="">Not shown</option><option value="personal">Personal</option><option value="agent">Agent</option><option value="merchant">Merchant</option></select></div>
          </div>
        )}
        {c.manual && c.group === "bank" && (
          <div><label className={label}>Bank details customers see (bank, account name, account number, branch)</label><textarea className={input} rows={4} maxLength={400} placeholder={"Bank: \nAccount name: \nAccount number: \nBranch: "} value={cfg.account} onChange={(e) => set(c.id, { account: e.target.value })} /></div>
        )}
        {c.manual && <div><label className={label}>Extra words for the customer (optional)<InfoTip text="A short instruction shown at checkout, like Use Send Money, not Payment. It prevents wrong payments." /></label><input className={input} maxLength={200} placeholder={c.group === "mobile" ? "Use Send Money, not Payment." : "Use your order number as the reference."} value={cfg.instructions} onChange={(e) => set(c.id, { instructions: e.target.value })} /></div>}
        {c.id === "sslcommerz" && <SslKeys ssl={ssl} />}
      </div>
    );
  }

  const rule = (name: string, text: string, on: boolean, change: (v: boolean) => void) => (
    <div className="flex items-start justify-between gap-4 border-t border-line pt-3 first:border-0 first:pt-0">
      <div><p className="text-sm font-medium">{name}</p><p className="mt-0.5 text-xs text-muted">{text}</p></div>
      <Switch name={name} on={on} onChange={change} />
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); setMsg(null); start(async () => { const r = await savePayments({ methods: m, advance: adv }); setMsg(r.ok ? { ok: true, text: "Saved. Checkout is updated." } : { ok: false, text: r.error ?? "Could not save." }); }); }} className="grid max-w-3xl gap-8">
      <section className="grid gap-3">
        <div><h2 className="font-display text-base font-semibold">Money before delivery<InfoTip text="For cash on delivery orders. The customer sends the advance by a mobile wallet or bank, then enters the transaction ID. You check it on the order page." /></h2><p className="mt-1 text-xs text-muted">Needs at least one wallet or bank turned on below. The delivery charges are set on the <Link href="/admin/shipping" className="underline">Shipping</Link> page. Landing page order forms stay plain cash on delivery.</p></div>
        <div className="grid gap-3 rounded-xl border border-line bg-surface p-4">
          {rule("Delivery charge first", "The customer pays only the delivery charge now, and the rest to the rider.", adv.deliveryFirst, (v) => setA({ deliveryFirst: v }))}
          {rule("Offer partial payment", "A tick box at checkout. If the customer ticks it, they also pay this percentage of the products now. It is their choice.", adv.partialEnabled, (v) => setA({ partialEnabled: v }))}
          {adv.partialEnabled && (
            <div className="grid gap-3 border-t border-line pt-3">
              <div><label className={label} htmlFor="advance-percent">Percentage paid first</label><input id="advance-percent" className={`${input} max-w-32`} type="number" min={5} max={95} value={adv.percent} onChange={(e) => setA({ percent: Number(e.target.value) })} /></div>
            </div>
          )}
          {rule("Required for all pre-orders", "An order with a pre-order item must pay the delivery charge and the percentage together.", adv.preorderPartial, (v) => setA({ preorderPartial: v }))}
          <div className="grid gap-2 rounded-xl border border-line p-3">
            <div>
              <p className="text-sm font-medium">Products that must pay the percentage first</p>
              <p className="text-xs text-muted">An order with any product you tick must pay the delivery charge and the percentage together. All other products keep it optional. {adv.requiredProducts.length} selected.</p>
            </div>
            <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Search products" aria-label="Search products" className={input} />
            <ul className="grid max-h-64 gap-1 overflow-y-auto pr-1">
              {[...products].sort((a, b) => Number(adv.requiredProducts.includes(b.id)) - Number(adv.requiredProducts.includes(a.id))).filter((p) => p.name.toLowerCase().includes(find.trim().toLowerCase())).map((p) => (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg p-1.5 text-sm hover:bg-paper">
                    <input type="checkbox" checked={adv.requiredProducts.includes(p.id)} onChange={(e) => setA({ requiredProducts: e.target.checked ? [...adv.requiredProducts, p.id] : adv.requiredProducts.filter((x) => x !== p.id) })} />
                    {p.image ? <img src={p.image} alt="" className="h-8 w-8 shrink-0 rounded object-contain" /> : <span className="h-8 w-8 shrink-0 rounded bg-paper" />}
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    {p.preorder && <span className="shrink-0 text-[11px] text-muted">Pre-order</span>}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      {GROUPS.map((g) => (
        <section key={g.id} className="grid gap-3">
          <div><h2 className="font-display text-base font-semibold">{g.title}<InfoTip text={g.note || (g.id === "cash" ? "The customer pays the delivery rider in cash. Many customers in Bangladesh prefer it, so keep it on unless you want only prepaid orders." : "Customers send money to your bank account and give you the transfer reference. You check your bank before sending the order.")} /></h2>{g.note && <p className="mt-1 text-xs text-muted">{g.note}</p>}</div>
          {CATALOG.filter((c) => c.group === g.id).map(card)}
        </section>
      ))}
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
      <button disabled={pending} className="w-fit rounded-pill bg-accent px-7 py-3 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Saving..." : "Save payment methods"}</button>
    </form>
  );
}
