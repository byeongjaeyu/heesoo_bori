-- ===================== 거래 기반 (돈·장비) — 거래 방식(교환·거래소·선물)은 아직 정하지 않음 =====================
-- 흐름: 내 세이브 → hb_escrow_put(맡기기: 서버 세이브에서 빼서 보관) → [거래 방식이 정해지면 그 함수가] hb_escrow_settle(넘기기)
--       → 받는 사람: 돈은 hb_grants(gold/stones) 선물함, 장비는 hb_items state 'deliver' → hb_claim_items 로 받아서 세이브에 넣고 저장하면 'own'
--       맡긴 사람이 취소하면 hb_escrow_cancel → 자기에게 같은 방식으로 돌아옴.
-- 거래 가능 장비는 서버 장비 등록부(hb_items)에 있어야 함: hb_save_push 가 세이브에 새로 생긴 거래 가능 장비를 자동 등록(생성 한도 있음).
-- 넘겨준 장비 키는 hb_item_gone(묘비)에 남아서, 기기에서 되살려 올려도 서버가 거절.

create table if not exists public.hb_item_defs (
  id text primary key, rar int not null, slot text not null, bori boolean not null default false,
  tradable boolean not null default false  -- 지금 정책: 전설(3) 이상·시작 장비 제외 (supabase/item_defs.sql 자동 생성)
);
create table if not exists public.hb_items (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  okey text,                                  -- 주인 세이브 안의 장비 키 ('starstick', 'starstick#ab12' …). 보관 중엔 null
  def text not null references public.hb_item_defs(id),
  enh int not null default 0, ilv int not null default 0, iexp int not null default 0, ref jsonb,
  state text not null default 'own' check (state in ('own', 'escrow', 'deliver', 'gone')),
  src text not null default 'save',          -- legacy(처음 등록) | save(플레이 중 생김) | trade(거래로 받음)
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists hb_items_owner_key on public.hb_items (owner, okey) where state in ('own', 'escrow', 'deliver');
create index if not exists hb_items_owner_state on public.hb_items (owner, state);
create table if not exists public.hb_item_gone (
  user_id uuid not null references auth.users(id) on delete cascade, okey text not null, at timestamptz not null default now(),
  primary key (user_id, okey)
);
create table if not exists public.hb_escrow (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('item', 'gold', 'stones')),
  item uuid references public.hb_items(id), okey text,
  amount bigint not null default 0 check (amount >= 0 and amount <= 2000000000),
  ref text,                                   -- 어느 거래에 쓰였는지 (거래 방식이 정해지면 그 쪽 id)
  state text not null default 'held' check (state in ('held', 'released', 'returned')),
  to_user uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), closed_at timestamptz
);
create index if not exists hb_escrow_owner on public.hb_escrow (owner, state);
create table if not exists public.hb_ledger (
  id bigserial primary key, at timestamptz not null default now(),
  user_id uuid, kind text not null, amount bigint not null, item uuid, escrow uuid, reason text
);
alter table public.hb_item_defs enable row level security;
alter table public.hb_items enable row level security;
alter table public.hb_item_gone enable row level security;
alter table public.hb_escrow enable row level security;
alter table public.hb_ledger enable row level security;
revoke all on public.hb_item_defs, public.hb_items, public.hb_item_gone, public.hb_escrow, public.hb_ledger from anon, authenticated;

-- 세이브 JSON 에서 장비 키 하나 지우기 (보유·강화·레벨·경험치·재련)
create or replace function public.hb_save_strip(d jsonb, k text) returns jsonb language sql immutable as $$
  select d #- array['inv', k] #- array['enh', k] #- array['ilv', k] #- array['iexp', k] #- array['ref', k] $$;
-- 받는 사람 세이브에 쓸 새 장비 키 (클라이언트 키와 겹치지 않게 '#t' + 6자리)
create or replace function public.hb_new_key(p_def text) returns text language sql volatile as $$
  select p_def || '#t' || substr(md5(random()::text || clock_timestamp()::text), 1, 6) $$;

-- ===== 세이브 업로드 (서버 검사 + 장비 등록부 동기화) =====
create or replace function public.hb_save_push(p_data jsonb, p_ep2 jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); prev public.hb_saves; h numeric := 0; g record; why text := null; maxenh numeric := 0;
  gG numeric := 0; gS numeric := 0; gA numeric := 0; gW numeric := 0; gL numeric := 0; gI numeric := 0; dG numeric := 0; dS numeric := 0;
  k text; d record; nNew int := 0; newKeys text[] := '{}';
begin
  if u is null then raise exception 'hb:auth'; end if;
  if p_data is null and p_ep2 is null then return jsonb_build_object('ok', false, 'reason', 'empty'); end if;
  select * into prev from public.hb_saves where user_id = u for update;  -- 맡기기(hb_escrow_put)와 순서 맞춤
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
      -- 지난 저장 이후 서버가 맡아간(보관) 돈: 기기에서 되살려 올리는 걸 막으려고 한도에서 뺌
      select coalesce(sum(amount) filter (where kind = 'gold'), 0), coalesce(sum(amount) filter (where kind = 'stones'), 0) into dG, dS
        from public.hb_escrow where owner = u and created_at >= prev.updated_at;
      if public.hb_save_num(p_data, 'gold') - public.hb_save_num(prev.data, 'gold') > 5e7 + 3e7 * h + gG - dG then why := 'gold';
      elsif public.hb_save_num(p_data, 'stones') - public.hb_save_num(prev.data, 'stones') > 5000 + 1500 * h + gS - dS then why := 'stones';
      elsif public.hb_save_num(p_data, 'aw') - greatest(public.hb_save_num(prev.data, 'aw'), gW) > 30 + 15 * h then why := 'aw';
      elsif public.hb_save_loops(p_data) - public.hb_save_loops(prev.data) > 5 + 15 * h + gL then why := 'loops';
      elsif public.hb_save_num(p_data, 'autoBonus') - public.hb_save_num(prev.data, 'autoBonus') > 43200 + 7200 * h + gA then why := 'auto';
      end if;
    elsif why is null then
      if public.hb_save_num(p_data, 'gold') > 1e9 or public.hb_save_num(p_data, 'stones') > 1e5 or public.hb_save_num(p_data, 'aw') > 3000 then why := 'first'; end if;
    end if;
    -- 거래 가능 장비: 넘겨준 키(묘비)·보관 중인 키가 세이브에 있으면 거절, 새로 생긴 건 등록 후보(신화↑ 생성 한도)
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
    -- 받은 장비가 세이브에 들어왔으면 확정
    update public.hb_items i set state = 'own', updated_at = now() where i.owner = u and i.state = 'deliver' and (p_data -> 'inv') ? i.okey;
    -- 강화·레벨·재련 최신값
    update public.hb_items i set enh = public.hb_save_num(p_data -> 'enh', i.okey)::int, ilv = public.hb_save_num(p_data -> 'ilv', i.okey)::int,
      iexp = public.hb_save_num(p_data -> 'iexp', i.okey)::int, ref = p_data -> 'ref' -> i.okey, updated_at = now()
      where i.owner = u and i.state = 'own' and (p_data -> 'inv') ? i.okey;
    -- 세이브에서 사라진 장비(분해·판매) → gone. 방금 바뀐 건 10분 여유
    update public.hb_items i set state = 'gone', okey = null, updated_at = now()
      where i.owner = u and i.state = 'own' and not ((p_data -> 'inv') ? i.okey) and i.updated_at < now() - interval '10 minutes';
  end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.hb_save_push(jsonb, jsonb) from public, anon;
grant execute on function public.hb_save_push(jsonb, jsonb) to authenticated;

-- ===== 맡기기: 돈(gold·stones) 또는 장비(세이브 키)를 서버 보관으로 =====
-- 클라이언트는 먼저 세이브를 올린 뒤(cloudSync) 호출하고, 성공하면 자기 세이브에서도 빼고 그 키를 다시 쓰지 않음(pd.tkeys).
create or replace function public.hb_escrow_put(p_kind text, p_amount bigint, p_key text, p_ref text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); s public.hb_saves; bal numeric; it public.hb_items; eid uuid;
begin
  if u is null then raise exception 'hb:auth'; end if;
  select * into s from public.hb_saves where user_id = u for update;
  if s.data is null then return jsonb_build_object('ok', false, 'reason', 'no_save'); end if;
  if (select count(*) from public.hb_escrow e where e.owner = u and e.state = 'held') >= 50 then return jsonb_build_object('ok', false, 'reason', 'too_many'); end if;
  if p_kind in ('gold', 'stones') then
    if p_amount is null or p_amount <= 0 or p_amount > 2000000000 then return jsonb_build_object('ok', false, 'reason', 'amount'); end if;
    bal := public.hb_save_num(s.data, p_kind);
    if bal < p_amount then return jsonb_build_object('ok', false, 'reason', 'balance'); end if;
    update public.hb_saves set data = jsonb_set(data, array[p_kind], to_jsonb(bal - p_amount)) where user_id = u;
    insert into public.hb_escrow (owner, kind, amount, ref) values (u, p_kind, p_amount, p_ref) returning id into eid;
    insert into public.hb_ledger (user_id, kind, amount, escrow, reason) values (u, p_kind, -p_amount, eid, 'escrow_put');
  elsif p_kind = 'item' then
    select i.* into it from public.hb_items i join public.hb_item_defs x on x.id = i.def
      where i.owner = u and i.okey = p_key and i.state = 'own' and x.tradable for update of i;
    if not found then return jsonb_build_object('ok', false, 'reason', 'unregistered'); end if;
    if not ((s.data -> 'inv') ? p_key) then return jsonb_build_object('ok', false, 'reason', 'missing'); end if;
    if exists (select 1 from jsonb_each_text(coalesce(s.data -> 'eq', '{}'::jsonb)) e where e.value = p_key)
      or exists (select 1 from jsonb_each_text(coalesce(s.data -> 'beq', '{}'::jsonb)) e where e.value = p_key) then
      return jsonb_build_object('ok', false, 'reason', 'equipped'); end if;
    update public.hb_items set state = 'escrow', okey = null, updated_at = now(),
      enh = public.hb_save_num(s.data -> 'enh', p_key)::int, ilv = public.hb_save_num(s.data -> 'ilv', p_key)::int,
      iexp = public.hb_save_num(s.data -> 'iexp', p_key)::int, ref = s.data -> 'ref' -> p_key where id = it.id;
    insert into public.hb_item_gone (user_id, okey) values (u, p_key) on conflict do nothing;
    update public.hb_saves set data = public.hb_save_strip(data, p_key) where user_id = u;
    insert into public.hb_escrow (owner, kind, item, okey, ref) values (u, 'item', it.id, p_key, p_ref) returning id into eid;
    insert into public.hb_ledger (user_id, kind, amount, item, escrow, reason) values (u, 'item', -1, it.id, eid, 'escrow_put');
  else
    return jsonb_build_object('ok', false, 'reason', 'kind');
  end if;
  return jsonb_build_object('ok', true, 'id', eid);
end $$;
revoke all on function public.hb_escrow_put(text, bigint, text, text) from public, anon;
grant execute on function public.hb_escrow_put(text, bigint, text, text) to authenticated;

-- ===== 넘기기 (서버 내부 전용: 거래 방식 함수·운영자만 호출) — p_to 가 null 이면 맡긴 사람에게 돌려줌 =====
create or replace function public.hb_escrow_settle(p_id uuid, p_to uuid, p_reason text)
returns boolean language plpgsql security definer set search_path = public as $$
declare e public.hb_escrow; dest uuid;
begin
  select * into e from public.hb_escrow where id = p_id and state = 'held' for update;
  if not found then return false; end if;
  dest := coalesce(p_to, e.owner);
  if e.kind in ('gold', 'stones') then
    insert into public.hb_grants (user_id, kind, amount, note) values (dest, e.kind, e.amount, coalesce(p_reason, '거래'));
  else
    update public.hb_items set owner = dest, state = 'deliver', okey = public.hb_new_key(def), src = 'trade', updated_at = now() where id = e.item;
  end if;
  update public.hb_escrow set state = case when dest = e.owner then 'returned' else 'released' end, to_user = dest, closed_at = now() where id = e.id;
  insert into public.hb_ledger (user_id, kind, amount, item, escrow, reason)
    values (dest, e.kind, case when e.kind = 'item' then 1 else e.amount end, e.item, e.id, coalesce(p_reason, 'escrow_settle'));
  return true;
end $$;
revoke all on function public.hb_escrow_settle(uuid, uuid, text) from public, anon, authenticated;

-- ===== 맡긴 사람이 취소 → 자기에게 돌아옴 =====
create or replace function public.hb_escrow_cancel(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'hb:auth'; end if;
  if not exists (select 1 from public.hb_escrow e where e.id = p_id and e.owner = auth.uid() and e.state = 'held') then
    return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  perform public.hb_escrow_settle(p_id, null, '거래 취소 반환');
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.hb_escrow_cancel(uuid) from public, anon;
grant execute on function public.hb_escrow_cancel(uuid) to authenticated;

-- ===== 내 보관 목록 / 받을 장비 =====
create or replace function public.hb_escrow_mine()
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'kind', e.kind, 'amount', e.amount, 'def', i.def, 'enh', i.enh, 'ref', e.ref, 'at', e.created_at) order by e.created_at), '[]'::jsonb)
  from public.hb_escrow e left join public.hb_items i on i.id = e.item where e.owner = auth.uid() and e.state = 'held' $$;
revoke all on function public.hb_escrow_mine() from public, anon;
grant execute on function public.hb_escrow_mine() to authenticated;
-- 받을 장비 목록 (읽기만: 세이브에 넣고 저장하면 hb_save_push 가 'own' 으로 확정 → 중간에 끊겨도 다시 받을 수 있음)
create or replace function public.hb_claim_items()
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'def', i.def, 'key', i.okey, 'enh', i.enh, 'ilv', i.ilv, 'iexp', i.iexp, 'ref', i.ref)), '[]'::jsonb)
  from public.hb_items i where i.owner = auth.uid() and i.state = 'deliver' $$;
revoke all on function public.hb_claim_items() from public, anon;
grant execute on function public.hb_claim_items() to authenticated;
