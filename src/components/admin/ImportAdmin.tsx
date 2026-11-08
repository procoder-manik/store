"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound } from "lucide-react";
import type { ImportSettings } from "@/lib/import-config";
import { makeImportToken, saveImportOptions } from "@/app/admin/import/actions";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";
const box = "rounded-2xl border border-line bg-surface p-5";

export function ImportAdmin({ settings, tokenSet, tokenDate, categories }: { settings: ImportSettings; tokenSet: boolean; tokenDate: string; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [rates, setRates] = useState<Record<string, string>>(Object.fromEntries(Object.entries(settings.rates).map(([k, v]) => [k, String(v)])));
  const [extra, setExtra] = useState(String(settings.extra));
  const [categoryId, setCategoryId] = useState(settings.categoryId);
  const [ai, setAi] = useState(settings.ai);

  function newToken() {
    if (tokenSet && !confirm("Make a new token? The extension will stop working until you paste the new one into it.")) return;
    setMsg(null);
    start(async () => {
      const r = await makeImportToken();
      if (r.ok && r.token) { setToken(r.token); setCopied(false); router.refresh(); }
      else setMsg({ ok: false, text: r.error ?? "Could not make a token." });
    });
  }

  async function copy() {
    try { await navigator.clipboard.writeText(token); setCopied(true); } catch { /* the token is selectable on screen */ }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await saveImportOptions({ rates, extra, categoryId, ai });
      setMsg(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.error ?? "Could not save." });
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="grid gap-5">
      <section className={box}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><KeyRound size={18} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-semibold">Import token</h2>
            <p className="text-xs text-muted">{tokenSet ? `A token exists, made ${tokenDate ? new Date(tokenDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "earlier"}. It is never shown again.` : "No token yet. Make one, then paste it into the extension."}</p>
          </div>
          <button type="button" onClick={newToken} disabled={pending} className="rounded-pill bg-accent px-5 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50">{tokenSet ? "Make a new token" : "Make a token"}</button>
        </div>
        {token && (
          <div className="mt-4 rounded-xl border border-accent/40 bg-accent/5 p-3">
            <p className="text-xs font-medium">Copy it now. This is the only time it is shown.</p>
            <div className="mt-2 flex gap-2">
              <input readOnly value={token} onFocus={(e) => e.currentTarget.select()} className={`${input} font-mono text-xs`} />
              <button type="button" onClick={copy} className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-line px-4 text-sm font-medium hover:bg-paper">{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button>
            </div>
          </div>
        )}
      </section>

      <form onSubmit={save} className={`${box} grid gap-4`}>
        <div>
          <h2 className="font-display text-base font-semibold">Prices</h2>
          <p className="mt-1 text-xs text-muted">The shop&apos;s price is converted to taka at these rates, then the amount below is added for shipping, delivery and your margin. The crossed-out price is set above it so the discount shows. Check today&apos;s rates before you import.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.keys(rates).map((c) => (
            <div key={c}><label className={label} htmlFor={`rate-${c}`}>1 {c} in taka</label><input id={`rate-${c}`} className={input} type="number" min="0" step="0.01" value={rates[c]} onChange={(e) => setRates((r) => ({ ...r, [c]: e.target.value }))} /></div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className={label} htmlFor="extra">Amount added to every product (৳)</label><input id="extra" className={input} type="number" min="0" step="1" value={extra} onChange={(e) => setExtra(e.target.value)} /></div>
          <div>
            <label className={label} htmlFor="cat">Category for imported products</label>
            <select id="cat" className={input} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">First active category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} className="h-4 w-4" /> Write the Bangla description with AI (uses a service from Admin, AI services)</label>
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={pending} className="rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-50">Save</button>
          {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`} role="status">{msg.text}</p>}
        </div>
      </form>

      <section className={box}>
        <h2 className="font-display text-base font-semibold">How to use it</h2>
        <ol className="mt-2 grid list-decimal gap-1.5 pl-5 text-sm text-muted">
          <li>In Chrome open <span className="font-medium text-ink">Extensions</span>, turn on <span className="font-medium text-ink">Developer mode</span>, press <span className="font-medium text-ink">Load unpacked</span> and pick the <span className="font-medium text-ink">store-importer-extension</span> folder (it sits next to your store folder).</li>
          <li>Open the extension&apos;s <span className="font-medium text-ink">Settings</span>, paste your store address and the token from above.</li>
          <li>Open any product page, press the extension button, check the name, price and pictures, and press <span className="font-medium text-ink">Import as draft</span>.</li>
          <li>Come back to <span className="font-medium text-ink">Products</span>, open the draft, set the stock, and publish.</li>
        </ol>
        <p className="mt-3 text-xs text-muted">Imported products are always drafts. Pictures are copied into your own storage, so they keep working if the shop removes them. Check that you have the right to use the pictures and text of the shop you copy from.</p>
      </section>
    </div>
  );
}
