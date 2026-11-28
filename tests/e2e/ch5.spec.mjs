import { test, expect, URL_MAIN, withSave } from './fixtures.mjs';

const SAVE = { lv: 50, gold: 500000, cleared: 3, boriJoined: true, chap: 5, ch2: { zone: 4, cleared: 1, intro: 1 }, ch3: { zone: 8, cleared: 1, intro: 1 }, ch4: { zone: 12, cleared: 1, intro: 1 } };

test('5장: 나무자재 없으면 배달앱으로 → 사서 들고 출발 → 어린 희수·보리 없음·무기 잠금', async ({ page }) => {
  await withSave(page, URL_MAIN, SAVE);
  await expect(page.locator('.tchap.c5 .tch')).toHaveCount(5);
  await page.click('#tCont');
  await expect(page.locator('#confirm')).toBeVisible(); await expect(page.locator('#confirmT')).toContainText('버려진 나무자재');
  await page.click('#cfYes');
  await expect(page.locator('#menu')).toBeVisible();
  await page.click('[data-m="buyWood"]');
  expect(await page.evaluate(() => G.pd.gold)).toBe(400000);
  await expect(page.locator('[data-m="buyWood"]')).toHaveCount(0); // 하나만
  await page.click('#menu [data-m="close"]');
  await page.click('#tCont');
  await expect(page.locator('#confirmT')).toContainText('들고 출발');
  await page.click('#cfYes');
  await page.waitForFunction(() => G.state === 'cut');
  await page.click('#skip');
  await page.waitForFunction(() => G.state === 'play' && G.zone === 16);
  const s = await page.evaluate(() => ({ kid: kidNow(), bori: !!G.bori, w: defOf(G.pd.eq.weapon), boriHud: document.querySelector('#boriHud') ? document.querySelector('#boriHud').hidden : true }));
  expect(s).toEqual({ kid: true, bori: false, w: 'woodplank', boriHud: true });
  await page.evaluate(() => { G.pd.inv.starstick = 1; openMenu('equip'); });
  await page.click('[data-m="equip"][data-v="starstick"]');
  expect(await page.evaluate(() => defOf(G.pd.eq.weapon))).toBe('woodplank'); // 나무칼 받기 전엔 무기 못 바꿈
});

test('5장 STAGE 19: 아빠가 나무자재를 나무칼로 (이야기 · 착용 · 그 뒤로 무기 자유)', async ({ page }) => {
  await withSave(page, URL_MAIN, Object.assign({}, SAVE, { inv: { fist: 1, cap_grey: 1, fleece: 1, sneakers: 1, silverbag: 1, woodplank: 1, starstick: 1 }, eq: { weapon: 'woodplank', hat: 'cap_grey', armor: 'fleece', shoes: 'sneakers', bag: 'silverbag' }, ch5: { zone: 18, cleared: 0, intro: 1, seen: { 17: 1 } } }));
  await page.click('#tCont');
  await page.waitForFunction(() => G.state === 'cut');
  expect(await page.evaluate(() => [G.pd.ch5.sword, defOf(G.pd.eq.weapon), ownsDef(G.pd, 'woodplank')])).toEqual([1, 'woodsword', false]);
  await page.click('#skip');
  await page.waitForFunction(() => G.state === 'play' && G.zone === 18);
  await page.evaluate(() => openMenu('equip'));
  await page.click('[data-m="equip"][data-v="starstick"]');
  expect(await page.evaluate(() => defOf(G.pd.eq.weapon))).toBe('starstick');
});
