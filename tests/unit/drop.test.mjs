import { describe, test, expect } from 'vitest';
import { g, fresh, withRandom } from './helpers.mjs';

describe('장비 드롭', () => {
  test('1회차에는 신화·초월이 안 나옴 (가장 높은 등급 굴림이 다 성공해도)', () => {
    fresh({ cleared: 0 }); g.G.zone = g.ZONES.length - 1;
    for (let i = 0; i < 50; i++) { const id = withRandom(0, () => g.rollDrop(1)); expect(id).toBeTruthy(); expect(g.ITEMS[id].rar).toBeLessThanOrEqual(3); }
  });
  test('2회차부터 신화, 3회차부터 초월', () => {
    fresh({ cleared: 1 }); g.G.zone = g.ZONES.length - 1;
    expect(g.ITEMS[withRandom(0, () => g.rollDrop(1))].rar).toBe(4);
    fresh({ cleared: 2 }); g.G.zone = g.ZONES.length - 1;
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
