"use client";

import { useMemo, useState, useTransition } from "react";
import { resetAutoEmail, saveAutoEmail, sendAutoTest } from "@/app/admin/emails/automatic/actions";
import { SAMPLE_VARS } from "@/lib/auto-sample";
import { brandedEmail, fillTemplate } from "@/lib/email-html";

type Tpl = { enabled: boolean; subject: string; heading: string; body: string; buttonText: string; buttonUrl: string; imageUrl: string };
const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";

export function AutoEmailForm({ k, title, when, vars, initial, brand, logo, changed }: { k: string; title: string; when: string; vars: string[]; initial: Tpl; brand: string; logo: string; changed: boolean }) {
  const [f, setF] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const set = <K extends keyof Tpl>(key: K, v: Tpl[K]) => { setMsg(null); setF((p) => ({ ...p, [key]: v })); };
  const sample = { ...SAMPLE_VARS, brand };
  const preview = useMemo(() => brandedEmail({ brand, logo, siteUrl: typeof window === "undefined" ? "" : window.location.origin, heading: fillTemplate(f.heading, sample), body: fillTemplate(f.body, sample), buttonText: f.buttonText, buttonUrl: f.buttonUrl, imageUrl: f.imageUrl, footer: `This email was sent by ${brand}.` }).html,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f, brand, logo]);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, okText: string) => start(async () => { const r = await fn(); setMsg({ ok: r.ok, text: r.ok ? (r.message ?? okText) : (r.error ?? r.message ?? "Failed") }); });
  const payload = { key: k, ...f };

  return (
    <div className="rounded-xl border border-line bg-surface">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <span><span className="font-medium">{title}</span><span className="block text-xs text-muted">{when}</span></span>
        <span className="flex shrink-0 items-center gap-2 text-xs"><span className={`rounded-pill px-2.5 py-0.5 font-medium ${f.enabled ? "bg-emerald-500/15 text-emerald-700" : "bg-paper text-muted"}`}>{f.enabled ? "On" : "Off"}</span>{changed && <span className="text-muted">Edited</span>}<span className="text-muted">{open ? "Close" : "Edit"}</span></span>
      </button>
      {open && (
        <div className="grid gap-5 border-t border-line p-4 lg:grid-cols-2">
          <div className="grid content-start gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.enabled} onChange={(e) => set("enabled", e.target.checked)} /> Send this email</label>
            <div><label className={label}>Subject line</label><input className={input} maxLength={150} value={f.subject} onChange={(e) => set("subject", e.target.value)} /></div>
            <div><label className={label}>Heading</label><input className={input} maxLength={120} value={f.heading} onChange={(e) => set("heading", e.target.value)} /></div>
            <div><label className={label}>Message (blank line between paragraphs)</label><textarea className={input} rows={8} maxLength={4000} value={f.body} onChange={(e) => set("body", e.target.value)} /></div>
            <p className="text-xs text-muted">You can use these words in the subject, heading and message, and they fill in by themselves: {vars.map((v) => <code key={v} className="mr-1 rounded bg-paper px-1.5 py-0.5">{`{{${v}}}`}</code>)}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className={label}>Button text (blank = no button)</label><input className={input} maxLength={40} value={f.buttonText} onChange={(e) => set("buttonText", e.target.value)} /></div>
              <div><label className={label}>Button link</label><input className={input} placeholder="/shop" value={f.buttonUrl} onChange={(e) => set("buttonUrl", e.target.value)} /></div>
            </div>
            <div><label className={label}>Top image link (optional, Pexels, Unsplash or Pixabay)</label><input className={input} value={f.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} /></div>
            {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={pending} onClick={() => run(() => saveAutoEmail(payload), "Saved.")} className="rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-50">Save</button>
              <button type="button" disabled={pending} onClick={() => run(() => sendAutoTest(payload), "Sent.")} className="rounded-pill border border-line px-5 py-2.5 text-sm hover:bg-paper disabled:opacity-50">Send a test to me</button>
              {changed && <button type="button" disabled={pending} onClick={() => { if (confirm("Go back to the original wording?")) start(async () => { await resetAutoEmail(k); location.reload(); }); }} className="px-3 py-2.5 text-sm text-red-600 underline">Reset</button>}
            </div>
          </div>
          <div><p className="mb-2 text-xs font-medium text-muted">Live preview, with example details</p><iframe title="Email preview" sandbox="" srcDoc={preview} className="h-[560px] w-full rounded-xl border border-line bg-white" /></div>
        </div>
      )}
    </div>
  );
}
