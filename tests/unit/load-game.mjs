// 게임 전역 스크립트(src/*)를 테스트용으로 불러온다. main.js(init 실행)는 빼고(global-setup 에서 생성), 필요한 전역을 꺼내 돌려준다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GAME_JS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../node_modules/.cache/hb-test/game.js');
const NAMES = ['G', 'ITEMS', 'SLOTS', 'BSLOTS', 'RARITY', 'ZONES', 'SKILLS', 'AWK', 'MAX_LV', 'ENH_MAX', 'ENH_P', 'ENH_DOWN', 'ENH_DEST', 'ENH_FX', 'DROP_RATE', 'DROP_MUL', 'STONE_YIELD', 'ILV_NEED', 'ILV_BONUS', 'LOOP_CAP', 'SAVEKEY',
  'newPD', 'loadGame', 'saveGame', 'calcStats', 'enhCost', 'enhStoneCost', 'enhReset', 'enhOdds', 'tryEnhance', 'enhTarget', 'rollDrop', 'loopLv', 'loopMul', 'canDismantle', 'dismantle', 'stoneYield', 'feedEquip', 'ilvOf', 'gainXp', 'awkNeed', 'awkLv', 'xpNeed', 'autoLeft', 'pvpSnap', 'pickup'];

const HTML = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/index.html'), 'utf8');

/** 그리기는 테스트 대상이 아니라 아무것도 안 하는 2D 컨텍스트로 대체 */
function fakeCtx(canvas) {
  const base = { canvas, measureText: t => ({ width: String(t).length * 6 }), getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }), createLinearGradient: () => ({ addColorStop() { } }), createRadialGradient: () => ({ addColorStop() { } }), createPattern: () => ({}) };
  return new Proxy(base, { get: (t, k) => (k in t ? t[k] : () => { }), set: (t, k, v) => { t[k] = v; return true; } });
}
function setupDom() {
  document.documentElement.innerHTML = HTML.replace(/^[\s\S]*?<html[^>]*>/, '').replace(/<\/html>[\s\S]*$/, '').replace(/<script>[\s\S]*?<\/script>/g, '');
  HTMLCanvasElement.prototype.getContext = function () { return this.__ctx || (this.__ctx = fakeCtx(this)); };
  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
  globalThis.matchMedia = globalThis.matchMedia || (() => ({ matches: false, addEventListener() { }, addListener() { } }));
}

let cached = null;
/** 테스트 파일 하나당 한 번 로드 (vitest 는 파일마다 새 jsdom 전역) */
export function loadGame({ forceEasy = false } = {}) {
  if (cached) return cached;
  setupDom();
  const js = fs.readFileSync(GAME_JS, 'utf8');
  const pick = NAMES.map(n => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(',');
  // 간접 eval = 전역 스코프 실행 (실제 배포본처럼 파일끼리 전역 공유)
  cached = (0, eval)(js.replace("'use strict';\n", `'use strict';\nconst FORCE_EASY = ${forceEasy};\n`) + `\n;({ ${pick} })`);
  return cached;
}
