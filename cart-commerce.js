/* =================================================================
   Harvest Deli, Cart drawer × Commerce (2nd reference migration)
   -----------------------------------------------------------------
   The drawer now RENDERS from Commerce.cart.getSync() (see shared.js
   render()). This file routes the drawer's +/-/remove controls through
   Commerce.cart.update()/remove(), a single update path, capture-phase,
   so the existing shared.js handler does not also fire (no double update).
   If Commerce is unavailable it returns early and the shared.js handler
   handles it (graceful fallback). HD_CART stays the runtime source.
   ================================================================= */
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    return;  // disabled: HD_CART's size-aware drawer handler (shared.js) now owns +/-/remove
    /* eslint-disable no-unreachable */
    if (!e.target.closest || !e.target.closest('#cartDrawer')) return;
    var btn = e.target.closest('button[data-act]'); if (!btn) return;          // links still navigate normally
    var line = e.target.closest('.cart-line'); if (!line) return;
    if (!(window.Commerce && window.Commerce.cart)) return;                    // fallback → shared.js handler
    var slug = line.getAttribute('data-slug'); var act = btn.getAttribute('data-act');
    if (act !== 'inc' && act !== 'dec' && act !== 'remove') return;
    e.preventDefault(); e.stopImmediatePropagation();                          // own this click → no double update

    var cur = 0, items = (window.HD_CART && window.HD_CART.items) || [];
    for (var i = 0; i < items.length; i++) { if (items[i].slug === slug) { cur = items[i].qty; break; } }

    var done;
    if (act === 'inc') done = window.Commerce.cart.update(slug, cur + 1);
    else if (act === 'dec') done = (cur - 1 <= 0) ? window.Commerce.cart.remove(slug) : window.Commerce.cart.update(slug, cur - 1);
    else done = window.Commerce.cart.remove(slug);

    if (done && done.then) done.then(function () { if (window.HD_renderCart) window.HD_renderCart(); });
    else if (window.HD_renderCart) window.HD_renderCart();
  }, true);
})();
