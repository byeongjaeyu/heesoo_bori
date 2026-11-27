// ===================== 알림·배너·화면 전환·대화창 =====================
// ---------- toast / banner / fade ----------


import { $ } from '../sys/dom.js';
import { on } from '../core/events.js';
import { sfx } from '../sys/audio.js';
import { INP } from '../sys/input.js';
import { G } from '../core/state.js';
import { SPEAK, faceURL } from './common.js';

export function toast(msg, cls) {
  const box = $('#toasts'); const el = document.createElement('div'); el.className = 'toast ' + (cls || ''); el.textContent = msg; box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => el.classList.add('out'), 2300); setTimeout(() => el.remove(), 2800);
}
let bannerTO = null;
export function banner(sub, main, cls) { const b = $('#banner'); b.hidden = true; void b.offsetWidth; b.className = cls || ''; b.querySelector('small').textContent = sub; b.querySelector('b').textContent = main; b.hidden = false; clearTimeout(bannerTO); bannerTO = setTimeout(() => b.hidden = true, 2700); }
export function fadeTo(cb, label) { const f = $('#fade'); f.textContent = label || ''; f.classList.add('on'); setTimeout(() => { try { cb(); } catch (e) { console.error(e); } setTimeout(() => f.classList.remove('on'), 200); }, 500); }

// ---------- dialog ----------
export const DLG = { q: [], cur: null, shown: 0, cb: null };
/** 자동사냥 중 대사 자동 넘김 (컷신·필드 대사 공통) */
let DLG_AUTO_T = 0;
export function dlgAuto(dt) { if (!G.auto || !DLG.cur || $('#dlg').hidden) { DLG_AUTO_T = 0; return; } if (DLG.shown < DLG.cur.text.length) { DLG_AUTO_T = 0; return; } DLG_AUTO_T += dt; if (DLG_AUTO_T > 2.4) { DLG_AUTO_T = 0; dlgTap(); } }
export function dialog(lines, cb) { DLG.q = lines.slice(); DLG.cb = cb; if (G.state === 'play') G.state = 'dialog'; INP.atk = false; nextLine(); }
function nextLine() {
  const l = DLG.q.shift();
  if (!l) { $('#dlg').hidden = true; DLG.cur = null; if (G.state === 'dialog') G.state = 'play'; const cb = DLG.cb; DLG.cb = null; if (cb) cb(); return; }
  DLG.cur = l; DLG.shown = 0; const sp = SPEAK[l.who] || SPEAK.sys; const el = $('#dlg');
  el.hidden = false; el.className = l.who === 'sys' ? 'sys' : '';
  $('#dlgName').textContent = sp.name || ''; if (sp.face) $('#dlgFace').src = faceURL(sp.face);
  $('#dlgText').textContent = ''; if (l.do) l.do(); sfx('select');
}
export function dlgTap() { if (!DLG.cur) return; if (DLG.shown < DLG.cur.text.length) { DLG.shown = DLG.cur.text.length; $('#dlgText').textContent = DLG.cur.text; return; } nextLine(); }
export function updateDialog(dt) { if (!DLG.cur) return; if (DLG.shown < DLG.cur.text.length) { DLG.shown = Math.min(DLG.cur.text.length, DLG.shown + dt * 36); $('#dlgText').textContent = DLG.cur.text.slice(0, Math.floor(DLG.shown)); } }

on('toast', toast); // core 이벤트
