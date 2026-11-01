export const TAGS = ["new", "hot", "bestseller", "featured", "sale"] as const;
export type ProductTag = (typeof TAGS)[number];

/** Every tag has its own colour so shoppers can tell them apart at a glance. */
export const TAG_INFO: Record<ProductTag, { label: string; className: string; icon: "sparkle" | "flame" | "award" | "star" | "percent" }> = {
  new: { label: "New", className: "bg-[var(--gada)] text-[#10163a]", icon: "sparkle" },
  hot: { label: "Hot", className: "bg-ink text-paper", icon: "flame" },
  bestseller: { label: "Best seller", className: "bg-surface text-ink", icon: "award" },
  featured: { label: "Featured", className: "bg-accent text-accent-ink", icon: "star" },
  sale: { label: "Sale", className: "bg-[var(--madder)] text-white dark:text-[#10163a]", icon: "percent" },
};

export const isTag = (v: string): v is ProductTag => (TAGS as readonly string[]).includes(v);
