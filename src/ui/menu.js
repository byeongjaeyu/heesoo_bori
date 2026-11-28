// ===================== 메뉴 (탭·장비·스킬·도감·칭호·전직·꾸미기·배달앱·이야기·정보) =====================
// ---------- menu ----------


import { ICONS } from '../draw/sprites.js';
import { $ } from '../sys/dom.js';
import { choice, fmtTime } from '../core/util.js';
import { iconURL, mkCanvas, spr, sprBlit } from '../draw/sprite.js';
import { SND, setSound, sfx } from '../sys/audio.js';
import { INP, hideJoy } from '../sys/input.js';
import { AWK, BOOK_ALL, BOOK_PER_HP, BOOK_SETS, BSLOTS, EQ_SETS, FOODS, FOOD_ORDER, HAIRS, ITEMS, LOOK_SLOTS, RARITY, SKILLS, SKILL_TYPE, SLOTNAME, SLOTS, awkNeed, bookIds, defOf } from '../core/data.js';
import { REF_GRADE, refLineTxt, refOf, xchPlan } from '../core/refine.js';
import { refCardHtml, refLock, refine, xchBuy, xchCardHtml } from '../features/refine.js';
import { G } from '../core/state.js';
import { ILV_BONUS, ILV_NEED, loadGame, saveGame, sk } from '../core/save.js';
import { BAG_MAX, addItem, bookStats, calcStats, dropItem, eqSetN, hairOk, ilvOf, ownsDef, visEq } from '../core/items.js';
import { bubble } from '../play/player.js';
import { bookNotify } from '../play/drops.js';
import { BRK_MAX, BRK_STEP, ENH_FX, ENH_MAX, brkCost, canDismantle, dismantle, enhCost, enhOdds, enhReset, enhStoneCost, sellPrice, stoneYield, tryBreak, tryEnhance } from '../core/enhance.js';
import { eatFood } from '../play/food.js';
import { MAX_LV, awkLv } from '../core/progress.js';
import { JOBS, JOB_LV } from '../core/job.js';
import { jobAsk, jobHtml } from '../features/job.js';
import { boriSpr, itemURL } from '../draw/render.js';
import { toast } from './dialog.js';
import { setHudImages } from './hud.js';
import { newGame, showTitle } from './lobby.js';
import { esc } from '../net/pvp.js';
import { infLeave } from '../play/inf.js';
import { fighterURL, rankSync } from '../net/rank.js';
import { dailyClaimable, dailyHtml, dailyScrollToday } from '../features/daily.js';
import { achvHtml } from '../features/achv.js';
import { replayHtml, replayPlay } from '../story/replay.js';
import { tt } from '../sys/i18n.js';

export let MTAB = 'skill';
export function setMTab(t) { MTAB = t; }
const TABS = [['skill', tt('ui/menu.1')], ['equip', tt('ui/menu.2')], ['bori', tt('ui/menu.3')], ['daily', tt('ui/menu.4')], ['book', tt('ui/menu.5')], ['achv', tt('ui/menu.6')], ['job', tt('ui/menu.7')], ['look', tt('ui/menu.8')], ['food', tt('ui/menu.9')], ['shop', tt('ui/menu.10')], ['story', tt('ui/menu.11')], ['info', tt('ui/menu.12')]];
export function openMenu(tab) { if (G.state !== 'play') return; G.state = 'menu'; INP.atk = false; INP.joy.on = false; hideJoy(); if (tab) MTAB = tab; else if (G.pd.sp > 0) MTAB = 'skill'; else if (G.pd.newItem) MTAB = 'equip'; else if (G.pd.newBori) MTAB = 'bori'; $('#menu').hidden = false; renderMenu(true); sfx('select'); }
/** 로비(타이틀)에서 메뉴 열기 — 음식 탭 빼고 장비·스킬·강화·도감·칭호·꾸미기 등 */
export function lobbyMenu(tab) {
  const saved = loadGame(); if (!saved || G.state !== 'title') return;
  G.pd = saved; G.P = null; G.bori = null; calcStats(); G.state = 'lobbyMenu'; $('#title').hidden = true;
  MTAB = tab || (G.pd.sp > 0 ? 'skill' : G.pd.newItem ? 'equip' : G.pd.newBori ? 'bori' : 'equip'); $('#menu').hidden = false; renderMenu(true);
}
export function closeMenu() { if (G.state === 'lobbyMenu') { $('#menu').hidden = true; saveGame(); showTitle(); return; }
  $('#menu').hidden = true; if (G.state === 'menu') G.state = 'play'; saveGame(); setHudImages(); }
export function renderMenu(top) {
  const pd = G.pd;
  if (G.state === 'lobbyMenu' && MTAB === 'food') MTAB = 'equip';
  $('#tabs').innerHTML = TABS.filter(([k]) => !(G.state === 'lobbyMenu' && k === 'food')).map(([k, n]) => `<button class="tab ${k === MTAB ? 'on' : ''}" data-m="tab" data-v="${k}">${n}${k === 'skill' && pd.sp > 0 ? `<em>${pd.sp}</em>` : ''}${k === 'equip' && pd.newItem ? '<em>N</em>' : ''}${k === 'job' && pd.lv >= JOB_LV && !JOBS[pd.job] ? '<em>!</em>' : ''}${k === 'bori' && pd.newBori ? '<em>N</em>' : ''}${k === 'achv' && pd.achNew ? '<em>N</em>' : ''}${k === 'daily' && dailyClaimable(pd) ? `<em>${dailyClaimable(pd)}</em>` : ''}</button>`).join('');
  { const on = $('#tabs .tab.on'); if (on && top) try { on.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { } }
  const b = $('#mbody'), sc = b.scrollTop; b.innerHTML = (MTAB === 'equip' || MTAB === 'bori' ? walletHtml(pd) : '') + MREN[MTAB](); b.scrollTop = top ? 0 : sc;
  if (MTAB === 'equip' && pd.newItem) { pd.newItem = false; }
  if (MTAB === 'bori' && pd.newBori) { pd.newBori = false; }
}
/** 장비·보리 탭 맨 위: 보유 골드·강화석 */
const walletHtml = pd => tt('ui/menu.13', { v1: iconURL('i_coin', ICONS.coin), v2: pd.gold.toLocaleString(), v3: iconURL('i_stone', ICONS.stone), v4: (pd.stones || 0).toLocaleString() });
const ilvTag = id => ilvOf(id) ? ` Lv.${ilvOf(id)}` : '';
/** 같은 장비가 또 나오면: 강화석(기본) / 등급 이상 가방에 보관 */
function keepDupHtml(/** @type {SaveData} */ pd) {
  const cur = pd.keepDup == null ? -1 : pd.keepDup, n = Object.keys(pd.inv).length;
  const opt = [[-1, tt('ui/menu.14')], [3, tt('ui/menu.15')], [4, tt('ui/menu.16')], [5, tt('ui/menu.17')]];
  return tt('ui/menu.18', { n, BAG_MAX, v1: opt.map(([v, t]) => `<button class="btn sm${cur === v ? ' on' : ''}" data-m="keepDup" data-v="${v}">${t}</button>`).join('') });
}
/** 이 장비에 붙은 추가 옵션 (재련은 장비마다 — 벗거나 넘기면 옵션도 같이 감) */
function refLine(id) { const r = refOf(G.pd, id); if (!r || !r.lines.length) return ''; return tt('ui/menu.19', { v1: r.lines.map(l => `<b class="g${l.g}">${refLineTxt(l)}</b>`).join(' · ') }); }
function ilvLine(id, eq) { const lv = ilvOf(id), x = (G.pd.iexp || {})[id] || 0; if (!lv && !x && !eq) return ''; return tt('ui/menu.131', { lv, x, ILV_NEED, v1: lv ? tt('ui/menu.20', { v1: Math.round(ILV_BONUS * 100 * lv) }) : '', v2: eq ? tt('ui/menu.21') : '' }); }
function statStr(it) {
  const a = [];
  if (it.atk) a.push(tt('ui/menu.22', { atk: it.atk })); if (it.def) a.push(tt('ui/menu.23', { def: it.def })); if (it.hp) a.push(`HP +${it.hp}`); if (it.mp) a.push(`MP +${it.mp}`);
  if (it.spd) a.push(tt('ui/menu.24', { v1: Math.round(it.spd * 100) })); if (it.crit) a.push(tt('ui/menu.25', { v1: Math.round(it.crit * 100) }));
  if (it.w) a.push(tt('ui/menu.26', { reach: it.w.reach, rate: it.w.rate }));
  return a.join(' · ') || tt('ui/menu.27');
}
function awkPanel() {
  const pd = G.pd;
  if (pd.lv < MAX_LV) return tt('ui/menu.28', { MAX_LV });
  const ap = pd.ap || 0, aw = pd.aw || 0, spent = Object.values(pd.awp || {}).reduce((a, b) => a + b, 0), pct = Math.min(100, Math.round(pd.xp / awkNeed(aw) * 100));
  const rows = Object.keys(AWK).map(k => { const A = AWK[k], lv = awkLv(k), full = A.max && lv >= A.max, lock = A.bori && !pd.boriJoined;
    return tt('ui/menu.132', { v1: lock ? ' dim' : '', v2: iconURL('sk_' + A.icon, ICONS[A.icon]), name: A.name, v3: A.fmt(A.per * lv), lv, v4: A.fmt(A.per), v5: A.max ? tt('ui/menu.29', { max: A.max }) : '', v6: A.desc ? '<br>' + A.desc : '', k, v7: ap > 0 && !full && !lock ? '' : 'disabled', v8: full ? 'MAX' : '+1' }); }).join('');
  return tt('ui/menu.30', { aw, pct, ap, v1: spent ? '' : 'disabled', rows });
}
export let ENH_SEL = { h: 'weapon', b: 'btoy' };
function enhCard(slots) {
  const pd = G.pd, grp = slots === BSLOTS ? 'b' : 'h', bori = grp === 'b';
  let sl = ENH_SEL[grp]; if (!slots.includes(sl)) sl = slots[0];
  const eqOf = s => bori ? pd.beq[s] : pd.eq[s];
  const chips = `<div class="enhsel">${slots.map(s => { const id = eqOf(s), en = id ? (pd.enh || {})[id] || 0 : 0; return `<button class="${s === sl ? 'on' : ''}" data-m="enhSel" data-v="${grp}:${s}">${SLOTNAME[s]}${en ? ` <b>+${en}</b>` : ''}</button>`; }).join('')}</div>`;
  const id = eqOf(sl), it = ITEMS[id];
  if (!it) return tt('ui/menu.133', { chips, v1: SLOTNAME[sl], v2: bori ? tt('ui/menu.31') : '' });
  const en = (pd.enh || {})[id] || 0, cost = enhCost(en), max = en >= ENH_MAX, sc = enhStoneCost(en), stn = pd.stones || 0, o = max ? null : enhOdds(en, false), pct = x => Math.round(x * 100) + '%';
  const img = id === 'fist' ? iconURL('sk_fist', ICONS.fist) : itemURL(id);
  if (max) return brkCardHtml(pd, sl, id, it, en, img, chips);
  return tt('ui/menu.149', { chips, v1: en >= 20 ? ' glow20' : '', img, v2: SLOTNAME[sl], rar: it.rar, name: it.name, v3: en ? ' +' + en : '', v4: ENH_FX[sl].txt(en), v5: max ? '' : tt('ui/menu.134', { en, v1: en + 1, v2: pct(o.p), v3: o.dn ? tt('ui/menu.32', { v1: pct(o.dn) }) : '', v4: o.ds ? tt('ui/menu.33', { v1: pct(o.ds), v2: enhReset(en) }) : '' }), v6: max ? tt('ui/menu.34', { ENH_MAX }) : tt('ui/menu.35', { v1: cost.toLocaleString(), v2: pd.gold.toLocaleString(), stn }), v7: max ? '<button class="btn pk" disabled>MAX</button>' : tt('ui/menu.36', { sl, v1: pd.gold >= cost ? '' : 'disabled', v2: pd.gold >= cost && stn >= sc ? '' : 'disabled', sc }) });
}
/** +20 이상 강화·한계 돌파 성공 연출 (메뉴 위 화면 전체) */
function enhFx(kind, big, sub) {
  const el = document.createElement('div'); el.className = 'enhfx ' + kind;
  el.innerHTML = `<i class="rays"></i><i class="ring"></i>${Array.from({ length: kind === 'brk' ? 18 : 12 }, (_, i) => `<i class="sp" style="--a:${i * (360 / (kind === 'brk' ? 18 : 12))}deg;--d:${0.6 + (i % 3) * 0.15}s"></i>`).join('')}<b>${esc(big)}</b><small>${esc(sub || '')}</small>`;
  document.body.appendChild(el); setTimeout(() => el.remove(), kind === 'brk' ? 2200 : 1700);
}
/** +25 장비: 한계 돌파 카드 (+26~+30) */
function brkCardHtml(pd, sl, id, it, en, img, chips) {
  const done = en >= BRK_MAX, c = done ? null : brkCost(en), stn = pd.stones || 0, can = c && pd.gold >= c.gold && stn >= c.stones;
  const bonus = Math.round(BRK_STEP * (en - ENH_MAX) * 100);
  return tt('ui/menu.37', { chips, v1: en > 25 ? 'glowB' : 'glow25', img, v2: SLOTNAME[sl], rar: it.rar, name: it.name, en })
    + tt('ui/menu.135', { v1: ENH_FX[sl].txt(en), v2: bonus ? tt('ui/menu.38', { bonus }) : '', v3: done ? '' : tt('ui/menu.39', { en, v1: en + 1, v2: Math.round(c.p * 100), v3: Math.round(BRK_STEP * 100) }) })
    + `<div class="nx">${done ? tt('ui/menu.40', { BRK_MAX }) : tt('ui/menu.41', { v1: c.stones.toLocaleString(), v2: c.gold.toLocaleString(), v3: stn.toLocaleString() })}</div></div>`
    + (done ? '<button class="btn pk" disabled>MAX</button>' : tt('ui/menu.42', { sl, v1: can ? '' : 'disabled', v2: c.stones.toLocaleString() })) + '</div></div>';
}
function skillCard(id) {
  const s = SKILLS[id], lv = sk(id), pd = G.pd; const locked = s.who === 'b' && !pd.boriJoined; const reqOk = pd.lv >= s.req;
  const can = pd.sp > 0 && lv < s.max && reqOk && !locked;
  const dots = Array.from({ length: s.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
  const cur = lv ? s.desc(lv) : (id === 'bite' ? s.desc(0) : tt('ui/menu.43'));
  const meta = s.mp ? tt('ui/menu.44', { mp: s.mp, v1: s.cd(Math.max(1, lv)) }) : '';
  const nx = locked ? tt('ui/menu.45') : (!reqOk ? tt('ui/menu.46', { req: s.req }) : (lv < s.max ? tt('ui/menu.47', { v1: s.desc(lv + 1) }) : tt('ui/menu.48')));
  return `<div class="card ${(!reqOk || locked) ? 'dim' : ''}"><div class="ic"><img src="${iconURL('sk_' + s.icon, ICONS[s.icon])}"></div><div class="mid"><div class="nm">${s.name}<span class="tag ${s.type}">${SKILL_TYPE[s.type]}</span><span class="lvdots">${dots}</span></div><div class="ds">${lv ? tt('ui/menu.49') : ''}${cur}${meta}</div><div class="nx">${nx}</div></div><button class="btn plus" data-m="learn" data-v="${id}" ${can ? '' : 'disabled'}>+</button></div>`;
}
/** 착용 세트 카드 (조각을 하나라도 가지면 보임) */
function eqSetHtml(pd) {
  return EQ_SETS.filter(S => S.ids.some(id => ownsDef(pd, id))).map(S => { const n = eqSetN(pd, S), all = n >= S.ids.length, on = new Set([...SLOTS.map(sl => defOf(pd.eq[sl])), ...BSLOTS.map(sl => pd.beq && pd.beq[sl] ? defOf(pd.beq[sl]) : '')]);
    return tt('ui/menu.136', { v1: all ? ' on' : '', name: S.name, n, length: S.ids.length, v2: S.ids.map(id => `<img class="${on.has(id) ? 'w' : ownsDef(pd, id) ? 'h' : 'x'}" src="${itemURL(id)}" title="${ITEMS[id].name}">`).join(''), v3: all ? tt('ui/menu.50') + S.txt : tt('ui/menu.51', { length: S.ids.length, txt: S.txt }) }); }).join('');
}
const MREN = {
  story() { return replayHtml(G.pd); },
  look() {
    const pd = G.pd, L = pd.look || {}, b = pd.book || {};
    const prev = fighterURL({ vis: visEq(pd), hair: L.hair || 'base', bori: pd.boriJoined, beq: pd.beq }, 6);
    let h = tt('ui/menu.52', { prev });
    h += tt('ui/menu.53') + HAIRS.filter(hr => !hr.excl || hairOk(pd, hr)).map(hr => { const ok = hairOk(pd, hr), on = (L.hair || 'base') === hr.k;
      return `<button class="hair${on ? ' on' : ''}${ok ? '' : ' lock'}" data-m="hair" data-v="${hr.k}" ${ok ? '' : 'disabled'}><i style="background:linear-gradient(135deg,${hr.h},${hr.H})"></i><small>${ok ? hr.name : '🔒 ' + hr.cond}</small></button>`; }).join('') + '</div>';
    for (const sl of LOOK_SLOTS) {
      const own = Object.keys(b).filter(id => ITEMS[id] && ITEMS[id].slot === sl && !ITEMS[id].bori && ITEMS[id].color).sort((x, y) => ITEMS[x].rar - ITEMS[y].rar || (ITEMS[x].tier || 0) - (ITEMS[y].tier || 0));
      h += tt('ui/menu.54', { v1: SLOTNAME[sl], length: own.length })
        + tt('ui/menu.55', { v1: !L[sl] ? ' on' : '', sl })
        + own.map(id => `<button class="lk${L[sl] === id ? ' on' : ''}" data-m="look" data-v="${sl}:${id}" title="${ITEMS[id].name}"><img src="${itemURL(id)}"><small class="r${ITEMS[id].rar}">${ITEMS[id].name}</small></button>`).join('') + '</div>';
    }
    return h;
  },
  book() {
    const pd = G.pd, bk = bookStats(pd), b = pd.book || {};
    let h = tt('ui/menu.56', { n: bk.n, length: BOOK_ALL.length, BOOK_PER_HP, v1: BOOK_PER_HP * bk.n });
    for (const s of BOOK_SETS) {
      const ids = bookIds(s).sort((x, y) => (ITEMS[x].tier || 0) - (ITEMS[y].tier || 0) || ITEMS[x].slot.localeCompare(ITEMS[y].slot)), got = ids.filter(id => b[id]).length, done = bk.done[s.k];
      h += tt('ui/menu.57', { v1: done ? ' done' : '', v2: s.bori ? '' : 'r' + s.rar, name: s.name, got, length: ids.length, v3: done ? '✔ ' : '', txt: s.txt })
        + ids.map(id => { const it = ITEMS[id], has = !!b[id]; return `<div class="bcell${has ? '' : ' no'}" title="${has ? it.name : '???'}"><img src="${itemURL(id)}"><small>${has ? it.name : '???'}</small></div>`; }).join('') + '</div></div>';
    }
    return h;
  },
  daily() { dailyScrollToday(); return dailyHtml(G.pd); },
  achv() { return achvHtml(G.pd); },
  job() { return jobHtml(G.pd); },
  skill() {
    const pd = G.pd; const used = Object.values(pd.skills).reduce((a, b) => a + b, 0);
    return awkPanel() + tt('ui/menu.137', { sp: pd.sp, v1: used ? '' : 'disabled', v2: Object.keys(SKILLS).filter(k => SKILLS[k].who === 'h').map(skillCard).join(''), v3: pd.boriJoined ? tt('ui/menu.58') : tt('ui/menu.59'), v4: Object.keys(SKILLS).filter(k => SKILLS[k].who === 'b').map(skillCard).join('') });
  },
  equip() {
    const pd = G.pd, st = G.st;
    let h = tt('ui/menu.60', { atk: st.atk, def: st.def, v1: Math.round(st.crit * 100), hp: st.hp, mp: st.mp, v2: Math.round(st.spd * 100) });
    h += enhCard(SLOTS); h += refCardHtml(pd, SLOTS);
    h += `<div class="slots">${SLOTS.map(sl => { const it = ITEMS[pd.eq[sl]]; return `<div class="slot"><img src="${itemURL(pd.eq[sl])}">${SLOTNAME[sl]}<br><b class="r${it.rar}">${it.name}${ilvTag(pd.eq[sl])}${(pd.enh || {})[pd.eq[sl]] ? ' +' + pd.enh[pd.eq[sl]] : ''}</b></div>`; }).join('')}</div>`;
    h += eqSetHtml(pd);
    h += tt('ui/menu.61');
    h += tt('ui/menu.62') + tt('ui/menu.63', { v1: pd.stones || 0 });
    h += keepDupHtml(pd);
    for (const sl of SLOTS) {
      const ids = Object.keys(pd.inv).filter(id => ITEMS[id] && ITEMS[id].slot === sl).sort((a, b) => (ITEMS[a].rar - ITEMS[b].rar) || ((ITEMS[a].tier || 0) - (ITEMS[b].tier || 0)));
      h += tt('ui/menu.64', { v1: SLOTNAME[sl], length: ids.length });
      for (const id of ids) {
        const it = ITEMS[id], eq = pd.eq[sl] === id;
        h += `<div class="card"><div class="ic"><img src="${itemURL(id)}"></div><div class="mid"><div class="nm"><span class="r${it.rar}">${it.name}${ilvTag(id)}${(pd.enh || {})[id] ? ' +' + pd.enh[id] : ''}</span><span class="tag">${RARITY[it.rar]}</span></div><div class="ds">${statStr(it)}${ilvLine(id, eq)}${refLine(id)}${it.desc ? `<br><small>${it.desc}</small>` : ''}</div></div>${eq ? tt('ui/menu.65') : tt('ui/menu.138', { id, v1: it.start ? '' : tt('ui/menu.66', { id, v1: sellPrice(id) }), v2: canDismantle(id) ? tt('ui/menu.67', { id, v1: stoneYield(id) }) : '' })}</div>`;
      }
    }
    return h;
  },
  bori() {
    const pd = G.pd, st = G.st; let h = '';
    if (!pd.boriJoined) h += tt('ui/menu.68');
    else {
      h += eqSetHtml(pd);
      h += tt('ui/menu.139', { v1: boriPreviewURL(), v2: Math.round((st.boriMul - 1) * 100), v3: BSLOTS.map(sl => { const id = pd.beq[sl], it = ITEMS[id]; return `<div class="slot">${it ? `<img src="${itemURL(id)}">` : tt('ui/menu.69')}${SLOTNAME[sl]}<br><b class="r${it ? it.rar : 0}">${it ? it.name + ilvTag(id) : '-'}${it && (pd.enh || {})[id] ? ' +' + pd.enh[id] : ''}</b></div>`; }).join('') });
      h += enhCard(BSLOTS) + refCardHtml(pd, BSLOTS);
      h += tt('ui/menu.63', { v1: pd.stones || 0 });
      for (const sl of BSLOTS) {
        const ids = Object.keys(pd.inv).filter(id => ITEMS[id] && ITEMS[id].slot === sl).sort((a, b) => ITEMS[a].rar - ITEMS[b].rar);
        h += tt('ui/menu.140', { v1: SLOTNAME[sl], length: ids.length, v2: sl === 'btoy' ? tt('ui/menu.70') : '' });
        if (!ids.length) h += tt('ui/menu.71');
        for (const id of ids) { const it = ITEMS[id], eq = pd.beq[sl] === id, ten = (pd.enh || {})[id] || 0; h += tt('ui/menu.150', { v1: itemURL(id), rar: it.rar, name: it.name, v2: ilvTag(id), v3: ten ? ' +' + ten : '', v4: RARITY[it.rar], v5: Math.round(it.bdmg * 100), v6: ten ? tt('ui/menu.72', { v1: 3 * ten }) : '', v7: ilvLine(id, eq), v8: refLine(id), desc: it.desc, v9: eq ? tt('ui/menu.65') : tt('ui/menu.141', { id, v1: sellPrice(id), v2: canDismantle(id) ? tt('ui/menu.67', { id, v1: stoneYield(id) }) : '' }) }); }
      }
    }
    return h;
  },
  food() {
    const pd = G.pd;
    return `<div class="gbar"><span>HP ${Math.ceil(G.P.hp)}/${G.st.hp} · MP ${Math.floor(G.P.mp)}/${G.st.mp}</span></div>` + FOOD_ORDER.map(id => { const f = FOODS[id], n = pd.foods[id] || 0; return tt('ui/menu.142', { v1: n ? '' : 'dim', v2: iconURL('f_' + id, ICONS[f.icon]), v3: f.rar ? 'r' + f.rar : '', name: f.name, v4: f.rar === 3 ? tt('ui/menu.73') : '', n, desc: f.desc, id, v5: n ? '' : 'disabled' }); }).join('') + tt('ui/menu.74');
  },
  shop() {
    const pd = G.pd;
    let h = tt('ui/menu.75', { v1: pd.gold.toLocaleString() }) + xchCardHtml(pd) + tt('ui/menu.76');
    h += FOOD_ORDER.filter(id => !FOODS[id].noShop).map(id => { const f = FOODS[id]; return tt('ui/menu.143', { v1: iconURL('f_' + id, ICONS[f.icon]), v2: f.rar ? 'r' + f.rar : '', name: f.name, v3: f.rar === 3 ? tt('ui/menu.73') : '', v4: pd.foods[id] || 0, desc: f.desc, id, v5: pd.gold >= f.price ? '' : 'disabled', price: f.price }); }).join('');
    const bitems = Object.keys(ITEMS).filter(id => ITEMS[id].bori && ITEMS[id].price && (ITEMS[id].tier || 0) <= G.zone + 1 && !ownsDef(pd, id)).sort((a, b) => ITEMS[a].price - ITEMS[b].price);
    h += tt('ui/menu.144', { v1: pd.boriJoined ? tt('ui/menu.77') : tt('ui/menu.78') });
    h += bitems.length ? bitems.map(id => { const it = ITEMS[id]; return tt('ui/menu.79', { v1: pd.boriJoined ? '' : 'dim', v2: itemURL(id), rar: it.rar, name: it.name, v3: SLOTNAME[it.slot], v4: Math.round(it.bdmg * 100), desc: it.desc, id, v5: pd.boriJoined && pd.gold >= it.price ? '' : 'disabled', v6: it.price.toLocaleString() }); }).join('') : tt('ui/menu.80');
    const items = Object.keys(ITEMS).filter(id => !ITEMS[id].bori && ITEMS[id].price && (ITEMS[id].tier || 0) <= G.zone + 1 && !ownsDef(pd, id)).sort((a, b) => ITEMS[a].price - ITEMS[b].price);
    h += tt('ui/menu.81');
    h += items.length ? items.map(id => { const it = ITEMS[id]; return `<div class="card"><div class="ic"><img src="${itemURL(id)}"></div><div class="mid"><div class="nm"><span class="r${it.rar}">${it.name}</span><span class="tag">${SLOTNAME[it.slot]}</span></div><div class="ds">${statStr(it)}</div></div><button class="btn" data-m="buyItem" data-v="${id}" ${pd.gold >= it.price ? '' : 'disabled'}>${it.price.toLocaleString()}G</button></div>`; }).join('') : tt('ui/menu.82');
    return h;
  },
  info() {
    const s = G.pd.stats;
    return tt('ui/menu.145', { v1: fmtTime(s.time), kills: s.kills, ults: s.ults, eaten: s.eaten, deaths: s.deaths, v2: SND.on ? tt('ui/menu.83') : tt('ui/menu.84'), v3: G.inf ? tt('ui/menu.85') : '' });
  }
};
function boriPreviewURL() {
  const c = mkCanvas(32, 32), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(2, 2); const s = boriSpr('sit'); sprBlit(g, s, 2, 3);
  const toy = G.pd.beq && G.pd.beq.btoy; if (toy && ITEMS[toy]) { const ts = spr('t_' + toy, ICONS[ITEMS[toy].icon]); const bottom = 15 - 4 + Math.ceil(ts.H / 2); g.drawImage(ts.n, Math.round(8 - ts.W / 2), bottom - ts.H); }
  const o = mkCanvas(96, 96), og = o.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(c, 0, 0, 96, 96); return o.toDataURL();
}
export function confirmBox(text, yes) { $('#confirmT').textContent = text; $('#confirm').hidden = false; $('#cfYes').onclick = () => { $('#confirm').hidden = true; yes(); }; $('#cfNo').onclick = () => { $('#confirm').hidden = true; }; }
export function menuClick(e) {
  const t = e.target.closest('[data-m]'); if (!t || t.disabled) return;
  const m = t.dataset.m, v = t.dataset.v, pd = G.pd;
  if (m === 'close') { closeMenu(); return; }
  if (m === 'tab') { MTAB = v; renderMenu(true); sfx('select'); return; }
  if (m === 'job') { jobAsk(v); return; }
  if (m === 'replay') { replayPlay(v); return; }
  if (m === 'xch') {
    if (v === 'max') { const { n, c } = xchPlan(pd, Infinity); if (n > 0) { confirmBox(tt('ui/menu.86', { n, v1: c.toLocaleString(), v2: pd.gold.toLocaleString(), v3: (pd.gold - c).toLocaleString() }), () => { xchBuy(n); renderMenu(); }); return; } }
    xchBuy(v === 'max' ? Infinity : +v); renderMenu(); return;
  }
  if (m === 'refine') { if (refine(v)) { const r = refOf(pd, v); const best = r.lines.filter(l => !l.lk).sort((a, b) => b.g - a.g)[0]; if (best && best.g >= 2) toast(tt('ui/menu.87', { n: REF_GRADE[best.g].n, v1: refLineTxt(best) }), 'lvl'); } renderMenu(); return; }
  if (m === 'refLock') { const [id, i] = v.split(':'); refLock(id, +i); renderMenu(); return; }
  if (m === 'ttl') { if (v && !(pd.ach || {})[v]) return; pd.title = v || undefined; sfx('ding'); saveGame(); renderMenu(); if (typeof rankSync === 'function') rankSync(true); return; }
  if (m === 'hair') { const hr = HAIRS.find(x => x.k === v); if (!hr || !hairOk(pd, hr)) return; pd.look = Object.assign({}, pd.look, { hair: v }); sfx('ding'); renderMenu(); setHudImages(); saveGame(); return; }
  if (m === 'look') { const [sl, id] = v.split(':'); pd.look = Object.assign({}, pd.look); if (id) pd.look[sl] = id; else delete pd.look[sl]; sfx('ding'); renderMenu(); setHudImages(); saveGame(); return; }
  if (m === 'learn') { const s = SKILLS[v], lv = sk(v); if (pd.sp <= 0 || lv >= s.max || pd.lv < s.req) return; pd.sp--; pd.skills[v] = lv + 1; calcStats(); sfx('ding'); if (!lv && s.btn) toast(tt('ui/menu.88', { name: s.name }), 'item r2'); renderMenu(); saveGame(); return; }
  if (m === 'awk') { const A = AWK[v], lv = awkLv(v); if (!A || !(pd.ap > 0) || (A.max && lv >= A.max) || (A.bori && !pd.boriJoined)) return; pd.ap--; pd.awp = pd.awp || {}; pd.awp[v] = lv + 1; calcStats(); sfx('ding'); renderMenu(); saveGame(); return; }
  if (m === 'awkReset') { confirmBox(tt('ui/menu.89'), () => { const n = Object.values(pd.awp || {}).reduce((a, b) => a + b, 0); pd.ap = (pd.ap || 0) + n; pd.awp = {}; calcStats(); renderMenu(); sfx('select'); saveGame(); }); return; }
  if (m === 'reset') { confirmBox(tt('ui/menu.90'), () => { const used = Object.values(pd.skills).reduce((a, b) => a + b, 0); pd.sp += used; pd.skills = {}; if (G.P) G.P.cds = {}; calcStats(); renderMenu(); sfx('select'); saveGame(); }); return; }
  if (m === 'equip') { const it = ITEMS[v]; if (it.bori) { pd.beq[it.slot] = v; if (G.bori) bubble(G.bori, it.slot === 'btoy' ? tt('ui/menu.91') : tt('ui/menu.92'), 1.4); } else pd.eq[it.slot] = v; calcStats(); sfx('ding'); renderMenu(); saveGame(); return; }
  if (m === 'keepDup') { const n = +v; if (n < 0) delete pd.keepDup; else pd.keepDup = n; sfx('select'); renderMenu(); saveGame(); return; }
  if (m === 'sell') { const it = ITEMS[v]; confirmBox(tt('ui/menu.93', { name: it.name, v1: sellPrice(v) }), () => { const g = sellPrice(v); dropItem(pd, v); pd.gold += g; sfx('coin'); renderMenu(); saveGame(); }); return; }
  if (m === 'eat' && !G.P) return;
  if (m === 'eat') { G.P.eatCd = 0; eatFood(v); G.P.eatCd = 0; renderMenu(); return; }
  if (m === 'buy') { const f = FOODS[v]; if (pd.gold < f.price) return; pd.gold -= f.price; pd.foods[v] = (pd.foods[v] || 0) + 1; sfx('coin'); renderMenu(); return; }
  if (m === 'buyItem') { const it = ITEMS[v]; if (pd.gold < it.price || ownsDef(pd, v)) return; const isNewBook = !(pd.book || {})[v]; pd.gold -= it.price; const k = addItem(pd, v); sfx('ding'); if (isNewBook) bookNotify(v); if (it.bori) { pd.beq[it.slot] = k; calcStats(); toast(tt('ui/menu.146', { name: it.name, v1: it.slot === 'btoy' ? tt('ui/menu.94') : tt('ui/menu.95') }), 'item r' + it.rar); if (G.bori) bubble(G.bori, tt('ui/menu.92'), 1.4); } else toast(tt('ui/menu.96', { name: it.name }), 'item r' + it.rar); renderMenu(); saveGame(); return; }
  if (m === 'enhSel') { const [g, s2] = v.split(':'); ENH_SEL[g] = s2; renderMenu(); return; }
  if (m === 'brk') {
    const toy = BSLOTS.includes(v), r = tryBreak(v || 'weapon'); if (!r) return; const nm = ITEMS[r.id].name, P = toy && G.bori ? G.bori : G.P;
    if (r.res === 'up') { sfx('lvl'); G.shake = 6; enhFx('brk', tt('ui/menu.97', { to: r.to }), nm); toast(tt('ui/menu.98', { nm, to: r.to }), 'lvl'); if (P) { G.fx.push({ k: 'lvl', x: P.x, y: P.y, t: 0, dur: 1.2 }); bubble(P, toy ? tt('ui/menu.99') : choice([tt('ui/menu.100'), tt('ui/menu.101')]), 1.5); } }
    else { sfx('warn'); toast(tt('ui/menu.102', { to: r.to }), 'sub'); if (P) bubble(P, toy ? tt('ui/menu.103') : choice([tt('ui/menu.104'), tt('ui/menu.105')]), 1.2); }
    renderMenu(); return;
  }
  if (m === 'enhance' || m === 'enhanceS') {
    const toy = BSLOTS.includes(v), r = tryEnhance(m === 'enhanceS', v || 'weapon'); if (!r) return; const nm = ITEMS[r.id].name, P = toy && G.bori ? G.bori : G.P;
    if (r.res === 'up') { sfx('lvl'); if (r.to >= 20) enhFx(r.to >= 25 ? 'e25' : 'e20', tt('ui/menu.106', { to: r.to }), nm); toast(tt('ui/menu.107', { nm, to: r.to }), 'lvl'); if (P) { G.fx.push({ k: 'lvl', x: P.x, y: P.y, t: 0, dur: 1.0 }); bubble(P, toy ? choice([tt('ui/menu.92'), tt('ui/menu.91'), tt('ui/menu.108')]) : choice([tt('ui/menu.109'), tt('ui/menu.110'), tt('ui/menu.111')]), 1.3); } }
    else if (r.res === 'keep') { sfx('warn'); toast(tt('ui/menu.112', { to: r.to }), 'sub'); if (P) bubble(P, toy ? tt('ui/menu.103') : choice([tt('ui/menu.113'), tt('ui/menu.114')]), 1.2); }
    else if (r.res === 'down') { sfx('hurt'); toast(tt('ui/menu.115', { from: r.from, to: r.to }), 'warn'); if (P) bubble(P, toy ? tt('ui/menu.116') : tt('ui/menu.117'), 1.2); }
    else if (r.res === 'saved') { sfx('hurt'); toast(tt('ui/menu.118', { from: r.from, to: r.to }), 'item r2'); if (P) bubble(P, toy ? tt('ui/menu.119') : tt('ui/menu.120'), 1.3); }
    else { sfx('slam'); G.shake = 8; toast(tt('ui/menu.121', { nm, from: r.from, to: r.to }), 'warn'); if (P) bubble(P, toy ? tt('ui/menu.122') : tt('ui/menu.123'), 1.6); }
    renderMenu(); return;
  }
  if (m === 'dis') { const it = ITEMS[v]; if (!canDismantle(v)) return; confirmBox(tt('ui/menu.124', { name: it.name, v1: stoneYield(v) }), () => { const r = dismantle([v]); sfx('coin'); toast(tt('ui/menu.125', { s: r.s }), 'sub'); renderMenu(); saveGame(); }); return; }
  if (m === 'bulk') { const mx = +v, ids = Object.keys(pd.inv).filter(id => canDismantle(id) && ITEMS[id].rar <= mx), s = ids.reduce((a, id) => a + stoneYield(id), 0);
    if (!ids.length) { toast(tt('ui/menu.147', { v1: [tt('ui/menu.126'), tt('ui/menu.127'), tt('ui/menu.128')][mx] }), 'sub'); return; }
    confirmBox(tt('ui/menu.148', { v1: [tt('ui/menu.126'), tt('ui/menu.127'), tt('ui/menu.128')][mx], length: ids.length, s }), () => { const r = dismantle(ids); sfx('coin'); toast(tt('ui/menu.129', { n: r.n, s: r.s }), 'lvl'); renderMenu(); saveGame(); }); return; }
  if (m === 'sound') { setSound(!SND.on); renderMenu(); updateSndBtn(); return; }
  if (m === 'infLeave') { infLeave(); return; }
  if (m === 'title') { saveGame(); $('#menu').hidden = true; showTitle(); return; }
  if (m === 'restart') { confirmBox(tt('ui/menu.130'), () => { $('#menu').hidden = true; newGame(); }); return; }
}
export function updateSndBtn() { $('#sndBtn').textContent = SND.on ? '♪' : '×'; }
