// 희수와 보리 빌드: src/*.js|ts 를 순서대로 이어 붙인 "전역 스크립트" + CSS + 서브셋 폰트를 HTML 한 파일에 인라인.
// (build.py 를 대체. 파일 간 전역 이름 공유 구조를 그대로 유지하려고 Rollup 모듈 번들링을 쓰지 않는다)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { transformWithEsbuild } from 'vite';
import subsetFont from 'subset-font';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'src');

/** 이어 붙이는 순서 (앞 파일의 전역을 뒤 파일이 씀). 확장자 없이, .ts 가 있으면 .ts 우선 */
export const ORDER = ['sprites', 'sprites2', 'engine', 'data', 'world', 'chapter', 'refine', 'game', 'render', 'ui', 'pvp', 'inf', 'auto', 'rank', 'cloud', 'account', 'trade', 'auction', 'daily', 'guide', 'share', 'raid', 'buddy', 'achv', 'idle', 'pack', 'goal', 'tower', 'plaza', 'story', 'story2', 'story3', 'ep2core', 'ep2stages', 'ep2easy', 'ep2story', 'main'];

export const BASE_URL = 'https://byeongjaeyu.github.io/heesoo_bori/';
export const EDITIONS = {
  main: {
    forceEasy: false, out: 'index.html', title: '희수와 보리의 대모험',
    desc: '희수와 강아지 보리의 도트 모험 게임! 1탄 에버랜드 대탈출, 2탄 보리 주세요, 그리고 내가 키운 희수로 겨루는 PvP 아레나.',
    url: BASE_URL, img: BASE_URL + 'og.png'
  },
  onetouch: {
    forceEasy: true, out: 'onetouch/index.html', title: '보리 주세요 · 원터치 에디션',
    desc: '탭 한 번이면 끝! 강아지 보리가 사라진 뼈다구를 찾아 떠나는 원터치 미니게임 모험.',
    url: BASE_URL + 'onetouch/', img: BASE_URL + 'og_onetouch.png'
  }
};

export function sourceFiles() {
  return ORDER.map(n => { const ts = path.join(SRC, n + '.ts'); return fs.existsSync(ts) ? ts : path.join(SRC, n + '.js'); });
}

/** 파일들을 이어 붙인 JS (TS 는 타입만 제거) */
export async function buildJs({ exclude = [] } = {}) {
  const parts = [];
  for (const f of sourceFiles().filter(f => !exclude.includes(path.basename(f).replace(/\.(js|ts)$/, '')))) {
    let code = fs.readFileSync(f, 'utf8');
    if (f.endsWith('.ts')) code = (await transformWithEsbuild(code, f, { loader: 'ts', target: 'es2022', format: undefined, sourcemap: false })).code.replace(/\n$/, '');
    parts.push(code);
  }
  return "'use strict';\n" + parts.join('\n');
}

const EXTRA_CHARS = '♥♪★→↑▼▶✕×·…!?ㅋㅎㅠ%';
const CACHE = path.join(ROOT, 'node_modules', '.cache', 'hb-font');
async function subset(file, text) {
  const key = crypto.createHash('sha1').update(file + '\0' + text).digest('hex').slice(0, 16);
  const cp = path.join(CACHE, path.basename(file) + '.' + key + '.woff2');
  if (fs.existsSync(cp)) return fs.readFileSync(cp);
  const out = await subsetFont(fs.readFileSync(path.join(ROOT, 'fonts', file)), text, { targetFormat: 'woff2' });
  fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(cp, out); return out;
}
/** 게임에 실제로 쓰인 글자만 남긴 Galmuri 폰트 @font-face */
export async function buildFontCss(text) {
  const set = new Set(text + EXTRA_CHARS); for (let c = 32; c < 127; c++) set.add(String.fromCharCode(c));
  const chars = [...set].filter(c => c.codePointAt(0) >= 32).sort().join('');
  const [reg, bold] = await Promise.all([subset('Galmuri11.ttf', chars), subset('Galmuri11-Bold.ttf', chars)]);
  const face = (b, w) => `@font-face{font-family:'HB';src:url(data:font/woff2;base64,${b.toString('base64')}) format('woff2');font-weight:${w};font-display:block}`;
  return { css: face(reg, 400) + '\n' + face(bold, 700), chars: chars.length, sizes: [reg.length, bold.length] };
}

function ogTags(e) {
  return `<meta name="description" content="${e.desc}">\n`
    + `<meta property="og:type" content="website">\n<meta property="og:site_name" content="희수와 보리의 대모험">\n<meta property="og:locale" content="ko_KR">\n`
    + `<meta property="og:title" content="${e.title}">\n<meta property="og:description" content="${e.desc}">\n<meta property="og:url" content="${e.url}">\n`
    + `<meta property="og:image" content="${e.img}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="${e.title}">\n`
    + `<meta name="twitter:card" content="summary_large_image">\n<link rel="canonical" href="${e.url}">\n`;
}

/** 에디션 하나의 완성 HTML */
export async function renderEdition(name) {
  const e = EDITIONS[name]; if (!e) throw new Error('unknown edition ' + name);
  const js = await buildJs();
  const css = fs.readFileSync(path.join(SRC, 'style.css'), 'utf8');
  let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
  const font = await buildFontCss(js + css + html);
  const jsE = js.replace("'use strict';\n", `'use strict';\nconst FORCE_EASY = ${e.forceEasy};\n`);
  html = html.replace('/*@@FONT@@*/', () => font.css).replace('/*@@CSS@@*/', () => css).replace('/*@@JS@@*/', () => jsE);
  html = html.replace('<title>희수와 보리의 에버랜드 대탈출</title>', `<title>${e.title}</title>`);
  html = html.replace('<meta name="theme-color"', ogTags(e) + '<meta name="theme-color"');
  return { html, font };
}

/** Vite 플러그인: web/*.html 요청/빌드 시 완성 HTML 로 바꿔치기 + src 바뀌면 새로고침 */
export function hbPlugin() {
  const editionOf = p => (p.replace(/\\/g, '/').includes('onetouch') ? 'onetouch' : 'main');
  const KEEP = '<!--@@HB:%s@@-->';
  let pending = {};
  return {
    name: 'heesoo-bori',
    // pre: Vite 가 HTML 을 건드리기 전에 자리표시자만 남긴 껍데기를 넘기고
    transformIndexHtml: {
      order: 'pre',
      async handler(_html, ctx) {
        const ed = editionOf(ctx.filename || ctx.path); const { html } = await renderEdition(ed);
        const id = crypto.randomUUID(); pending[id] = html;
        return `<!DOCTYPE html><html><head><title>hb</title></head><body>${KEEP.replace('%s', id)}</body></html>`;
      }
    },
    // post: Vite 가 파일을 다 쓴 뒤 통째로 완성 HTML 로 교체 (인라인 CSS/JS 를 Vite 가 변형하지 않게)
    writeBundle(opts, bundle) {
      for (const f of Object.values(bundle)) {
        if (f.type !== 'asset' || !f.fileName.endsWith('.html')) continue;
        const m = String(f.source).match(/<!--@@HB:([\w-]+)@@-->/); if (!m || !pending[m[1]]) throw new Error('hb: 자리표시자 없음 ' + f.fileName);
        fs.writeFileSync(path.join(opts.dir, f.fileName), pending[m[1]]);
      }
      pending = {};
    },
    configureServer(server) {
      server.watcher.add(path.join(SRC, '**'));
      server.watcher.on('change', f => { if (f.startsWith(SRC)) server.ws.send({ type: 'full-reload' }); });
      // dev: 껍데기 대신 완성 HTML 바로 응답
      server.middlewares.use(async (req, res, next) => {
        const u = (req.url || '/').split('?')[0];
        if (u !== '/' && u !== '/index.html' && u !== '/onetouch/' && u !== '/onetouch/index.html') return next();
        try { const { html } = await renderEdition(editionOf(u)); res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html.replace('</body>', '<script type="module" src="/@vite/client"></script></body>')); }
        catch (err) { next(err); }
      });
    }
  };
}
