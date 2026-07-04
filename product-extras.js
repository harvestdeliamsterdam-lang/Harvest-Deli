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
                     '100% koudgeperste extra vergine olijfolie, Koroneiki &amp; Athinolia olijven, één herkomst.'),
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

  /* ---- Per-honey tasting spec (source of truth: Harvest Deli honey PDF) ----
     Each field is [EN, NL]. Properties are verbatim per honey type so no jar
     ever shows another honey's character. */
  /* color/aroma/texture/crystal/sweetness/natural/origin/result/tagline are
     verbatim from the Harvest Deli Greek Honey Collection text document
     (EN side); NL side is a faithful translation, since the source PDF is
     English-only. Do not paraphrase EN when updating — copy it exactly. */
  var HONEY_SPEC = {
    'chestnut': { greek: 'Kástano',
      color: ['Dark amber', 'Donker amber'], aroma: ['Warm and woody', 'Warm en houtachtig'],
      texture: ['Thick and rich', 'Dik en rijk'], crystal: ['Slow to medium', 'Langzaam tot gemiddeld'],
      sweetness: ['Rich and rounded', 'Rijk en rond'],
      natural: ['Naturally rich in minerals, tannins and antioxidants, appreciated for its depth and botanical complexity.', 'Van nature rijk aan mineralen, tannines en antioxidanten, gewaardeerd om zijn diepte en botanische complexiteit.'],
      lede: ['A dark, slow-pouring honey from chestnut forests high in the Greek mountains — warm, woody and layered, with a long finish.', 'Een donkere, traag vloeiende honing uit kastanjebossen hoog in de Griekse bergen — warm, houtachtig en gelaagd, met een lange afdronk.'],
      origin: ['In early summer, bees collect nectar from blooming chestnut trees growing in Greek mountain forests.', 'In de vroege zomer verzamelen bijen nectar van bloeiende kastanjebomen in de Griekse bergbossen.'],
      result: ['Chestnut honey is rich and beautifully layered, with warm woody aromas and long-lasting depth.', 'Kastanjehoning is rijk en prachtig gelaagd, met warme houtachtige aroma’s en een langdurige diepte.'],
      tagline: ['A mountain honey full of character.', 'Een berghoning vol karakter.'] },
    'pine': { greek: 'Péfko',
      color: ['Amber to dark amber', 'Amber tot donker amber'], aroma: ['Resinous and warm', 'Harsachtig en warm'],
      texture: ['Thick and smooth', 'Dik en glad'], crystal: ['Very slow', 'Zeer langzaam'],
      sweetness: ['Mild and balanced', 'Mild en gebalanceerd'],
      natural: ['Naturally rich in trace minerals and antioxidants, with low glucose content that helps maintain its smooth texture.', 'Van nature rijk aan sporenmineralen en antioxidanten, met een laag glucosegehalte dat de gladde textuur helpt behouden.'],
      lede: ['A traditional Greek pinewood honey — bees gather honeydew among the pines, sea air and sunshine. Smooth-bodied and naturally balanced.', 'Een traditionele Griekse dennenhoning — bijen verzamelen honingdauw tussen de dennen, zeelucht en zon. Soepel van body en van nature in balans.'],
      origin: ['Produced in the pine forests of Greece, where bees gather honeydew from pine trees surrounded by sea air and sunshine.', 'Geproduceerd in de dennenbossen van Griekenland, waar bijen honingdauw verzamelen van dennenbomen, omringd door zeelucht en zon.'],
      result: ['Pine honey is one of Greece’s most loved traditional varieties, known for its smooth body and naturally balanced flavor.', 'Dennenhoning is een van Griekenlands meest geliefde traditionele soorten, bekend om zijn zachte body en van nature gebalanceerde smaak.'],
      tagline: ['A timeless taste of Greece.', 'Een tijdloze smaak van Griekenland.'] },
    'oak': { greek: 'Velanídi',
      color: ['Dark amber to brown', 'Donker amber tot bruin'], aroma: ['Woody and warm', 'Houtachtig en warm'],
      texture: ['Dense and smooth', 'Dicht en glad'], crystal: ['Very slow', 'Zeer langzaam'],
      sweetness: ['Mild and full-bodied', 'Mild en vol'],
      natural: ['Naturally rich in potassium, magnesium, iron and antioxidants, appreciated for its mineral richness and deep nutritional profile.', 'Van nature rijk aan kalium, magnesium, ijzer en antioxidanten, gewaardeerd om de mineraalrijkdom en het diepe voedingsprofiel.'],
      lede: ['A dark forest honeydew honey from the oak woods of Greece — rich, smooth and full-bodied, with deep forest aromas.', 'Een donkere boshoning (honingdauw) uit de eikenbossen van Griekenland — rijk, glad en vol, met diepe bosaroma’s.'],
      origin: ['Collected from the majestic oak forests of Greece, this honey begins when bees gather honeydew found naturally on oak trees in mountain and woodland landscapes.', 'Verzameld uit de statige eikenbossen van Griekenland, ontstaat deze honing wanneer bijen honingdauw verzamelen die van nature voorkomt op eikenbomen in berg- en boslandschappen.'],
      result: ['Oak honey is rich, smooth and full-bodied, with deep forest aromas and remarkable depth. Its dark color and naturally dense texture make it one of Greece’s most distinctive honeys.', 'Eikenhoning is rijk, glad en vol, met diepe bosaroma’s en een opmerkelijke diepte. De donkere kleur en van nature dichte textuur maken het een van Griekenlands meest onderscheidende honingsoorten.'],
      tagline: ['A beautifully rich Greek forest honey with depth and elegance.', 'Een prachtig rijke Griekse boshoning met diepte en elegantie.'] },
    'arbutus': { greek: 'Koumariá',
      color: ['Deep amber', 'Diep amber'], aroma: ['Herbal and earthy', 'Kruidig en aards'],
      texture: ['Dense and rich, often naturally creamy', 'Dicht en rijk, vaak van nature romig'], crystal: ['Natural over time', 'Natuurlijk na verloop van tijd'],
      sweetness: ['Low and balanced', 'Laag en gebalanceerd'],
      natural: ['Naturally rich in polyphenols and antioxidants, traditionally appreciated for digestion support and its remarkable botanical richness.', 'Van nature rijk aan polyfenolen en antioxidanten, traditioneel gewaardeerd voor spijsverteringsondersteuning en zijn opmerkelijke botanische rijkdom.'],
      lede: ['One of Greece’s rarest nectars from the late-flowering wild strawberry tree — distinctly bittersweet, herbal and beautifully complex.', 'Een van Griekenlands zeldzaamste nectars van de laatbloeiende aardbeiboom — uitgesproken bitterzoet, kruidig en prachtig complex.'],
      origin: ['As autumn settles over the Greek countryside and most summer blooms begin to fade, bees continue their work among the blossoms of the wild strawberry tree — known in Greece as Koumaria. Growing naturally across Mediterranean hillsides and forests, this remarkable tree flowers late in the season, offering bees access to one of Greece’s rarest nectars.', 'Terwijl de herfst neerdaalt over het Griekse platteland en de meeste zomerbloesems beginnen te vervagen, gaan bijen door met hun werk tussen de bloesems van de aardbeiboom — in Griekenland bekend als Koumaria. Deze opmerkelijke boom groeit van nature op mediterrane hellingen en in bossen en bloeit laat in het seizoen, waardoor bijen toegang krijgen tot een van Griekenlands zeldzaamste nectars.'],
      result: ['Arbutus honey is known for its distinctive bittersweet character, aromatic herbal depth and beautifully complex finish. Less sweet than many floral honeys, it offers a truly memorable tasting experience.', 'Arbutushoning staat bekend om zijn kenmerkende bitterzoete karakter, aromatische kruidige diepte en prachtig complexe afdronk. Minder zoet dan veel bloemige honingsoorten, biedt het een werkelijk gedenkwaardige smaakervaring.'],
      tagline: ['A truly exceptional Greek honey with unforgettable character.', 'Een werkelijk uitzonderlijke Griekse honing met onvergetelijk karakter.'] },
    'fir-vanilla': { greek: 'Elátis Vanília',
      color: ['Pearl-golden amber', 'Parelgouden amber'], aroma: ['Gentle and resinous', 'Zacht en harsachtig'],
      texture: ['Thick, silky and glossy', 'Dik, zijdezacht en glanzend'], crystal: ['Extremely slow', 'Extreem langzaam'],
      sweetness: ['Smooth and balanced', 'Zacht en gebalanceerd'],
      natural: ['Naturally rich in trace minerals and known for its very low glucose content, which helps preserve its smooth fluid texture for exceptionally long periods.', 'Van nature rijk aan sporenmineralen en bekend om het zeer lage glucosegehalte, dat helpt de gladde, vloeibare textuur uitzonderlijk lang te behouden.'],
      lede: ['A rare fir honeydew honey from the high Greek mountains — naturally glossy and silky, with elegant vanilla-like notes.', 'Een zeldzame sparrenhoning (honingdauw) uit de hoge Griekse bergen — van nature glanzend en zijdezacht, met elegante vanille-achtige tonen.'],
      origin: ['High in the Greek mountains, bees gather honeydew from fir trees surrounded by fresh air and untouched nature.', 'Hoog in de Griekse bergen verzamelen bijen honingdauw van sparrenbomen, omringd door frisse lucht en ongerepte natuur.'],
      result: ['This rare honey is famous for its naturally glossy appearance, silky texture and elegant flavor with delicate vanilla-like notes.', 'Deze zeldzame honing staat bekend om zijn van nature glanzende uiterlijk, zijdezachte textuur en elegante smaak met subtiele vanille-achtige tonen.'],
      tagline: ['One of the treasures of Greek honey.', 'Een van de schatten van Griekse honing.'] },
    'orange-blossom': { greek: 'Portokáli',
      color: ['Light golden amber', 'Lichtgouden amber'], aroma: ['Floral with citrus blossom notes', 'Bloemig met citrusbloesemtonen'],
      texture: ['Smooth and flowing', 'Glad en vloeiend'], crystal: ['Natural over time', 'Natuurlijk na verloop van tijd'],
      sweetness: ['Bright and gentle', 'Helder en zacht'],
      natural: ['Naturally rich in floral compounds and enzymes, appreciated for its uplifting aroma and beautifully vibrant character.', 'Van nature rijk aan bloemige verbindingen en enzymen, gewaardeerd om het verkwikkende aroma en prachtig levendige karakter.'],
      lede: ['Bright and beautifully aromatic — bees gather nectar straight from the white spring blossom of Greek orange groves.', 'Helder en prachtig aromatisch — bijen verzamelen nectar rechtstreeks uit de witte voorjaarsbloesem van Griekse sinaasappelgaarden.'],
      origin: ['Every spring, orange groves across Greece bloom with fragrant white flowers while bees gather nectar directly from the blossoms.', 'Elke lente bloeien sinaasappelgaarden door heel Griekenland met geurige witte bloemen, terwijl bijen rechtstreeks nectar verzamelen uit de bloesems.'],
      result: ['The result is a bright and beautifully aromatic honey with fresh floral sweetness and delicate citrus notes.', 'Het resultaat is een heldere en prachtig aromatische honing met een frisse bloemige zoetheid en subtiele citrustonen.'],
      tagline: ['A taste of the Greek spring.', 'Een proeverij van de Griekse lente.'] },
    'acacia': { greek: 'Akakía',
      color: ['Pale gold', 'Bleekgoud'], aroma: ['Soft floral', 'Zacht bloemig'],
      texture: ['Silky and smooth', 'Zijdezacht en glad'], crystal: ['Very slow', 'Zeer langzaam'],
      sweetness: ['Gentle and clean', 'Zacht en zuiver'],
      natural: ['Naturally high in fructose and rich in enzymes, helping preserve its liquid texture and delicate sweetness for longer.', 'Van nature hoog in fructose en rijk aan enzymen, wat helpt de vloeibare textuur en fijne zoetheid langer te behouden.'],
      lede: ['Prized for its clarity and elegant sweetness — a beautifully soft floral aroma with a clean, smooth finish.', 'Geliefd om de helderheid en elegante zoetheid — een prachtig zacht bloemig aroma met een zuivere, gladde afdronk.'],
      origin: ['During spring, bees gather nectar from the delicate white blossoms of acacia trees blooming throughout the Greek countryside.', 'In de lente verzamelen bijen nectar uit de fijne witte bloesem van acaciabomen die overal op het Griekse platteland bloeien.'],
      result: ['Known for its clarity and elegant sweetness, Acacia honey has a beautifully soft floral aroma and smooth finish.', 'Acaciahoning staat bekend om zijn helderheid en elegante zoetheid, met een prachtig zacht bloemig aroma en gladde afdronk.'],
      tagline: ['A wonderfully refined Greek honey.', 'Een heerlijk verfijnde Griekse honing.'] },
    'thyme': { greek: 'Thymári',
      color: ['Golden amber', 'Goudkleurig amber'], aroma: ['Herbal and intensely floral', 'Kruidig en intens bloemig'],
      texture: ['Smooth and rich', 'Glad en rijk'], crystal: ['Natural over time', 'Natuurlijk na verloop van tijd'],
      sweetness: ['Warm and balanced', 'Warm en gebalanceerd'],
      natural: ['Naturally rich in thymol, aromatic essential oils and antioxidants, traditionally valued for its botanical richness.', 'Van nature rijk aan thymol, aromatische etherische oliën en antioxidanten, traditioneel gewaardeerd om zijn botanische rijkdom.'],
      lede: ['One of Greece’s most iconic honeys — golden and aromatic, from wild thyme on sun-baked islands and hillsides.', 'Een van Griekenlands meest iconische honingsoorten — goudkleurig en aromatisch, van wilde tijm op zonovergoten eilanden en hellingen.'],
      origin: ['Under the warm Mediterranean sun, bees collect nectar from wild thyme growing across Greek islands, rocky hillsides and mountain landscapes.', 'Onder de warme mediterrane zon verzamelen bijen nectar van wilde tijm die groeit op Griekse eilanden, rotsachtige hellingen en berglandschappen.'],
      result: ['This creates one of Greece’s most iconic honeys — golden, aromatic and deeply Mediterranean.', 'Dit resulteert in een van Griekenlands meest iconische honingsoorten — goudkleurig, aromatisch en doorleefd mediterraan.'],
      tagline: ['The essence of the Greek summer.', 'De essentie van de Griekse zomer.'] },
    'heather': { greek: 'Sousoúra',
      color: ['Amber to reddish amber', 'Amber tot roodachtig amber'], aroma: ['Floral and warm', 'Bloemig en warm'],
      texture: ['Thick and creamy', 'Dik en romig'], crystal: ['Fast and natural', 'Snel en natuurlijk'],
      sweetness: ['Rich and balanced', 'Rijk en gebalanceerd'],
      natural: ['Naturally rich in minerals and antioxidants, with a naturally creamy texture due to its glucose composition.', 'Van nature rijk aan mineralen en antioxidanten, met een van nature romige textuur dankzij de glucosesamenstelling.'],
      lede: ['A rich, naturally creamy honey with beautiful depth — bees gather nectar from thousands of tiny heather blossoms across the Greek hills.', 'Een rijke, van nature romige honing met prachtige diepte — bijen verzamelen nectar uit duizenden kleine heidebloesems op de Griekse heuvels.'],
      origin: ['When wild heather blooms across the Greek hills and mountains, bees gather nectar from thousands of tiny blossoms.', 'Wanneer wilde heide bloeit op de Griekse heuvels en bergen, verzamelen bijen nectar uit duizenden kleine bloesems.'],
      result: ['Heather honey develops a rich floral aroma and a naturally creamy texture with beautiful depth.', 'Heidehoning ontwikkelt een rijk bloemig aroma en een van nature romige textuur met prachtige diepte.'],
      tagline: ['A beautiful raw Greek honey full of life.', 'Een prachtige rauwe Griekse honing vol leven.'] }
  };

  /* small stroked icons for the tasting rows (no emoji) */
  var SPEC_ICONS = {
    aroma:   '<path d="M5 13c3-1 4-3 4-6M9 13c3-1 4-3 4-6M13 13c3-1 4-3 4-6" /><path d="M4 17h15" />',
    texture: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" />',
    sweetness:'<path d="M12 3v18M5 8c2-2 5-2 7 0 2-2 5-2 7 0M5 14c2-2 5-2 7 0 2-2 5-2 7 0" />',
    crystal: '<path d="M12 3l2.5 4.3 4.9.4-3.7 3.2 1.1 4.8L12 13.6 7.2 16l1.1-4.8L4.6 8l4.9-.4z" />',
    color:   '<circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 0 0 16" />'
  };
  function specRow(icon, label, val) {
    return '<li><span class="pdb-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + (SPEC_ICONS[icon] || '') + '</svg></span>' +
      '<span class="pdb-k">' + label + '</span><span class="pdb-v">' + val + '</span></li>';
  }
  function benefitsPanelHTML(slug) {
    var s = HONEY_SPEC[slug]; if (!s) return '';
    return '<div class="pd-benefits" id="pdBenefits" aria-label="' + L('Tasting profile', 'Smaakprofiel') + '">' +
      '<div class="pdb-head">' + L('Tasting profile', 'Smaakprofiel') + '</div>' +
      '<ul class="pdb-list">' +
        specRow('aroma', L('Aroma', 'Aroma'), L(s.aroma[0], s.aroma[1])) +
        specRow('texture', L('Texture', 'Textuur'), L(s.texture[0], s.texture[1])) +
        specRow('sweetness', L('Sweetness', 'Zoetheid'), L(s.sweetness[0], s.sweetness[1])) +
        specRow('crystal', L('Crystallisation', 'Kristallisatie'), L(s.crystal[0], s.crystal[1])) +
        specRow('color', L('Colour', 'Kleur'), L(s.color[0], s.color[1])) +
      '</ul>' +
      '<p class="pdb-natural">' + L(s.natural[0], s.natural[1]) + '</p>' +
    '</div>';
  }
  function originSectionHTML(slug) {
    var s = HONEY_SPEC[slug]; if (!s) return '';
    // The full origin/character story now lives at the TOP of the page
    // (#pdStory, filled by hydrateInfo) — this lower section is only the
    // distilled editorial statement, so the copy never appears twice.
    return '<section class="px-section px-origin" aria-label="' + L('Origin', 'Herkomst') + '">' +
      '<div class="px-origin-inner">' +
        '<span class="px-eyebrow">' + L('From the mountains of Greece', 'Uit de bergen van Griekenland') + '</span>' +
        '<h2 class="px-title">' + L(s.tagline[0], s.tagline[1]) + '</h2>' +
      '</div>' +
    '</section>';
  }

  /* Honeys with a full 3-shot gallery (hero + origin + serving), generated per-honey */
  var GALLERY_SET = ['chestnut', 'pine', 'arbutus', 'fir-vanilla', 'orange-blossom', 'acacia', 'thyme'];

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

  /* Per-honey content: title, metadata line, lede, breadcrumb, gallery image,
     add-to-cart slug. Driven from HONEY_SPEC + the catalog, so every honey jar
     shows its own correct copy. Re-runs on language switch. */
  function hydrateInfo(slug) {
    var s = HONEY_SPEC[slug]; if (!s) return;
    var p = window.HD_product && window.HD_product(slug);
    var name = (p && p.name) || slug;
    var nl = (window.HD_lang && window.HD_lang() === 'nl');
    function setHTML(sel, html) { var el = document.querySelector(sel); if (!el) return; el.removeAttribute('data-i18n'); el.removeAttribute('data-i18n-html'); el.innerHTML = html; }
    setHTML('.pd-eyebrow', (nl ? 'Editie I' : 'Edition I') + ' <span class="dot"></span> ' + (nl ? 'Oogst 2025' : 'Harvest 2025') + ' <span class="dot"></span> ' + (nl ? 'Griekse honing' : 'Greek honey'));
    setHTML('.pd-title', name + ', <em>' + s.greek + '.</em>');
    var le = document.querySelector('.pd-lede'); if (le) { le.removeAttribute('data-i18n'); le.textContent = L(s.lede[0], s.lede[1]); }
    // The full product story (origin + character), top of the buy column.
    var st = document.getElementById('pdStory');
    if (st) st.innerHTML = '<p>' + L(s.origin[0], s.origin[1]) + '</p>' + (s.result ? '<p>' + L(s.result[0], s.result[1]) + '</p>' : '');
    var cr = document.querySelector('.crumbs strong'); if (cr) { cr.removeAttribute('data-i18n'); cr.textContent = (nl ? 'Editie I · ' : 'Edition I · ') + name; }
    var cta = document.querySelector('.pd-cta[data-add-to-cart]'); if (cta) cta.setAttribute('data-add-to-cart', slug);
    // Per-honey pricing: keep size keys (480g/950g) so the Shopify variant map
    // still resolves; only the displayed amounts follow the honey.
    if (p && p.sizes && p.sizes.length) {
      var radios = document.querySelectorAll('input[name="hd-variant"]');
      p.sizes.forEach(function (sz, i) { if (radios[i] && sz.price != null) radios[i].dataset.price = sz.price; });
      var checked = document.querySelector('input[name="hd-variant"]:checked') || radios[0];
      var pr = document.getElementById('productPrice');
      if (pr && checked && checked.dataset.price) pr.textContent = '€' + checked.dataset.price;
    }
    if (p && p.image) {
      var hasGallery = GALLERY_SET.indexOf(slug) !== -1;
      var ASSET_V = '?v=hd-2026-06-06-164';
      var base = 'assets/products-images/' + slug;
      var originSrc = base + '-origin.webp' + ASSET_V;
      var servingSrc = base + '-serving.webp' + ASSET_V;
      var main0 = document.querySelector('#pdgMain img[data-slide="0"]');
      var main1 = document.querySelector('#pdgMain img[data-slide="1"]');
      var main2 = document.querySelector('#pdgMain img[data-slide="2"]');
      if (main0) { main0.src = p.image; main0.alt = name; main0.classList.add('active'); }
      if (main1) {
        main1.classList.remove('active');
        if (hasGallery) { main1.src = originSrc; main1.alt = L(name + ', origin', name + ', herkomst'); main1.style.display = ''; }
        else main1.style.display = 'none';
      }
      if (main2) {
        main2.classList.remove('active');
        if (hasGallery) { main2.src = servingSrc; main2.alt = L(name + ', served', name + ', geserveerd'); main2.style.display = ''; }
        else main2.style.display = 'none';
      }
      var thumbs = document.getElementById('pdgThumbs');
      if (thumbs) {
        thumbs.style.display = hasGallery ? '' : 'none';
        thumbs.querySelectorAll('.pdg-thumb').forEach(function (btn, i) {
          btn.classList.toggle('active', i === 0);
          var img = btn.querySelector('img');
          if (img) img.src = i === 0 ? p.image : (i === 1 ? originSrc : servingSrc);
        });
      }
    }
  }

  function init() {
    var meta = document.querySelector('meta[name="hd-product-slug"]');
    if (!meta || !meta.content) return; // not a product page
    if (document.getElementById('pxExtras')) return;
    var slug = meta.content;
    var d = getDetail(slug);

    // Honey product pages: per-honey copy + premium tasting panel under price
    if (HONEY_SPEC[slug]) {
      try { hydrateInfo(slug); } catch (e) {}
      var priceBlock = document.querySelector('.pd-price-block');
      if (priceBlock && !document.getElementById('pdBenefits')) {
        // Tasting card sits BELOW the product story when present (price →
        // story → tasting profile), else directly after the price block.
        var storyAnchor = document.getElementById('pdStory') || priceBlock;
        storyAnchor.insertAdjacentHTML('afterend', benefitsPanelHTML(slug));
      }
      window.addEventListener('hd:lang', function () {
        try { hydrateInfo(slug); } catch (e) {}
        var b = document.getElementById('pdBenefits');
        if (b) { b.insertAdjacentHTML('beforebegin', benefitsPanelHTML(slug)); b.remove(); }
      });
    }

    var wrap = document.createElement('div');
    wrap.id = 'pxExtras';
    wrap.innerHTML = compositionHTML(d) + originSectionHTML(slug) + pairsHTML(slug) + bundleHTML(slug) + faqHTML(d);

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
