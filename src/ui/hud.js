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
import { tt } from '../sys/i18n.js';

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
  hset('zone', v => HE.zone.textContent = v, G.pvp ? tt('ui/hud.1') : G.plaza ? tt('ui/hud.2', { no: G.plaza.no }) : G.raid ? tt('ui/hud.3') : G.tower ? tt('ui/hud.4', { f: G.tower.f }) : G.inf ? tt('ui/hud.5', { wave: G.inf.wave }) : ZONES[G.zone].name + (chCleared(G.pd, G.zone) ? tt('ui/hud.6', { v1: chCleared(G.pd, G.zone) + 1 }) : ''));
  const Z = ZONES[G.zone];
  const zq = zoneQuota(Z); const q = !G.bossSpawned ? tt('ui/hud.7', { v1: Math.min(G.zoneKills, zq), zq }) : (G.boss ? tt('ui/hud.8') : (!isChLast(G.zone) ? tt('ui/hud.9') : tt('ui/hud.10')));
  hset('quest', v => HE.quest.textContent = v, G.pvp ? tt('ui/hud.11', { nickname: G.pvp.opp.nickname, v1: Math.ceil(G.pvp.t) }) : G.plaza ? (G.plaza.ok ? tt('ui/hud.12', { v1: Object.keys(G.plaza.others).length + 1 }) : tt('ui/hud.13')) : G.raid ? tt('ui/hud.14', { v1: Math.ceil(G.raid.t), v2: Math.round(G.raid.dmg).toLocaleString() }) : G.tower ? tt('ui/hud.15', { v1: Math.ceil(G.tower.t) }) : G.inf ? (G.boss && !G.boss.dead ? tt('ui/hud.16', { kills: G.inf.kills }) : tt('ui/hud.17', { kills: G.inf.kills, waveKills: G.inf.waveKills, INF_WAVE_KILLS })) : q);
  const b = G.boss && !G.boss.dead ? G.boss : null;
  hset('bossOn', v => HE.bossBar.hidden = !v, !!b);
  hset('bossDone', v => HE.bossBar.classList.toggle('done', v), !!(b && b.raidDone));
  if (b) { hset('bossName', v => HE.bossName.textContent = v, b.m.name); hset('bossF', v => HE.bossF.style.width = v + '%', Math.round(Math.max(0, b.hp) / b.maxHp * 1000) / 10); }
  hset('badge', v => { HE.badge.hidden = !v; HE.badge.textContent = v; }, pd.sp > 0 ? String(pd.sp) : (pd.newItem || pd.newBori ? 'N' : ''));
  hset('bori', v => HE.boriHud.hidden = !v, !!pd.boriJoined && !G.pvp && !!G.bori); // 5장(어린 시절)엔 보리 없음
  const bt = Object.values(P.buffs || {}).map(b => tt('ui/hud.18', { name: b.name, v1: Math.ceil(b.t) })).join(' · ');
  hset('buff', v => { const el = $('#buffHud'); el.hidden = !v; el.textContent = v; }, bt);
  for (const [id, bid] of SKBTN) {
    const S = SKILLS[id], lv = sk(id), cd = Math.max(0, P.cds[id] || 0), tot = lv ? S.cd(lv) : 1;
    const locked = !lv, nomp = !!lv && P.mp < S.mp, ready = id === 'menhera' && lv && cd <= 0 && !nomp;
    hset(bid + 'c', v => $('#' + bid).className = v, 'sk' + (locked ? ' locked' : '') + (nomp ? ' nomp' : '') + (ready ? ' ready' : ''));
    hset(bid + 'l', v => $('#' + bid + ' .lock').textContent = v, locked ? (pd.lv < S.req ? 'Lv' + S.req : tt('ui/hud.19')) : '');
    hset(bid + 'd', v => $('#' + bid + ' .cd').style.setProperty('--cd', v), Math.round(cd / tot * 50) / 50);
    hset(bid + 't', v => $('#' + bid + ' .cdT').textContent = v, cd > 0 ? String(Math.ceil(cd)) : '');
  }
  { const pd2 = G.pd, on = buddyActive(pd2); hset('buddyShow', v => $('#bBuddy').hidden = !v, !G.pvp && !FORCE_EASY); hset('buddyCls', v => $('#bBuddy').className = v, 'food buddyb' + (on ? ' on' : '') + (!on && buddyUsedToday(pd2) ? ' empty' : '')); hset('buddyT', v => $('#bBuddy span').textContent = v, on ? buddyLeftTxt(pd2.buddy.left) : buddyUsedToday(pd2) ? tt('ui/hud.20') : tt('ui/hud.21')); }
  { const left = autoLeft(); hset('autoShow', v => $('#bAuto').hidden = !v, !G.pvp); hset('autoCls', v => $('#bAuto').className = v, 'food auto' + (G.auto ? ' on' : '') + (left <= 0 && !AUTO_BETA.free ? ' empty' : '')); hset('autoT', v => $('#bAuto span').textContent = v, AUTO_BETA.free ? tt('ui/hud.22') : mmss(left)); }
  hset('qhide', v => { $('#bHP').hidden = v; $('#bMP').hidden = v; }, sk('feed') > 0 && !!pd.boriJoined);
  for (const k of ['hp', 'mp']) {
    const pick = pickQuickFood(k, k === 'hp' ? st.hp - P.hp : st.mp - P.mp);
    const cnt = FOOD_ORDER.filter(id => FOODS[id][k] > 0).reduce((s, id) => s + (pd.foods[id] || 0), 0);
    hset(k + 'i', v => HE[k].querySelector('img').src = v, pick ? iconURL('f_' + pick, ICONS[FOODS[pick].icon]) : iconURL('f_' + (k === 'hp' ? 'persimmon' : 'popcorn') + 'g', ICONS[k === 'hp' ? 'persimmon' : 'popcorn'], { 3: '#888', 2: '#666', 1: '#999', R: '#888', I: '#bbb', A: '#999' }));
    hset(k + 'n', v => HE[k].querySelector('span').textContent = v, String(cnt));
  }
}
