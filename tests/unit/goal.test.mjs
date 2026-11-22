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

describe('성장 속도 · 성장 패키지', () => {
  test('레벨·각성 곡선이 느려짐 (Lv1→50 합계, 각성 단계당 비용)', () => {
    let tot = 0; for (let l = 1; l < 50; l++) tot += g.xpNeed(l);
    expect(tot).toBeGreaterThan(3e6);
    expect(g.awkNeed(100)).toBe(Math.round(g.AWK_BASE * (1 + 0.25 * 100)));
  });
  test('성장 패키지: 1장 클리어(또는 Lv10) + 첫 패키지가 끝난 뒤에만, 48시간', () => {
    const pd = fresh({ lv: 5, cleared: 0, pack: { seen: Date.now(), got: Date.now() } });
    expect(g.pack2Left(pd)).toBe(0);
    pd.cleared = 1; expect(g.pack2Left(pd)).toBe(48 * 3600 * 1000);
    pd.pack2 = { seen: Date.now() - 47 * 3600 * 1000 }; expect(g.pack2Left(pd)).toBeGreaterThan(0);
    pd.pack2 = { seen: Date.now() - 49 * 3600 * 1000 }; expect(g.pack2Left(pd)).toBe(0);
    const p2 = fresh({ lv: 12, cleared: 0, pack: { seen: Date.now() } }); expect(g.pack2Left(p2)).toBe(0); // 첫 패키지 진행 중
  });
});

describe('광장 채팅', () => {
  test('욕설 필터: 글자 사이 띄어쓰기·기호도 걸림, 60자 제한', () => {
    expect(g.plazaClean('안녕 씨발')).toBe('안녕 ♡♡');
    expect(g.plazaClean('ㅅ ㅂ 진짜')).not.toContain('ㅅ ㅂ');
    expect(g.plazaClean('시.발')).toBe('♡♡♡');
    expect(g.plazaClean('반가워요')).toBe('반가워요');
    expect([...g.plazaClean('가'.repeat(100))].length).toBe(60);
  });
  test('말풍선 줄바꿈: 12자씩 최대 3줄', () => {
    expect(g.plazaWrap('가'.repeat(30), 12)).toHaveLength(3);
    expect(g.plazaWrap('가'.repeat(50), 12)[2].endsWith('…')).toBe(true);
  });
});

describe('한계 돌파 (+26~+30)', () => {
  test('+25 장비만, 강화석 1,000~3,000·성공률 40%→20%, 실패해도 그대로, 기대 강화석 약 4만 개', () => {
    let exp = 0; for (let en = 25; en < 30; en++) { const c = g.brkCost(en); exp += c.stones / c.p; }
    expect(exp).toBeGreaterThan(35000); expect(exp).toBeLessThan(45000);
    expect(g.BRK_STONE).toEqual([1000, 1500, 2000, 2500, 3000]);
  });
  test('성공하면 +1·기본 능력치 +3%, 실패하면 유지, +25 미만이면 불가', () => {
    const pd = fresh({ lv: 50, stones: 10000, gold: 1e8 }); pd.enh = { [pd.eq.weapon]: 25 }; g.G.pd = pd;
    const R = Math.random;
    try {
      Math.random = () => 0.99; let r = g.tryBreak('weapon'); expect(r.res).toBe('keep'); expect(pd.enh[pd.eq.weapon]).toBe(25); expect(pd.stones).toBe(9000);
      Math.random = () => 0; r = g.tryBreak('weapon'); expect(r.res).toBe('up'); expect(pd.enh[pd.eq.weapon]).toBe(26); expect(pd.stones).toBe(8000);
      expect(g.brkMul(pd.eq.weapon)).toBeCloseTo(1.03);
      pd.enh[pd.eq.weapon] = 30; expect(g.tryBreak('weapon')).toBe(null);
      pd.enh[pd.eq.weapon] = 24; expect(g.tryBreak('weapon')).toBe(null);
    } finally { Math.random = R; }
  });
});
