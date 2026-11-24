import { describe, test, expect } from 'vitest';
import { g, fresh } from './helpers.mjs';

describe('사냥·보스전 강화석', () => {
  test('보스는 확정(2 + 단계/4, 최대 20), PvP·레이드·라이벌은 없음', () => {
    fresh(); g.G.pvp = null; g.G.raid = null;
    expect(g.killStones({ boss: true }, 0)).toBe(2);
    expect(g.killStones({ boss: true }, 20)).toBe(7);
    expect(g.killStones({ boss: true }, 200)).toBe(20);
    g.G.raid = {}; expect(g.killStones({ boss: true }, 20)).toBe(0); g.G.raid = null;
    expect(g.killStones({ rival: true }, 20)).toBe(0);
  });
  test('일반 약 1%·정예 약 10%(1~2개)', () => {
    fresh(); g.G.pvp = null; g.G.raid = null;
    let n = 0, e = 0; for (let i = 0; i < 40000; i++) { n += g.killStones({}, 10); e += g.killStones({ elite: true }, 10) > 0 ? 1 : 0; }
    expect(n / 40000).toBeGreaterThan(0.006); expect(n / 40000).toBeLessThan(0.014);
    expect(e / 40000).toBeGreaterThan(0.08); expect(e / 40000).toBeLessThan(0.12);
  });
  test('줍기: 강화석 증가', () => {
    const pd = fresh({ stones: 5 }); g.G.texts = []; g.pickup({ kind: 'stone', amt: 3 }); expect(pd.stones).toBe(8);
  });
});
