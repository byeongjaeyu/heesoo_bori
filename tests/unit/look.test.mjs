import { describe, test, expect } from 'vitest';
import { g, fresh } from './helpers.mjs';

describe('희수 꾸미기', () => {
  test('도감에 있는 장비만 겉모습으로 적용, 능력치는 그대로', () => {
    const pd = fresh(); pd.look = { hat: 'cap_tiara' };
    expect(g.visEq(pd).hat).toBe(pd.eq.hat); // 도감에 없음 → 무시
    pd.book = Object.assign({}, pd.book, { cap_tiara: 1 }); pd.look = {}; g.calcStats(); const st0 = JSON.stringify([g.G.st.atk, g.G.st.def, g.G.st.hp]);
    pd.look = { hat: 'cap_tiara', hair: 'pink' };
    expect(g.visEq(pd).hat).toBe('cap_tiara');
    g.calcStats(); expect(JSON.stringify([g.G.st.atk, g.G.st.def, g.G.st.hp])).toBe(st0);
  });
  test('다른 부위 장비를 넣어도 무시', () => {
    const pd = fresh(); pd.book = { aurorapad: 1 }; pd.look = { hat: 'aurorapad' };
    expect(g.visEq(pd).hat).toBe(pd.eq.hat);
  });
  test('헤어 색 해금 조건', () => {
    const pd = fresh(); const H = k => g.HAIRS.find(h => h.k === k);
    expect(g.hairOk(pd, H('choco'))).toBe(true); expect(g.hairOk(pd, H('silver'))).toBe(false);
    pd.aw = 50; expect(g.hairOk(pd, H('silver'))).toBe(true);
    expect(g.hairOk(pd, H('red'))).toBe(false); pd.enh[pd.eq.hat] = 25; expect(g.hairOk(pd, H('red'))).toBe(true);
    pd.cleared = 4; expect(g.hairOk(pd, H('mint'))).toBe(true);
  });
  test('랭킹 스냅샷에 겉모습·헤어 포함', () => {
    const pd = fresh(); pd.book = { cap_tiara: 1 }; pd.look = { hat: 'cap_tiara', hair: 'pink' }; g.calcStats();
    const { snap } = g.pvpSnap(); expect(snap.vis.hat).toBe('cap_tiara'); expect(snap.hair).toBe('pink'); expect(snap.eq.hat).toBe(pd.eq.hat);
  });
});
