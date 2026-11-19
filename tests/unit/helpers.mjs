import { loadGame } from './load-game.mjs';
export const g = loadGame();
/** 새 세이브로 상태 초기화. over 로 필드 덮어쓰기 */
export function fresh(over = {}) {
  const pd = Object.assign(g.newPD(), over);
  g.G.pd = pd; g.G.zone = pd.zone; g.G.inf = null; g.G.pvp = null; g.G.fx = []; g.G.P = { x: 0, y: 0, buffs: {}, cds: {} }; g.G.bori = null;
  g.calcStats(); return pd;
}
/** Math.random 을 정해진 값으로 고정해서 fn 실행 */
export function withRandom(seq, fn) {
  const orig = Math.random; let i = 0; const arr = Array.isArray(seq) ? seq : [seq];
  Math.random = () => arr[Math.min(i++, arr.length - 1)];
  try { return fn(); } finally { Math.random = orig; }
}
/** 강화 0→목표 기대 비용(정확한 마르코프 체인 계산, 강화석 미사용) */
export function expectedEnhCost(target) {
  const n = target, A = Array.from({ length: n }, () => new Array(n).fill(0)), b = new Array(n).fill(0);
  for (let l = 0; l < n; l++) {
    const p = g.ENH_P[l], dn = g.ENH_DOWN[l], ds = g.ENH_DEST[l];
    A[l][l] += p + dn + ds; b[l] = g.enhCost(l);
    if (l + 1 < n) A[l][l + 1] -= p;
    if (dn) A[l][l - 1] -= dn;
    if (ds) A[l][Math.min(l, g.enhReset(l))] -= ds;
  }
  // 가우스 소거
  for (let i = 0; i < n; i++) { let m = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;[A[i], A[m]] = [A[m], A[i]];[b[i], b[m]] = [b[m], b[i]];
    for (let r = 0; r < n; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let c = i; c < n; c++) A[r][c] -= f * A[i][c]; b[r] -= f * b[i]; } }
  return b[0] / A[0][0];
}
