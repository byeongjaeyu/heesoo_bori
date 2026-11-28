// ===================== 로비(타이틀)·결과 화면 =====================
// ---------- screens ----------


import { ICONS } from '../draw/sprites.js';
import { $ } from '../sys/dom.js';
import { fmtTime } from '../core/util.js';
import { iconURL } from '../draw/sprite.js';
import { SND, audioInit, playBgm, setSound, sfx } from '../sys/audio.js';
import { curZone, setCurZone, zoneCh, zoneTitle } from '../core/chapter.js';
import { adventureGo, chapterPick, chapterPickHtml } from '../play/chapter-flow.js';
import { ENDING, INTRO } from '../chapters/ch1.js';
import { G } from '../core/state.js';
import { hasSave, loadGame, newPD, saveGame } from '../core/save.js';
import { calcStats, visEq } from '../core/items.js';
import { towerBest } from '../core/progress.js';
import { respawn, startZone } from '../play/zone.js';
import { JOBS, JOB_LV, jobOf } from '../core/job.js';
import { jobTag, jobTileHtml } from '../features/job.js';
import { dlgTap, fadeTo } from './dialog.js';
import { showHUD } from './hud.js';
import { lobbyMenu, menuClick, openMenu, updateSndBtn } from './menu.js';
import { PV, esc, pvpClick, pvpFaceURL, pvpNickSave, pvpOpen, pvpResClick, pvpSnap } from '../net/pvp.js';
import { startInfinite } from '../play/inf.js';
import { RK, entryRegister, rankClose, rankOpen, rankSync, rankTab } from '../net/rank.js';
import { cloudOpen } from '../net/cloud.js';
import { accGateShow } from '../net/account.js';
import { aucOpen } from '../net/auction.js';
import { dailyAutoOpen, dailyClaimable, dailyOpen } from '../features/daily.js';
import { shareOpen } from '../features/share.js';
import { RAID, raidBossURL, raidOpen } from '../net/raid.js';
import { achTag } from '../features/achv.js';
import { idleClaim, idleTileHtml } from '../features/idle.js';
import { pack2Open, pack2Seen, packOpen, packSeen, packTileHtml } from '../features/pack.js';
import { msOpen, msTileHtml } from '../features/goal.js';
import { towerOpen } from '../play/tower.js';
import { plazaLeave, plazaOpen } from '../net/plaza.js';
import { endCut, playCut } from '../story/story.js';
import { E2KEY, e2Go, e2HideAll, e2MenuClick, e2Open, e2Pause, e2PauseClick, e2ResClick } from '../minigame/ep2core.js';
import { tt, langNext, langToggle } from '../sys/i18n.js';

export let TITLE_PD = /** @type {any} */ (null);
export function setTitlePd(pd) { TITLE_PD = pd; }
/** 로비 양옆 버튼 줄 위치: 왼쪽은 프로필 아래, 오른쪽은 로고 아래 (화면 높이·칭호 유무와 상관없이 안 겹치게) */
function titleLayout() {
  if (FORCE_EASY || $('#title').hidden) return;
  const top0 = $('#title').getBoundingClientRect().top, tb = $('#tbar').getBoundingClientRect().bottom - top0, lg = $('.ttl h1').getBoundingClientRect().bottom - top0;
  $('#tsideL').style.top = Math.round(tb + 8) + 'px';
  // 오른쪽 줄도 상단(프로필 줄 바로 아래)부터 — 로고 글자와 가로로 겹칠 때만 로고 아래로
  const R0 = $('#tsideR'); R0.style.transform = ''; R0.style.top = Math.round(tb + 8) + 'px';
  { // 로고는 양옆 줄 사이에 들어가게 글자 크기를 줄임 (가운데 기준 양쪽 여유 중 좁은 쪽)
    const h1 = $('.ttl h1'); h1.style.fontSize = ''; const lr = h1.getBoundingClientRect(), cx = lr.left + lr.width / 2;
    const room = Math.min(cx - $('#tsideL').getBoundingClientRect().right, R0.getBoundingClientRect().left - cx) - 6, half = lr.width / 2;
    if (half > room && room > 20) h1.style.fontSize = (parseFloat(getComputedStyle(h1).fontSize) * room / half).toFixed(1) + 'px';
  }
  // 양옆 줄이 아래 모드 타일에 닿으면 작게(좁은·낮은 화면)
  const lim = $('#tbtns').getBoundingClientRect().top - 6;
  for (const S of [$('#tsideR'), $('#tsideL')]) {
    S.style.transform = ''; S.classList.remove('tight'); if (S.getBoundingClientRect().bottom > lim) S.classList.add('tight');
    // 작게 해도 넘치면(프로필에 칭호·직업이 붙어 길어진 경우 등) 줄 전체를 비율로 줄임
    const b = S.getBoundingClientRect(); if (b.bottom > lim && b.height > 0) { S.style.transformOrigin = S.id === 'tsideR' ? 'top right' : 'top left'; S.style.transform = `scale(${Math.max(0.55, (lim - b.top) / b.height).toFixed(3)})`; }
  }
}
// 타일 글이 바뀌어 높이가 달라질 때(방치 보상 시간·회차 보상 등)도 다시 맞춤
let TL_RAF = 0;
if (typeof ResizeObserver === 'function') { const ro = new ResizeObserver(() => { cancelAnimationFrame(TL_RAF); TL_RAF = requestAnimationFrame(() => { try { titleLayout(); } catch (e) { } }); }); for (const id of ['#tbar', '#tbtns', '#tsideR', '#tsideL']) { const el = $(id); if (el) ro.observe(el); } }
addEventListener('resize', () => { try { titleLayout(); } catch (e) { } });
export function showTitle() {
  if (typeof rankSync === 'function') { rankSync(); entryRegister(); dailyAutoOpen(); }
  if (G.plaza) plazaLeave(true);
  if (typeof accGateShow === 'function') setTimeout(accGateShow, 0);
  G.inf = null; G.raid = null; G.tower = null; G.auto = false; G.autoMove = null; G.state = 'title'; showHUD(false); if (typeof e2HideAll === 'function') e2HideAll(); $('#title').hidden = false; $('#endScr').hidden = true; $('#death').hidden = true; $('#dlg').hidden = true; $('#skip').hidden = true; $('#mission').hidden = true;
  const saved = hasSave() ? loadGame() : null;
  let e2s = null; try { e2s = JSON.parse(localStorage.getItem(E2KEY) || 'null'); } catch (e) { }
  const e2n = e2s ? (e2s.stars || []).reduce((a, b) => a + (b || 0), 0) : 0;
  if (FORCE_EASY) {
    $('#tbar').innerHTML = $('#tsideL').innerHTML = $('#tsideR').innerHTML = '';
    $('#tbtns').innerHTML = tt('ui/lobby.33', { v1: e2s ? tt('ui/lobby.1') : tt('ui/lobby.2'), v2: e2s ? tt('ui/lobby.3') + e2n + '/24' : tt('ui/lobby.4'), v3: SND.on ? tt('ui/lobby.5') : tt('ui/lobby.6') });
    $('#tEp2').onclick = () => { audioInit(); e2Open(); };
    $('#tSnd').onclick = () => { audioInit(); setSound(!SND.on); showTitle(); };
    playBgm('story'); return;
  }
  if (saved) { packSeen(saved); pack2Seen(saved); }
  TITLE_PD = saved; const I = (k, ic) => `<img src="${iconURL('i_' + k, ICONS[ic || k])}" alt="">`;
  // 상단: 내 희수 정보 + 소리
  let prof = '';
  if (saved) { let pw = 0; const keep = G.pd; try { G.pd = saved; pw = pvpSnap().power; } catch (e) { } G.pd = keep; G.st = null;
    const nick = (typeof PV !== 'undefined' && PV.me && PV.me.nickname) || tt('ui/lobby.7');
    prof = tt('ui/lobby.34', { v1: pvpFaceURL(visEq(saved), saved.look && saved.look.hair), v2: saved.title && (saved.ach || {})[saved.title] ? achTag(saved.title) : '', v3: jobTag(jobOf(saved)), v4: esc(nick), lv: saved.lv, v5: saved.aw ? ' ★' + saved.aw : '', v6: saved.cleared ? ' · ' + (saved.cleared + 1) + tt('ui/lobby.8') : '', v7: pw.toLocaleString() }); }
  $('#tbar').innerHTML = prof + (saved ? packTileHtml(saved) + jobTileHtml(saved) : '') + tt('ui/lobby.35', { v1: SND.on ? '' : ' off', v2: I('sound'), v3: SND.on ? tt('ui/lobby.9') : tt('ui/lobby.10') });
  // 왼쪽 세로 아이콘
  const bagDot = saved && ((saved.lv >= JOB_LV && !JOBS[saved.job]) || saved.sp > 0 || saved.newItem || saved.newBori || saved.achNew || (saved.ap || 0) > 0);
  $('#tsideL').innerHTML = (saved ? tt('ui/lobby.11', { v1: I('bag'), v2: bagDot ? '<em class="dot"></em>' : '' }) : '') + (saved ? tt('ui/lobby.12', { v1: I('cal'), v2: dailyClaimable(saved) ? '<em class="dot"></em>' : '' }) : '')
    + tt('ui/lobby.13', { v1: I('trophy') })
    + (saved ? tt('ui/lobby.14', { v1: I('camera') }) : '')
    + (saved ? tt('ui/lobby.15', { v1: I('auc') }) : '')
    + tt('ui/lobby.16', { v1: I('phone') })
    + `<button class="ticon tlang" id="tLang"><b class="tlg">${langNext().code}</b><small>${langNext().name}</small></button>`;
  // 오른쪽: 방치 보상·회차 보상 (미니게임 「보리 주세요」는 11/27 메인에서 뺌 — 원터치판에만, 나중에 새로 만들 예정)
  $('#tsideR').innerHTML = saved ? idleTileHtml(saved) + msTileHtml(saved) : '';
  // 하단: 모드 타일 + 시작
  const rb = (typeof RAID !== 'undefined' && RAID.info && RAID.info.boss) || 'boss4';
  $('#tbtns').innerHTML = (saved ? `<div class="tmodes">`
    + tt('ui/lobby.36', { v1: I('pumpkin'), v2: saved.infBest ? tt('ui/lobby.17') + saved.infBest : tt('ui/lobby.18') })
    + tt('ui/lobby.19', { v1: I('swords') })
    + tt('ui/lobby.20', { v1: raidBossURL(rb) })
    + tt('ui/lobby.37', { v1: I('tower'), v2: towerBest(saved) ? tt('ui/lobby.21') + towerBest(saved) + tt('ui/lobby.22') : tt('ui/lobby.23') }) : '')
    + (saved ? chapterPickHtml(saved) + tt('ui/lobby.38', { v1: I('chat'), v2: zoneCh(curZone(saved)) === 2 ? tt('ui/lobby.24') : '', v3: zoneTitle(saved, curZone(saved)), lv: saved.lv })
      : tt('ui/lobby.25'));
  if ($('#tPack')) $('#tPack').onclick = () => { audioInit(); packOpen(); };
  if ($('#tJob')) $('#tJob').onclick = () => { audioInit(); lobbyMenu('job'); };
  if ($('#tPack2')) $('#tPack2').onclick = () => { audioInit(); pack2Open(); };
  if ($('#tIdle')) $('#tIdle').onclick = () => { audioInit(); idleClaim(); };
  if ($('#tGoal')) $('#tGoal').onclick = () => { audioInit(); sfx('select'); msOpen(); };
  if ($('#tTower')) $('#tTower').onclick = () => { audioInit(); towerOpen(); };
  if (saved) { $('#tRaid').onclick = () => { audioInit(); raidOpen(); }; $('#tPvp').onclick = () => { audioInit(); pvpOpen(); }; $('#tInf').onclick = () => { audioInit(); fadeTo(startInfinite, tt('ui/lobby.26')); };
    $('#tShare').onclick = () => { audioInit(); shareOpen(); };
    $('#tBag').onclick = () => { audioInit(); sfx('select'); lobbyMenu(); };
    $('.tprof').onclick = () => { audioInit(); sfx('select'); lobbyMenu('info'); };
    $('#tCont').onclick = () => { audioInit(); adventureGo(loadGame() || saved); };
    for (const b of document.querySelectorAll('.tch')) /** @type {HTMLElement} */ (b).onclick = () => { audioInit(); chapterPick(+b.getAttribute('data-ch')); }; }
  $('#tRank').onclick = () => { audioInit(); rankOpen('title'); };
  $('#tCloud').onclick = () => { audioInit(); cloudOpen('title'); };
  if ($('#tLang')) $('#tLang').onclick = () => langToggle();
  if ($('#tAuc')) $('#tAuc').onclick = () => { audioInit(); aucOpen(); };
  if ($('#tDaily')) $('#tDaily').onclick = () => { audioInit(); dailyOpen(); };
  if ($('#tPlaza')) $('#tPlaza').onclick = () => { audioInit(); sfx('select'); plazaOpen(); };
  if ($('#tNew')) $('#tNew').onclick = () => { audioInit(); newGame(); };
  $('#tSnd').onclick = () => { audioInit(); setSound(!SND.on); showTitle(); };
  titleLayout(); requestAnimationFrame(() => titleLayout()); setTimeout(() => { try { titleLayout(); } catch (e) { } }, 400); if (document.fonts) document.fonts.ready.then(() => { try { titleLayout(); } catch (e) { } });
  playBgm('story');
}
export function newGame() { G.pd = newPD(); saveGame(); $('#title').hidden = true; G.world = null; calcStats(); playCut(INTRO, () => startZone(0)); }
export function showDeath() { $('#death p').innerHTML = G.inf ? tt('ui/lobby.27') : tt('ui/lobby.28'); $('#death').hidden = false; }
function showEnd() {
  G.state = 'end'; $('#endScr h2').textContent = tt('ui/lobby.29'); const s = G.pd.stats; showHUD(false);
  $('#endStats').innerHTML = tt('ui/lobby.30', { lv: G.pd.lv, kills: s.kills, ults: s.ults, eaten: s.eaten, deaths: s.deaths, v1: fmtTime(s.time) });
  $('#endBtns').innerHTML = tt('ui/lobby.39', { v1: G.pd.cleared + 1, v2: G.pd.cleared >= 2 ? tt('ui/lobby.31') : (G.pd.cleared >= 1 ? tt('ui/lobby.32') : '') });
  $('#endScr').hidden = false;
  $('#eAgain').onclick = () => { $('#endScr').hidden = true; setCurZone(G.pd, 0); saveGame(); fadeTo(() => startZone(0)); };
  $('#eTitle').onclick = () => { $('#endScr').hidden = true; setCurZone(G.pd, 0); saveGame(); showTitle(); };
}
export function startEnding() { showHUD(false); playCut(ENDING, () => { showEnd(); }); }

export function setupUI() {
  $('#rankTabs').addEventListener('click', e => { const b = e.target.closest('[data-rt]'); if (b) { sfx('select'); rankTab(b.dataset.rt); } }); $('#rankClose').onclick = () => { sfx('select'); rankClose(); };
  $('#pvp').addEventListener('click', pvpClick); $('#pvpRes').addEventListener('click', pvpResClick);
  $('#pvpNickOk').onclick = () => pvpNickSave(); $('#pvpNickNo').onclick = () => { $('#pvpNick').hidden = true; if (RK.joining) { RK.joining = false; return; } if (!PV.me) { $('#pvp').hidden = true; showTitle(); } };
  $('#pvpNickIn').addEventListener('keydown', e => { if (e.key === 'Enter') pvpNickSave(); });
  $('#menu').addEventListener('click', menuClick);
  $('#menuBtn').addEventListener('click', () => { audioInit(); openMenu(); });
  $('#sndBtn').addEventListener('click', () => { audioInit(); setSound(!SND.on); updateSndBtn(); });
  $('#dlg').addEventListener('pointerdown', e => { e.stopPropagation(); audioInit(); dlgTap(); });
  $('#skip').addEventListener('click', e => { e.stopPropagation(); if (G.state === 'cut') endCut(); });
  $('#reviveBtn').addEventListener('click', () => { $('#death').hidden = true; respawn(); });
  $('#title').addEventListener('pointerdown', () => audioInit());
  updateSndBtn();
  $('#e2menu').addEventListener('click', e2MenuClick);
  $('#e2res').addEventListener('click', e2ResClick);
  $('#e2pauseBox').addEventListener('click', e2PauseClick);
  $('#e2start').addEventListener('click', () => { audioInit(); e2Go(); });
  $('#e2pause').addEventListener('click', () => e2Pause(true));
}
