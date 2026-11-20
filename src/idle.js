// ===================== 방치 보상 =====================
// 게임을 안 하는 동안(타이틀·창 닫힘) 희수와 보리가 알아서 사냥한 몫. 최대 12시간, 10분부터 받기.
// 기준: 지금 스테이지·회차 몬스터를 시간당 IDLE_KPH 마리 (엔드급 자동사냥 약 4,000마리의 7~8%)
const IDLE_MAX = 12 * 3600, IDLE_MIN = 600, IDLE_KPH = 300, IDLE_STONE = 0.03;
ICONS.chest = ['..KKKKKKK..', '.KDDDDDDDK.', 'KDdDDDDDdDK', 'KKKKKAKKKKK', 'KDDDKAKDDDK', 'KDdDKKKDdDK', 'KDDDDDDDDDK', 'KDdDDDDDdDK', 'KKKKKKKKKKK'];
/** 쌓인 방치 시간(초). 시계를 뒤로 돌리면 0 */
const idleSec = pd => !pd || !pd.idleT ? 0 : Math.max(0, Math.min(IDLE_MAX, (Date.now() - pd.idleT) / 1000));
/** 방치 보상 계산 (G.pd 를 건드리지 않음) */
function idleCalc(pd, sec) {
  const z = curZone(pd), Z = ZONES[z], L = zoneL(pd, z);
  let w = 0, xp = 0, gold = 0; for (const [id, nn] of Z.mons) { const m = MONS[id], n = Number(nn); w += n; xp += m.xp * n; gold += (m.gold[0] + m.gold[1]) / 2 * n; }
  const kills = Math.floor(sec / 3600 * IDLE_KPH), goldMul = 1 + 0.15 * ((pd.skills || {}).shop || 0);
  return { kills, xp: Math.round(kills * xp / w * (1 + 0.5 * L)), gold: Math.round(kills * gold / w * goldMul * (1 + 0.6 * L)), stones: Math.floor(kills * IDLE_STONE) };
}
/** 경험치를 세이브에 반영 (전투 연출 없이). 오른 레벨·각성 수 반환 */
function idleXp(pd, x) {
  let lv = 0, aw = 0;
  if (pd.lv < MAX_LV) { pd.xp += x; x = 0; while (pd.lv < MAX_LV && pd.xp >= xpNeed(pd.lv)) { pd.xp -= xpNeed(pd.lv); pd.lv++; pd.sp++; lv++; } if (pd.lv >= MAX_LV) { x = pd.xp; pd.xp = 0; } }
  if (pd.lv >= MAX_LV && x > 0) { pd.aw = pd.aw || 0; pd.ap = pd.ap || 0; pd.xp += x; while (pd.xp >= awkNeed(pd.aw)) { pd.xp -= awkNeed(pd.aw); pd.aw++; pd.ap++; aw++; } }
  return { lv, aw };
}
const idleLabel = s => s >= IDLE_MAX ? '가득 참!' : `${Math.floor(s / 3600)}시간 ${Math.floor(s % 3600 / 60)}분`;
function idleTileHtml(pd) {
  const s = idleSec(pd), ok = s >= IDLE_MIN;
  return `<button class="tidle${ok ? ' ready' : ''}${s >= IDLE_MAX ? ' full' : ''}" id="tIdle"><em>방치 보상</em><img src="${iconURL('px_chest', ICONS.chest)}" alt=""><b>${ok ? idleLabel(s) : '모으는 중'}</b><small>${ok ? '받기!' : '10분부터'}</small>${ok ? '<em class="dot"></em>' : ''}</button>`;
}
function idleClaim() {
  const pd = loadGame(); if (!pd || G.state !== 'title') return;
  const s = idleSec(pd); if (s < IDLE_MIN) { toast(`방치 보상은 게임을 쉬는 동안 쌓여요 (10분부터, 최대 12시간)`, 'sub'); return; }
  const r = idleCalc(pd, s); pd.gold += r.gold; pd.stones = (pd.stones || 0) + r.stones; pd.stats.kills += r.kills; const up = idleXp(pd, r.xp); pd.idleT = Date.now();
  G.pd = pd; saveGame(); sfx('lvl');
  const extra = [up.lv ? `레벨 +${up.lv}` : '', up.aw ? `각성 ★+${up.aw}` : ''].filter(Boolean).join(' · ');
  $('#seasonModalBody').innerHTML = `<div class="sgot"><div class="sbig">${PXI('chest')}</div><h2>방치 보상<br><em>${idleLabel(s)}</em></h2><p class="smsub">쉬는 동안 희수와 보리가 몬스터 ${r.kills.toLocaleString()}마리를 잡았어요${extra ? '<br><b>' + extra + '</b>' : ''}<br>(최대 12시간까지 쌓여요)</p>`
    + rewardCards([{ kind: 'gold', amount: r.gold }, { kind: 'xp', amount: r.xp }, { kind: 'stones', amount: r.stones }], true) + '</div>';
  SM_NEXT = () => showTitle(); seasonModalShow();
}
function idleBoot() {
  if (FORCE_EASY) return;
  setInterval(() => { try { if (G.state === 'title' && $('#tIdle') && !$('#title').hidden) { const pd = TITLE_PD; if (pd) { const box = document.createElement('div'); box.innerHTML = idleTileHtml(pd); $('#tIdle').replaceWith(box.firstChild); $('#tIdle').onclick = () => { audioInit(); idleClaim(); }; } } } catch (e) { } }, 20000);
}
