// ===================== 내 희수 카드 공유 =====================
// 1080×1350 카드 이미지(꾸민 희수·보리, 레벨, 전투력 순위, PvP, 도감, 강화) → 공유(모바일 공유 시트) / 저장 / 링크 복사
// 공유 링크: ?from=닉네임 → 받은 사람은 "○○님이 초대했어요" + 랭킹 열림



import { $, fmtNumText } from '../sys/dom.js';
import { mkCanvas } from '../draw/sprite.js';
import { BOOK_ALL } from '../core/data.js';
import { G } from '../core/state.js';
import { loadGame } from '../core/save.js';
import { calcStats } from '../core/items.js';
import { toast } from '../ui/dialog.js';
import { PV, SB, pvpLoadMe, pvpSnap, sbInit } from '../net/pvp.js';
import { fighterURL, rankOpen } from '../net/rank.js';
import { ACH_BY, ACH_COL } from './achv.js';
import { tt } from '../sys/i18n.js';

const SHARE_URL = 'https://byeongjaeyu.github.io/heesoo_bori/';
const SHARE = { blob: /** @type {Blob|null} */ (null), url: '' };

/** 카드에 들어갈 정보 (세이브 + 서버 순위) */
async function shareInfo() {
  const keep = G.pd, pd = keep || loadGame(); if (!pd) return null;
  G.pd = pd; let snap, power; try { ({ snap, power } = pvpSnap()); } finally { if (keep !== pd) { G.pd = keep; if (keep) calcStats(); } }
  const info = { pd, snap, power, nick: '', rank: 0, total: 0, rating: 0 };
  try {
    await sbInit(); const me = PV.me || await pvpLoadMe();
    if (me) {
      info.nick = me.nickname; info.rating = me.rating; info.power = me.power;
      const above = await SB.from('hb_fighters').select('user_id', { count: 'exact', head: true }).eq('played', true).gt('power', me.power);
      const all = await SB.from('hb_fighters').select('user_id', { count: 'exact', head: true }).eq('played', true);
      info.rank = (above.count || 0) + 1; info.total = all.count || 0;
    }
  } catch (e) { }
  return info;
}
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

async function shareCardMake(info) {
  const W = 1080, H = 1350, c = mkCanvas(W, H), g = c.getContext('2d'), ink = '#2b1b24', F = (s, b) => `${b ? 'bold ' : ''}${s}px HB, sans-serif`;
  try { await document.fonts.load(F(40, true)); } catch (e) { }
  // 배경: 하늘 → 분홍, 아래 벽돌 바닥
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#bfe6ff'); bg.addColorStop(0.62, '#ffe6f2'); bg.addColorStop(1, '#ffd6e8'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#c98a6a'; g.fillRect(0, 980, W, H - 980); g.fillStyle = '#b5775a'; for (let y = 980; y < H; y += 40) for (let x = (y / 40) % 2 ? 0 : 40; x < W; x += 80) g.fillRect(x, y, 76, 36);
  g.fillStyle = '#7ccf5a'; g.fillRect(0, 960, W, 24); g.fillStyle = '#3f8a34'; g.fillRect(0, 980, W, 8);
  // 구름
  g.fillStyle = '#ffffff'; for (const [x, y, s] of [[130, 150, 1], [860, 110, 1.3], [700, 300, .8]]) { g.fillRect(x, y, 120 * s, 28 * s); g.fillRect(x + 24 * s, y - 22 * s, 70 * s, 26 * s); }
  // 제목
  g.textAlign = 'center'; g.fillStyle = ink; g.font = F(34); g.fillText('DOT ADVENTURE SERIES', W / 2, 90);
  g.font = F(76, true); g.lineWidth = 14; g.strokeStyle = '#ffffff'; g.strokeText(tt('features/share.1'), W / 2, 180); g.fillStyle = '#ff5fa2'; g.fillText(tt('features/share.1'), W / 2, 180);
  // 캐릭터 (꾸민 모습)
  const s = info.snap, img = await loadImg(fighterURL({ vis: s.vis, eq: s.eq, hair: s.hair, bori: s.bori, beq: s.beq }, 18));
  g.imageSmoothingEnabled = false; const cw = Math.min(img.width, 820), ch = img.height * cw / img.width; g.drawImage(img, (W - cw) / 2, 960 - ch, cw, ch);
  // 이름표
  const nick = info.nick || tt('features/share.2'), lv = `Lv.${info.pd.lv}${info.pd.aw ? ' ★' + info.pd.aw : ''}${info.pd.cleared ? ' · ' + (info.pd.cleared + 1) + tt('features/share.3') : ''}`;
  const ta = info.pd.title && (info.pd.ach || {})[info.pd.title] ? ACH_BY[info.pd.title] : null;
  rr(g, 200, ta ? 214 : 250, W - 400, ta ? 186 : 150, 28); g.fillStyle = 'rgba(255,255,255,.92)'; g.fill(); g.lineWidth = 8; g.strokeStyle = ink; g.stroke();
  if (ta) { g.font = F(32, true); const tw = g.measureText(ta.t).width + 44; rr(g, (W - tw) / 2, 232, tw, 48, 16); g.fillStyle = ACH_COL[ta.tier]; g.fill(); g.lineWidth = 4; g.strokeStyle = ink; g.stroke(); g.fillStyle = ink; g.fillText(ta.t, W / 2, 268); }
  g.fillStyle = ink; g.font = F(ta ? 58 : 64, true); g.fillText(nick, W / 2, ta ? 340 : 330); g.font = F(ta ? 32 : 36); g.fillStyle = '#7a5cff'; g.fillText(lv, W / 2, ta ? 384 : 382);
  // 기록 카드 4개
  const maxEnh = Math.max(0, ...Object.values(info.pd.enh || {}).map(Number));
  const cards = [
    [tt('features/share.4'), Number(info.power || 0).toLocaleString(), info.rank ? tt('features/share.5', { rank: info.rank, total: info.total }) : tt('features/share.6')],
    [tt('features/share.7'), info.rank ? Number(info.rating).toLocaleString() + tt('features/share.8') : '-', tt('features/share.9')],
    [tt('features/share.10'), `${s.book || 0} / ${BOOK_ALL.length}`, tt('features/share.11')],
    [tt('features/share.12'), maxEnh ? '+' + maxEnh : '-', tt('features/share.13')]
  ];
  cards.forEach(([t, v, sub], i) => {
    const x = 60 + (i % 2) * 490, y = 1020 + Math.floor(i / 2) * 150;
    rr(g, x, y, 470, 130, 22); g.fillStyle = 'rgba(255,255,255,.95)'; g.fill(); g.lineWidth = 6; g.strokeStyle = ink; g.stroke();
    g.textAlign = 'left'; g.fillStyle = '#888'; g.font = F(28); g.fillText(t, x + 28, y + 44);
    g.fillStyle = i === 0 ? '#ff5fa2' : ink; g.font = F(52, true); g.fillText(fmtNumText(v), x + 28, y + 104);
    g.textAlign = 'right'; g.fillStyle = '#7a5cff'; g.font = F(24); g.fillText(sub, x + 446, y + 44); g.textAlign = 'center';
  });
  // 하단 링크
  g.fillStyle = ink; g.fillRect(0, H - 60, W, 60); g.fillStyle = '#ffd84a'; g.font = F(30, true); g.fillText(tt('features/share.14'), W / 2, H - 20);
  return c;
}

export async function shareOpen() {
  if (FORCE_EASY) return;
  const box = $('#share'); $('#shareImg').removeAttribute('src'); $('#shareMsg').textContent = tt('features/share.15'); box.hidden = false;
  try {
    const info = await shareInfo(); if (!info) { $('#shareMsg').textContent = tt('features/share.16'); return; }
    const c = await shareCardMake(info);
    SHARE.blob = await new Promise(r => c.toBlob(b => r(b), 'image/png'));
    SHARE.url = SHARE_URL + (info.nick ? '?from=' + encodeURIComponent(info.nick) : '');
    $('#shareImg').src = c.toDataURL('image/png');
    const canShare = !!(navigator.canShare && SHARE.blob && navigator.canShare({ files: [new File([SHARE.blob], 'heesu.png', { type: 'image/png' })] }));
    $('#shareGo').hidden = !canShare; $('#shareMsg').textContent = canShare ? tt('features/share.17') : tt('features/share.18');
  } catch (e) { $('#shareMsg').textContent = tt('features/share.19'); }
}
async function shareGo() {
  if (!SHARE.blob) return;
  try { await navigator.share({ files: [new File([SHARE.blob], 'heesu.png', { type: 'image/png' })], title: tt('features/share.1'), text: tt('features/share.20', { url: SHARE.url }) }); }
  catch (e) { if (!(e && e.name === 'AbortError')) toast(tt('features/share.21'), 'warn'); }
}
function shareSave() {
  const src = $('#shareImg').getAttribute('src'); if (!src) return;
  const a = document.createElement('a'); a.href = src; a.download = 'heesu_card.png'; document.body.appendChild(a); a.click(); a.remove();
}
async function shareCopy() {
  try { await navigator.clipboard.writeText(SHARE.url || SHARE_URL); toast(tt('features/share.22'), 'lvl'); } catch (e) { prompt(tt('features/share.23'), SHARE.url || SHARE_URL); }
}
/** 공유 링크로 들어온 경우: ?from=닉네임 */
export function shareBoot() {
  if (FORCE_EASY) return;
  $('#shareGo').onclick = shareGo; $('#shareSave').onclick = shareSave; $('#shareCopy').onclick = shareCopy; $('#shareX').onclick = () => { $('#share').hidden = true; };
  const from = new URLSearchParams(location.search).get('from');
  if (from) {
    history.replaceState(null, '', location.pathname + location.hash);
    setTimeout(() => { toast(tt('features/share.24', { v1: from.slice(0, 10) }), 'lvl'); if (G.state === 'title' && $('#pvpNick').hidden) { try { rankOpen('link'); } catch (e) { } } }, 700);
  }
}
