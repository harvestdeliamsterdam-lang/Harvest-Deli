/* =================================================================
   Harvest Deli, Commerce adapter (window.Commerce)
   -----------------------------------------------------------------
   The single API surface the frontend uses for commerce. Today it
   resolves from the local catalog (HD_product / HD_stock / HD_CART)
   and RESHAPES everything into Shopify Storefront types (types.js).
   When config.source === 'shopify' AND a token is set, the read +
   cart + checkout paths route through HD_Storefront instead, same
   shapes out, so the UI never changes. Every Shopify call is wrapped
   so a failure falls back to the local catalog (the site never breaks).

   Namespaces: Commerce.products / collections / cart / customer /
   search / filters / checkout / sync.
   ================================================================= */
(function () {
  'use strict';
  var CFG = function () { return window.HD_COMMERCE_CONFIG || { source: 'mock', currency: 'EUR' }; };
  var CUR = function () { return CFG().currency || 'EUR'; };

  // Real catalog handles (must mirror shared.js PRODUCTS).
  var SLUGS = ['fir-vanilla', 'acacia', 'pine', 'orange-blossom', 'chestnut', 'oak', 'arbutus', 'thyme', 'oregano', 'olive-oil', 'mountain-tea'];

  function money(n) { return { amount: (Math.round((+n || 0) * 100) / 100).toFixed(2), currencyCode: CUR() }; }
  function gid(kind, id) { return 'gid://shopify/' + kind + '/' + id; }
  function typeOf(slug) { return slug === 'olive-oil' ? 'Olive Oil' : slug === 'mountain-tea' ? 'Tea' : slug === 'oregano' ? 'Herb' : 'Honey'; }
  function stockState(slug) {
    var s = window.HD_stock && window.HD_stock.get ? window.HD_stock.get(slug) : null;
    if (!s) return { available: 99, state: 'in_stock' };
    var map = { in: 'in_stock', low: 'low_stock', out: 'out_of_stock', backorder: 'backorder' };
    return { available: s.qty, state: map[s.status] || 'in_stock' };
  }
  function sizesOf(p) {
    return (p && p.sizes && p.sizes.length) ? p.sizes : [{ id: (p && p.defaultSize) || 'default', label: (p && p.weight) || 'One size', price: (p && p.price) || 0 }];
  }

  /** Map the local catalog entry → Storefront Product shape (one variant per size). */
  function toProduct(slug) {
    var p = window.HD_product && window.HD_product(slug);
    if (!p) return null;
    var st = stockState(slug);
    var sizes = sizesOf(p);
    var variants = sizes.map(function (sz) {
      return {
        id: gid('ProductVariant', slug + '-' + sz.id),
        title: sz.label,
        sku: 'HD-' + slug.toUpperCase() + '-' + String(sz.id).toUpperCase(),
        availableForSale: st.state !== 'out_of_stock',
        quantityAvailable: st.available,
        price: money(sz.price),
        selectedOptions: [{ name: 'Size', value: sz.label }],
        image: { id: gid('Image', slug), url: p.image, altText: p.name }
      };
    });
    var images = [{ id: gid('Image', slug), url: p.image, altText: p.name }];
    if (p.altImage) images.push({ id: gid('Image', slug + '-2'), url: p.altImage, altText: p.name });
    var prices = sizes.map(function (s) { return +s.price; });
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
      variants: variants,
      priceRange: { minVariantPrice: money(Math.min.apply(null, prices)), maxVariantPrice: money(Math.max.apply(null, prices)) },
      availableForSale: st.state !== 'out_of_stock',
      totalInventory: st.available,
      seo: { title: p.name + ' · Harvest Deli', description: p.notes || '' },
      metafields: { region: p.region, edition: p.edition, altitude: p.altitude, hue: p.hue }
    };
  }

  /* ---------------- collections ---------------- */
  var COLLECTIONS = [
    { handle: 'raw-honey',     title: { nl: 'Rauwe honing', en: 'Raw Honey' },      type: 'Honey' },
    { handle: 'olive-oil',     title: { nl: 'Olijfolie', en: 'Olive Oil' },         type: 'Olive Oil' },
    { handle: 'mountain-tea',  title: { nl: 'Griekse bergthee', en: 'Greek Mountain Tea' }, type: 'Tea' },
    { handle: 'herbs',         title: { nl: 'Kruiden', en: 'Herbs' },               type: 'Herb' },
    { handle: 'limited-harvests', title: { nl: 'Beperkte oogsten', en: 'Limited Harvests' }, tag: 'rare' },
    { handle: 'gift-sets',     title: { nl: 'Cadeausets', en: 'Gift Sets' },        tag: 'gift' }
  ];
  function collectionsForSlug(slug) {
    var t = typeOf(slug), out = [];
    if (t === 'Honey') out.push('raw-honey');
    if (t === 'Olive Oil') out.push('olive-oil');
    if (t === 'Tea') out.push('mountain-tea');
    if (t === 'Herb') out.push('herbs');
    var p = window.HD_product && window.HD_product(slug);
    if (p && (p.tags || []).indexOf('rare') > -1) out.push('limited-harvests');
    return out;
  }
  function collectionProducts(c) {
    return SLUGS.filter(function (slug) {
      if (c.type) return typeOf(slug) === c.type;
      if (c.tag === 'gift') return true;
      if (c.tag) { var p = window.HD_product && window.HD_product(slug); return p && (p.tags || []).indexOf(c.tag) > -1; }
      return false;
    });
  }
  function toCollection(c) {
    var L = (window.HD_lang && window.HD_lang() === 'nl') ? 'nl' : 'en';
    return {
      id: gid('Collection', c.handle), handle: c.handle, title: c.title[L],
      descriptionHtml: '', image: null,
      seo: { title: c.title[L] + ' · Harvest Deli', description: '' },
      productHandles: collectionProducts(c)
    };
  }

  /* ---------------- live (Shopify) routing + helpers ---------------- */
  function useShopify() { return CFG().source === 'shopify' && window.HD_Storefront && window.HD_Storefront.isConfigured(); }
  function SF() { return window.HD_Storefront; }

  /** Flatten a raw Shopify product node into the SAME shape as toProduct(),
      so every consumer (shop grid, product page, search) works unchanged. */
  function normalizeShopifyProduct(n) {
    if (!n) return null;
    var imgs = (n.images && n.images.nodes) ? n.images.nodes : (n.featuredImage ? [n.featuredImage] : []);
    var variants = (n.variants && n.variants.nodes) ? n.variants.nodes : [];
    /* Record slug|sizeLabel → variantId so the cart/checkout can build real
       Shopify lines. Keyed by the "Size" option value (matches HD_CART size labels). */
    try {
      var mapped = false;
      variants.forEach(function (v) {
        if (!v || !v.id) return;
        var sz = 'default';
        if (v.selectedOptions) {
          for (var i = 0; i < v.selectedOptions.length; i++) {
            if (v.selectedOptions[i].name === 'Size') { sz = v.selectedOptions[i].value; break; }
          }
        }
        if (sz === 'default' && v.title && v.title !== 'Default Title') sz = v.title;
        VARIANT_MAP[n.handle + '|' + sz] = v.id;
        if (variants.length === 1) VARIANT_MAP[n.handle + '|' + 'default'] = v.id;
        mapped = true;
      });
      if (mapped) saveVariantMap();
    } catch (e) {}
    return {
      id: n.id, handle: n.handle, title: n.title,
      descriptionHtml: n.descriptionHtml || '',
      productType: n.productType || 'Honey',
      vendor: n.vendor || 'Harvest Deli',
      tags: n.tags || [],
      collections: (n.collections && n.collections.nodes ? n.collections.nodes : []).map(function (c) { return c.handle; }),
      images: imgs,
      variants: variants,
      priceRange: n.priceRange || { minVariantPrice: money(0), maxVariantPrice: money(0) },
      availableForSale: !!n.availableForSale,
      totalInventory: n.totalInventory != null ? n.totalInventory : 99,
      seo: n.seo || { title: n.title, description: '' },
      metafields: {}
    };
  }

  /* ---- Shopify cart persistence (cartId) + variant map (slug|sizeLabel → variantId) ---- */
  var CART_ID_KEY = 'hd-shopify-cart-id';
  var VMAP_KEY = 'hd-shopify-variant-map';
  function getCartId() { try { return localStorage.getItem(CART_ID_KEY) || null; } catch (e) { return null; } }
  function setCartId(id) { try { id ? localStorage.setItem(CART_ID_KEY, id) : localStorage.removeItem(CART_ID_KEY); } catch (e) {} }
  var VARIANT_MAP = (function () { try { return JSON.parse(localStorage.getItem(VMAP_KEY) || '{}'); } catch (e) { return {}; } })();
  function saveVariantMap() { try { localStorage.setItem(VMAP_KEY, JSON.stringify(VARIANT_MAP)); } catch (e) {} }
  function variantIdFor(slug, sizeLabel) {
    return VARIANT_MAP[slug + '|' + sizeLabel] || VARIANT_MAP[slug + '|' + 'default'] || null;
  }

  /* ---------------- cart (bridges HD_CART → Storefront Cart shape) ---------------- */
  function buildCart() {
    var items = (window.HD_CART && window.HD_CART.items) || [];
    var lines = items.map(function (it) {
      var p = window.HD_product && window.HD_product(it.slug);
      var unit = (window.HD_CART && window.HD_CART.unitPrice) ? window.HD_CART.unitPrice(it.slug, it.size) : (p ? p.price : 0);
      var lt = (window.HD_CART && window.HD_CART.lineTotal) ? window.HD_CART.lineTotal(it) : unit * it.qty;
      var img = p ? { id: gid('Image', it.slug), url: p.image, altText: p.name } : null;
      var sizeLbl = (window.HD_CART && window.HD_CART.sizeLabel) ? window.HD_CART.sizeLabel(it) : (p ? p.weight : '');
      return {
        id: 'line-' + it.slug + '-' + (it.size || 'default'),
        merchandiseId: variantIdFor(it.slug, sizeLbl) || gid('ProductVariant', it.slug + '-' + (it.size || 'default')),
        quantity: it.qty, unitPrice: money(unit), lineTotal: money(lt),
        handle: it.slug, title: p ? p.name : it.slug, variantTitle: sizeLbl, image: img,
        merchandise: {
          id: gid('ProductVariant', it.slug + '-' + (it.size || 'default')),
          title: sizeLbl || 'Default', price: money(unit), image: img,
          product: { id: gid('Product', it.slug), handle: it.slug, title: p ? p.name : it.slug, productType: typeOf(it.slug) }
        }
      };
    });
    var subtotal = (window.HD_CART && window.HD_CART.total) ? window.HD_CART.total() : lines.reduce(function (a, l) { return a + (+l.lineTotal.amount); }, 0);
    var offer = (window.HD_CART && window.HD_CART.offerDiscount) ? window.HD_CART.offerDiscount() : 0;
    return {
      id: 'hd-local-cart', lines: lines,
      totalQuantity: items.reduce(function (a, it) { return a + it.qty; }, 0),
      cost: { subtotalAmount: money(subtotal), totalAmount: money(Math.max(0, subtotal - offer)) },
      discountAmount: money(offer),
      freeShippingThreshold: (CFG().freeShippingThreshold || 65),
      checkoutUrl: 'checkout.html'   // local wizard; Shopify checkoutUrl is used by Commerce.checkout() when live
    };
  }

  /* Build Shopify cart line inputs from HD_CART. Returns null if any line has no
     mapped variant id (i.e. catalog not synced yet), caller falls back to local. */
  function shopifyLinesFromCart() {
    var items = (window.HD_CART && window.HD_CART.items) || [];
    if (!items.length) return null;
    var lines = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var sizeLbl = (window.HD_CART && window.HD_CART.sizeLabel) ? window.HD_CART.sizeLabel(it) : '';
      var vid = variantIdFor(it.slug, sizeLbl);
      if (!vid) return null; // not synced → cannot build a Shopify cart yet
      lines.push({ merchandiseId: vid, quantity: it.qty });
    }
    return lines;
  }

  /* ---- Storefront product cache (session-scoped + in-memory, TTL) so the
     home/shop/product pages don't refetch on every navigation and repeat
     views render instantly from the same Shopify data. Variant map is
     repopulated on cache hits so checkout keeps working. ---- */
  var PCACHE_KEY = 'hd-sf-products-v1';
  var PCACHE_TTL = 10 * 60 * 1000; // 10 minutes
  var _pcache = null;
  function readPCache() {
    if (_pcache && (Date.now() - _pcache.t) < PCACHE_TTL) return _pcache;
    try {
      var raw = JSON.parse(sessionStorage.getItem(PCACHE_KEY) || 'null');
      if (raw && raw.t && (Date.now() - raw.t) < PCACHE_TTL && raw.list) { _pcache = raw; return raw; }
    } catch (e) {}
    return null;
  }
  function writePCache(list) {
    var byHandle = {};
    list.forEach(function (p) { if (p) byHandle[p.handle] = p; });
    _pcache = { t: Date.now(), list: list, byHandle: byHandle };
    try { sessionStorage.setItem(PCACHE_KEY, JSON.stringify(_pcache)); } catch (e) {}
  }
  function rememberVariantsFromList(list) {
    try {
      var changed = false;
      list.forEach(function (p) {
        ((p && p.variants) || []).forEach(function (v) {
          if (!v || !v.id) return;
          var sz = 'default';
          if (v.selectedOptions) {
            for (var i = 0; i < v.selectedOptions.length; i++) {
              if (v.selectedOptions[i].name === 'Size') { sz = v.selectedOptions[i].value; break; }
            }
          }
          if (sz === 'default' && v.title && v.title !== 'Default Title') sz = v.title;
          VARIANT_MAP[p.handle + '|' + sz] = v.id;
          if ((p.variants || []).length === 1) VARIANT_MAP[p.handle + '|' + 'default'] = v.id;
          changed = true;
        });
      });
      if (changed) saveVariantMap();
    } catch (e) {}
  }

  /* ---------------- public API ---------------- */
  var Commerce = {
    config: CFG,

    products: {
      /** @returns {Promise<Product|null>} */
      async get(handle) {
        if (useShopify()) {
          var c = readPCache();
          if (c && c.byHandle && c.byHandle[handle]) return c.byHandle[handle];
          var d = await SF().safeFetch(SF().QUERIES.productByHandle, { handle: handle });
          if (d && d.product) return normalizeShopifyProduct(d.product);
        }
        return toProduct(handle); // mock / fallback
      },
      /** @returns {Promise<Product[]>} */
      async all() {
        if (useShopify()) {
          var c = readPCache();
          if (c && c.list) { rememberVariantsFromList(c.list); return c.list; }
          var d = await SF().safeFetch(SF().QUERIES.products, { first: 50 });
          if (d && d.products && d.products.nodes) {
            var list = d.products.nodes.map(normalizeShopifyProduct);
            writePCache(list);
            return list;
          }
        }
        return SLUGS.map(toProduct).filter(Boolean);
      },
      /** @returns {Promise<Product[]>} related by type, excluding self */
      async recommendations(handle, limit) {
        var t = typeOf(handle);
        return SLUGS.filter(function (s) { return s !== handle && typeOf(s) === t; }).slice(0, limit || 4).map(toProduct).filter(Boolean);
      }
    },

    collections: {
      async list() { return COLLECTIONS.map(toCollection); },
      async get(handle) {
        if (useShopify()) {
          var d = await SF().safeFetch(SF().QUERIES.collectionByHandle, { handle: handle });
          if (d && d.collection) {
            var c = d.collection;
            return { id: c.id, handle: c.handle, title: c.title, descriptionHtml: c.descriptionHtml || '', image: c.image || null, seo: c.seo || {}, productHandles: (c.products && c.products.nodes ? c.products.nodes : []).map(function (n) { return n.handle; }) };
          }
        }
        var local = COLLECTIONS.find(function (x) { return x.handle === handle; });
        return local ? toCollection(local) : null;
      }
    },

    /* Cart bridges to HD_CART (the single source of truth on-site) but exposes a
       Shopify-shaped Cart object. On-site cart UX is local; Shopify cart is created
       at checkout time (see Commerce.checkout). */
    cart: {
      getSync: function () { return buildCart(); },
      async get() { return buildCart(); },
      async add(handle, qty, size) { if (window.HD_CART) window.HD_CART.add(handle, qty || 1, size); return buildCart(); },
      async update(handle, qty, size) { if (window.HD_CART) window.HD_CART.setQty(handle, qty, size); return buildCart(); },
      async remove(handle, size) { if (window.HD_CART) window.HD_CART.remove(handle, size); return buildCart(); }
    },

    /* Checkout: PRODUCTION = Shopify only. When live, create a Shopify cart from
       HD_CART, clear the local cart, and return Shopify's hosted checkoutUrl.
       On ANY failure returns null (caller shows an error modal, there is NO
       fall-through to the legacy local checkout.html). Only when source!=='shopify'
       (dev/mock) does it return the local wizard URL.
       @param {object} [buyer] state.details from the wizard (email/name/address);
         when present + complete, the hosted checkout is PRE-FILLED via buyerIdentity.
       @returns {Promise<string|null>} a URL to navigate to, or null on failure. */
    async checkout(buyer) {
      if (useShopify()) {
        var lines = shopifyLinesFromCart();
        if (!lines) {
          // a cart item has no mapped variant yet → hydrate the whole catalog once, then retry
          try { await Commerce.products.all(); } catch (e) {}
          lines = shopifyLinesFromCart();
        }
        if (lines && lines.length) {
          var vars = { lines: lines };
          // Prefill the hosted checkout (contact + shipping) when we have a usable
          // address. countryCode is ALWAYS sent (default NL): Shopify only surfaces
          // local payment methods (iDEAL/Bancontact via Mollie) when the cart has a
          // market context of NL/BE + EUR. The buyer can still switch country in
          // the hosted checkout itself.
          var bi = buildBuyerIdentity(buyer) || {};
          // Carry the shopper's chosen destination so the hosted checkout opens
          // on the right EU zone (falls back to NL). An entered address country
          // still wins (buildBuyerIdentity set it above).
          if (!bi.countryCode) bi.countryCode = (window.HD_SHIPPING && window.HD_SHIPPING.country()) || 'NL';
          vars.buyerIdentity = bi;
          var d = await SF().safeFetch(SF().QUERIES.cartCreate, vars);
          var cart = d && d.cartCreate && d.cartCreate.cart;
          if (cart && cart.checkoutUrl) {
            setCartId(cart.id);
            clearLocalCart();          // PHASE 5: cart cleared the instant a Shopify checkout URL exists
            return cart.checkoutUrl;
          }
        }
        if (window.console) console.warn('[commerce] Shopify checkout could not be created');
        return null;                   // PHASE 3: no checkout.html fallback in production
      }
      return 'checkout.html';          // dev/mock only (source !== 'shopify')
    },

    search: {
      async predictive(query) {
        var q = String(query || '').trim().toLowerCase(); if (!q) return [];
        if (useShopify()) {
          var d = await SF().safeFetch(SF().QUERIES.predictiveSearch, { query: q });
          if (d && d.predictiveSearch) return d.predictiveSearch.products || [];
        }
        return SLUGS.map(toProduct).filter(Boolean).filter(function (p) {
          return (p.title + ' ' + p.productType + ' ' + (p.tags || []).join(' ') + ' ' + (p.metafields.region || '')).toLowerCase().indexOf(q) > -1;
        }).slice(0, 8);
      }
    },

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
    },

    /* ---------------- product syncing (Shopify → local) ----------------
       Pulls every product from Shopify and:
         • caches them (window.HD_SHOPIFY) for inspection,
         • builds the VARIANT_MAP (slug|sizeLabel → Shopify variantId) used by
           Commerce.checkout to create real Shopify carts,
         • exposes localShape(handle) → an object in the HD_product shape, the
           seam for letting real products REPLACE the mock catalog.
       Safe: returns {ok:false} and changes nothing if Shopify is unavailable. */
    sync: {
      async run() {
        if (!useShopify()) return { ok: false, reason: 'source!=shopify or token missing' };
        var d = await SF().safeFetch(SF().QUERIES.products, { first: 100 });
        if (!d || !d.products || !d.products.nodes) return { ok: false, reason: 'fetch failed' };
        var nodes = d.products.nodes;
        var byHandle = {};
        nodes.forEach(function (n) {
          byHandle[n.handle] = normalizeShopifyProduct(n);
          (n.variants && n.variants.nodes ? n.variants.nodes : []).forEach(function (v) {
            var sizeOpt = (v.selectedOptions || []).filter(function (o) { return /size|formaat|gewicht/i.test(o.name); })[0];
            var label = sizeOpt ? sizeOpt.value : (v.title || 'default');
            VARIANT_MAP[n.handle + '|' + label] = v.id;
          });
        });
        saveVariantMap();
        window.HD_SHOPIFY = byHandle;
        return { ok: true, count: nodes.length, variants: Object.keys(VARIANT_MAP).length };
      },
      /** Map a synced Shopify product → the local HD_product shape. The documented
          seam to feed real data into rendering (see commerce/README.md). */
      localShape: function (handle) {
        var n = (window.HD_SHOPIFY || {})[handle];
        if (!n) return null;
        var sizes = (n.variants || []).map(function (v) {
          var sizeOpt = (v.selectedOptions || []).filter(function (o) { return /size|formaat|gewicht/i.test(o.name); })[0];
          return { id: (sizeOpt ? sizeOpt.value : v.title || 'default').toLowerCase(), label: sizeOpt ? sizeOpt.value : (v.title || ''), price: +((v.price && v.price.amount) || 0) };
        });
        return {
          slug: n.handle, name: n.title, url: 'product.html?p=' + n.handle,
          price: +(n.priceRange.minVariantPrice.amount || 0), priceFrom: +(n.priceRange.minVariantPrice.amount || 0),
          sizes: sizes, defaultSize: sizes[0] && sizes[0].id, multiSize: sizes.length > 1,
          image: (n.images[0] && n.images[0].url) || 'harvestdeli.webp',
          notes: (n.descriptionHtml || '').replace(/<[^>]+>/g, '').trim(),
          tags: n.tags || [], badges: [], type: (n.productType || '').toLowerCase()
          // region/altitude/hue/edition: map from Shopify metafields here when modelled.
        };
      }
    }
  };

  window.Commerce = Commerce;

  /* PHASE 5 helper: empty the local HD_CART (size-aware). Called once a Shopify
     checkout URL is created, the items now live in the Shopify cart. */
  function clearLocalCart() {
    try {
      if (window.HD_CART && window.HD_CART.items) {
        window.HD_CART.items.slice().forEach(function (it) { window.HD_CART.remove(it.slug, it.size); });
      }
    } catch (e) {}
  }

  /* Minimal, brand-neutral error modal (uses existing CSS vars; no stylesheet
     edits). Shown when a Shopify checkout cannot be created, NEVER a silent
     fall-through to a fake order. */
  function showCheckoutError() {
    if (document.getElementById('hdCoErr')) { document.getElementById('hdCoErr').style.display = 'flex'; return; }
    var nl = (window.HD_lang && window.HD_lang() === 'nl');
    var wrap = document.createElement('div');
    wrap.id = 'hdCoErr';
    wrap.setAttribute('role', 'alertdialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'hdCoErrT');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(20,14,8,0.55);padding:24px;';
    wrap.innerHTML =
      '<div style="max-width:420px;width:100%;background:var(--cream,#FAF6EE);color:var(--ink,#1F1A14);border:1px solid rgba(184,148,90,0.4);border-radius:6px;padding:30px 28px;font-family:Inter,system-ui,sans-serif;box-shadow:0 30px 80px -30px rgba(40,24,8,0.5);">' +
      '<h2 id="hdCoErrT" style="margin:0 0 10px;font-family:Newsreader,serif;font-weight:400;font-size:22px;">' + (nl ? 'Checkout tijdelijk niet beschikbaar' : 'Checkout temporarily unavailable') + '</h2>' +
      '<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:var(--ink-soft,#5C5247);">' + (nl ? 'We konden de betaalpagina niet openen. Je winkelmandje is bewaard. Probeer het zo opnieuw.' : 'We could not open the payment page. Your cart is saved. Please try again in a moment.') + '</p>' +
      '<button type="button" id="hdCoErrClose" style="cursor:pointer;border:1px solid var(--ink,#1F1A14);background:var(--ink,#1F1A14);color:var(--cream,#FAF6EE);font:inherit;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;padding:13px 24px;border-radius:999px;min-height:44px;">' + (nl ? 'Sluiten' : 'Close') + '</button>' +
      '</div>';
    document.body.appendChild(wrap);
    function close() { wrap.style.display = 'none'; }
    wrap.querySelector('#hdCoErrClose').addEventListener('click', close);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
  }

  /* Country name (as shown in the wizard <select>) → ISO 3166-1 alpha-2 code that
     Shopify's CartBuyerIdentityInput.countryCode expects. Unknown → null (omit). */
  var COUNTRY_CODES = {
    'Netherlands': 'NL', 'Nederland': 'NL', 'Belgium': 'BE', 'België': 'BE', 'Belgique': 'BE',
    'Germany': 'DE', 'Duitsland': 'DE', 'France': 'FR', 'Frankrijk': 'FR',
    'Greece': 'GR', 'Griekenland': 'GR', 'Italy': 'IT', 'Italië': 'IT',
    'Spain': 'ES', 'Spanje': 'ES', 'Austria': 'AT', 'Oostenrijk': 'AT',
    'United Kingdom': 'GB', 'Switzerland': 'CH', 'Zwitserland': 'CH'
  };

  /* ISO country code → international dialling code, for E.164 phone normalisation. */
  var DIAL_CODES = { NL:'31', BE:'32', DE:'49', FR:'33', GR:'30', IT:'39', ES:'34', AT:'43', GB:'44', CH:'41' };

  /* Normalise a user-typed phone to E.164 (e.g. "06 10 71-50 83" → "+31610715083").
     Shopify's buyerIdentity.phone / address.phone require E.164 or the value is
     dropped. Rules: strip spaces/dashes/parens/dots; keep already-international
     (+…) unchanged; "00…" → "+…"; a leading national 0 gets the country dial code
     (default NL when the cart country is unknown). Returns null when not usable. */
  function normalizePhone(raw, isoCode) {
    if (!raw) return null;
    var s = String(raw).replace(/[\s\-().]/g, '');
    if (!s) return null;
    if (s.charAt(0) === '+') return s;                 // already international
    if (s.slice(0, 2) === '00') return '+' + s.slice(2); // 0031… → +31…
    if (s.charAt(0) === '0') {                          // national number
      var dial = DIAL_CODES[isoCode] || DIAL_CODES.NL; // default to NL
      return '+' + dial + s.slice(1);
    }
    return /^[0-9]+$/.test(s) ? '+' + s : null;         // bare digits → assume already country-prefixed
  }

  /* Map the wizard's state.details → Shopify CartBuyerIdentityInput so the hosted
     checkout opens pre-filled (contact + shipping). Returns null when there is no
     usable address, so cartCreate stays exactly as before (purely additive). */
  function buildBuyerIdentity(buyer) {
    if (!buyer) return null;
    var a = buyer.shipping && buyer.shipping.line1 ? buyer.shipping : buyer.billing;
    var code = a && a.country ? COUNTRY_CODES[a.country.trim()] : null;
    var bi = {};
    var phone = normalizePhone(buyer.phone, code); // E.164, or null
    if (buyer.email) bi.email = buyer.email.trim();
    if (phone) bi.phone = phone; // CartBuyerIdentityInput.phone requires E.164
    if (code) bi.countryCode = code; // CartBuyerIdentityInput.countryCode = ISO enum
    // A delivery address only prefills if it is complete enough for Shopify to accept.
    // deliveryAddress is a MailingAddressInput: its field is `country` (a name string),
    // NOT `countryCode`. We require a known country so the top-level enum is set too.
    if (a && a.line1 && a.city && a.postcode && a.country && code) {
      var da = {
        firstName: (buyer.firstName || '').trim(),
        lastName: (buyer.lastName || '').trim(),
        address1: a.line1.trim(),
        city: a.city.trim(),
        zip: a.postcode.trim(),
        country: a.country.trim()
      };
      if (a.line2 && a.line2.trim()) da.address2 = a.line2.trim();
      if (phone) da.phone = phone; // MailingAddressInput.phone → prefills the shipping phone field
      bi.deliveryAddressPreferences = [{ deliveryAddress: da }];
    }
    return Object.keys(bi).length ? bi : null;
  }

  /* THE single checkout entry point for the whole site. Every "checkout"/"buy now"
     action routes here. Production (source==='shopify') → Shopify hosted checkout
     or an error modal. Dev/mock → the local checkout.html wizard.
     @param {object} [buyer] state.details from the wizard, for checkout prefill. */
  function startCheckout(buyer) {
    if (!useShopify()) { window.location.href = 'checkout.html'; return; } // dev/mock only
    var has = window.HD_CART && window.HD_CART.items && window.HD_CART.items.length;
    if (!has) { window.location.href = 'shop.html'; return; }
    Commerce.checkout(buyer).then(function (url) {
      if (url && /^https?:\/\//.test(url)) { window.location.href = url; }
      else { showCheckoutError(); }
    }).catch(function () { showCheckoutError(); });
  }
  window.HD_startCheckout = startCheckout;

  /* Checkout routing. Every checkout entry (the cart drawer "Continue to
     checkout" a.cart-checkout and any [data-shopify-checkout] element) routes
     through the branded pre-checkout wizard (checkout.html). The wizard's final
     step hands off to Shopify hosted checkout (Mollie) for the actual payment
   , see startCheckout()/HD_startCheckout, invoked from checkout.js placeOrder. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-shopify-checkout], a.cart-checkout');
    if (!a) return;
    e.preventDefault();
    window.location.href = 'checkout.html';
  }, true);
})();
