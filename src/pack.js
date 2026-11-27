// ===================== 뉴비 패키지 (베타 기간 무료) =====================
// 처음 본 순간부터 24시간 동안만 받을 수 있음. 시간이 지나도 의미가 남는 것: 자동사냥 시간·강화석·한정 헤어·한정 칭호
import { ICONS } from './sprites.js';
import { $, iconURL, sfx } from './engine.js';
import { HAIRS, ITEMS, defOf } from './data.js';
import { G, SAVEKEY, addItem, loadGame, saveGame } from './game.js';
import { itemURL } from './render.js';
import { TITLE_PD, showTitle } from './ui.js';
import { PXI, rewardCards } from './rank.js';
import { achTag } from './achv.js';

const PACK_MS = 24 * 3600 * 1000, PACK = { auto: 3 * 3600, stones: 300, hair: 'lavender', title: 'beta', price: '₩1,000' };
ICONS.gift = ['..KK...KK..', '.KQQK.KQQK.', '.KQQQKQQQK.', 'KKKKKKKKKKK', 'KQQQQRQQQQK', 'KKKKKRKKKKK', '.KQQQRQQQK.', '.KQQQRQQQK.', '.KQQQRQQQK.', '.KKKKKKKKK.'];
/** 남은 시간(ms). 이미 받았거나 끝났으면 0 */
const packLeft = pd => { if (FORCE_EASY || !pd) return 0; const p = pd.pack || {}; if (p.got) return 0; if (!p.seen) return PACK_MS; return Math.max(0, p.seen + PACK_MS - Date.now()); };
const packLeftTxt = ms => { const m = Math.ceil(ms / 60000); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
/** 로비에서 처음 보는 순간을 기록 (세이브에 바로 저장) */
export function packSeen(saved) {
  if (FORCE_EASY || !saved || (saved.pack && saved.pack.seen)) return;
  saved.pack = Object.assign({}, saved.pack, { seen: Date.now() });
  try { localStorage.setItem(SAVEKEY, JSON.stringify(saved)); } catch (e) { }
  if (G.pd && G.pd !== saved && G.pd.sid === saved.sid) G.pd.pack = Object.assign({}, saved.pack);
}
export function packTileHtml(pd) { const ms = packLeft(pd); if (ms <= 0) return pack2TileHtml(pd); return ms > 0 ? `<button class="ticon tpack" id="tPack">${`<img src="${iconURL('px_gift', ICONS.gift)}" alt="">`}<small>뉴비 패키지</small><b class="tpt">${packLeftTxt(ms)}</b><em class="dot"></em></button>` : ''; }
function packItemsHtml() {
  const hr = HAIRS.find(h => h.k === PACK.hair);
  return rewardCards([{ kind: 'auto', amount: PACK.auto }, { kind: 'stones', amount: PACK.stones }], true)
    + `<div class="rwcs big pkx"><div class="rwc"><i class="hsw" style="background:linear-gradient(135deg,${hr.h},${hr.H})"></i><b>${hr.name}</b><small>한정 헤어</small></div>`
    + `<div class="rwc"><span class="pkt">${achTag(PACK.title)}</span><b>칭호</b><small>한정 레전드</small></div></div>`;
}
export function packOpen() {
  const pd = loadGame(), ms = packLeft(pd); if (!pd || ms <= 0) { showTitle(); return; }
  $('#packBody').innerHTML = `<div class="sgot"><div class="sbig">${PXI('gift')}</div><h2>뉴비 패키지 <em>BETA</em></h2><p class="smsub">처음 오신 희수님께 드리는 24시간 한정 패키지<br>남은 시간 <b>${packLeftTxt(ms)}</b></p>${packItemsHtml()}`
    + `<div class="pkprice"><s>${PACK.price}</s><b>베타 기간 무료!</b></div><button class="btn pk" id="packGo">무료로 받기</button></div>`;
  $('#packGo').onclick = packClaim; $('#pack').hidden = false; sfx('select');
}
function packClaim() {
  const pd = loadGame(); if (!pd || packLeft(pd) <= 0) { $('#pack').hidden = true; showTitle(); return; }
  pd.autoBonus = (pd.autoBonus || 0) + PACK.auto; pd.stones = (pd.stones || 0) + PACK.stones;
  pd.pack = Object.assign({}, pd.pack, { got: Date.now() }); pd.ach = Object.assign({}, pd.ach, { [PACK.title]: Date.now() });
  if (!pd.title) pd.title = PACK.title;
  G.pd = pd; saveGame(); sfx('lvl');
  $('#packBody').innerHTML = `<div class="sgot"><div class="sbig">${PXI('gift')}</div><h2>뉴비 패키지<br><em>받았어요!</em></h2>${packItemsHtml()}<p class="smsub">헤어는 메뉴 「꾸미기」, 칭호는 「칭호」에서 바꿀 수 있어요</p></div>`;
}
export function packBoot() {
  if (FORCE_EASY) return;
  $('#packX').onclick = () => { $('#pack').hidden = true; showTitle(); };
  setInterval(() => { try { const b = $('#tPack'); if (b && G.state === 'title' && TITLE_PD) { const ms = packLeft(TITLE_PD); if (ms <= 0) b.remove(); else b.querySelector('.tpt').textContent = packLeftTxt(ms); } } catch (e) { } }, 30000);
}

// ===================== 성장 패키지 (뉴비 세트 2, 베타 기간 무료) =====================
// 1장을 깨거나 Lv10이 되면(첫 패키지가 끝난 뒤) 48시간. 첫 벽(1장 4회차 보스 근처)을 넘게 도와주는 영웅 무기 +10 · 강화석 · 골드
const PACK2_MS = 48 * 3600 * 1000, PACK2 = { weapon: 'lightstick', enh: 10, stones: 500, gold: 300000, price: '₩3,300' };
const pack2Open_ = pd => !!pd && (pd.lv >= 10 || (pd.cleared || 0) >= 1) && packLeft(pd) <= 0;
const pack2Left = pd => { if (FORCE_EASY || !pack2Open_(pd)) return 0; const p = pd.pack2 || {}; if (p.got) return 0; if (!p.seen) return PACK2_MS; return Math.max(0, p.seen + PACK2_MS - Date.now()); };
export function pack2Seen(saved) {
  if (FORCE_EASY || !pack2Open_(saved) || (saved.pack2 && saved.pack2.seen)) return;
  saved.pack2 = Object.assign({}, saved.pack2, { seen: Date.now() });
  try { localStorage.setItem(SAVEKEY, JSON.stringify(saved)); } catch (e) { }
  if (G.pd && G.pd !== saved && G.pd.sid === saved.sid) G.pd.pack2 = Object.assign({}, saved.pack2);
}
function pack2TileHtml(pd) { const ms = pack2Left(pd); return ms > 0 ? `<button class="ticon tpack" id="tPack2"><img src="${iconURL('px_gift', ICONS.gift)}" alt=""><small>성장 패키지</small><b class="tpt">${packLeftTxt(ms)}</b><em class="dot"></em></button>` : ''; }
function pack2ItemsHtml() {
  const it = ITEMS[PACK2.weapon];
  return `<div class="rwcs big pkx"><div class="rwc"><img src="${itemURL(PACK2.weapon)}" alt=""><b class="r${it.rar}">${it.name} +${PACK2.enh}</b><small>영웅 무기</small></div></div>`
    + rewardCards([{ kind: 'stones', amount: PACK2.stones }, { kind: 'gold', amount: PACK2.gold }], true);
}
export function pack2Open() {
  const pd = loadGame(), ms = pack2Left(pd); if (!pd || ms <= 0) { showTitle(); return; }
  $('#packBody').innerHTML = `<div class="sgot"><div class="sbig">${PXI('gift')}</div><h2>성장 패키지 <em>BETA</em></h2><p class="smsub">막히기 시작할 때 힘이 되는 48시간 한정 패키지<br>남은 시간 <b>${packLeftTxt(ms)}</b></p>${pack2ItemsHtml()}`
    + `<div class="pkprice"><s>${PACK2.price}</s><b>베타 기간 무료!</b></div><button class="btn pk" id="packGo">무료로 받기</button></div>`;
  $('#packGo').onclick = pack2Claim; $('#pack').hidden = false; sfx('select');
}
function pack2Claim() {
  const pd = loadGame(); if (!pd || pack2Left(pd) <= 0) { $('#pack').hidden = true; showTitle(); return; }
  const id = PACK2.weapon, it = ITEMS[id], k = addItem(pd, id, PACK2.enh); // 이미 있어도 +10 하나 더 (개별 장비)
  const cur = ITEMS[pd.eq.weapon]; if (!cur || (cur.atk || 0) < it.atk) pd.eq.weapon = k; else pd.newItem = true;
  pd.stones = (pd.stones || 0) + PACK2.stones; pd.gold += PACK2.gold;
  pd.pack2 = Object.assign({}, pd.pack2, { got: Date.now() });
  G.pd = pd; saveGame(); sfx('lvl');
  $('#packBody').innerHTML = `<div class="sgot"><div class="sbig">${PXI('gift')}</div><h2>성장 패키지<br><em>받았어요!</em></h2>${pack2ItemsHtml()}<p class="smsub">${defOf(pd.eq.weapon) === id ? '무기는 바로 착용했어요!' : '무기는 메뉴 「장비」에 있어요'}</p></div>`;
}
