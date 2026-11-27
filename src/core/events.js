// ===================== 이벤트 (core → 화면·서버) =====================
// core(규칙·세이브·계산)는 화면·네트워크 파일을 직접 부르지 않고 emit 만 함. 받는 쪽이 on 으로 등록.
//   'toast'(글, 종류) → ui/dialog · 'bubble'(대상, 글, 초)·'text'(x, y, 글, 종류) → play/player · 'daily'(종류) → features/daily · 'guide'(사건) → features/guide · 'saved' → net/cloud(랭킹·클라우드 동기화)
const EVT = /** @type {Record<string, Function[]>} */ ({});
export function on(ev, fn) { (EVT[ev] || (EVT[ev] = [])).push(fn); }
export function emit(ev, ...a) { for (const f of EVT[ev] || []) f(...a); }
