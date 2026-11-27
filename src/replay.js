// ===================== 이야기 다시보기 (11/25) =====================
// 메뉴 「이야기」 탭: 지금까지 본(깬) 장면만 장별로 모아서 다시 보기. 세이브는 안 바뀜.
/** 장별 [제목, 장면, 열렸는지(pd)] — 장 파일(src/chapters/chN.js)의 story 에서 만듦: 프롤로그 · 스테이지 입장 이야기 · 엔딩
 * @type {{c: number, name: string, list: [string, () => any[], (pd: any) => boolean][]}[]} */
const REPLAY = CHAPTERS.filter(Boolean).map(ch => { const c = ch.c, S = ch.story; return { c, name: ch.title, list: [
  [S.prologue[0], () => S.prologue[1], pd => c === 1 || !!(pd[chKey(c)] && pd[chKey(c)].intro)],
  ...Object.keys(S.stages).map(i => /** @type {[string, () => any[], (pd: any) => boolean]} */ ([S.stages[i][0], () => S.stages[i][1], pd => rpSeen(pd, c, CH_Z0[c] + Number(i))])),
  [S.ending[0], () => S.ending[1], pd => c === 1 ? (pd.cleared || 0) > 0 : rpClear(pd, c)]] }; });
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
