CREATE OR REPLACE FUNCTION public.hb_power(s jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare sk jsonb := coalesce(s->'sk', '{}'::jsonb);
begin
  return round(
      (s->>'atk')::numeric * {{power.atk}} + (s->>'hp')::numeric * {{power.hp}} + (s->>'def')::numeric * {{power.def}} + (s->>'crit')::numeric * {{power.crit}}
    + greatest(0, (s->>'spd')::numeric - 1) * {{power.spd}}
    + case when coalesce((s->>'bori')::boolean, false) then {{power.bori}} + (coalesce((s->>'boriMul')::numeric, 1) - 1) * {{power.boriMul}} else 0 end
    + (coalesce((sk->>'smash')::numeric, 0) + coalesce((sk->>'nag')::numeric, 0) + coalesce((sk->>'flash')::numeric, 0) + coalesce((sk->>'fist')::numeric, 0)) * {{power.sk}}
    + coalesce((sk->>'menhera')::numeric, 0) * {{power.menhera}}
    + (coalesce((s->>'skm')::numeric, 1) - 1) * {{power.skm}})::integer;
end $function$
