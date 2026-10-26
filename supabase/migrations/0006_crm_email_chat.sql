-- Phase 9 and 10: CRM, email marketing, abandoned carts.

alter table public.leads add column if not exists status text not null default 'new' check (status in ('new', 'contacted', 'won', 'lost'));
alter table public.leads add column if not exists unsubscribed boolean not null default false;
create unique index if not exists leads_email_uidx on public.leads (lower(email)) where email is not null;

create table public.crm_notes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  note text not null check (char_length(note) <= 1000),
  author uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index crm_notes_phone_idx on public.crm_notes (phone);

create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  heading text not null,
  body text not null,
  button_text text,
  button_url text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.email_templates on delete set null,
  name text not null,
  audience text not null check (audience in ('subscribers', 'customers', 'vip')),
  sent_count int not null default 0,
  failed_count int not null default 0,
  created_at timestamptz not null default now()
);

create table public.email_optouts (
  email text primary key,
  created_at timestamptz not null default now()
);

create table public.abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  phone text,
  email text,
  name text,
  items jsonb not null,
  total numeric(12, 2) not null default 0,
  recovered boolean not null default false,
  reminded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index abandoned_phone_idx on public.abandoned_carts (phone);
create index abandoned_updated_idx on public.abandoned_carts (updated_at desc);

alter table public.crm_notes enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_campaigns enable row level security;
alter table public.email_optouts enable row level security;
alter table public.abandoned_carts enable row level security;

create policy notes_staff on public.crm_notes for all using (public.is_staff()) with check (public.is_staff());
create policy templates_admin on public.email_templates for all using (public.is_admin()) with check (public.is_admin());
create policy campaigns_read on public.email_campaigns for select using (public.is_staff());
create policy optouts_admin on public.email_optouts for all using (public.is_admin()) with check (public.is_admin());
create policy abandoned_staff on public.abandoned_carts for select using (public.is_staff());
create policy abandoned_admin on public.abandoned_carts for all using (public.is_admin()) with check (public.is_admin());

-- Customers are built from orders, grouped by phone number.
create or replace function public.crm_customers()
returns table (phone text, name text, email text, orders bigint, spent numeric, last_order timestamptz, segment text)
language sql stable as $$
  with o as (
    select guest_phone as phone,
      (array_agg(guest_name order by created_at desc))[1] as name,
      (array_agg(guest_email order by created_at desc) filter (where guest_email is not null))[1] as email,
      count(*) filter (where status not in ('cancelled', 'returned')) as orders,
      coalesce(sum(total) filter (where status not in ('cancelled', 'returned')), 0) as spent,
      max(created_at) as last_order
    from public.orders where guest_phone is not null group by guest_phone
  )
  select phone, name, email, orders, spent, last_order,
    case when spent >= 10000 or orders >= 3 then 'vip'
         when last_order < now() - interval '90 days' then 'inactive'
         when orders <= 1 then 'new' else 'regular' end
  from o order by spent desc
$$;
