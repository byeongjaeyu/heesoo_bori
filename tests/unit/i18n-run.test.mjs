// 게임 안 tt() 동작
import { describe, test, expect } from 'vitest';
import { g } from './helpers.mjs';

describe('tt()', () => {
  test('ko 글 그대로 / {이름} 채우기 / 없는 키는 키', () => {
    expect(g.LANG).toBe('ko');
    expect(g.tt('net/raid.1')).toBe('피해량 1위');
    expect(g.tt('net/raid.5', { d: 2, h: 3 })).toBe('2일 3시간');
    expect(g.tt('없는.1')).toBe('없는.1');
  });
  test('index.html 문구가 채워짐', () => {
    expect(document.querySelector('#menuBtn').textContent.startsWith('메뉴')).toBe(true);
    expect(document.querySelector('#spBadge')).not.toBeNull();
  });
});
