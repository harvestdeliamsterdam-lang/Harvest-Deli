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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.argv[2] || 'http://localhost:4400').replace(/\/$/, '');
const SITE = 'https://harvestdeli.nl';
const SHOPIFY = { domain: 'su08c4-v4.myshopify.com', token: 'd3f835bc393675aeb243244e5475f3c6', version: '2026-07' };

const HONEYS = ['chestnut', 'fir-vanilla', 'acacia', 'pine', 'orange-blossom', 'oak', 'arbutus', 'thyme', 'heather'];
const FILE = (slug) => slug === 'chestnut' ? 'product.html' : `product-${slug}.html`;
const URL_SLUG = {
  chestnut: 'chestnut-honey', 'fir-vanilla': 'vanilla-honey', acacia: 'acacia-honey', pine: 'pine-honey',
  'orange-blossom': 'orange-blossom-honey', oak: 'oak-honey', arbutus: 'arbutus-honey', thyme: 'thyme-honey', heather: 'heather-honey'
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
    <div class="pd-gallery" id="pdGallery">
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
        <button type="button" class="pdg-thumb active" data-slide="0" aria-label="${esc(d.T.nl['pp.thumb.product'] || 'Productfoto')}" data-i18n-attr="aria-label:pp.thumb.product"><img src="${img('', 640)}" width="640" height="1147" alt="" loading="lazy"></button>
        <button type="button" class="pdg-thumb" data-slide="1" aria-label="Herkomst" data-i18n-attr="aria-label:pp.thumb.origin"><img src="${img('-origin', 640)}" width="640" height="1147" alt="" loading="lazy"></button>
        <button type="button" class="pdg-thumb" data-slide="2" aria-label="Geserveerd" data-i18n-attr="aria-label:pp.thumb.serving"><img src="${img('-serving', 640)}" width="640" height="1147" alt="" loading="lazy"></button>
      </div>
    </div>

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

      <ul class="pd-trust" aria-label="Waarom Harvest Deli" data-i18n-attr="aria-label:pp.trust.aria">
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="M9 14.5 7.5 21l4.5-2.4L16.5 21 15 14.5"/></svg><span data-i18n="product.trust.q1">${esc(d.T.nl['product.trust.q1'])}</span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.7 2.6 4 5.6 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.6-4-9s1.3-6.4 4-9z"/></svg><span data-i18n="product.trust.q2">${esc(d.T.nl['product.trust.q2'])}</span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg><span data-i18n="product.trust.q3">${esc(d.T.nl['product.trust.q3'])}</span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19c3-4 7-7 11-8"/></svg><span data-i18n="product.trust.q4">${esc(d.T.nl['product.trust.q4'])}</span></li>
      </ul>

      <div class="pd-acc">
        <details open>
          <summary><span data-i18n="product.acc.desc">${esc(d.T.nl['product.acc.desc'])}</span><span class="acc-icon" aria-hidden="true"></span></summary>
          <div class="acc-body" data-i18n="pp.desc">${esc(d.nl.desc)}</div>
        </details>
        <details>
          <summary><span data-i18n="product.acc.ing">${esc(d.T.nl['product.acc.ing'])}</span><span class="acc-icon" aria-hidden="true"></span></summary>
          <div class="acc-body" data-i18n="product.acc.ingBody">${esc(d.T.nl['product.acc.ingBody'])}</div>
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

<!-- ============ Tasting: this honey's own profile ============ -->
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
</section>`;
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
<div class="sticky-buy" id="stickyBuy">
  <div class="sb-thumb"><img src="/assets/products-images/${d.slug}-640.webp?v=${d.v}" width="640" height="1147" alt="" loading="lazy"></div>
  <div class="sb-meta">
    <div class="sb-name" data-i18n="pp.name">${esc(d.nl.name)}</div>
    <div class="sb-price" id="sbPrice">&euro;${money(d.sizes[0].price)} &middot; ${d.sizes[0].label}</div>
  </div>
  <button data-add-to-cart="${d.slug}" data-size="${d.sizes[0].id}" data-i18n="product.sticky.add">${esc(d.T.nl['product.sticky.add'])}</button>
</div>`;
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
  const profileLabels = { aroma: ['Aroma', 'Aroma'], texture: ['Texture', 'Textuur'], sweetness: ['Sweetness', 'Zoetheid'], crystal: ['Crystallisation', 'Kristallisatie'], color: ['Colour', 'Kleur'] };
  const sizes = P.sizes.map(s => ({ ...s }));
  const sizeDesc = {
    '480g': lang(`Single-origin ${nameEn.toLowerCase()} from Greece.`, `Single-origin ${nameNl.toLowerCase()} uit Griekenland.`),
    '950g': lang('The large jar, for the devoted.', 'Het grote formaat, voor de liefhebber.')
  };
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
  return { slug, v, P, S, sizes, en, nl, pageT, T: { en: { ...site.T.en, ...pageT.en }, nl: { ...site.T.nl, ...pageT.nl } } };
}

function productLd(d, canon) {
  const abs = (p) => SITE + p;
  const images = ['', '-origin', '-serving'].map(s => abs(`/assets/products-images/${d.slug}${s}.webp`));
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
    additionalProperty: [
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
    if (shop[s.sku] !== s.price) { console.error(`PRIJS KLOPT NIET ${s.sku}: site ${s.price}, Shopify ${shop[s.sku]}`); fouten++; }
  }
  const canon = `${SITE}/products/${URL_SLUG[slug]}`;
  const [title, description] = SEO[slug];
  const img960 = `/assets/products-images/${slug}-960.webp?v=${v}`;
  const preload = `<link rel="preload" as="image" href="${img960}" imagesrcset="/assets/products-images/${slug}-640.webp?v=${v} 640w, ${img960} 960w, /assets/products-images/${slug}.webp?v=${v} 1228w" imagesizes="(max-width: 900px) 90vw, min(44vw, 620px)" fetchpriority="high">`;
  const fill = {
    TITLE: esc(title), DESCRIPTION: esc(description), CANONICAL: canon, SLUG: slug, NAME_NL: esc('Harvest Deli ' + d.nl.name),
    OG_IMAGE: `${SITE}/assets/products-images/${slug}.webp`, PRICE_FROM: String(d.sizes[0].price),
    PRODUCT_LD: productLd(d, canon), BREADCRUMB_LD: breadcrumbLd(d, canon), PRELOAD: preload,
    PAGE_T: JSON.stringify(d.pageT).replace(/</g, '\\u003c'),
    HERO_AND_TASTING: heroAndTasting(d), STICKY: sticky(d), PAGE_SCRIPTS: pageScripts()
  };
  let html = template.replace(/\{\{([A-Z_0-9]+)\}\}/g, (m, k) => {
    if (!(k in fill)) throw new Error('onbekende plek ' + k);
    return fill[k];
  });
  html = await translateStatic(html, d.T.nl);
  /* A missing dictionary key would print "undefined" on the page: refuse. */
  const gat = html.match(/[>"]\s*undefined\s*[<"]/);
  if (gat) throw new Error(`${FILE(slug)}: "undefined" in de HTML (ontbrekende vertaalsleutel): ${html.slice(Math.max(0, gat.index - 120), gat.index + 20)}`);
  html = html.replace('<!DOCTYPE html>\n', '<!DOCTYPE html>\n<!-- Generated by scripts/build-product-pages.mjs from templates/product-honey.html. Edit those, not this file. -->\n');
  fs.writeFileSync(path.join(ROOT, FILE(slug)), html);
  console.log('geschreven', FILE(slug).padEnd(28), d.nl.name.padEnd(26), d.sizes.map(s => `${s.label} €${s.price}`).join(', '));
}
if (fouten) { console.error(fouten + ' prijsverschil(len) met Shopify'); process.exit(1); }
