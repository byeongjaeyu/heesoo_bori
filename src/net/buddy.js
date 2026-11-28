// ===================== 친구 희수 데려가기 (하루 1번, 15분 동료) =====================
// 서버 hb_borrow_friend: 하루 1번, 빌려준 친구는 강화석 3 (하루 10번까지). 동료는 친구 스냅샷 공격의 50%로 싸우고 죽지 않음



import { $ } from '../sys/dom.js';
import { choice, todayKey } from '../core/util.js';
import { sfx } from '../sys/audio.js';
import { INP } from '../sys/input.js';
import { G } from '../core/state.js';
import { saveGame } from '../core/save.js';
import { bubble, dealDamage } from '../play/player.js';
import { toast } from '../ui/dialog.js';
import { PV, SB, esc, pvErr, pvpFaceURL, pvpLoadMe, sbInit } from './pvp.js';
import { achTag } from '../features/achv.js';
import { tt } from '../sys/i18n.js';

const BUDDY_TIME = 900, BUDDY_MUL = 0.5;
const BUDDY = { list: /** @type {any[]} */ ([]), busy: false, paused: false };

export const buddyActive = pd => !!(pd && pd.buddy && pd.buddy.day === todayKey() && pd.buddy.left > 0);
export const buddyUsedToday = pd => !!(pd && pd.buddy && pd.buddy.day === todayKey());
/** 필드(스테이지·할로윈·레이드)에 동료 세우기 */
export function buddySpawn() {
  G.buddy = null; const pd = G.pd; if (FORCE_EASY || !buddyActive(pd) || G.pvp || !G.P) return;
  G.buddy = { x: G.P.x - 18, y: G.P.y + 6, t: 0, ang: -Math.PI / 2, mv: 0, atkCd: 1, side: 0, snap: pd.buddy.snap, nick: pd.buddy.nick, flash: 0, spawnT: 0.8, stun: 0, dead: false, cast: null };
}
export function buddyUpdate(dt) {
  const B = G.buddy, pd = G.pd; if (!B || !G.P) return;
  if (!buddyActive(pd)) { toast(tt('net/buddy.1', { nick: B.nick }), 'sub'); G.buddy = null; return; }
  pd.buddy.left = Math.max(0, pd.buddy.left - dt); B.t += dt; B.atkCd -= dt; if (B.spawnT > 0) { B.spawnT -= dt; return; }
  const S = B.snap || {}, w = S.w || { reach: 16, rate: 1.5, mul: 1, arc: 100 }, P = G.P, sp = 74 * Math.min(1.4, S.spd || 1);
  let tgt = null, best = 1e9;
  for (const e of G.enemies) { if (e.dead || e.spawnT > 0 || e.rival) continue; const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < 170) { const db = Math.hypot(e.x - B.x, e.y - B.y); if (db < best) { best = db; tgt = e; } } }
  let gx = P.x - 18, gy = P.y + 6, x0 = B.x, y0 = B.y;
  if (tgt) { const reach = (w.reach || 16) + (tgt.r || 6); B.ang = Math.atan2(tgt.y - B.y, tgt.x - B.x);
    if (best > reach) { gx = tgt.x; gy = tgt.y; }
    else { gx = B.x; gy = B.y; if (B.atkCd <= 0) { B.atkCd = 1 / (w.rate || 1.5);
      dealDamage(tgt, (S.atk || 10) * (w.mul || 1) * BUDDY_MUL * ((G.st && G.st.buddyMul) || 1), { kb: 18, ang: B.ang });
      G.fx.push({ k: 'swing', ent: B, x: B.x, y: B.y - 8, a: B.ang, reach: w.reach || 14, arc: (w.arc || 100) * Math.PI / 180, t: 0, dur: 0.18, style: w.style, wpn: w.id, side: (B.side ^= 1) }); } } }
  const dx = gx - B.x, dy = gy - B.y, d = Math.hypot(dx, dy);
  if (d > 3) { const m = Math.min(d, sp * dt * (d > 80 ? 1.8 : 1)); B.x += dx / d * m; B.y += dy / d * m; if (!tgt) B.ang = Math.atan2(dy, dx); }
  if (d > 260) { B.x = P.x - 18; B.y = P.y + 6; } // 너무 멀어지면 옆으로
  B.mv = Math.hypot(B.x - x0, B.y - y0) / Math.max(dt, 1e-3);
}
export const buddyLeftTxt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------- 친구 고르기 ----------
export async function buddyOpen() {
  if (FORCE_EASY || G.pvp) return;
  if (G.state === 'play') { G.state = 'menu'; BUDDY.paused = true; INP.atk = false; }
  const box = $('#buddy'); box.hidden = false; const pd = G.pd;
  if (buddyUsedToday(pd)) {
    $('#buddyBody').innerHTML = tt('net/buddy.17', { v1: pvpFaceURL(pd.buddy.snap.vis || pd.buddy.snap.eq, pd.buddy.snap.hair), v2: esc(pd.buddy.nick), v3: buddyActive(pd) ? tt('net/buddy.2', { v1: buddyLeftTxt(pd.buddy.left) }) : tt('net/buddy.3') });
    return;
  }
  $('#buddyBody').innerHTML = tt('net/buddy.4');
  try {
    await sbInit(); if (!PV.me) await pvpLoadMe().catch(() => { });
    if (!PV.me) { $('#buddyBody').innerHTML = tt('net/buddy.5'); return; }
    const { data, error } = await SB.from('hb_fighters').select('user_id,nickname,snap,power').eq('played', true).order('power', { ascending: false }).limit(30); if (error) throw error;
    BUDDY.list = (data || []).filter(f => f.user_id !== PV.uid);
    $('#buddyBody').innerHTML = tt('net/buddy.6', { v1: BUDDY_TIME / 60, v2: BUDDY_MUL * 100 })
      + (BUDDY.list.length ? BUDDY.list.map((f, i) => { const s = f.snap || {}; return tt('net/buddy.7', { v1: pvpFaceURL(s.vis || s.eq, s.hair), v2: achTag(s.ttl), v3: esc(f.nickname), v4: s.lv || '?', v5: s.aw ? '★' + s.aw : '', v6: Number(f.power).toLocaleString(), i }); }).join('')
        : tt('net/buddy.8'));
  } catch (e) { $('#buddyBody').innerHTML = tt('net/buddy.9', { v1: esc(pvErr(e)) }); }
}
async function buddyPick(i) {
  const f = BUDDY.list[i]; if (!f || BUDDY.busy) return; BUDDY.busy = true;
  try {
    const { data, error } = await SB.rpc('hb_borrow_friend', { p_friend: f.user_id }); if (error) throw error;
    if (!data || !data.ok) { toast(data && data.reason === 'used' ? tt('net/buddy.10') : tt('net/buddy.11'), 'warn'); return; }
    G.pd.buddy = { day: todayKey(), uid: f.user_id, nick: data.nickname, snap: data.snap || f.snap, left: BUDDY_TIME }; saveGame();
    buddyClose(); buddySpawn(); toast(tt('net/buddy.12', { nickname: data.nickname, v1: BUDDY_TIME / 60 }), 'lvl'); sfx('lvl');
    if (G.buddy) bubble(G.P, choice([tt('net/buddy.13'), tt('net/buddy.14'), tt('net/buddy.15')]), 1.4);
  } catch (e) { toast(tt('net/buddy.16') + pvErr(e), 'warn'); } finally { BUDDY.busy = false; }
}
function buddyClose() { $('#buddy').hidden = true; if (BUDDY.paused && G.state === 'menu' && $('#menu').hidden) G.state = 'play'; BUDDY.paused = false; }
export function buddyBoot() {
  if (FORCE_EASY) return;
  $('#buddy').addEventListener('click', e => { const b = /** @type {HTMLElement} */ (e.target).closest('[data-bd]'); if (b) buddyPick(+b.getAttribute('data-bd')); });
  $('#buddyX').onclick = buddyClose;
}
