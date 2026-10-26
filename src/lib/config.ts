export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Loomhaus",
  tagline: "Clothing, bedding and home decor",
};

export const formatPrice = (n: number) => `৳${n.toLocaleString("en-US")}`;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
