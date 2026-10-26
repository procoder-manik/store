-- Phase 11: page builder pages and buy-together bundles.

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active')),
  blocks jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  product_ids uuid[] not null check (array_length(product_ids, 1) between 2 and 4),
  discount_percent numeric(5, 2) not null check (discount_percent > 0 and discount_percent <= 90),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.pages enable row level security;
alter table public.bundles enable row level security;

create policy pages_read on public.pages for select using (status = 'active' or public.is_staff());
create policy pages_admin on public.pages for all using (public.is_admin()) with check (public.is_admin());
create policy bundles_read on public.bundles for select using (active or public.is_staff());
create policy bundles_admin on public.bundles for all using (public.is_admin()) with check (public.is_admin());
