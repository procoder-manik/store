"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** Remembers a referral code from ?ref=CODE for 60 days, so the friend's order can credit the right person. */
export function RefCapture() {
  const sp = useSearchParams();
  useEffect(() => {
    const code = (sp.get("ref") ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9]{4,12}$/.test(code)) return;
    try { localStorage.setItem("ref", JSON.stringify({ code, at: Date.now() })); } catch { /* storage blocked */ }
  }, [sp]);
  return null;
}

export function readRef(): string {
  try {
    const raw = localStorage.getItem("ref");
    if (!raw) return "";
    const { code, at } = JSON.parse(raw) as { code: string; at: number };
    if (!code || Date.now() - at > 60 * 864e5) return "";
    return code;
  } catch {
    return "";
  }
}
