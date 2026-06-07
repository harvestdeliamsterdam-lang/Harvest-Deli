/* =============================================================
   Harvest Deli — CMS facade
   One stable API the frontend calls, regardless of source. Reads
   HD_CMS.config.source to pick the mock or sanity provider.

     HD_CMS.getPosts({status,category,limit}) -> Promise<post[]>
     HD_CMS.getPost(slug)                     -> Promise<post|null>
     HD_CMS.getCategories()                   -> Promise<category[]>
     HD_CMS.getAuthors()                      -> Promise<author[]>
     HD_CMS.getHomeSections()                 -> Promise<section[]>
     HD_CMS.getAboutStory()                   -> Promise<story>
     HD_CMS.toHtml(portableText)              -> string (safe-ish HTML)

   Load order in HTML:
     cms/config.js → cms/mock-content.js → cms/sanity.js → cms/index.js
   ============================================================= */
(function () {
  'use strict';
  window.HD_CMS = window.HD_CMS || {};

  function provider() {
    var src = (HD_CMS.config && HD_CMS.config.source) || 'mock';
    if (src === 'sanity' && HD_CMS.sanity) return HD_CMS.sanity;
    return HD_CMS.mock; // safe default
  }

  // If sanity is selected but fails (not configured / offline), fall back to mock
  // so a page wired to the CMS never ends up empty.
  function withFallback(method, args) {
    var p = provider();
    var fn = p[method];
    var call = fn ? fn.apply(p, args) : Promise.reject(new Error('no provider'));
    return call.catch(function (err) {
      if (p !== HD_CMS.mock && HD_CMS.mock && HD_CMS.mock[method]) {
        if (window.console) console.warn('[HD_CMS] ' + method + ' fell back to mock:', err && err.message);
        return HD_CMS.mock[method].apply(HD_CMS.mock, args);
      }
      throw err;
    });
  }

  ['getPosts', 'getPost', 'getCategories', 'getAuthors', 'getHomeSections', 'getAboutStory'].forEach(function (m) {
    HD_CMS[m] = function () { return withFallback(m, Array.prototype.slice.call(arguments)); };
  });

  /* ---- Minimal Portable Text → HTML (covers the styles our schema uses) ---- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function spans(children) {
    return (children || []).map(function (c) {
      var t = esc(c.text);
      var marks = c.marks || [];
      if (marks.indexOf('strong') > -1) t = '<strong>' + t + '</strong>';
      if (marks.indexOf('em') > -1) t = '<em>' + t + '</em>';
      return t;
    }).join('');
  }
  HD_CMS.toHtml = function (blocks) {
    if (!Array.isArray(blocks)) return '';
    var html = '';
    blocks.forEach(function (b) {
      if (!b || b._type !== 'block') {
        if (b && b._type === 'image' && b.asset) {
          var u = HD_CMS.imageUrl ? HD_CMS.imageUrl(b, { width: 1400 }) : (b.asset.url || '');
          html += '<figure><img loading="lazy" src="' + esc(u) + '" alt="' + esc(b.alt || '') + '">' +
            (b.caption ? '<figcaption>' + esc(b.caption) + '</figcaption>' : '') + '</figure>';
        }
        return;
      }
      var inner = spans(b.children);
      switch (b.style) {
        case 'h2': html += '<h2>' + inner + '</h2>'; break;
        case 'h3': html += '<h3>' + inner + '</h3>'; break;
        case 'lede': html += '<p class="lede">' + inner + '</p>'; break;
        case 'blockquote': html += '<blockquote>' + inner + '</blockquote>'; break;
        default: html += '<p>' + inner + '</p>';
      }
    });
    return html;
  };
})();
