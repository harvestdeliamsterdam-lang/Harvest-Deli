/* Regressietest: de hero-film speelt één keer per browser en gaat over in de
 * vaste foto (31-10-2026).
 *
 *   node tests/hero-film.mjs [basis-url]     standaard http://localhost:4400
 *
 * Duurt ongeveer een minuut: scenario 1 kijkt de hele film (15 s) uit.
 */
import { chromium } from '/Users/thecreativitylab/Projects/products/node_modules/playwright/index.mjs';

const BASE = (process.argv[2] || 'http://localhost:4400').replace(/\/$/, '');
let fouten = 0;
const check = (ok, label, extra) => { console.log(`${ok ? 'OK  ' : 'FOUT'} ${label}${extra ? '  ' + extra : ''}`); if (!ok) fouten++; };

async function ctxFor(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'nl-NL', ...opts });
  const mp4 = []; const errors = [];
  ctx.on('request', r => { if (/\.mp4/.test(r.url())) mp4.push(r.url()); });
  ctx.on('page', p => p.on('pageerror', e => errors.push(e.message)));
  /* cookie choice made, so the bar does not cover the hero */
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('hd-cookie-consent-v1')) localStorage.setItem('hd-cookie-consent-v1', JSON.stringify({ version: 1, necessary: true, analytics: false, marketing: false, timestamp: new Date().toISOString() })); } catch (e) {} });
  return { ctx, mp4, errors };
}
const state = (p) => p.evaluate(() => ({
  film: document.documentElement.classList.contains('hd-film'),
  still: document.documentElement.classList.contains('hd-still'),
  key: (() => { try { return localStorage.getItem('hd-hero-film-v1'); } catch (e) { return 'ERR'; } })(),
  paused: document.getElementById('heroVideo').paused,
  loop: document.getElementById('heroVideo').loop,
  t: Math.round(document.getElementById('heroVideo').currentTime * 10) / 10,
  label: document.querySelector('.hd-hero__replay-label').textContent.trim(),
  replayHidden: document.getElementById('heroReplay').hidden,
  filmOpacity: getComputedStyle(document.querySelector('.hd-hero__film')).opacity,
  stillLoaded: document.querySelector('.hd-hero__still img').complete && document.querySelector('.hd-hero__still img').naturalWidth > 0,
}));
const waitFor = async (p, fn, ms) => { try { await p.waitForFunction(fn, null, { timeout: ms }); return true; } catch (e) { return false; } };

const chrome = await chromium.launch({ channel: 'chrome' });

console.log('\n1. Eerste bezoek: logo-intro, film één keer, zachte overgang naar de foto');
{
  const { ctx, mp4, errors } = await ctxFor(chrome);
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const s0 = await state(p);
  check(s0.film && !s0.still && s0.key === null, 'start in filmstand, nog niets onthouden');
  const played = await waitFor(p, () => !document.getElementById('heroVideo').paused && document.getElementById('heroVideo').currentTime > 0.3, 20000);
  const s1 = await state(p);
  check(played, 'film speelt (na de logo-intro)', `t=${s1.t}s`);
  check(s1.key === 'seen', 'zodra hij speelt is dat onthouden (hd-hero-film-v1=seen)');
  check(s1.loop === false, 'geen herhaling (loop uit)');
  check(s1.stillLoaded, 'foto staat al klaar onder de film');
  check(s1.label === 'Film overslaan', 'knop tijdens de film: "Film overslaan"');
  await p.evaluate(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: false }); });
  const ended = await waitFor(p, () => document.documentElement.classList.contains('hd-still'), 22000);
  await p.waitForTimeout(1200);
  const s2 = await state(p);
  const cls = await p.evaluate(() => window.__cls);
  check(ended && s2.filmOpacity === '0', 'na afloop: foto, film volledig weggefade', `opacity=${s2.filmOpacity}`);
  check(s2.paused, 'film staat stil (niet opnieuw gestart)');
  await p.waitForTimeout(3000);
  check((await state(p)).paused, 'na 3 s nog steeds stil');
  check(cls < 0.01, 'geen layoutverschuiving bij de overgang', `CLS=${cls.toFixed(4)}`);
  check(s2.label === 'Film opnieuw bekijken' && !s2.replayHidden, 'knop "Film opnieuw bekijken" zichtbaar');
  check(mp4.length > 0 && mp4.every(u => /video-2k\.mp4/.test(u)), 'desktop laadt de 2k-versie', [...new Set(mp4.map(u => u.split('/').pop().split('?')[0]))].join(','));
  check(errors.length === 0, 'geen JavaScript-fouten', errors.join(' | '));

  console.log('\n2. Verversen, opnieuw bezoeken, terugnavigeren: direct de foto');
  mp4.length = 0;
  await p.reload({ waitUntil: 'domcontentloaded' });
  const r1 = await state(p);
  check(r1.still && !r1.film, 'verversen: direct fotostand');
  const intro = await p.evaluate(() => !!document.querySelector('.hd-intro') || document.documentElement.classList.contains('hd-intro-pending'));
  check(!intro, 'geen logo-intro meer ervoor');
  await p.goto(BASE + '/shop.html', { waitUntil: 'domcontentloaded' });
  await p.goBack({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  const r2 = await state(p);
  check(r2.still && r2.paused, 'terug naar de homepage: foto, film stil');
  const p2 = await ctx.newPage();                       // new tab, same browser = new visit
  /* 'load', not 'networkidle': the first tab may still be streaming the
     film from the local test server */
  await p2.goto(BASE + '/', { waitUntil: 'load' });
  await p2.waitForTimeout(2500);
  check((await state(p2)).still, 'nieuw tabblad (nieuw bezoek): foto');
  check(mp4.length === 0, 'geen enkel videobestand opgehaald', String(mp4.length));

  console.log('\n3. Handmatig opnieuw afspelen, daarna weer de foto');
  await p2.click('#heroReplay');
  const rp = await waitFor(p2, () => !document.getElementById('heroVideo').paused && document.getElementById('heroVideo').currentTime > 0.2, 12000);
  const m1 = await state(p2);
  check(rp && m1.film, 'klik: film speelt van voren af', `t=${m1.t}s`);
  check(m1.label === 'Film overslaan', 'knop wordt "Film overslaan"');
  await p2.click('#heroReplay');
  await p2.waitForTimeout(1300);
  const m2 = await state(p2);
  check(m2.still && m2.filmOpacity === '0' && m2.paused, 'overslaan: terug naar de foto');
  await p2.click('#heroReplay');
  await waitFor(p2, () => !document.getElementById('heroVideo').paused, 12000);
  await p2.evaluate(() => { const v = document.getElementById('heroVideo'); v.currentTime = Math.max(0, v.duration - 1.2); });
  const end2 = await waitFor(p2, () => document.documentElement.classList.contains('hd-still'), 8000);
  check(end2, 'handmatig tot het einde: weer de foto');
  await ctx.close();
}

console.log('\n4. Video mislukt of geblokkeerd: bruikbare foto');
{
  const { ctx } = await ctxFor(chrome);
  await ctx.addInitScript(() => { try { sessionStorage.setItem('hd-intro-played-v1', '1'); } catch (e) {} });
  await ctx.route(/\.mp4/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const ok = await waitFor(p, () => document.documentElement.classList.contains('hd-still'), 10000);
  await p.waitForTimeout(1200);                       // let the 0.9 s fade finish
  const s = await state(p);
  check(ok && s.filmOpacity === '0', 'videobestand niet te laden: foto', `opacity=${s.filmOpacity}`);
  check(s.key === null, 'niet als "gezien" onthouden (film is nooit gestart)');
  await ctx.close();
}
{
  /* The file arrives but is not a playable video (wrong or broken encode) */
  const { ctx } = await ctxFor(chrome);
  await ctx.addInitScript(() => { try { sessionStorage.setItem('hd-intro-played-v1', '1'); } catch (e) {} });
  await ctx.route(/\.mp4/, r => r.fulfill({ status: 200, contentType: 'video/mp4', body: 'dit is geen video' }));
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const ok = await waitFor(p, () => document.documentElement.classList.contains('hd-still'), 10000);
  check(ok, 'geen afspeelbare videobron: foto');
  await ctx.close();
}
{
  const blocked = await chromium.launch({ channel: 'chrome' });
  const { ctx } = await ctxFor(blocked);
  await ctx.addInitScript(() => { try { sessionStorage.setItem('hd-intro-played-v1', '1'); } catch (e) {} HTMLMediaElement.prototype.play = function () { return Promise.reject(new DOMException('blocked', 'NotAllowedError')); }; });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const ok = await waitFor(p, () => document.documentElement.classList.contains('hd-still'), 8000);
  check(ok, 'afspelen geweigerd (autoplay-blokkade): foto');
  await blocked.close();
}

console.log('\n5. Minder beweging en databesparing: foto, handmatig kan wel');
{
  const { ctx, mp4 } = await ctxFor(chrome, { reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  const s = await state(p);
  check(s.still && s.paused && mp4.length === 0, 'reduced motion: foto, geen video geladen');
  await p.click('#heroReplay');
  const ok = await waitFor(p, () => !document.getElementById('heroVideo').paused, 12000);
  check(ok, 'handmatig afspelen werkt wel');
  await ctx.close();
}
{
  const { ctx, mp4 } = await ctxFor(chrome);
  await ctx.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' } }));
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  check((await state(p)).still && mp4.length === 0, 'databesparing: foto, geen video geladen');
  await ctx.close();
}

console.log('\n6. Navigatie en knoppen blijven werken');
for (const vp of [{ width: 1440, height: 900, n: 'desktop' }, { width: 390, height: 844, n: 'mobiel', isMobile: true, hasTouch: true }]) {
  const { ctx, errors } = await ctxFor(chrome, { viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('hd-intro-played-v1', '1'); localStorage.setItem('hd-hero-film-v1', 'seen'); } catch (e) {} });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const cta = await p.getAttribute('.hd-hero__cta', 'href');
  check(cta === 'shop.html', `${vp.n}: "Ontdek de collectie" gaat naar de collectiepagina`);
  if (vp.n === 'desktop') {
    const links = await p.$$eval('nav .nav-links a', as => as.filter(a => a.offsetParent).map(a => a.textContent.trim() + '→' + a.getAttribute('href')));
    check(links.length === 4, 'desktop: vier links zichtbaar', links.join(', '));
  } else {
    check(await p.$$eval('nav .nav-links a', as => as.every(a => !a.offsetParent)), 'mobiel: geen rij desktoplinks');
  }
  await p.click('#menuBtn');
  await p.waitForTimeout(700);
  check(await p.$eval('#menuOverlay', el => el.classList.contains('open')), `${vp.n}: Menu opent`);
  if (vp.n === 'mobiel') check(await p.$$eval('#menuOverlay .hd-menu-lang button', b => b.length === 2), 'mobiel: taalkeuze in het menu');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(700);
  if (vp.n === 'mobiel') {
    check(await p.$$eval('nav .nav-search, nav .hd-lang-mobile', els => els.every(e => !e.offsetParent)), 'mobiel: bovenin alleen logo, Menu, verlanglijst en winkelmand');
    await p.click('#menuBtn'); await p.waitForTimeout(800);
    await p.click('.menu-overlay.open .hd-menu-search');                       // search lives in the menu on phones
  } else {
    await p.click('nav .nav-search');
  }
  await p.waitForTimeout(800);
  check(await p.evaluate(() => !!document.querySelector('.hd-search.open, .hd-search-overlay.open, [class*="search"][class*="open"]')), `${vp.n}: zoeken opent`);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(500);
  await p.click('#navCart');
  await p.waitForTimeout(700);
  check(await p.$eval('#cartDrawer', el => el.classList.contains('open')), `${vp.n}: winkelmand opent`);
  await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('#cartDrawer .cart-close') && document.querySelector('#cartDrawer .cart-close').click());
  await p.waitForTimeout(600);
  await p.evaluate(() => window.HD_setLang && window.HD_setLang('en'));
  await p.waitForTimeout(400);
  const en = await p.$eval('#homepageH1', h => h.textContent.trim());
  check(en === 'From the Greek mountains to your table.', `${vp.n}: taalkeuze vertaalt de hero`, en);
  await p.evaluate(() => window.HD_setLang && window.HD_setLang('nl'));
  await p.evaluate(() => window.scrollTo(0, document.getElementById('hero').offsetHeight + 200));
  await p.waitForTimeout(700);
  check(await p.$eval('nav.site-nav', n => n.classList.contains('hd-past-hero')), `${vp.n}: voorbij de hero wordt de navigatie crème`);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 0, `${vp.n}: geen horizontaal scrollen`, `overflow=${overflow}`);
  check(errors.length === 0, `${vp.n}: geen JavaScript-fouten`, errors.join(' | '));
  await ctx.close();
}

await chrome.close();
console.log(fouten ? `\n${fouten} controle(s) mislukt.` : '\nAlle controles geslaagd.');
process.exit(fouten ? 1 : 0);
