import { z } from "zod";
import { isAllowedImageUrl } from "@/lib/utils";

const text = (max: number) => z.string().trim().max(max);
const image = z.union([z.literal(""), z.string().max(500).refine(isAllowedImageUrl, "Image links must come from Pexels, Unsplash or Pixabay")]);
const link = z.string().trim().max(300).refine((v) => v === "" || v.startsWith("/") || v.startsWith("#") || v.startsWith("https://"), "Links must start with /, # or https://");
const id = z.string().max(60);
const uuid = z.string().uuid();
const level = z.enum(["h1", "h2", "h3", "h4", "h5", "h6"]).default("h2");
const anim = z.enum(["none", "fade", "up", "zoom", "left", "right"]).default("up");
export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
export type Anim = "none" | "fade" | "up" | "zoom" | "left" | "right";

const offer = z.object({
  id: z.string().min(1).max(40),
  label: text(60).min(1, "Every offer needs a name"),
  badge: text(24),
  items: z.array(z.object({ productId: uuid, qty: z.number().int().min(1).max(20) })).min(1, "Every offer needs at least one product").max(4),
  price: z.number().gt(0, "Every offer needs a price").max(10_000_000),
});
export type Offer = z.infer<typeof offer>;

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ id, anim, level, type: z.literal("hero"), heading: text(120), sub: text(240), image, button: text(30), link, align: z.enum(["left", "center"]), variant: z.enum(["overlay", "center", "split", "aurora", "bold"]).default("overlay") }),
  z.object({ id, anim, level, type: z.literal("rail3d"), heading: text(120), sub: text(240), button: text(30), link, button2: text(30), link2: link, style: z.enum(["hanger", "arc", "coverflow", "diagonal", "stack", "wave"]), source: z.enum(["all", "category", "tag"]), category: text(80), tag: z.enum(["new", "hot", "featured", "sale"]), showHero: z.boolean() }),
  z.object({ id, anim, level, type: z.literal("slider"), style: z.enum(["slide", "fade", "cards", "split"]).default("slide"), slides: z.array(z.object({ title: text(80), sub: text(160), image, button: text(30), link })).min(1).max(6) }),
  z.object({ id, anim, level, type: z.literal("spotlight"), productId: z.union([z.literal(""), uuid]), heading: text(80), button: text(30) }),
  z.object({ id, anim, level, type: z.literal("pagehead"), title: text(120), intro: text(400) }),
  z.object({ id, anim, level, type: z.literal("text"), heading: text(120), body: text(4000) }),
  z.object({ id, anim, level, type: z.literal("products"), title: text(80), source: z.enum(["all", "category", "tag"]), category: text(80), tag: z.enum(["new", "hot", "featured", "sale"]), count: z.number().int().min(2).max(12) }),
  z.object({ id, anim, level, type: z.literal("categories"), title: text(80) }),
  z.object({ id, anim, level, type: z.literal("banners"), title: text(80) }),
  z.object({ id, anim, level, type: z.literal("banner"), title: text(80), sub: text(160), image, button: text(30), link }),
  z.object({ id, anim, level, type: z.literal("features"), title: text(80), items: z.array(z.object({ title: text(60), text: text(200) })).max(6) }),
  z.object({ id, anim, level, type: z.literal("faq"), title: text(80), items: z.array(z.object({ q: text(160), a: text(800) })).max(12) }),
  z.object({ id, anim, level, type: z.literal("image"), image, caption: text(160), link }),
  z.object({ id, anim, level, type: z.literal("newsletter"), title: text(80), text: text(200) }),
  z.object({ id, anim, level, type: z.literal("cta"), heading: text(120), text: text(240), button: text(30), link }),
  z.object({ id, anim, level, type: z.literal("marquee"), items: z.array(text(60)).min(1).max(10), speed: z.enum(["slow", "normal", "fast"]), look: z.enum(["plain", "accent", "dark"]) }),
  z.object({ id, anim, level, type: z.literal("stats"), title: text(80), items: z.array(z.object({ value: z.number().min(0).max(1_000_000_000), suffix: text(8), label: text(40) })).min(1).max(4) }),
  z.object({ id, anim, level, type: z.literal("testimonials"), title: text(80), items: z.array(z.object({ quote: text(300), name: text(60), role: text(60) })).min(1).max(6) }),
  z.object({ id, anim, level, type: z.literal("countdown"), title: text(80), text: text(200), endsAt: text(30), button: text(30), link }),
  z.object({ id, anim, level, type: z.literal("gallery"), title: text(80), images: z.array(z.object({ src: image, caption: text(80) })).min(1).max(8) }),
  z.object({ id, anim, level, type: z.literal("order"), heading: text(80), cta: text(30), multi: z.boolean(), offers: z.array(offer).min(1, "Add at least one offer").max(8) }),
]);
export const blocksSchema = z.array(blockSchema).max(40);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];

export const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero banner", rail3d: "3D product slider", slider: "Image slider", spotlight: "Product spotlight", pagehead: "Page title",
  marquee: "Scrolling ticker", stats: "Numbers that count up", testimonials: "Customer words", countdown: "Countdown timer", gallery: "Photo gallery",
  text: "Text", products: "Products", categories: "Categories", banners: "Offer banners", banner: "Banner", features: "Features",
  faq: "Questions", image: "Image", newsletter: "Email sign up", cta: "Call to action", order: "Order form with offers",
};

export const BLOCK_GROUPS: { title: string; types: BlockType[] }[] = [
  { title: "Top of the page", types: ["hero", "rail3d", "slider", "spotlight", "pagehead"] },
  { title: "Products", types: ["products", "categories", "banners", "banner"] },
  { title: "Eye-catching", types: ["marquee", "stats", "countdown", "gallery", "testimonials"] },
  { title: "Content", types: ["text", "image", "features", "faq", "newsletter", "cta"] },
  { title: "Selling", types: ["order"] },
];

export type RailStyle = "hanger" | "arc" | "coverflow" | "diagonal" | "stack" | "wave";
export const RAIL_STYLES: { id: RailStyle; name: string }[] = [
  { id: "hanger", name: "Hanger rail" }, { id: "arc", name: "Curved ring" }, { id: "coverflow", name: "Cover flow" },
  { id: "diagonal", name: "Diagonal sweep" }, { id: "stack", name: "Card deck" }, { id: "wave", name: "Flowing wave" },
];
export const SLIDER_STYLES: { id: "slide" | "fade" | "cards" | "split"; name: string }[] = [
  { id: "slide", name: "Slide, full width" }, { id: "fade", name: "Fade with slow zoom" }, { id: "cards", name: "Cards with a peek of the next" }, { id: "split", name: "Text beside the picture" },
];
export const HEADING_LEVELS: HeadingLevel[] = ["h1", "h2", "h3", "h4", "h5", "h6"];
export const ANIMATIONS: { id: Anim; name: string }[] = [
  { id: "up", name: "Rise up" }, { id: "fade", name: "Fade in" }, { id: "zoom", name: "Zoom in" }, { id: "left", name: "Slide from the left" }, { id: "right", name: "Slide from the right" }, { id: "none", name: "No animation" },
];

export function newBlock(type: BlockType): Block {
  const id = crypto.randomUUID();
  const base = { id, level: "h2" as HeadingLevel, anim: "up" as Anim };
  switch (type) {
    case "hero": return { ...base, type, heading: "A headline that sells", sub: "One line about what you offer.", image: "", button: "Shop now", link: "/shop", align: "left", variant: "overlay" };
    case "rail3d": return { ...base, type, heading: "Pick it off the rail.", sub: "", button: "Shop everything", link: "/shop", button2: "New in", link2: "/shop?tag=new", style: "hanger", source: "all", category: "", tag: "featured", showHero: true };
    case "slider": return { ...base, type, style: "slide", slides: [{ title: "First slide", sub: "Tell people what is new", image: "", button: "Shop now", link: "/shop" }] };
    case "spotlight": return { ...base, type, productId: "", heading: "Featured", button: "View product" };
    case "pagehead": return { ...base, type, title: "Page title", intro: "" };
    case "text": return { ...base, type, heading: "", body: "Write your text here." };
    case "products": return { ...base, type, title: "Our picks", source: "all", category: "", tag: "featured", count: 4 };
    case "categories": return { ...base, type, title: "Shop by category" };
    case "banners": return { ...base, type, title: "" };
    case "banner": return { ...base, type, title: "Banner title", sub: "", image: "", button: "Learn more", link: "/shop" };
    case "features": return { ...base, type, title: "Why shop with us", items: [{ title: "Cash on delivery", text: "Pay when it arrives." }, { title: "Real stock", text: "Sold out options are marked." }, { title: "Fast support", text: "We answer questions quickly." }] };
    case "faq": return { ...base, type, title: "Questions", items: [{ q: "How do I pay?", a: "You pay in cash when your order arrives." }] };
    case "image": return { ...base, type, image: "", caption: "", link: "" };
    case "newsletter": return { ...base, type, title: "Get new arrivals and offers", text: "Join our email list. No spam." };
    case "cta": return { ...base, type, heading: "Ready to order?", text: "Pick your favorites and order in a minute.", button: "Start shopping", link: "/shop" };
    case "marquee": return { ...base, type, items: ["Free delivery over 3,000 taka", "Cash on delivery", "New arrivals every week"], speed: "normal", look: "accent" };
    case "stats": return { ...base, type, title: "", items: [{ value: 5000, suffix: "+", label: "Happy customers" }, { value: 120, suffix: "", label: "Products" }, { value: 64, suffix: "", label: "Districts delivered to" }] };
    case "testimonials": return { ...base, type, title: "What customers say", items: [{ quote: "Write a real customer review here.", name: "Customer name", role: "Dhaka" }] };
    case "countdown": return { ...base, type, title: "Offer ends soon", text: "Order before the timer reaches zero.", endsAt: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 16), button: "Shop now", link: "/shop" };
    case "gallery": return { ...base, type, title: "", images: [{ src: "", caption: "" }, { src: "", caption: "" }, { src: "", caption: "" }] };
    case "order": return { ...base, type, heading: "Choose your offer", cta: "Order now", multi: false, offers: [{ id: crypto.randomUUID().slice(0, 8), label: "Buy 1", badge: "", items: [], price: 0 }] };
  }
}
