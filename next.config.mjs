import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const isDev = process.env.NODE_ENV !== "production";

// Phase 1 CSP. Inline scripts are allowed for the theme bootstrap.
// Phase 9: move to nonce based CSP.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data: https:  https://*.supabase.co https://images.pexels.com https://images.unsplash.com https://cdn.pixabay.com https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com",
  "media-src 'self' https://*.supabase.co",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Pin the project root so a stray package-lock.json higher up the disk is never picked as the workspace.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  reactStrictMode: true,
  // Sign-ins and reset links belong to one address. The Vercel address sends everyone to the real domain.
  async redirects() {
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    if (!site?.startsWith("https://")) return [];
    return [{ source: "/:path*", has: [{ type: "host", value: "store-rocoder-manik.vercel.app" }], destination: `${site.replace(/\/$/, "")}/:path*`, permanent: false }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Private areas stay out of search engines and shared caches.
      ...["/admin/:path*", "/account/:path*", "/login", "/mfa/:path*", "/reset-password", "/thank-you/:path*", "/pay/:path*", "/invoice/:path*"].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "private, no-store" }],
      })),
    ];
  },
};
export default nextConfig;
