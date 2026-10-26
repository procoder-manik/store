"use client";

import { Heart, Scale } from "lucide-react";
import { useCompare, useMounted, useWishlist } from "@/lib/lists";

export function HeartButton({ id, className = "" }: { id: string; className?: string }) {
  const on = useWishlist((s) => s.ids.includes(id));
  const toggle = useWishlist((s) => s.toggle);
  const active = useMounted() && on;
  return (
    <button type="button" aria-pressed={active} aria-label={active ? "Remove from wishlist" : "Save to wishlist"} onClick={() => toggle(id)} className={`grid h-9 w-9 place-items-center rounded-full bg-surface/90 shadow backdrop-blur transition hover:scale-110 ${className}`}>
      <Heart size={16} className={active ? "text-red-500" : ""} fill={active ? "currentColor" : "none"} />
    </button>
  );
}

export function ListButtons({ id }: { id: string }) {
  const wish = useWishlist((s) => s.ids.includes(id));
  const toggleWish = useWishlist((s) => s.toggle);
  const cmp = useCompare((s) => s.ids.includes(id));
  const full = useCompare((s) => s.ids.length >= 4);
  const toggleCmp = useCompare((s) => s.toggle);
  const m = useMounted();
  return (
    <div className="mt-3 flex gap-5 text-sm text-muted">
      <button type="button" onClick={() => toggleWish(id)} className="flex items-center gap-1.5 hover:text-ink"><Heart size={15} fill={m && wish ? "currentColor" : "none"} className={m && wish ? "text-red-500" : ""} />{m && wish ? "Saved" : "Save"}</button>
      <button type="button" disabled={m && !cmp && full} onClick={() => toggleCmp(id)} title={m && !cmp && full ? "You can compare up to 4 products" : undefined} className="flex items-center gap-1.5 hover:text-ink disabled:opacity-40"><Scale size={15} />{m && cmp ? "In compare" : "Compare"}</button>
    </div>
  );
}
