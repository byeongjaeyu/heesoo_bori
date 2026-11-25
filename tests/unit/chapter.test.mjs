import { describe, test, expect } from 'vitest';
import { g, fresh, withRandom } from './helpers.mjs';

describe('2장 (유료 바다낚시터)', () => {
  test('1장을 깨고 Lv30이 되면 열림', () => {
    expect(g.ch2Open(fresh({ lv: 40, cleared: 0 }))).toBe(false);
    expect(g.ch2Open(fresh({ lv: 29, cleared: 3 }))).toBe(false);
    expect(g.ch2Open(fresh({ lv: 30, cleared: 1 }))).toBe(true);
  });
  test('난이도: 2장 1회차 = 1장 10회차 수준(9단계)에서 시작해 2장 회차마다 오름, 1장은 그대로', () => {
    const pd = fresh({ lv: 30, cleared: 7 });
    expect(g.zoneL(pd, 0)).toBe(7); expect(g.zoneL(pd, 4)).toBe(9);
    pd.ch2 = { zone: 4, cleared: 2 }; expect(g.zoneL(pd, 6)).toBe(11);
  });
  test('2장 마지막 스테이지는 대물탕 (유료 낚시터에 갯바위 없음)', () => {
    expect(g.ZONES[7].name).toBe('대물탕'); expect(g.ZONES[6].next).toBe('대물탕');
    expect(g.ITEMS.rainboot.name).toBe('미끄럼방지 장화');
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
  test('난이도: 3장 1회차 = 20단계(1장 약 15회차), 장별 진행도 따로', () => {
    const pd = fresh({ lv: 50, cleared: 20, zone: 1 }); pd.ch2 = { zone: 6, cleared: 3 };
    expect(g.zoneL(pd, 8)).toBe(20);
    g.setCurZone(pd, 10); expect([pd.zone, pd.ch2.zone, pd.ch3.zone, pd.chap, g.curZone(pd)]).toEqual([1, 6, 10, 3, 10]);
    pd.ch3.cleared = 2; expect(g.zoneL(pd, 11)).toBe(22);
  });
  test('응원 장비 7종은 3장 보스 확정 드롭 전용, 도감 세트는 낚시와 따로', () => {
    const park = g.bookIds(g.BOOK_SETS.find(s => s.k === 'park')), sea = g.bookIds(g.BOOK_SETS.find(s => s.k === 'sea'));
    expect(park.length).toBe(7); expect(sea.length).toBe(7); expect(park.some(id => sea.includes(id))).toBe(false);
    const drops = ['cutking', 'chickboss', 'cheerleader', 'raincloud'].flatMap(b => g.MONS[b].drops); expect(drops.sort()).toEqual([...park].sort());
  });
});

describe('4장 (결혼 대작전)', () => {
  test('3장을 깨고 Lv50이면 열림', () => {
    const pd = fresh({ lv: 50, cleared: 5 }); pd.ch2 = { zone: 4, cleared: 1 }; expect(g.ch4Open(pd)).toBe(false);
    pd.ch3 = { zone: 8, cleared: 1 }; expect(g.ch4Open(pd)).toBe(true);
  });
  test('ZONES 12~15 = 4장, 난이도 24단계부터, 장별 진행도 따로', () => {
    expect([12, 13, 14, 15].map(z => g.zoneCh(z))).toEqual([4, 4, 4, 4]); expect(g.zoneCh(11)).toBe(3);
    const pd = fresh({ lv: 50, cleared: 20 }); pd.ch3 = { zone: 9, cleared: 2 };
    expect(g.zoneL(pd, 12)).toBe(24);
    g.setCurZone(pd, 14); expect([pd.ch3.zone, pd.ch4.zone, pd.chap, g.curZone(pd)]).toEqual([9, 14, 4, 14]);
  });
  test('몬스터·보스 정의·스프라이트·보스 AI가 다 있음', () => {
    for (const z of [12, 13, 14, 15]) { const Z = g.ZONES[z]; for (const [m] of Z.mons) expect(g.MONS[m]).toBeTruthy(); expect(g.MONS[Z.boss].boss).toBe(1); expect(typeof g.AI[g.MONS[Z.boss].ai]).toBe('function'); }
  });
  test('웨딩 준비 장비 7종 = 4장 보스 확정 드롭, 도감 세트 따로 · 웨딩 세트(전직)는 빠짐', () => {
    const wed = g.bookIds(g.BOOK_SETS.find(s => s.k === 'wed')); expect(wed.length).toBe(7);
    const drops = ['feeking', 'parrot', 'tuxboss', 'gamelord'].flatMap(b => g.MONS[b].drops); expect(drops.sort()).toEqual([...wed].sort());
    for (const id of ['bouquet', 'wdress', 'veil']) expect(wed.includes(id)).toBe(false);
  });
  test('웨딩 준비 세트: 7개 모두 착용해야 공격·방어·HP +15% (도감만 모으면 효과 없음)', () => {
    const S = g.EQ_SETS.find(x => x.k === 'wed4'); expect([...S.ids].sort()).toEqual([...g.bookIds(g.BOOK_SETS.find(s => s.k === 'wed'))].sort());
    const stat = pd => { g.G.pd = pd; g.G.P = null; g.calcStats(); return { ...g.G.st }; };
    const pd = fresh({ lv: 50, boriJoined: true }); for (const id of S.ids) { pd.inv[id] = 1; pd.book = pd.book || {}; pd.book[id] = 1; }
    const wearAll = () => { pd.eq = Object.assign(pd.eq, { weapon: 'ringbox', hat: 'pearlpin', armor: 'dress2', shoes: 'heels', bag: 'envbag' }); pd.beq = { bcloth: 'b_tux', btoy: 'toy_ring' }; };
    wearAll(); pd.beq.btoy = null; const six = stat(pd); expect(g.eqSetN(pd, S)).toBe(6);
    wearAll(); const all = stat(pd); expect(g.eqSetN(pd, S)).toBe(7);
    expect(all.atk).toBeGreaterThan(six.atk * 1.12); expect(all.def).toBeGreaterThan(six.def * 1.12); expect(all.hp).toBeGreaterThan(six.hp * 1.12);
  });
});
