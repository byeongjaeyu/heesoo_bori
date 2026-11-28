// ===================== EP2 STORY =====================



import { ICONS } from '../draw/sprites.js';
import { $ } from '../sys/dom.js';
import { drawSpr, spr } from '../draw/sprite.js';
import { sfx } from '../sys/audio.js';
import { G } from '../core/state.js';
import { CUTK, cloud, fr, mixHex, pc, shadow, skyBands } from '../draw/render.js';
import { showTitle } from '../ui/lobby.js';
import { A_, clearA, playCut } from '../story/story.js';
import { EP2, drawB2, e2HideAll, e2Menu, e2Play, e2SaveNow, e2Stars, s2, zzz } from './ep2core.js';
import { E2STAGES } from './ep2easy.js';
import { tt } from '../sys/i18n.js';

let MISSION1 = null;
const E2PRO = [
  { scene: 'ep2home', bgm: 'home',
    init(A) { clearA(A); Object.assign(A, { hus: { x: 34, rodUp: true }, hee: { x: -2, pose: 'idle', dir: 'right' }, b2: { x: -32, kind: 'sit' }, door: false }); },
    delay: 0.8, lines: [
      { who: 'hus', text: tt('minigame/ep2story.1') },
      { who: 'hee', text: tt('minigame/ep2story.2') },
      { who: 'bori2', text: tt('minigame/ep2story.3'), do() { A_().b2.kind = 'rub'; } },
      { who: 'hee', text: tt('minigame/ep2story.4'), do() { A_().hee.dir = 'left'; } },
      { who: 'bori2', text: tt('minigame/ep2story.5'), do() { A_().b2.kind = 'sit'; } }] },
  { init(A) { A.door = true; A.hee.pose = 'walk'; A.hee.dir = 'left'; },
    update(A, dt, t) { if (A.hee) { A.hee.x -= dt * 42; if (A.hee.x < -96) A.hee = null; } if (A.hus) { if (t > 0.4) A.hus.x -= dt * 42; if (A.hus.x < -96) A.hus = null; } if (t > 3.2) A.door = false; }, dur: 3.6 },
  { init(A) { A.hee = null; A.hus = null; A.door = false; }, delay: 0.4, lines: [
      { who: 'sys', text: tt('minigame/ep2story.6') },
      { who: 'bori2', text: tt('minigame/ep2story.7'), do() { A_().b2.kind = 'run'; A_().b2.x = 16; } },
      { who: 'bori2', text: tt('minigame/ep2story.8'), do() { A_().b2.kind = 'sit'; } },
      { who: 'sys', text: tt('minigame/ep2story.9') },
      { who: 'sys', text: tt('minigame/ep2story.10'), do() { A_().cat = { x: 64, y: -36 }; } },
      { who: 'bori2', text: tt('minigame/ep2story.11'), do() { A_().b2.kind = 'standA'; A_().b2.jump = true; A_().cat = null; sfx('bark'); } }] },
  { scene: 'stars', init(A) { A.b2 = null; A.cat = null; $('#mission').innerHTML = tt('minigame/ep2story.12'); $('#mission').hidden = false; $('#skip').hidden = true; }, dur: 3.4 }
];
const E2END = [
  { scene: 'e2lake', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { fish: { x: 46 }, b2: { x: 10, kind: 'sit' }, hee: { x: -52, pose: 'phone', dir: 'down' }, hus: { x: -84, rodUp: false } }); },
    delay: 1.0, lines: [
      { who: 'sys', text: tt('minigame/ep2story.13') },
      { who: 'hus', text: tt('minigame/ep2story.14') },
      { who: 'hee', text: tt('minigame/ep2story.15'), do() { A_().hee.pose = 'idle'; A_().hee.dir = 'right'; } },
      { who: 'sys', text: tt('minigame/ep2story.16'), do() { A_().b2.x = -32; A_().b2.noToy = true; A_().bone = true; } },
      { who: 'hee', text: tt('minigame/ep2story.17') },
      { who: 'hus', text: tt('minigame/ep2story.18') },
      { who: 'hee', text: tt('minigame/ep2story.19'), do() { A_().aura = true; } },
      { who: 'sys', text: tt('minigame/ep2story.20'), do() { A_().aura = false; } },
      { who: 'bori2', text: tt('minigame/ep2story.21'), do() { A_().b2.kind = 'rub'; A_().b2.x = -70; A_().b2.flip = true; } },
      { who: 'bori2', text: tt('minigame/ep2story.22'), do() { A_().b2.kind = 'paw'; sfx('ding'); } },
      { who: 'hus', text: tt('minigame/ep2story.23') },
      { who: 'hee', text: tt('minigame/ep2story.24') }] },
  { init(A) { A.b2.kind = 'lie'; A.b2.x = -40; A.b2.flip = false; A.fish = null; A.hee.dir = 'down'; }, delay: 0.4, lines: [{ who: 'sys', text: tt('minigame/ep2story.25') }], dur: 1.2 },
  { scene: 'ep2home', bgm: 'home', init(A) { clearA(A); A.cat = { x: 32, y: -16 }; }, delay: 0.8, lines: [{ who: 'sys', text: tt('minigame/ep2story.26') }, { who: 'cat', text: tt('minigame/ep2story.27') }], dur: 0.6 }
];
export function e2Prologue(replay) {
  if (!MISSION1) MISSION1 = $('#mission').innerHTML;
  e2HideAll(); playCut(E2PRO, () => { $('#mission').innerHTML = MISSION1; $('#mission').hidden = true; EP2.save.prologue = true; e2SaveNow(); if (replay) e2Menu(); else { E2STAGES[0]._seen = false; e2Play(0); } });
}
export function e2Ending() {
  e2HideAll(); playCut(E2END, () => {
    EP2.save.cleared = true; e2SaveNow(); G.state = 'end';
    $('#endScr h2').textContent = tt('minigame/ep2story.28');
    $('#endStats').innerHTML = tt('minigame/ep2story.29', { v1: e2Stars(), v2: E2STAGES.length * 3, length: Object.keys(EP2.save.own).length });
    $('#endBtns').innerHTML = tt('minigame/ep2story.30');
    $('#endScr').hidden = false;
    $('#e2eMenu').onclick = () => { $('#endScr').hidden = true; e2Menu(); };
    $('#e2eTitle').onclick = () => { $('#endScr').hidden = true; showTitle(); };
  });
}
export function e2DrawActors(A, mid, gy, T) {
  const K = CUTK;
  if (A.fish) { const x = mid + A.fish.x * K; shadow(x, gy + 4, 36); drawSpr(s2('fish'), x, gy + 4 - Math.round(Math.abs(Math.sin(T * 6)) * 2), { scale: 2 }); }
  if (A.bone && A.hee) drawSpr(spr('t_toy_bone', ICONS.tbone), mid + A.hee.x * K + 9, gy + 3);
  if (A.cat) drawSpr(s2('cat'), mid + A.cat.x * K, gy + (A.cat.y || 0));
  if (A.b2) {
    const b = A.b2, x = mid + b.x * K, y = gy + (b.y || 3); let k = b.kind;
    if (k === 'rub') k = Math.floor(T * 9) % 2 ? 'standA' : 'standB'; else if (k === 'run') k = Math.floor(T * 10) % 2 ? 'runA' : 'runB';
    shadow(x, y, 12); drawB2(k, x, y - (b.jump ? Math.round(Math.abs(Math.sin(T * 9)) * 4) : 0), { flip: !!b.flip, noToy: true });
    if (b.kind === 'lie') zzz(x + 6, y - 10, T);
    if (b.kind === 'rub' && Math.floor(T * 6) % 2) { fr(x - 7, y - 16, 1, 1, '#ffd84a'); fr(x + 7, y - 14, 1, 1, '#ffd84a'); }
  }
}
export function e2DrawLake(SW, SH, mid, gy, T) {
  skyBands(SW, gy - 30, '#6a3a9a', '#ffb07a'); pc(mid + 50, gy - 34, 12, '#ffe070');
  for (let i = 0; i < 3; i++) cloud(((i * 97 + T * 3) % (SW + 60)) - 30, 16 + i * 11, '#ffc0d8');
  for (let i = 0; i < 6; i++) fr(i * 52 - 20, gy - 40 - (i % 2) * 6, 50, 12 + (i % 2) * 6, '#4a3060');
  for (let y = gy - 30; y < gy - 4; y += 3) fr(0, y, SW, 3, mixHex('#5a7ac8', '#3a4a8a', (y - gy + 30) / 26));
  for (let i = 0; i < 12; i++) fr(((i * 37 + T * 6) % SW), gy - 26 + (i * 7) % 20, 6, 1, 'rgba(255,220,180,0.6)');
  fr(0, gy - 4, SW, SH - gy + 4, '#8cc96e'); fr(0, gy - 4, SW, 3, '#d8c08a');
  for (let x = 0; x < SW; x += 7) { fr(x, gy - 8, 1, 6, '#4f9a3f'); }
  const cx = mid - 100 * CUTK; for (const ox of [0, 30]) { fr(cx + ox, gy - 6, 14, 2, '#3a78c0'); fr(cx + ox + 1, gy - 4, 1, 6, '#2b1b24'); fr(cx + ox + 12, gy - 4, 1, 6, '#2b1b24'); }
  fr(mid + 70 * CUTK, gy - 2, 16, 10, '#2b1b24'); fr(mid + 70 * CUTK + 1, gy - 1, 14, 4, '#4a8ad0'); fr(mid + 70 * CUTK + 1, gy + 3, 14, 4, '#ffffff');
}
