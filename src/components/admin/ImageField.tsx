"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { imageUrl } from "@/lib/utils";
import { listLibrary } from "@/app/admin/library-actions";
import { Portal } from "@/components/Portal";

/** Upload a picture from your computer, or paste a link. Pass `name` to use it inside a plain form. */
export function ImageField({ value, onChange, label = "Image", name }: { value: string; onChange?: (url: string) => void; label?: string; name?: string }) {
  const [url, setUrl] = useState(value);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [library, setLibrary] = useState<string[] | null>(null);
  const set = (u: string) => { setUrl(u); onChange?.(u); };

  async function openLibrary() {
    setMsg("");
    setLibrary([]);
    const r = await listLibrary();
    if (!r.ok) { setLibrary(null); setMsg(r.error ?? "Could not open the library."); return; }
    setLibrary(r.images);
  }

  async function pick(f?: File) {
    if (!f) return;
    const ext = ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/avif": "avif" } as Record<string, string>)[f.type];
    if (!ext) return setMsg("Use a PNG, JPG, WebP or AVIF file.");
    if (f.size > 5 * 1024 * 1024) return setMsg("The picture must be under 5 MB.");
    setBusy(true); setMsg("");
    const path = `img-${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient().storage.from("product-images").upload(path, f, { contentType: f.type, cacheControl: "31536000" });
    setBusy(false);
    if (error) setMsg(error.message); else set(imageUrl(path));
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <div className="flex flex-wrap items-center gap-3">
        {url ? <img src={url} alt="" className="h-12 w-12 rounded-lg border border-line object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-lg border border-dashed border-line text-[10px] text-muted">None</span>}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" aria-label={`Upload ${label}`} disabled={busy} className="max-w-[210px] text-xs" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        <button type="button" onClick={openLibrary} className="text-xs underline">Choose from library</button>
        {url && <button type="button" onClick={() => set("")} className="text-xs text-red-600 underline">Remove</button>}
      </div>
      <input value={url} onChange={(e) => set(e.target.value)} placeholder="or paste an image link (https://)" maxLength={500} className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm" />
      {name && <input type="hidden" name={name} value={url} />}
      {library && (
        <Portal>
          <div role="dialog" aria-modal="true" aria-label="Image library" onClick={() => setLibrary(null)} className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4">
            <div onClick={(e) => e.stopPropagation()} className="max-h-[85dvh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-surface p-5 text-ink shadow-2xl">
              <div className="flex items-center justify-between gap-3"><p className="font-display text-lg font-semibold">Your image library</p><button type="button" onClick={() => setLibrary(null)} className="text-sm underline">Close</button></div>
              {library.length === 0 ? <p className="py-10 text-center text-sm text-muted">Loading, or nothing uploaded yet.</p> : (
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {library.map((u) => <button type="button" key={u} onClick={() => { set(u); setLibrary(null); }} className="overflow-hidden rounded-lg border border-line bg-paper hover:border-accent"><img src={u} alt="" loading="lazy" className="aspect-square w-full object-contain" /></button>)}
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
      {busy && <p className="mt-1 text-xs text-muted">Uploading...</p>}
      {msg && <p role="alert" className="mt-1 text-xs text-red-600">{msg}</p>}
    </div>
  );
}
