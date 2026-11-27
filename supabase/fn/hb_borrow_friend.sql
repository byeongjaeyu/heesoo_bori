CREATE OR REPLACE FUNCTION public.hb_borrow_friend(p_friend uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := auth.uid(); today text := to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM-DD'); f record; mynick text; lent int;
begin
  if me is null then raise exception 'not signed in'; end if;
  select nickname into mynick from hb_fighters where user_id = me;
  if mynick is null then return jsonb_build_object('ok', false, 'reason', 'register'); end if;
  if p_friend = me then return jsonb_build_object('ok', false, 'reason', 'self'); end if;
  select * into f from hb_fighters where user_id = p_friend and played and not hidden;
  if not found then return jsonb_build_object('ok', false, 'reason', 'friend'); end if;
  if exists (select 1 from hb_borrows where day = today and user_id = me) then return jsonb_build_object('ok', false, 'reason', 'used'); end if;
  insert into hb_borrows(day, user_id, friend_id) values (today, me, p_friend);
  select count(*) into lent from hb_borrows where day = today and friend_id = p_friend;
  if lent <= {{buddy.perDay}} then
    insert into hb_grants(user_id, kind, amount, note) values (p_friend, 'stones', {{buddy.stones}}, mynick || '님이 내 희수를 데려갔어요');
  end if;
  return jsonb_build_object('ok', true, 'nickname', f.nickname, 'snap', f.snap, 'power', f.power);
end $function$
