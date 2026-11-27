// @vitest-environment node
// 구조 검사 (11/27 모듈화): 소스는 import/export 모듈, 배포본은 ORDER 순서로 이어 붙인 전역 스크립트.
// tsc 가 못 잡는 것 = 두 파일에 같은 최상위 이름(이어 붙이면 덮어쓰거나 깨짐), ORDER 에 빠진 파일
import { describe, test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { ORDER, ROOT, stripModule } from '../../build/hb-build.mjs';

const SRC = path.join(ROOT, 'src');
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
    const all = [...fs.readdirSync(SRC).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)), ...fs.readdirSync(path.join(SRC, 'chapters')).map(f => 'chapters/' + f.slice(0, -3))];
    expect(all.filter(n => !ORDER.includes(n))).toEqual([]);
  });
  test('빌드가 import/export 를 걷어냄 (한 줄 import · 선언 앞 export 만 허용)', () => {
    expect(stripModule("import { a, b } from './x.js';\nexport const c = a;\nexport function d() {}\n")).toBe('const c = a;\nfunction d() {}\n');
    expect(() => stripModule("export default 1;\n")).toThrow();
    for (const n of ORDER) expect(() => stripModule(fs.readFileSync(path.join(SRC, n + '.js'), 'utf8'), n)).not.toThrow();
  });
});
