/**
 * Login Screen - PIN Authentication
 * DEO Legal Case Management PWA
 */
(function () {
  'use strict';

  const LoginScreen = {};

  LoginScreen.render = function (params) {
    const container = document.getElementById('app-content');
    if (!container) return;

    let setupRequired = false;
    try {
      if (window.Auth && typeof window.Auth.isSetupRequired === 'function') {
        setupRequired = window.Auth.isSetupRequired();
      } else {
        // Fallback: check localStorage and DB
        const session = localStorage.getItem('deo_session');
        if (!session) {
          // Try DB
          if (window.DB && typeof window.DB.getSetting === 'function') {
            const pinConfig = window.DB.getSetting('pinConfig');
            setupRequired = !pinConfig;
          } else {
            setupRequired = true;
          }
        }
      }
    } catch (e) {
      // If Auth check fails, fallback
      const session = localStorage.getItem('deo_session');
      if (!session) {
        try {
          if (window.DB && typeof window.DB.getSetting === 'function') {
            const pinConfig = window.DB.getSetting('pinConfig');
            setupRequired = !pinConfig;
          } else {
            setupRequired = true;
          }
        } catch (ex) {
          setupRequired = true;
        }
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
    container.innerHTML = `
      <div class="login-screen">
        <div class="login-header">
          <h1 class="login-title">DEO Muzaffarabad</h1>
          <p class="login-subtitle-urdu">\u0636\u0644\u0639\u06CC \u062F\u0641\u0631 \u062A\u0639\u0644\u06CC\u0645 \u0645\u0638\u0641\u0631\u0622\u0628\u0627\u062F</p>
          <p class="login-subtitle-en">Legal Case Management System</p>
          <p class="login-subtitle-urdu">\u0642\u0627\u0646\u0648\u0646\u06CC \u0645\u0642\u062F\u0645\u0627\u062A \u06A9\u0627 \u0646\u0638\u0627\u0645</p>
        </div>
        <div class="login-content">
          <p class="setup-instruction">Set up your PINs to get started</p>
          <div class="setup-form">
            <div class="setup-field">
              <label for="admin-pin">Set Admin PIN (6 digits)</label>
              <input type="password" id="admin-pin" maxlength="6" inputmode="numeric" pattern="[0-9]*" placeholder="Admin PIN (for Clerk)">
            </div>
            <div class="setup-field">
              <label for="confirm-admin-pin">Confirm Admin PIN</label>
              <input type="password" id="confirm-admin-pin" maxlength="6" inputmode="numeric" pattern="[0-9]*" placeholder="Confirm Admin PIN">
            </div>
            <div class="setup-field">
              <label for="viewer-pin">Set Viewer PIN (6 digits)</label>
              <input type="password" id="viewer-pin" maxlength="6" inputmode="numeric" pattern="[0-9]*" placeholder="Viewer PIN (for DEO)">
            </div>
            <div class="setup-field">
              <label for="confirm-viewer-pin">Confirm Viewer PIN</label>
              <input type="password" id="confirm-viewer-pin" maxlength="6" inputmode="numeric" pattern="[0-9]*" placeholder="Confirm Viewer PIN">
            </div>
            <div class="setup-error" id="setup-error"></div>
            <button class="setup-btn" id="setup-btn">Setup</button>
          </div>
        </div>
      </div>
    `;

    injectStyles();

    document.getElementById('setup-btn').addEventListener('click', handleSetup);
  }

  function handleSetup() {
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

    try {
      if (window.Auth && typeof window.Auth.setupPin === 'function') {
        window.Auth.setupPin(adminPin, viewerPin);
      }
      showToast('PINs set successfully! | \u067E\u0646 \u06A9\u0627\u0645\u06CC\u0627\u0628\u06CC \u0633\u06CC \u0633\u06CC\u0679 \u06C1\u0648 \u06AF\u0626\u06CC\u06BA');
      // Re-render in login mode
      const container = document.getElementById('app-content');
      renderLoginMode(container);
    } catch (e) {
      errorEl.textContent = 'Setup failed. Please try again.';
    }
  }

  // ========== LOGIN MODE ==========
  function renderLoginMode(container) {
    let currentRole = 'admin';
    let pin = '';

    container.innerHTML = `
      <div class="login-screen">
        <div class="login-header">
          <h1 class="login-title">DEO Muzaffarabad</h1>
          <p class="login-subtitle-urdu">\u0636\u0644\u0639\u06CC \u062F\u0641\u0631 \u062A\u0639\u0644\u06CC\u0645 \u0645\u0638\u0641\u0631\u0622\u0628\u0627\u062F</p>
          <p class="login-subtitle-en">Legal Case Management System</p>
          <p class="login-subtitle-urdu">\u0642\u0627\u0646\u0648\u0646\u06CC \u0645\u0642\u062F\u0645\u0627\u062A \u06A9\u0627 \u0646\u0638\u0627\u0645</p>
        </div>
        <div class="login-content">
          <div class="role-toggle">
            <button class="role-btn active" id="role-admin" data-role="admin">Admin</button>
            <button class="role-btn" id="role-viewer" data-role="viewer">Viewer</button>
          </div>
          <div class="pin-dots" id="pin-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <div class="pin-error" id="pin-error"></div>
          <div class="numpad" id="numpad">
            <button class="numpad-btn" data-key="1">1</button>
            <button class="numpad-btn" data-key="2">2</button>
            <button class="numpad-btn" data-key="3">3</button>
            <button class="numpad-btn" data-key="4">4</button>
            <button class="numpad-btn" data-key="5">5</button>
            <button class="numpad-btn" data-key="6">6</button>
            <button class="numpad-btn" data-key="7">7</button>
            <button class="numpad-btn" data-key="8">8</button>
            <button class="numpad-btn" data-key="9">9</button>
            <button class="numpad-btn numpad-empty"></button>
            <button class="numpad-btn" data-key="0">0</button>
            <button class="numpad-btn numpad-back" data-key="back">\u232B</button>
          </div>
        </div>
      </div>
    `;

    injectStyles();

    const dots = document.querySelectorAll('#pin-dots .dot');
    const errorEl = document.getElementById('pin-error');

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
      const dotsContainer = document.getElementById('pin-dots');
      dotsContainer.classList.add('shake');
      setTimeout(function () {
        dotsContainer.classList.remove('shake');
      }, 500);
    }

    function attemptLogin() {
      let success = false;
      try {
        if (window.Auth && typeof window.Auth.verifyPin === 'function') {
          success = window.Auth.verifyPin(pin, currentRole);
        }
      } catch (e) {
        success = false;
      }

      if (success) {
        showToast('Login successful | \u06A9\u0627\u0645\u06CC\u0627\u0628 \u0644\u0627\u06AF \u0627\u0646');
        setTimeout(function () {
          if (window.App && typeof window.App.navigate === 'function') {
            window.App.navigate('#/dashboard');
          } else {
            window.location.hash = '#/dashboard';
          }
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
      const btn = e.target.closest('.numpad-btn');
      if (!btn) return;
      const key = btn.getAttribute('data-key');
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
    let toast = document.getElementById('login-toast');
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
  let stylesInjected = false;
  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;

    const style = document.createElement('style');
    style.textContent = `
      .login-screen {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f5f5f5;
      }
      .login-header {
        background: #1B3A6B;
        color: #fff;
        text-align: center;
        padding: 32px 16px 24px;
      }
      .login-title {
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 4px;
      }
      .login-subtitle-urdu {
        font-size: 18px;
        margin: 4px 0;
        direction: rtl;
        opacity: 0.9;
      }
      .login-subtitle-en {
        font-size: 16px;
        margin: 4px 0;
        opacity: 0.85;
      }
      .login-content {
        flex: 1;
        background: #fff;
        padding: 24px 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      /* Setup Mode */
      .setup-instruction {
        font-size: 16px;
        color: #555;
        margin-bottom: 20px;
        text-align: center;
      }
      .setup-form {
        width: 100%;
        max-width: 320px;
      }
      .setup-field {
        margin-bottom: 16px;
      }
      .setup-field label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #333;
        margin-bottom: 6px;
      }
      .setup-field input {
        width: 100%;
        padding: 12px;
        font-size: 18px;
        border: 2px solid #ddd;
        border-radius: 8px;
        text-align: center;
        letter-spacing: 8px;
        box-sizing: border-box;
      }
      .setup-field input:focus {
        border-color: #1B3A6B;
        outline: none;
      }
      .setup-error {
        color: #d32f2f;
        font-size: 13px;
        text-align: center;
        margin-bottom: 12px;
        min-height: 18px;
      }
      .setup-btn {
        width: 100%;
        padding: 14px;
        font-size: 18px;
        font-weight: 600;
        background: #1B3A6B;
        color: #fff;
        border: none;
        border-radius: 8px;
        cursor: pointer;
      }
      .setup-btn:active {
        background: #152d54;
      }

      /* Login Mode */
      .role-toggle {
        display: flex;
        gap: 0;
        margin-bottom: 24px;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid #1B3A6B;
      }
      .role-btn {
        flex: 1;
        padding: 10px 24px;
        font-size: 15px;
        font-weight: 600;
        border: none;
        background: #fff;
        color: #1B3A6B;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
      }
      .role-btn.active {
        background: #1B3A6B;
        color: #fff;
      }

      .pin-dots {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        transition: transform 0.1s;
      }
      .pin-dots .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #ddd;
        transition: background 0.15s;
      }
      .pin-dots .dot.filled {
        background: #C8962E;
      }
      .pin-dots.shake {
        animation: shakeAnim 0.5s;
      }
      @keyframes shakeAnim {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-6px); }
        80% { transform: translateX(6px); }
      }

      .pin-error {
        color: #d32f2f;
        font-size: 13px;
        min-height: 18px;
        margin-bottom: 12px;
        text-align: center;
      }

      .numpad {
        display: grid;
        grid-template-columns: repeat(3, 64px);
        gap: 12px;
        justify-content: center;
      }
      .numpad-btn {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        border: none;
        background: #fff;
        font-size: 24px;
        font-weight: 600;
        color: #1B3A6B;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: box-shadow 0.1s, transform 0.1s;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      .numpad-btn:active {
        box-shadow: 0 1px 2px rgba(0,0,0,0.15);
        transform: scale(0.95);
      }
      .numpad-empty {
        visibility: hidden;
      }
      .numpad-back {
        font-size: 28px;
      }

      /* Toast */
      .login-toast {
        position: fixed;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%) translateY(80px);
        background: #333;
        color: #fff;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.3s, transform 0.3s;
        z-index: 9999;
        pointer-events: none;
      }
      .login-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  window.LoginScreen = LoginScreen;
})();
