/* Regressietest voor de checkout, per land en per schermformaat.
 *
 * Sinds 28-09-2026 gaat de klant van het mandje rechtstreeks naar de
 * Shopify-checkout (de vijfstaps-wizard op checkout.html is weg). Deze test
 * loopt dat pad zoals een klant: productpagina (geneste route) > in het mandje >
 * land kiezen in het mandje > "Naar de afrekening" > Shopify.
 *
 * Bewaakt:
 *  1. de knop in het mandje leidt naar Shopify, ook vanaf /products/<slug>
 *     (eerder gaf een relatieve link daar een 404);
 *  2. Shopify opent met het gekozen land (eerder stond het adresland vast op
 *     Netherlands en weigerde Shopify Duitse postcodes);
 *  3. het verzendtarief bij Shopify klopt met het land;
 *  4. de cookiekeuze reist mee (_cs in de checkout-URL);
 *  5. terug uit de checkout is het mandje nog gevuld.
 *
 *   node tests/checkout-countries.mjs [basis-url]      standaard http://localhost:4400
 *
 * Maakt echte carts bij Shopify en vult een testadres in (example.com),
 * maar plaatst nooit een bestelling.
 */
import { chromium } from '/Users/thecreativitylab/Projects/products/node_modules/playwright/index.mjs';

const BASE = (process.argv[2] || 'http://localhost:4400').replace(/\/$/, '');

const LANDEN = [
  { code: 'NL', locale: 'nl-NL', stad: 'Amsterdam', zip: '1012 LG', straat: 'Damrak 1', tarief: '5,95' },
  { code: 'BE', locale: 'nl-BE', stad: 'Antwerpen', zip: '2000', straat: 'Meir 10', tarief: '6,95' },
  { code: 'DE', locale: 'de-DE', stad: 'Berlin', zip: '10435', straat: 'Kastanienallee 12', tarief: '9,95' },
];
const SCHERMEN = [['mobiel', 393, 852], ['tablet', 768, 1024], ['desktop', 1440, 900]];

/* Testproduct: de eerste honing die Shopify nu echt verkoopt. Een vaste keuze
   (eerst kastanje) liet de test falen zodra die honing uitverkocht was. */
const KANDIDATEN = [['acacia', 'acacia-honey'], ['thyme', 'thyme-honey'], ['pine', 'pine-honey'], ['chestnut', 'chestnut-honey'], ['oak', 'oak-honey']];
const TEST_ROUTE = await (async () => {
  const r = await fetch('https://su08c4-v4.myshopify.com/api/2026-07/graphql.json', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': 'd3f835bc393675aeb243244e5475f3c6' },
    body: JSON.stringify({ query: '{ products(first: 50) { nodes { handle availableForSale } } }' }) });
  const te = new Set((await r.json()).data.products.nodes.filter(n => n.availableForSale).map(n => n.handle));
  const k = KANDIDATEN.find(([h]) => te.has(h));
  if (!k) throw new Error('geen enkele testhoning te koop');
  return k[1];
})();

async function flow(browser, land, [, w, h]) {
  const ctx = await browser.newContext({ locale: land.locale, viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const r = {};

  await page.goto(`${BASE}/products/${TEST_ROUTE}`, { waitUntil: 'networkidle' });
  await page.locator('[data-cb-action="accept"]').click({ timeout: 4000 }).catch(() => {});
  await page.locator('.pd-cta[data-add-to-cart]').first().click();
  await page.waitForTimeout(1200);
  if (!(await page.locator('#cartDrawer.open').count())) await page.evaluate(() => window.HD_openCart());
  await page.waitForTimeout(600);

  /* Land kiezen zoals de klant: de keuzelijst in het mandje. */
  const knop = page.locator('#hdCartShip .hd-cc-btn').first();
  if (await knop.count()) {
    await knop.click().catch(() => {});
    await page.locator(`#hdCartShip .hd-cc-opt[data-code="${land.code}"]`).first().click().catch(() => {});
  } else await page.evaluate((c) => window.HD_SHIPPING && window.HD_SHIPPING.setCountry(c), land.code);
  await page.waitForTimeout(400);
  r.gekozen = await page.evaluate(() => window.HD_SHIPPING && window.HD_SHIPPING.country());

  await Promise.all([
    page.waitForURL(/\/checkouts\/cn\//, { timeout: 30000 }),
    page.locator('#cartDrawer .cart-checkout').click()
  ]).catch(() => {});
  r.opShopify = /\/checkouts\/cn\//.test(page.url());
  r.consent = /[?&]_cs=/.test(page.url());
  await page.waitForTimeout(3000);

  /* Adres invullen bij Shopify om de verzendtarieven te zien. */
  const vul = async (naam, waarde) => {
    const el = page.locator(`input[name="${naam}"]:visible`).first();
    if (await el.count()) await el.fill(waarde).catch(() => {});
  };
  r.landVeld = await page.locator('select[name="countryCode"]').first().inputValue().catch(() => null);
  await vul('email', 'test-checkout@example.com');
  await vul('firstName', 'Test'); await vul('lastName', 'Koper');
  await vul('address1', land.straat); await vul('postalCode', land.zip); await vul('city', land.stad);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(6000);
  const tekst = await page.evaluate(() => document.body.innerText).catch(() => '');
  r.zipFout = /valid ZIP|valid postal|ungültige|ongeldige postcode|Voer een geldige postcode/i.test(tekst);
  r.tarief = new RegExp('€\\s?' + land.tarief.replace(',', ',')).test(tekst);   // Shopify zet een harde spatie na €
  r.betaalt = /iDEAL|Bancontact|Creditcard|Credit card|Kaart|Klarna|PayPal/i.test(tekst);

  await page.goBack({ waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(1500);
  r.mandjeNaTerug = await page.evaluate(() => (window.HD_CART && window.HD_CART.count()) || 0).catch(() => 0);
  await ctx.close();
  return r;
}

const browser = await chromium.launch();
let fouten = 0;
console.log(`CHECKOUT-REGRESSIE tegen ${BASE} (testproduct /products/${TEST_ROUTE})\n${'='.repeat(100)}`);
console.log('land scherm    gekozen shopify consent landveld zipfout tarief betaalopties terug-mandje uitkomst');
console.log('-'.repeat(100));
for (const land of LANDEN) {
  for (const scherm of SCHERMEN) {
    let r;
    try { r = await flow(browser, land, scherm); }
    catch (e) { console.log(`${land.code} ${scherm[0]}: crash ${String(e).slice(0, 80)}`); fouten++; continue; }
    const ok = r.gekozen === land.code && r.opShopify && r.consent && r.landVeld === land.code &&
               !r.zipFout && r.tarief && r.betaalt && r.mandjeNaTerug > 0;
    if (!ok) fouten++;
    console.log(`${land.code}   ${scherm[0].padEnd(10)}${String(r.gekozen).padEnd(8)}${String(r.opShopify).padEnd(8)}${String(r.consent).padEnd(8)}` +
      `${String(r.landVeld).padEnd(9)}${String(r.zipFout).padEnd(8)}${String(r.tarief).padEnd(7)}${String(r.betaalt).padEnd(13)}` +
      `${String(r.mandjeNaTerug).padEnd(12)}${ok ? 'OK' : 'FOUT'}`);
  }
}
console.log('-'.repeat(100));
console.log(fouten === 0 ? 'Alle landen en schermformaten correct.' : `${fouten} scenario(s) FOUT.`);
await browser.close();
process.exit(fouten ? 1 : 0);
