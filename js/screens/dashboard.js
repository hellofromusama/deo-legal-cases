/**
 * Dashboard Screen - DEO Legal Case Management PWA
 * Renders the main dashboard with summary cards, upcoming hearings,
 * overdue replies, recent activity, and compliance due sections.
 */
(function () {
  'use strict';

  // Status badge color map
  const STATUS_COLORS = {
    Active: '#2E7D32',
    Stay: '#C62828',
    Decided: '#1565C0',
    Dismissed: '#6D4C41',
    'Compliance Pending': '#6A1B9A',
    Adjourned: '#F57F17'
  };

  // ─── Helper Functions ────────────────────────────────────────────────

  function timeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return days === 1 ? '1 day ago' : days + ' days ago';
    if (hours > 0) return hours === 1 ? '1 hour ago' : hours + ' hours ago';
    if (minutes > 0) return minutes === 1 ? '1 minute ago' : minutes + ' minutes ago';
    return 'Just now';
  }

  function daysBetween(dateA, dateB) {
    const a = new Date(dateA);
    const b = new Date(dateB);
    a.setHours(0, 0, 0, 0);
    b.setHours(0, 0, 0, 0);
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
  }

  function formatDateEnglish(date) {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }).format(new Date(date));
  }

  function formatDateUrdu(date) {
    return new Intl.DateTimeFormat('ur-PK', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }).format(new Date(date));
  }

  function daysRemainingLabel(days) {
    if (days === 0) return '<span style="color:#C62828;font-weight:700">Today</span>';
    if (days === 1) return '<span style="color:#E65100;font-weight:600">Tomorrow</span>';
    return days + ' days';
  }

  function statusBadge(status) {
    const color = STATUS_COLORS[status] || '#757575';
    return '<span style="display:inline-block;padding:2px 8px;border-radius:12px;' +
      'font-size:0.75rem;color:#fff;background:' + color + '">' + (status || 'Unknown') + '</span>';
  }

  function skeletonCard() {
    return '<div class="skeleton-card" style="background:#e0e0e0;border-radius:12px;' +
      'height:90px;animation:pulse 1.2s infinite"></div>';
  }

  function skeletonList(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += '<div style="background:#e0e0e0;border-radius:8px;height:56px;' +
        'margin-bottom:8px;animation:pulse 1.2s infinite"></div>';
    }
    return html;
  }

  // ─── Render Function ─────────────────────────────────────────────────

  function render(container) {
    const today = new Date();

    // Inject keyframe for skeleton loader
    if (!document.getElementById('dashboard-skeleton-style')) {
      const style = document.createElement('style');
      style.id = 'dashboard-skeleton-style';
      style.textContent = '@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}';
      document.head.appendChild(style);
    }

    // Show skeleton while loading
    container.innerHTML = buildSkeleton();

    // Load data from DB
    loadData().then(function (data) {
      container.innerHTML = buildDashboard(data, today);
      attachEvents(container);
    }).catch(function () {
      container.innerHTML = buildDashboard({ cases: [] }, today);
    });
  }

  function loadData() {
    return new Promise(function (resolve) {
      var db = window.DB;
      if (db && typeof db.getAllCases === 'function') {
        Promise.resolve(db.getAllCases()).then(function (cases) {
          resolve({ cases: cases || [] });
        }).catch(function () {
          resolve({ cases: [] });
        });
      } else if (db && db.cases) {
        resolve({ cases: db.cases || [] });
      } else {
        resolve({ cases: [] });
      }
    });
  }

  function buildSkeleton() {
    return '<div style="padding:16px">' +
      '<div style="background:#e0e0e0;height:32px;width:60%;border-radius:8px;margin-bottom:8px;animation:pulse 1.2s infinite"></div>' +
      '<div style="background:#e0e0e0;height:20px;width:40%;border-radius:8px;margin-bottom:24px;animation:pulse 1.2s infinite"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">' +
      skeletonCard() + skeletonCard() + skeletonCard() + skeletonCard() +
      '</div>' +
      skeletonList(4) +
      '</div>';
  }

  function buildDashboard(data, today) {
    var cases = data.cases;
    var html = '';

    // ── Header ──
    html += '<div style="padding:16px 16px 0">';
    html += '<h1 style="margin:0;font-size:1.5rem;color:#1a237e">Dashboard | \u0688\u06CC\u0634 \u0628\u0648\u0631\u0688</h1>';
    html += '<p style="margin:4px 0 0;color:#555;font-size:0.9rem">' +
      formatDateEnglish(today) + ' | ' + formatDateUrdu(today) + '</p>';
    html += '</div>';

    // ── Summary Cards ──
    var totalCases = cases.length;
    var activeCases = cases.filter(function (c) { return c.status === 'Active'; }).length;
    var stayCases = cases.filter(function (c) { return c.status === 'Stay'; }).length;
    var pendingCompliance = cases.filter(function (c) {
      return c.complianceStatus === 'Pending';
    }).length;

    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:16px">';
    html += summaryCard('\u06A9\u0644 \u0645\u0642\u062F\u0645\u0627\u062A', 'Total Cases', totalCases, '#1565C0');
    html += summaryCard('\u0632\u06CC\u0631 \u0633\u0645\u0627\u0639\u062A \u0645\u0642\u062F\u0645\u0627\u062A', 'Active Cases', activeCases, '#2E7D32');
    html += summaryCard('\u0627\u0645\u062A\u0646\u0627\u0639\u06CC \u0627\u062D\u06A9\u0627\u0645\u0627\u062A', 'Stay Orders', stayCases, '#C62828');
    html += summaryCard('\u0632\u06CC\u0631 \u0627\u0644\u062A\u0648\u0627 \u062A\u0639\u0645\u06CC\u0644', 'Pending Compliance', pendingCompliance, '#6A1B9A');
    html += '</div>';

    // ── Upcoming Hearings ──
    var sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    var upcomingHearings = cases.filter(function (c) {
      if (!c.nextHearingDate) return false;
      var hDate = new Date(c.nextHearingDate);
      return hDate >= today && hDate <= sevenDaysLater;
    }).sort(function (a, b) {
      return new Date(a.nextHearingDate) - new Date(b.nextHearingDate);
    });

    html += '<div style="padding:0 16px 16px">';
    html += '<h2 style="font-size:1.1rem;margin:0 0 12px;color:#333">' +
      'Upcoming Hearings (Next 7 Days) | \u0627\u06AF\u0644\u06D2 \u0633\u0627\u062A \u062F\u0646\u0648\u06BA \u0645\u06CC\u06BA \u0633\u0645\u0627\u0639\u062A</h2>';

    if (upcomingHearings.length === 0) {
      html += '<div style="text-align:center;padding:24px;color:#888;background:#f5f5f5;border-radius:12px">';
      html += '<div style="font-size:2rem;margin-bottom:8px">\uD83D\uDCC5</div>';
      html += '<p style="margin:0">No hearings in the next 7 days</p>';
      html += '</div>';
    } else {
      html += '<div style="display:flex;overflow-x:auto;gap:12px;padding-bottom:8px;-webkit-overflow-scrolling:touch">';
      upcomingHearings.forEach(function (c) {
        var days = daysBetween(today, c.nextHearingDate);
        html += '<div class="hearing-card" data-case-id="' + (c.id || '') + '" style="' +
          'min-width:220px;max-width:260px;flex-shrink:0;padding:14px;' +
          'background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);' +
          'border-left:4px solid #1565C0;cursor:pointer">';
        html += '<div style="font-weight:600;font-size:0.95rem;margin-bottom:6px;color:#212121">' +
          (c.title || c.caseTitle || 'Untitled') + '</div>';
        html += '<div style="font-size:0.8rem;color:#666;margin-bottom:4px">' +
          (c.courtName || c.court || '') + '</div>';
        html += '<div style="font-size:0.8rem;color:#444;margin-bottom:4px">' +
          formatDateEnglish(c.nextHearingDate) + '</div>';
        html += '<div style="font-size:0.85rem">' + daysRemainingLabel(days) + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>';

    // ── Overdue Replies ──
    var overdueReplies = cases.filter(function (c) {
      if (!c.replyDeadline) return false;
      return new Date(c.replyDeadline) < today && c.replyFiled === false;
    }).sort(function (a, b) {
      return new Date(a.replyDeadline) - new Date(b.replyDeadline);
    });

    html += '<div style="padding:0 16px 16px">';
    html += '<h2 style="font-size:1.1rem;margin:0 0 12px;color:#333">' +
      'Overdue Replies | \u062C\u0646 \u0645\u0642\u062F\u0645\u0627\u062A \u0645\u06CC\u06BA \u062C\u0648\u0627\u0628 \u06A9\u06CC \u062A\u0627\u0631\u06CC\u062E \u06AF\u0632\u0631 \u0686\u06A9\u06CC \u06C1\u06D2</h2>';

    if (overdueReplies.length === 0) {
      html += '<p style="color:#888;font-size:0.9rem;margin:0">No overdue replies.</p>';
    } else {
      html += '<div style="border:2px solid #C62828;border-radius:12px;overflow:hidden">';
      overdueReplies.forEach(function (c, i) {
        var overdueDays = daysBetween(c.replyDeadline, today);
        var border = i > 0 ? 'border-top:1px solid #ffcdd2;' : '';
        html += '<div style="padding:12px 14px;' + border + 'background:#fff5f5">';
        html += '<div style="font-weight:600;font-size:0.9rem;color:#212121">' +
          (c.title || c.caseTitle || 'Untitled') + '</div>';
        html += '<div style="font-size:0.8rem;color:#C62828;font-weight:600;margin-top:4px">' +
          overdueDays + ' day' + (overdueDays !== 1 ? 's' : '') + ' overdue</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>';

    // ── Recent Activity ──
    var recentCases = cases.slice().filter(function (c) { return c.updatedAt; })
      .sort(function (a, b) { return new Date(b.updatedAt) - new Date(a.updatedAt); })
      .slice(0, 5);

    html += '<div style="padding:0 16px 16px">';
    html += '<h2 style="font-size:1.1rem;margin:0 0 12px;color:#333">Recent Activity</h2>';

    if (recentCases.length === 0) {
      html += '<p style="color:#888;font-size:0.9rem;margin:0">No recent activity.</p>';
    } else {
      recentCases.forEach(function (c) {
        html += '<div style="display:flex;align-items:center;justify-content:space-between;' +
          'padding:10px 14px;background:#fff;border-radius:10px;margin-bottom:8px;' +
          'box-shadow:0 1px 4px rgba(0,0,0,0.06)">';
        html += '<div>';
        html += '<div style="font-weight:600;font-size:0.9rem;color:#212121">' +
          (c.title || c.caseTitle || 'Untitled') + '</div>';
        html += '<div style="font-size:0.75rem;color:#888;margin-top:2px">' + timeAgo(c.updatedAt) + '</div>';
        html += '</div>';
        html += '<div>' + statusBadge(c.status) + '</div>';
        html += '</div>';
      });
    }
    html += '</div>';

    // ── Compliance Due ──
    var fourteenDaysLater = new Date(today);
    fourteenDaysLater.setDate(fourteenDaysLater.getDate() + 14);

    var complianceDue = cases.filter(function (c) {
      if (c.complianceStatus !== 'Pending' || !c.complianceDeadline) return false;
      var d = new Date(c.complianceDeadline);
      return d >= today && d <= fourteenDaysLater;
    }).sort(function (a, b) {
      return new Date(a.complianceDeadline) - new Date(b.complianceDeadline);
    });

    html += '<div style="padding:0 16px 24px">';
    html += '<h2 style="font-size:1.1rem;margin:0 0 12px;color:#333">Compliance Due</h2>';

    if (complianceDue.length === 0) {
      html += '<p style="color:#888;font-size:0.9rem;margin:0">No compliance due in the next 14 days.</p>';
    } else {
      complianceDue.forEach(function (c) {
        var daysLeft = daysBetween(today, c.complianceDeadline);
        html += '<div style="padding:10px 14px;background:#f3e5f5;border-left:4px solid #6A1B9A;' +
          'border-radius:8px;margin-bottom:8px">';
        html += '<div style="font-weight:600;font-size:0.9rem;color:#212121">' +
          (c.title || c.caseTitle || 'Untitled') + '</div>';
        html += '<div style="font-size:0.8rem;color:#6A1B9A;margin-top:4px">' +
          'Due in ' + daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') +
          ' (' + formatDateEnglish(c.complianceDeadline) + ')</div>';
        html += '</div>';
      });
    }
    html += '</div>';

    return html;
  }

  function summaryCard(urduLabel, engLabel, count, color) {
    return '<div style="background:#fff;border-radius:12px;padding:14px;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.07);position:relative;overflow:hidden">' +
      '<div style="position:absolute;top:0;right:0;width:6px;height:100%;background:' + color + '"></div>' +
      '<div style="font-size:1.6rem;font-weight:700;color:' + color + '">' + count + '</div>' +
      '<div style="font-size:0.8rem;color:#555;margin-top:4px">' + engLabel + '</div>' +
      '<div style="font-size:0.8rem;color:#777;direction:rtl">' + urduLabel + '</div>' +
      '</div>';
  }

  function attachEvents(container) {
    var cards = container.querySelectorAll('.hearing-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        var caseId = card.getAttribute('data-case-id');
        if (caseId && window.App && typeof window.App.navigate === 'function') {
          window.App.navigate('case-detail', { id: caseId });
        }
      });
    });
  }

  // ─── Expose ───────────────────────────────────────────────────────────

  window.DashboardScreen = {
    render: render
  };

})();
