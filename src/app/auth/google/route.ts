import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { GOOGLE_COOKIE, googleDirect, safePath } from "@/lib/google-signin";

/** Sends the customer to Google. The state and nonce stop anyone from finishing a sign in that this browser did not start. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safePath(url.searchParams.get("next"));
  if (!googleDirect()) return NextResponse.redirect(`${url.origin}/login?error=social&next=${encodeURIComponent(next)}`);
  const state = randomBytes(24).toString("base64url");
  const nonce = randomBytes(24).toString("base64url");
  const to = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  to.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: `${url.origin}/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state,
    // Google is given the hash. Supabase is given the original later and checks that they match.
    nonce: createHash("sha256").update(nonce).digest("hex"),
  }).toString();
  const res = NextResponse.redirect(to);
  res.cookies.set(GOOGLE_COOKIE, JSON.stringify({ state, nonce, next }), { httpOnly: true, secure: url.protocol === "https:", sameSite: "lax", path: "/auth/google", maxAge: 600 });
  return res;
}
