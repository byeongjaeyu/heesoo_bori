// ===================== UI =====================
const FINE = window.matchMedia && matchMedia('(pointer: fine)').matches;
function faceURL(who) {
  if (who === 'hee' || who === 'heePh') { const pal = heePal(); return iconURL('face_' + who + Object.values(pal).join(''), [...(who === 'hee' ? HS.headF : HS.headPh), ...(who === 'hee' ? HS.bodyF : HS.bodyPh).slice(0, 4)], pal); }
  if (who === 'bori') return iconURL('face_bori', BORI.sit);
  if (who === 'hus') return iconURL('face_hus', [...HUS.head, ...HUS.body.slice(0, 4)]);
  if (who === 'mon') return iconURL('face_mon', MONSPR.slime);
  if (who === 'bori2') return iconURL('face_bori2', BORI2.sit, B2PAL);
  if (who === 'somi') return iconURL('face_somi', BORI2.sit, { F: '#ffffff', f: '#d8d8e0', W: '#ffffff', w: '#e8e8f0', Y: '#ffffff', m: '#ffffff' });
  if (who === 'cat') return iconURL('face_cat', SPR2.cat);
  if (who === 'nurse') return iconURL('face_nurse', [...HS.headF, ...HS.bodyF.slice(0, 4)], { C: '#ffffff', c: '#e0e0e8', N: '#ff7ab8', W: '#bfe6ff', w: '#9cc8e8', G: '#bfe6ff', g: '#9cc8e8', H: '#5a3a2a' });
  return '';
}
const SPEAK = { bori2: { name: '보리', face: 'bori2' }, cat: { name: '냥갱', face: 'cat' }, nurse: { name: '간호사 선생님', face: 'nurse' }, somi: { name: '솜이', face: 'somi' }, hee: { name: '희수', face: 'hee' }, heePh: { name: '희수', face: 'heePh' }, bori: { name: '보리', face: 'bori' }, hus: { name: '남편', face: 'hus' }, mon: { name: '몬스터', face: 'mon' }, sys: {} };

// ---------- toast / banner / fade ----------
function toast(msg, cls) {
  const box = $('#toasts'); const el = document.createElement('div'); el.className = 'toast ' + (cls || ''); el.textContent = msg; box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => el.classList.add('out'), 2300); setTimeout(() => el.remove(), 2800);
}
let bannerTO = null;
function banner(sub, main, cls) { const b = $('#banner'); b.hidden = true; void b.offsetWidth; b.className = cls || ''; b.querySelector('small').textContent = sub; b.querySelector('b').textContent = main; b.hidden = false; clearTimeout(bannerTO); bannerTO = setTimeout(() => b.hidden = true, 2700); }
function fadeTo(cb, label) { const f = $('#fade'); f.textContent = label || ''; f.classList.add('on'); setTimeout(() => { try { cb(); } catch (e) { console.error(e); } setTimeout(() => f.classList.remove('on'), 200); }, 500); }

// ---------- dialog ----------
const DLG = { q: [], cur: null, shown: 0, cb: null };
/** 자동사냥 중 대사 자동 넘김 (컷신·필드 대사 공통) */
let DLG_AUTO_T = 0;
function dlgAuto(dt) { if (!G.auto || !DLG.cur || $('#dlg').hidden) { DLG_AUTO_T = 0; return; } if (DLG.shown < DLG.cur.text.length) { DLG_AUTO_T = 0; return; } DLG_AUTO_T += dt; if (DLG_AUTO_T > 2.4) { DLG_AUTO_T = 0; dlgTap(); } }
function dialog(lines, cb) { DLG.q = lines.slice(); DLG.cb = cb; if (G.state === 'play') G.state = 'dialog'; INP.atk = false; nextLine(); }
function nextLine() {
  const l = DLG.q.shift();
  if (!l) { $('#dlg').hidden = true; DLG.cur = null; if (G.state === 'dialog') G.state = 'play'; const cb = DLG.cb; DLG.cb = null; if (cb) cb(); return; }
  DLG.cur = l; DLG.shown = 0; const sp = SPEAK[l.who] || SPEAK.sys; const el = $('#dlg');
  el.hidden = false; el.className = l.who === 'sys' ? 'sys' : '';
  $('#dlgName').textContent = sp.name || ''; if (sp.face) $('#dlgFace').src = faceURL(sp.face);
  $('#dlgText').textContent = ''; if (l.do) l.do(); sfx('select');
}
function dlgTap() { if (!DLG.cur) return; if (DLG.shown < DLG.cur.text.length) { DLG.shown = DLG.cur.text.length; $('#dlgText').textContent = DLG.cur.text; return; } nextLine(); }
function updateDialog(dt) { if (!DLG.cur) return; if (DLG.shown < DLG.cur.text.length) { DLG.shown = Math.min(DLG.cur.text.length, DLG.shown + dt * 36); $('#dlgText').textContent = DLG.cur.text.slice(0, Math.floor(DLG.shown)); } }

// ---------- HUD ----------
const HC = {}; let HE = null;
function hset(k, fn, v) { if (HC[k] === v) return; HC[k] = v; fn(v); }
function showHUD(on) {
  $('#hud').hidden = !on; $('#ctrl').hidden = !on; $('#keyHint').hidden = !on || !FINE;
  if (on) { for (const k in HC) delete HC[k]; setHudImages(); }
}
const SKBTN = [['smash', 'bS1'], ['nag', 'bS2'], ['flash', 'bS3'], ['menhera', 'bULT']];
function setHudImages() {
  $('#pfImg').src = faceURL('hee'); $('#boriImg').src = faceURL('bori'); $('#coinImg').src = iconURL('coin', ICONS.coin);
  const w = G.pd.eq.weapon; $('#atkImg').src = w === 'fist' ? iconURL('sk_fist', ICONS.fist) : itemURL(w);
  for (const [id, b] of SKBTN) $('#' + b + ' img').src = iconURL('sk_' + SKILLS[id].icon, ICONS[SKILLS[id].icon]);
}
function updateHUD() {
  const P = G.P, st = G.st, pd = G.pd; if (!P || !st) return;
  if (!HE) HE = { lv: $('#lv'), hpF: $('#hpF'), hpT: $('#hpT'), mpF: $('#mpF'), mpT: $('#mpT'), xpF: $('#xpF'), gold: $('#goldT'), zone: $('#zoneT'), quest: $('#questT'), bossBar: $('#bossBar'), bossName: $('#bossName'), bossF: $('#bossF'), badge: $('#spBadge'), boriHud: $('#boriHud'), hp: $('#bHP'), mp: $('#bMP') };
  hset('lv', v => { HE.lv.textContent = v; HE.lv.classList.toggle('aw', v.length > 6); }, pd.aw ? 'Lv' + pd.lv + '★' + pd.aw : 'Lv.' + pd.lv);
  hset('hpF', v => HE.hpF.style.width = v + '%', Math.round(P.hp / st.hp * 1000) / 10);
  hset('hpT', v => HE.hpT.textContent = v, Math.ceil(P.hp) + '/' + st.hp);
  hset('mpF', v => HE.mpF.style.width = v + '%', Math.round(P.mp / st.mp * 1000) / 10);
  hset('mpT', v => HE.mpT.textContent = v, Math.floor(P.mp) + '/' + st.mp);
  hset('xpF', v => HE.xpF.style.width = v + '%', Math.round(Math.min(1, pd.xp / (pd.lv >= MAX_LV ? awkNeed(pd.aw || 0) : xpNeed(pd.lv))) * 1000) / 10);
  hset('gold', v => HE.gold.textContent = v, pd.gold.toLocaleString());
  hset('zone', v => HE.zone.textContent = v, G.pvp ? 'PvP 아레나' : G.plaza ? `희수 광장 ${G.plaza.no}` : G.raid ? '월드 보스 레이드' : G.tower ? `보스 타워 ${G.tower.f}층` : G.inf ? `할로윈파티 · WAVE ${G.inf.wave}` : ZONES[G.zone].name + (chCleared(G.pd, G.zone) ? ` · ${chCleared(G.pd, G.zone) + 1}회차` : ''));
  const Z = ZONES[G.zone];
  const zq = zoneQuota(Z); const q = !G.bossSpawned ? `몬스터 처치 ${Math.min(G.zoneKills, zq)}/${zq}` : (G.boss ? '보스를 쓰러뜨려라!' : (!isChLast(G.zone) ? '↑ 출구로 이동!' : '↑ 탈출구로 탈출!'));
  hset('quest', v => HE.quest.textContent = v, G.pvp ? `VS ${G.pvp.opp.nickname} · 남은 시간 ${Math.ceil(G.pvp.t)}초` : G.plaza ? (G.plaza.ok ? `${Object.keys(G.plaza.others).length + 1}명 접속 중 · 자유롭게 돌아다녀요` : '광장 서버에 연결하는 중...') : G.raid ? `남은 시간 ${Math.ceil(G.raid.t)}초 · 내 피해 ${Math.round(G.raid.dmg).toLocaleString()}` : G.tower ? `남은 시간 ${Math.ceil(G.tower.t)}초 · 보스를 쓰러뜨려라!` : G.inf ? (G.boss && !G.boss.dead ? `할로윈 보스 등장! · 처치 ${G.inf.kills}` : `처치 ${G.inf.kills} · 다음 웨이브 ${G.inf.waveKills}/${INF_WAVE_KILLS}`) : q);
  const b = G.boss && !G.boss.dead ? G.boss : null;
  hset('bossOn', v => HE.bossBar.hidden = !v, !!b);
  hset('bossDone', v => HE.bossBar.classList.toggle('done', v), !!(b && b.raidDone));
  if (b) { hset('bossName', v => HE.bossName.textContent = v, b.m.name); hset('bossF', v => HE.bossF.style.width = v + '%', Math.round(Math.max(0, b.hp) / b.maxHp * 1000) / 10); }
  hset('badge', v => { HE.badge.hidden = !v; HE.badge.textContent = v; }, pd.sp > 0 ? String(pd.sp) : (pd.newItem || pd.newBori ? 'N' : ''));
  hset('bori', v => HE.boriHud.hidden = !v, !!pd.boriJoined && !G.pvp);
  const bt = Object.values(P.buffs || {}).map(b => `${b.name} ${Math.ceil(b.t)}초`).join(' · ');
  hset('buff', v => { const el = $('#buffHud'); el.hidden = !v; el.textContent = v; }, bt);
  for (const [id, bid] of SKBTN) {
    const S = SKILLS[id], lv = sk(id), cd = Math.max(0, P.cds[id] || 0), tot = lv ? S.cd(lv) : 1;
    const locked = !lv, nomp = !!lv && P.mp < S.mp, ready = id === 'menhera' && lv && cd <= 0 && !nomp;
    hset(bid + 'c', v => $('#' + bid).className = v, 'sk' + (locked ? ' locked' : '') + (nomp ? ' nomp' : '') + (ready ? ' ready' : ''));
    hset(bid + 'l', v => $('#' + bid + ' .lock').textContent = v, locked ? (pd.lv < S.req ? 'Lv' + S.req : '배우기') : '');
    hset(bid + 'd', v => $('#' + bid + ' .cd').style.setProperty('--cd', v), Math.round(cd / tot * 50) / 50);
    hset(bid + 't', v => $('#' + bid + ' .cdT').textContent = v, cd > 0 ? String(Math.ceil(cd)) : '');
  }
  { const pd2 = G.pd, on = buddyActive(pd2); hset('buddyShow', v => $('#bBuddy').hidden = !v, !G.pvp && !FORCE_EASY); hset('buddyCls', v => $('#bBuddy').className = v, 'food buddyb' + (on ? ' on' : '') + (!on && buddyUsedToday(pd2) ? ' empty' : '')); hset('buddyT', v => $('#bBuddy span').textContent = v, on ? buddyLeftTxt(pd2.buddy.left) : buddyUsedToday(pd2) ? '내일' : '친구'); }
  { const left = autoLeft(); hset('autoShow', v => $('#bAuto').hidden = !v, !G.pvp); hset('autoCls', v => $('#bAuto').className = v, 'food auto' + (G.auto ? ' on' : '') + (left <= 0 ? ' empty' : '')); hset('autoT', v => $('#bAuto span').textContent = v, mmss(left)); }
  hset('qhide', v => { $('#bHP').hidden = v; $('#bMP').hidden = v; }, sk('feed') > 0 && !!pd.boriJoined);
  for (const k of ['hp', 'mp']) {
    const pick = pickQuickFood(k, k === 'hp' ? st.hp - P.hp : st.mp - P.mp);
    const cnt = FOOD_ORDER.filter(id => FOODS[id][k] > 0).reduce((s, id) => s + (pd.foods[id] || 0), 0);
    hset(k + 'i', v => HE[k].querySelector('img').src = v, pick ? iconURL('f_' + pick, ICONS[FOODS[pick].icon]) : iconURL('f_' + (k === 'hp' ? 'persimmon' : 'popcorn') + 'g', ICONS[k === 'hp' ? 'persimmon' : 'popcorn'], { 3: '#888', 2: '#666', 1: '#999', R: '#888', I: '#bbb', A: '#999' }));
    hset(k + 'n', v => HE[k].querySelector('span').textContent = v, String(cnt));
  }
}

// ---------- menu ----------
let MTAB = 'skill';
const TABS = [['skill', '스킬'], ['equip', '장비'], ['bori', '보리'], ['daily', '미션'], ['book', '도감'], ['achv', '칭호'], ['look', '꾸미기'], ['food', '음식'], ['shop', '배달앱'], ['info', '정보']];
function openMenu(tab) { if (G.state !== 'play') return; G.state = 'menu'; INP.atk = false; INP.joy.on = false; hideJoy(); if (tab) MTAB = tab; else if (G.pd.sp > 0) MTAB = 'skill'; else if (G.pd.newItem) MTAB = 'equip'; else if (G.pd.newBori) MTAB = 'bori'; $('#menu').hidden = false; renderMenu(true); sfx('select'); }
/** 로비(타이틀)에서 메뉴 열기 — 음식 탭 빼고 장비·스킬·강화·도감·칭호·꾸미기 등 */
function lobbyMenu(tab) {
  const saved = loadGame(); if (!saved || G.state !== 'title') return;
  G.pd = saved; G.P = null; G.bori = null; calcStats(); G.state = 'lobbyMenu'; $('#title').hidden = true;
  MTAB = tab || (G.pd.sp > 0 ? 'skill' : G.pd.newItem ? 'equip' : G.pd.newBori ? 'bori' : 'equip'); $('#menu').hidden = false; renderMenu(true);
}
function closeMenu() { if (G.state === 'lobbyMenu') { $('#menu').hidden = true; saveGame(); showTitle(); return; }
  $('#menu').hidden = true; if (G.state === 'menu') G.state = 'play'; saveGame(); setHudImages(); }
function renderMenu(top) {
  const pd = G.pd;
  if (G.state === 'lobbyMenu' && MTAB === 'food') MTAB = 'equip';
  $('#tabs').innerHTML = TABS.filter(([k]) => !(G.state === 'lobbyMenu' && k === 'food')).map(([k, n]) => `<button class="tab ${k === MTAB ? 'on' : ''}" data-m="tab" data-v="${k}">${n}${k === 'skill' && pd.sp > 0 ? `<em>${pd.sp}</em>` : ''}${k === 'equip' && pd.newItem ? '<em>N</em>' : ''}${k === 'bori' && pd.newBori ? '<em>N</em>' : ''}${k === 'achv' && pd.achNew ? '<em>N</em>' : ''}${k === 'daily' && dailyClaimable(pd) ? `<em>${dailyClaimable(pd)}</em>` : ''}</button>`).join('');
  const b = $('#mbody'), sc = b.scrollTop; b.innerHTML = (MTAB === 'equip' || MTAB === 'bori' ? walletHtml(pd) : '') + MREN[MTAB](); b.scrollTop = top ? 0 : sc;
  if (MTAB === 'equip' && pd.newItem) { pd.newItem = false; }
  if (MTAB === 'bori' && pd.newBori) { pd.newBori = false; }
}
/** 장비·보리 탭 맨 위: 보유 골드·강화석 */
const walletHtml = pd => `<div class="wallet"><span><img src="${iconURL('i_coin', ICONS.coin)}" alt="">보유 골드 <b>${pd.gold.toLocaleString()}G</b></span><span><img src="${iconURL('i_stone', ICONS.stone)}" alt="">강화석 <b>${(pd.stones || 0).toLocaleString()}개</b></span></div>`;
const ilvTag = id => ilvOf(id) ? ` Lv.${ilvOf(id)}` : '';
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
let ENH_SEL = { h: 'weapon', b: 'btoy' };
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
const MREN = {
  look() {
    const pd = G.pd, L = pd.look || {}, b = pd.book || {};
    const prev = fighterURL({ vis: visEq(pd), hair: L.hair || 'base', bori: pd.boriJoined, beq: pd.beq }, 5);
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
    h += `<div class="gbar" style="margin-top:8px"><span>보리 옷·장난감은 '보리' 탭에 있어요</span><button class="btn" data-m="tab" data-v="bori" style="padding:3px 9px;font-size:12px">보리 탭</button></div>`;
    h += `<h3 style="margin-top:16px">희수 장비 목록</h3>` + `<div class="gbar dis"><span>강화석 <b>${pd.stones || 0}</b>개</span><span class="disb">일괄 분해 <button class="btn sm" data-m="bulk" data-v="0">일반</button><button class="btn sm" data-m="bulk" data-v="1">희귀↓</button><button class="btn sm" data-m="bulk" data-v="2">영웅↓</button></span></div>`;
    for (const sl of SLOTS) {
      const ids = Object.keys(pd.inv).filter(id => ITEMS[id] && ITEMS[id].slot === sl).sort((a, b) => (ITEMS[a].rar - ITEMS[b].rar) || ((ITEMS[a].tier || 0) - (ITEMS[b].tier || 0)));
      h += `<h3>${SLOTNAME[sl]} <small>${ids.length}개 보유</small></h3>`;
      for (const id of ids) {
        const it = ITEMS[id], eq = pd.eq[sl] === id;
        h += `<div class="card"><div class="ic"><img src="${itemURL(id)}"></div><div class="mid"><div class="nm"><span class="r${it.rar}">${it.name}${ilvTag(id)}${(pd.enh || {})[id] ? ' +' + pd.enh[id] : ''}</span><span class="tag">${RARITY[it.rar]}</span></div><div class="ds">${statStr(it)}${ilvLine(id, eq)}${it.desc ? `<br><small>${it.desc}</small>` : ''}</div></div>${eq ? '<span class="badge-eq">장착중</span>' : `<div style="display:flex;flex-direction:column;gap:4px"><button class="btn gr" data-m="equip" data-v="${id}">장착</button>${it.start ? '' : `<button class="btn wh" data-m="sell" data-v="${id}">판매 ${sellPrice(id)}G</button>`}${canDismantle(id) ? `<button class="btn sm stone" data-m="dis" data-v="${id}">분해 +${stoneYield(id)}</button>` : ''}</div>`}</div>`;
      }
    }
    return h;
  },
  bori() {
    const pd = G.pd, st = G.st; let h = '';
    if (!pd.boriJoined) h += `<p class="ds" style="margin:4px">Lv3에 보리를 찾으면 입히고 물려줄 수 있어요.</p>`;
    else {
      h += `<div class="bprev"><img src="${boriPreviewURL()}"><div><b>보리</b><br>귀여워서 무적이라<br>장비는 전부 공격 보너스!</div></div><div class="gbar"><span>보리 공격 보너스</span><span>+${Math.round((st.boriMul - 1) * 100)}%</span></div><div class="slots" style="grid-template-columns:repeat(2,1fr)">${BSLOTS.map(sl => { const id = pd.beq[sl], it = ITEMS[id]; return `<div class="slot">${it ? `<img src="${itemURL(id)}">` : '<div style="height:34px;line-height:34px;color:#aaa">없음</div>'}${SLOTNAME[sl]}<br><b class="r${it ? it.rar : 0}">${it ? it.name + ilvTag(id) : '-'}${it && (pd.enh || {})[id] ? ' +' + pd.enh[id] : ''}</b></div>`; }).join('')}</div>`;
      h += enhCard(BSLOTS) + refCardHtml(pd, BSLOTS);
      h += `<div class="gbar dis"><span>강화석 <b>${pd.stones || 0}</b>개</span><span class="disb">일괄 분해 <button class="btn sm" data-m="bulk" data-v="0">일반</button><button class="btn sm" data-m="bulk" data-v="1">희귀↓</button><button class="btn sm" data-m="bulk" data-v="2">영웅↓</button></span></div>`;
      for (const sl of BSLOTS) {
        const ids = Object.keys(pd.inv).filter(id => ITEMS[id] && ITEMS[id].slot === sl).sort((a, b) => ITEMS[a].rar - ITEMS[b].rar);
        h += `<h3>${SLOTNAME[sl]} <small>${ids.length}개 보유${sl === 'btoy' ? ' · 항상 입에 물고 다녀요' : ''}</small></h3>`;
        if (!ids.length) h += `<p class="ds" style="margin:4px;font-size:11px;color:#8a6a7a">보스를 잡거나 배달앱에서 구할 수 있어요.</p>`;
        for (const id of ids) { const it = ITEMS[id], eq = pd.beq[sl] === id, ten = (pd.enh || {})[id] || 0; h += `<div class="card"><div class="ic"><img src="${itemURL(id)}"></div><div class="mid"><div class="nm"><span class="r${it.rar}">${it.name}${ilvTag(id)}${ten ? ' +' + ten : ''}</span><span class="tag">${RARITY[it.rar]}</span></div><div class="ds">보리 공격 +${Math.round(it.bdmg * 100)}%${ten ? ` (강화 +${3 * ten}%)` : ''}${ilvLine(id, eq)}<br><small>${it.desc}</small></div></div>${eq ? '<span class="badge-eq">장착중</span>' : `<div style="display:flex;flex-direction:column;gap:4px"><button class="btn gr" data-m="equip" data-v="${id}">장착</button><button class="btn wh" data-m="sell" data-v="${id}">판매 ${sellPrice(id)}G</button>${canDismantle(id) ? `<button class="btn sm stone" data-m="dis" data-v="${id}">분해 +${stoneYield(id)}</button>` : ''}</div>`}</div>`; }
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
    const bitems = Object.keys(ITEMS).filter(id => ITEMS[id].bori && ITEMS[id].price && (ITEMS[id].tier || 0) <= G.zone + 1 && !pd.inv[id]).sort((a, b) => ITEMS[a].price - ITEMS[b].price);
    h += `<h3>보리 용품 <small>${pd.boriJoined ? '보리 공격력이 올라가요' : '보리를 찾으면 살 수 있어요'}</small></h3>`;
    h += bitems.length ? bitems.map(id => { const it = ITEMS[id]; return `<div class="card ${pd.boriJoined ? '' : 'dim'}"><div class="ic"><img src="${itemURL(id)}"></div><div class="mid"><div class="nm"><span class="r${it.rar}">${it.name}</span><span class="tag">${SLOTNAME[it.slot]}</span></div><div class="ds">보리 공격 +${Math.round(it.bdmg * 100)}% · ${it.desc}</div></div><button class="btn" data-m="buyItem" data-v="${id}" ${pd.boriJoined && pd.gold >= it.price ? '' : 'disabled'}>${it.price.toLocaleString()}G</button></div>`; }).join('') : '<p class="ds" style="margin:4px">지금 살 수 있는 보리 용품을 다 샀어요!</p>';
    const items = Object.keys(ITEMS).filter(id => !ITEMS[id].bori && ITEMS[id].price && (ITEMS[id].tier || 0) <= G.zone + 1 && !pd.inv[id]).sort((a, b) => ITEMS[a].price - ITEMS[b].price);
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
  const c = mkCanvas(16, 16), g = c.getContext('2d'); const s = boriSpr('sit'); g.drawImage(s.n, 2, 3);
  const toy = G.pd.beq && G.pd.beq.btoy; if (toy && ITEMS[toy]) { const ts = spr('t_' + toy, ICONS[ITEMS[toy].icon]); const bottom = 15 - 4 + Math.ceil(ts.H / 2); g.drawImage(ts.n, Math.round(8 - ts.W / 2), bottom - ts.H); }
  const o = mkCanvas(96, 96), og = o.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(c, 0, 0, 96, 96); return o.toDataURL();
}
function confirmBox(text, yes) { $('#confirmT').textContent = text; $('#confirm').hidden = false; $('#cfYes').onclick = () => { $('#confirm').hidden = true; yes(); }; $('#cfNo').onclick = () => { $('#confirm').hidden = true; }; }
function menuClick(e) {
  const t = e.target.closest('[data-m]'); if (!t || t.disabled) return;
  const m = t.dataset.m, v = t.dataset.v, pd = G.pd;
  if (m === 'close') { closeMenu(); return; }
  if (m === 'tab') { MTAB = v; renderMenu(true); sfx('select'); return; }
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
  if (m === 'sell') { const it = ITEMS[v]; confirmBox(`${it.name}을(를) ${sellPrice(v)}G에 팔까요?`, () => { delete pd.inv[v]; pd.gold += sellPrice(v); sfx('coin'); renderMenu(); saveGame(); }); return; }
  if (m === 'eat' && !G.P) return;
  if (m === 'eat') { G.P.eatCd = 0; eatFood(v); G.P.eatCd = 0; renderMenu(); return; }
  if (m === 'buy') { const f = FOODS[v]; if (pd.gold < f.price) return; pd.gold -= f.price; pd.foods[v] = (pd.foods[v] || 0) + 1; sfx('coin'); renderMenu(); return; }
  if (m === 'buyItem') { const it = ITEMS[v]; if (pd.gold < it.price || pd.inv[v]) return; const isNewBook = !(pd.book || {})[v]; pd.gold -= it.price; pd.inv[v] = 1; sfx('ding'); if (isNewBook) bookNotify(v); if (it.bori) { pd.beq[it.slot] = v; calcStats(); toast(`${it.name} 구매! 보리가 바로 ${it.slot === 'btoy' ? '물었어요' : '입었어요'} (보리 탭)`, 'item r' + it.rar); if (G.bori) bubble(G.bori, '멍멍! (신남)', 1.4); } else toast(`${it.name} 구매! 장비 탭에서 장착하세요`, 'item r' + it.rar); renderMenu(); saveGame(); return; }
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
function updateSndBtn() { $('#sndBtn').textContent = SND.on ? '♪' : '×'; }

// ---------- screens ----------
let TITLE_PD = /** @type {any} */ (null);
/** 로비 양옆 버튼 줄 위치: 왼쪽은 프로필 아래, 오른쪽은 로고 아래 (화면 높이·칭호 유무와 상관없이 안 겹치게) */
function titleLayout() {
  if (FORCE_EASY || $('#title').hidden) return;
  const top0 = $('#title').getBoundingClientRect().top, tb = $('#tbar').getBoundingClientRect().bottom - top0, lg = $('.ttl h1').getBoundingClientRect().bottom - top0;
  $('#tsideL').style.top = Math.round(tb + 8) + 'px'; $('#tsideR').style.top = Math.round(Math.max(tb, lg) + 8) + 'px';
  // 오른쪽 줄이 아래 모드 타일에 닿으면 작게(좁은 화면)
  const R = $('#tsideR'), lim = $('#tbtns').getBoundingClientRect().top - 6; R.classList.remove('tight');
  if (R.getBoundingClientRect().bottom > lim) R.classList.add('tight');
}
addEventListener('resize', () => { try { titleLayout(); } catch (e) { } });
function showTitle() {
  if (typeof rankSync === 'function') { rankSync(); entryRegister(); dailyAutoOpen(); }
  if (G.plaza) plazaLeave(true);
  G.inf = null; G.raid = null; G.tower = null; G.auto = false; G.autoMove = null; G.state = 'title'; showHUD(false); if (typeof e2HideAll === 'function') e2HideAll(); $('#title').hidden = false; $('#endScr').hidden = true; $('#death').hidden = true; $('#dlg').hidden = true; $('#skip').hidden = true; $('#mission').hidden = true;
  const saved = hasSave() ? loadGame() : null;
  let e2s = null; try { e2s = JSON.parse(localStorage.getItem(E2KEY) || 'null'); } catch (e) { }
  const e2n = e2s ? (e2s.stars || []).reduce((a, b) => a + (b || 0), 0) : 0;
  if (FORCE_EASY) {
    $('#tbar').innerHTML = $('#tsideL').innerHTML = $('#tsideR').innerHTML = '';
    $('#tbtns').innerHTML = `<button class="btn e2new" id="tEp2">${e2s ? '이어하기' : '시작하기'}<small>${e2s ? '별 ' + e2n + '/24' : '탭 한 번이면 끝!'}</small></button><div class="tsmall"><button class="btn wh" id="tSnd">소리 ${SND.on ? '켜짐 ♪' : '꺼짐'}</button></div><div class="tsub">♥ 희수 & 보리 ♥</div>`;
    $('#tEp2').onclick = () => { audioInit(); e2Open(); };
    $('#tSnd').onclick = () => { audioInit(); setSound(!SND.on); showTitle(); };
    playBgm('story'); return;
  }
  if (saved) { packSeen(saved); pack2Seen(saved); }
  TITLE_PD = saved; const I = (k, ic) => `<img src="${iconURL('i_' + k, ICONS[ic || k])}" alt="">`;
  // 상단: 내 희수 정보 + 소리
  let prof = '';
  if (saved) { let pw = 0; const keep = G.pd; try { G.pd = saved; pw = pvpSnap().power; } catch (e) { } G.pd = keep; G.st = null;
    const nick = (typeof PV !== 'undefined' && PV.me && PV.me.nickname) || '희수';
    prof = `<div class="tprof"><img src="${pvpFaceURL(visEq(saved), saved.look && saved.look.hair)}" alt=""><span>${saved.title && (saved.ach || {})[saved.title] ? achTag(saved.title) : ''}<b>${esc(nick)}</b><small>Lv.${saved.lv}${saved.aw ? ' ★' + saved.aw : ''}${saved.cleared ? ' · ' + (saved.cleared + 1) + '회차' : ''}</small><small class="tpw">전투력 ${pw.toLocaleString()}</small></span></div>`; }
  $('#tbar').innerHTML = prof + (saved ? packTileHtml(saved) : '') + `<button class="ticon tsnd${SND.on ? '' : ' off'}" id="tSnd" aria-label="소리">${I('sound')}<small>${SND.on ? '소리 ON' : '소리 OFF'}</small></button>`;
  // 왼쪽 세로 아이콘
  const bagDot = saved && (saved.sp > 0 || saved.newItem || saved.newBori || saved.achNew || (saved.ap || 0) > 0);
  $('#tsideL').innerHTML = (saved ? `<button class="ticon tbag" id="tBag">${I('bag')}<small>장비·스킬</small>${bagDot ? '<em class="dot"></em>' : ''}</button>` : '') + (saved ? `<button class="ticon" id="tDaily">${I('cal')}<small>출석·미션</small>${dailyClaimable(saved) ? '<em class="dot"></em>' : ''}</button>` : '')
    + `<button class="ticon" id="tRank">${I('trophy')}<small>랭킹</small></button>`
    + (saved ? `<button class="ticon" id="tShare">${I('camera')}<small>카드 공유</small></button>` : '')
    + `<button class="ticon" id="tCloud">${I('phone')}<small>기기 이동</small></button>`;
  // 오른쪽: 미니게임
  let boriImg = ''; try { const c = mkCanvas(20, 20), g = c.getContext('2d'); g.drawImage(b2Spr('sit').n, 3, 4); const o = mkCanvas(80, 80), og = o.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(c, 0, 0, 80, 80); boriImg = o.toDataURL(); } catch (e) { }
  $('#tsideR').innerHTML = (saved ? idleTileHtml(saved) + msTileHtml(saved) : '') + `<button class="tmini" id="tEp2"><em>MINI GAME</em><img src="${boriImg}" alt=""><b>보리 주세요</b><small>${e2s ? '★ ' + e2n + '/24' : 'NEW'}</small></button>`;
  // 하단: 모드 타일 + 시작
  const rb = (typeof RAID !== 'undefined' && RAID.info && RAID.info.boss) || 'boss4';
  $('#tbtns').innerHTML = (saved ? `<div class="tmodes">`
    + `<button class="tmode m-inf" id="tInf">${I('pumpkin')}<b>할로윈파티</b><small>${saved.infBest ? '최고 WAVE ' + saved.infBest : '무한던전'}</small></button>`
    + `<button class="tmode m-pvp" id="tPvp">${I('swords')}<b>PvP 아레나</b><small>주간 시즌</small></button>`
    + `<button class="tmode m-raid" id="tRaid"><img src="${raidBossURL(rb)}" alt=""><b>월드 보스</b><small>하루 3번</small></button>`
    + `<button class="tmode m-tower" id="tTower">${I('tower')}<b>보스 타워</b><small>${towerBest(saved) ? '최고 ' + towerBest(saved) + '층' : '도전 모드'}</small></button></div>` : '')
    + (saved ? chapterPickHtml(saved) + `<div class="tstartRow"><button class="btn tplaza" id="tPlaza">${I('chat')}<b>광장</b><small>온라인</small></button><button class="btn pk tstart" id="tCont"><span>▶ 모험 계속하기</span><small>${zoneCh(curZone(saved)) === 2 ? '2장 · ' : ''}${zoneTitle(saved, curZone(saved))} · Lv.${saved.lv}</small></button></div>`
      : `<button class="btn pk tstart" id="tNew"><span>▶ 모험 시작</span><small>에버랜드 대탈출 · 도트 액션 RPG</small></button>`);
  $('#tEp2').onclick = () => { audioInit(); e2Open(); };
  if ($('#tPack')) $('#tPack').onclick = () => { audioInit(); packOpen(); };
  if ($('#tPack2')) $('#tPack2').onclick = () => { audioInit(); pack2Open(); };
  if ($('#tIdle')) $('#tIdle').onclick = () => { audioInit(); idleClaim(); };
  if ($('#tGoal')) $('#tGoal').onclick = () => { audioInit(); sfx('select'); msOpen(); };
  if ($('#tTower')) $('#tTower').onclick = () => { audioInit(); towerOpen(); };
  if (saved) { $('#tRaid').onclick = () => { audioInit(); raidOpen(); }; $('#tPvp').onclick = () => { audioInit(); pvpOpen(); }; $('#tInf').onclick = () => { audioInit(); fadeTo(startInfinite, '에버랜드: 할로윈파티'); };
    $('#tShare').onclick = () => { audioInit(); shareOpen(); };
    $('#tBag').onclick = () => { audioInit(); sfx('select'); lobbyMenu(); };
    $('.tprof').onclick = () => { audioInit(); sfx('select'); lobbyMenu('info'); };
    $('#tCont').onclick = () => { audioInit(); adventureGo(loadGame() || saved); };
    for (const b of document.querySelectorAll('.tch')) /** @type {HTMLElement} */ (b).onclick = () => { audioInit(); chapterPick(+b.getAttribute('data-ch')); }; }
  $('#tRank').onclick = () => { audioInit(); rankOpen('title'); };
  $('#tCloud').onclick = () => { audioInit(); cloudOpen('title'); };
  if ($('#tDaily')) $('#tDaily').onclick = () => { audioInit(); dailyOpen(); };
  if ($('#tPlaza')) $('#tPlaza').onclick = () => { audioInit(); sfx('select'); plazaOpen(); };
  if ($('#tNew')) $('#tNew').onclick = () => { audioInit(); newGame(); };
  $('#tSnd').onclick = () => { audioInit(); setSound(!SND.on); showTitle(); };
  titleLayout(); requestAnimationFrame(() => titleLayout()); setTimeout(() => { try { titleLayout(); } catch (e) { } }, 400); if (document.fonts) document.fonts.ready.then(() => { try { titleLayout(); } catch (e) { } });
  playBgm('story');
}
function newGame() { G.pd = newPD(); saveGame(); $('#title').hidden = true; G.world = null; calcStats(); playCut(INTRO, () => startZone(0)); }
function showDeath() { $('#death p').innerHTML = G.inf ? '할로윈파티에선 병원비 없이<br>바로 다시 일어나요!' : '폰 배터리도 0%...<br>병원비로 골드 10%를 내고 다시 일어나요.'; $('#death').hidden = false; }
function showEnd() {
  G.state = 'end'; $('#endScr h2').textContent = '희수와 보리의 에버랜드 대탈출'; const s = G.pd.stats; showHUD(false);
  $('#endStats').innerHTML = `최종 레벨 <b>Lv.${G.pd.lv}</b><br>처치한 몬스터 <b>${s.kills}</b>마리<br>멘헤라 공격 <b>${s.ults}</b>회<br>먹은 음식 <b>${s.eaten}</b>개 · 기절 <b>${s.deaths}</b>회<br>플레이 시간 <b>${fmtTime(s.time)}</b>`;
  $('#endBtns').innerHTML = `<button class="btn pk" id="eAgain">${G.pd.cleared + 1}회차 시작<small>${G.pd.cleared >= 2 ? '더 강한 몬스터 · 신화·초월 장비가 더 자주!' : (G.pd.cleared >= 1 ? '더 강하고 더 많은 몬스터 · 신화·초월 장비 등장!' : '')}</small></button><button class="btn wh" id="eTitle">타이틀로</button><div class="tsub">다음 이야기: 낚시터 대모험...?</div>`;
  $('#endScr').hidden = false;
  $('#eAgain').onclick = () => { $('#endScr').hidden = true; setCurZone(G.pd, 0); saveGame(); fadeTo(() => startZone(0)); };
  $('#eTitle').onclick = () => { $('#endScr').hidden = true; setCurZone(G.pd, 0); saveGame(); showTitle(); };
}
function startEnding() { showHUD(false); playCut(ENDING, () => { showEnd(); }); }

function setupUI() {
  $('#rankTabs').addEventListener('click', e => { const b = e.target.closest('[data-rt]'); if (b) { sfx('select'); rankTab(b.dataset.rt); } }); $('#rankClose').onclick = () => { sfx('select'); rankClose(); };
  $('#pvp').addEventListener('click', pvpClick); $('#pvpRes').addEventListener('click', pvpResClick);
  $('#pvpNickOk').onclick = () => pvpNickSave(); $('#pvpNickNo').onclick = () => { $('#pvpNick').hidden = true; if (RK.joining) { RK.joining = false; return; } if (!PV.me) { $('#pvp').hidden = true; showTitle(); } };
  $('#pvpNickIn').addEventListener('keydown', e => { if (e.key === 'Enter') pvpNickSave(); });
  $('#menu').addEventListener('click', menuClick);
  $('#menuBtn').addEventListener('click', () => { audioInit(); openMenu(); });
  $('#sndBtn').addEventListener('click', () => { audioInit(); setSound(!SND.on); updateSndBtn(); });
  $('#dlg').addEventListener('pointerdown', e => { e.stopPropagation(); audioInit(); dlgTap(); });
  $('#skip').addEventListener('click', e => { e.stopPropagation(); if (G.state === 'cut') endCut(); });
  $('#reviveBtn').addEventListener('click', () => { $('#death').hidden = true; respawn(); });
  $('#title').addEventListener('pointerdown', () => audioInit());
  updateSndBtn();
  $('#e2menu').addEventListener('click', e2MenuClick);
  $('#e2res').addEventListener('click', e2ResClick);
  $('#e2pauseBox').addEventListener('click', e2PauseClick);
  $('#e2start').addEventListener('click', () => { audioInit(); e2Go(); });
  $('#e2pause').addEventListener('click', () => e2Pause(true));
}
