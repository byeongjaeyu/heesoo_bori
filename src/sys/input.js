// ===================== 입력 (조이스틱·키보드·터치) =====================
// ---------- input ----------


import { $ } from './dom.js';
import { audioInit } from './audio.js';
import { G } from '../core/state.js';
import { dlgTap } from '../ui/dialog.js';
import { EP2, e2Ptr } from '../minigame/ep2core.js';

export const INP = { k: {}, atk: false, act: new Set(), joy: { on: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0 } };
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
export function moveVec() {
  let x = 0, y = 0;
  if (INP.k.l) x -= 1; if (INP.k.r) x += 1; if (INP.k.u) y -= 1; if (INP.k.d) y += 1;
  if (x || y) { const m = Math.hypot(x, y); return [x / m, y / m]; }
  if (INP.joy.on) return [INP.joy.dx, INP.joy.dy];
  if (typeof G !== 'undefined' && G.autoMove && (G.autoMove[0] || G.autoMove[1])) return G.autoMove;
  return [0, 0];
}
const JOYR = 46;
export function hideJoy() { $('#joyBase').style.display = 'none'; }
export function setupTouch() {
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
