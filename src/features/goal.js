// ===================== 회차 보상 단계표 =====================
// 총 회차 = 1장 + 2장 + 3장 클리어 수. 이정표마다 보상 (로비 「회차 보상」에서 받기, 예전 기록도 소급해서 받을 수 있음)
// 보상 종류: stones(강화석) · auto(자동사냥 초) · tr(초월 장비 확정, 다 가졌으면 강화석) · hair(한정 헤어 k). 칭호는 ACH lp30·lp50·lp100 이 자동 달성



import { ICONS } from '../draw/sprites.js';
import { $ } from '../sys/dom.js';
import { choice } from '../core/util.js';
import { iconURL } from '../draw/sprite.js';
import { sfx } from '../sys/audio.js';
import { HAIRS, ITEMS } from '../core/data.js';
import { G } from '../core/state.js';
import { loadGame, saveGame } from '../core/save.js';
import { addItem, ownsDef } from '../core/items.js';
import { msGot } from '../core/progress.js';
import { toast } from '../ui/dialog.js';
import { setTitlePd, showTitle } from '../ui/lobby.js';
import { PXI, fmtGold, rewardCards, seasonModalShow, setSmNext } from '../net/rank.js';
import { achTag } from './achv.js';
import { tt } from '../sys/i18n.js';

export const loopsTotal = pd => (pd.cleared || 0) + ((pd.ch2 && pd.ch2.cleared) || 0) + ((pd.ch3 && pd.ch3.cleared) || 0) + ((pd.ch4 && pd.ch4.cleared) || 0);
/** @type {{n:number, r:[string, any][], ttl?:string}[]} */
const LOOP_MS = [
  { n: 3, r: [['stones', 30]] },
  { n: 5, r: [['stones', 50], ['auto', 3600]] },
  { n: 10, r: [['stones', 100], ['tr', 1]] },
  { n: 15, r: [['stones', 100], ['auto', 7200]] },
  { n: 20, r: [['stones', 150], ['hair', 'wine']] },
  { n: 30, r: [['stones', 200], ['tr', 1]], ttl: 'lp30' },
  { n: 40, r: [['stones', 300], ['auto', 10800]] },
  { n: 50, r: [['stones', 400], ['tr', 1], ['hair', 'aurora']], ttl: 'lp50' },
  { n: 75, r: [['stones', 500], ['tr', 1]] },
  { n: 100, r: [['stones', 600], ['tr', 1]], ttl: 'lp100' },
];
const TR_DUP = 120; // 초월 장비를 다 가졌으면 대신 주는 강화석
/** 100회차 이후는 25회차마다 강화석 500 + 초월 장비 */
function msList(pd) { const L = LOOP_MS.slice(), t = loopsTotal(pd); for (let n = 125; n <= Math.max(125, t + 25); n += 25) L.push({ n, r: [['stones', 500], ['tr', 1]] }); return L; }
export const msReady = pd => msList(pd).filter(m => loopsTotal(pd) >= m.n && !msGot(pd, m.n));
const msNext = pd => msList(pd).find(m => loopsTotal(pd) < m.n);

/** 초월 장비 하나 지급 (안 가진 것 중에서). 다 있으면 강화석. 돌려주는 값: 받은 장비 id 또는 null */
function giveTr(pd) {
  const pool = Object.keys(ITEMS).filter(id => { const it = ITEMS[id]; return it.rar === 5 && !it.bossOnly && !ownsDef(pd, id) && (!it.bori || pd.boriJoined); });
  if (!pool.length) { pd.stones = (pd.stones || 0) + TR_DUP; return null; }
  const id = choice(pool), it = ITEMS[id], k = addItem(pd, id);
  if (it.bori) { if (!pd.beq[it.slot]) pd.beq[it.slot] = k; else pd.newBori = true; } else pd.newItem = true;
  return id;
}
/** 보상 목록을 세이브에 반영하고, 화면에 보여줄 카드 목록을 돌려줌 */
export function applyRewards(pd, r) {
  const cards = [], extra = [];
  for (const [k, v] of r) {
    if (k === 'stones') { pd.stones = (pd.stones || 0) + v; cards.push({ kind: 'stones', amount: v }); }
    else if (k === 'auto') { pd.autoBonus = (pd.autoBonus || 0) + v; cards.push({ kind: 'auto', amount: v }); }
    else if (k === 'gold') { pd.gold += v; cards.push({ kind: 'gold', amount: v }); }
    else if (k === 'tr') { const id = giveTr(pd); extra.push(id ? tt('features/goal.1', { name: ITEMS[id].name }) : tt('features/goal.2', { TR_DUP })); if (!id) cards.push({ kind: 'stones', amount: TR_DUP }); }
    else if (k === 'hair') { const h = HAIRS.find(x => x.k === v); if (h) extra.push(tt('features/goal.3', { name: h.name })); }
  }
  return { cards, extra };
}
export const rwLabel = r => r.map(([k, v]) => k === 'stones' ? tt('features/goal.4', { v1: v.toLocaleString() }) : k === 'auto' ? tt('features/goal.5', { v1: Math.round(v / 3600) }) : k === 'gold' ? `${fmtGold(v)}G` : k === 'tr' ? tt('features/goal.6') : k === 'hair' ? tt('features/goal.7', { name: (HAIRS.find(x => x.k === v) || { name: v }).name }) : '').filter(Boolean).join(' · ');

// ---------- 로비 타일 · 창 ----------
export function msTileHtml(pd) {
  const ready = msReady(pd).length, nx = msNext(pd);
  return tt('features/goal.18', { v1: ready ? ' ready' : '', v2: iconURL('px_rosette', ICONS.rosette), v3: loopsTotal(pd), v4: ready ? tt('features/goal.21', { ready }) : nx ? tt('features/goal.9', { n: nx.n }) : '', v5: ready ? `<i class="tget">${tt('features/goal.8', { ready })}</i>` : '<i class="tget off">›</i>' });
}
export function msOpen() {
  const pd = loadGame(); if (!pd) return; const t = loopsTotal(pd), L = msList(pd), nx = msNext(pd);
  const rows = L.map(m => { const got = msGot(pd, m.n), ok = t >= m.n;
    return `<div class="msrow${got ? ' got' : ok ? ' ok' : ''}"><i>${m.n}</i><div><b>${rwLabel(m.r)}</b>${m.ttl ? tt('features/goal.10', { v1: achTag(m.ttl) }) : ''}</div>${got ? tt('features/goal.11') : ok ? tt('features/goal.12', { n: m.n }) : tt('features/goal.13', { v1: m.n - t })}</div>`; }).join('');
  const pct = nx ? Math.min(100, Math.round(t / nx.n * 100)) : 100;
  $('#seasonModalBody').innerHTML = tt('features/goal.19', { t, v1: nx ? tt('features/goal.14', { v1: nx.n - t }) : '' })
    + `<div class="msbar"><i style="width:${pct}%"></i></div>`
    + (msReady(pd).length > 1 ? tt('features/goal.15', { length: msReady(pd).length }) : '')
    + `<div class="mslist">${rows}</div>`;
  setSmNext(() => showTitle()); seasonModalShow();
}
/** 이정표 보상을 세이브에 반영 (list 없으면 받을 수 있는 것 전부). 받을 게 없으면 null */
export function msTake(pd, list = msReady(pd)) {
  if (!list.length) return null;
  pd.ms = pd.ms || {}; let cards = [], extra = [];
  for (const m of list) { pd.ms[m.n] = Date.now(); const r = applyRewards(pd, m.r); cards = cards.concat(r.cards); extra = extra.concat(r.extra); }
  return { cards, extra, list };
}
/** n회차 보상 받기 (0이면 받을 수 있는 것 전부) */
function msClaim(n) {
  const pd = loadGame(); if (!pd) return;
  const list = msReady(pd).filter(m => !n || m.n === n); if (!list.length) return;
  const { cards, extra } = msTake(pd, list);
  const sum = {}; for (const c of cards) sum[c.kind] = (sum[c.kind] || 0) + c.amount;
  G.pd = pd; saveGame(); setTitlePd(pd); sfx('lvl');
  $('#seasonModalBody').innerHTML = tt('features/goal.20', { v1: PXI('rosette'), v2: list.map(m => m.n + tt('features/goal.16')).join(' · ') })
    + (extra.length ? `<p class="smsub">${extra.join('<br>')}</p>` : '') + rewardCards(Object.entries(sum).map(([kind, amount]) => ({ kind, amount })), true) + '</div>';
  setSmNext(() => msOpen()); seasonModalShow();
}
/** 플레이 중 새 이정표에 닿으면 한 번 알려줌 */
function msWatch() {
  const pd = G.pd; if (!pd || FORCE_EASY) return; const t = loopsTotal(pd);
  if (pd.msSeen === undefined) { pd.msSeen = t; return; }
  if (t > pd.msSeen) { const hit = msList(pd).filter(m => m.n > pd.msSeen && m.n <= t); pd.msSeen = t; if (hit.length) { toast(tt('features/goal.17', { n: hit[hit.length - 1].n }), 'lvl'); sfx('lvl'); } }
}
export function goalBoot() { if (FORCE_EASY) return; setInterval(() => { try { if (G.state === 'play' || G.state === 'cut' || G.state === 'end') msWatch(); } catch (e) { } }, 1000); }
