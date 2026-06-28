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

  /* ---------- shop cards ---------- */
  /* Stock/scarcity badges removed: a premium luxury card shows no urgency
     indicators (no "low stock" / "sold out" / "pre-order" flags). The stock
     model (HD_stock) stays available for the oversell guard only. */
  function decorateCards() { /* intentionally no visual badge */ }
  function watchGrid() {
    var grid = document.getElementById('shopGrid');
    if (!grid) return;
    decorateCards();
    if (window.MutationObserver) new MutationObserver(function () { decorateCards(); }).observe(grid, { childList: true });
  }

  /* ---------- product page ---------- */
  /* No scarcity on product pages: only a calm, localized "in stock · ready to
     ship" reassurance line. No "low / sold out / pre-order" states, no CTA gating. */
  function decorateProduct() {
    var stockEl = document.querySelector('.pd-stock');
    if (!stockEl) return;
    var dot = stockEl.querySelector('.pd-stock-dot');
    stockEl.classList.remove('is-low', 'is-out', 'is-backorder');
    stockEl.innerHTML = '';
    if (dot) stockEl.appendChild(dot);
    stockEl.appendChild(document.createTextNode(' ' + L('In stock · ready to ship', 'Op voorraad · klaar voor verzending')));
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
