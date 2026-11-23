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

test('선물함: 목표 레벨·초월 장비 전 부위(자동 착용)', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 16, sp: 0, boriJoined: true });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rows.push({ user_id: 'u-me', nickname: '나', snap: {}, power: 1 }); PV.notReg = false; PV.me = null;
    __grants = [{ kind: 'level', amount: 50 }, { kind: 'items', amount: 5 }]; });
  await page.evaluate(() => rankSync(true));
  const d = await page.evaluate(() => JSON.parse(localStorage.getItem(SAVEKEY)));
  expect([d.lv, d.sp, d.xp]).toEqual([50, 34, 0]);
  expect(d.eq).toEqual({ weapon: 'starstick', hat: 'cap_tiara', armor: 'aurorapad', shoes: 'wingshoes', bag: 'aurorabag' });
  expect(d.beq).toEqual({ bcloth: 'b_royal', btoy: 'toy_carp' }); expect(d.inv.starstick).toBe(1);
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
  await expect(page.locator('.bookhead')).toContainText('1 / 58');
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

test.setTimeout(150000);
test('자동사냥: 출구가 열리면 출구로 가서 다음 스테이지도 자동사냥', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 50, cleared: 2, zone: 3 });
  await enterZone(page, 2);
  await page.evaluate(() => { G.st.atk = 1e6; autoToggle(); onBossDefeated({}); });
  await page.waitForFunction(() => G.zone === 3 && G.state === 'play', null, { timeout: 30000 });
  expect(await page.evaluate(() => G.auto)).toBe(true); // 마지막 스테이지 → 다음 회차는 아래 엔딩 테스트에서
});

test('방치 보상: 로비에서 받기 → 골드·강화석 증가, 다시 0부터', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 20, gold: 0, stones: 0, idleT: Date.now() - 3 * 3600e3 });
  await expect(page.locator('#tIdle')).toContainText('3시간');
  await page.click('#tIdle');
  await expect(page.locator('#seasonModal')).toContainText('방치 보상');
  const pd = await page.evaluate(() => loadGame());
  expect(pd.gold).toBeGreaterThan(0); expect(pd.stones).toBeGreaterThan(0);
  await page.click('#seasonModal .btn');
  await expect(page.locator('#tIdle')).toContainText('모으는 중');
});

test('뉴비 패키지: 로비에서 무료로 받기 → 자동사냥·강화석·칭호, 타일 사라짐', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 5, stones: 0 });
  await expect(page.locator('#tPack')).toContainText('24:00');
  await page.click('#tPack'); await page.click('#packGo');
  await expect(page.locator('#packBody')).toContainText('받았어요');
  const pd = await page.evaluate(() => loadGame());
  expect([pd.stones, pd.autoBonus >= 3 * 3600, pd.title, !!pd.pack.got]).toEqual([300, true, 'beta', true]);
  await page.click('#packX');
  await expect(page.locator('#tPack')).toHaveCount(0);
});

test('2장: Lv30 전엔 잠김 → 열리면 프롤로그 후 STAGE 5', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 20, cleared: 1 });
  await page.click('.tch[data-ch="2"]');
  await expect(page.locator('#toasts')).toContainText('Lv30');
  await page.evaluate(() => { const pd = loadGame(); pd.lv = 30; localStorage.setItem(SAVEKEY, JSON.stringify(pd)); showTitle(); });
  await page.click('.tch[data-ch="2"]');
  await expect(page.locator('#tCont')).toContainText('유료낚시터 주차장');
  await page.click('#tCont');
  await page.waitForFunction(() => G.state === 'cut');
  await page.evaluate(() => endCut());
  await page.waitForFunction(() => G.state === 'play' && G.zone === 4, null, { timeout: 8000 });
  expect(await page.evaluate(() => [loadGame().chap, loadGame().ch2.zone, loadGame().zone])).toEqual([2, 4, 0]);
});

test('2장 마지막 보스 → 엔딩 → 2장 클리어 기록·칭호', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 50, cleared: 3, chap: 2, ch2: { zone: 7, cleared: 0, intro: 1, seen: { 5: 1, 6: 1 } } });
  await page.click('#tCont');
  await page.waitForFunction(() => G.state === 'play' && G.zone === 7, null, { timeout: 8000 });
  await page.evaluate(() => { onBossDefeated({}); G.P.x = G.world.gate.x; G.P.y = G.world.gate.y + 4; });
  await page.waitForFunction(() => G.state === 'cut', null, { timeout: 10000 });
  await page.evaluate(() => endCut());
  await expect(page.locator('#endScr')).toContainText('2장');
  expect(await page.evaluate(() => loadGame().ch2.cleared)).toBe(1);
  await page.click('#eTitle');
  await expect(page.locator('#tCont')).toContainText('2회차');
});

test('2장 이야기: 자동사냥 중에도 처음 들어가는 스테이지에선 나오고, 대사가 저절로 넘어감', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 40, cleared: 3, chap: 2, ch2: { zone: 4, cleared: 0, intro: 1 } });
  await page.click('#tCont');
  await page.waitForFunction(() => G.state === 'play' && G.zone === 4, null, { timeout: 8000 });
  await page.evaluate(() => { G.auto = true; startZone(5); });
  await page.waitForFunction(() => G.state === 'cut');
  await page.waitForFunction(() => G.state === 'play' && G.zone === 5, null, { timeout: 30000 }); // 탭 없이 끝까지
  expect(await page.evaluate(() => [G.auto, loadGame().ch2.seen[5]])).toEqual([true, 1]);
});

test('자동사냥 중 1장 회차 클리어: 엔딩 컷신이 저절로 넘어가고 다음 회차 STAGE 1로', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 50, cleared: 2, zone: 3 });
  await enterZone(page, 3);
  await page.evaluate(() => { G.auto = true; G.st.atk = 1e6; onBossDefeated({}); });
  await page.waitForFunction(() => G.state === 'cut', null, { timeout: 30000 });
  await page.waitForFunction(() => G.state === 'play' && G.zone === 0, null, { timeout: 90000 });
  expect(await page.evaluate(() => [G.pd.cleared, G.auto])).toEqual([3, true]);
});

test('재련·교환소: 장비 탭에서 재련, 배달앱에서 강화석 교환', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 50, gold: 10000000, stones: 0, inv: { starstick: 1 }, eq: { weapon: 'starstick' } });
  await enterZone(page, 0);
  await page.evaluate(() => openMenu('equip'));
  await page.click('[data-m="refine"]');
  await expect(page.locator('.refc .refl:not(.none)')).toHaveCount(3);
  await page.evaluate(() => { G.pd.ach = Object.fromEntries(ACH.map(a => [a.id, 1])); saveGame(); }); // 업적 보상이 끼어들지 않게
  await page.click('#tabs [data-v="shop"]');
  const s0 = await page.evaluate(() => loadGame().stones);
  await page.click('[data-m="xch"][data-v="10"]');
  expect(await page.evaluate(() => [loadGame().stones, loadGame().gold])).toEqual([s0 + 10, 10000000 - 1500000 - 30000]);
  // 「살 수 있는 만큼」은 확인 창 → 아니요면 그대로, 예면 290개
  await page.click('[data-m="xch"][data-v="max"]');
  await expect(page.locator('#confirm')).toBeVisible(); await expect(page.locator('#confirmT')).toContainText('290개');
  await page.click('#cfNo'); expect(await page.evaluate(() => loadGame().stones)).toBe(s0 + 10);
  await page.click('[data-m="xch"][data-v="max"]'); await page.click('#cfYes');
  expect(await page.evaluate(() => loadGame().stones)).toBe(s0 + 300);
});

test('3장 응원석: 난간 너머 그라운드로는 못 가고, 출구는 관중석 쪽', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 50, cleared: 5, chap: 3, ch2: { zone: 7, cleared: 1, intro: 1 }, ch3: { zone: 10, cleared: 0, intro: 1, seen: { 9: 1, 10: 1, 11: 1 } } });
  await enterZone(page, 10);
  const top = await page.evaluate(() => G.world.top);
  expect(top).toBeGreaterThan(200);
  expect(await page.evaluate(() => G.world.gate.y)).toBeGreaterThan(top);
  await page.evaluate(() => { G.P.x = 200; G.P.y = 60; });
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => G.P.y)).toBeGreaterThanOrEqual(top);
});

test('3장: 2장 클리어 전엔 버튼 없음 → 클리어+Lv50이면 프롤로그 후 STAGE 9', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 50, cleared: 5 });
  await expect(page.locator('.tch[data-ch="3"]')).toHaveCount(0);
  await page.evaluate(() => { const pd = loadGame(); pd.ch2 = { zone: 4, cleared: 1, intro: 1 }; localStorage.setItem(SAVEKEY, JSON.stringify(pd)); showTitle(); });
  await page.click('.tch[data-ch="3"]');
  await expect(page.locator('#tCont')).toContainText('사직 야구장 매표소');
  await page.click('#tCont');
  await page.waitForFunction(() => G.state === 'cut');
  await page.evaluate(() => endCut());
  await page.waitForFunction(() => G.state === 'play' && G.zone === 8, null, { timeout: 8000 });
  expect(await page.evaluate(() => [loadGame().chap, loadGame().ch3.zone, loadGame().ch2.zone])).toEqual([3, 8, 4]);
});

test('3장 마지막 보스 → 엔딩 → 3장 클리어 기록', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 50, cleared: 5, chap: 3, ch2: { zone: 4, cleared: 1, intro: 1 }, ch3: { zone: 11, cleared: 0, intro: 1, seen: { 9: 1, 10: 1, 11: 1 } } });
  await page.click('#tCont');
  await page.waitForFunction(() => G.state === 'play' && G.zone === 11, null, { timeout: 8000 });
  await page.evaluate(() => { onBossDefeated({}); G.P.x = G.world.gate.x; G.P.y = G.world.gate.y + 4; });
  await page.waitForFunction(() => G.state === 'cut', null, { timeout: 10000 });
  await page.evaluate(() => endCut());
  await expect(page.locator('#endScr')).toContainText('3장');
  expect(await page.evaluate(() => loadGame().ch3.cleared)).toBe(1);
});

test('회차 보상: 로비 타일 → 한 번에 받기 → 강화석·자동사냥, 다시 못 받음', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 50, cleared: 5, stones: 0, ch2: { zone: 4, cleared: 5, intro: 1 } });
  await expect(page.locator('#tGoal')).toContainText('총 10회차');
  await page.click('#tGoal');
  await expect(page.locator('#seasonModal')).toBeVisible();
  await page.click('.msall');
  const pd = await page.evaluate(() => loadGame());
  expect(Object.keys(pd.ms).map(Number).sort((a, b) => a - b)).toEqual([3, 5, 10]);
  expect(pd.stones).toBeGreaterThanOrEqual(180); expect(pd.autoBonus).toBe(3600);
  expect(await page.evaluate(() => msReady(loadGame()).length)).toBe(0);
});

test('보스 타워: 1층 도전 → 보스 처치 → 돌파 기록·보상, 2층 시간 초과면 기록 그대로', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 50, cleared: 1, stones: 0 });
  await page.click('#tTower');
  await expect(page.locator('#towerBody')).toContainText('1층');
  await page.click('[data-tw="go"]');
  await page.waitForFunction(() => G.state === 'play' && G.tower && G.tower.f === 1 && G.boss, null, { timeout: 8000 });
  expect(await page.evaluate(() => G.boss.type)).toBe('boss1');
  await page.evaluate(() => killEnemy(G.boss));
  await expect(page.locator('#towerRes')).toBeVisible();
  await expect(page.locator('#towerResT')).toContainText('1층 돌파');
  expect(await page.evaluate(() => [loadGame().tower.best, loadGame().stones])).toEqual([1, 14]);
  await page.click('[data-tr="next"]');
  await page.waitForFunction(() => G.state === 'play' && G.tower && G.tower.f === 2 && G.boss, null, { timeout: 8000 });
  await page.evaluate(() => { G.tower.t = 0.01; });
  await expect(page.locator('#towerResT')).toContainText('시간 초과');
  expect(await page.evaluate(() => loadGame().tower.best)).toBe(1);
  await page.click('[data-tr="title"]');
  await expect(page.locator('#tTower')).toContainText('최고 1층');
});

test('보스 타워는 1장을 깨야 열림', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 10, cleared: 0 });
  await page.click('#tTower');
  await expect(page.locator('#tower')).toBeHidden();
});

test('월드 보스: 이번 주 이미 처치됐으면 「처치 완료 · 피해량 경쟁」 표시, 도전 중 체력 0이 되면 처치 연출', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 30 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rows.push({ user_id: 'u-me', nickname: '나', snap: { lv: 30 }, power: 1500, rating: 1000, wins: 0, losses: 0 }); });
  // 1) 남은 체력이 적을 때 내가 쓰러뜨림
  await page.evaluate(() => { window.__raid = undefined; });
  await page.click('#tRaid'); await page.evaluate(() => { __raid.hp = 3000; });
  await page.click('[data-rd=go]');
  await page.waitForFunction(() => G.state === 'play' && G.raid);
  await page.evaluate(() => { G.boss.hp = 3000; for (let i = 0; i < 5; i++) dealDamage(G.boss, 5000, {}); });
  expect(await page.evaluate(() => [!!G.boss.dead, !!G.boss.raidDone, G.boss.hp === G.boss.maxHp])).toEqual([false, true, true]);
  await expect(page.locator('#bossBar')).toHaveClass(/done/);
  await expect(page.locator('#bossName')).toContainText('처치 완료');
  // 2) 이미 처치된 주에 들어가면 처음부터 피해량 경쟁
  await page.evaluate(() => { G.raid.t = 0.05; }); await expect(page.locator('#raidRes')).toBeVisible();
  await page.evaluate(() => { __raid.hp = 0; __raid.killed_at = new Date().toISOString(); startRaidArena(__raid); });
  expect(await page.evaluate(() => !!G.boss.raidDone)).toBe(true);
  await page.evaluate(() => dealDamage(G.boss, 9999, {}));
  expect(await page.evaluate(() => [!!G.boss.dead, G.raid.dmg > 0])).toEqual([false, true]);
});

test('성장 패키지: 1장 클리어 후 로비 타일 → 무료로 받기 → 영웅 무기 +10 착용·강화석·골드', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 12, cleared: 1, stones: 0, gold: 1000, pack: { seen: 1, got: 1 } });
  await expect(page.locator('#tPack2')).toBeVisible();
  await page.click('#tPack2');
  await expect(page.locator('#packBody')).toContainText('성장 패키지');
  await page.click('#packGo');
  const pd = await page.evaluate(() => loadGame());
  expect([pd.inv.lightstick, pd.enh.lightstick, pd.eq.weapon, pd.stones, pd.gold, !!pd.pack2.got]).toEqual([1, 10, 'lightstick', 500, 301000, true]);
  await page.click('#packX');
  await expect(page.locator('#tPack2')).toHaveCount(0);
});

test('광장: 등록된 희수만 입장 → 다른 희수 접속·이동·채팅 보임, 욕설 필터, 차단하면 안 보임, 나가면 로비', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 20, cleared: 2 });
  await page.evaluate(MOCK_SB);
  // 1) 닉네임 등록 전엔 못 들어감
  await page.click('#tPlaza');
  await page.waitForTimeout(1000); expect(await page.evaluate(() => !!G.plaza)).toBe(false);
  // 2) 등록 후 입장
  await page.evaluate(() => { __rows.push({ user_id: 'u-me', nickname: '나', snap: { lv: 20 }, power: 900, rating: 1000, wins: 0, losses: 0 }); PV.me = null; });
  await page.click('#tPlaza');
  await page.waitForFunction(() => G.plaza && G.plaza.ok && G.state === 'play', null, { timeout: 8000 });
  await expect(page.locator('#plazaUI')).toBeVisible();
  await expect(page.locator('#ctrl')).toBeHidden();
  // 다른 희수 접속
  await page.evaluate(() => { __chan.pres['u-a'] = [{ u: 'u-a', n: '친구희수', lv: 33, aw: 0, ttl: null, vis: newPD().eq, hair: null, b: true, x: 300, y: 500 }]; __chan.emit('presence', 'sync'); });
  expect(await page.evaluate(() => plazaList().map(o => o.nick))).toEqual(['친구희수']);
  await expect(page.locator('#plazaPeople')).toHaveText('접속 2');
  // 이동
  await page.evaluate(() => __chan.emit('broadcast', 'mv', { u: 'u-a', x: 320, y: 480, a: 0 }));
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => { const o = G.plaza.others['u-a']; return Math.round(o.x) === 320 && Math.round(o.y) === 480; })).toBe(true);
  // 채팅 받기 (욕설 필터)
  await page.evaluate(() => __chan.emit('broadcast', 'chat', { u: 'u-a', n: '친구희수', t: '안녕 씨 발' }));
  await expect(page.locator('#plazaLog')).toContainText('친구희수');
  await expect(page.locator('#plazaLog')).not.toContainText('씨 발');
  // 채팅 보내기
  await page.fill('#plazaIn', '반가워요!'); await page.click('#plazaSend');
  expect(await page.evaluate(() => __sent.filter(m => m.event === 'chat').map(m => m.payload.t))).toEqual(['반가워요!']);
  await expect(page.locator('#plazaLog')).toContainText('반가워요!');
  // 도배 방지: 바로 또 보내면 막힘
  await page.fill('#plazaIn', '또'); await page.click('#plazaSend');
  expect(await page.evaluate(() => __sent.filter(m => m.event === 'chat').length)).toBe(1);
  // 차단
  await page.click('#plazaPeople'); await page.click('[data-pz="blk"][data-u="u-a"]');
  expect(await page.evaluate(() => plazaList().length)).toBe(0);
  await page.click('#plazaListX');
  // 이동 중이면 위치를 보냄
  await page.evaluate(() => { G.P.x += 40; }); await page.waitForTimeout(500);
  expect(await page.evaluate(() => __sent.some(m => m.event === 'mv'))).toBe(true);
  // 나가기
  await page.click('#plazaExit');
  await expect(page.locator('#tCont')).toBeVisible();
  expect(await page.evaluate(() => [!!G.plaza, document.body.classList.contains('inPlaza')])).toEqual([false, false]);
  await page.evaluate(() => localStorage.removeItem('hb_plaza_block'));
});

test('광장 자동 분리: 1번 광장이 30명 이상이면 2번 광장으로, 이용 정지면 못 들어감', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 20, cleared: 2 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(() => { __rows.push({ user_id: 'u-me', nickname: '나', snap: { lv: 20 }, power: 900, rating: 1000, wins: 0, losses: 0 }); window.__prefill = { 'plaza-1': 30 }; });
  await page.click('#tPlaza');
  await page.waitForFunction(() => G.plaza && G.plaza.ok, null, { timeout: 8000 });
  expect(await page.evaluate(() => [G.plaza.no, __chan.name])).toEqual([2, 'plaza-2']);
  await expect(page.locator('#zoneT')).toContainText('희수 광장 2');
  await page.click('#plazaExit'); await expect(page.locator('#tCont')).toBeVisible();
  // 신고 누적으로 정지된 희수
  await page.evaluate(() => { __rpc.hb_plaza_status = () => ({ ok: false, banned: true, until: new Date(Date.now() + 3600e3).toISOString() }); });
  await page.waitForTimeout(900); await page.click('#tPlaza'); await page.waitForTimeout(800);
  expect(await page.evaluate(() => !!G.plaza)).toBe(false);
  await expect(page.locator('#toasts')).toContainText('광장을 이용할 수 없어요');
});

test('한계 돌파: +25 무기는 돌파 카드 → 성공하면 +26, 강화석 1,000 소모', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 50, gold: 1e7, stones: 1500, zone: 1, enh: { fist: 25 } });
  await enterZone(page, 1);
  await openTab(page, 'equip');
  await expect(page.locator('.card.enh.brk')).toContainText('한계 돌파');
  await page.evaluate(() => { Math.random = () => 0; });
  await page.click('button[data-m=brk][data-v=weapon]');
  expect(await page.evaluate(() => [G.pd.enh.fist, G.pd.stones])).toEqual([26, 500]);
  await expect(page.locator('.card.enh.brk')).toContainText('+26');
  await expect(page.locator('button[data-m=brk][data-v=weapon]')).toBeDisabled(); // 강화석 1,500개 필요한데 500개
});

test('장비·보리 탭 맨 위에 보유 골드·강화석', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 30, gold: 1234567, stones: 4321, boriJoined: true, zone: 1 });
  await enterZone(page, 1);
  await openTab(page, 'equip');
  await expect(page.locator('#mbody .wallet')).toContainText('1,234,567G');
  await expect(page.locator('#mbody .wallet')).toContainText('4,321개');
  await openTab(page, 'bori');
  await expect(page.locator('#mbody .wallet')).toContainText('1,234,567G');
});

test('개별 장비: 같은 맥북프로 두 개(+0·+20)를 따로 갖고 골라 착용, 중복 보관 설정', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 30, inv: { fist: 1, cap_grey: 1, fleece: 1, sneakers: 1, silverbag: 1, starstick: 1, 'starstick#ab12': 1 }, enh: { 'starstick#ab12': 20 }, eq: { weapon: 'starstick', hat: 'cap_grey', armor: 'fleece', shoes: 'sneakers', bag: 'silverbag' } });
  await enterZone(page, 0);
  await openTab(page, 'equip');
  const cards = page.locator('#menu .card:not(.col)', { hasText: '단단한 맥북프로' });
  await expect(cards).toHaveCount(2);
  const atk0 = await page.evaluate(() => G.st.atk);
  await page.locator('#menu .card:not(.col)', { hasText: '단단한 맥북프로 +20' }).locator('[data-m="equip"]').click();
  expect(await page.evaluate(() => [G.pd.eq.weapon, G.st.enh])).toEqual(['starstick#ab12', 20]);
  expect(await page.evaluate(() => G.st.atk)).toBeGreaterThan(atk0);
  await page.click('#menu [data-m="keepDup"][data-v="5"]');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem(SAVEKEY)).keepDup)).toBe(5);
  await expect(page.locator('#menu .kdup .btn.on')).toHaveText('초월만 보관');
});

test('계정 연결: 익명 희수에 구글 연결 → 돌아오면 완료 안내', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 12 });
  await page.evaluate(MOCK_SB);
  await page.click('#tCloud');
  await expect(page.locator('#accBtns .acc-google', { hasText: '구글 계정 연결' })).toBeVisible();
  await expect(page.locator('#accBtns .acc-kakao', { hasText: '카카오로 로그인해서 불러오기' })).toBeVisible();
  await page.locator('#accBtns .acc-google', { hasText: '구글 계정 연결' }).click();
  await page.waitForFunction(() => window.__oauth);
  expect(await page.evaluate(() => [__oauth, JSON.parse(localStorage.getItem(ACC_KEY)).op])).toEqual([['link', 'google'], 'link']);
  // 구글에서 돌아옴
  await page.evaluate(async () => { __user = { id: 'u-me', email: 'a@b.c', identities: [{ provider: 'google' }] }; await accBoot(); });
  await expect(page.locator('.toast', { hasText: '계정 연결 완료' })).toBeVisible();
  await page.evaluate(() => accRender()); await expect(page.locator('#accMsg')).toContainText('구글 계정과 연결돼 있어요 (a@b.c)');
});

test('계정 로그인: 다른 기기에서 로그인하면 서버 세이브로 바뀜 / 로그인 계정은 서버가 더 최근이면 받아옴', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 3, svT: 1000 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(async () => {
    __user = { id: 'u-me', identities: [{ provider: 'kakao' }] };
    __db.hb_saves.push({ user_id: 'u-me', data: Object.assign(newPD(), { lv: 42, guide: 99, svT: 5000 }), ep2: null });
    localStorage.setItem(ACC_KEY, JSON.stringify({ op: 'login', p: 'kakao' })); await accBoot();
  });
  await page.waitForLoadState('load'); await page.waitForTimeout(300);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem(SAVEKEY)).lv)).toBe(42);
  // 같은 계정 다른 기기에서 더 진행 → 이 기기 시작할 때 받아옴
  await page.evaluate(MOCK_SB);
  await page.evaluate(async () => {
    __user = { id: 'u-me', identities: [{ provider: 'kakao' }] }; G.state = 'title';
    __db.hb_saves.push({ user_id: 'u-me', data: Object.assign(newPD(), { lv: 45, guide: 99, svT: Date.now() + 60000 }), ep2: null }); await accBoot();
  });
  await page.waitForLoadState('load'); await page.waitForTimeout(300);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem(SAVEKEY)).lv)).toBe(45);
});

test('계정 로그인: 연결된 희수가 없는 계정이면 원래 희수 유지', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 7 });
  await page.evaluate(MOCK_SB);
  await page.evaluate(async () => { __user = { id: 'u-me', identities: [{ provider: 'google' }] }; localStorage.setItem(ACC_KEY, JSON.stringify({ op: 'login', p: 'google' })); await accBoot(); });
  await expect(page.locator('.toast', { hasText: '연결된 희수가 없어요' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem(SAVEKEY)).lv)).toBe(7);
});

test('토스트는 로비·팝업 위에 보임 (계정 연결 완료 안내 등)', async ({ page }) => {
  await withSave(page, URL_MAIN, { lv: 12 });
  await page.click('#tCloud');
  await page.evaluate(() => toast('카카오 계정 연결 완료!', 'lvl'));
  const t = page.locator('.toast', { hasText: '연결 완료' });
  await expect(t).toBeVisible();
  // 토스트는 클릭이 통과(pointer-events:none)하므로 쌓임 순서로 확인
  const z = await page.evaluate(() => ['#toasts', '#title', '#cloud', '#menu', '#confirm'].map(s => +getComputedStyle(document.querySelector(s)).zIndex || 0));
  expect(Math.max(...z.slice(1))).toBeLessThan(z[0]);
});
