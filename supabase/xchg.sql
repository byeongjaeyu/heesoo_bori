-- ===================== 1:1 교환 (거래 기반 trade.sql 위) =====================
-- 제안 → 수락: A가 상대 닉네임·줄 것(장비 키 최대 5 + 골드)·받고 싶은 것(상대 장비 최대 5 + 골드)으로 제안하면 A의 물건은 바로 서버 보관.
-- B가 수락하면 B의 물건도 보관 후 한 번에 맞바꿈(전부 되거나 전부 안 되거나). 거절·취소·24시간 지나면 A에게 반환.
-- 골드는 받는 쪽에 수수료 5%를 떼고 선물함으로(수수료는 사라짐). 강화석은 교환 대상 아님. 장비가 한쪽에라도 하나는 있어야 함.
-- 이용 조건: 랭킹 닉네임(숨김 아님) + 서버 세이브 Lv30 이상 + 구글·카카오 연결 계정. 하루 한도 없음.
create table if not exists public.hb_trades (
  id uuid primary key default gen_random_uuid(),
  a uuid not null references auth.users(id) on delete cascade,
  b uuid not null references auth.users(id) on delete cascade,
  a_esc uuid[] not null default '{}', a_gold bigint not null default 0,
  want_items uuid[] not null default '{}', want_gold bigint not null default 0,
  b_esc uuid[] not null default '{}', msg text,
  state text not null default 'open' check (state in ('open', 'done', 'cancelled', 'declined', 'expired')),
  created_at timestamptz not null default now(), expires_at timestamptz not null default now() + interval '24 hours', closed_at timestamptz
);
create index if not exists hb_trades_b on public.hb_trades (b, state);
create index if not exists hb_trades_a on public.hb_trades (a, state);
alter table public.hb_trades enable row level security;
revoke all on public.hb_trades from anon, authenticated;

create or replace function public.hb_xchg_ok(u uuid) returns text language sql stable security definer set search_path = public, auth as $$
  select case
    when not exists (select 1 from public.hb_fighters f where f.user_id = u and not coalesce(f.hidden, false)) then 'nick'
    when coalesce((select public.hb_save_num(s.data, 'lv') from public.hb_saves s where s.user_id = u), 0) < 30 then 'lv'
    when not exists (select 1 from auth.identities i where i.user_id = u and i.provider in ('google', 'kakao')) then 'link'
    else null end $$;
revoke all on function public.hb_xchg_ok(uuid) from public, anon, authenticated;

-- 보관 하나를 넘김: 장비는 그대로, 골드는 수수료 5% 떼고 (서버 전용)
create or replace function public.hb_xchg_pay(p_esc uuid, p_to uuid, p_reason text) returns void language plpgsql security definer set search_path = public as $$
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
end $$;
revoke all on function public.hb_xchg_pay(uuid, uuid, text) from public, anon, authenticated;

-- 24시간 지난 제안 → A에게 반환 (서버 전용, cron + 목록 열 때)
create or replace function public.hb_xchg_expire_due() returns int language plpgsql security definer set search_path = public as $$
declare t record; e uuid; n int := 0;
begin
  for t in select * from public.hb_trades where state = 'open' and expires_at <= now() order by expires_at limit 200 for update skip locked loop
    foreach e in array t.a_esc loop perform public.hb_escrow_settle(e, null, '교환 기간 만료 반환'); end loop;
    update public.hb_trades set state = 'expired', closed_at = now() where id = t.id; n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.hb_xchg_expire_due() from public, anon, authenticated;

-- 상대 찾기: 닉네임 → 교환 가능 여부 + 상대가 가진 거래 가능 장비(착용 중 제외)
create or replace function public.hb_xchg_find(p_nick text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); b uuid; s jsonb;
begin
  if u is null then raise exception 'hb:auth'; end if;
  select f.user_id into b from public.hb_fighters f where f.nickname = trim(p_nick) and not coalesce(f.hidden, false);
  if b is null then return jsonb_build_object('ok', false, 'reason', 'no_user'); end if;
  if b = u then return jsonb_build_object('ok', false, 'reason', 'self'); end if;
  if public.hb_xchg_ok(b) is not null then return jsonb_build_object('ok', false, 'reason', 'partner', 'why', public.hb_xchg_ok(b)); end if;
  select data into s from public.hb_saves where user_id = b;
  return jsonb_build_object('ok', true, 'nick', trim(p_nick), 'lv', public.hb_save_num(s, 'lv'), 'items', (
    select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'def', i.def, 'rar', d.rar, 'enh', i.enh, 'ilv', i.ilv, 'ref', i.ref) order by d.rar desc, i.enh desc), '[]'::jsonb)
    from public.hb_items i join public.hb_item_defs d on d.id = i.def
    where i.owner = b and i.state = 'own' and d.tradable
      and not exists (select 1 from jsonb_each_text(coalesce(s -> 'eq', '{}'::jsonb)) x where x.value = i.okey)
      and not exists (select 1 from jsonb_each_text(coalesce(s -> 'beq', '{}'::jsonb)) x where x.value = i.okey)));
end $$;
revoke all on function public.hb_xchg_find(text) from public, anon;
grant execute on function public.hb_xchg_find(text) to authenticated;

-- 제안: 줄 장비 키·줄 골드·받고 싶은 장비(hb_items id)·받고 싶은 골드·한마디
create or replace function public.hb_xchg_propose(p_nick text, p_give text[], p_gold bigint, p_want uuid[], p_want_gold bigint, p_msg text)
returns jsonb language plpgsql security definer set search_path = public as $$
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
  begin  -- 내 물건 맡기기: 하나라도 안 되면 전부 되돌림
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
end $$;
revoke all on function public.hb_xchg_propose(text, text[], bigint, uuid[], bigint, text) from public, anon;
grant execute on function public.hb_xchg_propose(text, text[], bigint, uuid[], bigint, text) to authenticated;

-- 수락: 내(B) 물건을 맡기고 한 번에 맞바꿈
create or replace function public.hb_xchg_accept(p_id uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); t public.hb_trades; why text; r jsonb; escs uuid[] := '{}'; it public.hb_items; e uuid;
begin
  if u is null then raise exception 'hb:auth'; end if;
  perform public.hb_xchg_expire_due();
  select * into t from public.hb_trades where id = p_id and b = u for update;
  if not found or t.state <> 'open' then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;
  why := public.hb_xchg_ok(u); if why is not null then return jsonb_build_object('ok', false, 'reason', why); end if;
  begin
    foreach e in array t.want_items loop
      select * into it from public.hb_items where id = e and owner = u and state = 'own';
      if not found then raise exception 'xc:want_gone'; end if;
      r := public.hb_escrow_put('item', 0, it.okey, 'xchg:' || t.id);
      if not coalesce((r ->> 'ok')::boolean, false) then raise exception 'xc:%', r ->> 'reason'; end if;
      escs := escs || (r ->> 'id')::uuid;
    end loop;
    if t.want_gold > 0 then
      r := public.hb_escrow_put('gold', t.want_gold, null, 'xchg:' || t.id);
      if not coalesce((r ->> 'ok')::boolean, false) then raise exception 'xc:%', r ->> 'reason'; end if;
      escs := escs || (r ->> 'id')::uuid;
    end if;
  exception when others then
    if sqlerrm like 'xc:%' then return jsonb_build_object('ok', false, 'reason', substr(sqlerrm, 4)); end if; raise;
  end;
  foreach e in array t.a_esc loop perform public.hb_xchg_pay(e, t.b, '1:1 교환'); end loop;
  foreach e in array escs loop perform public.hb_xchg_pay(e, t.a, '1:1 교환'); end loop;
  update public.hb_trades set b_esc = escs, state = 'done', closed_at = now() where id = t.id;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.hb_xchg_accept(uuid) from public, anon;
grant execute on function public.hb_xchg_accept(uuid) to authenticated;

-- 취소(보낸 사람)·거절(받은 사람): 보낸 사람 물건 반환
create or replace function public.hb_xchg_cancel(p_id uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); t public.hb_trades; e uuid;
begin
  if u is null then raise exception 'hb:auth'; end if;
  select * into t from public.hb_trades where id = p_id and (a = u or b = u) for update;
  if not found or t.state <> 'open' then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;
  foreach e in array t.a_esc loop perform public.hb_escrow_settle(e, null, case when t.a = u then '교환 취소 반환' else '교환 거절 반환' end); end loop;
  update public.hb_trades set state = case when t.a = u then 'cancelled' else 'declined' end, closed_at = now() where id = t.id;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.hb_xchg_cancel(uuid) from public, anon;
grant execute on function public.hb_xchg_cancel(uuid) to authenticated;

-- 내 교환: 받은 제안·보낸 제안·최근 7일 결과 + 내 이용 조건
create or replace function public.hb_xchg_mine() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then return '{}'::jsonb; end if;
  perform public.hb_xchg_expire_due();
  return jsonb_build_object('why', public.hb_xchg_ok(u), 'list', (
    select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'dir', case when t.a = u then 'out' else 'in' end, 'state', t.state, 'msg', t.msg,
      'who', (select f.nickname from public.hb_fighters f where f.user_id = case when t.a = u then t.b else t.a end),
      'give', (select coalesce(jsonb_agg(jsonb_build_object('def', i.def, 'rar', d.rar, 'enh', i.enh, 'ilv', i.ilv, 'ref', i.ref)), '[]'::jsonb)
         from public.hb_escrow e join public.hb_items i on i.id = e.item join public.hb_item_defs d on d.id = i.def where e.id = any(t.a_esc)),
      'gold', t.a_gold,
      'want', (select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'key', case when t.b = u then i.okey end, 'def', i.def, 'rar', d.rar, 'enh', i.enh, 'ilv', i.ilv, 'ref', i.ref)), '[]'::jsonb)
         from public.hb_items i join public.hb_item_defs d on d.id = i.def where i.id = any(t.want_items)),
      'want_gold', t.want_gold, 'expires', t.expires_at, 'at', coalesce(t.closed_at, t.created_at)) order by t.created_at desc), '[]'::jsonb)
    from public.hb_trades t where (t.a = u or t.b = u) and (t.state = 'open' or t.closed_at > now() - interval '7 days')));
end $$;
revoke all on function public.hb_xchg_mine() from public, anon;
grant execute on function public.hb_xchg_mine() to authenticated;

select cron.schedule('hb_xchg_expire_due', '*/10 * * * *', 'select public.hb_xchg_expire_due()');
