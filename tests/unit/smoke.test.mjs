import { test, expect } from 'vitest';
import { loadGame } from './load-game.mjs';
test('게임 스크립트가 Node(jsdom)에서 로드된다', async () => {
  const g = loadGame();
  expect(typeof g.newPD).toBe('function');
  expect(Object.keys(g.ITEMS).length).toBeGreaterThan(20);
});
