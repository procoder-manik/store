"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { ACCOUNT_TYPE_LABEL, advanceAmount, advancePlans, walletColor, type AdvancePlan, type PublicMethod } from "@/lib/payments";
import { formatPrice } from "@/lib/config";
import { useAdvance } from "./PaymentsProvider";

type Props = { methods: PublicMethod[]; value: string; onChange: (id: string) => void; amount?: number; shipping?: number; hasPreorder?: boolean };

/**
 * The payment choices at checkout. A manual method (bKash, Nagad, Rocket, Upay, bank) shows where to send the money
 * and asks for the sender number and transaction ID. Cash on delivery can also ask for money first: the delivery charge,
 * or a percentage plus the delivery charge, as set in Admin, Payment methods.
 * The form reads the plain fields `payer`, `trxId`, `plan` and `advanceMethod`. The server checks all of them again.
 */
export function PaymentPicker({ methods, value, onChange, amount, shipping, hasPreorder = false }: Props) {
  const cfg = useAdvance();
  const [copied, setCopied] = useState(false);
  const wallets = methods.filter((m) => m.manual);
  const plans = advancePlans(cfg, hasPreorder, wallets.length > 0);
  const plansKey = plans.join();
  const [plan, setPlan] = useState<AdvancePlan>(plans[0]);
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  useEffect(() => { setPlan((p) => (plansKey.split(",").includes(p) ? p : (plansKey.split(",")[0] as AdvancePlan))); }, [plansKey]);

  // Until the server has priced the order, no advance amount is shown.
  const priced = shipping !== undefined && amount !== undefined;
  const total = amount ?? 0;
  const cod = value === "cod";
  const due = (p: AdvancePlan) => advanceAmount(p, cfg, { total, shipping: shipping ?? 0 });
  const advance = cod && priced ? due(plan) : 0;
  const picked = methods.find((m) => m.id === value);
  const payWith = cod ? (advance > 0 ? wallets.find((w) => w.id === walletId) ?? wallets[0] : undefined) : picked?.manual ? picked : undefined;
  const payAmount = cod ? advance : amount;

  const row = (on: boolean) => `flex cursor-pointer items-center gap-3 rounded-xl border bg-paper p-3 text-sm text-ink ${on ? "border-accent" : "border-line"}`;
  const field = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink";
  const panel = "rounded-xl border border-line bg-paper p-3.5 text-sm text-ink";
  const muted = "text-muted";

  if (methods.length === 0) return <p className="rounded-xl border border-line p-3 text-sm text-muted">No payment method is open right now. Please call us to place your order.</p>;

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* the number is visible, they can copy it by hand */ }
  }

  const planText: Record<AdvancePlan, string> = {
    none: "Pay everything on delivery",
    delivery: "Pay the delivery charge now",
    partial: `Pay ${cfg.percent}% plus delivery now`,
  };

  return (
    <div className="grid gap-2">
      {methods.map((m) => (
        <label key={m.id} className={row(m.id === value)} style={m.id === value && walletColor(m.id) ? { background: walletColor(m.id).bg, borderColor: walletColor(m.id).bg, color: walletColor(m.id).ink } : undefined}>
          <input type="radio" name="pay" checked={m.id === value} onChange={() => onChange(m.id)} style={m.id === value && walletColor(m.id) ? { accentColor: walletColor(m.id).ink } : undefined} />
          <span>{walletColor(m.id) ? <span style={{ background: walletColor(m.id).bg, color: walletColor(m.id).ink }} className="inline-block rounded-md px-2.5 py-1 text-[13px] font-bold tracking-[-0.01em]">{m.name}</span> : m.name}{m.id === "cod" && <span className={`block text-xs ${muted}`}>{plans[0] === "none" ? "Check it, then pay the rider in cash." : "Pay an advance now, the rest to the rider in cash."}</span>}{m.id === "sslcommerz" && <span className={`block text-xs ${muted}`}>Cards, bKash, Nagad, Rocket and banks on a secure page.</span>}</span>
        </label>
      ))}

      <input type="hidden" name="plan" value={cod ? plan : ""} />
      <input type="hidden" name="advanceMethod" value={cod && advance > 0 ? payWith?.id ?? "" : ""} />

      {cod && (plans.length > 1 || advance > 0) && (
        <div className={`grid gap-2 ${panel}`}>
          {hasPreorder && <p className={`text-xs ${muted}`}>This order has a pre-order item, so an advance is needed to reserve it.</p>}
          {plans.map((p) => (
            <label key={p} className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-surface p-2.5 ${plan === p ? "border-accent" : "border-line"}`}>
              <span className="flex items-center gap-2.5"><input type="radio" name="advance-plan" checked={plan === p} onChange={() => setPlan(p)} /><span>{planText[p]}</span></span>
              <span className="shrink-0 font-semibold tabular-nums">{priced ? formatPrice(due(p)) : "..."}</span>
            </label>
          ))}
          {advance > 0 && <p className={`text-xs ${muted}`}>Pay now <span className="font-semibold text-ink">{formatPrice(advance)}</span>. Pay on delivery <span className="font-semibold text-ink">{formatPrice(Math.max(0, total - advance))}</span>.</p>}
          {advance > 0 && wallets.length > 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {wallets.map((w) => <button key={w.id} type="button" aria-pressed={w.id === payWith?.id} onClick={() => setWalletId(w.id)} className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${w.id === payWith?.id ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface"}`}>{w.name}</button>)}
            </div>
          )}
        </div>
      )}

      {payWith && (
        <div className={`grid gap-3 ${panel}`}>
          <div>
            <p className="font-medium">How to pay with {payWith.name}</p>
            {payWith.id === "bank" ? (
              <pre className={`mt-1.5 whitespace-pre-wrap font-body text-sm ${muted}`}>{payWith.account}</pre>
            ) : (
              <p className={`mt-1.5 ${muted}`}>
                Send {payAmount ? <span className="font-semibold text-ink">{formatPrice(payAmount)}</span> : "the total"} to{" "}
                <button type="button" onClick={() => copy(payWith.account)} className="inline-flex items-center gap-1 rounded-md bg-ink/5 px-1.5 py-0.5 font-semibold text-ink" aria-label={`Copy ${payWith.name} number`}>
                  {payWith.account} {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
                {payWith.accountType && <> ({ACCOUNT_TYPE_LABEL[payWith.accountType]})</>}.
              </p>
            )}
            {payWith.instructions && <p className={`mt-1.5 text-xs ${muted}`}>{payWith.instructions}</p>}
            <p className={`mt-1.5 text-xs ${muted}`}>Then fill in the two boxes below. We check the payment before we send your order.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="payer" className={`mb-1 block text-xs font-medium ${muted}`}>{payWith.id === "bank" ? "Account name or number you sent from (optional)" : `${payWith.name} number you sent from`}</label>
              <input key={`payer-${payWith.id}`} id="payer" name="payer" required={payWith.id !== "bank"} inputMode={payWith.id === "bank" ? "text" : "tel"} placeholder={payWith.id === "bank" ? "" : "01712345678"} maxLength={40} className={field} />
            </div>
            <div>
              <label htmlFor="trxId" className={`mb-1 block text-xs font-medium ${muted}`}>Transaction ID</label>
              <input key={`trx-${payWith.id}`} id="trxId" name="trxId" required minLength={6} maxLength={24} autoCapitalize="characters" autoComplete="off" placeholder="8N7A6D5EE7" className={`${field} uppercase`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
