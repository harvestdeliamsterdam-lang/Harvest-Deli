/* =================================================================
   Harvest Deli — Product page × Commerce (reference migration)
   -----------------------------------------------------------------
   Makes the PRODUCT DETAIL PAGE consume window.Commerce as its data
   source, while leaving all markup, CSS, animations and the existing
   variant/price UI exactly as they are. Fully non-breaking:
     • If Commerce is unavailable → does nothing (static HTML stands).
     • Inventory line is driven by Commerce (availableForSale / totalInventory).
     • Add-to-cart routes through Commerce.cart.add (which bridges HD_CART);
       the global shared.js handler stays as the fallback.
     • "Pairs well with" list is sourced from Commerce.products.recommendations.
     • SEO og: tags are filled from product.seo ONLY if missing (no duplicates).
   This is the reference pattern for migrating other pages later.
   ================================================================= */
(function () {
  'use strict';
  var metaEl = document.querySelector('meta[name="hd-product-slug"]');
  if (!metaEl || !metaEl.content) return;           // only product pages
  var handle = metaEl.content;
  var product = null;
  function L(en, nl) { return (window.HD_lang && window.HD_lang() === 'nl') ? nl : en; }
  function fmtPrice(m) { var n = m ? +m.amount : 0; return Number.isInteger(n) ? '€' + n : '€' + n.toFixed(2); }

  /* 3 — inventory display from Commerce (in stock / only X left / sold out / pre-order) */
  function setStock() {
    var el = document.querySelector('.pd-stock'); if (!el || !product) return;
    var dot = el.querySelector('.pd-stock-dot');
    var st = window.HD_stock && window.HD_stock.get ? window.HD_stock.get(handle) : null;
    var txt, cls = '';
    if (!product.availableForSale) { txt = L('Sold out', 'Uitverkocht'); cls = 'is-out'; }
    else if (st && st.status === 'backorder') { txt = L('Available to pre-order', 'Beschikbaar voor pre-order') + (st.eta ? ' · ' + st.eta : ''); cls = 'is-backorder'; }
    else if (product.totalInventory > 0 && product.totalInventory <= 6) { txt = L('Only ' + product.totalInventory + ' left · ready to ship', 'Nog ' + product.totalInventory + ' op voorraad · klaar voor verzending'); cls = 'is-low'; }
    else { txt = L('In stock · ready to ship', 'Op voorraad · klaar voor verzending'); }
    el.classList.remove('is-low', 'is-out', 'is-backorder'); if (cls) el.classList.add(cls);
    el.innerHTML = ''; if (dot) el.appendChild(dot); el.appendChild(document.createTextNode(' ' + txt));
  }

  /* 4 — add-to-cart via Commerce (capture phase; only this product's own CTAs).
     Falls through to the global shared.js handler if Commerce is missing. */
  function wireAddToCart() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-add-to-cart]');
      if (!btn || btn.getAttribute('data-add-to-cart') !== handle) return;  // scope: page product only
      if (!(window.Commerce && window.Commerce.cart)) return;               // fallback: let shared.js handle it
      if (window.HD_stock) { var s = window.HD_stock.get(handle); if (s && s.status === 'out') return; } // let inventory guard win
      e.preventDefault(); e.stopImmediatePropagation();                     // prevent the shared.js double-add
      var qty = parseInt(btn.dataset.qty || '1', 10) || 1;
      window.Commerce.cart.add(handle, qty).then(function () {
        if (window.HD_renderCart) window.HD_renderCart();
        var p = window.HD_product && window.HD_product(handle);
        if (window.HD_toast) window.HD_toast(L('Added to the cellar', 'Toegevoegd aan de kelder') + (p ? ' — ' + p.name : ''));
        if (btn.dataset.openCart !== 'false' && window.HD_openCart) setTimeout(window.HD_openCart, 240);
        if (window.HD_track) window.HD_track('add_to_cart', { currency: 'EUR', value: product ? +product.priceRange.minVariantPrice.amount : undefined, items: [{ item_id: handle, quantity: qty }] });
      });
    }, true);
  }

  /* 5 — recommendations list sourced from Commerce, rendered into the
     existing "Pairs well with" cards (same markup; data now from Commerce) */
  async function wireRecommendations() {
    if (!(window.Commerce && window.Commerce.products)) return;
    var host = document.querySelector('#pxExtras .px-pairs');
    if (!host) return; // product-extras section not present → skip
    var recs;
    try { recs = await window.Commerce.products.recommendations(handle, 3); } catch (e) { return; }
    if (!recs || !recs.length) return;
    host.innerHTML = recs.map(function (r) {
      var lp = window.HD_product && window.HD_product(r.handle);   // reuse local accessor for url + localized fields
      var url = lp ? lp.url : (r.handle + '.html');
      var img = (r.images && r.images[0] && r.images[0].url) || (lp && lp.image) || '';
      var name = lp ? lp.name : r.title;
      var note = (lp && (lp.notes || lp.region)) || (r.metafields && r.metafields.region) || '';
      var price = fmtPrice(r.priceRange && r.priceRange.minVariantPrice);
      return '<a class="px-pair" href="' + url + '" data-commerce-rec>' +
        '<span class="px-pair-img"><img src="' + img + '" alt="" loading="lazy"></span>' +
        '<span class="px-pair-meta"><span class="px-pair-name">' + name + '</span>' +
        '<span class="px-pair-note">' + note + '</span>' +
        '<span class="px-pair-price">' + price + '</span></span></a>';
    }).join('');
  }

  /* 6 — SEO: fill og: tags from product.seo only if absent (never duplicate) */
  function setSEO() {
    if (!product || !product.seo) return;
    function ensureMeta(prop, content) {
      if (!content) return;
      if (document.head.querySelector('meta[property="' + prop + '"]')) return; // keep existing
      var m = document.createElement('meta'); m.setAttribute('property', prop); m.setAttribute('content', content); document.head.appendChild(m);
    }
    ensureMeta('og:type', 'product');
    ensureMeta('og:title', product.seo.title);
    ensureMeta('og:description', product.seo.description);
    ensureMeta('product:price:amount', product.priceRange.minVariantPrice.amount);
    ensureMeta('product:price:currency', product.priceRange.minVariantPrice.currencyCode);
  }

  async function init() {
    try { product = await window.Commerce.products.get(handle); } catch (e) { product = null; }
    if (!product) return;                 // graceful fallback → static HTML stays as-is
    window.HD_PRODUCT_COMMERCE = product; // exposed for debugging / further wiring
    setStock();
    wireAddToCart();
    setSEO();
    wireRecommendations();
    window.addEventListener('hd:inventory-ready', setStock);
    window.addEventListener('hd:lang', function () { setStock(); wireRecommendations(); });
  }

  // Commerce loads async (addon). Wait for it, then bind; give up quietly after ~3s.
  var tries = 0;
  (function boot() {
    if (window.Commerce && window.Commerce.products) { init(); return; }
    if (tries++ < 60) setTimeout(boot, 50);
  })();
})();
