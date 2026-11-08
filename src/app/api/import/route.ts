import { NextResponse } from "next/server";
import { importProduct } from "@/lib/importer";
import { verifyImportToken } from "@/lib/import-config";
import { clientIp, rateLimit } from "@/lib/ratelimit";

/**
 * Receives a product from the browser extension. It is not a public page: every call needs the import token made in
 * Admin, Import products, and the result is always a draft that only the owner can publish.
 */

// Copying pictures and writing the description can take a while.
export const maxDuration = 60;

// The extension runs on other sites' pages, so the browser asks permission first. The token, not the origin, is what protects this.
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Max-Age": "86400" };
const reply = (body: object, status = 200) => NextResponse.json(body, { status, headers: { ...CORS, "Cache-Control": "no-store" } });

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: Request) {
  if (!(await rateLimit(`import-ip:${await clientIp()}`, 60, 600))) return reply({ ok: false, error: "Too many tries. Wait a few minutes." }, 429);
  if (!(await verifyImportToken(req.headers.get("authorization")))) return reply({ ok: false, error: "The import token is missing or wrong. Make one in Admin, Import products, and paste it into the extension." }, 401);
  if (!(await rateLimit("import-all", 60, 3600))) return reply({ ok: false, error: "Hourly import limit reached. Try again later." }, 429);

  const raw = await req.text();
  if (raw.length > 400_000) return reply({ ok: false, error: "That product is too large to import." }, 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return reply({ ok: false, error: "The product data was not valid." }, 400); }

  const r = await importProduct(body);
  return reply(r, r.ok ? 200 : 422);
}
