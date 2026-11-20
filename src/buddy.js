// ===================== 친구 희수 데려가기 (하루 1번, 15분 동료) =====================
// 서버 hb_borrow_friend: 하루 1번, 빌려준 친구는 강화석 3 (하루 10번까지). 동료는 친구 스냅샷 공격의 50%로 싸우고 죽지 않음
const BUDDY_TIME = 900, BUDDY_MUL = 0.5;
const BUDDY = { list: /** @type {any[]} */ ([]), busy: false, paused: false };

const buddyActive = pd => !!(pd && pd.buddy && pd.buddy.day === todayKey() && pd.buddy.left > 0);
const buddyUsedToday = pd => !!(pd && pd.buddy && pd.buddy.day === todayKey());
/** 필드(스테이지·할로윈·레이드)에 동료 세우기 */
function buddySpawn() {
  G.buddy = null; const pd = G.pd; if (FORCE_EASY || !buddyActive(pd) || G.pvp || !G.P) return;
  G.buddy = { x: G.P.x - 18, y: G.P.y + 6, t: 0, ang: -Math.PI / 2, mv: 0, atkCd: 1, side: 0, snap: pd.buddy.snap, nick: pd.buddy.nick, flash: 0, spawnT: 0.8, stun: 0, dead: false, cast: null };
}
function buddyUpdate(dt) {
  const B = G.buddy, pd = G.pd; if (!B || !G.P) return;
  if (!buddyActive(pd)) { toast(`${B.nick}의 희수가 돌아갔어요. 내일 또 데려와요!`, 'sub'); G.buddy = null; return; }
  pd.buddy.left = Math.max(0, pd.buddy.left - dt); B.t += dt; B.atkCd -= dt; if (B.spawnT > 0) { B.spawnT -= dt; return; }
  const S = B.snap || {}, w = S.w || { reach: 16, rate: 1.5, mul: 1, arc: 100 }, P = G.P, sp = 74 * Math.min(1.4, S.spd || 1);
  let tgt = null, best = 1e9;
  for (const e of G.enemies) { if (e.dead || e.spawnT > 0 || e.rival) continue; const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < 170) { const db = Math.hypot(e.x - B.x, e.y - B.y); if (db < best) { best = db; tgt = e; } } }
  let gx = P.x - 18, gy = P.y + 6, x0 = B.x, y0 = B.y;
  if (tgt) { const reach = (w.reach || 16) + (tgt.r || 6); B.ang = Math.atan2(tgt.y - B.y, tgt.x - B.x);
    if (best > reach) { gx = tgt.x; gy = tgt.y; }
    else { gx = B.x; gy = B.y; if (B.atkCd <= 0) { B.atkCd = 1 / (w.rate || 1.5);
      dealDamage(tgt, (S.atk || 10) * (w.mul || 1) * BUDDY_MUL, { kb: 18, ang: B.ang });
      G.fx.push({ k: 'swing', ent: B, x: B.x, y: B.y - 8, a: B.ang, reach: w.reach || 14, arc: (w.arc || 100) * Math.PI / 180, t: 0, dur: 0.18, style: w.style, wpn: w.id, side: (B.side ^= 1) }); } } }
  const dx = gx - B.x, dy = gy - B.y, d = Math.hypot(dx, dy);
  if (d > 3) { const m = Math.min(d, sp * dt * (d > 80 ? 1.8 : 1)); B.x += dx / d * m; B.y += dy / d * m; if (!tgt) B.ang = Math.atan2(dy, dx); }
  if (d > 260) { B.x = P.x - 18; B.y = P.y + 6; } // 너무 멀어지면 옆으로
  B.mv = Math.hypot(B.x - x0, B.y - y0) / Math.max(dt, 1e-3);
}
const buddyLeftTxt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------- 친구 고르기 ----------
async function buddyOpen() {
  if (FORCE_EASY || G.pvp) return;
  if (G.state === 'play') { G.state = 'menu'; BUDDY.paused = true; INP.atk = false; }
  const box = $('#buddy'); box.hidden = false; const pd = G.pd;
  if (buddyUsedToday(pd)) {
    $('#buddyBody').innerHTML = `<div class="bdnow"><img src="${pvpFaceURL(pd.buddy.snap.vis || pd.buddy.snap.eq, pd.buddy.snap.hair)}"><div><b>${esc(pd.buddy.nick)}의 희수</b><small>${buddyActive(pd) ? `함께하는 중 · 남은 시간 ${buddyLeftTxt(pd.buddy.left)}` : '오늘은 이미 함께했어요. 내일 또 데려올 수 있어요!'}</small></div></div>`;
    return;
  }
  $('#buddyBody').innerHTML = '<div class="pvmsg">친구 목록을 불러오는 중...</div>';
  try {
    await sbInit(); if (!PV.me) await pvpLoadMe().catch(() => { });
    if (!PV.me) { $('#buddyBody').innerHTML = `<div class="pvmsg">랭킹에 내 희수를 올려야 친구를 데려올 수 있어요</div><button class="btn pk" onclick="buddyClose(); rankJoin();">랭킹에 내 희수 올리기</button>`; return; }
    const { data, error } = await SB.from('hb_fighters').select('user_id,nickname,snap,power').eq('played', true).order('power', { ascending: false }).limit(30); if (error) throw error;
    BUDDY.list = (data || []).filter(f => f.user_id !== PV.uid);
    $('#buddyBody').innerHTML = `<p class="smsub">하루 한 번, 친구의 희수가 ${BUDDY_TIME / 60}분 동안 같이 싸워줘요 (공격력 ${BUDDY_MUL * 100}%)<br>데려간 친구는 강화석 3개를 받아요</p>`
      + (BUDDY.list.length ? BUDDY.list.map((f, i) => { const s = f.snap || {}; return `<div class="bdrow"><img src="${pvpFaceURL(s.vis || s.eq, s.hair)}"><span><em>${esc(f.nickname)}</em><small>Lv.${s.lv || '?'}${s.aw ? '★' + s.aw : ''} · 전투력 ${Number(f.power).toLocaleString()}</small></span><button class="btn pk sm" data-bd="${i}">데려가기</button></div>`; }).join('')
        : '<div class="pvmsg">아직 데려올 친구가 없어요. 카드 공유로 친구를 불러보세요!</div>');
  } catch (e) { $('#buddyBody').innerHTML = `<div class="pvmsg">불러오지 못했어요: ${esc(pvErr(e))}</div>`; }
}
async function buddyPick(i) {
  const f = BUDDY.list[i]; if (!f || BUDDY.busy) return; BUDDY.busy = true;
  try {
    const { data, error } = await SB.rpc('hb_borrow_friend', { p_friend: f.user_id }); if (error) throw error;
    if (!data || !data.ok) { toast(data && data.reason === 'used' ? '오늘은 이미 친구를 데려왔어요' : '지금은 데려올 수 없어요', 'warn'); return; }
    G.pd.buddy = { day: todayKey(), uid: f.user_id, nick: data.nickname, snap: data.snap || f.snap, left: BUDDY_TIME }; saveGame();
    buddyClose(); buddySpawn(); toast(`🤝 ${data.nickname}의 희수가 함께해요! (${BUDDY_TIME / 60}분)`, 'lvl'); sfx('lvl');
    if (G.buddy) bubble(G.P, choice(['든든하다!', '같이 가자!', '고마워 친구야~']), 1.4);
  } catch (e) { toast('데려오지 못했어요: ' + pvErr(e), 'warn'); } finally { BUDDY.busy = false; }
}
function buddyClose() { $('#buddy').hidden = true; if (BUDDY.paused && G.state === 'menu' && $('#menu').hidden) G.state = 'play'; BUDDY.paused = false; }
function buddyBoot() {
  if (FORCE_EASY) return;
  $('#buddy').addEventListener('click', e => { const b = /** @type {HTMLElement} */ (e.target).closest('[data-bd]'); if (b) buddyPick(+b.getAttribute('data-bd')); });
  $('#buddyX').onclick = buddyClose;
}
