// i18n-keep-file (서버 SQL 생성기가 node 로 바로 읽음 — 시즌 보상 글은 서버 기록에 한국어로 들어감)
// 게임과 서버(Supabase)가 **같이 쓰는 숫자**를 모아 둔 곳 — 여기만 고치면 양쪽이 같이 바뀜.
//  - 게임: 이 파일을 import 해서 씀 (전투력 계산·보상표 화면·안내 문구).
//  - 서버: supabase/fn/*.sql 틀의 {{…}} 자리에 이 값이 들어가고 `npm run sql` 이 supabase/gen/functions.sql 을 만듦.
//    → 그 파일을 운영 DB 에 실행해야 서버가 바뀜 (tests/unit/sql.test.mjs 가 생성본이 최신인지 검사).
// 이 파일은 다른 파일을 import 하지 않음 (빌드 스크립트가 node 로 바로 읽음).

export const RULES = {
  /** 전투력 = 공격×atk + HP×hp + 방어×def + 치명×crit + (이동-1)×spd + 보리(bori + (보리 배수-1)×boriMul) + 스킬 4종 Lv×sk + 멘헤라 Lv×menhera + (스킬 위력-1)×skm (서버 hb_power) */
  power: { atk: 4, hp: 0.5, def: 6, crit: 300, spd: 150, bori: 50, boriMul: 300, sk: 12, menhera: 40, skm: 600 },
  /** 랭킹 등록 스냅샷 값 상한 (서버 hb_submit_fighter) — lv·enh 는 게임 MAX_LV·BRK_MAX 와 같아야 함(테스트) */
  snapMax: { lv: 50, aw: 5000, enh: 30, tenh: 30, cleared: 100000, hp: 2000000, atk: 200000, def: 200000, crit: 1, critMul: 10, spd: 5, boriMul: 200, skm: 200, infBest: 1000000, sk: 10 },
  /** 주간 PvP 시즌 보상 (서버 hb_season_rollover). to = 이 순위까지, 마지막 줄(to 0) = 나머지 전부. s 강화석 · g 골드 · a 자동사냥 초 */
  season: [
    { to: 1, s: 150, g: 3000000, a: 10800 },
    { to: 2, s: 100, g: 2000000, a: 7200 },
    { to: 3, s: 70, g: 1000000, a: 3600 },
    { to: 10, s: 30, g: 300000 },
    { to: 0, s: 10 },
  ],
  /** 월드 보스 (서버 hb_raid_start·hb_raid_report·hb_raid_settle) */
  raid: {
    tries: 3, // 하루 도전 횟수
    capPower: 250, capBase: 50000, // 한 번 피해 상한 = 전투력 × capPower + capBase (넘으면 hb_flags 'raid_cap')
    top1: { s: 100, g: 1500000 }, top3: { s: 60, g: 800000 }, // 처치했을 때 피해량 1위 / 2~3위 추가 보상
    kill: { s: 40, g: 500000 }, // 처치했을 때 참가자 전원
    fail: { s: 15 }, // 못 잡았을 때 참가자
  },
  /** 친구 희수 데려가기: 빌려준 사람 강화석 (하루 perDay 번까지) (서버 hb_borrow_friend) */
  buddy: { stones: 3, perDay: 10 },
  /** 경매장 (서버 hb_auc_min·hb_auc_list·hb_auc_close) */
  auc: { fee: 0.05, step: 0.05, minStart: 1000, maxPrice: 2000000000, maxOpen: 10, hours: [12, 24, 48] },
  /** 1:1 교환 (서버 hb_xchg_ok·hb_xchg_propose·hb_xchg_pay) */
  xchg: { lv: 30, fee: 0.05, minGold: 100, maxGold: 2000000000, maxItems: 5, maxOpen: 10 },
  /**
   * 서버 세이브 검사 (서버 hb_save_push): 지난 세이브 이후 h시간(최대 h) 동안 [기본, 시간당] 넘게 늘면 거절.
   * 새 보상·재화를 만들면 한 번에 받는 양이 여기 기본값을 넘지 않는지 볼 것(tests/unit/sql.test.mjs 가 일부 검사).
   */
  save: {
    lv: 50, enh: 30, h: 24,
    gold: [50000000, 30000000], stones: [5000, 1500], aw: [30, 15], loops: [5, 15], auto: [43200, 7200], items: [6, 3],
    first: { gold: 1000000000, stones: 100000, aw: 3000 }, // 서버에 처음 올리는 세이브 상한
  },
};

/** 전투력 (서버 hb_power 와 같은 식). s = { atk, hp, def, crit, spd, bori, boriMul, sk: {smash,nag,flash,fist,menhera}, skm } */
export function powerOf(s) {
  const P = RULES.power, k = s.sk || {};
  return Math.round(s.atk * P.atk + s.hp * P.hp + s.def * P.def + s.crit * P.crit + Math.max(0, s.spd - 1) * P.spd
    + (s.bori ? P.bori + ((s.boriMul || 1) - 1) * P.boriMul : 0)
    + ((k.smash || 0) + (k.nag || 0) + (k.flash || 0) + (k.fist || 0)) * P.sk + (k.menhera || 0) * P.menhera + ((s.skm || 1) - 1) * P.skm);
}

/** 보상 한 줄 글 (예: 「강화석 150 · 300만G · 자동사냥 3시간」) — 시즌 결과 기록(hb_season_results.reward)에 그대로 들어감 */
export function rewardTxt(r) {
  const out = ['강화석 ' + r.s];
  if (r.g) out.push((r.g % 10000 ? r.g.toLocaleString('en-US') : r.g / 10000 + '만') + 'G');
  if (r.a) out.push('자동사냥 ' + (r.a % 3600 ? Math.round(r.a / 60) + '분' : r.a / 3600 + '시간'));
  return out.join(' · ');
}

/** 시즌 보상 화면용 이름표: 1위 · 2위 · 3위 · 4~10위 · 1판 이상 */
export function seasonLabel(i) {
  const t = RULES.season[i], prev = i ? RULES.season[i - 1].to : 0;
  if (!t.to) return '1판 이상';
  return t.to === prev + 1 ? t.to + '위' : (prev + 1) + '~' + t.to + '위';
}
