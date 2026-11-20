import { describe, test, expect } from 'vitest';
import { g, fresh, withRandom } from './helpers.mjs';

describe('강화석 교환소', () => {
  test('하루 300개, 100개마다 값 두 배 (300개 전부 210만G)', () => {
    expect(g.xchCost(0, 100)).toBe(300000); expect(g.xchCost(0, 300)).toBe(2100000); expect(g.xchCost(150, 10)).toBe(60000);
  });
  test('한도·골드 안에서만 삼', () => {
    const pd = fresh({ gold: 1e9, stones: 0 }); g.xchBuy(Infinity); expect(pd.stones).toBe(300); expect(pd.gold).toBe(1e9 - 2100000);
    g.xchBuy(10); expect(pd.stones).toBe(300); // 오늘 한도
    const p2 = fresh({ gold: 31000, stones: 0 }); g.xchBuy(Infinity); expect(p2.stones).toBe(10); expect(p2.gold).toBe(1000);
  });
});

describe('장비 재련', () => {
  test('등급별 줄 수: 일반·희귀 1, 영웅·전설 2, 신화·초월 3', () => {
    expect([0, 1, 2, 3, 4, 5].map(r => g.refLineN({ rar: r }))).toEqual([1, 1, 2, 2, 3, 3]);
  });
  test('골드를 쓰고 옵션이 붙으며 능력치에 반영, 잠근 줄은 유지되고 값이 오름', () => {
    const pd = fresh({ lv: 50, gold: 1e9 }); pd.inv.starstick = 1; pd.eq.weapon = 'starstick'; g.calcStats();
    const atk0 = g.G.st.atk, c0 = g.refCost(pd, 'starstick');
    expect(g.refine('starstick')).toBe(true); expect(pd.gold).toBe(1e9 - c0); expect(pd.ref.starstick.lines.length).toBe(3);
    // 공격 옵션을 직접 넣어 반영 확인
    pd.ref.starstick.lines[0] = { k: 'atkP', v: 10, g: 2 }; g.calcStats(); expect(g.G.st.atk).toBeGreaterThan(atk0 * 1.08);
    g.refLock('starstick', 0); expect(g.refCost(pd, 'starstick')).toBe(c0 * 2);
    for (let i = 0; i < 5; i++) g.refine('starstick');
    expect(pd.ref.starstick.lines[0]).toMatchObject({ k: 'atkP', v: 10 });
    const ks = pd.ref.starstick.lines.map(l => l.k); expect(new Set(ks).size).toBe(3); // 같은 옵션 중복 없음
  });
  test('골드 부족하면 안 됨, 시작 장비는 재련 불가', () => {
    const pd = fresh({ gold: 10 }); pd.inv.starstick = 1; pd.eq.weapon = 'starstick';
    expect(g.refine('starstick')).toBe(false); expect(pd.ref).toBeUndefined();
    pd.gold = 1e9; expect(g.refine('fist')).toBe(false);
  });
  test('보스 피해 옵션은 보스에게만', () => {
    const pd = fresh({ lv: 50 }); pd.inv.starstick = 1; pd.eq.weapon = 'starstick'; pd.ref = { starstick: { lines: [{ k: 'bossP', v: 50, g: 3 }], n: 1 } }; g.calcStats();
    const hit = boss => withRandom(0.5, () => g.dealDamage({ hp: 1e9, def: 0, boss, x: 0, y: 0, m: {} }, 1000, { noCrit: true }));
    expect(hit(1) / hit(0)).toBeCloseTo(1.5, 1);
  });
});
