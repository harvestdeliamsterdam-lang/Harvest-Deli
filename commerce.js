/* =================================================================
   Harvest Deli, Commerce layer (Phase 1: conversion & trust)
   -----------------------------------------------------------------
   Site-wide, non-invasive add-ons loaded on every page (injected by
   shared.js). Pure front-end; backend integrations are marked `// SEAM`.
     • Consent-gated analytics (GA4 + Meta) on top of the existing
       HD_cookies consent system + a vendor-neutral dataLayer (HD_track).
     • Floating WhatsApp support button.
     • Free-shipping progress bar inside the cart drawer.
   ================================================================= */
(function () {
  'use strict';

  /* Single source of truth for the free-shipping threshold (brand: €120 EU). */
  if (typeof window.HD_FREE_SHIP !== 'number') window.HD_FREE_SHIP = 120;

  /* --- config: replace with real IDs/number in production --- */
  var GA4_ID = 'G-XXXXXXXXXX';          // SEAM: Google Analytics 4 measurement ID
  var META_PIXEL_ID = '0000000000';      // SEAM: Meta Pixel ID
  var WHATSAPP_NUMBER = '31600000000';   // SEAM: support WhatsApp number (intl, no +)

  /* ============================ Analytics ============================ */
  window.dataLayer = window.dataLayer || [];
  /** Vendor-neutral event bus, always records to dataLayer; forwards to
   *  GA4/Meta only once the matching consent category is granted. */
  window.HD_track = function (event, params) {
    var payload = Object.assign({ event: event }, params || {});
    window.dataLayer.push(payload);
    var c = (window.HD_cookies && window.HD_cookies.get && window.HD_cookies.get()) || null;
    if (c && c.analytics && typeof window.gtag === 'function') {
      window.gtag('event', event, params || {});
    }
    if (c && c.marketing && typeof window.fbq === 'function') {
      var map = { view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', add_payment_info: 'AddPaymentInfo', purchase: 'Purchase' };
      if (map[event]) window.fbq('track', map[event], params || {});
    }
  };

  var loaded = { ga: false, meta: false };
  function loadGA() {
    if (loaded.ga || /XXXX/.test(GA4_ID)) return; // skip while placeholder
    loaded.ga = true;
    var s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(s);
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', GA4_ID, { anonymize_ip: true });
  }
  function loadMeta() {
    if (loaded.meta || META_PIXEL_ID === '0000000000') return; // skip while placeholder
    loaded.meta = true;
    /* eslint-disable */ // SEAM: standard Meta Pixel snippet
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL_ID); window.fbq('track', 'PageView');
  }
  function applyConsent() {
    var c = (window.HD_cookies && window.HD_cookies.get && window.HD_cookies.get()) || null;
    if (!c) return; // no choice yet → nothing loads (privacy-first / consent mode default deny)
    if (c.analytics) loadGA();
    if (c.marketing) loadMeta();
  }
  window.addEventListener('hd:cookie-consent', applyConsent);

  /* page_view on every load (recorded to dataLayer regardless; forwarded on consent) */
  function firePageView() {
    window.HD_track('page_view', { page_path: location.pathname, page_title: document.title });
  }

  /* add_to_cart, delegated, no edits to the cart internals */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    var slug = btn.getAttribute('data-add-to-cart');
    var p = (window.HD_product && window.HD_product(slug)) || null;
    window.HD_track('add_to_cart', { currency: 'EUR', value: p ? p.price : undefined, items: [{ item_id: slug, item_name: p ? p.name : slug, price: p ? p.price : undefined, quantity: 1 }] });
  });

  /* ========================= WhatsApp button ========================= */
  function injectWhatsApp() {
    if (document.getElementById('hdWhats')) return;
    var a = document.createElement('a');
    a.id = 'hdWhats';
    a.className = 'hd-whats';
    a.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent('Hello Harvest Deli, I have a question about');
    a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('aria-label', 'Chat with us on WhatsApp');
    a.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12.04 2.5a9.5 9.5 0 0 0-8.1 14.42L2.5 21.5l4.7-1.4A9.5 9.5 0 1 0 12.04 2.5Zm0 1.7a7.8 7.8 0 0 1 6.6 11.96c-.3.5-.32.9.02 1.3l-.03-.02-3.1-.93a.85.85 0 0 0-.66.08 7.78 7.78 0 1 1-2.83-12.47Zm-2.5 3.2c-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.27 0 1.34.97 2.63 1.1 2.81.14.18 1.9 2.9 4.6 3.96 2.26.89 2.72.71 3.21.67.5-.05 1.6-.65 1.83-1.28.22-.63.22-1.17.16-1.28-.07-.11-.25-.18-.52-.31-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.72-1.34-1.6-1.5-1.87-.16-.27-.02-.42.12-.55.12-.12.27-.32.4-.48.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.48-.07-.14-.6-1.47-.83-2.01-.21-.51-.43-.44-.6-.45h-.5Z"/></svg>';
    document.body.appendChild(a);
  }

  /* ====================== Free-shipping progress ===================== */
  function parsePrice(txt) { return parseFloat(String(txt || '').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0; }
  function fmt(n) { n = Math.round((n || 0) * 100) / 100; return Number.isInteger(n) ? '€' + n : '€' + n.toFixed(2); }
  function updateFreeBar() {
    var foot = document.querySelector('.cart-foot');
    var totalEl = document.getElementById('cartTotal');
    if (!foot || !totalEl) return;
    var bar = document.getElementById('hdFreeBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'hdFreeBar'; bar.className = 'hd-free-bar';
      bar.innerHTML = '<div class="hd-free-msg" role="status" aria-live="polite"></div><div class="hd-free-track"><span class="hd-free-fill"></span></div>';
      foot.insertBefore(bar, foot.firstChild);
    }
    var total = parsePrice(totalEl.textContent);
    var threshold = window.HD_FREE_SHIP || 120;
    var remain = threshold - total;
    var msg = bar.querySelector('.hd-free-msg');
    var fill = bar.querySelector('.hd-free-fill');
    var lang = (window.HD_lang && window.HD_lang()) || 'nl';
    if (total <= 0) { bar.hidden = true; return; }
    bar.hidden = false;
    if (remain <= 0) {
      msg.textContent = lang === 'nl' ? 'Je komt in aanmerking voor gratis verzending' : (lang === 'el' ? 'Δικαιούστε δωρεάν αποστολή' : 'You qualify for free shipping');
      msg.classList.add('done');
      fill.style.width = '100%';
    } else {
      msg.classList.remove('done');
      msg.textContent = (lang === 'nl' ? 'Nog ' + fmt(remain) + ' voor gratis verzending' : (lang === 'el' ? 'Ακόμη ' + fmt(remain) + ' για δωρεάν αποστολή' : fmt(remain) + ' away from free shipping'));
      fill.style.width = Math.max(4, Math.min(100, (total / threshold) * 100)) + '%';
    }
  }
  /* keep the bar in sync: the drawer re-renders #cartTotal text on every change */
  function watchCart() {
    var totalEl = document.getElementById('cartTotal');
    if (totalEl && window.MutationObserver) {
      new MutationObserver(updateFreeBar).observe(totalEl, { childList: true, characterData: true, subtree: true });
    }
    updateFreeBar();
  }

  function init() {
    firePageView();
    applyConsent();
    /* WhatsApp floating button removed by request, the concierge "Schrijf ons"
       pill (bottom-right) is the contact affordance. injectWhatsApp() kept for
       reference / future re-enable. */
    /* injectWhatsApp(); */
    // drawer is injected by shared.js; wait a tick so .cart-foot exists
    setTimeout(watchCart, 60);
    document.addEventListener('hd:cart-changed', updateFreeBar);
    window.addEventListener('hd:lang', updateFreeBar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
