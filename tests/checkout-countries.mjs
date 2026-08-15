/* Regressietest voor de checkout, per land en per schermformaat.
 *
 * Bewaakt twee dingen die eerder stilletjes braken:
 *  1. "Continue to checkout" vanaf een GENESTE productroute (/products/<slug>)
 *     gaf een 404 omdat de link relatief was.
 *  2. Een niet-Nederlandse klant kon niet bestellen: het adresland stond
 *     hardgecodeerd op Netherlands, waardoor Shopify de postcode weigerde met
 *     "Enter a valid ZIP / postal code for Netherlands".
 *
 * Draaien:  node tests/checkout-countries.mjs [basis-url]
 * Standaard https://harvestdeli.nl
 *
 * Let op: dit maakt echte carts aan bij Shopify (geen orders, geen betaling).
 */
import { chromium } from '/Users/thecreativitylab/Projects/products/node_modules/playwright/index.mjs';

const BASE = process.argv[2] || 'https://harvestdeli.nl';

const LANDEN = [
  { code: 'NL', locale: 'nl-NL', naam: 'Netherlands', stad: 'Amsterdam', zip: '1012LG',
    straat: 'Damrak 1', tel: '0612345678', tarief: 5.95 },
  { code: 'DE', locale: 'de-DE', naam: 'Germany', stad: 'Berlin', zip: '10435',
    straat: 'Kastanienallee 12', tel: '015123456789', tarief: 9.95 },
  { code: 'IT', locale: 'it-IT', naam: 'Italy', stad: 'Milano', zip: '20121',
    straat: 'Via Dante 5', tel: '3331234567', tarief: 12.95 },
];

const SCHERMEN = [['mobiel', 393, 852], ['tablet', 768, 1024], ['desktop', 1440, 900]];

const CART = [{ slug: 'chestnut', size: '480g', qty: 1, price: 18, name: 'Chestnut Honey' }];

async function flow(browser, land, [snaam, w, h]) {
  const ctx = await browser.newContext({
    locale: land.locale, viewport: { width: w, height: h },
    timezoneId: land.code === 'DE' ? 'Europe/Berlin' : land.code === 'IT' ? 'Europe/Rome' : 'Europe/Amsterdam',
  });
  const page = await ctx.newPage();
  const verstuurd = [];
  page.on('response', async (r) => {
    if (r.url().includes('myshopify.com/api/') && r.request().method() === 'POST') {
      let req = null;
      try { req = r.request().postData(); } catch (e) {}
      if (req && req.includes('cartCreate')) {
        let res = null; try { res = await r.text(); } catch (e) {}
        verstuurd.push({
          land: (req.match(/"country":"([^"]*)"/) || [])[1],
          code: (req.match(/"countryCode":"([^"]*)"/) || [])[1],
          schoon: (res || '').includes('"userErrors":[]'),
        });
      }
    }
  });

  // 1. start op een GENESTE productroute, daar zat de 404
  await page.goto(`${BASE}/products/chestnut-honey`, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.evaluate((c) => localStorage.setItem('hd-cart-v1', JSON.stringify(c)), CART);
  try {
    const c = page.locator('button:has-text("Alles accepteren")').first();
    if (await c.count()) await c.click({ timeout: 2500 });
  } catch (e) {}
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2500);

  // 2. de checkout-link moet absoluut zijn en niet 404'en
  const href = await page.evaluate(() => {
    const a = document.querySelector('.cart-checkout');
    return a ? a.getAttribute('href') : null;
  });
  const linkOk = href === '/checkout.html';

  // 3. door de wizard, zonder het landveld aan te raken
  await page.goto(`${BASE}/checkout.html`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  await page.locator('[data-wz-next][data-step1]').first().click().catch(() => {});
  await page.waitForTimeout(900);
  const landStandaard = await page.inputValue('#ckCountry').catch(() => null);

  for (const [sel, val] of [['#ckFirst', 'Test'], ['#ckLast', 'Koper'],
    ['#ckEmail', 'test@example.com'], ['#ckPhone', land.tel],
    ['#ckAddr1', land.straat], ['#ckCity', land.stad], ['#ckPostcode', land.zip]]) {
    await page.fill(sel, val).catch(() => {});
  }
  for (let i = 0; i < 4; i++) {
    const b = page.locator('.wz-step:not([hidden]) [data-wz-next]').first();
    if (!(await b.count())) break;
    await b.click().catch(() => {});
    await page.waitForTimeout(1200);
  }
  await page.locator('[data-wz-place]').first().click().catch(() => {});
  await page.waitForTimeout(9000);

  // 4. de betaalstap bij Shopify moet het adres accepteren
  const tekst = await page.evaluate(() => document.body.innerText).catch(() => '');
  const zipFout = /valid ZIP|valid postal|ungültige|ongeldige postcode/i.test(tekst);
  const opShopify = /myshopify\.com\/checkouts|\/checkouts\/cn\//.test(page.url());
  const betaalt = ['iDeal', 'Bancontact', 'Card', 'Kreditkarte', 'PayPal'].some((b) => tekst.includes(b));
  const tarief = (tekst.match(/Verzending[\s\S]{0,60}?€\s?([\d.,]+)/) || [])[1];

  await ctx.close();
  const stuur = verstuurd[verstuurd.length - 1] || {};
  return {
    linkOk, href, landStandaard,
    verstuurdLand: stuur.land, verstuurdCode: stuur.code, cartSchoon: stuur.schoon,
    opShopify, zipFout, betaalt, tarief,
  };
}

const browser = await chromium.launch();
let fouten = 0;
console.log(`CHECKOUT-REGRESSIE tegen ${BASE}\n${'='.repeat(104)}`);
console.log('land scherm    checkoutlink  landveld      verstuurd      zipfout  shopify  betaalopties  tarief  uitkomst');
console.log('-'.repeat(104));

for (const land of LANDEN) {
  for (const scherm of SCHERMEN) {
    let r;
    try { r = await flow(browser, land, scherm); }
    catch (e) { console.log(`${land.code} ${scherm[0]}: crash ${String(e).slice(0, 60)}`); fouten++; continue; }
    const ok = r.linkOk && r.landStandaard === land.naam && r.verstuurdLand === land.naam &&
               r.verstuurdCode === land.code && r.cartSchoon && r.opShopify && !r.zipFout && r.betaalt;
    if (!ok) fouten++;
    console.log(
      `${land.code}   ${scherm[0].padEnd(10)}${String(r.linkOk).padEnd(14)}` +
      `${String(r.landStandaard).padEnd(14)}${String(r.verstuurdLand).padEnd(15)}` +
      `${String(r.zipFout).padEnd(9)}${String(r.opShopify).padEnd(9)}` +
      `${String(r.betaalt).padEnd(14)}${String(r.tarief || '-').padEnd(8)}${ok ? 'OK' : 'FOUT'}`);
  }
}

console.log('-'.repeat(104));
console.log(fouten === 0 ? 'Alle landen en schermformaten correct.' : `${fouten} scenario(s) FOUT.`);
await browser.close();
process.exit(fouten ? 1 : 0);
