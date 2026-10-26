-- Phase 1: core schema with Row Level Security on every table.
-- Orders, payments and fraud writes happen server side with the service role key.

create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'support', 'staff', 'manager', 'super_admin');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now()
);

create function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('support', 'staff', 'manager', 'super_admin'), false)
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('manager', 'super_admin'), false)
$$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories on delete set null,
  name text not null,
  slug text not null unique,
  sort int not null default 0,
  active boolean not null default true
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null check (kind in ('tee', 'hoodie', 'cover', 'decor')),
  category_id uuid references public.categories on delete set null,
  description text,
  base_price numeric(12, 2) not null check (base_price >= 0),
  compare_at_price numeric(12, 2) check (compare_at_price >= 0),
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  seo jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_idx on public.products (status);
create index products_category_idx on public.products (category_id);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  sku text not null unique,
  color_name text,
  color_hex text check (color_hex ~ '^#[0-9a-fA-F]{6}$'),
  size text,
  price_delta numeric(12, 2) not null default 0,
  stock int not null default 0 check (stock >= 0),
  image_path text
);
create index variants_product_idx on public.product_variants (product_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products on delete cascade,
  path text not null,
  alt text,
  sort int not null default 0
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity,
  user_id uuid references auth.users on delete set null,
  guest_name text,
  guest_phone text,
  guest_email text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'failed', 'refunded')),
  payment_method text,
  subtotal numeric(12, 2) not null,
  shipping_fee numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  coupon_code text,
  shipping_address jsonb not null default '{}',
  risk_score int not null default 0,
  created_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id);
create index orders_created_idx on public.orders (created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  product_id uuid references public.products on delete set null,
  variant_id uuid references public.product_variants on delete set null,
  name_snapshot text not null,
  unit_price numeric(12, 2) not null,
  qty int not null check (qty > 0)
);
create index order_items_order_idx on public.order_items (order_id);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent', 'fixed')),
  value numeric(12, 2) not null check (value > 0),
  min_subtotal numeric(12, 2) not null default 0,
  max_uses int,
  used_count int not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true
);

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default false
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  source text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users on delete set null,
  action text not null,
  entity text,
  entity_id text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.coupons enable row level security;
alter table public.site_settings enable row level security;
alter table public.leads enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: read own, update own without changing role, super admin manages all
create policy profiles_read on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = public.current_app_role());
create policy profiles_super on public.profiles for all
  using (public.current_app_role() = 'super_admin') with check (public.current_app_role() = 'super_admin');

-- catalog: public read of active items, manager+ writes
create policy categories_read on public.categories for select using (active or public.is_staff());
create policy categories_write on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy products_read on public.products for select using (status = 'active' or public.is_staff());
create policy products_write on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy variants_read on public.product_variants for select using (
  public.is_staff() or exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
);
create policy variants_write on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

create policy images_read on public.product_images for select using (
  public.is_staff() or exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
);
create policy images_write on public.product_images for all using (public.is_admin()) with check (public.is_admin());

-- orders: customers read their own, staff manage. Inserts are server side only.
create policy orders_read on public.orders for select using (user_id = auth.uid() or public.is_staff());
create policy orders_staff_update on public.orders for update using (public.is_staff()) with check (public.is_staff());

create policy order_items_read on public.order_items for select using (
  public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- coupons are validated server side, never exposed to clients
create policy coupons_admin on public.coupons for all using (public.is_admin()) with check (public.is_admin());

create policy settings_public_read on public.site_settings for select using (is_public or public.is_staff());
create policy settings_admin on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

create policy leads_staff on public.leads for select using (public.is_staff());
create policy leads_admin_write on public.leads for all using (public.is_admin()) with check (public.is_admin());

create policy audit_read on public.audit_logs for select using (public.is_staff());
