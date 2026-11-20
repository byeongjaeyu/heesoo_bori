import { describe, test, expect } from 'vitest';
import { g, fresh } from './helpers.mjs';

describe('출석', () => {
  test('하루에 한 번만, 7일차 큰 보상 후 다시 1일차', () => {
    const pd = fresh({ lv: 10 }); const gold0 = pd.gold;
    const r1 = g.dailyAttend(pd, 'd1'); expect(r1.day).toBe(1); expect(pd.gold).toBe(gold0 + g.dailyGold(pd) * 2);
    expect(g.dailyAttend(pd, 'd1')).toBeNull();
    for (let i = 2; i <= 6; i++) g.dailyAttend(pd, 'd' + i);
    const st0 = pd.stones || 0, a0 = pd.autoBonus || 0;
    const r7 = g.dailyAttend(pd, 'd7'); expect(r7.day).toBe(7);
    expect(pd.stones - st0).toBe(50); expect(pd.autoBonus - a0).toBe(7200);
    expect(g.dailyAttend(pd, 'd8').day).toBe(1);
    expect(pd.att.n).toBe(8);
  });
  test('하루 빠져도 누적 일수는 그대로 이어짐', () => {
    const pd = fresh(); g.dailyAttend(pd, '2026-1-1'); g.dailyAttend(pd, '2026-1-5');
    expect(pd.att.n).toBe(2); expect(g.dailyAttend(pd, '2026-1-9').day).toBe(3);
  });
});

describe('일일 미션', () => {
  test('하루 4개, 항상 몬스터 처치 포함, 같은 날은 같은 미션, 날마다 바뀜', () => {
    const p = g.dailyPicks('2026-11-20');
    expect(p).toHaveLength(4); expect(p[0]).toBe('kill'); expect(new Set(p).size).toBe(4);
    expect(g.dailyPicks('2026-11-20')).toEqual(p);
    const sets = new Set(Array.from({ length: 14 }, (_, i) => g.dailyPicks(`2026-12-${i + 1}`).join(',')));
    expect(sets.size).toBeGreaterThan(2);
  });
  test('진행 → 완료 후에만 받기, 한 번만', () => {
    const pd = fresh(); localStorage.setItem(g.SAVEKEY, JSON.stringify(pd));
    const d = g.dailyState(pd); expect(g.dailyClaim(pd, 'kill')).toBeNull();
    for (let i = 0; i < 200; i++) g.dailyAdd('kill');
    expect(d.prog.kill).toBe(150); // 목표에서 멈춤
    const st0 = pd.stones || 0; expect(g.dailyClaim(pd, 'kill')).toBeTruthy(); expect(pd.stones - st0).toBe(5);
    expect(g.dailyClaim(pd, 'kill')).toBeNull();
  });
  test('오늘 미션이 아닌 건 안 셈', () => {
    const pd = fresh(); localStorage.setItem(g.SAVEKEY, JSON.stringify(pd));
    const d = g.dailyState(pd); const notPicked = Object.keys(g.MISSIONS).find(k => !d.picks.includes(k));
    g.dailyAdd(notPicked, 5); expect(d.prog[notPicked]).toBeUndefined();
  });
  test('4개 다 받으면 보너스, 날짜 바뀌면 미션 초기화(출석 기록은 유지)', () => {
    const pd = fresh(); const day = 'dX'; const d = g.dailyState(pd, day);
    for (const id of d.picks) d.prog[id] = g.MISSIONS[id].n;
    expect(g.dailyClaimAll(pd, day)).toBeNull();
    for (const id of d.picks) g.dailyClaim(pd, id, day);
    const a0 = pd.autoBonus || 0; expect(g.dailyClaimAll(pd, day)).toBeTruthy(); expect(pd.autoBonus - a0).toBe(g.DAILY_ALL.a);
    expect(g.dailyClaimAll(pd, day)).toBeNull();
    g.dailyAttend(pd, day);
    const d2 = g.dailyState(pd, 'dY'); expect(d2.got).toEqual([]); expect(pd.att.n).toBe(1);
  });
  test('받을 게 있으면 개수 표시 (출석 + 완료 미션)', () => {
    const pd = fresh(); const day = 'dZ'; expect(g.dailyClaimable(pd, day)).toBe(1);
    g.dailyAttend(pd, day); expect(g.dailyClaimable(pd, day)).toBe(0);
    pd.daily.prog.kill = 150; expect(g.dailyClaimable(pd, day)).toBe(1);
  });
});
