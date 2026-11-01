"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders overlays at the end of <body>.
 * A parent with backdrop-filter or transform (like the blurred sticky header) traps position: fixed children inside its own box,
 * which is why the mobile menu and search used to open squeezed under the header instead of covering the screen.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready ? createPortal(children, document.body) : null;
}

/** Stops the page behind an open overlay from scrolling, and closes the overlay with Escape. */
export function useOverlay(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [open, close]);
}
