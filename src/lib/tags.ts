export const TAGS = ["new", "hot", "bestseller", "featured", "sale"] as const;
export type ProductTag = (typeof TAGS)[number];

/** Quiet word labels on the product picture. Only a sale stands out. */
export const TAG_INFO: Record<ProductTag, { label: string; className: string; icon: "sparkle" | "flame" | "award" | "star" | "percent" }> = {
  new: { label: "New", className: "bg-surface text-ink", icon: "sparkle" },
  hot: { label: "Hot", className: "bg-surface text-ink", icon: "flame" },
  bestseller: { label: "Best seller", className: "bg-surface text-ink", icon: "award" },
  featured: { label: "Featured", className: "bg-surface text-ink", icon: "star" },
  sale: { label: "Sale", className: "bg-[var(--madder)] text-white", icon: "percent" },
};

export const isTag = (v: string): v is ProductTag => (TAGS as readonly string[]).includes(v);
