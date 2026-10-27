export type ThemeId = "studio" | "editorial" | "noir" | "pastel" | "sunset" | "forest" | "ocean" | "mono";

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
  { id: "studio", name: "Studio", about: "Clean and modern. Cool greys and teal.", display: "--font-bricolage", body: "--font-instrument", light: { paper: "#f5f6f8", surface: "#ffffff", ink: "#15171c", accent: "#1f6f78" }, dark: { paper: "#0f1114", surface: "#171a1f", ink: "#eceef2", accent: "#4fb3bf" } },
  { id: "editorial", name: "Editorial", about: "Warm paper, serif headings, sharp corners.", display: "--font-fraunces", body: "--font-karla", light: { paper: "#f6f1e8", surface: "#fffcf6", ink: "#241a12", accent: "#8c2f2f" }, dark: { paper: "#17120e", surface: "#201a15", ink: "#f3ece1", accent: "#e08a7a" } },
  { id: "noir", name: "Noir", about: "Luxury feel. Black and gold, elegant serif.", display: "--font-cormorant", body: "--font-inter", light: { paper: "#f3efe8", surface: "#fbf9f5", ink: "#131110", accent: "#1a1612" }, dark: { paper: "#0c0c0e", surface: "#161619", ink: "#f4f1ea", accent: "#d7a74a" } },
  { id: "pastel", name: "Pastel", about: "Soft pink, big rounded corners, friendly.", display: "--font-poppins", body: "--font-nunito", light: { paper: "#fdf5f8", surface: "#ffffff", ink: "#3a2840", accent: "#c24d8a" }, dark: { paper: "#1b1320", surface: "#251a2b", ink: "#f6e9f2", accent: "#ef8fc0" } },
  { id: "sunset", name: "Sunset", about: "Warm orange, energetic and rounded.", display: "--font-outfit", body: "--font-dmsans", light: { paper: "#fff6ee", surface: "#ffffff", ink: "#2a1a12", accent: "#e0552b" }, dark: { paper: "#1a1210", surface: "#241915", ink: "#f9ece3", accent: "#ff8a5c" } },
  { id: "forest", name: "Forest", about: "Natural greens, calm and earthy.", display: "--font-lora", body: "--font-karla", light: { paper: "#f1f4ed", surface: "#fafcf7", ink: "#162319", accent: "#2e6a3e" }, dark: { paper: "#0f1611", surface: "#17201a", ink: "#e7efe6", accent: "#7fcf94" } },
  { id: "ocean", name: "Ocean", about: "Crisp blues, techy headings.", display: "--font-spacegrotesk", body: "--font-inter", light: { paper: "#f0f6fb", surface: "#ffffff", ink: "#0e2233", accent: "#0369a1" }, dark: { paper: "#0a141d", surface: "#11202c", ink: "#e5f0f8", accent: "#4cc0f5" } },
  { id: "mono", name: "Mono", about: "Black and white. No curves at all.", display: "--font-plex", body: "--font-plex", light: { paper: "#ffffff", surface: "#f7f7f7", ink: "#0a0a0a", accent: "#0a0a0a" }, dark: { paper: "#0a0a0a", surface: "#141414", ink: "#f5f5f5", accent: "#f5f5f5" } },
];

export const isTheme = (v: string): v is ThemeId => THEMES.some((t) => t.id === v);
