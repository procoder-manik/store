"use client";

import { useState, useTransition } from "react";
import { sendCampaign, sendTest } from "@/app/admin/emails/actions";
import { InfoTip } from "./InfoTip";

export type Counts = { subscribers: number; customers: number; vip: number };

export function CampaignControls({ templateId, counts }: { templateId: string; counts: Counts }) {
  const [audience, setAudience] = useState("subscribers");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const n = counts[audience as keyof Counts] ?? 0;
  return (
    <div className="mt-3 grid gap-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Audience" value={audience} onChange={(e) => setAudience(e.target.value)} className="rounded-pill border border-line bg-surface px-3 py-1.5 text-xs">
          <option value="subscribers">Leads and subscribers ({counts.subscribers})</option><option value="customers">All customers ({counts.customers})</option><option value="vip">VIP customers ({counts.vip})</option>
        </select>
        <InfoTip text="Who gets this email. Leads are people who signed up or wrote to you. Customers have ordered. VIP customers order the most. Anyone who unsubscribed is left out automatically." />
        <button disabled={pending} onClick={() => start(async () => { const r = await sendTest(templateId); setMsg({ ok: r.ok, text: r.message }); })} className="rounded-pill border border-line px-4 py-1.5 text-xs font-medium hover:bg-paper disabled:opacity-50">Send test to me</button>
        <button disabled={pending || n === 0} onClick={() => { if (confirm(`Send this email to ${n} ${n === 1 ? "person" : "people"} now?`)) start(async () => { const r = await sendCampaign({ templateId, audience }); setMsg({ ok: r.ok, text: r.message }); }); }} className="rounded-pill bg-accent px-4 py-1.5 text-xs font-semibold text-accent-ink disabled:opacity-50">{pending ? "Sending..." : `Send to ${n}`}</button>
      </div>
      {msg && <p role="status" className={`text-xs ${msg.ok ? "text-muted" : "text-red-600"}`}>{msg.text}</p>}
    </div>
  );
}
