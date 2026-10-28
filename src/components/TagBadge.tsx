import { Award, Flame, Percent, Sparkles, Star } from "lucide-react";
import { TAG_INFO, type ProductTag } from "@/lib/tags";

const ICONS = { sparkle: Sparkles, flame: Flame, award: Award, star: Star, percent: Percent };

/** A small coloured label such as New, Hot, Best seller, Featured or Sale. */
export function TagBadge({ tag, text, size = "sm" }: { tag: ProductTag; text?: string; size?: "sm" | "md" }) {
  const t = TAG_INFO[tag];
  const Icon = ICONS[t.icon];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold shadow-sm ${size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-1 text-[11px]"} ${t.className}`}>
      <Icon size={size === "md" ? 12 : 11} strokeWidth={2.4} />{text ?? t.label}
    </span>
  );
}
