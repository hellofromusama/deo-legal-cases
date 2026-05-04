/**
 * Case List Screen - DEO Legal Case Management PWA
 */
window.CaseListScreen = (function () {
  'use strict';

  const STATUS_COLORS = {
    Active: '#2E7D32',
    Stay: '#C62828',
    Decided: '#1565C0',
    Dismissed: '#6D4C41',
    'Compliance Pending': '#6A1B9A',
    Adjourned: '#F57F17'
  };

  const COURT_FILTERS = [
    'Civil', 'District', 'Services Tribunal', 'High Court',
    'Supreme Court', 'AJK Ombudsman', 'Federal Ombudsman'
  ];

  const STATUS_FILTERS = [
    'Active', 'Stay', 'Decided', 'Dismissed', 'Compliance Pending', 'Adjourned'
  ];

  const PAGE_SIZE = 20;

  let state = {
    allCases: [],
    filtered: [],
    searchQuery: '',
    activeFilters: new Set(),
    sortBy: 'newest',
    page: 1,
    observer: null
  };

  function render(container) {
    container.innerHTML = '';
    state = {
      allCases: [],
      filtered: [],
      searchQuery: '',
      activeFilters: new Set(),
      sortBy: 'newest',
      page: 1,
      observer: null
    };

    const wrapper = document.createElement('div');
    wrapper.className = 'case-list-screen';
    wrapper.innerHTML = `
      <style>${getStyles()}</style>
      <div class="cl-header">
        <h1 class="cl-title">All Cases | \u062A\u0645\u0627\u0645 \u0645\u0642\u062F\u0645\u0627\u062A <span class="cl-count-badge">0</span></h1>
      </div>
      <div class="cl-search-wrap">
        <input type="text" class="cl-search" placeholder="Search cases\u2026 | \u0645\u0642\u062F\u0645\u0627\u062A \u062A\u0644\u0627\u0634 \u06A9\u0631\u06CC\u06BA" />
      </div>
      <div class="cl-filter-bar">
        <button class="cl-chip cl-chip--active" data-filter="all">All</button>
        ${COURT_FILTERS.map(f => `<button class="cl-chip" data-filter="court:${f}">${f}</button>`).join('')}
        ${STATUS_FILTERS.map(f => `<button class="cl-chip" data-filter="status:${f}">${f}</button>`).join('')}
      </div>
      <div class="cl-sort-bar">
        <button class="cl-sort-btn cl-sort-btn--active" data-sort="newest">Newest</button>
        <button class="cl-sort-btn" data-sort="hearing">Hearing Date</button>
        <button class="cl-sort-btn" data-sort="status">Status</button>
      </div>
      <div class="cl-case-list"></div>
      <div class="cl-sentinel"></div>
      <div class="cl-empty" style="display:none;">
        <div class="cl-empty-icon">&#128194;</div>
        <p>No cases found</p>
        <button class="cl-empty-btn">Add your first case</button>
      </div>
    `;

    container.appendChild(wrapper);

    // FAB
    if (window.Auth && window.Auth.isAdmin && window.Auth.isAdmin()) {
      const fab = document.createElement('button');
      fab.className = 'cl-fab';
      fab.textContent = '+';
      fab.addEventListener('click', () => { window.location.hash = '#/cases/new'; });
      wrapper.appendChild(fab);
    }

    bindEvents(wrapper);
    loadCases(wrapper);
  }

  function bindEvents(wrapper) {
    const searchInput = wrapper.querySelector('.cl-search');
    searchInput.addEventListener('input', () => {
      state.searchQuery = searchInput.value.trim().toLowerCase();
      state.page = 1;
      applyFilters(wrapper);
    });

    wrapper.querySelector('.cl-filter-bar').addEventListener('click', (e) => {
      const chip = e.target.closest('.cl-chip');
      if (!chip) return;
      const filter = chip.dataset.filter;

      if (filter === 'all') {
        state.activeFilters.clear();
        wrapper.querySelectorAll('.cl-chip').forEach(c => c.classList.remove('cl-chip--active'));
        chip.classList.add('cl-chip--active');
      } else {
        const allChip = wrapper.querySelector('.cl-chip[data-filter="all"]');
        allChip.classList.remove('cl-chip--active');
        chip.classList.toggle('cl-chip--active');
        if (state.activeFilters.has(filter)) {
          state.activeFilters.delete(filter);
        } else {
          state.activeFilters.add(filter);
        }
        if (state.activeFilters.size === 0) {
          allChip.classList.add('cl-chip--active');
        }
      }
      state.page = 1;
      applyFilters(wrapper);
    });

    wrapper.querySelector('.cl-sort-bar').addEventListener('click', (e) => {
      const btn = e.target.closest('.cl-sort-btn');
      if (!btn) return;
      wrapper.querySelectorAll('.cl-sort-btn').forEach(b => b.classList.remove('cl-sort-btn--active'));
      btn.classList.add('cl-sort-btn--active');
      state.sortBy = btn.dataset.sort;
      state.page = 1;
      applyFilters(wrapper);
    });

    wrapper.querySelector('.cl-empty-btn').addEventListener('click', () => {
      window.location.hash = '#/cases/new';
    });

    // Infinite scroll
    const sentinel = wrapper.querySelector('.cl-sentinel');
    state.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && state.page * PAGE_SIZE < state.filtered.length) {
        state.page++;
        renderCases(wrapper, true);
      }
    }, { root: null, threshold: 0.1 });
    state.observer.observe(sentinel);
  }

  async function loadCases(wrapper) {
    try {
      state.allCases = await window.DB.getAllCases();
    } catch (e) {
      state.allCases = [];
    }
    applyFilters(wrapper);
  }

  function applyFilters(wrapper) {
    let cases = [...state.allCases];

    // Search
    if (state.searchQuery) {
      const q = state.searchQuery;
      cases = cases.filter(c =>
        (c.caseTitle || '').toLowerCase().includes(q) ||
        (c.caseNumber || '').toLowerCase().includes(q) ||
        (c.petitionerName || '').toLowerCase().includes(q) ||
        (c.respondentName || '').toLowerCase().includes(q) ||
        (c.counselName || '').toLowerCase().includes(q)
      );
    }

    // Filters
    if (state.activeFilters.size > 0) {
      const courtFilters = [];
      const statusFilters = [];
      state.activeFilters.forEach(f => {
        if (f.startsWith('court:')) courtFilters.push(f.replace('court:', ''));
        if (f.startsWith('status:')) statusFilters.push(f.replace('status:', ''));
      });
      if (courtFilters.length > 0) {
        cases = cases.filter(c => courtFilters.includes(c.court));
      }
      if (statusFilters.length > 0) {
        cases = cases.filter(c => statusFilters.includes(c.status));
      }
    }

    // Sort
    cases.sort((a, b) => {
      if (state.sortBy === 'newest') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      } else if (state.sortBy === 'hearing') {
        const da = a.nextHearingDate ? new Date(a.nextHearingDate).getTime() : Infinity;
        const db = b.nextHearingDate ? new Date(b.nextHearingDate).getTime() : Infinity;
        return da - db;
      } else if (state.sortBy === 'status') {
        return (a.status || '').localeCompare(b.status || '');
      }
      return 0;
    });

    state.filtered = cases;
    wrapper.querySelector('.cl-count-badge').textContent = cases.length;
    renderCases(wrapper, false);
  }

  function renderCases(wrapper, append) {
    const listEl = wrapper.querySelector('.cl-case-list');
    const emptyEl = wrapper.querySelector('.cl-empty');

    if (!append) listEl.innerHTML = '';

    const start = append ? (state.page - 1) * PAGE_SIZE : 0;
    const end = state.page * PAGE_SIZE;
    const slice = state.filtered.slice(start, end);

    if (state.filtered.length === 0) {
      emptyEl.style.display = 'flex';
      listEl.style.display = 'none';
      return;
    } else {
      emptyEl.style.display = 'none';
      listEl.style.display = 'block';
    }

    slice.forEach(c => {
      const card = document.createElement('div');
      card.className = 'cl-card';
      if (c.status === 'Stay') card.classList.add('cl-card--stay');
      if (isOverdueReply(c)) card.classList.add('cl-card--overdue');

      const statusColor = STATUS_COLORS[c.status] || '#666';
      const hearingInfo = getHearingInfo(c);

      card.innerHTML = `
        <div class="cl-card-row cl-card-top">
          <span class="cl-case-id">${escHtml(c.caseNumber || '')}</span>
          <span class="cl-status-badge" style="background:${statusColor}">${escHtml(c.status || '')}</span>
        </div>
        <div class="cl-card-title">${escHtml(c.caseTitle || '')}</div>
        <div class="cl-card-meta">${escHtml(c.court || '')} \u2022 ${escHtml(c.caseType || '')}</div>
        ${hearingInfo ? `<div class="cl-card-hearing">Next: ${hearingInfo}</div>` : ''}
        ${c.counselName ? `<div class="cl-card-counsel">Counsel: ${escHtml(c.counselName)}</div>` : ''}
      `;

      card.addEventListener('click', () => {
        window.location.hash = `#/cases/${c.id || c.caseId || ''}`;
      });

      listEl.appendChild(card);
    });
  }

  function getHearingInfo(c) {
    if (!c.nextHearingDate) return '';
    const d = new Date(c.nextHearingDate);
    const now = new Date();
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    if (diff < 0) return `${dateStr} (${Math.abs(diff)} days ago)`;
    if (diff === 0) return `${dateStr} (Today)`;
    return `${dateStr} (${diff} days)`;
  }

  function isOverdueReply(c) {
    if (!c.replyDueDate) return false;
    return new Date(c.replyDueDate) < new Date();
  }

  function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getStyles() {
    return `
      .case-list-screen { padding: 16px; padding-bottom: 80px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .cl-header { margin-bottom: 12px; }
      .cl-title { font-size: 1.4rem; margin: 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .cl-count-badge { background: #1976D2; color: #fff; font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; }
      .cl-search-wrap { margin-bottom: 12px; }
      .cl-search { width: 100%; padding: 10px 14px; border: 1px solid #ccc; border-radius: 8px; font-size: 1rem; box-sizing: border-box; }
      .cl-search:focus { outline: none; border-color: #1976D2; box-shadow: 0 0 0 2px rgba(25,118,210,0.15); }
      .cl-filter-bar { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 12px; -webkit-overflow-scrolling: touch; }
      .cl-filter-bar::-webkit-scrollbar { height: 4px; }
      .cl-chip { white-space: nowrap; padding: 6px 14px; border-radius: 20px; border: 1px solid #ccc; background: #fff; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
      .cl-chip--active { background: #1976D2; color: #fff; border-color: #1976D2; }
      .cl-sort-bar { display: flex; gap: 8px; margin-bottom: 14px; }
      .cl-sort-btn { padding: 4px 12px; border: none; background: #eee; border-radius: 6px; font-size: 0.8rem; cursor: pointer; }
      .cl-sort-btn--active { background: #1976D2; color: #fff; }
      .cl-case-list { display: flex; flex-direction: column; gap: 12px; }
      .cl-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 14px; cursor: pointer; transition: box-shadow 0.2s; position: relative; }
      .cl-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      .cl-card--stay { border-left: 4px solid #C62828; }
      .cl-card--overdue::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #FFA000; border-radius: 0 0 10px 10px; }
      .cl-card-row { display: flex; justify-content: space-between; align-items: center; }
      .cl-case-id { font-family: 'Courier New', monospace; font-size: 0.8rem; color: #555; }
      .cl-status-badge { font-size: 0.7rem; color: #fff; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; font-weight: 600; }
      .cl-card-title { font-weight: 700; margin: 6px 0 4px; font-size: 0.95rem; }
      .cl-card-meta { font-size: 0.82rem; color: #666; }
      .cl-card-hearing { font-size: 0.82rem; color: #333; margin-top: 4px; }
      .cl-card-counsel { font-size: 0.78rem; color: #999; margin-top: 4px; }
      .cl-sentinel { height: 1px; }
      .cl-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; }
      .cl-empty-icon { font-size: 3rem; margin-bottom: 12px; }
      .cl-empty-btn { margin-top: 12px; padding: 10px 24px; background: #1976D2; color: #fff; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; }
      .cl-fab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background: #1976D2; color: #fff; font-size: 2rem; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3); cursor: pointer; z-index: 100; display: flex; align-items: center; justify-content: center; }
      .cl-fab:active { transform: scale(0.92); }
    `;
  }

  return { render };
})();
