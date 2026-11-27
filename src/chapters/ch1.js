// ===================== 1장 · 에버랜드 대탈출 =====================
// 장 하나에 필요한 것(스테이지·몬스터·보스 패턴·스테이지 배경·컷신·다시보기 목록)을 이 파일에 모으고 맨 아래 regChapter 로 등록한다.
// 1장 업적(c1·c5·c10)은 기본 업적 목록(achv.js)에 그대로 있음 (칭호 목록 순서 유지)

// ---------- 컷신 ----------
const INTRO = [
  { scene: 'park', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -140, pose: 'walk', dir: 'right' }, bori: { x: -122, pose: 'run', face: 1, y: 2 }, leash: true, dark: 0 }); },
    update(A, dt, t) { A.hee.x = Math.min(-14, -140 + t * 50); if (A.bori.pose === 'run') A.bori.x = A.hee.x + 18; if (A.hee.x >= -14 && A.hee.pose === 'walk') { A.hee.pose = 'idle'; A.hee.dir = 'down'; A.bori.pose = 'sit'; A.bori.pant = true; } },
    delay: 2.4, lines: [
      { who: 'sys', text: '어느 화창한 주말 오후.' },
      { who: 'sys', text: '희수는 강아지 보리와 함께 에버랜드에 놀러 왔다.' },
      { who: 'hee', text: '보리야~ 오늘 사진 백 장 찍자!' },
      { who: 'bori', text: '멍! 멍!' }] },
  { init(A) { A.hee.pose = 'phone'; }, delay: 0.5, lines: [{ who: 'heePh', text: '잠깐만 보리야~ 인스타에 올리고...\n#에버랜드 #보리 #행복 #주말' }] },
  { init(A) { A.balloon = { x: -90, y: -34 }; },
    update(A, dt, t) { A.balloon.x += dt * 38; A.balloon.y = -34 + Math.sin(t * 3) * 4 - t * 4; if (t > 0.9) { A.leash = false; A.bori.pose = 'run'; A.bori.pant = false; A.bori.face = 1; A.bori.x += dt * (80 + t * 30); } if (t > 1.1 && !A.bk) { A.bk = 1; sfx('bark'); } }, dur: 3.0 },
  { init(A) { A.bori.x = 999; A.balloon = null; }, delay: 0.3, lines: [
      { who: 'sys', text: '...희수가 폰을 보는 사이, 보리가 사라졌다!' },
      { who: 'hee', text: '...응? 보리야?', do() { A_().hee.pose = 'idle'; A_().hee.alert = true; } },
      { who: 'hee', text: '보리야아아아아!!!!', do() { A_().hee.shake = true; } }] },
  { bgm: 'dark', init(A) { A.hee.alert = false; A.hee.shake = false; A.mons = []; },
    update(A, dt, t) {
      A.dark = Math.min(1, t / 1.8);
      if (t > 0.6 && !A.th1) { A.th1 = 1; CUT.light = 1; sfx('thunder'); }
      if (t > 1.9 && !A.th2) { A.th2 = 1; CUT.light = 1; sfx('thunder'); const T = G.time; A.mons = [['slime', -78, 8], ['balloon', 52, -26], ['slime', 74, 12], ['balloon', -56, -34], ['slime', 34, 16], ['balloon', 0, -48]].map((m, i) => ({ type: m[0], x: m[1], y: m[2], t0: T + i * 0.15 })); }
      if (t > 2.0 && t < 2.9 && Math.random() < dt * 4) sfx('pop');
    }, dur: 3.2 },
  { delay: 0, lines: [
      { who: 'sys', text: '그 순간, 하늘이 보랏빛으로 물들더니...' },
      { who: 'sys', text: '놀이공원 곳곳에서 몬스터들이 쏟아져 나왔다!' },
      { who: 'mon', text: '뿌루루룽~ 끼에에에엑!!' },
      { who: 'hee', text: '꺄악! 이게 다 뭐야?!', do() { A_().hee.alert = true; } }] },
  { scene: 'gate', init(A) { A.mons = []; A.hee.x = -40; A.hee.dir = 'right'; A.hee.pose = 'idle'; A.hee.alert = false; A.dark = 1; A.sign = true; }, delay: 0.6, lines: [
      { who: 'hee', text: '출구가... 막혔잖아?!' },
      { who: 'sys', text: '출구는 몬스터들에게 봉쇄됐다.\n구역마다 있는 보스를 쓰러뜨려야 길이 열릴 것 같다.' },
      { who: 'hee', text: '무기도 없고... 가방엔 폰밖에 없는데...', do() { A_().hee.dir = 'down'; } },
      { who: 'hee', text: '좋아. 맨주먹으로라도 보리 찾아서\n여기서 탈출한다!!', do() { A_().hee.fist = true; sfx('smash'); } }] },
  { scene: 'stars', init(A) { A.hee = null; A.sign = false; A.dark = 0; $('#mission').hidden = false; $('#skip').hidden = true; }, dur: 3.6 }
];

const ENDING = [
  { scene: 'escape', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -150, pose: 'walk', dir: 'right' }, bori: { x: -132, pose: 'run', face: 1, y: 2 } }); },
    update(A, dt, t) { A.hee.x = Math.min(10, -150 + t * 52); if (A.bori.pose === 'run') A.bori.x = A.hee.x + 18; if (A.hee.x >= 10 && A.hee.pose === 'walk') { A.hee.pose = 'idle'; A.hee.dir = 'down'; A.bori.pose = 'sit'; A.bori.pant = true; } },
    delay: 2.2, lines: [
      { who: 'sys', text: '퍼레이드 대왕이 쓰러지자, 하늘이 다시 맑아졌다.' },
      { who: 'sys', text: '희수와 보리는 마침내 에버랜드를 탈출했다!' },
      { who: 'hee', text: '보리야, 집에 가자!\n오빠가 엄청 걱정하고 있을 거야ㅠㅠ' },
      { who: 'bori', text: '멍멍!' }] },
  { scene: 'home', bgm: 'home',
    init(A) { clearA(A); Object.assign(A, { hus: { x: 30 }, hee: { x: -86, pose: 'walk', dir: 'right' }, bori: { x: -102, pose: 'run', face: 1, y: 3 }, door: true }); },
    update(A, dt, t) { A.hee.x = Math.min(-22, -86 + t * 44); A.bori.x = Math.min(-40, A.hee.x - 16); if (A.hee.x >= -22 && A.hee.pose === 'walk') { A.hee.pose = 'idle'; A.bori.pose = 'sit'; A.door = false; } },
    delay: 1.8, lines: [
      { who: 'hee', text: '오빠!!! 나 살아왔어!!!' },
      { who: 'hee', text: '에버랜드에 몬스터가 막 쏟아져 나오고,\n보리도 잃어버리고, 나 진짜 죽을 뻔했...' },
      { who: 'hus', text: '오 왔어? 같이 낚시터 가자!', do() { A_().hus.rodUp = true; A_().sparkle = true; sfx('ding'); } },
      { who: 'hus', text: '자기 오면 바로 출발하려고\n채비 다 해놨지~ 오늘 물때 좋대!' },
      { who: 'hee', text: '..........', do() { A_().hee.sweat = true; } },
      { who: 'hee', text: '......지금 낚시터라고 했어?' },
      { who: 'sys', text: '희수의 멘헤라 게이지가 차오르기 시작했다...', do() { A_().aura = true; sfx('ult'); } },
      { who: 'bori', text: '멍! 멍멍! (낚시터 신난다!)', do() { A_().bori.jump = true; sfx('bark'); } }] },
  { dur: 1.0 }
];

// ---------- 스테이지 소품 ----------
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

// ---------- 스테이지 바닥·소품 배치 ----------
function groundPlaza(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  const tones = ['#ead9b6', '#e5d2ad', '#efdfbf'];
  for (let y = 0; y < WORLD_H; y += 16) for (let x = 0; x < WORLD_W; x += 16) { g.fillStyle = tones[Math.floor(R() * 3)]; g.fillRect(x, y, 16, 16); g.fillStyle = '#d6c39a'; g.fillRect(x, y, 16, 1); g.fillRect(x, y, 1, 16); }
  for (let y = 0; y < WORLD_H; y += 4) { const off = (y / 4) % 2 ? 4 : 0; for (let x = cx - 26 + off; x < cx + 26; x += 8) { g.fillStyle = R() < 0.5 ? '#d98b6a' : '#cf7f60'; g.fillRect(x, y, 7, 3); } }
  g.fillStyle = '#b8694e'; g.fillRect(cx - 27, 0, 2, WORLD_H); g.fillRect(cx + 26, 0, 2, WORLD_H);
  const fy = 430; W.fountain = { x: cx, y: fy };
  pCirc(g, cx, fy, 38, '#e9d7b4'); pCirc(g, cx, fy, 31, '#8a8378'); pCirc(g, cx, fy, 30, '#d8d0c4'); pCirc(g, cx, fy, 26, '#8a8378'); pCirc(g, cx, fy, 25, '#5fb0ea'); pCirc(g, cx, fy, 20, '#7ec8ff'); pRing(g, cx, fy, 14, '#b8e6ff', 3); pCirc(g, cx, fy, 6, '#8a8378'); pCirc(g, cx, fy, 5, '#e8e2d6'); pCirc(g, cx, fy - 1, 2, '#ffffff');
  W.solids.push({ x: cx, y: fy, r: 29 });
  for (let i = 0; i < 12; i++) { let x, y; for (let k = 0; k < 20; k++) { x = rr(50, WORLD_W - 50); y = rr(110, WORLD_H - 110); if (Math.abs(x - cx) > 60 && Math.hypot(x - cx, y - fy) > 60) break; } pEll(g, x, y, 12, 6, '#2b6a26'); pEll(g, x, y, 11, 5, '#4f9a3f'); for (let k = 0; k < 14; k++) { g.fillStyle = choice(['#ff7aa8', '#ffd84a', '#ffffff', '#ff9a3c']); g.fillRect(Math.round(x + rr(-9, 9)), Math.round(y + rr(-3, 3)), 1, 1); } }
}
function groundPastel(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  for (let y = 0; y < WORLD_H; y += 16) for (let x = 0; x < WORLD_W; x += 16) { g.fillStyle = ((x + y) / 16) % 2 ? '#f9dceb' : '#ebe0f8'; g.fillRect(x, y, 16, 16); }
  g.fillStyle = '#fff6fb'; g.fillRect(cx - 24, 0, 48, WORLD_H); g.fillStyle = '#ff9fcf'; g.fillRect(cx - 26, 0, 2, WORLD_H); g.fillRect(cx + 24, 0, 2, WORLD_H);
  for (let y = 8; y < WORLD_H; y += 24) { const x = cx - 3; g.fillStyle = '#ffc6e2'; g.fillRect(x, y, 2, 2); g.fillRect(x + 4, y, 2, 2); g.fillRect(x, y + 2, 6, 2); g.fillRect(x + 1, y + 4, 4, 1); g.fillRect(x + 2, y + 5, 2, 1); }
  for (let i = 0; i < 60; i++) { g.fillStyle = choice(['#ffffff', '#ffd84a', '#b8e0ff']); g.fillRect(Math.round(rr(20, WORLD_W - 20)), Math.round(rr(20, WORLD_H - 20)), 1, 1); }
}
function groundGrass(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  g.fillStyle = '#8cc96e'; g.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let i = 0; i < 5000; i++) { g.fillStyle = R() < 0.6 ? '#7ab95e' : '#a3d987'; g.fillRect(Math.floor(R() * WORLD_W), Math.floor(R() * WORLD_H), 1, R() < 0.3 ? 2 : 1); }
  for (let y = 0; y < WORLD_H; y++) { const px = Math.round(pathX(y)); g.fillStyle = '#b99260'; g.fillRect(px - 19, y, 38, 1); g.fillStyle = '#d6b47c'; g.fillRect(px - 17, y, 34, 1); }
  for (let i = 0; i < 700; i++) { const y = Math.floor(R() * WORLD_H); const px = pathX(y); g.fillStyle = R() < 0.5 ? '#c7a26c' : '#e2c48e'; g.fillRect(Math.round(px + rr(-16, 16)), y, 1, 1); }
  for (let i = 0; i < 40; i++) { g.fillStyle = choice(['#ffffff', '#ffd84a', '#ff9fcf']); const x = Math.round(rr(20, WORLD_W - 20)), y = Math.round(rr(20, WORLD_H - 20)); g.fillRect(x, y, 1, 1); g.fillRect(x - 1, y + 1, 3, 1); }
}
function groundCobble(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  g.fillStyle = '#6e6878'; g.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let y = 0; y < WORLD_H; y += 7) { const off = (y / 7) % 2 ? 5 : 0; for (let x = -off; x < WORLD_W; x += 10) { const onPath = Math.abs(x + 5 - cx) < 26; g.fillStyle = onPath ? choice(['#b8b0bf', '#b0a8b8', '#bcb4c4']) : choice(['#958ea0', '#8c8598', '#9a93a6']); g.fillRect(x + 1, y + 1, 8, 5); g.fillStyle = onPath ? '#cfc8d6' : '#a8a2b4'; g.fillRect(x + 2, y + 1, 5, 1); } }
}
function decorPlaza(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  const lamp = dLamp('#ffe68a');
  for (let y = 120; y < WORLD_H - 70; y += 92) { if (Math.abs(y - 430) < 50) continue; add(lamp, cx - 36, y, 2, 8, { glow: '#ffe68a' }); add(lamp, cx + 36, y, 2, 8, { glow: '#ffe68a' }); }
  const t1 = dTree('#6cc04a', '#9be06e', '#3f8a34'), t2 = dTree('#f6a6c8', '#ffd1e3', '#c76a96');
  scatter(16, () => R() < 0.7 ? t1 : t2, 6, 16, { avoidBoss: true });
  const bench = dBench(); scatter(6, () => bench, 0, 12);
  const cart = dBalloonCart(); scatter(4, () => cart, 5, 14);
  W.mainGate = { x: cx, y: WORLD_H + 6 };
}
function decorPastel(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  add(dCarousel(), 150, 470, 27, 40);
  add(dTower('#e6d6f6', '#b45cff'), 430, 210, 8, 16); add(dTower('#ffe0ec', '#ff7ab8'), 470, 560, 8, 16); add(dTower('#e0f0ff', '#6fb8ff'), 90, 180, 8, 16);
  const lamp = dLamp('#ffb3d9');
  for (let y = 130; y < WORLD_H - 70; y += 100) { add(lamp, cx - 34, y, 2, 8, { glow: '#ffb3d9' }); add(lamp, cx + 34, y, 2, 8, { glow: '#ffb3d9' }); }
  const c1 = dCandy('#ff7ab8'), c2 = dCandy('#6fb8ff'), c3 = dCandy('#b45cff');
  scatter(16, () => choice([c1, c2, c3]), 3, 14, { avoidBoss: true });
  const t = dTree('#f6a6c8', '#ffd1e3', '#c76a96'); scatter(8, () => t, 6, 16, { avoidBoss: true });
  const cart = dBalloonCart(); scatter(3, () => cart, 5, 14);
}
function decorGrass(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  const t1 = dTree('#4f9a3f', '#7ccf5a', '#2f6a26'), p1 = dPine('#3f8a34', '#5aa845');
  scatter(22, () => R() < 0.55 ? t1 : p1, 6, 16, { avoidBoss: true });
  const rock = dRock(); scatter(10, () => rock, 5, 12);
  const bush = dBush('#4f9a3f', '#7ccf5a'); scatter(14, () => bush, 0, 10);
  add(dJeep(), 120, 560, 12, 24); add(dJeep(), 440, 250, 12, 24);
}
function decorCobble(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  const houses = [['#ffe3c8', '#c0543c'], ['#d8ecff', '#4a6aa8'], ['#ffd6e6', '#8a4a6a'], ['#e8f6d8', '#6a8a3a'], ['#fff2c0', '#a8603a']];
  let hi = 0;
  for (let y = 140; y < WORLD_H - 80; y += 120) { const [w1, r1] = houses[hi++ % houses.length]; add(dHouse(w1, r1), 64, y, 14, 30); const [w2, r2] = houses[hi++ % houses.length]; add(dHouse(w2, r2), WORLD_W - 64, y + 50, 14, 30); }
  const lamp = dLamp('#ffd27a');
  for (let y = 110; y < WORLD_H - 70; y += 84) { add(lamp, cx - 34, y, 2, 8, { glow: '#ffd27a' }); add(lamp, cx + 34, y, 2, 8, { glow: '#ffd27a' }); }
  const pil = dPillar();
  for (const ry of [250, 520]) { const rail = { y: ry - 46, x0: 30, x1: WORLD_W - 30 }; W.rails.push(rail); for (let x = 60; x < WORLD_W - 40; x += 80) { if (Math.abs(x - cx) < 40) continue; add(pil, x, ry, 3, 8); } }
  const t = dTree('#e0913a', '#ffc06a', '#a8602a'); scatter(8, () => t, 6, 16, { avoidBoss: true });
}

regChapter({
  c: 1, name: '에버랜드', title: '1장 · 에버랜드 대탈출', pick: ['에버랜드', '에버랜드'], lv: 1, baseL: 0,
  zones: [
    { name: '정문 광장',          sub: 'STAGE 1',     quota: 20, max: 9,  spawnInt: 1.4, mons: [['slime', 6], ['balloon', 4]], boss: 'boss1', theme: 'plaza',  next: '매직랜드' },
    { name: '매직랜드',           sub: 'STAGE 2',     quota: 30, max: 10, spawnInt: 1.3, mons: [['horse', 5], ['soldier', 4], ['balloon', 2]], boss: 'boss2', theme: 'pastel', next: '사파리 월드' },
    { name: '사파리 월드',        sub: 'STAGE 3',     quota: 34, max: 11, spawnInt: 1.25, mons: [['raccoon', 5], ['bear', 4]], boss: 'boss3', theme: 'grass',  next: '유러피언 어드벤처' },
    { name: '유러피언 어드벤처',  sub: 'FINAL STAGE', quota: 38, max: 12, spawnInt: 1.2, mons: [['coaster', 5], ['clown', 4], ['bear', 1]], boss: 'boss4', theme: 'cobble', next: '탈출구' },
  ],
  mons: {
    slime:   { name: '솜사탕 슬라임', spr: 'slime',   hp: 45,  atk: 9,  def: 0,  spd: 26, xp: 10, gold: [2, 4],   r: 6, ai: 'hop',    col: '#ffb3d9' },
    balloon: { name: '풍선 유령',     spr: 'balloon', hp: 34,  atk: 11, def: 0,  spd: 30, xp: 11, gold: [2, 5],   r: 5, ai: 'float',  col: '#b45cff', fly: 1 },
    horse:   { name: '폭주 목마',     spr: 'horse',   hp: 200, atk: 22, def: 4,  spd: 34, xp: 26, gold: [6, 10],  r: 7, ai: 'charge', col: '#ffffff' },
    soldier: { name: '츄러스 병정',   spr: 'soldier', hp: 190, atk: 21, def: 5,  spd: 24, xp: 26, gold: [6, 10],  r: 5, ai: 'ranged', proj: 'churro', col: '#e8414f' },
    raccoon: { name: '성난 너구리',   spr: 'raccoon', hp: 420, atk: 38, def: 7,  spd: 44, xp: 50, gold: [12, 20], r: 6, ai: 'chase',  col: '#a0a6b0' },
    bear:    { name: '가출한 곰인형', spr: 'bear',    hp: 650, atk: 44, def: 10, spd: 22, xp: 62, gold: [15, 24], r: 7, ai: 'chase',  col: '#8a5a3a' },
    coaster: { name: '폭주 열차',     spr: 'coaster', hp: 900, atk: 70, def: 12, spd: 38, xp: 90, gold: [22, 34], r: 8, ai: 'charge', col: '#e8414f' },
    clown:   { name: '광대 인형',     spr: 'clown',   hp: 800, atk: 64, def: 10, spd: 30, xp: 88, gold: [22, 34], r: 6, ai: 'ranged', proj: 'confetti', col: '#b45cff' },
    boss1: { name: '왕풍선 유령',   spr: 'balloon', scale: 3, crown: 1, hp: 900,   atk: 16, def: 2,  spd: 22, xp: 200,  gold: [90, 110],  r: 15, ai: 'boss1', boss: 1, col: '#b45cff', fly: 1, drops: ['churros', 'cap_pink', 'toy_melon'] },
    boss2: { name: '폭주 회전컵',   spr: 'teacup',  scale: 2, hp: 3200,  atk: 28, def: 6,  spd: 40, xp: 600,  gold: [250, 300], r: 17, ai: 'boss2', boss: 1, col: '#ffb3d9', drops: ['selfie', 'ugly', 'b_knit'] },
    boss3: { name: '거대 곰인형',   spr: 'bear',    scale: 3, crown: 1, hp: 9000,  atk: 42, def: 12, spd: 20, xp: 1300, gold: [500, 600], r: 19, ai: 'boss3', boss: 1, col: '#8a5a3a', drops: ['handbag', 'coat', 'toy_bone'] },
    boss4: { name: '퍼레이드 대왕', spr: 'clown',   scale: 4, crown: 1, hp: 20000, atk: 70, def: 14, spd: 24, xp: 3000, gold: [0, 0],     r: 21, ai: 'boss4', boss: 1, col: '#b45cff' },
  },
  ai: {
    boss1(e, dt, sp, dP) {
      e.hopY = 6 + Math.sin(e.t * 2) * 3; moveToward(e, G.P.x, G.P.y - 18, sp * (dP > 40 ? 1 : 0.3), dt);
      e.pat = (e.pat == null ? 2 : e.pat) - dt;
      if (e.pat <= 0) {
        const enr = e.hp < e.maxHp * 0.5; e.pat = enr ? 2.6 : 3.6; e.pc = (e.pc || 0) + 1;
        if (e.pc % 2) { const n = enr ? 14 : 10, off = rand(0, 6.28); for (let i = 0; i < n; i++) shootAt(e, 'balloon', off + i / n * 6.283, 58); sfx('pop'); }
        else { for (let i = 0; i < (enr ? 3 : 2); i++) { const a = rand(0, 6.28); spawnEnemy('balloon', e.x + Math.cos(a) * 26, e.y + Math.sin(a) * 16); } bubble(e, '풍선 친구들 나와라~!', 1.4); }
      }
    },
    boss2(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.5, W = G.world; e.stT -= dt;
      if (e.st === 'idle') { e.st = 'roam'; e.stT = 2.2; }
      if (e.st === 'roam') { moveToward(e, G.P.x, G.P.y, sp, dt); if (e.stT <= 0) { e.st = 'tele'; e.stT = 0.8; const a = Math.atan2(G.P.y - e.y, G.P.x - e.x); e.dx = Math.cos(a); e.dy = Math.sin(a); G.fx.push({ k: 'line', x: e.x, y: e.y - 8, a, len: 200, w: e.r * 1.6, t: 0, dur: 0.8 }); bubble(e, '빙글빙글~!', 1); } }
      else if (e.st === 'tele') { if (e.stT <= 0) { e.st = 'dash'; e.stT = 1.1; } }
      else if (e.st === 'dash') { e.x += e.dx * 220 * dt; e.y += e.dy * 220 * dt; if (e.x < 30 || e.x > W.W - 30) e.dx *= -1; if (e.y < (W.top || 34) + 16 || e.y > W.H - 30) e.dy *= -1; if (Math.random() < dt * 30) G.parts.push({ x: e.x + rand(-10, 10), y: e.y, vx: 0, vy: -10, life: 0.4, max: 0.4, col: '#ffd1e6', sz: 2, grav: 0 }); if (e.stT <= 0) { e.st = 'spin'; e.stT = 1.3; e.burst = 0; e.burstT = 0; } }
      else if (e.st === 'spin') { e.burstT -= dt; if (e.burstT <= 0 && e.burst < (enr ? 3 : 2)) { e.burst++; e.burstT = 0.42; const n = 12, off = e.burst * 0.26; for (let i = 0; i < n; i++) shootAt(e, 'tea', off + i / n * 6.283, 78); sfx('pop'); } if (e.stT <= 0) { e.st = 'roam'; e.stT = enr ? 1.5 : 2.3; } }
      e.face = (Math.floor(e.t * (e.st === 'dash' ? 12 : 4)) % 2) ? 1 : -1;
    },
    boss3(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.4;
      if (e.st === 'jump') {
        e.stT -= dt; const p = clamp(1 - e.stT / e.jdur, 0, 1);
        e.hopY = Math.sin(p * Math.PI) * 42; e.x = lerp(e.jx0, e.jx1, p); e.y = lerp(e.jy0, e.jy1, p);
        if (e.stT <= 0) {
          e.hopY = 0; e.st = 'land'; e.stT = 0.6; G.shake = 7; sfx('slam');
          G.fx.push({ k: 'ring', x: e.x, y: e.y - 2, r: e.slamR, col: '#d9a560', t: 0, dur: 0.4 }); burst(e.x, e.y, '#c9b08a', 16, 90);
          if (Math.hypot(G.P.x - e.x, G.P.y - e.y) < e.slamR + 4) hurtPlayer(e.atk * 1.5, e);
          e.jumps = (e.jumps || 0) + 1; if (e.jumps % 3 === 0) { for (let i = 0; i < 2; i++) spawnEnemy('bear', e.x + (i ? 30 : -30), e.y + 10); bubble(e, '친구들아 도와줘!', 1.4); }
        } return;
      }
      if (e.st === 'land') { e.stT -= dt; if (e.stT <= 0) { e.st = 'walk'; e.stT = enr ? 1.6 : 2.6; } return; }
      if (e.st === 'idle') { e.st = 'walk'; e.stT = 2.5; }
      e.stT -= dt; moveToward(e, G.P.x, G.P.y, sp * (enr ? 1.3 : 1), dt);
      if (e.stT <= 0) { e.st = 'jump'; e.jdur = 1.0; e.stT = e.jdur; e.jx0 = e.x; e.jy0 = e.y; e.jx1 = G.P.x; e.jy1 = G.P.y; e.slamR = enr ? 42 : 34; G.fx.push({ k: 'circle', x: G.P.x, y: G.P.y, r: e.slamR, t: 0, dur: e.jdur }); }
    },
    boss4(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.5; e.hopY = Math.abs(Math.sin(e.t * 4)) * 2;
      if (e.st === 'idle') { e.st = 'walk'; e.stT = 2; e.cyc = 0; }
      e.stT -= dt;
      if (e.st === 'walk') {
        moveToward(e, G.P.x, G.P.y - 10, sp, dt);
        if (e.stT <= 0) {
          e.cyc++; const pat = ['spiral', 'burst', 'summon', 'spiral', 'march'][e.cyc % 5];
          e.st = pat; e.stT = { spiral: 3.2, burst: 1.9, summon: 1.0, march: 1.6 }[pat]; e.shT = 0; e.sa = rand(0, 6.28);
          if (pat === 'summon') { spawnEnemy('clown', e.x - 30, e.y + 8); spawnEnemy('clown', e.x + 30, e.y + 8); if (enr) spawnEnemy('coaster', e.x, e.y + 26); bubble(e, '퍼레이드를 시작하지!', 1.5); }
          if (pat === 'march') { bubble(e, '행진하라!!', 1.2); for (const k of [-1, 0, 1]) { const ly = clamp(G.P.y - 8 + k * 34, 50, G.world.H - 30); G.fx.push({ k: 'line', x: 22, y: ly, a: 0, len: G.world.W - 44, w: 12, t: 0, dur: 0.95, onEnd: () => { for (let x = 30; x < G.world.W - 30; x += 12) G.parts.push({ x, y: ly, vx: rand(-20, 20), vy: rand(-40, -10), life: 0.5, max: 0.5, col: choice(['#ff7ab8', '#ffd84a', '#6fb8ff', '#b45cff']), sz: 2, grav: 80 }); if (Math.abs(G.P.y - 8 - ly) < 10) hurtPlayer(e.atk * 1.3, null); sfx('slam'); } }); } }
        } return;
      }
      if (e.st === 'spiral') { e.shT -= dt; if (e.shT <= 0) { e.shT = enr ? 0.085 : 0.115; e.sa += 0.38; shootAt(e, 'note', e.sa, 68); if (enr) shootAt(e, 'note', e.sa + Math.PI, 68); } }
      if (e.st === 'burst') { e.shT -= dt; if (e.shT <= 0) { e.shT = 0.6; const n = enr ? 18 : 14, off = rand(0, 1); for (let i = 0; i < n; i++) shootAt(e, 'confetti', off + i / n * 6.283, 80); sfx('pop'); } }
      if (e.stT <= 0) { e.st = 'walk'; e.stT = enr ? 1.2 : 2.0; }
    }
  },
  themes: {
    plaza: { bg: '#3f8a34', hedge: ['#3f8a34', '#5aa845', '#2b6a26'], tint: [70, 20, 110, 0.10], glow: 0.14, ground: groundPlaza, decor: decorPlaza },
    pastel: { bg: '#3f8a34', hedge: ['#4c9a52', '#79c78a', '#2f6a3a'], tint: [90, 20, 120, 0.14], glow: 0.07, ground: groundPastel, decor: decorPastel },
    grass: { bg: '#2f6a26', hedge: ['#2f7a2a', '#4f9a3f', '#1f5a1c'], tint: [40, 20, 90, 0.16], glow: 0.2, winding: 1, ground: groundGrass, decor: decorGrass },
    cobble: { bg: '#2a2a36', hedge: ['#36603a', '#4f7f4a', '#22402a'], tint: [30, 8, 70, 0.34], glow: 0.32, ground: groundCobble, decor: decorCobble },
  },
  story: { prologue: ['프롤로그 · 에버랜드 가는 날', INTRO], stages: {}, ending: ['엔딩 · 대탈출 성공', ENDING] }
});
