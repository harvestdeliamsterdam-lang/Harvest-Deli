/* Writes the nine honey pages from templates/product-honey.html.
 *
 * Why: the honey pages used to be one chestnut page that JavaScript rewrote
 * after loading. Google, Merchant Center and anyone on a slow connection first
 * got "Chestnut Honey, €18" on every honey. Now every page leaves the server
 * with its own name, price, sizes, SKUs, GTINs, description, schema and
 * metadata, in Dutch, with data-i18n keys so the EN switch still works.
 *
 * Content comes from the site itself (shared.js catalog + dictionary,
 * product-extras.js tasting sheet and highlights), read through a browser, so
 * there is one source. Prices are checked against Shopify before anything is
 * written: the pages must show exactly what checkout charges.
 *
 *   node scripts/serve.mjs 4400 &
 *   node scripts/build-product-pages.mjs [http://localhost:4400]
 *
 * Output: product.html (chestnut) and product-<slug>.html for the other eight.
 * Edit the template or this file, never the generated pages.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/Users/thecreativitylab/Projects/products/node_modules/playwright/index.mjs';
import { EXPERIENCES } from './experiences.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.argv[2] || 'http://localhost:4400').replace(/\/$/, '');
const SITE = 'https://harvestdeli.nl';
const SHOPIFY = { domain: 'su08c4-v4.myshopify.com', token: 'd3f835bc393675aeb243244e5475f3c6', version: '2026-07' };

const HONEYS = ['chestnut', 'fir-vanilla', 'acacia', 'pine', 'orange-blossom', 'oak', 'arbutus', 'thyme', 'heather', 'wildflower'];
const FILE = (slug) => slug === 'chestnut' ? 'product.html' : `product-${slug}.html`;
const URL_SLUG = {
  chestnut: 'chestnut-honey', 'fir-vanilla': 'vanilla-honey', acacia: 'acacia-honey', pine: 'pine-honey',
  'orange-blossom': 'orange-blossom-honey', oak: 'oak-honey', arbutus: 'arbutus-honey', thyme: 'thyme-honey', heather: 'heather-honey',
  wildflower: 'wildflower-honey'
};
/* Search titles and descriptions, written per honey (not generated). */
const SEO = {
  chestnut: ['Griekse Kastanjehoning | Harvest Deli', 'Koud gewonnen kastanjehoning uit één Griekse bosgaard. Donker, hars-achtig en mineraal van smaak. Single-origin, rauw en ambachtelijk. Verzending door heel Europa.'],
  'fir-vanilla': ['Griekse Sparrenhoning Vanille | Harvest Deli', 'Rauwe Griekse sparrenhoning met vanilletoon: harsachtig dennenbos, donker en zijdezacht. Single origin, koud gewonnen. Verzending door heel Europa.'],
  acacia: ['Griekse Acaciahoning | Harvest Deli', 'Rauwe Griekse acaciahoning: kristalhelder, zacht bloemig en puur. Blijft lang vloeibaar. Single origin, koud gewonnen. Verzending door heel Europa.'],
  pine: ['Griekse Dennenhoning | Harvest Deli', 'Rauwe Griekse dennenhoning: harsachtig en glad, met de warmte van zeelucht. Single origin, koud gewonnen en ongefilterd. Verzending door heel Europa.'],
  'orange-blossom': ['Griekse Sinaasappelbloesemhoning | Harvest Deli', 'Rauwe Griekse sinaasappelbloesemhoning: heldere citrusbloesem, fris en bloemig. Single origin, koud gewonnen. Verzending door heel Europa.'],
  oak: ['Griekse Eikenhoning | Harvest Deli', 'Rauwe Griekse eikenhoning uit Epirus: diep bos, houtig en vol van smaak. Single origin, koud gewonnen en ongefilterd. Verzending door heel Europa.'],
  arbutus: ['Griekse Arbutushoning | Harvest Deli', 'Rauwe Griekse arbutushoning: bitterzoet, kruidig en met aardse diepte. Zeldzame late oogst, koud gewonnen en ongefilterd. Verzending door heel Europa.'],
  thyme: ['Griekse Tijmhoning | Harvest Deli', 'Rauwe Griekse tijmhoning: aromatische wilde tijm, warm en bloemig. Een klassieke Griekse honing, koud gewonnen. Verzending door heel Europa.'],
  heather: ['Griekse Heidehoning | Harvest Deli', 'Rauwe Griekse heidehoning: bloemig, warm en van nature romig. Single origin, koud gewonnen en ongefilterd. Verzending door heel Europa.']
};
for (const [slug, X] of Object.entries(EXPERIENCES)) SEO[slug] = X.seo;
const EU = ['NL', 'BE', 'DE', 'FR', 'LU', 'AT', 'IT', 'ES', 'PT', 'DK', 'SE', 'FI', 'IE', 'PL', 'CZ', 'SK', 'SI', 'HU', 'HR', 'RO', 'BG', 'EE', 'LV', 'LT', 'CY', 'GR', 'MT'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ','));

/* ------------------------------------------------------------------ data */
async function siteData() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE + '/shop.html', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.HD_T && window.HD_PRODUCTS && window.HD_HONEY_SPEC && window.HD_PRODUCT_BENEFITS, null, { timeout: 20000 });
  const data = await page.evaluate(() => JSON.parse(JSON.stringify({
    T: { en: window.HD_T.en, nl: window.HD_T.nl },
    P: window.HD_PRODUCTS, S: window.HD_HONEY_SPEC, B: window.HD_PRODUCT_BENEFITS
  })));
  await browser.close();
  return data;
}
async function shopifyPrices() {
  const q = `{ products(first: 50) { nodes { handle variants(first: 10) { nodes { sku price { amount } } } } } }`;
  const r = await fetch(`https://${SHOPIFY.domain}/api/${SHOPIFY.version}/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY.token },
    body: JSON.stringify({ query: q })
  });
  const j = await r.json();
  const out = {};
  j.data.products.nodes.forEach(p => p.variants.nodes.forEach(v => { out[v.sku] = Number(v.price.amount); }));
  return out;
}

/* ------------------------------------------------------------ markup */
function heroAndTasting(d) {
  const X = d.X;   // product experience (scripts/experiences.mjs) or undefined
  const img = (name, w) => `/assets/products-images/${d.slug}${name}${w ? '-' + w : ''}.webp?v=${d.v}`;
  const srcset = (name) => `${img(name, 640)} 640w, ${img(name, 960)} 960w, ${img(name)} 1228w`;
  const sizes = '(max-width: 900px) 90vw, min(44vw, 620px)';
  const profile = [
    ['aroma', 'aroma'], ['texture', 'texture'], ['sweetness', 'sweetness'], ['crystal', 'crystal'], ['color', 'color']
  ].map(([k, icon]) => `        <li><span class="pdb-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[icon]}</svg></span><span class="pdb-k" data-i18n="pp.profile.${k}.k">${esc(d.nl.profileLabels[k])}</span><span class="pdb-v" data-i18n="pp.profile.${k}">${esc(d.nl.profile[k])}</span></li>`).join('\n');
  const highlights = d.nl.highlights.map((h, i) => `        <li data-i18n="pp.hl.${i}">${esc(h)}</li>`).join('\n');
  return `<!-- ============ Product hero (written by scripts/build-product-pages.mjs) ============ -->
<section class="product-hero">
  <div class="crumbs">
    <a href="/shop.html" data-i18n="product.crumb.collection">${esc(d.T.nl['product.crumb.collection'])}</a>
    <span class="sep"></span>
    <strong data-i18n="pp.crumb">${esc(d.nl.crumb)}</strong>
  </div>
  <div class="hero-stage">
${X ? experienceGallery(d, X) : `    <div class="pd-gallery" id="pdGallery">
      <div class="pdg-main" id="pdgMain">
        <img src="${img('', 960)}" srcset="${srcset('')}" sizes="${sizes}" width="1228" height="2200" alt="${esc(d.nl.alt.main)}" data-i18n-attr="alt:pp.alt.main" class="active" data-slide="0" fetchpriority="high" decoding="async">
        <img data-src="${img('-origin', 960)}" data-srcset="${srcset('-origin')}" sizes="${sizes}" width="1228" height="2200" alt="${esc(d.nl.alt.origin)}" data-i18n-attr="alt:pp.alt.origin" data-slide="1" decoding="async">
        <img data-src="${img('-serving', 960)}" data-srcset="${srcset('-serving')}" sizes="${sizes}" width="1228" height="2200" alt="${esc(d.nl.alt.serving)}" data-i18n-attr="alt:pp.alt.serving" data-slide="2" decoding="async">
        <div class="jar-atmos" aria-hidden="true">
          <span class="jar-haze"></span>
          <span class="jar-dust"></span>
        </div>
      </div>
      <div class="pdg-thumbs" id="pdgThumbs">
        <button type="button" class="pdg-thumb active" data-slide="0" aria-label="${esc(d.T.nl['pp.thumb.product'] || 'Productfoto')}" data-i18n-attr="aria-label:pp.thumb.product"><img src="${img('', 160)}" width="160" height="287" alt="" loading="lazy"></button>
        <button type="button" class="pdg-thumb" data-slide="1" aria-label="Herkomst" data-i18n-attr="aria-label:pp.thumb.origin"><img src="${img('-origin', 160)}" width="160" height="287" alt="" loading="lazy"></button>
        <button type="button" class="pdg-thumb" data-slide="2" aria-label="Geserveerd" data-i18n-attr="aria-label:pp.thumb.serving"><img src="${img('-serving', 160)}" width="160" height="287" alt="" loading="lazy"></button>
      </div>
    </div>
`}
    <div class="product-details" id="buy">
      <div class="pd-eyebrow" data-i18n-html="pp.eyebrow_html">${d.nl.eyebrow}</div>
      <h1 class="pd-title" data-i18n-html="pp.title_html">${d.nl.h1}</h1>
      <p class="pd-lede" data-i18n="pp.lede">${esc(d.nl.lede)}</p>

      <div class="pd-price-block">
        <div class="pd-price" id="productPrice">&euro;${money(d.sizes[0].price)}</div>
        <div class="pd-price-sub" data-i18n-html="product.priceSub_html">${d.T.nl['product.priceSub_html']}</div>
        <span class="pd-stock" itemprop="availability" content="InStock">
          <span class="pd-stock-dot" aria-hidden="true"></span><span data-i18n="pp.stock">${esc(d.nl.stock)}</span>
        </span>
      </div>
      <div class="hd-deliver" data-hd-deliver></div>

      <div class="variant-selector" role="radiogroup" aria-label="${esc(d.nl.sizeAria)}" data-i18n-attr="aria-label:pp.size.aria">
        <div class="lbl" data-i18n="product.size.label">${esc(d.T.nl['product.size.label'])}</div>
        <div class="variant-options">
${d.sizes.map((s, i) => `          <input type="radio" name="hd-variant" id="v-${s.id.replace(/g$/, '')}" data-price="${s.price}" data-size="${s.id}" data-sku="${s.sku}" data-edition="${s.label}" data-desc-key="pp.size.${s.id}"${i === 0 ? ' checked' : ''}>
          <label for="v-${s.id.replace(/g$/, '')}"><span>${s.label}</span></label>`).join('\n')}
        </div>
        <div class="variant-meta">
          <span class="vm-edition" id="vmEdition">${d.sizes[0].label}</span>
          <span class="vm-desc" id="vmDesc" data-i18n="pp.size.${d.sizes[0].id}">${esc(d.nl.sizeDesc[d.sizes[0].id])}</span>
          <span id="productSku" hidden>${d.sizes[0].sku}</span>
        </div>
      </div>

      <div class="pd-buyrow">
        <div class="pd-qty" role="group" aria-label="Aantal" data-i18n-attr="aria-label:pp.qty">
          <button type="button" class="pd-qty-btn" id="pdQtyDec" aria-label="Minder" data-i18n-attr="aria-label:pp.qty.dec">&minus;</button>
          <span class="pd-qty-val" id="pdQtyVal" aria-live="polite">1</span>
          <button type="button" class="pd-qty-btn" id="pdQtyInc" aria-label="Meer" data-i18n-attr="aria-label:pp.qty.inc">+</button>
        </div>
        <button class="pd-cta" data-add-to-cart="${d.slug}" data-size="${d.sizes[0].id}" data-qty="1"><span data-i18n="product.cta">${esc(d.T.nl['product.cta'])}</span><span class="arrow"></span></button>
      </div>
      <button type="button" class="pd-express" id="pdExpress"><span data-i18n="product.express">${esc(d.T.nl['product.express'])}</span></button>
${X ? experienceHighlights(d, X) : ''}
      <ul class="pd-trust" aria-label="Waarom Harvest Deli" data-i18n-attr="aria-label:pp.trust.aria">
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="M9 14.5 7.5 21l4.5-2.4L16.5 21 15 14.5"/></svg><span data-i18n="product.trust.q1">${esc(d.T.nl['product.trust.q1'])}</span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.7 2.6 4 5.6 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.6-4-9s1.3-6.4 4-9z"/></svg><span data-i18n="product.trust.q2">${esc(d.T.nl['product.trust.q2'])}</span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg><span data-i18n="product.trust.q3">${esc(d.T.nl['product.trust.q3'])}</span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19c3-4 7-7 11-8"/></svg><span data-i18n="${X ? 'pp.trust.q4' : 'product.trust.q4'}">${esc(X ? X.trustQ4 : d.T.nl['product.trust.q4'])}</span></li>
      </ul>

      <div class="pd-acc">
        <details open>
          <summary><span data-i18n="product.acc.desc">${esc(d.T.nl['product.acc.desc'])}</span><span class="acc-icon" aria-hidden="true"></span></summary>
          <div class="acc-body" data-i18n="pp.desc">${esc(d.nl.desc)}</div>
        </details>
        <details>
          <summary><span data-i18n="product.acc.ing">${esc(d.T.nl['product.acc.ing'])}</span><span class="acc-icon" aria-hidden="true"></span></summary>
          <div class="acc-body" data-i18n="${X ? 'pp.ingBody' : 'product.acc.ingBody'}">${esc(X ? X.ingBody : d.T.nl['product.acc.ingBody'])}</div>
        </details>
        <details>
          <summary><span data-i18n="product.acc.origin">${esc(d.T.nl['product.acc.origin'])}</span><span class="acc-icon" aria-hidden="true"></span></summary>
          <div class="acc-body" data-i18n="pp.origin">${esc(d.nl.origin)}</div>
        </details>
        <details>
          <summary><span data-i18n="product.acc.ship">${esc(d.T.nl['product.acc.ship'])}</span><span class="acc-icon" aria-hidden="true"></span></summary>
          <div class="acc-body"><div data-hd-ship style="margin-bottom: 13px;"></div><span data-i18n="product.acc.shipBody">${esc(d.T.nl['product.acc.shipBody'])}</span></div>
        </details>
      </div>

      <button type="button" class="product-wishlist-line" data-wishlist-toggle="${d.slug}" aria-pressed="false" aria-label="Add to wishlist"><span data-i18n="pp.wishlist">${esc(d.nl.wishlist)}</span></button>
    </div>
  </div>
</section>

${X ? experienceStoryCharacter(d, X) : `<!-- ============ Tasting: this honey's own profile ============ -->
<section class="tasting">
  <div class="reveal">
    <div class="section-eyebrow" data-i18n="product.tasting.eyebrow">${esc(d.T.nl['product.tasting.eyebrow'])}</div>
    <h2 class="section-headline" data-i18n="pp.tagline">${esc(d.nl.tagline)}</h2>
  </div>
  <div class="pd-profile-grid reveal delay-1">
    <div class="pd-benefits" id="pdBenefits">
      <div class="pdb-head" data-i18n="pp.profile.head">${esc(d.nl.profileHead)}</div>
      <ul class="pdb-list">
${profile}
      </ul>
    </div>
    <div class="pd-wellness" id="pdWellness">
      <div class="pdw-head" data-i18n="pp.hl.head">${esc(d.nl.highlightsHead)}</div>
      <ul class="pdw-list">
${highlights}
      </ul>
    </div>
  </div>
</section>`}`;
}

const ICONS = {
  aroma: '<path d="M5 13c3-1 4-3 4-6M9 13c3-1 4-3 4-6M13 13c3-1 4-3 4-6" /><path d="M4 17h15" />',
  texture: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" />',
  sweetness: '<path d="M12 3v18M5 8c2-2 5-2 7 0 2-2 5-2 7 0M5 14c2-2 5-2 7 0 2-2 5-2 7 0" />',
  crystal: '<path d="M12 3l2.5 4.3 4.9.4-3.7 3.2 1.1 4.8L12 13.6 7.2 16l1.1-4.8L4.6 8l4.9-.4z" />',
  color: '<circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 0 0 16" />'
};

function sticky(d) {
  return `<!-- Sticky buy bar (phones and tablets) -->
<aside class="sticky-buy" id="stickyBuy" aria-label="Snel toevoegen" data-i18n-attr="aria-label:product.sticky.region">
  <div class="sb-thumb"><img src="/assets/products-images/${d.slug}-640.webp?v=${d.v}" width="640" height="${d.X ? Math.round(d.X.gallery[0].h * 640 / d.X.gallery[0].w) : 1147}" alt="" loading="lazy"></div>
  <div class="sb-meta">
    <div class="sb-name" data-i18n="pp.name">${esc(d.nl.name)}</div>
    <div class="sb-price" id="sbPrice">&euro;${money(d.sizes[0].price)} &middot; ${d.sizes[0].label}</div>
  </div>
  <button data-add-to-cart="${d.slug}" data-size="${d.sizes[0].id}" data-i18n="product.sticky.add">${esc(d.T.nl['product.sticky.add'])}</button>
</aside>`;
}

/* ------------------------------------------------- product experiences
   Extra markup for honeys listed in scripts/experiences.mjs. Every string is
   a data-i18n key (pp.* / px.*) carried in the page dictionary, so the page is
   Dutch in the HTML and follows the language switch like the rest. */
const XICONS = {
  drop: '<path d="M12 3c3.4 4 5.4 6.8 5.4 9.8a5.4 5.4 0 0 1-10.8 0C6.6 9.8 8.6 7 12 3z"/>',
  bloom: '<circle cx="12" cy="12" r="3.1"/><path d="M12 3.5v3.2M12 17.3v3.2M3.5 12h3.2M17.3 12h3.2"/>',
  leaf: '<path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14z"/><path d="M5 19 12.5 11.5"/>',
  hex: '<path d="M12 3l7 4v10l-7 4-7-4V7z"/>',
  spoon: '<ellipse cx="12" cy="7.2" rx="3.4" ry="4.2"/><path d="M12 11.4V21"/>'
};
const xsvg = (name, w = 1.6) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${XICONS[name]}</svg>`;
const ximg = (d, base, w) => `/assets/products-images/${base}${w ? '-' + w : ''}.webp?v=${d.v}`;
const xsrcset = (d, im) => [...im.widths.map(w => `${ximg(d, im.base, w)} ${w}w`), `${ximg(d, im.base)} ${im.w}w`].join(', ');
const xsrc = (d, im) => im.widths.length ? ximg(d, im.base, im.widths[im.widths.length - 1]) : ximg(d, im.base);

/* The experience in one language: the `en` block laid over the Dutch.
   Objects merge key by key, arrays of objects element by element; plain
   arrays (paragraphs, facts, cells) are replaced whole. */
function overlay(base, top) {
  if (top === undefined) return base;
  if (Array.isArray(base) && Array.isArray(top)) {
    return top.every(t => t && typeof t === 'object' && !Array.isArray(t)) ? base.map((b, i) => overlay(b, top[i])) : top;
  }
  if (base && top && typeof base === 'object' && typeof top === 'object' && !Array.isArray(top)) {
    const o = { ...base };
    for (const k of Object.keys(top)) o[k] = overlay(base[k], top[k]);
    return o;
  }
  return top;
}
const xlang = (X, lang) => (lang === 'en' && X.en ? overlay(X, X.en) : X);

/* Flat dictionary of every experience string, for one language. */
function experienceDict(X) {
  const ui = X.ui || {};
  const o = { 'pp.trust.q4': X.trustQ4, 'pp.ingBody': X.ingBody, 'pp.hl.head': X.hlHead,
    'px.gallery.aria': ui.galleryAria || 'Productfoto: beweeg erover of tik op een punt voor de kenmerken',
    'px.seo.title': X.seo[0], 'px.seo.desc': X.seo[1] };
  X.gallery.forEach((g, i) => { o[`pp.alt.g${i}`] = g.alt; o[`pp.thumb.g${i}`] = g.thumb; });
  X.spots.forEach(sp => { if (sp.detail) o[`px.spot.d${sp.i}`] = sp.detail; });
  o['px.story.eyebrow'] = X.story.eyebrow; o['px.story.h'] = X.story.h;
  X.story.p.forEach((p, i) => { o[`px.story.p${i}`] = p; });
  const c = X.character;
  o['px.char.eyebrow'] = c.eyebrow; o['px.char.h'] = c.h; o['px.char.alt'] = c.image.alt;
  c.rows.forEach((r, i) => { o[`px.char.k${i}`] = r.k; o[`px.char.v${i}`] = r.v; o[`px.char.p${i}`] = r.p; });
  const g = X.origin;
  o['px.origin.eyebrow'] = g.eyebrow; o['px.origin.h'] = g.h; o['px.origin.alt'] = g.image.alt;
  g.p.forEach((p, i) => { o[`px.origin.p${i}`] = p; });
  g.facts.forEach(([k, v], i) => { o[`px.origin.fk${i}`] = k; o[`px.origin.fv${i}`] = v; });
  const e = X.enjoy;
  o['px.enjoy.eyebrow'] = e.eyebrow; o['px.enjoy.h'] = e.h; o['px.enjoy.intro'] = e.intro; o['px.enjoy.alt'] = e.image.alt;
  e.items.forEach(([t, p], i) => { o[`px.enjoy.t${i}`] = t; o[`px.enjoy.d${i}`] = p; });
  const t = X.details;
  o['px.det.eyebrow'] = t.eyebrow; o['px.det.h_html'] = t.h_html; o['px.det.note'] = t.note;
  t.cells.forEach(([k, v], i) => { o[`px.det.k${i}`] = k; o[`px.det.v${i}_html`] = v; });
  o['px.rem.note'] = X.reminder.note; o['px.rem.ship'] = X.reminder.ship;
  o['px.rem.aria'] = ui.remAria || 'Bestellen';
  return o;
}

function experienceGallery(d, X) {
  const sizes = '(max-width: 900px) 90vw, min(44vw, 620px)';
  const main = X.gallery.map((im, i) => i === 0
    ? `        <img src="${xsrc(d, im)}" srcset="${xsrcset(d, im)}" sizes="${sizes}" width="${im.w}" height="${im.h}" alt="${esc(im.alt)}" data-i18n-attr="alt:pp.alt.g${i}" class="active" data-slide="${i}" fetchpriority="high" decoding="async">`
    : `        <img data-src="${xsrc(d, im)}" data-srcset="${xsrcset(d, im)}" sizes="${sizes}" width="${im.w}" height="${im.h}" alt="${esc(im.alt)}" data-i18n-attr="alt:pp.alt.g${i}" data-slide="${i}" decoding="async">`).join('\n');
  const B = d.nl.highlights;
  const spots = X.spots.map(s => `          <div class="pdx-spot pdx-${s.side}" data-i="${s.i}" data-x="${s.x}" data-y="${s.y}">
            <span class="pdx-dot"></span><span class="pdx-line"></span>
            <span class="pdx-pill">${xsvg(s.icon)}<span class="pdx-pill-txt"><span data-i18n="pp.hl.${s.i}">${esc(B[s.i])}</span>${s.detail ? `<span class="pdx-pill-detail"><span data-i18n="px.spot.d${s.i}">${esc(s.detail)}</span></span>` : ''}</span></span>
          </div>`).join('\n');
  const thumbs = X.gallery.map((im, i) => {
    const w = im.widths[0] || im.w, h = Math.round(im.h * w / im.w);
    return `        <button type="button" class="pdg-thumb${i === 0 ? ' active' : ''}" data-slide="${i}" aria-label="${esc(im.thumb)}" data-i18n-attr="aria-label:pp.thumb.g${i}"><img src="${ximg(d, im.base, im.widths[0])}" width="${w}" height="${h}" alt="" loading="lazy"></button>`;
  }).join('\n');
  return `    <div class="pd-gallery" id="pdGallery">
      <div class="pdg-main pdx-main" id="pdgMain" tabindex="0" role="group" aria-label="Productfoto: beweeg erover of tik op een punt voor de kenmerken" data-i18n-attr="aria-label:px.gallery.aria">
${main}
        <div class="jar-atmos" aria-hidden="true">
          <span class="jar-haze"></span>
          <span class="jar-dust"></span>
        </div>
        <div class="pdx-spots" id="pdxSpots" data-w="${X.gallery[0].w}" data-h="${X.gallery[0].h}" aria-hidden="true">
${spots}
        </div>
      </div>
      <div class="pdg-thumbs" id="pdgThumbs">
${thumbs}
      </div>
    </div>
`;
}

/* The same highlights as a quiet list beside the photo, in the buy column.
   Hovering a line lights up its point on the photo (product-experience.js). */
function experienceHighlights(d, X) {
  const icon = Object.fromEntries(X.spots.map(s => [s.i, s.icon]));
  const items = d.nl.highlights.map((h, i) => `          <li data-i="${i}"><span class="pdx-hl-ic">${xsvg(icon[i] || 'drop', 1.5)}</span><span data-i18n="pp.hl.${i}">${esc(h)}</span></li>`).join('\n');
  return `      <div class="pdx-hl" id="pdxHl">
        <div class="pdx-hl-head" data-i18n="pp.hl.head">${esc(X.hlHead)}</div>
        <ul class="pdx-hl-list">
${items}
        </ul>
      </div>
`;
}

function experienceStoryCharacter(d, X) {
  const c = X.character, im = c.image;
  const rows = c.rows.map((r, i) => `        <div class="pdx-note">
          <dt data-i18n="px.char.k${i}">${esc(r.k)}</dt>
          <dd><span class="pdx-note-v"${r.swatch ? ' data-swatch' : ''}><span data-i18n="px.char.v${i}">${esc(r.v)}</span>${r.swatch ? '<span class="pdx-swatch" aria-hidden="true"></span>' : ''}</span><span class="pdx-note-p" data-i18n="px.char.p${i}">${esc(r.p)}</span></dd>
        </div>`).join('\n');
  return `<!-- ============ Story (product experience) ============ -->
<section class="pdx-story" aria-labelledby="pdxStoryH">
  <div class="pdx-story-inner reveal">
    <div class="section-eyebrow" data-i18n="px.story.eyebrow">${esc(X.story.eyebrow)}</div>
    <h2 class="section-headline" id="pdxStoryH" data-i18n="px.story.h">${esc(X.story.h)}</h2>
    <div class="pdx-story-copy">
${X.story.p.map((p, i) => `      <p data-i18n="px.story.p${i}">${esc(p)}</p>`).join('\n')}
    </div>
  </div>
</section>

<!-- ============ Taste and character ============ -->
<section class="pdx-char" aria-labelledby="pdxCharH">
  <div class="pdx-wrap">
    <figure class="pdx-char-media reveal">
      <img src="${ximg(d, im.base)}" width="${im.w}" height="${im.h}" alt="${esc(im.alt)}" data-i18n-attr="alt:px.char.alt" loading="lazy" decoding="async">
    </figure>
    <div class="pdx-char-body reveal delay-1">
      <div class="section-eyebrow" data-i18n="px.char.eyebrow">${esc(c.eyebrow)}</div>
      <h2 class="pdx-h2" id="pdxCharH" data-i18n="px.char.h">${esc(c.h)}</h2>
      <dl class="pdx-notes">
${rows}
      </dl>
    </div>
  </div>
</section>`;
}

function experienceSections(d, X) {
  const g = X.origin, e = X.enjoy, t = X.details;
  const sizesWide = '(max-width: 900px) 92vw, 52vw';
  return `<!-- ============ Origin (product experience) ============ -->
<section class="pdx-origin" aria-labelledby="pdxOriginH">
  <div class="pdx-wrap">
    <figure class="pdx-origin-media reveal">
      <img src="${xsrc(d, g.image)}" srcset="${xsrcset(d, g.image)}" sizes="${sizesWide}" width="${g.image.w}" height="${g.image.h}" alt="${esc(g.image.alt)}" data-i18n-attr="alt:px.origin.alt" loading="lazy" decoding="async">
    </figure>
    <div class="pdx-origin-body reveal delay-1">
      <div class="section-eyebrow" data-i18n="px.origin.eyebrow">${esc(g.eyebrow)}</div>
      <h2 class="pdx-h2" id="pdxOriginH" data-i18n="px.origin.h">${esc(g.h)}</h2>
${g.p.map((p, i) => `      <p class="pdx-p" data-i18n="px.origin.p${i}">${esc(p)}</p>`).join('\n')}
      <dl class="pdx-facts">
${g.facts.map(([k, v], i) => `        <div><dt data-i18n="px.origin.fk${i}">${esc(k)}</dt><dd data-i18n="px.origin.fv${i}"${/[Ͱ-Ͽ]/.test(v) ? ' lang="el"' : ''}>${esc(v)}</dd></div>`).join('\n')}
      </dl>
    </div>
  </div>
</section>

<!-- ============ Ways to enjoy ============ -->
<section class="pdx-enjoy" aria-labelledby="pdxEnjoyH">
  <div class="pdx-wrap">
    <div class="pdx-enjoy-body reveal">
      <div class="section-eyebrow" data-i18n="px.enjoy.eyebrow">${esc(e.eyebrow)}</div>
      <h2 class="pdx-h2" id="pdxEnjoyH" data-i18n="px.enjoy.h">${esc(e.h)}</h2>
      <p class="pdx-p" data-i18n="px.enjoy.intro">${esc(e.intro)}</p>
      <ol class="pdx-uses">
${e.items.map(([tt, p], i) => `        <li><span class="pdx-use-n" aria-hidden="true">${['I', 'II', 'III', 'IV', 'V', 'VI'][i]}</span><span class="pdx-use-t" data-i18n="px.enjoy.t${i}">${esc(tt)}</span><span class="pdx-use-d" data-i18n="px.enjoy.d${i}">${esc(p)}</span></li>`).join('\n')}
      </ol>
    </div>
    <figure class="pdx-enjoy-media reveal delay-1">
      <img src="${xsrc(d, e.image)}" srcset="${xsrcset(d, e.image)}" sizes="${sizesWide}" width="${e.image.w}" height="${e.image.h}" alt="${esc(e.image.alt)}" data-i18n-attr="alt:px.enjoy.alt" loading="lazy" decoding="async">
    </figure>
  </div>
</section>

<!-- ============ Details ============ -->
<section class="details pdx-details" aria-labelledby="pdxDetH">
  <div class="reveal">
    <div class="section-eyebrow" data-i18n="px.det.eyebrow">${esc(t.eyebrow)}</div>
    <h2 class="section-headline" id="pdxDetH" data-i18n-html="px.det.h_html">${t.h_html}</h2>
  </div>
  <div class="details-grid pdx-details-grid">
${t.cells.map(([k, v], i) => `    <div class="detail-cell reveal${i % 3 ? ' delay-' + (i % 3) : ''}">
      <h4 data-i18n="px.det.k${i}">${esc(k)}</h4>
      <p data-i18n-html="px.det.v${i}_html">${v}</p>
    </div>`).join('\n')}
  </div>
  <p class="pdx-det-note reveal" data-i18n="px.det.note">${esc(t.note)}</p>
</section>

<!-- ============ Closing purchase line ============ -->
<section class="pdx-reminder" id="pdxReminder" aria-label="Bestellen" data-i18n-attr="aria-label:px.rem.aria">
  <div class="pdx-rem-inner reveal">
    <img class="pdx-rem-img" src="${ximg(d, X.gallery[0].base, X.gallery[0].widths[0])}" width="${X.gallery[0].widths[0]}" height="${Math.round(X.gallery[0].h * X.gallery[0].widths[0] / X.gallery[0].w)}" alt="" loading="lazy" decoding="async">
    <div class="pdx-rem-meta">
      <div class="pdx-rem-name" data-i18n="pp.name">${esc(d.nl.name)}</div>
      <div class="pdx-rem-note" data-i18n="px.rem.note">${esc(X.reminder.note)}</div>
    </div>
    <div class="pdx-rem-buy">
      <div class="pdx-rem-price"><span id="pdxRemPrice">&euro;${money(d.sizes[0].price)}</span> <span class="pdx-rem-size" id="pdxRemSize">&middot; ${d.sizes[0].label}</span></div>
      <div class="pdx-rem-ship" data-i18n="px.rem.ship">${esc(X.reminder.ship)}</div>
    </div>
    <button class="pd-cta pdx-rem-cta" data-add-to-cart="${d.slug}" data-size="${d.sizes[0].id}" data-qty="1"><span data-i18n="product.cta">${esc(d.T.nl['product.cta'])}</span><span class="arrow"></span></button>
  </div>
</section>

`;
}

/* Turn the standard honey page into the experience page: mark the <html>,
   load the experience stylesheet and script, and swap the standard details
   strip for the experience sections. Only runs for slugs in EXPERIENCES. */
function applyExperience(html, d, X) {
  const swap = (a, b) => { if (!html.includes(a)) throw new Error('experience: niet gevonden: ' + a.slice(0, 60)); html = html.replace(a, () => b); };
  swap('<html lang="nl" data-hd-static="product">', `<html lang="nl" data-hd-static="product" data-hd-experience="${d.slug}">`);
  swap(`<link rel="stylesheet" href="/shared.css?v=${d.v}">`, `<link rel="stylesheet" href="/shared.css?v=${d.v}">\n<link rel="stylesheet" href="/product-experience.css?v=${d.v}">`);
  const a = html.indexOf('<!-- ============ Details ============ -->'), b = html.indexOf('<!-- ============ Reviews ============ -->');
  if (a < 0 || b < a) throw new Error('experience: details/reviews niet gevonden');
  html = html.slice(0, a) + experienceSections(d, X) + html.slice(b);
  swap('</body>', `<script src="/product-experience.js?v=${d.v}" defer></script>\n</body>`);
  if (X.og) {
    swap('<meta property="og:image:width" content="1228">', `<meta property="og:image:width" content="${X.og.w}">`);
    swap('<meta property="og:image:height" content="2200">', `<meta property="og:image:height" content="${X.og.h}">`);
    swap('<meta property="og:image:type" content="image/webp">', `<meta property="og:image:type" content="${X.og.type}">`);
  }
  return html;
}

function pageScripts() {
  return `<script>
(function () {
  /* Menu */
  var menuBtn = document.getElementById('menuBtn');
  var menuOverlay = document.getElementById('menuOverlay');
  var menuClose = document.getElementById('menuClose');
  function openMenu() { menuOverlay.classList.add('open'); menuOverlay.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function closeMenu() { menuOverlay.classList.remove('open'); menuOverlay.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  if (menuOverlay) menuOverlay.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  function t(key, fallback) {
    var lang = window.HD_lang ? window.HD_lang() : 'nl';
    var dict = (window.HD_T && (window.HD_T[lang] || window.HD_T.nl)) || {};
    return dict[key] || fallback;
  }

  /* Size: the price, SKU, add buttons, sticky bar and size note follow the
     choice. ?size=950g (or ?variant=<Shopify id>) opens on that size, so an ad
     for the big jar lands on the big jar and its price. */
  var radios = Array.prototype.slice.call(document.querySelectorAll('input[name="hd-variant"]'));
  var price = document.getElementById('productPrice'), sku = document.getElementById('productSku');
  var ed = document.getElementById('vmEdition'), de = document.getElementById('vmDesc'), sb = document.getElementById('sbPrice');
  function euro(n) { n = Number(n); return '\\u20ac' + (n % 1 ? n.toFixed(2).replace('.', ',') : n); }
  function show(r) {
    if (!r) return;
    if (price) price.textContent = euro(r.dataset.price);
    if (sku) sku.textContent = r.dataset.sku;
    if (ed) ed.textContent = r.dataset.edition;
    if (de) { de.setAttribute('data-i18n', r.dataset.descKey); de.textContent = t(r.dataset.descKey, de.textContent); }
    if (sb) sb.textContent = euro(r.dataset.price) + ' \\u00b7 ' + r.dataset.edition;
    document.querySelectorAll('[data-add-to-cart]').forEach(function (b) { b.dataset.size = r.dataset.size; });
  }
  radios.forEach(function (r) { r.addEventListener('change', function () { if (r.checked) show(r); }); });
  try {
    var qs = new URLSearchParams(location.search);
    var want = qs.get('size'), vid = qs.get('variant');
    if (vid && window.HD_PRODUCTS) {
      var slug = (document.querySelector('meta[name="hd-product-slug"]') || {}).content;
      var p = window.HD_PRODUCTS[slug];
      (p && p.sizes || []).forEach(function (s) { if (s.vid === vid) want = s.id; });
    }
    var pick = radios.filter(function (r) { return r.dataset.size === want; })[0];
    if (pick && !pick.checked) { pick.checked = true; show(pick); }
  } catch (e) {}

  /* Gallery: the first photo loads with the page; the other two only once the
     page has loaded, so they never compete with it. */
  var main = document.getElementById('pdgMain'), thumbs = document.getElementById('pdgThumbs');
  function loadSlides() {
    if (!main) return;
    main.querySelectorAll('img[data-src]').forEach(function (img) {
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.src = img.dataset.src;
      img.removeAttribute('data-src'); img.removeAttribute('data-srcset');
    });
  }
  if (document.readyState === 'complete') setTimeout(loadSlides, 300);
  else window.addEventListener('load', function () { setTimeout(loadSlides, 300); });
  if (main && thumbs) {
    thumbs.addEventListener('click', function (e) {
      var btn = e.target.closest('.pdg-thumb'); if (!btn) return;
      loadSlides();
      var idx = btn.getAttribute('data-slide');
      main.querySelectorAll('img').forEach(function (img) { img.classList.toggle('active', img.getAttribute('data-slide') === idx); });
      thumbs.querySelectorAll('.pdg-thumb').forEach(function (b) { b.classList.toggle('active', b === btn); });
    });
  }

  /* Sticky buy bar on phones and tablets: visible whenever the main button is
     off screen, above or below. On arrival that means name, price, size and
     the add button are on the first screen even when the photo fills it. */
  var stickyBuy = document.getElementById('stickyBuy'), heroCta = document.querySelector('.pd-cta');
  if (stickyBuy && heroCta && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var off = !en.isIntersecting;
        stickyBuy.classList.toggle('show', off);
        document.body.classList.toggle('has-sticky-buy', off);
      });
    }, { threshold: 0, rootMargin: '0px 0px -72px 0px' }).observe(heroCta);
  }

  /* Reveal for the sections below the fold */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* Quantity + "Direct afrekenen": straight to Shopify's secure checkout */
  var val = document.getElementById('pdQtyVal'), qty = 1;
  var pageSlug = (document.querySelector('meta[name="hd-product-slug"]') || {}).content;
  function applyQty() { if (val) val.textContent = qty; document.querySelectorAll('[data-add-to-cart]').forEach(function (b) { b.dataset.qty = qty; }); }
  var dec = document.getElementById('pdQtyDec'), inc = document.getElementById('pdQtyInc');
  if (dec) dec.addEventListener('click', function () { qty = Math.max(1, qty - 1); applyQty(); });
  if (inc) inc.addEventListener('click', function () { qty = Math.min(12, qty + 1); applyQty(); });
  var ex = document.getElementById('pdExpress');
  if (ex) ex.addEventListener('click', function () {
    var r = document.querySelector('input[name="hd-variant"]:checked');
    if (window.HD_CART) window.HD_CART.add(pageSlug, qty, (r && r.dataset.size) || undefined);
    if (typeof window.HD_startCheckout === 'function') window.HD_startCheckout();
    else window.location.href = '/checkout.html';
  });
})();
</script>`;
}

/* ------------------------------------------------------------ per honey */
function buildData(slug, site, v) {
  const P = site.P[slug], S = site.S[slug], B = site.B[slug];
  if (!P || !S || !B) throw new Error('geen data voor ' + slug);
  const nameEn = P.name.en, nameNl = P.name.nl;
  const lang = (en, nl) => ({ en, nl });
  const L = {
    name: lang(nameEn, nameNl),
    h1: lang(`${esc(nameEn)}, <em>${esc(S.greek)}.</em>`, `${esc(nameNl)}, <em>${esc(S.greek)}.</em>`),
    eyebrow: lang('Edition I <span class="dot"></span> Harvest 2025 <span class="dot"></span> Greek honey', 'Editie I <span class="dot"></span> Oogst 2025 <span class="dot"></span> Griekse honing'),
    crumb: lang(`Edition I · ${nameEn}`, `Editie I · ${nameNl}`),
    lede: lang(S.lede[0], S.lede[1]),
    desc: lang(S.result[0], S.result[1]),
    origin: lang(S.origin[0], S.origin[1]),
    tagline: lang(S.tagline[0], S.tagline[1]),
    stock: lang('In stock · ready to ship', 'Op voorraad · klaar voor verzending'),
    sizeAria: lang('Choose a size', 'Kies formaat'),
    wishlist: lang('Save to wishlist', 'Bewaar op je verlanglijst'),
    profileHead: lang('Tasting profile', 'Smaakprofiel'),
    highlightsHead: lang('Highlights', 'Kenmerken'),
    alt: {
      main: lang(`Harvest Deli ${nameEn}, a jar of raw Greek honey`, `Harvest Deli ${nameNl}, pot rauwe Griekse honing`),
      origin: lang(`${nameEn}, origin`, `${nameNl}, herkomst`),
      serving: lang(`${nameEn}, served`, `${nameNl}, geserveerd`)
    }
  };
  const X = EXPERIENCES[slug];
  const XE = X ? xlang(X, 'en') : null;
  if (X) { L.eyebrow = lang(XE.eyebrow, X.eyebrow); L.crumb = lang(XE.crumb, X.crumb); }
  const profileLabels = { aroma: ['Aroma', 'Aroma'], texture: ['Texture', 'Textuur'], sweetness: ['Sweetness', 'Zoetheid'], crystal: ['Crystallisation', 'Kristallisatie'], color: ['Colour', 'Kleur'] };
  const sizes = P.sizes.map(s => ({ ...s }));
  const sizeDesc = {
    '480g': lang(`Single-origin ${nameEn.toLowerCase()} from Greece.`, `Single-origin ${nameNl.toLowerCase()} uit Griekenland.`),
    '950g': lang('The large jar, for the devoted.', 'Het grote formaat, voor de liefhebber.')
  };
  if (X) Object.entries(X.sizeDesc).forEach(([k, v]) => { sizeDesc[k] = lang(XE.sizeDesc[k] || v, v); });
  const pick = (k) => Object.fromEntries(['en', 'nl'].map(l => [l, typeof k === 'function' ? k(l) : k[l]]));
  const perLang = (l) => ({
    name: L.name[l], h1: L.h1[l], eyebrow: L.eyebrow[l], crumb: L.crumb[l], lede: L.lede[l], desc: L.desc[l], origin: L.origin[l],
    tagline: L.tagline[l], stock: L.stock[l], sizeAria: L.sizeAria[l], wishlist: L.wishlist[l],
    profileHead: L.profileHead[l], highlightsHead: L.highlightsHead[l],
    profileLabels: Object.fromEntries(Object.entries(profileLabels).map(([k, v]) => [k, v[l === 'en' ? 0 : 1]])),
    profile: Object.fromEntries(Object.keys(profileLabels).map(k => [k, S[k][l === 'en' ? 0 : 1]])),
    highlights: B[l],
    sizeDesc: Object.fromEntries(Object.entries(sizeDesc).map(([k, v]) => [k, v[l]])),
    alt: { main: L.alt.main[l], origin: L.alt.origin[l], serving: L.alt.serving[l] }
  });
  const en = perLang('en'), nl = perLang('nl');
  /* The page dictionary: everything product-specific, both languages. */
  const dict = (x) => {
    const o = {
      'pp.name': x.name, 'pp.title_html': x.h1, 'pp.eyebrow_html': x.eyebrow, 'pp.crumb': x.crumb, 'pp.lede': x.lede,
      'pp.desc': x.desc, 'pp.origin': x.origin, 'pp.tagline': x.tagline, 'pp.stock': x.stock, 'pp.size.aria': x.sizeAria,
      'pp.wishlist': x.wishlist, 'pp.profile.head': x.profileHead, 'pp.hl.head': x.highlightsHead,
      'pp.alt.main': x.alt.main, 'pp.alt.origin': x.alt.origin, 'pp.alt.serving': x.alt.serving
    };
    Object.keys(x.profile).forEach(k => { o[`pp.profile.${k}.k`] = x.profileLabels[k]; o[`pp.profile.${k}`] = x.profile[k]; });
    x.highlights.forEach((h, i) => { o[`pp.hl.${i}`] = h; });
    Object.entries(x.sizeDesc).forEach(([k, v]) => { o[`pp.size.${k}`] = v; });
    return o;
  };
  const common = {
    en: { 'pp.thumb.product': 'Product photo', 'pp.thumb.origin': 'Origin photo', 'pp.thumb.serving': 'Serving photo', 'pp.qty': 'Quantity', 'pp.qty.dec': 'Decrease quantity', 'pp.qty.inc': 'Increase quantity', 'pp.trust.aria': 'Why buy from Harvest Deli' },
    nl: { 'pp.thumb.product': 'Productfoto', 'pp.thumb.origin': 'Herkomst', 'pp.thumb.serving': 'Geserveerd', 'pp.qty': 'Aantal', 'pp.qty.dec': 'Minder', 'pp.qty.inc': 'Meer', 'pp.trust.aria': 'Waarom Harvest Deli' }
  };
  const pageT = { en: { ...common.en, ...dict(en) }, nl: { ...common.nl, ...dict(nl) } };
  if (X) { Object.assign(pageT.en, experienceDict(XE)); Object.assign(pageT.nl, experienceDict(X)); }
  return { slug, v, P, S, X, sizes, en, nl, pageT, T: { en: { ...site.T.en, ...pageT.en }, nl: { ...site.T.nl, ...pageT.nl } } };
}

function productLd(d, canon) {
  const abs = (p) => SITE + p;
  const images = d.X ? d.X.gallery.map(g => abs(`/assets/products-images/${g.base}.webp`))
    : ['', '-origin', '-serving'].map(s => abs(`/assets/products-images/${d.slug}${s}.webp`));
  const name = 'Harvest Deli ' + d.nl.name;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ProductGroup',
    '@id': canon + '#product',
    url: canon,
    name,
    description: d.nl.lede,
    image: images,
    brand: { '@type': 'Brand', name: 'Harvest Deli' },
    manufacturer: { '@type': 'Organization', name: 'Harvest Deli' },
    category: 'Food, Beverages & Tobacco > Food Items > Condiments & Sauces > Honey',
    countryOfOrigin: 'GR',
    additionalProperty: d.X ? d.X.ld.map(([name, value]) => ({ '@type': 'PropertyValue', name, value })) : [
      { '@type': 'PropertyValue', name: 'Herkomst', value: 'Griekenland' },
      { '@type': 'PropertyValue', name: 'Oogst', value: '2025' },
      { '@type': 'PropertyValue', name: 'Proces', value: 'Koud geslingerd' }
    ],
    productGroupID: d.slug,
    variesBy: ['https://schema.org/size'],
    hasVariant: d.sizes.map((s, i) => ({
      '@type': 'Product',
      name: `${name} ${s.label.replace(/(\d)g$/, '$1 g')}`,
      sku: s.sku, mpn: s.sku, gtin13: s.gtin,
      size: s.label.replace(/(\d)g$/, '$1 g'),
      image: images[0],
      offers: {
        '@type': 'Offer',
        url: i === 0 ? canon : `${canon}?size=${s.id}`,
        priceCurrency: 'EUR',
        price: s.price.toFixed(2),
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: 'Harvest Deli' },
        areaServed: EU
      }
    }))
  }, null, 2);
}
function breadcrumbLd(d, canon) {
  return JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Collectie', item: SITE + '/shop.html' },
      { '@type': 'ListItem', position: 3, name: d.nl.name, item: canon }
    ]
  }, null, 2);
}

/* Apply the Dutch dictionary to every data-i18n element in the page, exactly
   as shared.js does in the browser, so the HTML is already Dutch. */
async function translateStatic(html, dictNl) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  const out = await page.evaluate((T) => {
    document.querySelectorAll('[data-i18n]').forEach(el => { const v = T[el.dataset.i18n]; if (v !== undefined) el.textContent = v; });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { const v = T[el.dataset.i18nHtml]; if (v !== undefined) el.innerHTML = v; });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.dataset.i18nAttr.split(',').forEach(pair => {
        const i = pair.indexOf(':'); if (i < 0) return;
        const v = T[pair.slice(i + 1).trim()]; if (v !== undefined) el.setAttribute(pair.slice(0, i).trim(), v);
      });
    });
    return '<!DOCTYPE html>\n' + document.documentElement.outerHTML + '\n';
  }, dictNl);
  await browser.close();
  return out;
}

/* ------------------------------------------------------------------ main */
const template = fs.readFileSync(path.join(ROOT, 'templates', 'product-honey.html'), 'utf8');
const v = (template.match(/\?v=(hd-\d{4}-\d{2}-\d{2}-\d+)/) || [])[1];
if (!v) throw new Error('geen cache-versie in de template');
const site = await siteData();
const shop = await shopifyPrices();

let fouten = 0;
for (const slug of HONEYS) {
  const d = buildData(slug, site, v);
  for (const s of d.sizes) {
    if (d.X && shop[s.sku] === undefined) { console.warn(`LET OP ${s.sku}: staat nog niet in Shopify, prijs €${s.price} is voorlopig`); continue; }
    if (shop[s.sku] !== s.price) { console.error(`PRIJS KLOPT NIET ${s.sku}: site ${s.price}, Shopify ${shop[s.sku]}`); fouten++; }
  }
  const canon = `${SITE}/products/${URL_SLUG[slug]}`;
  const [title, description] = SEO[slug];
  const img960 = `/assets/products-images/${slug}-960.webp?v=${v}`;
  const preload = d.X
    ? `<link rel="preload" as="image" href="${xsrc(d, d.X.gallery[0])}" imagesrcset="${xsrcset(d, d.X.gallery[0])}" imagesizes="(max-width: 900px) 90vw, min(44vw, 620px)" fetchpriority="high">`
    : `<link rel="preload" as="image" href="${img960}" imagesrcset="/assets/products-images/${slug}-640.webp?v=${v} 640w, ${img960} 960w, /assets/products-images/${slug}.webp?v=${v} 1228w" imagesizes="(max-width: 900px) 90vw, min(44vw, 620px)" fetchpriority="high">`;
  const fill = {
    TITLE: esc(title), DESCRIPTION: esc(description), CANONICAL: canon, SLUG: slug, NAME_NL: esc('Harvest Deli ' + d.nl.name),
    OG_IMAGE: d.X && d.X.og ? `${SITE}/assets/og/${d.X.og.file}` : `${SITE}/assets/products-images/${d.X ? d.X.gallery[0].base : slug}.webp`, PRICE_FROM: String(d.sizes[0].price),
    PRODUCT_LD: productLd(d, canon), BREADCRUMB_LD: breadcrumbLd(d, canon), PRELOAD: preload,
    PAGE_T: JSON.stringify(d.pageT).replace(/</g, '\\u003c'),
    HERO_AND_TASTING: heroAndTasting(d), STICKY: sticky(d), PAGE_SCRIPTS: pageScripts()
  };
  let html = template.replace(/\{\{([A-Z_0-9]+)\}\}/g, (m, k) => {
    if (!(k in fill)) throw new Error('onbekende plek ' + k);
    return fill[k];
  });
  if (d.X) html = applyExperience(html, d, d.X);
  html = await translateStatic(html, d.T.nl);
  /* A missing dictionary key would print "undefined" on the page: refuse. */
  const gat = html.match(/[>"]\s*undefined\s*[<"]/);
  if (gat) throw new Error(`${FILE(slug)}: "undefined" in de HTML (ontbrekende vertaalsleutel): ${html.slice(Math.max(0, gat.index - 120), gat.index + 20)}`);
  html = html.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n<!-- Generated by scripts/build-product-pages.mjs from templates/product-honey.html. Edit those, not this file. -->\n');
  fs.writeFileSync(path.join(ROOT, FILE(slug)), html);
  console.log('geschreven', FILE(slug).padEnd(28), d.nl.name.padEnd(26), d.sizes.map(s => `${s.label} €${s.price}`).join(', '));
}
if (fouten) { console.error(fouten + ' prijsverschil(len) met Shopify'); process.exit(1); }
