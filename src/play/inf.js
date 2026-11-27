// ===================== 무한던전 · 에버랜드: 할로윈파티 =====================
// 지금까지 깬 가장 높은 스테이지·회차의 몬스터가 끝없이 몰려옴. 얻은 골드·경험치·장비·강화는 그대로 저장.



import { $, VH, VW } from '../sys/dom.js';
import { choice, clamp, mulberry, rand, wpick } from '../core/util.js';
import { rowsToCanvas } from '../draw/sprite.js';
import { playBgm, sfx } from '../sys/audio.js';
import { ZONES } from '../core/data.js';
import { CH1_N } from '../core/chapter.js';
import { buildWorld } from '../draw/world.js';
import { G } from '../core/state.js';
import { loadGame, saveGame } from '../core/save.js';
import { calcStats } from '../core/items.js';
import { bubble, newBori, newPlayer } from './player.js';
import { loopEff } from '../core/loop.js';
import { spawnEnemy } from './enemies.js';
import { spawnAround } from './zone.js';
import { banner, toast } from '../ui/dialog.js';
import { showHUD } from '../ui/hud.js';
import { showTitle } from '../ui/lobby.js';
import { dailyAdd } from '../features/daily.js';
import { buddySpawn } from '../net/buddy.js';

export const INF_WAVE_KILLS = 40;
function infBasis(pd) {
  const cl = pd.cleared || 0, z = pd.zone || 0;
  if (z > 0) return { zone: z - 1, loop: loopEff(cl), real: cl };
  if (cl > 0) return { zone: CH1_N - 1, loop: loopEff(cl - 1), real: cl - 1 };
  return { zone: 0, loop: 0, none: true };
}
const infBasisLabel = b => `${(b.real != null ? b.real : b.loop) + 1}회차 ${ZONES[b.zone].name}${b.none ? ' (아직 깬 곳 없음)' : ''}`;
const PUMPKIN = [
  "....K1K....",
  "..KKK1KKK..",
  ".K3333333K.",
  "K33A333A33K",
  "K333333333K",
  "K33AAAAA33K",
  "K333A3A333K",
  ".K3333333K.",
  "..KKKKKKK.."];
function halloweenize(W) {
  W.tint = [60, 12, 80, 0.4]; W.glowA = 0.45;
  const img = rowsToCanvas(PUMPKIN), R = mulberry(31337);
  for (let k = 0, n = 0; k < 200 && n < 16; k++) {
    const x = 30 + R() * (W.W - 60), y = 80 + R() * (W.H - 140);
    if (W.solids.some(s => Math.hypot(x - s.x, y - s.y) < s.r + 10) || Math.hypot(x - W.start.x, y - W.start.y) < 40) continue;
    W.decor.push({ img, x: Math.round(x), y: Math.round(y), r: 0, space: 10, glow: '#ff9a3c' }); n++;
  }
}
export function startInfinite() {
  const saved = loadGame(); if (!saved) { toast('모험을 먼저 시작해야 들어갈 수 있어요', 'warn'); return; }
  G.pd = saved; const b = infBasis(G.pd), pd = G.pd;
  G.pvp = null; G.husUsed = false; G.inf = { zone: b.zone, loop: b.loop, wave: 1, kills: 0, waveKills: 0 };
  G.zone = b.zone; G.world = buildWorld(b.zone); const W = G.world; halloweenize(W);
  G.enemies = []; G.projs = []; G.fx = []; G.drops = []; G.parts = []; G.texts = []; G.bubbles = [];
  G.zoneKills = 0; G.bossSpawned = true; G.bossDefeated = false; G.boss = null; G.exitOpen = false; G.spawnT = 0.8; G.ult = null; G.pendingEvent = null;
  G.P = null; calcStats(); G.P = newPlayer(W.start.x, W.start.y); G.P.fy = -1; G.P.dir = 'up';
  G.bori = pd.boriJoined ? newBori(W.start.x + 14, W.start.y + 3) : null; buddySpawn();
  for (let k = 0; k < 8; k++) { const e = spawnAround(wpick(ZONES[b.zone].mons), 120, 240); if (e) e.spawnT = 0; }
  G.cam.x = clamp(G.P.x - VW / 2, 0, Math.max(0, W.W - VW)); G.cam.y = clamp(G.P.y - 12 - VH / 2, 0, Math.max(0, W.H - VH));
  $('#title').hidden = true; G.state = 'play'; playBgm('boss'); showHUD(true);
  banner('무한던전 · ' + infBasisLabel(b), '에버랜드: 할로윈파티', 'boss');
  setTimeout(() => { if (G.inf && G.state === 'play') { toast('몬스터가 끝없이 몰려와요! 잡은 만큼 골드·경험치·장비가 전부 저장돼요', 'lvl'); bubble(G.P, choice(['할로윈이다! 털러 가자!', '오늘 밤은 안 잔다!', '보리야, 사탕 대신 골드 줍자!']), 1.8); } }, 1600);
}
export function infSpawner(dt) {
  const V = G.inf, Z = ZONES[G.zone], L = V.loop;
  const alive = G.enemies.filter(e => !e.dead && !e.boss).length;
  const max = Math.min(28, Z.max * 2 + Math.min(6, 2 * L) + Math.floor(V.wave / 2));
  G.spawnT -= dt;
  if (G.spawnT <= 0 && alive < max) { G.spawnT = Z.spawnInt * 0.45 / (1 + 0.15 * L); spawnAround(wpick(Z.mons)); }
}
export function infKill(e) {
  const V = G.inf, pd = G.pd; V.kills++;
  if (e.boss) { G.boss = null; banner(`WAVE ${V.wave}`, '할로윈 보스 격파!', 'stage'); sfx('lvl'); return; }
  if (++V.waveKills >= INF_WAVE_KILLS) {
    V.waveKills = 0; V.wave++; pd.infBest = Math.max(pd.infBest || 0, V.wave); sfx('ding'); dailyAdd('wave');
    if (V.wave % 5 === 0) {
      const W = G.world, P = G.P, a = rand(0, 6.28); const b = spawnEnemy(ZONES[G.zone].boss, clamp(P.x + Math.cos(a) * 120, 60, W.W - 60), clamp(P.y + Math.sin(a) * 120, 120, W.H - 80));
      b.spawnT = 1.3; G.boss = b; G.husUsed = false; banner(`WAVE ${V.wave}`, '할로윈 보스 출현!', 'boss'); sfx('boss'); G.shake = 6;
    } else banner('할로윈파티', `WAVE ${V.wave}`, 'stage');
    saveGame();
  }
}
export const infWaveMul = () => G.inf ? { hp: 1 + 0.12 * (G.inf.wave - 1), atk: 1 + 0.06 * (G.inf.wave - 1), rew: 1 + 0.08 * (G.inf.wave - 1) } : { hp: 1, atk: 1, rew: 1 };
export function infLeave() { if (!G.inf) return; saveGame(); G.inf = null; $('#menu').hidden = true; showTitle(); toast('할로윈파티에서 얻은 건 전부 저장됐어요!', 'sub'); }
