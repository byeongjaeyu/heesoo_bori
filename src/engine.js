// ===================== ENGINE =====================
const $ = s => document.querySelector(s);
const cv = $('#cv'), ctx = cv.getContext('2d');
let DPR = 1, S = 4, VW = 200, VH = 200, CW = 0, CH = 0;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 3);
  CW = window.innerWidth; CH = window.innerHeight;
  cv.width = Math.round(CW * DPR); cv.height = Math.round(CH * DPR);
  cv.style.width = CW + 'px'; cv.style.height = CH + 'px';
  S = Math.max(2, Math.round(Math.min(cv.width, cv.height) / 170));
  VW = cv.width / S; VH = cv.height / S;
  ctx.imageSmoothingEnabled = false;
}

// ---------- utils ----------
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const choice = a => a[Math.floor(Math.random() * a.length)];
function wpick(list) { let t = 0; for (const it of list) t += it[1]; let r = Math.random() * t; for (const it of list) { if ((r -= it[1]) < 0) return it[0]; } return list[0][0]; }
function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return Math.abs(d); }
function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shadeHex(hex, amt) {
  let c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
  let r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  const f = amt < 0 ? (v => v * (1 + amt)) : (v => v + (255 - v) * amt);
  return '#' + [r, g, b].map(v => Math.round(clamp(f(v), 0, 255)).toString(16).padStart(2, '0')).join('');
}
function fmtTime(s) { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60; return (h ? h + '시간 ' : '') + m + '분 ' + ss + '초'; }

// ---------- sprites ----------
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rowsToCanvas(rows, pal) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  const c = mkCanvas(w, h), g = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    const r = rows[y];
    for (let x = 0; x < r.length; x++) {
      const ch = r[x]; if (ch === '.') continue;
      const col = (pal && pal[ch]) || BASEPAL[ch]; if (!col) continue;
      g.fillStyle = col; g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}
function flipC(c) { const o = mkCanvas(c.width, c.height), g = o.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return o; }
function whiteC(c) { const o = mkCanvas(c.width, c.height), g = o.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); return o; }
function makeSpr(c) { return { n: c, f: null, w: null, wf: null, W: c.width, H: c.height }; }
const SPRC = {};
function spr(key, rows, pal) { if (!SPRC[key]) SPRC[key] = makeSpr(rowsToCanvas(rows, pal)); return SPRC[key]; }
function sprFn(key, fn) { if (!SPRC[key]) SPRC[key] = makeSpr(fn()); return SPRC[key]; }
function drawSpr(s, x, y, o) {
  o = o || {}; const sc = o.scale || 1; let img = s.n;
  if (o.white) { if (!s.w) s.w = whiteC(s.n); if (o.flip) { if (!s.wf) s.wf = flipC(s.w); img = s.wf; } else img = s.w; }
  else if (o.flip) { if (!s.f) s.f = flipC(s.n); img = s.f; }
  const a = o.alpha != null && o.alpha < 1;
  if (a) ctx.globalAlpha = Math.max(0, o.alpha);
  ctx.drawImage(img, Math.round(x - s.W * sc / 2), Math.round(y - s.H * sc), Math.round(s.W * sc), Math.round(s.H * sc));
  if (a) ctx.globalAlpha = 1;
}
function pRect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function pCirc(g, cx, cy, r, c) { g.fillStyle = c; for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)) + 0.35); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
function pEll(g, cx, cy, rx, ry, c) { g.fillStyle = c; for (let y = -ry; y <= ry; y++) { const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))) + 0.35); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
function pRing(g, cx, cy, r, c, step) { g.fillStyle = c; const n = Math.max(8, Math.floor(r * 6.28 / (step || 1.5))); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1); } }

// icon -> dataURL (UI)
const ICONURL = {};
function iconURL(key, rows, pal) {
  if (ICONURL[key]) return ICONURL[key];
  const c = rowsToCanvas(rows, pal); const s = 4; const o = mkCanvas(16 * s, 16 * s), g = o.getContext('2d');
  g.imageSmoothingEnabled = false;
  const k = Math.max(1, Math.floor(Math.min(16 / c.width, 16 / c.height)));
  g.drawImage(c, Math.round((16 - c.width * k) / 2) * s, Math.round((16 - c.height * k) / 2) * s, c.width * k * s, c.height * k * s);
  return ICONURL[key] = o.toDataURL();
}

// ---------- audio ----------
const SND = { ac: null, on: true, master: null, bgmG: null, sfxG: null, song: null, songName: '', step: 0, next: 0, lastHit: 0 };
function audioInit() {
  if (SND.ac) { if (SND.ac.state === 'suspended') SND.ac.resume().catch(() => { }); return; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const a = SND.ac = new AC();
    SND.master = a.createGain(); SND.master.gain.value = SND.on ? 0.7 : 0; SND.master.connect(a.destination);
    SND.bgmG = a.createGain(); SND.bgmG.gain.value = 0.2; SND.bgmG.connect(SND.master);
    SND.sfxG = a.createGain(); SND.sfxG.gain.value = 0.5; SND.sfxG.connect(SND.master);
    setInterval(bgmTick, 40);
    if (SND.pending) { const p = SND.pending; SND.pending = null; playBgm(p); }
  } catch (e) { SND.ac = null; }
}
function setSound(on) { SND.on = on; if (SND.master) SND.master.gain.value = on ? 0.7 : 0; try { localStorage.setItem('hb_sound', on ? '1' : '0'); } catch (e) { } }
function tone(f, d, type, v, f2, delay, dest) {
  const a = SND.ac; if (!a) return;
  const t = a.currentTime + (delay || 0);
  const o = a.createOscillator(), g = a.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d);
  g.gain.setValueAtTime(v == null ? 0.2 : v, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
  o.connect(g); g.connect(dest || SND.sfxG); o.start(t); o.stop(t + d + 0.03);
}
let NOISEBUF = null;
function noise(d, v, delay, freq) {
  const a = SND.ac; if (!a) return;
  if (!NOISEBUF) { NOISEBUF = a.createBuffer(1, a.sampleRate * 0.6, a.sampleRate); const ch = NOISEBUF.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
  const t = a.currentTime + (delay || 0);
  const s = a.createBufferSource(); s.buffer = NOISEBUF;
  const fl = a.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = freq || 1200;
  const g = a.createGain(); g.gain.setValueAtTime(v || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
  s.connect(fl); fl.connect(g); g.connect(SND.sfxG); s.start(t); s.stop(t + d + 0.03);
}
const SFX = {
  swing: () => noise(0.05, 0.12, 0, 2500),
  punch: () => { noise(0.06, 0.25, 0, 900); tone(180, 0.06, 'square', 0.08, 90); },
  hit: () => tone(320, 0.07, 'square', 0.08, 140),
  crit: () => { tone(620, 0.08, 'square', 0.1, 200); noise(0.08, 0.2, 0, 2200); },
  hurt: () => tone(240, 0.18, 'sawtooth', 0.14, 70),
  coin: () => { tone(988, 0.05, 'square', 0.06); tone(1319, 0.1, 'square', 0.06, null, 0.05); },
  eat: () => { tone(523, 0.06, 'triangle', 0.2); tone(659, 0.06, 'triangle', 0.2, null, 0.08); tone(784, 0.1, 'triangle', 0.2, null, 0.16); },
  lvl: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.1, null, i * 0.09)); tone(1568, 0.35, 'triangle', 0.15, null, 0.36); },
  bark: () => { tone(720, 0.09, 'square', 0.14, 380); tone(780, 0.1, 'square', 0.14, 400, 0.14); },
  smash: () => { noise(0.16, 0.45, 0, 700); tone(150, 0.16, 'square', 0.15, 60); },
  nag: () => { for (let i = 0; i < 5; i++) tone(700 + Math.random() * 500, 0.05, 'square', 0.05, null, i * 0.04); },
  flash: () => { noise(0.25, 0.35, 0, 4500); tone(1800, 0.12, 'sine', 0.15, 900); },
  gohome: () => { tone(660, 0.18, 'square', 0.1, 520); tone(560, 0.3, 'square', 0.1, 330, 0.18); noise(0.3, 0.3, 0.05, 300); tone(120, 0.25, 'square', 0.12, 60, 0.05); },
  ult: () => { tone(110, 1.3, 'sawtooth', 0.16, 55); tone(166, 1.3, 'sawtooth', 0.1, 82); [880, 830, 784, 740].forEach((f, i) => tone(f, 0.25, 'square', 0.07, null, 0.25 + i * 0.16)); noise(0.9, 0.35, 0.85, 400); },
  boss: () => { [0, 0.25, 0.5].forEach(d => tone(98, 0.22, 'sawtooth', 0.16, 85, d)); },
  open: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'triangle', 0.15, null, i * 0.07)); },
  select: () => tone(880, 0.05, 'square', 0.05),
  pop: () => tone(420, 0.08, 'square', 0.05, 820),
  ding: () => { tone(1047, 0.1, 'triangle', 0.15); tone(1568, 0.25, 'triangle', 0.12, null, 0.08); },
  thunder: () => { noise(1.2, 0.5, 0, 200); tone(60, 0.8, 'sawtooth', 0.1, 40); },
  slam: () => { noise(0.4, 0.5, 0, 150); tone(70, 0.35, 'square', 0.2, 35); },
  warn: () => tone(200, 0.12, 'square', 0.06, 160)
};
function sfx(n) { if (!SND.ac || !SND.on) return; if (n === 'hit' || n === 'punch') { const now = performance.now(); if (now - SND.lastHit < 45) return; SND.lastHit = now; } try { SFX[n] && SFX[n](); } catch (e) { } }

const NOTEI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function nf(s) { const m = s.match(/^([A-G]#?)(\d)$/); if (!m) return 0; const n = NOTEI[m[1]] + (+m[2] + 1) * 12; return 440 * Math.pow(2, (n - 69) / 12); }
const SONGS = {
  field: { bpm: 132, w: 'square', bw: 'triangle', v: 0.07,
    mel: 'E5 . G5 . C6 . G5 . A5 . G5 E5 G5 . . . F5 . A5 . D6 . A5 . G5 . F5 D5 E5 . . . E5 . G5 . C6 . E6 . D6 . C6 A5 C6 . . . B5 . G5 . D6 . B5 . C6 . G5 . C6 . . .',
    bass: 'C3 . G3 . C3 . G3 . F3 . C4 . F3 . C4 . D3 . A3 . D3 . A3 . G2 . D3 . G2 . D3 . C3 . G3 . C3 . G3 . F3 . C4 . F3 . C4 . G2 . D3 . G2 . D3 . C3 . G3 . C3 . . .' },
  boss: { bpm: 168, w: 'square', bw: 'sawtooth', v: 0.06,
    mel: 'A4 C5 E5 A5 G5 E5 C5 E5 F4 A4 C5 F5 E5 C5 A4 C5 G4 B4 D5 G5 F5 D5 B4 D5 E5 . E5 . G#5 . B5 . A5 . E5 . C6 . B5 A5 F5 . A5 . C6 . D6 . E6 . D6 C6 B5 G5 B5 D6 E6 . . . E6 . . .',
    bass: 'A2 A2 A3 A2 A2 A3 A2 A3 F2 F2 F3 F2 F2 F3 F2 F3 G2 G2 G3 G2 G2 G3 G2 G3 E2 E2 E3 E2 E2 E3 E2 E3' },
  story: { bpm: 96, w: 'triangle', bw: 'triangle', v: 0.12,
    mel: 'C5 . E5 . G5 . E5 . F5 . A5 . G5 . . . E5 . G5 . C6 . B5 . A5 . G5 . . . . . F5 . E5 . D5 . C5 . D5 . E5 . G5 . . . E5 . D5 . C5 . . . . . . . . . . .',
    bass: 'C3 . . . G3 . . . F3 . . . C3 . . . A2 . . . E3 . . . F2 . . . G2 . . .' },
  dark: { bpm: 80, w: 'sawtooth', bw: 'square', v: 0.05,
    mel: 'A4 . . . G#4 . . . G4 . . . F#4 . . . F4 . . . E4 . . . D#4 . . . E4 . . .',
    bass: 'A2 . A2 . A2 . A2 . G#2 . G#2 . G#2 . G#2 . F2 . F2 . F2 . F2 . E2 . E2 . E2 . E2 .' },
  home: { bpm: 112, w: 'square', bw: 'triangle', v: 0.06,
    mel: 'G5 . E5 . C5 . E5 . G5 . . . A5 . G5 . F5 . D5 . F5 . A5 . . . G5 . F5 . E5 . D5 . C5 . E5 . G5 . . . C6 . . . . . . .',
    bass: 'C3 . G3 . C3 . G3 . F3 . C4 . F3 . C4 . G2 . D3 . G2 . D3 . C3 . G3 . C3 . . .' }
};
function playBgm(name) {
  if (!SND.ac) { SND.pending = name; return; }
  if (SND.songName === name && SND.song) return;
  SND.songName = name; const s = SONGS[name];
  if (!s) { SND.song = null; return; }
  if (!s.m) { s.m = s.mel.split(/\s+/); s.b = s.bass.split(/\s+/); }
  SND.song = s; SND.step = 0; SND.next = SND.ac.currentTime + 0.15;
}
function bgmTick() {
  const a = SND.ac, s = SND.song; if (!a || !s || !SND.on) { if (a && s) SND.next = a.currentTime + 0.1; return; }
  const sd = 60 / s.bpm / 2;
  if (SND.next < a.currentTime - 0.5) SND.next = a.currentTime + 0.05;
  while (SND.next < a.currentTime + 0.25) {
    const delay = Math.max(0, SND.next - a.currentTime);
    const mn = s.m[SND.step % s.m.length];
    if (mn && mn !== '.') { let len = 1; while (len < 4 && s.m[(SND.step + len) % s.m.length] === '.') len++; tone(nf(mn), sd * Math.min(len, 2) * 0.95, s.w, s.v, null, delay, SND.bgmG); }
    const bn = s.b[SND.step % s.b.length];
    if (bn && bn !== '.') tone(nf(bn), sd * 1.7, s.bw, 0.1, null, delay, SND.bgmG);
    SND.step++; SND.next += sd;
  }
}

// ---------- input ----------
const INP = { k: {}, atk: false, act: new Set(), joy: { on: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0 } };
const KEYMOVE = { ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r' };
const KEYACT = { KeyO: 'auto', ArrowUp: 'kup', ArrowDown: 'kdown', ArrowLeft: 'kleft', ArrowRight: 'kright', KeyK: 's1', Digit1: 's1', KeyL: 's2', Digit2: 's2', Semicolon: 's3', Digit3: 's3', KeyU: 'ult', Digit4: 'ult', KeyR: 'ult', KeyQ: 'hp', KeyE: 'mp', KeyI: 'menu', KeyM: 'menu', Tab: 'menu', Escape: 'esc', Enter: 'ok' };
window.addEventListener('keydown', e => {
  const tg = /** @type {HTMLElement|null} */ (e.target); if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA')) return;
  audioInit();
  const k = KEYMOVE[e.code]; if (k) { INP.k[k] = true; e.preventDefault(); }
  if (e.code === 'KeyJ' || e.code === 'Space') { INP.atk = true; e.preventDefault(); if (!e.repeat) INP.act.add('ok'); }
  if (!e.repeat && KEYACT[e.code]) { INP.act.add(KEYACT[e.code]); e.preventDefault(); }
});
window.addEventListener('keyup', e => {
  const k = KEYMOVE[e.code]; if (k) INP.k[k] = false;
  if (e.code === 'KeyJ' || e.code === 'Space') INP.atk = false;
});
window.addEventListener('blur', () => { INP.k = {}; INP.atk = false; INP.joy.on = false; hideJoy(); });
function moveVec() {
  let x = 0, y = 0;
  if (INP.k.l) x -= 1; if (INP.k.r) x += 1; if (INP.k.u) y -= 1; if (INP.k.d) y += 1;
  if (x || y) { const m = Math.hypot(x, y); return [x / m, y / m]; }
  if (INP.joy.on) return [INP.joy.dx, INP.joy.dy];
  if (typeof G !== 'undefined' && G.autoMove && (G.autoMove[0] || G.autoMove[1])) return G.autoMove;
  return [0, 0];
}
const JOYR = 46;
function hideJoy() { $('#joyBase').style.display = 'none'; }
function setupTouch() {
  const layer = $('#touch');
  layer.addEventListener('pointerdown', e => {
    audioInit();
    if (G.state === 'cut' || G.state === 'dialog' || G.state === 'event') { if (!$('#dlg').hidden) dlgTap(); return; }
    if (G.state === 'ep2') { if (!$('#dlg').hidden) { dlgTap(); return; } if (!EP2.useJoy) { e2Ptr('down', e); try { layer.setPointerCapture(e.pointerId); } catch (_) { } e.preventDefault(); return; } }
    else if (G.state !== 'play') return;
    if (INP.joy.on) return;
    INP.joy.on = true; INP.joy.id = e.pointerId; INP.joy.ox = e.clientX; INP.joy.oy = e.clientY; INP.joy.dx = 0; INP.joy.dy = 0;
    try { layer.setPointerCapture(e.pointerId); } catch (_) { }
    const b = $('#joyBase'); b.style.display = 'block'; b.style.left = e.clientX + 'px'; b.style.top = e.clientY + 'px';
    $('#joyKnob').style.transform = 'translate(-50%,-50%)';
    e.preventDefault();
  });
  layer.addEventListener('pointermove', e => {
    if (G.state === 'ep2' && !EP2.useJoy) { e2Ptr('move', e); e.preventDefault(); return; }
    if (!INP.joy.on || e.pointerId !== INP.joy.id) return;
    let dx = e.clientX - INP.joy.ox, dy = e.clientY - INP.joy.oy; const m = Math.hypot(dx, dy);
    if (m > JOYR) { dx = dx / m * JOYR; dy = dy / m * JOYR; }
    INP.joy.dx = dx / JOYR; INP.joy.dy = dy / JOYR;
    $('#joyKnob').style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    e.preventDefault();
  });
  const end = e => { if (G.state === 'ep2' && !EP2.useJoy) { e2Ptr('up', e); } if (e.pointerId !== INP.joy.id) return; INP.joy.on = false; INP.joy.id = -1; INP.joy.dx = INP.joy.dy = 0; hideJoy(); };
  layer.addEventListener('pointerup', end); layer.addEventListener('pointercancel', end);
  document.querySelectorAll('[data-act]').forEach((/** @type {HTMLElement} */ btn) => {
    const act = btn.dataset.act;
    btn.addEventListener('pointerdown', e => {
      audioInit(); e.preventDefault(); e.stopPropagation();
      if (act === 'atk') { INP.atk = true; btn.classList.add('down'); try { btn.setPointerCapture(e.pointerId); } catch (_) { } }
      else { INP.act.add(act); btn.classList.add('down'); setTimeout(() => btn.classList.remove('down'), 120); }
    });
    const up = () => { if (act === 'atk') { INP.atk = false; btn.classList.remove('down'); } };
    btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('lostpointercapture', up);
    btn.addEventListener('contextmenu', e => e.preventDefault());
  });
  document.addEventListener('gesturestart', e => e.preventDefault());
}
