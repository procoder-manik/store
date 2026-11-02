"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { CardStyle } from "@/components/CardStyle";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/demo-products";
import { CARD_STYLES, isCardStyle, THEMES, themeOf, type CardStyleId } from "@/lib/themes";

const picked = "has-[:checked]:border-ink has-[:checked]:ring-2 has-[:checked]:ring-ink/20";

/** Theme and product card pickers beside a live preview that uses the real product card. */
export function ThemeLook({ theme, card, glass, samples }: { theme: string; card: string; glass: boolean; samples: Product[] }) {
  const [t, setT] = useState(themeOf(theme).id);
  const [c, setC] = useState(isCardStyle(card) ? card : "theme");
  const [dark, setDark] = useState(false);
  const fallback: CardStyleId = glass ? "ios" : themeOf(t).card;
  const shown = c === "theme" ? fallback : (c as CardStyleId);
  const cur = themeOf(t);

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {THEMES.map((x) => (
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
        <div data-theme={t} style={{ colorScheme: dark ? "dark" : "light" }} className="rounded-2xl bg-paper p-4 text-ink sm:p-5">
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
