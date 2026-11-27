-- 자동 생성 파일 — 운영 DB 에서 실행하면 supabase/gen/functions.sql 과 다른(또는 없는) 함수만 나옴. 빈 결과 = 같음.
select x.name from (values
  ('hb_auc_close', '6e2bb36dcda4cfd6af00efc4caec900c'),
  ('hb_auc_list', '2971b699d760c419157c8a2d06179828'),
  ('hb_auc_min', '338cd3431c60a7f3d4705d18d297b8fc'),
  ('hb_borrow_friend', '00d86241bf01e7f064e68c4b2c455ada'),
  ('hb_power', '0396c5729699d9d0ece60f117fbcdfe2'),
  ('hb_raid_info', '29bfb16642e33976130823efd1fe20a1'),
  ('hb_raid_report', '276e243b96b95e505b0d42c19397e981'),
  ('hb_raid_settle', '7319fac6e5a549df62462a5fc7253b72'),
  ('hb_raid_start', '1c4b4b29b903bb13c615b79fba4ec4b7'),
  ('hb_save_push', '600daaaac41179b3b9e326c965bda0a5'),
  ('hb_season_rollover', 'a18a90590ffaf61e54c4a6da6b452391'),
  ('hb_submit_fighter', '5b67da7773f9bd92657e86e784dcfcc1'),
  ('hb_xchg_ok', 'c657692be1c166a1ed0a220f3027897b'),
  ('hb_xchg_pay', 'ea2f54516005e36b69e17c44514fe921'),
  ('hb_xchg_propose', 'b86ac910e21e74a53b40440433632857')
) x(name, md5)
where not exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
  where s.nspname = 'public' and p.proname = x.name and md5(pg_get_functiondef(p.oid)) = x.md5);
