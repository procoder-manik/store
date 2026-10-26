-- Phase 7: online payments (SSLCommerz covers cards, bKash, Nagad, Rocket and bank payments).

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  provider text not null default 'sslcommerz',
  tran_id text not null unique,
  amount numeric(12, 2) not null,
  status text not null default 'initiated',
  val_id text,
  method text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);
alter table public.payments enable row level security;
create policy payments_staff on public.payments for select using (public.is_staff());

-- Online orders hold stock while the customer pays. Unpaid ones are cancelled and the stock goes back.
create or replace function public.expire_unpaid_orders(p_minutes int default 45) returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in
    select id from public.orders
    where payment_method = 'sslcommerz' and payment_status = 'unpaid' and status = 'pending'
      and created_at < now() - make_interval(mins => p_minutes)
    limit 50
  loop
    perform public.set_order_status(r.id, 'cancelled', null, 'Online payment was not completed');
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.expire_unpaid_orders(int) from public, anon, authenticated;
grant execute on function public.expire_unpaid_orders(int) to service_role;
