import { describe, test, expect } from 'vitest';
import { g, fresh } from './helpers.mjs';

const lv50 = o => fresh(Object.assign({ lv: 50, gold: 0, stones: 0 }, o));
const stat = pd => { g.G.pd = pd; g.G.P = null; g.calcStats(); return g.G.st; };

describe('전직', () => {
  test('Lv50부터, 첫 전직 무료 · 바꾸면 강화석 2,000 + 1,000만G', () => {
    g.JOB_BETA.free = false;
    const p49 = fresh({ lv: 49 }); expect(g.jobSet(p49, 'dev')).toBe(false); expect(p49.job).toBeUndefined();
    const pd = lv50(); expect(g.jobSet(pd, 'dev')).toEqual([]); expect(pd.job).toBe('dev');
    expect(g.jobSet(pd, 'career')).toBe(false); // 돈 없음
    pd.stones = 2500; pd.gold = 10000000; expect(g.jobSet(pd, 'career')).toEqual([]);
    expect([pd.job, pd.stones, pd.gold, pd.jobN]).toEqual(['career', 500, 0, 1]);
    expect(g.jobSet(pd, 'career')).toBe(false); // 같은 직업
    g.JOB_BETA.free = true;
  });
  test('베타 기간: 직업 바꾸기 무료(강화석·골드 그대로)', () => {
    const pd = lv50(); g.jobSet(pd, 'dev'); expect(g.jobSet(pd, 'bride')).not.toBe(false); expect(g.jobSet(pd, 'fish')).not.toBe(false);
    expect([pd.job, pd.stones, pd.gold, pd.jobN]).toEqual(['fish', 0, 0, 2]);
  });
  test('예전 세이브(job 없음)는 직업 효과 없음', () => {
    const pd = lv50(); const a = stat(pd).atk; pd.job = 'nope'; expect(stat(pd).atk).toBe(a); expect(g.jobOf(pd)).toBe(null);
  });
  test('개발자: 스킬 위력 +15%, 맥북프로 끼면 공격 +20%, 신화 무기도 맥북 레벨 재료', () => {
    const pd = lv50({ inv: { fist: 1, starstick: 1 } }); pd.eq.weapon = 'starstick';
    const base = stat(pd); const a0 = base.atk, s0 = base.skillMul;
    g.jobSet(pd, 'dev'); const st = stat(pd);
    expect(st.skillMul).toBeCloseTo(s0 + 0.15); expect(st.atk).toBe(Math.round(a0 * 1.2));
    expect(g.jobFeedOk(pd, 'starstick', g.ITEMS.goldpan)).toBe(true); expect(g.jobFeedOk(pd, 'starstick', g.ITEMS.limitbag)).toBe(false);
    pd.job = 'career'; expect(g.jobFeedOk(pd, 'starstick', g.ITEMS.goldpan)).toBe(false);
  });
  test('커리어우먼: 골드 +20%, 사원증이면 공격 속도·관통, 핸드백이면 치명 +5%', () => {
    const pd = lv50({ inv: { fist: 1, goldpan: 1, limitbag: 1 } }); pd.eq.weapon = 'goldpan'; pd.eq.bag = 'limitbag';
    const b = stat(pd); const gm = b.goldMul, cr = b.crit; g.jobSet(pd, 'career'); const st = stat(pd);
    expect(st.goldMul).toBeCloseTo(gm * 1.2); expect(st.rateMul).toBe(1.2); expect(st.pierce).toBe(3); expect(st.crit).toBeGreaterThanOrEqual(cr + 0.05);
  });
  test('응원단장: 응원 장비 개수만큼 공격 +4%, 보리·동료 보너스', () => {
    const pd = lv50({ inv: { fist: 1, bat: 1, uniform: 1, cheercap: 1 } }); Object.assign(pd.eq, { weapon: 'bat', armor: 'uniform', hat: 'cheercap' });
    const b = stat(pd); const a0 = b.atk, bm = b.boriMul; g.jobSet(pd, 'cheer'); const st = stat(pd);
    expect(g.jobSigN(pd, 'cheer')).toBe(3); expect(st.atk).toBeGreaterThan(Math.round(a0 * 1.12)); expect(st.boriMul).toBeCloseTo(bm + 0.2); expect(st.buddyMul).toBe(1.3);
  });
  test('새신부: 처음 전직하면 웨딩 세트 3종(착용) · HP·방어↑ · 3개면 회복', () => {
    const pd = lv50(); const got = g.jobSet(pd, 'bride');
    expect(got.length).toBe(3); expect([pd.eq.weapon, pd.eq.armor, pd.eq.hat]).toEqual(['bouquet', 'wdress', 'veil']);
    const st = stat(pd); expect(st.regen).toBe(0.03);
    pd.job = null; const b = stat(pd); pd.job = 'bride'; const s2 = stat(pd);
    expect(s2.hp).toBeGreaterThan(Math.round(b.hp * 1.15 * 1.21)); expect(s2.def).toBeGreaterThan(Math.round(b.def * 1.1 * 1.21));
    // 바꿨다 돌아와도 선물은 한 번만
    pd.stones = 9999; pd.gold = 1e8; g.jobSet(pd, 'dev'); g.jobSet(pd, 'bride'); expect(Object.keys(pd.inv).filter(k => g.defOf(k) === 'bouquet').length).toBe(1);
  });
  test('낚시왕: 보스 피해 +15%, 낚시 장비 개수만큼 공격·드롭↑', () => {
    const pd = lv50({ inv: { fist: 1, net: 1, vest: 1 } }); Object.assign(pd.eq, { weapon: 'net', armor: 'vest' });
    const b = stat(pd); const a0 = b.atk, bm = b.bossMul; g.jobSet(pd, 'fish'); const st = stat(pd);
    expect(st.bossMul).toBeCloseTo(bm + 0.15); expect(st.atk).toBeGreaterThan(Math.round(a0 * 1.08)); expect(st.dropMul).toBeCloseTo(1.12);
  });
  test('대표 장비 보정: 같은 강화면 대표 장비가 초월 장비보다 세짐 (직업이 맞을 때만)', () => {
    const top = { weapon: 'starstick', hat: 'cap_tiara', armor: 'aurorapad', shoes: 'wingshoes', bag: 'aurorabag' };
    const mk = (eq, job) => { const pd = lv50(); pd.inv = {}; pd.enh = {}; pd.book = Object.fromEntries(Object.values(top).map(i => [i, 1])); for (const [s, id] of Object.entries(eq)) { pd.inv[id] = 1; pd.eq[s] = id; pd.enh[id] = 25; } pd.job = job; return stat(pd); };
    const base = mk(top, null);
    for (const [job, eq] of [['cheer', { weapon: 'bat', hat: 'cheercap', armor: 'uniform', shoes: 'spike', bag: 'cheerbag' }], ['fish', { weapon: 'net', hat: 'bucket', armor: 'vest', shoes: 'wingshoes', bag: 'tackle' }]]) {
      const st = mk(eq, job); expect(st.atk).toBeGreaterThan(base.atk * 1.1); expect(st.def).toBeGreaterThanOrEqual(base.def); expect(st.hp).toBeGreaterThanOrEqual(base.hp);
      const off = mk(eq, job === 'cheer' ? 'fish' : 'cheer'); expect(off.atk).toBeLessThan(base.atk); // 다른 직업이면 보정 없음
    }
    const pd = lv50(); pd.job = 'cheer'; expect(g.jobSigDef(pd, 'bat').atk).toBe(86); expect(g.jobSigDef(pd, 'starstick')).toBe(null); expect(g.ITEMS.bat.atk).toBe(48);
  });
  test('웨딩 세트는 거래·도감·분해 제외', () => {
    for (const id of ['bouquet', 'wdress', 'veil']) { expect(g.tradableKey(id)).toBe(false); expect(g.BOOK_ALL.includes(id)).toBe(false); }
  });
  test('메뉴 전직 탭: 5직업 모두 보임', () => {
    const h = g.jobHtml(lv50()); for (const id of Object.keys(g.JOBS)) expect(h).toContain(g.JOBS[id].full);
    expect(g.jobHtml(fresh({ lv: 30 }))).toContain('Lv50가 되면');
  });
});
