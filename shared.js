/* ============================================================
   Harvest Deli — shared logic
   Product catalog + cart state + drawer + menu wiring
   ============================================================ */
(function () {
  'use strict';

  // ============================================================
  //  TRANSLATIONS  (EN  +  NL)
  // ============================================================
  const T = {
    en: {
      'nav.menu': 'Menu',
      'nav.shop': 'Shop',
      'nav.acquire': 'Acquire',
      'nav.cellar': 'Cellar',
      'nav.secureCheckout': 'Secure Checkout',
      'menu.close': 'Close',
      'menu.item.collection_html': 'The <em>Collection</em>',
      'menu.item.collection_sub': 'All editions',
      'menu.item.origin_html': 'The <em>Origin</em>',
      'menu.item.origin_sub': 'Pelion · Greece',
      'menu.item.process_html': 'The <em>Process</em>',
      'menu.item.process_sub': 'Hand harvested',
      'menu.item.journal_html': 'The <em>Journal</em>',
      'menu.item.journal_sub': 'Field notes',
      'menu.item.contact': 'Contact',
      'menu.item.contact_sub': 'Trade & press',
      'menu.estate.h': 'Visit the estate',
      'menu.estate.p': 'By appointment between April and October. Small groups, single day, accompanied tastings at the cellar.',
      'menu.social.instagram': 'Instagram',
      'menu.social.journal': 'Journal',
      'menu.social.wholesale': 'Wholesale',
      'menu.copyright': '© Harvest Deli MMXXV',
      'cart.title_html': 'Your <em>Cellar</em>',
      'cart.close': 'Close',
      'cart.empty.h': 'Your cellar is quiet.',
      'cart.empty.p': 'Begin the collection. Each jar is numbered, sealed in wax, and shipped from Pelion within the week.',
      'cart.empty.cta': 'View the collection',
      'cart.subtotal': 'Subtotal',
      'cart.note': 'Shipping calculated at checkout. Complimentary across the EU above €120.',
      'cart.checkout': 'Continue to checkout',
      'cart.remove': 'Remove',
      'cart.added': 'Added',
      'footer.tagline': 'Liquid sunlight, kept slow and small, from the mountains of Greece.',
      'footer.col.collection': 'Collection',
      'footer.col.house': 'House',
      'footer.col.care': 'Care',
      'footer.link.allEditions': 'All editions',
      'footer.link.rawHoney': 'Raw honey',
      'footer.link.limited': 'Limited reserves',
      'footer.link.reserve': 'Reserve',
      'footer.link.gift': 'Gift sets',
      'footer.link.origin': 'Origin',
      'footer.link.estate': 'Estate',
      'footer.link.journal': 'Journal',
      'footer.link.contact': 'Contact',
      'footer.link.shipping': 'Shipping',
      'footer.link.sourcing': 'Sourcing',
      'footer.link.trade': 'Trade',
      'footer.link.press': 'Press',
      'footer.link.wildThyme': 'Wild Thyme',
      'footer.link.pineHeather': 'Pine & Heather',
      'footer.link.springWildflower': 'Spring Wildflower',
      'footer.link.chestnut': 'Chestnut Honey',
      'footer.bottom1': '© Harvest Deli · Pelion, Greece',
      'footer.bottom2': 'Crafted slowly · MMXXV',
      // ---------- index hero ----------
      'idx.scene0.est': 'Established · Pelion, Greece · Estate №01',
      'idx.scene1.eyebrow_html': 'Edition I <span class="dot"></span> Chestnut Honey',
      'idx.scene1.line_html': 'Captured from<br><em>the Greek sun.</em>',
      'idx.scene2.eyebrow': 'A field of stillness',
      'idx.scene2.line1': 'Wild mountain flowers.',
      'idx.scene2.line2': 'Untouched nature.',
      'idx.scene2.line3': 'Pure craftsmanship.',
      'idx.card1.h': 'Raw harvesting',
      'idx.card1.p': 'Combs gathered by hand at altitude. Never heated, never processed. Every aromatic note of the season is preserved intact.',
      'idx.card2.h': 'Small batch',
      'idx.card2.p': 'Each estate produces fewer than four hundred jars per harvest. A quiet number, kept deliberately small.',
      'idx.card3.h': 'Natural origin',
      'idx.card3.p': 'Single-source, traceable to a meadow, a mountain, a season. Nothing added. Nothing taken away.',
      'idx.scene4.eyebrow': 'The collection',
      'idx.scene4.line': 'Taste the origin.',
      'idx.scene4.cta': 'Discover the collection',
      'idx.scrollHint': 'Scroll',
      // ---------- index editorial ----------
      'idx.ch1.eyebrow': 'I — The Origin',
      'idx.ch1.h': 'Born in the quiet hills of Northern Greece.',
      'idx.ch1.body': 'For five generations, a single family has tended a thousand hives across the limestone ridges of Mount Pelion. Wild thyme, heather and arbutus bloom in a single, untranslatable season. The honey is shaped by this land, and by nothing else.',
      'idx.ch1.caption': 'Pelion · Spring harvest',
      'idx.ch2.eyebrow': 'II — The Process',
      'idx.ch2.h': 'A practice refined by time, not technology.',
      'idx.step1.h': 'Gathered at altitude',
      'idx.step1.p': 'Hives are placed where wildflowers grow untended. Never near agriculture, never near a road. The bees decide where to forage; we simply listen.',
      'idx.step2.h': 'Cold extracted',
      'idx.step2.p': 'Combs are spun at the temperature of the cellar, never heated. Every enzyme, every pollen, every memory of the season remains intact.',
      'idx.step3.h': 'Settled, never strained',
      'idx.step3.p': 'The honey rests for fourteen days in oak vats. Air rises, sediment falls. Nothing is forced, nothing is filtered, and the texture remains alive.',
      'idx.taste.quote': 'A taste that holds the memory of a mountain morning. Warm, golden, slow to leave.',
      'idx.taste.cite': '— Notes from the tasting room',
      'idx.preview.eyebrow': '— The Collection',
      'idx.preview.h_html': 'Three from the cellar, <em>numbered.</em>',
      'idx.preview.addToCellar': 'Add to Cellar',
      'idx.preview.exploreAll': 'View all six editions',
      'idx.product.eyebrow': 'The Collection · Edition I',
      'idx.product.title_html': 'Chestnut Honey, <em>2025 harvest.</em>',
      'idx.product.originLine_html': 'Pelion <span class="dot"></span> 950m <span class="dot"></span> 384 jars',
      'idx.product.desc': 'A single-meadow honey of remarkable clarity. Notes of warm resin, sun-baked herb, and a long mineral finish. Bottled in heavy hand-pressed glass, numbered by hand, kept untreated.',
      'idx.product.cta_html': 'View the jar &mdash; €68',
      // ---------- shop ----------
      'shop.eyebrow': 'The Collection · 2025',
      'shop.headline_html': 'A small, <em>numbered</em> library of Greek honey.',
      'shop.intro': 'Five editions, drawn from five terroirs. Each season we release no more than four hundred numbered jars per estate, kept untreated and shipped quietly from Pelion within the week.',
      'shop.filterLabel': 'Filter by',
      'shop.filter.all': 'All',
      'shop.filter.floral': 'Floral',
      'shop.filter.forest': 'Forest',
      'shop.filter.mountain': 'Mountain',
      'shop.filter.wildflower': 'Wildflower',
      'shop.filter.raw': 'Raw Honey',
      'shop.filter.limited': 'Limited Harvest',
      'shop.filter.cold': 'Cold Extracted',
      'shop.filter.dark': 'Dark Honey',
      'shop.filter.light': 'Light Honey',
      'shop.editionsInCollection': 'editions in the collection',
      'shop.sortedBy': 'Sorted by harvest',
      'shop.empty.h': 'No edition matches that filter.',
      'shop.empty.p': 'Each season the collection shifts. Try another category or view the full library.',
      'shop.empty.cta': 'View all editions',
      // ---------- about ----------
      'about.eyebrow': 'The Origin · A house in Pelion',
      'about.headline_html': 'A journey into the <em>origin.</em>',
      'about.intro': 'Five generations of one family, working a thousand hives across a single mountain. The honey is the result. This is the story behind the jar.',
      'about.frameCaption': 'Mount Pelion · Northern Greece',
      'about.ch1.eyebrow': 'Greece · The land',
      'about.ch1.h': 'A mountain that the sea cannot reach.',
      'about.ch1.p1': 'Pelion rises six hundred metres from the Aegean coast in a single, slow gesture. Its limestone ridges hold wild thyme, heather, oregano, arbutus and chestnut in a single, untranslatable season. We work the southern face, where the sun arrives early and the air keeps its dryness through the afternoon.',
      'about.ch1.p2': 'Nothing here is cultivated. The bees decide where to forage, and the season decides what they bring back.',
      'about.ch1.caption': 'Pelion ridges · 1100m',
      'about.quote.text': '"My grandfather kept thirty hives. My father, three hundred. I keep a thousand, and yet, less."',
      'about.quote.cite': 'Stavros Andreou · Beekeeper, fifth generation',
      'about.ch2.eyebrow': 'The beekeeper',
      'about.ch2.h': 'Stavros, who learned to listen.',
      'about.ch2.p1': 'Stavros Andreou is the fifth generation of his family to keep bees on this mountain. He inherited the cellar from his father in 2009, and the manuscripts of his great-grandfather sit on a shelf above the vats, recording temperatures and yields back to 1882.',
      'about.ch2.p2': 'He works alone for ten months of the year. Two younger nephews join him for the harvest. The bees, he says, taught the family more than the family ever taught the bees.',
      'about.ch2.caption': 'The cellar · oak vats',
      'about.ch3.eyebrow': 'The mountains',
      'about.ch3.h': 'The hives are placed where the road ends.',
      'about.ch3.p1': 'Each apiary sits between 600 and 1400 metres on the southern slopes. Never near a road. Never near a cultivated field. The walk to the highest hives takes a full morning, and we take care not to disturb the bees more than a season requires.',
      'about.ch3.p2': 'Altitude shapes the honey more than any single flower. The colder nights slow the bees. The honey thickens. The character deepens.',
      'about.ch3.caption': 'Hive №47 · 1280m',
      'about.n1.lbl': 'Hives across the southern face of Pelion',
      'about.n2.lbl': 'Generations of one family on the mountain',
      'about.n3.lbl': 'Numbered jars in the Chestnut edition',
      'about.n4.lbl': 'Additives, ever. Raw honey, sealed in wax.',
      'about.ch4.eyebrow': 'The harvest',
      'about.ch4.h': 'Combs are spun cold, at cellar temperature.',
      'about.ch4.p1': 'We never heat the honey. The combs travel down the mountain in shallow trays, are uncapped by hand, and are spun at the temperature of the cellar. Sixteen degrees in spring, eighteen in summer. Every enzyme, every grain of pollen, every aromatic note of the season remains intact.',
      'about.ch4.p2': 'The honey then rests in oak vats for fourteen days. Air rises. Sediment falls. Nothing is forced.',
      'about.ch4.caption': 'Harvest morning · April',
      'about.ch5.eyebrow': 'Family tradition',
      'about.ch5.h': 'A practice passed quietly between hands.',
      'about.ch5.p1': 'Some of what we do has been done in the same way for five generations. Some of it changes every year. The bees keep us honest. The mountain keeps us small.',
      'about.ch5.p2': 'We do not scale. We do not blend. We do not strip the wax from the lids of the jars. Three hundred and eighty four jars in the Chestnut edition, and when they are gone, the season has ended.',
      'about.ch5.caption': 'Cellar archive · 1882 — 2025',
      'about.cta.label': 'The Collection · 2025',
      'about.cta.h_html': 'Taste the <em>mountain.</em>',
      'about.cta.btn': 'View the collection',
      // ---------- contact ----------
      'contact.eyebrow': 'Contact · Pelion, Greece',
      'contact.headline_html': 'Write to <em>the house.</em>',
      'contact.intro': 'For wholesale, hospitality, press, or simply a quiet question about a jar. Stavros and the family read every message, and reply within two business days.',
      'contact.form.h': 'Begin an inquiry.',
      'contact.form.sub': 'A few lines are enough. We respond personally.',
      'contact.pill.general': 'General',
      'contact.pill.wholesale': 'Wholesale',
      'contact.pill.hospitality': 'Hospitality',
      'contact.pill.retail': 'Retailers',
      'contact.pill.press': 'Press',
      'contact.pill.collab': 'Collaboration',
      'contact.label.name': 'Your name',
      'contact.label.house': 'House / business',
      'contact.label.email': 'Email',
      'contact.label.country': 'Country',
      'contact.label.message': 'Message',
      'contact.ph.name': 'Maria Andreou',
      'contact.ph.house': 'Optional',
      'contact.ph.email': 'maria@example.com',
      'contact.ph.country': 'Greece',
      'contact.ph.message': 'Tell us what you have in mind. Quantities, timing, the room you are setting the table in.',
      'contact.submit': 'Send inquiry',
      'contact.formNote': 'By writing to us you agree we may store your message for the purpose of replying. We do not sell or share details. Ever.',
      'contact.success.h': 'Your message is on its way.',
      'contact.success.p': 'Stavros or one of the family will read it personally and write back within two business days.',
      'contact.info.h': 'Or write to us directly.',
      'contact.info.wholesale.lbl': 'Wholesale',
      'contact.info.wholesale.title_html': 'Stocking the <em>collection.</em>',
      'contact.info.wholesale.p': 'Small allocations available to independent boutiques, delicatessens and tea houses across the EU and select international markets.',
      'contact.info.hospitality.lbl': 'Hospitality · Restaurants',
      'contact.info.hospitality.title_html': 'For the <em>table.</em>',
      'contact.info.hospitality.p': 'We work quietly with a small number of restaurants and hotels each year. Sample boxes ship from Pelion within the week.',
      'contact.info.retail.lbl': 'Premium retailers',
      'contact.info.retail.title_html': 'A discreet <em>shelf.</em>',
      'contact.info.retail.p': 'Curated retail partners receive an annual allocation, edition by edition, with priority on the limited reserves.',
      'contact.info.press.lbl': 'Press · Collaboration',
      'contact.info.press.title_html': 'A quieter <em>conversation.</em>',
      'contact.info.press.p': 'Editorial enquiries, photography, and creative collaborations. We reply slowly, but we reply.',
      'contact.location.lbl': 'The estate',
      'contact.location.h_html': 'Pelion, <em>Northern Greece.</em>',
      'contact.address_html': 'Harvest Deli &middot; Estate №01<br>37006 Pelion, Magnesia<br>Greece',
      // ---------- checkout ----------
      'checkout.step.cellar': 'Cellar',
      'checkout.step.checkout': 'Checkout',
      'checkout.step.confirmation': 'Confirmation',
      'checkout.eyebrow': 'Checkout · Edition I',
      'checkout.headline_html': 'A quiet, <em>careful</em> handover.',
      'checkout.sub': 'Three steps. Numbered, sealed, shipped from Pelion within the week.',
      'checkout.express.divider': 'Or pay with card',
      'checkout.step1.h_html': 'Contact &middot; <em>where to write back.</em>',
      'checkout.label.email': 'Email',
      'checkout.label.phone': 'Telephone',
      'checkout.step2.h_html': 'Shipping &middot; <em>the address.</em>',
      'checkout.label.first': 'First name',
      'checkout.label.last': 'Last name',
      'checkout.label.addr1': 'Address line 1',
      'checkout.label.addr1Ph': 'House number, street',
      'checkout.label.addr2': 'Address line 2 — optional',
      'checkout.label.addr2Ph': 'Apartment, building, floor',
      'checkout.label.city': 'City',
      'checkout.label.postcode': 'Postcode',
      'checkout.label.country': 'Country',
      'checkout.ship.standard.title': 'Standard · tracked',
      'checkout.ship.standard.sub': '5 — 8 business days, signed delivery',
      'checkout.ship.express.title': 'Express · courier',
      'checkout.ship.express.sub': '2 — 3 business days, hand delivered',
      'checkout.ship.intl.title': 'International · outside EU',
      'checkout.ship.intl.sub': '7 — 12 business days, taxes prepaid',
      'checkout.step3.h_html': 'Payment &middot; <em>quietly secure.</em>',
      'checkout.tab.card': 'Card',
      'checkout.tab.bank': 'Bank transfer',
      'checkout.tab.klarna': 'Klarna',
      'checkout.label.cardNumber': 'Card number',
      'checkout.label.cardName': 'Name on card',
      'checkout.label.expiry': 'Expiry',
      'checkout.label.cvc': 'CVC',
      'checkout.stripeNote': 'Encrypted and processed end-to-end. We never see or store your card.',
      'checkout.confirm': 'Confirm order',
      'checkout.terms_html': 'By placing this order you agree to our <a href="#">terms</a> and <a href="#">privacy</a>. International orders may carry local duties.',
      'checkout.side.eyebrow': 'Your cellar',
      'checkout.side.title_html': 'Order <em>summary</em>',
      'checkout.empty.h': 'Your cellar is empty.',
      'checkout.empty.p': 'Add a jar from the collection to begin checkout.',
      'checkout.empty.cta': 'View the collection',
      'checkout.package.lbl': 'Luxury packaging',
      'checkout.package.h_html': 'Sealed in <em>wax.</em> Boxed in oak veneer.',
      'checkout.package.p': 'Each jar is wrapped by hand, sealed with black wax, and laid in an oak-veneered presentation box. A handwritten card travels with the order.',
      'checkout.package.tag': 'Edition I · 2025 Harvest',
      'checkout.trust.stripe1': 'Stripe',
      'checkout.trust.stripe2': 'encrypted',
      'checkout.trust.intl1': 'International',
      'checkout.trust.intl2': 'shipping',
      'checkout.trust.sealed1': 'Sealed in',
      'checkout.trust.sealed2': 'Pelion',
      'checkout.row.subtotal': 'Subtotal',
      'checkout.row.shipping': 'Shipping',
      'checkout.row.total': 'Total',
      'checkout.row.shippingFree': 'Complimentary',
      // ---------- product detail (chestnut) ----------
      'product.crumb.collection': 'Collection',
      'product.crumb.current': 'Edition I — Chestnut Honey',
      'product.eyebrow_html': 'Edition I <span class="dot"></span> 2025 Harvest',
      'product.title_html': 'Chestnut Honey, <em>Pelion estate.</em>',
      'product.tag.singleMeadow': 'Single Meadow',
      'product.tag.coldExtracted': 'Cold Extracted',
      'product.tag.numbered': 'Numbered · 384',
      'product.desc': 'A clear, slow-pouring honey gathered from the chestnut groves of southern Mount Pelion. Notes of warm resin, sun-baked herb and a long mineral finish. Bottled in heavy hand-pressed glass, sealed in wax, kept untreated.',
      'product.priceSub_html': 'incl. VAT &middot; ships worldwide',
      'product.size.tasting': 'Tasting',
      'product.size.estate': 'Estate',
      'product.size.reserve': 'Reserve',
      'product.cta': 'Add to the cellar',
      'product.notes_html': 'Free shipping in EU above €120 <span class="dot"></span> Limited release · 384 numbered jars',
      'product.tasting.eyebrow': 'The Tasting',
      'product.tasting.h_html': 'What you taste, slowly.',
      'product.tasting.first.h': 'I — First',
      'product.tasting.first.quote': '"Warm resin, sun on stone."',
      'product.tasting.first.p': 'An immediate breath of pine and dry herb. The smell of the mountain itself in late June, when the air over the thyme begins to shimmer.',
      'product.tasting.body.h': 'II — Body',
      'product.tasting.body.quote': '"Soft amber, slow honey."',
      'product.tasting.body.p': 'The texture takes hold next, a viscosity that pours like a held breath. Wildflower and a clean, gentle sweetness held in the centre of the tongue.',
      'product.tasting.finish.h': 'III — Finish',
      'product.tasting.finish.quote': '"Mineral, long, golden."',
      'product.tasting.finish.p': 'A slow descent into stone and salt. Subtle, almost dry. The kind of finish that lingers in the room long after the spoon has been set down.',
      'product.origin.eyebrow': 'The Origin',
      'product.origin.h_html': 'One meadow, one season.',
      'product.origin.p1': 'The 2025 harvest comes from a single, south-facing chestnut grove at 950 metres on the slopes of Mount Pelion, where the trees bloom in a narrow window each late summer.',
      'product.origin.p2': 'Three hundred and eighty-four jars were drawn from this season. Every one numbered by hand, sealed with black wax, and kept exactly as it left the comb.',
      'product.origin.caption': 'Pelion · 950m · Late summer',
      'product.details.eyebrow': 'The Particulars',
      'product.details.h_html': 'Quietly, carefully made.',
      'product.det.weight.lbl': 'Net weight',
      'product.det.weight.val_html': '250g <em>glass jar</em>',
      'product.det.origin.lbl': 'Origin',
      'product.det.origin.val_html': 'Pelion, <em>Greece</em>',
      'product.det.vintage.lbl': 'Vintage',
      'product.det.vintage.val_html': 'Late summer <em>2025</em>',
      'product.det.edition.lbl': 'Edition',
      'product.det.edition.val_html': '384 jars, <em>numbered</em>',
      'product.det.ingredients.lbl': 'Ingredients',
      'product.det.ingredients.val_html': 'Raw honey. <em>That is all.</em>',
      'product.det.storage.lbl': 'Storage',
      'product.det.storage.val_html': 'Cool, dry, <em>away from light</em>',
      'product.det.shelf.lbl': 'Shelf life',
      'product.det.shelf.val_html': 'Indefinite, <em>kept sealed</em>',
      'product.det.package.lbl': 'Packaging',
      'product.det.package.val_html': 'Hand-pressed glass, <em>black wax</em>',
      'product.also.eyebrow': 'Also From The Collection',
      'product.also.h_html': 'The rest of the house.',
      'product.sticky.name': 'Chestnut Honey, Pelion estate',
      'product.sticky.price': '€68 · Edition I',
      'product.sticky.add': 'Add'
    },
    nl: {
      'nav.menu': 'Menu',
      'nav.shop': 'Shop',
      'nav.acquire': 'Bestellen',
      'nav.cellar': 'Kelder',
      'nav.secureCheckout': 'Veilig Afrekenen',
      'menu.close': 'Sluiten',
      'menu.item.collection_html': 'De <em>Collectie</em>',
      'menu.item.collection_sub': 'Alle edities',
      'menu.item.origin_html': 'De <em>Oorsprong</em>',
      'menu.item.origin_sub': 'Pelion · Griekenland',
      'menu.item.process_html': 'Het <em>Proces</em>',
      'menu.item.process_sub': 'Met de hand geoogst',
      'menu.item.journal_html': 'Het <em>Dagboek</em>',
      'menu.item.journal_sub': 'Veldnotities',
      'menu.item.contact': 'Contact',
      'menu.item.contact_sub': 'Handel & pers',
      'menu.estate.h': 'Bezoek het landgoed',
      'menu.estate.p': 'Op afspraak tussen april en oktober. Kleine groepen, één dag, begeleide proeverijen in de kelder.',
      'menu.social.instagram': 'Instagram',
      'menu.social.journal': 'Dagboek',
      'menu.social.wholesale': 'Groothandel',
      'menu.copyright': '© Harvest Deli MMXXV',
      'cart.title_html': 'Jouw <em>Kelder</em>',
      'cart.close': 'Sluiten',
      'cart.empty.h': 'Jouw kelder is stil.',
      'cart.empty.p': 'Begin met de collectie. Elke pot is genummerd, verzegeld in was en binnen een week verzonden vanuit Pelion.',
      'cart.empty.cta': 'Bekijk de collectie',
      'cart.subtotal': 'Subtotaal',
      'cart.note': 'Verzending wordt bij de afrekening berekend. Gratis binnen de EU boven €120.',
      'cart.checkout': 'Naar de afrekening',
      'cart.remove': 'Verwijderen',
      'cart.added': 'Toegevoegd',
      'footer.tagline': 'Vloeibaar zonlicht, langzaam en op kleine schaal bewaard, uit de bergen van Griekenland.',
      'footer.col.collection': 'Collectie',
      'footer.col.house': 'Het Huis',
      'footer.col.care': 'Service',
      'footer.link.allEditions': 'Alle edities',
      'footer.link.rawHoney': 'Rauwe honing',
      'footer.link.limited': 'Beperkte reserves',
      'footer.link.reserve': 'Reserve',
      'footer.link.gift': 'Cadeausets',
      'footer.link.origin': 'Oorsprong',
      'footer.link.estate': 'Landgoed',
      'footer.link.journal': 'Dagboek',
      'footer.link.contact': 'Contact',
      'footer.link.shipping': 'Verzending',
      'footer.link.sourcing': 'Herkomst',
      'footer.link.trade': 'Handel',
      'footer.link.press': 'Pers',
      'footer.link.wildThyme': 'Wilde Tijm',
      'footer.link.pineHeather': 'Den & Heide',
      'footer.link.springWildflower': 'Lente Wilde Bloem',
      'footer.link.chestnut': 'Tamme Kastanje',
      'footer.bottom1': '© Harvest Deli · Pelion, Griekenland',
      'footer.bottom2': 'Met aandacht gemaakt · MMXXV',
      // ---------- index hero ----------
      'idx.scene0.est': 'Opgericht · Pelion, Griekenland · Landgoed №01',
      'idx.scene1.eyebrow_html': 'Editie I <span class="dot"></span> Tamme Kastanje',
      'idx.scene1.line_html': 'Gevangen uit<br><em>de Griekse zon.</em>',
      'idx.scene2.eyebrow': 'Een veld vol stilte',
      'idx.scene2.line1': 'Wilde bergbloemen.',
      'idx.scene2.line2': 'Ongerepte natuur.',
      'idx.scene2.line3': 'Puur vakmanschap.',
      'idx.card1.h': 'Rauwe oogst',
      'idx.card1.p': 'Raten met de hand verzameld op grote hoogte. Nooit verhit, nooit bewerkt. Elke aromatische noot van het seizoen blijft volledig intact.',
      'idx.card2.h': 'Kleine batch',
      'idx.card2.p': 'Elk landgoed produceert minder dan vierhonderd potten per oogst. Een rustig aantal, bewust klein gehouden.',
      'idx.card3.h': 'Natuurlijke herkomst',
      'idx.card3.p': 'Eén bron, herleidbaar tot een weide, een berg, een seizoen. Niets toegevoegd. Niets weggehaald.',
      'idx.scene4.eyebrow': 'De collectie',
      'idx.scene4.line': 'Proef de oorsprong.',
      'idx.scene4.cta': 'Ontdek de collectie',
      'idx.scrollHint': 'Scroll',
      // ---------- index editorial ----------
      'idx.ch1.eyebrow': 'I — De Oorsprong',
      'idx.ch1.h': 'Geboren in de stille heuvels van Noord-Griekenland.',
      'idx.ch1.body': 'Vijf generaties lang verzorgt één familie duizend bijenkasten over de kalksteenrichels van de berg Pelion. Wilde tijm, heide en aardbeiboom bloeien in een enkel, onvertaalbaar seizoen. De honing wordt gevormd door dit land, en door niets anders.',
      'idx.ch1.caption': 'Pelion · Voorjaarsoogst',
      'idx.ch2.eyebrow': 'II — Het Proces',
      'idx.ch2.h': 'Een ambacht verfijnd door tijd, niet door technologie.',
      'idx.step1.h': 'Op hoogte verzameld',
      'idx.step1.p': 'De kasten staan waar wilde bloemen ongestoord groeien. Nooit bij landbouw, nooit bij een weg. De bijen bepalen waar ze foerageren; wij luisteren slechts.',
      'idx.step2.h': 'Koud gewonnen',
      'idx.step2.p': 'Raten worden gecentrifugeerd op de temperatuur van de kelder, nooit verhit. Elk enzym, elke stuifmeelkorrel, elke herinnering aan het seizoen blijft intact.',
      'idx.step3.h': 'Bezonken, nooit gezeefd',
      'idx.step3.p': 'De honing rust veertien dagen in eikenhouten vaten. Lucht stijgt, bezinksel zakt. Niets wordt geforceerd, niets wordt gefilterd, en de structuur blijft levend.',
      'idx.taste.quote': 'Een smaak die de herinnering aan een bergochtend vasthoudt. Warm, goudkleurig, traag om te vertrekken.',
      'idx.taste.cite': '— Notities uit de proefruimte',
      'idx.preview.eyebrow': '— De Collectie',
      'idx.preview.h_html': 'Drie uit de kelder, <em>genummerd.</em>',
      'idx.preview.addToCellar': 'Aan de kelder toevoegen',
      'idx.preview.exploreAll': 'Bekijk alle zes edities',
      'idx.product.eyebrow': 'De Collectie · Editie I',
      'idx.product.title_html': 'Tamme Kastanje, <em>oogst 2025.</em>',
      'idx.product.originLine_html': 'Pelion <span class="dot"></span> 950m <span class="dot"></span> 384 potten',
      'idx.product.desc': 'Een honing uit één weide met opmerkelijke helderheid. Tonen van warme hars, in de zon gerijpte kruiden en een lange minerale afdronk. Gebotteld in zwaar handgeperst glas, met de hand genummerd, ongepasteuriseerd.',
      'idx.product.cta_html': 'Bekijk de pot &mdash; €68',
      // ---------- shop ----------
      'shop.eyebrow': 'De Collectie · 2025',
      'shop.headline_html': 'Een kleine, <em>genummerde</em> bibliotheek Griekse honing.',
      'shop.intro': 'Vijf edities, getrokken uit vijf terroirs. Elk seizoen brengen wij niet meer dan vierhonderd genummerde potten per landgoed uit, ongepasteuriseerd, stil verzonden vanuit Pelion binnen de week.',
      'shop.filterLabel': 'Filter op',
      'shop.filter.all': 'Alles',
      'shop.filter.floral': 'Bloemig',
      'shop.filter.forest': 'Bos',
      'shop.filter.mountain': 'Berg',
      'shop.filter.wildflower': 'Wilde Bloem',
      'shop.filter.raw': 'Rauwe Honing',
      'shop.filter.limited': 'Beperkte Oogst',
      'shop.filter.cold': 'Koud Gewonnen',
      'shop.filter.dark': 'Donkere Honing',
      'shop.filter.light': 'Lichte Honing',
      'shop.editionsInCollection': 'edities in de collectie',
      'shop.sortedBy': 'Op oogst gesorteerd',
      'shop.empty.h': 'Geen editie past bij dit filter.',
      'shop.empty.p': 'Elk seizoen verandert de collectie. Probeer een andere categorie of bekijk de volledige bibliotheek.',
      'shop.empty.cta': 'Bekijk alle edities',
      // ---------- about ----------
      'about.eyebrow': 'De Oorsprong · Een huis in Pelion',
      'about.headline_html': 'Een reis naar de <em>oorsprong.</em>',
      'about.intro': 'Vijf generaties van één familie, die duizend bijenkasten verzorgen over één enkele berg. De honing is het resultaat. Dit is het verhaal achter de pot.',
      'about.frameCaption': 'Berg Pelion · Noord-Griekenland',
      'about.ch1.eyebrow': 'Griekenland · Het land',
      'about.ch1.h': 'Een berg die de zee niet kan bereiken.',
      'about.ch1.p1': 'Pelion stijgt zeshonderd meter uit de Egeïsche kust op in één enkel, traag gebaar. De kalksteenrichels herbergen wilde tijm, heide, oregano, aardbeiboom en kastanje in een enkel, onvertaalbaar seizoen. Wij werken op de zuidflank, waar de zon vroeg arriveert en de lucht haar droogte tot in de middag bewaart.',
      'about.ch1.p2': 'Niets hier wordt gecultiveerd. De bijen kiezen waar ze foerageren, en het seizoen bepaalt wat ze meebrengen.',
      'about.ch1.caption': 'Pelion richels · 1100m',
      'about.quote.text': '"Mijn grootvader hield dertig kasten. Mijn vader, driehonderd. Ik houd er duizend, en toch minder."',
      'about.quote.cite': 'Stavros Andreou · Imker, vijfde generatie',
      'about.ch2.eyebrow': 'De imker',
      'about.ch2.h': 'Stavros, die leerde te luisteren.',
      'about.ch2.p1': 'Stavros Andreou is de vijfde generatie van zijn familie die bijen houdt op deze berg. Hij erfde de kelder van zijn vader in 2009, en de handschriften van zijn overgrootvader liggen op een plank boven de vaten, met temperaturen en opbrengsten genoteerd tot in 1882.',
      'about.ch2.p2': 'Tien maanden per jaar werkt hij alleen. Twee jongere neven sluiten zich aan voor de oogst. De bijen, zegt hij, leerden de familie meer dan de familie ooit de bijen leerde.',
      'about.ch2.caption': 'De kelder · eikenhouten vaten',
      'about.ch3.eyebrow': 'De bergen',
      'about.ch3.h': 'De kasten staan waar de weg eindigt.',
      'about.ch3.p1': 'Elke bijenstand ligt tussen de 600 en 1400 meter op de zuidelijke hellingen. Nooit bij een weg. Nooit bij een bewerkt veld. De wandeling naar de hoogste kasten kost een hele ochtend, en wij zorgen ervoor de bijen niet meer te storen dan een seizoen vraagt.',
      'about.ch3.p2': 'Hoogte vormt de honing meer dan welke afzonderlijke bloem dan ook. Koudere nachten vertragen de bijen. De honing wordt dikker. Het karakter wordt dieper.',
      'about.ch3.caption': 'Kast №47 · 1280m',
      'about.n1.lbl': 'Bijenkasten over de zuidflank van Pelion',
      'about.n2.lbl': 'Generaties van één familie op de berg',
      'about.n3.lbl': 'Genummerde potten in de Tamme Kastanje editie',
      'about.n4.lbl': 'Toevoegingen, ooit. Rauwe honing, verzegeld in was.',
      'about.ch4.eyebrow': 'De oogst',
      'about.ch4.h': 'Raten worden koud gecentrifugeerd, op kelder­temperatuur.',
      'about.ch4.p1': 'Wij verhitten de honing nooit. De raten reizen de berg af in lage bakken, worden met de hand ontzegeld en gecentrifugeerd op de temperatuur van de kelder. Zestien graden in het voorjaar, achttien in de zomer. Elk enzym, elke stuifmeelkorrel, elke aromatische noot van het seizoen blijft intact.',
      'about.ch4.p2': 'Daarna rust de honing veertien dagen in eikenhouten vaten. Lucht stijgt. Bezinksel zakt. Niets wordt geforceerd.',
      'about.ch4.caption': 'Oogstochtend · april',
      'about.ch5.eyebrow': 'Familietraditie',
      'about.ch5.h': 'Een ambacht stil doorgegeven van hand tot hand.',
      'about.ch5.p1': 'Een deel van wat wij doen wordt al vijf generaties op dezelfde manier gedaan. Een deel verandert elk jaar. De bijen houden ons eerlijk. De berg houdt ons klein.',
      'about.ch5.p2': 'Wij schalen niet op. Wij mengen niet. Wij verwijderen de was niet van de deksels van de potten. Driehonderdvierentachtig potten in de Tamme Kastanje editie, en als ze op zijn, is het seizoen voorbij.',
      'about.ch5.caption': 'Kelderarchief · 1882 — 2025',
      'about.cta.label': 'De Collectie · 2025',
      'about.cta.h_html': 'Proef de <em>berg.</em>',
      'about.cta.btn': 'Bekijk de collectie',
      // ---------- contact ----------
      'contact.eyebrow': 'Contact · Pelion, Griekenland',
      'contact.headline_html': 'Schrijf naar <em>het huis.</em>',
      'contact.intro': 'Voor groothandel, gastronomie, pers, of simpelweg een rustige vraag over een pot. Stavros en de familie lezen elk bericht en reageren binnen twee werkdagen.',
      'contact.form.h': 'Begin een aanvraag.',
      'contact.form.sub': 'Een paar regels zijn genoeg. Wij reageren persoonlijk.',
      'contact.pill.general': 'Algemeen',
      'contact.pill.wholesale': 'Groothandel',
      'contact.pill.hospitality': 'Gastronomie',
      'contact.pill.retail': 'Retailers',
      'contact.pill.press': 'Pers',
      'contact.pill.collab': 'Samenwerking',
      'contact.label.name': 'Jouw naam',
      'contact.label.house': 'Huis / onderneming',
      'contact.label.email': 'E-mail',
      'contact.label.country': 'Land',
      'contact.label.message': 'Bericht',
      'contact.ph.name': 'Maria Andreou',
      'contact.ph.house': 'Optioneel',
      'contact.ph.email': 'maria@voorbeeld.nl',
      'contact.ph.country': 'Nederland',
      'contact.ph.message': 'Vertel ons wat je in gedachten hebt. Aantallen, timing, de ruimte waarin je de tafel dekt.',
      'contact.submit': 'Aanvraag versturen',
      'contact.formNote': 'Door ons te schrijven ga je ermee akkoord dat wij je bericht bewaren met als doel te kunnen antwoorden. Wij verkopen of delen gegevens nooit.',
      'contact.success.h': 'Je bericht is onderweg.',
      'contact.success.p': 'Stavros of een van de familie zal het persoonlijk lezen en binnen twee werkdagen terugschrijven.',
      'contact.info.h': 'Of schrijf rechtstreeks naar ons.',
      'contact.info.wholesale.lbl': 'Groothandel',
      'contact.info.wholesale.title_html': 'De <em>collectie</em> voeren.',
      'contact.info.wholesale.p': 'Kleine toewijzingen beschikbaar voor onafhankelijke boetieks, delicatessenwinkels en theehuizen in de EU en geselecteerde internationale markten.',
      'contact.info.hospitality.lbl': 'Gastronomie · Restaurants',
      'contact.info.hospitality.title_html': 'Voor de <em>tafel.</em>',
      'contact.info.hospitality.p': 'Wij werken in alle rust met een klein aantal restaurants en hotels per jaar. Proefdozen verzenden binnen de week vanuit Pelion.',
      'contact.info.retail.lbl': 'Premium retailers',
      'contact.info.retail.title_html': 'Een discrete <em>plank.</em>',
      'contact.info.retail.p': 'Geselecteerde retailpartners ontvangen een jaarlijkse toewijzing, editie per editie, met voorrang op de beperkte reserves.',
      'contact.info.press.lbl': 'Pers · Samenwerking',
      'contact.info.press.title_html': 'Een rustiger <em>gesprek.</em>',
      'contact.info.press.p': 'Redactionele vragen, fotografie en creatieve samenwerkingen. Wij reageren langzaam, maar wij reageren.',
      'contact.location.lbl': 'Het landgoed',
      'contact.location.h_html': 'Pelion, <em>Noord-Griekenland.</em>',
      'contact.address_html': 'Harvest Deli &middot; Landgoed №01<br>37006 Pelion, Magnesia<br>Griekenland',
      // ---------- checkout ----------
      'checkout.step.cellar': 'Kelder',
      'checkout.step.checkout': 'Afrekenen',
      'checkout.step.confirmation': 'Bevestiging',
      'checkout.eyebrow': 'Afrekenen · Editie I',
      'checkout.headline_html': 'Een rustige, <em>zorgvuldige</em> overdracht.',
      'checkout.sub': 'Drie stappen. Genummerd, verzegeld, binnen de week verzonden vanuit Pelion.',
      'checkout.express.divider': 'Of betaal met kaart',
      'checkout.step1.h_html': 'Contact &middot; <em>waar wij terugschrijven.</em>',
      'checkout.label.email': 'E-mail',
      'checkout.label.phone': 'Telefoon',
      'checkout.step2.h_html': 'Verzending &middot; <em>het adres.</em>',
      'checkout.label.first': 'Voornaam',
      'checkout.label.last': 'Achternaam',
      'checkout.label.addr1': 'Adresregel 1',
      'checkout.label.addr1Ph': 'Huisnummer, straat',
      'checkout.label.addr2': 'Adresregel 2 — optioneel',
      'checkout.label.addr2Ph': 'Appartement, gebouw, verdieping',
      'checkout.label.city': 'Stad',
      'checkout.label.postcode': 'Postcode',
      'checkout.label.country': 'Land',
      'checkout.ship.standard.title': 'Standaard · met track & trace',
      'checkout.ship.standard.sub': '5 — 8 werkdagen, met handtekening',
      'checkout.ship.express.title': 'Express · koerier',
      'checkout.ship.express.sub': '2 — 3 werkdagen, persoonlijk bezorgd',
      'checkout.ship.intl.title': 'Internationaal · buiten EU',
      'checkout.ship.intl.sub': '7 — 12 werkdagen, belasting vooraf betaald',
      'checkout.step3.h_html': 'Betaling &middot; <em>stil en veilig.</em>',
      'checkout.tab.card': 'Kaart',
      'checkout.tab.bank': 'Overschrijving',
      'checkout.tab.klarna': 'Klarna',
      'checkout.label.cardNumber': 'Kaartnummer',
      'checkout.label.cardName': 'Naam op de kaart',
      'checkout.label.expiry': 'Vervaldatum',
      'checkout.label.cvc': 'CVC',
      'checkout.stripeNote': 'End-to-end versleuteld verwerkt. Wij zien of bewaren je kaart nooit.',
      'checkout.confirm': 'Bestelling bevestigen',
      'checkout.terms_html': 'Door deze bestelling te plaatsen ga je akkoord met onze <a href="#">voorwaarden</a> en <a href="#">privacy</a>. Internationale bestellingen kunnen lokale heffingen meebrengen.',
      'checkout.side.eyebrow': 'Jouw kelder',
      'checkout.side.title_html': 'Bestel<em>overzicht</em>',
      'checkout.empty.h': 'Je kelder is leeg.',
      'checkout.empty.p': 'Voeg een pot uit de collectie toe om af te rekenen.',
      'checkout.empty.cta': 'Bekijk de collectie',
      'checkout.package.lbl': 'Luxe verpakking',
      'checkout.package.h_html': 'Verzegeld in <em>was.</em> In eikenfineer doos.',
      'checkout.package.p': 'Elke pot wordt met de hand gewikkeld, met zwarte was verzegeld en in een doos met eikenfineer gelegd. Een handgeschreven kaart reist met de bestelling mee.',
      'checkout.package.tag': 'Editie I · Oogst 2025',
      'checkout.trust.stripe1': 'Stripe',
      'checkout.trust.stripe2': 'versleuteld',
      'checkout.trust.intl1': 'Wereldwijde',
      'checkout.trust.intl2': 'verzending',
      'checkout.trust.sealed1': 'Verzegeld in',
      'checkout.trust.sealed2': 'Pelion',
      'checkout.row.subtotal': 'Subtotaal',
      'checkout.row.shipping': 'Verzending',
      'checkout.row.total': 'Totaal',
      'checkout.row.shippingFree': 'Gratis',
      // ---------- product detail ----------
      'product.crumb.collection': 'Collectie',
      'product.crumb.current': 'Editie I — Tamme Kastanje',
      'product.eyebrow_html': 'Editie I <span class="dot"></span> Oogst 2025',
      'product.title_html': 'Tamme Kastanje, <em>landgoed Pelion.</em>',
      'product.tag.singleMeadow': 'Eén Weide',
      'product.tag.coldExtracted': 'Koud Gewonnen',
      'product.tag.numbered': 'Genummerd · 384',
      'product.desc': 'Een heldere, traag schenkende honing uit de kastanjebossen op de zuidflank van Pelion. Tonen van warme hars, in de zon gerijpte kruiden en een lange minerale afdronk. Gebotteld in zwaar handgeperst glas, verzegeld in was, ongepasteuriseerd.',
      'product.priceSub_html': 'incl. btw &middot; wereldwijd verzonden',
      'product.size.tasting': 'Proef',
      'product.size.estate': 'Landgoed',
      'product.size.reserve': 'Reserve',
      'product.cta': 'Aan de kelder toevoegen',
      'product.notes_html': 'Gratis verzending in de EU boven €120 <span class="dot"></span> Beperkte uitgave · 384 genummerde potten',
      'product.tasting.eyebrow': 'De Proef',
      'product.tasting.h_html': 'Wat je proeft, langzaam.',
      'product.tasting.first.h': 'I — Eerst',
      'product.tasting.first.quote': '"Warme hars, zon op steen."',
      'product.tasting.first.p': 'Een onmiddellijke ademtocht van den en droge kruiden. De geur van de berg zelf in late juni, wanneer de lucht boven de tijm begint te trillen.',
      'product.tasting.body.h': 'II — Midden',
      'product.tasting.body.quote': '"Zachte amber, trage honing."',
      'product.tasting.body.p': 'Vervolgens neemt de structuur het over, een viscositeit die schenkt als een ingehouden adem. Wilde bloem en een schone, zachte zoetheid in het midden van de tong.',
      'product.tasting.finish.h': 'III — Afdronk',
      'product.tasting.finish.quote': '"Mineraal, lang, goudkleurig."',
      'product.tasting.finish.p': 'Een trage afdaling in steen en zout. Subtiel, bijna droog. Het soort afdronk dat in de kamer blijft hangen lang nadat de lepel is neergelegd.',
      'product.origin.eyebrow': 'De Oorsprong',
      'product.origin.h_html': 'Eén weide, één seizoen.',
      'product.origin.p1': 'De oogst van 2025 komt uit één enkel, zuid-georiënteerd kastanjebos op 950 meter aan de hellingen van de berg Pelion, waar de bomen elk laat zomerseizoen bloeien in een smal venster.',
      'product.origin.p2': 'Driehonderdvierentachtig potten zijn aan dit seizoen onttrokken. Elk met de hand genummerd, met zwarte was verzegeld, en bewaard precies zoals het de raat verliet.',
      'product.origin.caption': 'Pelion · 950m · Late zomer',
      'product.details.eyebrow': 'De Bijzonderheden',
      'product.details.h_html': 'Stil, met zorg gemaakt.',
      'product.det.weight.lbl': 'Netto gewicht',
      'product.det.weight.val_html': '250g <em>glazen pot</em>',
      'product.det.origin.lbl': 'Herkomst',
      'product.det.origin.val_html': 'Pelion, <em>Griekenland</em>',
      'product.det.vintage.lbl': 'Jaargang',
      'product.det.vintage.val_html': 'Late zomer <em>2025</em>',
      'product.det.edition.lbl': 'Editie',
      'product.det.edition.val_html': '384 potten, <em>genummerd</em>',
      'product.det.ingredients.lbl': 'Ingrediënten',
      'product.det.ingredients.val_html': 'Rauwe honing. <em>Verder niets.</em>',
      'product.det.storage.lbl': 'Bewaring',
      'product.det.storage.val_html': 'Koel, droog, <em>uit het licht</em>',
      'product.det.shelf.lbl': 'Houdbaarheid',
      'product.det.shelf.val_html': 'Onbeperkt, <em>verzegeld</em>',
      'product.det.package.lbl': 'Verpakking',
      'product.det.package.val_html': 'Handgeperst glas, <em>zwarte was</em>',
      'product.also.eyebrow': 'Ook Uit De Collectie',
      'product.also.h_html': 'De rest van het huis.',
      'product.sticky.name': 'Tamme Kastanje, landgoed Pelion',
      'product.sticky.price': '€68 · Editie I',
      'product.sticky.add': 'Voeg toe'
    }
  };
  window.HD_T = T;

  let currentLang = (function () {
    try {
      const stored = localStorage.getItem('hd-lang');
      if (stored === 'en' || stored === 'nl') return stored;
    } catch (e) {}
    return (navigator.language || 'en').toLowerCase().startsWith('nl') ? 'nl' : 'en';
  })();
  window.HD_lang = function () { return currentLang; };

  function lookup(key) {
    const t = T[currentLang] && T[currentLang][key];
    if (t !== undefined) return t;
    return T.en[key];
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = lookup(el.dataset.i18n);
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const v = lookup(el.dataset.i18nHtml);
      if (v !== undefined) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.dataset.i18nAttr.split(',').forEach(pair => {
        const idx = pair.indexOf(':');
        if (idx < 0) return;
        const attr = pair.slice(0, idx).trim();
        const key = pair.slice(idx + 1).trim();
        const v = lookup(key);
        if (v !== undefined) el.setAttribute(attr, v);
      });
    });
    // Update language toggle states
    document.querySelectorAll('.lang-toggle button[data-lang]').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === currentLang);
    });
  }
  window.HD_applyTranslations = applyTranslations;

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'nl') return;
    currentLang = lang;
    try { localStorage.setItem('hd-lang', lang); } catch (e) {}
    applyTranslations();
    render(); // re-render cart contents (which reference catalog name strings)
  }
  window.HD_setLang = setLang;

  // ---------- Product catalog (with per-language strings) ----------
  function loc(en, nl) { return { en: en, nl: nl }; }
  const PRODUCTS = {
    'chestnut': {
      name: loc('Chestnut Honey', 'Tamme Kastanje'),
      edition: loc('Edition I', 'Editie I'),
      region: loc('Pelion · Greece', 'Pelion · Griekenland'),
      altitude: '950m',
      price: 68,
      hue: 'amber',
      notes: loc('Warm resin, sun-baked herb, mineral finish.', 'Warme hars, in de zon gerijpte kruiden, minerale afdronk.'),
      texture: loc('Liquid, slow-pouring', 'Vloeibaar, traag schenkend'),
      weight: '250g',
      tags: ['mountain', 'forest', 'raw', 'cold-extracted', 'dark'],
      badges: [loc('Raw', 'Rauw'), loc('Mountain Honey', 'Berg Honing')],
      slug: 'chestnut',
      url: 'product.html'
    },
    'wild-thyme': {
      name: loc('Wild Thyme', 'Wilde Tijm'),
      edition: loc('Edition II', 'Editie II'),
      region: loc('Lakonia · Greece', 'Lakonia · Griekenland'),
      altitude: '750m',
      price: 58,
      hue: 'straw',
      notes: loc('Bright herb, citrus blossom, honeycomb wax.', 'Frisse kruiden, citrusbloesem, honingraat-was.'),
      texture: loc('Light, fluid', 'Licht, vloeibaar'),
      weight: '250g',
      tags: ['floral', 'mountain', 'cold-extracted', 'light'],
      badges: [loc('Estate Batch', 'Landgoed Batch'), loc('Spring Harvest', 'Voorjaars Oogst')],
      slug: 'wild-thyme',
      url: 'product.html?p=wild-thyme'
    },
    'pine-heather': {
      name: loc('Pine & Heather', 'Den & Heide'),
      edition: loc('Edition III', 'Editie III'),
      region: loc('Halkidiki · Greece', 'Halkidiki · Griekenland'),
      altitude: '1200m',
      price: 72,
      hue: 'bronze',
      notes: loc('Smoked pine, dried fig, dark woodland.', 'Gerookte den, gedroogde vijg, donker bos.'),
      texture: loc('Set, almost waxy', 'Vast, bijna wasachtig'),
      weight: '250g',
      tags: ['forest', 'raw', 'dark', 'mountain'],
      badges: [loc('Raw', 'Rauw'), loc('Forest Honey', 'Bos Honing')],
      slug: 'pine-heather',
      url: 'product.html?p=pine-heather'
    },
    'spring-wildflower': {
      name: loc('Spring Wildflower', 'Lente Wilde Bloem'),
      edition: loc('Edition IV', 'Editie IV'),
      region: loc('Pelion · Greece', 'Pelion · Griekenland'),
      altitude: '600m',
      price: 54,
      hue: 'pale',
      notes: loc('Apple blossom, soft pollen, fresh meadow.', 'Appelbloesem, zacht stuifmeel, frisse weide.'),
      texture: loc('Smooth, creamy', 'Glad, romig'),
      weight: '250g',
      tags: ['wildflower', 'floral', 'light', 'cold-extracted'],
      badges: [loc('Spring Harvest', 'Voorjaars Oogst'), loc('Creamy', 'Romig')],
      slug: 'spring-wildflower',
      url: 'product.html?p=spring-wildflower'
    },
    'mountain-reserve': {
      name: loc('Mountain Reserve', 'Berg Reserve'),
      edition: loc('Reserve · 2025', 'Reserve · 2025'),
      region: loc('Mt Olympus · Greece', 'Berg Olympus · Griekenland'),
      altitude: '1400m',
      price: 148,
      hue: 'deep',
      notes: loc('Black walnut, slate, long mineral echo.', 'Zwarte walnoot, leisteen, lange minerale echo.'),
      texture: loc('Dense, dark, viscous', 'Dik, donker, stroperig'),
      weight: '250g',
      tags: ['mountain', 'forest', 'limited', 'raw', 'dark'],
      badges: [loc('Limited 48', 'Beperkt 48'), loc('Estate Batch', 'Landgoed Batch')],
      slug: 'mountain-reserve',
      url: 'product.html?p=mountain-reserve'
    },
    'orange-blossom': {
      name: loc('Orange Blossom', 'Sinaasappelbloesem'),
      edition: loc('Edition V', 'Editie V'),
      region: loc('Peloponnese · Greece', 'Peloponnesos · Griekenland'),
      altitude: '200m',
      price: 52,
      hue: 'pale',
      notes: loc('Neroli, orange peel, warm vanilla.', 'Neroli, sinaasappelschil, warme vanille.'),
      texture: loc('Liquid, perfumed', 'Vloeibaar, geparfumeerd'),
      weight: '250g',
      tags: ['floral', 'wildflower', 'light', 'cold-extracted'],
      badges: [loc('Spring Harvest', 'Voorjaars Oogst'), loc('Floral', 'Bloemig')],
      slug: 'orange-blossom',
      url: 'product.html?p=orange-blossom'
    }
  };
  // Localize on access: returns plain-string clone for current lang.
  function localizedProduct(slug) {
    const p = PRODUCTS[slug];
    if (!p) return null;
    function pick(v) { return (v && typeof v === 'object' && 'en' in v) ? (v[currentLang] || v.en) : v; }
    return {
      slug: p.slug,
      url: p.url,
      price: p.price,
      hue: p.hue,
      altitude: p.altitude,
      weight: p.weight,
      tags: p.tags,
      name: pick(p.name),
      edition: pick(p.edition),
      region: pick(p.region),
      notes: pick(p.notes),
      texture: pick(p.texture),
      badges: (p.badges || []).map(pick)
    };
  }
  window.HD_PRODUCTS = PRODUCTS;
  window.HD_product = localizedProduct;

  // ---------- Cart state ----------
  const STORAGE = 'hd-cart-v1';
  const cart = {
    items: [],
    load() {
      try {
        this.items = JSON.parse(localStorage.getItem(STORAGE) || '[]');
        if (!Array.isArray(this.items)) this.items = [];
        // sanitize unknown slugs
        this.items = this.items.filter(i => PRODUCTS[i.slug]);
      } catch (e) { this.items = []; }
    },
    save() { try { localStorage.setItem(STORAGE, JSON.stringify(this.items)); } catch (e) {} },
    add(slug, qty) {
      if (!PRODUCTS[slug]) return;
      qty = qty || 1;
      const existing = this.items.find(i => i.slug === slug);
      if (existing) existing.qty += qty;
      else this.items.push({ slug: slug, qty: qty });
      this.save(); render();
    },
    remove(slug) {
      this.items = this.items.filter(i => i.slug !== slug);
      this.save(); render();
    },
    setQty(slug, qty) {
      const item = this.items.find(i => i.slug === slug);
      if (!item) return;
      if (qty < 1) return this.remove(slug);
      item.qty = qty;
      this.save(); render();
    },
    count() { return this.items.reduce((s, i) => s + i.qty, 0); },
    total() { return this.items.reduce((s, i) => s + i.qty * PRODUCTS[i.slug].price, 0); }
  };
  cart.load();
  window.HD_CART = cart;

  // ---------- Render helpers ----------
  function formatPrice(n) { return '€' + n.toFixed(0); }

  function render() {
    // Cart counts in nav buttons
    document.querySelectorAll('.nav-cart').forEach(btn => {
      const count = cart.count();
      const countEl = btn.querySelector('.cart-count');
      if (countEl) countEl.textContent = count;
      btn.classList.toggle('has-items', count > 0);
    });

    // Drawer items
    const itemsWrap = document.getElementById('cartItems');
    if (itemsWrap) {
      if (cart.items.length === 0) {
        itemsWrap.innerHTML = `
          <div class="cart-empty">
            <h4>${lookup('cart.empty.h')}</h4>
            <p>${lookup('cart.empty.p')}</p>
            <a href="shop.html" class="cart-empty-cta">${lookup('cart.empty.cta')}</a>
          </div>
        `;
      } else {
        itemsWrap.innerHTML = cart.items.map(i => {
          const p = localizedProduct(i.slug);
          return `
            <div class="cart-line" data-slug="${i.slug}">
              <a class="thumb" href="${p.url}"><img class="mini-photo ${p.hue}" src="harvestdeli.png" alt="${p.name}"></a>
              <div class="meta">
                <a class="name" href="${p.url}" style="text-decoration:none;color:inherit;">${p.name}</a>
                <div class="edition">${p.edition}</div>
                <div class="qty">
                  <button data-act="dec" aria-label="−">&minus;</button>
                  <span class="val">${i.qty}</span>
                  <button data-act="inc" aria-label="+">+</button>
                </div>
              </div>
              <div class="price-col">
                <div class="price">${formatPrice(p.price * i.qty)}</div>
                <button class="remove" data-act="remove">${lookup('cart.remove')}</button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Totals
    const total = document.getElementById('cartTotal');
    if (total) total.textContent = formatPrice(cart.total());

    // Checkout-page reflection
    const summary = document.getElementById('checkoutSummary');
    if (summary) renderCheckoutSummary();
  }

  // ---------- Drawer toggle ----------
  function openCart() {
    const drawer = document.getElementById('cartDrawer');
    if (!drawer) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    const drawer = document.getElementById('cartDrawer');
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  window.HD_openCart = openCart;
  window.HD_closeCart = closeCart;

  // ---------- Toast ----------
  let toastT;
  function toast(msg) {
    let el = document.getElementById('cartToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cartToast';
      el.className = 'cart-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 2400);
  }
  window.HD_toast = toast;

  // ---------- Checkout summary ----------
  function renderCheckoutSummary() {
    const wrap = document.getElementById('checkoutSummary');
    if (!wrap) return;
    if (cart.items.length === 0) {
      wrap.innerHTML = `
        <div class="checkout-empty">
          <h3>${lookup('checkout.empty.h')}</h3>
          <p>${lookup('checkout.empty.p')}</p>
          <a href="shop.html" class="checkout-empty-cta">${lookup('checkout.empty.cta')}</a>
        </div>
      `;
      return;
    }
    const subtotal = cart.total();
    const shipping = subtotal >= 120 ? 0 : 9;
    const total = subtotal + shipping;
    const lines = cart.items.map(i => {
      const p = localizedProduct(i.slug);
      return `
        <div class="ck-line">
          <span class="thumb-mini"><img class="mini-photo ${p.hue}" src="harvestdeli.png" alt="${p.name}"></span>
          <div class="ck-meta">
            <div class="ck-name">${p.name}</div>
            <div class="ck-edition">${p.edition} &middot; ${p.weight} &middot; ×${i.qty}</div>
          </div>
          <div class="ck-line-price">${formatPrice(p.price * i.qty)}</div>
        </div>
      `;
    }).join('');
    wrap.innerHTML = `
      <div class="ck-lines">${lines}</div>
      <div class="ck-totals">
        <div class="ck-row"><span>${lookup('checkout.row.subtotal')}</span><span>${formatPrice(subtotal)}</span></div>
        <div class="ck-row"><span>${lookup('checkout.row.shipping')}</span><span>${shipping === 0 ? lookup('checkout.row.shippingFree') : formatPrice(shipping)}</span></div>
        <div class="ck-row ck-grand"><span>${lookup('checkout.row.total')}</span><span>${formatPrice(total)}</span></div>
      </div>
    `;
  }

  // ---------- Wire up after DOM ready ----------
  function init() {
    // Cart buttons in nav
    document.querySelectorAll('.nav-cart').forEach(btn => {
      btn.addEventListener('click', (e) => { e.preventDefault(); openCart(); });
    });

    // Drawer interactions (delegated, since drawer content re-renders)
    const drawer = document.getElementById('cartDrawer');
    if (drawer) {
      drawer.querySelector('.cart-backdrop').addEventListener('click', closeCart);
      drawer.querySelector('.cart-close').addEventListener('click', closeCart);
      drawer.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-act], a');
        if (!btn) return;
        const line = e.target.closest('.cart-line');
        if (!line) return;
        const slug = line.dataset.slug;
        const act = btn.dataset.act;
        if (act === 'inc') {
          const it = cart.items.find(i => i.slug === slug);
          if (it) cart.setQty(slug, it.qty + 1);
        } else if (act === 'dec') {
          const it = cart.items.find(i => i.slug === slug);
          if (it) cart.setQty(slug, it.qty - 1);
        } else if (act === 'remove') {
          cart.remove(slug);
        }
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCart();
    });

    // Universal add-to-cart buttons
    document.body.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add-to-cart]');
      if (!addBtn) return;
      e.preventDefault();
      const slug = addBtn.dataset.addToCart;
      const qty = parseInt(addBtn.dataset.qty || '1', 10) || 1;
      if (!PRODUCTS[slug]) return;
      cart.add(slug, qty);
      const p = localizedProduct(slug);
      toast(lookup('cart.added') + ' — ' + p.name);
      if (addBtn.dataset.openCart !== 'false') {
        setTimeout(openCart, 240);
      }
    });

    // Language toggle bindings
    document.querySelectorAll('.lang-toggle button[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });

    // Honey droplet microinteraction on the Shop nav link
    setupHoneyShopLinks();

    applyTranslations();
    render();
  }

  // ---------- Honey droplet underline on the SHOP nav link ----------
  // Subtle luxury detail: every ~9s a tiny amber droplet forms, stretches,
  // separates, falls softly downward.
  function setupHoneyShopLinks() {
    const HONEY_SVG =
      '<svg class="honey-svg" viewBox="0 0 16 22" aria-hidden="true">' +
        '<defs>' +
          '<radialGradient id="hdGrad" cx="40%" cy="32%" r="62%">' +
            '<stop offset="0%" stop-color="rgba(255,238,196,0.95)"/>' +
            '<stop offset="55%" stop-color="rgba(212,172,106,0.92)"/>' +
            '<stop offset="100%" stop-color="rgba(138,98,40,0.9)"/>' +
          '</radialGradient>' +
        '</defs>' +
        '<g class="hl-hang">' +
          '<path d="M 8 0 Q 5.8 1.8 6 4.6 Q 6 7 8 7.4 Q 10 7 10 4.6 Q 10.2 1.8 8 0 Z" fill="url(#hdGrad)"/>' +
        '</g>' +
        '<g class="hl-fall">' +
          '<ellipse cx="8" cy="2" rx="1.5" ry="1.9" fill="url(#hdGrad)"/>' +
          '<ellipse cx="7.5" cy="1.5" rx="0.35" ry="0.5" fill="rgba(255,250,220,0.75)"/>' +
        '</g>' +
      '</svg>';

    document.querySelectorAll('.nav-acquire').forEach(el => {
      if (el.classList.contains('honey-shop')) return;
      el.classList.add('honey-shop');

      // Move any data-i18n from the link onto a wrapper span so translation
      // updates don't clobber the honey-underline child we inject below.
      if (!el.querySelector('.shop-label')) {
        const i18nKey = el.dataset.i18n;
        const text = (el.textContent || '').trim();
        el.textContent = '';
        const label = document.createElement('span');
        label.className = 'shop-label';
        label.textContent = text;
        if (i18nKey) {
          label.dataset.i18n = i18nKey;
          delete el.dataset.i18n;
        }
        el.appendChild(label);
      }

      if (!el.querySelector('.honey-underline')) {
        const u = document.createElement('span');
        u.className = 'honey-underline';
        u.setAttribute('aria-hidden', 'true');
        u.innerHTML = HONEY_SVG;
        el.appendChild(u);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
