"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { ACCOUNT_TYPE_LABEL, type PublicMethod } from "@/lib/payments";
import { formatPrice } from "@/lib/config";

/**
 * The payment choices at checkout. When a manual method (bKash, Nagad, Rocket, Upay, bank) is picked it shows
 * where to send the money and asks for the sender number and transaction ID. Those two boxes are plain form
 * fields named `payer` and `trxId`, so the parent form reads them from its FormData.
 */
export function PaymentPicker({ methods, value, onChange, amount }: { methods: PublicMethod[]; value: string; onChange: (id: string) => void; amount?: number }) {
  const [copied, setCopied] = useState(false);
  const picked = methods.find((m) => m.id === value);

  const row = (on: boolean) => `flex cursor-pointer items-center gap-3 rounded-xl border bg-paper p-3 text-sm text-ink ${on ? "border-accent" : "border-line"}`;
  const field = "w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink";
  const panel = "rounded-xl border border-line bg-paper p-3.5 text-sm text-ink";
  const muted = "text-muted";

  if (methods.length === 0) return <p className="rounded-xl border border-line p-3 text-sm text-muted">No payment method is open right now. Please call us to place your order.</p>;

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* the number is visible, they can copy it by hand */ }
  }

  return (
    <div className="grid gap-2">
      {methods.map((m) => (
        <label key={m.id} className={row(m.id === value)}>
          <input type="radio" name="pay" checked={m.id === value} onChange={() => onChange(m.id)} />
          <span>{m.name}{m.id === "cod" && <span className={`block text-xs ${muted}`}>Check it, then pay the rider in cash.</span>}{m.id === "sslcommerz" && <span className={`block text-xs ${muted}`}>Cards, bKash, Nagad, Rocket and banks on a secure page.</span>}</span>
        </label>
      ))}

      {picked?.manual && (
        <div className={`grid gap-3 ${panel}`}>
          <div>
            <p className="font-medium">How to pay with {picked.name}</p>
            {picked.id === "bank" ? (
              <pre className={`mt-1.5 whitespace-pre-wrap font-body text-sm ${muted}`}>{picked.account}</pre>
            ) : (
              <p className={`mt-1.5 ${muted}`}>
                Send {amount ? <span className="font-semibold text-ink">{formatPrice(amount)}</span> : "the total"} to{" "}
                <button type="button" onClick={() => copy(picked.account)} className="inline-flex items-center gap-1 rounded-md bg-ink/5 px-1.5 py-0.5 font-semibold text-ink" aria-label={`Copy ${picked.name} number`}>
                  {picked.account} {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
                {picked.accountType && <> ({ACCOUNT_TYPE_LABEL[picked.accountType]})</>}.
              </p>
            )}
            {picked.instructions && <p className={`mt-1.5 text-xs ${muted}`}>{picked.instructions}</p>}
            <p className={`mt-1.5 text-xs ${muted}`}>Then fill in the two boxes below. We check the payment before we send your order.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="payer" className={`mb-1 block text-xs font-medium ${muted}`}>{picked.id === "bank" ? "Account name or number you sent from (optional)" : `${picked.name} number you sent from`}</label>
              <input key={`payer-${picked.id}`} id="payer" name="payer" required={picked.id !== "bank"} inputMode={picked.id === "bank" ? "text" : "tel"} placeholder={picked.id === "bank" ? "" : "01712345678"} maxLength={40} className={field} />
            </div>
            <div>
              <label htmlFor="trxId" className={`mb-1 block text-xs font-medium ${muted}`}>Transaction ID</label>
              <input key={`trx-${picked.id}`} id="trxId" name="trxId" required minLength={6} maxLength={24} autoCapitalize="characters" autoComplete="off" placeholder="8N7A6D5EE7" className={`${field} uppercase`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
