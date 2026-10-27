"use client";

import { useEffect, useRef } from "react";

export type RevealAnim = "fade" | "up" | "zoom" | "left" | "right";

/** Brings a section in once when it scrolls into view, in the style you pick. */
export function Reveal({ children, className = "", anim = "up" }: { children: React.ReactNode; className?: string; anim?: RevealAnim }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Also reveal when the visitor jumped past this section, so nothing stays hidden.
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting || e.boundingClientRect.top < 0) { el.classList.add("in"); io.disconnect(); } }, { rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} data-anim={anim} className={`reveal ${className}`}>{children}</div>;
}
