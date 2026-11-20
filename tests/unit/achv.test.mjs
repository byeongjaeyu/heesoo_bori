import { describe, test, expect } from 'vitest';
import { g, fresh } from './helpers.mjs';

describe('업적과 칭호', () => {
  test('조건을 넘으면 한 번만 등록되고 강화석 지급', () => {
    const pd = fresh(); pd.stones = 0; pd.stats.kills = 1200; g.G.state = 'play';
    g.achvCheck();
    expect(pd.ach.k100 && pd.ach.k1k).toBeTruthy(); expect(pd.ach.k10k).toBeUndefined();
    expect(pd.stones).toBe(g.ACH_REW[1] + g.ACH_REW[2]); expect(pd.achNew).toBe(true);
    g.achvCheck(); expect(pd.stones).toBe(g.ACH_REW[1] + g.ACH_REW[2]); // 중복 지급 없음
  });
  test('예전 세이브(통계에 boss·pvpW 없음)도 오류 없이 검사', () => {
    const pd = fresh(); delete pd.stats.boss; delete pd.stats.pvpW; pd.ach = undefined;
    expect(() => g.achvCheck()).not.toThrow();
  });
  test('+25 풀강은 착용 장비 전부(보리 포함)가 +25여야', () => {
    const pd = fresh(); pd.boriJoined = true; pd.enh = {};
    pd.beq = Object.fromEntries(g.BSLOTS.map(s => [s, Object.keys(g.ITEMS).find(id => g.ITEMS[id].slot === s)]));
    const a = g.ACH_BY.eall; for (const s of g.SLOTS) pd.enh[pd.eq[s]] = 25;
    expect(a.v(pd) >= g.achGoal(a, pd)).toBe(false);
    for (const s of g.BSLOTS) pd.enh[pd.beq[s]] = 25;
    expect(a.v(pd) >= g.achGoal(a, pd)).toBe(true);
  });
  test('칭호는 달성한 것만 snap에 실리고, 모르는 id는 표시 안 함', () => {
    const pd = fresh(); pd.title = 'k100k'; expect(g.pvpSnap().snap.ttl).toBeNull();
    pd.ach = { k100k: 1 }; expect(g.pvpSnap().snap.ttl).toBe('k100k');
    expect(g.achTag('<img onerror=x>')).toBe(''); expect(g.achTag('k100k')).toContain('에버랜드 청소부');
  });
  test('칭호 id는 겹치지 않음', () => { expect(new Set(g.ACH.map(a => a.id)).size).toBe(g.ACH.length); });
});
