// ===================== 필드: 효과 업데이트 =====================
// ---------- fx update ----------


import { VH, VW } from '../sys/dom.js';
import { clamp, lerp } from '../core/util.js';
import { INP } from '../sys/input.js';
import { G } from '../core/state.js';
import { saveGame } from '../core/save.js';
import { burst, dealDamage, hurtPlayer, updatePlayer } from './player.js';
import { trySkill, updateUlt } from './skills.js';
import { autoFeed, updateBori } from './bori.js';
import { separateEnemies, updateEnemy } from './enemies.js';
import { updateDrops } from './drops.js';
import { quickFood } from './food.js';
import { boriEvent, updateQuest, updateSpawner } from './zone.js';
import { toast } from '../ui/dialog.js';
import { openMenu } from '../ui/menu.js';
import { pvpForfeit, pvpUpdate } from '../net/pvp.js';
import { infSpawner } from './inf.js';
import { autoTick, autoToggle } from './auto.js';
import { raidUpdate } from '../net/raid.js';
import { buddyOpen, buddyUpdate } from '../net/buddy.js';
import { towerUpdate } from './tower.js';
import { plazaUpdate } from '../net/plaza.js';

function updateProjs(dt) {
  const P = G.P;
  for (const p of G.projs) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.rot += dt * 8;
    if (p.x < 0 || p.x > G.world.W || p.y < 0 || p.y > G.world.H) p.life = 0;
    if (p.enemy) { if (Math.hypot(P.x - p.x, P.y - 9 - p.y) < p.r + 5) { hurtPlayer(p.dmg, null); p.life = 0; burst(p.x, p.y, p.col || '#fff', 4); } }
    else {
      for (const e of G.enemies) { if (e.dead || e.spawnT > 0 || p.hit.has(e.id)) continue; if (Math.hypot(e.x - p.x, (e.y - e.h * 0.4) - p.y) < e.r + p.r) { p.hit.add(e.id); dealDamage(e, p.dmg, { slow: p.slow || 2, kb: 40, ang: Math.atan2(p.vy, p.vx) }); if (--p.pierce <= 0) { p.life = 0; break; } } }
    }
  }
  G.projs = G.projs.filter(p => p.life > 0);
}
export function updateFx(dt) {
  for (const f of G.fx) { f.t += dt; if (f.t >= f.dur && f.onEnd && !f.ended) { f.ended = true; f.onEnd(); } }
  G.fx = G.fx.filter(f => f.t < f.dur);
  for (const p of G.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt; p.life -= dt; }
  G.parts = G.parts.filter(p => p.life > 0);
  for (const t of G.texts) t.t += dt; G.texts = G.texts.filter(t => t.t < t.dur);
  updateBubbles(dt);
}
export function updateBubbles(dt) { for (const b of G.bubbles) b.t += dt; G.bubbles = G.bubbles.filter(b => b.t < b.dur && !(b.ent && b.ent.gone)); }
export function updateCam(dt) {
  const W = G.world, P = G.P;
  let tx = P.x - VW / 2, ty = P.y - 12 - VH / 2;
  tx = W.W <= VW ? (W.W - VW) / 2 : clamp(tx, 0, W.W - VW); ty = W.H <= VH ? (W.H - VH) / 2 : clamp(ty, 0, W.H - VH);
  const k = 1 - Math.pow(0.0005, dt); G.cam.x = lerp(G.cam.x, tx, k); G.cam.y = lerp(G.cam.y, ty, k);
}

function handleActions() {
  for (const a of INP.act) {
    if (a === 's1') trySkill('smash'); else if (a === 's2') trySkill('nag'); else if (a === 's3') trySkill('flash'); else if (a === 'ult') trySkill('menhera');
    else if (a === 'auto') autoToggle();
    else if (a === 'buddy') buddyOpen();
    else if ((a === 'hp' || a === 'mp') && G.pvp) toast('PvP에선 음식을 먹을 수 없어요!', 'warn');
    else if (a === 'hp') quickFood('hp'); else if (a === 'mp') quickFood('mp');
    else if ((a === 'menu' || a === 'esc') && G.pvp) pvpForfeit();
    else if (a === 'menu' || a === 'esc') openMenu();
  }
  INP.act.clear();
}

export function update(dt) {
  G.time += dt; G.pd.stats.time += dt;
  if (G.hitstop > 0) { G.hitstop -= dt; for (const t of G.texts) t.t += dt; return; }
  handleActions();
  if (G.state !== 'play') return;
  if (G.ult) updateUlt(dt);
  const frozen = G.ult && G.ult.t < 0.95;
  if (G.state === 'play') { autoTick(dt); if (G.buddy) buddyUpdate(dt); } else { G.autoMove = null; G.autoAtk = false; }
  updatePlayer(dt);
  if (!frozen) {
    updateBori(dt);
    for (const e of G.enemies) updateEnemy(e, dt);
    separateEnemies(); updateProjs(dt); if (G.pvp) pvpUpdate(dt); else if (G.raid) raidUpdate(dt); else if (G.tower) towerUpdate(dt); else if (G.plaza) plazaUpdate(dt); else if (G.inf) infSpawner(dt); else updateSpawner(dt);
  }
  G.enemies = G.enemies.filter(e => !e.gone);
  updateDrops(dt); updateFx(dt);
  if (G.state === 'play' && !G.pvp && !G.inf) updateQuest();
  updateCam(dt);
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 14);
  if (G.flashT > 0) G.flashT -= dt;
  if (G.flash > 0) G.flash -= dt;
  G.saveT += dt; if (G.saveT > 15) { G.saveT = 0; saveGame(); }
  if (G.state === 'play' && !G.pvp) autoFeed(dt);
  if (G.pendingEvent && !G.ult && G.state === 'play' && !G.pvp) { const ev = G.pendingEvent; G.pendingEvent = null; if (ev === 'bori') boriEvent(); }
}
