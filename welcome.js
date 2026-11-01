/* =================================================================
   Harvest Deli, welkomstaanbod (01-11-2026)
   -----------------------------------------------------------------
   One quiet welcome offer: Shopify code WELKOM5, 5% on products, once per
   customer, no minimum, no end date, not combinable with other discounts.
   Shopify is the only judge of whether the code applies: this file never
   calls a code "applied" until Shopify has said so for the exact cart.

   When it appears
     Desktop: after 75 s of VISIBLE time (summed over pages, hidden tabs do
       not count) and at least one product page, and then only on exit
       intent (the pointer leaves the top of the document). No back-button
       tricks, no beforeunload.
     Phones/touch: never an automatic popup. Under the same conditions a
       small teaser appears at the bottom; tapping it opens a sheet.
   Never during the intro or hero film, with the cookie bar, menu, cart,
   search or any dialog open, on checkout/account/invoice/order/legal
   pages, after a completed order in this browser, or within 30 days of
   closing or accepting it.

   Test groups: a visitor who reaches that moment is assigned once, at
   random, to "aanbod" (sees it) or "controle" (does not). The group goes
   with the Shopify cart as a hidden cart attribute (_hd_welkom_groep), so
   orders per group can be compared in Shopify without any personal data.
   CONFIG.enabled is the central switch; CONFIG.holdout the control share.
   ================================================================= */
(function () {
  'use strict';
  if (window.HD_WELCOME) return;

  var CONFIG = Object.assign({
    enabled: true,          // central on/off switch for the whole campaign
    code: 'WELKOM5',        // must exist in Shopify (read back 01-11-2026)
    percent: 5,
    campaign: 'welkom5',
    minVisibleMs: 75000,    // visible time before the offer may appear
    holdout: 0.5,           // share of eligible visitors in the control group (0 = no test)
    quietDays: 30           // rest after closing or accepting
  }, window.HD_WELCOME_CONFIG || {});

  var KEY = 'hd-welcome-v1';        // { group, visibleMs, productSeen, status, until, reached }
  var CODE_KEY = 'hd-welcome-code'; // { code, t }
  var DAY = 864e5;

  /* ---------------- storage (never throws) ---------------- */
  function read(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function write(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var st = read(KEY) || {};
  function save() { write(KEY, st); }
  function storedCode() { var c = read(CODE_KEY); return c && c.code ? String(c.code) : null; }

  /* ---------------- language ---------------- */
  function lang() { var l = (window.HD_lang && window.HD_lang()) || document.documentElement.lang || 'nl'; l = String(l).slice(0, 2); return (l === 'en' || l === 'el') ? l : 'nl'; }
  function money(n) {
    n = Math.round(n * 100) / 100;
    var s = Number.isInteger(n) ? String(n) : n.toFixed(2);   // €57 / €18,05, like the cart
    return lang() === 'en' ? '€' + s : '€' + s.replace('.', ',');
  }
  var COPY = {
    nl: {
      kop: 'Een eerste kennismaking.',
      offer: CONFIG.percent + '% welkomstkorting',
      text: 'Ontdek onze Griekse honing, olijfolie en bergthee met een klein welkomstgebaar.',
      cta: 'Gebruik mijn ' + CONFIG.percent + '%',
      later: 'Verder rondkijken',
      close: 'Sluiten',
      terms: 'Code ' + CONFIG.code + ', eenmalig per klant. Geldt op de producten, niet op de verzendkosten. Geen minimale besteding. Niet te combineren met andere kortingen zoals de ritueelkorting. We gebruiken de code alleen als je bestelling er inclusief verzending goedkoper van wordt.',
      alt: 'Een pot Griekse acaciahoning op linnen, met een olijftak',
      teaser: CONFIG.percent + '% welkomstkorting',
      teaserOpen: 'Bekijk de welkomstkorting',
      teaserClose: 'Welkomstkorting verbergen',
      readyH: 'Je code staat klaar.',
      readyP: 'We nemen ' + CONFIG.code + ' automatisch mee naar het afrekenen. Je ziet hem ook in je winkelmand.',
      readyEmpty: 'Kies rustig iets uit; de code gaat mee met je eerste afrekening.',
      toCart: 'Bekijk je winkelmand',
      keepShopping: 'Verder winkelen',
      rowLabel: 'Welkomstkorting',
      checking: 'Even nakijken bij Shopify…',
      applied: function (a) { return 'Toegepast: −' + money(a) + ' op je producten.'; },
      ready: 'Je code staat klaar voor het afrekenen.',
      ritual: 'Kortingen stapelen niet. De korting die al in je winkelmand zit is hier voordeliger, dus die geldt nu; je welkomstcode blijft bewaard.',
      rejected: 'Shopify accepteert deze code nu niet, bijvoorbeeld omdat hij al eens is gebruikt. Bij het afrekenen zie je wat er geldt.',
      held: function (a, b) { return 'Zonder code is deze bestelling voordeliger (' + money(a) + ' in plaats van ' + money(b) + ' inclusief verzending), omdat je gratis verzending houdt. We gebruiken hem nu niet en bewaren hem voor een volgende winkelmand.'; },
      remove: 'Verwijderen',
      removeAria: 'Welkomstcode verwijderen',
      removed: 'Welkomstcode verwijderd.'
    },
    en: {
      kop: 'A first introduction.',
      offer: CONFIG.percent + '% welcome discount',
      text: 'Discover our Greek honey, olive oil and mountain tea with a small welcome gesture.',
      cta: 'Use my ' + CONFIG.percent + '%',
      later: 'Keep browsing',
      close: 'Close',
      terms: 'Code ' + CONFIG.code + ', once per customer. Applies to products, not to shipping. No minimum spend. Cannot be combined with other discounts such as the ritual saving. We only use the code when it makes your order cheaper including shipping.',
      alt: 'A jar of Greek acacia honey on linen, with an olive sprig',
      teaser: CONFIG.percent + '% welcome discount',
      teaserOpen: 'View the welcome discount',
      teaserClose: 'Hide the welcome discount',
      readyH: 'Your code is ready.',
      readyP: 'We carry ' + CONFIG.code + ' to checkout for you. You will also see it in your cart.',
      readyEmpty: 'Take your time choosing; the code goes along with your first checkout.',
      toCart: 'View your cart',
      keepShopping: 'Keep shopping',
      rowLabel: 'Welcome discount',
      checking: 'Checking with Shopify…',
      applied: function (a) { return 'Applied: −' + money(a) + ' on your products.'; },
      ready: 'Your code is ready for checkout.',
      ritual: 'Discounts do not stack. The saving already in your cart is better here, so that one applies now; your welcome code stays saved.',
      rejected: 'Shopify does not accept this code right now, for example because it was used before. Checkout shows what applies.',
      held: function (a, b) { return 'This order is cheaper without the code (' + money(a) + ' instead of ' + money(b) + ' including shipping), because you keep free shipping. We will not use it now and keep it for a later cart.'; },
      remove: 'Remove',
      removeAria: 'Remove welcome code',
      removed: 'Welcome code removed.'
    },
    el: {
      kop: 'Μια πρώτη γνωριμία.',
      offer: CONFIG.percent + '% έκπτωση καλωσορίσματος',
      text: 'Ανακαλύψτε το ελληνικό μέλι, το ελαιόλαδο και το τσάι του βουνού με ένα μικρό δώρο καλωσορίσματος.',
      cta: 'Θέλω το ' + CONFIG.percent + '%',
      later: 'Συνέχεια περιήγησης',
      close: 'Κλείσιμο',
      terms: 'Κωδικός ' + CONFIG.code + ', μία φορά ανά πελάτη. Ισχύει για τα προϊόντα, όχι για τα μεταφορικά. Χωρίς ελάχιστη αγορά. Δεν συνδυάζεται με άλλες εκπτώσεις. Τον χρησιμοποιούμε μόνο όταν η παραγγελία βγαίνει φθηνότερη μαζί με τα μεταφορικά.',
      alt: 'Βάζο ελληνικού μελιού ακακίας πάνω σε λινό, με κλαδί ελιάς',
      teaser: CONFIG.percent + '% έκπτωση καλωσορίσματος',
      teaserOpen: 'Δείτε την έκπτωση καλωσορίσματος',
      teaserClose: 'Απόκρυψη',
      readyH: 'Ο κωδικός σας είναι έτοιμος.',
      readyP: 'Ο ' + CONFIG.code + ' περνά αυτόματα στο ταμείο. Θα τον δείτε και στο καλάθι σας.',
      readyEmpty: 'Διαλέξτε με την ησυχία σας· ο κωδικός περνά στην πρώτη σας πληρωμή.',
      toCart: 'Δείτε το καλάθι',
      keepShopping: 'Συνέχεια αγορών',
      rowLabel: 'Έκπτωση καλωσορίσματος',
      checking: 'Έλεγχος με το Shopify…',
      applied: function (a) { return 'Ισχύει: −' + money(a) + ' στα προϊόντα.'; },
      ready: 'Ο κωδικός σας είναι έτοιμος για το ταμείο.',
      ritual: 'Οι εκπτώσεις δεν αθροίζονται. Η έκπτωση τελετουργίας είναι πιο συμφέρουσα εδώ· ο κωδικός σας παραμένει αποθηκευμένος.',
      rejected: 'Το Shopify δεν δέχεται τον κωδικό αυτή τη στιγμή, π.χ. επειδή έχει ήδη χρησιμοποιηθεί.',
      held: function (a, b) { return 'Χωρίς τον κωδικό η παραγγελία είναι φθηνότερη (' + money(a) + ' αντί για ' + money(b) + ' με τα μεταφορικά), επειδή κρατάτε τη δωρεάν αποστολή. Τον κρατάμε για επόμενη φορά.'; },
      remove: 'Αφαίρεση',
      removeAria: 'Αφαίρεση κωδικού',
      removed: 'Ο κωδικός αφαιρέθηκε.'
    }
  };
  function T() { return COPY[lang()] || COPY.nl; }

  /* ---------------- measurement ----------------
     Through HD_track only: analytics.js holds events until the visitor
     decides on cookies and drops them on a refusal. No personal data, and
     each event once per page view (outcome events once per session). */
  var sent = {};
  function track(name, params, once) {
    var k = name + '|' + JSON.stringify(params || {});
    if (sent[k]) return;
    if (once) { try { if (sessionStorage.getItem('hdw:' + k)) return; sessionStorage.setItem('hdw:' + k, '1'); } catch (e) {} }
    sent[k] = 1;
    var p = Object.assign({ campaign: CONFIG.campaign, ab_group: st.group || 'none' }, params || {});
    try { if (window.HD_track) window.HD_track(name, p); } catch (e) {}
  }

  /* ---------------- pages and devices ---------------- */
  var path = location.pathname.toLowerCase().replace(/^\/(nl|en|el)(?=\/|$)/, '') || '/';
  var EXCLUDED = /^\/(checkout|account|login|register|forgot-password|invoice|order-success|track-order|returns|admin|email-preview|404|legal-)/;
  var excludedPage = EXCLUDED.test(path);
  var isProduct = /^\/(products\/[a-z-]+|product-[a-z-]+(\.html)?)\/?$/.test(path);
  function touchLike() {
    var mm = window.matchMedia;
    return !!(mm && (mm('(hover: none)').matches || mm('(pointer: coarse)').matches || mm('(max-width: 899px)').matches));
  }
  function reducedMotion() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  if (isProduct && !st.productSeen) { st.productSeen = true; save(); }

  /* ---------------- visible-time accumulator ----------------
     Counts only while this tab is visible; persisted every few seconds and
     on pagehide so the sum carries across pages. */
  var lastTick = document.visibilityState === 'visible' ? Date.now() : 0;
  function tick() {
    var now = Date.now();
    if (lastTick && document.visibilityState === 'visible') {
      st.visibleMs = (st.visibleMs || 0) + Math.min(now - lastTick, 5000);
    }
    lastTick = document.visibilityState === 'visible' ? now : 0;
  }
  var saveEvery = 0;
  var timer = setInterval(function () {
    tick();
    if (++saveEvery % 5 === 0) save();
    try { evaluate(); } catch (e) {}
  }, 1000);
  document.addEventListener('visibilitychange', function () { tick(); save(); });
  window.addEventListener('pagehide', function () { tick(); save(); });

  /* ---------------- eligibility and suppression ---------------- */
  function quiet() { return !!(st.until && st.until > Date.now()); }
  function ordered() { try { return !!localStorage.getItem('hd-order-seen'); } catch (e) { return false; } }
  function visible(el) {
    if (!el) return false;
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  }
  function busy() {
    var root = document.documentElement;
    if (root.classList.contains('hd-intro-pending') || root.classList.contains('hd-intro-active') || root.classList.contains('hd-film')) return true;
    if (document.querySelector('.hd-intro')) return true;
    if (visible(document.getElementById('cookieBar'))) return true;
    var cart = document.getElementById('cartDrawer');
    if (cart && cart.classList.contains('open')) return true;
    if (document.body && document.body.classList.contains('hd-menu-open')) return true;
    var search = document.getElementById('hdSearch');
    if (search && !search.hidden) return true;
    if (document.querySelector('dialog[open]')) return true;
    if (document.querySelector('.hd-handoff-veil')) return true;
    // Any other open modal (error modal, quick view, ...), except our own.
    var mods = document.querySelectorAll('[aria-modal="true"]');
    for (var i = 0; i < mods.length; i++) {
      if (mods[i].closest('.hdw-root') || mods[i].closest('#cartDrawer')) continue;
      if (visible(mods[i])) return true;
    }
    return false;
  }
  function blocked() {
    return !CONFIG.enabled || excludedPage || quiet() || ordered() || !!storedCode();
  }
  function ready() {
    return (st.visibleMs || 0) >= CONFIG.minVisibleMs && !!st.productSeen;
  }
  function assignGroup() {
    if (st.group) return st.group;
    st.group = Math.random() < CONFIG.holdout ? 'controle' : 'aanbod';
    save();
    return st.group;
  }
  /* The moment the visitor would see the offer. Logged for both groups so
     the comparison is like for like. */
  function reachMoment(surface) {
    assignGroup();
    if (!st.reached) { st.reached = Date.now(); save(); }
    track('welcome_eligible', { surface: surface }, true);
    if (st.group === 'controle') {
      st.status = 'controle'; st.until = Date.now() + CONFIG.quietDays * DAY; save();
      return false;
    }
    return true;
  }

  var armedExit = false;
  function evaluate() {
    if (blocked() || !ready()) { if (teaserEl && blocked()) hideTeaser(); return; }
    if (touchLike()) {
      if (!teaserEl && !busy() && !rootEl) { if (reachMoment('teaser')) showTeaser(); }
      else if (teaserEl) teaserEl.classList.toggle('is-tucked', busy());
    } else {
      armedExit = true;
    }
  }
  document.addEventListener('mouseout', function (e) {
    if (!armedExit || e.relatedTarget || e.clientY > 0 || touchLike()) return;
    if (blocked() || busy() || rootEl) return;
    if (reachMoment('dialog')) openDialog('dialog');
  });

  /* ---------------- image ---------------- */
  var IMG = '/assets/welkom/welkom-acacia-';
  var V = (function () { var s = document.getElementById('hd-welcome-js'); var m = s && /\?v=([^&]+)/.exec(s.src); return m ? '?v=' + m[1] : ''; })();
  function pictureHTML() {
    return '<picture class="hdw-media">' +
      '<source media="(max-width: 899px)" srcset="' + IMG + 'mobiel-600.webp' + V + ' 600w, ' + IMG + 'mobiel-900.webp' + V + ' 900w" sizes="100vw" width="900" height="563">' +
      '<img src="' + IMG + '720.webp' + V + '" srcset="' + IMG + '480.webp' + V + ' 480w, ' + IMG + '720.webp' + V + ' 720w, ' + IMG + '960.webp' + V + ' 960w" sizes="300px" width="720" height="900" loading="lazy" decoding="async" alt="' + T().alt + '">' +
    '</picture>';
  }
  var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  /* ---------------- dialog / sheet ---------------- */
  var rootEl = null, opener = null, surfaceNow = 'dialog';
  function openDialog(surface) {
    if (rootEl) return;
    surfaceNow = surface;
    opener = document.activeElement;
    var t = T();
    rootEl = document.createElement('div');
    rootEl.className = 'hdw-root' + (surface === 'sheet' ? ' is-sheet' : '');
    rootEl.innerHTML =
      '<div class="hdw-scrim" data-hdw-close="backdrop"></div>' +
      '<div class="hdw-dialog" role="dialog" aria-modal="true" aria-labelledby="hdwKop" aria-describedby="hdwText">' +
        pictureHTML() +
        '<div class="hdw-body">' +
          '<button type="button" class="hdw-close" data-hdw-close="button" aria-label="' + t.close + '">' + X + '</button>' +
          '<div class="hdw-view" data-view="offer">' +
            '<h2 class="hdw-kop" id="hdwKop">' + t.kop + '</h2>' +
            '<p class="hdw-offer">' + t.offer + '</p>' +
            '<p class="hdw-text" id="hdwText">' + t.text + '</p>' +
            '<button type="button" class="hdw-cta" data-hdw-accept>' + t.cta + '</button>' +
            '<button type="button" class="hdw-later" data-hdw-close="later">' + t.later + '</button>' +
            '<p class="hdw-terms">' + t.terms + '</p>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(rootEl);
    document.documentElement.classList.add('hdw-open');
    lockScroll(true);
    requestAnimationFrame(function () {
      if (!rootEl) return;
      rootEl.classList.add('is-in');
      var cta = rootEl.querySelector('[data-hdw-accept]');
      if (cta) cta.focus({ preventScroll: true });
    });
    rootEl.addEventListener('click', onDialogClick);
    track('welcome_shown', { surface: surface });
  }
  function onDialogClick(e) {
    var c = e.target.closest('[data-hdw-close]');
    if (c) { closeDialog(c.getAttribute('data-hdw-close')); return; }
    if (e.target.closest('[data-hdw-accept]')) { accept(); return; }
    if (e.target.closest('[data-hdw-cart]')) { closeDialog('to-cart', true); if (window.HD_openCart) window.HD_openCart(); return; }
    if (e.target.closest('[data-hdw-done]')) { closeDialog('done', true); }
  }
  function closeDialog(method, afterAccept) {
    if (!rootEl) return;
    var el = rootEl; rootEl = null;
    if (!afterAccept && st.status !== 'accepted') {
      st.status = 'closed'; st.until = Date.now() + CONFIG.quietDays * DAY; save();
      track('welcome_closed', { surface: surfaceNow, method: method || 'button' });
      hideTeaser();
    }
    el.classList.remove('is-in');
    el.classList.add('is-out');
    document.documentElement.classList.remove('hdw-open');
    lockScroll(false);
    setTimeout(function () { el.remove(); }, reducedMotion() ? 0 : 260);
    if (opener && document.contains(opener) && opener.focus) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
    opener = null;
  }
  function accept() {
    write(CODE_KEY, { code: CONFIG.code, t: Date.now() });
    st.status = 'accepted'; st.until = Date.now() + CONFIG.quietDays * DAY; save();
    track('welcome_accepted', { surface: surfaceNow });
    hideTeaser();
    var t = T(), has = cartCount() > 0;
    var view = rootEl && rootEl.querySelector('.hdw-view');
    if (view) {
      view.setAttribute('data-view', 'ready');
      view.innerHTML =
        '<h2 class="hdw-kop" id="hdwKop" tabindex="-1">' + t.readyH + '</h2>' +
        '<p class="hdw-code" aria-label="' + t.rowLabel + ' ' + CONFIG.code + '"><span>' + CONFIG.code + '</span></p>' +
        '<p class="hdw-text" id="hdwText">' + (has ? t.readyP : t.readyEmpty) + '</p>' +
        '<p class="hdw-status" role="status" aria-live="polite"></p>' +
        (has ? '<button type="button" class="hdw-cta" data-hdw-cart>' + t.toCart + '</button>'
             : '<button type="button" class="hdw-cta" data-hdw-done>' + t.keepShopping + '</button>') +
        '<p class="hdw-terms">' + t.terms + '</p>';
      var h = view.querySelector('.hdw-kop'); if (h) h.focus({ preventScroll: true });
    }
    refreshCart();
  }
  document.addEventListener('keydown', function (e) {
    if (!rootEl) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDialog('escape', st.status === 'accepted'); return; }
    if (e.key !== 'Tab') return;
    var f = [].slice.call(rootEl.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !rootEl.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !rootEl.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
  /* Same iOS-safe lock the menu uses: fix the body and restore the scroll
     position, so the page behind cannot move while the offer is open. */
  var lockY = 0;
  function lockScroll(on) {
    var b = document.body;
    if (on) {
      lockY = window.scrollY || 0;
      b.style.position = 'fixed'; b.style.top = -lockY + 'px'; b.style.left = '0'; b.style.right = '0'; b.style.width = '100%';
    } else {
      b.style.position = ''; b.style.top = ''; b.style.left = ''; b.style.right = ''; b.style.width = '';
      try { window.scrollTo({ top: lockY, behavior: 'instant' }); } catch (e) { window.scrollTo(0, lockY); }
    }
  }

  /* ---------------- mobile teaser ---------------- */
  var teaserEl = null;
  function showTeaser() {
    if (teaserEl) return;
    var t = T();
    teaserEl = document.createElement('div');
    teaserEl.className = 'hdw-teaser';
    teaserEl.innerHTML =
      '<button type="button" class="hdw-teaser-open" aria-label="' + t.teaserOpen + '" aria-haspopup="dialog">' +
        '<span class="hdw-teaser-dot" aria-hidden="true"></span><span class="hdw-teaser-t">' + t.teaser + '</span>' +
      '</button>' +
      '<button type="button" class="hdw-teaser-x" aria-label="' + t.teaserClose + '">' + X + '</button>';
    document.body.appendChild(teaserEl);
    placeTeaser();
    requestAnimationFrame(function () { if (teaserEl) teaserEl.classList.add('is-in'); });
    teaserEl.addEventListener('click', function (e) {
      if (e.target.closest('.hdw-teaser-x')) {
        st.status = 'closed'; st.until = Date.now() + CONFIG.quietDays * DAY; save();
        track('welcome_closed', { surface: 'teaser', method: 'button' });
        hideTeaser(); return;
      }
      if (e.target.closest('.hdw-teaser-open')) openDialog('sheet');
    });
    track('welcome_shown', { surface: 'teaser' });
  }
  function hideTeaser() {
    if (!teaserEl) return;
    var el = teaserEl; teaserEl = null;
    el.classList.remove('is-in');
    setTimeout(function () { el.remove(); }, reducedMotion() ? 0 : 240);
  }
  /* Keep clear of other fixed bars at the bottom (sticky add-to-cart, chat):
     sit just above the highest one that is visible. */
  function placeTeaser() {
    if (!teaserEl) return;
    var lift = 0;
    var all = document.body.querySelectorAll('body > *, [class*="sticky"], [class*="float"]');
    for (var i = 0; i < all.length && i < 400; i++) {
      var el = all[i];
      if (el === teaserEl || el.contains(teaserEl) || el.classList.contains('hdw-root')) continue;
      var cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) continue;
      var r = el.getBoundingClientRect();
      if (r.height <= 0 || r.height > innerHeight * 0.5 || r.bottom < innerHeight - 4) continue;
      if (r.top < innerHeight * 0.5) continue;
      lift = Math.max(lift, innerHeight - r.top);
    }
    teaserEl.style.setProperty('--hdw-lift', Math.round(lift) + 'px');
  }
  var placeT = 0;
  window.addEventListener('scroll', function () { if (!teaserEl || placeT) return; placeT = setTimeout(function () { placeT = 0; placeTeaser(); }, 250); }, { passive: true });
  window.addEventListener('resize', function () { placeTeaser(); });

  /* ---------------- cart integration ----------------
     The cart stays local until checkout (HD_CART). With a stored code the
     drawer gets one row: the code, Shopify's verdict for this exact cart
     (via a throwaway preview cart) and a remove action. */
  function cartCount() { var c = window.HD_CART; return c && c.items ? c.items.reduce(function (a, i) { return a + (i.qty || 0); }, 0) : 0; }
  function country() { return (window.HD_SHIPPING && window.HD_SHIPPING.country()) || 'NL'; }
  function signature() {
    var c = window.HD_CART; if (!c || !c.items || !c.items.length) return '';
    return c.items.map(function (i) { return i.slug + ':' + (i.size || '') + ':' + i.qty; }).sort().join('|') + '#' + country() + '#' + storedCode();
  }
  /* Best price, not just "a discount" (01-11-2026). For the exact cart and
     country Shopify prices it twice, without and with the code; shipping is
     added from the same zones the cart shows (Shopify's free-shipping rate
     looks at the amount AFTER discounts). The code is only used when the
     total including shipping is strictly lower; otherwise it stays saved. */
  var cache = {};        // signature → decision object, or 'none' when Shopify gave no answer
  var pending = null, pendingSig = '', waiters = [];
  function shipFor(amount) {
    var z = (window.HD_SHIPPING && window.HD_SHIPPING.current()) || { rate: 5.95, free: 60 };
    return amount >= z.free - 1e-9 ? 0 : z.rate;
  }
  function round2(n) { return Math.round(n * 100) / 100; }
  function decide(base, withCode) {
    if (!base || !withCode) return 'none';
    var baseGoods = base.subtotal;                         // after ritual / 2-for savings
    var codeGoods = withCode.subtotal - withCode.amount;   // after the code (or Shopify's own pick)
    var baseTotal = round2(baseGoods + shipFor(baseGoods));
    var codeTotal = round2(codeGoods + shipFor(codeGoods));
    var d = { applicable: withCode.applicable, amount: withCode.amount, baseTotal: baseTotal, codeTotal: codeTotal,
              automatic: round2(base.ritual), beneficial: withCode.applicable && withCode.amount > 0 && codeTotal < baseTotal };
    // Shopify drops the ritual / 2-for saving when the code is the better pick.
    d.dropsAutomatic = d.beneficial && base.ritual > 0 && !(withCode.ritual > 0);
    d.reason = d.beneficial ? 'better'
      : !withCode.applicable ? (base.ritual > 0 ? 'automatic_better' : 'not_applicable')
      : 'shipping';                                        // applicable, but the total would go up (or stay equal)
    return d;
  }
  function verdict() {
    var sig = signature();
    if (!sig || !storedCode()) return null;
    return cache[sig] || null;
  }
  function cartDiscount() {
    var v = verdict();
    return (v && v !== 'none' && v.beneficial) ? v.amount : 0;
  }
  function schedulePreview(now) {
    var sig = signature();
    if (!sig || cache[sig] || pendingSig === sig) return;
    clearTimeout(pending); pendingSig = sig;
    pending = setTimeout(function () {
      var code = storedCode();
      function done(res) {
        if (signature() !== sig) { pendingSig = ''; return; }
        cache[sig] = res; pendingSig = '';
        if (res !== 'none') {
          if (res.beneficial) track('welcome_code_confirmed', { context: 'cart' }, true);
          else if (res.reason === 'shipping') track('welcome_code_held', { context: 'cart', reason: 'shipping' }, true);
          else track('welcome_code_rejected', { context: 'cart', reason: res.reason === 'automatic_better' ? 'ritual_better' : 'not_applicable' }, true);
        }
        waiters.splice(0).forEach(function (w) { w(); });
        try { if (window.HD_renderCart) window.HD_renderCart(); } catch (e) {}   // totals pick up cartDiscount()
        safe(paint);
      }
      if (!code || !window.HD_previewDiscount) { done('none'); return; }
      Promise.all([window.HD_previewDiscount(''), window.HD_previewDiscount(code)])
        .then(function (r) { done(decide(r[0], r[1])); }, function () { done('none'); });
    }, now ? 0 : 500);
  }
  /* Without Shopify's answer (offline, slow): estimate locally with the same
     rules, so a code that would cost the customer money is never sent. */
  function localDecision() {
    var c = window.HD_CART; if (!c || !c.items || !c.items.length) return null;
    var sub = c.total();
    var payable = typeof window.HD_CART_PAYABLE === 'number' ? window.HD_CART_PAYABLE : sub;
    var auto = round2(sub - payable);
    var amount = round2(sub * CONFIG.percent / 100);
    return decide({ subtotal: payable, ritual: auto }, { subtotal: sub, amount: amount > auto ? amount : 0, applicable: amount > auto, ritual: 0 });
  }
  function decisionForCheckout() {
    var v = verdict();
    if (v && v !== 'none') return Promise.resolve(v);
    return new Promise(function (resolve) {
      var t = setTimeout(function () { resolve(localDecision()); }, 5000);
      waiters.push(function () { clearTimeout(t); var x = verdict(); resolve(x && x !== 'none' ? x : localDecision()); });
      schedulePreview(true);
      if (!pendingSig && verdict() === 'none') { clearTimeout(t); resolve(localDecision()); }
    });
  }
  function rowStatus() {
    var t = T(), v = verdict();
    if (!v) return { cls: 'is-checking', text: t.checking };
    if (v === 'none') return { cls: 'is-ready', text: t.ready };
    if (v.beneficial) return { cls: 'is-applied', text: t.applied(v.amount) };
    if (v.reason === 'shipping') return { cls: 'is-held', text: t.held(v.baseTotal, v.codeTotal) };
    if (v.reason === 'automatic_better') return { cls: 'is-ritual', text: t.ritual };
    return { cls: 'is-rejected', text: t.rejected };
  }
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  var TAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>';
  function paint() {
    var drawer = document.getElementById('cartDrawer');
    var main = drawer && drawer.querySelector('.cart-main');
    var host = main || (drawer && drawer.querySelector('.cart-panel'));
    var row = document.getElementById('hdWelcomeRow');
    var code = storedCode();
    if (!host || !code || !cartCount()) { if (row) row.remove(); return; }
    var t = T(), s = rowStatus();
    if (!row) {
      row = document.createElement('div'); row.id = 'hdWelcomeRow';
      row.addEventListener('click', function (e) { if (e.target.closest('[data-hdw-remove]')) removeCode(); });
    }
    // Directly under the ritual saving, so both discounts read together.
    var offer = document.getElementById('cartOffer');
    if (offer && offer.parentNode === host) { if (offer.nextSibling !== row) host.insertBefore(row, offer.nextSibling); }
    else if (row.parentNode !== host) {
      var cont = host.querySelector('.cart-continue-link');
      host.insertBefore(row, cont && cont.parentNode === host ? cont : null);
    }
    var html =
      '<div class="hdw-row-head">' +
        '<span class="hdw-row-mark" aria-hidden="true">' + (s.cls === 'is-applied' ? CHECK : TAG) + '</span>' +
        '<span class="hdw-row-label">' + t.rowLabel + ' <span class="hdw-row-code">' + code + '</span></span>' +
        (s.cls === 'is-applied' ? '<span class="hdw-row-val">−' + money(verdict().amount) + '</span>' : '') +
      '</div>' +
      '<p class="hdw-row-msg" role="status" aria-live="polite">' + s.text + '</p>' +
      '<button type="button" class="hdw-row-remove" data-hdw-remove aria-label="' + t.removeAria + '">' + t.remove + '</button>';
    if (row.getAttribute('data-html') !== html) { row.innerHTML = html; row.setAttribute('data-html', html); }
    row.className = 'hdw-cart ' + s.cls;
    // The dialog's confirmation view mirrors the same verdict.
    var ds = rootEl && rootEl.querySelector('.hdw-status');
    if (ds && ds.textContent !== (s.cls === 'is-checking' ? '' : s.text)) ds.textContent = s.cls === 'is-checking' ? '' : s.text;
  }
  function removeCode() {
    write(CODE_KEY, null);
    track('welcome_code_removed', {});
    if (window.HD_toast) window.HD_toast(T().removed);
    if (window.HD_renderCart) window.HD_renderCart();
    paint();
    var btn = document.querySelector('#cartDrawer .cart-checkout'); if (btn) try { btn.focus({ preventScroll: true }); } catch (e) {}
  }
  function refreshCart() {
    if (storedCode() && cartCount()) schedulePreview();
    paint();
  }
  /* ---------------- public API (commerce/commerce.js, shared.js) ---------------- */
  window.HD_WELCOME = {
    config: CONFIG,
    cartDiscount: cartDiscount,
    /* true when the code replaces the ritual / 2-for saving in Shopify, so the
       cart must show those lines at their normal price, as Shopify does. */
    dropsAutomatic: function () { var v = verdict(); return !!(v && v !== 'none' && v.dropsAutomatic); },
    /* What checkout() passes to Shopify's cartCreate. */
    forCheckout: function () {
      var code = storedCode();
      var use = CONFIG.enabled && code ? decisionForCheckout() : Promise.resolve(null);
      return use.then(function (d) {
        var out = {};
        var send = !!(d && d !== 'none' && d.beneficial);
        if (send) out.codes = [code];
        else if (code && d && d.reason === 'shipping') track('welcome_code_held', { context: 'checkout', reason: 'shipping' }, true);
        if (st.group) {
          /* _hd_welkom_meting: did this browser allow analytics? Only those
             orders can be set against the GA4 visitor counts per group, so
             numerator and denominator cover the same people. */
          var c = (window.HD_cookies && window.HD_cookies.get && window.HD_cookies.get()) || null;
          out.attributes = [
            { key: '_hd_welkom_groep', value: st.group },
            { key: '_hd_welkom_code', value: send ? 'ja' : 'nee' },
            { key: '_hd_welkom_meting', value: c && c.analytics ? 'ja' : 'nee' }
          ];
        }
        return out;
      });
    },
    /* Shopify's verdict on the real checkout cart. */
    onCheckout: function (codes) {
      var c = storedCode(); if (!c) return;
      var hit = (codes || []).filter(function (d) { return String(d.code).toUpperCase() === c.toUpperCase(); })[0];
      if (hit && hit.applicable) track('welcome_code_confirmed', { context: 'checkout' }, true);
      else track('welcome_code_rejected', { context: 'checkout', reason: 'not_applicable' }, true);
    },
    /* For tests and the owner: state and a reset. */
    state: function () { return { group: st.group || null, visibleMs: st.visibleMs || 0, productSeen: !!st.productSeen, status: st.status || null, until: st.until || null, code: storedCode(), ready: ready(), blocked: blocked(), busy: busy() }; },
    reset: function () { st = {}; save(); write(CODE_KEY, null); hideTeaser(); if (rootEl) closeDialog('reset', true); }
  };
  /* Start the cart watcher only once the API above exists, and never let a
     drawer hiccup stop the rest of the page. */
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.warn('[welcome]', e); } }
  function watchDrawer() {
    var items = document.getElementById('cartItems');
    if (!items || items._hdw) return !!items;
    items._hdw = true;
    new MutationObserver(function () { safe(refreshCart); }).observe(items, { childList: true });
    safe(refreshCart);
    return true;
  }
  if (!watchDrawer()) { var tries = 0, iv = setInterval(function () { if (watchDrawer() || ++tries > 50) clearInterval(iv); }, 200); }
  ['hd:cart-changed', 'hd:country', 'hd:lang', 'hd:cart-open'].forEach(function (ev) { var f = function () { safe(refreshCart); }; window.addEventListener(ev, f); document.addEventListener(ev, f); });
  window.addEventListener('hd:order-placed', function () { hideTeaser(); });

})();
