// ===================== EP2 CORE =====================
const E2KEY = FORCE_EASY ? 'heesu_bori_ep2_onetouch_v1' : 'heesu_bori_ep2_v1';
const EP2 = { save: null, si: -1, st: null, phase: 'none', useJoy: false, paused: false, ult: null, prevAtk: false };
let ES = 4, EW = 200, EH = 200;
let E2TOP = 4;
function e2Scale() { ES = Math.max(2, Math.round(Math.min(cv.width, cv.height) / 170)); EW = cv.width / ES; EH = cv.height / ES; let sat = 0; try { const pr = $('#sap'); sat = pr ? pr.getBoundingClientRect().height : 0; } catch (e) { } E2TOP = Math.ceil(sat * DPR / ES) + 4; }
function e2New() { return { mode: 'normal', stars: [], unlocked: 0, prologue: false, cleared: false, own: {}, cloth: null, toy: null }; }
function e2Load() {
  let d = e2New();
  try { const s = localStorage.getItem(E2KEY) || (FORCE_EASY ? localStorage.getItem('heesu_bori_ep2_v1') : null); if (s) d = Object.assign(e2New(), JSON.parse(s)); } catch (e) { }
  const p1 = loadGame(); if (p1 && p1.inv) for (const id of ['b_knit', 'b_pad', 'toy_melon', 'toy_doll', 'toy_bone']) if (p1.inv[id]) d.own[id] = true;
  return d;
}
function e2SaveNow() { try { localStorage.setItem(E2KEY, JSON.stringify(EP2.save)); } catch (e) { } if (typeof cloudSync === 'function') cloudSync(); }
const e2Stars = () => EP2.save.stars.reduce((a, b) => a + (b || 0), 0);
function e2Unlock(id, quiet) {
  const s = EP2.save; if (s.own[id]) return; s.own[id] = true; const it = ITEMS[id];
  const slot = it.slot === 'btoy' ? 'toy' : 'cloth'; if (!s[slot]) s[slot] = id;
  if (!quiet) toast(`${it.name} 획득!`, 'item r' + it.rar); e2SaveNow();
}
function e2Bmul() { let m = 1; for (const id of [EP2.save.cloth, EP2.save.toy]) if (id && ITEMS[id]) m += ITEMS[id].bdmg; return m; }

// ---------- fluffy bori ----------
function b2Spr(kind, palOver) {
  const cl = EP2.save && EP2.save.cloth; const key = 'b2_' + kind + '|' + (cl || '') + (palOver ? JSON.stringify(palOver) : '');
  if (SPRC[key]) return SPRC[key];
  let rows = BORI2[kind]; const pal = Object.assign({}, B2PAL, palOver || {});
  if (cl && ITEMS[cl] && !palOver) { const it = ITEMS[cl]; rows = rows.map((r, y) => r.replace(/[Ww]/g, (ch, x) => it.pat === 'knit' ? ((x + y) % 2 ? 'W' : 'w') : (y % 2 ? 'W' : 'w'))); pal.W = it.color; pal.w = shadeHex(it.color, -0.2); }
  return SPRC[key] = makeSpr(rowsToCanvas(rows, pal));
}
const B2MOUTH = { sit: [0, -5.5], runA: [6.5, -4.5], runB: [6.5, -4.5], standA: [0, -8.5], standB: [0, -8.5], paw: [0, -8.5], lie: [0, -2.5], lieUp: [0, -2.5] };
function drawB2(kind, x, y, o) {
  o = o || {}; const sc = o.scale || 1, flip = !!o.flip;
  drawSpr(b2Spr(kind, o.pal), x, y, { flip, alpha: o.alpha, white: o.white, scale: sc });
  const toy = EP2.save && EP2.save.toy;
  if (toy && ITEMS[toy] && !o.noToy && !o.pal) { const ts = spr('t_' + toy, ICONS[ITEMS[toy].icon]); const m = B2MOUTH[kind]; drawSpr(ts, x + (flip ? -m[0] : m[0]) * sc, y + m[1] * sc + Math.ceil(ts.H / 2) * sc, { flip, scale: sc, alpha: o.alpha }); }
}
function rollFrame(p) { p = ((p % 1) + 1) % 1; return p < 0.14 ? 'sLie' : p < 0.34 ? 'sSide' : p < 0.6 ? 'sUp' : p < 0.84 ? 'sBack' : 'sLie'; }
function drawB2Roll(p, x, y, sc) { const k = rollFrame(p); const hop = k === 'sUp' ? 3 : (k === 'sSide' || k === 'sBack') ? 1 : 0; drawSpr(b2Spr(k), x, y - hop * sc, { scale: sc }); }
function b2Kind(moving, t, idle) { if (moving) return Math.floor(t * 10) % 2 ? 'runA' : 'runB'; if (idle > 0.6) return 'lie'; return 'sit'; }
function zzz(x, y, t) { const p = (t * 0.8) % 1; ctx.globalAlpha = 1 - p; fr(x + p * 6, y - p * 8, 2, 1, '#ffffff'); fr(x + p * 6 + 1, y - p * 8 + 1, 1, 1, '#ffffff'); fr(x + p * 6, y - p * 8 + 2, 2, 1, '#ffffff'); ctx.globalAlpha = 1; }
const s2 = k => spr('s2_' + k, SPR2[k]);

// ---------- screen helpers (art px, ES transform) ----------
const TXS = FORCE_EASY ? 1.45 : 1;
function e2T(x, y, s, size, fill, stroke, align) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); let fs = size * ES * TXS; ctx.font = `bold ${Math.round(fs)}px ${FONT}`; const w = ctx.measureText(s).width, maxW = cv.width * 0.94; if (w > maxW) fs *= maxW / w; let px = x * ES; if (!align || align === 'center') { const hw = Math.min(w, maxW) / 2; px = clamp(px, hw + 4, cv.width - hw - 4); } txt(s, px, y * ES, fs, fill, stroke, align); ctx.restore(); }
function e2Bubble(s, x, y, size) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); const fs = (size || 4.6) * ES * TXS; ctx.font = `bold ${Math.round(fs)}px ${FONT}`; const w = ctx.measureText(s).width + fs * 1.1; const px = clamp(x * ES, w / 2 + 4, cv.width - w / 2 - 4); bubbleBox(s, px, y * ES, fs); ctx.restore(); }
const e2Top = () => E2TOP;
function drawCaesar(x, y, left) {
  left = clamp(left == null ? 1 : left, 0, 1); fr(x - 7, y - 5, 14, 6, '#2b1b24'); fr(x - 6, y - 4, 12, 4, '#d8dce4'); fr(x - 6, y - 4, 12, 1, '#ffffff'); fr(x - 8, y - 6, 16, 2, '#2b1b24'); fr(x - 7, y - 6, 14, 1, '#f0f2f6');
  const w = Math.round(10 * left); if (w > 0) { fr(x - 5, y - 6, w, 2, '#a0602a'); for (let i = 0; i < w; i += 3) fr(x - 5 + i, y - 7, 2, 1, '#c8844a'); }
  fr(x - 3, y - 2, 6, 1, '#e8414f');
}
function e2Alert(sec, by) {
  const y = by || E2TOP + 22, h = 22, x = 6, w = EW - 12; const blink = Math.floor(performance.now() / 250) % 2;
  fr(x - 1, y - 1, w + 2, h + 2, '#2b1b24'); fr(x, y, w, h, blink ? '#ffd84a' : '#ffe68a'); fr(x, y, w, 2, '#e8414f'); fr(x, y + h - 2, w, 2, '#e8414f');
  pc(x + 11, y + h / 2, 7, '#e8414f'); e2T(x + 11, y + h / 2, '!', 6, '#ffffff');
  e2T(EW / 2 + 9, y + 7, '경고! 시저 먹는 중', 4.4, '#c0203a', '#ffffff');
  e2T(EW / 2 + 9, y + 15.5, `보리가 ${Math.max(1, Math.ceil(sec))}초간 말을 듣지 않아요`, 3.8, '#2b1b24', '#ffffff');
}
// fishing scene: one dock on the left — 언니(폰) · 오빠(졸면서 낚싯대) · 보리(줄을 입에 물고 당김)
function e2FishScene(dy, bobx, boby, tense, bkind, t, boom) {
  const de = Math.round(EW * 0.5); fr(0, dy, de, 8, '#2b1b24'); fr(0, dy + 1, de - 1, 6, '#a0683e'); for (let x = 0; x < de; x += 7) fr(x, dy + 1, 1, 6, '#7a4a2a'); for (const px of [6, de - 8]) fr(px, dy + 8, 3, EH - dy, '#5a3a2a');
  const hx = 12, ux = 30, bx = de - 10;
  drawHeeAt(hx, dy, 'phone', 'down', t, {});
  const tipx = de + 16, tipy = dy - 40 + Math.round((1 - tense) * 4);
  ctx.strokeStyle = '#2b1b24'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ux + 5, dy - 7); ctx.lineTo(tipx, tipy); ctx.stroke(); ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ux + 5, dy - 7); ctx.lineTo(tipx, tipy); ctx.stroke();
  if (boom) drawSpr(husSpr(), ux, dy); else drawHusSleep(ux, dy, t); if (!boom) { zzz(ux + 4, dy - 24, t); e2T(ux + 2, dy - 32, '쿨...', 3.4, '#ffffff', '#2b1b24'); } else e2T(ux + 2, dy - 30, '헉?!', 4, '#ffd84a', '#2b1b24');
  const mx = bx + 6, my = dy - 5;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(tipx, tipy); ctx.lineTo(mx, my); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo((mx + bobx) / 2, my + (1 - tense) * 22, bobx, boby); ctx.stroke();
  drawB2(bkind, bx, dy, { noToy: true }); fr(mx - 1, my - 1, 2, 2, '#ffffff');
  fr(bobx - 1, boby - 3, 3, 2, '#e8414f'); fr(bobx - 1, boby - 1, 3, 2, '#ffffff');
  return bx;
}
function drawScent(x, y, kind, t, r, label) {
  r = r || 9; const w = Math.round(r + Math.sin(t * 8) * 1.2); const cat = kind === 'cat';
  const body = cat ? '#7ee08a' : '#ff9fc4', hi = cat ? '#b8f5c0' : '#ffd6e6';
  if (cat) { for (const s of [-1, 1]) { ctx.fillStyle = '#2b1b24'; ctx.beginPath(); ctx.moveTo(x + s * w * 0.75, y - w * 0.15); ctx.lineTo(x + s * w * 0.85, y - w * 1.25); ctx.lineTo(x + s * w * 0.15, y - w * 0.7); ctx.closePath(); ctx.fill(); ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(x + s * w * 0.65, y - w * 0.3); ctx.lineTo(x + s * w * 0.76, y - w * 1.02); ctx.lineTo(x + s * w * 0.28, y - w * 0.62); ctx.closePath(); ctx.fill(); } }
  pc(x, y, w + 1, '#2b1b24'); pc(x, y, w, body); pc(x - w * 0.4, y - w * 0.2, Math.max(1, Math.round(w * 0.38)), hi); pc(x + w * 0.4, y + w * 0.15, Math.max(1, Math.round(w * 0.3)), hi);
  if (cat) { fr(x - w * 0.35 - 1, y - 1, 2, 2, '#2b1b24'); fr(x + w * 0.35 - 1, y - 1, 2, 2, '#2b1b24'); fr(x - 1, y + 1, 2, 1, '#ff7ab8'); }
  else { fr(x - 4, y - 3, 8, 7, '#2b1b24'); fr(x - 3, y - 2, 6, 5, '#e8e8f0'); fr(x - 3, y - 1, 6, 2, '#e8414f'); fr(x - 3, y - 2, 6, 1, '#ffffff'); }
  if (label !== false) e2T(x, y + w + 5, cat ? '고양이 냄새' : '시저 냄새', 3.4, cat ? '#7ee08a' : '#ff9fc4', '#2b1b24');
}
function e2Hearts(n, max, y) { const hs = ispr('heart'); for (let i = 0; i < max; i++) { drawSpr(hs, 10 + i * 9, (y || e2Top() + 9), { alpha: i < n ? 1 : 0.25 }); } }
function e2Bar(p, y, col, label) { const w = Math.min(EW - 80, 140), x = (EW - w) / 2; fr(x - 1, y - 1, w + 2, 6, '#2b1b24'); fr(x, y, w, 4, '#5a4a5a'); fr(x, y, Math.round(w * clamp(p, 0, 1)), 4, col || '#ffd84a'); if (label) e2T(EW / 2, y + 10, label, 3.8, '#ffffff', '#2b1b24'); }

// ---------- flow ----------
function e2Ptr(type, e) { if (!EP2.st || EP2.phase !== 'run' || EP2.paused || EP2.ult) return; const x = e.clientX * DPR / ES, y = e.clientY * DPR / ES; if (EP2.st.ptr) EP2.st.ptr(type, x, y, e); }
function e2Open() {
  EP2.save = e2Load(); $('#title').hidden = true; showHUD(false); e2Scale();
  if (!EP2.save.prologue) { e2Prologue(); return; }
  e2Menu();
}
function e2HideAll() { for (const id of ['#e2menu', '#e2card', '#e2res', '#e2pauseBox', '#ctrl2', '#e2pause']) $(id).hidden = true; EP2.useJoy = false; INP.joy.on = false; hideJoy(); INP.atk = false; }
function e2Menu() {
  e2HideAll(); G.state = 'e2menu'; EP2.st = null; playBgm('home'); const s = EP2.save; e2ApplyMode();
  const easy = s.mode === 'easy';
  const modeRow = `<div class="e2mode"><button class="${easy ? '' : 'on'}" data-e="mode" data-v="normal">원래 버전</button><button class="${easy ? 'on' : ''}" data-e="mode" data-v="easy">원터치모드 (쉬움)</button></div>`;
  const rows = (FORCE_EASY ? '' : modeRow) + E2STAGES.map((st, i) => { const lock = i > s.unlocked; const n = s.stars[i] || 0; return `<button class="e2st ${lock ? 'lock' : ''}" data-e="play" data-v="${i}" ${lock ? 'disabled' : ''}><b>${i + 1}</b><span><em>${st.name}</em><small>${st.kind}</small></span><i>${lock ? '잠김' : '★'.repeat(n) + '☆'.repeat(3 - n)}</i></button>`; }).join('');
  $('#e2list').innerHTML = rows;
  $('#e2info').textContent = `모은 별 ${e2Stars()} / ${E2STAGES.length * 3}`;
  $('#e2endBtn').hidden = !s.cleared;
  $('#e2menu').hidden = false;
}
function e2Wardrobe() {
  const s = EP2.save; const items = ['b_knit', 'b_pad', 'toy_melon', 'toy_doll', 'toy_bone'];
  const how = { b_knit: '경안천 클리어', b_pad: '용인시장 클리어', toy_bone: '동물병원 클리어', toy_melon: '별 6개', toy_doll: '별 12개' };
  $('#e2list').innerHTML = `<div class="e2prev"><img src="${e2PreviewURL()}"><div>보리 옷장<br><small>보스전에서 공격 보너스 +${Math.round((e2Bmul() - 1) * 100)}%</small></div></div>` +
    `<button class="e2st" data-e="wear" data-v="none-cloth"><b>👕</b><span><em>옷 벗기</em><small>복슬복슬 그대로</small></span><i>${!s.cloth ? '착용' : ''}</i></button>` +
    `<button class="e2st" data-e="wear" data-v="none-toy"><b>🦴</b><span><em>장난감 빼기</em><small>입이 심심해요</small></span><i>${!s.toy ? '착용' : ''}</i></button>` +
    items.map(id => { const it = ITEMS[id], own = s.own[id], on = s.cloth === id || s.toy === id; return `<button class="e2st ${own ? '' : 'lock'}" data-e="wear" data-v="${id}" ${own ? '' : 'disabled'}><b><img src="${itemURL(id)}"></b><span><em>${it.name}</em><small>${own ? '보리 공격 +' + Math.round(it.bdmg * 100) + '%' : '해금: ' + how[id]}</small></span><i>${on ? '착용' : (own ? '' : '잠김')}</i></button>`; }).join('') +
    `<button class="btn wh" data-e="menu" style="margin-top:6px">← 스테이지 목록</button>`;
  $('#e2info').textContent = '보리 옷장';
}
function e2PreviewURL() {
  const c = mkCanvas(20, 20); const g = c.getContext('2d');
  g.drawImage(b2Spr('sit').n, 3, 4); const toy = EP2.save.toy; if (toy) { const ts = spr('t_' + toy, ICONS[ITEMS[toy].icon]); g.drawImage(ts.n, Math.round(10 - ts.W / 2), Math.round(18 - 5.5 + Math.ceil(ts.H / 2) - ts.H)); }
  const o = mkCanvas(100, 100), og = o.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(c, 0, 0, 100, 100); return o.toDataURL();
}
function e2MenuClick(e) {
  const b = e.target.closest('[data-e]'); if (!b || b.disabled) return; const a = b.dataset.e, v = b.dataset.v; sfx('select');
  if (a === 'play') e2Play(+v);
  else if (a === 'mode') { EP2.save.mode = v; e2SaveNow(); e2Menu(); }
  else if (a === 'menu') e2Menu();
  else if (a === 'wardrobe') e2Wardrobe();
  else if (a === 'wear') { const s = EP2.save; if (v === 'none-cloth') s.cloth = null; else if (v === 'none-toy') s.toy = null; else { const it = ITEMS[v]; if (it.slot === 'btoy') s.toy = v; else s.cloth = v; } e2SaveNow(); e2Wardrobe(); }
  else if (a === 'prologue') { e2HideAll(); e2Prologue(true); }
  else if (a === 'ending') { e2HideAll(); e2Ending(); }
  else if (a === 'title') { e2HideAll(); showTitle(); }
}
function e2Play(i) {
  e2HideAll(); e2ApplyMode(); EP2.si = i; const st = EP2.st = E2STAGES[i]; e2Scale(); EP2.paused = false; EP2.ult = null;
  st.init(); EP2.phase = 'card'; G.state = 'ep2'; playBgm(st.bgm || 'field');
  const show = () => {
    if (st.hint) { EP2.phase = 'count'; EP2.cnt = 2.6; $('#e2pause').hidden = false; return; }
    EP2.phase = 'card'; $('#e2cSub').textContent = `STAGE ${i + 1} · ${st.kind}`; $('#e2cName').textContent = st.name; $('#e2cHow').innerHTML = st.how; $('#e2card').hidden = false;
  };
  if (st.before && !st._seen) { st._seen = true; EP2.phase = 'story'; dialog(st.before(), show); } else show();
}
function e2Go() { $('#e2card').hidden = true; const st = EP2.st; EP2.phase = 'run'; EP2.useJoy = !!st.joy; $('#e2pause').hidden = false; e2Ctrl(st.btns || []); sfx('ding'); }
function e2Ctrl(btns) {
  const map = { atk: '#c2atk', bark: '#c2bark', dash: '#c2dash', ult: '#c2ult' };
  $('#ctrl2').hidden = !btns.length; for (const k in map) $(map[k]).hidden = true;
  for (const b of btns) { const el = $(map[b.k]); el.hidden = false; el.querySelector('small').textContent = b.label; if (b.icon) el.querySelector('img').src = b.icon; }
}
function e2End(res) {
  if (EP2.phase !== 'run') return; EP2.phase = 'res'; e2HideAll(); G.state = 'ep2';
  const i = EP2.si, st = EP2.st, s = EP2.save;
  if (res.ok) {
    s.stars[i] = Math.max(s.stars[i] || 0, res.stars); s.unlocked = Math.max(s.unlocked, i + 1); dailyAdd('ep2');
    if (st.reward) e2Unlock(st.reward);
    if (e2Stars() >= 6) e2Unlock('toy_melon'); if (e2Stars() >= 12) e2Unlock('toy_doll');
    e2SaveNow(); sfx('lvl');
  } else sfx('hurt');
  $('#e2rTitle').textContent = res.ok ? (res.title || 'CLEAR!') : (res.title || '아쉬워요...');
  $('#e2rStars').innerHTML = res.ok ? [0, 1, 2].map(k => `<i class="${k < res.stars ? 'on' : ''}">★</i>`).join('') : '';
  $('#e2rText').innerHTML = res.text || '';
  $('#e2rBtns').innerHTML = (res.ok ? `<button class="btn pk" data-r="next">${i + 1 < E2STAGES.length ? '다음 이야기 ▶' : '엔딩 보기 ▶'}</button>` : '') + `<button class="btn wh" data-r="retry">다시 하기</button><button class="btn wh" data-r="menu">스테이지 목록</button>`;
  $('#e2res').hidden = false;
}
function e2ResClick(e) {
  const b = e.target.closest('[data-r]'); if (!b) return; const r = b.dataset.r; sfx('select'); $('#e2res').hidden = true;
  if (r === 'retry') { EP2.st._seen = true; e2Play(EP2.si); }
  else if (r === 'menu') e2Menu();
  else if (r === 'next') { const st = EP2.st; const go = () => { if (EP2.si + 1 < E2STAGES.length) { E2STAGES[EP2.si + 1]._seen = false; e2Play(EP2.si + 1); } else e2Ending(); }; if (st.after) { EP2.phase = 'story'; dialog(st.after(), go); } else go(); }
}
function e2Pause(on) { if (EP2.phase !== 'run') return; EP2.paused = on; $('#e2pauseBox').hidden = !on; INP.atk = false; INP.joy.on = false; hideJoy(); }
function e2PauseClick(e) { const b = e.target.closest('[data-p]'); if (!b) return; const p = b.dataset.p; if (p === 'resume') e2Pause(false); else if (p === 'retry') { $('#e2pauseBox').hidden = true; EP2.phase = 'x'; EP2.st._seen = true; e2Play(EP2.si); } else { $('#e2pauseBox').hidden = true; EP2.phase = 'x'; e2Menu(); } }

function e2Frame(dt) {
  const st = EP2.st; if (!st) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  if (EP2.phase === 'count' && !EP2.paused) { const pc = EP2.cnt; EP2.cnt -= dt; if (Math.ceil(EP2.cnt * 1.25) !== Math.ceil(pc * 1.25) && EP2.cnt > 0) tone(660, 0.08, 'square', 0.08); if (EP2.cnt <= 0) { EP2.phase = 'run'; sfx('ding'); } }
  if (EP2.phase === 'run' && !EP2.paused) {
    if (st.hint && INP.act.has('ok')) { if (st.ptr) st.ptr('down', EW / 2, EH / 2, { clientX: CW / 2, clientY: CH / 2 }); }
    if (st.hint && INP.act.has('kleft') && st.ptr) st.ptr('down', 1, EH / 2, { clientX: 1, clientY: CH / 2 });
    if (st.hint && INP.act.has('kright') && st.ptr) st.ptr('down', EW - 1, EH / 2, { clientX: CW - 1, clientY: CH / 2 });
    if (EP2.ult) e2UltUpdate(dt); else st.update(dt);
  }
  ctx.setTransform(ES, 0, 0, ES, 0, 0);
  st.render(dt);
  ctx.setTransform(ES, 0, 0, ES, 0, 0);
  if (EP2.ult) e2UltRender();
  if (EP2.phase === 'count') { ctx.fillStyle = 'rgba(30,10,40,0.45)'; ctx.fillRect(0, 0, EW, EH); e2T(EW / 2, EH * 0.3, `STAGE ${EP2.si + 1} · ${st.name}`, 6, '#ffd1e6', '#2b1b24'); e2T(EW / 2, EH * 0.4, st.hint, 7.5, '#ffffff', '#2b1b24'); if (st.hint2) e2T(EW / 2, EH * 0.48, st.hint2, 5.2, '#ff9fc4', '#2b1b24'); e2T(EW / 2, EH * (st.hint2 ? 0.62 : 0.56), String(Math.max(1, Math.ceil(EP2.cnt * 1.25 - 0.25))), 22, '#ffd84a', '#2b1b24'); }
  if (EP2.phase === 'run' && (INP.act.has('esc') || INP.act.has('menu'))) e2Pause(!EP2.paused);
  INP.act.clear();
}
window.addEventListener('resize', () => { if (G.state === 'ep2' || G.state === 'e2menu') { e2Scale(); if (EP2.st && EP2.st.resize) EP2.st.resize(); } });

// ---------- 보리 주세요 (ultimate cinematic) ----------
function e2UltStart(onHit) { EP2.ult = { t: 0, onHit, hit: false }; INP.atk = false; sfx('ding'); }
function e2UltUpdate(dt) { const U = EP2.ult; U.t += dt; if (!U.hit && U.t >= 1.55) { U.hit = true; sfx('lvl'); if (U.onHit) U.onHit(); } if (U.t >= 2.5) EP2.ult = null; if (Math.floor(U.t * 8) !== Math.floor((U.t - dt) * 8) && U.t > 0.4 && U.t < 1.4) tone(900 + Math.random() * 300, 0.04, 'triangle', 0.08); }
function e2UltRender() {
  const U = EP2.ult, t = U.t; ctx.fillStyle = `rgba(40,8,50,${Math.min(0.75, t * 2.5) * (t > 2.1 ? (2.5 - t) / 0.4 : 1)})`; ctx.fillRect(0, 0, EW, EH);
  const sc = Math.max(3, Math.floor(Math.min(EW, EH) / 34)); const cx = EW / 2, cy = EH * 0.62;
  let kind = 'sit'; if (t > 0.3 && t < 1.4) kind = Math.floor(t * 9) % 2 ? 'standA' : 'standB'; else if (t >= 1.4) kind = 'paw';
  const pop = t < 0.3 ? t / 0.3 : 1; const a = t > 2.1 ? (2.5 - t) / 0.4 : 1;
  for (let i = 0; i < 10; i++) { const ang = t * 2 + i * 0.63, r = sc * 14 + Math.sin(t * 6 + i) * sc * 2; ctx.globalAlpha = a; fr(cx + Math.cos(ang) * r, cy - sc * 8 + Math.sin(ang) * r * 0.8, sc / 2, sc / 2, i % 2 ? '#ffd84a' : '#ff9fcf'); }
  drawB2(kind, cx, cy, { scale: Math.max(1, Math.round(sc * pop)), alpha: a });
  if (t > 0.35) { const s = t < 0.5 ? 1.5 - (t - 0.35) * 3.3 : 1; ctx.globalAlpha = a; e2T(cx, EH * 0.2, '보리 주세요', 15 * s, '#ff7ab8', '#2a0838'); if (t > 1.4) e2T(cx, EH * 0.2 + 16, '(앞발 툭)', 6, '#ffd1e6', '#2a0838'); ctx.globalAlpha = 1; }
  ctx.globalAlpha = 1;
}

// ---------- action arena (냥갱 / 월척) ----------
function arenaBori(x, y) { return { x, y, hp: 5, max: 5, inv: 0, face: 1, t: 0, idle: 0, dashT: 0, dashCd: 0, barkCd: 0, biteCd: 0, gauge: 0, dx: 1, dy: 0, moving: false, slow: 0, hitT: 0 }; }
function arenaUpdateBori(A, dt, canHit) {
  const B = A.b, bm = e2Bmul(); B.t += dt; B.inv -= dt; B.dashCd -= dt; B.barkCd -= dt; B.biteCd -= dt; B.hitT -= dt;
  B.gauge = Math.min(100, B.gauge + dt * 1.2);
  const [mx, my] = moveVec(); const mag = Math.hypot(mx, my);
  if (B.dashT > 0) { B.dashT -= dt; B.x += B.dx * 230 * dt; B.y += B.dy * 230 * dt; if (Math.random() < dt * 40) A.parts.push({ x: B.x, y: B.y, vx: 0, vy: -8, life: 0.3, max: 0.3, col: '#f0e0c8', sz: 2 }); }
  else if (mag > 0.18) { const sp = 74 * Math.min(1, mag) * (B.slow > 0 ? 0.55 : 1); B.x += mx / mag * sp * dt; B.y += my / mag * sp * dt; B.dx = mx / mag; B.dy = my / mag; if (Math.abs(mx) > 0.1) B.face = mx > 0 ? 1 : -1; B.moving = true; B.idle = 0; }
  else { B.moving = false; B.idle += dt; }
  B.slow -= dt;
  B.x = clamp(B.x, A.x0, A.x1); B.y = clamp(B.y, A.y0, A.y1);
  const T = A.boss;
  const hitBoss = (dmg, o) => { if (!canHit()) { A.texts.push({ x: T.x, y: T.y - T.h - 4, s: A.noHitMsg || '안 닿아!', t: 0, col: '#9fe8ff' }); return; } const d = Math.round(dmg * bm * rand(0.9, 1.1)); T.hp = Math.max(A.minHp ? A.minHp() : 0, T.hp - d); T.flash = 0.12; A.texts.push({ x: T.x + rand(-4, 4), y: T.y - T.h - 2, s: String(d), t: 0, col: '#ffffff' }); B.gauge = Math.min(100, B.gauge + 5); for (let i = 0; i < 4; i++) A.parts.push({ x: T.x, y: T.y - T.h / 2, vx: rand(-40, 40), vy: rand(-50, 0), life: 0.4, max: 0.4, col: T.col, sz: 1 }); sfx('hit'); if (o && o.stun) T.stun = Math.max(T.stun || 0, o.stun); };
  if (INP.atk && B.biteCd <= 0) {
    B.biteCd = 0.32; B.idle = 0; const d = Math.hypot(T.x - B.x, (T.y - 4) - B.y);
    if (d < 20 + T.r) { B.face = T.x > B.x ? 1 : -1; hitBoss(4); A.fx.push({ k: 'bite', x: T.x, y: T.y - T.h * 0.5, t: 0 }); } else { B.x += B.face * 4; }
  }
  if ((INP.act.has('b_bark') || INP.act.has('s1')) && B.barkCd <= 0) { B.barkCd = 5; sfx('bark'); A.fx.push({ k: 'ring', x: B.x, y: B.y - 5, r: 42, t: 0, col: '#ffd84a' }); A.say = { s: '멍멍!', t: 0, who: 'b' }; if (Math.hypot(T.x - B.x, T.y - B.y) < 42 + T.r) hitBoss(6, { stun: 1.0 }); }
  if ((INP.act.has('b_dash') || INP.act.has('s2')) && B.dashCd <= 0) { B.dashCd = 2; B.dashT = 0.24; B.inv = Math.max(B.inv, 0.3); sfx('swing'); if (mag < 0.18) { B.dx = B.face; B.dy = 0; } }
  if (INP.act.has('b_ult') || INP.act.has('ult')) { if (B.gauge >= 100) { B.gauge = 0; A.onUlt(); } else { A.texts.push({ x: B.x, y: B.y - 18, s: '게이지 부족', t: 0, col: '#ffd1e6' }); } }
}
function arenaHurt(A, n) { const B = A.b; if (B.inv > 0 || EP2.ult) return; B.hp -= n || 1; B.inv = 1.5; B.hitT = 0.15; sfx('hurt'); A.shake = 4; A.texts.push({ x: B.x, y: B.y - 16, s: '깨갱!', t: 0, col: '#ff6b8a' }); if (B.hp <= 0) { B.hp = 0; setTimeout(() => e2End({ ok: false, text: '보리가 지쳐서 엎드려버렸어요...<br>조금 쉬고 다시 해봐요!' }), 600); A.dead = true; } }
function arenaFx(A, dt) {
  for (const p of A.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 100 * dt; p.life -= dt; } A.parts = A.parts.filter(p => p.life > 0);
  for (const f of A.fx) f.t += dt; A.fx = A.fx.filter(f => f.t < (f.dur || 0.45));
  for (const t of A.texts) t.t += dt; A.texts = A.texts.filter(t => t.t < 0.8);
  if (A.say) { A.say.t += dt; if (A.say.t > 1.2) A.say = null; }
  if (A.shake > 0) A.shake -= dt * 12;
}
function arenaDrawCommon(A) {
  for (const f of A.fx) { const p = f.t / (f.dur || 0.45); if (f.k === 'ring') { ctx.globalAlpha = 1 - p; const r = f.r * (0.3 + 0.7 * p); pRingE(f.x, f.y, r, r * 0.65, f.col); ctx.globalAlpha = 1; } else if (f.k === 'bite') { ctx.globalAlpha = 1 - p; for (const ox of [-3, 1]) { fr(f.x + ox, f.y - 2, 3, 1, '#fff'); fr(f.x + ox + 1, f.y - 1, 1, 1, '#fff'); fr(f.x + ox, f.y + 2, 3, 1, '#fff'); fr(f.x + ox + 1, f.y + 1, 1, 1, '#fff'); } ctx.globalAlpha = 1; } else if (f.k === 'circle') { ctx.fillStyle = `rgba(255,60,90,${0.15 + 0.15 * Math.sin(f.t * 20)})`; pEll(ctx, f.x, f.y, f.r, Math.round(f.r * 0.6), ctx.fillStyle); pEll(ctx, f.x, f.y, Math.max(1, Math.round(f.r * p)), Math.max(1, Math.round(f.r * 0.6 * p)), 'rgba(255,60,90,0.3)'); } else if (f.k === 'line') { ctx.fillStyle = `rgba(255,60,90,${0.15 + 0.2 * p})`; ctx.fillRect(f.x0, f.y - f.w / 2, f.x1 - f.x0, f.w); } }
  for (const p of A.parts) { ctx.globalAlpha = clamp(p.life / p.max, 0, 1); fr(p.x, p.y, p.sz, p.sz, p.col); } ctx.globalAlpha = 1;
}
function arenaDrawBori(A) {
  const B = A.b; shadow(B.x, B.y, 12);
  const blink = B.inv > 0 && Math.floor(B.t * 20) % 2 === 0;
  const kind = B.dashT > 0 ? 'runA' : b2Kind(B.moving, B.t, B.idle);
  drawB2(kind, B.x, B.y, { flip: B.face < 0 && kind.startsWith('run'), alpha: blink ? 0.4 : 1, white: B.hitT > 0 });
  if (kind === 'lie') zzz(B.x + 6, B.y - 10, B.t);
}
function arenaHUD(A, bossName) {
  e2Hearts(A.b.hp, A.b.max);
  const T = A.boss, top = e2Top(); e2Bar(T.hp / T.max, top + 16, '#ff5a7a', bossName);
  const gy = top + 30; const w = 60; fr(EW - w - 11, gy - 1, w + 2, 5, '#2b1b24'); fr(EW - w - 10, gy, w, 3, '#5a3a5a'); fr(EW - w - 10, gy, Math.round(w * A.b.gauge / 100), 3, A.b.gauge >= 100 ? '#ff7ab8' : '#c890ff'); e2T(EW - 10 - w / 2, gy + 8, A.b.gauge >= 100 ? '보리 주세요 준비!' : '애교 게이지', 3.4, '#ffd1e6', '#2b1b24');
  for (const t of A.texts) { ctx.globalAlpha = 1 - t.t / 0.8; e2T(t.x, t.y - t.t * 12, t.s, 4.8, t.col, '#2b1b24'); } ctx.globalAlpha = 1;
  if (A.say) { const who = A.say.who === 'b' ? A.b : A.boss; e2Bubble(A.say.s, who.x, who.y - (A.say.who === 'b' ? 15 : who.h + 4)); }
}
const ARENA_BTNS = () => [{ k: 'atk', label: '물기', icon: iconURL('sk_paw', ICONS.paw) }, { k: 'bark', label: '멍멍!', icon: iconURL('sk_sound', ICONS.sound) }, { k: 'dash', label: '우다다', icon: iconURL('sk_bolt', ICONS.bolt) }, { k: 'ult', label: '보리 주세요', icon: iconURL('face_bori2', BORI2.sit, B2PAL) }];

// ---------- menu background ----------
function e2RenderMenuBg() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; const CS = cutScale(), SW = cv.width / CS, SH = cv.height / CS; ctx.setTransform(CS, 0, 0, CS, 0, 0);
  const mid = Math.round(SW / 2), gy = Math.round(SH * 0.56); CUTK = clamp(SW / 220, 0.6, 1);
  drawHome(SW, SH, mid, gy, G.time, {});
  shadow(mid - 20, gy + 14, 12); drawB2('lie', mid - 20, gy + 14); zzz(mid - 14, gy + 4, G.time);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(30,10,40,0.35)'; ctx.fillRect(0, 0, cv.width, cv.height);
}
