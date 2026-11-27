// ===================== 첫 걸음 가이드 (신규 유저 첫 10분) =====================
// pd.guide = 지금 단계(0부터). GUIDE.length 이상이면 끝. 단계마다 확정 보상.
// done(pd, ev) 가 true 가 되면 다음 단계로. ev 는 guideEv(kind) 로 들어오는 사건(처치·스킬·강화·보스).



import { $ } from '../sys/dom.js';
import { on } from '../core/events.js';
import { sfx } from '../sys/audio.js';
import { FOODS } from '../core/data.js';
import { G } from '../core/state.js';
import { saveGame } from '../core/save.js';
import { calcStats } from '../core/items.js';
import { toast } from '../ui/dialog.js';
import { confirmBox } from '../ui/menu.js';
import { PV } from '../net/pvp.js';
import { PXI, rewardCards, seasonModalShow } from '../net/rank.js';

/** @typedef {{ kind: string, n: number }} GuideEv */
const GUIDE = [
  { text: '몬스터 5마리 잡기', how: '오른쪽 아래 주먹 버튼 (PC: J / Space)', hl: '#ctrl .atk', need: 5, ev: 'kill', r: { g: 300 } },
  { text: '「등짝 스매싱」 배우기', how: '오른쪽 위 메뉴 → 스킬 탭 → 등짝 스매싱 배우기', hl: '#menuBtn', done: pd => (pd.skills.smash || 0) > 0, r: { f: { persimmon: 3 } } },
  { text: '등짝 스매싱 써보기', how: '손바닥 버튼을 눌러요 (PC: K)', hl: '#bS1', need: 1, ev: 'skill:smash', r: { g: 300 } },
  { text: '새 무기 장착하기', how: '메뉴 → 배달앱에서 「츄러스」 사기 → 장비 탭에서 착용', hl: '#menuBtn', done: pd => pd.eq.weapon !== 'fist', r: { g: 500 } },
  { text: '무기 강화 1번 성공', how: '메뉴 → 장비 탭 → 강화', hl: '#menuBtn', need: 1, ev: 'enh', r: { s: 5 } },
  { text: 'Lv.3 달성하고 보리 찾기', how: '몬스터를 잡아 레벨을 올려요', hl: '', done: pd => !!pd.boriJoined, r: { f: { persimmon: 2, cornflakes: 2 } } },
  { text: 'STAGE 1 보스 잡기', how: '몬스터를 20마리 잡으면 보스가 나와요', hl: '', need: 1, ev: 'boss', r: { s: 10, a: 1800 } }
];
export const GUIDE_DONE = GUIDE.length;
/** 진행 중 단계의 사건 수 (세이브 안 함: 단계 바뀌면 0부터) */
let guideCnt = 0;

function guideRewardText(r) {
  const t = []; if (r.g) t.push(`${r.g.toLocaleString()}G`); if (r.s) t.push(`강화석 ${r.s}개`); if (r.a) t.push(`자동사냥 ${Math.round(r.a / 60)}분`);
  if (r.f) for (const id in r.f) t.push(`${FOODS[id].name} ${r.f[id]}개`); return t.join(' + ');
}
function guideApply(pd, r) {
  if (r.g) pd.gold += r.g; if (r.s) pd.stones = (pd.stones || 0) + r.s; if (r.a) pd.autoBonus = (pd.autoBonus || 0) + r.a;
  if (r.f) for (const id in r.f) pd.foods[id] = (pd.foods[id] || 0) + r.f[id];
}
const guideOn = pd => !FORCE_EASY && !!pd && (pd.guide || 0) < GUIDE_DONE && !G.pvp && !G.inf && !G.raid;

/** 단계 완료 처리 → 보상 → 다음 단계 (여러 단계가 이미 충족이면 연달아) */
function guideCheck() {
  const pd = G.pd; if (!guideOn(pd)) return;
  let moved = false;
  for (let guard = 0; guard < GUIDE_DONE && (pd.guide || 0) < GUIDE_DONE; guard++) {
    const st = GUIDE[pd.guide || 0];
    const ok = st.done ? st.done(pd) : guideCnt >= (st.need || 1);
    if (!ok) break;
    guideApply(pd, st.r); pd.guide = (pd.guide || 0) + 1; guideCnt = 0; moved = true;
    if (pd.guide >= GUIDE_DONE) { guideFinish(st.r); break; }
    toast(`✔ ${st.text} 완료! 보상: ${guideRewardText(st.r)}`, 'lvl'); sfx('lvl');
  }
  if (moved) { calcStats(); saveGame(); }
  guideRender();
}
/** 사건 알림 (처치·스킬·강화 성공·보스) */
export function guideEv(kind) {
  const pd = G.pd; if (!guideOn(pd)) return;
  const st = GUIDE[pd.guide || 0]; if (st.ev !== kind) return;
  guideCnt++; guideCheck();
}
function guideFinish(last) {
  guideRender();
  $('#seasonModalBody').innerHTML = `<div class="sgot"><div class="sbig">${PXI('trophy')}</div><h2>첫 걸음 <em>완료!</em></h2><p class="smsub">이제 혼자서도 잘 할 수 있어요!<br>매일 출석·미션도 챙겨보세요</p>`
    + rewardCards([{ kind: 'stones', amount: last.s || 0 }, { kind: 'auto', amount: last.a || 0 }], true)
    + (PV.me ? '' : `<button class="btn pvpbtn" onclick="seasonModalClose(); rankJoin();">랭킹에 내 희수 올리기<small>친구들과 전투력·PvP 겨루기</small></button>`) + '</div>';
  seasonModalShow();
}
function guideSkip() {
  const pd = G.pd; if (!pd) return;
  confirmBox('가이드를 그만 볼까요?\n(남은 단계 보상은 받을 수 없어요)', () => { pd.guide = GUIDE_DONE; saveGame(); guideRender(); });
}

// ---------- 화면: 상단 카드 + 눌러야 할 버튼 반짝임 ----------
let guideHl = '';
function guideRender() {
  const pd = G.pd, el = $('#guide'); if (!el) return;
  const on = guideOn(pd) && G.state === 'play' && !$('#hud').hidden;
  document.body.classList.toggle('guiding', on);
  if (!on) { el.hidden = true; guideHighlight(''); return; }
  const i = pd.guide || 0, st = GUIDE[i], prog = st.need && st.need > 1 ? ` (${Math.min(guideCnt, st.need)}/${st.need})` : '';
  el.innerHTML = `<div class="gtop"><b>첫 걸음 ${i + 1}/${GUIDE_DONE}</b><button class="gx" onclick="guideSkip()" aria-label="가이드 끄기">✕</button></div>`
    + `<div class="gtxt">▶ ${st.text}${prog}</div><small>${st.how}</small><small class="grw">보상: ${guideRewardText(st.r)}</small>`;
  el.hidden = false; guideHighlight(st.hl);
}
function guideHighlight(sel) {
  if (sel === guideHl) return;
  if (guideHl) for (const e of document.querySelectorAll(guideHl)) e.classList.remove('gpulse');
  guideHl = sel; if (sel) for (const e of document.querySelectorAll(sel)) e.classList.add('gpulse');
}
export function guideBoot() {
  if (FORCE_EASY) return;
  // 상태로 끝나는 단계(스킬 배움·무기 착용·보리 합류)와 화면 표시를 주기적으로 확인
  setInterval(() => { try { guideCheck(); } catch (e) { } }, 500);
}

on('guide', guideEv); // core 이벤트 (강화)
