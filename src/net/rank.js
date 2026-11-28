// ===================== 랭킹 대시보드 (전투력 · PvP) =====================



import { ICONS } from '../draw/sprites.js';
import { $ } from '../sys/dom.js';
import { iconURL, mkCanvas, spr, sprBlit } from '../draw/sprite.js';
import { sfx } from '../sys/audio.js';
import { INP } from '../sys/input.js';
import { ITEMS, RARITY, SLOTS, ZONES } from '../core/data.js';
import { CH1_N } from '../core/chapter.js';
import { G } from '../core/state.js';
import { SAVEKEY, loadGame, newPD } from '../core/save.js';
import { addItem, calcStats, keysOf } from '../core/items.js';
import { MAX_LV } from '../core/progress.js';
import { jobTag } from '../features/job.js';
import { boriSpr, heeSet } from '../draw/render.js';
import { toast } from '../ui/dialog.js';
import { showHUD } from '../ui/hud.js';
import { showTitle } from '../ui/lobby.js';
import { PV, SB, esc, pvErr, pvpLoadMe, pvpNickBox, pvpUpload, sbInit } from './pvp.js';
import { tradeClaim } from './trade.js';
import { GUIDE_DONE } from '../features/guide.js';
import { raidGotOpen } from './raid.js';
import { achTag } from '../features/achv.js';
import { RULES, seasonLabel } from '../core/rules.js';
import { tt } from '../sys/i18n.js';

export const RK = { tab: 'power', cache: {}, from: 'title' };
const validEq = eq => (eq && SLOTS.every(sl => eq[sl] && ITEMS[eq[sl]])) ? eq : newPD().eq;
export function fighterURL(snap, scale) {
  scale = scale || 4; const key = JSON.stringify([snap.vis || snap.eq, snap.hair, snap.bori, snap.beq, scale]); if (RK.cache[key]) return RK.cache[key];
  const keep = G.pd; const beq = snap.bori && snap.beq ? { bcloth: ITEMS[snap.beq.bcloth] ? snap.beq.bcloth : null, btoy: ITEMS[snap.beq.btoy] ? snap.beq.btoy : null } : { bcloth: null, btoy: null };
  G.pd = /** @type {SaveData} */ (/** @type {unknown} */ ({ eq: validEq(snap.vis || snap.eq), beq, look: { hair: snap.hair } })); // 초상화 렌더용 임시 세이브
  try {
    const hs = heeSet().down[0]; let bs = null, ts = null;
    if (snap.bori) { bs = boriSpr('sit'); if (beq.btoy) ts = spr('t_' + beq.btoy, ICONS[ITEMS[beq.btoy].icon]); }
    const W = hs.W + (bs ? bs.W + 2 : 0), H = Math.max(hs.H, bs ? bs.H + 1 : 0);
    const c = mkCanvas(W * 2, H * 2), g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.scale(2, 2); sprBlit(g, hs, 0, H - hs.H); // 2배 도트 그대로
    if (bs) { const bx = hs.W + 2, by = H - bs.H; sprBlit(g, bs, bx, by); if (ts) g.drawImage(ts.n, bx + Math.round(8 - ts.W / 2) - 2, by + 11 + Math.ceil(ts.H / 2) - ts.H - 3); }
    const o = mkCanvas(W * scale, H * scale), og = o.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(c, 0, 0, W * scale, H * scale);
    return RK.cache[key] = o.toDataURL();
  } catch (e) { return ''; } finally { G.pd = keep; }
}
export function rankOpen(from) {
  RK.from = from || 'title'; RK.synced = false; $('#title').hidden = true; showHUD(false); G.state = 'rank'; $('#rank').hidden = false; rankTab(RK.tab);
}
export function rankClose() { $('#rank').hidden = true; if (location.hash === '#ranking') history.replaceState(null, '', location.pathname); showTitle(); }
export async function rankTab(t) {
  RK.tab = t; for (const b of document.querySelectorAll(/** @type {'button'} */ ('#rankTabs button'))) b.classList.toggle('on', b.dataset.rt === t);
  $('#rankSum').innerHTML = ''; $('#rankList').innerHTML = tt('net/rank.1');
  try {
    await sbInit(); if (!RK.synced) { RK.synced = true; await Promise.race([rankSync(true), new Promise(r => setTimeout(r, 4000))]); }
    if (!FORCE_EASY && !PV.me && !PV.notReg) await pvpLoadMe().catch(() => { });
    if (t === 'pvp') await seasonLoad(); // 정산이 먼저 돌아야 점수가 맞음
    const col = 'user_id,nickname,snap,power,rating,wins,losses';
    const q = SB.from('hb_fighters').select(col).eq('played', true).limit(50); // 플레이 안 한 Lv1 은 숨김
    const { data, error } = t === 'power' ? await q.order('power', { ascending: false }) : await q.order('rating', { ascending: false }).order('wins', { ascending: false });
    if (error) throw error;
    const { count } = await SB.from('hb_fighters').select('user_id', { count: 'exact', head: true }).eq('played', true);
    rankRender(data || [], count || (data || []).length);
  } catch (e) { $('#rankList').innerHTML = tt('net/rank.2', { v1: esc(pvErr(e)) }); }
}
export function rankJoin() { RK.joining = true; pvpNickBox(true); $('#pvpNickMsg').textContent = tt('net/rank.3'); }
function rankJoinBar() {
  if (FORCE_EASY || PV.me || !PV.notReg) return '';
  const has = !!(G.pd || loadGame());
  return `<div class="rjoin">${has ? tt('net/rank.4') : tt('net/rank.5')}</div>`;
}
function rankRender(rows, total) {
  const t = RK.tab, val = f => t === 'power' ? f.power.toLocaleString() : f.rating.toLocaleString(), unit = t === 'power' ? tt('net/rank.6') : tt('net/rank.7');
  const top = rows[0], avg = rows.length ? Math.round(rows.reduce((a, f) => a + f.power, 0) / rows.length) : 0;
  const maxEnh = rows.reduce((a, f) => Math.max(a, (f.snap && f.snap.enh) || 0), 0), games = rows.reduce((a, f) => a + f.wins + f.losses, 0);
  $('#rankSum').innerHTML = [
    [tt('net/rank.8'), total.toLocaleString() + tt('net/rank.9')],
    t === 'power' ? [tt('net/rank.10'), top ? top.power.toLocaleString() : '-'] : [tt('net/rank.11'), top ? top.rating.toLocaleString() : '-'],
    t === 'power' ? [tt('net/rank.12'), avg.toLocaleString()] : [tt('net/rank.13'), Math.round(games / 2).toLocaleString() + tt('net/rank.14')],
    [tt('net/rank.15'), maxEnh ? '+' + maxEnh : '-']
  ].map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('');
  if (!rows.length) { $('#rankList').innerHTML = rankJoinBar() + tt('net/rank.16'); return; }
  const me = PV.uid;
  const pod = rows.slice(0, 3).map((f, i) => `<div class="rpod p${i + 1}${f.user_id === me ? ' mine' : ''}"><i>${i + 1}</i><img src="${fighterURL(f.snap || {}, 5)}"><em>${achTag((f.snap || {}).ttl)}${jobTag((f.snap || {}).job)}${esc(f.nickname)}</em><b>${val(f)}</b><small>${unit} · Lv.${(f.snap && f.snap.lv) || '?'}${f.snap && f.snap.aw ? '★' + f.snap.aw : ''}${t === 'pvp' ? tt('net/rank.17', { wins: f.wins, losses: f.losses }) : ''}</small></div>`);
  const order = pod.length === 3 ? [pod[1], pod[0], pod[2]] : pod;
  const list = rows.slice(3).map((f, i) => { const s = f.snap || {}; return `<div class="rrow${f.user_id === me ? ' mine' : ''}"><i>${i + 4}</i><img src="${fighterURL(s, 3)}"><span><em>${achTag(s.ttl)}${jobTag(s.job)}${esc(f.nickname)}</em><small>Lv.${s.lv || '?'}${s.aw ? '★' + s.aw : ''}${s.enh ? tt('net/rank.18') + s.enh : ''}${s.book ? tt('net/rank.19') + s.book : ''}${s.tenh ? tt('net/rank.20') + s.tenh : ''}${t === 'pvp' ? tt('net/rank.17', { wins: f.wins, losses: f.losses }) : ` · PvP ${f.rating}`}</small></span><b>${val(f)}</b></div>`; }).join('');
  $('#rankList').innerHTML = rankJoinBar() + (t === 'pvp' ? seasonBar() : '') + `<div class="rpodium">${order.join('')}</div>${list}`;
}
// 서버에 내 희수가 등록돼 있으면 최신 스펙을 올림 (게임 중 자동 저장 때 1분에 한 번, 타이틀·랭킹 열 때)
let rankSyncT = 0, rankSyncP = null;
async function rankSyncNow() {
  if (FORCE_EASY) return false; const pd = G.pd || loadGame(); if (!pd) return false;
  if (PV.notReg || PV.moved) return false;
  await sbInit(); const me = PV.me || await pvpLoadMe(); if (!me) { PV.notReg = true; return false; }
  const keep = G.pd; G.pd = pd;
  try { await pvpUpload(); } finally { if (keep !== pd) { G.pd = keep; if (keep) calcStats(); } }
  await claimGifts(pd).catch(() => { });
  await tradeClaim().catch(() => 0);
  return true;
}
export function rankSync(force) {
  if (FORCE_EASY || (!force && Date.now() - rankSyncT < 60000)) return rankSyncP || Promise.resolve(false);
  rankSyncT = Date.now(); rankSyncP = rankSyncNow().catch(() => false).finally(() => { rankSyncP = null; }); return rankSyncP;
}

// 처음 들어오면 바로 닉네임 등록 (원터치 에디션 제외, 서버 연결 실패 시엔 그냥 넘어감)
let entryRegDone = false;
export async function entryRegister() {
  if (FORCE_EASY || entryRegDone) return;
  // 처음 온 사람은 바로 게임부터: 첫 걸음 가이드를 끝냈거나(Lv5·2회차 이상 포함) 했을 때만 닉네임을 물어봄
  const pd = loadGame(); if (!pd || ((pd.guide || 0) < GUIDE_DONE && (pd.lv || 1) < 5 && !pd.cleared)) return;
  entryRegDone = true;
  try {
    await sbInit(); const me = PV.me || await pvpLoadMe(); if (me) return;
    if (G.state === 'play' || G.state === 'menu' || G.state === 'dlg') { entryRegDone = false; return; } // 게임 중이면 다음 타이틀에서
    RK.joining = 'entry'; pvpNickBox(true); $('#pvpNickMsg').textContent = tt('net/rank.21');
  } catch (e) { }
}

/** 운영자 선물 'items': 해당 등급 장비 전 부위를 주고, 더 높은 등급이면 착용 */
function giftItems(pd, r) {
  const ids = Object.keys(ITEMS).filter(id => { const it = ITEMS[id]; return it.rar === r && it.tier && !it.bossOnly; });
  pd.book = pd.book || {}; pd.beq = pd.beq || { bcloth: null, btoy: null };
  for (const id of ids) {
    const it = ITEMS[id], k = keysOf(pd, id)[0] || addItem(pd, id); pd.book[id] = 1;
    const cur = ITEMS[it.bori ? pd.beq[it.slot] : pd.eq[it.slot]];
    if (!cur || (cur.rar || 0) < r) { if (it.bori) pd.beq[it.slot] = k; else pd.eq[it.slot] = k; }
  }
  return ids;
}
// 운영자 선물(hb_grants) 받기: 서버에서 받은 표시를 남기고 세이브에 더함
export async function claimGifts(pd) {
  if (FORCE_EASY || !pd || !SB) return;
  const { data, error } = await SB.rpc('hb_claim_grants', { p_kinds: ['auto', 'gold', 'stage', 'awaken', 'stones', 'level', 'items'] }); if (error || !data || !data.length) return;
  const tgt = G.pd || pd; // 그 사이 게임을 시작했으면 실제 플레이 중인 세이브에 넣음
  const season = { rank: 0, items: /** @type {any[]} */ ([]) }, raid = { rank: 0, killed: false, items: /** @type {any[]} */ ([]) };
  for (const g of data) {
    const note = String(g.note || ''), sm = /시즌 (\d+)위/.exec(note), isRaid = /월드 보스/.test(note); // 시즌·레이드 보상은 알림 대신 모달로 모아서
    if ((sm || isRaid) && (g.kind === 'stones' || g.kind === 'gold' || g.kind === 'auto')) {
      const n = Number(g.amount) || 0; if (!n) continue; const grp = isRaid ? raid : season, rm = /(\d+)위/.exec(note);
      if (rm) grp.rank = grp.rank ? Math.min(grp.rank, Number(rm[1])) : Number(rm[1]); if (/처치/.test(note)) raid.killed = true;
      const ex = grp.items.find(x => x.kind === g.kind); if (ex) ex.amount += n; else grp.items.push({ kind: g.kind, amount: n });
      if (g.kind === 'stones') tgt.stones = (tgt.stones || 0) + n; else if (g.kind === 'gold') tgt.gold = (tgt.gold || 0) + n; else tgt.autoBonus = (tgt.autoBonus || 0) + n;
      continue;
    }
    const lead = /데려갔어요/.test(note) ? `🤝 ${note}!` : tt('net/rank.22');
    if (g.kind === 'auto') {
      const sec = Number(g.amount) || 0; if (!sec) continue;
      tgt.autoBonus = (tgt.autoBonus || 0) + sec;
      const h = sec / 3600, txt = h >= 1 ? tt('net/rank.23', { v1: Math.round(h * 10) / 10 }) : tt('net/rank.24', { v1: Math.round(sec / 60) });
      toast(tt('net/rank.25', { lead, txt }), 'lvl'); sfx('lvl');
    } else if (g.kind === 'stage') {
      // amount = 누적 스테이지 번호 (1회차 STAGE 1 = 1, 회차당 CH1_N(4)개, 1장만). 지금보다 앞일 때만 이동
      const n = Math.max(1, Number(g.amount) || 1) - 1, Z = CH1_N, cl = Math.floor(n / Z), z = n % Z;
      const cur = (tgt.cleared || 0) * Z + (tgt.zone || 0);
      if (n > cur) { tgt.cleared = cl; tgt.zone = z; toast(tt('net/rank.26', { lead, v1: cl + 1, sub: ZONES[z].sub }), 'lvl'); sfx('lvl'); }
    } else if (g.kind === 'awaken') {
      // amount = 목표 각성 단계. 올라간 만큼 각성 포인트도 지급
      const to = Number(g.amount) || 0, from = tgt.aw || 0;
      if (to > from) { tgt.aw = to; tgt.ap = (tgt.ap || 0) + (to - from); if ((tgt.lv || 1) < MAX_LV) { tgt.sp = (tgt.sp || 0) + (MAX_LV - tgt.lv); tgt.lv = MAX_LV; tgt.xp = 0; } toast(tt('net/rank.27', { lead, to, v1: to - from }), 'lvl'); sfx('lvl'); }
    } else if (g.kind === 'level') {
      // amount = 목표 레벨 (최대 MAX_LV). 올라간 만큼 스킬 포인트도 지급
      const to = Math.min(MAX_LV, Number(g.amount) || 0), from = tgt.lv || 1;
      if (to > from) { tgt.lv = to; tgt.xp = 0; tgt.sp = (tgt.sp || 0) + (to - from); toast(tt('net/rank.28', { lead, to, v1: to - from }), 'lvl'); sfx('lvl'); }
    } else if (g.kind === 'items') {
      // amount = 등급(5 = 초월). 그 등급 장비(보스 전용 제외) 전 부위 지급, 지금 것보다 높은 등급이면 착용
      const r = Math.min(5, Number(g.amount) || 0), ids = giftItems(tgt, r);
      if (ids.length) { toast(tt('net/rank.29', { lead, v1: RARITY[r], length: ids.length }), 'lvl'); sfx('lvl'); }
    } else if (g.kind === 'stones') {
      const n = Number(g.amount) || 0; if (!n) continue;
      tgt.stones = (tgt.stones || 0) + n; toast(tt('net/rank.30', { lead, n }), 'lvl'); sfx('ding');
    } else if (g.kind === 'gold') {
      const n = Number(g.amount) || 0; if (!n) continue;
      tgt.gold = (tgt.gold || 0) + n; toast(`${lead} ${n.toLocaleString()}G`, 'lvl'); sfx('coin');
    }
  }
  try { localStorage.setItem(SAVEKEY, JSON.stringify(tgt)); } catch (e) { }
  const ord = { stones: 0, gold: 1, auto: 2 };
  if (season.items.length) { season.items.sort((x, y) => ord[x.kind] - ord[y.kind]); seasonGotOpen(season.rank, season.items); }
  if (raid.items.length) {
    raid.items.sort((x, y) => ord[x.kind] - ord[y.kind]); const show = () => raidGotOpen(raid.rank, raid.killed, raid.items);
    if (!season.items.length) show(); else SM_NEXT = show; // 시즌 모달 닫으면 이어서
  }
  if (G.pd === tgt) calcStats();
  if (!G.pd && G.state === 'title' && !$('#title').hidden) showTitle(); // 타이틀 버튼 정보 갱신
}

// ---------- 주간 PvP 시즌 (서버 hb_season_info: 부르면 필요 시 정산까지) ----------
let SEASON = /** @type {any} */ (null);
export async function seasonLoad() {
  if (FORCE_EASY) return null;
  try { await sbInit(); const { data, error } = await SB.rpc('hb_season_info'); if (!error && data) SEASON = data; } catch (e) { }
  return SEASON;
}
function seasonLeft() {
  if (!SEASON || !SEASON.ends_at) return ''; const s = Math.max(0, (new Date(SEASON.ends_at).getTime() - Date.now()) / 1000);
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  return d ? tt('net/rank.31', { d, h }) : h ? tt('net/rank.32', { h, m }) : tt('net/rank.33', { m });
}
/** 시즌 보상표 — core/rules.js RULES.season (서버 hb_season_rollover 도 같은 표에서 만들어짐). k = 그 줄의 첫 순위 */
const SEASON_REWARDS = RULES.season.map((t, i) => ({ k: i ? RULES.season[i - 1].to + 1 : 1, label: seasonLabel(i), s: t.s, g: t.g, a: t.a }));
// ---------- 픽셀 메달·리본 ----------
const PX_DIG = { 1: ['.m.', 'mm.', '.m.', '.m.', 'mmm'], 2: ['mm.', '..m', '.m.', 'm..', 'mmm'], 3: ['mm.', '..m', '.m.', '..m', 'mm.'] };
function pxMedalRows(M, m, d) {
  const rows = ['..KK...KK..', '..KRK.KUK..', '...KRKUK...', '....KKK....', '...KKKKK...', '.KKMMMMMKK.', '.KMMMMMMMK.', 'KMeMMMMMMMK', 'KMMMMMMMMMK', 'KMMMMMMMMMK', '.KMMMMMMMK.', '.KKMMMMMKK.', '...KKKKK...'].map(r => r.split(''));
  if (d) PX_DIG[d].forEach((r, y) => r.split('').forEach((c, x) => { if (c === 'm') rows[6 + y][4 + x] = 'm'; }));
  return rows.map(r => r.join('').replace(/M/g, M).replace(/m/g, m));
}
ICONS.medal1 = pxMedalRows('A', 'D', 1); ICONS.medal2 = pxMedalRows('G', 'j', 2); ICONS.medal3 = pxMedalRows('F', 'f', 3); ICONS.medal4 = pxMedalRows('U', 'u', 0);
ICONS.rosette = ['..KK.K.KK..', '.KQQKQKQQK.', 'KQQQQQQQQQK', '.KQQeeeQQK.', 'KQQeAAAeQQK', '.KQeAAAeQK.', 'KQQeAAAeQQK', '.KQQeeeQQK.', 'KQQQQQQQQQK', '.KQQKQKQQK.', '..KK.K.KK..', '...KVK.KVK.', '...KVK.KVK.', '...KK...KK.'];
/** 픽셀 아이콘 <img> (medal1~4·rosette·trophy 등) */
export const PXI = (k, cls) => `<img class="pxi${cls ? ' ' + cls : ''}" src="${iconURL('px_' + k, ICONS[k])}" alt="">`;
export const MEDAL = r => PXI(r === 1 ? 'medal1' : r === 2 ? 'medal2' : r === 3 ? 'medal3' : 'medal4');
export const fmtGold = n => n >= 10000 ? tt('net/rank.34', { v1: (n / 10000).toLocaleString() }) : n.toLocaleString();
const fmtAuto = s => s >= 3600 ? tt('net/rank.23', { v1: Math.round(s / 360) / 10 }) : tt('net/rank.24', { v1: Math.round(s / 60) });
/** 보상 아이콘 카드 HTML. items: [{kind:'stones'|'gold'|'auto', amount}] */
export function rewardCards(items, big) {
  const def = { stones: ['stone', tt('net/rank.35'), n => n + tt('net/rank.36')], gold: ['gcoin', tt('net/rank.37'), n => fmtGold(n) + 'G'], auto: ['alarm', tt('net/rank.38'), fmtAuto], xp: ['bolt', tt('net/rank.39'), n => fmtGold(n)] };
  return `<div class="rwcs${big ? ' big' : ''}">` + items.filter(it => def[it.kind] && it.amount > 0).map((it, i) => { const [ic, nm, f] = def[it.kind];
    return `<div class="rwc" style="animation-delay:${i * 0.12}s"><img src="${iconURL('i_' + ic, ICONS[ic])}"><b>${f(Number(it.amount))}</b><small>${nm}</small></div>`; }).join('') + '</div>';
}
export const rwItems = r => [{ kind: 'stones', amount: r.s }, { kind: 'gold', amount: r.g || 0 }, { kind: 'auto', amount: r.a || 0 }];
export function seasonBar() {
  if (!SEASON) return '';
  const top = (SEASON.top || []).map(t => `${MEDAL(t.rank)} ${esc(t.nickname)}`).join(' · ');
  const mine = SEASON.mine ? tt('net/rank.40', { v1: MEDAL(SEASON.mine.rank), rank: SEASON.mine.rank }) : '';
  return tt('net/rank.41', { v1: PXI('trophy', 'in'), v2: seasonLeft() })
    + tt('net/rank.46', { v1: top ? tt('net/rank.42', { top }) : tt('net/rank.43') }) + mine + '</div>';
}
/** 순위별 보상 모달 */
function seasonRewardsOpen() {
  $('#seasonModalBody').innerHTML = tt('net/rank.44')
    + SEASON_REWARDS.map(r => `<div class="srw"><div class="srk"><i>${r.k <= 4 ? MEDAL(r.k) : PXI('rosette')}</i><b>${r.label}</b></div>${rewardCards(rwItems(r))}</div>`).join('');
  seasonModalShow();
}
/** 받은 시즌 보상 모달 */
function seasonGotOpen(rank, items) {
  $('#seasonModalBody').innerHTML = tt('net/rank.45', { v1: MEDAL(rank), rank, v2: rewardCards(items, true) });
  seasonModalShow(); sfx('lvl');
}
let SM_PAUSED = false;
export function seasonModalShow() { if (G.state === 'play') { G.state = 'menu'; SM_PAUSED = true; INP.atk = false; } $('#seasonModal').hidden = false; }
let SM_NEXT = /** @type {null|(() => void)} */ (null);
export function setSmNext(f) { SM_NEXT = f; }
function seasonModalClose() { $('#seasonModal').hidden = true; if (SM_NEXT) { const f = SM_NEXT; SM_NEXT = null; setTimeout(f, 80); } if (SM_PAUSED && G.state === 'menu' && $('#menu').hidden) G.state = 'play'; SM_PAUSED = false; }
