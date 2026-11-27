CREATE OR REPLACE FUNCTION public.hb_auc_close(p_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare a public.hb_auctions; v_fee bigint;
begin
  select * into a from public.hb_auctions where id = p_id for update;
  if not found or a.state <> 'open' then return false; end if;
  if a.bidder is not null and a.bid_escrow is not null then
    v_fee := floor(a.bid * {{auc.fee}});
    perform public.hb_escrow_settle(a.item_escrow, a.bidder, '경매 낙찰');
    update public.hb_escrow set state = 'released', to_user = a.seller, closed_at = now() where id = a.bid_escrow and state = 'held';
    insert into public.hb_grants (user_id, kind, amount, note) values (a.seller, 'gold', a.bid - v_fee, '경매 판매 대금 (수수료 {{pct auc.fee}}% 제외)');
    insert into public.hb_ledger (user_id, kind, amount, escrow, reason) values (a.seller, 'gold', a.bid - v_fee, a.bid_escrow, '경매 판매'), (null, 'gold', v_fee, a.bid_escrow, 'auction_fee');
    update public.hb_auctions set state = 'sold', price = a.bid, fee = v_fee, closed_at = now() where id = a.id;
  else
    perform public.hb_escrow_settle(a.item_escrow, null, '경매 유찰 반환');
    update public.hb_auctions set state = 'expired', closed_at = now() where id = a.id;
  end if;
  return true;
end $function$
