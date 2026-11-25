// ===================== 4장 컷신: 결혼 대작전 =====================
// 낚시터 프러포즈(빡침) → 웨딩홀 투어 → 드레스 투어(좋아무새) → 웨딩 촬영(감량 실패) → 사진 셀렉(모바일게임 → 셀렉실에서 게임 마왕과 싸움) → 엔딩 본식
// 오빠는 결혼 준비 내내 「응 좋아, 너무 좋아」만 말함 → 희수 멘헤라 포인트
/** 웨딩드레스·면사포 차림 희수 (컷신) */
const WED_PAL = { hat: 'veil', cloth: 'gown', shoe: 'heel', bag: 'none', C: '#fffaf4', c: '#e8dcd0', W: '#fffaf4', w: '#e8dcd0', O: '#fffaf4', o: '#e0d4c8' };
/** 턱시도 오빠 (모자 대신 머리, 검은 재킷·흰 셔츠·검은 바지) */
const husTuxSpr = () => sprFn('husTux2', () => husPaint({ tux: true }), 2);

function wedWall(SW, gy, top, bot, col) { for (let y = 0; y < gy - 4; y += 4) { const k = y / (gy - 4); fr(0, y, SW, 4, k < 0.5 ? top : bot); } fr(0, gy - 6, SW, 2, col); }
function drawWedCut(SW, SH, mid, gy, T, mode) {
  if (mode === 'whall' || mode === 'wwed') {
    // 웨딩홀: 아치 창문·샹들리에·레드 카펫
    wedWall(SW, gy, '#f6ecdc', '#efe2cc', '#c8a878');
    for (let x = mid - 150; x < mid + 160; x += 60) { fr(x - 12, gy - 70, 24, 46, '#c8a878'); fr(x - 10, gy - 68, 20, 44, '#cfe6ff'); pc(x, gy - 68, 10, '#cfe6ff'); fr(x - 1, gy - 78, 2, 52, '#c8a878'); fr(x - 10, gy - 50, 20, 2, '#c8a878'); }
    for (const cx of [mid - 70, mid + 70]) { pxLine(cx, 0, cx, 14, '#c8a878'); for (let i = 0; i < 7; i++) { const x = cx - 12 + i * 4; fr(x, 14 + (i % 2) * 2, 2, 4, '#ffd84a'); fr(x, 18 + (i % 2) * 2, 2, 2, '#fff6b0'); } }
    fr(0, gy - 4, SW, SH - gy + 4, mode === 'wwed' ? '#fff4ea' : '#efe4d2'); for (let y = gy; y < SH; y += 10) for (let x = (y / 10) % 2 ? 0 : 10; x < SW; x += 20) fr(x, y, 10, 10, mode === 'wwed' ? '#f4e6d8' : '#e2d4bc');
    fr(mid - 26, gy - 4, 52, SH - gy + 4, '#b8283a'); fr(mid - 26, gy - 4, 2, SH - gy + 4, '#ffd84a'); fr(mid + 24, gy - 4, 2, SH - gy + 4, '#ffd84a');
    if (mode === 'wwed') {
      // 꽃 아치 + 하객석
      for (let a = 0; a <= 30; a++) { const t = Math.PI * a / 30, x = mid - Math.cos(t) * 46, y = gy - 34 - Math.sin(t) * 34; pc(x, y, 4, a % 3 ? '#ffd1e6' : '#ffffff'); if (a % 4 === 0) fr(x - 1, y - 1, 2, 2, '#ff7ab8'); }
      fr(mid - 48, gy - 36, 4, 34, '#ffffff'); fr(mid + 44, gy - 36, 4, 34, '#ffffff');
      for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) for (const side of [-1, 1]) { const x = mid + side * (46 + i * 16), y = gy + 14 + r * 16; fr(x - 5, y - 10, 10, 12, '#2b1b24'); fr(x - 4, y - 9, 8, 10, '#ffffff'); const hx = x, hy = y - 14; fr(hx - 3, hy - 4, 6, 6, ['#2a1c1c', '#5a3422', '#3a2a26'][(i + r) % 3]); fr(hx - 2, hy - 1, 4, 3, '#f0bb9c'); }
      for (let i = 0; i < 40; i++) { const x = ((i * 47.3 + T * 14) % (SW + 20)) - 10, y = ((i * 31.7 + T * 26) % (gy + 20)) - 10; fr(x, y, 2, 1, i % 3 ? '#ffd1e6' : '#ffffff'); }
    } else {
      for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) for (const side of [-1, 1]) { const x = mid + side * (52 + i * 18), y = gy + 16 + r * 18; fr(x - 5, y - 12, 10, 14, '#2b1b24'); fr(x - 4, y - 11, 8, 12, '#ffffff'); fr(x - 2, y - 8, 4, 3, '#ff9fcf'); }
    }
  } else if (mode === 'wdress') {
    // 드레스 숍: 분홍 벽 · 피팅룸 커튼 · 마네킹 · 큰 거울
    wedWall(SW, gy, '#ffe4ee', '#f6d6e2', '#e8a8c4');
    for (let x = 0; x < SW; x += 12) fr(x, 0, 1, gy - 6, '#f6c8dc');
    const cw = Math.round(Math.min(80, SW * 0.4)); fr(mid - cw / 2, gy - 82, cw, 6, '#c8a070'); for (let x = mid - cw / 2 + 2; x < mid + cw / 2 - 2; x += 6) { const sway = Math.round(Math.sin(T * 2 + x) * 1); fr(x + sway, gy - 76, 5, 66, (x / 6) % 2 ? '#e8608a' : '#ff8fb0'); }
    for (const [x, c] of /** @type {[number, string][]} */ ([[Math.round(SW * 0.07), '#ffffff'], [Math.round(SW * 0.2), '#fffaf4'], [Math.round(SW * 0.8), '#ffd8e8'], [Math.round(SW * 0.93), '#ffffff']])) { fr(x - 1, gy - 52, 2, 4, '#2b1b24'); fr(x - 3, gy - 48, 6, 4, '#e3c9a0'); for (let y = 0; y < 30; y++) { const hw = Math.round(2 + y * 0.45); fr(x - hw, gy - 44 + y, hw * 2, 1, c); } fr(x - 1, gy - 14, 2, 8, '#2b1b24'); }
    fr(0, gy - 4, SW, SH - gy + 4, '#f6d6e2'); for (let y = gy + 4; y < SH; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < SW; x += 12) fr(x, y, 3, 3, '#ffeaf2');
  } else if (mode === 'wstudio') {
    // 스튜디오: 흰 배경지 · 소프트박스 · 삼각대 카메라
    for (let y = 0; y < SH; y++) { const k = clamp((y - gy + 30) / 60, 0, 1); fr(0, y, SW, 1, k < 0.5 ? '#f4f4f8' : '#e6e6ee'); }
    fr(0, 0, SW, 3, '#9aa0aa');
    for (const x of [Math.round(SW * 0.1), Math.round(SW * 0.9)]) { fr(x - 14, gy - 86, 28, 22, '#2b1b24'); fr(x - 13, gy - 85, 26, 20, '#ffffff'); fr(x - 1, gy - 64, 2, 56, '#2b1b24'); fr(x - 9, gy - 8, 18, 2, '#2b1b24');
      if (Math.floor(T * 2) % 5 === 0) { ctx.globalCompositeOperation = 'lighter'; pc(x, gy - 75, 30, 'rgba(255,255,240,0.35)'); ctx.globalCompositeOperation = 'source-over'; } }
    const cx = Math.round(SW * 0.72); fr(cx - 10, gy - 46, 20, 14, '#2b1b24'); fr(cx - 9, gy - 45, 18, 12, '#30323d'); pc(cx - 4, gy - 39, 4, '#9fe8ff'); pxLine(cx, gy - 32, cx - 10, gy, '#2b1b24'); pxLine(cx, gy - 32, cx + 10, gy, '#2b1b24'); pxLine(cx, gy - 32, cx, gy, '#2b1b24');
  } else if (mode === 'wselect') {
    // 사진 셀렉실: 큰 모니터에 사진 썸네일 · 소파
    wedWall(SW, gy, '#eef0f6', '#e2e6ee', '#9aa0aa');
    const mw = Math.round(Math.min(140, SW * 0.84)), cols = mw >= 120 ? 6 : 5, tw = Math.floor((mw - 6) / cols) - 2, x0 = mid - Math.round(mw / 2);
    fr(x0, gy - 86, mw, 62, '#2b1b24'); fr(x0 + 2, gy - 84, mw - 4, 58, '#30323d');
    for (let r = 0; r < 3; r++) for (let i = 0; i < cols; i++) { const x = x0 + 4 + i * (tw + 2), y = gy - 80 + r * 18, sel = (i + r * cols) === (Math.floor(T * 1.5) % (cols * 3)); fr(x, y, tw, 16, sel ? '#ffd84a' : '#5a5f6c'); fr(x + 1, y + 1, tw - 2, 14, ['#ffe4ee', '#f4f4f8', '#fff4ea'][(i + r) % 3]); const m = Math.round(tw / 2); fr(x + m - 4, y + 4, 3, 3, '#2a1c1c'); fr(x + m + 1, y + 4, 3, 3, '#2a1c1c'); fr(x + m - 5, y + 8, 5, 6, '#ffffff'); fr(x + m, y + 8, 4, 6, '#2b2b34'); }
    fr(mid - 4, gy - 24, 8, 14, '#2b1b24');
    fr(0, gy - 4, SW, SH - gy + 4, '#c8c0b8'); for (let x = 0; x < SW; x += 16) fr(x, gy, 1, SH - gy, '#b8b0a8');
  }
}
function drawWedActors(A, mid, gy, T) {
  if (A.ring && A.hus) { const x = Math.round(mid + A.hus.x * CUTK - 12), y = gy - 12; fr(x - 4, y - 3, 9, 7, '#2b1b24'); fr(x - 3, y - 2, 7, 5, '#e8414f'); fr(x - 1, y - 6, 3, 3, '#ffd84a'); fr(x, y - 7, 1, 1, '#ffffff');
    for (let i = 0; i < 4; i++) { const a = T * 3 + i * 1.57; fr(x + Math.cos(a) * 7, y - 6 + Math.sin(a) * 5, 1, 1, '#fff6b0'); } }
  if (A.hus && A.hus.phone) { const x = Math.round(mid + A.hus.x * CUTK - 7), y = gy - 13; fr(x - 2, y - 3, 5, 7, '#2b1b24'); fr(x - 1, y - 2, 3, 5, Math.floor(T * 6) % 2 ? '#b45cff' : '#7a2fc0');
    ctx.globalCompositeOperation = 'lighter'; pc(x, y - 2, 5, 'rgba(180,92,255,0.25)'); ctx.globalCompositeOperation = 'source-over'; }
  if (A.hee && A.hee.wed && A.hee.bouquet) { const x = Math.round(mid + A.hee.x * CUTK + 7), y = gy - 9; drawSpr(ispr('bouquet'), x, y); }
  if (A.bori && A.bori.ring) { const x = Math.round(mid + A.bori.x * CUTK + 6), y = gy - 4; fr(x - 3, y - 3, 7, 5, '#2b1b24'); fr(x - 2, y - 2, 5, 3, '#ffb3d9'); fr(x, y - 4, 1, 2, '#ffd84a'); }
}
const CH4_PROLOGUE = [
  { scene: 'seaS', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -24, pose: 'idle', dir: 'down' }, bori: { x: -48, pose: 'sit', face: 1, y: 2 }, hus: { x: 22, rodUp: true } }); },
    delay: 0.8, lines: [
      { who: 'sys', text: '사직에서 역전승을 본 뒤 어느 주말.\n오빠가 또 유료 바다낚시터에 가자고 했다.' },
      { who: 'hee', text: '…또 낚시? 12시간은 안 돼. 6시간만.', do() { A_().hee.sweat = true; } },
      { who: 'hus', text: '응! 좋아!', do() { A_().hee.sweat = false; } },
      { who: 'sys', text: '해 질 녘. 오빠가 찌낚시대를 꼭 쥔 채\n갑자기 진지해졌다.', do() { A_().hus.rodUp = false; } },
      { who: 'hus', text: '자기야… 그동안 낚시터 따라와 줘서 진짜 고마웠어.\n밤새 모기 물리면서도 옆에 있어 줘서…' },
      { who: 'hus', text: '나랑… 결혼해 줄래?', do() { A_().ring = true; A_().sparkle = true; sfx('ding'); } },
      { who: 'hee', text: '……….', do() { A_().sparkle = false; } },
      { who: 'hee', text: '지금… 여기서?\n미끼 냄새 나는 데서??', do() { A_().hee.shake = true; A_().hee.alert = true; } },
      { who: 'hee', text: '반지는 왜 지렁이 통 옆에서 꺼내는데!!!', do() { A_().hee.shake = false; A_().hee.alert = false; A_().aura = true; sfx('ult'); } },
      { who: 'sys', text: '희수의 멘헤라 게이지가 차오른다…' },
      { who: 'hus', text: '…어? 싫어…?' },
      { who: 'hee', text: '…싫다고는 안 했어. 바보야.', do() { A_().aura = false; A_().sparkle = true; } },
      { who: 'bori', text: '멍멍!! (축하해!)', do() { A_().bori.jump = true; sfx('bark'); } }] },
  { scene: 'whall', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -24, pose: 'idle', dir: 'down' }, bori: { x: -48, pose: 'sit', face: 1, y: 2 }, hus: { x: 24 } }); },
    delay: 0.6, lines: [
      { who: 'sys', text: '그렇게 결혼 준비가 시작됐다.\n첫 번째 관문은 웨딩홀 투어.' },
      { who: 'hee', text: '오빠, 여기 홀 어때? 천장 높고 밝지?' },
      { who: 'hus', text: '응! 좋아!' },
      { who: 'hee', text: '…아까 본 데보다 나아?' },
      { who: 'hus', text: '응! 거기도 좋아!', do() { A_().hee.sweat = true; } },
      { who: 'sys', text: '그때, 상담 데스크에서 견적서가 날아올랐다!', do() { const t = G.time; A_().hee.sweat = false; A_().mons = [{ type: 'quote', x: 70, y: -26, t0: t }, { type: 'planner', x: 92, y: 6, t0: t + 0.3 }, { type: 'addon', x: -84, y: 8, t0: t + 0.5 }]; sfx('pop'); } },
      { who: 'mon', text: '식대는 별도~ 꽃장식도 별도~\n주말 저녁은 할증이에요~♪' },
      { who: 'hee', text: '뭐?????!!!!!!\n처음에 말한 거랑 다르잖아!', do() { A_().hee.shake = true; A_().hee.alert = true; } },
      { who: 'hee', text: '추가금은 내가 다 잘라버린다.', do() { A_().hee.shake = false; A_().hee.alert = false; A_().hee.fist = true; sfx('smash'); } }] },
  { dur: 0.4 }
];
const CH4_DRESS = [
  { scene: 'wdress', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -22, pose: 'idle', dir: 'down', wed: true }, bori: { x: -48, pose: 'sit', face: 1, y: 2 }, hus: { x: 26 } }); },
    delay: 0.6, lines: [
      { who: 'sys', text: '다음은 드레스 투어.\n희수는 드레스를 다섯 벌이나 입어봤다.' },
      { who: 'hee', text: '오빠, 이거 어때? 아까 거랑 비교해서!', do() { A_().sparkle = true; } },
      { who: 'hus', text: '응! 좋아!', do() { A_().sparkle = false; } },
      { who: 'hee', text: '…그럼 이건? 라인이 좀 다르지?' },
      { who: 'hus', text: '너무 좋아!' },
      { who: 'hee', text: '아까 거랑 이거 중에 뭐가 더 좋은데?' },
      { who: 'hus', text: '둘 다 좋아! 다 좋아!' },
      { who: 'sys', text: '오빠는 「좋아」만 말하는\n좋아무새가 되어 버렸다…' },
      { who: 'hee', text: '…나 지금 진지하게 물어보는 거야.\n의견 좀 내라고.', do() { A_().aura = true; sfx('ult'); } },
      { who: 'hus', text: '응! 좋아!' },
      { who: 'hee', text: '…………………………', do() { A_().hee.shake = true; } },
      { who: 'bori', text: '멍…(눈치)' },
      { who: 'sys', text: '그 순간, 피팅룸 마네킹들이 움직이기 시작했다!', do() { const t = G.time; A_().hee.shake = false; A_().aura = false; A_().mons = [{ type: 'mannequin', x: 70, y: 6, t0: t }, { type: 'ribbon', x: -84, y: -24, t0: t + 0.3 }, { type: 'pin', x: 96, y: 8, t0: t + 0.5 }]; sfx('pop'); } },
      { who: 'hee', text: '「좋아」 한 번만 더 하면\n오빠도 마네킹이랑 같이 정리한다.', do() { A_().hee.fist = true; sfx('smash'); } }] },
  { dur: 0.4 }
];
const CH4_STUDIO = [
  { scene: 'wstudio', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -22, pose: 'idle', dir: 'down', wed: true, bouquet: true }, bori: { x: -48, pose: 'sit', face: 1, y: 2 }, hus: { x: 24, tux: true } }); },
    delay: 0.6, lines: [
      { who: 'sys', text: '웨딩 촬영 날.\n오빠는 3개월 동안 10kg 빼기로 약속했었다.' },
      { who: 'hee', text: '오빠, 다이어트 얼마나 했어?' },
      { who: 'hus', text: '…자기야, 그게…' },
      { who: 'sys', text: '툭. 턱시도 단추가 튕겨 나갔다.', do() { A_().big = G.time + 0.2; A_().bigText = '단추가… 안 잠겨…'; A_().bigCol = '#ffd84a'; G.shake = 3; sfx('pop'); } },
      { who: 'hus', text: '야식으로 치킨을 조금… 매일…' },
      { who: 'hee', text: '……3개월 동안 뭐 했어?', do() { A_().big = 0; A_().hee.alert = true; A_().hee.shake = true; } },
      { who: 'hee', text: '사진은 평생 남는 거야.\n오빠는 지금부터 숨 참아.', do() { A_().hee.alert = false; A_().hee.shake = false; A_().aura = true; sfx('ult'); } },
      { who: 'hus', text: '…넵. (흡)' },
      { who: 'sys', text: '그때 플래시 조명들이 번쩍이며 덤벼들었다!', do() { const t = G.time; A_().aura = false; A_().mons = [{ type: 'flashm', x: 72, y: 4, t0: t }, { type: 'camera', x: -86, y: 8, t0: t + 0.3 }, { type: 'reflector', x: 98, y: 6, t0: t + 0.5 }]; sfx('pop'); } }] },
  { dur: 0.4 }
];
const CH4_SELECT = [
  { scene: 'wselect', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -22, pose: 'idle', dir: 'down' }, bori: { x: -48, pose: 'sit', face: 1, y: 2 }, hus: { x: 26 } }); },
    delay: 0.6, lines: [
      { who: 'sys', text: '촬영 사진 셀렉 날.\n수백 장 중에 앨범에 넣을 사진을 골라야 한다.' },
      { who: 'hee', text: '오빠, 이 사진이랑 이 사진 중에 뭐가 나아?' },
      { who: 'hus', text: '응… 좋아…', do() { A_().hus.phone = true; } },
      { who: 'hee', text: '…지금 뭐 해?', do() { A_().hee.sweat = true; } },
      { who: 'hus', text: '아 잠깐만, 이번 판만…\n지금 보스전이라…' },
      { who: 'hee', text: '뭐?????!!!!!!', do() { A_().hee.sweat = false; A_().hee.shake = true; A_().hee.alert = true; G.shake = 4; } },
      { who: 'hee', text: '우리 결혼사진 고르는데\n지금 게임을 해?!', do() { A_().hee.shake = false; A_().hee.alert = false; A_().aura = true; sfx('ult'); } },
      { who: 'sys', text: '그때, 오빠 핸드폰에서\n게임 마왕이 튀어나왔다!', do() { A_().hus.phone = false; A_().aura = false; A_().mons = [{ type: 'gphone', x: 62, y: -40, t0: G.time }]; G.shake = 5; sfx('slam'); } },
      { who: 'mon', text: '크하하! 이 남자의 시간은 이제 내 거다!\n셀렉실은 이제 내 던전이다!' },
      { who: 'sys', text: '가챠 캡슐이 셀렉실에 쏟아졌다.\n모니터 속 결혼사진들이 깜빡인다.', do() { G.shake = 3; sfx('slam'); } },
      { who: 'hus', text: '자, 자기야… 내가 끌게… 지금 끌게…' },
      { who: 'hee', text: '됐고. 사진 다 고를 때까지\n아무 데도 못 가.', do() { A_().hee.fist = true; sfx('smash'); } },
      { who: 'hee', text: '…너부터 지워줄게.' }] },
  { dur: 0.4 }
];
const CH4_ENDING = [
  { scene: 'wwed', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -22, pose: 'idle', dir: 'down', wed: true, bouquet: true }, bori: { x: -46, pose: 'sit', face: 1, y: 2, ring: true }, hus: { x: 22, tux: true } }); },
    delay: 0.8, lines: [
      { who: 'sys', text: '게임 마왕이 쓰러지고,\n앨범 사진도 무사히 다 골랐다.' },
      { who: 'sys', text: '…그리고 대망의 본식 날.' },
      { who: 'hee', text: '오빠, 핸드폰 줘.\n오늘은 내가 들고 있을게.' },
      { who: 'hus', text: '…넵.' },
      { who: 'sys', text: '신부 입장—!', do() { A_().sparkle = true; sfx('ding'); } },
      { who: 'hus', text: '자기야… 진짜 예쁘다.', do() { A_().sparkle = false; } },
      { who: 'hee', text: '…「좋아」 말고 다른 말 해줘서 고마워.', do() { A_().sparkle = true; } },
      { who: 'sys', text: '「신랑은 신부를 평생 아끼고\n사랑하겠습니까?」', do() { A_().sparkle = false; } },
      { who: 'hus', text: '응! 좋아!' },
      { who: 'hee', text: '…………', do() { A_().aura = true; A_().hee.shake = true; } },
      { who: 'hus', text: '아, 아니! 네!!\n평생 잘할게요!!', do() { A_().aura = false; A_().hee.shake = false; } },
      { who: 'hee', text: '오빠, 평생 잘해.', do() { A_().sparkle = true; sfx('ding'); } },
      { who: 'bori', text: '멍멍!! (반지 배달 완료!)', do() { A_().bori.jump = true; sfx('bark'); } },
      { who: 'sys', text: '희수와 오빠는 그렇게 부부가 되었다.', do() { A_().big = G.time + 0.3; A_().bigText = '결혼 축하해요!!'; A_().bigCol = '#ff7ab8'; sfx('lvl'); } },
      { who: 'hus', text: '근데 자기야… 신혼여행은 어디로…?' },
      { who: 'hee', text: '신혼여행지는 내가 정할 거야.\n낚시터만 아니면 다 돼.' }] },
  { dur: 1.0 }
];
