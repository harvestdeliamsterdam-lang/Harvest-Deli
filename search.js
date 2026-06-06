/* =================================================================
   Harvest Deli, Search experience (editorial, cinematic)
   -----------------------------------------------------------------
   Injects a search icon into the nav and a full-screen blurred
   overlay with live results over the product catalog, recent &
   popular searches, trending products, keyboard navigation and a
   mobile-first full-screen layout. Loaded site-wide by shared.js.
   ================================================================= */
(function () {
  'use strict';

  var RECENT_KEY = 'hd-recent-searches-v1';
  var POPULAR = ['Chestnut Honey', 'Greek Mountain Tea', 'Olive Oil', 'Thyme Honey', 'Acacia'];
  var TRENDING = ['chestnut', 'mountain-tea', 'olive-oil']; // slugs
  /* Editorial entries beyond products (collections + stories). */
  var EXTRAS = [
    { type: 'Collection', title: 'The Collection', sub: 'All editions', url: 'shop.html' },
    { type: 'Collection', title: 'Honey', sub: 'Nine single-origin honeys', url: 'shop.html' },
    { type: 'Collection', title: 'Olive Oil', sub: 'Estate pressing', url: 'product-olive-oil.html' },
    { type: 'Collection', title: 'Tea', sub: 'Wild mountain tea', url: 'product-mountain-tea.html' },
    { type: 'Story', title: 'Taste the Greek sun', sub: 'Journal', url: 'article-taste-the-greek-sun.html' },
    { type: 'Story', title: 'The Journal', sub: 'Field notes', url: 'journal.html' },
    { type: 'Story', title: 'The Origin', sub: 'Pelion · Greece', url: 'about.html' }
  ];

  function fmt(n) { n = Math.round((n || 0) * 100) / 100; return Number.isInteger(n) ? '€' + n : '€' + n.toFixed(2); }
  function readRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; } }
  function pushRecent(q) {
    q = (q || '').trim(); if (!q) return;
    var list = readRecent().filter(function (x) { return x.toLowerCase() !== q.toLowerCase(); });
    list.unshift(q); list = list.slice(0, 5);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function allProductSlugs() {
    var p = window.HD_PRODUCTS || {};
    return Object.keys(p);
  }

  /* ---- product search ---- */
  function searchProducts(q) {
    q = q.toLowerCase();
    var out = [];
    allProductSlugs().forEach(function (slug) {
      var p = window.HD_product && window.HD_product(slug);
      if (!p) return;
      var hay = [p.name, p.notes, p.region, p.edition, (p.tags || []).join(' ')].join(' ').toLowerCase();
      if (!q || hay.indexOf(q) > -1) out.push(p);
    });
    return out;
  }
  function searchExtras(q) {
    q = q.toLowerCase();
    return EXTRAS.filter(function (e) { return !q || (e.title + ' ' + e.sub).toLowerCase().indexOf(q) > -1; });
  }

  /* ---- DOM ---- */
  var overlay, input, resultsEl, navItems = [];

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'hd-search';
    overlay.id = 'hdSearch';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Search Harvest Deli');
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="hd-search-backdrop" data-search-close></div>' +
      '<div class="hd-search-panel" role="document">' +
        '<div class="hd-search-bar">' +
          '<svg class="hd-search-ico" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="9.5" cy="9.5" r="6.5"/><path d="M19 19l-4.5-4.5"/></svg>' +
          '<input type="search" id="hdSearchInput" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search the collection" placeholder="Search the collection">' +
          '<button type="button" class="hd-search-close" data-search-close aria-label="Close search"><span>Close</span><span class="x" aria-hidden="true"></span></button>' +
        '</div>' +
        '<div class="hd-search-results" id="hdSearchResults" role="listbox" aria-label="Search results"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    input = overlay.querySelector('#hdSearchInput');
    resultsEl = overlay.querySelector('#hdSearchResults');

    overlay.addEventListener('click', function (e) {
      if (e.target.closest('[data-search-close]')) close();
    });
    input.addEventListener('input', debounce(function () { render(input.value); }, 160));
    input.addEventListener('keydown', onKey);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) close(); });
  }

  function debounce(fn, ms) { var t; return function () { clearTimeout(t); var a = arguments, c = this; t = setTimeout(function () { fn.apply(c, a); }, ms); }; }

  function chip(label) { return '<button type="button" class="hd-s-chip" data-q="' + label.replace(/"/g, '&quot;') + '">' + label + '</button>'; }

  function productRow(p) {
    return '<a class="hd-s-row" role="option" href="' + p.url + '" data-q="' + (p.name || '').replace(/"/g, '&quot;') + '">' +
      '<span class="hd-s-thumb"><img src="' + p.image + '" alt="" loading="lazy"></span>' +
      '<span class="hd-s-meta"><span class="hd-s-title">' + p.name + '</span><span class="hd-s-sub">' + (p.notes || p.region || '') + '</span></span>' +
      '<span class="hd-s-price">' + (typeof p.price === 'number' ? fmt(p.price) : '') + '</span>' +
    '</a>';
  }
  function extraRow(e) {
    return '<a class="hd-s-row hd-s-row--text" role="option" href="' + e.url + '" data-q="' + e.title.replace(/"/g, '&quot;') + '">' +
      '<span class="hd-s-meta"><span class="hd-s-title">' + e.title + '</span><span class="hd-s-sub">' + e.sub + '</span></span>' +
      '<span class="hd-s-kind">' + e.type + '</span>' +
    '</a>';
  }
  function group(title, inner) { return '<div class="hd-s-group"><div class="hd-s-grouptitle">' + title + '</div>' + inner + '</div>'; }

  function suggestionsHTML() {
    var recent = readRecent();
    var html = '';
    if (recent.length) html += group('Recent', '<div class="hd-s-chips">' + recent.map(chip).join('') + '</div>');
    html += group('Popular', '<div class="hd-s-chips">' + POPULAR.map(chip).join('') + '</div>');
    var trend = TRENDING.map(function (s) { return window.HD_product && window.HD_product(s); }).filter(Boolean);
    if (trend.length) html += group('Trending', trend.map(productRow).join(''));
    return html;
  }

  function render(q) {
    q = (q || '').trim();
    if (!q) { resultsEl.innerHTML = suggestionsHTML(); afterRender(); return; }
    var prods = searchProducts(q), extras = searchExtras(q);
    if (!prods.length && !extras.length) {
      resultsEl.innerHTML = '<div class="hd-s-empty"><p>No matches for &ldquo;' + escapeHtml(q) + '&rdquo;.</p>' +
        group('Try', '<div class="hd-s-chips">' + POPULAR.slice(0, 4).map(chip).join('') + '</div>') + '</div>';
      afterRender(); return;
    }
    var html = '';
    if (prods.length) html += group('Products', prods.map(productRow).join(''));
    if (extras.length) html += group('Collections & stories', extras.map(extraRow).join(''));
    resultsEl.innerHTML = html;
    afterRender();
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  /* keyboard nav across rows */
  var activeIdx = -1;
  function afterRender() {
    navItems = Array.prototype.slice.call(resultsEl.querySelectorAll('.hd-s-row, .hd-s-chip'));
    activeIdx = -1;
    // chips fill the input and search
    resultsEl.querySelectorAll('[data-q]').forEach(function (el) {
      if (el.classList.contains('hd-s-chip')) {
        el.addEventListener('click', function () { input.value = el.getAttribute('data-q'); render(input.value); input.focus(); });
      } else {
        el.addEventListener('click', function () { pushRecent(el.getAttribute('data-q')); });
      }
    });
  }
  function setActive(i) {
    if (!navItems.length) return;
    activeIdx = (i + navItems.length) % navItems.length;
    navItems.forEach(function (n, j) { n.classList.toggle('is-active', j === activeIdx); });
    var el = navItems[activeIdx]; if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }
  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIdx - 1); }
    else if (e.key === 'Enter') {
      var el = navItems[activeIdx];
      if (el) { e.preventDefault(); el.click(); if (el.tagName === 'A') { pushRecent(el.getAttribute('data-q')); location.href = el.getAttribute('href'); } }
      else if (input.value.trim()) { pushRecent(input.value); /* first product if any */ var first = resultsEl.querySelector('a.hd-s-row'); if (first) location.href = first.getAttribute('href'); }
    }
  }

  /* open / close */
  var lastFocus = null;
  function isOpen() { return overlay && !overlay.hidden; }
  function open() {
    if (!overlay) build();
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    // reflow then animate (setTimeout is more reliable than rAF when backgrounded)
    void overlay.offsetWidth;
    setTimeout(function () { overlay.classList.add('open'); }, 10);
    render('');
    setTimeout(function () { input.focus(); }, 80);
  }
  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { overlay.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }, 320);
  }
  window.HD_search = { open: open, close: close };

  /* inject the trigger into every nav */
  function injectTriggers() {
    document.querySelectorAll('nav.site-nav .nav-right').forEach(function (navRight) {
      if (navRight.querySelector('.nav-search')) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-search';
      btn.setAttribute('aria-label', 'Search');
      btn.innerHTML = '<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="9.5" cy="9.5" r="6.5"/><path d="M19 19l-4.5-4.5"/></svg>';
      btn.addEventListener('click', open);
      // place it first (left of language/menu) for an editorial header
      navRight.insertBefore(btn, navRight.firstChild);
    });
  }

  function init() {
    injectTriggers();
    // nav-cart is injected slightly later by shared.js; ensure our icon survives
    setTimeout(injectTriggers, 120);
    document.addEventListener('keydown', function (e) {
      // Cmd/Ctrl+K opens search (premium shortcut)
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); open(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
