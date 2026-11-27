// ===================== STORY / CUTSCENES =====================
import { $, clamp, ctx, cv, drawSpr, lerp, playBgm } from './engine.js';
import { CHAPTERS } from './chapter.js';
import { WED_PAL, husTuxSpr } from './chapters/ch4.js';
import { G, monSpr } from './game.js';
import { CUTK, cutScale, drawBoriAt, drawEscape, drawHeeAt, drawHome, drawHusRod, drawPark, drawStars, fr, husSpr, ispr, pc, setCUTK, shadow, txt } from './render.js';
import { DLG, dialog, dlgAuto, showHUD } from './ui.js';
import { e2DrawActors, e2DrawLake } from './ep2story.js';

export const CUT = { steps: null, i: -1, t: 0, st: null, A: {}, scene: 'park', linesDone: true, started: false, onEnd: null, light: 0, autoT: 0 };
export function playCut(steps, onEnd) {
  G.state = 'cut'; CUT.steps = steps; CUT.i = -1; CUT.onEnd = onEnd; CUT.A = {}; CUT.light = 0; CUT.scene = 'park';
  showHUD(false); $('#skip').hidden = false; nextStep();
}
function nextStep() {
  CUT.i++; const st = CUT.steps && CUT.steps[CUT.i];
  if (!st) { endCut(); return; }
  CUT.st = st; CUT.t = 0; CUT.linesDone = !st.lines; CUT.started = false;
  if (st.scene) CUT.scene = st.scene; if (st.init) st.init(CUT.A); if (st.bgm) playBgm(st.bgm);
}
export function endCut() {
  if (!CUT.steps) return;
  $('#skip').hidden = true; $('#dlg').hidden = true; DLG.cur = null; DLG.q = []; DLG.cb = null; $('#mission').hidden = true;
  const cb = CUT.onEnd; CUT.onEnd = null; CUT.steps = null; CUT.st = null; if (cb) cb();
}
export function updateCut(dt) {
  const st = CUT.st; if (!st) return; CUT.t += dt;
  if (st.update) st.update(CUT.A, dt, CUT.t);
  if (st.lines && !CUT.started && CUT.t >= (st.delay || 0)) { CUT.started = true; dialog(st.lines, () => { CUT.linesDone = true; }); }
  dlgAuto(dt);
  if (CUT.light > 0) CUT.light -= dt * 2.5;
  if (CUT.steps && CUT.linesDone && CUT.t >= (st.dur || 0)) nextStep();
}
export function clearA(A) { for (const k in A) delete A[k]; }

export const A_ = () => CUT.A;


export function pxLine(x0, y0, x1, y1, col, w) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0; ctx.fillStyle = col; for (let i = 0; i <= n; i++) { const t = n ? i / n : 0; ctx.fillRect(Math.round(lerp(x0, x1, t)), Math.round(lerp(y0, y1, t)), w || 1, w || 1); } }
function drawActors(A, mid, gy, T) {
  if (A.balloon) { const x = mid + A.balloon.x * CUTK, y = gy + A.balloon.y; pc(x, y, 4, '#2b1b24'); pc(x, y, 3, '#ff4d6d'); fr(x - 1, y - 2, 1, 1, '#fff'); pxLine(x, y + 4, x - 2, y + 18, '#9aa0aa'); }
  if (A.mons) for (const m of A.mons) { const p = clamp((T - m.t0) * 4, 0, 1); if (p <= 0) continue; const s = monSpr(m.type); shadow(mid + m.x * CUTK, gy + m.y, 10); drawSpr(s, mid + m.x * CUTK, gy + m.y - Math.abs(Math.sin(T * 3 + m.x)) * 3 - (1 - p) * 10, { alpha: p, white: p < 0.6 }); }
  if (A.hus) {
    const hx = mid + A.hus.x * CUTK; shadow(hx, gy, 12);
    if (A.hus.rodUp) { pxLine(hx + 6, gy - 7, hx + 30, gy - 52, '#3a3a46', 1); pxLine(hx + 5, gy - 6, hx + 9, gy - 12, '#c98a3a', 2); const tx = hx + 30, ty = gy - 52; for (let i = 0; i < 20; i++) fr(tx + i * 0.5, ty + i * 1.6 + Math.sin(i * 0.3) * 1, 1, 1, '#e8e8f0'); fr(tx + 9, ty + 30, 3, 2, '#e8414f'); fr(tx + 9, ty + 32, 3, 2, '#ffffff'); if (A.sparkle) for (let i = 0; i < 4; i++) { const a = T * 4 + i * 1.57; fr(tx + Math.cos(a) * 6, ty + Math.sin(a) * 6, 1, 1, '#ffd84a'); fr(tx + Math.cos(a) * 9, ty + Math.sin(a) * 9, 1, 1, '#fff6b0'); } }
    else drawHusRod(hx, gy, T); // 오빠는 언제나 찌낚시대를 들고 있음
    drawSpr(A.hus.tux ? husTuxSpr() : husSpr(), hx, gy);
  }
  if (A.bori && A.bori.x < 400) { const bx = mid + A.bori.x * CUTK, by = gy + (A.bori.y || 2); shadow(bx, by, 10); drawBoriAt(bx, by, A.bori.pose, A.bori.face || 1, T, { pant: A.bori.pant, jump: A.bori.jump ? Math.round(Math.abs(Math.sin(T * 9)) * 5) : 0 }); }
  if (A.leash && A.hee && A.bori) pxLine(mid + A.hee.x * CUTK + 5, gy - 7, mid + A.bori.x * CUTK - 3, gy + (A.bori.y || 2) - 7, '#e8414f');
  if (A.hee) {
    const hx = mid + A.hee.x * CUTK + (A.hee.shake ? Math.round(Math.sin(T * 50)) : 0), hy = gy + (A.hee.y || 0);
    if (A.aura) { for (let i = 0; i < 10; i++) { const a = T * 2 + i * 0.63, r = 10 + Math.sin(T * 5 + i) * 2; fr(hx + Math.cos(a) * r, hy - 10 + Math.sin(a) * r * 0.9, 2, 2, i % 2 ? '#b45cff' : '#ff7ab8'); } }
    shadow(hx, hy, 12); drawHeeAt(hx, hy, A.hee.pose, A.hee.dir, T, { pal: A.hee.wed ? WED_PAL : null });
    if (A.hee.fist) { drawSpr(ispr('fist'), hx - 9, hy - 9 + Math.round(Math.sin(T * 8))); drawSpr(ispr('fist'), hx + 9, hy - 9 - Math.round(Math.sin(T * 8))); }
    if (A.hee.sweat) { fr(hx + 7, hy - 22, 2, 3, '#7ec8ff'); fr(hx + 7, hy - 23, 1, 1, '#7ec8ff'); }
  }
}
export function renderCut() {
  const A = CUT.A; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  const CS = cutScale(), SW = cv.width / CS, SH = cv.height / CS; ctx.setTransform(CS, 0, 0, CS, 0, 0);
  const mid = Math.round(SW / 2), gy = Math.round(SH * 0.56), T = G.time; setCUTK(clamp(SW / 220, 0.6, 1));
  if (CUT.scene === 'park') drawPark(SW, SH, mid, gy, A.dark || 0, false, T);
  else if (CUT.scene === 'gate') drawPark(SW, SH, mid, gy, 1, true, T);
  else if (CUT.scene === 'home') drawHome(SW, SH, mid, gy, T, A);
  else if (CUT.scene === 'escape') drawEscape(SW, SH, mid, gy, T);
  else if (CUT.scene === 'ep2home') drawHome(SW, SH, mid, gy, T, A);
  else if (CUT.scene === 'e2lake') e2DrawLake(SW, SH, mid, gy, T);
  else { const ch = CHAPTERS.find(c => c && c.cut && c.cut.scenes.includes(CUT.scene)); if (ch) ch.cut.draw(SW, SH, mid, gy, T, CUT.scene); else drawStars(SW, SH, T); } // 장 컷신 장면 (장 파일 cut.draw)
  drawActors(A, mid, gy, T); for (const ch of CHAPTERS) if (ch && ch.cut) ch.cut.actors(A, mid, gy, T);
  if (A.b2 || A.cat || A.fish) e2DrawActors(A, mid, gy, T);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const cw = cv.width, ch = cv.height;
  if (A.dark) { ctx.fillStyle = `rgba(60,10,90,${A.dark * 0.16})`; ctx.fillRect(0, 0, cw, ch); }
  if (A.sign) { const x = (mid + 36 * CUTK) * CS, y = (gy + 6 - 54 + 5) * CS; txt('출구 봉쇄', x, y, CS * 6, '#e8414f', '#ffffff'); }
  if (A.hee && A.hee.alert) { const x = (mid + A.hee.x * CUTK) * CS, y = (gy - 28) * CS; txt('!', x, y - Math.abs(Math.sin(G.time * 8)) * CS * 2, CS * 10, '#ff4d6d', '#ffffff'); }
  if (A.aura) { const a = 0.18 + Math.sin(G.time * 4) * 0.08; const vg = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.25, cw / 2, ch / 2, Math.max(cw, ch) * 0.7); vg.addColorStop(0, 'rgba(120,30,160,0)'); vg.addColorStop(1, `rgba(120,30,160,${a + 0.25})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, cw, ch); }
  if (CUT.light > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.9, CUT.light)})`; ctx.fillRect(0, 0, cw, ch); }
}
export function renderTitle() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  const CS = cutScale(), SW = cv.width / CS, SH = cv.height / CS; ctx.setTransform(CS, 0, 0, CS, 0, 0);
  const mid = Math.round(SW / 2), gy = Math.round(SH * 0.56), T = G.time;
  drawPark(SW, SH, mid, gy, 0, false, T);
  const k = FORCE_EASY ? 1 : 1.5; ctx.setTransform(CS * k, 0, 0, CS * k, CS * mid * (1 - k), CS * (gy + 12) * (1 - k)); // 로비: 희수·보리 크게
  shadow(mid - 8, gy + 12, 12); drawHeeAt(mid - 8, gy + 12, 'phone', 'down', T, {});
  shadow(mid + 11, gy + 13, 10); drawBoriAt(mid + 11, gy + 13, 'sit', 1, T, { pant: true });
  for (let i = 0; i < 3; i++) { const p = ((T * 0.5 + i / 3) % 1); ctx.globalAlpha = 1 - p; drawSpr(ispr('heart'), mid - 4 + Math.sin(p * 6 + i) * 6, gy - 14 - p * 20); } ctx.globalAlpha = 1;
}
