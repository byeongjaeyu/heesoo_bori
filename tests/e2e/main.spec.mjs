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

test('출석: 그날 처음 들어오면 창이 뜨고, 출석하면 보상 + 같은 날엔 다시 안 뜸', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 20, gold: 100, att: { last: 'never', n: 0 } });
  await expect(page.locator('#daily')).toBeVisible();
  await page.click('[data-d=att]');
  await expect(page.locator('[data-d=att]')).toHaveText('오늘 출석 완료 ✔');
  expect(await page.evaluate(() => loadGame().gold)).toBeGreaterThan(100);
  await page.click('#dailyX');
  await page.reload(); await page.waitForTimeout(1300);
  await expect(page.locator('#daily')).toBeHidden();
});

test('미션: 게임 중 진행 → 메뉴 미션 탭에서 받기', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 20, stones: 0 });
  await enterZone(page, 1);
  await page.evaluate(() => { for (let i = 0; i < 150; i++) dailyAdd('kill'); });
  await openTab(page, 'daily');
  await expect(page.locator('.tab.on em')).toBeVisible();
  await page.click('[data-d=claim][data-v=kill]');
  expect(await page.evaluate(() => G.pd.stones)).toBe(5);
  await expect(page.locator('[data-d=claim][data-v=kill]')).toHaveText('받음');
});

test('PvP 시즌: 랭킹 PvP 탭에 남은 시간·지난 시즌 TOP·내 기록', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 30 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rows.push({ user_id: 'u-me', nickname: '나', snap: { lv: 30, eq: newPD().eq }, power: 900, rating: 1010, wins: 1, losses: 0 }); });
  await page.click('#tRank');
  await page.click('#rankTabs [data-rt=pvp]');
  const bar = page.locator('#rankList .season');
  await expect(bar).toContainText('월요일 0시까지 2일 5시간');
  await expect(bar).toContainText('원조희수');
  await expect(bar).toContainText('내 지난 시즌:  2위');
  await expect(bar.locator('img.pxi')).toHaveCount(4); // 트로피 + 메달 3개 (픽셀)
  await page.click('#rankList .season button');
  await expect(page.locator('#seasonModal')).toBeVisible();
  await expect(page.locator('#seasonModal .srw')).toHaveCount(5);
  await expect(page.locator('#seasonModal .srw').first()).toContainText('150개');
  await expect(page.locator('#seasonModal .srw').first()).toContainText('300만G');
  await expect(page.locator('#seasonModal .srw').first()).toContainText('3시간');
  await page.click('#seasonModal .btn');
  await expect(page.locator('#seasonModal')).toBeHidden();
});

test('시즌 보상 선물: 받으면 보상 모달(아이콘 카드)', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 30, stones: 0, gold: 0 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rows.push({ user_id: 'u-me', nickname: '나', snap: {}, power: 1 }); PV.notReg = false; PV.me = null;
    __grants = [{ kind: 'stones', amount: 150, note: '지난 주 PvP 시즌 1위 보상' }, { kind: 'gold', amount: 3000000, note: '지난 주 PvP 시즌 1위 보상' }]; });
  await page.evaluate(() => rankSync(true));
  const d = await page.evaluate(() => JSON.parse(localStorage.getItem(SAVEKEY)));
  expect([d.stones, d.gold]).toEqual([150, 3000000]);
  await expect(page.locator('#seasonModal')).toBeVisible();
  await expect(page.locator('#seasonModal h2')).toContainText('1위');
  await expect(page.locator('#seasonModal .rwc')).toHaveCount(2);
  await expect(page.locator('#seasonModal .rwc').first()).toContainText('150개');
});

test('첫 걸음 가이드: 새 게임에서 카드 + 공격 버튼 반짝, 5마리 잡으면 다음 단계', async ({ page }) => {
  await withSave(page, URL_MAIN, { guide: 0, lv: 1 });
  await enterZone(page, 0);
  await expect(page.locator('#guide')).toContainText('첫 걸음 1/7');
  await expect(page.locator('#ctrl .atk.gpulse')).toBeVisible();
  const gold0 = await page.evaluate(() => G.pd.gold);
  await page.evaluate(() => { for (let i = 0; i < 5; i++) { const e = spawnEnemy('slime', G.P.x + 20, G.P.y); dealDamage(e, 1e6, {}); } });
  await expect(page.locator('#guide')).toContainText('첫 걸음 2/7');
  await expect(page.locator('#menuBtn.gpulse')).toBeVisible();
  expect(await page.evaluate(() => G.pd.gold)).toBeGreaterThanOrEqual(gold0 + 300);
});

test('도감 탭: 보유 장비는 보이고 없는 건 ???', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 20, inv: { fist: 1, cap_grey: 1, fleece: 1, sneakers: 1, silverbag: 1, churros: 1 } });
  await enterZone(page, 1);
  await openTab(page, 'book');
  await expect(page.locator('.bookhead')).toContainText('1 / 44');
  await expect(page.locator('.bcell:not(.no)')).toHaveCount(1);
  await expect(page.locator('.bcell:not(.no)')).toContainText('츄러스');
});

test('꾸미기 탭: 헤어·모자 겉모습 바꾸면 저장되고 능력치는 그대로', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 30, inv: { fist: 1, cap_grey: 1, fleece: 1, sneakers: 1, silverbag: 1, cap_sky: 1 } });
  await enterZone(page, 1);
  const atk0 = await page.evaluate(() => G.st.atk);
  await openTab(page, 'look');
  await expect(page.locator('button[data-m=hair][data-v=silver]')).toBeDisabled();
  await page.click('button[data-m=hair][data-v=choco]');
  await page.click('button[data-m=look][data-v="hat:cap_sky"]');
  expect(await page.evaluate(() => [loadGame().look.hair, loadGame().look.hat, visEq(G.pd).hat, G.st.atk])).toEqual(['choco', 'cap_sky', 'cap_sky', atk0]);
});

test('내 카드 공유: 카드 이미지 생성 + 초대 링크', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 30, look: { hair: 'pink' } });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rows.push({ user_id: 'u-me', nickname: '공유희수', snap: {}, power: 900, rating: 1010, wins: 1, losses: 0 }, { user_id: 'x', nickname: '1등', snap: {}, power: 99999, rating: 1000, wins: 0, losses: 0 }); });
  await page.click('#tRank');
  await page.click('#rankShare');
  await expect(page.locator('#shareImg')).toHaveAttribute('src', /^data:image\/png/, { timeout: 15000 });
  const size = await page.evaluate(() => { const i = document.querySelector('#shareImg'); return [i.naturalWidth, i.naturalHeight]; });
  expect(size).toEqual([1080, 1350]);
  expect(await page.evaluate(() => SHARE.url)).toContain('?from=' + encodeURIComponent('공유희수'));
});

test('초대 링크로 들어오면 알림 + 랭킹 열림', async ({ page }) => {
  await page.goto(URL_MAIN + '?from=' + encodeURIComponent('원조희수'));
  await expect(page.locator('#toasts')).toContainText('원조희수님이 초대했어요');
  await expect(page.locator('#rank')).toBeVisible();
});

test('처음 온 사람(세이브 없음)은 닉네임 창 없이 바로 시작, 가이드 끝낸 사람은 물어봄', async ({ page }) => {
  await page.goto(URL_MAIN);
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { entryRegDone = false; return entryRegister(); });
  await expect(page.locator('#pvpNick')).toBeHidden();
  await withSave(page, URL_MAIN, { lv: 3, guide: 2 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { entryRegDone = false; return entryRegister(); });
  await expect(page.locator('#pvpNick')).toBeHidden();
  await withSave(page, URL_MAIN, { lv: 3 }); // withSave 기본 guide: 99 (끝냄)
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { entryRegDone = false; return entryRegister(); });
  await expect(page.locator('#pvpNick')).toBeVisible();
});

test('랭킹: 플레이 안 한 Lv1 은 안 보임', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 20 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rows.push({ user_id: 'u-me', nickname: '나', snap: { lv: 20, eq: newPD().eq }, power: 800, rating: 1000, wins: 0, losses: 0 },
    { user_id: 'z', nickname: '구경만함', snap: { lv: 1, eq: newPD().eq }, power: 100, rating: 1000, wins: 0, losses: 0 }); PV.notReg = false; });
  await page.click('#tRank');
  await expect(page.locator('#rankList')).toContainText('나');
  await expect(page.locator('#rankList')).not.toContainText('구경만함');
});

test('월드 보스: 로비 → 도전 → 60초 전투 피해 집계 → 서버 보고 → 남은 도전 감소', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 30 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rows.push({ user_id: 'u-me', nickname: '나', snap: { lv: 30 }, power: 1500, rating: 1000, wins: 0, losses: 0 }); });
  await page.click('#tRaid');
  await expect(page.locator('.rdboss')).toContainText('폭주 회전컵');
  await expect(page.locator('[data-rd=go]')).toContainText('3/3');
  await page.click('[data-rd=go]');
  await page.waitForFunction(() => G.state === 'play' && G.raid);
  const hp0 = await page.evaluate(() => G.boss.hp);
  await page.evaluate(() => { for (let i = 0; i < 10; i++) dealDamage(G.boss, 5000, {}); });
  expect(await page.evaluate(h0 => [!!G.boss.dead, G.boss.hp < h0, G.raid.dmg > 0], hp0)).toEqual([false, true, true]);
  await page.evaluate(() => { G.raid.t = 0.05; });
  await expect(page.locator('#raidRes')).toBeVisible();
  await expect(page.locator('#raidResS')).toContainText('내 누적');
  const sent = await page.evaluate(() => [Math.round(G.raid.dmg), __raid.my.damage]);
  expect(sent[1]).toBe(sent[0]);
  await page.click('[data-rr=lobby]');
  await expect(page.locator('[data-rd=go]')).toContainText('2/3');
});

test('월드 보스: 미등록이면 도전 대신 등록 안내', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 30 });
  await page.evaluate(MOCK_SB);
  await page.click('#tRaid');
  await expect(page.locator('[data-rd=go]')).toBeDisabled();
  await expect(page.locator('[data-rd=join]')).toBeVisible();
});

test('월드 보스 보상 선물: 모달로 표시', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 30, stones: 0, gold: 0 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rows.push({ user_id: 'u-me', nickname: '나', snap: {}, power: 1 }); PV.notReg = false; PV.me = null;
    __grants = [{ kind: 'stones', amount: 140, note: '지난 주 월드 보스 처치 보상 / 지난 주 월드 보스 피해량 1위 보상' }, { kind: 'gold', amount: 2000000, note: '지난 주 월드 보스 처치 보상 / 지난 주 월드 보스 피해량 1위 보상' }]; });
  await page.evaluate(() => rankSync(true));
  await expect(page.locator('#seasonModal h2')).toContainText('1위');
  expect(await page.evaluate(() => [loadGame().stones, loadGame().gold])).toEqual([140, 2000000]);
});

test('친구 희수 데려가기: 고르면 동료가 생기고 하루 한 번만', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 20 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => {
    __rows.push({ user_id: 'u-me', nickname: '나', snap: { lv: 20 }, power: 900, rating: 1000, wins: 0, losses: 0 },
      { user_id: 'f1', nickname: '원조희수', snap: { lv: 50, atk: 300, hp: 900, def: 30, eq: newPD().eq, w: { mul: 1, rate: 2, reach: 25, arc: 150 } }, power: 7000, rating: 1000, wins: 1, losses: 0 });
    __rpc.hb_borrow_friend = ({ p_friend }) => { const f = __rows.find(r => r.user_id === p_friend); return { ok: true, nickname: f.nickname, snap: f.snap, power: f.power }; };
  });
  await enterZone(page, 1);
  await page.click('#bBuddy');
  await expect(page.locator('.bdrow')).toHaveCount(1); // 나는 목록에서 빠짐
  await page.click('[data-bd="0"]');
  await expect(page.locator('#buddy')).toBeHidden();
  expect(await page.evaluate(() => [!!G.buddy, G.state, loadGame().buddy.nick, loadGame().buddy.day === todayKey()])).toEqual([true, 'play', '원조희수', true]);
  // 동료 공격이 실제로 들어감
  await page.evaluate(() => { const e = spawnEnemy('horse', G.buddy.x + 10, G.buddy.y); e.spawnT = 0; e.hp = e.maxHp = 1e6; window.__e = e; G.buddy.spawnT = 0; G.buddy.atkCd = 0; });
  await page.waitForFunction(() => __e.hp < 1e6, null, { timeout: 5000 });
  await page.click('#bBuddy');
  await expect(page.locator('.bdnow')).toContainText('함께하는 중');
});

test('내 희수를 친구가 데려가면 강화석 알림', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 30, stones: 0 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rows.push({ user_id: 'u-me', nickname: '나', snap: {}, power: 1 }); PV.notReg = false; PV.me = null;
    __grants = [{ kind: 'stones', amount: 3, note: '보리언니님이 내 희수를 데려갔어요' }]; });
  await page.evaluate(() => rankSync(true));
  await expect(page.locator('#toasts')).toContainText('🤝 보리언니님이 내 희수를 데려갔어요! 강화석 3개');
  expect(await page.evaluate(() => loadGame().stones)).toBe(3);
});

test('업적 달성 → 칭호 장착 → 랭킹 snap에 칭호', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 20, stats: { kills: 150, ults: 0, deaths: 0, time: 0, eaten: 0 } });
  await enterZone(page, 1);
  await expect(page.locator('#toasts')).toContainText('칭호 「새내기 사냥꾼」', { timeout: 4000 });
  await page.evaluate(() => openMenu('achv'));
  await page.click('[data-m="ttl"][data-v="k100"]');
  await expect(page.locator('.achnow')).toContainText('새내기 사냥꾼');
  expect(await page.evaluate(() => [loadGame().title, pvpSnap().snap.ttl])).toEqual(['k100', 'k100']);
});

test('메뉴 정보 탭 「타이틀로」 버튼', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 10 });
  await enterZone(page, 1);
  await page.evaluate(() => openMenu('info'));
  await page.click('#menu [data-m="title"]');
  await expect(page.locator('#title')).toBeVisible();
  await expect(page.locator('#tCont')).toBeVisible();
});

test('로비에서 장비·스킬 메뉴 열기 (음식 탭 없음), 닫으면 로비로', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 20, gold: 100000, stones: 10 });
  await page.click('#tBag');
  await expect(page.locator('#menu')).toBeVisible();
  await expect(page.locator('#tabs [data-v="food"]')).toHaveCount(0);
  await page.click('#tabs [data-v="equip"]');
  await page.locator('#mbody [data-m="enhance"]').first().click();
  expect(await page.evaluate(() => loadGame().gold)).toBeLessThan(100000);
  await page.click('#menu [data-m="close"]');
  await expect(page.locator('#title')).toBeVisible();
  expect(await page.evaluate(() => G.state)).toBe('title');
  await page.click('.tprof');
  await expect(page.locator('#menu')).toBeVisible();
  await page.click('#menu [data-m="title"]');
  await expect(page.locator('#tCont')).toBeVisible();
});

test('자동사냥: 출구가 열리면 출구로 가서 다음 스테이지도 자동사냥', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 50, cleared: 2, zone: 3 });
  await enterZone(page, 2);
  await page.evaluate(() => { G.st.atk = 1e6; autoToggle(); onBossDefeated({}); });
  await page.waitForFunction(() => G.zone === 3 && G.state === 'play', null, { timeout: 30000 });
  expect(await page.evaluate(() => G.auto)).toBe(true);
  // 마지막 스테이지: 엔딩 없이 다음 회차 STAGE 1
  await page.evaluate(() => onBossDefeated({}));
  await page.waitForFunction(() => G.zone === 0 && G.state === 'play', null, { timeout: 30000 });
  expect(await page.evaluate(() => [G.pd.cleared, G.auto])).toEqual([3, true]);
});
