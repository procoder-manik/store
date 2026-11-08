# Sonar Tori — home decor store

An online store for bedsheets, quilts, pillows, cushions and home decor, built for Bangladesh: cash on delivery, bKash/Nagad/Rocket, delivery by zone, and an admin panel where the owner runs everything without touching code.

**Live site:** https://store.manikhossain.in

---

## What it does

**Storefront**
- Shop, categories, product pages with a picture gallery, a product video that plays first, design swatches, sizes and a clear discount badge
- Cart, quick checkout, order tracking, wishlist, compare, live search
- Coupons with rules (start date, per-customer limit, first order only, chosen products or categories, free delivery)
- Pre-orders, offers page, promo popup with several designs and triggers
- Shopping assistant chatbot that always answers from the live store data
- Light, dark and system themes

**Admin** (`/admin`, role guarded, two-step verification)
- Products with variants, pictures and video; categories; coupons; bundles
- Import products from other shops (Temu, AliExpress, Amazon, Daraz and more) with a Chrome extension: each product arrives as a draft with pictures copied into your own storage and the price converted to taka. The extension lives in its own folder outside this repository; the store side is `/api/import` and Admin, Import products
- Orders, customers, leads, reviews, email campaigns and automatic emails
- Delivery partners (Steadfast booking, other couriers with their own keys), delivery zones and fees
- Payment methods, theme and colours, header and footer, pages and landing pages, popup editor
- AI services: several free providers tried in order, with an email warning when one runs out

**Payments and delivery**
- Cash on delivery, manual mobile banking with transaction ID, and SSLCommerz
- Steadfast parcel booking from the order page

---

## Tech stack

| Part | Tool |
| :--- | :--- |
| App | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS |
| Database, login, files | Supabase (Postgres, Auth, Storage) |
| Hosting | Vercel (auto-deploys from `main`) |
| Email | Resend |
| Rate limiting | Upstash Redis |
| 3D hanger rail | three.js with React Three Fiber |
| Validation, state | Zod, Zustand |

---

## Project structure

```text
src/
  app/          Pages and API routes (shop, product, checkout, admin, media, ...)
  components/   Storefront and admin components
  lib/          Pricing, catalog, settings, checkout, couriers, AI, email, security
supabase/
  migrations/   SQL files, run in order in the Supabase SQL Editor
docs/           Architecture, client requirements, go-live checklist
.github/
  workflows/    Encrypted nightly database backup to Google Drive
CHANGES.md      What changed, newest first
```

---

## Run it locally

You need Node 20.9 or newer.

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run dev
```

Open http://localhost:3000.

Run the files in `supabase/migrations/` in order in the Supabase SQL Editor before the first start. `docs/GO-LIVE.md` lists every step.

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | TypeScript check |
| `npm run check` | Typecheck, then build |

---

## Environment variables

Real values go only in `.env.local` (never committed) and in the Vercel project settings. `.env.example` lists them all.

| Name | Used for |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Connecting the browser to Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Never expose it |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BRAND_NAME` | Site address and store name |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_SECRET` | Sending email |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting |
| `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_LIVE` | Online card and wallet payments |
| `STEADFAST_API_KEY`, `STEADFAST_SECRET_KEY` | Courier booking (can also be set in Admin, Delivery partners) |
| `GEMINI_API_KEY`, `ANTHROPIC_API_KEY` | AI services (more can be added in Admin, AI services) |
| `CRON_SECRET` | Protects the daily cleanup job |
| `REQUIRE_ADMIN_MFA` | Keep unset in production |

---

## Deployment

Pushing to `main` deploys to Vercel by itself. A daily job (`vercel.json`) expires unpaid orders at 03:00.

A nightly backup (`.github/workflows/db-backup.yml`) dumps the database, encrypts it and uploads it to Google Drive. It needs three repository secrets: `SUPABASE_DB_URL`, `BACKUP_PASSPHRASE` and `RCLONE_CONF`. See `docs/GO-LIVE.md` section 7.

---

## Documents

- [Go-live and security checklist](docs/GO-LIVE.md)
- [Architecture](docs/architecture.md)
- [Client requirements](docs/client.md)
- [Change log](CHANGES.md)

---

## Security

- No secret is stored in this repository. `.env` files are ignored, except `.env.example`.
- The admin panel needs a manager or super admin role and two-step verification.
- Keys for AI services and couriers saved in Admin are stored encrypted.
