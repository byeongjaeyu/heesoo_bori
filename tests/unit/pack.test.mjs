import { describe, test, expect } from 'vitest';
import { g, fresh } from './helpers.mjs';

describe('뉴비 패키지', () => {
  test('처음 본 뒤 24시간 동안만, 받으면 끝', () => {
    const pd = fresh(); expect(g.packLeft(pd)).toBe(24 * 3600e3); // 아직 안 봄
    pd.pack = { seen: Date.now() - 23 * 3600e3 }; expect(g.packLeft(pd)).toBeGreaterThan(0);
    pd.pack = { seen: Date.now() - 25 * 3600e3 }; expect(g.packLeft(pd)).toBe(0);
    pd.pack = { seen: Date.now(), got: Date.now() }; expect(g.packLeft(pd)).toBe(0);
  });
  test('한정 헤어·칭호는 받은 사람만, 칭호는 업적 보상 없음', () => {
    const pd = fresh(); const hr = g.HAIRS.find(h => h.k === 'lavender');
    expect(g.hairOk(pd, hr)).toBe(false); pd.pack = { got: 1 }; expect(g.hairOk(pd, hr)).toBe(true);
    pd.stones = 0; pd.ach = {}; g.G.state = 'play'; g.achvCheck(); expect(pd.ach.beta).toBeTruthy(); expect(pd.stones).toBe(0);
  });
});
