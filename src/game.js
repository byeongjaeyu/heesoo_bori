// ===================== GAME CORE =====================
import { MONSPR } from './sprites.js';
import { INP, VH, VW, angDiff, choice, clamp, fmtNumText, lerp, moveVec, playBgm, rand, randi, sfx, sprHi, wpick } from './engine.js';
import { AWK, BOOK_ALL, BOOK_PER_HP, BOOK_SETS, BSLOTS, EQ_SETS, FOODS, FOOD_ORDER, HAIRS, ITEMS, LOOK_SLOTS, MENHERA_LINES, MONS, NAG_WORDS, PHONE_WORDS, PREMIUM, SKILLS, SLOTS, ZONES, awkNeed, bookIds, defOf, xpNeed } from './data.js';
import { CH1_N, CHAPTERS, chCleared, chClr, chFinish, chStageStory, isChLast, setCurZone, zoneCh, zoneL } from './chapter.js';
import { ENDING } from './chapters/ch1.js';
import { buildWorld } from './world.js';
import { refSum } from './refine.js';
import { jobApply, jobFeedOk, jobSigDef, jobTick } from './job.js';
import { banner, dialog, fadeTo, openMenu, showDeath, showHUD, startEnding, toast } from './ui.js';
import { PVP_MUL, pvpEnd, pvpForfeit, pvpUpdate } from './pvp.js';
import { infKill, infSpawner, infWaveMul } from './inf.js';
import { autoTick, autoToggle } from './auto.js';
import { rankSync } from './rank.js';
import { cloudSync } from './cloud.js';
import { dailyAdd } from './daily.js';
import { guideEv } from './guide.js';
import { raidEnd, raidHit, raidUpdate } from './raid.js';
import { buddyOpen, buddySpawn, buddyUpdate } from './buddy.js';
import { msGot } from './goal.js';
import { towerBest, towerEnd, towerUpdate } from './tower.js';
import { plazaUpdate } from './plaza.js';
import { playCut } from './story.js';

export const G = {
  state: 'title', zone: 0, world: null, time: 0, pd: /** @type {SaveData|null} */ (null), raid: /** @type {any} */ (null), tower: /** @type {any} */ (null), plaza: /** @type {any} */ (null), flashT: 0, buddy: /** @type {any} */ (null), st: null, P: null, bori: null,
  enemies: [], projs: [], fx: [], drops: [], parts: [], texts: [], bubbles: [],
  cam: { x: 0, y: 0 }, shake: 0, hitstop: 0, flash: 0,
  zoneKills: 0, bossSpawned: false, bossDefeated: false, boss: null, exitOpen: false, spawnT: 1, eid: 0,
  pendingEvent: null, ult: null, evt: null, saveT: 0
};
export const monSpr = n => sprHi('m_' + n, MONSPR[n]);

// ---------- persistent data ----------
export const SAVEKEY = 'heesu_bori_save_v1';
/** @returns {SaveData} */
/** 세이브 고유 번호 (기기 옮기기 후 옛 기기에서 같은 희수로 중복 등록 막는 용도) */
const newSid = () => { try { if (crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) { } return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12); };
export function newPD() {
  return {
    sid: newSid(),
    guide: 0,
    lv: 1, xp: 0, gold: 30, sp: 1, skills: {}, idleT: Date.now(),
    inv: { fist: 1, cap_grey: 1, fleece: 1, sneakers: 1, silverbag: 1 },
    eq: { weapon: 'fist', hat: 'cap_grey', armor: 'fleece', shoes: 'sneakers', bag: 'silverbag' },
    foods: { persimmon: 3, popcorn: 3 }, enh: {}, ilv: {}, iexp: {}, stones: 0, zone: 0, boriJoined: false, cleared: 0, beq: { bcloth: null, btoy: null },
    stats: { kills: 0, ults: 0, deaths: 0, time: 0, eaten: 0 }
  };
}
/** 서버 세이브로 되돌리는 중엔 저장 막음 (cloudRevert) */
export let SAVE_LOCK = false;
export function setSaveLock(v) { SAVE_LOCK = v; }
export function saveGame() { if (!G.pd || SAVE_LOCK) return; if (G.state !== 'title' && G.state !== 'lobbyMenu') G.pd.idleT = Date.now(); G.pd.svT = Date.now(); try { localStorage.setItem(SAVEKEY, JSON.stringify(G.pd)); } catch (e) { } if (G.state === 'play' && !G.pvp && typeof rankSync === 'function') rankSync(); if (typeof cloudSync === 'function') cloudSync(); }
/** @returns {SaveData|null} */
export function loadGame() {
  try {
    const s = localStorage.getItem(SAVEKEY); if (!s) return null;
    const d = JSON.parse(s); const pd = newPD();
    for (const k in d) pd[k] = d[k];
    pd.stats = Object.assign(newPD().stats, d.stats || {});
    pd.beq = Object.assign({ bcloth: null, btoy: null }, d.beq || {}); pd.enh = d.enh || {}; pd.ilv = d.ilv || {}; pd.iexp = d.iexp || {}; pd.stones = d.stones || 0;
    for (const sl of SLOTS) if (!ITEMS[pd.eq[sl]]) pd.eq[sl] = newPD().eq[sl];
    // 가이드가 생기기 전 세이브: 초반을 지났으면 건너뜀
    if (d.guide === undefined) pd.guide = (d.lv >= 5 || d.cleared || d.zone > 0) ? 99 : 0;
    // 예전 세이브엔 sid 가 없음: 한 번 만들어서 바로 저장 (불러올 때마다 바뀌면 안 됨)
    if (!d.idleT) pd.idleT = Date.now();
    if (!d.sid || !d.idleT) { try { localStorage.setItem(SAVEKEY, JSON.stringify(pd)); } catch (e) { } }
    return pd;
  } catch (e) { return null; }
}
export function hasSave() { try { return !!localStorage.getItem(SAVEKEY); } catch (e) { return false; } }
export const sk = id => (G.pd && G.pd.skills[id]) || 0;

// 장비 레벨: 착용 장비와 같은 부위·같은 등급 장비를 ILV_NEED개 주우면 Lv+1, 레벨당 기본 스탯 +5%
export const ILV_NEED = 5, ILV_BONUS = 0.05;
// ---------- 개별 장비 ----------
// pd.inv·enh·ilv·iexp·ref·eq·beq 는 '장비 키' 기준. 같은 장비 첫 개는 키 = 장비 이름(예전 세이브 그대로),
// 둘째부터 '이름#xxxx'. ITEMS[키]는 원래 장비 정의를 돌려줌(data.js Proxy). 세이브 밖으로 나갈 땐 defOf로 이름만.
export const BAG_MAX = 300;
export const keysOf = (/** @type {SaveData} */ pd, id) => Object.keys(pd.inv || {}).filter(k => defOf(k) === id);
export const ownsDef = (/** @type {SaveData} */ pd, id) => keysOf(pd, id).length > 0;
/** 새 장비 키. 거래로 넘긴 키(pd.tkeys)는 서버가 묘비로 기억하니 다시 쓰지 않음 */
function newItemKey(/** @type {SaveData} */ pd, id) { const gone = pd.tkeys || []; if (!pd.inv[id] && !gone.includes(id)) return id; let k; do k = id + '#' + Math.random().toString(36).slice(2, 6); while (pd.inv[k] || gone.includes(k)); return k; }
/** 장비 1개 추가 → 키. 도감도 등록 */
export function addItem(/** @type {SaveData} */ pd, id, enh) {
  const k = newItemKey(pd, id); pd.inv[k] = 1; pd.book = pd.book || {}; pd.book[id] = 1;
  if (enh) { pd.enh = pd.enh || {}; pd.enh[k] = enh; } return k;
}
/** 장비 1개 없애기 (강화·레벨·재련 기록도 같이) */
export function dropItem(/** @type {SaveData} */ pd, k) { delete pd.inv[k]; for (const m of [pd.enh, pd.ilv, pd.iexp, pd.ref]) if (m) delete m[k]; }
/** 같은 장비가 또 나오면 보관할지 (pd.keepDup = 이 등급 이상 보관, 없으면 강화석) */
const keepDupOf = (/** @type {SaveData} */ pd, it) => pd.keepDup != null && it.rar >= pd.keepDup && Object.keys(pd.inv).length < BAG_MAX;
export const ilvOf = id => ((G.pd && G.pd.ilv) || {})[id] || 0;
const ilvMul = id => 1 + ILV_BONUS * ilvOf(id);
function feedEquip(it) {
  const pd = G.pd, cur = it.bori ? (pd.beq || {})[it.slot] : pd.eq[it.slot], ci = ITEMS[cur];
  if (!ci || (ci.rar !== it.rar && !jobFeedOk(pd, cur, it))) return false;
  pd.ilv = pd.ilv || {}; pd.iexp = pd.iexp || {}; const n = (pd.iexp[cur] || 0) + 1;
  if (n >= ILV_NEED) {
    pd.iexp[cur] = 0; pd.ilv[cur] = (pd.ilv[cur] || 0) + 1; calcStats(); sfx('lvl');
    toast(`장비 레벨업! ${ci.name} Lv.${pd.ilv[cur]} (기본 스탯 +${Math.round(ILV_BONUS * 100 * pd.ilv[cur])}%)`, 'lvl');
    const who = it.bori ? G.bori : G.P; if (who) { G.fx.push({ k: 'lvl', x: who.x, y: who.y, t: 0, dur: 1.0 }); bubble(who, it.bori ? '멍멍!! (더 좋아졌다)' : '장비가 손에 착 붙는다!', 1.3); }
  } else { pd.iexp[cur] = n; toast(`${it.name} → ${ci.name} 경험치 ${n}/${ILV_NEED}`, 'sub'); sfx('coin'); }
  return true;
}
/** 실제 착용 장비 이름 (개별 키 → 장비 이름) */
export function visEqRaw(/** @type {SaveData} */ pd) { const e = /** @type {Record<HeroSlot, ItemId>} */ ({}); for (const sl of SLOTS) e[sl] = defOf(pd.eq[sl]); return e; }
/** 화면에 보이는 장비 (꾸미기로 바꾼 겉모습 반영. 도감에 있고 색이 있는 장비만) */
export function visEq(pd) {
  const e = visEqRaw(pd), L = pd.look || {}, b = pd.book || {};
  for (const sl of LOOK_SLOTS) { const id = L[sl], it = id && ITEMS[id]; if (it && it.slot === sl && !it.bori && it.color && b[id]) e[sl] = id; }
  return e;
}
/** 착용 세트: 지금 끼고 있는 개수 */
export function eqSetN(pd, S) { const on = new Set([...SLOTS.map(sl => defOf(pd.eq[sl])), ...BSLOTS.map(sl => pd.beq && pd.beq[sl] ? defOf(pd.beq[sl]) : '')]); return S.ids.filter(id => on.has(id)).length; }
export const hairPal = k => HAIRS.find(h => h.k === k) || HAIRS[0];
/** 헤어 색 해금 여부 */
export function hairOk(pd, h) {
  if (!h.need) return true;
  if (h.need === 'book10') return bookStats(pd).n >= 10;
  if (h.need === 'book25') return bookStats(pd).n >= 25;
  if (h.need === 'loop5') return (pd.cleared || 0) >= 4;
  if (h.need === 'enh25') return Object.values(pd.enh || {}).some(v => v >= 25);
  if (h.need === 'aw50') return (pd.aw || 0) >= 50;
  if (/^ch\d+$/.test(h.need)) return chClr(pd, +h.need.slice(2)) >= 1; // 장 클리어 헤어 (장 파일 hair)
  if (h.need === 'lp20') return msGot(pd, 20);
  if (h.need === 'lp50') return msGot(pd, 50);
  if (h.need === 'tw30') return towerBest(pd) >= 30;
  if (h.need === 'pack') return !!(pd.pack && pd.pack.got);
  return false;
}
/** 도감 상태 (보유·착용 중인 장비는 자동 등록) */
export function bookStats(pd) {
  const b = pd.book = pd.book || {};
  for (const k in pd.inv) if (ITEMS[k] && !ITEMS[k].start) b[defOf(k)] = 1;
  const n = BOOK_ALL.filter(id => b[id]).length, done = {};
  for (const s of BOOK_SETS) done[s.k] = bookIds(s).every(id => b[id]);
  return { n, done };
}
export function calcStats() {
  const pd = G.pd, lv = pd.lv;
  const st = { hp: 100 + (lv - 1) * 22, mp: 50 + (lv - 1) * 8, atk: 10 + (lv - 1) * 3.5, def: 2 + (lv - 1) * 1.2, spd: 1, crit: 0.08, critMul: 1.6 };
  for (const slot of SLOTS) { const it = jobSigDef(pd, pd.eq[slot]) || ITEMS[pd.eq[slot]]; if (!it) continue; const m = ilvMul(pd.eq[slot]) * brkMul(pd.eq[slot]); st.hp += (it.hp || 0) * m; st.mp += (it.mp || 0) * m; st.atk += (it.atk || 0) * m; st.def += (it.def || 0) * m; st.spd += (it.spd || 0) * m; st.crit += (it.crit || 0) * m; }
  st.spd += 0.05 * sk('shop'); st.goldMul = 1 + 0.15 * sk('shop');
  st.hp = Math.round(st.hp * (1 + 0.05 * sk('mukbang'))); st.foodMul = 1 + 0.2 * sk('mukbang');
  st.enhs = {}; for (const sl of SLOTS) { const en = (pd.enh || {})[pd.eq[sl]] || 0; st.enhs[sl] = en; const f = ENH_FX[sl]; for (const k in f) if (k !== 'txt') st[k] += f[k] * en; } st.enh = st.enhs.weapon;
  st.atk += AWK.atk.per * awkLv('atk'); st.def += AWK.def.per * awkLv('def'); st.hp += AWK.hp.per * awkLv('hp'); st.mp += AWK.mp.per * awkLv('mp'); st.crit += AWK.crit.per * awkLv('crit');
  st.skillMul = 1 + AWK.skill.per * awkLv('skill');
  const bk = bookStats(pd); st.book = bk.n;
  st.hp += BOOK_PER_HP * bk.n + (bk.done.r0 ? 80 : 0); if (bk.done.r1) st.atk += 12; if (bk.done.r2) st.def += 12; if (bk.done.r3) st.crit += 0.03;
  for (const s of BOOK_SETS) if (s.mul && bk.done[s.k]) { st.atk *= s.mul; st.def *= s.mul; } if (bk.done.r4) st.atk *= 1.05; if (bk.done.r5) { st.atk *= 1.05; st.def *= 1.05; st.hp *= 1.05; } st.hp = Math.round(st.hp);
  for (const S of EQ_SETS) if (eqSetN(pd, S) >= S.ids.length) { const m = S.mul; st.atk *= m.atk || 1; st.def *= m.def || 1; st.hp = Math.round(st.hp * (m.hp || 1)); }
  if (G.P && G.P.buffs) { let ba = 0, bc = 0; for (const k in G.P.buffs) { ba += G.P.buffs[k].atk || 0; bc += G.P.buffs[k].crit || 0; } st.atk *= 1 + ba; st.crit += bc; }
  // 재련 추가 옵션
  { const R = refSum(pd); st.atk *= 1 + (R.atkP || 0) / 100; st.def *= 1 + (R.defP || 0) / 100; st.hp = Math.round(st.hp * (1 + (R.hpP || 0) / 100)); st.crit += (R.crit || 0) / 100; st.critMul += (R.critD || 0) / 100;
    st.spd *= 1 + (R.spdP || 0) / 100; st.goldMul *= 1 + (R.goldP || 0) / 100; st.bossMul = 1 + (R.bossP || 0) / 100; st.refBori = (R.boriP || 0) / 100; }
  st.atk = Math.round(st.atk); st.def = Math.round(st.def); st.mp = Math.round(st.mp);
  st.weapon = ITEMS[pd.eq.weapon].w; st.moveSpd = 66 * st.spd;
  st.boriMul = 1 + AWK.bori.per * awkLv('bori'); for (const sl of BSLOTS) { const it = ITEMS[(pd.beq || {})[sl]]; if (it) st.boriMul += (it.bdmg || 0) * ilvMul(pd.beq[sl]); }
  for (const sl of BSLOTS) { const en = (pd.enh || {})[(pd.beq || {})[sl]] || 0; st.enhs[sl] = en; st.boriMul += ENH_FX[sl].boriMul * en; } st.toyEnh = st.enhs.btoy; st.clothEnh = st.enhs.bcloth; if (bk.done.bori) st.boriMul += 0.15; st.boriMul += st.refBori || 0;
  jobApply(pd, st);
  G.st = st;
  if (G.P) { G.P.hp = Math.min(G.P.hp, st.hp); G.P.mp = Math.min(G.P.mp, st.mp); }
  return st;
}

// ---------- entities ----------
export function newPlayer(x, y) { return { x, y, hp: G.st.hp, mp: G.st.mp, fx: 0, fy: 1, dir: 'down', walkT: 0, moving: false, idleT: 1, atkCd: 0, atkAnim: 0, punch: 0, inv: 0, flash: 0, cds: {}, buffs: {}, eatCd: 0, castT: 0, kbx: 0, kby: 0, phoneT: 0.5, wasPhone: false }; }
export function newBori(x, y) { return { x, y, t: 0, face: 1, biteCd: 0, barkCd: 3, zoomCd: 6, target: null, run: false, zoom: null, jump: 0 }; }
export const dirOf = (fx, fy) => Math.abs(fx) > Math.abs(fy) * 1.05 ? (fx > 0 ? 'right' : 'left') : (fy > 0 ? 'down' : 'up');
export function isOnPhone() { const P = G.P; return !!P && G.state === 'play' && P.idleT > 0.3 && P.atkAnim <= 0 && P.castT <= 0 && !G.ult; }

function collide(o, r) {
  const W = G.world;
  for (const s of W.solids) { const dx = o.x - s.x, dy = o.y - s.y, d = Math.hypot(dx, dy), m = s.r + r; if (d < m && d > 0.001) { o.x = s.x + dx / d * m; o.y = s.y + dy / d * m; } }
  o.x = clamp(o.x, 20, W.W - 20); o.y = clamp(o.y, W.top || 34, W.H - 14);
}
export function moveToward(e, tx, ty, sp, dt) { const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy); if (d < 0.5) return; const s = Math.min(d, sp * dt); e.x += dx / d * s; e.y += dy / d * s; if (Math.abs(dx) > 1) e.face = dx > 0 ? 1 : -1; }
function wander(e, sp, dt, ch) { e.wT -= dt; if (e.wT <= 0) { e.wT = rand(ch * 0.6, ch * 1.4); const a = rand(0, Math.PI * 2), go = Math.random() < 0.7; e.wx = go ? Math.cos(a) : 0; e.wy = go ? Math.sin(a) : 0; } e.x += e.wx * sp * dt; e.y += e.wy * sp * dt; if (e.wx) e.face = e.wx > 0 ? 1 : -1; }
function moveAway(e, sp, dt) { const a = Math.atan2(e.y - G.P.y, e.x - G.P.x); e.x += Math.cos(a) * sp * dt; e.y += Math.sin(a) * sp * dt; e.face = Math.cos(a) > 0 ? 1 : -1; }
function nearestEnemy(x, y, maxD) { let best = null, bd = maxD; for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; const d = Math.hypot(e.x - x, e.y - y) - e.r; if (d < bd) { bd = d; best = e; } } return best; }

// ---------- text / fx helpers ----------
export function addText(x, y, txt, kind) { G.texts.push({ x: x + rand(-3, 3), y, txt: fmtNumText(txt), kind: kind || 'dmg', t: 0, dur: kind === 'crit' ? 0.9 : 0.75 }); if (G.texts.length > 60) G.texts.shift(); }
export function bubble(ent, txt, dur) { G.bubbles = G.bubbles.filter(b => b.ent !== ent); G.bubbles.push({ ent, txt, t: 0, dur: dur || 1.6 }); }
export function burst(x, y, col, n, spd) { for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), s = rand(20, spd || 70); G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: rand(0.3, 0.6), max: 0.6, col, sz: Math.random() < 0.3 ? 2 : 1, grav: 120 }); } }
export function word(x, y, txt, col, size) { G.fx.push({ k: 'word', x, y, txt, col: col || '#fff', size: size || 1.6, t: 0, dur: 0.7 }); }

// ---------- player ----------
function updatePlayer(dt) {
  jobTick(dt);
  const P = G.P, st = G.st;
  const [mx, my] = moveVec(); const mag = Math.hypot(mx, my);
  P.moving = mag > 0.18 && P.castT <= 0;
  if (P.moving) {
    const sp = st.moveSpd * (P.atkAnim > 0 ? 0.62 : 1) * clamp(mag, 0.55, 1);
    P.x += mx / mag * sp * dt; P.y += my / mag * sp * dt;
    if (P.atkAnim <= 0) { P.fx = mx / mag; P.fy = my / mag; P.dir = dirOf(P.fx, P.fy); }
    P.walkT += dt; P.idleT = 0;
  } else P.idleT += dt;
  if (P.kbx || P.kby) { P.x += P.kbx * dt; P.y += P.kby * dt; const k = Math.pow(0.002, dt); P.kbx *= k; P.kby *= k; if (Math.abs(P.kbx) + Math.abs(P.kby) < 2) P.kbx = P.kby = 0; }
  collide(P, 5);
  P.atkCd -= dt; P.atkAnim -= dt; P.inv -= dt; P.flash -= dt; P.castT -= dt; P.eatCd -= dt;
  for (const k in P.cds) if (P.cds[k] > 0) P.cds[k] -= dt;
  for (const k in P.buffs) { const b = P.buffs[k]; b.t -= dt; if (Math.random() < dt * 6) G.parts.push({ x: P.x + rand(-6, 6), y: P.y - rand(2, 18), vx: 0, vy: -20, life: 0.5, max: 0.5, col: b.crit ? '#ffd84a' : '#ff6b5a', sz: 1, grav: 0 }); if (b.t <= 0) { delete P.buffs[k]; calcStats(); toast(`${b.name} 보양 효과가 끝났어요`, 'sub'); } }
  if ((INP.atk || (G.auto && G.autoAtk)) && P.atkCd <= 0 && P.castT <= 0) doAttack();
  const onPhone = isOnPhone();
  if (onPhone && !P.wasPhone) { G.fx.push({ k: 'icon', x: P.x + 6, y: P.y - 14, icon: 'phonePop', t: 0, dur: 0.35 }); }
  P.wasPhone = onPhone;
  const wag = G.bori && Math.hypot(G.bori.x - P.x, G.bori.y - P.y) < 42 ? sk('wag') : 0;
  P.hp = Math.min(st.hp, P.hp + st.hp * (0.004 + (onPhone ? 0.012 : 0) + wag * 0.006) * dt);
  P.mp = Math.min(st.mp, P.mp + st.mp * (0.012 + (onPhone ? 0.03 : 0) + wag * 0.006) * dt);
  if (onPhone) { P.phoneT -= dt; if (P.phoneT <= 0) { P.phoneT = rand(1.1, 1.8); G.fx.push({ k: 'phone', x: P.x + rand(-4, 6), y: P.y - 25, txt: choice(PHONE_WORDS), t: 0, dur: 1.2 }); } }
}

function doAttack() {
  const P = G.P, w = G.st.weapon, fl = sk('fist');
  const t = nearestEnemy(P.x, P.y - 6, w.reach + 28);
  if (t) { const a = Math.atan2((t.y - t.h * 0.35) - (P.y - 8), t.x - P.x); P.fx = Math.cos(a); P.fy = Math.sin(a); P.dir = dirOf(P.fx, P.fy); }
  P.atkCd = 1 / (w.rate * (1 + 0.03 * fl) * (G.st.rateMul || 1)); P.atkAnim = 0.2; P.punch ^= 1; P.idleT = 0;
  const ang = Math.atan2(P.fy, P.fx);
  if (w.style === 'throw') { const sp = 230; G.projs.push({ k: 'card', x: P.x, y: P.y - 10, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: 5, dmg: G.st.atk * w.mul * (1 + 0.1 * fl), life: w.reach / sp + 0.08, pierce: G.st.pierce || 1, hit: new Set(), mine: true, rot: 0, slow: 0.01 }); sfx('swing'); return; }
  G.fx.push({ k: 'swing', x: P.x, y: P.y - 8, a: ang, reach: w.reach, arc: w.arc * Math.PI / 180, t: 0, dur: 0.18, style: w.style, wpn: G.pd.eq.weapon, side: P.punch });
  let hit = false;
  for (const e of G.enemies) {
    if (e.dead || e.spawnT > 0) continue;
    const dx = e.x - P.x, dy = (e.y - e.h * 0.35) - (P.y - 8), d = Math.hypot(dx, dy);
    if (d < w.reach + e.r && (d < e.r + 5 || angDiff(Math.atan2(dy, dx), ang) < w.arc * Math.PI / 360 + 0.25)) {
      dealDamage(e, G.st.atk * w.mul * (1 + 0.1 * fl), { kb: w.kb, ang }); hit = true;
    }
  }
  sfx(hit ? 'punch' : 'swing');
  if (hit) { G.hitstop = 0.03; G.shake = Math.max(G.shake, 1.2); }
}

export function dealDamage(e, raw, o) {
  o = o || {}; if (e.dead) return 0;
  const crit = !o.noCrit && Math.random() < G.st.crit + (o.critAdd || 0);
  let dmg = o.trueDmg ? raw : Math.max(raw * 0.2, raw - e.def * 0.5);
  if (e.rival) dmg *= o.col === 'mental' ? PVP_MUL * 0.35 : PVP_MUL;
  if (e.boss && !e.rival) dmg *= G.st.bossMul || 1;
  dmg *= rand(0.9, 1.1); if (crit) dmg *= G.st.critMul; dmg = Math.max(1, Math.round(dmg));
  e.hp -= dmg; e.flash = 0.12; if (e.raid) raidHit(e, dmg);
  if (o.kb && !e.boss) { e.kbx += Math.cos(o.ang) * o.kb; e.kby += Math.sin(o.ang) * o.kb; }
  if (o.stun) e.stun = Math.max(e.stun, e.boss ? o.stun * 0.35 : o.stun);
  if (o.slow) e.slow = Math.max(e.slow, o.slow);
  if (o.fear) e.fear = Math.max(e.fear, e.boss ? 0 : o.fear);
  if (o.confuse) e.confuse = Math.max(e.confuse, e.boss ? o.confuse * 0.4 : o.confuse);
  addText(e.x, e.y - e.h - 2, dmg, o.col || (crit ? 'crit' : 'dmg'));
  burst(e.x, e.y - e.h / 2, e.col, crit ? 7 : 3);
  if (crit) sfx('crit'); else sfx('hit');
  if (e.hp <= 0) killEnemy(e);
  return dmg;
}

export function hurtPlayer(raw, src) {
  const P = G.P; if (P.inv > 0 || G.state !== 'play' || G.ult) return;
  if (G.pvp) raw *= PVP_MUL;
  let dmg = raw * 60 / (60 + G.st.def); dmg = Math.max(1, Math.round(dmg * rand(0.9, 1.1)));
  P.hp -= dmg; P.inv = 0.5; P.flash = 0.15;
  addText(P.x, P.y - 24, dmg, 'hurt'); G.shake = Math.max(G.shake, 3); sfx('hurt');
  if (src) { const a = Math.atan2(P.y - src.y, P.x - src.x); P.kbx += Math.cos(a) * 70; P.kby += Math.sin(a) * 70; }
  if (Math.random() < 0.15) bubble(P, choice(['아야!', '아 진짜!', '앗 뜨거', '으악!', '감히 나를?!']), 1);
  if (P.hp <= 0) { P.hp = 0; playerDie(); }
}

// ---------- skills ----------
export function trySkill(id) {
  const lv = sk(id), S = SKILLS[id], P = G.P;
  if (!lv) { toast(`${S.name}: 아직 안 배웠어요 (메뉴 → 스킬)`, 'warn'); sfx('warn'); return; }
  if ((P.cds[id] || 0) > 0) return;
  if (P.mp < S.mp) { toast('MP가 부족해요! 가만히 있으면 폰 보면서 MP가 빨리 차요', 'warn'); sfx('warn'); return; }
  P.mp -= S.mp; P.cds[id] = S.cd(lv); P.idleT = 0;
  const keepAtk = G.st.atk; G.st.atk = Math.round(keepAtk * (G.st.skillMul || 1)); try { CAST[id](lv); } finally { G.st.atk = keepAtk; } guideEv('skill:' + id);
}
function aimNearest(range) { const P = G.P; const t = nearestEnemy(P.x, P.y - 6, range); if (t) { const a = Math.atan2((t.y - t.h * 0.35) - (P.y - 8), t.x - P.x); P.fx = Math.cos(a); P.fy = Math.sin(a); P.dir = dirOf(P.fx, P.fy); } return Math.atan2(P.fy, P.fx); }
const ULT_SLOTS = [[0.3, 0.19], [0.7, 0.215], [0.28, 0.45], [0.72, 0.5], [0.3, 0.58], [0.7, 0.65], [0.3, 0.73], [0.68, 0.8]];
const CAST = {
  smash(lv) {
    const P = G.P, a = aimNearest(46);
    P.x += Math.cos(a) * 7; P.y += Math.sin(a) * 7; collide(P, 5);
    P.atkAnim = 0.3; P.castT = 0.15;
    const hx = P.x + Math.cos(a) * 14, hy = P.y - 8 + Math.sin(a) * 14;
    G.fx.push({ k: 'slap', x: hx, y: hy, a, t: 0, dur: 0.45 });
    for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; const dx = e.x - P.x, dy = (e.y - e.h * 0.35) - (P.y - 8), d = Math.hypot(dx, dy); if (d < 30 + e.r && (d < e.r + 8 || angDiff(Math.atan2(dy, dx), a) < 1.3)) dealDamage(e, G.st.atk * (2.2 + 0.4 * (lv - 1)), { kb: 170, ang: a, stun: 0.6, critAdd: 0.1 }); }
    G.shake = 4; G.hitstop = 0.06; sfx('smash'); word(hx, hy - 10, '짝!', '#ffd84a', 2.2);
  },
  nag(lv) {
    const P = G.P, a0 = aimNearest(130), n = 4 + lv, spread = 0.95;
    for (let i = 0; i < n; i++) { const a = a0 - spread / 2 + spread * i / (n - 1); G.projs.push({ k: 'nag', x: P.x, y: P.y - 12, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, r: 6, dmg: G.st.atk * (0.9 + 0.15 * (lv - 1)), life: 0.95, pierce: 3, hit: new Set(), word: choice(NAG_WORDS), mine: true }); }
    P.castT = 0.2; P.atkAnim = 0.2; sfx('nag'); bubble(P, choice(['잔소리 시작한다?!', '내가 몇 번 말했어!', '앉아봐. 얘기 좀 해']), 1.2);
  },
  flash(lv) {
    const P = G.P, r = 56 + 4 * lv; P.castT = 0.45; P.dir = 'down';
    G.shake = 5; G.fx.push({ k: 'ring', x: P.x, y: P.y - 8, r, col: '#ff7ab8', t: 0, dur: 0.5 }); G.fx.push({ k: 'ring', x: P.x, y: P.y - 8, r: r * 0.7, col: '#ffffff', t: 0, dur: 0.4 }); G.fx.push({ k: 'house', x: P.x, y: P.y - 26, t: 0, dur: 0.7 });
    for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; if (Math.hypot(e.x - P.x, e.y - P.y) < r + e.r) { const st = 1.2 + 0.2 * lv; dealDamage(e, G.st.atk * (1.5 + 0.3 * (lv - 1)), { stun: st }); if (!e.dead) { e.panic = e.boss ? st * 0.35 : st; burst(e.x, e.y - e.h - 2, '#7ec8ff', 3, 30); } } }
    sfx('gohome'); word(P.x, P.y - 36, '나 집에 갈래!!', '#ffd1e6', 1.5); bubble(P, choice(['다리 아파...', '힘들어 집에 갈래ㅠ', '나 진짜 간다?!']), 1.3);
  },
  menhera(lv) {
    const lines = MENHERA_LINES.slice().sort(() => Math.random() - 0.5).slice(0, 8);
    G.ult = { t: 0, lv, dur: 3.0, applied: false, lines: lines.map((txt, i) => { const sl = ULT_SLOTS[i]; return { txt, x: sl[0] + rand(-0.06, 0.06), y: sl[1] + rand(-0.02, 0.02), d: 0.15 + i * 0.13, rot: rand(-0.14, 0.14), s: rand(0.9, 1.12) }; }) };
    G.pd.stats.ults++; G.P.inv = 3.2; G.P.castT = 0.9; sfx('ult');
  }
};
function updateUlt(dt) {
  const U = G.ult; U.t += dt;
  if (!U.applied && U.t >= 0.95) {
    U.applied = true; G.shake = 9; G.flash = 0.2;
    const dmg = G.st.atk * (G.st.skillMul || 1) * (10 + 5 * U.lv);
    for (const e of G.enemies) { if (e.dead) continue; e.spawnT = 0; dealDamage(e, dmg, { trueDmg: true, confuse: 4, col: 'mental', noCrit: true }); if (!e.dead) e.mental = 4; }
    for (let i = 0; i < 26; i++) G.parts.push({ x: G.cam.x + rand(0, VW), y: G.cam.y + rand(-20, VH * 0.6), vx: rand(-10, 10), vy: rand(30, 70), life: rand(1, 1.8), max: 1.8, col: choice(['#b45cff', '#ff7ab8', '#ffb3d9']), sz: 3, grav: 20, heart: true });
  }
  if (U.t >= U.dur) G.ult = null;
}

// ---------- bori ----------
// 보리 스킬 「언니줘!」: HP·MP가 기준 아래로 떨어지면 보리가 음식을 물어다 먹여줌 (최고급 음식 제외)
const FEED_TH = [[0, 0], [0.4, 0.3], [0.5, 0.4], [0.6, 0.5]];
function autoFeed(dt) {
  const lv = sk('feed'), P = G.P, B = G.bori, st = G.st; if (!lv || !B || !G.pd.boriJoined || !P || G.ult) return;
  G.feedCd = (G.feedCd || 0) - dt; if (G.feedCd > 0 || P.eatCd > 0) return;
  const [th, tm] = FEED_TH[lv];
  for (const k of ['hp', 'mp']) {
    const cur = k === 'hp' ? P.hp / st.hp : P.mp / st.mp; if (cur >= (k === 'hp' ? th : tm)) continue;
    const id = pickQuickFood(k, k === 'hp' ? st.hp - P.hp : st.mp - P.mp); if (!id || PREMIUM.includes(id)) continue;
    G.fx.push({ k: 'eat', icon: FOODS[id].icon, x: (B.x + P.x) / 2, y: (B.y + P.y) / 2 - 10, t: 0, dur: 0.5 });
    eatFood(id); G.feedCd = 1.2; bubble(B, choice(['멍! (언니 이거 먹어!)', '언니 줘!', '앙! (배달 왔어요)']), 1.2); return;
  }
}
function updateBori(dt) {
  const B = G.bori; if (!B || B.hidden) return; const P = G.P;
  B.t += dt; B.biteCd -= dt; B.barkCd -= dt; B.zoomCd -= dt; if (B.jump > 0) B.jump -= dt;
  if (B.zoom) {
    const z = B.zoom; z.t += dt; const pt = z.pts[z.i];
    if (pt) { moveToward(B, pt.x, pt.y, 230, dt); if (Math.hypot(pt.x - B.x, pt.y - B.y) < 4) z.i++; } else z.i = 999;
    for (const e of G.enemies) { if (e.dead || z.hit.has(e.id)) continue; if (Math.hypot(e.x - B.x, e.y - B.y) < e.r + 7) { z.hit.add(e.id); dealDamage(e, G.st.atk * (1.2 + 0.4 * z.lv) * G.st.boriMul, { kb: 80, ang: Math.atan2(e.y - B.y, e.x - B.x) }); } }
    if (Math.random() < dt * 30) G.parts.push({ x: B.x, y: B.y, vx: rand(-15, 15), vy: rand(-10, 0), life: 0.35, max: 0.35, col: '#e8dcc8', sz: 2, grav: 0 });
    B.run = true; if (z.i >= z.pts.length || z.t > 2.2) B.zoom = null;
    collide(B, 3); return;
  }
  const bl = sk('bark');
  if (bl && B.barkCd <= 0) { const r = 45 + 5 * bl; const ns = G.enemies.filter(e => !e.dead && e.spawnT <= 0 && Math.hypot(e.x - B.x, e.y - B.y) < r + e.r); if (ns.length) { B.barkCd = 9 - 0.6 * (bl - 1); sfx('bark'); bubble(B, '멍멍!', 1); G.fx.push({ k: 'ring', x: B.x, y: B.y - 5, r, col: '#ffd84a', t: 0, dur: 0.45 }); for (const e of ns) dealDamage(e, G.st.atk * (0.6 + 0.2 * bl) * G.st.boriMul, { fear: 1.6, kb: 90, ang: Math.atan2(e.y - B.y, e.x - B.x) }); } }
  const zl = sk('zoomies');
  if (zl && B.zoomCd <= 0) { const ns = G.enemies.filter(e => !e.dead && e.spawnT <= 0 && Math.hypot(e.x - P.x, e.y - P.y) < 95); if (ns.length >= 2) { B.zoomCd = 12; ns.sort((a, b) => Math.hypot(a.x - B.x, a.y - B.y) - Math.hypot(b.x - B.x, b.y - B.y)); const pts = ns.slice(0, 6).map(e => ({ x: e.x + rand(-4, 4), y: e.y + rand(-3, 3) })); pts.push({ x: P.x + 10, y: P.y + 3 }); B.zoom = { t: 0, i: 0, pts, hit: new Set(), lv: zl }; bubble(B, '우다다다!', 1.2); } }
  let tgt = null;
  if (B.target && !B.target.dead && Math.hypot(B.target.x - P.x, B.target.y - P.y) < 115) tgt = B.target;
  else { tgt = null; let bd = 75; for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; if (Math.hypot(e.x - P.x, e.y - P.y) > 105) continue; const d = Math.hypot(e.x - B.x, e.y - B.y); if (d < bd) { bd = d; tgt = e; } } B.target = tgt; }
  if (tgt) {
    const d = Math.hypot(tgt.x - B.x, tgt.y - B.y);
    if (d > tgt.r + 6) { moveToward(B, tgt.x, tgt.y, 100, dt); B.run = true; }
    else { B.run = false; B.face = tgt.x > B.x ? 1 : -1; if (B.biteCd <= 0) { B.biteCd = 0.75; dealDamage(tgt, G.st.atk * (0.4 + 0.15 * sk('bite')) * G.st.boriMul, { kb: 30, ang: Math.atan2(tgt.y - B.y, tgt.x - B.x) }); G.fx.push({ k: 'bite', x: tgt.x, y: tgt.y - tgt.h * 0.5, t: 0, dur: 0.3 }); if (Math.random() < 0.15) bubble(B, choice(['앙!', '왈!', '으르릉']), 0.8); } }
  } else {
    const side = B.x < P.x ? -1 : 1; const tx = P.x + side * 13, ty = P.y + 3; const d = Math.hypot(tx - B.x, ty - B.y);
    if (d > 5) { moveToward(B, tx, ty, Math.max(G.st.moveSpd * 1.2, d > 60 ? 160 : 75), dt); B.run = d > 7; } else B.run = false;
    if (!B.run && isOnPhone()) B.face = P.x > B.x ? 1 : -1;
  }
  if (Math.hypot(P.x - B.x, P.y - B.y) > 220) { B.x = P.x - 12; B.y = P.y + 3; }
  B.x = clamp(B.x, 20, G.world.W - 20); B.y = clamp(B.y, G.world.top || 34, G.world.H - 14);
}

// ---------- 회차 (NG+) ----------
const LOOP_CAP = 10;
/** 회차 → 난이도 단계. 11회차부터도 계속 오르되 증가폭은 절반 (예: 50회차 = 30단계) */
export const loopEff = cl => cl <= LOOP_CAP ? cl : LOOP_CAP + (cl - LOOP_CAP) * LOOP_AFTER;
const LOOP_AFTER = 0.75;
function loopLv() { return G.pvp ? 0 : G.inf ? G.inf.loop : G.tower ? G.tower.L : G.pd ? zoneL(G.pd, G.zone || 0) : 0; }
const FIRST_BOSS = { hp: 0.7, atk: 0.75 };
export const LM_HP = 1.3, LM_ATK = 1.0, LM_XP = 0.2, LM_GOLD = 0.4;
/** 고회차 가속: 30단계(1장 약 37회차)부터 단계마다 체력 ×1.05·공격 ×1.03·골드 ×1.02씩 더 → 풀강 유저도 회차를 올리다 막힘 */
const LM_FAST = 30, LM_FAST_HP = 0.05, LM_FAST_ATK = 0.03, LM_FAST_GOLD = 0.02;
const lmFast = (L, r) => L > LM_FAST ? Math.pow(1 + r, L - LM_FAST) : 1;
export function loopMul() { const L = loopLv(); return { L, hp: (1 + LM_HP * L) * lmFast(L, LM_FAST_HP), atk: (1 + LM_ATK * L) * lmFast(L, LM_FAST_ATK), def: 3 * L, spd: Math.min(1.3, 1 + 0.05 * L), xp: 1 + LM_XP * L, gold: (1 + LM_GOLD * L) * lmFast(L, LM_FAST_GOLD), item: Math.min(1.6, 1 + 0.2 * L), cnt: Math.min(2, 1 + 0.25 * L), elite: Math.min(0.25, 0.07 * L), legend: Math.min(0.3, 0.08 * L) }; }
export const zoneQuota = Z => Math.round(Z.quota * loopMul().cnt);
// 처치 1마리당 등급별 드롭 확률 (일반 몬스터 기준). 높은 등급부터 굴려서 하나만 떨어짐
const DROP_RATE = [1 / 80, 1 / 250, 1 / 800, 1 / 2000, 1 / 5000, 1 / 12000];
const DROP_MUL = { normal: 1, elite: 5, boss: 25 };
/** 사냥·보스전 강화석 (11/24): 일반 몬스터 1%로 1개 · 정예 10%로 1~2개 · 보스는 확정 2 + 회차 단계/4개(최대 20). PvP·레이드는 없음.
 * 엔드급(시간당 약 4,000마리·정예 25%·보스 약 20마리, 45단계) ≈ 시간당 +370개 — 서버 세이브 검사 한도(1,500/시간) 안 */
const STONE_DROP = { normal: 0.01, elite: 0.1, bossBase: 2, bossPerL: 0.25, bossMax: 20 };
function killStones(e, L) {
  if (G.pvp || G.raid || e.rival) return 0;
  if (e.boss) return Math.min(STONE_DROP.bossMax, STONE_DROP.bossBase + Math.floor(L * STONE_DROP.bossPerL));
  const dm = (G.st && G.st.dropMul) || 1;
  if (e.elite) return Math.random() < STONE_DROP.elite * dm ? 1 + (Math.random() < 0.5 ? 1 : 0) : 0;
  return Math.random() < STONE_DROP.normal * dm ? 1 : 0;
}
function rollDrop(mul) {
  const L = loopLv(), lm = loopMul().item * (mul || 1) * ((G.st && G.st.dropMul) || 1);
  for (let r = DROP_RATE.length - 1; r >= 0; r--) {
    if (Math.random() >= DROP_RATE[r] * lm) continue;
    const pool = Object.keys(ITEMS).filter(id => { const it = ITEMS[id]; return it.rar === r && it.tier && !it.bossOnly && it.tier <= G.zone + 1 + L && L >= it.rar - 3 && (!it.bori || G.pd.boriJoined); });
    if (pool.length) return choice(pool);
  }
  return null;
}
function rollItem(minRar, legendChance) {
  const L = loopLv(); const ok = id => { const it = ITEMS[id]; return it.tier && !it.bossOnly && it.tier <= G.zone + 1 + L && (!it.bori || G.pd.boriJoined) && it.rar >= (minRar || 0); };
  const all = Object.keys(ITEMS).filter(ok); const leg = all.filter(id => ITEMS[id].rar >= 3), rest = all.filter(id => ITEMS[id].rar < 3);
  if (leg.length && Math.random() < (legendChance || 0)) return choice(leg); return rest.length ? choice(rest) : (leg.length ? choice(leg) : null);
}

function loopIntro(L) {
  const n = (G.pd.cleared || 0) + 1, LM = loopMul();
  const lines = L === 1 ? [
    { who: 'sys', text: '다시 에버랜드에 발을 들인 순간...\n공기가 확 달라졌다.' },
    { who: 'sys', text: '【2회차】 한층 더 강해진 몬스터들이 훨씬 더 많이 몰려온다!\n황금 왕관을 쓴 「정예 몬스터」까지 어슬렁거린다.' },
    { who: 'sys', text: '대신 이런 소문이 돌고 있다.\n이번 회차부터 아무도 본 적 없는 「신화」 장비가 떨어진다고...' },
    { who: 'sys', text: '그리고 3회차까지 살아남으면,\n그보다 더 위인 「초월」 장비까지 손에 넣을 수 있다고!' },
    { who: 'hee', text: '신화...? 초월...?\n그건 못 참지. 싹 다 털어간다!!' },
    { who: 'bori', text: '멍멍!! (나도 황금 뼈다구 갖고 싶어!)' }
  ] : [
    { who: 'sys', text: `【${n}회차】 몬스터가 또 한 번 강해졌다!\n체력 ×${LM.hp.toFixed(1)} · 공격 ×${LM.atk.toFixed(2).replace(/0$/, '')} · 정예 출현 ${Math.round(LM.elite * 100)}%` },
    { who: 'sys', text: L === 2 ? '드디어 「초월」 장비가 풀렸다!\n보상도 골드 ×' + LM.gold.toFixed(1) + ' · 아이템 ×' + LM.item.toFixed(1) + '로 늘었다.' : `보상도 골드 ×${LM.gold.toFixed(1)} · 아이템 ×${LM.item.toFixed(1)}!\n신화·초월 장비가 더 자주, 더 앞 스테이지에서 나온다.` },
    { who: 'hee', text: choice(['아직 배고프다. 더 강한 걸로 가져와!', '이번엔 초월 풀세트 맞춘다!', '보리야, 오늘도 털러 가자!']) }
  ];
  dialog(lines);
}

// 희수 스킬 「오빠 살려줘!」: 쓰러지면 오빠가 달려와 부활 (스테이지당 1번, 할로윈파티는 보스 웨이브마다 충전)
function husbandSave() {
  const lv = sk('husband'), P = G.P; if (!lv || G.husUsed || !P) return false;
  G.husUsed = true; P.hp = Math.round(G.st.hp * (lv >= 2 ? 0.6 : 0.3)); P.inv = lv >= 2 ? 3 : 1.5; P.kbx = P.kby = 0;
  for (const e of G.enemies) if (!e.dead && !e.boss && Math.hypot(e.x - P.x, e.y - P.y) < 50) { const a = Math.atan2(e.y - P.y, e.x - P.x); e.kbx = Math.cos(a) * 160; e.kby = Math.sin(a) * 160; e.stun = Math.max(e.stun, 0.8); }
  G.fx.push({ k: 'hus', x: P.x - 16, y: P.y, t: 0, dur: 1.6 }); G.fx.push({ k: 'ring', x: P.x, y: P.y - 8, r: 50, col: '#7ec8ff', t: 0, dur: 0.6 });
  G.shake = 5; sfx('lvl'); word(P.x, P.y - 34, '오빠 살려줘!!', '#7ec8ff', 1.6);
  bubble(P, choice(['오빠아아!!', '살았다...', '역시 우리 오빠']), 1.8);
  toast(`오빠가 달려와서 희수를 일으켜줬어요! (HP ${lv >= 2 ? 60 : 30}%${lv >= 2 ? ' · 3초 무적' : ''})`, 'lvl');
  return true;
}

// ---------- enemies ----------
export function spawnEnemy(type, x, y) {
  const m = MONS[type], s = monSpr(m.spr), sc = m.scale || 1;
  const LM = loopMul(); let sc2 = sc, hpM = LM.hp, atkM = LM.atk; const elite = LM.L > 0 && !m.boss && !G.pvp && Math.random() < LM.elite; if (elite) { hpM *= 2.5; atkM *= 1.3; sc2 = sc * 1.25; }
  const WM = infWaveMul(); const hp0 = Math.round(m.hp * hpM * WM.hp);
  const e = { type, m, x, y, hp: hp0, maxHp: hp0, atk: m.atk * atkM * WM.atk, def: m.def + LM.def, spd: m.spd * LM.spd, elite, r: m.r, h: s.H * sc2, w: s.W * sc2, sc: sc2, boss: !!m.boss, col: m.col, t: rand(0, 10), atkCd: rand(0.5, 1.2), kbx: 0, kby: 0, stun: 0, slow: 0, fear: 0, confuse: 0, mental: 0, flash: 0, wx: 0, wy: 0, wT: 0, st: 'idle', stT: 0, spawnT: 0.45, id: ++G.eid, fly: !!m.fly, face: 1, hopY: 0 };
  G.enemies.push(e); return e;
}
export const AI = {
  hop(e, dt, sp, dP) { const c = e.t % 1.1; e.hopY = c < 0.45 ? Math.sin(c / 0.45 * Math.PI) * 4 : 0; if (dP < 130) { if (c < 0.45) moveToward(e, G.P.x, G.P.y, sp * 2.3, dt); } else wander(e, sp, dt, 1.5); },
  float(e, dt, sp, dP) { e.hopY = 3 + Math.sin(e.t * 3) * 2; if (dP < 140) { const a = Math.atan2(G.P.y - e.y, G.P.x - e.x) + Math.sin(e.t * 2) * 0.9; e.x += Math.cos(a) * sp * dt; e.y += Math.sin(a) * sp * dt; e.face = Math.cos(a) > 0 ? 1 : -1; } else wander(e, sp, dt, 1.2); },
  chase(e, dt, sp, dP) { if (dP < 150) moveToward(e, G.P.x, G.P.y, sp, dt); else wander(e, sp * 0.6, dt, 1.5); },
  charge(e, dt, sp, dP) {
    if (e.st === 'tele') { e.stT -= dt; if (e.stT <= 0) { e.st = 'dash'; e.stT = 0.55; } return; }
    if (e.st === 'dash') { e.stT -= dt; e.x += e.dx * sp * 3.6 * dt; e.y += e.dy * sp * 3.6 * dt; if (Math.random() < dt * 20) G.parts.push({ x: e.x, y: e.y, vx: 0, vy: -8, life: 0.3, max: 0.3, col: '#e8dcc8', sz: 2, grav: 0 }); if (e.stT <= 0) { e.st = 'rest'; e.stT = 1.0; } return; }
    if (e.st === 'rest') { e.stT -= dt; if (e.stT <= 0) e.st = 'idle'; return; }
    if (dP < 78 && dP > 18) { e.st = 'tele'; e.stT = 0.6; const a = Math.atan2(G.P.y - e.y, G.P.x - e.x); e.dx = Math.cos(a); e.dy = Math.sin(a); e.face = e.dx > 0 ? 1 : -1; G.fx.push({ k: 'line', x: e.x, y: e.y - 4, a, len: sp * 3.6 * 0.55, w: 8, t: 0, dur: 0.6 }); return; }
    if (dP < 150) moveToward(e, G.P.x, G.P.y, sp, dt); else wander(e, sp * 0.6, dt, 1.5);
  },
  ranged(e, dt, sp, dP) {
    if (dP < 155) {
      if (dP > 85) moveToward(e, G.P.x, G.P.y, sp, dt); else if (dP < 55) moveAway(e, sp, dt);
      e.face = G.P.x > e.x ? 1 : -1;
      if (e.shootT == null) e.shootT = rand(0.8, 1.8);
      e.shootT -= dt; if (e.shootT <= 0) { e.shootT = 2.3 + rand(0, 0.6); shootAt(e, e.m.proj); }
    } else wander(e, sp * 0.6, dt, 1.5);
  },
};
// ---------- 장 보스 패턴은 src/chapters/chN.js 의 ai (아래에서 합침) · 공용 돌진 도우미 ----------
/** 일직선 돌진 준비 (빨간 줄 예고) */
export function aimDash(e, len, w, say) { const a = Math.atan2(G.P.y - e.y, G.P.x - e.x); e.dx = Math.cos(a); e.dy = Math.sin(a); e.face = e.dx > 0 ? -1 : 1; G.fx.push({ k: 'line', x: e.x, y: e.y - 6, a, len, w, t: 0, dur: e.stT }); if (say) bubble(e, say, 1); }
export const dashStep = (e, spd, dt) => { const W = G.world; e.x += e.dx * spd * dt; e.y += e.dy * spd * dt; if (Math.random() < dt * 25) G.parts.push({ x: e.x + rand(-8, 8), y: e.y, vx: 0, vy: -8, life: 0.35, max: 0.35, col: '#e8e8f0', sz: 2, grav: 0 }); return e.x < 36 || e.x > W.W - 36 || e.y < (W.top || 34) + 36 || e.y > W.H - 30; };
for (const ch of CHAPTERS) if (ch && ch.ai) Object.assign(AI, ch.ai);
export function shootAt(e, kind, ang, spd) {
  const sy = e.y - e.h * 0.5 - (e.hopY || 0);
  const a = ang != null ? ang : Math.atan2(G.P.y - 8 - sy, G.P.x - e.x);
  const sp = spd || 92;
  G.projs.push({ k: kind, x: e.x, y: sy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 3, dmg: e.atk * 0.8, life: 3.2, enemy: true, rot: rand(0, 6), col: choice(['#ff7ab8', '#ffd84a', '#6fb8ff', '#7ccf5a', '#b45cff']) });
}
function updateEnemy(e, dt) {
  e.t += dt; if (e.flash > 0) e.flash -= dt;
  if (e.dead) { e.deadT -= dt; if (e.deadT <= 0) e.gone = true; return; }
  if (e.spawnT > 0) { e.spawnT -= dt; return; }
  e.x += e.kbx * dt; e.y += e.kby * dt; const kd = Math.pow(0.003, dt); e.kbx *= kd; e.kby *= kd;
  e.atkCd -= dt; if (e.slow > 0) e.slow -= dt; if (e.mental > 0) e.mental -= dt; if (e.panic > 0) e.panic -= dt;
  const P = G.P, dP = Math.hypot(P.x - e.x, P.y - e.y);
  const sp = e.spd * (e.slow > 0 ? 0.55 : 1);
  if (e.stun > 0) e.stun -= dt;
  else if (e.confuse > 0) { e.confuse -= dt; wander(e, sp * 0.8, dt, 0.4); }
  else if (e.fear > 0) { e.fear -= dt; moveAway(e, sp * 1.2, dt); }
  else AI[e.m.ai](e, dt, sp, dP);
  if (e.stun <= 0 && e.confuse <= 0 && e.fear <= 0 && (e.hopY || 0) < 9 && dP < e.r + 6 && e.atkCd <= 0) { hurtPlayer(e.atk, e); e.atkCd = 1.0; }
  if (!e.fly) collide(e, e.r * 0.7); else { e.x = clamp(e.x, 20, G.world.W - 20); e.y = clamp(e.y, G.world.top || 34, G.world.H - 14); }
}
function separateEnemies() {
  const L = G.enemies;
  for (let i = 0; i < L.length; i++) { const a = L[i]; if (a.dead) continue; for (let j = i + 1; j < L.length; j++) { const b = L[j]; if (b.dead) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = (a.r + b.r) * 0.8; if (d < m && d > 0.01) { const p = (m - d) / 2, wa = a.boss ? 0.1 : 1, wb = b.boss ? 0.1 : 1; a.x -= dx / d * p * wa; a.y -= dy / d * p * wa; b.x += dx / d * p * wb; b.y += dy / d * p * wb; } } }
}
function killEnemy(e) {
  if (e.rival) { e.hp = 0; pvpEnd(true, `${e.nick}의 희수 KO!`); return; }
  e.dead = true; e.deadT = 0.25; e.hp = 0; G.pd.stats.kills++; dailyAdd('kill'); guideEv('kill'); if (e.boss) { dailyAdd('boss'); G.pd.stats.boss = (G.pd.stats.boss || 0) + 1; }
  burst(e.x, e.y - e.h / 2, e.col, e.boss ? 40 : 10, e.boss ? 140 : 80); burst(e.x, e.y - e.h / 2, '#ffffff', 4);
  const LM = loopMul(), em = e.elite ? 1 : 0, RW = infWaveMul().rew;
  sfx('pop'); gainXp(Math.round(e.m.xp * LM.xp * (em ? 3 : 1) * RW));
  const gold = Math.round(randi(e.m.gold[0], e.m.gold[1]) * G.st.goldMul * LM.gold * (em ? 4 : 1) * RW);
  if (em) { addText(e.x, e.y - e.h - 8, '정예 처치!', 'crit'); G.shake = 3; }
  if (gold > 0) { const n = Math.min(e.boss ? 12 : 4, Math.max(1, Math.ceil(gold / 6))); let left = gold; for (let i = 0; i < n; i++) { const a = i === n - 1 ? left : Math.floor(gold / n); left -= a; spawnDrop('gold', null, a, e.x, e.y); } }
  { const ns = killStones(e, LM.L); // 보스는 바로 지급(보스 타워는 처치 즉시 끝나서 땅에 떨어진 건 못 주움)
    if (ns > 0 && e.boss) { G.pd.stones = (G.pd.stones || 0) + ns; addText(e.x, e.y - e.h - 18, '강화석 +' + ns, 'mana'); } else if (ns > 0) spawnDrop('stone', null, ns, e.x, e.y); }
  if (e.boss) { spawnDrop('food', 'eel', 1, e.x, e.y); if (G.zone >= 1) spawnDrop('food', G.zone % 2 ? 'banhmi' : 'jjukkumi', 1, e.x, e.y); for (let i = 0; i < 3; i++) spawnDrop('food', rollFood(), 1, e.x, e.y); if (!G.inf) for (const id of (e.m.drops || [])) spawnDrop('item', id, 1, e.x, e.y); { const id = rollDrop(DROP_MUL.boss); if (id) spawnDrop('item', id, 1, e.x, e.y); } }
  else {
    if (Math.random() < 0.14) spawnDrop('food', rollFood(), 1, e.x, e.y);
    if (em) spawnDrop('food', rollFood(), 1, e.x, e.y);
    { const id = rollDrop(em ? DROP_MUL.elite : DROP_MUL.normal); if (id) spawnDrop('item', id, 1, e.x, e.y); }
  }
  if (G.inf) infKill(e); else if (e.boss) onBossDefeated(e); else if (!G.bossSpawned) G.zoneKills++;
}
const rollFood = () => wpick(FOOD_ORDER.map(id => [id, FOODS[id].w]));

// ---------- drops ----------
function spawnDrop(kind, id, amt, x, y) { const a = rand(0, 6.28), s = rand(15, 45); G.drops.push({ kind, id, amt, x, y, z: 4, vz: rand(40, 70), vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, t: 0 }); }
function updateDrops(dt) {
  const P = G.P;
  for (const d of G.drops) {
    d.t += dt;
    if (d.z > 0 || d.vz > 0) { d.vz -= 220 * dt; d.z += d.vz * dt; if (d.z <= 0) { d.z = 0; d.vz = Math.abs(d.vz) > 25 ? -d.vz * 0.4 : 0; } d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= Math.pow(0.05, dt); d.vy *= Math.pow(0.05, dt); }
    const dd = Math.hypot(P.x - d.x, P.y - 4 - d.y);
    if (d.t > 0.45 && (dd < (G.auto ? 90 : 44) || d.mag)) { d.mag = true; moveToward(d, P.x, P.y - 4, 160 + d.t * 40, dt); }
    if (d.t > 0.45 && dd < 8) { pickup(d); d.gone = true; }
    if (d.kind !== 'item' && d.kind !== 'stone' && d.t > 45) d.gone = true;
  }
  G.drops = G.drops.filter(d => !d.gone);
}
function pickup(d) {
  const pd = G.pd, P = G.P;
  if (d.kind === 'gold') { pd.gold += d.amt; addText(P.x, P.y - 28, '+' + d.amt + 'G', 'gold'); sfx('coin'); }
  else if (d.kind === 'stone') { pd.stones = (pd.stones || 0) + d.amt; addText(P.x, P.y - 32, '강화석 +' + d.amt, 'mana'); sfx('ding'); }
  else if (d.kind === 'food') { pd.foods[d.id] = (pd.foods[d.id] || 0) + 1; addText(P.x, P.y - 30, '+' + FOODS[d.id].name, 'food'); sfx('ding'); if (PREMIUM.includes(d.id)) toast(`${FOODS[d.id].name} 획득! 최고급 보양식`, 'lvl'); }
  else if (d.kind === 'item') {
    const it = ITEMS[d.id], own = ownsDef(pd, d.id), keep = own && keepDupOf(pd, it);
    const fed = !keep && feedEquip(it), isNewBook = !(pd.book || {})[d.id];
    if (keep) { addItem(pd, d.id); if (it.bori) pd.newBori = true; else pd.newItem = true; toast(`${it.name} (중복) → 가방에 보관 (메뉴 → ${it.bori ? '보리' : '장비'})`, 'item r' + it.rar); sfx('ding'); }
    else if (own) { if (fed) return; const s = dupStones(d.id); pd.stones = (pd.stones || 0) + s; toast(s ? `${it.name} (중복) → 강화석 ${s}개` : `${it.name} (중복) → 강화석은 꽝...`, 'sub'); if (s) sfx('coin'); }
    else if (it.bori) { const k = addItem(pd, d.id); if (!pd.beq[it.slot]) { pd.beq[it.slot] = k; calcStats(); toast(`${it.name} 획득! 보리가 바로 ${it.slot === 'btoy' ? '물었어요' : '입었어요'}`, 'item r' + it.rar); if (G.bori) bubble(G.bori, '멍멍! (신남)', 1.4); } else { pd.newBori = true; toast(`보리 장비 획득: ${it.name}! (메뉴 → 보리)`, 'item r' + it.rar); } sfx('ding'); }
    else { addItem(pd, d.id); pd.newItem = true; toast(`새 장비 획득: ${it.name}! (메뉴 → 장비)`, 'item r' + it.rar); sfx('ding'); }
    if (isNewBook) bookNotify(d.id);
  }
}
/** 도감 새로 등록 알림 + 세트 완성 축하 */
export function bookNotify(id) {
  const pd = G.pd, before = bookStats(pd).done; pd.book[id] = 1; calcStats(); const after = bookStats(pd);
  toast(`📖 도감 등록! ${ITEMS[id].name} (${after.n}/${BOOK_ALL.length})`, 'sub');
  for (const s of BOOK_SETS) if (after.done[s.k] && !before[s.k]) { toast(`📖 ${s.name} 도감 완성! ${s.txt}`, 'lvl'); sfx('lvl'); }
}
// ---------- 강화 (+20, 확률) · 강화석 ----------
// 강화: 모든 장비(보리 포함) +25까지. 0→+25 기댓값 약 500만G (+17 약 15만, +20 약 52만)
export const ENH_MAX = 25;
const ENH_P    = [1, .95, .9, .85, .8, .75, .7, .65, .6, .55, .5, .45, .4, .38, .35, .33, .31, .3, .29, .28, .27, .26, .25, .24, .22];
const ENH_DOWN = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, .1, .1, .12, .14, .15, .15, .16, .17, .18, .2, .2, .2, .22, .24];
const ENH_DEST = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, .01, .01, .015, .02, .02, .02, .025, .025, .03, .03, .035, .035, .04];
export const enhReset = lv => lv >= 20 ? 17 : 12; // 파괴 시 떨어지는 단계
export const enhCost = lv => Math.round(140 * Math.pow(1.3, lv));
// 강화석: +20 이상은 개수를 크게 올려 강화석이 병목이 되게 (강화석으로 +25 = 장비당 약 128만G + 약 2,700개)
const ENH_STONE_HIGH = [50, 80, 120, 160, 200];
export const enhStoneCost = lv => lv < 10 ? 1 : lv < 15 ? 3 : lv < 18 ? 6 : lv < 20 ? 10 : ENH_STONE_HIGH[lv - 20] || 200;
// 부위별 강화 1단계 효과
export const ENH_FX = {
  weapon: { atk: 2.5, crit: 0.01, txt: en => `공격 +${+(2.5 * en).toFixed(1)} · 치명 +${en}%` },
  hat:    { def: 1, hp: 12, txt: en => `방어 +${en} · HP +${12 * en}` },
  armor:  { def: 1.5, hp: 20, txt: en => `방어 +${+(1.5 * en).toFixed(1)} · HP +${20 * en}` },
  shoes:  { spd: 0.008, def: 0.5, txt: en => `이속 +${+(0.8 * en).toFixed(1)}% · 방어 +${+(0.5 * en).toFixed(1)}` },
  bag:    { mp: 6, crit: 0.003, txt: en => `MP +${6 * en} · 치명 +${+(0.3 * en).toFixed(1)}%` },
  bcloth: { boriMul: 0.03, txt: en => `보리 공격 +${3 * en}%` },
  btoy:   { boriMul: 0.03, txt: en => `보리 공격 +${3 * en}%` }
};
// 분해 강화석 (등급별, 화면에 숫자로 보임)
const STONE_YIELD = [1, 2, 4, 10, 25, 60];
// 사냥 중 주운 중복 장비 강화석 (평균값, 소수는 확률: 0.5 = 50%로 1개). 엔드급 자동사냥 시간당 약 350개 → 강화석으로 +25 1개 ≈ 사냥 8시간
const DUP_YIELD = [0.5, 1.5, 4, 10, 25, 60];
const dupStones = id => { const v = DUP_YIELD[ITEMS[id].rar] || 1, w = Math.floor(v); return w + (Math.random() < v - w ? 1 : 0); };
export const stoneYield = id => STONE_YIELD[ITEMS[id].rar] || 1;
export function canDismantle(id) { const it = ITEMS[id], pd = G.pd; return !!(it && !it.start && !it.job && pd.inv[id] && pd.eq[it.slot] !== id && (pd.beq || {})[it.slot] !== id && !((pd.enh || {})[id] > 0) && !ilvOf(id) && !((pd.iexp || {})[id] > 0)); }
export function dismantle(ids) { let s = 0, n = 0; for (const id of ids) { if (!canDismantle(id)) continue; s += stoneYield(id); n++; dropItem(G.pd, id); } G.pd.stones = (G.pd.stones || 0) + s; return { n, s }; }
export function enhOdds(lv, useStone) { let p = ENH_P[lv], dn = ENH_DOWN[lv], ds = ENH_DEST[lv]; if (useStone) { const add = Math.min(0.1, 1 - p); p += add; const take = Math.min(add, dn); dn -= take; } return { p, dn, ds, protect: !!useStone }; }
const enhTarget = slot => BSLOTS.includes(slot) ? (G.pd.beq || {})[slot] : G.pd.eq[slot || 'weapon'];
export function tryEnhance(useStone, slot) {
  const pd = G.pd, wid = enhTarget(slot); if (!wid) return null; pd.enh = pd.enh || {}; const en = pd.enh[wid] || 0; if (en >= ENH_MAX) return null;
  const cost = enhCost(en), sc = enhStoneCost(en); if (pd.gold < cost || (useStone && (pd.stones || 0) < sc)) return null;
  pd.gold -= cost; if (useStone) pd.stones -= sc;
  const o = enhOdds(en, useStone), r = Math.random(); let res;
  if (r < o.p) { pd.enh[wid] = en + 1; res = 'up'; }
  else if (r < o.p + o.dn) { pd.enh[wid] = Math.max(0, en - 1); res = 'down'; }
  else if (r < o.p + o.dn + o.ds) { if (o.protect) { pd.enh[wid] = Math.max(0, en - 1); res = 'saved'; } else { pd.enh[wid] = Math.min(en, enhReset(en)); res = 'boom'; } }
  else res = 'keep';
  dailyAdd('enh'); if (res === 'up') guideEv('enh');
  calcStats(); saveGame(); return { res, from: en, to: pd.enh[wid], id: wid };
}
// ---------- 한계 돌파 (+26~+30): +25 장비만. 강화석이 많이 들고 성공률 낮음, 실패해도 하락·파괴 없음. 단계마다 장비 기본 능력치 +3% ----------
export const BRK_MAX = 30, BRK_STONE = [1000, 1500, 2000, 2500, 3000], BRK_P = [0.09, 0.07, 0.05, 0.04, 0.03], BRK_STEP = 0.03;
export const brkCost = en => ({ stones: BRK_STONE[en - ENH_MAX] || 0, gold: enhCost(en), p: BRK_P[en - ENH_MAX] || 0 });
const brkMul = id => 1 + BRK_STEP * Math.max(0, ((G.pd.enh || {})[id] || 0) - ENH_MAX);
export function tryBreak(slot) {
  const pd = G.pd, wid = enhTarget(slot); if (!wid) return null; pd.enh = pd.enh || {}; const en = pd.enh[wid] || 0;
  if (en < ENH_MAX || en >= BRK_MAX) return null; const c = brkCost(en);
  if (pd.gold < c.gold || (pd.stones || 0) < c.stones) return null;
  pd.gold -= c.gold; pd.stones -= c.stones; const up = Math.random() < c.p; if (up) pd.enh[wid] = en + 1;
  pd.stats.brkTry = (pd.stats.brkTry || 0) + 1; dailyAdd('enh');
  calcStats(); saveGame(); return { res: up ? 'up' : 'keep', from: en, to: pd.enh[wid], id: wid };
}
export const sellPrice = id => { const it = ITEMS[id]; return it.price ? Math.floor(it.price * 0.3) : [40, 150, 400, 800, 1600, 3200][it.rar]; };

// ---------- food ----------
export function eatFood(id) {
  const pd = G.pd, P = G.P, f = FOODS[id]; if (!pd.foods[id] || P.eatCd > 0) return false;
  pd.foods[id]--; P.eatCd = 0.5; P.idleT = 0; if (f.eatLine) bubble(P, choice(f.eatLine), 1.4);
  const m = G.st.foodMul, hp = Math.round(G.st.hp * f.hp * m), mp = Math.round(G.st.mp * f.mp * m);
  if (f.buff) { P.buffs[f.buff.id] = Object.assign({}, f.buff); calcStats(); toast(`${f.name} 보양! ${f.buff.t}초간 ` + [f.buff.atk ? `공격력 +${Math.round(f.buff.atk * 100)}%` : '', f.buff.crit ? `치명타 +${Math.round(f.buff.crit * 100)}%` : ''].filter(Boolean).join(' · '), 'lvl'); }
  P.hp = Math.min(G.st.hp, P.hp + hp); P.mp = Math.min(G.st.mp, P.mp + mp);
  if (hp) addText(P.x - 7, P.y - 26, '+' + hp, 'heal'); if (mp) addText(P.x + 7, P.y - 26, '+' + mp, 'mana');
  G.fx.push({ k: 'eat', x: P.x, y: P.y - 24, icon: f.icon, t: 0, dur: 0.8 });
  bubble(P, choice(['냠냠', '맛있다!', '존맛탱', '살 것 같아~', '하나 더?']), 1);
  sfx('eat'); pd.stats.eaten++; return true;
}
function quickFood(kind) {
  const P = G.P, st = G.st, missing = kind === 'hp' ? st.hp - P.hp : st.mp - P.mp;
  const pick = pickQuickFood(kind, missing);
  if (!pick) { toast(kind === 'hp' ? 'HP 회복 음식이 없어요! (메뉴 → 배달앱)' : 'MP 회복 음식이 없어요! (메뉴 → 배달앱)', 'warn'); sfx('warn'); return; }
  eatFood(pick);
}
export function pickQuickFood(kind, missing) {
  const st = G.st; const cands = FOOD_ORDER.filter(id => G.pd.foods[id] > 0 && FOODS[id][kind] > 0 && !PREMIUM.includes(id));
  if (!cands.length) return PREMIUM.find(id => G.pd.foods[id] > 0) || null;
  const val = id => FOODS[id][kind] * (kind === 'hp' ? st.hp : st.mp) * st.foodMul;
  cands.sort((a, b) => val(a) - val(b));
  return cands.find(id => val(id) >= missing) || cands[cands.length - 1];
}

// ---------- progression ----------
export const MAX_LV = 50;
function gainXp(x) {
  const pd = G.pd; if (pd.lv >= MAX_LV) { awkGain(x); return; } pd.xp += x;
  let up = false;
  while (pd.lv < MAX_LV && pd.xp >= xpNeed(pd.lv)) { pd.xp -= xpNeed(pd.lv); pd.lv++; pd.sp++; up = true; }
  if (up) levelUp();
}
function awkGain(x) {
  const pd = G.pd; pd.aw = pd.aw || 0; pd.ap = pd.ap || 0; pd.xp += x; let n = 0;
  while (pd.xp >= awkNeed(pd.aw)) { pd.xp -= awkNeed(pd.aw); pd.aw++; pd.ap++; n++; }
  if (!n) return;
  calcStats(); G.fx.push({ k: 'lvl', x: G.P.x, y: G.P.y, t: 0, dur: 1.3 }); sfx('lvl');
  toast(`각성! ★${pd.aw}`, 'lvl'); toast('각성 포인트 +' + n + ' · 메뉴 → 스킬에서 능력치를 올려주세요', 'sub');
  bubble(G.P, choice(['아직 더 강해질 수 있어!', '한계 돌파~!', '각성했다!']), 1.2); saveGame();
}
export const awkLv = k => ((G.pd && G.pd.awp) || {})[k] || 0;
function levelUp() {
  const pd = G.pd; calcStats(); G.P.hp = G.st.hp; G.P.mp = G.st.mp;
  G.fx.push({ k: 'lvl', x: G.P.x, y: G.P.y, t: 0, dur: 1.3 }); sfx('lvl');
  toast(`LEVEL UP!  Lv.${pd.lv}`, 'lvl'); toast('스킬 포인트 +1 · 메뉴에서 스킬을 찍어주세요', 'sub');
  for (const id in SKILLS) { const s = SKILLS[id]; if (s.req === pd.lv && (s.who === 'h' || pd.boriJoined)) toast(`새 스킬 해금: ${s.name}`, 'item r2'); }
  if (pd.lv >= 3 && !pd.boriJoined) G.pendingEvent = 'bori';
  bubble(G.P, choice(['강해졌다!', '레벨업~!', '느낌 좋아!']), 1.2);
  saveGame();
}

// ---------- spawning / quest ----------
function updateSpawner(dt) {
  const Z = ZONES[G.zone]; if (G.bossDefeated) return;
  const alive = G.enemies.filter(e => !e.dead && !e.boss).length;
  const L = loopLv(); const max = (G.bossSpawned ? 3 + (G.zone % CH1_N) : Z.max) + Math.min(6, 2 * L);
  G.spawnT -= dt;
  if (G.spawnT <= 0 && alive < max) { G.spawnT = Z.spawnInt * (G.bossSpawned ? 2.2 : 1) / (1 + 0.15 * L); spawnAround(wpick(Z.mons)); }
}
export function spawnAround(type, minD, maxD) {
  const W = G.world, P = G.P;
  for (let k = 0; k < 12; k++) {
    const a = rand(0, 6.28), d = rand(minD || 120, maxD || 190), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if (x < 30 || x > W.W - 30 || y < (W.top || 34) + 16 || y > W.H - 30) continue;
    if (W.solids.some(s => Math.hypot(x - s.x, y - s.y) < s.r + 8)) continue;
    return spawnEnemy(type, x, y);
  }
  return null;
}
function updateQuest() {
  const Z = ZONES[G.zone], W = G.world;
  if (!G.bossSpawned && G.zoneKills >= zoneQuota(Z)) spawnBoss();
  if (G.exitOpen && Math.hypot(G.P.x - W.gate.x, G.P.y - (W.gate.y + 4)) < 16) goNextZone();
}
function spawnBoss() {
  const Z = ZONES[G.zone], W = G.world, P = G.P; G.bossSpawned = true;
  let x = W.W / 2, y = 290; if (Math.hypot(P.x - x, P.y - y) < 90) y = P.y > 400 ? P.y - 130 : P.y + 130;
  y = clamp(y, Math.max(120, (W.top || 34) + 70), W.H - 80);
  const b = spawnEnemy(Z.boss, x, y); b.spawnT = 1.3; G.boss = b;
  // 처음 1장을 깨는 중(첫 회차)엔 보스를 조금 약하게 — 처음 시작한 사람이 첫 보스에서 오래 막히지 않게
  if (!G.inf && zoneCh(G.zone) === 1 && !(G.pd.cleared > 0)) { b.maxHp = Math.round(b.maxHp * FIRST_BOSS.hp); b.hp = b.maxHp; b.atk *= FIRST_BOSS.atk; }
  banner('BOSS', MONS[Z.boss].name + ' 출현!', 'boss'); sfx('boss'); playBgm('boss'); G.shake = 6;
  G.fx.push({ k: 'ring', x, y: y - 10, r: 50, col: '#ff4d6d', t: 0, dur: 0.9 });
  bubble(P, choice(['뭐야 저 거대한 건...!', '보스다! 정신 차리자', '저거 잡으면 나갈 수 있겠지?']), 1.8);
}
function onBossDefeated(e) {
  if (G.tower) { G.boss = null; towerEnd(true); return; }
  G.bossDefeated = true; G.boss = null; G.exitOpen = true; guideEv('boss');
  for (const o of G.enemies) if (!o.dead && o !== e) { o.dead = true; o.deadT = 0.25; burst(o.x, o.y - o.h / 2, o.col, 6); }
  G.projs = G.projs.filter(p => !p.enemy);
  setTimeout(() => { if (G.state === 'play') banner('CLEAR!', !isChLast(G.zone) ? '출구가 열렸다! 위쪽 출구로 가자' : '탈출구가 열렸다! 위쪽으로 탈출하자!', 'clear'); }, 600);
  sfx('open'); playBgm('field'); G.shake = 8; saveGame();
  bubble(G.P, choice(['해냈다!!', '나 좀 멋있는 듯?', '보리야 봤어?!']), 1.8);
}
function goNextZone() {
  if (G.state !== 'play') return;
  G.state = 'trans'; sfx('open');
  if (zoneCh(G.zone) > 1 && isChLast(G.zone)) { chFinish(zoneCh(G.zone)); return; }
  if (zoneCh(G.zone) === 1 && G.zone >= CH1_N - 1) {
    const first = !G.pd.cleared; G.pd.cleared = (G.pd.cleared || 0) + 1;
    // 자동사냥 중이면(첫 클리어 제외) 엔딩 컷신(대사 자동 넘김)을 보여주고 결과 화면 없이 바로 다음 회차 STAGE 1로
    if (G.auto && !first) { setCurZone(G.pd, 0); saveGame(); fadeTo(() => { showHUD(false); playCut(ENDING, () => fadeTo(() => { G.auto = true; startZone(0); toast(`🎉 ${G.pd.cleared}회차 클리어! 자동사냥으로 ${G.pd.cleared + 1}회차 시작`, 'lvl'); })); }); return; }
    saveGame(); fadeTo(() => startEnding()); return; }
  setCurZone(G.pd, G.zone + 1); const n = 2 + Math.floor(loopLv() / 2); G.pd.foods.gimbap = (G.pd.foods.gimbap || 0) + n; G.pd.foods.drink = (G.pd.foods.drink || 0) + n; saveGame();
  fadeTo(() => { startZone(G.zone + 1); setTimeout(() => { if (G.state === 'play' || G.state === 'dialog') { toast(`스마트 푸드 센터 재고떨이! 유통기한 임박 김밥 ×${n} · 음료수 ×${n}`, 'item r2'); sfx('coin'); if (G.P) bubble(G.P, '공짜는 못 참지!', 1.4); } }, 2900); });
}
export function startZone(i) {
  G.pvp = null; G.inf = null; G.raid = null; G.tower = null; G.husUsed = false;
  G.zone = i; setCurZone(G.pd, i); G.world = buildWorld(i); const W = G.world; G.autoExitSaid = false;
  G.enemies = []; G.projs = []; G.fx = []; G.drops = []; G.parts = []; G.texts = []; G.bubbles = [];
  G.zoneKills = 0; G.bossSpawned = false; G.bossDefeated = false; G.boss = null; G.exitOpen = false; G.spawnT = 1.5; G.ult = null;
  G.P = null; calcStats(); G.P = newPlayer(W.start.x, W.start.y); G.P.fy = -1; G.P.dir = 'up';
  G.bori = G.pd.boriJoined ? newBori(W.start.x + 14, W.start.y + 3) : null; buddySpawn();
  for (let k = 0; k < 5; k++) { const e = spawnAround(wpick(ZONES[i].mons), 140, 260); if (e) e.spawnT = 0; }
  G.cam.x = clamp(G.P.x - VW / 2, 0, Math.max(0, W.W - VW)); G.cam.y = clamp(G.P.y - 12 - VH / 2, 0, Math.max(0, W.H - VH));
  G.state = 'play'; playBgm('field'); showHUD(true); saveGame();
  { const L = loopLv(), RL = chCleared(G.pd, i); banner(RL ? `${RL + 1}회차 · ${ZONES[i].sub}` : ZONES[i].sub, ZONES[i].name, 'stage'); if (L && i === 0) setTimeout(() => { if (G.state === 'play' && !G.pvp) loopIntro(L); }, 1700); }
  { const st = zoneCh(i) > 1 && chStageStory(i); if (st) { saveGame(); playCut(st, () => { G.state = 'play'; showHUD(true); playBgm('field'); }); } }
  if (!G.pd.boriJoined) { if (G.pd.lv >= 3) G.pendingEvent = 'bori'; else setTimeout(() => { if (G.state === 'play' && !G.pd.boriJoined) bubble(G.P, '보리야... 어디 있어ㅠㅠ', 2.6); }, 1800); }
}
export function playerDie() {
  if (!G.pvp && husbandSave()) return;
  if (G.pvp) { burst(G.P.x, G.P.y - 10, '#ffffff', 20); pvpEnd(false, '내 희수가 쓰러졌어요'); return; }
  if (G.raid) { burst(G.P.x, G.P.y - 10, '#ffffff', 20); raidEnd('희수가 쓰러졌어요'); return; }
  if (G.tower) { burst(G.P.x, G.P.y - 10, '#ffffff', 20); towerEnd(false, '희수가 쓰러졌어요'); return; }
  G.state = 'dead'; G.pd.stats.deaths++; INP.atk = false;
  burst(G.P.x, G.P.y - 10, '#ffffff', 20);
  setTimeout(() => showDeath(), 700);
}
export function respawn() {
  const pd = G.pd, W = G.world; const lost = G.inf ? 0 : Math.floor(pd.gold * 0.1); pd.gold -= lost;
  G.P.x = W.start.x; G.P.y = W.start.y; G.P.hp = G.st.hp; G.P.mp = G.st.mp; G.P.inv = 2; G.P.kbx = G.P.kby = 0;
  if (G.bori) { G.bori.x = G.P.x + 14; G.bori.y = G.P.y + 3; G.bori.zoom = null; }
  G.projs = []; for (const e of G.enemies) if (!e.boss && Math.hypot(e.x - G.P.x, e.y - G.P.y) < 140) e.gone = true;
  if (G.boss && !G.inf) { G.boss.hp = G.boss.maxHp; G.boss.st = 'idle'; G.boss.x = W.W / 2; G.boss.y = 290; G.boss.hopY = 0; }
  G.state = 'play'; if (lost) toast(`병원비로 ${lost}G를 썼어요...`, 'sub');
  bubble(G.P, '다시 해보자...!', 1.5);
}

// ---------- bori event ----------
function boriEvent() {
  const P = G.P, W = G.world; G.state = 'event';
  const sx = P.x + 64 < W.W - 30 ? P.x + 64 : P.x - 64, sy = clamp(P.y - 6, (W.top || 34) + 16, W.H - 30);
  G.bori = newBori(sx, sy); G.bori.hidden = true;
  G.evt = { t: 0, sx, sy, popped: false, arrived: false, talked: false };
  P.fx = sx > P.x ? 1 : -1; P.fy = 0; P.dir = P.fx > 0 ? 'right' : 'left'; P.idleT = 0; INP.atk = false;
  bubble(P, '...응? 저 소리는?', 1.6);
}
export function updateEvent(dt) {
  const E = G.evt, B = G.bori, P = G.P; E.t += dt;
  if (!E.popped && E.t > 1.2) { E.popped = true; B.hidden = false; B.jump = 0.4; sfx('bark'); bubble(B, '멍!', 1.2); burst(E.sx, E.sy - 4, '#4f9a3f', 14, 60); }
  if (E.popped && !E.arrived) { if (E.t > 1.7) { moveToward(B, P.x + (E.sx > P.x ? 11 : -11), P.y + 2, 90, dt); B.run = true; B.t += dt; if (Math.hypot(B.x - P.x, B.y - P.y) < 14) { E.arrived = true; B.run = false; B.jump = 0.5; sfx('ding'); for (let i = 0; i < 10; i++) G.parts.push({ x: P.x + rand(-10, 10), y: P.y - 10, vx: rand(-25, 25), vy: rand(-60, -30), life: 1.2, max: 1.2, col: '#ff7ab8', sz: 3, grav: 30, heart: true }); E.at = E.t; } } }
  if (E.arrived && !E.talked && E.t > E.at + 0.8) {
    E.talked = true;
    dialog([
      { who: 'bori', text: '멍! 멍멍멍!! (꼬리 프로펠러 가동)' },
      { who: 'hee', text: '보리야!!! 어디 갔었어ㅠㅠㅠ 언니가 얼마나 찾았는데!!' },
      { who: 'bori', text: '끼잉~ (얼굴을 비비적비비적)' },
      { who: 'hee', text: '이제 절대 안 놓쳐. 같이 여기서 나가자!' },
      { who: 'sys', text: '보리가 동료가 되었습니다!' },
      { who: 'sys', text: '보리는 알아서 몬스터를 물어요. 너무 귀여워서 몬스터들은 보리를 공격하지 못해요.' },
      { who: 'sys', text: '보너스 스킬 포인트 +1! 메뉴 → 스킬에서 보리 스킬도 찍을 수 있어요.' }
    ], () => { G.pd.boriJoined = true; G.pd.sp += 1; G.evt = null; G.state = 'play'; showHUD(true); saveGame(); toast('보리 합류! 스킬 포인트 +1', 'lvl'); });
  }
  updateFx(dt); updateCam(dt);
}

// ---------- fx update ----------
function updateProjs(dt) {
  const P = G.P;
  for (const p of G.projs) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.rot += dt * 8;
    if (p.x < 0 || p.x > G.world.W || p.y < 0 || p.y > G.world.H) p.life = 0;
    if (p.enemy) { if (Math.hypot(P.x - p.x, P.y - 9 - p.y) < p.r + 5) { hurtPlayer(p.dmg, null); p.life = 0; burst(p.x, p.y, p.col || '#fff', 4); } }
    else {
      for (const e of G.enemies) { if (e.dead || e.spawnT > 0 || p.hit.has(e.id)) continue; if (Math.hypot(e.x - p.x, (e.y - e.h * 0.4) - p.y) < e.r + p.r) { p.hit.add(e.id); dealDamage(e, p.dmg, { slow: p.slow || 2, kb: 40, ang: Math.atan2(p.vy, p.vx) }); if (--p.pierce <= 0) { p.life = 0; break; } } }
    }
  }
  G.projs = G.projs.filter(p => p.life > 0);
}
export function updateFx(dt) {
  for (const f of G.fx) { f.t += dt; if (f.t >= f.dur && f.onEnd && !f.ended) { f.ended = true; f.onEnd(); } }
  G.fx = G.fx.filter(f => f.t < f.dur);
  for (const p of G.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt; p.life -= dt; }
  G.parts = G.parts.filter(p => p.life > 0);
  for (const t of G.texts) t.t += dt; G.texts = G.texts.filter(t => t.t < t.dur);
  updateBubbles(dt);
}
export function updateBubbles(dt) { for (const b of G.bubbles) b.t += dt; G.bubbles = G.bubbles.filter(b => b.t < b.dur && !(b.ent && b.ent.gone)); }
export function updateCam(dt) {
  const W = G.world, P = G.P;
  let tx = P.x - VW / 2, ty = P.y - 12 - VH / 2;
  tx = W.W <= VW ? (W.W - VW) / 2 : clamp(tx, 0, W.W - VW); ty = W.H <= VH ? (W.H - VH) / 2 : clamp(ty, 0, W.H - VH);
  const k = 1 - Math.pow(0.0005, dt); G.cam.x = lerp(G.cam.x, tx, k); G.cam.y = lerp(G.cam.y, ty, k);
}

function handleActions() {
  for (const a of INP.act) {
    if (a === 's1') trySkill('smash'); else if (a === 's2') trySkill('nag'); else if (a === 's3') trySkill('flash'); else if (a === 'ult') trySkill('menhera');
    else if (a === 'auto') autoToggle();
    else if (a === 'buddy') buddyOpen();
    else if ((a === 'hp' || a === 'mp') && G.pvp) toast('PvP에선 음식을 먹을 수 없어요!', 'warn');
    else if (a === 'hp') quickFood('hp'); else if (a === 'mp') quickFood('mp');
    else if ((a === 'menu' || a === 'esc') && G.pvp) pvpForfeit();
    else if (a === 'menu' || a === 'esc') openMenu();
  }
  INP.act.clear();
}

export function update(dt) {
  G.time += dt; G.pd.stats.time += dt;
  if (G.hitstop > 0) { G.hitstop -= dt; for (const t of G.texts) t.t += dt; return; }
  handleActions();
  if (G.state !== 'play') return;
  if (G.ult) updateUlt(dt);
  const frozen = G.ult && G.ult.t < 0.95;
  if (G.state === 'play') { autoTick(dt); if (G.buddy) buddyUpdate(dt); } else { G.autoMove = null; G.autoAtk = false; }
  updatePlayer(dt);
  if (!frozen) {
    updateBori(dt);
    for (const e of G.enemies) updateEnemy(e, dt);
    separateEnemies(); updateProjs(dt); if (G.pvp) pvpUpdate(dt); else if (G.raid) raidUpdate(dt); else if (G.tower) towerUpdate(dt); else if (G.plaza) plazaUpdate(dt); else if (G.inf) infSpawner(dt); else updateSpawner(dt);
  }
  G.enemies = G.enemies.filter(e => !e.gone);
  updateDrops(dt); updateFx(dt);
  if (G.state === 'play' && !G.pvp && !G.inf) updateQuest();
  updateCam(dt);
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 14);
  if (G.flashT > 0) G.flashT -= dt;
  if (G.flash > 0) G.flash -= dt;
  G.saveT += dt; if (G.saveT > 15) { G.saveT = 0; saveGame(); }
  if (G.state === 'play' && !G.pvp) autoFeed(dt);
  if (G.pendingEvent && !G.ult && G.state === 'play' && !G.pvp) { const ev = G.pendingEvent; G.pendingEvent = null; if (ev === 'bori') boriEvent(); }
}
