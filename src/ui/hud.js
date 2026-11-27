// ===================== 필드 HUD =====================
// ---------- HUD ----------


import { ICONS } from '../draw/sprites.js';
import { $ } from '../sys/dom.js';
import { iconURL } from '../draw/sprite.js';
import { FOODS, FOOD_ORDER, SKILLS, ZONES, awkNeed, xpNeed } from '../core/data.js';
import { chCleared, isChLast } from '../core/chapter.js';
import { G } from '../core/state.js';
import { sk } from '../core/save.js';
import { zoneQuota } from '../core/loop.js';
import { pickQuickFood } from '../play/food.js';
import { MAX_LV } from '../core/progress.js';
import { itemURL } from '../draw/render.js';
import { FINE, faceURL } from './common.js';
import { INF_WAVE_KILLS } from '../play/inf.js';
import { AUTO_BETA, autoLeft, mmss } from '../play/auto.js';
import { buddyActive, buddyLeftTxt, buddyUsedToday } from '../net/buddy.js';

const HC = {}; let HE = null;
function hset(k, fn, v) { if (HC[k] === v) return; HC[k] = v; fn(v); }
export function showHUD(on) {
  $('#hud').hidden = !on; $('#ctrl').hidden = !on; $('#keyHint').hidden = !on || !FINE;
  if (on) { for (const k in HC) delete HC[k]; setHudImages(); }
}
const SKBTN = [['smash', 'bS1'], ['nag', 'bS2'], ['flash', 'bS3'], ['menhera', 'bULT']];
export function setHudImages() {
  $('#pfImg').src = faceURL('hee'); $('#boriImg').src = faceURL('bori'); $('#coinImg').src = iconURL('coin', ICONS.coin);
  const w = G.pd.eq.weapon; $('#atkImg').src = w === 'fist' ? iconURL('sk_fist', ICONS.fist) : itemURL(w);
  for (const [id, b] of SKBTN) $('#' + b + ' img').src = iconURL('sk_' + SKILLS[id].icon, ICONS[SKILLS[id].icon]);
}
export function updateHUD() {
  const P = G.P, st = G.st, pd = G.pd; if (!P || !st) return;
  if (!HE) HE = { lv: $('#lv'), hpF: $('#hpF'), hpT: $('#hpT'), mpF: $('#mpF'), mpT: $('#mpT'), xpF: $('#xpF'), gold: $('#goldT'), zone: $('#zoneT'), quest: $('#questT'), bossBar: $('#bossBar'), bossName: $('#bossName'), bossF: $('#bossF'), badge: $('#spBadge'), boriHud: $('#boriHud'), hp: $('#bHP'), mp: $('#bMP') };
  hset('lv', v => { HE.lv.textContent = v; HE.lv.classList.toggle('aw', v.length > 6); }, pd.aw ? 'Lv' + pd.lv + '★' + pd.aw : 'Lv.' + pd.lv);
  hset('hpF', v => HE.hpF.style.width = v + '%', Math.round(P.hp / st.hp * 1000) / 10);
  hset('hpT', v => HE.hpT.textContent = v, Math.ceil(P.hp) + '/' + st.hp);
  hset('mpF', v => HE.mpF.style.width = v + '%', Math.round(P.mp / st.mp * 1000) / 10);
  hset('mpT', v => HE.mpT.textContent = v, Math.floor(P.mp) + '/' + st.mp);
  hset('xpF', v => HE.xpF.style.width = v + '%', Math.round(Math.min(1, pd.xp / (pd.lv >= MAX_LV ? awkNeed(pd.aw || 0) : xpNeed(pd.lv))) * 1000) / 10);
  hset('gold', v => HE.gold.textContent = v, pd.gold.toLocaleString());
  hset('zone', v => HE.zone.textContent = v, G.pvp ? 'PvP 아레나' : G.plaza ? `희수 광장 ${G.plaza.no}` : G.raid ? '월드 보스 레이드' : G.tower ? `보스 타워 ${G.tower.f}층` : G.inf ? `할로윈파티 · WAVE ${G.inf.wave}` : ZONES[G.zone].name + (chCleared(G.pd, G.zone) ? ` · ${chCleared(G.pd, G.zone) + 1}회차` : ''));
  const Z = ZONES[G.zone];
  const zq = zoneQuota(Z); const q = !G.bossSpawned ? `몬스터 처치 ${Math.min(G.zoneKills, zq)}/${zq}` : (G.boss ? '보스를 쓰러뜨려라!' : (!isChLast(G.zone) ? '↑ 출구로 이동!' : '↑ 탈출구로 탈출!'));
  hset('quest', v => HE.quest.textContent = v, G.pvp ? `VS ${G.pvp.opp.nickname} · 남은 시간 ${Math.ceil(G.pvp.t)}초` : G.plaza ? (G.plaza.ok ? `${Object.keys(G.plaza.others).length + 1}명 접속 중 · 자유롭게 돌아다녀요` : '광장 서버에 연결하는 중...') : G.raid ? `남은 시간 ${Math.ceil(G.raid.t)}초 · 내 피해 ${Math.round(G.raid.dmg).toLocaleString()}` : G.tower ? `남은 시간 ${Math.ceil(G.tower.t)}초 · 보스를 쓰러뜨려라!` : G.inf ? (G.boss && !G.boss.dead ? `할로윈 보스 등장! · 처치 ${G.inf.kills}` : `처치 ${G.inf.kills} · 다음 웨이브 ${G.inf.waveKills}/${INF_WAVE_KILLS}`) : q);
  const b = G.boss && !G.boss.dead ? G.boss : null;
  hset('bossOn', v => HE.bossBar.hidden = !v, !!b);
  hset('bossDone', v => HE.bossBar.classList.toggle('done', v), !!(b && b.raidDone));
  if (b) { hset('bossName', v => HE.bossName.textContent = v, b.m.name); hset('bossF', v => HE.bossF.style.width = v + '%', Math.round(Math.max(0, b.hp) / b.maxHp * 1000) / 10); }
  hset('badge', v => { HE.badge.hidden = !v; HE.badge.textContent = v; }, pd.sp > 0 ? String(pd.sp) : (pd.newItem || pd.newBori ? 'N' : ''));
  hset('bori', v => HE.boriHud.hidden = !v, !!pd.boriJoined && !G.pvp);
  const bt = Object.values(P.buffs || {}).map(b => `${b.name} ${Math.ceil(b.t)}초`).join(' · ');
  hset('buff', v => { const el = $('#buffHud'); el.hidden = !v; el.textContent = v; }, bt);
  for (const [id, bid] of SKBTN) {
    const S = SKILLS[id], lv = sk(id), cd = Math.max(0, P.cds[id] || 0), tot = lv ? S.cd(lv) : 1;
    const locked = !lv, nomp = !!lv && P.mp < S.mp, ready = id === 'menhera' && lv && cd <= 0 && !nomp;
    hset(bid + 'c', v => $('#' + bid).className = v, 'sk' + (locked ? ' locked' : '') + (nomp ? ' nomp' : '') + (ready ? ' ready' : ''));
    hset(bid + 'l', v => $('#' + bid + ' .lock').textContent = v, locked ? (pd.lv < S.req ? 'Lv' + S.req : '배우기') : '');
    hset(bid + 'd', v => $('#' + bid + ' .cd').style.setProperty('--cd', v), Math.round(cd / tot * 50) / 50);
    hset(bid + 't', v => $('#' + bid + ' .cdT').textContent = v, cd > 0 ? String(Math.ceil(cd)) : '');
  }
  { const pd2 = G.pd, on = buddyActive(pd2); hset('buddyShow', v => $('#bBuddy').hidden = !v, !G.pvp && !FORCE_EASY); hset('buddyCls', v => $('#bBuddy').className = v, 'food buddyb' + (on ? ' on' : '') + (!on && buddyUsedToday(pd2) ? ' empty' : '')); hset('buddyT', v => $('#bBuddy span').textContent = v, on ? buddyLeftTxt(pd2.buddy.left) : buddyUsedToday(pd2) ? '내일' : '친구'); }
  { const left = autoLeft(); hset('autoShow', v => $('#bAuto').hidden = !v, !G.pvp); hset('autoCls', v => $('#bAuto').className = v, 'food auto' + (G.auto ? ' on' : '') + (left <= 0 && !AUTO_BETA.free ? ' empty' : '')); hset('autoT', v => $('#bAuto span').textContent = v, AUTO_BETA.free ? '무제한' : mmss(left)); }
  hset('qhide', v => { $('#bHP').hidden = v; $('#bMP').hidden = v; }, sk('feed') > 0 && !!pd.boriJoined);
  for (const k of ['hp', 'mp']) {
    const pick = pickQuickFood(k, k === 'hp' ? st.hp - P.hp : st.mp - P.mp);
    const cnt = FOOD_ORDER.filter(id => FOODS[id][k] > 0).reduce((s, id) => s + (pd.foods[id] || 0), 0);
    hset(k + 'i', v => HE[k].querySelector('img').src = v, pick ? iconURL('f_' + pick, ICONS[FOODS[pick].icon]) : iconURL('f_' + (k === 'hp' ? 'persimmon' : 'popcorn') + 'g', ICONS[k === 'hp' ? 'persimmon' : 'popcorn'], { 3: '#888', 2: '#666', 1: '#999', R: '#888', I: '#bbb', A: '#999' }));
    hset(k + 'n', v => HE[k].querySelector('span').textContent = v, String(cnt));
  }
}
