/* Volledige site-audit: bezoekt elke route op drie schermformaten en meet 404's,
 * JS-fouten, gebroken afbeeldingen en dode links. Loopt bewust OOK vanaf de
 * geneste productroutes, want daar zat de bug die twee keer terugkwam.
 *
 * Draaien:  node tests/audit-live.mjs [basis-url]
 * Standaard http://localhost:3098 (zie .claude/launch.json, config "honey-fix").
 */
import { chromium } from '/Users/thecreativitylab/Projects/products/node_modules/playwright/index.mjs';
const BASE = process.argv[2] || 'http://localhost:3098';

const PRODUCTEN = ['chestnut-honey','pine-honey','oak-honey','arbutus-honey','vanilla-honey',
  'orange-blossom-honey','acacia-honey','thyme-honey','heather-honey','wild-oregano',
  'extra-virgin-olive-oil','greek-mountain-tea','greek-chamomile-tea'];

const ROUTES = [
  '/', '/shop.html', '/checkout.html', '/journal.html', '/about.html', '/contact.html',
  '/find-us-amsterdam.html', '/partners.html', '/account.html', '/login.html', '/register.html',
  '/wishlist.html', '/order-success.html', '/returns.html', '/404.html',
  '/legal-terms.html', '/legal-privacy.html', '/legal-shipping.html', '/legal-returns.html',
  '/legal-cookies.html', '/legal-imprint.html', '/legal-payment.html',
  ...PRODUCTEN.map(s => '/products/' + s),
  '/article-griekse-honing-complete-gids.html',
  '/article-is-honing-gezond.html',
];

const VIEWPORTS = [['mobiel',393,852],['tablet',768,1024],['desktop',1440,900]];
const seedCart = () => localStorage.setItem('hd-cart-v1', JSON.stringify(
  [{ slug:'chestnut', size:'480g', qty:3, price:18, name:'Chestnut Honey' }]));

const problemen = [];
const linkCache = new Map();

async function checkLink(url) {
  if (linkCache.has(url)) return linkCache.get(url);
  let status = 0;
  try {
    const r = await fetch(url, { method: 'GET', redirect: 'follow' });
    status = r.status;
  } catch (e) { status = -1; }
  linkCache.set(url, status);
  return status;
}

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  console.log(`AUDIT tegen ${BASE}\n${'='.repeat(92)}`);
  console.log('route                                    scherm    404  JSfout  kapotteIMG  doodLink');
  console.log('-'.repeat(92));

  for (const route of ROUTES) {
    for (const [vnaam, w, h] of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'nl-NL' });
      const page = await ctx.newPage();
      const netFouten = [], jsFouten = [];
      /* Externe hosts tellen niet mee: die kunnen we niet repareren, en in een
         headless browser mislukken analytics-beacons en font-CDN's structureel. */
      const DERDEN = ['google-analytics.com','googletagmanager.com','fonts.gstatic.com',
                     'fonts.googleapis.com','doubleclick.net','google.com','cdn.fontshare.com'];
      const isDerde = u => DERDEN.some(d => u.includes(d));
      page.on('response', r => {
        const u = r.url();
        if (r.status() >= 400 && !u.includes('favicon') && !isDerde(u))
          netFouten.push(r.status() + ' ' + u.replace(BASE, ''));
      });
      page.on('requestfailed', r => {
        const u = r.url();
        if (!u.includes('favicon') && !u.startsWith('data:') && !isDerde(u))
          netFouten.push('FAIL ' + u.replace(BASE, ''));
      });
      page.on('pageerror', e => jsFouten.push(String(e).slice(0, 110)));
      page.on('console', m => {
        if (m.type() !== 'error' || m.text().includes('favicon')) return;
        // Een console-fout over een extern bestand telt net zo min mee als het
        // netwerkverzoek zelf; anders meldt dezelfde hapering zich twee keer.
        const bron = (m.location && m.location().url) || '';
        if (bron && isDerde(bron)) return;
        jsFouten.push('console: ' + m.text().slice(0, 110));
      });

      try {
        await page.goto(BASE + route, { waitUntil: 'load', timeout: 45000 });
      } catch (e) {
        problemen.push(`${route} [${vnaam}]: pagina laadde niet (${String(e).slice(0,60)})`);
        await ctx.close(); continue;
      }
      // winkelmand vullen zodat de drawer en checkout-link echt renderen
      await page.evaluate(seedCart).catch(() => {});
      await page.waitForTimeout(1500);
      try {
        const c = page.locator('button:has-text("Alles accepteren")').first();
        if (await c.count()) { await c.click({ timeout: 2500 }); }
      } catch (e) {}
      await page.waitForTimeout(2200);

      // gebroken afbeeldingen
      const kapotteImg = await page.evaluate(() =>
        [...document.images]
          .filter(i => i.currentSrc && i.complete && i.naturalWidth === 0)
          .map(i => i.currentSrc).slice(0, 5)).catch(() => []);

      // interne links verzamelen (alleen op desktop, scheelt tijd)
      let doodLinks = [];
      if (vnaam === 'desktop') {
        const hrefs = await page.evaluate(() =>
          [...new Set([...document.querySelectorAll('a[href]')].map(a => a.href))]
        ).catch(() => []);
        const intern = hrefs.filter(h => h.startsWith(BASE) && !h.includes('#'));
        for (const h of intern) {
          const st = await checkLink(h);
          if (st >= 400 || st === -1) doodLinks.push(st + ' ' + h.replace(BASE, ''));
        }
      }

      /* Sommige routes sturen met opzet door: /account.html naar de login als je
         niet bent ingelogd, /order-success.html naar de homepage. Bij zo'n
         navigatie breken de scripts af die nog onderweg waren, en die "FAIL"
         zegt niets over de site. Alleen echte statuscodes blijven meetellen. */
      const omgeleid = !page.url().replace(/\/$/, '').endsWith(route.replace(/\/$/, ''));
      const echteNetFouten = omgeleid ? netFouten.filter((f) => !f.startsWith('FAIL ')) : netFouten;

      const totaal = echteNetFouten.length + jsFouten.length + kapotteImg.length + doodLinks.length;
      if (totaal) {
        problemen.push(`${route} [${vnaam}]: ` +
          [echteNetFouten.length ? 'net:' + echteNetFouten.slice(0,3).join(', ') : '',
           jsFouten.length ? 'js:' + jsFouten.slice(0,2).join(' | ') : '',
           kapotteImg.length ? 'img:' + kapotteImg.slice(0,3).map(u=>u.replace(BASE,'')).join(', ') : '',
           doodLinks.length ? 'link:' + doodLinks.slice(0,4).join(', ') : ''].filter(Boolean).join('  '));
      }
      console.log(
        `${route.padEnd(41)}${vnaam.padEnd(10)}${String(echteNetFouten.length).padEnd(5)}` +
        `${String(jsFouten.length).padEnd(8)}${String(kapotteImg.length).padEnd(12)}` +
        `${vnaam === 'desktop' ? doodLinks.length : '-'}`);
      await ctx.close();
    }
  }

  console.log('\n' + '='.repeat(92));
  if (!problemen.length) console.log('GEEN PROBLEMEN GEVONDEN.');
  else { console.log(`${problemen.length} PROBLEEM(EN):`); problemen.forEach(p => console.log('  - ' + p)); }
  await browser.close();
  process.exit(problemen.length ? 1 : 0);
