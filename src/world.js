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
  cobble: { bg: '#2a2a36', hedge: ['#36603a', '#4f7f4a', '#22402a'], tint: [30, 8, 70, 0.34], glow: 0.32 }
};

function buildWorld(zi) {
  const Z = ZONES[zi], th = THEME[Z.theme]; const R = mulberry(911 + zi * 131);
  const rr = (a, b) => a + R() * (b - a);
  const W = { W: WORLD_W, H: WORLD_H, decor: [], solids: [], start: { x: WORLD_W / 2, y: WORLD_H - 76 }, gate: { x: WORLD_W / 2, y: 62 }, theme: Z.theme, bg: th.bg, tint: th.tint, glowA: th.glow, fountain: null, rails: [], gateClosed: dGate(false), gateOpen: dGate(true) };
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
  } else {
    g.fillStyle = '#6e6878'; g.fillRect(0, 0, WORLD_W, WORLD_H);
    for (let y = 0; y < WORLD_H; y += 7) { const off = (y / 7) % 2 ? 5 : 0; for (let x = -off; x < WORLD_W; x += 10) { const onPath = Math.abs(x + 5 - cx) < 26; g.fillStyle = onPath ? choice(['#b8b0bf', '#b0a8b8', '#bcb4c4']) : choice(['#958ea0', '#8c8598', '#9a93a6']); g.fillRect(x + 1, y + 1, 8, 5); g.fillStyle = onPath ? '#cfc8d6' : '#a8a2b4'; g.fillRect(x + 2, y + 1, 5, 1); } }
  }

  // ---- hedge border ----
  const [h1, h2, h3] = th.hedge;
  const hedgeAt = (x, y) => { pCirc(g, x, y, 8, h3); pCirc(g, x, y - 1, 7, h1); pCirc(g, x - 2, y - 3, 3, h2); };
  for (let x = 0; x <= WORLD_W; x += 10) { if (Math.abs(x - cx) > 34) hedgeAt(x, 10); hedgeAt(x, WORLD_H - 3); }
  for (let y = 0; y <= WORLD_H; y += 10) { hedgeAt(4, y); hedgeAt(WORLD_W - 4, y); }

  // ---- decor ----
  const avoid = [{ x: cx, y: W.start.y, r: 46 }, { x: cx, y: W.gate.y, r: 52 }];
  const free = (x, y, r) => { for (const a of avoid) if (Math.hypot(x - a.x, y - a.y) < a.r + r) return false; for (const d of W.decor) if (Math.hypot(x - d.x, (y - d.y) * 1.4) < r + (d.space || 10)) return false; return true; };
  const add = (img, x, y, r, space, extra) => { const d = Object.assign({ img, x: Math.round(x), y: Math.round(y), r, space: space || 12 }, extra || {}); W.decor.push(d); if (r) W.solids.push({ x: d.x, y: d.y - 2, r }); return d; };
  const scatter = (n, mk, r, space, opt) => { opt = opt || {}; for (let i = 0; i < n; i++) { for (let k = 0; k < 40; k++) { const x = rr(28, WORLD_W - 28), y = rr(opt.ymin || 90, opt.ymax || WORLD_H - 40); if (Math.abs(x - pathX(y)) < (opt.pathGap || 42)) continue; if (W.fountain && Math.hypot(x - W.fountain.x, y - W.fountain.y) < 52) continue; if (opt.avoidBoss && Math.hypot(x - cx, y - 300) < 80) continue; if (!free(x, y, space)) continue; add(mk(), x, y, r, space); break; } } };

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
