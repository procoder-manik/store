import { z } from "zod";
import { isAllowedImageUrl } from "@/lib/utils";

/** Products listed from a supplier keep that supplier's picture links, which are only accepted on product images. */
export function isSourceImage(u: string): boolean {
  try {
    const x = new URL(u);
    return x.protocol === "https:" && x.hostname === "img.kwcdn.com" && x.pathname.startsWith("/product/");
  } catch {
    return false;
  }
}

/** A product video lives in our own storage, never on someone else's server. Empty means no video. */
export function isOwnVideoUrl(v: string): boolean {
  if (v === "") return true;
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const u = new URL(v);
    if (u.protocol === "https:" && u.host === "goods-vod.kwcdn.com" && u.pathname.startsWith("/goods-video/") && /\.mp4$/i.test(u.pathname)) return true; // a supplier's own video link
    return !!base && u.protocol === "https:" && u.host === new URL(base).host && u.pathname.startsWith("/storage/v1/object/public/product-videos/") && /\.(mp4|webm)$/i.test(u.pathname);
  } catch {
    return false;
  }
}

export const variantSchema =z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().min(1, "Every variant needs a SKU").max(64),
  colorName: z.string().trim().max(40),
  colorHex: z.union([z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must look like #aabbcc"), z.literal("")]),
  size: z.string().trim().max(30),
  priceDelta: z.number().min(-1_000_000).max(1_000_000),
  stock: z.number().int("Stock must be a whole number").min(0).max(1_000_000),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z.string().trim().max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only use lowercase letters, numbers and dashes").or(z.literal("")),
  kind: z.enum(["tee", "hoodie", "cover", "decor"]),
  categoryId: z.string().uuid().nullable(),
  description: z.string().max(5000),
  basePrice: z.number().min(0, "Price cannot be negative").max(10_000_000),
  compareAtPrice: z.number().min(0).max(10_000_000).nullable(),
  tags: z.array(z.enum(["new", "hot", "bestseller", "featured", "sale"])).max(5),
  offerEndsAt: z.string().max(40),
  preorder: z.boolean().default(false),
  preorderDate: z.string().max(10).default(""),
  status: z.enum(["draft", "active", "archived"]),
  videoUrl: z.string().trim().max(500).refine(isOwnVideoUrl, "The video must be uploaded here as an MP4 or WebM file").default(""),
  seoTitle: z.string().max(70),
  seoDescription: z.string().max(170),
  variants: z.array(variantSchema).max(200),
  images: z.array(z.object({
    path: z.union([
      z.string().regex(/^[a-zA-Z0-9._-]+$/).max(120),
      z.string().max(500).refine((u) => isAllowedImageUrl(u) || isSourceImage(u), "Image links must come from Pexels, Unsplash or Pixabay"),
    ]),
    alt: z.string().max(200),
  })).max(60),
  relatedIds: z.array(z.string().uuid()).max(12),
});

export type ProductPayload = z.infer<typeof productSchema>;
