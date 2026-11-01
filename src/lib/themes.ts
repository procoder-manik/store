export type ThemeId = "padma" | "sondha" | "kalo";

export type Theme = {
  id: ThemeId;
  name: string;
  about: string;
  display: string; // CSS variable of the heading font
  body: string;
  light: { paper: string; surface: string; ink: string; accent: string };
  dark: { paper: string; surface: string; ink: string; accent: string };
};

export const THEMES: Theme[] = [
  { id: "padma", name: "Padma", about: "Deep river green on soft stone, with an old gold line.", display: "--font-bodoni", body: "--font-hanken", light: { paper: "#f5f5f1", surface: "#ffffff", ink: "#0f1f1c", accent: "#12332d" }, dark: { paper: "#0b1513", surface: "#12201d", ink: "#ecebe3", accent: "#c9a45c" } },
  { id: "sondha", name: "Sondha", about: "Evening oxblood on warm white.", display: "--font-bodoni", body: "--font-hanken", light: { paper: "#f6f3f0", surface: "#ffffff", ink: "#241014", accent: "#4e1119" }, dark: { paper: "#150a0c", surface: "#1f1013", ink: "#f1e8e4", accent: "#d4a373" } },
  { id: "kalo", name: "Kalo", about: "Black on white. Nothing else.", display: "--font-bodoni", body: "--font-hanken", light: { paper: "#f4f4f2", surface: "#ffffff", ink: "#111111", accent: "#111111" }, dark: { paper: "#0c0c0c", surface: "#161616", ink: "#f2f2ee", accent: "#f2f2ee" } },
];

export const isTheme = (v: string): v is ThemeId => THEMES.some((t) => t.id === v);
