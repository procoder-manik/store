import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Temporary check: which Supabase project is this server talking to?
 * It shows only the project code (already visible in every browser request) and the kind of each key, never a key itself.
 * Delete this file once login works.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  let project = "";
  try { project = new URL(url.trim()).hostname.split(".")[0]; } catch { project = "INVALID URL"; }
  const kind = (k: string) => (!k ? "missing" : k.startsWith("sb_publishable_") ? "publishable" : k.startsWith("sb_secret_") ? "secret" : k.startsWith("eyJ") ? "legacy-jwt" : "unknown");
  const bad = (v: string) => /[\s"']/.test(v);
  let authStatus: number | string = "not tested";
  try {
    const r = await fetch(`${url.trim()}/auth/v1/settings`, { headers: { apikey: anon.trim() }, cache: "no-store" });
    authStatus = r.status;
  } catch { authStatus = "could not reach"; }
  return NextResponse.json({
    project,
    authStatus,
    urlHasSpaceOrQuote: bad(url),
    anonKey: kind(anon), anonHasSpaceOrQuote: bad(anon),
    serviceKey: kind(svc), serviceHasSpaceOrQuote: bad(svc),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
    adminMfaOff: process.env.REQUIRE_ADMIN_MFA === "false",
  });
}
