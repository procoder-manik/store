import { NextResponse } from "next/server";

/**
 * Serves a supplier's product picture or video from this site's own address, so a visitor never sees where it came from:
 * the address in the page, "open image in new tab" and "copy video address" all point to this store.
 * Only the supplier's product media paths below can be fetched, never any other address.
 */
const SOURCES = {
  i: { base: "https://img.kwcdn.com/product/", ext: /\.(jpe?g|png|webp|avif)$/i, cache: "public, max-age=31536000, immutable" },
  v: { base: "https://goods-vod.kwcdn.com/goods-video/", ext: /\.mp4$/i, cache: "public, max-age=604800" },
} as const;

const PART = /^[A-Za-z0-9._-]{1,120}$/;
const PASS = ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"];

export async function GET(req: Request, { params }: { params: Promise<{ kind: string; path: string[] }> }) {
  const { kind, path } = await params;
  const src = SOURCES[kind as keyof typeof SOURCES];
  if (!src || path.length > 3 || !path.every((p) => PART.test(p)) || !src.ext.test(path[path.length - 1])) return new NextResponse("Not found", { status: 404 });

  const range = req.headers.get("range");
  let up: Response;
  try {
    up = await fetch(src.base + path.join("/"), {
      headers: { Referer: "https://www.temu.com/", "User-Agent": "Mozilla/5.0", ...(range ? { Range: range } : {}) },
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!up.ok || !up.body) return new NextResponse("Not found", { status: 404 });

  const headers = new Headers({ "Cache-Control": src.cache, "X-Content-Type-Options": "nosniff" });
  for (const h of PASS) { const v = up.headers.get(h); if (v) headers.set(h, v); }
  return new NextResponse(up.body, { status: up.status, headers });
}
