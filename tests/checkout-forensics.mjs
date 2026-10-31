/* Forensisch onderzoek van de aankooptracking (30-10-2026).
 *
 * Volgt één bezoeker per cookiekeuze van de site tot op de betaalpagina van
 * de Shopify-checkout en legt vast wat Google daar werkelijk ontvangt: welke
 * tags, welke events, welk consentsignaal, en of het client-ID van de site
 * (cookie _ga op harvestdeli.nl) in de checkout hetzelfde blijft.
 *
 * Er wordt NIETS betaald en geen bestelling geplaatst: de test stopt op de
 * checkoutpagina. Voor de aankoop zelf is een goedgekeurde testbestelling nodig.
 *
 *   node tests/checkout-forensics.mjs [basis-url] [--gclid]
 */
import { chromium } from '/Users/thecreativitylab/Projects/products/node_modules/playwright/index.mjs';

const BASE = (process.argv.slice(2).find(a => !a.startsWith('--')) || 'https://harvestdeli.nl').replace(/\/$/, '');
const GCLID = process.argv.includes('--gclid');

function hitsFrom(req) {
  const base = Object.fromEntries(new URL(req.url()).searchParams);
  const lines = (req.postData() || '').split('\n').filter(Boolean);
  return (lines.length ? lines : ['']).map(l => ({ ...base, ...Object.fromEntries(new URLSearchParams(l)) }));
}

const KEUZES = {
  alles: async p => p.click('[data-cb-action="accept"]'),
  analyse: async p => {
    await p.click('[data-cb-action="customize"]');
    await p.locator('label[aria-label="Analytische cookies"]').click();
    await p.click('[data-cb-action="customize"]');
  },
  weigeren: async p => p.click('[data-cb-action="reject"]'),
  geen: async () => {},
};

const browser = await chromium.launch({ channel: 'chrome' });
for (const [naam, kies] of Object.entries(KEUZES)) {
  const ctx = await browser.newContext({ locale: 'nl-NL', viewport: { width: 1280, height: 900 } });
  const hits = [], tags = new Set(), other = new Set();
  ctx.on('request', r => {
    const u = r.url();
    if (/\/g\/collect/.test(u)) hits.push(...hitsFrom(r).map(h => ({ ...h, _host: new URL(u).host })));
    const m = u.match(/[?&]id=((?:G|AW|GT|MC|DC)-[A-Z0-9]+)/); if (m) tags.add(m[1]);
    if (/googleadservices|doubleclick|pagead|ccm\/collect|\/rmkt\//.test(u)) other.add(u.split('?')[0]);
  });
  const page = await ctx.newPage();
  await page.goto(BASE + '/products/acacia-honey' + (GCLID ? '?gclid=TEST-FORENSICS-' + Date.now() : ''), { waitUntil: 'networkidle' });
  if (await page.locator('[data-cb-action="accept"]').count()) await kies(page);
  await page.waitForTimeout(2500);
  const siteCid = (await ctx.cookies('https://harvestdeli.nl')).find(c => c.name === '_ga');
  const consent = await page.evaluate(() => window.HD_visitorConsent && window.HD_visitorConsent());
  await page.evaluate(() => window.HD_CART.add('acacia', 1, '480g'));
  await page.evaluate(() => window.HD_startCheckout());
  await page.waitForURL(/checkouts/, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(10000);
  const coUrl = page.url();
  const coCookies = (await ctx.cookies(coUrl)).filter(c => /^_ga|_gcl/.test(c.name)).map(c => c.name + '=' + c.value);
  const co = hits.filter(h => /checkouts/.test(h.dl || ''));
  console.log(`\n=== keuze: ${naam}  (site geeft door: ${JSON.stringify(consent)})`);
  console.log('checkout-url  :', coUrl.replace(/key=[^&]+/, 'key=…').replace(/\/cn\/[^/]+/, '/cn/…').slice(0, 140));
  console.log('_cs in url    :', /[?&]_cs=/.test(coUrl) || 'nee (al doorgestuurd)');
  console.log('site _ga      :', siteCid ? siteCid.value : '-');
  console.log('checkout ga   :', coCookies.join('  ') || '-');
  console.log('tags geladen  :', [...tags].join(', ') || '-');
  console.log('ads/remarket. :', [...other].join(', ') || '-');
  console.log('hits site     :', hits.filter(h => !/checkouts/.test(h.dl || '')).map(h => `${h.en}[${h.gcs}]`).join(' ') || '-');
  console.log('hits checkout :', co.map(h => `${h.tid}:${h.en}[${h.gcs}] cid=${h.cid} dr=${(h.dr || '').slice(0, 40)}`).join('\n                ') || '-');
  const bc = co.find(h => h.en === 'begin_checkout');
  if (bc) console.log('begin_checkout:', JSON.stringify(Object.fromEntries(Object.entries(bc).filter(([k]) => /^(cu|epn\.value|pr1|ep\.currency|_host|gcd|dma|npa)$/.test(k)))));
  await ctx.close();
}
await browser.close();
