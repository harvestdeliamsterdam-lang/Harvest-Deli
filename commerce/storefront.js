/* =================================================================
   Harvest Deli — Shopify Storefront API client (THE SEAM)
   -----------------------------------------------------------------
   This is the ONE file that talks to Shopify. Today it is inert
   (config.source === 'mock'). To go live:
     1. Fill window.HD_COMMERCE_CONFIG.shopify.storefrontToken (commerce/config.js)
     2. Set source: 'shopify'
     3. The adapter (commerce.js) routes reads/cart/checkout through here.
   The GraphQL documents below are the real queries/mutations you'll use.

   Safety: `safeFetch` wraps every call with a timeout + try/catch and returns
   null on failure, so a Shopify outage degrades gracefully to the mock catalog
   in commerce.js (the static site never throws).
   ================================================================= */
(function () {
  'use strict';
  var cfg = function () { return (window.HD_COMMERCE_CONFIG || {}).shopify || {}; };
  var TIMEOUT_MS = 9000;

  function isConfigured() { var s = cfg(); return !!(s.domain && s.storefrontToken); }

  /** Low-level GraphQL POST to the Storefront API. Throws on error. */
  async function storefrontFetch(query, variables) {
    var s = cfg();
    if (!s.domain || !s.storefrontToken) {
      throw new Error('[storefront] not configured — set domain + storefrontToken and source:"shopify"');
    }
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;
    try {
      var res = await fetch('https://' + s.domain + '/api/' + (s.apiVersion || '2024-10') + '/graphql.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': s.storefrontToken
        },
        body: JSON.stringify({ query: query, variables: variables || {} }),
        signal: ctrl ? ctrl.signal : undefined
      });
      if (!res.ok) throw new Error('[storefront] HTTP ' + res.status);
      var json = await res.json();
      if (json.errors) throw new Error('[storefront] ' + JSON.stringify(json.errors));
      return json.data;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /** Same call, but never throws — returns null on any failure (timeout, network,
      GraphQL error). commerce.js uses this so it can fall back to the mock catalog. */
  async function safeFetch(query, variables) {
    try { return await storefrontFetch(query, variables); }
    catch (e) {
      if (window.console) console.warn('[storefront] request failed, falling back to mock:', e && e.message);
      return null;
    }
  }

  /* The canonical queries/mutations — kept here so the integration is copy-paste. */
  var QUERIES = {
    /* ---- catalog reads ---- */
    products: `query Products($first: Int = 50) {
      products(first: $first) {
        nodes {
          id handle title descriptionHtml productType vendor tags availableForSale totalInventory
          seo { title description }
          featuredImage { id url altText width height }
          images(first: 10) { nodes { id url altText width height } }
          variants(first: 50) { nodes {
            id title sku availableForSale quantityAvailable
            price { amount currencyCode } compareAtPrice { amount currencyCode }
            selectedOptions { name value }
          } }
          priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
          collections(first: 10) { nodes { handle } }
        }
      }
    }`,
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
    collections: `query Collections($first: Int = 20) {
      collections(first: $first) { nodes { id handle title descriptionHtml image { id url altText } } }
    }`,
    predictiveSearch: `query Search($query: String!) {
      predictiveSearch(query: $query, limit: 8) {
        products { id handle title featuredImage { url altText } priceRange { minVariantPrice { amount currencyCode } } }
      }
    }`,

    /* ---- cart + checkout ---- */
    cartCreate: `mutation cartCreate($lines: [CartLineInput!]) {
      cartCreate(input: { lines: $lines }) {
        cart { id checkoutUrl totalQuantity cost { subtotalAmount { amount currencyCode } } }
        userErrors { field message }
      } }`,
    cartGet: `query cart($cartId: ID!) {
      cart(id: $cartId) {
        id checkoutUrl totalQuantity
        cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } }
        lines(first: 100) { nodes {
          id quantity
          cost { totalAmount { amount currencyCode } }
          merchandise { ... on ProductVariant {
            id title price { amount currencyCode } image { url altText }
            product { id handle title productType }
          } }
        } }
      } }`,
    cartLinesAdd: `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) { cart { id checkoutUrl totalQuantity } userErrors { field message } } }`,
    cartLinesUpdate: `mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { id checkoutUrl totalQuantity } userErrors { field message } } }`,
    cartLinesRemove: `mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { id checkoutUrl totalQuantity } userErrors { field message } } }`
  };

  window.HD_Storefront = {
    fetch: storefrontFetch,   // throws on error
    safeFetch: safeFetch,     // returns null on error (preferred by commerce.js)
    QUERIES: QUERIES,
    isConfigured: isConfigured
  };
})();
