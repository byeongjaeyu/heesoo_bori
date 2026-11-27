// ===================== 필드: 엔티티·글자 효과·희수 이동/공격 =====================
// ---------- entities ----------


import { fmtNumText } from '../sys/dom.js';
import { angDiff, choice, clamp, rand } from '../core/util.js';
import { on } from '../core/events.js';
import { sfx } from '../sys/audio.js';
import { INP, moveVec } from '../sys/input.js';
import { PHONE_WORDS } from '../core/data.js';
import { G } from '../core/state.js';
import { sk } from '../core/save.js';
import { calcStats } from '../core/items.js';
import { killEnemy } from './enemies.js';
import { playerDie } from './zone.js';
import { jobTick } from '../core/job.js';
import { toast } from '../ui/dialog.js';
import { PVP_MUL } from '../net/pvp.js';
import { raidHit } from '../net/raid.js';

export function newPlayer(x, y) { return { x, y, hp: G.st.hp, mp: G.st.mp, fx: 0, fy: 1, dir: 'down', walkT: 0, moving: false, idleT: 1, atkCd: 0, atkAnim: 0, punch: 0, inv: 0, flash: 0, cds: {}, buffs: {}, eatCd: 0, castT: 0, kbx: 0, kby: 0, phoneT: 0.5, wasPhone: false }; }
export function newBori(x, y) { return { x, y, t: 0, face: 1, biteCd: 0, barkCd: 3, zoomCd: 6, target: null, run: false, zoom: null, jump: 0 }; }
export const dirOf = (fx, fy) => Math.abs(fx) > Math.abs(fy) * 1.05 ? (fx > 0 ? 'right' : 'left') : (fy > 0 ? 'down' : 'up');
export function isOnPhone() { const P = G.P; return !!P && G.state === 'play' && P.idleT > 0.3 && P.atkAnim <= 0 && P.castT <= 0 && !G.ult; }

export function collide(o, r) {
  const W = G.world;
  for (const s of W.solids) { const dx = o.x - s.x, dy = o.y - s.y, d = Math.hypot(dx, dy), m = s.r + r; if (d < m && d > 0.001) { o.x = s.x + dx / d * m; o.y = s.y + dy / d * m; } }
  o.x = clamp(o.x, 20, W.W - 20); o.y = clamp(o.y, W.top || 34, W.H - 14);
}
export function moveToward(e, tx, ty, sp, dt) { const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy); if (d < 0.5) return; const s = Math.min(d, sp * dt); e.x += dx / d * s; e.y += dy / d * s; if (Math.abs(dx) > 1) e.face = dx > 0 ? 1 : -1; }
export function wander(e, sp, dt, ch) { e.wT -= dt; if (e.wT <= 0) { e.wT = rand(ch * 0.6, ch * 1.4); const a = rand(0, Math.PI * 2), go = Math.random() < 0.7; e.wx = go ? Math.cos(a) : 0; e.wy = go ? Math.sin(a) : 0; } e.x += e.wx * sp * dt; e.y += e.wy * sp * dt; if (e.wx) e.face = e.wx > 0 ? 1 : -1; }
export function moveAway(e, sp, dt) { const a = Math.atan2(e.y - G.P.y, e.x - G.P.x); e.x += Math.cos(a) * sp * dt; e.y += Math.sin(a) * sp * dt; e.face = Math.cos(a) > 0 ? 1 : -1; }
export function nearestEnemy(x, y, maxD) { let best = null, bd = maxD; for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; const d = Math.hypot(e.x - x, e.y - y) - e.r; if (d < bd) { bd = d; best = e; } } return best; }

// ---------- text / fx helpers ----------
export function addText(x, y, txt, kind) { G.texts.push({ x: x + rand(-3, 3), y, txt: fmtNumText(txt), kind: kind || 'dmg', t: 0, dur: kind === 'crit' ? 0.9 : 0.75 }); if (G.texts.length > 60) G.texts.shift(); }
export function bubble(ent, txt, dur) { G.bubbles = G.bubbles.filter(b => b.ent !== ent); G.bubbles.push({ ent, txt, t: 0, dur: dur || 1.6 }); }
export function burst(x, y, col, n, spd) { for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), s = rand(20, spd || 70); G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: rand(0.3, 0.6), max: 0.6, col, sz: Math.random() < 0.3 ? 2 : 1, grav: 120 }); } }
export function word(x, y, txt, col, size) { G.fx.push({ k: 'word', x, y, txt, col: col || '#fff', size: size || 1.6, t: 0, dur: 0.7 }); }

// ---------- player ----------
export function updatePlayer(dt) {
  jobTick(dt);
  const P = G.P, st = G.st;
  const [mx, my] = moveVec(); const mag = Math.hypot(mx, my);
  P.moving = mag > 0.18 && P.castT <= 0;
  if (P.moving) {
    const sp = st.moveSpd * (P.atkAnim > 0 ? 0.62 : 1) * clamp(mag, 0.55, 1);
    P.x += mx / mag * sp * dt; P.y += my / mag * sp * dt;
    if (P.atkAnim <= 0) { P.fx = mx / mag; P.fy = my / mag; P.dir = dirOf(P.fx, P.fy); }
    P.walkT += dt; P.idleT = 0;
  } else P.idleT += dt;
  if (P.kbx || P.kby) { P.x += P.kbx * dt; P.y += P.kby * dt; const k = Math.pow(0.002, dt); P.kbx *= k; P.kby *= k; if (Math.abs(P.kbx) + Math.abs(P.kby) < 2) P.kbx = P.kby = 0; }
  collide(P, 5);
  P.atkCd -= dt; P.atkAnim -= dt; P.inv -= dt; P.flash -= dt; P.castT -= dt; P.eatCd -= dt;
  for (const k in P.cds) if (P.cds[k] > 0) P.cds[k] -= dt;
  for (const k in P.buffs) { const b = P.buffs[k]; b.t -= dt; if (Math.random() < dt * 6) G.parts.push({ x: P.x + rand(-6, 6), y: P.y - rand(2, 18), vx: 0, vy: -20, life: 0.5, max: 0.5, col: b.crit ? '#ffd84a' : '#ff6b5a', sz: 1, grav: 0 }); if (b.t <= 0) { delete P.buffs[k]; calcStats(); toast(`${b.name} 보양 효과가 끝났어요`, 'sub'); } }
  if ((INP.atk || (G.auto && G.autoAtk)) && P.atkCd <= 0 && P.castT <= 0) doAttack();
  const onPhone = isOnPhone();
  if (onPhone && !P.wasPhone) { G.fx.push({ k: 'icon', x: P.x + 6, y: P.y - 14, icon: 'phonePop', t: 0, dur: 0.35 }); }
  P.wasPhone = onPhone;
  const wag = G.bori && Math.hypot(G.bori.x - P.x, G.bori.y - P.y) < 42 ? sk('wag') : 0;
  P.hp = Math.min(st.hp, P.hp + st.hp * (0.004 + (onPhone ? 0.012 : 0) + wag * 0.006) * dt);
  P.mp = Math.min(st.mp, P.mp + st.mp * (0.012 + (onPhone ? 0.03 : 0) + wag * 0.006) * dt);
  if (onPhone) { P.phoneT -= dt; if (P.phoneT <= 0) { P.phoneT = rand(1.1, 1.8); G.fx.push({ k: 'phone', x: P.x + rand(-4, 6), y: P.y - 25, txt: choice(PHONE_WORDS), t: 0, dur: 1.2 }); } }
}

function doAttack() {
  const P = G.P, w = G.st.weapon, fl = sk('fist');
  const t = nearestEnemy(P.x, P.y - 6, w.reach + 28);
  if (t) { const a = Math.atan2((t.y - t.h * 0.35) - (P.y - 8), t.x - P.x); P.fx = Math.cos(a); P.fy = Math.sin(a); P.dir = dirOf(P.fx, P.fy); }
  P.atkCd = 1 / (w.rate * (1 + 0.03 * fl) * (G.st.rateMul || 1)); P.atkAnim = 0.2; P.punch ^= 1; P.idleT = 0;
  const ang = Math.atan2(P.fy, P.fx);
  if (w.style === 'throw') { const sp = 230; G.projs.push({ k: 'card', x: P.x, y: P.y - 10, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: 5, dmg: G.st.atk * w.mul * (1 + 0.1 * fl), life: w.reach / sp + 0.08, pierce: G.st.pierce || 1, hit: new Set(), mine: true, rot: 0, slow: 0.01 }); sfx('swing'); return; }
  G.fx.push({ k: 'swing', x: P.x, y: P.y - 8, a: ang, reach: w.reach, arc: w.arc * Math.PI / 180, t: 0, dur: 0.18, style: w.style, wpn: G.pd.eq.weapon, side: P.punch });
  let hit = false;
  for (const e of G.enemies) {
    if (e.dead || e.spawnT > 0) continue;
    const dx = e.x - P.x, dy = (e.y - e.h * 0.35) - (P.y - 8), d = Math.hypot(dx, dy);
    if (d < w.reach + e.r && (d < e.r + 5 || angDiff(Math.atan2(dy, dx), ang) < w.arc * Math.PI / 360 + 0.25)) {
      dealDamage(e, G.st.atk * w.mul * (1 + 0.1 * fl), { kb: w.kb, ang }); hit = true;
    }
  }
  sfx(hit ? 'punch' : 'swing');
  if (hit) { G.hitstop = 0.03; G.shake = Math.max(G.shake, 1.2); }
}

export function dealDamage(e, raw, o) {
  o = o || {}; if (e.dead) return 0;
  const crit = !o.noCrit && Math.random() < G.st.crit + (o.critAdd || 0);
  let dmg = o.trueDmg ? raw : Math.max(raw * 0.2, raw - e.def * 0.5);
  if (e.rival) dmg *= o.col === 'mental' ? PVP_MUL * 0.35 : PVP_MUL;
  if (e.boss && !e.rival) dmg *= G.st.bossMul || 1;
  dmg *= rand(0.9, 1.1); if (crit) dmg *= G.st.critMul; dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg; e.flash = 0.12; if (e.raid) raidHit(e, dmg);
  if (o.kb && !e.boss) { e.kbx += Math.cos(o.ang) * o.kb; e.kby += Math.sin(o.ang) * o.kb; }
  if (o.stun) e.stun = Math.max(e.stun, e.boss ? o.stun * 0.35 : o.stun);
  if (o.slow) e.slow = Math.max(e.slow, o.slow);
  if (o.fear) e.fear = Math.max(e.fear, e.boss ? 0 : o.fear);
  if (o.confuse) e.confuse = Math.max(e.confuse, e.boss ? o.confuse * 0.4 : o.confuse);
  addText(e.x, e.y - e.h - 2, dmg, o.col || (crit ? 'crit' : 'dmg'));
  burst(e.x, e.y - e.h / 2, e.col, crit ? 7 : 3);
  if (crit) sfx('crit'); else sfx('hit');
  if (e.hp <= 0) killEnemy(e);
  return dmg;
}

export function hurtPlayer(raw, src) {
  const P = G.P; if (P.inv > 0 || G.state !== 'play' || G.ult) return;
  if (G.pvp) raw *= PVP_MUL;
  let dmg = raw * 60 / (60 + G.st.def); dmg = Math.max(1, Math.round(dmg * rand(0.9, 1.1)));
  P.hp -= dmg; P.inv = 0.5; P.flash = 0.15;
  addText(P.x, P.y - 24, dmg, 'hurt'); G.shake = Math.max(G.shake, 3); sfx('hurt');
  if (src) { const a = Math.atan2(P.y - src.y, P.x - src.x); P.kbx += Math.cos(a) * 70; P.kby += Math.sin(a) * 70; }
  if (Math.random() < 0.15) bubble(P, choice(['아야!', '아 진짜!', '앗 뜨거', '으악!', '감히 나를?!']), 1);
  if (P.hp <= 0) { P.hp = 0; playerDie(); }
}

on('bubble', bubble); // core 이벤트
on('text', addText); // core 이벤트 (글자 효과)
