-- Launch clean-up of live content. Run after the code with the Nil theme is deployed.

-- The house theme. Visitors no longer pick their own store theme.
update site_settings set value = value || '{"theme":"nil","accent":"","visitorPicker":false}'::jsonb where key = 'appearance';

-- The welcome popup offered WELCOME10, but that coupon does not exist, so shoppers got an error at checkout.
update site_settings set value = value || '{"enabled":false}'::jsonb where key = 'popup';

-- Made-up purchase notifications are gone. Turn this back on in Settings once there are real orders.
update site_settings set value = '{"mode":"off"}'::jsonb where key = 'proof';

-- Home page: one h1, no free-delivery claim (no delivery area offers it), no expired countdown, no second 3D rail.
update pages set blocks = (
  select jsonb_agg(case
      when b->>'type' = 'showcasefull' then b || '{"level":"h1"}'::jsonb
      when b->>'type' = 'marquee' then b || '{"items":["Delivery across Bangladesh","Cash on delivery","Check your parcel, then pay"]}'::jsonb
      else b end order by ord)
  from jsonb_array_elements(blocks) with ordinality t(b, ord)
  where b->>'type' not in ('countdown', 'rail3d')
) where slug = 'home';
