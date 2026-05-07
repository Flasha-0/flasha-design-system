// flasha-scripts.js
// ============================================================
// 🎴 Flasha Design Signature System — Engine v5.0
// Feature: Organic Synth Audio, Real-time RAF Loader, Sync PWA
// ============================================================

'use strict';

(() => {
  const CFG = {
    introId: 'fl-intro',
    fabBtnId: 'fl-fab-btn',
    fabMenuId: 'fl-fab-menu',
    themeToggleId: 'fl-theme-toggle',
    toastId: 'fl-update-toast',
    menuOpenClass: 'fl-menu--open',
    toastOpenClass: 'fl-toast--open',
    introOutClass: 'fl-intro--out',
    sessionKey: 'fl_visited_v5',
    soundKey: 'fl_sound_v5',
    themeKey: 'fl_theme_v5',
    introMinMs: 1600
  };

  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ════════════════════════════════════════════════════════════
     § 1  PREMIUM AUDIO SYNTHESIZER (Velvet Frequency Tuning)
     ════════════════════════════════════════════════════════════ */
  const FlashaAudio = (() => {
    let _ctx = null, _master = null, _unlocked = false;

    const getCtx = () => {
      if (!_ctx) {
        try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) { return null; }
      }
      if (_ctx && _ctx.state === 'suspended') _ctx.resume().catch(() => {});
      return _ctx;
    };

    const getMaster = () => {
      const c = getCtx(); if (!c) return null;
      if (!_master || _master.context !== c) {
        _master = c.createGain();
        _master.gain.value = 0.12; // Luxury low attenuation
        _master.connect(c.destination);
      }
      return _master;
    };

    const adsr = (gainNode, audioCtx, peak, attack, decay, sustain, release) => {
      const now = audioCtx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(peak, now + attack);
      gainNode.gain.linearRampToValueAtTime(peak * sustain, now + attack + decay);
      gainNode.gain.setValueAtTime(peak * sustain, now + attack + decay);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay + release);
    };

    const playNode = (freq, type, peak, a, d, s, r, sweepFreq = null, sweepTime = 0) => {
      try {
        const c = getCtx(), m = getMaster(); if (!c || !m) return;
        if (localStorage.getItem(CFG.soundKey) === '0') return;

        const osc = c.createOscillator();
        const env = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, c.currentTime);
        if (sweepFreq && sweepTime > 0) {
          osc.frequency.exponentialRampToValueAtTime(sweepFreq, c.currentTime + sweepTime);
        }
        osc.connect(env); env.connect(m);
        adsr(env, c, peak, a, d, s, r);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + a + d + r);
      } catch (_) {}
    };

    return {
      tick: () => playNode(880, 'sine', 0.6, 0.002, 0.03, 0.0, 0.04), // Elegant mechanical watch tick
      popOpen: () => {
        playNode(320, 'sine', 0.8, 0.006, 0.08, 0.1, 0.2, 160, 0.2);
        setTimeout(() => playNode(480, 'sine', 0.5, 0.004, 0.06, 0.0, 0.1), 40);
      },
      popClose: () => {
        playNode(440, 'sine', 0.7, 0.005, 0.06, 0.1, 0.15, 220, 0.15);
      },
      whoosh: () => {
        // Luxury dimensional sweep
        playNode(110, 'triangle', 0.9, 0.02, 0.2, 0.3, 0.5, 440, 0.4);
      },
      unlock: () => { if (!_unlocked) { getCtx(); _unlocked = true; } }
    };
  })();

  /* ════════════════════════════════════════════════════════════
     § 2  THEME CORE ENGINE (Adaptive Framework)
     ════════════════════════════════════════════════════════════ */
  const FlashaTheme = (() => {
    const root = document.documentElement;
    
    const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    
    const apply = (theme) => {
      root.setAttribute('data-fl-theme', theme);
      localStorage.setItem(CFG.themeKey, theme);
      updateToggleIcon(theme);
    };

    const updateToggleIcon = (theme) => {
      const icon = qs(`#${CFG.themeToggleId} svg`); if (!icon) return;
      // Dark Icon Shape vs Light Icon Shape
      if (theme === 'light') {
        icon.innerHTML = `<path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0 1.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zm3.89-11.39a.75.75 0 0 1 1.06 0l1.5 1.5a.75.75 0 1 1-1.06 1.06l-1.5-1.5a.75.75 0 0 1 0-1.06zm-9.28 9.28a.75.75 0 0 1 1.06 0l1.5 1.5a.75.75 0 1 1-1.06 1.06l-1.5-1.5a.75.75 0 0 1 0-1.06zM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0zm0 13.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75zM1.5 8a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H2.25A.75.75 0 0 1 1.5 8zm12 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75z"/>`;
      } else {
        icon.innerHTML = `<path d="M17.293 13.293A8 8 0 0 1 6.707 2.707a8.001 8.001 0 1 0 10.586 10.586z"/>`;
      }
    };

    const init = () => {
      const cached = localStorage.getItem(CFG.themeKey) || getSystemTheme();
      apply(cached);
      
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        if (!localStorage.getItem(CFG.themeKey)) {
          apply(e.matches ? 'light' : 'dark');
        }
      });
    };

    const toggle = () => {
      const current = root.getAttribute('data-fl-theme') || getSystemTheme();
      apply(current === 'light' ? 'dark' : 'light');
    };

    return { init, toggle };
  })();

  /* ════════════════════════════════════════════════════════════
     § 3  LOADING ARCHITECTURE (High Performance rAF Matrix)
     ════════════════════════════════════════════════════════════ */
  const initIntro = () => {
    const intro = qs(`#${CFG.introId}`); if (!intro) return;
    const barFill = qs('.fl-intro-bar-fill', intro);
    const startMs = performance.now();

    const frame = (now) => {
      const elapsed = now - startMs;
      const progress = Math.min(elapsed / CFG.introMinMs, 1);
      
      document.documentElement.style.setProperty('--fl-progress', progress.toFixed(4));
      
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        complete();
      }
    };

    const complete = () => {
      FlashaAudio.whoosh();
      intro.classList.add(CFG.introOutClass);
      intro.addEventListener('transitionend', () => { if(intro.isConnected) intro.remove(); }, { once: true });
    };

    requestAnimationFrame(frame);
  };

  /* ════════════════════════════════════════════════════════════
     § 4  WIDGET NAVIGATION CONTROL INTERACTION
     ════════════════════════════════════════════════════════════ */
  const initFab = () => {
    const btn = qs(`#${CFG.fabBtnId}`);
    const menu = qs(`#${CFG.fabMenuId}`);
    const toggle = qs(`#${CFG.themeToggleId}`);
    if (!btn || !menu) return;

    let isOpen = false;

    const openMenu = () => {
      isOpen = true; FlashaAudio.popOpen();
      menu.classList.add(CFG.menuOpenClass);
      btn.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      const links = qsa('.fl-link', menu);
      if (links.length) setTimeout(() => links[0].focus(), 120);
    };

    const closeMenu = (returnFocus = true) => {
      isOpen = false; FlashaAudio.popClose();
      menu.classList.remove(CFG.menuOpenClass);
      btn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      if (returnFocus) btn.focus();
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation(); FlashaAudio.unlock();
      isOpen ? closeMenu() : openMenu();
    });

    if (toggle) toggle.addEventListener('click', () => { FlashaAudio.tick(); FlashaTheme.toggle(); });

    document.addEventListener('pointerdown', (e) => {
      if (isOpen && !qs('#fl-fab-root').contains(e.target)) closeMenu(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    qsa('.fl-link', menu).forEach(link => {
      link.addEventListener('mouseenter', () => FlashaAudio.tick());
    });
  };

  /* ════════════════════════════════════════════════════════════
     § 5  PWA INTELLIGENT ROUTING CONTROLLER
     ════════════════════════════════════════════════════════════ */
  const initPWA = () => {
    let deferredPrompt = null;
    const item = qs('#fl-pwa-install-item');
    const btn = qs('#fl-pwa-install-btn');
    const toast = qs(`#${CFG.toastId}`);
    const toastBtn = qs('#fl-update-btn', toast);
    const toastClose = qs('#fl-toast-close', toast);

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
          reg.addEventListener('updatefound', () => {
            const worker = reg.installing;
            worker?.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                if (toast) toast.classList.add(CFG.toastOpenClass);
              }
            });
          });
        });
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); deferredPrompt = e;
      if (item) item.style.display = 'block';
    });

    if (btn) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault(); if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') { if (item) item.style.display = 'none'; }
        deferredPrompt = null;
      });
    }

    if (toastBtn) toastBtn.addEventListener('click', () => window.location.reload());
    if (toastClose) {
      toastClose.addEventListener('click', () => toast.classList.remove(CFG.toastOpenClass));
    }
  };

  // Boot orchestration
  FlashaTheme.init();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initIntro(); initFab(); initPWA(); });
  } else {
    initIntro(); initFab(); initPWA();
  }
})();
