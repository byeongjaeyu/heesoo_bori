// ===================== 랭킹 대시보드 (전투력 · PvP) =====================
const RK = { tab: 'power', cache: {}, from: 'title' };
const validEq = eq => (eq && SLOTS.every(sl => eq[sl] && ITEMS[eq[sl]])) ? eq : newPD().eq;
function fighterURL(snap, scale) {
  scale = scale || 4; const key = JSON.stringify([snap.eq, snap.bori, snap.beq, scale]); if (RK.cache[key]) return RK.cache[key];
  const keep = G.pd; const beq = snap.bori && snap.beq ? { bcloth: ITEMS[snap.beq.bcloth] ? snap.beq.bcloth : null, btoy: ITEMS[snap.beq.btoy] ? snap.beq.btoy : null } : { bcloth: null, btoy: null };
  G.pd = { eq: validEq(snap.eq), beq };
  try {
    const hs = heeSet().down[0]; let bs = null, ts = null;
    if (snap.bori) { bs = boriSpr('sit'); if (beq.btoy) ts = spr('t_' + beq.btoy, ICONS[ITEMS[beq.btoy].icon]); }
    const W = hs.W + (bs ? bs.W + 2 : 0), H = Math.max(hs.H, bs ? bs.H + 1 : 0);
    const c = mkCanvas(W, H), g = c.getContext('2d'); g.drawImage(hs.n, 0, H - hs.H);
    if (bs) { const bx = hs.W + 2, by = H - bs.H; g.drawImage(bs.n, bx, by); if (ts) g.drawImage(ts.n, bx + Math.round(8 - ts.W / 2) - 2, by + 11 + Math.ceil(ts.H / 2) - ts.H - 3); }
    const o = mkCanvas(W * scale, H * scale), og = o.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(c, 0, 0, W * scale, H * scale);
    return RK.cache[key] = o.toDataURL();
  } catch (e) { return ''; } finally { G.pd = keep; }
}
function rankOpen(from) {
  RK.from = from || 'title'; RK.synced = false; $('#title').hidden = true; showHUD(false); G.state = 'rank'; $('#rank').hidden = false; rankTab(RK.tab);
}
function rankClose() { $('#rank').hidden = true; if (location.hash === '#ranking') history.replaceState(null, '', location.pathname); showTitle(); }
async function rankTab(t) {
  RK.tab = t; for (const b of document.querySelectorAll(/** @type {'button'} */ ('#rankTabs button'))) b.classList.toggle('on', b.dataset.rt === t);
  $('#rankSum').innerHTML = ''; $('#rankList').innerHTML = '<div class="pvmsg">랭킹을 불러오는 중...</div>';
  try {
    await sbInit(); if (!RK.synced) { RK.synced = true; await Promise.race([rankSync(true), new Promise(r => setTimeout(r, 4000))]); }
    if (!FORCE_EASY && !PV.me && !PV.notReg) await pvpLoadMe().catch(() => { });
    const col = 'user_id,nickname,snap,power,rating,wins,losses';
    const q = SB.from('hb_fighters').select(col).limit(50);
    const { data, error } = t === 'power' ? await q.order('power', { ascending: false }) : await q.order('rating', { ascending: false }).order('wins', { ascending: false });
    if (error) throw error;
    const { count } = await SB.from('hb_fighters').select('user_id', { count: 'exact', head: true });
    rankRender(data || [], count || (data || []).length);
  } catch (e) { $('#rankList').innerHTML = `<div class="pvmsg">랭킹을 불러오지 못했어요: ${esc(pvErr(e))}</div>`; }
}
function rankJoin() { RK.joining = true; pvpNickBox(true); $('#pvpNickMsg').textContent = '랭킹·PvP에서 쓸 닉네임을 정해주세요 (2~10자)'; }
function rankJoinBar() {
  if (FORCE_EASY || PV.me || !PV.notReg) return '';
  const has = !!(G.pd || loadGame());
  return `<div class="rjoin">${has ? `<span>내 희수는 아직 랭킹에 없어요</span><button class="btn pk" onclick="rankJoin()">내 희수도 올리기</button>` : '<span>1탄을 시작하면 내 희수도 랭킹에 올릴 수 있어요</span>'}</div>`;
}
function rankRender(rows, total) {
  const t = RK.tab, val = f => t === 'power' ? f.power.toLocaleString() : f.rating.toLocaleString(), unit = t === 'power' ? '전투력' : 'PvP 점수';
  const top = rows[0], avg = rows.length ? Math.round(rows.reduce((a, f) => a + f.power, 0) / rows.length) : 0;
  const maxEnh = rows.reduce((a, f) => Math.max(a, (f.snap && f.snap.enh) || 0), 0), games = rows.reduce((a, f) => a + f.wins + f.losses, 0);
  $('#rankSum').innerHTML = [
    ['등록된 희수', total.toLocaleString() + '명'],
    t === 'power' ? ['최고 전투력', top ? top.power.toLocaleString() : '-'] : ['최고 PvP 점수', top ? top.rating.toLocaleString() : '-'],
    t === 'power' ? ['평균 전투력', avg.toLocaleString()] : ['총 대결 수', Math.round(games / 2).toLocaleString() + '판+'],
    ['최고 무기 강화', maxEnh ? '+' + maxEnh : '-']
  ].map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('');
  if (!rows.length) { $('#rankList').innerHTML = rankJoinBar() + '<div class="pvmsg">아직 등록된 희수가 없어요.<br>닉네임을 등록하면 랭킹에 올라가요!</div>'; return; }
  const me = PV.uid;
  const pod = rows.slice(0, 3).map((f, i) => `<div class="rpod p${i + 1}${f.user_id === me ? ' mine' : ''}"><i>${i + 1}</i><img src="${fighterURL(f.snap || {}, 5)}"><em>${esc(f.nickname)}</em><b>${val(f)}</b><small>${unit} · Lv.${(f.snap && f.snap.lv) || '?'}${f.snap && f.snap.aw ? '★' + f.snap.aw : ''}${t === 'pvp' ? ` · ${f.wins}승 ${f.losses}패` : ''}</small></div>`);
  const order = pod.length === 3 ? [pod[1], pod[0], pod[2]] : pod;
  const list = rows.slice(3).map((f, i) => { const s = f.snap || {}; return `<div class="rrow${f.user_id === me ? ' mine' : ''}"><i>${i + 4}</i><img src="${fighterURL(s, 3)}"><span><em>${esc(f.nickname)}</em><small>Lv.${s.lv || '?'}${s.aw ? '★' + s.aw : ''}${s.enh ? ' · 무기 +' + s.enh : ''}${s.tenh ? ' · 장난감 +' + s.tenh : ''}${t === 'pvp' ? ` · ${f.wins}승 ${f.losses}패` : ` · PvP ${f.rating}`}</small></span><b>${val(f)}</b></div>`; }).join('');
  $('#rankList').innerHTML = rankJoinBar() + `<div class="rpodium">${order.join('')}</div>${list}`;
}
// 서버에 내 희수가 등록돼 있으면 최신 스펙을 올림 (게임 중 자동 저장 때 1분에 한 번, 타이틀·랭킹 열 때)
let rankSyncT = 0, rankSyncP = null;
async function rankSyncNow() {
  if (FORCE_EASY) return false; const pd = G.pd || loadGame(); if (!pd) return false;
  if (PV.notReg) return false;
  await sbInit(); const me = PV.me || await pvpLoadMe(); if (!me) { PV.notReg = true; return false; }
  const keep = G.pd; G.pd = pd;
  try { await pvpUpload(); } finally { if (keep !== pd) { G.pd = keep; if (keep) calcStats(); } }
  await claimGifts(pd).catch(() => { });
  return true;
}
function rankSync(force) {
  if (FORCE_EASY || (!force && Date.now() - rankSyncT < 60000)) return rankSyncP || Promise.resolve(false);
  rankSyncT = Date.now(); rankSyncP = rankSyncNow().catch(() => false).finally(() => { rankSyncP = null; }); return rankSyncP;
}

// 처음 들어오면 바로 닉네임 등록 (원터치 에디션 제외, 서버 연결 실패 시엔 그냥 넘어감)
let entryRegDone = false;
async function entryRegister() {
  if (FORCE_EASY || entryRegDone) return; entryRegDone = true;
  try {
    await sbInit(); const me = PV.me || await pvpLoadMe(); if (me) return;
    if (G.state === 'play' || G.state === 'menu' || G.state === 'dlg') { entryRegDone = false; return; } // 게임 중이면 다음 타이틀에서
    RK.joining = 'entry'; pvpNickBox(true); $('#pvpNickMsg').textContent = '어서 오세요! 랭킹에 쓸 닉네임을 정해주세요 (2~10자)';
  } catch (e) { }
}

// 운영자 선물(hb_grants) 받기: 서버에서 받은 표시를 남기고 세이브에 더함
async function claimGifts(pd) {
  if (FORCE_EASY || !pd || !SB) return;
  const { data, error } = await SB.rpc('hb_claim_grants', { p_kinds: ['auto', 'gold', 'stage', 'awaken'] }); if (error || !data || !data.length) return;
  const tgt = G.pd || pd; // 그 사이 게임을 시작했으면 실제 플레이 중인 세이브에 넣음
  for (const g of data) {
    if (g.kind === 'auto') {
      const sec = Number(g.amount) || 0; if (!sec) continue;
      tgt.autoBonus = (tgt.autoBonus || 0) + sec;
      const h = sec / 3600, txt = h >= 1 ? `${Math.round(h * 10) / 10}시간` : `${Math.round(sec / 60)}분`;
      toast(`🎁 선물 도착! 자동사냥 ${txt} 충전 (자정에도 안 사라져요)`, 'lvl'); sfx('lvl');
    } else if (g.kind === 'stage') {
      // amount = 누적 스테이지 번호 (1회차 STAGE 1 = 1, 회차당 ZONES.length개). 지금보다 앞일 때만 이동
      const n = Math.max(1, Number(g.amount) || 1) - 1, Z = ZONES.length, cl = Math.floor(n / Z), z = n % Z;
      const cur = (tgt.cleared || 0) * Z + (tgt.zone || 0);
      if (n > cur) { tgt.cleared = cl; tgt.zone = z; toast(`🎁 선물 도착! ${cl + 1}회차 ${ZONES[z].sub}(으)로 이동했어요`, 'lvl'); sfx('lvl'); }
    } else if (g.kind === 'awaken') {
      // amount = 목표 각성 단계. 올라간 만큼 각성 포인트도 지급
      const to = Number(g.amount) || 0, from = tgt.aw || 0;
      if (to > from) { tgt.aw = to; tgt.ap = (tgt.ap || 0) + (to - from); if ((tgt.lv || 1) < MAX_LV) { tgt.sp = (tgt.sp || 0) + (MAX_LV - tgt.lv); tgt.lv = MAX_LV; tgt.xp = 0; } toast(`🎁 선물 도착! 각성 ★${to} · 각성 포인트 +${to - from}`, 'lvl'); sfx('lvl'); }
    } else if (g.kind === 'gold') {
      const n = Number(g.amount) || 0; if (!n) continue;
      tgt.gold = (tgt.gold || 0) + n; toast(`🎁 선물 도착! ${n.toLocaleString()}G`, 'lvl'); sfx('coin');
    }
  }
  try { localStorage.setItem(SAVEKEY, JSON.stringify(tgt)); } catch (e) { }
  if (G.pd === tgt) calcStats();
  if (!G.pd && G.state === 'title' && !$('#title').hidden) showTitle(); // 타이틀 버튼 정보 갱신
}
