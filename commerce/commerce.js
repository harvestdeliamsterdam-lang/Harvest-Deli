/* =================================================================
   Harvest Deli — Commerce adapter (window.Commerce)
   -----------------------------------------------------------------
   The single API surface the frontend should use for commerce.
   Today it resolves from the local catalog (HD_product / HD_stock /
   HD_CART) and RESHAPES everything into Shopify Storefront types
   (see commerce/types.js). When config.source === 'shopify' the read
   paths route through HD_Storefront instead — same shapes out, so UI
   never changes.

   Namespaces: Commerce.products / collections / cart / customer /
   search / filters. All reads are async (Promise) to mirror Shopify.
   ================================================================= */
(function () {
  'use strict';
  var CFG = function () { return window.HD_COMMERCE_CONFIG || { source: 'mock', currency: 'EUR' }; };
  var CUR = function () { return CFG().currency || 'EUR'; };
  var SLUGS = ['arbutus','oak','fir-vanilla','orange-blossom','acacia','thyme','chestnut','pine','heather','olive-oil','mountain-tea'];

  function money(n) { return { amount: (Math.round((+n || 0) * 100) / 100).toFixed(2), currencyCode: CUR() }; }
  function gid(kind, id) { return 'gid://shopify/' + kind + '/' + id; }
  function typeOf(slug) { return slug === 'olive-oil' ? 'Olive Oil' : slug === 'mountain-tea' ? 'Tea' : 'Honey'; }
  function stockState(slug) {
    var s = window.HD_stock && window.HD_stock.get ? window.HD_stock.get(slug) : null;
    if (!s) return { available: 99, state: 'in_stock' };
    var map = { in: 'in_stock', low: 'low_stock', out: 'out_of_stock', backorder: 'backorder' };
    return { available: s.qty, state: map[s.status] || 'in_stock' };
  }

  /** Map the local catalog entry → Storefront Product shape. */
  function toProduct(slug) {
    var p = window.HD_product && window.HD_product(slug);
    if (!p) return null;
    var st = stockState(slug);
    var variant = {
      id: gid('ProductVariant', slug + '-default'),
      title: p.weight || 'Default',
      sku: 'HD-' + slug.toUpperCase(),
      availableForSale: st.state !== 'out_of_stock',
      quantityAvailable: st.available,
      price: money(p.price),
      selectedOptions: [{ name: 'Size', value: p.weight || 'One size' }],
      image: { id: gid('Image', slug), url: p.image, altText: p.name }
    };
    var images = [{ id: gid('Image', slug), url: p.image, altText: p.name }];
    if (p.altImage) images.push({ id: gid('Image', slug + '-2'), url: p.altImage, altText: p.name });
    return {
      id: gid('Product', slug),
      handle: slug,
      title: p.name,
      descriptionHtml: '<p>' + (p.notes || '') + '</p>',
      productType: typeOf(slug),
      vendor: 'Harvest Deli',
      tags: p.tags || [],
      collections: collectionsForSlug(slug),
      images: images,
      variants: [variant],
      priceRange: { minVariantPrice: money(p.price), maxVariantPrice: money(p.price) },
      availableForSale: st.state !== 'out_of_stock',
      totalInventory: st.available,
      seo: { title: p.name + ' · Harvest Deli', description: p.notes || '' },
      metafields: { region: p.region, edition: p.edition }
    };
  }

  /* ---------------- collections ---------------- */
  var COLLECTIONS = [
    { handle: 'raw-honey',     title: { nl: 'Rauwe honing', en: 'Raw Honey' },      type: 'Honey' },
    { handle: 'olive-oil',     title: { nl: 'Olijfolie', en: 'Olive Oil' },         type: 'Olive Oil' },
    { handle: 'mountain-tea',  title: { nl: 'Griekse bergthee', en: 'Greek Mountain Tea' }, type: 'Tea' },
    { handle: 'limited-harvests', title: { nl: 'Beperkte oogsten', en: 'Limited Harvests' }, tag: 'rare' },
    { handle: 'gift-sets',     title: { nl: 'Cadeausets', en: 'Gift Sets' },        tag: 'gift' }
  ];
  function collectionsForSlug(slug) {
    var t = typeOf(slug), out = [];
    if (t === 'Honey') out.push('raw-honey');
    if (t === 'Olive Oil') out.push('olive-oil');
    if (t === 'Tea') out.push('mountain-tea');
    var p = window.HD_product && window.HD_product(slug);
    if (p && (p.tags || []).indexOf('rare') > -1) out.push('limited-harvests');
    return out;
  }
  function collectionProducts(c) {
    return SLUGS.filter(function (slug) {
      if (c.type) return typeOf(slug) === c.type;
      if (c.tag === 'gift') return true; // any product can be gifted
      if (c.tag) { var p = window.HD_product && window.HD_product(slug); return p && (p.tags || []).indexOf(c.tag) > -1; }
      return false;
    });
  }
  function toCollection(c) {
    var L = (window.HD_lang && window.HD_lang() === 'nl') ? 'nl' : 'en';
    var handles = collectionProducts(c);
    return {
      id: gid('Collection', c.handle), handle: c.handle, title: c.title[L],
      descriptionHtml: '', image: null,
      seo: { title: c.title[L] + ' · Harvest Deli', description: '' },
      productHandles: handles
    };
  }

  /* ---------------- live (Shopify) routing ---------------- */
  function useShopify() { return CFG().source === 'shopify' && window.HD_Storefront && window.HD_Storefront.isConfigured(); }

  /* ---------------- cart (bridges HD_CART → Storefront Cart shape) ---------------- */
  function buildCart() {
    var items = (window.HD_CART && window.HD_CART.items) || [];
    var lines = items.map(function (it) {
      var p = window.HD_product && window.HD_product(it.slug);
      var unit = p ? p.price : 0;
      var img = p ? { id: gid('Image', it.slug), url: p.image, altText: p.name } : null;
      return {
        id: 'line-' + it.slug,
        merchandiseId: gid('ProductVariant', it.slug + '-default'),
        quantity: it.qty,
        unitPrice: money(unit),
        lineTotal: money(unit * it.qty),
        // flat fields (back-compat)
        handle: it.slug, title: p ? p.name : it.slug, variantTitle: p ? (p.weight || '') : '', image: img,
        // nested Storefront shape (merchandise = ProductVariant)
        merchandise: {
          id: gid('ProductVariant', it.slug + '-default'),
          title: p ? (p.weight || 'Default') : 'Default',
          price: money(unit),
          image: img,
          product: { id: gid('Product', it.slug), handle: it.slug, title: p ? p.name : it.slug, productType: typeOf(it.slug) }
        }
      };
    });
    var subtotal = lines.reduce(function (a, l) { return a + (+l.lineTotal.amount); }, 0);
    var threshold = (CFG().freeShippingThreshold || 120);
    return {
      id: 'hd-local-cart', lines: lines,
      totalQuantity: items.reduce(function (a, it) { return a + it.qty; }, 0),
      cost: { subtotalAmount: money(subtotal), totalAmount: money(subtotal) },
      freeShippingThreshold: threshold,
      // SEAM: Shopify returns a real checkoutUrl from cartCreate; until then, the local page.
      checkoutUrl: 'checkout.html'
    };
  }

  /* ---------------- public API ---------------- */
  var Commerce = {
    config: CFG,

    products: {
      /** @returns {Promise<Product|null>} */
      async get(handle) {
        if (useShopify()) { var d = await window.HD_Storefront.fetch(window.HD_Storefront.QUERIES.productByHandle, { handle: handle }); return d.product; }
        return toProduct(handle);
      },
      /** @returns {Promise<Product[]>} */
      async all() { return SLUGS.map(toProduct).filter(Boolean); },
      /** @returns {Promise<Product[]>} related by type, excluding self */
      async recommendations(handle, limit) {
        var t = typeOf(handle);
        return SLUGS.filter(function (s) { return s !== handle && typeOf(s) === t; }).slice(0, limit || 4).map(toProduct).filter(Boolean);
      }
    },

    collections: {
      /** @returns {Promise<Array<{handle:string,title:string}>>} */
      async list() { return COLLECTIONS.map(toCollection); },
      /** @returns {Promise<Collection|null>} */
      async get(handle) { var c = COLLECTIONS.find(function (x) { return x.handle === handle; }); return c ? toCollection(c) : null; }
    },

    /* Cart bridges to the existing HD_CART (single source of truth) but
       exposes a Shopify-shaped Cart object. */
    cart: {
      /** Synchronous snapshot — used by the cart drawer render (mock source). @returns {Cart} */
      getSync: function () { return buildCart(); },
      /** @returns {Promise<Cart>} (the Shopify path resolves the same shape async) */
      async get() { return buildCart(); },
      async add(handle, qty) { if (window.HD_CART) window.HD_CART.add(handle, qty || 1); return buildCart(); },
      async update(handle, qty) { if (window.HD_CART) window.HD_CART.setQty(handle, qty); return buildCart(); },
      async remove(handle) { if (window.HD_CART) window.HD_CART.setQty(handle, 0); return buildCart(); }
      // SEAM: when live, mirror these to cartLinesAdd/Update/Remove + use the returned checkoutUrl.
    },

    search: {
      /** @returns {Promise<Product[]>} predictive search over the catalog */
      async predictive(query) {
        var q = String(query || '').trim().toLowerCase(); if (!q) return [];
        if (useShopify()) { var d = await window.HD_Storefront.fetch(window.HD_Storefront.QUERIES.predictiveSearch, { query: q }); return (d.predictiveSearch && d.predictiveSearch.products) || []; }
        return SLUGS.map(toProduct).filter(Boolean).filter(function (p) {
          return (p.title + ' ' + p.productType + ' ' + (p.tags || []).join(' ') + ' ' + (p.metafields.region || '')).toLowerCase().indexOf(q) > -1;
        }).slice(0, 8);
      }
    },

    /* Pure filtering/sorting helpers — same logic the shop sidebar uses,
       exposed for any collection page. */
    filters: {
      apply(products, selected) {
        selected = selected || {};
        return products.filter(function (p) {
          if (selected.type && selected.type.length && selected.type.indexOf(p.productType) < 0) return false;
          if (selected.tags && selected.tags.length && !selected.tags.some(function (t) { return (p.tags || []).indexOf(t) > -1; })) return false;
          if (selected.collection && (p.collections || []).indexOf(selected.collection) < 0) return false;
          if (selected.priceMax != null && (+p.priceRange.minVariantPrice.amount) > selected.priceMax) return false;
          if (selected.inStockOnly && !p.availableForSale) return false;
          return true;
        });
      },
      sort(products, key) {
        var a = products.slice();
        if (key === 'price-asc') a.sort(function (x, y) { return x.priceRange.minVariantPrice.amount - y.priceRange.minVariantPrice.amount; });
        else if (key === 'price-desc') a.sort(function (x, y) { return y.priceRange.minVariantPrice.amount - x.priceRange.minVariantPrice.amount; });
        else if (key === 'name') a.sort(function (x, y) { return x.title.localeCompare(y.title); });
        return a;
      }
    },

    /* Customer bridges to the existing HD_account demo session, shaped
       like a Shopify Customer. No real auth (see account.js SEAMs). */
    customer: {
      async current() {
        var a = window.HD_account && window.HD_account.current && window.HD_account.current();
        if (!a) return null;
        return {
          id: gid('Customer', a.email || 'local'), firstName: a.firstName || '', lastName: a.lastName || '',
          email: a.email || '', phone: a.phone || '',
          addresses: (window.HD_account.addresses ? window.HD_account.addresses() : []).map(function (ad) {
            return { firstName: a.firstName, lastName: a.lastName, address1: ad.line1, address2: ad.line2, city: ad.city, zip: ad.postcode, country: ad.country };
          }),
          orders: (window.HD_account.orders ? window.HD_account.orders() : []).map(function (o) {
            return { id: o.id, name: o.id, processedAt: o.createdAt, financialStatus: o.status || 'paid', fulfillmentStatus: 'unfulfilled', totalPrice: money(o.total), lineItems: [] };
          })
        };
      }
      // SEAM: replace with Shopify Customer Account API (login, token, customer query).
    }
  };

  window.Commerce = Commerce;
})();
