import { z } from "zod";
import { isAllowedImageUrl } from "@/lib/utils";

const text = (max: number) => z.string().trim().max(max);
const image = z.union([z.literal(""), z.string().max(500).refine(isAllowedImageUrl, "Image links must come from Pexels, Unsplash or Pixabay")]);
const link = z.string().trim().max(300).refine((v) => v === "" || v.startsWith("/") || v.startsWith("https://"), "Links must start with / or https://");
const id = z.string().max(60);

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ id, type: z.literal("hero"), heading: text(120), sub: text(240), image, button: text(30), link, align: z.enum(["left", "center"]) }),
  z.object({ id, type: z.literal("text"), heading: text(120), body: text(4000) }),
  z.object({ id, type: z.literal("products"), title: text(80), source: z.enum(["all", "category", "tag"]), category: text(80), tag: z.enum(["new", "hot", "featured", "sale"]), count: z.number().int().min(2).max(12) }),
  z.object({ id, type: z.literal("categories"), title: text(80) }),
  z.object({ id, type: z.literal("banner"), title: text(80), sub: text(160), image, button: text(30), link }),
  z.object({ id, type: z.literal("features"), title: text(80), items: z.array(z.object({ title: text(60), text: text(200) })).max(6) }),
  z.object({ id, type: z.literal("faq"), title: text(80), items: z.array(z.object({ q: text(160), a: text(800) })).max(12) }),
  z.object({ id, type: z.literal("image"), image, caption: text(160), link }),
  z.object({ id, type: z.literal("cta"), heading: text(120), text: text(240), button: text(30), link }),
]);
export const blocksSchema = z.array(blockSchema).max(40);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];

export const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero", text: "Text", products: "Products", categories: "Categories", banner: "Banner", features: "Features", faq: "Questions", image: "Image", cta: "Call to action",
};

export function newBlock(type: BlockType): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case "hero": return { id, type, heading: "A headline that sells", sub: "One line about what you offer.", image: "", button: "Shop now", link: "/shop", align: "left" };
    case "text": return { id, type, heading: "", body: "Write your text here." };
    case "products": return { id, type, title: "Our picks", source: "all", category: "", tag: "featured", count: 4 };
    case "categories": return { id, type, title: "Shop by category" };
    case "banner": return { id, type, title: "Banner title", sub: "", image: "", button: "Learn more", link: "/shop" };
    case "features": return { id, type, title: "Why shop with us", items: [{ title: "Cash on delivery", text: "Pay when it arrives." }, { title: "Real stock", text: "Sold out options are marked." }, { title: "Fast support", text: "We answer questions quickly." }] };
    case "faq": return { id, type, title: "Questions", items: [{ q: "How do I pay?", a: "You pay in cash when your order arrives." }] };
    case "image": return { id, type, image: "", caption: "", link: "" };
    case "cta": return { id, type, heading: "Ready to order?", text: "Pick your favorites and order in a minute.", button: "Start shopping", link: "/shop" };
  }
}
