/* =================================================================
   Harvest Deli, stock and the add-to-cart gate
   -----------------------------------------------------------------
   Shopify is the only source of availability. This file keeps no stock
   numbers of its own: a local table here drifted from Shopify and silently
   blocked sellable honeys (fir-vanilla refused as "sold out", heather capped
   at 2 jars, oak labelled pre-order) while Shopify had every variant on sale.

   The Storefront token cannot read inventory quantities, so the site cannot
   know how many jars are left. It therefore never caps a quantity. It only
   blocks a variant Shopify explicitly reports as not for sale; the hosted
   checkout enforces the real tracked stock.

   Until Shopify's answer has loaded, or if it never loads, nothing is
   blocked. A missed "sold out" is caught at checkout; a false one loses
   the sale.
   ================================================================= */
(function () {
  'use strict';
  function L(en, nl) { return (window.HD_lang && window.HD_lang() === 'nl') ? nl : en; }

  /** handle → { product: boolean, sizes: { '<Shopify Size value>': boolean } } */
  var AVAIL = {};

  function sizeKey(v) {
    var opts = (v && v.selectedOptions) || [];
    for (var i = 0; i < opts.length; i++) if (opts[i].name === 'Size') return opts[i].value;
    return v && v.title;
  }

  function record(list) {
    (list || []).forEach(function (p) {
      if (!p || !p.handle) return;
      var sizes = {};
      var variants = (p.variants && p.variants.nodes) || p.variants || [];
      variants.forEach(function (v) {
        var k = sizeKey(v);
        if (k) sizes[k] = v.availableForSale !== false;
      });
      AVAIL[p.handle] = { product: p.availableForSale !== false, sizes: sizes };
    });
  }

  /** @returns {{qty:number, status:'in'|'out', backorder:boolean}} */
  function statusOf(slug, size) {
    var a = AVAIL[slug];
    var ok = !a ? true
      : (size && Object.prototype.hasOwnProperty.call(a.sizes, size)) ? a.sizes[size]
      : a.product;
    return ok ? { qty: 999, status: 'in', backorder: false } : { qty: 0, status: 'out', backorder: false };
  }

  window.HD_stock = { get: statusOf };

  /* ---------- product page stock line ---------- */
  function decorateProduct() {
    var stockEl = document.querySelector('.pd-stock');
    if (!stockEl) return;
    var slug = (document.querySelector('meta[name="hd-product-slug"]') || {}).content || '';
    var radio = document.querySelector('input[name="hd-variant"]:checked');
    var out = statusOf(slug, radio && radio.dataset.size).status === 'out';
    var dot = stockEl.querySelector('.pd-stock-dot');
    stockEl.classList.remove('is-low', 'is-backorder');
    stockEl.classList.toggle('is-out', out);
    stockEl.innerHTML = '';
    if (dot) stockEl.appendChild(dot);
    stockEl.appendChild(document.createTextNode(' ' + (out
      ? L('Sold out', 'Uitverkocht')
      : L('In stock · ready to ship', 'Op voorraad · klaar voor verzending'))));
    soldOutButtons(out);
  }

  /* The buy buttons say so when the chosen size is sold out, instead of looking
     buyable until the click is refused. */
  function soldOutButtons(out) {
    var lang = (window.HD_lang && window.HD_lang()) || 'nl';
    var dict = (window.HD_T && (window.HD_T[lang] || window.HD_T.nl)) || {};
    document.querySelectorAll('.pd-cta[data-add-to-cart], .sticky-buy button[data-add-to-cart], #pdExpress').forEach(function (b) {
      var label = b.querySelector('[data-i18n]') || (b.hasAttribute('data-i18n') ? b : null);
      b.classList.toggle('is-soldout', out);
      if (out) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
      if (!label) return;
      if (out) label.textContent = L('Sold out', 'Uitverkocht');
      else if (dict[label.getAttribute('data-i18n')]) label.textContent = dict[label.getAttribute('data-i18n')];
    });
  }

  /* ---------- sold-out gate (capture phase, runs before the add handlers) ---------- */
  document.addEventListener('click', function (e) {
    var ex = e.target.closest && e.target.closest('#pdExpress.is-soldout');
    if (ex) { e.preventDefault(); e.stopImmediatePropagation(); if (window.HD_toast) window.HD_toast(L('Sold out', 'Uitverkocht')); return; }
    var btn = e.target.closest && e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    var st = statusOf(btn.getAttribute('data-add-to-cart'), btn.getAttribute('data-size'));
    if (st.status !== 'out') return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (window.HD_toast) window.HD_toast(L('Sold out', 'Uitverkocht'));
  }, true);

  function ready() {
    decorateProduct();
    try { window.dispatchEvent(new CustomEvent('hd:inventory-ready')); } catch (e) {}
  }

  /* shared.js injects the add-ons as dynamic scripts, so Commerce may load
     after this file. Wait for it briefly; give up silently (nothing blocked). */
  function load(tries) {
    var C = window.Commerce;
    if (!(C && C.products && C.products.all)) {
      if (tries < 40) setTimeout(function () { load(tries + 1); }, 150);
      return;
    }
    C.products.all().then(record, function () {}).then(ready);
  }

  function init() {
    ready();
    window.addEventListener('hd:lang', decorateProduct);
    document.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'hd-variant') decorateProduct();
    });
    load(0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
