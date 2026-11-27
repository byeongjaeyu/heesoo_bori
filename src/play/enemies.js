// ===================== 필드: 적 (기본 이동 패턴 AI + 장 보스 패턴 합치기) =====================
// ---------- enemies ----------


import { choice, clamp, rand, randi, wpick } from '../core/util.js';
import { monSpr } from '../draw/sprite.js';
import { sfx } from '../sys/audio.js';
import { FOODS, FOOD_ORDER, MONS } from '../core/data.js';
import { CHAPTERS } from '../core/chapter.js';
import { G } from '../core/state.js';
import { addText, bubble, burst, collide, hurtPlayer, moveAway, moveToward, wander } from './player.js';
import { DROP_MUL, killStones, loopMul, rollDrop } from '../core/loop.js';
import { spawnDrop } from './drops.js';
import { gainXp } from '../core/progress.js';
import { onBossDefeated } from './zone.js';
import { pvpEnd } from '../net/pvp.js';
import { infKill, infWaveMul } from './inf.js';
import { dailyAdd } from '../features/daily.js';
import { guideEv } from '../features/guide.js';

export function spawnEnemy(type, x, y) {
  const m = MONS[type], s = monSpr(m.spr), sc = m.scale || 1;
  const LM = loopMul(); let sc2 = sc, hpM = LM.hp, atkM = LM.atk; const elite = LM.L > 0 && !m.boss && !G.pvp && Math.random() < LM.elite; if (elite) { hpM *= 2.5; atkM *= 1.3; sc2 = sc * 1.25; }
  const WM = infWaveMul(); const hp0 = Math.round(m.hp * hpM * WM.hp);
  const e = { type, m, x, y, hp: hp0, maxHp: hp0, atk: m.atk * atkM * WM.atk, def: m.def + LM.def, spd: m.spd * LM.spd, elite, r: m.r, h: s.H * sc2, w: s.W * sc2, sc: sc2, boss: !!m.boss, col: m.col, t: rand(0, 10), atkCd: rand(0.5, 1.2), kbx: 0, kby: 0, stun: 0, slow: 0, fear: 0, confuse: 0, mental: 0, flash: 0, wx: 0, wy: 0, wT: 0, st: 'idle', stT: 0, spawnT: 0.45, id: ++G.eid, fly: !!m.fly, face: 1, hopY: 0 };
  G.enemies.push(e); return e;
}
export const AI = {
  hop(e, dt, sp, dP) { const c = e.t % 1.1; e.hopY = c < 0.45 ? Math.sin(c / 0.45 * Math.PI) * 4 : 0; if (dP < 130) { if (c < 0.45) moveToward(e, G.P.x, G.P.y, sp * 2.3, dt); } else wander(e, sp, dt, 1.5); },
  float(e, dt, sp, dP) { e.hopY = 3 + Math.sin(e.t * 3) * 2; if (dP < 140) { const a = Math.atan2(G.P.y - e.y, G.P.x - e.x) + Math.sin(e.t * 2) * 0.9; e.x += Math.cos(a) * sp * dt; e.y += Math.sin(a) * sp * dt; e.face = Math.cos(a) > 0 ? 1 : -1; } else wander(e, sp, dt, 1.2); },
  chase(e, dt, sp, dP) { if (dP < 150) moveToward(e, G.P.x, G.P.y, sp, dt); else wander(e, sp * 0.6, dt, 1.5); },
  charge(e, dt, sp, dP) {
    if (e.st === 'tele') { e.stT -= dt; if (e.stT <= 0) { e.st = 'dash'; e.stT = 0.55; } return; }
    if (e.st === 'dash') { e.stT -= dt; e.x += e.dx * sp * 3.6 * dt; e.y += e.dy * sp * 3.6 * dt; if (Math.random() < dt * 20) G.parts.push({ x: e.x, y: e.y, vx: 0, vy: -8, life: 0.3, max: 0.3, col: '#e8dcc8', sz: 2, grav: 0 }); if (e.stT <= 0) { e.st = 'rest'; e.stT = 1.0; } return; }
    if (e.st === 'rest') { e.stT -= dt; if (e.stT <= 0) e.st = 'idle'; return; }
    if (dP < 78 && dP > 18) { e.st = 'tele'; e.stT = 0.6; const a = Math.atan2(G.P.y - e.y, G.P.x - e.x); e.dx = Math.cos(a); e.dy = Math.sin(a); e.face = e.dx > 0 ? 1 : -1; G.fx.push({ k: 'line', x: e.x, y: e.y - 4, a, len: sp * 3.6 * 0.55, w: 8, t: 0, dur: 0.6 }); return; }
    if (dP < 150) moveToward(e, G.P.x, G.P.y, sp, dt); else wander(e, sp * 0.6, dt, 1.5);
  },
  ranged(e, dt, sp, dP) {
    if (dP < 155) {
      if (dP > 85) moveToward(e, G.P.x, G.P.y, sp, dt); else if (dP < 55) moveAway(e, sp, dt);
      e.face = G.P.x > e.x ? 1 : -1;
      if (e.shootT == null) e.shootT = rand(0.8, 1.8);
      e.shootT -= dt; if (e.shootT <= 0) { e.shootT = 2.3 + rand(0, 0.6); shootAt(e, e.m.proj); }
    } else wander(e, sp * 0.6, dt, 1.5);
  },
};
// ---------- 장 보스 패턴은 src/chapters/chN.js 의 ai (아래에서 합침) · 공용 돌진 도우미 ----------
/** 일직선 돌진 준비 (빨간 줄 예고) */
export function aimDash(e, len, w, say) { const a = Math.atan2(G.P.y - e.y, G.P.x - e.x); e.dx = Math.cos(a); e.dy = Math.sin(a); e.face = e.dx > 0 ? -1 : 1; G.fx.push({ k: 'line', x: e.x, y: e.y - 6, a, len, w, t: 0, dur: e.stT }); if (say) bubble(e, say, 1); }
export const dashStep = (e, spd, dt) => { const W = G.world; e.x += e.dx * spd * dt; e.y += e.dy * spd * dt; if (Math.random() < dt * 25) G.parts.push({ x: e.x + rand(-8, 8), y: e.y, vx: 0, vy: -8, life: 0.35, max: 0.35, col: '#e8e8f0', sz: 2, grav: 0 }); return e.x < 36 || e.x > W.W - 36 || e.y < (W.top || 34) + 36 || e.y > W.H - 30; };
for (const ch of CHAPTERS) if (ch && ch.ai) Object.assign(AI, ch.ai);
export function shootAt(e, kind, ang, spd) {
  const sy = e.y - e.h * 0.5 - (e.hopY || 0);
  const a = ang != null ? ang : Math.atan2(G.P.y - 8 - sy, G.P.x - e.x);
  const sp = spd || 92;
  G.projs.push({ k: kind, x: e.x, y: sy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 3, dmg: e.atk * 0.8, life: 3.2, enemy: true, rot: rand(0, 6), col: choice(['#ff7ab8', '#ffd84a', '#6fb8ff', '#7ccf5a', '#b45cff']) });
}
export function updateEnemy(e, dt) {
  e.t += dt; if (e.flash > 0) e.flash -= dt;
  if (e.dead) { e.deadT -= dt; if (e.deadT <= 0) e.gone = true; return; }
  if (e.spawnT > 0) { e.spawnT -= dt; return; }
  e.x += e.kbx * dt; e.y += e.kby * dt; const kd = Math.pow(0.003, dt); e.kbx *= kd; e.kby *= kd;
  e.atkCd -= dt; if (e.slow > 0) e.slow -= dt; if (e.mental > 0) e.mental -= dt; if (e.panic > 0) e.panic -= dt;
  const P = G.P, dP = Math.hypot(P.x - e.x, P.y - e.y);
  const sp = e.spd * (e.slow > 0 ? 0.55 : 1);
  if (e.stun > 0) e.stun -= dt;
  else if (e.confuse > 0) { e.confuse -= dt; wander(e, sp * 0.8, dt, 0.4); }
  else if (e.fear > 0) { e.fear -= dt; moveAway(e, sp * 1.2, dt); }
  else AI[e.m.ai](e, dt, sp, dP);
  if (e.stun <= 0 && e.confuse <= 0 && e.fear <= 0 && (e.hopY || 0) < 9 && dP < e.r + 6 && e.atkCd <= 0) { hurtPlayer(e.atk, e); e.atkCd = 1.0; }
  if (!e.fly) collide(e, e.r * 0.7); else { e.x = clamp(e.x, 20, G.world.W - 20); e.y = clamp(e.y, G.world.top || 34, G.world.H - 14); }
}
export function separateEnemies() {
  const L = G.enemies;
  for (let i = 0; i < L.length; i++) { const a = L[i]; if (a.dead) continue; for (let j = i + 1; j < L.length; j++) { const b = L[j]; if (b.dead) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = (a.r + b.r) * 0.8; if (d < m && d > 0.01) { const p = (m - d) / 2, wa = a.boss ? 0.1 : 1, wb = b.boss ? 0.1 : 1; a.x -= dx / d * p * wa; a.y -= dy / d * p * wa; b.x += dx / d * p * wb; b.y += dy / d * p * wb; } } }
}
export function killEnemy(e) {
  if (e.rival) { e.hp = 0; pvpEnd(true, `${e.nick}의 희수 KO!`); return; }
  e.dead = true; e.deadT = 0.25; e.hp = 0; G.pd.stats.kills++; dailyAdd('kill'); guideEv('kill'); if (e.boss) { dailyAdd('boss'); G.pd.stats.boss = (G.pd.stats.boss || 0) + 1; }
  burst(e.x, e.y - e.h / 2, e.col, e.boss ? 40 : 10, e.boss ? 140 : 80); burst(e.x, e.y - e.h / 2, '#ffffff', 4);
  const LM = loopMul(), em = e.elite ? 1 : 0, RW = infWaveMul().rew;
  sfx('pop'); gainXp(Math.round(e.m.xp * LM.xp * (em ? 3 : 1) * RW));
  const gold = Math.round(randi(e.m.gold[0], e.m.gold[1]) * G.st.goldMul * LM.gold * (em ? 4 : 1) * RW);
  if (em) { addText(e.x, e.y - e.h - 8, '정예 처치!', 'crit'); G.shake = 3; }
  if (gold > 0) { const n = Math.min(e.boss ? 12 : 4, Math.max(1, Math.ceil(gold / 6))); let left = gold; for (let i = 0; i < n; i++) { const a = i === n - 1 ? left : Math.floor(gold / n); left -= a; spawnDrop('gold', null, a, e.x, e.y); } }
  { const ns = killStones(e, LM.L); // 보스는 바로 지급(보스 타워는 처치 즉시 끝나서 땅에 떨어진 건 못 주움)
    if (ns > 0 && e.boss) { G.pd.stones = (G.pd.stones || 0) + ns; addText(e.x, e.y - e.h - 18, '강화석 +' + ns, 'mana'); } else if (ns > 0) spawnDrop('stone', null, ns, e.x, e.y); }
  if (e.boss) { spawnDrop('food', 'eel', 1, e.x, e.y); if (G.zone >= 1) spawnDrop('food', G.zone % 2 ? 'banhmi' : 'jjukkumi', 1, e.x, e.y); for (let i = 0; i < 3; i++) spawnDrop('food', rollFood(), 1, e.x, e.y); if (!G.inf) for (const id of (e.m.drops || [])) spawnDrop('item', id, 1, e.x, e.y); { const id = rollDrop(DROP_MUL.boss); if (id) spawnDrop('item', id, 1, e.x, e.y); } }
  else {
    if (Math.random() < 0.14) spawnDrop('food', rollFood(), 1, e.x, e.y);
    if (em) spawnDrop('food', rollFood(), 1, e.x, e.y);
    { const id = rollDrop(em ? DROP_MUL.elite : DROP_MUL.normal); if (id) spawnDrop('item', id, 1, e.x, e.y); }
  }
  if (G.inf) infKill(e); else if (e.boss) onBossDefeated(e); else if (!G.bossSpawned) G.zoneKills++;
}
const rollFood = () => wpick(FOOD_ORDER.map(id => [id, FOODS[id].w]));
