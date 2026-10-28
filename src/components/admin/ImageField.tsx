"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { imageUrl } from "@/lib/utils";

/** Upload a picture from your computer, or paste a link. Pass `name` to use it inside a plain form. */
export function ImageField({ value, onChange, label = "Image", name }: { value: string; onChange?: (url: string) => void; label?: string; name?: string }) {
  const [url, setUrl] = useState(value);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (u: string) => { setUrl(u); onChange?.(u); };

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
        {url && <button type="button" onClick={() => set("")} className="text-xs text-red-600 underline">Remove</button>}
      </div>
      <input value={url} onChange={(e) => set(e.target.value)} placeholder="or paste an image link (https://)" maxLength={500} className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm" />
      {name && <input type="hidden" name={name} value={url} />}
      {busy && <p className="mt-1 text-xs text-muted">Uploading...</p>}
      {msg && <p role="alert" className="mt-1 text-xs text-red-600">{msg}</p>}
    </div>
  );
}
