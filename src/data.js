// ===================== GAME DATA =====================
const FOODS = {
  popcorn:    { name: '팝콘',       icon: 'popcorn',    hp: 0,    mp: 0.15, price: 20,  w: 30, desc: '고소한 팝콘 한 통. MP 15% 회복' },
  persimmon:  { name: '홍시',       icon: 'persimmon',  hp: 0.25, mp: 0,    price: 30,  w: 25, desc: '말랑달콤 홍시. HP 25% 회복' },
  cornflakes: { name: '콘푸라이트', icon: 'cornflakes', hp: 0,    mp: 0.30, price: 45,  w: 18, desc: '우유 말아 먹는 콘푸라이트. MP 30% 회복' },
  watermelon: { name: '수박',       icon: 'watermelon', hp: 0.20, mp: 0.20, price: 55,  w: 12, desc: '시원한 수박. HP·MP 20% 회복' },
  gangjeong:  { name: '닭강정',     icon: 'gangjeong',  hp: 0.50, mp: 0,    price: 80,  w: 8,  desc: '달콤바삭 닭강정. HP 50% 회복' },
  cake:       { name: '초코케이크', icon: 'cake',       hp: 0.10, mp: 0.50, price: 90,  w: 6,  desc: '꾸덕한 초코케이크. MP 50% + HP 10% 회복' },
  gimbap:     { name: '유통기한 임박 김밥', icon: 'gimbap', hp: 0.40, mp: 0, w: 0, noShop: 1, eatLine: ['유통기한... 오늘까지네? 괜찮겠지!', '냠. 아직 멀쩡해!', '단무지가 살짝 시큼한데?'], desc: '스마트 푸드 센터 재고떨이. 유통기한이 얼마 안 남았다... HP 40% 회복' },
  drink:      { name: '유통기한 임박 음료수', icon: 'drink', hp: 0, mp: 0.40, w: 0, noShop: 1, eatLine: ['캬~ 아직 탄산 살아있다!', '유통기한 D-1... 원샷!', '미지근하지만 괜찮아'], desc: '스마트 푸드 센터 재고떨이. 유통기한이 얼마 안 남았다... MP 40% 회복' },
  banhmi:     { name: '그리팅 반미',   icon: 'banhmi',   hp: 1, mp: 1, price: 900, w: 0.5, rar: 3, buff: { id: 'banhmi', name: '반미', t: 60, atk: 0.4 }, desc: '최고급! HP·MP 전부 회복 + 60초간 공격력 +40%' },
  jjukkumi:   { name: '그리팅 쭈꾸미', icon: 'jjukkumi', hp: 1, mp: 1, price: 900, w: 0.5, rar: 3, buff: { id: 'jjukkumi', name: '쭈꾸미', t: 60, atk: 0.15, crit: 0.25 }, desc: '최고급! HP·MP 전부 회복 + 60초간 치명타 +25%·공격력 +15%' },
  eel:        { name: '민물장어',   icon: 'eel',        hp: 1,    mp: 1,    price: 400, w: 1,  rar: 2, buff: { id: 'eel', name: '장어', t: 30, atk: 0.3 }, desc: '최강 보양식! HP·MP 전부 회복 + 30초간 공격력 +30%' }
};
const FOOD_ORDER = ['popcorn', 'persimmon', 'cornflakes', 'watermelon', 'gangjeong', 'cake', 'gimbap', 'drink', 'eel', 'banhmi', 'jjukkumi'];
const PREMIUM = ['eel', 'banhmi', 'jjukkumi'];

const RARITY = ['일반', '희귀', '영웅', '전설', '신화', '초월'];
const SLOTS = ['weapon', 'hat', 'armor', 'shoes', 'bag'];
const BSLOTS = ['bcloth', 'btoy'];
const SLOTNAME = { weapon: '무기', hat: '모자', armor: '옷', shoes: '신발', bag: '가방', bcloth: '보리 옷', btoy: '장난감' };
/** @type {Record<ItemId, ItemDef>} */
const ITEMS = {
  fist:       { slot: 'weapon', name: '맨주먹',       rar: 0, atk: 0,  icon: 'fist',       start: 1, w: { reach: 15, arc: 110, mul: 1, rate: 3.0, kb: 40, style: 'punch' }, desc: '작고 소중한 희수의 주먹' },
  churros:    { slot: 'weapon', name: '츄러스',       rar: 0, atk: 5,  icon: 'churros',    tier: 1, price: 160,  w: { reach: 20, arc: 120, mul: 1, rate: 2.7, kb: 50, style: 'swing' }, desc: '설탕 듬뿍 츄러스. 먹으면 안 됨' },
  selfie:     { slot: 'weapon', name: '셀카봉',       rar: 1, atk: 10, icon: 'selfie',     tier: 2, price: 520,  w: { reach: 28, arc: 60,  mul: 1, rate: 2.5, kb: 50, style: 'poke' }, desc: '길어서 멀리 찌른다' },
  umbrella:   { slot: 'weapon', name: '장우산',       rar: 1, atk: 16, icon: 'umbrella',   tier: 3, price: 950,  w: { reach: 25, arc: 150, mul: 1, rate: 2.1, kb: 90, style: 'swing' }, desc: '넓게 휘두르는 튼튼한 우산' },
  handbag:    { slot: 'weapon', name: '버려진 나무자재', rar: 3, atk: 24, crit: 0.06, icon: 'plank', tier: 3, w: { reach: 22, arc: 150, mul: 1, rate: 2.1, kb: 130, style: 'swing' }, desc: '공사장 옆에서 주운 튼튼한 각목. 곰인형이 숨겨둔 보물' },
  pan:        { slot: 'weapon', name: '프라이팬',     rar: 3, atk: 28, icon: 'pan',        tier: 4, price: 2100, w: { reach: 22, arc: 140, mul: 1, rate: 2.1, kb: 110, style: 'swing' }, desc: '땡! 소리가 경쾌하다' },
  lightstick: { slot: 'weapon', name: '롯데 자이언츠 응원봉', rar: 3, atk: 36, crit: 0.05, icon: 'cheerstick', tier: 4, price: 4200, w: { reach: 26, arc: 130, mul: 1, rate: 2.8, kb: 70, style: 'swing' }, desc: '9회말까지 쉬지 않고 흔든다. 빠르고 강하다' },

  cap_grey:  { slot: 'hat', name: '회색 볼캡', rar: 0, def: 1, color: '#8d939e', icon: 'hat', start: 1, desc: '희수의 최애 모자' },
  cap_pink:  { slot: 'hat', name: '핑크 볼캡', rar: 0, def: 2, mp: 15, color: '#f4a3c4', icon: 'hat', tier: 1, price: 130 },
  cap_sky:   { slot: 'hat', name: '하늘 볼캡', rar: 1, def: 4, mp: 30, color: '#8cc8f0', icon: 'hat', tier: 2, price: 480 },
  cap_black: { slot: 'hat', name: '블랙 볼캡', rar: 2, def: 7, mp: 40, crit: 0.03, color: '#45454f', icon: 'hat', tier: 3, price: 1100 },
  cap_gold:  { slot: 'hat', name: '황금 볼캡', rar: 3, def: 10, mp: 70, crit: 0.05, color: '#f0c040', icon: 'hat', tier: 4, price: 3200 },

  fleece:  { slot: 'armor', name: '뽀글이 플리스', rar: 0, def: 2, hp: 10, color: '#f7f3ea', icon: 'jacket', start: 1, desc: '따뜻한 흰 뽀글이' },
  hoodie:  { slot: 'armor', name: '핑크 후드티',   rar: 0, def: 4, hp: 30, color: '#f2b8c6', icon: 'jacket', tier: 1, price: 150 },
  padding: { slot: 'armor', name: '경량 패딩',     rar: 1, def: 8, hp: 60, color: '#6a7bc0', icon: 'jacket', tier: 2, price: 560 },
  coat:    { slot: 'armor', name: '캐시미어 코트', rar: 2, def: 12, hp: 100, crit: 0.02, color: '#c49a6c', icon: 'jacket', tier: 3, price: 1200 },
  longpad: { slot: 'armor', name: '롱패딩',        rar: 3, def: 18, hp: 160, color: '#3a3a46', icon: 'jacket', tier: 4, price: 3400 },

  sneakers: { slot: 'shoes', name: '흰 운동화',    rar: 0, spd: 0, color: '#ffffff', icon: 'shoes', start: 1 },
  slipon:   { slot: 'shoes', name: '슬립온',       rar: 0, spd: 0.05, def: 1, color: '#f0d080', icon: 'shoes', tier: 1, price: 140 },
  ugly:     { slot: 'shoes', name: '어글리 슈즈',  rar: 1, spd: 0.08, def: 3, color: '#c0c8d8', icon: 'shoes', tier: 2, price: 500 },
  running:  { slot: 'shoes', name: '명품 샌들',    rar: 2, spd: 0.14, def: 4, color: '#d8b070', icon: 'sandal', tier: 3, price: 1150 },
  skates:   { slot: 'shoes', name: '레인부츠',     rar: 3, spd: 0.22, def: 5, color: '#f0c020', icon: 'boots', tier: 4, price: 3000 },

  silverbag: { slot: 'bag', name: '실버 숄더백',   rar: 0, mp: 10, color: '#b9c0cc', icon: 'bag', start: 1, desc: '안에는 폰밖에 없다' },
  ecobag:    { slot: 'bag', name: '에코백',        rar: 0, hp: 20, mp: 15, color: '#e8dcc0', icon: 'bag', tier: 1, price: 130 },
  crossbag:  { slot: 'bag', name: '미니 크로스백', rar: 1, mp: 30, atk: 2, color: '#d05a6a', icon: 'bag', tier: 2, price: 500 },
  backpack:  { slot: 'bag', name: '귀여운 백팩',   rar: 2, hp: 60, mp: 40, atk: 4, color: '#7ab0e0', icon: 'bag', tier: 3, price: 1100 },
  b_knit:    { slot: 'bcloth', bori: 1, name: '엄마가 짜준 털옷',   rar: 0, bdmg: 0.2,  color: '#e8606e', pat: 'knit', icon: 'bknit', tier: 1, price: 240,  desc: '한 땀 한 땀 정성 가득. 신나서 더 세게 문다' },
  b_blanket: { slot: 'bcloth', bori: 1, name: '엄마가 대충 덮어준 이불', rar: 1, bdmg: 0.32, color: '#8cc0e8', pat: 'knit', icon: 'bblanket', tier: 2, price: 620, desc: '엄마가 대충 덮어준 이불. 포근해서 힘이 솟는다' },
  b_pad:     { slot: 'bcloth', bori: 1, name: '용인시장 강아지패딩', rar: 2, bdmg: 0.45, color: '#f0b440', pat: 'pad',  icon: 'bpad',  tier: 3, price: 1300, desc: '시장표 빵빵 패딩. 따뜻해서 보리 컨디션 최고' },
  toy_melon: { slot: 'btoy',   bori: 1, name: '수박장난감',         rar: 0, bdmg: 0.15, icon: 'tmelon', tier: 1, price: 180,  desc: '삑삑 소리 나는 수박. 물고 다니면 기분 UP' },
  toy_doll:  { slot: 'btoy',   bori: 1, name: '인형장난감',         rar: 1, bdmg: 0.3,  icon: 'tdoll',  tier: 2, price: 650,  desc: '보리 최애 애착인형' },
  toy_bone:  { slot: 'btoy',   bori: 1, name: '뼈다구장난감',       rar: 3, bdmg: 0.55, icon: 'tbone',  tier: 3, price: 1900, desc: '세상에서 제일 소중한 뼈다구' },
  clutch:    { slot: 'bag', name: '명품 핸드백',   rar: 3, atk: 8, mp: 60, crit: 0.04, color: '#e0c060', icon: 'handbag', tier: 4, price: 3100 },

  // ---- 4단계 보리 (상점) ----
  b_jump:    { slot: 'bcloth', bori: 1, name: '이마트 강아지패딩',  rar: 3, bdmg: 0.55, color: '#4a7ad0', pat: 'pad',  icon: 'bpad',  tier: 4, price: 3300, desc: '장 보러 갔다가 엄마가 한눈에 반해 사 온 패딩' },
  toy_duck:  { slot: 'btoy',   bori: 1, name: '삑삑이 오리',         rar: 3, bdmg: 0.65, icon: 'tdoll',  tier: 4, price: 3600, desc: '물 때마다 삑! 적들이 깜짝 놀란다' },

  // ---- 5단계 · 신화 (2회차부터 드롭 전용) ----
  goldpan:    { slot: 'weapon', name: '그리팅 사원증', rar: 4, atk: 44, crit: 0.06, icon: 'idcard', tier: 5, w: { reach: 120, arc: 0, mul: 1, rate: 2.4, kb: 40, style: 'throw' }, desc: '회차 전용. 사원증 카드를 휙휙 날리는 장거리 무기' },
  cap_rainbow:{ slot: 'hat', name: '무지개 볼캡', rar: 4, def: 14, mp: 95, crit: 0.06, color: '#b45cff', icon: 'hat', tier: 5, desc: '회차 전용' },
  goosepad:   { slot: 'armor', name: '구스 롱패딩', rar: 4, def: 25, hp: 230, crit: 0.02, color: '#f0f0f6', icon: 'jacket', tier: 5, desc: '회차 전용' },
  airshoes:   { slot: 'shoes', name: '명품 운동화', rar: 4, def: 7, spd: 0.26, color: '#f4f4f8', icon: 'shoes', tier: 5, desc: '회차 전용' },
  limitbag:   { slot: 'bag', name: '리미티드 핸드백', rar: 4, atk: 12, mp: 85, crit: 0.05, color: '#c0306a', icon: 'handbag', tier: 5, desc: '회차 전용' },
  b_xmas:     { slot: 'bcloth', bori: 1, name: '크리스마스 니트', rar: 4, bdmg: 0.68, color: '#3aa04a', pat: 'knit', icon: 'bknit', tier: 5, desc: '회차 전용' },
  toy_goldbone:{ slot: 'btoy', bori: 1, name: '황금 뼈다구', rar: 4, bdmg: 0.75, icon: 'tbone', tier: 5, desc: '회차 전용' },

  // ---- 6단계 · 초월 (3회차부터 드롭 전용) ----
  starstick:  { slot: 'weapon', name: '단단한 맥북프로', rar: 5, atk: 86, crit: 0.08, icon: 'laptop', tier: 6, w: { reach: 26, arc: 160, mul: 1, rate: 2.2, kb: 170, style: 'swing' }, desc: '회차 전용. 묵직한 알루미늄 한 방' },
  cap_tiara:  { slot: 'hat', name: '티아라 볼캡', rar: 5, def: 19, mp: 130, crit: 0.08, color: '#ffd1e6', icon: 'hat', tier: 6, desc: '회차 전용' },
  aurorapad:  { slot: 'armor', name: '오로라 패딩', rar: 5, def: 33, hp: 320, crit: 0.03, color: '#9fe8ff', icon: 'jacket', tier: 6, desc: '회차 전용' },
  wingshoes:  { slot: 'shoes', name: '남편의 갯바위 낚시신발', rar: 5, def: 9, spd: 0.3, color: '#5a6a4a', icon: 'fishshoe', tier: 6, desc: '회차 전용. 미끄러운 갯바위도 성큼성큼' },
  aurorabag:  { slot: 'bag', name: '오로라 미니백', rar: 5, atk: 17, mp: 115, crit: 0.07, color: '#7ef08a', icon: 'bag', tier: 6, desc: '회차 전용' },
  b_royal:    { slot: 'bcloth', bori: 1, name: '왕자님 망토', rar: 5, bdmg: 0.85, color: '#7a3ac0', pat: 'pad', icon: 'bpad', tier: 6, desc: '회차 전용' },
  toy_carp:   { slot: 'btoy', bori: 1, name: '전설의 월척 인형', rar: 5, bdmg: 0.95, icon: 'tdoll', tier: 6, desc: '회차 전용' }
};

const SKILLS = {
  fist:    { who: 'h', name: '주먹 단련',   icon: 'fist',      type: 'passive', max: 5, req: 1, desc: l => `기본 공격 피해 +${10 * l}%, 공격 속도 +${3 * l}%` },
  smash:   { who: 'h', name: '등짝 스매싱', icon: 'hand',      type: 'active', btn: 's1', max: 5, req: 1, mp: 8, cd: () => 3.5, desc: l => `앞쪽 적에게 공격력 ${220 + 40 * (l - 1)}% 피해 + 0.6초 기절` },
  nag:     { who: 'h', name: '잔소리 폭격', icon: 'bubble',    type: 'active', btn: 's2', max: 5, req: 3, mp: 15, cd: () => 6, desc: l => `잔소리 ${4 + l}발 발사! 각 ${90 + 15 * (l - 1)}% 피해 + 2초 둔화` },
  shop:    { who: 'h', name: '쇼핑 본능',   icon: 'bag',       type: 'passive', max: 3, req: 3, desc: l => `이동 속도 +${5 * l}%, 골드 획득 +${15 * l}%` },
  flash:   { who: 'h', name: '나 집에 갈래', icon: 'house',    type: 'active', btn: 's3', max: 5, req: 5, mp: 22, cd: () => 10, desc: l => `"나 집에 갈래!!" 주변 몬스터들이 전부 당황해서 ${150 + 30 * (l - 1)}% 피해 + ${(1.2 + 0.2 * l).toFixed(1)}초 기절` },
  mukbang: { who: 'h', name: '먹방 체질',   icon: 'gangjeong', type: 'passive', max: 3, req: 5, desc: l => `음식 회복량 +${20 * l}%, 최대 HP +${5 * l}%` },
  husband: { who: 'h', name: '오빠 살려줘!', icon: 'heart',   type: 'passive', max: 2, req: 40, desc: l => `쓰러지는 순간 오빠가 달려와 HP ${[30, 60][l - 1]}%로 다시 일으켜줘요${l >= 2 ? ' + 3초 무적' : ''}. 주변 몬스터는 깜짝 놀라 밀려나요 (스테이지당 1번 · 할로윈파티는 보스 웨이브마다 충전 · PvP 제외)` },
  menhera: { who: 'h', name: '멘헤라 공격', icon: 'bheart',    type: 'ult', btn: 'ult', max: 3, req: 8, mp: 50, cd: l => [40, 35, 30][Math.max(0, l - 1)], desc: l => `궁극기! 맵 전체 정신 공격. 공격력 ${(10 + 5 * l) * 100}% 방어 무시 피해 + 4초 멘붕 (쿨 ${[40, 35, 30][Math.max(0, l - 1)]}초)` },
  bite:    { who: 'b', name: '보리의 입질',    icon: 'paw',       type: 'passive', max: 5, req: 3, desc: l => `보리 물기 피해: 공격력의 ${40 + 15 * l}%` },
  bark:    { who: 'b', name: '멍멍!',       icon: 'sound',     type: 'auto', max: 5, req: 4, desc: l => `${(9 - 0.6 * (l - 1)).toFixed(1)}초마다 짖어서 주변 적 ${60 + 20 * l}% 피해 + 공포` },
  feed:    { who: 'b', name: '언니줘!',     icon: 'gangjeong', type: 'auto', max: 3, req: 4, desc: l => `보리가 음식을 물어다 언니를 먹여줘요! HP ${[40, 50, 60][l - 1]}% · MP ${[30, 40, 50][l - 1]}% 아래로 떨어지면 자동으로 냠 (최고급 음식은 아껴둬요). 배우면 음식 버튼이 사라져요` },
  wag:     { who: 'b', name: '보리 테라피',   icon: 'heart',     type: 'passive', max: 3, req: 6, desc: l => `보리 곁에 있으면 초당 HP·MP ${(0.6 * l).toFixed(1)}% 추가 회복` },
  zoomies: { who: 'b', name: '보리 주세요', icon: 'bolt',      type: 'auto', max: 3, req: 9, desc: l => `12초마다 적들 사이를 우다다! 각 ${120 + 40 * l}% 피해` }
};
const SKILL_TYPE = { passive: '패시브', active: '액티브', ult: '궁극기', auto: '자동' };

const MONS = {
  slime:   { name: '솜사탕 슬라임', spr: 'slime',   hp: 45,  atk: 9,  def: 0,  spd: 26, xp: 10, gold: [2, 4],   r: 6, ai: 'hop',    col: '#ffb3d9' },
  balloon: { name: '풍선 유령',     spr: 'balloon', hp: 34,  atk: 11, def: 0,  spd: 30, xp: 11, gold: [2, 5],   r: 5, ai: 'float',  col: '#b45cff', fly: 1 },
  horse:   { name: '폭주 목마',     spr: 'horse',   hp: 200, atk: 22, def: 4,  spd: 34, xp: 26, gold: [6, 10],  r: 7, ai: 'charge', col: '#ffffff' },
  soldier: { name: '츄러스 병정',   spr: 'soldier', hp: 190, atk: 21, def: 5,  spd: 24, xp: 26, gold: [6, 10],  r: 5, ai: 'ranged', proj: 'churro', col: '#e8414f' },
  raccoon: { name: '성난 너구리',   spr: 'raccoon', hp: 420, atk: 38, def: 7,  spd: 44, xp: 50, gold: [12, 20], r: 6, ai: 'chase',  col: '#a0a6b0' },
  bear:    { name: '가출한 곰인형', spr: 'bear',    hp: 650, atk: 44, def: 10, spd: 22, xp: 62, gold: [15, 24], r: 7, ai: 'chase',  col: '#8a5a3a' },
  coaster: { name: '폭주 열차',     spr: 'coaster', hp: 900, atk: 70, def: 12, spd: 38, xp: 90, gold: [22, 34], r: 8, ai: 'charge', col: '#e8414f' },
  clown:   { name: '광대 인형',     spr: 'clown',   hp: 800, atk: 64, def: 10, spd: 30, xp: 88, gold: [22, 34], r: 6, ai: 'ranged', proj: 'confetti', col: '#b45cff' },
  boss1: { name: '왕풍선 유령',   spr: 'balloon', scale: 3, crown: 1, hp: 900,   atk: 16, def: 2,  spd: 22, xp: 200,  gold: [90, 110],  r: 15, ai: 'boss1', boss: 1, col: '#b45cff', fly: 1, drops: ['churros', 'cap_pink', 'toy_melon'] },
  boss2: { name: '폭주 회전컵',   spr: 'teacup',  scale: 2, hp: 3200,  atk: 28, def: 6,  spd: 40, xp: 600,  gold: [250, 300], r: 17, ai: 'boss2', boss: 1, col: '#ffb3d9', drops: ['selfie', 'ugly', 'b_knit'] },
  boss3: { name: '거대 곰인형',   spr: 'bear',    scale: 3, crown: 1, hp: 9000,  atk: 42, def: 12, spd: 20, xp: 1300, gold: [500, 600], r: 19, ai: 'boss3', boss: 1, col: '#8a5a3a', drops: ['handbag', 'coat', 'toy_bone'] },
  boss4: { name: '퍼레이드 대왕', spr: 'clown',   scale: 4, crown: 1, hp: 20000, atk: 70, def: 14, spd: 24, xp: 3000, gold: [0, 0],     r: 21, ai: 'boss4', boss: 1, col: '#b45cff' }
};

const ZONES = [
  { name: '정문 광장',          sub: 'STAGE 1',     quota: 20, max: 9,  spawnInt: 1.4, mons: [['slime', 6], ['balloon', 4]], boss: 'boss1', theme: 'plaza',  next: '매직랜드' },
  { name: '매직랜드',           sub: 'STAGE 2',     quota: 30, max: 10, spawnInt: 1.3, mons: [['horse', 5], ['soldier', 4], ['balloon', 2]], boss: 'boss2', theme: 'pastel', next: '사파리 월드' },
  { name: '사파리 월드',        sub: 'STAGE 3',     quota: 34, max: 11, spawnInt: 1.25, mons: [['raccoon', 5], ['bear', 4]], boss: 'boss3', theme: 'grass',  next: '유러피언 어드벤처' },
  { name: '유러피언 어드벤처',  sub: 'FINAL STAGE', quota: 38, max: 12, spawnInt: 1.2, mons: [['coaster', 5], ['clown', 4], ['bear', 1]], boss: 'boss4', theme: 'cobble', next: '탈출구' }
];

const NAG_WORDS = ['방 치워!', '밥 먹었어?', '양말!!', '또 게임해?', '설거지!', '일찍 와!', '물 마셔!', '옷 걸어!', '불 꺼!', '손 씻어!', '자세 똑바로!', '휴지 갈아!', '빨래 개!', '변기 커버!'];
const MENHERA_LINES = ['나 사랑해? 얼마나?', '왜 답장 안 해?', '읽씹했지?', '아까 그 여자 누구야?', '됐어. 아무것도 아니야.', '나 화난 거 몰라?', '오늘 나 뭐 달라진 거 없어?', '나만 봐.', '낚시가 좋아, 내가 좋아?', '나 살찐 것 같지?', '우리 처음 만난 날 기억해?', '내가 왜 화났는지 맞혀봐', '너 변했어...', '알아서 해 그럼.', '지금 한숨 쉰 거야?', '나 없이도 잘 지내지?'];
const PHONE_WORDS = ['ㅋㅋㅋ', '♥', '좋아요', 'DM', '♪', 'ㅎㅎ', '인스타', '쇼핑중'];

function xpNeed(lv) { return Math.round(30 * Math.pow(lv, 1.8)); }

// ===== 각성 (Lv50 이후): 경험치가 계속 쌓여 각성 포인트 → 능력치·스킬 강화 =====
const AWK = {
  atk:   { name: '공격력',   icon: 'fist',   per: 3,     fmt: v => `+${v}` },
  def:   { name: '방어력',   icon: 'house',  per: 2,     fmt: v => `+${v}` },
  hp:    { name: '최대 HP',  icon: 'heart',  per: 25,    fmt: v => `+${v}` },
  mp:    { name: '최대 MP',  icon: 'sound',  per: 8,     fmt: v => `+${v}` },
  crit:  { name: '치명타',   icon: 'bolt',   per: 0.003, max: 50, fmt: v => `+${(v * 100).toFixed(1).replace('.0', '')}%` },
  skill: { name: '스킬 위력', icon: 'bubble', per: 0.02,  fmt: v => `+${Math.round(v * 100)}%`, desc: '등짝 스매싱·잔소리·집에 갈래·멘헤라 피해' },
  bori:  { name: '보리 공격', icon: 'paw',   per: 0.02,  bori: 1, fmt: v => `+${Math.round(v * 100)}%`, desc: '보리 물기·멍멍·우다다 피해' }
};
const awkNeed = aw => Math.round(xpNeed(50) * (1 + 0.03 * aw));
