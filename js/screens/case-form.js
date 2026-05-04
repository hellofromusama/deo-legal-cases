/**
 * Case Form Screen - Add/Edit Case
 * DEO Legal Case Management PWA
 */
(function () {
  'use strict';

  const LABELS = {
    caseTitle: { en: "Case Title", ur: "\u0645\u0642\u062F\u0645\u06D2 \u06A9\u0627 \u0639\u0646\u0648\u0627\u0646" },
    caseNumber: { en: "Case Number", ur: "\u0645\u0642\u062F\u0645\u06C1 \u0646\u0645\u0628\u0631" },
    caseType: { en: "Case Type", ur: "\u0645\u0642\u062F\u0645\u06D2 \u06A9\u06CC \u0642\u0633\u0645" },
    courtType: { en: "Court / Forum", ur: "\u0639\u062F\u0627\u0644\u062A / \u0641\u0648\u0631\u0645" },
    courtName: { en: "Court Name", ur: "\u0639\u062F\u0627\u0644\u062A \u06A9\u0627 \u0646\u0627\u0645" },
    judgeName: { en: "Judge / Member Name", ur: "\u062C\u062C / \u0631\u06A9\u0646 \u06A9\u0627 \u0646\u0627\u0645" },
    petitionerName: { en: "Petitioner", ur: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u06AF\u0632\u0627\u0631" },
    respondentName: { en: "Respondent", ur: "\u0645\u062F\u0639\u0627 \u0639\u0644\u06CC\u06C1" },
    departmentRole: { en: "Department's Role", ur: "\u0645\u062D\u06A9\u0645\u06D2 \u06A9\u0627 \u06A9\u0631\u062F\u0627\u0631" },
    caseNature: { en: "Nature of Case", ur: "\u0645\u0642\u062F\u0645\u06D2 \u06A9\u06CC \u0646\u0648\u0639\u06CC\u062A" },
    briefFacts: { en: "Brief Facts", ur: "\u0645\u062E\u062A\u0635\u0631 \u062D\u0642\u0627\u0626\u0642" },
    reliefClaimed: { en: "Relief Claimed", ur: "\u0645\u0637\u0644\u0648\u0628\u06C1 \u0631\u06CC\u0644\u06CC\u0641" },
    departmentPosition: { en: "Department's Position", ur: "\u0645\u062D\u06A9\u0645\u06D2 \u06A9\u0627 \u0645\u0648\u0642\u0641" },
    counselName: { en: "Department Counsel", ur: "\u0645\u062D\u06A9\u0645\u06C1 \u0648\u06A9\u06CC\u0644" },
    focalPersonName: { en: "Focal Person", ur: "\u0641\u0648\u06A9\u0644 \u067E\u0631\u0633\u0646" },
    focalPersonContact: { en: "Focal Person Contact", ur: "\u0641\u0648\u06A9\u0644 \u067E\u0631\u0633\u0646 \u0631\u0627\u0628\u0637\u06C1" },
    dateOfInstitution: { en: "Date of Institution", ur: "\u062F\u0627\u0626\u0631 \u06A9\u0631\u0646\u06D2 \u06A9\u06CC \u062A\u0627\u0631\u06CC\u062E" },
    dateNoticeReceived: { en: "Date Notice Received", ur: "\u0645\u0648\u0635\u0648\u0644 \u06C1\u0648\u0646\u06D2 \u06A9\u06CC \u062A\u0627\u0631\u06CC\u062E" },
    replyDeadline: { en: "Reply Deadline", ur: "\u062C\u0648\u0627\u0628 \u06A9\u06CC \u0622\u062E\u0631\u06CC \u062A\u0627\u0631\u06CC\u062E" },
    replyFiled: { en: "Reply Filed", ur: "\u062C\u0648\u0627\u0628 \u062F\u0627\u0626\u0631 \u06A9\u06CC\u0627 \u06AF\u06CC\u0627" },
    replyFiledDate: { en: "Reply Filed Date", ur: "\u062C\u0648\u0627\u0628 \u062F\u0627\u0626\u0631 \u06A9\u0631\u0646\u06D2 \u06A9\u06CC \u062A\u0627\u0631\u06CC\u062E" },
    status: { en: "Case Status", ur: "\u0645\u0642\u062F\u0645\u06D2 \u06A9\u06CC \u062D\u06CC\u062B\u06CC\u062A" },
    stayGranted: { en: "Stay Granted", ur: "\u062D\u06A9\u0645 \u0627\u0645\u062A\u0646\u0627\u0639\u06CC \u0645\u0646\u0638\u0648\u0631" },
    stayDetails: { en: "Stay Details", ur: "\u062D\u06A9\u0645 \u0627\u0645\u062A\u0646\u0627\u0639\u06CC \u06A9\u06CC \u062A\u0641\u0635\u06CC\u0644" },
    nextHearingDate: { en: "Next Hearing Date", ur: "\u0627\u06AF\u0644\u06CC \u0633\u0645\u0627\u0639\u062A \u06A9\u06CC \u062A\u0627\u0631\u06CC\u062E" }
  };

  const CASE_TYPES = [
    "Service Matter",
    "Court / Tribunal Case",
    "Contempt of Court",
    "RTI Appeal",
    "Departmental Inquiry",
    "Land / Property Dispute"
  ];

  const COURTS = [
    { value: "civil_court", label: "Civil Court", urdu: "\u0639\u062F\u0627\u0644\u062A \u062F\u06CC\u0648\u0627\u0646\u06CC" },
    { value: "district_court", label: "District Court", urdu: "\u0636\u0644\u0639\u06CC \u0639\u062F\u0627\u0644\u062A" },
    { value: "services_tribunal", label: "Services Tribunal", urdu: "\u0633\u0631\u0648\u0633\u0632 \u0679\u0631\u0628\u06CC\u0648\u0646\u0644" },
    { value: "high_court", label: "High Court Muzaffarabad", urdu: "\u06C1\u0627\u0626\u06CC \u06A9\u0648\u0631\u0679 \u0645\u0638\u0641\u0631\u0622\u0628\u0627\u062F" },
    { value: "supreme_court", label: "Supreme Court of AJK", urdu: "\u0627\u0639\u0644\u06CC\u0670 \u0639\u062F\u0627\u0644\u062A \u0622\u0632\u0627\u062F \u062C\u0645\u0648\u06BA \u0648 \u06A9\u0634\u0645\u06CC\u0631" },
    { value: "ajk_ombudsman", label: "AJK Ombudsman (Mohtasib)", urdu: "\u0645\u062D\u062A\u0633\u0628 \u0622\u0632\u0627\u062F \u06A9\u0634\u0645\u06CC\u0631" },
    { value: "federal_ombudsman", label: "Federal Ombudsman (Wafaqi Mohtasib)", urdu: "\u0648\u0641\u0627\u0642\u06CC \u0645\u062D\u062A\u0633\u0628" }
  ];

  const CASE_STATUSES = [
    { value: "Active", label: "Active", urdu: "\u0641\u0639\u0627\u0644", color: "#2E7D32" },
    { value: "Stay", label: "Stay Granted", urdu: "\u062D\u06A9\u0645 \u0627\u0645\u062A\u0646\u0627\u0639\u06CC", color: "#C62828" },
    { value: "Decided", label: "Decided", urdu: "\u0641\u06CC\u0635\u0644\u06C1 \u0634\u062F\u06C1", color: "#1565C0" },
    { value: "Dismissed", label: "Dismissed", urdu: "\u062E\u0627\u0631\u062C", color: "#6D4C41" },
    { value: "Compliance Pending", label: "Compliance Pending", urdu: "\u0632\u06CC\u0631 \u0627\u0644\u062A\u0648\u0627 \u062A\u0639\u0645\u06CC\u0644", color: "#6A1B9A" },
    { value: "Adjourned", label: "Adjourned", urdu: "\u0645\u0644\u062A\u0648\u06CC", color: "#F57F17" }
  ];

  const DEPT_ROLES = [
    { value: "Petitioner", label: "Petitioner", urdu: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u06AF\u0632\u0627\u0631" },
    { value: "Respondent", label: "Respondent", urdu: "\u0645\u062F\u0639\u0627 \u0639\u0644\u06CC\u06C1" },
    { value: "Proforma Respondent", label: "Proforma Respondent", urdu: "\u0645\u062F\u0639\u0627 \u0639\u0644\u06CC\u06C1 \u0628\u0627\u0644\u0648\u0627\u0633\u0637\u06C1" }
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
    const { required, hasUrdu } = Object.assign({ required: false, hasUrdu: false }, opts);
    const id = `field-${key}`;
    let optionsHtml = '<option value="">-- Select --</option>';
    options.forEach(function (opt) {
      if (typeof opt === 'string') {
        optionsHtml += `<option value="${opt}">${opt}</option>`;
      } else if (hasUrdu) {
        optionsHtml += `<option value="${opt.value}">${opt.label} - ${opt.urdu}</option>`;
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

  function toggleField(key) {
    const id = `field-${key}`;
    return `
      <div class="form-group toggle-group" data-field="${key}">
        ${createBilingualLabel(key, false)}
        <label class="toggle-switch">
          <input type="checkbox" id="${id}" name="${key}" />
          <span class="toggle-slider"></span>
        </label>
      </div>
    `;
  }

  function accordion(title, id, content, open) {
    return `
      <div class="accordion-section" id="section-${id}">
        <button type="button" class="accordion-header${open ? ' open' : ''}" data-target="accordion-body-${id}">
          <span>${title}</span>
          <span class="accordion-icon">${open ? '&#9650;' : '&#9660;'}</span>
        </button>
        <div class="accordion-body${open ? ' open' : ''}" id="accordion-body-${id}">
          ${content}
        </div>
      </div>
    `;
  }

  // ─── Main Render ───────────────────────────────────────────────────────────

  async function render(container, caseId) {
    // Role check
    if (window.Auth && window.Auth.getCurrentUser) {
      const user = window.Auth.getCurrentUser();
      if (user && user.role === 'viewer') {
        if (window.App && window.App.navigate) {
          window.App.navigate('dashboard');
        }
        return;
      }
    }

    const isEdit = !!caseId;
    let existingCase = null;

    if (isEdit && window.DB && window.DB.getCase) {
      existingCase = await window.DB.getCase(caseId);
    }

    const title = isEdit ? 'Edit Case' : 'Add New Case';

    // Build form HTML
    const section1 = accordion('Basic Information', 'basic',
      textField('caseTitle', { required: true }) +
      selectField('caseType', CASE_TYPES, { required: true }) +
      textField('caseNumber') +
      selectField('departmentRole', DEPT_ROLES, { required: true, hasUrdu: true }),
      true
    );

    const section2 = accordion('Court Information', 'court',
      selectField('courtType', COURTS, { required: true, hasUrdu: true }) +
      textField('courtName') +
      textField('judgeName'),
      false
    );

    const section3 = accordion('Parties', 'parties',
      textField('petitionerName', { required: true }) +
      textField('respondentName', { required: true }),
      false
    );

    const section4 = accordion('Case Details', 'details',
      textField('caseNature') +
      textField('briefFacts', { rows: 5 }) +
      textField('reliefClaimed', { rows: 3 }) +
      textField('departmentPosition', { rows: 3 }),
      false
    );

    const section5 = accordion('Department Representation', 'representation',
      textField('counselName') +
      textField('focalPersonName') +
      textField('focalPersonContact', { type: 'tel' }),
      false
    );

    const section6 = accordion('Key Dates', 'dates',
      textField('dateOfInstitution', { type: 'date' }) +
      textField('dateNoticeReceived', { type: 'date' }) +
      textField('replyDeadline', { type: 'date' }) +
      toggleField('replyFiled') +
      `<div class="conditional-field" id="replyFiledDateWrapper" style="display:none;">
        ${textField('replyFiledDate', { type: 'date' })}
      </div>` +
      textField('nextHearingDate', { type: 'date' }),
      false
    );

    const section7 = accordion('Status', 'status',
      selectField('status', CASE_STATUSES, { required: true, hasUrdu: true }) +
      toggleField('stayGranted') +
      `<div class="conditional-field" id="stayDetailsWrapper" style="display:none;">
        ${textField('stayDetails', { rows: 3 })}
      </div>`,
      false
    );

    container.innerHTML = `
      <div class="case-form-screen">
        <div class="form-header">
          <button type="button" class="btn-back" id="btn-form-back">&larr;</button>
          <h2>${title}</h2>
        </div>
        <form id="caseForm" novalidate>
          ${section1}
          ${section2}
          ${section3}
          ${section4}
          ${section5}
          ${section6}
          ${section7}
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" id="btn-save-case">
              ${isEdit ? 'Update Case' : 'Save Case'}
            </button>
            <button type="button" class="btn btn-secondary" id="btn-cancel">Cancel</button>
          </div>
        </form>
      </div>
      <style>
        .case-form-screen { max-width: 720px; margin: 0 auto; padding: 16px; }
        .form-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .form-header h2 { margin: 0; font-size: 1.3rem; }
        .btn-back { background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 4px 8px; }
        .accordion-section { border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
        .accordion-header { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #f5f5f5; border: none; font-size: 1rem; font-weight: 600; cursor: pointer; }
        .accordion-header.open { background: #e8f5e9; }
        .accordion-body { padding: 0 16px; max-height: 0; overflow: hidden; transition: max-height 0.3s ease, padding 0.3s ease; }
        .accordion-body.open { max-height: 2000px; padding: 16px; }
        .form-group { margin-bottom: 16px; }
        .field-label { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .label-en { font-weight: 500; font-size: 0.9rem; }
        .label-ur { font-family: 'Noto Nastaliq Urdu', serif; font-size: 0.8rem; color: #757575; direction: rtl; }
        .form-input { width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 0.95rem; box-sizing: border-box; }
        .form-input:focus { border-color: #2E7D32; outline: none; box-shadow: 0 0 0 2px rgba(46,125,50,0.15); }
        .form-input.error { border-color: #C62828; }
        .field-error { font-size: 0.78rem; color: #C62828; margin-top: 3px; min-height: 1em; }
        .toggle-group { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .toggle-switch { position: relative; display: inline-block; width: 48px; height: 26px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #ccc; border-radius: 26px; transition: 0.3s; }
        .toggle-slider::before { content: ''; position: absolute; height: 20px; width: 20px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.3s; }
        .toggle-switch input:checked + .toggle-slider { background: #2E7D32; }
        .toggle-switch input:checked + .toggle-slider::before { transform: translateX(22px); }
        .form-actions { display: flex; gap: 12px; margin-top: 24px; padding-bottom: 32px; }
        .btn { padding: 12px 24px; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
        .btn-primary { background: #2E7D32; color: #fff; flex: 1; }
        .btn-primary:active { background: #1B5E20; }
        .btn-secondary { background: #e0e0e0; color: #333; }
        .conditional-field { margin-top: 8px; }
      </style>
    `;

    // ─── Populate fields if editing ──────────────────────────────────────────
    if (isEdit && existingCase) {
      const fields = [
        'caseTitle', 'caseNumber', 'caseType', 'courtType', 'courtName',
        'judgeName', 'petitionerName', 'respondentName', 'departmentRole',
        'caseNature', 'briefFacts', 'reliefClaimed', 'departmentPosition',
        'counselName', 'focalPersonName', 'focalPersonContact',
        'dateOfInstitution', 'dateNoticeReceived', 'replyDeadline',
        'replyFiledDate', 'nextHearingDate', 'status', 'stayDetails'
      ];
      fields.forEach(function (f) {
        const el = document.getElementById('field-' + f);
        if (el && existingCase[f] !== undefined && existingCase[f] !== null) {
          el.value = existingCase[f];
        }
      });
      // Toggles
      const replyFiledEl = document.getElementById('field-replyFiled');
      if (replyFiledEl && existingCase.replyFiled) {
        replyFiledEl.checked = true;
        document.getElementById('replyFiledDateWrapper').style.display = 'block';
      }
      const stayEl = document.getElementById('field-stayGranted');
      if (stayEl && existingCase.stayGranted) {
        stayEl.checked = true;
        document.getElementById('stayDetailsWrapper').style.display = 'block';
      }
    }

    // ─── Event Listeners ─────────────────────────────────────────────────────

    // Accordion toggles
    container.querySelectorAll('.accordion-header').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const target = document.getElementById(btn.getAttribute('data-target'));
        const isOpen = btn.classList.toggle('open');
        target.classList.toggle('open', isOpen);
        btn.querySelector('.accordion-icon').innerHTML = isOpen ? '&#9650;' : '&#9660;';
      });
    });

    // Court selection -> auto-populate court name
    const courtSelect = document.getElementById('field-courtType');
    if (courtSelect) {
      courtSelect.addEventListener('change', function () {
        const selected = COURTS.find(function (c) { return c.value === courtSelect.value; });
        const courtNameField = document.getElementById('field-courtName');
        if (courtNameField && selected) {
          courtNameField.value = selected.label;
        }
      });
    }

    // Toggle: Reply Filed
    const replyFiledToggle = document.getElementById('field-replyFiled');
    if (replyFiledToggle) {
      replyFiledToggle.addEventListener('change', function () {
        document.getElementById('replyFiledDateWrapper').style.display = replyFiledToggle.checked ? 'block' : 'none';
      });
    }

    // Toggle: Stay Granted
    const stayToggle = document.getElementById('field-stayGranted');
    if (stayToggle) {
      stayToggle.addEventListener('change', function () {
        document.getElementById('stayDetailsWrapper').style.display = stayToggle.checked ? 'block' : 'none';
      });
    }

    // Back / Cancel
    var btnBack = document.getElementById('btn-form-back');
    var btnCancel = document.getElementById('btn-cancel');
    function goBack() {
      if (window.App && window.App.navigate) {
        window.App.navigate(isEdit ? 'case-detail/' + caseId : 'dashboard');
      }
    }
    if (btnBack) btnBack.addEventListener('click', goBack);
    if (btnCancel) btnCancel.addEventListener('click', goBack);

    // Form submit
    var form = document.getElementById('caseForm');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateForm()) return;
      await saveCase(isEdit, caseId, existingCase);
    });
  }

  // ─── Validation ────────────────────────────────────────────────────────────

  function validateForm() {
    let valid = true;
    const requiredFields = [
      { key: 'caseTitle', msg: 'Case Title is required' },
      { key: 'caseType', msg: 'Case Type is required' },
      { key: 'departmentRole', msg: 'Department Role is required' },
      { key: 'courtType', msg: 'Court / Forum is required' },
      { key: 'petitionerName', msg: 'Petitioner Name is required' },
      { key: 'respondentName', msg: 'Respondent Name is required' },
      { key: 'status', msg: 'Case Status is required' }
    ];

    // Clear previous errors
    document.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
    document.querySelectorAll('.form-input.error').forEach(function (el) { el.classList.remove('error'); });

    requiredFields.forEach(function (f) {
      const el = document.getElementById('field-' + f.key);
      if (!el || !el.value.trim()) {
        valid = false;
        showFieldError(f.key, f.msg);
      }
    });

    // Date validation: replyDeadline must be after dateNoticeReceived
    const noticeDate = document.getElementById('field-dateNoticeReceived');
    const deadlineDate = document.getElementById('field-replyDeadline');
    if (noticeDate && deadlineDate && noticeDate.value && deadlineDate.value) {
      if (new Date(deadlineDate.value) <= new Date(noticeDate.value)) {
        valid = false;
        showFieldError('replyDeadline', 'Reply Deadline must be after Date Notice Received');
      }
    }

    // Open the first accordion section that has an error
    if (!valid) {
      var firstError = document.querySelector('.field-error:not(:empty)');
      if (firstError) {
        var section = firstError.closest('.accordion-body');
        if (section && !section.classList.contains('open')) {
          section.classList.add('open');
          var header = section.previousElementSibling;
          if (header) {
            header.classList.add('open');
            header.querySelector('.accordion-icon').innerHTML = '&#9650;';
          }
        }
      }
    }

    return valid;
  }

  function showFieldError(key, msg) {
    var errorEl = document.getElementById('error-' + key);
    var inputEl = document.getElementById('field-' + key);
    if (errorEl) errorEl.textContent = msg;
    if (inputEl) inputEl.classList.add('error');
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  async function saveCase(isEdit, caseId, existingCase) {
    const getValue = function (key) {
      var el = document.getElementById('field-' + key);
      return el ? el.value.trim() : '';
    };
    const getChecked = function (key) {
      var el = document.getElementById('field-' + key);
      return el ? el.checked : false;
    };

    var now = new Date().toISOString();

    var caseData = {
      caseTitle: getValue('caseTitle'),
      caseType: getValue('caseType'),
      caseNumber: getValue('caseNumber'),
      departmentRole: getValue('departmentRole'),
      courtType: getValue('courtType'),
      courtName: getValue('courtName'),
      judgeName: getValue('judgeName'),
      petitionerName: getValue('petitionerName'),
      respondentName: getValue('respondentName'),
      caseNature: getValue('caseNature'),
      briefFacts: getValue('briefFacts'),
      reliefClaimed: getValue('reliefClaimed'),
      departmentPosition: getValue('departmentPosition'),
      counselName: getValue('counselName'),
      focalPersonName: getValue('focalPersonName'),
      focalPersonContact: getValue('focalPersonContact'),
      dateOfInstitution: getValue('dateOfInstitution'),
      dateNoticeReceived: getValue('dateNoticeReceived'),
      replyDeadline: getValue('replyDeadline'),
      replyFiled: getChecked('replyFiled'),
      replyFiledDate: getChecked('replyFiled') ? getValue('replyFiledDate') : '',
      nextHearingDate: getValue('nextHearingDate'),
      status: getValue('status'),
      stayGranted: getChecked('stayGranted'),
      stayDetails: getChecked('stayGranted') ? getValue('stayDetails') : '',
      updatedAt: now,
      syncStatus: 'pending',
      isDeleted: false
    };

    if (isEdit && existingCase) {
      caseData.caseId = caseId;
      caseData.createdAt = existingCase.createdAt;
    } else {
      // Generate new case ID
      var nextNum = '001';
      if (window.DB && window.DB.getNextCaseNumber) {
        nextNum = await window.DB.getNextCaseNumber();
      }
      var year = new Date().getFullYear();
      caseData.caseId = 'DEO-MZD-' + year + '-' + nextNum;
      caseData.createdAt = now;
    }

    // Save to IndexedDB
    if (window.DB && window.DB.saveCase) {
      await window.DB.saveCase(caseData);
    }

    // Add to sync queue
    if (window.Sync && window.Sync.addToQueue) {
      await window.Sync.addToQueue({
        type: isEdit ? 'update' : 'create',
        entity: 'case',
        data: caseData
      });
    }

    // Show success toast
    showToast(isEdit ? 'Case updated successfully' : 'Case saved successfully');

    // Navigate to case detail
    if (window.App && window.App.navigate) {
      window.App.navigate('case-detail/' + caseData.caseId);
    }
  }

  function showToast(message) {
    if (window.App && window.App.showToast) {
      window.App.showToast(message);
      return;
    }
    var toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#2E7D32;color:#fff;padding:12px 24px;border-radius:8px;font-size:0.95rem;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3000);
  }

  // ─── Expose ────────────────────────────────────────────────────────────────
  window.CaseFormScreen = { render: render };
})();
