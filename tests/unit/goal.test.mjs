import { describe, test, expect } from 'vitest';
import { g, fresh } from './helpers.mjs';

describe('회차 보상 단계표', () => {
  test('총 회차 = 1~3장 클리어 합계, 예전 기록도 소급해서 받을 수 있음', () => {
    const pd = fresh({ cleared: 6, ch2: { zone: 4, cleared: 26 } });
    expect(g.loopsTotal(pd)).toBe(32);
    expect(g.msReady(pd).map(m => m.n)).toEqual([3, 5, 10, 15, 20, 30]);
    expect(g.msNext(pd).n).toBe(40);
    pd.ms = { 3: 1, 5: 1 }; expect(g.msReady(pd).map(m => m.n)).toEqual([10, 15, 20, 30]);
  });
  test('100회차 이후에도 25회차마다 이정표가 계속 생김', () => {
    const pd = fresh({ cleared: 160 });
    expect(g.msList(pd).map(m => m.n).filter(n => n > 100)).toEqual([125, 150, 175]);
  });
  test('보상 반영: 강화석·자동사냥, 초월 장비는 안 가진 것 중에서 (다 있으면 강화석)', () => {
    const pd = fresh({ stones: 0, boriJoined: true });
    g.applyRewards(pd, [['stones', 100], ['auto', 3600]]);
    expect(pd.stones).toBe(100); expect(pd.autoBonus).toBe(3600);
    const tr = Object.keys(g.ITEMS).filter(id => g.ITEMS[id].rar === 5 && !g.ITEMS[id].bossOnly);
    const got = new Set(); for (let i = 0; i < tr.length; i++) got.add(g.giveTr(pd));
    expect([...got].sort()).toEqual(tr.sort());
    for (const id of tr) expect(pd.book[id]).toBe(1);
    const s = pd.stones; expect(g.giveTr(pd)).toBe(null); expect(pd.stones).toBe(s + 120);
  });
  test('한정 헤어는 해당 회차 보상을 받아야 열림, 칭호는 총 회차로 달성', () => {
    const pd = fresh({ cleared: 25 }), wine = g.HAIRS.find(h => h.k === 'wine');
    expect(g.hairOk(pd, wine)).toBe(false); pd.ms = { 20: 1 }; expect(g.hairOk(pd, wine)).toBe(true);
    const lp30 = g.ACH.find(a => a.id === 'lp30'); expect(g.achDone(pd, lp30)).toBe(false);
    pd.ch3 = { zone: 8, cleared: 5 }; expect(g.achDone(pd, lp30)).toBe(true);
  });
});

describe('보스 타워', () => {
  test('층마다 보스가 1~3장 순서로 돌고, 층이 오를수록 난이도·보상이 오름', () => {
    expect(g.towerBoss(1)).toBe('boss1'); expect(g.towerBoss(12)).toBe('raincloud'); expect(g.towerBoss(13)).toBe('boss1');
    expect(g.towerL(30)).toBeGreaterThan(g.towerL(10));
    expect(g.towerHpMul(10)).toBeGreaterThan(g.towerHpMul(9));
    const r10 = Object.fromEntries(g.towerReward(10)); expect(r10.stones).toBe(100); expect(r10.tr).toBe(1); expect(r10.auto).toBe(1800);
    expect(Object.fromEntries(g.towerReward(30)).hair).toBe('flame');
    expect(g.towerReward(7)).toEqual([['stones', 38]]);
  });
  test('타워 칭호·헤어는 최고 층 기준', () => {
    const pd = fresh({ tower: { best: 30 } });
    expect(g.achDone(pd, g.ACH.find(a => a.id === 'tw30'))).toBe(true);
    expect(g.achDone(pd, g.ACH.find(a => a.id === 'tw50'))).toBe(false);
    expect(g.hairOk(pd, g.HAIRS.find(h => h.k === 'flame'))).toBe(true);
  });
});
