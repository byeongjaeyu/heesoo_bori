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
    if public.hb_save_num(p_data, 'lv') > {{save.lv}} then why := 'lv';
    elsif maxenh > {{save.enh}} then why := 'enh';
    elsif public.hb_save_num(p_data, 'gold') < 0 or public.hb_save_num(p_data, 'stones') < 0 then why := 'neg';
    end if;
    if why is null and prev.data is not null then
      h := least({{save.h}}, greatest(0, extract(epoch from (now() - prev.updated_at)) / 3600));
      for g in select kind, sum(amount) s, max(amount) m, count(*) n from public.hb_grants where user_id = u and claimed_at > prev.updated_at - interval '5 minutes' group by kind loop
        if g.kind = 'gold' then gG := g.s; elsif g.kind = 'stones' then gS := g.s; elsif g.kind = 'auto' then gA := g.s;
        elsif g.kind = 'awaken' then gW := g.m; elsif g.kind = 'stage' then gL := ceil(g.m / 4.0); elsif g.kind = 'items' then gI := g.n * 7; end if;
      end loop;
      select coalesce(sum(amount) filter (where kind = 'gold'), 0), coalesce(sum(amount) filter (where kind = 'stones'), 0) into dG, dS
        from public.hb_escrow where owner = u and created_at >= prev.updated_at;
      if public.hb_save_num(p_data, 'gold') - public.hb_save_num(prev.data, 'gold') > {{save.gold.0}} + {{save.gold.1}} * h + gG - dG then why := 'gold';
      elsif public.hb_save_num(p_data, 'stones') - public.hb_save_num(prev.data, 'stones') > {{save.stones.0}} + {{save.stones.1}} * h + gS - dS then why := 'stones';
      elsif public.hb_save_num(p_data, 'aw') - greatest(public.hb_save_num(prev.data, 'aw'), gW) > {{save.aw.0}} + {{save.aw.1}} * h then why := 'aw';
      elsif public.hb_save_loops(p_data) - public.hb_save_loops(prev.data) > {{save.loops.0}} + {{save.loops.1}} * h + gL then why := 'loops';
      elsif public.hb_save_num(p_data, 'autoBonus') - public.hb_save_num(prev.data, 'autoBonus') > {{save.auto.0}} + {{save.auto.1}} * h + gA then why := 'auto';
      end if;
    elsif why is null then
      if public.hb_save_num(p_data, 'gold') > {{save.first.gold}} or public.hb_save_num(p_data, 'stones') > {{save.first.stones}} or public.hb_save_num(p_data, 'aw') > {{save.first.aw}} then why := 'first'; end if;
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
      if why is null and nNew > {{save.items.0}} + {{save.items.1}} * h + gI then why := 'items'; end if;
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
end $function$
