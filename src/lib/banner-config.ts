/** Banner names and shortcodes. Safe to import from the browser. */
export type BannerDesign = "image" | "river" | "dusk" | "gold" | "ink" | "sand";
export type Banner = { id: string; title: string; subtitle: string; image: string; link: string; button: string; slot: string; design: BannerDesign };

/** Places a banner can appear by itself. Any other name is a custom group, shown with a shortcode or a page section. */
export const BANNER_SLOTS: { id: string; name: string; size: string }[] = [
  { id: "home", name: "Home page slider", size: "1920 x 640 px" },
  { id: "header", name: "Top of every page, above the header", size: "1920 x 120 px" },
  { id: "pre-footer", name: "Above the footer on every page", size: "1920 x 480 px" },
  { id: "popup", name: "Popup when someone opens the site", size: "800 x 800 px" },
];

export const BANNER_DESIGNS: { id: BannerDesign; name: string }[] = [
  { id: "image", name: "My own picture" },
  { id: "river", name: "River green with gold" },
  { id: "dusk", name: "Evening orange" },
  { id: "gold", name: "Gold on cream" },
  { id: "ink", name: "Black and white" },
  { id: "sand", name: "Soft sand" },
];

export const bannerShortcode = (slot: string) => `[banner slot="${slot}"]`;
const SHORTCODE = /^\[banner\s+slot="([a-z0-9-]{1,40})"\]$/;
/** The group name when this text is a banner shortcode and nothing else. */
export const shortcodeSlot = (text: string) => text.trim().match(SHORTCODE)?.[1] ?? null;
