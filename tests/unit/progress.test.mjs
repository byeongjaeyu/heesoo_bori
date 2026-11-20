import { describe, test, expect } from 'vitest';
import { g, fresh } from './helpers.mjs';

describe('장비 레벨 (같은 부위·등급 5개)', () => {
  const sameRar = (slot, rar, not) => Object.keys(g.ITEMS).find(k => g.ITEMS[k].slot === slot && g.ITEMS[k].rar === rar && k !== not);
  test('착용 장비와 같은 부위·등급 5개 → Lv1, 기본 스탯 +5%', () => {
    const pd = fresh(); const cur = pd.eq.armor, rar = g.ITEMS[cur].rar; g.calcStats(); const d0 = g.G.st.def;
    for (let i = 0; i < 5; i++) expect(g.feedEquip(g.ITEMS[cur])).toBe(true);
    expect(pd.ilv[cur]).toBe(1); expect(pd.iexp[cur]).toBe(0);
    expect(g.G.st.def).toBeGreaterThanOrEqual(d0);
  });
  test('다른 부위나 다른 등급은 재료가 안 됨', () => {
    const pd = fresh(); const cur = pd.eq.armor, rar = g.ITEMS[cur].rar;
    const otherSlot = sameRar('shoes', rar); if (otherSlot) expect(g.feedEquip(g.ITEMS[otherSlot])).toBe(pd.eq.shoes && g.ITEMS[pd.eq.shoes].rar === rar);
    const otherRar = Object.keys(g.ITEMS).find(k => g.ITEMS[k].slot === 'armor' && g.ITEMS[k].rar !== rar);
    expect(g.feedEquip(g.ITEMS[otherRar])).toBe(false); expect(pd.iexp[cur] || 0).toBe(0);
  });
});

describe('각성 (Lv50 이후)', () => {
  test('Lv50에서 경험치가 차면 각성 +1, 포인트 +1', () => {
    const pd = fresh({ lv: g.MAX_LV, xp: 0 });
    g.gainXp(g.awkNeed(0) + g.awkNeed(1) + 1);
    expect(pd.lv).toBe(g.MAX_LV); expect(pd.aw).toBe(2); expect(pd.ap).toBe(2);
  });
  test('각성 포인트 투자가 능력치에 반영', () => {
    const pd = fresh({ lv: g.MAX_LV }); g.calcStats(); const a0 = g.G.st.atk;
    pd.awp = { atk: 10, skill: 5 }; g.calcStats();
    expect(g.G.st.atk - a0).toBe(10 * g.AWK.atk.per); expect(g.G.st.skillMul).toBeCloseTo(1 + 5 * g.AWK.skill.per);
  });
});

describe('세이브 호환', () => {
  test('예전 세이브(새 필드 없음)도 기본값으로 불러옴', () => {
    const old = { lv: 7, xp: 3, gold: 100, sp: 0, skills: {}, inv: { fist: 1 }, eq: { weapon: 'fist', hat: 'cap_grey', armor: 'fleece', shoes: 'sneakers', bag: 'silverbag' }, foods: {}, zone: 1 };
    localStorage.setItem(g.SAVEKEY, JSON.stringify(old));
    const pd = g.loadGame();
    expect(pd.lv).toBe(7); expect(pd.enh).toEqual({}); expect(pd.ilv).toEqual({}); expect(pd.beq).toEqual({ bcloth: null, btoy: null }); expect(pd.stones).toBe(0); expect(pd.stats.kills).toBe(0);
  });
  test('사라진 장비를 끼고 있던 세이브는 기본 장비로 교체', () => {
    const pd0 = g.newPD(); pd0.eq.hat = 'no_such_item'; localStorage.setItem(g.SAVEKEY, JSON.stringify(pd0));
    expect(g.loadGame().eq.hat).toBe(g.newPD().eq.hat);
  });
});

describe('자동사냥 시간', () => {
  test('하루 30분 + 선물 보너스 합산', () => {
    const pd = fresh(); pd.autoBonus = 3600;
    expect(g.autoLeft()).toBe(1800 + 3600);
  });
});

describe('세이브 고유 번호(sid)', () => {
  test('새 세이브마다 다른 sid', () => {
    expect(g.newPD().sid).toBeTruthy(); expect(g.newPD().sid).not.toBe(g.newPD().sid);
  });
  test('sid 없는 예전 세이브는 처음 불러올 때 만들어 저장 → 다시 불러와도 같은 값', () => {
    const old = g.newPD(); delete old.sid; localStorage.setItem(g.SAVEKEY, JSON.stringify(old));
    const a = g.loadGame().sid, b = g.loadGame().sid;
    expect(a).toBeTruthy(); expect(b).toBe(a); expect(JSON.parse(localStorage.getItem(g.SAVEKEY)).sid).toBe(a);
  });
  test('랭킹 스냅샷에 sid·스킬 위력(skm) 포함', () => {
    const pd = fresh({ lv: g.MAX_LV }); pd.awp = { skill: 10 }; g.calcStats();
    const { snap } = g.pvpSnap();
    expect(snap.sid).toBe(pd.sid); expect(snap.skm).toBeCloseTo(1 + 10 * g.AWK.skill.per);
  });
});
