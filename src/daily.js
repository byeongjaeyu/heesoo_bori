// ===================== 출석 + 일일 미션 =====================
// 세이브(pd.att, pd.daily)에 기록. 날짜는 기기 기준(todayKey, auto.js). 1탄 세이브가 있어야 동작.

import { $, sfx } from './engine.js';
import { G, SAVEKEY, calcStats, hasSave, loadGame, saveGame } from './game.js';
import { renderMenu, showTitle, toast } from './ui.js';
import { todayKey } from './auto.js';

/** 출석 7일 주기 (누적, 빠져도 초기화 안 됨). g = 골드 배수(레벨·회차 비례), s = 강화석, a = 자동사냥(초) */
const ATT_REWARDS = [{ g: 2 }, { s: 10 }, { a: 1800 }, { g: 3 }, { s: 25 }, { a: 3600 }, { g: 5, s: 50, a: 7200 }];
/** 미션 풀. 매일 kill + 나머지 중 3개 */
const MISSIONS = {
  kill: { name: '몬스터 150마리 처치', n: 150, r: { s: 5 } },
  boss: { name: '보스 1마리 처치', n: 1, r: { s: 10 } },
  enh: { name: '장비 강화 5번 시도', n: 5, r: { g: 1 } },
  pvp: { name: 'PvP 아레나 1판', n: 1, r: { s: 8 } },
  wave: { name: '할로윈파티 웨이브 5개 넘기기', n: 5, r: { g: 2 } },
  ep2: { name: '미니게임 「보리 주세요」 스테이지 1개 깨기', n: 1, r: { a: 900 } }
};
const DAILY_ALL = { a: 1800 }; // 4개 다 받으면 보너스

const dailyGold = pd => Math.round(300 + (pd.lv || 1) * 60 * (1 + Math.min(pd.cleared || 0, 10) * 0.3));
function rewardText(pd, r) {
  const t = []; if (r.g) t.push(`${(dailyGold(pd) * r.g).toLocaleString()}G`); if (r.s) t.push(`강화석 ${r.s}개`);
  if (r.a) t.push(`자동사냥 ${r.a >= 3600 ? (r.a / 3600) + '시간' : (r.a / 60) + '분'}`); return t.join(' + ');
}
function rewardApply(pd, r) {
  if (r.g) pd.gold += dailyGold(pd) * r.g; if (r.s) pd.stones = (pd.stones || 0) + r.s; if (r.a) pd.autoBonus = (pd.autoBonus || 0) + r.a;
  return rewardText(pd, r);
}
/** 날짜로 정해지는 미션 4개 (같은 날엔 누구나 같은 미션) */
function dailyPicks(day) {
  let h = 0; for (const c of day) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rest = Object.keys(MISSIONS).filter(k => k !== 'kill' && k !== 'ep2'); // 11/27 미니게임을 메인에서 뺌 → 「보리 주세요」 미션 안 나옴
  for (let i = rest.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1);[rest[i], rest[j]] = [rest[j], rest[i]]; }
  return ['kill', ...rest.slice(0, 3)];
}
/** 오늘 미션 상태 (날짜 바뀌면 새로) */
function dailyState(pd, day = todayKey()) {
  if (!pd.daily || pd.daily.day !== day) pd.daily = { day, picks: dailyPicks(day), prog: {}, got: [], all: false };
  const D = pd.daily, i = D.picks.indexOf('ep2'); // 예전에 뽑힌 미니게임 미션은 다른 미션으로 바꿈
  if (i >= 0 && !(D.got || []).includes('ep2')) D.picks[i] = Object.keys(MISSIONS).find(k => k !== 'ep2' && !D.picks.includes(k)) || 'kill';
  return D;
}
export function dailyClaimable(pd, day = todayKey()) {
  if (!pd) return 0; const d = dailyState(pd, day); let n = (pd.att && pd.att.last === day) ? 0 : 1;
  for (const id of d.picks) if ((d.prog[id] || 0) >= MISSIONS[id].n && !d.got.includes(id)) n++;
  if (!d.all && d.got.length === d.picks.length) n++;
  return n;
}
/** 지금 다룰 세이브: 게임 중이면 G.pd, 타이틀이면 저장본 */
function dailyPD() { return G.pd || loadGame(); }
function dailyCommit(pd) { if (G.pd === pd) saveGame(); else try { localStorage.setItem(SAVEKEY, JSON.stringify(pd)); } catch (e) { } }

/** 미션 진행 +n (처치·강화 등에서 호출) */
export function dailyAdd(kind, n = 1) {
  if (FORCE_EASY || !hasSave()) return; const pd = dailyPD(); if (!pd) return;
  const d = dailyState(pd); if (!d.picks.includes(kind) || d.got.includes(kind)) return;
  const M = MISSIONS[kind], before = d.prog[kind] || 0; if (before >= M.n) return;
  d.prog[kind] = Math.min(M.n, before + n);
  if (d.prog[kind] >= M.n) { toast(`미션 완료! ${M.name} · 메뉴 → 미션에서 받기`, 'lvl'); sfx('ding'); }
  if (G.pd !== pd) dailyCommit(pd);
}
/** 출석 체크. 반환: 보상 문구 또는 null(오늘 이미 함) */
function dailyAttend(pd, day = todayKey()) {
  pd.att = pd.att || { last: '', n: 0 }; if (pd.att.last === day) return null;
  pd.att.last = day; pd.att.n++; const idx = (pd.att.n - 1) % 7;
  return { day: idx + 1, text: rewardApply(pd, ATT_REWARDS[idx]) };
}
function dailyClaim(pd, id, day = todayKey()) {
  const d = dailyState(pd, day), M = MISSIONS[id];
  if (!M || !d.picks.includes(id) || d.got.includes(id) || (d.prog[id] || 0) < M.n) return null;
  d.got.push(id); return rewardApply(pd, M.r);
}
function dailyClaimAll(pd, day = todayKey()) {
  const d = dailyState(pd, day); if (d.all || d.got.length < d.picks.length) return null;
  d.all = true; return rewardApply(pd, DAILY_ALL);
}

// ---------- 화면 (메뉴 '미션' 탭과 타이틀 창이 같은 HTML) ----------
export function dailyHtml(pd) {
  const day = todayKey(), d = dailyState(pd, day), att = pd.att || { last: '', n: 0 }, todayDone = att.last === day;
  const cur = todayDone ? (att.n - 1) % 7 : att.n % 7; // 오늘(받을/받은) 칸
  const cells = ATT_REWARDS.map((r, i) => { const got = todayDone ? i <= cur : i < cur, now = i === cur;
    return `<div class="attc${got ? ' got' : ''}${now && !todayDone ? ' now' : ''}"><b>${i + 1}일</b><small>${rewardText(pd, r)}</small>${got ? '<i>✔</i>' : ''}</div>`; }).join('');
  const rows = d.picks.map(id => { const M = MISSIONS[id], p = Math.min(M.n, d.prog[id] || 0), done = p >= M.n, got = d.got.includes(id);
    return `<div class="msn${got ? ' got' : ''}"><span><em>${M.name}</em><i class="mbar"><b style="width:${Math.round(p / M.n * 100)}%"></b></i><small>${p}/${M.n} · ${rewardText(pd, M.r)}</small></span><button class="btn ${done && !got ? 'pk' : 'wh'} sm" data-d="claim" data-v="${id}" ${done && !got ? '' : 'disabled'}>${got ? '받음' : done ? '받기' : '진행 중'}</button></div>`; }).join('');
  const allOk = d.got.length === d.picks.length;
  return `<div class="daily"><div class="dh"><b>출석 체크</b><small>누적 ${att.n}일 · 7일마다 큰 보상</small></div><div class="attrow">${cells}</div>
<button class="btn ${todayDone ? 'wh' : 'pk'}" data-d="att" ${todayDone ? 'disabled' : ''}>${todayDone ? '오늘 출석 완료 ✔' : '출석하기'}</button>
<div class="dh"><b>오늘의 미션</b><small>자정에 바뀌어요</small></div>${rows}
<div class="msn bonus${d.all ? ' got' : ''}"><span><em>미션 4개 모두 받기 보너스</em><small>${rewardText(pd, DAILY_ALL)}</small></span><button class="btn ${allOk && !d.all ? 'pk' : 'wh'} sm" data-d="all" ${allOk && !d.all ? '' : 'disabled'}>${d.all ? '받음' : '보너스'}</button></div></div>`;
}
/** 버튼 처리 (타이틀 창·메뉴 탭 공용). 처리했으면 true */
function dailyAct(act, v) {
  const pd = dailyPD(); if (!pd) return false; let txt = null;
  if (act === 'att') { const r = dailyAttend(pd); if (r) txt = `${r.day}일차 출석! ${r.text}`; }
  else if (act === 'claim') { const r = dailyClaim(pd, v); if (r) txt = `미션 보상: ${r}`; }
  else if (act === 'all') { const r = dailyClaimAll(pd); if (r) txt = `미션 보너스: ${r}`; }
  if (!txt) return false;
  toast(txt, 'lvl'); sfx('lvl'); if (G.pd === pd) calcStats(); dailyCommit(pd); return true;
}
export function dailyOpen() {
  const pd = dailyPD(); if (!pd) return;
  $('#dailyBody').innerHTML = dailyHtml(pd); $('#daily').hidden = false; dailyScrollToday();
}
/** 출석 칸 가로 스크롤을 오늘(받을/받은) 칸으로 */
export function dailyScrollToday() {
  requestAnimationFrame(() => { for (const row of document.querySelectorAll('.attrow')) { const c = row.querySelector('.attc.now') || [...row.querySelectorAll('.attc.got')].pop(); if (c) row.scrollLeft = Math.max(0, /** @type {HTMLElement} */ (c).offsetLeft - row.clientWidth / 2 + /** @type {HTMLElement} */ (c).offsetWidth / 2 - /** @type {HTMLElement} */ (row).offsetLeft); } });
}
function dailyClose() { $('#daily').hidden = true; if (G.state === 'title') showTitle(); }
/** 타이틀에서 그날 처음이면 출석 창 자동으로 (닉네임 창이 떠 있으면 다음에) */
export function dailyAutoOpen() {
  if (FORCE_EASY || !hasSave()) return; let seen = ''; try { seen = sessionStorage.getItem('hb_daily_seen') || ''; } catch (e) { }
  const pd = loadGame(); if (!pd || (pd.att && pd.att.last === todayKey()) || seen === todayKey()) return;
  setTimeout(() => { if (G.state !== 'title' || !$('#pvpNick').hidden || !$('#cloud').hidden || !$('#daily').hidden) return; try { sessionStorage.setItem('hb_daily_seen', todayKey()); } catch (e) { } dailyOpen(); }, 900);
}
export function dailyBoot() {
  if (FORCE_EASY) return;
  $('#daily').addEventListener('click', e => { const b = /** @type {HTMLElement} */ (e.target).closest('[data-d]'); if (!b) return; if (dailyAct(b.getAttribute('data-d'), b.getAttribute('data-v'))) { $('#dailyBody').innerHTML = dailyHtml(dailyPD()); dailyScrollToday(); } });
  $('#dailyX').onclick = dailyClose;
  // 메뉴 '미션' 탭 버튼
  $('#mbody').addEventListener('click', e => { const b = /** @type {HTMLElement} */ (e.target).closest('[data-d]'); if (!b) return; if (dailyAct(b.getAttribute('data-d'), b.getAttribute('data-v'))) renderMenu(); });
}
