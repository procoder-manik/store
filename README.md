# 3D E-Commerce Platform

Phase 1 foundation: 3D hanger storefront prototype, theming (light, dark, system), cart, Supabase auth and schema with RLS, admin route guard, security headers.

## Run
```bash
npm install
cp .env.example .env.local   # add Supabase keys
npm run dev
```

## Database
1. Create a free project at supabase.com
2. Run `supabase/migrations/0001_init.sql`, then `0002_storage.sql`, then `0003_orders.sql`, in the SQL editor
3. Sign up in the app, then promote yourself in SQL:
```sql
update public.profiles set role = 'super_admin' where id = (select id from auth.users where email = 'you@example.com');
```

## Change the brand name
Set `NEXT_PUBLIC_BRAND_NAME` in `.env.local`. Phase 6 moves this into admin settings.

## Docs
See `docs/architecture.md` and `docs/client.md`.

## Roadmap
Phase 3 done: storefront reads live products, variants, images and categories from Supabase (cached 60 s), product pages with SEO metadata and JSON-LD, sitemap and robots. Phase 4 done: checkout with COD, server-side pricing, shipping zones, coupons, fraud checks, admin order management (run migration 0003, set SUPABASE_SERVICE_ROLE_KEY). Next: Phase 4b online payments, Phase 5 dashboard charts.
