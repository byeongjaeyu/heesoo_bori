// ===================== 3장 컷신: 사직 야구장 직관 대소동 =====================
// 희수 말버릇: 「뭐?????!!!!!!」, 「…진짜 이 남자가.」, 「돈 아까워」, 멘헤라 게이지. 구단 로고는 그리지 않음(이름만)
// ===================== 야구 경기 그리기 (컷신·응원석 스테이지 공용) =====================
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
