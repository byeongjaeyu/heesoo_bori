import { test, expect, URL_MAIN, URL_ONETOUCH, MOCK_SB, withSave, enterZone, openTab } from './fixtures.mjs';

test('타이틀이 뜨고 폰트가 로드됨', async ({ page }) => {
  await page.goto(URL_MAIN);
  await expect(page.locator('#title')).toBeVisible();
  expect(await page.evaluate(() => document.fonts.check('16px HB'))).toBe(true);
  expect(await page.evaluate(() => FORCE_EASY)).toBe(false);
});

test('이어하기는 누르는 순간의 최신 세이브를 씀 (타이틀 뒤에 바뀐 선물 반영)', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 10, gold: 100, zone: 1 });
  await expect(page.locator('#tCont')).toBeVisible();
  await page.evaluate(() => { const d = JSON.parse(localStorage.getItem(SAVEKEY)); d.gold = 5000000; localStorage.setItem(SAVEKEY, JSON.stringify(d)); });
  await page.click('#tCont'); await page.waitForTimeout(500);
  expect(await page.evaluate(() => G.pd.gold)).toBe(5000000);
});

test('메뉴 탭이 모두 열리고 강화 버튼이 동작', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 30, gold: 1e6, stones: 50, boriJoined: true, zone: 1 });
  await enterZone(page, 1);
  for (const tab of ['skill', 'equip', 'bori', 'food', 'shop', 'info']) await openTab(page, tab);
  await openTab(page, 'equip');
  await page.click('button[data-m=enhSel][data-v="h:armor"]');
  const before = await page.evaluate(() => G.pd.gold);
  await page.click('button[data-m=enhance][data-v=armor]');
  expect(await page.evaluate(() => G.pd.gold)).toBeLessThan(before);
});

test('Lv50 각성 패널에서 포인트 투자', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 50, aw: 3, ap: 3, zone: 1 });
  await enterZone(page, 1);
  await openTab(page, 'skill');
  await page.click('button[data-m=awk][data-v=atk]');
  expect(await page.evaluate(() => [G.pd.ap, G.pd.awp.atk])).toEqual([2, 1]);
  await expect(page.locator('#lv')).toHaveText('Lv50★3');
});

test('랭킹: 미등록이면 "내 희수도 올리기" → 닉네임 등록 후 순위에 표시', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 12, zone: 1 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rows.push({ user_id: 'u-other', nickname: '원조희수', snap: { lv: 50, eq: newPD().eq }, power: 4000, rating: 1000, wins: 0, losses: 0 }); });
  await page.click('#tRank');
  await page.click('.rjoin button');
  await page.fill('#pvpNickIn', '테스트희수'); await page.click('#pvpNickOk');
  await expect(page.locator('.rjoin')).toHaveCount(0);
  expect(await page.evaluate(() => __rows.map(r => r.nickname))).toEqual(['원조희수', '테스트희수']);
});

test('선물함: 자동사냥·골드·회차·각성 수령', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 50, gold: 10, aw: 1, zone: 0 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rows.push({ user_id: 'u-me', nickname: '나', snap: {}, power: 1 }); PV.notReg = false; PV.me = null;
    __grants = [{ kind: 'auto', amount: 3600 }, { kind: 'gold', amount: 1000 }, { kind: 'stage', amount: 9 }, { kind: 'awaken', amount: 5 }]; });
  await page.evaluate(() => rankSync(true));
  const d = await page.evaluate(() => JSON.parse(localStorage.getItem(SAVEKEY)));
  expect([d.autoBonus, d.gold, d.cleared, d.zone, d.aw, d.ap]).toEqual([3600, 1010, 2, 0, 5, 4]);
});

test('원터치 에디션: 큰 글씨 모드로 열림', async ({ page }) => {
  await page.goto(URL_ONETOUCH);
  await expect(page.locator('#title')).toBeVisible();
  expect(await page.evaluate(() => [FORCE_EASY, document.documentElement.classList.contains('big')])).toEqual([true, true]);
});

test('랭킹 등록: 다른 기기로 옮겨진 희수면 안내 문구', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 12 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rpc.hb_submit_fighter = () => ({ ok: false, reason: 'moved' }); });
  await page.click('#tRank');
  await page.click('.rjoin button');
  await page.fill('#pvpNickIn', '옛기기희수'); await page.click('#pvpNickOk');
  await expect(page.locator('#pvpNickMsg')).toContainText('다른 기기로 옮겨졌어요');
});
