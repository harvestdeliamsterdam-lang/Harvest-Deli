/* =================================================================
   Chestnut Honey, "living character" benefits section (chestnut only)
   -----------------------------------------------------------------
   A calm, cinematic replacement for the plain benefit list on the
   Chestnut Honey product page. The jar stays perfectly still; soft
   amber pollen drifts up like warm aroma, and four frosted-cream
   benefit cards materialise around it (desktop) or as a swipeable
   carousel (mobile). Pure DOM + CSS, transform/opacity only, paused
   out of viewport, and fully respectful of prefers-reduced-motion.

   Vanilla by design: this site is static HTML/JS, so we deliver the
   Framer-Motion-style experience natively (no React, no canvas, no
   WebGL) — lighter and 60fps-friendly. All existing content stays as
   a fallback; this only augments the presentation for chestnut.
   ================================================================= */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    var meta = document.querySelector('meta[name="hd-product-slug"]');
    var slug = meta && meta.content;
    if (slug !== 'chestnut') return;                       // chestnut only
    if (document.getElementById('chAroma')) return;        // build once
    var hero = document.querySelector('.product-hero');
    if (!hero) return;

    var NL = (window.HD_lang && window.HD_lang() === 'nl');
    function L(en, nl) { return NL ? nl : en; }

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- content ---- */
    var CARDS = [
      { icon: 'chestnut',
        h: L('Rich & Layered', 'Rijk & gelaagd'),
        p: L('Warm woody flavours with remarkable depth.', 'Warme houtachtige smaken met opmerkelijke diepte.') },
      { icon: 'leaf',
        h: L('Forest Aroma', 'Bosaroma'),
        p: L('Notes of chestnut blossom, bark and wild herbs.', 'Tonen van kastanjebloesem, schors en wilde kruiden.') },
      { icon: 'mountain',
        h: L('Mountain Harvest', 'Bergoogst'),
        p: L('Collected high in the Greek mountain forests.', 'Hoog in de Griekse bergbossen verzameld.') },
      { icon: 'spark',
        h: L('Naturally Rich', 'Van nature rijk'),
        p: L('Contains naturally occurring tannins and minerals.', 'Bevat van nature tannines en mineralen.') }
    ];
    var POS = ['tr', 'ml', 'lr', 'bl'];  // top-right, middle-left, lower-right, bottom-left

    var ICONS = {
      chestnut: '<path d="M12 3.5c3.4 0 5.6 3 5.6 6.7 0 4.6-2.8 8.6-5.6 9.8-2.8-1.2-5.6-5.2-5.6-9.8C6.4 6.5 8.6 3.5 12 3.5Z"/><path d="M12 3.5V2.4"/>',
      leaf: '<path d="M5 19c0-7.2 5.1-12.2 14-13-1 8-6 13-14 13Z"/><path d="M5 19c3-4.2 6.2-6.8 10.2-8.4"/>',
      mountain: '<path d="M3 18.5 8.4 9l3.4 5 2.6-3.6L21 18.5Z"/><circle cx="16.4" cy="6.5" r="1.4"/>',
      spark: '<path d="M12 3.2 13.7 9 19.5 10.7 13.7 12.4 12 18.2 10.3 12.4 4.5 10.7 10.3 9Z"/>'
    };
    function iconSvg(name) {
      return '<svg class="ch-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
             'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
             ICONS[name] + '</svg>';
    }

    /* ---- styles ---- */
    var css = [
      '.ch-aroma{position:relative;overflow:hidden;padding:clamp(72px,11vh,140px) 0;',
        'background:radial-gradient(125% 92% at 50% 26%,#FCF5E9 0%,#F5EBD8 58%,#EFE3CD 100%);',
        'color:var(--ink,#241C14);}',
      '.ch-aroma .ch-head{text-align:center;max-width:640px;margin:0 auto clamp(28px,5vh,56px);padding:0 7%;',
        'opacity:0;transform:translateY(10px);transition:opacity 1.1s var(--ease,cubic-bezier(.22,1,.36,1)),transform 1.1s var(--ease,cubic-bezier(.22,1,.36,1));}',
      '.ch-aroma.is-live .ch-head{opacity:1;transform:none;}',
      '.ch-aroma .ch-eyebrow{font-family:Inter,sans-serif;font-size:10.5px;letter-spacing:.34em;text-transform:uppercase;',
        'color:var(--gold-deep,#8A6228);font-weight:600;margin-bottom:16px;}',
      '.ch-aroma .ch-title{font-family:Newsreader,serif;font-weight:500;line-height:1.08;letter-spacing:-.01em;',
        'font-size:clamp(27px,3.6vw,42px);margin:0;color:var(--ink,#241C14);}',
      '.ch-aroma .ch-title em{font-style:italic;color:var(--ink-warm,#5A4224);}',
      /* stage */
      '.ch-stage{position:relative;max-width:1120px;margin:0 auto;min-height:clamp(400px,58vh,620px);',
        'display:flex;align-items:center;justify-content:center;}',
      '.ch-jar{position:relative;z-index:2;display:block;width:auto;height:clamp(300px,44vh,460px);',
        'object-fit:contain;filter:drop-shadow(0 34px 46px rgba(70,42,12,.26));}',
      /* particle layer */
      '.ch-parts{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;}',
      '.ch-p{position:absolute;bottom:32%;border-radius:50%;opacity:0;',
        'background:radial-gradient(circle at 40% 35%,rgba(240,206,140,.9),rgba(201,158,84,.5) 55%,rgba(201,158,84,0) 72%);',
        'will-change:transform,opacity;animation-name:chDrift;animation-timing-function:cubic-bezier(.4,0,.5,1);',
        'animation-iteration-count:infinite;animation-play-state:paused;}',
      '.ch-aroma.is-live .ch-p{animation-play-state:running;}',
      '.ch-aroma.ch-paused .ch-p{animation-play-state:paused;}',
      '@keyframes chDrift{',
        '0%{opacity:0;transform:translate3d(0,0,0) scale(.7);}',
        '14%{opacity:var(--o,.5);}',
        '70%{opacity:calc(var(--o,.5) * .5);}',
        '100%{opacity:0;transform:translate3d(var(--dx,0),calc(-1 * var(--rise,260px)),0) scale(1);}',
      '}',
      /* cards */
      '.ch-cards{position:absolute;inset:0;z-index:3;pointer-events:none;}',
      '.ch-card{position:absolute;width:clamp(210px,20vw,248px);pointer-events:auto;',
        'background:rgba(255,250,242,.72);-webkit-backdrop-filter:blur(18px) saturate(120%);backdrop-filter:blur(18px) saturate(120%);',
        'border:1px solid rgba(180,145,80,.18);border-radius:18px;padding:20px 22px;',
        'box-shadow:0 18px 44px -22px rgba(70,46,14,.4),0 2px 10px -6px rgba(70,46,14,.18);',
        'opacity:0;transform:translateY(14px);',
        'transition:opacity 1.2s var(--ease,cubic-bezier(.22,1,.36,1)),transform 1.2s var(--ease,cubic-bezier(.22,1,.36,1));}',
      '.ch-card.in{opacity:1;transform:none;animation:chFloat 7s ease-in-out infinite;}',
      '@keyframes chFloat{0%,100%{transform:translateY(0);opacity:.965;}50%{transform:translateY(-4px);opacity:1;}}',
      '.ch-card .ch-ic{width:26px;height:26px;color:var(--gold-deep,#8A6228);margin-bottom:13px;display:block;}',
      '.ch-card h4{font-family:Newsreader,serif;font-weight:600;font-size:18px;letter-spacing:-.005em;margin:0 0 6px;color:var(--ink,#241C14);}',
      '.ch-card p{font-family:Inter,sans-serif;font-size:13px;line-height:1.55;margin:0;color:var(--ink-warm,#5A4224);}',
      /* desktop corner placement, clear of the centered jar */
      '.ch-card[data-pos="tr"]{top:2%;right:2%;}',
      '.ch-card[data-pos="ml"]{top:38%;left:0;}',
      '.ch-card[data-pos="lr"]{bottom:19%;right:1%;}',
      '.ch-card[data-pos="bl"]{bottom:2%;left:4%;}',
      /* paused animations out of view (cards stop breathing too) */
      '.ch-aroma.ch-paused .ch-card.in{animation-play-state:paused;}',
      /* ---------- mobile: jar on top, swipeable carousel below ---------- */
      '@media (max-width:820px){',
        '.ch-stage{flex-direction:column;min-height:0;gap:34px;}',
        '.ch-jar{height:clamp(230px,42vh,320px);}',
        '.ch-parts{bottom:auto;top:0;height:70%;}',
        '.ch-cards{position:static;display:flex;gap:16px;overflow-x:auto;overflow-y:visible;',
          'scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:6px 0 10px;width:100%;',
          'scroll-padding-inline:7%;scrollbar-width:none;}',
        '.ch-cards::-webkit-scrollbar{display:none;}',
        '.ch-cards::before,.ch-cards::after{content:"";flex:0 0 7%;}',   /* breathing room at the ends */
        '.ch-card{position:static !important;width:auto;flex:0 0 85%;scroll-snap-align:center;',
          'top:auto;left:auto;right:auto;bottom:auto;}',
      '}',
      '@media (prefers-reduced-motion:reduce){',
        '.ch-p{display:none !important;}',
        '.ch-card{transition:opacity .5s ease !important;transform:none !important;}',
        '.ch-card.in{animation:none !important;transform:none !important;opacity:1 !important;}',
        '.ch-aroma .ch-head{transition:opacity .5s ease !important;transform:none !important;}',
      '}'
    ].join('');
    var style = document.createElement('style');
    style.id = 'chAromaCss';
    style.textContent = css;
    document.head.appendChild(style);

    /* ---- jar image: reuse the hero packshot ---- */
    var heroImg = document.querySelector('#pdgMain img') || document.querySelector('.pdg-main img');
    var jarSrc = (heroImg && heroImg.getAttribute('src')) || 'assets/products-images/chestnut.webp';
    var jarAlt = L('Harvest Deli Chestnut Honey jar', 'Harvest Deli Kastanjehoning pot');

    /* ---- build DOM ---- */
    var sec = document.createElement('section');
    sec.className = 'ch-aroma';
    sec.id = 'chAroma';
    sec.setAttribute('aria-label', L('The character of this honey', 'Het karakter van deze honing'));

    var cardsHtml = CARDS.map(function (c, i) {
      return '<article class="ch-card" data-pos="' + POS[i] + '">' +
               iconSvg(c.icon) +
               '<h4>' + c.h + '</h4><p>' + c.p + '</p>' +
             '</article>';
    }).join('');

    sec.innerHTML =
      '<div class="ch-head">' +
        '<div class="ch-eyebrow">' + L('Its character', 'Het karakter') + '</div>' +
        '<h2 class="ch-title">' + L('The honey, <em>alive.</em>', 'De honing, <em>tot leven.</em>') + '</h2>' +
      '</div>' +
      '<div class="ch-stage">' +
        '<div class="ch-parts" aria-hidden="true"></div>' +
        '<img class="ch-jar" src="' + jarSrc + '" alt="' + jarAlt + '" decoding="async">' +
        '<div class="ch-cards">' + cardsHtml + '</div>' +
      '</div>';

    hero.parentNode.insertBefore(sec, hero.nextSibling);

    /* ---- particles ---- */
    var partLayer = sec.querySelector('.ch-parts');
    var isMobile = window.matchMedia('(max-width:820px)').matches;
    var COUNT = isMobile ? 11 : 23;
    if (!reduce) {
      for (var i = 0; i < COUNT; i++) {
        var p = document.createElement('span');
        p.className = 'ch-p';
        var size = 3 + Math.random() * 5;                 // 3–8px tiny pollen dust
        var left = 50 + (Math.random() * 34 - 17);        // clustered around the jar's centre
        var dx = (Math.random() * 80 - 40);               // gentle outward drift
        var rise = 200 + Math.random() * 150;             // 200–350px slow climb
        var dur = 6.5 + Math.random() * 5;                // 6.5–11.5s, warm-air slow
        var delay = Math.random() * 8;                    // staggered, never a burst
        var o = 0.28 + Math.random() * 0.32;              // 0.28–0.60 peak, almost invisible
        p.style.cssText =
          'left:' + left.toFixed(2) + '%;width:' + size.toFixed(1) + 'px;height:' + size.toFixed(1) + 'px;' +
          '--dx:' + dx.toFixed(1) + 'px;--rise:' + rise.toFixed(0) + 'px;--o:' + o.toFixed(2) + ';' +
          'animation-duration:' + dur.toFixed(2) + 's;animation-delay:' + delay.toFixed(2) + 's;';
        partLayer.appendChild(p);
      }
    }

    /* ---- reveal + viewport pause ---- */
    var cards = Array.prototype.slice.call(sec.querySelectorAll('.ch-card'));
    var started = false;
    function reveal() {
      if (started) return; started = true;
      sec.classList.add('is-live');
      if (reduce) { cards.forEach(function (c) { c.classList.add('in'); }); return; }
      // particles have been drifting since is-live (1s after enter, via the IO delay);
      // first card ~600ms later, then one every 500ms — like aroma reaching each spot.
      cards.forEach(function (c, i) {
        setTimeout(function () { c.classList.add('in'); }, 600 + i * 500);
      });
    }

    if ('IntersectionObserver' in window) {
      var revealTimer = null;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            sec.classList.remove('ch-paused');                    // resume drift when in view
            if (!started && revealTimer === null) {
              revealTimer = setTimeout(reveal, 1000);             // 1s settle before it breathes
            }
          } else {
            sec.classList.add('ch-paused');                       // pause out of view (perf)
            if (!started && revealTimer !== null) { clearTimeout(revealTimer); revealTimer = null; }
          }
        });
      }, { threshold: 0.28 });
      io.observe(sec);
    } else {
      setTimeout(reveal, 1000);
    }
  });
})();
