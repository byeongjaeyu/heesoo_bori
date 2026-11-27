// ===================== 전직 (Lv50) =====================
// 직업마다 「항상」 보너스 + 「대표 장비」를 끼면 붙는 보너스(약 +20%). 첫 전직은 무료, 바꾸면 강화석·골드.
// 세이브 pd.job(직업 id)·pd.jobN(바꾼 횟수)·pd.jobGift(받은 전직 선물). 능력치는 calcStats 끝에서 jobApply → snap 값에 자연히 반영.



import { ICONS } from '../draw/sprites.js';
import { numF } from '../sys/dom.js';
import { iconURL } from '../draw/sprite.js';
import { sfx } from '../sys/audio.js';
import { ITEMS, SLOTS, defOf } from '../core/data.js';
import { G } from '../core/state.js';
import { saveGame } from '../core/save.js';
import { calcStats, ownsDef } from '../core/items.js';
import { JOBS, JOB_BETA, JOB_COST, JOB_GIFT, JOB_LV, jobCanPay, jobOf, jobSet, jobSigN } from '../core/job.js';
import { itemURL } from '../draw/render.js';
import { toast } from '../ui/dialog.js';
import { confirmBox, renderMenu } from '../ui/menu.js';

export const jobTag = id => JOBS[id] ? `<span class="jtag" style="--jc:${JOBS[id].color}">${JOBS[id].name}</span>` : '';
export function jobAsk(id) {
  const pd = G.pd, J = JOBS[id]; if (!J) return;
  if (pd.lv < JOB_LV) { toast(`전직은 Lv${JOB_LV}부터 할 수 있어요`, 'warn'); return; }
  if (pd.job === id) return;
  if (pd.job && !jobCanPay(pd)) { toast(`직업을 바꾸려면 강화석 ${numF(JOB_COST.stones)}개 + ${numF(JOB_COST.gold)}G가 필요해요`, 'warn'); return; }
  const cost = JOB_BETA.free ? '\n베타 기간이라 직업 바꾸기도 무료예요.' : pd.job ? `\n강화석 ${numF(JOB_COST.stones)}개 + ${numF(JOB_COST.gold)}G가 들어요.` : '\n첫 전직은 무료예요. (나중에 바꾸려면 강화석·골드가 들어요)';
  const gift = JOB_GIFT[id] && !(pd.jobGift || {})[id] ? `\n전직 선물: ${JOB_GIFT[id].map(i => ITEMS[i].name).join(' · ')} (바로 착용)` : '';
  confirmBox(`「${J.full}」(으)로 ${pd.job ? '바꿀까요?' : '전직할까요?'}${cost}${gift}`, () => {
    const got = jobSet(pd, id); if (got === false) return;
    calcStats(); saveGame(); sfx('lvl'); renderMenu();
    toast(`${J.full} 탄생! ${J.always} · 대표 장비는 초월급 능력치`, 'lvl');
    if (got.length) setTimeout(() => toast(`전직 선물 ${got.map(k => ITEMS[k].name).join(' · ')} 착용!`, 'item r4'), 600);
  });
}
export function jobHtml(pd) {
  const cur = jobOf(pd), lvOk = pd.lv >= JOB_LV;
  let h = `<div class="jobhead"><b>전직</b>${cur ? jobTag(cur) : ''}<small class="jboost">직업에 맞는 <b>대표 장비</b>는 기본 능력치가 <b>초월 장비 수준</b>으로 올라가요. 강화하면 그만큼 더 세져요.</small><small>${lvOk ? (JOB_BETA.free ? (cur ? `지금 직업: ${JOBS[cur].full} · <b>베타 기간 자유 전직 무료</b> — 언제든 바꿔 봐요` : '직업을 하나 골라요. <b>베타 기간에는 언제든 무료로 바꿀 수 있어요.</b>') : cur ? `지금 직업: ${JOBS[cur].full} · 바꾸면 강화석 ${numF(JOB_COST.stones)}개 + ${numF(JOB_COST.gold)}G` : '직업을 하나 골라요. 첫 전직은 무료예요.') : `Lv${JOB_LV}가 되면 전직할 수 있어요. (지금 Lv.${pd.lv})`}</small></div>`;
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
export function jobTileHtml(pd) { return pd && pd.lv >= JOB_LV && !JOBS[pd.job] ? `<button class="ticon tpack tjob" id="tJob"><img src="${iconURL('i_jobbadge', ICONS.jobbadge)}" alt=""><small>전직 가능!</small><em class="dot"></em></button>` : ''; }
