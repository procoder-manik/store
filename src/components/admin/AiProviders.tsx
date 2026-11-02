"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, Plug } from "lucide-react";
import type { ProviderView } from "@/lib/ai-providers";
import type { Probe } from "@/lib/ai";
import { addCustom, removeKey, saveProvider, testProvider } from "@/app/admin/ai/actions";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";
const btn = "rounded-pill border border-line px-4 py-2 text-sm font-medium transition hover:bg-paper disabled:opacity-50";

const SOURCE: Record<ProviderView["source"], { text: string; tone: string }> = {
  backend: { text: "Key saved here", tone: "text-emerald-700 dark:text-emerald-300" },
  env: { text: "Key found in the .env file", tone: "text-emerald-700 dark:text-emerald-300" },
  none: { text: "No key yet", tone: "text-muted" },
};

function Row({ p }: { p: ProviderView }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [probe, setProbe] = useState<Probe | null>(null);
  const [testing, setTesting] = useState(false);
  const src = SOURCE[p.source];

  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setMsg(null);
    start(async () => {
      const r = await saveProvider({ id: p.id, key: String(f.get("key") ?? ""), enabled: f.get("enabled") === "on", models: String(f.get("models") ?? ""), order: Number(f.get("order") || 50) });
      if (r.ok) { (e.target as HTMLFormElement).reset(); router.refresh(); }
      setMsg({ ok: r.ok, text: r.ok ? "Saved." : r.error });
    });
  }

  async function test() {
    setTesting(true); setProbe(null);
    setProbe(await testProvider(p.id));
    setTesting(false);
  }

  return (
    <li className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-base font-semibold">{p.name}</h3>
        <p className={`flex items-center gap-1.5 text-xs font-medium ${src.tone}`}>{p.source !== "none" && <Check size={13} />}{src.text}{p.tail && <span className="font-mono text-muted">••••{p.tail}</span>}</p>
      </div>
      <p className="mt-1 text-xs text-muted">{p.note}{p.keyUrl && <> <a href={p.keyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">Get a key <ExternalLink size={11} /></a></>}</p>
      <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-[1fr_6rem]">
        <div>
          <label className={label} htmlFor={`k-${p.id}`}>API key {p.source === "backend" && "(leave empty to keep the saved one)"}</label>
          <input id={`k-${p.id}`} name="key" type="password" autoComplete="new-password" data-lpignore="true" data-1p-ignore="true" placeholder={p.source === "backend" ? "Saved. Type to replace it." : "Paste the key here"} className={input} />
        </div>
        <div>
          <label className={label} htmlFor={`o-${p.id}`}>Order</label>
          <input id={`o-${p.id}`} name="order" type="number" min={1} max={99} defaultValue={p.order} className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor={`m-${p.id}`}>Models, tried in this order (separate with commas)</label>
          <input id={`m-${p.id}`} name="models" defaultValue={p.models.join(", ")} className={`${input} font-mono text-xs`} />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={p.enabled} /> Use this service</label>
          <span className="flex-1" />
          <button type="button" onClick={test} disabled={testing || p.source === "none"} className={btn}>{testing ? <Loader2 size={14} className="inline animate-spin" /> : "Test"}</button>
          {p.source === "backend" && <button type="button" disabled={pending} onClick={() => start(async () => { const r = await removeKey(p.id); setMsg({ ok: r.ok, text: r.ok ? (p.custom ? "Removed." : "Key removed.") : r.error }); router.refresh(); })} className={`${btn} text-[var(--madder)]`}>{p.custom ? "Remove" : "Remove key"}</button>}
          <button disabled={pending} className="rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Saving..." : "Save"}</button>
        </div>
      </form>
      {msg && <p role="status" className={`mt-3 text-sm ${msg.ok ? "text-muted" : "text-[var(--madder)]"}`}>{msg.text}</p>}
      {probe && (
        <div role="status" className="mt-3 rounded-xl border border-line bg-paper p-3 text-sm">
          {probe.ok
            ? <p>It works. {probe.model} answered in {(probe.ms / 1000).toFixed(1)} seconds.</p>
            : <>
                <p className="text-[var(--madder)]">{probe.error}</p>
                {!!probe.available?.length && <p className="mt-2 text-xs text-muted">Models this key can use: <span className="font-mono">{probe.available.join(", ")}</span></p>}
              </>}
        </div>
      )}
    </li>
  );
}

export function AiProviders({ providers }: { providers: ProviderView[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setErr("");
    start(async () => {
      const r = await addCustom({ name: String(f.get("name")), baseUrl: String(f.get("baseUrl")), key: String(f.get("key")), models: String(f.get("models")) });
      if (r.ok) { form.reset(); router.refresh(); } else setErr(r.error);
    });
  }

  return (
    <>
      <ul className="grid gap-4">{providers.map((p) => <Row key={p.id} p={p} />)}</ul>
      <form onSubmit={add} className="mt-6 grid gap-3 rounded-xl border border-dashed border-line bg-surface p-5 sm:grid-cols-2">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold sm:col-span-2"><Plug size={16} /> Connect another service</h3>
        <p className="text-xs text-muted sm:col-span-2">For any service that works like OpenAI, for example Together, Fireworks, Hugging Face or a service you host yourself.</p>
        <div><label className={label} htmlFor="c-name">Name</label><input id="c-name" name="name" required maxLength={40} className={input} /></div>
        <div><label className={label} htmlFor="c-url">Address</label><input id="c-url" name="baseUrl" required placeholder="https://api.example.com/v1" className={input} /></div>
        <div><label className={label} htmlFor="c-key">API key</label><input id="c-key" name="key" type="password" required autoComplete="new-password" data-lpignore="true" data-1p-ignore="true" className={input} /></div>
        <div><label className={label} htmlFor="c-models">Models (commas)</label><input id="c-models" name="models" required placeholder="model-one, model-two" className={`${input} font-mono text-xs`} /></div>
        {err && <p role="alert" className="text-sm text-[var(--madder)] sm:col-span-2">{err}</p>}
        <button disabled={pending} className="w-fit rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Connecting..." : "Connect"}</button>
      </form>
    </>
  );
}
