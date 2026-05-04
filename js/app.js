/**
 * app.js - Main App Bootstrap & Router
 * Legal Case Management PWA
 */
(function () {
  'use strict';

  const routes = [
    { path: '#/login', screen: 'LoginScreen' },
    { path: '#/dashboard', screen: 'DashboardScreen' },
    { path: '#/cases', screen: 'CaseListScreen' },
    { path: '#/cases/new', screen: 'CaseFormScreen' },
    { path: '#/cases/:caseId/edit', screen: 'CaseFormScreen' },
    { path: '#/cases/:caseId/proceedings/new', screen: 'ProceedingsFormScreen' },
    { path: '#/cases/:caseId/compliance/new', screen: 'ComplianceFormScreen' },
    { path: '#/cases/:caseId', screen: 'CaseDetailScreen' },
    { path: '#/search', screen: 'SearchScreen' },
    { path: '#/settings', screen: 'SettingsScreen' }
  ];

  /* ─── Utility: Parse route params ─── */
  function matchRoute(hash) {
    const cleanHash = hash || '#/login';
    for (const route of routes) {
      const params = extractParams(route.path, cleanHash);
      if (params !== null) {
        return { screen: route.screen, params: params };
      }
    }
    return null;
  }

  function extractParams(pattern, hash) {
    const patternParts = pattern.replace('#/', '').split('/');
    const hashParts = hash.replace('#/', '').split('/');

    if (patternParts.length !== hashParts.length) return null;

    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(hashParts[i]);
      } else if (patternParts[i] !== hashParts[i]) {
        return null;
      }
    }
    return params;
  }

  /* ─── Toast Notification System ─── */
  function showToast(message, type) {
    type = type || 'success';
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast toast--' + type;

    const iconMap = {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };

    toast.innerHTML = '<span class="toast__icon">' + (iconMap[type] || '') + '</span><span class="toast__message">' + message + '</span>';
    container.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('toast--visible');
    }, 10);

    setTimeout(function () {
      toast.classList.remove('toast--visible');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3500);
  }

  /* ─── Loading State ─── */
  function showLoading() {
    var el = document.getElementById('loading-overlay');
    if (el) el.classList.add('loading--visible');
  }

  function hideLoading() {
    var el = document.getElementById('loading-overlay');
    if (el) el.classList.remove('loading--visible');
  }

  /* ─── Confirm Dialog ─── */
  function confirm(title, message, onConfirm) {
    var overlay = document.getElementById('confirm-overlay');
    if (!overlay) return;

    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    overlay.classList.add('confirm--visible');

    var btnConfirm = document.getElementById('confirm-btn-yes');
    var btnCancel = document.getElementById('confirm-btn-no');

    function cleanup() {
      overlay.classList.remove('confirm--visible');
      btnConfirm.removeEventListener('click', handleConfirm);
      btnCancel.removeEventListener('click', handleCancel);
    }

    function handleConfirm() {
      cleanup();
      if (onConfirm) onConfirm();
    }

    function handleCancel() {
      cleanup();
    }

    btnConfirm.addEventListener('click', handleConfirm);
    btnCancel.addEventListener('click', handleCancel);
  }

  /* ─── Navigation Helper ─── */
  function navigate(hash) {
    window.location.hash = hash;
  }

  /* ─── Bottom Navigation Bar ─── */
  function renderBottomNav() {
    var nav = document.getElementById('bottom-nav');
    if (!nav) return;

    var currentHash = window.location.hash || '#/dashboard';

    var items = [
      {
        label: 'Dashboard',
        hash: '#/dashboard',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
      },
      {
        label: 'Cases',
        hash: '#/cases',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>'
      },
      {
        label: 'Add',
        hash: '#/cases/new',
        icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
        isCenter: true
      },
      {
        label: 'Search',
        hash: '#/search',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
      },
      {
        label: 'Settings',
        hash: '#/settings',
        icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>'
      }
    ];

    var html = '<nav class="bottom-nav">';
    items.forEach(function (item) {
      var isActive = currentHash === item.hash || (item.hash === '#/cases' && currentHash.startsWith('#/cases') && currentHash !== '#/cases/new');
      if (item.isCenter) {
        html += '<a href="' + item.hash + '" class="bottom-nav__item bottom-nav__item--center">';
        html += '<span class="bottom-nav__add-btn">' + item.icon + '</span>';
        html += '<span class="bottom-nav__label">' + item.label + '</span>';
        html += '</a>';
      } else {
        html += '<a href="' + item.hash + '" class="bottom-nav__item' + (isActive ? ' bottom-nav__item--active' : '') + '">';
        html += '<span class="bottom-nav__icon">' + item.icon + '</span>';
        html += '<span class="bottom-nav__label">' + item.label + '</span>';
        html += '</a>';
      }
    });
    html += '</nav>';
    nav.innerHTML = html;
  }

  /* ─── Sync Status Indicator ─── */
  function renderSyncStatus(status) {
    var el = document.getElementById('sync-status');
    if (!el) return;

    var icons = {
      synced: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4caf50" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      syncing: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cfaa45" stroke-width="2" class="spin"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
      offline: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/><path d="M5 12.55a10.94 10.94 0 015.17-2.39"/><path d="M10.71 5.05A16 16 0 0122.56 9"/><path d="M1.42 9a15.91 15.91 0 014.7-2.88"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
      error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f44336" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    };

    var labels = {
      synced: 'Synced',
      syncing: 'Syncing...',
      offline: 'Offline',
      error: 'Sync Error'
    };

    el.innerHTML = '<span class="sync-status sync-status--' + status + '">' +
      (icons[status] || '') + ' <span>' + (labels[status] || '') + '</span></span>';
  }

  /* ─── Viewer Mode Banner ─── */
  function renderViewerBanner() {
    var banner = document.getElementById('viewer-banner');
    if (!banner) return;

    var auth = window.Auth && window.Auth.getUser ? window.Auth.getUser() : null;
    if (auth && auth.role === 'viewer') {
      banner.innerHTML = '<div class="viewer-banner">You are in view-only mode. Editing is disabled.</div>';
      banner.style.display = 'block';
    } else {
      banner.innerHTML = '';
      banner.style.display = 'none';
    }
  }

  /* ─── Router ─── */
  function handleRoute() {
    var hash = window.location.hash || '';
    var isAuthenticated = window.Auth && window.Auth.getCurrentRole ? !!window.Auth.getCurrentRole() : false;

    // Redirect logic
    if (!isAuthenticated && hash !== '#/login') {
      window.location.hash = '#/login';
      return;
    }
    if (isAuthenticated && (hash === '#/login' || hash === '' || hash === '#/')) {
      window.location.hash = '#/dashboard';
      return;
    }

    var matched = matchRoute(hash);
    if (!matched) {
      window.location.hash = isAuthenticated ? '#/dashboard' : '#/login';
      return;
    }

    // Render screen
    var screenModule = window[matched.screen];
    if (screenModule && typeof screenModule.render === 'function') {
      var appContent = document.getElementById('app-content');
      if (appContent) appContent.innerHTML = '';
      var caseId = matched.params && matched.params.caseId ? matched.params.caseId : null;
      screenModule.render(appContent, caseId);
    }

    // Update navigation
    if (isAuthenticated && hash !== '#/login') {
      document.getElementById('bottom-nav').style.display = 'block';
      renderBottomNav();
      renderViewerBanner();
    } else {
      document.getElementById('bottom-nav').style.display = 'none';
      var banner = document.getElementById('viewer-banner');
      if (banner) banner.style.display = 'none';
    }
  }

  /* ─── Service Worker Registration ─── */
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      var swPath = (window.location.pathname.includes('/deo-legal-cases') ? '/deo-legal-cases/' : '/') + 'sw.js';
      navigator.serviceWorker.register(swPath).then(function (reg) {
        console.log('[App] Service Worker registered, scope:', reg.scope);
      }).catch(function (err) {
        console.warn('[App] Service Worker registration failed:', err);
      });
    }
  }

  /* ─── App Initialization ─── */
  async function init() {
    try {
      // 1. Register the service worker
      registerServiceWorker();

      // 2. Initialize IndexedDB
      if (window.DB && window.DB.initDB) {
        await window.DB.initDB();
      }

      // 3. Check auth state
      if (window.Auth && window.Auth.initAuth) {
        await window.Auth.initAuth();
      }

      // 4. Initialize sync engine
      if (window.Sync && window.Sync.init) {
        await window.Sync.init();
      }

      // 5. Set up the router FIRST (so app is interactive immediately)
      // Notifications will be initialized after login
      window.addEventListener('hashchange', handleRoute);
      handleRoute();

      // 7. Listen for sync status changes
      window.addEventListener('sync-status-changed', function (e) {
        var status = e.detail && e.detail.status ? e.detail.status : 'offline';
        renderSyncStatus(status);
      });

      // Initial sync status
      renderSyncStatus('synced');

      console.log('[App] Initialized successfully');
    } catch (err) {
      console.error('[App] Initialization error:', err);
      showToast('App initialization failed. Please reload.', 'error');
    }
  }

  /* ─── Expose on window.App ─── */
  window.App = {
    init: init,
    navigate: navigate,
    showToast: showToast,
    showLoading: showLoading,
    hideLoading: hideLoading,
    confirm: confirm,
    renderSyncStatus: renderSyncStatus,
    renderBottomNav: renderBottomNav
  };

  /* ─── Boot on DOM ready ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
