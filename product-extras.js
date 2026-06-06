/* =================================================================
   Harvest Deli, Product storytelling (Phase 2)
   -----------------------------------------------------------------
   Injects premium editorial sections onto product pages from a small
   content model keyed by product slug (read from <meta hd-product-slug>):
     • Composition, ingredients, allergens, nutrition table
     • Pairs well with, curated complementary products
     • Build your ritual, a honey + tea + olive-oil bundle
     • A product FAQ accordion
   Loaded site-wide by shared.js; no-ops on non-product pages.
   Bilingual (EN/NL); falls back to EN.
   ================================================================= */
(function () {
  'use strict';
  function L(en, nl) { return (window.HD_lang && window.HD_lang() === 'nl') ? nl : en; }
  function fmt(n) { n = Math.round((n || 0) * 100) / 100; return Number.isInteger(n) ? '€' + n : '€' + n.toFixed(2); }

  /* ---- content model (EN, NL) ---- */
  var HONEY_NUTRITION = [
    ['Energy', '1340 kJ / 315 kcal'], ['Fat', '0 g'], ['– saturates', '0 g'],
    ['Carbohydrate', '80 g'], ['– sugars', '80 g'], ['Protein', '0.4 g'], ['Salt', '0 g']
  ];
  function honeyDetail(name) {
    return {
      ingredients: L('100% raw Greek honey. Unfiltered, unpasteurised, nothing added, nothing taken away.',
                     '100% rauwe Griekse honing. Ongefilterd, ongepasteuriseerd, niets toegevoegd, niets weggehaald.'),
      allergens: L('Naturally free from gluten, dairy and nuts. Not suitable for infants under 12 months.',
                   'Van nature vrij van gluten, zuivel en noten. Niet geschikt voor kinderen onder 12 maanden.'),
      nutritionLabel: L('Per 100 g', 'Per 100 g'),
      nutrition: HONEY_NUTRITION,
      faqs: [
        [L('Why has my honey crystallised?', 'Waarom is mijn honing gekristalliseerd?'),
         L('Crystallisation is natural in raw honey and a mark of quality. Warm the jar gently in lukewarm water to return it to liquid, never boil.',
           'Kristallisatie is natuurlijk bij rauwe honing en een teken van kwaliteit. Verwarm de pot zachtjes in lauw water om hem weer vloeibaar te maken, nooit koken.')],
        [L('How should I store it?', 'Hoe bewaar ik het?'),
         L('Cool, dry and away from direct light. Sealed and unrefrigerated, raw honey keeps indefinitely.',
           'Koel, droog en uit direct licht. Verzegeld en buiten de koelkast blijft rauwe honing onbeperkt houdbaar.')]
      ]
    };
  }

  var DETAILS = {
    'chestnut': honeyDetail('Chestnut'),
    'olive-oil': {
      ingredients: L('100% cold-pressed extra virgin olive oil, Koroneiki &amp; Athinolia olives, single estate.',
                     '100% koudgeperste extra vergine olijfolie, Koroneiki &amp; Athinolia olijven, één landgoed.'),
      allergens: L('Naturally free from gluten, dairy and nuts.', 'Van nature vrij van gluten, zuivel en noten.'),
      nutritionLabel: L('Per 100 ml', 'Per 100 ml'),
      nutrition: [['Energy', '3389 kJ / 824 kcal'], ['Fat', '91.6 g'], ['– saturates', '13 g'], ['Carbohydrate', '0 g'], ['– sugars', '0 g'], ['Protein', '0 g'], ['Salt', '0 g']],
      faqs: [
        [L('Should I cook with it or finish with it?', 'Koken of afmaken?'),
         L('Both. It has a high smoke point for everyday cooking, but it shines raw, over bread, salads, grilled vegetables and even ice cream.',
           'Allebei. Het heeft een hoog rookpunt voor dagelijks koken, maar komt rauw het best tot z’n recht, over brood, salades, gegrilde groenten en zelfs roomijs.')],
        [L('How should I store it?', 'Hoe bewaar ik het?'),
         L('Cool and dark, tightly closed. Use within 18 months of pressing for the freshest, most peppery character.',
           'Koel en donker, goed gesloten. Gebruik binnen 18 maanden na persing voor het frisste, meest peperige karakter.')]
      ]
    },
    'mountain-tea': {
      ingredients: L('100% wild Greek mountain tea (Sideritis scardica). Whole dried stems, leaves and flowers.',
                     '100% wilde Griekse bergthee (Sideritis scardica). Hele gedroogde stengels, blaadjes en bloemen.'),
      allergens: L('Naturally caffeine free. Free from gluten, dairy and nuts.', 'Van nature cafeïnevrij. Vrij van gluten, zuivel en noten.'),
      nutritionLabel: L('Per cup (brewed)', 'Per kop (gezet)'),
      nutrition: [['Energy', '0 kJ / 0 kcal'], ['Caffeine', L('None', 'Geen')], ['Fat', '0 g'], ['Sugars', '0 g'], ['Salt', '0 g']],
      faqs: [
        [L('How do I brew it?', 'Hoe zet ik het?'),
         L('Steep a small handful of stems in just-boiled water for 4–5 minutes. Lovely hot, or chilled over ice. A spoon of honey is the traditional finish.',
           'Laat een klein handje stengels 4–5 minuten trekken in net gekookt water. Heerlijk warm, of gekoeld op ijs. Een lepel honing is de traditionele afronding.')],
        [L('Is it really caffeine free?', 'Is het echt cafeïnevrij?'),
         L('Yes, mountain tea is a herbal infusion, not a true tea, so it is naturally caffeine free and gentle enough for the evening.',
           'Ja, bergthee is een kruideninfusie, geen echte thee, dus van nature cafeïnevrij en zacht genoeg voor de avond.')]
      ]
    }
  };

  var PAIRS = {
    'chestnut': ['mountain-tea', 'olive-oil', 'thyme'],
    'olive-oil': ['chestnut', 'thyme', 'mountain-tea'],
    'mountain-tea': ['chestnut', 'acacia', 'orange-blossom']
  };

  /* The ritual bundle, honey + tea + olive oil */
  var BUNDLE = ['chestnut', 'mountain-tea', 'olive-oil'];
  var BUNDLE_DISCOUNT = 0.12; // 12% off the trio

  function getDetail(slug) {
    if (DETAILS[slug]) return DETAILS[slug];
    // any other honey slug → generic honey content
    return honeyDetail('Honey');
  }

  /* ---- builders ---- */
  function compositionHTML(d) {
    var rows = d.nutrition.map(function (r) {
      return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td></tr>';
    }).join('');
    return '' +
    '<section class="px-section px-compose" aria-label="' + L('Composition', 'Samenstelling') + '">' +
      '<div class="px-head"><span class="px-eyebrow">' + L('The Particulars', 'Het Detail') + '</span>' +
        '<h2 class="px-title">' + L('What’s inside.', 'Wat erin zit.') + '</h2></div>' +
      '<div class="px-compose-grid">' +
        '<div class="px-card"><h4>' + L('Ingredients', 'Ingrediënten') + '</h4><p>' + d.ingredients + '</p></div>' +
        '<div class="px-card"><h4>' + L('Allergens', 'Allergenen') + '</h4><p>' + d.allergens + '</p></div>' +
        '<div class="px-card px-nutri"><h4>' + L('Nutrition', 'Voedingswaarde') + ' <span>' + d.nutritionLabel + '</span></h4>' +
          '<table><tbody>' + rows + '</tbody></table></div>' +
      '</div>' +
    '</section>';
  }

  function pairsHTML(slug) {
    var list = (PAIRS[slug] || ['chestnut', 'mountain-tea', 'olive-oil']).filter(function (s) { return s !== slug; });
    var cards = list.map(function (s) {
      var p = window.HD_product && window.HD_product(s); if (!p) return '';
      return '<a class="px-pair" href="' + p.url + '">' +
        '<span class="px-pair-img"><img src="' + p.image + '" alt="" loading="lazy"></span>' +
        '<span class="px-pair-meta"><span class="px-pair-name">' + p.name + '</span>' +
        '<span class="px-pair-note">' + (p.notes || p.region || '') + '</span>' +
        '<span class="px-pair-price">' + fmt(p.price) + '</span></span></a>';
    }).join('');
    if (!cards) return '';
    return '' +
    '<section class="px-section" aria-label="' + L('Pairs well with', 'Past goed bij') + '">' +
      '<div class="px-head"><span class="px-eyebrow">' + L('From the table', 'Van de tafel') + '</span>' +
        '<h2 class="px-title">' + L('Pairs well with.', 'Past goed bij.') + '</h2></div>' +
      '<div class="px-pairs">' + cards + '</div>' +
    '</section>';
  }

  function bundleHTML(slug) {
    var items = BUNDLE.map(function (s) { return window.HD_product && window.HD_product(s); }).filter(Boolean);
    if (items.length < 2) return '';
    var sum = items.reduce(function (a, p) { return a + p.price; }, 0);
    var price = Math.round(sum * (1 - BUNDLE_DISCOUNT));
    var save = sum - price;
    var thumbs = items.map(function (p) { return '<span class="px-bundle-thumb"><img src="' + p.image + '" alt="' + p.name + '" loading="lazy"></span>'; }).join('<span class="px-plus" aria-hidden="true">+</span>');
    var names = items.map(function (p) { return p.name; }).join(' · ');
    return '' +
    '<section class="px-section px-bundle" aria-label="' + L('Build your ritual', 'Stel je ritueel samen') + '">' +
      '<div class="px-bundle-inner">' +
        '<div class="px-bundle-visual">' + thumbs + '</div>' +
        '<div class="px-bundle-body">' +
          '<span class="px-eyebrow">' + L('The Ritual', 'Het Ritueel') + '</span>' +
          '<h2 class="px-title">' + L('Honey, tea &amp; olive oil.', 'Honing, thee &amp; olijfolie.') + '</h2>' +
          '<p class="px-bundle-sub">' + names + '</p>' +
          '<p class="px-bundle-desc">' + L('The three pillars of the Greek table, bound together and gift-wrapped, at a quiet saving.',
                                            'De drie pijlers van de Griekse tafel, samengebracht en cadeauverpakt, met een rustige korting.') + '</p>' +
          '<div class="px-bundle-buy">' +
            '<span class="px-bundle-price">' + fmt(price) + ' <s>' + fmt(sum) + '</s></span>' +
            '<button type="button" class="confirm-btn px-bundle-add" data-px-bundle><span>' + L('Add the ritual', 'Voeg het ritueel toe') + '</span> <span class="arrow"></span></button>' +
          '</div>' +
          '<span class="px-bundle-save">' + L('You save', 'Je bespaart') + ' ' + fmt(save) + '</span>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function faqHTML(d) {
    if (!d.faqs || !d.faqs.length) return '';
    var items = d.faqs.map(function (f) {
      return '<div class="px-faq-item"><button type="button" class="px-faq-q" aria-expanded="false">' +
        '<span>' + f[0] + '</span><span class="px-faq-mark" aria-hidden="true"></span></button>' +
        '<div class="px-faq-a"><p>' + f[1] + '</p></div></div>';
    }).join('');
    return '' +
    '<section class="px-section" aria-label="FAQ">' +
      '<div class="px-head"><span class="px-eyebrow">' + L('Good to know', 'Goed om te weten') + '</span>' +
        '<h2 class="px-title">' + L('Questions, answered.', 'Vragen, beantwoord.') + '</h2></div>' +
      '<div class="px-faq">' + items + '</div>' +
    '</section>';
  }

  function init() {
    var meta = document.querySelector('meta[name="hd-product-slug"]');
    if (!meta || !meta.content) return; // not a product page
    if (document.getElementById('pxExtras')) return;
    var slug = meta.content;
    var d = getDetail(slug);

    var wrap = document.createElement('div');
    wrap.id = 'pxExtras';
    wrap.innerHTML = compositionHTML(d) + pairsHTML(slug) + bundleHTML(slug) + faqHTML(d);

    var anchor = document.querySelector('.reviews-section') || document.querySelector('.also') || null;
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(wrap, anchor);
    else (document.querySelector('main') || document.body).appendChild(wrap);

    // FAQ accordion
    wrap.addEventListener('click', function (e) {
      var q = e.target.closest && e.target.closest('.px-faq-q');
      if (q) { var it = q.parentElement; it.classList.toggle('open'); q.setAttribute('aria-expanded', it.classList.contains('open')); return; }
      if (e.target.closest('[data-px-bundle]')) {
        BUNDLE.forEach(function (s) { if (window.HD_CART) window.HD_CART.add(s, 1); });
        if (window.HD_renderCart) window.HD_renderCart();
        if (window.HD_toast) window.HD_toast(L('The ritual is in your cellar', 'Het ritueel staat in je kelder'));
        if (window.HD_openCart) setTimeout(window.HD_openCart, 240);
        if (window.HD_track) window.HD_track('add_to_cart', { item_id: 'bundle-ritual', currency: 'EUR', items: BUNDLE.map(function (s) { return { item_id: s, quantity: 1 }; }) });
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
