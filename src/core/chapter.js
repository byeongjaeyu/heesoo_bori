// ===================== 챕터 등록부 (11/27 장 단위 묶기) =====================
// 장 하나 = src/chapters/chN.js 파일 하나. 그 파일이 스테이지·몬스터·보스 패턴·스테이지 배경·장비·도감 세트·헤어·업적·컷신을 모아
// 맨 아래에서 regChapter({...}) 로 등록하면, 공용 표(ZONES·MONS·ITEMS·BOOK_SETS·EQ_SETS·HAIRS)에 들어가고
// 보스 패턴(AI, game.js)·배경(THEME, world.js)·업적(ACH, achv.js)·컷신 장면(story.js)·이야기 다시보기(replay.js)가 CHAPTERS 를 읽어 씀.
// 새 장 추가 = chN.js 하나 만들고 build/hb-build.mjs ORDER 에 'chapters/chN' 넣기 (+ 서버 장비표 갱신).
// 진행도: 1장 pd.zone/pd.cleared, N장 pd['chN'] {zone, cleared, intro, seen}. 지금 고른 장 pd.chap. 스테이지 번호(ZONES 순번)는 장 순서대로 이어짐



import { BOOK_ALL, BOOK_SETS, EQ_SETS, HAIRS, ITEM_DEFS, MONS, ZONES } from './data.js';
import { loopEff } from './loop.js';
import { tt } from '../sys/i18n.js';

/** @typedef {{ c: number, name: string, title: string, pick: string[], lv: number, baseL: number, zones: any[], mons: Record<string, any>, ai?: Record<string, Function>,
 *   themes?: Record<string, any>, items?: Record<string, any>, book?: any, eqSets?: any[], hair?: any, ach?: any[],
 *   cut?: { scenes: string[], draw: Function, actors: Function }, story: { prologue: [string, any[]], stages: Record<number, [string, any[]]>, ending: [string, any[]] },
 *   end?: { stats: (lv: string) => string, again: string } }} ChapterDef */
/** @type {ChapterDef[]} 장 번호로 찾음 (0번은 비어 있음) */
export const CHAPTERS = [];
/** 장마다 첫 스테이지 번호 · 시작 난이도 단계 · 이름 */
export const CH_Z0 = /** @type {Record<number, number>} */ ({}), CH_BASE_L = /** @type {Record<number, number>} */ ({}), CH_NAME = /** @type {Record<number, string>} */ ({});
/** 1장 스테이지 수 (운영자 선물 stage·할로윈·레이드는 1장 기준) */
export const CH1_N = 4;
/** @param {ChapterDef} def */
export function regChapter(def) {
  const c = def.c; CHAPTERS[c] = def; CH_Z0[c] = ZONES.length; CH_BASE_L[c] = def.baseL; CH_NAME[c] = def.name;
  for (const z of def.zones) ZONES.push(c > 1 ? Object.assign({ ch: c }, z) : z);
  Object.assign(MONS, def.mons);
  for (const [k, it] of Object.entries(def.items || {})) { ITEM_DEFS[k] = it; if (!it.start && !it.job) BOOK_ALL.push(k); }
  if (def.book) BOOK_SETS.push(Object.assign({ rar: -1, ch: c }, def.book));
  if (def.eqSets) EQ_SETS.push(...def.eqSets);
  if (def.hair) { const i = HAIRS.findIndex(h => h.k === 'silver'); HAIRS.splice(i < 0 ? HAIRS.length : i, 0, def.hair); } // 조건 헤어 사이(은발 앞)에 장 순서대로
}
export const chKeys = () => CHAPTERS.filter(Boolean).map(ch => ch.c);
export const zoneCh = z => { for (let c = CHAPTERS.length - 1; c > 1; c--) if (CHAPTERS[c] && z >= CH_Z0[c]) return c; return 1; };
const chLast = c => CH_Z0[c] + CHAPTERS[c].zones.length - 1;
export const isChLast = z => z >= chLast(zoneCh(z));
/** 2장 이상 진행도 키 */
export const chKey = c => 'ch' + c;
/** 그 장을 몇 번 깼는지 */
export const chClr = (pd, c) => c === 1 ? (pd.cleared || 0) : ((pd[chKey(c)] || {}).cleared || 0);
/** 열렸는지: 앞 장을 한 번 깨고 그 장 레벨 이상 (각성했으면 레벨 조건은 만족) */
export const chOpen = (pd, c) => { if (!pd) return false; if (c === 1) return true; const def = CHAPTERS[c]; return !!def && chClr(pd, c - 1) >= 1 && (pd.lv >= def.lv || (pd.aw || 0) > 0); };
/** 2장 이상 진행도 (없으면 만듦) */
export const chOf = (pd, c) => { const k = chKey(c); return pd[k] || (pd[k] = { zone: CH_Z0[c], cleared: 0 }); };
export const chCleared = (pd, z) => chClr(pd, zoneCh(z));
/** 그 스테이지의 난이도 단계 (몬스터 능력치·보상·드롭 등급) */
export const zoneL = (pd, z) => CH_BASE_L[zoneCh(z)] + loopEff(chCleared(pd, z));
/** 「모험 계속하기」로 갈 스테이지 */
export const curZone = pd => { const c = pd.chap || 1; return c > 1 && chOpen(pd, c) ? chOf(pd, c).zone : (pd.zone || 0); };
export function setCurZone(pd, z) { const c = zoneCh(z); if (c === 1) pd.zone = z; else chOf(pd, c).zone = z; pd.chap = c; }
export const zoneTitle = (pd, z) => { const c = chCleared(pd, z); return (c ? tt('core/chapter.1', { v1: c + 1 }) : '') + ZONES[z].name; };
