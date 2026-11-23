// ===================== 1:1 교환 (서버 supabase/xchg.sql, 경매장 창 4번째 탭) =====================
// 제안 → 수락. 보내는 사람 물건은 제안할 때 서버 보관, 받는 사람이 수락하면 한 번에 맞바꿈. 거절·취소·24시간 지나면 반환.
// 골드는 받는 쪽에 수수료 5%. 강화석은 교환 안 됨. 장비가 한쪽에라도 하나는 있어야 함. Lv30 + 구글·카카오 연결 계정만. 하루 한도 없음.
const XC_FEE = 0.05, XC_MAX_ITEMS = 5;
const XC = { mine: /** @type {any} */ (null), partner: /** @type {any} */ (null), nick: '', give: /** @type {string[]} */ ([]), want: /** @type {string[]} */ ([]), gold: '', wantGold: '', msg: '' };
const XC_ERR = { nick: '랭킹에 닉네임을 등록한 희수만 교환할 수 있어요', lv: 'Lv30부터 교환할 수 있어요', link: '구글·카카오 계정을 연결한 희수만 교환할 수 있어요 (기기 이동 → 계정 연결)',
  no_user: '그 닉네임의 희수가 없어요', self: '나와는 교환할 수 없어요', empty: '서로 하나 이상은 줘야 해요', no_item: '장비가 하나는 들어가야 해요 (골드끼리 교환은 안 돼요)',
  gold: '골드는 100G 이상으로 적어주세요', want_item: '상대가 이미 가지고 있지 않은 장비가 있어요. 다시 찾아주세요', too_many: '보낸 제안은 10개까지예요', too_many_items: `장비는 한쪽에 ${XC_MAX_ITEMS}개까지예요`,
  want_gone: '내가 줄 장비가 없어졌어요', closed: '이미 끝난 제안이에요' };
const xcErr = r => { if (r && r.reason === 'partner') return '상대가 아직 교환할 수 없는 상태예요' + (r.why === 'lv' ? ' (Lv30 미만)' : r.why === 'link' ? ' (계정 연결 안 함)' : ''); return XC_ERR[r && r.reason] || AUC_ERR[r && r.reason] || TRADE_ERR[r && r.reason] || '처리하지 못했어요'; };
const xcName = it => `${ITEMS[it.def] ? ITEMS[it.def].name : it.def}${it.enh ? ' +' + it.enh : ''}`;
function xcItemChip(it, grp, v, on) {
  const def = ITEMS[it.def]; if (!def) return '';
  return `<button class="xcitem${on ? ' on' : ''}" data-auc="${grp}" data-v="${v}"><img src="${itemURL(it.def)}" alt=""><span class="r${it.rar}">${xcName(it)}</span>${it.ref && it.ref.lines && it.ref.lines.length ? `<small>옵션 ${it.ref.lines.length}줄</small>` : ''}</button>`;
}
const xcList = (items, gold) => (items || []).map(it => `<div class="xcl"><img src="${itemURL(it.def)}" alt=""><span class="r${it.rar}">${xcName(it)}</span>${aucRefTxt(it.ref)}</div>`).join('') + (gold ? `<div class="xcl gold"><img src="${iconURL('i_coin', ICONS.coin)}" alt=""><b>${aucG(gold)}</b> <small>(받는 쪽 ${aucG(gold - Math.floor(gold * XC_FEE))})</small></div>` : '') || '<div class="xcl none">없음</div>';
function xcHtml() {
  const M = XC.mine || {}, why = M.why, list = M.list || [], pd = aucPd();
  let h = `<p class="aucmsg">서로 원하는 걸 정해서 제안하고, 상대가 수락하면 한 번에 바뀌어요. 보낸 물건은 서버가 맡아두고, 거절·취소·24시간이 지나면 돌아와요. 골드는 받는 쪽에 수수료 ${XC_FEE * 100}%가 붙어요. 강화석은 교환할 수 없어요.</p>`;
  if (why) h += `<div class="xcwarn"><b>${XC_ERR[why] || '아직 교환할 수 없어요'}</b>${why === 'link' ? '<button class="btn pk sm" data-auc="xcLink">계정 연결하러 가기</button>' : ''}</div>`;
  const open = list.filter(t => t.state === 'open'), inc = open.filter(t => t.dir === 'in'), out = open.filter(t => t.dir === 'out'), done = list.filter(t => t.state !== 'open');
  h += `<h4>받은 제안 ${inc.length}</h4>` + (inc.length ? '' : '<p class="aucmsg">받은 제안이 없어요</p>');
  for (const t of inc) h += `<div class="xccard"><div class="xchd"><b>${esc(t.who || '희수')}</b>님의 제안 <small>남은 시간 ${aucLeft(t.expires)}</small></div>${t.msg ? `<div class="xcmsg" data-raw>「${esc(t.msg)}」</div>` : ''}`
    + `<div class="xccols"><div><em>받는 것</em>${xcList(t.give, t.gold)}</div><div><em>주는 것</em>${xcList(t.want, t.want_gold)}</div></div>`
    + `<div class="aucact"><button class="btn wh sm" data-auc="xcDecline" data-v="${t.id}">거절</button><button class="btn pk sm" data-auc="xcAccept" data-v="${t.id}"${why ? ' disabled' : ''}>수락하고 교환</button></div></div>`;
  h += `<h4>보낸 제안 ${out.length}/10</h4>` + (out.length ? '' : '<p class="aucmsg">보낸 제안이 없어요</p>');
  for (const t of out) h += `<div class="xccard"><div class="xchd"><b>${esc(t.who || '희수')}</b>님에게 보낸 제안 <small>남은 시간 ${aucLeft(t.expires)}</small></div>`
    + `<div class="xccols"><div><em>주는 것 (보관 중)</em>${xcList(t.give, t.gold)}</div><div><em>받고 싶은 것</em>${xcList(t.want, t.want_gold)}</div></div>`
    + `<div class="aucact"><button class="btn wh sm" data-auc="xcCancel" data-v="${t.id}">제안 취소</button></div></div>`;
  // 새 제안
  h += '<h4>새 교환 제안</h4><div class="xcnew">';
  h += `<div class="xcrow"><span class="lb">상대</span><input id="xcNick" maxlength="12" placeholder="상대 닉네임" value="${esc(XC.nick)}" autocomplete="off"><button class="btn sm" data-auc="xcFind">찾기</button></div>`;
  if (XC.partner) {
    const P = XC.partner, items = P.items || [];
    h += `<div class="xcsec"><div class="xcst">받고 싶은 것 · <b>${esc(P.nick)}</b> <small>Lv.${P.lv}</small></div><div class="xcitems">${items.length ? items.map(it => xcItemChip(it, 'xcWant', it.id, XC.want.includes(it.id))).join('') : '<p class="aucmsg">상대가 교환할 수 있는 장비가 없어요</p>'}</div>`
      + `<div class="xcrow"><span class="lb">골드</span><input type="text" inputmode="numeric" class="numin" id="xcWantGold" placeholder="0" value="${esc(XC.wantGold)}"><span class="unit">G</span></div></div>`;
    const eqd = new Set([...Object.values(pd.eq), ...Object.values(pd.beq || {})]);
    const mine = Object.keys(pd.inv).filter(k => tradableKey(k) && !eqd.has(k)).sort((x, y) => ITEMS[y].rar - ITEMS[x].rar);
    h += `<div class="xcsec"><div class="xcst">내가 줄 것</div><div class="xcitems">${mine.length ? mine.map(k => xcItemChip({ def: defOf(k), rar: ITEMS[k].rar, enh: (pd.enh || {})[k] || 0, ref: (pd.ref || {})[k] }, 'xcGive', k, XC.give.includes(k))).join('') : '<p class="aucmsg">줄 수 있는 장비가 없어요 (전설 이상·착용 안 한 장비)</p>'}</div>`
      + `<div class="xcrow"><span class="lb">골드</span><input type="text" inputmode="numeric" class="numin" id="xcGold" placeholder="0" value="${esc(XC.gold)}"><span class="unit">G</span></div></div>`
      + `<div class="xcrow"><span class="lb">한마디</span><input id="xcMsg" maxlength="40" placeholder="(선택) 40자" value="${esc(XC.msg)}" autocomplete="off"></div>`
      + `<div class="aucact"><button class="btn pk" data-auc="xcSend"${why ? ' disabled' : ''}>제안 보내기</button></div>`;
  }
  h += '</div>';
  if (done.length) { h += '<h4>최근 7일</h4>'; for (const t of done) { const st = { done: '교환 완료', cancelled: '취소함', declined: t.dir === 'in' ? '거절함' : '거절당함', expired: '기간 만료' }[t.state] || t.state; h += `<div class="xccard done"><div class="xchd">${esc(t.who || '희수')} · ${st}</div></div>`; } }
  return h;
}
async function xcLoad() { const { data, error } = await SB.rpc('hb_xchg_mine'); if (error) throw error; XC.mine = data || {}; }
async function xcFind() {
  const nick = String(/** @type {HTMLInputElement} */ ($('#xcNick')).value || '').trim(); XC.nick = nick; if (!nick) { toast('상대 닉네임을 적어주세요', 'warn'); return; }
  try { const { data, error } = await SB.rpc('hb_xchg_find', { p_nick: nick }); if (error) throw error; if (!data || !data.ok) { XC.partner = null; toast(xcErr(data), 'warn'); aucRender(); return; } XC.partner = data; XC.want = []; aucRender(); }
  catch (e) { toast('찾지 못했어요: ' + pvErr(e), 'warn'); }
}
function xcToggle(arr, v) { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else if (arr.length >= XC_MAX_ITEMS) toast(XC_ERR.too_many_items, 'warn'); else arr.push(v); aucRender(); }
function xcSendAsk() {
  const P = XC.partner; if (!P || AUC.busy) return; const pd = aucPd();
  const g = numVal('#xcGold') || 0, wg = numVal('#xcWantGold') || 0;
  if (XC.give.length + XC.want.length === 0) { toast(XC_ERR.no_item, 'warn'); return; }
  if ((!XC.give.length && !g) || (!XC.want.length && !wg)) { toast(XC_ERR.empty, 'warn'); return; }
  if ((g && g < 100) || (wg && wg < 100)) { toast(XC_ERR.gold, 'warn'); return; }
  if (g > (pd.gold || 0)) { toast(AUC_ERR.balance, 'warn'); return; }
  const wItems = (P.items || []).filter(it => XC.want.includes(it.id));
  const giveTxt = [...XC.give.map(k => xcName({ def: defOf(k), enh: (pd.enh || {})[k] })), ...(g ? [aucG(g)] : [])].join(', ');
  const wantTxt = [...wItems.map(xcName), ...(wg ? [aucG(wg)] : [])].join(', ');
  confirmBox(`${P.nick}님에게 교환을 제안할까요?\n내가 줌: ${giveTxt}\n받음: ${wantTxt}\n(보내는 물건은 수락·거절 전까지 서버가 맡아둬요)`, xcSend);
}
async function xcSend() {
  const P = XC.partner; if (!P || AUC.busy) return; AUC.busy = true;
  const g = numVal('#xcGold') || 0, wg = numVal('#xcWantGold') || 0, msg = String(/** @type {HTMLInputElement} */ ($('#xcMsg')).value || '').trim(), give = XC.give.slice();
  try {
    if (!(await cloudSync(true))) { toast(TRADE_ERR.sync, 'warn'); return; }
    const { data, error } = await SB.rpc('hb_xchg_propose', { p_nick: P.nick, p_give: give, p_gold: g, p_want: XC.want, p_want_gold: wg, p_msg: msg || null }); if (error) throw error;
    if (!data || !data.ok) { toast(xcErr(data), 'warn'); return; }
    tradeWithPd(p => { for (const k of give) { dropItem(p, k); (p.tkeys = p.tkeys || []).push(k); } if (g) p.gold = Math.max(0, (p.gold || 0) - g); }); cloudSync(true);
    sfx('ding'); toast(`${P.nick}님에게 교환을 제안했어요`, 'lvl');
    Object.assign(XC, { partner: null, give: [], want: [], gold: '', wantGold: '', msg: '' });
  } catch (e) { toast('제안하지 못했어요: ' + pvErr(e), 'warn'); }
  finally { AUC.busy = false; }
  aucLoad();
}
function xcAcceptAsk(id) {
  const t = ((XC.mine || {}).list || []).find(x => x.id === id); if (!t) return; const pd = aucPd();
  for (const w of t.want) { if (!w.key || !pd.inv[w.key]) { toast(XC_ERR.want_gone, 'warn'); return; } if (Object.values(pd.eq).includes(w.key) || Object.values(pd.beq || {}).includes(w.key)) { toast(`${xcName(w)}을(를) 벗고 다시 해주세요`, 'warn'); return; } }
  if ((t.want_gold || 0) > (pd.gold || 0)) { toast(AUC_ERR.balance, 'warn'); return; }
  confirmBox(`${t.who}님과 교환할까요?\n받음: ${[...t.give.map(xcName), ...(t.gold ? [aucG(t.gold - Math.floor(t.gold * XC_FEE)) + ' (수수료 뺌)'] : [])].join(', ') || '없음'}\n줌: ${[...t.want.map(xcName), ...(t.want_gold ? [aucG(t.want_gold)] : [])].join(', ') || '없음'}`, () => xcAccept(t));
}
async function xcAccept(t) {
  if (AUC.busy) return; AUC.busy = true;
  try {
    if (!(await cloudSync(true))) { toast(TRADE_ERR.sync, 'warn'); return; }
    const { data, error } = await SB.rpc('hb_xchg_accept', { p_id: t.id }); if (error) throw error;
    if (!data || !data.ok) { toast(xcErr(data), 'warn'); return; }
    tradeWithPd(p => { for (const w of t.want) if (w.key) { dropItem(p, w.key); (p.tkeys = p.tkeys || []).push(w.key); } if (t.want_gold) p.gold = Math.max(0, (p.gold || 0) - t.want_gold); });
    await claimGifts(aucPd()).catch(() => { }); await tradeClaim().catch(() => 0); cloudSync(true);
    sfx('lvl'); toast('교환 완료!', 'lvl');
  } catch (e) { toast('교환하지 못했어요: ' + pvErr(e), 'warn'); }
  finally { AUC.busy = false; }
  aucLoad();
}
async function xcCancel(id, decline) {
  try { const { data, error } = await SB.rpc('hb_xchg_cancel', { p_id: id }); if (error) throw error; if (!data || !data.ok) { toast(xcErr(data), 'warn'); return; } toast(decline ? '제안을 거절했어요' : '제안을 취소했어요. 보낸 물건이 돌아와요', 'sub'); }
  catch (e) { toast('처리하지 못했어요: ' + pvErr(e), 'warn'); }
  aucLoad();
}
/** 경매장 창 클릭 중 교환 탭 것 처리 (처리했으면 true) */
function xcClick(m, v) {
  if (m === 'xcFind') { xcFind(); return true; }
  if (m === 'xcGive') { xcToggle(XC.give, v); return true; }
  if (m === 'xcWant') { xcToggle(XC.want, v); return true; }
  if (m === 'xcSend') { xcSendAsk(); return true; }
  if (m === 'xcAccept') { xcAcceptAsk(v); return true; }
  if (m === 'xcDecline') { confirmBox('이 제안을 거절할까요?', () => xcCancel(v, true)); return true; }
  if (m === 'xcCancel') { xcCancel(v, false); return true; }
  if (m === 'xcLink') { aucClose(); cloudOpen('title'); return true; }
  return false;
}
/** 입력 중인 값 기억 (다시 그려도 안 지워지게) */
function xcInput(i) { const id = i.id; if (id === 'xcNick') XC.nick = i.value; else if (id === 'xcGold') XC.gold = i.value; else if (id === 'xcWantGold') XC.wantGold = i.value; else if (id === 'xcMsg') XC.msg = i.value; }
