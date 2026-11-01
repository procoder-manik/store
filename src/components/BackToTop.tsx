"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop({ withText = false }: { withText?: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 500);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!show) return null;
  return (
    <button aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={`float-lift fixed bottom-4 right-3 z-40 flex h-11 items-center justify-center gap-1.5 rounded-pill border border-line bg-surface text-xs font-semibold shadow-lg transition hover:-translate-y-0.5 md:bottom-5 md:right-5 ${withText ? "px-4" : "w-11"}`}>
      <ArrowUp size={16} />{withText && " Back to Top"}
    </button>
  );
}
