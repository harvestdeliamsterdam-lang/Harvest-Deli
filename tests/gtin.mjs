/* Regressietest: elke variant publiceert zijn eigen officiële GS1-GTIN.
 *
 * Sinds 16-09-2026 zijn de GS1-GTIN's (8721593944...) de enige geldige EAN's.
 * De tijdelijke 6156...-nummers mogen nergens meer verschijnen. Deze test
 * controleert per productroute de uiteindelijk gerenderde JSON-LD (na
 * JavaScript), en optioneel de Merchant-feed, tegen de tabel hieronder.
 *
 * De tabel komt uit de GS1-export 8720796306330-products.xlsx. Pas hem alleen
 * aan als GS1 een GTIN wijzigt.
 *
 * Draaien:  node tests/gtin.mjs [basis-url] [--feed]
 * --feed controleert ook /feeds/google-merchant.xml en -en.xml (alleen live
 * of preview; de feed is een Vercel-functie).
 */
import { chromium } from '/Users/thecreativitylab/Projects/products/node_modules/playwright/index.mjs';

const BASE = (process.argv.find((a) => /^https?:/.test(a)) || 'https://harvestdeli.nl').replace(/\/$/, '');
const FEED = process.argv.includes('--feed');

const GS1 = {
  'HD-HON-ACACIA-480': '8721593944008',   'HD-HON-ACACIA-950': '8721593944015',
  'HD-HON-ARBUTUS-480': '8721593944022',  'HD-HON-ARBUTUS-950': '8721593944039',
  'HD-HON-PINE-480': '8721593944046',     'HD-HON-PINE-950': '8721593944053',
  'HD-HON-OAK-480': '8721593944060',      'HD-HON-OAK-950': '8721593944077',
  'HD-HON-HEATHER-480': '8721593944084',  'HD-HON-HEATHER-950': '8721593944091',
  'HD-HON-CHESTNUT-480': '8721593944107', 'HD-HON-CHESTNUT-950': '8721593944114',
  'HD-HON-ORANGE-480': '8721593944121',   'HD-HON-ORANGE-950': '8721593944138',
  'HD-HON-FIR-480': '8721593944145',      'HD-HON-FIR-950': '8721593944152',
  'HD-HON-THYME-480': '8721593944169',    'HD-HON-THYME-950': '8721593944176',
  'HD-OIL-EVOO-500': '8721593944183',     'HD-TEA-MOUNTAIN-1': '8721593944190',
  'HD-TEA-CHAMOMILE-25': '8721593944206', 'HD-HERB-OREGANO-15': '8721593944213',
  'HD-HON-WILDFLOWER-480': '8721593944220', 'HD-HON-WILDFLOWER-950': '8721593944237', // owner, 31-10-2026
};

const ROUTES = {
  'chestnut-honey': ['HD-HON-CHESTNUT-480', 'HD-HON-CHESTNUT-950'],
  'vanilla-honey': ['HD-HON-FIR-480', 'HD-HON-FIR-950'],
  'acacia-honey': ['HD-HON-ACACIA-480', 'HD-HON-ACACIA-950'],
  'pine-honey': ['HD-HON-PINE-480', 'HD-HON-PINE-950'],
  'orange-blossom-honey': ['HD-HON-ORANGE-480', 'HD-HON-ORANGE-950'],
  'oak-honey': ['HD-HON-OAK-480', 'HD-HON-OAK-950'],
  'arbutus-honey': ['HD-HON-ARBUTUS-480', 'HD-HON-ARBUTUS-950'],
  'thyme-honey': ['HD-HON-THYME-480', 'HD-HON-THYME-950'],
  'heather-honey': ['HD-HON-HEATHER-480', 'HD-HON-HEATHER-950'],
  'wildflower-honey': ['HD-HON-WILDFLOWER-480', 'HD-HON-WILDFLOWER-950'],
  'wild-oregano': ['HD-HERB-OREGANO-15'],
  'extra-virgin-olive-oil': ['HD-OIL-EVOO-500'],
  'greek-mountain-tea': ['HD-TEA-MOUNTAIN-1'],
  'greek-chamomile-tea': ['HD-TEA-CHAMOMILE-25'],
};

function geldig(g) {
  if (!/^\d{13}$/.test(g)) return false;
  const s = [...g.slice(0, 12)].reduce((a, d, i) => a + Number(d) * (i % 2 ? 3 : 1), 0);
  return (10 - (s % 10)) % 10 === Number(g[12]);
}
const OUD = /\b6156\d{9}\b/g;

let fouten = 0;
const fout = (m) => { fouten++; console.log('  FOUT ' + m); };

// statische zelfcontrole van de tabel
const alle = Object.values(GS1);
if (new Set(alle).size !== alle.length || !alle.every(geldig)) fout('GS1-tabel in de test is zelf ongeldig');

console.log(`GTIN-TEST tegen ${BASE}${FEED ? ' (met feed)' : ''}`);
const browser = await chromium.launch();
for (const [route, skus] of Object.entries(ROUTES)) {
  const page = await browser.newPage();
  const js = [];
  page.on('pageerror', (e) => js.push(String(e).slice(0, 120)));
  const resp = await page.goto(`${BASE}/products/${route}`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  const html = await page.content();
  const blocks = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((s) => { try { return JSON.parse(s.textContent); } catch (e) { return { __stuk: true }; } }));
  await page.close();

  const voor = fouten;
  if (!resp || resp.status() !== 200) fout(`${route}: HTTP ${resp && resp.status()}`);
  if (blocks.some((b) => b.__stuk)) fout(`${route}: onleesbare JSON-LD`);
  const prod = blocks.filter((b) => b['@type'] === 'Product' || b['@type'] === 'ProductGroup');
  if (prod.length !== 1) fout(`${route}: ${prod.length} Product-blokken, verwacht 1`);
  const p = prod[0] || {};
  const varianten = p['@type'] === 'ProductGroup' ? (p.hasVariant || []) : [p];
  const gezien = varianten.map((v) => ({ sku: v.sku, gtin: v.gtin13 }));
  const verwacht = skus.map((s) => ({ sku: s, gtin: GS1[s] }));
  if (JSON.stringify(gezien) !== JSON.stringify(verwacht)) fout(`${route}: ${JSON.stringify(gezien)} ≠ ${JSON.stringify(verwacht)}`);
  if (new Set(gezien.map((v) => v.gtin)).size !== gezien.length) fout(`${route}: dezelfde GTIN op meerdere varianten`);
  const oud = html.match(OUD);
  if (oud) fout(`${route}: oude EAN in pagina: ${[...new Set(oud)].join(', ')}`);
  if (js.length) fout(`${route}: JS-fout ${js[0]}`);
  console.log(`${fouten === voor ? 'OK  ' : 'FOUT'} /products/${route.padEnd(24)} ${gezien.map((v) => `${v.sku}=${v.gtin}`).join('  ')}`);
}
await browser.close();

if (FEED) {
  for (const f of ['google-merchant.xml', 'google-merchant-en.xml']) {
    const r = await fetch(`${BASE}/feeds/${f}`, { headers: { 'Cache-Control': 'no-cache' } });
    const xml = await r.text();
    const items = xml.split('<item>').slice(1).map((it) => ({
      id: (it.match(/<g:id>(.*?)<\/g:id>/) || [])[1],
      gtin: (it.match(/<g:gtin>(.*?)<\/g:gtin>/) || [])[1],
      brand: (it.match(/<g:brand>(.*?)<\/g:brand>/) || [])[1],
      cond: (it.match(/<g:condition>(.*?)<\/g:condition>/) || [])[1],
      img: (it.match(/<g:image_link>(.*?)<\/g:image_link>/) || [])[1] || '',
    }));
    const voor = fouten;
    if (r.status !== 200) fout(`${f}: HTTP ${r.status}`);
    if (items.length !== alle.length) fout(`${f}: ${items.length} items, verwacht ${alle.length}`);
    for (const it of items) {
      if (it.gtin !== GS1[it.id]) fout(`${f}: ${it.id} gtin=${it.gtin}, verwacht ${GS1[it.id]}`);
      if (it.brand !== 'Harvest Deli') fout(`${f}: ${it.id} brand=${it.brand}`);
      if (it.cond !== 'new') fout(`${f}: ${it.id} condition=${it.cond}`);
      if (!it.img.startsWith('https://')) fout(`${f}: ${it.id} image_link niet https`);
    }
    if (new Set(items.map((i) => i.gtin)).size !== items.length) fout(`${f}: dubbele GTIN`);
    if (OUD.test(xml)) fout(`${f}: oude 6156-EAN in feed`);
    const rej = r.headers.get('x-feed-gtin-rejected');
    if (rej) fout(`${f}: Shopify levert nog ongeldige barcodes voor ${rej}`);
    console.log(`${fouten === voor ? 'OK  ' : 'FOUT'} ${f}: ${items.filter((i) => i.gtin === GS1[i.id]).length}/${alle.length} GTIN's correct`);
  }
}

console.log(fouten ? `${fouten} FOUT(EN)` : 'Alle GTIN\'s correct, geen oude 6156-EAN gevonden.');
process.exit(fouten ? 1 : 0);
