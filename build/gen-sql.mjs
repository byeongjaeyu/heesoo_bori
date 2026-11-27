// 서버 함수 SQL 만들기: supabase/fn/*.sql 틀의 {{…}} 자리에 src/core/rules.js 의 값을 넣음.
//   npm run sql   → supabase/gen/functions.sql (운영 DB 에 실행할 것) + supabase/gen/check.sql (운영 DB 와 다른 함수 찾기)
// 틀 문법:
//   {{a.b.c}}              RULES 값 (숫자 그대로, 글자는 '…' 로 감쌈)
//   {{list a.b}}           배열 → 12, 24, 48
//   {{pct a.b}}            0.05 → 5
//   {{below a.b}}          값 - 1
//   {{tier season.f expr}} 순위표 → case when expr = 1 then … when expr <= 10 then … else … end (f 가 있는 줄만, 마지막 줄 = else)
//   {{tiermax season.f}}   f 가 있는 줄 중 가장 큰 순위
// 틀 파일은 운영 DB 의 pg_get_functiondef 모양 그대로 둘 것 (check.sql 이 md5 로 비교).
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULES, rewardTxt } from '../src/core/rules.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FN = join(ROOT, 'supabase/fn'), GEN = join(ROOT, 'supabase/gen');

/** 표 계산값 (틀에서 season.txt 처럼 씀) */
function rulesView() {
  return { ...RULES, season: RULES.season.map(t => ({ ...t, txt: rewardTxt(t) })) };
}
function get(R, path) {
  const v = path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), R);
  if (v === undefined) throw new Error('RULES 에 없음: ' + path);
  return v;
}
const lit = v => (typeof v === 'string' ? "'" + v.replace(/'/g, "''") + "'" : typeof v === 'number' && Number.isFinite(v) ? String(v) : (() => { throw new Error('넣을 수 없는 값: ' + JSON.stringify(v)); })());

function tier(R, path, expr) {
  const [tab, f] = [path.slice(0, path.lastIndexOf('.')), path.slice(path.lastIndexOf('.') + 1)];
  const all = get(R, tab), rows = all.map((t, i) => ({ t, prev: i ? all[i - 1].to : 0 })).filter(x => x.t[f] != null);
  if (!rows.length) throw new Error('tier 값 없음: ' + path);
  const last = rows.pop();
  return 'case ' + rows.map(({ t, prev }) => `when ${expr} ${t.to === prev + 1 ? '=' : '<='} ${t.to} then ${lit(t[f])}`).join(' ') + (rows.length ? ' ' : '') + `else ${lit(last.t[f])} end`;
}
function tiermax(R, path) {
  const [tab, f] = [path.slice(0, path.lastIndexOf('.')), path.slice(path.lastIndexOf('.') + 1)];
  const rows = get(R, tab).filter(t => t[f] != null);
  if (rows.some(t => !t.to)) throw new Error('tiermax: 나머지 줄(to 0)에도 값이 있음: ' + path);
  return String(Math.max(...rows.map(t => t.to)));
}

export function render(src, R = rulesView()) {
  return src.replace(/\{\{([^}]+)\}\}/g, (_, body) => {
    const [cmd, ...a] = body.trim().split(/\s+/);
    if (!a.length) return lit(get(R, cmd));
    if (cmd === 'list') return get(R, a[0]).map(lit).join(', ');
    if (cmd === 'pct') return String(Math.round(get(R, a[0]) * 1000) / 10);
    if (cmd === 'below') return String(get(R, a[0]) - 1);
    if (cmd === 'tier') return tier(R, a[0], a.slice(1).join(' '));
    if (cmd === 'tiermax') return tiermax(R, a[0]);
    throw new Error('모르는 틀 명령: ' + body);
  });
}

/** { 이름: 만든 SQL } — 파일 이름 = 함수 이름 */
export function genFunctions() {
  const out = {};
  for (const f of readdirSync(FN).filter(f => f.endsWith('.sql')).sort()) out[f.replace(/\.sql$/, '')] = render(readFileSync(join(FN, f), 'utf8'));
  return out;
}

export function genFiles() {
  const fns = genFunctions(), names = Object.keys(fns);
  const head = '-- 자동 생성 파일 — 고치지 말 것. 원본: supabase/fn/*.sql + src/core/rules.js → `npm run sql`\n-- 운영 DB 에 이 파일 전체를 실행하면 아래 함수들이 rules.js 값으로 바뀜.\n\n';
  const functions = head + names.map(n => fns[n].replace(/\s*$/, '') + ';\n').join('\n');
  const md5 = n => createHash('md5').update(fns[n]).digest('hex');
  const check = '-- 자동 생성 파일 — 운영 DB 에서 실행하면 supabase/gen/functions.sql 과 다른(또는 없는) 함수만 나옴. 빈 결과 = 같음.\n'
    + 'select x.name from (values\n' + names.map(n => `  ('${n}', '${md5(n)}')`).join(',\n') + '\n) x(name, md5)\n'
    + 'where not exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace\n'
    + '  where s.nspname = \'public\' and p.proname = x.name and md5(pg_get_functiondef(p.oid)) = x.md5);\n';
  return { 'functions.sql': functions, 'check.sql': check };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(GEN, { recursive: true });
  for (const [f, s] of Object.entries(genFiles())) writeFileSync(join(GEN, f), s);
  console.log('supabase/gen/ 만듦 — 함수 ' + Object.keys(genFunctions()).length + '개. 운영 DB 에 functions.sql 실행, check.sql 로 확인');
}
