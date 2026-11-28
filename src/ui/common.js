// ===================== 화면 공용 (얼굴·아이콘 그림 URL · 말하는 사람 표) =====================
// ===================== UI =====================



import { HS, MONSPR } from '../draw/sprites.js';
import { B2PAL, BORI2, SPR2 } from '../draw/sprites2.js';
import { ICONURL, iconURL, mkCanvas } from '../draw/sprite.js';
import { heeLook } from '../draw/hee2.js';
import { G } from '../core/state.js';
import { boriSpr, broSpr, dadSpr, heeSet, husSpr, kidSet } from '../draw/render.js';
import { kidNow } from '../core/chapter.js';
import { TITLE_PD } from './lobby.js';
import { tt } from '../sys/i18n.js';

export const FINE = window.matchMedia && matchMedia('(pointer: fine)').matches;
/** 2배 도트 캔버스 일부를 정사각 아이콘(64px)으로 */
function hiURL(key, src, sx, sy, sw, sh) {
  if (ICONURL[key]) return ICONURL[key];
  const n = Math.max(sw, sh), k = Math.max(1, Math.floor(64 / n)), o = mkCanvas(64, 64), g = o.getContext('2d'); g.imageSmoothingEnabled = false;
  g.drawImage(src, sx, sy, sw, sh, Math.round((64 - sw * k) / 2), Math.round((64 - sh * k) / 2), sw * k, sh * k);
  return ICONURL[key] = o.toDataURL();
}
export function faceURL(who) {
  if (who === 'kid' || (who === 'hee' && kidNow())) return hiURL('face2_kid', kidSet().down[0].n, 0, 4, 28, 26); // 5장 어린 희수
  if (who === 'dad') return hiURL('face2_dad', dadSpr().n, 0, 0, 28, 30);
  if (who === 'bro') return hiURL('face2_bro', broSpr(0).n, 0, 2, 28, 26);
  if (who === 'hee' || who === 'heePh') { const set = heeSet(), s = who === 'hee' ? set.down[0] : set.phone[0]; return hiURL('face2_' + who + JSON.stringify(heeLook(G.pd || (G.state === 'title' ? TITLE_PD : null))), s.n, 0, 0, 28, 32); }
  if (who === 'bori') { const s = boriSpr('sit'); return hiURL('face2_bori' + ((G.pd && G.pd.beq && G.pd.beq.bcloth) || ''), s.n, 0, 0, 24, 24); }
  if (who === 'hus') return hiURL('face2_hus', husSpr().n, 0, 0, 28, 32);
  if (who === 'mon') return iconURL('face_mon', MONSPR.slime);
  if (who === 'bori2') return iconURL('face_bori2', BORI2.sit, B2PAL);
  if (who === 'somi') return iconURL('face_somi', BORI2.sit, { F: '#ffffff', f: '#d8d8e0', W: '#ffffff', w: '#e8e8f0', Y: '#ffffff', m: '#ffffff' });
  if (who === 'cat') return iconURL('face_cat', SPR2.cat);
  if (who === 'nurse') return iconURL('face_nurse', [...HS.headF, ...HS.bodyF.slice(0, 4)], { C: '#ffffff', c: '#e0e0e8', N: '#ff7ab8', W: '#bfe6ff', w: '#9cc8e8', G: '#bfe6ff', g: '#9cc8e8', H: '#5a3a2a' });
  return '';
}
export const SPEAK = { bori2: { name: tt('ui/common.1'), face: 'bori2' }, cat: { name: tt('ui/common.2'), face: 'cat' }, nurse: { name: tt('ui/common.3'), face: 'nurse' }, somi: { name: tt('ui/common.4'), face: 'somi' }, hee: { name: tt('ui/common.5'), face: 'hee' }, heePh: { name: tt('ui/common.5'), face: 'heePh' }, bori: { name: tt('ui/common.1'), face: 'bori' }, hus: { name: tt('ui/common.6'), face: 'hus' }, kid: { name: tt('ui/common.5'), face: 'kid' }, dad: { name: tt('ui/common.8'), face: 'dad' }, bro: { name: tt('ui/common.9'), face: 'bro' }, mon: { name: tt('ui/common.7'), face: 'mon' }, sys: {} };
