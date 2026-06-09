/* =============================================================
   Harvest Deli — MOCK content provider
   Returns the SAME runtime shape that cms/sanity.js produces, so the
   frontend never knows or cares which source is active. Swap the source
   in cms/config.js (or ?cms=sanity) once the Sanity project is live.

   Runtime post shape (already dereferenced + image URLs resolved):
   {
     id, type:'post', title, slug, excerpt,
     body: [ { _type:'block', style, children:[{text}] }, ... ],
     image: { url|null, alt, caption },          // featured image
     category: { title, slug, tone },
     author:   { name, slug, role, image:{url|null} },
     publishedAt, publishedLabel, readingTime,
     status: 'published'|'upcoming'|'draft',
     featured: bool,
     href,                                        // article page url
     seo: { title, description, ogImage|null }
   }
   ============================================================= */
(function () {
  'use strict';
  window.HD_CMS = window.HD_CMS || {};

  /* ---- reference data ---- */
  var AUTHORS = {
    cellar: { name: 'The cellar', slug: 'the-cellar', role: 'Estate notes', image: { url: null } },
    editor: { name: 'Field editor', slug: 'field-editor', role: 'Journal', image: { url: null } },
  };
  var CATEGORIES = {
    tasting: { title: 'Tasting', slug: 'tasting', tone: 'honey' },
    harvest: { title: 'Harvest', slug: 'harvest', tone: 'thyme' },
    process: { title: 'Process', slug: 'process', tone: 'cellar' },
    estate: { title: 'Estate', slug: 'estate', tone: 'pine' },
    pairing: { title: 'Pairing', slug: 'pairing', tone: 'jar' },
    origin: { title: 'Origin', slug: 'origin', tone: 'honey' },
    guide: { title: 'Guide', slug: 'guide', tone: 'jar' },
  };

  function block(style, text) {
    return { _type: 'block', style: style, children: [{ _type: 'span', text: text }] };
  }

  /* ---- the three real, published articles (mirror article-*.html) ---- */
  var POSTS = [
    {
      id: 'post-taste-the-greek-sun',
      type: 'post',
      title: 'Taste the Greek Sun.',
      slug: 'taste-the-greek-sun',
      excerpt:
        'What the Greek sun actually tastes like, why Pelion makes honey unlike anywhere else, and how to taste a single jar, slowly, in three movements.',
      image: { url: null, alt: 'A jar of Pelion honey in late-summer light', caption: 'Pelion · Late summer 2026' },
      category: CATEGORIES.tasting,
      author: AUTHORS.cellar,
      publishedAt: '2026-05-26T08:00:00+02:00',
      publishedLabel: '26 May 2026',
      readingTime: '8 min read',
      status: 'published',
      featured: true,
      href: 'article-taste-the-greek-sun.html',
      body: [
        block('lede', 'Honey is a place before it is a flavour. Pelion is the place this one comes from.'),
        block('h2', 'I. The mountain in the jar'),
        block('normal', 'Read the full essay on the article page — this mock body exists only to demonstrate the Portable Text shape.'),
      ],
      seo: {
        title: 'Taste the Greek Sun · Harvest Deli',
        description: 'How to taste single-origin Pelion honey, slowly, in three movements.',
        ogImage: null,
      },
    },
    {
      id: 'post-griekse-honing-nederland',
      type: 'post',
      title: 'Waar koop je echte Griekse honing in Nederland?',
      slug: 'griekse-honing-nederland',
      excerpt:
        'Echte rauwe Griekse berghoning kopen in Nederland: hoe je single-origin honing herkent, waarom supermarkthoning anders is, en waar je premium Griekse honing vindt in Amsterdam en online.',
      image: { url: null, alt: 'Greek mountain honey at an Amsterdam market', caption: 'Amsterdam · 2026' },
      category: CATEGORIES.guide,
      author: AUTHORS.editor,
      publishedAt: '2026-06-07T08:00:00+02:00',
      publishedLabel: '7 June 2026',
      readingTime: '7 min read',
      status: 'published',
      featured: false,
      href: 'article-griekse-honing-nederland.html',
      body: [block('lede', 'Echte Griekse honing herken je aan de oogst, niet aan het etiket.')],
      seo: {
        title: 'Waar koop je echte Griekse honing in Nederland? · Harvest Deli',
        description:
          'Echte rauwe Griekse berghoning kopen in Nederland: single-origin herkennen, supermarkthoning vs. rauw, en waar je premium Griekse honing vindt.',
        ogImage: 'https://harvestdeli.nl/assets/market.png',
      },
    },
    {
      id: 'post-griekse-honing-smaak',
      type: 'post',
      title: 'Waarom Griekse honing anders smaakt dan supermarkthoning.',
      slug: 'griekse-honing-smaak',
      excerpt:
        'Rauw, ongefilterd en uit één bloei: waarom Griekse berghoning een smaak heeft die geblende supermarkthoning nooit haalt, en wat antioxidanten en koud slingeren ermee te maken hebben.',
      image: { url: null, alt: 'Raw unfiltered Greek honey', caption: 'Pelion · 2026' },
      category: CATEGORIES.tasting,
      author: AUTHORS.editor,
      publishedAt: '2026-06-07T09:00:00+02:00',
      publishedLabel: '7 June 2026',
      readingTime: '6 min read',
      status: 'published',
      featured: false,
      href: 'article-griekse-honing-smaak.html',
      body: [block('lede', 'Het verschil zit in de bloem, de berg en de temperatuur.')],
      seo: {
        title: 'Waarom Griekse honing anders smaakt · Harvest Deli',
        description:
          'Rauw, ongefilterd, uit één bloei: waarom Griekse berghoning anders smaakt dan geblende supermarkthoning.',
        ogImage: null,
      },
    },

    /* ---- upcoming teasers (mirror the journal archive) ---- */
    teaser('thyme-bloom', 'The thyme bloom: seven days a year.', CATEGORIES.harvest,
      'A field journal from the wild-thyme harvest in Lakonia. The window is short, the bees are exact, and the honey is almost translucent.',
      'Coming June 2026 · 6 min read'),
    teaser('never-heat-the-honey', 'Why we never heat the honey.', CATEGORIES.process,
      'A quiet defence of cold extraction: what dies at 40 degrees, what survives at sixteen, and why temperature is the most important number in the cellar.',
      'Coming June 2026 · 5 min read'),
    teaser('hive-47', 'Hive №47, at twelve eighty.', CATEGORIES.estate,
      "The highest hive on the estate. A morning's walk from the road. What the altitude does to the honey, the bees, and the man who climbs to find them.",
      'Coming July 2026 · 7 min read'),
    teaser('honey-at-the-table', 'Honey at the table.', CATEGORIES.pairing,
      'Six pairings, written by a chef from Athens. Chestnut with aged manouri. Pine with smoked almond. Orange blossom with goat milk and bay.',
      'Coming July 2026 · 9 min read'),
    teaser('a-year-on-the-mountain', 'A year on the mountain.', CATEGORIES.estate,
      'Twelve photographs and twelve sentences. The estate in January, in March, in the heat of August. The cellar in the cold light of November.',
      'Coming August 2026 · 4 min read'),
    teaser('the-1882-notebook', 'The 1882 notebook.', CATEGORIES.origin,
      'A great-grandfather harvest book, pulled from above the oak vats. Yields and temperatures and one sentence about a bear that came in October.',
      'Coming September 2026 · 11 min read'),
  ];

  function teaser(slug, title, category, excerpt, label) {
    return {
      id: 'post-' + slug,
      type: 'post',
      title: title,
      slug: slug,
      excerpt: excerpt,
      image: { url: null, alt: title, caption: '' },
      category: category,
      author: AUTHORS.cellar,
      publishedAt: null,
      publishedLabel: label,
      readingTime: '',
      status: 'upcoming',
      featured: false,
      href: 'journal.html',
      body: [],
      seo: { title: null, description: excerpt, ogImage: null },
    };
  }

  /* ---- homepage editorial sections (disabled = frontend keeps static copy) ---- */
  var HOME_SECTIONS = [
    { key: 'origin', order: 1, eyebrow: 'I, The Origin', title: 'Born in the quiet hills of Northern Greece.', body: '', image: { url: null, alt: '' }, cta: null, enabled: false },
    { key: 'process', order: 2, eyebrow: 'II, The Process', title: 'A practice refined by time, not technology.', body: '', image: { url: null, alt: '' }, cta: null, enabled: false },
  ];

  /* ---- about page story (disabled = frontend keeps static copy) ---- */
  var ABOUT_STORY = {
    eyebrow: 'About',
    heroTitle: 'One family, one mountain, one season at a time.',
    heroIntro: '',
    heroImage: { url: null, alt: '' },
    chapters: [],
    pullQuote: { text: '', attribution: '' },
    seo: { title: null, description: null, ogImage: null },
  };

  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function resolve(v) { return Promise.resolve(clone(v)); }

  HD_CMS.mock = {
    getPosts: function (opts) {
      opts = opts || {};
      var list = POSTS.slice();
      if (opts.status) list = list.filter(function (p) { return p.status === opts.status; });
      if (opts.category) list = list.filter(function (p) { return p.category && p.category.slug === opts.category; });
      if (typeof opts.limit === 'number') list = list.slice(0, opts.limit);
      return resolve(list);
    },
    getPost: function (slug) {
      var found = POSTS.filter(function (p) { return p.slug === slug; })[0] || null;
      return resolve(found);
    },
    getCategories: function () {
      return resolve(Object.keys(CATEGORIES).map(function (k) { return CATEGORIES[k]; }));
    },
    getAuthors: function () {
      return resolve(Object.keys(AUTHORS).map(function (k) { return AUTHORS[k]; }));
    },
    getHomeSections: function () { return resolve(HOME_SECTIONS); },
    getAboutStory: function () { return resolve(ABOUT_STORY); },
  };
})();
