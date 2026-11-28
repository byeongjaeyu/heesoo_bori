// ===================== 장 진행: 로비 장 고르기 · 모험 계속하기 · 스테이지 입장 이야기 · 장 클리어·엔딩 화면 =====================


import { $ } from '../sys/dom.js';
import { sfx } from '../sys/audio.js';
import { CHAPTERS, CH_Z0, chClr, chKey, chKeys, chOf, chOpen, curZone, setCurZone, zoneCh } from '../core/chapter.js';
import { G } from '../core/state.js';
import { loadGame, saveGame } from '../core/save.js';
import { startZone } from './zone.js';
import { fadeTo, toast } from '../ui/dialog.js';
import { showHUD } from '../ui/hud.js';
import { showTitle } from '../ui/lobby.js';
import { playCut } from '../story/story.js';
import { tt } from '../sys/i18n.js';

/** 로비 챕터 고르기: 2장은 1장을 깨면, 그 뒤 장은 앞 장을 깨면 버튼이 보임 */
export function chapterPickHtml(pd) {
  if (FORCE_EASY || !pd || !pd.cleared) return '';
  const cur = chOpen(pd, pd.chap || 1) ? (pd.chap || 1) : 1;
  const shown = chKeys().filter(c => c <= 2 || chClr(pd, c - 1) >= 1), n = shown.length, sep = n >= 4 ? '<br>' : ' ';
  const btn = c => { const def = CHAPTERS[c], open = chOpen(pd, c), fresh = c > 1 && open && !pd[chKey(c)], label = def.pick[n >= 3 ? 1 : 0];
    return tt('play/chapter-flow.1', { v1: cur === c ? ' on' : '', v2: open ? '' : ' lock', c, sep, label, v3: fresh ? ' <em>NEW</em>' : '', v4: open ? '' : `${sep}<small>Lv${def.lv}</small>` }); };
  return `<div class="tchap${n >= 4 ? ' c4' : n === 3 ? ' c3' : ''}">${shown.map(btn).join('')}</div>`;
}
export function chapterPick(c) {
  const pd = loadGame(); if (!pd) return;
  if (!chOpen(pd, c)) { toast(tt('play/chapter-flow.2', { c, lv: CHAPTERS[c].lv, v1: c - 1 }), 'sub'); return; }
  pd.chap = c; G.pd = pd; saveGame(); sfx('select'); showTitle();
}
/** 「모험 계속하기」: 2장 이상 처음이면 프롤로그부터 */
export function adventureGo(pd) {
  G.pd = pd; const z = curZone(pd), c = zoneCh(z);
  if (c > 1 && !chOf(pd, c).intro) { chOf(pd, c).intro = 1; saveGame(); $('#title').hidden = true; playCut(CHAPTERS[c].story.prologue[1], () => fadeTo(() => startZone(CH_Z0[c]))); return; }
  $('#title').hidden = true; fadeTo(() => startZone(z));
}
/** 2장 이상 스테이지에 처음 들어갈 때 이야기 (스테이지별 한 번, 자동사냥이어도). 본 기록은 스테이지 번호(z)로 저장 */
export function chStageStory(z) {
  const c = zoneCh(z); if (c === 1) return null; const P = G.pd[chKey(c)]; if (!P) return null;
  P.seen = P.seen || {}; const s = CHAPTERS[c].story.stages[z - CH_Z0[c]], story = s && s[1];
  if (!story || P.seen[z]) return null; P.seen[z] = 1; return story;
}
/** 2장 이상 마지막 보스를 잡고 출구로 */
export function chFinish(c) {
  const P = chOf(G.pd, c), first = !P.cleared, z0 = CH_Z0[c], END = CHAPTERS[c].story.ending[1]; P.cleared++; P.zone = z0; G.pd.chap = c;
  if (G.auto && !first) { saveGame(); fadeTo(() => { showHUD(false); playCut(END, () => fadeTo(() => { G.auto = true; startZone(z0); toast(tt('play/chapter-flow.3', { c, cleared: P.cleared, v1: P.cleared + 1 }), 'lvl'); })); }); return; }
  saveGame(); fadeTo(() => { showHUD(false); playCut(END, () => showEndCh(c)); });
}
function showEndCh(c) {
  const def = CHAPTERS[c], P = chOf(G.pd, c), z0 = CH_Z0[c]; G.state = 'end'; const s = G.pd.stats; showHUD(false);
  $('#endScr h2').textContent = def.title;
  const lv = tt('play/chapter-flow.4', { lv: G.pd.lv, v1: G.pd.aw ? ` ★${G.pd.aw}` : '', v2: s.kills.toLocaleString() });
  $('#endStats').innerHTML = def.end.stats(lv);
  $('#endBtns').innerHTML = tt('play/chapter-flow.5', { c, v1: P.cleared + 1, again: def.end.again });
  $('#endScr').hidden = false;
  $('#eAgain').onclick = () => { $('#endScr').hidden = true; setCurZone(G.pd, z0); saveGame(); fadeTo(() => startZone(z0)); };
  $('#eTitle').onclick = () => { $('#endScr').hidden = true; setCurZone(G.pd, z0); saveGame(); showTitle(); };
}
