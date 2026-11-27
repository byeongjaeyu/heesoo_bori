// ===================== 게임 상태 G (지금 화면·필드·세이브를 한곳에) =====================
// ===================== GAME CORE =====================

export const G = {
  state: 'title', zone: 0, world: null, time: 0, pd: /** @type {SaveData|null} */ (null), raid: /** @type {any} */ (null), tower: /** @type {any} */ (null), plaza: /** @type {any} */ (null), flashT: 0, buddy: /** @type {any} */ (null), st: null, P: null, bori: null,
  enemies: [], projs: [], fx: [], drops: [], parts: [], texts: [], bubbles: [],
  cam: { x: 0, y: 0 }, shake: 0, hitstop: 0, flash: 0,
  zoneKills: 0, bossSpawned: false, bossDefeated: false, boss: null, exitOpen: false, spawnT: 1, eid: 0,
  pendingEvent: null, ult: null, evt: null, saveT: 0
};
