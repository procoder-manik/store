-- Clean addresses: category descriptions and automatic redirects when an address is renamed.
alter table public.categories add column if not exists description text;

create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique check (from_path like '/%'),
  to_path text not null check (to_path like '/%'),
  created_at timestamptz not null default now()
);
alter table public.redirects enable row level security;
create policy redirects_read on public.redirects for select using (true);
create policy redirects_admin on public.redirects for all using (public.is_admin()) with check (public.is_admin());
