/* =================================================================
   Harvest Deli — Commerce config
   Single place to flip from mock data to a live Shopify backend.
   ================================================================= */
(function () {
  'use strict';
  window.HD_COMMERCE_CONFIG = {
    // 'mock'  → resolves from the local catalog (current behaviour)
    // 'shopify' → resolves via the Storefront API (commerce/storefront.js)
    source: 'mock',

    currency: 'EUR',
    locale: 'nl-NL',
    freeShippingThreshold: (typeof window.HD_FREE_SHIP === 'number' ? window.HD_FREE_SHIP : 120),

    // SEAM: fill these in to go live with headless Shopify.
    shopify: {
      domain: '',                 // e.g. 'harvest-deli.myshopify.com'
      storefrontToken: '',        // Storefront API public access token
      apiVersion: '2024-10'
    }
  };
})();
