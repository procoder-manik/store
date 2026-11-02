"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeSslKeys, saveSslKeys, testSslKeys } from "@/app/admin/payments/actions";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";

export type SslView = { source: "backend" | "env" | "none"; storeId: string; live: boolean; ipnUrl: string };

/** Store ID and password for SSLCommerz, kept on this page instead of in the hosting settings. */
export function SslKeys({ ssl }: { ssl: SslView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setMsg(null);
    start(async () => {
      const r = await saveSslKeys({ storeId: String(f.get("storeId")), password: String(f.get("password") ?? ""), live: f.get("live") === "live" });
      setMsg(r.ok ? { ok: true, text: "Saved. Press Test connection to check the keys." } : { ok: false, text: r.error ?? "Could not save." });
      if (r.ok) { (form.elements.namedItem("password") as HTMLInputElement).value = ""; router.refresh(); }
    });
  }

  return (
    <form onSubmit={save} className="grid gap-3 rounded-xl bg-paper p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className={label} htmlFor="ssl-id">Store ID</label><input id="ssl-id" name="storeId" required maxLength={80} autoComplete="off" defaultValue={ssl.source === "backend" ? ssl.storeId : ""} className={input} /></div>
        <div><label className={label} htmlFor="ssl-pass">Store password {ssl.source === "backend" && "(leave empty to keep the saved one)"}</label><input id="ssl-pass" name="password" type="password" required={ssl.source !== "backend"} maxLength={200} autoComplete="new-password" data-lpignore="true" data-1p-ignore="true" className={input} /></div>
      </div>
      <fieldset className="flex flex-wrap gap-4 text-sm">
        <legend className={label}>Mode</legend>
        <label className="flex items-center gap-2"><input type="radio" name="live" value="sandbox" defaultChecked={!ssl.live} /> Sandbox, for testing with no real money</label>
        <label className="flex items-center gap-2"><input type="radio" name="live" value="live" defaultChecked={ssl.live} /> Live, real payments</label>
      </fieldset>
      <p className="text-xs text-muted">{ssl.source === "env" ? "Keys are coming from the hosting settings right now. Keys saved here replace them." : "The password is stored scrambled and is never shown again."} In your SSLCommerz panel, set the IPN address to <code className="select-all rounded bg-surface px-1 py-0.5 font-mono text-[11px] text-ink">{ssl.ipnUrl}</code></p>
      <div className="flex flex-wrap items-center gap-2">
        <button disabled={pending} className="rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Working..." : "Save keys"}</button>
        {ssl.source !== "none" && <button type="button" disabled={pending} onClick={() => { setMsg(null); start(async () => { const r = await testSslKeys(); setMsg({ ok: r.ok, text: r.ok ? `It works. SSLCommerz accepted these keys in ${r.live ? "live" : "sandbox"} mode.` : r.error ?? "The test failed." }); }); }} className="rounded-pill border border-line px-5 py-2 text-sm font-medium disabled:opacity-50">Test connection</button>}
        {ssl.source === "backend" && <button type="button" disabled={pending} onClick={() => start(async () => { const r = await removeSslKeys(); setMsg({ ok: r.ok, text: r.ok ? "Keys removed." : r.error ?? "Could not remove." }); router.refresh(); })} className="rounded-pill border border-line px-5 py-2 text-sm font-medium text-[var(--madder)] disabled:opacity-50">Remove keys</button>}
      </div>
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-[var(--madder)]"}`}>{msg.text}</p>}
    </form>
  );
}
