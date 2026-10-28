"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Shows custom HTML, CSS and JavaScript exactly as written.
 * It runs inside its own sandboxed frame, so it can never change or break the rest of the store, and it cannot read the visitor's login.
 */
export function HtmlBlock({ code }: { code: string }) {
  const id = useId();
  const frame = useRef<HTMLIFrameElement>(null);
  const [h, setH] = useState(320);

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const d = e.data as { __h?: number; id?: string };
      if (d?.id === id && typeof d.__h === "number") setH(Math.min(6000, Math.max(40, Math.ceil(d.__h))));
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [id]);

  if (!code.trim()) return <section className="mx-auto max-w-6xl px-5 py-8"><div className="grid min-h-32 place-items-center rounded-3xl border border-dashed border-line text-sm text-muted">Paste your HTML code in the builder</div></section>;

  const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>html,body{margin:0}</style></head><body>${code}<script>(function(){var i=${JSON.stringify(id)};function s(){parent.postMessage({__h:document.documentElement.scrollHeight,id:i},"*")}s();addEventListener("load",s);if(window.ResizeObserver)new ResizeObserver(s).observe(document.documentElement);setInterval(s,1000)})()</script></body></html>`;
  return <iframe ref={frame} title="Custom section" sandbox="allow-scripts allow-popups allow-forms" srcDoc={doc} style={{ height: h }} className="block w-full border-0" />;
}
