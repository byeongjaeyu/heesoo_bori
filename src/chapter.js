// ===================== 챕터 (1장 에버랜드 · 2장 유료 바다낚시터) =====================
// ZONES 0~3 = 1장, 4~7 = 2장. 진행도: 1장 pd.zone/pd.cleared, 2장 pd.ch2 {zone, cleared, intro}. 지금 고른 장 pd.chap
// 2장은 1장 5회차 수준(Lv30 기준) 난이도에서 시작해 2장 회차마다 오름
const CH2_Z0 = 4, CH2_BASE_L = 4, CH1_N = 4, CH2_LV = 30;
const zoneCh = z => z >= CH2_Z0 ? 2 : 1;
const chLast = c => c === 2 ? CH2_Z0 + 3 : 3;
const isChLast = z => z >= chLast(zoneCh(z));
const ch2Open = pd => !!pd && (pd.cleared || 0) >= 1 && (pd.lv >= CH2_LV || (pd.aw || 0) > 0);
const ch2Of = pd => pd.ch2 || (pd.ch2 = { zone: CH2_Z0, cleared: 0 });
const chCleared = (pd, z) => zoneCh(z) === 2 ? ((pd.ch2 && pd.ch2.cleared) || 0) : (pd.cleared || 0);
/** 그 스테이지의 난이도 단계 (몬스터 능력치·보상·드롭 등급) */
const zoneL = (pd, z) => zoneCh(z) === 2 ? CH2_BASE_L + loopEff(chCleared(pd, z)) : loopEff(pd.cleared || 0);
/** 「모험 계속하기」로 갈 스테이지 */
const curZone = pd => pd.chap === 2 && ch2Open(pd) ? ch2Of(pd).zone : (pd.zone || 0);
function setCurZone(pd, z) { if (zoneCh(z) === 2) { ch2Of(pd).zone = z; pd.chap = 2; } else { pd.zone = z; pd.chap = 1; } }
const zoneTitle = (pd, z) => { const c = chCleared(pd, z); return (c ? `${c + 1}회차 · ` : '') + ZONES[z].name; };

/** 로비 챕터 고르기 */
function chapterPickHtml(pd) {
  if (FORCE_EASY || !pd || !pd.cleared) return '';
  const open = ch2Open(pd), c2 = pd.chap === 2 && open;
  return `<div class="tchap"><button class="tch${c2 ? '' : ' on'}" data-ch="1"><b>1장</b> 에버랜드</button>`
    + `<button class="tch${c2 ? ' on' : ''}${open ? '' : ' lock'}" data-ch="2"><b>2장</b> 바다낚시터${open ? (pd.ch2 ? '' : ' <em>NEW</em>') : ` <small>Lv${CH2_LV}</small>`}</button></div>`;
}
function chapterPick(c) {
  const pd = loadGame(); if (!pd) return;
  if (c === 2 && !ch2Open(pd)) { toast(`2장은 Lv${CH2_LV}부터 열려요 (1장을 깬 뒤)`, 'sub'); return; }
  pd.chap = c; G.pd = pd; saveGame(); sfx('select'); showTitle();
}
/** 「모험 계속하기」: 2장 처음이면 프롤로그부터 */
function adventureGo(pd) {
  G.pd = pd; const z = curZone(pd);
  if (zoneCh(z) === 2 && !ch2Of(pd).intro) { pd.ch2.intro = 1; saveGame(); $('#title').hidden = true; playCut(CH2_PROLOGUE, () => fadeTo(() => startZone(CH2_Z0))); return; }
  $('#title').hidden = true; fadeTo(() => startZone(z));
}
/** 2장 스테이지에 처음 들어갈 때 이야기 (첫 회차, 자동사냥 아닐 때만) */
function ch2StageStory(z) {
  const c2 = G.pd.ch2; if (!c2 || c2.cleared || G.auto) return null;
  c2.seen = c2.seen || {}; if (c2.seen[z]) return null; c2.seen[z] = 1;
  return z === 5 ? CH2_DAY : z === 6 ? CH2_NIGHT : null;
}
/** 2장 마지막 보스를 잡고 출구로 */
function ch2Finish() {
  const c2 = ch2Of(G.pd), first = !c2.cleared; c2.cleared++; c2.zone = CH2_Z0; G.pd.chap = 2;
  if (G.auto && !first) { saveGame(); fadeTo(() => { startZone(CH2_Z0); toast(`🎉 2장 ${c2.cleared}회차 클리어! 자동사냥으로 ${c2.cleared + 1}회차 시작`, 'lvl'); }); return; }
  saveGame(); fadeTo(() => { showHUD(false); playCut(CH2_ENDING, () => showEnd2()); });
}
function showEnd2() {
  G.state = 'end'; $('#endScr h2').textContent = '2장 · 유료 바다낚시터 대소동'; const s = G.pd.stats, c = G.pd.ch2.cleared; showHUD(false);
  $('#endStats').innerHTML = `구출한 오빠 <b>1</b>명<br>최종 레벨 <b>Lv.${G.pd.lv}</b>${G.pd.aw ? ` ★${G.pd.aw}` : ''}<br>처치한 몬스터 <b>${s.kills.toLocaleString()}</b>마리<br><br><b>다음 데이트는 희수 마음대로!</b><br><small>3장에서 계속…</small>`;
  $('#endBtns').innerHTML = `<button class="btn pk" id="eAgain">2장 ${c + 1}회차 시작<small>더 큰 대물이 기다려요</small></button><button class="btn wh" id="eTitle">로비로</button>`;
  $('#endScr').hidden = false;
  $('#eAgain').onclick = () => { $('#endScr').hidden = true; setCurZone(G.pd, CH2_Z0); saveGame(); fadeTo(() => startZone(CH2_Z0)); };
  $('#eTitle').onclick = () => { $('#endScr').hidden = true; setCurZone(G.pd, CH2_Z0); saveGame(); showTitle(); };
}
