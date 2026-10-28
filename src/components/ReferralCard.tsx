"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

export function ReferralCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  if (!code) return <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-muted">Your referral link appears here once the store owner runs the latest database update.</p>;
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/?ref=${code}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: "Shop with me", url: link }); return; } catch { /* cancelled */ } }
    void copy();
  };
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs text-muted">Your referral link</p>
      <p className="mt-1 break-all font-mono text-sm">{link || `/?ref=${code}`}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={copy} className="inline-flex items-center gap-2 rounded-pill bg-ink px-5 py-2.5 text-sm font-semibold text-paper">{copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy link</>}</button>
        <button onClick={share} className="inline-flex items-center gap-2 rounded-pill border border-line px-5 py-2.5 text-sm font-medium hover:bg-paper"><Share2 size={15} /> Share</button>
      </div>
    </div>
  );
}
