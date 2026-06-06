/* =================================================================
   Harvest Deli — SEO foundation (additive, non-breaking)
   -----------------------------------------------------------------
   Runs site-wide (loaded by shared.js). It only ADDS tags that are
   missing — never duplicates ones a page already hand-authored:
     • <link rel="canonical">         (if absent)
     • Open Graph + Twitter card      (if the page has none)
     • Organization + WebSite JSON-LD (if no Organization schema yet)
   Also exposes window.HD_SEO for dynamic pages (product/collection):
     HD_SEO.set({title,description,canonical,image})
     HD_SEO.injectJSONLD(obj, id)   // id-guarded → no duplicates
   No framework, no build, no console noise.
   ================================================================= */
(function () {
  'use strict';
  var BASE = 'https://harvestdeli.gr';                 // SEAM: production origin
  var DEFAULT_OG_IMAGE = BASE + '/harvestdeli.png';    // existing premium brand image
  var head = document.head;

  function canonicalPath() {
    var p = location.pathname || '/';
    if (/\/index\.html$/.test(p)) p = p.replace(/index\.html$/, '');
    return BASE + p; // query intentionally dropped
  }
  function metaDesc() {
    var m = head.querySelector('meta[name="description"]');
    return m ? m.getAttribute('content') : '';
  }
  function isNoindex() {
    var r = head.querySelector('meta[name="robots"]');
    return !!(r && /noindex/i.test(r.getAttribute('content') || ''));
  }
  function setMetaProp(prop, content) {
    if (!content) return;
    if (head.querySelector('meta[property="' + prop + '"]')) return;
    var m = document.createElement('meta'); m.setAttribute('property', prop); m.setAttribute('content', content); head.appendChild(m);
  }
  function setMetaName(name, content) {
    if (!content) return;
    if (head.querySelector('meta[name="' + name + '"]')) return;
    var m = document.createElement('meta'); m.setAttribute('name', name); m.setAttribute('content', content); head.appendChild(m);
  }

  /* ---- canonical (if absent) ---- */
  function ensureCanonical() {
    if (head.querySelector('link[rel="canonical"]')) return;
    var l = document.createElement('link'); l.setAttribute('rel', 'canonical'); l.setAttribute('href', canonicalPath()); head.appendChild(l);
  }

  /* ---- Open Graph + Twitter (only if the page has NO OG yet) ---- */
  function ensureSocial() {
    var hasOG = !!head.querySelector('meta[property^="og:"]');
    var hasTw = !!head.querySelector('meta[name^="twitter:"]');
    var title = (document.title || 'Harvest Deli');
    var desc = metaDesc() || 'Premium Greek honey, olive oil and mountain tea — unpasteurised, sealed by hand, shipped from Greece.';
    var canon = (head.querySelector('link[rel="canonical"]') || {}).href || canonicalPath();
    var isProduct = !!document.querySelector('meta[name="hd-product-slug"]');
    if (!hasOG) {
      setMetaProp('og:type', isProduct ? 'product' : 'website');
      setMetaProp('og:site_name', 'Harvest Deli');
      setMetaProp('og:title', title);
      setMetaProp('og:description', desc);
      setMetaProp('og:url', canon);
      setMetaProp('og:image', DEFAULT_OG_IMAGE);
      setMetaProp('og:locale', (document.documentElement.lang === 'nl' ? 'nl_NL' : document.documentElement.lang === 'el' ? 'el_GR' : 'en_GB'));
    }
    if (!hasTw) {
      setMetaName('twitter:card', 'summary_large_image');
      setMetaName('twitter:title', title);
      setMetaName('twitter:description', desc);
      setMetaName('twitter:image', DEFAULT_OG_IMAGE);
    }
  }

  /* ---- Organization + WebSite JSON-LD (only if no Organization yet) ---- */
  function hasSchemaType(type) {
    var scripts = head.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < scripts.length; i++) {
      if ((scripts[i].textContent || '').indexOf('"' + type + '"') > -1) return true;
    }
    // also check body (some pages put JSON-LD in body)
    var b = document.querySelectorAll('script[type="application/ld+json"]');
    for (var j = 0; j < b.length; j++) { if ((b[j].textContent || '').indexOf('"' + type + '"') > -1) return true; }
    return false;
  }
  function injectJSONLD(obj, id) {
    if (id && document.getElementById(id)) return;
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    if (id) s.id = id;
    s.textContent = JSON.stringify(obj);
    head.appendChild(s);
  }
  function ensureOrgWebsite() {
    if (isNoindex()) return;            // don't bother on private/utility pages
    if (hasSchemaType('Organization')) return;  // index / product / find-us already have it
    injectJSONLD({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Harvest Deli',
      url: BASE + '/',
      logo: BASE + '/favicon.svg',
      description: 'Premium Greek honey, olive oil and mountain tea.',
      sameAs: [
        // SEAM: real social profiles when available
        'https://www.instagram.com/harvestdeli'
      ]
    }, 'ld-organization');
    if (!hasSchemaType('WebSite')) {
      injectJSONLD({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Harvest Deli',
        url: BASE + '/',
        potentialAction: {
          '@type': 'SearchAction',
          target: BASE + '/shop.html?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      }, 'ld-website');
    }
  }

  /* ---- public API for dynamic pages ---- */
  window.HD_SEO = {
    set: function (o) {
      o = o || {};
      if (o.title) document.title = o.title;
      if (o.description) { var m = head.querySelector('meta[name="description"]'); if (m) m.setAttribute('content', o.description); else setMetaName('description', o.description); }
      if (o.canonical) { var c = head.querySelector('link[rel="canonical"]'); if (c) c.setAttribute('href', o.canonical); }
      if (o.image) { var i = head.querySelector('meta[property="og:image"]'); if (i) i.setAttribute('content', o.image); }
    },
    injectJSONLD: injectJSONLD,
    hasSchemaType: hasSchemaType,
    BASE: BASE
  };

  function init() { ensureCanonical(); ensureSocial(); ensureOrgWebsite(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
