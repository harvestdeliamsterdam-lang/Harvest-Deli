/* =================================================================
   Harvest Deli, Inventory / stock (Phase 3)
   -----------------------------------------------------------------
   A client-side stock model with elegant, restrained indicators:
     • subtle badges on shop cards (low / sold out / pre-order)
     • real stock status + add-to-cart gating on product pages
     • oversell guard (can't add beyond available stock)
     • reservation API (reserve/release), SEAM for warehouse/Supabase
   Loaded site-wide by shared.js. Bilingual (EN/NL).

   SEAM: replace HD_STOCK with live levels from a warehouse / Supabase
   table and call HD_stock.reserve()/release() against a real endpoint.
   ================================================================= */
(function () {
  'use strict';
  function L(en, nl) { return (window.HD_lang && window.HD_lang() === 'nl') ? nl : en; }

  var LOW_AT = 6; // at or below this (and > 0) → "low stock"

  /** @type {Object<string,{qty:number, backorder?:boolean, eta?:string}>} */
  var HD_STOCK = {
    'arbutus':        { qty: 3 },
    'oak':            { qty: 0, backorder: true, eta: L('Ships in 2–3 weeks', 'Levering in 2–3 weken') },
    'fir-vanilla':    { qty: 0 },
    'orange-blossom': { qty: 24 },
    'acacia':         { qty: 12 },
    'thyme':          { qty: 5 },
    'chestnut':       { qty: 40 },
    'pine':           { qty: 18 },
    'heather':        { qty: 2 },
    'olive-oil':      { qty: 30 },
    'mountain-tea':   { qty: 60 }
  };

  var RES_KEY = 'hd-reservations-v1';
  function reservations() { try { return JSON.parse(localStorage.getItem(RES_KEY) || '{}'); } catch (e) { return {}; } }
  function saveReservations(r) { try { localStorage.setItem(RES_KEY, JSON.stringify(r)); } catch (e) {} }

  /** Effective available = base qty − this browser's active reservations. */
  function available(slug) {
    var s = HD_STOCK[slug]; if (!s) return 999; // unknown product → don't block
    var r = reservations()[slug] || 0;
    return Math.max(0, (s.qty || 0) - r);
  }
  /** @returns {{qty:number, status:'in'|'low'|'out'|'backorder', backorder:boolean, eta?:string}} */
  function statusOf(slug) {
    var s = HD_STOCK[slug];
    if (!s) return { qty: 999, status: 'in', backorder: false };
    var qty = available(slug);
    var status = qty > LOW_AT ? 'in' : (qty > 0 ? 'low' : (s.backorder ? 'backorder' : 'out'));
    return { qty: qty, status: status, backorder: !!s.backorder, eta: s.eta };
  }

  window.HD_stock = {
    get: statusOf,
    available: available,
    LOW_AT: LOW_AT,
    // SEAM: persist against a real backend; here it's a per-browser hold.
    reserve: function (slug, qty) { var r = reservations(); r[slug] = (r[slug] || 0) + (qty || 1); saveReservations(r); },
    release: function (slug, qty) { var r = reservations(); if (r[slug]) { r[slug] = Math.max(0, r[slug] - (qty == null ? r[slug] : qty)); if (!r[slug]) delete r[slug]; saveReservations(r); } },
    clearReservations: function () { saveReservations({}); }
  };

  /* ---------- labels ---------- */
  function badgeLabel(st) {
    if (st.status === 'out') return L('Sold out', 'Uitverkocht');
    if (st.status === 'backorder') return L('Pre-order', 'Pre-order');
    if (st.status === 'low') return L('Only {n} left', 'Nog {n} op voorraad').replace('{n}', st.qty);
    return '';
  }

  /* ---------- shop cards ---------- */
  function decorateCards() {
    document.querySelectorAll('.p-card[data-slug]').forEach(function (card) {
      if (card.querySelector('.stock-flag')) return;
      var st = statusOf(card.getAttribute('data-slug'));
      if (st.status === 'in') return; // subtle: only flag non-plentiful
      var wrap = card.querySelector('.jar-wrap') || card;
      var flag = document.createElement('span');
      flag.className = 'stock-flag stock-' + st.status;
      flag.textContent = badgeLabel(st);
      wrap.appendChild(flag);
      if (st.status === 'out') card.classList.add('is-soldout');
    });
  }
  function watchGrid() {
    var grid = document.getElementById('shopGrid');
    if (!grid) return;
    decorateCards();
    if (window.MutationObserver) new MutationObserver(function () { decorateCards(); }).observe(grid, { childList: true });
  }

  /* ---------- product page ---------- */
  function decorateProduct() {
    var meta = document.querySelector('meta[name="hd-product-slug"]');
    if (!meta || !meta.content) return;
    var st = statusOf(meta.content);
    var stockEl = document.querySelector('.pd-stock');
    if (stockEl) {
      var dot = stockEl.querySelector('.pd-stock-dot');
      stockEl.classList.remove('is-low', 'is-out', 'is-backorder');
      var txt;
      if (st.status === 'out') { txt = L('Sold out', 'Uitverkocht'); stockEl.classList.add('is-out'); }
      else if (st.status === 'backorder') { txt = L('Available to pre-order', 'Beschikbaar voor pre-order') + (st.eta ? ' · ' + st.eta : ''); stockEl.classList.add('is-backorder'); }
      else if (st.status === 'low') { txt = L('Only {n} left · ready to ship', 'Nog {n} op voorraad · klaar voor verzending').replace('{n}', st.qty); stockEl.classList.add('is-low'); }
      else { txt = L('In stock · ready to ship', 'Op voorraad · klaar voor verzending'); }
      stockEl.innerHTML = '';
      if (dot) stockEl.appendChild(dot);
      stockEl.appendChild(document.createTextNode(' ' + txt));
    }
    // gate the CTA
    var cta = document.querySelector('.pd-cta[data-add-to-cart]');
    if (cta) {
      if (st.status === 'out') {
        cta.disabled = true;
        var span = cta.querySelector('span:first-child'); if (span) span.textContent = L('Sold out', 'Uitverkocht');
      } else if (st.status === 'backorder') {
        var s2 = cta.querySelector('span:first-child'); if (s2) s2.textContent = L('Pre-order', 'Pre-order');
      }
    }
  }

  /* ---------- oversell guard (capture phase, beats other handlers) ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    var slug = btn.getAttribute('data-add-to-cart');
    var st = statusOf(slug);
    if (st.backorder) return; // pre-order always allowed
    if (st.status === 'out') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (window.HD_toast) window.HD_toast(L('Sold out', 'Uitverkocht'));
      return;
    }
    var inCart = 0;
    if (window.HD_CART) (window.HD_CART.items || []).forEach(function (i) { if (i.slug === slug) inCart = i.qty; });
    if (inCart >= st.qty) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (window.HD_toast) window.HD_toast(L('Only {n} available', 'Slechts {n} beschikbaar').replace('{n}', st.qty));
    }
  }, true);

  function init() {
    watchGrid();
    decorateProduct();
    // let dependent UIs (e.g. shop availability facet) recompute now stock is ready
    try { window.dispatchEvent(new CustomEvent('hd:inventory-ready')); } catch (e) {}
    window.addEventListener('hd:lang', function () {
      document.querySelectorAll('.stock-flag').forEach(function (f) { f.remove(); });
      decorateCards(); decorateProduct();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
