import { chromium } from '/Users/thecreativitylab/Projects/products/node_modules/playwright/index.mjs';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await p.goto('file://' + process.cwd() + '/og.html', { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
const f = await p.evaluate(() => [...document.fonts].filter(x => x.status === 'loaded').map(x => x.family + ' ' + x.weight));
console.log('fonts geladen:', [...new Set(f)].join(', '));
await p.screenshot({ path: '/Users/thecreativitylab/Projects/products/honey/assets/og/og-wildflower.jpg', type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await b.close();
