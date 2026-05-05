/**
 * Login Screen - PIN Authentication
 * DEO Legal Case Management PWA
 */
(function () {
  'use strict';

  const LoginScreen = {};

  LoginScreen.render = async function (container) {
    if (!container) container = document.getElementById('app-content');
    if (!container) return;

    // Show loading while we check setup status
    container.innerHTML = '<div class="login-screen"><div class="login-header"><h1 class="login-title">DEO Muzaffarabad</h1><p class="login-subtitle-urdu">\u0636\u0644\u0639\u06CC \u062F\u0641\u062A\u0631 \u062A\u0639\u0644\u06CC\u0645 \u0645\u0638\u0641\u0631\u0622\u0628\u0627\u062F</p></div><div class="login-content"><p style="text-align:center;color:#888;margin-top:40px;">Loading...</p></div></div>';
    injectStyles();

    let setupRequired = true;

    // Check if PINs are already set up
    try {
      if (window.Auth && typeof window.Auth.isSetupRequired === 'function') {
        setupRequired = await window.Auth.isSetupRequired();
      } else {
        // Fallback: check IndexedDB directly
        if (window.DB && typeof window.DB.getSetting === 'function') {
          const pinConfig = await window.DB.getSetting('pinConfig');
          setupRequired = !(pinConfig && pinConfig.adminPinHash && pinConfig.viewerPinHash);
        }
      }
    } catch (e) {
      console.warn('LoginScreen: setup check failed, defaulting to setup mode', e);
      // Additional fallback: check localStorage for any hint
      const session = localStorage.getItem('deo_session');
      if (session) {
        setupRequired = false;
      }
    }

    if (setupRequired) {
      renderSetupMode(container);
    } else {
      renderLoginMode(container);
    }
  };

  // ========== SETUP MODE ==========
  function renderSetupMode(container) {
    container.innerHTML = '\
      <div class="login-screen">\
        <div class="login-header">\
          <h1 class="login-title">DEO Muzaffarabad</h1>\
          <p class="login-subtitle-urdu">\u0636\u0644\u0639\u06CC \u062F\u0641\u062A\u0631 \u062A\u0639\u0644\u06CC\u0645 \u0645\u0638\u0641\u0631\u0622\u0628\u0627\u062F</p>\
          <p class="login-subtitle-en">Legal Case Management System</p>\
          <p class="login-subtitle-urdu">\u0642\u0627\u0646\u0648\u0646\u06CC \u0645\u0642\u062F\u0645\u0627\u062A \u06A9\u0627 \u0646\u0638\u0627\u0645</p>\
        </div>\
        <div class="login-content">\
          <p class="setup-instruction">Set up your PINs to get started</p>\
          <div class="setup-form">\
            <div class="setup-field">\
              <label for="admin-pin">Admin PIN - 6 digits (for Clerk)</label>\
              <input type="password" id="admin-pin" maxlength="6" inputmode="numeric" pattern="[0-9]*" placeholder="••••••">\
            </div>\
            <div class="setup-field">\
              <label for="confirm-admin-pin">Confirm Admin PIN</label>\
              <input type="password" id="confirm-admin-pin" maxlength="6" inputmode="numeric" pattern="[0-9]*" placeholder="••••••">\
            </div>\
            <div class="setup-field">\
              <label for="viewer-pin">Viewer PIN - 6 digits (for DEO)</label>\
              <input type="password" id="viewer-pin" maxlength="6" inputmode="numeric" pattern="[0-9]*" placeholder="••••••">\
            </div>\
            <div class="setup-field">\
              <label for="confirm-viewer-pin">Confirm Viewer PIN</label>\
              <input type="password" id="confirm-viewer-pin" maxlength="6" inputmode="numeric" pattern="[0-9]*" placeholder="••••••">\
            </div>\
            <div class="setup-error" id="setup-error"></div>\
            <button class="setup-btn" id="setup-btn">Setup</button>\
          </div>\
        </div>\
      </div>';

    document.getElementById('setup-btn').addEventListener('click', handleSetup);
  }

  async function handleSetup() {
    const adminPin = document.getElementById('admin-pin').value.trim();
    const confirmAdmin = document.getElementById('confirm-admin-pin').value.trim();
    const viewerPin = document.getElementById('viewer-pin').value.trim();
    const confirmViewer = document.getElementById('confirm-viewer-pin').value.trim();
    const errorEl = document.getElementById('setup-error');

    // Validation
    if (!/^\d{6}$/.test(adminPin)) {
      errorEl.textContent = 'Admin PIN must be exactly 6 digits';
      return;
    }
    if (!/^\d{6}$/.test(viewerPin)) {
      errorEl.textContent = 'Viewer PIN must be exactly 6 digits';
      return;
    }
    if (adminPin !== confirmAdmin) {
      errorEl.textContent = 'Admin PIN confirmation does not match';
      return;
    }
    if (viewerPin !== confirmViewer) {
      errorEl.textContent = 'Viewer PIN confirmation does not match';
      return;
    }
    if (adminPin === viewerPin) {
      errorEl.textContent = 'Admin and Viewer PINs must be different';
      return;
    }

    errorEl.textContent = '';

    // Disable button during save
    var btn = document.getElementById('setup-btn');
    btn.disabled = true;
    btn.textContent = 'Setting up...';

    try {
      if (window.Auth && typeof window.Auth.setupPin === 'function') {
        await window.Auth.setupPin(adminPin, viewerPin);
      }

      // Also store a flag in localStorage as backup for iOS Safari
      localStorage.setItem('deo_pins_configured', 'true');

      showToast('PINs set successfully!');

      // Auto-login as admin after setup
      if (window.Auth && typeof window.Auth.verifyPin === 'function') {
        var loginSuccess = await window.Auth.verifyPin(adminPin, 'admin');
        if (loginSuccess) {
          setTimeout(function () {
            window.location.hash = '#/dashboard';
          }, 500);
          return;
        }
      }

      // Fallback: just show login screen
      var container = document.getElementById('app-content');
      renderLoginMode(container);
    } catch (e) {
      console.error('Setup failed:', e);
      errorEl.textContent = 'Setup failed. Please try again.';
      btn.disabled = false;
      btn.textContent = 'Setup';
    }
  }

  // ========== LOGIN MODE ==========
  function renderLoginMode(container) {
    var currentRole = 'admin';
    var pin = '';

    container.innerHTML = '\
      <div class="login-screen">\
        <div class="login-header">\
          <h1 class="login-title">DEO Muzaffarabad</h1>\
          <p class="login-subtitle-urdu">\u0636\u0644\u0639\u06CC \u062F\u0641\u062A\u0631 \u062A\u0639\u0644\u06CC\u0645 \u0645\u0638\u0641\u0631\u0622\u0628\u0627\u062F</p>\
          <p class="login-subtitle-en">Legal Case Management System</p>\
          <p class="login-subtitle-urdu">\u0642\u0627\u0646\u0648\u0646\u06CC \u0645\u0642\u062F\u0645\u0627\u062A \u06A9\u0627 \u0646\u0638\u0627\u0645</p>\
        </div>\
        <div class="login-content">\
          <div class="role-toggle">\
            <button class="role-btn active" id="role-admin" data-role="admin">Admin</button>\
            <button class="role-btn" id="role-viewer" data-role="viewer">Viewer</button>\
          </div>\
          <div class="pin-dots" id="pin-dots">\
            <span class="dot"></span>\
            <span class="dot"></span>\
            <span class="dot"></span>\
            <span class="dot"></span>\
            <span class="dot"></span>\
            <span class="dot"></span>\
          </div>\
          <div class="pin-error" id="pin-error"></div>\
          <div class="numpad" id="numpad">\
            <button class="numpad-btn" data-key="1">1</button>\
            <button class="numpad-btn" data-key="2">2</button>\
            <button class="numpad-btn" data-key="3">3</button>\
            <button class="numpad-btn" data-key="4">4</button>\
            <button class="numpad-btn" data-key="5">5</button>\
            <button class="numpad-btn" data-key="6">6</button>\
            <button class="numpad-btn" data-key="7">7</button>\
            <button class="numpad-btn" data-key="8">8</button>\
            <button class="numpad-btn" data-key="9">9</button>\
            <button class="numpad-btn numpad-empty"></button>\
            <button class="numpad-btn" data-key="0">0</button>\
            <button class="numpad-btn numpad-back" data-key="back">\u232B</button>\
          </div>\
        </div>\
      </div>';

    var dots = document.querySelectorAll('#pin-dots .dot');
    var errorEl = document.getElementById('pin-error');

    function updateDots() {
      dots.forEach(function (dot, i) {
        if (i < pin.length) {
          dot.classList.add('filled');
        } else {
          dot.classList.remove('filled');
        }
      });
    }

    function shakeAnimation() {
      var dotsContainer = document.getElementById('pin-dots');
      dotsContainer.classList.add('shake');
      setTimeout(function () {
        dotsContainer.classList.remove('shake');
      }, 500);
    }

    async function attemptLogin() {
      var success = false;
      try {
        if (window.Auth && typeof window.Auth.verifyPin === 'function') {
          success = await window.Auth.verifyPin(pin, currentRole);
        }
      } catch (e) {
        console.error('Login error:', e);
        success = false;
      }

      if (success) {
        showToast('Login successful');
        setTimeout(function () {
          window.location.hash = '#/dashboard';
        }, 300);
      } else {
        shakeAnimation();
        errorEl.textContent = 'Invalid PIN | \u063A\u0644\u0637 \u067E\u0646';
        pin = '';
        setTimeout(function () {
          updateDots();
          errorEl.textContent = '';
        }, 1500);
      }
    }

    // Numpad clicks
    document.getElementById('numpad').addEventListener('click', function (e) {
      var btn = e.target.closest('.numpad-btn');
      if (!btn) return;
      var key = btn.getAttribute('data-key');
      if (!key) return;

      if (key === 'back') {
        pin = pin.slice(0, -1);
        updateDots();
      } else {
        if (pin.length < 6) {
          pin += key;
          updateDots();
          if (pin.length === 6) {
            setTimeout(attemptLogin, 200);
          }
        }
      }
    });

    // Role toggle
    document.getElementById('role-admin').addEventListener('click', function () {
      currentRole = 'admin';
      this.classList.add('active');
      document.getElementById('role-viewer').classList.remove('active');
      pin = '';
      updateDots();
      errorEl.textContent = '';
    });

    document.getElementById('role-viewer').addEventListener('click', function () {
      currentRole = 'viewer';
      this.classList.add('active');
      document.getElementById('role-admin').classList.remove('active');
      pin = '';
      updateDots();
      errorEl.textContent = '';
    });
  }

  // ========== TOAST ==========
  function showToast(message) {
    var toast = document.getElementById('login-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'login-toast';
      toast.className = 'login-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(function () {
      toast.classList.remove('show');
    }, 2500);
  }

  // ========== STYLES ==========
  var stylesInjected = false;
  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;

    var style = document.createElement('style');
    style.textContent = '\
      .login-screen { min-height: 100vh; display: flex; flex-direction: column; background: #f5f5f5; }\
      .login-header { background: #1B3A6B; color: #fff; text-align: center; padding: 32px 16px 24px; }\
      .login-title { font-size: 28px; font-weight: 700; margin: 0 0 4px; font-family: Nunito, sans-serif; }\
      .login-subtitle-urdu { font-size: 18px; margin: 4px 0; direction: rtl; opacity: 0.9; font-family: "Noto Nastaliq Urdu", serif; }\
      .login-subtitle-en { font-size: 16px; margin: 4px 0; opacity: 0.85; font-family: Nunito, sans-serif; }\
      .login-content { flex: 1; background: #fff; padding: 24px 16px; display: flex; flex-direction: column; align-items: center; }\
      .setup-instruction { font-size: 16px; color: #555; margin-bottom: 20px; text-align: center; }\
      .setup-form { width: 100%; max-width: 320px; }\
      .setup-field { margin-bottom: 16px; }\
      .setup-field label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 6px; }\
      .setup-field input { width: 100%; padding: 12px; font-size: 18px; border: 2px solid #ddd; border-radius: 8px; text-align: center; letter-spacing: 8px; box-sizing: border-box; }\
      .setup-field input:focus { border-color: #1B3A6B; outline: none; }\
      .setup-error { color: #d32f2f; font-size: 13px; text-align: center; margin-bottom: 12px; min-height: 18px; }\
      .setup-btn { width: 100%; padding: 14px; font-size: 18px; font-weight: 600; background: #1B3A6B; color: #fff; border: none; border-radius: 8px; cursor: pointer; }\
      .setup-btn:active { background: #152d54; }\
      .setup-btn:disabled { background: #999; cursor: not-allowed; }\
      .role-toggle { display: flex; gap: 0; margin-bottom: 24px; border-radius: 8px; overflow: hidden; border: 2px solid #1B3A6B; }\
      .role-btn { flex: 1; padding: 10px 24px; font-size: 15px; font-weight: 600; border: none; background: #fff; color: #1B3A6B; cursor: pointer; transition: background 0.2s, color 0.2s; }\
      .role-btn.active { background: #1B3A6B; color: #fff; }\
      .pin-dots { display: flex; gap: 12px; margin-bottom: 16px; transition: transform 0.1s; }\
      .pin-dots .dot { width: 14px; height: 14px; border-radius: 50%; background: #ddd; border: 2px solid #bbb; transition: background 0.15s, border-color 0.15s; }\
      .pin-dots .dot.filled { background: #C8962E; border-color: #C8962E; }\
      .pin-dots.shake { animation: shakeAnim 0.5s; }\
      @keyframes shakeAnim { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }\
      .pin-error { color: #d32f2f; font-size: 13px; min-height: 18px; margin-bottom: 12px; text-align: center; }\
      .numpad { display: grid; grid-template-columns: repeat(3, 64px); gap: 12px; justify-content: center; }\
      .numpad-btn { width: 64px; height: 64px; border-radius: 50%; border: none; background: #f8f8f8; font-size: 24px; font-weight: 600; color: #1B3A6B; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; transition: box-shadow 0.1s, transform 0.1s; user-select: none; -webkit-tap-highlight-color: transparent; }\
      .numpad-btn:active { box-shadow: 0 1px 2px rgba(0,0,0,0.15); transform: scale(0.95); background: #e8e8e8; }\
      .numpad-empty { visibility: hidden; }\
      .numpad-back { font-size: 28px; }\
      .login-toast { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%) translateY(80px); background: #333; color: #fff; padding: 12px 24px; border-radius: 8px; font-size: 14px; opacity: 0; transition: opacity 0.3s, transform 0.3s; z-index: 9999; pointer-events: none; }\
      .login-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }';
    document.head.appendChild(style);
  }

  window.LoginScreen = LoginScreen;
})();
