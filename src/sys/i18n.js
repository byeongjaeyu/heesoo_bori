// i18n-keep-file
// 화면 문구 (11/28 구조 개편 ⑤): 글은 전부 texts/<언어>/*.json 에 있고 빌드가 __TEXTS 로 넣음.
//   코드: tt('ui/menu.12') · 자리 있는 글은 tt('ui/menu.13', { n, lv: pd.lv }) → "Lv.{lv} {n}개" 의 {이름}을 채움
//   index.html: data-tt="html.3"(안쪽 HTML) · data-tta="alt=html.4;title=html.5"(속성) → 이 파일이 시작할 때 채움
//   새 한글 문구를 코드에 쓰면 `npm run texts` 가 json 으로 옮겨 줌(tests/unit/i18n.test.mjs 가 남은 한글을 잡음).
// 언어: localStorage 'hb_lang'(texts 에 있는 언어만) → 없으면 ko. 그 언어에 없는 문구는 ko 로.
const TXT = /** @type {Record<string, Record<string, string>>} */ (__TEXTS);
export const LANGS = Object.keys(TXT);
export const LANG = (() => { try { const l = localStorage.getItem('hb_lang'); if (l && TXT[l]) return l; } catch (e) { /* 저장소 막힘 */ } return 'ko'; })();
const CUR = TXT[LANG] || TXT.ko, KO = TXT.ko;

/** 문구 꺼내기. v 가 있으면 {이름} 자리를 채움 (없는 키는 키 그대로 — 테스트가 막음) */
export function tt(k, v) {
  let s = CUR[k]; if (s == null) s = KO[k]; if (s == null) return k;
  return v ? s.replace(/\{([A-Za-z_]\w*)\}/g, (m, n) => (n in v ? String(v[n]) : m)) : s;
}
/** 언어 바꾸기 (새로고침해야 적용) */
export function setLang(l) { try { localStorage.setItem('hb_lang', l); } catch (e) { /* 무시 */ } }

/** index.html 의 data-tt / data-tta 채우기 */
export function ttHtml(root) {
  for (const el of root.querySelectorAll('[data-tt]')) el.innerHTML = tt(el.getAttribute('data-tt'));
  for (const el of root.querySelectorAll('[data-tta]')) for (const p of el.getAttribute('data-tta').split(';')) { const i = p.indexOf('='); el.setAttribute(p.slice(0, i), tt(p.slice(i + 1))); }
  if (LANG !== 'ko') document.documentElement.lang = LANG;
}
if (typeof document !== 'undefined') ttHtml(document);
