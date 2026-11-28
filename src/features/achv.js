// ===================== 업적과 칭호 =====================
// 업적을 깨면 강화석 보상 + 칭호 해금. 장착한 칭호는 snap.ttl 로 랭킹·PvP·카드·동료 이름표에 표시 (꾸미기라 능력치 없음)



import { $ } from '../sys/dom.js';
import { fmtTime } from '../core/util.js';
import { sfx } from '../sys/audio.js';
import { BSLOTS, SLOTS } from '../core/data.js';
import { CHAPTERS } from '../core/chapter.js';
import { G } from '../core/state.js';
import { saveGame } from '../core/save.js';
import { bookStats } from '../core/items.js';
import { towerBest } from '../core/progress.js';
import { toast } from '../ui/dialog.js';
import { MTAB, renderMenu } from '../ui/menu.js';
import { loopsTotal } from './goal.js';
import { tt } from '../sys/i18n.js';

const ACH_TIER = ['', tt('features/achv.1'), tt('features/achv.2'), tt('features/achv.3'), tt('features/achv.4')], ACH_REW = [0, 5, 15, 40, 100];
export const ACH_COL = ['', '#f0b27a', '#cfe0f0', '#ffd84a', '#ff9ce0'];
const achMaxEnh = pd => Math.max(0, ...Object.values(pd.enh || {}).map(Number));
const achFullEnh = pd => { const ids = [...SLOTS.map(s => pd.eq[s]), ...(pd.boriJoined ? BSLOTS.map(s => (pd.beq || {})[s]) : [])]; return ids.filter(id => id && ((pd.enh || {})[id] || 0) >= 25).length; };
const achFullN = pd => SLOTS.length + (pd.boriJoined ? BSLOTS.length : 0) || 1;
/** @type {{id:string, t:string, d:string, tier:number, sp?:number, v:(pd:any)=>number, g:number|((pd:any)=>number)}[]} */
const ACH = [
  { id: 'k100', t: tt('features/achv.5'), d: tt('features/achv.6'), tier: 1, v: pd => pd.stats.kills, g: 100 },
  { id: 'k1k', t: tt('features/achv.7'), d: tt('features/achv.8'), tier: 2, v: pd => pd.stats.kills, g: 1000 },
  { id: 'k10k', t: tt('features/achv.9'), d: tt('features/achv.10'), tier: 3, v: pd => pd.stats.kills, g: 10000 },
  { id: 'k100k', t: tt('features/achv.11'), d: tt('features/achv.12'), tier: 4, v: pd => pd.stats.kills, g: 100000 },
  { id: 'b10', t: tt('features/achv.13'), d: tt('features/achv.14'), tier: 2, v: pd => pd.stats.boss || 0, g: 10 },
  { id: 'b100', t: tt('features/achv.15'), d: tt('features/achv.16'), tier: 3, v: pd => pd.stats.boss || 0, g: 100 },
  { id: 'lv50', t: tt('features/achv.17'), d: tt('features/achv.18'), tier: 2, v: pd => pd.lv, g: 50 },
  { id: 'aw10', t: tt('features/achv.19'), d: tt('features/achv.20'), tier: 2, v: pd => pd.aw || 0, g: 10 },
  { id: 'aw100', t: tt('features/achv.21'), d: tt('features/achv.22'), tier: 4, v: pd => pd.aw || 0, g: 100 },
  { id: 'c1', t: tt('features/achv.23'), d: tt('features/achv.24'), tier: 1, v: pd => pd.cleared || 0, g: 1 },
  { id: 'c5', t: tt('features/achv.25'), d: tt('features/achv.26'), tier: 3, v: pd => pd.cleared || 0, g: 5 },
  { id: 'c10', t: tt('features/achv.27'), d: tt('features/achv.28'), tier: 4, v: pd => pd.cleared || 0, g: 10 },
  { id: 'e15', t: tt('features/achv.29'), d: tt('features/achv.30'), tier: 1, v: achMaxEnh, g: 15 },
  { id: 'e20', t: tt('features/achv.31'), d: tt('features/achv.32'), tier: 2, v: achMaxEnh, g: 20 },
  { id: 'e25', t: tt('features/achv.33'), d: tt('features/achv.34'), tier: 3, v: achMaxEnh, g: 25 },
  { id: 'eall', t: tt('features/achv.35'), d: tt('features/achv.36'), tier: 4, v: achFullEnh, g: achFullN },
  { id: 'bk22', t: tt('features/achv.37'), d: tt('features/achv.38'), tier: 2, v: pd => bookStats(pd).n, g: 22 },
  { id: 'bk44', t: tt('features/achv.39'), d: tt('features/achv.40'), tier: 4, v: pd => bookStats(pd).n, g: 44 },
  { id: 'w20', t: tt('features/achv.41'), d: tt('features/achv.42'), tier: 2, v: pd => pd.infBest || 0, g: 20 },
  { id: 'w50', t: tt('features/achv.43'), d: tt('features/achv.44'), tier: 3, v: pd => pd.infBest || 0, g: 50 },
  { id: 'p10', t: tt('features/achv.45'), d: tt('features/achv.46'), tier: 1, v: pd => pd.stats.pvpW || 0, g: 10 },
  { id: 'p100', t: tt('features/achv.47'), d: tt('features/achv.48'), tier: 3, v: pd => pd.stats.pvpW || 0, g: 100 },
  { id: 'r1m', t: tt('features/achv.49'), d: tt('features/achv.50'), tier: 3, v: pd => pd.stats.raidBest || 0, g: 1000000 },
  { id: 'u1k', t: tt('features/achv.51'), d: tt('features/achv.52'), tier: 2, v: pd => pd.stats.ults, g: 1000 },
  { id: 'f500', t: tt('features/achv.53'), d: tt('features/achv.54'), tier: 2, v: pd => pd.stats.eaten, g: 500 },
  { id: 'd100', t: tt('features/achv.55'), d: tt('features/achv.56'), tier: 1, v: pd => pd.stats.deaths, g: 100 },
  { id: 't10', t: tt('features/achv.57'), d: tt('features/achv.58'), tier: 1, v: pd => pd.stats.time, g: 36000 },
  { id: 't100', t: tt('features/achv.59'), d: tt('features/achv.60'), tier: 3, v: pd => pd.stats.time, g: 360000 },
  ...CHAPTERS.flatMap(ch => (ch && ch.ach) || []), // 2~4장 업적 (src/chapters/chN.js)
  { id: 'lp30', t: tt('features/achv.61'), d: tt('features/achv.62'), tier: 3, v: pd => loopsTotal(pd), g: 30 },
  { id: 'lp50', t: tt('features/achv.63'), d: tt('features/achv.64'), tier: 4, v: pd => loopsTotal(pd), g: 50 },
  { id: 'lp100', t: tt('features/achv.65'), d: tt('features/achv.66'), tier: 4, v: pd => loopsTotal(pd), g: 100 },
  { id: 'tw10', t: tt('features/achv.67'), d: tt('features/achv.68'), tier: 2, v: pd => towerBest(pd), g: 10 },
  { id: 'tw30', t: tt('features/achv.69'), d: tt('features/achv.70'), tier: 3, v: pd => towerBest(pd), g: 30 },
  { id: 'tw50', t: tt('features/achv.71'), d: tt('features/achv.72'), tier: 4, v: pd => towerBest(pd), g: 50 },
  // 한정 칭호 (가진 사람만 목록에 보임, 업적 보상 없음)
  { id: 'beta', t: tt('features/achv.73'), d: tt('features/achv.74'), tier: 4, sp: 1, v: pd => pd.pack && pd.pack.got ? 1 : 0, g: 1 },
];
export const ACH_BY = Object.fromEntries(ACH.map(a => [a.id, a]));
const achGoal = (a, pd) => typeof a.g === 'function' ? a.g(pd) : a.g;
const achDone = (pd, a) => { try { return a.v(pd) >= achGoal(a, pd); } catch (e) { return false; } };
/** 칭호 이름표 HTML (모르는 id면 빈 문자열) */
export const achTag = id => { const a = id && ACH_BY[id]; return a ? `<span class="ttag t${a.tier}">${a.t}</span>` : ''; };
/** 새로 깬 업적 등록 + 강화석 지급. 여러 개면 한 번에 알림 */
function achvCheck() {
  const pd = G.pd; if (FORCE_EASY || !pd || !pd.stats) return;
  pd.ach = pd.ach || {}; const got = [];
  for (const a of ACH) if (!pd.ach[a.id] && achDone(pd, a)) { pd.ach[a.id] = Date.now(); pd.stones = (pd.stones || 0) + (a.sp ? 0 : ACH_REW[a.tier]); got.push(a); }
  if (!got.length) return;
  pd.achNew = true; saveGame(); sfx('lvl');
  const st = got.reduce((s, a) => s + (a.sp ? 0 : ACH_REW[a.tier]), 0);
  if (got.length === 1) toast(tt('features/achv.75', { t: got[0].t, st }), 'lvl');
  else toast(tt('features/achv.76', { length: got.length, st }), 'lvl');
  if (!$('#menu').hidden && MTAB === 'achv') renderMenu();
}
export function achvHtml(pd) {
  pd.achNew = false; const own = pd.ach || {}, n = ACH.filter(a => own[a.id] && !a.sp).length, NA = ACH.filter(a => !a.sp).length, cur = pd.title && own[pd.title] ? pd.title : '';
  let h = tt('features/achv.77', { n, NA })
    + tt('features/achv.84', { v1: cur ? achTag(cur) : tt('features/achv.78'), v2: cur ? tt('features/achv.79') : '' });
  const list = ACH.filter(a => !a.sp || own[a.id]).sort((x, y) => (own[y.id] ? 1 : 0) - (own[x.id] ? 1 : 0) || x.tier - y.tier);
  for (const a of list) {
    const ok = !!own[a.id], g = achGoal(a, pd), v = Math.min(g, Math.floor(a.v(pd) || 0)), on = cur === a.id;
    h += `<div class="ach${ok ? ' ok' : ''}${on ? ' on' : ''}"><i class="am t${a.tier}">${ACH_TIER[a.tier][0]}</i><span><b>${ok ? achTag(a.id) : `<span class="ttag lock">${a.t}</span>`}</b><small>${a.d}${a.sp ? tt('features/achv.80') : tt('features/achv.81') + ACH_REW[a.tier]}</small>`
      + (ok ? '' : `<em class="abar"><u style="width:${Math.round(v / g * 100)}%"></u></em><small>${a.id[0] === 't' ? fmtTime(v) + ' / ' + fmtTime(g) : v.toLocaleString() + ' / ' + g.toLocaleString()}</small>`) + '</span>'
      + (ok ? (on ? tt('features/achv.82') : tt('features/achv.83', { id: a.id })) : '') + '</div>';
  }
  return h;
}
export function achvBoot() { if (FORCE_EASY) return; setInterval(() => { try { if (G.state === 'play' || G.state === 'menu' || G.state === 'lobbyMenu') achvCheck(); } catch (e) { } }, 1000); }
