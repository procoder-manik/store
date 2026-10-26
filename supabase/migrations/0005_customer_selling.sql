-- Phase 6 and 8: addresses, reviews, related products, landing pages, banners.

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  label text,
  name text not null,
  phone text not null,
  district text not null,
  address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  user_id uuid references auth.users on delete set null,
  author text not null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null,
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index reviews_product_idx on public.reviews (product_id, status);

create table public.product_relations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  related_id uuid not null references public.products on delete cascade,
  kind text not null default 'upsell' check (kind in ('upsell', 'cross')),
  sort int not null default 0,
  unique (product_id, related_id)
);

create table public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  product_id uuid not null references public.products on delete cascade,
  headline text not null,
  subheadline text,
  bullets text[] not null default '{}',
  hero_image text,
  offers jsonb not null default '[]',
  cta_text text not null default 'Order now',
  status text not null default 'draft' check (status in ('draft', 'active')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image text,
  link text,
  button text,
  sort int not null default 0,
  active boolean not null default true
);

alter table public.addresses enable row level security;
alter table public.reviews enable row level security;
alter table public.product_relations enable row level security;
alter table public.landing_pages enable row level security;
alter table public.banners enable row level security;

create policy addresses_own on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reviews_read on public.reviews for select using (status = 'approved' or public.is_staff());
create policy reviews_admin on public.reviews for all using (public.is_admin()) with check (public.is_admin());

create policy relations_read on public.product_relations for select using (true);
create policy relations_admin on public.product_relations for all using (public.is_admin()) with check (public.is_admin());

create policy landing_read on public.landing_pages for select using (status = 'active' or public.is_staff());
create policy landing_admin on public.landing_pages for all using (public.is_admin()) with check (public.is_admin());

create policy banners_read on public.banners for select using (active or public.is_staff());
create policy banners_admin on public.banners for all using (public.is_admin()) with check (public.is_admin());
