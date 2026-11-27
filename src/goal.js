// ===================== 회차 보상 단계표 =====================
// 총 회차 = 1장 + 2장 + 3장 클리어 수. 이정표마다 보상 (로비 「회차 보상」에서 받기, 예전 기록도 소급해서 받을 수 있음)
// 보상 종류: stones(강화석) · auto(자동사냥 초) · tr(초월 장비 확정, 다 가졌으면 강화석) · hair(한정 헤어 k). 칭호는 ACH lp30·lp50·lp100 이 자동 달성
import { ICONS } from './sprites.js';
import { $, choice, iconURL, sfx } from './engine.js';
import { HAIRS, ITEMS } from './data.js';
import { G, addItem, loadGame, ownsDef, saveGame } from './game.js';
import { setTitlePd, showTitle, toast } from './ui.js';
import { PXI, fmtGold, rewardCards, seasonModalShow, setSmNext } from './rank.js';
import { achTag } from './achv.js';

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
export const msGot = (pd, n) => !!(pd.ms && pd.ms[n]);
const msReady = pd => msList(pd).filter(m => loopsTotal(pd) >= m.n && !msGot(pd, m.n));
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
    else if (k === 'tr') { const id = giveTr(pd); extra.push(id ? `초월 장비 <b>${ITEMS[id].name}</b> 획득!` : `초월 장비를 다 가지고 있어서 강화석 ${TR_DUP}개로 받았어요`); if (!id) cards.push({ kind: 'stones', amount: TR_DUP }); }
    else if (k === 'hair') { const h = HAIRS.find(x => x.k === v); if (h) extra.push(`한정 헤어 <b>${h.name}</b> 해금! (메뉴 → 꾸미기)`); }
  }
  return { cards, extra };
}
export const rwLabel = r => r.map(([k, v]) => k === 'stones' ? `강화석 ${v.toLocaleString()}` : k === 'auto' ? `자동사냥 ${Math.round(v / 3600)}시간` : k === 'gold' ? `${fmtGold(v)}G` : k === 'tr' ? '초월 장비 확정' : k === 'hair' ? `헤어 「${(HAIRS.find(x => x.k === v) || { name: v }).name}」` : '').filter(Boolean).join(' · ');

// ---------- 로비 타일 · 창 ----------
export function msTileHtml(pd) {
  const ready = msReady(pd).length, nx = msNext(pd);
  return `<button class="tidle tgoal${ready ? ' ready' : ''}" id="tGoal"><em>회차 보상</em><img src="${iconURL('px_rosette', ICONS.rosette)}" alt=""><b>총 ${loopsTotal(pd)}회차</b><small>${ready ? `받기! (${ready})` : nx ? `다음 ${nx.n}회차` : ''}</small>${ready ? '<em class="dot"></em>' : ''}</button>`;
}
export function msOpen() {
  const pd = loadGame(); if (!pd) return; const t = loopsTotal(pd), L = msList(pd), nx = msNext(pd);
  const rows = L.map(m => { const got = msGot(pd, m.n), ok = t >= m.n;
    return `<div class="msrow${got ? ' got' : ok ? ' ok' : ''}"><i>${m.n}</i><div><b>${rwLabel(m.r)}</b>${m.ttl ? `<small>칭호 ${achTag(m.ttl)}</small>` : ''}</div>${got ? '<span>받음</span>' : ok ? `<button class="btn sm pk" onclick="msClaim(${m.n})">받기</button>` : `<span>${m.n - t}회차 남음</span>`}</div>`; }).join('');
  const pct = nx ? Math.min(100, Math.round(t / nx.n * 100)) : 100;
  $('#seasonModalBody').innerHTML = `<h2>회차 보상</h2><p class="smsub">1장·2장·3장을 클리어한 횟수를 모두 더해요<br>지금 <b>총 ${t}회차</b>${nx ? ` · 다음 보상까지 ${nx.n - t}회차` : ''}</p>`
    + `<div class="msbar"><i style="width:${pct}%"></i></div>`
    + (msReady(pd).length > 1 ? `<button class="btn pk msall" onclick="msClaim(0)">한 번에 받기 (${msReady(pd).length}개)</button>` : '')
    + `<div class="mslist">${rows}</div>`;
  setSmNext(() => showTitle()); seasonModalShow();
}
/** n회차 보상 받기 (0이면 받을 수 있는 것 전부) */
function msClaim(n) {
  const pd = loadGame(); if (!pd) return;
  const list = msReady(pd).filter(m => !n || m.n === n); if (!list.length) return;
  pd.ms = pd.ms || {}; let cards = [], extra = [];
  for (const m of list) { pd.ms[m.n] = Date.now(); const r = applyRewards(pd, m.r); cards = cards.concat(r.cards); extra = extra.concat(r.extra); }
  const sum = {}; for (const c of cards) sum[c.kind] = (sum[c.kind] || 0) + c.amount;
  G.pd = pd; saveGame(); setTitlePd(pd); sfx('lvl');
  $('#seasonModalBody').innerHTML = `<div class="sgot"><div class="sbig">${PXI('rosette')}</div><h2>회차 보상<br><em>${list.map(m => m.n + '회차').join(' · ')}</em></h2>`
    + (extra.length ? `<p class="smsub">${extra.join('<br>')}</p>` : '') + rewardCards(Object.entries(sum).map(([kind, amount]) => ({ kind, amount })), true) + '</div>';
  setSmNext(() => msOpen()); seasonModalShow();
}
/** 플레이 중 새 이정표에 닿으면 한 번 알려줌 */
function msWatch() {
  const pd = G.pd; if (!pd || FORCE_EASY) return; const t = loopsTotal(pd);
  if (pd.msSeen === undefined) { pd.msSeen = t; return; }
  if (t > pd.msSeen) { const hit = msList(pd).filter(m => m.n > pd.msSeen && m.n <= t); pd.msSeen = t; if (hit.length) { toast(`총 ${hit[hit.length - 1].n}회차 달성! 로비 「회차 보상」에서 받으세요`, 'lvl'); sfx('lvl'); } }
}
export function goalBoot() { if (FORCE_EASY) return; setInterval(() => { try { if (G.state === 'play' || G.state === 'cut' || G.state === 'end') msWatch(); } catch (e) { } }, 1000); }
