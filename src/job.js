// ===================== 전직 (Lv50) =====================
// 직업마다 「항상」 보너스 + 「대표 장비」를 끼면 붙는 보너스(약 +20%). 첫 전직은 무료, 바꾸면 강화석·골드.
// 세이브 pd.job(직업 id)·pd.jobN(바꾼 횟수)·pd.jobGift(받은 전직 선물). 능력치는 calcStats 끝에서 jobApply → snap 값에 자연히 반영.
const JOB_LV = 50, JOB_COST = { stones: 2000, gold: 10000000 };
/** @type {Record<string, {name: string, full: string, color: string, icon: string, flavor: string, always: string, sigTxt: string, sig: string[]}>} */
const JOBS = {
  dev: { name: '개발자', full: '개발자 희수', color: '#3a6ac0', icon: 'laptop', flavor: '야근은 싫지만 버그는 못 참아',
    always: '스킬 위력 +15%', sigTxt: '단단한 맥북프로를 끼면 공격 +20%, 신화 무기도 맥북 장비 레벨 재료가 돼요', sig: ['starstick'] },
  career: { name: '커리어우먼', full: '커리어우먼 희수', color: '#c0306a', icon: 'idcard', flavor: '칼퇴는 능력이다',
    always: '골드 +20%', sigTxt: '그리팅 사원증을 끼면 공격 속도 +20% · 카드가 3마리까지 관통 / 핸드백을 들면 치명 +5%', sig: ['goldpan', 'limitbag', 'clutch'] },
  cheer: { name: '응원단장', full: '응원단장 희수', color: '#e8414f', icon: 'bat', flavor: '9회말 2아웃에도 목은 안 쉰다',
    always: '보리 공격 +20% · 동료 희수 공격 +30%', sigTxt: '응원 장비 1개마다 공격 +4% (최대 5개, +20%)', sig: ['bat', 'lightstick', 'uniform', 'cheercap', 'spike', 'cheerbag'] },
  bride: { name: '새신부', full: '새신부 희수', color: '#d88ab0', icon: 'bouquet', flavor: '오빠, 평생 잘해',
    always: '최대 HP +15% · 방어 +10%', sigTxt: '웨딩 장비 1개마다 HP·방어 +7% / 3개 다 끼면 5초마다 HP 3% 회복 · 보리 공격 +10%', sig: ['bouquet', 'wdress', 'veil'] },
  fish: { name: '낚시왕', full: '낚시왕 희수', color: '#2f8a8a', icon: 'net', flavor: '12시간? 이제 시작인데?',
    always: '보스 피해 +15%', sigTxt: '낚시 장비 1개마다 공격 +4% · 강화석·장비 드롭 +6% (최대 5개)', sig: ['net', 'vest', 'bucket', 'rainboot', 'wingshoes', 'tackle'] }
};
/** 새신부로 처음 전직하면 받는 웨딩 세트 */
const JOB_GIFT = { bride: ['bouquet', 'wdress', 'veil'] };
const jobOf = pd => (pd && pd.lv >= JOB_LV && JOBS[pd.job]) ? pd.job : null;
const jobTag = id => JOBS[id] ? `<span class="jtag" style="--jc:${JOBS[id].color}">${JOBS[id].name}</span>` : '';
/** 착용 중인 대표 장비 개수 (희수 5부위) */
function jobSigN(pd, id) { const sig = JOBS[id].sig; let n = 0; for (const sl of SLOTS) if (sig.includes(defOf(pd.eq[sl]))) n++; return n; }
/** 장비 레벨 재료: 개발자는 맥북프로에 신화 무기도 먹일 수 있음 */
function jobFeedOk(pd, cur, it) { return jobOf(pd) === 'dev' && defOf(cur) === 'starstick' && it.slot === 'weapon' && it.rar === 4; }
/** calcStats 끝에서 호출 */
function jobApply(pd, st) {
  const j = jobOf(pd); st.job = j; if (!j) return;
  const eqd = sl => defOf(pd.eq[sl]), n = Math.min(5, jobSigN(pd, j));
  if (j === 'dev') { st.skillMul += 0.15; if (eqd('weapon') === 'starstick') st.atk *= 1.2; }
  else if (j === 'career') { st.goldMul *= 1.2; if (eqd('weapon') === 'goldpan') { st.rateMul = 1.2; st.pierce = 3; } if (['limitbag', 'clutch'].includes(eqd('bag'))) st.crit += 0.05; }
  else if (j === 'cheer') { st.boriMul += 0.2; st.buddyMul = 1.3; st.atk *= 1 + 0.04 * n; }
  else if (j === 'bride') { const m = 1 + 0.07 * n; st.hp *= 1.15 * m; st.def *= 1.1 * m; if (n >= 3) { st.regen = 0.03; st.boriMul += 0.1; } }
  else if (j === 'fish') { st.bossMul += 0.15; st.atk *= 1 + 0.04 * n; st.dropMul = 1 + 0.06 * n; }
  st.atk = Math.round(st.atk); st.def = Math.round(st.def); st.hp = Math.round(st.hp);
}
/** 새신부 회복 (5초마다 최대 HP 3%) */
function jobTick(dt) {
  const P = G.P, st = G.st; if (!P || !st || !st.regen || P.hp <= 0 || P.hp >= st.hp) { if (P) P.regT = 0; return; }
  P.regT = (P.regT || 0) + dt; if (P.regT < 5) return; P.regT = 0;
  const h = Math.max(1, Math.round(st.hp * st.regen)); P.hp = Math.min(st.hp, P.hp + h); addText(P.x, P.y - 30, '+' + h, 'heal');
}
function jobCanPay(pd) { return (pd.stones || 0) >= JOB_COST.stones && (pd.gold || 0) >= JOB_COST.gold; }
/** 전직 (첫 번째는 무료) */
function jobSet(pd, id) {
  if (!JOBS[id] || pd.lv < JOB_LV || pd.job === id) return false;
  if (pd.job) { if (!jobCanPay(pd)) return false; pd.stones -= JOB_COST.stones; pd.gold -= JOB_COST.gold; pd.jobN = (pd.jobN || 0) + 1; }
  pd.job = id; pd.jobGift = pd.jobGift || {};
  const gift = JOB_GIFT[id]; let got = [];
  if (gift && !pd.jobGift[id]) { pd.jobGift[id] = 1; for (const it of gift) { if (!ownsDef(pd, it)) { const k = addItem(pd, it); got.push(k); const sl = ITEMS[it].slot; const cur = ITEMS[pd.eq[sl]]; if (!cur || (cur.rar || 0) <= ITEMS[it].rar) pd.eq[sl] = k; } } }
  return got;
}
function jobAsk(id) {
  const pd = G.pd, J = JOBS[id]; if (!J) return;
  if (pd.lv < JOB_LV) { toast(`전직은 Lv${JOB_LV}부터 할 수 있어요`, 'warn'); return; }
  if (pd.job === id) return;
  if (pd.job && !jobCanPay(pd)) { toast(`직업을 바꾸려면 강화석 ${numF(JOB_COST.stones)}개 + ${numF(JOB_COST.gold)}G가 필요해요`, 'warn'); return; }
  const cost = pd.job ? `\n강화석 ${numF(JOB_COST.stones)}개 + ${numF(JOB_COST.gold)}G가 들어요.` : '\n첫 전직은 무료예요. (나중에 바꾸려면 강화석·골드가 들어요)';
  const gift = JOB_GIFT[id] && !(pd.jobGift || {})[id] ? `\n전직 선물: ${JOB_GIFT[id].map(i => ITEMS[i].name).join(' · ')} (바로 착용)` : '';
  confirmBox(`「${J.full}」(으)로 ${pd.job ? '바꿀까요?' : '전직할까요?'}${cost}${gift}`, () => {
    const got = jobSet(pd, id); if (got === false) return;
    calcStats(); saveGame(); sfx('lvl'); renderMenu();
    toast(`${J.full} 탄생! ${J.always}`, 'lvl');
    if (got.length) setTimeout(() => toast(`전직 선물 ${got.map(k => ITEMS[k].name).join(' · ')} 착용!`, 'item r4'), 600);
  });
}
function jobHtml(pd) {
  const cur = jobOf(pd), lvOk = pd.lv >= JOB_LV;
  let h = `<div class="jobhead"><b>전직</b>${cur ? jobTag(cur) : ''}<small>${lvOk ? (cur ? `지금 직업: ${JOBS[cur].full} · 바꾸면 강화석 ${numF(JOB_COST.stones)}개 + ${numF(JOB_COST.gold)}G` : '직업을 하나 골라요. 첫 전직은 무료예요.') : `Lv${JOB_LV}가 되면 전직할 수 있어요. (지금 Lv.${pd.lv})`}</small></div>`;
  for (const id of Object.keys(JOBS)) {
    const J = JOBS[id], on = cur === id, n = jobSigN(pd, id);
    const sig = J.sig.map(i => { const it = ITEMS[i]; if (!it) return ''; const eq = SLOTS.some(sl => defOf(pd.eq[sl]) === i), own = ownsDef(pd, i);
      return `<span class="jsi${eq ? ' eq' : own ? ' own' : ''}" title="${it.name}"><img src="${itemURL(i)}" alt=""><small>${it.name}</small><em>${eq ? '착용' : own ? '보유' : (JOB_GIFT[id] || []).includes(i) ? '전직 선물' : '없음'}</em></span>`; }).join('');
    const btn = !lvOk ? `<button class="btn wh sm" disabled>Lv${JOB_LV}부터</button>` : on ? '<span class="jnow">지금 직업</span>'
      : `<button class="btn pk sm" data-m="job" data-v="${id}">${cur ? '이 직업으로 바꾸기' : '전직하기'}</button>`;
    h += `<div class="jobc${on ? ' on' : ''}" style="--jc:${J.color}"><div class="jhd"><img src="${iconURL('jb_' + id, ICONS[J.icon])}" alt=""><div><b>${J.full}</b><small>「${J.flavor}」</small></div>${btn}</div>`
      + `<div class="jrow"><span class="lb">항상</span><span>${J.always}</span></div>`
      + `<div class="jrow"><span class="lb">대표 장비</span><span>${J.sigTxt}${['cheer', 'fish', 'bride'].includes(id) ? ` <b class="jcnt">지금 ${Math.min(id === 'bride' ? 3 : 5, n)}개</b>` : ''}</span></div>`
      + `<div class="jsig">${sig}</div></div>`;
  }
  return h;
}
function jobTileHtml(pd) { return pd && pd.lv >= JOB_LV && !JOBS[pd.job] ? `<button class="ticon tpack tjob" id="tJob"><img src="${iconURL('i_jobbadge', ICONS.jobbadge)}" alt=""><small>전직 가능!</small><em class="dot"></em></button>` : ''; }
