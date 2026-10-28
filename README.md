# Loomhaus Store

A fast, fully editable online store for Bangladesh with a 3D hanger-style storefront and a complete admin panel. It sells clothing (T-shirts, hoodies), bedding and covers, and home decor. Everything the owner needs to change (pages, menus, payments, emails, colours, text size) is editable in the admin panel, with no code changes.

- **Live site:** https://store.manikhossain.in
- **Admin panel:** https://store.manikhossain.in/admin (sign in at `/login`, two-step verification required)
- **Code:** private GitHub repository, deployed automatically by Vercel on every push to `main`
- **Database and file storage:** Supabase (project code is in your Supabase dashboard, not stored here)

> This file is the single source of truth for the whole project: how it is built, what exists, how to run and update it, what went wrong before, and what is still to do. Last updated 28 Oct 2026.

---

## দ্রুত নির্দেশিকা (বাংলা)

প্রজেক্ট ফোল্ডার: আপনার কম্পিউটারের `store` ফোল্ডার (যেখানে `package.json` আছে)

**নতুন আপডেট zip বসানো ও লাইভ করা (PowerShell):**
```powershell
cd "আপনার-প্রজেক্ট-ফোল্ডারের-পথ"
Expand-Archive -Force $HOME\Downloads\update-XX.zip .
dir
```
`dir`-এ root-এ `app`, `components` বা `lib` ফোল্ডার তৈরি হলে ভুল (ফাইলগুলো `src`-এর ভেতরে যাওয়ার কথা)। তখন:
```powershell
robocopy app src\app /E
robocopy components src\components /E
robocopy lib src\lib /E
Remove-Item -Recurse -Force app, components, lib -ErrorAction SilentlyContinue
```
তারপর:
```powershell
git add -A
git commit -m "কী বদলালো"
git push
```
Vercel নিজে build করে। Vercel → Deployments-এ **Ready** হলে `Ctrl+F5` দিয়ে সাইট দেখুন। **Error** হলে লগের শেষ অংশ নিয়ে কাজ করুন।

**লোকালে চালানো:** `npm run dev`, তারপর `http://localhost:3000`। লোকাল আর লাইভ **একই Supabase ডেটাবেস** ব্যবহার করে, তাই লোকালে করা order/product লাইভেও দেখা যায়।

**Admin-এ ঢুকতে না পারলে:** নিচের "Troubleshooting" দেখুন।

---

## 1. Architecture

```
Visitor's browser
      |
Cloudflare (optional, recommended: WAF, DDoS, bot protection, CDN)
      |
Vercel: Next.js 15 app (App Router, React 19, TypeScript)
  |- Storefront      server-rendered pages, cached 60 s, 3D rail loads on demand
  |- Admin           /admin, role guarded, two-step verification
  |- Server actions  all writes: checkout, forms, admin changes (validated with Zod)
  |- API routes      chat, search, social proof, payment callbacks, nightly cron
  |
  |- Supabase        Postgres (row level security on every table), Auth, Storage (product-images bucket)
  |- Upstash Redis   shared rate limits (optional; without it limits are per server)
  |- Resend          email (orders, campaigns, automatic emails)
  |- Gemini API      chat assistant and AI text help (Anthropic Claude is the fallback)
  |- SSLCommerz      online payment page (optional)
  |- Steadfast       courier booking (optional)
  |
GitHub  --push-->  Vercel (auto deploy)        GitHub Actions --nightly--> encrypted DB backup --> Google Drive
```

**How an order flows:** the shopper submits checkout → a server action re-validates everything (prices and stock are recalculated on the server, never trusted from the browser) → fraud check → the database function `create_order` writes the order and holds stock → email → thank-you page. Staff then manage it in Admin → Orders.

**Principles:** the browser is never trusted; every table has row level security; admin writes go through `requireAdmin` / `requireStaff`; secrets live only in server environment variables; the store and the admin share one codebase and one database.

### Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 3, CSS variables for themes |
| 3D | three.js, @react-three/fiber (hanger rail and card carousels, lazy loaded, 2D grid fallback) |
| State | zustand (cart, wishlist), next-themes (light, dark, system) |
| Validation | Zod 4 |
| Database and auth | Supabase (Postgres, Auth, Storage) via `@supabase/ssr` |
| Email | Resend |
| AI | Gemini (`gemini-2.5-flash` by default), Anthropic as fallback |
| Hosting | Vercel (app), Supabase (data), GitHub (code and nightly backups) |

### Folder structure

```
src/
  app/
    page.tsx, layout.tsx, globals.css      home, root layout (header, footer, chat, popups), themes
    shop/ category/ product/ catalog/      storefront pages
    checkout/ thank-you/ pay/ track/       buying and order tracking
    account/ wishlist/ compare/ login/     customer area
    [slug]/                                built-in info pages (about, contact, faq, shipping, returns, size guide, privacy, terms)
    p/[slug]/  lp/[slug]/                  custom pages and landing pages made in the builder
    mfa/setup  mfa/verify                  admin two-step verification
    admin/                                 the whole admin panel (one folder per area)
    api/                                   chat, search, social-proof, pay/sslcommerz, cron/expire-orders, debug-env (temporary)
    actions/                               public server actions (contact form, newsletter, reviews)
  components/                              storefront components, 3d/ (HangerRail, CardCarousel), admin/ (editors and builders)
  lib/                                     settings, payments, blocks, email-builder, fraud, checkout pricing, sslcommerz, steadfast, ai, utils
  middleware.ts                            sends visitors without a login away from /admin and /account
supabase/migrations/                       0001 ... 0018 (run in order)
docs/                                      architecture.md, client.md, GO-LIVE.md (original plan and launch checklist)
.github/workflows/db-backup.yml            nightly encrypted database backup
next.config.mjs                            security headers, image rules
```

> Only `src/` is used by the app. If you ever see `app/`, `components/` or `lib/` folders next to `src/` at the project root, they are stray copies from a bad unzip. Next.js prefers a root `app/` folder over `src/app/`, which breaks the site. Remove them (see the Bengali guide above).

---

## 2. What the store can do

### Storefront
- 3D hanger rail home page (drag, wheel, swipe) with a 2D grid fallback on weak devices and for reduced motion. 9 3D styles in total (four hanger styles: wood, wire, gold, velvet; and arc, coverflow, diagonal, stack, wave).
- The slider background can change colour with each product, smoothly, in both the boxed and the full-width version. A "Soft wall" option keeps the original look.
- Shop, category and product pages with colour and size variants, live stock, search with suggestions, wishlist and compare.
- Product cards: **Add to cart** adds the first in-stock option directly. **Buy now** opens a quick checkout popup. The popup scrolls on phones and the address box and order button keep a fixed size.
- Light, dark and system modes, 8 themes, visitor theme picker (optional), accent colours, button shapes.
- Header and footer: 5 headers (classic, centered logo, marketplace, split, bold dark) and 5 footers (classic, minimal, dark with sign up, contact first, compact), chosen with a visual picker in Admin.
- Top announcement bar that visitors can close. A Back to Top button (can be switched off).
- Contact page with a form and six information boxes (shop, phones, WhatsApp, email, hours, address with map link) that you edit in Settings.
- `/catalog`: a product book with pictures and names only, no prices, with "Ask for price" on WhatsApp and a print button. Useful for wholesale and when prices change often. Can be switched off.
- Chat assistant (see section 6) with your logo or any picture, and a WhatsApp link underneath.
- Order tracking by order number and phone, thank-you page and printable invoice.

### Checkout and payments
- Cash on delivery, bKash, Nagad, Rocket, Upay and bank transfer, each with its own on/off switch in **Admin → Payment methods**.
- bKash, Nagad, Rocket, Upay and bank transfer are **manual**: the customer sees your number, sends the money, then enters the number they sent from and the transaction ID. The server checks the format and refuses a transaction ID that was already used. Staff open the order, check the payment in the wallet or bank app, then press **Payment received** or **Could not find it**.
- SSLCommerz (cards, bKash, Nagad, Rocket, banks on one hosted page) is built and switched on by environment variables. aamarPay, ShurjoPay, PayPal and Payoneer are listed as "Not connected yet" and cannot be switched on.
- Server-side pricing, shipping zones with free-over thresholds, coupons, bundles, order bump (one extra offer at checkout), store credit and referrals.
- Fraud protection: blacklist (phone, IP, email), at most 3 orders per phone in 24 hours, at most 8 per IP in one hour, a risk score, and a hidden trap field that stops bots. Customers always see the same vague message, the real reason goes to the server log. Signed-in staff skip the speed limits so they can test.
- Abandoned cart capture (Admin → Abandoned carts).

### Admin panel (`/admin`)
| Area | What you do there |
|---|---|
| Dashboard | Sales charts and key numbers |
| Orders | Statuses, shipment and tracking, Steadfast booking, invoice and packing slip, refunds, phone orders, CSV export, payment checking |
| Products, Categories | Variants, stock, many pictures (upload or link), tags, offers |
| Coupons, Bundles, Banners, Shipping | Discounts, bundles, home banners, delivery areas and fees |
| Payment methods | Switch each method on or off, set numbers and instructions |
| Fraud protection | Blacklist and risk settings |
| Customers (CRM), Reviews, Abandoned carts | Segments, notes, lifetime value, review moderation |
| Email marketing | Block-based email builder, campaigns to leads and customers, automatic emails |
| Pages, Landing pages | Page builder with 30+ block types, spacing and text controls (section 3) |
| Header and footer, Site and menu | Pick designs, edit menus, footer columns, logo, store name |
| Settings | Theme, announcement, tracking pixels, popup, contact, chat assistant, Back to Top and catalog, order bump, social proof |
| SEO (Search listings), URLs and search | Meta titles and descriptions, redirects, permalinks |
| Audit log, Health check | Who changed what; a checklist that shows missing environment variables |

Small **(i)** icons beside settings explain what each option is for and why you would use it. They are on Settings, Payment methods, Header and footer, Email marketing and the email builder. They are not yet on every admin page.

---

## 3. Page builder

Pages are built from blocks you add, drag and reorder (**Admin → Pages**, **Landing pages**, and the built-in pages such as the home page).

**Blocks:** Product showcase hero; Hero banner; 3D product slider; Image slider; Banner; each of these also has a **full width** version (background edge to edge, text kept inside the same container as the header). Plus Product spotlight, Page title (with breadcrumb), Text with headings, Picture and text side by side, Trust badges, Products, Categories, Offer banners, Features, Questions (FAQ), Image, Photo gallery, Customer words, Numbers that count up, Countdown timer, Scrolling ticker, Email sign up, Call to action (gradient style), **Custom HTML code**, and Order form with offers (landing pages).

**Per-section controls (every block):**
- Heading tag: H1 to H6 or a plain paragraph, with a size that matches the tag, or a custom size in pixels for computer and phone, font weight and letter case.
- Padding and margin, top, bottom, left and right, in pixels. Empty means the section keeps its own spacing.
- Entrance animation.
- 3D slider only: where the previous and next buttons go (off, sides, top right, bottom), where the category buttons go (off, left, centre, right), heading alignment, heading background (none, theme colour, gradient, own colour) and the slider background.

**Custom HTML block:** your HTML, CSS and JavaScript run exactly as written inside their own sandboxed frame, so they cannot change or break the rest of the store or read a visitor's login. The frame sizes itself to the content.

**Images:** every picture field accepts an upload from your computer or a link. Uploads go to the Supabase `product-images` bucket.

---

## 4. Email marketing

**Admin → Email marketing → New email** opens a block builder with a live preview (computer and phone).

- Blocks: big banner, text, products and offers, offer highlight with a coupon code, button, picture, line, space.
- Drag products from your catalog into a Products block, or press +. Give each product a percentage, or one percentage for all. The email shows the old price struck out, the new price and a "20% OFF" badge.
- **Important:** the percentage is shown in the email only. The store price does not change. To really give the discount, create a coupon under **Coupons** with the same code you put in the Offer block.
- Audiences: leads and subscribers (everyone with an email who has not unsubscribed), all customers, VIP customers. The size of each audience is shown before sending. One send is limited to 500 people. Everyone gets an unsubscribe link. Send yourself a test first.
- Older plain templates open in the builder automatically.
- Automatic emails (order placed, shipped, welcome, contact received and others) are edited under **Email marketing → Automatic emails**.
- Needs `RESEND_API_KEY` and `EMAIL_FROM`, with your sending domain verified in Resend.

---

## 5. Settings stored in the database

Every setting is a row in the `site_settings` table (key and JSON value, public read, admin write). Keys: `announcement`, `tracking`, `popup`, `proof`, `bump`, `chat`, `contact`, `appearance`, `brand`, `header`, `footer`, `extras`, `payments`, `header_style`, `footer_style`.

Secrets are never stored there. Payment gateway keys (SSLCommerz) are environment variables only. The `payments` setting holds only the numbers you show to customers.

---

## 6. Chat assistant

- A floating button with "Chat with us". The picture is your store logo unless you set another one (upload or link) in **Settings → AI shopping assistant**.
- Answers only from live store data: every product with name and price, the most relevant products in detail (colours, sizes, stock), categories, delivery fees, the payment methods that are switched on, contact details, the delivery, returns, FAQ and size guide pages, and your own notes. New products appear automatically.
- Under the typing box: "Need a quick reply? Contact us on WhatsApp." The link opens WhatsApp with your preset message plus the customer's last question. Switch it on or off and set the number in Settings (empty means the WhatsApp number from the Contact box).
- After a few messages it offers to take the customer's number as a lead.
- Needs `GEMINI_API_KEY` (free key from Google AI Studio). Rate limited per visitor.

---

## 7. Database

Run these once each in the Supabase SQL Editor, **in order**:

| File | Purpose |
|---|---|
| `0001_init` | Profiles and roles, categories, products, variants, orders, settings, row level security |
| `0002_storage` | Product image bucket |
| `0003_orders` | Order creation function, statuses |
| `0004_dashboard` | Dashboard queries |
| `0005_customer_selling` | Coupons, wishlist, reviews, order bump data |
| `0006_crm_email_chat` | Customers, email templates and campaigns, abandoned carts, chat |
| `0007_pages_bundles` | Pages and bundles |
| `0008_indexes` | Speed |
| `0009_payments` | Online payments table and unpaid-order cleanup |
| `0010_shipping_extras` | Courier, tracking, invoices |
| `0011_permalinks` | Custom URLs and redirects |
| `0012_landing_builder` | Landing pages |
| `0013_email_log` | Log of sent emails |
| `0014_credit_refunds_offers` | Store credit, refunds, landing offers |
| `0015_flexible_status` | Flexible order statuses |
| `0016_leads_repeat_contacts` | Repeat contacts as leads |
| `0017_manual_payments` | Transaction ID and sender number on orders (manual payments) |
| `0018_email_builder` | Stores email builder blocks |

Roles: `customer`, `staff`, `manager`, `super_admin`. Make yourself admin:
```sql
update public.profiles set role = 'super_admin'
where id = (select id from auth.users where email = 'you@example.com');
```
Optional hardening: `supabase-optional-enforce-mfa.sql` makes the database itself refuse staff actions without two-step verification.

---

## 8. Environment variables

Set these in **Vercel → Settings → Environment Variables** (Production) and in `.env.local` for local work. After changing any of them in Vercel you must **Redeploy**. Names starting `NEXT_PUBLIC_` are baked in at build time, so a redeploy without a rebuild is not enough for those. Never commit `.env.local`.

| Name | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Everything |
| `SUPABASE_SERVICE_ROLE_KEY` | Orders, contact form, emails, admin tasks. **Server only, never `NEXT_PUBLIC_`.** Without it the contact form and checkout fail. |
| `NEXT_PUBLIC_SITE_URL` | `https://store.manikhossain.in` (must be https) |
| `NEXT_PUBLIC_BRAND_NAME` | Starting store name (later changed in Admin) |
| `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`) | Chat assistant and AI text help |
| `RESEND_API_KEY`, `EMAIL_FROM` | Emails |
| `EMAIL_SECRET` | Signs unsubscribe links. Use a long random text. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared rate limits (optional, recommended) |
| `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_LIVE` | Online payment page (optional) |
| `CRON_SECRET` | Protects the nightly job that cancels unpaid online orders |
| `STEADFAST_API_KEY`, `STEADFAST_SECRET_KEY` | Courier booking (optional) |
| `REQUIRE_ADMIN_MFA` | **Must not be set in production.** `false` switches off two-step verification (local testing only). |

Check what the live server actually sees: **Admin → Health check**.

---

## 9. Run, deploy and update

**Local:** `npm install`, copy `.env.example` to `.env.local` and fill it, `npm run dev`.

**Deploy:** push to the `main` branch of the private GitHub repository. Vercel builds and publishes automatically. Domain `store.manikhossain.in` is attached in Vercel.

**Scripts:** `npm run dev`, `npm run build`, `npm run lint` (this is `tsc --noEmit`, a type check).

**Build rules learned the hard way:**
- A file starting with `"use server"` may only export `async` functions (and types). Exporting a normal function makes the Vercel build fail, even though the type check passes.
- Stray `app/`, `components/` or `lib/` folders at the project root break the app. `tsconfig.json` excludes root `components` and `lib`.
- A full `next build` needs internet access to Google Fonts. It cannot run in a sandbox without it.

---

## 10. Backups

`.github/workflows/db-backup.yml` runs every night at 02:30 Bangladesh time (and on demand from the Actions tab):
1. Dumps the `public` and `auth` schemas of the database.
2. Encrypts the dump with AES-256 using `BACKUP_PASSPHRASE`.
3. Uploads it to Google Drive in `Loomhaus-backups` (kept 30 days) and keeps a second copy on GitHub for 7 days.

GitHub repository secrets it needs: `SUPABASE_DB_URL` (Supabase → Connect → **Session pooler** URI with the database password), `BACKUP_PASSPHRASE`, `RCLONE_CONF` (output of `rclone config show gdrive`).

Google Drive access uses your own Google Cloud OAuth client (your own client, scope `drive.file`, app published, so the token does not expire after 7 days).

**Restore:** `gpg -d loomhaus-db-DATE.sql.gz.gpg | gunzip | psql "NEW_DATABASE_URL"` into a fresh Supabase project. Test a restore once a year.

**Not in the backup:** product pictures (Supabase Storage). Keep the originals elsewhere. **If `BACKUP_PASSPHRASE` is lost, backups cannot be opened.**

---

## 11. Security

In place: row level security on all tables; mandatory two-step verification for admin; role checks on every admin write; Zod validation on every input; server-side price and stock; hidden-field bot trap with a name that password managers ignore; rate limits; fraud checks; security headers (CSP, HSTS, frame, referrer, permissions); private service key; audit log; custom HTML runs in a sandboxed frame; manual-payment transaction IDs cannot be reused; backups are encrypted.

Content Security Policy note: images may come from any https site and Google Fonts are allowed, so custom HTML can look exactly as written. Inline scripts are still allowed (needed by the theme switcher and analytics).

No website is completely unhackable. Keep packages updated (`npm audit`), keep keys private, and keep your phone with the authenticator safe.

---

## 12. Troubleshooting (things that actually happened)

| Symptom | Cause and fix |
|---|---|
| Contact form: "Messages are not available right now" | `SUPABASE_SERVICE_ROLE_KEY` missing in Vercel. Add it, Redeploy. The real error is in Vercel → Logs as `[contact] could not send`. |
| Checkout or Buy now: "We could not place this order" | Either the bot trap was filled (browser autofill filled the old `website` field, now fixed by renaming it) or a fraud rule fired (same phone more than 3 times in 24 hours, same IP more than 8 times in an hour, blacklist). Check Vercel → Logs for `[order-blocked] reason=...`. Use a fresh phone number when testing, or sign in as admin. |
| `/admin` sends you to `/login?next=/admin` | Normal. You are not signed in. Sign in with the admin email at `/login`. Never press "Create an account" for admin. |
| "Invalid login credentials" | Wrong email or password for that Supabase project. Create the user in Supabase → Authentication → Users, then set `role = 'super_admin'` in `profiles`. Use a private window so the browser does not autofill an old password. |
| After sign in you are asked to set up two-step verification | Scan the QR code with Google Authenticator (or Microsoft Authenticator, Authy) and enter the 6 digit code. Keep the setup key safe. |
| Vercel build fails: "Server Actions must be async functions" | A `"use server"` file exports a non-async function. Remove `export`. |
| Vercel build fails with `components/...` type errors | Stray root folders. Remove them. |
| Local `Module not found: './fonts'` | Root `app/` folder shadows `src/app`. Remove root `app/`. |
| Order placed but payment status unpaid for bKash and others | Expected. Staff check the wallet and press **Payment received**. |
| Email builder Save says to run a migration | Run `0018_email_builder.sql`. |
| Discount shown in email not applied at checkout | Percentages in emails are display only. Create a matching coupon. |
| Environment variable changed but nothing happened | Redeploy. `NEXT_PUBLIC_` values need a fresh build. |

---

## 13. Build history

| Round | What was added |
|---|---|
| Foundation (phases 1 to 7 of the original plan) | Schema with security, products and uploads, 3D storefront, checkout with cash on delivery, shipping, orders, fraud checks, dashboard, coupons, banners, popups, social proof, page builder, landing pages, SEO tools, chatbot, CRM and leads, email marketing, tracking pixels, wishlist, compare, reviews, SSLCommerz and Steadfast code |
| Update 1 | Add to cart adds directly; checkout fixes; manual payments (bKash, Nagad, Rocket, Upay, bank) with transaction IDs and verification; 5 headers and 5 footers with a picker; heading tags with paragraph option, sizes, weight, case |
| Update 2 | Back to Top (toggle); chat picture and WhatsApp link; contact page boxes and settings; better page titles; closable announcement bar; image upload everywhere pictures are used; contact error logging |
| Update 3 to 4 | Chat assistant trained from the live store; hero product name; email builder with products and offers, audiences, `/catalog`, (i) info icons |
| Update 5 to 9 | Full-width versions of hero blocks; custom HTML block; gradient call-to-action; picture and text block; trust badges; per-section padding and margin; full-width 3D slider with colour-changing background; arrow, filter and heading controls |
| Update 10 to 12 | Buy now popup fixes on phones; centred 3D filter with room for arrows; boxed 3D slider colour background and "Soft wall" option; bot trap renamed (fixes blocked orders) |
| Operations | Live on Vercel with a custom domain; environment fixed; admin account and two-step verification set up; nightly encrypted backup workflow built |

---

## 14. Pending tasks (what is left)

Work from the top. Tick each box when done and keep this list updated.

### A. Do now (security, about 10 minutes)
- [ ] Remove `REQUIRE_ADMIN_MFA` from Vercel, then Redeploy. First check that the authenticator app on your phone works.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to `https://store.manikhossain.in` (it was `http://`), then Redeploy.
- [ ] Delete the folder `src/app/api/debug-env` and push. It is a temporary check page.
- [ ] If the admin password was ever set to a simple temporary one, replace it with a strong private one.
- [ ] Replace keys that were pasted in chat: a new `EMAIL_SECRET`, a new `GEMINI_API_KEY`, and any other key that was ever shown in full.

### B. Finish the backup
- [ ] Add the GitHub secret `RCLONE_CONF` (output of `rclone config show gdrive`). Check the other two secrets are named exactly `SUPABASE_DB_URL` and `BACKUP_PASSPHRASE`.
- [ ] Run **Actions → Daily database backup → Run workflow** once and check that a `.gpg` file appears in Google Drive. Write `BACKUP_PASSPHRASE` down somewhere safe outside GitHub.
- [ ] A GitHub secret named `STORE_DB_CLONE` exists and nothing here uses it. Find out who made it, or delete it.
- [ ] If the repository has an older `backup.yml` workflow (mentioned in `docs/GO-LIVE.md`), remove it so only one backup runs.
- [ ] Keep the original product photos outside Supabase. They are not in the database backup.

### C. Confirm these are done (not known)
- [ ] Migrations `0017` and `0018` were run in the Supabase SQL Editor.
- [ ] Admin → Payment methods: bKash, Nagad and Rocket switched on, numbers entered, saved.
- [ ] Admin → Settings: contact numbers, WhatsApp number, chat assistant switched on with a notes text, catalog on or off.
- [ ] Admin → Header and footer: a design picked and saved.
- [ ] Admin → Site and menu: `/catalog` added to the menu, if wanted.
- [ ] Test orders placed on the live site (Checkout page, Buy now popup, one with bKash) and a contact message sent.

### D. Harden later
- [ ] Two-step verification on GitHub, Vercel, Supabase and the domain registrar.
- [ ] Supabase → Authentication: keep Confirm email on, minimum password length 10, add Site URL and Redirect URLs for the live domain, consider CAPTCHA.
- [ ] Add Upstash Redis variables for shared rate limits.
- [ ] Put Cloudflare in front of the domain (WAF, bot protection).
- [ ] Update Next.js to the latest patch version (Vercel warns it is outdated). Test on a branch first.
- [ ] Run the whole of `docs/GO-LIVE.md` section 8 before announcing the store.

### E. Code still to build (ask for these)
- [ ] Landing page order forms are cash on delivery only. They ignore the payment switches, so switching cash on delivery off does not stop them.
- [ ] Forgot-password and change-password pages. Until then passwords are changed in Supabase.
- [ ] The (i) info icons on Products, Orders and the other older admin pages.
- [ ] The remaining hero sections. The owner said they will give instructions later.
- [ ] A drag-and-drop form builder for contact or lead forms (the email builder covers email only).
- [ ] A direct bKash or Nagad merchant integration (manual payment and SSLCommerz cover them today).
- [ ] aamarPay, ShurjoPay, PayPal and Payoneer. They are listed but not connected.

### F. Needs your eyes or a real account (cannot be checked from code)
- [ ] Full-width Hero, Slider and Banner blocks: does the text line up with the header edges? Send a screenshot if not.
- [ ] 3D slider: does the background colour change as products move, and is the category filter centred with room for the arrows?
- [ ] SSLCommerz and Steadfast were written from their public documents and never run against real accounts. Test every path (paid, failed, cancelled, browser closed halfway) before relying on them.

---

## 15. Known limits

- Product pictures are stored in Supabase Storage and are not part of the database backup.
- Email percentages are display only (see section 4).
- One email send is limited to 500 recipients.
- The email builder cannot yet show per-product coupon codes.
- Heading size, spacing and layout settings were checked in automated tests and type checks, not on every phone and browser.
- The shared rclone Google client ID is being retired, which is why the backup uses its own client ID.

---

## 16. Documents

- `docs/architecture.md`: original system design and roadmap
- `docs/client.md`: original feature specification
- `docs/GO-LIVE.md`: launch and security checklist
- `CHANGES.md`: notes from the first update round

Private project. All rights reserved.
