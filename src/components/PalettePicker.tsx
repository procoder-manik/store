"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { PALETTES } from "@/lib/palettes";

export function PalettePicker() {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { setCur(document.documentElement.dataset.palette ?? "tide"); }, []);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); window.removeEventListener("keydown", esc); };
  }, [open]);

  const pick = (id: string) => {
    document.documentElement.dataset.palette = id;
    try { localStorage.setItem("palette", id); } catch { /* storage blocked */ }
    setCur(id);
  };

  return (
    <div ref={box} className="relative">
      <button aria-label="Choose a color set" aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-surface"><Palette size={18} /></button>
      {open && (
        <div className="pop-in absolute right-0 top-12 z-50 w-64 rounded-2xl border border-line bg-surface p-3 shadow-2xl">
          <p className="px-1 pb-2 text-xs text-muted">Color set</p>
          <div className="grid grid-cols-3 gap-1.5">
            {PALETTES.map((p) => (
              <button key={p.id} aria-pressed={cur === p.id} onClick={() => pick(p.id)} className={`flex flex-col items-center gap-1.5 rounded-xl p-2 text-xs transition hover:bg-paper ${cur === p.id ? "bg-paper font-medium" : ""}`}>
                <span style={{ background: `linear-gradient(135deg, ${p.light} 50%, ${p.dark} 50%)` }} className="grid h-8 w-8 place-items-center rounded-full border border-line text-white">{cur === p.id && <Check size={14} />}</span>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
