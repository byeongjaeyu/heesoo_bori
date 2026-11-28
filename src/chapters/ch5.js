// ===================== 5장: 신혼여행 전날 밤의 꿈 (어린 시절) =====================
// 신혼여행 전날 밤 잠든 희수가 어린 시절로 돌아감 — 공장 옆 골목(숨바꼭질하다 길 잃음) → 아빠 목공소(아빠 낚시 생각 사념 처치)
// → 동네 공터(아빠가 나무자재로 칼을 만들어 줌 → 형들과 칼싸움) → 집으로 가는 길(「나 신혼여행 가야 했던 것 같은데…?」 · 5분만 더 시계) → 엔딩: 잠에서 깸
// 어린 시절이라 보리·오빠는 없음(쓰러지면 아빠가 일으켜 줌). 희수는 어린 희수 그림(kidNow).
// 「버려진 나무자재」(배달앱에서 사기, 하나만): 5장 첫 회차 STAGE 17~18은 무기로 껴야 들어감, 5장 안에서는 가진 가장 센 무기만큼 세짐(추억 보정 memoryKey).
// STAGE 19 입장 이야기에서 아빠가 다듬어 「기억을 되찾은 나무칼」(초월, 맥북프로급)이 됨 — 둘 다 판매·거래·분해·도감 제외(quest).
// 이 파일 = 5장 전부, 맨 아래 regChapter 로 등록



import { ctx } from '../sys/dom.js';
import { choice, clamp, lerp, rand } from '../core/util.js';
import { drawSpr, mkCanvas, pCirc, pRect } from '../draw/sprite.js';
import { sfx } from '../sys/audio.js';
import { CH_Z0, chClr, chOf, kidNow, regChapter, zoneCh } from '../core/chapter.js';
import { OK, WORLD_H, WORLD_W } from '../draw/world.js';
import { G } from '../core/state.js';
import { ITEMS, defOf } from '../core/data.js';
import { addItem, dropItem, keysOf, ownsDef } from '../core/items.js';
import { saveGame } from '../core/save.js';
import { bubble, burst, hurtPlayer, moveToward } from '../play/player.js';
import { aimDash, dashStep, shootAt, spawnEnemy } from '../play/enemies.js';
import { CUTK, broSpr, dadSpr, fr, pc, pxLine, shadow } from '../draw/render.js';
import { A_, clearA } from '../story/story.js';
import { toast } from '../ui/dialog.js';
import { confirmBox, lobbyMenu } from '../ui/menu.js';
import { tt } from '../sys/i18n.js';

// ---------- 나무자재 · 나무칼 ----------
export const WOOD = 'woodplank', SWORD = 'woodsword', WOOD_PRICE = 100000;
/** 5장 첫 회차 STAGE 17~18 (나무칼을 받기 전): 나무자재를 무기로 껴야 함 */
export const ch5NeedWood = (pd, z) => zoneCh(z) === 5 && !chClr(pd, 5) && !(pd.ch5 || {}).sword && z < CH_Z0[5] + 2;
/** 지금 5장 필드에서 무기를 바꿀 수 없는지 (나무칼 받기 전 첫 회차) */
export const ch5WeaponLocked = pd => kidNow() && ch5NeedWood(pd, G.zone);
/** 배달앱에서 살 수 있는지: 5장이 열렸고 나무자재·나무칼이 둘 다 없을 때 하나만 */
export const woodBuyable = pd => !!pd && (pd.lv >= 50 || (pd.aw || 0) > 0) && chClr(pd, 4) >= 1 && !ownsDef(pd, WOOD) && !ownsDef(pd, SWORD);
export function buyWood(pd) {
  if (!woodBuyable(pd) || pd.gold < WOOD_PRICE) return false;
  pd.gold -= WOOD_PRICE; addItem(pd, WOOD); return true;
}
/** 나무자재 → 기억을 되찾은 나무칼 (강화·장비 레벨·재련 그대로 이어받고 바로 착용). 이미 받았으면 false */
export function ch5Sword(pd) {
  const P = chOf(pd, 5); if (P.sword) return false; P.sword = 1;
  const wk = keysOf(pd, WOOD)[0], keep = wk ? { en: (pd.enh || {})[wk] || 0, ilv: (pd.ilv || {})[wk], iexp: (pd.iexp || {})[wk], ref: (pd.ref || {})[wk] } : { en: 0 };
  if (wk) dropItem(pd, wk);
  const k = addItem(pd, SWORD, keep.en);
  if (keep.ilv) (pd.ilv = pd.ilv || {})[k] = keep.ilv; if (keep.iexp) (pd.iexp = pd.iexp || {})[k] = keep.iexp; if (keep.ref) (pd.ref = pd.ref || {})[k] = keep.ref;
  pd.eq.weapon = k; return true;
}
/** 「모험 계속하기」 전: 첫 회차 STAGE 17~18 인데 나무자재를 안 꼈으면 끼울지(없으면 사러 갈지) 묻고 막음 */
function ch5Gate(pd, z, retry) {
  if (!ch5NeedWood(pd, z) || defOf(pd.eq.weapon) === WOOD) return false;
  const wk = keysOf(pd, WOOD)[0];
  if (wk) confirmBox(tt('chapters/ch5.1'), () => { pd.eq.weapon = wk; G.pd = pd; saveGame(); retry(); });
  else confirmBox(tt('chapters/ch5.2', { v1: WOOD_PRICE.toLocaleString() }), () => lobbyMenu('shop'));
  return true;
}
/** 스테이지 입장: STAGE 19부터는 나무칼 (이야기를 이미 본 경우엔 알림만) */
function ch5OnZone(pd, z) {
  if (z >= CH_Z0[5] + 2 && ch5Sword(pd)) { saveGame(); if ((chOf(pd, 5).seen || {})[z]) toast(tt('chapters/ch5.3'), 'item r5'); }
}

// ---------- 컷신 장면 ----------
function band(SW, y0, y1, cols) { const n = cols.length; for (let y = y0; y < y1; y += 4) { const k = Math.min(n - 1, Math.floor((y - y0) / Math.max(1, y1 - y0) * n)); fr(0, y, SW, 4, cols[k]); } }
function drawKidCut(SW, SH, mid, gy, T, mode) {
  const K = CUTK;
  if (mode === 'kroom' || mode === 'kmorn') {
    // 신혼집 침실: 밤(짐 싸기) / 아침(알람)
    const morn = mode === 'kmorn';
    band(SW, 0, gy - 4, morn ? ['#fff4e0', '#fdeccc', '#f6e2c0'] : ['#262a52', '#2c3160', '#33386c']);
    const wx = Math.round(mid + 40 * K), wy = gy - 70; fr(wx - 1, wy - 1, 44, 34, '#2b1b24'); fr(wx, wy, 42, 32, morn ? '#bfe6ff' : '#121834');
    if (morn) { pc(wx + 30, wy + 9, 7, '#fff6b0'); for (let i = 0; i < 6; i++) fr(wx + 4 + i * 6, wy + 20 + (i % 2) * 3, 4, 1, '#ffffff'); }
    else { pc(wx + 30, wy + 10, 6, '#fff6c0'); pc(wx + 33, wy + 8, 5, '#121834'); for (let i = 0; i < 9; i++) if ((Math.floor(T * 2) + i) % 4) fr(wx + 3 + (i * 13) % 38, wy + 3 + (i * 7) % 26, 1, 1, '#ffffff'); }
    fr(wx + 20, wy, 2, 32, '#2b1b24'); fr(wx, wy + 15, 42, 2, '#2b1b24'); fr(wx - 6, wy - 4, 6, 40, morn ? '#ff9fcf' : '#7a5a9a'); fr(wx + 42, wy - 4, 6, 40, morn ? '#ff9fcf' : '#7a5a9a');
    const bx = Math.round(mid - 130 * K); fr(bx, gy - 24, 76, 22, '#2b1b24'); fr(bx + 1, gy - 23, 74, 8, '#ffffff'); fr(bx + 1, gy - 15, 74, 12, morn ? '#ffb3d9' : '#7a6aa8'); fr(bx + 4, gy - 30, 20, 8, '#2b1b24'); fr(bx + 5, gy - 29, 18, 6, '#ffffff'); fr(bx + 28, gy - 30, 20, 8, '#2b1b24'); fr(bx + 29, gy - 29, 18, 6, '#ffffff');
    if (!morn) { pc(Math.round(mid - 40 * K), gy - 44, 9, 'rgba(255,220,140,0.18)'); fr(Math.round(mid - 42 * K), gy - 40, 4, 36, '#2b1b24'); fr(Math.round(mid - 46 * K), gy - 46, 12, 7, '#ffe8a8'); }
    fr(0, gy - 4, SW, SH - gy + 4, morn ? '#d8b088' : '#4a3c5a'); for (let y = gy; y < SH; y += 7) fr(0, y, SW, 1, morn ? '#c49a70' : '#3c3050');
  } else if (mode === 'kalley') {
    // 공장 옆 골목 (저녁): 벽돌 공장 · 굴뚝 연기 · 함석 담장 · 전봇대
    band(SW, 0, gy - 30, ['#6a4a9a', '#9a5a9a', '#e0789a', '#ffa87a']);
    const fx = Math.round(mid - 170 * K); fr(fx, gy - 84, Math.round(230 * K), 80, '#2b1b24'); fr(fx + 1, gy - 83, Math.round(230 * K) - 2, 78, '#9a4a3a');
    for (let y = gy - 80; y < gy - 6; y += 5) for (let x = fx + ((y / 5) % 2 ? 0 : 5); x < fx + 230 * K - 4; x += 10) fr(x, y, 9, 1, '#7a3628');
    for (let i = 0; i < 5; i++) { const x = fx + 10 + i * Math.round(42 * K); fr(x, gy - 70, 22, 16, '#2b1b24'); fr(x + 1, gy - 69, 20, 14, (i + Math.floor(T)) % 3 ? '#ffd88a' : '#ffe8b0'); fr(x + 10, gy - 69, 1, 14, '#2b1b24'); }
    const cx = Math.round(mid + 24 * K); fr(cx, gy - 130, 14, 48, '#2b1b24'); fr(cx + 1, gy - 129, 12, 46, '#b86a50'); fr(cx + 1, gy - 122, 12, 2, '#ffffff');
    for (let i = 0; i < 6; i++) { const p = (T * 0.25 + i / 6) % 1; pc(cx + 7 + p * 30 + Math.sin(p * 6 + i) * 4, gy - 134 - p * 40, 5 + p * 6, `rgba(220,210,230,${0.6 - p * 0.55})`); }
    const tx = Math.round(mid + 70 * K); fr(tx, gy - 34, SW - tx, 30, '#2b1b24'); for (let x = tx + 1; x < SW; x += 4) fr(x, gy - 33, 3, 28, (x / 4) % 2 ? '#8a9aa8' : '#9aaab8');
    const px = Math.round(mid + 110 * K); fr(px, gy - 110, 4, 106, '#5a4a3a'); fr(px - 12, gy - 104, 28, 3, '#5a4a3a'); for (const dy of [0, 6]) pxLine(0, gy - 100 + dy, SW, gy - 96 + dy + Math.round(Math.sin(T) * 1), '#2b1b24');
    fr(0, gy - 4, SW, SH - gy + 4, '#6a6470'); for (let i = 0; i < 14; i++) { const x = (i * 53) % SW, y = gy + 4 + (i * 17) % (SH - gy - 6); fr(x, y, 6, 1, '#55505c'); fr(x + 5, y + 1, 4, 1, '#55505c'); }
    const lx = Math.round(mid - 90 * K); for (let i = 0; i < 4; i++) { fr(lx + i * 3, gy - 16 + i * 3, 36, 4, '#2b1b24'); fr(lx + i * 3 + 1, gy - 15 + i * 3, 34, 2, '#c8945a'); }
  } else if (mode === 'kshop') {
    // 아빠 목공소: 나무 판자 벽 · 바다 보이는 창 · 작업대 · 쌓인 목재
    fr(0, 0, SW, gy - 4, '#c8945a'); for (let x = 0; x < SW; x += 10) { fr(x, 0, 1, gy - 4, '#a87438'); if ((x / 10) % 3 === 1) fr(x + 4, (x * 7) % 40 + 10, 2, 2, '#8a5a2a'); }
    const wx = Math.round(mid + 44 * K), wy = gy - 72; fr(wx - 1, wy - 1, 50, 30, '#2b1b24'); fr(wx, wy, 48, 14, '#9fd8ff'); fr(wx, wy + 14, 48, 14, '#3f8ad0'); for (let i = 0; i < 6; i++) fr(wx + 3 + i * 8 + Math.round(Math.sin(T * 2 + i) * 1), wy + 18 + (i % 2) * 4, 4, 1, '#cfeaff'); fr(wx + 23, wy, 2, 28, '#2b1b24');
    const sx = Math.round(mid - 120 * K); fr(sx, gy - 78, 30, 8, '#2b1b24'); fr(sx + 1, gy - 77, 22, 6, '#c0c6d0'); fr(sx + 23, gy - 77, 6, 6, '#c98a3a'); for (let i = 0; i < 6; i++) fr(sx + 2 + i * 4, gy - 71, 2, 2, '#c0c6d0');
    fr(sx + 40, gy - 80, 4, 14, '#2b1b24'); fr(sx + 36, gy - 82, 12, 5, '#6a6f7c');
    const bx = Math.round(mid - 60 * K); fr(bx, gy - 30, 80, 8, '#2b1b24'); fr(bx + 1, gy - 29, 78, 6, '#d8a868'); fr(bx + 4, gy - 22, 4, 22, '#2b1b24'); fr(bx + 72, gy - 22, 4, 22, '#2b1b24'); fr(bx + 30, gy - 34, 26, 4, '#2b1b24'); fr(bx + 31, gy - 33, 24, 2, '#e8c890');
    const lx = Math.round(mid + 100 * K); for (let i = 0; i < 6; i++) { fr(lx, gy - 8 - i * 7, 60, 6, '#2b1b24'); fr(lx + 1, gy - 7 - i * 7, 58, 4, i % 2 ? '#d8a868' : '#c8945a'); fr(lx + 2, gy - 7 - i * 7, 3, 4, '#f0d0a0'); }
    fr(0, gy - 4, SW, SH - gy + 4, '#e0c090'); for (let i = 0; i < 60; i++) fr((i * 37) % SW, gy + (i * 13) % (SH - gy), 2, 1, i % 2 ? '#f0d8a8' : '#c8a070');
  } else if (mode === 'klot') {
    // 동네 공터 (오후): 하늘 · 먼 아파트 · 파란 공사 펜스 · 타이어 더미 · 콘크리트 관
    band(SW, 0, gy - 20, ['#8fd0ff', '#a8dcff', '#cfeaff']); for (let i = 0; i < 3; i++) { const x = ((i * 120 + T * 4) % (SW + 60)) - 30; pc(x, 18 + i * 10, 8, '#ffffff'); pc(x + 10, 16 + i * 10, 9, '#ffffff'); }
    for (let i = 0; i < 6; i++) { const x = Math.round(mid - 170 * K + i * 60 * K), h = 50 + (i * 17) % 30; fr(x, gy - 20 - h, 40, h, '#b8c0cc'); for (let y = gy - 16 - h; y < gy - 24; y += 6) for (let k = 0; k < 4; k++) fr(x + 4 + k * 9, y, 4, 3, '#8a96a8'); }
    fr(0, gy - 34, SW, 30, '#2b1b24'); for (let x = 0; x < SW; x += 24) { fr(x + 1, gy - 33, 22, 28, '#3a78c0'); fr(x + 1, gy - 33, 22, 3, '#6fb8ff'); }
    const tx = Math.round(mid + 70 * K); for (const [dx, dy] of [[0, 0], [14, 0], [7, -9]]) { pc(tx + dx, gy - 6 + dy, 7, '#2b1b24'); pc(tx + dx, gy - 6 + dy, 6, '#3a3440'); pc(tx + dx, gy - 6 + dy, 3, '#6a6470'); }
    const px = Math.round(mid - 110 * K); for (const dx of [0, 24]) { pc(px + dx, gy - 10, 11, '#2b1b24'); pc(px + dx, gy - 10, 10, '#a0a6b0'); pc(px + dx, gy - 10, 6, '#4a4450'); }
    fr(0, gy - 4, SW, SH - gy + 4, '#c8a070'); for (let i = 0; i < 40; i++) { const x = (i * 47) % SW, y = gy + 2 + (i * 11) % (SH - gy - 4); if (i % 3) fr(x, y, 2, 1, '#b08a5a'); else { fr(x, y - 2, 1, 3, '#5aa845'); fr(x + 2, y - 1, 1, 2, '#5aa845'); } }
  } else if (mode === 'kdusk') {
    // 집으로 가는 길 (노을): 노을 하늘 · 지는 해 · 집들 실루엣 불빛 · 가로등 · 전깃줄
    band(SW, 0, gy - 10, ['#6a4a9a', '#c060a0', '#ff7a8a', '#ffa86a', '#ffc87a']); pc(mid - 30 * K, gy - 22, 16, '#fff0a0'); pc(mid - 30 * K, gy - 22, 13, '#ffd860');
    for (let i = 0; i < 8; i++) { const x = Math.round(mid - 200 * K + i * 52 * K), h = 34 + (i * 13) % 20; fr(x, gy - 6 - h, 44, h, '#4a3058'); fr(x + 6, gy - 12 - h, 32, 8, '#4a3058'); for (let k = 0; k < 2; k++) fr(x + 8 + k * 18, gy - h + 4, 8, 7, (i + k) % 3 ? '#ffd86a' : '#ffeaa8'); }
    for (const lx of [Math.round(mid - 90 * K), Math.round(mid + 80 * K)]) { fr(lx, gy - 60, 3, 56, '#2b1b24'); fr(lx - 4, gy - 64, 11, 5, '#2b1b24'); fr(lx - 3, gy - 63, 9, 3, '#fff6b0'); ctx.globalCompositeOperation = 'lighter'; pc(lx + 1, gy - 58, 16, 'rgba(255,230,150,0.18)'); ctx.globalCompositeOperation = 'source-over'; }
    pxLine(0, gy - 74, SW, gy - 70, '#2b1b24'); pxLine(0, gy - 68, SW, gy - 65, '#2b1b24');
    fr(0, gy - 4, SW, SH - gy + 4, '#5a4a5a'); fr(0, gy - 4, SW, 6, '#8a7a7a'); for (let x = 0; x < SW; x += 30) fr(x, gy + 16, 14, 2, '#c8b8a0');
  }
}
function drawKidActors(A, mid, gy, T) {
  const K = CUTK;
  if (A.case) { const x = Math.round(mid + A.case.x * K), y = gy; fr(x - 11, y - 17, 22, 17, '#2b1b24'); fr(x - 10, y - 16, 20, 15, '#ff9fcf'); fr(x - 10, y - 9, 20, 1, '#e8608a'); fr(x - 4, y - 21, 8, 4, '#2b1b24'); fr(x - 3, y - 20, 6, 2, '#ff9fcf'); fr(x - 7, y - 14, 4, 3, '#ffd84a'); fr(x + 3, y - 6, 4, 3, '#6fb8ff'); if (A.case.rod) { pxLine(x + 6, y - 16, x + 22, y - 44, '#3a3a46'); fr(x + 4, y - 18, 3, 4, '#c98a3a'); } }
  if (A.dad) { const x = Math.round(mid + A.dad.x * K); shadow(x, gy, 12); drawSpr(dadSpr(), x, gy, { flip: !!A.dad.flip });
    if (A.dad.plane) { const px = x - 12, py = gy - 10; pxLine(px - 10, py, px + 2, py - 6, '#2b1b24', 3); pxLine(px - 9, py - 1, px + 1, py - 5, A.dad.done ? '#f0d090' : '#c8945a', 1); for (let i = 0; i < 5; i++) { const p = (T * 1.5 + i / 5) % 1; fr(px - 6 + Math.sin(i * 3 + T * 4) * 6, py - 2 - p * 14, 2, 1, '#f0d0a0'); } } }
  if (A.bros) for (const b of A.bros) { const x = Math.round(mid + b.x * K), y = gy + (b.y || 0); shadow(x, y, 10); drawSpr(broSpr(b.v), x, y, { flip: !!b.flip }); if (b.stick) { const sw = Math.round(Math.sin(T * 6 + b.x) * 2); pxLine(x + (b.flip ? 6 : -6), y - 8, x + (b.flip ? 12 : -12) + sw, y - 24, '#2b1b24', 2); pxLine(x + (b.flip ? 6 : -6), y - 9, x + (b.flip ? 11 : -11) + sw, y - 23, '#d8a868'); } }
  if (A.hee && (A.hee.plank || A.hee.sword)) { const hx = Math.round(mid + A.hee.x * K) + 7, hy = gy - 7;
    if (A.hee.sword) { pxLine(hx, hy, hx + 7, hy - 16, '#2b1b24', 3); pxLine(hx + 1, hy - 1, hx + 7, hy - 15, '#f0d090'); fr(hx - 3, hy - 2, 7, 2, '#2b1b24'); fr(hx - 2, hy - 2, 5, 1, '#8a5a3a'); if (Math.floor(T * 3) % 3 === 0) fr(hx + 7, hy - 17, 2, 2, '#fff6b0'); }
    else { pxLine(hx - 1, hy + 1, hx + 9, hy - 13, '#2b1b24', 4); pxLine(hx, hy + 1, hx + 8, hy - 11, '#c8945a', 2); pxLine(hx + 1, hy, hx + 8, hy - 11, '#e0b880'); } }
}

// ---------- 이야기 ----------
const KID = { x: -22, pose: 'idle', dir: 'down', kid: true };
const CH5_PROLOGUE = [
  { scene: 'kroom', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -24, pose: 'idle', dir: 'down' }, hus: { x: 26 }, case: { x: 58, rod: true }, bori: { x: -50, pose: 'sit', face: 1, y: 2 } }); },
    delay: 0.8, lines: [
      { who: 'sys', text: tt('chapters/ch5.4') },
      { who: 'hee', text: tt('chapters/ch5.5') },
      { who: 'hus', text: tt('chapters/ch5.6') },
      { who: 'hee', text: tt('chapters/ch5.7'), do() { A_().hee.shake = true; A_().hee.alert = true; } },
      { who: 'hus', text: tt('chapters/ch5.8') },
      { who: 'hee', text: tt('chapters/ch5.9'), do() { A_().hee.shake = false; A_().hee.alert = false; A_().aura = true; sfx('ult'); } },
      { who: 'sys', text: tt('chapters/ch5.10'), do() { A_().aura = false; A_().case.rod = false; } }] },
  { scene: 'kalley', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: Object.assign({}, KID, { plank: true }), bros: [{ x: 44, v: 0 }, { x: 70, v: 1, flip: true }] }); },
    delay: 0.8, lines: [
      { who: 'sys', text: tt('chapters/ch5.11') },
      { who: 'kid', text: tt('chapters/ch5.12') },
      { who: 'kid', text: tt('chapters/ch5.13'), do() { A_().sparkle = true; sfx('ding'); } },
      { who: 'bro', text: tt('chapters/ch5.14'), do() { A_().sparkle = false; } },
      { who: 'kid', text: tt('chapters/ch5.15'), do() { A_().bros = []; sfx('pop'); } },
      { who: 'kid', text: tt('chapters/ch5.16') },
      { who: 'sys', text: tt('chapters/ch5.17') },
      { who: 'kid', text: tt('chapters/ch5.18'), do() { A_().hee.sweat = true; } },
      { who: 'kid', text: tt('chapters/ch5.19') },
      { who: 'sys', text: tt('chapters/ch5.20'), do() { const t = G.time; A_().hee.sweat = false; A_().mons = [{ type: 'shadowkid', x: 70, y: 4, t0: t }, { type: 'dust', x: -84, y: -20, t0: t + 0.3 }, { type: 'can', x: 96, y: 8, t0: t + 0.5 }]; sfx('pop'); } },
      { who: 'kid', text: tt('chapters/ch5.21'), do() { A_().hee.fist = true; sfx('smash'); } }] },
  { dur: 0.4 }
];
const CH5_SHOP = [
  { scene: 'kshop', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: Object.assign({}, KID, { plank: true }), dad: { x: 30 } }); },
    delay: 0.6, lines: [
      { who: 'sys', text: tt('chapters/ch5.22') },
      { who: 'kid', text: tt('chapters/ch5.23'), do() { A_().sparkle = true; sfx('ding'); } },
      { who: 'dad', text: tt('chapters/ch5.24'), do() { A_().sparkle = false; } },
      { who: 'kid', text: tt('chapters/ch5.25') },
      { who: 'dad', text: tt('chapters/ch5.26') },
      { who: 'sys', text: tt('chapters/ch5.27') },
      { who: 'dad', text: tt('chapters/ch5.28') },
      { who: 'sys', text: tt('chapters/ch5.29'), do() { const t = G.time; A_().mons = [{ type: 'bobber', x: 72, y: -22, t0: t }, { type: 'lure', x: -86, y: 6, t0: t + 0.3 }, { type: 'worm', x: 96, y: 8, t0: t + 0.5 }]; G.shake = 4; sfx('pop'); } },
      { who: 'kid', text: tt('chapters/ch5.30'), do() { A_().hee.alert = true; A_().hee.shake = true; } },
      { who: 'dad', text: tt('chapters/ch5.31') },
      { who: 'kid', text: tt('chapters/ch5.32'), do() { A_().hee.alert = false; A_().hee.shake = false; A_().aura = true; sfx('ult'); } },
      { who: 'kid', text: tt('chapters/ch5.33'), do() { A_().aura = false; A_().hee.fist = true; sfx('smash'); } }] },
  { dur: 0.4 }
];
const CH5_LOT = [
  { scene: 'klot', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: Object.assign({}, KID, { plank: true }), bros: [{ x: 46, v: 0, stick: true, flip: true }, { x: 74, v: 1, stick: true, flip: true }] }); },
    delay: 0.6, lines: [
      { who: 'sys', text: tt('chapters/ch5.34') },
      { who: 'bro', text: tt('chapters/ch5.35') },
      { who: 'sys', text: tt('chapters/ch5.36') },
      { who: 'kid', text: tt('chapters/ch5.37'), do() { A_().hee.sweat = true; } },
      { who: 'dad', text: tt('chapters/ch5.38'), do() { A_().hee.sweat = false; A_().dad = { x: -60, plane: true }; A_().hee.plank = false; sfx('pop'); } },
      { who: 'sys', text: tt('chapters/ch5.39'), do() { A_().sparkle = true; G.shake = 2; } },
      { who: 'sys', text: tt('chapters/ch5.40'), do() { const A = A_(); A.dad.done = true; A.dad.plane = false; A.hee.sword = true; A.big = G.time + 0.2; A.bigText = tt('chapters/ch5.41'); A.bigCol = '#ffd84a'; sfx('lvl'); } },
      { who: 'dad', text: tt('chapters/ch5.42'), do() { A_().big = 0; } },
      { who: 'sys', text: tt('chapters/ch5.43') },
      { who: 'kid', text: tt('chapters/ch5.44'), do() { A_().sparkle = true; } },
      { who: 'bro', text: tt('chapters/ch5.45'), do() { A_().sparkle = false; } },
      { who: 'kid', text: tt('chapters/ch5.46'), do() { A_().hee.fist = true; sfx('smash'); } }] },
  { dur: 0.4 }
];
const CH5_HOME = [
  { scene: 'kdusk', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: Object.assign({}, KID, { sword: true }), bros: [{ x: 50, v: 0, stick: true, flip: true }, { x: 76, v: 1, stick: true, flip: true }] }); },
    delay: 0.6, lines: [
      { who: 'sys', text: tt('chapters/ch5.47') },
      { who: 'bro', text: tt('chapters/ch5.48') },
      { who: 'kid', text: tt('chapters/ch5.49'), do() { A_().bros = []; } },
      { who: 'kid', text: tt('chapters/ch5.50'), do() { A_().hee.sweat = true; } },
      { who: 'kid', text: tt('chapters/ch5.51'), do() { A_().hee.alert = true; } },
      { who: 'sys', text: tt('chapters/ch5.52'), do() { const t = G.time; A_().hee.sweat = false; A_().hee.alert = false; A_().mons = [{ type: 'tick', x: 70, y: 4, t0: t }, { type: 'moth', x: -86, y: -24, t0: t + 0.3 }, { type: 'nightshade', x: 96, y: 8, t0: t + 0.5 }]; sfx('pop'); } },
      { who: 'mon', text: tt('chapters/ch5.53') },
      { who: 'kid', text: tt('chapters/ch5.54'), do() { A_().aura = true; G.shake = 4; sfx('ult'); } },
      { who: 'kid', text: tt('chapters/ch5.55'), do() { A_().aura = false; A_().hee.fist = true; sfx('smash'); } }] },
  { dur: 0.4 }
];
const CH5_ENDING = [
  { scene: 'kmorn', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -24, pose: 'idle', dir: 'down' }, hus: { x: 26 }, case: { x: 58 } }); },
    delay: 0.8, lines: [
      { who: 'sys', text: tt('chapters/ch5.56'), do() { G.shake = 6; sfx('slam'); } },
      { who: 'hee', text: tt('chapters/ch5.57'), do() { A_().hee.alert = true; } },
      { who: 'hus', text: tt('chapters/ch5.58'), do() { A_().hee.alert = false; } },
      { who: 'hee', text: tt('chapters/ch5.59') },
      { who: 'hee', text: tt('chapters/ch5.60'), do() { A_().sparkle = true; A_().hee.sword = true; sfx('ding'); } },
      { who: 'sys', text: tt('chapters/ch5.61') },
      { who: 'hus', text: tt('chapters/ch5.62'), do() { A_().sparkle = false; } },
      { who: 'hee', text: tt('chapters/ch5.63') },
      { who: 'hus', text: tt('chapters/ch5.64') },
      { who: 'hee', text: tt('chapters/ch5.9'), do() { A_().aura = true; } },
      { who: 'bori', text: tt('chapters/ch5.65'), do() { A_().aura = false; A_().bori = { x: -50, pose: 'sit', face: 1, y: 2, jump: true }; sfx('bark'); } },
      { who: 'sys', text: tt('chapters/ch5.66'), do() { A_().big = G.time + 0.3; A_().bigText = tt('chapters/ch5.67'); A_().bigCol = '#ff7ab8'; sfx('lvl'); } }] },
  { dur: 1.0 }
];

// ---------- 스테이지 소품 ----------
function dFactory() { const c = mkCanvas(70, 46), g = c.getContext('2d'); pRect(g, 0, 6, 70, 40, OK); pRect(g, 1, 7, 68, 38, '#9a4a3a'); for (let y = 8; y < 44; y += 4) for (let x = (y / 4) % 2 ? 1 : 5; x < 68; x += 8) pRect(g, x, y, 7, 1, '#7a3628');
  for (let i = 0; i < 4; i++) { pRect(g, 5 + i * 16, 14, 12, 10, OK); pRect(g, 6 + i * 16, 15, 10, 8, '#ffd88a'); pRect(g, 11 + i * 16, 15, 1, 8, OK); } pRect(g, 0, 0, 70, 7, OK); pRect(g, 1, 1, 68, 5, '#6a6f7c'); pRect(g, 50, 30, 14, 16, OK); pRect(g, 51, 31, 12, 15, '#5a5f6c'); return c; }
function dPlanks() { const c = mkCanvas(26, 14), g = c.getContext('2d'); for (let i = 0; i < 4; i++) { pRect(g, i * 2, 10 - i * 3, 24 - i * 2, 4, OK); pRect(g, i * 2 + 1, 11 - i * 3, 22 - i * 2, 2, i % 2 ? '#c8945a' : '#d8a868'); } return c; }
function dDrum() { const c = mkCanvas(12, 16), g = c.getContext('2d'); pRect(g, 0, 0, 12, 16, OK); pRect(g, 1, 1, 10, 14, '#3a78c0'); pRect(g, 1, 4, 10, 1, '#2a5a98'); pRect(g, 1, 10, 10, 1, '#2a5a98'); pRect(g, 2, 1, 2, 14, '#6fb8ff'); return c; }
function dPole() { const c = mkCanvas(20, 56), g = c.getContext('2d'); pRect(g, 8, 0, 4, 56, OK); pRect(g, 9, 0, 2, 56, '#6a5a4a'); pRect(g, 0, 4, 20, 3, OK); pRect(g, 1, 5, 18, 1, '#6a5a4a'); pRect(g, 2, 2, 2, 2, '#c0c6d0'); pRect(g, 16, 2, 2, 2, '#c0c6d0'); return c; }
function dWorkBench() { const c = mkCanvas(34, 18), g = c.getContext('2d'); pRect(g, 0, 4, 34, 6, OK); pRect(g, 1, 5, 32, 4, '#d8a868'); pRect(g, 2, 10, 3, 8, OK); pRect(g, 29, 10, 3, 8, OK); pRect(g, 6, 0, 14, 5, OK); pRect(g, 7, 1, 12, 3, '#c0c6d0'); pRect(g, 19, 1, 3, 3, '#c98a3a'); pRect(g, 25, 1, 6, 4, OK); pRect(g, 26, 2, 4, 2, '#f0d0a0'); return c; }
function dLumber() { const c = mkCanvas(30, 26), g = c.getContext('2d'); for (let i = 0; i < 5; i++) { pRect(g, 0, 21 - i * 5, 30, 5, OK); pRect(g, 1, 22 - i * 5, 28, 3, i % 2 ? '#d8a868' : '#c8945a'); pRect(g, 2, 22 - i * 5, 3, 3, '#f0d0a0'); } return c; }
function dSawhorse() { const c = mkCanvas(20, 14), g = c.getContext('2d'); pRect(g, 0, 0, 20, 4, OK); pRect(g, 1, 1, 18, 2, '#c8945a'); for (let i = 0; i < 10; i++) { pRect(g, 3 - Math.round(i * 0.3), 4 + i, 2, 1, OK); pRect(g, 15 + Math.round(i * 0.3), 4 + i, 2, 1, OK); } return c; }
function dWindowSea() { const c = mkCanvas(30, 22), g = c.getContext('2d'); pRect(g, 0, 0, 30, 22, OK); pRect(g, 1, 1, 28, 9, '#9fd8ff'); pRect(g, 1, 10, 28, 11, '#3f8ad0'); for (let i = 0; i < 5; i++) pRect(g, 3 + i * 5, 13 + (i % 2) * 4, 3, 1, '#cfeaff'); pRect(g, 14, 1, 2, 20, OK); return c; }
function dTires() { const c = mkCanvas(24, 18), g = c.getContext('2d'); for (const [x, y] of [[6, 12], [17, 12], [11, 6]]) { pCirc(g, x, y, 6, OK); pCirc(g, x, y, 5, '#3a3440'); pCirc(g, x, y, 2, '#6a6470'); } return c; }
function dPipe() { const c = mkCanvas(22, 20), g = c.getContext('2d'); pCirc(g, 11, 10, 10, OK); pCirc(g, 11, 10, 9, '#a0a6b0'); pCirc(g, 11, 10, 5, '#4a4450'); pRect(g, 4, 4, 3, 2, '#c8ccd4'); return c; }
function dFence() { const c = mkCanvas(40, 22), g = c.getContext('2d'); pRect(g, 0, 0, 40, 22, OK); for (let x = 1; x < 39; x += 6) { pRect(g, x, 1, 5, 20, '#3a78c0'); pRect(g, x, 1, 5, 2, '#6fb8ff'); } return c; }
function dSwingset() { const c = mkCanvas(30, 30), g = c.getContext('2d'); pRect(g, 0, 0, 30, 3, OK); pRect(g, 1, 1, 28, 1, '#e8414f'); for (let i = 0; i < 27; i++) { pRect(g, 2 - Math.round(i * 0.07), 3 + i, 2, 1, OK); pRect(g, 26 + Math.round(i * 0.07), 3 + i, 2, 1, OK); } pRect(g, 9, 3, 1, 18, '#6a6470'); pRect(g, 20, 3, 1, 18, '#6a6470'); pRect(g, 7, 21, 16, 3, OK); pRect(g, 8, 22, 14, 1, '#ffd84a'); return c; }
function dStreetLamp() { const c = mkCanvas(12, 46), g = c.getContext('2d'); pRect(g, 5, 6, 3, 40, OK); pRect(g, 0, 0, 12, 7, OK); pRect(g, 1, 1, 10, 5, '#fff6b0'); pRect(g, 3, 44, 7, 2, OK); return c; }
function dTownHouse(col) { const c = mkCanvas(40, 34), g = c.getContext('2d'); for (let y = 0; y < 12; y++) { const w = Math.round(6 + y * 2.8); pRect(g, 20 - Math.round(w / 2) - 1, y, w + 2, 1, OK); pRect(g, 20 - Math.round(w / 2), y, w, 1, col); }
  pRect(g, 2, 12, 36, 22, OK); pRect(g, 3, 12, 34, 21, '#f4e6d0'); pRect(g, 7, 17, 9, 8, OK); pRect(g, 8, 18, 7, 6, '#ffd86a'); pRect(g, 24, 20, 9, 13, OK); pRect(g, 25, 21, 7, 12, '#a0683e'); pRect(g, 30, 27, 1, 1, '#ffd84a'); return c; }

// ---------- 스테이지 바닥·소품 배치 ----------
function groundAlley(X) {
  const { g, R, cx } = X;
  // 공장 옆 골목: 아스팔트 + 금 간 자국 + 물웅덩이 + 바랜 노란 선
  g.fillStyle = '#6e6874'; g.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let i = 0; i < 400; i++) { g.fillStyle = R() < 0.5 ? '#625c68' : '#7a7480'; g.fillRect(Math.floor(R() * WORLD_W), Math.floor(R() * WORLD_H), 2, 1); }
  for (let i = 0; i < 40; i++) { let x = Math.floor(R() * WORLD_W), y = Math.floor(R() * WORLD_H); g.fillStyle = '#4e4854'; for (let k = 0; k < 8; k++) { g.fillRect(x, y, 2, 1); x += Math.round(R() * 4 - 1); y += Math.round(R() * 2); } }
  for (let i = 0; i < 10; i++) { const x = Math.floor(R() * WORLD_W), y = Math.floor(R() * WORLD_H); g.fillStyle = '#5a6a88'; g.fillRect(x - 8, y - 2, 16, 5); g.fillStyle = '#8a9ab8'; g.fillRect(x - 5, y - 1, 6, 1); }
  g.fillStyle = '#b8a860'; for (let y = 0; y < WORLD_H; y += 30) { g.fillRect(cx - 40, y, 2, 16); g.fillRect(cx + 38, y, 2, 16); }
}
function decorAlley(X) {
  const { add, scatter, cx } = X;
  const fac = dFactory(); for (let y = 150; y < WORLD_H - 120; y += 150) { add(fac, 48, y, 0, 0, { glow: '#ffd88a' }); add(fac, WORLD_W - 48, y + 75, 0, 0, { glow: '#ffd88a' }); }
  for (let y = 130; y < WORLD_H - 80; y += 120) add(dPole(), cx + (y % 240 ? 64 : -64), y, 3, 8);
  scatter(7, () => dPlanks(), 6, 14, { avoidBoss: true }); scatter(6, () => dDrum(), 5, 12, { avoidBoss: true });
}
function groundShop(X) {
  const { g, R, cx } = X;
  // 아빠 목공소: 나무 마루 + 톱밥
  for (let y = 0; y < WORLD_H; y += 10) { g.fillStyle = (y / 10) % 2 ? '#c8945a' : '#bc8a52'; g.fillRect(0, y, WORLD_W, 10); g.fillStyle = '#a87438'; g.fillRect(0, y, WORLD_W, 1); for (let x = ((y / 10) % 3) * 23; x < WORLD_W; x += 70) g.fillRect(x, y, 1, 10); }
  for (let i = 0; i < 500; i++) { g.fillStyle = R() < 0.6 ? '#f0d8a8' : '#e0c090'; g.fillRect(Math.floor(R() * WORLD_W), Math.floor(R() * WORLD_H), 2, 1); }
  g.fillStyle = '#d8a868'; g.fillRect(cx - 22, 0, 44, WORLD_H); g.fillStyle = '#a87438'; g.fillRect(cx - 22, 0, 1, WORLD_H); g.fillRect(cx + 21, 0, 1, WORLD_H);
}
function decorShop(X) {
  const { add, scatter } = X;
  for (const x of [90, WORLD_W - 90]) add(dWindowSea(), x, 92, 0, 0, { glow: '#bfe4ff' });
  for (let y = 170; y < WORLD_H - 90; y += 120) { add(dWorkBench(), 62, y, 12, 10); add(dWorkBench(), WORLD_W - 62, y + 60, 12, 10); }
  scatter(5, () => dLumber(), 10, 16, { avoidBoss: true }); scatter(5, () => dSawhorse(), 6, 14, { avoidBoss: true });
}
function groundKidLot(X) {
  const { g, R } = X;
  // 동네 공터: 흙바닥 + 풀 · 자갈
  g.fillStyle = '#c8a070'; g.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let i = 0; i < 600; i++) { const x = Math.floor(R() * WORLD_W), y = Math.floor(R() * WORLD_H), k = R(); g.fillStyle = k < 0.45 ? '#b8905e' : k < 0.75 ? '#d8b080' : k < 0.9 ? '#a0a6b0' : '#5aa845'; if (k >= 0.9) { g.fillRect(x, y - 2, 1, 3); g.fillRect(x + 2, y - 1, 1, 2); } else g.fillRect(x, y, 2, 1); }
  for (let i = 0; i < 6; i++) { const x = Math.floor(R() * WORLD_W), y = 120 + Math.floor(R() * (WORLD_H - 240)); g.fillStyle = 'rgba(90,60,30,0.25)'; g.fillRect(x - 20, y, 40, 1); g.fillRect(x - 14, y + 3, 28, 1); } // 칼싸움 발자국 자국
}
function decorKidLot(X) {
  const { add, scatter, cx } = X;
  for (let x = 40; x < WORLD_W - 30; x += 44) if (Math.abs(x - cx) > 60) add(dFence(), x, 86, 0, 0);
  add(dSwingset(), 70, 200, 8, 14); add(dSwingset(), WORLD_W - 70, 320, 8, 14);
  scatter(5, () => dTires(), 8, 16, { avoidBoss: true }); scatter(4, () => dPipe(), 9, 16, { avoidBoss: true });
}
function groundDusk(X) {
  const { g, R, cx } = X;
  // 집으로 가는 길: 노을빛 아스팔트 + 보도블록
  g.fillStyle = '#6a5260'; g.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let i = 0; i < 300; i++) { g.fillStyle = R() < 0.5 ? '#5e4856' : '#7a6070'; g.fillRect(Math.floor(R() * WORLD_W), Math.floor(R() * WORLD_H), 2, 1); }
  for (const x0 of [0, WORLD_W - 70]) for (let y = 0; y < WORLD_H; y += 10) for (let x = x0 + ((y / 10) % 2) * 5; x < x0 + 70; x += 10) { g.fillStyle = '#b8a090'; g.fillRect(x, y, 9, 9); g.fillStyle = '#c8b0a0'; g.fillRect(x, y, 9, 1); }
  g.fillStyle = '#e8d8b0'; for (let y = 0; y < WORLD_H; y += 28) g.fillRect(cx - 1, y, 3, 14);
}
function decorDusk(X) {
  const { add, scatter } = X;
  const cols = ['#c0504a', '#3a78c0', '#5aa845', '#8a5aa8']; for (let y = 130; y < WORLD_H - 60; y += 70) { add(dTownHouse(cols[(y / 70) % 4 | 0]), 34, y, 0, 0, { glow: '#ffd86a' }); add(dTownHouse(cols[((y / 70) + 2) % 4 | 0]), WORLD_W - 34, y + 35, 0, 0, { glow: '#ffd86a' }); }
  for (let y = 160; y < WORLD_H - 80; y += 140) { add(dStreetLamp(), 84, y, 3, 8, { glow: '#fff0a0' }); add(dStreetLamp(), WORLD_W - 84, y + 70, 3, 8, { glow: '#fff0a0' }); }
  scatter(3, () => dTires(), 8, 16, { avoidBoss: true });
}

regChapter({
  c: 5, name: tt('chapters/ch5.68'), title: tt('chapters/ch5.69'), pick: [tt('chapters/ch5.70'), tt('chapters/ch5.70')], lv: 50, baseL: 28, // 4장 5회차 수준
  kid: true, noBori: true, onZone: ch5OnZone, gate: ch5Gate,
  zones: [
    { name: tt('chapters/ch5.71'), sub: 'STAGE 17', quota: 38, max: 13, spawnInt: 1.1, mons: [['shadowkid', 5], ['dust', 4], ['can', 3]], boss: 'tagger', theme: 'alley', next: tt('chapters/ch5.72') },
    { name: tt('chapters/ch5.72'), sub: 'STAGE 18', quota: 40, max: 13, spawnInt: 1.1, mons: [['bobber', 4], ['lure', 4], ['worm', 3], ['reel', 3]], boss: 'fishdream', theme: 'woodshop', next: tt('chapters/ch5.73') },
    { name: tt('chapters/ch5.73'), sub: 'STAGE 19', quota: 42, max: 14, spawnInt: 1.05, mons: [['kidbro', 5], ['slingbro', 3], ['ddakji', 3], ['kite', 3]], boss: 'bigbro', theme: 'lot', next: tt('chapters/ch5.74') },
    { name: tt('chapters/ch5.74'), sub: 'FINAL STAGE', quota: 44, max: 14, spawnInt: 1.05, mons: [['nightshade', 4], ['moth', 4], ['tick', 4], ['dust', 2]], boss: 'snooze', theme: 'dusk', next: '' },
  ],
  mons: {
    shadowkid:  { name: tt('chapters/ch5.75'),   spr: 'shadowkid',  hp: 1250, atk: 96,  def: 16, spd: 56, xp: 190, gold: [44, 60], r: 6, ai: 'charge', col: '#1e1a24' },
    dust:       { name: tt('chapters/ch5.76'), spr: 'dust',       hp: 1050, atk: 90,  def: 14, spd: 46, xp: 180, gold: [42, 58], r: 6, ai: 'float', col: '#6a6f7c', fly: 1 },
    can:        { name: tt('chapters/ch5.77'),  spr: 'can',        hp: 1500, atk: 98,  def: 20, spd: 32, xp: 190, gold: [44, 60], r: 6, ai: 'hop', col: '#e8414f' },
    bobber:     { name: tt('chapters/ch5.78'),       spr: 'bobber',     hp: 1150, atk: 96,  def: 15, spd: 50, xp: 195, gold: [46, 62], r: 6, ai: 'float', col: '#e8414f', fly: 1 },
    lure:       { name: tt('chapters/ch5.79'),      spr: 'lure',       hp: 1200, atk: 110, def: 15, spd: 58, xp: 200, gold: [46, 62], r: 6, ai: 'charge', col: '#6fb8ff' },
    worm:       { name: tt('chapters/ch5.80'),    spr: 'worm',       hp: 1700, atk: 100, def: 20, spd: 30, xp: 200, gold: [46, 62], r: 6, ai: 'hop', col: '#ffb3d9' },
    reel:       { name: tt('chapters/ch5.81'),       spr: 'reel',       hp: 1300, atk: 104, def: 17, spd: 30, xp: 200, gold: [46, 62], r: 6, ai: 'ranged', proj: 'water', col: '#a0a6b0' },
    kidbro:     { name: tt('chapters/ch5.82'),      spr: 'kidbro',     hp: 1800, atk: 104, def: 22, spd: 40, xp: 205, gold: [48, 64], r: 7, ai: 'chase', col: '#6fb8ff', stick: 1 },
    slingbro:   { name: tt('chapters/ch5.83'),       spr: 'slingbro',   hp: 1350, atk: 106, def: 16, spd: 32, xp: 205, gold: [48, 64], r: 6, ai: 'ranged', proj: 'pebble', col: '#5aa845' },
    ddakji:     { name: tt('chapters/ch5.84'),        spr: 'ddakji',     hp: 1600, atk: 102, def: 20, spd: 34, xp: 200, gold: [48, 64], r: 6, ai: 'hop', col: '#e8414f' },
    kite:       { name: tt('chapters/ch5.85'),        spr: 'kite',       hp: 1150, atk: 100, def: 14, spd: 52, xp: 200, gold: [48, 64], r: 6, ai: 'float', col: '#ffd84a', fly: 1 },
    nightshade: { name: tt('chapters/ch5.86'),    spr: 'nightshade', hp: 2000, atk: 108, def: 22, spd: 36, xp: 210, gold: [50, 66], r: 7, ai: 'chase', col: '#7a2fc0' },
    moth:       { name: tt('chapters/ch5.87'),    spr: 'moth',       hp: 1200, atk: 104, def: 14, spd: 56, xp: 205, gold: [50, 66], r: 6, ai: 'float', col: '#e3c9a0', fly: 1 },
    tick:       { name: tt('chapters/ch5.88'),      spr: 'tick',       hp: 1450, atk: 106, def: 18, spd: 38, xp: 210, gold: [50, 66], r: 6, ai: 'hop', col: '#ffd84a' },
    tagger:     { name: tt('chapters/ch5.89'),    spr: 'shadowkid',  scale: 3.4, crown: 1, hp: 38000, atk: 100, def: 24, spd: 34, xp: 10500, gold: [2200, 2500], r: 22, ai: 'tagger', boss: 1, col: '#1e1a24' },
    fishdream:  { name: tt('chapters/ch5.90'),      spr: 'ghostfish',  scale: 3.0, crown: 1, hp: 46000, atk: 108, def: 26, spd: 30, xp: 12000, gold: [2400, 2700], r: 24, ai: 'fishdream', boss: 1, col: '#b45cff', fly: 1 },
    bigbro:     { name: tt('chapters/ch5.91'),    spr: 'bigbro',     scale: 3.4, crown: 1, hp: 54000, atk: 116, def: 28, spd: 30, xp: 14000, gold: [2600, 2900], r: 22, ai: 'bigbro', boss: 1, col: '#e8414f', stick: 1 },
    snooze:     { name: tt('chapters/ch5.92'),  spr: 'clock',      scale: 3.4, crown: 1, hp: 66000, atk: 124, def: 30, spd: 26, xp: 19000, gold: [0, 0],       r: 26, ai: 'snooze', boss: 1, col: '#e8414f' },
  },
  ai: {
    // 술래 그림자: 숨기(반투명) → 희수 자리 예고 원 → 「찾았다!」 튀어나옴 · 조약돌 소용돌이 · 숨은 그림자 호출
    tagger(e, dt, sp) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt;
      if (e.st === 'idle') { e.st = 'roam'; e.stT = 1.6; e.cyc = 0; e.ghost = null; }
      if (e.st === 'roam') { moveToward(e, G.P.x, G.P.y, sp, dt); e.face = G.P.x > e.x ? -1 : 1;
        if (e.stT <= 0) { e.cyc++; const pat = ['hide', 'spin', 'hide', 'call'][e.cyc % 4]; e.st = pat;
          if (pat === 'hide') { e.stT = enr ? 1.1 : 1.4; e.ghost = 0.18; e.mark = null; bubble(e, choice([tt('chapters/ch5.93'), tt('chapters/ch5.94'), tt('chapters/ch5.95')]), 1.2); }
          if (pat === 'spin') { e.stT = 2.2; e.shT = 0; e.sa = rand(0, 6.28); bubble(e, tt('chapters/ch5.96'), 1.2); }
          if (pat === 'call') { e.stT = 0.6; for (let i = 0; i < (enr ? 4 : 3); i++) spawnEnemy('shadowkid', e.x + rand(-50, 50), e.y + rand(-10, 30)); bubble(e, tt('chapters/ch5.97'), 1.2); } } return; }
      if (e.st === 'hide') {
        if (!e.mark && e.stT < 0.85) { e.mark = { x: G.P.x, y: clamp(G.P.y, (G.world.top || 34) + 20, G.world.H - 30) }; G.fx.push({ k: 'circle', x: e.mark.x, y: e.mark.y, r: 46, t: 0, dur: e.stT }); }
        if (e.stT <= 0) { const m = e.mark || { x: G.P.x, y: G.P.y }; burst(e.x, e.y, '#4a4450', 10, 60); e.x = m.x; e.y = m.y; e.mark = null; e.ghost = null; burst(e.x, e.y, '#ffffff', 16, 90); G.shake = 6; sfx('slam');
          G.fx.push({ k: 'ring', x: e.x, y: e.y - 4, r: 46, col: '#b45cff', t: 0, dur: 0.4 }); if (Math.hypot(G.P.x - e.x, G.P.y - e.y) < 50) hurtPlayer(e.atk * 1.4, e); bubble(e, tt('chapters/ch5.98'), 1); } }
      if (e.st === 'spin') { e.shT -= dt; if (e.shT <= 0) { e.shT = enr ? 0.1 : 0.14; e.sa += 0.5; shootAt(e, 'pebble', e.sa, 72); if (enr) shootAt(e, 'pebble', e.sa + Math.PI, 72); } }
      if (e.stT <= 0) { e.st = 'roam'; e.stT = enr ? 1.1 : 1.8; e.ghost = null; }
    },
    // 월척 사념: 낚싯줄 3갈래(예고 선) · 수면 박차고 내려찍기(예고 원) · 찌·루어 사념 호출 (둥둥 떠다님)
    fishdream(e, dt, sp) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt; if (e.st !== 'leap') e.hopY = 8 + Math.sin(e.t * 2.4) * 4;
      if (e.st === 'idle') { e.st = 'roam'; e.stT = 1.8; e.cyc = 0; }
      if (e.st === 'roam') { moveToward(e, G.P.x, G.P.y - 24, sp, dt); e.face = G.P.x > e.x ? -1 : 1;
        if (e.stT <= 0) { e.cyc++; const pat = ['cast', 'leap', 'cast', 'call'][e.cyc % 4]; e.st = pat;
          if (pat === 'cast') { e.stT = enr ? 0.8 : 1.0; const a = Math.atan2(G.P.y - e.y, G.P.x - e.x); e.las = enr ? [a, a - 0.45, a + 0.45, a + Math.PI] : [a, a - 0.55, a + 0.55]; for (const l of e.las) G.fx.push({ k: 'line', x: e.x, y: e.y - 6, a: l, len: 220, w: 24, t: 0, dur: e.stT }); bubble(e, choice([tt('chapters/ch5.99'), tt('chapters/ch5.100'), tt('chapters/ch5.101')]), 1.1); }
          if (pat === 'leap') { e.stT = enr ? 0.9 : 1.1; e.tx = G.P.x; e.ty = G.P.y; e.jx = e.x; e.jy = e.y; e.jT = e.stT; G.fx.push({ k: 'circle', x: e.tx, y: e.ty, r: 52, t: 0, dur: e.stT }); bubble(e, tt('chapters/ch5.102'), 1.0); }
          if (pat === 'call') { e.stT = 0.6; for (let i = 0; i < (enr ? 4 : 3); i++) spawnEnemy(i % 2 ? 'lure' : 'bobber', e.x + rand(-50, 50), e.y + rand(0, 30)); bubble(e, tt('chapters/ch5.103'), 1.2); } } return; }
      if (e.st === 'cast' && e.stT <= 0) { G.shake = 5; sfx('slam'); const d = Math.hypot(G.P.x - e.x, G.P.y - e.y), pa = Math.atan2(G.P.y - e.y, G.P.x - e.x);
        for (const l of e.las || []) { burst(e.x + Math.cos(l) * 60, e.y + Math.sin(l) * 60, '#e8e8f0', 8, 110); const da = Math.abs(((pa - l + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (d < 225 && Math.sin(da) * d < 14 && da < Math.PI / 2) { hurtPlayer(e.atk * 1.45, e); break; } } }
      if (e.st === 'leap') { const p = 1 - Math.max(0, e.stT) / e.jT; e.x = lerp(e.jx, e.tx, p); e.y = lerp(e.jy, e.ty, p); e.hopY = Math.sin(p * Math.PI) * 70;
        if (e.stT <= 0) { e.hopY = 0; G.shake = 8; sfx('slam'); burst(e.x, e.y, '#6fb8ff', 18, 100); G.fx.push({ k: 'ring', x: e.x, y: e.y - 4, r: 52, col: '#6fb8ff', t: 0, dur: 0.4 }); if (Math.hypot(G.P.x - e.x, G.P.y - e.y) < 52) hurtPlayer(e.atk * 1.6, e); } }
      if (e.stT <= 0) { e.st = 'roam'; e.stT = enr ? 1.1 : 1.8; }
    },
    // 골목대장 형: 나무 칼 휘두르기(자기 둘레 예고 원) · 「덤벼!」 돌진 · 나무 조각 부채꼴 · 칼싸움 형·새총 형 호출
    bigbro(e, dt, sp) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt;
      if (e.st === 'idle') { e.st = 'roam'; e.stT = 1.6; e.cyc = 0; }
      if (e.st === 'roam') { moveToward(e, G.P.x, G.P.y, sp, dt); e.face = G.P.x > e.x ? -1 : 1;
        if (e.stT <= 0) { e.cyc++; const pat = ['slash', 'dash', 'chips', 'slash', 'call'][e.cyc % 5];
          if (pat === 'slash') { e.st = 'slash'; e.stT = enr ? 0.7 : 0.9; G.fx.push({ k: 'circle', x: e.x, y: e.y, r: 64, t: 0, dur: e.stT }); bubble(e, choice([tt('chapters/ch5.104'), tt('chapters/ch5.105'), tt('chapters/ch5.106')]), 1.1); }
          if (pat === 'dash') { e.st = 'tele'; e.stT = 0.7; aimDash(e, 300, e.r * 1.3, choice([tt('chapters/ch5.107'), tt('chapters/ch5.108')])); }
          if (pat === 'chips') { e.st = 'chips'; e.stT = 0.5; bubble(e, tt('chapters/ch5.109'), 1.1); }
          if (pat === 'call') { e.st = 'call'; e.stT = 0.6; for (let i = 0; i < (enr ? 4 : 3); i++) spawnEnemy(i % 2 ? 'slingbro' : 'kidbro', e.x + rand(-50, 50), e.y + rand(0, 30)); bubble(e, tt('chapters/ch5.110'), 1.2); } } return; }
      if (e.st === 'slash' && e.stT <= 0) { G.shake = 7; sfx('slam'); burst(e.x, e.y - 10, '#f0d090', 18, 120); G.fx.push({ k: 'ring', x: e.x, y: e.y - 4, r: 64, col: '#ffd84a', t: 0, dur: 0.35 }); if (Math.hypot(G.P.x - e.x, G.P.y - e.y) < 64) hurtPlayer(e.atk * 1.5, e); }
      if (e.st === 'tele') { if (e.stT <= 0) { e.st = 'dash'; e.stT = 1.0; } return; }
      if (e.st === 'dash') { e.hopY = Math.abs(Math.sin(e.t * 16)) * 3; if (dashStep(e, 260, dt) || e.stT <= 0) { e.hopY = 0; e.st = 'roam'; e.stT = enr ? 1.0 : 1.6; G.shake = 4; } return; }
      if (e.st === 'chips' && e.stT <= 0) { const a0 = Math.atan2(G.P.y - e.y, G.P.x - e.x), n = enr ? 9 : 7; for (let i = 0; i < n; i++) shootAt(e, 'chip', a0 + (i - (n - 1) / 2) * 0.2, 94); sfx('pop'); }
      if (e.stT <= 0) { e.st = 'roam'; e.stT = enr ? 1.1 : 1.8; }
    },
    // 5분만 더 시계: 잠 오는 Zzz 두 갈래 소용돌이 · 가짜 알람(희수 자리 예고 원 여러 개) · 째깍 시계 호출 — 희수를 꿈속에 붙잡아 두려 함
    snooze(e, dt, sp) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt; e.hopY = 3 + Math.abs(Math.sin(e.t * (e.st === 'ring' ? 18 : 2))) * (e.st === 'ring' ? 3 : 2);
      if (e.st === 'idle') { e.st = 'roam'; e.stT = 2; e.cyc = 0; }
      if (e.st === 'roam') { moveToward(e, G.P.x, G.P.y - 20, sp, dt);
        if (e.stT <= 0) { e.cyc++; const pat = ['zzz', 'ring', 'zzz', 'call'][e.cyc % 4]; e.st = pat; e.shT = 0;
          if (pat === 'zzz') { e.stT = 2.6; e.sa = rand(0, 6.28); bubble(e, choice([tt('chapters/ch5.111'), tt('chapters/ch5.112'), tt('chapters/ch5.113')]), 1.3); }
          if (pat === 'ring') { e.stT = 1.1; e.marks = []; const n = enr ? 5 : 3; for (let i = 0; i < n; i++) { const m = { x: G.P.x + (i ? rand(-80, 80) : 0), y: clamp(G.P.y + (i ? rand(-60, 60) : 0), (G.world.top || 34) + 20, G.world.H - 30) }; e.marks.push(m); G.fx.push({ k: 'circle', x: m.x, y: m.y, r: 34, t: 0, dur: 1.1 }); } bubble(e, tt('chapters/ch5.114'), 1.2); }
          if (pat === 'call') { e.stT = 0.6; for (let i = 0; i < (enr ? 4 : 3); i++) spawnEnemy('tick', e.x + rand(-50, 50), e.y + rand(10, 40)); bubble(e, tt('chapters/ch5.115'), 1.2); } } return; }
      if (e.st === 'zzz') { e.shT -= dt; if (e.shT <= 0) { e.shT = enr ? 0.11 : 0.15; e.sa += 0.42; shootAt(e, 'zzz', e.sa, 66); shootAt(e, 'zzz', e.sa + Math.PI, 66); } }
      if (e.st === 'ring' && e.stT <= 0) { G.shake = 6; sfx('slam'); for (const m of e.marks || []) { G.fx.push({ k: 'ring', x: m.x, y: m.y, r: 34, col: '#ffd84a', t: 0, dur: 0.35 }); burst(m.x, m.y, '#ffd84a', 10, 80); if (Math.hypot(G.P.x - m.x, G.P.y - m.y) < 34) hurtPlayer(e.atk * 1.4, e); } }
      if (e.stT <= 0) { e.st = 'roam'; e.stT = enr ? 1.2 : 1.9; }
    }
  },
  themes: {
    alley: { bg: '#6e6874', hedge: ['#8a7a7a', '#a09090', '#5a4a4a'], tint: [80, 30, 70, 0.12], glow: 0.35, wall: 1, ground: groundAlley, decor: decorAlley },
    woodshop: { bg: '#c8945a', hedge: ['#a87438', '#c8945a', '#7a5428'], tint: [70, 40, 10, 0.06], glow: 0.2, wall: 1, ground: groundShop, decor: decorShop },
    lot: { bg: '#c8a070', hedge: ['#4f9a3f', '#7ccf5a', '#3f7a30'], tint: [40, 40, 10, 0.03], glow: 0.1, ground: groundKidLot, decor: decorKidLot },
    dusk: { bg: '#6a5260', hedge: ['#5a3a58', '#7a5a78', '#3a2440'], tint: [110, 40, 60, 0.16], glow: 0.55, wall: 1, ground: groundDusk, decor: decorDusk },
  },
  items: {
    woodplank: { slot: 'weapon', name: tt('chapters/ch5.116'), rar: 0, atk: 6, icon: 'plank', quest: 1, memory: 1, bossOnly: 1, ch: 5, w: { reach: 24, arc: 140, mul: 1, rate: 2.0, kb: 120, style: 'swing' }, desc: tt('chapters/ch5.117') },
    woodsword: { slot: 'weapon', name: tt('chapters/ch5.118'), rar: 5, atk: 86, crit: 0.08, icon: 'woodsword', tier: 6, quest: 1, bossOnly: 1, ch: 5, w: { reach: 28, arc: 160, mul: 1, rate: 2.2, kb: 170, style: 'swing' }, desc: tt('chapters/ch5.119') },
  },
  hair: { k: 'memory', name: tt('chapters/ch5.120'), H: '#6a4030', h: '#9a6a48', need: 'ch5', cond: tt('chapters/ch5.121') },
  ach: [
    { id: 'k5s', t: tt('chapters/ch5.122'), d: tt('chapters/ch5.123'), tier: 2, v: pd => pd.ch5 && pd.ch5.sword ? 1 : 0, g: 1 },
    { id: 'k5', t: tt('chapters/ch5.124'), d: tt('chapters/ch5.125'), tier: 3, v: pd => (pd.ch5 && pd.ch5.cleared) || 0, g: 1 },
    { id: 'k5x5', t: tt('chapters/ch5.126'), d: tt('chapters/ch5.127'), tier: 4, v: pd => (pd.ch5 && pd.ch5.cleared) || 0, g: 5 },
  ],
  cut: { scenes: ['kroom', 'kmorn', 'kalley', 'kshop', 'klot', 'kdusk'], draw: drawKidCut, actors: drawKidActors },
  story: { prologue: [tt('chapters/ch5.128'), CH5_PROLOGUE], stages: { 1: [tt('chapters/ch5.129'), CH5_SHOP], 2: [tt('chapters/ch5.130'), CH5_LOT], 3: [tt('chapters/ch5.131'), CH5_HOME] }, ending: [tt('chapters/ch5.132'), CH5_ENDING] },
  end: { stats: lv => tt('chapters/ch5.133', { lv }), again: tt('chapters/ch5.134') }
});
