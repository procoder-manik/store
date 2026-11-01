import { TAG_INFO, type ProductTag } from "@/lib/tags";

/** A small word label such as New, Best seller or Sale. */
export function TagBadge({ tag, text, size = "sm" }: { tag: ProductTag; text?: string; size?: "sm" | "md" }) {
  const t = TAG_INFO[tag];
  return <span className={`inline-block font-medium tracking-wide ${size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]"} ${t.className}`}>{text ?? t.label}</span>;
}
