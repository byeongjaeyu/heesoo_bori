CREATE OR REPLACE FUNCTION public.hb_xchg_propose(p_nick text, p_give text[], p_gold bigint, p_want uuid[], p_want_gold bigint, p_msg text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare u uuid := auth.uid(); b uuid; why text; r jsonb; escs uuid[] := '{}'; k text; tid uuid;
  give text[] := coalesce(p_give, '{}'); want uuid[] := coalesce(p_want, '{}'); g bigint := coalesce(p_gold, 0); wg bigint := coalesce(p_want_gold, 0);
begin
  if u is null then raise exception 'hb:auth'; end if;
  why := public.hb_xchg_ok(u); if why is not null then return jsonb_build_object('ok', false, 'reason', why); end if;
  select f.user_id into b from public.hb_fighters f where f.nickname = trim(p_nick) and not coalesce(f.hidden, false);
  if b is null then return jsonb_build_object('ok', false, 'reason', 'no_user'); end if;
  if b = u then return jsonb_build_object('ok', false, 'reason', 'self'); end if;
  if public.hb_xchg_ok(b) is not null then return jsonb_build_object('ok', false, 'reason', 'partner', 'why', public.hb_xchg_ok(b)); end if;
  if cardinality(give) > {{xchg.maxItems}} or cardinality(want) > {{xchg.maxItems}} then return jsonb_build_object('ok', false, 'reason', 'too_many_items'); end if;
  if g < 0 or wg < 0 or g > {{xchg.maxGold}} or wg > {{xchg.maxGold}} or g between 1 and {{below xchg.minGold}} or wg between 1 and {{below xchg.minGold}} then return jsonb_build_object('ok', false, 'reason', 'gold'); end if;
  if (cardinality(give) = 0 and g = 0) or (cardinality(want) = 0 and wg = 0) then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;
  if cardinality(give) + cardinality(want) = 0 then return jsonb_build_object('ok', false, 'reason', 'no_item'); end if;
  if exists (select 1 from unnest(want) w where not exists (select 1 from public.hb_items i join public.hb_item_defs d on d.id = i.def
      where i.id = w and i.owner = b and i.state = 'own' and d.tradable)) then return jsonb_build_object('ok', false, 'reason', 'want_item'); end if;
  if (select count(*) from public.hb_trades where a = u and state = 'open') >= {{xchg.maxOpen}} then return jsonb_build_object('ok', false, 'reason', 'too_many'); end if;
  begin
    foreach k in array give loop
      r := public.hb_escrow_put('item', 0, k, 'xchg');
      if not coalesce((r ->> 'ok')::boolean, false) then raise exception 'xc:%', r ->> 'reason'; end if;
      escs := escs || (r ->> 'id')::uuid;
    end loop;
    if g > 0 then
      r := public.hb_escrow_put('gold', g, null, 'xchg');
      if not coalesce((r ->> 'ok')::boolean, false) then raise exception 'xc:%', r ->> 'reason'; end if;
      escs := escs || (r ->> 'id')::uuid;
    end if;
  exception when others then
    if sqlerrm like 'xc:%' then return jsonb_build_object('ok', false, 'reason', substr(sqlerrm, 4)); end if; raise;
  end;
  insert into public.hb_trades (a, b, a_esc, a_gold, want_items, want_gold, msg) values (u, b, escs, g, want, wg, left(nullif(trim(p_msg), ''), 40)) returning id into tid;
  update public.hb_escrow set ref = 'xchg:' || tid where id = any(escs);
  return jsonb_build_object('ok', true, 'id', tid);
end $function$
