// ===================== 골드 소모 규칙: 강화석 교환소 값·재련 옵션 표·계산 — 실행·화면은 features/refine.js =====================

import { todayKey } from './util.js';
import { BSLOTS, ITEMS, SLOTS } from './data.js';

export const XCH_TIERS = [[100, 3000], [100, 6000], [100, 12000]], XCH_MAX = 300;
export const xchToday = pd => pd.xch && pd.xch.day === todayKey() ? pd.xch.n : 0;
/** 오늘 n0개 산 상태에서 k개 더 살 때 값 */
export function xchCost(n0, k) { let c = 0, n = n0; for (const [cnt, p] of XCH_TIERS) { const lo = XCH_TIERS.slice(0, XCH_TIERS.findIndex(t => t[1] === p)).reduce((a, t) => a + t[0], 0); while (k > 0 && n < lo + cnt) { c += p; n++; k--; } } return c; }
export const xchPriceNow = n0 => { let lo = 0; for (const [cnt, p] of XCH_TIERS) { if (n0 < lo + cnt) return p; lo += cnt; } return 0; };
/** k개를 사려 할 때 실제로 살 수 있는 개수와 값 (한도·골드 반영) */
export function xchPlan(pd, k) { const n0 = xchToday(pd); let n = Math.max(0, Math.min(k, XCH_MAX - n0)); while (n > 0 && xchCost(n0, n) > pd.gold) n--; return { n, c: n ? xchCost(n0, n) : 0 }; }
const REF_OPT = {
  atkP: { n: '공격력', lo: 2, hi: 8 }, defP: { n: '방어력', lo: 2, hi: 8 }, hpP: { n: '최대 HP', lo: 3, hi: 10 },
  crit: { n: '치명타 확률', lo: 1, hi: 4 }, critD: { n: '치명타 피해', lo: 5, hi: 20 }, spdP: { n: '이동 속도', lo: 2, hi: 6 },
  bossP: { n: '보스 피해', lo: 3, hi: 12 }, goldP: { n: '골드 획득', lo: 5, hi: 20 }, boriP: { n: '보리 공격', lo: 3, hi: 12 }
};
export const REF_POOL_H = ['atkP', 'defP', 'hpP', 'crit', 'critD', 'spdP', 'bossP', 'goldP'], REF_POOL_B = ['boriP', 'hpP', 'bossP', 'goldP'];
export const REF_GRADE = [{ n: '일반', p: 0.70, a: 0, b: 0.4 }, { n: '희귀', p: 0.22, a: 0.4, b: 0.7 }, { n: '전설', p: 0.07, a: 0.7, b: 0.95 }, { n: '신화', p: 0.01, a: 1, b: 1.5 }];
const REF_COST = [50000, 100000, 200000, 400000, 800000, 1500000];
export const refLineN = it => it.rar <= 1 ? 1 : it.rar <= 3 ? 2 : 3;
export const refOf = (pd, id) => (pd.ref && pd.ref[id]) || null;
export const refCost = (pd, id) => { const it = ITEMS[id], r = refOf(pd, id), locks = r ? r.lines.filter(l => l.lk).length : 0; return REF_COST[Math.min(5, it.rar)] * (1 + locks); };
export function refRoll(pool, used) {
  const ks = pool.filter(k => !used.includes(k)), k = ks[Math.floor(Math.random() * ks.length)], o = REF_OPT[k];
  let u = Math.random(), gi = 0; for (; gi < REF_GRADE.length - 1; gi++) { if (u < REF_GRADE[gi].p) break; u -= REF_GRADE[gi].p; }
  const G2 = REF_GRADE[gi], f = G2.a + Math.random() * (G2.b - G2.a);
  return { k, v: Math.round((o.lo + (o.hi - o.lo) * f) * 10) / 10, g: gi };
}
/** 착용 장비의 추가 옵션 합계 */
export function refSum(pd) {
  const s = {}; const ids = [...SLOTS.map(sl => pd.eq[sl]), ...(pd.boriJoined ? BSLOTS.map(sl => (pd.beq || {})[sl]) : [])];
  for (const id of ids) { const r = id && refOf(pd, id); if (r) for (const l of r.lines) s[l.k] = (s[l.k] || 0) + l.v; }
  return s;
}
export const refLineTxt = l => `${REF_OPT[l.k].n} +${l.v}%`;
