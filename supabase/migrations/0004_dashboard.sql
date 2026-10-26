-- Phase 5: dashboard reporting functions (run as the signed-in staff user, so RLS still applies).

create or replace function public.sales_series(p_from timestamptz, p_to timestamptz, p_bucket text)
returns table (bucket date, orders bigint, revenue numeric)
language sql stable as $$
  with s as (
    select generate_series(
      date_trunc(p_bucket, p_from at time zone 'Asia/Dhaka'),
      date_trunc(p_bucket, (p_to - interval '1 second') at time zone 'Asia/Dhaka'),
      ('1 ' || p_bucket)::interval
    )::date as b
  ), o as (
    select date_trunc(p_bucket, created_at at time zone 'Asia/Dhaka')::date as b, count(*) as c, sum(total) as r
    from public.orders
    where created_at >= p_from and created_at < p_to and status not in ('cancelled', 'returned')
    group by 1
  )
  select s.b, coalesce(o.c, 0), coalesce(o.r, 0) from s left join o on o.b = s.b order by s.b
$$;

create or replace function public.top_products(p_from timestamptz, p_to timestamptz)
returns table (name text, units bigint, revenue numeric)
language sql stable as $$
  select i.name_snapshot, sum(i.qty)::bigint, sum(i.qty * i.unit_price)
  from public.order_items i join public.orders o on o.id = i.order_id
  where o.created_at >= p_from and o.created_at < p_to and o.status not in ('cancelled', 'returned')
  group by 1 order by 3 desc limit 5
$$;

create or replace function public.status_counts(p_from timestamptz, p_to timestamptz)
returns table (status text, orders bigint)
language sql stable as $$
  select status, count(*) from public.orders where created_at >= p_from and created_at < p_to group by 1 order by 2 desc
$$;
