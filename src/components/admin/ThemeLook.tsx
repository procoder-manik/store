"use client";

import { useState } from "react";
import { Moon, RotateCcw, Sun } from "lucide-react";
import { CardStyle } from "@/components/CardStyle";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/demo-products";
import { CARD_STYLES, gradientStops, isCardStyle, THEMES, themeOf, withColors, type CardStyleId, type Colors, type ThemeColors } from "@/lib/themes";

const ROWS: { key: keyof Colors; label: string }[] = [
  { key: "paper", label: "Page background" },
  { key: "surface", label: "Cards and panels" },
  { key: "ink", label: "Text" },
  { key: "muted", label: "Soft text" },
  { key: "line", label: "Thin lines" },
  { key: "accent", label: "Main colour (buttons)" },
  { key: "accentInk", label: "Text on the main colour" },
  { key: "gold", label: "Highlight" },
];

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const picked = "has-[:checked]:border-ink has-[:checked]:ring-2 has-[:checked]:ring-ink/20";

/** Theme and product card pickers beside a live preview that uses the real product card. */
export function ThemeLook({ theme, card, glass, samples, colors: saved }: { theme: string; card: string; glass: boolean; samples: Product[]; colors: Record<string, ThemeColors> }) {
  const [t, setT] = useState(themeOf(theme).id);
  const [c, setC] = useState(isCardStyle(card) ? card : "theme");
  const [dark, setDark] = useState(false);
  const fallback: CardStyleId = glass ? "ios" : themeOf(t).card;
  const shown = c === "theme" ? fallback : (c as CardStyleId);
  const [colors, setColors] = useState(saved);
  const cur = withColors(themeOf(t), colors[t]);
  const side = dark ? "dark" : "light";
  const pal = cur[side];
  const stops = gradientStops(cur);
  const edited = !!colors[t] && (Object.keys(colors[t].light ?? {}).length > 0 || Object.keys(colors[t].dark ?? {}).length > 0 || !!colors[t].from || !!colors[t].to);
  const setColor = (key: keyof Colors, v: string) => setColors({ ...colors, [t]: { ...colors[t], [side]: { ...colors[t]?.[side], [key]: v } } });
  const setStop = (key: "from" | "to", v: string) => setColors({ ...colors, [t]: { ...colors[t], [key]: v } });
  const reset = () => { const next = { ...colors }; delete next[t]; setColors(next); };
  const hard = contrast(pal.ink, pal.paper) < 4 ? "Text and page background are too close." : contrast(pal.ink, pal.surface) < 4 ? "Text and cards are too close." : contrast(pal.accentInk, pal.accent) < 3 && !cur.fill ? "Button text and the main colour are too close." : "";
  const vars = { "--paper": pal.paper, "--surface": pal.surface, "--ink": pal.ink, "--muted": pal.muted, "--line": pal.line, "--accent": pal.accent, "--accent-ink": pal.accentInk, "--gold": pal.gold, "--fill": cur.fill ?? "none", colorScheme: dark ? "dark" : "light" } as React.CSSProperties;

  return (
    <div className="grid gap-5">
      <input type="hidden" name="colors" value={JSON.stringify(colors)} />
      <div className="grid gap-3 sm:grid-cols-2">
        {THEMES.map((base) => withColors(base, colors[base.id])).map((x) => (
          <label key={x.id} className={`cursor-pointer overflow-hidden rounded-xl border border-line ${picked}`}>
            <input type="radio" name="theme" value={x.id} checked={t === x.id} onChange={() => setT(x.id)} className="sr-only" />
            <span style={{ background: x.light.paper, color: x.light.ink }} className="block h-full p-4">
              <span className="flex items-center justify-between gap-2">
                <span className="block text-base font-semibold">{x.name}</span>
                <span style={{ borderColor: x.light.ink + "33" }} className="rounded-full border px-2 py-0.5 text-[10px]">{x.kind === "gradient" ? "Gradient" : "Solid"}</span>
              </span>
              <span style={{ opacity: 0.72 }} className="mt-1 block text-xs">{x.about}</span>
              <span className="mt-3 flex items-center gap-1.5">
                <span style={{ background: x.fill ?? x.light.accent, color: x.light.accentInk }} className="rounded-full px-3 py-1 text-[11px] font-semibold">Buy now</span>
                <span style={{ background: x.light.gold }} className="h-4 w-4 rounded-full" />
                <span style={{ background: x.dark.paper }} className="h-4 w-4 rounded-full border border-black/10" />
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="grid gap-3 rounded-xl border border-line p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Colours of {cur.name}, {dark ? "dark" : "light"} mode</p>
          {edited && <button type="button" onClick={reset} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium"><RotateCcw size={12} /> Back to the original</button>}
        </div>
        <p className="text-xs text-muted">Each theme keeps its own colours. The preview below changes as you pick, and the Dark button there switches which mode you are colouring. Nothing changes on the shop until you press Save.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {cur.fill && ([["from", "Gradient start", stops[0]], ["to", "Gradient end", stops[1]]] as const).map(([k, l, v]) => (
            <label key={k} className="flex items-center gap-3 rounded-lg bg-paper px-3 py-2 text-sm"><input type="color" value={v} onChange={(e) => setStop(k, e.target.value)} className="h-8 w-10 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0" />{l}</label>
          ))}
          {ROWS.map(({ key, label: l }) => (
            <label key={key} className="flex items-center gap-3 rounded-lg bg-paper px-3 py-2 text-sm"><input type="color" value={pal[key]} onChange={(e) => setColor(key, e.target.value)} className="h-8 w-10 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0" />{l}</label>
          ))}
        </div>
        {hard && <p role="status" className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-800">{hard} Customers may find this hard to read.</p>}
      </div>

      <div>
        <p className="mb-1 block text-xs font-medium text-muted">Product card style</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={`cursor-pointer rounded-xl border border-line p-3 text-sm ${picked}`}>
            <input type="radio" name="card" value="theme" checked={c === "theme"} onChange={() => setC("theme")} className="sr-only" />
            <span className="block font-medium">Automatic</span>
            <span className="mt-0.5 block text-xs text-muted">Right now: {CARD_STYLES.find((x) => x.id === fallback)?.name}.</span>
          </label>
          {CARD_STYLES.map((x) => (
            <label key={x.id} className={`cursor-pointer rounded-xl border border-line p-3 text-sm ${picked}`}>
              <input type="radio" name="card" value={x.id} checked={c === x.id} onChange={() => setC(x.id)} className="sr-only" />
              <span className="block font-medium">{x.name}</span>
              <span className="mt-0.5 block text-xs text-muted">{x.about}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={dark ? "dark" : ""}>
        <div data-theme={t} style={vars} className="rounded-2xl bg-paper p-4 text-ink sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Preview: {cur.name}, {CARD_STYLES.find((x) => x.id === shown)?.name}</p>
            <button type="button" onClick={() => setDark(!dark)} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium">{dark ? <Sun size={13} /> : <Moon size={13} />}{dark ? "Light" : "Dark"}</button>
          </div>
          <CardStyle value={shown}>
            {/* Inert: the preview shows the real card, but nothing in it can be clicked or added to a cart. */}
            <div inert className="grid grid-cols-2 gap-3 sm:gap-4">
              {samples.map((p) => <ProductCard key={p.id} p={p} zones={[]} />)}
            </div>
          </CardStyle>
        </div>
      </div>
    </div>
  );
}
