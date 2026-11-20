// ===================== MAIN =====================
let LAST = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - LAST) / 1000)); LAST = now;
  try {
    updateDialog(dt);
    if (INP.act.has('ok') && !$('#dlg').hidden) { INP.act.delete('ok'); dlgTap(); }
    INP.act.delete('ok');
    switch (G.state) {
      case 'title': G.time += dt; renderTitle(); INP.act.clear(); break;
      case 'e2menu': G.time += dt; e2RenderMenuBg(); INP.act.clear(); break;
      case 'ep2': G.time += dt; e2Frame(dt); break;
      case 'cut': G.time += dt; updateCut(dt); if (G.state === 'cut') renderCut(); else if (G.world) renderGame(); INP.act.clear(); break;
      case 'end': G.time += dt; renderCut(); INP.act.clear(); break;
      case 'play': update(dt); if (G.world) renderGame(); updateHUD(); break;
      case 'event': G.time += dt; updateEvent(dt); renderGame(); updateHUD(); INP.act.clear(); break;
      case 'dialog': G.time += dt; updateBubbles(dt); renderGame(); updateHUD(); INP.act.clear(); break;
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
cloudBoot();
dailyBoot();
guideBoot();
shareBoot();
raidBoot();

if (FORCE_EASY) { document.documentElement.classList.add('big'); const t = document.querySelector('.ttl'); if (t) t.innerHTML = '<small>희수와 보리 외전 · 원터치</small><h1><em>보리</em><br><span>주세요</span></h1>'; }

if (!FORCE_EASY && location.hash === '#ranking') setTimeout(() => { try { rankOpen('link'); } catch (e) { } }, 400);
