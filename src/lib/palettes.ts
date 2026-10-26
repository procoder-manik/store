export const PALETTES = [
  { id: "tide", name: "Tide", light: "#1f6f78", dark: "#4fb3bf" },
  { id: "indigo", name: "Indigo", light: "#3d4fc4", dark: "#8b9bff" },
  { id: "forest", name: "Forest", light: "#2f6b3f", dark: "#6fbf86" },
  { id: "plum", name: "Plum", light: "#7b3f8c", dark: "#c89bd6" },
  { id: "ember", name: "Ember", light: "#c2410c", dark: "#fb8b5b" },
  { id: "rose", name: "Rose", light: "#be3a5f", dark: "#f08aa6" },
  { id: "gold", name: "Gold", light: "#8a5d12", dark: "#e3b25a" },
  { id: "ocean", name: "Ocean", light: "#0369a1", dark: "#38bdf8" },
  { id: "graphite", name: "Graphite", light: "#1f2937", dark: "#e5e7eb" },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];
export const isPalette = (v: string): v is PaletteId => PALETTES.some((p) => p.id === v);
