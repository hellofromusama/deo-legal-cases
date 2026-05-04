/**
 * Case Detail Screen - DEO Legal Case Management PWA
 */
(function () {
  'use strict';

  const LABELS = {
    caseTitle: { en: "Case Title", ur: "مقدمے کا عنوان" },
    caseNumber: { en: "Case Number", ur: "مقدمہ نمبر" },
    caseType: { en: "Case Type", ur: "مقدمے کی قسم" },
    courtType: { en: "Court / Forum", ur: "عدالت / فورم" },
    courtName: { en: "Court Name", ur: "عدالت کا نام" },
    judgeName: { en: "Judge / Member Name", ur: "جج / رکن کا نام" },
    petitionerName: { en: "Petitioner", ur: "درخواست گزار" },
    respondentName: { en: "Respondent", ur: "مدعا علیہ" },
    departmentRole: { en: "Department's Role", ur: "محکمے کا کردار" },
    caseNature: { en: "Nature of Case", ur: "مقدمے کی نوعیت" },
    briefFacts: { en: "Brief Facts", ur: "مختصر حقائق" },
    reliefClaimed: { en: "Relief Claimed", ur: "مطلوبہ ریلیف" },
    departmentPosition: { en: "Department's Position", ur: "محکمے کا موقف" },
    counselName: { en: "Department Counsel", ur: "محکمہ وکیل" },
    focalPersonName: { en: "Focal Person", ur: "فوکل پرسن" },
    focalPersonContact: { en: "Focal Person Contact", ur: "فوکل پرسن رابطہ" },
    dateOfInstitution: { en: "Date of Institution", ur: "دائر کرنے کی تاریخ" },
    dateNoticeReceived: { en: "Date Notice Received", ur: "موصول ہونے کی تاریخ" },
    replyDeadline: { en: "Reply Deadline", ur: "جواب کی آخری تاریخ" },
    replyFiled: { en: "Reply Filed", ur: "جواب دائر کیا گیا" },
    replyFiledDate: { en: "Reply Filed Date", ur: "جواب دائر کرنے کی تاریخ" },
    status: { en: "Case Status", ur: "مقدمے کی حیثیت" },
    stayGranted: { en: "Stay Granted", ur: "حکم امتناعی منظور" },
    stayDetails: { en: "Stay Details", ur: "حکم امتناعی کی تفصیل" },
    nextHearingDate: { en: "Next Hearing Date", ur: "اگلی سماعت کی تاریخ" }
  };

  const STATUS_COLORS = {
    'Active': '#2E7D32',
    'Stay': '#C62828',
    'Decided': '#1565C0',
    'Dismissed': '#6D4C41',
    'Compliance Pending': '#6A1B9A',
    'Adjourned': '#F57F17'
  };

  function getStatusColor(status) {
    return STATUS_COLORS[status] || '#757575';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }

  function formatValue(key, value) {
    if (value === null || value === undefined || value === '') return '—';
    if (key.toLowerCase().includes('date') || key === 'replyDeadline') return formatDate(value);
    if (typeof value === 'boolean') return value ? 'Yes / ہاں' : 'No / نہیں';
    if (key === 'replyFiled') return value ? 'Yes / ہاں' : 'No / نہیں';
    return value;
  }

  function renderFieldRow(key, value) {
    const label = LABELS[key];
    if (!label) return '';
    return `
      <div class="field-row" style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="font-weight:600;font-size:0.82rem;color:#333;">${label.en}</span>
          <span style="font-size:0.78rem;color:#888;direction:rtl;font-family:'Noto Nastaliq Urdu',serif;">${label.ur}</span>
        </div>
        <div style="font-size:0.95rem;color:#222;padding-left:2px;">${formatValue(key, value)}</div>
      </div>
    `;
  }

  function renderSection(title, fields, caseData) {
    const rows = fields.map(f => renderFieldRow(f, caseData[f])).join('');
    return `
      <div class="profile-section" style="margin-bottom:18px;">
        <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#666;padding:8px 0 4px;border-bottom:2px solid #e0e0e0;margin-bottom:4px;">${title}</div>
        ${rows}
      </div>
    `;
  }

  function renderProfileTab(caseData) {
    const isAdmin = window.Auth && window.Auth.isAdmin();
    let html = '';

    html += renderSection('Case Identification', ['caseId', 'caseTitle', 'caseNumber', 'caseType'], caseData);
    html += renderSection('Court Details', ['courtType', 'courtName', 'judgeName'], caseData);
    html += renderSection('Parties', ['petitionerName', 'respondentName', 'departmentRole'], caseData);
    html += renderSection('Case Background', ['caseNature', 'briefFacts', 'reliefClaimed', 'departmentPosition'], caseData);
    html += renderSection('Department Details', ['counselName', 'focalPersonName', 'focalPersonContact'], caseData);
    html += renderSection('Key Dates', ['dateOfInstitution', 'dateNoticeReceived', 'replyDeadline', 'replyFiled', 'replyFiledDate', 'nextHearingDate'], caseData);

    // Stay Order section - only if stay granted
    if (caseData.stayGranted) {
      html += `
        <div class="profile-section" style="margin-bottom:18px;background:#FFEBEE;border:1px solid #EF9A9A;border-radius:8px;padding:12px;">
          <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#C62828;padding:4px 0;border-bottom:2px solid #EF9A9A;margin-bottom:4px;">Stay Order</div>
          ${renderFieldRow('stayGranted', caseData.stayGranted)}
          ${renderFieldRow('stayDetails', caseData.stayDetails)}
        </div>
      `;
    }

    // Action buttons (admin only)
    if (isAdmin) {
      html += `
        <div style="display:flex;gap:10px;flex-wrap:wrap;padding:16px 0;border-top:2px solid #e0e0e0;margin-top:12px;">
          <button onclick="window.PDFExport && window.PDFExport.generateCasePDF()" style="flex:1;min-width:120px;padding:12px 16px;background:#1565C0;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Export PDF</button>
          <button onclick="location.hash='#/cases/${caseData.caseId}/edit'" style="flex:1;min-width:120px;padding:12px 16px;background:#2E7D32;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Edit Case</button>
          <button class="btn-delete-case" style="flex:1;min-width:120px;padding:12px 16px;background:#C62828;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Delete Case</button>
        </div>
      `;
    }

    return html;
  }

  function renderProceedingsTab(caseData, proceedings) {
    const isAdmin = window.Auth && window.Auth.isAdmin();
    const today = new Date().toISOString().split('T')[0];

    let html = '<div class="proceedings-timeline" style="position:relative;padding-left:24px;">';

    // Timeline vertical line
    html += '<div style="position:absolute;left:10px;top:0;bottom:0;width:2px;background:#e0e0e0;"></div>';

    if (!proceedings || proceedings.length === 0) {
      html += '<div style="padding:24px;text-align:center;color:#888;">No proceedings recorded yet.<br><span style="font-family:\'Noto Nastaliq Urdu\',serif;">ابھی تک کوئی کارروائی ریکارڈ نہیں ہوئی</span></div>';
    } else {
      // Sort newest first
      const sorted = [...proceedings].sort((a, b) => new Date(b.hearingDate) - new Date(a.hearingDate));

      sorted.forEach(proc => {
        const isOverdue = proc.actionDeadline && proc.actionDeadline < today && !proc.actionCompleted;
        const borderStyle = isOverdue ? 'border:2px solid #C62828;' : 'border:1px solid #e0e0e0;';

        html += `
          <div class="proceeding-entry" style="position:relative;margin-bottom:16px;padding:14px;background:#fff;border-radius:10px;${borderStyle}box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <div style="position:absolute;left:-20px;top:18px;width:12px;height:12px;border-radius:50%;background:#1565C0;border:2px solid #fff;box-shadow:0 0 0 2px #1565C0;"></div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-weight:700;color:#1565C0;font-size:0.9rem;">${formatDate(proc.hearingDate)}</span>
              ${proc.nextDate ? '<span style="font-size:0.78rem;color:#666;">Next: ' + formatDate(proc.nextDate) + '</span>' : ''}
            </div>
            ${proc.proceedingsSummary ? '<div style="font-size:0.9rem;margin-bottom:6px;color:#333;">' + proc.proceedingsSummary + '</div>' : ''}
            ${proc.courtOrder ? '<div style="font-size:0.85rem;color:#555;background:#F5F5F5;padding:8px;border-radius:6px;margin-bottom:6px;"><strong>Court Order:</strong> ' + proc.courtOrder + '</div>' : ''}
            ${proc.actionRequired ? `
              <div style="margin-top:8px;padding:8px;background:${isOverdue ? '#FFF3F3' : '#F9FBE7'};border-radius:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <input type="checkbox" class="action-checkbox" data-id="${proc.id}" ${proc.actionCompleted ? 'checked' : ''} ${!isAdmin ? 'disabled' : ''} style="width:18px;height:18px;cursor:${isAdmin ? 'pointer' : 'default'};">
                  <span style="font-size:0.85rem;font-weight:500;${proc.actionCompleted ? 'text-decoration:line-through;color:#888;' : ''}">${proc.actionRequired}</span>
                </div>
                ${proc.actionDeadline ? '<div style="font-size:0.75rem;color:' + (isOverdue ? '#C62828' : '#666') + ';margin-top:4px;padding-left:26px;">Deadline: ' + formatDate(proc.actionDeadline) + '</div>' : ''}
              </div>
            ` : ''}
          </div>
        `;
      });
    }

    html += '</div>';

    // FAB for adding proceedings (admin only)
    if (isAdmin) {
      html += `
        <button onclick="location.hash='#/cases/${caseData.caseId}/proceedings/new'" style="position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#1565C0;color:#fff;border:none;font-size:1.8rem;box-shadow:0 4px 12px rgba(0,0,0,0.3);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:100;">+</button>
      `;
    }

    return html;
  }

  function renderComplianceTab(caseData, complianceItems) {
    const isAdmin = window.Auth && window.Auth.isAdmin();

    let html = '<div class="compliance-list" style="display:flex;flex-direction:column;gap:12px;">';

    if (!complianceItems || complianceItems.length === 0) {
      html += '<div style="padding:24px;text-align:center;color:#888;">No compliance items.<br><span style="font-family:\'Noto Nastaliq Urdu\',serif;">کوئی تعمیل آئٹم نہیں</span></div>';
    } else {
      complianceItems.forEach(item => {
        const isPending = item.status === 'Pending';
        const statusColor = isPending ? '#F57F17' : '#2E7D32';
        const statusLabel = isPending ? 'Pending' : 'Completed';

        html += `
          <div style="padding:14px;background:#fff;border-radius:10px;border:1px solid #e0e0e0;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
              <div style="flex:1;font-size:0.92rem;color:#333;font-weight:500;">${item.description || '—'}</div>
              <span style="background:${statusColor};color:#fff;padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:600;white-space:nowrap;margin-left:8px;">${statusLabel}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;color:#666;">
              <span>Deadline: ${formatDate(item.deadline)}</span>
              ${item.dateCompleted ? '<span>Completed: ' + formatDate(item.dateCompleted) + '</span>' : ''}
            </div>
            ${isAdmin ? `
              <div style="margin-top:10px;text-align:right;">
                <button class="compliance-toggle-btn" data-id="${item.id}" data-status="${item.status}" style="padding:6px 14px;border-radius:6px;border:1px solid ${isPending ? '#2E7D32' : '#F57F17'};background:${isPending ? '#E8F5E9' : '#FFF8E1'};color:${isPending ? '#2E7D32' : '#F57F17'};font-size:0.8rem;font-weight:600;cursor:pointer;">
                  ${isPending ? 'Mark Completed' : 'Mark Pending'}
                </button>
              </div>
            ` : ''}
          </div>
        `;
      });
    }

    html += '</div>';

    // Add compliance button (admin only)
    if (isAdmin) {
      html += `
        <button onclick="location.hash='#/cases/${caseData.caseId}/compliance/new'" style="position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:#6A1B9A;color:#fff;border:none;font-size:1.8rem;box-shadow:0 4px 12px rgba(0,0,0,0.3);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:100;">+</button>
      `;
    }

    return html;
  }

  async function render(container, caseId) {
    const isAdmin = window.Auth && window.Auth.isAdmin();
    const isViewer = !isAdmin;

    // Fetch data
    let caseData, proceedings, complianceItems;
    try {
      caseData = await window.DB.getCase(caseId);
      proceedings = await window.DB.getProceedings(caseId);
      complianceItems = await window.DB.getCompliance(caseId);
    } catch (e) {
      container.innerHTML = '<div style="padding:24px;text-align:center;color:#C62828;">Error loading case data.</div>';
      return;
    }

    if (!caseData) {
      container.innerHTML = '<div style="padding:24px;text-align:center;color:#C62828;">Case not found.</div>';
      return;
    }

    const procCount = (proceedings && proceedings.length) || 0;
    const compCount = (complianceItems && complianceItems.length) || 0;
    const statusColor = getStatusColor(caseData.status);

    container.innerHTML = `
      <div class="case-detail-screen" style="max-width:800px;margin:0 auto;padding:16px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <button onclick="location.hash='#/cases'" style="background:none;border:none;font-size:1.3rem;cursor:pointer;padding:8px 12px;color:#333;border-radius:8px;">&#8592; Back</button>
          ${!isViewer ? '<button onclick="location.hash=\'#/cases/' + caseId + '/edit\'" style="padding:8px 16px;background:#2E7D32;color:#fff;border:none;border-radius:8px;font-weight:600;font-size:0.85rem;cursor:pointer;">Edit</button>' : ''}
        </div>

        <!-- Case ID Badge -->
        <div style="text-align:center;margin-bottom:12px;">
          <span style="font-family:monospace;font-size:1.1rem;background:#F5F5F5;padding:6px 16px;border-radius:6px;border:1px solid #e0e0e0;">${caseData.caseId || caseId}</span>
        </div>

        <!-- Status Badge -->
        <div style="text-align:center;margin-bottom:20px;">
          <span style="display:inline-block;background:${statusColor};color:#fff;padding:8px 24px;border-radius:20px;font-size:1rem;font-weight:700;letter-spacing:0.5px;">${caseData.status || 'Unknown'}</span>
        </div>

        <!-- Tabs -->
        <div class="tabs-container" style="margin-bottom:16px;">
          <div class="tab-buttons" style="display:flex;border-bottom:2px solid #e0e0e0;gap:0;">
            <button class="tab-btn active" data-tab="profile" style="flex:1;padding:12px 8px;border:none;background:none;font-weight:600;font-size:0.85rem;cursor:pointer;border-bottom:3px solid #1565C0;color:#1565C0;">Profile | &#x67E;&#x631;&#x648;&#x641;&#x627;&#x626;&#x644;</button>
            <button class="tab-btn" data-tab="proceedings" style="flex:1;padding:12px 8px;border:none;background:none;font-weight:600;font-size:0.85rem;cursor:pointer;color:#666;">Proceedings | &#x6A9;&#x627;&#x631;&#x631;&#x648;&#x627;&#x626;&#x6CC; <span style="background:#1565C0;color:#fff;border-radius:10px;padding:1px 7px;font-size:0.7rem;margin-left:4px;">${procCount}</span></button>
            <button class="tab-btn" data-tab="compliance" style="flex:1;padding:12px 8px;border:none;background:none;font-weight:600;font-size:0.85rem;cursor:pointer;color:#666;">Compliance | &#x62A;&#x639;&#x645;&#x6CC;&#x644; <span style="background:#6A1B9A;color:#fff;border-radius:10px;padding:1px 7px;font-size:0.7rem;margin-left:4px;">${compCount}</span></button>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="tab-content" id="tab-content-profile" style="display:block;">
          ${renderProfileTab(caseData)}
        </div>
        <div class="tab-content" id="tab-content-proceedings" style="display:none;">
          ${renderProceedingsTab(caseData, proceedings)}
        </div>
        <div class="tab-content" id="tab-content-compliance" style="display:none;">
          ${renderComplianceTab(caseData, complianceItems)}
        </div>
      </div>
    `;

    // Tab switching
    const tabBtns = container.querySelectorAll('.tab-btn');
    const tabContents = container.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => {
          b.style.borderBottom = 'none';
          b.style.color = '#666';
          b.classList.remove('active');
        });
        btn.style.borderBottom = '3px solid #1565C0';
        btn.style.color = '#1565C0';
        btn.classList.add('active');

        tabContents.forEach(tc => tc.style.display = 'none');
        const target = btn.getAttribute('data-tab');
        const targetEl = container.querySelector('#tab-content-' + target);
        if (targetEl) targetEl.style.display = 'block';
      });
    });

    // Delete case handler
    const deleteBtn = container.querySelector('.btn-delete-case');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const confirmed = confirm("Are you sure you want to delete this case?\n\nکیا آپ واقعی حذف کرنا چاہتے ہیں؟");
        if (confirmed) {
          try {
            await window.DB.softDeleteCase(caseId);
            location.hash = '#/cases';
          } catch (e) {
            alert('Error deleting case.');
          }
        }
      });
    }

    // Action checkbox handlers (proceedings)
    if (isAdmin) {
      container.querySelectorAll('.action-checkbox').forEach(cb => {
        cb.addEventListener('change', async (e) => {
          const procId = e.target.getAttribute('data-id');
          const completed = e.target.checked;
          try {
            await window.DB.updateProceeding(procId, { actionCompleted: completed });
          } catch (err) {
            console.error('Error updating proceeding:', err);
            e.target.checked = !completed;
          }
        });
      });

      // Compliance toggle handlers
      container.querySelectorAll('.compliance-toggle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const itemId = btn.getAttribute('data-id');
          const currentStatus = btn.getAttribute('data-status');
          const newStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';
          const update = { status: newStatus };
          if (newStatus === 'Completed') {
            update.dateCompleted = new Date().toISOString().split('T')[0];
          } else {
            update.dateCompleted = null;
          }
          try {
            await window.DB.updateCompliance(itemId, update);
            // Re-render
            render(container, caseId);
          } catch (err) {
            console.error('Error updating compliance:', err);
          }
        });
      });
    }
  }

  window.CaseDetailScreen = { render };
})();
