// @vitest-environment node
// 화면 문구 모으기 (build/i18n.mjs · src/sys/i18n.js · texts/<언어>/*.json)
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanAll, ttCalls, loadTexts, groupOf } from '../../build/i18n.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const T = loadTexts(), KO = T.ko;
const names = s => [...new Set([...s.matchAll(/\{([A-Za-z_]\w*)\}/g)].map(m => m[1]))].sort();
const HTML = fs.readFileSync(path.join(ROOT, 'src/index.html'), 'utf8');
const htmlKeys = [...HTML.matchAll(/data-tt="([^"]+)"/g)].map(m => m[1]).concat([...HTML.matchAll(/data-tta="([^"]+)"/g)].flatMap(m => m[1].split(';').map(p => p.split('=')[1])));

describe('화면 문구 (texts/ko)', () => {
  it('코드에 화면용 한글이 남아 있지 않음 — 새로 쓴 문구는 `npm run texts` 로 옮길 것 (로직용 한글은 줄 끝에 // i18n-keep)', () => {
    expect(scanAll().todo).toEqual([]);
  });
  it('tt(키) 는 전부 ko 에 있고, 넘기는 이름 = 글의 {이름}', () => {
    const bad = [];
    for (const c of ttCalls()) {
      if (KO[c.key] == null) { bad.push(c.file + ' 없는 키 ' + c.key); continue; }
      if (c.names && JSON.stringify([...c.names].sort()) !== JSON.stringify(names(KO[c.key]))) bad.push(`${c.file} ${c.key} 이름 ${c.names} ≠ ${names(KO[c.key])}`);
    }
    for (const k of htmlKeys) if (KO[k] == null) bad.push('index.html 없는 키 ' + k);
    expect(bad).toEqual([]);
  });
  it('안 쓰는 문구 없음 (코드에서 지웠으면 json 에서도 지울 것)', () => {
    const used = new Set([...ttCalls().map(c => c.key), ...htmlKeys]);
    expect(Object.keys(KO).filter(k => !used.has(k))).toEqual([]);
  });
  it('키는 자기 묶음 파일에 있음', () => {
    const dir = path.join(ROOT, 'texts/ko'), bad = [];
    for (const f of fs.readdirSync(dir)) for (const k of Object.keys(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))) if (groupOf(k) + '.json' !== f) bad.push(f + ': ' + k);
    expect(bad).toEqual([]);
  });
  it('다른 언어 파일은 ko 에 있는 키만, {이름} 도 같게', () => {
    const bad = [];
    for (const [lang, m] of Object.entries(T)) if (lang !== 'ko') for (const [k, v] of Object.entries(m)) {
      if (KO[k] == null) bad.push(`${lang} ${k}: ko 에 없음`);
      else if (JSON.stringify(names(v)) !== JSON.stringify(names(KO[k]))) bad.push(`${lang} ${k}: {이름} 다름`);
    }
    expect(bad).toEqual([]);
  });
});
