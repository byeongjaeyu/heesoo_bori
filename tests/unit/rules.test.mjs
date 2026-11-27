// 공용 숫자(core/rules.js)가 게임 쪽 값·보상과 맞는지
import { describe, test, expect } from 'vitest';
import { g, fresh } from './helpers.mjs';

describe('core/rules.js ↔ 게임', () => {
  test('레벨·강화 상한 = 서버 검사 상한', () => {
    expect(g.RULES.snapMax.lv).toBe(g.MAX_LV); expect(g.RULES.save.lv).toBe(g.MAX_LV);
    expect(g.RULES.snapMax.enh).toBe(g.BRK_MAX); expect(g.RULES.snapMax.tenh).toBe(g.BRK_MAX); expect(g.RULES.save.enh).toBe(g.BRK_MAX);
  });
  test('랭킹 스냅샷 전투력 = powerOf(스냅샷) (서버 hb_power 가 스냅샷으로 계산)', () => {
    const pd = fresh({ lv: 40, boriJoined: true }); pd.sk = { fist: 3, smash: 4, nag: 2, flash: 1, menhera: 2 };
    const { snap, power } = g.pvpSnap();
    expect(Math.abs(g.powerOf(snap) - power)).toBeLessThanOrEqual(2); // 스냅샷은 치명·이동을 소수 둘째 자리로 반올림
    for (const [k, v] of Object.entries(g.RULES.snapMax)) if (typeof snap[k] === 'number') expect(snap[k], k).toBeLessThanOrEqual(v);
  });
  test('한 번에 받는 보상은 서버 세이브 검사 기본 한도 안 (넘으면 정상 유저가 거절당함)', () => {
    const S = g.RULES.save, big = [];
    for (const m of g.LOOP_MS) for (const [k, v] of m.r) big.push([k, v, '회차 ' + m.n]);
    big.push(['stones', g.PACK.stones, '뉴비 패키지'], ['auto', g.PACK.auto, '뉴비 패키지'], ['stones', g.PACK2.stones, '성장 패키지'], ['gold', g.PACK2.gold, '성장 패키지']);
    for (const r of g.ATT_REWARDS || []) for (const [k, v] of Object.entries(r)) if (typeof v === 'number') big.push([k, v, '출석']);
    for (const [k, v, why] of big) {
      if (k === 'stones') expect(v, why).toBeLessThan(S.stones[0]);
      if (k === 'gold') expect(v, why).toBeLessThan(S.gold[0]);
      if (k === 'auto') expect(v, why).toBeLessThan(S.auto[0]);
    }
  });
});
