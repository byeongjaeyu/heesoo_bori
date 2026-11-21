// ===================== 3장 컷신: 사직 야구장 직관 대소동 =====================
// 희수 말버릇: 「뭐?????!!!!!!」, 「…진짜 이 남자가.」, 「돈 아까워」, 멘헤라 게이지. 구단 로고는 그리지 않음(이름만)
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
    // 응원석/그라운드: 멀리 잔디 + 관중 + 전광판
    fr(0, gy - 40, SW, 18, night ? '#24502c' : '#3a7a44');
    for (let i = 0; i < 160; i++) { const x = (i * 23.7) % SW, y = gy - 22 + (i * 7) % 18; fr(x, y + (Math.floor(T * 3 + i) % 4 === 0 ? -1 : 0), 2, 2, ['#e8414f', '#3a5ab0', '#ffffff', '#ffd84a', '#f0bb9c'][i % 5]); }
    fr(0, gy - 4, SW, SH - gy + 4, '#6a6f7c'); for (let y = gy + 4; y < SH; y += 10) for (let x = 2; x < SW; x += 10) fr(x, y, 8, 6, (Math.floor(y / 10) % 2) ? '#3a5ab0' : '#e8414f');
    const sc = dScore(); ctx.drawImage(sc, Math.round(mid - 28), 12);
    if (night) for (const lx of [mid - 100, mid + 100]) { ctx.globalCompositeOperation = 'lighter'; pc(lx, 18, 16, 'rgba(255,250,210,0.3)'); ctx.globalCompositeOperation = 'source-over'; fr(lx - 8, 12, 16, 10, '#fff6d0'); }
    if (mode === 'prain') { ctx.strokeStyle = 'rgba(190,210,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 70; i++) { const x = ((i * 37.3 + T * 60) % (SW + 20)) - 10, y = ((i * 53.1 + T * 220) % (SH + 20)) - 10; ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 6); } ctx.stroke(); }
  }
}
function drawParkActors(A, mid, gy, T) {
  if (A.chick && A.hus) { const x = Math.round(mid + A.hus.x * CUTK + 14), y = gy - 4; fr(x - 6, y - 7, 12, 8, '#2b1b24'); fr(x - 5, y - 6, 10, 6, '#ffffff'); fr(x - 5, y - 6, 10, 2, '#e8414f'); pc(x - 2, y - 8, 3, '#d9822b'); pc(x + 2, y - 9, 3, '#c97a26'); }
  if (A.big) { const p = Math.min(1, (T - A.big) * 1.6); ctx.globalAlpha = p; txtCut(A.bigText || '', mid, 34, 12, '#ffd84a', '#2b1b24'); ctx.globalAlpha = 1; }
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
      { who: 'sys', text: '딱—!! 그 순간, 상대팀이 홈런을 쳤다.', do() { A_().hee.sweat = false; G.shake = 4; sfx('slam'); } },
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
      { who: 'sys', text: '딱—!!! 역전 끝내기 안타!!\n사직이 들썩였다!', do() { A_().big = G.time; A_().bigText = '끝내기 역전승!!'; G.shake = 6; sfx('lvl'); } },
      { who: 'hee', text: '이겼다!!! 오빠 봤어?! 봤냐고!!!', do() { A_().sparkle = true; A_().bori.jump = true; } },
      { who: 'hus', text: '어… 근데 방금 뭐가 된 거야?' },
      { who: 'hee', text: '…진짜 이 남자가.', do() { A_().sparkle = false; A_().aura = true; } },
      { who: 'hus', text: '그래도… 자기가 이렇게 좋아하니까\n나도 좋다.', do() { A_().aura = false; } },
      { who: 'hee', text: '…흥. 그럼 다음에도 같이 오는 거다?', do() { A_().sparkle = true; sfx('ding'); } },
      { who: 'hus', text: '응. 근데 다음엔…\n보리 데리고 애견 운동장 가자.' },
      { who: 'bori', text: '멍멍!! 멍멍멍!!', do() { A_().bori.jump = true; sfx('bark'); } }] },
  { dur: 1.0 }
];
