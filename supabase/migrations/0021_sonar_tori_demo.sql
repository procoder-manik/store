-- Sonar Tori launch look, with placeholder products so the store can be seen as it will feel.
-- Photos are from Unsplash (free for commercial use). Every placeholder has a DEMO- SKU.
--
-- To remove them later:
--   delete from products where id in (select product_id from product_variants where sku like 'DEMO-%');
-- The older products are archived, not deleted. Bring one back by setting its status to 'active'.

update site_settings set value = '{"name":"Sonar Tori","tagline":"Clothing and home pieces chosen to last","logo":""}'::jsonb where key = 'brand';
update site_settings set value = value || '{"theme":"padma","accent":"","visitorPicker":false,"buttons":"theme"}'::jsonb where key = 'appearance';
update site_settings set value = '{"links":[{"label":"Women","href":"/category/women"},{"label":"Men","href":"/category/men"},{"label":"Accessories","href":"/category/accessories"},{"label":"Home","href":"/category/home"}]}'::jsonb where key = 'header';

update products set status = 'archived' where status = 'active';
update categories set active = false;
insert into categories (name, slug, sort, active) values
  ('Women', 'women', 1, true), ('Men', 'men', 2, true), ('Accessories', 'accessories', 3, true), ('Home', 'home', 4, true)
on conflict (slug) do update set active = true, sort = excluded.sort, name = excluded.name;

with items (slug, name, kind, cat, price, tags, sized, description, photos) as (values
  ('sage-silk-sari', 'Sage Silk Sari', 'decor', 'women', 12500, array['new','featured'], false, 'A soft sage sari with a quiet sheen, made to be worn again and again. Comes with an unstitched blouse piece.', array['1679006831648-7c9ea12e5807']),
  ('marigold-festive-sari', 'Marigold Festive Sari', 'decor', 'women', 14800, array['featured'], false, 'Warm pink and marigold for the days you want to remember. Comes with an unstitched blouse piece.', array['1617627143750-d86bc21e42bb']),
  ('ivory-column-dress', 'Ivory Column Dress', 'tee', 'women', 7200, array['new'], true, 'A long, clean line in ivory. Easy to dress up, easier to wear.', array['1737188550207-df877c6392dc']),
  ('terracotta-shirt-dress', 'Terracotta Shirt Dress', 'tee', 'women', 5900, array['new','featured'], true, 'A button-down dress in baked-earth orange, cut to move with you in the heat.', array['1789110853872-f416085557fa']),
  ('white-linen-camp-shirt', 'White Linen Camp Shirt', 'tee', 'women', 3950, array['featured'], true, 'An open-collar linen shirt that softens with every wash.', array['1783113298894-eeb3b71315d9','1783113298321-6fffb39a4f8b']),
  ('madder-long-sleeve-gown', 'Madder Long-Sleeve Gown', 'tee', 'women', 9800, array[]::text[], true, 'A deep madder red with long sleeves and a full, easy skirt.', array['1612336307429-8a898d10e223']),
  ('riverside-linen-shirt', 'Riverside Linen Shirt', 'tee', 'men', 3650, array['new','featured'], true, 'Light blue linen with a relaxed fit, for long, warm days.', array['1792007195248-5a25dd3dc336','1792007195189-680db6f5b06a','1792007194806-72a27dd975b0']),
  ('camel-overcoat', 'Camel Overcoat', 'hoodie', 'men', 16500, array['featured'], true, 'A long camel coat for Dhaka''s few cold weeks, and every trip beyond them.', array['1619603364937-8d7af41ef206']),
  ('tan-overshirt', 'Tan Overshirt', 'tee', 'men', 4800, array[]::text[], true, 'A sturdy overshirt in tan, worn alone or layered over a tee.', array['1776838108803-91bbab8a09da']),
  ('saddle-top-handle-bag', 'Saddle Top-Handle Bag', 'decor', 'accessories', 8900, array['new','featured'], false, 'A structured leather bag with a top handle and a long strap.', array['1691480150204-66dd1eb77391','1691480250099-a63081ecfcb8']),
  ('courier-leather-satchel', 'Courier Leather Satchel', 'decor', 'accessories', 9800, array['featured'], false, 'A brown leather satchel with room for a laptop and a long day.', array['1473188588951-666fce8e7c68']),
  ('weekender-duffel', 'Weekender Duffel', 'decor', 'accessories', 12900, array[]::text[], false, 'A leather duffel that fits two nights away and looks better with every trip.', array['1525103504173-8dc1582c7430']),
  ('washed-linen-bed-set', 'Washed Linen Bed Set', 'cover', 'home', 9500, array['new','featured'], false, 'A sheet and two pillow covers in washed linen. Soft from the first night.', array['1617325247661-675ab4b64ae2']),
  ('stone-linen-duvet-cover', 'Stone Linen Duvet Cover', 'cover', 'home', 7800, array[]::text[], false, 'A duvet cover in white and stone grey, made to layer.', array['1606855637183-ea2a00b6f15f']),
  ('indigo-cushion-cover', 'Indigo Cushion Cover', 'cover', 'home', 1650, array[]::text[], false, 'A blue and white cushion cover to lift a plain sofa.', array['1582586131113-f9f71cda5265']),
  ('bone-ceramic-vase-pair', 'Bone Ceramic Vase Pair', 'decor', 'home', 3400, array['featured'], false, 'Two white ceramic vases that work with or without flowers.', array['1572853566597-b83cde546912']),
  ('terracotta-vessels', 'Terracotta Vessels, Set of 3', 'decor', 'home', 2900, array[]::text[], false, 'Three clay vessels in warm brown for a shelf or a table.', array['1631125915902-d8abe9225ff2'])
), added as (
  insert into products (slug, name, kind, category_id, description, base_price, tags, status)
  select i.slug, i.name, i.kind, c.id, i.description, i.price, i.tags, 'active' from items i join categories c on c.slug = i.cat
  on conflict (slug) do update set status = 'active'
  returning id, slug
), pics as (
  insert into product_images (product_id, path, alt, sort)
  select a.id, 'https://images.unsplash.com/photo-' || p.photo || '?w=1200&q=80&auto=format&fit=crop', i.name, p.ord - 1
  from added a join items i on i.slug = a.slug, unnest(i.photos) with ordinality p(photo, ord)
  returning 1
)
insert into product_variants (product_id, sku, size, stock)
select a.id, 'DEMO-' || upper(i.slug) || coalesce('-' || s.size, ''), s.size, 10
from added a join items i on i.slug = a.slug
cross join lateral (select unnest(case when i.sized then array['S','M','L','XL'] else array[null::text] end) as size) s;

update pages set blocks = '[
  {"id":"st-hero","type":"herofull","anim":"none","level":"h1","variant":"editorial","align":"left","heading":"Sonar Tori","sub":"Clothing and home pieces chosen to last, carried to your door anywhere in Bangladesh.","image":"https://images.unsplash.com/photo-1755424086014-54b56a9d3f21?w=2400&q=80&auto=format&fit=crop","button":"Explore the collection","link":"/shop"},
  {"id":"st-new","type":"products","anim":"up","level":"h2","title":"New this season","source":"tag","tag":"new","category":"","count":4},
  {"id":"st-story","type":"split","anim":"up","level":"h2","heading":"Named after a golden boat","body":"In Tagore''s poem, a golden boat carries away only what is worth keeping. We choose what we sell the same way: for its cloth, its cut, and how long it will stay with you.","image":"https://images.unsplash.com/photo-1787220272461-2c53528c9349?w=1400&q=80&auto=format&fit=crop","imageSide":"left","button":"Our story","link":"/about"},
  {"id":"st-cats","type":"categories","anim":"up","level":"h2","title":"Shop by category"},
  {"id":"st-sari","type":"split","anim":"up","level":"h2","heading":"Saris for the days you remember","body":"Soft silks and warm colours, made to be worn again and again.","image":"https://images.unsplash.com/photo-1610030469839-f909584b43f1?w=1400&q=80&auto=format&fit=crop","imageSide":"right","button":"Shop women","link":"/category/women"},
  {"id":"st-all","type":"products","anim":"up","level":"h2","title":"The collection","source":"tag","tag":"featured","category":"","count":8},
  {"id":"st-trust","type":"trust","anim":"up","level":"h2","items":[{"icon":"truck","title":"Delivery across Bangladesh","text":"Inside and outside Dhaka."},{"icon":"shield","title":"Cash on delivery","text":"Check your parcel, then pay."},{"icon":"refresh","title":"Wrong or damaged item?","text":"Tell us and we will make it right."},{"icon":"headset","title":"Help when you need it","text":"Call, WhatsApp or write to us."}]}
]'::jsonb where slug = 'home';
