import { describe, test, expect } from 'vitest';
import { g, fresh } from './helpers.mjs';

describe('첫 걸음 가이드', () => {
  test('새 세이브는 0단계, 예전 세이브는 초반을 지났으면 건너뜀', () => {
    expect(g.newPD().guide).toBe(0);
    const old = g.newPD(); delete old.guide; old.lv = 12; localStorage.setItem(g.SAVEKEY, JSON.stringify(old));
    expect(g.loadGame().guide).toBeGreaterThanOrEqual(g.GUIDE.length);
    const young = g.newPD(); delete young.guide; young.lv = 2; localStorage.setItem(g.SAVEKEY, JSON.stringify(young));
    expect(g.loadGame().guide).toBe(0);
  });
  test('단계 순서대로 진행, 보상은 한 번씩', () => {
    const pd = fresh({ gold: 0, stones: 0 }); localStorage.setItem(g.SAVEKEY, JSON.stringify(pd));
    for (let i = 0; i < 4; i++) g.guideEv('kill');
    expect(pd.guide).toBe(0);
    g.guideEv('kill'); expect(pd.guide).toBe(1); expect(pd.gold).toBe(300);
    g.guideEv('kill'); expect(pd.guide).toBe(1); expect(pd.gold).toBe(300); // 다른 단계 사건은 무시
    pd.skills.smash = 1; g.guideCheck(); expect(pd.guide).toBe(2); expect(pd.foods.persimmon).toBeGreaterThanOrEqual(3);
    g.guideEv('skill:nag'); expect(pd.guide).toBe(2);
    g.guideEv('skill:smash'); expect(pd.guide).toBe(3); expect(pd.gold).toBe(600);
  });
  test('이미 충족한 상태 단계는 연달아 넘어감 (무기 착용 → 강화 단계에서 멈춤)', () => {
    const pd = fresh({ guide: 3, gold: 0 }); pd.inv.churros = 1; pd.eq.weapon = 'churros';
    g.guideCheck(); expect(pd.guide).toBe(4); expect(pd.gold).toBe(500);
  });
  test('보스 잡으면 끝, 끝난 뒤엔 사건 무시', () => {
    const pd = fresh({ guide: g.GUIDE.length - 1, stones: 0 });
    g.guideEv('boss'); expect(pd.guide).toBe(g.GUIDE.length); expect(pd.stones).toBe(10); expect(pd.autoBonus).toBe(1800);
    g.guideEv('boss'); expect(pd.stones).toBe(10);
  });
});
