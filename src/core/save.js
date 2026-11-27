// ===================== 세이브 (불러오기·저장·새 세이브·꾸미기·헤어) =====================
// ---------- persistent data ----------


import { emit } from './events.js';
import { ITEMS, SLOTS } from './data.js';
import { G } from './state.js';

export const SAVEKEY = 'heesu_bori_save_v1';
/** @returns {SaveData} */
/** 세이브 고유 번호 (기기 옮기기 후 옛 기기에서 같은 희수로 중복 등록 막는 용도) */
const newSid = () => { try { if (crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) { } return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12); };
export function newPD() {
  return {
    sid: newSid(),
    guide: 0,
    lv: 1, xp: 0, gold: 30, sp: 1, skills: {}, idleT: Date.now(),
    inv: { fist: 1, cap_grey: 1, fleece: 1, sneakers: 1, silverbag: 1 },
    eq: { weapon: 'fist', hat: 'cap_grey', armor: 'fleece', shoes: 'sneakers', bag: 'silverbag' },
    foods: { persimmon: 3, popcorn: 3 }, enh: {}, ilv: {}, iexp: {}, stones: 0, zone: 0, boriJoined: false, cleared: 0, beq: { bcloth: null, btoy: null },
    stats: { kills: 0, ults: 0, deaths: 0, time: 0, eaten: 0 }
  };
}
/** 서버 세이브로 되돌리는 중엔 저장 막음 (cloudRevert) */
let SAVE_LOCK = false;
export function setSaveLock(v) { SAVE_LOCK = v; }
export function saveGame() { if (!G.pd || SAVE_LOCK) return; if (G.state !== 'title' && G.state !== 'lobbyMenu') G.pd.idleT = Date.now(); G.pd.svT = Date.now(); try { localStorage.setItem(SAVEKEY, JSON.stringify(G.pd)); } catch (e) { } emit('saved'); }
/** @returns {SaveData|null} */
export function loadGame() {
  try {
    const s = localStorage.getItem(SAVEKEY); if (!s) return null;
    const d = JSON.parse(s); const pd = newPD();
    for (const k in d) pd[k] = d[k];
    pd.stats = Object.assign(newPD().stats, d.stats || {});
    pd.beq = Object.assign({ bcloth: null, btoy: null }, d.beq || {}); pd.enh = d.enh || {}; pd.ilv = d.ilv || {}; pd.iexp = d.iexp || {}; pd.stones = d.stones || 0;
    for (const sl of SLOTS) if (!ITEMS[pd.eq[sl]]) pd.eq[sl] = newPD().eq[sl];
    // 가이드가 생기기 전 세이브: 초반을 지났으면 건너뜀
    if (d.guide === undefined) pd.guide = (d.lv >= 5 || d.cleared || d.zone > 0) ? 99 : 0;
    // 예전 세이브엔 sid 가 없음: 한 번 만들어서 바로 저장 (불러올 때마다 바뀌면 안 됨)
    if (!d.idleT) pd.idleT = Date.now();
    if (!d.sid || !d.idleT) { try { localStorage.setItem(SAVEKEY, JSON.stringify(pd)); } catch (e) { } }
    return pd;
  } catch (e) { return null; }
}
export function hasSave() { try { return !!localStorage.getItem(SAVEKEY); } catch (e) { return false; } }
export const sk = id => (G.pd && G.pd.skills[id]) || 0;

// 장비 레벨: 착용 장비와 같은 부위·같은 등급 장비를 ILV_NEED개 주우면 Lv+1, 레벨당 기본 스탯 +5%
export const ILV_NEED = 5, ILV_BONUS = 0.05;
