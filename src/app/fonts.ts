import {
  Bricolage_Grotesque, Instrument_Sans, Fraunces, Karla, Cormorant_Garamond, Inter, Poppins, Nunito, Outfit, DM_Sans,
  Lora, Space_Grotesk, IBM_Plex_Sans, Hind_Siliguri,
} from "next/font/google";

// Only the default theme's two fonts are preloaded. The others download the moment a theme that uses them is chosen.
// Next.js reads these calls at build time, so each one must be a plain const with literal options.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-bricolage" });
const instrument = Instrument_Sans({ subsets: ["latin"], display: "swap", variable: "--font-instrument" });
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-fraunces" });
const karla = Karla({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-karla" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], display: "swap", preload: false, weight: ["500", "600", "700"], variable: "--font-cormorant" });
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-inter" });
const poppins = Poppins({ subsets: ["latin"], display: "swap", preload: false, weight: ["500", "600", "700"], variable: "--font-poppins" });
const nunito = Nunito({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-nunito" });
const outfit = Outfit({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-outfit" });
const dmsans = DM_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-dmsans" });
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-lora" });
const spacegrotesk = Space_Grotesk({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-spacegrotesk" });
const plex = IBM_Plex_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-plex" });
// Bangla text: sits behind every theme font so Bangla letters always have a proper typeface.
const bangla = Hind_Siliguri({ subsets: ["bengali", "latin"], display: "swap", preload: false, weight: ["400", "500", "600", "700"], variable: "--font-bn" });

export const fontClasses = [bricolage, instrument, fraunces, karla, cormorant, inter, poppins, nunito, outfit, dmsans, lora, spacegrotesk, plex, bangla].map((f) => f.variable).join(" ");
