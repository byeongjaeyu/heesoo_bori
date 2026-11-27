// ===================== WORLD / DECOR =====================



import { clamp, mulberry } from '../core/util.js';
import { mkCanvas, pCirc, pRect } from './sprite.js';
import { ZONES } from '../core/data.js';
import { CHAPTERS } from '../core/chapter.js';

export const WORLD_W = 560, WORLD_H = 760;
export const OK = '#2b1b24';

export function dLamp(col) {
  const c = mkCanvas(9, 28), g = c.getContext('2d');
  pRect(g, 3, 8, 3, 19, OK); pRect(g, 4, 8, 1, 19, '#5a5a6a'); pRect(g, 1, 26, 7, 2, OK);
  pRect(g, 3, 0, 3, 1, OK); pRect(g, 1, 1, 7, 7, OK); pRect(g, 2, 2, 5, 5, col); pRect(g, 3, 3, 2, 2, '#ffffff');
  return c;
}
export function dGate(open) {
  const c = mkCanvas(62, 54), g = c.getContext('2d');
  if (!open) {
    pRect(g, 12, 16, 38, 38, '#3a2a44');
    g.fillStyle = '#7a7f8c'; for (let x = 14; x < 50; x += 4) g.fillRect(x, 16, 1, 38);
    g.fillStyle = '#c0c6d0'; for (let i = 0; i < 34; i++) { g.fillRect(14 + i, 20 + i, 2, 1); g.fillRect(48 - i, 20 + i, 2, 1); }
    pRect(g, 27, 32, 8, 7, OK); pRect(g, 28, 33, 6, 5, '#e8414f'); pRect(g, 30, 35, 2, 2, '#ffd84a');
  }
  for (const px of [2, 50]) { pRect(g, px, 12, 10, 42, OK); pRect(g, px + 1, 13, 8, 41, '#d6cfc4'); g.fillStyle = '#bdb5a8'; for (let y = 16; y < 54; y += 5) g.fillRect(px + 1, y, 8, 1); pRect(g, px, 12, 10, 3, OK); pRect(g, px + 1, 13, 8, 1, '#f0ead8'); }
  pRect(g, 0, 6, 62, 8, OK); pRect(g, 1, 7, 60, 6, '#ff7ab8'); pRect(g, 1, 7, 60, 2, '#ffb3d9');
  pRect(g, 15, 0, 32, 11, OK); pRect(g, 16, 1, 30, 9, '#fff6e0');
  pCirc(g, 3, 5, 3, OK); pCirc(g, 3, 5, 2, '#ffd84a'); pCirc(g, 58, 5, 3, OK); pCirc(g, 58, 5, 2, '#ffd84a');
  return c;
}

/** 스테이지 배경: 팔레트(bg·hedge·tint·glow) + 가장자리(sea 바다·wall 벽, 없으면 산울타리) + ground(바닥)·decor(소품 배치). winding = 구불구불한 길
 * 각 장 파일(src/chapters/chN.js)의 themes 를 합침 */
export const THEME = /** @type {Record<string, any>} */ ({});
for (const ch of CHAPTERS) if (ch && ch.themes) Object.assign(THEME, ch.themes);
function dSeaGate(open) {
  const c = mkCanvas(62, 54), g = c.getContext('2d');
  if (!open) { pRect(g, 12, 18, 38, 36, '#3a2a24'); g.fillStyle = '#8a6a44'; for (let y = 20; y < 54; y += 5) g.fillRect(12, y, 38, 2); pRect(g, 27, 32, 8, 7, OK); pRect(g, 28, 33, 6, 5, '#e8414f'); }
  for (const px of [4, 50]) { pRect(g, px, 10, 8, 44, OK); pRect(g, px + 1, 11, 6, 43, '#a8784a'); g.fillStyle = '#7a5434'; for (let y = 14; y < 54; y += 6) g.fillRect(px + 1, y, 6, 1); }
  pRect(g, 0, 6, 62, 8, OK); pRect(g, 1, 7, 60, 6, '#3a78c0'); pRect(g, 1, 7, 60, 2, '#6fb8ff');
  pRect(g, 14, 0, 34, 11, OK); pRect(g, 15, 1, 32, 9, '#fff6e0'); pRect(g, 18, 4, 4, 3, '#3a78c0'); pRect(g, 25, 4, 4, 3, '#3a78c0'); pRect(g, 32, 4, 4, 3, '#3a78c0'); pRect(g, 39, 4, 4, 3, '#3a78c0');
  return c;
}

export function buildWorld(zi) {
  const Z = ZONES[zi], th = THEME[Z.theme]; const R = mulberry(911 + zi * 131);
  const rr = (a, b) => a + R() * (b - a);
  const W = { W: WORLD_W, H: WORLD_H, decor: [], solids: [], start: { x: WORLD_W / 2, y: WORLD_H - 76 }, gate: { x: WORLD_W / 2, y: 62 }, theme: Z.theme, bg: th.bg, tint: th.tint, glowA: th.glow, fountain: null, rails: [], gateClosed: (th.sea ? dSeaGate : dGate)(false), gateOpen: (th.sea ? dSeaGate : dGate)(true), dark: !!th.dark, rain: !!th.rain, field: /** @type {any} */ (null), top: 34 };
  const gc = mkCanvas(WORLD_W, WORLD_H), g = gc.getContext('2d');
  const cx = WORLD_W / 2;
  const pathX = y => th.winding ? cx + Math.sin(y / 95) * 70 * clamp((WORLD_H - 60 - y) / 120, 0, 1) * clamp((y - 80) / 120, 0, 1) : cx;

  // ---- base ground (장 파일 THEME[...].ground) ----
  const X = { g, W, R, rr, cx, pathX, Z, add: null, scatter: null };
  if (th.ground) th.ground(X);

  // ---- hedge border ----
  const [h1, h2, h3] = th.hedge;
  if (th.sea) {
    // 바다 가장자리 + 난간
    const sea = th.dark ? ['#0c2244', '#163460', '#2a4c80'] : ['#2f6fae', '#3f8ad0', '#9fd8ff'];
    const band = (x, y, w, h) => { g.fillStyle = sea[0]; g.fillRect(x, y, w, h); for (let i = 0; i < w * h / 60; i++) { g.fillStyle = R() < 0.7 ? sea[1] : sea[2]; g.fillRect(Math.floor(x + R() * w), Math.floor(y + R() * h), 3, 1); } };
    band(0, 0, 16, WORLD_H); band(WORLD_W - 16, 0, 16, WORLD_H); band(0, WORLD_H - 10, WORLD_W, 10); band(0, 0, cx - 34, 14); band(cx + 34, 0, WORLD_W - cx - 34, 14);
    g.fillStyle = OK; g.fillRect(15, 0, 3, WORLD_H); g.fillRect(WORLD_W - 18, 0, 3, WORLD_H);
    g.fillStyle = h2; for (let y = 0; y < WORLD_H; y += 12) { g.fillRect(14, y, 5, 3); g.fillRect(WORLD_W - 19, y, 5, 3); }
  } else if (th.wall) {
    // 경기장 외벽: 콘크리트 + 위쪽은 관중석 벽
    g.fillStyle = h3; g.fillRect(0, 0, 12, WORLD_H); g.fillRect(WORLD_W - 12, 0, 12, WORLD_H); g.fillRect(0, WORLD_H - 8, WORLD_W, 8); g.fillRect(0, 0, cx - 34, 12); g.fillRect(cx + 34, 0, WORLD_W - cx - 34, 12);
    g.fillStyle = h2; for (let y = 0; y < WORLD_H; y += 16) { g.fillRect(2, y + 2, 8, 12); g.fillRect(WORLD_W - 10, y + 2, 8, 12); }
    g.fillStyle = OK; g.fillRect(11, 0, 2, WORLD_H); g.fillRect(WORLD_W - 13, 0, 2, WORLD_H);
  } else {
  const hedgeAt = (x, y) => { pCirc(g, x, y, 8, h3); pCirc(g, x, y - 1, 7, h1); pCirc(g, x - 2, y - 3, 3, h2); };
  for (let x = 0; x <= WORLD_W; x += 10) { if (Math.abs(x - cx) > 34) hedgeAt(x, 10); hedgeAt(x, WORLD_H - 3); }
  for (let y = 0; y <= WORLD_H; y += 10) { hedgeAt(4, y); hedgeAt(WORLD_W - 4, y); }
  }

  // ---- decor ----
  const avoid = [{ x: cx, y: W.start.y, r: 46 }, { x: cx, y: W.gate.y, r: 52 }];
  const free = (x, y, r) => { for (const a of avoid) if (Math.hypot(x - a.x, y - a.y) < a.r + r) return false; for (const d of W.decor) if (Math.hypot(x - d.x, (y - d.y) * 1.4) < r + (d.space || 10)) return false; return true; };
  const add = (img, x, y, r, space, extra) => { const d = Object.assign({ img, x: Math.round(x), y: Math.round(y), r, space: space || 12 }, extra || {}); W.decor.push(d); if (r) W.solids.push({ x: d.x, y: d.y - 2, r }); return d; };
  const scatter = (n, mk, r, space, opt) => { opt = opt || {}; for (let i = 0; i < n; i++) { for (let k = 0; k < 40; k++) { const x = rr(28, WORLD_W - 28), y = rr(opt.ymin || 90, opt.ymax || WORLD_H - 40); if (Math.abs(x - pathX(y)) < (opt.pathGap || 42)) continue; if (W.fountain && Math.hypot(x - W.fountain.x, y - W.fountain.y) < 52) continue; if (opt.avoidBoss && Math.hypot(x - cx, y - 300) < 80) continue; if (opt.noSolid && W.solids.some(q => Math.hypot(x - q.x, y - q.y) < q.r + 8)) continue; if (!free(x, y, space)) continue; add(mk(), x, y, r, space); break; } } };

  X.add = add; X.scatter = scatter; if (th.decor) th.decor(X); // 소품 배치 (장 파일 THEME[...].decor)
  W.ground = gc;
  return W;
}
