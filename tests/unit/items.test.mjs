import { describe, test, expect } from 'vitest';
import { g, fresh, withRandom } from './helpers.mjs';

describe('개별 장비 (같은 장비 여러 개)', () => {
  test('ITEMS는 개별 키로 찾아도 원래 장비 정의, Object.keys에는 장비 이름만', () => {
    expect(g.ITEMS['starstick#ab12']).toBe(g.ITEMS.starstick);
    expect('starstick#ab12' in g.ITEMS).toBe(true); expect('nope#ab12' in g.ITEMS).toBe(false);
    expect(Object.keys(g.ITEMS).some(k => k.includes('#'))).toBe(false);
    expect(g.defOf('starstick#ab12')).toBe('starstick'); expect(g.defOf('starstick')).toBe('starstick'); expect(g.defOf(null)).toBe(null);
  });
  test('첫 개는 이름 그대로(예전 세이브 호환), 둘째부터 따로 키 — 강화는 장비마다 따로', () => {
    const pd = fresh();
    const a = g.addItem(pd, 'starstick'), b = g.addItem(pd, 'starstick', 20);
    expect(a).toBe('starstick'); expect(b).toMatch(/^starstick#\w{4}$/);
    expect(g.keysOf(pd, 'starstick')).toEqual([a, b]); expect(pd.enh[a]).toBeUndefined(); expect(pd.enh[b]).toBe(20);
    expect(pd.book.starstick).toBe(1);
    pd.eq.weapon = a; g.calcStats(); const atkA = g.G.st.atk;
    pd.eq.weapon = b; g.calcStats(); expect(g.G.st.atk).toBeGreaterThan(atkA); expect(g.G.st.enh).toBe(20);
  });
  test('강화는 착용 중인 그 장비만 오름', () => {
    const pd = fresh({ gold: 1e9, stones: 1e6 }); const a = g.addItem(pd, 'starstick'), b = g.addItem(pd, 'starstick', 5);
    pd.eq.weapon = b; withRandom(0, () => g.tryEnhance(false, 'weapon'));
    expect(pd.enh[b]).toBe(6); expect(pd.enh[a]).toBeUndefined();
  });
  test('분해·판매하면 그 장비의 강화·재련 기록도 같이 사라짐 (다시 생겨도 +0)', () => {
    const pd = fresh(); g.addItem(pd, 'starstick'); const b = g.addItem(pd, 'starstick');
    pd.ref = { [b]: { lines: [], n: 1 } }; pd.iexp[b] = 0; g.dropItem(pd, b);
    expect(pd.inv[b]).toBeUndefined(); expect(pd.ref[b]).toBeUndefined();
    expect(g.ownsDef(pd, 'starstick')).toBe(true);
  });
  test('중복 드롭: 기본은 강화석, 보관 설정 등급 이상이면 가방에 따로', () => {
    const pd = fresh({ stones: 0 }); g.addItem(pd, 'starstick');
    withRandom(0, () => g.pickup({ kind: 'item', id: 'starstick' }));
    expect(g.keysOf(pd, 'starstick').length).toBe(1); expect(pd.stones).toBe(60);
    pd.keepDup = 5; g.pickup({ kind: 'item', id: 'starstick' });
    expect(g.keysOf(pd, 'starstick').length).toBe(2); expect(pd.stones).toBe(60);
    pd.keepDup = 5; g.addItem(pd, 'cap_tiara'); const s0 = pd.stones; withRandom(0, () => g.pickup({ kind: 'item', id: 'umbrella' }));
    expect(g.keysOf(pd, 'umbrella').length).toBe(1);
    withRandom(0, () => g.pickup({ kind: 'item', id: 'umbrella' })); // 낮은 등급 중복은 그대로 강화석(또는 장비 레벨 재료)
    expect(g.keysOf(pd, 'umbrella').length).toBe(1); expect(pd.stones).toBeGreaterThanOrEqual(s0);
  });
  test('가방이 가득 차면 보관 설정이어도 강화석', () => {
    const pd = fresh({ stones: 0, keepDup: 0 }); g.addItem(pd, 'starstick');
    for (let i = Object.keys(pd.inv).length; i < g.BAG_MAX; i++) pd.inv['umbrella#f' + i] = 1;
    withRandom(0, () => g.pickup({ kind: 'item', id: 'starstick' }));
    expect(g.keysOf(pd, 'starstick').length).toBe(1); expect(pd.stones).toBe(60);
  });
  test('랭킹·PvP 스냅샷에는 장비 이름만 (개별 키 안 나감)', () => {
    const pd = fresh({ boriJoined: true }); g.addItem(pd, 'starstick'); const b = g.addItem(pd, 'starstick', 3);
    g.addItem(pd, 'toy_carp'); const t = g.addItem(pd, 'toy_carp'); pd.eq.weapon = b; pd.beq.btoy = t;
    const { snap } = g.pvpSnap();
    expect(snap.eq.weapon).toBe('starstick'); expect(snap.w.id).toBe('starstick'); expect(snap.vis.weapon).toBe('starstick'); expect(snap.beq.btoy).toBe('toy_carp');
  });
});

describe('재련 옵션은 장비에 붙음 (슬롯이 아님)', () => {
  test('같은 장비 두 개 중 재련한 장비를 착용했을 때만 옵션이 붙고, 넘기면(지우면) 옵션도 같이 사라짐', () => {
    const pd = fresh({ gold: 1e9 }); const a = g.addItem(pd, 'starstick'), b = g.addItem(pd, 'starstick');
    pd.ref = { [b]: { lines: [{ k: 'atkP', v: 20, g: 3 }], n: 1 } };
    pd.eq.weapon = a; g.calcStats(); const atkA = g.G.st.atk;
    pd.eq.weapon = b; g.calcStats(); expect(g.G.st.atk).toBeCloseTo(atkA * 1.2, 0);
    pd.eq.weapon = a; g.calcStats(); expect(g.G.st.atk).toBeCloseTo(atkA, 5); // 벗으면 옵션도 빠짐
    g.dropItem(pd, b); expect(pd.ref[b]).toBeUndefined();
  });
});

describe('숫자 쉼표', () => {
  test('4자리 이상 숫자는 쉼표, 닉네임·날짜·코드·소수는 그대로', () => {
    const f = g.fmtNumText;
    expect(f('강화석 12345개')).toBe('강화석 12,345개'); expect(f('+123456G')).toBe('+123,456G'); expect(f('1000')).toBe('1,000'); expect(f('999')).toBe('999');
    expect(f('전투력 7524 · 2위')).toBe('전투력 7,524 · 2위'); expect(f('판매 95000 → 90250 받음')).toBe('판매 95,000 → 90,250 받음');
    expect(f('희수1234')).toBe('희수1234'); expect(f('2026-11-23')).toBe('2026-11-23'); expect(f('2026년 11월')).toBe('2026년 11월');
    expect(f('starstick#ab12')).toBe('starstick#ab12'); expect(f('1,234,567G')).toBe('1,234,567G'); expect(f('12:00')).toBe('12:00'); expect(f('1234.5')).toBe('1234.5');
    expect(g.numF(2000000)).toBe('2,000,000');
  });
});
