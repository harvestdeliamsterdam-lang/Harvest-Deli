/* Regressietest: kan elk product echt in het mandje, in elk formaat, in aantallen.
 *
 * Bewaakt de bug van september 2026. Een hardgecodeerde voorraadtabel in
 * inventory.js, nooit aan Shopify gekoppeld, blokkeerde stil verkoopbare
 * producten: sparrenhoning kon er helemaal niet in ("Uitverkocht"), heide
 * maximaal 2 potten, arbutus 3, tijm 5, en eikenhoning stond op "pre-order",
 * terwijl Shopify elke variant gewoon te koop had. Er kwam geen JavaScript-fout,
 * dus niets anders zag het.
 *
 * De test vraagt eerst aan Shopify welke varianten echt te koop zijn en
 * verwacht dan precies dat gedrag: te koop = erin, ook in aantallen;
 * niet te koop = geweigerd met "Uitverkocht".
 *
 * Draaien:  node tests/add-to-cart.mjs [basis-url]
 * Standaard https://harvestdeli.nl. Loopt altijd via /products/<slug>: de
 * honingpagina's lezen hun product uit die URL en vallen zonder die route terug
 * op kastanje. Lokaal dus alleen tegen een server die de rewrites uit vercel.json
 * toepast, niet tegen python3 -m http.server.
 */
import { chromium } from '/Users/thecreativitylab/Projects/products/node_modules/playwright/index.mjs';

const BASE = (process.argv[2] || 'https://harvestdeli.nl').replace(/\/$/, '');
const AANTAL = 4; // boven de oude plafonds van 2 en 3, en genoeg voor de korting per 3 potten

const SHOP = 'https://su08c4-v4.myshopify.com/api/2024-10/graphql.json';
const TOKEN = 'd3f835bc393675aeb243244e5475f3c6'; // publieke Storefront-sleutel, staat ook in commerce/config.js

/* size = de id die HD_CART bewaart; shopify = de Size-waarde in Shopify, als die afwijkt */
const PRODUCTEN = [
  { slug: 'chestnut',       route: 'chestnut-honey',         sizes: ['480g', '950g'] },
  { slug: 'fir-vanilla',    route: 'vanilla-honey',          sizes: ['480g', '950g'] },
  { slug: 'acacia',         route: 'acacia-honey',           sizes: ['480g', '950g'] },
  { slug: 'pine',           route: 'pine-honey',             sizes: ['480g', '950g'] },
  { slug: 'orange-blossom', route: 'orange-blossom-honey',   sizes: ['480g', '950g'] },
  { slug: 'oak',            route: 'oak-honey',              sizes: ['480g', '950g'] },
  { slug: 'arbutus',        route: 'arbutus-honey',          sizes: ['480g', '950g'] },
  { slug: 'thyme',          route: 'thyme-honey',            sizes: ['480g', '950g'] },
  { slug: 'heather',        route: 'heather-honey',          sizes: ['480g', '950g'] },
  { slug: 'oregano',        route: 'wild-oregano',           sizes: ['15g'] },
  { slug: 'olive-oil',      route: 'extra-virgin-olive-oil', sizes: ['500ml'] },
  { slug: 'mountain-tea',   route: 'greek-mountain-tea',     sizes: ['bag'], shopify: { bag: '1 bag' } },
  { slug: 'chamomile-tea',  route: 'greek-chamomile-tea',    sizes: ['25g'] },
];

const SCHERMEN = [['desktop', 1440, 900], ['mobiel', 393, 852]];

async function shopifyBeschikbaarheid() {
  const r = await fetch(SHOP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN },
    body: JSON.stringify({ query: '{ products(first: 50) { nodes { handle variants(first: 10) { nodes { availableForSale selectedOptions { name value } } } } } }' }),
  });
  const j = await r.json();
  const kaart = {};
  for (const p of j.data.products.nodes) {
    for (const v of p.variants.nodes) {
      const size = (v.selectedOptions.find((o) => o.name === 'Size') || {}).value;
      kaart[`${p.handle}|${size}`] = v.availableForSale;
    }
  }
  return kaart;
}

async function test(browser, prod, [scherm, w, h], kaart) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'nl-NL' });
  const page = await ctx.newPage();
  const jsFouten = [];
  page.on('pageerror', (e) => jsFouten.push(String(e).slice(0, 160)));

  const url = `${BASE}/products/${prod.route}`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  try {
    const c = page.locator('button:has-text("Alles accepteren")').first();
    if (await c.count()) await c.click({ timeout: 2500 });
  } catch (e) {}
  await page.evaluate(() => {
    window.__toasts = [];
    const orig = window.HD_toast;
    window.HD_toast = function (m) { window.__toasts.push(String(m)); return orig && orig.apply(this, arguments); };
  });

  const fouten = [];
  const teKoop = (size) => kaart[`${prod.slug}|${(prod.shopify && prod.shopify[size]) || size}`] !== false;
  const stuksVan = (size) => page.evaluate(({ slug, size }) =>
    ((window.HD_CART && window.HD_CART.items) || []).filter((i) => i.slug === slug && i.size === size).reduce((a, i) => a + i.qty, 0),
    { slug: prod.slug, size });

  // 1. een echte klik op de zichtbare knop, zoals een klant hem doet
  const knop = page.locator('[data-add-to-cart]:visible').first();
  if (!(await knop.count())) {
    fouten.push('geen zichtbare add-to-cart knop');
  } else {
    const standaard = (await knop.getAttribute('data-size')) || prod.sizes[0];
    /* Een uitverkochte maat staat sinds 30-09 als uitgeschakeld (aria-disabled,
       tekst Uitverkocht). Playwright klikt daar niet op; force klikt toch, zodat
       we zien dat de klik echt geweigerd wordt. */
    const uit = (await knop.getAttribute('aria-disabled')) === 'true';
    await knop.click({ timeout: 5000, force: uit }).catch((e) => fouten.push('klik faalt: ' + e.message.slice(0, 80)));
    await page.waitForTimeout(1200);
    const lade = await page.evaluate(() => {
      const el = document.querySelector('.cart-drawer, #cartDrawer, .cart-panel, [data-cart-drawer]');
      return el ? el.innerText.replace(/\s+/g, ' ') : '';
    });
    const n = await stuksVan(standaard);
    if (teKoop(standaard)) {
      if (n !== 1) fouten.push(`echte klik: ${n} stuks in mandje, verwacht 1`);
      if (!lade || /leeg|empty/i.test(lade)) fouten.push('mandje-lade blijft leeg na klik');
    } else if (n !== 0) {
      fouten.push(`echte klik: ${standaard} is niet te koop maar kwam toch in het mandje`);
    }
  }

  // 2. elk formaat, meerdere stuks
  const perSize = [];
  for (const size of prod.sizes) {
    const voor = await stuksVan(size);
    await page.evaluate(({ size, n }) => {
      const btn = document.querySelector('[data-add-to-cart]');
      btn.setAttribute('data-size', size);
      for (let i = 0; i < n; i++) btn.click();
    }, { size, n: AANTAL });
    await page.waitForTimeout(600);
    const erbij = (await stuksVan(size)) - voor;
    const verwacht = teKoop(size) ? AANTAL : 0;
    perSize.push(`${size}+${erbij}`);
    if (erbij !== verwacht) fouten.push(`${size}: ${erbij} erbij, verwacht ${verwacht}`);
  }

  // 3. voorraadregel en meldingen moeten kloppen met Shopify
  const regel = await page.evaluate(() => ((document.querySelector('.pd-stock') || {}).innerText || '').trim());
  const toasts = await page.evaluate(() => window.__toasts || []);
  const allesTeKoop = prod.sizes.every(teKoop);
  if (/pre-order/i.test(regel)) fouten.push(`voorraadregel zegt "${regel}"`);
  if (allesTeKoop && /uitverkocht|sold out/i.test(regel)) fouten.push(`voorraadregel zegt "${regel}" terwijl Shopify alles te koop heeft`);
  if (allesTeKoop && toasts.some((t) => /uitverkocht|sold out|slechts|only \d/i.test(t))) {
    fouten.push('melding: ' + toasts.filter((t) => /uitverkocht|sold out|slechts|only/i.test(t))[0]);
  }
  if (jsFouten.length) fouten.push('JS: ' + jsFouten[0]);

  await ctx.close();
  return { scherm, perSize: perSize.join(' '), regel, fouten };
}

const kaart = await shopifyBeschikbaarheid();
const nietTeKoop = Object.entries(kaart).filter(([, v]) => v === false).map(([k]) => k);
console.log(`ADD-TO-CART tegen ${BASE}`);
console.log(`Shopify: ${Object.keys(kaart).length} varianten, niet te koop: ${nietTeKoop.length ? nietTeKoop.join(', ') : 'geen'}`);
console.log('-'.repeat(100));

const browser = await chromium.launch();
let kapot = 0;
for (const prod of PRODUCTEN) {
  for (const s of SCHERMEN) {
    const r = await test(browser, prod, s, kaart);
    if (r.fouten.length) kapot++;
    console.log(`${r.fouten.length ? 'FOUT' : 'OK  '} ${prod.slug.padEnd(16)} ${r.scherm.padEnd(8)} ${r.perSize.padEnd(18)} ${r.regel.slice(0, 40).padEnd(42)}${r.fouten.length ? r.fouten.join(' | ') : ''}`);
  }
}
await browser.close();
console.log('-'.repeat(100));
console.log(kapot ? `${kapot} van ${PRODUCTEN.length * SCHERMEN.length} FOUT` : `Alle ${PRODUCTEN.length} producten gaan in elk formaat en in aantallen het mandje in.`);
process.exit(kapot ? 1 : 0);
