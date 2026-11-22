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
  kind text not null default 'auto',   -- 'auto'(초) | 'gold' | 'stage'(누적 스테이지 번호, 회차당 4) | 'awaken'(목표 각성 단계) | 'stones' | 'level'(목표 레벨) | 'items'(등급, 5=초월 전 부위)
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

-- ===== 랭킹 조작 방지 (마이그레이션 hb_anticheat_v1, hb_submit_fighter_return_reason, hb_transfer_keep_sid) =====
-- hb_fighters.hidden: 운영자가 숨긴 희수 (본인만 보임, hb_opponents 제외)
-- hb_fighters.sid: 세이브 고유 번호 (unique). 다른 user_id 가 같은 sid 로 등록하면 'moved'
-- hb_flags: 'rejected'(범위 밖 값), 'jump'(1시간 내 전투력 2배+1000 초과) 기록
-- hb_power(snap): 전투력 공식. **src/pvp.js pvpSnap 의 power 공식과 반드시 같아야 함**
-- hb_submit_fighter(p_snap, p_nick): 클라이언트의 유일한 등록/갱신 경로. 반환 {ok, power} | {ok:false, reason: invalid|moved|nickname, field}
-- 클라이언트의 hb_fighters 직접 insert/update 권한은 회수 (revoke insert, update on hb_fighters from authenticated)

-- ===== 주간 PvP 시즌 (마이그레이션 hb_pvp_season) =====
-- hb_meta('season') = 현재 시즌 시작 월요일(KST). hb_season_results = 지난 시즌 순위 기록(공개 읽기)
-- hb_season_rollover(): 주가 바뀌었으면 1번만 정산 → 순위 기록, 보상 hb_grants(stones/gold/auto, note '지난 주 PvP 시즌 N위 보상'), 점수 1000·전적 0 리셋
--   대상: 그 주에 1판 이상(wins+losses>0) & hidden 아님. 1위 150석·300만G·3h / 2위 100·200만·2h / 3위 70·100만·1h / 4~10위 30·30만 / 그 외 10석
-- hb_season_info(): 화면용 (부를 때 필요하면 정산). pg_cron 이 매주 일 15:00 UTC(=월 0시 KST)에도 정산

-- ===== 플레이한 희수만 노출 (마이그레이션 hb_fighters_played) =====
-- hb_fighters.played = (snap.lv > 1) or (wins + losses > 0)  (generated stored). 랭킹·PvP 목록·hb_opponents 는 played 만

-- ===== 월드 보스 레이드 (마이그레이션 hb_world_boss_raid) =====
-- hb_raid(week, boss, max_hp, hp, killed_at, settled_at) / hb_raid_hits(week, user_id, damage, day_tries, open_at)
-- hb_raid_ensure(): 주간 보스 생성. HP = 최근 14일 활동 희수 Σ 0.376 × 전투력^1.905 (최소 100만) — 실측 1회 피해 ≈ 0.0358 × 전투력^1.905
-- hb_raid_start(): 하루 3회(입장 시 차감, 랭킹 등록 필요) / hb_raid_report(dmg): 3분 내 1회, 상한 전투력×250+5만(넘으면 hb_flags 'raid_cap')
-- hb_raid_settle(): 월요일 0시(cron 1 15 * * 0 UTC) + hb_raid_info 호출 시. 처치: 참가자 강화석 40·50만G, 1위 +100·150만, 2~3위 +60·80만 / 실패: 참가 15석

-- 친구 희수 데려가기 (migration hb_buddy_borrow)
-- hb_borrows(day text KST, user_id, friend_id, at) pk(day,user_id), RLS on, 직접 접근 없음
-- hb_borrow_friend(p_friend uuid) security definer: 등록자만, 자기/숨김/미플레이 불가, 하루 1번,
--   빌려준 사람에게 hb_grants stones 3 '○○님이 내 희수를 데려갔어요' (하루 10번까지). 반환 {ok, nickname, snap, power}

-- ===== 온라인 광장 (2026-11-22) =====
-- 비공개 Realtime 채널 'plaza-*' (클라이언트 src/plaza.js). 운영자 차단: insert into hb_plaza_bans(user_id, reason) ...
create table if not exists public.hb_plaza_bans (user_id uuid primary key, reason text, at timestamptz not null default now());
alter table public.hb_plaza_bans enable row level security;
create table if not exists public.hb_plaza_reports (id bigserial primary key, reporter uuid not null, target uuid, target_nick text, msgs text, at timestamptz not null default now());
alter table public.hb_plaza_reports enable row level security;
create or replace function public.hb_plaza_ok() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from hb_fighters f where f.user_id = auth.uid() and not f.hidden)
     and not exists (select 1 from hb_plaza_bans b where b.user_id = auth.uid()); $$;
grant execute on function public.hb_plaza_ok() to authenticated;
create or replace function public.hb_plaza_report(p_target uuid, p_nick text, p_msgs text) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if (select count(*) from hb_plaza_reports where reporter = auth.uid() and at > now() - interval '1 hour') >= 10 then return false; end if;
  insert into hb_plaza_reports(reporter, target, target_nick, msgs) values (auth.uid(), p_target, left(p_nick, 40), left(p_msgs, 2000));
  return true;
end $$;
grant execute on function public.hb_plaza_report(uuid, text, text) to authenticated;
create policy hb_plaza_read on realtime.messages for select to authenticated using (realtime.topic() like 'plaza-%' and public.hb_plaza_ok());
create policy hb_plaza_write on realtime.messages for insert to authenticated with check (realtime.topic() like 'plaza-%' and public.hb_plaza_ok());
-- 2026-11-22 광장 자동 정지: hb_plaza_bans.until 추가, hb_plaza_ok()는 until 지난 정지 무시, hb_plaza_status(), hb_plaza_report()에서 24시간 내 신고자 3명 이상이면 24시간 정지 (마이그레이션 hb_plaza_autoban)
-- 2026-11-22 한계 돌파(+26~+30): hb_submit_fighter 범위 검사 enh·tenh 상한 25 → 30 (마이그레이션 hb_submit_fighter_enh30)
