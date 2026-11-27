CREATE OR REPLACE FUNCTION public.hb_raid_info()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := auth.uid(); r hb_raid; my record; today text := to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM-DD'); top jsonb; cnt int;
begin
  perform hb_raid_settle();
  r := hb_raid_ensure();
  select * into my from hb_raid_hits where week = r.week and user_id = me;
  select coalesce(jsonb_agg(jsonb_build_object('nickname', t.nickname, 'damage', t.damage, 'mine', t.user_id = me) order by t.damage desc), '[]'::jsonb) into top
    from (select x.user_id, x.damage, f.nickname from hb_raid_hits x join hb_fighters f on f.user_id = x.user_id and not f.hidden
          where x.week = r.week and x.damage > 0 order by x.damage desc limit 10) t;
  select count(*) into cnt from hb_raid_hits x where x.week = r.week and x.damage > 0;
  return jsonb_build_object('week', r.week, 'boss', r.boss, 'max_hp', r.max_hp, 'hp', r.hp, 'killed_at', r.killed_at,
    'ends_at', ((r.week::date + 7)::timestamp at time zone 'Asia/Seoul'), 'max_tries', {{raid.tries}}, 'participants', cnt, 'top', top,
    'my', jsonb_build_object('damage', coalesce(my.damage, 0), 'tries_today', case when my.day = today then my.day_tries else 0 end));
end $function$
