/**
 * components.js — Reusable UI component generators
 */
const Components = {
  /** Generate initials from a subject name for book cover */
  getInitials(name) {
    if (!name) return '?';
    const words = name.split(/\s+/).filter(w => w.length > 1);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
  },

  /** Create a book card HTML string */
  bookCard(book) {
    const initials = this.getInitials(book.displayName || book.subjectName);
    const color = book.coverColor || '#4a90d9';
    const dlpBadge = book.dlpStatus ? '<span class="book-card-dlp">DLP</span>' : '';
    return `
      <div class="book-card" onclick="App.goToBook('${book.id}')" role="button" tabindex="0"
           onkeydown="if(event.key==='Enter')App.goToBook('${book.id}')">
        <div class="book-card-cover" style="background: linear-gradient(135deg, ${color}, ${color}dd)">${initials}</div>
        <div class="book-card-body">
          <div class="book-card-title">${book.displayName || book.subjectName}</div>
          <div class="book-card-meta">
            <span class="book-card-level">${book.studentLevelName || ''}</span>
            <span class="book-card-badge">${book.silibusCode || ''}</span>
            ${dlpBadge}
          </div>
        </div>
      </div>`;
  },

  /** Create skeleton loading cards */
  skeletonCards(count = 8) {
    return Array(count).fill('<div class="skeleton skeleton-card"></div>').join('');
  },

  /** Create a level card */
  levelCard(level, icon) {
    const icons = { 'Tingkatan 1': '1', 'Tingkatan 2': '2', 'Tingkatan 3': '3', 'Tingkatan 4': '4', 'Tingkatan 5': '5' };
    const num = icons[level.name] || icon || '?';
    return `
      <div class="level-card" onclick="App.browseTo('${level.code}')" role="button" tabindex="0"
           onkeydown="if(event.key==='Enter')App.browseTo('${level.code}')">
        <div class="level-card-icon">${num}</div>
        <div class="level-card-name">${level.name}</div>
        <div class="level-card-count">${level.bookCount} buku</div>
      </div>`;
  },

  /** Create a curriculum pill */
  curriculumPill(curriculum) {
    return `
      <div class="curriculum-pill" onclick="App.browseByCurriculum('${curriculum.code}')"
           role="button" tabindex="0"
           onkeydown="if(event.key==='Enter')App.browseByCurriculum('${curriculum.code}')">
        <span class="dot" style="background: ${curriculum.color}"></span>
        <span>${curriculum.code}</span>
        <span class="count">${curriculum.bookCount}</span>
      </div>`;
  },

  /** Create search result dropdown item */
  searchResult(item) {
    const initials = this.getInitials(item.displayName || item.subjectName);
    const color = item.coverColor || '#4a90d9';
    return `
      <div class="search-result-item" onclick="App.goToBook('${item.id}')">
        <div class="search-result-color" style="background: ${color}">${initials}</div>
        <div class="search-result-info">
          <div class="search-result-name">${item.subjectName}</div>
          <div class="search-result-meta">${item.studentLevelName} &middot; ${item.silibusCode}</div>
        </div>
      </div>`;
  },

  /** Create download buttons for book detail */
  downloadButtons(downloads) {
    if (!downloads) return '';
    return `
      <a href="${downloads.telegram}" class="download-btn telegram" target="_blank" rel="noopener">
        <span class="download-btn-icon">&#9993;</span>
        <span class="download-btn-text">Download via Telegram</span>
        <span class="download-btn-arrow">&rarr;</span>
      </a>
      <a href="${downloads.pdf}" class="download-btn pdf" target="_blank" rel="noopener">
        <span class="download-btn-icon">&#128196;</span>
        <span class="download-btn-text">Download PDF</span>
        <span class="download-btn-arrow">&rarr;</span>
      </a>
      <a href="${downloads.gdrive}" class="download-btn gdrive" target="_blank" rel="noopener">
        <span class="download-btn-icon">&#9729;</span>
        <span class="download-btn-text">Download via Google Drive</span>
        <span class="download-btn-arrow">&rarr;</span>
      </a>`;
  },

  /** Build breadcrumb */
  breadcrumb(items) {
    return items.map((item, i) => {
      if (i === items.length - 1) return `<span>${item.label}</span>`;
      return `<a href="${item.href}">${item.label}</a><span class="breadcrumb-sep">/</span>`;
    }).join('');
  },

  /** Navbar HTML */
  navbar(activePage) {
    return `
    <nav class="navbar" id="navbar">
      <div class="container">
        <a href="index.html" class="nav-brand">
          <img src="../cdn/images/logo.png" alt="Channel Buku Teks" width="40" height="40">
          <span class="nav-brand-text">Channel Buku Teks</span>
        </a>
        <div class="nav-links" id="nav-links">
          <a href="index.html" class="${activePage==='home'?'active':''}">Home</a>
          <a href="browse.html" class="${activePage==='browse'?'active':''}">Browse</a>
        </div>
        <div class="nav-search" id="nav-search-container">
          <span class="nav-search-icon">&#128269;</span>
          <input type="text" id="nav-search" placeholder="Search books..." autocomplete="off">
          <div class="search-dropdown" id="nav-search-dropdown"></div>
        </div>
        <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Menu">&#9776;</button>
      </div>
    </nav>`;
  },

  /** Footer HTML */
  footer() {
    return `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="footer-brand">
              <img src="../cdn/images/logo.png" alt="Logo" width="36" height="36">
              <span>Channel Buku Teks</span>
            </div>
            <p class="footer-desc">Your Main Online Text Book Provider. Est. 2020. Access digital textbooks for KSSR &amp; KSSM curriculum.</p>
          </div>
          <div>
            <div class="footer-title">Quick Links</div>
            <div class="footer-links">
              <a href="index.html">Home</a>
              <a href="browse.html">Browse All</a>
              <a href="browse.html?curriculum=KSSM">KSSM Books</a>
            </div>
          </div>
          <div>
            <div class="footer-title">Community</div>
            <div class="footer-links">
              <a href="https://t.me/MBChannelBukuTeks" target="_blank" rel="noopener">Telegram Group</a>
              <a href="https://t.me/bukuteksKSSM_bot" target="_blank" rel="noopener">Telegram Bot (T4)</a>
              <a href="https://t.me/BukuTeks5KSSM_bot" target="_blank" rel="noopener">Telegram Bot (T5)</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">&copy; 2020 - ${new Date().getFullYear()} Channel Buku Teks KSSR &amp; KSSM. All rights reserved.</div>
      </div>
    </footer>`;
  }
};
