/* Product experiences: honeys that get the full editorial page on top of the
 * standard honey page (story, character, origin, ways to enjoy, details and a
 * closing purchase line, plus highlights anchored to points on the photo).
 *
 * Read by scripts/build-product-pages.mjs. The nine standard honeys have no
 * entry here and are written exactly as before.
 *
 * Copy rules (Harvest Deli): only what the supplier sheet supports. No health
 * or nutrition claims (the sheet's "rich in antioxidants", "supports the
 * immune system", "soothes the throat", "antibacterial" etc. are not allowed
 * for honey under EU Reg. 1924/2006 and are rejected by Google Merchant), and
 * no generic environmental claims ("sustainably sourced", banned without
 * proof since the EU ECGT directive applied in September 2026). No em-dashes.
 *
 * Source: supplier sheet "Greek Blossom Honey / Griekse Bloesemhoning
 * (Anthomelo)", photographed by the owner on 10-10-2026.
 *
 * Strings are Dutch; the `en` block lays the English over them (added after
 * the Dutch page was approved on 10-10-2026).
 */
export const EXPERIENCES = {
  wildflower: {
    seo: [
      'Rauwe Griekse Bloesemhoning (Anthómelo) | Harvest Deli',
      'Rauwe, ongefilterde bloesemhoning uit Griekenland, van tijm, oregano en citrusbloesem. Mild, bloemig en romig. Gratis verzending in NL en BE vanaf €60.'
    ],
    /* share image (1200 x 630), assets/og/ */
    og: { file: 'og-wildflower.jpg', w: 1200, h: 630, type: 'image/jpeg' },
    eyebrow: 'Editie I <span class="dot"></span> Bloesem <span class="dot"></span> Griekse honing',
    crumb: 'Editie I · Bloesemhoning',
    sizeDesc: { '480g': 'Rauwe Griekse bloesemhoning in de vertrouwde pot.', '950g': 'Het grote formaat, voor de liefhebber.' },
    trustQ4: 'Puur, niets toegevoegd',
    ingBody: '100% rauwe, ongefilterde Griekse honing. Niets toegevoegd. Honing is niet geschikt voor kinderen jonger dan 12 maanden.',
    hlHead: 'Kenmerken',

    /* Gallery: the supplied photos at their own size (no upscaling). 06 (lid
       close-up) is left out: its seal strip shows garbled text. */
    gallery: [
      { base: 'wildflower', w: 1254, h: 1254, widths: [640, 960], thumb: 'Productfoto',
        alt: 'Pot Harvest Deli Griekse Bloesemhoning op lichte natuursteen, met een olijftak in zacht zonlicht' },
      { base: 'wildflower-sfeer', w: 763, h: 1024, widths: [640], thumb: 'Sfeer',
        alt: 'Harvest Deli Griekse Bloesemhoning tussen wilde bloemen boven de Griekse kust, naast yoghurt met honing, walnoten en vijgen' }
    ],
    /* Highlights anchored to the product photo (01, 1254 x 1254 natural px).
       i = index in PRODUCT_BENEFITS.wildflower; side = where the label sits;
       detail = the second line that appears when this point is in focus
       (hovering it, or its line in the list beside the photo). */
    spots: [
      { i: 0, x: 476, y: 652, side: 'l', icon: 'drop', detail: 'Geproduceerd in Griekenland, niets toegevoegd.' },          // the label, beside "HARVEST DELI"
      { i: 1, x: 476, y: 380, side: 'l', icon: 'bloom', detail: 'Mild en subtiel zoet, met een fris bloemig aroma.' },        // the honey through the glass
      { i: 2, x: 795, y: 890, side: 'r', icon: 'leaf', detail: 'Nectar van tijm, oregano, citrusbloesem en wilde kruiden.' }, // the label, after "Wildflower Honey"
      { i: 3, x: 790, y: 1012, side: 'r', icon: 'hex', detail: 'Zoals de bijen hem maken, zonder toevoegingen.' },            // the honey at the base of the jar
      { i: 4, x: 770, y: 228, side: 'r', icon: 'spoon', detail: 'Bij yoghurt, vers brood, thee, desserts en kaas.' }          // the lid: open it and use it
    ],

    story: {
      eyebrow: 'Het verhaal',
      h: 'Een vleugje Griekse natuur in iedere lepel.',
      p: [
        'In het voorjaar en de vroege zomer staan de bergen en velden van Griekenland in volle bloei. De bijen vliegen van bloem naar bloem en verzamelen nectar van tijm, oregano, citrusbloesem, wilde kruiden en vele andere seizoensbloemen. Geen enkele bloem voert de boventoon.',
        'Zo ontstaat anthómelo, Griekse bloesemhoning: rauw, ongefilterd en evenwichtig. Mild en subtiel zoet, met een fijn bloemig karakter dat nergens overheerst. Een honing voor het ontbijt van elke dag, en voor de momenten waarop je de tafel net iets mooier dekt.'
      ]
    },

    character: {
      eyebrow: 'Smaak en karakter',
      h: 'Zacht, bloemig en in balans.',
      image: { base: 'wildflower-detail', w: 466, h: 384, widths: [], alt: 'Goudkleurige bloesemhoning loopt van een honinglepel in een open pot' },
      rows: [
        { k: 'Smaak', v: 'Mild en subtiel zoet', p: 'Een zachte, bloemige zoetheid die niet overheerst, zodat ook wat je ermee combineert tot zijn recht komt.' },
        { k: 'Aroma', v: 'Fris, bloemig en in balans', p: 'Een open, frisse geur van bloemen en wilde kruiden, zonder scherpe randjes.' },
        { k: 'Kleur', v: 'Licht amber tot goudkleurig', p: 'Een heldere, warme tint die in het licht goud oplicht.', swatch: true },
        { k: 'Textuur', v: 'Glad, romig en fluweelzacht', p: 'Laat zich makkelijk smeren en lepelen, en smelt zacht op de tong.' }
      ]
    },

    origin: {
      eyebrow: 'Herkomst',
      h: 'Uit de bloeiende bergen en velden van Griekenland.',
      image: { base: 'wildflower-kust', w: 781, h: 540, widths: [480], alt: 'Pot Griekse Bloesemhoning op een stenen muurtje tussen wilde bloemen, met de Griekse kust op de achtergrond' },
      p: [
        'Tussen olijfbomen, rotsige hellingen en de kust bloeit in Griekenland een rijke verscheidenheid aan wilde bloemen. In het voorjaar en de vroege zomer, wanneer de natuur op haar mooist is, halen de bijen daar hun nectar.',
        'Tijm, oregano, citrusbloesem, wilde kruiden en vele andere seizoensbloemen: precies die afwisseling geeft deze honing zijn unieke, evenwichtige en bloemige karakter.'
      ],
      facts: [['Herkomst', 'Griekenland'], ['Oogst', 'Voorjaar en vroege zomer'], ['In het Grieks', 'Ανθόμελο']]
    },

    enjoy: {
      eyebrow: 'Zo geniet je ervan',
      h: 'Van ontbijt tot kaasplank.',
      intro: 'Door zijn milde, bloemige smaak is dit een veelzijdige honing voor elke dag. Een paar favorieten:',
      image: { base: 'wildflower-ontbijt', w: 781, h: 472, widths: [480], alt: 'Honing loopt van een honinglepel in een kommetje, naast yoghurt met walnoten en vers brood met honing' },
      items: [
        ['Griekse yoghurt', 'Een lepel over romige yoghurt, met walnoten of verse vijgen.'],
        ['Vers brood', 'Op warm brood of een geroosterde boterham, voor een ontbijt zonder haast.'],
        ['Thee', 'Roer een lepel door je thee zodra die iets is afgekoeld.'],
        ['Desserts', 'Over vers fruit, pannenkoeken of een eenvoudig dessert.'],
        ['Kaas', 'Bij feta of een gerijpte kaas: zacht zoet tegenover zout.']
      ]
    },

    details: {
      eyebrow: 'Productinformatie',
      h_html: 'Alles op <em>een rij.</em>',
      cells: [
        ['Producttype', 'Bloesemhoning <em>(anthómelo)</em>'],
        ['Herkomst', 'Griekenland'],
        ['Oogst', 'Voorjaar en <em>vroege zomer</em>'],
        ['Ingrediënten', '100% rauwe honing. <em>Niets toegevoegd.</em>'],
        ['Netto gewicht', '480 g <em>en</em> 950 g'],
        ['Kristallisatie', 'Natuurlijk, <em>relatief langzaam</em>']
      ],
      note: 'Rauw en ongefilterd. Bewaar goed gesloten, droog en uit direct zonlicht. Honing is niet geschikt voor kinderen jonger dan 12 maanden.'
    },

    reminder: {
      note: 'Rauw, mild en bloemig zoet.',
      ship: 'Verzending door heel Europa'
    },

    ld: [['Herkomst', 'Griekenland'], ['Soort', 'Bloesemhoning (anthómelo)'], ['Oogst', 'Voorjaar en vroege zomer'], ['Proces', 'Rauw en ongefilterd']],

    /* English (approved Dutch first, 10-10-2026). Same shape as above, text
       only: the build script lays it over the Dutch, arrays of objects
       element by element. Written as English copy, not a word-for-word
       translation. */
    en: {
      seo: [
        'Raw Greek Wildflower Honey (Anthómelo) | Harvest Deli',
        'Raw, unfiltered wildflower honey from Greece, from thyme, oregano and citrus blossom. Mild, floral and creamy. Shipped across Europe.'
      ],
      eyebrow: 'Edition I <span class="dot"></span> Wildflower <span class="dot"></span> Greek honey',
      crumb: 'Edition I · Wildflower Honey',
      sizeDesc: { '480g': 'Raw Greek wildflower honey in our signature jar.', '950g': 'The large jar, for the devoted.' },
      trustQ4: 'Pure, nothing added',
      ingBody: '100% raw, unfiltered Greek honey. Nothing added. Honey is not suitable for children under 12 months.',
      hlHead: 'Highlights',
      gallery: [
        { thumb: 'Product photo', alt: 'A jar of Harvest Deli Greek Wildflower Honey on pale natural stone, with an olive branch in soft sunlight' },
        { thumb: 'Mood', alt: 'Harvest Deli Greek Wildflower Honey among wildflowers above the Greek coast, beside yoghurt with honey, walnuts and figs' }
      ],
      spots: [
        { detail: 'Produced in Greece, with nothing added.' },
        { detail: 'Mild and delicately sweet, with a fresh floral aroma.' },
        { detail: 'Nectar from thyme, oregano, citrus blossom and wild herbs.' },
        { detail: 'Just as the bees make it, with nothing added.' },
        { detail: 'With yoghurt, fresh bread, tea, desserts and cheese.' }
      ],
      story: {
        eyebrow: 'The story',
        h: 'A taste of Greek nature in every spoonful.',
        p: [
          'In spring and early summer, the mountains and fields of Greece burst into bloom. The bees move from flower to flower, gathering nectar from thyme, oregano, citrus blossom, wild herbs and countless other seasonal flowers. No single bloom takes the lead.',
          'The result is anthómelo, Greek wildflower honey: raw, unfiltered and beautifully balanced. Mild and delicately sweet, with a fine floral character that never overwhelms. A honey for everyday breakfasts, and for the moments you set the table with a little more care.'
        ]
      },
      character: {
        eyebrow: 'Taste and character',
        h: 'Soft, floral and balanced.',
        image: { alt: 'Golden wildflower honey running from a honey dipper into an open jar' },
        rows: [
          { k: 'Flavour', v: 'Mild and delicately sweet', p: 'A soft, floral sweetness that never dominates, so whatever you pair it with can still shine.' },
          { k: 'Aroma', v: 'Fresh, floral and balanced', p: 'An open, fresh scent of flowers and wild herbs, with no sharp edges.' },
          { k: 'Colour', v: 'Light amber to golden', p: 'A clear, warm hue that turns golden in the light.' },
          { k: 'Texture', v: 'Smooth, creamy and velvety', p: 'Spreads and spoons with ease, and melts softly on the tongue.' }
        ]
      },
      origin: {
        eyebrow: 'Origin',
        h: 'From the flowering mountains and fields of Greece.',
        image: { alt: 'A jar of Greek Wildflower Honey on a stone wall among wildflowers, with the Greek coast behind' },
        p: [
          'Between olive trees, rocky slopes and the coast, Greece blooms with a remarkable variety of wildflowers. In spring and early summer, when nature is at its most vibrant, this is where the bees gather their nectar.',
          'Thyme, oregano, citrus blossom, wild herbs and many other seasonal flowers: it is exactly this variety that gives the honey its unique, balanced and floral character.'
        ],
        facts: [['Origin', 'Greece'], ['Harvest', 'Spring and early summer'], ['In Greek', 'Ανθόμελο']]
      },
      enjoy: {
        eyebrow: 'Ways to enjoy',
        h: 'From breakfast to the cheese board.',
        intro: 'Mild and floral, this is a versatile honey for every day. A few favourites:',
        image: { alt: 'Honey running from a dipper into a small bowl, beside yoghurt with walnuts and fresh bread with honey' },
        items: [
          ['Greek yoghurt', 'A spoonful over creamy yoghurt, with walnuts or fresh figs.'],
          ['Fresh bread', 'On warm bread or toast, for an unhurried breakfast.'],
          ['Tea', 'Stir a spoonful into your tea once it has cooled a little.'],
          ['Desserts', 'Over fresh fruit, pancakes or a simple dessert.'],
          ['Cheese', 'With feta or an aged cheese: gentle sweetness against salt.']
        ]
      },
      details: {
        eyebrow: 'Product details',
        h_html: 'Everything <em>at a glance.</em>',
        cells: [
          ['Product type', 'Wildflower honey <em>(anthómelo)</em>'],
          ['Origin', 'Greece'],
          ['Harvest', 'Spring and <em>early summer</em>'],
          ['Ingredients', '100% raw honey. <em>Nothing added.</em>'],
          ['Net weight', '480 g <em>and</em> 950 g'],
          ['Crystallisation', 'Natural, <em>relatively slow</em>']
        ],
        note: 'Raw and unfiltered. Store tightly closed, dry and out of direct sunlight. Honey is not suitable for children under 12 months.'
      },
      reminder: { note: 'Raw, mild and floral.', ship: 'Shipping across Europe' },
      ui: { galleryAria: 'Product photo: hover over it or tap a point to see its highlights', remAria: 'Order' }
    }
  }
};
