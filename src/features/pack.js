// ===================== 뉴비 패키지 (베타 기간 무료) =====================
// 처음 본 순간부터 24시간 동안만 받을 수 있음. 시간이 지나도 의미가 남는 것: 자동사냥 시간·강화석·한정 헤어·한정 칭호



import { ICONS } from '../draw/sprites.js';
import { $ } from '../sys/dom.js';
import { iconURL } from '../draw/sprite.js';
import { sfx } from '../sys/audio.js';
import { HAIRS, ITEMS, defOf } from '../core/data.js';
import { G } from '../core/state.js';
import { SAVEKEY, loadGame, saveGame } from '../core/save.js';
import { addItem } from '../core/items.js';
import { itemURL } from '../draw/render.js';
import { TITLE_PD, showTitle } from '../ui/lobby.js';
import { PXI, rewardCards } from '../net/rank.js';
import { achTag } from './achv.js';
import { tt } from '../sys/i18n.js';

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
export function packTileHtml(pd) { const ms = packLeft(pd); if (ms <= 0) return pack2TileHtml(pd); return ms > 0 ? tt('features/pack.1', { v1: `<img src="${iconURL('px_gift', ICONS.gift)}" alt="">`, v2: packLeftTxt(ms) }) : ''; }
function packItemsHtml() {
  const hr = HAIRS.find(h => h.k === PACK.hair);
  return rewardCards([{ kind: 'auto', amount: PACK.auto }, { kind: 'stones', amount: PACK.stones }], true)
    + tt('features/pack.2', { h: hr.h, H: hr.H, name: hr.name })
    + tt('features/pack.3', { v1: achTag(PACK.title) });
}
export function packOpen() {
  const pd = loadGame(), ms = packLeft(pd); if (!pd || ms <= 0) { showTitle(); return; }
  $('#packBody').innerHTML = tt('features/pack.4', { v1: PXI('gift'), v2: packLeftTxt(ms), v3: packItemsHtml() })
    + tt('features/pack.5', { price: PACK.price });
  $('#packGo').onclick = packClaim; $('#pack').hidden = false; sfx('select');
}
function packClaim() {
  const pd = loadGame(); if (!pd || packLeft(pd) <= 0) { $('#pack').hidden = true; showTitle(); return; }
  pd.autoBonus = (pd.autoBonus || 0) + PACK.auto; pd.stones = (pd.stones || 0) + PACK.stones;
  pd.pack = Object.assign({}, pd.pack, { got: Date.now() }); pd.ach = Object.assign({}, pd.ach, { [PACK.title]: Date.now() });
  if (!pd.title) pd.title = PACK.title;
  G.pd = pd; saveGame(); sfx('lvl');
  $('#packBody').innerHTML = tt('features/pack.6', { v1: PXI('gift'), v2: packItemsHtml() });
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
function pack2TileHtml(pd) { const ms = pack2Left(pd); return ms > 0 ? tt('features/pack.7', { v1: iconURL('px_gift', ICONS.gift), v2: packLeftTxt(ms) }) : ''; }
function pack2ItemsHtml() {
  const it = ITEMS[PACK2.weapon];
  return tt('features/pack.8', { v1: itemURL(PACK2.weapon), rar: it.rar, name: it.name, enh: PACK2.enh })
    + rewardCards([{ kind: 'stones', amount: PACK2.stones }, { kind: 'gold', amount: PACK2.gold }], true);
}
export function pack2Open() {
  const pd = loadGame(), ms = pack2Left(pd); if (!pd || ms <= 0) { showTitle(); return; }
  $('#packBody').innerHTML = tt('features/pack.9', { v1: PXI('gift'), v2: packLeftTxt(ms), v3: pack2ItemsHtml() })
    + tt('features/pack.5', { price: PACK2.price });
  $('#packGo').onclick = pack2Claim; $('#pack').hidden = false; sfx('select');
}
function pack2Claim() {
  const pd = loadGame(); if (!pd || pack2Left(pd) <= 0) { $('#pack').hidden = true; showTitle(); return; }
  const id = PACK2.weapon, it = ITEMS[id], k = addItem(pd, id, PACK2.enh); // 이미 있어도 +10 하나 더 (개별 장비)
  const cur = ITEMS[pd.eq.weapon]; if (!cur || (cur.atk || 0) < it.atk) pd.eq.weapon = k; else pd.newItem = true;
  pd.stones = (pd.stones || 0) + PACK2.stones; pd.gold += PACK2.gold;
  pd.pack2 = Object.assign({}, pd.pack2, { got: Date.now() });
  G.pd = pd; saveGame(); sfx('lvl');
  $('#packBody').innerHTML = tt('features/pack.12', { v1: PXI('gift'), v2: pack2ItemsHtml(), v3: defOf(pd.eq.weapon) === id ? tt('features/pack.10') : tt('features/pack.11') });
}
