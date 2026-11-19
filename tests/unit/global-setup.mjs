// jsdom 안에서는 esbuild(vite)가 못 돌아서, 테스트 시작 전에 Node 환경에서 게임 JS 를 미리 만들어 둔다
import fs from 'node:fs';
import path from 'node:path';
import { buildJs, ROOT } from '../../build/hb-build.mjs';
export const GAME_JS = path.join(ROOT, 'node_modules', '.cache', 'hb-test', 'game.js');
export default async function () {
  fs.mkdirSync(path.dirname(GAME_JS), { recursive: true });
  fs.writeFileSync(GAME_JS, await buildJs({ exclude: ['main'] }));
}
