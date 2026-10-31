/* Regressietest: Consent Mode v2 en de GA4-ecommerce-events.
 *
 * Bewaakt de audit van 28-09-2026. Toen ging page_view twee keer per pagina,
 * stuurde de site geen consent-signalen, ontbraken view_item, view_item_list,
 * select_item, remove_from_cart en view_cart, en meldde add_to_cart altijd de
 * prijs van 480 g. Aankopen kwamen nooit in GA4 omdat de Shopify-checkout de
 * cookiekeuze van deze site niet kende.
 *
 * De test leest de echte hits naar google-analytics.com (niet de dataLayer),
 * dus hij meet wat Google ontvangt.
 *
 *   node tests/tracking.mjs [basis-url]      standaard http://localhost:4400
 *   node tests/tracking.mjs https://harvestdeli.nl --checkout   ook de Shopify-checkout
 */
import { chromium } from '/Users/thecreativitylab/Projects/products/node_modules/playwright/index.mjs';

const BASE = (process.argv[2] || 'http://localhost:4400').replace(/\/$/, '');
const CHECKOUT = process.argv.includes('--checkout');
const ACACIA_480 = 'shopify_ZZ_11364330701141_54140257272149';
const ACACIA_950 = 'shopify_ZZ_11364330701141_54140257304917';

let fouten = 0;
function check(ok, label, extra) {
  console.log(`${ok ? 'OK  ' : 'FOUT'} ${label}${extra ? '  ' + extra : ''}`);
  if (!ok) fouten++;
}

/* GA4 stuurt meerdere events per request; elke regel in de body is er één. */
function hitsFrom(req) {
  const base = Object.fromEntries(new URL(req.url()).searchParams);
  const body = req.postData() || '';
  const lines = body.split('\n').filter(Boolean);
  return (lines.length ? lines : ['']).map(l => ({ ...base, ...Object.fromEntries(new URLSearchParams(l)) }));
}
function items(h) {
  return Object.keys(h).filter(k => /^pr\d+$/.test(k)).sort().map(k => Object.fromEntries(
    h[k].split('~').map(p => [p.slice(0, 2), p.slice(2)])));
}

async function context(browser) {
  const ctx = await browser.newContext({ locale: 'nl-NL', viewport: { width: 1280, height: 900 } });
  const hits = [], google = [], errors = [];
  ctx.on('request', r => {
    const u = r.url();
    if (/google|doubleclick/.test(u) && !/fonts\.(googleapis|gstatic)/.test(u)) google.push(u);
    if (/\/g\/collect/.test(u)) hits.push(...hitsFrom(r));
  });
  ctx.on('page', p => p.on('pageerror', e => errors.push(e.message)));
  return { ctx, hits, google, errors };
}
const settle = (page, ms = 2500) => page.waitForTimeout(ms);
async function flush(page) {
  /* GA4 bundelt hits; bij pagehide gaan ze direct de deur uit. */
  await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pagehide')); });
  await page.waitForTimeout(1500);
}

const browser = await chromium.launch();

/* ---------------------------------------------------------------- 1 */
console.log('\n1. Geen keuze gemaakt: niets naar Google');
{
  const { ctx, google } = await context(browser);
  const page = await ctx.newPage();
  await page.goto(BASE + '/products/acacia-honey', { waitUntil: 'networkidle' });
  await settle(page);
  check(google.length === 0, 'geen enkele request naar Google zonder keuze', google[0] || '');
  const def = await page.evaluate(() => (window.dataLayer || []).map(a => Array.from(a || [])).find(a => a[0] === 'consent' && a[1] === 'default'));
  check(!!def && def[2].ad_storage === 'denied' && def[2].analytics_storage === 'denied' && def[2].ad_user_data === 'denied' && def[2].ad_personalization === 'denied',
    'consent default: alle vier signalen denied');
  await ctx.close();
}

/* ---------------------------------------------------------------- 2 */
console.log('\n2. Alleen noodzakelijk: gtag laadt nooit');
{
  const { ctx, google } = await context(browser);
  const page = await ctx.newPage();
  await page.goto(BASE + '/products/acacia-honey', { waitUntil: 'networkidle' });
  await page.click('[data-cb-action="reject"]');
  await page.goto(BASE + '/shop.html', { waitUntil: 'networkidle' });
  await settle(page);
  check(google.length === 0, 'geen request naar Google na weigeren', google[0] || '');
  await ctx.close();
}

/* ---------------------------------------------------------------- 3 */
console.log('\n3. Alles accepteren: signalen, één page_view, ecommerce');
{
  const { ctx, hits, errors } = await context(browser);
  const page = await ctx.newPage();
  await page.goto(BASE + '/products/acacia-honey', { waitUntil: 'networkidle' });
  await page.click('[data-cb-action="accept"]');
  await settle(page, 3500);

  /* maat 950 g, 2 stuks, in het mandje */
  await page.locator('label[for="v-950"]').click();
  await page.waitForTimeout(400);
  await page.click('#pdQtyInc');
  await page.locator('.pd-cta[data-add-to-cart]').first().click();
  await settle(page, 1500);
  if (await page.locator('#cartDrawer.open').count() === 0) await page.evaluate(() => window.HD_openCart && window.HD_openCart());
  await settle(page, 1200);
  await page.evaluate(() => { const it = window.HD_CART.items[0]; window.HD_CART.remove(it.slug, it.size); });
  await flush(page);

  const p1 = hits.filter(h => (h.dl || '').includes('/products/acacia-honey'));
  const pv = p1.filter(h => h.en === 'page_view');
  check(pv.length === 1, 'precies één page_view op de productpagina', `(${pv.length})`);
  check(p1.length > 0 && p1.every(h => h.gcs === 'G111'), 'elke hit draagt consent granted (gcs=G111)', [...new Set(p1.map(h => h.gcs))].join(','));
  check(p1.length > 0 && p1.every(h => /^1[0-9a-z]+/.test(h.gcd || '') && !/l/.test((h.gcd || '').slice(2, 8))), 'consent-signalen gezet (gcd zonder "l")', [...new Set(p1.map(h => h.gcd))].join(','));

  const vi = p1.find(h => h.en === 'view_item');
  const viItem = vi && items(vi)[0];
  check(!!viItem && viItem.id === ACACIA_480 && viItem.pr === '17' && vi['epn.value'] === '17' && vi.cu === 'EUR',
    'view_item: acacia 480 g, €17, EUR', viItem ? JSON.stringify(viItem) : '');

  const atc = p1.find(h => h.en === 'add_to_cart');
  const atcItem = atc && items(atc)[0];
  check(!!atcItem && atcItem.id === ACACIA_950 && atcItem.pr === '30' && atcItem.qt === '2' && atcItem.va === '950g' && atc['epn.value'] === '60',
    'add_to_cart: 950 g, €30, 2 stuks, value €60', atcItem ? JSON.stringify(atcItem) + ' value=' + atc['epn.value'] : '');
  check(!!atcItem && atcItem.nm === 'Harvest Deli Acaciahoning' && atcItem.br === 'Harvest Deli' && atcItem.ca === 'Honey',
    'add_to_cart: naam, merk en categorie gelijk aan de Shopify-pixel');
  check(p1.filter(h => h.en === 'add_to_cart').length === 1, 'add_to_cart precies één keer');

  const vc = p1.find(h => h.en === 'view_cart');
  check(!!vc && items(vc)[0] && items(vc)[0].qt === '2', 'view_cart bij openen van het mandje', vc ? 'value=' + vc['epn.value'] : '');
  const rfc = p1.find(h => h.en === 'remove_from_cart');
  const rItem = rfc && items(rfc)[0];
  check(!!rItem && rItem.id === ACACIA_950 && rItem.qt === '2' && rfc['epn.value'] === '60', 'remove_from_cart: 950 g, 2 stuks, €60');
  check(!p1.some(h => /begin_checkout|add_payment_info|add_shipping_info|purchase/.test(h.en)), 'geen nep-checkoutevents op de site');

  /* Lijstweergave en selectie */
  await page.goto(BASE + '/shop.html', { waitUntil: 'networkidle' });
  await settle(page, 3000);
  const shopPv = hits.filter(h => (h.dl || '').endsWith('/shop.html') && h.en === 'page_view');
  const card = page.locator('[data-ga-list] a[href*="/products/"]').first();
  const cardHref = await card.getAttribute('href').catch(() => null);
  if (cardHref) await card.click();
  await page.waitForLoadState('networkidle');
  await flush(page);
  const shopHits = hits.filter(h => (h.dl || '').endsWith('/shop.html'));
  const vil = shopHits.find(h => h.en === 'view_item_list');
  check(!!vil && items(vil).length >= 9, 'view_item_list op de shop met alle producten', vil ? `${items(vil).length} items, lijst ${vil['ep.item_list_id']}` : '');
  check(shopPv.length <= 1 && shopHits.filter(h => h.en === 'page_view').length === 1, 'precies één page_view op de shop');
  const si = shopHits.find(h => h.en === 'select_item');
  check(!!si && items(si).length === 1, 'select_item bij klik op een product', si ? JSON.stringify(items(si)[0]).slice(0, 120) : String(cardHref));
  check(errors.length === 0, 'geen JavaScript-fouten', errors.slice(0, 2).join(' | '));
  await ctx.close();
}

/* ---------------------------------------------------------------- 4 */
console.log('\n4. Alleen analyse (voorkeuren): analytics granted, advertenties denied');
{
  const { ctx, hits } = await context(browser);
  const page = await ctx.newPage();
  await page.goto(BASE + '/shop.html', { waitUntil: 'networkidle' });
  await page.click('[data-cb-action="customize"]');
  await page.locator('label[aria-label="Analytische cookies"]').click();
  await page.click('[data-cb-action="customize"]');
  await settle(page, 3000);
  await flush(page);
  const g = [...new Set(hits.map(h => h.gcs))];
  check(hits.length > 0 && g.length === 1 && g[0] === 'G101', 'hits dragen gcs=G101 (analyse ja, advertenties nee)', g.join(','));
  const cs = await page.evaluate(() => window.HD_visitorConsent && window.HD_visitorConsent());
  check(cs && cs.analytics === true && cs.marketing === false, 'Shopify krijgt dezelfde keuze mee', JSON.stringify(cs));
  await ctx.close();
}

/* ---------------------------------------------------------------- 5 */
console.log('\n5. Naar de Shopify-checkout: keuze reist mee');
{
  const { ctx, hits } = await context(browser);
  const page = await ctx.newPage();
  await page.goto(BASE + '/products/acacia-honey', { waitUntil: 'networkidle' });
  await page.click('[data-cb-action="accept"]');
  await page.evaluate(() => window.HD_CART.add('acacia', 1, '480g'));
  let checkoutUrl = null;
  page.on('framenavigated', f => { if (f === page.mainFrame() && /myshopify|shop\.harvestdeli/.test(f.url())) checkoutUrl = checkoutUrl || f.url(); });
  if (!CHECKOUT) await page.route(/myshopify\.com\/(nl\/|en\/)?cart\/c\//, r => { checkoutUrl = r.request().url(); r.fulfill({ status: 200, body: 'stop' }); });
  await page.evaluate(() => window.HD_startCheckout());
  await page.waitForTimeout(CHECKOUT ? 9000 : 5000);
  check(!!checkoutUrl && /[?&]_cs=/.test(checkoutUrl), 'checkoutUrl bevat de consent (_cs)', checkoutUrl ? checkoutUrl.replace(/key=[^&]+/, 'key=…').slice(0, 140) : 'geen');
  check(!!checkoutUrl && /[?&]_gl=/.test(checkoutUrl), 'Google-linker zet _gl op de checkoutlink (na toestemming)');
  if (CHECKOUT) {
    const co = hits.filter(h => /checkouts/.test(h.dl || ''));
    check(co.some(h => h.en === 'begin_checkout' && h.gcs === 'G111'), 'Shopify-checkout stuurt begin_checkout met consent', co.map(h => h.en + ':' + h.gcs).join(','));
  }
  await ctx.close();
}

await browser.close();
console.log(fouten ? `\n${fouten} controle(s) mislukt.` : '\nAlle controles geslaagd.');
process.exit(fouten ? 1 : 0);
