"use client";

import { useEffect, useState } from "react";

/** When asking is on, tracking scripts only load after the visitor accepts. */
export function ConsentGate({ ask, children }: { ask: boolean; children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "unknown" | "yes" | "no">("loading");
  useEffect(() => {
    if (!ask) return;
    try { const v = localStorage.getItem("consent"); setState(v === "yes" ? "yes" : v === "no" ? "no" : "unknown"); } catch { setState("unknown"); }
  }, [ask]);

  if (!ask) return <>{children}</>;
  const choose = (v: "yes" | "no") => { setState(v); try { localStorage.setItem("consent", v); } catch { /* storage blocked */ } };
  return (
    <>
      {state === "yes" && children}
      {state === "unknown" && (
        <div role="dialog" aria-label="Cookies" className="pop-in fixed inset-x-3 bottom-3 z-[55] rounded-2xl border border-line bg-surface p-4 shadow-2xl md:left-5 md:right-auto md:max-w-md">
          <p className="text-sm">We use cookies to count visits and measure our ads. You can say no and still shop as normal.</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => choose("yes")} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">Accept</button>
            <button onClick={() => choose("no")} className="rounded-full border border-line px-5 py-2 text-sm font-medium">No thanks</button>
          </div>
        </div>
      )}
    </>
  );
}
