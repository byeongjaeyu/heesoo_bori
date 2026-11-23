-- ===================== 경매장 (거래 기반 supabase/trade.sql 위) =====================
-- 장비(전설↑·거래 가능)를 시작가·즉시 구매가(선택)·기간(12/24/48시간)으로 올림 → 다른 희수가 골드로 입찰(최소 5%씩 올림) 또는 즉시 구매.
-- 올린 장비와 입찰 골드는 모두 서버 보관(hb_escrow). 밀린 입찰 골드는 바로 선물함으로 반환.
-- 마감: 최고 입찰자에게 장비(받을 장비), 판매자에게 골드 - 수수료 5%(선물함, 수수료는 사라짐 = 골드 소모처). 입찰 없으면 판매자에게 장비 반환.
-- 마감 처리는 pg_cron 5분마다 + 목록·입찰을 열 때도. 랭킹에 닉네임이 등록된(숨김 아닌) 희수만 이용.
create table if not exists public.hb_auctions (
  id uuid primary key default gen_random_uuid(),
  seller uuid not null references auth.users(id) on delete cascade,
  item uuid not null references public.hb_items(id),
  item_escrow uuid not null references public.hb_escrow(id),
  def text not null, rar int not null, slot text not null, enh int not null default 0, ilv int not null default 0, ref jsonb,
  start_price bigint not null check (start_price >= 1000 and start_price <= 2000000000),
  buyout bigint check (buyout is null or (buyout >= start_price and buyout <= 2000000000)),
  bid bigint, bidder uuid references auth.users(id) on delete set null, bid_escrow uuid references public.hb_escrow(id), bids int not null default 0,
  state text not null default 'open' check (state in ('open', 'sold', 'expired', 'cancelled')),
  price bigint, fee bigint,
  created_at timestamptz not null default now(), ends_at timestamptz not null, closed_at timestamptz
);
create index if not exists hb_auctions_open on public.hb_auctions (state, ends_at);
create index if not exists hb_auctions_seller on public.hb_auctions (seller, state);
create index if not exists hb_auctions_bidder on public.hb_auctions (bidder, state);
alter table public.hb_auctions enable row level security;
revoke all on public.hb_auctions from anon, authenticated;

create or replace function public.hb_auc_ok(u uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.hb_fighters f where f.user_id = u and not coalesce(f.hidden, false)) $$;
revoke all on function public.hb_auc_ok(uuid) from public, anon, authenticated;
-- 다음 입찰 최소액
create or replace function public.hb_auc_min(a public.hb_auctions) returns bigint language sql immutable as $$
  select case when a.bid is null then a.start_price else a.bid + greatest(1, ceil(a.bid * 0.05))::bigint end $$;

-- 마감 처리 (서버 전용)
create or replace function public.hb_auc_close(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
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
end $$;
revoke all on function public.hb_auc_close(uuid) from public, anon, authenticated;
create or replace function public.hb_auc_close_due()
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in select id from public.hb_auctions where state = 'open' and ends_at <= now() order by ends_at limit 200 loop
    if public.hb_auc_close(r.id) then n := n + 1; end if;
  end loop;
  return n;
end $$;
revoke all on function public.hb_auc_close_due() from public, anon, authenticated;

-- 올리기: 장비 키·시작가·즉시 구매가(없으면 null)·기간(12/24/48)
create or replace function public.hb_auc_list(p_key text, p_start bigint, p_buyout bigint, p_hours int)
returns jsonb language plpgsql security definer set search_path = public as $$
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
end $$;
revoke all on function public.hb_auc_list(text, bigint, bigint, int) from public, anon;
grant execute on function public.hb_auc_list(text, bigint, bigint, int) to authenticated;

-- 입찰 (즉시 구매가 이상이면 즉시 구매로 처리하고 바로 마감)
create or replace function public.hb_auc_bid(p_id uuid, p_amount bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); a public.hb_auctions; amt bigint := p_amount; mn bigint; buy boolean := false; r jsonb; eid uuid;
begin
  if u is null then raise exception 'hb:auth'; end if;
  if not public.hb_auc_ok(u) then return jsonb_build_object('ok', false, 'reason', 'nick'); end if;
  perform public.hb_auc_close_due();
  select * into a from public.hb_auctions where id = p_id for update;
  if not found or a.state <> 'open' or a.ends_at <= now() then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;
  if a.seller = u then return jsonb_build_object('ok', false, 'reason', 'own'); end if;
  if a.bidder = u then return jsonb_build_object('ok', false, 'reason', 'top'); end if;
  if a.buyout is not null and amt >= a.buyout then amt := a.buyout; buy := true; end if;
  mn := public.hb_auc_min(a);
  if not buy and (amt is null or amt < mn) then return jsonb_build_object('ok', false, 'reason', 'low', 'min', mn); end if;
  r := public.hb_escrow_put('gold', amt, null, 'auc:' || a.id);
  if not coalesce((r ->> 'ok')::boolean, false) then return r; end if;
  eid := (r ->> 'id')::uuid;
  if a.bid_escrow is not null then perform public.hb_escrow_settle(a.bid_escrow, null, '경매 입찰 밀림 반환'); end if;
  update public.hb_auctions set bid = amt, bidder = u, bid_escrow = eid, bids = bids + 1,
    ends_at = greatest(ends_at, now() + interval '1 minute') where id = a.id;  -- 마감 직전 입찰이면 1분 연장
  if buy then perform public.hb_auc_close(a.id); end if;
  return jsonb_build_object('ok', true, 'bought', buy, 'bid', amt);
end $$;
revoke all on function public.hb_auc_bid(uuid, bigint) from public, anon;
grant execute on function public.hb_auc_bid(uuid, bigint) to authenticated;

-- 올린 사람이 취소 (입찰이 없을 때만) → 장비는 받을 장비로 돌아옴
create or replace function public.hb_auc_cancel(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.hb_auctions;
begin
  if auth.uid() is null then raise exception 'hb:auth'; end if;
  select * into a from public.hb_auctions where id = p_id and seller = auth.uid() for update;
  if not found or a.state <> 'open' then return jsonb_build_object('ok', false, 'reason', 'closed'); end if;
  if a.bids > 0 then return jsonb_build_object('ok', false, 'reason', 'has_bids'); end if;
  perform public.hb_escrow_settle(a.item_escrow, null, '경매 취소 반환');
  update public.hb_auctions set state = 'cancelled', closed_at = now() where id = a.id;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.hb_auc_cancel(uuid) from public, anon;
grant execute on function public.hb_auc_cancel(uuid) to authenticated;

-- 둘러보기: 부위('' = 전체, 'bori' = 보리 용품)·최소 등급·정렬(end 마감 임박 | low 낮은 가격 | high 높은 가격 | new 최신)
create or replace function public.hb_auc_browse(p_slot text, p_rar int, p_sort text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); res jsonb;
begin
  perform public.hb_auc_close_due();
  select coalesce(jsonb_agg(x.j order by x.o1, x.o2), '[]'::jsonb) into res from (
    select jsonb_build_object('id', a.id, 'def', a.def, 'rar', a.rar, 'slot', a.slot, 'enh', a.enh, 'ilv', a.ilv, 'ref', a.ref,
      'start', a.start_price, 'buyout', a.buyout, 'bid', a.bid, 'bids', a.bids, 'min', public.hb_auc_min(a), 'ends', a.ends_at,
      'seller', coalesce(f.nickname, '희수'), 'mine', a.seller = u, 'top', a.bidder = u) j,
      case p_sort when 'low' then coalesce(a.bid, a.start_price) when 'high' then -coalesce(a.bid, a.start_price) when 'new' then -extract(epoch from a.created_at) else extract(epoch from a.ends_at) end o1,
      a.created_at o2
    from public.hb_auctions a left join public.hb_fighters f on f.user_id = a.seller
    where a.state = 'open' and a.ends_at > now()
      and (coalesce(p_slot, '') = '' or (p_slot = 'bori' and a.slot in ('bcloth', 'btoy')) or a.slot = p_slot)
      and a.rar >= coalesce(p_rar, 0)
    order by 2, 3 limit 60) x;
  return res;
end $$;
revoke all on function public.hb_auc_browse(text, int, text) from public, anon;
grant execute on function public.hb_auc_browse(text, int, text) to authenticated;

-- 내 경매: 판매 중·입찰 중·최근 7일 결과
create or replace function public.hb_auc_mine()
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then return '{}'::jsonb; end if;
  perform public.hb_auc_close_due();
  return jsonb_build_object(
    'selling', (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'def', a.def, 'rar', a.rar, 'enh', a.enh, 'start', a.start_price, 'buyout', a.buyout, 'bid', a.bid, 'bids', a.bids, 'ends', a.ends_at) order by a.ends_at), '[]'::jsonb)
      from public.hb_auctions a where a.seller = u and a.state = 'open'),
    'bidding', (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'def', a.def, 'rar', a.rar, 'enh', a.enh, 'bid', a.bid, 'buyout', a.buyout, 'min', public.hb_auc_min(a), 'ends', a.ends_at) order by a.ends_at), '[]'::jsonb)
      from public.hb_auctions a where a.bidder = u and a.state = 'open'),
    'done', (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'def', a.def, 'rar', a.rar, 'enh', a.enh, 'state', a.state, 'price', a.price, 'fee', a.fee, 'sold', a.seller = u, 'at', a.closed_at) order by a.closed_at desc), '[]'::jsonb)
      from (select * from public.hb_auctions a where (a.seller = u or (a.bidder = u and a.state = 'sold')) and a.state <> 'open' and a.closed_at > now() - interval '7 days' order by a.closed_at desc limit 30) a));
end $$;
revoke all on function public.hb_auc_mine() from public, anon;
grant execute on function public.hb_auc_mine() to authenticated;

select cron.schedule('hb_auc_close_due', '*/5 * * * *', 'select public.hb_auc_close_due()');
