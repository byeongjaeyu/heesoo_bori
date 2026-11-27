// ===================== 공용 계산 도우미 (화면 없이 씀) =====================
// ---------- utils ----------
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randi = (a, b) => Math.floor(rand(a, b + 1));
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const choice = a => a[Math.floor(Math.random() * a.length)];
export function wpick(list) { let t = 0; for (const it of list) t += it[1]; let r = Math.random() * t; for (const it of list) { if ((r -= it[1]) < 0) return it[0]; } return list[0][0]; }
export function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return Math.abs(d); }
export function mulberry(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function shadeHex(hex, amt) {
  let c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
  let r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  const f = amt < 0 ? (v => v * (1 + amt)) : (v => v + (255 - v) * amt);
  return '#' + [r, g, b].map(v => Math.round(clamp(f(v), 0, 255)).toString(16).padStart(2, '0')).join('');
}
export function fmtTime(s) { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60; return (h ? h + '시간 ' : '') + m + '분 ' + ss + '초'; }
/** 오늘 날짜 키 (기기 시간, 예: 2026-11-27) */
export const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
