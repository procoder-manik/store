-- Manual payments: bKash, Nagad, Rocket, Upay and bank transfer.
-- The customer sends the money themselves, then gives us the number they sent from and the transaction ID.
-- Staff check it in the mobile wallet or bank app, then mark the order as paid.

alter table public.orders add column if not exists payment_trx_id text;
alter table public.orders add column if not exists payment_sender text;

-- Lets us spot a transaction ID that someone tries to use on a second order.
create index if not exists orders_payment_trx_idx on public.orders (payment_trx_id) where payment_trx_id is not null;
