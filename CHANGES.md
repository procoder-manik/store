# What changed

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
