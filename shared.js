/* ============================================================
   Harvest Deli, shared logic
   Product catalog + cart state + drawer + menu wiring
   ============================================================ */

/* =================================================================
   CINEMATIC INTRO, runs once per session, before anything else.
   Pre-paint shield is set by inline head script; this builds the
   real cinematic overlay (wordmark + halo + sweep + grain) and
   choreographs the entrance / exit, then unveils the homepage.
   ================================================================= */
(function () {
  'use strict';
  const SESSION_KEY = 'hd-intro-played-v1';
  const root = document.documentElement;
  const isPending = root.classList.contains('hd-intro-pending');
  // Intro is the brand's "front door", only plays on entries through index.html.
  // The head shield script only ships on the homepage, so any page without
  // .hd-intro-pending wasn't meant to show the intro and we exit early.
  if (!isPending) return;
  let alreadyPlayed = false;
  try { alreadyPlayed = !!sessionStorage.getItem(SESSION_KEY); } catch (e) {}
  // If sessionStorage says we already played but the head shield is up
  // (e.g. came back to / after viewing shop), drop the shield and unveil.
  if (alreadyPlayed) {
    root.classList.remove('hd-intro-pending');
    root.classList.add('hd-intro-done');
    setTimeout(() => root.classList.remove('hd-intro-done'), 800);
    return;
  }

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Build the overlay (uses #harvestDeliLogoDark which is defined in each page's <defs>) ----
  function build() {
    const wrap = document.createElement('div');
    wrap.className = 'hd-intro';
    wrap.setAttribute('role', 'presentation');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML =
      '<div class="hd-intro__pattern"  aria-hidden="true"></div>' +
      '<div class="hd-intro__halo"     aria-hidden="true"></div>' +
      '<div class="hd-intro__sweep"    aria-hidden="true"></div>' +
      '<div class="hd-intro__vignette" aria-hidden="true"></div>' +
      '<div class="hd-intro__grain"    aria-hidden="true"></div>' +
      '<div class="hd-intro__stage">' +
        '<span class="hd-intro__rule" aria-hidden="true"></span>' +
        '<svg class="hd-intro__mark" viewBox="0 0 260 100" aria-label="Harvest Deli">' +
          '<use href="#harvestDeliLogoDark"/>' +
        '</svg>' +
        '<span class="hd-intro__rule hd-intro__rule--bot" aria-hidden="true"></span>' +
        '<span class="hd-intro__tagline">Pelion · Greece</span>' +
      '</div>';
    return wrap;
  }

  function mount() {
    if (document.querySelector('.hd-intro')) return;
    const overlay = build();
    document.body.appendChild(overlay);
    // Drop the pre-paint shield class, the real overlay is now in place
    root.classList.remove('hd-intro-pending');
    root.classList.add('hd-intro-active');

    const HOLD = reduced ? 2200 : 4600;  // ms before the curtain begins to rise (cinematic, unhurried)
    const EXIT = reduced ? 800 : 1400;   // ms for the curtain transition itself

    let dismissed = false;
    let exitTimer = setTimeout(beginExit, HOLD);

    function beginExit() {
      if (dismissed) return;
      dismissed = true;
      clearTimeout(exitTimer);
      overlay.classList.add('exiting');
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
      // Unveil the homepage simultaneously
      root.classList.remove('hd-intro-active');
      root.classList.add('hd-intro-done');
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        // Body opacity transition is short, clear the helper class after
        setTimeout(() => root.classList.remove('hd-intro-done'), 800);
      }, EXIT);
    }

    // Skip on tap / click / keypress, anywhere
    function skip(e) {
      if (e && e.type === 'keydown') {
        const k = e.key;
        if (k !== 'Enter' && k !== ' ' && k !== 'Escape') return;
      }
      beginExit();
    }
    overlay.addEventListener('click', skip, { once: true });
    document.addEventListener('keydown', skip, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

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
      'cart.empty.eyebrow': 'Your cellar',
      'cart.empty.h': 'The cellar awaits.',
      'cart.empty.p': 'Small-batch harvests from Pelion, prepared quietly and shipped across Europe.',
      'cart.empty.cta': 'View the collection',
      'cart.empty.suggest': 'Begin with',
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
      'footer.bottom2': 'MMXXV',
      'footer.builtBy': 'Designed & built by',
      'footer.news.eyebrow': 'The Harvest Letter',
      'footer.news.lead': 'Occasional notes from the mountain: new harvests, quiet stories, nothing more.',
      'footer.news.placeholder': 'Your email',
      'footer.news.cta': 'Subscribe',
      'footer.news.ok': 'Thank you. A quiet welcome to the table.',
      'oil.eyebrow': 'The Other Harvest · Olive Oil',
      'oil.title': 'Pressed from sun-warmed olives, slowly.',
      'oil.lead': 'From a handful of old groves on the Pelion slope, hand-picked in the first cold weeks of winter and pressed within hours over stone. Unhurried, unfiltered, green and alive.',
      'oil.note': 'A single estate. A single pressing. Bottled the day it runs.',
      'oil.cta': 'Discover the oil',
      'oil.cap': 'Pelion · First cold pressing',
      'jp.eyebrow': 'The Journal · Field notes from Pelion',
      'jp.title': 'Slow reading from the mountain.',
      'jp.cat.tasting': 'Tasting',
      'jp.cat.guide': 'Guide',
      'jp.a1.title': 'Taste the Greek sun.',
      'jp.a1.excerpt': 'What the Greek sun actually tastes like, and how to read a single jar slowly, in three movements.',
      'jp.a2.title': 'Where to buy real Greek honey in the Netherlands.',
      'jp.a2.excerpt': 'How to tell single-estate mountain honey from the supermarket shelf, and where to find it in Amsterdam.',
      'jp.a3.title': 'Why Greek honey tastes unlike supermarket honey.',
      'jp.a3.excerpt': 'Mountain flowers, raw extraction and small batches: the quiet reasons one spoon lingers and another does not.',
      'jp.read_html': 'Read the essay <span class="arrow" aria-hidden="true"></span>',
      'jp.cta': 'Visit the Journal',
      'ig.h_html': 'From the grove, <em>in slow rotation.</em>',
      'ig.follow': 'Follow on Instagram',
      'a11y.skipLink': 'Skip to content',
      'idx.h1': 'Harvest Deli, single-estate Greek honey from the hills of Pelion',
      // ---------- Harvest Concierge (floating chat) ----------
      'concierge.fab': 'Write to us',
      'concierge.title': 'Chat with Harvest Deli',
      'concierge.subtitle': 'Pelion, Greece',
      'concierge.online': 'Real human · Replies within hours',
      'concierge.greeting': 'Welcome to Harvest Deli.\nHow may we help you today?',
      'concierge.intro': 'Choose a topic below, we’ll continue the conversation on WhatsApp.',
      'concierge.action.product': 'Ask about a product',
      'concierge.action.retail': 'Retail & hospitality',
      'concierge.action.shipping': 'Shipping & delivery',
      'concierge.action.gift': 'Gifts & corporate orders',
      'concierge.action.concierge': 'Speak with our team',
      'concierge.msg.product': 'Hello Harvest Deli, I would like to know more about your collection.',
      'concierge.msg.retail': 'Hello Harvest Deli, I would like to explore a retail or hospitality partnership.',
      'concierge.msg.shipping': 'Hello Harvest Deli, I have a question about shipping and delivery.',
      'concierge.msg.gift': 'Hello Harvest Deli, I would like to arrange a gift or corporate order.',
      'concierge.msg.concierge': 'Hello Harvest Deli, I would like to speak with your team.',
      'concierge.close': 'Close',
      'concierge.privacy': 'Conversations open in WhatsApp. We never share your number.',
      // ---------- Find Us in Amsterdam ----------
      'markets.nav': 'Markets',
      'markets.menu_html': 'The <em>Markets</em>',
      'markets.menu_sub': 'Find us in Amsterdam',
      'markets.eyebrow': 'From Pelion to Amsterdam',
      'markets.hero.h_html': 'Find us<br><em>in Amsterdam.</em>',
      'markets.hero.kicker': 'The markets',
      'markets.hero.h': 'From Pelion to Amsterdam.',
      'markets.hero.sub': 'Quiet market mornings, mountain harvests and slow conversations.',
      'markets.badge.weekly': 'Weekly',
      'markets.badge.monthly': 'Monthly',
      'markets.label.where': 'Location',
      'markets.label.when': 'When',
      'markets.label.expect': 'What to expect',
      'markets.expect.val': 'Greek honey, olive oil & mountain tea',
      'markets.maps': 'Open in Google Maps',
      'markets.maps.google': 'Google Maps',
      'markets.maps.apple': 'Apple Maps',
      'markets.contact.eyebrow': 'Inquiries',
      'markets.contact.h': 'For market, wholesale or hospitality inquiries, write to us.',
      'markets.contact.cta': 'Write to us',
      'markets.cards.eyebrow': 'Two tables',
      'markets.cards.h_html': 'Where you can find <em>the harvest.</em>',
      'markets.tenkate.tag': 'Weekly · West',
      'markets.tenkate.title': 'Tenkate Market',
      'markets.tenkate.hours': 'Monday, Saturday · 09:00, 17:00',
      'markets.tenkate.addr': 'Ten Katestraat · Amsterdam-West',
      'markets.tenkate.desc': 'Our weekly table, a few crates of honey, a tasting spoon, an open jar. Stop by between errands; we’ll pour the morning coffee.',
      'markets.westerpark.tag': 'Monthly · Sunday',
      'markets.westerpark.title': 'Sunday Market · Westerpark',
      'markets.westerpark.hours': 'First Sunday of every month · 11:00, 17:00',
      'markets.westerpark.addr': 'Westergasterrein · Amsterdam-West',
      'markets.westerpark.desc': 'A slower Sunday gathering inside the old gasworks. Linen, candlelight at dusk, and the harvest poured one spoon at a time.',
      'markets.story.eyebrow': 'The table',
      'markets.story.lead_html': '“For us, markets are not only about selling honey. They are about <em>conversation, tasting</em> and sharing the harvest.”',
      'markets.story.body': 'Each morning we set out the same way our family has for four generations on the slopes of Pelion, linen folded, jars uncapped, a spoon laid across the rim. Amsterdam, with its bicycles and its grey-morning light, has welcomed our small ritual. Come early. Stay slow. Taste before you speak.',
      'markets.story.sig': 'Stelios &amp; Eleni Andreou',
      'markets.story.sigsub': 'Pelion · Amsterdam',
      'markets.gallery.eyebrow': 'A photo journal',
      'markets.gallery.h_html': '<em>Mornings</em> at the table.',
      'markets.gallery.cap1': 'Sunlight through the linen, just after opening.',
      'markets.gallery.cap2': 'The first tasting of the day.',
      'markets.gallery.cap3': 'A regular guest, a regular spoon.',
      'markets.gallery.cap4': 'Wax-sealed editions in a wooden crate.',
      'markets.gallery.cap5': 'A quiet conversation about provenance.',
      'markets.gallery.cap6': 'Westerpark · first Sunday, late afternoon.',
      'markets.map.eyebrow': 'Two locations · Amsterdam-West',
      'markets.map.h_html': 'A short walk from the canals.',
      'markets.map.lead': 'Both tables are within Amsterdam-West, a fifteen-minute cycle from the centre. Tram 7 stops near both. The light is best before noon.',
      'markets.map.pin1': 'Tenkate Market',
      'markets.map.pin2': 'Westerpark',
      'markets.cta.eyebrow': 'Visit the table',
      'markets.cta.h_html': 'Come and <em>taste the harvest.</em>',
      'markets.cta.lead': 'Bring an empty afternoon and an honest appetite. There is always coffee, always a spoon, always a story.',
      'markets.cta.schedule': 'View Market Schedule',
      'markets.cta.trade': 'Retail & Hospitality',
      'idx.markets.eyebrow': 'VI, In Amsterdam',
      'idx.markets.h_html': 'Find us at the <em>market table.</em>',
      'idx.markets.body': 'From Pelion to Amsterdam. Two tables, set with linen, a tasting spoon and the morning coffee, quietly brought from the hills of Greece to the markets of Amsterdam.',
      'idx.markets.cta': 'Find us in Amsterdam',
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
      'idx.sel.eyebrow': 'The collection',
      'idx.sel.title': 'Selected harvests.',
      'idx.sel.cta': 'Explore the collection',
      // ---------- index editorial ----------
      'idx.ch1.eyebrow': 'I, The Origin',
      'idx.ch1.h': 'Born in the quiet hills of Northern Greece.',
      'idx.ch1.body': 'For five generations, a single family has tended a thousand hives across the limestone ridges of Mount Pelion. Wild thyme, heather and arbutus bloom in a single, untranslatable season. The honey is shaped by this land, and by nothing else.',
      'idx.ch1.caption': 'Pelion · Spring harvest',
      'idx.ch2.eyebrow': 'II, The Process',
      'idx.ch2.h': 'A practice refined by time, not technology.',
      'idx.step1.h': 'Gathered at altitude',
      'idx.step1.p': 'Hives are placed where wildflowers grow untended. Never near agriculture, never near a road. The bees decide where to forage; we simply listen.',
      'idx.step2.h': 'Cold extracted',
      'idx.step2.p': 'Combs are spun at the temperature of the cellar, never heated. Every enzyme, every pollen, every memory of the season remains intact.',
      'idx.step3.h': 'Settled, never strained',
      'idx.step3.p': 'The honey rests for fourteen days in oak vats. Air rises, sediment falls. Nothing is forced, nothing is filtered, and the texture remains alive.',
      'idx.taste.quote': 'A taste that holds the memory of a mountain morning. Warm, golden, slow to leave.',
      'idx.taste.cite': 'Notes from the tasting room',
      'idx.preview.eyebrow': 'The Collection',
      'idx.preview.h_html': 'Three from the cellar, <em>numbered.</em>',
      'idx.preview.addToCellar': 'Add to Cellar',
      'idx.preview.exploreAll': 'View all six editions',
      'idx.product.eyebrow': 'The Collection · Edition I',
      'idx.product.title_html': 'Chestnut Honey, <em>2025 harvest.</em>',
      'idx.product.originLine_html': 'Pelion <span class="dot"></span> 950m <span class="dot"></span> 384 jars',
      'idx.product.desc': 'A single-meadow honey of remarkable clarity. Notes of warm resin, sun-baked herb, and a long mineral finish. Bottled in heavy hand-pressed glass, numbered by hand, kept untreated.',
      'idx.product.cta_html': 'View the jar, €68',
      // ---------- shop ----------
      'shop.eyebrow': 'The Collection · 2025',
      'shop.headline_html': 'A small, <em>numbered</em> library of the Greek harvest.',
      'shop.intro': 'Nine single-origin honeys, a cold-pressed olive oil and a wild mountain tea, each kept untreated, sealed by hand, and shipped quietly from Greece within the week.',
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
      'menu.item.account_html': 'The <em>Account</em>',
      'menu.item.account_sub': 'Orders & addresses',
      'ck.step.cart': 'Cart',
      'ck.step.details': 'Details',
      'ck.step.delivery': 'Delivery',
      'ck.step.payment': 'Payment',
      'ck.step.review': 'Review',
      'ck.continue': 'Continue',
      'ck.back': 'Back',
      'ck.place': 'Place order',
      'ck.total': 'Total',
      'ck.apply': 'Apply',
      'ck.add': 'Add',
      'ck.remove': 'Remove',
      'ck.keepShopping': 'Continue shopping',
      'ck.toDelivery': 'Continue to delivery',
      'ck.toPayment': 'Continue to payment',
      'ck.toReview': 'Review order',
      'ck.subtotal': 'Subtotal',
      'ck.discount': 'Discount',
      'ck.shipping': 'Shipping',
      'ck.free': 'Free',
      'ck.pickup': 'Pickup',
      'ck.empty.h': 'Your cellar is empty',
      'ck.empty.p': 'Begin the collection, each jar is numbered, sealed in wax and shipped within the week.',
      'ck.empty.cta': 'Browse the collection',
      'ck.discount.label': 'Discount code',
      'ck.discount.ph': 'Discount code',
      'ck.discount.ok': 'Code applied',
      'ck.discount.bad': 'That code is not valid',
      'ck.upsell.h': 'Complete your order',
      'ck.details.h_html': 'Details &middot; <em>where to write back.</em>',
      'ck.billing': 'Billing address',
      'ck.company': 'Company, optional',
      'ck.vat': 'VAT number, optional',
      'ck.sameAddr': 'Shipping address is the same as billing',
      'ck.save': 'Save these details for next time',
      'ck.delivery.h_html': 'Delivery &middot; <em>how it travels.</em>',
      'ck.deliveryNote': 'Free standard shipping on orders over €75. Every parcel ships tracked & insured.',
      'ck.freeProgress': 'Add {x} more for free shipping',
      'ck.payment.h_html': 'Payment &middot; <em>quietly secure.</em>',
      'ck.demoPill': 'Demo',
      'ck.payNote': 'Provider-agnostic UI. No card is charged here, Stripe or Mollie connects at this step in production.',
      'ck.badge.secure': 'Secure SSL checkout',
      'ck.badge.returns': '14-day returns',
      'ck.badge.tracked': 'Tracked & insured',
      'ck.review.h_html': 'Review &middot; <em>before we seal it.</em>',
      'ck.review.contact': 'Contact',
      'ck.review.ship': 'Ship to',
      'ck.review.bill': 'Billing',
      'ck.review.delivery': 'Delivery',
      'ck.review.payment': 'Payment',
      'ck.edit': 'Edit',
      'ck.terms_html': 'I agree to the <a href="legal-terms.html">terms &amp; conditions</a>.',
      'ck.privacy_html': 'I have read the <a href="legal-privacy.html">privacy statement</a>.',
      'ck.consentError': 'Please accept the terms and privacy statement to continue.',
      'ck.secureInline': 'Encrypted & secure',
      'ck.faq.h': 'Questions before you order',
      'ck.faq.q1': 'When will my order ship?',
      'ck.faq.a1': 'Orders placed before 14:00 CET ship the same business day from the Netherlands, carefully packed and sealed.',
      'ck.faq.q2': 'Do you ship internationally?',
      'ck.faq.a2': 'Yes, across the EU and beyond, tracked & insured. Delivery estimates are shown per carrier at the delivery step.',
      'ck.faq.q3': 'Can I return an order?',
      'ck.faq.a3': 'Unopened jars can be returned within 14 days. See our <a href="legal-returns.html">returns policy</a> or write to <a href="mailto:orders@harvestdeli.nl">orders@harvestdeli.nl</a>.',
      'ck.err.required': 'Required',
      'ck.err.email': 'Enter a valid email',
      'ck.err.postcode': 'Enter a valid postcode',
      'ck.qty.dec': 'Decrease quantity',
      'ck.qty.inc': 'Increase quantity',
      'auth.eyebrow': 'Account',
      'auth.login.title_html': 'Welcome <em>back.</em>',
      'auth.login.sub': 'Sign in to view your orders, saved addresses and details.',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.show': 'Show',
      'auth.remember': 'Keep me signed in',
      'auth.forgot': 'Forgot password?',
      'auth.signIn': 'Sign in',
      'auth.noAccount': 'New here?',
      'auth.create': 'Create an account',
      'auth.guest': 'Continue as guest',
      'auth.register.title_html': 'Join the <em>cellar.</em>',
      'auth.register.sub': 'Create an account to track orders and check out faster next time.',
      'auth.confirm': 'Confirm password',
      'auth.agree_html': 'I agree to the <a href="legal-terms.html">terms</a> and <a href="legal-privacy.html">privacy statement</a>.',
      'auth.createAccount': 'Create account',
      'auth.haveAccount': 'Already have an account?',
      'auth.forgot.title_html': 'Reset your <em>password.</em>',
      'auth.forgot.sub': 'Enter your email and we will send a link to set a new password.',
      'auth.sendLink': 'Send reset link',
      'auth.forgot.done': 'If an account exists for that email, a reset link is on its way. (Demo: no email is actually sent, Supabase resetPasswordForEmail connects here.)',
      'auth.backToLogin': 'Back to sign in',
      'acct.eyebrow': 'Your account',
      'acct.nav.dashboard': 'Dashboard',
      'acct.nav.orders': 'Orders',
      'acct.nav.addresses': 'Addresses',
      'acct.nav.details': 'Details',
      'acct.logout': 'Sign out',
      'acct.dash.h_html': 'Your <em>account.</em>',
      'acct.dash.lead': 'Everything in one calm place, orders, addresses and your details.',
      'acct.dash.ordersD': 'Track & re-order',
      'acct.dash.addrD': 'Saved delivery addresses',
      'acct.dash.detailsD': 'Name & contact',
      'acct.dash.shop': 'Shop',
      'acct.dash.shopD': 'Browse the collection',
      'acct.dash.recent': 'Latest order',
      'acct.orders.h_html': 'Your <em>orders.</em>',
      'acct.orders.lead': 'Every numbered jar you have ordered, newest first.',
      'acct.addr.h_html': 'Saved <em>addresses.</em>',
      'acct.addr.lead': 'Delivery addresses for a faster checkout next time.',
      'acct.addr.add': 'Add an address',
      'acct.addr.save': 'Save address',
      'acct.details.h_html': 'Your <em>details.</em>',
      'acct.details.lead': 'Name and contact information for your orders.',
      'acct.details.save': 'Save changes',
      'acct.details.saved': 'Saved.',
      'acct.demoNote': 'Demo session, this stores your details locally in your browser and does not perform real authentication. Supabase Auth connects here in production.',
      'ok.eyebrow': 'Order confirmed',
      'ok.title_html': 'Thank <em>you.</em>',
      'ok.title': 'Your harvest is reserved.',
      'ok.sub': 'Packed quietly in Pelion and prepared for its journey. A confirmation is on its way.',
      'ok.orderNo': 'Order number',
      'ok.email': 'A confirmation email is on its way. (Demo: no email is actually sent, your order is stored locally so you can see it in your account.)',
      'ok.track': 'Track order',
      'ok.continue': 'Continue shopping',
      'ok.createH': 'Save your details for next time',
      'ok.createP': 'Create an account to track this order and check out faster.',
      'ok.createCta': 'Create account',
      'footer.col.help': 'Help',
      'footer.col.account': 'Account',
      'footer.link.track': 'Track order',
      'footer.link.contact': 'Contact',
      'footer.link.account': 'Dashboard',
      'footer.link.orders': 'Orders',
      'footer.link.login': 'Sign in',
      'shop.editionsInCollection': 'editions in the collection',
      'shop.sortedBy': 'Sorted by harvest',
      'shop.empty.h': 'No edition matches that filter.',
      'shop.empty.p': 'Each season the collection shifts. Try another category or view the full library.',
      'shop.empty.cta': 'View all editions',
      // ---------- about ----------
      'about.eyebrow': 'The Origin · A house in Pelion',
      'about.headline_html': 'A journey into the <em>origin.</em>',
      'about.intro': 'Five generations of one family, working a thousand hives across a single mountain. The honey is the result. This is the story behind the jar.',
      'about.page.kicker': 'Pelion · Greece',
      'about.page.title': 'About',
      'about.page.sub': 'A small collection of Greek harvests shaped by mountain air, slow seasons and quiet craftsmanship.',
      'about.visual.cap': 'Mount Pelion · Northern Greece',
      'about.story.eyebrow': 'Our story',
      'about.story.h': 'A house on a single mountain.',
      'about.story.p1': 'Harvest Deli began on the southern face of Pelion, where one family has kept bees for five generations. What leaves the mountain is small by nature, a few hundred jars a season, gathered slowly and sealed by hand.',
      'about.story.p2': 'We work with olive groves and wild tea hillsides in the same spirit: little, seasonal and honest. (Placeholder copy, the full story will follow.)',
      'about.craft.eyebrow': 'How we work',
      'about.craft.h': 'Small by intention.',
      'about.craft.1.l': 'Small harvests',
      'about.craft.1.d': 'Only what one mountain gives in a season.',
      'about.craft.2.l': 'Slow production',
      'about.craft.2.d': 'Cold-spun, unhurried, never forced.',
      'about.craft.3.l': 'Wild-grown ingredients',
      'about.craft.3.d': 'Foraged from the hillside, never cultivated.',
      'about.craft.4.l': 'Seasonal selection',
      'about.craft.4.d': 'Bottled only when the season is right.',
      'about.craft.5.l': 'Quiet hospitality',
      'about.craft.5.d': 'A spoon, a conversation, no hurry.',
      'about.close.eyebrow': 'Continue',
      'about.close.h': 'Taste the mountain.',
      'about.close.shop': 'Explore the collection',
      'about.close.contact': 'Write to us',
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
      'about.ch5.caption': 'Cellar archive · 1882, 2025',
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
      'checkout.label.addr2': 'Address line 2, optional',
      'checkout.label.addr2Ph': 'Apartment, building, floor',
      'checkout.label.city': 'City',
      'checkout.label.postcode': 'Postcode',
      'checkout.label.country': 'Country',
      'checkout.ship.standard.title': 'Standard · tracked',
      'checkout.ship.standard.sub': '5, 8 business days, signed delivery',
      'checkout.ship.express.title': 'Express · courier',
      'checkout.ship.express.sub': '2, 3 business days, hand delivered',
      'checkout.ship.intl.title': 'International · outside EU',
      'checkout.ship.intl.sub': '7, 12 business days, taxes prepaid',
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
      'product.crumb.current': 'Edition I, Chestnut Honey',
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
      'product.lede': 'Dark, slow-pouring chestnut honey from a single grove at 950\u00a0m on Mount Pelion. Raw, numbered, sealed in wax.',
      'product.express': 'Express checkout',
      'product.trust.q1': '100% Greek premium quality',
      'product.trust.q2': 'Imported directly from Greece',
      'product.trust.q3': 'Fast shipping in the Netherlands',
      'product.trust.q4': 'Natural & unprocessed',
      'product.acc.desc': 'Description',
      'product.acc.ing': 'Ingredients',
      'product.acc.ingBody': '100% raw Greek chestnut honey. Nothing added, never heated above hive temperature, never filtered.',
      'product.acc.origin': 'Origin',
      'product.acc.originBody': 'Harvested from a single south-facing grove at 950\u00a0m on Mount Pelion, Greece. One season, 384 numbered jars, each sealed by hand in black wax.',
      'product.acc.ship': 'Shipping',
      'product.acc.shipBody': 'Shipped from our Amsterdam cellar within 1\u20132 business days. Free shipping in the EU above \u20ac120. Carefully packed, track & trace included.',
      'product.notes_html': 'Free shipping in EU above €120 <span class="dot"></span> Limited release · 384 numbered jars',
      'product.tasting.eyebrow': 'The Tasting',
      'product.tasting.h_html': 'What you taste, slowly.',
      'product.tasting.first.h': 'I, First',
      'product.tasting.first.quote': '"Warm resin, sun on stone."',
      'product.tasting.first.p': 'An immediate breath of pine and dry herb. The smell of the mountain itself in late June, when the air over the thyme begins to shimmer.',
      'product.tasting.body.h': 'II, Body',
      'product.tasting.body.quote': '"Soft amber, slow honey."',
      'product.tasting.body.p': 'The texture takes hold next, a viscosity that pours like a held breath. Wildflower and a clean, gentle sweetness held in the centre of the tongue.',
      'product.tasting.finish.h': 'III, Finish',
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
      'product.sticky.price': '€18 · Edition I',
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
      'cart.empty.eyebrow': 'Jouw kelder',
      'cart.empty.h': 'De kelder wacht.',
      'cart.empty.p': 'Kleinschalige oogsten uit Pelion, rustig klaargemaakt en verzonden door heel Europa.',
      'cart.empty.cta': 'Bekijk de collectie',
      'cart.empty.suggest': 'Begin met',
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
      'footer.bottom2': 'MMXXV',
      'footer.news.eyebrow': 'De Oogstbrief',
      'footer.news.lead': 'Af en toe een brief uit de bergen: nieuwe oogsten, stille verhalen, niets meer.',
      'footer.news.placeholder': 'Je e-mailadres',
      'footer.news.cta': 'Inschrijven',
      'footer.news.ok': 'Dank je. Een rustig welkom aan tafel.',
      'oil.eyebrow': 'De andere oogst · Olijfolie',
      'oil.title': 'Geperst uit door de zon verwarmde olijven, langzaam.',
      'oil.lead': 'Van een handvol oude gaarden op de flank van Pelion, met de hand geplukt in de eerste koude winterweken en binnen enkele uren geperst over steen. Ongehaast, ongefilterd, groen en levend.',
      'oil.note': 'Eén landgoed. Eén persing. Gebotteld op de dag dat het loopt.',
      'oil.cta': 'Ontdek de olie',
      'oil.cap': 'Pelion · Eerste koude persing',
      'jp.eyebrow': 'Het Journal · Veldnotities uit Pelion',
      'jp.title': 'Traag lezen, vanaf de berg.',
      'jp.cat.tasting': 'Proeven',
      'jp.cat.guide': 'Gids',
      'jp.a1.title': 'Proef de Griekse zon.',
      'jp.a1.excerpt': 'Hoe de Griekse zon werkelijk smaakt, en hoe je één pot langzaam leest, in drie bewegingen.',
      'jp.a2.title': 'Waar koop je echte Griekse honing in Nederland?',
      'jp.a2.excerpt': 'Hoe je single-estate berghoning herkent tussen de supermarktschappen, en waar je het vindt in Amsterdam.',
      'jp.a3.title': 'Waarom Griekse honing anders smaakt dan supermarkthoning.',
      'jp.a3.excerpt': 'Bergbloemen, rauwe extractie en kleine oogsten: de stille redenen dat de ene lepel blijft hangen en de andere niet.',
      'jp.read_html': 'Lees het essay <span class="arrow" aria-hidden="true"></span>',
      'jp.cta': 'Bezoek het Journal',
      'ig.h_html': 'Uit de gaard, <em>in trage rotatie.</em>',
      'ig.follow': 'Volg op Instagram',
      'footer.builtBy': 'Ontworpen & gebouwd door',
      'a11y.skipLink': 'Ga naar inhoud',
      'idx.h1': 'Harvest Deli, Griekse honing van één landgoed in Pelion',
      'concierge.fab': 'Schrijf ons',
      'concierge.title': 'Chat met Harvest Deli',
      'concierge.subtitle': 'Pelion, Griekenland',
      'concierge.online': 'Echte mens · Reactie binnen enkele uren',
      'concierge.greeting': 'Welkom bij Harvest Deli.\nWaar kunnen we u mee helpen?',
      'concierge.intro': 'Kies een onderwerp hieronder, we zetten het gesprek voort op WhatsApp.',
      'concierge.action.product': 'Vraag over een product',
      'concierge.action.retail': 'Retail & horeca',
      'concierge.action.shipping': 'Verzending & levering',
      'concierge.action.gift': 'Geschenken & zakelijke orders',
      'concierge.action.concierge': 'Spreek met ons team',
      'concierge.msg.product': 'Hallo Harvest Deli, ik wil graag meer weten over uw collectie.',
      'concierge.msg.retail': 'Hallo Harvest Deli, ik wil graag de mogelijkheden voor retail of horeca verkennen.',
      'concierge.msg.shipping': 'Hallo Harvest Deli, ik heb een vraag over verzending en levering.',
      'concierge.msg.gift': 'Hallo Harvest Deli, ik wil graag een geschenk of zakelijke order plaatsen.',
      'concierge.msg.concierge': 'Hallo Harvest Deli, ik wil graag met uw team spreken.',
      'concierge.close': 'Sluiten',
      'concierge.privacy': 'Gesprekken openen in WhatsApp. We delen uw nummer nooit.',
      'markets.nav': 'Markten',
      'markets.menu_html': 'De <em>Markten</em>',
      'markets.menu_sub': 'Vind ons in Amsterdam',
      'markets.eyebrow': 'Van Pelion naar Amsterdam',
      'markets.hero.h_html': 'Vind ons<br><em>in Amsterdam.</em>',
      'markets.hero.kicker': 'De markten',
      'markets.hero.h': 'Van Pelion naar Amsterdam.',
      'markets.hero.sub': 'Stille marktochtenden, bergoogsten en trage gesprekken.',
      'markets.badge.weekly': 'Wekelijks',
      'markets.badge.monthly': 'Maandelijks',
      'markets.label.where': 'Locatie',
      'markets.label.when': 'Wanneer',
      'markets.label.expect': 'Wat u kunt verwachten',
      'markets.expect.val': 'Griekse honing, olijfolie & bergthee',
      'markets.maps': 'Open in Google Maps',
      'markets.maps.google': 'Google Maps',
      'markets.maps.apple': 'Apple Maps',
      'markets.contact.eyebrow': 'Vragen',
      'markets.contact.h': 'Voor markt-, groothandel- of horecavragen, schrijf ons.',
      'markets.contact.cta': 'Schrijf ons',
      'markets.cards.eyebrow': 'Twee tafels',
      'markets.cards.h_html': 'Waar u <em>de oogst</em> kunt vinden.',
      'markets.tenkate.tag': 'Wekelijks · West',
      'markets.tenkate.title': 'Ten Kate Markt',
      'markets.tenkate.hours': 'Maandag, zaterdag · 09:00, 17:00',
      'markets.tenkate.addr': 'Ten Katestraat · Amsterdam-West',
      'markets.tenkate.desc': 'Onze wekelijkse tafel, een paar kratten honing, een proeflepel, een geopende pot. Loop binnen tussen uw boodschappen door; we schenken de ochtendkoffie.',
      'markets.westerpark.tag': 'Maandelijks · Zondag',
      'markets.westerpark.title': 'Zondagsmarkt · Westerpark',
      'markets.westerpark.hours': 'Eerste zondag van elke maand · 11:00, 17:00',
      'markets.westerpark.addr': 'Westergasterrein · Amsterdam-West',
      'markets.westerpark.desc': 'Een rustigere zondagse samenkomst in de oude gasfabriek. Linnen, kaarslicht bij schemering, en de oogst, één lepel tegelijk geschonken.',
      'markets.story.eyebrow': 'De tafel',
      'markets.story.lead_html': '"Voor ons gaan markten niet alleen over het verkopen van honing. Ze gaan over <em>gesprek, proeven</em> en het delen van de oogst."',
      'markets.story.body': 'Elke ochtend dekken we de tafel op dezelfde manier als onze familie dat al vier generaties doet op de hellingen van Pelion, linnen gevouwen, potten geopend, een lepel over de rand. Amsterdam, met zijn fietsen en zijn grijze ochtendlicht, heeft ons kleine ritueel verwelkomd. Kom vroeg. Blijf rustig. Proef voordat u spreekt.',
      'markets.story.sig': 'Stelios &amp; Eleni Andreou',
      'markets.story.sigsub': 'Pelion · Amsterdam',
      'markets.gallery.eyebrow': 'Een fotojournaal',
      'markets.gallery.h_html': '<em>Ochtenden</em> aan de tafel.',
      'markets.gallery.cap1': 'Zonlicht door het linnen, vlak na opening.',
      'markets.gallery.cap2': 'De eerste proeverij van de dag.',
      'markets.gallery.cap3': 'Een vaste gast, een vaste lepel.',
      'markets.gallery.cap4': 'Wax-verzegelde edities in een houten krat.',
      'markets.gallery.cap5': 'Een rustig gesprek over herkomst.',
      'markets.gallery.cap6': 'Westerpark · eerste zondag, laat in de middag.',
      'markets.map.eyebrow': 'Twee locaties · Amsterdam-West',
      'markets.map.h_html': 'Een korte wandeling vanaf de grachten.',
      'markets.map.lead': 'Beide tafels liggen in Amsterdam-West, op een fietsritje van vijftien minuten vanaf het centrum. Tram 7 stopt vlakbij. Het licht is het mooist voor de middag.',
      'markets.map.pin1': 'Ten Kate Markt',
      'markets.map.pin2': 'Westerpark',
      'markets.cta.eyebrow': 'Bezoek de tafel',
      'markets.cta.h_html': 'Kom <em>de oogst proeven.</em>',
      'markets.cta.lead': 'Breng een lege middag mee en een eerlijke honger. Er is altijd koffie, altijd een lepel, altijd een verhaal.',
      'markets.cta.schedule': 'Bekijk marktagenda',
      'markets.cta.trade': 'Retail & horeca',
      'idx.markets.eyebrow': 'VI, In Amsterdam',
      'idx.markets.h_html': 'Vind ons aan de <em>markttafel.</em>',
      'idx.markets.body': 'Van Pelion naar Amsterdam. Twee tafels, gedekt met linnen, een proeflepel en de ochtendkoffie, stilletjes meegebracht uit de heuvels van Griekenland naar de markten van Amsterdam.',
      'idx.markets.cta': 'Vind ons in Amsterdam',
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
      'idx.sel.eyebrow': 'De collectie',
      'idx.sel.title': 'Geselecteerde oogsten.',
      'idx.sel.cta': 'Bekijk de collectie',
      // ---------- index editorial ----------
      'idx.ch1.eyebrow': 'I, De Oorsprong',
      'idx.ch1.h': 'Geboren in de stille heuvels van Noord-Griekenland.',
      'idx.ch1.body': 'Vijf generaties lang verzorgt één familie duizend bijenkasten over de kalksteenrichels van de berg Pelion. Wilde tijm, heide en aardbeiboom bloeien in een enkel, onvertaalbaar seizoen. De honing wordt gevormd door dit land, en door niets anders.',
      'idx.ch1.caption': 'Pelion · Voorjaarsoogst',
      'idx.ch2.eyebrow': 'II, Het Proces',
      'idx.ch2.h': 'Een ambacht verfijnd door tijd, niet door technologie.',
      'idx.step1.h': 'Op hoogte verzameld',
      'idx.step1.p': 'De kasten staan waar wilde bloemen ongestoord groeien. Nooit bij landbouw, nooit bij een weg. De bijen bepalen waar ze foerageren; wij luisteren slechts.',
      'idx.step2.h': 'Koud gewonnen',
      'idx.step2.p': 'Raten worden gecentrifugeerd op de temperatuur van de kelder, nooit verhit. Elk enzym, elke stuifmeelkorrel, elke herinnering aan het seizoen blijft intact.',
      'idx.step3.h': 'Bezonken, nooit gezeefd',
      'idx.step3.p': 'De honing rust veertien dagen in eikenhouten vaten. Lucht stijgt, bezinksel zakt. Niets wordt geforceerd, niets wordt gefilterd, en de structuur blijft levend.',
      'idx.taste.quote': 'Een smaak die de herinnering aan een bergochtend vasthoudt. Warm, goudkleurig, traag om te vertrekken.',
      'idx.taste.cite': 'Notities uit de proefruimte',
      'idx.preview.eyebrow': 'De Collectie',
      'idx.preview.h_html': 'Drie uit de kelder, <em>genummerd.</em>',
      'idx.preview.addToCellar': 'Aan de kelder toevoegen',
      'idx.preview.exploreAll': 'Bekijk alle zes edities',
      'idx.product.eyebrow': 'De Collectie · Editie I',
      'idx.product.title_html': 'Tamme Kastanje, <em>oogst 2025.</em>',
      'idx.product.originLine_html': 'Pelion <span class="dot"></span> 950m <span class="dot"></span> 384 potten',
      'idx.product.desc': 'Een honing uit één weide met opmerkelijke helderheid. Tonen van warme hars, in de zon gerijpte kruiden en een lange minerale afdronk. Gebotteld in zwaar handgeperst glas, met de hand genummerd, ongepasteuriseerd.',
      'idx.product.cta_html': 'Bekijk de pot, €68',
      // ---------- shop ----------
      'shop.eyebrow': 'De Collectie · 2025',
      'shop.headline_html': 'Een kleine, <em>genummerde</em> bibliotheek van de Griekse oogst.',
      'shop.intro': 'Negen honingen van enkele oorsprong, een koudgeperste olijfolie en een wilde bergthee, elk ongepasteuriseerd, met de hand verzegeld en stil verzonden vanuit Griekenland binnen de week.',
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
      'menu.item.account_html': 'Het <em>Account</em>',
      'menu.item.account_sub': 'Bestellingen & adressen',
      'ck.step.cart': 'Mandje',
      'ck.step.details': 'Gegevens',
      'ck.step.delivery': 'Bezorging',
      'ck.step.payment': 'Betaling',
      'ck.step.review': 'Controle',
      'ck.continue': 'Verder',
      'ck.back': 'Terug',
      'ck.place': 'Bestelling plaatsen',
      'ck.total': 'Totaal',
      'ck.apply': 'Toepassen',
      'ck.add': 'Toevoegen',
      'ck.remove': 'Verwijderen',
      'ck.keepShopping': 'Verder winkelen',
      'ck.toDelivery': 'Verder naar bezorging',
      'ck.toPayment': 'Verder naar betaling',
      'ck.toReview': 'Bestelling controleren',
      'ck.subtotal': 'Subtotaal',
      'ck.discount': 'Korting',
      'ck.shipping': 'Verzending',
      'ck.free': 'Gratis',
      'ck.pickup': 'Afhalen',
      'ck.empty.h': 'Je kelder is leeg',
      'ck.empty.p': 'Begin de collectie, elke pot is genummerd, verzegeld in was en verzonden binnen de week.',
      'ck.empty.cta': 'Bekijk de collectie',
      'ck.discount.label': 'Kortingscode',
      'ck.discount.ph': 'Kortingscode',
      'ck.discount.ok': 'Code toegepast',
      'ck.discount.bad': 'Die code is niet geldig',
      'ck.upsell.h': 'Maak je bestelling compleet',
      'ck.details.h_html': 'Gegevens &middot; <em>waar we je bereiken.</em>',
      'ck.billing': 'Factuuradres',
      'ck.company': 'Bedrijf, optioneel',
      'ck.vat': 'Btw-nummer, optioneel',
      'ck.sameAddr': 'Verzendadres is gelijk aan factuuradres',
      'ck.save': 'Bewaar deze gegevens voor de volgende keer',
      'ck.delivery.h_html': 'Bezorging &middot; <em>hoe het reist.</em>',
      'ck.deliveryNote': 'Gratis standaardverzending boven €75. Elk pakket gaat verzekerd en met track & trace.',
      'ck.freeProgress': 'Nog {x} voor gratis verzending',
      'ck.payment.h_html': 'Betaling &middot; <em>rustig & veilig.</em>',
      'ck.demoPill': 'Demo',
      'ck.payNote': 'Aanbieder-onafhankelijke UI. Hier wordt niets afgeschreven, Stripe of Mollie koppelt hier in productie.',
      'ck.badge.secure': 'Veilige SSL-checkout',
      'ck.badge.returns': '14 dagen retour',
      'ck.badge.tracked': 'Verzekerd & traceerbaar',
      'ck.review.h_html': 'Controle &middot; <em>voor we verzegelen.</em>',
      'ck.review.contact': 'Contact',
      'ck.review.ship': 'Verzenden naar',
      'ck.review.bill': 'Facturatie',
      'ck.review.delivery': 'Bezorging',
      'ck.review.payment': 'Betaling',
      'ck.edit': 'Wijzig',
      'ck.terms_html': 'Ik ga akkoord met de <a href="legal-terms.html">algemene voorwaarden</a>.',
      'ck.privacy_html': 'Ik heb de <a href="legal-privacy.html">privacyverklaring</a> gelezen.',
      'ck.consentError': 'Accepteer de voorwaarden en privacyverklaring om verder te gaan.',
      'ck.secureInline': 'Versleuteld & veilig',
      'ck.faq.h': 'Vragen voor je bestelt',
      'ck.faq.q1': 'Wanneer wordt mijn bestelling verzonden?',
      'ck.faq.a1': 'Bestellingen voor 14:00 uur gaan dezelfde werkdag de deur uit vanuit Nederland, zorgvuldig verpakt en verzegeld.',
      'ck.faq.q2': 'Verzenden jullie internationaal?',
      'ck.faq.a2': 'Ja, door de hele EU en daarbuiten, verzekerd en traceerbaar. Levertijden per vervoerder zie je bij de bezorgstap.',
      'ck.faq.q3': 'Kan ik een bestelling retourneren?',
      'ck.faq.a3': 'Ongeopende potten kun je binnen 14 dagen retourneren. Zie ons <a href="legal-returns.html">retourbeleid</a> of mail naar <a href="mailto:orders@harvestdeli.nl">orders@harvestdeli.nl</a>.',
      'ck.err.required': 'Verplicht',
      'ck.err.email': 'Voer een geldig e-mailadres in',
      'ck.err.postcode': 'Voer een geldige postcode in',
      'ck.qty.dec': 'Aantal verlagen',
      'ck.qty.inc': 'Aantal verhogen',
      'auth.eyebrow': 'Account',
      'auth.login.title_html': 'Welkom <em>terug.</em>',
      'auth.login.sub': 'Log in om je bestellingen, adressen en gegevens te zien.',
      'auth.email': 'E-mail',
      'auth.password': 'Wachtwoord',
      'auth.show': 'Toon',
      'auth.remember': 'Ingelogd blijven',
      'auth.forgot': 'Wachtwoord vergeten?',
      'auth.signIn': 'Inloggen',
      'auth.noAccount': 'Nieuw hier?',
      'auth.create': 'Account aanmaken',
      'auth.guest': 'Doorgaan als gast',
      'auth.register.title_html': 'Word lid van de <em>kelder.</em>',
      'auth.register.sub': 'Maak een account om bestellingen te volgen en sneller af te rekenen.',
      'auth.confirm': 'Bevestig wachtwoord',
      'auth.agree_html': 'Ik ga akkoord met de <a href="legal-terms.html">voorwaarden</a> en <a href="legal-privacy.html">privacyverklaring</a>.',
      'auth.createAccount': 'Account aanmaken',
      'auth.haveAccount': 'Heb je al een account?',
      'auth.forgot.title_html': 'Herstel je <em>wachtwoord.</em>',
      'auth.forgot.sub': 'Voer je e-mail in en we sturen een link om een nieuw wachtwoord in te stellen.',
      'auth.sendLink': 'Stuur herstellink',
      'auth.forgot.done': 'Als er een account bestaat voor dit e-mailadres, is er een herstellink onderweg. (Demo: er wordt geen e-mail verstuurd, Supabase resetPasswordForEmail koppelt hier.)',
      'auth.backToLogin': 'Terug naar inloggen',
      'acct.eyebrow': 'Jouw account',
      'acct.nav.dashboard': 'Overzicht',
      'acct.nav.orders': 'Bestellingen',
      'acct.nav.addresses': 'Adressen',
      'acct.nav.details': 'Gegevens',
      'acct.logout': 'Uitloggen',
      'acct.dash.h_html': 'Jouw <em>account.</em>',
      'acct.dash.lead': 'Alles op één rustige plek, bestellingen, adressen en je gegevens.',
      'acct.dash.ordersD': 'Volgen & opnieuw bestellen',
      'acct.dash.addrD': 'Opgeslagen bezorgadressen',
      'acct.dash.detailsD': 'Naam & contact',
      'acct.dash.shop': 'Shop',
      'acct.dash.shopD': 'Bekijk de collectie',
      'acct.dash.recent': 'Laatste bestelling',
      'acct.orders.h_html': 'Jouw <em>bestellingen.</em>',
      'acct.orders.lead': 'Elke genummerde pot die je hebt besteld, nieuwste eerst.',
      'acct.addr.h_html': 'Opgeslagen <em>adressen.</em>',
      'acct.addr.lead': 'Bezorgadressen voor een snellere checkout.',
      'acct.addr.add': 'Adres toevoegen',
      'acct.addr.save': 'Adres opslaan',
      'acct.details.h_html': 'Jouw <em>gegevens.</em>',
      'acct.details.lead': 'Naam en contactgegevens voor je bestellingen.',
      'acct.details.save': 'Wijzigingen opslaan',
      'acct.details.saved': 'Opgeslagen.',
      'acct.demoNote': 'Demo-sessie, dit bewaart je gegevens lokaal in je browser en logt niet echt in. Supabase Auth koppelt hier in productie.',
      'ok.eyebrow': 'Bestelling bevestigd',
      'ok.title_html': 'Dank <em>je wel.</em>',
      'ok.title': 'Je oogst is gereserveerd.',
      'ok.sub': 'Rustig ingepakt in Pelion en klaargemaakt voor de reis. Een bevestiging is onderweg.',
      'ok.orderNo': 'Bestelnummer',
      'ok.email': 'Een bevestigingsmail is onderweg. (Demo: er wordt geen e-mail verstuurd, je bestelling is lokaal opgeslagen zodat je hem in je account ziet.)',
      'ok.track': 'Bestelling volgen',
      'ok.continue': 'Verder winkelen',
      'ok.createH': 'Bewaar je gegevens voor de volgende keer',
      'ok.createP': 'Maak een account om deze bestelling te volgen en sneller af te rekenen.',
      'ok.createCta': 'Account aanmaken',
      'footer.col.help': 'Help',
      'footer.col.account': 'Account',
      'footer.link.track': 'Bestelling volgen',
      'footer.link.contact': 'Contact',
      'footer.link.account': 'Overzicht',
      'footer.link.orders': 'Bestellingen',
      'footer.link.login': 'Inloggen',
      'shop.editionsInCollection': 'edities in de collectie',
      'shop.sortedBy': 'Op oogst gesorteerd',
      'shop.empty.h': 'Geen editie past bij dit filter.',
      'shop.empty.p': 'Elk seizoen verandert de collectie. Probeer een andere categorie of bekijk de volledige bibliotheek.',
      'shop.empty.cta': 'Bekijk alle edities',
      // ---------- about ----------
      'about.eyebrow': 'De Oorsprong · Een huis in Pelion',
      'about.headline_html': 'Een reis naar de <em>oorsprong.</em>',
      'about.intro': 'Vijf generaties van één familie, die duizend bijenkasten verzorgen over één enkele berg. De honing is het resultaat. Dit is het verhaal achter de pot.',
      'about.page.kicker': 'Pelion · Griekenland',
      'about.page.title': 'Over ons',
      'about.page.sub': 'Een kleine collectie Griekse oogsten, gevormd door berglucht, trage seizoenen en stil vakmanschap.',
      'about.visual.cap': 'Pelion · Noord-Griekenland',
      'about.story.eyebrow': 'Ons verhaal',
      'about.story.h': 'Een huis op één berg.',
      'about.story.p1': 'Harvest Deli begon op de zuidflank van Pelion, waar één familie al vijf generaties bijen houdt. Wat de berg verlaat is van nature klein, een paar honderd potten per seizoen, traag verzameld en met de hand verzegeld.',
      'about.story.p2': 'We werken met olijfgaarden en wilde theehellingen in dezelfde geest: klein, seizoensgebonden en eerlijk. (Tijdelijke tekst, het volledige verhaal volgt.)',
      'about.craft.eyebrow': 'Hoe we werken',
      'about.craft.h': 'Klein met opzet.',
      'about.craft.1.l': 'Kleine oogsten',
      'about.craft.1.d': 'Alleen wat één berg in een seizoen geeft.',
      'about.craft.2.l': 'Trage productie',
      'about.craft.2.d': 'Koud geslingerd, rustig, nooit geforceerd.',
      'about.craft.3.l': 'Wilde ingrediënten',
      'about.craft.3.d': 'Geoogst van de helling, nooit geteeld.',
      'about.craft.4.l': 'Seizoensselectie',
      'about.craft.4.d': 'Alleen gebotteld als het seizoen klopt.',
      'about.craft.5.l': 'Stille gastvrijheid',
      'about.craft.5.d': 'Een lepel, een gesprek, geen haast.',
      'about.close.eyebrow': 'Verder',
      'about.close.h': 'Proef de berg.',
      'about.close.shop': 'Bekijk de collectie',
      'about.close.contact': 'Schrijf ons',
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
      'about.ch5.caption': 'Kelderarchief · 1882, 2025',
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
      'checkout.label.addr2': 'Adresregel 2, optioneel',
      'checkout.label.addr2Ph': 'Appartement, gebouw, verdieping',
      'checkout.label.city': 'Stad',
      'checkout.label.postcode': 'Postcode',
      'checkout.label.country': 'Land',
      'checkout.ship.standard.title': 'Standaard · met track & trace',
      'checkout.ship.standard.sub': '5, 8 werkdagen, met handtekening',
      'checkout.ship.express.title': 'Express · koerier',
      'checkout.ship.express.sub': '2, 3 werkdagen, persoonlijk bezorgd',
      'checkout.ship.intl.title': 'Internationaal · buiten EU',
      'checkout.ship.intl.sub': '7, 12 werkdagen, belasting vooraf betaald',
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
      'product.crumb.current': 'Editie I, Tamme Kastanje',
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
      'product.lede': 'Donkere, traag schenkende kastanjehoning van \u00e9\u00e9n bosperceel op 950\u00a0m op Pelion. Rauw, genummerd, verzegeld in was.',
      'product.express': 'Direct afrekenen',
      'product.trust.q1': '100% Griekse topkwaliteit',
      'product.trust.q2': 'Rechtstreeks ge\u00efmporteerd uit Griekenland',
      'product.trust.q3': 'Snelle verzending in Nederland',
      'product.trust.q4': 'Natuurlijk & onbewerkt',
      'product.acc.desc': 'Beschrijving',
      'product.acc.ing': 'Ingredi\u00ebnten',
      'product.acc.ingBody': '100% rauwe Griekse kastanjehoning. Niets toegevoegd, nooit verwarmd boven kasttemperatuur, nooit gefilterd.',
      'product.acc.origin': 'Herkomst',
      'product.acc.originBody': 'Geoogst van \u00e9\u00e9n zuidgericht bosperceel op 950\u00a0m op het Pilion-gebergte, Griekenland. \u00c9\u00e9n seizoen, 384 genummerde potten, stuk voor stuk met de hand verzegeld in zwarte was.',
      'product.acc.ship': 'Verzending',
      'product.acc.shipBody': 'Binnen 1\u20132 werkdagen verzonden vanuit onze Amsterdamse kelder. Gratis verzending in de EU boven \u20ac120. Zorgvuldig verpakt, met track & trace.',
      'product.notes_html': 'Gratis verzending in de EU boven €120 <span class="dot"></span> Beperkte uitgave · 384 genummerde potten',
      'product.tasting.eyebrow': 'De Proef',
      'product.tasting.h_html': 'Wat je proeft, langzaam.',
      'product.tasting.first.h': 'I, Eerst',
      'product.tasting.first.quote': '"Warme hars, zon op steen."',
      'product.tasting.first.p': 'Een onmiddellijke ademtocht van den en droge kruiden. De geur van de berg zelf in late juni, wanneer de lucht boven de tijm begint te trillen.',
      'product.tasting.body.h': 'II, Midden',
      'product.tasting.body.quote': '"Zachte amber, trage honing."',
      'product.tasting.body.p': 'Vervolgens neemt de structuur het over, een viscositeit die schenkt als een ingehouden adem. Wilde bloem en een schone, zachte zoetheid in het midden van de tong.',
      'product.tasting.finish.h': 'III, Afdronk',
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
      'product.sticky.price': '€18 · Editie I',
      'product.sticky.add': 'Voeg toe'
    },
    el: {
      'nav.menu': 'Μενού',
      'nav.shop': 'Κατάστημα',
      'nav.acquire': 'Αγορά',
      'nav.cellar': 'Κελάρι',
      'nav.secureCheckout': 'Ασφαλής Πληρωμή',
      'menu.close': 'Κλείσιμο',
      'menu.item.collection_html': 'Η <em>Συλλογή</em>',
      'menu.item.collection_sub': 'Όλες οι εκδόσεις',
      'menu.item.origin_html': 'Η <em>Προέλευση</em>',
      'menu.item.origin_sub': 'Πήλιο · Ελλάδα',
      'menu.item.process_html': 'Η <em>Διαδικασία</em>',
      'menu.item.process_sub': 'Χειροποίητη συγκομιδή',
      'menu.item.journal_html': 'Το <em>Ημερολόγιο</em>',
      'menu.item.journal_sub': 'Σημειώσεις από το πεδίο',
      'menu.item.contact': 'Επικοινωνία',
      'menu.item.contact_sub': 'Χονδρική & Τύπος',
      'menu.estate.h': 'Επισκεφθείτε το κτήμα',
      'menu.estate.p': 'Με ραντεβού από Απρίλιο έως Οκτώβριο. Μικρές ομάδες, μία ημέρα, συνοδευόμενες γευσιγνωσίες στο κελάρι.',
      'menu.social.instagram': 'Instagram',
      'menu.social.journal': 'Ημερολόγιο',
      'menu.social.wholesale': 'Χονδρική',
      'menu.copyright': '© Harvest Deli MMXXV',
      'cart.title_html': 'Το <em>Κελάρι</em> σας',
      'cart.close': 'Κλείσιμο',
      'cart.empty.eyebrow': 'Το κελάρι σας',
      'cart.empty.h': 'Το κελάρι περιμένει.',
      'cart.empty.p': 'Μικρές σοδειές από το Πήλιο, ετοιμασμένες ήσυχα και αποστέλλονται σε όλη την Ευρώπη.',
      'cart.empty.cta': 'Δείτε τη συλλογή',
      'cart.empty.suggest': 'Ξεκινήστε με',
      'cart.subtotal': 'Μερικό σύνολο',
      'cart.note': 'Τα μεταφορικά υπολογίζονται κατά την πληρωμή. Δωρεάν εντός ΕΕ άνω των €120.',
      'cart.checkout': 'Συνέχεια στην πληρωμή',
      'cart.remove': 'Αφαίρεση',
      'cart.added': 'Προστέθηκε',
      'footer.tagline': 'Υγρό ηλιόφως, κρατημένο αργά και μικρό, από τα βουνά της Ελλάδας.',
      'footer.col.collection': 'Συλλογή',
      'footer.col.house': 'Οίκος',
      'footer.col.care': 'Φροντίδα',
      'footer.link.allEditions': 'Όλες οι εκδόσεις',
      'footer.link.rawHoney': 'Ωμό μέλι',
      'footer.link.limited': 'Περιορισμένο απόθεμα',
      'footer.link.reserve': 'Ρεζέρβα',
      'footer.link.gift': 'Σετ δώρου',
      'footer.link.origin': 'Προέλευση',
      'footer.link.estate': 'Κτήμα',
      'footer.link.journal': 'Ημερολόγιο',
      'footer.link.contact': 'Επικοινωνία',
      'footer.link.shipping': 'Αποστολές',
      'footer.link.sourcing': 'Προμήθεια',
      'footer.link.trade': 'Συνεργασίες',
      'footer.link.press': 'Τύπος',
      'footer.link.wildThyme': 'Άγριο Θυμάρι',
      'footer.link.pineHeather': 'Πεύκο & Ρείκι',
      'footer.link.springWildflower': 'Ανοιξιάτικα Αγριολούλουδα',
      'footer.link.chestnut': 'Καστανόμελο',
      'footer.bottom1': '© Harvest Deli · Πήλιο, Ελλάδα',
      'footer.bottom2': 'MMXXV',
      'footer.builtBy': 'Σχεδιασμός & κατασκευή από',
      'a11y.skipLink': 'Μετάβαση στο περιεχόμενο',
      'idx.h1': 'Harvest Deli, μονοκτηματικό ελληνικό μέλι από το Πήλιο',
      'concierge.fab': 'Επικοινωνία',
      'concierge.title': 'Συνομιλία με Harvest Deli',
      'concierge.subtitle': 'Πήλιο, Ελλάδα',
      'concierge.online': 'Πραγματικός άνθρωπος · Απάντηση σε λίγες ώρες',
      'concierge.greeting': 'Καλώς ήρθατε στη Harvest Deli.\nΠώς μπορούμε να σας βοηθήσουμε;',
      'concierge.intro': 'Επιλέξτε ένα θέμα παρακάτω, η συνομιλία θα συνεχιστεί στο WhatsApp.',
      'concierge.action.product': 'Ερώτηση για κάποιο προϊόν',
      'concierge.action.retail': 'Λιανική & φιλοξενία',
      'concierge.action.shipping': 'Αποστολή & παράδοση',
      'concierge.action.gift': 'Δώρα & εταιρικές παραγγελίες',
      'concierge.action.concierge': 'Συνομιλία με την ομάδα μας',
      'concierge.msg.product': 'Γεια σας Harvest Deli, θα ήθελα να μάθω περισσότερα για τη συλλογή σας.',
      'concierge.msg.retail': 'Γεια σας Harvest Deli, θα ήθελα να εξερευνήσω συνεργασία λιανικής ή φιλοξενίας.',
      'concierge.msg.shipping': 'Γεια σας Harvest Deli, έχω μια ερώτηση για αποστολή και παράδοση.',
      'concierge.msg.gift': 'Γεια σας Harvest Deli, θα ήθελα να κανονίσω ένα δώρο ή εταιρική παραγγελία.',
      'concierge.msg.concierge': 'Γεια σας Harvest Deli, θα ήθελα να μιλήσω με την ομάδα σας.',
      'concierge.close': 'Κλείσιμο',
      'concierge.privacy': 'Οι συνομιλίες ανοίγουν στο WhatsApp. Δεν μοιραζόμαστε ποτέ τον αριθμό σας.',
      'markets.nav': 'Αγορές',
      'markets.menu_html': 'Οι <em>Αγορές</em>',
      'markets.menu_sub': 'Βρείτε μας στο Άμστερνταμ',
      'markets.eyebrow': 'Από το Πήλιο στο Άμστερνταμ',
      'markets.hero.h_html': 'Βρείτε μας<br><em>στο Άμστερνταμ.</em>',
      'markets.hero.sub': 'Συναντήστε τη Harvest Deli από κοντά στις εβδομαδιαίες και μηνιαίες αγορές μας, ήσυχα φερμένες από τα βουνά της Ελλάδας στις αγορές του Άμστερνταμ.',
      'markets.cards.eyebrow': 'Δύο τραπέζια',
      'markets.cards.h_html': 'Εκεί όπου θα βρείτε <em>τη σοδειά.</em>',
      'markets.tenkate.tag': 'Εβδομαδιαία · Δυτικά',
      'markets.tenkate.title': 'Αγορά Tenkate',
      'markets.tenkate.hours': 'Δευτέρα, Σάββατο · 09:00, 17:00',
      'markets.tenkate.addr': 'Ten Katestraat · Άμστερνταμ-Δυτικά',
      'markets.tenkate.desc': 'Το εβδομαδιαίο τραπέζι μας, λίγα τελάρα μέλι, ένα κουταλάκι για δοκιμή, ένα ανοιχτό βάζο. Περάστε ανάμεσα στα θελήματά σας· σερβίρουμε τον πρωινό καφέ.',
      'markets.westerpark.tag': 'Μηνιαία · Κυριακή',
      'markets.westerpark.title': 'Κυριακάτικη Αγορά · Westerpark',
      'markets.westerpark.hours': 'Πρώτη Κυριακή κάθε μήνα · 11:00, 17:00',
      'markets.westerpark.addr': 'Westergasterrein · Άμστερνταμ-Δυτικά',
      'markets.westerpark.desc': 'Μια πιο αργή Κυριακάτικη συνάντηση μέσα στο παλιό εργοστάσιο φωταερίου. Λινό, φως κεριών το σούρουπο, και η σοδειά, μια κουταλιά τη φορά.',
      'markets.story.eyebrow': 'Το τραπέζι',
      'markets.story.lead_html': '"Για εμάς, οι αγορές δεν είναι μόνο πώληση μελιού. Είναι <em>συνομιλία, δοκιμή</em> και μοίρασμα της σοδειάς."',
      'markets.story.body': 'Κάθε πρωί στρώνουμε το τραπέζι όπως η οικογένειά μας τέσσερις γενιές τώρα στις πλαγιές του Πηλίου, λινό διπλωμένο, βάζα ανοιχτά, ένα κουτάλι πάνω στο χείλος. Το Άμστερνταμ, με τα ποδήλατά του και το γκρίζο πρωινό του φως, υποδέχτηκε το μικρό μας τελετουργικό. Ελάτε νωρίς. Μείνετε αργά. Δοκιμάστε πριν μιλήσετε.',
      'markets.story.sig': 'Στέλιος &amp; Ελένη Ανδρέου',
      'markets.story.sigsub': 'Πήλιο · Άμστερνταμ',
      'markets.gallery.eyebrow': 'Ένα φωτογραφικό ημερολόγιο',
      'markets.gallery.h_html': '<em>Πρωινά</em> στο τραπέζι.',
      'markets.gallery.cap1': 'Ηλιαχτίδα μέσα από το λινό, μετά το άνοιγμα.',
      'markets.gallery.cap2': 'Η πρώτη δοκιμή της ημέρας.',
      'markets.gallery.cap3': 'Ένας τακτικός επισκέπτης, ένα τακτικό κουτάλι.',
      'markets.gallery.cap4': 'Εκδόσεις σφραγισμένες με κερί σε ξύλινο τελάρο.',
      'markets.gallery.cap5': 'Ήσυχη συζήτηση για την προέλευση.',
      'markets.gallery.cap6': 'Westerpark · πρώτη Κυριακή, αργά το απόγευμα.',
      'markets.map.eyebrow': 'Δύο τοποθεσίες · Άμστερνταμ-Δυτικά',
      'markets.map.h_html': 'Λίγα βήματα από τα κανάλια.',
      'markets.map.lead': 'Και τα δύο τραπέζια βρίσκονται στο Άμστερνταμ-Δυτικά, δεκαπέντε λεπτά με ποδήλατο από το κέντρο. Το τραμ 7 σταματά κοντά. Το φως είναι καλύτερο πριν το μεσημέρι.',
      'markets.map.pin1': 'Αγορά Tenkate',
      'markets.map.pin2': 'Westerpark',
      'markets.cta.eyebrow': 'Επισκεφθείτε το τραπέζι',
      'markets.cta.h_html': 'Ελάτε να <em>δοκιμάσετε τη σοδειά.</em>',
      'markets.cta.lead': 'Φέρτε ένα άδειο απόγευμα και μια ειλικρινή όρεξη. Υπάρχει πάντα καφές, πάντα ένα κουτάλι, πάντα μια ιστορία.',
      'markets.cta.schedule': 'Πρόγραμμα αγορών',
      'markets.cta.trade': 'Λιανική & φιλοξενία',
      'idx.markets.eyebrow': 'VI, Στο Άμστερνταμ',
      'idx.markets.h_html': 'Βρείτε μας στο <em>τραπέζι της αγοράς.</em>',
      'idx.markets.body': 'Από το Πήλιο στο Άμστερνταμ. Δύο τραπέζια, στρωμένα με λινό, ένα κουτάλι για δοκιμή και ο πρωινός καφές, ήσυχα φερμένα από τα βουνά της Ελλάδας στις αγορές του Άμστερνταμ.',
      'idx.markets.cta': 'Βρείτε μας στο Άμστερνταμ',
      'idx.scene0.est': 'Ιδρύθηκε · Πήλιο, Ελλάδα · Κτήμα №01',
      'idx.scene1.eyebrow_html': 'Έκδοση I <span class="dot"></span> Καστανόμελο',
      'idx.scene1.line_html': 'Αιχμαλωτισμένο από<br><em>τον ελληνικό ήλιο.</em>',
      'idx.scene2.eyebrow': 'Ένα πεδίο γαλήνης',
      'idx.scene2.line1': 'Άγρια ορεινά λουλούδια.',
      'idx.scene2.line2': 'Ανέγγιχτη φύση.',
      'idx.scene2.line3': 'Αληθινή τεχνική.',
      'idx.card1.h': 'Φυσική συγκομιδή',
      'idx.card1.p': 'Κηρήθρες συλλέγονται με το χέρι σε υψόμετρο. Ποτέ θερμασμένες, ποτέ επεξεργασμένες. Κάθε αρωματική νότα της εποχής διατηρείται ανέπαφη.',
      'idx.card2.h': 'Μικρή παρτίδα',
      'idx.card2.p': 'Κάθε κτήμα παράγει λιγότερα από τετρακόσια βάζα ανά συγκομιδή. Ένας ήσυχος αριθμός, σκοπίμως μικρός.',
      'idx.card3.h': 'Φυσική προέλευση',
      'idx.card3.p': 'Από μία πηγή, ιχνηλάσιμη σε ένα λιβάδι, ένα βουνό, μια εποχή. Τίποτα δεν προστίθεται. Τίποτα δεν αφαιρείται.',
      'idx.scene4.eyebrow': 'Η συλλογή',
      'idx.scene4.line': 'Γευτείτε την προέλευση.',
      'idx.scene4.cta': 'Ανακαλύψτε τη συλλογή',
      'idx.scrollHint': 'Κύλιση',
      'idx.sel.eyebrow': 'Η συλλογή',
      'idx.sel.title': 'Επιλεγμένες συγκομιδές.',
      'idx.sel.cta': 'Δείτε τη συλλογή',
      'idx.ch1.eyebrow': 'I, Η Προέλευση',
      'idx.ch1.h': 'Γεννημένο στους ήσυχους λόφους της Βόρειας Ελλάδας.',
      'idx.ch1.body': 'Επί πέντε γενιές, μία οικογένεια φροντίζει χίλιες κυψέλες πάνω στις ασβεστολιθικές κορυφογραμμές του Πηλίου. Άγριο θυμάρι, ρείκι και κουμαριά ανθίζουν σε μία και μόνη, αμετάφραστη εποχή. Το μέλι παίρνει σχήμα από αυτή τη γη, και από τίποτα άλλο.',
      'idx.ch1.caption': 'Πήλιο · Ανοιξιάτικη συγκομιδή',
      'idx.ch2.eyebrow': 'II, Η Διαδικασία',
      'idx.ch2.h': 'Μια πρακτική εξευγενισμένη από τον χρόνο, όχι από την τεχνολογία.',
      'idx.step1.h': 'Συλλεγμένο σε υψόμετρο',
      'idx.step1.p': 'Οι κυψέλες τοποθετούνται εκεί όπου τα αγριολούλουδα μεγαλώνουν αφρόντιστα. Ποτέ κοντά σε καλλιέργειες, ποτέ κοντά σε δρόμο. Οι μέλισσες αποφασίζουν πού θα τραφούν· εμείς απλά ακούμε.',
      'idx.step2.h': 'Ψυχρή εκχύλιση',
      'idx.step2.p': 'Οι κηρήθρες φυγοκεντρούνται στη θερμοκρασία του κελαριού, ποτέ δεν θερμαίνονται. Κάθε ένζυμο, κάθε γύρη, κάθε μνήμη της εποχής παραμένει ανέπαφη.',
      'idx.step3.h': 'Καθίζηση, χωρίς διήθηση',
      'idx.step3.p': 'Το μέλι ξεκουράζεται για δεκατέσσερις ημέρες σε δεξαμενές δρυός. Ο αέρας ανεβαίνει, το ίζημα κατακάθεται. Τίποτα δεν εξαναγκάζεται, τίποτα δεν φιλτράρεται, και η υφή παραμένει ζωντανή.',
      'idx.taste.quote': 'Μια γεύση που κρατά τη μνήμη ενός ορεινού πρωινού. Ζεστή, χρυσαφένια, αργή να φύγει.',
      'idx.taste.cite': 'Σημειώσεις από το δωμάτιο γευσιγνωσίας',
      'idx.preview.eyebrow': 'Η Συλλογή',
      'idx.preview.h_html': 'Τρία από το κελάρι, <em>αριθμημένα.</em>',
      'idx.preview.addToCellar': 'Προσθήκη στο Κελάρι',
      'idx.preview.exploreAll': 'Δείτε και τις έξι εκδόσεις',
      'idx.product.eyebrow': 'Η Συλλογή · Έκδοση I',
      'idx.product.title_html': 'Καστανόμελο, <em>συγκομιδή 2025.</em>',
      'idx.product.originLine_html': 'Πήλιο <span class="dot"></span> 950μ <span class="dot"></span> 384 βάζα',
      'idx.product.desc': 'Μέλι μιας μοναδικής λιβαδιάς αξιοσημείωτης διαύγειας. Νότες ζεστής ρετσίνας, λιοφρυμένου βοτάνου και μια μακρά μεταλλική επίγευση. Εμφιαλωμένο σε βαρύ χειροπίεστο γυαλί, αριθμημένο με το χέρι, διατηρημένο ανεπεξέργαστο.',
      'idx.product.cta_html': 'Δείτε το βάζο, €68',
      'shop.eyebrow': 'Η Συλλογή · 2025',
      'shop.headline_html': 'Μια μικρή, <em>αριθμημένη</em> βιβλιοθήκη της ελληνικής σοδειάς.',
      'shop.intro': 'Εννέα μέλια μονής προέλευσης, ένα ελαιόλαδο ψυχρής έκθλιψης και ένα άγριο τσάι του βουνού, το καθένα ανεπεξέργαστο, σφραγισμένο στο χέρι και αποστελλόμενο ήσυχα από την Ελλάδα εντός της εβδομάδας.',
      'shop.filterLabel': 'Φίλτρο κατά',
      'shop.filter.all': 'Όλα',
      'shop.filter.floral': 'Ανθόσπαρτα',
      'shop.filter.forest': 'Δάσος',
      'shop.filter.mountain': 'Βουνό',
      'shop.filter.wildflower': 'Αγριολούλουδα',
      'shop.filter.raw': 'Ωμό Μέλι',
      'shop.filter.limited': 'Περιορισμένη Συγκομιδή',
      'shop.filter.cold': 'Ψυχρή Εκχύλιση',
      'shop.filter.dark': 'Σκούρο Μέλι',
      'shop.filter.light': 'Ανοιχτό Μέλι',
      'shop.editionsInCollection': 'εκδόσεις στη συλλογή',
      'shop.sortedBy': 'Ταξινομημένα κατά συγκομιδή',
      'shop.empty.h': 'Καμία έκδοση δεν ταιριάζει με αυτό το φίλτρο.',
      'shop.empty.p': 'Κάθε εποχή η συλλογή αλλάζει. Δοκιμάστε μια άλλη κατηγορία ή δείτε ολόκληρη τη βιβλιοθήκη.',
      'shop.empty.cta': 'Δείτε όλες τις εκδόσεις',
      'about.eyebrow': 'Η Προέλευση · Ένας οίκος στο Πήλιο',
      'about.headline_html': 'Ένα ταξίδι στην <em>προέλευση.</em>',
      'about.intro': 'Πέντε γενιές μιας οικογένειας, που εργάζονται σε χίλιες κυψέλες πάνω σε ένα και μόνο βουνό. Το μέλι είναι το αποτέλεσμα. Αυτή είναι η ιστορία πίσω από το βάζο.',
      'about.frameCaption': 'Όρος Πήλιο · Βόρεια Ελλάδα',
      'about.ch1.eyebrow': 'Ελλάδα · Η γη',
      'about.ch1.h': 'Ένα βουνό που η θάλασσα δεν μπορεί να φτάσει.',
      'about.ch1.p1': 'Το Πήλιο ανυψώνεται εξακόσια μέτρα από την ακτή του Αιγαίου σε μία και μόνη, αργή χειρονομία. Οι ασβεστολιθικές κορυφογραμμές του κρατούν άγριο θυμάρι, ρείκι, ρίγανη, κουμαριά και καστανιά σε μία και μόνη, αμετάφραστη εποχή. Δουλεύουμε τη νότια πλευρά, όπου ο ήλιος έρχεται νωρίς και ο αέρας κρατά την ξηρότητά του μέχρι το απόγευμα.',
      'about.ch1.p2': 'Τίποτα εδώ δεν καλλιεργείται. Οι μέλισσες αποφασίζουν πού θα τραφούν, και η εποχή αποφασίζει τι θα φέρουν πίσω.',
      'about.ch1.caption': 'Κορυφογραμμές Πηλίου · 1100μ',
      'about.quote.text': '"Ο παππούς μου κρατούσε τριάντα κυψέλες. Ο πατέρας μου, τριακόσιες. Εγώ κρατώ χίλιες, και όμως, λιγότερες."',
      'about.quote.cite': 'Σταύρος Ανδρέου · Μελισσοκόμος, πέμπτη γενιά',
      'about.ch2.eyebrow': 'Ο μελισσοκόμος',
      'about.ch2.h': 'Σταύρος, που έμαθε να ακούει.',
      'about.ch2.p1': 'Ο Σταύρος Ανδρέου είναι η πέμπτη γενιά της οικογένειάς του που κρατά μέλισσες σε αυτό το βουνό. Κληρονόμησε το κελάρι από τον πατέρα του το 2009, και τα χειρόγραφα του προπάππου του στέκονται σε ένα ράφι πάνω από τις δεξαμενές, καταγράφοντας θερμοκρασίες και αποδόσεις μέχρι το 1882.',
      'about.ch2.p2': 'Δουλεύει μόνος δέκα μήνες τον χρόνο. Δύο νεότεροι ανιψιοί τον συνοδεύουν στη συγκομιδή. Οι μέλισσες, λέει, δίδαξαν στην οικογένεια πολύ περισσότερα απ’όσα η οικογένεια έμαθε ποτέ στις μέλισσες.',
      'about.ch2.caption': 'Το κελάρι · δεξαμενές δρυός',
      'about.ch3.eyebrow': 'Τα βουνά',
      'about.ch3.h': 'Οι κυψέλες τοποθετούνται εκεί που τελειώνει ο δρόμος.',
      'about.ch3.p1': 'Κάθε μελισσοκομείο βρίσκεται μεταξύ 600 και 1400 μέτρων στις νότιες πλαγιές. Ποτέ κοντά σε δρόμο. Ποτέ κοντά σε καλλιεργημένο χωράφι. Το περπάτημα προς τις υψηλότερες κυψέλες παίρνει ένα ολόκληρο πρωινό, και προσέχουμε να μην ενοχλούμε τις μέλισσες περισσότερο απ’όσο απαιτεί η εποχή.',
      'about.ch3.p2': 'Το υψόμετρο διαμορφώνει το μέλι περισσότερο από οποιοδήποτε μεμονωμένο λουλούδι. Οι ψυχρότερες νύχτες επιβραδύνουν τις μέλισσες. Το μέλι πυκνώνει. Ο χαρακτήρας βαθαίνει.',
      'about.ch3.caption': 'Κυψέλη №47 · 1280μ',
      'about.n1.lbl': 'Κυψέλες κατά μήκος της νότιας πλευράς του Πηλίου',
      'about.n2.lbl': 'Γενιές μιας οικογένειας στο βουνό',
      'about.n3.lbl': 'Αριθμημένα βάζα στην έκδοση Καστανιάς',
      'about.n4.lbl': 'Πρόσθετα, ποτέ. Ωμό μέλι, σφραγισμένο με κερί.',
      'about.ch4.eyebrow': 'Η συγκομιδή',
      'about.ch4.h': 'Οι κηρήθρες φυγοκεντρούνται κρύες, σε θερμοκρασία κελαριού.',
      'about.ch4.p1': 'Ποτέ δεν θερμαίνουμε το μέλι. Οι κηρήθρες κατεβαίνουν από το βουνό σε ρηχούς δίσκους, ξεσφραγίζονται με το χέρι, και φυγοκεντρούνται στη θερμοκρασία του κελαριού. Δεκαέξι βαθμοί την άνοιξη, δεκαοκτώ το καλοκαίρι. Κάθε ένζυμο, κάθε κόκκος γύρης, κάθε αρωματική νότα της εποχής παραμένει ανέπαφη.',
      'about.ch4.p2': 'Το μέλι ξεκουράζεται μετά σε δεξαμενές δρυός για δεκατέσσερις ημέρες. Ο αέρας ανεβαίνει. Το ίζημα κατακάθεται. Τίποτα δεν εξαναγκάζεται.',
      'about.ch4.caption': 'Πρωινό συγκομιδής · Απρίλιος',
      'about.ch5.eyebrow': 'Οικογενειακή παράδοση',
      'about.ch5.h': 'Μια πρακτική που περνά ήσυχα από χέρι σε χέρι.',
      'about.ch5.p1': 'Μερικά απ’αυτά που κάνουμε γίνονται με τον ίδιο τρόπο για πέντε γενιές. Άλλα αλλάζουν κάθε χρόνο. Οι μέλισσες μας κρατούν ειλικρινείς. Το βουνό μας κρατά μικρούς.',
      'about.ch5.p2': 'Δεν κλιμακώνουμε. Δεν αναμειγνύουμε. Δεν αφαιρούμε το κερί από τα καπάκια των βάζων. Τριακόσια ογδόντα τέσσερα βάζα στην έκδοση Καστανιάς, και όταν τελειώσουν, η εποχή έχει τελειώσει.',
      'about.ch5.caption': 'Αρχείο κελαριού · 1882, 2025',
      'about.cta.label': 'Η Συλλογή · 2025',
      'about.cta.h_html': 'Γευτείτε το <em>βουνό.</em>',
      'about.cta.btn': 'Δείτε τη συλλογή',
      'contact.eyebrow': 'Επικοινωνία · Πήλιο, Ελλάδα',
      'contact.headline_html': 'Γράψτε στον <em>οίκο.</em>',
      'contact.intro': 'Για χονδρική, φιλοξενία, τύπο, ή απλά μια ήσυχη ερώτηση για ένα βάζο. Ο Σταύρος και η οικογένεια διαβάζουν κάθε μήνυμα, και απαντούν εντός δύο εργάσιμων ημερών.',
      'contact.form.h': 'Ξεκινήστε ένα αίτημα.',
      'contact.form.sub': 'Λίγες γραμμές αρκούν. Απαντούμε προσωπικά.',
      'contact.pill.general': 'Γενικά',
      'contact.pill.wholesale': 'Χονδρική',
      'contact.pill.hospitality': 'Φιλοξενία',
      'contact.pill.retail': 'Λιανοπωλητές',
      'contact.pill.press': 'Τύπος',
      'contact.pill.collab': 'Συνεργασία',
      'contact.label.name': 'Όνομα',
      'contact.label.house': 'Οίκος / επιχείρηση',
      'contact.label.email': 'Email',
      'contact.label.country': 'Χώρα',
      'contact.label.message': 'Μήνυμα',
      'contact.ph.name': 'Μαρία Ανδρέου',
      'contact.ph.house': 'Προαιρετικό',
      'contact.ph.email': 'maria@example.com',
      'contact.ph.country': 'Ελλάδα',
      'contact.ph.message': 'Πείτε μας τι έχετε κατά νου. Ποσότητες, χρονοδιαγράμματα, το δωμάτιο που στρώνετε το τραπέζι.',
      'contact.submit': 'Αποστολή αιτήματος',
      'contact.formNote': 'Γράφοντάς μας συμφωνείτε ότι μπορούμε να αποθηκεύσουμε το μήνυμά σας με σκοπό την απάντηση. Δεν πουλάμε ούτε μοιραζόμαστε στοιχεία. Ποτέ.',
      'contact.success.h': 'Το μήνυμά σας είναι καθ’οδόν.',
      'contact.success.p': 'Ο Σταύρος ή κάποιος από την οικογένεια θα το διαβάσει προσωπικά και θα απαντήσει εντός δύο εργάσιμων ημερών.',
      'contact.info.h': 'Ή γράψτε μας απευθείας.',
      'contact.info.wholesale.lbl': 'Χονδρική',
      'contact.info.wholesale.title_html': 'Στοκάροντας τη <em>συλλογή.</em>',
      'contact.info.wholesale.p': 'Μικρές κατανομές διαθέσιμες σε ανεξάρτητες μπουτίκ, ντελικατέσεν και τεϊοποτεία σε όλη την ΕΕ και επιλεγμένες διεθνείς αγορές.',
      'contact.info.hospitality.lbl': 'Φιλοξενία · Εστιατόρια',
      'contact.info.hospitality.title_html': 'Για το <em>τραπέζι.</em>',
      'contact.info.hospitality.p': 'Συνεργαζόμαστε ήσυχα με ένα μικρό αριθμό εστιατορίων και ξενοδοχείων κάθε χρόνο. Δειγματοκιβώτια αποστέλλονται από το Πήλιο εντός της εβδομάδας.',
      'contact.info.retail.lbl': 'Επιλεγμένοι λιανοπωλητές',
      'contact.info.retail.title_html': 'Ένα διακριτικό <em>ράφι.</em>',
      'contact.info.retail.p': 'Επιλεγμένοι συνεργάτες λιανικής λαμβάνουν ετήσια κατανομή, έκδοση προς έκδοση, με προτεραιότητα στις περιορισμένες ρεζέρβες.',
      'contact.info.press.lbl': 'Τύπος · Συνεργασία',
      'contact.info.press.title_html': 'Μια πιο ήσυχη <em>συζήτηση.</em>',
      'contact.info.press.p': 'Συντακτικά αιτήματα, φωτογραφία και δημιουργικές συνεργασίες. Απαντούμε αργά, αλλά απαντούμε.',
      'contact.location.lbl': 'Το κτήμα',
      'contact.location.h_html': 'Πήλιο, <em>Βόρεια Ελλάδα.</em>',
      'contact.address_html': 'Harvest Deli &middot; Κτήμα №01<br>37006 Πήλιο, Μαγνησία<br>Ελλάδα',
      'checkout.step.cellar': 'Κελάρι',
      'checkout.step.checkout': 'Πληρωμή',
      'checkout.step.confirmation': 'Επιβεβαίωση',
      'checkout.eyebrow': 'Πληρωμή · Έκδοση I',
      'checkout.headline_html': 'Μια ήσυχη, <em>προσεκτική</em> παράδοση.',
      'checkout.sub': 'Τρία βήματα. Αριθμημένα, σφραγισμένα, αποστελλόμενα από το Πήλιο εντός της εβδομάδας.',
      'checkout.express.divider': 'Ή πληρώστε με κάρτα',
      'checkout.step1.h_html': 'Επικοινωνία &middot; <em>πού να απαντήσουμε.</em>',
      'checkout.label.email': 'Email',
      'checkout.label.phone': 'Τηλέφωνο',
      'checkout.step2.h_html': 'Αποστολή &middot; <em>η διεύθυνση.</em>',
      'checkout.label.first': 'Όνομα',
      'checkout.label.last': 'Επώνυμο',
      'checkout.label.addr1': 'Διεύθυνση γραμμή 1',
      'checkout.label.addr1Ph': 'Αριθμός, οδός',
      'checkout.label.addr2': 'Διεύθυνση γραμμή 2, προαιρετικό',
      'checkout.label.addr2Ph': 'Διαμέρισμα, κτίριο, όροφος',
      'checkout.label.city': 'Πόλη',
      'checkout.label.postcode': 'Ταχ. κώδικας',
      'checkout.label.country': 'Χώρα',
      'checkout.ship.standard.title': 'Κανονική · με ιχνηλάτηση',
      'checkout.ship.standard.sub': '5, 8 εργάσιμες ημέρες, παράδοση με υπογραφή',
      'checkout.ship.express.title': 'Express · κούριερ',
      'checkout.ship.express.sub': '2, 3 εργάσιμες ημέρες, παράδοση στο χέρι',
      'checkout.ship.intl.title': 'Διεθνής · εκτός ΕΕ',
      'checkout.ship.intl.sub': '7, 12 εργάσιμες ημέρες, φόροι προπληρωμένοι',
      'checkout.step3.h_html': 'Πληρωμή &middot; <em>ήσυχα ασφαλής.</em>',
      'checkout.tab.card': 'Κάρτα',
      'checkout.tab.bank': 'Τραπεζική μεταφορά',
      'checkout.tab.klarna': 'Klarna',
      'checkout.label.cardNumber': 'Αριθμός κάρτας',
      'checkout.label.cardName': 'Όνομα στην κάρτα',
      'checkout.label.expiry': 'Λήξη',
      'checkout.label.cvc': 'CVC',
      'checkout.stripeNote': 'Κρυπτογραφημένο και επεξεργασμένο από άκρο σε άκρο. Δεν βλέπουμε ποτέ ούτε αποθηκεύουμε την κάρτα σας.',
      'checkout.confirm': 'Επιβεβαίωση παραγγελίας',
      'checkout.terms_html': 'Με την υποβολή αυτής της παραγγελίας συμφωνείτε με τους <a href="#">όρους</a> και την <a href="#">πολιτική απορρήτου</a>. Διεθνείς παραγγελίες ενδέχεται να έχουν τοπικούς φόρους.',
      'checkout.side.eyebrow': 'Το κελάρι σας',
      'checkout.side.title_html': 'Σύνοψη <em>παραγγελίας</em>',
      'checkout.empty.h': 'Το κελάρι σας είναι άδειο.',
      'checkout.empty.p': 'Προσθέστε ένα βάζο από τη συλλογή για να ξεκινήσετε την πληρωμή.',
      'checkout.empty.cta': 'Δείτε τη συλλογή',
      'checkout.package.lbl': 'Πολυτελής συσκευασία',
      'checkout.package.h_html': 'Σφραγισμένο σε <em>κερί.</em> Συσκευασμένο σε καπλαμά δρυός.',
      'checkout.package.p': 'Κάθε βάζο τυλίγεται με το χέρι, σφραγίζεται με μαύρο κερί, και τοποθετείται σε ένα κουτί παρουσίασης με καπλαμά δρυός. Μια χειρόγραφη κάρτα ταξιδεύει με την παραγγελία.',
      'checkout.package.tag': 'Έκδοση I · Συγκομιδή 2025',
      'checkout.trust.stripe1': 'Stripe',
      'checkout.trust.stripe2': 'κρυπτογραφημένο',
      'checkout.trust.intl1': 'Διεθνής',
      'checkout.trust.intl2': 'αποστολή',
      'checkout.trust.sealed1': 'Σφραγισμένο στο',
      'checkout.trust.sealed2': 'Πήλιο',
      'checkout.row.subtotal': 'Μερικό σύνολο',
      'checkout.row.shipping': 'Αποστολή',
      'checkout.row.total': 'Σύνολο',
      'checkout.row.shippingFree': 'Δωρεάν',
      'product.crumb.collection': 'Συλλογή',
      'product.crumb.current': 'Έκδοση I, Καστανόμελο',
      'product.eyebrow_html': 'Έκδοση I <span class="dot"></span> Συγκομιδή 2025',
      'product.title_html': 'Καστανόμελο, <em>κτήμα Πηλίου.</em>',
      'product.tag.singleMeadow': 'Μία Λιβαδιά',
      'product.tag.coldExtracted': 'Ψυχρή Εκχύλιση',
      'product.tag.numbered': 'Αριθμημένα · 384',
      'product.desc': 'Ένα διαυγές, αργό μέλι συγκομισμένο από τους καστανεώνες της νότιας πλαγιάς του Πηλίου. Νότες ζεστής ρετσίνας, λιοφρυμένου βοτάνου και μια μακρά μεταλλική επίγευση. Εμφιαλωμένο σε βαρύ χειροπίεστο γυαλί, σφραγισμένο με κερί, διατηρημένο ανεπεξέργαστο.',
      'product.priceSub_html': 'με ΦΠΑ &middot; αποστολή παγκοσμίως',
      'product.size.tasting': 'Γευσιγνωσία',
      'product.size.estate': 'Κτήμα',
      'product.size.reserve': 'Ρεζέρβα',
      'product.cta': 'Προσθήκη στο κελάρι',
      'product.notes_html': 'Δωρεάν αποστολή στην ΕΕ άνω των €120 <span class="dot"></span> Περιορισμένη κυκλοφορία · 384 αριθμημένα βάζα',
      'product.tasting.eyebrow': 'Η Γευσιγνωσία',
      'product.tasting.h_html': 'Τι γεύεστε, αργά.',
      'product.tasting.first.h': 'I, Πρώτη',
      'product.tasting.first.quote': '"Ζεστή ρετσίνα, ήλιος σε πέτρα."',
      'product.tasting.first.p': 'Μια άμεση ανάσα πεύκου και ξερού βοτάνου. Η μυρωδιά του ίδιου του βουνού στα τέλη Ιουνίου, όταν ο αέρας πάνω από το θυμάρι αρχίζει να τρεμοπαίζει.',
      'product.tasting.body.h': 'II, Σώμα',
      'product.tasting.body.quote': '"Απαλό κεχριμπάρι, αργό μέλι."',
      'product.tasting.body.p': 'Η υφή παίρνει σειρά μετά, ένα ιξώδες που ρέει σαν κρατημένη ανάσα. Αγριολούλουδο και μια καθαρή, απαλή γλυκύτητα κρατημένη στο κέντρο της γλώσσας.',
      'product.tasting.finish.h': 'III, Επίγευση',
      'product.tasting.finish.quote': '"Μεταλλική, μακρά, χρυσαφένια."',
      'product.tasting.finish.p': 'Μια αργή κάθοδος προς την πέτρα και το αλάτι. Διακριτική, σχεδόν ξηρή. Το είδος της επίγευσης που παραμένει στο δωμάτιο πολύ μετά την απόθεση του κουταλιού.',
      'product.origin.eyebrow': 'Η Προέλευση',
      'product.origin.h_html': 'Μία λιβαδιά, μία εποχή.',
      'product.origin.p1': 'Η συγκομιδή 2025 προέρχεται από έναν μοναδικό, νότιο καστανεώνα στα 950 μέτρα στις πλαγιές του Όρους Πηλίου, όπου τα δέντρα ανθίζουν σε ένα στενό παράθυρο κάθε αργό καλοκαίρι.',
      'product.origin.p2': 'Τριακόσια ογδόντα τέσσερα βάζα αντλήθηκαν από αυτή την εποχή. Καθένα αριθμημένο με το χέρι, σφραγισμένο με μαύρο κερί, και διατηρημένο ακριβώς όπως άφησε την κηρήθρα.',
      'product.origin.caption': 'Πήλιο · 950μ · Αργό καλοκαίρι',
      'product.details.eyebrow': 'Οι Λεπτομέρειες',
      'product.details.h_html': 'Ήσυχα, προσεκτικά φτιαγμένο.',
      'product.det.weight.lbl': 'Καθαρό βάρος',
      'product.det.weight.val_html': '250g <em>γυάλινο βάζο</em>',
      'product.det.origin.lbl': 'Προέλευση',
      'product.det.origin.val_html': 'Πήλιο, <em>Ελλάδα</em>',
      'product.det.vintage.lbl': 'Εσοδεία',
      'product.det.vintage.val_html': 'Αργό καλοκαίρι <em>2025</em>',
      'product.det.edition.lbl': 'Έκδοση',
      'product.det.edition.val_html': '384 βάζα, <em>αριθμημένα</em>',
      'product.det.ingredients.lbl': 'Συστατικά',
      'product.det.ingredients.val_html': 'Ωμό μέλι. <em>Τίποτα άλλο.</em>',
      'product.det.storage.lbl': 'Διατήρηση',
      'product.det.storage.val_html': 'Δροσερό, ξηρό, <em>μακριά από το φως</em>',
      'product.det.shelf.lbl': 'Διάρκεια ζωής',
      'product.det.shelf.val_html': 'Αόριστη, <em>σφραγισμένο</em>',
      'product.det.package.lbl': 'Συσκευασία',
      'product.det.package.val_html': 'Χειροπίεστο γυαλί, <em>μαύρο κερί</em>',
      'product.also.eyebrow': 'Επίσης Από Τη Συλλογή',
      'product.also.h_html': 'Τα υπόλοιπα του οίκου.',
      'product.sticky.name': 'Καστανόμελο, κτήμα Πηλίου',
      'product.sticky.price': '€18 · Έκδοση I',
      'product.sticky.add': 'Προσθήκη'
    }
  };
  window.HD_T = T;

  // =====================================================
  //  FAQ i18n bundle (homepage + contact), extends T
  // =====================================================
  Object.assign(T.en, {
    'idx.faq.eyebrow': 'Frequently asked',
    'idx.faq.title_html': 'Slowly <em>answered.</em>',
    'idx.faq.desc': 'The short replies we send to first-time visitors of the cellar. Tap a question to read the longer answer.',
    'idx.faq.help_html': 'Cannot find your question? Write to <a href="mailto:hello@harvestdeli.nl">hello@harvestdeli.nl</a> and we reply within two business days. For order matters, <a href="mailto:orders@harvestdeli.nl">orders@harvestdeli.nl</a>.',
    'idx.faq.q1': 'How quickly do you ship?',
    'idx.faq.a1_html': 'Orders leave our Dutch depot within three working days. From dispatch you can expect one to two working days inside the Netherlands and two to eight working days across the EU. Track and trace is shared by e-mail. Full breakdown on the <a href="legal-shipping.html">shipping page</a>.',
    'idx.faq.q2': 'Where do you ship to?',
    'idx.faq.a2_html': 'The whole of the Netherlands, every EU member state, plus the United Kingdom, Switzerland and Norway. Worldwide on request. Shipping is complimentary above &euro;90 in the Netherlands and above &euro;120 across the EU.',
    'idx.faq.q3': 'Is your honey raw?',
    'idx.faq.a3_html': 'Yes. Combs are spun at cellar temperature, never above eighteen degrees. The honey is then settled, never filtered, for fourteen days in oak. Every enzyme, every grain of pollen, every aromatic note of the season remains intact. Read more in the <a href="article-taste-the-greek-sun.html">tasting essay</a>.',
    'idx.faq.q4': 'How long does the honey keep?',
    'idx.faq.a4_html': 'Indefinitely, sealed. Honey contains almost no water and is naturally antibacterial. Store cool, dry and out of direct light. Crystallisation is natural and reversible: warm the jar in a water bath at no more than 35&deg;C to return it to liquid without damaging it.',
    'idx.faq.q5': 'Can I return an order?',
    'idx.faq.a5_html': 'Within fourteen days of receipt you may return unopened, wax-sealed jars without giving a reason. Once the seal is broken, the jar cannot be returned for hygiene reasons. Full instructions and the model form are on the <a href="legal-returns.html">returns page</a>.',
    'idx.faq.q6': 'Do you offer gift packaging?',
    'idx.faq.a6_html': 'Yes. An oak-veneered presentation box, lined in linen, holds one to three jars and travels with a handwritten card. Select gift packaging in the checkout, with a small &euro;9,50 surcharge.',
    'idx.faq.q7': 'Is raw honey safe for young children?',
    'idx.faq.a7_html': 'Do not give honey to children under twelve months of age. This is the standard advice of the Dutch Voedingscentrum, due to a very small risk of infant botulism in any unprocessed honey. For everyone above one year, honey is safe to enjoy.',
    'idx.faq.q8': 'Can I visit the estate?',
    'idx.faq.a8_html': 'By appointment we welcome small groups between April and October at the Andreou cellar in Pelion, Greece. A single day, an accompanied tasting, a walk to the higher hives if the weather allows. Send your preferred dates to <a href="mailto:hello@harvestdeli.nl">hello@harvestdeli.nl</a>.',

    'cnt.faq.eyebrow': 'Before you write',
    'cnt.faq.title_html': 'Frequently <em>asked.</em>',
    'cnt.faq.desc': 'Six small notes that may save you a message. If the answer is not here, write to us. We read every letter.',
    'cnt.faq.help_html': 'For wholesale or hospitality, the <a href="partners.html">partnership programme</a> has a dedicated form. For privacy and data requests, <a href="mailto:privacy@harvestdeli.nl">privacy@harvestdeli.nl</a>.',
    'cnt.faq.q1': 'How quickly do you reply?',
    'cnt.faq.a1_html': 'Within two working days, often faster. On Monday mornings, Friday afternoons and during harvest weeks it can take a little longer. For urgent order matters, write directly to <a href="mailto:orders@harvestdeli.nl">orders@harvestdeli.nl</a>.',
    'cnt.faq.q2': 'Which channel should I use?',
    'cnt.faq.a2_html': 'Use <a href="mailto:hello@harvestdeli.nl">hello@harvestdeli.nl</a> for general questions, <a href="mailto:orders@harvestdeli.nl">orders@harvestdeli.nl</a> for shipping and delivery, <a href="mailto:wholesale@harvestdeli.nl">wholesale@harvestdeli.nl</a> for retail and hospitality, and <a href="mailto:privacy@harvestdeli.nl">privacy@harvestdeli.nl</a> for data and access requests under the GDPR.',
    'cnt.faq.q3': 'Wholesale or hospitality enquiry?',
    'cnt.faq.a3_html': 'Send a short note via the form on our <a href="partners.html">partnership programme</a>. We answer every request personally and usually respond within 24 to 48 hours, often with a sample box dispatched from Pelion the same week.',
    'cnt.faq.q4': 'My order has not arrived or arrived damaged.',
    'cnt.faq.a4_html': 'Email <a href="mailto:orders@harvestdeli.nl">orders@harvestdeli.nl</a> with your order number and, where possible, a photograph of the outer box. We arrange a free replacement shipment or full refund within two working days. Read more on the <a href="legal-shipping.html">shipping</a> and <a href="legal-returns.html">returns</a> pages.',
    'cnt.faq.q5': 'Can I visit the estate or the depot?',
    'cnt.faq.a5_html': 'By appointment, yes. Press, wholesale partners and existing clients are welcome. Send a request with date and reason to <a href="mailto:hello@harvestdeli.nl">hello@harvestdeli.nl</a>. The Andreou cellar in Pelion is open to small groups between April and October.',
    'cnt.faq.q6': 'Do you exist on social media?',
    'cnt.faq.a6_html': 'Quietly, on Instagram. We do not run paid advertising and we do not chase the algorithm. Subscribe to the <a href="journal.html">journal</a> for slower correspondence, three or four times a year.'
  });

  Object.assign(T.nl, {
    'idx.faq.eyebrow': 'Veelgestelde vragen',
    'idx.faq.title_html': 'Rustig <em>beantwoord.</em>',
    'idx.faq.desc': 'De korte antwoorden die wij aan eerste bezoekers van het kelder sturen. Tik op een vraag voor het uitgebreide antwoord.',
    'idx.faq.help_html': 'Staat uw vraag er niet bij? Schrijf naar <a href="mailto:hello@harvestdeli.nl">hello@harvestdeli.nl</a> en wij reageren binnen twee werkdagen. Voor bestellingen: <a href="mailto:orders@harvestdeli.nl">orders@harvestdeli.nl</a>.',
    'idx.faq.q1': 'Hoe snel wordt mijn bestelling verzonden?',
    'idx.faq.a1_html': 'Bestellingen verlaten ons Nederlandse depot binnen drie werkdagen. Vanaf verzending duurt het &eacute;&eacute;n tot twee werkdagen binnen Nederland en twee tot acht werkdagen binnen de EU. Track-and-trace ontvangt u per e-mail. Volledig overzicht op de <a href="legal-shipping.html">verzendpagina</a>.',
    'idx.faq.q2': 'Waar verzenden jullie naartoe?',
    'idx.faq.a2_html': 'Heel Nederland, alle EU-lidstaten, plus het Verenigd Koninkrijk, Zwitserland en Noorwegen. Wereldwijd op aanvraag. Verzending is gratis vanaf &euro;90 binnen Nederland en vanaf &euro;120 binnen de EU.',
    'idx.faq.q3': 'Is jullie honing rauw?',
    'idx.faq.a3_html': 'Ja. Onze kammen worden gecentrifugeerd op keldertemperatuur, nooit boven achttien graden. De honing rust daarna veertien dagen in eikenhouten vaten, ongefilterd. Elk enzym, elke pollenkorrel en elke aromatische noot van het seizoen blijft intact. Lees meer in het <a href="article-taste-the-greek-sun.html">proefverslag</a>.',
    'idx.faq.q4': 'Hoe lang blijft de honing goed?',
    'idx.faq.a4_html': 'Onbeperkt, mits gesloten bewaard. Honing bevat vrijwel geen water en is van nature antibacterieel. Bewaar koel, droog en uit het licht. Kristallisatie is natuurlijk en omkeerbaar: plaats de pot in een waterbad van maximaal 35&deg;C om hem voorzichtig vloeibaar te maken.',
    'idx.faq.q5': 'Kan ik mijn bestelling retourneren?',
    'idx.faq.a5_html': 'Binnen veertien dagen na ontvangst kunt u ongeopende, verzegelde potten zonder opgaaf van reden retourneren. Eenmaal verbroken zegel kan om hygi&euml;nische redenen niet meer worden teruggenomen. Volledige instructies en het modelformulier op de <a href="legal-returns.html">retourpagina</a>.',
    'idx.faq.q6': 'Hebben jullie cadeauverpakkingen?',
    'idx.faq.a6_html': 'Ja. In een houtfineer cadeaudoos met linnen voering, voor &eacute;&eacute;n tot drie potten, met een handgeschreven kaartje. Selecteer cadeauverpakking in de checkout, met een toeslag van &euro;9,50.',
    'idx.faq.q7': 'Is rauwe honing veilig voor jonge kinderen?',
    'idx.faq.a7_html': 'Geef geen honing aan kinderen jonger dan twaalf maanden. Dit advies komt van het Voedingscentrum, vanwege een zeer klein risico op zuigelingenbotulisme in alle ongepasteuriseerde honing. Voor iedereen ouder dan &eacute;&eacute;n jaar is honing veilig.',
    'idx.faq.q8': 'Kan ik het landgoed bezoeken?',
    'idx.faq.a8_html': 'Op afspraak ontvangen wij kleine groepen tussen april en oktober op het Andreou-kelder in Pelion, Griekenland. &Eacute;&eacute;n dag, een begeleide proeverij, en bij goed weer een wandeling naar de hogere kasten. Stuur uw voorkeursdata naar <a href="mailto:hello@harvestdeli.nl">hello@harvestdeli.nl</a>.',

    'cnt.faq.eyebrow': 'Voordat u schrijft',
    'cnt.faq.title_html': 'Veel<em>gestelde vragen.</em>',
    'cnt.faq.desc': 'Zes korte notities die u een bericht kunnen besparen. Staat uw antwoord er niet bij, schrijf ons. Wij lezen elke brief.',
    'cnt.faq.help_html': 'Voor wholesale of horeca heeft het <a href="partners.html">partnership-programma</a> een apart formulier. Voor privacy- en datavragen: <a href="mailto:privacy@harvestdeli.nl">privacy@harvestdeli.nl</a>.',
    'cnt.faq.q1': 'Hoe snel reageren jullie?',
    'cnt.faq.a1_html': 'Binnen twee werkdagen, vaak sneller. Op maandagochtend, vrijdagmiddag en in oogstweken duurt het soms iets langer. Voor dringende ordervragen schrijft u direct aan <a href="mailto:orders@harvestdeli.nl">orders@harvestdeli.nl</a>.',
    'cnt.faq.q2': 'Welk kanaal kan ik het beste gebruiken?',
    'cnt.faq.a2_html': 'Gebruik <a href="mailto:hello@harvestdeli.nl">hello@harvestdeli.nl</a> voor algemene vragen, <a href="mailto:orders@harvestdeli.nl">orders@harvestdeli.nl</a> voor verzending en levering, <a href="mailto:wholesale@harvestdeli.nl">wholesale@harvestdeli.nl</a> voor wholesale en horeca, en <a href="mailto:privacy@harvestdeli.nl">privacy@harvestdeli.nl</a> voor inzage- en datavragen onder de AVG.',
    'cnt.faq.q3': 'Wholesale- of horeca-aanvraag?',
    'cnt.faq.a3_html': 'Stuur een korte boodschap via het formulier op het <a href="partners.html">partnership-programma</a>. Wij beantwoorden elke aanvraag persoonlijk en reageren doorgaans binnen 24 tot 48 uur, vaak met een sampledoos die nog dezelfde week vanuit Pelion vertrekt.',
    'cnt.faq.q4': 'Mijn bestelling is niet aangekomen of beschadigd.',
    'cnt.faq.a4_html': 'Mail <a href="mailto:orders@harvestdeli.nl">orders@harvestdeli.nl</a> met uw bestelnummer en, indien mogelijk, een foto van de buitendoos. Wij regelen kosteloos een vervangende zending of volledige terugbetaling binnen twee werkdagen. Lees verder op de <a href="legal-shipping.html">verzend-</a> en <a href="legal-returns.html">retourpagina</a>.',
    'cnt.faq.q5': 'Kan ik het landgoed of het depot bezoeken?',
    'cnt.faq.a5_html': 'Op afspraak, ja. Pers, wholesale-partners en bestaande klanten zijn welkom. Stuur een verzoek met datum en reden naar <a href="mailto:hello@harvestdeli.nl">hello@harvestdeli.nl</a>. Het Andreou-kelder in Pelion is geopend voor kleine groepen tussen april en oktober.',
    'cnt.faq.q6': 'Bestaan jullie op social media?',
    'cnt.faq.a6_html': 'Zachtjes, op Instagram. Wij draaien geen betaalde advertenties en jagen niet op het algoritme. Abonneer u op het <a href="journal.html">journal</a> voor langzamere correspondentie, drie tot vier keer per jaar.'
  });

  Object.assign(T.el, {
    'idx.faq.eyebrow': 'Συχνές ερωτήσεις',
    'idx.faq.title_html': 'Αργές <em>απαντήσεις.</em>',
    'idx.faq.desc': 'Οι σύντομες απαντήσεις που στέλνουμε στους πρώτους επισκέπτες του κελαριού. Πατήστε μια ερώτηση για την εκτενέστερη απάντηση.',
    'idx.faq.help_html': 'Δεν βρίσκετε την ερώτησή σας; Γράψτε στο <a href="mailto:hello@harvestdeli.nl">hello@harvestdeli.nl</a> και απαντούμε εντός δύο εργάσιμων ημερών. Για παραγγελίες: <a href="mailto:orders@harvestdeli.nl">orders@harvestdeli.nl</a>.',
    'idx.faq.q1': 'Πόσο γρήγορα αποστέλλετε;',
    'idx.faq.a1_html': 'Οι παραγγελίες φεύγουν από το ολλανδικό αποθηκευτικό μας χώρο εντός τριών εργάσιμων ημερών. Από την αποστολή χρειάζονται μία έως δύο εργάσιμες εντός Ολλανδίας και δύο έως οκτώ εργάσιμες σε όλη την ΕΕ. Παρακολούθηση μέσω e-mail. Πλήρης ανάλυση στη <a href="legal-shipping.html">σελίδα αποστολών</a>.',
    'idx.faq.q2': 'Πού αποστέλλετε;',
    'idx.faq.a2_html': 'Σε όλη την Ολλανδία, σε κάθε κράτος μέλος της ΕΕ, καθώς και στο Ηνωμένο Βασίλειο, την Ελβετία και τη Νορβηγία. Παγκοσμίως κατόπιν αιτήματος. Δωρεάν αποστολή άνω των &euro;90 εντός Ολλανδίας και άνω των &euro;120 εντός ΕΕ.',
    'idx.faq.q3': 'Είναι ωμό το μέλι σας;',
    'idx.faq.a3_html': 'Ναι. Οι κηρήθρες φυγοκεντρούνται σε θερμοκρασία κελαριού, ποτέ πάνω από δεκαοκτώ βαθμούς. Το μέλι στη συνέχεια ξεκουράζεται για δεκατέσσερις ημέρες σε δεξαμενές δρυός, χωρίς φιλτράρισμα. Κάθε ένζυμο, κάθε γύρη και κάθε αρωματική νότα της εποχής παραμένει ανέπαφη. Διαβάστε περισσότερα στο <a href="article-taste-the-greek-sun.html">δοκίμιο γευσιγνωσίας</a>.',
    'idx.faq.q4': 'Πόσο διαρκεί το μέλι;',
    'idx.faq.a4_html': 'Επ’ αόριστον, σφραγισμένο. Το μέλι έχει σχεδόν καθόλου νερό και είναι από τη φύση του αντιβακτηριδιακό. Φυλάξτε δροσερό, ξηρό και μακριά από το φως. Η κρυστάλλωση είναι φυσική και αντιστρέψιμη: ζεστάνετε το βάζο σε υδατόλουτρο μέχρι 35&deg;C για να επιστρέψει σε υγρή μορφή.',
    'idx.faq.q5': 'Μπορώ να επιστρέψω μια παραγγελία;',
    'idx.faq.a5_html': 'Εντός δεκατεσσάρων ημερών από την παραλαβή μπορείτε να επιστρέψετε άθικτα, σφραγισμένα βάζα χωρίς να δώσετε λόγο. Μόλις σπάσει η σφραγίδα, το βάζο δεν μπορεί να επιστραφεί για λόγους υγιεινής. Πλήρεις οδηγίες και έντυπο στη <a href="legal-returns.html">σελίδα επιστροφών</a>.',
    'idx.faq.q6': 'Προσφέρετε συσκευασία δώρου;',
    'idx.faq.a6_html': 'Ναι. Ένα κουτί παρουσίασης από καπλαμά δρυός με λινό εσωτερικό, για ένα έως τρία βάζα, με χειρόγραφη κάρτα. Επιλέξτε συσκευασία δώρου στο checkout, με μικρή επιβάρυνση &euro;9,50.',
    'idx.faq.q7': 'Είναι ασφαλές το ωμό μέλι για μικρά παιδιά;',
    'idx.faq.a7_html': 'Μη δίνετε μέλι σε παιδιά κάτω των δώδεκα μηνών. Αυτή είναι η συμβουλή του Ολλανδικού Voedingscentrum, λόγω ελάχιστου κινδύνου παιδικής αλλαντίασης σε κάθε μη επεξεργασμένο μέλι. Για όλους άνω του ενός έτους, το μέλι είναι ασφαλές.',
    'idx.faq.q8': 'Μπορώ να επισκεφθώ το κτήμα;',
    'idx.faq.a8_html': 'Κατόπιν ραντεβού δεχόμαστε μικρές ομάδες μεταξύ Απριλίου και Οκτωβρίου στο κελάρι Ανδρέου στο Πήλιο. Μία ημέρα, μια συνοδευόμενη γευσιγνωσία και, αν ο καιρός το επιτρέπει, μια βόλτα στις υψηλότερες κυψέλες. Στείλτε τις προτιμώμενες ημερομηνίες στο <a href="mailto:hello@harvestdeli.nl">hello@harvestdeli.nl</a>.',

    'cnt.faq.eyebrow': 'Πριν γράψετε',
    'cnt.faq.title_html': 'Συχνές <em>ερωτήσεις.</em>',
    'cnt.faq.desc': 'Έξι σύντομες σημειώσεις που ίσως σας γλιτώσουν ένα μήνυμα. Αν δεν είναι εδώ η απάντηση, γράψτε μας. Διαβάζουμε κάθε επιστολή.',
    'cnt.faq.help_html': 'Για χονδρική ή φιλοξενία, το <a href="partners.html">πρόγραμμα συνεργασίας</a> έχει ξεχωριστή φόρμα. Για ερωτήματα ιδιωτικότητας: <a href="mailto:privacy@harvestdeli.nl">privacy@harvestdeli.nl</a>.',
    'cnt.faq.q1': 'Πόσο γρήγορα απαντάτε;',
    'cnt.faq.a1_html': 'Εντός δύο εργάσιμων ημερών, συχνά γρηγορότερα. Δευτέρα πρωί, Παρασκευή απόγευμα και κατά τη διάρκεια εβδομάδων συγκομιδής μπορεί να καθυστερήσουμε λίγο. Για επείγοντα θέματα παραγγελίας γράψτε απευθείας στο <a href="mailto:orders@harvestdeli.nl">orders@harvestdeli.nl</a>.',
    'cnt.faq.q2': 'Ποιο κανάλι να χρησιμοποιήσω;',
    'cnt.faq.a2_html': 'Χρησιμοποιήστε <a href="mailto:hello@harvestdeli.nl">hello@harvestdeli.nl</a> για γενικές ερωτήσεις, <a href="mailto:orders@harvestdeli.nl">orders@harvestdeli.nl</a> για αποστολές και παραδόσεις, <a href="mailto:wholesale@harvestdeli.nl">wholesale@harvestdeli.nl</a> για χονδρική και φιλοξενία, και <a href="mailto:privacy@harvestdeli.nl">privacy@harvestdeli.nl</a> για αιτήματα προσωπικών δεδομένων σύμφωνα με τον ΓΚΠΔ.',
    'cnt.faq.q3': 'Αίτημα χονδρικής ή φιλοξενίας;',
    'cnt.faq.a3_html': 'Στείλτε ένα σύντομο μήνυμα μέσω της φόρμας στο <a href="partners.html">πρόγραμμα συνεργασίας</a>. Απαντάμε σε κάθε αίτημα προσωπικά, συνήθως εντός 24 έως 48 ωρών, συχνά με μια δειγματοθήκη να φεύγει από το Πήλιο την ίδια εβδομάδα.',
    'cnt.faq.q4': 'Η παραγγελία μου δεν έφτασε ή έφτασε φθαρμένη.',
    'cnt.faq.a4_html': 'Στείλτε email στο <a href="mailto:orders@harvestdeli.nl">orders@harvestdeli.nl</a> με τον αριθμό παραγγελίας και, αν είναι δυνατόν, μια φωτογραφία του εξωτερικού κουτιού. Κανονίζουμε δωρεάν αντικατάσταση ή πλήρη επιστροφή χρημάτων εντός δύο εργάσιμων ημερών. Διαβάστε περισσότερα στις σελίδες <a href="legal-shipping.html">αποστολών</a> και <a href="legal-returns.html">επιστροφών</a>.',
    'cnt.faq.q5': 'Μπορώ να επισκεφθώ το κτήμα ή την αποθήκη;',
    'cnt.faq.a5_html': 'Κατόπιν ραντεβού, ναι. Δεχόμαστε τύπο, συνεργάτες χονδρικής και υπάρχοντες πελάτες. Στείλτε αίτημα με ημερομηνία και λόγο στο <a href="mailto:hello@harvestdeli.nl">hello@harvestdeli.nl</a>. Το κελάρι Ανδρέου στο Πήλιο είναι ανοιχτό για μικρές ομάδες μεταξύ Απριλίου και Οκτωβρίου.',
    'cnt.faq.q6': 'Είστε στα social media;',
    'cnt.faq.a6_html': 'Διακριτικά, στο Instagram. Δεν τρέχουμε επί πληρωμή διαφημίσεις και δεν κυνηγάμε τον αλγόριθμο. Εγγραφείτε στο <a href="journal.html">ημερολόγιο</a> για πιο αργή αλληλογραφία, τρεις με τέσσερις φορές τον χρόνο.'
  });

  // =====================================================
  //  SHOP FILTER i18n bundle, extends T
  // =====================================================
  Object.assign(T.en, {
    'shop.tb.editions': 'editions', 'shop.tb.of': 'of',
    'shop.tb.sortLabel': 'Sort', 'shop.tb.filter': 'Filter',
    'shop.chips.refining': 'Refining by', 'shop.chips.clearAll': 'Clear all',
    'shop.chips.limited': 'Limited editions', 'shop.chips.raw': 'Raw & unprocessed',
    'shop.sort.recommended': 'Recommended', 'shop.sort.popular': 'Most popular',
    'shop.sort.harvest': 'Latest harvest', 'shop.sort.lightest': 'Lightest flavour',
    'shop.sort.richest': 'Richest flavour', 'shop.sort.limited': 'Limited editions',
    'shop.fp.eyebrow': 'Refine the collection',
    'shop.fp.title_html': 'Nine honeys, <em>one mountain at a time.</em>',
    'shop.fp.close': 'Close',
    'shop.fp.g.type': 'Honey type', 'shop.fp.g.region': 'Origin region',
    'shop.fp.g.flavor': 'Flavour profile', 'shop.fp.g.color': 'Colour',
    'shop.fp.g.texture': 'Texture', 'shop.fp.g.season': 'Harvest season',
    'shop.fp.g.house': 'House attributes', 'shop.fp.g.pairings': 'Pairings',
    'shop.fp.type.arbutus': 'Arbutus', 'shop.fp.type.oak': 'Oak',
    'shop.fp.type.fir': 'Fir &amp; vanilla', 'shop.fp.type.orange': 'Orange blossom',
    'shop.fp.type.acacia': 'Acacia', 'shop.fp.type.thyme': 'Thyme',
    'shop.fp.type.chestnut': 'Chestnut', 'shop.fp.type.pine': 'Pine',
    'shop.fp.type.heather': 'Heather',
    'shop.fp.flavor.warm': 'Warm & resinous', 'shop.fp.flavor.floral': 'Floral',
    'shop.fp.flavor.citrus': 'Citrus', 'shop.fp.flavor.herbal': 'Herbal',
    'shop.fp.flavor.smoky': 'Smoky', 'shop.fp.flavor.mineral': 'Mineral',
    'shop.fp.flavor.woody': 'Woody',
    'shop.fp.color.pale': 'Pale gold', 'shop.fp.color.light': 'Light amber',
    'shop.fp.color.dark': 'Dark amber', 'shop.fp.color.mahogany': 'Mahogany',
    'shop.fp.texture.liquid': 'Liquid', 'shop.fp.texture.creamy': 'Creamy',
    'shop.fp.texture.set': 'Set / waxy', 'shop.fp.texture.dense': 'Dense',
    'shop.fp.season.spring': 'Spring', 'shop.fp.season.summer': 'Summer',
    'shop.fp.season.lateSummer': 'Late summer', 'shop.fp.season.autumn': 'Autumn',
    'shop.fp.limited.title': 'Limited editions only',
    'shop.fp.limited.sub': 'Fewer than 100 numbered jars per harvest',
    'shop.fp.raw.title': 'Raw & unprocessed only',
    'shop.fp.raw.sub': 'Never heated above cellar temperature',
    'shop.fp.pairings.cheese': 'Aged cheese', 'shop.fp.pairings.bread_html': 'Bread &amp; butter',
    'shop.fp.pairings.yogurt_html': 'Yogurt &amp; granola', 'shop.fp.pairings.tea_html': 'Tea &amp; tisanes',
    'shop.fp.pairings.chocolate': 'Dark chocolate', 'shop.fp.pairings.savory': 'Savoury / grill',
    'shop.fp.reset': 'Reset', 'shop.fp.applyPrefix': 'Show', 'shop.fp.applySuffix': 'editions',
    'shop.empty.title_html': 'No matching harvests <em>found.</em>',
    'shop.empty.desc': 'Try exploring a different flavour profile, or remove a filter to widen the search.',
    'shop.empty.cta': 'Clear all filters'
  });

  Object.assign(T.nl, {
    'shop.tb.editions': 'edities', 'shop.tb.of': 'van',
    'shop.tb.sortLabel': 'Sorteren', 'shop.tb.filter': 'Filter',
    'shop.chips.refining': 'Verfijnen op', 'shop.chips.clearAll': 'Alles wissen',
    'shop.chips.limited': 'Beperkte edities', 'shop.chips.raw': 'Rauw & onbewerkt',
    'shop.sort.recommended': 'Aanbevolen', 'shop.sort.popular': 'Meest populair',
    'shop.sort.harvest': 'Laatste oogst', 'shop.sort.lightest': 'Lichtste smaak',
    'shop.sort.richest': 'Rijkste smaak', 'shop.sort.limited': 'Beperkte edities',
    'shop.fp.eyebrow': 'Verfijn de collectie',
    'shop.fp.title_html': 'Zes landgoederen, <em>één berg per keer.</em>',
    'shop.fp.close': 'Sluiten',
    'shop.fp.g.type': 'Honingsoort', 'shop.fp.g.region': 'Herkomstregio',
    'shop.fp.g.flavor': 'Smaakprofiel', 'shop.fp.g.color': 'Kleur',
    'shop.fp.g.texture': 'Textuur', 'shop.fp.g.season': 'Oogstseizoen',
    'shop.fp.g.house': 'Huiskenmerken', 'shop.fp.g.pairings': 'Combinaties',
    'shop.fp.type.chestnut': 'Tamme kastanje', 'shop.fp.type.thyme': 'Wilde tijm',
    'shop.fp.type.pine_html': 'Den &amp; heide', 'shop.fp.type.wildflower': 'Wilde bloem',
    'shop.fp.type.mountain': 'Berg reserve', 'shop.fp.type.orange': 'Sinaasappelbloesem',
    'shop.fp.flavor.warm': 'Warm & harsig', 'shop.fp.flavor.floral': 'Bloemig',
    'shop.fp.flavor.citrus': 'Citrus', 'shop.fp.flavor.herbal': 'Kruidig',
    'shop.fp.flavor.smoky': 'Rokerig', 'shop.fp.flavor.mineral': 'Mineraal',
    'shop.fp.flavor.woody': 'Houtig',
    'shop.fp.color.pale': 'Bleekgoud', 'shop.fp.color.light': 'Licht amber',
    'shop.fp.color.dark': 'Donker amber', 'shop.fp.color.mahogany': 'Mahonie',
    'shop.fp.texture.liquid': 'Vloeibaar', 'shop.fp.texture.creamy': 'Romig',
    'shop.fp.texture.set': 'Vast / wasachtig', 'shop.fp.texture.dense': 'Dik',
    'shop.fp.season.spring': 'Lente', 'shop.fp.season.summer': 'Zomer',
    'shop.fp.season.lateSummer': 'Nazomer', 'shop.fp.season.autumn': 'Herfst',
    'shop.fp.limited.title': 'Alleen beperkte edities',
    'shop.fp.limited.sub': 'Minder dan 100 genummerde potten per oogst',
    'shop.fp.raw.title': 'Alleen rauw & onbewerkt',
    'shop.fp.raw.sub': 'Nooit boven keldertemperatuur verhit',
    'shop.fp.pairings.cheese': 'Belegen kaas', 'shop.fp.pairings.bread_html': 'Brood &amp; boter',
    'shop.fp.pairings.yogurt_html': 'Yoghurt &amp; granola', 'shop.fp.pairings.tea_html': 'Thee &amp; infusies',
    'shop.fp.pairings.chocolate': 'Pure chocolade', 'shop.fp.pairings.savory': 'Hartig / gegrild',
    'shop.fp.reset': 'Reset', 'shop.fp.applyPrefix': 'Toon', 'shop.fp.applySuffix': 'edities',
    'shop.empty.title_html': 'Geen passende oogst <em>gevonden.</em>',
    'shop.empty.desc': 'Probeer een ander smaakprofiel, of verwijder een filter om de zoekopdracht te verbreden.',
    'shop.empty.cta': 'Wis alle filters'
  });

  Object.assign(T.el, {
    'shop.tb.editions': 'εκδόσεις', 'shop.tb.of': 'από',
    'shop.tb.sortLabel': 'Ταξινόμηση', 'shop.tb.filter': 'Φίλτρο',
    'shop.chips.refining': 'Φιλτράρισμα κατά', 'shop.chips.clearAll': 'Καθαρισμός',
    'shop.chips.limited': 'Περιορισμένες εκδόσεις', 'shop.chips.raw': 'Ωμό & ανεπεξέργαστο',
    'shop.sort.recommended': 'Συνιστώμενα', 'shop.sort.popular': 'Πιο δημοφιλή',
    'shop.sort.harvest': 'Τελευταία συγκομιδή', 'shop.sort.lightest': 'Πιο ελαφριά γεύση',
    'shop.sort.richest': 'Πιο πλούσια γεύση', 'shop.sort.limited': 'Περιορισμένες εκδόσεις',
    'shop.fp.eyebrow': 'Βελτιώστε τη συλλογή',
    'shop.fp.title_html': 'Έξι κτήματα, <em>ένα βουνό κάθε φορά.</em>',
    'shop.fp.close': 'Κλείσιμο',
    'shop.fp.g.type': 'Τύπος μελιού', 'shop.fp.g.region': 'Περιοχή προέλευσης',
    'shop.fp.g.flavor': 'Προφίλ γεύσης', 'shop.fp.g.color': 'Χρώμα',
    'shop.fp.g.texture': 'Υφή', 'shop.fp.g.season': 'Εποχή συγκομιδής',
    'shop.fp.g.house': 'Χαρακτηριστικά οίκου', 'shop.fp.g.pairings': 'Συνδυασμοί',
    'shop.fp.type.chestnut': 'Καστανιά', 'shop.fp.type.thyme': 'Άγριο θυμάρι',
    'shop.fp.type.pine_html': 'Πεύκο &amp; ρείκι', 'shop.fp.type.wildflower': 'Αγριολούλουδα',
    'shop.fp.type.mountain': 'Ορεινή ρεζέρβα', 'shop.fp.type.orange': 'Άνθος πορτοκαλιάς',
    'shop.fp.flavor.warm': 'Ζεστό & ρετσινάτο', 'shop.fp.flavor.floral': 'Λουλουδάτο',
    'shop.fp.flavor.citrus': 'Εσπεριδοειδή', 'shop.fp.flavor.herbal': 'Βοτανικό',
    'shop.fp.flavor.smoky': 'Καπνιστό', 'shop.fp.flavor.mineral': 'Μεταλλικό',
    'shop.fp.flavor.woody': 'Ξυλώδες',
    'shop.fp.color.pale': 'Χλωμό χρυσό', 'shop.fp.color.light': 'Ανοιχτό κεχριμπάρι',
    'shop.fp.color.dark': 'Σκούρο κεχριμπάρι', 'shop.fp.color.mahogany': 'Μαόνι',
    'shop.fp.texture.liquid': 'Υγρό', 'shop.fp.texture.creamy': 'Κρεμώδες',
    'shop.fp.texture.set': 'Συμπαγές / κέρινο', 'shop.fp.texture.dense': 'Πυκνό',
    'shop.fp.season.spring': 'Άνοιξη', 'shop.fp.season.summer': 'Καλοκαίρι',
    'shop.fp.season.lateSummer': 'Αργό καλοκαίρι', 'shop.fp.season.autumn': 'Φθινόπωρο',
    'shop.fp.limited.title': 'Μόνο περιορισμένες εκδόσεις',
    'shop.fp.limited.sub': 'Λιγότερα από 100 αριθμημένα βάζα ανά συγκομιδή',
    'shop.fp.raw.title': 'Μόνο ωμό & ανεπεξέργαστο',
    'shop.fp.raw.sub': 'Ποτέ δεν θερμαίνεται πάνω από τη θερμοκρασία κελαριού',
    'shop.fp.pairings.cheese': 'Παλαιωμένο τυρί', 'shop.fp.pairings.bread_html': 'Ψωμί &amp; βούτυρο',
    'shop.fp.pairings.yogurt_html': 'Γιαούρτι &amp; γκρανόλα', 'shop.fp.pairings.tea_html': 'Τσάι &amp; αφεψήματα',
    'shop.fp.pairings.chocolate': 'Μαύρη σοκολάτα', 'shop.fp.pairings.savory': 'Αλμυρό / στη σχάρα',
    'shop.fp.reset': 'Επαναφορά', 'shop.fp.applyPrefix': 'Δείξε', 'shop.fp.applySuffix': 'εκδόσεις',
    'shop.empty.title_html': 'Δεν βρέθηκε αντίστοιχη <em>συγκομιδή.</em>',
    'shop.empty.desc': 'Δοκιμάστε ένα διαφορετικό προφίλ γεύσης ή αφαιρέστε ένα φίλτρο για να διευρύνετε την αναζήτηση.',
    'shop.empty.cta': 'Καθαρισμός όλων των φίλτρων'
  });

  // =====================================================
  //  WISHLIST i18n bundle, extends T
  // =====================================================
  Object.assign(T.en, {
    'nav.wishlist': 'Wishlist',
    'menu.item.wishlist_html': 'The <em>Cellar Notes</em>',
    'menu.item.wishlist_sub': 'Your wishlist',
    'wl.eyebrow': 'The cellar notes',
    'wl.title_html': 'Set aside for the <em>cellar.</em>',
    'wl.sub': 'Editions you have marked to come back to. Saved quietly to this browser. They wait until you are ready.',
    'wl.itemsLabel': 'edition saved',
    'wl.privacyNote': 'Stored locally · never sent',
    'wl.toolbarInfo': 'Tap a heart to remove an edition, or move it to the cellar in one click.',
    'wl.clearAll': 'Clear wishlist',
    'wl.remove': 'Remove',
    'wl.moveToCellar': 'Move to cellar',
    'wl.view': 'View',
    'wl.empty.title_html': 'Your cellar notes are <em>quiet.</em>',
    'wl.empty.desc': 'Browse the collection, tap a heart on any edition you would like to come back to, and it appears here. We keep nothing on our side.',
    'wl.empty.cta': 'View the collection'
  });
  Object.assign(T.nl, {
    'nav.wishlist': 'Verlanglijst',
    'menu.item.wishlist_html': 'De <em>Kelder&shy;notities</em>',
    'menu.item.wishlist_sub': 'Jouw verlanglijst',
    'wl.eyebrow': 'De keldernotities',
    'wl.title_html': 'Apart gezet voor het <em>kelder.</em>',
    'wl.sub': 'Edities die u opzij heeft gezet om op terug te komen. Stil bewaard in deze browser. Ze wachten tot u klaar bent.',
    'wl.itemsLabel': 'editie opgeslagen',
    'wl.privacyNote': 'Lokaal bewaard · nooit verzonden',
    'wl.toolbarInfo': 'Tik op een hartje om een editie te verwijderen, of verplaats hem in &eacute;&eacute;n klik naar het kelder.',
    'wl.clearAll': 'Verlanglijst leegmaken',
    'wl.remove': 'Verwijderen',
    'wl.moveToCellar': 'Naar het kelder',
    'wl.view': 'Bekijken',
    'wl.empty.title_html': 'Uw keldernotities zijn <em>stil.</em>',
    'wl.empty.desc': 'Blader door de collectie, tik op een hartje bij elke editie waar u op terug wilt komen, en hij verschijnt hier. Wij bewaren niets aan onze kant.',
    'wl.empty.cta': 'Bekijk de collectie'
  });
  Object.assign(T.el, {
    'nav.wishlist': 'Λίστα επιθυμιών',
    'menu.item.wishlist_html': 'Οι <em>Σημειώσεις Κελαριού</em>',
    'menu.item.wishlist_sub': 'Η λίστα επιθυμιών σας',
    'wl.eyebrow': 'Οι σημειώσεις κελαριού',
    'wl.title_html': 'Ξεχωρισμένα για το <em>κελάρι.</em>',
    'wl.sub': 'Εκδόσεις που έχετε σημειώσει για να επιστρέψετε. Φυλάσσονται ήσυχα σε αυτόν τον φυλλομετρητή. Περιμένουν μέχρι να είστε έτοιμοι.',
    'wl.itemsLabel': 'έκδοση αποθηκευμένη',
    'wl.privacyNote': 'Αποθηκευμένο τοπικά · ποτέ δεν αποστέλλεται',
    'wl.toolbarInfo': 'Πατήστε μια καρδιά για να αφαιρέσετε μια έκδοση, ή μετακινήστε τη στο κελάρι με ένα κλικ.',
    'wl.clearAll': 'Καθαρισμός λίστας',
    'wl.remove': 'Αφαίρεση',
    'wl.moveToCellar': 'Στο κελάρι',
    'wl.view': 'Προβολή',
    'wl.empty.title_html': 'Οι σημειώσεις του κελαριού σας είναι <em>ήσυχες.</em>',
    'wl.empty.desc': 'Περιηγηθείτε στη συλλογή, πατήστε καρδιά σε όποια έκδοση θέλετε να επιστρέψετε, και θα εμφανιστεί εδώ. Δεν κρατάμε τίποτα από τη δική μας πλευρά.',
    'wl.empty.cta': 'Δείτε τη συλλογή'
  });

  let currentLang = (function () {
    // Saved user choice always wins
    try {
      const stored = localStorage.getItem('hd-lang');
      if (stored === 'en' || stored === 'nl' || stored === 'el') return stored;
    } catch (e) {}
    // Otherwise: NL-based business, default to Dutch.
    // Greek visitors still get EL automatically (brand origin language).
    const nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('el')) return 'el';
    return 'nl';
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
    if (lang !== 'en' && lang !== 'nl' && lang !== 'el') return;
    currentLang = lang;
    try { localStorage.setItem('hd-lang', lang); } catch (e) {}
    applyTranslations();
    render(); // re-render cart contents (which reference catalog name strings)
  }
  window.HD_setLang = setLang;

  // ---------- Product catalog (with per-language strings) ----------
  function loc(en, nl, el) { return { en: en, nl: nl, el: el }; }
  // Real catalog. Honeys carry two sizes (480g / 950g); oregano + tea carry a
  // 2-for bundle price. `type` drives the basket offer (3 honeys, or 2 honeys
  // + 1 olive oil = €5 off). `price` is the "from" (smallest size) price.
  const PRODUCTS = {
    'fir-vanilla': {
      name: loc('Fir Forest Honey', 'Dennenboshoning', 'Ελατόμελο'),
      edition: loc('Summer Harvest', 'Zomeroogst', 'Καλοκαιρινή Συγκομιδή'),
      region: loc('Mt Olympus · Greece', 'Berg Olympus · Griekenland', 'Όλυμπος · Ελλάδα'),
      altitude: '1300m',
      type: 'honey',
      sizes: [{ id: '480g', label: '480g', price: 22 }, { id: '950g', label: '950g', price: 40 }],
      defaultSize: '480g',
      price: 22,
      hue: 'amber',
      notes: loc('Resinous fir forest, dark and silky.', 'Harsachtig dennenbos, donker en zijdezacht.', 'Ρητινώδες δάσος ελάτου, σκούρο και μεταξένιο.'),
      texture: loc('Thick, silky, glossy', 'Dik, zijdezacht, glanzend', 'Πυκνό, μεταξένιο, γυαλιστερό'),
      weight: '480g · 950g',
      tags: ['mountain', 'raw', 'forest', 'dark'],
      badges: [loc('Raw', 'Rauw', 'Ωμό'), loc('Mountain Honey', 'Berghoning', 'Ορεινό Μέλι')],
      image: 'assets/products-images/fir-vanilla.jpg',
      slug: 'fir-vanilla',
      url: 'product.html?p=fir-vanilla'
    },
    'acacia': {
      name: loc('Acacia Honey', 'Acaciahoning', 'Ακακία Μέλι'),
      edition: loc('Spring Harvest', 'Voorjaarsoogst', 'Ανοιξιάτικη Συγκομιδή'),
      region: loc('Macedonia · Greece', 'Macedonië · Griekenland', 'Μακεδονία · Ελλάδα'),
      altitude: '500m',
      type: 'honey',
      sizes: [{ id: '480g', label: '480g', price: 17 }, { id: '950g', label: '950g', price: 30 }],
      defaultSize: '480g',
      price: 17,
      hue: 'pale',
      notes: loc('Crystal-clear, soft floral, clean.', 'Kristalhelder, zacht bloemig, puur.', 'Κρυστάλλινο, απαλό άνθινο, καθαρό.'),
      texture: loc('Silky and smooth', 'Zijdezacht en glad', 'Μεταξένιο και απαλό'),
      weight: '480g · 950g',
      tags: ['floral', 'light', 'spring'],
      badges: [loc('Spring Harvest', 'Voorjaarsoogst', 'Ανοιξιάτικη Συγκομιδή'), loc('Blossom Honey', 'Bloesemhoning', 'Ανθόμελο')],
      image: 'assets/products-images/acacia.jpg',
      slug: 'acacia',
      url: 'product.html?p=acacia'
    },
    'pine': {
      name: loc('Pine Honey', 'Dennenhoning', 'Πευκόμελο'),
      edition: loc('Autumn Harvest', 'Najaarsoogst', 'Φθινοπωρινή Συγκομιδή'),
      region: loc('Halkidiki · Greece', 'Halkidiki · Griekenland', 'Χαλκιδική · Ελλάδα'),
      altitude: '400m',
      type: 'honey',
      sizes: [{ id: '480g', label: '480g', price: 16 }, { id: '950g', label: '950g', price: 28 }],
      defaultSize: '480g',
      price: 16,
      hue: 'bronze',
      notes: loc('Resinous and smooth, sea-air warmth.', 'Harsachtig en glad, warmte van zeelucht.', 'Ρητινώδες και απαλό, ζεστασιά θαλασσινού αέρα.'),
      texture: loc('Thick and smooth', 'Dik en glad', 'Πυκνό και απαλό'),
      weight: '480g · 950g',
      tags: ['forest', 'raw', 'honeydew', 'dark'],
      badges: [loc('Raw', 'Rauw', 'Ωμό'), loc('Forest Honey', 'Boshoning', 'Δασικό Μέλι')],
      image: 'assets/products-images/pine.jpg',
      slug: 'pine',
      url: 'product.html?p=pine'
    },
    'orange-blossom': {
      name: loc('Orange Blossom Honey', 'Sinaasappelhoning', 'Πορτοκαλόμελο'),
      edition: loc('Spring Harvest', 'Voorjaarsoogst', 'Ανοιξιάτικη Συγκομιδή'),
      region: loc('Peloponnese · Greece', 'Peloponnesos · Griekenland', 'Πελοπόννησος · Ελλάδα'),
      altitude: '200m',
      type: 'honey',
      sizes: [{ id: '480g', label: '480g', price: 15 }, { id: '950g', label: '950g', price: 26 }],
      defaultSize: '480g',
      price: 15,
      hue: 'pale',
      notes: loc('Bright citrus blossom, fresh floral.', 'Heldere citrusbloesem, fris bloemig.', 'Φωτεινό άνθος εσπεριδοειδών, φρέσκο άρωμα.'),
      texture: loc('Smooth and flowing', 'Glad en vloeibaar', 'Απαλό και ρευστό'),
      weight: '480g · 950g',
      tags: ['floral', 'citrus', 'light', 'spring'],
      badges: [loc('Spring Harvest', 'Voorjaarsoogst', 'Ανοιξιάτικη Συγκομιδή'), loc('Blossom Honey', 'Bloesemhoning', 'Ανθόμελο')],
      image: 'assets/products-images/orange-blossom.jpg',
      slug: 'orange-blossom',
      url: 'product.html?p=orange-blossom'
    },
    'chestnut': {
      name: loc('Chestnut Honey', 'Kastanjehoning', 'Καστανόμελο'),
      edition: loc('Summer Harvest', 'Zomeroogst', 'Καλοκαιρινή Συγκομιδή'),
      region: loc('Pelion · Greece', 'Pelion · Griekenland', 'Πήλιο · Ελλάδα'),
      altitude: '950m',
      type: 'honey',
      sizes: [{ id: '480g', label: '480g', price: 18 }, { id: '950g', label: '950g', price: 32 }],
      defaultSize: '480g',
      price: 18,
      hue: 'amber',
      notes: loc('Warm wood, layered, long depth.', 'Warm hout, gelaagd, lange diepte.', 'Ζεστό ξύλο, πολυεπίπεδο, μακρύ βάθος.'),
      texture: loc('Thick and rich', 'Dik en rijk', 'Πυκνό και πλούσιο'),
      weight: '480g · 950g',
      tags: ['mountain', 'forest', 'raw', 'dark'],
      badges: [loc('Raw', 'Rauw', 'Ωμό'), loc('Mountain Honey', 'Berghoning', 'Ορεινό Μέλι')],
      slug: 'chestnut',
      url: 'product.html'
    },
    'oak': {
      name: loc('Oak Honey', 'Eikenhoning', 'Βελανιδόμελο'),
      edition: loc('Summer Harvest', 'Zomeroogst', 'Καλοκαιρινή Συγκομιδή'),
      region: loc('Epirus · Greece', 'Epirus · Griekenland', 'Ήπειρος · Ελλάδα'),
      altitude: '900m',
      type: 'honey',
      sizes: [{ id: '480g', label: '480g', price: 17 }, { id: '950g', label: '950g', price: 30 }],
      defaultSize: '480g',
      price: 17,
      hue: 'bronze',
      notes: loc('Deep forest, woody, mineral-rich.', 'Diep bos, houtig, mineraalrijk.', 'Βαθύ δάσος, ξυλώδες, πλούσιο σε μέταλλα.'),
      texture: loc('Dense and smooth', 'Dik en glad', 'Πυκνό και απαλό'),
      weight: '480g · 950g',
      tags: ['forest', 'raw', 'dark', 'honeydew'],
      badges: [loc('Raw', 'Rauw', 'Ωμό'), loc('Forest Honey', 'Boshoning', 'Δασικό Μέλι')],
      image: 'assets/products-images/oak.jpg',
      slug: 'oak',
      url: 'product.html?p=oak'
    },
    'arbutus': {
      name: loc('Arbutus Honey', 'Aardbeiboom Honing', 'Κουμαρόμελο'),
      edition: loc('Autumn Harvest', 'Najaarsoogst', 'Φθινοπωρινή Συγκομιδή'),
      region: loc('Crete · Greece', 'Kreta · Griekenland', 'Κρήτη · Ελλάδα'),
      altitude: '600m',
      type: 'honey',
      sizes: [{ id: '480g', label: '480g', price: 19 }, { id: '950g', label: '950g', price: 34 }],
      defaultSize: '480g',
      price: 19,
      hue: 'deep',
      notes: loc('Bittersweet, herbal, earthy depth.', 'Bitterzoet, kruidig, aardse diepte.', 'Γλυκόπικρο, βοτανικό, γήινο βάθος.'),
      texture: loc('Dense and rich, naturally creamy', 'Dik en rijk, natuurlijk romig', 'Πυκνό και πλούσιο, φυσικά κρεμώδες'),
      weight: '480g · 950g',
      tags: ['rare', 'raw', 'dark', 'herbal'],
      badges: [loc('Raw', 'Rauw', 'Ωμό'), loc('Rare Harvest', 'Zeldzame Oogst', 'Σπάνια Συγκομιδή')],
      image: 'assets/products-images/arbutus.jpg',
      slug: 'arbutus',
      url: 'product.html?p=arbutus'
    },
    'thyme': {
      name: loc('Thyme Honey', 'Tijmhoning', 'Θυμαρίσιο Μέλι'),
      edition: loc('Summer Harvest', 'Zomeroogst', 'Καλοκαιρινή Συγκομιδή'),
      region: loc('Crete · Greece', 'Kreta · Griekenland', 'Κρήτη · Ελλάδα'),
      altitude: '400m',
      type: 'honey',
      sizes: [{ id: '480g', label: '480g', price: 19 }, { id: '950g', label: '950g', price: 34 }],
      defaultSize: '480g',
      price: 19,
      hue: 'straw',
      notes: loc('Aromatic wild thyme, warm and floral.', 'Aromatische wilde tijm, warm en bloemig.', 'Αρωματικό άγριο θυμάρι, ζεστό και άνθινο.'),
      texture: loc('Smooth and rich', 'Glad en rijk', 'Απαλό και πλούσιο'),
      weight: '480g · 950g',
      tags: ['floral', 'herbal', 'light', 'summer'],
      badges: [loc('Raw', 'Rauw', 'Ωμό'), loc('Island Honey', 'Eilandhoning', 'Νησιώτικο Μέλι')],
      slug: 'thyme',
      url: 'product.html?p=thyme'
    },
    'oregano': {
      name: loc('Wild Oregano', 'Wilde Oregano', 'Άγρια Ρίγανη'),
      edition: loc('Summer Harvest', 'Zomeroogst', 'Καλοκαιρινή Συγκομιδή'),
      region: loc('Wild hills · Greece', 'Wilde heuvels · Griekenland', 'Άγριοι λόφοι · Ελλάδα'),
      altitude: '700m',
      type: 'herb',
      sizes: [{ id: '15g', label: '15g', price: 2.5 }],
      defaultSize: '15g',
      bundle: { qty: 2, price: 4 },
      price: 2.5,
      hue: 'straw',
      notes: loc('Sun-dried wild oregano, warm and intense.', 'Zongedroogde wilde oregano, warm en intens.', 'Λιαστή άγρια ρίγανη, ζεστή και έντονη.'),
      texture: loc('Dried flowering tops', 'Gedroogde bloeitoppen', 'Αποξηραμένες ανθισμένες κορυφές'),
      weight: '15g',
      tags: ['herb', 'dried', 'wild'],
      badges: [loc('Hand-Picked', 'Handgeplukt', 'Χειροσυλλεγμένο'), loc('Sun-Dried', 'Zongedroogd', 'Λιαστό')],
      slug: 'oregano',
      url: 'shop.html'
    },
    'olive-oil': {
      name: loc('Extra Virgin Olive Oil', 'Extra Vergine Olijfolie', 'Εξαιρετικό Παρθένο Ελαιόλαδο'),
      edition: loc('Estate Pressing · 2025', 'Landgoed Persing · 2025', 'Κτήμα · 2025'),
      region: loc('Pelion · Greece', 'Pelion · Griekenland', 'Πήλιο · Ελλάδα'),
      altitude: '400m',
      type: 'oil',
      sizes: [{ id: '500ml', label: '500ml', price: 15 }],
      defaultSize: '500ml',
      price: 15,
      hue: 'pale',
      image: 'assets/greekoliveoil.PNG',
      notes: loc('Green almond, fresh-cut grass, peppery finish.', 'Groene amandel, versgemaaid gras, peperige afdronk.', 'Πράσινο αμύγδαλο, φρεσκοκομμένο χορτάρι, πιπεράτη επίγευση.'),
      texture: loc('Bright, grassy, robust', 'Fris, grasachtig, robuust', 'Ζωηρό, χορταρένιο, εύρωστο'),
      weight: '500ml',
      tags: ['olive-oil', 'cold-extracted', 'light'],
      badges: [loc('Cold Pressed', 'Koud Geperst', 'Ψυχρής Έκθλιψης'), loc('Extra Virgin', 'Extra Vergine', 'Εξαιρετικό Παρθένο')],
      slug: 'olive-oil',
      url: 'product-olive-oil.html'
    },
    'mountain-tea': {
      name: loc('Greek Mountain Tea', 'Griekse Bergthee', 'Τσάι του Βουνού'),
      edition: loc('Summer Harvest', 'Zomeroogst', 'Καλοκαιρινή Συγκομιδή'),
      region: loc('Wild mountains · Greece', 'Wilde bergen · Griekenland', 'Άγρια βουνά · Ελλάδα'),
      altitude: '1100m',
      type: 'tea',
      sizes: [{ id: 'bag', label: '1 bag', price: 5 }],
      defaultSize: 'bag',
      bundle: { qty: 2, price: 8 },
      price: 5,
      hue: 'straw',
      image: 'assets/products-images/mountain-tea.jpg',
      notes: loc('Floral, herbal, naturally soothing.', 'Bloemig, kruidig, van nature kalmerend.', 'Άνθινο, βοτανικό, φυσικά καταπραϋντικό.'),
      texture: loc('Golden, light infusion', 'Gouden, lichte infusie', 'Χρυσή, ελαφριά έγχυση'),
      weight: '20g',
      tags: ['tea', 'herbal', 'caffeine-free'],
      badges: [loc('Caffeine Free', 'Cafeïnevrij', 'Χωρίς Καφεΐνη'), loc('Hand-Harvested', 'Handgeplukt', 'Χειροσυλλεγμένο')],
      slug: 'mountain-tea',
      url: 'product-mountain-tea.html'
    }
  };
  // Localize on access: returns plain-string clone for current lang.
  function localizedProduct(slug) {
    const p = PRODUCTS[slug];
    if (!p) return null;
    function pick(v) { return (v && typeof v === 'object' && 'en' in v) ? (v[currentLang] || v.en) : v; }
    const sizes = p.sizes || [{ id: p.defaultSize || 'one', label: p.weight || '', price: p.price }];
    const priceFrom = sizes.reduce(function (m, s) { return Math.min(m, s.price); }, Infinity);
    return {
      slug: p.slug,
      url: p.url,
      type: p.type || 'honey',
      price: isFinite(priceFrom) ? priceFrom : p.price,
      priceFrom: isFinite(priceFrom) ? priceFrom : p.price,
      sizes: sizes,
      defaultSize: p.defaultSize || sizes[0].id,
      multiSize: sizes.length > 1,
      bundle: p.bundle || null,
      hue: p.hue,
      image: p.image || 'harvestdeli.png',
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

  // ---------- Cart pricing helpers (size + bundle + basket offer) ----------
  function sizeOf(item) {
    const p = PRODUCTS[item.slug];
    return item.size || (p && p.defaultSize) || (p && p.sizes && p.sizes[0] && p.sizes[0].id);
  }
  function unitPrice(slug, size) {
    const p = PRODUCTS[slug];
    if (!p) return 0;
    if (p.sizes && p.sizes.length) {
      const s = p.sizes.filter(x => x.id === size)[0] ||
                p.sizes.filter(x => x.id === p.defaultSize)[0] || p.sizes[0];
      return s ? s.price : p.price;
    }
    return p.price;
  }
  function sizeLabel(slug, size) {
    const p = PRODUCTS[slug];
    if (!p || !p.sizes) return '';
    const s = p.sizes.filter(x => x.id === size)[0];
    return s ? s.label : '';
  }
  // Line total, applying the 2-for bundle price where a product carries one.
  function lineTotalFor(slug, qty, size) {
    const p = PRODUCTS[slug];
    if (!p) return 0;
    const unit = unitPrice(slug, size);
    if (p.bundle && p.bundle.qty > 0 && p.bundle.price != null) {
      const sets = Math.floor(qty / p.bundle.qty);
      const rem = qty - sets * p.bundle.qty;
      return sets * p.bundle.price + rem * unit;
    }
    return qty * unit;
  }
  function sameLine(i, slug, size) { return i.slug === slug && sizeOf(i) === size; }
  // Basket offer: 3 honey jars, OR 2 honey jars + 1 olive oil → €5 off (once).
  function offerDiscount() {
    let honey = 0, oil = 0;
    cart.items.forEach(i => {
      const p = PRODUCTS[i.slug];
      if (!p) return;
      if (p.type === 'honey') honey += i.qty;
      else if (p.type === 'oil') oil += i.qty;
    });
    return (honey >= 3 || (honey >= 2 && oil >= 1)) ? 5 : 0;
  }

  // ---------- Cart state ----------
  const STORAGE = 'hd-cart-v1';
  const cart = {
    items: [],
    load() {
      try {
        this.items = JSON.parse(localStorage.getItem(STORAGE) || '[]');
        if (!Array.isArray(this.items)) this.items = [];
        // sanitize unknown slugs + normalise size
        this.items = this.items.filter(i => PRODUCTS[i.slug]).map(i => {
          if (!i.size) i.size = PRODUCTS[i.slug].defaultSize;
          return i;
        });
      } catch (e) { this.items = []; }
    },
    save() { try { localStorage.setItem(STORAGE, JSON.stringify(this.items)); } catch (e) {} },
    add(slug, qty, size) {
      const p = PRODUCTS[slug];
      if (!p) return;
      qty = qty || 1;
      size = size || p.defaultSize || (p.sizes && p.sizes[0] && p.sizes[0].id);
      const existing = this.items.find(i => sameLine(i, slug, size));
      if (existing) existing.qty += qty;
      else this.items.push({ slug: slug, qty: qty, size: size });
      this.save(); render();
    },
    remove(slug, size) {
      this.items = (size == null)
        ? this.items.filter(i => i.slug !== slug)
        : this.items.filter(i => !sameLine(i, slug, size));
      this.save(); render();
    },
    setQty(slug, qty, size) {
      const item = (size == null) ? this.items.find(i => i.slug === slug)
                                  : this.items.find(i => sameLine(i, slug, size));
      if (!item) return;
      if (qty < 1) return this.remove(slug, item.size);
      item.qty = qty;
      this.save(); render();
    },
    count() { return this.items.reduce((s, i) => s + i.qty, 0); },
    lineTotal(item) { return lineTotalFor(item.slug, item.qty, sizeOf(item)); },
    unitPrice: unitPrice,
    sizeLabel: function (item) { return sizeLabel(item.slug, sizeOf(item)); },
    offerDiscount: offerDiscount,
    // Raw line sum (pre-offer). Keep this as total() for back-compat (checkout
    // subtotal reads it); the offer is surfaced as its own discount line.
    total() { return this.items.reduce((s, i) => s + lineTotalFor(i.slug, i.qty, sizeOf(i)), 0); },
    net() { return Math.max(0, this.total() - offerDiscount()); }
  };
  cart.load();
  window.HD_CART = cart;

  // ---------- Render helpers ----------
  function formatPrice(n) { return '€' + (Number.isInteger(n) ? n.toFixed(0) : n.toFixed(2).replace('.', ',')); }

  function render() {
    // Cart counts in nav buttons
    document.querySelectorAll('.nav-cart').forEach(btn => {
      const count = cart.count();
      const countEl = btn.querySelector('.cart-count');
      if (countEl) countEl.textContent = count;
      btn.classList.toggle('has-items', count > 0);
    });

    // Drawer items, READ cart state from Commerce when available (mock source),
    // else fall back to the HD_CART runtime. Markup + delegated handlers unchanged.
    // HD_CART is the source of truth (it carries size + bundle + the basket
    // offer); the Commerce mock mirror is slug-only, so we render from HD_CART.
    const _snap = null;
    const _lines = _snap
      ? _snap.lines.map(l => ({ slug: l.handle, qty: l.quantity, size: null, total: +l.lineTotal.amount }))
      : cart.items.map(i => ({ slug: i.slug, qty: i.qty, size: i.size, total: cart.lineTotal(i) }));

    // Hide the subtotal/checkout footer when the Cellar is empty (no €0 checkout)
    const _drawer = document.getElementById('cartDrawer');
    if (_drawer) _drawer.classList.toggle('is-empty', _lines.length === 0);

    const itemsWrap = document.getElementById('cartItems');
    if (itemsWrap) {
      if (_lines.length === 0) {
        var _sugg = ['chestnut', 'mountain-tea', 'olive-oil'].map(function (sl) {
          var p; try { p = localizedProduct(sl); } catch (e) { p = null; }
          if (!p) return '';
          return '<a class="ce-card" href="' + p.url + '">' +
            '<span class="ce-card-img"><img src="' + p.image + '" alt="' + p.name + '" loading="lazy"></span>' +
            '<span class="ce-card-meta"><span class="ce-card-name">' + p.name + '</span>' +
            '<span class="ce-card-price">' + formatPrice(p.price) + '</span></span>' +
          '</a>';
        }).join('');
        itemsWrap.innerHTML = `
          <div class="cart-empty">
            <span class="ce-glow" aria-hidden="true"></span>
            <div class="ce-eyebrow">${lookup('cart.empty.eyebrow')}</div>
            <h4 class="ce-title">${lookup('cart.empty.h')}</h4>
            <p class="ce-sub">${lookup('cart.empty.p')}</p>
            <a href="shop.html" class="cart-empty-cta"><span>${lookup('cart.empty.cta')}</span><span class="ce-arrow" aria-hidden="true"></span></a>
            ${_sugg ? `<div class="ce-suggest"><div class="ce-suggest-h">${lookup('cart.empty.suggest')}</div><div class="ce-grid">${_sugg}</div></div>` : ''}
          </div>
        `;
      } else {
        itemsWrap.innerHTML = _lines.map(l => {
          const p = localizedProduct(l.slug);
          const linePrice = (l.total != null) ? formatPrice(l.total) : formatPrice(p.price * l.qty);
          const sizeLbl = (PRODUCTS[l.slug] && l.size) ? sizeLabel(l.slug, l.size) : '';
          const subline = sizeLbl || p.edition;
          return `
            <div class="cart-line" data-slug="${l.slug}" data-size="${l.size || ''}">
              <a class="thumb" href="${p.url}"><img class="mini-photo ${p.hue}" src="${p.image}" alt="${p.name}"></a>
              <div class="meta">
                <a class="name" href="${p.url}" style="text-decoration:none;color:inherit;">${p.name}</a>
                <div class="edition">${subline}</div>
                <div class="qty">
                  <button data-act="dec" aria-label="−">&minus;</button>
                  <span class="val">${l.qty}</span>
                  <button data-act="inc" aria-label="+">+</button>
                </div>
              </div>
              <div class="price-col">
                <div class="price">${linePrice}</div>
                <button class="remove" data-act="remove">${lookup('cart.remove')}</button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Totals, from Commerce subtotal when available
    const total = document.getElementById('cartTotal');
    const offer = _snap ? 0 : cart.offerDiscount();
    const sub = _snap ? (+_snap.cost.subtotalAmount.amount) : cart.total();
    const L = { offer: { nl: 'Aanbieding', el: 'Προσφορά', en: 'Offer' }, totalW: { nl: 'Totaal', el: 'Σύνολο', en: 'Total' } };
    const lw = function (o) { return o[currentLang] || o.en; };
    // Basket offer line (3 honeys, or 2 honeys + 1 olive oil → −€5).
    // The drawer is inline static HTML on most pages, so create the row if absent.
    let offerRow = document.getElementById('cartOffer');
    if (!offerRow) {
      const totalsEl = document.querySelector('.cart-foot .cart-totals');
      if (totalsEl && totalsEl.parentNode) {
        offerRow = document.createElement('div');
        offerRow.className = 'cart-offer';
        offerRow.id = 'cartOffer';
        offerRow.hidden = true;
        offerRow.innerHTML = '<span class="cart-offer-label"></span><span class="cart-offer-val"></span>';
        totalsEl.parentNode.insertBefore(offerRow, totalsEl);
      }
    }
    if (offerRow) {
      if (offer > 0) {
        offerRow.hidden = false;
        const lbl = offerRow.querySelector('.cart-offer-label');
        const val = offerRow.querySelector('.cart-offer-val');
        if (lbl) lbl.textContent = lw(L.offer);
        if (val) val.textContent = '−' + formatPrice(offer);
      } else {
        offerRow.hidden = true;
      }
    }
    // When the offer applies, the headline becomes the (discounted) Total.
    const subLabel = document.querySelector('.cart-foot .cart-totals .label');
    if (subLabel) {
      if (offer > 0) { subLabel.textContent = lw(L.totalW); subLabel.removeAttribute('data-i18n'); }
      else if (!subLabel.getAttribute('data-i18n')) { subLabel.setAttribute('data-i18n', 'cart.subtotal'); subLabel.textContent = lookup('cart.subtotal'); }
    }
    if (total) total.textContent = formatPrice(Math.max(0, sub - offer));

    // Checkout button → Commerce checkoutUrl (SEAM: becomes Shopify checkout when live)
    if (_snap && _snap.checkoutUrl) { const _co = document.querySelector('.cart-checkout'); if (_co) _co.setAttribute('href', _snap.checkoutUrl); }

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
  window.HD_renderCart = render;

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
          <span class="thumb-mini"><img class="mini-photo ${p.hue}" src="${p.image}" alt="${p.name}"></span>
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
        const size = line.dataset.size || null;
        const act = btn.dataset.act;
        const find = () => cart.items.find(i => i.slug === slug && (size == null || sizeOf(i) === size));
        if (act === 'inc') {
          const it = find();
          if (it) cart.setQty(slug, it.qty + 1, it.size);
        } else if (act === 'dec') {
          const it = find();
          if (it) cart.setQty(slug, it.qty - 1, it.size);
        } else if (act === 'remove') {
          cart.remove(slug, size);
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
      const size = addBtn.dataset.size || undefined;
      if (!PRODUCTS[slug]) return;
      cart.add(slug, qty, size);
      const p = localizedProduct(slug);
      toast(lookup('cart.added') + ', ' + p.name);
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

/* =================================================================
   COOKIE CONSENT BAR
   Persists choice in localStorage as hd-cookie-consent-v1
   Auto-injects on every page that loads shared.js.
   Re-openable via any element with [data-open-cookie-prefs].
   Dispatches 'hd:cookie-consent' CustomEvent when consent changes.
   ================================================================= */
(function () {
  'use strict';
  const STORAGE_KEY = 'hd-cookie-consent-v1';
  const VERSION = 1;

  function loadConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === VERSION) return parsed;
    } catch (e) {}
    return null;
  }

  function saveConsent(state) {
    const payload = {
      version: VERSION,
      timestamp: new Date().toISOString(),
      necessary: true,
      analytics: !!state.analytics,
      marketing: !!state.marketing
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) {}
    window.dispatchEvent(new CustomEvent('hd:cookie-consent', { detail: payload }));
    return payload;
  }

  // Public API
  window.HD_cookies = {
    get: loadConsent,
    has: function () { return loadConsent() !== null; },
    open: function () { renderBar(true); },
    revoke: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      renderBar(false);
    }
  };

  function svgGlyph() {
    return '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">'
      + '<circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1"/>'
      + '<circle cx="5" cy="6" r="0.7" fill="currentColor"/>'
      + '<circle cx="9" cy="5.5" r="0.6" fill="currentColor"/>'
      + '<circle cx="7.5" cy="9" r="0.7" fill="currentColor"/>'
      + '</svg>';
  }

  function renderBar(forceExpanded) {
    let bar = document.getElementById('cookieBar');
    if (bar) bar.remove();

    const existing = loadConsent();
    bar = document.createElement('div');
    bar.id = 'cookieBar';
    bar.className = 'cookie-bar' + (forceExpanded ? ' expanded' : '');
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookievoorkeuren');
    bar.setAttribute('aria-live', 'polite');
    bar.innerHTML = ''
      + '<div class="cb-eyebrow">' + svgGlyph() + ' Cookies &middot; Privacy</div>'
      + '<h3>A quiet word about cookies.</h3>'
      + '<p>We gebruiken alleen strikt noodzakelijke cookies om de winkel te laten werken. '
      + 'Voor analyse en marketing vragen we eerst om je toestemming. '
      + 'Meer info in onze <a href="legal-cookies.html">cookieverklaring</a> en '
      + '<a href="legal-privacy.html">privacyverklaring</a>.</p>'

      + '<div class="cb-prefs" id="cbPrefs">'
        + '<div class="cb-row">'
          + '<span class="cb-row-title">Strikt noodzakelijk</span>'
          + '<label class="cb-toggle" aria-label="Strikt noodzakelijke cookies (altijd actief)">'
            + '<input type="checkbox" checked disabled data-cb-tier="necessary">'
            + '<span class="track"><span class="knob"></span></span>'
          + '</label>'
          + '<span class="cb-row-desc">Sessie, taalvoorkeur, winkelmandje, beveiliging. Zonder deze werkt de site niet. Geen toestemming nodig.</span>'
        + '</div>'
        + '<div class="cb-row">'
          + '<span class="cb-row-title">Analyse</span>'
          + '<label class="cb-toggle" aria-label="Analytische cookies">'
            + '<input type="checkbox" id="cbAnalytics" data-cb-tier="analytics"'
              + (existing && existing.analytics ? ' checked' : '') + '>'
            + '<span class="track"><span class="knob"></span></span>'
          + '</label>'
          + '<span class="cb-row-desc">Anonieme statistieken (bezoekersaantallen, populaire pagina&rsquo;s) om de winkel te verbeteren. Wordt pas geladen na jouw toestemming.</span>'
        + '</div>'
        + '<div class="cb-row">'
          + '<span class="cb-row-title">Marketing</span>'
          + '<label class="cb-toggle" aria-label="Marketingcookies">'
            + '<input type="checkbox" id="cbMarketing" data-cb-tier="marketing"'
              + (existing && existing.marketing ? ' checked' : '') + '>'
            + '<span class="track"><span class="knob"></span></span>'
          + '</label>'
          + '<span class="cb-row-desc">Cookies van derden voor advertenties en gepersonaliseerde inhoud op andere platforms. Uitsluitend met jouw toestemming.</span>'
        + '</div>'
      + '</div>'

      + '<div class="cb-actions">'
        + '<button type="button" class="cb-btn cb-reject" data-cb-action="reject">Alleen noodzakelijk</button>'
        + '<button type="button" class="cb-btn cb-customize" data-cb-action="customize" aria-expanded="' + (forceExpanded ? 'true' : 'false') + '">Voorkeuren</button>'
        + '<button type="button" class="cb-btn cb-accept" data-cb-action="accept">Alle accepteren</button>'
      + '</div>';

    document.body.appendChild(bar);
    // Animate in
    requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.add('visible')));

    bar.addEventListener('click', e => {
      const t = e.target.closest('[data-cb-action]');
      if (!t) return;
      const a = t.dataset.cbAction;
      if (a === 'accept') {
        saveConsent({ analytics: true, marketing: true });
        dismiss(bar);
      } else if (a === 'reject') {
        saveConsent({ analytics: false, marketing: false });
        dismiss(bar);
      } else if (a === 'customize') {
        if (bar.classList.contains('expanded')) {
          // Save current toggle state then close
          const an = bar.querySelector('#cbAnalytics');
          const mk = bar.querySelector('#cbMarketing');
          saveConsent({ analytics: an && an.checked, marketing: mk && mk.checked });
          dismiss(bar);
        } else {
          bar.classList.add('expanded');
          t.setAttribute('aria-expanded', 'true');
          t.textContent = 'Voorkeuren opslaan';
        }
      }
    });
  }

  function dismiss(bar) {
    bar.classList.remove('visible');
    setTimeout(() => { if (bar && bar.parentNode) bar.parentNode.removeChild(bar); }, 600);
  }

  function bindReopen() {
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-open-cookie-prefs]');
      if (!t) return;
      e.preventDefault();
      renderBar(true);
    });
  }

  function start() {
    bindReopen();
    if (!loadConsent()) {
      // Slight delay so the page paints first
      setTimeout(() => renderBar(false), 600);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else { start(); }
})();

/* =================================================================
   FAQ accordion (global), attaches to any .faq-block .faq-row
   Reused on index.html, contact.html, and any future page.
   ================================================================= */
(function () {
  'use strict';
  function init() {
    document.querySelectorAll('.faq-block .faq-row').forEach(row => {
      const btn = row.querySelector('.faq-q');
      if (!btn || btn.dataset.faqBound) return;
      btn.dataset.faqBound = '1';
      btn.addEventListener('click', () => {
        const isOpen = row.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();

/* =================================================================
   E-COMMERCE UPGRADES, shared behaviours
   ================================================================= */

/* ---------- HARVEST CONCIERGE, luxury floating support (auto-inject) ---------- */
/* Replaces the generic WhatsApp bubble with a custom Mediterranean-concierge
   experience: gold glass FAB → cinematic dark chat panel → only THEN open WA. */
(function () {
  'use strict';
  const PHONE = '31000000000'; // TODO: replace with real business WhatsApp number (no + or spaces)
  const ACTIONS = [
    { key: 'product',   i18nKey: 'concierge.action.product',   msgKey: 'concierge.msg.product' },
    { key: 'retail',    i18nKey: 'concierge.action.retail',    msgKey: 'concierge.msg.retail' },
    { key: 'shipping',  i18nKey: 'concierge.action.shipping',  msgKey: 'concierge.msg.shipping' },
    { key: 'gift',      i18nKey: 'concierge.action.gift',      msgKey: 'concierge.msg.gift' },
    { key: 'concierge', i18nKey: 'concierge.action.concierge', msgKey: 'concierge.msg.concierge' }
  ];

  // Inline SVGs
  // Olive sprig, used as the brand avatar inside the chat panel header
  const SPRIG_SVG = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M12 21V8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M12 14C12 11 9 9 6 9.5C6.5 12.5 8.5 14.5 12 14Z" fill="currentColor" opacity="0.85"/>' +
    '<path d="M12 11C12 8.5 14.5 7 17 7.5C16.5 10 14.5 11.5 12 11Z" fill="currentColor" opacity="0.85"/>' +
    '<path d="M12 8C12 5.5 14 4 16 4.5C15.5 6.5 14 8 12 8Z" fill="currentColor" opacity="0.85"/></svg>';

  // Gold-coin medallion with embossed chat bubble, used as the floating button.
  // Built as a single inline SVG: radial gold gradient base, top-left gloss,
  // engraved rim, cream chat bubble with three dots. Crisp at any size, ~1.4 KB.
  const COIN_CHAT_SVG = (
    '<svg viewBox="0 0 80 80" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
        '<radialGradient id="hdCoinFace" cx="35%" cy="28%" r="78%">' +
          '<stop offset="0%"  stop-color="#FBE7B0"/>' +
          '<stop offset="38%" stop-color="#E1B871"/>' +
          '<stop offset="72%" stop-color="#B2853C"/>' +
          '<stop offset="100%" stop-color="#6E4B1B"/>' +
        '</radialGradient>' +
        '<linearGradient id="hdCoinRim" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%"   stop-color="#FFEFC2" stop-opacity="0.85"/>' +
          '<stop offset="55%"  stop-color="#C9963E" stop-opacity="0.55"/>' +
          '<stop offset="100%" stop-color="#3F2A0C" stop-opacity="0.85"/>' +
        '</linearGradient>' +
        '<radialGradient id="hdCoinGloss" cx="32%" cy="22%" r="34%">' +
          '<stop offset="0%"   stop-color="#FFF8E1" stop-opacity="0.70"/>' +
          '<stop offset="60%"  stop-color="#FFF8E1" stop-opacity="0.18"/>' +
          '<stop offset="100%" stop-color="#FFF8E1" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<radialGradient id="hdCoinDarken" cx="65%" cy="78%" r="48%">' +
          '<stop offset="0%"   stop-color="#3F2A0C" stop-opacity="0"/>' +
          '<stop offset="70%"  stop-color="#3F2A0C" stop-opacity="0.10"/>' +
          '<stop offset="100%" stop-color="#3F2A0C" stop-opacity="0.32"/>' +
        '</radialGradient>' +
      '</defs>' +
      // outer rim (slightly larger than the face, gives a beveled edge)
      '<circle cx="40" cy="40" r="39" fill="url(#hdCoinRim)"/>' +
      // coin face
      '<circle cx="40" cy="40" r="37" fill="url(#hdCoinFace)"/>' +
      // bottom-right darken (3D shading)
      '<circle cx="40" cy="40" r="37" fill="url(#hdCoinDarken)"/>' +
      // top-left gloss highlight
      '<circle cx="40" cy="40" r="37" fill="url(#hdCoinGloss)"/>' +
      // engraved inner groove
      '<circle cx="40" cy="40" r="33" fill="none" stroke="rgba(60,40,12,0.28)" stroke-width="0.6"/>' +
      '<circle cx="40" cy="40" r="33" fill="none" stroke="rgba(255,245,205,0.30)" stroke-width="0.6" transform="translate(0,-0.7)"/>' +
      // chat bubble shadow (engraved depth)
      '<g transform="translate(0.8,0.8)" opacity="0.55">' +
        '<path d="M28 32 h24 a4 4 0 0 1 4 4 v9 a4 4 0 0 1 -4 4 h-13 l-5 5 v-5 h-6 a4 4 0 0 1 -4 -4 v-9 a4 4 0 0 1 4 -4 z" fill="none" stroke="#3F2A0C" stroke-width="2.4" stroke-linejoin="round"/>' +
      '</g>' +
      // chat bubble (cream stroke)
      '<path d="M28 32 h24 a4 4 0 0 1 4 4 v9 a4 4 0 0 1 -4 4 h-13 l-5 5 v-5 h-6 a4 4 0 0 1 -4 -4 v-9 a4 4 0 0 1 4 -4 z" fill="none" stroke="#FBEFD0" stroke-width="2.2" stroke-linejoin="round"/>' +
      // three dots
      '<circle cx="34" cy="40.5" r="1.7" fill="#FBEFD0"/>' +
      '<circle cx="40" cy="40.5" r="1.7" fill="#FBEFD0"/>' +
      '<circle cx="46" cy="40.5" r="1.7" fill="#FBEFD0"/>' +
    '</svg>'
  );
  const ARROW_SVG = '<svg viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
    '<path d="M2 7H12M12 7L8 3M12 7L8 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CLOSE_SVG = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true">' +
    '<path d="M2 2L10 10M10 2L2 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  const LOCK_SVG = '<svg viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
    '<rect x="2.5" y="6" width="9" height="6" rx="1.2" stroke="currentColor" stroke-width="1.2"/>' +
    '<path d="M4.5 6V4.2C4.5 2.9 5.6 1.8 7 1.8C8.4 1.8 9.5 2.9 9.5 4.2V6" stroke="currentColor" stroke-width="1.2"/></svg>';

  function t(key, fallback) {
    try {
      if (window.HD_T && window.HD_lang) {
        const lang = window.HD_lang();
        const dict = window.HD_T[lang] || window.HD_T.en || {};
        return dict[key] || (window.HD_T.en && window.HD_T.en[key]) || fallback || key;
      }
    } catch (e) {}
    return fallback || key;
  }

  function openWhatsApp(msgKey) {
    const text = encodeURIComponent(t(msgKey, 'Hello Harvest Deli'));
    const url = 'https://wa.me/' + PHONE + '?text=' + text;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function buildFab() {
    const btn = document.createElement('button');
    btn.id = 'hdConciergeFab';
    btn.className = 'hd-concierge-fab';
    btn.type = 'button';
    btn.setAttribute('aria-label', t('concierge.title', 'Harvest Concierge'));
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    // Inline gold-coin medallion SVG, sharp at any size, ~1.4 KB.
    btn.innerHTML =
      '<span class="hd-fab-label" data-i18n="concierge.fab">Chat</span>' +
      '<span class="hd-fab-glyph" aria-hidden="true">' + COIN_CHAT_SVG + '</span>';
    return btn;
  }

  function buildPanel() {
    const root = document.createElement('div');
    root.id = 'hdConcierge';
    root.className = 'hd-concierge';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'false');
    root.setAttribute('aria-labelledby', 'hdConciergeTitle');
    root.setAttribute('aria-hidden', 'true');

    const chips = ACTIONS.map(function (a) {
      return '<button type="button" class="hd-concierge__chip" data-concierge-msg="' + a.msgKey + '">' +
        '<span class="hd-concierge__chip-label" data-i18n="' + a.i18nKey + '">' + a.key + '</span>' +
        '<span class="hd-concierge__chip-arrow">' + ARROW_SVG + '</span>' +
        '</button>';
    }).join('');

    root.innerHTML =
      '<div class="hd-concierge__scrim" data-concierge-dismiss></div>' +
      '<div class="hd-concierge__panel" role="document">' +
        '<div class="hd-concierge__header">' +
          '<span class="hd-concierge__avatar">' + SPRIG_SVG + '</span>' +
          '<div class="hd-concierge__id">' +
            '<h2 class="hd-concierge__title" id="hdConciergeTitle" data-i18n="concierge.title">Harvest Concierge</h2>' +
            '<p class="hd-concierge__sub" data-i18n="concierge.subtitle">Pelion, Greece</p>' +
            '<span class="hd-concierge__status">' +
              '<span class="hd-concierge__dot" aria-hidden="true"></span>' +
              '<span data-i18n="concierge.online">Real human · Replies within hours</span>' +
            '</span>' +
          '</div>' +
          '<button type="button" class="hd-concierge__close" data-concierge-dismiss aria-label="' +
            t('concierge.close', 'Close') + '">' + CLOSE_SVG + '</button>' +
        '</div>' +
        '<div class="hd-concierge__body">' +
          '<div class="hd-concierge__bubble" data-i18n="concierge.greeting">' +
            'Welcome to Harvest Deli.\nHow may we help you today?' +
          '</div>' +
          '<p class="hd-concierge__intro" data-i18n="concierge.intro">' +
            'Choose a topic below, we will continue the conversation on WhatsApp.' +
          '</p>' +
          '<div class="hd-concierge__actions" role="group" aria-label="' +
            t('concierge.title', 'Harvest Concierge') + '">' +
            chips +
          '</div>' +
        '</div>' +
        '<div class="hd-concierge__footer">' +
          LOCK_SVG +
          '<span data-i18n="concierge.privacy">Conversations open in WhatsApp. We never share your number.</span>' +
        '</div>' +
      '</div>';
    return root;
  }

  function init() {
    if (document.body.dataset.noFab === '1') return;
    if (document.getElementById('hdConciergeFab') || document.getElementById('hdConcierge')) return;

    const fab = buildFab();
    const panel = buildPanel();
    document.body.appendChild(fab);
    document.body.appendChild(panel);

    // Translate any newly injected i18n nodes
    try { if (window.HD_applyTranslations) window.HD_applyTranslations(); } catch (e) {}

    requestAnimationFrame(() => requestAnimationFrame(() => fab.classList.add('ready')));

    let lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      fab.setAttribute('aria-expanded', 'true');
      // Focus the first chip for keyboard users (after slide animation begins)
      setTimeout(() => {
        const first = panel.querySelector('.hd-concierge__chip');
        if (first) first.focus({ preventScroll: true });
      }, 220);
    }
    function close() {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      fab.setAttribute('aria-expanded', 'false');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
    }

    fab.addEventListener('click', function (e) {
      e.preventDefault();
      if (panel.classList.contains('open')) close(); else open();
    });

    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-concierge-dismiss]')) {
        close();
        return;
      }
      const chip = e.target.closest('[data-concierge-msg]');
      if (chip) {
        const msgKey = chip.dataset.conciergeMsg;
        // Brief tactile feedback before WhatsApp opens
        chip.style.transition = 'transform 160ms cubic-bezier(0.22,1,0.36,1), background 160ms ease';
        chip.style.transform = 'scale(0.97)';
        setTimeout(() => {
          chip.style.transform = '';
          openWhatsApp(msgKey);
          close();
        }, 140);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) close();
    });

    // Re-translate dynamic strings when language changes
    document.addEventListener('click', function (e) {
      if (e.target.closest('.lang-toggle button[data-lang]')) {
        setTimeout(() => {
          try { if (window.HD_applyTranslations) window.HD_applyTranslations(); } catch (err) {}
          const closeBtn = panel.querySelector('.hd-concierge__close');
          if (closeBtn) closeBtn.setAttribute('aria-label', t('concierge.close', 'Close'));
          fab.setAttribute('aria-label', t('concierge.title', 'Harvest Concierge'));
        }, 40);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ---------- Skip-to-content link (auto-inject, keyboard a11y) ---------- */
(function () {
  'use strict';
  function init() {
    if (document.querySelector('.skip-link')) return;
    // Find a usable jump target, prefer <main>, fall back to first <section>
    let target = document.querySelector('main');
    if (!target) target = document.querySelector('main, [role="main"], article, section');
    if (!target) return;
    if (!target.id) target.id = 'content';
    const a = document.createElement('a');
    a.className = 'skip-link';
    a.href = '#' + target.id;
    a.textContent = 'Skip to content';
    a.dataset.i18n = 'a11y.skipLink';
    document.body.insertBefore(a, document.body.firstChild);
    // Re-run i18n if available so NL/EL pick up
    try { if (typeof window.HD_applyTranslations === 'function') window.HD_applyTranslations(); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ---------- Footer newsletter (auto-inject above footer-bottom, all pages) ---------- */
(function () {
  'use strict';
  function init() {
    document.querySelectorAll('footer').forEach(function (ftr) {
      var bottom = ftr.querySelector('.footer-bottom');
      if (!bottom || ftr.querySelector('.footer-news')) return;
      var news = document.createElement('div');
      news.className = 'footer-news';
      news.innerHTML =
        '<div class="footer-news__copy">' +
          '<div class="footer-news__eyebrow" data-i18n="footer.news.eyebrow">The Harvest Letter</div>' +
          '<p class="footer-news__lead" data-i18n="footer.news.lead">Occasional notes from the mountain: new harvests, quiet stories, nothing more.</p>' +
        '</div>' +
        '<form class="footer-news__form" novalidate>' +
          '<div class="footer-news__field">' +
            '<input type="email" required autocomplete="email" class="footer-news__input" aria-label="Email" ' +
              'placeholder="Your email" data-i18n-attr="placeholder:footer.news.placeholder">' +
            '<button type="submit" class="footer-news__btn"><span data-i18n="footer.news.cta">Subscribe</span></button>' +
          '</div>' +
          '<p class="footer-news__ok" role="status" data-i18n="footer.news.ok" hidden>Thank you. A quiet welcome to the table.</p>' +
        '</form>';
      ftr.insertBefore(news, bottom);
      var form = news.querySelector('form');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('.footer-news__input');
        if (!input.value || !input.checkValidity()) { input.focus(); return; }
        // SEAM: POST email to ESP (Mailchimp/Klaviyo/Resend). Demo: local confirm only.
        news.querySelector('.footer-news__field').style.display = 'none';
        var ok = news.querySelector('.footer-news__ok'); ok.hidden = false;
      });
    });
    try { if (typeof window.HD_applyTranslations === 'function') window.HD_applyTranslations(); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ---------- Honeypot anti-spam (auto-inject on every form) ---------- */
(function () {
  'use strict';
  function inject(form) {
    if (form.dataset.hpBound) return;
    form.dataset.hpBound = '1';
    const wrap = document.createElement('div');
    wrap.className = 'hp-field';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '<label>Leave this field empty</label>' +
      '<input type="text" name="website_url" tabindex="-1" autocomplete="off">';
    form.appendChild(wrap);
    form.addEventListener('submit', e => {
      const hp = form.querySelector('input[name="website_url"]');
      if (hp && hp.value) {
        // Bot detected, silently swallow
        e.preventDefault();
        e.stopImmediatePropagation();
        console.warn('[hd] form submission blocked by honeypot');
      }
    }, true);
  }
  function init() {
    document.querySelectorAll('form').forEach(inject);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ---------- Free-shipping progress bar in cart drawer ---------- */
(function () {
  'use strict';
  const THRESHOLD_NL = 90;
  const THRESHOLD_EU = 120;
  function getCartTotal() {
    // Reuse total from #cartTotal which shared.js render() sets to "€NN"
    const el = document.getElementById('cartTotal');
    if (!el) return 0;
    const m = el.textContent.replace(/[^\d.,]/g, '').replace(',', '.');
    return parseFloat(m) || 0;
  }
  function ensureBar() {
    const foot = document.querySelector('.cart-foot');
    if (!foot) return null;
    let bar = document.getElementById('cartProgress');
    if (bar) return bar;
    bar = document.createElement('div');
    bar.className = 'cart-progress';
    bar.id = 'cartProgress';
    bar.innerHTML =
      '<div class="label"><span>Free shipping</span><span class="remaining" id="cartRemaining"></span></div>' +
      '<div class="track"><div class="fill" id="cartFill"></div></div>';
    foot.parentNode.insertBefore(bar, foot);
    return bar;
  }
  function update() {
    const bar = ensureBar();
    if (!bar) return;
    const total = getCartTotal();
    const threshold = THRESHOLD_NL; // default Netherlands; can be smarter with country detection
    const pct = Math.min(100, (total / threshold) * 100);
    const fill = document.getElementById('cartFill');
    const rem = document.getElementById('cartRemaining');
    if (fill) fill.style.width = pct.toFixed(1) + '%';
    if (rem) {
      if (total >= threshold) {
        rem.textContent = 'Unlocked';
        rem.classList.add('unlocked');
      } else {
        rem.textContent = '€' + (threshold - total).toFixed(2).replace('.', ',') + ' to go';
        rem.classList.remove('unlocked');
      }
    }
  }
  function init() {
    update();
    // Re-run on storage events (cart changes from other tabs)
    window.addEventListener('storage', e => { if (e.key === 'hd-cart') setTimeout(update, 60); });
    // Patch cart render: re-run after any DOM mutation under #cartItems
    const items = document.getElementById('cartItems');
    if (items && 'MutationObserver' in window) {
      const mo = new MutationObserver(() => setTimeout(update, 40));
      mo.observe(items, { childList: true, subtree: true });
    }
    // Also re-run when total changes
    const totalEl = document.getElementById('cartTotal');
    if (totalEl && 'MutationObserver' in window) {
      const mo2 = new MutationObserver(() => update());
      mo2.observe(totalEl, { childList: true, characterData: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ---------- Wishlist (localStorage) ---------- */
(function () {
  'use strict';
  const KEY = 'hd-wishlist-v1';
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }
  function save(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) {}
    window.dispatchEvent(new CustomEvent('hd:wishlist-change', { detail: arr }));
  }
  function toggle(slug) {
    const arr = load();
    const i = arr.indexOf(slug);
    if (i >= 0) arr.splice(i, 1); else arr.push(slug);
    save(arr);
    return arr.indexOf(slug) >= 0;
  }
  window.HD_wishlist = { has: s => load().indexOf(s) >= 0, all: load, toggle: toggle };

  const HEART_SVG =
    '<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M11 20.2C11 20.2 1.8 14 1.8 8C1.8 4.7 4.4 2.2 7.5 2.2C9.1 2.2 10.5 3 11 4.3C11.5 3 12.9 2.2 14.5 2.2C17.6 2.2 20.2 4.7 20.2 8C20.2 14 11 20.2 11 20.2Z"/></svg>';

  // Inject the heart into any .wishlist-btn that is still empty. Safe to
  // call repeatedly; shop/filters re-render their grids and fire
  // 'hd:wishlist-change', so this runs again and fills the fresh buttons.
  function ensureIcons() {
    document.querySelectorAll('.wishlist-btn, .product-wishlist-line').forEach(btn => {
      if (!btn.querySelector('svg')) btn.insertAdjacentHTML('afterbegin', HEART_SVG);
    });
  }

  function render() {
    ensureIcons();
    const cur = load();
    document.querySelectorAll('[data-wishlist-toggle]').forEach(btn => {
      const slug = btn.dataset.wishlistToggle;
      const on = cur.indexOf(slug) >= 0;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', on ? 'Remove from wishlist' : 'Add to wishlist');
    });
    const count = document.querySelectorAll('.wishlist-count');
    count.forEach(el => {
      el.textContent = cur.length ? '(' + cur.length + ')' : '';
      el.classList.toggle('visible', cur.length > 0);
    });
  }

  function init() {
    ensureIcons(); // render() also injects, but cover the static-page case up front
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-wishlist-toggle]');
      if (!btn) return;
      e.preventDefault();
      toggle(btn.dataset.wishlistToggle);
      render();
    });
    window.addEventListener('hd:wishlist-change', render);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ---------- Recently viewed products ---------- */
(function () {
  'use strict';
  const KEY = 'hd-recent-v1';
  const MAX = 4;
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }
  function save(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) {}
  }
  // Public API
  window.HD_recent = {
    add: function (slug) {
      let arr = load().filter(s => s !== slug);
      arr.unshift(slug);
      if (arr.length > MAX + 2) arr = arr.slice(0, MAX + 2);
      save(arr);
    },
    list: function (excludeSlug) {
      return load().filter(s => s !== excludeSlug).slice(0, MAX);
    }
  };
  // Auto-track on product page (uses meta tag)
  function init() {
    const meta = document.querySelector('meta[name="hd-product-slug"]');
    if (meta && meta.content) window.HD_recent.add(meta.content);
    renderStrip();
  }
  function renderStrip() {
    const wrap = document.getElementById('recentGrid');
    if (!wrap || !window.HD_product) return;
    const current = (document.querySelector('meta[name="hd-product-slug"]') || {}).content || '';
    const slugs = window.HD_recent.list(current);
    if (!slugs.length) {
      const section = document.querySelector('.recent-section');
      if (section) section.setAttribute('hidden', '');
      return;
    }
    wrap.innerHTML = slugs.map(s => {
      const p = window.HD_product(s);
      if (!p) return '';
      return '<a href="' + p.url + '" class="recent-card">' +
        '<div class="frame"><img src="' + p.image + '" alt="' + p.name + '"></div>' +
        '<div class="name">' + p.name + '</div>' +
        '<div class="region">' + p.region + '</div>' +
        '</a>';
    }).join('');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ---------- "You may also like" renderer (product page) ---------- */
(function () {
  'use strict';
  function init() {
    const wrap = document.getElementById('alsoGrid');
    if (!wrap || !window.HD_product) return;
    const meta = document.querySelector('meta[name="hd-product-slug"]');
    const current = meta ? meta.content : '';
    const all = ['arbutus','oak','fir-vanilla','orange-blossom','acacia','thyme','chestnut','pine','heather','olive-oil','mountain-tea'];
    const others = all.filter(s => s !== current).slice(0, 3);
    wrap.innerHTML = others.map(s => {
      const p = window.HD_product(s);
      if (!p) return '';
      return '<a href="' + p.url + '" class="also-card">' +
        '<div class="frame"><img src="' + p.image + '" alt="' + p.name + '" loading="lazy"></div>' +
        '<div><span class="name">' + p.name + '</span><span class="price">€' + p.price + '</span></div>' +
        '<div class="region">' + p.region + '</div>' +
        '</a>';
    }).join('');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ---------- Variant selector (product page) ---------- */
(function () {
  'use strict';
  function init() {
    const radios = document.querySelectorAll('input[name="hd-variant"]');
    if (!radios.length) return;
    const priceEl = document.getElementById('productPrice');
    const skuEl = document.getElementById('productSku');
    function syncSize(r) {
      // Keep the add-to-cart buttons pointed at the selected size (480g/950g)
      if (!r.dataset.size) return;
      document.querySelectorAll('[data-add-to-cart]').forEach(b => { b.dataset.size = r.dataset.size; });
    }
    radios.forEach(r => {
      r.addEventListener('change', () => {
        if (!r.checked) return;
        const newPrice = r.dataset.price;
        const newSku = r.dataset.sku;
        if (priceEl && newPrice) priceEl.textContent = '€' + newPrice;
        if (skuEl && newSku) skuEl.textContent = newSku;
        syncSize(r);
      });
    });
    const checked = document.querySelector('input[name="hd-variant"]:checked');
    if (checked) syncSize(checked);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ---------- Search modal ---------- */
(function () {
  'use strict';
  let overlay, input, list, results, focusIdx = -1;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    overlay.id = 'searchOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Search the collection');
    overlay.innerHTML =
      '<button class="close" type="button" id="searchClose"><span>Close</span><span class="x"></span></button>' +
      '<div class="search-input-wrap">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
        '<input id="searchInput" type="search" placeholder="Search the collection" autocomplete="off" spellcheck="false" aria-controls="searchResults">' +
      '</div>' +
      '<div class="search-results" id="searchResults" role="listbox"></div>';
    document.body.appendChild(overlay);
    input = overlay.querySelector('#searchInput');
    list = overlay.querySelector('#searchResults');
    overlay.querySelector('#searchClose').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    input.addEventListener('input', render);
    input.addEventListener('keydown', onKey);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
      if (e.key === '/' && !overlay.classList.contains('open') &&
          !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) {
        e.preventDefault(); open();
      }
    });
  }

  function open() {
    if (!overlay) build();
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    input.value = '';
    render();
    setTimeout(() => input.focus(), 100);
  }
  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    focusIdx = -1;
  }
  window.HD_search = { open, close };

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function render() {
    if (!window.HD_product) return;
    const q = (input.value || '').toLowerCase().trim();
    const slugs = ['arbutus','oak','fir-vanilla','orange-blossom','acacia','thyme','chestnut','pine','heather','olive-oil','mountain-tea'];
    const matches = slugs.map(s => window.HD_product(s)).filter(p => {
      if (!p) return false;
      if (!q) return true;
      const hay = (p.name + ' ' + p.region + ' ' + (p.notes || '') + ' ' + (p.altitude || '') + ' ' + (p.edition || '')).toLowerCase();
      return hay.includes(q);
    });
    if (matches.length === 0) {
      list.innerHTML = '<div class="search-empty">No match for &ldquo;' + escapeHtml(q) + '&rdquo;. Try <a href="shop.html">view all editions</a>.</div>';
      return;
    }
    list.innerHTML = matches.map((p, i) =>
      '<a class="search-result" data-idx="' + i + '" href="' + p.url + '" role="option">' +
        '<div class="thumb"><img src="' + p.image + '" alt=""></div>' +
        '<div><div class="name">' + escapeHtml(p.name) + '</div><div class="region">' + escapeHtml(p.region) + ' &middot; ' + escapeHtml(p.altitude || '') + '</div></div>' +
        '<div class="price">€' + p.price + '</div>' +
      '</a>'
    ).join('');
  }

  function onKey(e) {
    const items = list.querySelectorAll('.search-result');
    if (e.key === 'ArrowDown') {
      e.preventDefault(); focusIdx = Math.min(items.length - 1, focusIdx + 1); applyFocus(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); focusIdx = Math.max(0, focusIdx - 1); applyFocus(items);
    } else if (e.key === 'Enter' && focusIdx >= 0) {
      e.preventDefault(); items[focusIdx].click();
    }
  }
  function applyFocus(items) {
    items.forEach((it, i) => it.classList.toggle('focused', i === focusIdx));
    if (items[focusIdx]) items[focusIdx].scrollIntoView({ block: 'nearest' });
  }

  function init() {
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-open-search]');
      if (!t) return;
      e.preventDefault(); open();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* =================================================================
   NAV STABILITY, Cart + Wishlist auto-injectors
   Every page gets the SAME nav layout: [...] [Heart] [Cart]
   Pages that ship without a .nav-cart get one injected so the
   wishlist heart anchors to a consistent position on every page.
   ================================================================= */
(function () {
  'use strict';
  const HEART_SVG = '<svg viewBox="0 0 22 22" aria-hidden="true"><path d="M11 20.2C11 20.2 1.8 14 1.8 8C1.8 4.7 4.4 2.2 7.5 2.2C9.1 2.2 10.5 3 11 4.3C11.5 3 12.9 2.2 14.5 2.2C17.6 2.2 20.2 4.7 20.2 8C20.2 14 11 20.2 11 20.2Z"/></svg>';
  const CART_SVG = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
    '<path d="M2.2 4 L11.8 4 L10.8 12 L3.2 12 Z" stroke="currentColor" stroke-width="0.9" fill="none"/>' +
    '<path d="M5 4 V3.2 A2 2 0 0 1 9 3.2 V4" stroke="currentColor" stroke-width="0.9" fill="none"/></svg>';

  function ensureDrawer() {
    if (document.getElementById('cartDrawer')) return;
    const wrap = document.createElement('div');
    wrap.className = 'cart-drawer';
    wrap.id = 'cartDrawer';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML =
      '<div class="cart-backdrop"></div>' +
      '<aside class="cart-panel">' +
        '<header class="cart-head">' +
          '<span class="cart-title" data-i18n-html="cart.title_html">Your <em>Cellar</em></span>' +
          '<button class="cart-close" aria-label="Close"><span data-i18n="cart.close">Close</span> <span class="x"></span></button>' +
        '</header>' +
        '<div class="cart-items" id="cartItems"></div>' +
        '<footer class="cart-foot">' +
          '<div class="cart-offer" id="cartOffer" hidden>' +
            '<span class="cart-offer-label"></span>' +
            '<span class="cart-offer-val"></span>' +
          '</div>' +
          '<div class="cart-totals">' +
            '<span class="label" data-i18n="cart.subtotal">Subtotal</span>' +
            '<span class="total" id="cartTotal">€0</span>' +
          '</div>' +
          '<p class="cart-note" data-i18n="cart.note">Shipping calculated at checkout. Complimentary across the EU above €120.</p>' +
          '<a href="checkout.html" class="cart-checkout"><span data-i18n="cart.checkout">Continue to checkout</span> <span class="arrow"></span></a>' +
        '</footer>' +
      '</aside>';
    document.body.appendChild(wrap);
    // Wire close affordances (the shared.js cart-drawer init already ran;
    // bind these manually for the freshly injected nodes).
    const closeFn = function () {
      wrap.classList.remove('open');
      wrap.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    wrap.querySelector('.cart-backdrop').addEventListener('click', closeFn);
    wrap.querySelector('.cart-close').addEventListener('click', closeFn);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && wrap.classList.contains('open')) closeFn();
    });
  }

  function ensureCart(navRight) {
    let cart = navRight.querySelector('.nav-cart');
    if (cart) return cart;
    // Page didn't ship with a cart button, inject one so the heart
    // can always anchor to it. Identical markup to the hand-authored ones.
    cart = document.createElement('button');
    cart.className = 'nav-cart';
    cart.id = navRight.querySelector('#navCart') ? '' : 'navCart';
    cart.type = 'button';
    cart.setAttribute('aria-label', 'Open cart');
    cart.innerHTML =
      '<span class="cart-glyph">' + CART_SVG + '</span>' +
      '<span data-i18n="nav.cellar">Cellar</span>' +
      '<span class="cart-count">0</span>';
    navRight.appendChild(cart);
    // Wire the click to openCart (the cart-drawer init also auto-binds
    // .nav-cart click → openCart, but it ran already, so bind here too).
    cart.addEventListener('click', function (e) {
      e.preventDefault();
      if (typeof window.HD_openCart === 'function') window.HD_openCart();
    });
    // Sync count for users returning with items already in cart from another page
    try {
      if (window.HD_CART && typeof window.HD_CART.count === 'function') {
        const n = window.HD_CART.count();
        cart.querySelector('.cart-count').textContent = n;
        cart.classList.toggle('has-items', n > 0);
      }
    } catch (e) {}
    return cart;
  }

  function injectAll() {
    // 0. Make sure the cart drawer DOM exists so the cart button actually
    //    opens something on legal / wishlist / track-order pages.
    ensureDrawer();
    document.querySelectorAll('nav.site-nav .nav-right').forEach(navRight => {
      // 1. Make sure the cart button exists, every page should have it.
      const cart = ensureCart(navRight);

      // 2. Inject the wishlist heart immediately BEFORE the cart.
      if (!navRight.querySelector('.nav-wishlist')) {
        const a = document.createElement('a');
        a.className = 'nav-wishlist';
        a.href = 'wishlist.html';
        const lang = (window.HD_lang && window.HD_lang()) || 'en';
        const label = (window.HD_T && window.HD_T[lang] && window.HD_T[lang]['nav.wishlist']) || 'Wishlist';
        a.setAttribute('aria-label', label);
        a.dataset.i18nAttr = 'aria-label:nav.wishlist';
        a.innerHTML = HEART_SVG + '<span class="nav-wl-badge" aria-live="polite">0</span>';
        navRight.insertBefore(a, cart);
      }
    });
    // Translate any freshly injected data-i18n nodes (e.g. "Cellar" label)
    try { if (window.HD_applyTranslations) window.HD_applyTranslations(); } catch (e) {}
    // Re-render the cart so the auto-injected drawer reflects current items
    try { if (window.HD_renderCart) window.HD_renderCart(); } catch (e) {}
    syncBadge();
  }

  function syncBadge() {
    const slugs = (window.HD_wishlist && window.HD_wishlist.all()) || [];
    document.querySelectorAll('.nav-wishlist').forEach(a => {
      a.classList.toggle('has-items', slugs.length > 0);
      const b = a.querySelector('.nav-wl-badge');
      if (b) b.textContent = slugs.length;
    });
  }

  window.addEventListener('hd:wishlist-change', syncBadge);
  // Re-apply when lang switches (so aria-label updates via HD_applyTranslations)
  document.addEventListener('click', e => {
    if (e.target.closest('.lang-toggle button[data-lang]')) {
      setTimeout(() => { if (window.HD_applyTranslations) window.HD_applyTranslations(); }, 40);
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectAll);
  else injectAll();
})();

/* =================================================================
   MENU OVERLAY background image injector
   Adds .menu-bg-img + .menu-bg-scrim layers inside every .menu-overlay
   so the cinematic background is consistent across all pages.
   ================================================================= */
(function () {
  'use strict';
  function inject() {
    document.querySelectorAll('.menu-overlay').forEach(overlay => {
      if (overlay.querySelector('.menu-bg-img')) return;
      const img = document.createElement('div');
      img.className = 'menu-bg-img';
      img.setAttribute('aria-hidden', 'true');
      const scrim = document.createElement('div');
      scrim.className = 'menu-bg-scrim';
      scrim.setAttribute('aria-hidden', 'true');
      overlay.insertBefore(scrim, overlay.firstChild);
      overlay.insertBefore(img, overlay.firstChild);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();

/* =================================================================
   GLOBAL BUTTON SYSTEM, soft, rounded, premium
   Injected as <style> after existing inline styles so it wins
   the cascade on equal specificity (no !important needed).
   Replaces "black slide-up" hover with calm lift + amber shimmer.
   ================================================================= */
(function () {
  'use strict';
  const CSS = `
:root {
  --btn-radius: 999px;
  --btn-bg-primary: #1F1A14;
  --btn-bg-primary-hover: #2A211A;
  --btn-fg-primary: #FAF6EE;
  --btn-border-primary: rgba(212, 172, 106, 0.32);
  --btn-border-primary-hover: rgba(212, 172, 106, 0.62);
  --btn-bg-secondary: rgba(250, 246, 238, 0.5);
  --btn-bg-secondary-hover: #FAF6EE;
  --btn-fg-secondary: #1F1A14;
  --btn-border-secondary: rgba(184, 148, 90, 0.32);
  --btn-border-secondary-hover: rgba(184, 148, 90, 0.62);
  --btn-shadow:
    0 1px 0 rgba(255, 255, 255, 0.06) inset,
    0 -1px 0 rgba(0, 0, 0, 0.06) inset,
    0 14px 30px rgba(26, 22, 18, 0.16),
    0 2px 8px rgba(0, 0, 0, 0.06);
  --btn-shadow-hover:
    0 1px 0 rgba(255, 255, 255, 0.08) inset,
    0 -1px 0 rgba(0, 0, 0, 0.08) inset,
    0 22px 40px rgba(26, 22, 18, 0.22),
    0 4px 14px rgba(212, 172, 106, 0.22);
  --btn-shadow-soft:
    0 1px 0 rgba(255, 255, 255, 0.04) inset,
    0 8px 20px rgba(26, 22, 18, 0.08);
  --btn-shadow-soft-hover:
    0 1px 0 rgba(255, 255, 255, 0.06) inset,
    0 14px 28px rgba(26, 22, 18, 0.14),
    0 2px 8px rgba(212, 172, 106, 0.18);
  --btn-ease: cubic-bezier(0.32, 0.72, 0.24, 1);
  --btn-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}

/* --- Kill legacy "black slide-up" / fill pseudo-elements globally --- */
.cta::before, .pd-cta::before, .cta-primary::before, .cta-link::before,
.form-submit::before, .cart-checkout::before, .fp-apply::before,
.confirm-btn::before, .wl-add::before, .es-reset::before,
.final-cta::before, .track-cta::before, .preview-cta .explore-link::before,
.card-add::before, .cb-btn.cb-accept::before {
  display: none;
  content: none;
}

/* --- PRIMARY filled button, espresso ink + warm ivory text --- */
.cta, .pd-cta, .cta-primary, .cta-link, .about-cta .cta-link,
.form-submit, .cart-checkout, .fp-apply,
.confirm-btn, .track-cta, .wl-add, .es-reset, .empty-state .es-reset,
.final-cta, .preview-cta .explore-link, .preview-card .card-add,
.card-add, .product-cta,
.newsletter-form button[type="submit"],
.cb-btn.cb-accept {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  position: relative;
  background: var(--btn-bg-primary);
  color: var(--btn-fg-primary);
  border: 1px solid var(--btn-border-primary);
  border-radius: var(--btn-radius);
  padding: 18px 36px;
  padding-left: calc(36px + 0.18em);
  min-height: 52px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  overflow: hidden;
  isolation: isolate;
  box-shadow: var(--btn-shadow);
  transition:
    background 0.45s var(--btn-ease),
    color 0.45s var(--btn-ease),
    border-color 0.45s var(--btn-ease),
    box-shadow 0.45s var(--btn-ease),
    transform 0.45s var(--btn-ease);
  -webkit-tap-highlight-color: transparent;
}

/* Amber shimmer that softly sweeps across on hover */
.cta::after, .pd-cta::after, .cta-primary::after, .cta-link::after,
.form-submit::after, .cart-checkout::after, .fp-apply::after,
.confirm-btn::after, .wl-add::after, .es-reset::after,
.final-cta::after, .track-cta::after, .preview-cta .explore-link::after,
.preview-card .card-add::after, .card-add::after, .product-cta::after,
.newsletter-form button[type="submit"]::after,
.cb-btn.cb-accept::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgba(248, 215, 140, 0.22) 50%,
    transparent 70%
  );
  transform: translateX(-110%);
  pointer-events: none;
  border-radius: inherit;
  z-index: -1;
  transition: transform 0.75s var(--btn-ease-out);
}

/* Hover, calm lift + amber border glow + shimmer swipe */
.cta:hover, .pd-cta:hover, .cta-primary:hover, .cta-link:hover,
.about-cta .cta-link:hover, .form-submit:hover, .cart-checkout:hover,
.fp-apply:hover, .confirm-btn:hover, .track-cta:hover, .wl-add:hover,
.es-reset:hover, .empty-state .es-reset:hover, .final-cta:hover,
.preview-cta .explore-link:hover, .preview-card .card-add:hover,
.card-add:hover, .product-cta:hover,
.newsletter-form button[type="submit"]:hover,
.cb-btn.cb-accept:hover {
  background: var(--btn-bg-primary-hover);
  color: var(--btn-fg-primary);
  border-color: var(--btn-border-primary-hover);
  box-shadow: var(--btn-shadow-hover);
  transform: translateY(-1px) scale(1.008);
}
.cta:hover::after, .pd-cta:hover::after, .cta-primary:hover::after,
.cta-link:hover::after, .form-submit:hover::after, .cart-checkout:hover::after,
.fp-apply:hover::after, .confirm-btn:hover::after, .wl-add:hover::after,
.track-cta:hover::after, .preview-cta .explore-link:hover::after,
.preview-card .card-add:hover::after, .card-add:hover::after,
.product-cta:hover::after,
.newsletter-form button[type="submit"]:hover::after,
.cb-btn.cb-accept:hover::after {
  transform: translateX(110%);
}

/* Active, pressed */
.cta:active, .pd-cta:active, .cta-primary:active, .form-submit:active,
.cart-checkout:active, .fp-apply:active, .confirm-btn:active,
.track-cta:active, .wl-add:active, .es-reset:active,
.final-cta:active, .preview-card .card-add:active,
.card-add:active, .product-cta:active {
  transform: translateY(0) scale(0.992);
  transition-duration: 0.15s;
  box-shadow: var(--btn-shadow);
}

/* Focus visible, accessible warm gold ring */
.cta:focus-visible, .pd-cta:focus-visible, .cta-primary:focus-visible,
.cta-link:focus-visible, .form-submit:focus-visible,
.cart-checkout:focus-visible, .fp-apply:focus-visible,
.confirm-btn:focus-visible, .track-cta:focus-visible, .wl-add:focus-visible,
.es-reset:focus-visible, .final-cta:focus-visible,
.preview-card .card-add:focus-visible, .card-add:focus-visible,
.product-cta:focus-visible,
.newsletter-form button[type="submit"]:focus-visible,
.cb-btn.cb-accept:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(212, 172, 106, 0.42), var(--btn-shadow-hover);
}

/* Disabled */
.cta:disabled, .pd-cta:disabled, .cta-primary:disabled, .form-submit:disabled,
.fp-apply:disabled, .confirm-btn:disabled, .wl-add:disabled, .card-add:disabled,
.preview-card .card-add:disabled,
.newsletter-form button[type="submit"]:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  transform: none;
  box-shadow: var(--btn-shadow-soft);
}

/* --- SECONDARY ghost/outline button, warm transparent + dark text --- */
.cta-ghost, .fp-reset, .wl-view, .cb-btn.cb-reject, .cb-btn.cb-customize,
.empty-state .es-reset.secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  position: relative;
  background: var(--btn-bg-secondary);
  color: var(--btn-fg-secondary);
  border: 1px solid var(--btn-border-secondary);
  border-radius: var(--btn-radius);
  padding: 16px 28px;
  padding-left: calc(28px + 0.18em);
  min-height: 48px;
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  overflow: hidden;
  box-shadow: var(--btn-shadow-soft);
  transition:
    background 0.45s var(--btn-ease),
    color 0.45s var(--btn-ease),
    border-color 0.45s var(--btn-ease),
    box-shadow 0.45s var(--btn-ease),
    transform 0.45s var(--btn-ease);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.cta-ghost:hover, .fp-reset:hover, .wl-view:hover,
.cb-btn.cb-reject:hover, .cb-btn.cb-customize:hover {
  background: var(--btn-bg-secondary-hover);
  border-color: var(--btn-border-secondary-hover);
  color: var(--btn-fg-secondary);
  box-shadow: var(--btn-shadow-soft-hover);
  transform: translateY(-1px) scale(1.008);
}
.cta-ghost:active, .fp-reset:active, .wl-view:active,
.cb-btn.cb-reject:active, .cb-btn.cb-customize:active {
  transform: translateY(0) scale(0.994);
  transition-duration: 0.15s;
}
.cta-ghost:focus-visible, .fp-reset:focus-visible, .wl-view:focus-visible,
.cb-btn.cb-reject:focus-visible, .cb-btn.cb-customize:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(212, 172, 106, 0.38), var(--btn-shadow-soft-hover);
}

/* Ghost on dark surfaces (e.g. menu overlay) keeps the same shape but inverts colors */
.menu-close, .fp-close {
  border-radius: var(--btn-radius);
  padding: 12px 22px 12px 22px;
  padding-left: calc(22px + 0.36em);
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 16px;
  transition: background 0.4s var(--btn-ease), color 0.4s var(--btn-ease);
}
.menu-close:hover { background: rgba(245, 239, 228, 0.08); }
.fp-close:hover { background: rgba(26, 22, 18, 0.05); }

/* --- PILL nav controls (calm hover, no aggressive slide) --- */
.filter-trigger, .sort-trigger, .nav-acquire {
  transition:
    background 0.4s var(--btn-ease),
    color 0.4s var(--btn-ease),
    border-color 0.4s var(--btn-ease),
    box-shadow 0.4s var(--btn-ease),
    transform 0.4s var(--btn-ease);
}
.filter-trigger { box-shadow: var(--btn-shadow); }
.filter-trigger:hover { box-shadow: var(--btn-shadow-hover); transform: translateY(-1px); }
.sort-trigger:hover { box-shadow: var(--btn-shadow-soft-hover); transform: translateY(-1px); border-color: var(--btn-border-secondary-hover); }

/* Filter pill chips inside the panel */
.fp-chip span { transition: background 0.4s var(--btn-ease), color 0.4s var(--btn-ease), border-color 0.4s var(--btn-ease), transform 0.4s var(--btn-ease), padding-left 0.4s var(--btn-ease); }
.fp-chip:hover span { transform: translateY(-1px) scale(1.008); }
.fp-chip input:checked + span { box-shadow: var(--btn-shadow-soft); }

/* Active filter chips (above grid), soft press */
.ac-chip { transition: background 0.4s var(--btn-ease), transform 0.4s var(--btn-ease), opacity 0.4s var(--btn-ease), box-shadow 0.4s var(--btn-ease); }
.ac-chip:hover { transform: translateY(-1px); box-shadow: var(--btn-shadow-soft-hover); }

/* --- Plus / arrow micro-interactions inside buttons --- */
.card-add .add-icon, .wl-add svg, .preview-card .card-add .add-icon {
  transition: transform 0.5s var(--btn-ease);
}
.card-add:hover .add-icon, .wl-add:hover svg, .preview-card .card-add:hover .add-icon {
  transform: rotate(90deg);
}
.cta .arrow, .pd-cta .arrow, .cta-primary .arrow, .form-submit .arrow,
.cart-checkout .arrow, .fp-apply .arrow, .confirm-btn .arrow,
.wl-add .arrow, .final-cta .arrow, .product-cta .arrow,
.cta-ghost .arrow, .fp-reset .arrow, .preview-cta .explore-link .arrow,
.read-link .arrow {
  transition: width 0.5s var(--btn-ease);
}
.cta:hover .arrow, .pd-cta:hover .arrow, .cta-primary:hover .arrow,
.form-submit:hover .arrow, .cart-checkout:hover .arrow,
.fp-apply:hover .arrow, .confirm-btn:hover .arrow, .wl-add:hover .arrow,
.final-cta:hover .arrow, .product-cta:hover .arrow,
.cta-ghost:hover .arrow, .fp-reset:hover .arrow,
.preview-cta .explore-link:hover .arrow, .read-link:hover .arrow {
  width: 26px;
}

/* --- Cookie bar buttons, keep them consistent with the new shape --- */
.cookie-bar .cb-btn {
  border-radius: var(--btn-radius);
  padding: 12px 22px;
  padding-left: calc(22px + 0.36em);
  min-height: 44px;
  transition: background 0.4s var(--btn-ease), border-color 0.4s var(--btn-ease), color 0.4s var(--btn-ease), transform 0.4s var(--btn-ease);
}
.cookie-bar .cb-btn:hover { transform: translateY(-1px); }

/* --- Reduced motion --- */
@media (prefers-reduced-motion: reduce) {
  .cta, .pd-cta, .cta-primary, .cta-link, .form-submit, .cart-checkout,
  .fp-apply, .confirm-btn, .track-cta, .wl-add, .es-reset, .final-cta,
  .cta-ghost, .fp-reset, .wl-view, .preview-card .card-add, .product-cta,
  .card-add, .filter-trigger, .sort-trigger, .nav-acquire, .cookie-bar .cb-btn {
    transition: background 0.2s linear, border-color 0.2s linear, color 0.2s linear;
    transform: none !important;
  }
  .cta::after, .pd-cta::after, .cta-primary::after, .form-submit::after,
  .cart-checkout::after, .fp-apply::after, .confirm-btn::after, .wl-add::after,
  .card-add::after, .preview-card .card-add::after, .cb-btn.cb-accept::after {
    display: none;
  }
}

/* --- Mobile tweaks --- */
@media (max-width: 600px) {
  .cta, .pd-cta, .cta-primary, .form-submit, .cart-checkout, .fp-apply,
  .confirm-btn, .wl-add, .es-reset, .final-cta, .track-cta {
    padding: 16px 28px;
    padding-left: calc(28px + 0.18em);
    min-height: 48px;
  }
  .cta-ghost, .fp-reset, .wl-view {
    padding: 14px 22px;
    padding-left: calc(22px + 0.18em);
    min-height: 44px;
  }
}
  `;

  function inject() {
    if (document.getElementById('hd-btn-system')) return;
    const style = document.createElement('style');
    style.id = 'hd-btn-system';
    style.setAttribute('data-hd', 'button-system');
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();

/* =================================================================
   POLISH PASS, 17 no-account improvements (global JS)
   ================================================================= */
(function () {
  'use strict';

  /* 10. Page transition, gentle fade-out on internal navigation clicks (no flash on initial load) */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.hasAttribute('download')) return;
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
    } catch (err) { return; }
    document.body.style.transition = 'opacity 220ms ease-in';
    document.body.style.opacity = '0';
    setTimeout(() => { document.body.style.opacity = ''; document.body.style.transition = ''; }, 700);
  });

  /* 1. Smart sticky nav */
  (function smartNav() {
    let lastY = 0, ticking = false;
    function onScroll() {
      const nav = document.querySelector('nav.site-nav');
      if (!nav) { ticking = false; return; }
      const y = window.scrollY || window.pageYOffset;
      const delta = y - lastY;
      if (y < 80) { nav.classList.remove('nav-hidden'); }
      else if (delta > 8) { nav.classList.add('nav-hidden'); }
      else if (delta < -6) { nav.classList.remove('nav-hidden'); }
      lastY = y;
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
  })();

  /* 2. Active page indicator in menu overlay */
  function markCurrent() {
    const path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.menu-overlay .menu-items a').forEach(a => {
      const href = (a.getAttribute('href') || '').split('#')[0].split('/').pop().toLowerCase();
      const isHome = (href === 'index.html' && (path === '' || path === 'index.html'));
      if ((href && href === path) || isHome) {
        a.classList.add('current');
        const li = a.closest('li');
        if (li) li.classList.add('current-item');
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', markCurrent);
  else markCurrent();

  /* 3. Scroll progress bar (only on long content pages) */
  (function scrollProgress() {
    function init() {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      if (docH < 800) return; // short page, skip
      const bar = document.createElement('div');
      bar.className = 'hd-progress';
      bar.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bar);
      let ticking = false;
      function update() {
        const y = window.scrollY || window.pageYOffset;
        const h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, y / h)) + ')';
        ticking = false;
      }
      window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
      }, { passive: true });
      window.addEventListener('resize', () => requestAnimationFrame(update), { passive: true });
      update();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();

  /* 4. Scroll-to-top button */
  (function sttButton() {
    function init() {
      if (document.body.dataset.noFab === '1') return;
      if (document.getElementById('hdStt')) return;
      const btn = document.createElement('button');
      btn.id = 'hdStt';
      btn.className = 'hd-stt';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Back to top');
      btn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3 8L8 3L13 8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      document.body.appendChild(btn);
      let ticking = false;
      function update() {
        const y = window.scrollY || window.pageYOffset;
        btn.classList.toggle('ready', y > 600);
        ticking = false;
      }
      window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
      }, { passive: true });
      btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();

  /* 5. Rich add-to-cart toast (named product + view cart button) */
  /* 16. Sparkle moment (triggered with toast on first add) */
  (function richToast() {
    let toastTimer = null;
    let firstAddDone = false;
    try { firstAddDone = !!localStorage.getItem('hd-first-add-done'); } catch (e) {}

    function showSparkles(x, y) {
      for (let i = 0; i < 8; i++) {
        const sp = document.createElement('span');
        sp.className = 'hd-sparkle';
        sp.style.left = x + 'px';
        sp.style.top = y + 'px';
        const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.3;
        const dist = 30 + Math.random() * 36;
        sp.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        sp.style.setProperty('--dy', (Math.sin(angle) * dist - 20) + 'px');
        sp.style.animationDelay = (i * 30) + 'ms';
        document.body.appendChild(sp);
        setTimeout(() => sp.remove(), 1100);
      }
    }

    function openCartDrawer() {
      const d = document.querySelector('.cart-drawer');
      if (d) {
        d.classList.add('open');
        d.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    }

    function showRich(slug, ev) {
      if (!window.HD_product) return;
      const p = window.HD_product(slug);
      if (!p) return;
      let toast = document.getElementById('hdRichToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'hdRichToast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
      }
      toast.innerHTML =
        '<span class="check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6 L5 9 L10 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
        '<span class="toast-text">' +
          '<span class="toast-title">Added to your cellar</span>' +
          '<span class="toast-name">' + p.name + '</span>' +
        '</span>' +
        '<button type="button" class="toast-cta" data-toast-view>View cart</button>';
      requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
      toast.querySelector('[data-toast-view]').addEventListener('click', () => {
        toast.classList.remove('show');
        openCartDrawer();
      });
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);

      // Sparkle on first-ever add, triggered from click location
      if (!firstAddDone && ev) {
        const x = ev.clientX || ev.touches?.[0]?.clientX || window.innerWidth / 2;
        const y = ev.clientY || ev.touches?.[0]?.clientY || window.innerHeight / 2;
        showSparkles(x, y);
        firstAddDone = true;
        try { localStorage.setItem('hd-first-add-done', '1'); } catch (e) {}
      }
    }

    document.addEventListener('click', e => {
      const t = e.target.closest('[data-add-to-cart]');
      if (!t) return;
      const slug = t.dataset.addToCart;
      // small delay so existing shared.js handler runs first
      setTimeout(() => showRich(slug, e), 60);
    }, true);
  })();

  /* 7. Free-shipping celebration, observe progress bar text */
  (function fsCelebrate() {
    let lastUnlocked = false;
    function check() {
      const rem = document.getElementById('cartRemaining');
      const bar = document.getElementById('cartProgress');
      if (!rem || !bar) return;
      const isUnlocked = rem.classList.contains('unlocked');
      if (isUnlocked && !lastUnlocked) {
        bar.classList.add('fs-celebrate');
        setTimeout(() => bar.classList.remove('fs-celebrate'), 1300);
      }
      lastUnlocked = isUnlocked;
    }
    function init() {
      // poll every 600ms while cart is open
      setInterval(check, 600);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();

  /* 9. Skeleton loading on shop grid (first paint flash) */
  (function shopSkeleton() {
    function init() {
      const grid = document.getElementById('shopGrid');
      if (!grid) return;
      // Only show skeleton if grid has no children yet (i.e., before HD_product renders)
      if (grid.children.length > 0) return;
      const skel = Array.from({ length: 6 }).map(() =>
        '<div class="hd-skeleton-card">' +
          '<div class="sk-image"></div>' +
          '<div class="sk-line tall"></div>' +
          '<div class="sk-line short"></div>' +
          '<div class="sk-line"></div>' +
        '</div>'
      ).join('');
      grid.innerHTML = skel;
      // The shop's own render() will overwrite the innerHTML
    }
    init();
  })();

  /* 12. Cart drawer drag-to-close on mobile */
  (function cartDragClose() {
    function init() {
      const panel = document.querySelector('.cart-panel');
      const drawer = document.querySelector('.cart-drawer');
      if (!panel || !drawer) return;
      let startY = 0, currentY = 0, dragging = false;
      panel.addEventListener('touchstart', e => {
        if (window.innerWidth > 760) return;
        if (e.touches[0].clientY > 100 && !panel.scrollTop) {
          startY = e.touches[0].clientY;
          dragging = true;
        }
      }, { passive: true });
      panel.addEventListener('touchmove', e => {
        if (!dragging) return;
        currentY = e.touches[0].clientY;
        const dy = currentY - startY;
        if (dy > 0) {
          panel.style.transform = 'translateX(0) translateY(' + dy + 'px)';
        }
      }, { passive: true });
      panel.addEventListener('touchend', () => {
        if (!dragging) return;
        const dy = currentY - startY;
        if (dy > 100) {
          drawer.classList.remove('open');
          drawer.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
        }
        panel.style.transform = '';
        dragging = false;
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();

  /* 13 + 14. Inject "Continue shopping" link and empty-cart suggestions */
  (function cartEnhancements() {
    function init() {
      const foot = document.querySelector('.cart-foot');
      const empty = document.querySelector('.cart-empty');
      // 13. Continue shopping link in footer
      if (foot && !foot.querySelector('.cart-continue-link')) {
        const a = document.createElement('a');
        a.href = 'shop.html';
        a.className = 'cart-continue-link';
        a.textContent = 'Continue browsing the collection';
        foot.appendChild(a);
      }
      // 14. Empty-cart suggestions
      if (empty && !empty.querySelector('.cart-empty-suggestions') && window.HD_product) {
        const sug = document.createElement('div');
        sug.className = 'cart-empty-suggestions visible';
        const slugs = ['thyme', 'chestnut'];
        const items = slugs.map(s => window.HD_product(s)).filter(Boolean);
        sug.innerHTML =
          '<div class="ces-label">Begin with</div>' +
          '<div class="ces-row">' +
            items.map(p =>
              '<a class="ces-card" href="' + p.url + '">' +
                '<span class="ces-name">' + p.name + '</span>' +
                '<span class="ces-price">€' + p.price + '</span>' +
              '</a>'
            ).join('') +
          '</div>';
        empty.appendChild(sug);
      }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();

  /* 15. Variant price diff display (product page) */
  (function variantDiff() {
    function init() {
      const radios = document.querySelectorAll('input[name="hd-variant"]');
      if (!radios.length) return;
      let basePrice = 0;
      const checked = document.querySelector('input[name="hd-variant"]:checked');
      if (checked) basePrice = parseFloat(checked.dataset.price) || 0;
      radios.forEach(r => {
        const label = r.nextElementSibling;
        if (!label || label.querySelector('.price-diff')) return;
        const p = parseFloat(r.dataset.price) || 0;
        const diff = p - basePrice;
        if (diff === 0) return;
        const span = document.createElement('span');
        span.className = 'price-diff';
        span.textContent = (diff > 0 ? '+€' : '−€') + Math.abs(diff);
        label.appendChild(span);
      });
      // Recompute diffs when base changes
      radios.forEach(r => {
        r.addEventListener('change', () => {
          if (!r.checked) return;
          basePrice = parseFloat(r.dataset.price) || 0;
          document.querySelectorAll('.variant-options .price-diff').forEach(el => el.remove());
          radios.forEach(rr => {
            const lbl = rr.nextElementSibling;
            if (!lbl) return;
            const pp = parseFloat(rr.dataset.price) || 0;
            const d = pp - basePrice;
            if (d === 0) return;
            const s = document.createElement('span');
            s.className = 'price-diff';
            s.textContent = (d > 0 ? '+€' : '−€') + Math.abs(d);
            lbl.appendChild(s);
          });
        });
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();

  /* 17. Custom select wrapping for native <select> elements */
  (function customSelects() {
    function init() {
      document.querySelectorAll('select').forEach(sel => {
        if (sel.closest('.hd-select-wrap')) return;
        if (sel.closest('[data-no-wrap]')) return;
        // Skip if parent already provides chevron styling (filter panel etc.)
        if (sel.id === 'f-type' || sel.classList.contains('no-hd-select')) return;
        const wrap = document.createElement('span');
        wrap.className = 'hd-select-wrap';
        sel.parentNode.insertBefore(wrap, sel);
        wrap.appendChild(sel);
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();

  /* 20. Service worker, registration disabled during development.
     The cache-first worker kept serving stale assets; sw.js is now a
     self-destruct kill-switch. We do NOT re-register here so the site
     always loads fresh from the network. Re-enable before deploying a
     real PWA/offline build. */
  (function swRegister() {
    if (!('serviceWorker' in navigator)) return;
    // Defensive: if an old worker is still registered, remove it.
    navigator.serviceWorker.getRegistrations()
      .then(regs => regs.forEach(r => r.unregister()))
      .catch(() => {});
  })();
})();

/* =================================================================
   6. QUICK-VIEW MODAL behavior
   Listens for clicks on [data-quick-view="slug"] anywhere in the doc.
   ================================================================= */
(function () {
  'use strict';
  let overlay = null;

  function qvLang() { try { return (window.HD_lang && window.HD_lang()) || document.documentElement.lang || 'en'; } catch (e) { return 'en'; } }
  function qvFmt(n) { return '€' + (Number.isInteger(n) ? n : Number(n).toFixed(2).replace('.', ',')); }

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'qv-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Product quick view');
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => {
      if (e.target === overlay || e.target.closest('[data-qv-close]')) close();
    });
  }

  function open(slug) {
    if (!window.HD_product) return;
    const p = window.HD_product(slug);
    if (!p) return;
    if (!overlay) buildOverlay();

    const badges = (p.badges || []).slice(0, 3).map(b => '<span class="qv-badge">' + b + '</span>').join('');

    overlay.innerHTML =
      '<div class="qv-panel">' +
        '<button type="button" class="qv-close" data-qv-close aria-label="Close"></button>' +
        '<div class="qv-image">' +
          '<span class="qv-edition">' + (p.edition || '') + '</span>' +
          '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy">' +
        '</div>' +
        '<div class="qv-content">' +
          '<div class="qv-eyebrow">' + (p.region || '') + ' &middot; ' + (p.altitude || '') + '</div>' +
          '<h2>' + p.name + '</h2>' +
          '<div class="qv-region">' + (p.edition || '') + '</div>' +
          '<p class="qv-notes">&ldquo;' + (p.notes || '') + '&rdquo;</p>' +
          (badges ? '<div class="qv-badges">' + badges + '</div>' : '') +
          '<div class="qv-meta">' +
            '<div><div class="lbl">Texture</div><div class="val">' + (p.texture || '-') + '</div></div>' +
            '<div><div class="lbl">Weight</div><div class="val">' + (p.weight || '') + '</div></div>' +
          '</div>' +
          (p.multiSize
            ? '<div class="qv-sizes" role="group" aria-label="Size">' +
                p.sizes.map(function (s) {
                  return '<button type="button" class="qv-size' + (s.id === p.defaultSize ? ' active' : '') +
                    '" data-size="' + s.id + '" data-price="' + s.price + '">' +
                    s.label + ' &middot; ' + qvFmt(s.price) + '</button>';
                }).join('') +
              '</div>'
            : '') +
          (p.bundle ? '<div class="qv-bundle">' + p.bundle.qty + (qvLang() === 'nl' ? ' voor ' : qvLang() === 'el' ? ' για ' : ' for ') + qvFmt(p.bundle.price) + '</div>' : '') +
          '<div class="qv-price-row">' +
            '<span class="qv-price">' + qvFmt(p.price) + '</span>' +
            '<span class="qv-price-sub">incl. VAT &middot; ships worldwide</span>' +
          '</div>' +
          '<div class="qv-actions">' +
            '<button class="cta qv-add" type="button" data-add-to-cart="' + p.slug + '" data-size="' + p.defaultSize + '">Add to cellar <span class="arrow" aria-hidden="true"></span></button>' +
            '<a class="cta-ghost qv-view" href="' + p.url + '">Full details</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Size selector → updates the headline price + the add button's size
    overlay.querySelectorAll('.qv-size').forEach(function (b) {
      b.addEventListener('click', function () {
        overlay.querySelectorAll('.qv-size').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        const priceEl = overlay.querySelector('.qv-price');
        if (priceEl) priceEl.textContent = qvFmt(Number(b.dataset.price));
        const add = overlay.querySelector('.qv-add');
        if (add) add.dataset.size = b.dataset.size;
      });
    });

    // Inject cinematic atmosphere into the image side (haze + drifting motes)
    const imgWrap = overlay.querySelector('.qv-image');
    if (imgWrap) {
      const atmos = document.createElement('div');
      atmos.className = 'qv-atmos';
      atmos.setAttribute('aria-hidden', 'true');
      atmos.innerHTML = '<span class="qv-haze"></span><span class="qv-mote"></span><span class="qv-mote"></span><span class="qv-mote"></span>';
      imgWrap.insertBefore(atmos, imgWrap.firstChild);
    }

    // Cinematic open: scale/fade the panel, then progressively reveal content.
    // setTimeout (not rAF) so it still fires when the tab is backgrounded.
    void overlay.offsetWidth;
    setTimeout(() => overlay.classList.add('open'), 10);
    setTimeout(() => overlay.classList.add('is-revealed'), 150);
    document.body.style.overflow = 'hidden';
    setTimeout(() => overlay.querySelector('.qv-close')?.focus(), 220);

    // Subtle pointer parallax on the jar (desktop, motion-allowed only)
    const fine = window.matchMedia && window.matchMedia('(pointer:fine)').matches;
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const jar = overlay.querySelector('.qv-image img');
    if (jar && imgWrap && fine && !calm) {
      imgWrap.addEventListener('pointermove', e => {
        const r = imgWrap.getBoundingClientRect();
        const dx = ((e.clientX - r.left) / r.width - 0.5);
        const dy = ((e.clientY - r.top) / r.height - 0.5);
        jar.style.transform = 'scale(1.03) translate(' + (dx * -14).toFixed(1) + 'px,' + (dy * -12).toFixed(1) + 'px)';
      });
      imgWrap.addEventListener('pointerleave', () => { jar.style.transform = ''; });
    }
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.classList.remove('is-revealed');
    document.body.style.overflow = '';
    setTimeout(() => { overlay.innerHTML = ''; }, 500);
  }

  /* Capture phase: the card's quick-view button calls stopPropagation()
     (to avoid following the card link), which previously also killed this
     handler. Capturing fires before that, so Quick View opens reliably. */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-quick-view]');
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    open(t.dataset.quickView);
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) close();
  });

  window.HD_quickview = { open, close };
})();

/* =================================================================
   8. Auto-calculated reading time on article pages
   ================================================================= */
(function () {
  'use strict';
  function init() {
    const body = document.querySelector('.article-body');
    if (!body) return;
    const text = body.innerText || body.textContent || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 220)); // 220 wpm = thoughtful reading pace
    const meta = document.querySelector('.article-meta');
    if (!meta) return;
    // Replace any hard-coded "X min read" span if present
    const spans = meta.querySelectorAll('span');
    let replaced = false;
    spans.forEach(s => {
      if (/min\s+read/i.test(s.textContent)) {
        s.textContent = minutes + ' min read';
        replaced = true;
      }
    });
    if (!replaced) {
      // Inject before first dot/separator
      const dot = meta.querySelector('.dot');
      const node = document.createElement('span');
      node.textContent = minutes + ' min read';
      if (dot) meta.insertBefore(node, dot);
      else meta.appendChild(node);
    }
    // Append word count subtly as title attribute on the reading-time span (hover reveals)
    meta.setAttribute('title', '~' + words.toLocaleString() + ' words');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* =================================================================
   9b. Skeleton loading on language switch (shop grid)
   ================================================================= */
(function () {
  'use strict';
  function init() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;
    const skel = Array.from({ length: 6 }).map(() =>
      '<div class="hd-skeleton-card"><div class="sk-image"></div><div class="sk-line tall"></div><div class="sk-line short"></div><div class="sk-line"></div></div>'
    ).join('');
    document.querySelectorAll('.lang-toggle button[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        grid.innerHTML = skel;
        // shop.html's own renderGrid() runs ~30-60ms after the click via its setTimeout
        // so the skeleton is briefly visible before the real cards replace it
      }, true); // capture phase so it runs BEFORE shop.html's listener
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* =================================================================
   18. Hover-image-swap plumbing (activates when product has altImage)
   ================================================================= */
(function () {
  'use strict';
  function init() {
    // Enrich shop cards that already exist with a 2nd image overlay if data-alt-src is set
    document.querySelectorAll('.p-card').forEach(card => {
      if (card.dataset.altSrc && !card.querySelector('.card-photo-alt')) {
        const img = card.querySelector('.card-photo');
        if (!img) return;
        const alt = document.createElement('img');
        alt.src = card.dataset.altSrc;
        alt.alt = '';
        alt.className = 'card-photo-alt ' + (img.className.replace('card-photo', '').trim());
        alt.setAttribute('loading', 'lazy');
        img.parentNode.appendChild(alt);
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* =================================================================
   Commerce layer bootstrap (Phase 1), loads commerce.js site-wide
   and pins the free-shipping threshold before checkout.js reads it.
   ================================================================= */
window.HD_FREE_SHIP = 120; // brand: free shipping across the EU above €120
(function loadAddons() {
  [['hd-commerce-js', 'commerce.js?v=hd-2026-06-06-52'], ['hd-search-js', 'search.js?v=hd-2026-06-06-52'], ['hd-extras-js', 'product-extras.js?v=hd-2026-06-06-52'], ['hd-inventory-js', 'inventory.js?v=hd-2026-06-06-52'],
   ['hd-cfg-js', 'commerce/config.js?v=hd-2026-06-06-52'], ['hd-storefront-js', 'commerce/storefront.js?v=hd-2026-06-06-52'], ['hd-commerce-adapter-js', 'commerce/commerce.js?v=hd-2026-06-06-52'],
   ['hd-product-commerce-js', 'product-commerce.js?v=hd-2026-06-06-52'], ['hd-cart-commerce-js', 'cart-commerce.js?v=hd-2026-06-06-52'], ['hd-seo-js', 'seo.js?v=hd-2026-06-06-52']].forEach(function (a) {
    if (document.getElementById(a[0])) return;
    var s = document.createElement('script');
    s.id = a[0]; s.src = a[1]; s.defer = true;
    document.head.appendChild(s);
  });
})();

/* =================================================================
   Cart subtotal, buttery "settle" pulse when the total changes.
   ================================================================= */
(function () {
  'use strict';
  function bind() {
    var el = document.getElementById('cartTotal');
    if (!el || el._hdBump || !window.MutationObserver) { return !!el; }
    el._hdBump = true;
    var prev = el.textContent;
    new MutationObserver(function () {
      if (el.textContent === prev) return;
      prev = el.textContent;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      el.classList.remove('is-bumped'); void el.offsetWidth; el.classList.add('is-bumped');
    }).observe(el, { childList: true, characterData: true, subtree: true });
    return true;
  }
  if (!bind()) {
    var tries = 0;
    var iv = setInterval(function () { if (bind() || ++tries > 40) clearInterval(iv); }, 120);
  }
})();

/* =================================================================
   Nav, subtle mouse-reactive warm light (sets --nav-mx on hover).
   Pointer-fine + motion-allowed only; pure cosmetic, no layout.
   ================================================================= */
(function () {
  'use strict';
  if (window.matchMedia && (!window.matchMedia('(pointer:fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  function bind() {
    var nav = document.querySelector('nav.site-nav');
    if (!nav || nav._hdNavLight) return !!nav;
    nav._hdNavLight = true;
    nav.addEventListener('pointermove', function (e) {
      var r = nav.getBoundingClientRect();
      nav.style.setProperty('--nav-mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    });
    nav.addEventListener('pointerleave', function () { nav.style.setProperty('--nav-mx', '28%'); });
    return true;
  }
  if (!bind()) { var t = 0, iv = setInterval(function () { if (bind() || ++t > 40) clearInterval(iv); }, 120); }
})();

/* ---------- Reviews: reveal testimonial cards on scroll ---------- */
(function () {
  'use strict';
  function init() {
    var items = document.querySelectorAll('.review-item');
    if (!items.length) return;
    var show = function () { items.forEach(function (el) { el.classList.add('rv-in'); }); };
    if (!('IntersectionObserver' in window)) { show(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('rv-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(show, 3000); // safety net so cards can never stay hidden
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ---------- Tasting journey: draw the line + float ambient motes ---------- */
(function () {
  'use strict';
  function init() {
    var grid = document.querySelector('.tasting-grid');
    if (grid) {
      var draw = function () { grid.classList.add('jr-drawn'); };
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { draw(); io.disconnect(); } });
        }, { threshold: 0.2 });
        io.observe(grid);
        setTimeout(draw, 3000); // safety net
      } else { draw(); }
    }
    var sec = document.querySelector('.tasting');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (sec && !sec.querySelector('.taste-motes') && !reduce) {
      var m = document.createElement('div');
      m.className = 'taste-motes';
      m.setAttribute('aria-hidden', 'true');
      m.innerHTML = '<span class="tm"></span><span class="tm"></span><span class="tm"></span><span class="tm"></span><span class="tm"></span><span class="tm"></span>';
      sec.insertBefore(m, sec.firstChild);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* =================================================================
   CURSOR BEE — brand companion. A small bee lazily follows the
   pointer (never glued to it): spring-lag flight, banks into turns,
   flips when flying left, and hovers in a gentle figure-eight when
   the mouse rests. Guards: fine pointers only, skipped entirely on
   touch and under prefers-reduced-motion; pointer-events none, so
   it can never block a click.
   ================================================================= */
(function () {
  'use strict';
  if (!window.matchMedia) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return; // mouse/trackpad only

  var bee, x = -100, y = -100, tx = -100, ty = -100, shown = false;
  var t = 0, timer = null, lastMove = 0;

  function build() {
    bee = document.createElement('div');
    bee.className = 'hd-bee';
    bee.setAttribute('aria-hidden', 'true');
    // Brand bee: espresso body, gold stripes, ivory wings
    bee.innerHTML =
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<g class="bee-wing bee-wing--far"><ellipse cx="38" cy="16" rx="7.5" ry="13" transform="rotate(24 38 16)" fill="#F7F0E4" fill-opacity="0.88"/></g>' +
        '<g class="bee-wing"><ellipse cx="27" cy="14" rx="8.5" ry="14" transform="rotate(-14 27 14)" fill="#FCF7EC" fill-opacity="0.95"/></g>' +
        '<g class="bee-body">' +
          '<ellipse cx="32" cy="36" rx="15.5" ry="11.5" fill="#2B2118"/>' +
          '<path d="M24.5 26.5 C28 24.8 36 24.8 39.5 26.5 L39.5 30 L24.5 30 Z" fill="#2B2118"/>' +
          '<rect x="25.8" y="27" width="4.6" height="20" rx="2.3" fill="#D4AC6A"/>' +
          '<rect x="33.6" y="27" width="4.6" height="20" rx="2.3" fill="#D4AC6A"/>' +
          '<ellipse cx="32" cy="36" rx="15.5" ry="11.5" stroke="#1B140C" stroke-opacity="0.35" stroke-width="1"/>' +
          '<circle cx="17.5" cy="33.5" r="6.2" fill="#1B140C"/>' +
          '<circle cx="15.6" cy="31.8" r="1.1" fill="#F7F0E4" fill-opacity="0.85"/>' +
          '<path d="M14.5 28.5 C12.5 26 11.5 24.5 11.8 22.2" stroke="#1B140C" stroke-width="1.4" stroke-linecap="round"/>' +
          '<path d="M18.5 27.5 C17.5 24.8 17.4 23 18.4 21" stroke="#1B140C" stroke-width="1.4" stroke-linecap="round"/>' +
          '<circle cx="11.8" cy="21.8" r="1.5" fill="#1B140C"/>' +
          '<circle cx="18.6" cy="20.6" r="1.5" fill="#1B140C"/>' +
          '<path d="M46 34.5 C49.5 35 51 36.5 51.5 38.8 C49 39.4 46.8 38.6 45.4 36.8 Z" fill="#1B140C"/>' +
        '</g>' +
      '</svg>';
    document.body.appendChild(bee);
  }

  function onMove(e) {
    tx = e.clientX; ty = e.clientY;
    lastMove = performance.now();
    if (!shown) {
      shown = true;
      x = tx + 80; y = ty + 60; // flies in from just behind the cursor
      bee.classList.add('is-active');
    }
    if (!timer) timer = setTimeout(tick, 16);
  }

  /* setTimeout chain (not rAF): rAF is throttled to zero in background /
     embedded tabs, which freezes the bee mid-air; nested timeouts keep
     ticking (~60fps focused, browser-clamped when hidden, and the
     visibilitychange handler below pauses it outright). */
  function tick() {
    var now = performance.now();
    t += 0.016;
    var idle = (now - lastMove) > 900;

    // target: hover above-right of the cursor so it never covers what you point at
    var gx = tx + 22, gy = ty - 30;
    if (idle) { // gentle figure-eight while resting
      gx += Math.sin(t * 1.1) * 10;
      gy += Math.sin(t * 2.2) * 6;
    } else {    // small organic wander while flying
      gx += Math.sin(t * 3.1) * 3;
      gy += Math.cos(t * 2.6) * 2.5;
    }

    var dx = gx - x, dy = gy - y;
    x += dx * 0.075;  // lazy spring follow
    y += dy * 0.075;

    // bank into the turn + face flight direction
    var bank = Math.max(-26, Math.min(26, dx * 0.22));
    var facing = (dx < -1.5) ? -1 : 1;

    bee.style.transform =
      'translate3d(' + (x - 15) + 'px,' + (y - 15) + 'px,0)' +
      ' rotate(' + bank * facing + 'deg)' +
      ' scaleX(' + facing + ')';

    timer = setTimeout(tick, 16);
  }

  function init() {
    build();
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && timer) { clearTimeout(timer); timer = null; }
      else if (!document.hidden && shown && !timer) timer = setTimeout(tick, 16);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
