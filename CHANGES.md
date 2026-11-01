# What changed

## Launch redesign (Nov 2026)
- New house theme, Nil: Bengal indigo, marigold thread and a woven band. It is listed in Admin > Settings with the other themes. `supabase/migrations/0020_launch_content.sql` switches the live site to it.
- Storefront: bigger hero, product cards with one clear "Buy now" and a cart button, category mosaic, new footer, sale prices in red, picture zoom, loading placeholders, order confirmation with next steps. Share picture, site icon and app manifest added.
- Accounts: redesigned sign-in, forgot password, change password (`/reset-password`). Supabase must allow that address under Authentication > URL Configuration.
- Admin: Ctrl+K search for any page, order or product; phone tab bar; pending order count; quick actions on the dashboard.
- Security: sign-in links can no longer redirect to other sites; made-up purchase notifications removed; private pages are not cached or indexed; `/dev` blocked in production; rate limit on purchase notifications.

## Mobile and UX fixes (Nov 2026)
- Mobile menu (hamburger) now opens full screen. It used to open squeezed under the header because the blurred header trapped it. The search popup had the same problem and is fixed too.
- Menu, search and cart lock the page behind them and close with Escape. The closed cart no longer leaves a shadow on the right edge and can no longer be reached with the keyboard.
- Product page on phones: a buy bar ("Add" / "Buy now") stays at the bottom once the main buttons scroll away. Chat, back-to-top and sale popups move up so they never cover it.
- Countdown sections hide themselves when the offer ends, instead of showing "Offer ends soon" next to "This offer has ended".
- Footer has room at the bottom on phones, so the floating buttons no longer cover it. Notch and home-bar safe areas are respected.
- Checkout: phone, district and address fields tell the phone which keyboard and autofill to use.

## Security and packaging
- Removed `/api/debug-env` (temporary, public).
- Removed the unencrypted `backup.yml` workflow. Use the encrypted `db-backup.yml` (see docs/GO-LIVE.md section 7).
- `.gitignore` now blocks every `.env` file except `.env.example`, plus zip files.
- PostCSS pinned to a patched version (`npm audit` shows 0 vulnerabilities). Node 20.9+ is required. New scripts: `npm run typecheck`, `npm run check`.

## Before you deploy
1. Run `supabase/migrations/0017_manual_payments.sql` in Supabase (adds payment_trx_id and payment_sender to orders).
2. Open Admin > Payment methods, turn on the ones you want, add your bKash/Nagad/Rocket numbers, save.
3. Open Admin > Header and footer, pick a design, save.

## Checkout
- Product card "Add to cart" now adds directly (first in-stock option). "Buy now" opens the popup.
- Blocked orders log `[order-blocked] reason=...` on the server. Signed-in staff skip the "too many orders" speed limits.
  If checkout still shows "We could not place this order", read the server log for that line.

## Payments (manual first)
- COD, bKash, Nagad, Rocket, Upay, bank transfer: each has an on/off switch, number/details and instructions.
- Customer sends money, enters sender number + TrxID (checked on the server, reuse blocked).
- Admin order page: "Payment received" / "Could not find it".
- SSLCommerz keeps using SERVER env keys; aamarPay, ShurjoPay, PayPal, Payoneer are listed as "Not connected yet".
- Not changed: landing-page order forms are still cash on delivery only.

## Header and footer
- 5 headers (classic, centered, marketplace, split, bold) and 5 footers (classic, minimal, dark, contact, compact).
- Admin > Header and footer: click a design, change options, live preview. Saved in separate settings keys.

## Heading text
- Every section: tag h1-h6 or p; size = keep design / match the tag / custom (computer + phone px); weight; letter case.
- Sections you do not touch look exactly as before.

## Note
- The `components/` and `lib/` folders at the project root are old copies. The app uses `src/`.
