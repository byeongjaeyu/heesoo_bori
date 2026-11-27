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
  v_fee := case when e.kind = 'gold' then floor(e.amount * {{xchg.fee}}) else 0 end;
  update public.hb_escrow set state = 'released', to_user = p_to, closed_at = now() where id = e.id;
  insert into public.hb_grants (user_id, kind, amount, note) values (p_to, e.kind, e.amount - v_fee, p_reason || case when v_fee > 0 then ' (수수료 {{pct xchg.fee}}% 제외)' else '' end);
  insert into public.hb_ledger (user_id, kind, amount, escrow, reason) values (p_to, e.kind, e.amount - v_fee, e.id, p_reason);
  if v_fee > 0 then insert into public.hb_ledger (user_id, kind, amount, escrow, reason) values (null, e.kind, v_fee, e.id, 'trade_fee'); end if;
end $function$
