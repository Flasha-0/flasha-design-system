// pwa.js
// ============================================================
// 🎴 Flasha Design Signature System — PWA Manager v4.1
// ============================================================

'use strict';

(() => {

  /* ══════════════════════════════════════════════════════════
     § 1  SERVICE WORKER REGISTRATION
     ══════════════════════════════════════════════════════════ */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log(
            '%c🎴 Flasha SW registered',
            'color:#a855f7;font-weight:700'
          );

          /* new version available → show toast */
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker?.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                showUpdateToast();
              }
            });
          });
        })
        .catch((err) => {
          console.warn('🎴 SW registration failed:', err);
        });
    });
  }

  /* ══════════════════════════════════════════════════════════
     § 2  INSTALL PROMPT
     ══════════════════════════════════════════════════════════ */
  let _deferredPrompt = null;

  /* capture the prompt before the browser shows it */
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    showInstallBtn();
  });

  /* app was installed → clean up */
  window.addEventListener('appinstalled', () => {
    _deferredPrompt = null;
    hideInstallBtn();
    console.log(
      '%c🎴 App installed successfully!',
      'color:#a855f7;font-weight:700'
    );
  });

  /* ── Show / hide install button ── */
  const showInstallBtn = () => {
    const item = document.getElementById('fl-pwa-install-item');
    const btn  = document.getElementById('fl-pwa-install-btn');
    if (!item || !btn) return;

    item.style.display = '';

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!_deferredPrompt) return;

      _deferredPrompt.prompt();
      const { outcome } = await _deferredPrompt.userChoice;

      console.log(
        `%c🎴 Install outcome: ${outcome}`,
        'color:#a855f7'
      );

      _deferredPrompt = null;
      hideInstallBtn();
    }, { once: true });
  };

  const hideInstallBtn = () => {
    const item = document.getElementById('fl-pwa-install-item');
    if (item) item.style.display = 'none';
  };

  /* ══════════════════════════════════════════════════════════
     § 3  UPDATE TOAST
     ══════════════════════════════════════════════════════════ */
  const showUpdateToast = () => {
    if (document.getElementById('fl-update-toast')) return;

    const toast = document.createElement('div');
    toast.id = 'fl-update-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `
      <span class="fl-toast-msg">🎴 New version available</span>
      <button id="fl-update-btn" type="button" class="fl-toast-btn">
        Refresh
      </button>
      <button id="fl-toast-close" type="button"
              class="fl-toast-close" aria-label="Dismiss">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round">
          <line x1="12" y1="4" x2="4" y2="12"/>
          <line x1="4"  y1="4" x2="12" y2="12"/>
        </svg>
      </button>
    `;

    document.body.appendChild(toast);

    toast.querySelector('#fl-update-btn')
      .addEventListener('click', () => window.location.reload());

    toast.querySelector('#fl-toast-close')
      .addEventListener('click', () => {
        toast.classList.add('fl-toast--out');
        setTimeout(() => toast.remove(), 400);
      });

    /* auto-dismiss after 8 s */
    setTimeout(() => {
      if (toast.isConnected) {
        toast.classList.add('fl-toast--out');
        setTimeout(() => toast.remove(), 400);
      }
    }, 8000);
  };

})();