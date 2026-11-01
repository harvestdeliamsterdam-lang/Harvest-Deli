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
  /* Copy per language (01-11-2026): the overlay used to be English on Dutch
     pages. Greek falls back to English. */
  var COPY = {
    nl: {
      dialog: 'Zoeken in Harvest Deli', placeholder: 'Zoek honing, olijfolie of thee', clear: 'Zoekveld wissen', close: 'Sluiten',
      popular: 'Populair', recent: 'Recent gezocht', discover: 'Ontdek', featured: 'Uitgelicht', products: 'Producten',
      more: 'Collecties en verhalen', tryThese: 'Probeer eens', none: 'Niets gevonden voor', noneHint: 'Probeer een smaak, een soort of een streek.',
      all: function (n) { return 'Bekijk alle ' + n + ' producten'; }, from: 'vanaf', add: 'In winkelmand', results: 'zoekresultaten',
      kbd: 'om te sluiten',
      popularQ: ['Kastanjehoning', 'Tijmhoning', 'Olijfolie', 'Bergthee', 'Acacia', 'Heide'],
      extras: [
        ['Collectie', 'De collectie', 'Alle edities', '/shop.html'],
        ['Collectie', 'Honing', 'Tien Griekse honingsoorten', '/shop.html'],
        ['Collectie', 'Olijfolie', 'Extra vierge, één landgoed', '/products/extra-virgin-olive-oil'],
        ['Collectie', 'Thee en kruiden', 'Bergthee, kamille, oregano', '/products/greek-mountain-tea'],
        ['Verhaal', 'De oorsprong', 'Griekenland', '/about.html'],
        ['Verhaal', 'Het journal', 'Veldnotities', '/journal.html'],
        ['Verhaal', 'Proef de Griekse zon', 'Journal', '/article-de-smaak-van-de-griekse-zon.html']
      ]
    },
    en: {
      dialog: 'Search Harvest Deli', placeholder: 'Search honey, olive oil or tea', clear: 'Clear search', close: 'Close',
      popular: 'Popular', recent: 'Recent searches', discover: 'Discover', featured: 'Featured', products: 'Products',
      more: 'Collections and stories', tryThese: 'Try', none: 'Nothing found for', noneHint: 'Try a flavour, a variety or a region.',
      all: function (n) { return 'View all ' + n + ' products'; }, from: 'from', add: 'Add to cart', results: 'search results',
      kbd: 'to close',
      popularQ: ['Chestnut', 'Thyme', 'Olive oil', 'Mountain tea', 'Acacia', 'Heather'],
      extras: [
        ['Collection', 'The collection', 'All editions', '/shop.html'],
        ['Collection', 'Honey', 'Ten Greek honeys', '/shop.html'],
        ['Collection', 'Olive oil', 'Extra virgin, one estate', '/products/extra-virgin-olive-oil'],
        ['Collection', 'Tea and herbs', 'Mountain tea, chamomile, oregano', '/products/greek-mountain-tea'],
        ['Story', 'The origin', 'Greece', '/about.html'],
        ['Story', 'The journal', 'Field notes', '/journal.html'],
        ['Story', 'Taste the Greek sun', 'Journal', '/article-de-smaak-van-de-griekse-zon.html']
      ]
    }
  };
  function lang() { return (window.HD_lang && window.HD_lang()) === 'nl' ? 'nl' : ((window.HD_lang && window.HD_lang()) ? 'en' : 'nl'); }
  function C() { return COPY[lang()]; }
  var TRENDING = ['chestnut', 'thyme', 'olive-oil', 'mountain-tea']; // slugs

  function fmt(n) { n = Math.round((n || 0) * 100) / 100; var s = Number.isInteger(n) ? String(n) : n.toFixed(2); if (lang() === 'nl') s = s.replace('.', ','); return '€' + s; }
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
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function searchProducts(q) {
    var words = norm(q).split(/\s+/).filter(Boolean);
    var out = [];
    allProductSlugs().forEach(function (slug) {
      var p = window.HD_product && window.HD_product(slug);
      if (!p) return;
      var hay = norm([p.name, p.notes, p.region, p.edition, slug.replace(/-/g, ' '), (p.tags || []).join(' ')].join(' '));
      if (!words.length || words.every(function (w) { return hay.indexOf(w) > -1; })) out.push(p);
    });
    return out;
  }
  function searchExtras(q) {
    var words = norm(q).split(/\s+/).filter(Boolean);
    return C().extras.map(function (e) { return { type: e[0], title: e[1], sub: e[2], url: e[3] }; })
      .filter(function (e) { var h = norm(e.title + ' ' + e.sub); return !words.length || words.every(function (w) { return h.indexOf(w) > -1; }); });
  }

  /* ---- DOM ---- */
  var overlay, input, resultsEl, asideEl, navItems = [];
  var ICO = '<svg class="hd-search-ico" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="9.5" cy="9.5" r="6.5"/><path d="M19 19l-4.5-4.5"/></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'hd-search';
    overlay.id = 'hdSearch';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="hd-search-backdrop" data-search-close></div>' +
      '<div class="hd-search-panel" role="document">' +
        '<div class="hd-search-bar">' + ICO +
          '<input type="search" id="hdSearchInput" autocomplete="off" autocapitalize="off" spellcheck="false" aria-controls="hdSearchResults">' +
          '<button type="button" class="hd-search-clear" id="hdSearchClear" hidden><span class="x" aria-hidden="true"></span></button>' +
          '<span class="hd-search-kbd" aria-hidden="true"><kbd>Esc</kbd><span class="hd-search-kbd-t"></span></span>' +
          '<button type="button" class="hd-search-close" data-search-close><span class="x" aria-hidden="true"></span></button>' +
        '</div>' +
        '<span class="hd-search-line" aria-hidden="true"></span>' +
        '<div class="hd-search-body">' +
          '<aside class="hd-search-aside" id="hdSearchAside"></aside>' +
          '<div class="hd-search-results" id="hdSearchResults"></div>' +
        '</div>' +
        '<p class="hd-search-status" id="hdSearchStatus" role="status" aria-live="polite"></p>' +
      '</div>';
    document.body.appendChild(overlay);
    input = overlay.querySelector('#hdSearchInput');
    resultsEl = overlay.querySelector('#hdSearchResults');
    asideEl = overlay.querySelector('#hdSearchAside');
    var clearBtn = overlay.querySelector('#hdSearchClear');

    function syncClear() { clearBtn.hidden = !input.value; }

    overlay.addEventListener('click', function (e) {
      if (e.target.closest('[data-search-close]')) { close(); return; }
    });
    // Quick add: the page's own [data-add-to-cart] handlers (some in the
    // capture phase, with stopImmediatePropagation) add the item and open the
    // cart. Window capture runs before all of them, so the search can step
    // aside without touching the add itself.
    window.addEventListener('click', function (e) {
      if (isOpen() && e.target.closest && e.target.closest('#hdSearch [data-add-to-cart]')) close();
    }, true);
    input.addEventListener('input', function () { syncClear(); });
    input.addEventListener('input', debounce(function () { render(input.value); }, 140));
    input.addEventListener('keydown', onKey);
    clearBtn.addEventListener('click', function () {
      input.value = ''; syncClear(); render(''); input.focus();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen()) close(); });
    // Focus trap while the dialog is open
    overlay.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !isOpen()) return;
      var f = overlay.querySelectorAll('input, button:not([hidden]), a[href], [tabindex]:not([tabindex="-1"])');
      f = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  function localise() {
    var c = C();
    overlay.setAttribute('aria-label', c.dialog);
    input.setAttribute('placeholder', c.placeholder);
    input.setAttribute('aria-label', c.placeholder);
    overlay.querySelector('#hdSearchClear').setAttribute('aria-label', c.clear);
    overlay.querySelector('.hd-search-close').setAttribute('aria-label', c.close);
    overlay.querySelector('.hd-search-kbd-t').textContent = c.kbd;
  }

  function debounce(fn, ms) { var t; return function () { clearTimeout(t); var a = arguments, c = this; t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  /* Highlight the typed words inside a label (accent-insensitive). */
  function mark(text, q) {
    text = String(text || ''); var words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return escapeHtml(text);
    var n = norm(text), hits = [];
    words.forEach(function (w) { var i = n.indexOf(w); while (i > -1) { hits.push([i, i + w.length]); i = n.indexOf(w, i + w.length); } });
    if (!hits.length) return escapeHtml(text);
    hits.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', pos = 0;
    hits.forEach(function (h) { if (h[0] < pos) return; out += escapeHtml(text.slice(pos, h[0])) + '<mark>' + escapeHtml(text.slice(h[0], h[1])) + '</mark>'; pos = h[1]; });
    return out + escapeHtml(text.slice(pos));
  }
  function thumb(src) {
    var m = /^(\/assets\/(?:products-images\/)?[a-z-]+)\.(?:webp|png)(\?.*)?$/.exec(src || '');
    if (!m) return ' src="' + src + '"';
    return ' src="' + m[1] + '-160.webp' + (m[2] || '') + '" srcset="' + m[1] + '-160.webp' + (m[2] || '') + ' 160w, ' + m[1] + '-640.webp' + (m[2] || '') + ' 640w" sizes="76px"';
  }

  function chip(label, kind) { return '<button type="button" class="hd-s-chip' + (kind ? ' hd-s-chip--' + kind : '') + '" data-q="' + escapeHtml(label) + '">' + escapeHtml(label) + '</button>'; }

  function productRow(p, q, i) {
    var c = C();
    var price = typeof p.price === 'number' ? ((p.multiSize || (p.sizes && p.sizes.length > 1)) ? '<small>' + c.from + '</small> ' : '') + fmt(p.price) : '';
    var size = p.defaultSize || (p.sizes && p.sizes[0] && p.sizes[0].id) || '';
    return '<div class="hd-s-item" style="--i:' + i + '">' +
      '<a class="hd-s-row" href="' + p.url + '" data-q="' + escapeHtml(p.name || '') + '">' +
        '<span class="hd-s-thumb"><img' + thumb(p.image) + ' alt="" loading="lazy"></span>' +
        '<span class="hd-s-meta"><span class="hd-s-title">' + mark(p.name, q) + '</span><span class="hd-s-sub">' + mark(p.notes || p.region || '', q) + '</span></span>' +
        '<span class="hd-s-price">' + price + '</span>' +
      '</a>' +
      '<button type="button" class="hd-s-add" data-add-to-cart="' + p.slug + '"' + (size ? ' data-size="' + escapeHtml(size) + '"' : '') + ' aria-label="' + escapeHtml(c.add + ': ' + p.name) + '" title="' + escapeHtml(c.add) + '">' + PLUS + '</button>' +
    '</div>';
  }
  function extraRow(e, q, i) {
    return '<a class="hd-s-link" style="--i:' + i + '" href="' + e.url + '" data-q="' + escapeHtml(e.title) + '">' +
      '<span class="hd-s-link-kind">' + escapeHtml(e.type) + '</span>' +
      '<span class="hd-s-link-t">' + mark(e.title, q) + '</span>' + ARROW +
    '</a>';
  }
  function group(title, inner, cls) { return '<section class="hd-s-group' + (cls ? ' ' + cls : '') + '"><h2 class="hd-s-grouptitle">' + title + '</h2>' + inner + '</section>'; }
  function allLink(n) { return '<a class="hd-s-all" href="/shop.html">' + C().all(n) + ARROW + '</a>'; }

  function asideHTML(q, extras) {
    var c = C(), html = '', recent = readRecent();
    if (!q) {
      if (recent.length) html += group(c.recent, '<div class="hd-s-chips">' + recent.map(function (r) { return chip(r, 'recent'); }).join('') + '</div>');
      html += group(c.popular, '<div class="hd-s-chips">' + c.popularQ.map(function (r) { return chip(r); }).join('') + '</div>');
      html += group(c.discover, '<div class="hd-s-links">' + searchExtras('').map(function (e, i) { return extraRow(e, '', i); }).join('') + '</div>', 'hd-s-discover');
    } else {
      if (extras.length) html += group(c.more, '<div class="hd-s-links">' + extras.map(function (e, i) { return extraRow(e, q, i); }).join('') + '</div>');
      html += group(c.tryThese, '<div class="hd-s-chips">' + c.popularQ.slice(0, 4).map(function (r) { return chip(r); }).join('') + '</div>');
    }
    return html;
  }

  function render(q) {
    q = (q || '').trim();
    var c = C(), total = allProductSlugs().length, status = overlay.querySelector('#hdSearchStatus');
    var prods, extras = q ? searchExtras(q) : [];
    if (!q) {
      prods = TRENDING.map(function (s) { return window.HD_product && window.HD_product(s); }).filter(Boolean);
      resultsEl.innerHTML = group(c.featured, '<div class="hd-s-list">' + prods.map(function (p, i) { return productRow(p, '', i); }).join('') + '</div>' + allLink(total));
      status.textContent = '';
    } else {
      prods = searchProducts(q);
      if (!prods.length) {
        resultsEl.innerHTML = '<div class="hd-s-empty"><p class="hd-s-empty-t">' + c.none + ' &ldquo;' + escapeHtml(q) + '&rdquo;</p><p class="hd-s-empty-s">' + c.noneHint + '</p>' + allLink(total) + '</div>';
      } else {
        resultsEl.innerHTML = group(c.products + ' <span class="hd-s-count">' + prods.length + '</span>', '<div class="hd-s-list">' + prods.map(function (p, i) { return productRow(p, q, i); }).join('') + '</div>' + allLink(total));
      }
      status.textContent = prods.length + ' ' + c.results;
    }
    asideEl.innerHTML = asideHTML(q, extras);
    overlay.classList.toggle('has-q', !!q);
    afterRender();
  }

  /* keyboard nav across rows */
  var activeIdx = -1;
  function afterRender() {
    // Arrow keys walk the products first, then the discover column.
    navItems = Array.prototype.slice.call(resultsEl.querySelectorAll('.hd-s-row, .hd-s-all')).concat(Array.prototype.slice.call(asideEl.querySelectorAll('.hd-s-link, .hd-s-chip')));
    activeIdx = -1;
    // chips fill the input and search
    overlay.querySelectorAll('.hd-search-body [data-q]').forEach(function (el) {
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
    localise();
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    render('');
    // The panel unfolds from the search button that opened it.
    var panel = overlay.querySelector('.hd-search-panel');
    var trig = (lastFocus && lastFocus.closest && lastFocus.closest('.nav-search, .hd-menu-search')) || document.querySelector('nav.site-nav .nav-search');
    if (panel && trig && trig.getBoundingClientRect) {
      var r = trig.getBoundingClientRect(), pl = panel.offsetLeft, pt = panel.offsetTop;
      panel.style.setProperty('--hd-sx', Math.round(r.left + r.width / 2 - pl) + 'px');
      panel.style.setProperty('--hd-sy', Math.round(r.top + r.height / 2 - pt) + 'px');
    }
    // reflow then animate (setTimeout is more reliable than rAF when backgrounded)
    void overlay.offsetWidth;
    setTimeout(function () { overlay.classList.add('open'); }, 10);
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
      btn.setAttribute('aria-label', lang() === 'nl' ? 'Zoeken' : 'Search');
      btn.innerHTML = '<svg viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="9.5" cy="9.5" r="6.5"/><path d="M19 19l-4.5-4.5"/></svg>';
      btn.addEventListener('click', open);
      // place it first (left of language/menu) for an editorial header
      navRight.insertBefore(btn, navRight.firstChild);
    });
  }

  function init() {
    injectTriggers();
    window.addEventListener('hd:lang', function () { document.querySelectorAll('nav.site-nav .nav-search').forEach(function (b) { b.setAttribute('aria-label', lang() === 'nl' ? 'Zoeken' : 'Search'); }); if (overlay) { localise(); if (isOpen()) render(input.value); } });
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
