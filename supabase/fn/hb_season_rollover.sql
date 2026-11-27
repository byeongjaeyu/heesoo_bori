CREATE OR REPLACE FUNCTION public.hb_season_rollover()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare cur text; nowk text := hb_week_key(now()); r record; n int := 0; rw text;
begin
  perform pg_advisory_xact_lock(hashtext('hb_season_rollover'));
  select value into cur from hb_meta where key = 'season';
  if cur is null then insert into hb_meta values ('season', nowk); return 'init'; end if;
  if cur = nowk then return 'same'; end if;

  for r in select f.*, row_number() over (order by f.rating desc, f.wins desc, f.power desc) as rk
           from hb_fighters f where (f.wins + f.losses) > 0 and not f.hidden loop
    n := n + 1;
    rw := {{tier season.txt r.rk}};
    insert into hb_season_results(season, rank, user_id, nickname, rating, wins, losses, power, reward)
      values (cur, r.rk, r.user_id, r.nickname, r.rating, r.wins, r.losses, r.power, rw) on conflict do nothing;
    insert into hb_grants(user_id, kind, amount, note) values
      (r.user_id, 'stones', {{tier season.s r.rk}}, '지난 주 PvP 시즌 ' || r.rk || '위 보상');
    if r.rk <= {{tiermax season.g}} then
      insert into hb_grants(user_id, kind, amount, note) values
        (r.user_id, 'gold', {{tier season.g r.rk}}, '지난 주 PvP 시즌 ' || r.rk || '위 보상');
    end if;
    if r.rk <= {{tiermax season.a}} then
      insert into hb_grants(user_id, kind, amount, note) values
        (r.user_id, 'auto', {{tier season.a r.rk}}, '지난 주 PvP 시즌 ' || r.rk || '위 보상');
    end if;
  end loop;

  update hb_fighters set rating = 1000, wins = 0, losses = 0 where rating <> 1000 or wins <> 0 or losses <> 0;
  update hb_meta set value = nowk where key = 'season';
  return 'rolled:' || cur || ':' || n;
end $function$
