"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendTestEmail } from "@/app/admin/health/actions";

export function TestEmail() {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-3">
      <button disabled={pending} onClick={() => start(async () => { const r = await sendTestEmail(); setMsg({ ok: r.ok, text: r.message }); router.refresh(); })} className="w-fit rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Sending..." : "Send a test email to me"}</button>
      {msg && <p role="status" className={`rounded-lg p-3 text-sm ${msg.ok ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}`}>{msg.text}</p>}
    </div>
  );
}
