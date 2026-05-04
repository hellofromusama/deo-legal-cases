window.SearchScreen = {
  render(container) {
    const recentSearches = JSON.parse(localStorage.getItem('deo_recent_searches') || '[]');

    container.innerHTML = `
      <div class="search-screen">
        <div class="search-header">
          <div class="search-input-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" id="search-input" class="search-input"
                   placeholder="Search cases… | مقدمات تلاش کریں" autocomplete="off">
            <button id="search-clear-btn" class="search-clear-btn" style="display:none;">&times;</button>
          </div>
        </div>

        <div class="search-filters" id="search-filters">
          <span class="filter-chip active" data-filter="all">All</span>
          <span class="filter-chip" data-filter="highCourt">High Court</span>
          <span class="filter-chip" data-filter="supremeCourt">Supreme Court</span>
          <span class="filter-chip" data-filter="tribunal">Tribunal</span>
          <span class="filter-chip" data-filter="pending">Pending</span>
          <span class="filter-chip" data-filter="decided">Decided</span>
          <span class="filter-chip" data-filter="adjourned">Adjourned</span>
        </div>

        <div id="recent-searches" class="recent-searches">
          <p class="recent-label">Recent Searches | حالیہ تلاش</p>
          <div class="recent-chips">
            ${recentSearches.map(s => `<span class="recent-chip">${s}</span>`).join('')}
          </div>
        </div>

        <div id="search-results" class="search-results"></div>
      </div>
    `;

    const input = container.querySelector('#search-input');
    const clearBtn = container.querySelector('#search-clear-btn');
    const resultsContainer = container.querySelector('#search-results');
    const recentContainer = container.querySelector('#recent-searches');
    const filtersContainer = container.querySelector('#search-filters');

    let activeFilter = 'all';

    // Auto-focus
    setTimeout(() => input.focus(), 100);

    // Filter chips
    filtersContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-chip')) {
        filtersContainer.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        activeFilter = e.target.dataset.filter;
        performSearch(input.value.trim());
      }
    });

    // Recent search chips
    recentContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('recent-chip')) {
        input.value = e.target.textContent;
        clearBtn.style.display = 'block';
        performSearch(e.target.textContent);
      }
    });

    // Input events
    input.addEventListener('input', () => {
      const query = input.value.trim();
      clearBtn.style.display = query ? 'block' : 'none';
      if (query) {
        recentContainer.style.display = 'none';
        performSearch(query);
      } else {
        recentContainer.style.display = 'block';
        resultsContainer.innerHTML = '';
      }
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      recentContainer.style.display = 'block';
      resultsContainer.innerHTML = '';
      input.focus();
    });

    // Save recent search on Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        saveRecentSearch(input.value.trim());
      }
    });

    function saveRecentSearch(query) {
      let recent = JSON.parse(localStorage.getItem('deo_recent_searches') || '[]');
      recent = recent.filter(s => s !== query);
      recent.unshift(query);
      recent = recent.slice(0, 5);
      localStorage.setItem('deo_recent_searches', JSON.stringify(recent));
    }

    function performSearch(query) {
      const cases = window.DB ? window.DB.getAllCases() : [];
      const lowerQuery = query.toLowerCase();

      // Apply court/status filter
      let filtered = cases;
      if (activeFilter !== 'all') {
        filtered = cases.filter(c => {
          if (activeFilter === 'pending' || activeFilter === 'decided' || activeFilter === 'adjourned') {
            return (c.status || '').toLowerCase() === activeFilter;
          }
          return (c.court || '').toLowerCase().replace(/\s+/g, '') === activeFilter.toLowerCase();
        });
      }

      // Group results by match type
      const groups = {
        'Case Title': [],
        'Case Number': [],
        'Parties': [],
        'Counsel': []
      };

      filtered.forEach(c => {
        if ((c.caseTitle || '').toLowerCase().includes(lowerQuery)) {
          groups['Case Title'].push({ case: c, field: 'caseTitle', value: c.caseTitle });
        }
        if ((c.caseNumber || '').toLowerCase().includes(lowerQuery)) {
          groups['Case Number'].push({ case: c, field: 'caseNumber', value: c.caseNumber });
        }
        if ((c.petitionerName || '').toLowerCase().includes(lowerQuery) ||
            (c.respondentName || '').toLowerCase().includes(lowerQuery)) {
          const matched = (c.petitionerName || '').toLowerCase().includes(lowerQuery)
            ? c.petitionerName : c.respondentName;
          groups['Parties'].push({ case: c, field: 'parties', value: matched });
        }
        if ((c.counselName || '').toLowerCase().includes(lowerQuery)) {
          groups['Counsel'].push({ case: c, field: 'counselName', value: c.counselName });
        }
      });

      const hasResults = Object.values(groups).some(g => g.length > 0);

      if (!hasResults) {
        resultsContainer.innerHTML = `
          <div class="empty-state">
            <p>No cases found matching your search</p>
            <p class="empty-state-urdu">آپ کی تلاش سے کوئی مقدمہ نہیں ملا</p>
          </div>`;
        return;
      }

      let html = '';
      for (const [groupName, items] of Object.entries(groups)) {
        if (items.length === 0) continue;
        html += `<div class="search-group">
          <h4 class="search-group-title">${groupName}</h4>`;
        items.forEach(item => {
          const c = item.case;
          const highlighted = highlightMatch(item.value, query);
          const statusClass = (c.status || 'pending').toLowerCase();
          html += `
            <div class="search-result-item" data-case-id="${c.id}">
              <div class="result-badges">
                <span class="badge badge-id">${c.caseNumber || c.id}</span>
                <span class="badge badge-status badge-${statusClass}">${c.status || 'Pending'}</span>
              </div>
              <div class="result-title">${c.caseTitle || 'Untitled Case'}</div>
              <div class="result-match">Matched: ${highlighted}</div>
            </div>`;
        });
        html += `</div>`;
      }

      resultsContainer.innerHTML = html;

      // Attach click handlers
      resultsContainer.querySelectorAll('.search-result-item').forEach(el => {
        el.addEventListener('click', () => {
          saveRecentSearch(query);
          window.location.hash = `/cases/${el.dataset.caseId}`;
        });
      });
    }

    function highlightMatch(text, query) {
      if (!text) return '';
      const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    }

    function escapeRegex(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
};
