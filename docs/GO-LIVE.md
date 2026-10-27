# Go-live and security checklist

Work through this top to bottom before you share the store link. Items marked **you** need a setting in a dashboard. Everything else is already in the code.

## 1. Database (Supabase)
Run these files in the SQL Editor, in order, once each: `0001_init`, `0002_storage`, `0003_orders`, `0004_dashboard`, `0005_customer_selling`, `0006_crm_email_chat`, `0007_pages_bundles`, `0008_indexes`, `0009_payments`, `0010_shipping_extras`, `0011_permalinks`, `0012_landing_builder`, `0013_email_log`.

## 2. Supabase settings (you)
| Where | Setting |
|---|---|
| Authentication, Sign In / Providers, Email | Keep **Confirm email** ON. Set minimum password length to 10 or more. |
| Authentication, URL Configuration | Site URL = your live domain. Add `https://yourdomain.com/**` to Redirect URLs. |
| Authentication, Attack Protection | Turn on **CAPTCHA** (Cloudflare Turnstile is free) so bots cannot mass-create accounts. |
| Authentication, Multi-Factor | Make sure **TOTP** is enabled (it is on by default). |
| Project Settings, API | Never share the secret key. Rotate it if it was ever pasted in chat or a public repo. |

## 3. First admin and two-step verification (you)
1. Sign up on the site, then run the `update public.profiles set role = 'super_admin' ...` SQL for your email.
2. Open `/admin`. You are sent to set up two-step verification. Scan the code with Google Authenticator or Authy and enter the 6 digit code.
3. Sign out and back in to confirm the code is asked. Save the setup key somewhere safe.
4. Optional, strongest: run `supabase-optional-enforce-mfa.sql`. The database then refuses staff and admin actions without verification, even if the website were bypassed.

## 4. Environment variables
| Name | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Everything |
| `SUPABASE_SERVICE_ROLE_KEY` | Orders, emails, tracking, leads. Server only. |
| `NEXT_PUBLIC_SITE_URL` | Your live domain, for links in emails, sitemap and SEO |
| `NEXT_PUBLIC_BRAND_NAME` | Starting store name (you can change it later in Admin, Site and menu) |
| `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` | Auto-fill, SEO, chat assistant |
| `RESEND_API_KEY`, `EMAIL_FROM` | Order emails and campaigns. Verify your domain in Resend first. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared rate limiting (free Upstash database). Without it, limits work per server only. |
| `REQUIRE_ADMIN_MFA` | Leave empty in production. `false` skips two-step verification and is for local testing only. |

## 5. Deploy (you)
1. Push the project to a **private** GitHub repository. `.env.local` is already ignored, so keys are not uploaded.
2. Import it in Vercel, add the variables above, deploy.
3. Add your domain in Vercel, then set the same domain in `NEXT_PUBLIC_SITE_URL` and in Supabase Auth URLs.

## 6. Cloudflare in front (you, free)
- Move your domain's DNS to Cloudflare and keep the orange cloud (proxy) ON.
- SSL/TLS mode: **Full (strict)**. Turn on Always Use HTTPS.
- Security: turn on **Bot Fight Mode** and the managed WAF rules.
- Add a rate limiting rule for `/login`, `/checkout` and `/api/chat` (for example 30 requests per minute per IP).

## 7. Backups
- The file `.github/workflows/backup.yml` makes a nightly database backup in a private GitHub repository. Add a repository secret named `DATABASE_URL` (Supabase, Database, Connection string, Session pooler). It has not been run yet, so run it once manually from the Actions tab and check that `backup.dump` appears.
- Supabase paid plans add point-in-time recovery if you later want it.
- Product photos live in Supabase Storage. Keep the originals on your computer too.

## 8. Test before launch
- Place an order as a guest and as a signed-in customer. Check the order, the stock drop, the thank-you page and the email.
- Cancel the order in Admin and check that stock returns.
- Try a coupon, a bundle, the order bump, a landing page order and tracking.
- Place 4 orders quickly with one phone number. The fourth should be refused.
- Sign in as admin: you must be asked for the code. Open `/admin` in a private window without signing in: you must land on the sign in page.
- Open the store on a phone. Check the 3D rail, the grid view, checkout and the chat button.

## 9. Online payments (SSLCommerz)
SSLCommerz is one payment page where customers pick bKash, Nagad, Rocket, a card or a bank. You need a merchant account with them.
1. Create a **sandbox** account at SSLCommerz and put `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWORD` in `.env.local`. Restart the server. The checkout now offers "Pay online".
2. Test with the sandbox test cards and wallets from the SSLCommerz documentation. Check that a paid order shows as Paid and Confirmed in Admin, Orders.
3. In the SSLCommerz merchant panel set the IPN address to `https://yourdomain.com/api/pay/sslcommerz/ipn`. IPN only works on a public https address, not on localhost.
4. When the live account is approved, replace the keys with the live ones and set `SSLCOMMERZ_LIVE=true`.
5. Set `CRON_SECRET` to a long random text in Vercel. A daily job cancels unpaid online orders so their stock is released, and checkout also does this each time someone pays online.
6. Refunds are done in the SSLCommerz panel. Cancel or return the order in Admin afterwards so stock returns.
7. A payment is only marked paid after the server asks SSLCommerz to confirm it and the amount, currency and transaction id all match. The browser is never trusted.
8. This code has not been run against the real SSLCommerz sandbox yet. Test every path before you rely on it: paid, failed, cancelled, and the browser closed halfway.

## 10. Shipping and phone orders
- Every order has a Shipment box in Admin, Orders. Type the courier and tracking number, or fill them in when you mark the order Shipped. Customers see them on the tracking page and in the shipped email.
- **Print invoice** opens a clean invoice and packing slip that shows exactly how much cash the courier must collect.
- **Book with Steadfast** needs `STEADFAST_API_KEY` and `STEADFAST_SECRET_KEY` from your Steadfast merchant panel. It was written from their published API and has not been run against your account, so book one test parcel first and check it in the Steadfast panel.
- **New phone order** (Admin, Orders) lets you enter orders that come by phone, Facebook or WhatsApp. Stock is held and prices come from your catalog.
- **Download CSV** exports orders for your accounts.

## 11. Known limits
- Scripts: the page security policy still allows inline scripts, which the theme switcher and analytics snippets need. A stricter nonce policy would stop pages from being cached, so it was not turned on. The site never prints visitor or admin text as HTML, which keeps this risk low.
- bKash and Nagad work through the SSLCommerz page. A direct bKash or Nagad merchant integration is not built. Landing page orders are still cash on delivery.
- No website is 100 percent unhackable. The layers here make attacks hard and slow and leave a record. Keep packages updated (`npm audit`), keep the secret key private and keep your phone safe.
