export type Kind = "tee" | "hoodie" | "cover" | "decor";
export type Tag = "new" | "hot" | "bestseller" | "featured" | "sale";
export type ColorOpt = { name: string; hex: string; delta: number };

export type VariantOpt = { id: string; colorName: string; size: string; priceDelta: number; stock: number };

export type Product = {
  id: string;
  slug: string;
  name: string;
  kind: Kind;
  category: string;
  basePrice: number;
  tags: Tag[];
  description: string;
  colors: ColorOpt[];
  sizes: string[];
  hasColors?: boolean;
  variants?: VariantOpt[];
  image?: string;
  images?: { url: string; alt: string }[];
  compareAt?: number | null;
  related?: string[];
  updatedAt?: string;
  offerEndsAt?: string;
  seo?: { title?: string; description?: string };
};

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "tshirts", label: "T-shirts" },
  { id: "hoodies", label: "Hoodies" },
  { id: "bedding", label: "Bedding" },
  { id: "decor", label: "Home decor" },
];

const S = ["S", "M", "L", "XL"];

export const DEMO_PRODUCTS: Omit<Product, "slug">[] = [
  { id: "p1", name: "Heavyweight Tee", kind: "tee", category: "tshirts", basePrice: 850, tags: ["new"], description: "240 GSM combed cotton with a boxy cut. Pre-washed to hold its shape.", colors: [{ name: "Sage", hex: "#8fa88b", delta: 0 }, { name: "Ink", hex: "#23262d", delta: 0 }, { name: "Sand", hex: "#d6c7a8", delta: 50 }], sizes: S },
  { id: "p2", name: "Everyday Hoodie", kind: "hoodie", category: "hoodies", basePrice: 1850, tags: ["hot", "featured"], description: "Fleece-lined pullover with a double-layer hood and kangaroo pocket.", colors: [{ name: "Slate", hex: "#5f6b7a", delta: 0 }, { name: "Rust", hex: "#a8553a", delta: 100 }, { name: "Bone", hex: "#e4dfd5", delta: 0 }], sizes: S },
  { id: "p3", name: "Linen Bedsheet Set", kind: "cover", category: "bedding", basePrice: 3200, tags: ["featured"], description: "Washed linen flat sheet with two pillow covers. Softer after every wash.", colors: [{ name: "Fog", hex: "#c9ced6", delta: 0 }, { name: "Olive", hex: "#7d8561", delta: 150 }, { name: "Clay", hex: "#c68c6d", delta: 150 }], sizes: ["Single", "Double", "King"] },
  { id: "p4", name: "Round Wall Mirror", kind: "decor", category: "decor", basePrice: 2400, tags: ["new"], description: "Brushed brass frame, 60 cm. Ships with a wall mount kit.", colors: [{ name: "Brass", hex: "#b8935a", delta: 0 }, { name: "Black", hex: "#2a2c31", delta: 0 }], sizes: [] },
  { id: "p5", name: "Oversized Tee", kind: "tee", category: "tshirts", basePrice: 950, tags: ["sale"], description: "Drop-shoulder fit in a soft cotton jersey.", colors: [{ name: "Cobalt", hex: "#3c58b0", delta: 0 }, { name: "White", hex: "#f1f1ee", delta: 0 }], sizes: S },
  { id: "p6", name: "Zip Hoodie", kind: "hoodie", category: "hoodies", basePrice: 2100, tags: [], description: "Full-zip with a brushed interior and ribbed cuffs.", colors: [{ name: "Charcoal", hex: "#3b3f46", delta: 0 }, { name: "Moss", hex: "#58694f", delta: 80 }], sizes: S },
  { id: "p7", name: "Quilted Bed Cover", kind: "cover", category: "bedding", basePrice: 4500, tags: ["hot"], description: "Lightweight quilted cover for all seasons.", colors: [{ name: "Ivory", hex: "#e8e2d4", delta: 0 }, { name: "Dusk", hex: "#6c7390", delta: 200 }], sizes: ["Double", "King"] },
  { id: "p8", name: "Ceramic Table Lamp", kind: "decor", category: "decor", basePrice: 3100, tags: ["featured"], description: "Hand-glazed base with a linen shade. E27 fitting.", colors: [{ name: "Glaze", hex: "#9bb2a6", delta: 0 }, { name: "Cream", hex: "#e6dcc6", delta: 0 }], sizes: [] },
];
