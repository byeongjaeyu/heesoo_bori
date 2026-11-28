// ===================== 경매장 (서버 supabase/auction.sql, 거래 기반 trade.js 위) =====================
// 로비 왼쪽 「경매장」 → #auc. 둘러보기(부위·등급·정렬, 입찰·즉시 구매) / 판매하기(전설↑ 안 낀 장비 올리기) / 내 경매(판매 중·입찰 중·최근 결과).
// 입찰 골드·올린 장비는 서버가 보관. 밀린 입찰 골드·판매 대금(수수료 5% 뺌)은 선물함, 낙찰·유찰 장비는 받을 장비로 들어옴.



import { ICONS } from '../draw/sprites.js';
import { $, numF } from '../sys/dom.js';
import { iconURL } from '../draw/sprite.js';
import { sfx } from '../sys/audio.js';
import { ITEMS, RARITY, SLOTNAME, defOf } from '../core/data.js';
import { refLineTxt } from '../core/refine.js';
import { G } from '../core/state.js';
import { loadGame } from '../core/save.js';
import { dropItem } from '../core/items.js';
import { itemURL } from '../draw/render.js';
import { toast } from '../ui/dialog.js';
import { confirmBox } from '../ui/menu.js';
import { showTitle } from '../ui/lobby.js';
import { PV, SB, esc, pvErr, pvpLoadMe, sbInit } from './pvp.js';
import { claimGifts } from './rank.js';
import { cloudSync } from './cloud.js';
import { TRADE_ERR, tradableKey, tradeClaim, tradeWithPd } from './trade.js';
import { xcClick, xcHtml, xcInput, xcLoad } from './xchg.js';
import { RULES } from '../core/rules.js';
import { tt } from '../sys/i18n.js';

const AUC_FEE = RULES.auc.fee, AUC_HOURS = RULES.auc.hours; // 서버 hb_auc_* 와 같은 값 (core/rules.js)
export const AUC = { tab: 'browse', slot: '', rar: 3, sort: 'end', list: /** @type {any[]} */ ([]), mine: /** @type {any} */ (null), sel: /** @type {string|null} */ (null), bidFor: /** @type {string|null} */ (null), hours: 24, busy: false, err: '' };
const AUC_SLOTS = [['', tt('net/auction.1')], ['weapon', tt('net/auction.2')], ['hat', tt('net/auction.3')], ['armor', tt('net/auction.4')], ['shoes', tt('net/auction.5')], ['bag', tt('net/auction.6')], ['bori', tt('net/auction.7')]];
const AUC_RARS = [[3, tt('net/auction.8')], [4, tt('net/auction.9')], [5, tt('net/auction.10')]];
const AUC_SORTS = [['end', tt('net/auction.11')], ['low', tt('net/auction.12')], ['high', tt('net/auction.13')], ['new', tt('net/auction.14')]];
export const AUC_ERR = Object.assign({}, TRADE_ERR, { nick: tt('net/auction.15'), hours: tt('net/auction.16'), price: tt('net/auction.17', { v1: RULES.auc.minStart.toLocaleString() }),
  too_many: tt('net/auction.18', { maxOpen: RULES.auc.maxOpen }), closed: tt('net/auction.19'), own: tt('net/auction.20'), top: tt('net/auction.21'), has_bids: tt('net/auction.22'), balance: tt('net/auction.23') });
const aucErr = r => r && r.reason === 'low' ? tt('net/auction.24', { v1: Number(r.min).toLocaleString() }) : (AUC_ERR[r && r.reason] || tt('net/auction.25'));
export const aucG = n => Number(n || 0).toLocaleString() + 'G';
export function aucLeft(iso) { const s = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000)); if (s <= 0) return tt('net/auction.26'); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? tt('net/auction.27', { h, m }) : m ? tt('net/auction.28', { m }) : tt('net/auction.29', { s }); }
export const aucRefTxt = ref => ref && ref.lines && ref.lines.length ? tt('net/auction.30', { v1: ref.lines.map(l => `<b class="g${l.g}">${refLineTxt(l)}</b>`).join(' · ') }) : '';
export const aucPd = () => G.pd || loadGame();
/** 쉼표 들어간 입력칸 값 → 숫자 (비었으면 NaN) */
export const numVal = (/** @type {string} */ sel) => { const v = String((/** @type {HTMLInputElement} */ ($(sel)) || { value: '' }).value).replace(/[^\d]/g, ''); return v ? Number(v) : NaN; };
/** 시작가 추천 (등급별) */
const aucSuggest = rar => [0, 0, 0, 10000, 50000, 200000][rar] || 10000;

export async function aucOpen() {
  if (FORCE_EASY) return; const pd = aucPd(); if (!pd) return;
  await sbInit().catch(() => null);
  if (!PV.me) await pvpLoadMe().catch(() => null);
  if (!PV.me) { toast(AUC_ERR.nick, 'warn'); return; }
  AUC.tab = 'browse'; AUC.sel = null; AUC.bidFor = null; AUC.err = '';
  $('#auc').hidden = false; aucLoad();
}
export function aucClose() { $('#auc').hidden = true; if (!G.pd && G.state === 'title' && !$('#title').hidden) showTitle(); }
/** 받을 것(밀린 입찰 골드·대금·장비) 먼저 받고 목록 불러오기 */
export async function aucLoad() {
  $('#aucBody').innerHTML = tt('net/auction.31'); aucHead();
  try {
    await claimGifts(aucPd()).catch(() => { }); await tradeClaim().catch(() => 0);
    if (AUC.tab === 'browse') { const { data, error } = await SB.rpc('hb_auc_browse', { p_slot: AUC.slot, p_rar: AUC.rar, p_sort: AUC.sort }); if (error) throw error; AUC.list = data || []; }
    else if (AUC.tab === 'mine') { const { data, error } = await SB.rpc('hb_auc_mine'); if (error) throw error; AUC.mine = data || {}; }
    else if (AUC.tab === 'xchg') await xcLoad();
    AUC.err = '';
  } catch (e) { AUC.err = tt('net/auction.32') + pvErr(e); }
  aucRender();
}
function aucHead() {
  const pd = aucPd(); $('#aucGold').innerHTML = pd ? `<img src="${iconURL('i_coin', ICONS.coin)}" alt="">${aucG(pd.gold)}` : '';
  document.querySelectorAll('#auc [data-auc-tab]').forEach(b => b.classList.toggle('on', b.getAttribute('data-auc-tab') === AUC.tab));
}
const aucRow = (lb, chips) => `<div class="aucf"><span class="lb">${lb}</span><div class="cs">${chips}</div></div>`;
const aucChip = (grp, v, t, on) => `<button class="aucchip${on ? ' on' : ''}" data-auc="${grp}" data-v="${v}">${t}</button>`;
function aucItemHtml(def, rar, enh, ilv, ref, extra) {
  const it = ITEMS[def]; if (!it) return '';
  return `<div class="ic"><img src="${itemURL(def)}" alt=""></div><div class="mid"><div class="nm"><span class="r${rar}">${it.name}${enh ? ' +' + enh : ''}</span>${ilv ? ` <small class="ilv">Lv.${ilv}</small>` : ''}</div><div class="ds">${RARITY[rar]} · ${SLOTNAME[it.slot] || ''}${aucRefTxt(ref)}${extra || ''}</div></div>`;
}
export function aucRender() {
  aucHead(); const b = $('#aucBody'); let h = AUC.err ? `<p class="aucmsg warn">${esc(AUC.err)}</p>` : '';
  if (AUC.tab === 'browse') {
    h += `<div class="aucfil">${aucRow(tt('net/auction.33'), AUC_SLOTS.map(([v, t]) => aucChip('slot', v, t, AUC.slot === v)).join(''))}`
      + aucRow(tt('net/auction.34'), AUC_RARS.map(([v, t]) => aucChip('rar', v, t, AUC.rar === v)).join(''))
      + aucRow(tt('net/auction.35'), AUC_SORTS.map(([v, t]) => aucChip('sort', v, t, AUC.sort === v)).join('')) + '</div>';
    if (!AUC.list.length && !AUC.err) h += tt('net/auction.36');
    for (const a of AUC.list) {
      const now = a.bid ? tt('net/auction.37', { v1: aucG(a.bid), bids: a.bids }) : tt('net/auction.38', { v1: aucG(a.start) });
      const info = tt('net/auction.75', { now, v1: a.buyout ? tt('net/auction.39', { v1: aucG(a.buyout) }) : '', v2: esc(a.seller), v3: aucLeft(a.ends) });
      let act;
      if (a.mine) act = tt('net/auction.40');
      else if (a.top) act = tt('net/auction.41');
      else if (AUC.bidFor === a.id) act = tt('net/auction.42', { v1: numF(a.min), id: a.id });
      else act = tt('net/auction.76', { id: a.id, v1: aucG(a.min), v2: a.buyout ? tt('net/auction.43', { id: a.id }) : '' });
      h += `<div class="card aucc">${aucItemHtml(a.def, a.rar, a.enh, a.ilv, a.ref, info)}<div class="aucact">${act}</div></div>`;
    }
  } else if (AUC.tab === 'sell') {
    const pd = aucPd(), eqd = new Set([...Object.values(pd.eq), ...Object.values(pd.beq || {})]);
    const keys = Object.keys(pd.inv).filter(k => tradableKey(k) && !eqd.has(k)).sort((x, y) => ITEMS[y].rar - ITEMS[x].rar || ((pd.enh || {})[y] || 0) - ((pd.enh || {})[x] || 0));
    h += tt('net/auction.44', { v1: AUC_FEE * 100 });
    if (!keys.length) h += tt('net/auction.45');
    for (const k of keys) {
      const it = ITEMS[k], en = (pd.enh || {})[k] || 0, ilv = (pd.ilv || {})[k] || 0, ref = (pd.ref || {})[k];
      let act = tt('net/auction.46', { k });
      if (AUC.sel === k) act = tt('net/auction.47', { v1: numF(aucSuggest(it.rar)) })
        + tt('net/auction.48')
        + aucRow(tt('net/auction.49'), AUC_HOURS.map(hr => aucChip('hours', hr, hr + tt('net/auction.50'), AUC.hours === hr)).join(''))
        + tt('net/auction.51', { k });
      h += `<div class="card aucc${AUC.sel === k ? ' open' : ''}">${aucItemHtml(defOf(k), it.rar, en, ilv, ref)}<div class="aucact">${act}</div></div>`;
    }
  } else if (AUC.tab === 'xchg') {
    h += xcHtml();
  } else {
    const M = AUC.mine || {}, sell = M.selling || [], bid = M.bidding || [], done = M.done || [];
    h += tt('net/auction.52', { length: sell.length }) + (sell.length ? '' : tt('net/auction.53'));
    for (const a of sell) h += `<div class="card aucc">${aucItemHtml(a.def, a.rar, a.enh, 0, null, tt('net/auction.77', { v1: a.bid ? tt('net/auction.37', { v1: aucG(a.bid), bids: a.bids }) : tt('net/auction.54', { v1: aucG(a.start) }), v2: a.buyout ? tt('net/auction.55', { v1: aucG(a.buyout) }) : '', v3: aucLeft(a.ends) }))}<div class="aucact">${a.bids ? '' : tt('net/auction.56', { id: a.id })}</div></div>`;
    h += tt('net/auction.57', { length: bid.length }) + (bid.length ? '' : tt('net/auction.58'));
    for (const a of bid) h += tt('net/auction.79', { v1: aucItemHtml(a.def, a.rar, a.enh, 0, null, tt('net/auction.78', { v1: aucG(a.bid), v2: a.buyout ? tt('net/auction.55', { v1: aucG(a.buyout) }) : '', v3: aucLeft(a.ends) })) });
    if (done.length) { h += tt('net/auction.59'); for (const a of done) { const t = a.state === 'sold' ? (a.sold ? tt('net/auction.60', { v1: aucG(a.price), v2: aucG(a.price - a.fee) }) : tt('net/auction.61', { v1: aucG(a.price) })) : a.state === 'expired' ? tt('net/auction.62') : tt('net/auction.63'); h += `<div class="card aucc done">${aucItemHtml(a.def, a.rar, a.enh, 0, null, `<br><small>${t}</small>`)}</div>`; } }
  }
  b.innerHTML = h;
}
async function aucBid(id, amt, isBuy) {
  if (AUC.busy) return; const pd = aucPd(); amt = Math.floor(Number(amt));
  if (!(amt > 0)) { toast(tt('net/auction.64'), 'warn'); return; }
  if ((pd.gold || 0) < amt) { toast(AUC_ERR.balance, 'warn'); return; }
  AUC.busy = true;
  try {
    if (!(await cloudSync(true))) { toast(TRADE_ERR.sync, 'warn'); return; }
    const { data, error } = await SB.rpc('hb_auc_bid', { p_id: id, p_amount: amt }); if (error) throw error;
    if (!data || !data.ok) { toast(aucErr(data), 'warn'); if (data && data.reason === 'low') aucLoad(); return; }
    tradeWithPd(p => { p.gold = Math.max(0, (p.gold || 0) - data.bid); }); cloudSync(true);
    sfx('coin'); toast(data.bought ? tt('net/auction.65', { v1: aucG(data.bid) }) : tt('net/auction.66', { v1: aucG(data.bid) }), 'lvl');
    AUC.bidFor = null; if (data.bought) await tradeClaim().catch(() => 0);
  } catch (e) { toast(tt('net/auction.67') + pvErr(e), 'warn'); }
  finally { AUC.busy = false; }
  aucLoad();
}
async function aucSell(k) {
  if (AUC.busy) return; const pd = aucPd(), it = ITEMS[k];
  const start = numVal('#aucStart'), bv = numVal('#aucBuy'), buy = Number.isNaN(bv) ? null : bv;
  if (!(start >= RULES.auc.minStart) || (buy !== null && !(buy >= start))) { toast(AUC_ERR.price, 'warn'); return; }
  if (!pd.inv[k] || Object.values(pd.eq).includes(k) || Object.values(pd.beq || {}).includes(k)) { toast(TRADE_ERR.equipped, 'warn'); return; }
  AUC.busy = true;
  try {
    if (!(await cloudSync(true))) { toast(TRADE_ERR.sync, 'warn'); return; }
    const { data, error } = await SB.rpc('hb_auc_list', { p_key: k, p_start: start, p_buyout: buy, p_hours: AUC.hours }); if (error) throw error;
    if (!data || !data.ok) { toast(aucErr(data), 'warn'); return; }
    tradeWithPd(p => { dropItem(p, k); (p.tkeys = p.tkeys || []).push(k); }); cloudSync(true);
    sfx('ding'); toast(tt('net/auction.68', { name: it.name, hours: AUC.hours }), 'lvl'); AUC.sel = null; AUC.tab = 'mine';
  } catch (e) { toast(tt('net/auction.69') + pvErr(e), 'warn'); }
  finally { AUC.busy = false; }
  aucLoad();
}
async function aucCancel(id) {
  try { const { data, error } = await SB.rpc('hb_auc_cancel', { p_id: id }); if (error) throw error; if (!data || !data.ok) { toast(aucErr(data), 'warn'); return; } toast(tt('net/auction.70'), 'sub'); }
  catch (e) { toast(tt('net/auction.71') + pvErr(e), 'warn'); }
  aucLoad();
}
export function aucBoot() {
  if (FORCE_EASY) return;
  // 숫자 입력칸: 치는 동안 쉼표 넣기
  $('#auc').addEventListener('input', e => { const i = /** @type {HTMLInputElement} */ (e.target); if (!i.classList || !i.classList.contains('numin')) return; const d = i.value.replace(/[^\d]/g, '').slice(0, 10); i.value = d ? numF(+d) : ''; });
  $('#auc').addEventListener('input', e => xcInput(/** @type {HTMLInputElement} */ (e.target)));
  $('#auc').addEventListener('click', e => {
    const t = /** @type {HTMLElement} */ (e.target), tb = t.closest('[data-auc-tab]');
    if (tb) { AUC.tab = /** @type {string} */ (tb.getAttribute('data-auc-tab')); AUC.sel = null; AUC.bidFor = null; sfx('select'); if (AUC.tab === 'sell') aucRender(); else aucLoad(); return; }
    const b = t.closest('[data-auc]'); if (!b) return; const m = b.getAttribute('data-auc'), v = b.getAttribute('data-v') || '';
    if (m === 'close') return aucClose();
    if (xcClick(m, v)) return;
    if (m === 'slot') { AUC.slot = v; return aucLoad(); }
    if (m === 'rar') { AUC.rar = +v; return aucLoad(); }
    if (m === 'sort') { AUC.sort = v; return aucLoad(); }
    if (m === 'hours') { AUC.hours = +v; document.querySelectorAll('#auc [data-auc="hours"]').forEach(x => x.classList.toggle('on', x === b)); return; }
    if (m === 'bid') { AUC.bidFor = v; aucRender(); const i = /** @type {HTMLInputElement} */ ($('#aucAmt')); if (i) i.focus(); return; }
    if (m === 'bidX') { AUC.bidFor = null; return aucRender(); }
    if (m === 'bidGo') { const a = AUC.list.find(x => x.id === v), amt = numVal('#aucAmt'); if (a && a.buyout && amt >= a.buyout) { confirmBox(tt('net/auction.72', { v1: aucG(a.buyout) }), () => aucBid(v, a.buyout, true)); return; } return aucBid(v, amt, false); }
    if (m === 'buy') { const a = AUC.list.find(x => x.id === v); if (!a) return; confirmBox(tt('net/auction.73', { name: ITEMS[a.def].name, v1: a.enh ? ' +' + a.enh : '', v2: aucG(a.buyout) }), () => aucBid(v, a.buyout, true)); return; }
    if (m === 'sel') { AUC.sel = v; return aucRender(); }
    if (m === 'selX') { AUC.sel = null; return aucRender(); }
    if (m === 'sellGo') { const it = ITEMS[v]; confirmBox(tt('net/auction.74', { name: it.name }), () => aucSell(v)); return; }
    if (m === 'cancel') return aucCancel(v);
  });
}
