// ===================== 업적과 칭호 =====================
// 업적을 깨면 강화석 보상 + 칭호 해금. 장착한 칭호는 snap.ttl 로 랭킹·PvP·카드·동료 이름표에 표시 (꾸미기라 능력치 없음)
const ACH_TIER = ['', '브론즈', '실버', '골드', '레전드'], ACH_REW = [0, 5, 15, 40, 100];
const ACH_COL = ['', '#f0b27a', '#cfe0f0', '#ffd84a', '#ff9ce0'];
const achMaxEnh = pd => Math.max(0, ...Object.values(pd.enh || {}).map(Number));
const achFullEnh = pd => { const ids = [...SLOTS.map(s => pd.eq[s]), ...(pd.boriJoined ? BSLOTS.map(s => (pd.beq || {})[s]) : [])]; return ids.filter(id => id && ((pd.enh || {})[id] || 0) >= 25).length; };
const achFullN = pd => SLOTS.length + (pd.boriJoined ? BSLOTS.length : 0) || 1;
/** @type {{id:string, t:string, d:string, tier:number, sp?:number, v:(pd:any)=>number, g:number|((pd:any)=>number)}[]} */
const ACH = [
  { id: 'k100', t: '새내기 사냥꾼', d: '몬스터 100마리 처치', tier: 1, v: pd => pd.stats.kills, g: 100 },
  { id: 'k1k', t: '몬스터 사냥꾼', d: '몬스터 1,000마리 처치', tier: 2, v: pd => pd.stats.kills, g: 1000 },
  { id: 'k10k', t: '만 마리의 전설', d: '몬스터 10,000마리 처치', tier: 3, v: pd => pd.stats.kills, g: 10000 },
  { id: 'k100k', t: '에버랜드 청소부', d: '몬스터 100,000마리 처치', tier: 4, v: pd => pd.stats.kills, g: 100000 },
  { id: 'b10', t: '보스 헌터', d: '보스 10번 처치', tier: 2, v: pd => pd.stats.boss || 0, g: 10 },
  { id: 'b100', t: '보스의 악몽', d: '보스 100번 처치', tier: 3, v: pd => pd.stats.boss || 0, g: 100 },
  { id: 'lv50', t: '만렙 희수', d: '레벨 50 달성', tier: 2, v: pd => pd.lv, g: 50 },
  { id: 'aw10', t: '깨어난 희수', d: '각성 ★10', tier: 2, v: pd => pd.aw || 0, g: 10 },
  { id: 'aw100', t: '각성의 끝', d: '각성 ★100', tier: 4, v: pd => pd.aw || 0, g: 100 },
  { id: 'c1', t: '에버랜드 탈출', d: '에버랜드 대탈출 클리어', tier: 1, v: pd => pd.cleared || 0, g: 1 },
  { id: 'c5', t: '회차 장인', d: '5번 클리어', tier: 3, v: pd => pd.cleared || 0, g: 5 },
  { id: 'c10', t: '열 번의 탈출', d: '10번 클리어', tier: 4, v: pd => pd.cleared || 0, g: 10 },
  { id: 'e15', t: '강화 입문', d: '장비 +15 달성', tier: 1, v: achMaxEnh, g: 15 },
  { id: 'e20', t: '강화 중독', d: '장비 +20 달성', tier: 2, v: achMaxEnh, g: 20 },
  { id: 'e25', t: '+25의 주인', d: '장비 +25 달성', tier: 3, v: achMaxEnh, g: 25 },
  { id: 'eall', t: '풀강 희수', d: '착용 장비 전부 +25 (보리 포함)', tier: 4, v: achFullEnh, g: achFullN },
  { id: 'bk22', t: '수집가', d: '장비 도감 22칸', tier: 2, v: pd => bookStats(pd).n, g: 22 },
  { id: 'bk44', t: '도감 마스터', d: '장비 도감 44칸 완성', tier: 4, v: pd => bookStats(pd).n, g: 44 },
  { id: 'w20', t: '파티 피플', d: '할로윈파티 WAVE 20', tier: 2, v: pd => pd.infBest || 0, g: 20 },
  { id: 'w50', t: '할로윈 킹', d: '할로윈파티 WAVE 50', tier: 3, v: pd => pd.infBest || 0, g: 50 },
  { id: 'p10', t: '아레나 신인', d: 'PvP 10승', tier: 1, v: pd => pd.stats.pvpW || 0, g: 10 },
  { id: 'p100', t: '아레나 챔피언', d: 'PvP 100승', tier: 3, v: pd => pd.stats.pvpW || 0, g: 100 },
  { id: 'r1m', t: '보스 브레이커', d: '레이드 한 번에 피해량 100만', tier: 3, v: pd => pd.stats.raidBest || 0, g: 1000000 },
  { id: 'u1k', t: '멘헤라 장인', d: '멘헤라 공격 1,000번', tier: 2, v: pd => pd.stats.ults, g: 1000 },
  { id: 'f500', t: '먹방 여신', d: '음식 500개 먹기', tier: 2, v: pd => pd.stats.eaten, g: 500 },
  { id: 'd100', t: '칠전팔기', d: '100번 기절하고 일어나기', tier: 1, v: pd => pd.stats.deaths, g: 100 },
  { id: 't10', t: '에버랜드 단골', d: '플레이 10시간', tier: 1, v: pd => pd.stats.time, g: 36000 },
  { id: 't100', t: '에버랜드 주민', d: '플레이 100시간', tier: 3, v: pd => pd.stats.time, g: 360000 },
  { id: 'c2n', t: '밤낚시 생존자', d: '2장 STAGE 7 밤낚시 통과', tier: 2, v: pd => pd.ch2 && (pd.ch2.cleared || pd.ch2.zone >= 7) ? 1 : 0, g: 1 },
  { id: 'c2', t: '월척 헌터', d: '2장 클리어 (오빠 구출)', tier: 3, v: pd => (pd.ch2 && pd.ch2.cleared) || 0, g: 1 },
  { id: 'c2x5', t: '바다의 주인', d: '2장 5번 클리어', tier: 4, v: pd => (pd.ch2 && pd.ch2.cleared) || 0, g: 5 },
  { id: 'c3r', t: '우천 극복', d: '3장 9회말 그라운드 도착', tier: 2, v: pd => pd.ch3 && (pd.ch3.cleared || pd.ch3.zone >= 11) ? 1 : 0, g: 1 },
  { id: 'c3', t: '9회말의 기적', d: '3장 클리어 (역전승)', tier: 3, v: pd => (pd.ch3 && pd.ch3.cleared) || 0, g: 1 },
  { id: 'c3x5', t: '사직 개근러', d: '3장 5번 클리어', tier: 4, v: pd => (pd.ch3 && pd.ch3.cleared) || 0, g: 5 },
  { id: 'c4s', t: '좋아무새 사육사', d: '4장 드레스 투어 통과', tier: 2, v: pd => pd.ch4 && (pd.ch4.cleared || pd.ch4.zone >= 14) ? 1 : 0, g: 1 },
  { id: 'c4', t: '새신부', d: '4장 클리어 (본식)', tier: 3, v: pd => (pd.ch4 && pd.ch4.cleared) || 0, g: 1 },
  { id: 'c4x5', t: '리마인드 웨딩', d: '4장 5번 클리어', tier: 4, v: pd => (pd.ch4 && pd.ch4.cleared) || 0, g: 5 },
  { id: 'lp30', t: '회차 마라토너', d: '총 30회차 (1~4장 클리어 합계)', tier: 3, v: pd => loopsTotal(pd), g: 30 },
  { id: 'lp50', t: '무한 회차', d: '총 50회차', tier: 4, v: pd => loopsTotal(pd), g: 50 },
  { id: 'lp100', t: '백회차 전설', d: '총 100회차', tier: 4, v: pd => loopsTotal(pd), g: 100 },
  { id: 'tw10', t: '타워 등반가', d: '보스 타워 10층 돌파', tier: 2, v: pd => towerBest(pd), g: 10 },
  { id: 'tw30', t: '타워 정복자', d: '보스 타워 30층 돌파', tier: 3, v: pd => towerBest(pd), g: 30 },
  { id: 'tw50', t: '하늘 위의 희수', d: '보스 타워 50층 돌파', tier: 4, v: pd => towerBest(pd), g: 50 },
  // 한정 칭호 (가진 사람만 목록에 보임, 업적 보상 없음)
  { id: 'beta', t: '베타 개척자', d: '베타 기간 뉴비 패키지', tier: 4, sp: 1, v: pd => pd.pack && pd.pack.got ? 1 : 0, g: 1 },
];
const ACH_BY = Object.fromEntries(ACH.map(a => [a.id, a]));
const achGoal = (a, pd) => typeof a.g === 'function' ? a.g(pd) : a.g;
const achDone = (pd, a) => { try { return a.v(pd) >= achGoal(a, pd); } catch (e) { return false; } };
/** 칭호 이름표 HTML (모르는 id면 빈 문자열) */
const achTag = id => { const a = id && ACH_BY[id]; return a ? `<span class="ttag t${a.tier}">${a.t}</span>` : ''; };
/** 새로 깬 업적 등록 + 강화석 지급. 여러 개면 한 번에 알림 */
function achvCheck() {
  const pd = G.pd; if (FORCE_EASY || !pd || !pd.stats) return;
  pd.ach = pd.ach || {}; const got = [];
  for (const a of ACH) if (!pd.ach[a.id] && achDone(pd, a)) { pd.ach[a.id] = Date.now(); pd.stones = (pd.stones || 0) + (a.sp ? 0 : ACH_REW[a.tier]); got.push(a); }
  if (!got.length) return;
  pd.achNew = true; saveGame(); sfx('lvl');
  const st = got.reduce((s, a) => s + (a.sp ? 0 : ACH_REW[a.tier]), 0);
  if (got.length === 1) toast(`🏅 업적 달성! 칭호 「${got[0].t}」 · 강화석 ${st}개`, 'lvl');
  else toast(`🏅 업적 ${got.length}개 달성! 강화석 ${st}개 · 메뉴 「칭호」에서 확인해요`, 'lvl');
  if (!$('#menu').hidden && MTAB === 'achv') renderMenu();
}
function achvHtml(pd) {
  pd.achNew = false; const own = pd.ach || {}, n = ACH.filter(a => own[a.id] && !a.sp).length, NA = ACH.filter(a => !a.sp).length, cur = pd.title && own[pd.title] ? pd.title : '';
  let h = `<div class="bookhead"><b>업적과 칭호</b><span>${n} / ${NA}</span></div>`
    + `<div class="achnow">지금 칭호 ${cur ? achTag(cur) : '<span class="ttag">없음</span>'}${cur ? '<button class="btn wh sm" data-m="ttl" data-v="">떼기</button>' : ''}<small>칭호는 랭킹·PvP·카드·동료 이름표에 붙어요</small></div>`;
  const list = ACH.filter(a => !a.sp || own[a.id]).sort((x, y) => (own[y.id] ? 1 : 0) - (own[x.id] ? 1 : 0) || x.tier - y.tier);
  for (const a of list) {
    const ok = !!own[a.id], g = achGoal(a, pd), v = Math.min(g, Math.floor(a.v(pd) || 0)), on = cur === a.id;
    h += `<div class="ach${ok ? ' ok' : ''}${on ? ' on' : ''}"><i class="am t${a.tier}">${ACH_TIER[a.tier][0]}</i><span><b>${ok ? achTag(a.id) : `<span class="ttag lock">${a.t}</span>`}</b><small>${a.d}${a.sp ? ' · 한정' : ' · 보상 강화석 ' + ACH_REW[a.tier]}</small>`
      + (ok ? '' : `<em class="abar"><u style="width:${Math.round(v / g * 100)}%"></u></em><small>${a.id[0] === 't' ? fmtTime(v) + ' / ' + fmtTime(g) : v.toLocaleString() + ' / ' + g.toLocaleString()}</small>`) + '</span>'
      + (ok ? (on ? '<button class="btn sm" disabled>장착 중</button>' : `<button class="btn pk sm" data-m="ttl" data-v="${a.id}">장착</button>`) : '') + '</div>';
  }
  return h;
}
function achvBoot() { if (FORCE_EASY) return; setInterval(() => { try { if (G.state === 'play' || G.state === 'menu' || G.state === 'lobbyMenu') achvCheck(); } catch (e) { } }, 1000); }
