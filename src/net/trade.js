// ===================== 거래 기반 (돈·장비) — 거래 방식(교환·거래소·선물)은 아직 =====================
// 서버: supabase/trade.sql (hb_items 등록부 · hb_escrow 보관 · hb_escrow_settle 넘기기 · hb_ledger 기록)
// - tradePut: 돈(gold·stones)이나 장비(세이브 키)를 서버 보관으로 맡김 → 성공하면 내 세이브에서도 빼고, 장비 키는 다시 안 씀(pd.tkeys)
// - tradeCancel: 맡긴 것 취소 → 돈은 선물함(gold·stones), 장비는 「받을 장비」로 돌아옴
// - tradeClaim: 받을 장비(거래로 받음·취소로 돌아옴)를 세이브에 넣음 (저장해서 서버에 올라가면 확정, 중간에 끊겨도 다시 받음)
// 거래 화면은 방식이 정해지면 이 함수들 위에 만들 것. 넘기기(hb_escrow_settle)는 서버 함수만 부를 수 있음.



import { sfx } from '../sys/audio.js';
import { ITEMS } from '../core/data.js';
import { G } from '../core/state.js';
import { SAVEKEY, loadGame, saveGame } from '../core/save.js';
import { calcStats, dropItem } from '../core/items.js';
import { toast } from '../ui/dialog.js';
import { SB, sbInit } from './pvp.js';
import { claimGifts } from './rank.js';
import { cloudSync } from './cloud.js';
import { tt } from '../sys/i18n.js';

const TRADE_MIN_RAR = 3; // 전설 이상 (supabase/item_defs.sql 의 tradable 과 같아야 함 — 테스트로 고정)
export const tradableKey = k => { const it = ITEMS[k]; return !!it && !it.start && !it.job && (it.rar || 0) >= TRADE_MIN_RAR; };
export const TRADE_ERR = { balance: tt('net/trade.1'), equipped: tt('net/trade.2'), unregistered: tt('net/trade.3'),
  missing: tt('net/trade.4'), too_many: tt('net/trade.5'), amount: tt('net/trade.6'), no_save: tt('net/trade.7'), sync: tt('net/trade.8'), kind: tt('net/trade.9') };
const tradeErr = r => TRADE_ERR[r && r.reason] || tt('net/trade.10');

/** 지금 쓰는 세이브에 바꾼 내용을 반영 (게임 중이면 G.pd, 로비면 localStorage) */
export function tradeWithPd(fn) {
  const pd = G.pd || loadGame(); if (!pd) return null;
  fn(pd);
  if (G.pd === pd) { calcStats(); saveGame(); } else { try { localStorage.setItem(SAVEKEY, JSON.stringify(pd)); } catch (e) { } }
  return pd;
}
/** 맡기기: kind 'gold'|'stones' (v = 수량) 또는 'item' (v = 장비 키). ref = 어느 거래인지(나중에) */
async function tradePut(kind, v, ref) {
  if (FORCE_EASY) return { ok: false, reason: 'kind' };
  const pd = G.pd || loadGame(); if (!pd) return { ok: false, reason: 'no_save' };
  if (kind === 'item') {
    if (!pd.inv[v]) return { ok: false, reason: 'missing' };
    if (!tradableKey(v)) return { ok: false, reason: 'unregistered' };
    if (Object.values(pd.eq).includes(v) || Object.values(pd.beq || {}).includes(v)) return { ok: false, reason: 'equipped' };
  } else if (kind === 'gold' || kind === 'stones') {
    v = Math.floor(Number(v)); if (!(v > 0)) return { ok: false, reason: 'amount' }; if ((pd[kind] || 0) < v) return { ok: false, reason: 'balance' };
  } else return { ok: false, reason: 'kind' };
  if (!(await cloudSync(true))) return { ok: false, reason: 'sync' }; // 서버 기록을 지금으로 맞춘 뒤
  const { data, error } = await SB.rpc('hb_escrow_put', { p_kind: kind, p_amount: kind === 'item' ? 0 : v, p_key: kind === 'item' ? v : null, p_ref: ref || null });
  if (error) throw error; if (!data || !data.ok) return data || { ok: false };
  tradeWithPd(p => {
    if (kind === 'item') { dropItem(p, v); (p.tkeys = p.tkeys || []).push(v); }
    else p[kind] = Math.max(0, (p[kind] || 0) - v);
  });
  await cloudSync(true);
  return data;
}
/** 맡긴 것 취소 → 돈은 선물함으로, 장비는 받을 장비로 돌아옴 */
async function tradeCancel(id) {
  if (FORCE_EASY) return { ok: false };
  await sbInit(); const { data, error } = await SB.rpc('hb_escrow_cancel', { p_id: id }); if (error) throw error;
  if (data && data.ok) { await claimGifts(G.pd || loadGame()).catch(() => { }); await tradeClaim(); }
  return data;
}
/** 내가 맡겨 둔 목록 */
async function tradeMine() { await sbInit(); const { data, error } = await SB.rpc('hb_escrow_mine'); if (error) throw error; return data || []; }
/** 받을 장비를 세이브에 넣음 (이미 있는 키는 건너뜀 → 여러 번 불러도 안전) */
export async function tradeClaim() {
  if (FORCE_EASY || !SB) return 0;
  const { data, error } = await SB.rpc('hb_claim_items'); if (error || !Array.isArray(data) || !data.length) return 0;
  let n = 0;
  tradeWithPd(pd => {
    for (const it of data) {
      const k = String(it.key || ''); if (!k || !ITEMS[k] || pd.inv[k]) continue;
      pd.inv[k] = 1; pd.book = pd.book || {}; pd.book[it.def] = 1;
      if (it.enh) (pd.enh = pd.enh || {})[k] = it.enh;
      if (it.ilv) (pd.ilv = pd.ilv || {})[k] = it.ilv;
      if (it.iexp) (pd.iexp = pd.iexp || {})[k] = it.iexp;
      if (it.ref) (pd.ref = pd.ref || {})[k] = it.ref;
      if (ITEMS[k].bori) pd.newBori = true; else pd.newItem = true;
      toast(tt('net/trade.11', { name: ITEMS[k].name, v1: it.enh ? ' +' + it.enh : '' }), 'item r' + ITEMS[k].rar); n++;
    }
  });
  if (n) { sfx('ding'); cloudSync(true); }
  return n;
}
