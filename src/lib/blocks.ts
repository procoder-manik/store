import { z } from "zod";
import { isAllowedImageUrl } from "@/lib/utils";

const text = (max: number) => z.string().trim().max(max);
const image = z.union([z.literal(""), z.string().max(500).refine(isAllowedImageUrl, "Image links must come from Pexels, Unsplash or Pixabay")]);
const link = z.string().trim().max(300).refine((v) => v === "" || v.startsWith("/") || v.startsWith("#") || v.startsWith("https://"), "Links must start with /, # or https://");
const id = z.string().max(60);
const uuid = z.string().uuid();
const level = z.enum(["h1", "h2", "h3", "h4", "h5", "h6", "p"]).default("h2");
// How the heading text looks. All optional: a section with none of these keeps the look it was designed with.
const typo = {
  hsize: z.enum(["design", "tag", "custom"]).optional(),
  hpx: z.number().int().min(10).max(200).optional(),
  hpxm: z.number().int().min(10).max(120).optional(),
  hweight: z.enum(["300", "400", "500", "600", "700", "800", "900"]).optional(),
  hcase: z.enum(["none", "uppercase", "lowercase", "capitalize"]).optional(),
  // Space around the whole section, in pixels. Unset means the section keeps its own spacing.
  pt: z.number().int().min(0).max(300).optional(),
  pb: z.number().int().min(0).max(300).optional(),
  mt: z.number().int().min(-100).max(300).optional(),
  mb: z.number().int().min(-100).max(300).optional(),
  pl: z.number().int().min(0).max(300).optional(),
  pr: z.number().int().min(0).max(300).optional(),
  ml: z.number().int().min(-100).max(300).optional(),
  mr: z.number().int().min(-100).max(300).optional(),
};
const anim = z.enum(["none", "fade", "up", "zoom", "left", "right"]).default("up");
const common = { id, anim, level, ...typo };
export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
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
  z.object({ ...common, type: z.literal("hero"), heading: text(120), sub: text(240), image, button: text(30), link, align: z.enum(["left", "center"]), variant: z.enum(["overlay", "center", "split", "aurora", "bold"]).default("overlay") }),
  z.object({ ...common, type: z.literal("herofull"), heading: text(120), sub: text(240), image, button: text(30), link, align: z.enum(["left", "center"]), variant: z.enum(["overlay", "center", "split", "aurora", "bold"]).default("overlay") }),
  z.object({ ...common, type: z.literal("showcase"), eyebrow: text(40), heading: text(120), sub: text(300), button: text(30), tagline: text(100), source: z.enum(["all", "category", "tag"]), category: text(80), tag: z.enum(["new", "hot", "bestseller", "featured", "sale"]), autoplay: z.number().int().min(0).max(20), fit: z.enum(["cutout", "card"]), showNav: z.boolean(), facebook: link, instagram: link, youtube: link, whatsapp: link }),
  z.object({ ...common, type: z.literal("showcasefull"), eyebrow: text(40), heading: text(120), sub: text(300), button: text(30), tagline: text(100), source: z.enum(["all", "category", "tag"]), category: text(80), tag: z.enum(["new", "hot", "bestseller", "featured", "sale"]), autoplay: z.number().int().min(0).max(20), fit: z.enum(["cutout", "card"]), showNav: z.boolean(), facebook: link, instagram: link, youtube: link, whatsapp: link }),
  z.object({ ...common, type: z.literal("rail3d"), heading: text(120), sub: text(240), button: text(30), link, button2: text(30), link2: link, style: z.enum(["hanger", "hanger-wire", "hanger-gold", "hanger-velvet", "arc", "coverflow", "diagonal", "stack", "wave"]), source: z.enum(["all", "category", "tag"]), category: text(80), tag: z.enum(["new", "hot", "bestseller", "featured", "sale"]), showHero: z.boolean(), defaultView: z.enum(["3d", "grid"]).default("3d"), arrows: z.enum(["sides", "off", "top-right", "bottom-left", "bottom-center", "bottom-right"]).optional(), pills: z.enum(["off", "left", "center", "right"]).optional(), headAlign: z.enum(["left", "center"]).optional(), textBg: z.enum(["none", "theme", "gradient", "custom"]).optional(), textBgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional() }),
  z.object({ ...common, type: z.literal("rail3dfull"), heading: text(120), sub: text(240), button: text(30), link, button2: text(30), link2: link, style: z.enum(["hanger", "hanger-wire", "hanger-gold", "hanger-velvet", "arc", "coverflow", "diagonal", "stack", "wave"]), source: z.enum(["all", "category", "tag"]), category: text(80), tag: z.enum(["new", "hot", "bestseller", "featured", "sale"]), showHero: z.boolean(), defaultView: z.enum(["3d", "grid"]).default("3d"), arrows: z.enum(["sides", "off", "top-right", "bottom-left", "bottom-center", "bottom-right"]).optional(), pills: z.enum(["off", "left", "center", "right"]).optional(), headAlign: z.enum(["left", "center"]).optional(), textBg: z.enum(["none", "theme", "gradient", "custom"]).optional(), textBgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional() }),
  z.object({ ...common, type: z.literal("slider"), style: z.enum(["slide", "fade", "cards", "split"]).default("slide"), slides: z.array(z.object({ title: text(80), sub: text(160), image, button: text(30), link })).min(1).max(6) }),
  z.object({ ...common, type: z.literal("sliderfull"), style: z.enum(["slide", "fade", "cards", "split"]).default("slide"), slides: z.array(z.object({ title: text(80), sub: text(160), image, button: text(30), link })).min(1).max(6) }),
  z.object({ ...common, type: z.literal("spotlight"), productId: z.union([z.literal(""), uuid]), heading: text(80), button: text(30) }),
  z.object({ ...common, type: z.literal("pagehead"), title: text(120), intro: text(400) }),
  z.object({ ...common, type: z.literal("text"), heading: text(120), body: text(4000) }),
  z.object({ ...common, type: z.literal("richtext"), parts: z.array(z.discriminatedUnion("t", [
    z.object({ t: z.literal("heading"), text: text(160), level }),
    z.object({ t: z.literal("paragraph"), text: text(2000) }),
    z.object({ t: z.literal("list"), items: z.array(text(300)).max(12) }),
    z.object({ t: z.literal("link"), text: text(80), href: link, style: z.enum(["link", "button", "outline"]) }),
    z.object({ t: z.literal("quote"), text: text(400), by: text(60) }),
    z.object({ t: z.literal("divider") }),
  ])).max(40), width: z.enum(["narrow", "wide"]) }),
  z.object({ ...common, type: z.literal("products"), title: text(80), source: z.enum(["all", "category", "tag"]), category: text(80), tag: z.enum(["new", "hot", "bestseller", "featured", "sale"]), count: z.number().int().min(2).max(12) }),
  z.object({ ...common, type: z.literal("categories"), title: text(80) }),
  z.object({ ...common, type: z.literal("banners"), title: text(80) }),
  z.object({ ...common, type: z.literal("banner"), title: text(80), sub: text(160), image, button: text(30), link }),
  z.object({ ...common, type: z.literal("bannerfull"), title: text(80), sub: text(160), image, button: text(30), link }),
  z.object({ ...common, type: z.literal("features"), title: text(80), items: z.array(z.object({ title: text(60), text: text(200) })).max(6) }),
  z.object({ ...common, type: z.literal("faq"), title: text(80), items: z.array(z.object({ q: text(160), a: text(800) })).max(12) }),
  z.object({ ...common, type: z.literal("image"), image, caption: text(160), link }),
  z.object({ ...common, type: z.literal("newsletter"), title: text(80), text: text(200) }),
  z.object({ ...common, type: z.literal("cta"), heading: text(120), text: text(240), button: text(30), link }),
  z.object({ ...common, type: z.literal("marquee"), items: z.array(text(60)).min(1).max(10), speed: z.enum(["slow", "normal", "fast"]), look: z.enum(["plain", "accent", "dark"]) }),
  z.object({ ...common, type: z.literal("stats"), title: text(80), items: z.array(z.object({ value: z.number().min(0).max(1_000_000_000), suffix: text(8), label: text(40) })).min(1).max(4) }),
  z.object({ ...common, type: z.literal("testimonials"), title: text(80), items: z.array(z.object({ quote: text(300), name: text(60), role: text(60) })).min(1).max(6) }),
  z.object({ ...common, type: z.literal("countdown"), title: text(80), text: text(200), endsAt: text(30), button: text(30), link }),
  z.object({ ...common, type: z.literal("gallery"), title: text(80), images: z.array(z.object({ src: image, caption: text(80) })).min(1).max(8) }),
  z.object({ ...common, type: z.literal("split"), heading: text(120), body: text(2000), image, button: text(30), link, imageSide: z.enum(["left", "right"]) }),
  z.object({ ...common, type: z.literal("trust"), items: z.array(z.object({ icon: z.enum(["truck", "shield", "refresh", "headset", "gift", "card", "clock", "star"]), title: text(60), text: text(120) })).min(1).max(6) }),
  z.object({ ...common, type: z.literal("html"), code: z.string().max(50000) }),
  z.object({ ...common, type: z.literal("order"), heading: text(80), cta: text(30), multi: z.boolean(), offers: z.array(offer).min(1, "Add at least one offer").max(8) }),
]);
export const blocksSchema = z.array(blockSchema).max(40);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];

export const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero banner", herofull: "Hero banner, full width", sliderfull: "Image slider, full width", rail3dfull: "3D product slider, full width", bannerfull: "Banner, full width", split: "Picture and text side by side", trust: "Trust badges (delivery, returns, support)", html: "Custom HTML code", showcase: "Product showcase hero", showcasefull: "Product showcase hero, full width", rail3d: "3D product slider", slider: "Image slider", spotlight: "Product spotlight", pagehead: "Page title",
  richtext: "Text with headings and links", marquee: "Scrolling ticker", stats: "Numbers that count up", testimonials: "Customer words", countdown: "Countdown timer", gallery: "Photo gallery",
  text: "Text", products: "Products", categories: "Categories", banners: "Offer banners", banner: "Banner", features: "Features",
  faq: "Questions", image: "Image", newsletter: "Email sign up", cta: "Call to action", order: "Order form with offers",
};

export const BLOCK_GROUPS: { title: string; types: BlockType[] }[] = [
  { title: "Top of the page", types: ["showcase", "showcasefull", "hero", "herofull", "rail3d", "rail3dfull", "slider", "sliderfull", "spotlight", "pagehead"] },
  { title: "Products", types: ["products", "categories", "banners", "banner", "bannerfull"] },
  { title: "Eye-catching", types: ["marquee", "stats", "countdown", "gallery", "testimonials"] },
  { title: "Content", types: ["richtext", "text", "split", "image", "features", "trust", "faq", "newsletter", "cta", "html"] },
  { title: "Selling", types: ["order"] },
];

export type RailStyle = "hanger" | "hanger-wire" | "hanger-gold" | "hanger-velvet" | "arc" | "coverflow" | "diagonal" | "stack" | "wave";
export const RAIL_STYLES: { id: RailStyle; name: string; group: string }[] = [
  { id: "hanger", name: "Wooden hanger", group: "Hanger rail, for clothes" },
  { id: "hanger-wire", name: "Thin metal hanger", group: "Hanger rail, for clothes" },
  { id: "hanger-gold", name: "Gold boutique hanger", group: "Hanger rail, for clothes" },
  { id: "hanger-velvet", name: "Soft velvet hanger", group: "Hanger rail, for clothes" },
  { id: "arc", name: "Curved ring", group: "Photo cards, for any product" },
  { id: "coverflow", name: "Cover flow", group: "Photo cards, for any product" },
  { id: "diagonal", name: "Diagonal sweep", group: "Photo cards, for any product" },
  { id: "stack", name: "Card deck", group: "Photo cards, for any product" },
  { id: "wave", name: "Flowing wave", group: "Photo cards, for any product" },
];
export const SLIDER_STYLES: { id: "slide" | "fade" | "cards" | "split"; name: string }[] = [
  { id: "slide", name: "Slide, full width" }, { id: "fade", name: "Fade with slow zoom" }, { id: "cards", name: "Cards with a peek of the next" }, { id: "split", name: "Text beside the picture" },
];
export const HEADING_LEVELS: HeadingLevel[] = ["h1", "h2", "h3", "h4", "h5", "h6", "p"];
export const HEADING_LEVEL_LABEL: Record<HeadingLevel, string> = { h1: "Heading 1 (use once per page)", h2: "Heading 2", h3: "Heading 3", h4: "Heading 4", h5: "Heading 5", h6: "Heading 6", p: "Paragraph (p tag, not a heading)" };
/** What size each tag gets when the size is set to "match the tag". Matches the CSS in globals.css. */
export const TAG_SIZE_PX: Record<HeadingLevel, number> = { h1: 60, h2: 40, h3: 30, h4: 24, h5: 20, h6: 16, p: 16 };
export const FONT_WEIGHTS: { id: "300" | "400" | "500" | "600" | "700" | "800" | "900"; name: string }[] = [
  { id: "300", name: "Light (300)" }, { id: "400", name: "Normal (400)" }, { id: "500", name: "Medium (500)" }, { id: "600", name: "Semibold (600)" },
  { id: "700", name: "Bold (700)" }, { id: "800", name: "Extra bold (800)" }, { id: "900", name: "Black (900)" },
];
export const TEXT_CASES: { id: "none" | "uppercase" | "lowercase" | "capitalize"; name: string }[] = [
  { id: "none", name: "As typed" }, { id: "uppercase", name: "UPPERCASE" }, { id: "lowercase", name: "lowercase" }, { id: "capitalize", name: "Capitalize Each Word" },
];
export const ANIMATIONS: { id: Anim; name: string }[] = [
  { id: "up", name: "Rise up" }, { id: "fade", name: "Fade in" }, { id: "zoom", name: "Zoom in" }, { id: "left", name: "Slide from the left" }, { id: "right", name: "Slide from the right" }, { id: "none", name: "No animation" },
];

export function newBlock(type: BlockType): Block {
  const id = crypto.randomUUID();
  const base = { id, level: "h2" as HeadingLevel, anim: "up" as Anim };
  switch (type) {
    case "hero": return { ...base, type, heading: "A headline that sells", sub: "One line about what you offer.", image: "", button: "Shop now", link: "/shop", align: "left", variant: "overlay" };
    case "herofull": return { ...base, type, heading: "A headline that sells", sub: "One line about what you offer.", image: "", button: "Shop now", link: "/shop", align: "left", variant: "overlay" };
    case "showcase": return { ...base, type, eyebrow: "New season", heading: "Stand out without trying", sub: "Clothing, bedding and home decor made to last, delivered across Bangladesh. Pay in cash when it arrives.", button: "Get the look", tagline: "Comfort, wrapped in good design", source: "all", category: "", tag: "featured", autoplay: 5, fit: "cutout", showNav: true, facebook: "", instagram: "", youtube: "", whatsapp: "" };
    case "showcasefull": return { ...base, type, eyebrow: "New season", heading: "Stand out without trying", sub: "Clothing, bedding and home decor made to last, delivered across Bangladesh. Pay in cash when it arrives.", button: "Get the look", tagline: "Comfort, wrapped in good design", source: "all", category: "", tag: "featured", autoplay: 5, fit: "cutout", showNav: true, facebook: "", instagram: "", youtube: "", whatsapp: "" };
    case "rail3d": return { ...base, type, heading: "Pick it off the rail.", sub: "", button: "Shop everything", link: "/shop", button2: "New in", link2: "/shop?tag=new", style: "hanger", source: "all", category: "", tag: "featured", showHero: true, defaultView: "3d", arrows: "sides", pills: "center", headAlign: "left", textBg: "none" };
    case "rail3dfull": return { ...base, type, heading: "Pick it off the rail.", sub: "", button: "Shop everything", link: "/shop", button2: "New in", link2: "/shop?tag=new", style: "hanger", source: "all", category: "", tag: "featured", showHero: true, defaultView: "3d", arrows: "bottom-right", pills: "left", headAlign: "left", textBg: "none" };
    case "slider": return { ...base, type, style: "slide", slides: [{ title: "First slide", sub: "Tell people what is new", image: "", button: "Shop now", link: "/shop" }] };
    case "sliderfull": return { ...base, type, style: "slide", slides: [{ title: "First slide", sub: "Tell people what is new", image: "", button: "Shop now", link: "/shop" }] };
    case "spotlight": return { ...base, type, productId: "", heading: "Featured", button: "View product" };
    case "pagehead": return { ...base, type, title: "Page title", intro: "" };
    case "text": return { ...base, type, heading: "", body: "Write your text here." };
    case "richtext": return { ...base, type, width: "narrow", parts: [{ t: "heading", text: "A heading", level: "h2" }, { t: "paragraph", text: "Write your text here. Add as many headings, paragraphs, lists and links as you want, in any order." }] };
    case "products": return { ...base, type, title: "Our picks", source: "all", category: "", tag: "featured", count: 4 };
    case "categories": return { ...base, type, title: "Shop by category" };
    case "banners": return { ...base, type, title: "" };
    case "banner": return { ...base, type, title: "Banner title", sub: "", image: "", button: "Learn more", link: "/shop" };
    case "bannerfull": return { ...base, type, title: "Banner title", sub: "", image: "", button: "Learn more", link: "/shop" };
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
    case "split": return { ...base, type, heading: "Made to last", body: "Tell your story here. Explain what makes this product or your shop special.", image: "", button: "Learn more", link: "/shop", imageSide: "left" };
    case "trust": return { ...base, type, items: [{ icon: "truck", title: "Delivery across Bangladesh", text: "Inside and outside Dhaka." }, { icon: "shield", title: "Safe payment", text: "Cash on delivery, bKash, Nagad." }, { icon: "refresh", title: "Easy returns", text: "Simple exchange if it does not fit." }, { icon: "headset", title: "Real support", text: "Call or WhatsApp us." }] };
    case "html": return { ...base, type, code: "<div style=\"padding:48px;text-align:center;font-family:sans-serif\">\n  <h2>Your custom section</h2>\n  <p>Replace this with your own HTML, CSS and JavaScript.</p>\n</div>" };
    case "order": return { ...base, type, heading: "Choose your offer", cta: "Order now", multi: false, offers: [{ id: crypto.randomUUID().slice(0, 8), label: "Buy 1", badge: "", items: [], price: 0 }] };
  }
}
