// ===================== 계정 연결 (익명 → 구글·카카오 로그인) =====================
// - 지금 희수(익명 계정)에 구글/카카오를 「연결」하면 같은 계정 그대로 → 세이브·랭킹·선물 모두 유지
// - 다른 기기에서 「로그인해서 불러오기」→ 같은 계정으로 로그인 → 서버 세이브를 이 기기에 씀
// - 로그인한 계정은 시작할 때 서버 세이브가 더 최근이면 자동으로 받아옴 (여러 기기 번갈아 하기)
// Supabase 대시보드: Auth → Providers 에서 Google/Kakao 켜기 + "Allow manual linking" 켜기 + Redirect URL 에 게임 주소
const ACC_KEY = 'hb_acc_pending', ACC_PREV = 'hb_acc_prev', ACC_LOADED = 'hb_acc_loaded';
const ACC_NAME = { google: '구글', kakao: '카카오' };
const ACC = { prov: /** @type {string[]|null} */ (null), linked: /** @type {string|null} */ (null), email: '', busy: false, need: false };
const accRedirect = () => location.href.split(/[?#]/)[0];

/** 서버에서 켜진 로그인 방법 (공개 설정) */
async function accFetchProv() {
  const r = await fetch(SB_URL + '/auth/v1/settings', { headers: { apikey: SB_KEY } }); if (!r.ok) return [];
  const j = await r.json(), ex = (j && j.external) || {}; return Object.keys(ACC_NAME).filter(k => ex[k]);
}
/** 지금 계정에 연결된 로그인 (없으면 null) */
async function accState() {
  await sbInit(); const { data } = await SB.auth.getUser(); const u = data && data.user;
  const id = u && (u.identities || []).find(i => ACC_NAME[i.provider]);
  ACC.linked = id ? id.provider : null; ACC.email = (u && u.email) || (id && id.identity_data && id.identity_data.email) || '';
  return ACC.linked;
}
function accMsg(t) { const m = $('#accMsg'); if (m) m.textContent = t; const g = $('#agErr'); if (g && !$('#accGate').hidden) g.textContent = t; }
async function accRender() {
  const box = $('#accBtns'); if (!box) return; box.innerHTML = ''; accMsg('확인하는 중...');
  try {
    if (!ACC.prov) ACC.prov = await accFetchProv().catch(() => []);
    await accState();
  } catch (e) { accMsg('서버에 연결할 수 없어요 (인터넷 확인)'); return; }
  const P = ACC.prov || [];
  if (!P.length) { accMsg('구글·카카오 로그인은 곧 열려요. 지금은 아래 옮기기 코드를 써주세요'); return; }
  const btn = (op, p, t) => `<button class="btn ${op === 'link' ? 'pk' : 'wh'} acc-${p}" data-acc="${op}:${p}">${t}</button>`;
  if (ACC.linked) {
    accMsg(`${ACC_NAME[ACC.linked]} 계정과 연결돼 있어요${ACC.email ? ` (${ACC.email})` : ''}. 다른 기기에서 같은 계정으로 로그인하면 이어서 할 수 있어요.`);
    box.innerHTML = `<small>다른 계정의 희수로 바꾸기</small>` + P.map(p => btn('login', p, `${ACC_NAME[p]}로 로그인`)).join('');
  } else {
    accMsg('지금 희수를 구글·카카오 계정에 연결해 두면 기기를 바꾸거나 브라우저 기록을 지워도 로그인으로 이어서 할 수 있어요.');
    box.innerHTML = P.map(p => btn('link', p, `${ACC_NAME[p]} 계정 연결`)).join('') + `<small>다른 기기에서 연결해 둔 희수가 있다면</small>` + P.map(p => btn('login', p, `${ACC_NAME[p]}로 로그인해서 불러오기`)).join('');
  }
  box.querySelectorAll('[data-acc]').forEach(b => { /** @type {HTMLElement} */ (b).onclick = () => { const [op, p] = String(/** @type {HTMLElement} */ (b).dataset.acc).split(':'); op === 'link' ? accLink(p) : accLogin(p); }; });
}
function accErr(e) {
  const m = String((e && (e.message || e.msg)) || e);
  if (/manual linking/i.test(m)) return '서버에서 계정 연결이 아직 꺼져 있어요';
  if (/already/i.test(m)) return '이 계정은 이미 다른 희수에 연결돼 있어요. 「로그인해서 불러오기」를 써주세요';
  if (/provider is not enabled|unsupported provider/i.test(m)) return '이 로그인 방법은 아직 준비 중이에요';
  return pvErr(e);
}
/** 지금 희수(익명 계정)에 로그인 연결 → 로그인 화면으로 갔다가 돌아옴 */
async function accLink(p) {
  if (ACC.busy) return; ACC.busy = true; accMsg('연결하는 중...');
  try {
    await cloudSync(true); // 돌아왔을 때 서버에 최신 세이브가 있게
    localStorage.setItem(ACC_KEY, JSON.stringify({ op: 'link', p }));
    const { error } = await SB.auth.linkIdentity({ provider: p, options: { redirectTo: accRedirect() } }); if (error) throw error;
  } catch (e) { localStorage.removeItem(ACC_KEY); accMsg('연결하지 못했어요: ' + accErr(e)); ACC.busy = false; }
}
/** 다른 기기에서 연결해 둔 계정으로 로그인 → 그 희수를 이 기기로 */
function accLogin(p) {
  const here = loadGame();
  const go = async () => {
    if (ACC.busy) return; ACC.busy = true; accMsg('로그인 화면으로 가는 중...');
    try {
      await sbInit(); const { data: { session } } = await SB.auth.getSession();
      if (session) localStorage.setItem(ACC_PREV, JSON.stringify({ a: session.access_token, r: session.refresh_token })); // 계정에 희수가 없으면 되돌아오려고
      localStorage.setItem(ACC_KEY, JSON.stringify({ op: 'login', p }));
      const { error } = await SB.auth.signInWithOAuth({ provider: p, options: { redirectTo: accRedirect() } }); if (error) throw error;
    } catch (e) { localStorage.removeItem(ACC_KEY); accMsg('로그인하지 못했어요: ' + accErr(e)); ACC.busy = false; }
  };
  if (here && !ACC.linked) confirmBox(`이 기기의 지금 기록(Lv.${here.lv}${here.cleared ? ' · ' + (here.cleared + 1) + '회차' : ''})은 지워지고\n로그인한 계정의 희수로 바뀌어요. 계속할까요?\n(지금 희수를 지키려면 먼저 「계정 연결」을 해주세요)`, go); else go();
}
/** 서버 세이브를 이 기기에 쓰고 새로고침 */
function accApply(row, nick, why) {
  try {
    if (row.data) localStorage.setItem(SAVEKEY, JSON.stringify(row.data));
    if (row.ep2) localStorage.setItem(E2KEY, JSON.stringify(row.ep2));
    if (nick) localStorage.setItem('heesu_bori_pvp_reg', '1');
    sessionStorage.setItem(ACC_LOADED, why);
  } catch (e) { }
  location.replace(accRedirect());
}
// ---------- 계정 연결 필수 (11/24): 로비에 들어온 희수가 구글·카카오에 연결 안 돼 있으면 닫을 수 없는 창 ----------
// 서버에 못 붙거나(오프라인·차단) 켜진 로그인 방법이 없으면 막지 않음. 원터치판(FORCE_EASY)은 서버 기능이 없어서 제외.
async function accGate() {
  if (FORCE_EASY) return false;
  try {
    if (!ACC.prov) ACC.prov = await accFetchProv();
    if (!ACC.prov.length || await accState()) { ACC.need = false; $('#accGate').hidden = true; return false; }
  } catch (e) { return false; }
  ACC.need = true; accGateShow(); return true;
}
function accGateShow() {
  if (!ACC.need || ACC.linked || G.state !== 'title' || $('#title').hidden) return;
  const P = ACC.prov || [], here = loadGame();
  const btn = (op, p, t) => `<button class="btn ${op === 'link' ? 'pk' : 'wh'} acc-${p}" data-acc="${op}:${p}">${t}</button>`;
  $('#agMsg').innerHTML = here
    ? `지금 희수(Lv.${here.lv})의 기록을 지키려면 <b>구글이나 카카오 계정을 연결</b>해 주세요.<br>연결하면 기기를 바꾸거나 브라우저 기록을 지워도 로그인만 하면 이어서 할 수 있어요.`
    : `희수와 보리의 모험을 시작하려면 <b>구글이나 카카오 계정을 연결</b>해 주세요.<br>기록이 계정에 저장돼서 어느 기기에서든 이어서 할 수 있어요.`;
  $('#agBtns').innerHTML = `<div class="agsec"><span class="lb">${here ? '지금 희수 연결' : '새로 시작'}</span>${P.map(p => btn('link', p, `${ACC_NAME[p]} 계정으로 ${here ? '연결' : '시작'}`)).join('')}</div>`
    + `<div class="agsec sub"><span class="lb">다른 기기에서 연결해 둔 희수가 있다면</span>${P.map(p => btn('login', p, `${ACC_NAME[p]}로 로그인해서 불러오기`)).join('')}</div>`;
  $('#agBtns').querySelectorAll('[data-acc]').forEach(b => { /** @type {HTMLElement} */ (b).onclick = () => { audioInit(); const [op, p] = String(/** @type {HTMLElement} */ (b).dataset.acc).split(':'); op === 'link' ? accLink(p) : accLogin(p); }; });
  $('#agErr').textContent = ''; $('#accGate').hidden = false;
}
const accUrlErr = () => { const s = new URLSearchParams(location.hash.slice(1) + '&' + location.search.slice(1)); return s.get('error_description') || s.get('error') || ''; };
async function accBoot() {
  if (FORCE_EASY) return;
  let done = null; try { done = sessionStorage.getItem(ACC_LOADED); sessionStorage.removeItem(ACC_LOADED); } catch (e) { }
  if (done) setTimeout(() => toast(done === 'sync' ? '다른 기기에서 한 기록을 불러왔어요' : '로그인한 계정의 희수를 불러왔어요! 어서 와요', 'lvl'), 300);
  let pend = null; try { pend = JSON.parse(localStorage.getItem(ACC_KEY) || 'null'); } catch (e) { }
  if (pend) {
    localStorage.removeItem(ACC_KEY); const uerr = accUrlErr();
    try {
      await sbInit(); history.replaceState(null, '', accRedirect());
      if (uerr) { toast((pend.op === 'link' ? '연결하지 못했어요: ' : '로그인하지 못했어요: ') + accErr(uerr), 'warn'); accGate(); return; }
      const linked = await accState();
      if (pend.op === 'link') { toast(linked ? `${ACC_NAME[linked]} 계정 연결 완료! 이제 다른 기기에서도 로그인으로 이어서 해요` : '연결이 취소됐어요', linked ? 'lvl' : 'sub'); if (linked) cloudSync(true); else accGate(); return; }
      // 로그인해서 불러오기
      const prev = JSON.parse(localStorage.getItem(ACC_PREV) || 'null'); localStorage.removeItem(ACC_PREV);
      const r = await SB.from('hb_saves').select('data,ep2,updated_at').eq('user_id', PV.uid).maybeSingle();
      if (linked && r.data && r.data.data) { const f = await SB.from('hb_fighters').select('nickname').eq('user_id', PV.uid).maybeSingle(); CLOUD.has = true; accApply(r.data, f.data && f.data.nickname, 'login'); return; }
      // 이 계정엔 희수가 없음: 방금 생긴 빈 계정은 지우고(나중에 연결할 수 있게) 원래 계정으로 돌아감
      await SB.rpc('hb_acc_release').catch(() => null);
      if (prev) await SB.auth.setSession({ access_token: prev.a, refresh_token: prev.r }); else await SB.auth.signOut();
      SBP = null; await sbInit();
      toast('이 계정에 연결된 희수가 없어요. 먼저 원래 기기에서 「계정 연결」을 해주세요', 'warn'); accGate();
    } catch (e) { toast('로그인 처리 중 문제가 생겼어요: ' + accErr(e), 'warn'); accGate(); }
    return;
  }
  // 로그인한 계정: 서버 세이브가 이 기기보다 최근이면 받아옴 (타이틀에서만)
  try {
    const here = loadGame();
    if (await accGate()) return; // 연결 안 됨 → 연결 창 (연결하고 돌아오면 그때 검사 업로드)
    if (!here) return;
    if (ACC.linked) {
      const r = await SB.from('hb_saves').select('data,ep2,updated_at').eq('user_id', PV.uid).maybeSingle();
      const d = r.data && r.data.data;
      if (d && (d.svT || 0) > (here.svT || 0) + 5000 && G.state === 'title') { accApply(r.data, null, 'sync'); return; }
    }
    cloudSync(true); // 시작할 때 서버 검사 한 번 (기기에서 고친 값이면 여기서 되돌아감)
  } catch (e) { }
}
