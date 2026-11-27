// ===================== 화면 바탕: DOM 찾기 $ · 캔버스(cv·ctx) · 숫자 쉼표 =====================
// ===================== ENGINE =====================

export const $ = s => document.querySelector(s);
// ---------- 숫자 쉼표 (화면에 보이는 숫자는 전부 1,234 처럼) ----------
export const numF = (/** @type {any} */ n) => { const v = Number(n); return Number.isFinite(v) ? v.toLocaleString('ko-KR') : String(n); };
/** 글 속 4자리 이상 숫자에 쉼표. 글자 바로 뒤(닉네임 속 숫자)·날짜(-, :, /, 년)·소수점·장비 키(#)는 건드리지 않음 */
const NUM_RE = /(?<![\p{L}\d.,:\-#/_])(\d{4,})(?![\d\-:/년.,]\d|[\d년])/gu;
export const fmtNumText = (/** @type {string} */ s) => String(s).replace(NUM_RE, d => Number(d).toLocaleString('ko-KR'));
/** 화면 글(텍스트 노드)에 쉼표를 자동으로 — data-raw 안(옮기기 코드·채팅)·입력칸은 제외 */
function numFmtNode(/** @type {Node} */ n) {
  if (n.nodeType === 3) { const p = n.parentElement; if (!p || p.closest('[data-raw],script,style,textarea')) return; const v = n.nodeValue || '', w = fmtNumText(v); if (w !== v) n.nodeValue = w; }
  else if (n.nodeType === 1) { const tw = document.createTreeWalker(n, NodeFilter.SHOW_TEXT); let t; while ((t = tw.nextNode())) numFmtNode(t); }
}
export function numFmtBoot() {
  numFmtNode(document.body);
  new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') numFmtNode(m.target); else m.addedNodes.forEach(numFmtNode); } })
    .observe(document.body, { childList: true, subtree: true, characterData: true });
}
export const cv = $('#cv'), ctx = cv.getContext('2d');
export let DPR = 1, S = 4, VW = 200, VH = 200, CW = 0, CH = 0;
export function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 3);
  CW = window.innerWidth; CH = window.innerHeight;
  cv.width = Math.round(CW * DPR); cv.height = Math.round(CH * DPR);
  cv.style.width = CW + 'px'; cv.style.height = CH + 'px';
  S = Math.max(2, Math.round(Math.min(cv.width, cv.height) / 170));
  VW = cv.width / S; VH = cv.height / S;
  ctx.imageSmoothingEnabled = false;
}
