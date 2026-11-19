// ===================== STORY / CUTSCENES =====================
const CUT = { steps: null, i: -1, t: 0, st: null, A: {}, scene: 'park', linesDone: true, started: false, onEnd: null, light: 0 };
function playCut(steps, onEnd) {
  G.state = 'cut'; CUT.steps = steps; CUT.i = -1; CUT.onEnd = onEnd; CUT.A = {}; CUT.light = 0; CUT.scene = 'park';
  showHUD(false); $('#skip').hidden = false; nextStep();
}
function nextStep() {
  CUT.i++; const st = CUT.steps && CUT.steps[CUT.i];
  if (!st) { endCut(); return; }
  CUT.st = st; CUT.t = 0; CUT.linesDone = !st.lines; CUT.started = false;
  if (st.scene) CUT.scene = st.scene; if (st.init) st.init(CUT.A); if (st.bgm) playBgm(st.bgm);
}
function endCut() {
  if (!CUT.steps) return;
  $('#skip').hidden = true; $('#dlg').hidden = true; DLG.cur = null; DLG.q = []; DLG.cb = null; $('#mission').hidden = true;
  const cb = CUT.onEnd; CUT.onEnd = null; CUT.steps = null; CUT.st = null; if (cb) cb();
}
function updateCut(dt) {
  const st = CUT.st; if (!st) return; CUT.t += dt;
  if (st.update) st.update(CUT.A, dt, CUT.t);
  if (st.lines && !CUT.started && CUT.t >= (st.delay || 0)) { CUT.started = true; dialog(st.lines, () => { CUT.linesDone = true; }); }
  if (CUT.light > 0) CUT.light -= dt * 2.5;
  if (CUT.steps && CUT.linesDone && CUT.t >= (st.dur || 0)) nextStep();
}
function clearA(A) { for (const k in A) delete A[k]; }

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
const A_ = () => CUT.A;

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

function pxLine(x0, y0, x1, y1, col, w) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0; ctx.fillStyle = col; for (let i = 0; i <= n; i++) { const t = n ? i / n : 0; ctx.fillRect(Math.round(lerp(x0, x1, t)), Math.round(lerp(y0, y1, t)), w || 1, w || 1); } }
function drawActors(A, mid, gy, T) {
  if (A.balloon) { const x = mid + A.balloon.x * CUTK, y = gy + A.balloon.y; pc(x, y, 4, '#2b1b24'); pc(x, y, 3, '#ff4d6d'); fr(x - 1, y - 2, 1, 1, '#fff'); pxLine(x, y + 4, x - 2, y + 18, '#9aa0aa'); }
  if (A.mons) for (const m of A.mons) { const p = clamp((T - m.t0) * 4, 0, 1); if (p <= 0) continue; const s = monSpr(m.type); shadow(mid + m.x * CUTK, gy + m.y, 10); drawSpr(s, mid + m.x * CUTK, gy + m.y - Math.abs(Math.sin(T * 3 + m.x)) * 3 - (1 - p) * 10, { alpha: p, white: p < 0.6 }); }
  if (A.hus) {
    const hx = mid + A.hus.x * CUTK; shadow(hx, gy, 12);
    if (A.hus.rodUp) { pxLine(hx + 6, gy - 7, hx + 30, gy - 52, '#3a3a46', 1); pxLine(hx + 5, gy - 6, hx + 9, gy - 12, '#c98a3a', 2); const tx = hx + 30, ty = gy - 52; for (let i = 0; i < 20; i++) fr(tx + i * 0.5, ty + i * 1.6 + Math.sin(i * 0.3) * 1, 1, 1, '#e8e8f0'); fr(tx + 9, ty + 30, 3, 2, '#e8414f'); fr(tx + 9, ty + 32, 3, 2, '#ffffff'); if (A.sparkle) for (let i = 0; i < 4; i++) { const a = T * 4 + i * 1.57; fr(tx + Math.cos(a) * 6, ty + Math.sin(a) * 6, 1, 1, '#ffd84a'); fr(tx + Math.cos(a) * 9, ty + Math.sin(a) * 9, 1, 1, '#fff6b0'); } }
    else { pxLine(hx + 8, gy - 2, hx + 12, gy - 44, '#3a3a46', 1); fr(hx + 7, gy - 8, 2, 6, '#c98a3a'); }
    drawSpr(husSpr(), hx, gy);
  }
  if (A.bori && A.bori.x < 400) { const bx = mid + A.bori.x * CUTK, by = gy + (A.bori.y || 2); shadow(bx, by, 10); drawBoriAt(bx, by, A.bori.pose, A.bori.face || 1, T, { pant: A.bori.pant, jump: A.bori.jump ? Math.round(Math.abs(Math.sin(T * 9)) * 5) : 0 }); }
  if (A.leash && A.hee && A.bori) pxLine(mid + A.hee.x * CUTK + 5, gy - 7, mid + A.bori.x * CUTK - 3, gy + (A.bori.y || 2) - 7, '#e8414f');
  if (A.hee) {
    const hx = mid + A.hee.x * CUTK + (A.hee.shake ? Math.round(Math.sin(T * 50)) : 0), hy = gy + (A.hee.y || 0);
    if (A.aura) { for (let i = 0; i < 10; i++) { const a = T * 2 + i * 0.63, r = 10 + Math.sin(T * 5 + i) * 2; fr(hx + Math.cos(a) * r, hy - 10 + Math.sin(a) * r * 0.9, 2, 2, i % 2 ? '#b45cff' : '#ff7ab8'); } }
    shadow(hx, hy, 12); drawHeeAt(hx, hy, A.hee.pose, A.hee.dir, T, {});
    if (A.hee.fist) { drawSpr(ispr('fist'), hx - 9, hy - 9 + Math.round(Math.sin(T * 8))); drawSpr(ispr('fist'), hx + 9, hy - 9 - Math.round(Math.sin(T * 8))); }
    if (A.hee.sweat) { fr(hx + 7, hy - 22, 2, 3, '#7ec8ff'); fr(hx + 7, hy - 23, 1, 1, '#7ec8ff'); }
  }
}
function renderCut() {
  const A = CUT.A; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  const CS = cutScale(), SW = cv.width / CS, SH = cv.height / CS; ctx.setTransform(CS, 0, 0, CS, 0, 0);
  const mid = Math.round(SW / 2), gy = Math.round(SH * 0.56), T = G.time; CUTK = clamp(SW / 220, 0.6, 1);
  if (CUT.scene === 'park') drawPark(SW, SH, mid, gy, A.dark || 0, false, T);
  else if (CUT.scene === 'gate') drawPark(SW, SH, mid, gy, 1, true, T);
  else if (CUT.scene === 'home') drawHome(SW, SH, mid, gy, T, A);
  else if (CUT.scene === 'escape') drawEscape(SW, SH, mid, gy, T);
  else if (CUT.scene === 'ep2home') drawHome(SW, SH, mid, gy, T, A);
  else if (CUT.scene === 'e2lake') e2DrawLake(SW, SH, mid, gy, T);
  else drawStars(SW, SH, T);
  drawActors(A, mid, gy, T);
  if (A.b2 || A.cat || A.fish) e2DrawActors(A, mid, gy, T);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const cw = cv.width, ch = cv.height;
  if (A.dark) { ctx.fillStyle = `rgba(60,10,90,${A.dark * 0.16})`; ctx.fillRect(0, 0, cw, ch); }
  if (A.sign) { const x = (mid + 36 * CUTK) * CS, y = (gy + 6 - 54 + 5) * CS; txt('출구 봉쇄', x, y, CS * 6, '#e8414f', '#ffffff'); }
  if (A.hee && A.hee.alert) { const x = (mid + A.hee.x * CUTK) * CS, y = (gy - 28) * CS; txt('!', x, y - Math.abs(Math.sin(G.time * 8)) * CS * 2, CS * 10, '#ff4d6d', '#ffffff'); }
  if (A.aura) { const a = 0.18 + Math.sin(G.time * 4) * 0.08; const vg = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.25, cw / 2, ch / 2, Math.max(cw, ch) * 0.7); vg.addColorStop(0, 'rgba(120,30,160,0)'); vg.addColorStop(1, `rgba(120,30,160,${a + 0.25})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, cw, ch); }
  if (CUT.light > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.9, CUT.light)})`; ctx.fillRect(0, 0, cw, ch); }
}
function renderTitle() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  const CS = cutScale(), SW = cv.width / CS, SH = cv.height / CS; ctx.setTransform(CS, 0, 0, CS, 0, 0);
  const mid = Math.round(SW / 2), gy = Math.round(SH * 0.56), T = G.time;
  drawPark(SW, SH, mid, gy, 0, false, T);
  shadow(mid - 8, gy + 12, 12); drawHeeAt(mid - 8, gy + 12, 'phone', 'down', T, {});
  shadow(mid + 11, gy + 13, 10); drawBoriAt(mid + 11, gy + 13, 'sit', 1, T, { pant: true });
  for (let i = 0; i < 3; i++) { const p = ((T * 0.5 + i / 3) % 1); ctx.globalAlpha = 1 - p; drawSpr(ispr('heart'), mid - 4 + Math.sin(p * 6 + i) * 6, gy - 14 - p * 20); } ctx.globalAlpha = 1;
}
