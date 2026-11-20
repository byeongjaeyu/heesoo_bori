import { describe, test, expect } from 'vitest';
import { g, fresh, withRandom } from './helpers.mjs';

describe('장비 드롭', () => {
  test('1회차에는 신화·초월이 안 나옴 (가장 높은 등급 굴림이 다 성공해도)', () => {
    fresh({ cleared: 0 }); g.G.zone = 3;
    for (let i = 0; i < 50; i++) { const id = withRandom(0, () => g.rollDrop(1)); expect(id).toBeTruthy(); expect(g.ITEMS[id].rar).toBeLessThanOrEqual(3); }
  });
  test('2회차부터 신화, 3회차부터 초월', () => {
    fresh({ cleared: 1 }); g.G.zone = 3;
    expect(g.ITEMS[withRandom(0, () => g.rollDrop(1))].rar).toBe(4);
    fresh({ cleared: 2 }); g.G.zone = 3;
    expect(g.ITEMS[withRandom(0, () => g.rollDrop(1))].rar).toBe(5);
  });
  test('확률보다 큰 값이 나오면 아무것도 안 떨어짐', () => {
    fresh(); expect(withRandom(0.5, () => g.rollDrop(1))).toBeNull();
  });
  test('일반 몬스터 기준 확률표 (1회차): 일반 1/80 … 전설 1/2000', () => {
    expect(g.DROP_RATE.map(r => Math.round(1 / r))).toEqual([80, 250, 800, 2000, 5000, 12000]);
    expect(g.DROP_MUL).toEqual({ normal: 1, elite: 5, boss: 25 });
  });
});

describe('강화석 수입', () => {
  test('분해 강화석 1·2·4·10·25·60, 사냥 중 중복은 평균 0.5·1.5·4·10·25·60', () => {
    expect(g.STONE_YIELD).toEqual([1, 2, 4, 10, 25, 60]); expect(g.DUP_YIELD).toEqual([0.5, 1.5, 4, 10, 25, 60]);
  });
  test('엔드급(11회차+) 기대 강화석: 처치당 약 0.07~0.1개 (시간당 4,000마리 기준 약 280~400개)', () => {
    const pd = fresh({ cleared: 12, boriJoined: true }); g.G.zone = 3;
    // 확률표로 정확히 계산 (정예 비율 반영, 착용 중인 초월과 같은 등급은 장비 레벨 재료라 제외)
    const L = g.loopLv(), lm = g.loopMul(), elite = lm.elite || 0; let perKill = 0;
    for (let r = 0; r < 5; r++) { const p = g.DROP_RATE[r] * lm.item * ((1 - elite) * 1 + elite * g.DROP_MUL.elite); perKill += p * g.DUP_YIELD[r]; }
    expect(L).toBe(11); expect(perKill).toBeGreaterThan(0.07); expect(perKill).toBeLessThan(0.1);
  });
  test('11회차부터도 난이도는 계속 오름 (증가폭 절반), 드롭 배율은 상한 유지', () => {
    const at = cl => { fresh({ cleared: cl }); return [g.loopLv(), g.loopMul()]; };
    expect(at(10)[0]).toBe(10); expect(at(11)[0]).toBe(10.5); expect(at(50)[0]).toBe(30);
    expect(at(50)[1].hp).toBeGreaterThan(at(20)[1].hp); expect(at(50)[1].item).toBe(at(10)[1].item);
  });
});
