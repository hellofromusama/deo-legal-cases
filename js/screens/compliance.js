/**
 * Compliance Form Screen - Add Compliance
 * DEO Legal Case Management PWA
 */
(function () {
  'use strict';

  const LABELS = {
    complianceDescription: { en: "Compliance Required", ur: "مطلوبہ تعمیل" },
    complianceDeadline: { en: "Compliance Deadline", ur: "تعمیل کی آخری تاریخ" },
    complianceStatus: { en: "Compliance Status", ur: "تعمیل کی حیثیت" },
    complianceDate: { en: "Completed On", ur: "مکمل ہونے کی تاریخ" },
    remarks: { en: "Remarks", ur: "ملاحظات" }
  };

  const COMPLIANCE_STATUSES = [
    { value: "Pending", label: "Pending" },
    { value: "Completed", label: "Completed" },
    { value: "Partial", label: "Partial" },
    { value: "Overdue", label: "Overdue" }
  ];

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
    const { required, type, rows, placeholder } = Object.assign({ required: false, type: 'text', rows: 0, placeholder: '' }, opts);
    const id = `field-${key}`;
    let input;
    if (rows > 0) {
      input = `<textarea id="${id}" name="${key}" rows="${rows}" class="form-input" placeholder="${placeholder}"></textarea>`;
    } else {
      input = `<input id="${id}" name="${key}" type="${type}" class="form-input" placeholder="${placeholder}" />`;
    }
    return `
      <div class="form-group" data-field="${key}">
        ${createBilingualLabel(key, required)}
        ${input}
        <div class="field-error" id="error-${key}"></div>
      </div>
    `;
  }

  function selectField(key, options, opts = {}) {
    const { required } = Object.assign({ required: false }, opts);
    const id = `field-${key}`;
    let optionsHtml = '<option value="">-- Select --</option>';
    options.forEach(function (opt) {
      if (typeof opt === 'string') {
        optionsHtml += `<option value="${opt}">${opt}</option>`;
      } else {
        optionsHtml += `<option value="${opt.value}">${opt.label}</option>`;
      }
    });
    return `
      <div class="form-group" data-field="${key}">
        ${createBilingualLabel(key, required)}
        <select id="${id}" name="${key}" class="form-input">${optionsHtml}</select>
        <div class="field-error" id="error-${key}"></div>
      </div>
    `;
  }

  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // ─── Main Render ───────────────────────────────────────────────────────────

  async function render(container, caseId) {
    // Role check - admin only
    if (window.Auth && window.Auth.getCurrentUser) {
      const user = window.Auth.getCurrentUser();
      if (user && user.role === 'viewer') {
        if (window.App && window.App.navigate) {
          window.App.navigate('dashboard');
        }
        return;
      }
    }

    if (!caseId) {
      if (window.App && window.App.navigate) {
        window.App.navigate('dashboard');
      }
      return;
    }

    container.innerHTML = `
      <div class="compliance-form-screen">
        <div class="form-header">
          <button type="button" class="btn-back" id="btn-form-back">&larr;</button>
          <div class="form-header-title">
            <h2>Add Compliance</h2>
            <span class="header-ur">تعمیل شامل کریں</span>
          </div>
        </div>
        <form id="complianceForm" novalidate>
          ${textField('complianceDescription', { required: true, rows: 3 })}
          ${textField('complianceDeadline', { required: true, type: 'date' })}
          ${selectField('complianceStatus', COMPLIANCE_STATUSES)}
          <div class="conditional-field" id="complianceDateWrapper" style="display:none;">
            ${textField('complianceDate', { type: 'date' })}
          </div>
          ${textField('remarks', { rows: 2 })}
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" id="btn-save-compliance">
              Save Compliance
            </button>
          </div>
        </form>
      </div>
      <style>
        .compliance-form-screen { max-width: 720px; margin: 0 auto; padding: 16px; }
        .compliance-form-screen .form-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .compliance-form-screen .form-header-title h2 { margin: 0; font-size: 1.3rem; }
        .compliance-form-screen .header-ur { font-family: 'Noto Nastaliq Urdu', serif; font-size: 0.9rem; color: #555; direction: rtl; }
        .compliance-form-screen .btn-back { background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 4px 8px; }
        .compliance-form-screen .form-group { margin-bottom: 16px; }
        .compliance-form-screen .field-label { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .compliance-form-screen .label-en { font-weight: 500; font-size: 0.9rem; }
        .compliance-form-screen .label-ur { font-family: 'Noto Nastaliq Urdu', serif; font-size: 0.8rem; color: #757575; direction: rtl; }
        .compliance-form-screen .form-input { width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 0.95rem; box-sizing: border-box; }
        .compliance-form-screen .form-input:focus { border-color: #1a237e; outline: none; box-shadow: 0 0 0 2px rgba(26,35,126,0.15); }
        .compliance-form-screen .form-input.error { border-color: #C62828; }
        .compliance-form-screen .field-error { font-size: 0.78rem; color: #C62828; margin-top: 3px; min-height: 1em; }
        .compliance-form-screen .form-actions { margin-top: 24px; padding-bottom: 32px; }
        .compliance-form-screen .btn { padding: 12px 24px; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
        .compliance-form-screen .btn-primary { background: #1a237e; color: #fff; width: 100%; }
        .compliance-form-screen .btn-primary:active { background: #0d1554; }
        .compliance-form-screen .conditional-field { margin-top: 8px; }
      </style>
    `;

    // ─── Event Listeners ─────────────────────────────────────────────────────

    // Back button
    var btnBack = document.getElementById('btn-form-back');
    if (btnBack) {
      btnBack.addEventListener('click', function () {
        if (window.App && window.App.navigate) {
          window.App.navigate('case-detail/' + caseId);
        }
      });
    }

    // Show/hide Completed On date based on status
    var statusSelect = document.getElementById('field-complianceStatus');
    var dateWrapper = document.getElementById('complianceDateWrapper');
    if (statusSelect) {
      statusSelect.addEventListener('change', function () {
        if (statusSelect.value === 'Completed') {
          dateWrapper.style.display = 'block';
        } else {
          dateWrapper.style.display = 'none';
        }
      });
    }

    // Form submit
    var form = document.getElementById('complianceForm');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateForm()) return;
      await saveCompliance(caseId);
    });
  }

  // ─── Validation ────────────────────────────────────────────────────────────

  function validateForm() {
    let valid = true;

    // Clear previous errors
    document.querySelectorAll('.compliance-form-screen .field-error').forEach(function (el) { el.textContent = ''; });
    document.querySelectorAll('.compliance-form-screen .form-input.error').forEach(function (el) { el.classList.remove('error'); });

    var requiredFields = [
      { key: 'complianceDescription', msg: 'Compliance Required is mandatory' },
      { key: 'complianceDeadline', msg: 'Compliance Deadline is mandatory' }
    ];

    requiredFields.forEach(function (f) {
      var el = document.getElementById('field-' + f.key);
      if (!el || !el.value.trim()) {
        valid = false;
        showFieldError(f.key, f.msg);
      }
    });

    return valid;
  }

  function showFieldError(key, msg) {
    var errorEl = document.getElementById('error-' + key);
    var inputEl = document.getElementById('field-' + key);
    if (errorEl) errorEl.textContent = msg;
    if (inputEl) inputEl.classList.add('error');
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  async function saveCompliance(caseId) {
    var getValue = function (key) {
      var el = document.getElementById('field-' + key);
      return el ? el.value.trim() : '';
    };

    var now = new Date().toISOString();
    var id = generateUUID();

    var data = {
      id: id,
      caseId: caseId,
      complianceDescription: getValue('complianceDescription'),
      complianceDeadline: getValue('complianceDeadline'),
      complianceStatus: getValue('complianceStatus') || 'Pending',
      complianceDate: getValue('complianceStatus') === 'Completed' ? getValue('complianceDate') : '',
      remarks: getValue('remarks'),
      createdAt: now,
      syncStatus: 'pending'
    };

    // Save to IndexedDB
    if (window.DB && window.DB.saveCompliance) {
      await window.DB.saveCompliance(data);
    }

    // Update parent case's updatedAt
    if (window.DB && window.DB.getCase && window.DB.saveCase) {
      var parentCase = await window.DB.getCase(caseId);
      if (parentCase) {
        parentCase.updatedAt = now;
        await window.DB.saveCase(parentCase);
      }
    }

    // Add to sync queue
    if (window.Sync && window.Sync.addToQueue) {
      await window.Sync.addToQueue('create', 'compliance', id, data, caseId);
    }

    // Show success toast
    showToast('Compliance saved successfully');

    // Navigate back to case detail
    if (window.App && window.App.navigate) {
      window.App.navigate('case-detail/' + caseId);
    }
  }

  function showToast(message) {
    if (window.App && window.App.showToast) {
      window.App.showToast(message);
      return;
    }
    var toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a237e;color:#fff;padding:12px 24px;border-radius:8px;font-size:0.95rem;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3000);
  }

  // ─── Expose ────────────────────────────────────────────────────────────────
  window.ComplianceFormScreen = { render: render };
})();
