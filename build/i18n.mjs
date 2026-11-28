// 화면 문구 모으기 (11/28 구조 개편 ⑤)
//   texts/<언어>/<묶음>.json  = { "ui/menu.12": "문구 {n}개", … }   (묶음 = 장 파일은 ch1~ch4, 나머지는 폴더 이름)
//   코드: tt('ui/menu.12', { n })   (sys/i18n.js)
//   index.html: <b data-tt="html.3"></b> · 속성은 data-tta="alt=html.4"
//
// `npm run texts`        src 에 새로 쓴 한글 문구를 찾아 texts/ko 로 옮기고 코드를 tt(…) 로 바꿈 (이미 옮긴 건 그대로)
// `npm run texts -- -n`  바꾸지 않고 옮길 문구 목록만 보여줌
// 옮기지 않는 한글(로직에 쓰는 값): 비교(===)·case·객체 키·includes/indexOf/split/replace 첫 인자·RegExp·console·Error,
//   줄 끝(또는 윗줄)에 `// i18n-keep` 이 있는 줄, 파일 맨 위에 `// i18n-keep-file` 이 있는 파일.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src'), TEXTS = path.join(ROOT, 'texts');
export const HANGUL = /[가-힣ㄱ-ㆎ]/;
const PH = /\{[A-Za-z_][\w]*\}/; // 자리표시자 모양 — 원래 글에 있으면 못 옮김

// ---------- 묶음 파일 ----------
export const groupOf = key => { const f = key.slice(0, key.lastIndexOf('.')); return f.startsWith('chapters/') ? f.slice(9) : f === 'html' ? 'html' : f.split('/')[0]; };
/** texts/<lang>/*.json 을 합친 { lang: { key: text } } */
export function loadTexts() {
  const out = {};
  if (!fs.existsSync(TEXTS)) return { ko: {} };
  for (const lang of fs.readdirSync(TEXTS).filter(d => fs.statSync(path.join(TEXTS, d)).isDirectory()).sort()) {
    const m = out[lang] = {};
    for (const f of fs.readdirSync(path.join(TEXTS, lang)).filter(f => f.endsWith('.json')).sort()) Object.assign(m, JSON.parse(fs.readFileSync(path.join(TEXTS, lang, f), 'utf8')));
  }
  if (!out.ko) out.ko = {};
  return out;
}
const keyNum = k => +k.slice(k.lastIndexOf('.') + 1);
const keyCmp = (a, b) => { const fa = a.slice(0, a.lastIndexOf('.')), fb = b.slice(0, b.lastIndexOf('.')); return fa < fb ? -1 : fa > fb ? 1 : keyNum(a) - keyNum(b); };
export function saveKo(map) {
  const dir = path.join(TEXTS, 'ko'); fs.mkdirSync(dir, { recursive: true });
  const groups = {};
  for (const k of Object.keys(map).sort(keyCmp)) (groups[groupOf(k)] ||= {})[k] = map[k];
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) if (!groups[f.slice(0, -5)]) fs.unlinkSync(path.join(dir, f));
  for (const [g, m] of Object.entries(groups)) fs.writeFileSync(path.join(dir, g + '.json'), JSON.stringify(m, null, 1) + '\n');
}

// ---------- 소스 파일 ----------
export function srcFiles() {
  const out = [];
  const walk = d => { for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(js|ts)$/.test(f) && !f.endsWith('.d.ts')) out.push(p); } };
  walk(SRC); return out;
}
const fileKey = f => path.relative(SRC, f).replace(/\\/g, '/').replace(/\.(js|ts)$/, '');

const SKIP_ALL_ARGS = new Set(['includes', 'indexOf', 'lastIndexOf', 'startsWith', 'endsWith', 'has', 'get', 'test', 'match', 'matchAll', 'search', 'getItem', 'setItem', 'removeItem', 'querySelector', 'querySelectorAll', 'getElementById', 'closest', 'delete']);
const SKIP_FIRST_ARG = new Set(['replace', 'replaceAll', 'split']);
const SKIP_CALLEE = new Set(['RegExp', 'Error', 'TypeError', 'RangeError']);

const isKoNode = n => (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? HANGUL.test(n.text)
  : ts.isTemplateExpression(n) ? [n.head, ...n.templateSpans.map(s => s.literal)].some(p => HANGUL.test(p.text)) : false;

/** 이 한글 글자 노드를 옮기면 안 되는 이유 (없으면 null) */
function keepReason(n, sf, keepLines) {
  const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line;
  if (keepLines.has(line) || keepLines.has(line - 1)) return 'keep 주석';
  let c = n, p = n.parent;
  while (p && ts.isParenthesizedExpression(p)) { c = p; p = p.parent; }
  if (!p) return null;
  if (ts.isTaggedTemplateExpression(p)) return 'tagged';
  if ((ts.isPropertyAssignment(p) || ts.isPropertyDeclaration(p) || ts.isMethodDeclaration(p) || ts.isEnumMember(p)) && p.name === c) return '객체 키';
  if (ts.isComputedPropertyName(p)) return '객체 키';
  if (ts.isElementAccessExpression(p) && p.argumentExpression === c) return '[키]';
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isLiteralTypeNode(p)) return '모듈';
  if (ts.isBinaryExpression(p)) {
    const k = p.operatorToken.kind;
    if ([ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(k)) return '비교';
    if (k === ts.SyntaxKind.InKeyword && p.left === c) return 'in';
  }
  if (ts.isCaseClause(p)) return 'case';
  if ((ts.isCallExpression(p) || ts.isNewExpression(p)) && p.arguments && p.arguments.includes(c)) {
    const e = p.expression;
    const name = ts.isPropertyAccessExpression(e) ? e.name.text : ts.isIdentifier(e) ? e.text : '';
    if (SKIP_CALLEE.has(name)) return name;
    if (ts.isPropertyAccessExpression(e)) {
      if (SKIP_ALL_ARGS.has(name)) return name;
      if (SKIP_FIRST_ARG.has(name) && p.arguments[0] === c) return name;
      if (ts.isIdentifier(e.expression) && e.expression.text === 'console') return 'console';
    }
    if (name === 'tt') return 'tt';
  }
  return null;
}

/** 파일 하나에서 옮길 수 있는(안쪽에 옮길 한글이 없는) 노드들 + 옮기지 않는 한글 목록 */
function scan(code, fname) {
  const sf = ts.createSourceFile(fname, code, ts.ScriptTarget.Latest, true);
  const fileKeep = /^\s*\/\/\s*i18n-keep-file/m.test(code.split('\n').slice(0, 5).join('\n'));
  const keepLines = new Set(); code.split('\n').forEach((l, i) => { if (/\/\/.*i18n-keep\b/.test(l)) keepLines.add(i); });
  const todo = [], kept = [];
  const visit = node => {
    let innerTodo = false;
    ts.forEachChild(node, ch => { if (visit(ch)) innerTodo = true; });
    if (!isKoNode(node)) return innerTodo;
    const why = fileKeep ? '파일 keep' : keepReason(node, sf, keepLines);
    if (why) { kept.push({ node, why }); return innerTodo; }
    if (ts.isTemplateExpression(node) && [node.head, ...node.templateSpans.map(s => s.literal)].some(p => PH.test(p.text))) { kept.push({ node, why: '{이름} 모양 글자' }); return innerTodo; }
    if (!innerTodo) todo.push(node);
    return true;
  };
  visit(sf);
  return { sf, todo, kept };
}

/** 템플릿 → { text: '글 {a} 글', args: [[이름, 식 소스]] } */
function templateMsg(node, sf) {
  let text = node.head.text; const args = [], byExpr = new Map(), used = new Set();
  for (const s of node.templateSpans) {
    const src = s.expression.getText(sf);
    let name = byExpr.get(src);
    if (!name) {
      const e = s.expression;
      let base = ts.isIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) ? e.name.text : '';
      if (!/^[A-Za-z_]\w*$/.test(base) || base === 'tt') base = 'v';
      name = base; let i = 2; while (used.has(name) || (base === 'v' && name === 'v')) { name = base + i++; if (base !== 'v' && !used.has(name)) break; }
      if (base === 'v' && !used.has('v1') && name === 'v2') name = 'v1';
      used.add(name); byExpr.set(src, name); args.push([name, src]);
    }
    text += '{' + name + '}' + s.literal.text;
  }
  return { text, args };
}
const callSrc = (key, args) => args.length ? `tt('${key}', { ${args.map(([n, s]) => (n === s ? n : `${n}: ${s}`)).join(', ')} })` : `tt('${key}')`;

/** i18n import 줄 넣기 */
function addImport(code, f) {
  if (/^import \{[^}]*\btt\b[^}]*\} from '[^']*sys\/i18n\.js';/m.test(code) || /sys[\\/]i18n\.(js|ts)$/.test(f)) return code;
  let rel = path.relative(path.dirname(f), path.join(SRC, 'sys/i18n.js')).replace(/\\/g, '/'); if (!rel.startsWith('.')) rel = './' + rel;
  const line = `import { tt } from '${rel}';`;
  const lines = code.split('\n'); let last = -1; lines.forEach((l, i) => { if (/^import \{/.test(l)) last = i; });
  if (last >= 0) lines.splice(last + 1, 0, line);
  else { let i = 0; while (i < lines.length && /^\s*(\/\/|$)/.test(lines[i])) i++; lines.splice(i, 0, line); }
  return lines.join('\n');
}

/** src 의 옮길 한글을 전부 texts/ko 로. dry = 목록만 */
export function extractJs({ dry = false } = {}) {
  const ko = loadTexts().ko, report = [];
  const next = {}; for (const k of Object.keys(ko)) { const f = k.slice(0, k.lastIndexOf('.')); next[f] = Math.max(next[f] || 0, keyNum(k)); }
  for (const f of srcFiles()) {
    const fk = fileKey(f); let code = fs.readFileSync(f, 'utf8'), changed = false;
    const dedupe = new Map(); for (const [k, v] of Object.entries(ko)) if (k.startsWith(fk + '.')) dedupe.set(v, k);
    for (let pass = 0; pass < 20; pass++) {
      const { sf, todo } = scan(code, f); if (!todo.length) break;
      const edits = [];
      for (const n of todo) {
        const m = ts.isTemplateExpression(n) ? templateMsg(n, sf) : { text: n.text, args: [] };
        report.push(fk + ': ' + m.text.replace(/\n/g, '⏎').slice(0, 80));
        let key = dedupe.get(m.text);
        if (!key) { next[fk] = (next[fk] || 0) + 1; key = fk + '.' + next[fk]; ko[key] = m.text; dedupe.set(m.text, key); }
        edits.push([n.getStart(sf), n.end, callSrc(key, m.args)]);
      }
      edits.sort((a, b) => b[0] - a[0]);
      for (const [s, e, r] of edits) code = code.slice(0, s) + r + code.slice(e);
      changed = true;
    }
    if (changed && !dry) fs.writeFileSync(f, addImport(code, f));
  }
  if (!dry) saveKo(ko);
  return report;
}

/** 아직 코드에 남은 옮길 한글 (테스트용) + 옮기지 않은 한글 */
export function scanAll() {
  const todo = [], kept = [];
  for (const f of srcFiles()) {
    const code = fs.readFileSync(f, 'utf8'), r = scan(code, f), fk = fileKey(f);
    const at = n => fk + ':' + (r.sf.getLineAndCharacterOfPosition(n.getStart(r.sf)).line + 1);
    for (const n of r.todo) todo.push(at(n) + ' ' + n.getText(r.sf).slice(0, 60));
    // todo 의 바깥 노드(안쪽 먼저 옮겨야 하는 템플릿)도 남은 것
    for (const k of r.kept) kept.push(at(k.node) + ' [' + k.why + '] ' + k.node.getText(r.sf).slice(0, 50));
  }
  return { todo, kept };
}

/** 코드의 tt('키', {…}) 호출 목록 */
export function ttCalls() {
  const out = [];
  for (const f of srcFiles()) {
    const sf = ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true);
    const v = n => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'tt' && n.arguments.length && ts.isStringLiteral(n.arguments[0])) {
        const a = n.arguments[1];
        const names = a && ts.isObjectLiteralExpression(a) ? a.properties.map(p => p.name && p.name.getText(sf)) : a ? null : [];
        out.push({ file: fileKey(f), key: n.arguments[0].text, names });
      }
      ts.forEachChild(n, v);
    };
    v(sf);
  }
  return out;
}

// ---------- index.html ----------
/** index.html 의 한글을 data-tt / data-tta 로 옮김 (<title> 은 빌드가 바꾸므로 그대로) */
export async function extractHtml({ dry = false } = {}) {
  const { JSDOM } = await import('jsdom');
  const file = path.join(SRC, 'index.html'); let html = fs.readFileSync(file, 'utf8');
  const ko = loadTexts().ko; let n = Math.max(0, ...Object.keys(ko).filter(k => k.startsWith('html.')).map(keyNum));
  const dom = new JSDOM(html, { includeNodeLocations: true }), doc = dom.window.document, edits = [], report = [];
  const direct = el => [...el.childNodes].some(c => c.nodeType === 3 && HANGUL.test(c.textContent));
  const ATTRS = ['alt', 'title', 'placeholder', 'aria-label'];
  for (const el of doc.querySelectorAll('body *, head title')) {
    if (el.tagName === 'TITLE' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
    const loc = dom.nodeLocation(el); if (!loc || !loc.startTag) continue;
    const add = [];
    if (direct(el) && !el.parentElement.closest('[data-tt-mark]')) {
      el.setAttribute('data-tt-mark', '1');
      const inner = html.slice(loc.startTag.endOffset, loc.endTag ? loc.endTag.startOffset : loc.startTag.endOffset);
      const key = 'html.' + ++n; ko[key] = inner; report.push('html: ' + inner.slice(0, 70));
      edits.push([loc.startTag.endOffset, loc.endTag.startOffset, '']); add.push(`data-tt="${key}"`);
    }
    const ta = [];
    for (const a of ATTRS) if (el.hasAttribute(a) && HANGUL.test(el.getAttribute(a)) && loc.attrs && loc.attrs[a]) {
      const key = 'html.' + ++n; ko[key] = el.getAttribute(a); report.push('html@' + a + ': ' + ko[key]);
      const st = loc.attrs[a].startOffset; edits.push([/\s/.test(html[st - 1]) ? st - 1 : st, loc.attrs[a].endOffset, '']); ta.push(a + '=' + key);
    }
    if (ta.length) add.push(`data-tta="${ta.join(';')}"`);
    if (add.length) { const end = loc.startTag.endOffset - (html[loc.startTag.endOffset - 2] === '/' ? 2 : 1); edits.push([end, end, ' ' + add.join(' ')]); }
  }
  edits.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  for (const [s, e, r] of edits) html = html.slice(0, s) + r + html.slice(e);
  if (!dry) { fs.writeFileSync(file, html); saveKo(ko); }
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dry = process.argv.includes('-n');
  const r = [...extractJs({ dry }), ...(await extractHtml({ dry }))];
  console.log(r.join('\n'));
  console.log(`${dry ? '옮길' : '옮긴'} 문구 ${r.length}개`);
}
