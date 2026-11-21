// ===================== WORLD / DECOR =====================
const WORLD_W = 560, WORLD_H = 760;
const OK = '#2b1b24';

function dTree(c1, c2, dark) {
  const c = mkCanvas(24, 30), g = c.getContext('2d');
  pRect(g, 10, 19, 4, 10, OK); pRect(g, 11, 19, 2, 10, '#7a4a2a'); pRect(g, 8, 28, 8, 2, OK);
  pCirc(g, 12, 11, 11, OK); pCirc(g, 6, 15, 6, OK); pCirc(g, 18, 15, 6, OK);
  pCirc(g, 12, 11, 10, dark); pCirc(g, 6, 15, 5, dark); pCirc(g, 18, 15, 5, dark);
  pCirc(g, 12, 10, 9, c1); pCirc(g, 6, 14, 4, c1); pCirc(g, 18, 14, 4, c1);
  pCirc(g, 10, 7, 4, c2); pCirc(g, 16, 12, 2, c2); pCirc(g, 5, 13, 1, c2);
  return c;
}
function dPine(c1, c2) {
  const c = mkCanvas(20, 34), g = c.getContext('2d'); const cx = 10;
  pRect(g, 8, 25, 4, 8, OK); pRect(g, 9, 25, 2, 8, '#6a4022');
  for (let y = 1; y <= 27; y++) {
    const layer = Math.min(2, Math.floor((y - 1) / 9)); const hw = Math.round(1 + ((y - 1) % 9) * 0.75 + layer * 1.6);
    g.fillStyle = OK; g.fillRect(cx - hw - 1, y, hw * 2 + 3, 1);
    g.fillStyle = c1; g.fillRect(cx - hw, y, hw * 2 + 1, 1);
    g.fillStyle = c2; g.fillRect(cx - hw, y, Math.max(1, Math.floor(hw * 0.6)), 1);
  }
  pRect(g, cx - 1, 0, 3, 1, OK);
  return c;
}
function dLamp(col) {
  const c = mkCanvas(9, 28), g = c.getContext('2d');
  pRect(g, 3, 8, 3, 19, OK); pRect(g, 4, 8, 1, 19, '#5a5a6a'); pRect(g, 1, 26, 7, 2, OK);
  pRect(g, 3, 0, 3, 1, OK); pRect(g, 1, 1, 7, 7, OK); pRect(g, 2, 2, 5, 5, col); pRect(g, 3, 3, 2, 2, '#ffffff');
  return c;
}
function dBench() {
  const c = mkCanvas(18, 11), g = c.getContext('2d');
  pRect(g, 1, 0, 16, 4, OK); pRect(g, 2, 1, 14, 2, '#b0713f');
  pRect(g, 3, 4, 1, 1, OK); pRect(g, 14, 4, 1, 1, OK);
  pRect(g, 0, 5, 18, 4, OK); pRect(g, 1, 6, 16, 2, '#d39a5f');
  pRect(g, 2, 9, 2, 2, OK); pRect(g, 14, 9, 2, 2, OK);
  return c;
}
function dBalloonCart() {
  const c = mkCanvas(18, 32), g = c.getContext('2d');
  /** @type {[number, number, string][]} */
  const bl = [[5, 5, '#ff6b8a'], [12, 4, '#6fb8ff'], [9, 9, '#ffd84a'], [14, 10, '#7ccf5a'], [4, 11, '#b45cff']];
  for (const [x, y] of bl) { g.fillStyle = '#9aa0aa'; for (let yy = y + 3; yy < 22; yy++) g.fillRect(Math.round(lerp(x, 9, (yy - y) / (22 - y))), yy, 1, 1); }
  for (const [x, y, col] of bl) { pCirc(g, x, y, 3, OK); pCirc(g, x, y, 2, col); pRect(g, x - 1, y - 1, 1, 1, '#fff'); }
  pRect(g, 2, 21, 14, 8, OK);
  for (let x = 3; x < 15; x++) pRect(g, x, 22, 1, 6, (Math.floor((x - 3) / 2) % 2) ? '#ffffff' : '#e8414f');
  pCirc(g, 5, 30, 1, OK); pCirc(g, 13, 30, 1, OK);
  return c;
}
function dCarousel() {
  const c = mkCanvas(74, 64), g = c.getContext('2d'); const cx = 37;
  pEll(g, cx, 56, 35, 7, OK); pEll(g, cx, 55, 34, 6, '#c75b98'); pEll(g, cx, 54, 34, 5, '#f7a8d0'); pEll(g, cx, 53, 30, 3, '#ffd1e6');
  for (const px of [7, 19, 37, 55, 67]) { pRect(g, px - 1, 25, 3, 28, OK); pRect(g, px, 25, 1, 28, '#ffd84a'); }
  for (const [hx, hy] of [[13, 41], [28, 37], [46, 39], [61, 42]]) {
    pRect(g, hx - 4, hy - 2, 8, 5, OK); pRect(g, hx - 3, hy - 1, 6, 3, '#ffffff');
    pRect(g, hx + 2, hy - 5, 4, 4, OK); pRect(g, hx + 3, hy - 4, 2, 2, '#ffffff'); pRect(g, hx - 3, hy - 1, 1, 1, '#ff8fd0');
  }
  for (let y = 5; y <= 25; y++) {
    const hw = Math.round((y - 5) / 20 * 36);
    g.fillStyle = OK; g.fillRect(cx - hw - 1, y, hw * 2 + 3, 1);
    for (let x = -hw; x <= hw; x++) { const st = Math.floor((x / Math.max(1, hw) + 1) * 4.5) % 2; g.fillStyle = st ? '#ffffff' : '#ff7ab8'; g.fillRect(cx + x, y, 1, 1); }
  }
  for (let i = 0; i < 12; i++) { const sx = 4 + i * 6; pCirc(g, sx, 26, 3, OK); pCirc(g, sx, 26, 2, i % 2 ? '#ffffff' : '#ff7ab8'); }
  pRect(g, cx, 0, 1, 6, OK); pRect(g, cx + 1, 0, 4, 3, '#e8414f');
  return c;
}
function dTower(col, roof) {
  const c = mkCanvas(22, 52), g = c.getContext('2d');
  pRect(g, 3, 18, 16, 34, OK); pRect(g, 4, 19, 14, 33, col);
  g.fillStyle = shadeHex(col, -0.1);
  for (let y = 22; y < 50; y += 4) for (let x = 4 + ((y / 4) % 2) * 3; x < 18; x += 6) g.fillRect(x, y, 4, 1);
  pRect(g, 9, 26, 4, 6, OK); pRect(g, 10, 27, 2, 5, '#ffd84a');
  pRect(g, 8, 42, 6, 10, OK); pRect(g, 9, 43, 4, 9, '#8a5a3a');
  for (let y = 4; y <= 19; y++) { const hw = Math.round((y - 4) / 15 * 10); g.fillStyle = OK; g.fillRect(11 - hw - 1, y, hw * 2 + 2, 1); g.fillStyle = roof; g.fillRect(11 - hw, y, hw * 2, 1); g.fillStyle = shadeHex(roof, 0.3); g.fillRect(11 - hw, y, Math.max(1, Math.floor(hw * 0.5)), 1); }
  pRect(g, 10, 0, 1, 5, OK); pRect(g, 11, 0, 4, 2, '#6fb8ff');
  return c;
}
function dCandy(col) {
  const c = mkCanvas(14, 28), g = c.getContext('2d');
  pRect(g, 6, 11, 3, 17, OK); pRect(g, 7, 11, 1, 17, '#ffffff');
  pCirc(g, 7, 7, 7, OK); pCirc(g, 7, 7, 6, '#ffffff'); pCirc(g, 7, 7, 4, col); pCirc(g, 7, 7, 2, '#ffffff'); pRect(g, 7, 7, 1, 1, col);
  pRect(g, 3, 3, 2, 1, '#ffffff');
  return c;
}
function dRock() { const c = mkCanvas(16, 10), g = c.getContext('2d'); pEll(g, 8, 5, 7, 4, OK); pEll(g, 8, 5, 6, 3, '#9a95a3'); pEll(g, 7, 4, 4, 2, '#b8b3c0'); pRect(g, 5, 3, 2, 1, '#d6d2dc'); return c; }
function dBush(c1, c2) { const c = mkCanvas(18, 12), g = c.getContext('2d'); for (const [x, y, r] of [[5, 7, 4], [12, 7, 4], [9, 5, 5]]) pCirc(g, x, y, r + 1, OK); for (const [x, y, r] of [[5, 7, 4], [12, 7, 4], [9, 5, 5]]) pCirc(g, x, y, r, c1); pCirc(g, 8, 3, 2, c2); pCirc(g, 4, 6, 1, c2); return c; }
function dJeep() {
  const c = mkCanvas(34, 22), g = c.getContext('2d');
  pRect(g, 2, 8, 30, 10, OK); pRect(g, 3, 9, 28, 8, '#d8c27e');
  for (let x = 5; x < 30; x += 5) pRect(g, x, 9, 2, 8, '#3a3440');
  pRect(g, 7, 2, 16, 7, OK); pRect(g, 8, 3, 6, 5, '#9fe8ff'); pRect(g, 16, 3, 6, 5, '#9fe8ff');
  pCirc(g, 9, 18, 3, OK); pCirc(g, 9, 18, 1, '#6a6f7c'); pCirc(g, 25, 18, 3, OK); pCirc(g, 25, 18, 1, '#6a6f7c');
  pRect(g, 30, 11, 3, 3, '#ffd84a');
  return c;
}
function dHouse(wall, roof) {
  const c = mkCanvas(38, 44), g = c.getContext('2d');
  pRect(g, 4, 18, 30, 26, OK); pRect(g, 5, 19, 28, 25, wall);
  g.fillStyle = '#6a4630'; g.fillRect(5, 30, 28, 1); g.fillRect(12, 19, 1, 25); g.fillRect(25, 19, 1, 25);
  for (const wx of [7, 27]) { pRect(g, wx - 1, 21, 6, 7, OK); pRect(g, wx, 22, 4, 5, '#9fe8ff'); pRect(g, wx + 2, 22, 1, 5, '#ffffff'); pRect(g, wx - 1, 27, 6, 1, '#ff7ab8'); }
  pRect(g, 16, 33, 7, 11, OK); pRect(g, 17, 34, 5, 10, '#8a5a3a'); pRect(g, 20, 39, 1, 1, '#ffd84a');
  for (let y = 2; y <= 19; y++) { const hw = Math.round((y - 2) / 17 * 18); g.fillStyle = OK; g.fillRect(19 - hw - 1, y, hw * 2 + 2, 1); g.fillStyle = roof; g.fillRect(19 - hw, y, hw * 2, 1); if (y % 3 === 0) { g.fillStyle = shadeHex(roof, -0.2); g.fillRect(19 - hw, y, hw * 2, 1); } }
  pRect(g, 27, 4, 4, 9, OK); pRect(g, 28, 5, 2, 8, '#9a5a4a');
  return c;
}
function dPillar() {
  const c = mkCanvas(8, 48), g = c.getContext('2d');
  pRect(g, 0, 0, 8, 48, OK); pRect(g, 1, 0, 2, 48, '#d84a5a'); pRect(g, 5, 0, 2, 48, '#d84a5a');
  g.fillStyle = '#ffb0b8'; for (let y = 0; y < 48; y += 4) { g.fillRect(3, y, 1, 1); g.fillRect(4, y + 2, 1, 1); }
  pRect(g, 0, 46, 8, 2, '#5a5a6a');
  return c;
}
function dGate(open) {
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

const THEME = {
  plaza:  { bg: '#3f8a34', hedge: ['#3f8a34', '#5aa845', '#2b6a26'], tint: [70, 20, 110, 0.10], glow: 0.14 },
  pastel: { bg: '#3f8a34', hedge: ['#4c9a52', '#79c78a', '#2f6a3a'], tint: [90, 20, 120, 0.14], glow: 0.07 },
  grass:  { bg: '#2f6a26', hedge: ['#2f7a2a', '#4f9a3f', '#1f5a1c'], tint: [40, 20, 90, 0.16], glow: 0.2 },
  cobble: { bg: '#2a2a36', hedge: ['#36603a', '#4f7f4a', '#22402a'], tint: [30, 8, 70, 0.34], glow: 0.32 },
  // 2장 바다낚시터: 가장자리는 산울타리 대신 바다
  lot:   { bg: '#2f6fae', hedge: ['#3a3a42', '#55555f', '#2a2a30'], tint: [40, 30, 90, 0.10], glow: 0.16, sea: 1 },
  pier:  { bg: '#2f6fae', hedge: ['#8a6a44', '#b98a5a', '#5e4430'], tint: [20, 40, 90, 0.06], glow: 0.10, sea: 1 },
  night: { bg: '#0e1a33', hedge: ['#4a3a2a', '#6a5238', '#2e2418'], tint: [8, 12, 50, 0.30], glow: 0.55, sea: 1, dark: 1 },
  rock:  { bg: '#182848', hedge: ['#3a3a48', '#55556a', '#262632'], tint: [30, 20, 80, 0.26], glow: 0.4, sea: 1 },
  // 3장 사직 야구장: 가장자리는 경기장 외벽(콘크리트)
  gate:  { bg: '#9aa0aa', hedge: ['#8a8f9a', '#b0b5c0', '#6a6f7c'], tint: [60, 30, 80, 0.06], glow: 0.12, wall: 1 },
  food:  { bg: '#9aa0aa', hedge: ['#8a8f9a', '#b0b5c0', '#6a6f7c'], tint: [80, 40, 40, 0.08], glow: 0.2, wall: 1 },
  stand: { bg: '#2a3a5a', hedge: ['#8a8f9a', '#b0b5c0', '#6a6f7c'], tint: [20, 20, 70, 0.14], glow: 0.35, wall: 1 },
  field: { bg: '#10182c', hedge: ['#3a3a48', '#55556a', '#262632'], tint: [10, 14, 40, 0.34], glow: 0.6, wall: 1, rain: 1 }
};
// ---------- 3장 소품 ----------
function dBooth() { const c = mkCanvas(34, 34), g = c.getContext('2d'); pRect(g, 2, 10, 30, 24, OK); pRect(g, 3, 11, 28, 23, '#e8e8ee'); pRect(g, 0, 4, 34, 8, OK); for (let x = 1; x < 33; x++) pRect(g, x, 5, 1, 6, (Math.floor(x / 4) % 2) ? '#ffffff' : '#e8414f'); pRect(g, 7, 15, 20, 9, OK); pRect(g, 8, 16, 18, 7, '#9fe8ff'); pRect(g, 6, 26, 22, 3, OK); pRect(g, 7, 26, 20, 2, '#8a5a3a'); pRect(g, 9, 0, 16, 5, OK); pRect(g, 10, 1, 14, 3, '#ffd84a'); return c; }
function dStanchion() { const c = mkCanvas(40, 14), g = c.getContext('2d'); for (const x of [2, 36]) { pRect(g, x, 2, 3, 11, OK); pRect(g, x + 1, 3, 1, 9, '#c0c6d0'); pRect(g, x - 1, 12, 5, 2, OK); } for (let x = 5; x < 36; x++) pRect(g, x, 4 + Math.round(Math.sin((x - 5) / 31 * Math.PI) * 3), 1, 2, '#e8414f'); return c; }
function dStall(col) { const c = mkCanvas(40, 34), g = c.getContext('2d'); pRect(g, 2, 12, 36, 22, OK); pRect(g, 3, 13, 34, 21, '#fff6e0'); pRect(g, 0, 4, 40, 9, OK); for (let x = 1; x < 39; x++) pRect(g, x, 5, 1, 7, (Math.floor(x / 4) % 2) ? '#ffffff' : col); pRect(g, 4, 22, 32, 3, OK); pRect(g, 5, 22, 30, 2, '#c98a5a'); for (let i = 0; i < 4; i++) { pCirc(g, 9 + i * 7, 18, 2, i % 2 ? '#d9822b' : '#e8414f'); } return c; }
function dTable() { const c = mkCanvas(22, 16), g = c.getContext('2d'); pRect(g, 1, 4, 20, 5, OK); pRect(g, 2, 5, 18, 3, '#e8e8ee'); pRect(g, 4, 9, 2, 7, OK); pRect(g, 16, 9, 2, 7, OK); pRect(g, 7, 1, 8, 4, OK); pRect(g, 8, 2, 6, 2, '#d9822b'); return c; }
function dBin() { const c = mkCanvas(10, 14), g = c.getContext('2d'); pRect(g, 1, 2, 8, 12, OK); pRect(g, 2, 3, 6, 10, '#3a78c0'); pRect(g, 0, 0, 10, 3, OK); pRect(g, 1, 1, 8, 1, '#6fb8ff'); return c; }
function dLightTower() { const c = mkCanvas(20, 46), g = c.getContext('2d'); pRect(g, 9, 12, 2, 34, OK); pRect(g, 7, 42, 6, 4, OK); pRect(g, 0, 0, 20, 13, OK); for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) pRect(g, 2 + x * 4, 2 + y * 4, 3, 3, '#fff6d0'); return c; }
function dBase() { const c = mkCanvas(10, 10), g = c.getContext('2d'); pRect(g, 1, 1, 8, 8, OK); pRect(g, 2, 2, 6, 6, '#ffffff'); return c; }
function dScore() { const c = mkCanvas(56, 30), g = c.getContext('2d'); pRect(g, 0, 0, 56, 24, OK); pRect(g, 2, 2, 52, 20, '#1c2a1c'); for (let i = 0; i < 9; i++) { pRect(g, 5 + i * 5, 6, 3, 4, '#ffd84a'); pRect(g, 5 + i * 5, 13, 3, 4, i === 8 ? '#e8414f' : '#ffd84a'); } pRect(g, 25, 24, 6, 6, OK); return c; }
// ---------- 2장 소품 ----------
function dCar(col) { const c = mkCanvas(30, 18), g = c.getContext('2d'); pRect(g, 1, 6, 28, 9, OK); pRect(g, 2, 7, 26, 7, col); pRect(g, 7, 1, 16, 7, OK); pRect(g, 8, 2, 6, 5, '#9fe8ff'); pRect(g, 16, 2, 6, 5, '#9fe8ff'); pRect(g, 2, 10, 26, 1, shadeHex(col, -0.25)); pCirc(g, 7, 15, 3, OK); pCirc(g, 7, 15, 1, '#6a6f7c'); pCirc(g, 23, 15, 3, OK); pCirc(g, 23, 15, 1, '#6a6f7c'); pRect(g, 27, 8, 2, 2, '#ffd84a'); return c; }
function dCone() { const c = mkCanvas(9, 12), g = c.getContext('2d'); for (let y = 1; y < 10; y++) { const hw = Math.round(y / 2.4); pRect(g, 4 - hw - 1, y, hw * 2 + 3, 1, OK); pRect(g, 4 - hw, y, hw * 2 + 1, 1, y % 4 === 2 ? '#ffffff' : '#ff7a2a'); } pRect(g, 0, 10, 9, 2, OK); pRect(g, 1, 10, 7, 1, '#ff7a2a'); return c; }
function dBaitShop() { const c = mkCanvas(40, 34), g = c.getContext('2d'); pRect(g, 3, 12, 34, 22, OK); pRect(g, 4, 13, 32, 21, '#d8ecff'); pRect(g, 0, 6, 40, 8, OK); for (let x = 1; x < 39; x++) pRect(g, x, 7, 1, 6, (Math.floor(x / 3) % 2) ? '#ffffff' : '#3a78c0'); pRect(g, 8, 18, 10, 8, OK); pRect(g, 9, 19, 8, 6, '#9fe8ff'); pRect(g, 23, 20, 9, 14, OK); pRect(g, 24, 21, 7, 13, '#8a5a3a'); pRect(g, 10, 0, 20, 7, OK); pRect(g, 11, 1, 18, 5, '#ffd84a'); pRect(g, 13, 3, 14, 1, '#2b1b24'); return c; }
function dChair() { const c = mkCanvas(14, 16), g = c.getContext('2d'); pRect(g, 2, 0, 10, 9, OK); pRect(g, 3, 1, 8, 7, '#3a78c0'); pRect(g, 1, 8, 12, 4, OK); pRect(g, 2, 9, 10, 2, '#6fb8ff'); pRect(g, 2, 12, 1, 4, OK); pRect(g, 11, 12, 1, 4, OK); return c; }
function dCooler() { const c = mkCanvas(16, 11), g = c.getContext('2d'); pRect(g, 0, 2, 16, 9, OK); pRect(g, 1, 3, 14, 7, '#ffffff'); pRect(g, 1, 3, 14, 2, '#3a78c0'); pRect(g, 5, 0, 6, 3, OK); pRect(g, 6, 1, 4, 1, '#c0c6d0'); return c; }
function dParasol(col) { const c = mkCanvas(30, 34), g = c.getContext('2d'); pRect(g, 14, 9, 2, 25, OK); for (let y = 1; y <= 10; y++) { const hw = Math.round(y * 1.4); pRect(g, 15 - hw - 1, y, hw * 2 + 2, 1, OK); for (let x = -hw; x <= hw; x++) pRect(g, 15 + x, y, 1, 1, (Math.floor((x + 30) / 4) % 2) ? '#ffffff' : col); } pRect(g, 1, 11, 28, 1, OK); return c; }
function dRod() { const c = mkCanvas(20, 30), g = c.getContext('2d'); for (let i = 0; i < 26; i++) pRect(g, 3 + Math.round(i * 0.55), 28 - i, 1, 1, OK); pRect(g, 2, 24, 3, 6, '#c98a3a'); pRect(g, 5, 22, 3, 3, OK); pRect(g, 6, 23, 1, 1, '#c0c6d0'); for (let y = 2; y < 18; y++) pRect(g, 17, y, 1, 1, '#d6e8ff'); return c; }
function dBuoy() { const c = mkCanvas(14, 14), g = c.getContext('2d'); pCirc(g, 7, 7, 6, OK); pCirc(g, 7, 7, 5, '#ff7a2a'); pCirc(g, 7, 7, 2, OK); for (const [x, y] of [[7, 2], [7, 12], [2, 7], [12, 7]]) pRect(g, x - 1, y - 1, 2, 2, '#ffffff'); return c; }
function dSeaRock(dark) { const c = mkCanvas(26, 16), g = c.getContext('2d'); pEll(g, 13, 9, 12, 7, OK); pEll(g, 13, 9, 11, 6, dark ? '#3a3a48' : '#6a6878'); pEll(g, 11, 7, 7, 3, dark ? '#4e4e60' : '#8a8898'); pRect(g, 8, 5, 3, 1, dark ? '#6a6a80' : '#aaa8b8'); return c; }
function dLantern() { const c = mkCanvas(9, 26), g = c.getContext('2d'); pRect(g, 4, 8, 1, 18, OK); pRect(g, 2, 24, 5, 2, OK); pRect(g, 2, 0, 5, 1, OK); pRect(g, 1, 1, 7, 7, OK); pRect(g, 2, 2, 5, 5, '#ffcf6a'); pRect(g, 3, 3, 2, 2, '#fff6d0'); return c; }
function dSeaGate(open) {
  const c = mkCanvas(62, 54), g = c.getContext('2d');
  if (!open) { pRect(g, 12, 18, 38, 36, '#3a2a24'); g.fillStyle = '#8a6a44'; for (let y = 20; y < 54; y += 5) g.fillRect(12, y, 38, 2); pRect(g, 27, 32, 8, 7, OK); pRect(g, 28, 33, 6, 5, '#e8414f'); }
  for (const px of [4, 50]) { pRect(g, px, 10, 8, 44, OK); pRect(g, px + 1, 11, 6, 43, '#a8784a'); g.fillStyle = '#7a5434'; for (let y = 14; y < 54; y += 6) g.fillRect(px + 1, y, 6, 1); }
  pRect(g, 0, 6, 62, 8, OK); pRect(g, 1, 7, 60, 6, '#3a78c0'); pRect(g, 1, 7, 60, 2, '#6fb8ff');
  pRect(g, 14, 0, 34, 11, OK); pRect(g, 15, 1, 32, 9, '#fff6e0'); pRect(g, 18, 4, 4, 3, '#3a78c0'); pRect(g, 25, 4, 4, 3, '#3a78c0'); pRect(g, 32, 4, 4, 3, '#3a78c0'); pRect(g, 39, 4, 4, 3, '#3a78c0');
  return c;
}

function buildWorld(zi) {
  const Z = ZONES[zi], th = THEME[Z.theme]; const R = mulberry(911 + zi * 131);
  const rr = (a, b) => a + R() * (b - a);
  const W = { W: WORLD_W, H: WORLD_H, decor: [], solids: [], start: { x: WORLD_W / 2, y: WORLD_H - 76 }, gate: { x: WORLD_W / 2, y: 62 }, theme: Z.theme, bg: th.bg, tint: th.tint, glowA: th.glow, fountain: null, rails: [], gateClosed: (th.sea ? dSeaGate : dGate)(false), gateOpen: (th.sea ? dSeaGate : dGate)(true), dark: !!th.dark, rain: !!th.rain };
  const gc = mkCanvas(WORLD_W, WORLD_H), g = gc.getContext('2d');
  const cx = WORLD_W / 2;
  const pathX = y => Z.theme === 'grass' ? cx + Math.sin(y / 95) * 70 * clamp((WORLD_H - 60 - y) / 120, 0, 1) * clamp((y - 80) / 120, 0, 1) : cx;

  // ---- base ground ----
  if (Z.theme === 'plaza') {
    const tones = ['#ead9b6', '#e5d2ad', '#efdfbf'];
    for (let y = 0; y < WORLD_H; y += 16) for (let x = 0; x < WORLD_W; x += 16) { g.fillStyle = tones[Math.floor(R() * 3)]; g.fillRect(x, y, 16, 16); g.fillStyle = '#d6c39a'; g.fillRect(x, y, 16, 1); g.fillRect(x, y, 1, 16); }
    for (let y = 0; y < WORLD_H; y += 4) { const off = (y / 4) % 2 ? 4 : 0; for (let x = cx - 26 + off; x < cx + 26; x += 8) { g.fillStyle = R() < 0.5 ? '#d98b6a' : '#cf7f60'; g.fillRect(x, y, 7, 3); } }
    g.fillStyle = '#b8694e'; g.fillRect(cx - 27, 0, 2, WORLD_H); g.fillRect(cx + 26, 0, 2, WORLD_H);
    const fy = 430; W.fountain = { x: cx, y: fy };
    pCirc(g, cx, fy, 38, '#e9d7b4'); pCirc(g, cx, fy, 31, '#8a8378'); pCirc(g, cx, fy, 30, '#d8d0c4'); pCirc(g, cx, fy, 26, '#8a8378'); pCirc(g, cx, fy, 25, '#5fb0ea'); pCirc(g, cx, fy, 20, '#7ec8ff'); pRing(g, cx, fy, 14, '#b8e6ff', 3); pCirc(g, cx, fy, 6, '#8a8378'); pCirc(g, cx, fy, 5, '#e8e2d6'); pCirc(g, cx, fy - 1, 2, '#ffffff');
    W.solids.push({ x: cx, y: fy, r: 29 });
    for (let i = 0; i < 12; i++) { let x, y; for (let k = 0; k < 20; k++) { x = rr(50, WORLD_W - 50); y = rr(110, WORLD_H - 110); if (Math.abs(x - cx) > 60 && Math.hypot(x - cx, y - fy) > 60) break; } pEll(g, x, y, 12, 6, '#2b6a26'); pEll(g, x, y, 11, 5, '#4f9a3f'); for (let k = 0; k < 14; k++) { g.fillStyle = choice(['#ff7aa8', '#ffd84a', '#ffffff', '#ff9a3c']); g.fillRect(Math.round(x + rr(-9, 9)), Math.round(y + rr(-3, 3)), 1, 1); } }
  } else if (Z.theme === 'pastel') {
    for (let y = 0; y < WORLD_H; y += 16) for (let x = 0; x < WORLD_W; x += 16) { g.fillStyle = ((x + y) / 16) % 2 ? '#f9dceb' : '#ebe0f8'; g.fillRect(x, y, 16, 16); }
    g.fillStyle = '#fff6fb'; g.fillRect(cx - 24, 0, 48, WORLD_H); g.fillStyle = '#ff9fcf'; g.fillRect(cx - 26, 0, 2, WORLD_H); g.fillRect(cx + 24, 0, 2, WORLD_H);
    for (let y = 8; y < WORLD_H; y += 24) { const x = cx - 3; g.fillStyle = '#ffc6e2'; g.fillRect(x, y, 2, 2); g.fillRect(x + 4, y, 2, 2); g.fillRect(x, y + 2, 6, 2); g.fillRect(x + 1, y + 4, 4, 1); g.fillRect(x + 2, y + 5, 2, 1); }
    for (let i = 0; i < 60; i++) { g.fillStyle = choice(['#ffffff', '#ffd84a', '#b8e0ff']); g.fillRect(Math.round(rr(20, WORLD_W - 20)), Math.round(rr(20, WORLD_H - 20)), 1, 1); }
  } else if (Z.theme === 'grass') {
    g.fillStyle = '#8cc96e'; g.fillRect(0, 0, WORLD_W, WORLD_H);
    for (let i = 0; i < 5000; i++) { g.fillStyle = R() < 0.6 ? '#7ab95e' : '#a3d987'; g.fillRect(Math.floor(R() * WORLD_W), Math.floor(R() * WORLD_H), 1, R() < 0.3 ? 2 : 1); }
    for (let y = 0; y < WORLD_H; y++) { const px = Math.round(pathX(y)); g.fillStyle = '#b99260'; g.fillRect(px - 19, y, 38, 1); g.fillStyle = '#d6b47c'; g.fillRect(px - 17, y, 34, 1); }
    for (let i = 0; i < 700; i++) { const y = Math.floor(R() * WORLD_H); const px = pathX(y); g.fillStyle = R() < 0.5 ? '#c7a26c' : '#e2c48e'; g.fillRect(Math.round(px + rr(-16, 16)), y, 1, 1); }
    for (let i = 0; i < 40; i++) { g.fillStyle = choice(['#ffffff', '#ffd84a', '#ff9fcf']); const x = Math.round(rr(20, WORLD_W - 20)), y = Math.round(rr(20, WORLD_H - 20)); g.fillRect(x, y, 1, 1); g.fillRect(x - 1, y + 1, 3, 1); }
  } else if (Z.theme === 'lot') {
    // 주차장: 아스팔트 + 주차선, 위쪽은 바다로 이어지는 낚시터 입구
    g.fillStyle = '#4a4a54'; g.fillRect(0, 0, WORLD_W, WORLD_H);
    for (let i = 0; i < 6000; i++) { g.fillStyle = R() < 0.5 ? '#43434c' : '#55555f'; g.fillRect(Math.floor(R() * WORLD_W), Math.floor(R() * WORLD_H), 1, 1); }
    g.fillStyle = '#f0d040'; for (let y = 0; y < WORLD_H; y += 22) g.fillRect(cx - 1, y, 2, 12);
    g.fillStyle = '#e8e8ee'; for (const side of [-1, 1]) for (let y = 120; y < WORLD_H - 60; y += 46) { const x0 = side < 0 ? 40 : cx + 60; g.fillRect(x0, y, cx - 100, 2); for (let x = x0; x <= x0 + cx - 100; x += 46) g.fillRect(x, y, 2, 40); }
  } else if (Z.theme === 'pier' || Z.theme === 'night') {
    // 좌대: 나무 데크 (밤에는 어둡게)
    const nt = Z.theme === 'night', tones = nt ? ['#5a4630', '#4e3c28', '#64503a'] : ['#c49460', '#b98a56', '#cc9e6a'];
    for (let y = 0; y < WORLD_H; y += 8) { let x = -Math.floor(R() * 40); while (x < WORLD_W) { const w = 30 + Math.floor(R() * 50); g.fillStyle = choice(tones); g.fillRect(x, y, w, 7); g.fillStyle = nt ? '#2e2418' : '#8a6440'; g.fillRect(x + w - 1, y, 1, 7); x += w; } g.fillStyle = nt ? '#241a12' : '#7a5434'; g.fillRect(0, y + 7, WORLD_W, 1); }
    for (let i = 0; i < 160; i++) { g.fillStyle = nt ? '#3a2c1e' : '#9a7048'; g.fillRect(Math.floor(R() * WORLD_W), Math.floor(R() * WORLD_H), 2, 1); }
    // 데크 가운데 낚시 구멍(바다가 보이는 칸)
    for (const [hx, hy] of [[150, 300], [410, 420], [140, 560], [420, 190]]) { pRect(g, hx - 22, hy - 12, 44, 24, '#2b1b24'); pRect(g, hx - 20, hy - 10, 40, 20, nt ? '#0c2a4a' : '#2f7fc0'); for (let k = 0; k < 6; k++) pRect(g, hx - 16 + k * 6, hy - 4 + (k % 2) * 6, 4, 1, nt ? '#3a6aa0' : '#9fd8ff'); W.solids.push({ x: hx, y: hy, r: 14 }); }
  } else if (Z.theme === 'gate' || Z.theme === 'food') {
    // 매표소 광장: 붉은 벽돌 / 먹거리 존: 베이지 타일
    const gate = Z.theme === 'gate'; g.fillStyle = gate ? '#b86a50' : '#e8d8b8'; g.fillRect(0, 0, WORLD_W, WORLD_H);
    const tw = gate ? 12 : 16, th2 = gate ? 6 : 16;
    for (let y = 0; y < WORLD_H; y += th2) { const off = gate && (y / th2) % 2 ? tw / 2 : 0; for (let x = -off; x < WORLD_W; x += tw) { g.fillStyle = choice(gate ? ['#b86a50', '#a85e46', '#c4765a'] : ['#e8d8b8', '#e0ceaa', '#efe2c6']); g.fillRect(x + 1, y + 1, tw - 1, th2 - 1); } }
    g.fillStyle = gate ? '#8a4a36' : '#c8b590'; for (let y = 0; y < WORLD_H; y += th2) g.fillRect(0, y, WORLD_W, 1);
  } else if (Z.theme === 'stand') {
    // 응원석: 계단식 콘크리트 단 + 등받이 의자 + 앉아 있는 관중 (가운데·양옆은 계단 통로, 8줄마다 가로 통로)
    g.fillStyle = '#5a5f6c'; g.fillRect(0, 0, WORLD_W, WORLD_H);
    const RP = 24, aisles = [[cx - 34, cx + 34], [92, 116], [WORLD_W - 116, WORLD_W - 92]];
    const inAisle = x => aisles.some(([a0, a1]) => x + 12 > a0 && x < a1);
    const secCol = x => (x < 92 || x > WORLD_W - 92) ? ['#3a5ab0', '#2a4288', '#5a7ad0'] : ['#e8414f', '#b02a3a', '#ff6a74'];
    const shirts = ['#ffffff', '#e8414f', '#3a5ab0', '#f0f0f0', '#2b2b3a', '#ffcf40', '#e8414f', '#c0c6d0'], hairs = ['#2b1b24', '#3a2a20', '#5a3a2a', '#1a1a22', '#8a5a3a'];
    for (let r = 0, y = 30; y < WORLD_H; r++, y += RP) {
      if (r % 8 === 7) { // 가로 통로 + 난간
        pRect(g, 0, y, WORLD_W, RP, '#8a8f9a'); for (let x = 0; x < WORLD_W; x += 20) pRect(g, x, y + 4, 10, 1, '#9aa0aa');
        pRect(g, 0, y + RP - 3, WORLD_W, 1, OK); pRect(g, 0, y - 1, WORLD_W, 2, '#c0c6d0'); pRect(g, 0, y + 1, WORLD_W, 1, OK);
        for (let x = 6; x < WORLD_W; x += 28) pRect(g, x, y - 1, 2, 5, '#c0c6d0');
        continue;
      }
      pRect(g, 0, y, WORLD_W, 16, '#6e7380'); pRect(g, 0, y + 16, WORLD_W, RP - 16, '#4e525e'); pRect(g, 0, y + 16, WORLD_W, 1, '#3e424c'); pRect(g, 0, y, WORLD_W, 1, '#8a8f9a');
      for (let x = 20; x < WORLD_W - 22; x += 14) {
        if (inAisle(x)) continue;
        const [c1, c2, c3] = secCol(x);
        pRect(g, x, y + 1, 12, 9, OK); pRect(g, x + 1, y + 2, 10, 7, c1); pRect(g, x + 1, y + 2, 10, 2, c3);
        pRect(g, x, y + 10, 12, 5, OK); pRect(g, x + 1, y + 10, 10, 4, c2); pRect(g, x + 1, y + 15, 10, 2, 'rgba(0,0,0,0.25)');
        if (R() < 0.34) { // 관중
          const sh = choice(shirts), hx = x + 6;
          pRect(g, hx - 4, y + 7, 9, 8, OK); pRect(g, hx - 3, y + 8, 7, 6, sh);
          pCirc(g, hx, y + 4, 3, OK); pCirc(g, hx, y + 4, 2, '#f6d2b4'); const hc = choice(hairs); pRect(g, hx - 3, y + 1, 7, 2, hc); pRect(g, hx - 3, y + 2, 1, 2, hc); pRect(g, hx + 3, y + 2, 1, 2, hc);
          const k = R();
          if (k < 0.18) { pRect(g, hx - 5, y - 3, 1, 9, '#f6d2b4'); pRect(g, hx + 5, y - 3, 1, 9, '#f6d2b4'); } // 만세
          else if (k < 0.32) { const bc = R() < 0.5 ? '#ffcf40' : '#ff6a74'; pRect(g, hx - 6, y - 6, 2, 11, OK); pRect(g, hx - 6, y - 5, 2, 9, bc); pRect(g, hx + 5, y - 6, 2, 11, OK); pRect(g, hx + 5, y - 5, 2, 9, bc); } // 막대풍선
        }
      }
    }
    for (const [a0, a1] of aisles) { // 계단 통로
      pRect(g, a0, 0, a1 - a0, WORLD_H, '#8a8f9a');
      for (let y = 0; y < WORLD_H; y += 12) { pRect(g, a0, y, a1 - a0, 6, '#9aa0aa'); pRect(g, a0, y + 6, a1 - a0, 1, '#6a6f7c'); pRect(g, a0 + 2, y, a1 - a0 - 4, 1, '#f0d040'); }
      pRect(g, a0 - 1, 0, 1, WORLD_H, OK); pRect(g, a1, 0, 1, WORLD_H, OK);
    }
  } else if (Z.theme === 'field') {
    // 9회말 그라운드: 잔디 줄무늬 + 내야 흙 + 베이스
    for (let y = 0; y < WORLD_H; y += 24) { g.fillStyle = (y / 24) % 2 ? '#2f6a3a' : '#3a7a44'; g.fillRect(0, y, WORLD_W, 24); }
    const dy = WORLD_H * 0.55; g.fillStyle = '#9a6a44'; g.beginPath(); g.moveTo(cx, dy - 150); g.lineTo(cx + 150, dy); g.lineTo(cx, dy + 150); g.lineTo(cx - 150, dy); g.closePath(); g.fill();
    g.fillStyle = '#3a7a44'; g.beginPath(); g.moveTo(cx, dy - 110); g.lineTo(cx + 110, dy); g.lineTo(cx, dy + 110); g.lineTo(cx - 110, dy); g.closePath(); g.fill();
    g.strokeStyle = '#f0f0f0'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, dy + 150); g.lineTo(cx + 150, dy); g.lineTo(cx, dy - 150); g.lineTo(cx - 150, dy); g.closePath(); g.stroke();
    pEll(g, cx, dy, 14, 9, '#9a6a44');
  } else if (Z.theme === 'rock') {
    // 대물탕: 콘크리트 바닥 + 사각 수조(탕) 4개
    g.fillStyle = '#7a808c'; g.fillRect(0, 0, WORLD_W, WORLD_H);
    for (let i = 0; i < 5000; i++) { g.fillStyle = R() < 0.5 ? '#727884' : '#848a96'; g.fillRect(Math.floor(R() * WORLD_W), Math.floor(R() * WORLD_H), 1, 1); }
    g.fillStyle = '#6a707c'; for (let y = 0; y < WORLD_H; y += 40) g.fillRect(0, y, WORLD_W, 1); for (let x = 0; x < WORLD_W; x += 40) g.fillRect(x, 0, 1, WORLD_H);
    const pw = 110, ph = 60;
    for (const [px, py] of [[cx - 175, 210], [cx + 175, 250], [cx - 175, 480], [cx + 175, 520]]) {
      pRect(g, px - pw / 2 - 5, py - ph / 2 - 5, pw + 10, ph + 10, '#2b1b24'); pRect(g, px - pw / 2 - 4, py - ph / 2 - 4, pw + 8, ph + 8, '#c0c6d0');
      pRect(g, px - pw / 2, py - ph / 2, pw, ph, '#2b1b24'); pRect(g, px - pw / 2 + 1, py - ph / 2 + 1, pw - 2, ph - 2, '#1c4a7a');
      pRect(g, px - pw / 2 + 1, py - ph / 2 + 1, pw - 2, 4, '#163a62');
      for (let k = 0; k < 14; k++) pRect(g, px - pw / 2 + 6 + R() * (pw - 16), py - ph / 2 + 8 + R() * (ph - 14), 5, 1, '#4a8ac0');
      for (let k = 0; k < 3; k++) { const fx = px - 30 + k * 28, fy = py - 6 + (k % 2) * 14; pEll(g, fx, fy, 6, 2, '#0e2e52'); }
      for (let x = px - pw / 2 + 12; x <= px + pw / 2 - 12; x += 24) for (const yy of [py - 14, py + 14]) W.solids.push({ x, y: yy, r: 17 });
    }
  } else {
    g.fillStyle = '#6e6878'; g.fillRect(0, 0, WORLD_W, WORLD_H);
    for (let y = 0; y < WORLD_H; y += 7) { const off = (y / 7) % 2 ? 5 : 0; for (let x = -off; x < WORLD_W; x += 10) { const onPath = Math.abs(x + 5 - cx) < 26; g.fillStyle = onPath ? choice(['#b8b0bf', '#b0a8b8', '#bcb4c4']) : choice(['#958ea0', '#8c8598', '#9a93a6']); g.fillRect(x + 1, y + 1, 8, 5); g.fillStyle = onPath ? '#cfc8d6' : '#a8a2b4'; g.fillRect(x + 2, y + 1, 5, 1); } }
  }

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

  if (Z.theme === 'plaza') {
    const lamp = dLamp('#ffe68a');
    for (let y = 120; y < WORLD_H - 70; y += 92) { if (Math.abs(y - 430) < 50) continue; add(lamp, cx - 36, y, 2, 8, { glow: '#ffe68a' }); add(lamp, cx + 36, y, 2, 8, { glow: '#ffe68a' }); }
    const t1 = dTree('#6cc04a', '#9be06e', '#3f8a34'), t2 = dTree('#f6a6c8', '#ffd1e3', '#c76a96');
    scatter(16, () => R() < 0.7 ? t1 : t2, 6, 16, { avoidBoss: true });
    const bench = dBench(); scatter(6, () => bench, 0, 12);
    const cart = dBalloonCart(); scatter(4, () => cart, 5, 14);
    W.mainGate = { x: cx, y: WORLD_H + 6 };
  } else if (Z.theme === 'pastel') {
    add(dCarousel(), 150, 470, 27, 40);
    add(dTower('#e6d6f6', '#b45cff'), 430, 210, 8, 16); add(dTower('#ffe0ec', '#ff7ab8'), 470, 560, 8, 16); add(dTower('#e0f0ff', '#6fb8ff'), 90, 180, 8, 16);
    const lamp = dLamp('#ffb3d9');
    for (let y = 130; y < WORLD_H - 70; y += 100) { add(lamp, cx - 34, y, 2, 8, { glow: '#ffb3d9' }); add(lamp, cx + 34, y, 2, 8, { glow: '#ffb3d9' }); }
    const c1 = dCandy('#ff7ab8'), c2 = dCandy('#6fb8ff'), c3 = dCandy('#b45cff');
    scatter(16, () => choice([c1, c2, c3]), 3, 14, { avoidBoss: true });
    const t = dTree('#f6a6c8', '#ffd1e3', '#c76a96'); scatter(8, () => t, 6, 16, { avoidBoss: true });
    const cart = dBalloonCart(); scatter(3, () => cart, 5, 14);
  } else if (Z.theme === 'grass') {
    const t1 = dTree('#4f9a3f', '#7ccf5a', '#2f6a26'), p1 = dPine('#3f8a34', '#5aa845');
    scatter(22, () => R() < 0.55 ? t1 : p1, 6, 16, { avoidBoss: true });
    const rock = dRock(); scatter(10, () => rock, 5, 12);
    const bush = dBush('#4f9a3f', '#7ccf5a'); scatter(14, () => bush, 0, 10);
    add(dJeep(), 120, 560, 12, 24); add(dJeep(), 440, 250, 12, 24);
  } else if (Z.theme === 'lot') {
    const cols = ['#e8414f', '#f7f3ea', '#3a78c0', '#2b2b34', '#b9c0cc', '#7ccf5a'];
    for (const side of [-1, 1]) for (let y = 160; y < WORLD_H - 60; y += 46) { if (R() < 0.35) continue; const x = side < 0 ? rr(60, cx - 90) : rr(cx + 90, WORLD_W - 60); add(dCar(choice(cols)), x, y, 12, 18); }
    const cone = dCone(); for (let y = 140; y < WORLD_H - 80; y += 70) { add(cone, cx - 30, y, 2, 6); add(cone, cx + 30, y + 35, 2, 6); }
    add(dBaitShop(), 90, 110, 16, 30); add(dBaitShop(), WORLD_W - 90, 110, 16, 30);
    const lamp = dLamp('#ffe68a'); for (let y = 200; y < WORLD_H - 70; y += 150) { add(lamp, 30, y, 2, 8, { glow: '#ffe68a' }); add(lamp, WORLD_W - 30, y, 2, 8, { glow: '#ffe68a' }); }
  } else if (Z.theme === 'pier' || Z.theme === 'night') {
    const nt = Z.theme === 'night';
    const chair = dChair(), cooler = dCooler(), rod = dRod(), buoy = dBuoy();
    for (let y = 130; y < WORLD_H - 70; y += 64) { add(rod, 30, y, 0, 8); add(chair, 46, y + 4, 4, 8); add(rod, WORLD_W - 30, y + 30, 0, 8); add(chair, WORLD_W - 46, y + 34, 4, 8); }
    scatter(7, () => cooler, 5, 14); scatter(5, () => buoy, 0, 12);
    if (!nt) { const p1 = dParasol('#e8414f'), p2 = dParasol('#3a78c0'); scatter(6, () => R() < 0.5 ? p1 : p2, 3, 22, { avoidBoss: true }); }
    const lan = nt ? dLantern() : dLamp('#ffe68a'); for (let y = 150; y < WORLD_H - 70; y += nt ? 110 : 160) { add(lan, cx - 40, y, 2, 8, { glow: '#ffcf6a' }); add(lan, cx + 40, y + (nt ? 55 : 0), 2, 8, { glow: '#ffcf6a' }); }
  } else if (Z.theme === 'gate') {
    add(dBooth(), 90, 120, 16, 30); add(dBooth(), WORLD_W - 90, 120, 16, 30); add(dBooth(), 90, 300, 16, 30); add(dBooth(), WORLD_W - 90, 300, 16, 30);
    const st = dStanchion(); for (let y = 180; y < WORLD_H - 80; y += 56) { add(st, cx - 70, y, 4, 4); add(st, cx + 70, y + 28, 4, 4); }
    scatter(6, () => dBin(), 4, 10); const lamp = dLamp('#ffe68a'); for (let y = 200; y < WORLD_H - 70; y += 160) { add(lamp, 26, y, 2, 8, { glow: '#ffe68a' }); add(lamp, WORLD_W - 26, y, 2, 8, { glow: '#ffe68a' }); }
  } else if (Z.theme === 'food') {
    const cols = ['#e8414f', '#d9822b', '#3a78c0', '#7ccf5a']; for (let y = 120; y < WORLD_H - 80; y += 120) { add(dStall(choice(cols)), 60, y, 16, 30); add(dStall(choice(cols)), WORLD_W - 60, y + 60, 16, 30); }
    scatter(9, () => dTable(), 8, 12, { avoidBoss: true }); scatter(5, () => dBin(), 4, 10);
  } else if (Z.theme === 'stand') {
    add(dScore(), cx, 60, 0, 0); const tw = dLightTower(); for (const [x, y] of [[40, 150], [WORLD_W - 40, 150], [40, WORLD_H - 150], [WORLD_W - 40, WORLD_H - 150]]) add(tw, x, y, 4, 8, { glow: '#fff6d0' });
  } else if (Z.theme === 'field') {
    const tw = dLightTower(); for (const [x, y] of [[40, 120], [WORLD_W - 40, 120], [40, WORLD_H - 120], [WORLD_W - 40, WORLD_H - 120]]) add(tw, x, y, 4, 8, { glow: '#fff6d0' });
    const b = dBase(), dy = WORLD_H * 0.55; for (const [x, y] of [[cx + 110, dy], [cx, dy - 110], [cx - 110, dy], [cx, dy + 110]]) add(b, x, y + 5, 0, 0);
  } else if (Z.theme === 'rock') {
    scatter(5, () => dChair(), 3, 12, { avoidBoss: true, noSolid: true }); scatter(5, () => dCooler(), 4, 12, { avoidBoss: true, noSolid: true });
    const lan = dLantern(); for (let y = 160; y < WORLD_H - 70; y += 140) { add(lan, cx - 44, y, 2, 8, { glow: '#ffcf6a' }); add(lan, cx + 44, y + 70, 2, 8, { glow: '#ffcf6a' }); }
  } else {
    const houses = [['#ffe3c8', '#c0543c'], ['#d8ecff', '#4a6aa8'], ['#ffd6e6', '#8a4a6a'], ['#e8f6d8', '#6a8a3a'], ['#fff2c0', '#a8603a']];
    let hi = 0;
    for (let y = 140; y < WORLD_H - 80; y += 120) { const [w1, r1] = houses[hi++ % houses.length]; add(dHouse(w1, r1), 64, y, 14, 30); const [w2, r2] = houses[hi++ % houses.length]; add(dHouse(w2, r2), WORLD_W - 64, y + 50, 14, 30); }
    const lamp = dLamp('#ffd27a');
    for (let y = 110; y < WORLD_H - 70; y += 84) { add(lamp, cx - 34, y, 2, 8, { glow: '#ffd27a' }); add(lamp, cx + 34, y, 2, 8, { glow: '#ffd27a' }); }
    const pil = dPillar();
    for (const ry of [250, 520]) { const rail = { y: ry - 46, x0: 30, x1: WORLD_W - 30 }; W.rails.push(rail); for (let x = 60; x < WORLD_W - 40; x += 80) { if (Math.abs(x - cx) < 40) continue; add(pil, x, ry, 3, 8); } }
    const t = dTree('#e0913a', '#ffc06a', '#a8602a'); scatter(8, () => t, 6, 16, { avoidBoss: true });
  }
  W.ground = gc;
  return W;
}
