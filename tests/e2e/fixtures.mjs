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
  const q = (table) => { const T = __db[table] || (__db[table] = []); const st = { f: [], head: false, single: false, upd: null };
    const run = () => { const rows = T.filter(r => st.f.every(([k, v]) => r[k] === v)); if (st.upd) { rows.forEach(r => Object.assign(r, st.upd)); return { error: null }; }
      if (st.single) return { data: rows[0] || null, error: null }; if (st.head) return { count: rows.length, error: null }; return { data: rows, error: null }; };
    const o = { select(c, opt) { if (opt && opt.head) st.head = true; return o; }, limit() { return o; }, order() { return o; }, eq(k, v) { st.f.push([k, v]); return o; },
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
    if (name === 'hb_season_info') return { data: { season: '2026-11-16', ends_at: new Date(Date.now() + 2 * 86400000 + 5.5 * 3600000).toISOString(), prev: '2026-11-09',
      top: [{ rank: 1, nickname: '원조희수', rating: 1100, wins: 5, losses: 1 }, { rank: 2, nickname: '보리언니', rating: 1050, wins: 3, losses: 2 }], mine: { rank: 2, rating: 1050, reward: '강화석 100 · 200만G · 자동사냥 2시간' } }, error: null };
    if (name === 'hb_make_transfer_code') return { data: [{ code: 'ABCD2345', expires_at: new Date(Date.now() + 600000).toISOString() }], error: null };
    return { data: null, error: null }; };
  SB = { from: q, rpc }; PV.uid = 'u-me';
  sbInit = async () => { SB = { from: q, rpc }; PV.uid = 'u-me'; };
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
