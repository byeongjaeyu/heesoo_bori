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
    $('#tbtns').innerHTML = `<button class="btn e2new" id="tEp2">${e2s ? '이어하기' : '시작하기'}<small>${e2s ? '별 ' + e2n + '/24' : '탭 한 번이면 끝!'}</small></button><div class="tsmall"><button class="btn wh" id="tSnd">소리 ${SND.on ? '켜짐 ♪' : '꺼짐'}</button></div><div class="tsub">♥ 희수 & 보리 ♥</div>`;
    $('#tEp2').onclick = () => { audioInit(); e2Open(); };
    $('#tSnd').onclick = () => { audioInit(); setSound(!SND.on); showTitle(); };
    playBgm('story'); return;
  }
  if (saved) { packSeen(saved); pack2Seen(saved); }
  TITLE_PD = saved; const I = (k, ic) => `<img src="${iconURL('i_' + k, ICONS[ic || k])}" alt="">`;
  // 상단: 내 희수 정보 + 소리
  let prof = '';
  if (saved) { let pw = 0; const keep = G.pd; try { G.pd = saved; pw = pvpSnap().power; } catch (e) { } G.pd = keep; G.st = null;
    const nick = (typeof PV !== 'undefined' && PV.me && PV.me.nickname) || '희수';
    prof = `<div class="tprof"><img src="${pvpFaceURL(visEq(saved), saved.look && saved.look.hair)}" alt=""><span>${saved.title && (saved.ach || {})[saved.title] ? achTag(saved.title) : ''}<b class="tpnm">${jobTag(jobOf(saved))}${esc(nick)}</b><small>Lv.${saved.lv}${saved.aw ? ' ★' + saved.aw : ''}${saved.cleared ? ' · ' + (saved.cleared + 1) + '회차' : ''}</small><small class="tpw">전투력 ${pw.toLocaleString()}</small></span></div>`; }
  $('#tbar').innerHTML = prof + (saved ? packTileHtml(saved) + jobTileHtml(saved) : '') + `<button class="ticon tsnd${SND.on ? '' : ' off'}" id="tSnd" aria-label="소리">${I('sound')}<small>${SND.on ? '소리 ON' : '소리 OFF'}</small></button>`;
  // 왼쪽 세로 아이콘
  const bagDot = saved && ((saved.lv >= JOB_LV && !JOBS[saved.job]) || saved.sp > 0 || saved.newItem || saved.newBori || saved.achNew || (saved.ap || 0) > 0);
  $('#tsideL').innerHTML = (saved ? `<button class="ticon tbag" id="tBag">${I('bag')}<small>장비·스킬</small>${bagDot ? '<em class="dot"></em>' : ''}</button>` : '') + (saved ? `<button class="ticon" id="tDaily">${I('cal')}<small>출석·미션</small>${dailyClaimable(saved) ? '<em class="dot"></em>' : ''}</button>` : '')
    + `<button class="ticon" id="tRank">${I('trophy')}<small>랭킹</small></button>`
    + (saved ? `<button class="ticon" id="tShare">${I('camera')}<small>카드 공유</small></button>` : '')
    + (saved ? `<button class="ticon" id="tAuc">${I('auc')}<small>경매장</small></button>` : '')
    + `<button class="ticon" id="tCloud">${I('phone')}<small>기기 이동</small></button>`;
  // 오른쪽: 방치 보상·회차 보상 (미니게임 「보리 주세요」는 11/27 메인에서 뺌 — 원터치판에만, 나중에 새로 만들 예정)
  $('#tsideR').innerHTML = saved ? idleTileHtml(saved) + msTileHtml(saved) : '';
  // 하단: 모드 타일 + 시작
  const rb = (typeof RAID !== 'undefined' && RAID.info && RAID.info.boss) || 'boss4';
  $('#tbtns').innerHTML = (saved ? `<div class="tmodes">`
    + `<button class="tmode m-inf" id="tInf">${I('pumpkin')}<b>할로윈파티</b><small>${saved.infBest ? '최고 WAVE ' + saved.infBest : '무한던전'}</small></button>`
    + `<button class="tmode m-pvp" id="tPvp">${I('swords')}<b>PvP 아레나</b><small>주간 시즌</small></button>`
    + `<button class="tmode m-raid" id="tRaid"><img src="${raidBossURL(rb)}" alt=""><b>월드 보스</b><small>하루 3번</small></button>`
    + `<button class="tmode m-tower" id="tTower">${I('tower')}<b>보스 타워</b><small>${towerBest(saved) ? '최고 ' + towerBest(saved) + '층' : '도전 모드'}</small></button></div>` : '')
    + (saved ? chapterPickHtml(saved) + `<div class="tstartRow"><button class="btn tplaza" id="tPlaza">${I('chat')}<b>광장</b><small>온라인</small></button><button class="btn pk tstart" id="tCont"><span>▶ 모험 계속하기</span><small>${zoneCh(curZone(saved)) === 2 ? '2장 · ' : ''}${zoneTitle(saved, curZone(saved))} · Lv.${saved.lv}</small></button></div>`
      : `<button class="btn pk tstart" id="tNew"><span>▶ 모험 시작</span><small>에버랜드 대탈출 · 도트 액션 RPG</small></button>`);
  if ($('#tPack')) $('#tPack').onclick = () => { audioInit(); packOpen(); };
  if ($('#tJob')) $('#tJob').onclick = () => { audioInit(); lobbyMenu('job'); };
  if ($('#tPack2')) $('#tPack2').onclick = () => { audioInit(); pack2Open(); };
  if ($('#tIdle')) $('#tIdle').onclick = () => { audioInit(); idleClaim(); };
  if ($('#tGoal')) $('#tGoal').onclick = () => { audioInit(); sfx('select'); msOpen(); };
  if ($('#tTower')) $('#tTower').onclick = () => { audioInit(); towerOpen(); };
  if (saved) { $('#tRaid').onclick = () => { audioInit(); raidOpen(); }; $('#tPvp').onclick = () => { audioInit(); pvpOpen(); }; $('#tInf').onclick = () => { audioInit(); fadeTo(startInfinite, '에버랜드: 할로윈파티'); };
    $('#tShare').onclick = () => { audioInit(); shareOpen(); };
    $('#tBag').onclick = () => { audioInit(); sfx('select'); lobbyMenu(); };
    $('.tprof').onclick = () => { audioInit(); sfx('select'); lobbyMenu('info'); };
    $('#tCont').onclick = () => { audioInit(); adventureGo(loadGame() || saved); };
    for (const b of document.querySelectorAll('.tch')) /** @type {HTMLElement} */ (b).onclick = () => { audioInit(); chapterPick(+b.getAttribute('data-ch')); }; }
  $('#tRank').onclick = () => { audioInit(); rankOpen('title'); };
  $('#tCloud').onclick = () => { audioInit(); cloudOpen('title'); };
  if ($('#tAuc')) $('#tAuc').onclick = () => { audioInit(); aucOpen(); };
  if ($('#tDaily')) $('#tDaily').onclick = () => { audioInit(); dailyOpen(); };
  if ($('#tPlaza')) $('#tPlaza').onclick = () => { audioInit(); sfx('select'); plazaOpen(); };
  if ($('#tNew')) $('#tNew').onclick = () => { audioInit(); newGame(); };
  $('#tSnd').onclick = () => { audioInit(); setSound(!SND.on); showTitle(); };
  titleLayout(); requestAnimationFrame(() => titleLayout()); setTimeout(() => { try { titleLayout(); } catch (e) { } }, 400); if (document.fonts) document.fonts.ready.then(() => { try { titleLayout(); } catch (e) { } });
  playBgm('story');
}
export function newGame() { G.pd = newPD(); saveGame(); $('#title').hidden = true; G.world = null; calcStats(); playCut(INTRO, () => startZone(0)); }
export function showDeath() { $('#death p').innerHTML = G.inf ? '할로윈파티에선 병원비 없이<br>바로 다시 일어나요!' : '폰 배터리도 0%...<br>병원비로 골드 10%를 내고 다시 일어나요.'; $('#death').hidden = false; }
function showEnd() {
  G.state = 'end'; $('#endScr h2').textContent = '희수와 보리의 에버랜드 대탈출'; const s = G.pd.stats; showHUD(false);
  $('#endStats').innerHTML = `최종 레벨 <b>Lv.${G.pd.lv}</b><br>처치한 몬스터 <b>${s.kills}</b>마리<br>멘헤라 공격 <b>${s.ults}</b>회<br>먹은 음식 <b>${s.eaten}</b>개 · 기절 <b>${s.deaths}</b>회<br>플레이 시간 <b>${fmtTime(s.time)}</b>`;
  $('#endBtns').innerHTML = `<button class="btn pk" id="eAgain">${G.pd.cleared + 1}회차 시작<small>${G.pd.cleared >= 2 ? '더 강한 몬스터 · 신화·초월 장비가 더 자주!' : (G.pd.cleared >= 1 ? '더 강하고 더 많은 몬스터 · 신화·초월 장비 등장!' : '')}</small></button><button class="btn wh" id="eTitle">타이틀로</button><div class="tsub">다음 이야기: 낚시터 대모험...?</div>`;
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
