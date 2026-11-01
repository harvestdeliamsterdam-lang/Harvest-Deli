/* =================================================================
   Harvest Deli, Shopify Storefront API client (THE SEAM)
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
      throw new Error('[storefront] not configured, set domain + storefrontToken and source:"shopify"');
    }
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;
    try {
      var res = await fetch('https://' + s.domain + '/api/' + (s.apiVersion || '2026-07') + '/graphql.json', {
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

  /** Same call, but never throws, returns null on any failure (timeout, network,
      GraphQL error). commerce.js uses this so it can fall back to the mock catalog. */
  async function safeFetch(query, variables) {
    try { return await storefrontFetch(query, variables); }
    catch (e) {
      if (window.console) console.warn('[storefront] request failed, falling back to mock:', e && e.message);
      return null;
    }
  }

  /* The canonical queries/mutations, kept here so the integration is copy-paste. */
  var QUERIES = {
    /* ---- catalog reads ---- */
    products: `query Products($first: Int = 50) {
      products(first: $first) {
        nodes {
          id handle title descriptionHtml productType vendor tags availableForSale
          seo { title description }
          featuredImage { id url altText width height }
          images(first: 10) { nodes { id url altText width height } }
          variants(first: 50) { nodes {
            id title sku availableForSale
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
        id handle title descriptionHtml productType vendor tags availableForSale
        seo { title description }
        images(first: 10) { nodes { id url altText width height } }
        variants(first: 50) { nodes {
          id title sku availableForSale
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
    /* @inContext carries the visitor's cookie choice (visitorConsent, API
       2025-10+), country and language into the checkoutUrl. Shopify reads it
       (the _cs parameter) and only runs checkout pixels, such as the Google &
       YouTube pixel that reports purchases, when the visitor agreed. */
    /* $discountCodes / $attributes (01-11-2026): the welcome code chosen in
       welcome.js and its test group travel with the cart; Shopify alone
       decides whether the code applies (discountCodes.applicable). */
    cartCreate: `mutation cartCreate($lines: [CartLineInput!], $buyerIdentity: CartBuyerIdentityInput, $discountCodes: [String!], $attributes: [AttributeInput!], $country: CountryCode, $language: LanguageCode, $consent: VisitorConsent)
      @inContext(country: $country, language: $language, visitorConsent: $consent) {
      cartCreate(input: { lines: $lines, buyerIdentity: $buyerIdentity, discountCodes: $discountCodes, attributes: $attributes }) {
        cart { id checkoutUrl totalQuantity cost { subtotalAmount { amount currencyCode } } discountCodes { code applicable } }
        userErrors { field message }
      } }`,
    /* Read-only preview for the cart drawer: a throwaway cart with the same
       lines and code, so the drawer can say "toegepast" only once Shopify has
       confirmed it. Its id is never stored and it never becomes the checkout. */
    cartPreview: `mutation cartPreview($lines: [CartLineInput!], $discountCodes: [String!], $country: CountryCode)
      @inContext(country: $country) {
      cartCreate(input: { lines: $lines, discountCodes: $discountCodes, buyerIdentity: { countryCode: $country } }) {
        cart {
          discountCodes { code applicable }
          discountAllocations { discountedAmount { amount } ... on CartCodeDiscountAllocation { code } }
          cost { subtotalAmount { amount } }
          lines(first: 50) { nodes { discountAllocations { discountedAmount { amount } } } }
        }
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
