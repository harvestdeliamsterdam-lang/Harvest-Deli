/* Regressietest: elke productpagina klopt al in de HTML, vóór JavaScript.
 *
 * Tot 28-09-2026 was elke honingpagina de kastanjepagina ("Chestnut Honey",
 * €18) die JavaScript daarna omschreef. Google, Merchant Center en trage
 * telefoons zagen dus bij elke honing kastanje. De vier voorraadkastpagina's
 * waren Engels op een Nederlandse site.
 *
 * Leest de ruwe HTML zoals de server hem stuurt en controleert per product:
 * H1, prijs, maten + SKU's + GTIN's, Product/ProductGroup-schema, canonical,
 * og:url, taal, geen tekst van een ander product, geen Engelse knoppen, geen
 * gezondheidsclaims. Prijzen worden vergeleken met Shopify.
 *
 *   node tests/product-html.mjs [basis-url]      standaard http://localhost:4400
 */
const BASE = (process.argv[2] || 'http://localhost:4400').replace(/\/$/, '');
const SHOP = 'https://su08c4-v4.myshopify.com/api/2026-07/graphql.json';
const TOKEN = 'd3f835bc393675aeb243244e5475f3c6';

const PAGES = [
  { route: 'chestnut-honey', h1: 'Kastanjehoning', skus: ['HD-HON-CHESTNUT-480', 'HD-HON-CHESTNUT-950'] },
  { route: 'vanilla-honey', h1: 'Sparrenhoning Vanille', skus: ['HD-HON-FIR-480', 'HD-HON-FIR-950'] },
  { route: 'acacia-honey', h1: 'Acaciahoning', skus: ['HD-HON-ACACIA-480', 'HD-HON-ACACIA-950'] },
  { route: 'pine-honey', h1: 'Dennenhoning', skus: ['HD-HON-PINE-480', 'HD-HON-PINE-950'] },
  { route: 'orange-blossom-honey', h1: 'Sinaasappelbloesemhoning', skus: ['HD-HON-ORANGE-480', 'HD-HON-ORANGE-950'] },
  { route: 'oak-honey', h1: 'Eikenhoning', skus: ['HD-HON-OAK-480', 'HD-HON-OAK-950'] },
  { route: 'arbutus-honey', h1: 'Arbutushoning', skus: ['HD-HON-ARBUTUS-480', 'HD-HON-ARBUTUS-950'] },
  { route: 'thyme-honey', h1: 'Tijmhoning', skus: ['HD-HON-THYME-480', 'HD-HON-THYME-950'] },
  { route: 'heather-honey', h1: 'Heidehoning', skus: ['HD-HON-HEATHER-480', 'HD-HON-HEATHER-950'] },
  { route: 'wild-oregano', h1: 'Wilde Griekse oregano', skus: ['HD-HERB-OREGANO-15'] },
  { route: 'extra-virgin-olive-oil', h1: 'Extra vierge olijfolie', skus: ['HD-OIL-EVOO-500'] },
  { route: 'greek-mountain-tea', h1: 'Griekse Bergthee', skus: ['HD-TEA-MOUNTAIN-1'] },
  { route: 'greek-chamomile-tea', h1: 'Griekse Kamillethee', skus: ['HD-TEA-CHAMOMILE-25'] }
];
/* Woorden die alleen bij één product horen. */
const OWN = {
  'chestnut-honey': /kastanje|chestnut/i, 'vanilla-honey': /sparrenhoning|fir honey/i, 'acacia-honey': /acacia/i,
  'pine-honey': /dennenhoning|pine honey/i, 'orange-blossom-honey': /sinaasappel|orange blossom/i, 'oak-honey': /eikenhoning|oak honey/i,
  'arbutus-honey': /arbutus/i, 'thyme-honey': /tijmhoning|thyme honey/i, 'heather-honey': /heidehoning|heather honey/i,
  'wild-oregano': /oregano/i, 'extra-virgin-olive-oil': /olijfolie|olive oil/i, 'greek-mountain-tea': /bergthee|mountain tea/i,
  'greek-chamomile-tea': /kamille|chamomile/i
};
const ENGLISH_UI = />\s*(Add to the cellar|Add to the pantry|Express checkout|Save to wishlist|Description|Ingredients|Shipping|In stock[^<]*|The Tasting|What you taste, slowly\.|Quietly, carefully made\.)\s*</;
const CLAIMS = /immuun|immune system|nachtrust|restful sleep|verzacht[a-z]* (voor )?(de )?keel|soothes (the )?throat|spijsvertering|supports digestion|antibacter|bloedcirculatie|luchtwegen|respiratory|kalmerend|calming|rustgevend|soothing|geschikt voor kinderen|suitable for children|rijk aan mineralen|rich in minerals|mineraalrijk/i;

let fouten = 0;
const fout = (m) => { console.log('  FOUT ' + m); fouten++; };

const shop = {};
{
  const r = await fetch(SHOP, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': TOKEN },
    body: JSON.stringify({ query: '{ products(first: 50) { nodes { variants(first: 10) { nodes { sku barcode price { amount } } } } } }' }) });
  const j = await r.json();
  j.data.products.nodes.forEach(p => p.variants.nodes.forEach(v => { shop[v.sku] = v; }));
}

for (const p of PAGES) {
  const res = await fetch(`${BASE}/products/${p.route}`);
  const html = await res.text();
  const head = html.slice(0, html.indexOf('</head>'));
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>')).replace(/<script[\s\S]*?<\/script>/g, '');
  const h1 = ((main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
  const lang = (html.match(/<html[^>]*lang="([^"]+)"/) || [])[1];
  const canon = (head.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  const ogUrl = (head.match(/<meta property="og:url" content="([^"]+)"/) || [])[1];
  const price = ((main.match(/id="productPrice">([^<]+)</) || [])[1] || '').replace('&euro;', '€').trim();
  const lds = [...head.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => { try { return JSON.parse(m[1]); } catch (e) { return { ERR: m[1].slice(0, 60) }; } });
  const prod = lds.flatMap(x => x['@graph'] || [x]).find(x => x['@type'] === 'Product' || x['@type'] === 'ProductGroup');
  const offers = !prod ? [] : prod.hasVariant ? prod.hasVariant.map(v => ({ sku: v.sku, gtin: v.gtin13, price: v.offers && v.offers.price }))
    : [{ sku: prod.sku || (prod.offers && prod.offers.sku), gtin: prod.gtin13 || prod.gtin, price: prod.offers && prod.offers.price }];

  console.log(`${res.status === 200 ? '' : 'HTTP ' + res.status + ' '}/products/${p.route}  h1="${h1}"  prijs=${price}  schema=${prod ? prod['@type'] + '/' + offers.length : 'geen'}`);
  if (res.status !== 200) fout('pagina niet bereikbaar');
  if (!h1.startsWith(p.h1)) fout(`H1 "${h1}" begint niet met "${p.h1}"`);
  if (lang !== 'nl') fout('html lang is ' + lang);
  if (canon !== `https://harvestdeli.nl/products/${p.route}`) fout('canonical ' + canon);
  if (ogUrl !== canon) fout('og:url ' + ogUrl);
  if (!prod) fout('geen Product-schema in de HTML');
  const first = shop[p.skus[0]];
  if (!first) fout('SKU onbekend bij Shopify ' + p.skus[0]);
  else if (price !== '€' + (Number(first.price.amount) % 1 ? Number(first.price.amount).toFixed(2) : String(Number(first.price.amount))).replace('.', ',')) fout(`prijs ${price} ≠ Shopify €${first.price.amount}`);
  for (const sku of p.skus) {
    const o = offers.find(x => x.sku === sku);
    const s = shop[sku];
    if (!o) { fout('schema mist ' + sku); continue; }
    if (s && Number(o.price) !== Number(s.price.amount)) fout(`schema-prijs ${sku} ${o.price} ≠ Shopify ${s.price.amount}`);
    if (s && o.gtin !== s.barcode) fout(`schema-GTIN ${sku} ${o.gtin} ≠ Shopify ${s.barcode}`);
    if (!main.includes(`data-sku="${sku}"`) && p.skus.length > 1) fout('maatkeuze mist ' + sku);
  }
  const text = main.replace(/<[^>]+>/g, ' ');
  const leaks = Object.entries(OWN).filter(([r]) => r !== p.route).filter(([, re]) => re.test(h1 + ' ' + text.slice(0, 6000)) && !re.test(p.h1)).map(([r]) => r);
  const buyBox = main.slice(main.indexOf('id="buy"'), main.indexOf('</section>', main.indexOf('id="buy"')));
  const leaksBuy = Object.entries(OWN).filter(([r]) => r !== p.route).filter(([, re]) => re.test(buyBox.replace(/<[^>]+>/g, ' '))).map(([r]) => r);
  if (leaksBuy.length) fout('tekst van een ander product in het koopblok: ' + leaksBuy.join(', '));
  const eng = main.match(ENGLISH_UI);
  if (eng) fout('Engelse tekst in de Nederlandse HTML: ' + eng[1]);
  const claim = (main + head).match(CLAIMS);
  if (claim) fout('gezondheidsclaim: ' + claim[0]);
  if (leaks.length && !leaksBuy.length) console.log('  (andere producten genoemd buiten het koopblok, bv. aanbevelingen: ' + leaks.join(', ') + ')');
}

console.log(fouten ? `\n${fouten} fout(en).` : '\nAlle productpagina\'s kloppen al in de HTML.');
process.exit(fouten ? 1 : 0);
