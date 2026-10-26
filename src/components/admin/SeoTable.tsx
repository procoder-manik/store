"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkSeo, generateSeoFor, imagePrompts } from "@/app/admin/seo/actions";

export type SeoRow = { id: string; name: string; title: string; description: string };

function grade(r: SeoRow) {
  if (!r.title || !r.description) return { label: "Missing", cls: "bg-red-100 text-red-900" };
  if (r.title.length > 60 || r.description.length > 160 || r.description.length < 70) return { label: "Check length", cls: "bg-amber-100 text-amber-900" };
  return { label: "Good", cls: "bg-accent/10 text-accent" };
}

export function SeoTable({ rows }: { rows: SeoRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const missing = rows.filter((r) => !r.title || !r.description).length;

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button disabled={pending || missing === 0} onClick={() => { setMsg(""); start(async () => { const r = await bulkSeo(); setMsg(r.error ? `Stopped: ${r.error}` : `Filled ${r.done}. ${r.remaining} still missing${r.remaining ? ", click again to continue." : "."}`); router.refresh(); }); }} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-50">{pending ? "Writing..." : `Fill missing listings (${missing})`}</button>
        {msg && <p role="status" className="text-sm text-muted">{msg}</p>}
      </div>
      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs text-muted"><tr><th className="p-3 font-medium">Product</th><th className="p-3 font-medium">Search listing</th><th className="p-3 font-medium">Status</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => {
              const g = grade(r);
              return (
                <tr key={r.id} className="border-b border-line align-top last:border-0">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="max-w-md p-3"><p>{r.title || <span className="text-muted">No title</span>}<span className="text-xs text-muted"> ({r.title.length}/60)</span></p><p className="mt-1 text-muted">{r.description || "No description"}<span className="text-xs"> ({r.description.length}/160)</span></p>
                    {prompts[r.id] && <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-paper p-3 font-body text-xs">{prompts[r.id]}</pre>}
                  </td>
                  <td className="p-3"><span className={`rounded-full px-2.5 py-0.5 text-xs ${g.cls}`}>{g.label}</span></td>
                  <td className="p-3">
                    <div className="grid gap-1.5 text-xs">
                      <button disabled={busy !== null} onClick={async () => { setBusy(r.id); setMsg(""); const x = await generateSeoFor(r.id); setBusy(null); if (x.ok) router.refresh(); else setMsg(x.error); }} className="text-left font-medium text-accent underline disabled:opacity-50">{busy === r.id ? "Writing..." : "Write with AI"}</button>
                      <button disabled={busy !== null} onClick={async () => { setBusy(r.id); setMsg(""); const x = await imagePrompts(r.id); setBusy(null); if (x.ok) setPrompts((p) => ({ ...p, [r.id]: x.text })); else setMsg(x.error); }} className="text-left underline disabled:opacity-50">Photo prompts</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
