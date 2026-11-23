import { describe, test, expect } from 'vitest';
import { g, fresh } from './helpers.mjs';

describe('방치 보상', () => {
  test('최대 12시간까지만 쌓이고, 시계를 뒤로 돌리면 0', () => {
    const pd = fresh({ guide: 99 }); pd.idleT = Date.now() - 30 * 3600e3; expect(g.idleSec(pd)).toBe(g.IDLE_MAX);
    pd.idleT = Date.now() + 3600e3; expect(g.idleSec(pd)).toBe(0);
  });
  test('첫 걸음 가이드 전(Lv1 새 세이브)엔 오래 방치해도 0 — 끝내면 쌓임', () => {
    const pd = fresh(); pd.idleT = Date.now() - 30 * 3600e3; expect(pd.guide).toBe(0); expect(g.idleSec(pd)).toBe(0);
    pd.guide = 6; expect(g.idleSec(pd)).toBe(0);
    pd.guide = 7; expect(g.idleSec(pd)).toBe(g.IDLE_MAX);
  });
  test('플레이 중 저장하면 다시 0부터, 타이틀에서 저장하면 그대로', () => {
    const pd = fresh(); pd.idleT = 1; g.G.state = 'title'; g.saveGame(); expect(pd.idleT).toBe(1);
    g.G.state = 'play'; g.saveGame(); expect(Date.now() - pd.idleT).toBeLessThan(1000); g.G.state = 'title';
  });
  test('보상은 시간에 비례, 강화석은 12시간에 약 100개 (엔드급 자동사냥 1시간치보다 적게)', () => {
    const pd = fresh({ zone: 3, cleared: 10, lv: 50 });
    const a = g.idleCalc(pd, 3600), b = g.idleCalc(pd, 7200), full = g.idleCalc(pd, g.IDLE_MAX);
    expect(b.gold).toBeGreaterThan(a.gold * 1.9); expect(full.stones).toBeGreaterThan(80); expect(full.stones).toBeLessThan(150);
  });
  test('Lv50 이후 경험치는 각성으로', () => {
    const pd = fresh({ lv: 50, xp: 0, aw: 0, ap: 0 }); const up = g.idleXp(pd, 1e9);
    expect(up.lv).toBe(0); expect(up.aw).toBeGreaterThan(0); expect(pd.ap).toBe(up.aw);
  });
});
