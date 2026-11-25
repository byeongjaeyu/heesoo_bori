import { test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { g } from './helpers.mjs';

// 서버 장비표(hb_item_defs)는 게임 장비표(ITEMS)와 같아야 함 — 장비를 추가·변경하면
// `UPDATE_ITEM_DEFS=1 npx vitest run tests/unit/itemdefs.test.mjs` 로 SQL 을 다시 만들고 운영 DB 에 적용할 것.
const FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../supabase/item_defs.sql');
const TRADE_MIN_RAR = 3; // 전설 이상 거래 가능 (정책은 나중에 바꿀 수 있음) — src/trade.js 와 같아야 함
function gen() {
  const rows = Object.keys(g.ITEMS).sort().map(id => { const it = g.ITEMS[id];
    return `  ('${id}', ${it.rar || 0}, '${it.slot}', ${!!it.bori}, ${!it.start && !it.job && (it.rar || 0) >= TRADE_MIN_RAR})`; });
  return `-- 자동 생성 (tests/unit/itemdefs.test.mjs) — 손으로 고치지 말 것. 장비 ${rows.length}종\n` +
    `insert into public.hb_item_defs (id, rar, slot, bori, tradable) values\n${rows.join(',\n')}\n` +
    `on conflict (id) do update set rar = excluded.rar, slot = excluded.slot, bori = excluded.bori, tradable = excluded.tradable;\n` +
    `delete from public.hb_item_defs where id not in (${Object.keys(g.ITEMS).sort().map(id => `'${id}'`).join(', ')});\n`;
}
test('거래 가능 등급 기준이 게임(trade.js)과 서버 장비표 생성기에서 같음', () => {
  expect(g.TRADE_MIN_RAR).toBe(TRADE_MIN_RAR);
  for (const id of Object.keys(g.ITEMS)) { const it = g.ITEMS[id]; expect(g.tradableKey(id)).toBe(!it.start && !it.job && (it.rar || 0) >= TRADE_MIN_RAR); }
  expect(g.tradableKey('starstick#ab12')).toBe(true);
});
test('넘긴 장비 키는 다시 안 씀 (서버 묘비와 충돌 방지)', () => {
  const pd = g.newPD(); pd.tkeys = ['starstick', 'starstick#zz99'];
  const k = g.newItemKey(pd, 'starstick'); expect(k).not.toBe('starstick'); expect(pd.tkeys.includes(k)).toBe(false);
});
test('서버 장비표 SQL이 게임 장비표와 같음', () => {
  const want = gen();
  if (process.env.UPDATE_ITEM_DEFS) fs.writeFileSync(FILE, want);
  expect(fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '').toBe(want);
});
