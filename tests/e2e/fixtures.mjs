import { test as base, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
export const URL_MAIN = 'file://' + path.join(DIST, 'index.html');
export const URL_ONETOUCH = 'file://' + path.join(DIST, 'onetouch/index.html');

/** 가짜 Supabase (메모리). page.evaluate 로 주입 */
export const MOCK_SB = `(() => {
  window.__rows = window.__rows || [];          // hb_fighters
  window.__db = window.__db || { hb_fighters: __rows, hb_saves: [] };
  window.__grants = window.__grants || [];
  window.__rpc = window.__rpc || {};             // 테스트가 rpc 응답을 갈아끼움
  const q = (table) => { const T = __db[table] || (__db[table] = []); const st = { f: [], gt: [], head: false, single: false, upd: null };
    const run = () => { const val = (r, k) => k === 'played' && r.played === undefined ? ((r.snap && r.snap.lv || 1) > 1 || (r.wins || 0) + (r.losses || 0) > 0) : r[k];
    const rows = T.filter(r => st.f.every(([k, v]) => val(r, k) === v) && st.gt.every(([k, v]) => r[k] > v)); if (st.upd) { rows.forEach(r => Object.assign(r, st.upd)); return { error: null }; }
      if (st.single) return { data: rows[0] || null, error: null }; if (st.head) return { count: rows.length, error: null }; return { data: rows, error: null }; };
    const o = { select(c, opt) { if (opt && opt.head) st.head = true; return o; }, limit() { return o; }, order() { return o; }, eq(k, v) { st.f.push([k, v]); return o; }, gt(k, v) { st.gt.push([k, v]); return o; },
      maybeSingle() { st.single = true; return Promise.resolve(run()); }, insert(row) { T.push(Object.assign({ user_id: 'u-me' }, table === 'hb_fighters' ? { rating: 1000, wins: 0, losses: 0 } : {}, row)); return Promise.resolve({ error: null }); },
      update(u) { st.upd = u; return o; }, then(res, rej) { return Promise.resolve(run()).then(res, rej); } };
    return o; };
  const rpc = async (name, args) => {
    if (__rpc[name]) return { data: await __rpc[name](args), error: null };
    if (name === 'hb_claim_grants') { const d = __grants; __grants = []; return { data: d, error: null }; }
    if (name === 'hb_submit_fighter') { const me = __rows.find(r => r.user_id === 'u-me'); const pw = Math.round(args.p_snap.atk * 4 + args.p_snap.hp * 0.5);
      if (!me) { if (!args.p_nick) return { data: { ok: false, reason: 'nickname' }, error: null }; __rows.push({ user_id: 'u-me', nickname: args.p_nick, snap: args.p_snap, power: pw, rating: 1000, wins: 0, losses: 0 }); }
      else Object.assign(me, { snap: args.p_snap, power: pw }, args.p_nick ? { nickname: args.p_nick } : {});
      return { data: { ok: true, power: pw }, error: null }; }
    if (name.startsWith('hb_raid')) {
      const R = window.__raid = window.__raid || { week: '2026-11-16', boss: 'boss2', max_hp: 1000000, hp: 1000000, killed_at: null, ends_at: new Date(Date.now() + 3 * 86400000).toISOString(), max_tries: 3, participants: 0, top: [], my: { damage: 0, tries_today: 0 } };
      if (name === 'hb_raid_info') return { data: R, error: null };
      if (name === 'hb_raid_start') { if (R.my.tries_today >= 3) return { data: { ok: false, reason: 'tries' }, error: null }; R.my.tries_today++; R.open = true; return { data: { ok: true, info: R }, error: null }; }
      if (name === 'hb_raid_report') { if (!R.open) return { data: { ok: false, reason: 'no_open' }, error: null }; R.open = false; const d = args.p_damage; R.my.damage += d; R.hp = Math.max(0, R.hp - d); if (!R.hp) R.killed_at = new Date().toISOString();
        R.participants = 1; R.top = [{ nickname: '나', damage: R.my.damage, mine: true }]; return { data: { ok: true, damage: d, total: R.my.damage, capped: false, info: R }, error: null }; }
    }
    if (name === 'hb_season_info') return { data: { season: '2026-11-16', ends_at: new Date(Date.now() + 2 * 86400000 + 5.5 * 3600000).toISOString(), prev: '2026-11-09',
      top: [{ rank: 1, nickname: '원조희수', rating: 1100, wins: 5, losses: 1 }, { rank: 2, nickname: '보리언니', rating: 1050, wins: 3, losses: 2 }], mine: { rank: 2, rating: 1050, reward: '강화석 100 · 200만G · 자동사냥 2시간' } }, error: null };
    if (name === 'hb_save_push') { const T = __db.hb_saves, row = T.find(r => r.user_id === 'u-me');
      if (row) Object.assign(row, { data: args.p_data || row.data, ep2: args.p_ep2 || row.ep2 }); else T.push({ user_id: 'u-me', data: args.p_data, ep2: args.p_ep2 }); return { data: { ok: true }, error: null }; }
    // 거래 기반 (가짜): 맡기기·취소·받을 장비
    if (name === 'hb_escrow_put') { const E = window.__escrow = window.__escrow || []; const id = 'e' + (E.length + 1); E.push(Object.assign({ id }, args)); return { data: { ok: true, id }, error: null }; }
    if (name === 'hb_escrow_cancel') { const E = window.__escrow || [], e = E.find(x => x.id === args.p_id); if (!e) return { data: { ok: false, reason: 'not_found' }, error: null };
      E.splice(E.indexOf(e), 1); if (e.p_kind === 'item') (window.__deliver = window.__deliver || []).push({ def: e.p_key.split('#')[0], key: e.p_key.split('#')[0] + '#tback1', enh: 0 });
      else __grants.push({ kind: e.p_kind, amount: e.p_amount, note: '거래 취소 반환' }); return { data: { ok: true }, error: null }; }
    if (name === 'hb_escrow_mine') return { data: (window.__escrow || []).map(e => ({ id: e.id, kind: e.p_kind, amount: e.p_amount })), error: null };
    if (name === 'hb_claim_items') return { data: window.__deliver || [], error: null };
    // 경매장 (가짜): __auc 목록, 입찰·등록 기록 __aucCalls
    if (name.startsWith('hb_auc_')) { const A = window.__auc = window.__auc || [], C = window.__aucCalls = window.__aucCalls || []; C.push([name, args]);
      if (name === 'hb_auc_browse') return { data: A.filter(a => a.state !== 'sold'), error: null };
      if (name === 'hb_auc_mine') return { data: { selling: A.filter(a => a.mine), bidding: A.filter(a => a.top), done: [] }, error: null };
      if (name === 'hb_auc_list') { A.push({ id: 'a' + (A.length + 1), def: args.p_key.split('#')[0], rar: 5, slot: 'weapon', enh: 0, start: args.p_start, buyout: args.p_buyout, bid: null, bids: 0, min: args.p_start, ends: new Date(Date.now() + args.p_hours * 3600e3).toISOString(), seller: '나', mine: true }); return { data: { ok: true, id: 'a' + A.length }, error: null }; }
      if (name === 'hb_auc_bid') { const a = A.find(x => x.id === args.p_id); if (args.p_amount < a.min) return { data: { ok: false, reason: 'low', min: a.min }, error: null };
        const buy = a.buyout && args.p_amount >= a.buyout, amt = buy ? a.buyout : args.p_amount; Object.assign(a, { bid: amt, bids: a.bids + 1, top: true, min: Math.ceil(amt * 1.05) }); if (buy) { a.state = 'sold'; (window.__deliver = window.__deliver || []).push({ def: a.def, key: a.def + '#tauc01', enh: a.enh }); }
        return { data: { ok: true, bought: !!buy, bid: amt }, error: null }; }
      if (name === 'hb_auc_cancel') { const a = A.find(x => x.id === args.p_id); A.splice(A.indexOf(a), 1); return { data: { ok: true }, error: null }; } }
    if (name === 'hb_make_transfer_code') return { data: [{ code: 'ABCD2345', expires_at: new Date(Date.now() + 600000).toISOString() }], error: null };
    return { data: null, error: null }; };
  // 가짜 Realtime 채널: 테스트가 __chan.emit('broadcast'|'presence', event, payload) 로 다른 희수를 흉내냄
  window.__sent = [];
  const channel = (name) => { const hs = []; const ch = window.__chan = {
    name, pres: {}, on(type, filt, cb) { hs.push({ type, ev: filt.event, cb }); return ch; },
    subscribe(cb) { setTimeout(() => { cb('SUBSCRIBED'); const pre = window.__prefill && window.__prefill[name]; if (pre) { for (let i = 0; i < pre; i++) ch.pres['u-x' + i] = [{ u: 'u-x' + i, n: '희수' + i, x: 280, y: 600 }]; ch.emit('presence', 'sync'); } }, 10); return ch; },
    async track(m) { ch.pres['u-me'] = [m]; ch.emit('presence', 'sync'); return 'ok'; }, async untrack() { return 'ok'; },
    async send(msg) { __sent.push(msg); return 'ok'; }, presenceState() { return ch.pres; },
    emit(type, ev, payload) { for (const h of hs) if (h.type === type && h.ev === ev) h.cb(type === 'broadcast' ? { payload } : (payload || {})); } };
    return ch; };
  // 가짜 로그인: __user 로 연결 상태, 연결·로그인 요청은 __oauth 에 기록
  const auth = { async getUser() { return { data: { user: window.__user || { id: 'u-me', is_anonymous: true, identities: [] } } }; },
    async getSession() { return { data: { session: { access_token: 'a', refresh_token: 'r' } } }; },
    async linkIdentity(o) { window.__oauth = ['link', o.provider]; return { data: {}, error: null }; }, async signInWithOAuth(o) { window.__oauth = ['login', o.provider]; return { data: {}, error: null }; },
    async setSession() { return { error: null }; }, async signOut() { return { error: null }; } };
  accFetchProv = async () => window.__prov || ['google', 'kakao'];
  const mk = () => ({ from: q, rpc, channel, removeChannel() { }, auth });
  SB = mk(); PV.uid = 'u-me';
  sbInit = async () => { SB = mk(); PV.uid = 'u-me'; };
})()`;

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    // 실제 서버/외부 CDN 은 막음 (테스트가 운영 DB 를 건드리지 않게)
    await page.route(/supabase\.co|cdn\.jsdelivr\.net/, r => r.abort());
    page.errors = errors;
    await use(page);
    expect(errors, '페이지 JS 오류').toEqual([]);
  }
});
export { expect };

/** 세이브를 심고 새로고침 (기본: 보리 합류 완료·오늘 출석 완료 → 스토리 대화나 출석 창이 끼어들지 않게) */
export async function withSave(page, url, patch = {}) {
  await page.goto(url);
  await page.evaluate(p => { const pd = Object.assign(newPD(), { boriJoined: true, guide: 99, att: { last: todayKey(), n: 1 } }, p); localStorage.setItem(SAVEKEY, JSON.stringify(pd)); }, patch);
  await page.reload(); await page.waitForTimeout(500);
}
/** 게임 화면으로 바로 진입 */
export async function enterZone(page, zone = 1) {
  await page.evaluate(z => { G.pd = loadGame(); calcStats(); startZone(z); document.querySelector('#title').hidden = true; }, zone);
  await page.waitForFunction(() => G.state === 'play');
}
/** 메뉴 탭 열기 */
export async function openTab(page, tab) {
  await page.evaluate(t => { if (G.state === 'menu') { MTAB = t; renderMenu(true); } else openMenu(t); }, tab);
  await page.locator('#menu').waitFor({ state: 'visible' });
}
