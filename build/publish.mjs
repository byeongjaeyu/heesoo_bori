// dist/ 결과물을 GitHub Pages(main 브랜치 루트) 배포 위치로 복사
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, EDITIONS } from './hb-build.mjs';
for (const e of Object.values(EDITIONS)) {
  const from = path.join(ROOT, 'dist', e.out), to = path.join(ROOT, e.out);
  fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to);
  console.log('published', e.out, (fs.statSync(to).size / 1024).toFixed(0) + 'KB');
}
