// ===================== 희수 PvP (Supabase 익명 로그인 + 비동기 봇 대전) =====================



import { $, VH, VW } from '../sys/dom.js';
import { choice, clamp, rand } from '../core/util.js';
import { drawSpr, mkCanvas } from '../draw/sprite.js';
import { playBgm, sfx } from '../sys/audio.js';
import { INP } from '../sys/input.js';
import { ITEMS, defOf } from '../core/data.js';
import { curZone } from '../core/chapter.js';
import { buildWorld } from '../draw/world.js';
import { G } from '../core/state.js';
import { loadGame, newPD, saveGame, sk } from '../core/save.js';
import { calcStats, visEq, visEqRaw } from '../core/items.js';
import { addText, bubble, burst, dirOf, hurtPlayer, moveToward, newPlayer, word } from '../play/player.js';
import { AI, shootAt } from '../play/enemies.js';
import { playerDie, startZone } from '../play/zone.js';
import { jobOf } from '../core/job.js';
import { jobTag } from '../features/job.js';
import { enhAura, fr, heeSet, shadow } from '../draw/render.js';
import { banner, fadeTo, toast } from '../ui/dialog.js';
import { showHUD } from '../ui/hud.js';
import { confirmBox } from '../ui/menu.js';
import { showTitle } from '../ui/lobby.js';
import { RK, rankTab, seasonBar, seasonLoad } from './rank.js';
import { dailyAdd } from '../features/daily.js';
import { achTag } from '../features/achv.js';
import { powerOf } from '../core/rules.js';
import { tt } from '../sys/i18n.js';

export const SB_URL = 'https://ujxuzduomfssguibnjux.supabase.co';
export const SB_KEY = 'sb_publishable_PcjuTpqwZMObF0YuHmTTjA_ifajvlMg';
export const PVP_MUL = 0.12, PVP_TIME = 100;
export let SB = null, SBP = null;
/** 다른 파일에서 SBP 를 바꿀 때 (import 한 이름엔 대입 불가) */
export function setSBP(v) { SBP = v; }
export const PV = { me: null, uid: null, tab: 'find', list: [], busy: false, notReg: /** @type {boolean|undefined} */ (undefined), moved: false };

export function sbInit() {
  if (SBP) return SBP;
  SBP = (async () => {
    const m = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    SB = m.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'heesu_bori_sb' } });
    let { data: { session } } = await SB.auth.getSession();
    if (!session) { const r = await SB.auth.signInAnonymously(); if (r.error) throw r.error; session = r.data.session; }
    PV.uid = session.user.id; return SB;
  })();
  SBP.catch(() => { SBP = null; });
  return SBP;
}
export function pvErr(e) { const m = (e && (e.message || e.msg)) || String(e); if (/anonymous/i.test(m)) return tt('net/pvp.1'); if (/import|fetch|network|Failed/i.test(m)) return tt('net/pvp.2'); if (/duplicate|unique/i.test(m)) return tt('net/pvp.3'); if (/hb:moved/.test(m)) return tt('net/pvp.4'); if (/hb:invalid/.test(m)) return tt('net/pvp.5'); if (/hb:nickname/.test(m)) return tt('net/pvp.6'); if (/too fast|rate/i.test(m)) return tt('net/pvp.7'); return m.slice(0, 80); }

// ---------- 내 희수 스냅샷 ----------
export function pvpSnap() {
  const keepP = G.P; G.P = null; const st = calcStats(); G.P = keepP; const pd = G.pd, w = st.weapon;
  const skl = {}; for (const id of ['fist', 'smash', 'nag', 'flash', 'menhera', 'mukbang', 'shop']) skl[id] = sk(id);
  const snap = { v: 1, lv: pd.lv, aw: pd.aw || 0, hp: st.hp, atk: st.atk, def: st.def, crit: Math.round(st.crit * 1000) / 1000, critMul: st.critMul, spd: Math.round(st.spd * 100) / 100, enh: st.enh || 0, tenh: st.toyEnh || 0,
    w: { id: defOf(pd.eq.weapon), mul: w.mul, rate: w.rate, reach: w.reach, arc: w.arc, style: w.style }, eq: visEqRaw(pd), sk: skl,
    job: jobOf(pd), bori: !!pd.boriJoined, beq: pd.boriJoined ? { bcloth: defOf(pd.beq.bcloth) || null, btoy: defOf(pd.beq.btoy) || null } : null, boriMul: Math.round((st.boriMul || 1) * 100) / 100, cleared: pd.cleared || 0, infBest: pd.infBest || 0, ttl: pd.title && pd.ach && pd.ach[pd.title] ? pd.title : null, achN: Object.keys(pd.ach || {}).length, skm: Math.round((st.skillMul || 1) * 100) / 100, sid: pd.sid || null, book: st.book || 0, vis: visEq(pd), hair: (pd.look && pd.look.hair) || 'base' };
  const power = powerOf({ atk: st.atk, hp: st.hp, def: st.def, crit: st.crit, spd: st.spd, bori: pd.boriJoined, boriMul: st.boriMul, sk: skl, skm: st.skillMul }); // 서버 hb_power 와 같은 식 (core/rules.js)
  if (keepP) calcStats();
  return { snap, power };
}
// 등록·갱신은 서버 함수로만: 전투력은 서버가 snap 으로 계산하고, 말이 안 되는 값·같은 세이브 중복 등록은 거절
export async function pvpUpload(nick) {
  await sbInit(); const { snap } = pvpSnap();
  const { data, error } = await SB.rpc('hb_submit_fighter', { p_snap: snap, p_nick: nick || null });
  if (error) throw error;
  if (data && data.ok === false) { if (data.reason === 'moved') PV.moved = true; throw new Error('hb:' + data.reason + (data.field ? ':' + data.field : '')); }
  await pvpLoadMe();
}
export async function pvpLoadMe() { await sbInit(); const { data, error } = await SB.from('hb_fighters').select('*').eq('user_id', PV.uid).maybeSingle(); if (error) throw error; PV.me = data; PV.notReg = !data; if (data) try { localStorage.setItem('heesu_bori_pvp_reg', '1'); } catch (e) { } return data; }

// ---------- 로비 UI ----------
export function pvpOpen() {
  const saved = loadGame(); if (!saved) { toast(tt('net/pvp.8'), 'warn'); return; }
  G.pd = saved; G.P = null; calcStats(); G.pvp = null;
  $('#title').hidden = true; showHUD(false); G.state = 'pvpLobby'; playBgm('home');
  $('#pvp').hidden = false; $('#pvpSeason').innerHTML = ''; pvpRender(tt('net/pvp.9'));
  sbInit().then(seasonLoad).then(() => { $('#pvpSeason').innerHTML = seasonBar(); }).then(pvpLoadMe).then(() => { if (!PV.me) pvpNickBox(true); else { pvpUpload().catch(() => { }); pvpTab(PV.tab); } }).catch(e => pvpRender(tt('net/pvp.10', { v1: esc(pvErr(e)) })));
}
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function pvpRender(html) {
  const me = PV.me;
  $('#pvpInfo').innerHTML = me ? tt('net/pvp.11', { v1: esc(me.nickname), rating: me.rating, wins: me.wins, losses: me.losses }) : '';
  for (const b of document.querySelectorAll(/** @type {'button'} */ ('#pvpTabs button'))) b.classList.toggle('on', b.dataset.t === PV.tab);
  $('#pvpList').innerHTML = html;
}
function pvpCard(f, btn) {
  const s = f.snap || {}, mine = f.user_id === PV.uid;
  return tt('net/pvp.57', { v1: mine ? ' mine' : '', v2: pvpFaceURL(s.vis || s.eq, s.hair), v3: achTag(s.ttl), v4: jobTag(s.job), v5: esc(f.nickname), v6: mine ? tt('net/pvp.12') : '', v7: s.lv || '?', power: f.power, rating: f.rating, v8: s.atk != null ? tt('net/pvp.56', { atk: s.atk, def: s.def, hp: s.hp, v1: s.enh ? tt('net/pvp.13') + s.enh : '', v2: s.tenh ? tt('net/pvp.14') + s.tenh : '' }) : '', v9: btn || '' });
}
async function pvpTab(t) {
  PV.tab = t; if (!PV.me) return; pvpRender(tt('net/pvp.15'));
  try {
    if (t === 'find') {
      const { data, error } = await SB.rpc('hb_opponents'); if (error) throw error; PV.list = data || [];
      pvpRender(PV.list.length ? tt('net/pvp.16') + PV.list.map((f, i) => pvpCard(f, tt('net/pvp.17', { i }))).join('') : tt('net/pvp.18'));
    } else if (t === 'rank') {
      const { data, error } = await SB.from('hb_fighters').select('user_id,nickname,snap,power,rating,wins,losses').eq('played', true).order('rating', { ascending: false }).order('power', { ascending: false }).limit(50); if (error) throw error;
      pvpRender((data || []).map((f, i) => `<div class="pvr${f.user_id === PV.uid ? ' mine' : ''}"><b>${i + 1}</b>${pvpCard(f)}</div>`).join('') || tt('net/pvp.19'));
    } else if (t === 'log') {
      const { data, error } = await SB.from('hb_battles').select('attacker,defender,attacker_won,delta,created_at,a:hb_fighters!hb_battles_attacker_fkey(nickname),d:hb_fighters!hb_battles_defender_fkey(nickname)').or(`attacker.eq.${PV.uid},defender.eq.${PV.uid}`).order('created_at', { ascending: false }).limit(30); if (error) throw error;
      pvpRender((data || []).map(b => { const atk = b.attacker === PV.uid, won = atk ? b.attacker_won : !b.attacker_won, who = atk ? (b.d && b.d.nickname) : (b.a && b.a.nickname); const d = atk ? b.delta : -b.delta;
        return `<div class="pvl ${won ? 'w' : 'l'}"><b>${won ? tt('net/pvp.20') : tt('net/pvp.21')}</b><span>${atk ? tt('net/pvp.22') : tt('net/pvp.23')} ${esc(who || '?')}</span><i>${d > 0 ? '+' : ''}${d}</i></div>`; }).join('') || tt('net/pvp.24'));
    }
  } catch (e) { pvpRender(tt('net/pvp.25', { v1: esc(pvErr(e)) })); }
}
export function pvpNickBox(first) {
  $('#pvpNick').hidden = false; $('#pvpNickNo').hidden = RK.joining === 'entry'; $('#pvpNickCloud').hidden = RK.joining !== 'entry'; const inp = $('#pvpNickIn'); inp.value = PV.me ? PV.me.nickname : ''; $('#pvpNickMsg').textContent = first ? tt('net/pvp.26') : tt('net/pvp.27');
  setTimeout(() => inp.focus(), 50);
}
export async function pvpNickSave() {
  const v = $('#pvpNickIn').value.trim(); if (v.length < 2 || v.length > 10) { $('#pvpNickMsg').textContent = tt('net/pvp.28'); return; }
  $('#pvpNickMsg').textContent = tt('net/pvp.29');
  const joining = RK.joining, keep = G.pd, pd = keep || loadGame() || newPD();
  try {
    G.pd = pd; try { await pvpUpload(v); } finally { if (keep !== pd) { G.pd = keep; if (keep) calcStats(); } }
    PV.notReg = false; $('#pvpNick').hidden = true; $('#pvpNickNo').hidden = false; toast(joining === 'entry' ? tt('net/pvp.30', { v1: v }) : joining ? tt('net/pvp.31') : tt('net/pvp.32'), 'item r2');
    if (joining) { RK.joining = false; if (!$('#rank').hidden) rankTab(RK.tab); } else pvpTab(PV.tab);
  }
  catch (e) { $('#pvpNickMsg').textContent = pvErr(e); }
}
export function pvpClick(e) {
  const b = e.target.closest('[data-pv],[data-t]'); if (!b) return; sfx('select');
  if (b.dataset.t) return pvpTab(b.dataset.t);
  const a = b.dataset.pv;
  if (a === 'fight') { const f = PV.list[+b.dataset.i]; if (f) pvpFight(f); }
  else if (a === 'sync') { b.disabled = true; pvpUpload().then(() => { toast(tt('net/pvp.33'), 'sub'); pvpTab(PV.tab); }).catch(err => toast(pvErr(err), 'warn')).finally(() => b.disabled = false); }
  else if (a === 'nick') pvpNickBox(false);
  else if (a === 'adv') { $('#pvp').hidden = true; G.pvp = null; fadeTo(() => startZone(curZone(G.pd))); }
  else if (a === 'title') { $('#pvp').hidden = true; G.pvp = null; showTitle(); }
}

// ---------- 대전 ----------
function pvpFight(opp) {
  $('#pvp').hidden = true;
  fadeTo(() => startPvpArena(opp), `VS ${opp.nickname}`);
}
function startPvpArena(opp) {
  G.pvp = { opp, t: PVP_TIME, over: false }; G.inf = null; G.auto = false; G.autoMove = null;
  G.zone = 0; G.world = buildWorld(0); const W = G.world;
  G.enemies = []; G.projs = []; G.fx = []; G.drops = []; G.parts = []; G.texts = []; G.bubbles = [];
  G.zoneKills = 0; G.bossSpawned = true; G.bossDefeated = false; G.exitOpen = false; G.spawnT = 99; G.ult = null; G.pendingEvent = null;
  G.P = null; calcStats(); G.P = newPlayer(W.start.x, W.start.y); G.P.fy = -1; G.P.dir = 'up'; G.bori = null; G.buddy = null;
  let rx = W.start.x, ry = W.start.y - 110;
  for (let k = 0; k < 20 && W.solids.some(s => Math.hypot(rx - s.x, ry - s.y) < s.r + 10); k++) { rx = W.start.x + rand(-60, 60); ry = W.start.y - rand(90, 140); }
  G.boss = spawnRival(opp, rx, ry);
  G.cam.x = clamp(G.P.x - VW / 2, 0, Math.max(0, W.W - VW)); G.cam.y = clamp(G.P.y - 60 - VH / 2, 0, Math.max(0, W.H - VH));
  G.state = 'play'; showHUD(true); playBgm('boss'); banner(tt('net/pvp.34'), tt('net/pvp.35', { nickname: opp.nickname }), 'boss'); sfx('boss');
  bubble(G.P, choice([tt('net/pvp.36'), tt('net/pvp.37'), tt('net/pvp.38')]), 1.8);
}
function spawnRival(opp, x, y) {
  const S = opp.snap; const m = { name: tt('net/pvp.35', { nickname: opp.nickname }), ai: 'rival', boss: true, xp: 0, gold: [0, 0], col: '#ff7ab8', drops: [] };
  const e = { type: 'rival', rival: true, snap: S, nick: opp.nickname, m, x, y, hp: Math.round(S.hp * 1.6), maxHp: Math.round(S.hp * 1.6), atk: S.atk, def: S.def, spd: 58 * (S.spd || 1), r: 6, h: 22, w: 14, sc: 1, boss: true, col: '#ff7ab8',
    t: 0, atkCd: 1e9, kbx: 0, kby: 0, stun: 0, slow: 0, fear: 0, confuse: 0, mental: 0, flash: 0, wx: 0, wy: 0, wT: 0, st: 'idle', stT: 0, spawnT: 1.3, id: ++G.eid, fly: false, face: 1, hopY: 0,
    cdS: 1.5, cdN: 3, cdF: 6, cdU: 20, swCd: 1, cast: null, mv: 0, ang: -Math.PI / 2, lx: x, ly: y, ultUsed: 0 };
  G.enemies.push(e); return e;
}
function rivalHit(e, mul) { const S = e.snap; let raw = S.atk * mul * 1.25 * rand(0.9, 1.1); if (Math.random() < S.crit) { raw *= S.critMul; addText(G.P.x, G.P.y - 32, tt('net/pvp.39'), 'crit'); } return raw; }
AI.rival = function (e, dt, sp, dP) {
  const S = e.snap, sk2 = S.sk || {}, w = S.w || { mul: 1, rate: 1.5, reach: 14, arc: 100 }, P = G.P;
  e.cdS -= dt; e.cdN -= dt; e.cdF -= dt; e.cdU -= dt; e.swCd -= dt;
  if (e.cast) { e.cast.t -= dt; if (e.cast.t <= 0) { const c = e.cast; e.cast = null; c.go(); } return; }
  const a = Math.atan2(P.y - e.y, P.x - e.x); e.ang = a; e.face = Math.cos(a) > 0 ? 1 : -1;
  const reach = (w.reach || 14) + 6;
  if (sk2.menhera && e.cdU <= 0 && (e.hp < e.maxHp * 0.55 || e.t > 30)) {
    e.cdU = [40, 35, 30, 25][sk2.menhera - 1] || 40; bubble(e, tt('net/pvp.40'), 1.4); G.fx.push({ k: 'ring', x: e.x, y: e.y - 10, r: 60, col: '#b45cff', t: 0, dur: 1.3 });
    e.cast = { t: 1.4, go: () => { G.flash = 0.25; G.shake = 8; word(e.x, e.y - 30, tt('net/pvp.41'), '#b45cff', 2); const dmg = Math.round(G.st.hp * (0.12 + 0.05 * sk2.menhera)); pvpTrueHurt(dmg); for (let i = 0; i < 20; i++) G.parts.push({ x: G.cam.x + rand(0, VW), y: G.cam.y + rand(-20, VH * 0.6), vx: rand(-10, 10), vy: rand(30, 70), life: rand(1, 1.6), max: 1.6, col: choice(['#b45cff', '#ff7ab8']), sz: 3, grav: 20, heart: true }); } };
    return;
  }
  if (sk2.flash && e.cdF <= 0 && dP < 50) {
    e.cdF = 10; bubble(e, tt('net/pvp.42'), 1); G.fx.push({ k: 'circle', x: e.x, y: e.y, r: 44, t: 0, dur: 0.7 });
    e.cast = { t: 0.7, go: () => { G.shake = 5; sfx('slam'); G.fx.push({ k: 'ring', x: e.x, y: e.y - 6, r: 44, col: '#7ec8ff', t: 0, dur: 0.4 }); if (Math.hypot(P.x - e.x, P.y - e.y) < 48) hurtPlayer(rivalHit(e, 1.5 + 0.3 * (sk2.flash - 1)), e); } };
    return;
  }
  if (sk2.nag && e.cdN <= 0 && dP < 140 && dP > 30) {
    e.cdN = 6; bubble(e, choice([tt('net/pvp.43'), tt('net/pvp.44')]), 0.9);
    e.cast = { t: 0.35, go: () => { const n = 4 + sk2.nag; for (let i = 0; i < n; i++) { shootAt(e, 'note', a + (i - (n - 1) / 2) * 0.16, 95); G.projs[G.projs.length - 1].dmg = S.atk * (0.9 + 0.15 * (sk2.nag - 1)); } sfx('pop'); } };
    return;
  }
  if (sk2.smash && e.cdS <= 0 && dP < reach + 8) {
    e.cdS = 3.5; const fx = e.x + Math.cos(a) * 12, fy = e.y + Math.sin(a) * 10; G.fx.push({ k: 'circle', x: fx, y: fy, r: 16, t: 0, dur: 0.45 });
    e.cast = { t: 0.45, go: () => { sfx('punch'); G.shake = 3; if (Math.hypot(P.x - fx, P.y - fy) < 20) hurtPlayer(rivalHit(e, 2.2 + 0.4 * (sk2.smash - 1)), e); } };
    return;
  }
  if (w.style === 'throw') {
    if (dP > (w.reach || 120) * 0.8) moveToward(e, P.x, P.y, sp, dt); else if (dP < 50) { e.x -= Math.cos(a) * sp * 0.6 * dt; e.y -= Math.sin(a) * sp * 0.6 * dt; }
    if (dP < (w.reach || 120) + 10 && e.swCd <= 0) { e.swCd = 1 / Math.min(2, (w.rate || 2) * (1 + 0.03 * (sk2.fist || 0))); shootAt(e, 'card', a, 210); const pj = G.projs[G.projs.length - 1]; pj.dmg = rivalHit(e, (w.mul || 1) * (1 + 0.1 * (sk2.fist || 0))) / PVP_MUL * PVP_MUL; pj.life = (w.reach || 120) / 210 + 0.1; pj.r = 4; }
    e.mv = Math.hypot(e.x - e.lx, e.y - e.ly) / Math.max(dt, 1e-3); e.lx = e.x; e.ly = e.y; return;
  }
  if (dP > reach - 2) { moveToward(e, P.x, P.y, sp, dt); if (dP < 60) { const s = Math.sin(e.t * 1.7) * sp * 0.4 * dt; e.x += -Math.sin(a) * s; e.y += Math.cos(a) * s; } }
  else if (e.swCd <= 0) {
    const fl = sk2.fist || 0; e.swCd = 1 / Math.min(2, (w.rate || 1.5) * (1 + 0.03 * fl));
    G.fx.push({ k: 'swing', ent: e, x: e.x, y: e.y - 8, a, reach: w.reach || 14, arc: (w.arc || 100) * Math.PI / 180, t: 0, dur: 0.18, style: w.style, wpn: w.id, side: (e.side ^= 1) });
    hurtPlayer(rivalHit(e, (w.mul || 1) * (1 + 0.1 * fl)), e);
  }
  e.mv = Math.hypot(e.x - e.lx, e.y - e.ly) / Math.max(dt, 1e-3); e.lx = e.x; e.ly = e.y;
};
function pvpTrueHurt(dmg) {
  const P = G.P; if (G.state !== 'play') return; P.hp -= dmg; P.flash = 0.2; addText(P.x, P.y - 24, dmg, 'hurt'); sfx('hurt');
  bubble(P, choice([tt('net/pvp.45'), tt('net/pvp.46'), tt('net/pvp.47')]), 1.2); if (P.hp <= 0) { P.hp = 0; playerDie(); }
}
export function pvpUpdate(dt) {
  const V = G.pvp; if (!V || V.over || G.state !== 'play') return;
  V.t -= dt; if (V.t <= 0) { V.t = 0; const r = G.boss; const mine = G.P.hp / G.st.hp, theirs = r ? r.hp / r.maxHp : 0; pvpEnd(mine >= theirs, tt('net/pvp.48')); }
}
export async function pvpEnd(won, why) {
  const V = G.pvp; if (!V || V.over) return; V.over = true; G.state = 'pvpEnd'; INP.atk = false; dailyAdd('pvp');
  if (won && G.boss) { const r = G.boss; r.dead = true; r.deadT = 0.25; burst(r.x, r.y - 10, '#ff7ab8', 30, 120); }
  if (won) G.pd.stats.pvpW = (G.pd.stats.pvpW || 0) + 1;
  sfx(won ? 'lvl' : 'hurt'); const gold = won ? 40 + G.pd.lv * 3 : 10; G.pd.gold += gold; saveGame();
  $('#pvpRes').hidden = false; $('#pvpResT').textContent = won ? tt('net/pvp.49') : tt('net/pvp.50'); $('#pvpResT').className = won ? 'w' : 'l';
  $('#pvpResS').innerHTML = tt('net/pvp.51', { v1: why ? esc(why) + '<br>' : '', v2: esc(V.opp.nickname), gold });
  try { const { data, error } = await SB.rpc('hb_report_battle', { p_defender: V.opp.user_id, p_won: won }); if (error) throw error; const d = data && data.delta; $('#pvpDelta').textContent = tt('net/pvp.52', { v1: d >= 0 ? '+' : '', d, rating: data.rating }); pvpLoadMe().catch(() => { }); }
  catch (e) { $('#pvpDelta').textContent = tt('net/pvp.53') + pvErr(e); }
}
export function pvpResClick(e) {
  const b = e.target.closest('[data-pr]'); if (!b) return; sfx('select'); $('#pvpRes').hidden = true; const opp = G.pvp && G.pvp.opp;
  if (b.dataset.pr === 'again' && opp) pvpFight(opp);
  else { G.pvp = null; G.enemies = []; G.boss = null; showHUD(false); G.state = 'pvpLobby'; $('#pvp').hidden = false; playBgm('home'); pvpTab('find'); }
}
export function pvpForfeit() { if (!G.pvp || G.pvp.over) return; confirmBox(tt('net/pvp.54'), () => pvpEnd(false, tt('net/pvp.55'))); }

// ---------- 그리기 ----------
function heeSetFor(eq, hair) { const keep = G.pd; G.pd = /** @type {SaveData} */ (/** @type {unknown} */ ({ eq, look: { hair } })); /* 초상화 렌더용 임시 세이브 */ try { return heeSet(); } finally { G.pd = keep; } }
export function pvpFaceURL(eq, hair) {
  try { const set = heeSetFor(eq && ITEMS[eq.hat] && ITEMS[eq.armor] && ITEMS[eq.shoes] && ITEMS[eq.bag] ? eq : newPD().eq, hair); const s = set.down[0]; const o = mkCanvas(s.W * 4, s.H * 4), g = o.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(s.n, 0, 0, s.W * 4, s.H * 4); return o.toDataURL(); } catch (e) { return ''; }
}
export function drawRival(e) {
  let eq = e.snap.vis || e.snap.eq; if (!eq || !ITEMS[eq.hat] || !ITEMS[eq.armor] || !ITEMS[eq.shoes] || !ITEMS[eq.bag]) eq = newPD().eq;
  const set = heeSetFor(eq, e.snap.hair); const d = dirOf(Math.cos(e.ang), Math.sin(e.ang)); const arr = set[d === 'left' ? 'right' : d];
  let s = arr[0]; if (e.mv > 8 && !e.cast) { const fi = Math.floor(e.t * 8) % 4; s = arr[[1, 0, 2, 0][fi]]; }
  shadow(e.x, e.y, 12); if (e.snap && !e.dead) enhAura(e.x, e.y, Math.max(e.snap.enh || 0, e.snap.tenh || 0), e.t || G.time);
  if (e.spawnT > 0) { const p = 1 - e.spawnT / 1.3; drawSpr(s, e.x, e.y - (1 - p) * 30, { alpha: p, white: Math.floor(G.time * 12) % 2 === 0, flip: d === 'left' }); return; }
  drawSpr(s, e.x, e.y, { flip: d === 'left', white: e.flash > 0 || e.dead, alpha: e.dead ? e.deadT / 0.25 : 1 });
  if (e.stun > 0 && !e.dead) for (let i = 0; i < 3; i++) { const a = G.time * 6 + i * 2.1; fr(e.x + Math.cos(a) * 6, e.y - 24 + Math.sin(a) * 2, 1, 1, '#ffd84a'); }
}
