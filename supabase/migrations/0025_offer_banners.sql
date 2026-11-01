-- Offer banners with places, ready-made designs and start and stop dates.
alter table public.banners add column if not exists slot text not null default 'home';
alter table public.banners add column if not exists design text not null default 'image';
alter table public.banners add column if not exists starts_at timestamptz;
alter table public.banners add column if not exists ends_at timestamptz;
alter table public.banners alter column title drop not null;
create index if not exists banners_slot_idx on public.banners (slot, sort) where active;

-- Sample banners, so the slider can be seen working. Edit or delete them in Admin, Banners.
insert into public.banners (title, subtitle, link, button, sort, active, slot, design) values
  ('Bedsheets for a better night', 'Soft, tightly woven sheets in easy colours.', '/category/bedsheets', 'Shop bedsheets', 0, true, 'home', 'river'),
  ('Pre-order and save', 'Reserve new arrivals before they launch.', '/pre-order', 'See pre-orders', 1, true, 'home', 'dusk'),
  ('Cushions that change a room', 'New colours, ready to ship.', '/category/pillows', 'Shop cushions', 2, true, 'home', 'gold'),
  ('Pre-order the Amber Table Lamp and save 1,000 taka', '', '/product/amber-table-lamp', 'See it', 0, true, 'header', 'river');

-- Offer slider right under the hero, and coloured labels on the sample products.
update public.pages set blocks = (
  select jsonb_agg(x.b order by x.ord, x.sub) from (
    select b, ord, 0 as sub from jsonb_array_elements(blocks) with ordinality t(b, ord)
    union all
    select '{"id":"st-offers","type":"offers","anim":"up","level":"h2","slot":"home","size":"hero"}'::jsonb, ord, 1
    from jsonb_array_elements(blocks) with ordinality t(b, ord) where b->>'id' = 'st-strip'
  ) x
) where slug = 'home' and not blocks::text like '%st-offers%';
update public.products set tags = array['hot','featured'] where slug in ('pastel-pillow-stack', 'patchwork-cotton-quilt');
update public.products set tags = array['bestseller','featured'] where slug in ('layered-cotton-bedsheet', 'halo-ceramic-vase');
update public.products set tags = array['hot'] where slug = 'twist-woven-bowls';
