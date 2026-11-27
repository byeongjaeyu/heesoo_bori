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

export let MTAB = 'skill';
export function setMTab(t) { MTAB = t; }
const TABS = [['skill', '스킬'], ['equip', '장비'], ['bori', '보리'], ['daily', '미션'], ['book', '도감'], ['achv', '칭호'], ['job', '전직'], ['look', '꾸미기'], ['food', '음식'], ['shop', '배달앱'], ['story', '이야기'], ['info', '정보']];
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
const walletHtml = pd => `<div class="wallet"><span><img src="${iconURL('i_coin', ICONS.coin)}" alt="">보유 골드 <b>${pd.gold.toLocaleString()}G</b></span><span><img src="${iconURL('i_stone', ICONS.stone)}" alt="">강화석 <b>${(pd.stones || 0).toLocaleString()}개</b></span></div>`;
const ilvTag = id => ilvOf(id) ? ` Lv.${ilvOf(id)}` : '';
/** 같은 장비가 또 나오면: 강화석(기본) / 등급 이상 가방에 보관 */
function keepDupHtml(/** @type {SaveData} */ pd) {
  const cur = pd.keepDup == null ? -1 : pd.keepDup, n = Object.keys(pd.inv).length;
  const opt = [[-1, '강화석'], [3, '전설↑ 보관'], [4, '신화↑ 보관'], [5, '초월만 보관']];
  return `<div class="gbar kdup"><span>같은 장비 또 나오면 <small>가방 ${n}/${BAG_MAX}</small></span><span class="disb">${opt.map(([v, t]) => `<button class="btn sm${cur === v ? ' on' : ''}" data-m="keepDup" data-v="${v}">${t}</button>`).join('')}</span></div>`;
}
/** 이 장비에 붙은 추가 옵션 (재련은 장비마다 — 벗거나 넘기면 옵션도 같이 감) */
function refLine(id) { const r = refOf(G.pd, id); if (!r || !r.lines.length) return ''; return `<br><span class="refmini">옵션 ${r.lines.map(l => `<b class="g${l.g}">${refLineTxt(l)}</b>`).join(' · ')}</span>`; }
function ilvLine(id, eq) { const lv = ilvOf(id), x = (G.pd.iexp || {})[id] || 0; if (!lv && !x && !eq) return ''; return `<br><b class="ilv">장비 Lv.${lv}</b> · 재료 ${x}/${ILV_NEED}${lv ? ` · 기본 스탯 +${Math.round(ILV_BONUS * 100 * lv)}%` : ''}${eq ? ' <small>(같은 부위·등급 장비를 주우면 쌓여요)</small>' : ''}`; }
function statStr(it) {
  const a = [];
  if (it.atk) a.push(`공격 +${it.atk}`); if (it.def) a.push(`방어 +${it.def}`); if (it.hp) a.push(`HP +${it.hp}`); if (it.mp) a.push(`MP +${it.mp}`);
  if (it.spd) a.push(`이속 +${Math.round(it.spd * 100)}%`); if (it.crit) a.push(`치명 +${Math.round(it.crit * 100)}%`);
  if (it.w) a.push(`사거리 ${it.w.reach} · 공속 ${it.w.rate}`);
  return a.join(' · ') || '능력치 없음';
}
function awkPanel() {
  const pd = G.pd;
  if (pd.lv < MAX_LV) return `<div class="awk dim"><b>각성</b> <small>Lv${MAX_LV}부터 열려요 · 그 뒤로도 경험치가 쌓여 능력치를 계속 올릴 수 있어요</small></div>`;
  const ap = pd.ap || 0, aw = pd.aw || 0, spent = Object.values(pd.awp || {}).reduce((a, b) => a + b, 0), pct = Math.min(100, Math.round(pd.xp / awkNeed(aw) * 100));
  const rows = Object.keys(AWK).map(k => { const A = AWK[k], lv = awkLv(k), full = A.max && lv >= A.max, lock = A.bori && !pd.boriJoined;
    return `<div class="awkr${lock ? ' dim' : ''}"><img src="${iconURL('sk_' + A.icon, ICONS[A.icon])}"><span><em>${A.name} <b>${A.fmt(A.per * lv)}</b></em><small>${lv}pt · 1pt당 ${A.fmt(A.per)}${A.max ? ` · 최대 ${A.max}pt` : ''}${A.desc ? '<br>' + A.desc : ''}</small></span><button class="btn pk sm" data-m="awk" data-v="${k}" ${ap > 0 && !full && !lock ? '' : 'disabled'}>${full ? 'MAX' : '+1'}</button></div>`; }).join('');
  return `<div class="awk"><div class="awkh"><span><b>각성 ★${aw}</b> <small>다음 각성까지 ${pct}%</small></span><span>각성 포인트 <b class="ok">${ap}</b> <button class="btn wh sm" data-m="awkReset" ${spent ? '' : 'disabled'}>초기화</button></span></div><div class="awkbar"><i style="width:${pct}%"></i></div>${rows}</div>`;
}
export let ENH_SEL = { h: 'weapon', b: 'btoy' };
function enhCard(slots) {
  const pd = G.pd, grp = slots === BSLOTS ? 'b' : 'h', bori = grp === 'b';
  let sl = ENH_SEL[grp]; if (!slots.includes(sl)) sl = slots[0];
  const eqOf = s => bori ? pd.beq[s] : pd.eq[s];
  const chips = `<div class="enhsel">${slots.map(s => { const id = eqOf(s), en = id ? (pd.enh || {})[id] || 0 : 0; return `<button class="${s === sl ? 'on' : ''}" data-m="enhSel" data-v="${grp}:${s}">${SLOTNAME[s]}${en ? ` <b>+${en}</b>` : ''}</button>`; }).join('')}</div>`;
  const id = eqOf(sl), it = ITEMS[id];
  if (!it) return `<div class="card enh col">${chips}<div class="ds">${SLOTNAME[sl]}을(를) ${bori ? '보리에게 ' : ''}착용하면 강화할 수 있어요.</div></div>`;
  const en = (pd.enh || {})[id] || 0, cost = enhCost(en), max = en >= ENH_MAX, sc = enhStoneCost(en), stn = pd.stones || 0, o = max ? null : enhOdds(en, false), pct = x => Math.round(x * 100) + '%';
  const img = id === 'fist' ? iconURL('sk_fist', ICONS.fist) : itemURL(id);
  if (max) return brkCardHtml(pd, sl, id, it, en, img, chips);
  return `<div class="card enh col">${chips}<div class="enhrow"><div class="ic${en >= 20 ? ' glow20' : ''}"><img src="${img}"></div><div class="mid"><div class="nm">${SLOTNAME[sl]} 강화 <span class="r${it.rar}">${it.name}${en ? ' +' + en : ''}</span></div><div class="ds">현재 ${ENH_FX[sl].txt(en)}${max ? '' : `<br><b>+${en} → +${en + 1}</b> 성공 <b class="ok">${pct(o.p)}</b>${o.dn ? ` · 하락 ${pct(o.dn)}` : ''}${o.ds ? ` · <b class="bad">파괴 ${pct(o.ds)}</b> (→+${enhReset(en)})` : ''}`}</div><div class="nx">${max ? `MAX +${ENH_MAX} 강화 완료!` : `비용 ${cost.toLocaleString()}G · 보유 ${pd.gold.toLocaleString()}G · 강화석 ${stn}개`}</div></div>${max ? '<button class="btn pk" disabled>MAX</button>' : `<div class="enhbtns"><button class="btn pk" data-m="enhance" data-v="${sl}" ${pd.gold >= cost ? '' : 'disabled'}>강화</button><button class="btn stone" data-m="enhanceS" data-v="${sl}" ${pd.gold >= cost && stn >= sc ? '' : 'disabled'}>강화석 ${sc}개<small>+10%·파괴방지</small></button></div>`}</div></div>`;
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
  return `<div class="card enh col brk">${chips}<div class="enhrow"><div class="ic ${en > 25 ? 'glowB' : 'glow25'}"><img src="${img}"></div><div class="mid"><div class="nm">${SLOTNAME[sl]} 한계 돌파 <span class="r${it.rar}">${it.name} +${en}</span></div>`
    + `<div class="ds">현재 ${ENH_FX[sl].txt(en)}${bonus ? ` · <b class="ok">기본 능력치 +${bonus}%</b>` : ''}${done ? '' : `<br><b>+${en} → +${en + 1}</b> 성공 <b class="ok">${Math.round(c.p * 100)}%</b> · 실패해도 하락·파괴 없음 · 기본 능력치 +${Math.round(BRK_STEP * 100)}%`}</div>`
    + `<div class="nx">${done ? `한계 돌파 완료! +${BRK_MAX}` : `비용 강화석 <b>${c.stones.toLocaleString()}개</b> · ${c.gold.toLocaleString()}G · 보유 강화석 ${stn.toLocaleString()}개`}</div></div>`
    + (done ? '<button class="btn pk" disabled>MAX</button>' : `<button class="btn brkbtn" data-m="brk" data-v="${sl}" ${can ? '' : 'disabled'}>돌파<small>강화석 ${c.stones.toLocaleString()}</small></button>`) + '</div></div>';
}
function skillCard(id) {
  const s = SKILLS[id], lv = sk(id), pd = G.pd; const locked = s.who === 'b' && !pd.boriJoined; const reqOk = pd.lv >= s.req;
  const can = pd.sp > 0 && lv < s.max && reqOk && !locked;
  const dots = Array.from({ length: s.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
  const cur = lv ? s.desc(lv) : (id === 'bite' ? s.desc(0) : '아직 배우지 않았어요');
  const meta = s.mp ? ` <small>· MP ${s.mp} · 쿨 ${s.cd(Math.max(1, lv))}초</small>` : '';
  const nx = locked ? 'Lv3에 보리를 찾으면 열려요' : (!reqOk ? `Lv.${s.req}부터 배울 수 있어요` : (lv < s.max ? `다음 레벨: ${s.desc(lv + 1)}` : 'MAX 레벨!'));
  return `<div class="card ${(!reqOk || locked) ? 'dim' : ''}"><div class="ic"><img src="${iconURL('sk_' + s.icon, ICONS[s.icon])}"></div><div class="mid"><div class="nm">${s.name}<span class="tag ${s.type}">${SKILL_TYPE[s.type]}</span><span class="lvdots">${dots}</span></div><div class="ds">${lv ? '<b>현재</b> ' : ''}${cur}${meta}</div><div class="nx">${nx}</div></div><button class="btn plus" data-m="learn" data-v="${id}" ${can ? '' : 'disabled'}>+</button></div>`;
}
/** 착용 세트 카드 (조각을 하나라도 가지면 보임) */
function eqSetHtml(pd) {
  return EQ_SETS.filter(S => S.ids.some(id => ownsDef(pd, id))).map(S => { const n = eqSetN(pd, S), all = n >= S.ids.length, on = new Set([...SLOTS.map(sl => defOf(pd.eq[sl])), ...BSLOTS.map(sl => pd.beq && pd.beq[sl] ? defOf(pd.beq[sl]) : '')]);
    return `<div class="eqset${all ? ' on' : ''}"><div class="eqsh"><b>${S.name}</b><span>${n}/${S.ids.length} 착용</span></div><div class="eqsi">${S.ids.map(id => `<img class="${on.has(id) ? 'w' : ownsDef(pd, id) ? 'h' : 'x'}" src="${itemURL(id)}" title="${ITEMS[id].name}">`).join('')}</div><small>${all ? '세트 효과 켜짐 · ' + S.txt : `${S.ids.length}개를 모두 끼면 ${S.txt}`}</small></div>`; }).join('');
}
const MREN = {
  story() { return replayHtml(G.pd); },
  look() {
    const pd = G.pd, L = pd.look || {}, b = pd.book || {};
    const prev = fighterURL({ vis: visEq(pd), hair: L.hair || 'base', bori: pd.boriJoined, beq: pd.beq }, 6);
    let h = `<div class="lookhead"><img src="${prev}"><div><b>희수 꾸미기</b><small>능력치는 그대로, 겉모습만 바뀌어요.<br>랭킹·PvP에서도 이 모습으로 보여요.</small></div></div>`;
    h += `<h3>헤어 색</h3><div class="hairs">` + HAIRS.filter(hr => !hr.excl || hairOk(pd, hr)).map(hr => { const ok = hairOk(pd, hr), on = (L.hair || 'base') === hr.k;
      return `<button class="hair${on ? ' on' : ''}${ok ? '' : ' lock'}" data-m="hair" data-v="${hr.k}" ${ok ? '' : 'disabled'}><i style="background:linear-gradient(135deg,${hr.h},${hr.H})"></i><small>${ok ? hr.name : '🔒 ' + hr.cond}</small></button>`; }).join('') + '</div>';
    for (const sl of LOOK_SLOTS) {
      const own = Object.keys(b).filter(id => ITEMS[id] && ITEMS[id].slot === sl && !ITEMS[id].bori && ITEMS[id].color).sort((x, y) => ITEMS[x].rar - ITEMS[y].rar || (ITEMS[x].tier || 0) - (ITEMS[y].tier || 0));
      h += `<h3>${SLOTNAME[sl]} 겉모습 <small>도감에 있는 장비 ${own.length}종</small></h3><div class="looks">`
        + `<button class="lk${!L[sl] ? ' on' : ''}" data-m="look" data-v="${sl}:"><span class="lkdef">착용<br>장비대로</span></button>`
        + own.map(id => `<button class="lk${L[sl] === id ? ' on' : ''}" data-m="look" data-v="${sl}:${id}" title="${ITEMS[id].name}"><img src="${itemURL(id)}"><small class="r${ITEMS[id].rar}">${ITEMS[id].name}</small></button>`).join('') + '</div>';
    }
    return h;
  },
  book() {
    const pd = G.pd, bk = bookStats(pd), b = pd.book || {};
    let h = `<div class="bookhead"><b>장비 도감</b><span>${bk.n} / ${BOOK_ALL.length}</span></div><div class="gbar"><span>1칸마다 최대 HP +${BOOK_PER_HP}</span><span>지금 +${BOOK_PER_HP * bk.n}</span></div>`;
    for (const s of BOOK_SETS) {
      const ids = bookIds(s).sort((x, y) => (ITEMS[x].tier || 0) - (ITEMS[y].tier || 0) || ITEMS[x].slot.localeCompare(ITEMS[y].slot)), got = ids.filter(id => b[id]).length, done = bk.done[s.k];
      h += `<div class="bookset${done ? ' done' : ''}"><div class="bsh"><b class="${s.bori ? '' : 'r' + s.rar}">${s.name}</b><span>${got}/${ids.length}</span><em>${done ? '✔ ' : ''}완성 보너스: ${s.txt}</em></div><div class="bgrid">`
        + ids.map(id => { const it = ITEMS[id], has = !!b[id]; return `<div class="bcell${has ? '' : ' no'}" title="${has ? it.name : '???'}"><img src="${itemURL(id)}"><small>${has ? it.name : '???'}</small></div>`; }).join('') + '</div></div>';
    }
    return h;
  },
  daily() { dailyScrollToday(); return dailyHtml(G.pd); },
  achv() { return achvHtml(G.pd); },
  job() { return jobHtml(G.pd); },
  skill() {
    const pd = G.pd; const used = Object.values(pd.skills).reduce((a, b) => a + b, 0);
    return awkPanel() + `<div class="sprow"><span>스킬 포인트 <b>${pd.sp}</b></span><button class="btn wh" data-m="reset" ${used ? '' : 'disabled'}>초기화 (무료)</button></div>
      <h3>희수 <small>레벨업마다 포인트 +1</small></h3>${Object.keys(SKILLS).filter(k => SKILLS[k].who === 'h').map(skillCard).join('')}
      <h3>보리 ${pd.boriJoined ? '<small>보리 스킬은 자동으로 발동해요</small>' : '<small>(Lv3에 보리를 찾으면 열려요)</small>'}</h3>${Object.keys(SKILLS).filter(k => SKILLS[k].who === 'b').map(skillCard).join('')}`;
  },
  equip() {
    const pd = G.pd, st = G.st;
    let h = `<div class="stats"><div>공격력<b>${st.atk}</b></div><div>방어력<b>${st.def}</b></div><div>치명타<b>${Math.round(st.crit * 100)}%</b></div><div>최대 HP<b>${st.hp}</b></div><div>최대 MP<b>${st.mp}</b></div><div>이동속도<b>${Math.round(st.spd * 100)}%</b></div></div>`;
    h += enhCard(SLOTS); h += refCardHtml(pd, SLOTS);
    h += `<div class="slots">${SLOTS.map(sl => { const it = ITEMS[pd.eq[sl]]; return `<div class="slot"><img src="${itemURL(pd.eq[sl])}">${SLOTNAME[sl]}<br><b class="r${it.rar}">${it.name}${ilvTag(pd.eq[sl])}${(pd.enh || {})[pd.eq[sl]] ? ' +' + pd.enh[pd.eq[sl]] : ''}</b></div>`; }).join('')}</div>`;
    h += eqSetHtml(pd);
    h += `<div class="gbar" style="margin-top:8px"><span>보리 옷·장난감은 '보리' 탭에 있어요</span><button class="btn" data-m="tab" data-v="bori" style="padding:3px 9px;font-size:12px">보리 탭</button></div>`;
    h += `<h3 style="margin-top:16px">희수 장비 목록</h3>` + `<div class="gbar dis"><span>강화석 <b>${pd.stones || 0}</b>개</span><span class="disb">일괄 분해 <button class="btn sm" data-m="bulk" data-v="0">일반</button><button class="btn sm" data-m="bulk" data-v="1">희귀↓</button><button class="btn sm" data-m="bulk" data-v="2">영웅↓</button></span></div>`;
    h += keepDupHtml(pd);
    for (const sl of SLOTS) {
      const ids = Object.keys(pd.inv).filter(id => ITEMS[id] && ITEMS[id].slot === sl).sort((a, b) => (ITEMS[a].rar - ITEMS[b].rar) || ((ITEMS[a].tier || 0) - (ITEMS[b].tier || 0)));
      h += `<h3>${SLOTNAME[sl]} <small>${ids.length}개 보유</small></h3>`;
      for (const id of ids) {
        const it = ITEMS[id], eq = pd.eq[sl] === id;
        h += `<div class="card"><div class="ic"><img src="${itemURL(id)}"></div><div class="mid"><div class="nm"><span class="r${it.rar}">${it.name}${ilvTag(id)}${(pd.enh || {})[id] ? ' +' + pd.enh[id] : ''}</span><span class="tag">${RARITY[it.rar]}</span></div><div class="ds">${statStr(it)}${ilvLine(id, eq)}${refLine(id)}${it.desc ? `<br><small>${it.desc}</small>` : ''}</div></div>${eq ? '<span class="badge-eq">장착중</span>' : `<div style="display:flex;flex-direction:column;gap:4px"><button class="btn gr" data-m="equip" data-v="${id}">장착</button>${it.start ? '' : `<button class="btn wh" data-m="sell" data-v="${id}">판매 ${sellPrice(id)}G</button>`}${canDismantle(id) ? `<button class="btn sm stone" data-m="dis" data-v="${id}">분해 +${stoneYield(id)}</button>` : ''}</div>`}</div>`;
      }
    }
    return h;
  },
  bori() {
    const pd = G.pd, st = G.st; let h = '';
    if (!pd.boriJoined) h += `<p class="ds" style="margin:4px">Lv3에 보리를 찾으면 입히고 물려줄 수 있어요.</p>`;
    else {
      h += eqSetHtml(pd);
      h += `<div class="bprev"><img src="${boriPreviewURL()}"><div><b>보리</b><br>귀여워서 무적이라<br>장비는 전부 공격 보너스!</div></div><div class="gbar"><span>보리 공격 보너스</span><span>+${Math.round((st.boriMul - 1) * 100)}%</span></div><div class="slots" style="grid-template-columns:repeat(2,1fr)">${BSLOTS.map(sl => { const id = pd.beq[sl], it = ITEMS[id]; return `<div class="slot">${it ? `<img src="${itemURL(id)}">` : '<div style="height:34px;line-height:34px;color:#aaa">없음</div>'}${SLOTNAME[sl]}<br><b class="r${it ? it.rar : 0}">${it ? it.name + ilvTag(id) : '-'}${it && (pd.enh || {})[id] ? ' +' + pd.enh[id] : ''}</b></div>`; }).join('')}</div>`;
      h += enhCard(BSLOTS) + refCardHtml(pd, BSLOTS);
      h += `<div class="gbar dis"><span>강화석 <b>${pd.stones || 0}</b>개</span><span class="disb">일괄 분해 <button class="btn sm" data-m="bulk" data-v="0">일반</button><button class="btn sm" data-m="bulk" data-v="1">희귀↓</button><button class="btn sm" data-m="bulk" data-v="2">영웅↓</button></span></div>`;
      for (const sl of BSLOTS) {
        const ids = Object.keys(pd.inv).filter(id => ITEMS[id] && ITEMS[id].slot === sl).sort((a, b) => ITEMS[a].rar - ITEMS[b].rar);
        h += `<h3>${SLOTNAME[sl]} <small>${ids.length}개 보유${sl === 'btoy' ? ' · 항상 입에 물고 다녀요' : ''}</small></h3>`;
        if (!ids.length) h += `<p class="ds" style="margin:4px;font-size:11px;color:#8a6a7a">보스를 잡거나 배달앱에서 구할 수 있어요.</p>`;
        for (const id of ids) { const it = ITEMS[id], eq = pd.beq[sl] === id, ten = (pd.enh || {})[id] || 0; h += `<div class="card"><div class="ic"><img src="${itemURL(id)}"></div><div class="mid"><div class="nm"><span class="r${it.rar}">${it.name}${ilvTag(id)}${ten ? ' +' + ten : ''}</span><span class="tag">${RARITY[it.rar]}</span></div><div class="ds">보리 공격 +${Math.round(it.bdmg * 100)}%${ten ? ` (강화 +${3 * ten}%)` : ''}${ilvLine(id, eq)}${refLine(id)}<br><small>${it.desc}</small></div></div>${eq ? '<span class="badge-eq">장착중</span>' : `<div style="display:flex;flex-direction:column;gap:4px"><button class="btn gr" data-m="equip" data-v="${id}">장착</button><button class="btn wh" data-m="sell" data-v="${id}">판매 ${sellPrice(id)}G</button>${canDismantle(id) ? `<button class="btn sm stone" data-m="dis" data-v="${id}">분해 +${stoneYield(id)}</button>` : ''}</div>`}</div>`; }
      }
    }
    return h;
  },
  food() {
    const pd = G.pd;
    return `<div class="gbar"><span>HP ${Math.ceil(G.P.hp)}/${G.st.hp} · MP ${Math.floor(G.P.mp)}/${G.st.mp}</span></div>` + FOOD_ORDER.map(id => { const f = FOODS[id], n = pd.foods[id] || 0; return `<div class="card ${n ? '' : 'dim'}"><div class="ic"><img src="${iconURL('f_' + id, ICONS[f.icon])}"></div><div class="mid"><div class="nm"><span class="${f.rar ? 'r' + f.rar : ''}">${f.name}</span>${f.rar === 3 ? '<span class="tag ult">최고급</span>' : ''}<span class="tag">x${n}</span></div><div class="ds">${f.desc}</div></div><button class="btn pk" data-m="eat" data-v="${id}" ${n ? '' : 'disabled'}>먹기</button></div>`; }).join('') + `<p class="ds" style="font-size:11px;color:#8a6a7a;margin:6px 2px">먹방 체질 스킬을 찍으면 회복량이 늘어나요. HP/MP 버튼은 지금 상황에 딱 맞는 음식을 골라 먹어요.</p>`;
  },
  shop() {
    const pd = G.pd;
    let h = `<div class="shophead"><b>희수의 배달앱</b><div>폰으로 주문하면 보리가 받아와요. 배달비 무료!</div></div><div class="gbar"><span>보유 골드</span><span>${pd.gold.toLocaleString()}G</span></div>` + xchCardHtml(pd) + `<h3>음식</h3>`;
    h += FOOD_ORDER.filter(id => !FOODS[id].noShop).map(id => { const f = FOODS[id]; return `<div class="card"><div class="ic"><img src="${iconURL('f_' + id, ICONS[f.icon])}"></div><div class="mid"><div class="nm"><span class="${f.rar ? 'r' + f.rar : ''}">${f.name}</span>${f.rar === 3 ? '<span class="tag ult">최고급</span>' : ''}<span class="tag">보유 ${pd.foods[id] || 0}</span></div><div class="ds">${f.desc}</div></div><button class="btn" data-m="buy" data-v="${id}" ${pd.gold >= f.price ? '' : 'disabled'}>${f.price}G</button></div>`; }).join('');
    const bitems = Object.keys(ITEMS).filter(id => ITEMS[id].bori && ITEMS[id].price && (ITEMS[id].tier || 0) <= G.zone + 1 && !ownsDef(pd, id)).sort((a, b) => ITEMS[a].price - ITEMS[b].price);
    h += `<h3>보리 용품 <small>${pd.boriJoined ? '보리 공격력이 올라가요' : '보리를 찾으면 살 수 있어요'}</small></h3>`;
    h += bitems.length ? bitems.map(id => { const it = ITEMS[id]; return `<div class="card ${pd.boriJoined ? '' : 'dim'}"><div class="ic"><img src="${itemURL(id)}"></div><div class="mid"><div class="nm"><span class="r${it.rar}">${it.name}</span><span class="tag">${SLOTNAME[it.slot]}</span></div><div class="ds">보리 공격 +${Math.round(it.bdmg * 100)}% · ${it.desc}</div></div><button class="btn" data-m="buyItem" data-v="${id}" ${pd.boriJoined && pd.gold >= it.price ? '' : 'disabled'}>${it.price.toLocaleString()}G</button></div>`; }).join('') : '<p class="ds" style="margin:4px">지금 살 수 있는 보리 용품을 다 샀어요!</p>';
    const items = Object.keys(ITEMS).filter(id => !ITEMS[id].bori && ITEMS[id].price && (ITEMS[id].tier || 0) <= G.zone + 1 && !ownsDef(pd, id)).sort((a, b) => ITEMS[a].price - ITEMS[b].price);
    h += `<h3>장비 <small>새 구역에 가면 더 좋은 장비가 들어와요</small></h3>`;
    h += items.length ? items.map(id => { const it = ITEMS[id]; return `<div class="card"><div class="ic"><img src="${itemURL(id)}"></div><div class="mid"><div class="nm"><span class="r${it.rar}">${it.name}</span><span class="tag">${SLOTNAME[it.slot]}</span></div><div class="ds">${statStr(it)}</div></div><button class="btn" data-m="buyItem" data-v="${id}" ${pd.gold >= it.price ? '' : 'disabled'}>${it.price.toLocaleString()}G</button></div>`; }).join('') : '<p class="ds" style="margin:4px">지금 살 수 있는 장비를 다 샀어요!</p>';
    return h;
  },
  info() {
    const s = G.pd.stats;
    return `<div class="info"><h3>조작법</h3>
      <p><b>폰</b> 왼쪽 화면을 드래그해서 이동, 오른쪽 주먹 버튼으로 공격(꾹 누르면 연속 공격). 스킬은 주먹 버튼 주변 동그라미.</p>
      <p><b>키보드</b> <span class="kb">WASD/방향키</span> 이동 <span class="kb">J/Space</span> 공격 <span class="kb">K</span><span class="kb">L</span><span class="kb">;</span> 스킬 <span class="kb">U</span> 멘헤라 <span class="kb">Q</span>/<span class="kb">E</span> HP/MP 음식 <span class="kb">I</span> 메뉴</p>
      <h3>꿀팁</h3>
      <p>· 희수는 가만히 있으면 바로 폰을 꺼내요. 폰 보는 동안 HP·MP가 훨씬 빨리 차요.</p>
      <p>· 구역마다 몬스터를 정해진 수만큼 잡으면 보스가 나와요. 보스를 쓰러뜨리면 위쪽 출구가 열려요.</p>
      <p>· Lv8에 궁극기 <b>멘헤라 공격</b>을 배울 수 있어요. 맵 전체의 몬스터에게 정신 피해!</p>
      <p>· 스킬 초기화는 무료라서 마음껏 바꿔봐도 돼요.</p>
      <p>· 골드가 남으면 장비 탭에서 무기를 강화하세요 (+10까지, 실패 없음). 공격력·치명타가 올라요.</p>
      <h3>기록</h3>
      <p>플레이 시간 ${fmtTime(s.time)} · 처치 ${s.kills}마리 · 멘헤라 ${s.ults}회 · 먹은 음식 ${s.eaten}개 · 기절 ${s.deaths}회</p>
      <div class="row"><button class="btn wh" data-m="sound">소리 ${SND.on ? '끄기' : '켜기'}</button>${G.inf ? '<button class="btn pk" data-m="infLeave">할로윈파티 나가기</button>' : ''}<button class="btn wh" data-m="title">타이틀로</button><button class="btn wh" data-m="restart">처음부터 다시</button></div></div>`;
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
    if (v === 'max') { const { n, c } = xchPlan(pd, Infinity); if (n > 0) { confirmBox(`강화석 ${n}개를 ${c.toLocaleString()}G에 바꿀까요?\n(지금 ${pd.gold.toLocaleString()}G → ${(pd.gold - c).toLocaleString()}G)`, () => { xchBuy(n); renderMenu(); }); return; } }
    xchBuy(v === 'max' ? Infinity : +v); renderMenu(); return;
  }
  if (m === 'refine') { if (refine(v)) { const r = refOf(pd, v); const best = r.lines.filter(l => !l.lk).sort((a, b) => b.g - a.g)[0]; if (best && best.g >= 2) toast(`✨ ${REF_GRADE[best.g].n} 옵션! ${refLineTxt(best)}`, 'lvl'); } renderMenu(); return; }
  if (m === 'refLock') { const [id, i] = v.split(':'); refLock(id, +i); renderMenu(); return; }
  if (m === 'ttl') { if (v && !(pd.ach || {})[v]) return; pd.title = v || undefined; sfx('ding'); saveGame(); renderMenu(); if (typeof rankSync === 'function') rankSync(true); return; }
  if (m === 'hair') { const hr = HAIRS.find(x => x.k === v); if (!hr || !hairOk(pd, hr)) return; pd.look = Object.assign({}, pd.look, { hair: v }); sfx('ding'); renderMenu(); setHudImages(); saveGame(); return; }
  if (m === 'look') { const [sl, id] = v.split(':'); pd.look = Object.assign({}, pd.look); if (id) pd.look[sl] = id; else delete pd.look[sl]; sfx('ding'); renderMenu(); setHudImages(); saveGame(); return; }
  if (m === 'learn') { const s = SKILLS[v], lv = sk(v); if (pd.sp <= 0 || lv >= s.max || pd.lv < s.req) return; pd.sp--; pd.skills[v] = lv + 1; calcStats(); sfx('ding'); if (!lv && s.btn) toast(`${s.name} 버튼이 활성화됐어요!`, 'item r2'); renderMenu(); saveGame(); return; }
  if (m === 'awk') { const A = AWK[v], lv = awkLv(v); if (!A || !(pd.ap > 0) || (A.max && lv >= A.max) || (A.bori && !pd.boriJoined)) return; pd.ap--; pd.awp = pd.awp || {}; pd.awp[v] = lv + 1; calcStats(); sfx('ding'); renderMenu(); saveGame(); return; }
  if (m === 'awkReset') { confirmBox('각성 포인트를 전부 돌려받고 다시 찍을까요?', () => { const n = Object.values(pd.awp || {}).reduce((a, b) => a + b, 0); pd.ap = (pd.ap || 0) + n; pd.awp = {}; calcStats(); renderMenu(); sfx('select'); saveGame(); }); return; }
  if (m === 'reset') { confirmBox('스킬 포인트를 전부 돌려받고 다시 찍을까요?', () => { const used = Object.values(pd.skills).reduce((a, b) => a + b, 0); pd.sp += used; pd.skills = {}; if (G.P) G.P.cds = {}; calcStats(); renderMenu(); sfx('select'); saveGame(); }); return; }
  if (m === 'equip') { const it = ITEMS[v]; if (it.bori) { pd.beq[it.slot] = v; if (G.bori) bubble(G.bori, it.slot === 'btoy' ? '앙! (꼬옥)' : '멍멍! (신남)', 1.4); } else pd.eq[it.slot] = v; calcStats(); sfx('ding'); renderMenu(); saveGame(); return; }
  if (m === 'keepDup') { const n = +v; if (n < 0) delete pd.keepDup; else pd.keepDup = n; sfx('select'); renderMenu(); saveGame(); return; }
  if (m === 'sell') { const it = ITEMS[v]; confirmBox(`${it.name}을(를) ${sellPrice(v)}G에 팔까요?`, () => { const g = sellPrice(v); dropItem(pd, v); pd.gold += g; sfx('coin'); renderMenu(); saveGame(); }); return; }
  if (m === 'eat' && !G.P) return;
  if (m === 'eat') { G.P.eatCd = 0; eatFood(v); G.P.eatCd = 0; renderMenu(); return; }
  if (m === 'buy') { const f = FOODS[v]; if (pd.gold < f.price) return; pd.gold -= f.price; pd.foods[v] = (pd.foods[v] || 0) + 1; sfx('coin'); renderMenu(); return; }
  if (m === 'buyItem') { const it = ITEMS[v]; if (pd.gold < it.price || ownsDef(pd, v)) return; const isNewBook = !(pd.book || {})[v]; pd.gold -= it.price; const k = addItem(pd, v); sfx('ding'); if (isNewBook) bookNotify(v); if (it.bori) { pd.beq[it.slot] = k; calcStats(); toast(`${it.name} 구매! 보리가 바로 ${it.slot === 'btoy' ? '물었어요' : '입었어요'} (보리 탭)`, 'item r' + it.rar); if (G.bori) bubble(G.bori, '멍멍! (신남)', 1.4); } else toast(`${it.name} 구매! 장비 탭에서 장착하세요`, 'item r' + it.rar); renderMenu(); saveGame(); return; }
  if (m === 'enhSel') { const [g, s2] = v.split(':'); ENH_SEL[g] = s2; renderMenu(); return; }
  if (m === 'brk') {
    const toy = BSLOTS.includes(v), r = tryBreak(v || 'weapon'); if (!r) return; const nm = ITEMS[r.id].name, P = toy && G.bori ? G.bori : G.P;
    if (r.res === 'up') { sfx('lvl'); G.shake = 6; enhFx('brk', `한계 돌파 +${r.to}`, nm); toast(`한계 돌파 성공!! ${nm} +${r.to}`, 'lvl'); if (P) { G.fx.push({ k: 'lvl', x: P.x, y: P.y, t: 0, dur: 1.2 }); bubble(P, toy ? '멍멍멍!!! (흥분)' : choice(['한계를 넘었다!', '이게 진짜 힘...!']), 1.5); } }
    else { sfx('warn'); toast(`돌파 실패... +${r.to} 유지 (하락·파괴 없음)`, 'sub'); if (P) bubble(P, toy ? '끼잉...' : choice(['한 번만 더...', '강화석 아깝다']), 1.2); }
    renderMenu(); return;
  }
  if (m === 'enhance' || m === 'enhanceS') {
    const toy = BSLOTS.includes(v), r = tryEnhance(m === 'enhanceS', v || 'weapon'); if (!r) return; const nm = ITEMS[r.id].name, P = toy && G.bori ? G.bori : G.P;
    if (r.res === 'up') { sfx('lvl'); if (r.to >= 20) enhFx(r.to >= 25 ? 'e25' : 'e20', `+${r.to} 강화 성공!`, nm); toast(`강화 성공! ${nm} +${r.to}`, 'lvl'); if (P) { G.fx.push({ k: 'lvl', x: P.x, y: P.y, t: 0, dur: 1.0 }); bubble(P, toy ? choice(['멍멍! (신남)', '앙! (꼬옥)', '왈왈!!']) : choice(['더 세졌다!', '반짝반짝~', '이걸로 등짝을...']), 1.3); } }
    else if (r.res === 'keep') { sfx('warn'); toast(`강화 실패... +${r.to} 유지`, 'sub'); if (P) bubble(P, toy ? '끼잉...' : choice(['아깝다...', '한 번만 더!']), 1.2); }
    else if (r.res === 'down') { sfx('hurt'); toast(`강화 실패! +${r.from} → +${r.to} 하락`, 'warn'); if (P) bubble(P, toy ? '끼잉... (시무룩)' : '흐엉...', 1.2); }
    else if (r.res === 'saved') { sfx('hurt'); toast(`파괴될 뻔! 강화석이 막아줬어요 (+${r.from} → +${r.to})`, 'item r2'); if (P) bubble(P, toy ? '멍! (휴...)' : '휴... 강화석 최고', 1.3); }
    else { sfx('slam'); G.shake = 8; toast(`파괴!! ${nm} +${r.from} → +${r.to}`, 'warn'); if (P) bubble(P, toy ? '깨갱!!' : '안 돼애애애!!', 1.6); }
    renderMenu(); return;
  }
  if (m === 'dis') { const it = ITEMS[v]; if (!canDismantle(v)) return; confirmBox(`${it.name}을(를) 분해할까요? (강화석 +${stoneYield(v)})`, () => { const r = dismantle([v]); sfx('coin'); toast(`분해 완료! 강화석 +${r.s}`, 'sub'); renderMenu(); saveGame(); }); return; }
  if (m === 'bulk') { const mx = +v, ids = Object.keys(pd.inv).filter(id => canDismantle(id) && ITEMS[id].rar <= mx), s = ids.reduce((a, id) => a + stoneYield(id), 0);
    if (!ids.length) { toast(`분해할 ${['일반', '희귀 이하', '영웅 이하'][mx]} 장비가 없어요 (장착중·강화된 무기는 제외)`, 'sub'); return; }
    confirmBox(`장착 안 한 ${['일반', '희귀 이하', '영웅 이하'][mx]} 장비 ${ids.length}개를 분해할까요?\n(희수·보리 장비 모두 · 강화된 무기 제외)\n강화석 +${s}`, () => { const r = dismantle(ids); sfx('coin'); toast(`${r.n}개 분해! 강화석 +${r.s}`, 'lvl'); renderMenu(); saveGame(); }); return; }
  if (m === 'sound') { setSound(!SND.on); renderMenu(); updateSndBtn(); return; }
  if (m === 'infLeave') { infLeave(); return; }
  if (m === 'title') { saveGame(); $('#menu').hidden = true; showTitle(); return; }
  if (m === 'restart') { confirmBox('정말 처음부터 다시 할까요? 지금 진행이 사라져요.', () => { $('#menu').hidden = true; newGame(); }); return; }
}
export function updateSndBtn() { $('#sndBtn').textContent = SND.on ? '♪' : '×'; }
