/* =============================================================
   Harvest Deli — SANITY content provider (live HTTP API)
   No SDK, no build step: plain fetch + GROQ against the Sanity
   query endpoint. Projects documents into the SAME runtime shape
   as cms/mock-content.js so the frontend is source-agnostic.

   Activated by cms/config.js when source === 'sanity'
   (e.g. journal.html?cms=sanity, once projectId is filled in).
   ============================================================= */
(function () {
  'use strict';
  window.HD_CMS = window.HD_CMS || {};

  function cfg() {
    return (HD_CMS.config && HD_CMS.config.sanity) || {};
  }

  /* ---- query endpoint (apicdn for published/cached, api for fresh) ---- */
  function endpoint(groq, params) {
    var c = cfg();
    var host = (c.useCdn ? 'apicdn' : 'api') + '.sanity.io';
    var base =
      'https://' + c.projectId + '.' + host + '/v' + (c.apiVersion || '2024-01-01') +
      '/data/query/' + (c.dataset || 'production');
    var qs = '?query=' + encodeURIComponent(groq);
    if (params) {
      Object.keys(params).forEach(function (k) {
        qs += '&' + encodeURIComponent('$' + k) + '=' + encodeURIComponent(JSON.stringify(params[k]));
      });
    }
    return base + qs;
  }

  function query(groq, params) {
    var c = cfg();
    if (!c.projectId || c.projectId === 'REPLACE_WITH_PROJECT_ID') {
      return Promise.reject(new Error('[HD_CMS] Sanity projectId not configured in cms/config.js'));
    }
    return fetch(endpoint(groq, params), { headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('[HD_CMS] Sanity HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) { return json.result; });
  }

  /* ---- image URL builder (no @sanity/image-url dependency) ----
     Turns a Sanity image ref (image-<id>-<w>x<h>-<fmt>) into a CDN url. */
  function imageUrl(img, opts) {
    if (!img) return null;
    if (typeof img === 'string') return img; // already a url
    var ref = img.asset && img.asset._ref ? img.asset._ref : img._ref;
    if (img.asset && img.asset.url) return img.asset.url; // already resolved
    if (!ref) return null;
    var c = cfg();
    var parts = ref.split('-'); // ['image', id, '1200x800', 'jpg']
    if (parts.length < 4) return null;
    var id = parts[1];
    var dims = parts[2];
    var fmt = parts[3];
    var url =
      'https://cdn.sanity.io/images/' + c.projectId + '/' + (c.dataset || 'production') +
      '/' + id + '-' + dims + '.' + fmt;
    if (opts && opts.width) url += '?w=' + opts.width + '&auto=format&fit=max';
    return url;
  }
  HD_CMS.imageUrl = imageUrl;

  /* ---- shared GROQ projection → the runtime post shape ---- */
  var POST_PROJECTION =
    '{' +
    '"id": _id, "type": _type, title, "slug": slug.current, excerpt, language,' +
    'body,' +
    '"image": { "url": mainImage.asset->url, "alt": mainImage.alt, "caption": mainImage.caption },' +
    '"category": category->{ title, "slug": slug.current, tone },' +
    '"author": author->{ name, "slug": slug.current, role, "image": { "url": image.asset->url } },' +
    '"publishedAt": publishedAt,' +
    'readingTime, status, featured,' +
    '"seo": { "title": seoTitle, "description": coalesce(seoDescription, excerpt), "ogImage": coalesce(ogImage.asset->url, mainImage.asset->url) }' +
    '}';

  function decorate(p) {
    if (!p) return p;
    // publishedLabel + href are derived client-side to match the mock shape
    p.publishedLabel = p.publishedAt
      ? new Date(p.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    p.href = 'article-' + p.slug + '.html';
    return p;
  }

  HD_CMS.sanity = {
    getPosts: function (opts) {
      opts = opts || {};
      var filters = ['_type == "post"'];
      if (opts.status) filters.push('status == $status');
      if (opts.category) filters.push('category->slug.current == $category');
      if (opts.language) filters.push('language == $language');
      var groq =
        '*[' + filters.join(' && ') + '] | order(publishedAt desc)' +
        (typeof opts.limit === 'number' ? '[0...' + opts.limit + ']' : '') +
        ' ' + POST_PROJECTION;
      var params = {};
      if (opts.status) params.status = opts.status;
      if (opts.category) params.category = opts.category;
      if (opts.language) params.language = opts.language;
      return query(groq, params).then(function (rows) {
        return (rows || []).map(decorate);
      });
    },
    getPost: function (slug) {
      var groq = '*[_type == "post" && slug.current == $slug][0] ' + POST_PROJECTION;
      return query(groq, { slug: slug }).then(decorate);
    },
    getCategories: function () {
      return query('*[_type == "category"]{ title, "slug": slug.current, tone, description }');
    },
    getAuthors: function () {
      return query('*[_type == "author"]{ name, "slug": slug.current, role, bio, "image": { "url": image.asset->url } }');
    },
    getHomeSections: function () {
      return query(
        '*[_type == "homeSection"] | order(order asc){ key, order, eyebrow, title, body, ' +
        '"image": { "url": image.asset->url, "alt": image.alt }, cta, enabled }'
      );
    },
    getAboutStory: function () {
      return query(
        '*[_type == "aboutStory"][0]{ eyebrow, heroTitle, heroIntro, ' +
        '"heroImage": { "url": heroImage.asset->url, "alt": heroImage.alt }, ' +
        'chapters[]{ eyebrow, title, body, "image": { "url": image.asset->url, "alt": image.alt } }, ' +
        'pullQuote, "seo": { "title": seo.title, "description": seo.description, "ogImage": seo.ogImage.asset->url } }'
      );
    },
  };
})();
