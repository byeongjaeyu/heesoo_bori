import { describe, test, expect } from 'vitest';
import { g, fresh, withRandom } from './helpers.mjs';

describe('2장 (유료 바다낚시터)', () => {
  test('1장을 깨고 Lv30이 되면 열림', () => {
    expect(g.ch2Open(fresh({ lv: 40, cleared: 0 }))).toBe(false);
    expect(g.ch2Open(fresh({ lv: 29, cleared: 3 }))).toBe(false);
    expect(g.ch2Open(fresh({ lv: 30, cleared: 1 }))).toBe(true);
  });
  test('난이도: 2장 1회차 = 1장 5회차 수준(4단계)에서 시작해 2장 회차마다 오름, 1장은 그대로', () => {
    const pd = fresh({ lv: 30, cleared: 7 });
    expect(g.zoneL(pd, 0)).toBe(7); expect(g.zoneL(pd, 4)).toBe(4);
    pd.ch2 = { zone: 4, cleared: 2 }; expect(g.zoneL(pd, 6)).toBe(6);
  });
  test('챕터별 진행도: 2장 스테이지로 옮겨도 1장 위치는 그대로', () => {
    const pd = fresh({ lv: 30, cleared: 1, zone: 2 });
    g.setCurZone(pd, 6); expect([pd.zone, pd.ch2.zone, pd.chap, g.curZone(pd)]).toEqual([2, 6, 2, 6]);
    g.setCurZone(pd, 1); expect([pd.zone, pd.ch2.zone, pd.chap, g.curZone(pd)]).toEqual([1, 6, 1, 1]);
  });
  test('예전 세이브(ch2·chap 없음)는 1장 스테이지로 이어짐', () => {
    const pd = fresh({ lv: 50, cleared: 49, zone: 3 }); delete pd.ch2; delete pd.chap;
    expect(g.curZone(pd)).toBe(3);
  });
  test('낚시 장비는 2장 보스 확정 드롭 전용 (일반 드롭엔 안 나옴), 도감은 별도 세트', () => {
    fresh({ lv: 50, cleared: 20, boriJoined: true }); g.G.zone = 7;
    for (let i = 0; i < 200; i++) { const id = withRandom(Math.random() * 1e-5, () => g.rollDrop(25)); if (id) expect(g.ITEMS[id].bossOnly).toBeFalsy(); }
    const sea = g.bookIds(g.BOOK_SETS.find(s => s.k === 'sea')), r3 = g.bookIds(g.BOOK_SETS.find(s => s.k === 'r3'));
    expect(sea.length).toBe(7); expect(r3.some(id => g.ITEMS[id].bossOnly)).toBe(false);
    const drops = ['truck', 'breamking', 'bassgen', 'grouper'].flatMap(b => g.MONS[b].drops); expect(drops.sort()).toEqual([...sea].sort());
  });
});

describe('3장 (사직 야구장)', () => {
  test('2장을 깨고 Lv50이면 열림', () => {
    expect(g.ch3Open(fresh({ lv: 50, cleared: 5 }))).toBe(false);
    const pd = fresh({ lv: 49, cleared: 5 }); pd.ch2 = { zone: 4, cleared: 1 }; expect(g.ch3Open(pd)).toBe(false);
    pd.lv = 50; expect(g.ch3Open(pd)).toBe(true);
  });
  test('난이도: 3장 1회차 = 1장 9회차 수준(8단계), 장별 진행도 따로', () => {
    const pd = fresh({ lv: 50, cleared: 20, zone: 1 }); pd.ch2 = { zone: 6, cleared: 3 };
    expect(g.zoneL(pd, 8)).toBe(8);
    g.setCurZone(pd, 10); expect([pd.zone, pd.ch2.zone, pd.ch3.zone, pd.chap, g.curZone(pd)]).toEqual([1, 6, 10, 3, 10]);
    pd.ch3.cleared = 2; expect(g.zoneL(pd, 11)).toBe(10);
  });
  test('응원 장비 7종은 3장 보스 확정 드롭 전용, 도감 세트는 낚시와 따로', () => {
    const park = g.bookIds(g.BOOK_SETS.find(s => s.k === 'park')), sea = g.bookIds(g.BOOK_SETS.find(s => s.k === 'sea'));
    expect(park.length).toBe(7); expect(sea.length).toBe(7); expect(park.some(id => sea.includes(id))).toBe(false);
    const drops = ['cutking', 'chickboss', 'cheerleader', 'raincloud'].flatMap(b => g.MONS[b].drops); expect(drops.sort()).toEqual([...park].sort());
  });
});
