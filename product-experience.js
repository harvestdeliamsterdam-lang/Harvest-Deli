/* =================================================================
   Harvest Deli, product experience behaviour.
   Loaded only on pages with <html data-hd-experience> (written by
   scripts/build-product-pages.mjs). Styles: product-experience.css.

   1. Highlights anchored to points on the product photo. The points are
      given in the photo's own pixels (data-x/-y) and placed through the
      same object-fit/object-position the photo uses, so they stay on the
      label, the honey and the lid at every crop (4:5 desktop, 1:1 phone).
   2. Desktop: hovering or focusing the photo shows all labels; the one
      nearest the pointer comes forward. Hovering a line in the list beside
      the photo lights up only that point.
   3. Touch: the points stay visible; a tap opens one label, a tap
      elsewhere closes it. The list beside the photo carries the same text
      for everyone, including screen readers.
   4. The closing purchase line follows the chosen size and price.
   ================================================================= */
(function () {
  'use strict';
  var main = document.getElementById('pdgMain');
  var layer = document.getElementById('pdxSpots');
  if (!main || !layer) return;
  var spots = Array.prototype.slice.call(layer.querySelectorAll('.pdx-spot'));
  var natW = Number(layer.dataset.w) || 1, natH = Number(layer.dataset.h) || 1;
  var canHover = window.matchMedia('(hover: hover)').matches;
  main.dataset.slide = '0';

  function spotFor(i) { return spots.filter(function (s) { return s.dataset.i === String(i); })[0]; }

  /* ---------- place the points ----------
     Desktop ("edge"): the label rests against the edge of the photo on its
     side, a hairline runs to its point, so the label never sits on the
     label text of the jar. Touch or a small photo ("tip"): one label at a
     time, as a small tooltip above its point (below it near the top). */
  var EDGE = 16, GAP = 14;
  function place() {
    var img = main.querySelector('img[data-slide="0"]');
    var fw = main.clientWidth, fh = main.clientHeight;
    if (!img || !fw || !fh) return;
    var tip = !canHover || fw < 440;
    main.classList.toggle('pdx-tip', tip);
    var pos = (getComputedStyle(img).objectPosition || '50% 50%').split(' ');
    var px = parseFloat(pos[0]) / 100, py = parseFloat(pos[1] || pos[0]) / 100;
    if (isNaN(px)) px = 0.5; if (isNaN(py)) py = 0.5;
    var scale = Math.max(fw / natW, fh / natH);
    var ox = (fw - natW * scale) * px, oy = (fh - natH * scale) * py;
    spots.forEach(function (s) {
      var x = ox + Number(s.dataset.x) * scale, y = oy + Number(s.dataset.y) * scale;
      s.style.left = x.toFixed(1) + 'px';
      s.style.top = y.toFixed(1) + 'px';
      s.dataset.cx = x; s.dataset.cy = y;
      var pill = s.querySelector('.pdx-pill'), line = s.querySelector('.pdx-line');
      if (!pill) return;
      var pw = pill.offsetWidth, ph = pill.offsetHeight, left;
      if (tip) {
        left = Math.min(Math.max(x - pw / 2, 8), fw - pw - 8);
        pill.style.left = (left - x).toFixed(1) + 'px';
        pill.style.top = (y - 14 - ph >= 8 ? -(14 + ph) : 14) + 'px';
        return;
      }
      pill.style.top = '0px';
      if (s.classList.contains('pdx-r')) {
        left = Math.max(x + GAP, fw - EDGE - pw);
        if (left + pw > fw - 4) left = fw - 4 - pw;          // keep it in the frame
        line.style.left = '6px';
        line.style.width = Math.max(0, left - x - 6).toFixed(1) + 'px';
      } else {
        left = Math.min(EDGE, x - GAP - pw);
        if (left < 4) left = 4;
        var end = left + pw;
        line.style.left = (end - x).toFixed(1) + 'px';
        line.style.width = Math.max(0, x - 6 - end).toFixed(1) + 'px';
      }
      pill.style.left = (left - x).toFixed(1) + 'px';
    });
  }
  var first = main.querySelector('img[data-slide="0"]');
  if (first && !first.complete) first.addEventListener('load', place, { once: true });
  place();
  if ('ResizeObserver' in window) new ResizeObserver(function () { place(); }).observe(main);
  else window.addEventListener('resize', place, { passive: true });
  window.addEventListener('hd:lang', function () { setTimeout(place, 60); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);

  /* ---------- state ---------- */
  var listHot = null;
  function setOne(i) {
    spots.forEach(function (s) { s.classList.toggle('is-on', i !== null && s.dataset.i === String(i)); });
    main.classList.toggle('pdx-one', i !== null);
  }

  /* gallery: the points belong to the first photo only */
  var thumbs = document.getElementById('pdgThumbs');
  if (thumbs) thumbs.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.pdg-thumb');
    if (b) { main.dataset.slide = b.getAttribute('data-slide'); setOne(null); }
  });

  if (canHover) {
    main.addEventListener('mouseenter', function () { main.classList.add('pdx-all'); });
    main.addEventListener('mouseleave', function () { main.classList.remove('pdx-all'); if (listHot === null) setOne(null); });
    /* the label nearest the pointer comes forward */
    main.addEventListener('mousemove', function (e) {
      if (listHot !== null || main.dataset.slide !== '0') return;
      var r = main.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
      var best = null, bd = 74 * 74;
      spots.forEach(function (s) {
        var dx = mx - Number(s.dataset.cx), dy = my - Number(s.dataset.cy), d2 = dx * dx + dy * dy;
        if (d2 < bd) { bd = d2; best = s.dataset.i; }
      });
      setOne(best);
    }, { passive: true });
  }
  main.addEventListener('focusin', function () { main.classList.add('pdx-all'); });
  main.addEventListener('focusout', function () { main.classList.remove('pdx-all'); });

  /* touch: tap a point to open its label */
  if (!canHover) {
    main.addEventListener('click', function (e) {
      var dot = e.target.closest && e.target.closest('.pdx-dot');
      if (!dot) { setOne(null); return; }
      var i = dot.parentNode.dataset.i;
      var open = dot.parentNode.classList.contains('is-on');
      setOne(open ? null : i);
    });
  }

  /* the list beside the photo */
  var list = document.getElementById('pdxHl');
  if (list) {
    list.querySelectorAll('li[data-i]').forEach(function (li) {
      li.addEventListener('mouseenter', function () {
        if (main.dataset.slide !== '0') return;
        listHot = li.dataset.i; setOne(listHot);
      });
      li.addEventListener('mouseleave', function () { listHot = null; setOne(null); });
    });
  }

  /* ---------- closing purchase line follows the size ---------- */
  var remPrice = document.getElementById('pdxRemPrice'), remSize = document.getElementById('pdxRemSize');
  function euro(n) { n = Number(n); return '€' + (n % 1 ? n.toFixed(2).replace('.', ',') : n); }
  function syncRem(r) {
    if (!r) return;
    if (remPrice) remPrice.textContent = euro(r.dataset.price);
    if (remSize) remSize.textContent = '· ' + r.dataset.edition;
  }
  document.querySelectorAll('input[name="hd-variant"]').forEach(function (r) {
    r.addEventListener('change', function () { if (r.checked) syncRem(r); });
  });
  syncRem(document.querySelector('input[name="hd-variant"]:checked'));

  /* ---------- tab title and description follow the language ----------
     The HTML ships the Dutch title and description (the indexed language);
     a visitor who switches to English gets the English ones in the tab. */
  function seoLang() {
    var lang = (window.HD_lang && window.HD_lang()) || 'nl';
    var T = window.HD_PAGE_T && (window.HD_PAGE_T[lang] || window.HD_PAGE_T.nl);
    if (!T || !T['px.seo.title']) return;
    document.title = T['px.seo.title'];
    var m = document.querySelector('meta[name="description"]');
    if (m && T['px.seo.desc']) m.setAttribute('content', T['px.seo.desc']);
  }
  window.addEventListener('hd:lang', seoLang);
  seoLang();
})();
