-- Store refocused on bedding, pillows and home decor. Placeholder products with transparent Unsplash photos.
-- Every placeholder has a DEMO- SKU. To remove them later:
--   delete from products where id in (select product_id from product_variants where sku like 'DEMO-%');

update site_settings set value = value || '{"tagline":"Bedsheets, pillows and home decor chosen to last"}'::jsonb where key = 'brand';
-- Categories now appear in the menu by themselves. Extra links stay in Admin, Site and menu.
update site_settings set value = '{"links":[{"label":"All products","href":"/shop"}]}'::jsonb where key = 'header';

update products set status = 'archived' where status = 'active';
update categories set active = false;
insert into categories (name, slug, sort, active) values
  ('Bedsheets & Quilts', 'bedsheets', 1, true), ('Pillows & Cushions', 'pillows', 2, true), ('Home Decor', 'home-decor', 3, true), ('Accessories', 'accessories', 4, true)
on conflict (slug) do update set active = true, sort = excluded.sort, name = excluded.name;

with items (slug, name, cat, price, tags, sizes, color, hex, photo, description) as (values

  ('layered-cotton-bedsheet', 'Layered Cotton Bedsheet', 'bedsheets', 2850, array['new','featured']::text[], array['Queen','King']::text[], 'Forest', '#4f7a58', 'https://images.unsplash.com/photo-1625471592808-3b848a6e9ffd?rect=540,479,3780,2579&w=1000&bg-remove=true&fm=webp&q=80', 'A soft, tightly woven bedsheet in deep, easy colours. Comes with two pillow covers.'),
  ('patchwork-cotton-quilt', 'Patchwork Cotton Quilt', 'bedsheets', 4900, array['featured']::text[], array[]::text[], 'Multicolour', '#7a3b2e', 'https://images.unsplash.com/photo-1594526761005-4ccdbd608d2b?rect=0,78,5568,3633&w=1000&bg-remove=true&fm=webp&q=80', 'Bright patchwork stitched into a warm, light quilt that brightens a plain bed.'),
  ('stone-patch-quilt', 'Stone Patch Quilt', 'bedsheets', 4400, array['new']::text[], array[]::text[], 'Stone', '#6b6a70', 'https://images.unsplash.com/photo-1570362685387-3cf5499c3fdc?rect=326,0,4335,3108&w=1000&bg-remove=true&fm=webp&q=80', 'Quiet grey with a run of colour along one edge. Reversible and easy to wash.'),
  ('honey-quilted-throw', 'Honey Quilted Throw', 'bedsheets', 3600, array['featured']::text[], array[]::text[], 'Honey', '#c8971f', 'https://images.unsplash.com/photo-1610768400574-a588f7e1a7b7?rect=0,0,2770,2820&w=1000&bg-remove=true&fm=webp&q=80', 'A richly stitched throw for the end of the bed or the arm of a sofa.'),
  ('cloud-cotton-cushion', 'Cloud Cotton Cushion', 'pillows', 950, array['new']::text[], array['16 x 16 in','18 x 18 in']::text[], 'White', '#c9ccd2', 'https://images.unsplash.com/photo-1629949009710-2df14c41a72e?rect=647,669,2734,2660&w=1000&bg-remove=true&fm=webp&q=80', 'A plump, plain white cushion. Goes with anything you already own.'),
  ('pastel-pillow-stack', 'Pastel Pillow Stack, Set of 3', 'pillows', 2400, array['new','featured']::text[], array[]::text[], 'Emerald', '#1f9e78', 'https://images.unsplash.com/photo-1737094661981-baad6b211852?rect=117,406,2209,1520&w=1000&bg-remove=true&fm=webp&q=80', 'Three soft bed pillows in emerald, mint and lavender.'),
  ('velvet-cushion-trio', 'Velvet Cushion Trio', 'pillows', 3250, array['featured']::text[], array[]::text[], 'Bottle green', '#23453c', 'https://images.unsplash.com/photo-1559051668-9024c9b5e84b?rect=288,561,2067,2580&w=1000&bg-remove=true&fm=webp&q=80', 'Three velvet cushions with a gentle sheen and piped edges.'),
  ('ember-tassel-cushions', 'Ember Tassel Cushions, Pair', 'pillows', 1950, array['new']::text[], array[]::text[], 'Ember', '#d9631b', 'https://images.unsplash.com/photo-1738872601857-fbaaa00717b8?rect=0,1822,5404,4092&w=1000&bg-remove=true&fm=webp&q=80', 'Warm orange cushions finished with a hand-tied style tassel.'),
  ('highland-check-pillow', 'Highland Check Pillow', 'pillows', 1250, array[]::text[], array[]::text[], 'Sand', '#a98d78', 'https://images.unsplash.com/photo-1772201047974-13b343c290a0?rect=0,1652,2896,1780&w=1000&bg-remove=true&fm=webp&q=80', 'A soft woven check that feels at home on a bed or a reading chair.'),
  ('confetti-weave-cushions', 'Confetti Weave Cushions, Pair', 'pillows', 1850, array[]::text[], array[]::text[], 'Coral', '#d6786a', 'https://images.unsplash.com/photo-1682616394422-726a0d8901a9?rect=0,2516,4724,4560&w=1000&bg-remove=true&fm=webp&q=80', 'Two cushions in a small, colourful weave to lift a plain sofa.'),
  ('halo-ceramic-vase', 'Halo Ceramic Vase', 'home-decor', 1450, array['new','featured']::text[], array[]::text[], 'Sand', '#b9a68f', 'https://images.unsplash.com/photo-1643569556871-91ec60671ed7?rect=400,937,1867,1978&w=1000&bg-remove=true&fm=webp&q=80', 'A round ceramic vase with an open centre. Looks finished with or without flowers.'),
  ('amber-table-lamp', 'Amber Table Lamp', 'home-decor', 4200, array['featured']::text[], array[]::text[], 'Amber', '#c9731f', 'https://images.unsplash.com/photo-1573676386604-78f8ed228e2b?w=1000&bg-remove=true&fm=webp&q=80', 'A dark ceramic base under a warm amber shade, for a soft evening light.'),
  ('strap-round-mirror', 'Strap Round Mirror', 'home-decor', 3300, array['new']::text[], array[]::text[], 'Copper', '#a96f4f', 'https://images.unsplash.com/photo-1592048401715-d18c53553bd0?rect=344,143,2082,3334&w=1000&bg-remove=true&fm=webp&q=80', 'A thin metal frame hung from a leather-look strap.'),
  ('baroque-oval-mirror', 'Baroque Oval Mirror', 'home-decor', 5800, array[]::text[], array[]::text[], 'Antique gold', '#8e7a4e', 'https://images.unsplash.com/photo-1612392549386-b6969764af6f?rect=191,140,2260,3224&w=1000&bg-remove=true&fm=webp&q=80', 'A carved antique-finish frame that becomes the centre of a room.'),
  ('stoneware-vase-pair', 'Stoneware Vase Pair', 'home-decor', 1950, array[]::text[], array[]::text[], 'Clay', '#8f8671', 'https://images.unsplash.com/photo-1677761640321-b80251be00ca?rect=1396,4415,3334,2116&w=1000&bg-remove=true&fm=webp&q=80', 'Two small, rounded vases in earthy glazes.'),
  ('potted-succulent', 'Succulent in White Pot', 'home-decor', 1100, array[]::text[], array[]::text[], 'Sage', '#7f9a78', 'https://images.unsplash.com/photo-1746393877488-1dfd62264775?rect=697,3160,1968,1891&w=1000&bg-remove=true&fm=webp&q=80', 'A small green accent in a ribbed white pot, for a desk or a shelf.'),
  ('twist-woven-bowls', 'Twist Woven Bowls', 'accessories', 1350, array['new']::text[], array[]::text[], 'Natural', '#b9b4a6', 'https://images.unsplash.com/photo-1626037235530-fe56de7d6459?rect=388,1070,1556,1739&w=1000&bg-remove=true&fm=webp&q=80', 'A nesting set of woven bowls for keys, fruit or small things.'),
  ('acacia-serving-trays', 'Acacia Serving Trays, Pair', 'accessories', 1650, array['featured']::text[], array[]::text[], 'Acacia', '#b47a3c', 'https://images.unsplash.com/photo-1784901393087-988ae280ea4c?rect=564,1757,6504,2034&w=1000&bg-remove=true&fm=webp&q=80', 'Two long oval trays in warm wood, for serving or for a table display.'),
  ('plum-pillar-candle', 'Plum Pillar Candle', 'accessories', 550, array[]::text[], array[]::text[], 'Plum', '#54243c', 'https://images.unsplash.com/photo-1608070418607-f29f37137376?rect=2907,1561,809,1900&w=1000&bg-remove=true&fm=webp&q=80', 'A tall, deep-coloured pillar candle for a slow evening.'),
  ('terry-towel-pair', 'Terry Towel Pair', 'accessories', 1400, array[]::text[], array[]::text[], 'Ruby and teal', '#a52f55', 'https://images.unsplash.com/photo-1639298109207-5a9ccc254481?rect=983,1482,4132,1964&w=1000&bg-remove=true&fm=webp&q=80', 'Two thick, absorbent towels in strong colours.'),
  ('charcoal-bath-towel', 'Charcoal Bath Towel', 'accessories', 950, array[]::text[], array[]::text[], 'Charcoal', '#5a5f66', 'https://images.unsplash.com/photo-1638232928539-6e91c47ddec5?rect=0,348,3990,5122&w=1000&bg-remove=true&fm=webp&q=80', 'A soft looped towel in a dark, forgiving grey.')
), added as (
  insert into products (slug, name, kind, category_id, description, base_price, tags, status)
  select i.slug, i.name, case when i.cat in ('bedsheets','pillows') then 'cover' else 'decor' end, c.id, i.description, i.price, i.tags, 'active'
  from items i join categories c on c.slug = i.cat
  returning id, slug
), pics as (
  insert into product_images (product_id, path, alt, sort)
  select a.id, i.photo, i.name, 0 from added a join items i on i.slug = a.slug
  returning 1
)
insert into product_variants (product_id, sku, color_name, color_hex, size, stock)
select a.id, 'DEMO-' || upper(i.slug) || coalesce('-' || upper(replace(s.size, ' ', '')), ''), i.color, i.hex, s.size, 10
from added a join items i on i.slug = a.slug
cross join lateral (select unnest(case when cardinality(i.sizes) > 0 then i.sizes else array[null::text] end) as size) s;

update pages set blocks = '[{"id": "st-hero", "type": "showcasefull", "anim": "up", "level": "h1", "eyebrow": "New season", "heading": "Good things, carried to your door", "sub": "Bedsheets, pillows and home decor chosen to last, delivered anywhere in Bangladesh. Pay in cash when it arrives.", "button": "See this piece", "tagline": "For the rooms you come home to", "source": "tag", "category": "", "tag": "featured", "autoplay": 5, "fit": "cutout", "showNav": true, "facebook": "", "instagram": "", "youtube": "", "whatsapp": ""}, {"id": "st-strip", "type": "marquee", "anim": "up", "level": "h2", "look": "dark", "speed": "normal", "items": ["Delivery across Bangladesh", "Cash on delivery", "Check your parcel, then pay"]}, {"id": "st-3d", "type": "rail3dfull", "anim": "up", "level": "h2", "heading": "Turn through the collection.", "sub": "Drag to explore, then tap anything to see it up close.", "button": "Shop everything", "link": "/shop", "button2": "New in", "link2": "/shop?tag=new", "style": "arc", "source": "all", "category": "", "tag": "featured", "showHero": true, "defaultView": "3d"}, {"id": "st-cats", "type": "categories", "anim": "up", "level": "h2", "title": "Shop by category"}, {"id": "st-new", "type": "products", "anim": "up", "level": "h2", "title": "New arrivals", "source": "tag", "tag": "new", "category": "", "count": 4}, {"id": "st-rooms", "type": "gallery", "anim": "up", "level": "h2", "title": "Ideas for every room", "images": [{"src": "https://images.unsplash.com/photo-1631048501786-4e97f20eac71?w=1200&q=80&auto=format&fit=crop", "caption": "A calm white bed"}, {"src": "https://images.unsplash.com/photo-1615800001964-5afd0ae8e49a?w=1200&q=80&auto=format&fit=crop", "caption": "Colour on the sofa"}, {"src": "https://images.unsplash.com/photo-1560448205-4d9b3e6bb6db?w=1200&q=80&auto=format&fit=crop", "caption": "Pillows that change a room"}, {"src": "https://images.unsplash.com/photo-1600210491305-7396500b5b31?w=1200&q=80&auto=format&fit=crop", "caption": "Layered linen"}, {"src": "https://images.unsplash.com/photo-1552558636-f6a8f071c2b3?w=1200&q=80&auto=format&fit=crop", "caption": "Green beside the bed"}]}, {"id": "st-beds", "type": "products", "anim": "up", "level": "h2", "title": "For the bedroom", "source": "category", "tag": "featured", "category": "bedsheets", "count": 4}, {"id": "st-story", "type": "split", "anim": "up", "level": "h2", "heading": "Named after a golden boat", "body": "In Tagore''s poem, a golden boat carries away only what is worth keeping. We choose what we sell the same way: for its fabric, its finish, and how long it will stay with you.", "image": "https://images.unsplash.com/photo-1755424086014-54b56a9d3f21?w=1400&q=80&auto=format&fit=crop", "imageSide": "left", "button": "Our story", "link": "/about"}, {"id": "st-pillows", "type": "products", "anim": "up", "level": "h2", "title": "Pillows and cushions", "source": "category", "tag": "featured", "category": "pillows", "count": 4}, {"id": "st-decor", "type": "products", "anim": "up", "level": "h2", "title": "Finishing touches", "source": "category", "tag": "featured", "category": "home-decor", "count": 4}, {"id": "st-faq", "type": "faq", "anim": "up", "level": "h2", "title": "Before you order", "items": [{"q": "How do I pay?", "a": "Pay in cash when your parcel arrives. If online payment is shown at checkout, you can also use it there."}, {"q": "Can I check the parcel first?", "a": "Yes. Check your parcel when it arrives, then pay."}, {"q": "Do you deliver outside Dhaka?", "a": "Yes, across Bangladesh. The delivery fee for your area is shown at checkout."}, {"q": "What if something is wrong or damaged?", "a": "Tell us through the Contact page or WhatsApp and we will make it right."}]}]'::jsonb where slug = 'home';

-- Faster queries as orders grow: indexes for the foreign keys read most often, and sign-in checks evaluated once per query, not once per row.
create index if not exists product_images_product_id_idx on product_images (product_id);
create index if not exists order_items_variant_id_idx on order_items (variant_id);
create index if not exists reviews_user_id_idx on reviews (user_id);
create index if not exists orders_referrer_id_idx on orders (referrer_id);
do $$
declare p record; q text; c text;
begin
  for p in select tablename, policyname, qual, with_check from pg_policies
           where schemaname = 'public' and (coalesce(qual,'') || coalesce(with_check,'')) ~ 'auth\.uid\(\)' and (coalesce(qual,'') || coalesce(with_check,'')) !~ 'SELECT auth\.uid'
  loop
    q := replace(p.qual, 'auth.uid()', '(select auth.uid())');
    c := replace(p.with_check, 'auth.uid()', '(select auth.uid())');
    execute format('alter policy %I on public.%I', p.policyname, p.tablename)
      || case when q is not null then format(' using (%s)', q) else '' end
      || case when c is not null then format(' with check (%s)', c) else '' end;
  end loop;
end $$;
