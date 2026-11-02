"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

const KEY = "claimed-coupon";

export const readClaim = () => { try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; } };
export const clearClaim = () => { try { localStorage.removeItem(KEY); } catch { /* storage blocked */ } };

/** Copies the code and keeps it for checkout, where it is applied by itself. */
export function ClaimCoupon({ code }: { code: string }) {
  const [done, setDone] = useState(false);
  async function claim() {
    try { localStorage.setItem(KEY, code); } catch { /* storage blocked */ }
    try { await navigator.clipboard.writeText(code); } catch { /* the code is on screen */ }
    setDone(true);
  }
  return (
    <button type="button" onClick={claim} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-ink/30 px-4 py-3 text-left transition hover:border-ink/60">
      <span className="font-mono text-base font-semibold tracking-wider">{code}</span>
      <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-accent">{done ? <><Check size={14} /> Claimed, ready at checkout</> : <><Copy size={14} /> Claim</>}</span>
    </button>
  );
}
