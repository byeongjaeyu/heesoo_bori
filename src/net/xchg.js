// ===================== 1:1 교환 (서버 supabase/xchg.sql, 경매장 창 4번째 탭) =====================
// 제안 → 수락. 보내는 사람 물건은 제안할 때 서버 보관, 받는 사람이 수락하면 한 번에 맞바꿈. 거절·취소·24시간 지나면 반환.
// 골드는 받는 쪽에 수수료 5%. 강화석은 교환 안 됨. 장비가 한쪽에라도 하나는 있어야 함. Lv30 + 구글·카카오 연결 계정만. 하루 한도 없음.



import { ICONS } from '../draw/sprites.js';
import { $ } from '../sys/dom.js';
import { iconURL } from '../draw/sprite.js';
import { sfx } from '../sys/audio.js';
import { ITEMS, defOf } from '../core/data.js';
import { dropItem } from '../core/items.js';
import { itemURL } from '../draw/render.js';
import { toast } from '../ui/dialog.js';
import { confirmBox } from '../ui/menu.js';
import { SB, esc, pvErr } from './pvp.js';
import { claimGifts } from './rank.js';
import { cloudOpen, cloudSync } from './cloud.js';
import { TRADE_ERR, tradableKey, tradeClaim, tradeWithPd } from './trade.js';
import { AUC, AUC_ERR, aucClose, aucG, aucLeft, aucLoad, aucPd, aucRefTxt, aucRender, numVal } from './auction.js';
import { RULES } from '../core/rules.js';
import { tt } from '../sys/i18n.js';

const XR = RULES.xchg, XC_FEE = XR.fee, XC_MAX_ITEMS = XR.maxItems; // 서버 hb_xchg_* 와 같은 값 (core/rules.js)
const XC = { mine: /** @type {any} */ (null), partner: /** @type {any} */ (null), nick: '', give: /** @type {string[]} */ ([]), want: /** @type {string[]} */ ([]), gold: '', wantGold: '', msg: '' };
const XC_ERR = { nick: tt('net/xchg.1'), lv: tt('net/xchg.2', { lv: XR.lv }), link: tt('net/xchg.3'),
  no_user: tt('net/xchg.4'), self: tt('net/xchg.5'), empty: tt('net/xchg.6'), no_item: tt('net/xchg.7'),
  gold: tt('net/xchg.8', { minGold: XR.minGold }), want_item: tt('net/xchg.9'), too_many: tt('net/xchg.10', { maxOpen: XR.maxOpen }), too_many_items: tt('net/xchg.11', { XC_MAX_ITEMS }),
  want_gone: tt('net/xchg.12'), closed: tt('net/xchg.13') };
const xcErr = r => { if (r && r.reason === 'partner') return tt('net/xchg.14') + (r.why === 'lv' ? tt('net/xchg.15', { lv: XR.lv }) : r.why === 'link' ? tt('net/xchg.16') : ''); return XC_ERR[r && r.reason] || AUC_ERR[r && r.reason] || TRADE_ERR[r && r.reason] || tt('net/xchg.17'); };
const xcName = it => `${ITEMS[it.def] ? ITEMS[it.def].name : it.def}${it.enh ? ' +' + it.enh : ''}`;
function xcItemChip(it, grp, v, on) {
  const def = ITEMS[it.def]; if (!def) return '';
  return `<button class="xcitem${on ? ' on' : ''}" data-auc="${grp}" data-v="${v}"><img src="${itemURL(it.def)}" alt=""><span class="r${it.rar}">${xcName(it)}</span>${it.ref && it.ref.lines && it.ref.lines.length ? tt('net/xchg.18', { length: it.ref.lines.length }) : ''}</button>`;
}
const xcList = (items, gold) => (items || []).map(it => `<div class="xcl"><img src="${itemURL(it.def)}" alt=""><span class="r${it.rar}">${xcName(it)}</span>${aucRefTxt(it.ref)}</div>`).join('') + (gold ? tt('net/xchg.19', { v1: iconURL('i_coin', ICONS.coin), v2: aucG(gold), v3: aucG(gold - Math.floor(gold * XC_FEE)) }) : '') || tt('net/xchg.20');
export function xcHtml() {
  const M = XC.mine || {}, why = M.why, list = M.list || [], pd = aucPd();
  let h = tt('net/xchg.21', { v1: XC_FEE * 100 });
  if (why) h += `<div class="xcwarn"><b>${XC_ERR[why] || tt('net/xchg.22')}</b>${why === 'link' ? tt('net/xchg.23') : ''}</div>`;
  const open = list.filter(t => t.state === 'open'), inc = open.filter(t => t.dir === 'in'), out = open.filter(t => t.dir === 'out'), done = list.filter(t => t.state !== 'open');
  h += tt('net/xchg.24', { length: inc.length }) + (inc.length ? '' : tt('net/xchg.25'));
  for (const t of inc) h += tt('net/xchg.61', { v1: esc(t.who || tt('net/xchg.26')), v2: aucLeft(t.expires), v3: t.msg ? `<div class="xcmsg" data-raw>「${esc(t.msg)}」</div>` : '' })
    + tt('net/xchg.27', { v1: xcList(t.give, t.gold), v2: xcList(t.want, t.want_gold) })
    + tt('net/xchg.28', { id: t.id, v1: why ? ' disabled' : '' });
  h += tt('net/xchg.29', { length: out.length }) + (out.length ? '' : tt('net/xchg.30'));
  for (const t of out) h += tt('net/xchg.62', { v1: esc(t.who || tt('net/xchg.26')), v2: aucLeft(t.expires) })
    + tt('net/xchg.31', { v1: xcList(t.give, t.gold), v2: xcList(t.want, t.want_gold) })
    + tt('net/xchg.32', { id: t.id });
  // 새 제안
  h += tt('net/xchg.33');
  h += tt('net/xchg.34', { v1: esc(XC.nick) });
  if (XC.partner) {
    const P = XC.partner, items = P.items || [];
    h += tt('net/xchg.63', { v1: esc(P.nick), lv: P.lv, v2: items.length ? items.map(it => xcItemChip(it, 'xcWant', it.id, XC.want.includes(it.id))).join('') : tt('net/xchg.35') })
      + tt('net/xchg.36', { v1: esc(XC.wantGold) });
    const eqd = new Set([...Object.values(pd.eq), ...Object.values(pd.beq || {})]);
    const mine = Object.keys(pd.inv).filter(k => tradableKey(k) && !eqd.has(k)).sort((x, y) => ITEMS[y].rar - ITEMS[x].rar);
    h += tt('net/xchg.64', { v1: mine.length ? mine.map(k => xcItemChip({ def: defOf(k), rar: ITEMS[k].rar, enh: (pd.enh || {})[k] || 0, ref: (pd.ref || {})[k] }, 'xcGive', k, XC.give.includes(k))).join('') : tt('net/xchg.37') })
      + tt('net/xchg.38', { v1: esc(XC.gold) })
      + tt('net/xchg.39', { v1: esc(XC.msg) })
      + tt('net/xchg.40', { v1: why ? ' disabled' : '' });
  }
  h += '</div>';
  if (done.length) { h += tt('net/xchg.41'); for (const t of done) { const st = { done: tt('net/xchg.42'), cancelled: tt('net/xchg.43'), declined: t.dir === 'in' ? tt('net/xchg.44') : tt('net/xchg.45'), expired: tt('net/xchg.46') }[t.state] || t.state; h += `<div class="xccard done"><div class="xchd">${esc(t.who || tt('net/xchg.26'))} · ${st}</div></div>`; } }
  return h;
}
export async function xcLoad() { const { data, error } = await SB.rpc('hb_xchg_mine'); if (error) throw error; XC.mine = data || {}; }
async function xcFind() {
  const nick = String(/** @type {HTMLInputElement} */ ($('#xcNick')).value || '').trim(); XC.nick = nick; if (!nick) { toast(tt('net/xchg.47'), 'warn'); return; }
  try { const { data, error } = await SB.rpc('hb_xchg_find', { p_nick: nick }); if (error) throw error; if (!data || !data.ok) { XC.partner = null; toast(xcErr(data), 'warn'); aucRender(); return; } XC.partner = data; XC.want = []; aucRender(); }
  catch (e) { toast(tt('net/xchg.48') + pvErr(e), 'warn'); }
}
function xcToggle(arr, v) { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else if (arr.length >= XC_MAX_ITEMS) toast(XC_ERR.too_many_items, 'warn'); else arr.push(v); aucRender(); }
function xcSendAsk() {
  const P = XC.partner; if (!P || AUC.busy) return; const pd = aucPd();
  const g = numVal('#xcGold') || 0, wg = numVal('#xcWantGold') || 0;
  if (XC.give.length + XC.want.length === 0) { toast(XC_ERR.no_item, 'warn'); return; }
  if ((!XC.give.length && !g) || (!XC.want.length && !wg)) { toast(XC_ERR.empty, 'warn'); return; }
  if ((g && g < 100) || (wg && wg < 100)) { toast(XC_ERR.gold, 'warn'); return; }
  if (g > (pd.gold || 0)) { toast(AUC_ERR.balance, 'warn'); return; }
  const wItems = (P.items || []).filter(it => XC.want.includes(it.id));
  const giveTxt = [...XC.give.map(k => xcName({ def: defOf(k), enh: (pd.enh || {})[k] })), ...(g ? [aucG(g)] : [])].join(', ');
  const wantTxt = [...wItems.map(xcName), ...(wg ? [aucG(wg)] : [])].join(', ');
  confirmBox(tt('net/xchg.49', { nick: P.nick, giveTxt, wantTxt }), xcSend);
}
async function xcSend() {
  const P = XC.partner; if (!P || AUC.busy) return; AUC.busy = true;
  const g = numVal('#xcGold') || 0, wg = numVal('#xcWantGold') || 0, msg = String(/** @type {HTMLInputElement} */ ($('#xcMsg')).value || '').trim(), give = XC.give.slice();
  try {
    if (!(await cloudSync(true))) { toast(TRADE_ERR.sync, 'warn'); return; }
    const { data, error } = await SB.rpc('hb_xchg_propose', { p_nick: P.nick, p_give: give, p_gold: g, p_want: XC.want, p_want_gold: wg, p_msg: msg || null }); if (error) throw error;
    if (!data || !data.ok) { toast(xcErr(data), 'warn'); return; }
    tradeWithPd(p => { for (const k of give) { dropItem(p, k); (p.tkeys = p.tkeys || []).push(k); } if (g) p.gold = Math.max(0, (p.gold || 0) - g); }); cloudSync(true);
    sfx('ding'); toast(tt('net/xchg.50', { nick: P.nick }), 'lvl');
    Object.assign(XC, { partner: null, give: [], want: [], gold: '', wantGold: '', msg: '' });
  } catch (e) { toast(tt('net/xchg.51') + pvErr(e), 'warn'); }
  finally { AUC.busy = false; }
  aucLoad();
}
function xcAcceptAsk(id) {
  const t = ((XC.mine || {}).list || []).find(x => x.id === id); if (!t) return; const pd = aucPd();
  for (const w of t.want) { if (!w.key || !pd.inv[w.key]) { toast(XC_ERR.want_gone, 'warn'); return; } if (Object.values(pd.eq).includes(w.key) || Object.values(pd.beq || {}).includes(w.key)) { toast(tt('net/xchg.52', { v1: xcName(w) }), 'warn'); return; } }
  if ((t.want_gold || 0) > (pd.gold || 0)) { toast(AUC_ERR.balance, 'warn'); return; }
  confirmBox(tt('net/xchg.65', { who: t.who, v1: [...t.give.map(xcName), ...(t.gold ? [aucG(t.gold - Math.floor(t.gold * XC_FEE)) + tt('net/xchg.53')] : [])].join(', ') || tt('net/xchg.54'), v2: [...t.want.map(xcName), ...(t.want_gold ? [aucG(t.want_gold)] : [])].join(', ') || tt('net/xchg.54') }), () => xcAccept(t));
}
async function xcAccept(t) {
  if (AUC.busy) return; AUC.busy = true;
  try {
    if (!(await cloudSync(true))) { toast(TRADE_ERR.sync, 'warn'); return; }
    const { data, error } = await SB.rpc('hb_xchg_accept', { p_id: t.id }); if (error) throw error;
    if (!data || !data.ok) { toast(xcErr(data), 'warn'); return; }
    tradeWithPd(p => { for (const w of t.want) if (w.key) { dropItem(p, w.key); (p.tkeys = p.tkeys || []).push(w.key); } if (t.want_gold) p.gold = Math.max(0, (p.gold || 0) - t.want_gold); });
    await claimGifts(aucPd()).catch(() => { }); await tradeClaim().catch(() => 0); cloudSync(true);
    sfx('lvl'); toast(tt('net/xchg.55'), 'lvl');
  } catch (e) { toast(tt('net/xchg.56') + pvErr(e), 'warn'); }
  finally { AUC.busy = false; }
  aucLoad();
}
async function xcCancel(id, decline) {
  try { const { data, error } = await SB.rpc('hb_xchg_cancel', { p_id: id }); if (error) throw error; if (!data || !data.ok) { toast(xcErr(data), 'warn'); return; } toast(decline ? tt('net/xchg.57') : tt('net/xchg.58'), 'sub'); }
  catch (e) { toast(tt('net/xchg.59') + pvErr(e), 'warn'); }
  aucLoad();
}
/** 경매장 창 클릭 중 교환 탭 것 처리 (처리했으면 true) */
export function xcClick(m, v) {
  if (m === 'xcFind') { xcFind(); return true; }
  if (m === 'xcGive') { xcToggle(XC.give, v); return true; }
  if (m === 'xcWant') { xcToggle(XC.want, v); return true; }
  if (m === 'xcSend') { xcSendAsk(); return true; }
  if (m === 'xcAccept') { xcAcceptAsk(v); return true; }
  if (m === 'xcDecline') { confirmBox(tt('net/xchg.60'), () => xcCancel(v, true)); return true; }
  if (m === 'xcCancel') { xcCancel(v, false); return true; }
  if (m === 'xcLink') { aucClose(); cloudOpen('title'); return true; }
  return false;
}
/** 입력 중인 값 기억 (다시 그려도 안 지워지게) */
export function xcInput(i) { const id = i.id; if (id === 'xcNick') XC.nick = i.value; else if (id === 'xcGold') XC.gold = i.value; else if (id === 'xcWantGold') XC.wantGold = i.value; else if (id === 'xcMsg') XC.msg = i.value; }
