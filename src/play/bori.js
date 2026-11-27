// ===================== 필드: 보리 =====================
// ---------- bori ----------
// 보리 스킬 「언니줘!」: HP·MP가 기준 아래로 떨어지면 보리가 음식을 물어다 먹여줌 (최고급 음식 제외)


import { choice, clamp, rand } from '../core/util.js';
import { sfx } from '../sys/audio.js';
import { FOODS, PREMIUM } from '../core/data.js';
import { G } from '../core/state.js';
import { sk } from '../core/save.js';
import { bubble, collide, dealDamage, isOnPhone, moveToward } from './player.js';
import { eatFood, pickQuickFood } from './food.js';

const FEED_TH = [[0, 0], [0.4, 0.3], [0.5, 0.4], [0.6, 0.5]];
export function autoFeed(dt) {
  const lv = sk('feed'), P = G.P, B = G.bori, st = G.st; if (!lv || !B || !G.pd.boriJoined || !P || G.ult) return;
  G.feedCd = (G.feedCd || 0) - dt; if (G.feedCd > 0 || P.eatCd > 0) return;
  const [th, tm] = FEED_TH[lv];
  for (const k of ['hp', 'mp']) {
    const cur = k === 'hp' ? P.hp / st.hp : P.mp / st.mp; if (cur >= (k === 'hp' ? th : tm)) continue;
    const id = pickQuickFood(k, k === 'hp' ? st.hp - P.hp : st.mp - P.mp); if (!id || PREMIUM.includes(id)) continue;
    G.fx.push({ k: 'eat', icon: FOODS[id].icon, x: (B.x + P.x) / 2, y: (B.y + P.y) / 2 - 10, t: 0, dur: 0.5 });
    eatFood(id); G.feedCd = 1.2; bubble(B, choice(['멍! (언니 이거 먹어!)', '언니 줘!', '앙! (배달 왔어요)']), 1.2); return;
  }
}
export function updateBori(dt) {
  const B = G.bori; if (!B || B.hidden) return; const P = G.P;
  B.t += dt; B.biteCd -= dt; B.barkCd -= dt; B.zoomCd -= dt; if (B.jump > 0) B.jump -= dt;
  if (B.zoom) {
    const z = B.zoom; z.t += dt; const pt = z.pts[z.i];
    if (pt) { moveToward(B, pt.x, pt.y, 230, dt); if (Math.hypot(pt.x - B.x, pt.y - B.y) < 4) z.i++; } else z.i = 999;
    for (const e of G.enemies) { if (e.dead || z.hit.has(e.id)) continue; if (Math.hypot(e.x - B.x, e.y - B.y) < e.r + 7) { z.hit.add(e.id); dealDamage(e, G.st.atk * (1.2 + 0.4 * z.lv) * G.st.boriMul, { kb: 80, ang: Math.atan2(e.y - B.y, e.x - B.x) }); } }
    if (Math.random() < dt * 30) G.parts.push({ x: B.x, y: B.y, vx: rand(-15, 15), vy: rand(-10, 0), life: 0.35, max: 0.35, col: '#e8dcc8', sz: 2, grav: 0 });
    B.run = true; if (z.i >= z.pts.length || z.t > 2.2) B.zoom = null;
    collide(B, 3); return;
  }
  const bl = sk('bark');
  if (bl && B.barkCd <= 0) { const r = 45 + 5 * bl; const ns = G.enemies.filter(e => !e.dead && e.spawnT <= 0 && Math.hypot(e.x - B.x, e.y - B.y) < r + e.r); if (ns.length) { B.barkCd = 9 - 0.6 * (bl - 1); sfx('bark'); bubble(B, '멍멍!', 1); G.fx.push({ k: 'ring', x: B.x, y: B.y - 5, r, col: '#ffd84a', t: 0, dur: 0.45 }); for (const e of ns) dealDamage(e, G.st.atk * (0.6 + 0.2 * bl) * G.st.boriMul, { fear: 1.6, kb: 90, ang: Math.atan2(e.y - B.y, e.x - B.x) }); } }
  const zl = sk('zoomies');
  if (zl && B.zoomCd <= 0) { const ns = G.enemies.filter(e => !e.dead && e.spawnT <= 0 && Math.hypot(e.x - P.x, e.y - P.y) < 95); if (ns.length >= 2) { B.zoomCd = 12; ns.sort((a, b) => Math.hypot(a.x - B.x, a.y - B.y) - Math.hypot(b.x - B.x, b.y - B.y)); const pts = ns.slice(0, 6).map(e => ({ x: e.x + rand(-4, 4), y: e.y + rand(-3, 3) })); pts.push({ x: P.x + 10, y: P.y + 3 }); B.zoom = { t: 0, i: 0, pts, hit: new Set(), lv: zl }; bubble(B, '우다다다!', 1.2); } }
  let tgt = null;
  if (B.target && !B.target.dead && Math.hypot(B.target.x - P.x, B.target.y - P.y) < 115) tgt = B.target;
  else { tgt = null; let bd = 75; for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; if (Math.hypot(e.x - P.x, e.y - P.y) > 105) continue; const d = Math.hypot(e.x - B.x, e.y - B.y); if (d < bd) { bd = d; tgt = e; } } B.target = tgt; }
  if (tgt) {
    const d = Math.hypot(tgt.x - B.x, tgt.y - B.y);
    if (d > tgt.r + 6) { moveToward(B, tgt.x, tgt.y, 100, dt); B.run = true; }
    else { B.run = false; B.face = tgt.x > B.x ? 1 : -1; if (B.biteCd <= 0) { B.biteCd = 0.75; dealDamage(tgt, G.st.atk * (0.4 + 0.15 * sk('bite')) * G.st.boriMul, { kb: 30, ang: Math.atan2(tgt.y - B.y, tgt.x - B.x) }); G.fx.push({ k: 'bite', x: tgt.x, y: tgt.y - tgt.h * 0.5, t: 0, dur: 0.3 }); if (Math.random() < 0.15) bubble(B, choice(['앙!', '왈!', '으르릉']), 0.8); } }
  } else {
    const side = B.x < P.x ? -1 : 1; const tx = P.x + side * 13, ty = P.y + 3; const d = Math.hypot(tx - B.x, ty - B.y);
    if (d > 5) { moveToward(B, tx, ty, Math.max(G.st.moveSpd * 1.2, d > 60 ? 160 : 75), dt); B.run = d > 7; } else B.run = false;
    if (!B.run && isOnPhone()) B.face = P.x > B.x ? 1 : -1;
  }
  if (Math.hypot(P.x - B.x, P.y - B.y) > 220) { B.x = P.x - 12; B.y = P.y + 3; }
  B.x = clamp(B.x, 20, G.world.W - 20); B.y = clamp(B.y, G.world.top || 34, G.world.H - 14);
}
