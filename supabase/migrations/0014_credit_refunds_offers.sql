-- Offer timers on products, an "out for delivery" step, refunds, store credit and referrals.

alter table public.products add column if not exists offer_ends_at timestamptz;

-- Order statuses and payment statuses
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in ('pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'));
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check check (payment_status in ('unpaid', 'paid', 'failed', 'refunded', 'partially_refunded'));

alter table public.orders
  add column if not exists referrer_id uuid references public.profiles (id) on delete set null,
  add column if not exists credit_used numeric(12, 2) not null default 0,
  add column if not exists refunded_amount numeric(12, 2) not null default 0,
  add column if not exists cancel_reason text;

-- Every account gets a short referral code
alter table public.profiles add column if not exists referral_code text unique default upper(substr(md5(gen_random_uuid()::text), 1, 7));
update public.profiles set referral_code = upper(substr(md5(gen_random_uuid()::text), 1, 7)) where referral_code is null;

-- Store credit: one row per change, the balance is the sum
create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta numeric(12, 2) not null,
  kind text not null check (kind in ('referral_reward', 'redeem', 'redeem_reversal', 'refund_credit', 'manual')),
  order_id uuid references public.orders (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);
-- A reward, a redeem and a reversal can each happen only once per order
create unique index if not exists credit_ledger_once on public.credit_ledger (order_id, kind) where order_id is not null and kind in ('referral_reward', 'redeem', 'redeem_reversal');
alter table public.credit_ledger enable row level security;
drop policy if exists credit_ledger_read on public.credit_ledger;
create policy credit_ledger_read on public.credit_ledger for select using (user_id = auth.uid() or public.is_staff());

create table if not exists public.order_refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  method text not null check (method in ('manual', 'store_credit', 'gateway')),
  note text,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_refunds_order_idx on public.order_refunds (order_id);
alter table public.order_refunds enable row level security;
drop policy if exists order_refunds_staff on public.order_refunds;
create policy order_refunds_staff on public.order_refunds for select using (public.is_staff());

create or replace function public.credit_balance(p_user uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(delta), 0) from public.credit_ledger where user_id = p_user
$$;

-- Order creation, now able to spend store credit atomically and remember who referred the buyer
create or replace function public.create_order(o jsonb, items jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_order_no bigint;
  it jsonb;
  v_stock int;
  v_user uuid := nullif(o ->> 'user_id', '')::uuid;
  v_credit numeric := coalesce((o ->> 'credit_used')::numeric, 0);
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

  if v_credit > 0 then
    if v_user is null then raise exception 'NO_CREDIT'; end if;
    perform 1 from public.profiles where id = v_user for update;
    if (select coalesce(sum(delta), 0) from public.credit_ledger where user_id = v_user) < v_credit then raise exception 'NO_CREDIT'; end if;
  end if;

  insert into public.orders (user_id, guest_name, guest_phone, guest_email, status, payment_status, payment_method,
    subtotal, shipping_fee, discount, total, coupon_code, shipping_address, risk_score, zone, ip, note, referrer_id, credit_used)
  values (v_user, o ->> 'name', o ->> 'phone', nullif(o ->> 'email', ''), 'pending', 'unpaid', o ->> 'payment_method',
    (o ->> 'subtotal')::numeric, (o ->> 'shipping_fee')::numeric, (o ->> 'discount')::numeric, (o ->> 'total')::numeric,
    nullif(o ->> 'coupon_code', ''), o -> 'shipping_address', coalesce((o ->> 'risk_score')::int, 0), o ->> 'zone', o ->> 'ip', nullif(o ->> 'note', ''),
    nullif(o ->> 'referrer_id', '')::uuid, v_credit)
  returning id, order_no into v_order_id, v_order_no;

  if v_credit > 0 then
    insert into public.credit_ledger (user_id, delta, kind, order_id, note) values (v_user, -v_credit, 'redeem', v_order_id, 'Used on an order');
  end if;

  insert into public.order_items (order_id, product_id, variant_id, name_snapshot, unit_price, qty)
  select v_order_id, nullif(e ->> 'product_id', '')::uuid, nullif(e ->> 'variant_id', '')::uuid, e ->> 'name', (e ->> 'unit_price')::numeric, (e ->> 'qty')::int
  from jsonb_array_elements(items) e;

  insert into public.order_events (order_id, status, note) values (v_order_id, 'pending', 'Order placed');
  return jsonb_build_object('id', v_order_id, 'order_no', v_order_no);
end $$;

-- Status changes, now with an "out for delivery" step. Cancelled or returned orders restock and give spent credit back.
create or replace function public.set_order_status(p_order uuid, p_status text, p_actor uuid, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare cur text; pay text; v_credit numeric; v_user uuid;
begin
  select status, payment_status, credit_used, user_id into cur, pay, v_credit, v_user from public.orders where id = p_order for update;
  if cur is null then raise exception 'NOT_FOUND'; end if;
  if not (
    (cur = 'pending' and p_status in ('confirmed', 'cancelled')) or
    (cur = 'confirmed' and p_status in ('processing', 'shipped', 'cancelled')) or
    (cur = 'processing' and p_status in ('shipped', 'cancelled')) or
    (cur = 'shipped' and p_status in ('out_for_delivery', 'delivered', 'returned', 'cancelled')) or
    (cur = 'out_for_delivery' and p_status in ('delivered', 'returned', 'cancelled')) or
    (cur = 'delivered' and p_status = 'returned')
  ) then raise exception 'BAD_TRANSITION'; end if;

  if p_status in ('cancelled', 'returned') then
    update public.product_variants v set stock = v.stock + i.qty
    from public.order_items i where i.order_id = p_order and i.variant_id = v.id;
    if v_credit > 0 and v_user is not null then
      insert into public.credit_ledger (user_id, delta, kind, order_id, note)
      values (v_user, v_credit, 'redeem_reversal', p_order, 'Credit returned because the order was ' || p_status)
      on conflict do nothing;
    end if;
  end if;

  update public.orders set status = p_status,
    payment_status = case when p_status = 'delivered' then 'paid' when p_status = 'returned' and pay = 'paid' then 'refunded' else pay end
  where id = p_order;
  insert into public.order_events (order_id, status, note, actor) values (p_order, p_status, p_note, p_actor);
end $$;

-- Records a refund. The money itself is paid back by you or by the payment gateway, this keeps the books right.
create or replace function public.record_refund(p_order uuid, p_amount numeric, p_method text, p_note text, p_actor uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_total numeric; v_done numeric; v_pay text; v_user uuid; v_status text;
begin
  select total, refunded_amount, payment_status, user_id, status into v_total, v_done, v_pay, v_user, v_status from public.orders where id = p_order for update;
  if v_total is null then raise exception 'NOT_FOUND'; end if;
  if v_pay not in ('paid', 'partially_refunded') then raise exception 'NOT_PAID'; end if;
  if p_amount <= 0 or p_amount > v_total - v_done then raise exception 'BAD_AMOUNT'; end if;
  if p_method = 'store_credit' and v_user is null then raise exception 'NO_ACCOUNT'; end if;

  update public.orders set refunded_amount = refunded_amount + p_amount,
    payment_status = case when refunded_amount + p_amount >= total then 'refunded' else 'partially_refunded' end
  where id = p_order;
  insert into public.order_refunds (order_id, amount, method, note, created_by) values (p_order, p_amount, p_method, p_note, p_actor);
  if p_method = 'store_credit' then
    insert into public.credit_ledger (user_id, delta, kind, order_id, note) values (v_user, p_amount, 'refund_credit', p_order, coalesce(nullif(p_note, ''), 'Refund as store credit'));
  end if;
  insert into public.order_events (order_id, status, note, actor) values (p_order, v_status, 'Refund of ' || p_amount || ' (' || p_method || ')' || coalesce(': ' || nullif(p_note, ''), ''), p_actor);
end $$;

revoke all on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.set_order_status(uuid, text, uuid, text) from public, anon, authenticated;
revoke all on function public.record_refund(uuid, numeric, text, text, uuid) from public, anon, authenticated;
revoke all on function public.credit_balance(uuid) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;
grant execute on function public.set_order_status(uuid, text, uuid, text) to service_role;
grant execute on function public.record_refund(uuid, numeric, text, text, uuid) to service_role;
grant execute on function public.credit_balance(uuid) to service_role;
