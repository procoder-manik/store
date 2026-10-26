-- Courier details and phone orders.
alter table public.orders
  add column if not exists courier text,
  add column if not exists tracking_code text,
  add column if not exists consignment_id text,
  add column if not exists source text not null default 'web';
