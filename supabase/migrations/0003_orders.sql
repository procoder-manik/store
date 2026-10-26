-- Phase 4: shipping zones, fraud blacklist, order events, atomic order functions.

alter table public.orders
  add column if not exists zone text,
  add column if not exists ip text,
  add column if not exists note text;

create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee numeric(12, 2) not null check (fee >= 0),
  free_over numeric(12, 2) check (free_over >= 0),
  active boolean not null default true,
  sort int not null default 0
);
insert into public.shipping_zones (name, fee, sort) values ('Inside Dhaka', 80, 1), ('Outside Dhaka', 130, 2);

create table public.fraud_blacklist (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('phone', 'ip', 'email')),
  value text not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (kind, value)
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  status text not null,
  note text,
  actor uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id);

alter table public.shipping_zones enable row level security;
alter table public.fraud_blacklist enable row level security;
alter table public.order_events enable row level security;

create policy zones_read on public.shipping_zones for select using (active or public.is_staff());
create policy zones_write on public.shipping_zones for all using (public.is_admin()) with check (public.is_admin());
create policy fraud_read on public.fraud_blacklist for select using (public.is_staff());
create policy fraud_write on public.fraud_blacklist for all using (public.is_admin()) with check (public.is_admin());
create policy events_read on public.order_events for select using (
  public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- Atomic order creation: locks variants, checks and decrements stock, redeems coupon, writes order and items.
create or replace function public.create_order(o jsonb, items jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_order_no bigint;
  it jsonb;
  v_stock int;
begin
  for it in select value from jsonb_array_elements(items) order by value ->> 'variant_id' loop
    if nullif(it ->> 'variant_id', '') is not null then
      select stock into v_stock from public.product_variants where id = (it ->> 'variant_id')::uuid for update;
      if v_stock is null or v_stock < (it ->> 'qty')::int then
        raise exception 'OUT_OF_STOCK: %', it ->> 'name';
      end if;
      update public.product_variants set stock = stock - (it ->> 'qty')::int where id = (it ->> 'variant_id')::uuid;
    end if;
  end loop;

  if nullif(o ->> 'coupon_code', '') is not null then
    update public.coupons set used_count = used_count + 1
    where code = o ->> 'coupon_code' and active and (max_uses is null or used_count < max_uses);
    if not found then raise exception 'COUPON_UNAVAILABLE'; end if;
  end if;

  insert into public.orders (user_id, guest_name, guest_phone, guest_email, status, payment_status, payment_method,
    subtotal, shipping_fee, discount, total, coupon_code, shipping_address, risk_score, zone, ip, note)
  values (nullif(o ->> 'user_id', '')::uuid, o ->> 'name', o ->> 'phone', nullif(o ->> 'email', ''), 'pending', 'unpaid', o ->> 'payment_method',
    (o ->> 'subtotal')::numeric, (o ->> 'shipping_fee')::numeric, (o ->> 'discount')::numeric, (o ->> 'total')::numeric,
    nullif(o ->> 'coupon_code', ''), o -> 'shipping_address', coalesce((o ->> 'risk_score')::int, 0), o ->> 'zone', o ->> 'ip', nullif(o ->> 'note', ''))
  returning id, order_no into v_order_id, v_order_no;

  insert into public.order_items (order_id, product_id, variant_id, name_snapshot, unit_price, qty)
  select v_order_id, nullif(e ->> 'product_id', '')::uuid, nullif(e ->> 'variant_id', '')::uuid, e ->> 'name', (e ->> 'unit_price')::numeric, (e ->> 'qty')::int
  from jsonb_array_elements(items) e;

  insert into public.order_events (order_id, status, note) values (v_order_id, 'pending', 'Order placed');
  return jsonb_build_object('id', v_order_id, 'order_no', v_order_no);
end $$;

-- Guarded status changes. Cancelled or returned orders put stock back.
create or replace function public.set_order_status(p_order uuid, p_status text, p_actor uuid, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare cur text; pay text;
begin
  select status, payment_status into cur, pay from public.orders where id = p_order for update;
  if cur is null then raise exception 'NOT_FOUND'; end if;
  if not (
    (cur = 'pending' and p_status in ('confirmed', 'cancelled')) or
    (cur = 'confirmed' and p_status in ('processing', 'cancelled')) or
    (cur = 'processing' and p_status in ('shipped', 'cancelled')) or
    (cur = 'shipped' and p_status in ('delivered', 'returned')) or
    (cur = 'delivered' and p_status = 'returned')
  ) then raise exception 'BAD_TRANSITION'; end if;

  if p_status in ('cancelled', 'returned') then
    update public.product_variants v set stock = v.stock + i.qty
    from public.order_items i where i.order_id = p_order and i.variant_id = v.id;
  end if;

  update public.orders set status = p_status,
    payment_status = case when p_status = 'delivered' then 'paid' when p_status = 'returned' and pay = 'paid' then 'refunded' else pay end
  where id = p_order;
  insert into public.order_events (order_id, status, note, actor) values (p_order, p_status, p_note, p_actor);
end $$;

revoke all on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.set_order_status(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;
grant execute on function public.set_order_status(uuid, text, uuid, text) to service_role;
