/* =================================================================
   Harvest Deli, Product storytelling (Phase 2)
   -----------------------------------------------------------------
   Injects premium editorial sections onto product pages from a small
   content model keyed by product slug (read from <meta hd-product-slug>):
     • Composition, ingredients, allergens, nutrition table
     • Pairs well with, curated complementary products
     • The Ritual Saving promo (image + real HTML overlay, links to the shop)
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
    /* Wildflower: only what the supplier sheet states (raw, unfiltered,
       nothing added); "unpasteurised" from the generic honey copy is not on it. */
    'wildflower': {
      ingredients: L('100% raw, unfiltered Greek honey. Nothing added.', '100% rauwe, ongefilterde Griekse honing. Niets toegevoegd.'),
      allergens: L('Honey is not suitable for children under 12 months.', 'Honing is niet geschikt voor kinderen jonger dan 12 maanden.'),
      nutritionLabel: L('Per 100 g', 'Per 100 g'),
      nutrition: HONEY_NUTRITION,
      faqs: [
        [L('What is wildflower honey?', 'Wat is bloesemhoning?'),
         L('Wildflower honey, anthómelo in Greek, comes from bees gathering nectar from many different wildflowers rather than a single plant. So you taste not one flower, but the whole landscape in balance.',
           'Bloesemhoning, in het Grieks anthómelo, ontstaat wanneer bijen nectar verzamelen van verschillende wilde bloemen in plaats van één enkele plant. Je proeft daardoor niet één bloem, maar het samenspel van het landschap.')],
        [L('Is this honey raw?', 'Is deze honing rauw?'),
         L('Yes. This wildflower honey is raw and unfiltered, with nothing added. It stays just as the bees make it.',
           'Ja. Deze bloesemhoning is rauw en ongefilterd, zonder toevoegingen. Zo blijft de honing zoals de bijen hem maken.')],
        [L('Why is my honey thickening?', 'Waarom wordt mijn honing vaster?'),
         L('Crystallisation is a natural process in honey, and this wildflower honey crystallises relatively slowly. To make it liquid again, stand the jar in lukewarm water for a while. Never heat honey strongly.',
           'Kristallisatie is een natuurlijk proces bij honing. Deze bloesemhoning kristalliseert relatief langzaam. Wil je hem weer vloeibaar, zet de pot dan even in lauwwarm water. Verhit honing nooit sterk.')],
        [L('How should I store it?', 'Hoe bewaar ik de honing?'),
         L('Tightly closed, dry and out of direct sunlight, at room temperature. In the fridge, honey thickens faster.',
           'Goed gesloten, droog en uit direct zonlicht, op kamertemperatuur. In de koelkast wordt honing sneller vast.')]
      ]
    },
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
    },
    'chamomile-tea': {
      ingredients: L('100% wild Greek chamomile flowers (Matricaria chamomilla), gently dried whole.',
                     '100% wilde Griekse kamillebloemen (Matricaria chamomilla), heel en zacht gedroogd.'),
      allergens: L('Naturally caffeine free. Free from gluten, dairy and nuts.', 'Van nature cafeïnevrij. Vrij van gluten, zuivel en noten.'),
      nutritionLabel: L('Per cup (brewed)', 'Per kop (gezet)'),
      nutrition: [['Energy', '0 kJ / 0 kcal'], ['Caffeine', L('None', 'Geen')], ['Fat', '0 g'], ['Sugars', '0 g'], ['Salt', '0 g']],
      faqs: [
        [L('How do I brew it?', 'Hoe zet ik het?'),
         L('Steep 1–2 spoonfuls of flowers in water at 90–95°C for 5–7 minutes. Lovely on its own, or with a spoon of honey or a slice of lemon.',
           'Laat 1–2 lepels bloemen 5–7 minuten trekken in water van 90–95°C. Heerlijk puur, of met een lepel honing of een schijfje citroen.')],
        [L('Is it really caffeine free?', 'Is het echt cafeïnevrij?'),
         L('Yes, chamomile is a herbal infusion, naturally caffeine free and soft enough for the evening or before sleep.',
           'Ja, kamille is een kruideninfusie, van nature cafeïnevrij en zacht genoeg voor de avond of voor het slapen.')]
      ]
    }
  };

  var PAIRS = {
    'chestnut': ['mountain-tea', 'olive-oil', 'thyme'],
    'olive-oil': ['chestnut', 'thyme', 'mountain-tea'],
    'mountain-tea': ['chestnut', 'acacia', 'orange-blossom'],
    'chamomile-tea': ['acacia', 'orange-blossom', 'mountain-tea'],
    /* the other light, floral honeys of the line */
    'wildflower': ['orange-blossom', 'acacia', 'thyme']
  };

  /* ---- Per-honey tasting spec (source of truth: Harvest Deli honey PDF) ----
     Each field is [EN, NL]. Properties are verbatim per honey type so no jar
     ever shows another honey's character. */
  /* color/aroma/texture/crystal/sweetness/origin/result/tagline are
     verbatim from the Harvest Deli Greek Honey Collection text document
     (EN side); NL side is a faithful translation, since the source PDF is
     English-only. Do not paraphrase EN when updating, copy it exactly. */
  var HONEY_SPEC = {
    'chestnut': { greek: 'Kástano',
      color: ['Dark amber', 'Donker amber'], aroma: ['Warm and woody', 'Warm en houtachtig'],
      texture: ['Thick and rich', 'Dik en rijk'], crystal: ['Slow to medium', 'Langzaam tot gemiddeld'],
      sweetness: ['Rich and rounded', 'Rijk en rond'],
      lede: ['A dark, slow-pouring honey from chestnut forests high in the Greek mountains, warm, woody and layered, with a long finish.', 'Een donkere, traag vloeiende honing uit kastanjebossen hoog in de Griekse bergen, warm, houtachtig en gelaagd, met een lange afdronk.'],
      origin: ['In early summer, bees collect nectar from blooming chestnut trees growing in Greek mountain forests.', 'In de vroege zomer verzamelen bijen nectar van bloeiende kastanjebomen in de Griekse bergbossen.'],
      result: ['Chestnut honey is rich and beautifully layered, with warm woody aromas and long-lasting depth.', 'Kastanjehoning is rijk en prachtig gelaagd, met warme houtachtige aroma’s en een langdurige diepte.'],
      tagline: ['A mountain honey full of character.', 'Een berghoning vol karakter.'] },
    'pine': { greek: 'Péfko',
      color: ['Amber to dark amber', 'Amber tot donker amber'], aroma: ['Resinous and warm', 'Harsachtig en warm'],
      texture: ['Thick and smooth', 'Dik en glad'], crystal: ['Very slow', 'Zeer langzaam'],
      sweetness: ['Mild and balanced', 'Mild en gebalanceerd'],
      lede: ['A traditional Greek pinewood honey, bees gather honeydew among the pines, sea air and sunshine. Smooth-bodied and naturally balanced.', 'Een traditionele Griekse dennenhoning, bijen verzamelen honingdauw tussen de dennen, zeelucht en zon. Soepel van body en van nature in balans.'],
      origin: ['Produced in the pine forests of Greece, where bees gather honeydew from pine trees surrounded by sea air and sunshine.', 'Geproduceerd in de dennenbossen van Griekenland, waar bijen honingdauw verzamelen van dennenbomen, omringd door zeelucht en zon.'],
      result: ['Pine honey is one of Greece’s most loved traditional varieties, known for its smooth body and naturally balanced flavor.', 'Dennenhoning is een van Griekenlands meest geliefde traditionele soorten, bekend om zijn zachte body en van nature gebalanceerde smaak.'],
      tagline: ['A timeless taste of Greece.', 'Een tijdloze smaak van Griekenland.'] },
    'oak': { greek: 'Velanídi',
      color: ['Dark amber to brown', 'Donker amber tot bruin'], aroma: ['Woody and warm', 'Houtachtig en warm'],
      texture: ['Dense and smooth', 'Dicht en glad'], crystal: ['Very slow', 'Zeer langzaam'],
      sweetness: ['Mild and full-bodied', 'Mild en vol'],
      lede: ['A dark forest honeydew honey from the oak woods of Greece, rich, smooth and full-bodied, with deep forest aromas.', 'Een donkere boshoning (honingdauw) uit de eikenbossen van Griekenland, rijk, glad en vol, met diepe bosaroma’s.'],
      origin: ['Collected from the majestic oak forests of Greece, this honey begins when bees gather honeydew found naturally on oak trees in mountain and woodland landscapes.', 'Verzameld uit de statige eikenbossen van Griekenland, ontstaat deze honing wanneer bijen honingdauw verzamelen die van nature voorkomt op eikenbomen in berg- en boslandschappen.'],
      result: ['Oak honey is rich, smooth and full-bodied, with deep forest aromas and remarkable depth. Its dark color and naturally dense texture make it one of Greece’s most distinctive honeys.', 'Eikenhoning is rijk, glad en vol, met diepe bosaroma’s en een opmerkelijke diepte. De donkere kleur en van nature dichte textuur maken het een van Griekenlands meest onderscheidende honingsoorten.'],
      tagline: ['A beautifully rich Greek forest honey with depth and elegance.', 'Een prachtig rijke Griekse boshoning met diepte en elegantie.'] },
    'arbutus': { greek: 'Koumariá',
      color: ['Deep amber', 'Diep amber'], aroma: ['Herbal and earthy', 'Kruidig en aards'],
      texture: ['Dense and rich, often naturally creamy', 'Dicht en rijk, vaak van nature romig'], crystal: ['Natural over time', 'Natuurlijk na verloop van tijd'],
      sweetness: ['Low and balanced', 'Laag en gebalanceerd'],
      lede: ['One of Greece’s rarest nectars from the late-flowering wild strawberry tree, distinctly bittersweet, herbal and beautifully complex.', 'Een van Griekenlands zeldzaamste nectars van de laatbloeiende aardbeiboom, uitgesproken bitterzoet, kruidig en prachtig complex.'],
      origin: ['As autumn settles over the Greek countryside and most summer blooms begin to fade, bees continue their work among the blossoms of the wild strawberry tree, known in Greece as Koumaria. Growing naturally across Mediterranean hillsides and forests, this remarkable tree flowers late in the season, offering bees access to one of Greece’s rarest nectars.', 'Terwijl de herfst neerdaalt over het Griekse platteland en de meeste zomerbloesems beginnen te vervagen, gaan bijen door met hun werk tussen de bloesems van de aardbeiboom, in Griekenland bekend als Koumaria. Deze opmerkelijke boom groeit van nature op mediterrane hellingen en in bossen en bloeit laat in het seizoen, waardoor bijen toegang krijgen tot een van Griekenlands zeldzaamste nectars.'],
      result: ['Arbutus honey is known for its distinctive bittersweet character, aromatic herbal depth and beautifully complex finish. Less sweet than many floral honeys, it offers a truly memorable tasting experience.', 'Arbutushoning staat bekend om zijn kenmerkende bitterzoete karakter, aromatische kruidige diepte en prachtig complexe afdronk. Minder zoet dan veel bloemige honingsoorten, biedt het een werkelijk gedenkwaardige smaakervaring.'],
      tagline: ['A truly exceptional Greek honey with unforgettable character.', 'Een werkelijk uitzonderlijke Griekse honing met onvergetelijk karakter.'] },
    'fir-vanilla': { greek: 'Elátis Vanília',
      color: ['Pearl-golden amber', 'Parelgouden amber'], aroma: ['Gentle and resinous', 'Zacht en harsachtig'],
      texture: ['Thick, silky and glossy', 'Dik, zijdezacht en glanzend'], crystal: ['Extremely slow', 'Extreem langzaam'],
      sweetness: ['Smooth and balanced', 'Zacht en gebalanceerd'],
      lede: ['A rare fir honeydew honey from the high Greek mountains, naturally glossy and silky, with elegant vanilla-like notes.', 'Een zeldzame sparrenhoning (honingdauw) uit de hoge Griekse bergen, van nature glanzend en zijdezacht, met elegante vanille-achtige tonen.'],
      origin: ['High in the Greek mountains, bees gather honeydew from fir trees surrounded by fresh air and untouched nature.', 'Hoog in de Griekse bergen verzamelen bijen honingdauw van sparrenbomen, omringd door frisse lucht en ongerepte natuur.'],
      result: ['This rare honey is famous for its naturally glossy appearance, silky texture and elegant flavor with delicate vanilla-like notes.', 'Deze zeldzame honing staat bekend om zijn van nature glanzende uiterlijk, zijdezachte textuur en elegante smaak met subtiele vanille-achtige tonen.'],
      tagline: ['One of the treasures of Greek honey.', 'Een van de schatten van Griekse honing.'] },
    'orange-blossom': { greek: 'Portokáli',
      color: ['Light golden amber', 'Lichtgouden amber'], aroma: ['Floral with citrus blossom notes', 'Bloemig met citrusbloesemtonen'],
      texture: ['Smooth and flowing', 'Glad en vloeiend'], crystal: ['Natural over time', 'Natuurlijk na verloop van tijd'],
      sweetness: ['Bright and gentle', 'Helder en zacht'],
      lede: ['Bright and beautifully aromatic, bees gather nectar straight from the white spring blossom of Greek orange groves.', 'Helder en prachtig aromatisch, bijen verzamelen nectar rechtstreeks uit de witte voorjaarsbloesem van Griekse sinaasappelgaarden.'],
      origin: ['Every spring, orange groves across Greece bloom with fragrant white flowers while bees gather nectar directly from the blossoms.', 'Elke lente bloeien sinaasappelgaarden door heel Griekenland met geurige witte bloemen, terwijl bijen rechtstreeks nectar verzamelen uit de bloesems.'],
      result: ['The result is a bright and beautifully aromatic honey with fresh floral sweetness and delicate citrus notes.', 'Het resultaat is een heldere en prachtig aromatische honing met een frisse bloemige zoetheid en subtiele citrustonen.'],
      tagline: ['A taste of the Greek spring.', 'Een proeverij van de Griekse lente.'] },
    'acacia': { greek: 'Akakía',
      color: ['Pale gold', 'Bleekgoud'], aroma: ['Soft floral', 'Zacht bloemig'],
      texture: ['Silky and smooth', 'Zijdezacht en glad'], crystal: ['Very slow', 'Zeer langzaam'],
      sweetness: ['Gentle and clean', 'Zacht en zuiver'],
      lede: ['Prized for its clarity and elegant sweetness, a beautifully soft floral aroma with a clean, smooth finish.', 'Geliefd om de helderheid en elegante zoetheid, een prachtig zacht bloemig aroma met een zuivere, gladde afdronk.'],
      origin: ['During spring, bees gather nectar from the delicate white blossoms of acacia trees blooming throughout the Greek countryside.', 'In de lente verzamelen bijen nectar uit de fijne witte bloesem van acaciabomen die overal op het Griekse platteland bloeien.'],
      result: ['Known for its clarity and elegant sweetness, Acacia honey has a beautifully soft floral aroma and smooth finish.', 'Acaciahoning staat bekend om zijn helderheid en elegante zoetheid, met een prachtig zacht bloemig aroma en gladde afdronk.'],
      tagline: ['A wonderfully refined Greek honey.', 'Een heerlijk verfijnde Griekse honing.'] },
    'thyme': { greek: 'Thymári',
      color: ['Golden amber', 'Goudkleurig amber'], aroma: ['Herbal and intensely floral', 'Kruidig en intens bloemig'],
      texture: ['Smooth and rich', 'Glad en rijk'], crystal: ['Natural over time', 'Natuurlijk na verloop van tijd'],
      sweetness: ['Warm and balanced', 'Warm en gebalanceerd'],
      lede: ['One of Greece’s most iconic honeys, golden and aromatic, from wild thyme on sun-baked islands and hillsides.', 'Een van Griekenlands meest iconische honingsoorten, goudkleurig en aromatisch, van wilde tijm op zonovergoten eilanden en hellingen.'],
      origin: ['Under the warm Mediterranean sun, bees collect nectar from wild thyme growing across Greek islands, rocky hillsides and mountain landscapes.', 'Onder de warme mediterrane zon verzamelen bijen nectar van wilde tijm die groeit op Griekse eilanden, rotsachtige hellingen en berglandschappen.'],
      result: ['This creates one of Greece’s most iconic honeys, golden, aromatic and deeply Mediterranean.', 'Dit resulteert in een van Griekenlands meest iconische honingsoorten, goudkleurig, aromatisch en doorleefd mediterraan.'],
      tagline: ['The essence of the Greek summer.', 'De essentie van de Griekse zomer.'] },
    'heather': { greek: 'Sousoúra',
      color: ['Amber to reddish amber', 'Amber tot roodachtig amber'], aroma: ['Floral and warm', 'Bloemig en warm'],
      texture: ['Thick and creamy', 'Dik en romig'], crystal: ['Fast and natural', 'Snel en natuurlijk'],
      sweetness: ['Rich and balanced', 'Rijk en gebalanceerd'],
      lede: ['A rich, naturally creamy honey with beautiful depth, bees gather nectar from thousands of tiny heather blossoms across the Greek hills.', 'Een rijke, van nature romige honing met prachtige diepte, bijen verzamelen nectar uit duizenden kleine heidebloesems op de Griekse heuvels.'],
      origin: ['When wild heather blooms across the Greek hills and mountains, bees gather nectar from thousands of tiny blossoms.', 'Wanneer wilde heide bloeit op de Griekse heuvels en bergen, verzamelen bijen nectar uit duizenden kleine bloesems.'],
      result: ['Heather honey develops a rich floral aroma and a naturally creamy texture with beautiful depth.', 'Heidehoning ontwikkelt een rijk bloemig aroma en een van nature romige textuur met prachtige diepte.'],
      tagline: ['A beautiful raw Greek honey full of life.', 'Een prachtige rauwe Griekse honing vol leven.'] },
    /* Wildflower (anthómelo), from the supplier sheet "Greek Blossom Honey /
       Griekse Bloesemhoning (Anthomelo)" (10-10-2026): raw and unfiltered,
       mountains and fields of Greece, thyme/oregano/citrus/wild herbs and
       other seasonal flowers, harvested in spring and early summer. The
       sheet's health claims are left out (EU 1924/2006). English written after
       the Dutch approval (10-10-2026). */
    'wildflower': { greek: 'Anthómelo',
      color: ['Light amber to golden', 'Licht amber tot goudkleurig'], aroma: ['Fresh, floral and balanced', 'Fris, bloemig en in balans'],
      texture: ['Smooth, creamy and velvety', 'Glad, romig en fluweelzacht'], crystal: ['Natural and relatively slow', 'Natuurlijk en relatief langzaam'],
      sweetness: ['Mild and delicately sweet', 'Mild en subtiel zoet'],
      lede: ['Raw honey from Greek wildflowers. Mild, floral and delicately sweet.', 'Rauwe honing van wilde Griekse bloemen. Mild, bloemig en subtiel zoet.'],
      origin: ['Greece. Bees gather nectar from wildflowers across the mountains and fields of Greece: thyme, oregano, citrus blossom, wild herbs and many other seasonal flowers. Harvested in spring and early summer.', 'Griekenland. Bijen verzamelen nectar van wilde bloemen in de bergen en velden van Griekenland: tijm, oregano, citrusbloesem, wilde kruiden en vele andere seizoensbloemen. Geoogst in het voorjaar en de vroege zomer.'],
      result: ['Raw, unfiltered blossom honey, known in Greece as anthómelo, made from the nectar of many different wildflowers. The result is a unique, well-balanced honey with a delicate floral profile: mild and delicately sweet, fresh in aroma, light amber to golden, and smooth, creamy and velvety.', 'Rauwe, ongefilterde bloesemhoning, in Griekenland anthómelo genoemd, van de nectar van uiteenlopende wilde bloemen. Het resultaat is een unieke, evenwichtige honing met een fijn bloemig profiel: mild en subtiel zoet, fris van aroma, licht amber tot goudkleurig en glad, romig en fluweelzacht.'],
      tagline: ['A taste of Greek nature in every spoonful.', 'Een vleugje Griekse natuur in iedere lepel.'] }
  };

  /* Read by scripts/build-product-pages.mjs, which writes each honey page with
     this content already in the HTML. */
  window.HD_HONEY_SPEC = HONEY_SPEC;

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
  /* ---- Per-product HIGHLIGHTS (bubbles around the jar + the full list as
     text under the tasting profile). Keyed by product slug, {en:[], nl:[]}.

     Only factual points: origin, harvest, taste, texture, crystallisation,
     how it is made. NO health, nutrition or medical claims. The EU allows no
     health claims for honey (Reg. 1924/2006), and Google Merchant rejects
     them. The flyer texts this replaced ("ondersteunt het immuunsysteem",
     "helpt bij een goede nachtrust", "geschikt voor kinderen", "rijk aan
     mineralen") must not come back. Honey is not suitable for babies under
     12 months; that warning sits with the ingredients and allergens. ---- */
  var PRODUCT_BENEFITS = {
    'chestnut': {
      en: ['From Greek mountain chestnut forests', 'Warm, woody and layered', 'Thick, rich and dark amber', 'Raw, cold-extracted, unfiltered', '100% honey, nothing added'],
      nl: ['Uit Griekse kastanjebossen in de bergen', 'Warm, houtachtig en gelaagd', 'Dik, rijk en donker amber', 'Rauw, koud geslingerd, ongefilterd', '100% honing, niets toegevoegd'] },
    'pine': {
      en: ['Honeydew from Greek pine forests', 'Resinous and warm', 'Smooth body, mild sweetness', 'Crystallises very slowly', '100% honey, nothing added'],
      nl: ['Honingdauw uit Griekse dennenbossen', 'Harsachtig en warm', 'Zachte body, milde zoetheid', 'Kristalliseert zeer langzaam', '100% honing, niets toegevoegd'] },
    'oak': {
      en: ['Honeydew from Greek oak forests', 'Deep, woody forest aroma', 'Dense, smooth and full-bodied', 'Crystallises very slowly', '100% honey, nothing added'],
      nl: ['Honingdauw uit Griekse eikenbossen', 'Diep, houtachtig bosaroma', 'Dicht, glad en vol', 'Kristalliseert zeer langzaam', '100% honing, niets toegevoegd'] },
    'arbutus': {
      en: ['A rare late-autumn harvest', 'From the wild strawberry tree', 'Bittersweet and herbal', 'Less sweet than most honeys', '100% honey, nothing added'],
      nl: ['Een zeldzame oogst in de late herfst', 'Van de wilde aardbeiboom', 'Bitterzoet en kruidig', 'Minder zoet dan de meeste honing', '100% honing, niets toegevoegd'] },
    'fir-vanilla': {
      en: ['Fir honeydew from the high mountains', 'Delicate vanilla-like notes', 'Glossy and silky', 'Stays liquid for a very long time', '100% honey, nothing added'],
      nl: ['Sparrenhoningdauw uit de hoge bergen', 'Subtiele vanille-achtige tonen', 'Glanzend en zijdezacht', 'Blijft heel lang vloeibaar', '100% honing, niets toegevoegd'] },
    'orange-blossom': {
      en: ['From Greek orange groves in spring', 'Fresh citrus-blossom aroma', 'Bright, gentle sweetness', 'Light golden amber', '100% honey, nothing added'],
      nl: ['Uit Griekse sinaasappelgaarden in de lente', 'Fris aroma van citrusbloesem', 'Heldere, zachte zoetheid', 'Lichtgouden amber', '100% honing, niets toegevoegd'] },
    'acacia': {
      en: ['From spring acacia blossom', 'Soft floral and clean', 'Mild, gentle sweetness', 'Stays liquid for a long time', '100% honey, nothing added'],
      nl: ['Van voorjaarsbloesem van de acacia', 'Zacht bloemig en zuiver', 'Mild en zacht zoet', 'Blijft lang vloeibaar', '100% honing, niets toegevoegd'] },
    'heather': {
      en: ['From wild heather on Greek hills', 'Floral and warm', 'Naturally creamy texture', 'Raw and unfiltered', '100% honey, nothing added'],
      nl: ['Van wilde heide op de Griekse heuvels', 'Bloemig en warm', 'Van nature romige textuur', 'Rauw en ongefilterd', '100% honing, niets toegevoegd'] },
    /* Order = the hotspots on the photo (see product-experience.js). */
    'wildflower': {
      en: ['100% Greek honey', 'Floral, gentle flavour', 'From Greek wildflowers', 'Raw and unfiltered', 'Versatile in the kitchen'],
      nl: ['100% Griekse honing', 'Bloemige, zachte smaak', 'Van wilde Griekse bloemen', 'Rauw en ongefilterd', 'Veelzijdig in gebruik'] },
    'thyme': {
      en: ['From wild Greek thyme', 'Herbal and intensely floral', 'Warm, balanced sweetness', 'A classic Greek variety', '100% honey, nothing added'],
      nl: ['Van wilde Griekse tijm', 'Kruidig en intens bloemig', 'Warme, gebalanceerde zoetheid', 'Een klassieke Griekse soort', '100% honing, niets toegevoegd'] },
    'olive-oil': {
      en: ['Cold-pressed extra virgin', 'Single-estate olives', 'Peppery, fresh finish', 'Harvested in Greece', '100% natural, no additives'],
      nl: ['Koudgeperst, extra vierge', 'Olijven van één landgoed', 'Peperige, frisse afdronk', 'Geoogst in Griekenland', '100% natuurlijk, zonder toevoegingen'] },
    'mountain-tea': {
      en: ['Wild-grown sideritis', 'Hand-harvested at altitude', 'Naturally caffeine free', 'Single origin from Greece', '100% natural, no additives'],
      nl: ['Wilde sideritis', 'Met de hand geoogst op hoogte', 'Van nature cafeïnevrij', 'Single origin uit Griekenland', '100% natuurlijk, zonder toevoegingen'] },
    'chamomile-tea': {
      en: ['Whole dried flowers', 'Naturally caffeine free', 'Soft and floral', 'Single origin from Greece', '100% natural, no additives'],
      nl: ['Hele gedroogde bloemen', 'Van nature cafeïnevrij', 'Zacht en bloemig', 'Single origin uit Griekenland', '100% natuurlijk, zonder toevoegingen'] },
    'oregano': {
      en: ['Wild-picked and sun-dried', 'Dried whole on the stem', 'Intensely aromatic', 'Single origin from Greece', '100% natural, no additives'],
      nl: ['Wild geplukt en zongedroogd', 'Heel gedroogd aan de steel', 'Intens aromatisch', 'Single origin uit Griekenland', '100% natuurlijk, zonder toevoegingen'] }
  };
  window.HD_PRODUCT_BENEFITS = PRODUCT_BENEFITS;

  /* Delicate 1.6px line marks (drop, leaf, hex, bloom, hills), cycled per bubble. */
  var BENEFIT_ICONS = [
    '<path d="M12 3c3.4 4 5.4 6.8 5.4 9.8a5.4 5.4 0 0 1-10.8 0C6.6 9.8 8.6 7 12 3z"/>',
    '<path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14z"/><path d="M5 19 12.5 11.5"/>',
    '<path d="M12 3l7 4v10l-7 4-7-4V7z"/>',
    '<circle cx="12" cy="12" r="3.1"/><path d="M12 3.5v3.2M12 17.3v3.2M3.5 12h3.2M17.3 12h3.2"/>',
    '<path d="M3 18l5-8 3.6 5.2L15 9l6 9z"/>'
  ];
  function benefitIcon(i) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      BENEFIT_ICONS[i % BENEFIT_ICONS.length] + '</svg>';
  }
  function benefitBubblesHTML(slug) {
    var cfg = PRODUCT_BENEFITS[slug]; if (!cfg) return '';
    var items = (L(cfg.en, cfg.nl) || cfg.en || []).slice(0, 5);
    if (!items.length) return '';
    var pos = ['b1', 'b2', 'b3', 'b4', 'b5'];
    var lis = items.map(function (t, i) {
      return '<li class="pd-benefit ' + pos[i] + '" style="transition-delay:' + (0.03 + i * 0.05).toFixed(3) + 's">' +
        benefitIcon(i) + '<span>' + t + '</span></li>';
    }).join('');
    return '<ul class="pd-benefit-layer" aria-label="' + L('Product highlights', 'Productkenmerken') + '">' + lis + '</ul>';
  }
  /* Full flyer list as real text. The image bubbles show only the opening
     items, so everything below the fold of the jar still needs to be
     readable, crawlable and translatable. */
  function benefitsListHTML(slug) {
    var cfg = PRODUCT_BENEFITS[slug]; if (!cfg) return '';
    var items = (L(cfg.en, cfg.nl) || cfg.en || []);
    if (!items.length) return '';
    return '<div class="pd-wellness" id="pdWellness">' +
      '<div class="pdw-head">' + L('Highlights', 'Kenmerken') + '</div>' +
      '<ul class="pdw-list">' + items.map(function (t) {
        return '<li>' + t + '</li>';
      }).join('') + '</ul></div>';
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
    '</div>';
  }
  function originSectionHTML(slug) {
    var s = HONEY_SPEC[slug]; if (!s) return '';
    // The full origin/character story now lives at the TOP of the page
    // (#pdStory, filled by hydrateInfo), this lower section is only the
    // distilled editorial statement, so the copy never appears twice.
    return '<section class="px-section px-origin" aria-label="' + L('Origin', 'Herkomst') + '">' +
      '<div class="px-origin-inner">' +
        '<span class="px-eyebrow">' + L('From the mountains of Greece', 'Uit de bergen van Griekenland') + '</span>' +
        '<h2 class="px-title">' + L(s.tagline[0], s.tagline[1]) + '</h2>' +
      '</div>' +
    '</section>';
  }

  /* Honeys with a full 3-shot gallery (hero + origin + serving), generated per-honey */
  var GALLERY_SET = ['chestnut', 'pine', 'oak', 'arbutus', 'fir-vanilla', 'orange-blossom', 'acacia', 'thyme', 'heather'];

  function getDetail(slug) {
    if (DETAILS[slug]) return DETAILS[slug];
    // any other honey slug → generic honey content
    return honeyDetail('Honey');
  }

  /* ---- builders ---- */
  function compositionHTML(d) {
    /* The nutrition table was removed at the client's request: the legally
       required declaration lives on the physical jar label, and the panel added
       little on a product page that is already rich in detail. */
    return '' +
    '<section class="px-section px-compose" aria-label="' + L('Composition', 'Samenstelling') + '">' +
      '<div class="px-head"><span class="px-eyebrow">' + L('The Particulars', 'Het Detail') + '</span>' +
        '<h2 class="px-title">' + L('What’s inside.', 'Wat erin zit.') + '</h2></div>' +
      '<div class="px-compose-grid px-compose-2">' +
        '<div class="px-card"><h4>' + L('Ingredients', 'Ingrediënten') + '</h4><p>' + d.ingredients + '</p></div>' +
        '<div class="px-card"><h4>' + L('Allergens', 'Allergenen') + '</h4><p>' + d.allergens + '</p></div>' +
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
      '<div class="px-pairs" data-ga-list="pairs|Past goed bij">' + cards + '</div>' +
    '</section>';
  }

  /* The Ritual Saving promo, image background + real HTML overlay (no baked-in
     text, no fixed product names, no mountain tea). Mirrors the live Shopify
     automatic discount: any 3 honeys, or 2 honeys + olive oil, save €5. */
  function ritualPromoHTML() {
    var bg = '/assets/products-images/thyme-serving.webp';   // lifestyle honey-drizzle image, text lives in HTML
    return '' +
    '<section class="px-section px-ritual" aria-label="' + L('Build your ritual', 'Stel je ritueel samen') + '">' +
      '<div class="px-ritual-card">' +
        '<div class="px-ritual-bg" style="background-image:url(\'' + bg + '\')" role="img" aria-label="' + L('Greek honey, poured', 'Griekse honing, geschonken') + '"></div>' +
        '<span class="px-ritual-scrim" aria-hidden="true"></span>' +
        '<div class="px-ritual-body">' +
          '<span class="px-ritual-eyebrow">' + L('The Ritual Saving', 'De Ritueelkorting') + '</span>' +
          '<h2 class="px-ritual-title">' + L('Build your ritual.', 'Stel je ritueel samen.') + '</h2>' +
          '<p class="px-ritual-copy">' + L('Combine any 3 honeys, or 2 honeys with olive oil, and save €5.',
                                           'Combineer 3 honingen, of 2 honingen met olijfolie, en bespaar €5.') + '</p>' +
          '<a class="px-ritual-cta" href="/shop.html"><span>' + L('Build your ritual', 'Stel je ritueel samen') + '</span> <span class="arrow" aria-hidden="true"></span></a>' +
          '<p class="px-ritual-fine">' + L('One ritual saving per order · applied automatically at checkout.',
                                           'Eén ritueelkorting per bestelling · automatisch verrekend bij het afrekenen.') + '</p>' +
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
      var ASSET_V = '?v=hd-2026-06-06-222';
      var base = '/assets/products-images/' + slug;
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

    /* ---- Sticky add-to-cart bar: must always mirror THIS product ---- */
    var price = (p && p.price != null) ? p.price : null;
    var checkedPr = document.querySelector('input[name="hd-variant"]:checked');
    if (checkedPr && checkedPr.dataset.price) price = checkedPr.dataset.price;
    var sbName = document.querySelector('.sticky-buy .sb-name');
    if (sbName) { sbName.removeAttribute('data-i18n'); sbName.textContent = name; }
    var sbPrice = document.querySelector('.sticky-buy .sb-price');
    if (sbPrice && price != null) { sbPrice.removeAttribute('data-i18n'); sbPrice.textContent = '€' + price + ' · ' + (nl ? 'Editie I' : 'Edition I'); }
    var sbImg = document.querySelector('.sticky-buy .sb-thumb img');
    if (sbImg && p && p.image) { sbImg.src = p.image; sbImg.alt = name; }
    var sbBtn = document.querySelector('.sticky-buy button[data-add-to-cart]');
    if (sbBtn) sbBtn.setAttribute('data-add-to-cart', slug);
    var wishBtn = document.querySelector('[data-wishlist-toggle]');
    if (wishBtn) wishBtn.setAttribute('data-wishlist-toggle', slug);

    /* ---- Net weight: driven from the real variant sizes (no invented weights).
           Stable selector (first detail cell) so it re-updates on language switch. ---- */
    if (p && p.sizes && p.sizes.length) {
      var sizeLabels = p.sizes.map(function (sz) { return sz.label; }).join(' & ');
      setHTML('.details-grid .detail-cell:first-child p', sizeLabels + ' <em>' + (nl ? 'glazen pot' : 'glass jar') + '</em>');
    }

    /* ---- Accordions: per-honey origin + description, never chestnut copy.
           Order = 1 Description · 2 Ingredients · 3 Origin · 4 Shipping. ---- */
    var accDesc = document.querySelector('.pd-acc details:nth-of-type(1) .acc-body');
    if (accDesc) { accDesc.removeAttribute('data-i18n'); accDesc.textContent = L(s.lede[0], s.lede[1]); }
    var accOrigin = document.querySelector('.pd-acc details:nth-of-type(3) .acc-body');
    if (accOrigin) { accOrigin.removeAttribute('data-i18n'); accOrigin.textContent = L(s.origin[0], s.origin[1]) + (s.result ? ' ' + L(s.result[0], s.result[1]) : ''); }

    /* ---- Per-honey SEO: title, meta description, OG + Product JSON-LD, both
           languages. Keeps head metadata in sync with the hydrated product so
           every honey (not just the static default) ships correct structured data. ---- */
    try { updateSEO(slug, p, s, name, nl, price); } catch (e) {}
  }

  function setMeta(sel, attr, val) {
    var el = document.querySelector(sel);
    if (!el) { el = document.createElement('meta'); if (sel.indexOf('property=') !== -1) el.setAttribute('property', sel.replace(/.*property="([^"]+)".*/, '$1')); else el.setAttribute('name', sel.replace(/.*name="([^"]+)".*/, '$1')); document.head.appendChild(el); }
    el.setAttribute(attr, val);
  }
  function updateSEO(slug, p, s, name, nl, price) {
    var desc = L(s.lede[0], s.lede[1]);
    var title = name + (nl ? ' · Rauwe Griekse honing · Harvest Deli' : ' · Raw Greek Honey · Harvest Deli');
    var origin = (location.origin && location.origin.indexOf('http') === 0) ? location.origin : 'https://harvestdeli.nl';
    var imgAbs = (p && p.image) ? (origin + '/' + p.image.split('?')[0].replace(/^\//, '')) : '';
    var url = origin + (window.HD_urlForSlug ? window.HD_urlForSlug(slug) : '/products/' + slug);
    /* Dedicated static product pages already ship a richer, hand-authored head
       (per-product title, description, og:* and a Product schema carrying
       sku/mpn/AggregateOffer). When the served page is already the right one,
       leave all of that alone; only the query-string fallback needs patching. */
    var canonEl = document.querySelector('link[rel="canonical"]');
    var staticLd = document.getElementById('pdProductLd');
    var hasRichLd = !!(staticLd && staticLd.textContent.indexOf('"sku"') !== -1);
    /* Compare paths, not full URLs: on a preview or local host the origin
       differs from the canonical https://harvestdeli.nl, and the rich
       per-variant schema (sku + gtin13) must survive there too. */
    var samePath = false;
    try { samePath = canonEl && new URL(canonEl.getAttribute('href'), location.href).pathname === new URL(url).pathname; } catch (e) {}
    if (hasRichLd && samePath) return;
    document.title = title;
    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[property="og:type"]', 'content', 'product');
    setMeta('meta[property="og:url"]', 'content', url);
    if (imgAbs) setMeta('meta[property="og:image"]', 'content', imgAbs);
    var offers = (p && p.sizes && p.sizes.length)
      ? p.sizes.filter(function (sz) { return sz.price != null; }).map(function (sz) {
          var o = { '@type': 'Offer', name: sz.label, price: String(sz.price), priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: url };
          if (sz.gtin) o.gtin13 = sz.gtin; // official GS1 GTIN per size, never shared between 480 g and 950 g
          return o;
        })
      : [{ '@type': 'Offer', price: String(price != null ? price : (p && p.price) || ''), priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: url }];
    offers.forEach(function (o) { o.itemCondition = 'https://schema.org/NewCondition'; o.seller = { '@type': 'Organization', name: 'Harvest Deli' }; });
    var ld = {
      '@context': 'https://schema.org/', '@type': 'Product',
      name: name, description: desc, url: url,
      image: imgAbs ? [imgAbs] : undefined,
      brand: { '@type': 'Brand', name: 'Harvest Deli' },
      category: (nl ? 'Rauwe Griekse honing' : 'Raw Greek honey'),
      offers: offers.length === 1 ? offers[0] : offers
    };
    var tag = document.getElementById('pdProductLd');
    if (!tag) { tag = document.createElement('script'); tag.type = 'application/ld+json'; tag.id = 'pdProductLd'; document.head.appendChild(tag); }
    tag.textContent = JSON.stringify(ld);
  }

  function init() {
    var meta = document.querySelector('meta[name="hd-product-slug"]');
    if (!meta || !meta.content) return; // not a product page
    if (document.getElementById('pxExtras')) return;
    var slug = meta.content;
    var d = getDetail(slug);

    // Honey product pages: per-honey copy + premium tasting panel under price.
    // Pages written by scripts/build-product-pages.mjs (<html data-hd-static>)
    // already carry all of this in their HTML, in both languages through
    // data-i18n, so rewriting them here would only cause a flash.
    var isStatic = document.documentElement.hasAttribute('data-hd-static');
    if (HONEY_SPEC[slug] && !isStatic) {
      try { hydrateInfo(slug); } catch (e) {}
      var priceBlock = document.querySelector('.pd-price-block');
      if (priceBlock && !document.getElementById('pdBenefits')) {
        // Tasting card sits BELOW the product story when present (price →
        // story → tasting profile), else directly after the price block.
        var storyAnchor = document.getElementById('pdStory') || priceBlock;
        storyAnchor.insertAdjacentHTML('afterend', benefitsPanelHTML(slug));
        var bp = document.getElementById('pdBenefits');
        if (bp && !document.getElementById('pdWellness')) bp.insertAdjacentHTML('afterend', benefitsListHTML(slug));
      }
      window.addEventListener('hd:lang', function () {
        try { hydrateInfo(slug); } catch (e) {}
        var b = document.getElementById('pdBenefits');
        if (b) { b.insertAdjacentHTML('beforebegin', benefitsPanelHTML(slug)); b.remove(); }
        var w = document.getElementById('pdWellness');
        if (w) { w.insertAdjacentHTML('beforebegin', benefitsListHTML(slug)); w.remove(); }
      });
    }

    /* Product experience pages (<html data-hd-experience>, e.g. wildflower)
       carry their own anchored highlights, story, origin, details and closing
       purchase line in the HTML (scripts/build-product-pages.mjs). Here they
       only get the shared blocks that are not already on the page. */
    var isExperience = document.documentElement.hasAttribute('data-hd-experience');

    // Interactive benefit bubbles around the main product image (all products).
    var pdgMain = document.getElementById('pdgMain');
    if (pdgMain && PRODUCT_BENEFITS[slug] && !isExperience && !pdgMain.querySelector('.pd-benefit-layer')) {
      pdgMain.insertAdjacentHTML('beforeend', benefitBubblesHTML(slug));
      pdgMain.setAttribute('tabindex', '0');
      pdgMain.setAttribute('role', 'group');
      pdgMain.setAttribute('aria-label', L('Product image — highlights on hover or focus', 'Productafbeelding — kenmerken bij hover of focus'));
      var coarse = window.matchMedia && window.matchMedia('(hover: none)').matches;
      if (coarse) {
        if ('IntersectionObserver' in window) {
          var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) pdgMain.classList.add('is-inview'); });
          }, { threshold: 0.4 });
          io.observe(pdgMain);
        } else { pdgMain.classList.add('is-inview'); }
        // Tap the image to replay / toggle the benefit layer (no hover on touch).
        pdgMain.addEventListener('click', function () { pdgMain.classList.toggle('is-open'); });
      }
      window.addEventListener('hd:lang', function () {
        var layer = pdgMain.querySelector('.pd-benefit-layer');
        if (layer) { layer.insertAdjacentHTML('beforebegin', benefitBubblesHTML(slug)); layer.remove(); }
        pdgMain.setAttribute('aria-label', L('Product image — highlights on hover or focus', 'Productafbeelding — kenmerken bij hover of focus'));
      });
    }

    var wrap = document.createElement('div');
    wrap.id = 'pxExtras';
    wrap.innerHTML = isExperience
      ? pairsHTML(slug) + ritualPromoHTML() + faqHTML(d)
      : compositionHTML(d) + originSectionHTML(slug) + pairsHTML(slug) + ritualPromoHTML() + faqHTML(d);

    var anchor = (isExperience && document.getElementById('pdxReminder')) || document.querySelector('.reviews-section') || document.querySelector('.also') || null;
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(wrap, anchor);
    else (document.querySelector('main') || document.body).appendChild(wrap);

    // FAQ accordion (the ritual promo is a plain link to the shop, no JS needed)
    wrap.addEventListener('click', function (e) {
      var q = e.target.closest && e.target.closest('.px-faq-q');
      if (q) { var it = q.parentElement; it.classList.toggle('open'); q.setAttribute('aria-expanded', it.classList.contains('open')); return; }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
