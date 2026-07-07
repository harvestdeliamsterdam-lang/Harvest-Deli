/* =================================================================
   Harvest Deli, Checkout engine (vanilla, no build step)
   -----------------------------------------------------------------
   Drives the 5-step checkout wizard on checkout.html and feeds the
   order success page. Reuses the cart from shared.js (window.HD_CART)
   and the product catalog (window.HD_product).

   This file owns ONLY checkout logic. Real payment / carrier APIs are
   marked with `// SEAM:`, that is where Stripe/Mollie/PostNL plug
   in later. Nothing here pretends to charge a card or authenticate.
   ================================================================= */

/* ----------------------------- Types ----------------------------- *
 * @typedef {{ slug:string, qty:number }} CartItem
 * @typedef {{ line1:string, line2?:string, city:string, postcode:string, country:string }} Address
 * @typedef {{ firstName:string, lastName:string, email:string, phone?:string,
 *   company?:string, vat?:string, billing:Address, shipping:Address,
 *   shipToBilling:boolean, saveDetails:boolean }} CustomerDetails
 * @typedef {{ id:string, carrier:string, label:string, estimate:string,
 *   price:number, free:boolean }} ShippingMethod
 * @typedef {{ id:string, label:string }} PaymentMethod
 * @typedef {{ code:string, type:'percent'|'fixed', value:number, label:string }} Discount
 * @typedef {{ step:number, details:CustomerDetails, shippingId:string,
 *   paymentId:string, discountCode:string|null, terms:boolean, privacy:boolean }} CheckoutState
 * @typedef {{ id:string, createdAt:string, items:Array<{slug,name,weight,qty,price}>,
 *   subtotal:number, discount:number, shipping:number, total:number,
 *   shippingMethod:ShippingMethod, paymentLabel:string, customer:CustomerDetails }} OrderSummary
 * ----------------------------------------------------------------- */

(function () {
  'use strict';

  /* ----------------------------- Config ---------------------------- */
  /** Free shipping threshold, single source of truth lives in shared.js. */
  var FREE_SHIPPING_AT = (typeof window !== 'undefined' && window.HD_FREE_SHIP) || 65;

  /** @type {ShippingMethod[]}, order = display order. This is a DISPLAY ESTIMATE
   *  only, verified to match Shopify's live delivery profile (NL/BE: €6.95 flat,
   *  free ≥ FREE_SHIPPING_AT). Shopify's own checkout is the source of truth for
   *  the actual charge, do not add carrier-branded or invented methods here
   *  (e.g. a local "Pickup" option) unless Shopify's delivery profile offers it;
   *  verify via a live test cart before adding anything back. */
  var SHIPPING = [
    { id: 'standard', label: 'Standard shipping', estimate: 'Calculated securely at checkout', price: 6.95, free: true }
  ];

  /** @type {PaymentMethod[]}, UI only, a preference the buyer confirms at the
   *  Shopify hosted checkout. Must mirror the LIVE Mollie gateways exactly
   *  (verified: Mollie - iDeal / Bancontact / Credit Card). Do not add methods
   *  here that Mollie doesn't offer, or buyers hit a dead end at checkout. */
  var PAYMENTS = [
    { id: 'ideal',      label: 'iDEAL' },
    { id: 'card',       label: 'Card' },
    { id: 'bancontact', label: 'Bancontact' }
  ];

  /** @type {Object<string,Discount>} */
  var DISCOUNTS = {
    'HARVEST10': { code: 'HARVEST10', type: 'percent', value: 10, label: '10% welcome' },
    'GREEK5':    { code: 'GREEK5',   type: 'fixed',   value: 5,  label: '€5 off' }
  };

  var STATE_KEY = 'hd-checkout-v1';
  var ORDERS_KEY = 'hd-orders-v1';

  /* --------------------------- Utilities --------------------------- */
  /** Money formatter: whole euros stay clean (€68), fractional show cents (€6.95). */
  function fmt(n) {
    n = Math.round((Number(n) || 0) * 100) / 100;
    return Number.isInteger(n) ? '€' + n : '€' + n.toFixed(2);
  }
  /** Analytics helper, uses HD_track when commerce.js is ready, else records
   *  straight to the dataLayer (load order can race on first paint). */
  function track(ev, params) {
    if (window.HD_track) { window.HD_track(ev, params); return; }
    (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: ev }, params || {}));
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function lookup(key, fallback) {
    try {
      var lang = (window.HD_lang && window.HD_lang()) || 'en';
      var d = (window.HD_T && window.HD_T[lang]) || {};
      return d[key] || (window.HD_T && window.HD_T.en && window.HD_T.en[key]) || fallback || key;
    } catch (e) { return fallback || key; }
  }

  /* --------------------------- State ------------------------------- */
  /** @returns {CustomerDetails} */
  function blankDetails() {
    var addr = function () { return { line1: '', line2: '', city: '', postcode: '', country: 'Netherlands' }; };
    return {
      firstName: '', lastName: '', email: '', phone: '', company: '', vat: '',
      billing: addr(), shipping: addr(), shipToBilling: true, saveDetails: false
    };
  }
  /** @type {CheckoutState} */
  var state = {
    step: 1, details: blankDetails(), shippingId: SHIPPING[0].id,
    paymentId: PAYMENTS[0].id, discountCode: null, terms: false, privacy: false
  };

  function loadState() {
    try {
      var raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        state = Object.assign(state, p);
        state.details = Object.assign(blankDetails(), p.details || {});
        // A previously saved method may no longer be offered (e.g. PayPal
        // removed when we went Mollie-only), fall back to the first one.
        if (!PAYMENTS.some(function (m) { return m.id === state.paymentId; })) state.paymentId = PAYMENTS[0].id;
      }
    } catch (e) {}
    // Prefill from a saved account session if present (guest checkout still default).
    try {
      if (window.HD_account && window.HD_account.current) {
        var acc = window.HD_account.current();
        if (acc && !state.details.email) {
          state.details.email = acc.email || '';
          state.details.firstName = acc.firstName || '';
          state.details.lastName = acc.lastName || '';
        }
      }
    } catch (e) {}
  }
  function saveState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* --------------------------- Money ------------------------------- */
  /* Migration #3, the order summary reads its cart STATE from Commerce
     (Shopify-shaped) when available, falling back to the HD_CART runtime.
     HD_CART remains the source of truth; Commerce bridges to it. */
  function cartSnapshot() {
    // HD_CART is the source of truth (size + bundle + basket offer). The
    // Commerce mirror is slug-only, so the checkout reads HD_CART directly.
    return null;
  }
  function cartLines() {
    var snap = cartSnapshot();
    if (snap) return snap.lines.map(function (l) {
      return {
        slug: l.handle, qty: l.quantity,
        name: (l.merchandise && l.merchandise.product && l.merchandise.product.title) || l.title,
        lineTotal: +l.lineTotal.amount
      };
    });
    return (window.HD_CART ? window.HD_CART.items : []).map(function (it) {
      var p = window.HD_product && window.HD_product(it.slug);
      var sizeLbl = (window.HD_CART && window.HD_CART.sizeLabel) ? window.HD_CART.sizeLabel(it) : '';
      var lt = (window.HD_CART && window.HD_CART.lineTotal) ? window.HD_CART.lineTotal(it) : (p ? p.price * it.qty : 0);
      return { slug: it.slug, qty: it.qty, size: it.size, sizeLabel: sizeLbl,
               name: (p ? p.name : it.slug) + (sizeLbl ? ' · ' + sizeLbl : ''), lineTotal: lt };
    });
  }
  function offerAmount() {
    return (window.HD_CART && window.HD_CART.offerDiscount) ? window.HD_CART.offerDiscount() : 0;
  }
  function subtotal() {
    var snap = cartSnapshot();
    if (snap) return +snap.cost.subtotalAmount.amount;
    return (window.HD_CART && window.HD_CART.total()) || 0;
  }
  /* Cart mutations route through Commerce (bridges HD_CART synchronously) with
     HD_CART fallback. Single path → no double updates. */
  /* HD_CART is the source of truth and is size-aware (the Commerce mirror is
     slug-only, which would mutate the wrong size line), so route directly. */
  function cmUpdate(slug, qty, size) { if (window.HD_CART) window.HD_CART.setQty(slug, qty, size); }
  function cmRemove(slug, size) { if (window.HD_CART) window.HD_CART.remove(slug, size); }
  function cmAdd(slug, qty, size) { if (window.HD_CART) window.HD_CART.add(slug, qty, size); }
  function discountAmount() {
    if (!state.discountCode) return 0;
    var d = DISCOUNTS[state.discountCode];
    if (!d) return 0;
    var sub = subtotal();
    var amt = d.type === 'percent' ? sub * (d.value / 100) : d.value;
    return Math.min(amt, sub);
  }
  function shippingMethod() {
    for (var i = 0; i < SHIPPING.length; i++) if (SHIPPING[i].id === state.shippingId) return SHIPPING[i];
    return SHIPPING[0];
  }
  /** Shipping cost given subtotal & method (free-threshold aware). */
  function calcShipping() {
    var m = shippingMethod();
    if (m.price === 0) return 0;
    if (m.free && (subtotal() - discountAmount() - offerAmount()) >= FREE_SHIPPING_AT) return 0;
    return m.price;
  }
  function grandTotal() { return Math.max(0, subtotal() - discountAmount() - offerAmount() + calcShipping()); }

  /* ------------------------- Validation ---------------------------- */
  function setFieldError(input, msg) {
    if (!input) return;
    var field = input.closest('.field') || input.parentElement;
    var existing = field.querySelector('.hd-field-error');
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (!existing) {
        existing = document.createElement('p');
        existing.className = 'hd-field-error';
        existing.setAttribute('role', 'alert');
        field.appendChild(existing);
      }
      existing.textContent = msg;
    } else {
      input.removeAttribute('aria-invalid');
      if (existing) existing.remove();
    }
  }
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  /** Validate a set of [input, rule] pairs; returns first invalid input or null. */
  function hdValidate(rules) {
    var firstBad = null;
    rules.forEach(function (r) {
      var el = r.el, val = (el && el.value || '').trim(), msg = '';
      if (r.required && !val) msg = lookup('ck.err.required', 'Required');
      else if (val && r.type === 'email' && !isEmail(val)) msg = lookup('ck.err.email', 'Enter a valid email');
      else if (val && r.type === 'postcode' && val.length < 3) msg = lookup('ck.err.postcode', 'Enter a valid postcode');
      setFieldError(el, msg);
      if (msg && !firstBad) firstBad = el;
    });
    if (firstBad) { try { firstBad.focus(); } catch (e) {} }
    return firstBad;
  }

  /* ===================================================================
     RENDERING
     =================================================================== */
  function relatedSlugs() {
    var inCart = {};
    (window.HD_CART ? window.HD_CART.items : []).forEach(function (i) { inCart[i.slug] = true; });
    var pool = ['thyme', 'olive-oil', 'mountain-tea', 'chestnut', 'orange-blossom', 'arbutus'];
    return pool.filter(function (s) { return !inCart[s] && window.HD_product && window.HD_product(s); }).slice(0, 3);
  }

  function renderCartLines() {
    var wrap = $('#wzCartLines'), empty = $('#wzCartEmpty');
    if (!wrap) return;
    // Migration #4, read the cart STATE from Commerce (Shopify-shaped) when
    // available, falling back to HD_CART. Presentation reuses HD_product.
    var lines = cartLines();
    if (!lines.length) {
      wrap.innerHTML = '';
      if (empty) empty.hidden = false;
      $all('[data-wz-when-filled]').forEach(function (n) { n.hidden = true; });
      return;
    }
    if (empty) empty.hidden = true;
    $all('[data-wz-when-filled]').forEach(function (n) { n.hidden = false; });
    wrap.innerHTML = lines.map(function (l) {
      var p = window.HD_product(l.slug);
      if (!p) return '';
      return '' +
        '<div class="wz-line" data-slug="' + l.slug + '" data-size="' + (l.size || '') + '">' +
          '<a class="wz-line-thumb" href="' + p.url + '"><img src="' + p.image + '" alt="' + p.name + '" loading="lazy"></a>' +
          '<div class="wz-line-info">' +
            '<a class="wz-line-name" href="' + p.url + '">' + l.name + '</a>' +
            '<div class="wz-line-meta">' + (l.sizeLabel || p.edition || '') + '</div>' +
            '<div class="wz-qty" role="group" aria-label="Quantity">' +
              '<button type="button" class="wz-qty-btn" data-qty-dec aria-label="' + lookup('ck.qty.dec', 'Decrease quantity') + '">&minus;</button>' +
              '<span class="wz-qty-val" aria-live="polite">' + l.qty + '</span>' +
              '<button type="button" class="wz-qty-btn" data-qty-inc aria-label="' + lookup('ck.qty.inc', 'Increase quantity') + '">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="wz-line-right">' +
            '<div class="wz-line-price">' + fmt(l.lineTotal) + '</div>' +
            '<button type="button" class="wz-line-remove" data-remove>' + lookup('ck.remove', 'Remove') + '</button>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  function renderUpsell() {
    var wrap = $('#wzUpsell');
    if (!wrap) return;
    var slugs = relatedSlugs();
    if (!slugs.length) { wrap.hidden = true; return; }
    wrap.hidden = false;
    wrap.querySelector('[data-upsell-row]').innerHTML = slugs.map(function (s) {
      var p = window.HD_product(s);
      return '' +
        '<div class="wz-up-card">' +
          '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy">' +
          '<div class="wz-up-info">' +
            '<div class="wz-up-name">' + p.name + '</div>' +
            '<div class="wz-up-price">' + fmt(p.price) + '</div>' +
          '</div>' +
          '<button type="button" class="wz-up-add" data-up-add="' + s + '">' + lookup('ck.add', 'Add') + '</button>' +
        '</div>';
    }).join('');
  }

  function summaryHTML() {
    var lines = cartLines().map(function (l) {
      var p = window.HD_product && window.HD_product(l.slug);
      var img = (p && p.image) || '';
      return '<div class="sm-line">' +
             '<span class="sm-line-thumb">' + (img ? '<img src="' + img + '" alt="" loading="lazy">' : '') + '</span>' +
             '<span class="sm-line-name">' + l.name + ' <em>×' + l.qty + '</em></span>' +
             '<span class="sm-line-price">' + fmt(l.lineTotal) + '</span></div>';
    }).join('');
    var disc = discountAmount();
    var offer = offerAmount();   // HD_CART.offerDiscount() = the Ritual Saving (mirrors live Shopify auto-discount)
    // TODO (Shopify): the €5 Ritual Saving mirrors the store's automatic discounts
    // ("3 honingpotten, €5" / "2 honing + 1 olijfolie, €5"), which apply at the
    // Shopify hosted checkout. Keep this label + amount in lockstep with Shopify.
    var offerLabel = (window.HD_lang && window.HD_lang() === 'nl') ? 'Ritueelkorting' : 'Ritual saving';
    var ship = calcShipping();
    var rows = '' +
      '<div class="sm-row"><span>' + lookup('ck.subtotal', 'Subtotal') + '</span><span>' + fmt(subtotal()) + '</span></div>' +
      (offer > 0 ? '<div class="sm-row sm-discount"><span>' + offerLabel + '</span><span>−' + fmt(offer) + '</span></div>' : '') +
      (disc > 0 ? '<div class="sm-row sm-discount"><span>' + lookup('ck.discount', 'Discount') + ' · ' + state.discountCode + '</span><span>−' + fmt(disc) + '</span></div>' : '') +
      '<div class="sm-row"><span>' + lookup('ck.shipping', 'Shipping') + '</span><span>' + (ship === 0 ? lookup('ck.free', 'Free') : fmt(ship)) + '</span></div>' +
      '<div class="sm-row sm-grand"><span>' + lookup('ck.total', 'Total') + '</span><span>' + fmt(grandTotal()) + '</span></div>';
    return '<div class="sm-lines">' + lines + '</div><div class="sm-rows">' + rows + '</div>';
  }

  function renderSummary() {
    $all('[data-wz-summary]').forEach(function (n) { n.innerHTML = summaryHTML(); });
    // Mobile bar total + free-shipping progress
    var bar = $('#wzMobileTotal'); if (bar) bar.textContent = fmt(grandTotal());
    var prog = $('#wzFreeProgress');
    if (prog) {
      var subAfter = subtotal() - discountAmount();
      var remain = FREE_SHIPPING_AT - subAfter;
      if (remain > 0 && (window.HD_CART && window.HD_CART.items.length)) {
        prog.hidden = false;
        var pct = Math.max(4, Math.min(100, (subAfter / FREE_SHIPPING_AT) * 100));
        var txt = lookup('ck.freeProgress', 'Add {x} more for free shipping').replace('{x}', fmt(remain));
        prog.innerHTML = '<span class="fp-label">' + txt + '</span>' +
          '<span class="fp-track" aria-hidden="true"><span class="fp-fill" style="width:' + pct.toFixed(1) + '%"></span></span>';
      } else { prog.hidden = true; }
    }
  }

  function renderShipping() {
    var wrap = $('#wzShipOptions');
    if (!wrap) return;
    var subAfter = subtotal() - discountAmount();
    wrap.innerHTML = SHIPPING.map(function (m) {
      var free = m.free && m.price > 0 && subAfter >= FREE_SHIPPING_AT;
      var priceTxt = m.price === 0 ? lookup('ck.free', 'Free') : (free ? lookup('ck.free', 'Free') : fmt(m.price));
      return '' +
        '<button type="button" class="ship-opt' + (m.id === state.shippingId ? ' active' : '') + '" data-ship="' + m.id + '" aria-pressed="' + (m.id === state.shippingId) + '">' +
          '<span class="radio" aria-hidden="true"></span>' +
          '<span class="ship-opt-body"><span class="title">' + m.label + '</span><span class="sub">' + m.estimate + '</span></span>' +
          '<span class="price' + (free ? ' was-free' : '') + '">' + priceTxt + '</span>' +
        '</button>';
    }).join('');
  }

  function addrHTML(a) {
    if (!a || !a.line1) return '<span class="muted">' + lookup('ck.review.none', '-') + '</span>';
    return [a.line1, a.line2, (a.postcode + ' ' + a.city).trim(), a.country].filter(Boolean).join('<br>');
  }
  function renderReview() {
    var d = state.details;
    var set = function (id, html) { var el = $(id); if (el) el.innerHTML = html; };
    set('#wzReviewContact', (d.firstName + ' ' + d.lastName).trim() + '<br>' + (d.email || '') + (d.phone ? '<br>' + d.phone : ''));
    set('#wzReviewShipAddr', addrHTML(d.shipToBilling ? d.billing : d.shipping));
    set('#wzReviewBillAddr', addrHTML(d.billing));
    var m = shippingMethod();
    set('#wzReviewDelivery', m.label + '<br><span class="muted">' + m.estimate + '</span>');
    var pay = PAYMENTS.filter(function (p) { return p.id === state.paymentId; })[0];
    set('#wzReviewPayment', pay ? pay.label : '');
    var itemsWrap = $('#wzReviewItems');
    if (itemsWrap) itemsWrap.innerHTML = summaryHTML();
  }

  /* ===================================================================
     WIZARD CONTROLLER
     =================================================================== */
  var STEPS = 5;
  function showStep(n) {
    n = Math.max(1, Math.min(STEPS, n));
    state.step = n; saveState();
    $all('.wz-step').forEach(function (panel) {
      var match = Number(panel.getAttribute('data-step')) === n;
      panel.hidden = !match;
    });
    $all('.wz-dot').forEach(function (dot) {
      var s = Number(dot.getAttribute('data-step'));
      dot.classList.toggle('active', s === n);
      dot.classList.toggle('done', s < n);
      if (s === n) dot.setAttribute('aria-current', 'step'); else dot.removeAttribute('aria-current');
    });
    if (n === 3) renderShipping(); // delivery step
    if (n === 5) renderReview();
    syncMobileBar();
    // move focus + scroll to the wizard top (no layout jump)
    var top = $('#wzTop');
    if (top) { try { top.focus({ preventScroll: true }); } catch (e) {} window.scrollTo({ top: top.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }); }
  }

  function commitDetails() {
    var g = function (id) { var el = $(id); return el ? el.value.trim() : ''; };
    var d = state.details;
    d.firstName = g('#ckFirst'); d.lastName = g('#ckLast');
    d.email = g('#ckEmail'); d.phone = g('#ckPhone');
    d.company = g('#ckCompany'); d.vat = g('#ckVat');
    d.billing = { line1: g('#ckAddr1'), line2: g('#ckAddr2'), city: g('#ckCity'), postcode: g('#ckPostcode'), country: g('#ckCountry') };
    var same = $('#ckSameAddr'); d.shipToBilling = same ? same.checked : true;
    if (!d.shipToBilling) {
      d.shipping = { line1: g('#shAddr1'), line2: g('#shAddr2'), city: g('#shCity'), postcode: g('#shPostcode'), country: g('#shCountry') };
    } else { d.shipping = Object.assign({}, d.billing); }
    var save = $('#ckSave'); d.saveDetails = save ? save.checked : false;
    saveState();
  }

  function validateStep(n) {
    if (n === 1) {
      return (window.HD_CART && window.HD_CART.items.length > 0);
    }
    if (n === 2) {
      var rules = [
        { el: $('#ckFirst'), required: true },
        { el: $('#ckLast'), required: true },
        { el: $('#ckEmail'), required: true, type: 'email' },
        { el: $('#ckAddr1'), required: true },
        { el: $('#ckCity'), required: true },
        { el: $('#ckPostcode'), required: true, type: 'postcode' }
      ];
      var same = $('#ckSameAddr');
      if (same && !same.checked) {
        rules.push({ el: $('#shAddr1'), required: true }, { el: $('#shCity'), required: true }, { el: $('#shPostcode'), required: true, type: 'postcode' });
      }
      return !hdValidate(rules);
    }
    if (n === 5) {
      var terms = $('#ckTerms'), privacy = $('#ckPrivacy');
      var ok = (!terms || terms.checked) && (!privacy || privacy.checked);
      var note = $('#wzConsentError');
      if (note) note.hidden = ok;
      return ok;
    }
    return true;
  }

  function next() {
    if (state.step === 2) commitDetails();
    if (!validateStep(state.step)) return;
    showStep(state.step + 1);
  }
  function prev() { showStep(state.step - 1); }

  function syncMobileBar() {
    var label = $('#wzMobileAction'); if (!label) return;
    if (state.step >= STEPS) label.textContent = lookup('ck.place', 'Place order');
    else label.textContent = lookup('ck.continue', 'Continue');
  }

  /* --------------------------- Place order ------------------------- */
  function placeOrder(btn) {
    // PRODUCTION = Shopify only. This branded wizard is a PRE-CHECKOUT step: the
    // final button hands off to Shopify hosted checkout (Mollie). It NEVER
    // simulates a payment, writes hd-orders-v1, or creates a local order.
    if ((window.HD_COMMERCE_CONFIG && window.HD_COMMERCE_CONFIG.source) === 'shopify') {
      commitDetails(); // freshest contact/address, so the hosted checkout opens pre-filled
      if (btn) { btn.classList.add('loading'); btn.disabled = true; } // existing .loading style
      if (window.HD_startCheckout) { window.HD_startCheckout(state.details); }
      else { window.location.replace('shop.html'); }
      return;
    }
    commitDetails();
    if (!validateStep(5)) return;
    // Order is built from the Commerce cart snapshot (HD_CART fallback inside).
    var snap = cartSnapshot();
    var lines = cartLines();
    if (!lines.length) return;
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }

    // SEAM (Shopify): when source==='shopify', the cart carries a real, off-site
    // checkoutUrl. Redirect there instead of creating a local order, and do NOT
    // build/persist a local fake order. Inactive while source==='mock'.
    //   if (snap && /^https?:/.test(snap.checkoutUrl)) { location.href = snap.checkoutUrl; return; }

    // Build a frozen order snapshot from the Commerce-shaped lines, carrying
    // enough metadata for email confirmation / invoice / admin dashboard /
    // future Shopify reconciliation (merchandiseId, productId, handle, variant).
    var items = lines.map(function (l) {
      var p = window.HD_product(l.slug);
      var sl = snap ? snap.lines.filter(function (x) { return x.handle === l.slug; })[0] : null;
      var mrch = sl && sl.merchandise;
      var unit = p ? p.price : (l.qty ? l.lineTotal / l.qty : 0);
      return {
        slug: l.slug, name: l.name, weight: p ? p.weight : '', qty: l.qty,
        price: unit, lineTotal: l.lineTotal,
        // Shopify-ready references (mock today, real gids later):
        merchandiseId: mrch ? mrch.id : null,
        productId: (mrch && mrch.product && mrch.product.id) || null,
        handle: (mrch && mrch.product && mrch.product.handle) || l.slug,
        variantTitle: mrch ? mrch.title : (p ? p.weight : '')
      };
    });
    var m = shippingMethod();
    var pay = PAYMENTS.filter(function (p) { return p.id === state.paymentId; })[0];
    var sub = subtotal(), disc = discountAmount(), ship = calcShipping(), tot = grandTotal();
    function money(n) { return { amount: (Math.round((+n || 0) * 100) / 100).toFixed(2), currencyCode: 'EUR' }; }
    var order = {
      id: 'HD-' + new Date().getFullYear() + '-' + String(Math.floor(performance.now())).slice(-6),
      createdAt: new Date().toISOString(),
      items: items,
      // flat totals, back-compat with success page / invoice / admin:
      subtotal: sub, discount: disc, shipping: ship, total: tot,
      // Shopify-shaped cost (placeholders ready for tax/discount/shipping from Shopify):
      cost: {
        subtotalAmount: money(sub),
        totalAmount: money(tot),
        totalTaxAmount: null,                 // SEAM: Shopify cart.cost.totalTaxAmount
        totalShippingAmount: money(ship),
        discountAllocations: disc > 0 ? [{ code: state.discountCode || null, amount: money(disc) }] : []
      },
      shippingMethod: m, paymentLabel: pay ? pay.label : '', customer: state.details,
      checkoutUrl: snap ? snap.checkoutUrl : 'checkout.html', // SEAM: Shopify off-site URL
      source: (window.HD_COMMERCE_CONFIG && window.HD_COMMERCE_CONFIG.source) || 'mock'
    };

    // SEAM: this is the single payment boundary. Replace the timeout with a
    // Stripe/Mollie PaymentIntent confirmation, then persist server-side.
    setTimeout(function () {
      try {
        var orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
        orders.unshift(order);
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      } catch (e) {}
      // If "save details" and a session exists, persist to the account.
      try {
        if (state.details.saveDetails && window.HD_account && window.HD_account.current && window.HD_account.current()) {
          window.HD_account.saveAddress(state.details.billing);
        }
      } catch (e) {}
      // Clear cart + checkout state, keep the order.
      try {
        (window.HD_CART.items.slice()).forEach(function (it) { window.HD_CART.remove(it.slug); });
        localStorage.removeItem(STATE_KEY);
      } catch (e) {}
      track('purchase', {
        transaction_id: order.id, currency: 'EUR', value: order.total,
        shipping: order.shipping, discount: order.discount,
        items: order.items.map(function (i) { return { item_id: i.slug, item_name: i.name, price: i.price, quantity: i.qty }; })
      });
      window.location.href = 'order-success.html?order=' + encodeURIComponent(order.id);
    }, 700);
  }

  /* --------------------------- Wiring ------------------------------ */
  function rerenderAll() {
    renderCartLines(); renderUpsell(); renderSummary();
    try { if (window.HD_renderCart) window.HD_renderCart(); } catch (e) {} // keep nav count in sync
    // step-1 continue gating (empty cart can't proceed)
    var canProceed = (window.HD_CART && window.HD_CART.items.length > 0);
    $all('[data-wz-next][data-step1]').forEach(function (b) { b.disabled = !canProceed; });
  }

  function prefillDetailsInputs() {
    var d = state.details;
    var s = function (id, v) { var el = $(id); if (el && v != null) el.value = v; };
    s('#ckFirst', d.firstName); s('#ckLast', d.lastName); s('#ckEmail', d.email); s('#ckPhone', d.phone);
    s('#ckCompany', d.company); s('#ckVat', d.vat);
    s('#ckAddr1', d.billing.line1); s('#ckAddr2', d.billing.line2); s('#ckCity', d.billing.city);
    s('#ckPostcode', d.billing.postcode); s('#ckCountry', d.billing.country);
    var same = $('#ckSameAddr'); if (same) { same.checked = d.shipToBilling !== false; toggleShipAddr(); }
  }
  function toggleShipAddr() {
    var same = $('#ckSameAddr'); var group = $('#shipAddrGroup');
    if (group) group.hidden = !same || same.checked;
  }

  function init() {
    var wizard = $('#checkoutWizard');
    if (!wizard) return; // not on checkout page
    loadState();
    prefillDetailsInputs();
    rerenderAll();
    // payment tabs preselect
    $all('.pay-tab').forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-pay') === state.paymentId); });
    var cardFields = $('#wzCardFields'); if (cardFields) cardFields.hidden = state.paymentId !== 'card';
    showStep(state.step || 1);
    track('begin_checkout', { currency: 'EUR', value: subtotal() });

    // Delegated clicks
    document.addEventListener('click', function (e) {
      var t = e.target;
      var line = t.closest && t.closest('.wz-line');
      if (line) {
        var slug = line.getAttribute('data-slug');
        var size = line.getAttribute('data-size') || null;
        if (t.closest('[data-qty-inc]')) { var it = cartItem(slug, size); cmUpdate(slug, (it ? it.qty : 1) + 1, size); rerenderAll(); return; }
        if (t.closest('[data-qty-dec]')) { var it2 = cartItem(slug, size); cmUpdate(slug, (it2 ? it2.qty : 1) - 1, size); rerenderAll(); return; }
        if (t.closest('[data-remove]')) { cmRemove(slug, size); rerenderAll(); return; }
      }
      if (t.closest('[data-up-add]')) { cmAdd(t.closest('[data-up-add]').getAttribute('data-up-add'), 1); rerenderAll(); return; }
      var ship = t.closest && t.closest('.ship-opt');
      if (ship) { state.shippingId = ship.getAttribute('data-ship'); saveState(); renderShipping(); renderSummary(); track('add_shipping_info', { shipping_tier: state.shippingId, value: grandTotal(), currency: 'EUR' }); return; }
      var tab = t.closest && t.closest('.pay-tab');
      if (tab) {
        state.paymentId = tab.getAttribute('data-pay'); saveState();
        $all('.pay-tab').forEach(function (x) { x.classList.toggle('active', x === tab); });
        var cf = $('#wzCardFields'); if (cf) cf.hidden = state.paymentId !== 'card';
        track('add_payment_info', { payment_type: state.paymentId, value: grandTotal(), currency: 'EUR' });
        return;
      }
      if (t.closest('[data-wz-next]')) { next(); return; }
      if (t.closest('[data-wz-prev]')) { prev(); return; }
      if (t.closest('[data-wz-place]')) { placeOrder(t.closest('[data-wz-place]')); return; }
      if (t.closest('[data-wz-goto]')) { var s = Number(t.closest('[data-wz-goto]').getAttribute('data-wz-goto')); if (s < state.step) showStep(s); return; }
      if (t.closest('[data-wz-apply-discount]')) { applyDiscount(); return; }
      var faqHead = t.closest && t.closest('.wz-faq-q');
      if (faqHead) { var item = faqHead.parentElement; item.classList.toggle('open'); faqHead.setAttribute('aria-expanded', item.classList.contains('open')); return; }
      // mobile bar action mirrors current step
      if (t.closest('#wzMobileBtn')) { if (state.step >= STEPS) placeOrder($('[data-wz-place]')); else next(); return; }
    });

    // same-as-billing
    var same = $('#ckSameAddr');
    if (same) same.addEventListener('change', toggleShipAddr);

    // discount on Enter
    var dInput = $('#wzDiscountInput');
    if (dInput) dInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyDiscount(); } });

    // re-render on language switch (labels) and cart drawer changes
    window.addEventListener('hd:lang', function () { rerenderAll(); renderShipping(); if (state.step === 5) renderReview(); });
    document.addEventListener('hd:cart-changed', rerenderAll);
  }

  function cartItem(slug, size) {
    var items = window.HD_CART ? window.HD_CART.items : [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].slug === slug && (size == null || (items[i].size || null) === size)) return items[i];
    }
    return null;
  }
  function applyDiscount() {
    var input = $('#wzDiscountInput'), msg = $('#wzDiscountMsg');
    if (!input) return;
    var code = (input.value || '').trim().toUpperCase();
    if (!code) return;
    if (DISCOUNTS[code]) {
      state.discountCode = code; saveState(); renderSummary(); renderShipping();
      if (msg) { msg.textContent = lookup('ck.discount.ok', 'Code applied') + ' · ' + DISCOUNTS[code].label; msg.className = 'wz-discount-msg ok'; }
    } else {
      state.discountCode = null; saveState(); renderSummary();
      if (msg) { msg.textContent = lookup('ck.discount.bad', 'That code is not valid'); msg.className = 'wz-discount-msg bad'; }
    }
  }

  // Expose a tiny surface for debugging / future integration.
  window.HD_checkout = { state: function () { return state; }, totals: function () { return { subtotal: subtotal(), discount: discountAmount(), shipping: calcShipping(), total: grandTotal() }; } };

  // checkout.html is a BRANDED PRE-CHECKOUT step. It renders the existing premium
  // multi-step wizard for the experience, but NEVER creates an order or simulates
  // payment, the final button hands off to Shopify hosted checkout (see
  // placeOrder). Empty cart → shop.html. In production (source==='shopify') the
  // wizard is purely presentational; the real payment happens on Shopify (Mollie).
  function bootCheckout(tries) {
    var src = (window.HD_COMMERCE_CONFIG && window.HD_COMMERCE_CONFIG.source);
    if (!src) { // config not loaded yet → wait briefly, then assume mock/dev
      if ((tries || 0) < 80) return setTimeout(function () { bootCheckout((tries || 0) + 1); }, 50);
      return init();
    }
    if (src !== 'shopify') return init(); // dev/mock → local wizard
    // Production: empty cart has nothing to pre-check → send to shop.
    var has = window.HD_CART && window.HD_CART.items && window.HD_CART.items.length;
    if (!has) { window.location.replace('shop.html'); return; }
    init(); // render the branded pre-checkout UI; final step → Shopify (placeOrder)
    // Discounts are applied on Shopify's hosted checkout, never here, hide the
    // local code field so a pre-checkout total can never disagree with Shopify.
    try { document.querySelectorAll('.wz-discount.wz-discount-msg').forEach(function (el) { el.style.display = 'none'; }); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { bootCheckout(0); });
  else bootCheckout(0);
})();
