// ===================== 월드 보스 레이드 (주간 협동) =====================
// 서버: hb_raid_info(현황·순위), hb_raid_start(하루 3회, 입장 시 차감), hb_raid_report(피해 보고, 전투력 기반 상한)
// 전투: 60초, 보스 체력바 = 모두가 깎은 남은 HP. 보스는 이 전투에서 죽지 않음(피해만 집계)
const RAID_TIME = 60;
const RAID = { info: /** @type {any} */ (null), busy: false };
/** 레이드 보상표 (서버 hb_raid_settle 과 같아야 함) */
const RAID_REWARDS = [{ k: 1, label: '피해량 1위', s: 100, g: 1500000 }, { k: 2, label: '2~3위', s: 60, g: 800000 }, { k: 4, label: '처치 성공 시 참가자 전원', s: 40, g: 500000 }, { k: 5, label: '처치 실패 시 참가자', s: 15 }];

async function raidLoad() {
  try { await sbInit(); const { data, error } = await SB.rpc('hb_raid_info'); if (error) throw error; RAID.info = data; } catch (e) { RAID.info = null; throw e; }
  return RAID.info;
}
const raidBossURL = boss => { try { const m = MONS[boss], s = monSpr(m.spr), k = 5, c = mkCanvas(s.W * k, s.H * k), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(s.n, 0, 0, s.W * k, s.H * k); return c.toDataURL(); } catch (e) { return ''; } };
const raidLeft = I => { const s = Math.max(0, (new Date(I.ends_at).getTime() - Date.now()) / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600); return d ? `${d}일 ${h}시간` : `${h}시간 ${Math.floor(s % 3600 / 60)}분`; };

function raidOpen() {
  if (FORCE_EASY) return; const saved = loadGame(); if (!saved) { toast('1탄을 먼저 시작해야 레이드에 갈 수 있어요', 'warn'); return; }
  G.pd = saved; G.P = null; calcStats(); G.pvp = null; G.raid = null;
  $('#title').hidden = true; showHUD(false); G.state = 'raidLobby'; playBgm('boss');
  $('#raid').hidden = false; $('#raidBody').innerHTML = '<div class="pvmsg">서버에 연결하는 중...</div>';
  (async () => { try { await raidLoad(); if (!PV.me) await pvpLoadMe().catch(() => { }); raidRender(); } catch (e) { $('#raidBody').innerHTML = `<div class="pvmsg">연결 실패: ${esc(pvErr(e))}</div>`; } })();
}
function raidRender() {
  const I = RAID.info; if (!I) return; const m = MONS[I.boss] || MONS.boss4, pct = I.max_hp ? Math.max(0, I.hp) / I.max_hp : 0, my = I.my || { damage: 0, tries_today: 0 };
  const left = Math.max(0, (I.max_tries || 3) - (my.tries_today || 0)), killed = !!I.killed_at;
  const top = (I.top || []).map((t, i) => `<div class="rdrow${t.mine ? ' mine' : ''}"><i>${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</i><em>${esc(t.nickname)}</em><b>${Number(t.damage).toLocaleString()}</b></div>`).join('') || '<div class="pvmsg">아직 아무도 도전하지 않았어요. 첫 타를 날려보세요!</div>';
  const can = PV.me && left > 0;
  $('#raidBody').innerHTML = `<div class="rdboss"><img src="${raidBossURL(I.boss)}"><div><small>이번 주 월드 보스</small><b>${esc(m.name)}</b><span>${killed ? '처치 완료! 남은 기간은 피해량 경쟁' : `월요일 0시까지 ${raidLeft(I)}`}</span></div></div>`
    + `<div class="rdhp${killed ? ' dead' : ''}"><i style="width:${(pct * 100).toFixed(2)}%"></i><span>${killed ? '처치 완료 🎉' : `${Math.max(0, I.hp).toLocaleString()} / ${Number(I.max_hp).toLocaleString()}`}</span></div>`
    + `<div class="rdmine"><span>내 누적 피해 <b>${Number(my.damage || 0).toLocaleString()}</b></span><span>참가 ${I.participants || 0}명</span></div>`
    + `<div class="row rdbtns"><button class="btn pk" data-rd="go" ${can ? '' : 'disabled'}>${PV.me ? `도전하기 <small>오늘 남은 도전 ${left}/${I.max_tries || 3}</small>` : '랭킹 등록 후 도전할 수 있어요'}</button><button class="btn wh sm" data-rd="rw">보상 보기</button></div>`
    + (PV.me ? '' : `<button class="btn wh" data-rd="join">랭킹에 내 희수 올리기</button>`)
    + `<h3>피해량 순위</h3><div class="rdlist">${top}</div>`;
}
function raidRewardsOpen() {
  $('#seasonModalBody').innerHTML = `<h2>월드 보스 보상</h2><p class="smsub">월요일 0시에 선물함으로 지급돼요<br>(그 주에 1번이라도 도전한 희수만)</p>`
    + RAID_REWARDS.map(r => `<div class="srw"><div class="srk"><i>${r.k === 1 ? '🥇' : r.k === 2 ? '🥈' : r.k === 4 ? '🎉' : '🎗️'}</i><b>${r.label}</b></div>${rewardCards(rwItems(r))}</div>`).join('')
    + '<p class="smsub">순위 보상은 처치 성공 보상과 함께 받아요</p>';
  seasonModalShow();
}
async function raidGo() {
  if (RAID.busy) return; RAID.busy = true;
  try {
    const { data, error } = await SB.rpc('hb_raid_start'); if (error) throw error;
    if (!data || !data.ok) { toast(data && data.reason === 'tries' ? '오늘 도전은 다 썼어요. 내일 또 와요!' : '지금은 도전할 수 없어요', 'warn'); await raidLoad(); raidRender(); return; }
    RAID.info = data.info || RAID.info; $('#raid').hidden = true; fadeTo(() => startRaidArena(RAID.info), '월드 보스');
  } catch (e) { toast('도전 실패: ' + pvErr(e), 'warn'); } finally { RAID.busy = false; }
}

// ---------- 전투 ----------
function startRaidArena(I) {
  const m0 = MONS[I.boss] || MONS.boss4;
  G.raid = { t: RAID_TIME, dmg: 0, over: false, info: I }; G.pvp = null; G.inf = null; G.husUsed = false;
  G.zone = ZONES.length - 1; G.world = buildWorld(G.zone); const W = G.world;
  G.enemies = []; G.projs = []; G.fx = []; G.drops = []; G.parts = []; G.texts = []; G.bubbles = [];
  G.zoneKills = 0; G.bossSpawned = true; G.bossDefeated = false; G.exitOpen = false; G.spawnT = 99; G.ult = null; G.pendingEvent = null;
  G.P = null; calcStats(); G.P = newPlayer(W.start.x, W.start.y); G.P.fy = -1; G.P.dir = 'up';
  G.bori = G.pd.boriJoined ? newBori(W.start.x + 14, W.start.y + 3) : null;
  const e = spawnEnemy(I.boss, W.start.x, W.start.y - 120);
  // 거대화 + 내 능력치 기준 위협(한 대에 최대 HP 약 3.5%) + 방어 0(피해는 내 능력치로만), 체력바 = 모두의 남은 HP
  e.raid = true; e.sc *= 1.6; e.w *= 1.6; e.h *= 1.6; e.r = Math.round(e.r * 1.4); e.def = 0; e.elite = false;
  e.atk = G.st.hp * 0.035 * (60 + G.st.def) / 60; e.m = Object.assign({}, m0, { name: `월드 보스 · ${m0.name}`, drops: [], xp: 0, gold: [0, 0] });
  e.maxHp = Math.max(1, Number(I.max_hp) || 1); e.hp = Math.max(1, Number(I.hp) || 1); G.boss = e;
  G.cam.x = clamp(G.P.x - VW / 2, 0, Math.max(0, W.W - VW)); G.cam.y = clamp(G.P.y - 60 - VH / 2, 0, Math.max(0, W.H - VH));
  G.state = 'play'; showHUD(true); playBgm('boss'); banner('월드 보스', m0.name, 'boss'); sfx('boss');
  bubble(G.P, choice(['다 같이 잡자!', '내 몫은 확실히!', '희수 출격!']), 1.8);
}
/** dealDamage 에서 호출: 레이드 보스는 죽지 않고 피해만 쌓임 */
function raidHit(e, dmg) { if (!G.raid || G.raid.over) return; G.raid.dmg += dmg; if (e.hp < 1) e.hp = 1; }
function raidUpdate(dt) {
  const V = G.raid; if (!V || V.over || G.state !== 'play') return;
  V.t -= dt; if (V.t <= 0) { V.t = 0; raidEnd('시간 종료!'); }
}
async function raidEnd(why) {
  const V = G.raid; if (!V || V.over) return; V.over = true; G.state = 'raidEnd'; INP.atk = false; if (typeof autoOff === 'function') autoOff();
  const dmg = Math.round(V.dmg); sfx('lvl');
  $('#raidRes').hidden = false; $('#raidResT').textContent = why;
  $('#raidResS').innerHTML = `이번 도전 피해량<br><b class="rdbig">${dmg.toLocaleString()}</b><span id="raidResM">서버에 반영하는 중...</span>`;
  try {
    const { data, error } = await SB.rpc('hb_raid_report', { p_damage: dmg }); if (error) throw error;
    if (data && data.ok) { RAID.info = data.info || RAID.info; const I = RAID.info; $('#raidResM').innerHTML = `<br>내 누적 ${Number(data.total || 0).toLocaleString()}${data.capped ? ' (상한 적용)' : ''}<br>${I && I.killed_at ? '🎉 월드 보스 처치 완료!' : `보스 남은 HP ${Number(I ? I.hp : 0).toLocaleString()}`}`; }
    else $('#raidResM').textContent = '반영하지 못했어요 (도전 시간이 지났어요)';
  } catch (e) { $('#raidResM').textContent = '반영 실패: ' + pvErr(e); }
  saveGame();
}
function raidResAct(a) {
  $('#raidRes').hidden = true; G.raid = null; G.enemies = []; G.boss = null; showHUD(false);
  if (a === 'lobby') { G.state = 'raidLobby'; $('#raid').hidden = false; raidRender(); playBgm('boss'); (async () => { try { await raidLoad(); raidRender(); } catch (e) { } })(); }
  else showTitle();
}
function raidBoot() {
  if (FORCE_EASY) return;
  $('#raid').addEventListener('click', e => { const b = /** @type {HTMLElement} */ (e.target).closest('[data-rd]'); if (!b) return; const a = b.getAttribute('data-rd');
    if (a === 'go') raidGo(); else if (a === 'rw') raidRewardsOpen(); else if (a === 'join') rankJoin(); else if (a === 'close') { $('#raid').hidden = true; showTitle(); } });
  $('#raidRes').addEventListener('click', e => { const b = /** @type {HTMLElement} */ (e.target).closest('[data-rr]'); if (b) raidResAct(b.getAttribute('data-rr')); });
}

/** 받은 레이드 보상 모달 */
function raidGotOpen(rank, killed, items) {
  const head = rank ? `월드 보스 피해량<br><em>${rank}위</em> 달성!` : killed ? '월드 보스<br><em>처치 성공!</em>' : '월드 보스<br><em>참가 보상</em>';
  $('#seasonModalBody').innerHTML = `<div class="sgot"><div class="sbig">${rank === 1 ? '🥇' : rank ? '🥈' : killed ? '🎉' : '🎗️'}</div><h2>지난 주 ${head}</h2><p class="smsub">${killed ? '다 같이 보스를 쓰러뜨렸어요!' : '아쉽게 못 잡았지만 함께해줘서 고마워요'}</p>${rewardCards(items, true)}</div>`;
  seasonModalShow(); sfx('lvl');
}
