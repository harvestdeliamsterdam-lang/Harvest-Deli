/* =================================================================
   Harvest Deli — Shopify Storefront API client (THE SEAM)
   -----------------------------------------------------------------
   This is the ONE file that talks to Shopify. Today it is inert
   (config.source === 'mock'). To go live:
     1. Fill window.HD_COMMERCE_CONFIG.shopify.{domain,storefrontToken}
     2. Set source: 'shopify'
     3. The adapter (commerce.js) will route reads through here.
   The GraphQL documents below are the real queries you'll use.
   ================================================================= */
(function () {
  'use strict';
  var cfg = function () { return (window.HD_COMMERCE_CONFIG || {}).shopify || {}; };

  /** Low-level GraphQL POST to the Storefront API. */
  async function storefrontFetch(query, variables) {
    var s = cfg();
    if (!s.domain || !s.storefrontToken) {
      throw new Error('[storefront] not configured — set domain + storefrontToken and source:"shopify"');
    }
    // SEAM: real network call.
    var res = await fetch('https://' + s.domain + '/api/' + (s.apiVersion || '2024-10') + '/graphql.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': s.storefrontToken
      },
      body: JSON.stringify({ query: query, variables: variables || {} })
    });
    var json = await res.json();
    if (json.errors) throw new Error('[storefront] ' + JSON.stringify(json.errors));
    return json.data;
  }

  /* The canonical queries — kept here so the integration is copy-paste. */
  var QUERIES = {
    productByHandle: `query Product($handle: String!) {
      product(handle: $handle) {
        id handle title descriptionHtml productType vendor tags availableForSale totalInventory
        seo { title description }
        images(first: 10) { nodes { id url altText width height } }
        variants(first: 50) { nodes {
          id title sku availableForSale quantityAvailable
          price { amount currencyCode } compareAtPrice { amount currencyCode }
          selectedOptions { name value } image { id url altText }
        } }
        priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
        collections(first: 10) { nodes { handle } }
      }
    }`,
    collectionByHandle: `query Collection($handle: String!, $first: Int = 24) {
      collection(handle: $handle) {
        id handle title descriptionHtml image { id url altText }
        seo { title description }
        products(first: $first) { nodes { handle } }
      }
    }`,
    predictiveSearch: `query Search($query: String!) {
      predictiveSearch(query: $query, limit: 8) {
        products { id handle title featuredImage { url altText } priceRange { minVariantPrice { amount currencyCode } } }
      }
    }`,
    cartCreate: `mutation cartCreate($lines: [CartLineInput!]) {
      cartCreate(input: { lines: $lines }) { cart { id checkoutUrl } } }`,
    cartLinesAdd: `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) { cart { id checkoutUrl totalQuantity } } }`
  };

  window.HD_Storefront = { fetch: storefrontFetch, QUERIES: QUERIES, isConfigured: function () { var s = cfg(); return !!(s.domain && s.storefrontToken); } };
})();
