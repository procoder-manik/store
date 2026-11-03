import { X } from "lucide-react";
import type { PopupConfig } from "@/lib/popup";

type Props = {
  p: PopupConfig;
  onClose?: () => void;
  onCopy?: () => void;
  copied?: boolean;
  onButton?: () => void;
};

/** The visible popup: five card designs plus a bottom bar, each honouring the chosen colours.
 *  The same component draws the live store popup and the Admin preview, so they always match. */
export function PopupCard({ p, onClose, onCopy, copied, onButton }: Props) {
  const cardStyle = { ...(p.bg ? { background: p.bg } : {}), ...(p.fg ? { color: p.fg } : {}) };
  const accentBtn = p.accent ? { background: p.accent, color: "#fff" } : undefined;
  const accentBtnCls = p.accent ? "" : "bg-accent text-accent-ink";
  const codeStyle = p.accent ? { borderColor: p.accent, color: p.accent } : undefined;

  const Close = onClose ? (
    <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/5 hover:bg-black/10"><X size={16} /></button>
  ) : null;

  const Code = p.code ? (
    <button type="button" onClick={onCopy} style={codeStyle} className={`flex items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3 ${p.accent ? "" : "border-accent text-accent"}`}>
      <span className="font-display text-lg tracking-wider">{p.code}</span>
      <span className="text-xs opacity-80">{copied ? "Copied" : "Copy code"}</span>
    </button>
  ) : null;

  const Cta = p.button ? (
    <button type="button" onClick={onButton} style={accentBtn} className={`rounded-pill px-5 py-2.5 text-sm font-semibold ${accentBtnCls}`}>{p.button}</button>
  ) : null;

  // A bar along the bottom: one horizontal strip, whatever design is chosen.
  if (p.position === "bottom-bar") {
    return (
      <div style={cardStyle} className="relative flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 bg-surface px-5 py-3 text-ink shadow-[0_-6px_24px_rgba(0,0,0,0.08)]">
        {Close}
        <p className="font-display text-base font-semibold">{p.title}</p>
        {p.text && <p className="text-sm opacity-80">{p.text}</p>}
        <span className="flex items-center gap-3">{Code}{Cta}</span>
      </div>
    );
  }

  if (p.design === "sidebyside") {
    return (
      <div style={cardStyle} className="relative grid w-full max-w-lg overflow-hidden rounded-3xl bg-surface text-ink shadow-2xl sm:grid-cols-2">
        {Close}
        <span className="min-h-40 bg-ink/[0.04]">{p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}</span>
        <div className="grid gap-3 p-6">
          <h2 className="font-display text-xl font-semibold leading-tight">{p.title}</h2>
          {p.text && <p className="text-sm opacity-80">{p.text}</p>}
          {Code}
          {Cta}
        </div>
      </div>
    );
  }

  if (p.design === "minimal") {
    return (
      <div style={cardStyle} className="relative w-full max-w-sm rounded-2xl bg-surface p-6 text-ink shadow-2xl">
        {Close}
        <div className="flex items-start gap-4">
          {p.image && <img src={p.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />}
          <div className="grid gap-2">
            <h2 className="pr-6 font-display text-lg font-semibold leading-tight">{p.title}</h2>
            {p.text && <p className="text-xs opacity-80">{p.text}</p>}
          </div>
        </div>
        <div className="mt-4 grid gap-2">{Code}{Cta}</div>
      </div>
    );
  }

  if (p.design === "spotlight") {
    const spot = p.bg ? cardStyle : {};
    return (
      <div style={spot} className={`relative w-full max-w-md overflow-hidden rounded-3xl p-8 text-center shadow-2xl ${p.bg ? "" : "bg-gradient-to-br from-accent to-ink text-accent-ink"}`}>
        {Close}
        {p.image && <img src={p.image} alt="" className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover" />}
        <h2 className="font-display text-3xl font-semibold leading-tight">{p.title}</h2>
        {p.text && <p className="mx-auto mt-2 max-w-xs text-sm opacity-90">{p.text}</p>}
        <div className="mx-auto mt-5 grid max-w-xs gap-3">
          {p.code && <button type="button" onClick={onCopy} className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-current px-4 py-3"><span className="font-display text-lg tracking-wider">{p.code}</span><span className="text-xs opacity-80">{copied ? "Copied" : "Copy"}</span></button>}
          {p.button && <button type="button" onClick={onButton} className="rounded-pill bg-white px-5 py-2.5 text-sm font-semibold text-black">{p.button}</button>}
        </div>
      </div>
    );
  }

  if (p.design === "coupon") {
    return (
      <div style={cardStyle} className="relative w-full max-w-md rounded-3xl bg-surface p-7 text-center text-ink shadow-2xl">
        {Close}
        {p.image && <img src={p.image} alt="" className="mx-auto mb-3 h-16 w-16 rounded-xl object-cover" />}
        <h2 className="font-display text-2xl font-semibold leading-tight">{p.title}</h2>
        {p.text && <p className="mx-auto mt-1.5 max-w-xs text-sm opacity-80">{p.text}</p>}
        {p.code && (
          <button type="button" onClick={onCopy} style={codeStyle} className={`relative mx-auto mt-5 flex w-full max-w-xs items-center justify-center rounded-xl border-2 border-dashed py-4 ${p.accent ? "" : "border-accent text-accent"}`}>
            <span aria-hidden className="absolute -left-2.5 h-5 w-5 rounded-full bg-paper" />
            <span className="font-display text-2xl font-bold tracking-[0.2em]">{p.code}</span>
            <span aria-hidden className="absolute -right-2.5 h-5 w-5 rounded-full bg-paper" />
          </button>
        )}
        <p className="mt-2 text-[11px] opacity-60">{copied ? "Copied to clipboard" : "Tap the code to copy"}</p>
        {Cta && <div className="mt-4">{Cta}</div>}
      </div>
    );
  }

  // classic
  return (
    <div style={cardStyle} className="relative w-full max-w-md overflow-hidden rounded-3xl bg-surface text-ink shadow-2xl">
      {Close}
      {p.image && <img src={p.image} alt="" className="h-36 w-full object-cover" />}
      <div className="grid gap-3 p-8 text-center">
        <h2 className="font-display text-2xl font-semibold leading-tight">{p.title}</h2>
        {p.text && <p className="mx-auto max-w-xs text-sm opacity-80">{p.text}</p>}
        <div className="mt-1 grid gap-3">{Code}{Cta}</div>
      </div>
    </div>
  );
}
