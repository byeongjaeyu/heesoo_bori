CREATE OR REPLACE FUNCTION public.hb_xchg_ok(u uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select case
    when not exists (select 1 from public.hb_fighters f where f.user_id = u and not coalesce(f.hidden, false)) then 'nick'
    when coalesce((select public.hb_save_num(s.data, 'lv') from public.hb_saves s where s.user_id = u), 0) < {{xchg.lv}} then 'lv'
    when not exists (select 1 from auth.identities i where i.user_id = u and i.provider in ('google', 'kakao')) then 'link'
    else null end $function$
