/**
 * search.js — Client-side fuzzy search for book catalog
 */
const SearchEngine = {
  index: [],
  loaded: false,

  async loadIndex() {
    if (this.loaded) return;
    try {
      const res = await fetch('../api/v1/search-index.json');
      this.index = await res.json();
      this.loaded = true;
    } catch (e) {
      console.error('Failed to load search index:', e);
    }
  },

  search(query, limit = 10) {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const results = [];
    for (const item of this.index) {
      const name = (item.subjectName || '').toLowerCase();
      const display = (item.displayName || '').toLowerCase();
      const level = (item.studentLevelName || '').toLowerCase();
      const silibus = (item.silibusCode || '').toLowerCase();
      let score = 0;
      if (name === q || display === q) score = 100;
      else if (name.startsWith(q) || display.startsWith(q)) score = 80;
      else if (name.includes(q) || display.includes(q)) score = 60;
      else if (level.includes(q) || silibus.includes(q)) score = 30;
      else {
        // Simple fuzzy: check if all chars appear in order
        let fi = 0;
        for (let i = 0; i < name.length && fi < q.length; i++) {
          if (name[i] === q[fi]) fi++;
        }
        if (fi === q.length) score = 20;
      }
      if (score > 0) results.push({ ...item, score });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
};
