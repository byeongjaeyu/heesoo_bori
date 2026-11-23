import { test, expect, URL_MAIN, MOCK_SB, withSave } from './fixtures.mjs';

test('경매장: 둘러보기 입찰·즉시 구매, 판매하기로 올리기, 내 경매', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 40, gold: 1000000, inv: { fist: 1, cap_grey: 1, fleece: 1, sneakers: 1, silverbag: 1, cap_tiara: 1, 'cap_tiara#ab12': 1, umbrella: 1 }, enh: { 'cap_tiara#ab12': 7 },
    eq: { weapon: 'fist', hat: 'cap_tiara', armor: 'fleece', shoes: 'sneakers', bag: 'silverbag' } });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => {
    PV.me = { nickname: '나' };
    const end = new Date(Date.now() + 5 * 3600e3).toISOString();
    window.__auc = [
      { id: 'x1', def: 'starstick', rar: 5, slot: 'weapon', enh: 15, ilv: 2, ref: { lines: [{ k: 'atkP', v: 12, g: 2 }] }, start: 100000, buyout: 500000, bid: null, bids: 0, min: 100000, ends: end, seller: '원조희수' },
      { id: 'x2', def: 'wingshoes', rar: 5, slot: 'shoes', enh: 3, ilv: 0, ref: null, start: 50000, buyout: 80000, bid: 60000, bids: 2, min: 63000, ends: end, seller: '안녀엉' }];
  });
  await page.click('#tAuc');
  await expect(page.locator('#auc')).toBeVisible();
  // 모달 여백: 헤더 아래 첫 줄(탭)과 본문 좌우가 테두리에 붙지 않게
  const gap = await page.evaluate(() => { const h = document.querySelector('#auc .mhead').getBoundingClientRect(), t = document.querySelector('#auc .auctabs .btn').getBoundingClientRect(), p = document.querySelector('#auc .panel').getBoundingClientRect(); return [t.top - h.bottom, t.left - p.left]; });
  expect(gap[0]).toBeGreaterThanOrEqual(8); expect(gap[1]).toBeGreaterThanOrEqual(10);
  const c1 = page.locator('#aucBody .aucc', { hasText: '단단한 맥북프로 +15' });
  await expect(c1).toContainText('원조희수'); await expect(c1).toContainText('공격'); await expect(c1).toContainText('시작가 100,000G');
  // 입찰: 최소액보다 낮으면 서버가 거절, 맞으면 골드 빠짐
  await c1.locator('[data-auc="bid"]').click();
  await page.locator('#aucAmt').fill(''); await page.locator('#aucAmt').pressSequentially('120000');
  await expect(page.locator('#aucAmt')).toHaveValue('120,000'); // 치는 동안 쉼표
  await page.click('[data-auc="bidGo"]');
  await expect(page.locator('#toasts')).toContainText('120,000G에 입찰했어요');
  expect(await page.evaluate(() => loadGame().gold)).toBe(880000);
  await expect(page.locator('#aucBody .aucc', { hasText: '단단한 맥북프로 +15' })).toContainText('최고 입찰 중');
  // 즉시 구매 → 장비 받음
  await page.locator('#aucBody .aucc', { hasText: '남편의 갯바위' }).or(page.locator('#aucBody .aucc').nth(1)).locator('[data-auc="buy"]').click();
  await page.click('#cfYes');
  await expect(page.locator('#toasts')).toContainText('즉시 구매 완료');
  await expect.poll(() => page.evaluate(() => [loadGame().gold, !!loadGame().inv['wingshoes#tauc01']])).toEqual([800000, true]);
  // 판매하기: 착용 중인 티아라는 목록에 없고, 예비 티아라(+7)만
  await page.click('[data-auc-tab="sell"]');
  const sel = page.locator('#aucBody .aucc');
  await expect(sel.filter({ hasText: '티아라' })).toHaveCount(1); await expect(sel.filter({ hasText: '+7' })).toHaveCount(1);
  await expect(sel.filter({ hasText: '우산' })).toHaveCount(0); // 전설 미만은 못 올림
  await sel.filter({ hasText: '+7' }).locator('[data-auc="sel"]').click();
  await page.fill('#aucStart', '30,000'); await page.fill('#aucBuy', '90000'); await page.click('[data-auc="hours"][data-v="48"]');
  await page.click('[data-auc="sellGo"]'); await page.click('#cfYes');
  await expect(page.locator('#toasts')).toContainText('경매에 올렸어요 (48시간)');
  expect(await page.evaluate(() => [!!loadGame().inv['cap_tiara#ab12'], loadGame().tkeys, __aucCalls.find(c => c[0] === 'hb_auc_list')[1]]))
    .toEqual([false, ['cap_tiara#ab12'], { p_key: 'cap_tiara#ab12', p_start: 30000, p_buyout: 90000, p_hours: 48 }]);
  await expect(page.locator('#aucBody')).toContainText('판매 중 1/10');
  await page.locator('#aucBody [data-auc="cancel"]').click();
  await expect(page.locator('#toasts')).toContainText('경매에서 내렸어요');
});

test('경매장: 닉네임 없으면 못 들어감', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 10 });
  await page.evaluate(MOCK_SB);
  await page.click('#tAuc');
  await expect(page.locator('#toasts')).toContainText('랭킹에 닉네임을 등록한 희수만');
  await expect(page.locator('#auc')).toBeHidden();
});

test('화면 숫자는 쉼표 (로비 골드·메뉴·토스트), 옮기기 코드는 그대로', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 40, gold: 12345678, stones: 23456 });
  await page.evaluate(() => toast('강화석 12345개 받음', 'lvl'));
  await expect(page.locator('#toasts')).toContainText('강화석 12,345개 받음');
  await page.click('#tBag'); await page.evaluate(() => { MTAB = 'equip'; renderMenu(true); });
  await expect(page.locator('#menu')).toContainText('12,345,678');
  await expect(page.locator('#menu')).toContainText('23,456');
  await page.evaluate(() => { const el = document.querySelector('#cloudCodeV'); el.textContent = 'ABCD 2345'; });
  await expect(page.locator('#cloudCodeV')).toHaveText('ABCD 2345');
});

test('1:1 교환: 받은 제안 수락, 새 제안 보내기, 자격 안내', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await withSave(page, URL_MAIN, { lv: 40, gold: 300000, inv: { fist: 1, cap_grey: 1, fleece: 1, sneakers: 1, silverbag: 1, cap_tiara: 1, 'cap_tiara#ab12': 1, wingshoes: 1 }, enh: { 'cap_tiara#ab12': 7 },
    eq: { weapon: 'fist', hat: 'cap_tiara', armor: 'fleece', shoes: 'sneakers', bag: 'silverbag' } });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => {
    PV.me = { nickname: '나' };
    const exp = new Date(Date.now() + 5 * 3600e3).toISOString();
    window.__xc = { why: null, list: [
      { id: 'in1', dir: 'in', state: 'open', who: '원조희수', msg: '신발 주세요', give: [{ def: 'starstick', rar: 5, enh: 12, ilv: 0, ref: null }], gold: 20000, want: [{ id: 'w1', key: 'wingshoes', def: 'wingshoes', rar: 5, enh: 0 }], want_gold: 50000, expires: exp }],
      partner: { nick: '안녀엉', lv: 45, items: [{ id: 'p1', def: 'starstick', rar: 5, enh: 3, ilv: 0, ref: null }] } };
  });
  await page.click('#tAuc');
  await page.click('[data-auc-tab="xchg"]');
  const card = page.locator('#aucBody .xccard', { hasText: '원조희수' });
  await expect(card).toContainText('단단한 맥북프로 +12'); await expect(card).toContainText('20,000G'); await expect(card).toContainText('50,000G');
  await expect(card).toContainText('받는 쪽 19,000G');
  // 여백: 본문 좌우가 테두리에 붙지 않게
  const pad = await page.evaluate(() => { const c = document.querySelector('#aucBody .xccard').getBoundingClientRect(), p = document.querySelector('#auc .panel').getBoundingClientRect(); return [c.left - p.left, p.right - c.right]; });
  expect(pad[0]).toBeGreaterThanOrEqual(10); expect(pad[1]).toBeGreaterThanOrEqual(10);
  await page.screenshot({ path: 'test-results/xchg-390.png', fullPage: false });
  // 수락: 내 날개 신발·골드 50,000 빠지고, 맥북·골드 19,000(선물) 받음
  await card.locator('[data-auc="xcAccept"]').click(); await page.click('#cfYes');
  await expect(page.locator('#toasts')).toContainText('교환 완료');
  await expect.poll(() => page.evaluate(() => { const s = loadGame(); return [!!s.inv.wingshoes, !!s.inv['starstick#txc001'], s.gold]; })).toEqual([false, true, 269000]);
  // 새 제안: 상대 찾기 → 상대 장비 고르고, 내 예비 티아라 + 골드
  await page.fill('#xcNick', '안녀엉'); await page.click('[data-auc="xcFind"]');
  await page.click('[data-auc="xcWant"][data-v="p1"]');
  await expect(page.locator('[data-auc="xcGive"][data-v="cap_tiara"]')).toHaveCount(0); // 착용 중인 티아라는 안 보임
  await expect(page.locator('[data-auc="xcGive"][data-v="starstick#txc001"]')).toHaveCount(1); // 방금 받은 장비는 다시 줄 수 있음
  await page.click('[data-auc="xcGive"][data-v="cap_tiara#ab12"]');
  await page.locator('#xcGold').pressSequentially('10000'); await expect(page.locator('#xcGold')).toHaveValue('10,000');
  await page.locator('#aucBody .xcnew').scrollIntoViewIfNeeded(); await page.screenshot({ path: 'test-results/xchg-new-390.png' });
  await page.click('[data-auc="xcSend"]'); await page.click('#cfYes');
  await expect(page.locator('#toasts')).toContainText('안녀엉님에게 교환을 제안했어요');
  expect(await page.evaluate(() => { const s = loadGame(); return [!!s.inv['cap_tiara#ab12'], s.gold, __xcCalls.find(c => c[0] === 'hb_xchg_propose')[1]]; }))
    .toEqual([false, 259000, { p_nick: '안녀엉', p_give: ['cap_tiara#ab12'], p_gold: 10000, p_want: ['p1'], p_want_gold: 0, p_msg: null }]);
  await expect(page.locator('#aucBody')).toContainText('보낸 제안 1/10');
  await page.locator('#aucBody [data-auc="xcCancel"]').click();
  await expect(page.locator('#toasts')).toContainText('제안을 취소했어요');
  // 자격 안내 (계정 연결 안 함)
  await page.evaluate(() => { __xc.why = 'link'; }); await page.click('[data-auc-tab="mine"]'); await page.click('[data-auc-tab="xchg"]');
  await expect(page.locator('#aucBody .xcwarn')).toContainText('구글·카카오 계정을 연결한');
  await expect(page.locator('[data-auc="xcLink"]')).toBeVisible();
});
