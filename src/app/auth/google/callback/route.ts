import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GOOGLE_COOKIE, safePath } from "@/lib/google-signin";
import { createClient } from "@/lib/supabase/server";

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Google sends the customer back here. The code is swapped for an ID token on the server, and Supabase opens the session with it. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const store = await cookies();
  let saved: { state?: string; nonce?: string; next?: string } = {};
  try { saved = JSON.parse(store.get(GOOGLE_COOKIE)?.value ?? "{}"); } catch { /* treated as missing below */ }
  store.delete({ name: GOOGLE_COOKIE, path: "/auth/google" });

  const next = safePath(saved.next);
  const failed = (why: string) => {
    console.error("Google sign in failed:", why);
    return NextResponse.redirect(`${url.origin}/login?error=social&next=${encodeURIComponent(next)}`);
  };

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  if (url.searchParams.get("error")) return NextResponse.redirect(`${url.origin}/login?next=${encodeURIComponent(next)}`); // the customer pressed cancel
  if (!code || !saved.state || !saved.nonce || !same(state, saved.state)) return failed("state did not match");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    signal: AbortSignal.timeout(10_000),
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: `${url.origin}/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  }).catch(() => null);
  if (!res?.ok) return failed(`token exchange ${res?.status ?? "no answer"}`);
  const { id_token: token } = (await res.json()) as { id_token?: string };
  if (!token) return failed("no ID token");

  const { error } = await (await createClient()).auth.signInWithIdToken({ provider: "google", token, nonce: saved.nonce });
  if (error) return failed(error.message);
  return NextResponse.redirect(`${url.origin}${next}`);
}
