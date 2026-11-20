-- 희수 PvP 아레나 (Supabase, 익명 로그인)
-- hb_fighters: 플레이어마다 1행 (내 희수 스냅샷 + 점수)
-- hb_battles : 대결 기록 (서버 함수로만 기록)

create table if not exists public.hb_fighters (
  user_id     uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  nickname    text not null check (char_length(nickname) between 2 and 10),
  snap        jsonb not null,
  power       int  not null default 0 check (power between 0 and 10000000),
  rating      int  not null default 1000,
  wins        int  not null default 0,
  losses      int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists hb_fighters_nick_uq on public.hb_fighters (lower(nickname));
create index if not exists hb_fighters_rating_idx on public.hb_fighters (rating desc, power desc);

create table if not exists public.hb_battles (
  id               bigint generated always as identity primary key,
  attacker         uuid not null references public.hb_fighters(user_id) on delete cascade,
  defender         uuid not null references public.hb_fighters(user_id) on delete cascade,
  attacker_won     boolean not null,
  delta            int not null,
  attacker_rating  int not null,
  defender_rating  int not null,
  created_at       timestamptz not null default now()
);
create index if not exists hb_battles_attacker_idx on public.hb_battles (attacker, created_at desc);
create index if not exists hb_battles_defender_idx on public.hb_battles (defender, created_at desc);

alter table public.hb_fighters enable row level security;
alter table public.hb_battles  enable row level security;

-- 누구나(로그인한 사람, 익명 포함) 모든 희수를 볼 수 있음
drop policy if exists hb_fighters_read on public.hb_fighters;
create policy hb_fighters_read on public.hb_fighters for select to authenticated using (true);
-- 내 행만 만들고 고칠 수 있음
drop policy if exists hb_fighters_ins on public.hb_fighters;
create policy hb_fighters_ins on public.hb_fighters for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists hb_fighters_upd on public.hb_fighters;
create policy hb_fighters_upd on public.hb_fighters for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 점수·전적 컬럼은 클라이언트가 직접 못 바꾸게 컬럼 권한 제한
revoke insert, update on public.hb_fighters from anon, authenticated;
grant select on public.hb_fighters to authenticated;
grant insert (user_id, nickname, snap, power) on public.hb_fighters to authenticated;
grant update (nickname, snap, power, updated_at) on public.hb_fighters to authenticated;

-- 대결 기록: 내가 공격했거나 방어한 것만 보기, 쓰기는 함수로만
drop policy if exists hb_battles_read on public.hb_battles;
create policy hb_battles_read on public.hb_battles for select to authenticated
  using (attacker = (select auth.uid()) or defender = (select auth.uid()));
revoke insert, update, delete on public.hb_battles from anon, authenticated;
grant select on public.hb_battles to authenticated;

-- updated_at 자동 갱신
create or replace function public.hb_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists hb_fighters_touch on public.hb_fighters;
create trigger hb_fighters_touch before update on public.hb_fighters for each row execute function public.hb_touch();

-- 상대 찾기: 내 점수와 가까운 순 12명
create or replace function public.hb_opponents()
returns setof public.hb_fighters
language sql stable security invoker set search_path = '' as $$
  select f.* from public.hb_fighters f
  where f.user_id <> (select auth.uid())
  order by abs(f.rating - coalesce((select m.rating from public.hb_fighters m where m.user_id = (select auth.uid())), 1000)), random()
  limit 12;
$$;

-- 대결 결과 반영 (Elo, K=32). 같은 사람이 10초 안에 연속 보고하면 거절
create or replace function public.hb_report_battle(p_defender uuid, p_won boolean)
returns json
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  ra int; rd int; ea float8; d int; last_at timestamptz;
begin
  if me is null then raise exception 'not signed in'; end if;
  if p_defender = me then raise exception 'cannot fight yourself'; end if;
  select rating into ra from public.hb_fighters where user_id = me for update;
  if ra is null then raise exception 'register your fighter first'; end if;
  select rating into rd from public.hb_fighters where user_id = p_defender for update;
  if rd is null then raise exception 'opponent not found'; end if;
  select max(created_at) into last_at from public.hb_battles where attacker = me;
  if last_at is not null and last_at > now() - interval '10 seconds' then raise exception 'too fast'; end if;
  ea := 1.0 / (1.0 + power(10.0, (rd - ra) / 400.0));
  d := round(32 * ((case when p_won then 1 else 0 end) - ea));
  if p_won and d < 1 then d := 1; end if;
  if (not p_won) and d > -1 then d := -1; end if;
  update public.hb_fighters set rating = rating + d,
    wins = wins + (case when p_won then 1 else 0 end), losses = losses + (case when p_won then 0 else 1 end)
    where user_id = me;
  update public.hb_fighters set rating = greatest(0, rating - d) where user_id = p_defender;
  insert into public.hb_battles (attacker, defender, attacker_won, delta, attacker_rating, defender_rating)
    values (me, p_defender, p_won, d, ra + d, greatest(0, rd - d));
  return json_build_object('delta', d, 'rating', ra + d);
end $$;

revoke all on function public.hb_report_battle(uuid, boolean) from public, anon;
grant execute on function public.hb_report_battle(uuid, boolean) to authenticated;
revoke all on function public.hb_opponents() from public, anon;
grant execute on function public.hb_opponents() to authenticated;
revoke all on function public.hb_touch() from public, anon, authenticated;

-- 운영자 선물함 (자동사냥 시간·골드). 클라이언트는 hb_claim_grants()로만 받음
create table if not exists public.hb_grants (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'auto',   -- 'auto'(초) | 'gold' | 'stage'(누적 스테이지 번호, 회차당 4) | 'awaken'(목표 각성 단계)
  amount integer not null check (amount > 0),
  note text,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);
alter table public.hb_grants enable row level security;
revoke all on public.hb_grants from anon, authenticated;
-- p_kinds: 이 클라이언트가 처리할 줄 아는 선물 종류만 수령 (구버전이 모르는 선물을 먹어버리지 않게)
create or replace function public.hb_claim_grants(p_kinds text[])
returns table(kind text, amount bigint, note text)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  return query
  with c as (update public.hb_grants g set claimed_at = now() where g.user_id = auth.uid() and g.claimed_at is null and g.kind = any(p_kinds) returning g.kind, g.amount, g.note)
  select c.kind, case when c.kind = 'stage' then max(c.amount)::bigint else sum(c.amount)::bigint end, string_agg(coalesce(c.note, ''), ' / ') from c group by c.kind;
end $$;
revoke all on function public.hb_claim_grants(text[]) from public, anon;
grant execute on function public.hb_claim_grants(text[]) to authenticated;
-- 구버전 클라이언트(인자 없음)는 자동사냥·골드만 수령
create or replace function public.hb_claim_grants()
returns table(kind text, amount bigint, note text)
language sql security definer set search_path = public as $$ select * from public.hb_claim_grants(array['auto','gold']); $$;

-- ===== 클라우드 세이브 + 기기 옮기기 =====
create table if not exists public.hb_saves (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data jsonb,   -- 1탄 세이브 (SaveData)
  ep2 jsonb,    -- 2탄 세이브
  updated_at timestamptz not null default now(),
  constraint hb_saves_size check (coalesce(octet_length(data::text), 0) + coalesce(octet_length(ep2::text), 0) < 400000)
);
alter table public.hb_saves enable row level security;
revoke all on public.hb_saves from anon, authenticated;
grant select on public.hb_saves to authenticated;
grant insert (data, ep2) on public.hb_saves to authenticated;
grant update (data, ep2, updated_at) on public.hb_saves to authenticated;
create policy hb_saves_sel on public.hb_saves for select to authenticated using (user_id = auth.uid());
create policy hb_saves_ins on public.hb_saves for insert to authenticated with check (user_id = auth.uid());
create policy hb_saves_upd on public.hb_saves for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.hb_transfer_codes (code text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), expires_at timestamptz not null default now() + interval '10 minutes', used_at timestamptz, used_by uuid);
create table if not exists public.hb_transfer_tries (id bigserial primary key, user_id uuid not null, ok boolean not null, at timestamptz not null default now());
alter table public.hb_transfer_codes enable row level security;
alter table public.hb_transfer_tries enable row level security;
revoke all on public.hb_transfer_codes, public.hb_transfer_tries from anon, authenticated;
-- hb_make_transfer_code(): 8자리 코드(혼동 문자 제외), 10분, 이전 미사용 코드 무효화. 클라우드 세이브가 있어야 발급
-- hb_use_transfer_code(p_code): 10분에 5번 틀리면 잠금. 세이브 이동, 랭킹 행 복사→전투기록 이전→원래 행 삭제→닉네임 복원, 미수령 선물 이동
-- (본문은 마이그레이션 hb_cloud_save 참고: supabase 대시보드 → Database → Migrations)
