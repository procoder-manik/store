# Client Requirements and Feature Specification

## 1. Product Types
- Clothing: T-shirts, hoodies
- Bedding and covers: bedsheets, pillow covers
- Home decor, including electronic decor items

## 2. Storefront (Customer Side)
**Look and feel:** clean, neat, modern, animated, 3D. Light mode by default, dark and system modes available. Brand name, logo, and colors editable later.

**Pages:** Home, Shop (dynamic filters), Category, Product Details, Cart (mini cart), Checkout, Thank You, My Account, Wishlist, Compare, Search (live suggestions), Order Tracking, Blog, Contact, FAQ, Policies, 404, Landing pages.

**3D experience:**
- Products hang on a 3D hanger rail and scroll by drag, wheel, or swipe
- Clicking a product shows it properly with gallery, variants, price, Add to Cart, Quick Checkout
- Fast loading with 2D fallback on weak devices

**Conversion features:**
- Quick Checkout on every product
- Upsell, cross-sell, order bump, post-purchase upsell
- Group and bundle products
- Social proof popups (example: "Rahim from Dhaka bought a hoodie for 1250 BDT"), fake at first, real later, contact data always hidden
- Exit-intent popups, countdown deals, flash sales
- Abandoned cart recovery, back-in-stock alerts, recently viewed
- Web push notifications
- Reviews with photos and verified-purchase badge, Q&A, size guide

**Account:** orders, tracking, addresses, returns, loyalty points, wishlist.

**Chatbot:** AI assistant trained only on this store's data, with message sound, lead capture, and human handoff.

## 3. Admin Dashboard (Separate /admin)
- **Analytics:** sales charts with filters (7 days, 15 days, 30 days, 3 months, 6 months, 1 year, custom), revenue, orders, AOV, top products, conversion, low-stock alerts
- **Products:** create/edit, colors and sizes with price changes per variation, group products, bulk edit, CSV import/export, tags (New, Featured, Hot, Sale), scheduling, inventory
- **Orders:** receive, cancel, process, ship, deliver, return, refund, invoices, packing slips, manual orders, notes
- **Shipping:** flat rate, percentage, weight, zone based, free-shipping threshold, courier integration
- **Discounts:** percentage, fixed, BOGO, quantity tiers, coupons, limits, expiry
- **Marketing:** banners, popup builder (coupon, banner, newsletter, custom design), email marketing with auto-branded and custom templates, SMS
- **CRM and Leads:** auto-saved leads, customer profiles, segments, tags, notes, follow-ups
- **Page Builder:** drag-and-drop blocks (hero, product grid, carousel, category grid, banner, testimonials, FAQ, timer, 3D rail), filters on dynamic pages
- **Funnel and Landing Pages:** single-product landing page with inline checkout, quantity offers (1 item = X, 2 items = Y, 3 items = Z), delivery charge rules, order bump, one-click upsell, thank you pages, A/B tests
- **Site Editing:** header, footer, menus, categories, all editable
- **Tracking:** Facebook Pixel and CAPI, GA4, Google Tag Manager, Search Console, Google Ads, TikTok, custom scripts
- **AI SEO:** one-click meta title, description, keywords, alt text, schema; bulk optimization; AI product descriptions and image prompts
- **Chatbot Settings:** knowledge base, tone, sound, history
- **Settings:** brand, theme, payments, tax, currency, email, roles and permissions, audit logs, backups

## 4. Payments and Fraud Protection
- SSLCommerz, bKash, Nagad, Rocket, bank, cards, Cash on Delivery
- Fraud checker blocks bad customers: courier success ratio, blacklist, repeat cancellations, OTP for COD, CAPTCHA

## 5. Security Requirements
Strongest practical security: admin 2FA, RBAC, RLS, WAF, rate limiting, input validation, secure headers, signed payment webhooks, audit logs, daily backups. Goal is maximum hardening (no system is literally 100% unhackable).

## 6. Additional Features Added
Loyalty points, referrals, gift cards, affiliate system, multi-currency and tax, invoice PDFs, order SMS and email, PWA, WhatsApp/Messenger button, supplier and purchase orders, heatmap integration, newsletter, cookie consent, staff activity reports.

## 7. Non-Functional Requirements
- Very fast loading (LCP under 2.5 s, Lighthouse 90+)
- Mobile first, accessible, bilingual (Bangla and English)
- Fully dynamic: every section editable from admin
