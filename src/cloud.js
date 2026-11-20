// ===================== 클라우드 세이브 + 기기 옮기기 (Supabase hb_saves / hb_transfer_codes) =====================
// - 저장할 때 1분에 한 번 서버에 백업 (1탄 세이브 + 2탄 세이브)
// - 기기 옮기기: 옛 기기에서 8자리 코드(10분·1회용) → 새 기기에서 입력하면 세이브·랭킹 닉네임·안 받은 선물이 넘어옴
const CLOUD = { from: '', t: 0, p: /** @type {Promise<boolean>|null} */ (null), last: '', has: /** @type {boolean|null} */ (null), timer: 0 };
const CLOUD_LOADED_FLAG = 'heesu_bori_cloud_loaded';

function cloudPayload() {
  const data = G.pd || loadGame(); let ep2 = null;
  try { const s = localStorage.getItem(E2KEY); if (s) ep2 = JSON.parse(s); } catch (e) { }
  return { data, ep2 };
}
async function cloudPushNow() {
  if (FORCE_EASY) return false;
  const { data, ep2 } = cloudPayload(); if (!data && !ep2) return false;
  const body = JSON.stringify({ data, ep2 }); if (body === CLOUD.last) return true; // 바뀐 게 없으면 안 보냄
  await sbInit();
  if (CLOUD.has === null) { const r = await SB.from('hb_saves').select('user_id').eq('user_id', PV.uid).maybeSingle(); if (r.error) throw r.error; CLOUD.has = !!r.data; }
  const r = CLOUD.has ? await SB.from('hb_saves').update({ data, ep2, updated_at: new Date().toISOString() }).eq('user_id', PV.uid)
    : await SB.from('hb_saves').insert({ data, ep2 });
  if (r.error) { CLOUD.has = null; throw r.error; }
  CLOUD.has = true; CLOUD.last = body; return true;
}
/** 백업 (1분에 한 번으로 제한, force 면 바로) */
function cloudSync(force) {
  if (FORCE_EASY) return Promise.resolve(false);
  if (!force && Date.now() - CLOUD.t < 60000) { if (!CLOUD.timer) CLOUD.timer = setTimeout(() => { CLOUD.timer = 0; cloudSync(); }, 60000 - (Date.now() - CLOUD.t)); return CLOUD.p || Promise.resolve(false); }
  CLOUD.t = Date.now(); CLOUD.p = cloudPushNow().catch(() => false).finally(() => { CLOUD.p = null; }); return CLOUD.p;
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') cloudSync(true); });

// ---------- 기기 옮기기 화면 ----------
let cloudCodeT = 0;
function cloudOpen(from) {
  if (FORCE_EASY) return;
  CLOUD.from = from; const has = !!loadGame();
  $('#cloudMk').disabled = !has; $('#cloudMkMsg').textContent = has ? '지금 이 기기의 희수를 다른 기기로 보내요' : '이 기기에는 아직 모험 기록이 없어요';
  $('#cloudCode').hidden = true; $('#cloudIn').value = ''; $('#cloudUseMsg').textContent = '';
  $('#cloud').hidden = false;
}
function cloudClose() { $('#cloud').hidden = true; clearInterval(cloudCodeT); if (CLOUD.from === 'entry' && !PV.me && PV.notReg) pvpNickBox(true); }
async function cloudMakeCode() {
  const b = $('#cloudMk'); b.disabled = true; $('#cloudMkMsg').textContent = '서버에 백업하는 중...';
  try {
    if (!(await cloudSync(true))) throw new Error('백업 실패');
    const { data, error } = await SB.rpc('hb_make_transfer_code'); if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data, end = new Date(row.expires_at).getTime();
    $('#cloudCodeV').textContent = row.code.slice(0, 4) + ' ' + row.code.slice(4); $('#cloudCode').hidden = false;
    $('#cloudMkMsg').textContent = '새 기기에서 「기기 옮기기 → 코드로 불러오기」에 입력하세요. 옮기고 나면 이 기기의 희수는 랭킹에서 빠져요.';
    clearInterval(cloudCodeT); const tick = () => { const s = Math.max(0, Math.round((end - Date.now()) / 1000)); $('#cloudCodeT').textContent = s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} 남음` : '만료됐어요. 다시 만들어 주세요'; if (!s) clearInterval(cloudCodeT); };
    tick(); cloudCodeT = setInterval(tick, 1000);
  } catch (e) { $('#cloudMkMsg').textContent = '코드를 만들지 못했어요: ' + pvErr(e); }
  b.disabled = false;
}
async function cloudUseCode() {
  const code = $('#cloudIn').value.replace(/[\s-]/g, '').toUpperCase(), msg = $('#cloudUseMsg');
  if (!/^[A-Z0-9]{8}$/.test(code)) { msg.textContent = '8자리 코드를 입력해 주세요'; return; }
  const here = loadGame();
  const go = async () => {
    msg.textContent = '불러오는 중...';
    try {
      await sbInit(); const { data, error } = await SB.rpc('hb_use_transfer_code', { p_code: code }); if (error) throw error;
      if (!data || !data.ok) { msg.textContent = data && data.reason === 'same' ? '같은 기기에서 만든 코드예요' : '코드가 틀렸거나 만료됐어요'; return; }
      try {
        if (data.data) localStorage.setItem(SAVEKEY, JSON.stringify(data.data));
        if (data.ep2) localStorage.setItem(E2KEY, JSON.stringify(data.ep2));
        if (data.nickname) localStorage.setItem('heesu_bori_pvp_reg', '1');
        sessionStorage.setItem(CLOUD_LOADED_FLAG, data.nickname || '1');
      } catch (e) { }
      location.reload();
    } catch (e) { msg.textContent = /too many/.test(String(e && e.message)) ? '너무 많이 틀렸어요. 10분 뒤에 다시 해주세요' : '불러오지 못했어요: ' + pvErr(e); }
  };
  if (here) confirmBox(`이 기기의 지금 기록(Lv.${here.lv}${here.cleared ? ' · ' + (here.cleared + 1) + '회차' : ''})은 지워지고\n코드의 희수로 바뀌어요. 계속할까요?`, go); else go();
}
function cloudBoot() {
  if (FORCE_EASY) return;
  let nick = null; try { nick = sessionStorage.getItem(CLOUD_LOADED_FLAG); sessionStorage.removeItem(CLOUD_LOADED_FLAG); } catch (e) { }
  if (nick) setTimeout(() => toast(nick === '1' ? '다른 기기의 희수를 불러왔어요!' : `${nick} 희수를 불러왔어요! 어서 와요`, 'lvl'), 300);
  $('#pvpNickCloud').onclick = () => { $('#pvpNick').hidden = true; cloudOpen('entry'); };
  $('#cloudMk').onclick = cloudMakeCode; $('#cloudUse').onclick = cloudUseCode; $('#cloudX').onclick = cloudClose;
  $('#cloudIn').onkeydown = e => { if (e.key === 'Enter') cloudUseCode(); };
}
