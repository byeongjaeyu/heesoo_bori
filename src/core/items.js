// ===================== 장비 (개별 장비 키·도감·능력치 계산 calcStats) =====================
// ---------- 개별 장비 ----------
// pd.inv·enh·ilv·iexp·ref·eq·beq 는 '장비 키' 기준. 같은 장비 첫 개는 키 = 장비 이름(예전 세이브 그대로),
// 둘째부터 '이름#xxxx'. ITEMS[키]는 원래 장비 정의를 돌려줌(data.js Proxy). 세이브 밖으로 나갈 땐 defOf로 이름만.


import { emit } from './events.js';
import { sfx } from '../sys/audio.js';
import { AWK, BOOK_ALL, BOOK_PER_HP, BOOK_SETS, BSLOTS, EQ_SETS, HAIRS, ITEMS, LOOK_SLOTS, SLOTS, bookIds, defOf } from './data.js';
import { chClr, kidNow } from './chapter.js';
import { refSum } from './refine.js';
import { G } from './state.js';
import { ILV_BONUS, ILV_NEED, sk } from './save.js';
import { ENH_FX, brkMul } from './enhance.js';
import { awkLv, msGot, towerBest } from './progress.js';
import { jobApply, jobFeedOk, jobSigDef } from './job.js';
import { tt } from '../sys/i18n.js';

export const BAG_MAX = 300;
export const keysOf = (/** @type {SaveData} */ pd, id) => Object.keys(pd.inv || {}).filter(k => defOf(k) === id);
export const ownsDef = (/** @type {SaveData} */ pd, id) => keysOf(pd, id).length > 0;
/** 새 장비 키. 거래로 넘긴 키(pd.tkeys)는 서버가 묘비로 기억하니 다시 쓰지 않음 */
function newItemKey(/** @type {SaveData} */ pd, id) { const gone = pd.tkeys || []; if (!pd.inv[id] && !gone.includes(id)) return id; let k; do k = id + '#' + Math.random().toString(36).slice(2, 6); while (pd.inv[k] || gone.includes(k)); return k; }
/** 장비 1개 추가 → 키. 도감도 등록 */
export function addItem(/** @type {SaveData} */ pd, id, enh) {
  const k = newItemKey(pd, id); pd.inv[k] = 1; pd.book = pd.book || {}; pd.book[id] = 1;
  if (enh) { pd.enh = pd.enh || {}; pd.enh[k] = enh; } return k;
}
/** 장비 1개 없애기 (강화·레벨·재련 기록도 같이) */
export function dropItem(/** @type {SaveData} */ pd, k) { delete pd.inv[k]; for (const m of [pd.enh, pd.ilv, pd.iexp, pd.ref]) if (m) delete m[k]; }
/** 같은 장비가 또 나오면 보관할지 (pd.keepDup = 이 등급 이상 보관, 없으면 강화석) */
export const keepDupOf = (/** @type {SaveData} */ pd, it) => pd.keepDup != null && it.rar >= pd.keepDup && Object.keys(pd.inv).length < BAG_MAX;
export const ilvOf = id => ((G.pd && G.pd.ilv) || {})[id] || 0;
const ilvMul = id => 1 + ILV_BONUS * ilvOf(id);
export function feedEquip(it) {
  const pd = G.pd, cur = it.bori ? (pd.beq || {})[it.slot] : pd.eq[it.slot], ci = ITEMS[cur];
  if (!ci || (ci.rar !== it.rar && !jobFeedOk(pd, cur, it))) return false;
  pd.ilv = pd.ilv || {}; pd.iexp = pd.iexp || {}; const n = (pd.iexp[cur] || 0) + 1;
  if (n >= ILV_NEED) {
    pd.iexp[cur] = 0; pd.ilv[cur] = (pd.ilv[cur] || 0) + 1; calcStats(); sfx('lvl');
    emit('toast', tt('core/items.1', { name: ci.name, v1: pd.ilv[cur], v2: Math.round(ILV_BONUS * 100 * pd.ilv[cur]) }), 'lvl');
    const who = it.bori ? G.bori : G.P; if (who) { G.fx.push({ k: 'lvl', x: who.x, y: who.y, t: 0, dur: 1.0 }); emit('bubble', who, it.bori ? tt('core/items.2') : tt('core/items.3'), 1.3); }
  } else { pd.iexp[cur] = n; emit('toast', tt('core/items.4', { name: it.name, name2: ci.name, n, ILV_NEED }), 'sub'); sfx('coin'); }
  return true;
}
/** 실제 착용 장비 이름 (개별 키 → 장비 이름) */
export function visEqRaw(/** @type {SaveData} */ pd) { const e = /** @type {Record<HeroSlot, ItemId>} */ ({}); for (const sl of SLOTS) e[sl] = defOf(pd.eq[sl]); return e; }
/** 화면에 보이는 장비 (꾸미기로 바꾼 겉모습 반영. 도감에 있고 색이 있는 장비만) */
export function visEq(pd) {
  const e = visEqRaw(pd), L = pd.look || {}, b = pd.book || {};
  for (const sl of LOOK_SLOTS) { const id = L[sl], it = id && ITEMS[id]; if (it && it.slot === sl && !it.bori && it.color && b[id]) e[sl] = id; }
  return e;
}
/** 착용 세트: 지금 끼고 있는 개수 */
export function eqSetN(pd, S) { const on = new Set([...SLOTS.map(sl => defOf(pd.eq[sl])), ...BSLOTS.map(sl => pd.beq && pd.beq[sl] ? defOf(pd.beq[sl]) : '')]); return S.ids.filter(id => on.has(id)).length; }
export const hairPal = k => HAIRS.find(h => h.k === k) || HAIRS[0];
/** 헤어 색 해금 여부 */
export function hairOk(pd, h) {
  if (!h.need) return true;
  if (h.need === 'book10') return bookStats(pd).n >= 10;
  if (h.need === 'book25') return bookStats(pd).n >= 25;
  if (h.need === 'loop5') return (pd.cleared || 0) >= 4;
  if (h.need === 'enh25') return Object.values(pd.enh || {}).some(v => v >= 25);
  if (h.need === 'aw50') return (pd.aw || 0) >= 50;
  if (/^ch\d+$/.test(h.need)) return chClr(pd, +h.need.slice(2)) >= 1; // 장 클리어 헤어 (장 파일 hair)
  if (h.need === 'lp20') return msGot(pd, 20);
  if (h.need === 'lp50') return msGot(pd, 50);
  if (h.need === 'tw30') return towerBest(pd) >= 30;
  if (h.need === 'pack') return !!(pd.pack && pd.pack.got);
  return false;
}
/** 도감 상태 (보유·착용 중인 장비는 자동 등록) */
export function bookStats(pd) {
  const b = pd.book = pd.book || {};
  for (const k in pd.inv) if (ITEMS[k] && !ITEMS[k].start) b[defOf(k)] = 1;
  const n = BOOK_ALL.filter(id => b[id]).length, done = {};
  for (const s of BOOK_SETS) done[s.k] = bookIds(s).every(id => b[id]);
  return { n, done };
}
/** 5장(어린 시절 `kidNow`)에서 「버려진 나무자재」(memory) 를 들면: 가진 무기 중 가장 센 것의 능력치·강화·장비 레벨·돌파를 빌려 씀 (무기 모양·사거리는 나무자재 그대로). 그 밖엔 착용 무기 키 */
export function memoryKey(pd) {
  const w = pd.eq.weapon, it = ITEMS[w]; if (!it || !it.memory || !kidNow()) return w;
  let best = w, bv = -1;
  for (const k of Object.keys(pd.inv)) { const d = ITEMS[k]; if (!d || d.slot !== 'weapon' || d.memory || d.bori) continue; const v = (d.atk || 0) * ilvMul(k) * brkMul(k) + ENH_FX.weapon.atk * ((pd.enh || {})[k] || 0); if (v > bv) { bv = v; best = k; } }
  return best;
}
export function calcStats() {
  const pd = G.pd, lv = pd.lv;
  const st = { hp: 100 + (lv - 1) * 22, mp: 50 + (lv - 1) * 8, atk: 10 + (lv - 1) * 3.5, def: 2 + (lv - 1) * 1.2, spd: 1, crit: 0.08, critMul: 1.6 };
  const wk = memoryKey(pd), eqk = sl => sl === 'weapon' ? wk : pd.eq[sl]; // 5장 나무자재 추억 보정
  for (const slot of SLOTS) { const it = jobSigDef(pd, eqk(slot)) || ITEMS[eqk(slot)]; if (!it) continue; const m = ilvMul(eqk(slot)) * brkMul(eqk(slot)); st.hp += (it.hp || 0) * m; st.mp += (it.mp || 0) * m; st.atk += (it.atk || 0) * m; st.def += (it.def || 0) * m; st.spd += (it.spd || 0) * m; st.crit += (it.crit || 0) * m; }
  st.spd += 0.05 * sk('shop'); st.goldMul = 1 + 0.15 * sk('shop');
  st.hp = Math.round(st.hp * (1 + 0.05 * sk('mukbang'))); st.foodMul = 1 + 0.2 * sk('mukbang');
  st.enhs = {}; for (const sl of SLOTS) { const en = (pd.enh || {})[eqk(sl)] || 0; st.enhs[sl] = en; const f = ENH_FX[sl]; for (const k in f) if (k !== 'txt') st[k] += f[k] * en; } st.enh = st.enhs.weapon;
  st.atk += AWK.atk.per * awkLv('atk'); st.def += AWK.def.per * awkLv('def'); st.hp += AWK.hp.per * awkLv('hp'); st.mp += AWK.mp.per * awkLv('mp'); st.crit += AWK.crit.per * awkLv('crit');
  st.skillMul = 1 + AWK.skill.per * awkLv('skill');
  const bk = bookStats(pd); st.book = bk.n;
  st.hp += BOOK_PER_HP * bk.n + (bk.done.r0 ? 80 : 0); if (bk.done.r1) st.atk += 12; if (bk.done.r2) st.def += 12; if (bk.done.r3) st.crit += 0.03;
  for (const s of BOOK_SETS) if (s.mul && bk.done[s.k]) { st.atk *= s.mul; st.def *= s.mul; } if (bk.done.r4) st.atk *= 1.05; if (bk.done.r5) { st.atk *= 1.05; st.def *= 1.05; st.hp *= 1.05; } st.hp = Math.round(st.hp);
  for (const S of EQ_SETS) if (eqSetN(pd, S) >= S.ids.length) { const m = S.mul; st.atk *= m.atk || 1; st.def *= m.def || 1; st.hp = Math.round(st.hp * (m.hp || 1)); }
  if (G.P && G.P.buffs) { let ba = 0, bc = 0; for (const k in G.P.buffs) { ba += G.P.buffs[k].atk || 0; bc += G.P.buffs[k].crit || 0; } st.atk *= 1 + ba; st.crit += bc; }
  // 재련 추가 옵션
  { const R = refSum(pd); st.atk *= 1 + (R.atkP || 0) / 100; st.def *= 1 + (R.defP || 0) / 100; st.hp = Math.round(st.hp * (1 + (R.hpP || 0) / 100)); st.crit += (R.crit || 0) / 100; st.critMul += (R.critD || 0) / 100;
    st.spd *= 1 + (R.spdP || 0) / 100; st.goldMul *= 1 + (R.goldP || 0) / 100; st.bossMul = 1 + (R.bossP || 0) / 100; st.refBori = (R.boriP || 0) / 100; }
  st.atk = Math.round(st.atk); st.def = Math.round(st.def); st.mp = Math.round(st.mp);
  st.weapon = ITEMS[pd.eq.weapon].w; st.moveSpd = 66 * st.spd;
  st.boriMul = 1 + AWK.bori.per * awkLv('bori'); for (const sl of BSLOTS) { const it = ITEMS[(pd.beq || {})[sl]]; if (it) st.boriMul += (it.bdmg || 0) * ilvMul(pd.beq[sl]); }
  for (const sl of BSLOTS) { const en = (pd.enh || {})[(pd.beq || {})[sl]] || 0; st.enhs[sl] = en; st.boriMul += ENH_FX[sl].boriMul * en; } st.toyEnh = st.enhs.btoy; st.clothEnh = st.enhs.bcloth; if (bk.done.bori) st.boriMul += 0.15; st.boriMul += st.refBori || 0;
  jobApply(pd, st);
  G.st = st;
  if (G.P) { G.P.hp = Math.min(G.P.hp, st.hp); G.P.mp = Math.min(G.P.mp, st.mp); }
  return st;
}
