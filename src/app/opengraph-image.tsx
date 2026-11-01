import { ImageResponse } from "next/og";
import { getPublicSettings } from "@/lib/settings";

export const alt = "Online store";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The picture shown when the store's link is shared on Facebook or WhatsApp. */
export default async function OgImage() {
  const { brand } = await getPublicSettings();
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#12332d", color: "#f5f5f1", padding: 72 }}>
      <div style={{ fontSize: 132, fontWeight: 500, letterSpacing: -3 }}>{brand.name}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 42, maxWidth: 950, lineHeight: 1.2 }}>{brand.tagline}</div>
        <div style={{ marginTop: 40, height: 2, width: "100%", background: "#c9a45c" }} />
      </div>
    </div>,
    size,
  );
}
