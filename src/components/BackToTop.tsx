"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 500);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!show) return null;
  return (
    <button aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="float-lift fixed bottom-4 right-3 z-40 flex h-11 w-11 items-center justify-center gap-1.5 rounded-pill border border-line bg-surface text-xs md:w-auto md:px-4 font-semibold shadow-lg transition hover:-translate-y-0.5 md:bottom-5 md:right-5">
      <ArrowUp size={14} /> <span className="hidden md:inline">Back to Top</span>
    </button>
  );
}
