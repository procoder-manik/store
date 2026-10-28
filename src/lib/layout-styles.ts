/** The ready-made header and footer designs, and the options you can change on each. Safe to import anywhere. */
export type HeaderStyleId = "classic" | "centered" | "marketplace" | "split" | "bold";
export type FooterStyleId = "classic" | "minimal" | "dark" | "contact" | "compact";

export const HEADER_STYLES: { id: HeaderStyleId; name: string; desc: string }[] = [
  { id: "classic", name: "Classic", desc: "Logo on the left, menu beside it, icons on the right." },
  { id: "centered", name: "Centered logo", desc: "Big centered logo with the menu in a row underneath." },
  { id: "marketplace", name: "Marketplace", desc: "Wide search bar and a category row, like a big online shop." },
  { id: "split", name: "Split", desc: "Menu on the left, logo in the middle, icons on the right." },
  { id: "bold", name: "Bold dark", desc: "Dark bar with a contact strip and a call to action button." },
];
export const FOOTER_STYLES: { id: FooterStyleId; name: string; desc: string }[] = [
  { id: "classic", name: "Classic columns", desc: "Delivery promises on top, link columns below." },
  { id: "minimal", name: "Minimal centered", desc: "Centered name, one row of links, social links." },
  { id: "dark", name: "Dark with sign up", desc: "Dark footer with a big email sign up band and columns." },
  { id: "contact", name: "Contact first", desc: "A large contact card beside your link columns." },
  { id: "compact", name: "Compact bar", desc: "A slim single-row footer for a clean look." },
];

export type HeaderStyleCfg = {
  style: HeaderStyleId;
  sticky: boolean;
  showSearch: boolean;
  showAccount: boolean;
  showWishlist: boolean;
  showThemeToggle: boolean;
  uppercaseMenu: boolean;
  topBar: { enabled: boolean; text: string };
  cta: { label: string; href: string };
};
export type FooterStyleCfg = {
  style: FooterStyleId;
  showPayments: boolean;
  showTrust: boolean;
  social: { facebook: string; instagram: string; youtube: string; tiktok: string };
};

export const DEFAULT_HEADER_STYLE: HeaderStyleCfg = {
  style: "classic", sticky: true, showSearch: true, showAccount: true, showWishlist: true, showThemeToggle: true, uppercaseMenu: false,
  topBar: { enabled: false, text: "" }, cta: { label: "", href: "" },
};
export const DEFAULT_FOOTER_STYLE: FooterStyleCfg = {
  style: "classic", showPayments: true, showTrust: true, social: { facebook: "", instagram: "", youtube: "", tiktok: "" },
};

const HEADER_IDS = HEADER_STYLES.map((s) => s.id) as string[];
const FOOTER_IDS = FOOTER_STYLES.map((s) => s.id) as string[];

export function mergeHeaderStyle(v: unknown): HeaderStyleCfg {
  const x = (v ?? {}) as Partial<HeaderStyleCfg>;
  return {
    ...DEFAULT_HEADER_STYLE, ...x,
    style: HEADER_IDS.includes(x.style as string) ? (x.style as HeaderStyleId) : "classic",
    topBar: { ...DEFAULT_HEADER_STYLE.topBar, ...(x.topBar ?? {}) },
    cta: { ...DEFAULT_HEADER_STYLE.cta, ...(x.cta ?? {}) },
  };
}
export function mergeFooterStyle(v: unknown): FooterStyleCfg {
  const x = (v ?? {}) as Partial<FooterStyleCfg>;
  return {
    ...DEFAULT_FOOTER_STYLE, ...x,
    style: FOOTER_IDS.includes(x.style as string) ? (x.style as FooterStyleId) : "classic",
    social: { ...DEFAULT_FOOTER_STYLE.social, ...(x.social ?? {}) },
  };
}
