// ===================== 2장 컷신: 유료 바다낚시터 대소동 =====================
// 실제 있었던 일 4가지: 「밥하러 온 거지?」(낮) · 「장비만 좋았다면… → 당장 다 팔아」(해 질 녘) · 「잠만 잘 거면 오지 마」(밤) · 「연장할까..?」(엔딩)
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
    fr(0, gy - 4, SW, SH - gy + 4, '#3a3a48'); for (let i = 0; i < 40; i++) pc((i * 37) % SW, gy + 4 + (i * 13) % (SH - gy), 3 + (i % 4), i % 2 ? '#4a4a5c' : '#2e2e3a');
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
