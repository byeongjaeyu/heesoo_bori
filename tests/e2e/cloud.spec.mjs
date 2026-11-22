import { test, expect, URL_MAIN, MOCK_SB, withSave, enterZone } from './fixtures.mjs';

test('게임 저장 시 서버에 백업 (1탄 + 2탄)', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 17, gold: 4321, zone: 1 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => localStorage.setItem(E2KEY, JSON.stringify({ mode: 'normal', stars: [3, 3], unlocked: 2, prologue: true, cleared: false, own: {}, cloth: null, toy: null })));
  await enterZone(page, 1);
  await page.evaluate(() => cloudSync(true));
  const row = await page.evaluate(() => __db.hb_saves[0]);
  expect(row.user_id).toBe('u-me'); expect(row.data.lv).toBe(17); expect(row.ep2.stars[1]).toBe(3);
  // 바뀐 게 없으면 다시 안 보냄, 바뀌면 update
  await page.evaluate(() => { G.pd.gold = 9999; return cloudSync(true); });
  expect(await page.evaluate(() => [__db.hb_saves.length, __db.hb_saves[0].data.gold])).toEqual([1, 9999]);
});

test('옛 기기: 옮기기 코드 만들기', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 30 });
  await page.evaluate(MOCK_SB);
  await page.click('#tCloud');
  await page.click('#cloudMk');
  await expect(page.locator('#cloudCodeV')).toHaveText('ABCD 2345');
  await expect(page.locator('#cloudCodeT')).toContainText('남음');
  expect(await page.evaluate(() => __db.hb_saves.length)).toBe(1); // 코드 만들기 전에 백업부터
});

test('새 기기: 코드로 불러오면 세이브가 바뀌고 새로고침', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 3 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rpc.hb_use_transfer_code = ({ p_code }) => p_code === 'ABCD2345'
    ? { ok: true, nickname: '원조희수', data: Object.assign(newPD(), { lv: 50, gold: 123456, cleared: 49, boriJoined: true }), ep2: { mode: 'normal', stars: [3, 2, 3], unlocked: 3, prologue: true, cleared: false, own: {}, cloth: null, toy: null } } : { ok: false, reason: 'invalid' }; });
  await page.click('#tCloud');
  await page.fill('#cloudIn', 'abcd 2344'); await page.click('#cloudUse');
  await expect(page.locator('#confirm')).toBeVisible(); await page.click('#cfYes');
  await expect(page.locator('#cloudUseMsg')).toHaveText('코드가 틀렸거나 만료됐어요');
  await page.fill('#cloudIn', 'abcd 2345'); await page.click('#cloudUse');
  await Promise.all([page.waitForEvent('load'), page.click('#cfYes')]);
  await page.waitForTimeout(500);
  const d = await page.evaluate(() => [loadGame().lv, loadGame().gold, JSON.parse(localStorage.getItem(E2KEY)).stars[2]]);
  expect(d).toEqual([50, 123456, 3]);
  await expect(page.locator('#tCont')).toContainText('50회차');
  await expect(page.locator('#toasts')).toContainText('원조희수 희수를 불러왔어요');
});

test('닉네임 창에서 "다른 기기에서 하던 희수 불러오기"', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 6 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { entryRegDone = false; return entryRegister(); });
  await expect(page.locator('#pvpNick')).toBeVisible();
  await page.click('#pvpNickCloud');
  await expect(page.locator('#cloud')).toBeVisible();
  await page.click('#cloudX');
  await expect(page.locator('#pvpNick')).toBeVisible(); // 닫으면 닉네임 창으로 돌아감
});

test('서버 세이브 검사: 거절되면 마지막 정상 기록으로 되돌리고 안내', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 5, gold: 999999999 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rpc.hb_save_push = () => ({ ok: false, reason: 'gold', data: Object.assign(newPD(), { lv: 5, gold: 100, guide: 99 }), ep2: null }); });
  await Promise.all([page.waitForEvent('load'), page.evaluate(() => cloudSync(true))]);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => loadGame().gold)).toBe(100);
  await expect(page.locator('#toasts')).toContainText('마지막 정상 기록으로 되돌렸어요');
});
