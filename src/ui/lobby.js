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
import { dlgTap, fadeTo, toast } from './dialog.js';
import { showHUD } from './hud.js';
import { lobbyMenu, menuClick, openMenu, updateSndBtn } from './menu.js';
import { PV, esc, pvpClick, pvpFaceURL, pvpNickSave, pvpOpen, pvpResClick, pvpSnap } from '../net/pvp.js';
import { startInfinite } from '../play/inf.js';
import { PXI, RK, entryRegister, fmtGold, rankClose, rankOpen, rankSync, rankTab, rewardCards, seasonModalShow, setSmNext } from '../net/rank.js';
import { cloudOpen } from '../net/cloud.js';
import { accGateShow } from '../net/account.js';
import { aucOpen } from '../net/auction.js';
import { dailyAutoOpen, dailyClaimable, dailyOpen, dailyTakeAll } from '../features/daily.js';
import { shareOpen } from '../features/share.js';
import { RAID, raidBossURL, raidOpen } from '../net/raid.js';
import { achTag } from '../features/achv.js';
import { idleClaim, idleReady, idleTake, idleTileHtml } from '../features/idle.js';
import { pack2Open, pack2Seen, packOpen, packSeen, packTileHtml } from '../features/pack.js';
import { msOpen, msReady, msTake, msTileHtml } from '../features/goal.js';
import { towerOpen } from '../play/tower.js';
import { plazaLeave, plazaOpen } from '../net/plaza.js';
import { endCut, playCut } from '../story/story.js';
import { E2KEY, e2Go, e2HideAll, e2MenuClick, e2Open, e2Pause, e2PauseClick, e2ResClick } from '../minigame/ep2core.js';
import { tt, langNext, langToggle } from '../sys/i18n.js';

export let TITLE_PD = /** @type {any} */ (null);
export function setTitlePd(pd) { TITLE_PD = pd; }
/** 로비 오른쪽 버튼 줄(패키지·보상함)은 프로필 아래, 로고는 그 줄과 안 겹치게 글자 크기를 줄임 */
function titleLayout() {
  if (FORCE_EASY || $('#title').hidden) return;
  const top0 = $('#title').getBoundingClientRect().top, tb = $('#tbar').getBoundingClientRect().bottom - top0;
  const R0 = $('#tsideR'); R0.style.transform = ''; R0.classList.remove('tight'); R0.style.top = Math.round(tb + 8) + 'px';
  { const h1 = $('.ttl h1'); h1.style.fontSize = ''; const lr = h1.getBoundingClientRect(), cx = lr.left + lr.width / 2, rr = R0.getBoundingClientRect();
    const room = (R0.children.length ? Math.min(rr.left - cx, cx - (innerWidth - rr.right)) : innerWidth / 2 - 10) - 6, half = lr.width / 2;
    if (half > room && room > 20) h1.style.fontSize = (parseFloat(getComputedStyle(h1).fontSize) * room / half).toFixed(1) + 'px'; }
  // 오른쪽 줄이 아래 모험 카드에 닿으면 작게, 그래도 넘치면 비율로 줄임
  const lim = $('#tbtns').getBoundingClientRect().top - 6;
  if (R0.getBoundingClientRect().bottom > lim) R0.classList.add('tight');
  const b = R0.getBoundingClientRect(); if (b.bottom > lim && b.height > 0) { R0.style.transformOrigin = 'top right'; R0.style.transform = `scale(${Math.max(0.55, (lim - b.top) / b.height).toFixed(3)})`; }
}
// 타일 글이 바뀌어 높이가 달라질 때(방치 보상 시간·회차 보상 등)도 다시 맞춤
let TL_RAF = 0;
if (typeof ResizeObserver === 'function') { const ro = new ResizeObserver(() => { cancelAnimationFrame(TL_RAF); TL_RAF = requestAnimationFrame(() => { try { titleLayout(); } catch (e) { } }); }); for (const id of ['#tbar', '#tbtns', '#tsideR']) { const el = $(id); if (el) ro.observe(el); } }
addEventListener('resize', () => { try { titleLayout(); } catch (e) { } });

/** 로비 시트: 아래 탭(도전·상점·거래·소셜)·⚙ 설정·보상함. 로비 위 창을 닫고 돌아오면 열려 있던 시트를 다시 엶 */
let TSHEET = '';
const NAV_HI = { play: 'play', shop: 'shop', soc: 'soc' };
function sheetShow(k) {
  TSHEET = k; const sh = $('#tsheet'); if (!sh) return; sh.hidden = !k;
  for (const p of sh.querySelectorAll('.tsp')) /** @type {HTMLElement} */ (p).hidden = /** @type {HTMLElement} */ (p).dataset.nav !== k;
  for (const b of document.querySelectorAll('#tnav .tnv')) b.classList.toggle('on', /** @type {HTMLElement} */ (b).dataset.nav === (NAV_HI[k] || 'home'));
}
const sheetToggle = k => { sfx('select'); sheetShow(TSHEET === k ? '' : k); };
/** 받을 보상 수 (출석·미션 + 방치 + 회차 이정표) */
const rewCount = pd => pd ? dailyClaimable(pd) + (idleReady(pd) ? 1 : 0) + msReady(pd).length : 0;
/** 보상함 「모두 받기」: 출석·미션·방치·회차를 한 번에 */
function rewAll() {
  const pd = loadGame(); if (!pd) return;
  const b = { gold: pd.gold, stones: pd.stones || 0, auto: pd.autoBonus || 0 }, what = [], extra = [];
  if (dailyTakeAll(pd).length) what.push(tt('ui/lobby.40'));
  const ir = idleTake(pd); if (ir) { what.push(tt('ui/lobby.41')); if (ir.up.lv) extra.push(tt('features/idle.10', { lv: ir.up.lv })); if (ir.up.aw) extra.push(tt('features/idle.11', { aw: ir.up.aw })); }
  const mr = msTake(pd); if (mr) { what.push(tt('ui/lobby.42')); extra.push(...mr.extra); }
  if (!what.length) { toast(tt('ui/lobby.43'), 'sub'); return; }
  G.pd = pd; saveGame(); setTitlePd(pd); sfx('lvl');
  const cards = [{ kind: 'gold', amount: pd.gold - b.gold }, { kind: 'xp', amount: ir ? ir.r.xp : 0 }, { kind: 'stones', amount: (pd.stones || 0) - b.stones }, { kind: 'auto', amount: (pd.autoBonus || 0) - b.auto }].filter(c => c.amount > 0);
  $('#seasonModalBody').innerHTML = `<div class="sgot"><div class="sbig">${PXI('chest')}</div><h2>${tt('ui/lobby.44')}<br><em>${what.join(' · ')}</em></h2>`
    + (extra.length ? `<p class="smsub">${extra.join('<br>')}</p>` : '') + rewardCards(cards, true) + '</div>';
  setSmNext(() => showTitle()); seasonModalShow();
}
export function showTitle() {
  if (G.state !== 'title') TSHEET = ''; // 게임·메뉴에서 돌아오면 시트는 닫힌 채로
  if (typeof rankSync === 'function') { rankSync(); entryRegister(); dailyAutoOpen(); }
  if (G.plaza) plazaLeave(true);
  if (typeof accGateShow === 'function') setTimeout(accGateShow, 0);
  G.inf = null; G.raid = null; G.tower = null; G.auto = false; G.autoMove = null; G.state = 'title'; showHUD(false); if (typeof e2HideAll === 'function') e2HideAll(); $('#title').hidden = false; $('#endScr').hidden = true; $('#death').hidden = true; $('#dlg').hidden = true; $('#skip').hidden = true; $('#mission').hidden = true;
  const saved = hasSave() ? loadGame() : null;
  let e2s = null; try { e2s = JSON.parse(localStorage.getItem(E2KEY) || 'null'); } catch (e) { }
  const e2n = e2s ? (e2s.stars || []).reduce((a, b) => a + (b || 0), 0) : 0;
  if (FORCE_EASY) {
    $('#tbar').innerHTML = $('#tsideR').innerHTML = $('#tnav').innerHTML = $('#tsheet').innerHTML = ''; $('#tsheet').hidden = true;
    $('#tbtns').innerHTML = tt('ui/lobby.33', { v1: e2s ? tt('ui/lobby.1') : tt('ui/lobby.2'), v2: e2s ? tt('ui/lobby.3') + e2n + '/24' : tt('ui/lobby.4'), v3: SND.on ? tt('ui/lobby.5') : tt('ui/lobby.6') });
    $('#tEp2').onclick = () => { audioInit(); e2Open(); };
    $('#tSnd').onclick = () => { audioInit(); setSound(!SND.on); showTitle(); };
    playBgm('story'); return;
  }
  if (saved) { packSeen(saved); pack2Seen(saved); }
  TITLE_PD = saved; const I = (k, ic) => `<img src="${iconURL('i_' + k, ICONS[ic || k])}" alt="">`;
  // 상단: 내 희수(누르면 내 정보) · ⚙ 설정 / 골드·강화석
  let prof = '';
  if (saved) { let pw = 0; const keep = G.pd; try { G.pd = saved; pw = pvpSnap().power; } catch (e) { } G.pd = keep; G.st = null;
    const nick = (typeof PV !== 'undefined' && PV.me && PV.me.nickname) || tt('ui/lobby.7');
    prof = tt('ui/lobby.34', { v1: pvpFaceURL(visEq(saved), saved.look && saved.look.hair), v2: saved.title && (saved.ach || {})[saved.title] ? achTag(saved.title) : '', v3: jobTag(jobOf(saved)), v4: esc(nick), lv: saved.lv, v5: saved.aw ? ' ★' + saved.aw : '', v6: saved.cleared ? ' · ' + (saved.cleared + 1) + tt('ui/lobby.8') : '', v7: pw.toLocaleString() }); }
  $('#tbar').innerHTML = prof + `<button class="ticon tgear" id="tGear" aria-label="${tt('ui/lobby.45')}">${I('gear')}</button>`
    + (saved ? `<div class="tcur"><span>${I('gcoin')}${fmtGold(saved.gold)}</span><span>${I('stone')}${(saved.stones || 0).toLocaleString()}</span></div>` : '');
  // 오른쪽: 기간 한정(패키지·전직 가능) + 보상함
  const rn = rewCount(saved);
  $('#tsideR').innerHTML = saved ? packTileHtml(saved) + jobTileHtml(saved) + `<button class="ticon trew" id="tRew">${I('chest')}<small>${tt('ui/lobby.44')}</small>${rn ? `<em class="dot n">${rn}</em>` : ''}</button>` : '';
  // 아래: 장 고르기 + 모험 계속하기 (한 카드)
  $('#tbtns').innerHTML = saved ? `<div class="tadv">${chapterPickHtml(saved)}<button class="btn pk tstart" id="tCont"><span>${tt('ui/lobby.46')}</span><small>${zoneCh(curZone(saved)) === 2 ? tt('ui/lobby.24') : ''}${zoneTitle(saved, curZone(saved))} · Lv.${saved.lv}</small></button></div>` : tt('ui/lobby.25');
  // 맨 아래 탭
  const bagDot = saved && ((saved.lv >= JOB_LV && !JOBS[saved.job]) || saved.sp > 0 || saved.newItem || saved.newBori || saved.achNew || (saved.ap || 0) > 0);
  const nv = (k, id, ic, name, dot) => `<button class="tnv" data-nav="${k}" id="${id}">${I(ic)}<small>${name}</small>${dot ? '<em class="dot"></em>' : ''}</button>`;
  $('#tnav').innerHTML = nv('home', 'tHome', 'house', tt('ui/lobby.47')) + (saved ? nv('grow', 'tBag', 'bag', tt('ui/lobby.48'), bagDot) + nv('play', 'tPlay', 'swords', tt('ui/lobby.49')) + nv('shop', 'tShop', 'auc', tt('ui/lobby.50')) : '') + nv('soc', 'tSoc', 'chat', tt('ui/lobby.51'));
  // 시트 (도전·상점·거래·소셜·설정·보상함)
  const row = (id, img, b, sm, right = '<i class="tget off">›</i>') => `<button class="trow" id="${id}">${img}<span><b>${b}</b><small>${sm}</small></span>${right}</button>`;
  const head = (b, sm = '') => `<div class="tsh"><b>${b}</b>${sm ? `<small>${sm}</small>` : ''}</div>`;
  const rb = (typeof RAID !== 'undefined' && RAID.info && RAID.info.boss) || 'boss4';
  const dn = saved ? dailyClaimable(saved) : 0;
  $('#tsheet').innerHTML = `<div class="tsh-bg"></div><div class="tsh-box"><i class="tsh-grab"></i>`
    + (saved ? `<div class="tsp" data-nav="play" hidden>${head(tt('ui/lobby.49'), tt('ui/lobby.52'))}<div class="tmodes">`
      + tt('ui/lobby.36', { v1: I('pumpkin'), v2: saved.infBest ? tt('ui/lobby.17') + saved.infBest : tt('ui/lobby.18') })
      + tt('ui/lobby.19', { v1: I('swords') })
      + tt('ui/lobby.20', { v1: raidBossURL(rb) })
      + tt('ui/lobby.37', { v1: I('tower'), v2: towerBest(saved) ? tt('ui/lobby.21') + towerBest(saved) + tt('ui/lobby.22') : tt('ui/lobby.23') }) + '</div>'
      + `<div class="tsp" data-nav="shop" hidden>${head(tt('ui/lobby.50'))}`
      + row('tXch', I('stone'), tt('ui/lobby.53'), tt('ui/lobby.54'))
      + row('tAuc', I('auc'), tt('ui/lobby.55'), tt('ui/lobby.56'))
      + row('tXc', I('swords'), tt('ui/lobby.57'), tt('ui/lobby.58')) + '</div>' : '')
    + `<div class="tsp" data-nav="soc" hidden>${head(tt('ui/lobby.51'))}`
    + row('tRank', I('trophy'), tt('ui/lobby.59'), tt('ui/lobby.60'))
    + (saved ? row('tPlaza', I('chat'), tt('ui/lobby.61'), tt('ui/lobby.62')) + row('tShare', I('camera'), tt('ui/lobby.63'), tt('ui/lobby.64')) : '') + '</div>'
    + `<div class="tsp" data-nav="set" hidden>${head(tt('ui/lobby.45'))}`
    + row('tSnd', I('sound'), tt('ui/lobby.65'), tt('ui/lobby.66'), `<i class="tget${SND.on ? '' : ' off'}">${SND.on ? 'ON' : 'OFF'}</i>`)
    + `<button class="trow" id="tLang"><b class="tlg">${langNext().code}</b><span><b>${langNext().name}</b><small>${tt('ui/lobby.67')}</small></span><i class="tget off">›</i></button>`
    + row('tCloud', I('phone'), tt('ui/lobby.68'), tt('ui/lobby.69'))
    + (saved ? row('tInfo', I('cal'), tt('ui/lobby.70'), tt('ui/lobby.71')) : '') + '</div>'
    + (saved ? `<div class="tsp" data-nav="rew" hidden>${head(tt('ui/lobby.44'), rn ? tt('ui/lobby.72', { rn }) : '')}`
      + row('tDaily', I('cal'), tt('ui/lobby.73'), dn ? tt('ui/lobby.74', { dn }) : tt('ui/lobby.75'), dn ? `<i class="tget">${tt('ui/lobby.76')}</i>` : undefined)
      + idleTileHtml(saved) + msTileHtml(saved)
      + `<button class="btn pk trall" id="tRewAll"${rn ? '' : ' disabled'}>${rn ? tt('ui/lobby.77', { rn }) : tt('ui/lobby.78')}</button></div>` : '')
    + '</div>';
  sheetShow(TSHEET && $(`#tsheet .tsp[data-nav="${TSHEET}"]`) ? TSHEET : '');
  $('#tsheet .tsh-bg').onclick = () => sheetShow('');
  for (const b of document.querySelectorAll('#tnav .tnv')) { const k = /** @type {HTMLElement} */ (b).dataset.nav;
    /** @type {HTMLElement} */ (b).onclick = () => { audioInit(); if (k === 'home') { sfx('select'); sheetShow(''); } else if (k === 'grow') { sfx('select'); sheetShow(''); lobbyMenu(); } else sheetToggle(k); }; }
  $('#tGear').onclick = () => { audioInit(); sheetToggle('set'); };
  if ($('#tRew')) $('#tRew').onclick = () => { audioInit(); sheetToggle('rew'); };
  if ($('#tRewAll')) $('#tRewAll').onclick = () => { audioInit(); rewAll(); };
  if ($('#tPack')) $('#tPack').onclick = () => { audioInit(); packOpen(); };
  if ($('#tJob')) $('#tJob').onclick = () => { audioInit(); lobbyMenu('job'); };
  if ($('#tPack2')) $('#tPack2').onclick = () => { audioInit(); pack2Open(); };
  if ($('#tIdle')) $('#tIdle').onclick = () => { audioInit(); idleClaim(); };
  if ($('#tGoal')) $('#tGoal').onclick = () => { audioInit(); sfx('select'); msOpen(); };
  if ($('#tTower')) $('#tTower').onclick = () => { audioInit(); towerOpen(); };
  if ($('#tXch')) $('#tXch').onclick = () => { audioInit(); sfx('select'); lobbyMenu('shop'); };
  if ($('#tXc')) $('#tXc').onclick = () => { audioInit(); aucOpen('xchg'); };
  if ($('#tInfo')) $('#tInfo').onclick = () => { audioInit(); sfx('select'); lobbyMenu('info'); };
  if (saved) { $('#tRaid').onclick = () => { audioInit(); raidOpen(); }; $('#tPvp').onclick = () => { audioInit(); pvpOpen(); }; $('#tInf').onclick = () => { audioInit(); fadeTo(startInfinite, tt('ui/lobby.26')); };
    $('#tShare').onclick = () => { audioInit(); shareOpen(); };
    $('.tprof').onclick = () => { audioInit(); sfx('select'); lobbyMenu('look'); };
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
