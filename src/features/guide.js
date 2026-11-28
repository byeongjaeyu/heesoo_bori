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
import { tt } from '../sys/i18n.js';

/** @typedef {{ kind: string, n: number }} GuideEv */
const GUIDE = [
  { text: tt('features/guide.1'), how: tt('features/guide.2'), hl: '#ctrl .atk', need: 5, ev: 'kill', r: { g: 300 } },
  { text: tt('features/guide.3'), how: tt('features/guide.4'), hl: '#menuBtn', done: pd => (pd.skills.smash || 0) > 0, r: { f: { persimmon: 3 } } },
  { text: tt('features/guide.5'), how: tt('features/guide.6'), hl: '#bS1', need: 1, ev: 'skill:smash', r: { g: 300 } },
  { text: tt('features/guide.7'), how: tt('features/guide.8'), hl: '#menuBtn', done: pd => pd.eq.weapon !== 'fist', r: { g: 500 } },
  { text: tt('features/guide.9'), how: tt('features/guide.10'), hl: '#menuBtn', need: 1, ev: 'enh', r: { s: 5 } },
  { text: tt('features/guide.11'), how: tt('features/guide.12'), hl: '', done: pd => !!pd.boriJoined, r: { f: { persimmon: 2, cornflakes: 2 } } },
  { text: tt('features/guide.13'), how: tt('features/guide.14'), hl: '', need: 1, ev: 'boss', r: { s: 10, a: 1800 } }
];
export const GUIDE_DONE = GUIDE.length;
/** 진행 중 단계의 사건 수 (세이브 안 함: 단계 바뀌면 0부터) */
let guideCnt = 0;

function guideRewardText(r) {
  const t = []; if (r.g) t.push(`${r.g.toLocaleString()}G`); if (r.s) t.push(tt('features/guide.15', { s: r.s })); if (r.a) t.push(tt('features/guide.16', { v1: Math.round(r.a / 60) }));
  if (r.f) for (const id in r.f) t.push(tt('features/guide.17', { name: FOODS[id].name, v1: r.f[id] })); return t.join(' + ');
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
    toast(tt('features/guide.18', { text: st.text, v1: guideRewardText(st.r) }), 'lvl'); sfx('lvl');
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
  $('#seasonModalBody').innerHTML = tt('features/guide.19', { v1: PXI('trophy') })
    + rewardCards([{ kind: 'stones', amount: last.s || 0 }, { kind: 'auto', amount: last.a || 0 }], true)
    + (PV.me ? '' : tt('features/guide.20')) + '</div>';
  seasonModalShow();
}
function guideSkip() {
  const pd = G.pd; if (!pd) return;
  confirmBox(tt('features/guide.21'), () => { pd.guide = GUIDE_DONE; saveGame(); guideRender(); });
}

// ---------- 화면: 상단 카드 + 눌러야 할 버튼 반짝임 ----------
let guideHl = '';
function guideRender() {
  const pd = G.pd, el = $('#guide'); if (!el) return;
  const on = guideOn(pd) && G.state === 'play' && !$('#hud').hidden;
  document.body.classList.toggle('guiding', on);
  if (!on) { el.hidden = true; guideHighlight(''); return; }
  const i = pd.guide || 0, st = GUIDE[i], prog = st.need && st.need > 1 ? ` (${Math.min(guideCnt, st.need)}/${st.need})` : '';
  el.innerHTML = tt('features/guide.22', { v1: i + 1, GUIDE_DONE })
    + tt('features/guide.23', { text: st.text, prog, how: st.how, v1: guideRewardText(st.r) });
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
