import { z } from "zod";
import { isAllowedImageUrl } from "@/lib/utils";

export const variantSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().trim().min(1, "Every variant needs a SKU").max(64),
  colorName: z.string().trim().max(40),
  colorHex: z.union([z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must look like #aabbcc"), z.literal("")]),
  size: z.string().trim().max(20),
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
  tags: z.array(z.enum(["new", "hot", "featured", "sale"])).max(4),
  status: z.enum(["draft", "active", "archived"]),
  seoTitle: z.string().max(70),
  seoDescription: z.string().max(170),
  variants: z.array(variantSchema).max(200),
  images: z.array(z.object({
    path: z.union([
      z.string().regex(/^[a-zA-Z0-9._-]+$/).max(120),
      z.string().max(500).refine(isAllowedImageUrl, "Image links must come from Pexels, Unsplash or Pixabay"),
    ]),
    alt: z.string().max(200),
  })).max(12),
  relatedIds: z.array(z.string().uuid()).max(12),
});

export type ProductPayload = z.infer<typeof productSchema>;
