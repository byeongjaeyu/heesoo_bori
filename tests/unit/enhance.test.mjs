import { describe, test, expect } from 'vitest';
import { g, fresh, withRandom, expectedEnhCost } from './helpers.mjs';

describe('강화 확률표', () => {
  test('+0~+24 각 단계 확률이 정의돼 있고 합이 1 이하', () => {
    expect(g.ENH_MAX).toBe(25);
    for (const arr of [g.ENH_P, g.ENH_DOWN, g.ENH_DEST]) expect(arr).toHaveLength(25);
    for (let l = 0; l < 25; l++) expect(g.ENH_P[l] + g.ENH_DOWN[l] + g.ENH_DEST[l]).toBeLessThanOrEqual(1);
  });
  test('0→+25 기대 비용 약 500만G, +20 약 52만G, +17 약 15만G', () => {
    expect(expectedEnhCost(25)).toBeGreaterThan(4.6e6); expect(expectedEnhCost(25)).toBeLessThan(5.4e6);
    expect(expectedEnhCost(20)).toBeGreaterThan(4.5e5); expect(expectedEnhCost(20)).toBeLessThan(6e5);
    expect(expectedEnhCost(17)).toBeGreaterThan(1.2e5); expect(expectedEnhCost(17)).toBeLessThan(1.8e5);
  });
  test('강화석을 매번 써도: 골드 약 128만G + 강화석 약 2,700개 (+20 이상 강화석 50~200개)', () => {
    expect([20, 21, 22, 23, 24].map(g.enhStoneCost)).toEqual([50, 80, 120, 160, 200]);
    const gold = expectedEnhCost(25, { stone: true }), stones = expectedEnhCost(25, { stone: true, cost: g.enhStoneCost });
    expect(gold).toBeGreaterThan(1.1e6); expect(gold).toBeLessThan(1.5e6);
    expect(stones).toBeGreaterThan(2400); expect(stones).toBeLessThan(3000);
  });
  test('파괴 시 +20 미만은 +12, +20 이상은 +17로', () => {
    expect(g.enhReset(15)).toBe(12); expect(g.enhReset(22)).toBe(17);
  });
});

describe('tryEnhance', () => {
  test('희수 5부위 + 보리 2부위 모두 강화되고 서로 독립', () => {
    const pd = fresh({ gold: 1e9, boriJoined: true });
    pd.inv.toy_bone = 1; pd.beq.btoy = 'toy_bone'; pd.inv.b_pad = 1; pd.beq.bcloth = 'b_pad';
    for (const sl of [...g.SLOTS, ...g.BSLOTS]) withRandom(0, () => g.tryEnhance(false, sl));
    for (const sl of [...g.SLOTS, ...g.BSLOTS]) expect(pd.enh[g.enhTarget(sl)]).toBe(1);
  });
  test('성공(up)·유지(keep) 모두 골드 차감', () => {
    const pd = fresh({ gold: 10000 }); const id = pd.eq.weapon;
    const r1 = withRandom(0, () => g.tryEnhance(false, 'weapon'));
    expect(r1.res).toBe('up'); expect(pd.gold).toBe(10000 - g.enhCost(0));
    pd.enh[id] = 5; const before = pd.gold; const r2 = withRandom(0.9999, () => g.tryEnhance(false, 'weapon'));
    expect(r2.res).toBe('keep'); expect(pd.enh[id]).toBe(5); expect(pd.gold).toBe(before - g.enhCost(5));
  });
  test('+25에서는 더 강화되지 않음', () => {
    const pd = fresh({ gold: 1e9 }); pd.enh[pd.eq.weapon] = 25;
    expect(g.tryEnhance(false, 'weapon')).toBeFalsy(); expect(pd.enh[pd.eq.weapon]).toBe(25);
  });
  test('파괴되면 리셋 단계로 떨어지고 장비는 남음', () => {
    const pd = fresh({ gold: 1e9 }); const id = pd.eq.armor; pd.enh[id] = 22;
    // 굴림 순서: 성공 → 하락 → 파괴 → 유지. 파괴 구간 한가운데 값
    const o = g.enhOdds(22, false); const r = withRandom(o.p + o.dn + o.ds / 2, () => g.tryEnhance(false, 'armor'));
    expect(r.res).toBe('boom'); expect(pd.enh[id]).toBe(17); expect(pd.inv[id]).toBe(1);
  });
  test('강화 효과: 무기 +10 = 공격 +25, 치명 +10%', () => {
    const pd = fresh(); g.calcStats(); const a0 = g.G.st.atk, c0 = g.G.st.crit;
    pd.enh[pd.eq.weapon] = 10; g.calcStats();
    expect(g.G.st.atk - a0).toBe(25); expect(g.G.st.crit - c0).toBeCloseTo(0.1);
  });
  test('강화석 사용 시 파괴 대신 하락(saved)', () => {
    const pd = fresh({ gold: 1e9, stones: 500 }); const id = pd.eq.armor; pd.enh[id] = 22;
    const o = g.enhOdds(22, true); const r = withRandom(o.p + o.dn + o.ds / 2, () => g.tryEnhance(true, 'armor'));
    if (o.ds) { expect(r.res).toBe('saved'); expect(pd.enh[id]).toBe(21); }
  });
  test('+22에서 강화석이 120개 미만이면 강화석 강화 불가, 쓰면 120개 차감', () => {
    const pd = fresh({ gold: 1e9, stones: 119 }); pd.enh[pd.eq.hat] = 22;
    expect(g.tryEnhance(true, 'hat')).toBeNull();
    pd.stones = 120; expect(g.tryEnhance(true, 'hat')).toBeTruthy(); expect(pd.stones).toBe(0);
  });
  test('강화한 장비는 분해 불가', () => {
    const pd = fresh(); pd.inv.sneakers2 = 1; const id = Object.keys(g.ITEMS).find(k => g.ITEMS[k].slot === 'shoes' && !pd.inv[k]);
    pd.inv[id] = 1; expect(g.canDismantle(id)).toBe(true); pd.enh[id] = 1; expect(g.canDismantle(id)).toBe(false);
  });
});
