-- A record of every email the store tries to send, so a failure shows its reason instead of failing silently.
create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  kind text not null default 'other',
  status text not null check (status in ('sent', 'failed')),
  error text,
  created_at timestamptz not null default now()
);
create index email_log_created_idx on public.email_log (created_at desc);
alter table public.email_log enable row level security;
create policy email_log_staff on public.email_log for select using (public.is_staff());
