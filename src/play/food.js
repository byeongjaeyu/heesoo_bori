// ===================== 필드: 음식 =====================
// ---------- food ----------


import { choice } from '../core/util.js';
import { sfx } from '../sys/audio.js';
import { FOODS, FOOD_ORDER, PREMIUM } from '../core/data.js';
import { G } from '../core/state.js';
import { calcStats } from '../core/items.js';
import { addText, bubble } from './player.js';
import { toast } from '../ui/dialog.js';

export function eatFood(id) {
  const pd = G.pd, P = G.P, f = FOODS[id]; if (!pd.foods[id] || P.eatCd > 0) return false;
  pd.foods[id]--; P.eatCd = 0.5; P.idleT = 0; if (f.eatLine) bubble(P, choice(f.eatLine), 1.4);
  const m = G.st.foodMul, hp = Math.round(G.st.hp * f.hp * m), mp = Math.round(G.st.mp * f.mp * m);
  if (f.buff) { P.buffs[f.buff.id] = Object.assign({}, f.buff); calcStats(); toast(`${f.name} 보양! ${f.buff.t}초간 ` + [f.buff.atk ? `공격력 +${Math.round(f.buff.atk * 100)}%` : '', f.buff.crit ? `치명타 +${Math.round(f.buff.crit * 100)}%` : ''].filter(Boolean).join(' · '), 'lvl'); }
  P.hp = Math.min(G.st.hp, P.hp + hp); P.mp = Math.min(G.st.mp, P.mp + mp);
  if (hp) addText(P.x - 7, P.y - 26, '+' + hp, 'heal'); if (mp) addText(P.x + 7, P.y - 26, '+' + mp, 'mana');
  G.fx.push({ k: 'eat', x: P.x, y: P.y - 24, icon: f.icon, t: 0, dur: 0.8 });
  bubble(P, choice(['냠냠', '맛있다!', '존맛탱', '살 것 같아~', '하나 더?']), 1);
  sfx('eat'); pd.stats.eaten++; return true;
}
export function quickFood(kind) {
  const P = G.P, st = G.st, missing = kind === 'hp' ? st.hp - P.hp : st.mp - P.mp;
  const pick = pickQuickFood(kind, missing);
  if (!pick) { toast(kind === 'hp' ? 'HP 회복 음식이 없어요! (메뉴 → 배달앱)' : 'MP 회복 음식이 없어요! (메뉴 → 배달앱)', 'warn'); sfx('warn'); return; }
  eatFood(pick);
}
export function pickQuickFood(kind, missing) {
  const st = G.st; const cands = FOOD_ORDER.filter(id => G.pd.foods[id] > 0 && FOODS[id][kind] > 0 && !PREMIUM.includes(id));
  if (!cands.length) return PREMIUM.find(id => G.pd.foods[id] > 0) || null;
  const val = id => FOODS[id][kind] * (kind === 'hp' ? st.hp : st.mp) * st.foodMul;
  cands.sort((a, b) => val(a) - val(b));
  return cands.find(id => val(id) >= missing) || cands[cands.length - 1];
}
