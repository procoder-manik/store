export const TAGS = ["new", "hot", "bestseller", "featured", "sale"] as const;
export type ProductTag = (typeof TAGS)[number];

/** Every tag has its own colour so shoppers can tell them apart at a glance. */
export const TAG_INFO: Record<ProductTag, { label: string; className: string; icon: "sparkle" | "flame" | "award" | "star" | "percent" }> = {
  new: { label: "New", className: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white", icon: "sparkle" },
  hot: { label: "Hot", className: "bg-gradient-to-r from-orange-500 to-rose-500 text-white", icon: "flame" },
  bestseller: { label: "Best seller", className: "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950", icon: "award" },
  featured: { label: "Featured", className: "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white", icon: "star" },
  sale: { label: "Sale", className: "bg-gradient-to-r from-red-600 to-rose-500 text-white", icon: "percent" },
};

export const isTag = (v: string): v is ProductTag => (TAGS as readonly string[]).includes(v);
