// ===================== 4장 컷신: 결혼 대작전 =====================
// 낚시터 프러포즈(빡침) → 웨딩홀 투어 → 드레스 투어(좋아무새) → 웨딩 촬영(감량 실패) → 사진 셀렉(모바일게임 → 셀렉실에서 게임 마왕과 싸움) → 엔딩 본식
// 오빠는 결혼 준비 내내 「응 좋아, 너무 좋아」만 말함 → 희수 멘헤라 포인트
// 이 파일 = 4장 전부 (컷신·스테이지·몬스터·보스 패턴·웨딩 준비 장비·착용 세트·업적), 맨 아래 regChapter 로 등록




import { ctx } from '../sys/dom.js';
import { choice, clamp, lerp, rand, shadeHex } from '../core/util.js';
import { drawSpr, mkCanvas, pCirc, pRect, sprFn } from '../draw/sprite.js';
import { sfx } from '../sys/audio.js';
import { husPaint } from '../draw/hee2.js';
import { regChapter } from '../core/chapter.js';
import { OK, WORLD_H, WORLD_W } from '../draw/world.js';
import { G } from '../core/state.js';
import { bubble, burst, hurtPlayer, moveToward } from '../play/player.js';
import { aimDash, dashStep, shootAt, spawnEnemy } from '../play/enemies.js';
import { CUTK, fr, ispr, pc, pxLine } from '../draw/render.js';
import { A_, clearA } from '../story/story.js';

/** 웨딩드레스·면사포 차림 희수 (컷신) */
export const WED_PAL = { hat: 'veil', cloth: 'gown', shoe: 'heel', bag: 'none', C: '#fffaf4', c: '#e8dcd0', W: '#fffaf4', w: '#e8dcd0', O: '#fffaf4', o: '#e0d4c8' };
/** 턱시도 오빠 (모자 대신 머리, 검은 재킷·흰 셔츠·검은 바지) */
export const husTuxSpr = () => sprFn('husTux2', () => husPaint({ tux: true }), 2);

function wedWall(SW, gy, top, bot, col) { for (let y = 0; y < gy - 4; y += 4) { const k = y / (gy - 4); fr(0, y, SW, 4, k < 0.5 ? top : bot); } fr(0, gy - 6, SW, 2, col); }
function drawWedCut(SW, SH, mid, gy, T, mode) {
  if (mode === 'whall' || mode === 'wwed') {
    // 웨딩홀: 아치 창문·샹들리에·레드 카펫
    wedWall(SW, gy, '#f6ecdc', '#efe2cc', '#c8a878');
    for (let x = mid - 150; x < mid + 160; x += 60) { fr(x - 12, gy - 70, 24, 46, '#c8a878'); fr(x - 10, gy - 68, 20, 44, '#cfe6ff'); pc(x, gy - 68, 10, '#cfe6ff'); fr(x - 1, gy - 78, 2, 52, '#c8a878'); fr(x - 10, gy - 50, 20, 2, '#c8a878'); }
    for (const cx of [mid - 70, mid + 70]) { pxLine(cx, 0, cx, 14, '#c8a878'); for (let i = 0; i < 7; i++) { const x = cx - 12 + i * 4; fr(x, 14 + (i % 2) * 2, 2, 4, '#ffd84a'); fr(x, 18 + (i % 2) * 2, 2, 2, '#fff6b0'); } }
    fr(0, gy - 4, SW, SH - gy + 4, mode === 'wwed' ? '#fff4ea' : '#efe4d2'); for (let y = gy; y < SH; y += 10) for (let x = (y / 10) % 2 ? 0 : 10; x < SW; x += 20) fr(x, y, 10, 10, mode === 'wwed' ? '#f4e6d8' : '#e2d4bc');
    fr(mid - 26, gy - 4, 52, SH - gy + 4, '#b8283a'); fr(mid - 26, gy - 4, 2, SH - gy + 4, '#ffd84a'); fr(mid + 24, gy - 4, 2, SH - gy + 4, '#ffd84a');
    if (mode === 'wwed') {
      // 꽃 아치 + 하객석
      for (let a = 0; a <= 30; a++) { const t = Math.PI * a / 30, x = mid - Math.cos(t) * 46, y = gy - 34 - Math.sin(t) * 34; pc(x, y, 4, a % 3 ? '#ffd1e6' : '#ffffff'); if (a % 4 === 0) fr(x - 1, y - 1, 2, 2, '#ff7ab8'); }
      fr(mid - 48, gy - 36, 4, 34, '#ffffff'); fr(mid + 44, gy - 36, 4, 34, '#ffffff');
      for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) for (const side of [-1, 1]) { const x = mid + side * (46 + i * 16), y = gy + 14 + r * 16; fr(x - 5, y - 10, 10, 12, '#2b1b24'); fr(x - 4, y - 9, 8, 10, '#ffffff'); const hx = x, hy = y - 14; fr(hx - 3, hy - 4, 6, 6, ['#2a1c1c', '#5a3422', '#3a2a26'][(i + r) % 3]); fr(hx - 2, hy - 1, 4, 3, '#f0bb9c'); }
      for (let i = 0; i < 40; i++) { const x = ((i * 47.3 + T * 14) % (SW + 20)) - 10, y = ((i * 31.7 + T * 26) % (gy + 20)) - 10; fr(x, y, 2, 1, i % 3 ? '#ffd1e6' : '#ffffff'); }
    } else {
      for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) for (const side of [-1, 1]) { const x = mid + side * (52 + i * 18), y = gy + 16 + r * 18; fr(x - 5, y - 12, 10, 14, '#2b1b24'); fr(x - 4, y - 11, 8, 12, '#ffffff'); fr(x - 2, y - 8, 4, 3, '#ff9fcf'); }
    }
  } else if (mode === 'wdress') {
    // 드레스 숍: 분홍 벽 · 피팅룸 커튼 · 마네킹 · 큰 거울
    wedWall(SW, gy, '#ffe4ee', '#f6d6e2', '#e8a8c4');
    for (let x = 0; x < SW; x += 12) fr(x, 0, 1, gy - 6, '#f6c8dc');
    const cw = Math.round(Math.min(80, SW * 0.4)); fr(mid - cw / 2, gy - 82, cw, 6, '#c8a070'); for (let x = mid - cw / 2 + 2; x < mid + cw / 2 - 2; x += 6) { const sway = Math.round(Math.sin(T * 2 + x) * 1); fr(x + sway, gy - 76, 5, 66, (x / 6) % 2 ? '#e8608a' : '#ff8fb0'); }
    for (const [x, c] of /** @type {[number, string][]} */ ([[Math.round(SW * 0.07), '#ffffff'], [Math.round(SW * 0.2), '#fffaf4'], [Math.round(SW * 0.8), '#ffd8e8'], [Math.round(SW * 0.93), '#ffffff']])) { fr(x - 1, gy - 52, 2, 4, '#2b1b24'); fr(x - 3, gy - 48, 6, 4, '#e3c9a0'); for (let y = 0; y < 30; y++) { const hw = Math.round(2 + y * 0.45); fr(x - hw, gy - 44 + y, hw * 2, 1, c); } fr(x - 1, gy - 14, 2, 8, '#2b1b24'); }
    fr(0, gy - 4, SW, SH - gy + 4, '#f6d6e2'); for (let y = gy + 4; y < SH; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < SW; x += 12) fr(x, y, 3, 3, '#ffeaf2');
  } else if (mode === 'wstudio') {
    // 스튜디오: 흰 배경지 · 소프트박스 · 삼각대 카메라
    for (let y = 0; y < SH; y++) { const k = clamp((y - gy + 30) / 60, 0, 1); fr(0, y, SW, 1, k < 0.5 ? '#f4f4f8' : '#e6e6ee'); }
    fr(0, 0, SW, 3, '#9aa0aa');
    for (const x of [Math.round(SW * 0.1), Math.round(SW * 0.9)]) { fr(x - 14, gy - 86, 28, 22, '#2b1b24'); fr(x - 13, gy - 85, 26, 20, '#ffffff'); fr(x - 1, gy - 64, 2, 56, '#2b1b24'); fr(x - 9, gy - 8, 18, 2, '#2b1b24');
      if (Math.floor(T * 2) % 5 === 0) { ctx.globalCompositeOperation = 'lighter'; pc(x, gy - 75, 30, 'rgba(255,255,240,0.35)'); ctx.globalCompositeOperation = 'source-over'; } }
    const cx = Math.round(SW * 0.72); fr(cx - 10, gy - 46, 20, 14, '#2b1b24'); fr(cx - 9, gy - 45, 18, 12, '#30323d'); pc(cx - 4, gy - 39, 4, '#9fe8ff'); pxLine(cx, gy - 32, cx - 10, gy, '#2b1b24'); pxLine(cx, gy - 32, cx + 10, gy, '#2b1b24'); pxLine(cx, gy - 32, cx, gy, '#2b1b24');
  } else if (mode === 'wselect') {
    // 사진 셀렉실: 큰 모니터에 사진 썸네일 · 소파
    wedWall(SW, gy, '#eef0f6', '#e2e6ee', '#9aa0aa');
    const mw = Math.round(Math.min(140, SW * 0.84)), cols = mw >= 120 ? 6 : 5, tw = Math.floor((mw - 6) / cols) - 2, x0 = mid - Math.round(mw / 2);
    fr(x0, gy - 86, mw, 62, '#2b1b24'); fr(x0 + 2, gy - 84, mw - 4, 58, '#30323d');
    for (let r = 0; r < 3; r++) for (let i = 0; i < cols; i++) { const x = x0 + 4 + i * (tw + 2), y = gy - 80 + r * 18, sel = (i + r * cols) === (Math.floor(T * 1.5) % (cols * 3)); fr(x, y, tw, 16, sel ? '#ffd84a' : '#5a5f6c'); fr(x + 1, y + 1, tw - 2, 14, ['#ffe4ee', '#f4f4f8', '#fff4ea'][(i + r) % 3]); const m = Math.round(tw / 2); fr(x + m - 4, y + 4, 3, 3, '#2a1c1c'); fr(x + m + 1, y + 4, 3, 3, '#2a1c1c'); fr(x + m - 5, y + 8, 5, 6, '#ffffff'); fr(x + m, y + 8, 4, 6, '#2b2b34'); }
    fr(mid - 4, gy - 24, 8, 14, '#2b1b24');
    fr(0, gy - 4, SW, SH - gy + 4, '#c8c0b8'); for (let x = 0; x < SW; x += 16) fr(x, gy, 1, SH - gy, '#b8b0a8');
  }
}
function drawWedActors(A, mid, gy, T) {
  if (A.ring && A.hus) { const x = Math.round(mid + A.hus.x * CUTK - 12), y = gy - 12; fr(x - 4, y - 3, 9, 7, '#2b1b24'); fr(x - 3, y - 2, 7, 5, '#e8414f'); fr(x - 1, y - 6, 3, 3, '#ffd84a'); fr(x, y - 7, 1, 1, '#ffffff');
    for (let i = 0; i < 4; i++) { const a = T * 3 + i * 1.57; fr(x + Math.cos(a) * 7, y - 6 + Math.sin(a) * 5, 1, 1, '#fff6b0'); } }
  if (A.hus && A.hus.phone) { const x = Math.round(mid + A.hus.x * CUTK - 7), y = gy - 13; fr(x - 2, y - 3, 5, 7, '#2b1b24'); fr(x - 1, y - 2, 3, 5, Math.floor(T * 6) % 2 ? '#b45cff' : '#7a2fc0');
    ctx.globalCompositeOperation = 'lighter'; pc(x, y - 2, 5, 'rgba(180,92,255,0.25)'); ctx.globalCompositeOperation = 'source-over'; }
  if (A.hee && A.hee.wed && A.hee.bouquet) { const x = Math.round(mid + A.hee.x * CUTK + 7), y = gy - 9; drawSpr(ispr('bouquet'), x, y); }
  if (A.bori && A.bori.ring) { const x = Math.round(mid + A.bori.x * CUTK + 6), y = gy - 4; fr(x - 3, y - 3, 7, 5, '#2b1b24'); fr(x - 2, y - 2, 5, 3, '#ffb3d9'); fr(x, y - 4, 1, 2, '#ffd84a'); }
}
const CH4_PROLOGUE = [
  { scene: 'seaS', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -24, pose: 'idle', dir: 'down' }, bori: { x: -48, pose: 'sit', face: 1, y: 2 }, hus: { x: 22, rodUp: true } }); },
    delay: 0.8, lines: [
      { who: 'sys', text: '사직에서 역전승을 본 뒤 어느 주말.\n오빠가 또 유료 바다낚시터에 가자고 했다.' },
      { who: 'hee', text: '…또 낚시? 12시간은 안 돼. 6시간만.', do() { A_().hee.sweat = true; } },
      { who: 'hus', text: '응! 좋아!', do() { A_().hee.sweat = false; } },
      { who: 'sys', text: '해 질 녘. 오빠가 찌낚시대를 꼭 쥔 채\n갑자기 진지해졌다.', do() { A_().hus.rodUp = false; } },
      { who: 'hus', text: '자기야… 그동안 낚시터 따라와 줘서 진짜 고마웠어.\n밤새 모기 물리면서도 옆에 있어 줘서…' },
      { who: 'hus', text: '나랑… 결혼해 줄래?', do() { A_().ring = true; A_().sparkle = true; sfx('ding'); } },
      { who: 'hee', text: '……….', do() { A_().sparkle = false; } },
      { who: 'hee', text: '지금… 여기서?\n미끼 냄새 나는 데서??', do() { A_().hee.shake = true; A_().hee.alert = true; } },
      { who: 'hee', text: '반지는 왜 지렁이 통 옆에서 꺼내는데!!!', do() { A_().hee.shake = false; A_().hee.alert = false; A_().aura = true; sfx('ult'); } },
      { who: 'sys', text: '희수의 멘헤라 게이지가 차오른다…' },
      { who: 'hus', text: '…어? 싫어…?' },
      { who: 'hee', text: '…싫다고는 안 했어. 바보야.', do() { A_().aura = false; A_().sparkle = true; } },
      { who: 'bori', text: '멍멍!! (축하해!)', do() { A_().bori.jump = true; sfx('bark'); } }] },
  { scene: 'whall', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -24, pose: 'idle', dir: 'down' }, bori: { x: -48, pose: 'sit', face: 1, y: 2 }, hus: { x: 24 } }); },
    delay: 0.6, lines: [
      { who: 'sys', text: '그렇게 결혼 준비가 시작됐다.\n첫 번째 관문은 웨딩홀 투어.' },
      { who: 'hee', text: '오빠, 여기 홀 어때? 천장 높고 밝지?' },
      { who: 'hus', text: '응! 좋아!' },
      { who: 'hee', text: '…아까 본 데보다 나아?' },
      { who: 'hus', text: '응! 거기도 좋아!', do() { A_().hee.sweat = true; } },
      { who: 'sys', text: '그때, 상담 데스크에서 견적서가 날아올랐다!', do() { const t = G.time; A_().hee.sweat = false; A_().mons = [{ type: 'quote', x: 70, y: -26, t0: t }, { type: 'planner', x: 92, y: 6, t0: t + 0.3 }, { type: 'addon', x: -84, y: 8, t0: t + 0.5 }]; sfx('pop'); } },
      { who: 'mon', text: '식대는 별도~ 꽃장식도 별도~\n주말 저녁은 할증이에요~♪' },
      { who: 'hee', text: '뭐?????!!!!!!\n처음에 말한 거랑 다르잖아!', do() { A_().hee.shake = true; A_().hee.alert = true; } },
      { who: 'hee', text: '추가금은 내가 다 잘라버린다.', do() { A_().hee.shake = false; A_().hee.alert = false; A_().hee.fist = true; sfx('smash'); } }] },
  { dur: 0.4 }
];
const CH4_DRESS = [
  { scene: 'wdress', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -22, pose: 'idle', dir: 'down', wed: true }, bori: { x: -48, pose: 'sit', face: 1, y: 2 }, hus: { x: 26 } }); },
    delay: 0.6, lines: [
      { who: 'sys', text: '다음은 드레스 투어.\n희수는 드레스를 다섯 벌이나 입어봤다.' },
      { who: 'hee', text: '오빠, 이거 어때? 아까 거랑 비교해서!', do() { A_().sparkle = true; } },
      { who: 'hus', text: '응! 좋아!', do() { A_().sparkle = false; } },
      { who: 'hee', text: '…그럼 이건? 라인이 좀 다르지?' },
      { who: 'hus', text: '너무 좋아!' },
      { who: 'hee', text: '아까 거랑 이거 중에 뭐가 더 좋은데?' },
      { who: 'hus', text: '둘 다 좋아! 다 좋아!' },
      { who: 'sys', text: '오빠는 「좋아」만 말하는\n좋아무새가 되어 버렸다…' },
      { who: 'hee', text: '…나 지금 진지하게 물어보는 거야.\n의견 좀 내라고.', do() { A_().aura = true; sfx('ult'); } },
      { who: 'hus', text: '응! 좋아!' },
      { who: 'hee', text: '…………………………', do() { A_().hee.shake = true; } },
      { who: 'bori', text: '멍…(눈치)' },
      { who: 'sys', text: '그 순간, 피팅룸 마네킹들이 움직이기 시작했다!', do() { const t = G.time; A_().hee.shake = false; A_().aura = false; A_().mons = [{ type: 'mannequin', x: 70, y: 6, t0: t }, { type: 'ribbon', x: -84, y: -24, t0: t + 0.3 }, { type: 'pin', x: 96, y: 8, t0: t + 0.5 }]; sfx('pop'); } },
      { who: 'hee', text: '「좋아」 한 번만 더 하면\n오빠도 마네킹이랑 같이 정리한다.', do() { A_().hee.fist = true; sfx('smash'); } }] },
  { dur: 0.4 }
];
const CH4_STUDIO = [
  { scene: 'wstudio', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -22, pose: 'idle', dir: 'down', wed: true, bouquet: true }, bori: { x: -48, pose: 'sit', face: 1, y: 2 }, hus: { x: 24, tux: true } }); },
    delay: 0.6, lines: [
      { who: 'sys', text: '웨딩 촬영 날.\n오빠는 3개월 동안 10kg 빼기로 약속했었다.' },
      { who: 'hee', text: '오빠, 다이어트 얼마나 했어?' },
      { who: 'hus', text: '…자기야, 그게…' },
      { who: 'sys', text: '툭. 턱시도 단추가 튕겨 나갔다.', do() { A_().big = G.time + 0.2; A_().bigText = '단추가… 안 잠겨…'; A_().bigCol = '#ffd84a'; G.shake = 3; sfx('pop'); } },
      { who: 'hus', text: '야식으로 치킨을 조금… 매일…' },
      { who: 'hee', text: '……3개월 동안 뭐 했어?', do() { A_().big = 0; A_().hee.alert = true; A_().hee.shake = true; } },
      { who: 'hee', text: '사진은 평생 남는 거야.\n오빠는 지금부터 숨 참아.', do() { A_().hee.alert = false; A_().hee.shake = false; A_().aura = true; sfx('ult'); } },
      { who: 'hus', text: '…넵. (흡)' },
      { who: 'sys', text: '그때 플래시 조명들이 번쩍이며 덤벼들었다!', do() { const t = G.time; A_().aura = false; A_().mons = [{ type: 'flashm', x: 72, y: 4, t0: t }, { type: 'camera', x: -86, y: 8, t0: t + 0.3 }, { type: 'reflector', x: 98, y: 6, t0: t + 0.5 }]; sfx('pop'); } }] },
  { dur: 0.4 }
];
const CH4_SELECT = [
  { scene: 'wselect', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -22, pose: 'idle', dir: 'down' }, bori: { x: -48, pose: 'sit', face: 1, y: 2 }, hus: { x: 26 } }); },
    delay: 0.6, lines: [
      { who: 'sys', text: '촬영 사진 셀렉 날.\n수백 장 중에 앨범에 넣을 사진을 골라야 한다.' },
      { who: 'hee', text: '오빠, 이 사진이랑 이 사진 중에 뭐가 나아?' },
      { who: 'hus', text: '응… 좋아…', do() { A_().hus.phone = true; } },
      { who: 'hee', text: '…지금 뭐 해?', do() { A_().hee.sweat = true; } },
      { who: 'hus', text: '아 잠깐만, 이번 판만…\n지금 보스전이라…' },
      { who: 'hee', text: '뭐?????!!!!!!', do() { A_().hee.sweat = false; A_().hee.shake = true; A_().hee.alert = true; G.shake = 4; } },
      { who: 'hee', text: '우리 결혼사진 고르는데\n지금 게임을 해?!', do() { A_().hee.shake = false; A_().hee.alert = false; A_().aura = true; sfx('ult'); } },
      { who: 'sys', text: '그때, 오빠 핸드폰에서\n게임 마왕이 튀어나왔다!', do() { A_().hus.phone = false; A_().aura = false; A_().mons = [{ type: 'gphone', x: 62, y: -40, t0: G.time }]; G.shake = 5; sfx('slam'); } },
      { who: 'mon', text: '크하하! 이 남자의 시간은 이제 내 거다!\n셀렉실은 이제 내 던전이다!' },
      { who: 'sys', text: '가챠 캡슐이 셀렉실에 쏟아졌다.\n모니터 속 결혼사진들이 깜빡인다.', do() { G.shake = 3; sfx('slam'); } },
      { who: 'hus', text: '자, 자기야… 내가 끌게… 지금 끌게…' },
      { who: 'hee', text: '됐고. 사진 다 고를 때까지\n아무 데도 못 가.', do() { A_().hee.fist = true; sfx('smash'); } },
      { who: 'hee', text: '…너부터 지워줄게.' }] },
  { dur: 0.4 }
];
const CH4_ENDING = [
  { scene: 'wwed', bgm: 'story',
    init(A) { clearA(A); Object.assign(A, { hee: { x: -22, pose: 'idle', dir: 'down', wed: true, bouquet: true }, bori: { x: -46, pose: 'sit', face: 1, y: 2, ring: true }, hus: { x: 22, tux: true } }); },
    delay: 0.8, lines: [
      { who: 'sys', text: '게임 마왕이 쓰러지고,\n앨범 사진도 무사히 다 골랐다.' },
      { who: 'sys', text: '…그리고 대망의 본식 날.' },
      { who: 'hee', text: '오빠, 핸드폰 줘.\n오늘은 내가 들고 있을게.' },
      { who: 'hus', text: '…넵.' },
      { who: 'sys', text: '신부 입장—!', do() { A_().sparkle = true; sfx('ding'); } },
      { who: 'hus', text: '자기야… 진짜 예쁘다.', do() { A_().sparkle = false; } },
      { who: 'hee', text: '…「좋아」 말고 다른 말 해줘서 고마워.', do() { A_().sparkle = true; } },
      { who: 'sys', text: '「신랑은 신부를 평생 아끼고\n사랑하겠습니까?」', do() { A_().sparkle = false; } },
      { who: 'hus', text: '응! 좋아!' },
      { who: 'hee', text: '…………', do() { A_().aura = true; A_().hee.shake = true; } },
      { who: 'hus', text: '아, 아니! 네!!\n평생 잘할게요!!', do() { A_().aura = false; A_().hee.shake = false; } },
      { who: 'hee', text: '오빠, 평생 잘해.', do() { A_().sparkle = true; sfx('ding'); } },
      { who: 'bori', text: '멍멍!! (반지 배달 완료!)', do() { A_().bori.jump = true; sfx('bark'); } },
      { who: 'sys', text: '희수와 오빠는 그렇게 부부가 되었다.', do() { A_().big = G.time + 0.3; A_().bigText = '결혼 축하해요!!'; A_().bigCol = '#ff7ab8'; sfx('lvl'); } },
      { who: 'hus', text: '근데 자기야… 신혼여행은 어디로…?' },
      { who: 'hee', text: '신혼여행지는 내가 정할 거야.\n낚시터만 아니면 다 돼.' }] },
  { dur: 1.0 }
];


// ---------- 스테이지 소품 ----------
function dChairW() { const c = mkCanvas(12, 18), g = c.getContext('2d'); pRect(g, 1, 0, 10, 9, OK); pRect(g, 2, 1, 8, 7, '#ffffff'); pRect(g, 1, 9, 10, 3, OK); pRect(g, 2, 10, 8, 1, '#f0e8e0'); pRect(g, 1, 12, 2, 6, OK); pRect(g, 9, 12, 2, 6, OK); pRect(g, 4, 3, 4, 3, '#ff9fcf'); pRect(g, 5, 4, 2, 1, '#e8608a'); return c; }
function dFlowerPot() { const c = mkCanvas(14, 24), g = c.getContext('2d'); pRect(g, 6, 10, 2, 11, OK); pRect(g, 3, 20, 8, 4, OK); pRect(g, 4, 21, 6, 2, '#ffffff'); pCirc(g, 7, 6, 6, OK); pCirc(g, 7, 6, 5, '#ffd1e6'); for (const [x, y, k] of [[4, 4, '#ff7ab8'], [9, 4, '#ffffff'], [7, 8, '#ff9fcf'], [5, 8, '#ffffff'], [10, 7, '#ff7ab8'], [7, 3, '#ffd84a']]) pRect(g, x, y, 2, 2, k); pRect(g, 2, 6, 2, 1, '#5aa845'); pRect(g, 10, 9, 2, 1, '#5aa845'); return c; }
function dArch() { const c = mkCanvas(64, 56), g = c.getContext('2d'); pRect(g, 4, 18, 4, 38, OK); pRect(g, 56, 18, 4, 38, OK); pRect(g, 5, 18, 2, 38, '#ffffff'); pRect(g, 57, 18, 2, 38, '#ffffff');
  for (let a = 0; a <= 40; a++) { const t = Math.PI * a / 40, x = 32 - Math.cos(t) * 26, y = 22 - Math.sin(t) * 18; pCirc(g, Math.round(x), Math.round(y), 4, OK); pCirc(g, Math.round(x), Math.round(y), 3, a % 3 ? '#ffd1e6' : '#ffffff'); if (a % 4 === 0) pRect(g, Math.round(x) - 1, Math.round(y) - 1, 2, 2, a % 8 ? '#ff7ab8' : '#5aa845'); } return c; }
function dDesk() { const c = mkCanvas(26, 18), g = c.getContext('2d'); pRect(g, 0, 4, 26, 6, OK); pRect(g, 1, 5, 24, 4, '#c8a070'); pRect(g, 2, 10, 2, 8, OK); pRect(g, 22, 10, 2, 8, OK); pRect(g, 5, 1, 8, 4, OK); pRect(g, 6, 2, 6, 2, '#ffffff'); pRect(g, 15, 0, 6, 5, OK); pRect(g, 16, 1, 4, 3, '#ff9fcf'); return c; }
function dMannequin(col) { const c = mkCanvas(18, 30), g = c.getContext('2d'); pRect(g, 8, 0, 2, 3, OK); pRect(g, 6, 3, 6, 4, OK); pRect(g, 7, 4, 4, 2, '#e3c9a0'); for (let y = 7; y < 24; y++) { const hw = Math.round(2 + (y - 7) * 0.45); pRect(g, 9 - hw - 1, y, hw * 2 + 2, 1, OK); pRect(g, 9 - hw, y, hw * 2, 1, col); } pRect(g, 3, 23, 12, 1, shadeHex(col, -0.12)); pRect(g, 8, 24, 2, 4, OK); pRect(g, 5, 28, 8, 2, OK); return c; }
function dMirror() { const c = mkCanvas(14, 28), g = c.getContext('2d'); pRect(g, 1, 0, 12, 24, OK); pRect(g, 2, 1, 10, 22, '#e8c070'); pRect(g, 3, 2, 8, 20, '#cfeaff'); pRect(g, 4, 3, 2, 8, '#ffffff'); pRect(g, 3, 24, 2, 4, OK); pRect(g, 9, 24, 2, 4, OK); return c; }
function dSofa() { const c = mkCanvas(30, 16), g = c.getContext('2d'); pRect(g, 0, 2, 30, 12, OK); pRect(g, 1, 3, 28, 4, '#e8608a'); pRect(g, 1, 7, 28, 5, '#ff9fcf'); pRect(g, 1, 3, 4, 9, '#e8608a'); pRect(g, 25, 3, 4, 9, '#e8608a'); pRect(g, 2, 14, 2, 2, OK); pRect(g, 26, 14, 2, 2, OK); return c; }
function dSoftbox() { const c = mkCanvas(20, 40), g = c.getContext('2d'); pRect(g, 0, 0, 20, 16, OK); pRect(g, 1, 1, 18, 14, '#ffffff'); pRect(g, 3, 3, 14, 10, '#fffbe8'); pRect(g, 9, 16, 2, 20, OK); pRect(g, 3, 36, 14, 2, OK); pRect(g, 5, 34, 2, 2, OK); pRect(g, 13, 34, 2, 2, OK); return c; }
function dTripod() { const c = mkCanvas(16, 26), g = c.getContext('2d'); pRect(g, 2, 0, 12, 8, OK); pRect(g, 3, 1, 10, 6, '#30323d'); pRect(g, 6, 2, 4, 4, '#9fe8ff'); pRect(g, 7, 8, 2, 8, OK); for (let i = 0; i < 10; i++) { pRect(g, 7 - Math.round(i * 0.6), 16 + i, 1, 1, OK); pRect(g, 8 + Math.round(i * 0.6), 16 + i, 1, 1, OK); pRect(g, 7, 16 + i, 2, 1, OK); } return c; }
function dReflectorStand() { const c = mkCanvas(16, 28), g = c.getContext('2d'); pCirc(g, 8, 7, 7, OK); pCirc(g, 8, 7, 6, '#ffd84a'); pRect(g, 5, 4, 3, 2, '#fff6b0'); pRect(g, 7, 14, 2, 10, OK); pRect(g, 3, 24, 10, 2, OK); return c; }
function dMonitor() { const c = mkCanvas(72, 40), g = c.getContext('2d'); pRect(g, 0, 0, 72, 34, OK); pRect(g, 2, 2, 68, 30, '#1c2238');
  for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const x = 4 + k * 11, y = 4 + r * 9; pRect(g, x, y, 10, 8, (r + k) % 4 === 1 ? '#ff7ab8' : '#fffaf4'); pRect(g, x + 1, y + 1, 8, 6, ['#ffd1e6', '#cfeaff', '#ffe9b0', '#e8dcc8'][(r * 6 + k) % 4]); pRect(g, x + 4, y + 2, 2, 2, '#6a4a3a'); pRect(g, x + 3, y + 4, 4, 3, (r + k) % 2 ? '#ffffff' : '#30323d'); }
  pRect(g, 33, 34, 6, 4, OK); pRect(g, 26, 38, 20, 2, OK); return c; }
function dPhotoStand() { const c = mkCanvas(14, 22), g = c.getContext('2d'); pRect(g, 0, 0, 14, 16, OK); pRect(g, 1, 1, 12, 14, '#e8c070'); pRect(g, 2, 2, 10, 12, '#fffaf4'); pRect(g, 3, 3, 8, 8, '#ffd1e6'); pRect(g, 5, 4, 2, 2, '#6a4a3a'); pRect(g, 4, 6, 4, 4, '#ffffff'); pRect(g, 7, 5, 2, 2, '#3a2a2a'); pRect(g, 7, 7, 3, 3, '#30323d'); pRect(g, 6, 16, 2, 4, OK); pRect(g, 3, 20, 8, 2, OK); return c; }
function dCake() { const c = mkCanvas(16, 26), g = c.getContext('2d'); pRect(g, 1, 17, 14, 8, OK); pRect(g, 2, 18, 12, 6, '#fffaf4'); pRect(g, 3, 10, 10, 8, OK); pRect(g, 4, 11, 8, 6, '#fffaf4'); pRect(g, 5, 4, 6, 7, OK); pRect(g, 6, 5, 4, 5, '#fffaf4'); pRect(g, 2, 20, 12, 1, '#ff9fcf'); pRect(g, 4, 13, 8, 1, '#ff9fcf'); pRect(g, 7, 1, 2, 3, '#ff7ab8'); pRect(g, 0, 25, 16, 1, OK); return c; }

// ---------- 스테이지 바닥·소품 배치 ----------
function groundHall(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  // 웨딩홀: 대리석 바둑판 + 가운데 레드 카펫(본식은 꽃잎)
  const wed = Z.theme === 'wed'; for (let y = 0; y < WORLD_H; y += 20) for (let x = 0; x < WORLD_W; x += 20) { g.fillStyle = ((x + y) / 20) % 2 ? (wed ? '#fff4ea' : '#efe4d2') : (wed ? '#f4e6d8' : '#e2d4bc'); g.fillRect(x, y, 20, 20); }
  for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(180,160,140,0.35)'; const x = Math.floor(R() * WORLD_W), y = Math.floor(R() * WORLD_H); g.fillRect(x, y, Math.floor(R() * 8) + 2, 1); }
  g.fillStyle = '#7a1a26'; g.fillRect(cx - 24, 0, 48, WORLD_H); g.fillStyle = '#b8283a'; g.fillRect(cx - 22, 0, 44, WORLD_H); g.fillStyle = '#ffd84a'; g.fillRect(cx - 21, 0, 1, WORLD_H); g.fillRect(cx + 20, 0, 1, WORLD_H);
  if (wed) for (let i = 0; i < 260; i++) { g.fillStyle = choice(['#ffd1e6', '#ffffff', '#ff9fcf']); const y = Math.floor(R() * WORLD_H), x = Math.round(cx + rr(-30, 30)); g.fillRect(x, y, 2, 1); }
}
function groundDress(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  // 드레스 숍: 분홍 카펫 + 작은 꽃무늬
  g.fillStyle = '#f6d6e2'; g.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let y = 6; y < WORLD_H; y += 16) for (let x = ((y / 16) % 2) * 8 + 4; x < WORLD_W; x += 16) { g.fillStyle = '#ffeaf2'; g.fillRect(x, y, 3, 3); g.fillStyle = '#e8a8c4'; g.fillRect(x + 1, y + 1, 1, 1); }
  g.fillStyle = '#e8b8cc'; g.fillRect(cx - 26, 0, 52, WORLD_H); g.fillStyle = '#fff2f6'; g.fillRect(cx - 24, 0, 48, WORLD_H);
}
function groundSelect(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  // 사진 셀렉실: 회보라 카펫 타일 + 바닥에 흩어진 인화 사진
  for (let y = 0; y < WORLD_H; y += 24) for (let x = 0; x < WORLD_W; x += 24) { g.fillStyle = ((x + y) / 24) % 2 ? '#4a4462' : '#433d5a'; g.fillRect(x, y, 24, 24); g.fillStyle = '#3a3450'; g.fillRect(x, y, 24, 1); g.fillRect(x, y, 1, 24); }
  for (let i = 0; i < 60; i++) { const x = Math.floor(R() * WORLD_W), y = Math.floor(R() * WORLD_H); g.fillStyle = '#fffaf4'; g.fillRect(x, y, 6, 5); g.fillStyle = choice(['#ffd1e6', '#cfeaff', '#ffe9b0', '#e8dcc8']); g.fillRect(x + 1, y + 1, 4, 3); }
  g.fillStyle = '#5a4a7a'; g.fillRect(cx - 24, 0, 48, WORLD_H); g.fillStyle = '#6e5e92'; g.fillRect(cx - 22, 0, 44, WORLD_H);
}
function groundStudio(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  // 스튜디오: 흰 바닥 + 바닥 테이프 자리 표시
  for (let y = 0; y < WORLD_H; y += 8) { g.fillStyle = (y / 8) % 2 ? '#f4f4f8' : '#eeeef4'; g.fillRect(0, y, WORLD_W, 8); }
  for (let i = 0; i < 14; i++) { const x = Math.round(rr(40, WORLD_W - 40)), y = Math.round(rr(80, WORLD_H - 80)); g.fillStyle = choice(['#ff7ab8', '#ffd84a', '#6fb8ff']); g.fillRect(x - 5, y, 11, 2); g.fillRect(x, y - 5, 2, 11); }
}
function decorHall(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  const ch = dChairW(), fl = dFlowerPot(); for (let y = 150; y < WORLD_H - 90; y += 34) { for (const dx of [-60, -84, -108]) add(ch, cx + dx, y, 0, 0); for (const dx of [60, 84, 108]) add(ch, cx + dx, y, 0, 0); }
  for (let y = 130; y < WORLD_H - 70; y += 136) { add(fl, cx - 36, y, 3, 6); add(fl, cx + 36, y, 3, 6); }
  add(dArch(), cx, 120, 0, 0); scatter(4, () => dDesk(), 8, 14, { avoidBoss: true });
}
function decorDress(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  const cols = ['#ffffff', '#fffaf4', '#ffd8e8', '#f4a6c8']; for (let y = 120; y < WORLD_H - 70; y += 92) { add(dMannequin(choice(cols)), 44, y, 5, 10); add(dMannequin(choice(cols)), WORLD_W - 44, y + 46, 5, 10); }
  scatter(5, () => dMirror(), 4, 14, { avoidBoss: true }); scatter(4, () => dSofa(), 8, 16, { avoidBoss: true });
}
function decorStudio(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  const sb = dSoftbox(), tp = dTripod(); for (const [x, y] of [[50, 160], [WORLD_W - 50, 160], [50, WORLD_H - 170], [WORLD_W - 50, WORLD_H - 170]]) add(sb, x, y, 4, 10, { glow: '#ffffff' });
  scatter(5, () => tp, 3, 16, { avoidBoss: true }); scatter(4, () => dReflectorStand(), 3, 16, { avoidBoss: true });
}
function decorSelect(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  // 위쪽 큰 모니터 벽(웨딩 사진 썸네일) + 셀렉 책상 + 소파
  for (const x of [cx - 120, cx, cx + 120]) add(dMonitor(), x, 92, 30, 8, { glow: '#bfe4ff' });
  const dk = dDesk(); for (let y = 200; y < WORLD_H - 90; y += 110) { add(dk, 64, y, 12, 8, { glow: '#bfe4ff' }); add(dk, WORLD_W - 64, y + 55, 12, 8, { glow: '#bfe4ff' }); }
  scatter(4, () => dSofa(), 8, 16, { avoidBoss: true }); scatter(6, () => dPhotoStand(), 4, 10, { avoidBoss: true });
}
function decorWed(X) {
  const { g, W, R, rr, cx, pathX, add, scatter, Z } = X;
  const ch = dChairW(), fl = dFlowerPot(); for (let y = 170; y < WORLD_H - 90; y += 30) { for (const dx of [-58, -80, -102, -124]) add(ch, cx + dx, y, 0, 0); for (const dx of [58, 80, 102, 124]) add(ch, cx + dx, y, 0, 0); }
  for (let y = 150; y < WORLD_H - 70; y += 100) { add(fl, cx - 34, y, 3, 6, { glow: '#ffe0f0' }); add(fl, cx + 34, y, 3, 6, { glow: '#ffe0f0' }); }
  add(dArch(), cx, 118, 0, 0); add(dCake(), WORLD_W - 70, 140, 7, 14); add(dCake(), 70, 140, 7, 14);
}

regChapter({
  c: 4, name: '결혼 대작전', title: '4장 · 결혼 대작전', pick: ['결혼식', '결혼식'], lv: 50, baseL: 24, // 3장 5회차 수준
  zones: [
    { name: '웨딩홀 투어', sub: 'STAGE 13', quota: 36, max: 12, spawnInt: 1.15, mons: [['planner', 5], ['quote', 4], ['addon', 3]], boss: 'feeking', theme: 'hall', next: '드레스 숍' },
    { name: '드레스 숍', sub: 'STAGE 14', quota: 38, max: 13, spawnInt: 1.1, mons: [['mannequin', 4], ['ribbon', 5], ['pin', 3]], boss: 'parrot', theme: 'dress', next: '웨딩 스튜디오' },
    { name: '웨딩 스튜디오', sub: 'STAGE 15', quota: 40, max: 13, spawnInt: 1.1, mons: [['flashm', 4], ['reflector', 3], ['camera', 5]], boss: 'tuxboss', theme: 'studio', next: '사진 셀렉홀' },
    { name: '사진 셀렉실', sub: 'FINAL STAGE', quota: 42, max: 14, spawnInt: 1.05, mons: [['gacha', 5], ['camera', 3], ['quote', 3], ['flashm', 2]], boss: 'gamelord', theme: 'select', next: '' },
  ],
  mons: {
    planner:   { name: '영업왕 웨딩플래너', spr: 'planner',   hp: 1100, atk: 84,  def: 15, spd: 32, xp: 170, gold: [38, 54], r: 6, ai: 'ranged', proj: 'ticket', col: '#2e3a5c' },
    quote:     { name: '날아다니는 견적서', spr: 'quote',     hp: 900,  atk: 80,  def: 12, spd: 48, xp: 160, gold: [36, 52], r: 6, ai: 'float', col: '#f7f3ea', fly: 1 },
    addon:     { name: '추가금 옵션',       spr: 'addon',     hp: 1300, atk: 88,  def: 16, spd: 30, xp: 170, gold: [40, 56], r: 6, ai: 'hop', col: '#ffd84a' },
    mannequin: { name: '피팅룸 마네킹',     spr: 'mannequin', hp: 1600, atk: 90,  def: 20, spd: 26, xp: 180, gold: [40, 56], r: 7, ai: 'chase', col: '#fffaf4' },
    ribbon:    { name: '레이스 리본',       spr: 'ribbon',    hp: 1000, atk: 86,  def: 12, spd: 50, xp: 170, gold: [38, 54], r: 6, ai: 'float', col: '#ffb3d9', fly: 1 },
    pin:       { name: '시침핀',            spr: 'pin',       hp: 900,  atk: 100, def: 12, spd: 54, xp: 180, gold: [40, 56], r: 5, ai: 'charge', col: '#e8414f' },
    flashm:    { name: '플래시 조명',       spr: 'flashm',    hp: 1200, atk: 92,  def: 14, spd: 28, xp: 180, gold: [42, 58], r: 6, ai: 'ranged', proj: 'flash', col: '#ffffff' },
    reflector: { name: '금빛 반사판',       spr: 'reflector', hp: 1900, atk: 94,  def: 22, spd: 26, xp: 190, gold: [42, 58], r: 7, ai: 'chase', col: '#ffd84a' },
    camera:    { name: '연사 카메라',       spr: 'camera',    hp: 1050, atk: 102, def: 14, spd: 52, xp: 190, gold: [42, 58], r: 6, ai: 'charge', col: '#30323d' },
    gacha:     { name: '가챠 캡슐',         spr: 'gacha',     hp: 1400, atk: 96,  def: 16, spd: 32, xp: 190, gold: [44, 60], r: 6, ai: 'hop', col: '#ffb3d9' },
    feeking:   { name: '추가금 대마왕',     spr: 'addon',     scale: 3.4, crown: 1, hp: 34000, atk: 92,  def: 22, spd: 28, xp: 9000,  gold: [1900, 2200], r: 22, ai: 'feeking', boss: 1, col: '#ffd84a', drops: ['ringbox', 'pearlpin'] },
    parrot:    { name: '좋아무새',          spr: 'parrot',    scale: 3.4, crown: 1, hp: 42000, atk: 100, def: 24, spd: 34, xp: 10500, gold: [2100, 2400], r: 22, ai: 'parrot', boss: 1, col: '#7ccf5a', fly: 1, drops: ['dress2', 'b_tux'] },
    tuxboss:   { name: '감량 실패 턱시도',  spr: 'tux',       scale: 3.4, crown: 1, hp: 50000, atk: 108, def: 26, spd: 26, xp: 12500, gold: [2300, 2600], r: 22, ai: 'tuxboss', boss: 1, col: '#30323d', drops: ['heels', 'envbag'] },
    gamelord:  { name: '모바일 게임 마왕',  spr: 'gphone',    scale: 4.0, crown: 1, hp: 60000, atk: 116, def: 28, spd: 24, xp: 17000, gold: [0, 0],       r: 28, ai: 'gamelord', boss: 1, col: '#b45cff', drops: ['toy_ring'] },
  },
  ai: {
    // 추가금 대마왕: 견적서 사방 발사 · 「부가세 별도」 도장 예고 원 · 추가금 옵션 호출
    feeking(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt;
      if (e.st === 'idle') { e.st = 'roam'; e.stT = 1.6; e.cyc = 0; }
      if (e.st === 'roam') { moveToward(e, G.P.x, G.P.y, sp, dt); e.face = G.P.x > e.x ? -1 : 1;
        if (e.stT <= 0) { e.cyc++; const pat = ['bill', 'stamp', 'bill', 'call'][e.cyc % 4]; e.st = pat;
          if (pat === 'bill') { e.stT = 0.5; bubble(e, choice(['식대 추가요~!', '꽃장식은 별도예요~', '주말 저녁은 할증!']), 1.2); }
          if (pat === 'stamp') { e.stT = 1.0; e.marks = []; const n = enr ? 5 : 3; for (let i = 0; i < n; i++) { const m = { x: G.P.x + (i ? rand(-70, 70) : 0), y: G.P.y + (i ? rand(-50, 50) : 0) }; e.marks.push(m); G.fx.push({ k: 'circle', x: m.x, y: m.y, r: 30, t: 0, dur: 1.0 }); } bubble(e, '부가세 별도!!', 1.1); }
          if (pat === 'call') { e.stT = 0.6; for (let i = 0; i < (enr ? 3 : 2); i++) spawnEnemy('addon', e.x + rand(-40, 40), e.y + rand(10, 30)); bubble(e, '옵션 추가 출동!', 1.1); } } return; }
      if (e.st === 'bill' && e.stT <= 0) { const n = enr ? 16 : 12, a0 = rand(0, 6.28); for (let i = 0; i < n; i++) shootAt(e, 'ticket', a0 + i / n * Math.PI * 2, 78); sfx('pop'); }
      if (e.st === 'stamp' && e.stT <= 0) { G.shake = 6; sfx('slam'); for (const m of e.marks || []) { G.fx.push({ k: 'ring', x: m.x, y: m.y, r: 30, col: '#e8414f', t: 0, dur: 0.35 }); burst(m.x, m.y, '#ffd84a', 10, 80); if (Math.hypot(G.P.x - m.x, G.P.y - m.y) < 30) hurtPlayer(e.atk * 1.4, e); } }
      if (e.stT <= 0) { e.st = 'roam'; e.stT = enr ? 1.2 : 1.9; }
    },
    // 좋아무새: 「응 좋아!」 돌진 · 하트 소용돌이 · 레이스 리본 호출 (둥둥 떠다님)
    parrot(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt; if (e.st !== 'dash') e.hopY = 6 + Math.sin(e.t * 3) * 3;
      if (e.st === 'idle') { e.st = 'roam'; e.stT = 1.6; e.cyc = 0; }
      if (e.st === 'roam') { moveToward(e, G.P.x, G.P.y - 20, sp, dt); e.face = G.P.x > e.x ? -1 : 1;
        if (e.stT <= 0) { e.cyc++; const pat = ['dash', 'chirp', 'dash', 'call'][e.cyc % 4];
          if (pat === 'dash') { e.st = 'tele'; e.stT = 0.7; aimDash(e, 300, e.r * 1.3, choice(['응! 좋아!!', '너무 좋아!!', '다 좋아!!'])); }
          if (pat === 'chirp') { e.st = 'chirp'; e.stT = 2.4; e.shT = 0; e.sa = rand(0, 6.28); bubble(e, '좋아~ 좋아~ 너무 좋아~♪', 1.3); }
          if (pat === 'call') { e.st = 'call'; e.stT = 0.6; for (let i = 0; i < (enr ? 4 : 3); i++) spawnEnemy('ribbon', e.x + rand(-40, 40), e.y + rand(-10, 20)); bubble(e, '이것도 좋아! 저것도 좋아!', 1.2); } } return; }
      if (e.st === 'tele') { if (e.stT <= 0) { e.st = 'dash'; e.stT = 1.0; } return; }
      if (e.st === 'dash') { if (dashStep(e, 260, dt) || e.stT <= 0) { e.st = 'roam'; e.stT = enr ? 1.0 : 1.6; G.shake = 4; } return; }
      if (e.st === 'chirp') { e.shT -= dt; if (e.shT <= 0) { e.shT = enr ? 0.09 : 0.13; e.sa += 0.45; shootAt(e, 'heart', e.sa, 68); if (enr) shootAt(e, 'heart', e.sa + Math.PI, 68); } }
      if (e.stT <= 0) { e.st = 'roam'; e.stT = enr ? 1.1 : 1.8; }
    },
    // 감량 실패 턱시도: 숨 참고 점프 내려찍기(예고 원) · 단추 튕기기(부채꼴) · 「치킨 한 마리만」 치킨 호출
    tuxboss(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt;
      if (e.st === 'idle') { e.st = 'roam'; e.stT = 1.6; e.cyc = 0; }
      if (e.st === 'roam') { moveToward(e, G.P.x, G.P.y, sp, dt); e.face = G.P.x > e.x ? -1 : 1;
        if (e.stT <= 0) { e.cyc++; const pat = ['jump', 'pop', 'jump', 'snack'][e.cyc % 4]; e.st = pat;
          if (pat === 'jump') { e.stT = enr ? 0.9 : 1.1; e.tx = G.P.x; e.ty = G.P.y; e.jx = e.x; e.jy = e.y; e.jT = e.stT; G.fx.push({ k: 'circle', x: e.tx, y: e.ty, r: 50, t: 0, dur: e.stT }); bubble(e, '흡—!! (숨 참기)', 1.1); }
          if (pat === 'pop') { e.stT = 0.6; bubble(e, '단추가… 안 잠겨…!', 1.2); }
          if (pat === 'snack') { e.stT = 0.6; spawnEnemy('chickbox', e.x - 30, e.y); if (enr) spawnEnemy('chickbox', e.x + 30, e.y); bubble(e, '치킨 한 마리만… 딱 한 마리만…', 1.3); } } return; }
      if (e.st === 'jump') { const p = 1 - Math.max(0, e.stT) / e.jT; e.x = lerp(e.jx, e.tx, p); e.y = lerp(e.jy, e.ty, p); e.hopY = Math.sin(p * Math.PI) * 60;
        if (e.stT <= 0) { e.hopY = 0; G.shake = 8; sfx('slam'); burst(e.x, e.y, '#ffffff', 18, 100); G.fx.push({ k: 'ring', x: e.x, y: e.y - 4, r: 50, col: '#ffd84a', t: 0, dur: 0.4 }); if (Math.hypot(G.P.x - e.x, G.P.y - e.y) < 50) hurtPlayer(e.atk * 1.6, e); } }
      if (e.st === 'pop' && e.stT <= 0) { const a0 = Math.atan2(G.P.y - e.y, G.P.x - e.x), n = enr ? 9 : 7; for (let i = 0; i < n; i++) shootAt(e, 'button', a0 + (i - (n - 1) / 2) * 0.22, 96); sfx('pop'); }
      if (e.stT <= 0) { e.st = 'roam'; e.stT = enr ? 1.1 : 1.8; }
    },
    // 모바일 게임 마왕: 3갈래 레이저(예고 선) · 과금 코인 소나기 · 가챠 10연차(캡슐 호출)
    gamelord(e, dt, sp, dP) {
      const enr = e.hp < e.maxHp * 0.5; e.stT -= dt; e.hopY = 4 + Math.sin(e.t * 2) * 2;
      if (e.st === 'idle') { e.st = 'roam'; e.stT = 2; e.cyc = 0; }
      if (e.st === 'roam') { moveToward(e, G.P.x, G.P.y - 30, sp, dt);
        if (e.stT <= 0) { e.cyc++; const pat = ['laser', 'coin', 'laser', 'gacha'][e.cyc % 4]; e.st = pat; e.shT = 0;
          if (pat === 'laser') { e.stT = enr ? 0.8 : 1.0; const a = Math.atan2(G.P.y - e.y, G.P.x - e.x); e.las = enr ? [a, a - 0.5, a + 0.5, a + Math.PI] : [a, a - 0.6, a + 0.6]; for (const l of e.las) G.fx.push({ k: 'line', x: e.x, y: e.y - 6, a: l, len: 220, w: 26, t: 0, dur: e.stT }); bubble(e, choice(['보스전 시작!', '이번 판만 하고!', '접속 보상 받아가~']), 1.1); }
          if (pat === 'coin') { e.stT = 2.4; bubble(e, '과금하시겠습니까? [예] [예]', 1.3); }
          if (pat === 'gacha') { e.stT = 0.6; for (let i = 0; i < (enr ? 4 : 3); i++) spawnEnemy('gacha', e.x + rand(-50, 50), e.y + rand(10, 40)); bubble(e, '10연차!! 확정 보상!!', 1.2); } } return; }
      if (e.st === 'laser' && e.stT <= 0) { G.flashT = 0.2; G.shake = 6; sfx('slam'); const d = Math.hypot(G.P.x - e.x, G.P.y - e.y), pa = Math.atan2(G.P.y - e.y, G.P.x - e.x);
        for (const l of e.las || []) { burst(e.x + Math.cos(l) * 60, e.y + Math.sin(l) * 60, '#b45cff', 10, 120); const da = Math.abs(((pa - l + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (d < 225 && Math.sin(da) * d < 15 && da < Math.PI / 2) { hurtPlayer(e.atk * 1.5, e); break; } } }
      if (e.st === 'coin') { e.shT -= dt; if (e.shT <= 0) { e.shT = enr ? 0.07 : 0.1; shootAt(e, 'coin', Math.PI / 2 + rand(-1.2, 1.2), 82); } }
      if (e.stT <= 0) { e.st = 'roam'; e.stT = enr ? 1.2 : 1.9; }
    }
  },
  // 가장자리는 실내 벽
  themes: {
    hall: { bg: '#e8dcc8', hedge: ['#d8c8b0', '#f0e4d0', '#b8a890'], tint: [60, 30, 60, 0.04], glow: 0.12, wall: 1, ground: groundHall, decor: decorHall },
    dress: { bg: '#f6d6e2', hedge: ['#e8b8cc', '#ffd8e8', '#c890a8'], tint: [80, 20, 60, 0.05], glow: 0.12, wall: 1, ground: groundDress, decor: decorDress },
    studio: { bg: '#f4f4f8', hedge: ['#c0c6d0', '#e0e4ec', '#9aa0aa'], tint: [30, 30, 60, 0.06], glow: 0.3, wall: 1, ground: groundStudio, decor: decorStudio },
    wed: { bg: '#fff4ea', hedge: ['#f0d8c8', '#fff0e4', '#c8a890'], tint: [80, 40, 60, 0.08], glow: 0.35, wall: 1, ground: groundHall, decor: decorWed },
  // FINAL 사진 셀렉실: 어두운 방 + 모니터 불빛 (핸드폰에서 튀어나온 게임 마왕 때문에 게임 불빛이 섞임)
    select: { bg: '#3a3450', hedge: ['#4a4462', '#5e5878', '#2e2a40'], tint: [40, 20, 90, 0.12], glow: 0.45, wall: 1, ground: groundSelect, decor: decorSelect },
  },
  items: {
    ringbox:  { slot: 'weapon', name: '프러포즈 반지 상자', rar: 4, atk: 52, crit: 0.07, icon: 'ringbox', tier: 7, bossOnly: 1, ch: 4, w: { reach: 110, arc: 0, mul: 1.1, rate: 2.2, kb: 50, style: 'throw' }, desc: '지렁이 통 옆에서 나온 그 반지 상자. 반짝이를 날린다' },
    dress2:   { slot: 'armor', name: '본식 2부 드레스', rar: 4, def: 30, hp: 300, color: '#f4a6c8', icon: 'dress', tier: 7, bossOnly: 1, ch: 4, desc: '「응 좋아」 말고 「예쁘다」를 들은 드레스' },
    pearlpin: { slot: 'hat', name: '진주 헤어핀', rar: 4, def: 16, mp: 110, crit: 0.06, color: '#f6efe6', icon: 'hat', tier: 7, bossOnly: 1, ch: 4, desc: '머리에 꽂으면 마음도 단정해진다' },
    heels:    { slot: 'shoes', name: '웨딩 하이힐', rar: 4, def: 10, spd: 0.3, color: '#fff6e0', icon: 'shoes', tier: 7, bossOnly: 1, ch: 4, desc: '버진로드 전용. 오빠 발 밟기에도 좋다' },
    envbag:   { slot: 'bag', name: '축의금 봉투 클러치', rar: 4, atk: 14, mp: 110, crit: 0.06, color: '#f0d8a8', icon: 'handbag', tier: 7, bossOnly: 1, ch: 4, desc: '봉투가 두툼할수록 기분이 좋아진다' },
    b_tux:    { slot: 'bcloth', bori: 1, name: '보리 링베어러 턱시도', rar: 4, bdmg: 0.8, color: '#2b2b34', pat: 'pad', icon: 'bpad', tier: 7, bossOnly: 1, ch: 4, desc: '반지 배달 담당. 나비넥타이가 포인트' },
    toy_ring: { slot: 'btoy', bori: 1, name: '반지 쿠션', rar: 4, bdmg: 0.9, icon: 'cushion', tier: 7, bossOnly: 1, ch: 4, desc: '보리가 버진로드에서 물고 온 쿠션. 반지는 무사함' },
  },
  book: { k: 'wed', name: '4장 웨딩 준비 장비', txt: '공격·방어 +6%', mul: 1.06 },
  // 착용 세트 (11/25): 7개를 모두 끼고 있어야 효과 — 도감 세트와 별개로 둘 다 붙음
  eqSets: [{ k: 'wed4', name: '웨딩 준비 세트', ids: ['ringbox', 'pearlpin', 'dress2', 'heels', 'envbag', 'b_tux', 'toy_ring'], txt: '공격·방어·최대 HP +15%', mul: { atk: 1.15, def: 1.15, hp: 1.15 } }],
  hair: { k: 'pearl', name: '웨딩 펄', H: '#c9b8a8', h: '#fff4ea', need: 'ch4', cond: '4장 클리어' },
  ach: [
    { id: 'c4s', t: '좋아무새 사육사', d: '4장 드레스 투어 통과', tier: 2, v: pd => pd.ch4 && (pd.ch4.cleared || pd.ch4.zone >= 14) ? 1 : 0, g: 1 },
    { id: 'c4', t: '새신부', d: '4장 클리어 (결혼식)', tier: 3, v: pd => (pd.ch4 && pd.ch4.cleared) || 0, g: 1 },
    { id: 'c4x5', t: '리마인드 웨딩', d: '4장 5번 클리어', tier: 4, v: pd => (pd.ch4 && pd.ch4.cleared) || 0, g: 5 },
  ],
  cut: { scenes: ['whall', 'wdress', 'wstudio', 'wselect', 'wwed'], draw: drawWedCut, actors: drawWedActors },
  story: { prologue: ['프롤로그 · 낚시터 프러포즈', CH4_PROLOGUE], stages: { 1: ['STAGE 14 · 드레스 투어', CH4_DRESS], 2: ['STAGE 15 · 웨딩 촬영', CH4_STUDIO], 3: ['FINAL · 사진 셀렉', CH4_SELECT] }, ending: ['엔딩 · 본식', CH4_ENDING] },
  end: { stats: lv => `결혼식 <b>1</b>번 · 「좋아」 <b>셀 수 없음</b><br>${lv}<br><br><b>신혼여행지는 희수 마음대로!</b><br><small>5장에서 계속…</small>`, again: '결혼은 한 번이지만 결혼 준비는 여러 번' }
});
