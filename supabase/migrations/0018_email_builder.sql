-- Designed emails: the builder saves its blocks (hero, products with offers, coupon, ...) here.
alter table public.email_templates add column if not exists blocks jsonb;
