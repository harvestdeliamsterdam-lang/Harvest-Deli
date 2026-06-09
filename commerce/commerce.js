/* =================================================================
   Harvest Deli — Commerce adapter (window.Commerce)
   -----------------------------------------------------------------
   The single API surface the frontend uses for commerce. Today it
   resolves from the local catalog (HD_product / HD_stock / HD_CART)
   and RESHAPES everything into Shopify Storefront types (types.js).
   When config.source === 'shopify' AND a token is set, the read +
   cart + checkout paths route through HD_Storefront instead — same
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
      freeShippingThreshold: (CFG().freeShippingThreshold || 120),
      checkoutUrl: 'checkout.html'   // local wizard; Shopify checkoutUrl is used by Commerce.checkout() when live
    };
  }

  /* Build Shopify cart line inputs from HD_CART. Returns null if any line has no
     mapped variant id (i.e. catalog not synced yet) — caller falls back to local. */
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

  /* ---------------- public API ---------------- */
  var Commerce = {
    config: CFG,

    products: {
      /** @returns {Promise<Product|null>} */
      async get(handle) {
        if (useShopify()) {
          var d = await SF().safeFetch(SF().QUERIES.productByHandle, { handle: handle });
          if (d && d.product) return normalizeShopifyProduct(d.product);
        }
        return toProduct(handle); // mock / fallback
      },
      /** @returns {Promise<Product[]>} */
      async all() {
        if (useShopify()) {
          var d = await SF().safeFetch(SF().QUERIES.products, { first: 50 });
          if (d && d.products && d.products.nodes) return d.products.nodes.map(normalizeShopifyProduct);
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

    /* Checkout: when live + catalog synced, create a Shopify cart from HD_CART and
       return Shopify's hosted checkoutUrl. Otherwise return the local wizard URL.
       @returns {Promise<string>} a URL to navigate to. */
    async checkout() {
      if (useShopify()) {
        var lines = shopifyLinesFromCart();
        if (lines && lines.length) {
          var d = await SF().safeFetch(SF().QUERIES.cartCreate, { lines: lines });
          var cart = d && d.cartCreate && d.cartCreate.cart;
          if (cart && cart.checkoutUrl) { setCartId(cart.id); return cart.checkoutUrl; }
        }
        // not synced / API failed → safe fallback to the local wizard
        if (window.console) console.warn('[commerce] Shopify checkout unavailable, using local checkout.html');
      }
      return 'checkout.html';
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
          image: (n.images[0] && n.images[0].url) || 'harvestdeli.png',
          notes: (n.descriptionHtml || '').replace(/<[^>]+>/g, '').trim(),
          tags: n.tags || [], badges: [], type: (n.productType || '').toLowerCase()
          // region/altitude/hue/edition: map from Shopify metafields here when modelled.
        };
      }
    }
  };

  window.Commerce = Commerce;

  /* Checkout redirect interceptor — INERT under mock (the link works normally).
     Only when live + synced does it create a Shopify cart and redirect to the
     hosted checkout. Keeps the existing checkout.html flow untouched otherwise. */
  document.addEventListener('click', function (e) {
    if (!useShopify()) return;                                  // mock → do nothing, normal link
    var a = e.target.closest && e.target.closest('a.cart-checkout, [data-shopify-checkout]');
    if (!a) return;
    e.preventDefault();
    Commerce.checkout().then(function (url) { window.location.href = url; });
  }, true);
})();
