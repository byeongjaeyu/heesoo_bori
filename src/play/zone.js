// ===================== 필드: 스테이지 진행 (소환·보스·출구·보리 이벤트) =====================
// ---------- spawning / quest ----------


import { VH, VW } from '../sys/dom.js';
import { choice, clamp, rand, wpick } from '../core/util.js';
import { playBgm, sfx } from '../sys/audio.js';
import { INP } from '../sys/input.js';
import { MONS, ZONES } from '../core/data.js';
import { CHAPTERS, CH1_N, chCleared, isChLast, kidNow, setCurZone, zoneCh } from '../core/chapter.js';
import { chFinish, chStageStory } from './chapter-flow.js';
import { ENDING } from '../chapters/ch1.js';
import { buildWorld } from '../draw/world.js';
import { G } from '../core/state.js';
import { saveGame, sk } from '../core/save.js';
import { calcStats } from '../core/items.js';
import { bubble, burst, moveToward, newBori, newPlayer, word } from './player.js';
import { FIRST_BOSS, loopLv, loopMul, zoneQuota } from '../core/loop.js';
import { spawnEnemy } from './enemies.js';
import { updateCam, updateFx } from './fx.js';
import { banner, dialog, fadeTo, toast } from '../ui/dialog.js';
import { showHUD } from '../ui/hud.js';
import { showDeath, startEnding } from '../ui/lobby.js';
import { pvpEnd } from '../net/pvp.js';
import { guideEv } from '../features/guide.js';
import { raidEnd } from '../net/raid.js';
import { buddySpawn } from '../net/buddy.js';
import { towerEnd } from './tower.js';
import { playCut } from '../story/story.js';
import { tt } from '../sys/i18n.js';

export function updateSpawner(dt) {
  const Z = ZONES[G.zone]; if (G.bossDefeated) return;
  const alive = G.enemies.filter(e => !e.dead && !e.boss).length;
  const L = loopLv(); const max = (G.bossSpawned ? 3 + (G.zone % CH1_N) : Z.max) + Math.min(6, 2 * L);
  G.spawnT -= dt;
  if (G.spawnT <= 0 && alive < max) { G.spawnT = Z.spawnInt * (G.bossSpawned ? 2.2 : 1) / (1 + 0.15 * L); spawnAround(wpick(Z.mons)); }
}
export function spawnAround(type, minD, maxD) {
  const W = G.world, P = G.P;
  for (let k = 0; k < 12; k++) {
    const a = rand(0, 6.28), d = rand(minD || 120, maxD || 190), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if (x < 30 || x > W.W - 30 || y < (W.top || 34) + 16 || y > W.H - 30) continue;
    if (W.solids.some(s => Math.hypot(x - s.x, y - s.y) < s.r + 8)) continue;
    return spawnEnemy(type, x, y);
  }
  return null;
}
export function updateQuest() {
  const Z = ZONES[G.zone], W = G.world;
  if (!G.bossSpawned && G.zoneKills >= zoneQuota(Z)) spawnBoss();
  if (G.exitOpen && Math.hypot(G.P.x - W.gate.x, G.P.y - (W.gate.y + 4)) < 16) goNextZone();
}
function spawnBoss() {
  const Z = ZONES[G.zone], W = G.world, P = G.P; G.bossSpawned = true;
  let x = W.W / 2, y = 290; if (Math.hypot(P.x - x, P.y - y) < 90) y = P.y > 400 ? P.y - 130 : P.y + 130;
  y = clamp(y, Math.max(120, (W.top || 34) + 70), W.H - 80);
  const b = spawnEnemy(Z.boss, x, y); b.spawnT = 1.3; G.boss = b;
  // 처음 1장을 깨는 중(첫 회차)엔 보스를 조금 약하게 — 처음 시작한 사람이 첫 보스에서 오래 막히지 않게
  if (!G.inf && zoneCh(G.zone) === 1 && !(G.pd.cleared > 0)) { b.maxHp = Math.round(b.maxHp * FIRST_BOSS.hp); b.hp = b.maxHp; b.atk *= FIRST_BOSS.atk; }
  banner('BOSS', MONS[Z.boss].name + tt('play/zone.1'), 'boss'); sfx('boss'); playBgm('boss'); G.shake = 6;
  G.fx.push({ k: 'ring', x, y: y - 10, r: 50, col: '#ff4d6d', t: 0, dur: 0.9 });
  bubble(P, choice([tt('play/zone.2'), tt('play/zone.3'), tt('play/zone.4')]), 1.8);
}
export function onBossDefeated(e) {
  if (G.tower) { G.boss = null; towerEnd(true); return; }
  G.bossDefeated = true; G.boss = null; G.exitOpen = true; guideEv('boss');
  for (const o of G.enemies) if (!o.dead && o !== e) { o.dead = true; o.deadT = 0.25; burst(o.x, o.y - o.h / 2, o.col, 6); }
  G.projs = G.projs.filter(p => !p.enemy);
  setTimeout(() => { if (G.state === 'play') banner('CLEAR!', !isChLast(G.zone) ? tt('play/zone.5') : tt('play/zone.6'), 'clear'); }, 600);
  sfx('open'); playBgm('field'); G.shake = 8; saveGame();
  bubble(G.P, choice([tt('play/zone.7'), tt('play/zone.8'), tt('play/zone.9')]), 1.8);
}
function goNextZone() {
  if (G.state !== 'play') return;
  G.state = 'trans'; sfx('open');
  if (zoneCh(G.zone) > 1 && isChLast(G.zone)) { chFinish(zoneCh(G.zone)); return; }
  if (zoneCh(G.zone) === 1 && G.zone >= CH1_N - 1) {
    const first = !G.pd.cleared; G.pd.cleared = (G.pd.cleared || 0) + 1;
    // 자동사냥 중이면(첫 클리어 제외) 엔딩 컷신(대사 자동 넘김)을 보여주고 결과 화면 없이 바로 다음 회차 STAGE 1로
    if (G.auto && !first) { setCurZone(G.pd, 0); saveGame(); fadeTo(() => { showHUD(false); playCut(ENDING, () => fadeTo(() => { G.auto = true; startZone(0); toast(tt('play/zone.10', { cleared: G.pd.cleared, v1: G.pd.cleared + 1 }), 'lvl'); })); }); return; }
    saveGame(); fadeTo(() => startEnding()); return; }
  setCurZone(G.pd, G.zone + 1); const n = 2 + Math.floor(loopLv() / 2); G.pd.foods.gimbap = (G.pd.foods.gimbap || 0) + n; G.pd.foods.drink = (G.pd.foods.drink || 0) + n; saveGame();
  fadeTo(() => { startZone(G.zone + 1); setTimeout(() => { if (G.state === 'play' || G.state === 'dialog') { toast(tt('play/zone.11', { n }), 'item r2'); sfx('coin'); if (G.P) bubble(G.P, tt('play/zone.12'), 1.4); } }, 2900); });
}
export function startZone(i) {
  G.pvp = null; G.inf = null; G.raid = null; G.tower = null; G.husUsed = false;
  G.zone = i; setCurZone(G.pd, i); G.world = buildWorld(i); const W = G.world; G.autoExitSaid = false; G.autoNoFood = false;
  G.enemies = []; G.projs = []; G.fx = []; G.drops = []; G.parts = []; G.texts = []; G.bubbles = [];
  G.zoneKills = 0; G.bossSpawned = false; G.bossDefeated = false; G.boss = null; G.exitOpen = false; G.spawnT = 1.5; G.ult = null;
  G.P = null; calcStats(); G.P = newPlayer(W.start.x, W.start.y); G.P.fy = -1; G.P.dir = 'up';
  const CHD = CHAPTERS[zoneCh(i)]; G.bori = G.pd.boriJoined && !CHD.noBori ? newBori(W.start.x + 14, W.start.y + 3) : null; buddySpawn(); // 5장 어린 시절엔 보리가 없음
  for (let k = 0; k < 5; k++) { const e = spawnAround(wpick(ZONES[i].mons), 140, 260); if (e) e.spawnT = 0; }
  G.cam.x = clamp(G.P.x - VW / 2, 0, Math.max(0, W.W - VW)); G.cam.y = clamp(G.P.y - 12 - VH / 2, 0, Math.max(0, W.H - VH));
  G.state = 'play'; playBgm('field'); showHUD(true); saveGame();
  { const L = loopLv(), RL = chCleared(G.pd, i); banner(RL ? tt('play/zone.13', { v1: RL + 1, sub: ZONES[i].sub }) : ZONES[i].sub, ZONES[i].name, 'stage'); if (L && i === 0) setTimeout(() => { if (G.state === 'play' && !G.pvp) loopIntro(L); }, 1700); }
  if (CHD.onZone) { CHD.onZone(G.pd, i); calcStats(); } // 장별 입장 처리 (5장: STAGE 3 에서 나무자재 → 나무칼)
  { const st = zoneCh(i) > 1 && chStageStory(i); if (st) { saveGame(); playCut(st, () => { G.state = 'play'; showHUD(true); playBgm('field'); }); } }
  if (!G.pd.boriJoined && !CHD.noBori) { if (G.pd.lv >= 3) G.pendingEvent = 'bori'; else setTimeout(() => { if (G.state === 'play' && !G.pd.boriJoined) bubble(G.P, tt('play/zone.14'), 2.6); }, 1800); }
}
export function playerDie() {
  if (!G.pvp && husbandSave()) return;
  if (G.pvp) { burst(G.P.x, G.P.y - 10, '#ffffff', 20); pvpEnd(false, tt('play/zone.15')); return; }
  if (G.raid) { burst(G.P.x, G.P.y - 10, '#ffffff', 20); raidEnd(tt('play/zone.16')); return; }
  if (G.tower) { burst(G.P.x, G.P.y - 10, '#ffffff', 20); towerEnd(false, tt('play/zone.16')); return; }
  G.state = 'dead'; G.pd.stats.deaths++; INP.atk = false;
  burst(G.P.x, G.P.y - 10, '#ffffff', 20);
  setTimeout(() => showDeath(), 700);
}
export function respawn() {
  const pd = G.pd, W = G.world; const lost = G.inf ? 0 : Math.floor(pd.gold * 0.1); pd.gold -= lost;
  G.P.x = W.start.x; G.P.y = W.start.y; G.P.hp = G.st.hp; G.P.mp = G.st.mp; G.P.inv = 2; G.P.kbx = G.P.kby = 0;
  if (G.bori) { G.bori.x = G.P.x + 14; G.bori.y = G.P.y + 3; G.bori.zoom = null; }
  G.projs = []; for (const e of G.enemies) if (!e.boss && Math.hypot(e.x - G.P.x, e.y - G.P.y) < 140) e.gone = true;
  if (G.boss && !G.inf) { G.boss.hp = G.boss.maxHp; G.boss.st = 'idle'; G.boss.x = W.W / 2; G.boss.y = 290; G.boss.hopY = 0; }
  G.state = 'play'; if (lost) toast(tt('play/zone.17', { lost }), 'sub');
  bubble(G.P, tt('play/zone.18'), 1.5);
}

// ---------- bori event ----------
export function boriEvent() {
  const P = G.P, W = G.world; G.state = 'event';
  const sx = P.x + 64 < W.W - 30 ? P.x + 64 : P.x - 64, sy = clamp(P.y - 6, (W.top || 34) + 16, W.H - 30);
  G.bori = newBori(sx, sy); G.bori.hidden = true;
  G.evt = { t: 0, sx, sy, popped: false, arrived: false, talked: false };
  P.fx = sx > P.x ? 1 : -1; P.fy = 0; P.dir = P.fx > 0 ? 'right' : 'left'; P.idleT = 0; INP.atk = false;
  bubble(P, tt('play/zone.19'), 1.6);
}
export function updateEvent(dt) {
  const E = G.evt, B = G.bori, P = G.P; E.t += dt;
  if (!E.popped && E.t > 1.2) { E.popped = true; B.hidden = false; B.jump = 0.4; sfx('bark'); bubble(B, tt('play/zone.20'), 1.2); burst(E.sx, E.sy - 4, '#4f9a3f', 14, 60); }
  if (E.popped && !E.arrived) { if (E.t > 1.7) { moveToward(B, P.x + (E.sx > P.x ? 11 : -11), P.y + 2, 90, dt); B.run = true; B.t += dt; if (Math.hypot(B.x - P.x, B.y - P.y) < 14) { E.arrived = true; B.run = false; B.jump = 0.5; sfx('ding'); for (let i = 0; i < 10; i++) G.parts.push({ x: P.x + rand(-10, 10), y: P.y - 10, vx: rand(-25, 25), vy: rand(-60, -30), life: 1.2, max: 1.2, col: '#ff7ab8', sz: 3, grav: 30, heart: true }); E.at = E.t; } } }
  if (E.arrived && !E.talked && E.t > E.at + 0.8) {
    E.talked = true;
    dialog([
      { who: 'bori', text: tt('play/zone.21') },
      { who: 'hee', text: tt('play/zone.22') },
      { who: 'bori', text: tt('play/zone.23') },
      { who: 'hee', text: tt('play/zone.24') },
      { who: 'sys', text: tt('play/zone.25') },
      { who: 'sys', text: tt('play/zone.26') },
      { who: 'sys', text: tt('play/zone.27') }
    ], () => { G.pd.boriJoined = true; G.pd.sp += 1; G.evt = null; G.state = 'play'; showHUD(true); saveGame(); toast(tt('play/zone.28'), 'lvl'); });
  }
  updateFx(dt); updateCam(dt);
}

// ---------- 회차 시작 대사 · 오빠가 일으켜 주기 (core/loop.js 에서 옮김) ----------
function loopIntro(L) {
  const n = (G.pd.cleared || 0) + 1, LM = loopMul();
  const lines = L === 1 ? [
    { who: 'sys', text: tt('play/zone.29') },
    { who: 'sys', text: tt('play/zone.30') },
    { who: 'sys', text: tt('play/zone.31') },
    { who: 'sys', text: tt('play/zone.32') },
    { who: 'hee', text: tt('play/zone.33') },
    { who: 'bori', text: tt('play/zone.34') }
  ] : [
    { who: 'sys', text: tt('play/zone.35', { n, v1: LM.hp.toFixed(1), v2: LM.atk.toFixed(2).replace(/0$/, ''), v3: Math.round(LM.elite * 100) }) },
    { who: 'sys', text: L === 2 ? tt('play/zone.36') + LM.gold.toFixed(1) + tt('play/zone.37') + LM.item.toFixed(1) + tt('play/zone.38') : tt('play/zone.39', { v1: LM.gold.toFixed(1), v2: LM.item.toFixed(1) }) },
    { who: 'hee', text: choice([tt('play/zone.40'), tt('play/zone.41'), tt('play/zone.42')]) }
  ];
  dialog(lines);
}
function husbandSave() {
  const lv = sk('husband'), P = G.P; if (!lv || G.husUsed || !P) return false;
  G.husUsed = true; P.hp = Math.round(G.st.hp * (lv >= 2 ? 0.6 : 0.3)); P.inv = lv >= 2 ? 3 : 1.5; P.kbx = P.kby = 0;
  for (const e of G.enemies) if (!e.dead && !e.boss && Math.hypot(e.x - P.x, e.y - P.y) < 50) { const a = Math.atan2(e.y - P.y, e.x - P.x); e.kbx = Math.cos(a) * 160; e.kby = Math.sin(a) * 160; e.stun = Math.max(e.stun, 0.8); }
  const kid = kidNow(); // 5장 어린 시절엔 오빠 대신 아빠가 달려옴
  G.fx.push({ k: kid ? 'dad' : 'hus', x: P.x - 16, y: P.y, t: 0, dur: 1.6 }); G.fx.push({ k: 'ring', x: P.x, y: P.y - 8, r: 50, col: '#7ec8ff', t: 0, dur: 0.6 });
  G.shake = 5; sfx('lvl'); word(P.x, P.y - 34, kid ? tt('play/zone.49') : tt('play/zone.43'), '#7ec8ff', 1.6);
  bubble(P, kid ? choice([tt('play/zone.50'), tt('play/zone.51'), tt('play/zone.52')]) : choice([tt('play/zone.44'), tt('play/zone.45'), tt('play/zone.46')]), 1.8);
  toast(kid ? tt('play/zone.53', { v1: lv >= 2 ? 60 : 30, v2: lv >= 2 ? tt('play/zone.47') : '' }) : tt('play/zone.48', { v1: lv >= 2 ? 60 : 30, v2: lv >= 2 ? tt('play/zone.47') : '' }), 'lvl');
  return true;
}
