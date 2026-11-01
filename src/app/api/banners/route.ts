import { NextResponse } from "next/server";
import { getBanners } from "@/lib/banners";
import { clientIp, rateLimit } from "@/lib/ratelimit";

/** Banners for one group, for shortcodes placed in page text. The answer is cached for a minute, so busy pages do not reach the database. */
export async function GET(req: Request) {
  const slot = new URL(req.url).searchParams.get("slot") ?? "";
  if (!/^[a-z0-9-]{1,40}$/.test(slot)) return NextResponse.json({ items: [] }, { status: 400 });
  if (!(await rateLimit(`banners:${await clientIp()}`, 120, 60))) return NextResponse.json({ items: [] }, { status: 429 });
  const items = (await getBanners()).filter((b) => b.slot === slot);
  return NextResponse.json({ items }, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
