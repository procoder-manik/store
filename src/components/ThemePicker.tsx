"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { THEMES } from "@/lib/themes";

export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { setCur(document.documentElement.dataset.theme ?? "studio"); }, []);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); window.removeEventListener("keydown", esc); };
  }, [open]);

  const pick = (id: string) => {
    const el = document.documentElement;
    el.dataset.theme = id;
    el.removeAttribute("data-palette");
    try { localStorage.setItem("theme-pick", id); } catch { /* storage blocked */ }
    setCur(id);
  };

  return (
    <div ref={box} className="relative">
      <button aria-label="Choose a theme" aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-surface"><Palette size={18} /></button>
      {open && (
        <div className="pop-in absolute right-0 top-12 z-50 w-72 rounded-2xl border border-line bg-surface p-3 shadow-2xl">
          <p className="px-1 pb-2 text-xs text-muted">Store theme</p>
          <div className="grid gap-1">
            {THEMES.map((t) => (
              <button key={t.id} aria-pressed={cur === t.id} onClick={() => pick(t.id)} className={`flex items-center gap-3 rounded-xl p-2 text-left text-sm transition hover:bg-paper ${cur === t.id ? "bg-paper" : ""}`}>
                <span style={{ background: `linear-gradient(135deg, ${t.light.paper} 45%, ${t.light.accent} 45%)` }} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-white">{cur === t.id && <Check size={14} />}</span>
                <span className="min-w-0"><span className="block font-medium">{t.name}</span><span className="block truncate text-xs text-muted">{t.about}</span></span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
