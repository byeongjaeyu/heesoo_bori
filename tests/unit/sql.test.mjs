// @vitest-environment node
// 서버 함수 SQL 자동 생성(build/gen-sql.mjs) — 틀(supabase/fn) + 표(src/core/rules.js) → supabase/gen
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { genFiles, genFunctions, render } from '../../build/gen-sql.mjs';
import { RULES, powerOf, rewardTxt, seasonLabel } from '../../src/core/rules.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FN = path.join(ROOT, 'supabase/fn');

describe('서버 SQL 자동 생성', () => {
  it('supabase/gen 이 최신 (rules.js·틀을 바꿨으면 `npm run sql` 후 운영 DB 에 functions.sql 실행)', () => {
    for (const [f, s] of Object.entries(genFiles())) expect(fs.readFileSync(path.join(ROOT, 'supabase/gen', f), 'utf8'), f).toBe(s);
  });

  it('틀 파일 이름 = 만드는 함수 이름, {{…}} 가 하나도 안 남음', () => {
    for (const [name, sql] of Object.entries(genFunctions())) {
      expect(sql.startsWith(`CREATE OR REPLACE FUNCTION public.${name}(`), name).toBe(true);
      expect(sql, name).not.toMatch(/\{\{|\}\}/);
      expect(sql.trimEnd().endsWith('$function$'), name).toBe(true);
    }
  });

  it('rules.js 의 서버 값은 전부 어느 틀에선가 쓰임 (안 쓰이면 서버에 반영 안 되는 값)', () => {
    const src = fs.readdirSync(FN).map(f => fs.readFileSync(path.join(FN, f), 'utf8')).join('\n');
    const used = new Set([...src.matchAll(/\{\{([^}]+)\}\}/g)].map(m => { const t = m[1].trim().split(/\s+/); return t.length > 1 ? t[1] : t[0]; }));
    const leaves = [];
    const walk = (o, p) => { if (o && typeof o === 'object') return Object.entries(o).forEach(([k, v]) => walk(v, p ? p + '.' + k : k)); leaves.push(p); };
    walk(RULES, '');
    // 시즌표는 줄 단위로 tier 로 들어감 (season.s → 모든 줄의 s)
    const ok = l => used.has(l) || used.has(l.replace(/\.\d+$/, '')) || used.has(l.replace(/^season\.\d+\.(\w+)$/, 'season.$1')) || /^season\.\d+\.to$/.test(l);
    expect(leaves.filter(l => !ok(l))).toEqual([]);
  });

  it('틀 문법', () => {
    const R = { a: { n: 5, s: "it's", l: [12, 24] }, t: [{ to: 1, x: 9, y: 1 }, { to: 3, x: 5, y: 2 }, { to: 0, x: 1 }] };
    expect(render('{{a.n}} {{a.s}} {{list a.l}} {{below a.n}} {{pct a.n}}', R)).toBe("5 'it''s' 12, 24 4 500");
    expect(render('{{tier t.x r.rk}}', R)).toBe('case when r.rk = 1 then 9 when r.rk <= 3 then 5 else 1 end');
    expect(render('{{tier t.y r.rk}} / {{tiermax t.y}}', R)).toBe('case when r.rk = 1 then 1 else 2 end / 3');
    expect(() => render('{{a.zz}}', R)).toThrow();
  });
});

describe('공용 숫자 (core/rules.js)', () => {
  it('전투력 식 = 예전 식 (서버 hb_power 와 같아야 함)', () => {
    const s = { atk: 812, hp: 5300, def: 96, crit: 0.235, spd: 1.42, bori: true, boriMul: 1.6, sk: { smash: 5, nag: 4, flash: 3, fist: 5, menhera: 4 }, skm: 1.3 };
    const old = Math.round(s.atk * 4 + s.hp * 0.5 + s.def * 6 + s.crit * 300 + Math.max(0, s.spd - 1) * 150 + (50 + (s.boriMul - 1) * 300) + (5 + 4 + 3 + 5) * 12 + 4 * 40 + (s.skm - 1) * 600);
    expect(powerOf(s)).toBe(old);
    expect(powerOf({ ...s, bori: false, sk: {}, skm: 1, spd: 0.9 })).toBe(Math.round(812 * 4 + 5300 * 0.5 + 96 * 6 + 0.235 * 300));
  });

  it('시즌 보상 글·이름표', () => {
    expect(RULES.season.map(rewardTxt)).toEqual(['강화석 150 · 300만G · 자동사냥 3시간', '강화석 100 · 200만G · 자동사냥 2시간', '강화석 70 · 100만G · 자동사냥 1시간', '강화석 30 · 30만G', '강화석 10']);
    expect(RULES.season.map((_, i) => seasonLabel(i))).toEqual(['1위', '2위', '3위', '4~10위', '1판 이상']);
    expect(RULES.season[RULES.season.length - 1].to).toBe(0);
  });
});
