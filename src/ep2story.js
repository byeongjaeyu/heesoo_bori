// ===================== EP2 STORY =====================
let MISSION1 = null;
const E2PRO = [
  { scene: 'ep2home', bgm: 'home',
    init(A) { clearA(A); Object.assign(A, { hus: { x: 34, rodUp: true }, hee: { x: -2, pose: 'idle', dir: 'right' }, b2: { x: -32, kind: 'sit' }, door: false }); },
    delay: 0.8, lines: [
      { who: 'hus', text: '자기야 빨리! 물때 놓친다~' },
      { who: 'hee', text: '알았어 알았어... 진짜 가는구나...' },
      { who: 'bori2', text: '(벌떡 일어나서 앞발 싹싹)\n보리도! 보리도 데려가 주세요!', do() { A_().b2.kind = 'rub'; } },
      { who: 'hee', text: '보리야, 낚시터는 물이 많아서 위험해.\n집 잘 지키고 있어~ 간식 놓고 갈게!', do() { A_().hee.dir = 'left'; } },
      { who: 'bori2', text: '...끼잉', do() { A_().b2.kind = 'sit'; } }] },
  { init(A) { A.door = true; A.hee.pose = 'walk'; A.hee.dir = 'left'; },
    update(A, dt, t) { if (A.hee) { A.hee.x -= dt * 42; if (A.hee.x < -96) A.hee = null; } if (A.hus) { if (t > 0.4) A.hus.x -= dt * 42; if (A.hus.x < -96) A.hus = null; } if (t > 3.2) A.door = false; }, dur: 3.6 },
  { init(A) { A.hee = null; A.hus = null; A.door = false; }, delay: 0.4, lines: [
      { who: 'sys', text: '철컥. 문이 닫혔다.\n...집에는 보리 혼자.' },
      { who: 'bori2', text: '(심심하니까 뼈다구랑 놀아야지~)', do() { A_().b2.kind = 'run'; A_().b2.x = 16; } },
      { who: 'bori2', text: '킁킁... 킁킁킁...?!', do() { A_().b2.kind = 'sit'; } },
      { who: 'sys', text: '세상에서 제일 소중한 뼈다구장난감이 없다!' },
      { who: 'sys', text: '그때, 베란다 창문 틈으로 회색 고양이 꼬리가 쏙 사라졌다.', do() { A_().cat = { x: 64, y: -36 }; } },
      { who: 'bori2', text: '멍!!! 멍멍!!! (내 뼈다구!!!)', do() { A_().b2.kind = 'standA'; A_().b2.jump = true; A_().cat = null; sfx('bark'); } }] },
  { scene: 'stars', init(A) { A.b2 = null; A.cat = null; $('#mission').innerHTML = '<small>MISSION</small><b>뼈다구를 되찾고<br>낚시터의 언니를 찾아가라!</b><p>스테이지마다 게임 방식이 달라요<br>가만히 있으면 보리는 꾸벅꾸벅 졸아요</p>'; $('#mission').hidden = false; $('#skip').hidden = true; }, dur: 3.4 }
];
const E2END = [
  { scene: 'e2lake', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { fish: { x: 46 }, b2: { x: 10, kind: 'sit' }, hee: { x: -52, pose: 'phone', dir: 'down' }, hus: { x: -84, rodUp: false } }); },
    delay: 1.0, lines: [
      { who: 'sys', text: '전설의 월척이 뭍으로 펄떡 올라왔다.\n그 앞에는 뼈다구를 문 보리가 당당히 서 있다.' },
      { who: 'hus', text: '...어? 저거 내가 하루 종일 노리던 월척인데?!' },
      { who: 'hee', text: '보리야!!! 너 여기까지 혼자 온 거야?!ㅠㅠㅠ', do() { A_().hee.pose = 'idle'; A_().hee.dir = 'right'; } },
      { who: 'sys', text: '보리는 뼈다구를 언니 발 앞에 툭 내려놓았다.', do() { A_().b2.x = -32; A_().b2.noToy = true; A_().bone = true; } },
      { who: 'hee', text: '언니 주는 거야? 우리 보리 최고야ㅠㅠ' },
      { who: 'hus', text: '근데... 월척은 내가 잡은 걸로 하면 안 될까?' },
      { who: 'hee', text: '...나 집에 갈래.', do() { A_().aura = true; } },
      { who: 'sys', text: '오빠가 슬그머니 아이스박스에서 그리팅 반미를 꺼냈다.', do() { A_().aura = false; } },
      { who: 'bori2', text: '(벌떡 일어나서 앞발 싹싹...)', do() { A_().b2.kind = 'rub'; A_().b2.x = -70; A_().b2.flip = true; } },
      { who: 'bori2', text: '(오빠 손바닥에 앞발 툭)\n「보리 주세요」', do() { A_().b2.kind = 'paw'; sfx('ding'); } },
      { who: 'hus', text: '...이건 반칙이지. 자, 한 조각만이다?' },
      { who: 'hee', text: '거봐, 우리 집에서 보리가 제일 세.' }] },
  { init(A) { A.b2.kind = 'lie'; A.b2.x = -40; A.b2.flip = false; A.fish = null; A.hee.dir = 'down'; }, delay: 0.4, lines: [{ who: 'sys', text: '노을 진 저수지.\n셋은 나란히 앉았고, 보리는 언니 옆에서 꾸벅꾸벅 졸았다.' }], dur: 1.2 },
  { scene: 'ep2home', bgm: 'home', init(A) { clearA(A); A.cat = { x: 32, y: -16 }; }, delay: 0.8, lines: [{ who: 'sys', text: '[쿠키] 그날 밤, 우리 집 소파 위.' }, { who: 'cat', text: '...여기 살기로 했다냥.' }], dur: 0.6 }
];
function e2Prologue(replay) {
  if (!MISSION1) MISSION1 = $('#mission').innerHTML;
  e2HideAll(); playCut(E2PRO, () => { $('#mission').innerHTML = MISSION1; $('#mission').hidden = true; EP2.save.prologue = true; e2SaveNow(); if (replay) e2Menu(); else { E2STAGES[0]._seen = false; e2Play(0); } });
}
function e2Ending() {
  e2HideAll(); playCut(E2END, () => {
    EP2.save.cleared = true; e2SaveNow(); G.state = 'end';
    $('#endScr h2').textContent = '보리 외전 「보리 주세요」';
    $('#endStats').innerHTML = `모은 별 <b>${e2Stars()} / ${E2STAGES.length * 3}</b><br>보리 옷장 <b>${Object.keys(EP2.save.own).length} / 5</b><br>다음 이야기도 기대해 주세요...?`;
    $('#endBtns').innerHTML = `<button class="btn pk" id="e2eMenu">스테이지 목록 (별 모으기)</button><button class="btn wh" id="e2eTitle">타이틀로</button>`;
    $('#endScr').hidden = false;
    $('#e2eMenu').onclick = () => { $('#endScr').hidden = true; e2Menu(); };
    $('#e2eTitle').onclick = () => { $('#endScr').hidden = true; showTitle(); };
  });
}
function e2DrawActors(A, mid, gy, T) {
  const K = CUTK;
  if (A.fish) { const x = mid + A.fish.x * K; shadow(x, gy + 4, 36); drawSpr(s2('fish'), x, gy + 4 - Math.round(Math.abs(Math.sin(T * 6)) * 2), { scale: 2 }); }
  if (A.bone && A.hee) drawSpr(spr('t_toy_bone', ICONS.tbone), mid + A.hee.x * K + 9, gy + 3);
  if (A.cat) drawSpr(s2('cat'), mid + A.cat.x * K, gy + (A.cat.y || 0));
  if (A.b2) {
    const b = A.b2, x = mid + b.x * K, y = gy + (b.y || 3); let k = b.kind;
    if (k === 'rub') k = Math.floor(T * 9) % 2 ? 'standA' : 'standB'; else if (k === 'run') k = Math.floor(T * 10) % 2 ? 'runA' : 'runB';
    shadow(x, y, 12); drawB2(k, x, y - (b.jump ? Math.round(Math.abs(Math.sin(T * 9)) * 4) : 0), { flip: !!b.flip, noToy: true });
    if (b.kind === 'lie') zzz(x + 6, y - 10, T);
    if (b.kind === 'rub' && Math.floor(T * 6) % 2) { fr(x - 7, y - 16, 1, 1, '#ffd84a'); fr(x + 7, y - 14, 1, 1, '#ffd84a'); }
  }
}
function e2DrawLake(SW, SH, mid, gy, T) {
  skyBands(SW, gy - 30, '#6a3a9a', '#ffb07a'); pc(mid + 50, gy - 34, 12, '#ffe070');
  for (let i = 0; i < 3; i++) cloud(((i * 97 + T * 3) % (SW + 60)) - 30, 16 + i * 11, '#ffc0d8');
  for (let i = 0; i < 6; i++) fr(i * 52 - 20, gy - 40 - (i % 2) * 6, 50, 12 + (i % 2) * 6, '#4a3060');
  for (let y = gy - 30; y < gy - 4; y += 3) fr(0, y, SW, 3, mixHex('#5a7ac8', '#3a4a8a', (y - gy + 30) / 26));
  for (let i = 0; i < 12; i++) fr(((i * 37 + T * 6) % SW), gy - 26 + (i * 7) % 20, 6, 1, 'rgba(255,220,180,0.6)');
  fr(0, gy - 4, SW, SH - gy + 4, '#8cc96e'); fr(0, gy - 4, SW, 3, '#d8c08a');
  for (let x = 0; x < SW; x += 7) { fr(x, gy - 8, 1, 6, '#4f9a3f'); }
  const cx = mid - 100 * CUTK; for (const ox of [0, 30]) { fr(cx + ox, gy - 6, 14, 2, '#3a78c0'); fr(cx + ox + 1, gy - 4, 1, 6, '#2b1b24'); fr(cx + ox + 12, gy - 4, 1, 6, '#2b1b24'); }
  fr(mid + 70 * CUTK, gy - 2, 16, 10, '#2b1b24'); fr(mid + 70 * CUTK + 1, gy - 1, 14, 4, '#4a8ad0'); fr(mid + 70 * CUTK + 1, gy + 3, 14, 4, '#ffffff');
}
