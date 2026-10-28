-- Lets staff move an order to any status, including back, and keeps stock, credit and rewards correct.
create or replace function public.force_order_status(p_order uuid, p_status text, p_actor uuid, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare
  cur text; pay text; method text; v_credit numeric; v_user uuid; v_refunded numeric;
  was_held boolean; will_hold boolean; v_short text;
begin
  if p_status not in ('pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned') then raise exception 'BAD_STATUS'; end if;
  select status, payment_status, payment_method, credit_used, user_id, refunded_amount into cur, pay, method, v_credit, v_user, v_refunded
    from public.orders where id = p_order for update;
  if cur is null then raise exception 'NOT_FOUND'; end if;
  if cur = p_status then return; end if;

  was_held := cur not in ('cancelled', 'returned');
  will_hold := p_status not in ('cancelled', 'returned');

  if was_held and not will_hold then
    -- stock goes back and spent credit is returned
    update public.product_variants v set stock = v.stock + i.qty from public.order_items i where i.order_id = p_order and i.variant_id = v.id;
    if v_credit > 0 and v_user is not null then
      insert into public.credit_ledger (user_id, delta, kind, order_id, note) values (v_user, v_credit, 'redeem_reversal', p_order, 'Credit returned because the order was ' || p_status) on conflict do nothing;
    end if;
  elsif not was_held and will_hold then
    -- the order is live again, so the stock is taken once more
    select v.id into v_short from public.order_items i join public.product_variants v on v.id = i.variant_id where i.order_id = p_order and v.stock < i.qty limit 1;
    if v_short is not null then raise exception 'OUT_OF_STOCK'; end if;
    update public.product_variants v set stock = v.stock - i.qty from public.order_items i where i.order_id = p_order and i.variant_id = v.id;
    if v_credit > 0 and v_user is not null then
      delete from public.credit_ledger where order_id = p_order and kind = 'redeem_reversal';
    end if;
  end if;

  -- a referral reward is only earned while the order stays delivered
  if cur = 'delivered' and p_status <> 'delivered' then
    delete from public.credit_ledger where order_id = p_order and kind = 'referral_reward';
  end if;

  update public.orders set status = p_status,
    payment_status = case
      when p_status = 'delivered' and pay in ('unpaid', 'failed') then 'paid'
      when cur = 'delivered' and p_status <> 'delivered' and method = 'cod' and pay = 'paid' and coalesce(v_refunded, 0) = 0 then 'unpaid'
      else pay end
  where id = p_order;
  insert into public.order_events (order_id, status, note, actor) values (p_order, p_status, coalesce(nullif(p_note, ''), 'Status changed from ' || cur), p_actor);
end $$;

revoke all on function public.force_order_status(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.force_order_status(uuid, text, uuid, text) to service_role;
