/* =================================================================
   Google Merchant product feed, generated from OUR domain.
   -----------------------------------------------------------------
   Why this exists
   ---------------
   harvestdeli.nl is a headless storefront served by Vercel. Shopify's
   Online Store is not used, so Shopify's `onlineStoreUrl` (and the feed
   the Google & YouTube app builds from it) always resolves to
   su08c4-v4.myshopify.com. That cannot be corrected inside Shopify
   without pointing DNS at Shopify, which would take the site offline.

   So the feed is produced here instead:
     • product data  -> Shopify Storefront API    (price, stock, GTIN)
     • product URLs  -> this site's own route map (single source of truth)
     • shipping      -> NOT here; Merchant Center account level (see below)

   The route map is parsed straight out of shared.js, so it is never
   duplicated. Add a product there and the feed follows automatically.

   Safety rules
   ------------
   1. A product whose handle has no route is SKIPPED, never guessed.
      A link that 404s would get the whole feed disapproved.
   2. product_highlight carries only factual sourcing claims. Health and
      wellbeing claims live on the website, deliberately NOT in the feed,
      to keep Merchant Center clear of unauthorised health claims.
   3. No product-level shipping or handling time. Those belong to the
      account-level service so the free-over-threshold rules keep working.
   4. Descriptions were drafted with generative AI in this project, so they
      are declared through structured_description with digital_source_type
      trained_algorithmic_media. Titles are plain product names, so the
      standard title attribute is used and structured_title is omitted
      (Google prefers title when both are present).
   ================================================================= */

const fs = require('fs');
const path = require('path');

const SITE = 'https://harvestdeli.nl';
const SHOP = 'su08c4-v4.myshopify.com';
const TOKEN = 'd3f835bc393675aeb243244e5475f3c6';   // public, read-only
const API = '2024-10';
const HARVEST_YEAR = '2025';

/* ---------- single source of truth for URLs, read from shared.js ---------- */
let _routes = null;
function sharedJs() {
  return fs.readFileSync(path.join(process.cwd(), 'shared.js'), 'utf8');
}
function routes() {
  if (_routes) return _routes;
  const m = sharedJs().match(/HD_urlForSlug\s*=\s*function\s*\(slug\)\s*\{\s*var\s+M\s*=\s*\{([\s\S]*?)\}\s*;/);
  if (!m) throw new Error('route map not found in shared.js');
  const out = {};
  for (const p of m[1].matchAll(/'?([a-z0-9-]+)'?\s*:\s*'([a-z0-9-]+)'/g)) out[p[1]] = p[2];
  return (_routes = out);
}

/* ---------- shipping: ACCOUNT LEVEL, deliberately not in the feed ----------
   Rates and free-shipping thresholds are configured once in Merchant Center
   under Shipping and returns. They are NOT emitted per item, because a
   product-level g:shipping entry replaces the account-level service for that
   item and would silently defeat the free-over-threshold rules (a per-order
   concept that a per-item attribute cannot express).

   Handling time is part of that same account-level service and is likewise
   omitted, so delivery estimates stay driven by one configuration.

   The map below is the ONLY escape hatch: add a variant SKU here when a
   product genuinely ships differently from the account policy (oversized,
   fragile, a courier-restricted item). Anything listed here emits g:shipping
   for that item alone and knowingly overrides the account service.
   Format: 'SKU': [{ country:'NL', service:'Standard', price:'12.95 EUR' }]  */
const SHIPPING_EXCEPTIONS = {};

/* ---------- English copy for the international feed ----------
   Shopify holds ONE description per product and this shop has a single
   locale enabled, so it cannot yet carry both languages natively. The
   Dutch copy lives in Shopify (primary market) and is read live; the
   English equivalents live here, keyed by handle.

   AGREED MIGRATION (do this when multilingual storefronts go ahead; do not
   grow this map further in the meantime):

     1. Fix the locale scheme. The shop currently reports a single locale,
        `en`, marked primary, while every product description is Dutch.
        Make NL the PRIMARY locale, EN secondary, EL tertiary (the site
        already carries EL strings in HD_T).
     2. Move the Dutch copy into the primary locale, then register these
        English strings with translationsRegister against the EN locale.
     3. Delete EN_DESCRIPTIONS and the lang branch below, and query the
        Storefront API with @inContext(language: NL | EN | EL) instead.

   Shopify Translations then becomes the single source for every language,
   the same way shared.js is already the single source for routes. The
   lookup below is deliberately isolated in one place so that swap touches
   nothing else in this file.

   A handle missing here falls back to the Dutch text rather than shipping
   an empty description, and is reported in the X-Feed-Missing-EN header. */
const EN_DESCRIPTIONS = {
  chestnut: 'A clear, slow-pouring honey from the chestnut forests on the southern slopes of Pelion. Notes of warm resin, sun-ripened herbs and a long mineral finish. Bottled in heavy hand-pressed glass, wax-sealed, unpasteurised.',
  'fir-vanilla': 'Resinous fir forest honey from the slopes of Mount Olympus, dark and silky. Raw, unfiltered and cold-extracted at cellar temperature. Bottled in hand-pressed glass, wax-sealed.',
  acacia: 'Crystal-clear acacia honey from Macedonia, gently floral and pure. Raw and cold-extracted, silky in texture. Bottled in hand-pressed glass, wax-sealed.',
  pine: 'Resinous pine honey from Halkidiki carrying the warmth of sea air, thick and smooth. Raw and unfiltered, cold-extracted. Bottled in hand-pressed glass, wax-sealed.',
  'orange-blossom': 'Bright orange blossom honey from the Peloponnese, fresh and floral with citrus. Raw and extracted while liquid. Bottled in hand-pressed glass, wax-sealed.',
  oak: 'Deep oak honey from Epirus, woody and rich in minerals. Raw, unfiltered and cold-extracted. Bottled in hand-pressed glass, wax-sealed.',
  arbutus: 'Rare arbutus honey from Crete, bittersweet and herbal with earthy depth. Raw and naturally creamy. Bottled in hand-pressed glass, wax-sealed.',
  thyme: 'Aromatic thyme honey from Crete, warm and floral. Raw, unfiltered and cold-extracted. Bottled in hand-pressed glass, wax-sealed.',
  heather: 'Raw Greek heather honey from wild heather on the hills of Evia. Rich, floral and warm, with a naturally creamy texture. Cold-extracted, unfiltered and unpasteurised. Single origin, Greece.',
  oregano: 'Sun-dried wild Greek oregano, hand-picked on the hillsides. Warm, intense flowering tops. 15 grams.',
  'olive-oil': 'Extra virgin olive oil from the estate on Pelion, 2025 pressing. Green almond, freshly cut grass and a peppery finish. Cold-pressed. 500 ml.',
  'mountain-tea': 'Greek mountain tea, hand-picked at high altitude. Floral, herbal and gently aromatic. Naturally caffeine free, a golden light infusion.',
  'chamomile-tea': 'Greek chamomile tea from carefully dried chamomile flowers, with a soft floral aroma and a mild, rounded taste. Naturally caffeine free and lovely as a warm infusion, on its own or with a little honey. Contents: 25 g.',
};

const GQL = `{
  products(first: 50) {
    nodes {
      handle title description productType vendor
      featuredImage { url }
      images(first: 10) { nodes { url } }
      variants(first: 10) {
        nodes {
          sku barcode title availableForSale quantityAvailable
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          image { url }
        }
      }
    }
  }
}`;

const CATEGORY = {
  Honey: '431',            // Food, Beverages & Tobacco > Food Items > Honey
  Tea: '2073',             // Beverages > Tea & Infusions
  'Olive Oil': '6797',     // Cooking & Baking Ingredients > Cooking Oils
  Herb: '2660',            // Seasonings & Spices
};
const CATEGORY_TEXT = {
  Honey: 'Food, Beverages & Tobacco > Food Items > Condiments & Sauces > Honey',
  Tea: 'Food, Beverages & Tobacco > Beverages > Tea & Infusions',
  'Olive Oil': 'Food, Beverages & Tobacco > Food Items > Cooking & Baking Ingredients > Cooking Oils',
  Herb: 'Food, Beverages & Tobacco > Food Items > Seasonings & Spices',
};

/* Factual sourcing highlights only. No health or wellbeing claims here.
   Localised per feed so neither feed ever mixes languages. */
const HIGHLIGHTS = {
  en: {
    Honey: ['Raw and unfiltered', 'Cold extracted, never pasteurised',
            'Single origin from Greece', `Harvest ${HARVEST_YEAR}`, 'Bottled in glass'],
    Tea: ['Hand harvested in Greece', 'Naturally caffeine free',
          'Whole dried leaves and flowers', 'Single origin from Greece'],
    'Olive Oil': ['Cold pressed, extra virgin', 'Single estate olives',
                  `Pressing ${HARVEST_YEAR}`, 'Bottled in glass'],
    Herb: ['Wild picked and sun dried', 'Dried whole on the stem', 'Single origin from Greece'],
  },
  nl: {
    Honey: ['Rauw en ongefilterd', 'Koud geslingerd, nooit gepasteuriseerd',
            'Single origin uit Griekenland', `Oogst ${HARVEST_YEAR}`, 'Gebotteld in glas'],
    Tea: ['Met de hand geoogst in Griekenland', 'Van nature cafeïnevrij',
          'Hele gedroogde blaadjes en bloemen', 'Single origin uit Griekenland'],
    'Olive Oil': ['Koud geperst, extra vergine', 'Olijven van één landgoed',
                  `Persing ${HARVEST_YEAR}`, 'Gebotteld in glas'],
    Herb: ['Wild geplukt en zongedroogd', 'Heel gedroogd aan de steel', 'Single origin uit Griekenland'],
  },
};

/* product_detail labels, likewise localised. */
const DETAIL_LABELS = {
  en: { origin: 'Origin', country: 'Country', greece: 'Greece', harvest: 'Harvest',
        production: 'Production', process: 'Process',
        pressed: 'Cold pressed', extracted: 'Cold extracted, unfiltered',
        packaging: 'Packaging', net: 'Net content' },
  nl: { origin: 'Herkomst', country: 'Land', greece: 'Griekenland', harvest: 'Oogst',
        production: 'Productie', process: 'Proces',
        pressed: 'Koud geperst', extracted: 'Koud geslingerd, ongefilterd',
        packaging: 'Verpakking', net: 'Netto-inhoud' },
};

const CHANNEL = {
  en: { title: 'Harvest Deli', desc: 'Premium Greek honey, olive oil and delicacies' },
  nl: { title: 'Harvest Deli', desc: 'Premium Griekse honing, olijfolie en delicatessen' },
};

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/* "480g" -> {value:480, unit:'g'}  ·  "500ml" -> {value:500, unit:'ml'} */
function measure(title) {
  const m = String(title || '').match(/^\s*([\d.]+)\s*(g|kg|ml|l)\s*$/i);
  if (!m) return null;
  const unit = m[2].toLowerCase();
  return { value: Number(m[1]), unit, base: unit === 'g' || unit === 'kg' ? 'kg' : 'l' };
}

module.exports = async (req, res) => {
  try {
    const r = await fetch(`https://${SHOP}/api/${API}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN },
      body: JSON.stringify({ query: GQL }),
    });
    const json = await r.json();
    const nodes = (json.data && json.data.products && json.data.products.nodes) || [];
    /* One feed per language; nothing is ever mixed. */
    const lang = /(^|[?&])lang=en\b/.test(req.url || '') ? 'en' : 'nl';
    const H = HIGHLIGHTS[lang];
    const D = DETAIL_LABELS[lang];

    const map = routes();
    const items = [];
    const overridden = [];
    const skipped = [];
    const missingEn = [];
    for (const p of nodes) {
      const slug = map[p.handle];
      if (!slug) { skipped.push(p.handle); continue; }
      const link = `${SITE}/products/${slug}`;
      const type = p.productType || 'Honey';
      const gallery = (p.images && p.images.nodes ? p.images.nodes : []).map((i) => i.url);
      const highlights = (H[type] || H.Honey)
        .map((h) => `\n    <g:product_highlight>${esc(h)}</g:product_highlight>`).join('');
      const multi = p.variants.nodes.length > 1;
      /* Dutch comes live from Shopify; English from the map above. */
      let desc = p.description;
      if (lang === 'en') {
        if (EN_DESCRIPTIONS[p.handle]) desc = EN_DESCRIPTIONS[p.handle];
        else missingEn.push(p.handle);
      }

      for (const v of p.variants.nodes) {
        if (!v.sku) continue;
        const title = multi ? `${p.title} ${v.title}` : p.title;
        const main = (v.image && v.image.url) || (p.featuredImage && p.featuredImage.url) || '';
        const extra = gallery.filter((u) => u !== main).slice(0, 10)
          .map((u) => `\n    <g:additional_image_link>${esc(u)}</g:additional_image_link>`).join('');

        const price = Number(v.price.amount);
        const cur = v.price.currencyCode;
        const cmp = v.compareAtPrice ? Number(v.compareAtPrice.amount) : null;
        const onSale = cmp != null && cmp > price;
        const sale = onSale
          ? `\n    <g:sale_price>${price.toFixed(2)} ${esc(cur)}</g:sale_price>`
          : '';
        const listPrice = onSale ? cmp : price;

        const m = measure(v.title);
        const unitXml = m ? `
    <g:unit_pricing_measure>${m.value} ${m.unit}</g:unit_pricing_measure>
    <g:unit_pricing_base_measure>1 ${m.base}</g:unit_pricing_base_measure>` : '';

        const details = [
          [D.origin, D.country, D.greece],
          [D.origin, D.harvest, HARVEST_YEAR],
          [D.production, D.process, type === 'Olive Oil' ? D.pressed : D.extracted],
          [D.packaging, D.net, v.title],
        ].map(([sec, name, val]) => `
    <g:product_detail>
      <g:section_name>${esc(sec)}</g:section_name>
      <g:attribute_name>${esc(name)}</g:attribute_name>
      <g:attribute_value>${esc(val)}</g:attribute_value>
    </g:product_detail>`).join('');

        /* Only genuinely exceptional products carry their own shipping. */
        const exc = SHIPPING_EXCEPTIONS[v.sku];
        const shipXml = exc ? exc.map((z) => `
    <g:shipping>
      <g:country>${esc(z.country)}</g:country>
      <g:service>${esc(z.service)}</g:service>
      <g:price>${esc(z.price)}</g:price>
    </g:shipping>`).join('') : '';
        if (exc) overridden.push(v.sku);

        items.push(`  <item>
    <g:id>${esc(v.sku)}</g:id>
    <g:title>${esc(title)}</g:title>
    <g:link>${esc(link)}</g:link>
    <g:image_link>${esc(main)}</g:image_link>${extra}
    <g:availability>${v.availableForSale ? 'in_stock' : 'out_of_stock'}</g:availability>
    <g:price>${listPrice.toFixed(2)} ${esc(cur)}</g:price>${sale}
    <g:brand>${esc(p.vendor || 'Harvest Deli')}</g:brand>
    <g:mpn>${esc(v.sku)}</g:mpn>${v.barcode ? `
    <g:gtin>${esc(v.barcode)}</g:gtin>` : ''}
    <g:identifier_exists>${v.barcode ? 'yes' : 'no'}</g:identifier_exists>
    <g:condition>new</g:condition>
    <g:adult>no</g:adult>
    <g:is_bundle>no</g:is_bundle>
    <g:item_group_id>${esc(p.handle)}</g:item_group_id>
    <g:google_product_category>${esc(CATEGORY_TEXT[type] || CATEGORY_TEXT.Honey)}</g:google_product_category>
    <g:product_type>${esc(type)}</g:product_type>${unitXml}${highlights}${details}
    <g:custom_label_0>${esc(type)}</g:custom_label_0>
    <g:custom_label_1>${esc(v.title)}</g:custom_label_1>${shipXml}
    <g:structured_description>
      <g:digital_source_type>trained_algorithmic_media</g:digital_source_type>
      <g:content>${esc(desc)}</g:content>
    </g:structured_description>
  </item>`);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${esc(CHANNEL[lang].title)}</title>
  <link>${SITE}</link>
  <description>${esc(CHANNEL[lang].desc)}</description>
${items.join('\n')}
</channel>
</rss>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader("Content-Language", lang);
    if (missingEn.length) res.setHeader("X-Feed-Missing-EN", missingEn.join(","));
    if (overridden.length) res.setHeader("X-Feed-Shipping-Overrides", overridden.join(","));
    if (skipped.length) res.setHeader('X-Feed-Skipped-Handles', skipped.join(','));
    res.setHeader('X-Feed-Item-Count', String(items.length));
    res.status(200).send(xml);
  } catch (e) {
    res.status(500).json({ ok: false, error: String((e && e.message) || e) });
  }
};
