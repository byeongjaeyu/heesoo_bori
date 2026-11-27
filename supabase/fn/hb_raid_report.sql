CREATE OR REPLACE FUNCTION public.hb_raid_report(p_damage bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := auth.uid(); h record; pw int; cap bigint; d bigint; tot bigint;
begin
  if me is null then raise exception 'not signed in'; end if;
  select * into h from hb_raid_hits where user_id = me and open_at is not null and open_at > now() - interval '3 minutes' order by open_at desc limit 1 for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_open'); end if;
  select power into pw from hb_fighters where user_id = me;
  cap := coalesce(pw, 0)::bigint * {{raid.capPower}} + {{raid.capBase}};
  d := least(greatest(coalesce(p_damage, 0), 0), cap);
  if p_damage > cap then insert into hb_flags(user_id, kind, detail) values (me, 'raid_cap', jsonb_build_object('sent', p_damage, 'cap', cap, 'power', pw)); end if;
  update hb_raid_hits set damage = damage + d, open_at = null, last_at = now() where week = h.week and user_id = me returning damage into tot;
  update hb_raid set hp = greatest(0, hp - d), killed_at = coalesce(killed_at, case when hp - d <= 0 then now() end) where week = h.week;
  return jsonb_build_object('ok', true, 'damage', d, 'total', tot, 'capped', p_damage > cap, 'info', hb_raid_info());
end $function$
