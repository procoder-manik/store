-- Home page opens with the scroll-through product hero again, and keeps a 3D section.
-- The hanger rail is not on the home page but stays selectable in the page and landing page builders.

-- The hero's background follows each product's colour, so every placeholder gets one.
with colors (slug, name, hex) as (values
  ('sage-silk-sari', 'Sage', '#8a9a7e'), ('marigold-festive-sari', 'Marigold', '#d9822b'), ('ivory-column-dress', 'Ivory', '#e8e2d4'),
  ('terracotta-shirt-dress', 'Terracotta', '#b5533c'), ('white-linen-camp-shirt', 'White', '#dcd9d0'), ('madder-long-sleeve-gown', 'Madder', '#8e2a2a'),
  ('riverside-linen-shirt', 'Sky blue', '#8fb0cc'), ('camel-overcoat', 'Camel', '#b08a5e'), ('tan-overshirt', 'Tan', '#a98558'),
  ('saddle-top-handle-bag', 'Saddle', '#8a5a33'), ('courier-leather-satchel', 'Brown', '#6f4a2d'), ('weekender-duffel', 'Dark brown', '#5e3d26'),
  ('washed-linen-bed-set', 'Natural', '#cfc8b8'), ('stone-linen-duvet-cover', 'Stone', '#a9a8a0'), ('indigo-cushion-cover', 'Indigo', '#2f4a7a'),
  ('bone-ceramic-vase-pair', 'Bone', '#d8d3c6'), ('terracotta-vessels', 'Terracotta', '#a8623f')
)
update product_variants v set color_name = c.name, color_hex = c.hex
from colors c join products p on p.slug = c.slug
where v.product_id = p.id and v.sku like 'DEMO-%';

update pages set blocks = '[
  {"id":"st-hero","type":"showcasefull","anim":"up","level":"h1","eyebrow":"New season","heading":"Good things, carried to your door","sub":"Clothing and home pieces chosen to last, delivered anywhere in Bangladesh. Pay in cash when it arrives.","button":"See this piece","tagline":"Clothing and home pieces chosen to last","source":"tag","category":"","tag":"featured","autoplay":5,"fit":"card","showNav":true,"facebook":"","instagram":"","youtube":"","whatsapp":""},
  {"id":"st-strip","type":"marquee","anim":"up","level":"h2","look":"dark","speed":"normal","items":["Delivery across Bangladesh","Cash on delivery","Check your parcel, then pay"]},
  {"id":"st-new","type":"products","anim":"up","level":"h2","title":"New this season","source":"tag","tag":"new","category":"","count":4},
  {"id":"st-3d","type":"rail3dfull","anim":"up","level":"h2","heading":"Turn through the collection.","sub":"Drag to explore, then tap anything to see it up close.","button":"Shop everything","link":"/shop","button2":"New in","link2":"/shop?tag=new","style":"arc","source":"all","category":"","tag":"featured","showHero":true,"defaultView":"3d"},
  {"id":"st-story","type":"split","anim":"up","level":"h2","heading":"Named after a golden boat","body":"In Tagore''s poem, a golden boat carries away only what is worth keeping. We choose what we sell the same way: for its cloth, its cut, and how long it will stay with you.","image":"https://images.unsplash.com/photo-1755424086014-54b56a9d3f21?w=1400&q=80&auto=format&fit=crop","imageSide":"left","button":"Our story","link":"/about"},
  {"id":"st-cats","type":"categories","anim":"up","level":"h2","title":"Shop by category"},
  {"id":"st-sari","type":"split","anim":"up","level":"h2","heading":"Saris for the days you remember","body":"Soft silks and warm colours, made to be worn again and again.","image":"https://images.unsplash.com/photo-1610030469839-f909584b43f1?w=1400&q=80&auto=format&fit=crop","imageSide":"right","button":"Shop women","link":"/category/women"},
  {"id":"st-all","type":"products","anim":"up","level":"h2","title":"The collection","source":"tag","tag":"featured","category":"","count":8},
  {"id":"st-trust","type":"trust","anim":"up","level":"h2","items":[{"icon":"truck","title":"Delivery across Bangladesh","text":"Inside and outside Dhaka."},{"icon":"shield","title":"Cash on delivery","text":"Check your parcel, then pay."},{"icon":"refresh","title":"Wrong or damaged item?","text":"Tell us and we will make it right."},{"icon":"headset","title":"Help when you need it","text":"Call, WhatsApp or write to us."}]}
]'::jsonb where slug = 'home';
