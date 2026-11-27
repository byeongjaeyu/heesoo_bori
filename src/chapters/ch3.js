// ===================== 3장 컷신: 사직 야구장 직관 대소동 =====================
// 희수 말버릇: 「뭐?????!!!!!!」, 「…진짜 이 남자가.」, 「돈 아까워」, 멘헤라 게이지. 구단 로고는 그리지 않음(이름만)
// 이 파일 = 3장 전부 (컷신·경기 장면·스테이지·몬스터·보스 패턴·응원 장비·업적), 맨 아래 regChapter 로 등록

// ===================== 야구 경기 그리기 (컷신·응원석 스테이지 공용) =====================



import { ctx } from '../sys/dom.js';
import { choice, clamp, lerp, rand } from '../core/util.js';
import { mkCanvas, pCirc, pEll, pRect } from '../draw/sprite.js';
import { sfx } from '../sys/audio.js';
import { regChapter } from '../core/chapter.js';
import { OK, WORLD_H, WORLD_W, dLamp } from '../draw/world.js';
import { G } from '../core/state.js';
import { bubble, burst, hurtPlayer, moveToward } from '../play/player.js';
import { aimDash, dashStep, shootAt, spawnEnemy } from '../play/enemies.js';
import { CUTK, cloud, fr, pc, skyBands } from '../draw/render.js';
import { A_, CUT, clearA } from '../story/story.js';

/** 다이아몬드 기하: 홈(hx,hy), 1·3루 가로 거리 w, 2루까지 세로 d2, 외야 펜스 wallY */
function bbGeo(hx, hy, w, d2, wallY) { return { hx, hy, w, d2, wallY, b1: [hx + w, hy - d2 / 2], b2: [hx, hy - d2], b3: [hx - w, hy - d2 / 2], m: [hx, hy - d2 * 0.48] }; }
/** 내야(흙·잔디·베이스·파울라인). g = 캔버스 컨텍스트(바닥 캔버스 또는 화면) */
function bbDiamond(g, F, grass, tarp) {
  const { hx, hy, w, d2 } = F, dirt = '#b07a4e', poly = (pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
  g.strokeStyle = '#f0f0f0'; g.lineWidth = 1; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + w * 3, hy - d2 * 1.5); g.moveTo(hx, hy); g.lineTo(hx - w * 3, hy - d2 * 1.5); g.stroke();
  poly([[hx, hy + 6], [hx + w + 8, hy - d2 / 2], [hx, hy - d2 - 8], [hx - w - 8, hy - d2 / 2]], tarp ? '#3e4c6a' : dirt);
  if (tarp) { g.fillStyle = '#56668a'; for (let y = hy - d2 - 6; y < hy + 4; y += 5) g.fillRect(hx - w - 6, Math.round(y), (w + 6) * 2, 1); return; }
  poly([[hx, hy - 5], [hx + w - 7, hy - d2 / 2], [hx, hy - d2 + 7], [hx - w + 7, hy - d2 / 2]], grass);
  pEll(g, hx, hy, 9, 4, dirt); pEll(g, F.m[0], F.m[1], 5, 3, dirt); g.fillStyle = '#ffffff'; g.fillRect(F.m[0] - 1, F.m[1], 3, 1);
  for (const [x, y] of [F.b1, F.b2, F.b3]) { g.fillStyle = '#2b1b24'; g.fillRect(Math.round(x) - 2, Math.round(y) - 1, 4, 3); g.fillStyle = '#ffffff'; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 2); }
  g.fillStyle = '#ffffff'; g.fillRect(hx - 1, hy, 3, 2);
}
/** 멀리 보이는 선수 한 명 (발 위치 x,y) */
function bbFig(x, y, shirt, cap, arm) {
  x = Math.round(x); y = Math.round(y);
  fr(x - 1, y - 2, 1, 2, '#e8e8ee'); fr(x + 1, y - 2, 1, 2, '#e8e8ee'); fr(x - 1, y - 5, 3, 3, shirt); fr(x - 1, y - 7, 3, 2, '#f6d2b4'); fr(x - 1, y - 8, 3, 1, cap);
  if (arm) fr(x + 2, y - 9, 1, 4, '#f6d2b4');
}
function bbBall(x, y, r) { x = Math.round(x); y = Math.round(y); if (r > 1) { fr(x - 1, y - 1, 3, 3, '#2b1b24'); fr(x, y, 1, 1, '#ffffff'); fr(x - 1, y, 3, 1, '#ffffff'); fr(x, y - 1, 1, 3, '#ffffff'); } else fr(x, y, 1, 1, '#ffffff'); }
/** 베이스를 도는 경로: 주어진 베이스 순서를 t(0~1)로 */
function bbRun(F, path, u) { const pts = path.map(k => k === 'h' ? [F.hx, F.hy] : F[k]); u = clamp(u, 0, 1) * (pts.length - 1); const i = Math.min(pts.length - 2, Math.floor(u)), f = u - i; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; }
/**
 * 경기 장면. cfg.def/off = [유니폼, 모자], cfg.ev = { t0, kind: 'hr'|'hit', tx, ty } (없으면 투구만 반복)
 */
function bbPlay(F, T, cfg) {
  const { hx, hy, w, d2 } = F, [ds, dc] = cfg.def, [os, oc] = cfg.off, ofY = Math.max(F.wallY + 12, hy - d2 * 1.45);
  const ev = cfg.ev, t = ev ? T - ev.t0 : -1;
  const fld = { lf: [hx - w * 1.45, ofY + 4], cf: [hx, ofY], rf: [hx + w * 1.45, ofY + 4] };
  let ball = null, swing = false, batter = [hx - 4, hy + 1], runner = null, pArm = false;
  if (ev && t >= 0) {
    if (t < 0.35) ball = [lerp(F.m[0], hx, t / 0.35), lerp(F.m[1] - 4, hy - 4, t / 0.35), 1];
    else {
      swing = true;
      const hr = ev.kind === 'hr', dur = hr ? 1.8 : 1.1, u = Math.min(1, (t - 0.35) / dur), H = hr ? (hy - F.wallY) * 0.8 : (hy - F.wallY) * 0.3;
      if (u < 1) ball = [lerp(hx, ev.tx, u), lerp(hy - 4, ev.ty, u) - H * Math.sin(Math.PI * u), hr ? 2 - u : 2];
      else if (hr && t - 0.35 - dur < 1.4) { const k = t - 0.35 - dur; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 + k * 3; fr(ev.tx + Math.cos(a) * (3 + k * 10), ev.ty + Math.sin(a) * (2 + k * 6), 1, 1, ['#ffd84a', '#ffffff', '#ff6a74', '#7ec8ff'][i % 4]); } }
      else if (!hr) ball = [ev.tx + Math.min(14, (t - 0.35 - dur) * 10), ev.ty + 2, 1];
      // 수비수가 공 쫓아감
      const chase = ev.tx > hx ? 'rf' : 'lf', cu = clamp((t - 0.4) / (hr ? 1.6 : 1.4), 0, 1); fld[chase] = [lerp(fld[chase][0], ev.tx, cu * (hr ? 0.6 : 0.9)), lerp(fld[chase][1], Math.max(F.wallY + 8, ev.ty), cu * 0.8)];
      if (hr) batter = t > 0.8 ? bbRun(F, ['h', 'b1', 'b2', 'b3', 'h'], (t - 0.8) / 4.5) : batter;
      else { batter = t > 0.6 ? bbRun(F, ['h', 'b1'], (t - 0.6) / 1.1) : batter; runner = t > 0.45 ? bbRun(F, ['b2', 'b3', 'h'], (t - 0.45) / 1.6) : F.b2; }
    }
  } else if (cfg.loop) {
    const c = T % 3.4; pArm = c < 0.5; if (c > 0.5 && c < 0.85) ball = [lerp(F.m[0], hx, (c - 0.5) / 0.35), lerp(F.m[1] - 4, hy + 1, (c - 0.5) / 0.35), 1];
    if (cfg.r2) runner = [F.b2[0] - 4, F.b2[1] + 1];
  }
  // 수비 (뒤쪽부터)
  for (const k of ['lf', 'cf', 'rf']) bbFig(fld[k][0], fld[k][1], ds, dc);
  bbFig(hx + w * 0.48, hy - d2 * 0.82, ds, dc); bbFig(hx - w * 0.48, hy - d2 * 0.82, ds, dc);
  bbFig(F.b1[0] - 3, F.b1[1] - 3, ds, dc); bbFig(F.b3[0] + 3, F.b3[1] - 3, ds, dc);
  bbFig(F.m[0], F.m[1], ds, dc, pArm);
  if (runner) bbFig(runner[0], runner[1], os, oc);
  bbFig(batter[0], batter[1], os, oc);
  if (!(ev && t > 0.8 && ev.kind === 'hr') && !(ev && t > 0.6 && ev.kind === 'hit')) { const bx = Math.round(batter[0]), by = Math.round(batter[1]); if (swing && (!ev || t < 0.6)) fr(bx + 1, by - 5, 6, 1, '#c98a3a'); else fr(bx - 2, by - 11, 1, 6, '#c98a3a'); }
  fr(hx - 1, hy + 4, 3, 2, ds); fr(hx - 1, hy + 2, 3, 2, '#3a3a46'); // 포수
  fr(hx - 1, hy + 8, 3, 3, '#2b2b3a'); fr(hx - 1, hy + 6, 3, 2, '#f6d2b4'); // 심판
  if (ball) bbBall(ball[0], ball[1], ball[2]);
}
function drawParkCut(SW, SH, mid, gy, T, mode) {
  const night = mode === 'prain' || mode === 'pwin';
  skyBands(SW, gy - 24, night ? '#0e1630' : '#6fb8ff', night ? '#2a3a6a' : '#d6f0ff');
  if (!night) { pc(mid + 60, 22, 10, '#fff6b0'); for (let i = 0; i < 3; i++) cloud(((i * 113 + T * 4) % (SW + 60)) - 30, 14 + i * 10, '#ffffff'); }
  if (mode === 'pgate') {
    // 경기장 외벽 + 매표소
    fr(0, gy - 60, SW, 50, '#9aa0aa'); for (let x = 6; x < SW; x += 26) { fr(x, gy - 50, 16, 26, '#6a6f7c'); fr(x + 2, gy - 48, 12, 22, '#3a3f50'); }
    fr(0, gy - 62, SW, 3, '#2b1b24'); fr(0, gy - 4, SW, SH - gy + 4, '#b86a50'); for (let y = gy; y < SH; y += 6) fr(0, y, SW, 1, '#8a4a36');
    const b = dBooth(); ctx.drawImage(b, Math.round(mid + 70 * CUTK - 17), gy - 34);
  } else if (mode === 'pfood') {
    fr(0, gy - 4, SW, SH - gy + 4, '#e8d8b8'); for (let x = 0; x < SW; x += 14) fr(x, gy, 1, SH - gy, '#c8b590');
    const s1 = dStall('#e8414f'), s2 = dStall('#d9822b'); ctx.drawImage(s1, Math.round(mid - 95 * CUTK - 20), gy - 34); ctx.drawImage(s2, Math.round(mid + 90 * CUTK - 20), gy - 34);
  } else {
    // 응원석에서 내려다본 경기장: 외야 관중석·조명탑·전광판 → 펜스 → 잔디 → 내야(투수·타자·수비)
    const A = (CUT && CUT.A) || {}, wallY = Math.round(gy * 0.34), by = wallY - 26, hy = gy - 42;
    fr(0, by, SW, 26, night ? '#262a36' : '#4a4f5c'); fr(0, by, SW, 1, '#2b1b24');
    const land = A.hr && T - A.hr > 2.15 && T - A.hr < 5;
    for (let i = 0; i < SW * 4.2; i++) { const x = (i * 37.7) % SW, y = by + 3 + (i * 13) % 21, right = x > SW * 0.6; const hop = (land && right) ? -Math.abs(Math.round(Math.sin(T * 12 + i) * 2)) : (Math.floor(T * 3 + i) % 5 === 0 ? -1 : 0); fr(x, y + hop, 2, 2, right ? ['#3a5ab0', '#ffffff', '#5a7ad0', '#f0bb9c'][i % 4] : ['#e8414f', '#ffffff', '#ffd84a', '#f0bb9c', '#e8414f'][i % 5]); }
    for (const lx of [Math.round(SW * 0.07), Math.round(SW * 0.93)]) { fr(lx, by - 44, 2, 46, '#6a6f7c'); fr(lx - 7, by - 52, 16, 8, '#2b1b24'); fr(lx - 6, by - 51, 14, 6, night ? '#fff6d0' : '#d0d6e0'); if (night) { ctx.globalCompositeOperation = 'lighter'; pc(lx + 1, by - 48, 16, 'rgba(255,250,210,0.25)'); ctx.globalCompositeOperation = 'source-over'; } }
    const sc = dScore(); ctx.drawImage(sc, Math.round(mid - sc.width / 2), Math.max(2, by - sc.height - 4));
    const g1 = night ? '#24502c' : '#3a7a44', g2 = night ? '#204828' : '#347040';
    for (let y = wallY + 6; y < gy - 4; y += 6) fr(0, y, SW, 6, ((y - wallY) / 6) % 2 < 1 ? g1 : g2);
    fr(0, wallY + 6, SW, 4, night ? '#6a4a30' : '#9a6a44');
    fr(0, wallY, SW, 6, '#2a5a3e'); fr(0, wallY, SW, 1, '#ffd84a'); fr(0, wallY + 6, SW, 1, '#2b1b24');
    fr(0, hy + 10, SW, gy - hy - 14, night ? '#5a3e28' : '#9a6a44');
    const F = bbGeo(mid, hy, Math.min(SW * 0.24, (hy - wallY) * 0.62), (hy - wallY) * 0.5, wallY);
    bbDiamond(ctx, F, g1, mode === 'prain');
    if (mode === 'pstand') bbPlay(F, T, { def: ['#ffffff', '#e8414f'], off: ['#3a5ab0', '#2a4288'], loop: true, ev: A.hr ? { t0: A.hr, kind: 'hr', tx: mid + SW * 0.36, ty: by + 10 } : null });
    else if (mode === 'pwin') bbPlay(F, T, { def: ['#3a5ab0', '#2a4288'], off: ['#ffffff', '#e8414f'], loop: true, r2: true, ev: A.walk ? { t0: A.walk, kind: 'hit', tx: mid - SW * 0.22, ty: wallY + 18 } : null });
    // 앞쪽 관중석: 난간 + 계단식 단 + 등받이 의자 (바깥 구역 파랑, 안쪽 빨강)
    fr(0, gy - 4, SW, SH - gy + 4, '#5a5f6c');
    for (let y = gy + 2, r = 0; y < SH; y += 12, r++) { fr(0, y, SW, 8, '#6e7380'); fr(0, y + 8, SW, 4, '#4e525e'); for (let x = 3 + (r % 2) * 5; x < SW - 8; x += 11) { const out = Math.abs(x - mid) > SW * 0.3, c = out ? ['#3a5ab0', '#2a4288', '#5a7ad0'] : ['#e8414f', '#b02a3a', '#ff6a74']; fr(x, y, 9, 6, '#2b1b24'); fr(x + 1, y + 1, 7, 4, c[0]); fr(x + 1, y + 1, 7, 1, c[2]); fr(x + 1, y + 5, 7, 2, c[1]); } }
    fr(0, gy - 4, SW, 2, '#c0c6d0'); fr(0, gy - 2, SW, 1, '#2b1b24'); for (let x = 4; x < SW; x += 22) fr(x, gy - 4, 2, 6, '#c0c6d0');
    
    if (night) for (const lx of [mid - 100, mid + 100]) { ctx.globalCompositeOperation = 'lighter'; pc(lx, 18, 16, 'rgba(255,250,210,0.3)'); ctx.globalCompositeOperation = 'source-over'; fr(lx - 8, 12, 16, 10, '#fff6d0'); }
    if (mode === 'prain') { ctx.strokeStyle = 'rgba(190,210,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 70; i++) { const x = ((i * 37.3 + T * 60) % (SW + 20)) - 10, y = ((i * 53.1 + T * 220) % (SH + 20)) - 10; ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 6); } ctx.stroke(); }
  }
}
function drawParkActors(A, mid, gy, T) {
  if (A.chick && A.hus) { const x = Math.round(mid + A.hus.x * CUTK + 14), y = gy - 4; fr(x - 6, y - 7, 12, 8, '#2b1b24'); fr(x - 5, y - 6, 10, 6, '#ffffff'); fr(x - 5, y - 6, 10, 2, '#e8414f'); pc(x - 2, y - 8, 3, '#d9822b'); pc(x + 2, y - 9, 3, '#c97a26'); }
  if (A.big && T > A.big) { const p = Math.min(1, (T - A.big) * 1.6); ctx.globalAlpha = p; txtCut(A.bigText || '', mid, 34, 12, A.bigCol || '#ffd84a', '#2b1b24'); ctx.globalAlpha = 1; }
}
/** 컷신용 큰 글씨 */
function txtCut(s, x, y, size, col, out) { ctx.font = `bold ${size}px Galmuri11, sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = out; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); }
const CH3_PROLOGUE = [
  { scene: 'pgate', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -24, pose: 'idle', dir: 'down' }, bori: { x: -46, pose: 'sit', face: 1, y: 2 }, hus: { x: 22 } }); },
    delay: 0.8, lines: [
      { who: 'sys', text: '약속한 다음 데이트 날.\n희수는 오빠 손을 끌고 사직 야구장에 왔다.' },
      { who: 'hee', text: '오늘은 내 마음대로 하는 날이다!!\n롯데 응원하러 가자!', do() { A_().sparkle = true; sfx('ding'); } },
      { who: 'hus', text: '야구…? 나 룰 잘 모르는데….', do() { A_().sparkle = false; } },
      { who: 'hee', text: '괜찮아, 내가 다 알려줄게.\n대신 응원 안 하면 알지?' },
      { who: 'hus', text: '…넵.' },
      { who: 'sys', text: '그런데 매표소 앞 줄이 수상하게 꿈틀거린다…!', do() { const t = G.time; A_().mons = [{ type: 'cutter', x: 60, y: 4, t0: t }, { type: 'scalper', x: 84, y: 8, t0: t + 0.3 }, { type: 'pigeon', x: -70, y: -30, t0: t + 0.5 }]; sfx('pop'); } },
      { who: 'mon', text: '실례~ 나 원래 여기 있었어~' },
      { who: 'hee', text: '뭐?????!!!!!!\n지금 새치기한 거야?!', do() { A_().hee.shake = true; A_().hee.alert = true; } },
      { who: 'hee', text: '…표 사려고 얼마나 기다렸는데. 비켜.', do() { A_().hee.shake = false; A_().hee.alert = false; A_().aura = true; sfx('ult'); } }] },
  { dur: 0.4 }
];
const CH3_FOOD = [
  { scene: 'pfood', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -26, pose: 'idle', dir: 'down' }, bori: { x: -50, pose: 'sit', face: 1, y: 2 }, hus: { x: 26 }, chick: true }); },
    delay: 0.6, lines: [
      { who: 'sys', text: '겨우 입장! 먹거리 존은 치킨 냄새로 가득했다.' },
      { who: 'hus', text: '자기야 나 치킨 하나만… 아니 두 마리만.' },
      { who: 'hee', text: '경기 시작하는데 지금 밥 생각밖에 없어?', do() { A_().hee.sweat = true; } },
      { who: 'hus', text: '야구장은 원래 먹으러 오는 데라던데…?' },
      { who: 'hee', text: '…진짜 이 남자가.', do() { A_().hee.sweat = false; A_().aura = true; } },
      { who: 'sys', text: '그때, 치킨 박스들이 날개를 퍼덕이며 날아올랐다!', do() { const t = G.time; A_().aura = false; A_().mons = [{ type: 'chickbox', x: 70, y: -26, t0: t }, { type: 'tteok', x: -80, y: 8, t0: t + 0.3 }, { type: 'soda', x: 96, y: 8, t0: t + 0.5 }]; sfx('pop'); } },
      { who: 'hee', text: '오빠 먹는 것만 쫓아다니면\n진짜 오늘 끝이야.', do() { A_().hee.fist = true; sfx('smash'); } }] },
  { dur: 0.4 }
];
const CH3_STAND = [
  { scene: 'pstand', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -24, pose: 'idle', dir: 'down' }, bori: { x: -48, pose: 'sit', face: 1, y: 2 }, hus: { x: 24 } }); },
    delay: 0.6, lines: [
      { who: 'sys', text: '드디어 1루 응원석. 경기가 한창이다!' },
      { who: 'hus', text: '근데 지금 몇 회야? 공 어디 갔어?' },
      { who: 'hee', text: '…진짜 모르는구나.', do() { A_().hee.sweat = true; } },
      { who: 'sys', text: '딱—!! 그 순간, 상대팀이 홈런을 쳤다.', do() { A_().hee.sweat = false; A_().hr = G.time; A_().big = G.time + 2.2; A_().bigText = '상대팀 홈런…'; A_().bigCol = '#7ec8ff'; setTimeout(() => { G.shake = 4; sfx('slam'); }, 350); } },
      { who: 'hee', text: '…………….', do() { A_().aura = true; sfx('ult'); } },
      { who: 'sys', text: '희수의 멘헤라 게이지가 차오른다…' },
      { who: 'bori', text: '멍…(눈치)' },
      { who: 'hee', text: '오빠. 지금부터 소리 안 지르면\n집에 혼자 가. 표 값 아까우니까.' },
      { who: 'hus', text: '롯데 화이팅!!!!! 이겨라!!!!!', do() { A_().hus.rodUp = true; A_().aura = false; sfx('ding'); } },
      { who: 'sys', text: '그러자 상대팀 응원단이 막대풍선을 들고 몰려왔다!', do() { const t = G.time; A_().mons = [{ type: 'stick', x: 70, y: 6, t0: t }, { type: 'flag', x: 96, y: 4, t0: t + 0.3 }, { type: 'foul', x: -80, y: -20, t0: t + 0.5 }]; sfx('pop'); } }] },
  { dur: 0.4 }
];
const CH3_RAIN = [
  { scene: 'prain', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -22, pose: 'idle', dir: 'down' }, bori: { x: -46, pose: 'sit', face: 1, y: 2 }, hus: { x: 24 }, mons: [{ type: 'cloud', x: 60, y: -46, t0: G.time }] }); },
    delay: 0.6, lines: [
      { who: 'sys', text: '9회말. 한 점 차로 지고 있는데…\n하늘이 시커멓게 변했다.', do() { G.shake = 3; } },
      { who: 'mon', text: '우르르 쾅!! 오늘 경기는…\n우천취소다~!' },
      { who: 'hee', text: '뭐?????!!!!!!\n9회말인데?!', do() { A_().hee.shake = true; A_().hee.alert = true; } },
      { who: 'hus', text: '자기야… 비 오니까 그냥 집에 갈까…?' },
      { who: 'hee', text: '오빠, 우산 들고 있어.\n내가 저 구름 치우고 올게.', do() { A_().hee.shake = false; A_().hee.alert = false; A_().hee.fist = true; A_().aura = true; sfx('smash'); } }] },
  { dur: 0.4 }
];
const CH3_ENDING = [
  { scene: 'pwin', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -22, pose: 'idle', dir: 'down' }, bori: { x: -46, pose: 'sit', face: 1, y: 2 }, hus: { x: 24 } }); },
    delay: 0.8, lines: [
      { who: 'sys', text: '먹구름이 걷히고, 경기가 다시 시작됐다.\n9회말 투아웃, 주자 2루…' },
      { who: 'sys', text: '딱—!!! 역전 끝내기 안타!!\n사직이 들썩였다!', do() { A_().walk = G.time; A_().big = G.time + 1.6; A_().bigText = '끝내기 역전승!!'; setTimeout(() => { G.shake = 6; sfx('lvl'); }, 350); } },
      { who: 'hee', text: '이겼다!!! 오빠 봤어?! 봤냐고!!!', do() { A_().sparkle = true; A_().bori.jump = true; } },
      { who: 'hus', text: '어… 근데 방금 뭐가 된 거야?' },
      { who: 'hee', text: '…진짜 이 남자가.', do() { A_().sparkle = false; A_().aura = true; } },
      { who: 'hus', text: '그래도… 자기가 이렇게 좋아하니까\n나도 좋다.', do() { A_().aura = false; } },
      { who: 'hee', text: '…흥. 그럼 다음에도 같이 오는 거다?', do() { A_().sparkle = true; sfx('ding'); } },
      { who: 'hus', text: '응. 근데 자기야… 다음에\n낚시터에서 꼭 할 말이 있어.' },
      { who: 'hee', text: '…또 낚시야?', do() { A_().sparkle = false; A_().hee.sweat = true; } },
      { who: 'bori', text: '멍멍!! 멍멍멍!!', do() { A_().bori.jump = true; sfx('bark'); } }] },
  { dur: 1.0 }
];


// ---------- 스테이지 소품 ----------
function dBooth() { const c = mkCanvas(34, 34), g = c.getContext('2d'); pRect(g, 2, 10, 30, 24, OK); pRect(g, 3, 11, 28, 23, '#e8e8ee'); pRect(g, 0, 4, 34, 8, OK); for (let x = 1; x < 33; x++) pRect(g, x, 5, 1, 6, (Math.floor(x / 4) % 2) ? '#ffffff' : '#e8414f'); pRect(g, 7, 15, 20, 9, OK); pRect(g, 8, 16, 18, 7, '#9fe8ff'); pRect(g, 6, 26, 22, 3, OK); pRect(g, 7, 26, 20, 2, '#8a5a3a'); pRect(g, 9, 0, 16, 5, OK); pRect(g, 10, 1, 14, 3, '#ffd84a'); return c; }
function dStanchion() { const c = mkCanvas(40, 14), g = c.getContext('2d'); for (const x of [2, 36]) { pRect(g, x, 2, 3, 11, OK); pRect(g, x + 1, 3, 1, 9, '#c0c6d0'); pRect(g, x - 1, 12, 5, 2, OK); } for (let x = 5; x < 36; x++) pRect(g, x, 4 + Math.round(Math.sin((x - 5) / 31 * Math.PI) * 3), 1, 2, '#e8414f'); return c; }
function dStall(col) { const c = mkCanvas(40, 34), g = c.getContext('2d'); pRect(g, 2, 12, 36, 22, OK); pRect(g, 3, 13, 34, 21, '#fff6e0'); pRect(g, 0, 4, 40, 9, OK); for (let x = 1; x < 39; x++) pRect(g, x, 5, 1, 7, (Math.floor(x / 4) % 2) ? '#ffffff' : col); pRect(g, 4, 22, 32, 3, OK); pRect(g, 5, 22, 30, 2, '#c98a5a'); for (let i = 0; i < 4; i++) { pCirc(g, 9 + i * 7, 18, 2, i % 2 ? '#d9822b' : '#e8414f'); } return c; }
function dTable() { const c = mkCanvas(22, 16), g = c.getContext('2d'); pRect(g, 1, 4, 20, 5, OK); pRect(g, 2, 5, 18, 3, '#e8e8ee'); pRect(g, 4, 9, 2, 7, OK); pRect(g, 16, 9, 2, 7, OK); pRect(g, 7, 1, 8, 4, OK); pRect(g, 8, 2, 6, 2, '#d9822b'); return c; }
function dBin() { const c = mkCanvas(10, 14), g = c.getContext('2d'); pRect(g, 1, 2, 8, 12, OK); pRect(g, 2, 3, 6, 10, '#3a78c0'); pRect(g, 0, 0, 10, 3, OK); pRect(g, 1, 1, 8, 1, '#6fb8ff'); return c; }
function dLightTower() { const c = mkCanvas(20, 46), g = c.getContext('2d'); pRect(g, 9, 12, 2, 34, OK); pRect(g, 7, 42, 6, 4, OK); pRect(g, 0, 0, 20, 13, OK); for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) pRect(g, 2 + x * 4, 2 + y * 4, 3, 3, '#fff6d0'); return c; }
function dBase() { const c = mkCanvas(10, 10), g = c.getContext('2d'); pRect(g, 1, 1, 8, 8, OK); pRect(g, 2, 2, 6, 6, '#ffffff'); return c; }
function dScore() { const c = mkCanvas(56, 30), g = c.getContext('2d'); pRect(g, 0, 0, 56, 24, OK); pRect(g, 2, 2, 52, 20, '#1c2a1c'); for (let i = 0; i < 9; i++) { pRect(g, 5 + i * 5, 6, 3, 4, '#ffd84a'); pRect(g, 5 + i * 5, 13, 3, 4, i === 8 ? '#e8414f' : '#ffd84a'); } pRect(g, 25, 24, 6, 6, OK); return c; }

// ---------- 스테이지 바닥·소품 배치 ----------
function groundGate(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  // 매표소 광장: 붉은 벽돌 / 먹거리 존: 베이지 타일
  const gate = Z.theme === 'gate'; g.fillStyle = gate ? '#b86a50' : '#e8d8b8'; g.fillRect(0, 0, WORLD_W, WORLD_H);
  const tw = gate ? 12 : 16, th2 = gate ? 6 : 16;
  for (let y = 0; y < WORLD_H; y += th2) { const off = gate && (y / th2) % 2 ? tw / 2 : 0; for (let x = -off; x < WORLD_W; x += tw) { g.fillStyle = choice(gate ? ['#b86a50', '#a85e46', '#c4765a'] : ['#e8d8b8', '#e0ceaa', '#efe2c6']); g.fillRect(x + 1, y + 1, tw - 1, th2 - 1); } }
  g.fillStyle = gate ? '#8a4a36' : '#c8b590'; for (let y = 0; y < WORLD_H; y += th2) g.fillRect(0, y, WORLD_W, 1);
}
function groundStand(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  // 응원석: 계단식 콘크리트 단 + 등받이 의자 + 앉아 있는 관중 (가운데·양옆은 계단 통로, 8줄마다 가로 통로)
  g.fillStyle = '#5a5f6c'; g.fillRect(0, 0, WORLD_W, WORLD_H);
  // 위쪽은 경기장(잔디·내야) → 펜스·난간 → 아래로 관중석
  const FY = 196;
  for (let y = 0; y < FY; y += 12) { g.fillStyle = (y / 12) % 2 ? '#347040' : '#3a7a44'; g.fillRect(0, y, WORLD_W, 12); }
  W.field = bbGeo(170, FY - 22, 96, 100, 12); bbDiamond(g, W.field, '#3a7a44', false);
  W.top = FY + 22; W.gate.y = FY + 74; // 그라운드는 못 들어감, 출구는 가운데 계단 맨 위 통로
  pRect(g, 0, FY - 10, WORLD_W, 10, '#9a6a44'); pRect(g, 0, FY, WORLD_W, 8, '#2a5a3e'); pRect(g, 0, FY, WORLD_W, 1, '#ffd84a'); pRect(g, 0, FY + 8, WORLD_W, 1, OK);
  pRect(g, 0, FY - 3, WORLD_W, 1, '#c0c6d0'); for (let x = 4; x < WORLD_W; x += 24) pRect(g, x, FY - 3, 1, 4, '#c0c6d0');
  const RP = 24, aisles = [[cx - 34, cx + 34], [92, 116], [WORLD_W - 116, WORLD_W - 92]];
  const inAisle = x => aisles.some(([a0, a1]) => x + 12 > a0 && x < a1);
  const secCol = x => (x < 92 || x > WORLD_W - 92) ? ['#3a5ab0', '#2a4288', '#5a7ad0'] : ['#e8414f', '#b02a3a', '#ff6a74'];
  const shirts = ['#ffffff', '#e8414f', '#3a5ab0', '#f0f0f0', '#2b2b3a', '#ffcf40', '#e8414f', '#c0c6d0'], hairs = ['#2b1b24', '#3a2a20', '#5a3a2a', '#1a1a22', '#8a5a3a'];
  for (let r = 0, y = FY + 9; y < WORLD_H; r++, y += RP) {
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
    pRect(g, a0, FY + 9, a1 - a0, WORLD_H, '#8a8f9a');
    for (let y = FY + 9; y < WORLD_H; y += 12) { pRect(g, a0, y, a1 - a0, 6, '#9aa0aa'); pRect(g, a0, y + 6, a1 - a0, 1, '#6a6f7c'); pRect(g, a0 + 2, y, a1 - a0 - 4, 1, '#f0d040'); }
    pRect(g, a0 - 1, FY + 9, 1, WORLD_H, OK); pRect(g, a1, FY + 9, 1, WORLD_H, OK);
  }
}
function groundField(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  // 9회말 그라운드: 잔디 줄무늬 + 내야 흙 + 베이스
  for (let y = 0; y < WORLD_H; y += 24) { g.fillStyle = (y / 24) % 2 ? '#2f6a3a' : '#3a7a44'; g.fillRect(0, y, WORLD_W, 24); }
  const dy = WORLD_H * 0.55; g.fillStyle = '#9a6a44'; g.beginPath(); g.moveTo(cx, dy - 150); g.lineTo(cx + 150, dy); g.lineTo(cx, dy + 150); g.lineTo(cx - 150, dy); g.closePath(); g.fill();
  g.fillStyle = '#3a7a44'; g.beginPath(); g.moveTo(cx, dy - 110); g.lineTo(cx + 110, dy); g.lineTo(cx, dy + 110); g.lineTo(cx - 110, dy); g.closePath(); g.fill();
  g.strokeStyle = '#f0f0f0'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, dy + 150); g.lineTo(cx + 150, dy); g.lineTo(cx, dy - 150); g.lineTo(cx - 150, dy); g.closePath(); g.stroke();
  pEll(g, cx, dy, 14, 9, '#9a6a44');
}
function decorGate(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  add(dBooth(), 90, 120, 16, 30); add(dBooth(), WORLD_W - 90, 120, 16, 30); add(dBooth(), 90, 300, 16, 30); add(dBooth(), WORLD_W - 90, 300, 16, 30);
  const st = dStanchion(); for (let y = 180; y < WORLD_H - 80; y += 56) { add(st, cx - 70, y, 4, 4); add(st, cx + 70, y + 28, 4, 4); }
  scatter(6, () => dBin(), 4, 10); const lamp = dLamp('#ffe68a'); for (let y = 200; y < WORLD_H - 70; y += 160) { add(lamp, 26, y, 2, 8, { glow: '#ffe68a' }); add(lamp, WORLD_W - 26, y, 2, 8, { glow: '#ffe68a' }); }
}
function decorFood(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  const cols = ['#e8414f', '#d9822b', '#3a78c0', '#7ccf5a']; for (let y = 120; y < WORLD_H - 80; y += 120) { add(dStall(choice(cols)), 60, y, 16, 30); add(dStall(choice(cols)), WORLD_W - 60, y + 60, 16, 30); }
  scatter(9, () => dTable(), 8, 12, { avoidBoss: true }); scatter(5, () => dBin(), 4, 10);
}
function decorStand(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  add(dScore(), WORLD_W - 90, 70, 0, 0); const tw = dLightTower(); for (const [x, y] of [[40, 300], [WORLD_W - 40, 300], [40, WORLD_H - 150], [WORLD_W - 40, WORLD_H - 150]]) add(tw, x, y, 4, 8, { glow: '#fff6d0' });
}
function decorField(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  const tw = dLightTower(); for (const [x, y] of [[40, 120], [WORLD_W - 40, 120], [40, WORLD_H - 120], [WORLD_W - 40, WORLD_H - 120]]) add(tw, x, y, 4, 8, { glow: '#fff6d0' });
  const b = dBase(), dy = WORLD_H * 0.55; for (const [x, y] of [[cx + 110, dy], [cx, dy - 110], [cx - 110, dy], [cx, dy + 110]]) add(b, x, y + 5, 0, 0);
}

regChapter({
  c: 3, name: '사직 야구장', title: '3장 · 사직 야구장 직관 대소동', pick: ['야구장', '야구장'], lv: 50, baseL: 20, // 1장 9회차 수준 위
  zones: [
    { name: '사직 야구장 매표소', sub: 'STAGE 9', quota: 34, max: 12, spawnInt: 1.2, mons: [['cutter', 5], ['scalper', 3], ['pigeon', 4]], boss: 'cutking', theme: 'gate', next: '먹거리 존' },
    { name: '야구장 먹거리 존', sub: 'STAGE 10', quota: 36, max: 12, spawnInt: 1.15, mons: [['chickbox', 5], ['tteok', 4], ['soda', 3]], boss: 'chickboss', theme: 'food', next: '1루 응원석' },
    { name: '1루 응원석', sub: 'STAGE 11', quota: 38, max: 13, spawnInt: 1.1, mons: [['foul', 4], ['stick', 5], ['flag', 3]], boss: 'cheerleader', theme: 'stand', next: '9회말 그라운드' },
    { name: '9회말 그라운드', sub: 'FINAL STAGE', quota: 40, max: 13, spawnInt: 1.1, mons: [['foul', 4], ['stick', 3], ['flag', 3], ['pigeon', 2]], boss: 'raincloud', theme: 'field', next: '' },
  ],
  mons: {
    cutter:   { name: '새치기 아저씨',   spr: 'cutter',   hp: 950,  atk: 72, def: 14, spd: 34, xp: 130, gold: [30, 44], r: 6, ai: 'chase', col: '#3a78c0' },
    scalper:  { name: '수상한 암표상',   spr: 'scalper',  hp: 820,  atk: 76, def: 12, spd: 30, xp: 130, gold: [30, 44], r: 6, ai: 'ranged', proj: 'ticket', col: '#2b2b34' },
    pigeon:   { name: '사직 비둘기 떼',  spr: 'pigeon',   hp: 620,  atk: 64, def: 8,  spd: 50, xp: 110, gold: [26, 38], r: 5, ai: 'float', col: '#8a919e', fly: 1 },
    chickbox: { name: '날아다니는 치킨', spr: 'chickbox', hp: 900,  atk: 74, def: 12, spd: 46, xp: 140, gold: [32, 46], r: 6, ai: 'float', col: '#d9822b', fly: 1 },
    tteok:    { name: '떡볶이 컵',       spr: 'tteok',    hp: 1150, atk: 80, def: 14, spd: 30, xp: 140, gold: [32, 46], r: 6, ai: 'hop', col: '#e8414f' },
    soda:     { name: '거품 음료 컵',    spr: 'soda',     hp: 980,  atk: 78, def: 12, spd: 28, xp: 140, gold: [32, 46], r: 6, ai: 'ranged', proj: 'water', col: '#ffd84a' },
    foul:     { name: '파울볼',          spr: 'foul',     hp: 760,  atk: 92, def: 10, spd: 52, xp: 150, gold: [34, 50], r: 5, ai: 'charge', col: '#f7f3ea' },
    stick:    { name: '막대풍선',        spr: 'stick',    hp: 1250, atk: 84, def: 15, spd: 32, xp: 150, gold: [34, 50], r: 6, ai: 'hop', col: '#e8414f' },
    flag:     { name: '상대팀 응원깃발', spr: 'flag',     hp: 1700, atk: 88, def: 18, spd: 26, xp: 160, gold: [36, 52], r: 7, ai: 'chase', col: '#3a5ab0' },
    cutking:     { name: '새치기 대마왕',    spr: 'cutter',   scale: 3.2, crown: 1, hp: 26000, atk: 80,  def: 18, spd: 30, xp: 6000,  gold: [1400, 1700], r: 22, ai: 'cutking', boss: 1, col: '#3a78c0', drops: ['bat', 'cheercap'] },
    chickboss:   { name: '통닭 대장',        spr: 'chickbox', scale: 3.6, crown: 1, hp: 32000, atk: 88,  def: 20, spd: 28, xp: 7200,  gold: [1600, 1900], r: 22, ai: 'chickboss', boss: 1, col: '#d9822b', drops: ['uniform', 'b_cheer'] },
    cheerleader: { name: '상대팀 응원단장',  spr: 'leader',   scale: 3.2, crown: 1, hp: 38000, atk: 96,  def: 22, spd: 30, xp: 8600,  gold: [1800, 2100], r: 22, ai: 'cheerleader', boss: 1, col: '#3a5ab0', drops: ['spike', 'cheerbag'] },
    raincloud:   { name: '우천취소 먹구름',  spr: 'cloud',    scale: 4.2, crown: 1, hp: 45000, atk: 108, def: 24, spd: 24, xp: 14000, gold: [0, 0],       r: 28, ai: 'raincloud', boss: 1, col: '#5a5a6e', fly: 1, drops: ['toy_ball'] },
  },
  ai: {
    // 새치기 대마왕: 희수 앞에 예고 원 → 순간이동해 끼어들며 밀치기, 화나면 새치기 아저씨 호출
    cutking(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt;
      if (e.st === 'idle') { e.st = 'roam'; e.stT = 1.6; }
      if (e.st === 'roam') { moveToward(e, G.P.x, G.P.y, sp, dt); e.face = G.P.x > e.x ? -1 : 1; if (e.stT <= 0) { e.st = 'cut'; e.stT = enr ? 0.7 : 0.9; e.tx = G.P.x; e.ty = G.P.y; G.fx.push({ k: 'circle', x: e.tx, y: e.ty, r: 46, t: 0, dur: e.stT }); bubble(e, choice(['잠깐만~ 일행이 있어서~', '나 원래 여기 있었는데?', '줄이 왜 이렇게 길어!']), 1.2); } }
      else if (e.st === 'cut') { if (e.stT <= 0) { burst(e.x, e.y, '#c0c6d0', 12, 70); e.x = e.tx; e.y = e.ty; burst(e.x, e.y, '#ffffff', 16, 90); G.shake = 6; sfx('slam'); G.fx.push({ k: 'ring', x: e.x, y: e.y - 4, r: 46, col: '#6fb8ff', t: 0, dur: 0.4 }); if (Math.hypot(G.P.x - e.x, G.P.y - e.y) < 50) hurtPlayer(e.atk * 1.3, e); e.cuts = (e.cuts || 0) + 1; if (enr || e.cuts % 3 === 0) { spawnEnemy('cutter', e.x - 30, e.y + 8); spawnEnemy('cutter', e.x + 30, e.y + 8); } e.st = 'rest'; e.stT = 0.7; } }
      else if (e.st === 'rest') { if (e.stT <= 0) { e.st = 'roam'; e.stT = enr ? 1.3 : 2.0; } }
    },
    // 통닭 대장: 데굴데굴 돌진 → 닭다리 부채꼴 던지기, 치킨 박스 호출
    chickboss(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt;
      if (e.st === 'idle') { e.st = 'roam'; e.stT = 1.8; e.cyc = 0; }
      if (e.st === 'roam') { moveToward(e, G.P.x, G.P.y, sp, dt); e.face = G.P.x > e.x ? -1 : 1; if (e.stT <= 0) { e.cyc++; if (e.cyc % 2) { e.st = 'tele'; e.stT = 0.75; aimDash(e, 280, e.r * 1.3, choice(['바삭바삭!!', '양념 반 후라이드 반!'])); } else { e.st = 'throw'; e.stT = 0.5; bubble(e, '치킨은 살 안 쪄!', 1.1); } } }
      else if (e.st === 'tele') { if (e.stT <= 0) { e.st = 'dash'; e.stT = 1.2; } }
      else if (e.st === 'dash') { e.hopY = Math.abs(Math.sin(e.t * 18)) * 4; if (dashStep(e, 240, dt) || e.stT <= 0) { e.hopY = 0; e.st = 'roam'; e.stT = enr ? 1.1 : 1.8; G.shake = 4; } }
      else if (e.st === 'throw') { if (e.stT <= 0) { const a0 = Math.atan2(G.P.y - e.y, G.P.x - e.x), n = enr ? 9 : 7; for (let i = 0; i < n; i++) shootAt(e, 'churro', a0 + (i - (n - 1) / 2) * 0.2, 86); sfx('pop'); spawnEnemy('chickbox', e.x - 30, e.y); if (enr) spawnEnemy('chickbox', e.x + 30, e.y); e.st = 'roam'; e.stT = enr ? 1.2 : 2.0; } }
    },
    // 상대팀 응원단장: 확성기 고함(부채꼴 범위) · 응원가 음표 소용돌이 · 막대풍선 호출
    cheerleader(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt;
      if (e.st === 'idle') { e.st = 'roam'; e.stT = 1.6; e.cyc = 0; }
      if (e.st === 'roam') { moveToward(e, G.P.x, G.P.y, sp * 0.9, dt); e.face = G.P.x > e.x ? -1 : 1;
        if (e.stT <= 0) { e.cyc++; const pat = ['shout', 'song', 'shout', 'call'][e.cyc % 4]; e.st = pat; e.shT = 0; e.sa = rand(0, 6.28);
          if (pat === 'shout') { e.stT = enr ? 0.7 : 0.9; e.sa = Math.atan2(G.P.y - e.y, G.P.x - e.x); G.fx.push({ k: 'line', x: e.x, y: e.y - 6, a: e.sa, len: 170, w: 70, t: 0, dur: e.stT }); bubble(e, choice(['소리 질러~!!', '원정 응원 간다!!']), 1.1); }
          if (pat === 'song') { e.stT = 2.6; bubble(e, '우리 팀 이겨라~♪', 1.3); }
          if (pat === 'call') { e.stT = 0.6; for (let i = 0; i < (enr ? 4 : 3); i++) spawnEnemy('stick', e.x + rand(-40, 40), e.y + rand(10, 30)); bubble(e, '막대풍선 부대, 출동!', 1.2); } } return; }
      if (e.st === 'shout' && e.stT <= 0) { const d = Math.hypot(G.P.x - e.x, G.P.y - e.y), da = Math.abs(((Math.atan2(G.P.y - e.y, G.P.x - e.x) - e.sa + Math.PI * 3) % (Math.PI * 2)) - Math.PI); G.shake = 5; sfx('slam'); burst(e.x + Math.cos(e.sa) * 40, e.y + Math.sin(e.sa) * 40, '#ffd84a', 14, 110); if (d < 175 && da < 0.42) hurtPlayer(e.atk * 1.5, e); }
      if (e.st === 'song') { e.shT -= dt; if (e.shT <= 0) { e.shT = enr ? 0.1 : 0.14; e.sa += 0.4; shootAt(e, 'note', e.sa, 66); } }
      if (e.stT <= 0) { e.st = 'roam'; e.stT = enr ? 1.2 : 1.9; }
    },
    // 우천취소 먹구름: 둥둥 떠서 번개(예고 원 여러 개) · 소나기 탄막 · 파울볼 호출
    raincloud(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt; e.hopY = 6 + Math.sin(e.t * 2) * 3;
      if (e.st === 'idle') { e.st = 'float'; e.stT = 2; e.cyc = 0; }
      if (e.st === 'float') { moveToward(e, G.P.x, G.P.y - 30, sp, dt);
        if (e.stT <= 0) { e.cyc++; const pat = ['storm', 'pour', 'storm', 'call'][e.cyc % 4]; e.st = pat; e.shT = 0;
          if (pat === 'storm') { e.stT = 1.1; e.bolts = []; const n = enr ? 6 : 4; for (let i = 0; i < n; i++) { const b = { x: G.P.x + (i ? rand(-70, 70) : 0), y: G.P.y + (i ? rand(-50, 50) : 0) }; e.bolts.push(b); G.fx.push({ k: 'circle', x: b.x, y: b.y, r: 26, t: 0, dur: 1.1 }); } bubble(e, choice(['우르르 쾅!!', '오늘 경기는 우천취소다~!']), 1.2); }
          if (pat === 'pour') { e.stT = 2.6; bubble(e, '비 온다~ 집에 가라~', 1.2); }
          if (pat === 'call') { e.stT = 0.6; spawnEnemy('foul', e.x - 30, e.y + 20); spawnEnemy('foul', e.x + 30, e.y + 20); if (enr) spawnEnemy('pigeon', e.x, e.y + 30); } } return; }
      if (e.st === 'storm' && e.stT <= 0) { G.flashT = 0.35; G.shake = 7; sfx('slam'); for (const b of e.bolts || []) { G.fx.push({ k: 'ring', x: b.x, y: b.y, r: 28, col: '#fff6a0', t: 0, dur: 0.35 }); burst(b.x, b.y, '#fff6a0', 10, 80); if (Math.hypot(G.P.x - b.x, G.P.y - b.y) < 28) hurtPlayer(e.atk * 1.4, e); } }
      if (e.st === 'pour') { e.shT -= dt; if (e.shT <= 0) { e.shT = enr ? 0.07 : 0.1; shootAt(e, 'water', Math.PI / 2 + rand(-1.1, 1.1), 80); } }
      if (e.stT <= 0) { e.st = 'float'; e.stT = enr ? 1.2 : 1.9; }
    }
  },
  // 가장자리는 경기장 외벽(콘크리트)
  themes: {
    gate: { bg: '#9aa0aa', hedge: ['#8a8f9a', '#b0b5c0', '#6a6f7c'], tint: [60, 30, 80, 0.06], glow: 0.12, wall: 1, ground: groundGate, decor: decorGate },
    food: { bg: '#9aa0aa', hedge: ['#8a8f9a', '#b0b5c0', '#6a6f7c'], tint: [80, 40, 40, 0.08], glow: 0.2, wall: 1, ground: groundGate, decor: decorFood },
    stand: { drawOver: (W, T, cy) => { if (W.field && cy < 220) bbPlay(W.field, T, { def: ['#ffffff', '#e8414f'], off: ['#3a5ab0', '#2a4288'], loop: true, ev: (T % 14) >= 9 ? { t0: T - (T % 14) + 9, kind: 'hr', tx: W.field.hx + 70, ty: -40 } : null }); }, bg: '#2a3a5a', hedge: ['#8a8f9a', '#b0b5c0', '#6a6f7c'], tint: [20, 20, 70, 0.14], glow: 0.35, wall: 1, ground: groundStand, decor: decorStand },
    field: { bg: '#10182c', hedge: ['#3a3a48', '#55556a', '#262632'], tint: [10, 14, 40, 0.34], glow: 0.6, wall: 1, rain: 1, ground: groundField, decor: decorField },
  },
  items: {
    bat:      { slot: 'weapon', name: '응원 야구 배트', rar: 4, atk: 48, crit: 0.07, icon: 'bat', tier: 6, bossOnly: 1, ch: 3, w: { reach: 28, arc: 130, mul: 1.15, rate: 1.7, kb: 150, style: 'swing' }, desc: '9회말 투아웃의 기운이 깃든 배트' },
    uniform:  { slot: 'armor', name: '홈 유니폼', rar: 4, def: 28, hp: 260, color: '#f7f3ea', icon: 'jacket', tier: 6, bossOnly: 1, ch: 3, desc: '등번호는 오빠 생일. 이름은 희수' },
    cheercap: { slot: 'hat', name: '응원 야구모자', rar: 4, def: 15, mp: 100, crit: 0.06, color: '#3a5ab0', icon: 'hat', tier: 6, bossOnly: 1, ch: 3, desc: '파울볼도 막아줄 것 같은 챙' },
    spike:    { slot: 'shoes', name: '야구 스파이크', rar: 4, def: 9, spd: 0.28, color: '#2b2b34', icon: 'boots', tier: 6, bossOnly: 1, ch: 3, desc: '도루하듯 빠르게 매표소 줄로' },
    cheerbag: { slot: 'bag', name: '응원 도구 가방', rar: 4, atk: 13, mp: 100, crit: 0.06, color: '#e8414f', icon: 'bag', tier: 6, bossOnly: 1, ch: 3, desc: '막대풍선·비닐 봉지·간식이 한가득' },
    b_cheer:  { slot: 'bcloth', bori: 1, name: '보리 응원 조끼', rar: 4, bdmg: 0.75, color: '#3a5ab0', pat: 'pad', icon: 'bpad', tier: 6, bossOnly: 1, ch: 3, desc: '보리도 오늘은 열혈 팬' },
    toy_ball: { slot: 'btoy', bori: 1, name: '보리 야구공 장난감', rar: 4, bdmg: 0.85, icon: 'ball', tier: 6, bossOnly: 1, ch: 3, desc: '끝내기 홈런볼(이라고 오빠가 우김)' },
  },
  book: { k: 'park', name: '3장 응원 장비', txt: '공격·방어 +5%', mul: 1.05 },
  hair: { k: 'cheer', name: '응원 레드', H: '#a8222e', h: '#ff5a6a', need: 'ch3', cond: '3장 클리어' },
  ach: [
    { id: 'c3r', t: '우천 극복', d: '3장 9회말 그라운드 도착', tier: 2, v: pd => pd.ch3 && (pd.ch3.cleared || pd.ch3.zone >= 11) ? 1 : 0, g: 1 },
    { id: 'c3', t: '9회말의 기적', d: '3장 클리어 (역전승)', tier: 3, v: pd => (pd.ch3 && pd.ch3.cleared) || 0, g: 1 },
    { id: 'c3x5', t: '사직 개근러', d: '3장 5번 클리어', tier: 4, v: pd => (pd.ch3 && pd.ch3.cleared) || 0, g: 5 },
  ],
  cut: { scenes: ['pgate', 'pfood', 'pstand', 'prain', 'pwin'], draw: drawParkCut, actors: drawParkActors },
  story: { prologue: ['프롤로그 · 매표소', CH3_PROLOGUE], stages: { 1: ['STAGE 10 · 먹거리 존', CH3_FOOD], 2: ['STAGE 11 · 1루 응원석', CH3_STAND], 3: ['FINAL · 9회말 우천취소', CH3_RAIN] }, ending: ['엔딩 · 끝내기 역전', CH3_ENDING] },
  end: { stats: lv => `9회말 역전승 <b>1</b>번<br>${lv}<br><br><b>오빠가 낚시터에서 할 말이 있대…!</b><br><small>4장에서 계속…</small>`, again: '다음 경기가 기다려요' }
});
