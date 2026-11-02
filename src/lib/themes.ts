import type { FooterStyleId, HeaderStyleId } from "@/lib/layout-styles";

export type ThemeId = "kach" | "padma" | "sondha" | "kalo" | "komola" | "nodi" | "beli" | "shobuj" | "surjasto" | "akash" | "rani";
export type CardStyleId = "soft" | "framed" | "elevated" | "glass" | "minimal" | "bold";

type Colors = { paper: string; surface: string; ink: string; muted: string; line: string; accent: string; accentInk: string; gold: string };

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
  prefers?: "dark";
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
    id: "kach", name: "Kach", about: "The clean Apple look: system font, iPhone blue and frosted glass.", kind: "solid", display: "--font-apple", body: "--font-apple",
    radius: { box: "14px", card: "22px", button: "9999px" }, type: { weight: 600, h2: 700, track: "-0.025em" }, card: "glass", header: "classic", footer: "minimal",
    light: { paper: "#f2f2f7", surface: "#ffffff", ink: "#1c1c1e", muted: "#636366", line: "#d8d8dc", accent: "#0a6fe0", accentInk: "#ffffff", gold: "#5e5ce6" },
    dark: { paper: "#000000", surface: "#1c1c1e", ink: "#f5f5f7", muted: "#98989f", line: "#38383a", accent: "#0a7cf0", accentInk: "#ffffff", gold: "#64d2ff" },
  },
  {
    id: "sondha", name: "Sondha", about: "Evening oxblood on warm white, in a soft old-style serif.", kind: "solid", display: "--font-fraunces", body: "--font-dmsans",
    radius: { box: "0.5rem", card: "1rem", button: "0.5rem" }, type: { weight: 500, h2: 500, track: "-0.015em" }, card: "elevated", header: "centered", footer: "minimal",
    light: { paper: "#f6f3f0", surface: "#ffffff", ink: "#241014", muted: "#6f5c5f", line: "#e6dedc", accent: "#4e1119", accentInk: "#f6f3f0", gold: "#a8743f" },
    dark: { paper: "#150a0c", surface: "#1f1013", ink: "#f1e8e4", muted: "#b5a3a2", line: "#38201f", accent: "#d4a373", accentInk: "#150a0c", gold: "#d4a373" },
  },
  {
    id: "kalo", name: "Kalo", about: "Black on white, hard edges, a sharp modern typeface.", kind: "solid", display: "--font-space", body: "--font-space",
    radius: { box: "0", card: "0", button: "0" }, type: { weight: 600, h2: 600, track: "-0.035em" }, card: "minimal", header: "split", footer: "compact",
    light: { paper: "#f4f4f2", surface: "#ffffff", ink: "#111111", muted: "#666662", line: "#deded9", accent: "#111111", accentInk: "#ffffff", gold: "#8a6d2f" },
    dark: { paper: "#0c0c0c", surface: "#161616", ink: "#f2f2ee", muted: "#a3a3a0", line: "#2a2a2a", accent: "#f2f2ee", accentInk: "#0c0c0c", gold: "#c9a45c" },
  },
  {
    id: "komola", name: "Komola", about: "Bright bazaar orange on white. Friendly, busy and easy to shop.", kind: "solid", display: "--font-poppins", body: "--font-poppins",
    radius: { box: "0.625rem", card: "0.75rem", button: "0.625rem" }, type: { weight: 700, h2: 700, track: "-0.02em" }, card: "framed", header: "marketplace", footer: "classic",
    light: { paper: "#f5f6f8", surface: "#ffffff", ink: "#1f2430", muted: "#5f6878", line: "#e4e7ec", accent: "#d9650a", accentInk: "#ffffff", gold: "#d9650a" },
    dark: { paper: "#14161b", surface: "#1d2027", ink: "#f2f3f5", muted: "#a5abb7", line: "#2e323b", accent: "#f7931e", accentInk: "#1a1204", gold: "#f7931e" },
  },
  {
    id: "nodi", name: "Nodi", about: "Clear river blue. Clean, trusted and confident.", kind: "solid", display: "--font-manrope", body: "--font-manrope",
    radius: { box: "0.75rem", card: "1rem", button: "9999px" }, type: { weight: 800, h2: 800, track: "-0.03em" }, card: "bold", header: "classic", footer: "contact",
    light: { paper: "#f3f6fb", surface: "#ffffff", ink: "#0d1b33", muted: "#566480", line: "#dfe6f1", accent: "#1456d9", accentInk: "#ffffff", gold: "#0e8fb8" },
    dark: { paper: "#0a1120", surface: "#121b2e", ink: "#eaf0fb", muted: "#9eacc6", line: "#25314a", accent: "#6ea3ff", accentInk: "#0a1120", gold: "#4fc3e8" },
  },
  {
    id: "beli", name: "Beli", about: "Quiet cream and sage, like a calm home. Soft and airy.", kind: "solid", display: "--font-dmserif", body: "--font-dmsans",
    radius: { box: "0.375rem", card: "0.5rem", button: "9999px" }, type: { weight: 400, h2: 400, track: "-0.005em" }, card: "minimal", header: "centered", footer: "minimal",
    light: { paper: "#faf7f0", surface: "#fffdf8", ink: "#2a2b24", muted: "#666859", line: "#e8e3d6", accent: "#4f6b4a", accentInk: "#fffdf8", gold: "#a58a4e" },
    dark: { paper: "#13150f", surface: "#1c1f17", ink: "#efece2", muted: "#aaa998", line: "#2e3126", accent: "#a9c29f", accentInk: "#13150f", gold: "#cdb37a" },
  },
  {
    id: "shobuj", name: "Shobuj", about: "Fresh emerald running into teal, on every button and band.", kind: "gradient", display: "--font-manrope", body: "--font-manrope",
    fill: "linear-gradient(115deg, #067a5b 0%, #0b8476 100%)",
    radius: { box: "0.875rem", card: "1.125rem", button: "9999px" }, type: { weight: 700, h2: 800, track: "-0.025em" }, card: "elevated", header: "marketplace", footer: "classic",
    light: { paper: "#f2f8f5", surface: "#ffffff", ink: "#0d2a22", muted: "#50695f", line: "#dcebe4", accent: "#067a5b", accentInk: "#ffffff", gold: "#0b8476" },
    dark: { paper: "#08130f", surface: "#101f19", ink: "#e6f4ee", muted: "#9bb5aa", line: "#20352c", accent: "#0b8476", accentInk: "#ffffff", gold: "#3dd6ae" },
  },
  {
    id: "surjasto", name: "Surjasto", about: "A warm sunset of pink and orange. Lively and full of energy.", kind: "gradient", display: "--font-poppins", body: "--font-poppins",
    fill: "linear-gradient(115deg, #c81e6b 0%, #dc4415 100%)",
    radius: { box: "1rem", card: "1.25rem", button: "9999px" }, type: { weight: 700, h2: 700, track: "-0.025em" }, card: "bold", header: "classic", footer: "dark",
    light: { paper: "#fff7f3", surface: "#ffffff", ink: "#2b1420", muted: "#745a64", line: "#f4e2da", accent: "#d0305a", accentInk: "#ffffff", gold: "#dc4415" },
    dark: { paper: "#160b10", surface: "#21121a", ink: "#fbecef", muted: "#bca5ad", line: "#3a222c", accent: "#d0305a", accentInk: "#ffffff", gold: "#ff8a5c" },
  },
  {
    id: "akash", name: "Akash", about: "Futuristic violet and electric blue on deep night, with glass cards.", kind: "gradient", display: "--font-sora", body: "--font-space",
    fill: "linear-gradient(115deg, #6d3bff 0%, #0d7fd6 100%)",
    radius: { box: "1rem", card: "1.25rem", button: "9999px" }, type: { weight: 600, h2: 600, track: "-0.035em" }, card: "glass", header: "split", footer: "dark", prefers: "dark",
    light: { paper: "#f4f5ff", surface: "#ffffff", ink: "#12142b", muted: "#595d7e", line: "#e0e2f5", accent: "#5a35e0", accentInk: "#ffffff", gold: "#0d7fd6" },
    dark: { paper: "#090a16", surface: "#141629", ink: "#eef0ff", muted: "#a3a8c9", line: "#272b48", accent: "#6d3bff", accentInk: "#ffffff", gold: "#4cc4ff" },
  },
  {
    id: "rani", name: "Rani", about: "Royal plum melting into rose, with an elegant serif.", kind: "gradient", display: "--font-fraunces", body: "--font-manrope",
    fill: "linear-gradient(115deg, #561a8a 0%, #b8175a 100%)",
    radius: { box: "0.75rem", card: "1rem", button: "0.75rem" }, type: { weight: 600, h2: 500, track: "-0.02em" }, card: "elevated", header: "centered", footer: "contact",
    light: { paper: "#faf5fb", surface: "#ffffff", ink: "#241030", muted: "#6d5a78", line: "#ece1f0", accent: "#7a1a78", accentInk: "#ffffff", gold: "#b8175a" },
    dark: { paper: "#120a18", surface: "#1d1226", ink: "#f5ecf8", muted: "#b5a5be", line: "#35243f", accent: "#7a1a78", accentInk: "#ffffff", gold: "#f07fb0" },
  },
];

export const isTheme = (v: string): v is ThemeId => THEMES.some((t) => t.id === v);
export const themeOf = (v: string) => THEMES.find((t) => t.id === v) ?? THEMES[0];

export const CARD_STYLES: { id: CardStyleId; name: string; about: string }[] = [
  { id: "soft", name: "Soft tint", about: "Each product on a soft wash of its own colour." },
  { id: "framed", name: "Framed", about: "White card with a thin border, like a big online shop." },
  { id: "elevated", name: "Lifted", about: "A floating card with a shadow that rises under the pointer." },
  { id: "glass", name: "Glass", about: "See-through frosted cards over a soft glow." },
  { id: "minimal", name: "Minimal", about: "No box at all. Just the product and centered words." },
  { id: "bold", name: "Bold", about: "Big price and a full, filled button." },
];
export const isCardStyle = (v: string): v is CardStyleId => CARD_STYLES.some((c) => c.id === v);

const colors = (c: Colors) => `--paper:${c.paper};--surface:${c.surface};--ink:${c.ink};--muted:${c.muted};--line:${c.line};--accent:${c.accent};--accent-ink:${c.accentInk};--gold:${c.gold};`;

/** The stylesheet for the given themes. The admin panel always uses Padma, so it stays the same whichever look the store wears. */
export function themeCss(list: Theme[]) {
  return list.map((t) => {
    const r = t.radius;
    return `[data-theme="${t.id}"]{${colors(t.light)}--madder:#8e2a2a;--fill:${t.fill ?? "none"};--ff-display:var(${t.display}),var(--font-bn),Georgia,serif;--ff-body:var(${t.body}),var(--font-bn),system-ui,sans-serif;--r-xl:${r.box};--r-2xl:${r.box};--r-3xl:${r.box};--r-card:${r.card};--r-pill:${r.button};--display-weight:${t.type.weight};--h2-weight:${t.type.h2};--display-track:${t.type.track};}`
      + `.dark[data-theme="${t.id}"],.dark [data-theme="${t.id}"]{${colors(t.dark)}--madder:#e29a8f;}`;
  }).join("");
}
