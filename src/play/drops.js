// ===================== 필드: 땅에 떨어진 드롭 줍기·도감 등록 알림 (드롭 확률은 core/loop.js) =====================
// ---------- drops ----------


import { rand } from '../core/util.js';
import { sfx } from '../sys/audio.js';
import { BOOK_ALL, BOOK_SETS, FOODS, ITEMS, PREMIUM } from '../core/data.js';
import { G } from '../core/state.js';
import { addItem, bookStats, calcStats, feedEquip, keepDupOf, ownsDef } from '../core/items.js';
import { addText, bubble, moveToward } from './player.js';
import { dupStones } from '../core/enhance.js';
import { toast } from '../ui/dialog.js';

export function spawnDrop(kind, id, amt, x, y) { const a = rand(0, 6.28), s = rand(15, 45); G.drops.push({ kind, id, amt, x, y, z: 4, vz: rand(40, 70), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, t: 0 }); }
export function updateDrops(dt) {
  const P = G.P;
  for (const d of G.drops) {
    d.t += dt;
    if (d.z > 0 || d.vz > 0) { d.vz -= 220 * dt; d.z += d.vz * dt; if (d.z <= 0) { d.z = 0; d.vz = Math.abs(d.vz) > 25 ? -d.vz * 0.4 : 0; } d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= Math.pow(0.05, dt); d.vy *= Math.pow(0.05, dt); }
    const dd = Math.hypot(P.x - d.x, P.y - 4 - d.y);
    if (d.t > 0.45 && (dd < (G.auto ? 90 : 44) || d.mag)) { d.mag = true; moveToward(d, P.x, P.y - 4, 160 + d.t * 40, dt); }
    if (d.t > 0.45 && dd < 8) { pickup(d); d.gone = true; }
    if (d.kind !== 'item' && d.kind !== 'stone' && d.t > 45) d.gone = true;
  }
  G.drops = G.drops.filter(d => !d.gone);
}
function pickup(d) {
  const pd = G.pd, P = G.P;
  if (d.kind === 'gold') { pd.gold += d.amt; addText(P.x, P.y - 28, '+' + d.amt + 'G', 'gold'); sfx('coin'); }
  else if (d.kind === 'stone') { pd.stones = (pd.stones || 0) + d.amt; addText(P.x, P.y - 32, '강화석 +' + d.amt, 'mana'); sfx('ding'); }
  else if (d.kind === 'food') { pd.foods[d.id] = (pd.foods[d.id] || 0) + 1; addText(P.x, P.y - 30, '+' + FOODS[d.id].name, 'food'); sfx('ding'); if (PREMIUM.includes(d.id)) toast(`${FOODS[d.id].name} 획득! 최고급 보양식`, 'lvl'); }
  else if (d.kind === 'item') {
    const it = ITEMS[d.id], own = ownsDef(pd, d.id), keep = own && keepDupOf(pd, it);
    const fed = !keep && feedEquip(it), isNewBook = !(pd.book || {})[d.id];
    if (keep) { addItem(pd, d.id); if (it.bori) pd.newBori = true; else pd.newItem = true; toast(`${it.name} (중복) → 가방에 보관 (메뉴 → ${it.bori ? '보리' : '장비'})`, 'item r' + it.rar); sfx('ding'); }
    else if (own) { if (fed) return; const s = dupStones(d.id); pd.stones = (pd.stones || 0) + s; toast(s ? `${it.name} (중복) → 강화석 ${s}개` : `${it.name} (중복) → 강화석은 꽝...`, 'sub'); if (s) sfx('coin'); }
    else if (it.bori) { const k = addItem(pd, d.id); if (!pd.beq[it.slot]) { pd.beq[it.slot] = k; calcStats(); toast(`${it.name} 획득! 보리가 바로 ${it.slot === 'btoy' ? '물었어요' : '입었어요'}`, 'item r' + it.rar); if (G.bori) bubble(G.bori, '멍멍! (신남)', 1.4); } else { pd.newBori = true; toast(`보리 장비 획득: ${it.name}! (메뉴 → 보리)`, 'item r' + it.rar); } sfx('ding'); }
    else { addItem(pd, d.id); pd.newItem = true; toast(`새 장비 획득: ${it.name}! (메뉴 → 장비)`, 'item r' + it.rar); sfx('ding'); }
    if (isNewBook) bookNotify(d.id);
  }
}
/** 도감 새로 등록 알림 + 세트 완성 축하 */
export function bookNotify(id) {
  const pd = G.pd, before = bookStats(pd).done; pd.book[id] = 1; calcStats(); const after = bookStats(pd);
  toast(`📖 도감 등록! ${ITEMS[id].name} (${after.n}/${BOOK_ALL.length})`, 'sub');
  for (const s of BOOK_SETS) if (after.done[s.k] && !before[s.k]) { toast(`📖 ${s.name} 도감 완성! ${s.txt}`, 'lvl'); sfx('lvl'); }
}
