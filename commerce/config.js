/* =================================================================
   Harvest Deli — Commerce config
   Single place to flip from mock data to a live Shopify backend.
   =================================================================

   GO LIVE WITH SHOPIFY — 2 edits, here:
     1) shopify.storefrontToken : paste the Storefront API access token
        (Shopify admin → Settings → Apps and sales channels → Develop apps
         → your app → API credentials → Storefront API access token).
     2) source : change 'mock' → 'shopify'.
   Nothing else needs to change. The UI is identical; product reads, cart and
   checkout route through commerce/storefront.js automatically. If Shopify is
   unreachable or the token is missing, the layer safely falls back to the
   local mock catalog, so the site never breaks.

   NOTE: the Storefront access token is a PUBLIC, read-only token (safe in
   client code). It is NOT the Admin API token — never put an Admin token here.
   There is no build step, so this value is read directly from this file.
   ================================================================= */
(function () {
  'use strict';
  window.HD_COMMERCE_CONFIG = {
    // 'mock'    → resolves from the local catalog (current behaviour)
    // 'shopify' → resolves via the Storefront API (commerce/storefront.js)
    source: 'mock',

    currency: 'EUR',
    locale: 'nl-NL',
    freeShippingThreshold: (typeof window.HD_FREE_SHIP === 'number' ? window.HD_FREE_SHIP : 120),

    shopify: {
      domain: 'su08c4-v4.myshopify.com',   // the connected store (public)
      storefrontToken: '',                  // ← PASTE STOREFRONT API TOKEN HERE (placeholder)
      apiVersion: '2024-10'
    }
  };
})();
