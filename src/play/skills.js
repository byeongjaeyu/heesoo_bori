// ===================== 필드: 스킬 =====================
// ---------- skills ----------


import { VH, VW } from '../sys/dom.js';
import { angDiff, choice, rand } from '../core/util.js';
import { sfx } from '../sys/audio.js';
import { MENHERA_LINES, NAG_WORDS, SKILLS } from '../core/data.js';
import { G } from '../core/state.js';
import { sk } from '../core/save.js';
import { bubble, burst, collide, dealDamage, dirOf, nearestEnemy, word } from './player.js';
import { toast } from '../ui/dialog.js';
import { guideEv } from '../features/guide.js';
import { tt } from '../sys/i18n.js';

export function trySkill(id) {
  const lv = sk(id), S = SKILLS[id], P = G.P;
  if (!lv) { toast(tt('play/skills.1', { name: S.name }), 'warn'); sfx('warn'); return; }
  if ((P.cds[id] || 0) > 0) return;
  if (P.mp < S.mp) { toast(tt('play/skills.2'), 'warn'); sfx('warn'); return; }
  P.mp -= S.mp; P.cds[id] = S.cd(lv); P.idleT = 0;
  const keepAtk = G.st.atk; G.st.atk = Math.round(keepAtk * (G.st.skillMul || 1)); try { CAST[id](lv); } finally { G.st.atk = keepAtk; } guideEv('skill:' + id);
}
function aimNearest(range) { const P = G.P; const t = nearestEnemy(P.x, P.y - 6, range); if (t) { const a = Math.atan2((t.y - t.h * 0.35) - (P.y - 8), t.x - P.x); P.fx = Math.cos(a); P.fy = Math.sin(a); P.dir = dirOf(P.fx, P.fy); } return Math.atan2(P.fy, P.fx); }
const ULT_SLOTS = [[0.3, 0.19], [0.7, 0.215], [0.28, 0.45], [0.72, 0.5], [0.3, 0.58], [0.7, 0.65], [0.3, 0.73], [0.68, 0.8]];
const CAST = {
  smash(lv) {
    const P = G.P, a = aimNearest(46);
    P.x += Math.cos(a) * 7; P.y += Math.sin(a) * 7; collide(P, 5);
    P.atkAnim = 0.3; P.castT = 0.15;
    const hx = P.x + Math.cos(a) * 14, hy = P.y - 8 + Math.sin(a) * 14;
    G.fx.push({ k: 'slap', x: hx, y: hy, a, t: 0, dur: 0.45 });
    for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; const dx = e.x - P.x, dy = (e.y - e.h * 0.35) - (P.y - 8), d = Math.hypot(dx, dy); if (d < 30 + e.r && (d < e.r + 8 || angDiff(Math.atan2(dy, dx), a) < 1.3)) dealDamage(e, G.st.atk * (2.2 + 0.4 * (lv - 1)), { kb: 170, ang: a, stun: 0.6, critAdd: 0.1 }); }
    G.shake = 4; G.hitstop = 0.06; sfx('smash'); word(hx, hy - 10, tt('play/skills.3'), '#ffd84a', 2.2);
  },
  nag(lv) {
    const P = G.P, a0 = aimNearest(130), n = 4 + lv, spread = 0.95;
    for (let i = 0; i < n; i++) { const a = a0 - spread / 2 + spread * i / (n - 1); G.projs.push({ k: 'nag', x: P.x, y: P.y - 12, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, r: 6, dmg: G.st.atk * (0.9 + 0.15 * (lv - 1)), life: 0.95, pierce: 3, hit: new Set(), word: choice(NAG_WORDS), mine: true }); }
    P.castT = 0.2; P.atkAnim = 0.2; sfx('nag'); bubble(P, choice([tt('play/skills.4'), tt('play/skills.5'), tt('play/skills.6')]), 1.2);
  },
  flash(lv) {
    const P = G.P, r = 56 + 4 * lv; P.castT = 0.45; P.dir = 'down';
    G.shake = 5; G.fx.push({ k: 'ring', x: P.x, y: P.y - 8, r, col: '#ff7ab8', t: 0, dur: 0.5 }); G.fx.push({ k: 'ring', x: P.x, y: P.y - 8, r: r * 0.7, col: '#ffffff', t: 0, dur: 0.4 }); G.fx.push({ k: 'house', x: P.x, y: P.y - 26, t: 0, dur: 0.7 });
    for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; if (Math.hypot(e.x - P.x, e.y - P.y) < r + e.r) { const st = 1.2 + 0.2 * lv; dealDamage(e, G.st.atk * (1.5 + 0.3 * (lv - 1)), { stun: st }); if (!e.dead) { e.panic = e.boss ? st * 0.35 : st; burst(e.x, e.y - e.h - 2, '#7ec8ff', 3, 30); } } }
    sfx('gohome'); word(P.x, P.y - 36, tt('play/skills.7'), '#ffd1e6', 1.5); bubble(P, choice([tt('play/skills.8'), tt('play/skills.9'), tt('play/skills.10')]), 1.3);
  },
  menhera(lv) {
    const lines = MENHERA_LINES.slice().sort(() => Math.random() - 0.5).slice(0, 8);
    G.ult = { t: 0, lv, dur: 3.0, applied: false, lines: lines.map((txt, i) => { const sl = ULT_SLOTS[i]; return { txt, x: sl[0] + rand(-0.06, 0.06), y: sl[1] + rand(-0.02, 0.02), d: 0.15 + i * 0.13, rot: rand(-0.14, 0.14), s: rand(0.9, 1.12) }; }) };
    G.pd.stats.ults++; G.P.inv = 3.2; G.P.castT = 0.9; sfx('ult');
  }
};
export function updateUlt(dt) {
  const U = G.ult; U.t += dt;
  if (!U.applied && U.t >= 0.95) {
    U.applied = true; G.shake = 9; G.flash = 0.2;
    const dmg = G.st.atk * (G.st.skillMul || 1) * (10 + 5 * U.lv);
    for (const e of G.enemies) { if (e.dead) continue; e.spawnT = 0; dealDamage(e, dmg, { trueDmg: true, confuse: 4, col: 'mental', noCrit: true }); if (!e.dead) e.mental = 4; }
    for (let i = 0; i < 26; i++) G.parts.push({ x: G.cam.x + rand(0, VW), y: G.cam.y + rand(-20, VH * 0.6), vx: rand(-10, 10), vy: rand(30, 70), life: rand(1, 1.8), max: 1.8, col: choice(['#b45cff', '#ff7ab8', '#ffb3d9']), sz: 3, grav: 20, heart: true });
  }
  if (U.t >= U.dur) G.ult = null;
}
