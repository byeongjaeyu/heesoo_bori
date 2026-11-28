// ===================== GAME DATA =====================
import { tt } from '../sys/i18n.js';
export const FOODS = {
  popcorn:    { name: tt('core/data.1'),       icon: 'popcorn',    hp: 0,    mp: 0.15, price: 20,  w: 30, desc: tt('core/data.2') },
  persimmon:  { name: tt('core/data.3'),       icon: 'persimmon',  hp: 0.25, mp: 0,    price: 30,  w: 25, desc: tt('core/data.4') },
  cornflakes: { name: tt('core/data.5'), icon: 'cornflakes', hp: 0,    mp: 0.30, price: 45,  w: 18, desc: tt('core/data.6') },
  watermelon: { name: tt('core/data.7'),       icon: 'watermelon', hp: 0.20, mp: 0.20, price: 55,  w: 12, desc: tt('core/data.8') },
  gangjeong:  { name: tt('core/data.9'),     icon: 'gangjeong',  hp: 0.50, mp: 0,    price: 80,  w: 8,  desc: tt('core/data.10') },
  cake:       { name: tt('core/data.11'), icon: 'cake',       hp: 0.10, mp: 0.50, price: 90,  w: 6,  desc: tt('core/data.12') },
  gimbap:     { name: tt('core/data.13'), icon: 'gimbap', hp: 0.40, mp: 0, w: 0, noShop: 1, eatLine: [tt('core/data.14'), tt('core/data.15'), tt('core/data.16')], desc: tt('core/data.17') },
  drink:      { name: tt('core/data.18'), icon: 'drink', hp: 0, mp: 0.40, w: 0, noShop: 1, eatLine: [tt('core/data.19'), tt('core/data.20'), tt('core/data.21')], desc: tt('core/data.22') },
  banhmi:     { name: tt('core/data.23'),   icon: 'banhmi',   hp: 1, mp: 1, price: 900, w: 0.5, rar: 3, buff: { id: 'banhmi', name: tt('core/data.24'), t: 60, atk: 0.4 }, desc: tt('core/data.25') },
  jjukkumi:   { name: tt('core/data.26'), icon: 'jjukkumi', hp: 1, mp: 1, price: 900, w: 0.5, rar: 3, buff: { id: 'jjukkumi', name: tt('core/data.27'), t: 60, atk: 0.15, crit: 0.25 }, desc: tt('core/data.28') },
  eel:        { name: tt('core/data.29'),   icon: 'eel',        hp: 1,    mp: 1,    price: 400, w: 1,  rar: 2, buff: { id: 'eel', name: tt('core/data.30'), t: 30, atk: 0.3 }, desc: tt('core/data.31') }
};
export const FOOD_ORDER = ['popcorn', 'persimmon', 'cornflakes', 'watermelon', 'gangjeong', 'cake', 'gimbap', 'drink', 'eel', 'banhmi', 'jjukkumi'];
export const PREMIUM = ['eel', 'banhmi', 'jjukkumi'];

export const RARITY = [tt('core/data.32'), tt('core/data.33'), tt('core/data.34'), tt('core/data.35'), tt('core/data.36'), tt('core/data.37')];
export const SLOTS = ['weapon', 'hat', 'armor', 'shoes', 'bag'];
export const BSLOTS = ['bcloth', 'btoy'];
export const SLOTNAME = { weapon: tt('core/data.38'), hat: tt('core/data.39'), armor: tt('core/data.40'), shoes: tt('core/data.41'), bag: tt('core/data.42'), bcloth: tt('core/data.43'), btoy: tt('core/data.44') };
/** 개별 장비 키 → 장비 이름. 같은 장비 첫 개는 이름 그대로('starstick'), 둘째부터 'starstick#a1b2' */
export const defOf = (/** @type {any} */ k) => k ? String(k).split('#')[0] : k;
/** @type {Record<ItemId, ItemDef>} */
export const ITEM_DEFS = {
  fist:       { slot: 'weapon', name: tt('core/data.45'),       rar: 0, atk: 0,  icon: 'fist',       start: 1, w: { reach: 15, arc: 110, mul: 1, rate: 3.0, kb: 40, style: 'punch' }, desc: tt('core/data.46') },
  churros:    { slot: 'weapon', name: tt('core/data.47'),       rar: 0, atk: 5,  icon: 'churros',    tier: 1, price: 160,  w: { reach: 20, arc: 120, mul: 1, rate: 2.7, kb: 50, style: 'swing' }, desc: tt('core/data.48') },
  selfie:     { slot: 'weapon', name: tt('core/data.49'),       rar: 1, atk: 10, icon: 'selfie',     tier: 2, price: 520,  w: { reach: 28, arc: 60,  mul: 1, rate: 2.5, kb: 50, style: 'poke' }, desc: tt('core/data.50') },
  umbrella:   { slot: 'weapon', name: tt('core/data.51'),       rar: 1, atk: 16, icon: 'umbrella',   tier: 3, price: 950,  w: { reach: 25, arc: 150, mul: 1, rate: 2.1, kb: 90, style: 'swing' }, desc: tt('core/data.52') },
  handbag:    { slot: 'weapon', name: tt('core/data.53'), rar: 3, atk: 24, crit: 0.06, icon: 'plank', tier: 3, w: { reach: 22, arc: 150, mul: 1, rate: 2.1, kb: 130, style: 'swing' }, desc: tt('core/data.54') },
  pan:        { slot: 'weapon', name: tt('core/data.55'),     rar: 3, atk: 28, icon: 'pan',        tier: 4, price: 2100, w: { reach: 22, arc: 140, mul: 1, rate: 2.1, kb: 110, style: 'swing' }, desc: tt('core/data.56') },
  lightstick: { slot: 'weapon', name: tt('core/data.57'), rar: 3, atk: 36, crit: 0.05, icon: 'cheerstick', tier: 4, price: 4200, w: { reach: 26, arc: 130, mul: 1, rate: 2.8, kb: 70, style: 'swing' }, desc: tt('core/data.58') },

  cap_grey:  { slot: 'hat', name: tt('core/data.59'), rar: 0, def: 1, color: '#8d939e', icon: 'hat', start: 1, desc: tt('core/data.60') },
  cap_pink:  { slot: 'hat', name: tt('core/data.61'), rar: 0, def: 2, mp: 15, color: '#f4a3c4', icon: 'hat', tier: 1, price: 130 },
  cap_sky:   { slot: 'hat', name: tt('core/data.62'), rar: 1, def: 4, mp: 30, color: '#8cc8f0', icon: 'hat', tier: 2, price: 480 },
  cap_black: { slot: 'hat', name: tt('core/data.63'), rar: 2, def: 7, mp: 40, crit: 0.03, color: '#45454f', icon: 'hat', tier: 3, price: 1100 },
  cap_gold:  { slot: 'hat', name: tt('core/data.64'), rar: 3, def: 10, mp: 70, crit: 0.05, color: '#f0c040', icon: 'hat', tier: 4, price: 3200 },

  fleece:  { slot: 'armor', name: tt('core/data.65'), rar: 0, def: 2, hp: 10, color: '#f7f3ea', icon: 'jacket', start: 1, desc: tt('core/data.66') },
  hoodie:  { slot: 'armor', name: tt('core/data.67'),   rar: 0, def: 4, hp: 30, color: '#f2b8c6', icon: 'jacket', tier: 1, price: 150 },
  padding: { slot: 'armor', name: tt('core/data.68'),     rar: 1, def: 8, hp: 60, color: '#6a7bc0', icon: 'jacket', tier: 2, price: 560 },
  coat:    { slot: 'armor', name: tt('core/data.69'), rar: 2, def: 12, hp: 100, crit: 0.02, color: '#c49a6c', icon: 'jacket', tier: 3, price: 1200 },
  longpad: { slot: 'armor', name: tt('core/data.70'),        rar: 3, def: 18, hp: 160, color: '#3a3a46', icon: 'jacket', tier: 4, price: 3400 },

  sneakers: { slot: 'shoes', name: tt('core/data.71'),    rar: 0, spd: 0, color: '#ffffff', icon: 'shoes', start: 1 },
  slipon:   { slot: 'shoes', name: tt('core/data.72'),       rar: 0, spd: 0.05, def: 1, color: '#f0d080', icon: 'shoes', tier: 1, price: 140 },
  ugly:     { slot: 'shoes', name: tt('core/data.73'),  rar: 1, spd: 0.08, def: 3, color: '#c0c8d8', icon: 'shoes', tier: 2, price: 500 },
  running:  { slot: 'shoes', name: tt('core/data.74'),    rar: 2, spd: 0.14, def: 4, color: '#d8b070', icon: 'sandal', tier: 3, price: 1150 },
  skates:   { slot: 'shoes', name: tt('core/data.75'),     rar: 3, spd: 0.22, def: 5, color: '#f0c020', icon: 'boots', tier: 4, price: 3000 },

  silverbag: { slot: 'bag', name: tt('core/data.76'),   rar: 0, mp: 10, color: '#b9c0cc', icon: 'bag', start: 1, desc: tt('core/data.77') },
  ecobag:    { slot: 'bag', name: tt('core/data.78'),        rar: 0, hp: 20, mp: 15, color: '#e8dcc0', icon: 'bag', tier: 1, price: 130 },
  crossbag:  { slot: 'bag', name: tt('core/data.79'), rar: 1, mp: 30, atk: 2, color: '#d05a6a', icon: 'bag', tier: 2, price: 500 },
  backpack:  { slot: 'bag', name: tt('core/data.80'),   rar: 2, hp: 60, mp: 40, atk: 4, color: '#7ab0e0', icon: 'bag', tier: 3, price: 1100 },
  b_knit:    { slot: 'bcloth', bori: 1, name: tt('core/data.81'),   rar: 0, bdmg: 0.2,  color: '#e8606e', pat: 'knit', icon: 'bknit', tier: 1, price: 240,  desc: tt('core/data.82') },
  b_blanket: { slot: 'bcloth', bori: 1, name: tt('core/data.83'), rar: 1, bdmg: 0.32, color: '#8cc0e8', pat: 'knit', icon: 'bblanket', tier: 2, price: 620, desc: tt('core/data.84') },
  b_pad:     { slot: 'bcloth', bori: 1, name: tt('core/data.85'), rar: 2, bdmg: 0.45, color: '#f0b440', pat: 'pad',  icon: 'bpad',  tier: 3, price: 1300, desc: tt('core/data.86') },
  toy_melon: { slot: 'btoy',   bori: 1, name: tt('core/data.87'),         rar: 0, bdmg: 0.15, icon: 'tmelon', tier: 1, price: 180,  desc: tt('core/data.88') },
  toy_doll:  { slot: 'btoy',   bori: 1, name: tt('core/data.89'),         rar: 1, bdmg: 0.3,  icon: 'tdoll',  tier: 2, price: 650,  desc: tt('core/data.90') },
  toy_bone:  { slot: 'btoy',   bori: 1, name: tt('core/data.91'),       rar: 3, bdmg: 0.55, icon: 'tbone',  tier: 3, price: 1900, desc: tt('core/data.92') },
  clutch:    { slot: 'bag', name: tt('core/data.93'),   rar: 3, atk: 8, mp: 60, crit: 0.04, color: '#e0c060', icon: 'handbag', tier: 4, price: 3100 },

  // ---- 4단계 보리 (상점) ----
  b_jump:    { slot: 'bcloth', bori: 1, name: tt('core/data.94'),  rar: 3, bdmg: 0.55, color: '#4a7ad0', pat: 'pad',  icon: 'bpad',  tier: 4, price: 3300, desc: tt('core/data.95') },
  toy_duck:  { slot: 'btoy',   bori: 1, name: tt('core/data.96'),         rar: 3, bdmg: 0.65, icon: 'tdoll',  tier: 4, price: 3600, desc: tt('core/data.97') },

  // ---- 5단계 · 신화 (2회차부터 드롭 전용) ----
  goldpan:    { slot: 'weapon', name: tt('core/data.98'), rar: 4, atk: 44, crit: 0.06, icon: 'idcard', tier: 5, w: { reach: 120, arc: 0, mul: 1, rate: 2.4, kb: 40, style: 'throw' }, desc: tt('core/data.99') },
  cap_rainbow:{ slot: 'hat', name: tt('core/data.100'), rar: 4, def: 14, mp: 95, crit: 0.06, color: '#b45cff', icon: 'hat', tier: 5, desc: tt('core/data.101') },
  goosepad:   { slot: 'armor', name: tt('core/data.102'), rar: 4, def: 25, hp: 230, crit: 0.02, color: '#f0f0f6', icon: 'jacket', tier: 5, desc: tt('core/data.101') },
  airshoes:   { slot: 'shoes', name: tt('core/data.103'), rar: 4, def: 7, spd: 0.26, color: '#f4f4f8', icon: 'shoes', tier: 5, desc: tt('core/data.101') },
  limitbag:   { slot: 'bag', name: tt('core/data.104'), rar: 4, atk: 12, mp: 85, crit: 0.05, color: '#c0306a', icon: 'handbag', tier: 5, desc: tt('core/data.101') },
  b_xmas:     { slot: 'bcloth', bori: 1, name: tt('core/data.105'), rar: 4, bdmg: 0.68, color: '#3aa04a', pat: 'knit', icon: 'bknit', tier: 5, desc: tt('core/data.101') },
  toy_goldbone:{ slot: 'btoy', bori: 1, name: tt('core/data.106'), rar: 4, bdmg: 0.75, icon: 'tbone', tier: 5, desc: tt('core/data.101') },

  // ---- 6단계 · 초월 (3회차부터 드롭 전용) ----
  starstick:  { slot: 'weapon', name: tt('core/data.107'), rar: 5, atk: 86, crit: 0.08, icon: 'laptop', tier: 6, w: { reach: 26, arc: 160, mul: 1, rate: 2.2, kb: 170, style: 'swing' }, desc: tt('core/data.108') },
  cap_tiara:  { slot: 'hat', name: tt('core/data.109'), rar: 5, def: 19, mp: 130, crit: 0.08, color: '#ffd1e6', icon: 'hat', tier: 6, desc: tt('core/data.101') },
  aurorapad:  { slot: 'armor', name: tt('core/data.110'), rar: 5, def: 33, hp: 320, crit: 0.03, color: '#9fe8ff', icon: 'jacket', tier: 6, desc: tt('core/data.101') },
  wingshoes:  { slot: 'shoes', name: tt('core/data.111'), rar: 5, def: 9, spd: 0.3, color: '#5a6a4a', icon: 'fishshoe', tier: 6, desc: tt('core/data.112') },
  aurorabag:  { slot: 'bag', name: tt('core/data.113'), rar: 5, atk: 17, mp: 115, crit: 0.07, color: '#7ef08a', icon: 'bag', tier: 6, desc: tt('core/data.101') },
  b_royal:    { slot: 'bcloth', bori: 1, name: tt('core/data.114'), rar: 5, bdmg: 0.85, color: '#7a3ac0', pat: 'pad', icon: 'bpad', tier: 6, desc: tt('core/data.101') },
  toy_carp:   { slot: 'btoy', bori: 1, name: tt('core/data.115'), rar: 5, bdmg: 0.95, icon: 'tdoll', tier: 6, desc: tt('core/data.101') },


  // 새신부 희수 전용 웨딩 세트 (전직할 때 받음 · job: 거래·도감·드롭·분해 제외)
  bouquet:  { slot: 'weapon', name: tt('core/data.116'), rar: 4, atk: 46, crit: 0.06, icon: 'bouquet', tier: 6, bossOnly: 1, job: 'bride', w: { reach: 24, arc: 150, mul: 1, rate: 2.3, kb: 100, style: 'swing' }, desc: tt('core/data.117') },
  wdress:   { slot: 'armor', name: tt('core/data.118'), rar: 4, def: 28, hp: 280, color: '#fffaf4', icon: 'dress', tier: 6, bossOnly: 1, job: 'bride', desc: tt('core/data.119') },
  veil:     { slot: 'hat', name: tt('core/data.120'), rar: 4, def: 15, mp: 100, crit: 0.05, color: '#fffaf4', icon: 'veil', tier: 6, bossOnly: 1, job: 'bride', desc: tt('core/data.121') },
};
/** 장비 정의표. 개별 키('starstick#a1b2')로 찾아도 원래 장비 정의가 나옴 → 착용·강화·재련 코드는 키 그대로 씀 */
export const ITEMS = /** @type {Record<ItemId, ItemDef>} */ (new Proxy(ITEM_DEFS, {
  get: (t, k) => typeof k === 'string' && !(k in t) && k.includes('#') ? t[defOf(k)] : t[/** @type {any} */ (k)],
  has: (t, k) => typeof k === 'string' && (k in t || (k.includes('#') && defOf(k) in t)),
}));

export const SKILLS = {
  fist:    { who: 'h', name: tt('core/data.122'),   icon: 'fist',      type: 'passive', max: 5, req: 1, desc: l => tt('core/data.123', { v1: 10 * l, v2: 3 * l }) },
  smash:   { who: 'h', name: tt('core/data.124'), icon: 'hand',      type: 'active', btn: 's1', max: 5, req: 1, mp: 8, cd: () => 3.5, desc: l => tt('core/data.125', { v1: 220 + 40 * (l - 1) }) },
  nag:     { who: 'h', name: tt('core/data.126'), icon: 'bubble',    type: 'active', btn: 's2', max: 5, req: 3, mp: 15, cd: () => 6, desc: l => tt('core/data.127', { v1: 4 + l, v2: 90 + 15 * (l - 1) }) },
  shop:    { who: 'h', name: tt('core/data.128'),   icon: 'bag',       type: 'passive', max: 3, req: 3, desc: l => tt('core/data.129', { v1: 5 * l, v2: 15 * l }) },
  flash:   { who: 'h', name: tt('core/data.130'), icon: 'house',    type: 'active', btn: 's3', max: 5, req: 5, mp: 22, cd: () => 10, desc: l => tt('core/data.131', { v1: 150 + 30 * (l - 1), v2: (1.2 + 0.2 * l).toFixed(1) }) },
  mukbang: { who: 'h', name: tt('core/data.132'),   icon: 'gangjeong', type: 'passive', max: 3, req: 5, desc: l => tt('core/data.133', { v1: 20 * l, v2: 5 * l }) },
  husband: { who: 'h', name: tt('core/data.134'), icon: 'heart',   type: 'passive', max: 2, req: 40, desc: l => tt('core/data.225', { v1: [30, 60][l - 1], v2: l >= 2 ? tt('core/data.135') : '' }) },
  menhera: { who: 'h', name: tt('core/data.136'), icon: 'bheart',    type: 'ult', btn: 'ult', max: 4, req: 8, mp: 50, cd: l => [40, 35, 30, 25][Math.max(0, l - 1)], desc: l => tt('core/data.137', { v1: (10 + 5 * l) * 100, v2: [40, 35, 30, 25][Math.max(0, l - 1)] }) },
  bite:    { who: 'b', name: tt('core/data.138'),    icon: 'paw',       type: 'passive', max: 5, req: 3, desc: l => tt('core/data.139', { v1: 40 + 15 * l }) },
  bark:    { who: 'b', name: tt('core/data.140'),       icon: 'sound',     type: 'auto', max: 5, req: 4, desc: l => tt('core/data.141', { v1: (9 - 0.6 * (l - 1)).toFixed(1), v2: 60 + 20 * l }) },
  feed:    { who: 'b', name: tt('core/data.142'),     icon: 'gangjeong', type: 'auto', max: 3, req: 4, desc: l => tt('core/data.143', { v1: [40, 50, 60][l - 1], v2: [30, 40, 50][l - 1] }) },
  wag:     { who: 'b', name: tt('core/data.144'),   icon: 'heart',     type: 'passive', max: 3, req: 6, desc: l => tt('core/data.145', { v1: (0.6 * l).toFixed(1) }) },
  zoomies: { who: 'b', name: tt('core/data.146'), icon: 'bolt',      type: 'auto', max: 3, req: 9, desc: l => tt('core/data.147', { v1: 120 + 40 * l }) }
};
export const SKILL_TYPE = { passive: tt('core/data.148'), active: tt('core/data.149'), ult: tt('core/data.150'), auto: tt('core/data.151') };

export const MONS = /** @type {Record<string, any>} */ ({}); // 장 파일이 regChapter 로 채움

export const ZONES = /** @type {any[]} */ ([]); // 장 파일(src/chapters/chN.js)이 regChapter 로 채움

export const NAG_WORDS = [tt('core/data.152'), tt('core/data.153'), tt('core/data.154'), tt('core/data.155'), tt('core/data.156'), tt('core/data.157'), tt('core/data.158'), tt('core/data.159'), tt('core/data.160'), tt('core/data.161'), tt('core/data.162'), tt('core/data.163'), tt('core/data.164'), tt('core/data.165')];
export const MENHERA_LINES = [tt('core/data.166'), tt('core/data.167'), tt('core/data.168'), tt('core/data.169'), tt('core/data.170'), tt('core/data.171'), tt('core/data.172'), tt('core/data.173'), tt('core/data.174'), tt('core/data.175'), tt('core/data.176'), tt('core/data.177'), tt('core/data.178'), tt('core/data.179'), tt('core/data.180'), tt('core/data.181')];
export const PHONE_WORDS = [tt('core/data.182'), '♥', tt('core/data.183'), 'DM', '♪', tt('core/data.184'), tt('core/data.185'), tt('core/data.186')];

export function xpNeed(lv) { return Math.round(20 * Math.pow(lv, XP_EXP)); }
const XP_EXP = 2.5;

// ===== 각성 (Lv50 이후): 경험치가 계속 쌓여 각성 포인트 → 능력치·스킬 강화 =====
export const AWK = {
  atk:   { name: tt('core/data.187'),   icon: 'fist',   per: 3,     fmt: v => `+${v}` },
  def:   { name: tt('core/data.188'),   icon: 'house',  per: 2,     fmt: v => `+${v}` },
  hp:    { name: tt('core/data.189'),  icon: 'heart',  per: 25,    fmt: v => `+${v}` },
  mp:    { name: tt('core/data.190'),  icon: 'sound',  per: 8,     fmt: v => `+${v}` },
  crit:  { name: tt('core/data.191'),   icon: 'bolt',   per: 0.003, max: 50, fmt: v => `+${(v * 100).toFixed(1).replace('.0', '')}%` },
  skill: { name: tt('core/data.192'), icon: 'bubble', per: 0.02,  fmt: v => `+${Math.round(v * 100)}%`, desc: tt('core/data.193') },
  bori:  { name: tt('core/data.194'), icon: 'paw',   per: 0.02,  bori: 1, fmt: v => `+${Math.round(v * 100)}%`, desc: tt('core/data.195') }
};
export const awkNeed = aw => Math.round(AWK_BASE * (1 + AWK_STEP * aw));
const AWK_BASE = 60000, AWK_STEP = 0.25;

// ===== 장비 도감: 처음 얻은 장비 기록. 1칸당 최대 HP +5, 세트(등급별·보리 용품) 완성 보너스 =====
export const BOOK_PER_HP = 5;
/** 착용 세트 (11/25): 모두 끼고 있어야 효과. 4장 웨딩 준비 장비 7종 = 희수 5부위 + 보리 2부위 */
export const EQ_SETS = /** @type {any[]} */ ([]); // 장 파일이 regChapter 로 채움 (4장 웨딩 준비 세트)
export const BOOK_SETS = [
  { k: 'r0', name: tt('core/data.32'), rar: 0, txt: tt('core/data.196') },
  { k: 'r1', name: tt('core/data.33'), rar: 1, txt: tt('core/data.197') },
  { k: 'r2', name: tt('core/data.34'), rar: 2, txt: tt('core/data.198') },
  { k: 'r3', name: tt('core/data.35'), rar: 3, txt: tt('core/data.199') },
  { k: 'r4', name: tt('core/data.36'), rar: 4, txt: tt('core/data.200') },
  { k: 'r5', name: tt('core/data.37'), rar: 5, txt: tt('core/data.201') },
  { k: 'bori', name: tt('core/data.202'), rar: -1, bori: true, txt: tt('core/data.203') },
];
/** 세트에 들어가는 장비 id (시작 장비 제외) */
export const bookIds = set => Object.keys(ITEMS).filter(id => { const it = ITEMS[id]; if (it.start || it.job) return false; if (set.ch) return !!it.bossOnly && (it.ch || 2) === set.ch; if (it.bossOnly) return false; return set.bori ? !!it.bori : !it.bori && it.rar === set.rar; });
export const BOOK_ALL = Object.keys(ITEMS).filter(id => !ITEMS[id].start && !ITEMS[id].job);

// ===== 희수 꾸미기 (능력치 없음, 겉모습만) =====
/** 겉모습을 바꿀 수 있는 부위 (도감에 등록한 장비의 모습으로) */
export const LOOK_SLOTS = /** @type {HeroSlot[]} */ (['hat', 'armor', 'shoes', 'bag']);
/** 헤어 색. need 가 있으면 조건 달성 시 열림 */
export const HAIRS = [
  { k: 'base', name: tt('core/data.204'), H: '#2a1c1c', h: '#4a3430' },
  { k: 'choco', name: tt('core/data.205'), H: '#5a3422', h: '#80513a' },
  { k: 'ash', name: tt('core/data.206'), H: '#5f5450', h: '#857873' },
  { k: 'pink', name: tt('core/data.207'), H: '#c8578a', h: '#ee94bb', need: 'book10', cond: tt('core/data.208') },
  { k: 'mint', name: tt('core/data.209'), H: '#2f8f78', h: '#6fd3b6', need: 'loop5', cond: tt('core/data.210') },
  { k: 'blonde', name: tt('core/data.211'), H: '#b8862a', h: '#e9c35a', need: 'book25', cond: tt('core/data.212') },
  { k: 'red', name: tt('core/data.213'), H: '#a11f2a', h: '#dd4651', need: 'enh25', cond: tt('core/data.214') },
  { k: 'silver', name: tt('core/data.215'), H: '#9da2b0', h: '#dde0e8', need: 'aw50', cond: tt('core/data.216') },
  { k: 'wine', name: tt('core/data.217'), H: '#5a1430', h: '#a8325e', need: 'lp20', cond: tt('core/data.218') },
  { k: 'aurora', name: tt('core/data.219'), H: '#2a7a8a', h: '#b49cf0', need: 'lp50', cond: tt('core/data.220') },
  { k: 'flame', name: tt('core/data.221'), H: '#b8320e', h: '#ffb020', need: 'tw30', cond: tt('core/data.222') },
  { k: 'lavender', name: tt('core/data.223'), H: '#6a4cb8', h: '#b49cf0', need: 'pack', cond: tt('core/data.224'), excl: 1 }
];
