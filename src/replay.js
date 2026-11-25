// ===================== 이야기 다시보기 (11/25) =====================
// 메뉴 「이야기」 탭: 지금까지 본(깬) 장면만 장별로 모아서 다시 보기. 세이브는 안 바뀜.
/** [제목, 장면 배열을 돌려주는 함수, 열렸는지(pd)] — 장면 상수가 뒤 파일에 있어 함수로 감쌈
 * @type {{c: number, name: string, list: [string, () => any[], (pd: any) => boolean][]}[]} */
const REPLAY = [
  { c: 1, name: '1장 · 에버랜드 대탈출', list: [
    ['프롤로그 · 에버랜드 가는 날', () => INTRO, () => true],
    ['엔딩 · 대탈출 성공', () => ENDING, pd => (pd.cleared || 0) > 0]] },
  { c: 2, name: '2장 · 유료 바다낚시터 대소동', list: [
    ['프롤로그 · 주차장', () => CH2_PROLOGUE, pd => !!(pd.ch2 && pd.ch2.intro)],
    ['STAGE 6 · 낮낚시', () => CH2_DAY, pd => rpSeen(pd, 2, 5)],
    ['STAGE 7 · 밤낚시', () => CH2_NIGHT, pd => rpSeen(pd, 2, 6)],
    ['엔딩 · 12시간 낚시 끝', () => CH2_ENDING, pd => rpClear(pd, 2)]] },
  { c: 3, name: '3장 · 사직 야구장 직관 대소동', list: [
    ['프롤로그 · 매표소', () => CH3_PROLOGUE, pd => !!(pd.ch3 && pd.ch3.intro)],
    ['STAGE 10 · 먹거리 존', () => CH3_FOOD, pd => rpSeen(pd, 3, 9)],
    ['STAGE 11 · 1루 응원석', () => CH3_STAND, pd => rpSeen(pd, 3, 10)],
    ['FINAL · 9회말 우천취소', () => CH3_RAIN, pd => rpSeen(pd, 3, 11)],
    ['엔딩 · 끝내기 역전', () => CH3_ENDING, pd => rpClear(pd, 3)]] },
  { c: 4, name: '4장 · 결혼 대작전', list: [
    ['프롤로그 · 낚시터 프러포즈', () => CH4_PROLOGUE, pd => !!(pd.ch4 && pd.ch4.intro)],
    ['STAGE 14 · 드레스 투어', () => CH4_DRESS, pd => rpSeen(pd, 4, 13)],
    ['STAGE 15 · 웨딩 촬영', () => CH4_STUDIO, pd => rpSeen(pd, 4, 14)],
    ['FINAL · 사진 셀렉', () => CH4_SELECT, pd => rpSeen(pd, 4, 15)],
    ['엔딩 · 본식', () => CH4_ENDING, pd => rpClear(pd, 4)]] }
];
const rpSeen = (pd, c, z) => { const P = pd[chKey(c)]; return !!(P && ((P.seen && P.seen[z]) || P.cleared > 0)); };
const rpClear = (pd, c) => { const P = pd[chKey(c)]; return !!(P && P.cleared > 0); };
function replayHtml(pd) {
  let n = 0;
  const body = REPLAY.map(ch => {
    const open = ch.c === 1 || chOpen(pd, ch.c) || ch.list.some(it => it[2](pd)); if (!open) return '';
    const rows = ch.list.map((it, i) => { const ok = it[2](pd); if (ok) n++;
      return `<button class="rprow${ok ? '' : ' lock'}" data-m="replay" data-v="${ch.c}:${i}" ${ok ? '' : 'disabled'}><b>${ok ? '▶' : '🔒'}</b><span>${it[0]}</span>${ok ? '' : '<small>아직 안 본 이야기</small>'}</button>`; }).join('');
    return `<h3>${ch.name}</h3><div class="rplist">${rows}</div>`;
  }).join('');
  return `<p class="ds" style="margin:0 2px 8px">지금까지 본 이야기 <b>${n}</b>편을 다시 볼 수 있어요. 대사는 화면을 누르면 넘어가고, 건너뛰기도 돼요.</p>` + body;
}
/** v = "장:번호" */
function replayPlay(v) {
  const [c, i] = String(v).split(':').map(Number), ch = REPLAY.find(x => x.c === c), it = ch && ch.list[i];
  if (!it || !it[2](G.pd)) return;
  const fromLobby = G.state === 'lobbyMenu'; $('#menu').hidden = true; if (fromLobby) saveGame();
  const back = () => {
    if (fromLobby) { G.state = 'title'; showTitle(); setTimeout(() => lobbyMenu('story'), 0); return; }
    G.state = 'menu'; showHUD(true); playBgm('field'); MTAB = 'story'; $('#menu').hidden = false; renderMenu(true);
  };
  sfx('select'); fadeTo(() => playCut(it[1](), () => fadeTo(back)));
}
