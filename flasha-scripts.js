// flasha-scripts.js
// ============================================================
// 🎴 Flasha Design Signature System — Scripts v4.1
// ============================================================

'use strict';

(() => {

  /* ══════════════════════════════════════════════════════════
     § 0  CONFIG
     ══════════════════════════════════════════════════════════ */
  const CFG = {
    introId:          'fl-intro',
    fabBtnId:         'fl-fab-btn',
    fabMenuId:        'fl-fab-menu',
    menuOpenClass:    'fl-menu--open',
    introOutClass:    'fl-intro--out',
    introReturnClass: 'fl-intro--return',
    sessionKey:       'fl_visited_v4',
    soundKey:         'fl_sound',
    introMinMs:       1500,
    introFadeMs:      650,
  };

  const LINKS = {
    youtube:   'https://youtube.com/@flasha_0?si=Am46gTJ9Hk3lyHEV',
    instagram: 'https://www.instagram.com/flasha_0/',
    discord:   'https://discord.com/users/1484153478421942335',
    whatsapp:  'https://api.whatsapp.com/send/?phone=201019953525',
    telegram:  'https://t.me/Flasha_0',
    github:    'https://github.com/Flasha-0',
  };

  /* ══════════════════════════════════════════════════════════
     § 0.1  DOM HELPERS
     ══════════════════════════════════════════════════════════ */
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const onTransitionEnd = (el, cb, fallbackMs = 900) => {
    let done = false;
    const finish = () => { if (done) return; done = true; cb(); };
    el.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, fallbackMs);
  };

  /* ══════════════════════════════════════════════════════════
     § 1  SOUND PREFERENCE MANAGER
     ══════════════════════════════════════════════════════════ */
  const SoundPref = (() => {
    // Respect prefers-reduced-motion as default mute
    const motionReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let _enabled = (() => {
      try {
        const stored = localStorage.getItem(CFG.soundKey);
        if (stored !== null) return stored === '1';
      } catch (_) {}
      return !motionReduced;
    })();

    const isEnabled = () => _enabled;

    const set = (val) => {
      _enabled = Boolean(val);
      try { localStorage.setItem(CFG.soundKey, _enabled ? '1' : '0'); } catch (_) {}
    };

    return { isEnabled, set };
  })();

  /* ══════════════════════════════════════════════════════════
     § 2  WEB AUDIO SYNTHESIZER
     ══════════════════════════════════════════════════════════ */
  const FlashaAudio = (() => {
    let _ctx    = null;
    let _master = null;
    let _ready  = false;

    const ctx = () => {
      if (!_ctx) {
        try {
          _ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (_) { return null; }
      }
      if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
      return _ctx;
    };

    const master = () => {
      const c = ctx();
      if (!c) return null;
      if (!_master || _master.context !== c) {
        _master = c.createGain();
        _master.gain.value = 0.16;
        _master.connect(c.destination);
      }
      return _master;
    };

    const adsr = (g, c, opts = {}) => {
      const {
        peak = 1, attack = .004, decay = .08, sustain = .20, release = .18,
      } = opts;
      const now = c.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(peak,           now + attack);
      g.gain.linearRampToValueAtTime(peak * sustain, now + attack + decay);
      g.gain.setValueAtTime(peak * sustain,          now + attack + decay);
      g.gain.linearRampToValueAtTime(0,              now + attack + decay + release);
    };

    const guard = (fn) => (...args) => {
      if (!SoundPref.isEnabled()) return;
      fn(...args);
    };

    /* ── Soft tick (hover) ── */
    const _tick = () => {
      const c = ctx(), m = master();
      if (!c || !m) return;
      const osc = c.createOscillator();
      const env = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1240;
      osc.connect(env); env.connect(m);
      adsr(env, c, { peak: 1, attack: .003, decay: .035, sustain: 0, release: .055 });
      osc.start(c.currentTime);
      osc.stop(c.currentTime + .10);
    };

    /* ── Satisfying pop (FAB toggle) ── */
    const _pop = () => {
      const c = ctx(), m = master();
      if (!c || !m) return;
      [
        { freq: 540, type: 'sine',     peakMult: 1.0 },
        { freq: 270, type: 'triangle', peakMult: 0.55 },
      ].forEach(({ freq, type, peakMult }) => {
        const osc = c.createOscillator();
        const env = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * .52, c.currentTime + .20);
        osc.connect(env); env.connect(m);
        adsr(env, c, { peak: peakMult, attack: .005, decay: .10, sustain: .12, release: .24 });
        osc.start(c.currentTime);
        osc.stop(c.currentTime + .40);
      });
    };

    /* ── Rising whoosh (intro exit) ── */
    const _whoosh = () => {
      const c = ctx(), m = master();
      if (!c || !m) return;
      const car = c.createOscillator();
      const env = c.createGain();
      car.type = 'sine';
      car.frequency.setValueAtTime(160, c.currentTime);
      car.frequency.exponentialRampToValueAtTime(960, c.currentTime + .60);
      car.connect(env); env.connect(m);
      adsr(env, c, { peak: 1, attack: .018, decay: .22, sustain: .38, release: .42 });
      const mod     = c.createOscillator();
      const modGain = c.createGain();
      mod.frequency.value = 9;
      modGain.gain.value  = 22;
      mod.connect(modGain); modGain.connect(car.frequency);
      car.start(c.currentTime); car.stop(c.currentTime + .85);
      mod.start(c.currentTime); mod.stop(c.currentTime + .85);
    };

    /* ── Warm click (first-visit intro) ── */
    const _introClick = () => {
      const c = ctx(), m = master();
      if (!c || !m) return;
      const bufLen = Math.floor(c.sampleRate * .045);
      const buf    = c.createBuffer(1, bufLen, c.sampleRate);
      const data   = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
      }
      const src = c.createBufferSource();
      src.buffer = buf;
      const bpf = c.createBiquadFilter();
      bpf.type            = 'bandpass';
      bpf.frequency.value = 640;
      bpf.Q.value         = 1.1;
      const env = c.createGain();
      adsr(env, c, { peak: 1, attack: .002, decay: .022, sustain: 0, release: .038 });
      src.connect(bpf); bpf.connect(env); env.connect(m);
      src.start(c.currentTime);
    };

    const unlock = () => {
      if (_ready) return;
      _ready = true;
      ctx();
    };

    return {
      tick:       guard(_tick),
      pop:        guard(_pop),
      whoosh:     guard(_whoosh),
      introClick: guard(_introClick),
      unlock,
    };
  })();

  /* ══════════════════════════════════════════════════════════
     § 3  INTRO / LOADING SCREEN
     ══════════════════════════════════════════════════════════ */
  const initIntro = () => {
    const intro = qs(`#${CFG.introId}`);
    if (!intro) return;

    const isReturn = sessionStorage.getItem(CFG.sessionKey) === '1';
    if (isReturn) intro.classList.add(CFG.introReturnClass);

    const startMs = performance.now();
    const barEl   = intro.querySelector('[role="progressbar"]');

    /* ── Real-time progress driven by rAF ── */
    let rafId;
    const tick = () => {
      const elapsed  = performance.now() - startMs;
      const progress = Math.min(elapsed / CFG.introMinMs, 1);

      // Drive CSS custom property → bar fill + dot move via CSS
      intro.style.setProperty('--fl-progress', progress.toFixed(4));
      barEl?.setAttribute('aria-valuenow', Math.round(progress * 100));

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);

    const dismiss = () => {
      const elapsed   = performance.now() - startMs;
      const remaining = Math.max(0, CFG.introMinMs - elapsed);

      setTimeout(() => {
        cancelAnimationFrame(rafId);
        intro.style.setProperty('--fl-progress', '1');
        barEl?.setAttribute('aria-valuenow', 100);

        if (isReturn) {
          FlashaAudio.whoosh();
        } else {
          FlashaAudio.introClick();
          setTimeout(FlashaAudio.whoosh, 130);
        }

        try { sessionStorage.setItem(CFG.sessionKey, '1'); } catch (_) {}

        intro.classList.add(CFG.introOutClass);
        onTransitionEnd(intro, () => {
          if (intro.isConnected) intro.remove();
        }, CFG.introFadeMs + 250);

      }, remaining);
    };

    if (document.readyState === 'complete') {
      dismiss();
    } else {
      window.addEventListener('load', dismiss, { once: true });
    }
  };

  /* ══════════════════════════════════════════════════════════
     § 4  FAB + MENU
     ══════════════════════════════════════════════════════════ */
  const initFab = () => {
    const btn  = qs(`#${CFG.fabBtnId}`);
    const menu = qs(`#${CFG.fabMenuId}`);
    if (!btn || !menu) return;

    let isOpen = false;

    const focusable = () =>
      qsa('a[href]:not([tabindex="-1"]), button:not([disabled])', menu);

    /* ── Open ── */
    const open = () => {
      isOpen = true;
      FlashaAudio.pop();
      menu.classList.add(CFG.menuOpenClass);
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close Flasha social links');
      menu.setAttribute('aria-hidden', 'false');
      const items = focusable();
      if (items.length) setTimeout(() => items[0].focus(), 100);
    };

    /* ── Close ── */
    const close = (returnFocus = true) => {
      isOpen = false;
      FlashaAudio.pop();
      menu.classList.remove(CFG.menuOpenClass);
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open Flasha social links');
      menu.setAttribute('aria-hidden', 'true');
      if (returnFocus) btn.focus();
    };

    const toggle = () => (isOpen ? close() : open());

    /* ── FAB click ── */
    btn.addEventListener('click', () => {
      FlashaAudio.unlock();
      toggle();
    });

    /* ── FAB hover tick (throttled) ── */
    let fabHoverReady = true;
    btn.addEventListener('mouseenter', () => {
      if (!fabHoverReady) return;
      fabHoverReady = false;
      FlashaAudio.tick();
      setTimeout(() => { fabHoverReady = true; }, 380);
    });

    /* ── Outside click ── */
    document.addEventListener('pointerdown', (e) => {
      if (!isOpen) return;
      const root = qs('#fl-fab-root');
      if (root && !root.contains(e.target)) close(false);
    });

    /* ── Escape key ── */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });

    /* ── focusout trap: close if focus leaves root ── */
    qs('#fl-fab-root')?.addEventListener('focusout', (e) => {
      if (!isOpen) return;
      const root = qs('#fl-fab-root');
      // relatedTarget = element receiving focus
      if (root && !root.contains(e.relatedTarget)) {
        // small delay so click handlers fire first
        setTimeout(() => { if (isOpen) close(false); }, 80);
      }
    });

    /* ── Tab trap ── */
    menu.addEventListener('keydown', (e) => {
      if (!isOpen) return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last  = items[items.length - 1];

      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const idx  = items.indexOf(document.activeElement);
        const step = e.key === 'ArrowDown' ? 1 : -1;
        items[(idx + step + items.length) % items.length].focus();
      }
    });

    /* ── Link hover sounds + auto-close ── */
    qsa('.fl-link', menu).forEach((link) => {
      let hoverReady = true;
      link.addEventListener('mouseenter', () => {
        if (!hoverReady) return;
        hoverReady = false;
        FlashaAudio.tick();
        setTimeout(() => { hoverReady = true; }, 330);
      });
      link.addEventListener('click', () => {
        setTimeout(() => close(false), 220);
      });
    });

    /* ── Footer link hover sound ── */
    const footerLink = qs('.fl-footer-link');
    if (footerLink) {
      let ready = true;
      footerLink.addEventListener('mouseenter', () => {
        if (!ready) return;
        ready = false;
        FlashaAudio.tick();
        setTimeout(() => { ready = true; }, 380);
      });
    }

    /* ── Haptic feedback on mobile ── */
    btn.addEventListener('click', () => {
      if ('vibrate' in navigator) {
        try { navigator.vibrate(8); } catch (_) {}
      }
    });

    /* ── Global audio unlock ── */
    document.addEventListener('pointerdown', FlashaAudio.unlock, { once: true });
    document.addEventListener('keydown',     FlashaAudio.unlock, { once: true });
  };

  /* ══════════════════════════════════════════════════════════
     § 5  CONSOLE EASTER EGG
     ══════════════════════════════════════════════════════════ */
  const initConsole = () => {

    const BASE = [
      'background:#05050f',
      'font-family:"SF Mono","Fira Code",monospace',
      'display:block',
    ].join(';');

    const S = {
      banner: [
        'background:linear-gradient(135deg,#a855f7 0%,#ec4899 55%,#06b6d4 100%)',
        'color:#fff',
        'font-size:16px',
        'font-weight:900',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        'letter-spacing:.24em',
        'text-transform:uppercase',
        'padding:18px 40px',
        'border-radius:14px 14px 0 0',
        'text-shadow:0 2px 14px rgba(0,0,0,.40)',
        'display:block',
      ].join(';'),
      sub:     `${BASE};color:rgba(240,238,255,.38);font-size:9px;letter-spacing:.30em;padding:6px 40px`,
      ascii:   `${BASE};color:#a855f7;font-size:9px;line-height:1.55;padding:12px 40px 8px`,
      rule:    `${BASE};color:rgba(168,85,247,.35);font-size:10px;padding:4px 40px`,
      greet:   `${BASE};color:rgba(240,238,255,.72);font-size:11.5px;padding:5px 40px 3px`,
      accent:  `${BASE};color:#a855f7;font-weight:700;font-size:11.5px;padding:3px 40px`,
      gold:    `${BASE};color:#c8aa6e;font-size:10.5px;font-style:italic;font-family:Georgia,serif;letter-spacing:.09em;padding:7px 40px 10px`,
      secHead: `${BASE};color:rgba(240,238,255,.26);font-size:8px;letter-spacing:.32em;text-transform:uppercase;padding:12px 40px 5px`,
      lbl:     `${BASE};color:rgba(240,238,255,.52);font-size:10.5px;padding:3px 40px 3px 50px`,
      mkLink:  (col) => `${BASE};color:${col};font-size:10.5px;text-decoration:underline;padding:2px 40px 6px 50px;text-shadow:0 0 12px ${col}88`,
      foot:    `${BASE};color:rgba(240,238,255,.16);font-size:9px;letter-spacing:.16em;padding:12px 40px 18px;border-radius:0 0 14px 14px`,
    };

    const ascii = [
      ' _____ _           _',
      '|  ___| | __ _ ___| |__   __ _',
      "| |_  | |/ _` / __| '_ \\ / _` |",
      '|  _| | | (_| \\__ \\ | | | (_| |',
      '|_|   |_|\\__,_|___/_| |_|\\__,_|',
    ].join('\n');

    const HR = '─'.repeat(46);

    /* eslint-disable no-console */
    console.log('%c🎴  F L A S H A',                        S.banner);
    console.log('%cDesign Signature System  ·  v4.1.0',     S.sub);
    console.log(`%c${ascii}`,                               S.ascii);
    console.log(`%c${HR}`,                                  S.rule);
    console.log('%c 👋  Hey, developer — welcome.',          S.greet);
    console.log('%c    You found the source code.',           S.greet);
    console.log('%c    Built with precision & purpose.',      S.accent);
    console.log('%c "A Bespoke Creation of Flasha"',          S.gold);
    console.log(`%c${HR}`,                                  S.rule);
    console.log('%c ◈  SOCIAL CHANNELS',                     S.secHead);
    console.log('%c ▶  YouTube',    S.lbl);
    console.log(`%c    ${LINKS.youtube}`,                    S.mkLink('#ff4444'));
    console.log('%c 📷  Instagram',  S.lbl);
    console.log(`%c    ${LINKS.instagram}`,                  S.mkLink('#e1306c'));
    console.log('%c 💬  Discord',    S.lbl);
    console.log(`%c    ${LINKS.discord}`,                    S.mkLink('#5865f2'));
    console.log('%c 📱  WhatsApp',   S.lbl);
    console.log(`%c    ${LINKS.whatsapp}`,                   S.mkLink('#22c55e'));
    console.log('%c ✈  Telegram',   S.lbl);
    console.log(`%c    ${LINKS.telegram}`,                   S.mkLink('#2aabee'));
    console.log('%c 💻  GitHub',     S.lbl);
    console.log(`%c    ${LINKS.github}`,                     S.mkLink('#c9d1d9'));
    console.log(`%c${HR}`,                                  S.rule);
    console.log('%c  © 2025 Flasha 🎴 · All rights reserved.', S.foot);
    /* eslint-enable no-console */
  };

  /* ══════════════════════════════════════════════════════════
     § 6  BOOT
     ══════════════════════════════════════════════════════════ */
  const boot = () => {
    initIntro();
    initFab();
    initConsole();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ── Expose SoundPref publicly for host page integration ── */
  window.FlashaSoundPref = SoundPref;

})();
