"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

/** The thin top banner. Visitors can close it; it stays closed for the visit and returns when the text changes. */
export function AnnouncementBar({ text, link }: { text: string; link: string }) {
  const key = `ann:${text}`;
  const [hidden, setHidden] = useState(false);
  useEffect(() => { try { setHidden(sessionStorage.getItem(key) === "1"); } catch { /* storage blocked */ } }, [key]);
  if (hidden) return null;
  const cls = "block flex-1 px-4 py-2 text-center text-xs";
  return (
    <div className="relative flex items-center bg-ink text-paper">
      {link ? <Link href={link} className={cls}>{text}</Link> : <div className={cls}>{text}</div>}
      <button aria-label="Close banner" onClick={() => { setHidden(true); try { sessionStorage.setItem(key, "1"); } catch { /* ignore */ } }} className="mr-2 grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-white/15"><X size={14} /></button>
    </div>
  );
}
