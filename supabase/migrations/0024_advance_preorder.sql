-- Manual payment columns from 0017, which the live database never received, so transaction IDs now have a proper home.
alter table public.orders add column if not exists payment_trx_id text;
alter table public.orders add column if not exists payment_sender text;
create index if not exists orders_payment_trx_idx on public.orders (payment_trx_id) where payment_trx_id is not null;

-- Cash on delivery with money paid first: the delivery charge, or a percentage plus the delivery charge.
alter table public.orders add column if not exists advance_amount numeric not null default 0 check (advance_amount >= 0);
alter table public.orders add column if not exists advance_status text not null default 'none' check (advance_status in ('none', 'pending', 'received', 'not_found'));
alter table public.orders add column if not exists advance_method text;
alter table public.orders add column if not exists is_preorder boolean not null default false;

-- Pre-orders. The product price is the pre-order price, and compare_at_price is the price after launch.
alter table public.products add column if not exists preorder boolean not null default false;
alter table public.products add column if not exists preorder_date date;
create index if not exists products_preorder_idx on public.products (preorder) where preorder;

-- Three placeholder products as pre-orders, and a pre-order section on the home page after New arrivals.
update public.products set preorder = true, preorder_date = '2027-01-15', compare_at_price = 5200 where slug = 'amber-table-lamp';
update public.products set preorder = true, preorder_date = '2027-01-15', compare_at_price = 7200 where slug = 'baroque-oval-mirror';
update public.products set preorder = true, preorder_date = '2027-01-15', compare_at_price = 3990 where slug = 'velvet-cushion-trio';
update public.pages set blocks = (
  select jsonb_agg(x.b order by x.ord, x.sub) from (
    select b, ord, 0 as sub from jsonb_array_elements(blocks) with ordinality t(b, ord)
    union all
    select '{"id":"st-pre","type":"products","anim":"up","level":"h2","title":"Coming soon, pre-order now","source":"preorder","tag":"featured","category":"","count":4}'::jsonb, ord, 1
    from jsonb_array_elements(blocks) with ordinality t(b, ord) where b->>'id' = 'st-new'
  ) x
) where slug = 'home' and not blocks::text like '%st-pre%';
