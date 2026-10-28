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
    <button aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-20 left-3 z-40 flex h-11 items-center gap-1.5 rounded-pill border border-line bg-surface px-4 text-xs font-semibold shadow-lg transition hover:-translate-y-0.5 md:bottom-5 md:left-5">
      <ArrowUp size={14} /> Back to Top
    </button>
  );
}
