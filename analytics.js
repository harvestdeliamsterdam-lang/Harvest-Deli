/* =================================================================
   Harvest Deli: Google tag, Consent Mode v2 and GA4 ecommerce
   -----------------------------------------------------------------
   The one place that talks to Google on harvestdeli.nl.

   Consent (Consent Mode v2, "basic")
   - Every visitor starts with ad_storage, analytics_storage,
     ad_user_data and ad_personalization DENIED.
   - gtag.js is not even downloaded until the visitor opts in through the
     Harvest Deli banner (HD_cookies, event hd:cookie-consent). That matches
     the banner text: analytics is "pas geladen na jouw toestemming".
   - On a choice, the state is sent with gtag('consent','update'), so every
     hit carries the real consent signals (gcs / gcd).
       analytics  -> analytics_storage
       marketing  -> ad_storage, ad_user_data, ad_personalization
   - Withdrawing consent updates the state on the open page, removes the
     _ga cookies, and nothing loads on later pages.

   Who sends which event (never twice)
   - This file:   page_view (gtag config), view_item_list, select_item,
                  view_item, add_to_cart, remove_from_cart, view_cart.
   - Shopify:     begin_checkout, add_shipping_info, add_payment_info and
                  purchase come from the Google & YouTube pixel inside
                  Shopify checkout, which is where they actually happen.
                  The consent chosen here travels along with the cart
                  (commerce/commerce.js, @inContext visitorConsent).

   Item IDs match what that Shopify pixel sends
   (shopify_ZZ_<productId>_<variantId>, Dutch Shopify title), so site and
   checkout events join up in GA4 reports.
   ================================================================= */
(function () {
  'use strict';
  if (window.HD_analytics) return;

  var GA4_ID = 'G-DH37SQEXFL';
  /* Google Ads tag for remarketing and the conversion linker. Leave empty
     until the Ads account is linked; purchases are measured by the Shopify
     app either way. Format: 'AW-123456789'. */
  var ADS_ID = '';
  /* Checkout hosts, so the Google linker can carry the session across. */
  var LINKER_DOMAINS = ['harvestdeli.nl', 'shop.harvestdeli.nl', 'su08c4-v4.myshopify.com'];

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  /* Must be the first Google command on the page. */
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'linker', { domains: LINKER_DOMAINS });

  var state = { decided: false, analytics: false, marketing: false };
  var tagLoaded = false, gaConfigured = false, adsConfigured = false;
  var buffer = [];              // ecommerce events from this page, before a choice
  var log = window.HD_trackLog = window.HD_trackLog || [];

  function readConsent() {
    try { return (window.HD_cookies && window.HD_cookies.get && window.HD_cookies.get()) || null; } catch (e) { return null; }
  }

  function loadTag() {
    if (tagLoaded) return;
    tagLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
  }

  function removeGaCookies() {
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^(_ga|_ga_.+|_gid|_gcl_.+)$/.test(name)) return;
      ['', host, '.' + host].forEach(function (d) {
        document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  function applyConsent(c) {
    var had = { analytics: state.analytics, marketing: state.marketing };
    state.decided = !!c;
    state.analytics = !!(c && c.analytics);
    state.marketing = !!(c && c.marketing);
    if (!c) return;

    /* Withdrawn on an open page: Google's documented opt-out flag stops this
       page's tag from sending anything more (it otherwise flushed one last
       hit and a cookieless engagement ping on leaving). Cleared on re-consent. */
    window['ga-disable-' + GA4_ID] = !state.analytics;

    gtag('consent', 'update', {
      analytics_storage: state.analytics ? 'granted' : 'denied',
      ad_storage: state.marketing ? 'granted' : 'denied',
      ad_user_data: state.marketing ? 'granted' : 'denied',
      ad_personalization: state.marketing ? 'granted' : 'denied'
    });
    if ((had.analytics && !state.analytics) || (had.marketing && !state.marketing)) removeGaCookies();

    if (state.analytics && !gaConfigured) {
      loadTag();
      gaConfigured = true;
      gtag('config', GA4_ID);                  // sends the one page_view for this page
    }
    if (state.marketing && ADS_ID && !adsConfigured) {
      loadTag();
      adsConfigured = true;
      gtag('config', ADS_ID);
    }
    if (state.analytics) flush();
    else buffer.length = 0;
  }

  function send(event, params) {
    var p = Object.assign({ send_to: GA4_ID }, params || {});
    gtag('event', event, p);
    log.push({ event: event, params: params, t: Date.now() });
  }
  function flush() {
    var pending = buffer.splice(0);
    pending.forEach(function (e) { send(e.event, e.params); });
  }

  /* Public event bus. Other scripts may call HD_track(name, params). */
  function track(event, params) {
    if (state.analytics && gaConfigured) { send(event, params); }
    else if (!state.decided) { if (buffer.length < 30) buffer.push({ event: event, params: params }); }
    if (state.marketing && typeof window.fbq === 'function') {
      var map = { view_item: 'ViewContent', add_to_cart: 'AddToCart' };
      if (map[event]) window.fbq('track', map[event], { value: params && params.value, currency: 'EUR' });
    }
  }
  window.HD_track = track;

  /* ---------------------------- items ----------------------------- */
  var CATEGORY = { honey: 'Honey', herb: 'Herb', oil: 'Olive Oil', tea: 'Tea' };
  var URL_TO_SLUG = {
    'chestnut-honey': 'chestnut', 'pine-honey': 'pine', 'oak-honey': 'oak', 'arbutus-honey': 'arbutus',
    'vanilla-honey': 'fir-vanilla', 'orange-blossom-honey': 'orange-blossom', 'acacia-honey': 'acacia',
    'thyme-honey': 'thyme', 'heather-honey': 'heather', 'wild-oregano': 'oregano',
    'extra-virgin-olive-oil': 'olive-oil', 'greek-mountain-tea': 'mountain-tea', 'greek-chamomile-tea': 'chamomile-tea'
  };
  function sizeFor(p, sizeId) {
    var sizes = p.sizes || [];
    return sizes.filter(function (s) { return s.id === sizeId; })[0] ||
           sizes.filter(function (s) { return s.id === p.defaultSize; })[0] || sizes[0] || null;
  }
  function round2(n) { return Math.round(n * 100) / 100; }
  function gaItem(slug, sizeId, qty, extra) {
    var p = window.HD_PRODUCTS && window.HD_PRODUCTS[slug];
    if (!p) return null;
    var s = sizeFor(p, sizeId);
    var nameNl = (p.name && (p.name.nl || p.name.en)) || slug;
    var it = {
      item_id: (p.pid && s && s.vid) ? 'shopify_ZZ_' + p.pid + '_' + s.vid : (s && s.sku) || slug,
      item_name: 'Harvest Deli ' + nameNl,
      item_brand: 'Harvest Deli',
      item_category: CATEGORY[p.type] || 'Honey',
      item_variant: s ? s.label : undefined,
      price: s ? s.price : p.price,
      quantity: qty || 1
    };
    if (s && s.sku) it.sku = s.sku;
    if (s && s.vid) it.variant_id = s.vid;
    return Object.assign(it, extra || {});
  }
  function valueOf(items) {
    return round2(items.reduce(function (a, i) { return a + (i.price || 0) * (i.quantity || 1); }, 0));
  }
  window.HD_gaItem = gaItem;

  function slugFromHref(href) {
    try {
      var u = new URL(href, location.href);
      if (u.origin !== location.origin) return null;
      var m = u.pathname.match(/^\/products\/([a-z0-9-]+)/);
      if (m) return URL_TO_SLUG[m[1]] || null;
      var q = u.searchParams.get('p');
      if (q && window.HD_PRODUCTS && window.HD_PRODUCTS[q]) return q;
      var f = u.pathname.match(/^\/product-([a-z-]+)\.html/);
      if (f) return URL_TO_SLUG[f[1]] || (window.HD_PRODUCTS && window.HD_PRODUCTS[f[1]] ? f[1] : null);
    } catch (e) {}
    return null;
  }

  /* --------------------------- view_item --------------------------- */
  function pageSlug() {
    var m = document.querySelector('meta[name="hd-product-slug"]');
    return m && m.content ? m.content : null;
  }
  function selectedSize() {
    var r = document.querySelector('input[name="hd-variant"]:checked');
    return (r && r.dataset.size) || null;
  }
  function viewItem() {
    var slug = pageSlug();
    if (!slug) return;
    var it = gaItem(slug, selectedSize(), 1);
    if (!it) return;
    track('view_item', { currency: 'EUR', value: it.price, items: [it] });
  }

  /* ---------------------- view_item_list / select_item ---------------------- */
  /* Lists are marked in the HTML: data-ga-list="id|Name". The items are the
     product links inside, in document order, one per product. */
  function listItems(container, listId, listName) {
    var seen = {}, items = [];
    container.querySelectorAll('a[href]').forEach(function (a) {
      var slug = slugFromHref(a.getAttribute('href'));
      if (!slug || seen[slug]) return;
      seen[slug] = true;
      var it = gaItem(slug, null, 1, { item_list_id: listId, item_list_name: listName, index: items.length });
      if (it) items.push(it);
    });
    return items;
  }
  function watchLists() {
    var fired = typeof WeakSet === 'function' ? new WeakSet() : null;
    function consider(el) {
      if (fired && fired.has(el)) return;
      var parts = (el.getAttribute('data-ga-list') || '').split('|');
      var items = listItems(el, parts[0], parts[1] || parts[0]);
      if (!items.length) return;                  // grid not hydrated yet
      if (fired) fired.add(el);
      track('view_item_list', { item_list_id: parts[0], item_list_name: parts[1] || parts[0], items: items });
    }
    var watched = typeof WeakSet === 'function' ? new WeakSet() : null;
    var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        consider(en.target);
        if (!fired || fired.has(en.target)) io.unobserve(en.target);
      });
    }, { threshold: 0.15 }) : null;
    /* Lists can arrive later (the "Past goed bij" cards are added by script),
       so the page is scanned again once it has loaded. */
    function scan() {
      document.querySelectorAll('[data-ga-list]').forEach(function (el) {
        if (watched && watched.has(el)) return;
        if (watched) watched.add(el);
        if (!io) { consider(el); return; }
        watch(el);
      });
    }
    function watch(el) {
      io.observe(el);
      /* Cards arrive later from Shopify: re-check when the list fills up. */
      if (window.MutationObserver) {
        var mo = new MutationObserver(function () {
          if (fired && fired.has(el)) { mo.disconnect(); return; }
          var r = el.getBoundingClientRect();
          if (r.top < innerHeight && r.bottom > 0) consider(el);
        });
        mo.observe(el, { childList: true, subtree: true });
      }
    }
    scan();
    if (document.readyState === 'complete') setTimeout(scan, 1500);
    else window.addEventListener('load', function () { setTimeout(scan, 1500); });

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('[data-ga-list] a[href]');
      if (!a) return;
      var list = a.closest('[data-ga-list]');
      var slug = slugFromHref(a.getAttribute('href'));
      if (!slug) return;
      var parts = (list.getAttribute('data-ga-list') || '').split('|');
      var all = listItems(list, parts[0], parts[1] || parts[0]);
      var it = all.filter(function (x) { return x.item_id === (gaItem(slug, null, 1) || {}).item_id; })[0];
      if (!it) return;
      track('select_item', { item_list_id: parts[0], item_list_name: parts[1] || parts[0], items: [it] });
    }, true);
  }

  /* ------------------ add_to_cart / remove_from_cart ------------------ */
  window.addEventListener('hd:cart-line', function (e) {
    var d = e.detail || {};
    if (!d.slug || !d.delta) return;
    var it = gaItem(d.slug, d.size, Math.abs(d.delta));
    if (!it) return;
    track(d.delta > 0 ? 'add_to_cart' : 'remove_from_cart', { currency: 'EUR', value: valueOf([it]), items: [it] });
  });

  /* ----------------------------- view_cart ----------------------------- */
  window.addEventListener('hd:cart-open', function () {
    var cart = window.HD_CART;
    if (!cart || !cart.items || !cart.items.length) return;
    var items = cart.items.map(function (i) { return gaItem(i.slug, i.size, i.qty); }).filter(Boolean);
    if (!items.length) return;
    var discount = (cart.offerDiscount && cart.offerDiscount()) || 0;
    track('view_cart', { currency: 'EUR', value: round2(Math.max(0, valueOf(items) - discount)), items: items });
  });

  /* Navigate to an external checkout through a real link, so the Google
     linker can add its _gl parameter for the checkout domain. The linker
     decorates on mousedown, which a.click() alone never fires (measured
     30-10-2026: no _gl without it). It only acts after analytics consent. */
  window.HD_navigate = function (url) {
    try {
      var a = document.createElement('a');
      a.href = url;
      a.rel = 'noopener';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      a.click();
    } catch (e) { location.href = url; }
  };

  /* Shopify gets the same choice for its checkout (see commerce/commerce.js). */
  window.HD_visitorConsent = function () {
    var c = readConsent();
    return {
      analytics: !!(c && c.analytics),
      marketing: !!(c && c.marketing),
      preferences: !!c,           // language and cart memory: part of "strikt noodzakelijk"
      saleOfData: !!(c && c.marketing)
    };
  };

  window.HD_analytics = {
    state: function () { return Object.assign({ tagLoaded: tagLoaded }, state); },
    item: gaItem
  };

  /* ------------------------------ boot ------------------------------ */
  applyConsent(readConsent());
  window.addEventListener('hd:cookie-consent', function (e) { applyConsent((e && e.detail) || readConsent()); });

  function boot() { viewItem(); watchLists(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
