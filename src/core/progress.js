// ===================== 경험치·레벨·각성 =====================
// ---------- progression ----------


import { choice } from './util.js';
import { emit } from './events.js';
import { sfx } from '../sys/audio.js';
import { SKILLS, awkNeed, xpNeed } from './data.js';
import { G } from './state.js';
import { saveGame } from './save.js';
import { calcStats } from './items.js';

export const MAX_LV = 50;
export function gainXp(x) {
  const pd = G.pd; if (pd.lv >= MAX_LV) { awkGain(x); return; } pd.xp += x;
  let up = false;
  while (pd.lv < MAX_LV && pd.xp >= xpNeed(pd.lv)) { pd.xp -= xpNeed(pd.lv); pd.lv++; pd.sp++; up = true; }
  if (up) levelUp();
}
function awkGain(x) {
  const pd = G.pd; pd.aw = pd.aw || 0; pd.ap = pd.ap || 0; pd.xp += x; let n = 0;
  while (pd.xp >= awkNeed(pd.aw)) { pd.xp -= awkNeed(pd.aw); pd.aw++; pd.ap++; n++; }
  if (!n) return;
  calcStats(); G.fx.push({ k: 'lvl', x: G.P.x, y: G.P.y, t: 0, dur: 1.3 }); sfx('lvl');
  emit('toast', `각성! ★${pd.aw}`, 'lvl'); emit('toast', '각성 포인트 +' + n + ' · 메뉴 → 스킬에서 능력치를 올려주세요', 'sub');
  emit('bubble', G.P, choice(['아직 더 강해질 수 있어!', '한계 돌파~!', '각성했다!']), 1.2); saveGame();
}
export const awkLv = k => ((G.pd && G.pd.awp) || {})[k] || 0;
function levelUp() {
  const pd = G.pd; calcStats(); G.P.hp = G.st.hp; G.P.mp = G.st.mp;
  G.fx.push({ k: 'lvl', x: G.P.x, y: G.P.y, t: 0, dur: 1.3 }); sfx('lvl');
  emit('toast', `LEVEL UP!  Lv.${pd.lv}`, 'lvl'); emit('toast', '스킬 포인트 +1 · 메뉴에서 스킬을 찍어주세요', 'sub');
  for (const id in SKILLS) { const s = SKILLS[id]; if (s.req === pd.lv && (s.who === 'h' || pd.boriJoined)) emit('toast', `새 스킬 해금: ${s.name}`, 'item r2'); }
  if (pd.lv >= 3 && !pd.boriJoined) G.pendingEvent = 'bori';
  emit('bubble', G.P, choice(['강해졌다!', '레벨업~!', '느낌 좋아!']), 1.2);
  saveGame();
}

// ---------- 조회 (회차 보상·보스 타워 기록) ----------
export const msGot = (pd, n) => !!(pd.ms && pd.ms[n]);
export const towerBest = pd => (pd.tower && pd.tower.best) || 0;
