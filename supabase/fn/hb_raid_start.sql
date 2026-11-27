CREATE OR REPLACE FUNCTION public.hb_raid_start()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := auth.uid(); r hb_raid; today text := to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM-DD'); h record;
begin
  if me is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from hb_fighters where user_id = me) then return jsonb_build_object('ok', false, 'reason', 'register'); end if;
  r := hb_raid_ensure();
  insert into hb_raid_hits(week, user_id) values (r.week, me) on conflict do nothing;
  select * into h from hb_raid_hits where week = r.week and user_id = me for update;
  if h.day is distinct from today then h.day_tries := 0; end if;
  if h.day_tries >= {{raid.tries}} then return jsonb_build_object('ok', false, 'reason', 'tries'); end if;
  update hb_raid_hits set day = today, day_tries = h.day_tries + 1, tries = tries + 1, open_at = now() where week = r.week and user_id = me;
  return jsonb_build_object('ok', true, 'info', hb_raid_info());
end $function$
