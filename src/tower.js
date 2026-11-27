// ===================== 보스 타워 (도전 모드) =====================
// 층마다 보스 1마리 · 제한 시간 90초. 층이 오를수록 강해짐(난이도 단계 = towerL). 다음 층(최고 기록 +1)만 도전, 횟수 제한 없음
// 첫 돌파 보상: 강화석(층 비례) · 5층마다 자동사냥 30분 · 10층마다 초월 장비 확정 + 강화석 2배 · 30층 한정 헤어. 칭호는 ACH tw10·tw30·tw50
import { $, INP, VH, VW, choice, clamp, playBgm, sfx } from './engine.js';
import { MONS, ZONES } from './data.js';
import { buildWorld } from './world.js';
import { G, bubble, calcStats, loadGame, loopMul, newBori, newPlayer, saveGame, spawnEnemy } from './game.js';
import { banner, fadeTo, showHUD, showTitle, toast } from './ui.js';
import { esc } from './pvp.js';
import { autoOff } from './auto.js';
import { rewardCards } from './rank.js';
import { raidBossURL } from './raid.js';
import { buddySpawn } from './buddy.js';
import { achTag } from './achv.js';
import { applyRewards, rwLabel } from './goal.js';

const TOWER_TIME = 90;
const TOWER_BOSSES = ['boss1', 'boss2', 'boss3', 'boss4', 'truck', 'breamking', 'bassgen', 'grouper', 'cutking', 'chickboss', 'cheerleader', 'raincloud'];
export const towerBest = pd => (pd.tower && pd.tower.best) || 0;
const towerBoss = f => TOWER_BOSSES[(f - 1) % TOWER_BOSSES.length];
/** 층 난이도 단계 (회차 난이도와 같은 척도: 1장 n회차 = n-1). 10층까지는 완만하게 */
const towerL = f => f <= 10 ? Math.round(f * 0.7 * 10) / 10 : Math.round((7 + (f - 10) * 1.2) * 10) / 10;
/** 체력은 10층 이후 더 가파르게 (공격은 towerL 로 완만하게 → 한 방에 죽는 대신 딜 검사) */
const towerHpL = f => f <= 10 ? f * 0.7 : 7 + (f - 10) * 2;
/** 보스 기본 능력치는 층 기준으로 통일 (원래 보스마다 체력 차이가 커서). 낮은 층은 조금 약하게 */
const TOWER_REF = { hp: 30000, atk: 85, def: 18 };
const towerK = f => Math.min(1, 0.4 + f * 0.04);
/** 보스 체력 배수 (10층마다 대장 보스) */
const towerHpMul = f => f % 10 === 0 ? 1.6 : 1.3;
const towerZone = f => Math.max(0, ZONES.findIndex(z => z.boss === towerBoss(f)));
/** f층 첫 돌파 보상 */
function towerReward(f) {
  const r = /** @type {[string, any][]} */ ([['stones', (10 + f * 4) * (f % 10 === 0 ? 2 : 1)]]);
  if (f % 5 === 0) r.push(['auto', 1800]);
  if (f % 10 === 0) r.push(['tr', 1]);
  if (f === 30) r.push(['hair', 'flame']);
  return r;
}
const TOWER = { busy: false };

// ---------- 로비 ----------
export function towerOpen() {
  const saved = loadGame(); if (!saved) return;
  if (!(saved.cleared >= 1)) { toast('보스 타워는 1장(에버랜드 대탈출)을 한 번 깨면 열려요', 'warn'); return; }
  G.pd = saved; G.P = null; calcStats(); G.pvp = null; G.raid = null; G.inf = null; G.tower = null;
  $('#title').hidden = true; showHUD(false); G.state = 'towerLobby'; playBgm('boss');
  towerRender(); $('#tower').hidden = false;
}
function towerRender() {
  const pd = G.pd, best = towerBest(pd), f = best + 1, b = towerBoss(f), m = MONS[b];
  const marks = [5, 10, 20, 30, 40, 50].filter(n => n > best).slice(0, 3);
  const next = marks.map(n => `<div class="twm"><i>${n}층</i><span>${rwLabel(towerReward(n))}${n === 10 ? ' · 칭호 ' + achTag('tw10') : n === 30 ? ' · 칭호 ' + achTag('tw30') : n === 50 ? ' · 칭호 ' + achTag('tw50') : ''}</span></div>`).join('');
  $('#towerBody').innerHTML = `<div class="twtop"><div class="twfl"><small>도전할 층</small><b>${f}<em>층</em></b><span>최고 기록 ${best}층</span></div>`
    + `<div class="twboss"><img src="${raidBossURL(b)}" alt=""><b>${f % 10 === 0 ? '대장 · ' : ''}${esc(m.name)}</b><small>난이도 ${Math.round(towerL(f)) + 1}단계 · 제한 ${TOWER_TIME}초</small></div></div>`
    + `<h3>${f}층 첫 돌파 보상</h3>${rewardCards(towerReward(f).filter(([k]) => k !== 'tr' && k !== 'hair').map(([kind, amount]) => ({ kind, amount })))}`
    + (towerReward(f).some(([k]) => k === 'tr' || k === 'hair') ? `<p class="twx">+ ${rwLabel(towerReward(f).filter(([k]) => k === 'tr' || k === 'hair'))}</p>` : '')
    + `<button class="btn pk twgo" data-tw="go">${f}층 도전하기</button>`
    + `<p class="twtip">보스를 ${TOWER_TIME}초 안에 쓰러뜨리면 다음 층이 열려요. 막히면 강화·재련·각성으로 더 강해져서 다시!</p>`
    + (next ? `<h3>다가오는 특별 보상</h3>${next}` : '');
}
function towerGo() {
  if (TOWER.busy) return; TOWER.busy = true; setTimeout(() => { TOWER.busy = false; }, 800);
  const f = towerBest(G.pd) + 1; $('#tower').hidden = true; fadeTo(() => startTower(f), `보스 타워 ${f}층`);
}

// ---------- 전투 ----------
function startTower(f) {
  G.pd = loadGame() || G.pd;
  G.tower = { f, L: towerL(f), t: TOWER_TIME, over: false }; G.pvp = null; G.inf = null; G.raid = null; G.husUsed = false;
  G.zone = towerZone(f); G.world = buildWorld(G.zone); const W = G.world;
  G.enemies = []; G.projs = []; G.fx = []; G.drops = []; G.parts = []; G.texts = []; G.bubbles = [];
  G.zoneKills = 0; G.bossSpawned = true; G.bossDefeated = false; G.exitOpen = false; G.spawnT = 99; G.ult = null; G.pendingEvent = null;
  G.P = null; calcStats(); G.P = newPlayer(W.start.x, W.start.y); G.P.fy = -1; G.P.dir = 'up';
  G.bori = G.pd.boriJoined ? newBori(W.start.x + 14, W.start.y + 3) : null; buddySpawn();
  const m0 = MONS[towerBoss(f)], e = spawnEnemy(towerBoss(f), W.start.x, W.start.y - 150);
  const LM = loopMul(), k = towerK(f); e.maxHp = Math.round(TOWER_REF.hp * k * (1 + 0.6 * towerHpL(f)) * towerHpMul(f)); e.hp = e.maxHp;
  e.atk = TOWER_REF.atk * Math.min(1, 0.6 + f * 0.03) * (1 + 0.35 * LM.L); e.def = Math.round(TOWER_REF.def * k + LM.def); e.spawnT = 1.3; e.elite = false;
  if (f % 10 === 0) { e.sc *= 1.2; e.w *= 1.2; e.h *= 1.2; e.r = Math.round(e.r * 1.15); }
  e.m = Object.assign({}, m0, { name: `${f}층 · ${f % 10 === 0 ? '대장 ' : ''}${m0.name}`, drops: [] }); G.boss = e;
  G.cam.x = clamp(G.P.x - VW / 2, 0, Math.max(0, W.W - VW)); G.cam.y = clamp(G.P.y - 60 - VH / 2, 0, Math.max(0, W.H - VH));
  G.state = 'play'; showHUD(true); playBgm('boss'); banner(`보스 타워 ${f}층`, m0.name, 'boss'); sfx('boss');
  bubble(G.P, choice(['한 층 더!', '위로 올라가자!', '이번 층도 접수!']), 1.6);
}
export function towerUpdate(dt) {
  const V = G.tower; if (!V || V.over || G.state !== 'play') return;
  V.t -= dt; if (V.t <= 0) { V.t = 0; towerEnd(false, '시간 초과!'); }
}
export function towerEnd(win, why) {
  const V = G.tower; if (!V || V.over) return; V.over = true; INP.atk = false; if (typeof autoOff === 'function') autoOff();
  const pd = G.pd, f = V.f, used = Math.round(TOWER_TIME - V.t);
  let body = '';
  if (win) {
    G.state = 'towerEnd'; G.boss = null; for (const o of G.enemies) if (!o.dead) { o.dead = true; o.deadT = 0.25; } G.projs = [];
    const first = f > towerBest(pd); pd.tower = Object.assign({}, pd.tower || {}, { best: Math.max(towerBest(pd), f) });
    if (first) { const r = applyRewards(pd, towerReward(f)); body = (r.extra.length ? `<p class="smsub">${r.extra.join('<br>')}</p>` : '') + rewardCards(r.cards, true); }
    sfx('lvl'); G.shake = 6; saveGame();
    $('#towerResT').innerHTML = `${f}층 돌파!`;
    $('#towerResS').innerHTML = `<span class="twtime">${used}초 만에 클리어</span>${body}`;
  } else {
    G.state = 'towerEnd'; saveGame();
    const hp = G.boss && !G.boss.dead ? Math.max(0, G.boss.hp / G.boss.maxHp) : 0;
    $('#towerResT').textContent = why;
    $('#towerResS').innerHTML = `<span class="twtime">${f}층 보스 남은 체력 ${Math.ceil(hp * 100)}%</span><span class="twtip">강화·재련·각성으로 더 강해져서 다시 도전해요!</span>`;
  }
  $('#towerRes').querySelector('[data-tr="next"]').textContent = win ? `${f + 1}층 도전` : '다시 도전';
  setTimeout(() => { $('#towerRes').hidden = false; }, win ? 900 : 300);
}
function towerResAct(a) {
  $('#towerRes').hidden = true; G.tower = null; G.enemies = []; G.boss = null; G.bori = null; showHUD(false);
  if (a === 'next') { const f = towerBest(G.pd) + 1; fadeTo(() => startTower(f), `보스 타워 ${f}층`); }
  else if (a === 'lobby') { G.state = 'towerLobby'; towerRender(); $('#tower').hidden = false; playBgm('boss'); }
  else showTitle();
}
export function towerBoot() {
  if (FORCE_EASY) return;
  $('#tower').addEventListener('click', e => { const b = /** @type {HTMLElement} */ (e.target).closest('[data-tw]'); if (!b) return; const a = b.getAttribute('data-tw');
    if (a === 'go') towerGo(); else if (a === 'close') { $('#tower').hidden = true; showTitle(); } });
  $('#towerRes').addEventListener('click', e => { const b = /** @type {HTMLElement} */ (e.target).closest('[data-tr]'); if (b) towerResAct(b.getAttribute('data-tr')); });
}
