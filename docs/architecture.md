# Architecture

## 1. Goals
Fast, secure, dynamic, brand-changeable e-commerce with a 3D storefront and a powerful admin panel. Light mode by default, with dark and system modes.

## 2. Database Choice: Supabase (PostgreSQL)
| Option | Verdict | Reason |
|---|---|---|
| Supabase | Chosen | Relational data (orders, variants, coupons), RLS, Auth, Storage, Realtime, pgvector, generous free tier |
| MongoDB Atlas | Not chosen | Weak fit for relational order and inventory logic |
| Postgres Pal | Not chosen | Limited free tier and ecosystem |

Free tier limits: 500 MB database, projects may pause when inactive. Upgrade to Pro as traffic grows.

## 3. System Diagram
```
Browser
  |
Cloudflare (WAF, DDoS, Bot, CDN)
  |
Vercel: Next.js
  |- Storefront (3D UI, SSR/ISR)
  |- Admin (/admin, role guarded)
  |- API layer (Zod, rate limit, CSRF)
  |
  |- Supabase: Postgres (RLS), Auth, Storage, Realtime, pgvector
  |- Upstash Redis: rate limit, cache
  |- Payments: SSLCommerz, bKash, Nagad (webhook verified)
  |- Couriers: Steadfast, Pathao, RedX
  |- Claude API: chatbot, SEO, prompt generator
  |- Resend: email, SMS gateway: OTP
```

## 4. Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind, shadcn/ui |
| 3D | React Three Fiber, Drei, GSAP, Framer Motion |
| Backend | Server Actions, API Routes, Supabase Edge Functions |
| Data | Supabase Postgres, Storage, Auth |
| Cache | Upstash Redis |
| Charts | Recharts |
| Email | Resend + React Email |
| AI | Claude API + pgvector (RAG) |

## 5. 3D Storefront Design
- Hanger rail scene on the home page. Products hang and scroll horizontally via drag, wheel, and swipe.
- Click a product: camera zooms in, side panel opens with gallery, variants, price, Add to Cart, Quick Checkout.
- Scene varies by category: hanger rack (clothing), folded stack (bedding), shelf (decor).
- Performance: products are lightweight textured planes, full GLB models load on demand (Draco/Meshopt), lazy-loaded 3D, auto 2D grid fallback on weak devices or `prefers-reduced-motion`.

## 6. Core Modules
- Catalog: simple, variable, group, bundle products; color and size variations with per-variation price, image, stock, SKU
- Cart, Quick Checkout, Checkout, Thank You, Order Tracking
- Upsell, cross-sell, order bump, post-purchase upsell, frequently bought together
- Discounts: percentage, fixed, BOGO, quantity tiers, coupons, flash sales
- Shipping: flat rate, percentage, weight, zone based, free-shipping threshold, courier APIs
- Funnel and landing page builder (CartFlows style) with inline checkout and quantity offers
- Page builder with reusable blocks, header/footer/menu/category editor
- Marketing: banners, popup builder, email marketing, SMS, abandoned cart recovery
- CRM and lead management, segments, notes, lifetime value
- AI SEO center and AI chatbot
- Social proof notifications (demo data first, real orders later, contact info hidden)
- Tracking: Facebook Pixel + CAPI, GA4, GTM, Search Console, Google Ads, TikTok, custom scripts
- Analytics dashboard: 7d, 15d, 30d, 3m, 6m, 1y, custom range

## 7. AI Chatbot
- RAG over products, prices, stock, policies, shipping, FAQ stored in pgvector
- Answers only from site data, refuses unrelated topics
- Recommends products, checks order status (OTP verified), adds to cart
- Captures leads into CRM, message sound, typing indicator, human handoff
- Rate limited, spam protected

## 8. AI SEO Center
- One-click meta title, description, keywords, slug, alt text, OG/Twitter cards
- Bulk optimization, SEO score
- Product description and image prompt generator
- Sitemap, robots.txt, canonical, redirects (301)
- Schema markup output as a single combined JSON-LD file

## 9. Payments and Fraud
- SSLCommerz (cards, banks, bKash, Nagad, Rocket), direct bKash/Nagad, COD with optional advance
- Server-side payment verification only (signed IPN/webhooks, idempotency keys)
- Fraud checks: courier success ratio by phone, blacklist (phone, IP, device, email), repeat-cancel detection, velocity limits, COD OTP, risk flag or auto-block, Turnstile CAPTCHA

## 10. Security
| Area | Controls |
|---|---|
| Auth | Email verification, OTP, mandatory admin 2FA, session timeout, device log |
| Authorization | RBAC (Super Admin, Manager, Staff, Support), RLS on all tables, server-side route guards |
| Input | Zod validation, parameterized queries, DOMPurify, CSRF tokens |
| Headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| Abuse | Upstash rate limits, Turnstile, Cloudflare WAF and DDoS |
| Payments | Hosted gateways only (no card data on server), signature verification |
| Secrets | Server-only env vars, service role key never exposed |
| Uploads | Type and size checks, malware scan, private buckets, signed URLs |
| Operations | Audit logs, daily backups, Sentry, dependency audits |
| Business logic | Prices recalculated server-side, inventory locking against race conditions |

## 11. Database Tables
profiles, roles, addresses, categories, products, product_variants, product_attributes, product_images, product_groups, product_relations, inventory, carts, cart_items, orders, order_items, order_events, payments, refunds, shipping_zones, shipping_rates, shipments, coupons, discount_rules, banners, popups, reviews, wishlists, compare_lists, leads, customers_crm, crm_notes, email_templates, email_campaigns, pages, page_blocks, funnels, funnel_steps, menus, site_settings, tracking_settings, seo_meta, chat_sessions, chat_messages, knowledge_embeddings, fraud_blacklist, notifications, social_proof_events, audit_logs, blog_posts

## 12. Performance
ISR/SSG, edge caching, AVIF/WebP, lazy loading, code splitting, third-party scripts deferred, DB indexes, Redis cache, Server Components to reduce client JS. Targets: LCP under 2.5 s, Lighthouse 90+.

## 13. Folder Structure
```
/app
  /(store)    home, shop, product, cart, checkout, account, wishlist, compare
  /(funnel)   landing and funnel pages
  /admin      dashboard, products, orders, shipping, marketing, crm, seo, builder, settings
  /api        webhooks, payments, chat, ai
/components   3d, ui, blocks, admin
/lib          supabase, security, validators, payments, couriers, ai
/emails       branded templates
/supabase     migrations, RLS policies, edge functions
```

## 14. Roadmap
| Phase | Scope |
|---|---|
| 1 | Setup, design system, schema + RLS, Auth, theming |
| 2 | Products, categories, variations, admin CRUD, uploads |
| 3 | 3D storefront, product view, cart, Quick Checkout |
| 4 | Checkout, payments, shipping, orders, fraud checker |
| 5 | Analytics dashboard, coupons, banners, popups, social proof |
| 6 | Page builder, funnel builder, header/footer editor |
| 7 | AI SEO, AI chatbot, CRM, leads |
| 8 | Email marketing, tracking pixels, wishlist, compare, reviews, loyalty |
| 9 | Security audit, pen test, performance and load testing |
| 10 | Launch, monitoring, backups, documentation |
