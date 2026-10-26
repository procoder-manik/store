"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { aiAssist } from "@/app/admin/ai-assist";

type Field = HTMLInputElement | HTMLTextAreaElement;
const SKIP = /(link|url|image|sku|hex|phone|mobile|e-?mail|slug|address \(|order \(|sort|quantity|qty|stock|code|search|password|max uses|delay|percent|%|value to block|whatsapp|note|district|courier|tracking|receiver)/i;
const SKIP_PAGES = /phone order|^\s*order #/i;

function labelOf(el: Element): string {
  const id = el.getAttribute("id");
  if (id) { const l = document.querySelector(`label[for="${CSS.escape(id)}"]`); if (l?.textContent) return l.textContent.trim(); }
  const wrap = el.closest("label");
  if (wrap?.textContent?.trim()) return wrap.textContent.trim();
  const sib = el.parentElement?.querySelector("label");
  if (sib?.textContent?.trim()) return sib.textContent.trim();
  return el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("name") || "Text";
}

function kindOf(el: Field, label: string): "short" | "long" | "price" | null {
  if (el.dataset.noAi !== undefined || el.readOnly || el.disabled) return null;
  if (el instanceof HTMLTextAreaElement) return SKIP.test(label) ? null : "long";
  const t = el.type;
  if (t === "number") return /price|amount|fee/i.test(label) && !/compare|free|minimum|change/i.test(label) ? "price" : null;
  if (t !== "text" && t !== "") return null;
  return SKIP.test(label) ? null : "short";
}

function setValue(el: Field, v: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Shows an AI button on whatever text field you are typing in, anywhere in the admin panel. */
export function AiAssist() {
  const [target, setTarget] = useState<{ el: Field; kind: "short" | "long" | "price"; label: string } | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const hover = useRef(false);

  const place = useCallback(() => {
    if (!target) return setPos(null);
    const r = target.el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return setPos(null);
    setPos({ top: r.top + (target.el instanceof HTMLTextAreaElement ? 6 : r.height / 2 - 14), left: r.right - 34 });
  }, [target]);

  useEffect(() => {
    const main = document.querySelector("[data-admin-main]");
    if (!main) return;
    const onFocus = (e: Event) => {
      const el = e.target as Element;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
      if (SKIP_PAGES.test(document.querySelector("[data-admin-main] h1")?.textContent ?? "")) return;
      const label = labelOf(el);
      const kind = kindOf(el, label);
      if (!kind) return;
      setMsg("");
      setTarget({ el, kind, label: label.replace(/\s*\(\d+\/\d+\)\s*$/, "") });
    };
    const onBlur = () => window.setTimeout(() => { if (!hover.current) setTarget((t) => (t && document.activeElement === t.el ? t : null)); }, 180);
    main.addEventListener("focusin", onFocus);
    main.addEventListener("focusout", onBlur);
    return () => { main.removeEventListener("focusin", onFocus); main.removeEventListener("focusout", onBlur); };
  }, []);

  useEffect(() => {
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => { window.removeEventListener("scroll", place, true); window.removeEventListener("resize", place); };
  }, [place]);

  async function run() {
    if (!target || busy) return;
    const { el, kind, label } = target;
    const scope = el.closest("form") ?? el.closest("section") ?? document.querySelector("[data-admin-main]");
    const context = Array.from(scope?.querySelectorAll("input, textarea, select") ?? [])
      .filter((f) => f !== el && !(f instanceof HTMLInputElement && ["hidden", "password", "file", "checkbox", "radio"].includes(f.type)))
      .map((f) => ({ label: labelOf(f).slice(0, 160), value: ((f as HTMLInputElement).value ?? "").slice(0, 400) }))
      .filter((c) => c.value.trim())
      .slice(0, 30);
    setBusy(true); setMsg("");
    const r = await aiAssist({
      page: document.querySelector("[data-admin-main] h1")?.textContent?.slice(0, 120) ?? "Admin",
      label: label.slice(0, 160), current: el.value.slice(0, 4000), kind, context,
      maxLength: el.maxLength > 0 ? el.maxLength : undefined,
    });
    setBusy(false);
    if (r.ok) { setValue(el, r.text); el.focus(); } else setMsg(r.error);
  }

  if (!target || !pos) return null;
  return (
    <div style={{ top: pos.top, left: pos.left }} className="fixed z-[70]" onMouseEnter={() => { hover.current = true; }} onMouseLeave={() => { hover.current = false; }}>
      <button type="button" aria-label={`Write ${target.label} with AI`} title={target.el.value ? "Improve with AI" : "Write with AI"} onMouseDown={(e) => e.preventDefault()} onClick={run}
        className="grid h-7 w-7 place-items-center rounded-full bg-accent text-accent-ink shadow-lg ring-2 ring-surface transition hover:scale-110">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
      </button>
      {msg && <p role="alert" className="absolute right-0 top-9 w-56 rounded-xl border border-line bg-surface p-2 text-xs text-red-600 shadow-xl">{msg}</p>}
    </div>
  );
}
