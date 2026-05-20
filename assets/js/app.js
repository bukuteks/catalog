/**
 * app.js — Core application logic for Channel Buku Teks catalog
 */
const App = {
  API_BASE: '../api/v1',
  cache: {},

  /** Fetch JSON with caching */
  async fetchJSON(url) {
    if (this.cache[url]) return this.cache[url];
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.cache[url] = data;
      return data;
    } catch (e) {
      console.error(`Fetch failed: ${url}`, e);
      return null;
    }
  },

  /** Navigate to book detail page */
  goToBook(id) {
    window.location.href = `book.html?id=${encodeURIComponent(id)}`;
  },

  /** Navigate to browse page with level filter */
  browseTo(levelCode) {
    window.location.href = `browse.html?level=${encodeURIComponent(levelCode)}`;
  },

  /** Navigate to browse page with curriculum filter */
  browseByCurriculum(code) {
    window.location.href = `browse.html?curriculum=${encodeURIComponent(code)}`;
  },

  /** Get URL parameters */
  getParams() {
    return Object.fromEntries(new URLSearchParams(window.location.search));
  },

  /** Setup navbar search */
  setupNavSearch() {
    const input = document.getElementById('nav-search');
    const dropdown = document.getElementById('nav-search-dropdown');
    if (!input || !dropdown) return;

    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        await SearchEngine.loadIndex();
        const results = SearchEngine.search(input.value, 8);
        if (results.length > 0) {
          dropdown.innerHTML = results.map(r => Components.searchResult(r)).join('');
          dropdown.classList.add('active');
        } else {
          dropdown.classList.remove('active');
        }
      }, 200);
    });

    input.addEventListener('focus', () => {
      if (dropdown.children.length > 0) dropdown.classList.add('active');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#nav-search-container')) {
        dropdown.classList.remove('active');
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        window.location.href = `browse.html?search=${encodeURIComponent(input.value.trim())}`;
      }
    });
  },

  /** Setup mobile menu */
  setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const links = document.getElementById('nav-links');
    if (!btn || !links) return;
    btn.addEventListener('click', () => {
      links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
      links.style.flexDirection = 'column';
      links.style.position = 'absolute';
      links.style.top = '100%';
      links.style.left = '0';
      links.style.right = '0';
      links.style.background = 'var(--bg-primary)';
      links.style.padding = '16px';
      links.style.borderBottom = '1px solid var(--border)';
    });
  },

  // ========== HOMEPAGE ==========
  async initHome() {
    this.setupNavSearch();
    this.setupMobileMenu();
    this.setupHeroSearch();
    await Promise.all([this.loadLevels(), this.loadCurricula(), this.loadFeatured()]);
  },

  setupHeroSearch() {
    const input = document.getElementById('hero-search-input');
    const dropdown = document.getElementById('hero-search-dropdown');
    if (!input || !dropdown) return;

    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        await SearchEngine.loadIndex();
        const results = SearchEngine.search(input.value, 8);
        if (results.length > 0) {
          dropdown.innerHTML = results.map(r => Components.searchResult(r)).join('');
          dropdown.classList.add('active');
        } else {
          dropdown.classList.remove('active');
        }
      }, 200);
    });

    input.addEventListener('focus', () => {
      if (dropdown.children.length > 0) dropdown.classList.add('active');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.hero-search')) dropdown.classList.remove('active');
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        window.location.href = `browse.html?search=${encodeURIComponent(input.value.trim())}`;
      }
    });
  },

  async loadLevels() {
    const container = document.getElementById('levels-grid');
    if (!container) return;
    const data = await this.fetchJSON(`${this.API_BASE}/levels.json`);
    if (!data) return;
    let html = '';
    for (const school of data) {
      html += `<div class="level-group-header">${school.name} <span class="level-group-count">(${school.totalBooks} buku)</span></div>`;
      html += `<div class="level-group-grid">`;
      for (const level of school.studentLevels) {
        html += Components.levelCard(level, school.code);
      }
      html += `</div>`;
    }
    container.innerHTML = html;
    // Update stats
    const totalEl = document.getElementById('stat-total');
    const levelsEl = document.getElementById('stat-levels');
    if (totalEl) totalEl.textContent = data.reduce((s, d) => s + d.totalBooks, 0);
    if (levelsEl) levelsEl.textContent = data.reduce((s, d) => s + d.studentLevels.length, 0);
  },

  async loadCurricula() {
    const container = document.getElementById('curricula-grid');
    if (!container) return;
    const data = await this.fetchJSON(`${this.API_BASE}/curricula.json`);
    if (!data) return;
    container.innerHTML = data.map(c => Components.curriculumPill(c)).join('');
    const currEl = document.getElementById('stat-curricula');
    if (currEl) currEl.textContent = data.length;
  },

  async loadFeatured() {
    const container = document.getElementById('featured-grid');
    if (!container) return;
    const data = await this.fetchJSON(`${this.API_BASE}/books.json`);
    if (!data) return;
    // Show first 8 books as featured
    const featured = data.slice(0, 8);
    container.innerHTML = featured.map(b => Components.bookCard(b)).join('');
  },

  // ========== BROWSE PAGE ==========
  allBooks: [],
  filteredBooks: [],
  filters: { levels: [], curricula: [], dlp: false, search: '' },
  sortBy: 'name',

  async initBrowse() {
    this.setupNavSearch();
    this.setupMobileMenu();
    
    // Load data
    const [books, levels, curricula] = await Promise.all([
      this.fetchJSON(`${this.API_BASE}/books.json`),
      this.fetchJSON(`${this.API_BASE}/levels.json`),
      this.fetchJSON(`${this.API_BASE}/curricula.json`),
    ]);

    if (!books) return;
    this.allBooks = books;

    // Build filter sidebar
    this.buildFilters(levels, curricula);

    // Apply URL params
    const params = this.getParams();
    if (params.level) {
      this.filters.levels = [params.level];
      this.updateFilterUI();
    }
    if (params.curriculum) {
      this.filters.curricula = [params.curriculum];
      this.updateFilterUI();
    }
    if (params.search) {
      this.filters.search = params.search;
      const searchInput = document.getElementById('browse-search');
      if (searchInput) searchInput.value = params.search;
    }

    // Setup sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this.sortBy = sortSelect.value;
        this.applyFilters();
      });
    }

    // Setup search
    const searchInput = document.getElementById('browse-search');
    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          this.filters.search = searchInput.value.trim();
          this.applyFilters();
        }, 250);
      });
    }

    // Setup mobile filter toggle
    const filterBtn = document.getElementById('filter-toggle');
    const sidebar = document.getElementById('browse-sidebar');
    if (filterBtn && sidebar) {
      filterBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    this.applyFilters();
  },

  buildFilters(levels, curricula) {
    const levelContainer = document.getElementById('filter-levels');
    const currContainer = document.getElementById('filter-curricula');
    if (levelContainer && levels) {
      let html = '';
      for (const school of levels) {
        for (const level of school.studentLevels) {
          html += `
            <div class="filter-option" data-filter="level" data-value="${level.code}" onclick="App.toggleFilter('levels','${level.code}',this)">
              <div class="filter-check"></div>
              <span>${level.name}</span>
              <span class="filter-count">${level.bookCount}</span>
            </div>`;
        }
      }
      levelContainer.innerHTML = html;
    }
    if (currContainer && curricula) {
      let html = '';
      for (const c of curricula) {
        html += `
          <div class="filter-option" data-filter="curriculum" data-value="${c.code}" onclick="App.toggleFilter('curricula','${c.code}',this)">
            <div class="filter-check"></div>
            <span>${c.code}</span>
            <span class="filter-count">${c.bookCount}</span>
          </div>`;
      }
      currContainer.innerHTML = html;
    }
  },

  toggleFilter(type, value, el) {
    const arr = this.filters[type];
    const idx = arr.indexOf(value);
    if (idx >= 0) { arr.splice(idx, 1); el.classList.remove('active'); }
    else { arr.push(value); el.classList.add('active'); }
    this.applyFilters();
  },

  toggleDLP() {
    this.filters.dlp = !this.filters.dlp;
    const el = document.getElementById('filter-dlp');
    if (el) el.classList.toggle('active', this.filters.dlp);
    this.applyFilters();
  },

  updateFilterUI() {
    document.querySelectorAll('[data-filter="level"]').forEach(el => {
      el.classList.toggle('active', this.filters.levels.includes(el.dataset.value));
    });
    document.querySelectorAll('[data-filter="curriculum"]').forEach(el => {
      el.classList.toggle('active', this.filters.curricula.includes(el.dataset.value));
    });
  },

  clearFilters() {
    this.filters = { levels: [], curricula: [], dlp: false, search: '' };
    document.querySelectorAll('.filter-option.active').forEach(el => el.classList.remove('active'));
    const searchInput = document.getElementById('browse-search');
    if (searchInput) searchInput.value = '';
    this.applyFilters();
  },

  applyFilters() {
    let books = [...this.allBooks];

    // Filter by level
    if (this.filters.levels.length > 0) {
      books = books.filter(b => this.filters.levels.includes(b.studentLevel));
    }
    // Filter by curriculum
    if (this.filters.curricula.length > 0) {
      books = books.filter(b => this.filters.curricula.includes(b.silibusCode));
    }
    // Filter DLP
    if (this.filters.dlp) {
      books = books.filter(b => b.dlpStatus);
    }
    // Filter search
    if (this.filters.search) {
      const q = this.filters.search.toLowerCase();
      books = books.filter(b =>
        (b.subjectName || '').toLowerCase().includes(q) ||
        (b.displayName || '').toLowerCase().includes(q) ||
        (b.silibusCode || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (this.sortBy === 'name') {
      books.sort((a, b) => (a.subjectName || '').localeCompare(b.subjectName || ''));
    } else if (this.sortBy === 'level') {
      books.sort((a, b) => (a.studentLevel || '').localeCompare(b.studentLevel || ''));
    }

    this.filteredBooks = books;
    this.renderBooks();
    this.renderActiveFilters();
  },

  renderBooks() {
    const container = document.getElementById('books-grid');
    const results = document.getElementById('results-count');
    if (!container) return;

    if (this.filteredBooks.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">&#128218;</div><div class="empty-state-text">No books found. Try adjusting your filters.</div></div>`;
    } else {
      container.innerHTML = this.filteredBooks.map(b => Components.bookCard(b)).join('');
    }
    if (results) results.textContent = `${this.filteredBooks.length} books found`;
  },

  renderActiveFilters() {
    const container = document.getElementById('active-filters');
    if (!container) return;
    let html = '';
    for (const l of this.filters.levels) {
      html += `<span class="active-filter-tag">${l} <button onclick="App.toggleFilter('levels','${l}',document.querySelector('[data-value=\\'${l}\\']'))">&times;</button></span>`;
    }
    for (const c of this.filters.curricula) {
      html += `<span class="active-filter-tag">${c} <button onclick="App.toggleFilter('curricula','${c}',document.querySelector('[data-value=\\'${c}\\']'))">&times;</button></span>`;
    }
    if (this.filters.dlp) {
      html += `<span class="active-filter-tag">DLP Only <button onclick="App.toggleDLP()">&times;</button></span>`;
    }
    if (html) {
      html += `<button class="clear-filters-btn" onclick="App.clearFilters()">Clear All</button>`;
    }
    container.innerHTML = html;
  },

  // ========== BOOK DETAIL PAGE ==========
  async initBookDetail() {
    this.setupNavSearch();
    this.setupMobileMenu();

    const params = this.getParams();
    const bookId = params.id;
    if (!bookId) { window.location.href = 'browse.html'; return; }

    const book = await this.fetchJSON(`${this.API_BASE}/books/${encodeURIComponent(bookId)}.json`);
    if (!book) {
      document.getElementById('book-content').innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">&#128533;</div><div class="empty-state-text">Book not found.</div></div>';
      return;
    }

    // Set page title
    document.title = `${book.displayName || book.subjectName} - Channel Buku Teks`;

    // Breadcrumb
    const bc = document.getElementById('breadcrumb');
    if (bc) {
      bc.innerHTML = Components.breadcrumb([
        { label: 'Home', href: 'index.html' },
        { label: book.schoolLevelName || 'School', href: `browse.html` },
        { label: book.studentLevelName || 'Level', href: `browse.html?level=${book.studentLevel}` },
        { label: book.displayName || book.subjectName }
      ]);
    }

    // Cover
    const cover = document.getElementById('book-cover');
    if (cover) {
      const initials = Components.getInitials(book.displayName || book.subjectName);
      const color = book.coverColor || '#4a90d9';
      cover.style.background = `linear-gradient(135deg, ${color}, ${color}dd)`;
      cover.textContent = initials;
    }

    // Info
    document.getElementById('book-title').textContent = book.displayName || book.subjectName;
    document.getElementById('book-subject').textContent = book.subjectName;

    // Meta
    const metaGrid = document.getElementById('book-meta');
    if (metaGrid) {
      metaGrid.innerHTML = `
        <div class="book-meta-item"><div class="book-meta-label">Level</div><div class="book-meta-value">${book.studentLevelName || '-'}</div></div>
        <div class="book-meta-item"><div class="book-meta-label">School</div><div class="book-meta-value">${book.schoolLevelName || '-'}</div></div>
        <div class="book-meta-item"><div class="book-meta-label">Curriculum</div><div class="book-meta-value">${book.silibusCode || '-'} — ${book.silibusName || ''}</div></div>
        <div class="book-meta-item"><div class="book-meta-label">Status</div><div class="book-meta-value">${book.bookStatus || '-'}${book.dlpStatus ? ' (DLP)' : ''}</div></div>`;
    }

    // Downloads
    const dlContainer = document.getElementById('download-buttons');
    if (dlContainer) {
      dlContainer.innerHTML = Components.downloadButtons(book.downloads);
    }

    // Related books
    await this.loadRelated(book);
  },

  async loadRelated(book) {
    const container = document.getElementById('related-grid');
    if (!container) return;
    const data = await this.fetchJSON(`${this.API_BASE}/levels/${book.schoolLevel}/${book.studentLevel}/books.json`);
    if (!data) return;
    const related = data.filter(b => b.id !== book.id).slice(0, 4);
    if (related.length > 0) {
      container.innerHTML = related.map(b => Components.bookCard(b)).join('');
      document.getElementById('related-section').style.display = 'block';
    }
  }
};
