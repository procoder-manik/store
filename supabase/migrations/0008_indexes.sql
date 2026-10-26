-- Phase 12: indexes for the queries the store runs most (fraud checks, orders list, dashboard, CRM, audit log).
create index if not exists orders_phone_created_idx on public.orders (guest_phone, created_at desc);
create index if not exists orders_ip_created_idx on public.orders (ip, created_at desc);
create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists order_items_product_idx on public.order_items (product_id);
create index if not exists variants_low_stock_idx on public.product_variants (stock) where stock <= 5;
create index if not exists audit_created_idx on public.audit_logs (created_at desc);
create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists reviews_created_idx on public.reviews (created_at desc);
