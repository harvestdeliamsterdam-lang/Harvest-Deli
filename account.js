/* =================================================================
   Harvest Deli, Account module (vanilla, no build step)
   -----------------------------------------------------------------
   Provides a clearly-labelled LOCAL DEMO SESSION so the account UI is
   fully navigable without a backend. It does NOT perform real
   authentication: there is no password verification and passwords are
   never stored. Every integration point is marked `// SEAM: Supabase`.

   To wire real auth later, replace the bodies of register/signIn/
   signOut/current with Supabase Auth calls and keep the same shapes.
   ================================================================= */

/* @typedef {{ firstName:string, lastName:string, email:string,
 *   phone?:string, addresses:Array<Object>, createdAt:string, demo:true }} CustomerAccount */

(function () {
  'use strict';

  var SESSION_KEY = 'hd-account-v1';   // current demo session
  var ORDERS_KEY = 'hd-orders-v1';     // shared with checkout.js

  function read(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

  /** @returns {CustomerAccount|null} */
  function current() { return read(SESSION_KEY, null); }

  /** Start a demo session. SEAM: Supabase signUp(email, password) → session. */
  function register(profile) {
    var acc = {
      firstName: profile.firstName || '', lastName: profile.lastName || '',
      email: (profile.email || '').toLowerCase(), phone: profile.phone || '',
      addresses: [], createdAt: new Date().toISOString(), demo: true
    };
    write(SESSION_KEY, acc);
    return acc;
  }

  /** Start a demo session from an email (no password check, demo only).
   *  SEAM: Supabase signInWithPassword(email, password). */
  function signIn(email) {
    var existing = current();
    var acc = (existing && existing.email === (email || '').toLowerCase()) ? existing : {
      firstName: existing ? existing.firstName : '', lastName: existing ? existing.lastName : '',
      email: (email || '').toLowerCase(), phone: '', addresses: existing ? existing.addresses : [],
      createdAt: new Date().toISOString(), demo: true
    };
    write(SESSION_KEY, acc);
    return acc;
  }

  /** SEAM: Supabase signOut(). */
  function signOut() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }

  function update(patch) {
    var acc = current(); if (!acc) return null;
    acc = Object.assign(acc, patch); write(SESSION_KEY, acc); return acc;
  }

  /* ---- saved addresses (on the session profile) ---- */
  function addresses() { var a = current(); return a ? (a.addresses || []) : []; }
  function saveAddress(addr) {
    var acc = current(); if (!acc) return;
    acc.addresses = acc.addresses || [];
    // de-dupe by line1+postcode
    var key = (addr.line1 || '') + '|' + (addr.postcode || '');
    acc.addresses = acc.addresses.filter(function (a) { return ((a.line1 || '') + '|' + (a.postcode || '')) !== key; });
    acc.addresses.unshift(addr);
    write(SESSION_KEY, acc);
  }
  function removeAddress(index) {
    var acc = current(); if (!acc || !acc.addresses) return;
    acc.addresses.splice(index, 1); write(SESSION_KEY, acc);
  }

  /* ---- orders ---- */
  function orders() { return read(ORDERS_KEY, []); }

  /** Redirect guests to login, preserving where they were headed. */
  function requireAuth() {
    if (!current()) {
      var next = encodeURIComponent(location.pathname.split('/').pop() || 'account.html');
      location.href = 'login.html?next=' + next;
      return false;
    }
    return true;
  }

  window.HD_account = {
    current: current, register: register, signIn: signIn, signOut: signOut,
    update: update, addresses: addresses, saveAddress: saveAddress,
    removeAddress: removeAddress, orders: orders, requireAuth: requireAuth
  };

  /* -------- tiny shared validator for the auth/account forms -------- */
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function setErr(input, msg) {
    if (!input) return;
    var field = input.closest('.field') || input.parentElement;
    var ex = field.querySelector('.hd-field-error');
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (!ex) { ex = document.createElement('p'); ex.className = 'hd-field-error'; ex.setAttribute('role', 'alert'); field.appendChild(ex); }
      ex.textContent = msg;
    } else { input.removeAttribute('aria-invalid'); if (ex) ex.remove(); }
  }
  /** rules: [{el, required, type:'email'|'password'|'match', match:el}] → first invalid or null */
  window.HD_validate = function (rules) {
    var firstBad = null;
    rules.forEach(function (r) {
      var v = (r.el && r.el.value || '').trim(), msg = '';
      if (r.required && !v) msg = 'Required';
      else if (v && r.type === 'email' && !isEmail(v)) msg = 'Enter a valid email';
      else if (v && r.type === 'password' && v.length < 8) msg = 'At least 8 characters';
      else if (r.type === 'match' && r.match && r.el.value !== r.match.value) msg = 'Passwords do not match';
      setErr(r.el, msg);
      if (msg && !firstBad) firstBad = r.el;
    });
    if (firstBad) { try { firstBad.focus(); } catch (e) {} }
    return firstBad;
  };

  /* -------- shared account-page chrome: menu + logout + active nav -------- */
  function initChrome() {
    // menu overlay open/close (same pattern as other pages)
    var menuBtn = document.getElementById('menuBtn'), ov = document.getElementById('menuOverlay'), mc = document.getElementById('menuClose');
    if (menuBtn && ov) {
      menuBtn.addEventListener('click', function () { ov.classList.add('open'); document.body.style.overflow = 'hidden'; });
      if (mc) mc.addEventListener('click', function () { ov.classList.remove('open'); document.body.style.overflow = ''; });
      ov.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { ov.classList.remove('open'); document.body.style.overflow = ''; }); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { ov.classList.remove('open'); document.body.style.overflow = ''; } });
    }
    // logout buttons
    document.querySelectorAll('[data-logout]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); signOut(); location.href = 'login.html'; });
    });
    // highlight current account-nav link
    var here = (location.pathname.split('/').pop() || '').toLowerCase();
    document.querySelectorAll('.acct-nav a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').toLowerCase();
      if (href === here) { a.classList.add('active'); a.setAttribute('aria-current', 'page'); }
    });
    // greet the user where requested
    var acc = current();
    document.querySelectorAll('[data-acct-name]').forEach(function (el) { el.textContent = acc ? (acc.firstName || acc.email) : ''; });
    document.querySelectorAll('[data-acct-email]').forEach(function (el) { el.textContent = acc ? acc.email : ''; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initChrome);
  else initChrome();
})();
