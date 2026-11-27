// @vitest-environment node
// 구조 검사 (11/27 모듈화): 소스는 import/export 모듈, 배포본은 ORDER 순서로 이어 붙인 전역 스크립트.
// tsc 가 못 잡는 것 = 두 파일에 같은 최상위 이름(이어 붙이면 덮어쓰거나 깨짐), ORDER 에 빠진 파일
import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { ORDER, ROOT, stripModule } from '../../build/hb-build.mjs';

const SRC = path.join(ROOT, 'src');
/** src 아래 모든 .js (확장자 뺀 경로, 예: core/save) */
const ALL = (function walk(d) { return fs.readdirSync(path.join(SRC, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name.slice(0, -3)).replace(/\\/g, '/')] : []); })('');
const top = f => { const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.ES2022, true), out = [];
  for (const st of sf.statements) {
    if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) && st.name) out.push(st.name.text);
    else if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) { const add = n => { if (ts.isIdentifier(n)) out.push(n.text); else for (const e of n.elements) if (!ts.isOmittedExpression(e)) add(e.name); }; add(d.name); }
  } return out; };

describe('모듈 구조', () => {
  test('두 파일에 같은 최상위 이름 없음', () => {
    const seen = new Map(), dup = [];
    for (const n of ORDER) for (const k of top(path.join(SRC, n + '.js'))) { if (seen.has(k)) dup.push(`${k}: ${seen.get(k)} / ${n}`); seen.set(k, n); }
    expect(dup).toEqual([]);
  });
  test('src 의 .js 파일은 전부 ORDER 에 있음', () => {
    expect(ALL.filter(n => !ORDER.includes(n))).toEqual([]);
  });
  test('층 규칙: sys·core 는 화면·필드·서버를 모름, draw 는 그리기만 (예외는 아래 목록 — 줄이기만 할 것)', () => {
    const layer = n => n.includes('/') ? n.split('/')[0] : 'main';
    const RULE = { sys: ['sys', 'core'], core: ['core', 'sys'], draw: ['draw', 'core', 'sys'] };
    // 남아 있는 예외: render.js 는 모든 화면을 한 프레임에 합치는 곳 · input.js 는 터치를 대화창·미니게임에 넘김
    const ALLOW = ['draw/render -> play/player', 'draw/render -> ui/lobby', 'draw/render -> net/pvp', 'draw/render -> features/achv', 'draw/render -> net/plaza',
      'sys/input -> ui/dialog', 'sys/input -> minigame/ep2core'];
    const bad = [];
    for (const n of ALL) { const L = layer(n); if (!RULE[L]) continue;
      for (const m of fs.readFileSync(path.join(SRC, n + '.js'), 'utf8').matchAll(/^import \{[^}]*\} from '([^']+)';/gm)) {
        const t = path.relative(SRC, path.join(SRC, path.dirname(n), m[1])).replace(/\\/g, '/').replace(/\.js$/, '');
        if (!RULE[L].includes(layer(t))) bad.push(`${n} -> ${t}`); } }
    expect(bad.sort()).toEqual([...ALLOW].sort());
  });
  test('빌드가 import/export 를 걷어냄 (한 줄 import · 선언 앞 export 만 허용)', () => {
    expect(stripModule("import { a, b } from './x.js';\nexport const c = a;\nexport function d() {}\n")).toBe('const c = a;\nfunction d() {}\n');
    expect(() => stripModule("export default 1;\n")).toThrow();
    for (const n of ORDER) expect(() => stripModule(fs.readFileSync(path.join(SRC, n + '.js'), 'utf8'), n)).not.toThrow();
  });
});
