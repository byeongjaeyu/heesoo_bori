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
import { tt } from '../sys/i18n.js';

export const jobTag = id => JOBS[id] ? `<span class="jtag" style="--jc:${JOBS[id].color}">${JOBS[id].name}</span>` : '';
export function jobAsk(id) {
  const pd = G.pd, J = JOBS[id]; if (!J) return;
  if (pd.lv < JOB_LV) { toast(tt('features/job.1', { JOB_LV }), 'warn'); return; }
  if (pd.job === id) return;
  if (pd.job && !jobCanPay(pd)) { toast(tt('features/job.2', { v1: numF(JOB_COST.stones), v2: numF(JOB_COST.gold) }), 'warn'); return; }
  const cost = JOB_BETA.free ? tt('features/job.3') : pd.job ? tt('features/job.4', { v1: numF(JOB_COST.stones), v2: numF(JOB_COST.gold) }) : tt('features/job.5');
  const gift = JOB_GIFT[id] && !(pd.jobGift || {})[id] ? tt('features/job.6', { v1: JOB_GIFT[id].map(i => ITEMS[i].name).join(' · ') }) : '';
  confirmBox(tt('features/job.27', { full: J.full, v1: pd.job ? tt('features/job.7') : tt('features/job.8'), cost, gift }), () => {
    const got = jobSet(pd, id); if (got === false) return;
    calcStats(); saveGame(); sfx('lvl'); renderMenu();
    toast(tt('features/job.9', { full: J.full, always: J.always }), 'lvl');
    if (got.length) setTimeout(() => toast(tt('features/job.10', { v1: got.map(k => ITEMS[k].name).join(' · ') }), 'item r4'), 600);
  });
}
export function jobHtml(pd) {
  const cur = jobOf(pd), lvOk = pd.lv >= JOB_LV;
  let h = tt('features/job.28', { v1: cur ? jobTag(cur) : '', v2: lvOk ? (JOB_BETA.free ? (cur ? tt('features/job.11', { full: JOBS[cur].full }) : tt('features/job.12')) : cur ? tt('features/job.13', { full: JOBS[cur].full, v1: numF(JOB_COST.stones), v2: numF(JOB_COST.gold) }) : tt('features/job.14')) : tt('features/job.15', { JOB_LV, lv: pd.lv }) });
  for (const id of Object.keys(JOBS)) {
    const J = JOBS[id], on = cur === id, n = jobSigN(pd, id);
    const sig = J.sig.map(i => { const it = ITEMS[i]; if (!it) return ''; const eq = SLOTS.some(sl => defOf(pd.eq[sl]) === i), own = ownsDef(pd, i);
      return `<span class="jsi${eq ? ' eq' : own ? ' own' : ''}" title="${it.name}"><img src="${itemURL(i)}" alt=""><small>${it.name}</small><em>${eq ? tt('features/job.16') : own ? tt('features/job.17') : (JOB_GIFT[id] || []).includes(i) ? tt('features/job.18') : tt('features/job.19')}</em></span>`; }).join('');
    const btn = !lvOk ? tt('features/job.20', { JOB_LV }) : on ? tt('features/job.21')
      : `<button class="btn pk sm" data-m="job" data-v="${id}">${cur ? tt('features/job.22') : tt('features/job.23')}</button>`;
    h += `<div class="jobc${on ? ' on' : ''}" style="--jc:${J.color}"><div class="jhd"><img src="${iconURL('jb_' + id, ICONS[J.icon])}" alt=""><div><b>${J.full}</b><small>「${J.flavor}」</small></div>${btn}</div>`
      + tt('features/job.24', { always: J.always })
      + tt('features/job.29', { sigTxt: J.sigTxt, v1: ['cheer', 'fish', 'bride'].includes(id) ? tt('features/job.25', { v1: Math.min(id === 'bride' ? 3 : 5, n) }) : '' })
      + `<div class="jsig">${sig}</div></div>`;
  }
  return h;
}
export function jobTileHtml(pd) { return pd && pd.lv >= JOB_LV && !JOBS[pd.job] ? tt('features/job.26', { v1: iconURL('i_jobbadge', ICONS.jobbadge) }) : ''; }
