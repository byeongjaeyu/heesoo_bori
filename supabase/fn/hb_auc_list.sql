CREATE OR REPLACE FUNCTION public.hb_auc_list(p_key text, p_start bigint, p_buyout bigint, p_hours integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare u uuid := auth.uid(); r jsonb; eid uuid; it public.hb_items; d public.hb_item_defs; aid uuid;
begin
  if u is null then raise exception 'hb:auth'; end if;
  if not public.hb_auc_ok(u) then return jsonb_build_object('ok', false, 'reason', 'nick'); end if;
  if p_hours not in ({{list auc.hours}}) then return jsonb_build_object('ok', false, 'reason', 'hours'); end if;
  if p_start is null or p_start < {{auc.minStart}} or p_start > {{auc.maxPrice}} or (p_buyout is not null and (p_buyout < p_start or p_buyout > {{auc.maxPrice}})) then
    return jsonb_build_object('ok', false, 'reason', 'price'); end if;
  if (select count(*) from public.hb_auctions where seller = u and state = 'open') >= {{auc.maxOpen}} then return jsonb_build_object('ok', false, 'reason', 'too_many'); end if;
  r := public.hb_escrow_put('item', 0, p_key, 'auction');
  if not coalesce((r ->> 'ok')::boolean, false) then return r; end if;
  eid := (r ->> 'id')::uuid;
  select i.* into it from public.hb_items i join public.hb_escrow e on e.item = i.id where e.id = eid;
  select * into d from public.hb_item_defs where id = it.def;
  insert into public.hb_auctions (seller, item, item_escrow, def, rar, slot, enh, ilv, ref, start_price, buyout, ends_at)
    values (u, it.id, eid, it.def, d.rar, d.slot, it.enh, it.ilv, it.ref, p_start, p_buyout, now() + make_interval(hours => p_hours)) returning id into aid;
  update public.hb_escrow set ref = 'auc:' || aid where id = eid;
  return jsonb_build_object('ok', true, 'id', aid);
end $function$
