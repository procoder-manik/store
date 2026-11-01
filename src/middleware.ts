import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { adminHome, canOpen, isStaffRole } from "@/lib/roles";

export async function middleware(req: NextRequest) {
  // Preview pages exist only on a developer's computer.
  if (req.nextUrl.pathname.startsWith("/dev") && process.env.NODE_ENV === "production") return new NextResponse("Not found", { status: 404 });
  if (req.nextUrl.pathname === "/shop") {
    const cat = req.nextUrl.searchParams.get("cat");
    if (cat && /^[a-z0-9-]{1,80}$/.test(cat)) {
      const to = req.nextUrl.clone();
      to.pathname = `/category/${cat}`;
      to.searchParams.delete("cat");
      return NextResponse.redirect(to, 308);
    }
    return NextResponse.next();
  }
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
    // Each role sees only its part of the admin panel. Checked on every page change, not only the first load.
    if (user && req.nextUrl.pathname.startsWith("/admin")) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      const role = String(profile?.role ?? "");
      const path = req.nextUrl.pathname;
      if (isStaffRole(role) && !canOpen(role, path)) {
        const to = req.nextUrl.clone();
        to.pathname = adminHome(role);
        to.search = "";
        return NextResponse.redirect(to);
      }
    }
  }

  if (needsAuth && !user) {
    const to = req.nextUrl.clone();
    to.pathname = "/login";
    to.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(to);
  }
  return res;
}

export const config = { matcher: ["/admin/:path*", "/account/:path*", "/login", "/shop", "/dev/:path*"] };
