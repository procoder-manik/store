"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Zap } from "lucide-react";
import { COURIERS, type CourierDef } from "@/lib/couriers";
import type { CourierStatus } from "@/lib/courier-config";
import { removeCourierKeys, saveCourierKeys, testCourierKeys, toggleCourier } from "@/app/admin/couriers/actions";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";

function Switch({ on, disabled, onToggle }: { on: boolean; disabled?: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={onToggle} style={{ height: 24, width: 44, minHeight: 0, padding: 0 }} className={`relative shrink-0 rounded-full transition disabled:opacity-40 ${on ? "bg-accent" : "bg-line"}`}>
      <span style={{ top: 2, height: 20, width: 20, left: on ? 22 : 2 }} className="absolute rounded-full bg-white shadow transition-all" />
    </button>
  );
}

function CourierCard({ def, status }: { def: CourierDef; status: CourierStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState(!status.configured);
  const fromEnv = status.source === "env";

  function flip() {
    setMsg(null);
    start(async () => {
      const r = await toggleCourier(def.id, !status.enabled);
      if (!r.ok) setMsg({ ok: false, text: r.error ?? "Could not change this." });
      else router.refresh();
    });
  }

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const values: Record<string, string> = {};
    for (const fld of def.fields) values[fld.name] = String(f.get(fld.name) ?? "");
    setMsg(null);
    start(async () => {
      const r = await saveCourierKeys({ id: def.id, values, live: f.get("live") === "live", enabled: true });
      if (r.ok) {
        setMsg({ ok: true, text: def.canTest ? "Saved and turned on. Press Test connection to check the keys." : "Saved and turned on." });
        for (const fld of def.fields) if (fld.secret) (form.elements.namedItem(fld.name) as HTMLInputElement).value = "";
        setOpen(false);
        router.refresh();
      } else setMsg({ ok: false, text: r.error ?? "Could not save." });
    });
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: def.color }}>{def.name.slice(0, 2)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-base font-semibold">{def.name}</h2>
            {def.autoBook ? <span className="inline-flex items-center gap-1 rounded-pill bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent"><Zap size={11} /> Books parcels automatically</span> : <span className="rounded-pill bg-paper px-2 py-0.5 text-[11px] text-muted">Book in panel, paste tracking</span>}
          </div>
          <p className="mt-0.5 text-xs text-muted">{status.configured ? (status.enabled ? "On — customers' parcels can go through this courier." : "Connected but turned off.") : "Not connected yet."}{fromEnv && " Keys come from the hosting settings."}</p>
        </div>
        {status.configured && <Switch on={status.enabled} disabled={pending} onToggle={flip} />}
      </div>

      {!open && status.configured && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-sm">
          {def.fields.filter((fl) => status.tails[fl.name]).map((fl) => <span key={fl.name} className="rounded-lg bg-paper px-2 py-1 text-xs text-muted">{fl.label}: ••••{status.tails[fl.name]}</span>)}
          <button onClick={() => setOpen(true)} className="rounded-pill border border-line px-3 py-1.5 text-xs font-medium hover:bg-paper">Change keys</button>
          {def.canTest && <button type="button" disabled={pending} onClick={() => { setMsg(null); start(async () => { const r = await testCourierKeys(def.id); setMsg({ ok: r.ok, text: r.ok ? r.detail ?? "It works." : r.error ?? "The test failed." }); }); }} className="rounded-pill border border-line px-3 py-1.5 text-xs font-medium hover:bg-paper disabled:opacity-50">Test connection</button>}
          {status.source === "backend" && <button type="button" disabled={pending} onClick={() => { setMsg(null); start(async () => { const r = await removeCourierKeys(def.id); if (r.ok) router.refresh(); else setMsg({ ok: false, text: r.error ?? "Could not remove." }); }); }} className="rounded-pill border border-line px-3 py-1.5 text-xs font-medium text-[var(--madder)] hover:bg-paper disabled:opacity-50">Remove</button>}
        </div>
      )}

      {open && (
        <form onSubmit={save} className="mt-4 grid gap-3 border-t border-line pt-4">
          <p className="text-xs text-muted">{def.about} <a href={def.signupUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-accent hover:underline">Merchant sign-up <ExternalLink size={11} /></a></p>
          <div className="grid gap-3 sm:grid-cols-2">
            {def.fields.map((fl) => (
              <div key={fl.name} className={def.fields.length % 2 === 1 && fl === def.fields[def.fields.length - 1] ? "sm:col-span-2" : ""}>
                <label className={label} htmlFor={`${def.id}-${fl.name}`}>{fl.label}{fl.optional && <span className="text-muted"> (optional)</span>}{status.tails[fl.name] && <span className="text-muted"> — leave empty to keep ••••{status.tails[fl.name]}</span>}</label>
                <input id={`${def.id}-${fl.name}`} name={fl.name} type={fl.secret ? "password" : "text"} required={!fl.optional && !status.tails[fl.name]} maxLength={400} autoComplete="off" data-lpignore="true" data-1p-ignore="true" placeholder={fl.placeholder} className={input} />
              </div>
            ))}
          </div>
          {def.hasSandbox && (
            <fieldset className="flex flex-wrap gap-4 text-sm">
              <legend className={label}>Mode</legend>
              <label className="flex items-center gap-2"><input type="radio" name="live" value="sandbox" defaultChecked={!status.live} /> Test mode</label>
              <label className="flex items-center gap-2"><input type="radio" name="live" value="live" defaultChecked={status.live} /> Live</label>
            </fieldset>
          )}
          <p className="text-xs text-muted">{def.keysHelp}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button disabled={pending} className="rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Working..." : "Save and turn on"}</button>
            {status.configured && <button type="button" onClick={() => { setOpen(false); setMsg(null); }} className="rounded-pill border border-line px-5 py-2 text-sm font-medium">Cancel</button>}
          </div>
        </form>
      )}

      {msg && <p role="status" className={`mt-3 text-sm ${msg.ok ? "text-emerald-700" : "text-[var(--madder)]"}`}>{msg.ok && <Check size={14} className="mr-1 inline" />}{msg.text}</p>}
    </section>
  );
}

/** Connect and switch the delivery couriers on or off. */
export function CourierSettings({ statuses }: { statuses: CourierStatus[] }) {
  const byId = new Map(statuses.map((s) => [s.id, s]));
  return (
    <div className="grid gap-4">
      {COURIERS.map((def) => {
        const status = byId.get(def.id) ?? { id: def.id, configured: false, enabled: false, live: false, source: "none" as const, tails: {} };
        return <CourierCard key={def.id} def={def} status={status} />;
      })}
    </div>
  );
}
