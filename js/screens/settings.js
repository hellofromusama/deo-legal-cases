window.SettingsScreen = {
  render(container) {
    const notifSettings = window.Notifications ? window.Notifications.getSettings() : {
      hearingReminders: true,
      replyDeadlineReminders: true,
      complianceDeadlineReminders: true,
      advanceDays: 3
    };

    const user = window.Auth ? window.Auth.getCurrentUser() : { role: 'admin' };
    const isAdmin = user && user.role === 'admin';
    const firebaseConnected = window.firebaseReady || false;

    container.innerHTML = `
      <div class="settings-screen">
        <h2 class="screen-title">Settings | ترتیبات</h2>

        <!-- Account Section -->
        <div class="settings-section">
          <h3 class="section-header">Account | اکاؤنٹ</h3>
          <div class="settings-card">
            <div class="setting-row">
              <span class="setting-label">Role</span>
              <span class="badge badge-role">${isAdmin ? 'Admin' : 'Viewer'}</span>
            </div>
            ${isAdmin ? `
            <div class="setting-row">
              <button class="btn btn-outline" id="change-pin-btn">Change PIN | پن تبدیل کریں</button>
            </div>
            <div id="pin-form" class="pin-form" style="display:none;">
              <input type="password" id="new-pin-input" class="form-input" placeholder="Enter new PIN" maxlength="6" inputmode="numeric">
              <button class="btn btn-primary" id="save-pin-btn">Save</button>
              <button class="btn btn-outline" id="cancel-pin-btn">Cancel</button>
              <p id="pin-msg" class="pin-msg"></p>
            </div>` : ''}
            <div class="setting-row">
              <button class="btn btn-danger" id="logout-btn">Logout | لاگ آؤٹ</button>
            </div>
          </div>
        </div>

        <!-- Data Management Section -->
        <div class="settings-section">
          <h3 class="section-header">Data Management | ڈیٹا مینجمنٹ</h3>
          <div class="settings-card">
            <div class="setting-row">
              <div>
                <button class="btn btn-primary" id="sync-btn">Sync Now</button>
                <p class="setting-hint" id="last-sync-time">Last synced: ${getLastSyncTime()}</p>
              </div>
              <span id="sync-status" class="sync-status">${getSyncStatus()}</span>
            </div>
            <div class="setting-row">
              <button class="btn btn-outline" id="export-btn">Export All Data | تمام ڈیٹا ایکسپورٹ</button>
            </div>
          </div>
        </div>

        <!-- Notifications Section -->
        <div class="settings-section">
          <h3 class="section-header">Notifications | اطلاعات</h3>
          <div class="settings-card">
            <div class="setting-row">
              <span class="setting-label">Hearing Reminders</span>
              <label class="toggle-switch">
                <input type="checkbox" id="toggle-hearing" ${notifSettings.hearingReminders ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-row">
              <span class="setting-label">Reply Deadline Reminders</span>
              <label class="toggle-switch">
                <input type="checkbox" id="toggle-reply" ${notifSettings.replyDeadlineReminders ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-row">
              <span class="setting-label">Compliance Deadline Reminders</span>
              <label class="toggle-switch">
                <input type="checkbox" id="toggle-compliance" ${notifSettings.complianceDeadlineReminders ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="setting-row">
              <span class="setting-label">Reminder Advance</span>
              <div class="advance-days-selector">
                <button class="day-chip ${notifSettings.advanceDays === 1 ? 'active' : ''}" data-days="1">1 day</button>
                <button class="day-chip ${notifSettings.advanceDays === 3 ? 'active' : ''}" data-days="3">3 days</button>
                <button class="day-chip ${notifSettings.advanceDays === 7 ? 'active' : ''}" data-days="7">7 days</button>
              </div>
            </div>
          </div>
        </div>

        <!-- About Section -->
        <div class="settings-section">
          <h3 class="section-header">About</h3>
          <div class="settings-card">
            <div class="about-info">
              <p class="about-app-name">DEO Muzaffarabad — Legal Case Management</p>
              <p class="about-version">Version 1.0.0</p>
              <p class="about-org">District Education Office, Muzaffarabad, AJK</p>
              <div class="about-status">
                <span class="status-dot ${firebaseConnected ? 'status-green' : 'status-red'}"></span>
                <span>Firebase: ${firebaseConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // --- Event Handlers ---

    // Logout
    container.querySelector('#logout-btn').addEventListener('click', () => {
      if (window.Auth) window.Auth.logout();
      window.location.hash = '/login';
    });

    // Change PIN
    if (isAdmin) {
      const changePinBtn = container.querySelector('#change-pin-btn');
      const pinForm = container.querySelector('#pin-form');
      const savePinBtn = container.querySelector('#save-pin-btn');
      const cancelPinBtn = container.querySelector('#cancel-pin-btn');
      const pinInput = container.querySelector('#new-pin-input');
      const pinMsg = container.querySelector('#pin-msg');

      changePinBtn.addEventListener('click', () => {
        pinForm.style.display = 'flex';
        changePinBtn.style.display = 'none';
        pinInput.focus();
      });

      cancelPinBtn.addEventListener('click', () => {
        pinForm.style.display = 'none';
        changePinBtn.style.display = 'inline-block';
        pinInput.value = '';
        pinMsg.textContent = '';
      });

      savePinBtn.addEventListener('click', () => {
        const newPin = pinInput.value.trim();
        if (!newPin || newPin.length < 4) {
          pinMsg.textContent = 'PIN must be at least 4 digits';
          pinMsg.className = 'pin-msg error';
          return;
        }
        if (window.Auth && window.Auth.changePin) {
          window.Auth.changePin(newPin);
        }
        pinMsg.textContent = 'PIN updated successfully!';
        pinMsg.className = 'pin-msg success';
        pinInput.value = '';
        setTimeout(() => {
          pinForm.style.display = 'none';
          changePinBtn.style.display = 'inline-block';
          pinMsg.textContent = '';
        }, 2000);
      });
    }

    // Sync
    container.querySelector('#sync-btn').addEventListener('click', async () => {
      const syncBtn = container.querySelector('#sync-btn');
      const syncStatus = container.querySelector('#sync-status');
      const lastSyncEl = container.querySelector('#last-sync-time');

      syncBtn.disabled = true;
      syncBtn.textContent = 'Syncing...';

      try {
        if (window.Sync && window.Sync.attemptSync) {
          await window.Sync.attemptSync();
        }
        const now = new Date().toLocaleString();
        localStorage.setItem('deo_last_sync', now);
        lastSyncEl.textContent = `Last synced: ${now}`;
        syncStatus.innerHTML = '<span class="sync-ok">✓ Synced</span>';
      } catch (err) {
        syncStatus.innerHTML = '<span class="sync-warn">⚠ Sync failed</span>';
      }

      syncBtn.disabled = false;
      syncBtn.textContent = 'Sync Now';
    });

    // Export
    container.querySelector('#export-btn').addEventListener('click', () => {
      const data = {};
      if (window.DB) {
        data.cases = window.DB.getAllCases ? window.DB.getAllCases() : [];
        data.proceedings = window.DB.getAllProceedings ? window.DB.getAllProceedings() : [];
        data.compliance = window.DB.getAllCompliance ? window.DB.getAllCompliance() : [];
      }
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `DEO-Backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // Notification toggles
    const toggleIds = {
      'toggle-hearing': 'hearingReminders',
      'toggle-reply': 'replyDeadlineReminders',
      'toggle-compliance': 'complianceDeadlineReminders'
    };

    Object.entries(toggleIds).forEach(([id, key]) => {
      container.querySelector(`#${id}`).addEventListener('change', (e) => {
        if (window.Notifications && window.Notifications.updateSettings) {
          window.Notifications.updateSettings({ [key]: e.target.checked });
        }
      });
    });

    // Advance days selector
    container.querySelectorAll('.day-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.day-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const days = parseInt(chip.dataset.days);
        if (window.Notifications && window.Notifications.updateSettings) {
          window.Notifications.updateSettings({ advanceDays: days });
        }
      });
    });

    // --- Helper Functions ---
    function getLastSyncTime() {
      return localStorage.getItem('deo_last_sync') || 'Never';
    }

    function getSyncStatus() {
      const pending = window.Sync && window.Sync.getPendingCount ? window.Sync.getPendingCount() : 0;
      if (pending > 0) {
        return `<span class="sync-warn">⚠ ${pending} pending items</span>`;
      }
      return '<span class="sync-ok">✓ Synced</span>';
    }
  }
};
