// ===================== RENDER =====================
const FONT = '"HB", "Galmuri11", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
function txt(s, x, y, size, fill, stroke, align, bold) {
  ctx.font = `${bold === false ? '' : 'bold '}${Math.round(size)}px ${FONT}`; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (stroke) { ctx.lineWidth = Math.max(2, size * 0.24); ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); }
  ctx.fillStyle = fill; ctx.fillText(s, x, y);
}
function fr(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function pc(cx, cy, r, c) { pCirc(ctx, Math.round(cx), Math.round(cy), r, c); }
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function bubbleBox(s, x, y, size, opt) {
  opt = opt || {};
  ctx.font = `bold ${Math.round(size)}px ${FONT}`;
  const w = ctx.measureText(s).width + size * 1.1, h = size * 1.7, bx = x - w / 2, by = y - h;
  const lw = Math.max(2, size * 0.16);
  ctx.fillStyle = opt.bg || '#ffffff'; ctx.strokeStyle = opt.border || '#2b1b24'; ctx.lineWidth = lw;
  roundRect(bx, by, w, h, size * 0.45); ctx.fill(); ctx.stroke();
  if (!opt.noTail) { ctx.beginPath(); ctx.moveTo(x - size * 0.35, by + h - lw / 2); ctx.lineTo(x, by + h + size * 0.5); ctx.lineTo(x + size * 0.35, by + h - lw / 2); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - size * 0.35, by + h); ctx.lineTo(x, by + h + size * 0.5); ctx.lineTo(x + size * 0.35, by + h); ctx.stroke(); }
  txt(s, x, by + h / 2 + size * 0.05, size, opt.color || '#2b1b24');
}
const SHADOWS = {};
function shadow(x, y, w) { w = Math.max(6, Math.round(w)); if (!SHADOWS[w]) { const c = mkCanvas(w, 4); pEll(c.getContext('2d'), w / 2, 2, Math.floor(w / 2) - 1, 1, 'rgba(30,10,40,0.28)'); SHADOWS[w] = c; } ctx.drawImage(SHADOWS[w], Math.round(x - w / 2), Math.round(y - 2)); }
const W2S = (x, y) => [(x - G.rcx) * S, (y - G.rcy) * S];

const PSPR = {
  balloon: ['.KKK.', 'KVVVK', 'KVIVK', 'KVVVK', '.KKK.', '..J..'],
  note: ['..KK.', '..KAK', '..KK.', '..K..', 'KKK..', 'KAK..', 'KKK..'],
  tea: ['.KK.', 'KQQK', 'KQIK', '.KK.'],
  phone: ['KKK', 'KqK', 'KqK', 'KKK'],
  bush: ['....KKKK....', '..KK1111KK..', '.K11122111K.', 'K1122111221K', 'K1111111111K', '.KKKKKKKKKK.']
};
const pspr = k => spr('p_' + k, PSPR[k]);
const ispr = k => spr('i_' + k, ICONS[k]);
function itemPal(it) { const c = it.color; if (!c) return null; if (it.icon === 'hat') return { C: c, c: shadeHex(c, -0.22) }; if (it.icon === 'jacket') return { W: c, w: shadeHex(c, -0.15) }; if (['shoes', 'sandal', 'boots', 'fishshoe'].includes(it.icon)) return { O: c, o: shadeHex(c, -0.18) }; if (it.icon === 'handbag') return { Q: c, q: shadeHex(c, -0.2) }; if (it.icon === 'bag') return { G: c, g: shadeHex(c, -0.25) }; if (it.slot === 'bcloth') return { Y: c, y: shadeHex(c, -0.2) }; return null; }
const itemSpr = id => { const it = ITEMS[id]; return spr('it_' + id, ICONS[it.icon], itemPal(it)); };
const itemURL = id => { const it = ITEMS[id]; return iconURL('it_' + id, ICONS[it.icon], itemPal(it)); };

function heePal() {
  const pd = G.pd || (G.state === 'title' ? TITLE_PD : null);
  const eq = pd ? visEq(pd) : newPD().eq; const hat = ITEMS[eq.hat].color, arm = ITEMS[eq.armor].color, sh = ITEMS[eq.shoes].color, bag = ITEMS[eq.bag].color;
  const hr = hairPal(pd && pd.look && pd.look.hair);
  return { C: hat, c: shadeHex(hat, -0.22), W: arm, w: shadeHex(arm, arm === '#3a3a46' ? 0.12 : -0.15), O: sh, o: shadeHex(sh, -0.18), G: bag, g: shadeHex(bag, -0.25), H: hr.H, h: hr.h };
}
function heeSet() {
  const pal = heePal(); const key = 'hee|' + Object.values(pal).join(',');
  if (SPRC[key]) return SPRC[key];
  const H = HS, f = (a, b, c) => makeSpr(rowsToCanvas([...a, ...b, ...c], pal));
  const set = {
    down: [f(H.headF, H.bodyF, H.legsF.i), f(H.headF, H.bodyF, H.legsF.a), f(H.headF, H.bodyF, H.legsF.b)],
    up: [f(H.headB, H.bodyB, H.legsF.i), f(H.headB, H.bodyB, H.legsF.a), f(H.headB, H.bodyB, H.legsF.b)],
    right: [f(H.headR, H.bodyR, H.legsR.i), f(H.headR, H.bodyR, H.legsR.a), f(H.headR, H.bodyR, H.legsR.b)],
    phone: [f(H.headPh, H.bodyPh, H.legsF.i), f(H.headPh2, H.bodyPh, H.legsF.i)]
  };
  SPRC[key] = set; return set;
}
const husSpr = () => spr('hus', [...HUS.head, ...HUS.body, ...HUS.legs]);
const husSleepSpr = () => spr('husZ', [...HUS.headZ, ...HUS.body, ...HUS.legs]);
function drawHusSleep(x, y, t) { drawSpr(husSleepSpr(), x, y + (Math.sin(t * 1.6) > 0.6 ? 1 : 0)); }

// draw heesu at x,y (feet). opts: pose, dir, t, flash, alpha
function drawHeeAt(x, y, pose, dir, t, o) {
  o = o || {}; const set = heeSet(); let s, flip = false, bob = 0;
  if (pose === 'phone') { s = set.phone[Math.floor(t * 1.3) % 2]; }
  else {
    const d = dir === 'left' ? 'right' : (dir || 'down'); flip = dir === 'left'; const arr = set[d];
    if (pose === 'walk') { const fi = Math.floor(t * 8) % 4; s = arr[[1, 0, 2, 0][fi]]; bob = fi % 2 ? -1 : 0; }
    else if (pose === 'atk') s = arr[1]; else s = arr[0];
  }
  drawSpr(s, x, y + bob, { flip, white: o.white, alpha: o.alpha });
  if (pose === 'phone') { if (Math.floor(t * 3) % 4 === 0) fr(x - 1, y - 13, 1, 1, '#ffffff'); }
}
function boriSpr(kind) {
  const cl = G.pd && G.pd.beq ? G.pd.beq.bcloth : null; const key = 'b_' + kind + '|' + (cl || '');
  if (SPRC[key]) return SPRC[key];
  let rows = BORI[kind], pal = null;
  if (cl && ITEMS[cl]) { const it = ITEMS[cl]; rows = rows.map((r, y) => r.replace(/[Yy]/g, (ch, x) => it.pat === 'knit' ? ((x + y) % 2 ? 'Y' : 'y') : (y % 2 ? 'Y' : 'y'))); pal = { Y: it.color, y: shadeHex(it.color, -0.2) }; }
  return SPRC[key] = makeSpr(rowsToCanvas(rows, pal));
}
function drawBoriAt(x, y, pose, face, t, o) {
  o = o || {}; let s; const j = o.jump || 0;
  if (pose === 'run') s = boriSpr(Math.floor(t * 10) % 2 ? 'runA' : 'runB');
  else s = boriSpr((o.pant && Math.floor(t * 4) % 2) ? 'sitT' : 'sit');
  drawSpr(s, x, y - j, { flip: pose === 'run' && face < 0, alpha: o.alpha });
  const toy = G.pd && G.pd.beq ? G.pd.beq.btoy : null;
  if (toy && ITEMS[toy]) { const ts = spr('t_' + toy, ICONS[ITEMS[toy].icon]); if (pose === 'run') drawSpr(ts, x + (face < 0 ? -6 : 6), y - j - 3.5 + ts.H / 2, { flip: face < 0, alpha: o.alpha }); else drawSpr(ts, x, y - j - 4 + Math.ceil(ts.H / 2), { alpha: o.alpha }); }
}

// ---------- world render ----------
function renderGame() {
  const W = G.world; if (!W) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = W.bg; ctx.fillRect(0, 0, cv.width, cv.height);
  let sx = 0, sy = 0; if (G.shake > 0) { sx = rand(-G.shake, G.shake); sy = rand(-G.shake, G.shake); }
  const cx = Math.round(G.cam.x + sx), cy = Math.round(G.cam.y + sy); G.rcx = cx; G.rcy = cy;
  ctx.setTransform(S, 0, 0, S, -cx * S, -cy * S);
  const gx = clamp(cx, 0, W.W), gy = clamp(cy, 0, W.H), gw = Math.min(W.W - gx, Math.ceil(VW) + 2), gh = Math.min(W.H - gy, Math.ceil(VH) + 2);
  if (gw > 0 && gh > 0) ctx.drawImage(W.ground, gx, gy, gw, gh, gx, gy, gw, gh);
  const T = G.time;
  if (W.fountain) { const f = W.fountain; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + T * 0.7, r = 9 + ((T * 6 + i * 3) % 12); fr(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.7, 1, 1, '#ffffff'); } const h = (T * 30) % 14; fr(f.x, f.y - 6 - h, 1, 2, '#d8f4ff'); fr(f.x - 2, f.y - 4 - (h * 0.6), 1, 1, '#d8f4ff'); fr(f.x + 2, f.y - 4 - (h * 0.7), 1, 1, '#d8f4ff'); }
  if (W.mainGate && W.mainGate.y - 60 < cy + VH) { const img = W.gateClosed; ctx.drawImage(img, W.mainGate.x - img.width / 2, W.mainGate.y - img.height); }
  // telegraphs
  for (const f of G.fx) {
    const p = f.t / f.dur;
    if (f.k === 'circle') { ctx.fillStyle = `rgba(255,60,90,${0.14 + 0.12 * Math.sin(f.t * 20)})`; pEll(ctx, f.x, f.y, f.r, Math.round(f.r * 0.6), ctx.fillStyle); pEll(ctx, f.x, f.y, Math.max(1, Math.round(f.r * p)), Math.max(1, Math.round(f.r * 0.6 * p)), 'rgba(255,60,90,0.28)'); pRingE(f.x, f.y, f.r, f.r * 0.6, 'rgba(255,40,70,0.9)'); }
    else if (f.k === 'line') { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.fillStyle = `rgba(255,60,90,${0.12 + 0.18 * p})`; ctx.fillRect(0, -f.w / 2, f.len, f.w); ctx.fillStyle = 'rgba(255,40,70,0.85)'; ctx.fillRect(0, -f.w / 2, f.len * p, 1); ctx.fillRect(0, f.w / 2 - 1, f.len * p, 1); ctx.restore(); }
  }
  // draw list
  const L = [];
  for (const d of W.decor) { const w = d.img.width, h = d.img.height; if (d.x + w / 2 < cx - 4 || d.x - w / 2 > cx + VW + 4 || d.y < cy - 4 || d.y - h > cy + VH + 4) continue; L.push({ y: d.y, f: () => ctx.drawImage(d.img, Math.round(d.x - w / 2), Math.round(d.y - h)) }); }
  L.push({ y: W.gate.y, f: drawGate });
  for (const d of G.drops) L.push({ y: d.y, f: () => drawDrop(d) });
  for (const e of G.enemies) L.push({ y: e.y, f: () => drawEnemy(e) });
  if (G.bori && !G.bori.hidden) L.push({ y: G.bori.y, f: () => { shadow(G.bori.x, G.bori.y, 10); drawBoriAt(G.bori.x, G.bori.y, G.bori.run ? 'run' : 'sit', G.bori.face, G.bori.t + G.time, { pant: isOnPhone() || G.state === 'menu', jump: G.bori.jump > 0 ? Math.round(Math.sin(G.bori.jump * 12) * 3 + 3) : 0 }); } });
  if (G.evt && !G.evt.popped) L.push({ y: G.evt.sy, f: () => { const s = pspr('bush'); drawSpr(s, G.evt.sx + Math.round(Math.sin(G.time * 40) * (G.evt.t > 0.4 ? 1 : 0)), G.evt.sy, { scale: 1 }); } });
  if (G.buddy) L.push({ y: G.buddy.y, f: () => drawRival(G.buddy) });
  L.push({ y: G.P.y, f: drawPlayer });
  L.sort((a, b) => a.y - b.y); for (const o of L) o.f();
  // projectiles
  for (const p of G.projs) drawProj(p);
  // fx
  for (const f of G.fx) drawFx(f);
  // particles
  for (const p of G.parts) { const a = clamp(p.life / p.max, 0, 1); ctx.globalAlpha = a; if (p.heart) drawSpr(ispr('heart'), p.x, p.y + 4); else fr(p.x, p.y, p.sz, p.sz, p.col); } ctx.globalAlpha = 1;
  // overhead rails
  for (const r of W.rails) { if (r.y > cy + VH || r.y < cy - 10) continue; fr(r.x0, r.y, r.x1 - r.x0, 4, '#2b1b24'); fr(r.x0, r.y + 1, r.x1 - r.x0, 1, '#d84a5a'); for (let x = r.x0; x < r.x1; x += 6) fr(x, r.y - 1, 2, 6, '#5a3a3a'); fr(r.x0, r.y - 2, r.x1 - r.x0, 1, '#a0a6b0'); fr(r.x0, r.y + 4, r.x1 - r.x0, 1, '#a0a6b0'); }
  renderScreen();
}
function pRingE(cx, cy, rx, ry, col) { ctx.fillStyle = col; const n = Math.max(16, Math.floor(rx * 4)); for (let i = 0; i < n; i++) { const a = i / n * 6.283; ctx.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1); } }

function drawGate() {
  const W = G.world, gx = W.gate.x, gy = W.gate.y;
  if (G.exitOpen) {
    const img = W.gateOpen; const x0 = Math.round(gx - img.width / 2), y0 = Math.round(gy - img.height);
    const pulse = 0.75 + Math.sin(G.time * 5) * 0.2;
    ctx.fillStyle = `rgba(255,246,190,${pulse})`; ctx.fillRect(x0 + 12, y0 + 15, 38, 39);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 6; i++) { const yy = y0 + 54 - ((G.time * 30 + i * 7) % 39); ctx.fillRect(x0 + 14 + ((i * 13) % 34), Math.round(yy), 1, 2); }
    ctx.drawImage(img, x0, y0);
  } else { const img = W.gateClosed; ctx.drawImage(img, Math.round(gx - img.width / 2), Math.round(gy - img.height)); }
}
function drawPlayer() {
  const P = G.P; shadow(P.x, P.y, 12);
  const phone = isOnPhone() || G.state === 'menu';
  const pose = phone ? 'phone' : (P.moving ? 'walk' : (P.atkAnim > 0 ? 'atk' : 'idle'));
  const blink = P.inv > 0 && P.flash <= 0 && Math.floor(G.time * 20) % 2 === 0;
  if (G.state === 'dead') { ctx.save(); ctx.translate(Math.round(P.x), Math.round(P.y - 4)); ctx.rotate(-Math.PI / 2); drawHeeAt(0, 10, 'idle', 'down', 0, {}); ctx.restore(); for (let i = 0; i < 3; i++) { const a = G.time * 3 + i * 2.1; drawSpr(ispr('heart'), P.x + Math.cos(a) * 9, P.y - 10 + Math.sin(a) * 3); } return; }
  drawHeeAt(P.x, P.y, pose, P.dir, phone ? G.time : P.walkT, { white: P.flash > 0, alpha: blink ? 0.45 : 1 });
  if (G.ult && G.ult.t < 1.2) { for (let i = 0; i < 6; i++) { const a = G.time * 4 + i * 1.05; fr(P.x + Math.cos(a) * 11, P.y - 10 + Math.sin(a) * 6, 2, 2, i % 2 ? '#ff7ab8' : '#b45cff'); } }
}
function drawEnemy(e) {
  if (e.rival) return drawRival(e);
  const s = monSpr(e.m.spr); const hy = Math.round(e.hopY || 0);
  if (!e.fly || true) shadow(e.x, e.y, Math.max(8, e.w * 0.7));
  if (e.elite && !e.dead) { ctx.globalAlpha = 0.45 + 0.25 * Math.sin(G.time * 6); pEll(ctx, Math.round(e.x), Math.round(e.y), Math.round(e.w * 0.5), 3, '#ffd84a'); ctx.globalAlpha = 1; }
  if (e.spawnT > 0 && !e.boss) { const p = 1 - e.spawnT / 0.45; drawSpr(s, e.x, e.y - hy, { alpha: p, white: true, scale: e.sc }); return; }
  if (e.spawnT > 0 && e.boss) { const p = 1 - e.spawnT / 1.3; drawSpr(s, e.x, e.y - hy - (1 - p) * 40, { alpha: p, scale: e.sc, white: Math.floor(G.time * 12) % 2 === 0 }); return; }
  const dy = e.dead ? (1 - e.deadT / 0.25) * 4 : 0;
  const sq = e.m.ai === 'hop' && hy === 0 && (e.t % 1.1) > 1.0;
  if (e.type === 'horse') { fr(e.x - 1, e.y - hy - e.h - 6, 2, e.h + 8, '#d9a520'); fr(e.x - 1, e.y - hy - e.h - 6, 1, e.h + 8, '#ffd84a'); }
  const flip = e.m.ai === 'boss2' ? e.face < 0 : e.face < 0;
  drawSpr(s, e.x, e.y - hy + dy + (sq ? 1 : 0), { flip, white: e.flash > 0 || e.dead, alpha: e.dead ? e.deadT / 0.25 : 1, scale: e.sc });
  if (e.type === 'soldier') { const hx = e.x + (e.face > 0 ? 5 : -6); fr(hx, e.y - hy - 13, 2, 9, '#2b1b24'); fr(hx, e.y - hy - 12, 1, 7, '#c98a3a'); }
  if (e.m.crown || e.elite) { const cs = Math.max(1, e.sc - 1); drawSpr(spr('m_crown', MONSPR.crown), e.x, e.y - hy - e.h + 3 * cs, { scale: cs }); }
  if (!e.boss && !e.dead && e.hp < e.maxHp) { const w = 12, x = Math.round(e.x - w / 2), y = Math.round(e.y - hy - e.h - 4); fr(x - 1, y - 1, w + 2, 4, '#2b1b24'); fr(x, y, w, 2, '#5a2030'); fr(x, y, Math.max(1, Math.round(w * e.hp / e.maxHp)), 2, '#ff5a6e'); }
  if (e.stun > 0 && !e.dead) { for (let i = 0; i < 3; i++) { const a = G.time * 6 + i * 2.1; fr(e.x + Math.cos(a) * 6, e.y - hy - e.h - 2 + Math.sin(a) * 2, 1, 1, '#ffd84a'); } }
}
function drawDrop(d) {
  const bob = d.z > 0 ? d.z : Math.sin(d.t * 4) * 1.2 + 1.2;
  shadow(d.x, d.y, 7);
  if (d.kind === 'gold') drawSpr(ispr('coin'), d.x, d.y - bob);
  else if (d.kind === 'food') drawSpr(ispr(FOODS[d.id].icon), d.x, d.y - bob);
  else { const it = ITEMS[d.id]; const col = ['#ffffff', '#6fd0ff', '#d08cff', '#ffd84a', '#ff5a8a', '#7ef0ff'][it.rar]; const a = 0.5 + Math.sin(d.t * 6) * 0.3; ctx.globalAlpha = a; pc(d.x, d.y - bob - 5, 7, col); ctx.globalAlpha = 1; drawSpr(itemSpr(d.id), d.x, d.y - bob); if (Math.floor(d.t * 4) % 3 === 0) fr(d.x + 5, d.y - bob - 10, 1, 1, '#ffffff'); }
}
function drawProj(p) {
  if (p.k === 'nag') { fr(p.x - 1, p.y - 1, 3, 3, '#ffffff'); return; }
  if (p.k === 'balloon') drawSpr(pspr('balloon'), p.x, p.y + 3);
  else if (p.k === 'note') drawSpr(pspr('note'), p.x, p.y + 3);
  else if (p.k === 'tea') drawSpr(pspr('tea'), p.x, p.y + 2);
  else if (p.k === 'card') { ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y)); ctx.rotate(p.rot); ctx.fillStyle = '#2b1b24'; ctx.fillRect(-4, -3, 8, 6); ctx.fillStyle = '#ffffff'; ctx.fillRect(-3, -2, 6, 4); ctx.fillStyle = '#6fb8ff'; ctx.fillRect(-3, 1, 6, 1); ctx.fillStyle = '#ffdcc2'; ctx.fillRect(-2, -1, 2, 2); ctx.restore(); }
  else if (p.k === 'churro') { ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y)); ctx.rotate(p.rot); ctx.fillStyle = '#2b1b24'; ctx.fillRect(-4, -2, 8, 4); ctx.fillStyle = '#c98a3a'; ctx.fillRect(-3, -1, 6, 2); ctx.restore(); }
  else if (p.k === 'confetti') { ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y)); ctx.rotate(p.rot); ctx.fillStyle = '#2b1b24'; ctx.fillRect(-2, -2, 4, 4); ctx.fillStyle = p.col; ctx.fillRect(-1, -1, 2, 2); ctx.restore(); }
}
function drawFx(f) {
  const p = f.t / f.dur, P = G.P;
  switch (f.k) {
    case 'swing': {
      const O = f.ent || P;
      if (f.style === 'punch') {
        const ext = Math.sin(p * Math.PI), side = f.side ? 3 : -3;
        const px = O.x + Math.cos(f.a) * (4 + ext * f.reach * 0.8) + Math.cos(f.a + Math.PI / 2) * side, py = O.y - 9 + Math.sin(f.a) * (4 + ext * f.reach * 0.8) + Math.sin(f.a + Math.PI / 2) * side;
        drawSpr(ispr('fist'), px, py + 3);
        if (ext > 0.7) { const ix = px + Math.cos(f.a) * 4, iy = py + Math.sin(f.a) * 4; fr(ix - 3, iy, 7, 1, '#ffffff'); fr(ix, iy - 3, 1, 7, '#ffffff'); }
      } else {
        const ws = spr('w_' + f.wpn, ICONS[ITEMS[f.wpn].icon]);
        let a, r0 = 3;
        if (f.style === 'poke') { a = f.a; r0 = 2 + Math.sin(p * Math.PI) * 12; }
        else { const e = 1 - Math.pow(1 - p, 2); a = f.side ? f.a - f.arc / 2 + f.arc * e : f.a + f.arc / 2 - f.arc * e; }
        if (f.style !== 'poke') { for (let k = 0; k < 14; k++) { const aa = f.side ? a - k * 0.07 : a + k * 0.07; const al = (1 - k / 14) * (1 - p * 0.5); ctx.fillStyle = `rgba(255,255,255,${al * 0.8})`; ctx.fillRect(Math.round(O.x + Math.cos(aa) * f.reach * 0.85), Math.round(O.y - 9 + Math.sin(aa) * f.reach * 0.85), 1, 1); ctx.fillRect(Math.round(O.x + Math.cos(aa) * f.reach * 0.7), Math.round(O.y - 9 + Math.sin(aa) * f.reach * 0.7), 1, 1); } }
        ctx.save(); ctx.translate(Math.round(O.x), Math.round(O.y - 9)); ctx.rotate(a); ctx.drawImage(ws.n, Math.round(r0), -Math.floor(ws.H / 2)); ctx.restore();
      }
      break;
    }
    case 'slap': { const sc = p < 0.2 ? 1 + p * 5 : 2; ctx.globalAlpha = 1 - Math.max(0, p - 0.5) * 2; drawSpr(ispr('hand'), f.x, f.y + 6 * sc, { scale: Math.round(sc) }); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28, r = 8 + p * 16; fr(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, 2, 2, '#ffd84a'); } ctx.globalAlpha = 1; break; }
    case 'ring': { const r = f.r * (0.3 + 0.7 * Math.sqrt(p)); ctx.globalAlpha = 1 - p; pRingE(f.x, f.y, r, r * 0.65, f.col); pRingE(f.x, f.y, r - 2, (r - 2) * 0.65, f.col); ctx.globalAlpha = 1; break; }
    case 'bite': { ctx.globalAlpha = 1 - p; for (const ox of [-3, 1]) { fr(f.x + ox, f.y - 2, 3, 1, '#ffffff'); fr(f.x + ox + 1, f.y - 1, 1, 1, '#ffffff'); fr(f.x + ox, f.y + 2, 3, 1, '#ffffff'); fr(f.x + ox + 1, f.y + 1, 1, 1, '#ffffff'); } ctx.globalAlpha = 1; break; }
    case 'lvl': { const a = 1 - p; ctx.fillStyle = `rgba(255,240,150,${a * 0.5})`; const w = Math.round(16 * (1 - p * 0.6)); ctx.fillRect(Math.round(f.x - w / 2), Math.round(f.y - 70), w, 70); for (let i = 0; i < 10; i++) fr(f.x + Math.sin(i * 7.3) * 10, f.y - ((f.t * 60 + i * 9) % 60), 1, 2, '#fff6b0'); break; }
    case 'hus': { const a = p < 0.15 ? p / 0.15 : p > 0.8 ? (1 - p) / 0.2 : 1; drawSpr(husSpr(), f.x - (1 - Math.min(1, p * 4)) * 30, f.y, { alpha: a }); break; }
    case 'eat': drawSpr(ispr(f.icon), f.x, f.y - p * 10, { alpha: 1 - p * 0.6 }); break;
    case 'icon': drawSpr(pspr('phone'), f.x, f.y - p * 4, { alpha: 1 - p }); break;
    case 'camera': drawSpr(ispr('camera'), f.x, f.y, { alpha: 1 - p }); break;
    case 'house': drawSpr(ispr('house'), f.x + Math.sin(f.t * 40) * (p < 0.4 ? 1 : 0), f.y - p * 6, { alpha: 1 - Math.max(0, p - 0.6) / 0.4, scale: 2 }); break;
  }
}

// ---------- screen space ----------
function renderScreen() {
  const W = G.world, cw = cv.width, ch = cv.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const [r, g, b, a] = W.tint; ctx.fillStyle = `rgba(${r},${g},${b},${a})`; ctx.fillRect(0, 0, cw, ch);
  ctx.globalCompositeOperation = 'lighter';
  for (const d of W.decor) { if (!d.glow) continue; const [x, y] = W2S(d.x, d.y - 24); if (x < -60 * S || x > cw + 60 * S || y < -60 * S || y > ch + 60 * S) continue; const rg = ctx.createRadialGradient(x, y, 0, x, y, 26 * S); rg.addColorStop(0, hexA(d.glow, W.glowA)); rg.addColorStop(1, hexA(d.glow, 0)); ctx.fillStyle = rg; ctx.fillRect(x - 26 * S, y - 26 * S, 52 * S, 52 * S); }
  if (G.exitOpen) { const [x, y] = W2S(W.gate.x, W.gate.y - 24); const rg = ctx.createRadialGradient(x, y, 0, x, y, 50 * S); rg.addColorStop(0, 'rgba(255,240,170,0.5)'); rg.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = rg; ctx.fillRect(x - 50 * S, y - 50 * S, 100 * S, 100 * S); }
  ctx.globalCompositeOperation = 'source-over';
  const vg = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.75); vg.addColorStop(0, 'rgba(20,0,30,0)'); vg.addColorStop(1, `rgba(20,0,30,${0.35 + a})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, cw, ch);
  if (G.P && G.P.hp < G.st.hp * 0.25 && G.state === 'play') { const pa = 0.25 + Math.sin(G.time * 6) * 0.12; const lg = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.3, cw / 2, ch / 2, Math.max(cw, ch) * 0.7); lg.addColorStop(0, 'rgba(255,0,40,0)'); lg.addColorStop(1, `rgba(255,0,40,${pa})`); ctx.fillStyle = lg; ctx.fillRect(0, 0, cw, ch); }
  const U = S;
  // gate label
  { const [x, y] = W2S(W.gate.x, W.gate.y - 49); if (y > -20 && y < ch + 20) txt(G.zone < 3 ? '→ ' + ZONES[G.zone].next : '탈출구', x, y, U * 4.2, G.exitOpen ? '#7a3a1a' : '#9a8a8a', null, 'center'); }
  if (W.mainGate) { const [x, y] = W2S(W.mainGate.x, W.mainGate.y - 49); if (y < ch + 20) txt('정문 (봉쇄됨)', x, y, U * 4, '#a03040'); }
  // texts
  for (const t of G.texts) {
    const p = t.t / t.dur; const [x, y0] = W2S(t.x, t.y); const y = y0 - p * 14 * U * (t.kind === 'crit' ? 1.2 : 1);
    ctx.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
    const sz = { dmg: 5.5, crit: 8, hurt: 6, heal: 5.5, mana: 5.5, gold: 4.5, food: 4.5, mental: 7 }[t.kind] || 5;
    const col = { dmg: '#ffffff', crit: '#ffd84a', hurt: '#ff5a6e', heal: '#7cf07c', mana: '#7cc8ff', gold: '#ffe066', food: '#ffd1e6', mental: '#ff7ab8' }[t.kind] || '#fff';
    const pop = p < 0.12 ? 1 + (0.12 - p) * 4 : 1;
    txt(t.txt + (t.kind === 'crit' ? '!' : ''), x, y, U * sz * pop, col, '#2b1b24');
  }
  ctx.globalAlpha = 1;
  // nag bubbles
  for (const p of G.projs) if (p.k === 'nag') { const [x, y] = W2S(p.x, p.y); ctx.globalAlpha = Math.min(1, p.life * 4); bubbleBox(p.word, x, y + U * 3, U * 4.4, { noTail: true, bg: '#fff3f8', border: '#d0508a', color: '#c0306a' }); ctx.globalAlpha = 1; }
  // fx words / phone words / level text
  for (const f of G.fx) {
    const p = f.t / f.dur;
    if (f.k === 'word') { const [x, y] = W2S(f.x, f.y - p * 8); ctx.globalAlpha = p > 0.6 ? (1 - p) / 0.4 : 1; const s = p < 0.15 ? 1.4 - p * 2.6 : 1; txt(f.txt, x, y, U * 5 * f.size * s, f.col, '#2b1b24'); ctx.globalAlpha = 1; }
    else if (f.k === 'phone') { const [x, y] = W2S(f.x, f.y - p * 10); ctx.globalAlpha = p > 0.6 ? (1 - p) / 0.4 : Math.min(1, p * 6); txt(f.txt, x, y, U * 3.6, '#ff7ab8', '#ffffff'); ctx.globalAlpha = 1; }
    else if (f.k === 'lvl') { const [x, y] = W2S(f.x, f.y - 36 - p * 10); ctx.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1; txt('LEVEL UP!', x, y, U * 7, '#ffd84a', '#2b1b24'); ctx.globalAlpha = 1; }
  }
  // enemy status
  for (const e of G.enemies) if (e.rival && !e.dead && e.spawnT <= 0) { const [x, y] = W2S(e.x, e.y - 30); txt(e.nick, x, y, U * 3.6, '#ffd1e6', '#2b1b24'); achNameTag(e.snap, x, y, U); }
  if (G.buddy && G.buddy.spawnT <= 0) { const [x, y] = W2S(G.buddy.x, G.buddy.y - 30); txt('🤝' + G.buddy.nick, x, y, U * 3.4, '#d6f5ff', '#2b1b24'); achNameTag(G.buddy.snap, x, y, U); }
  for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; const [x, y] = W2S(e.x, e.y - (e.hopY || 0) - e.h - 6); if (e.mental > 0 || e.confuse > 0) txt(Math.floor(G.time * 3) % 2 ? '@_@' : '?!', x, y, U * 4, '#ff7ab8', '#2b1b24'); else if (e.panic > 0) { txt(Math.floor(G.time * 4) % 2 ? '헉!' : '당황', x, y - Math.abs(Math.sin(G.time * 10)) * U * 2, U * 4.2, '#7ec8ff', '#2b1b24'); const [sx, sy] = W2S(e.x + e.w * 0.4, e.y - e.h * 0.8); ctx.fillStyle = '#9fe8ff'; ctx.fillRect(sx, sy + ((G.time * 30) % 6) * U * 0.5, U * 1.4, U * 2); } else if (e.fear > 0) txt('!!', x, y, U * 4.5, '#ffd84a', '#2b1b24'); }
  // speech bubbles
  for (const b of G.bubbles) {
    const e = b.ent; if (!e) continue; let hy = 26;
    if (e === G.bori) hy = 15; else if (e.h) hy = e.h + (e.hopY || 0) + 4;
    const [x, y] = W2S(e.x, e.y - hy); const p = b.t / b.dur; ctx.globalAlpha = p > 0.85 ? (1 - p) / 0.15 : 1;
    bubbleBox(b.txt, x, y, U * 4.5); ctx.globalAlpha = 1;
  }
  // indicator
  let tgt = null, lab = '';
  if (G.boss && !G.boss.dead) { tgt = G.boss; lab = 'BOSS'; } else if (G.exitOpen) { tgt = { x: W.gate.x, y: W.gate.y - 10 }; lab = '출구'; }
  if (tgt && G.state === 'play') {
    const [x, y] = W2S(tgt.x, tgt.y - 10); const m = 26 * DPR;
    const top = (G.boss ? 160 : 130) * DPR, bot = ch - 200 * DPR;
    if (x < m || x > cw - m || y < top || y > bot) {
      const cxs = cw / 2, cys = ch / 2, a = Math.atan2(y - cys, x - cxs);
      const k = Math.min(Math.abs((cw / 2 - m) / (Math.cos(a) || 1e-6)), Math.abs(((y < cys ? cys - top : bot - cys)) / (Math.sin(a) || 1e-6)));
      const ax = cxs + Math.cos(a) * k, ay = cys + Math.sin(a) * k; const pul = 1 + Math.sin(G.time * 8) * 0.12;
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(a); ctx.scale(pul, pul); ctx.fillStyle = lab === 'BOSS' ? '#ff4d6d' : '#ffd84a'; ctx.strokeStyle = '#2b1b24'; ctx.lineWidth = 3 * DPR; ctx.beginPath(); ctx.moveTo(14 * DPR, 0); ctx.lineTo(-8 * DPR, -10 * DPR); ctx.lineTo(-8 * DPR, 10 * DPR); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
      txt(lab, ax - Math.cos(a) * 22 * DPR, ay - Math.sin(a) * 22 * DPR, 11 * DPR, '#ffffff', '#2b1b24');
    }
  }
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, G.flash * 2.4)})`; ctx.fillRect(0, 0, cw, ch); }
  if (G.ult) drawUlt();
}
function hexA(hex, a) { const c = hex.replace('#', ''); return `rgba(${parseInt(c.slice(0, 2), 16)},${parseInt(c.slice(2, 4), 16)},${parseInt(c.slice(4, 6), 16)},${a})`; }

function drawUlt() {
  const U = G.ult, t = U.t, cw = cv.width, ch = cv.height;
  const a = t < 0.95 ? Math.min(0.72, t / 0.45 * 0.72) : Math.max(0, 0.72 * (1 - (t - 0.95) / (U.dur - 0.95)));
  ctx.fillStyle = `rgba(40,6,56,${a})`; ctx.fillRect(0, 0, cw, ch);
  if (t > 0.95 && t < 1.4) { ctx.strokeStyle = `rgba(255,255,255,${(1.4 - t) * 2})`; ctx.lineWidth = 2 * DPR; for (let i = 0; i < 7; i++) { ctx.beginPath(); let x = cw / 2, y = ch / 2; ctx.moveTo(x, y); const ang = i / 7 * 6.28 + 0.3; for (let k = 0; k < 6; k++) { x += Math.cos(ang + rand(-0.5, 0.5)) * cw * 0.09; y += Math.sin(ang + rand(-0.5, 0.5)) * cw * 0.09; ctx.lineTo(x, y); } ctx.stroke(); } }
  const [hx, hy] = W2S(G.P.x, G.P.y - 12); const rr = S * 70 * (0.7 + Math.sin(t * 12) * 0.08) * Math.min(1, t * 3);
  const rg = ctx.createRadialGradient(hx, hy, 0, hx, hy, rr); rg.addColorStop(0, `rgba(255,120,200,${0.55 * Math.min(1, (U.dur - t) * 2)})`); rg.addColorStop(1, 'rgba(255,120,200,0)'); ctx.fillStyle = rg; ctx.fillRect(hx - rr, hy - rr, rr * 2, rr * 2);
  const base = Math.min(cw, ch);
  if (t < 1.7) { const s = t < 0.22 ? 2.6 - 7 * t : 1; ctx.save(); ctx.globalAlpha = t > 1.35 ? Math.max(0, (1.7 - t) / 0.35) : 1; ctx.translate(cw / 2, ch * 0.3); ctx.scale(s, s); ctx.rotate(-0.06); txt('멘헤라 공격', 0, 0, base * 0.11, '#ff7ab8', '#2a0838'); txt('♥ MENHERA ATTACK ♥', 0, base * 0.085, base * 0.042, '#ffd1e6', '#2a0838'); ctx.restore(); }
  for (const L of U.lines) {
    const lt = t - L.d; if (lt < 0) continue;
    const fade = t > U.dur - 0.5 ? Math.max(0, (U.dur - t) / 0.5) : 1;
    const pop = lt < 0.1 ? lt / 0.1 * 1.25 : (lt < 0.18 ? 1.25 - (lt - 0.1) / 0.08 * 0.25 : 1);
    const fs = base * 0.04; ctx.font = `bold ${Math.round(fs)}px ${FONT}`; const bw = (ctx.measureText(L.txt).width + fs * 1.2) * L.s * 1.05;
    const lx = clamp(L.x * cw, bw / 2 + 6, cw - bw / 2 - 6);
    ctx.save(); ctx.globalAlpha = fade; ctx.translate(lx, L.y * ch); ctx.rotate(L.rot); ctx.scale(pop * L.s, pop * L.s);
    bubbleBox(L.txt, 0, 0, fs, { bg: '#fff0f7', border: '#7a2fc0', color: '#8a1f6a' }); ctx.restore();
  }
}

// ---------- cutscene stage ----------
let CUTK = 1;
function cutScale() { return Math.max(2, Math.floor(Math.min(cv.width / 140, cv.height / 140))); }
function mixHex(a, b, t) { const pa = a.replace('#', ''), pb = b.replace('#', ''); const r = [0, 2, 4].map(i => Math.round(lerp(parseInt(pa.slice(i, i + 2), 16), parseInt(pb.slice(i, i + 2), 16), t))); return '#' + r.map(v => v.toString(16).padStart(2, '0')).join(''); }
function skyBands(SW, gy, top, bot) { for (let y = 0; y < gy; y += 3) fr(0, y, SW, 3, mixHex(top, bot, y / gy)); }
function cloud(x, y, col) { pc(x, y, 5, col); pc(x + 6, y - 2, 6, col); pc(x + 13, y, 5, col); fr(x - 4, y, 22, 4, col); }
function drawPark(SW, SH, mid, gy, dark, withGate, T) {
  skyBands(SW, gy, mixHex('#7ec8f7', '#2a0f3c', dark), mixHex('#d4f0ff', '#8a4ab0', dark));
  if (dark < 0.6) pc(SW - 34, 22, 9, mixHex('#fff3a0', '#d0a0ff', dark)); else { pc(SW - 34, 22, 9, '#e6d0ff'); pc(SW - 30, 19, 8, mixHex('#2a0f3c', '#3a1650', 0.5)); }
  const cc = mixHex('#ffffff', '#6a4a8a', dark);
  for (let i = 0; i < 4; i++) cloud(((i * 83 + T * 4) % (SW + 60)) - 30, 18 + (i % 2) * 16, cc);
  // skyline
  const wall = mixHex('#f3e6ff', '#3a2456', dark), roof = mixHex('#ff8fc8', '#6a2a7a', dark), win = dark > 0.5 ? (Math.floor(T * 3) % 2 ? '#ff4d6d' : '#ff8a5a') : '#9fd8ff';
  const bx = mid - 92;
  fr(bx, gy - 40, 44, 40, wall);
  for (const [tx, tw, th] of [[bx - 6, 12, 54], [bx + 16, 14, 64], [bx + 40, 12, 50]]) { fr(tx, gy - th, tw, th, wall); for (let y = 0; y < 14; y++) { const hw = Math.round(y / 14 * (tw / 2 + 2)); fr(tx + tw / 2 - hw, gy - th - 14 + y, hw * 2, 1, roof); } fr(tx + tw / 2 - 2, gy - th + 8, 4, 6, win); }
  fr(bx + 18, gy - 14, 8, 14, mixHex('#c79aff', '#2a1640', dark));
  const lx = mid + 74, ly = gy - 40; const tr = mixHex('#ff6b8a', '#8a2a4a', dark);
  for (let i = 0; i < 48; i++) { const a = i / 48 * 6.28; fr(lx + Math.cos(a) * 22, ly + Math.sin(a) * 22, 2, 2, tr); }
  for (let x = lx - 60; x < lx + 70; x += 2) { const y = gy - 22 - Math.sin((x - lx) / 18) * 6; fr(x, y, 2, 2, tr); }
  for (const px of [lx - 40, lx - 14, lx + 14, lx + 44]) fr(px, gy - 20, 2, 20, mixHex('#c8c8d8', '#4a3a5a', dark));
  fr(lx - 1, ly + 22, 2, gy - ly - 22, mixHex('#c8c8d8', '#4a3a5a', dark));
  if (dark < 0.5) { for (let i = 0; i < 5; i++) { const x = mid - 40 + i * 30 + Math.sin(T + i) * 3, y = gy - 70 - ((T * 8 + i * 37) % 60); pc(x, y, 3, ['#ff6b8a', '#6fb8ff', '#ffd84a', '#7ccf5a', '#b45cff'][i]); fr(x, y + 3, 1, 5, '#ffffff'); } }
  // hedge + ground
  const hg = mixHex('#4f9a3f', '#2a3a3a', dark);
  for (let x = -4; x < SW + 8; x += 8) pc(x, gy - 2, 5, hg);
  fr(0, gy, SW, SH - gy, mixHex('#ead9b6', '#5a4a6a', dark));
  const ln = mixHex('#d6c39a', '#4a3a5a', dark); for (let y = gy + 4; y < SH; y += 8) fr(0, y, SW, 1, ln); for (let y = gy; y < SH; y += 8) for (let x = ((y / 8) % 2) * 8; x < SW; x += 16) fr(x, y, 1, 8, ln);
  if (withGate) { const img = dGateCached(); ctx.drawImage(img, Math.round(mid + 36 * CUTK - img.width / 2), Math.round(gy + 6 - img.height)); }
}
let GATECACHE = null; function dGateCached() { return GATECACHE || (GATECACHE = dGate(false)); }
function drawHome(SW, SH, mid, gy, T, A) {
  fr(0, 0, SW, gy, '#f6e7d2'); for (let x = 0; x < SW; x += 8) fr(x, 0, 2, gy, '#f0dcc2');
  fr(0, gy - 4, SW, 4, '#c9a27a'); fr(0, gy - 4, SW, 1, '#2b1b24');
  fr(0, gy, SW, SH - gy, '#c8956a'); for (let y = gy + 5; y < SH; y += 6) fr(0, y, SW, 1, '#b07e55'); for (let y = gy; y < SH; y += 6) for (let x = ((y / 6) % 2) * 14; x < SW; x += 28) fr(x, y, 1, 6, '#b07e55');
  const K = CUTK, wx = Math.round(mid + 48 * K), wy = gy - 62; fr(wx - 1, wy - 1, 40, 30, '#2b1b24'); for (let y = 0; y < 28; y++) fr(wx, wy + y, 38, 1, mixHex('#ffb07a', '#ff7ab8', y / 28)); pc(wx + 26, wy + 20, 5, '#fff3a0'); fr(wx + 18, wy, 2, 28, '#ffffff'); fr(wx, wy + 13, 38, 2, '#ffffff'); fr(wx - 6, wy - 3, 7, 34, '#f2a7c3'); fr(wx + 37, wy - 3, 7, 34, '#f2a7c3');
  const fx = Math.round(mid - 30 * K); fr(fx, gy - 58, 22, 18, '#2b1b24'); fr(fx + 1, gy - 57, 20, 16, '#ffffff'); drawSpr(ispr('heart'), fx + 11, gy - 45);
  const sx = Math.round(mid + 4 * K) - 4; fr(sx + 4, gy - 22, 54, 18, '#2b1b24'); fr(sx + 5, gy - 21, 52, 8, '#7a8cb0'); fr(sx + 5, gy - 13, 52, 8, '#8fa2c6'); fr(sx + 1, gy - 18, 6, 14, '#2b1b24'); fr(sx + 2, gy - 17, 4, 12, '#7a8cb0'); fr(sx + 55, gy - 18, 6, 14, '#2b1b24'); fr(sx + 56, gy - 17, 4, 12, '#7a8cb0');
  const dx = Math.round(mid - 96 * K); fr(dx, gy - 50, 26, 50, '#2b1b24'); if (A.door) { fr(dx + 1, gy - 49, 24, 49, '#ffeec8'); fr(dx + 1, gy - 49, 8, 49, '#8a5a3a'); } else { fr(dx + 1, gy - 49, 24, 49, '#a0683e'); fr(dx + 19, gy - 26, 3, 3, '#ffd84a'); }
  const cx2 = Math.round(mid + 56 * K); fr(cx2, gy + 2, 18, 12, '#2b1b24'); fr(cx2 + 1, gy + 3, 16, 4, '#4a8ad0'); fr(cx2 + 1, gy + 7, 16, 6, '#ffffff');
  const tx2 = Math.round(mid + 2 * K); fr(tx2, gy + 6, 14, 8, '#2b1b24'); fr(tx2 + 1, gy + 7, 12, 6, '#5aa845'); fr(tx2 + 5, gy + 5, 4, 2, '#2b1b24');
}
function drawEscape(SW, SH, mid, gy, T) {
  skyBands(SW, gy, '#6a3a9a', '#ffb07a'); pc(mid + 40, gy - 8, 16, '#fff0a0'); pc(mid + 40, gy - 8, 13, '#ffe070');
  for (let i = 0; i < 3; i++) cloud(((i * 97 + T * 3) % (SW + 60)) - 30, 20 + i * 12, '#ffc0d8');
  const sil = '#5a3060';
  fr(mid - 120, gy - 34, 40, 34, sil); fr(mid - 126, gy - 50, 12, 50, sil); fr(mid - 96, gy - 58, 14, 58, sil);
  for (let i = 0; i < 40; i++) { const a = i / 40 * 6.28; fr(mid + 90 + Math.cos(a) * 18, gy - 36 + Math.sin(a) * 18, 2, 2, sil); }
  for (let x = -4; x < SW + 8; x += 8) pc(x, gy - 2, 5, '#4a6a3a');
  fr(0, gy, SW, SH - gy, '#e0c8a0'); for (let y = gy + 4; y < SH; y += 8) fr(0, y, SW, 1, '#cbb08a');
  const img = G.world ? G.world.gateOpen : dGate(true); const gx = Math.round(mid - 80 * CUTK - img.width / 2), gyy = Math.round(gy + 4 - img.height);
  ctx.fillStyle = 'rgba(255,246,190,0.9)'; ctx.fillRect(gx + 12, gyy + 15, 38, 39); ctx.drawImage(img, gx, gyy);
}
function drawStars(SW, SH, T) { fr(0, 0, SW, SH, '#1a0a2a'); for (let i = 0; i < 70; i++) { const x = (i * 97.3) % SW, y = (i * 53.7) % SH; if ((Math.floor(T * 2 + i) % 5) !== 0) fr(x, y, 1, 1, i % 3 ? '#ffffff' : '#ffd1e6'); } }

/** 이름표 위 칭호 (snap.ttl) */
function achNameTag(snap, x, y, U) { const a = snap && snap.ttl && ACH_BY[snap.ttl]; if (a) txt('「' + a.t + '」', x, y - U * 4, U * 3, ACH_COL[a.tier], '#2b1b24'); }
