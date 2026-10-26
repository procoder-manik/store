"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompare, useMounted } from "@/lib/lists";

export function CompareBar() {
  const n = useCompare((s) => s.ids.length);
  const path = usePathname();
  if (!useMounted() || n === 0 || /^\/(admin|compare|checkout|login)/.test(path)) return null;
  return (
    <Link href="/compare" className="pop-in fixed bottom-36 right-3 z-40 rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper shadow-xl md:bottom-24 md:right-5">Compare ({n})</Link>
  );
}
