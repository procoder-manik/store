import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const needsAuth = req.nextUrl.pathname.startsWith("/admin") || req.nextUrl.pathname.startsWith("/account");

  let user = null;
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    user = (await supabase.auth.getUser()).data.user;
  }

  if (needsAuth && !user) {
    const to = req.nextUrl.clone();
    to.pathname = "/login";
    to.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(to);
  }
  return res;
}

export const config = { matcher: ["/admin/:path*", "/account/:path*", "/login"] };
