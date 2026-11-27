// ===================== 방치 보상 =====================
// 게임을 안 하는 동안(타이틀·창 닫힘) 희수와 보리가 알아서 사냥한 몫. 최대 12시간, 10분부터 받기.
// 기준: 지금 스테이지·회차 몬스터를 시간당 IDLE_KPH 마리 (엔드급 자동사냥 약 4,000마리의 7~8%)



import { ICONS } from '../draw/sprites.js';
import { $ } from '../sys/dom.js';
import { iconURL } from '../draw/sprite.js';
import { audioInit, sfx } from '../sys/audio.js';
import { MONS, ZONES, awkNeed, xpNeed } from '../core/data.js';
import { curZone, zoneL } from '../core/chapter.js';
import { G } from '../core/state.js';
import { loadGame, saveGame } from '../core/save.js';
import { LM_GOLD, LM_XP } from '../core/loop.js';
import { MAX_LV } from '../core/progress.js';
import { toast } from '../ui/dialog.js';
import { TITLE_PD, showTitle } from '../ui/lobby.js';
import { PXI, rewardCards, seasonModalShow, setSmNext } from '../net/rank.js';
import { GUIDE_DONE } from './guide.js';

const IDLE_MAX = 12 * 3600, IDLE_MIN = 600, IDLE_KPH = 300, IDLE_STONE = 0.03;
ICONS.chest = ['..KKKKKKK..', '.KDDDDDDDK.', 'KDdDDDDDdDK', 'KKKKKAKKKKK', 'KDDDKAKDDDK', 'KDdDKKKDdDK', 'KDDDDDDDDDK', 'KDdDDDDDdDK', 'KKKKKKKKKKK'];
/** 첫 걸음 가이드를 끝내야 쌓임 (Lv1로 만들어 두고 며칠 뒤 열면 12시간치를 받아 초반을 건너뛰던 문제, 11/23).
 * 가이드는 플레이 중에 끝나고 플레이 중엔 saveGame이 idleT를 계속 지금으로 갱신 → 끝낸 순간부터 쌓임 */
const idleOn = pd => !!pd && (pd.guide || 0) >= GUIDE_DONE;
/** 쌓인 방치 시간(초). 시계를 뒤로 돌리면 0 */
const idleSec = pd => !idleOn(pd) || !pd.idleT ? 0 : Math.max(0, Math.min(IDLE_MAX, (Date.now() - pd.idleT) / 1000));
/** 방치 보상 계산 (G.pd 를 건드리지 않음) */
function idleCalc(pd, sec) {
  const z = curZone(pd), Z = ZONES[z], L = zoneL(pd, z);
  let w = 0, xp = 0, gold = 0; for (const [id, nn] of Z.mons) { const m = MONS[id], n = Number(nn); w += n; xp += m.xp * n; gold += (m.gold[0] + m.gold[1]) / 2 * n; }
  const kills = Math.floor(sec / 3600 * IDLE_KPH), goldMul = 1 + 0.15 * ((pd.skills || {}).shop || 0);
  return { kills, xp: Math.round(kills * xp / w * (1 + LM_XP * L)), gold: Math.round(kills * gold / w * goldMul * (1 + LM_GOLD * L)), stones: Math.floor(kills * IDLE_STONE) };
}
/** 경험치를 세이브에 반영 (전투 연출 없이). 오른 레벨·각성 수 반환 */
function idleXp(pd, x) {
  let lv = 0, aw = 0;
  if (pd.lv < MAX_LV) { pd.xp += x; x = 0; while (pd.lv < MAX_LV && pd.xp >= xpNeed(pd.lv)) { pd.xp -= xpNeed(pd.lv); pd.lv++; pd.sp++; lv++; } if (pd.lv >= MAX_LV) { x = pd.xp; pd.xp = 0; } }
  if (pd.lv >= MAX_LV && x > 0) { pd.aw = pd.aw || 0; pd.ap = pd.ap || 0; pd.xp += x; while (pd.xp >= awkNeed(pd.aw)) { pd.xp -= awkNeed(pd.aw); pd.aw++; pd.ap++; aw++; } }
  return { lv, aw };
}
const idleLabel = s => s >= IDLE_MAX ? '가득 참!' : `${Math.floor(s / 3600)}시간 ${Math.floor(s % 3600 / 60)}분`;
export function idleTileHtml(pd) {
  const s = idleSec(pd), ok = s >= IDLE_MIN, on = idleOn(pd);
  return `<button class="tidle${ok ? ' ready' : ''}${s >= IDLE_MAX ? ' full' : ''}" id="tIdle"><em>방치 보상</em><img src="${iconURL('px_chest', ICONS.chest)}" alt=""><b>${ok ? idleLabel(s) : on ? '모으는 중' : '잠김'}</b><small>${ok ? '받기!' : on ? '10분부터' : '첫 걸음 후'}</small>${ok ? '<em class="dot"></em>' : ''}</button>`;
}
export function idleClaim() {
  const pd = loadGame(); if (!pd || G.state !== 'title') return;
  if (!idleOn(pd)) { toast('방치 보상은 첫 걸음 가이드를 끝내면 쌓이기 시작해요', 'sub'); return; }
  const s = idleSec(pd); if (s < IDLE_MIN) { toast(`방치 보상은 게임을 쉬는 동안 쌓여요 (10분부터, 최대 12시간)`, 'sub'); return; }
  const r = idleCalc(pd, s); pd.gold += r.gold; pd.stones = (pd.stones || 0) + r.stones; pd.stats.kills += r.kills; const up = idleXp(pd, r.xp); pd.idleT = Date.now();
  G.pd = pd; saveGame(); sfx('lvl');
  const extra = [up.lv ? `레벨 +${up.lv}` : '', up.aw ? `각성 ★+${up.aw}` : ''].filter(Boolean).join(' · ');
  $('#seasonModalBody').innerHTML = `<div class="sgot"><div class="sbig">${PXI('chest')}</div><h2>방치 보상<br><em>${idleLabel(s)}</em></h2><p class="smsub">쉬는 동안 희수와 보리가 몬스터 ${r.kills.toLocaleString()}마리를 잡았어요${extra ? '<br><b>' + extra + '</b>' : ''}<br>(최대 12시간까지 쌓여요)</p>`
    + rewardCards([{ kind: 'gold', amount: r.gold }, { kind: 'xp', amount: r.xp }, { kind: 'stones', amount: r.stones }], true) + '</div>';
  setSmNext(() => showTitle()); seasonModalShow();
}
export function idleBoot() {
  if (FORCE_EASY) return;
  setInterval(() => { try { if (G.state === 'title' && $('#tIdle') && !$('#title').hidden) { const pd = TITLE_PD; if (pd) { const box = document.createElement('div'); box.innerHTML = idleTileHtml(pd); $('#tIdle').replaceWith(box.firstChild); $('#tIdle').onclick = () => { audioInit(); idleClaim(); }; } } } catch (e) { } }, 20000);
}
