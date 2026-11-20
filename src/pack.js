// ===================== 뉴비 패키지 (베타 기간 무료) =====================
// 처음 본 순간부터 24시간 동안만 받을 수 있음. 시간이 지나도 의미가 남는 것: 자동사냥 시간·강화석·한정 헤어·한정 칭호
const PACK_MS = 24 * 3600 * 1000, PACK = { auto: 3 * 3600, stones: 300, hair: 'lavender', title: 'beta', price: '₩1,000' };
ICONS.gift = ['..KK...KK..', '.KQQK.KQQK.', '.KQQQKQQQK.', 'KKKKKKKKKKK', 'KQQQQRQQQQK', 'KKKKKRKKKKK', '.KQQQRQQQK.', '.KQQQRQQQK.', '.KQQQRQQQK.', '.KKKKKKKKK.'];
/** 남은 시간(ms). 이미 받았거나 끝났으면 0 */
const packLeft = pd => { if (FORCE_EASY || !pd) return 0; const p = pd.pack || {}; if (p.got) return 0; if (!p.seen) return PACK_MS; return Math.max(0, p.seen + PACK_MS - Date.now()); };
const packLeftTxt = ms => { const m = Math.ceil(ms / 60000); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
/** 로비에서 처음 보는 순간을 기록 (세이브에 바로 저장) */
function packSeen(saved) {
  if (FORCE_EASY || !saved || (saved.pack && saved.pack.seen)) return;
  saved.pack = Object.assign({}, saved.pack, { seen: Date.now() });
  try { localStorage.setItem(SAVEKEY, JSON.stringify(saved)); } catch (e) { }
  if (G.pd && G.pd !== saved && G.pd.sid === saved.sid) G.pd.pack = Object.assign({}, saved.pack);
}
function packTileHtml(pd) { const ms = packLeft(pd); return ms > 0 ? `<button class="ticon tpack" id="tPack">${`<img src="${iconURL('px_gift', ICONS.gift)}" alt="">`}<small>뉴비 패키지</small><b class="tpt">${packLeftTxt(ms)}</b><em class="dot"></em></button>` : ''; }
function packItemsHtml() {
  const hr = HAIRS.find(h => h.k === PACK.hair);
  return rewardCards([{ kind: 'auto', amount: PACK.auto }, { kind: 'stones', amount: PACK.stones }], true)
    + `<div class="rwcs big pkx"><div class="rwc"><i class="hsw" style="background:linear-gradient(135deg,${hr.h},${hr.H})"></i><b>${hr.name}</b><small>한정 헤어</small></div>`
    + `<div class="rwc"><span class="pkt">${achTag(PACK.title)}</span><b>칭호</b><small>한정 레전드</small></div></div>`;
}
function packOpen() {
  const pd = loadGame(), ms = packLeft(pd); if (!pd || ms <= 0) { showTitle(); return; }
  $('#packBody').innerHTML = `<div class="sgot"><div class="sbig">${PXI('gift')}</div><h2>뉴비 패키지 <em>BETA</em></h2><p class="smsub">처음 오신 희수님께 드리는 24시간 한정 패키지<br>남은 시간 <b>${packLeftTxt(ms)}</b></p>${packItemsHtml()}`
    + `<div class="pkprice"><s>${PACK.price}</s><b>베타 기간 무료!</b></div><button class="btn pk" id="packGo">무료로 받기</button></div>`;
  $('#packGo').onclick = packClaim; $('#pack').hidden = false; sfx('select');
}
function packClaim() {
  const pd = loadGame(); if (!pd || packLeft(pd) <= 0) { $('#pack').hidden = true; showTitle(); return; }
  pd.autoBonus = (pd.autoBonus || 0) + PACK.auto; pd.stones = (pd.stones || 0) + PACK.stones;
  pd.pack = Object.assign({}, pd.pack, { got: Date.now() }); pd.ach = Object.assign({}, pd.ach, { [PACK.title]: Date.now() });
  if (!pd.title) pd.title = PACK.title;
  G.pd = pd; saveGame(); sfx('lvl');
  $('#packBody').innerHTML = `<div class="sgot"><div class="sbig">${PXI('gift')}</div><h2>뉴비 패키지<br><em>받았어요!</em></h2>${packItemsHtml()}<p class="smsub">헤어는 메뉴 「꾸미기」, 칭호는 「칭호」에서 바꿀 수 있어요</p></div>`;
}
function packBoot() {
  if (FORCE_EASY) return;
  $('#packX').onclick = () => { $('#pack').hidden = true; showTitle(); };
  setInterval(() => { try { const b = $('#tPack'); if (b && G.state === 'title' && TITLE_PD) { const ms = packLeft(TITLE_PD); if (ms <= 0) b.remove(); else b.querySelector('.tpt').textContent = packLeftTxt(ms); } } catch (e) { } }, 30000);
}
