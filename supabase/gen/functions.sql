-- 자동 생성 파일 — 고치지 말 것. 원본: supabase/fn/*.sql + src/core/rules.js → `npm run sql`
-- 운영 DB 에 이 파일 전체를 실행하면 아래 함수들이 rules.js 값으로 바뀜.

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
    v_fee := floor(a.bid * 0.05);
    perform public.hb_escrow_settle(a.item_escrow, a.bidder, '경매 낙찰');
    update public.hb_escrow set state = 'released', to_user = a.seller, closed_at = now() where id = a.bid_escrow and state = 'held';
    insert into public.hb_grants (user_id, kind, amount, note) values (a.seller, 'gold', a.bid - v_fee, '경매 판매 대금 (수수료 5% 제외)');
    insert into public.hb_ledger (user_id, kind, amount, escrow, reason) values (a.seller, 'gold', a.bid - v_fee, a.bid_escrow, '경매 판매'), (null, 'gold', v_fee, a.bid_escrow, 'auction_fee');
    update public.hb_auctions set state = 'sold', price = a.bid, fee = v_fee, closed_at = now() where id = a.id;
  else
    perform public.hb_escrow_settle(a.item_escrow, null, '경매 유찰 반환');
    update public.hb_auctions set state = 'expired', closed_at = now() where id = a.id;
  end if;
  return true;
end $function$;

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
  if p_hours not in (12, 24, 48) then return jsonb_build_object('ok', false, 'reason', 'hours'); end if;
  if p_start is null or p_start < 1000 or p_start > 2000000000 or (p_buyout is not null and (p_buyout < p_start or p_buyout > 2000000000)) then
    return jsonb_build_object('ok', false, 'reason', 'price'); end if;
  if (select count(*) from public.hb_auctions where seller = u and state = 'open') >= 10 then return jsonb_build_object('ok', false, 'reason', 'too_many'); end if;
  r := public.hb_escrow_put('item', 0, p_key, 'auction');
  if not coalesce((r ->> 'ok')::boolean, false) then return r; end if;
  eid := (r ->> 'id')::uuid;
  select i.* into it from public.hb_items i join public.hb_escrow e on e.item = i.id where e.id = eid;
  select * into d from public.hb_item_defs where id = it.def;
  insert into public.hb_auctions (seller, item, item_escrow, def, rar, slot, enh, ilv, ref, start_price, buyout, ends_at)
    values (u, it.id, eid, it.def, d.rar, d.slot, it.enh, it.ilv, it.ref, p_start, p_buyout, now() + make_interval(hours => p_hours)) returning id into aid;
  update public.hb_escrow set ref = 'auc:' || aid where id = eid;
  return jsonb_build_object('ok', true, 'id', aid);
end $function$;

CREATE OR REPLACE FUNCTION public.hb_auc_min(a hb_auctions)
 RETURNS bigint
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case when a.bid is null then a.start_price else a.bid + greatest(1, ceil(a.bid * 0.05))::bigint end $function$;

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
  if lent <= 10 then
    insert into hb_grants(user_id, kind, amount, note) values (p_friend, 'stones', 3, mynick || '님이 내 희수를 데려갔어요');
  end if;
  return jsonb_build_object('ok', true, 'nickname', f.nickname, 'snap', f.snap, 'power', f.power);
end $function$;

CREATE OR REPLACE FUNCTION public.hb_power(s jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare sk jsonb := coalesce(s->'sk', '{}'::jsonb);
begin
  return round(
      (s->>'atk')::numeric * 4 + (s->>'hp')::numeric * 0.5 + (s->>'def')::numeric * 6 + (s->>'crit')::numeric * 300
    + greatest(0, (s->>'spd')::numeric - 1) * 150
    + case when coalesce((s->>'bori')::boolean, false) then 50 + (coalesce((s->>'boriMul')::numeric, 1) - 1) * 300 else 0 end
    + (coalesce((sk->>'smash')::numeric, 0) + coalesce((sk->>'nag')::numeric, 0) + coalesce((sk->>'flash')::numeric, 0) + coalesce((sk->>'fist')::numeric, 0)) * 12
    + coalesce((sk->>'menhera')::numeric, 0) * 40
    + (coalesce((s->>'skm')::numeric, 1) - 1) * 600)::integer;
end $function$;

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
    'ends_at', ((r.week::date + 7)::timestamp at time zone 'Asia/Seoul'), 'max_tries', 3, 'participants', cnt, 'top', top,
    'my', jsonb_build_object('damage', coalesce(my.damage, 0), 'tries_today', case when my.day = today then my.day_tries else 0 end));
end $function$;

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
  cap := coalesce(pw, 0)::bigint * 250 + 50000;
  d := least(greatest(coalesce(p_damage, 0), 0), cap);
  if p_damage > cap then insert into hb_flags(user_id, kind, detail) values (me, 'raid_cap', jsonb_build_object('sent', p_damage, 'cap', cap, 'power', pw)); end if;
  update hb_raid_hits set damage = damage + d, open_at = null, last_at = now() where week = h.week and user_id = me returning damage into tot;
  update hb_raid set hp = greatest(0, hp - d), killed_at = coalesce(killed_at, case when hp - d <= 0 then now() end) where week = h.week;
  return jsonb_build_object('ok', true, 'damage', d, 'total', tot, 'capped', p_damage > cap, 'info', hb_raid_info());
end $function$;

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
        insert into hb_grants(user_id, kind, amount, note) values (h.user_id, 'stones', 40, '지난 주 월드 보스 처치 보상'), (h.user_id, 'gold', 500000, '지난 주 월드 보스 처치 보상');
        if h.rk = 1 then insert into hb_grants(user_id, kind, amount, note) values (h.user_id, 'stones', 100, '지난 주 월드 보스 피해량 1위 보상'), (h.user_id, 'gold', 1500000, '지난 주 월드 보스 피해량 1위 보상');
        elsif h.rk <= 3 then insert into hb_grants(user_id, kind, amount, note) values (h.user_id, 'stones', 60, '지난 주 월드 보스 피해량 ' || h.rk || '위 보상'), (h.user_id, 'gold', 800000, '지난 주 월드 보스 피해량 ' || h.rk || '위 보상');
        end if;
      else
        insert into hb_grants(user_id, kind, amount, note) values (h.user_id, 'stones', 15, '지난 주 월드 보스 참가 보상');
      end if;
      n := n + 1;
    end loop;
    update hb_raid set settled_at = now() where week = r.week;
  end loop;
  return n;
end $function$;

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
  if h.day_tries >= 3 then return jsonb_build_object('ok', false, 'reason', 'tries'); end if;
  update hb_raid_hits set day = today, day_tries = h.day_tries + 1, tries = tries + 1, open_at = now() where week = r.week and user_id = me;
  return jsonb_build_object('ok', true, 'info', hb_raid_info());
end $function$;

CREATE OR REPLACE FUNCTION public.hb_save_push(p_data jsonb, p_ep2 jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare u uuid := auth.uid(); prev public.hb_saves; h numeric := 0; g record; why text := null; maxenh numeric := 0;
  gG numeric := 0; gS numeric := 0; gA numeric := 0; gW numeric := 0; gL numeric := 0; gI numeric := 0; dG numeric := 0; dS numeric := 0;
  k text; d record; nNew int := 0; newKeys text[] := '{}';
begin
  if u is null then raise exception 'hb:auth'; end if;
  if p_data is null and p_ep2 is null then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;
  select * into prev from public.hb_saves where user_id = u for update;
  if p_data is not null then
    select coalesce(max(case when jsonb_typeof(value) = 'number' then value::text::numeric else 0 end), 0) into maxenh from jsonb_each(coalesce(p_data -> 'enh', '{}'::jsonb));
    if public.hb_save_num(p_data, 'lv') > 50 then why := 'lv';
    elsif maxenh > 30 then why := 'enh';
    elsif public.hb_save_num(p_data, 'gold') < 0 or public.hb_save_num(p_data, 'stones') < 0 then why := 'neg';
    end if;
    if why is null and prev.data is not null then
      h := least(24, greatest(0, extract(epoch from (now() - prev.updated_at)) / 3600));
      for g in select kind, sum(amount) s, max(amount) m, count(*) n from public.hb_grants where user_id = u and claimed_at > prev.updated_at - interval '5 minutes' group by kind loop
        if g.kind = 'gold' then gG := g.s; elsif g.kind = 'stones' then gS := g.s; elsif g.kind = 'auto' then gA := g.s;
        elsif g.kind = 'awaken' then gW := g.m; elsif g.kind = 'stage' then gL := ceil(g.m / 4.0); elsif g.kind = 'items' then gI := g.n * 7; end if;
      end loop;
      select coalesce(sum(amount) filter (where kind = 'gold'), 0), coalesce(sum(amount) filter (where kind = 'stones'), 0) into dG, dS
        from public.hb_escrow where owner = u and created_at >= prev.updated_at;
      if public.hb_save_num(p_data, 'gold') - public.hb_save_num(prev.data, 'gold') > 50000000 + 30000000 * h + gG - dG then why := 'gold';
      elsif public.hb_save_num(p_data, 'stones') - public.hb_save_num(prev.data, 'stones') > 5000 + 1500 * h + gS - dS then why := 'stones';
      elsif public.hb_save_num(p_data, 'aw') - greatest(public.hb_save_num(prev.data, 'aw'), gW) > 30 + 15 * h then why := 'aw';
      elsif public.hb_save_loops(p_data) - public.hb_save_loops(prev.data) > 5 + 15 * h + gL then why := 'loops';
      elsif public.hb_save_num(p_data, 'autoBonus') - public.hb_save_num(prev.data, 'autoBonus') > 43200 + 7200 * h + gA then why := 'auto';
      end if;
    elsif why is null then
      if public.hb_save_num(p_data, 'gold') > 1000000000 or public.hb_save_num(p_data, 'stones') > 100000 or public.hb_save_num(p_data, 'aw') > 3000 then why := 'first'; end if;
    end if;
    if why is null then
      for k in select jsonb_object_keys(coalesce(p_data -> 'inv', '{}'::jsonb)) loop
        select x.rar, x.tradable into d from public.hb_item_defs x where x.id = split_part(k, '#', 1);
        continue when not found or not d.tradable;
        if exists (select 1 from public.hb_item_gone x where x.user_id = u and x.okey = k) then why := 'item_gone'; exit; end if;
        if exists (select 1 from public.hb_items i where i.owner = u and i.okey = k and i.state = 'escrow') then why := 'escrow'; exit; end if;
        if not exists (select 1 from public.hb_items i where i.owner = u and i.okey = k and i.state in ('own', 'deliver')) then
          newKeys := newKeys || k; if d.rar >= 4 then nNew := nNew + 1; end if;
        end if;
      end loop;
      if why is null and nNew > 6 + 3 * h + gI then why := 'items'; end if;
    end if;
    if why is not null then
      insert into public.hb_flags (user_id, kind, detail) values (u, 'save_reject', jsonb_build_object('why', why, 'h', round(coalesce(h, -1), 2), 'new_items', nNew,
        'gold', jsonb_build_array(public.hb_save_num(prev.data, 'gold'), public.hb_save_num(p_data, 'gold')), 'stones', jsonb_build_array(public.hb_save_num(prev.data, 'stones'), public.hb_save_num(p_data, 'stones')),
        'aw', jsonb_build_array(public.hb_save_num(prev.data, 'aw'), public.hb_save_num(p_data, 'aw')), 'lv', public.hb_save_num(p_data, 'lv'), 'enh', maxenh));
      return jsonb_build_object('ok', false, 'reason', why, 'data', prev.data, 'ep2', prev.ep2);
    end if;
  end if;
  insert into public.hb_saves (user_id, data, ep2, updated_at) values (u, p_data, p_ep2, now())
  on conflict (user_id) do update set data = coalesce(excluded.data, public.hb_saves.data), ep2 = coalesce(excluded.ep2, public.hb_saves.ep2), updated_at = now();
  if p_data is not null then
    insert into public.hb_items (owner, okey, def, src) select u, x, split_part(x, '#', 1), 'save' from unnest(newKeys) x on conflict do nothing;
    update public.hb_items i set state = 'own', updated_at = now() where i.owner = u and i.state = 'deliver' and (p_data -> 'inv') ? i.okey;
    update public.hb_items i set enh = public.hb_save_num(p_data -> 'enh', i.okey)::int, ilv = public.hb_save_num(p_data -> 'ilv', i.okey)::int,
      iexp = public.hb_save_num(p_data -> 'iexp', i.okey)::int, ref = p_data -> 'ref' -> i.okey, updated_at = now()
      where i.owner = u and i.state = 'own' and (p_data -> 'inv') ? i.okey;
    update public.hb_items i set state = 'gone', okey = null, updated_at = now()
      where i.owner = u and i.state = 'own' and not ((p_data -> 'inv') ? i.okey) and i.updated_at < now() - interval '10 minutes';
  end if;
  return jsonb_build_object('ok', true);
end $function$;

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
    rw := case when r.rk = 1 then '강화석 150 · 300만G · 자동사냥 3시간' when r.rk = 2 then '강화석 100 · 200만G · 자동사냥 2시간' when r.rk = 3 then '강화석 70 · 100만G · 자동사냥 1시간' when r.rk <= 10 then '강화석 30 · 30만G' else '강화석 10' end;
    insert into hb_season_results(season, rank, user_id, nickname, rating, wins, losses, power, reward)
      values (cur, r.rk, r.user_id, r.nickname, r.rating, r.wins, r.losses, r.power, rw) on conflict do nothing;
    insert into hb_grants(user_id, kind, amount, note) values
      (r.user_id, 'stones', case when r.rk = 1 then 150 when r.rk = 2 then 100 when r.rk = 3 then 70 when r.rk <= 10 then 30 else 10 end, '지난 주 PvP 시즌 ' || r.rk || '위 보상');
    if r.rk <= 10 then
      insert into hb_grants(user_id, kind, amount, note) values
        (r.user_id, 'gold', case when r.rk = 1 then 3000000 when r.rk = 2 then 2000000 when r.rk = 3 then 1000000 else 300000 end, '지난 주 PvP 시즌 ' || r.rk || '위 보상');
    end if;
    if r.rk <= 3 then
      insert into hb_grants(user_id, kind, amount, note) values
        (r.user_id, 'auto', case when r.rk = 1 then 10800 when r.rk = 2 then 7200 else 3600 end, '지난 주 PvP 시즌 ' || r.rk || '위 보상');
    end if;
  end loop;

  update hb_fighters set rating = 1000, wins = 0, losses = 0 where rating <> 1000 or wins <> 0 or losses <> 0;
  update hb_meta set value = nowk where key = 'season';
  return 'rolled:' || cur || ':' || n;
end $function$;

CREATE OR REPLACE FUNCTION public.hb_submit_fighter(p_snap jsonb, p_nick text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare me uuid := auth.uid(); old record; pw integer; v_sid text := nullif(p_snap->>'sid', ''); bad text := null; k text; v numeric;
begin
  if me is null then raise exception 'not signed in'; end if;
  if jsonb_typeof(p_snap) <> 'object' or octet_length(p_snap::text) > 20000 then return jsonb_build_object('ok', false, 'reason', 'invalid', 'field', 'snap'); end if;
  for k, v in select t.key, t.lim from (values ('lv', 50), ('aw', 5000), ('enh', 30), ('tenh', 30), ('cleared', 100000), ('hp', 2000000), ('atk', 200000), ('def', 200000),
      ('crit', 1), ('critMul', 10), ('spd', 5), ('boriMul', 200), ('skm', 200), ('infBest', 1000000)) t(key, lim) loop
    if p_snap ? k and (jsonb_typeof(p_snap->k) <> 'number' or (p_snap->>k)::numeric < 0 or (p_snap->>k)::numeric > v) then bad := k; exit; end if;
  end loop;
  if bad is null and (jsonb_typeof(p_snap->'lv') is distinct from 'number' or (p_snap->>'lv')::numeric < 1 or jsonb_typeof(p_snap->'atk') is distinct from 'number'
      or jsonb_typeof(p_snap->'hp') is distinct from 'number' or jsonb_typeof(p_snap->'def') is distinct from 'number') then bad := 'required'; end if;
  if bad is null and (p_snap->>'lv')::numeric < 50 and coalesce((p_snap->>'aw')::numeric, 0) > 0 then bad := 'aw-before-50'; end if;
  if bad is null and jsonb_typeof(coalesce(p_snap->'sk', '{}'::jsonb)) <> 'object' then bad := 'sk'; end if;
  if bad is null then
    for k in select e.key from jsonb_each(coalesce(p_snap->'sk', '{}'::jsonb)) e where jsonb_typeof(e.value) <> 'number' or (e.value)::text::numeric < 0 or (e.value)::text::numeric > 10 loop
      bad := 'sk.' || k; exit;
    end loop;
  end if;
  if bad is not null then
    insert into hb_flags(user_id, kind, detail) values (me, 'rejected', jsonb_build_object('field', bad, 'snap', p_snap));
    return jsonb_build_object('ok', false, 'reason', 'invalid', 'field', bad);
  end if;

  if v_sid is not null and exists (select 1 from hb_fighters f where f.sid = v_sid and f.user_id <> me) then
    return jsonb_build_object('ok', false, 'reason', 'moved');
  end if;

  pw := hb_power(p_snap);
  select * into old from hb_fighters f where f.user_id = me;
  if not found then
    if p_nick is null then return jsonb_build_object('ok', false, 'reason', 'nickname'); end if;
    insert into hb_fighters(user_id, nickname, snap, power, sid) values (me, trim(p_nick), p_snap, pw, v_sid);
  else
    if old.updated_at > now() - interval '1 hour' and pw > old.power * 2 + 1000 then
      insert into hb_flags(user_id, kind, detail) values (me, 'jump', jsonb_build_object('from', old.power, 'to', pw, 'nick', old.nickname));
    end if;
    update hb_fighters f set snap = p_snap, power = pw, sid = coalesce(f.sid, v_sid),
      nickname = coalesce(nullif(trim(p_nick), ''), old.nickname) where f.user_id = me;
  end if;
  return jsonb_build_object('ok', true, 'power', pw);
end $function$;

CREATE OR REPLACE FUNCTION public.hb_xchg_ok(u uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select case
    when not exists (select 1 from public.hb_fighters f where f.user_id = u and not coalesce(f.hidden, false)) then 'nick'
    when coalesce((select public.hb_save_num(s.data, 'lv') from public.hb_saves s where s.user_id = u), 0) < 30 then 'lv'
    when not exists (select 1 from auth.identities i where i.user_id = u and i.provider in ('google', 'kakao')) then 'link'
    else null end $function$;

CREATE OR REPLACE FUNCTION public.hb_xchg_pay(p_esc uuid, p_to uuid, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare e public.hb_escrow; v_fee bigint;
begin
  select * into e from public.hb_escrow where id = p_esc and state = 'held' for update;
  if not found then return; end if;
  if e.kind = 'item' then perform public.hb_escrow_settle(e.id, p_to, p_reason); return; end if;
  v_fee := case when e.kind = 'gold' then floor(e.amount * 0.05) else 0 end;
  update public.hb_escrow set state = 'released', to_user = p_to, closed_at = now() where id = e.id;
  insert into public.hb_grants (user_id, kind, amount, note) values (p_to, e.kind, e.amount - v_fee, p_reason || case when v_fee > 0 then ' (수수료 5% 제외)' else '' end);
  insert into public.hb_ledger (user_id, kind, amount, escrow, reason) values (p_to, e.kind, e.amount - v_fee, e.id, p_reason);
  if v_fee > 0 then insert into public.hb_ledger (user_id, kind, amount, escrow, reason) values (null, e.kind, v_fee, e.id, 'trade_fee'); end if;
end $function$;

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
  if cardinality(give) > 5 or cardinality(want) > 5 then return jsonb_build_object('ok', false, 'reason', 'too_many_items'); end if;
  if g < 0 or wg < 0 or g > 2000000000 or wg > 2000000000 or g between 1 and 99 or wg between 1 and 99 then return jsonb_build_object('ok', false, 'reason', 'gold'); end if;
  if (cardinality(give) = 0 and g = 0) or (cardinality(want) = 0 and wg = 0) then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;
  if cardinality(give) + cardinality(want) = 0 then return jsonb_build_object('ok', false, 'reason', 'no_item'); end if;
  if exists (select 1 from unnest(want) w where not exists (select 1 from public.hb_items i join public.hb_item_defs d on d.id = i.def
      where i.id = w and i.owner = b and i.state = 'own' and d.tradable)) then return jsonb_build_object('ok', false, 'reason', 'want_item'); end if;
  if (select count(*) from public.hb_trades where a = u and state = 'open') >= 10 then return jsonb_build_object('ok', false, 'reason', 'too_many'); end if;
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
end $function$;
