import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Only same-site paths, so a crafted link cannot send someone to another website after signing in. */
const safePath = (n: string | null) => (n && /^\/(?![/\\])/.test(n) && !/[\\\r\n]/.test(n) ? n : "/");

/** Where Google, and later other sign-in providers, send the customer back to. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safePath(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const failed = () => NextResponse.redirect(`${url.origin}/login?error=social&next=${encodeURIComponent(next)}`);
  if (url.searchParams.get("error") || !code) return failed();
  const { error } = await (await createClient()).auth.exchangeCodeForSession(code);
  if (error) return failed();
  return NextResponse.redirect(`${url.origin}${next}`);
}
