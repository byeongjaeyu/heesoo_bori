// ===================== EP2 STAGES =====================
function rectHit(r, x, y, pad) { pad = pad || 0; return x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad; }
function pushOut(o, r, rad) { const cx = clamp(o.x, r.x, r.x + r.w), cy = clamp(o.y, r.y, r.y + r.h); const dx = o.x - cx, dy = o.y - cy, d = Math.hypot(dx, dy); if (d < rad) { if (d < 0.01) { o.y = r.y + r.h + rad; return; } o.x = cx + dx / d * rad; o.y = cy + dy / d * rad; } }
function kEdge(S, key, on) { const was = S['_k' + key]; S['_k' + key] = on; return on && !was; }

// ---------- STAGE 1: 우리 집 (킁킁 탐색 + 잠입) ----------
const ST_HOME = {
  name: '우리 집', kind: '킁킁 탐색', bgm: 'home', joy: true,
  how: '왼쪽 화면을 드래그해서 이동해요.<br><b>킁킁 버튼을 꾹</b> 누르면 <b style="color:#3aa04a">초록 고양이 냄새</b>가 단서 쪽으로 이어져요. 따라가서 단서 3개를 찾으세요!<br><b style="color:#e0508a">분홍 시저 냄새</b>는 함정! 가면 시저 간식이 나와서 보리가 먹느라 <b>5초 동안 말을 안 들어요.</b><br>로봇청소기의 <b>노란 시야</b>에 걸리면 처음 자리로 돌아가요. <b>가구 밑</b>에 숨으면 안 들켜요.',
  get btns() { return [{ k: 'atk', label: '킁킁', icon: iconURL('sk_paw', ICONS.paw) }]; },
  after: () => [{ who: 'sys', text: '그때, 로봇청소기가 현관 센서를 툭 건드렸다.\n띠리릭— 현관문이 열렸다!' }, { who: 'bori2', text: '킁킁... 고양이 냄새는 경안천 쪽이야! 멍!' }],
  init() {
    const S = this; S.W = 240; S.H = 300; S.t = 0; S.done = 0; S.catches = 0; S.inv = 0; S.ci = 0; S.msg = null; S.puffs = []; S.pt = 0;
    S.b = { x: 54, y: 250, face: 1, t: 0, idle: 0, moving: false }; S.cp = { x: 54, y: 250 };
    S.solids = [{ x: 104, y: 8, w: 62, h: 22, n: 'counter' }, { x: 10, y: 278, w: 54, h: 12, n: 'tv' }, { x: 196, y: 262, w: 34, h: 26, n: 'shoes' }];
    S.hides = [{ x: 12, y: 36, w: 62, h: 26, n: 'sofa' }, { x: 30, y: 98, w: 40, h: 22, n: 'ctable' }, { x: 150, y: 110, w: 58, h: 36, n: 'table' }, { x: 176, y: 196, w: 52, h: 44, n: 'bed' }];
    S.clues = [{ x: 90, y: 54, n: '고양이 털', s: 'hair' }, { x: 140, y: 44, n: '젖은 발자국', s: 'paw2' }, { x: 214, y: 24, n: '양말 한 짝', s: 'sock' }];
    S.bowl = { x: 22, y: 160, got: false };
    S.snacks = [{ x: 196, y: 64 }, { x: 64, y: 206 }, { x: 150, y: 256 }, { x: 110, y: 120 }]; S.lock = 0; S.trap = 0; S.lockTo = null;
    S.vac = { x: 120, y: 200, a: 0, wi: 0, wp: [[40, 185], [150, 182], [205, 165], [215, 75], [120, 72], [40, 140]], say: 0 };
    S.bg = null;
  },
  makeBg() {
    const S = this, c = mkCanvas(S.W, S.H), g = c.getContext('2d');
    for (let y = 0; y < S.H; y += 6) { g.fillStyle = (y / 6) % 2 ? '#d6a46e' : '#cf9b64'; g.fillRect(0, y, S.W, 6); g.fillStyle = '#b8844e'; g.fillRect(0, y, S.W, 1); for (let x = ((y / 6) % 3) * 17; x < S.W; x += 52) g.fillRect(x, y, 1, 6); }
    pEll(g, 120, 160, 46, 22, '#c8a0d8'); pEll(g, 120, 160, 42, 19, '#e8c8f0'); pRing(g, 120, 160, 30, '#c8a0d8', 2);
    g.fillStyle = '#2b1b24'; g.fillRect(0, 0, S.W, 8); g.fillRect(0, 0, 8, S.H); g.fillRect(S.W - 8, 0, 8, S.H); g.fillRect(0, S.H - 8, S.W, 8);
    g.fillStyle = '#f3e3cc'; g.fillRect(1, 1, S.W - 2, 6); g.fillRect(1, 1, 6, S.H - 2); g.fillRect(S.W - 7, 1, 6, S.H - 2); g.fillRect(1, S.H - 7, S.W - 2, 6);
    g.fillStyle = '#9fe8ff'; g.fillRect(196, 1, 36, 6); g.fillStyle = '#ffffff'; g.fillRect(213, 1, 2, 6);
    g.fillStyle = '#8a5a3a'; g.fillRect(96, S.H - 8, 44, 8); g.fillStyle = '#ffd84a'; g.fillRect(134, S.H - 5, 2, 2);
    for (const r of S.solids) { g.fillStyle = '#2b1b24'; g.fillRect(r.x, r.y, r.w, r.h); g.fillStyle = r.n === 'counter' ? '#e8e8f0' : r.n === 'tv' ? '#3a3a46' : '#a0683e'; g.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2); if (r.n === 'counter') { pCirc(g, r.x + 14, r.y + 11, 5, '#9aa0aa'); pCirc(g, r.x + 30, r.y + 11, 5, '#9aa0aa'); g.fillStyle = '#7ec8ff'; g.fillRect(r.x + 42, r.y + 5, 14, 12); } if (r.n === 'tv') { g.fillStyle = '#6fb8ff'; g.fillRect(r.x + 6, r.y + 3, r.w - 12, 6); } if (r.n === 'shoes') { for (let i = 0; i < 3; i++) { g.fillStyle = ['#ffffff', '#ff7a5a', '#45454f'][i]; g.fillRect(r.x + 4 + i * 9, r.y + 6, 7, 12); } } }
    pCirc(g, 18, 18, 6, '#2b1b24'); pCirc(g, 18, 18, 5, '#5aa845'); pCirc(g, 16, 16, 2, '#7ccf5a');
    S.bg = c;
  },
  inHide(x, y) { return this.hides.some(h => rectHit(h, x, y, -2)); },
  update(dt) {
    const S = this, B = S.b; S.t += dt; B.t += dt; S.inv -= dt; if (S.msg) { S.msg.t += dt; if (S.msg.t > 1.6) S.msg = null; }
    const sniff = INP.atk && !S.done && S.lock <= 0;
    const [mx, my] = moveVec(), mag = Math.hypot(mx, my);
    if (S.lock > 0) { S.lock -= dt; const T = S.lockTo; const dd = Math.hypot(T.x - B.x, T.y - B.y); B.moving = dd > 2; if (B.moving) { moveToward(B, T.x, T.y, 70, dt); B.face = T.x > B.x ? 1 : -1; } B.idle = 0; if (!B.moving && Math.floor(S.lock * 3) !== Math.floor((S.lock + dt) * 3)) sfx('eat'); if (S.lock <= 0) { S.treat = null; S.msg = { s: '다 먹었다! 다시 고양이 냄새 찾기!', t: 0 }; } }
    else if (!sniff && mag > 0.18 && !S.done) { const sp = 62 * Math.min(1, mag); B.x += mx / mag * sp * dt; B.y += my / mag * sp * dt; if (Math.abs(mx) > 0.1) B.face = mx > 0 ? 1 : -1; B.moving = true; B.idle = 0; } else { B.moving = false; B.idle = sniff ? 0 : B.idle + dt; }
    B.x = clamp(B.x, 14, S.W - 14); B.y = clamp(B.y, 18, S.H - 12); for (const r of S.solids) pushOut(B, r, 5);
    if (sniff) { S.pt -= dt; if (S.pt <= 0 && S.ci < 3) { S.pt = 0.1; const c = S.clues[S.ci], a = Math.atan2(c.y - B.y, c.x - B.x), dd = Math.hypot(c.x - B.x, c.y - B.y); const d = rand(6, Math.min(70, dd)); const w = rand(-5, 5); S.puffs.push({ x: B.x + Math.cos(a) * d - Math.sin(a) * w, y: B.y - 3 + Math.sin(a) * d + Math.cos(a) * w, t: 0 }); } if (Math.floor(S.t * 3) !== Math.floor((S.t - dt) * 3)) tone(1300 + Math.random() * 200, 0.03, 'triangle', 0.05); }
    for (const p of S.puffs) p.t += dt; S.puffs = S.puffs.filter(p => p.t < 1.1);
    if (S.ci < 3) { const c = S.clues[S.ci]; if (Math.hypot(c.x - B.x, c.y - B.y) < 10) { S.ci++; S.cp = { x: c.x, y: c.y + 6 }; S.msg = { s: '찾았다! ' + c.n + ` (${S.ci}/3)`, t: 0 }; sfx('ding'); if (S.ci === 3) { S.done = 1; S.doneT = 0; } } }
    if (S.lock <= 0 && !S.done) for (const sn of S.snacks) if (!sn.gone && Math.hypot(sn.x - B.x, sn.y - B.y) < 11) { sn.gone = true; S.trap++; S.lock = 5; S.treat = { x: sn.x + 9, y: sn.y + 6 }; S.lockTo = { x: sn.x - 2, y: sn.y + 6 }; sfx('warn'); }
    if (!S.bowl.got && Math.hypot(S.bowl.x - B.x, S.bowl.y - B.y) < 9) { S.bowl.got = true; S.msg = { s: '언니가 놓고 간 간식! 냠냠', t: 0 }; sfx('eat'); }
    const V = S.vac;
    if (S.done) { S.doneT += dt; moveToward(V, 118, S.H - 16, 60, dt); V.a = Math.atan2(S.H - 16 - V.y, 118 - V.x); if (S.doneT > 2.2) e2End({ ok: true, stars: clamp(3 - S.catches - S.trap + (S.bowl.got ? 1 : 0), 1, 3), text: `들킨 횟수 ${S.catches}번 · 시저에 홀림 ${S.trap}번${S.bowl.got ? ' · 간식 발견!' : ''}` }); return; }
    const tp = V.wp[V.wi]; const da = Math.atan2(tp[1] - V.y, tp[0] - V.x); V.a = V.a + clamp(((da - V.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI, -dt * 4, dt * 4); moveToward(V, tp[0], tp[1], 26 + S.ci * 4, dt); if (Math.hypot(tp[0] - V.x, tp[1] - V.y) < 2) V.wi = (V.wi + 1) % V.wp.length;
    V.say -= dt;
    const vd = Math.hypot(B.x - V.x, B.y - V.y);
    if (S.inv <= 0 && !S.inHide(B.x, B.y - 3) && ((vd < 52 && angDiff(Math.atan2(B.y - V.y, B.x - V.x), V.a) < 0.6) || vd < 9)) {
      S.catches++; S.inv = 1.8; V.say = 1.4; sfx('warn'); tone(1500, 0.08, 'square', 0.08); tone(1500, 0.08, 'square', 0.08, null, 0.12);
      B.x = S.cp.x; B.y = S.cp.y; S.msg = { s: '삐빅! 털뭉치 발견! 처음 자리로...', t: 0 };
    }
  },
  render() {
    const S = this, B = S.b; if (!S.bg) S.makeBg();
    fr(0, 0, EW, EH, '#2b1b24');
    const cx = S.W <= EW ? (S.W - EW) / 2 : clamp(B.x - EW / 2, 0, S.W - EW), cy = S.H <= EH - 20 ? (S.H - EH) / 2 - 10 : clamp(B.y - EH / 2, -24, S.H - EH);
    ctx.save(); ctx.translate(-Math.round(cx), -Math.round(cy));
    ctx.drawImage(S.bg, 0, 0);
    if (!S.bowl.got) drawSpr(s2('bowl'), S.bowl.x, S.bowl.y + 3);
    for (const sn of S.snacks) if (!sn.gone) drawScent(sn.x, sn.y + Math.sin(S.t * 2 + sn.x) * 1.5, 'snack', S.t, 6, false);
    for (const p of S.puffs) { ctx.globalAlpha = 0.8 * (1 - p.t / 1.1); const py = p.y - p.t * 4, r = 2 + Math.floor(p.t * 2); fr(p.x - r, py - r - 1, 1, 2, '#3a9a4a'); fr(p.x + r - 1, py - r - 1, 1, 2, '#3a9a4a'); pc(p.x, py, r, '#7ee08a'); } ctx.globalAlpha = 1;
    const sniff = INP.atk && !S.done && S.lock <= 0;
    S.clues.forEach((c, i) => { if (i < S.ci) return; const d = Math.hypot(c.x - B.x, c.y - B.y); if (i === S.ci && (d < 18 || (sniff && d < 75))) { const a = d < 18 ? 1 : 0.6 + Math.sin(S.t * 8) * 0.3; ctx.globalAlpha = a; pc(c.x, c.y, 6, 'rgba(255,240,150,0.5)'); drawSpr(s2(c.s), c.x, c.y + 3); ctx.globalAlpha = 1; } });
    const V = S.vac; ctx.fillStyle = S.inv > 0 ? 'rgba(255,90,90,0.22)' : 'rgba(255,230,80,0.22)'; ctx.beginPath(); ctx.moveTo(V.x, V.y); ctx.arc(V.x, V.y, 52, V.a - 0.6, V.a + 0.6); ctx.closePath(); ctx.fill();
    const hid = S.inHide(B.x, B.y - 3);
    shadow(B.x, B.y, 12); if (S.treat) drawCaesar(S.treat.x, S.treat.y, S.lock / 5);
    const kind = sniff ? 'runA' : (S.lock > 0 && !B.moving) ? (Math.floor(S.t * 5) % 2 ? 'lie' : 'sit') : b2Kind(B.moving, B.t, B.idle);
    drawB2(kind, B.x, B.y, { flip: B.face < 0 && kind.startsWith('run'), alpha: S.inv > 0 && Math.floor(S.t * 16) % 2 ? 0.4 : 1 }); if (kind === 'lie' && S.lock <= 0) zzz(B.x + 6, B.y - 10, B.t);
    pc(V.x, V.y, 8, '#2b1b24'); pc(V.x, V.y, 7, '#4a4a58'); pc(V.x, V.y, 4, '#6a6f7c'); fr(V.x + Math.cos(V.a) * 5, V.y + Math.sin(V.a) * 5, 2, 2, Math.floor(S.t * 4) % 2 ? '#6fd8ff' : '#2a78c0');
    for (const h of S.hides) { ctx.globalAlpha = hid && rectHit(h, B.x, B.y - 3, -2) ? 0.62 : 1; e2DrawFurniture(h); } ctx.globalAlpha = 1;
    for (const sn of S.snacks) if (!sn.gone && Math.hypot(sn.x - B.x, sn.y - B.y) < 90) e2T(sn.x - cx, sn.y + 13 - cy, '시저 냄새', 3.2, '#ff9fc4', '#2b1b24');
    if (sniff) e2T(B.x - cx, B.y - 18 - cy, '킁킁 고양이 냄새', 4, '#7ee08a', '#2b1b24');
    if (S.lock > 0) e2T(B.x - cx, B.y - 20 - cy, '냠냠♥', 4.2, '#ff9fc4', '#2b1b24');
    if (hid) e2T(B.x - cx, B.y - 20 - cy, '숨는 중', 3.6, '#ffffff', '#2b1b24');
    if (V.say > 0) e2Bubble('삐빅! 털뭉치 발견!', V.x - cx, V.y - 10 - cy, 4);
    ctx.restore();
    const top = e2Top(); e2T(10, top + 6, `단서 ${S.ci}/3`, 5, '#ffd84a', '#2b1b24', 'left'); e2T(10, top + 15, `들킴 ${S.catches}`, 4, '#ffd1e6', '#2b1b24', 'left');
    if (S.msg) { ctx.globalAlpha = S.msg.t > 1.2 ? (1.6 - S.msg.t) / 0.4 : 1; e2T(EW / 2, top + 30, S.msg.s, 5, '#ffffff', '#2b1b24'); ctx.globalAlpha = 1; }
    if (S.t < 5 && !S.done) { ctx.globalAlpha = S.t > 4 ? 5 - S.t : 1; fr(0, EH * 0.36, EW, EH * 0.14, 'rgba(43,27,36,0.72)'); e2T(EW / 2, EH * 0.4, '킁킁 꾹! 초록 = 고양이 냄새', 6, '#7ee08a', '#2b1b24'); e2T(EW / 2, EH * 0.46, '분홍 시저 냄새는 피해! (간식 먹느라 5초 멈춤)', 5, '#ff9fc4', '#2b1b24'); ctx.globalAlpha = 1; }
    if (S.lock > 0) e2Alert(S.lock, top + 22);
  }
};
function e2DrawFurniture(h) {
  const K = '#2b1b24';
  if (h.n === 'sofa') { fr(h.x, h.y, h.w, h.h, K); fr(h.x + 1, h.y + 1, h.w - 2, h.h - 2, '#8fa2c6'); fr(h.x + 1, h.y + 1, h.w - 2, 7, '#7a8cb0'); fr(h.x + 1, h.y + 1, 6, h.h - 2, '#7a8cb0'); fr(h.x + h.w - 7, h.y + 1, 6, h.h - 2, '#7a8cb0'); fr(h.x + 20, h.y + 10, 10, 8, '#ffb3d9'); }
  else if (h.n === 'ctable' || h.n === 'table') { fr(h.x, h.y, h.w, h.h, K); fr(h.x + 1, h.y + 1, h.w - 2, h.h - 2, '#c98a52'); fr(h.x + 2, h.y + 2, h.w - 4, 2, '#e0a868'); if (h.n === 'table') { pc(h.x + 14, h.y + 14, 4, '#ffffff'); pc(h.x + 40, h.y + 20, 4, '#ffffff'); fr(h.x + 24, h.y + 8, 8, 5, '#ff7ab8'); } else { fr(h.x + 8, h.y + 6, 9, 6, '#ffd84a'); } }
  else if (h.n === 'bed') { fr(h.x, h.y, h.w, h.h, K); fr(h.x + 1, h.y + 1, h.w - 2, h.h - 2, '#ffffff'); fr(h.x + 1, h.y + 12, h.w - 2, h.h - 13, '#ffc6dc'); fr(h.x + 6, h.y + 3, 16, 7, '#f0f0f8'); fr(h.x + 28, h.y + 3, 16, 7, '#f0f0f8'); }
}

// ---------- STAGE 2: 경안천 산책로 (러너) ----------
const ST_RUN = {
  name: '경안천 산책로', kind: '러너', bgm: 'field',
  how: '보리가 자동으로 달려요! <b>화면을 탭</b>하면 점프, <b>길게</b> 누르면 높이 점프, 공중에서 한 번 더 탭하면 2단 점프.<br>웅덩이·오리·자전거는 넘고, 낮게 나는 <b>비둘기</b>는 점프하지 말고 지나가요.<br>간식을 모으면 <b>우다다 무적 질주!</b>',
  after: () => [{ who: 'sys', text: '경안천을 따라 한참 달리자, 고소한 냄새가 났다.' }, { who: 'bori2', text: '킁킁... 떡 냄새, 순대 냄새... 그리고 고양이 냄새!\n용인시장이다!' }],
  reward: 'b_knit',
  init() { const S = this; Object.assign(S, { d: 0, speed: 92, by: 0, vy: 0, ground: true, jumps: 0, hold: false, hp: 3, inv: 0, gauge: 0, dashT: 0, obs: [], treats: [], next: 260, nextT: 180, goal: 8000, t: 0, somi: null, somiDone: false, knit: null, knitDone: false, texts: [], parts: [], fin: false }); },
  jump() { const S = this; if (S.ground) { S.vy = 210; S.ground = false; S.jumps = 1; S.hold = true; sfx('swing'); } else if (S.jumps < 2) { S.vy = 190; S.jumps = 2; S.hold = true; sfx('swing'); for (let i = 0; i < 5; i++) S.parts.push({ x: EW * 0.26, y: this.gy - S.by, vx: rand(-30, 10), vy: rand(-10, 20), life: 0.4, max: 0.4, col: '#f0d8b8', sz: 1 }); } },
  ptr(type) { if (type === 'down') this.jump(); else if (type === 'up') this.hold = false; },
  update(dt) {
    const S = this; S.gy = Math.round(EH * (EH > EW ? 0.58 : 0.72)); const bx = EW * 0.26; S.t += dt; S.inv -= dt;
    if (kEdge(S, 'j', INP.atk || !!INP.k.u)) S.jump();
    if (!(INP.atk || INP.k.u) && S._kbHeld) S.hold = false; S._kbHeld = INP.atk || !!INP.k.u;
    const prog = S.d / S.goal; S.speed = (92 + 58 * prog) * (S.dashT > 0 ? 1.6 : 1); if (S.dashT > 0) S.dashT -= dt;
    S.d += S.speed * dt;
    if (!S.ground) { const g = (S.hold && S.vy > 0) ? 360 : 820; S.vy -= g * dt; S.by += S.vy * dt; if (S.by <= 0) { S.by = 0; S.ground = true; S.jumps = 0; S.vy = 0; } }
    if (S.d >= S.next && S.d < S.goal - 300) {
      const pool = [['puddle', 3], ['duck', 2]]; if (S.d > 1400) pool.push(['bike', 2]); if (S.d > 2400) pool.push(['pigeon', 2]);
      const k = wpick(pool); const o = { k, x: S.d + EW + 20, y: 0, w: 18, h: 3, vx: 0 };
      if (k === 'duck') { o.w = 8; o.h = 7; o.vx = 14; } if (k === 'bike') { o.w = 15; o.h = 11; o.vx = 45; } if (k === 'pigeon') { o.w = 8; o.h = 5; o.y = 15 + rand(0, 6); o.vx = 30; }
      S.obs.push(o); S.next += rand(130, 220) * (0.75 + S.speed / 300);
    }
    if (S.d >= S.nextT && S.d < S.goal - 200) { const base = S.d + EW + rand(40, 90); const arc = Math.random() < 0.5; for (let i = 0; i < 3; i++) S.treats.push({ x: base + i * 14, y: arc ? [10, 20, 10][i] : 6, k: choice(['gangjeong', 'persimmon', 'popcorn']) }); S.nextT += rand(160, 280); }
    for (const o of S.obs) { o.x -= o.vx * dt; const sx = bx + (o.x - S.d); if (!o.hit && S.inv <= 0 && S.dashT <= 0 && Math.abs(sx - bx) < (o.w / 2 + 5) && S.by < o.y + o.h && S.by + 9 > o.y) { o.hit = true; S.hp--; S.inv = 1.3; sfx('hurt'); S.texts.push({ x: bx, y: S.gy - S.by - 16, s: '깨갱!', t: 0, col: '#ff6b8a' }); if (S.hp <= 0) { S.fin = true; setTimeout(() => e2End({ ok: false, text: '너무 많이 부딪혔어요...<br>천천히 다시 달려봐요!' }), 500); } } }
    S.obs = S.obs.filter(o => o.x > S.d - 60);
    for (const t of S.treats) { const sx = bx + (t.x - S.d); if (!t.got && Math.abs(sx - bx) < 8 && Math.abs((S.by + 5) - t.y) < 9) { t.got = true; S.gauge += 12; sfx('coin'); if (S.gauge >= 100) { S.gauge = 0; S.dashT = 3; S.texts.push({ x: bx, y: S.gy - 24, s: '우다다다다!', t: 0, col: '#ffd84a' }); sfx('lvl'); } } }
    S.treats = S.treats.filter(t => !t.got && t.x > S.d - 40);
    if (!S.somiDone && prog > 0.33) { S.somiDone = true; S.somi = { t: 0 }; }
    if (S.somi) { S.somi.t += dt; if (S.somi.t > 4.5) S.somi = null; }
    if (!S.knitDone && prog > 0.6) { S.knitDone = true; S.knit = { x: S.d + EW + 30, y: 16 }; }
    if (S.knit) { const sx = bx + (S.knit.x - S.d); if (Math.abs(sx - bx) < 9 && Math.abs(S.by + 5 - S.knit.y) < 11) { S.knit = null; e2Unlock('b_knit'); S.texts.push({ x: bx, y: S.gy - 26, s: '털옷 획득!', t: 0, col: '#ff9fcf' }); } else if (sx < -20) S.knit = null; }
    for (const p of S.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; } S.parts = S.parts.filter(p => p.life > 0);
    for (const t of S.texts) t.t += dt; S.texts = S.texts.filter(t => t.t < 0.9);
    if (S.dashT > 0 && Math.random() < dt * 30) S.parts.push({ x: bx - 6, y: S.gy - S.by - rand(2, 9), vx: -60, vy: 0, life: 0.3, max: 0.3, col: choice(['#ff7ab8', '#ffd84a', '#6fb8ff']), sz: 2 });
    if (S.d >= S.goal && !S.fin) { S.fin = true; e2End({ ok: true, stars: S.hp, text: `남은 하트 ${S.hp}개` }); }
  },
  render() {
    const S = this, gy = S.gy || Math.round(EH * (EH > EW ? 0.58 : 0.72)), bx = EW * 0.26, d = S.d;
    for (let y = 0; y < gy - 40; y += 3) fr(0, y, EW, 3, mixHex('#8fd0ff', '#e8f6ff', y / (gy - 40)));
    for (let i = 0; i < 9; i++) { const w = 26, x = ((i * 47 - d * 0.12) % (EW + 60) + EW + 60) % (EW + 60) - 30, h = 34 + (i * 13) % 22; fr(x, gy - 40 - h, w, h, '#c8d0e0'); for (let yy = gy - 36 - h; yy < gy - 44; yy += 5) for (let xx = x + 3; xx < x + w - 3; xx += 6) fr(xx, yy, 3, 2, '#a8b4c8'); }
    fr(0, gy - 40, EW, 6, '#6cb85a'); fr(0, gy - 34, EW, 16, '#4aa0e0');
    for (let i = 0; i < 18; i++) { const x = ((i * 31 - d * 0.5) % (EW + 30) + EW + 30) % (EW + 30) - 15; fr(x, gy - 30 + (i % 3) * 4, 6, 1, '#bfe8ff'); }
    for (let i = 0; i < 26; i++) { const x = ((i * 19 - d * 0.7) % (EW + 20) + EW + 20) % (EW + 20) - 10, h = 6 + (i * 7) % 8; fr(x, gy - 18 - h, 1, h, '#4f9a3f'); fr(x + 2, gy - 18 - h + 2, 1, h - 2, '#7ccf5a'); }
    fr(0, gy - 18, EW, 18, '#7cc36a'); fr(0, gy, EW, 12, '#c8b89a'); fr(0, gy + 5, EW, 1, '#a89878');
    for (let x = -((d) % 24); x < EW; x += 24) fr(x, gy + 3, 10, 1, '#ffffff');
    fr(0, gy + 12, EW, EH - gy - 12, '#8cc96e'); for (let i = 0; i < 30; i++) { const x = ((i * 23 - d) % (EW + 20) + EW + 20) % (EW + 20) - 10, y = gy + 18 + (i * 37) % Math.max(10, EH - gy - 24); fr(x, y, 1, 1, i % 3 ? '#ffffff' : '#ffd84a'); fr(x - 1, y + 1, 3, 1, '#5aa845'); }
    const sx0 = ((Math.floor(d / 2200) + 1) * 2200 - d) * 0.7 + EW * 0.2; if (sx0 < EW + 20) { fr(sx0, gy - 34, 2, 16, '#6a4a2a'); fr(sx0 - 14, gy - 42, 30, 9, '#2b1b24'); fr(sx0 - 13, gy - 41, 28, 7, '#2a78c0'); e2T(sx0 + 1, gy - 37.5, '경안천', 4, '#ffffff'); }
    for (const t of S.treats) drawSpr(ispr(t.k), bx + (t.x - d), gy - t.y + 4 + Math.round(Math.sin(S.t * 6 + t.x) * 1));
    if (S.knit) { const x = bx + (S.knit.x - d); pc(x, gy - S.knit.y, 7, 'rgba(255,200,230,0.6)'); drawSpr(itemSpr('b_knit'), x, gy - S.knit.y + 4); }
    for (const o of S.obs) { const x = bx + (o.x - d); if (o.k === 'puddle') { pEll(ctx, x, gy + 2, 10, 2, '#2a78c0'); pEll(ctx, x, gy + 2, 8, 1, '#6fb8ff'); } else if (o.k === 'duck') drawSpr(s2('duck'), x, gy + 1 - (Math.floor(S.t * 6) % 2), { flip: true }); else if (o.k === 'bike') drawSpr(s2('bike'), x, gy + 2); else drawSpr(s2('pigeon'), x, gy - o.y + 1 + Math.round(Math.sin(S.t * 14) * 1), { flip: true }); }
    if (S.somi) { const sp = b2Spr(Math.floor(S.t * 10) % 2 ? 'runA' : 'runB', { F: '#ffffff', f: '#d8d8e0', W: '#ffffff', w: '#e8e8f0', Y: '#ffffff', m: '#ffffff' }); const sx = bx - 22 + Math.min(1, S.somi.t) * 4; drawSpr(sp, sx, gy); e2Bubble(S.somi.t < 2.3 ? '보리야! 어디 가?' : '회색 고양이가 시장 쪽으로 갔어!', sx, gy - 14, 4); }
    shadow(bx, gy + 1, 12); const kind = S.ground ? (Math.floor(S.t * (S.speed / 9)) % 2 ? 'runA' : 'runB') : 'runA';
    drawB2(kind, bx, gy - S.by, { alpha: S.inv > 0 && Math.floor(S.t * 16) % 2 ? 0.4 : 1 });
    for (const p of S.parts) { ctx.globalAlpha = p.life / p.max; fr(p.x, p.y, p.sz, p.sz, p.col); } ctx.globalAlpha = 1;
    for (const t of S.texts) { ctx.globalAlpha = 1 - t.t / 0.9; e2T(t.x, t.y - t.t * 10, t.s, 5, t.col, '#2b1b24'); } ctx.globalAlpha = 1;
    const top = e2Top(); e2Hearts(S.hp, 3); e2Bar(S.d / S.goal, top + 16, '#7ee08a', `경안천 ${Math.min(800, Math.floor(S.d / 10))}m / 800m`);
    const w = 50; fr(EW - w - 11, top + 5, w + 2, 5, '#2b1b24'); fr(EW - w - 10, top + 6, Math.round(w * S.gauge / 100), 3, '#ffd84a'); e2T(EW - 10 - w / 2, top + 14, S.dashT > 0 ? '우다다!' : '간식 게이지', 3.4, '#ffffff', '#2b1b24');
    if (S.t < 3) e2T(EW / 2, EH * 0.36, '탭 = 점프!', 6, '#ffffff', '#2b1b24');
  }
};

// ---------- STAGE 3: 용인시장 (애교 리듬게임) ----------
const SONGS3 = [{ name: '반찬가게', bpm: 92, n: 12, awn: '#5aa845', items: ['#7ccf5a', '#ff7a5a', '#ffd84a'] }, { name: '떡집', bpm: 104, n: 15, awn: '#ff7ab8', items: ['#ffffff', '#ff9fcf', '#7ccf5a'] }, { name: '정육점', bpm: 116, n: 18, awn: '#e8414f', items: ['#ff6b6b', '#ffb0a0', '#ffffff'] }];
const NOTE3H = { tap: '탭!', down: '↓쓸기', hold: '꾹 유지', combo: '↑쓸고 연타', bang: '↓쓸고 연타' };
const NOTE3 = { tap: { c: '#ff7ab8', s: '손' }, down: { c: '#6fb8ff', s: '엎드려' }, bang: { c: '#ff9a3c', s: '빵!' }, hold: { c: '#ffd84a', s: '꾹' }, combo: { c: '#b45cff', s: '보리\n주세요' } };
const ST_MARKET = {
  name: '용인시장', kind: '애교 리듬게임', bgm: null,
  how: '오른쪽에서 동그라미가 날아와요. <b>왼쪽 흰 원에 겹치는 순간</b> 화면 아무 데서나:<br>🩷 <b>손</b> → 톡 <b>탭</b><br>🩵 <b>엎드려</b> → 손가락으로 <b>아래로 쓱</b><br>🧡 <b>빵!</b> (곡 중간) → <b>아래로 쓱</b> 쓸고 <b>마구 연타</b> → 보리가 옆으로 데구르르 한 바퀴!<br>💛 <b>꾹</b> → 누른 채로 <b>노란 줄이 끝날 때까지</b> 유지<br>💜 <b>보리 주세요</b> → <b>위로 쓱</b> 올린 다음 <b>마구 연타!</b><br>화면 가운데에 지금 할 동작이 크게 떠요.',
  reward: 'b_pad',
  after: () => [{ who: 'sys', text: '강아지옷 가게 사장님이 보리가 너무 귀엽다며\n「용인시장 강아지패딩」을 입혀주셨다!' }, { who: 'sys', text: '그때, 시장 지붕 위로 무언가를 물고 가는 회색 고양이가 보였다!' }, { who: 'cat', text: '냥? 뭘 보냥. 잡을 수 있으면 잡아보라냥~' }, { who: 'bori2', text: '멍멍!! (내 뼈다구 내놔!!)' }],
  init() { const S = this; S.total = 0; S.score = 0; S.startSong(0); },
  startSong(i) {
    const S = this, sg = SONGS3[i]; S.si = i; S.beat = 60 / sg.bpm; S.st = -2.2; S.lastBeat = -99; S.mash = null; S.anim = { k: 'sit', t: 0 }; S.judge = null; S.inter = 0; S.g = null; S.treats = []; S.spin = 0;
    const R = mulberry(77 + i * 31); const notes = []; let b = 4;
    const pool = i === 0 ? ['tap', 'tap', 'down', 'tap'] : i === 1 ? ['tap', 'down', 'hold', 'tap', 'down'] : ['tap', 'down', 'hold', 'tap', 'down', 'tap'];
    for (let k = 0; k < sg.n; k++) { const type = pool[Math.floor(R() * pool.length)]; const len = type === 'hold' ? 2 : 0; notes.push({ t: b * S.beat, type, len: len * S.beat }); b += type === 'hold' ? 3 : (R() < (0.3 + i * 0.15) ? 1 : 2); }
    const mi = Math.floor(notes.length / 2); notes[mi].type = 'bang'; notes[mi].len = 0; for (let k = mi + 1; k < notes.length; k++) notes[k].t += 2 * S.beat; b += 2;
    b += 1; notes.push({ t: b * S.beat, type: 'combo', len: 0 }); S.notes = notes; S.endT = b * S.beat + 3.2;
  },
  pending() { return this.notes.find(n => !n.done); },
  judgeNote(n, off) { const S = this; const a = Math.abs(off); const g = a < 0.1 ? 'p' : a < 0.25 ? 'g' : 'm'; S.finish(n, g); },
  finish(n, g) {
    const S = this; n.done = true; n.grade = g; const v = g === 'p' ? 1 : g === 'g' ? 0.6 : 0; S.score += v; S.total += 1;
    S.judge = { s: g === 'p' ? '완벽!' : g === 'g' ? '좋아!' : '아쉬워', c: g === 'p' ? '#ffd84a' : g === 'g' ? '#7ee08a' : '#a0a6b0', t: 0 };
    if (g !== 'm') { const sc = [523, 587, 659, 784, 880, 1047]; tone(sc[Math.floor(S.st / S.beat) % sc.length], 0.12, 'square', 0.08); if (g === 'p' || n.type === 'combo') S.treats.push({ t: 0, k: choice(['gangjeong', 'cake', 'persimmon', 'watermelon']) }); }
    else sfx('warn');
  },
  ptr(type, x, y, e) {
    const S = this; if (S.inter > 0 || S.st < -0.5) return;
    if (type === 'down') {
      S.g = { x: e.clientX, y: e.clientY, sw: false };
      if (S.mash) { S.mash.taps++; if (S.mash.kind !== 'bang') S.anim = { k: Math.floor(S.mash.taps) % 2 ? 'standA' : 'standB', t: 0 }; tone(1000 + S.mash.taps * 40, 0.04, 'triangle', 0.08); return; }
      const n = S.pending(); if (!n) return; const off = S.st - n.t;
      if (Math.abs(off) < 0.28) { if (n.type === 'tap') { S.judgeNote(n, off); S.anim = { k: 'paw', t: 0 }; } else if (n.type === 'hold') { n.holding = true; n.sg = Math.abs(off) < 0.1 ? 'p' : 'g'; S.anim = { k: 'sit', t: 0 }; } }
    } else if (type === 'move') {
      if (!S.g || S.g.sw) return; const dy = e.clientY - S.g.y; if (Math.abs(dy) > 26) { S.g.sw = true; S.swipe(dy > 0 ? 'down' : 'up'); }
    } else if (type === 'up') { S.g = null; S.release(); }
  },
  release() { const S = this; const n = S.notes.find(n => n.holding); if (!n) return; n.holding = false; S.finish(n, S.st >= n.t + n.len - 0.18 ? n.sg : 'g'); },
  swipe(dir) {
    const S = this; if (S.mash) return; const n = S.pending(); if (!n) return; const off = S.st - n.t; if (Math.abs(off) > 0.3) return;
    if (dir === 'down' && n.type === 'down') { S.judgeNote(n, off); S.anim = { k: 'lie', t: 0 }; }
    else if (dir === 'down' && n.type === 'bang') { n.done = true; S.mash = { t: 0, taps: 0, off, note: n, kind: 'bang', dur: 1.0 }; S.anim = { k: 'lie', t: 0 }; sfx('pop'); }
    else if (dir === 'up' && n.type === 'combo') { n.done = true; S.mash = { t: 0, taps: 0, off, note: n, kind: 'combo', dur: 1.3 }; S.anim = { k: 'standA', t: 0 }; sfx('ding'); }
  },
  update(dt) {
    const S = this; if (S.inter > 0) { S.inter -= dt; if (S.inter <= 0) S.startSong(S.si + 1); return; }
    const pb = S.st; S.st += dt; if (S.anim) S.anim.t += dt; if (S.judge) S.judge.t += dt;
    const bi = Math.floor(S.st / S.beat); if (bi !== S.lastBeat && S.st > -2) { S.lastBeat = bi; tone(bi % 4 === 0 ? 196 : 262, 0.08, 'triangle', 0.12); if (bi % 2 === 0) noise(0.03, 0.08, 0, 6000); }
    if (kEdge(S, 'sp', INP.atk)) this.ptr('down', 0, 0, { clientX: 0, clientY: 0 }); else if (!INP.atk && S._ksp === false && S._prevSp) { this.release(); }
    S._prevSp = INP.atk;
    if (INP.act.has('kdown')) S.swipe('down'); if (INP.act.has('kup')) S.swipe('up');
    for (const n of S.notes) { if (!n.done && !n.holding && S.st > n.t + 0.3) { S.finish(n, 'm'); } if (n.holding) { S.spin += dt; if (S.st >= n.t + n.len + 0.05) { n.holding = false; S.finish(n, n.sg); } } }
    if (S.mash) { S.mash.t += dt; if (S.mash.t >= S.mash.dur) { const M = S.mash, tp = M.taps, n = M.note; n.done = false; const bang = M.kind === 'bang'; S.finish(n, tp >= (bang ? 5 : 7) ? 'p' : tp >= (bang ? 2 : 3) ? 'g' : 'm'); S.anim = bang ? { k: 'roll', t: 0 } : { k: 'paw', t: 0 }; S.mash = null; if (tp >= (bang ? 5 : 7)) S.judge.s = bang ? '빵! 데구르르 대성공!' : '보리 주세요 대성공!'; if (bang) sfx('slam'); } }
    for (const t of S.treats) t.t += dt; S.treats = S.treats.filter(t => t.t < 0.8);
    if (S.st > S.endT && !S.mash) { if (S.si < 2) { S.inter = 1.6; } else { const acc = S.total ? S.score / S.total : 0; e2End({ ok: true, stars: acc >= 0.85 ? 3 : acc >= 0.6 ? 2 : 1, text: `정확도 ${Math.round(acc * 100)}%` }); } }
  },
  render() {
    const S = this, sg = SONGS3[S.si];
    fr(0, 0, EW, EH, '#f0e0c8'); for (let y = Math.round(EH * 0.62); y < EH; y += 10) for (let x = (y / 10 % 2) * 10; x < EW; x += 20) fr(x, y, 10, 10, '#e4d0b0');
    fr(0, 0, EW, EH * 0.2, '#ffe8c8');
    for (let i = 0; i < 6; i++) { const x = i * 46 - 10; fr(x, EH * 0.06, 40, 10, i % 2 ? '#6fb8ff' : '#ffd84a'); for (let k = 0; k < 5; k++) fr(x + k * 8, EH * 0.06 + 10, 8, 3, (k % 2) ? '#ffffff' : (i % 2 ? '#6fb8ff' : '#ffd84a')); }
    const sy = Math.round(EH * 0.47);
    for (let k = 0; k < Math.ceil(EW / 8); k++) { fr(k * 8, sy - 14, 8, 8, k % 2 ? '#ffffff' : sg.awn); } fr(0, sy - 6, EW, 2, '#2b1b24');
    const mx = Math.round(EW * 0.72); pc(mx, sy - 1, 5, '#2b1b24'); pc(mx, sy - 2, 4, '#ffdcc2'); pc(mx, sy - 6, 4, '#5a3a5a'); fr(mx - 2, sy - 2, 1, 1, '#2b1b24'); fr(mx + 1, sy - 2, 1, 1, '#2b1b24'); fr(mx - 5, sy + 3, 10, 6, '#ff9fcf');
    fr(0, sy + 8, EW, 12, '#2b1b24'); fr(0, sy + 9, EW, 10, '#a0683e'); for (let x = 6; x < EW; x += 12) { fr(x, sy + 4, 8, 5, '#2b1b24'); fr(x + 1, sy + 5, 6, 3, sg.items[(x / 12 | 0) % 3]); }
    e2T(mx, sy - 20, sg.name, 4.6, '#2b1b24', '#ffffff');
    const ly = Math.round(EH * 0.32), jx = 22, AT = 1.9, L = EW - jx - 8;
    fr(0, ly - 11, EW, 22, 'rgba(43,27,36,0.55)'); fr(0, ly - 11, EW, 1, '#2b1b24'); fr(0, ly + 10, EW, 1, '#2b1b24');
    pRingE(jx, ly, 10, 10, '#ffffff'); pRingE(jx, ly, 9, 9, '#ffffff');
    for (const n of S.notes) {
      if (n.done && !n.holding) continue; const x = jx + (n.t - S.st) / AT * L; if (x > EW + 20) continue; const N = NOTE3[n.type];
      if (n.type === 'hold') { const x2 = jx + (n.t + n.len - S.st) / AT * L; fr(Math.max(jx, x), ly - 4, Math.max(0, x2 - Math.max(jx, x)), 8, 'rgba(255,216,74,0.7)'); }
      const hx = n.holding ? jx : x; const r = n.type === 'combo' ? 12 : 10; pc(hx, ly, r + 1, '#2b1b24'); pc(hx, ly, r, N.c); pc(hx - 3, ly - 3, 2, 'rgba(255,255,255,0.6)');
      e2T(hx, ly + (n.type === 'combo' ? -3 : 0), N.s.split('\n')[0], n.type === 'combo' ? 4 : 6, '#ffffff', '#2b1b24'); if (n.type === 'combo') e2T(hx, ly + 4, '주세요', 4, '#ffffff', '#2b1b24');
      e2T(hx, ly + r + 7, NOTE3H[n.type], 3.8, N.c, '#2b1b24');
    }
    const bxx = Math.round(EW * 0.34), byy = Math.round(EH * 0.86), sc = Math.max(2, Math.min(4, Math.floor(EH / 70)));
    let k = S.anim && S.anim.t < 0.35 ? S.anim.k : 'sit'; if (S.mash && S.mash.kind !== 'bang') k = Math.floor(S.mash.t * 10) % 2 ? 'standA' : 'standB'; if (S.notes.some(n => n.holding)) k = 'sit';
    const spinFlip = S.notes.some(n => n.holding) && Math.floor(S.st * 8) % 2;
    const rolling = (S.mash && S.mash.kind === 'bang') || (S.anim && S.anim.k === 'roll' && S.anim.t < 0.7);
    shadow(bxx, byy, 12 * sc);
    if (rolling) drawB2Roll(S.mash ? S.mash.taps * 0.2 : S.anim.t / 0.7, bxx, byy, sc);
    else drawB2(k === 'roll' ? 'sit' : k, bxx, byy - (S.anim && S.anim.k === 'paw' && S.anim.t < 0.2 ? 2 : 0), { scale: sc, flip: !!spinFlip });
    for (const t of S.treats) { const p = t.t / 0.8; drawSpr(ispr(t.k), lerp(mx, bxx, p), lerp(sy, byy - 20 * sc, p) - Math.sin(p * Math.PI) * 30); }
    if (S.judge && S.judge.t < 0.7) e2T(jx + 34, ly - 20, S.judge.s, 5.5, S.judge.c, '#2b1b24');
    const pn = S.pending(); const hn = S.notes.find(n => n.holding);
    if (!S.mash && S.inter <= 0) { let cue = null; if (hn) cue = ['꾹 누르고 있어!', '#ffd84a']; else if (pn && pn.t - S.st < 0.7 && pn.t - S.st > -0.25) cue = { tap: ['지금 탭!', '#ff7ab8'], down: ['엎드려! 아래로 쓸어!', '#6fb8ff'], hold: ['꾹 눌러!', '#ffd84a'], combo: ['위로 쓸어 올려!', '#b45cff'], bang: ['빵! 아래로 쓸고 연타!', '#ff9a3c'] }[pn.type]; if (cue) e2T(EW / 2, EH * 0.62, cue[0], 7.5, cue[1], '#ffffff'); }
    if (S.si === 0) { fr(0, ly + 24, EW, 12, 'rgba(255,255,255,0.85)'); e2T(EW / 2, ly + 30, '손=탭 · 엎드려=↓쓸기 · 빵=↓쓸고 연타 · 꾹=누르기 · 보리주세요=↑쓸고 연타', 3.3, '#2b1b24'); }
    if (S.mash) { e2T(EW / 2, EH * 0.58, S.mash.kind === 'bang' ? '빵! 마구 연타! 데구르르!' : '마구 연타! 싹싹싹!', 7, S.mash.kind === 'bang' ? '#ff9a3c' : '#ff7ab8', '#2b1b24'); e2T(EW / 2, EH * 0.58 + 10, `${S.mash.taps}`, 6, '#ffffff', '#2b1b24'); }
    const top = e2Top(); e2T(10, top + 6, `${S.si + 1}/3 ${sg.name}`, 5, '#2b1b24', '#ffffff', 'left'); e2T(10, top + 15, `정확도 ${S.total ? Math.round(S.score / S.total * 100) : 100}%`, 4.2, '#2b1b24', '#ffffff', 'left');
    if (S.st < 0) e2T(EW / 2, EH * 0.58, S.st < -1.4 ? sg.name + ' 앞에서 애교 타임!' : String(Math.ceil(-S.st * 1.5)), 7, '#ff7ab8', '#ffffff');
    if (S.inter > 0) e2T(EW / 2, EH * 0.58, '다음 가게로!', 8, '#ff7ab8', '#ffffff');
  }
};

// ---------- STAGE 4: 냥갱 추격전 (보스) ----------
const ST_CAT = {
  name: '시장 지붕 · 냥갱', kind: '보스전', bgm: 'boss', joy: true,
  how: '왼쪽 드래그로 이동, <b>물기</b>로 공격! <b>멍멍!</b>은 주변 기절, <b>우다다</b>는 무적 대시.<br><b>빨간 줄</b>이 보이면 냥갱이 그 방향으로 덮쳐와요. <b>옆으로 비켜서</b> 피하세요!<br>덮치고 나면 냥갱이 <b>헉헉 지쳐서</b> 멈춰요. 그때 달려가서 <b>마구 물기!</b><br>애교 게이지가 꽉 차면 궁극기 <b>「보리 주세요」</b>!',
  get btns() { return ARENA_BTNS(); },
  after: () => [{ who: 'cat', text: '그, 그만! 항복이다냥...' }, { who: 'cat', text: '뼈다구는 내가 안 가져갔다냥! 나는 양말만 모은다냥.' }, { who: 'cat', text: '애견카페 녀석들이 신나서 물고 가는 걸 봤다냥.\n...따라와라냥. 길 알려주겠다냥.' }, { who: 'sys', text: '냥갱이 동료가 되었다!' }],
  init() {
    const S = this; const top = e2Top();
    S.A = { x0: 12, x1: EW - 12, y0: top + 44, y1: EH - 10, b: arenaBori(EW * 0.3, EH * 0.72), projs: [], fx: [], parts: [], texts: [], shake: 0, say: { s: '잡아보라냥~', t: 0, who: 'c' } };
    S.A.boss = { x: EW * 0.68, y: EH * 0.45, hp: 90, max: 90, r: 7, h: 10, col: '#a0a6b0', st: 'prowl', stT: 1.6, face: -1, t: 0, flash: 0, stun: 0, ang: 0 };
    S.A.onUlt = () => e2UltStart(() => { const T = S.A.boss; T.hp = Math.max(0, T.hp - Math.round(25 * e2Bmul())); T.stun = 3; T.flash = 0.2; S.A.say = { s: '냐, 냐앙...♥', t: 0, who: 'c' }; });
    S.bg = null; S.done = false; S.nh = 9; S.heart = null;
  },
  resize() { this.bg = null; const A = this.A; if (A) { A.x1 = EW - 12; A.y1 = EH - 10; } },
  update(dt) {
    const S = this, A = S.A, T = A.boss, B = A.b; if (S.done) { arenaFx(A, dt); return; }
    arenaUpdateBori(A, dt, () => true); arenaFx(A, dt); if (A.dead) return;
    T.t += dt; T.flash -= dt; const enr = T.hp < 45, sp = enr ? 1.12 : 1;
    if (T.stun > 0) { T.stun -= dt; }
    else {
      T.stT -= dt;
      if (T.st === 'prowl') { T.ang += dt * 1.3 * sp; const tx = B.x + Math.cos(T.ang) * 52, ty = B.y + Math.sin(T.ang) * 36; moveToward(T, clamp(tx, A.x0, A.x1), clamp(ty, A.y0, A.y1), 70 * sp, dt); if (T.stT <= 0) { const r = Math.random(); if (r < 0.5) { T.st = 'tele'; T.stT = 0.9; const a = Math.atan2(B.y - T.y, B.x - T.x); T.dx = Math.cos(a); T.dy = Math.sin(a); A.fx.push({ k: 'line', x0: Math.min(T.x, T.x + T.dx * 80), x1: Math.max(T.x, T.x + T.dx * 80), y: T.y - 3, w: 5, t: 0, dur: 0.9 }); A.tele = { x: T.x, y: T.y, a, t: 0 }; } else if (r < 0.85) { T.st = 'sock'; T.stT = 0.5; } else { T.st = 'vanish'; T.stT = 0.4; } } }
      else if (T.st === 'tele') { if (T.stT <= 0) { T.st = 'pounce'; T.stT = 0.45; A.tele = null; } }
      else if (T.st === 'pounce') { T.x += T.dx * 165 * sp * dt; T.y += T.dy * 165 * sp * dt; T.face = T.dx > 0 ? 1 : -1; if (T.stT <= 0) { T.st = 'tired'; T.stT = 1.6; A.say = { s: '헉헉... 지쳤다냥', t: 0, who: 'c' }; } }
      else if (T.st === 'tired') { if (T.stT <= 0) { T.st = 'prowl'; T.stT = rand(1.6, 2.4) / sp; } }
      else if (T.st === 'sock') { if (T.stT <= 0) { const n = enr ? 4 : 3, a0 = Math.atan2(B.y - T.y, B.x - T.x); for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * 0.34; A.projs.push({ x: T.x, y: T.y - 5, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, life: 3, rot: 0 }); } sfx('pop'); T.st = 'prowl'; T.stT = rand(1.6, 2.4) / sp; if (Math.random() < 0.4) A.say = { s: choice(['양말 받아라냥!', '냥냥펀치!', '느리다냥~']), t: 0, who: 'c' }; } }
      else if (T.st === 'vanish') { if (T.stT <= 0) { for (let i = 0; i < 10; i++) A.parts.push({ x: T.x, y: T.y - 5, vx: rand(-40, 40), vy: rand(-40, 10), life: 0.4, max: 0.4, col: '#ffffff', sz: 2 }); let k = 0; do { T.x = rand(A.x0 + 10, A.x1 - 10); T.y = rand(A.y0 + 10, A.y1 - 10); k++; } while (Math.hypot(T.x - B.x, T.y - B.y) < 70 && k < 20); sfx('pop'); T.st = 'prowl'; T.stT = 1.2; } }
      T.x = clamp(T.x, A.x0, A.x1); T.y = clamp(T.y, A.y0, A.y1); if (T.st === 'prowl') T.face = B.x > T.x ? 1 : -1;
      if (Math.hypot(T.x - B.x, T.y - B.y) < 10 && T.st === 'pounce') arenaHurt(A);
    }
    for (const p of A.projs) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.rot += dt * 10; if (Math.hypot(p.x - B.x, p.y - (B.y - 5)) < 4.5) { p.life = 0; arenaHurt(A); } if (p.x < 0 || p.x > EW || p.y < 0 || p.y > EH) p.life = 0; } A.projs = A.projs.filter(p => p.life > 0);
    S.nh = (S.nh == null ? 9 : S.nh) - dt; if (S.nh <= 0) { S.nh = 10; S.heart = { x: rand(A.x0 + 10, A.x1 - 10), y: rand(A.y0 + 10, A.y1 - 10) }; } if (S.heart && Math.hypot(S.heart.x - B.x, S.heart.y - B.y) < 9) { S.heart = null; if (B.hp < B.max) B.hp++; sfx('eat'); A.texts.push({ x: B.x, y: B.y - 16, s: '보리 테라피♥', t: 0, col: '#ff9fcf' }); }
    if (T.hp <= 0 && !S.done) { S.done = true; A.say = { s: '항복이다냥~!', t: 0, who: 'c' }; sfx('open'); setTimeout(() => e2End({ ok: true, stars: B.hp >= 4 ? 3 : B.hp >= 2 ? 2 : 1, text: `남은 하트 ${B.hp}개` }), 1200); }
  },
  render() {
    const S = this, A = S.A, T = A.boss;
    if (!S.bg) { const c = mkCanvas(Math.ceil(EW), Math.ceil(EH)), g = c.getContext('2d'); g.fillStyle = '#a8603a'; g.fillRect(0, 0, c.width, c.height); for (let y = 0; y < c.height; y += 6) { const off = (y / 6) % 2 ? 6 : 0; for (let x = -off; x < c.width; x += 12) { g.fillStyle = '#2b1b24'; g.fillRect(x, y, 12, 6); g.fillStyle = (x + y) % 5 ? '#d27a4a' : '#c46a3e'; g.fillRect(x + 1, y + 1, 10, 4); g.fillStyle = '#e8925e'; g.fillRect(x + 2, y + 1, 8, 1); } } g.fillStyle = '#5a3a2a'; g.fillRect(0, A.y0 - 8, c.width, 4); pRect(g, c.width - 40, A.y0 + 6, 14, 22, '#2b1b24'); pRect(g, c.width - 39, A.y0 + 7, 12, 20, '#9a5a4a'); S.bg = c; }
    ctx.save(); if (A.shake > 0) ctx.translate(rand(-A.shake, A.shake), rand(-A.shake, A.shake));
    fr(0, 0, EW, EH, '#2b1b24'); ctx.drawImage(S.bg, 0, 0);
    arenaDrawCommon(A);
    if (S.heart) drawSpr(ispr('heart'), S.heart.x, S.heart.y + Math.sin(A.b.t * 5));
    for (const p of A.projs) { ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y)); ctx.rotate(p.rot); ctx.drawImage(s2('sock').n, -2, -3); ctx.restore(); }
    const L = [{ y: A.b.y, f: () => arenaDrawBori(A) }, { y: T.y, f: () => { shadow(T.x, T.y, 14); drawSpr(s2('cat'), T.x, T.y, { flip: T.face < 0, white: T.flash > 0 }); if (T.stun > 0) for (let i = 0; i < 3; i++) { const a = A.b.t * 6 + i * 2.1; fr(T.x + Math.cos(a) * 6, T.y - 13 + Math.sin(a) * 2, 1, 1, '#ffd84a'); } if (S.done) drawSpr(s2('sock'), T.x + 8, T.y - 2); if (T.st === 'tired') { fr(T.x + 6, T.y - 13 + (A.b.t * 20 % 4), 1, 2, '#9fe8ff'); } } }];
    L.sort((a, b) => a.y - b.y); for (const o of L) o.f();
    ctx.restore(); arenaHUD(A, '양말 도둑 냥갱');
  }
};

// ---------- STAGE 5: 애견카페 (경주 + 줄다리기) ----------
const ST_CAFE = {
  name: '애견카페', kind: '경주 + 줄다리기', bgm: 'boss',
  how: '<b>① 우다다 경주</b> 화면 <b>왼쪽·오른쪽을 번갈아</b> 탭해서 달려요! 같은 쪽을 두 번 누르면 미끌.<br>"참아!"가 뜨면 잠깐 손을 떼요 (공에 정신 팔림 주의)<br><b>② 줄다리기</b> 마구 연타! 단, <b>"흔들기!"</b> 중에는 손을 떼요.',
  after: () => [{ who: 'sys', text: '줄다리기에서 이겨 뼈다구를 되찾은 그 순간!' }, { who: 'sys', text: '지나가던 리트리버가 뼈다구를 낚아채\n동물병원 쪽으로 뻥— 차버렸다!' }, { who: 'bori2', text: '안 돼애애애애!!!' }, { who: 'cat', text: '...뛰어라냥.' }],
  init() { Object.assign(this, { mode: 'race', bd: 0, cd: 0, bv: 0, cv: 80, last: null, slip: 0, chase: 0, distract: null, nextD: 3.2, goal: 1100, raceWon: null, t: 0, p: 0, shk: 0, shkPhase: 'none', nextShk: 2.5, tugT: 0, texts: [], modeT: 0 }); },
  tap(side) {
    const S = this;
    if (S.mode === 'race') {
      if (S.distract && S.distract.t < S.distract.dur) { S.chase = 1.0; S.distract.t = 99; S.texts.push({ s: '앗 공이다!', t: 0, c: '#ffd84a' }); sfx('warn'); return; }
      if (S.slip > 0 || S.chase > 0) return;
      if (side === S.last) { S.slip = 0.45; S.bv *= 0.4; S.texts.push({ s: '미끌!', t: 0, c: '#9fe8ff' }); sfx('warn'); } else { S.bv = Math.min(150, S.bv + 21); tone(side === 'L' ? 660 : 784, 0.04, 'square', 0.05); }
      S.last = side;
    } else if (S.mode === 'tug') {
      if (S.shkPhase === 'shake') { S.p += 0.05; S.texts.push({ s: '놓쳐!', t: 0, c: '#ff6b8a' }); } else { S.p -= 0.045; tone(500 + Math.random() * 300, 0.03, 'square', 0.04); }
    }
  },
  ptr(type, x) { if (type === 'down') this.tap(x < EW / 2 ? 'L' : 'R'); },
  update(dt) {
    const S = this; S.t += dt; S.modeT += dt; for (const t of S.texts) t.t += dt; S.texts = S.texts.filter(t => t.t < 0.8);
    if (kEdge(S, 'l', !!INP.k.l)) S.tap('L'); if (kEdge(S, 'r', !!INP.k.r)) S.tap('R'); if (kEdge(S, 'sp', INP.atk)) S.tap(S.last === 'L' ? 'R' : 'L');
    if (S.mode === 'race') {
      S.slip -= dt; S.chase -= dt; S.bv = Math.max(0, S.bv - 52 * dt); if (S.chase <= 0) S.bd += S.bv * dt;
      S.cv = lerp(S.cv, 78 + Math.sin(S.t * 0.7) * 16, dt); S.cd += S.cv * dt;
      S.nextD -= dt; if (S.nextD <= 0 && !S.distract) { S.distract = { t: 0, dur: 1.2, k: choice(['ball', 'treat']) }; S.nextD = rand(3.5, 5.5); }
      if (S.distract) { S.distract.t += dt; if (S.distract.t > S.distract.dur + 0.3) S.distract = null; }
      if (S.raceWon == null && (S.bd >= S.goal || S.cd >= S.goal)) { S.raceWon = S.bd >= S.goal; S.texts.push({ s: S.raceWon ? '보리 승리!' : '식빵 승리...', t: 0, c: S.raceWon ? '#ffd84a' : '#a0a6b0' }); sfx(S.raceWon ? 'lvl' : 'warn'); S.modeT = 0; S.mode = 'raceEnd'; }
    } else if (S.mode === 'raceEnd') { if (S.modeT > 1.8) { S.mode = 'tug'; S.modeT = 0; } }
    else if (S.mode === 'tug') {
      S.tugT += dt; S.nextShk -= dt;
      if (S.shkPhase === 'none' && S.nextShk <= 0) { S.shkPhase = 'warn'; S.shk = 0.6; }
      else if (S.shkPhase === 'warn') { S.shk -= dt; if (S.shk <= 0) { S.shkPhase = 'shake'; S.shk = 1.0; } }
      else if (S.shkPhase === 'shake') { S.shk -= dt; S.p += 0.2 * dt; if (S.shk <= 0) { S.shkPhase = 'none'; S.nextShk = rand(2.2, 3.6); } }
      S.p += (0.14 + S.tugT * 0.004) * dt;
      if (S.p <= -1) { S.mode = 'done'; sfx('lvl'); setTimeout(() => e2End({ ok: true, stars: 1 + (S.raceWon ? 1 : 0) + (S.tugT < 14 ? 1 : 0), text: `경주 ${S.raceWon ? '승리' : '패배'} · 줄다리기 ${S.tugT.toFixed(1)}초` }), 900); }
      if (S.p >= 1) { S.mode = 'done'; setTimeout(() => e2End({ ok: false, text: '식빵이 너무 세요...<br>"흔들기!" 때 손을 떼는 게 포인트!' }), 600); }
    }
  },
  render() {
    const S = this; fr(0, 0, EW, EH, '#ffe8f0'); for (let y = 0; y < EH * 0.55; y += 14) for (let x = ((y / 14) % 2) * 14; x < EW; x += 28) { fr(x + 4, y + 4, 2, 2, '#ffc6dc'); fr(x + 8, y + 4, 2, 2, '#ffc6dc'); fr(x + 5, y + 7, 4, 3, '#ffc6dc'); }
    const gy = Math.round(EH * 0.62); fr(0, gy - 30, EW, EH - gy + 30, '#e0b080'); for (let y = gy - 30; y < EH; y += 6) fr(0, y, EW, 1, '#c89a6a');
    e2T(EW / 2, e2Top() + 10, S.mode === 'tug' || S.mode === 'done' ? '② 뼈다구 줄다리기' : '① 우다다 경주 vs 식빵', 5, '#c0306a', '#ffffff');
    if (S.mode === 'race' || S.mode === 'raceEnd') {
      const camx = Math.min(S.bd, S.cd) - EW * 0.18; const y1 = gy - 14, y2 = gy + 6; const bsx = S.bd - camx;
      for (const yy of [y1, y2]) fr(0, yy + 2, EW, 1, '#b07e55');
      const fx = S.goal - camx; if (fx < EW + 10) { for (let k = 0; k < 8; k++) fr(fx, gy - 30 + k * 6, 3, 3, k % 2 ? '#2b1b24' : '#ffffff'); fr(fx + 3, gy - 30, 3, 3, '#2b1b24'); }
      const cx = S.cd - camx; if (cx < EW + 8) drawSpr(s2('corgi'), cx, y1, {}); else e2T(EW - 14, y1 - 6, '식빵 ▶', 4.4, '#ff9a3c', '#ffffff'); if (bsx < EW + 8) drawB2(S.chase > 0 ? 'sit' : (S.bv > 5 ? (Math.floor(S.t * (4 + S.bv / 12)) % 2 ? 'runA' : 'runB') : 'sit'), bsx, y2, { flip: S.chase > 0 }); else e2T(EW - 14, y2 - 6, '보리 ▶', 4.4, '#ff7ab8', '#ffffff'); e2T(18, y1 - 12, '식빵', 3.6, '#a0602a', '#ffffff'); e2T(18, y2 - 12, '보리', 3.6, '#c0306a', '#ffffff');
      if (S.distract && S.distract.t < S.distract.dur) { const dx = Math.min(EW - 10, bsx + 26); if (S.distract.k === 'ball') { pc(dx, y2 - 14, 4, '#2b1b24'); pc(dx, y2 - 14, 3, '#7ccf5a'); } else drawSpr(ispr('gangjeong'), dx, y2 - 10); e2T(EW / 2, EH * 0.4, '참아!', 9, '#ff6b8a', '#ffffff'); }
      e2Bar(S.bd / S.goal, e2Top() + 20, '#ff9fcf', `보리 ${Math.floor(S.bd / 10)}m`); const w = Math.min(EW - 80, 140), x = (EW - w) / 2; fr(x + Math.round(w * clamp(S.cd / S.goal, 0, 1)) - 1, e2Top() + 17, 2, 10, '#ff9a3c');
      if (S.mode === 'race') { const nx = S.last === 'L' ? 'R' : 'L'; for (const sd of ['L', 'R']) { const x0 = sd === 'L' ? 6 : EW / 2 + 3, ww = EW / 2 - 9, y0 = EH - 34; ctx.fillStyle = sd === nx ? 'rgba(255,122,184,0.55)' : 'rgba(255,255,255,0.35)'; ctx.fillRect(x0, y0, ww, 26); e2T(x0 + ww / 2, y0 + 13, sd === 'L' ? '왼발' : '오른발', 6, '#ffffff', '#2b1b24'); } }
    } else {
      const cy = gy - 4, mx = EW / 2 + S.p * (EW * 0.32);
      fr(EW * 0.18 - 1, cy - 16, 2, 20, '#ff7ab8'); fr(EW * 0.82 - 1, cy - 16, 2, 20, '#ff9a3c'); e2T(EW * 0.18, cy - 20, '보리 승리선', 3.4, '#c0306a', '#ffffff'); e2T(EW * 0.82, cy - 20, '식빵 승리선', 3.4, '#a0602a', '#ffffff');
      const shake = S.shkPhase === 'shake' ? Math.round(Math.sin(S.t * 50) * 2) : 0;
      fr(EW * 0.16, cy - 5 + shake, EW * 0.68, 2, '#c8a070'); drawSpr(spr('t_toy_bone', ICONS.tbone), mx, cy - 2 + shake, { scale: 2 });
      drawB2(Math.floor(S.t * 6) % 2 ? 'runA' : 'runB', mx - 22 - EW * 0.04, cy + 6, { noToy: true }); drawSpr(s2('corgi'), mx + 22 + EW * 0.04, cy + 6 + shake, { flip: true });
      if (S.shkPhase === 'warn') e2T(EW / 2, EH * 0.36, '흔들기 온다!', 8, '#ff9a3c', '#ffffff'); else if (S.shkPhase === 'shake') e2T(EW / 2, EH * 0.36, '흔들기! 손 떼!', 9, '#ff4d6d', '#ffffff'); else if (S.mode === 'tug') e2T(EW / 2, EH * 0.36, '마구 연타!', 9, '#ff7ab8', '#ffffff');
    }
    for (const t of S.texts) { ctx.globalAlpha = 1 - t.t / 0.8; e2T(EW * 0.3, gy - 30 - t.t * 12, t.s, 6, t.c, '#2b1b24'); } ctx.globalAlpha = 1;
  }
};

// ---------- STAGE 6: 동물병원 (피하기) ----------
const ST_VET = {
  name: '동물병원', kind: '진료대 탈출', bgm: 'boss',
  how: '화면을 <b>드래그</b>하면 보리가 따라 움직여요. 공격은 없어요, <b>30초만 버티기!</b><br>주사기·체온계·솜방망이를 피하세요. <b>넥카라</b>에 맞으면 앞이 잘 안 보여요.<br>바닥에 <b>체중계</b>가 생기면 밟지 마세요! 하트를 먹으면 회복.',
  reward: 'toy_bone',
  after: () => [{ who: 'nurse', text: '어머, 보리 아니야? 혹시... 이거 찾고 있었니?' }, { who: 'sys', text: '간호사 선생님이 뼈다구장난감을 돌려주셨다!\n(뼈다구장난감 획득 · 바로 입에 꼬옥)' }, { who: 'bori2', text: '앙! (꼬옥)' }, { who: 'cat', text: '언니라는 사람은 저수지 낚시터에 있다냥.\n서두르라냥!' }],
  init() { const top = e2Top(); Object.assign(this, { b: { x: EW / 2, y: EH * 0.62, hp: 3, inv: 0, t: 0, frz: 0, face: 1, moving: false, idle: 0 }, time: 30, objs: [], tiles: [], hearts: [], sp: 0.9, dark: 0, drag: null, nh: 8, nt: 5, texts: [], done: false, x0: 10, x1: EW - 10, y0: top + 30, y1: EH - 8 }); },
  ptr(type, x, y, e) { const S = this; if (type === 'down') S.drag = { x: e.clientX, y: e.clientY }; else if (type === 'move' && S.drag) { if (S.b.frz <= 0) { const dx = (e.clientX - S.drag.x) * DPR / ES * 1.15, dy = (e.clientY - S.drag.y) * DPR / ES * 1.15; S.b.x += dx; S.b.y += dy; if (Math.abs(dx) > 0.3) S.b.face = dx > 0 ? 1 : -1; S.b.moving = true; S.b.idle = 0; } S.drag = { x: e.clientX, y: e.clientY }; } else if (type === 'up') S.drag = null; },
  update(dt) {
    const S = this, B = S.b; if (S.done) return; B.t += dt; B.inv -= dt; B.frz -= dt; S.dark -= dt;
    const [mx, my] = moveVec(); if (Math.hypot(mx, my) > 0.2 && B.frz <= 0) { B.x += mx * 80 * dt; B.y += my * 80 * dt; B.moving = true; B.idle = 0; if (Math.abs(mx) > 0.1) B.face = mx > 0 ? 1 : -1; } else if (!S.drag) { B.moving = false; B.idle += dt; }
    if (S.drag && B.frz <= 0) { B.moving = true; } B.x = clamp(B.x, S.x0, S.x1); B.y = clamp(B.y, S.y0 + 10, S.y1);
    S.time -= dt; const lvl = 1 - S.time / 30;
    S.sp -= dt; if (S.sp <= 0) { S.sp = 0.85 - lvl * 0.45; const k = wpick([['syringe', 4], ['thermo', 3], ['swab', 3], ['collar', 1 + lvl * 2]]); const side = randi(0, 3); let x, y; if (side === 0) { x = rand(S.x0, S.x1); y = S.y0; } else if (side === 1) { x = S.x1 + 6; y = rand(S.y0, S.y1); } else if (side === 2) { x = rand(S.x0, S.x1); y = EH + 6; } else { x = -6; y = rand(S.y0, S.y1); } const a = Math.atan2(B.y - 5 - y, B.x - x) + rand(-0.2, 0.2); const spd = { syringe: 105 + lvl * 50, thermo: 55, swab: 62, collar: 45 }[k]; S.objs.push({ k, x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, t: 0, a }); }
    S.nh -= dt; if (S.nh <= 0) { S.nh = 9; S.hearts.push({ x: rand(S.x0 + 10, S.x1 - 10), y: rand(S.y0 + 20, S.y1 - 10), t: 0 }); }
    S.nt -= dt; if (S.nt <= 0) { S.nt = rand(4, 6); S.tiles.push({ x: clamp(B.x + rand(-30, 30), S.x0 + 8, S.x1 - 8), y: clamp(B.y + rand(-20, 20), S.y0 + 14, S.y1 - 4), t: 0 }); }
    for (const o of S.objs) { o.t += dt; if (o.k === 'swab') { o.x += o.vx * dt + Math.cos(o.t * 6) * 30 * dt; o.y += o.vy * dt; } else { o.x += o.vx * dt; o.y += o.vy * dt; } if (!o.hit && B.inv <= 0 && Math.hypot(o.x - B.x, o.y - (B.y - 5)) < (o.k === 'collar' ? 7 : 5)) { o.hit = true; if (o.k === 'collar') { S.dark = 3; S.texts.push({ x: B.x, y: B.y - 16, s: '앞이 안 보여!', t: 0, c: '#ffffff' }); sfx('warn'); B.inv = 0.6; } else { B.hp--; B.inv = 1.1; sfx('hurt'); S.texts.push({ x: B.x, y: B.y - 16, s: o.k === 'syringe' ? '따끔!' : '깨갱!', t: 0, c: '#ff6b8a' }); if (B.hp <= 0) { S.done = true; setTimeout(() => e2End({ ok: false, text: '진료대에서 못 버텼어요...<br>천천히 피해봐요!' }), 500); } } } }
    S.objs = S.objs.filter(o => !o.hit && o.t < 6 && o.x > -20 && o.x < EW + 20 && o.y > -20 && o.y < EH + 20);
    for (const t of S.tiles) { t.t += dt; if (t.t > 1 && t.t < 6 && B.frz <= 0 && Math.abs(B.x - t.x) < 8 && Math.abs(B.y - t.y) < 5) { B.frz = 1.0; t.t = 6; S.texts.push({ x: B.x, y: B.y - 16, s: '살쪘다고요?!', t: 0, c: '#ffd84a' }); sfx('warn'); } } S.tiles = S.tiles.filter(t => t.t < 6.3);
    for (const h of S.hearts) { h.t += dt; if (Math.hypot(h.x - B.x, h.y - B.y) < 8) { h.got = true; B.hp = Math.min(3, B.hp + 1); sfx('eat'); S.texts.push({ x: B.x, y: B.y - 16, s: '보리 테라피♥', t: 0, c: '#ff9fcf' }); } } S.hearts = S.hearts.filter(h => !h.got && h.t < 7);
    for (const t of S.texts) t.t += dt; S.texts = S.texts.filter(t => t.t < 0.9);
    if (S.time <= 0 && !S.done) { S.done = true; sfx('lvl'); e2End({ ok: true, stars: B.hp, text: `남은 하트 ${B.hp}개` }); }
  },
  render() {
    const S = this, B = S.b; for (let y = 0; y < EH; y += 10) for (let x = 0; x < EW; x += 10) fr(x, y, 10, 10, ((x + y) / 10) % 2 ? '#e8f4fa' : '#d4ecf6');
    fr(EW * 0.15, EH * 0.4, EW * 0.7, EH * 0.32, '#2b1b24'); fr(EW * 0.15 + 1, EH * 0.4 + 1, EW * 0.7 - 2, EH * 0.32 - 2, '#c8ccd6'); fr(EW * 0.15 + 3, EH * 0.4 + 3, EW * 0.7 - 6, 3, '#e8ecf4');
    fr(6, S.y0 - 6, 30, 22, '#2b1b24'); fr(7, S.y0 - 5, 28, 20, '#ffffff'); fr(19, S.y0 - 1, 4, 12, '#ff6b8a'); fr(15, S.y0 + 3, 12, 4, '#ff6b8a');
    for (const t of S.tiles) { const warn = t.t < 1; ctx.globalAlpha = warn ? 0.5 + Math.sin(t.t * 20) * 0.3 : 1; fr(t.x - 8, t.y - 5, 16, 10, '#2b1b24'); fr(t.x - 7, t.y - 4, 14, 8, warn ? '#ffd84a' : '#ffffff'); fr(t.x - 3, t.y - 2, 6, 3, '#2b1b24'); ctx.globalAlpha = 1; }
    for (const h of S.hearts) drawSpr(ispr('heart'), h.x, h.y + Math.sin(h.t * 5) * 1.5);
    shadow(B.x, B.y, 12); const kind = B.frz > 0 ? 'sit' : b2Kind(B.moving, B.t, B.idle);
    drawB2(kind, B.x, B.y, { flip: B.face < 0 && kind.startsWith('run'), alpha: B.inv > 0 && Math.floor(B.t * 16) % 2 ? 0.4 : 1 }); if (kind === 'lie') zzz(B.x + 6, B.y - 10, B.t);
    for (const o of S.objs) { if (o.k === 'collar') drawSpr(s2('collar'), o.x, o.y + 3); else { const sp = s2(o.k === 'syringe' ? 'syringe' : o.k === 'thermo' ? 'thermo' : 'swab'); ctx.save(); ctx.translate(Math.round(o.x), Math.round(o.y)); ctx.rotate(Math.atan2(o.vy, o.vx) + Math.PI); ctx.drawImage(sp.n, -Math.floor(sp.W / 2), -Math.floor(sp.H / 2)); ctx.restore(); } }
    if (S.dark > 0) { ctx.fillStyle = 'rgba(10,0,20,0.88)'; ctx.beginPath(); ctx.rect(0, 0, EW, EH); ctx.arc(B.x, B.y - 5, 34, 0, Math.PI * 2, true); ctx.fill('evenodd'); }
    for (const t of S.texts) { ctx.globalAlpha = 1 - t.t / 0.9; e2T(t.x, t.y - t.t * 12, t.s, 5, t.c, '#2b1b24'); } ctx.globalAlpha = 1;
    e2Hearts(B.hp, 3); e2T(EW / 2, e2Top() + 8, `버티기 ${Math.max(0, Math.ceil(S.time))}초`, 7, '#2a78c0', '#ffffff');
    if (S.time > 27.5) e2T(EW / 2, EH * 0.3, '드래그해서 피해요!', 6, '#ff7ab8', '#ffffff');
  }
};

// ---------- STAGE 7: 저수지 낚시 ----------
const FISH7 = [{ name: '붕어', spr: 'carp', zh: 0.2, zs: 0.1, mv: [1.6, 2.6] }, { name: '메기', spr: 'catfish', zh: 0.16, zs: 0.15, mv: [1.2, 2.2] }, { name: '???', spr: null, zh: 0.13, zs: 0.2, mv: [0.9, 1.8] }];
const ST_FISH = {
  name: '저수지 낚시터', kind: '낚시', bgm: 'story',
  how: '오빠는 졸고 있고, 낚싯대에 뭔가 걸렸다! 보리가 줄을 입으로 물고 당겨요.<br>오른쪽 게이지의 <b>초록 칸 = 물고기</b>예요. 위아래로 천천히 도망다녀요.<br><b>꾹 누르면 흰 줄이 올라가고, 떼면 내려가요.</b> 흰 줄을 초록 칸 안에 두면 물고기가 끌려와요.<br>맨 위 <b>빨간 칸</b>까지 올리면 줄이 끊어질 뻔해요!',
  after: () => [{ who: 'sys', text: '찌가... 아니, 저수지 전체가 흔들린다!' }, { who: 'sys', text: '저수지의 주인 「전설의 월척」이 물 위로 뛰어올랐다!' }, { who: 'bori2', text: '멍!!! (언니 근처엔 못 간다!!)' }],
  init() { Object.assign(this, { ended: false, fi: 0, T: 0.4, v: 0, p: 0, breaks: 0, hold: false, bt: 1.2, zc: 0.45, zt: 0.45, st: 'fight', stT: 0, t: 0, texts: [], shake: 0 }); },
  ptr(type) { if (type === 'down') this.hold = true; else if (type === 'up') this.hold = false; },
  update(dt) {
    const S = this; S.t += dt; for (const t of S.texts) t.t += dt; S.texts = S.texts.filter(t => t.t < 1.2); S.shake -= dt * 10;
    const hold = S.hold || INP.atk;
    if (S.st === 'caught') { S.stT += dt; if (S.stT > 1.8) { S.fi++; S.st = 'fight'; S.T = 0.4; S.v = 0; S.p = 0; S.zc = S.zt = 0.45; S.bt = 1.2; } return; }
    if (S.st === 'boom') { S.stT += dt; S.shake = 3; if (S.stT > 2.4 && !S.ended) { S.ended = true; e2End({ ok: true, stars: S.breaks === 0 ? 3 : S.breaks <= 2 ? 2 : 1, text: `줄이 끊어질 뻔한 횟수 ${S.breaks}번` }); } return; }
    const f = FISH7[S.fi];
    S.bt -= dt; if (S.bt <= 0) { S.bt = rand(f.mv[0], f.mv[1]); const lo = f.zh + 0.06, hi = 0.86 - f.zh; let nz = rand(lo, hi); if (Math.abs(nz - S.zc) < 0.12) nz = clamp(S.zc + (nz > S.zc ? 0.2 : -0.2), lo, hi); S.zt = nz; if (Math.abs(S.zt - S.zc) > 0.22) { S.splash = 0.3; S.texts.push({ s: S.zt > S.zc ? '위로 도망!' : '아래로 도망!', t: 0, c: '#9fe8ff' }); } }
    S.zc += clamp(S.zt - S.zc, -f.zs * dt, f.zs * dt); S.zone = [S.zc - f.zh, S.zc + f.zh];
    const tv = hold ? 0.5 : -0.5; S.v += (tv - S.v) * Math.min(1, dt * 5); S.T += S.v * dt; if (S.T <= 0) { S.T = 0; S.v = Math.max(0, S.v); }
    if (S.splash > 0) S.splash -= dt;
    if (S.T >= 1) { S.breaks++; S.T = 0.6; S.v = -0.3; S.p = Math.max(0, S.p - 0.2); S.texts.push({ s: '줄이 끊어질 뻔!', t: 0, c: '#ff6b8a' }); S.shake = 3; sfx('hurt'); }
    const inZ = S.T >= S.zone[0] && S.T <= S.zone[1]; S.inZ = inZ; S.p = clamp(S.p + (inZ ? 0.2 : -0.06) * dt, 0, 1);
    if (inZ && Math.random() < dt * 6) tone(700 + S.p * 600, 0.03, 'triangle', 0.04);
    if (S.fi < 2 && S.p >= 1) { S.st = 'caught'; S.stT = 0; sfx('lvl'); S.texts.push({ s: `${f.name} 낚았다!`, t: 0, c: '#ffd84a' }); }
    if (S.fi === 2 && S.p >= 0.55) { S.st = 'boom'; S.stT = 0; sfx('boss'); S.texts.push({ s: '엄청 무거워...!!', t: 0, c: '#ff4d6d' }); }
  },
  render() {
    const S = this; ctx.save(); if (S.shake > 0) ctx.translate(rand(-S.shake, S.shake), rand(-S.shake, S.shake));
    const wy = Math.round(EH * 0.42); for (let y = 0; y < wy; y += 3) fr(0, y, EW, 3, mixHex('#6a3a9a', '#ffb07a', y / wy)); pc(EW * 0.7, wy - 4, 10, '#ffe070');
    for (let i = 0; i < 5; i++) { const x = i * 50 - 10; fr(x, wy - 14 - (i % 2) * 5, 46, 14 + (i % 2) * 5, '#4a3060'); }
    for (let y = wy; y < EH; y += 4) fr(0, y, EW, 4, mixHex('#5a7ac8', '#2a3a7a', (y - wy) / (EH - wy)));
    for (let i = 0; i < 20; i++) fr(((i * 37 + S.t * 8) % EW), wy + 6 + (i * 13) % (EH - wy - 20), 6, 1, 'rgba(255,220,180,0.5)');
    const dy = Math.round(EH * 0.6), bobx = Math.round(EW * 0.76), boby = wy + 18 + (S.splash > 0 ? 2 : 0) + Math.round(Math.sin(S.t * 3)); const tense = S.T;
    const bx = e2FishScene(dy, bobx, boby, tense, S.st === 'boom' ? 'standA' : 'runA', S.t, S.st === 'boom');
    if (S.splash > 0) pRingE(bobx, boby + 1, 6, 2, '#ffffff');
    if (S.st === 'fight') { ctx.globalAlpha = 0.35; pEll(ctx, bobx + Math.sin(S.t * 2) * 10, boby + 14, S.fi === 2 ? 24 : 9, S.fi === 2 ? 6 : 3, '#101830'); ctx.globalAlpha = 1; }
    if (S.st === 'caught') { const f = FISH7[S.fi]; const p = Math.min(1, S.stT / 0.6); drawSpr(s2(f.spr), lerp(bobx, bx - 16, p), lerp(boby, dy - 2, p) - Math.sin(p * Math.PI) * 30); }
    if (S.st === 'boom') { const p = Math.min(1, S.stT / 1.2); for (let i = 0; i < 6; i++) pRingE(bobx, boby, 8 + i * 6 * p, 2 + i * 2 * p, 'rgba(255,255,255,0.7)'); drawSpr(s2('fish'), bobx, boby + 30 - p * 60, { scale: 2 }); }
    ctx.restore();
    const gx = EW - 14, gy0 = e2Top() + 30, gh = Math.min(110, EH * 0.45);
    fr(gx - 1, gy0 - 1, 8, gh + 2, '#2b1b24'); fr(gx, gy0, 6, gh, '#3a2a44'); if (S.zone) { const zy = gy0 + gh * (1 - S.zone[1]), zh = gh * (S.zone[1] - S.zone[0]); fr(gx, zy, 6, zh, S.inZ ? '#7ef08a' : '#3aa04a'); drawSpr(s2(FISH7[Math.min(2, S.fi)].spr || 'fish'), gx - 13, zy + zh / 2 + 3, { scale: 1 }); } fr(gx, gy0, 6, gh * 0.04, '#ff4d6d');
    fr(gx - 3, gy0 + gh * (1 - S.T) - 1, 12, 2, '#ffffff');
    e2T(gx + 3, gy0 + gh + 8, '흰 줄', 3.6, '#ffffff', '#2b1b24');
    const f = FISH7[S.fi] || FISH7[2]; e2Bar(S.p, e2Top() + 10, '#ffd84a', `${S.fi + 1}/3 ${S.fi === 2 ? '??? (엄청 무겁다)' : f.name} 끌어올리기`);
    for (const t of S.texts) { ctx.globalAlpha = 1 - t.t / 1.2; e2T(EW / 2, EH * 0.32 - t.t * 10, t.s, 7, t.c, '#2b1b24'); } ctx.globalAlpha = 1;
    if (S.t < 6 && S.fi === 0) { e2T(EW / 2, EH * 0.76, '흰 줄을 초록 칸(물고기) 안에!', 5.4, '#7ef08a', '#2b1b24'); e2T(EW / 2, EH * 0.82, '꾹 = 올리기 · 떼기 = 내리기', 5, '#ffffff', '#2b1b24'); }
  }
};

// ---------- STAGE 8: 전설의 월척 (최종 보스) ----------
const ST_BOSSFISH = {
  name: '전설의 월척', kind: '최종 보스전', bgm: 'boss', joy: true,
  how: '월척은 <b>물속에선 물 수 없어요!</b> 덮치기(빨간 원)를 피하면 월척이 <b>뭍에서 퍼덕</b>거려요. 그때 공격!<br>물방울과 물결도 조심. 마지막은 꼭 <b>「보리 주세요」</b>로 마무리!',
  get btns() { return ARENA_BTNS(); },
  init() {
    const S = this, top = e2Top(); S.wy = Math.round(top + 44 + (EH - top - 54) * 0.3);
    S.A = { x0: 12, x1: EW - 12, y0: S.wy + 8, y1: EH - 10, b: arenaBori(EW * 0.5, EH * 0.8), projs: [], fx: [], parts: [], texts: [], shake: 0, noHitMsg: '물속이라 못 물어!', say: null };
    S.A.boss = { x: EW * 0.5, y: S.wy - 6, hp: 100, max: 100, r: 14, h: 20, col: '#d9a520', st: 'swim', stT: 2, face: 1, t: 0, flash: 0, stun: 0, hop: 0, vx: 30 };
    S.A.minHp = () => S.finished ? 0 : 12;
    S.A.onUlt = () => e2UltStart(() => { const T = S.A.boss; if (S.finish) { T.hp = 0; S.win = true; S.A.say = { s: '...그, 그래... 하나만 줄게...', t: 0, who: 'c' }; } else { T.hp = Math.max(12, T.hp - Math.round(25 * e2Bmul())); T.flash = 0.2; if (T.st !== 'land') { S.toLand(T.x, S.A.y0 + 20); } T.stT = 3.5; T.stun = 0; } });
    S.puddles = []; S.p2 = false; S.finish = false; S.win = false; S.done = false; S.bg = null;
  },
  resize() { this.bg = null; },
  toLand(x, y) { const T = this.A.boss; T.st = 'land'; T.x = x; T.y = y; T.hop = 0; T.stT = 3.2; this.A.shake = 5; sfx('slam'); for (let i = 0; i < 14; i++) this.A.parts.push({ x, y, vx: rand(-60, 60), vy: rand(-60, -10), life: 0.5, max: 0.5, col: '#bfe8ff', sz: 2 }); },
  update(dt) {
    const S = this, A = S.A, T = A.boss, B = A.b; if (S.done) { arenaFx(A, dt); return; }
    arenaUpdateBori(A, dt, () => T.st === 'land' || T.st === 'final'); arenaFx(A, dt); if (A.dead) return;
    for (const p of S.puddles) if (Math.hypot(B.x - p.x, (B.y - p.y) * 1.6) < p.r) B.slow = 0.2;
    T.t += dt; T.flash -= dt; T.stT -= dt;
    if (!S.p2 && T.hp < 50) { S.p2 = true; for (let i = 0; i < 4; i++) S.puddles.push({ x: rand(A.x0 + 20, A.x1 - 20), y: rand(A.y0 + 20, A.y1 - 10), r: 14 }); A.say = { s: '파닥파닥!! (화났다)', t: 0, who: 'c' }; }
    if (!S.finish && T.hp <= 12) { S.finish = true; B.gauge = 100; if (T.st !== 'land') S.toLand(T.x, A.y0 + 20); T.st = 'final'; T.stT = 99; A.texts.push({ x: EW / 2, y: EH * 0.4, s: '지금이야! 「보리 주세요」!', t: -1, col: '#ff7ab8' }); sfx('ding'); }
    if (T.st === 'swim') { T.x += T.vx * dt; if (T.x < A.x0 + 20 || T.x > A.x1 - 20) T.vx *= -1; T.face = T.vx > 0 ? 1 : -1; T.y = S.wy - 6 + Math.sin(T.t * 2) * 2; if (T.stT <= 0) { const r = Math.random(); if (r < 0.45) { T.st = 'leapTele'; T.stT = 1.0; T.tx = B.x; T.ty = B.y; A.fx.push({ k: 'circle', x: B.x, y: B.y, r: 26, t: 0, dur: 1.0 }); } else if (r < 0.75 || !S.p2) { T.st = 'splash'; T.stT = 0.5; } else { T.st = 'wave'; T.stT = 0.9; T.wy = B.y; A.fx.push({ k: 'line', x0: A.x0, x1: A.x1, y: B.y - 3, w: 12, t: 0, dur: 0.9 }); } } }
    else if (T.st === 'splash') { if (T.stT <= 0) { const n = S.p2 ? 9 : 7, a0 = Math.atan2(B.y - T.y, B.x - T.x); for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * 0.22; A.projs.push({ x: T.x, y: T.y, vx: Math.cos(a) * 80, vy: Math.sin(a) * 80, life: 3 }); } sfx('pop'); T.st = 'swim'; T.stT = rand(1.4, 2.2); } }
    else if (T.st === 'wave') { if (T.stT <= 0) { if (Math.abs(B.y - T.wy) < 8) arenaHurt(A); for (let x = A.x0; x < A.x1; x += 10) A.parts.push({ x, y: T.wy, vx: rand(-10, 10), vy: rand(-40, -10), life: 0.5, max: 0.5, col: '#bfe8ff', sz: 2 }); sfx('slam'); T.st = 'swim'; T.stT = rand(1.4, 2); } }
    else if (T.st === 'leapTele') { T.hop = Math.min(30, T.hop + dt * 60); if (T.stT <= 0) { T.st = 'leap'; T.stT = 0.5; T.sx = T.x; T.sy = T.y; } }
    else if (T.st === 'leap') { const p = 1 - Math.max(0, T.stT) / 0.5; T.x = lerp(T.sx, T.tx, p); T.y = lerp(T.sy, T.ty, p); T.hop = Math.sin(p * Math.PI) * 40; if (T.stT <= 0) { S.toLand(T.tx, T.ty); if (Math.hypot(B.x - T.x, B.y - T.y) < 26) arenaHurt(A); } }
    else if (T.st === 'land') { T.hop = Math.abs(Math.sin(T.t * 8)) * 2; if (T.stT <= 0) { T.st = 'back'; T.stT = 0.6; T.sx = T.x; T.sy = T.y; } }
    else if (T.st === 'back') { const p = 1 - Math.max(0, T.stT) / 0.6; T.x = lerp(T.sx, clamp(T.sx, A.x0 + 20, A.x1 - 20), p); T.y = lerp(T.sy, S.wy - 6, p); T.hop = Math.sin(p * Math.PI) * 30; if (T.stT <= 0) { T.st = 'swim'; T.hop = 0; T.stT = rand(1.2, 2); } }
    else if (T.st === 'final') { T.hop = Math.abs(Math.sin(T.t * 6)) * 2; }
    if ((T.st === 'land') && Math.hypot(T.x - B.x, T.y - B.y) < 12 && Math.random() < dt * 2) arenaHurt(A);
    for (const p of A.projs) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; if (Math.hypot(p.x - B.x, p.y - (B.y - 5)) < 5) { p.life = 0; arenaHurt(A); } if (p.y > EH || p.x < 0 || p.x > EW) p.life = 0; } A.projs = A.projs.filter(p => p.life > 0);
    for (const t of A.texts) if (t.t < 0) t.t = Math.max(-1, t.t);
    if (S.win && !S.done) { S.done = true; sfx('open'); setTimeout(() => e2End({ ok: true, stars: B.hp >= 5 ? 3 : B.hp >= 3 ? 2 : 1, title: '월척 격파!', text: `남은 하트 ${B.hp}개<br>「보리 주세요」로 마무리 성공!` }), 1600); }
  },
  render() {
    const S = this, A = S.A, T = A.boss;
    if (!S.bg) { const c = mkCanvas(Math.ceil(EW), Math.ceil(EH)), g = c.getContext('2d'); for (let y = 0; y < S.wy; y += 3) { g.fillStyle = mixHex('#4a7ad0', '#6aa0e8', y / S.wy); g.fillRect(0, y, c.width, 3); } g.fillStyle = '#d8c08a'; g.fillRect(0, S.wy, c.width, 6); g.fillStyle = '#8cc96e'; g.fillRect(0, S.wy + 6, c.width, c.height); for (let i = 0; i < 400; i++) { g.fillStyle = Math.random() < 0.5 ? '#7ab95e' : '#a3d987'; g.fillRect(Math.random() * c.width | 0, S.wy + 6 + Math.random() * (c.height - S.wy) | 0, 1, 2); } for (let x = 0; x < c.width; x += 9) { g.fillStyle = '#4f9a3f'; g.fillRect(x, S.wy - 6, 1, 8); g.fillRect(x + 3, S.wy - 4, 1, 6); } S.bg = c; }
    ctx.save(); if (A.shake > 0) ctx.translate(rand(-A.shake, A.shake), rand(-A.shake, A.shake));
    ctx.drawImage(S.bg, 0, 0); for (let i = 0; i < 14; i++) fr(((i * 41 + A.b.t * 10) % EW), 6 + (i * 17) % Math.max(8, S.wy - 12), 5, 1, 'rgba(255,255,255,0.5)');
    for (const p of S.puddles) { pEll(ctx, p.x, p.y, p.r, Math.round(p.r * 0.55), '#4a8ad0'); pEll(ctx, p.x, p.y, p.r - 3, Math.round(p.r * 0.4), '#6fb8ff'); }
    arenaDrawCommon(A);
    for (const p of A.projs) { pc(p.x, p.y, 2, '#2a78c0'); fr(p.x - 1, p.y - 1, 1, 1, '#ffffff'); }
    const inWater = T.st === 'swim' || T.st === 'splash' || T.st === 'wave';
    const L = [{ y: A.b.y, f: () => arenaDrawBori(A) }, { y: inWater ? -999 : T.y, f: () => { if (!inWater) shadow(T.x, T.y, 30); drawSpr(s2('fish'), T.x, T.y - T.hop, { scale: 2, flip: T.face > 0, white: T.flash > 0 }); if (inWater) { ctx.fillStyle = 'rgba(74,122,208,0.75)'; ctx.fillRect(T.x - 22, T.y - 10, 44, 12); } if (T.st === 'final') { for (let i = 0; i < 3; i++) { const a = T.t * 5 + i * 2.1; fr(T.x + Math.cos(a) * 12, T.y - 24 + Math.sin(a) * 3, 2, 2, '#ffd84a'); } } } }];
    L.sort((a, b) => a.y - b.y); for (const o of L) o.f();
    drawHeeAt(EW - 18, S.wy + 20, 'phone', 'down', A.b.t, {}); drawHusSleep(EW - 34, S.wy + 20, A.b.t);
    ctx.restore(); arenaHUD(A, '전설의 월척');
    if (S.finish && !S.win) e2T(EW / 2, EH * 0.42, '지금이야! 「보리 주세요」!', 7, '#ff7ab8', '#2a0838');
  }
};

const E2STAGES_NORMAL = [ST_HOME, ST_RUN, ST_MARKET, ST_CAT, ST_CAFE, ST_VET, ST_FISH, ST_BOSSFISH];
