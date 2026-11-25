// 게임 데이터 타입. 세이브 호환성: 필드는 지우지 말고, 새 필드는 선택(?)으로 추가 + loadGame 기본값 처리

type ItemId = string;
type FoodId = string;
type SkillId = string;
type HeroSlot = 'weapon' | 'hat' | 'armor' | 'shoes' | 'bag';
type BoriSlot = 'bcloth' | 'btoy';
type EquipSlot = HeroSlot | BoriSlot;
type AwakenStat = 'atk' | 'def' | 'hp' | 'mp' | 'crit' | 'skill' | 'bori';

/** 1탄 세이브 (localStorage heesu_bori_save_v1) */
interface SaveData {
  /** 꾸미기: 부위별 겉모습 장비(도감에 있어야 적용) + 헤어 색 */
  look?: Partial<Record<HeroSlot, ItemId>> & { hair?: string };
  /** 오늘 데려온 친구 희수 (day=todayKey, left=남은 초) */
  buddy?: { day: string; uid: string; nick: string; snap: any; left: number };
  /** 장비 도감: 한 번이라도 얻은 장비 */
  book?: Record<ItemId, number>;
  /** 첫 걸음 가이드 단계 (GUIDE.length 이상 = 끝) */
  guide?: number;
  /** 세이브 고유 번호 (랭킹 중복 등록 방지). 예전 세이브는 loadGame 때 생성 */
  sid?: string;
  lv: number;
  /** Lv50 미만: 레벨 경험치, Lv50 이상: 각성 경험치 */
  xp: number;
  gold: number;
  /** 스킬 포인트 */
  sp: number;
  skills: Record<SkillId, number>;
  /** 보유 장비 (값은 항상 1) */
  inv: Record<ItemId, number>;
  eq: Record<HeroSlot, ItemId>;
  beq: Record<BoriSlot, ItemId | null>;
  foods: Record<FoodId, number>;
  /** 장비별 강화 단계 (+0 ~ +ENH_MAX) */
  enh: Record<ItemId, number>;
  /** 장비 레벨 (같은 부위·등급 5개마다 +1) */
  ilv: Record<ItemId, number>;
  /** 장비 레벨 재료 진행도 (0~4) */
  iexp: Record<ItemId, number>;
  /** 강화석 */
  stones: number;
  /** 현재 회차의 스테이지 인덱스 (ZONES) */
  zone: number;
  /** 엔딩을 본 횟수 = 회차 - 1 */
  cleared: number;
  boriJoined: boolean;
  stats: { kills: number; ults: number; deaths: number; time: number; eaten: number; boss?: number; pvpW?: number; raidBest?: number; brkTry?: number };
  /** 업적: id → 달성 시각 */
  ach?: Record<string, number>;
  /** 장착 칭호 (업적 id) */
  title?: string;
  achNew?: boolean;
  /** 방치 보상이 쌓이기 시작한 시각 (플레이 중 저장할 때마다 갱신) */
  idleT?: number;
  /** 뉴비 패키지: 처음 본 시각·받은 시각 */
  pack?: { seen?: number; got?: number };
  /** 성장 패키지(뉴비 세트 2) */
  pack2?: { seen?: number; got?: number };
  /** 회차 보상: 받은 이정표(회차 → 받은 시각), 마지막으로 알린 총 회차 */
  ms?: Record<string, number>;
  msSeen?: number;
  /** 보스 타워: 최고 돌파 층 */
  tower?: { best?: number };
  /** 지금 고른 장 (1 에버랜드 · 2 바다낚시터) */
  chap?: number;
  /** 강화석 교환소: 오늘 산 개수 */
  xch?: { day: string; n: number };
  /** 장비 재련 추가 옵션 (item id → 옵션 줄) */
  /** 같은 장비가 또 나오면 이 등급 이상은 가방에 따로 보관 (없으면 강화석) */
  keepDup?: number;
  /** 전직 (Lv50): dev·career·cheer·bride·fish */
  job?: string;
  /** 직업 바꾼 횟수 */
  jobN?: number;
  /** 받은 전직 선물 (직업 id → 1) */
  jobGift?: Record<string, number>;
  /** 거래로 서버에 맡겨 넘긴 장비 키 (다시 쓰면 서버가 거절) */
  tkeys?: string[];
  /** 마지막 저장 시각 (로그인 계정: 서버 세이브가 더 최근이면 받아옴) */
  svT?: number;
  ref?: Record<string, { lines: { k: string; v: number; g: number; lk?: number }[]; n: number }>;
  /** 2장 진행도 (zone 4~7) */
  ch2?: { zone: number; cleared: number; intro?: number; seen?: Record<string, number> };
  /** 3장 진행도 (zone 8~11) */
  ch3?: { zone: number; cleared: number; intro?: number; seen?: Record<string, number> };
  ch4?: { zone: number; cleared: number; intro?: number; seen?: Record<string, number> };

  /** 각성 단계 (Lv50 이후) */
  aw?: number;
  /** 남은 각성 포인트 */
  ap?: number;
  /** 각성 포인트 투자 */
  awp?: Partial<Record<AwakenStat, number>>;
  /** 오늘 자동사냥 쿠폰 */
  auto?: { day: string; left: number };
  /** 선물 받은 자동사냥 시간(초), 자정에 안 사라짐 */
  autoBonus?: number;
  /** 할로윈파티 최고 웨이브 */
  infBest?: number;
  /** 출석: 마지막 출석일(todayKey), 누적 일수 */
  att?: { last: string; n: number };
  /** 오늘의 미션 */
  daily?: { day: string; picks: string[]; prog: Record<string, number>; got: string[]; all: boolean };
  /** 메뉴 알림 점 */
  newItem?: boolean;
  newBori?: boolean;
}

/** 장비 정의 (data.js ITEMS) */
interface ItemDef {
  /** 보스 확정 드롭 전용 (일반 드롭·상자 풀에서 제외) */
  bossOnly?: number;
  /** 전직 전용 장비 (직업 id) — 거래·도감·드롭·분해 제외 */
  job?: string;
  /** 보스 드롭 장비의 장 (2 낚시, 3 응원) */
  ch?: number;
  slot: EquipSlot;
  name: string;
  /** 0 일반 · 1 희귀 · 2 영웅 · 3 전설 · 4 신화 · 5 초월 */
  rar: number;
  tier?: number;
  price?: number;
  desc?: string;
  icon?: string;
  color?: string;
  pat?: string;
  start?: boolean | number;
  noShop?: boolean | number;
  bori?: boolean | number;
  /** 보리 장비: 보리 공격 보너스 */
  bdmg?: number;
  atk?: number; def?: number; hp?: number; mp?: number; spd?: number; crit?: number;
  style?: string;
  /** 무기 판정 */
  w?: { reach: number; rate: number; [k: string]: any };
}
