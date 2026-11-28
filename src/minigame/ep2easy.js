// ===================== EP2 EASY (원터치모드) =====================



import { ICONS } from '../draw/sprites.js';
import { ctx } from '../sys/dom.js';
import { choice, clamp, lerp, rand, randi } from '../core/util.js';
import { SPRC, drawSpr, makeSpr, mkCanvas, pCirc, pEll, rowsToCanvas, spr } from '../draw/sprite.js';
import { sfx, tone } from '../sys/audio.js';
import { moveToward } from '../play/player.js';
import { drawHeeAt, drawHusSleep, fr, ispr, mixHex, pRingE, pc, shadow } from '../draw/render.js';
import { E2TOP, EH, EP2, EW, b2Spr, drawB2, drawB2Roll, drawCaesar, drawScent, e2Alert, e2Bar, e2Bubble, e2End, e2FishScene, e2T, e2UltStart, e2Unlock, s2, zzz } from './ep2core.js';
import { E2STAGES_NORMAL } from './ep2stages.js';
import { tt } from '../sys/i18n.js';

const E2STAGES_EASY = (() => {
// ===================== EP2 STAGES (simple tap mini-games) =====================
function tapFx(S, x, y, s, c) { (S.texts || (S.texts = [])).push({ x, y, s, c: c || '#ffffff', t: 0 }); }
function stepTexts(S, dt) { if (!S.texts) S.texts = []; for (const t of S.texts) t.t += dt; S.texts = S.texts.filter(t => t.t < 0.8); if (S.parts) { for (const p of S.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; p.life -= dt; } S.parts = S.parts.filter(p => p.life > 0); } }
function drawTexts(S) { for (const t of (S.texts || [])) { ctx.globalAlpha = 1 - t.t / 0.8; e2T(t.x, t.y - t.t * 14, t.s, 5.5, t.c, '#2b1b24'); } ctx.globalAlpha = 1; for (const p of (S.parts || [])) { ctx.globalAlpha = Math.max(0, p.life / p.max); fr(p.x, p.y, 2, 2, p.col); } ctx.globalAlpha = 1; }
function pop(S, x, y, col, n) { S.parts = S.parts || []; for (let i = 0; i < (n || 8); i++) S.parts.push({ x, y, vx: rand(-50, 50), vy: rand(-70, -10), life: 0.5, max: 0.5, col }); }
const starsBy = (miss, a, b) => miss <= a ? 3 : miss <= b ? 2 : 1;
function bigBtn(x, y, r, label, t) { const p = 1 + Math.sin(t * 6) * 0.05; pc(x, y, Math.round(r * p) + 1, '#2b1b24'); pc(x, y, Math.round(r * p), '#ff7ab8'); pc(x - r * 0.3, y - r * 0.3, Math.round(r * 0.25), 'rgba(255,255,255,0.5)'); e2T(x, y - 3, label[0], 6, '#ffffff', '#2b1b24'); e2T(x, y + 5, label[1], 6, '#ffffff', '#2b1b24'); }

// ---------- 1. 우리 집 : 냄새 구름 찾기 ----------
function homeRoomCanvas() {
  const W = 240, H = 300, c = mkCanvas(W, H), g = c.getContext('2d');
  for (let y = 0; y < H; y += 6) { g.fillStyle = (y / 6) % 2 ? '#d6a46e' : '#cf9b64'; g.fillRect(0, y, W, 6); g.fillStyle = '#b8844e'; g.fillRect(0, y, W, 1); for (let x = ((y / 6) % 3) * 17; x < W; x += 52) g.fillRect(x, y, 1, 6); }
  pEll(g, 120, 160, 46, 22, '#c8a0d8'); pEll(g, 120, 160, 42, 19, '#e8c8f0');
  g.fillStyle = '#2b1b24'; g.fillRect(0, 0, W, 8); g.fillRect(0, 0, 8, H); g.fillRect(W - 8, 0, 8, H); g.fillRect(0, H - 8, W, 8);
  g.fillStyle = '#f3e3cc'; g.fillRect(1, 1, W - 2, 6); g.fillRect(1, 1, 6, H - 2); g.fillRect(W - 7, 1, 6, H - 2); g.fillRect(1, H - 7, W - 2, 6);
  g.fillStyle = '#9fe8ff'; g.fillRect(196, 1, 36, 6);
  const box = (x, y, w, h, c1) => { g.fillStyle = '#2b1b24'; g.fillRect(x, y, w, h); g.fillStyle = c1; g.fillRect(x + 1, y + 1, w - 2, h - 2); };
  box(104, 8, 62, 22, '#e8e8f0'); box(12, 36, 62, 26, '#8fa2c6'); box(30, 98, 40, 22, '#c98a52'); box(150, 110, 58, 36, '#c98a52'); box(176, 196, 52, 44, '#ffc6dc'); box(10, 278, 54, 12, '#3a3a46');
  pCirc(g, 18, 18, 5, '#5aa845');
  return c;
}
const ST_HOME = {
  name: tt('minigame/ep2easy.1'), kind: tt('minigame/ep2easy.2'), bgm: 'home', hint: tt('minigame/ep2easy.3'), hint2: tt('minigame/ep2easy.4'),
  after: () => [{ who: 'sys', text: tt('minigame/ep2easy.5') }, { who: 'bori2', text: tt('minigame/ep2easy.6') }],
  init() { Object.assign(this, { t: 0, got: 0, need: 6, miss: 0, trap: 0, cloud: null, wait: 0.3, lock: 0, texts: [], parts: [], b: { x: 0, y: 0, tx: 0, ty: 0, run: false }, clues: [], done: false, bg: null }); },
  layout() { const k = Math.min(EW / 240, (EH - E2TOP - 20) / 300); this.k = k; this.ox = (EW - 240 * k) / 2; this.oy = E2TOP + 16 + ((EH - E2TOP - 20) - 300 * k) / 2; },
  ptr(type, x, y) {
    const S = this; if (type !== 'down' || S.done) return;
    if (S.lock > 0) { if (!S._nt || S.t - S._nt > 0.5) { S._nt = S.t; tapFx(S, S.b.x, S.b.y - 34, tt('minigame/ep2easy.7'), '#ff9fc4'); } return; }
    const c = S.cloud; if (!c) return; const cx = S.ox + c.x * S.k, cy = S.oy + c.y * S.k;
    if (Math.hypot(x - cx, y - cy) > 24) return;
    S.cloud = null; S.b.tx = cx; S.b.ty = cy + 8;
    if (c.kind === 'snack') { S.trap++; S.lock = 5.6; S.wait = 0.8; S.treat = { x: cx, y: cy + 8 }; S.b.ty = cy + 6; S.b.tx = cx - 12; pop(S, cx, cy, '#ff9fc4', 12); sfx('warn'); tapFx(S, cx, cy - 12, tt('minigame/ep2easy.8'), '#ff9fc4'); return; }
    S.got++; S.wait = 0.35; pop(S, cx, cy, '#7ee08a', 10); sfx('coin'); tapFx(S, cx, cy - 10, tt('minigame/ep2easy.9'), '#7ee08a');
    if (S.got % 2 === 0) { const n = [tt('minigame/ep2easy.10'), tt('minigame/ep2easy.11'), tt('minigame/ep2easy.12')][S.got / 2 - 1]; S.clues.push({ x: cx, y: cy, n, t: 0 }); tapFx(S, cx, cy - 22, n + tt('minigame/ep2easy.13'), '#ffd84a'); sfx('ding'); }
    if (S.got >= S.need) { S.done = true; setTimeout(() => e2End({ ok: true, stars: starsBy(S.miss + S.trap * 2, 1, 3), text: tt('minigame/ep2easy.14', { miss: S.miss, trap: S.trap }) }), 900); }
  },
  update(dt) {
    const S = this; S.t += dt; S.layout(); stepTexts(S, dt); if (!S.b.x) { S.b.x = S.b.tx = EW / 2; S.b.y = S.b.ty = S.oy + 250 * S.k; }
    const B = S.b, d = Math.hypot(B.tx - B.x, B.ty - B.y); B.run = d > 2; if (B.run) { moveToward(B, B.tx, B.ty, 120, dt); B.face = B.tx > B.x ? 1 : -1; }
    if (S.lock > 0) { S.lock -= dt; if (!B.run && Math.floor(S.lock * 3) !== Math.floor((S.lock + dt) * 3)) sfx('eat'); if (S.lock <= 0) { S.treat = null; tapFx(S, B.x, B.y - 30, tt('minigame/ep2easy.15'), '#7ee08a'); } }
    if (S.done) return;
    if (S.cloud) { S.cloud.t += dt; if (S.cloud.t > S.cloud.life) { if (S.cloud.kind === 'cat') { S.miss++; tapFx(S, EW / 2, E2TOP + 40, tt('minigame/ep2easy.16'), '#a0a6b0'); } S.cloud = null; S.wait = 0.3; } }
    else { S.wait -= dt; if (S.wait <= 0) { const snack = S.got >= 1 && Math.random() < 0.3; S.cloud = { kind: snack ? 'snack' : 'cat', x: rand(34, 206), y: rand(40, 262), t: 0, life: snack ? 2.2 : 2.6 - S.got * 0.1 }; } }
  },
  render() {
    const S = this; S.layout(); if (!S.bg) S.bg = homeRoomCanvas();
    fr(0, 0, EW, EH, '#2b1b24'); ctx.drawImage(S.bg, Math.round(S.ox), Math.round(S.oy), Math.round(240 * S.k), Math.round(300 * S.k));
    for (const c of S.clues) drawSpr(s2(c.n === '고양이 털' ? 'hair' : c.n === '양말 한 짝' ? 'sock' : 'paw2'), c.x, c.y + 4);
    if (S.cloud) { const c = S.cloud, p = c.t / c.life; ctx.globalAlpha = p > 0.75 ? (1 - p) / 0.25 : 1; drawScent(S.ox + c.x * S.k, S.oy + c.y * S.k, c.kind, S.t, 10); ctx.globalAlpha = 1; }
    if (S.treat) drawCaesar(S.treat.x, S.treat.y, S.lock / 5.6);
    const B = S.b; if (B.x) { shadow(B.x, B.y, 12);
      if (S.lock > 0 && !B.run) { drawB2(Math.floor(S.t * 5) % 2 ? 'lie' : 'sit', B.x, B.y + (Math.floor(S.t * 5) % 2 ? 0 : 1)); e2T(B.x, B.y - 22, tt('minigame/ep2easy.17'), 4.4, '#ff9fc4', '#2b1b24'); }
      else drawB2(B.run ? (Math.floor(S.t * 10) % 2 ? 'runA' : 'runB') : 'sit', B.x, B.y, { flip: B.run && B.face < 0 }); }
    drawTexts(S);
    e2T(10, E2TOP + 6, tt('minigame/ep2easy.18', { got: S.got, need: S.need }), 5, '#7ee08a', '#2b1b24', 'left');
    if (S.lock > 0) e2Alert(Math.min(5, S.lock), E2TOP + 16);
  }
};

// ---------- 2. 경안천 산책로 : 탭 점프 ----------
function drawFlyBird(x, y, t, s, col) { const up = Math.floor(t * 6) % 2; col = col || '#2b1b24'; s = s || 1; fr(x - 1 * s, y, 2 * s, 1 * s, col); if (up) { fr(x - 3 * s, y - 1 * s, 2 * s, 1 * s, col); fr(x + 1 * s, y - 1 * s, 2 * s, 1 * s, col); fr(x - 4 * s, y - 2 * s, 1 * s, 1 * s, col); fr(x + 3 * s, y - 2 * s, 1 * s, 1 * s, col); } else { fr(x - 3 * s, y + 1 * s, 2 * s, 1 * s, col); fr(x + 1 * s, y + 1 * s, 2 * s, 1 * s, col); } }
const HERON = ["......KKK....", ".....KWWWK...", "....KWWWeKOOO", ".....KWWK....", "......KWK....", "......KWK....", "..KKKKKWK....", ".KWWWWWWK....", "KGWWWWWWK....", "KGGWWWWK.....", ".KKKKKK......", "...K.K.......", "...O.O.......", "...O.O.......", "...O.O......."];
function drawHeron(x, y, t) { if (!SPRC.heron) SPRC.heron = makeSpr(rowsToCanvas(HERON, { K: '#2b1b24', W: '#ffffff', G: '#c8ccd8', e: '#2b1b24', O: '#e8b040' })); drawSpr(SPRC.heron, x, y + (Math.sin(t * 1.5) > 0.85 ? 1 : 0), { scale: 2 }); }
const ST_RUN = {
  name: tt('minigame/ep2easy.19'), kind: tt('minigame/ep2easy.20'), bgm: 'field', hint: tt('minigame/ep2easy.21'), reward: 'b_knit',
  after: () => [{ who: 'sys', text: tt('minigame/ep2easy.22') }, { who: 'bori2', text: tt('minigame/ep2easy.23') }],
  init() { Object.assign(this, { d: 0, by: 0, vy: 0, ground: true, hits: 0, slow: 0, inv: 0, obs: [], treats: [], next: 320, goal: 3000, t: 0, somi: null, somiDone: false, knitDone: false, texts: [], parts: [], fin: false, flock: [], fT: 1, flyers: [] }); },
  ptr(type) { const S = this; if (type === 'down' && S.ground) { S.vy = 250; S.ground = false; sfx('swing'); } },
  update(dt) {
    const S = this, K = 2; S.gy = Math.round(EH * (EH > EW ? 0.62 : 0.76)); const bx = EW * 0.26; S.t += dt; S.inv -= dt; S.slow -= dt; stepTexts(S, dt);
    const sp = (S.slow > 0 ? 50 : 90 + 25 * S.d / S.goal); S.d += sp * dt;
    if (!S.ground) { S.vy -= 700 * dt; S.by += S.vy * dt; if (S.by <= 0) { S.by = 0; S.ground = true; S.vy = 0; } }
    if (S.d >= S.next && S.d < S.goal - 250) { const r = Math.random(), k = r < 0.36 ? 'puddle' : r < 0.68 ? 'pigeon' : 'duck'; S.obs.push({ k, x: S.d + EW + 30, w: k === 'puddle' ? 30 : 16, h: k === 'puddle' ? 4 : 13 }); S.next += rand(190, 280); if (Math.random() < 0.6) S.treats.push({ x: S.d + EW + rand(80, 130), y: rand(10, 28), k: choice(['gangjeong', 'persimmon', 'popcorn']) }); }
    for (const o of S.obs) { const sx = bx + (o.x - S.d); if (!o.hit && o.fly == null && S.inv <= 0 && Math.abs(sx - bx) < o.w / 2 + 6 && S.by < o.h) { o.hit = true; S.hits++; S.inv = 1; S.slow = 0.8; sfx('hurt'); tapFx(S, bx, S.gy - 34, tt('minigame/ep2easy.24'), '#ff6b8a'); if (o.k !== 'puddle') { o.fly = 0; tapFx(S, sx, S.gy - 22, tt('minigame/ep2easy.25'), '#ffffff'); } }
      if (o.k === 'pigeon' && o.fly == null && sx - bx < 6 && S.by > o.h) o.fly = 0; if (o.fly != null) o.fly += dt; }
    S.obs = S.obs.filter(o => o.x > S.d - 80);
    for (const t of S.treats) { const sx = bx + (t.x - S.d); if (!t.got && Math.abs(sx - bx) < 14 && Math.abs(S.by + 10 - t.y) < 16) { t.got = true; sfx('coin'); tapFx(S, bx, S.gy - 40, tt('minigame/ep2easy.26'), '#ffd84a'); } }
    S.treats = S.treats.filter(t => !t.got && t.x > S.d - 40);
    S.fT -= dt; if (S.fT <= 0) { S.fT = rand(2.5, 4.5); const n = randi(3, 5), y0 = rand(EH * 0.08, EH * 0.25) + E2TOP; for (let i = 0; i < n; i++) S.flock.push({ x: EW + 10 + i * 14, y: y0 + Math.abs(i - (n >> 1)) * 7, ph: Math.random() }); }
    for (const f of S.flock) f.x -= 28 * dt; S.flock = S.flock.filter(f => f.x > -10);
    if (!S.somiDone && S.d > S.goal * 0.3) { S.somiDone = true; S.somi = { t: 0 }; } if (S.somi) { S.somi.t += dt; if (S.somi.t > 4) S.somi = null; }
    if (!S.knitDone && S.d > S.goal * 0.6) { S.knitDone = true; e2Unlock('b_knit'); tapFx(S, bx, S.gy - 48, tt('minigame/ep2easy.27'), '#ff9fcf'); }
    if (S.d >= S.goal && !S.fin) { S.fin = true; e2End({ ok: true, stars: starsBy(S.hits, 1, 3), text: tt('minigame/ep2easy.28', { hits: S.hits }) }); }
  },
  render() {
    const S = this, gy = S.gy || Math.round(EH * (EH > EW ? 0.62 : 0.76)), bx = EW * 0.26, d = S.d, wy = gy - 46;
    for (let y = 0; y < wy - 6; y += 3) fr(0, y, EW, 3, mixHex('#8fd0ff', '#e8f6ff', y / (wy - 6)));
    for (let i = 0; i < 9; i++) { const w = 26, x = ((i * 47 - d * 0.12) % (EW + 60) + EW + 60) % (EW + 60) - 30, h = 34 + (i * 13) % 22; fr(x, wy - 6 - h, w, h, '#c8d0e0'); for (let yy = wy - 2 - h; yy < wy - 10; yy += 5) for (let xx = x + 3; xx < x + w - 3; xx += 6) fr(xx, yy, 3, 2, '#a8b4c8'); }
    for (const f of S.flock) drawFlyBird(f.x, f.y, S.t + f.ph, 2);
    fr(0, wy - 6, EW, 6, '#6cb85a'); fr(0, wy, EW, 20, '#4aa0e0'); for (let i = 0; i < 18; i++) fr(((i * 31 - d * 0.5) % (EW + 30) + EW + 30) % (EW + 30) - 15, wy + 4 + (i % 4) * 4, 6, 1, '#bfe8ff');
    const hx = ((700 - d * 0.5) % (EW + 300) + EW + 300) % (EW + 300) - 40; if (hx > -20 && hx < EW + 20) drawHeron(hx, wy + 18, S.t);
    for (let i = 0; i < 26; i++) { const x = ((i * 19 - d * 0.7) % (EW + 20) + EW + 20) % (EW + 20) - 10, h = 6 + (i * 7) % 8; fr(x, gy - 22 - h, 1, h, '#4f9a3f'); }
    fr(0, wy + 20, EW, gy - wy - 20, '#7cc36a'); fr(0, gy, EW, 14, '#c8b89a'); for (let x = -(d % 24); x < EW; x += 24) fr(x, gy + 4, 10, 1, '#ffffff'); fr(0, gy + 14, EW, EH - gy - 14, '#8cc96e');
    const sx0 = ((Math.floor(d / 1500) + 1) * 1500 - d) * 0.7 + EW * 0.2; if (sx0 < EW + 20) { fr(sx0, gy - 38, 2, 18, '#6a4a2a'); fr(sx0 - 16, gy - 48, 34, 11, '#2b1b24'); fr(sx0 - 15, gy - 47, 32, 9, '#2a78c0'); e2T(sx0 + 1, gy - 42.5, tt('minigame/ep2easy.29'), 3.6, '#ffffff'); }
    for (const t of S.treats) drawSpr(ispr(t.k), bx + (t.x - d), gy - t.y + 6, { scale: 2 });
    for (const o of S.obs) { const x = bx + (o.x - d);
      if (o.k === 'puddle') { pEll(ctx, x, gy + 3, 16, 4, '#2b1b24'); pEll(ctx, x, gy + 3, 15, 3, '#2a78c0'); pEll(ctx, x - 3, gy + 2, 7, 1, '#9fd8ff'); }
      else if (o.fly != null) drawFlyBird(x + o.fly * 30, gy - 8 - o.fly * 90, S.t, 2, o.k === 'duck' ? '#5a7a3a' : '#7a7a90');
      else drawSpr(s2(o.k), x, gy + 1 + (o.k === 'pigeon' && Math.floor(S.t * 4 + o.x) % 3 === 0 ? 1 : 0), { flip: true, scale: 2 }); }
    if (S.somi) { const sp = b2Spr(Math.floor(S.t * 10) % 2 ? 'runA' : 'runB', { F: '#ffffff', f: '#d8d8e0', W: '#ffffff', w: '#e8e8f0', Y: '#ffffff', m: '#ffffff' }); drawSpr(sp, bx - 30, gy, { scale: 2 }); e2Bubble(tt('minigame/ep2easy.30'), bx - 10, gy - 34, 4.4); }
    shadow(bx, gy + 1, 22); drawB2(S.ground ? (Math.floor(S.t * 10) % 2 ? 'runA' : 'runB') : 'runA', bx, gy - S.by, { scale: 2, alpha: S.inv > 0 && Math.floor(S.t * 16) % 2 ? 0.4 : 1 });
    drawTexts(S); e2Bar(S.d / S.goal, E2TOP + 6, '#7ee08a', `${Math.min(300, Math.floor(S.d / 10))}m / 300m`);
  }
};

// ---------- 3. 용인시장 : 탭 리듬 ----------
const SONGS3 = [{ name: tt('minigame/ep2easy.31'), bpm: 84, n: 7, awn: '#5aa845' }, { name: tt('minigame/ep2easy.32'), bpm: 96, n: 9, awn: '#ff7ab8' }];
const ST_MARKET = {
  name: tt('minigame/ep2easy.33'), kind: tt('minigame/ep2easy.34'), bgm: null, hint: tt('minigame/ep2easy.35'), reward: 'b_pad',
  after: () => [{ who: 'sys', text: tt('minigame/ep2easy.36') }, { who: 'sys', text: tt('minigame/ep2easy.37') }, { who: 'cat', text: tt('minigame/ep2easy.38') }, { who: 'bori2', text: tt('minigame/ep2easy.39') }],
  init() { this.score = 0; this.total = 0; this.startSong(0); },
  startSong(i) {
    const S = this, sg = SONGS3[i]; Object.assign(S, { si: i, beat: 60 / sg.bpm, st: -1.6, lastBeat: -99, rush: null, anim: { k: 'sit', t: 0 }, judge: null, inter: 0, treats: [], texts: [], parts: [] });
    const notes = []; let b = 3; for (let k = 0; k < sg.n; k++) { notes.push({ t: b * S.beat, type: 'tap' }); b += (k % 3 === 2) ? 1 : 2; if (k === Math.floor(sg.n / 2)) { b += 1; notes.push({ t: b * S.beat, type: 'rush', kind: 'bang' }); b += 4; } }
    b += 1; notes.push({ t: b * S.beat, type: 'rush', kind: 'combo' }); S.notes = notes; S.endT = b * S.beat + 3.5;
  },
  finish(n, g) { const S = this; n.done = true; const v = g === 'p' ? 1 : g === 'g' ? 0.7 : 0; S.score += v; S.total++; S.judge = { s: g === 'p' ? tt('minigame/ep2easy.40') : g === 'g' ? tt('minigame/ep2easy.41') : tt('minigame/ep2easy.42'), c: g === 'p' ? '#ffd84a' : g === 'g' ? '#7ee08a' : '#a0a6b0', t: 0 }; if (g !== 'm') { tone([523, 587, 659, 784, 880][S.total % 5], 0.1, 'square', 0.08); S.treats.push({ t: 0, k: choice(['gangjeong', 'cake', 'persimmon']) }); } },
  ptr(type) {
    const S = this; if (type !== 'down' || S.inter > 0 || S.st < -0.3) return;
    if (S.rush) { S.rush.taps++; tone(900 + S.rush.taps * 30, 0.03, 'triangle', 0.07); return; }
    const n = S.notes.find(n => !n.done); if (!n) return; const off = S.st - n.t;
    if (Math.abs(off) < 0.32) { if (n.type === 'tap') { S.finish(n, Math.abs(off) < 0.13 ? 'p' : 'g'); S.anim = { k: choice(['paw', 'lie', 'standA']), t: 0 }; } else { n.done = true; S.rush = { n, t: 0, taps: 1, dur: n.kind === 'bang' ? 1.4 : 1.6 }; sfx('ding'); } }
  },
  update(dt) {
    const S = this; stepTexts(S, dt); if (S.inter > 0) { S.inter -= dt; if (S.inter <= 0) S.startSong(S.si + 1); return; }
    S.st += dt; if (S.anim) S.anim.t += dt; if (S.judge) S.judge.t += dt;
    const bi = Math.floor(S.st / S.beat); if (bi !== S.lastBeat && S.st > -1.4) { S.lastBeat = bi; tone(bi % 4 === 0 ? 196 : 262, 0.08, 'triangle', 0.12); }
    for (const n of S.notes) if (!n.done && S.st > n.t + (n.type === 'rush' ? 0.6 : 0.35)) { if (n.type === 'rush') { n.done = true; S.rush = { n, t: 0, taps: 0, dur: 1.2 }; } else S.finish(n, 'm'); }
    if (S.rush) { S.rush.t += dt; if (S.rush.t >= S.rush.dur) { const R = S.rush, n0 = R.n; n0.done = false; S.finish(n0, R.taps >= 6 ? 'p' : R.taps >= 2 ? 'g' : 'm'); if (R.taps >= 6) S.judge.s = n0.kind === 'bang' ? tt('minigame/ep2easy.43') : tt('minigame/ep2easy.44'); S.anim = { k: n0.kind === 'bang' ? 'roll' : 'paw', t: 0 }; if (n0.kind === 'bang') sfx('slam'); S.rush = null; } }
    for (const t of S.treats) t.t += dt; S.treats = S.treats.filter(t => t.t < 0.8);
    if (S.st > S.endT && !S.rush) { if (S.si < SONGS3.length - 1) S.inter = 1.4; else { const acc = S.total ? S.score / S.total : 1; e2End({ ok: true, stars: acc >= 0.8 ? 3 : acc >= 0.5 ? 2 : 1, text: tt('minigame/ep2easy.45', { v1: Math.round(acc * 100) }) }); } }
  },
  render() {
    const S = this, sg = SONGS3[S.si];
    fr(0, 0, EW, EH, '#f0e0c8'); for (let y = Math.round(EH * 0.62); y < EH; y += 10) for (let x = (y / 10 % 2) * 10; x < EW; x += 20) fr(x, y, 10, 10, '#e4d0b0');
    fr(0, 0, EW, EH * 0.22, '#ffe8c8'); const sy = Math.round(EH * 0.5);
    for (let k = 0; k < Math.ceil(EW / 8); k++) fr(k * 8, sy - 14, 8, 8, k % 2 ? '#ffffff' : sg.awn); fr(0, sy - 6, EW, 2, '#2b1b24'); fr(0, sy + 8, EW, 12, '#2b1b24'); fr(0, sy + 9, EW, 10, '#a0683e');
    const mx = Math.round(EW * 0.72); pc(mx, sy - 1, 5, '#2b1b24'); pc(mx, sy - 2, 4, '#ffdcc2'); pc(mx, sy - 6, 4, '#5a3a5a'); fr(mx - 5, sy + 3, 10, 6, '#ff9fcf'); e2T(mx, sy - 20, sg.name, 4.6, '#2b1b24', '#ffffff');
    const ly = Math.round(EH * 0.34), jx = 24, AT = 2.2, L = EW - jx - 8;
    fr(0, ly - 13, EW, 26, 'rgba(43,27,36,0.55)'); pRingE(jx, ly, 12, 12, '#ffffff'); pRingE(jx, ly, 11, 11, '#ffffff');
    for (const n of S.notes) { if (n.done) continue; const x = jx + (n.t - S.st) / AT * L; if (x > EW + 20) continue; if (n.type === 'tap') { pc(x, ly, 11, '#2b1b24'); pc(x, ly, 10, '#ff7ab8'); e2T(x, ly, tt('minigame/ep2easy.46'), 6, '#ffffff', '#2b1b24'); } else { pc(x, ly, 13, '#2b1b24'); pc(x, ly, 12, n.kind === 'bang' ? '#ff9a3c' : '#b45cff'); e2T(x, ly - 3, n.kind === 'bang' ? tt('minigame/ep2easy.47') : tt('minigame/ep2easy.48'), 5, '#ffffff', '#2b1b24'); e2T(x, ly + 4, n.kind === 'bang' ? tt('minigame/ep2easy.49') : tt('minigame/ep2easy.50'), 4, '#ffffff', '#2b1b24'); } }
    const bxx = Math.round(EW * 0.34), byy = Math.round(EH * 0.88), sc = Math.max(2, Math.min(4, Math.floor(EH / 70)));
    let k = S.anim && S.anim.t < (S.anim.k === 'roll' ? 0.7 : 0.4) ? S.anim.k : 'sit'; const R = S.rush; if (R && R.n.kind === 'combo') k = Math.floor(R.t * 10) % 2 ? 'standA' : 'standB';
    const rolling = (R && R.n.kind === 'bang') || (k === 'roll'); shadow(bxx, byy, 12 * sc);
    if (rolling) drawB2Roll(R ? R.taps * 0.2 : S.anim.t / 0.7, bxx, byy, sc);
    else drawB2(k, bxx, byy, { scale: sc });
    for (const t of S.treats) { const p = t.t / 0.8; drawSpr(ispr(t.k), lerp(mx, bxx, p), lerp(sy, byy - 20 * sc, p) - Math.sin(p * Math.PI) * 30); }
    if (S.judge && S.judge.t < 0.7) e2T(jx + 36, ly - 22, S.judge.s, 5.5, S.judge.c, '#2b1b24');
    if (R) e2T(EW / 2, EH * 0.6, R.n.kind === 'bang' ? tt('minigame/ep2easy.51') : tt('minigame/ep2easy.52'), 8, R.n.kind === 'bang' ? '#ff9a3c' : '#ff7ab8', '#ffffff');
    e2T(10, E2TOP + 6, `${S.si + 1}/${SONGS3.length} ${sg.name}`, 5, '#2b1b24', '#ffffff', 'left');
    if (S.inter > 0) e2T(EW / 2, EH * 0.6, tt('minigame/ep2easy.53'), 8, '#ff7ab8', '#ffffff');
  }
};

// ---------- 4. 냥갱 두더지잡기 ----------
const ST_CAT = {
  name: tt('minigame/ep2easy.54'), kind: tt('minigame/ep2easy.55'), bgm: 'boss', hint: tt('minigame/ep2easy.56'),
  after: () => [{ who: 'cat', text: tt('minigame/ep2easy.57') }, { who: 'cat', text: tt('minigame/ep2easy.58') }, { who: 'cat', text: tt('minigame/ep2easy.59') }, { who: 'sys', text: tt('minigame/ep2easy.60') }],
  init() { Object.assign(this, { t: 0, hp: 10, max: 10, miss: 0, pop: null, wait: 0.6, texts: [], parts: [], fin: false, ultBtn: false, bg: null }); },
  holes() { const cols = 3, rows = 2, top = E2TOP + 50, h = EH - top - 30; const out = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push({ x: EW * (0.2 + c * 0.3), y: top + h * (0.3 + r * 0.45) }); return out; },
  ptr(type, x, y) {
    const S = this; if (type !== 'down' || S.fin) return;
    if (S.ultBtn) { if (Math.hypot(x - EW / 2, y - EH * 0.62) < 26) { S.ultBtn = false; e2UltStart(() => { S.hp = 0; S.fin = true; tapFx(S, EW / 2, EH * 0.3, tt('minigame/ep2easy.61'), '#ff9fcf'); setTimeout(() => e2End({ ok: true, stars: starsBy(S.miss, 2, 5), text: tt('minigame/ep2easy.62', { miss: S.miss }) }), 1000); }); } return; }
    const P = S.pop; if (!P || P.hit) return; const H = S.holes()[P.i];
    if (Math.hypot(x - H.x, y - (H.y - 12)) < 26) { P.hit = true; P.t = Math.max(P.t, P.life - 0.25); if (P.sock) { S.miss++; tapFx(S, H.x, H.y - 20, tt('minigame/ep2easy.63'), '#a0a6b0'); sfx('warn'); } else { S.hp--; tapFx(S, H.x, H.y - 20, choice([tt('minigame/ep2easy.64'), tt('minigame/ep2easy.65'), tt('minigame/ep2easy.66')]), '#ffd84a'); pop(S, H.x, H.y - 8, '#a0a6b0', 10); sfx('punch'); if (S.hp <= 0) { S.ultBtn = true; S.pop = null; sfx('ding'); } } }
  },
  update(dt) {
    const S = this; S.t += dt; stepTexts(S, dt); if (S.fin || S.ultBtn) return;
    if (S.pop) { S.pop.t += dt; if (S.pop.t >= S.pop.life) { if (!S.pop.hit && !S.pop.sock) { S.miss++; tapFx(S, EW / 2, E2TOP + 36, tt('minigame/ep2easy.67'), '#a0a6b0'); } S.pop = null; S.wait = rand(0.25, 0.6); } }
    else { S.wait -= dt; if (S.wait <= 0) { const n = S.holes().length; S.pop = { i: randi(0, n - 1), t: 0, life: 1.5 - (S.max - S.hp) * 0.06, sock: Math.random() < 0.18 }; } }
  },
  render() {
    const S = this; fr(0, 0, EW, EH, '#a8603a'); for (let y = 0; y < EH; y += 6) { const off = (y / 6) % 2 ? 6 : 0; for (let x = -off; x < EW; x += 12) { fr(x, y, 12, 6, '#2b1b24'); fr(x + 1, y + 1, 10, 4, '#d27a4a'); fr(x + 2, y + 1, 8, 1, '#e8925e'); } }
    const hs = S.holes(); hs.forEach((h, i) => { fr(h.x - 19, h.y - 6, 38, 24, '#2b1b24'); fr(h.x - 18, h.y - 5, 36, 22, '#9a5a4a'); fr(h.x - 16, h.y - 4, 32, 8, '#1a0a14');
      const P = S.pop; if (P && P.i === i) { const up = Math.min(1, P.t / 0.15, (P.life - P.t) / 0.15); ctx.save(); ctx.beginPath(); ctx.rect(h.x - 20, h.y - 50, 40, 54); ctx.clip(); if (P.sock) drawSpr(s2('sock'), h.x, h.y + 6 - up * 18, { scale: 3 }); else drawSpr(s2('cat'), h.x, h.y + 6 - up * 26, { white: P.hit, scale: 2 }); ctx.restore(); }
      fr(h.x - 19, h.y + 2, 38, 16, '#2b1b24'); fr(h.x - 18, h.y + 3, 36, 14, '#b86a50'); fr(h.x - 18, h.y + 3, 36, 2, '#d88a6a'); });
    drawTexts(S);
    e2Bar(S.hp / S.max, E2TOP + 6, '#ff5a7a', tt('minigame/ep2easy.68', { hp: S.hp, max: S.max }));
    if (S.ultBtn) { ctx.fillStyle = 'rgba(30,10,40,0.45)'; ctx.fillRect(0, 0, EW, EH); e2T(EW / 2, EH * 0.42, tt('minigame/ep2easy.69'), 7, '#ffffff', '#2b1b24'); bigBtn(EW / 2, EH * 0.62, 24, [tt('minigame/ep2easy.48'), tt('minigame/ep2easy.50')], S.t); }
  }
};

// ---------- 5. 애견카페 : 연타 경주 + 연타 줄다리기 ----------
const ST_CAFE = {
  name: tt('minigame/ep2easy.70'), kind: tt('minigame/ep2easy.49'), bgm: 'boss', hint: tt('minigame/ep2easy.71'),
  after: () => [{ who: 'sys', text: tt('minigame/ep2easy.72') }, { who: 'sys', text: tt('minigame/ep2easy.73') }, { who: 'bori2', text: tt('minigame/ep2easy.74') }, { who: 'cat', text: tt('minigame/ep2easy.75') }],
  init() { Object.assign(this, { mode: 'race', bd: 0, cd: 0, bv: 0, goal: 700, raceWon: null, t: 0, p: 0, tugT: 0, modeT: 0, texts: [], parts: [] }); },
  ptr(type) { const S = this; if (type !== 'down') return; if (S.mode === 'race') { S.bv = Math.min(160, S.bv + 18); tone(600 + Math.random() * 200, 0.03, 'square', 0.04); } else if (S.mode === 'tug') { S.p -= 0.07; tone(500 + Math.random() * 300, 0.03, 'square', 0.04); } },
  update(dt) {
    const S = this; S.t += dt; S.modeT += dt; stepTexts(S, dt);
    if (S.mode === 'race') { S.bv = Math.max(0, S.bv - 60 * dt); S.bd += S.bv * dt; S.cd += (70 + Math.sin(S.t) * 8) * dt; if (S.bd >= S.goal || S.cd >= S.goal) { S.raceWon = S.bd >= S.goal; tapFx(S, EW / 2, EH * 0.3, S.raceWon ? tt('minigame/ep2easy.76') : tt('minigame/ep2easy.77'), S.raceWon ? '#ffd84a' : '#a0a6b0'); sfx(S.raceWon ? 'lvl' : 'warn'); S.mode = 'raceEnd'; S.modeT = 0; } }
    else if (S.mode === 'raceEnd') { if (S.modeT > 1.6) { S.mode = 'tug'; S.modeT = 0; } }
    else if (S.mode === 'tug') { S.tugT += dt; S.p = Math.min(0.95, S.p + 0.28 * dt); if (S.p <= -1) { S.mode = 'done'; sfx('lvl'); setTimeout(() => e2End({ ok: true, stars: 1 + (S.raceWon ? 1 : 0) + (S.tugT < 8 ? 1 : 0), text: tt('minigame/ep2easy.120', { v1: S.raceWon ? tt('minigame/ep2easy.78') : tt('minigame/ep2easy.79'), v2: S.tugT.toFixed(1) }) }), 900); } }
  },
  render() {
    const S = this; fr(0, 0, EW, EH, '#ffe8f0'); const gy = Math.round(EH * 0.62); fr(0, gy - 30, EW, EH - gy + 30, '#e0b080'); for (let y = gy - 30; y < EH; y += 6) fr(0, y, EW, 1, '#c89a6a');
    e2T(EW / 2, E2TOP + 8, S.mode === 'race' || S.mode === 'raceEnd' ? tt('minigame/ep2easy.80') : tt('minigame/ep2easy.81'), 5.5, '#c0306a', '#ffffff');
    if (S.mode === 'race' || S.mode === 'raceEnd') {
      const y1 = gy - 14, y2 = gy + 8, X = d => 22 + clamp(d / S.goal, 0, 1) * (EW - 44), fx = X(S.goal) + 6; for (let k = 0; k < 9; k++) fr(fx, gy - 30 + k * 6, 3, 3, k % 2 ? '#2b1b24' : '#ffffff');
      drawSpr(s2('corgi'), X(S.cd), y1); drawB2(S.bv > 5 ? (Math.floor(S.t * (4 + S.bv / 12)) % 2 ? 'runA' : 'runB') : 'sit', X(S.bd), y2);
      e2T(4, y1 - 4, tt('minigame/ep2easy.82'), 3.8, '#a0602a', '#ffffff', 'left'); e2T(4, y2 - 4, tt('minigame/ep2easy.48'), 3.8, '#c0306a', '#ffffff', 'left');
    } else {
      const cy = gy - 4, mx = EW / 2 + S.p * (EW * 0.3); fr(EW * 0.2 - 1, cy - 14, 2, 18, '#ff7ab8'); fr(EW * 0.16, cy - 5, EW * 0.68, 2, '#c8a070'); drawSpr(spr('t_toy_bone', ICONS.tbone), mx, cy - 2, { scale: 2 });
      drawB2(Math.floor(S.t * 6) % 2 ? 'runA' : 'runB', mx - 26, cy + 6, { noToy: true }); drawSpr(s2('corgi'), mx + 26, cy + 6, { flip: true });
    }
    if (S.mode === 'race' || S.mode === 'tug') e2T(EW / 2, EH * 0.36, tt('minigame/ep2easy.83'), 10, '#ff7ab8', '#ffffff');
    drawTexts(S);
  }
};

// ---------- 6. 동물병원 : 3줄 피하기 ----------
const ST_VET = {
  name: tt('minigame/ep2easy.84'), kind: tt('minigame/ep2easy.85'), bgm: 'boss', hint: tt('minigame/ep2easy.86'), reward: 'toy_bone',
  after: () => [{ who: 'nurse', text: tt('minigame/ep2easy.87') }, { who: 'sys', text: tt('minigame/ep2easy.88') }, { who: 'bori2', text: tt('minigame/ep2easy.89') }, { who: 'cat', text: tt('minigame/ep2easy.90') }],
  init() { Object.assign(this, { lane: 1, bx: 0, t: 0, time: 20, objs: [], sp: 0.8, hits: 0, inv: 0, texts: [], parts: [], done: false }); },
  lx(i) { return EW * (0.25 + i * 0.25); },
  ptr(type, x) { const S = this; if (type !== 'down' || S.done) return; S.lane = clamp(S.lane + (x < EW / 2 ? -1 : 1), 0, 2); sfx('swing'); },
  update(dt) {
    const S = this; S.t += dt; S.inv -= dt; stepTexts(S, dt); if (S.done) return; S.time -= dt; if (!S.bx) S.bx = S.lx(1); S.bx = lerp(S.bx, S.lx(S.lane), 1 - Math.pow(0.0001, dt));
    const by = EH * 0.8; S.sp -= dt; if (S.sp <= 0) { S.sp = 0.95 - (1 - S.time / 20) * 0.35; const free = randi(0, 2); for (let i = 0; i < 3; i++) if (i !== free && Math.random() < 0.5) S.objs.push({ lane: i, y: E2TOP + 20, v: 70 + (1 - S.time / 20) * 40 }); if (!S.objs.length || Math.random() < 0.4) S.objs.push({ lane: (free + 1) % 3, y: E2TOP + 20, v: 75 }); }
    for (const o of S.objs) { o.y += o.v * dt; if (!o.hit && S.inv <= 0 && Math.abs(o.y - (by - 6)) < 7 && Math.abs(S.lx(o.lane) - S.bx) < 9) { o.hit = true; S.hits++; S.inv = 0.9; sfx('hurt'); tapFx(S, S.bx, by - 20, tt('minigame/ep2easy.91'), '#ff6b8a'); } }
    S.objs = S.objs.filter(o => o.y < EH + 10 && !o.hit);
    if (S.time <= 0) { S.done = true; sfx('lvl'); e2End({ ok: true, stars: starsBy(S.hits, 0, 2), text: tt('minigame/ep2easy.92', { hits: S.hits }) }); }
  },
  render() {
    const S = this; for (let y = 0; y < EH; y += 10) for (let x = 0; x < EW; x += 10) fr(x, y, 10, 10, ((x + y) / 10) % 2 ? '#e8f4fa' : '#d4ecf6');
    for (let i = 0; i < 3; i++) fr(S.lx(i) - 10, E2TOP + 16, 20, EH, i === S.lane ? 'rgba(255,200,230,0.35)' : 'rgba(255,255,255,0.3)');
    for (const o of S.objs) { const sp = s2('syringe'); ctx.save(); ctx.translate(Math.round(S.lx(o.lane)), Math.round(o.y)); ctx.rotate(-Math.PI / 2); ctx.drawImage(sp.n, -Math.floor(sp.W / 2), -Math.floor(sp.H / 2)); ctx.restore(); }
    const by = EH * 0.8; shadow(S.bx, by, 12); drawB2('sit', S.bx, by, { alpha: S.inv > 0 && Math.floor(S.t * 16) % 2 ? 0.4 : 1 });
    ctx.globalAlpha = 0.5; e2T(EW * 0.15, EH * 0.93, tt('minigame/ep2easy.93'), 5, '#2a78c0', '#ffffff'); e2T(EW * 0.85, EH * 0.93, tt('minigame/ep2easy.94'), 5, '#2a78c0', '#ffffff'); ctx.globalAlpha = 1;
    drawTexts(S); e2T(EW / 2, E2TOP + 8, tt('minigame/ep2easy.95', { v1: Math.max(0, Math.ceil(S.time)) }), 7, '#2a78c0', '#ffffff');
  }
};

// ---------- 7. 낚시 : 타이밍 탭 ----------
const FISH7 = [{ name: tt('minigame/ep2easy.96'), spr: 'carp', w: 0.32, sp: 0.8 }, { name: tt('minigame/ep2easy.97'), spr: 'catfish', w: 0.26, sp: 1.0 }, { name: '???', spr: null, w: 0.22, sp: 1.15 }];
const ST_FISH = {
  name: tt('minigame/ep2easy.98'), kind: tt('minigame/ep2easy.99'), bgm: 'story', hint: tt('minigame/ep2easy.100'),
  after: () => [{ who: 'sys', text: tt('minigame/ep2easy.101') }, { who: 'sys', text: tt('minigame/ep2easy.102') }, { who: 'bori2', text: tt('minigame/ep2easy.103') }],
  init() { Object.assign(this, { ended: false, fi: 0, ok: 0, miss: 0, cur: 0, dir: 1, st: 'fight', stT: 0, t: 0, texts: [], parts: [], zc: 0.5, cool: 0 }); },
  ptr(type) {
    const S = this; if (type !== 'down' || S.st !== 'fight' || S.cool > 0) return; const f = FISH7[S.fi]; S.cool = 0.25;
    if (Math.abs(S.cur - S.zc) < f.w / 2) { S.ok++; sfx('coin'); tapFx(S, EW * 0.6, EH * 0.42, tt('minigame/ep2easy.104'), '#7ee08a'); if (S.ok >= 3) { if (S.fi < 2) { S.st = 'caught'; S.stT = 0; sfx('lvl'); tapFx(S, EW / 2, EH * 0.3, tt('minigame/ep2easy.105', { name: f.name }), '#ffd84a'); } else { S.st = 'boom'; S.stT = 0; sfx('boss'); tapFx(S, EW / 2, EH * 0.3, tt('minigame/ep2easy.106'), '#ff4d6d'); } } else S.zc = rand(0.25, 0.75); }
    else { S.miss++; sfx('warn'); tapFx(S, EW * 0.6, EH * 0.42, tt('minigame/ep2easy.107'), '#a0a6b0'); }
  },
  update(dt) {
    const S = this; S.t += dt; S.cool -= dt; stepTexts(S, dt);
    if (S.st === 'caught') { S.stT += dt; if (S.stT > 1.6) { S.fi++; S.ok = 0; S.st = 'fight'; S.zc = 0.5; } return; }
    if (S.st === 'boom') { S.stT += dt; if (S.stT > 2.2 && !S.ended) { S.ended = true; e2End({ ok: true, stars: starsBy(S.miss, 1, 4), text: tt('minigame/ep2easy.108', { miss: S.miss }) }); } return; }
    const f = FISH7[S.fi]; S.cur += S.dir * f.sp * dt; if (S.cur > 1) { S.cur = 1; S.dir = -1; } if (S.cur < 0) { S.cur = 0; S.dir = 1; }
  },
  render() {
    const S = this; const wy = Math.round(EH * 0.42); for (let y = 0; y < wy; y += 3) fr(0, y, EW, 3, mixHex('#6a3a9a', '#ffb07a', y / wy)); pc(EW * 0.7, wy - 4, 10, '#ffe070');
    for (let y = wy; y < EH; y += 4) fr(0, y, EW, 4, mixHex('#5a7ac8', '#2a3a7a', (y - wy) / (EH - wy)));
    const dy = Math.round(EH * 0.6), bobx = Math.round(EW * 0.76), boby = wy + 18 + Math.round(Math.sin(S.t * 3));
    const bx = e2FishScene(dy, bobx, boby, S.st === 'fight' ? 0.7 : 0.3, S.st === 'boom' ? 'standA' : 'runA', S.t, S.st === 'boom');
    if (S.st === 'caught') { const f = FISH7[S.fi], p = Math.min(1, S.stT / 0.6); drawSpr(s2(f.spr), lerp(bobx, bx - 16, p), lerp(boby, dy - 2, p) - Math.sin(p * Math.PI) * 30); }
    if (S.st === 'boom') { const p = Math.min(1, S.stT / 1.2); for (let i = 0; i < 5; i++) pRingE(bobx, boby, 8 + i * 6 * p, 2 + i * 2 * p, 'rgba(255,255,255,0.7)'); drawSpr(s2('fish'), bobx, boby + 30 - p * 60, { scale: 2 }); }
    if (S.st === 'fight') { const f = FISH7[S.fi], w = Math.min(EW - 30, 150), x = (EW - w) / 2, y = Math.round(EH * 0.8); fr(x - 2, y - 2, w + 4, 14, '#2b1b24'); fr(x, y, w, 10, '#3a2a44'); fr(x + w * (S.zc - f.w / 2), y, w * f.w, 10, '#5ad06a'); fr(x + w * S.cur - 1, y - 4, 3, 18, '#ffffff'); e2T(EW / 2, y + 18, tt('minigame/ep2easy.100'), 5, '#ffffff', '#2b1b24'); }
    drawTexts(S); const f = FISH7[Math.min(2, S.fi)]; e2T(EW / 2, E2TOP + 8, tt('minigame/ep2easy.121', { v1: S.fi + 1, v2: S.fi === 2 ? tt('minigame/ep2easy.109') : f.name, ok: S.ok }), 5, '#ffffff', '#2b1b24');
  }
};

// ---------- 8. 전설의 월척 : 튀어오르면 탭 ----------
const ST_BOSSFISH = {
  name: tt('minigame/ep2easy.110'), kind: tt('minigame/ep2easy.111'), bgm: 'boss', hint: tt('minigame/ep2easy.112'),
  init() { Object.assign(this, { t: 0, hp: 12, max: 12, miss: 0, jump: null, wait: 0.8, texts: [], parts: [], ultBtn: false, fin: false }); },
  surface() { return Math.round(E2TOP + 40 + (EH - E2TOP - 40) * 0.45); },
  ptr(type, x, y) {
    const S = this; if (type !== 'down' || S.fin) return;
    if (S.ultBtn) { if (Math.hypot(x - EW / 2, y - EH * 0.72) < 28) { S.ultBtn = false; e2UltStart(() => { S.fin = true; tapFx(S, EW / 2, EH * 0.3, tt('minigame/ep2easy.113'), '#ffd84a'); setTimeout(() => e2End({ ok: true, title: tt('minigame/ep2easy.114'), stars: starsBy(S.miss, 2, 5), text: tt('minigame/ep2easy.115', { miss: S.miss }) }), 1200); }); } return; }
    const J = S.jump; if (!J || J.hit) return; const p = J.t / J.life, fy = S.surface() - Math.sin(p * Math.PI) * 50;
    if (Math.hypot(x - J.x, y - (fy - 8)) < 26) { J.hit = true; S.hp--; sfx('punch'); pop(S, J.x, fy - 8, '#ffd84a', 10); tapFx(S, J.x, fy - 24, choice([tt('minigame/ep2easy.65'), tt('minigame/ep2easy.116'), tt('minigame/ep2easy.66')]), '#ffd84a'); if (S.hp <= 0) { S.ultBtn = true; S.jump = null; sfx('ding'); } }
  },
  update(dt) {
    const S = this; S.t += dt; stepTexts(S, dt); if (S.fin || S.ultBtn) return;
    if (S.jump) { S.jump.t += dt; if (S.jump.t >= S.jump.life) { if (!S.jump.hit) { S.miss++; tapFx(S, S.jump.x, S.surface() - 10, tt('minigame/ep2easy.117'), '#9fe8ff'); } pop(S, S.jump.x, S.surface(), '#bfe8ff', 6); S.jump = null; S.wait = rand(0.3, 0.7); } }
    else { S.wait -= dt; if (S.wait <= 0) { S.jump = { x: rand(EW * 0.2, EW * 0.8), t: 0, life: 1.5 - (S.max - S.hp) * 0.04 }; pop(S, S.jump.x, S.surface(), '#bfe8ff', 6); } }
  },
  render() {
    const S = this, sy = S.surface(); for (let y = 0; y < sy - 30; y += 3) fr(0, y, EW, 3, mixHex('#6a3a9a', '#ffb07a', y / (sy - 30)));
    for (let y = sy - 30; y < EH; y += 4) fr(0, y, EW, 4, mixHex('#5a8ad8', '#2a3a7a', (y - sy + 30) / (EH - sy + 30)));
    for (let i = 0; i < 16; i++) fr(((i * 37 + S.t * 8) % EW), sy - 26 + (i * 13) % 60, 6, 1, 'rgba(255,220,180,0.5)');
    const J = S.jump; if (J) { const p = J.t / J.life, fy = sy - Math.sin(p * Math.PI) * 50; drawSpr(s2('fish'), J.x, fy, { scale: 2, white: J.hit, flip: p < 0.5 }); }
    const gy = EH - 10; fr(0, gy - 4, EW, 14, '#8cc96e'); fr(0, gy - 6, EW, 3, '#d8c08a'); drawB2('sit', EW * 0.3, gy); drawHeeAt(EW - 18, gy, 'phone', 'down', S.t, {}); drawHusSleep(EW - 34, gy, S.t); zzz(EW - 30, gy - 24, S.t);
    drawTexts(S); e2Bar(S.hp / S.max, E2TOP + 6, '#ffd84a', tt('minigame/ep2easy.118', { hp: S.hp, max: S.max }));
    if (S.ultBtn) { ctx.fillStyle = 'rgba(30,10,40,0.45)'; ctx.fillRect(0, 0, EW, EH); e2T(EW / 2, EH * 0.52, tt('minigame/ep2easy.119'), 7, '#ffffff', '#2b1b24'); bigBtn(EW / 2, EH * 0.72, 26, [tt('minigame/ep2easy.48'), tt('minigame/ep2easy.50')], S.t); }
  }
};

return [ST_HOME, ST_RUN, ST_MARKET, ST_CAT, ST_CAFE, ST_VET, ST_FISH, ST_BOSSFISH];

})();
/** @type {any[]} 일반/원터치 스테이지 목록 중 현재 모드 */
export let E2STAGES = E2STAGES_NORMAL;
export function e2ApplyMode() { E2STAGES = FORCE_EASY || (EP2.save && EP2.save.mode === 'easy') ? E2STAGES_EASY : E2STAGES_NORMAL; }
