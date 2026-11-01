-- Security hardening from the Supabase security advisor, and the unpaid-order cleanup moved into the database.

-- Trigger functions run only as triggers. Nobody needs to call them through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Dashboard and CRM reports: fixed search_path, and only signed-in users may call them (RLS still limits them to staff).
alter function public.sales_series(timestamptz, timestamptz, text) set search_path = public;
alter function public.top_products(timestamptz, timestamptz) set search_path = public;
alter function public.status_counts(timestamptz, timestamptz) set search_path = public;
alter function public.crm_customers() set search_path = public;
revoke execute on function public.sales_series(timestamptz, timestamptz, text) from public, anon;
revoke execute on function public.top_products(timestamptz, timestamptz) from public, anon;
revoke execute on function public.status_counts(timestamptz, timestamptz) from public, anon;
revoke execute on function public.crm_customers() from public, anon;
grant execute on function public.sales_series(timestamptz, timestamptz, text) to authenticated;
grant execute on function public.top_products(timestamptz, timestamptz) to authenticated;
grant execute on function public.status_counts(timestamptz, timestamptz) to authenticated;
grant execute on function public.crm_customers() to authenticated;

-- is_admin(), is_staff() and current_app_role() stay callable: RLS policies call them as the visitor,
-- and they only answer questions about the visitor's own role.

-- Cancel unpaid online orders every 15 minutes, inside the database, so their stock is released.
-- Replaces the daily Vercel cron, which needed a CRON_SECRET.
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'expire-unpaid-orders';
select cron.schedule('expire-unpaid-orders', '*/15 * * * *', $$select public.expire_unpaid_orders()$$);
