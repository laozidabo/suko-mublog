/**
 * Edgerunners Theme - Search
 * Client-side full-text search using pre-built JSON index
 */

(function () {
  'use strict';

  let searchIndex = null;
  let searchInput = null;
  let searchResults = null;
  let searchStatus = null;
  let debounceTimer = null;

  function $(sel) {
    return document.querySelector(sel);
  }

  function $$(sel) {
    return Array.from(document.querySelectorAll(sel));
  }

  async function loadIndex() {
    if (searchIndex) return searchIndex;
    try {
      const resp = await fetch('/search.json');
      if (!resp.ok) throw new Error('Failed to load search index');
      searchIndex = await resp.json();
      return searchIndex;
    } catch (err) {
      console.warn('Search index load failed:', err);
      return [];
    }
  }

  function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  function scoreResult(item, query) {
    const q = query.toLowerCase();
    let score = 0;

    const title = (item.title || '').toLowerCase();
    const content = (item.content || '').toLowerCase();
    const tags = (item.tags || []).join(' ').toLowerCase();
    const categories = (item.categories || []).join(' ').toLowerCase();

    // Title matches are worth more
    if (title === q) score += 100;
    if (title.includes(q)) score += 50;

    // Tag matches
    if (tags.includes(q)) score += 30;

    // Category matches
    if (categories.includes(q)) score += 20;

    // Content matches (count occurrences)
    const contentMatches = (content.match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    score += Math.min(contentMatches * 5, 40);

    // Exact word match bonus
    const words = q.split(/\s+/);
    words.forEach(function (w) {
      if (w.length > 1) {
        if (title.includes(w)) score += 10;
        if (content.includes(w)) score += 2;
      }
    });

    return score;
  }

  function renderResult(item, query) {
    const title = highlightText(item.title || '无标题', query);
    const date = item.date || '';

    // Get snippet around first match
    let snippet = '';
    if (item.content) {
      const content = item.content;
      const q = query.toLowerCase();
      const idx = content.toLowerCase().indexOf(q);
      if (idx >= 0) {
        const start = Math.max(0, idx - 60);
        const end = Math.min(content.length, idx + q.length + 120);
        snippet = (start > 0 ? '...' : '') +
          content.substring(start, end) +
          (end < content.length ? '...' : '');
      } else {
        snippet = content.substring(0, 180) + (content.length > 180 ? '...' : '');
      }
    }
    snippet = highlightText(snippet, query);

    const tags = (item.tags || []).map(function (t) {
      return '<span class="search-tag">#' + t + '</span>';
    }).join('');

    return `
      <div class="search-result-item cyber-card">
        <h3 class="search-result-title">
          <a href="${item.url}">${title}</a>
        </h3>
        <div class="search-result-meta">
          <span class="search-date">${date}</span>
          ${tags}
        </div>
        <p class="search-result-snippet">${snippet}</p>
      </div>
    `;
  }

  async function performSearch(query) {
    if (!searchResults || !searchStatus) return;

    query = query.trim();
    if (!query) {
      searchResults.innerHTML = '';
      searchStatus.textContent = '';
      return;
    }

    searchStatus.textContent = '搜索中...';
    const index = await loadIndex();

    if (!index.length) {
      searchStatus.textContent = '搜索索引未加载';
      return;
    }

    const results = index
      .map(function (item) {
        return { item: item, score: scoreResult(item, query) };
      })
      .filter(function (r) {
        return r.score > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, 20);

    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="search-empty cyber-card">
          <p>未找到与 "<strong>${query}</strong>" 相关的结果</p>
          <p class="search-empty-hint">试试其他关键词？</p>
        </div>
      `;
      searchStatus.textContent = '未找到结果';
    } else {
      searchResults.innerHTML = results.map(function (r) {
        return renderResult(r.item, query);
      }).join('');
      searchStatus.textContent = `找到 ${results.length} 个结果`;
    }
  }

  function init() {
    searchInput = $('#searchInput');
    searchResults = $('#searchResults');
    searchStatus = $('#searchStatus');

    if (!searchInput || !searchResults) return;

    // Pre-load search index
    loadIndex();

    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        performSearch(searchInput.value);
      }, 300);
    });

    // Handle Enter key
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        clearTimeout(debounceTimer);
        performSearch(searchInput.value);
      }
    });

    // Focus on load if URL has #search
    if (window.location.hash === '#search') {
      setTimeout(function () {
        searchInput.focus();
      }, 300);
    }

    // Keyboard shortcut: Ctrl/Cmd + K to focus search
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
