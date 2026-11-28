// ===================== 온라인 광장 (Supabase Realtime: Presence + Broadcast) =====================
// 비공개 채널 'plaza-1': 서버 정책(hb_plaza_ok)이 랭킹에 등록된·숨김/차단 아닌 희수만 들여보냄.
// 접속 표시(Presence) = 닉네임·꾸미기·칭호·처음 위치 / 이동(Broadcast 'mv', 움직일 때 초당 약 3번) / 채팅(Broadcast 'chat')



import { $, VH, VW, ctx } from '../sys/dom.js';
import { clamp, rand } from '../core/util.js';
import { playBgm } from '../sys/audio.js';
import { buildWorld } from '../draw/world.js';
import { G } from '../core/state.js';
import { loadGame } from '../core/save.js';
import { calcStats } from '../core/items.js';
import { newBori, newPlayer } from '../play/player.js';
import { JOBS } from '../core/job.js';
import { jobTag } from '../features/job.js';
import { FONT, W2S, achNameTag, roundRect, txt } from '../draw/render.js';
import { banner, fadeTo, toast } from '../ui/dialog.js';
import { showHUD } from '../ui/hud.js';
import { confirmBox } from '../ui/menu.js';
import { showTitle } from '../ui/lobby.js';
import { PV, SB, drawRival, esc, pvErr, pvpLoadMe, pvpSnap, sbInit } from './pvp.js';
import { achTag } from '../features/achv.js';
import { tt } from '../sys/i18n.js';

const PLAZA_CAP = 30, PLAZA_MAX_CH = 20, PLAZA_SEND = 0.33, PLAZA_CHAT_MAX = 60, PLAZA_CHAT_GAP = 1.2, PLAZA_BUBBLE = 6, PLAZA_LOG = 60;
const PZ = { busy: false, block: /** @type {Record<string, string>} */ ({}) };

// ---------- 욕설 필터 (글자 사이에 띄어쓰기·숫자·기호를 넣어도 걸림) ----------
const PLAZA_BAD = ['씨발', '시발', '씨팔', '시팔', 'ㅅㅂ', 'ㅆㅂ', '병신', 'ㅂㅅ', '븅신', '좆', '존나', '졸라', 'ㅈㄴ', '개새끼', '개새', '새끼', '지랄', 'ㅈㄹ', '미친놈', '미친년', '엠창', '느금', '니애미', '니미', '애미', '애비', '닥쳐', '꺼져', '등신', '찐따', 'fuck', 'shit', 'bitch']; // i18n-keep (욕설 필터 단어 — 화면 문구 아님)
const PLAZA_BAD_RE = new RegExp(PLAZA_BAD.map(w => [...w].map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\d._\\-*~!@#^]*')).join('|'), 'gi');
const plazaClean = s => String(s || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, PLAZA_CHAT_MAX).replace(PLAZA_BAD_RE, m => '♡'.repeat(Math.min(4, [...m].length)));

function plazaBlockLoad() { try { PZ.block = JSON.parse(localStorage.getItem('hb_plaza_block') || '{}') || {}; } catch (e) { PZ.block = {}; } }
function plazaBlockSave() { try { localStorage.setItem('hb_plaza_block', JSON.stringify(PZ.block)); } catch (e) { } }

/** 내 희수 모습(다른 사람에게 보이는 정보) */
function plazaMeta() {
  const { snap } = pvpSnap(), P = G.P;
  return { u: PV.uid, n: (PV.me && PV.me.nickname) || tt('net/plaza.1'), lv: G.pd.lv, aw: G.pd.aw || 0, ttl: snap.ttl || null, job: snap.job || null, vis: snap.vis || snap.eq, hair: snap.hair || null, b: !!G.pd.boriJoined, x: Math.round(P.x), y: Math.round(P.y) };
}

// ---------- 들어가기 · 나가기 ----------
export async function plazaOpen() {
  if (FORCE_EASY || PZ.busy) return; const saved = loadGame(); if (!saved) { toast(tt('net/plaza.2'), 'warn'); return; }
  PZ.busy = true; toast(tt('net/plaza.3'), 'sub');
  try {
    await sbInit(); if (!PV.me) await pvpLoadMe();
    if (!PV.me) { toast(tt('net/plaza.4'), 'warn'); return; }
    if (PV.me.hidden) { toast(tt('net/plaza.5'), 'warn'); return; }
    try { const { data } = await SB.rpc('hb_plaza_status'); if (data && data.banned) { toast(data.until ? tt('net/plaza.6', { v1: new Date(data.until).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }) : tt('net/plaza.7'), 'warn'); return; } } catch (e) { }
    plazaBlockLoad(); fadeTo(() => startPlaza(saved), tt('net/plaza.8'));
  } catch (e) { toast(tt('net/plaza.9') + pvErr(e), 'warn'); }
  finally { setTimeout(() => { PZ.busy = false; }, 800); }
}
function startPlaza(saved) {
  G.pd = loadGame() || saved; G.pvp = null; G.inf = null; G.raid = null; G.tower = null; G.auto = false;
  G.zone = 0; G.world = buildWorld(0); const W = G.world;
  G.enemies = []; G.projs = []; G.fx = []; G.drops = []; G.parts = []; G.texts = []; G.bubbles = [];
  G.zoneKills = 0; G.bossSpawned = true; G.bossDefeated = false; G.exitOpen = false; G.spawnT = 99; G.ult = null; G.pendingEvent = null; G.boss = null;
  G.P = null; calcStats(); const sx = W.start.x + rand(-60, 60), sy = W.start.y - rand(40, 160);
  G.P = newPlayer(sx, sy); G.P.fy = -1; G.P.dir = 'up';
  G.bori = G.pd.boriJoined ? newBori(sx + 14, sy + 3) : null; G.buddy = null;
  G.cam.x = clamp(G.P.x - VW / 2, 0, Math.max(0, W.W - VW)); G.cam.y = clamp(G.P.y - 60 - VH / 2, 0, Math.max(0, W.H - VH));
  G.plaza = { others: /** @type {Record<string, any>} */ ({}), log: [], sendT: 0, last: null, chatT: 0, lastTxt: '', rep: 0, me: null, ok: false, ch: null, no: 1 };
  $('#title').hidden = true; G.state = 'play'; showHUD(true); document.body.classList.add('inPlaza'); $('#plazaUI').hidden = false; $('#plazaLog').innerHTML = ''; $('#plazaIn').value = '';
  playBgm('home'); banner(tt('net/plaza.8'), tt('net/plaza.10'), 'lvl');
  plazaSys(tt('net/plaza.11'));
  plazaJoin(1);
}
/** n번 광장에 들어감. 처음 받은 접속자 수가 PLAZA_CAP 이상이면 다음 번호 광장으로 (자동 분리) */
function plazaJoin(no) {
  const Z = G.plaza; if (!Z) return; Z.no = no; Z.ok = false; Z.others = {}; Z.first = true;
  const ch = SB.channel('plaza-' + no, { config: { private: true, presence: { key: PV.uid }, broadcast: { self: false } } });
  Z.ch = ch;
  const enter = async () => {
    if (!G.plaza || G.plaza.ch !== ch || !Z.first) return; Z.first = false;
    const n = Object.keys(ch.presenceState()).filter(k => k !== PV.uid).length;
    if (n >= PLAZA_CAP && no < PLAZA_MAX_CH) { try { SB.removeChannel(ch); } catch (e) { } plazaJoin(no + 1); return; }
    Z.ok = true; try { await ch.track(plazaMeta()); } catch (e) { } plazaPeopleBtn(); if (no > 1) plazaSys(tt('net/plaza.12', { no }));
  };
  ch.on('presence', { event: 'sync' }, () => { if (Z.first && G.plaza && G.plaza.ch === ch) { enter(); return; } plazaSync(); })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => { const m = newPresences && newPresences[0]; if (m && key !== PV.uid && G.plaza && G.plaza.ok) plazaSys(tt('net/plaza.13', { n: m.n })); })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => { const m = leftPresences && leftPresences[0]; if (m && key !== PV.uid && G.plaza) plazaSys(tt('net/plaza.14', { n: m.n })); })
    .on('broadcast', { event: 'mv' }, ({ payload }) => plazaMove(payload))
    .on('broadcast', { event: 'chat' }, ({ payload }) => plazaRecv(payload))
    .subscribe(async (status) => {
      if (!G.plaza || G.plaza.ch !== ch) return;
      if (status === 'SUBSCRIBED') setTimeout(enter, 1200); // 접속자 목록(sync)이 안 오면 그냥 들어감
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { G.plaza.ok = false; plazaSys(tt('net/plaza.15')); }
    });
}
export function plazaLeave(silent) {
  const Z = G.plaza; if (!Z) return; G.plaza = null;
  try { if (Z.ch) { Z.ch.untrack().catch(() => { }); SB.removeChannel(Z.ch); } } catch (e) { }
  document.body.classList.remove('inPlaza'); $('#plazaUI').hidden = true; $('#plazaList').hidden = true;
  if (!silent) showTitle();
}

// ---------- 동기화 ----------
function plazaSync() {
  const Z = G.plaza; if (!Z || !Z.ch) return; const st = Z.ch.presenceState(), seen = {};
  for (const key in st) {
    if (key === PV.uid) continue; const m = st[key][st[key].length - 1]; if (!m) continue; seen[key] = 1;
    let o = Z.others[key];
    if (!o) { o = Z.others[key] = { u: key, x: m.x, y: m.y, tx: m.x, ty: m.y, ang: Math.PI / 2, mv: 0, t: Math.random() * 5, spawnT: 0, flash: 0, stun: 0, dead: false, cast: null, chat: null, chatT: 0 }; }
    o.nick = String(m.n || tt('net/plaza.1')).slice(0, 12); o.lv = m.lv; o.aw = m.aw; o.snap = { vis: m.vis, eq: m.vis, hair: m.hair, ttl: m.ttl, job: JOBS[m.job] ? m.job : null };
  }
  for (const key in Z.others) if (!seen[key]) delete Z.others[key];
  plazaPeopleBtn(); if (!$('#plazaList').hidden) plazaListRender();
}
function plazaMove(p) {
  const Z = G.plaza; if (!Z || !p || !p.u) return; const o = Z.others[p.u]; if (!o) return;
  o.tx = clamp(+p.x || 0, 0, G.world.W); o.ty = clamp(+p.y || 0, 0, G.world.H); if (typeof p.a === 'number') o.ang = p.a;
}
export function plazaUpdate(dt) {
  const Z = G.plaza; if (!Z || !G.P) return;
  // 내 위치 보내기: 움직였을 때만 초당 약 3번
  Z.sendT -= dt; const P = G.P, cur = { x: Math.round(P.x), y: Math.round(P.y) };
  if (Z.ok && Z.sendT <= 0 && (!Z.last || Math.abs(cur.x - Z.last.x) + Math.abs(cur.y - Z.last.y) >= 2)) {
    Z.sendT = PLAZA_SEND; Z.last = cur; const a = Math.atan2(P.fy || 0, P.fx || 0);
    Z.ch.send({ type: 'broadcast', event: 'mv', payload: { u: PV.uid, x: cur.x, y: cur.y, a } }).catch(() => { });
  }
  if (Z.ok && (Z.trackT = (Z.trackT || 0) - dt) <= 0) { Z.trackT = 20; Z.ch.track(plazaMeta()).catch(() => { }); } // 새로 들어온 사람이 처음 위치를 보게
  for (const k in Z.others) {
    const o = Z.others[k], dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy);
    if (d > 300) { o.x = o.tx; o.y = o.ty; o.mv = 0; }
    else if (d > 0.5) { const k2 = Math.min(1, dt * 7); o.x += dx * k2; o.y += dy * k2; o.mv = d * 7; o.ang = Math.atan2(dy, dx); }
    else o.mv = 0;
    o.t += dt; if (o.chat && (o.chatT -= dt) <= 0) o.chat = null;
  }
  if (Z.me && (Z.meT -= dt) <= 0) Z.me = null;
  Z.chatT -= dt;
}
const plazaList = () => G.plaza ? Object.values(G.plaza.others).filter(o => !PZ.block[o.u]) : [];

// ---------- 채팅 ----------
function plazaSend() {
  const Z = G.plaza, inp = /** @type {HTMLInputElement} */ ($('#plazaIn')); if (!Z) return;
  const t = plazaClean(inp.value); if (!t) return;
  if (!Z.ok) { plazaSys(tt('net/plaza.16')); return; }
  if (Z.chatT > 0) { plazaSys(tt('net/plaza.17')); return; }
  if (t === Z.lastTxt && ++Z.rep >= 2) { plazaSys(tt('net/plaza.18')); return; }
  if (t !== Z.lastTxt) Z.rep = 0;
  Z.lastTxt = t; Z.chatT = PLAZA_CHAT_GAP; inp.value = '';
  Z.ch.send({ type: 'broadcast', event: 'chat', payload: { u: PV.uid, n: (PV.me && PV.me.nickname) || tt('net/plaza.1'), t } }).catch(() => { });
  Z.me = t; Z.meT = PLAZA_BUBBLE; plazaAddLog((PV.me && PV.me.nickname) || tt('net/plaza.19'), t, true);
}
function plazaRecv(p) {
  const Z = G.plaza; if (!Z || !p || !p.u || PZ.block[p.u]) return; const t = plazaClean(p.t); if (!t) return;
  const o = Z.others[p.u], nick = o ? o.nick : String(p.n || tt('net/plaza.1')).slice(0, 12);
  if (o) { o.chat = t; o.chatT = PLAZA_BUBBLE; }
  plazaAddLog(nick, t, false, p.u);
}
function plazaAddLog(nick, t, mine, u) {
  const Z = G.plaza; if (!Z) return; Z.log.push({ nick, t, mine, u, at: Date.now() }); if (Z.log.length > PLAZA_LOG) Z.log.shift();
  const el = $('#plazaLog'), row = document.createElement('div'); row.className = 'pzl' + (mine ? ' me' : '');
  row.innerHTML = `<b>${esc(nick)}</b> ${esc(t)}`; el.appendChild(row); while (el.children.length > 30) el.removeChild(el.firstChild); el.scrollTop = el.scrollHeight;
}
function plazaSys(t) { const el = $('#plazaLog'); if (!el) return; const row = document.createElement('div'); row.className = 'pzl sys'; row.textContent = t; el.appendChild(row); while (el.children.length > 30) el.removeChild(el.firstChild); el.scrollTop = el.scrollHeight; }

// ---------- 접속자 목록 · 차단 · 신고 ----------
function plazaPeopleBtn() { const n = G.plaza ? Object.keys(G.plaza.others).length + 1 : 0; $('#plazaPeople').textContent = tt('net/plaza.20', { n }); }
function plazaListRender() {
  const Z = G.plaza; if (!Z) return; const L = Object.values(Z.others);
  $('#plazaListBody').innerHTML = (L.length ? L.map(o => `<div class="pzrow"><div><b>${esc(o.nick)}</b><small>Lv.${o.lv || 1}${o.aw ? '★' + o.aw : ''} ${o.snap && o.snap.ttl ? achTag(o.snap.ttl) : ''}${o.snap ? jobTag(o.snap.job) : ''}</small></div>`
    + tt('net/plaza.32', { v1: esc(o.u), v2: PZ.block[o.u] ? tt('net/plaza.21') : tt('net/plaza.22') })).join('')
    : tt('net/plaza.23'))
    + tt('net/plaza.24');
}
async function plazaAct(a, u) {
  const Z = G.plaza; if (!Z) return; const o = Z.others[u]; const nick = o ? o.nick : tt('net/plaza.1');
  if (a === 'blk') { if (PZ.block[u]) delete PZ.block[u]; else PZ.block[u] = nick; plazaBlockSave(); toast(PZ.block[u] ? tt('net/plaza.25', { nick }) : tt('net/plaza.26', { nick }), 'sub'); plazaListRender(); return; }
  if (a === 'rep') {
    const msgs = Z.log.filter(l => l.u === u).slice(-10).map(l => l.t).join('\n');
    confirmBox(tt('net/plaza.33', { nick, v1: Z.log.filter(l => l.u === u).length ? '' : tt('net/plaza.27') }), async () => {
      try { const { data, error } = await SB.rpc('hb_plaza_report', { p_target: u, p_nick: nick, p_msgs: msgs }); if (error) throw error; toast(data ? tt('net/plaza.28') : tt('net/plaza.29'), data ? 'sub' : 'warn'); }
      catch (e) { toast(tt('net/plaza.30') + pvErr(e), 'warn'); }
    });
  }
}

// ---------- 그리기 (render.js 에서 호출) ----------
export function plazaDrawLayer(L) { for (const o of plazaList()) L.push({ y: o.y, f: () => drawRival(o) }); }
function plazaWrap(s, n) { const a = [...s], out = []; for (let i = 0; i < a.length && out.length < 3; i += n) out.push(a.slice(i, i + n).join('')); if (a.length > n * 3) out[2] = out[2].slice(0, n - 1) + '…'; return out; }
function plazaBubble(t, x, y, size) {
  const lines = plazaWrap(t, 12); ctx.font = `bold ${Math.round(size)}px ${FONT}`;
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + size * 1.1, lh = size * 1.25, h = lines.length * lh + size * 0.55, bx = x - w / 2, by = y - h;
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#2b1b24'; ctx.lineWidth = Math.max(2, size * 0.16); roundRect(bx, by, w, h, size * 0.45); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2b1b24'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; lines.forEach((l, i) => ctx.fillText(l, x, by + size * 0.3 + lh * (i + 0.5)));
}
export function plazaOverlay(U) {
  const Z = G.plaza; if (!Z) return;
  for (const o of plazaList()) {
    const [x, y] = W2S(o.x, o.y - 30); txt(o.nick, x, y, U * 4.2, '#ffffff', '#2b1b24'); achNameTag(o.snap, x, y - U * 0.8, U);
    if (o.chat) plazaBubble(o.chat, x, y - U * (o.snap && o.snap.ttl ? 9 : 5.5), U * 4.6);
  }
  if (Z.me && G.P) { const [x, y] = W2S(G.P.x, G.P.y - 30); plazaBubble(Z.me, x, y - U * 3, U * 4.6); }
}

export function plazaBoot() {
  if (FORCE_EASY) return;
  $('#plazaSend').onclick = () => { plazaSend(); };
  $('#plazaIn').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); plazaSend(); } });
  $('#plazaExit').onclick = () => { fadeTo(() => plazaLeave(false), tt('net/plaza.31')); };
  $('#plazaPeople').onclick = () => { plazaListRender(); $('#plazaList').hidden = false; };
  $('#plazaListX').onclick = () => { $('#plazaList').hidden = true; };
  $('#plazaList').addEventListener('click', e => { const b = /** @type {HTMLElement} */ (e.target).closest('[data-pz]'); if (b) plazaAct(b.getAttribute('data-pz'), b.getAttribute('data-u')); });
  window.addEventListener('pagehide', () => { if (G.plaza) plazaLeave(true); });
  // PC: Enter 로 채팅 입력, Esc 로 빠져나오기
  window.addEventListener('keydown', e => {
    if (!G.plaza || G.state !== 'play') return; const inp = /** @type {HTMLInputElement} */ ($('#plazaIn'));
    if (e.key === 'Enter' && document.activeElement !== inp) { e.preventDefault(); inp.focus(); }
    else if (e.key === 'Escape' && document.activeElement === inp) { inp.blur(); }
  });
}
