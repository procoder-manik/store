import type { MetadataRoute } from "next";
import { getPublicSettings } from "@/lib/settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { brand } = await getPublicSettings();
  return {
    name: brand.name, short_name: brand.name, description: brand.tagline, start_url: "/", display: "standalone",
    background_color: "#f1f2f8", theme_color: "#1b2380",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
