// ===================== 챕터 (1장 에버랜드 · 2장 유료 바다낚시터 · 3장 사직 야구장 · 4장 결혼 대작전) =====================
// ZONES 0~3 = 1장, 4~7 = 2장, 8~11 = 3장. 진행도: 1장 pd.zone/pd.cleared, 2장 pd.ch2, 3장 pd.ch3 ({zone, cleared, intro, seen}). 지금 고른 장 pd.chap
// 2장은 1장 5회차 수준(Lv30), 3장은 1장 9회차 수준(Lv50)에서 시작해 그 장 회차마다 오름
const CH1_N = 4, CH2_Z0 = 4, CH3_Z0 = 8, CH4_Z0 = 12, CH2_BASE_L = 9, CH3_BASE_L = 20, CH4_BASE_L = 24, CH2_LV = 30, CH3_LV = 50, CH4_LV = 50;
const CH_Z0 = { 1: 0, 2: CH2_Z0, 3: CH3_Z0, 4: CH4_Z0 }, CH_BASE_L = { 1: 0, 2: CH2_BASE_L, 3: CH3_BASE_L, 4: CH4_BASE_L };
const CH_NAME = { 1: '에버랜드', 2: '바다낚시터', 3: '사직 야구장', 4: '결혼 대작전' };
const zoneCh = z => z >= CH4_Z0 ? 4 : z >= CH3_Z0 ? 3 : z >= CH2_Z0 ? 2 : 1;
const chLast = c => CH_Z0[c] + 3;
const isChLast = z => z >= chLast(zoneCh(z));
const ch2Open = pd => !!pd && (pd.cleared || 0) >= 1 && (pd.lv >= CH2_LV || (pd.aw || 0) > 0);
const ch3Open = pd => !!pd && !!(pd.ch2 && pd.ch2.cleared >= 1) && pd.lv >= CH3_LV;
const ch4Open = pd => !!pd && !!(pd.ch3 && pd.ch3.cleared >= 1) && pd.lv >= CH4_LV;
const chOpen = (pd, c) => c === 1 ? !!pd : c === 2 ? ch2Open(pd) : c === 3 ? ch3Open(pd) : ch4Open(pd);
/** 2~4장 진행도 키 */
const chKey = c => 'ch' + c;
/** 2~4장 진행도 (없으면 만듦) */
const chOf = (pd, c) => { const k = chKey(c); return pd[k] || (pd[k] = { zone: CH_Z0[c], cleared: 0 }); };
const ch2Of = pd => chOf(pd, 2);
const chCleared = (pd, z) => { const c = zoneCh(z); return c === 1 ? (pd.cleared || 0) : ((pd[chKey(c)] || {}).cleared || 0); };
/** 그 스테이지의 난이도 단계 (몬스터 능력치·보상·드롭 등급) */
const zoneL = (pd, z) => CH_BASE_L[zoneCh(z)] + loopEff(chCleared(pd, z));
/** 「모험 계속하기」로 갈 스테이지 */
const curZone = pd => { const c = pd.chap || 1; return c > 1 && chOpen(pd, c) ? chOf(pd, c).zone : (pd.zone || 0); };
function setCurZone(pd, z) { const c = zoneCh(z); if (c === 1) pd.zone = z; else chOf(pd, c).zone = z; pd.chap = c; }
const zoneTitle = (pd, z) => { const c = chCleared(pd, z); return (c ? `${c + 1}회차 · ` : '') + ZONES[z].name; };

/** 로비 챕터 고르기 */
function chapterPickHtml(pd) {
  if (FORCE_EASY || !pd || !pd.cleared) return '';
  const cur = chOpen(pd, pd.chap || 1) ? (pd.chap || 1) : 1, show3 = !!(pd.ch2 && pd.ch2.cleared), show4 = !!(pd.ch3 && pd.ch3.cleared);
  const btn = (c, label, need) => { const open = chOpen(pd, c), fresh = c > 1 && open && !pd[chKey(c)]; return `<button class="tch${cur === c ? ' on' : ''}${open ? '' : ' lock'}" data-ch="${c}"><b>${c}장</b> ${label}${fresh ? ' <em>NEW</em>' : ''}${open ? '' : ` <small>${need}</small>`}</button>`; };
  return `<div class="tchap${show4 ? ' c4' : show3 ? ' c3' : ''}">${btn(1, '에버랜드', '')}${btn(2, show3 ? '낚시터' : '바다낚시터', `Lv${CH2_LV}`)}${show3 ? btn(3, '야구장', `Lv${CH3_LV}`) : ''}${show4 ? btn(4, '결혼식', `Lv${CH4_LV}`) : ''}</div>`;
}
function chapterPick(c) {
  const pd = loadGame(); if (!pd) return;
  if (c === 2 && !ch2Open(pd)) { toast(`2장은 Lv${CH2_LV}부터 열려요 (1장을 깬 뒤)`, 'sub'); return; }
  if (c === 3 && !ch3Open(pd)) { toast(`3장은 Lv${CH3_LV}부터 열려요 (2장을 깬 뒤)`, 'sub'); return; }
  if (c === 4 && !ch4Open(pd)) { toast(`4장은 Lv${CH4_LV}부터 열려요 (3장을 깬 뒤)`, 'sub'); return; }
  pd.chap = c; G.pd = pd; saveGame(); sfx('select'); showTitle();
}
/** 「모험 계속하기」: 2·3장 처음이면 프롤로그부터 */
function adventureGo(pd) {
  G.pd = pd; const z = curZone(pd), c = zoneCh(z);
  if (c > 1 && !chOf(pd, c).intro) { chOf(pd, c).intro = 1; saveGame(); $('#title').hidden = true; playCut(c === 4 ? CH4_PROLOGUE : c === 3 ? CH3_PROLOGUE : CH2_PROLOGUE, () => fadeTo(() => startZone(CH_Z0[c]))); return; }
  $('#title').hidden = true; fadeTo(() => startZone(z));
}
/** 2·3장 스테이지에 처음 들어갈 때 이야기 (스테이지별 한 번, 자동사냥이어도) */
function chStageStory(z) {
  const c = zoneCh(z); if (c === 1) return null; const P = G.pd[chKey(c)]; if (!P) return null;
  P.seen = P.seen || {}; const story = c === 2 ? (z === 5 ? CH2_DAY : z === 6 ? CH2_NIGHT : null) : c === 3 ? (z === 9 ? CH3_FOOD : z === 10 ? CH3_STAND : z === 11 ? CH3_RAIN : null)
    : (z === 13 ? CH4_DRESS : z === 14 ? CH4_STUDIO : z === 15 ? CH4_SELECT : null);
  if (!story || P.seen[z]) return null; P.seen[z] = 1; return story;
}
const ch2StageStory = chStageStory;
/** 2·3장 마지막 보스를 잡고 출구로 */
function chFinish(c) {
  const P = chOf(G.pd, c), first = !P.cleared, z0 = CH_Z0[c], END = c === 4 ? CH4_ENDING : c === 3 ? CH3_ENDING : CH2_ENDING; P.cleared++; P.zone = z0; G.pd.chap = c;
  if (G.auto && !first) { saveGame(); fadeTo(() => { showHUD(false); playCut(END, () => fadeTo(() => { G.auto = true; startZone(z0); toast(`🎉 ${c}장 ${P.cleared}회차 클리어! 자동사냥으로 ${P.cleared + 1}회차 시작`, 'lvl'); })); }); return; }
  saveGame(); fadeTo(() => { showHUD(false); playCut(END, () => showEndCh(c)); });
}
const ch2Finish = () => chFinish(2);
function showEndCh(c) {
  const P = chOf(G.pd, c), z0 = CH_Z0[c]; G.state = 'end'; const s = G.pd.stats; showHUD(false);
  $('#endScr h2').textContent = c === 4 ? '4장 · 결혼 대작전' : c === 3 ? '3장 · 사직 야구장 직관 대소동' : '2장 · 유료 바다낚시터 대소동';
  const lv = `최종 레벨 <b>Lv.${G.pd.lv}</b>${G.pd.aw ? ` ★${G.pd.aw}` : ''}<br>처치한 몬스터 <b>${s.kills.toLocaleString()}</b>마리`;
  $('#endStats').innerHTML = c === 4 ? `결혼식 <b>1</b>번 · 「좋아」 <b>셀 수 없음</b><br>${lv}<br><br><b>신혼여행지는 희수 마음대로!</b><br><small>5장에서 계속…</small>` : c === 3 ? `9회말 역전승 <b>1</b>번<br>${lv}<br><br><b>오빠가 낚시터에서 할 말이 있대…!</b><br><small>4장에서 계속…</small>`
    : `구출한 오빠 <b>1</b>명<br>${lv}<br><br><b>다음 데이트는 희수 마음대로!</b><br><small>3장에서 계속…</small>`;
  $('#endBtns').innerHTML = `<button class="btn pk" id="eAgain">${c}장 ${P.cleared + 1}회차 시작<small>${c === 4 ? '결혼은 한 번이지만 결혼 준비는 여러 번' : c === 3 ? '다음 경기가 기다려요' : '더 큰 대물이 기다려요'}</small></button><button class="btn wh" id="eTitle">로비로</button>`;
  $('#endScr').hidden = false;
  $('#eAgain').onclick = () => { $('#endScr').hidden = true; setCurZone(G.pd, z0); saveGame(); fadeTo(() => startZone(z0)); };
  $('#eTitle').onclick = () => { $('#endScr').hidden = true; setCurZone(G.pd, z0); saveGame(); showTitle(); };
}
const showEnd2 = () => showEndCh(2);
