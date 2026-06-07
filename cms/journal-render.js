/* =============================================================
   Harvest Deli — Journal renderer (DORMANT by default)
   Renders journal.html's featured + archive lists from the CMS,
   reproducing the EXISTING card markup/classes (.jr-feat / .jr-post)
   so there is no redesign. Does nothing unless HD_CMS.config.render
   is true (set via ?cms=1 / ?cms=sanity, or flipped in cms/config.js).
   The static HTML remains the default, untouched experience.
   ============================================================= */
(function () {
  'use strict';
  if (!window.HD_CMS || !HD_CMS.config || !HD_CMS.config.render) return; // safe no-op

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function media(cls, post) {
    var url = post.image && post.image.url;
    var tone = (post.category && post.category.tone) || 'honey';
    if (url) {
      return '<span class="' + cls + '" aria-hidden="true" style="background-image:url(\'' +
        esc(url) + "');background-size:cover;background-position:center\"></span>";
    }
    return '<span class="' + cls + ' tone-' + esc(tone) + '" aria-hidden="true"></span>';
  }

  function featuredHTML(p) {
    var cat = (p.category && p.category.title) || '';
    var meta = [cat, p.publishedLabel, p.readingTime].filter(Boolean)
      .map(function (x) { return '<span>' + esc(x) + '</span>'; })
      .join('<span class="dot"></span>');
    return (
      '<a class="jr-feat reveal" href="' + esc(p.href) + '" aria-label="Read: ' + esc(p.title) + '">' +
        '<div class="jr-feat__media">' + media('jr-feat__img', p) +
          (p.image && p.image.caption ? '<span class="jr-feat__cap">' + esc(p.image.caption) + '</span>' : '') +
        '</div>' +
        '<div class="jr-feat__text">' +
          '<span class="jr-feat__badge">Featured</span>' +
          '<div class="jr-feat__meta">' + meta + '</div>' +
          '<h2 class="jr-feat__title">' + esc(p.title) + '</h2>' +
          '<p class="jr-feat__excerpt">' + esc(p.excerpt) + '</p>' +
          '<span class="jr-readlink">Read the essay <span class="arrow" aria-hidden="true"></span></span>' +
        '</div>' +
      '</a>'
    );
  }

  function postHTML(p) {
    var upcoming = p.status === 'upcoming';
    var cat = (p.category && p.category.title) || '';
    var metaLine = upcoming
      ? esc(p.publishedLabel)
      : [p.publishedLabel, p.readingTime].filter(Boolean).map(esc).join(' · ');
    var inner =
      '<div class="jr-post__media">' + media('jr-post__img', p) + '</div>' +
      '<div class="jr-post__cat">' + esc(cat) + '</div>' +
      '<h3 class="jr-post__title">' + esc(p.title) + '</h3>' +
      '<p class="jr-post__excerpt">' + esc(p.excerpt) + '</p>' +
      '<div class="jr-post__meta">' + metaLine + '</div>';
    if (upcoming) return '<article class="jr-post is-upcoming reveal">' + inner + '</article>';
    return '<a class="jr-post reveal" href="' + esc(p.href) + '">' + inner + '</a>';
  }

  function reveal(scope) {
    var els = (scope || document).querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  function run() {
    HD_CMS.getPosts().then(function (posts) {
      posts = posts || [];
      var featured = posts.filter(function (p) { return p.featured && p.status === 'published'; })[0]
        || posts.filter(function (p) { return p.status === 'published'; })[0] || null;

      var featWrap = document.querySelector('.jr-featured');
      if (featWrap && featured) featWrap.innerHTML = featuredHTML(featured);

      var list = document.querySelector('.jr-list');
      if (list) {
        var rest = posts.filter(function (p) { return !featured || p.id !== featured.id; });
        list.innerHTML = rest.map(postHTML).join('');
      }

      document.documentElement.setAttribute('data-cms-source', HD_CMS.config.source);
      reveal(document);
      if (window.console) console.info('[HD_CMS] journal rendered from "' + HD_CMS.config.source + '" (' + posts.length + ' posts)');
    }).catch(function (err) {
      if (window.console) console.error('[HD_CMS] journal render failed:', err);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
