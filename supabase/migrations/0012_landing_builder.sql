-- Landing pages built with the page builder (order forms with offers and combos).
alter table public.pages add column if not exists kind text not null default 'page' check (kind in ('page', 'landing'));
create index if not exists pages_kind_idx on public.pages (kind, status);
