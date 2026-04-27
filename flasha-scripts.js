// flasha-scripts.js
// ============================================================
// 🎴 Flasha Design Signature System — Scripts v3.0
// ============================================================

'use strict';

/* ════════════════════════════════════════════════════════════
   § 0  MODULE WRAPPER
   ════════════════════════════════════════════════════════════ */
(() => {

  /* ──────────────────────────────────────────────────────────
     § 0.1  CONFIG
     ────────────────────────────────────────────────────────── */
  const CFG = {
    introId:          'fl-intro',
    fabBtnId:         'fl-fab-btn',
    fabMenuId:        'fl-fab-menu',
    menuOpenClass:    'fl-menu--open',
    introOutClass:    'fl-intro--out',
    introReturnClass: 'fl-intro--return',
    sessionKey:       'fl_visited',
    introMinMs:       1300,
    introFadeMs:      700,
  };

  const LINKS = {
    youtube:   'https://youtube.com/@flasha_0?si=Am46gTJ9Hk3lyHEV',
    instagram: 'https://www.instagram.com/flasha_0/',
    discord:   'https://discord.com/users/1484153478421942335',
    whatsapp:  'https://api.whatsapp.com/send/?phone=201019953525&text&type=phone_number&app_absent=0',
    telegram:  'https://t.me/Flasha_0',
    github:    'https://github.com/Flasha-0',
  };

  /* ──────────────────────────────────────────────────────────
     § 0.2  TINY DOM HELPERS
     ────────────────────────────────────────────────────────── */
  const qs    = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa   = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const onEnd = (el, evt, cb, ms = 800) => {
    let fired = false;
    const done = () => { if (fired) return; fired = true; cb(); };
    el.addEventListener(evt, done, { once: true });
    setTimeout(done, ms);
  };

  /* ════════════════════════════════════════════════════════════
     § 1  WEB AUDIO SYNTHESIZER
     ════════════════════════════════════════════════════════════ */
  const Audio = (() => {
    let ctx = null;
    let unlocked = false;

    /** Lazy-init AudioContext on first user gesture */
    const getCtx = () => {
      if (!ctx) {
        try {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (_) { return null; }
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    };

    /**
     * Master gain node cached per context
     */
    const getMaster = () => {
      const c = getCtx();
      if (!c) return null;
      if (!getMaster._node || getMaster._node.context !== c) {
        const g = c.createGain();
        g.gain.value = 0.18;          // master attenuation — subtle
        g.connect(c.destination);
        getMaster._node = g;
      }
      return getMaster._node;
    };

    /**
     * Internal: envelope helper
     * @param {GainNode} g
     * @param {AudioContext} c
     * @param {number} peak
     * @param {number} attack  seconds
     * @param {number} decay   seconds
     * @param {number} sustain 0-1
     * @param {number} release seconds
     */
    const adsr = (g, c, { peak = 1, attack = .004, decay = .08, sustain = .25, release = .18 } = {}) => {
      const now = c.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(peak, now + attack);
      g.gain.linearRampToValueAtTime(sustain * peak, now + attack + decay);
      g.gain.setValueAtTime(sustain * peak, now + attack + decay);
      g.gain.linearRampToValueAtTime(0, now + attack + decay + release);
    };

    /**
     * Soft click / tick — for hover events
     * Frequency: ~1 200 Hz sine, extremely short
     */
    const tick = () => {
      const c = getCtx();
      const m = getMaster();
      if (!c || !m) return;

      const osc = c.createOscillator();
      const env = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1180;

      osc.connect(env);
      env.connect(m);

      adsr(env, c, { peak: 1, attack: .003, decay: .04, sustain: .0, release: .06 });

      const now = c.currentTime;
      osc.start(now);
      osc.stop(now + .12);
    };

    /**
     * Satisfying 'pop' — for FAB toggle
     * Two-oscillator blend: sine + triangle
     */
    const pop = () => {
      const c = getCtx();
      const m = getMaster();
      if (!c || !m) return;

      [
        { freq: 520, type: 'sine',     peakMult: 1.0 },
        { freq: 260, type: 'triangle', peakMult: 0.6 },
      ].forEach(({ freq, type, peakMult }) => {
        const osc = c.createOscillator();
        const env = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * .55, c.currentTime + .18);

        osc.connect(env);
        env.connect(m);

        adsr(env, c, { peak: peakMult, attack: .005, decay: .10, sustain: .15, release: .22 });

        osc.start(c.currentTime);
        osc.stop(c.currentTime + .38);
      });
    };

    /**
     * Ascending 'whoosh' — for intro dismissal
     * Frequency-swept sine with noise-like FM
     */
    const whoosh = () => {
      const c = getCtx();
      const m = getMaster();
      if (!c || !m) return;

      // Carrier: rising sine
      const car = c.createOscillator();
      const env = c.createGain();
      car.type = 'sine';
      car.frequency.setValueAtTime(180, c.currentTime);
      car.frequency.exponentialRampToValueAtTime(900, c.currentTime + .55);

      car.connect(env);
      env.connect(m);

      adsr(env, c, { peak: 1, attack: .015, decay: .20, sustain: .40, release: .38 });

      // Modulator: subtle FM shimmer
      const mod = c.createOscillator();
      const modGain = c.createGain();
      mod.frequency.value = 8;
      modGain.gain.value = 18;
      mod.connect(modGain);
      modGain.connect(car.frequency);

      const now = c.currentTime;
      car.start(now);
      car.stop(now + .75);
      mod.start(now);
      mod.stop(now + .75);
    };

    /**
     * Single refined 'click' for first-visit intro
     * Very brief, warm, band-limited click
     */
    const introClick = () => {
      const c = getCtx();
      const m = getMaster();
      if (!c || !m) return;

      // Buffer-based white noise burst (warmer than osc alone)
      const bufSize = c.sampleRate * .04;
      const buf = c.createBuffer(1, bufSize, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      }

      const src = c.createBufferSource();
      src.buffer = buf;

      // BPF to make it warmer (~600 Hz)
      const bpf = c.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 620;
      bpf.Q.value = 1.2;

      const env = c.createGain();
      adsr(env, c, { peak: 1, attack: .002, decay: .025, sustain: 0, release: .04 });

      src.connect(bpf);
      bpf.connect(env);
      env.connect(m);

      src.start(c.currentTime);
    };

    /** Unlock AudioContext on first pointer interaction */
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      getCtx();
    };

    return { tick, pop, whoosh, introClick, unlock };
  })();

  /* ════════════════════════════════════════════════════════════
     § 2  INTRO / LOADING SCREEN
     ════════════════════════════════════════════════════════════ */
  const initIntro = () => {
    const intro = qs(`#${CFG.introId}`);
    if (!intro) return;

    const isReturn = sessionStorage.getItem(CFG.sessionKey) === '1';
    if (isReturn) intro.classList.add(CFG.introReturnClass);

    const startMs = performance.now();

    const dismiss = () => {
      const elapsed   = performance.now() - startMs;
      const remaining = Math.max(0, CFG.introMinMs - elapsed);

      setTimeout(() => {
        // Play audio micro-interaction
        if (isReturn) {
          Audio.whoosh();
        } else {
          Audio.introClick();
          setTimeout(() => Audio.whoosh(), 120);
        }

        // Mark session
        try { sessionStorage.setItem(CFG.sessionKey, '1'); } catch (_) {}

        // Fade out
        intro.classList.add(CFG.introOutClass);
        onEnd(intro, 'transitionend', () => {
          if (intro.isConnected) intro.remove();
        }, CFG.introFadeMs + 200);

      }, remaining);
    };

    if (document.readyState === 'complete') {
      dismiss();
    } else {
      window.addEventListener('load', dismiss, { once: true });
    }
  };

  /* ════════════════════════════════════════════════════════════
     § 3  FAB + MENU
     ════════════════════════════════════════════════════════════ */
  const initFab = () => {
    const btn  = qs(`#${CFG.fabBtnId}`);
    const menu = qs(`#${CFG.fabMenuId}`);
    if (!btn || !menu) return;

    let isOpen = false;

    const focusable = () => qsa(
      'a[href], button:not([disabled])', menu
    );

    /* ── open / close ───────────────────────────────────────── */
    const open = () => {
      isOpen = true;
      Audio.pop();
      menu.classList.add(CFG.menuOpenClass);
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close Flasha social links');
      menu.setAttribute('aria-hidden', 'false');
      const items = focusable();
      if (items.length) setTimeout(() => items[0].focus(), 90);
    };

    const close = (returnFocus = true) => {
      isOpen = false;
      Audio.pop();
      menu.classList.remove(CFG.menuOpenClass);
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open Flasha social links');
      menu.setAttribute('aria-hidden', 'true');
      if (returnFocus) btn.focus();
    };

    const toggle = () => (isOpen ? close() : open());

    /* ── FAB interactions ───────────────────────────────────── */
    btn.addEventListener('click', () => { Audio.unlock(); toggle(); });

    // Hover tick on FAB
    let fabHoverDone = false;
    btn.addEventListener('mouseenter', () => {
      if (fabHoverDone) return;
      fabHoverDone = true;
      Audio.tick();
      setTimeout(() => { fabHoverDone = false; }, 350);
    });

    /* ── outside click ──────────────────────────────────────── */
    document.addEventListener('pointerdown', (e) => {
      if (!isOpen) return;
      const root = qs('#fl-fab-root');
      if (root && !root.contains(e.target)) close(false);
    });

    /* ── Escape key ─────────────────────────────────────────── */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });

    /* ── Tab trap ───────────────────────────────────────────── */
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

    /* ── link sounds & auto-close ───────────────────────────── */
    qsa('.fl-link', menu).forEach((link) => {
      let hoverReady = true;

      link.addEventListener('mouseenter', () => {
        if (!hoverReady) return;
        hoverReady = false;
        Audio.tick();
        setTimeout(() => { hoverReady = true; }, 320);
      });

      link.addEventListener('click', () => {
        setTimeout(() => close(false), 200);
      });
    });

    /* ── footer link hover ──────────────────────────────────── */
    const footerLink = qs('.fl-footer-link');
    if (footerLink) {
      let fhReady = true;
      footerLink.addEventListener('mouseenter', () => {
        if (!fhReady) return;
        fhReady = false;
        Audio.tick();
        setTimeout(() => { fhReady = true; }, 350);
      });
    }

    /* ── unlock audio on any early interaction ──────────────── */
    document.addEventListener('pointerdown', Audio.unlock, { once: true });
    document.addEventListener('keydown',     Audio.unlock, { once: true });
  };

  /* ════════════════════════════════════════════════════════════
     § 4  CONSOLE EASTER EGG
     ════════════════════════════════════════════════════════════ */
  const initConsole = () => {
    /* ── style palette ────────────────────────────────────────  */
    const S = {
      banner: [
        'background:linear-gradient(135deg,#a855f7 0%,#ec4899 55%,#06b6d4 100%)',
        'color:#fff',
        'font-size:15px',
        'font-weight:900',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
        'letter-spacing:.22em',
        'text-transform:uppercase',
        'padding:16px 36px',
        'border-radius:12px 12px 0 0',
        'text-shadow:0 2px 10px rgba(0,0,0,.35)',
        'display:block',
      ].join(';'),

      sub: [
        'background:#0c0c18',
        'color:rgba(240,238,255,.45)',
        'font-size:9.5px',
        'font-family:"SF Mono","Fira Code",monospace',
        'letter-spacing:.26em',
        'padding:5px 36px',
        'display:block',
      ].join(';'),

      ascii: [
        'background:#0c0c18',
        'color:#a855f7',
        'font-size:9.5px',
        'line-height:1.55',
        'font-family:"SF Mono","Fira Code",monospace',
        'padding:10px 36px 6px',
        'display:block',
      ].join(';'),

      rule: [
        'background:#0c0c18',
        'color:rgba(168,85,247,.42)',
        'font-size:10px',
        'font-family:"SF Mono","Fira Code",monospace',
        'padding:3px 36px',
        'display:block',
      ].join(';'),

      greet: [
        'background:#0c0c18',
        'color:rgba(240,238,255,.75)',
        'font-size:11.5px',
        'font-family:"SF Mono","Fira Code",monospace',
        'padding:5px 36px 3px',
        'display:block',
      ].join(';'),

      accent: [
        'background:#0c0c18',
        'color:#a855f7',
        'font-weight:700',
        'font-size:11.5px',
        'font-family:"SF Mono","Fira Code",monospace',
        'padding:3px 36px',
        'display:block',
      ].join(';'),

      gold: [
        'background:#0c0c18',
        'color:#c8aa6e',
        'font-size:10.5px',
        'font-style:italic',
        'font-family:Georgia,serif',
        'letter-spacing:.08em',
        'padding:6px 36px 8px',
        'display:block',
      ].join(';'),

      secHead: [
        'background:#0c0c18',
        'color:rgba(240,238,255,.28)',
        'font-size:8.5px',
        'font-family:"SF Mono","Fira Code",monospace',
        'letter-spacing:.28em',
        'text-transform:uppercase',
        'padding:10px 36px 4px',
        'display:block',
      ].join(';'),

      lbl: [
        'background:#0c0c18',
        'color:rgba(240,238,255,.55)',
        'font-size:10.5px',
        'font-family:"SF Mono","Fira Code",monospace',
        'padding:2px 36px 2px 44px',
        'display:block',
      ].join(';'),

      mkLink: (col) => [
        'background:#0c0c18',
        `color:${col}`,
        'font-size:10.5px',
        'font-family:"SF Mono","Fira Code",monospace',
        'text-decoration:underline',
        'padding:2px 36px 5px 44px',
        'display:block',
        `text-shadow:0 0 10px ${col}88`,
      ].join(';'),

      foot: [
        'background:#0c0c18',
        'color:rgba(240,238,255,.18)',
        'font-size:9px',
        'font-family:"SF Mono","Fira Code",monospace',
        'letter-spacing:.14em',
        'padding:10px 36px 16px',
        'border-radius:0 0 12px 12px',
        'display:block',
      ].join(';'),
    };

    const ascii = [
      ' _____ _           _',
      '|  ___| | __ _ ___| |__   __ _',
      "| |_  | |/ _` / __| '_ \\ / _` |",
      '|  _| | | (_| \\__ \\ | | | (_| |',
      '|_|   |_|\\__,_|___/_| |_|\\__,_|',
    ].join('\n');

    const HR = '─'.repeat(42);

    /* eslint-disable no-console */
    console.log('%c🎴  F L A S H A',               S.banner);
    console.log('%cDesign Signature System  ·  v3.0.0', S.sub);
    console.log(`%c${ascii}`,                       S.ascii);
    console.log(`%c${HR}`,                          S.rule);
    console.log('%c 👋  Hey, developer — welcome.',  S.greet);
    console.log('%c    You found the source code.',   S.greet);
    console.log('%c    Built with precision & care.', S.accent);
    console.log('%c "A Bespoke Creation of Flasha"',  S.gold);
    console.log(`%c${HR}`,                           S.rule);

    console.log('%c ◈  SOCIAL CHANNELS',             S.secHead);

    console.log('%c ▶  YouTube',    S.lbl);
    console.log(`%c    ${LINKS.youtube}`,   S.mkLink('#ff4444'));

    console.log('%c ◈  Instagram',  S.lbl);
    console.log(`%c    ${LINKS.instagram}`, S.mkLink('#e1306c'));

    console.log('%c ◈  Discord',    S.lbl);
    console.log(`%c    ${LINKS.discord}`,   S.mkLink('#5865f2'));

    console.log('%c ◈  WhatsApp',   S.lbl);
    console.log(`%c    ${LINKS.whatsapp}`,  S.mkLink('#22c55e'));

    console.log('%c ◈  Telegram',   S.lbl);
    console.log(`%c    ${LINKS.telegram}`,  S.mkLink('#2aabee'));

    console.log('%c ◈  GitHub',     S.lbl);
    console.log(`%c    ${LINKS.github}`,    S.mkLink('#c9d1d9'));

    console.log(`%c${HR}`,                           S.rule);
    console.log('%c  © Flasha 🎴 · All rights reserved.', S.foot);
    /* eslint-enable no-console */
  };

  /* ════════════════════════════════════════════════════════════
     § 5  BOOT
     ════════════════════════════════════════════════════════════ */
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

})();