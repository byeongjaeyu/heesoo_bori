// ===================== 2장 컷신: 유료 바다낚시터 대소동 =====================
// 실제 있었던 일 4가지: 「밥하러 온 거지?」(낮) · 「장비만 좋았다면… → 당장 다 팔아」(해 질 녘) · 「잠만 잘 거면 오지 마」(밤) · 「연장할까..?」(엔딩)
// 이 파일 = 2장 전부 (컷신·스테이지·몬스터·보스 패턴·낚시 장비·업적), 맨 아래 regChapter 로 등록

import { choice, clamp, ctx, lerp, mkCanvas, pCirc, pEll, pRect, rand, sfx, shadeHex } from '../engine.js';
import { regChapter } from '../chapter.js';
import { OK, WORLD_H, WORLD_W, dLamp } from '../world.js';
import { G, aimDash, bubble, burst, dashStep, hurtPlayer, moveToward, shootAt, spawnEnemy } from '../game.js';
import { CUTK, cloud, fr, pc, skyBands } from '../render.js';
import { A_, clearA } from '../story.js';

function drawSeaCut(SW, SH, mid, gy, T, mode) {
  const night = mode === 'seaN' || mode === 'rocks', sunset = mode === 'seaS';
  skyBands(SW, gy - 24, night ? '#0a1030' : sunset ? '#6a3a9a' : '#6fb8ff', night ? '#2a3a6a' : sunset ? '#ffb07a' : '#d6f0ff');
  if (night) { for (let i = 0; i < 50; i++) { const x = (i * 97.3) % SW, y = (i * 41.7) % (gy - 30); if ((Math.floor(T * 2 + i) % 6) !== 0) fr(x, y, 1, 1, '#ffffff'); } pc(mid + 50, 26, 9, '#fff6d0'); pc(mid + 53, 24, 8, mode === 'rocks' ? '#3a4a7a' : '#0a1030'); }
  else if (sunset) { pc(mid - 50, gy - 30, 14, '#ffe070'); } else { pc(mid + 60, 24, 10, '#fff6b0'); for (let i = 0; i < 3; i++) cloud(((i * 113 + T * 4) % (SW + 60)) - 30, 16 + i * 10, '#ffffff'); }
  // 바다
  const sea = night ? ['#0c2244', '#2a4c80'] : sunset ? ['#5a4a9a', '#ffb88a'] : ['#2f7fc0', '#9fd8ff'];
  fr(0, gy - 24, SW, 24, sea[0]); for (let i = 0; i < 40; i++) { const x = ((i * 53 + T * 10) % (SW + 10)) - 5, y = gy - 22 + (i * 7) % 20; fr(x, y, 4, 1, sea[1]); }
  if (mode === 'lot') {
    fr(0, gy - 4, SW, SH - gy + 4, '#4a4a54'); for (let x = 10; x < SW; x += 34) fr(x, gy + 6, 2, 22, '#e8e8ee'); fr(0, gy + 4, SW, 1, '#e8e8ee');
    const car = dCar('#3a78c0'); ctx.drawImage(car, Math.round(mid - 70 * CUTK - 15), gy - 14);
    const shop = dBaitShop(); ctx.drawImage(shop, Math.round(mid + 80 * CUTK - 20), gy - 30);
  } else if (mode === 'rocks') {
    // 대물탕: 콘크리트 데크 + 앞쪽 수조 테두리
    fr(0, gy - 4, SW, SH - gy + 4, '#5a606c'); for (let x = 0; x < SW; x += 30) fr(x, gy - 4, 1, SH - gy + 4, '#4a505c'); fr(0, gy + 14, SW, 1, '#4a505c');
    fr(0, gy - 6, SW, 3, '#c0c6d0'); fr(0, gy - 3, SW, 1, '#2b1b24');
    for (const lx of [mid - 90, mid + 95]) { ctx.globalCompositeOperation = 'lighter'; pc(lx, gy - 22, 14, 'rgba(255,200,90,0.25)'); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(dLantern(), lx - 4, gy - 26); }
  } else {
    fr(0, gy - 4, SW, SH - gy + 4, night ? '#4e3c28' : '#c49460'); for (let y = gy; y < SH; y += 6) fr(0, y, SW, 1, night ? '#2e2418' : '#8a6440');
    fr(0, gy - 10, SW, 2, '#2b1b24'); for (let x = 4; x < SW; x += 16) fr(x, gy - 10, 2, 8, '#2b1b24');
    if (night) for (const lx of [mid - 90, mid + 95]) { ctx.globalCompositeOperation = 'lighter'; pc(lx, gy - 22, 14, 'rgba(255,200,90,0.25)'); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(dLantern(), lx - 4, gy - 26); }
  }
}
/** 2장 소품: 라면 냄비, 오빠 잠(Zz), 끌려가기 */
function drawSeaActors(A, mid, gy, T) {
  if (A.pot && A.hee) { const x = Math.round(mid + A.hee.x * CUTK - 18), y = gy - 2; fr(x - 6, y - 6, 12, 7, '#2b1b24'); fr(x - 5, y - 5, 10, 5, '#c0c6d0'); fr(x - 8, y - 5, 2, 1, '#2b1b24'); fr(x + 6, y - 5, 2, 1, '#2b1b24'); fr(x - 4, y, 8, 2, '#3a78c0'); for (let i = 0; i < 3; i++) { const p = (T * 0.8 + i / 3) % 1; ctx.globalAlpha = 1 - p; fr(x - 3 + i * 3 + Math.round(Math.sin(p * 6) * 1.5), y - 8 - p * 12, 1, 2, '#ffffff'); } ctx.globalAlpha = 1; }
  if (A.hus && A.hus.zz) { const hx = mid + A.hus.x * CUTK; for (let i = 0; i < 3; i++) { const p = (T * 0.6 + i / 3) % 1; ctx.globalAlpha = 1 - p; const x = Math.round(hx + 8 + p * 10), y = Math.round(gy - 26 - p * 16); fr(x, y, 4, 1, '#ffffff'); fr(x + 2, y + 1, 1, 1, '#ffffff'); fr(x + 1, y + 2, 1, 1, '#ffffff'); fr(x, y + 3, 4, 1, '#ffffff'); } ctx.globalAlpha = 1; }
  if (A.splash) { const x = mid + A.splash * CUTK; for (let i = 0; i < 8; i++) { const a = T * 6 + i; fr(x + Math.cos(a) * 8, gy - 20 + Math.sin(a * 1.3) * 4 - Math.abs(Math.sin(T * 8 + i)) * 6, 2, 2, '#d6f0ff'); } }
}
const CH2_PROLOGUE = [
  { scene: 'lot', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -24, pose: 'idle', dir: 'down' }, bori: { x: -6, pose: 'sit', face: 1, y: 2 }, hus: { x: 34 } }); },
    update(A, dt) { if (A.hus && A.hus.run) A.hus.x += dt * 110; },
    delay: 0.8, lines: [
      { who: 'sys', text: '그렇게 희수는 오빠 차에 실려…\n유료 바다낚시터에 도착했다.' },
      { who: 'hus', text: '여기 참돔이랑 대물 우럭 나온대!\n12시간권 끊었어~', do() { A_().hus.rodUp = true; sfx('ding'); } },
      { who: 'hee', text: '…12시간?', do() { A_().hee.sweat = true; } },
      { who: 'sys', text: '그때, 미끼통이 덜컹거리더니…\n지렁이와 생새우가 기어 나왔다!', do() { const t = G.time; A_().mons = [{ type: 'worm', x: -70, y: 10, t0: t }, { type: 'shrimp', x: 76, y: 8, t0: t + 0.3 }, { type: 'mosquito', x: 14, y: -34, t0: t + 0.6 }]; A_().hee.sweat = false; A_().hee.alert = true; sfx('pop'); } },
      { who: 'mon', text: '꿈틀꿈틀~ 윙윙윙!!' },
      { who: 'hus', text: '자기야 미끼 좀 잡아줘~\n나 자리 맡으러 간다!', do() { A_().hus.rodUp = false; A_().hus.run = true; } },
      { who: 'hee', text: '…진짜 이 남자가.', do() { A_().hee.alert = false; A_().aura = true; sfx('ult'); } }] },
  { dur: 0.4 }
];
const CH2_DAY = [
  { scene: 'sea', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -34, pose: 'idle', dir: 'down' }, bori: { x: -60, pose: 'sit', face: 1, y: 2 }, hus: { x: 40 }, pot: true }); },
    delay: 0.6, lines: [
      { who: 'sys', text: '오빠는 자리를 잡자마자 낚싯대만 바라봤다.\n희수는 버너에 라면을 끓이는 중…' },
      { who: 'hee', text: '난 밥하러 온 거지?', do() { A_().hee.sweat = true; } },
      { who: 'hee', text: '오빤 진짜 낚시터 오면\n나한테 관심이 하나도 없네.' },
      { who: 'hus', text: '…오 입질! 입질 왔다!!', do() { A_().hus.rodUp = true; sfx('ding'); } },
      { who: 'sys', text: '그 순간, 바다에서 참돔과 줄돔이 튀어 올랐다!', do() { const t = G.time; A_().mons = [{ type: 'bream', x: 80, y: -6, t0: t }, { type: 'stripe', x: -4, y: 10, t0: t + 0.3 }]; A_().hee.sweat = false; A_().hee.alert = true; sfx('pop'); } },
      { who: 'hee', text: '라면 불잖아!!!', do() { A_().hee.alert = false; A_().aura = true; sfx('ult'); } }] },
  { dur: 0.4 }
];
const CH2_NIGHT = [
  { scene: 'seaS', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -30, pose: 'idle', dir: 'down' }, bori: { x: -52, pose: 'sit', face: 1, y: 2 }, hus: { x: 36 } }); },
    delay: 0.6, lines: [
      { who: 'sys', text: '해가 질 무렵. 오빠의 쿨러는 아직 텅 비어 있었다.' },
      { who: 'hus', text: '아… 장비만 좀 더 좋았다면….' },
      { who: 'hee', text: '뭐?????!!!!!!', do() { A_().hee.shake = true; A_().hee.alert = true; } },
      { who: 'hee', text: '당장 낚시장비 다 팔아.', do() { A_().hee.shake = false; A_().hee.alert = false; A_().aura = true; sfx('ult'); } },
      { who: 'bori', text: '멍…', do() { A_().aura = false; } }] },
  { scene: 'seaN',
    init(A) { Object.assign(A.hus, { zz: true, rodUp: false }); A.aura = false; },
    update(A, dt) { if (A.hus && A.hus.drag) { A.hus.x += dt * 70; A.splash = A.hus.x + 10; if (A.hus.x > 140) A.hus = null; } },
    delay: 0.6, lines: [
      { who: 'sys', text: '밤이 되자, 오빠는 의자에서 코를 골기 시작했다…' },
      { who: 'hus', text: '드르렁… 푸우…' },
      { who: 'hee', text: '오빠 낚시터 와서 잠만 잘 거면\n앞으로 오지 마. 돈 아까워.' },
      { who: 'sys', text: '그 순간— 오빠의 낚싯대가 활처럼 휘었다!', do() { A_().hus.zz = false; A_().hus.rodUp = true; G.shake = 4; sfx('slam'); } },
      { who: 'hus', text: '어어어?! 으아아아아!!', do() { A_().hus.drag = true; } },
      { who: 'hee', text: '오빠아아아!!!', do() { A_().hee.alert = true; A_().hee.shake = true; } },
      { who: 'hee', text: '…랜턴 어딨어. 구하러 간다.', do() { A_().hee.alert = false; A_().hee.shake = false; A_().hee.fist = true; sfx('smash'); } }] },
  { dur: 0.4 }
];
const CH2_ENDING = [
  { scene: 'rocks', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -26, pose: 'idle', dir: 'down' }, bori: { x: -48, pose: 'sit', face: 1, y: 2 }, hus: { x: 30 } }); },
    delay: 0.8, lines: [
      { who: 'sys', text: '대왕자바리가 쓰러지자, 바다가 잔잔해졌다.\n흠뻑 젖은 오빠가 기어 올라왔다.' },
      { who: 'hus', text: '자기야… 고마워.\n진짜 죽는 줄 알았어….' },
      { who: 'hee', text: '다음부턴 조심 좀 해!' },
      { who: 'hus', text: '근데… 시간 거의 다 됐는데 많이 못 잡았네…\n낚시터 연장할까..?', do() { A_().hus.rodUp = true; } },
      { who: 'hee', text: '뭐?????!!!!!!!!!!\n12시간을 해놓고?????', do() { A_().hee.shake = true; A_().hee.alert = true; } },
      { who: 'sys', text: '희수의 멘헤라 게이지가 한계를 넘었다…', do() { A_().hee.shake = false; A_().hee.alert = false; A_().aura = true; sfx('ult'); } },
      { who: 'hus', text: '…다음 데이트는 자기 마음대로 해.', do() { A_().hus.rodUp = false; } },
      { who: 'hee', text: '진짜지? 그럼 다음엔…!!', do() { A_().aura = false; A_().sparkle = true; sfx('ding'); } },
      { who: 'bori', text: '멍멍!', do() { A_().bori.jump = true; sfx('bark'); } }] },
  { dur: 1.0 }
];


// ---------- 스테이지 소품 ----------
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

// ---------- 스테이지 바닥·소품 배치 ----------
function groundLot(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  // 주차장: 아스팔트 + 주차선, 위쪽은 바다로 이어지는 낚시터 입구
  g.fillStyle = '#4a4a54'; g.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let i = 0; i < 6000; i++) { g.fillStyle = R() < 0.5 ? '#43434c' : '#55555f'; g.fillRect(Math.floor(R() * WORLD_W), Math.floor(R() * WORLD_H), 1, 1); }
  g.fillStyle = '#f0d040'; for (let y = 0; y < WORLD_H; y += 22) g.fillRect(cx - 1, y, 2, 12);
  g.fillStyle = '#e8e8ee'; for (const side of [-1, 1]) for (let y = 120; y < WORLD_H - 60; y += 46) { const x0 = side < 0 ? 40 : cx + 60; g.fillRect(x0, y, cx - 100, 2); for (let x = x0; x <= x0 + cx - 100; x += 46) g.fillRect(x, y, 2, 40); }
}
function groundPier(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  // 좌대: 나무 데크 (밤에는 어둡게)
  const nt = Z.theme === 'night', tones = nt ? ['#5a4630', '#4e3c28', '#64503a'] : ['#c49460', '#b98a56', '#cc9e6a'];
  for (let y = 0; y < WORLD_H; y += 8) { let x = -Math.floor(R() * 40); while (x < WORLD_W) { const w = 30 + Math.floor(R() * 50); g.fillStyle = choice(tones); g.fillRect(x, y, w, 7); g.fillStyle = nt ? '#2e2418' : '#8a6440'; g.fillRect(x + w - 1, y, 1, 7); x += w; } g.fillStyle = nt ? '#241a12' : '#7a5434'; g.fillRect(0, y + 7, WORLD_W, 1); }
  for (let i = 0; i < 160; i++) { g.fillStyle = nt ? '#3a2c1e' : '#9a7048'; g.fillRect(Math.floor(R() * WORLD_W), Math.floor(R() * WORLD_H), 2, 1); }
  // 데크 가운데 낚시 구멍(바다가 보이는 칸)
  for (const [hx, hy] of [[150, 300], [410, 420], [140, 560], [420, 190]]) { pRect(g, hx - 22, hy - 12, 44, 24, '#2b1b24'); pRect(g, hx - 20, hy - 10, 40, 20, nt ? '#0c2a4a' : '#2f7fc0'); for (let k = 0; k < 6; k++) pRect(g, hx - 16 + k * 6, hy - 4 + (k % 2) * 6, 4, 1, nt ? '#3a6aa0' : '#9fd8ff'); W.solids.push({ x: hx, y: hy, r: 14 }); }
}
function groundRock(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
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
}
function decorLot(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  const cols = ['#e8414f', '#f7f3ea', '#3a78c0', '#2b2b34', '#b9c0cc', '#7ccf5a'];
  for (const side of [-1, 1]) for (let y = 160; y < WORLD_H - 60; y += 46) { if (R() < 0.35) continue; const x = side < 0 ? rr(60, cx - 90) : rr(cx + 90, WORLD_W - 60); add(dCar(choice(cols)), x, y, 12, 18); }
  const cone = dCone(); for (let y = 140; y < WORLD_H - 80; y += 70) { add(cone, cx - 30, y, 2, 6); add(cone, cx + 30, y + 35, 2, 6); }
  add(dBaitShop(), 90, 110, 16, 30); add(dBaitShop(), WORLD_W - 90, 110, 16, 30);
  const lamp = dLamp('#ffe68a'); for (let y = 200; y < WORLD_H - 70; y += 150) { add(lamp, 30, y, 2, 8, { glow: '#ffe68a' }); add(lamp, WORLD_W - 30, y, 2, 8, { glow: '#ffe68a' }); }
}
function decorPier(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  const nt = Z.theme === 'night';
  const chair = dChair(), cooler = dCooler(), rod = dRod(), buoy = dBuoy();
  for (let y = 130; y < WORLD_H - 70; y += 64) { add(rod, 30, y, 0, 8); add(chair, 46, y + 4, 4, 8); add(rod, WORLD_W - 30, y + 30, 0, 8); add(chair, WORLD_W - 46, y + 34, 4, 8); }
  scatter(7, () => cooler, 5, 14); scatter(5, () => buoy, 0, 12);
  if (!nt) { const p1 = dParasol('#e8414f'), p2 = dParasol('#3a78c0'); scatter(6, () => R() < 0.5 ? p1 : p2, 3, 22, { avoidBoss: true }); }
  const lan = nt ? dLantern() : dLamp('#ffe68a'); for (let y = 150; y < WORLD_H - 70; y += nt ? 110 : 160) { add(lan, cx - 40, y, 2, 8, { glow: '#ffcf6a' }); add(lan, cx + 40, y + (nt ? 55 : 0), 2, 8, { glow: '#ffcf6a' }); }
}
function decorRock(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  scatter(5, () => dChair(), 3, 12, { avoidBoss: true, noSolid: true }); scatter(5, () => dCooler(), 4, 12, { avoidBoss: true, noSolid: true });
  const lan = dLantern(); for (let y = 160; y < WORLD_H - 70; y += 140) { add(lan, cx - 44, y, 2, 8, { glow: '#ffcf6a' }); add(lan, cx + 44, y + 70, 2, 8, { glow: '#ffcf6a' }); }
}

regChapter({
  c: 2, name: '바다낚시터', title: '2장 · 유료 바다낚시터 대소동', pick: ['바다낚시터', '낚시터'], lv: 30, baseL: 9, // 1장 10회차 수준
  zones: [
    { name: '유료낚시터 주차장',  sub: 'STAGE 5', quota: 30, max: 11, spawnInt: 1.25, mons: [['mosquito', 5], ['worm', 4], ['shrimp', 4]], boss: 'truck', theme: 'lot', next: '유료낚시터 (낮)' },
    { name: '유료낚시터 · 낮낚시', sub: 'STAGE 6', quota: 34, max: 11, spawnInt: 1.2, mons: [['bream', 5], ['stripe', 4], ['shrimp', 2]], boss: 'breamking', theme: 'pier', next: '유료낚시터 (밤)' },
    { name: '유료낚시터 · 밤낚시', sub: 'STAGE 7', quota: 36, max: 12, spawnInt: 1.2, mons: [['rockfish', 5], ['bass', 4], ['mosquito', 2]], boss: 'bassgen', theme: 'night', next: '대물탕' },
    { name: '대물탕',             sub: 'FINAL STAGE', quota: 38, max: 12, spawnInt: 1.15, mons: [['rockfish', 4], ['bass', 4], ['bream', 3], ['stripe', 2]], boss: 'grouper', theme: 'rock', next: '' },
  ],
  mons: {
    mosquito: { name: '피에 굶주린 모기떼', spr: 'mosquito', hp: 520,  atk: 58, def: 8,  spd: 46, xp: 70,  gold: [16, 26], r: 5, ai: 'float', col: '#6a6f7c', fly: 1 },
    worm:     { name: '미끼 지렁이',       spr: 'worm',     hp: 900,  atk: 64, def: 12, spd: 22, xp: 84,  gold: [20, 30], r: 6, ai: 'chase', col: '#f28cc0' },
    shrimp:   { name: '미끼 생새우',       spr: 'shrimp',   hp: 760,  atk: 70, def: 10, spd: 30, xp: 84,  gold: [20, 30], r: 6, ai: 'hop',   col: '#b9c0cc' },
    bream:    { name: '팔딱 참돔',         spr: 'bream',    hp: 1150, atk: 78, def: 13, spd: 40, xp: 100, gold: [24, 36], r: 7, ai: 'charge', col: '#ff7b8a' },
    stripe:   { name: '물총 줄돔',         spr: 'stripe',   hp: 1000, atk: 74, def: 12, spd: 28, xp: 100, gold: [24, 36], r: 6, ai: 'ranged', proj: 'water', col: '#f7f3ea' },
    rockfish: { name: '대물 우럭',         spr: 'rockfish', hp: 1700, atk: 86, def: 16, spd: 26, xp: 118, gold: [28, 42], r: 7, ai: 'chase', col: '#8a5a3a' },
    bass:     { name: '대물 농어',         spr: 'bass',     hp: 1350, atk: 92, def: 14, spd: 44, xp: 118, gold: [28, 42], r: 7, ai: 'charge', col: '#b9c0cc' },
    truck:     { name: '주차 빌런 트럭',     spr: 'truck',    scale: 2.5, hp: 24000, atk: 72,  def: 16, spd: 34, xp: 3200, gold: [700, 900],   r: 24, ai: 'truck',  boss: 1, col: '#e8414f', drops: ['net', 'vest'] },
    breamking: { name: '핑크 참돔 왕',       spr: 'bream',    scale: 3.5, crown: 1, hp: 30000, atk: 82,  def: 18, spd: 26, xp: 4200, gold: [900, 1100], r: 22, ai: 'bream',  boss: 1, col: '#ff7b8a', drops: ['bucket', 'b_life'] },
    bassgen:   { name: '대물 농어 장군',     spr: 'bass',     scale: 3.5, crown: 1, hp: 38000, atk: 92,  def: 20, spd: 30, xp: 5200, gold: [1100, 1300], r: 22, ai: 'bassgen', boss: 1, col: '#b9c0cc', drops: ['rainboot', 'tackle'] },
    grouper:   { name: '월척 중국 대왕자바리', spr: 'grouper', scale: 4.5, crown: 1, hp: 52000, atk: 108, def: 22, spd: 22, xp: 9000, gold: [0, 0],       r: 28, ai: 'grouper', boss: 1, col: '#d9822b', drops: ['toy_lure'] },
  },
  ai: {
    // 주차 빌런 트럭: 빵빵 돌진 → 벽에 박으면 경적 충격파(근처 피해), 화나면 모기떼 소환
    truck(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt;
      if (e.st === 'idle') { e.st = 'roam'; e.stT = 1.8; }
      if (e.st === 'roam') { moveToward(e, G.P.x, G.P.y, sp, dt); e.face = G.P.x > e.x ? -1 : 1; if (e.stT <= 0) { e.st = 'tele'; e.stT = enr ? 0.65 : 0.85; aimDash(e, 320, e.r * 1.4, choice(['빵빵!! 비켜!!', '두 칸 내 자리야!', '부릉부릉!!'])); } }
      else if (e.st === 'tele') { if (e.stT <= 0) { e.st = 'dash'; e.stT = 1.6; } }
      else if (e.st === 'dash') { if (dashStep(e, 250, dt) || e.stT <= 0) { e.st = 'honk'; e.stT = 0.7; G.shake = 7; sfx('slam'); G.fx.push({ k: 'ring', x: e.x, y: e.y - 4, r: 72, col: '#ffd84a', t: 0, dur: 0.45 }); if (Math.hypot(G.P.x - e.x, G.P.y - e.y) < 72) hurtPlayer(e.atk * 1.2, e); bubble(e, '빠아아앙!!!', 1); if (enr) for (let i = 0; i < 3; i++) spawnEnemy('mosquito', e.x + rand(-30, 30), e.y + rand(-20, 20)); } }
      else if (e.st === 'honk') { if (e.stT <= 0) { e.st = 'roam'; e.stT = enr ? 1.3 : 2.1; } }
    },
    // 핑크 참돔 왕: 높이 뛰어올라 내려찍기 → 물보라 탄막, 세 번마다 참돔 호출
    bream(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.45;
      if (e.st === 'jump') {
        e.stT -= dt; const p = clamp(1 - e.stT / e.jdur, 0, 1); e.hopY = Math.sin(p * Math.PI) * 48; e.x = lerp(e.jx0, e.jx1, p); e.y = lerp(e.jy0, e.jy1, p);
        if (e.stT <= 0) { e.hopY = 0; e.st = 'land'; e.stT = 0.55; G.shake = 6; sfx('slam'); G.fx.push({ k: 'ring', x: e.x, y: e.y - 2, r: e.slamR, col: '#9fd8ff', t: 0, dur: 0.4 }); burst(e.x, e.y, '#9fd8ff', 18, 90);
          if (Math.hypot(G.P.x - e.x, G.P.y - e.y) < e.slamR + 4) hurtPlayer(e.atk * 1.4, e);
          const n = enr ? 14 : 10, off = rand(0, 6.28); for (let i = 0; i < n; i++) shootAt(e, 'water', off + i / n * 6.283, 70);
          e.jumps = (e.jumps || 0) + 1; if (e.jumps % 3 === 0) { spawnEnemy('bream', e.x - 28, e.y + 8); spawnEnemy('bream', e.x + 28, e.y + 8); bubble(e, '얘들아 팔딱팔딱!', 1.3); } } return;
      }
      if (e.st === 'land') { e.stT -= dt; if (e.stT <= 0) { e.st = 'walk'; e.stT = enr ? 1.4 : 2.3; } return; }
      if (e.st === 'idle') { e.st = 'walk'; e.stT = 2; }
      e.stT -= dt; e.hopY = Math.abs(Math.sin(e.t * 6)) * 3; moveToward(e, G.P.x, G.P.y, sp, dt); e.face = G.P.x > e.x ? -1 : 1;
      if (e.stT <= 0) { e.st = 'jump'; e.jdur = 1.0; e.stT = e.jdur; e.jx0 = e.x; e.jy0 = e.y; e.jx1 = G.P.x; e.jy1 = G.P.y; e.slamR = enr ? 44 : 36; G.fx.push({ k: 'circle', x: G.P.x, y: G.P.y, r: e.slamR, t: 0, dur: e.jdur }); }
    },
    // 대물 농어 장군: 연속 돌진 3번(화나면 4번) → 농어 부하 호출
    bassgen(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt;
      if (e.st === 'idle') { e.st = 'roam'; e.stT = 1.8; }
      if (e.st === 'roam') { moveToward(e, G.P.x, G.P.y, sp, dt); e.face = G.P.x > e.x ? -1 : 1; if (e.stT <= 0) { e.combo = enr ? 4 : 3; e.st = 'tele'; e.stT = 0.7; aimDash(e, 240, e.r * 1.2, '돌격하라!!'); } }
      else if (e.st === 'tele') { if (e.stT <= 0) { e.st = 'dash'; e.stT = 0.75; } }
      else if (e.st === 'dash') { if (dashStep(e, 300, dt) || e.stT <= 0) { e.combo--; G.shake = 3; if (e.combo > 0) { e.st = 'tele'; e.stT = 0.45; aimDash(e, 240, e.r * 1.2); } else { e.st = 'rest'; e.stT = 1.2; spawnEnemy('bass', e.x - 30, e.y); if (enr) spawnEnemy('bass', e.x + 30, e.y); bubble(e, '헉헉… 부하들아!', 1.2); } } }
      else if (e.st === 'rest') { if (e.stT <= 0) { e.st = 'roam'; e.stT = enr ? 1.2 : 2; } }
    },
    // 월척 중국 대왕자바리: 빨아들이기(끌려감) → 크게 깨물기, 물대포 소용돌이, 물고기 호출
    grouper(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt; e.hopY = Math.abs(Math.sin(e.t * 2.5)) * 2;
      if (e.st === 'idle') { e.st = 'walk'; e.stT = 2; e.cyc = 0; }
      if (e.st === 'walk') {
        moveToward(e, G.P.x, G.P.y - 8, sp, dt); e.face = G.P.x > e.x ? -1 : 1;
        if (e.stT <= 0) { e.cyc++; const pat = ['suck', 'spray', 'suck', 'summon', 'spray'][e.cyc % 5]; e.st = pat; e.shT = 0; e.sa = rand(0, 6.28);
          e.stT = { suck: 2.2, spray: 3.0, summon: 0.9 }[pat];
          if (pat === 'suck') { G.fx.push({ k: 'circle', x: e.x, y: e.y, r: 64, t: 0, dur: 2.2 }); bubble(e, choice(['바닷물째 삼켜주마! 쓰읍~~!', '쓰으읍~~~!!', '이리 와라, 미끼야~']), 1.4); }
          if (pat === 'summon') { spawnEnemy('rockfish', e.x - 34, e.y + 10); spawnEnemy('bass', e.x + 34, e.y + 10); if (enr) spawnEnemy('bream', e.x, e.y + 30); bubble(e, choice(['얘들아, 낚시꾼이 왔다!', '이 대물탕은 내 구역이다!', '감히 내 바다에 낚싯대를?!']), 1.4); } }
        return;
      }
      if (e.st === 'suck') { const d = Math.hypot(e.x - G.P.x, e.y - G.P.y) || 1; if (d > e.r) { const k = (enr ? 52 : 40) * dt; G.P.x += (e.x - G.P.x) / d * k; G.P.y += (e.y - G.P.y) / d * k; } if (Math.random() < dt * 30) G.parts.push({ x: e.x + rand(-60, 60), y: e.y + rand(-36, 36), vx: 0, vy: 0, life: 0.4, max: 0.4, col: '#9fd8ff', sz: 2, grav: 0 });
        if (e.stT <= 0) { G.shake = 8; sfx('slam'); G.fx.push({ k: 'ring', x: e.x, y: e.y - 4, r: 64, col: '#ff7b8a', t: 0, dur: 0.4 }); if (d < 64) hurtPlayer(e.atk * 1.8, e); bubble(e, '덥석!!', 0.9); e.st = 'walk'; e.stT = enr ? 1.3 : 2.1; } return; }
      if (e.st === 'spray') { e.shT -= dt; if (e.shT <= 0) { e.shT = enr ? 0.09 : 0.12; e.sa += 0.36; shootAt(e, 'water', e.sa, 70); if (enr) shootAt(e, 'water', e.sa + Math.PI, 70); } }
      if (e.stT <= 0) { e.st = 'walk'; e.stT = enr ? 1.3 : 2.1; }
    }
  },
  // 가장자리는 산울타리 대신 바다
  themes: {
    lot: { bg: '#2f6fae', hedge: ['#3a3a42', '#55555f', '#2a2a30'], tint: [40, 30, 90, 0.10], glow: 0.16, sea: 1, ground: groundLot, decor: decorLot },
    pier: { bg: '#2f6fae', hedge: ['#8a6a44', '#b98a5a', '#5e4430'], tint: [20, 40, 90, 0.06], glow: 0.10, sea: 1, ground: groundPier, decor: decorPier },
    night: { bg: '#0e1a33', hedge: ['#4a3a2a', '#6a5238', '#2e2418'], tint: [8, 12, 50, 0.30], glow: 0.55, sea: 1, dark: 1, ground: groundPier, decor: decorPier },
    rock: { bg: '#182848', hedge: ['#3a3a48', '#55556a', '#262632'], tint: [30, 20, 80, 0.26], glow: 0.4, sea: 1, ground: groundRock, decor: decorRock },
  },
  items: {
    net:      { slot: 'weapon', name: '오빠의 뜰채', rar: 3, atk: 40, crit: 0.06, icon: 'net', tier: 5, bossOnly: 1, w: { reach: 30, arc: 140, mul: 1, rate: 2.0, kb: 120, style: 'swing' }, desc: '대물 건지라고 산 뜰채. 오늘은 몬스터를 건진다' },
    vest:     { slot: 'armor', name: '구명 낚시조끼', rar: 3, def: 22, hp: 200, color: '#ee8a2a', icon: 'jacket', tier: 5, bossOnly: 1, desc: '주머니가 열두 개. 하나엔 오빠 간식' },
    bucket:   { slot: 'hat', name: '벙거지 모자', rar: 3, def: 12, mp: 80, crit: 0.05, color: '#7a8a5a', icon: 'hat', tier: 5, bossOnly: 1, desc: '햇빛도 잔소리도 막아준다' },
    rainboot: { slot: 'shoes', name: '미끄럼방지 장화', rar: 3, def: 7, spd: 0.24, color: '#2f6a3f', icon: 'boots', tier: 5, bossOnly: 1, desc: '미끄러운 좌대도 문제없다' },
    tackle:   { slot: 'bag', name: '오빠의 태클박스', rar: 3, atk: 10, mp: 80, crit: 0.05, color: '#3a6ac0', icon: 'bag', tier: 5, bossOnly: 1, desc: '"이거 다 필요한 거야" 라던 그 상자' },
    b_life:   { slot: 'bcloth', bori: 1, name: '보리 구명조끼', rar: 3, bdmg: 0.62, color: '#ff8a3c', pat: 'pad', icon: 'bpad', tier: 5, bossOnly: 1, desc: '물에 빠져도 둥둥. 보리 최애 주황색' },
    toy_lure: { slot: 'btoy', bori: 1, name: '반짝이 루어 장난감', rar: 3, bdmg: 0.7, icon: 'lure', tier: 5, bossOnly: 1, desc: '대왕자바리도 홀린 반짝이. 바늘은 뺐어요' },
  },
  book: { k: 'sea', name: '2장 낚시 장비', txt: '공격·방어 +4%', mul: 1.04 },
  hair: { k: 'ocean', name: '바다 블루', H: '#1f4f9a', h: '#5a9ae8', need: 'ch2', cond: '2장 클리어' },
  ach: [
    { id: 'c2n', t: '밤낚시 생존자', d: '2장 STAGE 7 밤낚시 통과', tier: 2, v: pd => pd.ch2 && (pd.ch2.cleared || pd.ch2.zone >= 7) ? 1 : 0, g: 1 },
    { id: 'c2', t: '월척 헌터', d: '2장 클리어 (오빠 구출)', tier: 3, v: pd => (pd.ch2 && pd.ch2.cleared) || 0, g: 1 },
    { id: 'c2x5', t: '바다의 주인', d: '2장 5번 클리어', tier: 4, v: pd => (pd.ch2 && pd.ch2.cleared) || 0, g: 5 },
  ],
  cut: { scenes: ['lot', 'sea', 'seaS', 'seaN', 'rocks'], draw: drawSeaCut, actors: drawSeaActors },
  story: { prologue: ['프롤로그 · 주차장', CH2_PROLOGUE], stages: { 1: ['STAGE 6 · 낮낚시', CH2_DAY], 2: ['STAGE 7 · 밤낚시', CH2_NIGHT] }, ending: ['엔딩 · 12시간 낚시 끝', CH2_ENDING] },
  end: { stats: lv => `구출한 오빠 <b>1</b>명<br>${lv}<br><br><b>다음 데이트는 희수 마음대로!</b><br><small>3장에서 계속…</small>`, again: '더 큰 대물이 기다려요' }
});
