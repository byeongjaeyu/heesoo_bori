// 할로윈파티 기준: 1~4장 중 가장 어려운 곳의 난이도 (맵은 1장 진행 위치)
import { describe, test, expect } from 'vitest';
import { g } from './helpers.mjs';

const pd = o => Object.assign(g.newPD(), { lv: 50, boriJoined: true }, o);
const le = n => g.loopEff(n);

describe('할로윈파티 난이도 기준 (infBasis)', () => {
  test('아무것도 안 깼으면 1장 STAGE 1·0단계', () => {
    const b = g.infBasis(pd({ lv: 5 }));
    expect([b.zone, b.loop, b.c, !!b.none]).toEqual([0, 0, 1, true]);
  });
  test('1장만 하면 예전과 같음 (진행 중 회차 / 첫 스테이지면 마지막으로 깬 회차)', () => {
    expect(g.infBasis(pd({ cleared: 5, zone: 2 })).loop).toBe(le(5));
    const b = g.infBasis(pd({ cleared: 5, zone: 0 }));
    expect([b.zone, b.loop, b.real]).toEqual([g.CH1_N - 1, le(4), 4]);
  });
  test('다른 장이 더 어려우면 그 장 난이도 (맵은 그대로 1장)', () => {
    // 안녀엉 비슷: 1장 12회차 · 2장 46 · 3장 72(진행 중) · 4장 23
    const p = pd({ cleared: 12, zone: 2, ch2: { zone: g.CH_Z0[2], cleared: 46 }, ch3: { zone: g.CH_Z0[3] + 1, cleared: 72 }, ch4: { zone: g.CH_Z0[4], cleared: 23 } });
    const b = g.infBasis(p);
    expect(b.c).toBe(3); expect(b.real).toBe(72); expect(b.zone).toBe(1);
    expect(b.loop).toBe(g.CH_BASE_L[3] + le(72));
    expect(b.loop).toBe(g.zoneL(p, g.CH_Z0[3] + 1));
  });
  test('시작만 하고 한 번도 안 깬 장은 첫 스테이지면 빼고, 진행 중이면 넣음', () => {
    expect(g.infBasis(pd({ cleared: 30, zone: 1, ch2: { zone: g.CH_Z0[2], cleared: 0 } })).c).toBe(1);
    const b = g.infBasis(pd({ cleared: 3, zone: 1, ch2: { zone: g.CH_Z0[2] + 2, cleared: 0 } }));
    expect([b.c, b.loop]).toEqual([2, g.CH_BASE_L[2]]);
  });
  test('기준을 계산해도 세이브에 빈 장 기록이 생기지 않음', () => {
    const p = pd({ cleared: 3, zone: 1 }); g.infBasis(p);
    expect(p.ch2).toBeUndefined(); expect(p.ch3).toBeUndefined();
  });
});
