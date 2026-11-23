// ===================== 경매장 (서버 supabase/auction.sql, 거래 기반 trade.js 위) =====================
// 로비 왼쪽 「경매장」 → #auc. 둘러보기(부위·등급·정렬, 입찰·즉시 구매) / 판매하기(전설↑ 안 낀 장비 올리기) / 내 경매(판매 중·입찰 중·최근 결과).
// 입찰 골드·올린 장비는 서버가 보관. 밀린 입찰 골드·판매 대금(수수료 5% 뺌)은 선물함, 낙찰·유찰 장비는 받을 장비로 들어옴.
const AUC_FEE = 0.05, AUC_HOURS = [12, 24, 48];
const AUC = { tab: 'browse', slot: '', rar: 3, sort: 'end', list: /** @type {any[]} */ ([]), mine: /** @type {any} */ (null), sel: /** @type {string|null} */ (null), bidFor: /** @type {string|null} */ (null), hours: 24, busy: false, err: '' };
const AUC_SLOTS = [['', '전체'], ['weapon', '무기'], ['hat', '모자'], ['armor', '옷'], ['shoes', '신발'], ['bag', '가방'], ['bori', '보리']];
const AUC_RARS = [[3, '전설↑'], [4, '신화↑'], [5, '초월']];
const AUC_SORTS = [['end', '마감 임박'], ['low', '낮은 가격'], ['high', '높은 가격'], ['new', '최신']];
const AUC_ERR = Object.assign({}, TRADE_ERR, { nick: '경매장은 랭킹에 닉네임을 등록한 희수만 이용할 수 있어요', hours: '기간을 골라주세요', price: '가격을 확인해 주세요 (시작가 1,000G 이상, 즉시 구매가는 시작가 이상)',
  too_many: '경매는 한 번에 10개까지 올릴 수 있어요', closed: '이미 끝난 경매예요', own: '내가 올린 물건이에요', top: '이미 최고가로 입찰 중이에요', has_bids: '입찰이 있으면 취소할 수 없어요', balance: '골드가 부족해요' });
const aucErr = r => r && r.reason === 'low' ? `최소 ${Number(r.min).toLocaleString()}G부터 입찰할 수 있어요` : (AUC_ERR[r && r.reason] || '처리하지 못했어요');
const aucG = n => Number(n || 0).toLocaleString() + 'G';
function aucLeft(iso) { const s = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000)); if (s <= 0) return '마감'; const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h}시간 ${m}분` : m ? `${m}분` : `${s}초`; }
const aucRefTxt = ref => ref && ref.lines && ref.lines.length ? `<br><span class="refmini">옵션 ${ref.lines.map(l => `<b class="g${l.g}">${refLineTxt(l)}</b>`).join(' · ')}</span>` : '';
const aucPd = () => G.pd || loadGame();
/** 쉼표 들어간 입력칸 값 → 숫자 (비었으면 NaN) */
const numVal = (/** @type {string} */ sel) => { const v = String((/** @type {HTMLInputElement} */ ($(sel)) || { value: '' }).value).replace(/[^\d]/g, ''); return v ? Number(v) : NaN; };
/** 시작가 추천 (등급별) */
const aucSuggest = rar => [0, 0, 0, 10000, 50000, 200000][rar] || 10000;

async function aucOpen() {
  if (FORCE_EASY) return; const pd = aucPd(); if (!pd) return;
  await sbInit().catch(() => null);
  if (!PV.me) await pvpLoadMe().catch(() => null);
  if (!PV.me) { toast(AUC_ERR.nick, 'warn'); return; }
  AUC.tab = 'browse'; AUC.sel = null; AUC.bidFor = null; AUC.err = '';
  $('#auc').hidden = false; aucLoad();
}
function aucClose() { $('#auc').hidden = true; if (!G.pd && G.state === 'title' && !$('#title').hidden) showTitle(); }
/** 받을 것(밀린 입찰 골드·대금·장비) 먼저 받고 목록 불러오기 */
async function aucLoad() {
  $('#aucBody').innerHTML = '<p class="aucmsg">불러오는 중...</p>'; aucHead();
  try {
    await claimGifts(aucPd()).catch(() => { }); await tradeClaim().catch(() => 0);
    if (AUC.tab === 'browse') { const { data, error } = await SB.rpc('hb_auc_browse', { p_slot: AUC.slot, p_rar: AUC.rar, p_sort: AUC.sort }); if (error) throw error; AUC.list = data || []; }
    else if (AUC.tab === 'mine') { const { data, error } = await SB.rpc('hb_auc_mine'); if (error) throw error; AUC.mine = data || {}; }
    else if (AUC.tab === 'xchg') await xcLoad();
    AUC.err = '';
  } catch (e) { AUC.err = '서버에 연결할 수 없어요: ' + pvErr(e); }
  aucRender();
}
function aucHead() {
  const pd = aucPd(); $('#aucGold').innerHTML = pd ? `<img src="${iconURL('i_coin', ICONS.coin)}" alt="">${aucG(pd.gold)}` : '';
  document.querySelectorAll('#auc [data-auc-tab]').forEach(b => b.classList.toggle('on', b.getAttribute('data-auc-tab') === AUC.tab));
}
const aucRow = (lb, chips) => `<div class="aucf"><span class="lb">${lb}</span><div class="cs">${chips}</div></div>`;
const aucChip = (grp, v, t, on) => `<button class="aucchip${on ? ' on' : ''}" data-auc="${grp}" data-v="${v}">${t}</button>`;
function aucItemHtml(def, rar, enh, ilv, ref, extra) {
  const it = ITEMS[def]; if (!it) return '';
  return `<div class="ic"><img src="${itemURL(def)}" alt=""></div><div class="mid"><div class="nm"><span class="r${rar}">${it.name}${enh ? ' +' + enh : ''}</span>${ilv ? ` <small class="ilv">Lv.${ilv}</small>` : ''}</div><div class="ds">${RARITY[rar]} · ${SLOTNAME[it.slot] || ''}${aucRefTxt(ref)}${extra || ''}</div></div>`;
}
function aucRender() {
  aucHead(); const b = $('#aucBody'); let h = AUC.err ? `<p class="aucmsg warn">${esc(AUC.err)}</p>` : '';
  if (AUC.tab === 'browse') {
    h += `<div class="aucfil">${aucRow('부위', AUC_SLOTS.map(([v, t]) => aucChip('slot', v, t, AUC.slot === v)).join(''))}`
      + aucRow('등급', AUC_RARS.map(([v, t]) => aucChip('rar', v, t, AUC.rar === v)).join(''))
      + aucRow('정렬', AUC_SORTS.map(([v, t]) => aucChip('sort', v, t, AUC.sort === v)).join('')) + '</div>';
    if (!AUC.list.length && !AUC.err) h += '<p class="aucmsg">올라온 물건이 없어요. 「판매하기」에서 첫 물건을 올려보세요!</p>';
    for (const a of AUC.list) {
      const now = a.bid ? `현재가 <b>${aucG(a.bid)}</b> · 입찰 ${a.bids}건` : `시작가 <b>${aucG(a.start)}</b>`;
      const info = `<br><span class="aucp">${now}${a.buyout ? ` · 즉시 구매 <b>${aucG(a.buyout)}</b>` : ''}</span><br><small>${esc(a.seller)} · 남은 시간 ${aucLeft(a.ends)}</small>`;
      let act;
      if (a.mine) act = '<em class="auctag">내 물건</em>';
      else if (a.top) act = '<em class="auctag top">최고 입찰 중</em>';
      else if (AUC.bidFor === a.id) act = `<div class="aucbid"><input type="text" inputmode="numeric" class="numin" id="aucAmt" value="${numF(a.min)}"><button class="btn pk sm" data-auc="bidGo" data-v="${a.id}">입찰</button><button class="btn wh sm" data-auc="bidX">취소</button></div>`;
      else act = `<button class="btn pk sm" data-auc="bid" data-v="${a.id}">입찰 ${aucG(a.min)}~</button>${a.buyout ? `<button class="btn sm buy" data-auc="buy" data-v="${a.id}">즉시 구매</button>` : ''}`;
      h += `<div class="card aucc">${aucItemHtml(a.def, a.rar, a.enh, a.ilv, a.ref, info)}<div class="aucact">${act}</div></div>`;
    }
  } else if (AUC.tab === 'sell') {
    const pd = aucPd(), eqd = new Set([...Object.values(pd.eq), ...Object.values(pd.beq || {})]);
    const keys = Object.keys(pd.inv).filter(k => tradableKey(k) && !eqd.has(k)).sort((x, y) => ITEMS[y].rar - ITEMS[x].rar || ((pd.enh || {})[y] || 0) - ((pd.enh || {})[x] || 0));
    h += `<p class="aucmsg">전설 이상 장비를 올릴 수 있어요 (착용 중인 장비는 빼고). 강화·장비 레벨·재련 옵션도 그대로 넘어가요. 팔리면 수수료 ${AUC_FEE * 100}%를 뺀 골드가 선물함으로 와요.</p>`;
    if (!keys.length) h += '<p class="aucmsg">올릴 수 있는 장비가 없어요. 같은 장비 「가방에 보관」 설정을 켜면 예비 장비를 모을 수 있어요.</p>';
    for (const k of keys) {
      const it = ITEMS[k], en = (pd.enh || {})[k] || 0, ilv = (pd.ilv || {})[k] || 0, ref = (pd.ref || {})[k];
      let act = `<button class="btn pk sm" data-auc="sel" data-v="${k}">올리기</button>`;
      if (AUC.sel === k) act = `<div class="aucform"><label>시작가<input type="text" inputmode="numeric" class="numin" id="aucStart" value="${numF(aucSuggest(it.rar))}"></label>`
        + `<label>즉시 구매가 <small>(비워두면 없음)</small><input type="text" inputmode="numeric" class="numin" id="aucBuy" placeholder="없음"></label>`
        + aucRow('기간', AUC_HOURS.map(hr => aucChip('hours', hr, hr + '시간', AUC.hours === hr)).join(''))
        + `<div class="aucf aucgo"><button class="btn pk" data-auc="sellGo" data-v="${k}">경매에 올리기</button><button class="btn wh" data-auc="selX">취소</button></div></div>`;
      h += `<div class="card aucc${AUC.sel === k ? ' open' : ''}">${aucItemHtml(defOf(k), it.rar, en, ilv, ref)}<div class="aucact">${act}</div></div>`;
    }
  } else if (AUC.tab === 'xchg') {
    h += xcHtml();
  } else {
    const M = AUC.mine || {}, sell = M.selling || [], bid = M.bidding || [], done = M.done || [];
    h += `<h4>판매 중 ${sell.length}/10</h4>` + (sell.length ? '' : '<p class="aucmsg">올린 물건이 없어요</p>');
    for (const a of sell) h += `<div class="card aucc">${aucItemHtml(a.def, a.rar, a.enh, 0, null, `<br><span class="aucp">${a.bid ? `현재가 <b>${aucG(a.bid)}</b> · 입찰 ${a.bids}건` : `시작가 ${aucG(a.start)} · 아직 입찰 없음`}${a.buyout ? ` · 즉시 구매 ${aucG(a.buyout)}` : ''}</span><br><small>남은 시간 ${aucLeft(a.ends)}</small>`)}<div class="aucact">${a.bids ? '' : `<button class="btn wh sm" data-auc="cancel" data-v="${a.id}">내리기</button>`}</div></div>`;
    h += `<h4>입찰 중 ${bid.length}</h4>` + (bid.length ? '' : '<p class="aucmsg">최고가로 입찰 중인 물건이 없어요. 다른 희수가 더 높게 부르면 골드는 선물함으로 돌아와요.</p>');
    for (const a of bid) h += `<div class="card aucc">${aucItemHtml(a.def, a.rar, a.enh, 0, null, `<br><span class="aucp">내 입찰 <b>${aucG(a.bid)}</b>${a.buyout ? ` · 즉시 구매 ${aucG(a.buyout)}` : ''}</span><br><small>남은 시간 ${aucLeft(a.ends)}</small>`)}<div class="aucact"><em class="auctag top">최고 입찰 중</em></div></div>`;
    if (done.length) { h += '<h4>최근 7일 결과</h4>'; for (const a of done) { const t = a.state === 'sold' ? (a.sold ? `판매 ${aucG(a.price)} → ${aucG(a.price - a.fee)} 받음` : `낙찰 ${aucG(a.price)}`) : a.state === 'expired' ? '유찰 (장비 돌아옴)' : '내림 (장비 돌아옴)'; h += `<div class="card aucc done">${aucItemHtml(a.def, a.rar, a.enh, 0, null, `<br><small>${t}</small>`)}</div>`; } }
  }
  b.innerHTML = h;
}
async function aucBid(id, amt, isBuy) {
  if (AUC.busy) return; const pd = aucPd(); amt = Math.floor(Number(amt));
  if (!(amt > 0)) { toast('금액을 확인해 주세요', 'warn'); return; }
  if ((pd.gold || 0) < amt) { toast(AUC_ERR.balance, 'warn'); return; }
  AUC.busy = true;
  try {
    if (!(await cloudSync(true))) { toast(TRADE_ERR.sync, 'warn'); return; }
    const { data, error } = await SB.rpc('hb_auc_bid', { p_id: id, p_amount: amt }); if (error) throw error;
    if (!data || !data.ok) { toast(aucErr(data), 'warn'); if (data && data.reason === 'low') aucLoad(); return; }
    tradeWithPd(p => { p.gold = Math.max(0, (p.gold || 0) - data.bid); }); cloudSync(true);
    sfx('coin'); toast(data.bought ? `즉시 구매 완료! (${aucG(data.bid)}) 장비가 곧 들어와요` : `${aucG(data.bid)}에 입찰했어요`, 'lvl');
    AUC.bidFor = null; if (data.bought) await tradeClaim().catch(() => 0);
  } catch (e) { toast('입찰하지 못했어요: ' + pvErr(e), 'warn'); }
  finally { AUC.busy = false; }
  aucLoad();
}
async function aucSell(k) {
  if (AUC.busy) return; const pd = aucPd(), it = ITEMS[k];
  const start = numVal('#aucStart'), bv = numVal('#aucBuy'), buy = Number.isNaN(bv) ? null : bv;
  if (!(start >= 1000) || (buy !== null && !(buy >= start))) { toast(AUC_ERR.price, 'warn'); return; }
  if (!pd.inv[k] || Object.values(pd.eq).includes(k) || Object.values(pd.beq || {}).includes(k)) { toast(TRADE_ERR.equipped, 'warn'); return; }
  AUC.busy = true;
  try {
    if (!(await cloudSync(true))) { toast(TRADE_ERR.sync, 'warn'); return; }
    const { data, error } = await SB.rpc('hb_auc_list', { p_key: k, p_start: start, p_buyout: buy, p_hours: AUC.hours }); if (error) throw error;
    if (!data || !data.ok) { toast(aucErr(data), 'warn'); return; }
    tradeWithPd(p => { dropItem(p, k); (p.tkeys = p.tkeys || []).push(k); }); cloudSync(true);
    sfx('ding'); toast(`${it.name}을(를) 경매에 올렸어요 (${AUC.hours}시간)`, 'lvl'); AUC.sel = null; AUC.tab = 'mine';
  } catch (e) { toast('올리지 못했어요: ' + pvErr(e), 'warn'); }
  finally { AUC.busy = false; }
  aucLoad();
}
async function aucCancel(id) {
  try { const { data, error } = await SB.rpc('hb_auc_cancel', { p_id: id }); if (error) throw error; if (!data || !data.ok) { toast(aucErr(data), 'warn'); return; } toast('경매에서 내렸어요. 장비가 돌아와요', 'sub'); }
  catch (e) { toast('내리지 못했어요: ' + pvErr(e), 'warn'); }
  aucLoad();
}
function aucBoot() {
  if (FORCE_EASY) return;
  // 숫자 입력칸: 치는 동안 쉼표 넣기
  $('#auc').addEventListener('input', e => { const i = /** @type {HTMLInputElement} */ (e.target); if (!i.classList || !i.classList.contains('numin')) return; const d = i.value.replace(/[^\d]/g, '').slice(0, 10); i.value = d ? numF(+d) : ''; });
  $('#auc').addEventListener('input', e => xcInput(/** @type {HTMLInputElement} */ (e.target)));
  $('#auc').addEventListener('click', e => {
    const t = /** @type {HTMLElement} */ (e.target), tb = t.closest('[data-auc-tab]');
    if (tb) { AUC.tab = /** @type {string} */ (tb.getAttribute('data-auc-tab')); AUC.sel = null; AUC.bidFor = null; sfx('select'); if (AUC.tab === 'sell') aucRender(); else aucLoad(); return; }
    const b = t.closest('[data-auc]'); if (!b) return; const m = b.getAttribute('data-auc'), v = b.getAttribute('data-v') || '';
    if (m === 'close') return aucClose();
    if (xcClick(m, v)) return;
    if (m === 'slot') { AUC.slot = v; return aucLoad(); }
    if (m === 'rar') { AUC.rar = +v; return aucLoad(); }
    if (m === 'sort') { AUC.sort = v; return aucLoad(); }
    if (m === 'hours') { AUC.hours = +v; document.querySelectorAll('#auc [data-auc="hours"]').forEach(x => x.classList.toggle('on', x === b)); return; }
    if (m === 'bid') { AUC.bidFor = v; aucRender(); const i = /** @type {HTMLInputElement} */ ($('#aucAmt')); if (i) i.focus(); return; }
    if (m === 'bidX') { AUC.bidFor = null; return aucRender(); }
    if (m === 'bidGo') { const a = AUC.list.find(x => x.id === v), amt = numVal('#aucAmt'); if (a && a.buyout && amt >= a.buyout) { confirmBox(`즉시 구매가(${aucG(a.buyout)}) 이상이라 바로 구매돼요. 계속할까요?`, () => aucBid(v, a.buyout, true)); return; } return aucBid(v, amt, false); }
    if (m === 'buy') { const a = AUC.list.find(x => x.id === v); if (!a) return; confirmBox(`${ITEMS[a.def].name}${a.enh ? ' +' + a.enh : ''}\n즉시 구매 ${aucG(a.buyout)}에 살까요?`, () => aucBid(v, a.buyout, true)); return; }
    if (m === 'sel') { AUC.sel = v; return aucRender(); }
    if (m === 'selX') { AUC.sel = null; return aucRender(); }
    if (m === 'sellGo') { const it = ITEMS[v]; confirmBox(`${it.name}을(를) 경매에 올릴까요?\n올리면 가방에서 빠지고, 입찰이 없을 때만 내릴 수 있어요.`, () => aucSell(v)); return; }
    if (m === 'cancel') return aucCancel(v);
  });
}
