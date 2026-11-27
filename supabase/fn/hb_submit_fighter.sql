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
  for k, v in select t.key, t.lim from (values ('lv', {{snapMax.lv}}), ('aw', {{snapMax.aw}}), ('enh', {{snapMax.enh}}), ('tenh', {{snapMax.tenh}}), ('cleared', {{snapMax.cleared}}), ('hp', {{snapMax.hp}}), ('atk', {{snapMax.atk}}), ('def', {{snapMax.def}}),
      ('crit', {{snapMax.crit}}), ('critMul', {{snapMax.critMul}}), ('spd', {{snapMax.spd}}), ('boriMul', {{snapMax.boriMul}}), ('skm', {{snapMax.skm}}), ('infBest', {{snapMax.infBest}})) t(key, lim) loop
    if p_snap ? k and (jsonb_typeof(p_snap->k) <> 'number' or (p_snap->>k)::numeric < 0 or (p_snap->>k)::numeric > v) then bad := k; exit; end if;
  end loop;
  if bad is null and (jsonb_typeof(p_snap->'lv') is distinct from 'number' or (p_snap->>'lv')::numeric < 1 or jsonb_typeof(p_snap->'atk') is distinct from 'number'
      or jsonb_typeof(p_snap->'hp') is distinct from 'number' or jsonb_typeof(p_snap->'def') is distinct from 'number') then bad := 'required'; end if;
  if bad is null and (p_snap->>'lv')::numeric < {{snapMax.lv}} and coalesce((p_snap->>'aw')::numeric, 0) > 0 then bad := 'aw-before-50'; end if;
  if bad is null and jsonb_typeof(coalesce(p_snap->'sk', '{}'::jsonb)) <> 'object' then bad := 'sk'; end if;
  if bad is null then
    for k in select e.key from jsonb_each(coalesce(p_snap->'sk', '{}'::jsonb)) e where jsonb_typeof(e.value) <> 'number' or (e.value)::text::numeric < 0 or (e.value)::text::numeric > {{snapMax.sk}} loop
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
end $function$
