import { Bodoni_Moda, Hanken_Grotesk, Hind_Siliguri } from "next/font/google";

// Next.js reads these calls at build time, so each one must be a plain const with literal options.
const bodoni = Bodoni_Moda({ subsets: ["latin"], display: "swap", axes: ["opsz"], variable: "--font-bodoni" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], display: "swap", variable: "--font-hanken" });
// Bangla text: sits behind both fonts so Bangla letters always have a proper typeface.
const bangla = Hind_Siliguri({ subsets: ["bengali", "latin"], display: "swap", preload: false, weight: ["400", "500", "600"], variable: "--font-bn" });

export const fontClasses = [bodoni, hanken, bangla].map((f) => f.variable).join(" ");
