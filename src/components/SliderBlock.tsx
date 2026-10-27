"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeadingLevel } from "@/lib/blocks";
import { Heading } from "./Heading";

export type Slide = { title: string; sub: string; image: string; button: string; link: string };
type Style = "slide" | "fade" | "cards" | "split";

function Copy({ s, level, tab, dark = true }: { s: Slide; level: HeadingLevel; tab: boolean; dark?: boolean }) {
  return (
    <>
      <Heading as={level} className="font-display text-3xl font-semibold leading-tight md:text-5xl">{s.title}</Heading>
      {s.sub && <p className={`text-sm md:text-lg ${dark ? "opacity-90" : "text-muted"}`}>{s.sub}</p>}
      {s.button && s.link && <Link href={s.link} tabIndex={tab ? 0 : -1} className={`mt-3 w-fit rounded-pill px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${dark ? "bg-white text-black" : "bg-accent text-accent-ink"}`}>{s.button}</Link>}
    </>
  );
}

export function SliderBlock({ slides, style = "slide", level = "h2" }: { slides: Slide[]; style?: Style; level?: HeadingLevel }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const n = slides.length;
  const go = (k: number) => {
    const next = (k + n) % n;
    setI(next);
    if (style === "cards") { const el = track.current?.children[next] as HTMLElement | undefined; el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); }
  };
  useEffect(() => {
    if (n < 2 || paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => go(i + 1), 5500);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, paused, i, style]);

  const arrows = n > 1 && (
    <>
      <button aria-label="Previous slide" onClick={() => go(i - 1)} className="absolute left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow md:grid"><ChevronLeft size={20} /></button>
      <button aria-label="Next slide" onClick={() => go(i + 1)} className="absolute right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow md:grid"><ChevronRight size={20} /></button>
    </>
  );
  const dots = n > 1 && (
    <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
      {slides.map((_, k) => <button key={k} aria-label={`Slide ${k + 1}`} aria-current={k === i} onClick={() => go(k)} className={`h-2 rounded-full bg-white transition-all ${k === i ? "w-7" : "w-2 opacity-60"}`} />)}
    </div>
  );
  const bg = (s: Slide, k: number, zoom = false) => (
    <>
      {s.image && <img src={s.image} alt="" loading={k === 0 ? "eager" : "lazy"} className={`absolute inset-0 h-full w-full object-cover ${zoom && k === i ? "kenburns" : ""}`} />}
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
    </>
  );
  const frame = "relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-ink";

  let body: React.ReactNode;
  if (style === "fade") {
    body = (
      <div className={`${frame} min-h-[360px] md:min-h-[500px]`}>
        {slides.map((s, k) => (
          <div key={k} aria-hidden={k !== i} className={`absolute inset-0 transition-opacity duration-1000 ${k === i ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            {bg(s, k, true)}
            <div className="relative mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-3 p-8 text-center text-white md:p-14"><Copy s={s} level={level} tab={k === i} /></div>
          </div>
        ))}
        {arrows}{dots}
      </div>
    );
  } else if (style === "cards") {
    body = (
      <div className="relative">
        <div ref={track} onScroll={(e) => { const el = e.currentTarget; const w = (el.children[0] as HTMLElement | undefined)?.offsetWidth ?? 1; setI(Math.max(0, Math.min(n - 1, Math.round(el.scrollLeft / (w + 16))))); }} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[6%] pb-2">
          {slides.map((s, k) => (
            <div key={k} className={`${frame} min-h-[320px] w-[88%] shrink-0 snap-center transition-transform duration-500 md:min-h-[420px] md:w-[72%] ${k === i ? "scale-100" : "scale-[0.94] opacity-80"}`}>
              {bg(s, k)}
              <div className="relative flex min-h-[320px] max-w-md flex-col justify-end gap-2 p-7 text-white md:min-h-[420px] md:p-10"><Copy s={s} level={level} tab /></div>
            </div>
          ))}
        </div>
        {arrows}
        {n > 1 && <div className="mt-3 flex justify-center gap-2">{slides.map((_, k) => <button key={k} aria-label={`Slide ${k + 1}`} aria-current={k === i} onClick={() => go(k)} className={`h-2 rounded-full bg-ink transition-all ${k === i ? "w-7" : "w-2 opacity-30"}`} />)}</div>}
      </div>
    );
  } else if (style === "split") {
    body = (
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
          {slides.map((s, k) => (
            <div key={k} aria-hidden={k !== i} className="grid w-full shrink-0 md:min-h-[440px] md:grid-cols-2">
              <div className="flex flex-col justify-center gap-3 p-8 md:p-14"><Copy s={s} level={level} tab={k === i} dark={false} /></div>
              <div className="relative min-h-[240px] bg-gradient-to-br from-accent/25 to-paper">{s.image && <img src={s.image} alt="" loading={k === 0 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />}</div>
            </div>
          ))}
        </div>
        {arrows}
        {n > 1 && <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2">{slides.map((_, k) => <button key={k} aria-label={`Slide ${k + 1}`} aria-current={k === i} onClick={() => go(k)} className={`h-2 rounded-full bg-ink transition-all ${k === i ? "w-7" : "w-2 opacity-30"}`} />)}</div>}
      </div>
    );
  } else {
    body = (
      <div className={frame}>
        <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
          {slides.map((s, k) => (
            <div key={k} aria-hidden={k !== i} className="relative min-h-[320px] w-full shrink-0 md:min-h-[460px]">
              {bg(s, k)}
              <div className="relative flex min-h-[320px] max-w-xl flex-col justify-center gap-3 p-8 text-white md:min-h-[460px] md:p-14"><Copy s={s} level={level} tab={k === i} /></div>
            </div>
          ))}
        </div>
        {arrows}{dots}
      </div>
    );
  }

  return <section aria-roledescription="carousel" aria-label="Featured" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className="mx-auto max-w-7xl px-3 py-6 md:px-8 md:py-8">{body}</section>;
}
