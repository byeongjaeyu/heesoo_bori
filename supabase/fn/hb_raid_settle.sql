CREATE OR REPLACE FUNCTION public.hb_raid_settle()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r record; h record; n int := 0; killed boolean;
begin
  perform pg_advisory_xact_lock(hashtext('hb_raid_settle'));
  for r in select * from hb_raid where week < hb_week_key(now()) and settled_at is null loop
    killed := r.killed_at is not null;
    for h in select x.*, row_number() over (order by x.damage desc) rk from hb_raid_hits x
             join hb_fighters f on f.user_id = x.user_id and not f.hidden where x.week = r.week and x.damage > 0 loop
      if killed then
        insert into hb_grants(user_id, kind, amount, note) values (h.user_id, 'stones', {{raid.kill.s}}, '지난 주 월드 보스 처치 보상'), (h.user_id, 'gold', {{raid.kill.g}}, '지난 주 월드 보스 처치 보상');
        if h.rk = 1 then insert into hb_grants(user_id, kind, amount, note) values (h.user_id, 'stones', {{raid.top1.s}}, '지난 주 월드 보스 피해량 1위 보상'), (h.user_id, 'gold', {{raid.top1.g}}, '지난 주 월드 보스 피해량 1위 보상');
        elsif h.rk <= 3 then insert into hb_grants(user_id, kind, amount, note) values (h.user_id, 'stones', {{raid.top3.s}}, '지난 주 월드 보스 피해량 ' || h.rk || '위 보상'), (h.user_id, 'gold', {{raid.top3.g}}, '지난 주 월드 보스 피해량 ' || h.rk || '위 보상');
        end if;
      else
        insert into hb_grants(user_id, kind, amount, note) values (h.user_id, 'stones', {{raid.fail.s}}, '지난 주 월드 보스 참가 보상');
      end if;
      n := n + 1;
    end loop;
    update hb_raid set settled_at = now() where week = r.week;
  end loop;
  return n;
end $function$
