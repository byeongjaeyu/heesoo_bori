// ===================== 회차(NG+) 난이도·배수 =====================
// ---------- 회차 (NG+) ----------


import { choice } from './util.js';
import { ITEMS } from './data.js';
import { zoneL } from './chapter.js';
import { G } from './state.js';

const LOOP_CAP = 10;
/** 회차 → 난이도 단계. 11회차부터도 계속 오르되 증가폭은 절반 (예: 50회차 = 30단계) */
export const loopEff = cl => cl <= LOOP_CAP ? cl : LOOP_CAP + (cl - LOOP_CAP) * LOOP_AFTER;
const LOOP_AFTER = 0.75;
export function loopLv() { return G.pvp ? 0 : G.inf ? G.inf.loop : G.tower ? G.tower.L : G.pd ? zoneL(G.pd, G.zone || 0) : 0; }
export const FIRST_BOSS = { hp: 0.7, atk: 0.75 };
export const LM_HP = 1.3, LM_ATK = 1.0, LM_XP = 0.2, LM_GOLD = 0.4;
/** 고회차 가속: 30단계(1장 약 37회차)부터 단계마다 체력 ×1.05·공격 ×1.03·골드 ×1.02씩 더 → 풀강 유저도 회차를 올리다 막힘 */
const LM_FAST = 30, LM_FAST_HP = 0.05, LM_FAST_ATK = 0.03, LM_FAST_GOLD = 0.02;
const lmFast = (L, r) => L > LM_FAST ? Math.pow(1 + r, L - LM_FAST) : 1;
export function loopMul() { const L = loopLv(); return { L, hp: (1 + LM_HP * L) * lmFast(L, LM_FAST_HP), atk: (1 + LM_ATK * L) * lmFast(L, LM_FAST_ATK), def: 3 * L, spd: Math.min(1.3, 1 + 0.05 * L), xp: 1 + LM_XP * L, gold: (1 + LM_GOLD * L) * lmFast(L, LM_FAST_GOLD), item: Math.min(1.6, 1 + 0.2 * L), cnt: Math.min(2, 1 + 0.25 * L), elite: Math.min(0.25, 0.07 * L), legend: Math.min(0.3, 0.08 * L) }; }
export const zoneQuota = Z => Math.round(Z.quota * loopMul().cnt);
// 처치 1마리당 등급별 드롭 확률 (일반 몬스터 기준). 높은 등급부터 굴려서 하나만 떨어짐
const DROP_RATE = [1 / 80, 1 / 250, 1 / 800, 1 / 2000, 1 / 5000, 1 / 12000];
export const DROP_MUL = { normal: 1, elite: 5, boss: 25 };
/** 사냥·보스전 강화석 (11/24): 일반 몬스터 1%로 1개 · 정예 10%로 1~2개 · 보스는 확정 2 + 회차 단계/4개(최대 20). PvP·레이드는 없음.
 * 엔드급(시간당 약 4,000마리·정예 25%·보스 약 20마리, 45단계) ≈ 시간당 +370개 — 서버 세이브 검사 한도(1,500/시간) 안 */
const STONE_DROP = { normal: 0.01, elite: 0.1, bossBase: 2, bossPerL: 0.25, bossMax: 20 };
export function killStones(e, L) {
  if (G.pvp || G.raid || e.rival) return 0;
  if (e.boss) return Math.min(STONE_DROP.bossMax, STONE_DROP.bossBase + Math.floor(L * STONE_DROP.bossPerL));
  const dm = (G.st && G.st.dropMul) || 1;
  if (e.elite) return Math.random() < STONE_DROP.elite * dm ? 1 + (Math.random() < 0.5 ? 1 : 0) : 0;
  return Math.random() < STONE_DROP.normal * dm ? 1 : 0;
}
export function rollDrop(mul) {
  const L = loopLv(), lm = loopMul().item * (mul || 1) * ((G.st && G.st.dropMul) || 1);
  for (let r = DROP_RATE.length - 1; r >= 0; r--) {
    if (Math.random() >= DROP_RATE[r] * lm) continue;
    const pool = Object.keys(ITEMS).filter(id => { const it = ITEMS[id]; return it.rar === r && it.tier && !it.bossOnly && it.tier <= G.zone + 1 + L && L >= it.rar - 3 && (!it.bori || G.pd.boriJoined); });
    if (pool.length) return choice(pool);
  }
  return null;
}
function rollItem(minRar, legendChance) {
  const L = loopLv(); const ok = id => { const it = ITEMS[id]; return it.tier && !it.bossOnly && it.tier <= G.zone + 1 + L && (!it.bori || G.pd.boriJoined) && it.rar >= (minRar || 0); };
  const all = Object.keys(ITEMS).filter(ok); const leg = all.filter(id => ITEMS[id].rar >= 3), rest = all.filter(id => ITEMS[id].rar < 3);
  if (leg.length && Math.random() < (legendChance || 0)) return choice(leg); return rest.length ? choice(rest) : (leg.length ? choice(leg) : null);
}


// 희수 스킬 「오빠 살려줘!」: 쓰러지면 오빠가 달려와 부활 (스테이지당 1번, 할로윈파티는 보스 웨이브마다 충전)
