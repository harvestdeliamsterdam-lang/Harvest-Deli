/* =============================================================
   Harvest Deli — CMS config (single switch point)
   Plain browser global (no build step). Loaded before the other
   cms/* scripts. Decoupled from commerce (Shopify untouched).
   ============================================================= */
(function () {
  'use strict';
  window.HD_CMS = window.HD_CMS || {};

  HD_CMS.config = {
    /* Where content comes from when something renders:
       'mock'   → cms/mock-content.js  (default, ships safely with the static site)
       'sanity' → cms/sanity.js        (live Sanity HTTP API)            */
    source: 'mock',

    /* Whether the CMS is allowed to take over and render into the page.
       FALSE by default → the existing static HTML is left completely intact.
       Flipped to true only via the ?cms= URL flag below (safe preview), or
       set it to true here once you're ready to render from the CMS for real. */
    render: false,

    sanity: {
      projectId: 'REPLACE_WITH_PROJECT_ID', // from sanity.io/manage
      dataset: 'production',
      apiVersion: '2024-01-01',
      useCdn: true, // published content via apicdn.sanity.io (fast, cached)
    },
  };

  /* Safe preview / opt-in via URL, without editing this file:
       journal.html?cms=1        → render using mock content
       journal.html?cms=mock     → render using mock content
       journal.html?cms=sanity   → render using the live Sanity API
       journal.html?cms=off      → force the static page (no render)        */
  try {
    var q = new URLSearchParams(location.search).get('cms');
    if (q != null) {
      if (q === 'off') {
        HD_CMS.config.render = false;
      } else {
        HD_CMS.config.render = true;
        if (q === 'sanity' || q === 'mock') HD_CMS.config.source = q;
      }
    }
  } catch (e) {}
})();
