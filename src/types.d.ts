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
  stats: { kills: number; ults: number; deaths: number; time: number; eaten: number };

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
  /** 메뉴 알림 점 */
  newItem?: boolean;
  newBori?: boolean;
}

/** 장비 정의 (data.js ITEMS) */
interface ItemDef {
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
