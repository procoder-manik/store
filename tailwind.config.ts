import type { Config } from "tailwindcss";

/** Lets classes like bg-surface/90 and bg-accent/10 work with our CSS variable colors. */
const tone = (name: string) =>
  (({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined ? `var(--${name})` : `color-mix(in srgb, var(--${name}) calc(${opacityValue} * 100%), transparent)`) as unknown as string;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: tone("paper"),
        surface: tone("surface"),
        ink: tone("ink"),
        muted: tone("muted"),
        line: tone("line"),
        accent: tone("accent"),
        "accent-ink": tone("accent-ink"),
      },
      borderRadius: { xl: "var(--r-xl)", "2xl": "var(--r-2xl)", "3xl": "var(--r-3xl)", pill: "var(--r-pill)" },
      fontFamily: {
        display: ["var(--ff-display)"],
        body: ["var(--ff-body)"],
      },
    },
  },
  plugins: [],
};
export default config;
