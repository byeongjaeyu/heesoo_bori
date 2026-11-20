import { describe, test, expect } from 'vitest';
import { g, fresh } from './helpers.mjs';

describe('장비 도감', () => {
  test('보유 장비는 자동 등록, 1칸당 최대 HP +5', () => {
    const pd = fresh(); g.calcStats(); const hp0 = g.G.st.hp, n0 = g.G.st.book;
    pd.inv.selfie = 1; g.calcStats();
    expect(g.G.st.book).toBe(n0 + 1); expect(g.G.st.hp).toBe(hp0 + g.BOOK_PER_HP); expect(pd.book.selfie).toBe(1);
  });
  test('분해해서 가방에서 없어져도 도감 기록은 남음', () => {
    const pd = fresh(); pd.inv.selfie = 1; g.calcStats(); delete pd.inv.selfie; g.calcStats();
    expect(pd.book.selfie).toBe(1);
  });
  test('세트 완성 보너스: 일반 5종 → 최대 HP +80, 희귀 6종 → 공격 +12', () => {
    const pd = fresh(); g.calcStats(); const hp0 = g.G.st.hp, atk0 = g.G.st.atk;
    const r0 = g.bookIds(g.BOOK_SETS.find(s => s.k === 'r0'));
    for (const id of r0) pd.inv[id] = 1; g.calcStats();
    expect(g.G.st.hp - hp0).toBe(g.BOOK_PER_HP * r0.length + 80);
    const r1 = g.bookIds(g.BOOK_SETS.find(s => s.k === 'r1'));
    for (const id of r1) pd.inv[id] = 1; g.calcStats();
    expect(g.G.st.atk - atk0).toBe(12);
  });
  test('세트 구성: 시작 장비 제외, 전체 = 세트 합', () => {
    const total = g.BOOK_SETS.reduce((a, s) => a + g.bookIds(s).length, 0);
    expect(total).toBe(g.BOOK_ALL.length); expect(g.BOOK_ALL).not.toContain('fist');
  });
  test('새 장비를 주우면 도감 등록, 중복은 그대로', () => {
    const pd = fresh(); localStorage.setItem(g.SAVEKEY, JSON.stringify(pd)); g.calcStats(); const n0 = g.G.st.book;
    g.pickup({ kind: 'item', id: 'umbrella' }); expect(g.G.st.book).toBe(n0 + 1);
    g.pickup({ kind: 'item', id: 'umbrella' }); expect(g.G.st.book).toBe(n0 + 1);
  });
});
