// ===================== MAIN =====================



import { $, numFmtBoot, resize } from './sys/dom.js';
import { SND } from './sys/audio.js';
import { INP, setupTouch } from './sys/input.js';
import { G } from './core/state.js';
import { saveGame } from './core/save.js';
import { updateEvent } from './play/zone.js';
import { update, updateBubbles, updateCam, updateFx } from './play/fx.js';
import { renderGame } from './draw/render.js';
import { dlgAuto, dlgTap, updateDialog } from './ui/dialog.js';
import { updateHUD } from './ui/hud.js';
import { closeMenu, openMenu } from './ui/menu.js';
import { setupUI, showTitle } from './ui/lobby.js';
import { entryRegister, rankOpen } from './net/rank.js';
import { cloudBoot } from './net/cloud.js';
import { accBoot } from './net/account.js';
import { aucBoot } from './net/auction.js';
import { dailyBoot } from './features/daily.js';
import { guideBoot } from './features/guide.js';
import { shareBoot } from './features/share.js';
import { raidBoot } from './net/raid.js';
import { buddyBoot } from './net/buddy.js';
import { achvBoot } from './features/achv.js';
import { idleBoot } from './features/idle.js';
import { packBoot } from './features/pack.js';
import { goalBoot } from './features/goal.js';
import { towerBoot } from './play/tower.js';
import { plazaBoot } from './net/plaza.js';
import { renderCut, renderTitle, updateCut } from './story/story.js';
import { e2Frame, e2RenderMenuBg } from './minigame/ep2core.js';
import { tt } from './sys/i18n.js';

let LAST = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - LAST) / 1000)); LAST = now;
  try {
    updateDialog(dt);
    if (INP.act.has('ok') && !$('#dlg').hidden) { INP.act.delete('ok'); dlgTap(); }
    INP.act.delete('ok');
    switch (G.state) {
      case 'title': G.time += dt; renderTitle(); INP.act.clear(); break;
      case 'lobbyMenu': G.time += dt; renderTitle(); if (INP.act.has('esc') || INP.act.has('menu')) closeMenu(); INP.act.clear(); break;
      case 'e2menu': G.time += dt; e2RenderMenuBg(); INP.act.clear(); break;
      case 'ep2': G.time += dt; e2Frame(dt); break;
      case 'cut': G.time += dt; updateCut(dt); if (G.state === 'cut') renderCut(); else if (G.world) renderGame(); INP.act.clear(); break;
      case 'end': G.time += dt; renderCut(); INP.act.clear(); break;
      case 'play': update(dt); if (G.world) renderGame(); updateHUD(); break;
      case 'event': G.time += dt; dlgAuto(dt); updateEvent(dt); renderGame(); updateHUD(); INP.act.clear(); break;
      case 'dialog': G.time += dt; dlgAuto(dt); updateBubbles(dt); renderGame(); updateHUD(); INP.act.clear(); break;
      case 'menu': G.time += dt; renderGame(); updateHUD(); if (INP.act.has('esc') || INP.act.has('menu')) closeMenu(); INP.act.clear(); break;
      case 'dead': G.time += dt; updateFx(dt); updateCam(dt); renderGame(); updateHUD(); INP.act.clear(); break;
      default: G.time += dt; if (G.world) renderGame(); INP.act.clear(); break;
    }
  } catch (e) { console.error(e); }
  requestAnimationFrame(frame);
}
function init() {
  resize(); window.addEventListener('resize', resize);
  try { SND.on = localStorage.getItem('hb_sound') !== '0'; } catch (e) { }
  setupTouch(); setupUI();
  document.addEventListener('visibilitychange', () => { if (document.hidden) { saveGame(); if (G.state === 'play') openMenu(); if (SND.ac) SND.ac.suspend().catch(() => { }); } else if (SND.ac) SND.ac.resume().catch(() => { }); });
  if (document.fonts && document.fonts.load) { document.fonts.load('bold 16px HB').catch(() => { }); document.fonts.load('16px HB').catch(() => { }); }
  showTitle(); entryRegister();
  requestAnimationFrame(frame);
}
init();
cloudBoot(); accBoot(); aucBoot(); numFmtBoot();
dailyBoot();
guideBoot();
shareBoot();
raidBoot();
buddyBoot();
achvBoot();
idleBoot();
packBoot();
goalBoot();
towerBoot();
plazaBoot();

if (FORCE_EASY) { document.documentElement.classList.add('big'); const t = document.querySelector('.ttl'); if (t) t.innerHTML = tt('main.1'); }

if (!FORCE_EASY && location.hash === '#ranking') setTimeout(() => { try { rankOpen('link'); } catch (e) { } }, 400);
