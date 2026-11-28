// ===================== 전직 규칙 (직업 표·능력치 적용·전직하기) — 화면은 features/job.js =====================

import { emit } from './events.js';
import { ITEMS, SLOTS, defOf } from './data.js';
import { G } from './state.js';
import { addItem, ownsDef } from './items.js';
import { tt } from '../sys/i18n.js';

export const JOB_LV = 50, JOB_COST = { stones: 2000, gold: 10000000 };
/** 베타 기간에는 직업 바꾸기 무료(11/25 사용자 요청). 정식 때 free: false → JOB_COST */
export const JOB_BETA = { free: true };
/** @type {Record<string, {name: string, full: string, color: string, icon: string, flavor: string, always: string, sigTxt: string, sig: string[]}>} */
export const JOBS = {
  dev: { name: tt('core/job.1'), full: tt('core/job.2'), color: '#3a6ac0', icon: 'laptop', flavor: tt('core/job.3'),
    always: tt('core/job.4'), sigTxt: tt('core/job.5'), sig: ['starstick'] },
  career: { name: tt('core/job.6'), full: tt('core/job.7'), color: '#c0306a', icon: 'idcard', flavor: tt('core/job.8'),
    always: tt('core/job.9'), sigTxt: tt('core/job.10'), sig: ['goldpan', 'limitbag', 'clutch'] },
  cheer: { name: tt('core/job.11'), full: tt('core/job.12'), color: '#e8414f', icon: 'bat', flavor: tt('core/job.13'),
    always: tt('core/job.14'), sigTxt: tt('core/job.15'), sig: ['bat', 'lightstick', 'uniform', 'cheercap', 'spike', 'cheerbag'] },
  bride: { name: tt('core/job.16'), full: tt('core/job.17'), color: '#d88ab0', icon: 'bouquet', flavor: tt('core/job.18'),
    always: tt('core/job.19'), sigTxt: tt('core/job.20'), sig: ['bouquet', 'wdress', 'veil'] },
  fish: { name: tt('core/job.21'), full: tt('core/job.22'), color: '#2f8a8a', icon: 'net', flavor: tt('core/job.23'),
    always: tt('core/job.24'), sigTxt: tt('core/job.25'), sig: ['net', 'vest', 'bucket', 'rainboot', 'wingshoes', 'tackle'] }
};
/** 직업 장비 보정 (11/25): 내 직업의 대표 장비는 기본 능력치가 그 부위 초월 장비 수준으로 올라감
 * (대표 장비가 신화·전설이라 끼면 오히려 약해지던 문제). 능력치마다 max(원래 값, 그 부위 초월 장비 값). 무기 모양(사거리·속도)은 그대로 */
const JOB_STATS = ['atk', 'def', 'hp', 'mp', 'crit', 'spd'];
const JOB_TOP = (() => { const t = {}; for (const id of Object.keys(ITEMS)) { const it = ITEMS[id]; if (it.rar !== 5 || it.bori || it.bossOnly || it.job) continue; const o = t[it.slot] = t[it.slot] || {}; for (const k of JOB_STATS) if (it[k]) o[k] = Math.max(o[k] || 0, it[k]); } return t; })();
const JOB_SIG_CACHE = {};
/** 지금 직업의 대표 장비면 보정된 정의, 아니면 null */
export function jobSigDef(pd, key) {
  const j = jobOf(pd); if (!j || !key) return null; const id = defOf(key); if (!JOBS[j].sig.includes(id)) return null;
  const ck = j + '|' + id; if (JOB_SIG_CACHE[ck]) return JOB_SIG_CACHE[ck];
  const it = ITEMS[id], top = JOB_TOP[it.slot] || {}, d = Object.assign({}, it); for (const k of JOB_STATS) if (top[k]) d[k] = Math.max(it[k] || 0, top[k]);
  return (JOB_SIG_CACHE[ck] = d);
}
/** 새신부로 처음 전직하면 받는 웨딩 세트 */
export const JOB_GIFT = { bride: ['bouquet', 'wdress', 'veil'] };
export const jobOf = pd => (pd && pd.lv >= JOB_LV && JOBS[pd.job]) ? pd.job : null;
/** 착용 중인 대표 장비 개수 (희수 5부위) */
export function jobSigN(pd, id) { const sig = JOBS[id].sig; let n = 0; for (const sl of SLOTS) if (sig.includes(defOf(pd.eq[sl]))) n++; return n; }
/** 장비 레벨 재료: 개발자는 맥북프로에 신화 무기도 먹일 수 있음 */
export function jobFeedOk(pd, cur, it) { return jobOf(pd) === 'dev' && defOf(cur) === 'starstick' && it.slot === 'weapon' && it.rar === 4; }
/** calcStats 끝에서 호출 */
export function jobApply(pd, st) {
  const j = jobOf(pd); st.job = j; if (!j) return;
  const eqd = sl => defOf(pd.eq[sl]), n = Math.min(5, jobSigN(pd, j));
  if (j === 'dev') { st.skillMul += 0.15; if (eqd('weapon') === 'starstick') st.atk *= 1.2; }
  else if (j === 'career') { st.goldMul *= 1.2; if (eqd('weapon') === 'goldpan') { st.rateMul = 1.2; st.pierce = 3; } if (['limitbag', 'clutch'].includes(eqd('bag'))) st.crit += 0.05; }
  else if (j === 'cheer') { st.boriMul += 0.2; st.buddyMul = 1.3; st.atk *= 1 + 0.04 * n; }
  else if (j === 'bride') { const m = 1 + 0.07 * n; st.hp *= 1.15 * m; st.def *= 1.1 * m; if (n >= 3) { st.regen = 0.03; st.boriMul += 0.1; } }
  else if (j === 'fish') { st.bossMul += 0.15; st.atk *= 1 + 0.04 * n; st.dropMul = 1 + 0.06 * n; }
  st.atk = Math.round(st.atk); st.def = Math.round(st.def); st.hp = Math.round(st.hp);
}
/** 새신부 회복 (5초마다 최대 HP 3%) */
export function jobTick(dt) {
  const P = G.P, st = G.st; if (!P || !st || !st.regen || P.hp <= 0 || P.hp >= st.hp) { if (P) P.regT = 0; return; }
  P.regT = (P.regT || 0) + dt; if (P.regT < 5) return; P.regT = 0;
  const h = Math.max(1, Math.round(st.hp * st.regen)); P.hp = Math.min(st.hp, P.hp + h); emit('text', P.x, P.y - 30, '+' + h, 'heal');
}
export function jobCanPay(pd) { if (JOB_BETA.free) return true; return (pd.stones || 0) >= JOB_COST.stones && (pd.gold || 0) >= JOB_COST.gold; }
/** 전직 (첫 번째는 무료) */
export function jobSet(pd, id) {
  if (!JOBS[id] || pd.lv < JOB_LV || pd.job === id) return false;
  if (pd.job) { if (!jobCanPay(pd)) return false; if (!JOB_BETA.free) { pd.stones -= JOB_COST.stones; pd.gold -= JOB_COST.gold; } pd.jobN = (pd.jobN || 0) + 1; }
  pd.job = id; pd.jobGift = pd.jobGift || {};
  const gift = JOB_GIFT[id]; let got = [];
  if (gift && !pd.jobGift[id]) { pd.jobGift[id] = 1; for (const it of gift) { if (!ownsDef(pd, it)) { const k = addItem(pd, it); got.push(k); const sl = ITEMS[it].slot; const cur = ITEMS[pd.eq[sl]]; if (!cur || (cur.rar || 0) <= ITEMS[it].rar) pd.eq[sl] = k; } } }
  return got;
}
