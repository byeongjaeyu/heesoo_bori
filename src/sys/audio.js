// ===================== 소리 (효과음·배경음) =====================
// ---------- audio ----------
export const SND = { ac: null, on: true, master: null, bgmG: null, sfxG: null, song: null, songName: '', step: 0, next: 0, lastHit: 0 };
export function audioInit() {
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
export function setSound(on) { SND.on = on; if (SND.master) SND.master.gain.value = on ? 0.7 : 0; try { localStorage.setItem('hb_sound', on ? '1' : '0'); } catch (e) { } }
export function tone(f, d, type, v, f2, delay, dest) {
  const a = SND.ac; if (!a) return;
  const t = a.currentTime + (delay || 0);
  const o = a.createOscillator(), g = a.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d);
  g.gain.setValueAtTime(v == null ? 0.2 : v, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
  o.connect(g); g.connect(dest || SND.sfxG); o.start(t); o.stop(t + d + 0.03);
}
let NOISEBUF = null;
export function noise(d, v, delay, freq) {
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
export function sfx(n) { if (!SND.ac || !SND.on) return; if (n === 'hit' || n === 'punch') { const now = performance.now(); if (now - SND.lastHit < 45) return; SND.lastHit = now; } try { SFX[n] && SFX[n](); } catch (e) { } }

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
export function playBgm(name) {
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
