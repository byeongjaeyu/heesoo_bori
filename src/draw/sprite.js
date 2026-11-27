// ===================== 도트 스프라이트 만들기·그리기 (makeSpr·sprHi·scale2x …) =====================
// ---------- sprites ----------


import { BASEPAL, MONSPR } from './sprites.js';
import { ctx } from '../sys/dom.js';

export function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function rowsToCanvas(rows, pal) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const c = mkCanvas(w, h), g = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    const r = rows[y];
    for (let x = 0; x < r.length; x++) {
      const ch = r[x]; if (ch === '.') continue;
      const col = (pal && pal[ch]) || BASEPAL[ch]; if (!col) continue;
      g.fillStyle = col; g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}
function flipC(c) { const o = mkCanvas(c.width, c.height), g = o.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return o; }
function whiteC(c) { const o = mkCanvas(c.width, c.height), g = o.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); return o; }
/** r = 해상도 배수 (2면 칸이 절반 크기 — W·H는 화면 크기 기준이라 예전 코드 그대로 씀) */
export function makeSpr(c, r) { r = r || 1; return { n: c, f: null, w: null, wf: null, W: c.width / r, H: c.height / r, R: r }; }
/** 스프라이트를 다른 캔버스에 화면 크기 × k 로 (해상도 배수 상관없이) */
export function sprBlit(g, s, x, y, k) { k = k || 1; g.drawImage(s.n, x, y, s.W * k, s.H * k); }
/** EPX(Scale2x): 1배 도트를 2배로 — 대각선 계단이 매끈해짐 */
function scale2x(src) {
  const w = src.width, h = src.height, sg = src.getContext('2d'), d = sg.getImageData(0, 0, w, h).data;
  const o = mkCanvas(w * 2, h * 2), og = o.getContext('2d'), od = og.createImageData(w * 2, h * 2), D = od.data;
  const at = (x, y) => { x = x < 0 ? 0 : x >= w ? w - 1 : x; y = y < 0 ? 0 : y >= h ? h - 1 : y; const i = (y * w + x) * 4; return (d[i] << 24 | d[i + 1] << 16 | d[i + 2] << 8 | d[i + 3]) >>> 0; };
  const put = (x, y, v) => { const i = (y * w * 2 + x) * 4; D[i] = v >>> 24 & 255; D[i + 1] = v >>> 16 & 255; D[i + 2] = v >>> 8 & 255; D[i + 3] = v & 255; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const P = at(x, y), A = at(x, y - 1), B = at(x + 1, y), C = at(x - 1, y), Dd = at(x, y + 1);
    let p1 = P, p2 = P, p3 = P, p4 = P;
    if (C === A && C !== Dd && A !== B) p1 = A; if (A === B && A !== C && B !== Dd) p2 = B;
    if (Dd === C && Dd !== B && C !== A) p3 = C; if (B === Dd && B !== A && Dd !== C) p4 = Dd;
    put(x * 2, y * 2, p1); put(x * 2 + 1, y * 2, p2); put(x * 2, y * 2 + 1, p3); put(x * 2 + 1, y * 2 + 1, p4);
  }
  og.putImageData(od, 0, 0); return o;
}
/** 2배 해상도 스프라이트 (EPX로 자동 2배) */
function sprHi(key, rows, pal) { if (!SPRC[key]) SPRC[key] = makeSpr(scale2x(rowsToCanvas(rows, pal)), 2); return SPRC[key]; }
export const SPRC = {};
export function spr(key, rows, pal) { if (!SPRC[key]) SPRC[key] = makeSpr(rowsToCanvas(rows, pal)); return SPRC[key]; }
export function sprFn(key, fn, r) { if (!SPRC[key]) SPRC[key] = makeSpr(fn(), r); return SPRC[key]; }
export function drawSpr(s, x, y, o) {
  o = o || {}; const sc = o.scale || 1; let img = s.n;
  if (o.white) { if (!s.w) s.w = whiteC(s.n); if (o.flip) { if (!s.wf) s.wf = flipC(s.w); img = s.wf; } else img = s.w; }
  else if (o.flip) { if (!s.f) s.f = flipC(s.n); img = s.f; }
  const a = o.alpha != null && o.alpha < 1;
  if (a) ctx.globalAlpha = Math.max(0, o.alpha);
  ctx.drawImage(img, Math.round(x - s.W * sc / 2), Math.round(y - s.H * sc), Math.round(s.W * sc), Math.round(s.H * sc));
  if (a) ctx.globalAlpha = 1;
}
export function pRect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
export function pCirc(g, cx, cy, r, c) { g.fillStyle = c; for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)) + 0.35); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
export function pEll(g, cx, cy, rx, ry, c) { g.fillStyle = c; for (let y = -ry; y <= ry; y++) { const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))) + 0.35); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
export function pRing(g, cx, cy, r, c, step) { g.fillStyle = c; const n = Math.max(8, Math.floor(r * 6.28 / (step || 1.5))); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1); } }

// icon -> dataURL (UI)
export const ICONURL = {};
export function iconURL(key, rows, pal) {
  if (ICONURL[key]) return ICONURL[key];
  const c = rowsToCanvas(rows, pal); const s = 4; const o = mkCanvas(16 * s, 16 * s), g = o.getContext('2d');
  g.imageSmoothingEnabled = false;
  const k = Math.max(1, Math.floor(Math.min(16 / c.width, 16 / c.height)));
  g.drawImage(c, Math.round((16 - c.width * k) / 2) * s, Math.round((16 - c.height * k) / 2) * s, c.width * k * s, c.height * k * s);
  return ICONURL[key] = o.toDataURL();
}

/** 몬스터 도트 (2배 매끈하게) */
export const monSpr = n => sprHi('m_' + n, MONSPR[n]);
