// 영어판: 브라우저 언어가 영어면 영어로, 로비 버튼으로 한국어 ↔ 영어
import { test, expect, URL_MAIN, withSave, enterZone, openTab, tap } from './fixtures.mjs';

const HANGUL = /[가-힣]/;
/** 화면에 보이는 글자 중 한글 (언어 버튼·닉네임 등 사람이 넣은 글자는 빼고) */
const visibleHangul = page => page.evaluate(re => {
  const out = []; const R = new RegExp(re);
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement; if (!el || el.closest('#tLang, [hidden], script, style')) continue;
    if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
    if (R.test(n.textContent)) out.push(n.textContent.trim().slice(0, 40));
  }
  return out;
}, HANGUL.source);

test.describe('영어판', () => {
  test.use({ locale: 'en-US' });

  test('브라우저가 영어면 로비·메뉴가 영어 (한글 없음)', async ({ page }) => {
    await withSave(page, URL_MAIN, { lv: 30, gold: 1e6, stones: 50, boriJoined: true, zone: 1 });
    expect(await page.evaluate(() => LANG)).toBe('en');
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');
    await expect(page.locator('#tCont')).toContainText('Continue Adventure');
    expect(await visibleHangul(page)).toEqual([]);
    await enterZone(page, 1);
    for (const tab of ['skill', 'equip', 'bori', 'shop', 'info']) { await openTab(page, tab); expect(await visibleHangul(page), tab).toEqual([]); }
  });

  test('언어 버튼: 영어 → 한국어 → 영어 (새로고침)', async ({ page }) => {
    await withSave(page, URL_MAIN, { lv: 10, zone: 1 });
    await expect(page.locator('#tLang')).toContainText('한국어');
    await Promise.all([page.waitForEvent('load'), tap(page, '#tLang')]);
    await expect(page.locator('#tCont')).toContainText('모험 계속하기');
    expect(await page.evaluate(() => localStorage.getItem('hb_lang'))).toBe('ko');
    await expect(page.locator('#tLang')).toContainText('English');
    await Promise.all([page.waitForEvent('load'), tap(page, '#tLang')]);
    await expect(page.locator('#tCont')).toContainText('Continue Adventure');
  });
});
