import type { FooterStyleId, HeaderStyleId } from "@/lib/layout-styles";

export type ThemeId = "kach" | "padma" | "sondha" | "kalo" | "komola" | "nodi" | "beli" | "shobuj" | "surjasto" | "akash" | "rani";
export type CardStyleId = "ios" | "soft" | "framed" | "elevated" | "glass" | "minimal" | "bold" | "overlay" | "editorial" | "boutique";

export type Colors = { paper: string; surface: string; ink: string; muted: string; line: string; accent: string; accentInk: string; gold: string };

export type Theme = {
  id: ThemeId;
  name: string;
  about: string;
  kind: "solid" | "gradient";
  display: string; // CSS variable of the heading font
  body: string;
  /** Used on every filled button, badge and band when the theme is a gradient one. */
  fill?: string;
  /** Corners of fields and panels, of product cards, and of buttons. */
  radius: { box: string; card: string; button: string };
  type: { weight: number; h2: number; track: string };
  card: CardStyleId;
  header: HeaderStyleId;
  footer: FooterStyleId;
  light: Colors;
  dark: Colors;
};

export const THEMES: Theme[] = [
  {
    id: "padma", name: "Padma", about: "Deep river green on soft stone, with an old gold line.", kind: "solid", display: "--font-bodoni", body: "--font-hanken",
    radius: { box: "0.125rem", card: "0.875rem", button: "0.125rem" }, type: { weight: 500, h2: 400, track: "-0.012em" }, card: "soft", header: "classic", footer: "classic",
    light: { paper: "#f5f5f1", surface: "#ffffff", ink: "#0f1f1c", muted: "#5d6b66", line: "#dedfd8", accent: "#12332d", accentInk: "#f5f5f1", gold: "#a8843f" },
    dark: { paper: "#0b1513", surface: "#12201d", ink: "#ecebe3", muted: "#a2ada7", line: "#24332f", accent: "#c9a45c", accentInk: "#0b1513", gold: "#c9a45c" },
  },
  {
    id: "kach", name: "Kach", about: "The Apple look: system font, Apple blue and clean frosted glass.", kind: "solid", display: "--font-apple", body: "--font-apple",
    radius: { box: "14px", card: "22px", button: "9999px" }, type: { weight: 600, h2: 700, track: "-0.025em" }, card: "ios", header: "classic", footer: "minimal",
    light: { paper: "#f5f5f7", surface: "#ffffff", ink: "#1d1d1f", muted: "#6e6e73", line: "#d2d2d7", accent: "#0071e3", accentInk: "#ffffff", gold: "#a2845e" },
    dark: { paper: "#000000", surface: "#1c1c1e", ink: "#f5f5f7", muted: "#98989d", line: "#38383a", accent: "#2997ff", accentInk: "#00142b", gold: "#c9a981" },
  },
  {
    id: "sondha", name: "Sondha", about: "Evening oxblood on warm ivory, in a soft old-style serif.", kind: "solid", display: "--font-fraunces", body: "--font-dmsans",
    radius: { box: "0.5rem", card: "1rem", button: "0.5rem" }, type: { weight: 500, h2: 500, track: "-0.015em" }, card: "boutique", header: "centered", footer: "minimal",
    light: { paper: "#f8f4ef", surface: "#fffdfa", ink: "#2a1518", muted: "#75615f", line: "#e8dfd8", accent: "#4e1119", accentInk: "#f8f4ef", gold: "#a8743f" },
    dark: { paper: "#150a0c", surface: "#1f1013", ink: "#f1e8e4", muted: "#b5a3a2", line: "#38201f", accent: "#d4a373", accentInk: "#150a0c", gold: "#d4a373" },
  },
  {
    id: "kalo", name: "Kalo", about: "Graphite on soft white, hard edges, a sharp modern typeface.", kind: "solid", display: "--font-space", body: "--font-space",
    radius: { box: "0", card: "0", button: "0" }, type: { weight: 600, h2: 600, track: "-0.035em" }, card: "minimal", header: "split", footer: "compact",
    light: { paper: "#f5f5f3", surface: "#ffffff", ink: "#1c1c1e", muted: "#68686a", line: "#deded9", accent: "#1c1c1e", accentInk: "#ffffff", gold: "#8a6d2f" },
    dark: { paper: "#0c0c0d", surface: "#17171a", ink: "#f2f2ee", muted: "#a3a3a0", line: "#2a2a2c", accent: "#f2f2ee", accentInk: "#0c0c0d", gold: "#c9a45c" },
  },
  {
    id: "komola", name: "Komola", about: "Warm burnt amber on cream. Friendly, like a good bazaar.", kind: "solid", display: "--font-poppins", body: "--font-poppins",
    radius: { box: "0.625rem", card: "0.875rem", button: "0.625rem" }, type: { weight: 600, h2: 700, track: "-0.02em" }, card: "framed", header: "marketplace", footer: "classic",
    light: { paper: "#faf7f2", surface: "#ffffff", ink: "#2a211a", muted: "#6f6358", line: "#ece5da", accent: "#b4551a", accentInk: "#ffffff", gold: "#c98a3e" },
    dark: { paper: "#15110d", surface: "#1f1a14", ink: "#f3ede4", muted: "#ada295", line: "#332b22", accent: "#e8975c", accentInk: "#1c1107", gold: "#e0ae6e" },
  },
  {
    id: "nodi", name: "Nodi", about: "Deep navy and brushed brass. Calm, trusted and confident.", kind: "solid", display: "--font-manrope", body: "--font-manrope",
    radius: { box: "0.75rem", card: "1rem", button: "9999px" }, type: { weight: 700, h2: 700, track: "-0.03em" }, card: "elevated", header: "classic", footer: "contact",
    light: { paper: "#f4f6f9", surface: "#ffffff", ink: "#12203a", muted: "#5a6780", line: "#e0e5ee", accent: "#16325f", accentInk: "#ffffff", gold: "#a88a55" },
    dark: { paper: "#0a1120", surface: "#131c30", ink: "#e9eef8", muted: "#9eacc6", line: "#26324c", accent: "#9dbcec", accentInk: "#0a1120", gold: "#d0b27c" },
  },
  {
    id: "beli", name: "Beli", about: "Quiet cream and sage, like a calm home. Soft and airy.", kind: "solid", display: "--font-dmserif", body: "--font-dmsans",
    radius: { box: "0.375rem", card: "0.5rem", button: "9999px" }, type: { weight: 400, h2: 400, track: "-0.005em" }, card: "editorial", header: "centered", footer: "minimal",
    light: { paper: "#faf7f0", surface: "#fffdf8", ink: "#2a2b24", muted: "#666859", line: "#e8e3d6", accent: "#566b51", accentInk: "#fffdf8", gold: "#a58a4e" },
    dark: { paper: "#13150f", surface: "#1c1f17", ink: "#efece2", muted: "#aaa998", line: "#2e3126", accent: "#a9c29f", accentInk: "#13150f", gold: "#cdb37a" },
  },
  {
    id: "shobuj", name: "Shobuj", about: "A slow gradient of forest green. Rich, not loud.", kind: "gradient", display: "--font-manrope", body: "--font-manrope",
    fill: "linear-gradient(135deg, #0f3d33 0%, #215f50 100%)",
    radius: { box: "0.875rem", card: "1.125rem", button: "9999px" }, type: { weight: 700, h2: 700, track: "-0.025em" }, card: "elevated", header: "classic", footer: "classic",
    light: { paper: "#f4f7f5", surface: "#ffffff", ink: "#12261f", muted: "#55695f", line: "#dfe8e3", accent: "#1a5245", accentInk: "#ffffff", gold: "#a58a4e" },
    dark: { paper: "#08130f", surface: "#111f19", ink: "#e6f4ee", muted: "#9bb5aa", line: "#20352c", accent: "#74c9ad", accentInk: "#ffffff", gold: "#cdb37a" },
  },
  {
    id: "surjasto", name: "Surjasto", about: "Dusk in rose gold and copper. Warm and elegant.", kind: "gradient", display: "--font-fraunces", body: "--font-dmsans",
    fill: "linear-gradient(135deg, #7d3548 0%, #a8583f 100%)",
    radius: { box: "1rem", card: "1.25rem", button: "9999px" }, type: { weight: 500, h2: 500, track: "-0.02em" }, card: "boutique", header: "centered", footer: "minimal",
    light: { paper: "#fbf6f2", surface: "#fffdfb", ink: "#2d1a1c", muted: "#76625f", line: "#efe3dc", accent: "#8f4545", accentInk: "#ffffff", gold: "#b5805a" },
    dark: { paper: "#160d0e", surface: "#221518", ink: "#f8ece8", muted: "#bca7a3", line: "#3a2629", accent: "#eba98f", accentInk: "#ffffff", gold: "#e0ac8c" },
  },
  {
    id: "akash", name: "Akash", about: "Midnight indigo in a slow gradient, with silver light. Quietly futuristic.", kind: "gradient", display: "--font-sora", body: "--font-space",
    fill: "linear-gradient(135deg, #1b1f4d 0%, #3d4192 100%)",
    radius: { box: "1rem", card: "1.25rem", button: "9999px" }, type: { weight: 600, h2: 600, track: "-0.035em" }, card: "glass", header: "split", footer: "dark",
    light: { paper: "#f5f5fb", surface: "#ffffff", ink: "#15162b", muted: "#5c5e7c", line: "#e2e3f2", accent: "#2d3072", accentInk: "#ffffff", gold: "#7a80c9" },
    dark: { paper: "#0b0c14", surface: "#16172a", ink: "#eef0fb", muted: "#a3a8c9", line: "#272a47", accent: "#aab1ff", accentInk: "#ffffff", gold: "#aab1ff" },
  },
  {
    id: "rani", name: "Rani", about: "Aubergine melting into wine, with an elegant serif.", kind: "gradient", display: "--font-fraunces", body: "--font-manrope",
    fill: "linear-gradient(135deg, #371a3f 0%, #6e2a54 100%)",
    radius: { box: "0.75rem", card: "1rem", button: "0.75rem" }, type: { weight: 500, h2: 500, track: "-0.02em" }, card: "editorial", header: "centered", footer: "contact",
    light: { paper: "#faf6f9", surface: "#ffffff", ink: "#26142b", muted: "#6f5c76", line: "#ece3ee", accent: "#552248", accentInk: "#ffffff", gold: "#a8805f" },
    dark: { paper: "#120a16", surface: "#1d1224", ink: "#f5ecf6", muted: "#b5a5be", line: "#35243f", accent: "#dcaacb", accentInk: "#ffffff", gold: "#d4a98a" },
  },
];

export const isTheme = (v: string): v is ThemeId => THEMES.some((t) => t.id === v);
export const themeOf = (v: string) => THEMES.find((t) => t.id === v) ?? THEMES[0];

export const CARD_STYLES: { id: CardStyleId; name: string; about: string }[] = [
  { id: "ios", name: "App Store", about: "A clean white tile with a small tinted button, like the App Store." },
  { id: "glass", name: "Glass", about: "See-through frosted cards over a soft glow." },
  { id: "overlay", name: "Picture first", about: "The product fills the card, with its words on a frosted bar." },
  { id: "elevated", name: "Lifted", about: "A floating card with a shadow that rises under the pointer." },
  { id: "boutique", name: "Boutique", about: "Centered, with a fine gold line and an outlined button." },
  { id: "editorial", name: "Editorial", about: "Tall picture and a magazine-style title. No box." },
  { id: "framed", name: "Framed", about: "White card with a thin border, like a big online shop." },
  { id: "soft", name: "Soft tint", about: "Each product on a soft wash of its own colour." },
  { id: "minimal", name: "Minimal", about: "No box at all. Just the product and centered words." },
  { id: "bold", name: "Bold", about: "Big price and a full, filled button." },
];
export const isCardStyle = (v: string): v is CardStyleId => CARD_STYLES.some((c) => c.id === v);

/** The colours the owner has changed on a theme. Everything left out keeps the theme's own value. */
export type ThemeColors = { light?: Partial<Colors>; dark?: Partial<Colors>; from?: string; to?: string };

export const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
export const gradientStops = (t: Theme) => (t.fill?.match(/#[0-9a-fA-F]{6}/g) ?? ["", ""]) as string[];

const onlyHex = (c?: Partial<Colors>) => Object.fromEntries(Object.entries(c ?? {}).filter(([, v]) => isHex(v))) as Partial<Colors>;

/** A theme dressed in the owner's colours. Values are checked here too, because they end up inside the page's CSS. */
export function withColors(t: Theme, c?: ThemeColors): Theme {
  if (!c) return t;
  const [from, to] = gradientStops(t);
  return {
    ...t,
    fill: t.fill ? `linear-gradient(135deg, ${isHex(c.from) ? c.from : from} 0%, ${isHex(c.to) ? c.to : to} 100%)` : undefined,
    light: { ...t.light, ...onlyHex(c.light) },
    dark: { ...t.dark, ...onlyHex(c.dark) },
  };
}

const darkVars = (c: Colors) => `--d-paper:${c.paper};--d-surface:${c.surface};--d-ink:${c.ink};--d-muted:${c.muted};--d-line:${c.line};--d-accent:${c.accent};--d-accent-ink:${c.accentInk};--d-gold:${c.gold};`;
const colors = (c: Colors) => `--paper:${c.paper};--surface:${c.surface};--ink:${c.ink};--muted:${c.muted};--line:${c.line};--accent:${c.accent};--accent-ink:${c.accentInk};--gold:${c.gold};`;

/** The stylesheet for the given themes. The admin panel always uses Padma, so it stays the same whichever look the store wears. */
export function themeCss(list: Theme[]) {
  return list.map((t) => {
    const r = t.radius;
    return `[data-theme="${t.id}"]{${colors(t.light)}${darkVars(t.dark)}--madder:#8e2a2a;--fill:${t.fill ?? "none"};--ff-display:var(${t.display}),var(--font-bn),Georgia,serif;--ff-body:var(${t.body}),var(--font-bn),system-ui,sans-serif;--r-xl:${r.box};--r-2xl:${r.box};--r-3xl:${r.box};--r-card:${r.card};--r-pill:${r.button};--display-weight:${t.type.weight};--h2-weight:${t.type.h2};--display-track:${t.type.track};}`
      + `.dark[data-theme="${t.id}"],.dark [data-theme="${t.id}"]{${colors(t.dark)}--madder:#e29a8f;}`;
  }).join("");
}

/** The admin panel keeps the original Padma, even when the owner recolours Padma for the shop. */
export const adminThemeCss = () => themeCss([THEMES[0]]).split('[data-theme="padma"]').join('[data-admin-shell][data-theme="padma"]')
  + '[data-admin-shell][data-theme="padma"]{--ff-display:var(--font-apple),var(--font-bn),sans-serif;--ff-body:var(--font-apple),var(--font-bn),sans-serif;--r-xl:12px;--r-2xl:16px;--r-3xl:20px;--r-card:16px;--r-pill:9999px;}';
