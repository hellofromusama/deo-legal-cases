/**
 * Proceedings Form Screen - Add Proceedings / Compliance
 * DEO Legal Case Management PWA
 */
(function () {
  'use strict';

  const LABELS = {
    hearingDate: { en: "Hearing Date", ur: "سماعت کی تاریخ" },
    proceedingsSummary: { en: "Proceedings Summary", ur: "کارروائی کا خلاصہ" },
    courtOrder: { en: "Court Order / Direction", ur: "عدالتی حکم / ہدایت" },
    nextHearingDate: { en: "Next Hearing Date", ur: "اگلی تاریخ" },
    actionRequired: { en: "Action Required", ur: "مطلوبہ اقدام" },
    actionDeadline: { en: "Action Deadline", ur: "اقدام کی آخری تاریخ" }
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function createBilingualLabel(key, required) {
    const lbl = LABELS[key];
    if (!lbl) return '';
    const req = required ? '<span style="color:#C62828;margin-left:2px;">*</span>' : '';
    return `
      <div class="field-label">
        <span class="label-en">${lbl.en}${req}</span>
        <span class="label-ur">${lbl.ur}</span>
      </div>
    `;
  }

  function textField(key, opts = {}) {
    const { required, type, rows, placeholder, defaultValue } = Object.assign(
      { required: false, type: 'text', rows: 0, placeholder: '', defaultValue: '' }, opts
    );
    const id = `field-${key}`;
    const val = defaultValue ? ` value="${defaultValue}"` : '';
    let input;
    if (rows > 0) {
      input = `<textarea id="${id}" name="${key}" rows="${rows}" class="form-input" placeholder="${placeholder}">${defaultValue}</textarea>`;
    } else {
      input = `<input id="${id}" name="${key}" type="${type}" class="form-input" placeholder="${placeholder}"${val} />`;
    }
    return `
      <div class="form-group" data-field="${key}">
        ${createBilingualLabel(key, required)}
        ${input}
        <div class="field-error" id="error-${key}"></div>
      </div>
    `;
  }

  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function todayISO() {
    return new Date().toISOString().split('T')[0];
  }

  function showToast(msg, type) {
    if (window.Toast && window.Toast.show) {
      window.Toast.show(msg, type);
    } else {
      // Fallback: simple toast
      var el = document.createElement('div');
      el.className = 'toast toast-' + (type || 'success');
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(function () { el.remove(); }, 3000);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  function render(container, caseId) {
    // Admin-only guard
    if (window.Auth && window.Auth.getCurrentUser) {
      var user = window.Auth.getCurrentUser();
      if (user && user.role === 'viewer') {
        window.location.hash = '#/dashboard';
        return;
      }
    }

    if (!caseId) {
      window.location.hash = '#/cases';
      return;
    }

    var html = `
      <div class="screen-container proceedings-form-screen">
        <header class="screen-header">
          <button class="btn-back" id="btn-back-proceedings" aria-label="Back">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div class="header-title">
            <h1>Add Proceedings</h1>
            <p class="header-ur">کارروائی کی تفصیلات شامل کریں</p>
          </div>
        </header>

        <form id="proceedings-form" class="form-body" novalidate>
          ${textField('hearingDate', { required: true, type: 'date', defaultValue: todayISO() })}
          ${textField('proceedingsSummary', { required: true, rows: 5, placeholder: 'Enter proceedings summary...' })}
          ${textField('courtOrder', { rows: 3, placeholder: 'Court order or direction...' })}
          ${textField('nextHearingDate', { type: 'date' })}
          ${textField('actionRequired', { rows: 2, placeholder: 'Action required...' })}
          ${textField('actionDeadline', { type: 'date' })}

          <button type="submit" class="btn btn-primary btn-block" id="btn-save-proceedings">
            Save Proceedings
          </button>
        </form>
      </div>
    `;

    container.innerHTML = html;

    // ─── Event Listeners ─────────────────────────────────────────────────────

    document.getElementById('btn-back-proceedings').addEventListener('click', function () {
      window.location.hash = '#/cases/' + caseId;
    });

    document.getElementById('proceedings-form').addEventListener('submit', function (e) {
      e.preventDefault();
      handleSave(caseId);
    });
  }

  // ─── Save Handler ──────────────────────────────────────────────────────────

  async function handleSave(caseId) {
    // Gather values
    var hearingDate = document.getElementById('field-hearingDate').value.trim();
    var proceedingsSummary = document.getElementById('field-proceedingsSummary').value.trim();
    var courtOrder = document.getElementById('field-courtOrder').value.trim();
    var nextHearingDate = document.getElementById('field-nextHearingDate').value.trim();
    var actionRequired = document.getElementById('field-actionRequired').value.trim();
    var actionDeadline = document.getElementById('field-actionDeadline').value.trim();

    // Clear previous errors
    document.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
    document.querySelectorAll('.form-input').forEach(function (el) { el.classList.remove('input-error'); });

    // Validation
    var valid = true;

    if (!hearingDate) {
      document.getElementById('error-hearingDate').textContent = 'Hearing Date is required | سماعت کی تاریخ ضروری ہے';
      document.getElementById('field-hearingDate').classList.add('input-error');
      valid = false;
    }

    if (!proceedingsSummary) {
      document.getElementById('error-proceedingsSummary').textContent = 'Proceedings Summary is required | کارروائی کا خلاصہ ضروری ہے';
      document.getElementById('field-proceedingsSummary').classList.add('input-error');
      valid = false;
    }

    if (!valid) return;

    // Build proceeding object
    var id = generateUUID();
    var now = new Date().toISOString();

    var proceeding = {
      id: id,
      caseId: caseId,
      hearingDate: hearingDate,
      proceedingsSummary: proceedingsSummary,
      courtOrder: courtOrder || null,
      nextHearingDate: nextHearingDate || null,
      actionRequired: actionRequired || null,
      actionDeadline: actionDeadline || null,
      createdAt: now,
      syncStatus: 'pending'
    };

    try {
      // Save proceeding to IndexedDB
      if (window.DB && window.DB.saveProceeding) {
        await window.DB.saveProceeding(proceeding);
      }

      // Update parent case's nextHearingDate if proceeding has a future next date
      if (nextHearingDate) {
        var nextDate = new Date(nextHearingDate);
        var today = new Date();
        today.setHours(0, 0, 0, 0);

        if (nextDate >= today && window.DB && window.DB.getCase && window.DB.saveCase) {
          var parentCase = await window.DB.getCase(caseId);
          if (parentCase) {
            parentCase.nextHearingDate = nextHearingDate;
            parentCase.updatedAt = now;
            await window.DB.saveCase(parentCase);
          }
        }
      } else {
        // Still update updatedAt on parent case
        if (window.DB && window.DB.getCase && window.DB.saveCase) {
          var parentCase = await window.DB.getCase(caseId);
          if (parentCase) {
            parentCase.updatedAt = now;
            await window.DB.saveCase(parentCase);
          }
        }
      }

      // Add to sync queue
      if (window.Sync && window.Sync.addToQueue) {
        await window.Sync.addToQueue('create', 'proceedings', id, proceeding, caseId);
      }

      // Show success toast
      showToast('Proceedings saved successfully | کارروائی محفوظ ہو گئی', 'success');

      // Navigate back to case detail
      window.location.hash = '#/cases/' + caseId;

    } catch (err) {
      console.error('Error saving proceedings:', err);
      showToast('Error saving proceedings | کارروائی محفوظ نہیں ہو سکی', 'error');
    }
  }

  // ─── Expose ────────────────────────────────────────────────────────────────

  window.ProceedingsFormScreen = {
    render: render
  };

})();
