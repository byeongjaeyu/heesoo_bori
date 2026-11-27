// ===================== 골드 소모처: 강화석 교환소 · 장비 재련 =====================
// 엔드급 골드 수입 ≈ 시간당 110만(11회차)~300만G(51회차). 교환소 하루 300개 전부 ≈ 210만G, 재련은 끝없는 골드 소모처.

// ---------- 강화석 교환소 (하루 300개, 100개마다 값이 두 배) ----------



import { ICONS } from '../draw/sprites.js';
import { todayKey } from '../core/util.js';
import { iconURL } from '../draw/sprite.js';
import { sfx } from '../sys/audio.js';
import { BSLOTS, ITEMS, SLOTNAME } from '../core/data.js';
import { REF_GRADE, REF_POOL_B, REF_POOL_H, XCH_MAX, refCost, refLineN, refLineTxt, refOf, refRoll, xchCost, xchPriceNow, xchToday } from '../core/refine.js';
import { G } from '../core/state.js';
import { saveGame } from '../core/save.js';
import { calcStats } from '../core/items.js';
import { toast } from '../ui/dialog.js';
import { ENH_SEL } from '../ui/menu.js';

/** k개 사기 (k = Infinity 면 골드로 살 수 있는 만큼) */
export function xchBuy(k) {
  const pd = G.pd, n0 = xchToday(pd); let n = Math.min(k, XCH_MAX - n0);
  if (n <= 0) { toast('오늘 교환소 한도를 다 썼어요. 내일 다시 와요!', 'warn'); return; }
  while (n > 0 && xchCost(n0, n) > pd.gold) n--;
  if (n <= 0) { toast('골드가 부족해요', 'warn'); sfx('hurt'); return; }
  const c = xchCost(n0, n); pd.gold -= c; pd.stones = (pd.stones || 0) + n; pd.xch = { day: todayKey(), n: n0 + n };
  saveGame(); sfx('coin'); toast(`강화석 ${n}개 교환! (-${c.toLocaleString()}G)`, 'lvl');
}
export function xchCardHtml(pd) {
  const n0 = xchToday(pd), left = XCH_MAX - n0, p = xchPriceNow(n0);
  return `<h3>강화석 교환소</h3><div class="card xch"><div class="ic"><img src="${iconURL('i_stone', ICONS.stone)}"></div><div class="mid"><div class="nm">강화석 <small>오늘 ${n0} / ${XCH_MAX}</small></div>`
    + `<div class="ds">${left ? `지금 1개 <b>${p.toLocaleString()}G</b> · 100개마다 값이 두 배` : '오늘 한도를 다 썼어요. 자정에 다시 열려요'}</div>`
    + `<div class="xchbtns"><button class="btn sm pk" data-m="xch" data-v="10" ${left ? '' : 'disabled'}>10개 · ${xchCost(n0, Math.min(10, left)).toLocaleString()}G</button><button class="btn sm wh" data-m="xch" data-v="max" ${left ? '' : 'disabled'}>살 수 있는 만큼</button></div></div></div>`;
}

// ---------- 장비 재련 (추가 옵션) ----------
// 장비마다 추가 옵션 1~3줄 (일반·희귀 1줄 / 영웅·전설 2줄 / 신화·초월 3줄). 골드로 다시 굴림, 줄을 잠그면 잠근 줄 수만큼 값이 더 붙음
/** 재련 1회 (잠근 줄은 그대로). 성공하면 true */
export function refine(id) {
  const pd = G.pd, it = ITEMS[id]; if (!it || it.start) return false;
  const cost = refCost(pd, id); if (pd.gold < cost) { toast('골드가 부족해요', 'warn'); sfx('hurt'); return false; }
  pd.gold -= cost; pd.ref = pd.ref || {}; const r = pd.ref[id] = pd.ref[id] || { lines: [], n: 0 }, N = refLineN(it), pool = it.bori ? REF_POOL_B : REF_POOL_H;
  const keep = r.lines.slice(0, N).filter(l => l.lk), lines = [];
  for (let i = 0; i < N; i++) { const old = r.lines[i]; if (old && old.lk) { lines.push(old); continue; } lines.push(refRoll(pool, [...keep.map(l => l.k), ...lines.map(l => l.k)])); }
  r.lines = lines; r.n++; calcStats(); saveGame(); sfx(lines.some(l => l.g >= 2 && !l.lk) ? 'lvl' : 'coin'); return true;
}
export function refLock(id, i) { const r = refOf(G.pd, id); if (!r || !r.lines[i]) return; if (!r.lines[i].lk && r.lines.filter(l => l.lk).length >= r.lines.length - 1) { toast('한 줄은 남겨야 다시 굴릴 수 있어요', 'warn'); return; } r.lines[i].lk = r.lines[i].lk ? 0 : 1; saveGame(); }
export function refCardHtml(pd, slots) {
  const grp = slots === BSLOTS ? 'b' : 'h', bori = grp === 'b'; let sl = ENH_SEL[grp]; if (!slots.includes(sl)) sl = slots[0];
  const id = bori ? (pd.beq || {})[sl] : pd.eq[sl], it = ITEMS[id];
  if (!it || it.start) return `<div class="card col refc"><div class="nm">재련 · 추가 옵션</div><div class="ds">${SLOTNAME[sl]}에 장비를 착용하면 골드로 추가 옵션을 붙일 수 있어요.</div></div>`;
  const r = refOf(pd, id), N = refLineN(it), cost = refCost(pd, id);
  const rows = Array.from({ length: N }, (_, i) => { const l = r && r.lines[i]; return l ? `<div class="refl g${l.g}"><span>${refLineTxt(l)}</span><em>${REF_GRADE[l.g].n}</em><button class="lk${l.lk ? ' on' : ''}" data-m="refLock" data-v="${id}:${i}">${l.lk ? '잠금' : '열림'}</button></div>` : `<div class="refl none"><span>빈 옵션</span></div>`; }).join('');
  return `<div class="card col refc"><div class="nm">재련 · 추가 옵션 <small>${SLOTNAME[sl]} · <span class="r${it.rar}">${it.name}</span> · ${N}줄</small></div>${rows}`
    + `<div class="ds">옵션 등급: 일반 70% · 희귀 22% · 전설 7% · 신화 1% (최대치 넘음). 잠근 줄 1개마다 값 +1배${r ? ` · 재련 ${r.n}번` : ''}</div>`
    + `<button class="btn pk" data-m="refine" data-v="${id}">${r ? '다시 재련' : '재련하기'} · ${cost.toLocaleString()}G</button></div>`;
}
