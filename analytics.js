/* =================================================================
   Harvest Deli, Google Analytics 4 — consent-gated (GDPR / AVG)
   -----------------------------------------------------------------
   GA4 (G-DH37SQEXFL) loads ONLY after the visitor accepts the
   "analytics" cookie category in the Harvest Deli consent banner
   (HD_cookies / hd-cookie-consent-v1). Nothing is loaded, and no
   network call to Google is made, before that consent.

   - On page load: if analytics consent already given → load GA.
   - On consent change (hd:cookie-consent): load GA the moment the
     visitor accepts analytics. (If they later decline, GA is already
     loaded for this page; it will not load on subsequent pages.)
   ================================================================= */
(function () {
  'use strict';
  var GA_ID = 'G-DH37SQEXFL';
  var loaded = false;

  function loadGA() {
    if (loaded) return;
    loaded = true;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    // anonymize_ip keeps GA4 privacy-friendly for the EU market.
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  function check(consent) {
    if (consent && consent.analytics) loadGA();
  }

  // Already-given consent (returning visitor within the same browser).
  try {
    if (window.HD_cookies && typeof window.HD_cookies.get === 'function') {
      check(window.HD_cookies.get());
    }
  } catch (e) {}

  // Live consent decision from the banner / preferences.
  window.addEventListener('hd:cookie-consent', function (e) {
    check(e && e.detail);
  });
})();
