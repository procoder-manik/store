export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Sonar Tori",
  tagline: "Bedsheets, pillows and home decor chosen to last",
};

export const formatPrice = (n: number) => `৳${n.toLocaleString("en-US")}`;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
