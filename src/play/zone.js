// ===================== 필드: 스테이지 진행 (소환·보스·출구·보리 이벤트) =====================
// ---------- spawning / quest ----------


import { VH, VW } from '../sys/dom.js';
import { choice, clamp, rand, wpick } from '../core/util.js';
import { playBgm, sfx } from '../sys/audio.js';
import { INP } from '../sys/input.js';
import { MONS, ZONES } from '../core/data.js';
import { CH1_N, chCleared, isChLast, setCurZone, zoneCh } from '../core/chapter.js';
import { chFinish, chStageStory } from './chapter-flow.js';
import { ENDING } from '../chapters/ch1.js';
import { buildWorld } from '../draw/world.js';
import { G } from '../core/state.js';
import { saveGame, sk } from '../core/save.js';
import { calcStats } from '../core/items.js';
import { bubble, burst, moveToward, newBori, newPlayer, word } from './player.js';
import { FIRST_BOSS, loopLv, loopMul, zoneQuota } from '../core/loop.js';
import { spawnEnemy } from './enemies.js';
import { updateCam, updateFx } from './fx.js';
import { banner, dialog, fadeTo, toast } from '../ui/dialog.js';
import { showHUD } from '../ui/hud.js';
import { showDeath, startEnding } from '../ui/lobby.js';
import { pvpEnd } from '../net/pvp.js';
import { guideEv } from '../features/guide.js';
import { raidEnd } from '../net/raid.js';
import { buddySpawn } from '../net/buddy.js';
import { towerEnd } from './tower.js';
import { playCut } from '../story/story.js';

export function updateSpawner(dt) {
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
export function updateQuest() {
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
export function onBossDefeated(e) {
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
export function boriEvent() {
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

// ---------- 회차 시작 대사 · 오빠가 일으켜 주기 (core/loop.js 에서 옮김) ----------
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
