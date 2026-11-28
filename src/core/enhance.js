// ===================== 강화·강화석·한계 돌파 =====================
// ---------- 강화 (+20, 확률) · 강화석 ----------
// 강화: 모든 장비(보리 포함) +25까지. 0→+25 기댓값 약 500만G (+17 약 15만, +20 약 52만)


import { emit } from './events.js';
import { BSLOTS, ITEMS } from './data.js';
import { G } from './state.js';
import { saveGame } from './save.js';
import { calcStats, dropItem, ilvOf } from './items.js';
import { tt } from '../sys/i18n.js';

export const ENH_MAX = 25;
const ENH_P    = [1, .95, .9, .85, .8, .75, .7, .65, .6, .55, .5, .45, .4, .38, .35, .33, .31, .3, .29, .28, .27, .26, .25, .24, .22];
const ENH_DOWN = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, .1, .1, .12, .14, .15, .15, .16, .17, .18, .2, .2, .2, .22, .24];
const ENH_DEST = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, .01, .01, .015, .02, .02, .02, .025, .025, .03, .03, .035, .035, .04];
export const enhReset = lv => lv >= 20 ? 17 : 12; // 파괴 시 떨어지는 단계
export const enhCost = lv => Math.round(140 * Math.pow(1.3, lv));
// 강화석: +20 이상은 개수를 크게 올려 강화석이 병목이 되게 (강화석으로 +25 = 장비당 약 128만G + 약 2,700개)
const ENH_STONE_HIGH = [50, 80, 120, 160, 200];
export const enhStoneCost = lv => lv < 10 ? 1 : lv < 15 ? 3 : lv < 18 ? 6 : lv < 20 ? 10 : ENH_STONE_HIGH[lv - 20] || 200;
// 부위별 강화 1단계 효과
export const ENH_FX = {
  weapon: { atk: 2.5, crit: 0.01, txt: en => tt('core/enhance.1', { v1: +(2.5 * en).toFixed(1), en }) },
  hat:    { def: 1, hp: 12, txt: en => tt('core/enhance.2', { en, v1: 12 * en }) },
  armor:  { def: 1.5, hp: 20, txt: en => tt('core/enhance.3', { v1: +(1.5 * en).toFixed(1), v2: 20 * en }) },
  shoes:  { spd: 0.008, def: 0.5, txt: en => tt('core/enhance.4', { v1: +(0.8 * en).toFixed(1), v2: +(0.5 * en).toFixed(1) }) },
  bag:    { mp: 6, crit: 0.003, txt: en => tt('core/enhance.5', { v1: 6 * en, v2: +(0.3 * en).toFixed(1) }) },
  bcloth: { boriMul: 0.03, txt: en => tt('core/enhance.6', { v1: 3 * en }) },
  btoy:   { boriMul: 0.03, txt: en => tt('core/enhance.6', { v1: 3 * en }) }
};
// 분해 강화석 (등급별, 화면에 숫자로 보임)
const STONE_YIELD = [1, 2, 4, 10, 25, 60];
// 사냥 중 주운 중복 장비 강화석 (평균값, 소수는 확률: 0.5 = 50%로 1개). 엔드급 자동사냥 시간당 약 350개 → 강화석으로 +25 1개 ≈ 사냥 8시간
const DUP_YIELD = [0.5, 1.5, 4, 10, 25, 60];
export const dupStones = id => { const v = DUP_YIELD[ITEMS[id].rar] || 1, w = Math.floor(v); return w + (Math.random() < v - w ? 1 : 0); };
export const stoneYield = id => STONE_YIELD[ITEMS[id].rar] || 1;
export function canDismantle(id) { const it = ITEMS[id], pd = G.pd; return !!(it && !it.start && !it.job && !it.quest && pd.inv[id] && pd.eq[it.slot] !== id && (pd.beq || {})[it.slot] !== id && !((pd.enh || {})[id] > 0) && !ilvOf(id) && !((pd.iexp || {})[id] > 0)); }
export function dismantle(ids) { let s = 0, n = 0; for (const id of ids) { if (!canDismantle(id)) continue; s += stoneYield(id); n++; dropItem(G.pd, id); } G.pd.stones = (G.pd.stones || 0) + s; return { n, s }; }
export function enhOdds(lv, useStone) { let p = ENH_P[lv], dn = ENH_DOWN[lv], ds = ENH_DEST[lv]; if (useStone) { const add = Math.min(0.1, 1 - p); p += add; const take = Math.min(add, dn); dn -= take; } return { p, dn, ds, protect: !!useStone }; }
const enhTarget = slot => BSLOTS.includes(slot) ? (G.pd.beq || {})[slot] : G.pd.eq[slot || 'weapon'];
export function tryEnhance(useStone, slot) {
  const pd = G.pd, wid = enhTarget(slot); if (!wid) return null; pd.enh = pd.enh || {}; const en = pd.enh[wid] || 0; if (en >= ENH_MAX) return null;
  const cost = enhCost(en), sc = enhStoneCost(en); if (pd.gold < cost || (useStone && (pd.stones || 0) < sc)) return null;
  pd.gold -= cost; if (useStone) pd.stones -= sc;
  const o = enhOdds(en, useStone), r = Math.random(); let res;
  if (r < o.p) { pd.enh[wid] = en + 1; res = 'up'; }
  else if (r < o.p + o.dn) { pd.enh[wid] = Math.max(0, en - 1); res = 'down'; }
  else if (r < o.p + o.dn + o.ds) { if (o.protect) { pd.enh[wid] = Math.max(0, en - 1); res = 'saved'; } else { pd.enh[wid] = Math.min(en, enhReset(en)); res = 'boom'; } }
  else res = 'keep';
  emit('daily', 'enh'); if (res === 'up') emit('guide', 'enh');
  calcStats(); saveGame(); return { res, from: en, to: pd.enh[wid], id: wid };
}
// ---------- 한계 돌파 (+26~+30): +25 장비만. 강화석이 많이 들고 성공률 낮음, 실패해도 하락·파괴 없음. 단계마다 장비 기본 능력치 +3% ----------
export const BRK_MAX = 30, BRK_STONE = [1000, 1500, 2000, 2500, 3000], BRK_P = [0.09, 0.07, 0.05, 0.04, 0.03], BRK_STEP = 0.03;
export const brkCost = en => ({ stones: BRK_STONE[en - ENH_MAX] || 0, gold: enhCost(en), p: BRK_P[en - ENH_MAX] || 0 });
export const brkMul = id => 1 + BRK_STEP * Math.max(0, ((G.pd.enh || {})[id] || 0) - ENH_MAX);
export function tryBreak(slot) {
  const pd = G.pd, wid = enhTarget(slot); if (!wid) return null; pd.enh = pd.enh || {}; const en = pd.enh[wid] || 0;
  if (en < ENH_MAX || en >= BRK_MAX) return null; const c = brkCost(en);
  if (pd.gold < c.gold || (pd.stones || 0) < c.stones) return null;
  pd.gold -= c.gold; pd.stones -= c.stones; const up = Math.random() < c.p; if (up) pd.enh[wid] = en + 1;
  pd.stats.brkTry = (pd.stats.brkTry || 0) + 1; emit('daily', 'enh');
  calcStats(); saveGame(); return { res: up ? 'up' : 'keep', from: en, to: pd.enh[wid], id: wid };
}
export const sellPrice = id => { const it = ITEMS[id]; return it.price ? Math.floor(it.price * 0.3) : [40, 150, 400, 800, 1600, 3200][it.rar]; };
