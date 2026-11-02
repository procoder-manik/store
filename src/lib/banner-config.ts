/** Banner names and shortcodes. Safe to import from the browser. */
export type BannerDesign = "image" | "river" | "dusk" | "gold" | "ink" | "sand" | "theme" | "glass" | "flash" | "noir" | "rose" | "sky";
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
  { id: "theme", name: "My theme's main colour" },
  { id: "glass", name: "Frosted glass" },
  { id: "flash", name: "Flash sale, big and centered" },
  { id: "noir", name: "Black and gold, centered" },
  { id: "rose", name: "Soft rose" },
  { id: "sky", name: "Morning sky" },
];

/** Ready-made starting points. Choosing one fills in the form, and every word can then be changed. */
export type BannerTemplate = { id: string; name: string; design: BannerDesign; title: string; text: string; button: string; link: string };
export const BANNER_TEMPLATES: BannerTemplate[] = [
  { id: "flash", name: "Flash sale", design: "flash", title: "Flash sale. Up to 30% off", text: "This weekend only, while stock lasts.", button: "Shop the sale", link: "/offers" },
  { id: "free", name: "Free delivery", design: "theme", title: "Free delivery over ৳5,000", text: "Everywhere we deliver.", button: "Start shopping", link: "/shop" },
  { id: "new", name: "New arrivals", design: "glass", title: "New in this week", text: "Fresh pieces for every room.", button: "See what is new", link: "/shop" },
  { id: "preorder", name: "Pre-order", design: "noir", title: "Reserve it before launch", text: "Pre-order now at a special price.", button: "See pre-orders", link: "/pre-order" },
  { id: "eid", name: "Festival offer", design: "gold", title: "Eid gifts for the home", text: "Use code EID10 for 10% off.", button: "Shop gifts", link: "/offers" },
  { id: "collection", name: "New collection", design: "river", title: "The bedroom collection", text: "Sheets, quilts and pillows that work together.", button: "Explore", link: "/shop" },
  { id: "bundle", name: "Bundle deal", design: "sky", title: "Buy more, save more", text: "Add matching pieces and save on the set.", button: "See sets", link: "/shop" },
  { id: "soft", name: "Quiet offer", design: "rose", title: "A little something for you", text: "10% off your first order.", button: "Claim offer", link: "/offers" },
];
export const POPUP_TEMPLATES: BannerTemplate[] = [
  { id: "welcome", name: "Welcome discount", design: "theme", title: "Welcome. Here is 10% off", text: "Use code WELCOME10 on your first order.", button: "Start shopping", link: "/shop" },
  { id: "flash", name: "Flash sale", design: "flash", title: "Today only: 30% off", text: "Ends at midnight.", button: "Shop now", link: "/offers" },
  { id: "free", name: "Free delivery", design: "glass", title: "Free delivery this week", text: "On orders over ৳5,000.", button: "See offers", link: "/offers" },
  { id: "preorder", name: "Pre-order launch", design: "noir", title: "Be the first to have it", text: "Pre-order at a special launch price.", button: "Reserve yours", link: "/pre-order" },
  { id: "festival", name: "Festival", design: "gold", title: "Eid gifts are here", text: "Use code EID10 for 10% off.", button: "Shop gifts", link: "/offers" },
  { id: "new", name: "New collection", design: "river", title: "The new collection has landed", text: "See it before it sells out.", button: "Explore", link: "/shop" },
];

export const bannerShortcode = (slot: string) => `[banner slot="${slot}"]`;
const SHORTCODE = /^\[banner\s+slot="([a-z0-9-]{1,40})"\]$/;
/** The group name when this text is a banner shortcode and nothing else. */
export const shortcodeSlot = (text: string) => text.trim().match(SHORTCODE)?.[1] ?? null;
