CREATE OR REPLACE FUNCTION public.hb_auc_min(a hb_auctions)
 RETURNS bigint
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case when a.bid is null then a.start_price else a.bid + greatest(1, ceil(a.bid * {{auc.step}}))::bigint end $function$
