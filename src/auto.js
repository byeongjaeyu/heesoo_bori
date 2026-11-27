// ===================== 자동사냥 (하루 30분 쿠폰) =====================
const AUTO_DAILY = 1800;
/** 베타 기간에는 자동사냥 무제한·무료(11/27 사용자 요청). 쿠폰·보너스 시간은 줄지 않고 그대로 쌓임 → 정식 때 free: false */
const AUTO_BETA = { free: true };
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const mmss = s => { s = Math.max(0, Math.ceil(s)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = String(s % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`; };
// 하루 쿠폰(자정 충전) + 선물 받은 보너스 시간(자정에 안 사라짐). 쓸 땐 하루 쿠폰부터
function autoLeft() { const pd = G.pd; if (!pd) return 0; if (!pd.auto || pd.auto.day !== todayKey()) pd.auto = { day: todayKey(), left: AUTO_DAILY }; return pd.auto.left + (pd.autoBonus || 0); }
function autoOff(msg) { G.auto = false; G.autoMove = null; G.autoAtk = false; if (msg) toast(msg, 'sub'); saveGame(); }
function autoToggle() {
  if (!G.P || G.state !== 'play') return;
  if (G.pvp) { toast('PvP에선 자동사냥을 쓸 수 없어요', 'warn'); sfx('warn'); return; }
  if (G.auto) { autoOff(AUTO_BETA.free ? '자동사냥 OFF' : '자동사냥 OFF · 남은 시간 ' + mmss(autoLeft())); sfx('select'); return; }
  if (!AUTO_BETA.free && autoLeft() <= 0) { toast('오늘 자동사냥 쿠폰을 다 썼어요! 자정에 30분 다시 충전돼요', 'warn'); sfx('warn'); return; }
  G.auto = true; G.autoManT = 0; G.autoStuck = 0; sfx('ding');
  toast(AUTO_BETA.free ? '자동사냥 ON · 베타 기간 무제한' : `자동사냥 ON · 남은 시간 ${mmss(autoLeft())}`, 'lvl'); bubble(G.P, choice(['자동으로 털어볼까?', '알아서 할게~', '오토 모드 가동!']), 1.3);
}
function autoDanger(P) {
  for (const f of G.fx) {
    if (f.k === 'circle') { const d = Math.hypot(P.x - f.x, P.y - f.y); if (d < f.r + 8) return d > 0.5 ? [(P.x - f.x) / d, (P.y - f.y) / d] : [1, 0]; }
    else if (f.k === 'line') { const ux = Math.cos(f.a), uy = Math.sin(f.a), rx = P.x - f.x, ry = P.y - f.y, along = rx * ux + ry * uy, side = -rx * uy + ry * ux; if (along > -6 && along < f.len + 6 && Math.abs(side) < f.w / 2 + 8) { const s = side >= 0 ? 1 : -1; return [-uy * s, ux * s]; } }
  }
  return null;
}
function autoSkills(P, tgt, d) {
  const ok = id => { const lv = sk(id), S = SKILLS[id]; return lv && (P.cds[id] || 0) <= 0 && P.mp >= S.mp && P.castT <= 0; };
  const near = r => G.enemies.filter(e => !e.dead && e.spawnT <= 0 && Math.hypot(e.x - P.x, e.y - P.y) < r).length;
  const bossNear = G.boss && !G.boss.dead && Math.hypot(G.boss.x - P.x, G.boss.y - P.y) < 150;
  if (ok('menhera') && (bossNear || near(160) >= 8)) return trySkill('menhera');
  if (ok('flash') && (near(46) >= 3 || (bossNear && d < 46))) return trySkill('flash');
  if (ok('nag') && d < 110 && (near(120) >= 2 || tgt.boss || tgt.elite)) return trySkill('nag');
  if (ok('smash') && d < 28) return trySkill('smash');
}
function autoTick(dt) {
  if (!G.auto) { G.autoMove = null; G.autoAtk = false; return; }
  if (G.pvp || !G.P) { autoOff(); return; }
  if (!AUTO_BETA.free) {
  autoLeft(); if (G.pd.auto.left > 0) G.pd.auto.left = Math.max(0, G.pd.auto.left - dt); else G.pd.autoBonus = Math.max(0, (G.pd.autoBonus || 0) - dt);
  if (autoLeft() <= 0) { autoOff(); toast('자동사냥 시간을 다 썼어요! 자정에 30분 다시 충전돼요', 'warn'); sfx('warn'); return; }
  }
  const man = INP.joy.on || INP.k.l || INP.k.r || INP.k.u || INP.k.d;
  if (man) G.autoManT = 1.5; G.autoManT -= dt;
  if (G.autoManT > 0) { G.autoMove = null; G.autoAtk = false; return; }
  const P = G.P, w = G.st.weapon, throwW = w.style === 'throw';
  const dz = autoDanger(P); if (dz) { G.autoMove = dz; G.autoAtk = false; return; }
  let tgt = null, td = 1e9;
  for (const e of G.enemies) { if (e.dead || e.spawnT > 0) continue; let d = Math.hypot(e.x - P.x, e.y - P.y) - e.r; if (e.elite) d -= 25; if (d < td) { td = d; tgt = e; } }
  let drop = null, dd = 1e9; for (const o of G.drops) { const d = Math.hypot(o.x - P.x, o.y - P.y); if (d < dd) { dd = d; drop = o; } }
  let mv = [0, 0]; G.autoAtk = false;
  const hpR = P.hp / G.st.hp;
  if (hpR < 0.35 && !sk('feed') && P.eatCd <= 0) { const id = pickQuickFood('hp', G.st.hp - P.hp); if (id && !PREMIUM.includes(id)) eatFood(id); }
  // 보스를 잡아 출구가 열리면: 근처 드롭만 줍고 출구로 → 다음 스테이지에서도 자동사냥 계속
  const W = G.world, exitGo = G.exitOpen && !G.inf && !G.raid && !G.tower && W && W.gate;
  if (exitGo) { const go = drop && dd < 140 ? drop : { x: W.gate.x, y: W.gate.y + 4 }, dx = go.x - P.x, dy = go.y - P.y, d = Math.hypot(dx, dy) || 1; if (d > 2) mv = [dx / d, dy / d]; G.autoAtk = !!tgt && td < w.reach + 4;
    if (go !== drop && !G.autoExitSaid) { G.autoExitSaid = true; bubble(P, choice(['출구로 가자!', '다음 스테이지 고고!', '보리야 따라와~']), 1.2); } }
  else if (tgt && hpR < 0.25 && td < 60) { const dx = P.x - tgt.x, dy = P.y - tgt.y, d = Math.hypot(dx, dy) || 1; mv = [dx / d, dy / d]; G.autoAtk = td < w.reach + 4; if (Math.random() < dt * 0.6) bubble(P, choice(['잠깐 숨 좀...', '후퇴!']), 1); }
  else if (drop && dd < 60 && td > 28) { const dx = drop.x - P.x, dy = drop.y - P.y, d = Math.hypot(dx, dy) || 1; if (d > 3) mv = [dx / d, dy / d]; G.autoAtk = td < w.reach + 6; }
  else if (tgt && (td < 70 || !drop || dd > 160)) {
    const dx = tgt.x - P.x, dy = (tgt.y - 2) - P.y, d = Math.hypot(dx, dy) || 1;
    const want = throwW ? Math.min(90, w.reach * 0.7) : Math.max(6, w.reach * 0.55);
    if (d > want + 6) mv = [dx / d, dy / d]; else if (throwW && d < 40) mv = [-dx / d, -dy / d];
    G.autoAtk = d < (throwW ? w.reach : w.reach + tgt.r + 6);
    if (G.autoAtk && P.atkAnim <= 0) { P.fx = dx / d; P.fy = dy / d; P.dir = dirOf(P.fx, P.fy); }
    autoSkills(P, tgt, d);
  } else if (drop) { const dx = drop.x - P.x, dy = drop.y - P.y, d = Math.hypot(dx, dy) || 1; if (d > 3) mv = [dx / d, dy / d]; }
  // 막혔을 때 옆으로 비켜 가기
  if (mv[0] || mv[1]) {
    const moved = Math.hypot(P.x - (G.autoLx || P.x), P.y - (G.autoLy || P.y));
    G.autoStuck = moved < 0.3 && !G.autoAtk ? (G.autoStuck || 0) + dt : 0;
    if (G.autoStuck > 0.5) { G.autoSide = G.autoSide || (Math.random() < 0.5 ? 1 : -1); G.autoSideT = 0.6; G.autoStuck = 0; }
    if (G.autoSideT > 0) { G.autoSideT -= dt; mv = [mv[0] * 0.3 - mv[1] * G.autoSide, mv[1] * 0.3 + mv[0] * G.autoSide]; const m = Math.hypot(mv[0], mv[1]) || 1; mv = [mv[0] / m, mv[1] / m]; } else G.autoSide = 0;
  }
  G.autoLx = P.x; G.autoLy = P.y; G.autoMove = mv;
}
