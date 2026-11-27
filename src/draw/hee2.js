// ===================== 희수 2배 도트 (28×42, 11/25) =====================
// 화면 크기는 예전(14×21)과 같고 칸만 2배로 잘게 — 장비마다 모양이 달라 보이게.
// look = { hat, cloth, shoe, bag } 모양 + 색. 장비 → 모양은 HEE_LOOK(장비 id), 없으면 아이콘으로 짐작.



import { BASEPAL } from './sprites.js';
import { shadeHex } from '../core/util.js';
import { mkCanvas } from './sprite.js';
import { ITEMS, defOf } from '../core/data.js';
import { newPD } from '../core/save.js';
import { hairPal, visEq } from '../core/items.js';

export const HR = 2; // 해상도 배수
const HEE_LOOK = {
  hat: { cap_tiara: 'capTiara', cap_rainbow: 'capRainbow', bucket: 'bucket', cheercap: 'ballcap', pearlpin: 'pin', veil: 'veil' },
  cloth: { fleece: 'fleece', hoodie: 'hoodie', padding: 'pad', aurorapad: 'pad', coat: 'coat', longpad: 'longpad', goosepad: 'longpad', vest: 'vest', uniform: 'jersey', wdress: 'gown', dress2: 'dress' },
  shoe: { sneakers: 'sneaker', airshoes: 'sneaker', slipon: 'slipon', ugly: 'chunky', wingshoes: 'chunky', running: 'sandal', skates: 'boots', rainboot: 'boots', spike: 'cleat', heels: 'heel' },
  bag: { silverbag: 'shoulder', cheerbag: 'shoulder', ecobag: 'tote', crossbag: 'cross', aurorabag: 'cross', backpack: 'backpack', clutch: 'handbag', limitbag: 'handbag', envbag: 'clutch', tackle: 'box' }
};
function heeLookOf(slot, id) {
  const t = HEE_LOOK[slot], k = id && t[defOf(id)]; if (k) return k;
  const ic = id && ITEMS[id] ? ITEMS[id].icon : '';
  if (slot === 'hat') return ic === 'veil' ? 'veil' : 'cap';
  if (slot === 'cloth') return ic === 'dress' ? 'dress' : 'fleece';
  if (slot === 'shoe') return ic === 'boots' ? 'boots' : ic === 'sandal' ? 'sandal' : 'sneaker';
  return ic === 'handbag' ? 'handbag' : 'shoulder';
}
const HK = '#2b1b24';
/** 머리 줄이기(11/25 「얼굴 조금만 작게」): 머리 그림에서 단색 줄·칸 몇 개를 빼서 도트 모양을 지키며 작게.
 * rows: 뺄 줄(위쪽이 아래로 내려옴 — 턱·몸은 그대로), cols: 뺄 칸(가운데 cx 쪽으로 모임) */
function heeSeam(src, rows, cols, cx) {
  const W = src.width, H = src.height, a = mkCanvas(W, H), ag = a.getContext('2d');
  for (let x = 0; x < W; x++) { if (cols.includes(x)) continue; const dx = x + cols.filter(c => c < cx && c > x).length - cols.filter(c => c >= cx && c < x).length; ag.drawImage(src, x, 0, 1, H, dx, 0, 1, H); }
  const b = mkCanvas(W, H), bg = b.getContext('2d');
  for (let y = 0; y < H; y++) { if (rows.includes(y)) continue; bg.drawImage(a, 0, y, W, 1, 0, y + rows.filter(r => r > y).length, W, 1); }
  return b;
}
/** 28×42 캔버스에 희수 한 장 그리기. dir: down/up/right/phone, fr: 0 서기·1·2 걷기 */
export function heePaint(L, dir, fr) {
  const W = 14 * HR, H = 21 * HR, c = mkCanvas(W, H); let g = c.getContext('2d');
  const r = (x, y, w, h, col) => { if (w > 0 && h > 0 && col) { g.fillStyle = col; g.fillRect(x, y, w, h); } };
  const p = (x, y, col) => r(x, y, 1, 1, col);
  const ob = (x, y, w, h, col) => { r(x - 1, y - 1, w + 2, h + 2, HK); r(x, y, w, h, col); }; // 테두리 있는 칸
  const orr = (x, y, w, h, col) => { r(x, y - 1, w, h + 2, HK); r(x - 1, y, w + 2, h, HK); r(x, y, w, h, col); }; // 모서리 둥근 테두리
  const rf = (x, y, w, h, rad, col) => { for (let i = 0; i < h; i++) { const d = Math.min(i, h - 1 - i), ins = d >= rad ? 0 : Math.round(rad - Math.sqrt(rad * rad - (rad - d) * (rad - d))); r(x + ins, y + i, w - ins * 2, 1, col); } };
  const dith = (x, y, w, h, rad) => { // 레이스 망사 (한 칸 건너 흰 점 + 가장자리 흰 줄)
    const m = mkCanvas(w, h), mg = m.getContext('2d'); mg.fillStyle = '#ffffff';
    for (let i = 0; i < h; i++) { const d = Math.min(i, h - 1 - i), ins = d >= rad ? 0 : Math.round(rad - Math.sqrt(rad * rad - (rad - d) * (rad - d))); for (let j = ins; j < w - ins; j++) if ((i + j) % 2 === 0 || j === ins || j === w - ins - 1 || i === h - 1) mg.fillRect(j, i, 1, 1); }
    g.globalAlpha = 0.9; g.drawImage(m, x, y); g.globalAlpha = 1;
  };
  const orn = (x, y, w, h, rad, col) => { rf(x - 1, y - 1, w + 2, h + 2, rad + 1, HK); rf(x, y, w, h, rad, col); }; // 둥근 테두리
  const side = dir === 'right', back = dir === 'up', front = !side && !back;
  const { Hh, Hd, S: SK, s: sk } = L;
  const longC = L.cloth === 'longpad' || L.cloth === 'coat', gown = L.cloth === 'gown', dress = L.cloth === 'dress';
  const walk = fr === 1 ? -1 : fr === 2 ? 1 : 0;
  const SEAM_R = [4, 9, 18], SEAM_C = side ? [5, 9, 15] : [4, 12, 15, 23];
  const layer = () => { const g0 = g, LC = mkCanvas(W, H); g = LC.getContext('2d'); return () => { g = g0; g.drawImage(heeSeam(LC, SEAM_R, SEAM_C, 14), 0, 0); }; };
  let done = layer();
  // ---- 면사포 (머리 뒤로 길게) ----
  if (L.hat === 'veil') { // 몸 뒤로 늘어지는 면사포 자락
    if (back) { /* 머리 위에 덮음 (아래) */ } else if (side) dith(0, 6, 10, 36, 2); else { dith(0, 8, 5, 33, 2); dith(23, 8, 5, 33, 2); }
  }
  // ---- 긴 머리 (몸 뒤) ----
  if (front || dir === 'phone') { orn(2, 10, 24, 22, 2, Hh); r(3, 30, 3, 1, Hd); r(22, 30, 3, 1, Hd); }
  else if (side) orn(2, 8, 9, 24, 2, Hh);
  done();
  // ---- 백팩 (뒤) ----
  if (L.bag === 'backpack') { if (back) { orr(6, 22, 16, 13, L.G); r(8, 26, 12, 1, L.g); orr(9, 28, 10, 5, L.g); r(13, 29, 2, 1, '#ffffff'); } else if (side) { orr(1, 23, 6, 11, L.G); r(2, 28, 4, 1, L.g); } }
  /** rows: [y, x0, x1, 색] — 테두리는 바깥쪽에만(몸통 안쪽은 생략) */
  const blob = (rows, skip) => {
    const on = new Set(rows.map(([y, x0, x1]) => { const a = []; for (let x = x0; x <= x1; x++) a.push(x + ',' + y); return a; }).flat());
    const inSkip = (x, y) => skip && x >= skip[0] && x <= skip[1] && y >= skip[2] && y <= skip[3];
    for (const k of on) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!on.has(nx + ',' + ny) && !inSkip(nx, ny)) p(nx, ny, HK); } }
    for (const [y, x0, x1, col] of rows) r(x0, y, x1 - x0 + 1, 1, col);
  };
  // ---- 다리·신발 (11/25: 허벅지→종아리로 가늘어지는 다리 + 걸을 때 한 발씩 들기, 옆모습은 비스듬히 벌림) ----
  const legCol = gown || dress ? SK : L.P, legSh = gown || dress ? sk : L.p;
  const shoe = (x, y, flip, sideV) => {
    const O = L.O, o = L.o, s = L.shoe;
    if (s === 'heel') { if (sideV) { blob([[y, x + 1, x + 3, O], [y + 1, x, x + 4, O]]); p(x, y + 2, HK); p(x + 4, y, o); } else { blob([[y, x + 1, x + 3, O], [y + 1, x + 1, x + 3, O]]); p(x + (flip ? 1 : 3), y + 2, HK); p(x + 2, y, o); } return; }
    if (s === 'sandal') { blob([[y, x, x + 4, SK], [y + 1, x, x + 4, SK]]); r(x, y, 5, 1, O); p(x + 2, y + 1, O); return; }
    if (s === 'chunky') { blob([[y - 1, x + 1, x + 3, O], [y, x, x + 4 + (sideV ? 1 : 0), O], [y + 1, x, x + 4 + (sideV ? 1 : 0), o]]); p(x + 2, y - 1, o); return; }
    if (s === 'boots') { blob([[y - 4, x, x + 4, O], [y - 3, x, x + 4, O], [y - 2, x, x + 4, O], [y - 1, x, x + 4, O], [y, x, x + 4 + (sideV ? 1 : 0), O], [y + 1, x, x + 4 + (sideV ? 1 : 0), o]]); r(x, y - 4, 5, 1, o); p(x + 1, y - 2, shadeHex(O, 0.4)); return; }
    blob([[y, x + 1, x + 3 + (sideV ? 1 : 0), O], [y + 1, x, x + 4 + (sideV ? 1 : 0), O]]);
    if (s === 'cleat') { p(x + 1, y + 2, HK); p(x + 3, y + 2, HK); p(x + 2, y, '#ffffff'); }
    else if (s === 'slipon') r(x, y + 1, 5, 1, o);
    else { r(x, y + 1, 5 + (sideV ? 1 : 0), 1, o); p(x + 2, y, '#ffffff'); } // 운동화: 흰 밑창·끈
  };
  /** 다리 한 쪽: 위 4칸 → 아래 3칸, dx = 줄마다 기울기(옆모습 걸음) */
  const leg = (x, y0, len, inner, dx) => {
    const rows = [];
    for (let i = 0; i < len; i++) { const o = Math.round(dx * i / Math.max(1, len - 1)), w = i < 2 ? 4 : 3, ax = x + o + (i >= 2 && inner === 'L' ? 1 : 0); rows.push([y0 + i, ax, ax + w - 1, legCol]); }
    blob(rows); if (!dress && !gown) for (const [y, a2, b2] of rows) p(inner === 'L' ? b2 : a2, y, legSh);
    return rows[rows.length - 1];
  };
  if (!gown) {
    if (side) {
      const a = walk;
      if (a === 0) { if (!longC) { leg(11, 34, 5, 'R', 0); leg(14, 34, 5, 'R', 0); } shoe(11, 39, false, true); shoe(14, 39, false, true); }
      else { // 뒤로 간 다리 먼저, 앞으로 간 다리 나중에
        const back = !longC ? leg(13, 34, 5, 'R', -3 * a) : [38, 13 - 3 * a];
        shoe(back[1] - (a > 0 ? 1 : 0), 39, false, true);
        const fwd = !longC ? leg(13, 34, 5, 'R', 3 * a) : [38, 13 + 3 * a];
        shoe(fwd[1] - (a > 0 ? 0 : 1), 39 - 1, false, true);
      }
    } else {
      const lu = fr === 1 ? 2 : 0, ru = fr === 2 ? 2 : 0; // 걷기: 한 발씩 2칸 들기
      if (!longC) { leg(9, 34, 5 - lu, 'L', 0); leg(15, 34, 5 - ru, 'R', 0); }
      shoe(9, 39 - lu, false); shoe(14, 39 - ru, true);
    }
  }
  // ---- 몸통 ----
  const Wc = L.W, wc = L.w;
  const tx = side ? 9 : 7, tw = side ? 10 : 14; // 몸통 x·폭
  let bot = 34; // 몸통 아래 끝
  if (gown) {
    // 볼가운 치마: 아래로 넓게 퍼지고 발을 덮음
    const gk = y => Math.round((y - 29) * (side ? 0.5 : 0.52));
    for (let y = 29; y <= 41; y++) r((side ? 8 : 6) - gk(y) - 1, y, (side ? 12 : 16) + gk(y) * 2 + 2, 1, HK);
    for (let y = 29; y <= 40; y++) r((side ? 8 : 6) - gk(y), y, (side ? 12 : 16) + gk(y) * 2, 1, y === 40 ? wc : (y - 29) % 4 === 3 ? '#f4ece2' : Wc);
    for (const [x, y] of [[9, 33], [17, 35], [12, 38], [21, 38], [6, 37]]) if (!side || x < 20) p(x, y, '#ffffff');
  } else if (dress) {
    for (let y = 29; y <= 36; y++) { const k = Math.round((y - 29) * 0.55); r((side ? 9 : 7) - k - 1, y, (side ? 10 : 14) + k * 2 + 2, 1, HK); }
    for (let y = 29; y <= 35; y++) { const k = Math.round((y - 29) * 0.55); r((side ? 9 : 7) - k, y, (side ? 10 : 14) + k * 2, 1, y === 35 ? wc : Wc); }
    if (!side) for (let x = 5; x < 23; x += 3) p(x, 35, '#ffffff');
  } else if (longC) bot = 38;
  // 윗몸 — 줄마다 폭을 정한 모양(둥근 어깨·잘록한 허리·살짝 퍼지는 밑단)으로 따로 그린 뒤 그 모양으로 자름 (11/25 「허리 얇게」「로봇 같다」)
  const topY = 23; const gMain = g, TC = mkCanvas(W, H); g = TC.getContext('2d');
  const puffyT = L.cloth === 'pad' || L.cloth === 'longpad';
  const spans = []; {
    const n = gown || dress ? 6 : bot - topY - 1, pf = gown || dress ? 0 : puffyT ? 1 : 0;
    for (let d = 1; d <= n; d++) {
      let a, b;
      if (side) { a = d === 1 ? 10 : 9; b = d === 1 ? 17 : 18; if (d >= 5 && d <= 7) { a = 10; b = 17; } if (gown || dress) { if (d >= 5) { a = 10; b = 17; } } }
      else if (gown || dress) { a = d === 1 ? 9 : d <= 3 ? 8 : 9; b = W - 1 - a; if (d >= 5) { a = 10; b = W - 1 - 10; } }
      else { a = d === 1 ? 9 : d <= 4 ? 8 : d <= 7 ? 9 : d >= n - 1 ? 7 : 8; b = W - 1 - a; }
      spans.push([topY + d, a - pf, b + pf]);
    }
  }
  for (const [y, a, b] of spans) r(a, y, b - a + 1, 1, Wc);
  if (gown || dress) {
    if (!back) { r(tx, topY + 1, tw, 2, SK); r(tx + (side ? 0 : 2), topY + 3, side ? tw : tw - 4, 1, Wc); if (!side) { p(13, topY + 3, SK); p(14, topY + 3, SK); } } else r(tx + 2, topY + 1, tw - 4, 1, SK);
    r(tx, topY + 6, tw, 1, gown ? '#ffe3ef' : wc); if (!side && !back) { r(12, topY + 5, 4, 3, gown ? '#ffd1e6' : '#ffffff'); p(13, topY + 6, gown ? '#ff9fcf' : wc); } // 허리 리본
    if (gown && !back) { p(tx + 3, topY + 4, '#ffffff'); p(tx + tw - 4, topY + 5, '#ffffff'); }
  } else {
    const x0 = Math.min(...spans.map(s => s[1])), w0 = Math.max(...spans.map(s => s[2])) - x0 + 1;
    const C = L.cloth;
    if (C === 'pad' || C === 'longpad') { for (let y = topY + 4; y < bot; y += 3) r(x0, y, w0, 1, wc); if (!back) r(side ? x0 + w0 - 2 : 13, topY + 1, 1, bot - topY - 1, shadeHex(Wc, -0.3)); if (L.aur) for (let y = topY + 1; y < bot; y++) r(x0, y, w0, 1, y % 6 < 3 ? Wc : L.aur); }
    else if (C === 'fleece') { for (let i = 0; i < 18; i++) p(x0 + ((i * 7) % w0), topY + 2 + ((i * 5) % (bot - topY - 2)), wc); if (!back) { r(side ? x0 + w0 - 3 : 12, topY + 1, side ? 2 : 4, 2, wc); } }
    else if (C === 'hoodie') { if (front) { r(9, topY + 7, 10, 4, wc); r(9, topY + 7, 10, 1, HK); p(12, topY + 2, '#ffffff'); p(12, topY + 3, '#ffffff'); p(15, topY + 2, '#ffffff'); p(15, topY + 3, '#ffffff'); } if (back) orr(9, topY + 1, 10, 4, wc); }
    else if (C === 'coat') { if (!back) { if (front) { for (let i = 0; i < 4; i++) { p(12 - i, topY + 1 + i, wc); p(15 + i, topY + 1 + i, wc); } r(13, topY + 1, 2, 3, '#ffffff'); for (const y of [topY + 6, topY + 9, topY + 12]) { p(11, y, HK); p(16, y, HK); } } r(x0, topY + 8, w0, 2, wc); p(side ? x0 + w0 - 3 : 13, topY + 8, '#ffd84a'); } else r(13, topY + 8, 2, bot - topY - 8, wc); }
    else if (C === 'vest') { r(x0 + 3, topY + 1, w0 - 6, bot - topY - 1, back ? Wc : '#ffffff'); if (!back) { r(x0 + 3, topY + 1, 1, bot - topY - 1, HK); r(x0 + w0 - 4, topY + 1, 1, bot - topY - 1, HK); } r(x0, topY + 6, w0, 1, '#ffe86a'); r(x0, topY + 9, w0, 1, '#2b2b34'); }
    else if (C === 'jersey') { for (let x = x0 + 1; x < x0 + w0; x += 3) r(x, topY + 1, 1, bot - topY - 1, wc); if (front) { r(13, topY + 1, 2, bot - topY - 1, Wc); r(13, topY + 1, 1, bot - topY - 1, wc); for (let y = topY + 3; y < bot; y += 3) p(14, y, '#3a5ab0'); r(11, topY + 1, 6, 1, '#3a5ab0'); } if (back) { r(11, topY + 3, 2, 5, '#3a5ab0'); r(15, topY + 3, 2, 5, '#3a5ab0'); } }
    else { if (!back) r(side ? x0 + w0 - 3 : 12, topY + 1, side ? 2 : 4, 2, wc); }
    if (C === 'longpad' || C === 'coat') r(x0, bot - 1, w0, 1, wc);
  }
  g = gMain;
  { // 모양대로 자르고 바깥 테두리
    const tg = TC.getContext('2d'), M = mkCanvas(W, H), mg = M.getContext('2d'); mg.fillStyle = '#000'; for (const [y, a2, b2] of spans) mg.fillRect(a2, y, b2 - a2 + 1, 1);
    tg.globalCompositeOperation = 'destination-in'; tg.drawImage(M, 0, 0); tg.globalCompositeOperation = 'source-over';
    const on = new Set(); for (const [y, a2, b2] of spans) for (let x = a2; x <= b2; x++) on.add(x + ',' + y);
    for (const k of on) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!on.has((x + dx) + ',' + (y + dy)) && !(gown || dress ? y + dy > topY + 6 : false)) p(x + dx, y + dy, HK); }
  }
  g.drawImage(TC, 0, 0);
  // ---- 팔 (11/25 「팔이 로봇 같다」: 어깨에서 살짝 벌어지며 내려오는 둥근 팔 + 동그란 손) ----
  const sleeveless = gown || dress, armC = sleeveless ? SK : Wc, puffArm = L.cloth === 'pad' || L.cloth === 'longpad';
  const T0 = topY, body = [tx + 1, tx + tw - 2, T0 + 1, bot - 1];
  const armRows = (mir, sh) => { // 왼팔 기준 좌표 → mir면 좌우 뒤집기
    const pw = puffArm ? 1 : 0, rows = [];
    const spec = [[1, 6, 7], [2, 5, 7], [3, 4 - pw, 6], [4, 4 - pw, 6], [5, 4 - pw, 6], [6, 4 - pw, 6], [7, 4 - pw, 6]]; // 11/25 「팔 너무 벌어짐」: 밖으로 벌어지지 않고 몸 옆으로 곧게
    for (const [dy, x0, x1] of spec) rows.push([T0 + dy + sh, x0, x1, dy === 7 && !sleeveless ? wc : gown && dy >= 6 ? '#ffffff' : armC]);
    rows.push([T0 + 8 + sh, 4, 6, gown ? '#ffffff' : SK], [T0 + 9 + sh, 4, 6, gown ? '#ffffff' : SK], [T0 + 10 + sh, 5, 6, gown ? '#f0ece8' : sk]);
    return mir ? rows.map(([y, x0, x1, c]) => [y, W - 1 - x1, W - 1 - x0, c]) : rows;
  };
  if (dir !== 'phone') {
    if (side) {
      const a = walk, rows = [];
      for (let i = 0; i < 10; i++) { const o = Math.round(a * i / 4), y = T0 + 1 + i, w = i < 2 ? 3 : 3; const c = i >= 7 ? (i === 9 ? sk : SK) : i === 6 && !sleeveless ? wc : armC; rows.push([y, 13 + o + (i === 0 ? 1 : 0), 13 + o + w - 1, c]); }
      blob(rows, [tx + 1, tx + tw - 2, T0 + 1, T0 + 2]);
    } else {
      blob(armRows(false, 0), body); blob(armRows(true, 0), body);
    }
  } else {
    // 폰 보기: 팔꿈치를 굽혀 두 손을 가운데로
    const up = [[T0 + 1, 6, 7, armC], [T0 + 2, 5, 7, armC], [T0 + 3, 5, 7, armC], [T0 + 4, 5, 8, armC], [T0 + 5, 6, 10, armC], [T0 + 6, 7, 11, sleeveless ? SK : wc]];
    blob(up, body); blob(up.map(([y, x0, x1, c]) => [y, W - 1 - x1, W - 1 - x0, c]), body);
    orr(11, T0 + 3, 6, 5, '#30323d'); r(12, T0 + 4, 4, 3, fr ? '#bfe4ff' : '#9fe8ff'); blob([[T0 + 6, 10, 11, SK], [T0 + 7, 10, 11, SK]]); blob([[T0 + 6, 16, 17, SK], [T0 + 7, 16, 17, SK]]);
  }
  // ---- 가방 (앞) ----
  const G0 = L.G, g0 = L.g;
  if (L.bag === 'backpack' && front) { r(9, topY + 1, 2, 8, g0); r(17, topY + 1, 2, 8, g0); }
  else if (L.bag === 'shoulder') { if (front) { r(20, topY + 1, 1, 7, g0); orr(21, topY + 7, 5, 5, G0); r(21, topY + 8, 5, 1, g0); p(23, topY + 9, '#ffd84a'); } else if (back) { r(7, topY + 1, 1, 7, g0); orr(2, topY + 7, 5, 5, G0); } else { orr(8, topY + 7, 5, 5, G0); r(10, topY + 1, 1, 6, g0); } }
  else if (L.bag === 'tote') { if (!side) { const x = back ? 1 : 22; orr(x, topY + 8, 5, 7, G0); r(x + 1, topY + 6, 1, 2, g0); r(x + 3, topY + 6, 1, 2, g0); r(x, topY + 10, 5, 1, g0); } else { orr(13, topY + 9, 5, 6, G0); r(14, topY + 7, 3, 1, g0); } }
  else if (L.bag === 'cross') { if (front) { for (let i = 0; i < 9; i++) p(9 + i, topY + 1 + i, g0); orr(17, topY + 9, 5, 4, G0); p(19, topY + 10, '#ffffff'); } else if (back) { for (let i = 0; i < 9; i++) p(18 - i, topY + 1 + i, g0); } else { orr(15, topY + 8, 4, 4, G0); r(13, topY + 1, 1, 7, g0); } }
  else if (L.bag === 'handbag' && dir !== 'phone') { const x = side ? 14 : 0; orr(x, topY + 11, 6, 5, G0); r(x + 1, topY + 9, 1, 2, HK); r(x + 4, topY + 9, 1, 2, HK); r(x + 1, topY + 9, 4, 1, HK); r(x, topY + 12, 6, 1, g0); p(x + 3, topY + 13, '#ffd84a'); }
  else if (L.bag === 'clutch' && dir !== 'phone') { const x = side ? 14 : 0; orr(x, topY + 10, 6, 4, G0); for (let i = 0; i < 3; i++) { p(x + i, topY + 10 + i, g0); p(x + 5 - i, topY + 10 + i, g0); } p(x + 2, topY + 12, '#e8414f'); p(x + 3, topY + 12, '#e8414f'); }
  else if (L.bag === 'box' && dir !== 'phone') { const x = side ? 14 : 22; orr(x, topY + 11, 6, 5, G0); r(x, topY + 13, 6, 1, g0); r(x + 2, topY + 9, 2, 2, HK); p(x + 2, topY + 14, '#ffd84a'); }
  // ---- 머리 ----
  done = layer();
  if (side) {
    orn(3, 2, 22, 20, 5, Hh); // 머리통
    orn(11, 8, 13, 14, 3, SK); r(11, 8, 13, 3, SK); r(23, 13, 1, 2, SK); // 얼굴 (오른쪽)
    r(11, 8, 13, 3, Hh); for (const x of [12, 15, 18, 21]) p(x, 11, Hh); r(3, 8, 9, 14, Hh); // 앞머리·옆머리
    r(7, 4, 5, 1, Hd); r(6, 5, 2, 1, Hd); r(4, 10, 2, 8, Hd);
    r(18, 13, 3, 5, '#1b1418'); r(18, 16, 3, 2, '#6a4038'); p(18, 13, '#ffffff'); p(18, 14, '#ffffff'); p(20, 17, '#ffe0ea'); r(17, 12, 5, 1, HK); p(21, 11, HK); r(20, 19, 2, 1, '#ff9fa8'); p(22, 20, '#d0606a');
  } else if (back) {
    orn(2, 1, 24, 22, 5, Hh); r(6, 4, 5, 1, Hd); r(5, 5, 2, 1, Hd); orn(4, 18, 20, 14, 2, Hh); r(6, 30, 16, 1, Hd); for (let x = 5; x < 23; x += 4) r(x, 24, 1, 6, Hd);
  } else {
    orn(2, 1, 24, 22, 5, Hh);
    orn(5, 8, 18, 14, 3, SK); r(5, 8, 18, 3, SK); r(6, 22, 16, 1, HK); r(7, 22, 14, 1, SK); r(6, 23, 16, 1, HK); // 얼굴 + 턱
    // 앞머리
    r(5, 8, 18, 3, Hh); for (const x of [5, 6, 9, 10, 11, 14, 15, 18, 19, 22]) p(x, 11, Hh); for (const x of [5, 10, 15, 22]) p(x, 12, Hh);
    r(2, 8, 3, 15, Hh); r(23, 8, 3, 15, Hh); r(7, 3, 5, 1, Hd); r(6, 4, 2, 1, Hd); r(3, 10, 1, 10, Hd); r(24, 10, 1, 10, Hd);
    // 눈·볼·입
    const blink = dir === 'phone' && fr === 1;
    if (dir === 'phone') { r(7, 16, 3, 1, '#1b1418'); r(18, 16, 3, 1, '#1b1418'); p(6, 15, HK); p(21, 15, HK); r(7, 17, 3, 1, '#6a4038'); r(18, 17, 3, 1, '#6a4038'); }
    else { // 큰 눈 (11/25): 3×5 눈동자 + 갈색 홍채 + 반짝이 두 개 + 속눈썹
      for (const [x, fl] of [[7, -1], [18, 1]]) {
        r(x, 13, 3, 5, '#1b1418'); r(x, 16, 3, 2, '#6a4038'); r(x + 1, 15, 1, 1, '#3a2428');
        p(x, 13, '#ffffff'); p(x, 14, '#ffffff'); p(x + 2, 17, '#ffe0ea');
        r(x - (fl < 0 ? 1 : 0), 12, 4, 1, HK); p(fl < 0 ? x - 1 : x + 3, 11, HK);
      }
    }
    r(5, 19, 3, 1, '#ff9fa8'); r(20, 19, 3, 1, '#ff9fa8');
    r(13, 20, 2, 1, '#d0606a'); if (blink) r(13, 20, 2, 2, '#d0606a');
  }
  // ---- 모자 ----
  const C0 = L.C, c0 = L.c, hat = L.hat;
  const capCrown = () => {
    if (side) { orn(4, 1, 18, 7, 3, C0); r(19, 7, 8, 2, c0); r(19, 7, 8, 1, HK); r(19, 9, 8, 1, HK); r(27, 7, 1, 3, HK); r(5, 7, 15, 1, c0); }
    else if (back) { orn(3, 1, 22, 8, 4, C0); r(3, 8, 22, 1, c0); orr(11, 6, 6, 2, Hh); r(12, 5, 4, 1, c0); }
    else { orn(3, 0, 22, 9, 4, C0); r(3, 7, 22, 2, c0); orn(2, 8, 24, 2, 1, c0); r(7, 2, 1, 4, shadeHex(C0, 0.35)); }
  };
  if (hat === 'cap' || hat === 'ballcap' || hat === 'capTiara' || hat === 'capRainbow') {
    capCrown();
    if (hat === 'capRainbow') { const cols = ['#ff6b6b', '#ffb84a', '#ffe86a', '#7ad07a', '#6fb8ff', '#b45cff']; for (let i = 0; i < 6; i++) r(side ? 4 + i * 3 : 3 + i * 4 - (i === 5 ? 0 : 0), side ? 1 : 0, side ? 3 : 4, side ? 6 : 7, cols[i]); r(side ? 5 : 3, side ? 7 : 7, side ? 15 : 22, 1, c0); }
    if (hat === 'ballcap' && front) { r(9, 1, 10, 6, '#ffffff'); r(9, 1, 10, 1, HK); r(12, 3, 4, 2, C0); }
    if (hat === 'cap' && front) r(13, 3, 2, 2, L.N || '#2e3a5c');
    if (hat === 'capTiara' && !back) { const x = side ? 6 : 8; r(x, 0, side ? 10 : 12, 1, '#ffd84a'); for (let i = 0; i < (side ? 3 : 4); i++) p(x + 1 + i * 3, -0 + 0, '#ffd84a'); p(x + (side ? 5 : 6), 0, '#ff7ab8'); r(x + (side ? 4 : 5), 1, 3, 1, '#ffd84a'); }
  } else if (hat === 'bucket') {
    if (side) { orn(5, 0, 14, 7, 3, C0); r(2, 6, 22, 2, c0); r(2, 6, 22, 1, HK); r(1, 8, 24, 1, HK); }
    else { orn(5, 0, 18, 8, 4, C0); orn(1, 7, 26, 2, 1, c0); r(5, 5, 18, 1, shadeHex(C0, -0.15)); }
  } else if (hat === 'pin') {
    // 진주 헤어핀: 모자 없이 머리 + 옆머리에 진주 세 알
    const pearl = (x, y) => { r(x - 1, y, 4, 2, HK); r(x, y - 1, 2, 4, HK); r(x, y, 2, 2, '#fffaf0'); p(x + 1, y + 1, '#e0d2c0'); p(x, y, '#ffffff'); };
    if (side) { pearl(5, 6); pearl(8, 4); pearl(11, 6); r(8, 8, 2, 1, '#ffd84a'); }
    else if (back) { pearl(9, 8); pearl(13, 7); pearl(17, 8); }
    else { pearl(18, 5); pearl(21, 7); pearl(20, 3); p(17, 8, '#ffd84a'); r(13, 1, 1, 5, Hd); }
  } else if (hat === 'veil') {
    const y = 1;
    if (side) { r(6, y, 10, 2, '#ffd84a'); p(9, y - 1, '#ffd84a'); p(12, y - 1, '#ffd84a'); p(10, y, '#ff7ab8'); p(14, y, '#9fe8ff'); }
    else if (back) { r(7, y, 14, 2, '#ffd84a'); }
    else { r(7, y, 14, 2, '#ffd84a'); for (const x of [8, 11, 16, 19]) p(x, y - 1, '#ffd84a'); r(13, y - 1, 2, 1, '#ffd84a'); p(13, y, '#ff7ab8'); p(14, y, '#ff7ab8'); p(10, y, '#ffffff'); p(17, y, '#ffffff'); }
    // 머리 위로 덮인 얇은 망사
    if (back) dith(3, 3, 22, 39, 4);
    else if (side) dith(3, 3, 8, 20, 3);
    else { dith(2, 3, 5, 21, 2); dith(21, 3, 5, 21, 2); }
  }
  done();
  return c;
}
export function heeLook(pd, over) {
  const eq = pd ? visEq(pd) : newPD().eq, hr = hairPal(pd && pd.look && pd.look.hair);
  const col = (id, k) => (ITEMS[id] && ITEMS[id].color) || BASEPAL[k];
  const hc = col(eq.hat, 'C'), wc = col(eq.armor, 'W'), oc = col(eq.shoes, 'O'), gc = col(eq.bag, 'G');
  const L = {
    hat: heeLookOf('hat', eq.hat), cloth: heeLookOf('cloth', eq.armor), shoe: heeLookOf('shoe', eq.shoes), bag: heeLookOf('bag', eq.bag),
    C: hc, c: shadeHex(hc, -0.22), W: wc, w: shadeHex(wc, wc === '#3a3a46' ? 0.12 : -0.15), O: oc, o: shadeHex(oc, -0.18), G: gc, g: shadeHex(gc, -0.25),
    Hh: hr.H, Hd: hr.h, S: '#ffdcc2', s: '#f0bb9c', P: '#3b3f58', p: '#2c2f44', V: 'rgba(255,255,255,0.62)', N: '#2e3a5c', aur: defOf(eq.armor) === 'aurorapad' ? '#c8b0ff' : null
  };
  if (defOf(eq.hat) === 'cap_gold') L.N = '#ffffff';
  return Object.assign(L, over || {});
}

// ===================== 오빠 2배 (28×42) =====================
/** o: { tux, sleep } */
export function husPaint(o) {
  o = o || {}; const W = 28, H = 42, c = mkCanvas(W, H), g = c.getContext('2d');
  const r = (x, y, w, h, col) => { if (w > 0 && h > 0) { g.fillStyle = col; g.fillRect(x, y, w, h); } }, p = (x, y, col) => r(x, y, 1, 1, col);
  const rf = (x, y, w, h, rad, col) => { for (let i = 0; i < h; i++) { const d = Math.min(i, h - 1 - i), ins = d >= rad ? 0 : Math.round(rad - Math.sqrt(rad * rad - (rad - d) * (rad - d))); r(x + ins, y + i, w - ins * 2, 1, col); } };
  const orn = (x, y, w, h, rad, col) => { rf(x - 1, y - 1, w + 2, h + 2, rad + 1, HK); rf(x, y, w, h, rad, col); };
  const tux = !!o.tux, SK = '#ffdcc2', jk = tux ? '#2b2b34' : '#8f8c5a', jd = tux ? '#1c1c24' : '#6e6c44', sh = tux ? '#ffffff' : '#a0a6b0', pa = tux ? '#2b2b34' : '#4a78c0', pd = tux ? '#1c1c24' : '#3a5f9a';
  // 다리·신발
  orn(9, 34, 4, 5, 0, pa); orn(15, 34, 4, 5, 0, pa); r(12, 34, 1, 4, pd); r(15, 34, 1, 4, pd);
  orn(8, 39, 5, 2, 1, tux ? '#16161c' : '#2a2630'); orn(15, 39, 5, 2, 1, tux ? '#16161c' : '#2a2630'); if (tux) { p(10, 39, '#6a6a78'); p(17, 39, '#6a6a78'); }
  // 몸통 (오빠는 살짝 통통 — 감량 실패)
  orn(6, 24, 16, 11, 2, jk); r(11, 24, 6, 11, sh);
  if (tux) { for (let i = 0; i < 5; i++) { p(10 - 0 + i * 0, 24 + i, '#3a3a46'); } r(10, 24, 1, 9, jd); r(17, 24, 1, 9, jd); r(12, 24, 4, 2, '#e8414f'); p(13, 25, '#a8222e'); p(14, 25, '#a8222e'); p(14, 28, HK); p(14, 31, HK); r(13, 28, 1, 1, HK); r(19, 26, 2, 1, '#ffffff'); }
  else { r(7, 28, 4, 3, jd); r(17, 28, 4, 3, jd); r(7, 28, 4, 1, HK); r(17, 28, 4, 1, HK); r(10, 24, 1, 11, jd); r(17, 24, 1, 11, jd); p(19, 25, '#ffd84a'); p(14, 27, '#6a6f7c'); p(14, 30, '#6a6f7c'); }
  r(6, 34, 16, 1, jd);
  // 팔
  orn(3, 25, 3, 7, 1, jk); orn(22, 25, 3, 7, 1, jk); r(3, 32, 3, 2, SK); r(22, 32, 3, 2, SK); if (tux) { r(3, 31, 3, 1, '#ffffff'); r(22, 31, 3, 1, '#ffffff'); }
  // 머리
  orn(3, 2, 22, 21, 6, SK);
  const hair = '#2a1c1c';
  if (tux) { // 모자 대신 넘긴 머리
    rf(3, 1, 22, 9, 5, hair); r(3, 6, 3, 6, hair); r(22, 6, 3, 6, hair); r(7, 2, 6, 1, '#4a3430'); r(6, 3, 2, 1, '#4a3430'); for (const x of [8, 12, 17]) p(x, 9, hair); 
  } else {
    r(3, 7, 3, 5, hair); r(22, 7, 3, 5, hair);
    orn(3, 0, 22, 8, 5, '#e6d39e'); r(4, 6, 20, 1, '#d8c48c'); orn(2, 8, 24, 2, 1, '#b8a46e'); r(6, 2, 4, 1, '#f4e6be'); p(13, 3, '#8f8c5a'); p(14, 3, '#8f8c5a');
  }
  // 얼굴
  if (o.sleep) { r(7, 15, 4, 1, '#1b1418'); r(17, 15, 4, 1, '#1b1418'); r(13, 19, 2, 1, '#d0606a'); }
  else { r(8, 13, 2, 3, '#1b1418'); r(18, 13, 2, 3, '#1b1418'); p(8, 13, '#ffffff'); p(18, 13, '#ffffff'); r(7, 11, 4, 1, hair); r(17, 11, 4, 1, hair); r(11, 19, 6, 1, '#d0606a'); p(11, 18, '#d0606a'); p(16, 18, '#d0606a'); }
  r(5, 17, 2, 1, '#ff9fa8'); r(21, 17, 2, 1, '#ff9fa8');
  r(9, 22, 10, 1, '#f0bb9c'); // 두 턱
  return c;
}
// ===================== 보리 2배 =====================
/** kind: sit/sitT(앉음 24×24) · runA/runB(달리기 30×20). cl = 옷 장비 */
export function boriPaint(kind, cl) {
  const run = kind === 'runA' || kind === 'runB', W = run ? 30 : 24, H = run ? 20 : 24, c = mkCanvas(W, H), g = c.getContext('2d');
  const r = (x, y, w, h, col) => { if (w > 0 && h > 0) { g.fillStyle = col; g.fillRect(x, y, w, h); } }, p = (x, y, col) => r(x, y, 1, 1, col);
  const rf = (x, y, w, h, rad, col) => { for (let i = 0; i < h; i++) { const d = Math.min(i, h - 1 - i), ins = d >= rad ? 0 : Math.round(rad - Math.sqrt(rad * rad - (rad - d) * (rad - d))); r(x + ins, y + i, w - ins * 2, 1, col); } };
  const orn = (x, y, w, h, rad, col) => { rf(x - 1, y - 1, w + 2, h + 2, rad + 1, HK); rf(x, y, w, h, rad, col); };
  const F = '#d9822b', f = '#9c5418', m = '#fbeedd', it = cl && ITEMS[cl], Y = it ? it.color : null, y2 = Y ? shadeHex(Y, -0.2) : null, pat = it && it.pat;
  const cloth = (x, y, w, h) => { if (!Y) return; for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) p(x + j, y + i, pat === 'knit' ? ((i + j) % 2 ? Y : y2) : (i % 3 === 2 ? y2 : Y)); r(x, y + h - 1, w, 1, y2); };
  const ear = (x, y, flip) => { for (let i = 0; i < 6; i++) { const w = 1 + Math.floor(i * 0.8); const xx = flip ? x + 5 - w : x; r(xx - 1, y + i, w + 2, 1, HK); r(xx, y + i, w, 1, F); if (i > 1) p(flip ? xx + w - 2 : xx + 1, y + i, f); } };
  if (!run) {
    // 꼬리 (오른쪽 뒤로 말림)
    orn(18, 14, 5, 5, 2, F); r(19, 15, 3, 2, m);
    // 몸·앞발
    orn(5, 13, 14, 8, 3, m); r(5, 13, 3, 8, F); r(16, 13, 3, 8, F);
    cloth(5, 13, 14, 6);
    orn(6, 20, 4, 3, 1, F); orn(14, 20, 4, 3, 1, F); r(6, 22, 4, 1, m); r(14, 22, 4, 1, m); p(8, 22, HK); p(16, 22, HK);
    // 머리
    ear(2, 0, false); ear(16, 0, true);
    orn(1, 4, 22, 11, 4, F);
    r(3, 10, 4, 4, m); r(17, 10, 4, 4, m); orn(7, 10, 10, 5, 2, m); // 하얀 뺨·주둥이
    r(5, 8, 2, 1, m); r(17, 8, 2, 1, m); // 눈썹 점
    r(5, 9, 3, 3, '#1b1418'); r(16, 9, 3, 3, '#1b1418'); p(5, 9, '#ffffff'); p(16, 9, '#ffffff');
    r(11, 10, 3, 2, HK); p(12, 10, '#5a4a52');
    if (kind === 'sitT') { r(10, 13, 4, 1, HK); r(11, 14, 2, 3, '#ff7b8a'); r(11, 16, 2, 1, '#e0606e'); } else { p(10, 13, HK); p(13, 13, HK); r(11, 13, 2, 1, HK); }
  } else {
    const A = kind === 'runA';
    // 꼬리 (위로 말림)
    orn(1, 4, 5, 5, 2, F); r(2, 5, 3, 2, m);
    // 다리
    const lg = A ? [[5, 15], [9, 16], [17, 16], [21, 15]] : [[6, 16], [8, 15], [18, 15], [20, 16]];
    for (const [x, y] of lg) { orn(x, y, 3, 3, 0, F); r(x, y + 2, 3, 1, m); }
    // 몸
    orn(4, 8, 20, 8, 3, F); r(6, 13, 16, 3, m); cloth(6, 8, 15, 7);
    // 머리 (오른쪽)
    ear(18, 0, false); ear(23, 0, true);
    orn(17, 3, 12, 10, 4, F); orn(24, 8, 5, 4, 1, m); r(19, 10, 4, 2, m);
    r(22, 6, 2, 3, '#1b1418'); p(22, 6, '#ffffff'); r(27, 8, 2, 2, HK);
  }
  return c;
}
