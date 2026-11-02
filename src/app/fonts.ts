import { Bodoni_Moda, DM_Sans, DM_Serif_Display, Fraunces, Hanken_Grotesk, Hind_Siliguri, Manrope, Poppins, Sora, Space_Grotesk } from "next/font/google";

// Next.js reads these calls at build time, so each one must be a plain const with literal options.
// Fonts are only downloaded by a visitor's browser when the active theme uses them, so the extra ones cost nothing until chosen.
const bodoni = Bodoni_Moda({ subsets: ["latin"], display: "swap", preload: false, axes: ["opsz"], variable: "--font-bodoni" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-hanken" });
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-fraunces" });
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-dmsans" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], display: "swap", preload: false, weight: "400", variable: "--font-dmserif" });
const space = Space_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-space" });
const poppins = Poppins({ subsets: ["latin"], display: "swap", preload: false, weight: ["400", "500", "600", "700"], variable: "--font-poppins" });
const manrope = Manrope({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-manrope" });
const sora = Sora({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-sora" });
// Bangla text: sits behind every font so Bangla letters always have a proper typeface.
const bangla = Hind_Siliguri({ subsets: ["bengali", "latin"], display: "swap", preload: false, weight: ["400", "500", "600"], variable: "--font-bn" });

export const fontClasses = [bodoni, hanken, fraunces, dmSans, dmSerif, space, poppins, manrope, sora, bangla].map((f) => f.variable).join(" ");
