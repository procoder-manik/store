"use client";

import { useState } from "react";
import { ImageField } from "@/components/admin/ImageField";
import { PopupCard } from "@/components/PopupCard";
import { POPUP_DESIGNS, POPUP_POSITIONS, POPUP_TRIGGERS, type PopupConfig } from "@/lib/popup";
import { savePopup } from "@/app/admin/settings/actions";

const input = "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm";
const label = "mb-1 block text-xs font-medium text-muted";
const CORNER: Record<string, string> = { "bottom-right": "bottom-0 right-0", "bottom-left": "bottom-0 left-0", "top-right": "top-0 right-0", "top-left": "top-0 left-0" };

export function PopupEditor({ initial }: { initial: PopupConfig }) {
  const [p, setP] = useState<PopupConfig>(initial);
  const [custom, setCustom] = useState(!!(initial.bg || initial.fg || initial.accent));
  const set = <K extends keyof PopupConfig>(k: K, v: PopupConfig[K]) => setP((o) => ({ ...o, [k]: v }));
  const preview: PopupConfig = { ...p, bg: custom ? p.bg : "", fg: custom ? p.fg : "", accent: custom ? p.accent : "" };
  const card = <PopupCard p={preview} copied={false} />;

  return (
    <form action={savePopup} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* hidden inputs carry the values the preview is built from */}
      <input type="hidden" name="design" value={p.design} />
      <input type="hidden" name="bg" value={custom ? p.bg : ""} />
      <input type="hidden" name="fg" value={custom ? p.fg : ""} />
      <input type="hidden" name="accent" value={custom ? p.accent : ""} />

      <div className="grid gap-5">
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="enabled" checked={p.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-4 w-4" /> Show the popup on the store</label>

        <section className="grid gap-3 rounded-2xl border border-line bg-paper p-4">
          <p className={label}>Design</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {POPUP_DESIGNS.map((d) => (
              <button type="button" key={d.id} onClick={() => set("design", d.id)} className={`rounded-xl border p-2.5 text-left text-xs transition ${p.design === d.id ? "border-accent bg-accent/10" : "border-line hover:border-ink/30"}`}>
                <span className="block font-semibold">{d.name}</span>
                <span className="mt-0.5 block text-[11px] text-muted">{d.about}</span>
              </button>
            ))}
          </div>
          <div>
            <label className={label} htmlFor="popup-position">Where it appears</label>
            <select id="popup-position" name="position" value={p.position} onChange={(e) => set("position", e.target.value as PopupConfig["position"])} className={input}>
              {POPUP_POSITIONS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </div>
        </section>

        <section className="grid gap-3 rounded-2xl border border-line bg-paper p-4">
          <p className={label}>Words and picture</p>
          <div><label className={label} htmlFor="popup-title">Title</label><input id="popup-title" name="title" required maxLength={80} value={p.title} onChange={(e) => set("title", e.target.value)} className={input} /></div>
          <div><label className={label} htmlFor="popup-text">Text</label><input id="popup-text" name="text" maxLength={240} value={p.text} onChange={(e) => set("text", e.target.value)} className={input} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={label} htmlFor="popup-code">Coupon code <span className="font-normal">(optional)</span></label><input id="popup-code" name="code" maxLength={30} value={p.code} onChange={(e) => set("code", e.target.value.toUpperCase())} className={input} /></div>
            <div><label className={label} htmlFor="popup-button">Button text</label><input id="popup-button" name="button" maxLength={30} value={p.button} onChange={(e) => set("button", e.target.value)} className={input} /></div>
          </div>
          <ImageField label="Picture (optional)" name="image" value={p.image} onChange={(u) => set("image", u)} />
        </section>

        <section className="grid gap-3 rounded-2xl border border-line bg-paper p-4">
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} className="h-4 w-4" /> Custom colours</label>
          {custom && (
            <div className="grid grid-cols-3 gap-3">
              {([["bg", "Background"], ["fg", "Text"], ["accent", "Buttons"]] as const).map(([k, name]) => (
                <label key={k} className="text-xs text-muted">{name}
                  <input type="color" value={(p[k] as string) || "#ffffff"} onChange={(e) => set(k, e.target.value)} className="mt-1 h-9 w-full rounded-lg border border-line bg-surface" />
                </label>
              ))}
            </div>
          )}
          {!custom && <p className="text-xs text-muted">The popup follows your store theme. Tick the box to pick your own colours.</p>}
        </section>

        <section className="grid gap-3 rounded-2xl border border-line bg-paper p-4">
          <div><label className={label} htmlFor="popup-trigger">When it shows</label>
            <select id="popup-trigger" name="trigger" value={p.trigger} onChange={(e) => set("trigger", e.target.value as PopupConfig["trigger"])} className={input}>
              {POPUP_TRIGGERS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div hidden={p.trigger !== "delay"}><label className={label} htmlFor="popup-delay">Seconds to wait</label><input id="popup-delay" name="delay" type="number" min={1} max={120} value={p.delay} onChange={(e) => set("delay", Number(e.target.value))} className={input} /></div>
          <div hidden={p.trigger !== "scroll"}><label className={label} htmlFor="popup-scroll">Show after scrolling this far down (%)</label><input id="popup-scroll" name="scrollPercent" type="number" min={5} max={100} value={p.scrollPercent} onChange={(e) => set("scrollPercent", Number(e.target.value))} className={input} /></div>
          <div hidden={p.trigger !== "click"} className="grid gap-3 sm:grid-cols-2">
            <div><label className={label} htmlFor="popup-sel">Which button or area <span className="font-normal">(CSS selector, empty = anywhere)</span></label><input id="popup-sel" name="clickSelector" maxLength={100} value={p.clickSelector} onChange={(e) => set("clickSelector", e.target.value)} placeholder=".buy-now" className={input} /></div>
            <div><label className={label} htmlFor="popup-clicks">After how many clicks</label><input id="popup-clicks" name="clickCount" type="number" min={1} max={50} value={p.clickCount} onChange={(e) => set("clickCount", Number(e.target.value))} className={input} /></div>
          </div>
        </section>

        <section className="grid gap-3 rounded-2xl border border-line bg-paper p-4">
          <p className={label}>Who sees it, and how often</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={label} htmlFor="popup-max">Times to show each visitor</label><input id="popup-max" name="maxShows" type="number" min={1} max={20} value={p.maxShows} onChange={(e) => set("maxShows", Number(e.target.value))} className={input} /></div>
            <div><label className={label} htmlFor="popup-gap">Days before showing again</label><input id="popup-gap" name="gapDays" type="number" min={0} max={365} value={p.gapDays} onChange={(e) => set("gapDays", Number(e.target.value))} className={input} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="stopAfterClaim" checked={p.stopAfterClaim} onChange={(e) => set("stopAfterClaim", e.target.checked)} className="h-4 w-4" /> Stop once the visitor copies the code or taps the button</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="hideAfterOrder" checked={p.hideAfterOrder} onChange={(e) => set("hideAfterOrder", e.target.checked)} className="h-4 w-4" /> Never show it to someone who has ordered</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="hideSignedIn" checked={p.hideSignedIn} onChange={(e) => set("hideSignedIn", e.target.checked)} className="h-4 w-4" /> Never show it to signed-in customers</label>
        </section>

        <button className="w-fit rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink">Save popup</button>
      </div>

      <div className="lg:sticky lg:top-4 h-fit">
        <p className={label}>Live preview</p>
        <div className="relative h-[460px] overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-paper to-surface">
          <div aria-hidden className="space-y-2 p-4 opacity-40">
            <div className="h-6 w-28 rounded bg-ink/10" />
            <div className="h-24 rounded-xl bg-ink/[0.06]" />
            <div className="h-3 w-3/4 rounded bg-ink/10" /><div className="h-3 w-1/2 rounded bg-ink/10" />
          </div>
          {p.position === "center" ? (
            <div className="absolute inset-0 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-[300px]">{card}</div></div>
          ) : p.position === "bottom-bar" ? (
            <div className="absolute inset-x-0 bottom-0">{card}</div>
          ) : (
            <div className={`absolute m-3 w-[62%] max-w-[260px] ${CORNER[p.position]}`}>{card}</div>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">This is how the popup will look. Changes here show at once; press Save popup to make them live.</p>
      </div>
    </form>
  );
}
