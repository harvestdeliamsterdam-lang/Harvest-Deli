/* Regressietest voor telefoonnormalisatie.
 *
 * Shopify weigert een cart volledig met "Phone is invalid" zodra het nummer geen
 * geldig E.164 is. De klant ziet dan "Checkout temporarily unavailable" en kan
 * niets meer. Dat trof elk land zonder nationale trunk-0: een Italiaans mobiel
 * nummer 3331234567 werd "+3331234567" in plaats van "+393331234567".
 *
 * Draaien:  node tests/phone-e164.mjs [basis-url]
 */
import { chromium } from '/Users/thecreativitylab/Projects/products/node_modules/playwright/index.mjs';

const BASE = process.argv[2] || 'https://harvestdeli.nl';

/* [land, ingetypt nummer, verwacht resultaat] */
const GEVALLEN = [
  // trunk-0 landen: de 0 hoort eraf
  ['NL', '06 10 71-50 83', '+31610715083'],
  ['NL', '0612345678', '+31612345678'],
  ['DE', '0151 23456789', '+4915123456789'],
  ['FR', '0612345678', '+33612345678'],
  ['BE', '0470123456', '+32470123456'],
  ['AT', '06641234567', '+436641234567'],
  ['IE', '0851234567', '+353851234567'],
  ['SE', '0701234567', '+46701234567'],
  // geen trunk-0: nummer blijft heel
  ['IT', '3331234567', '+393331234567'],
  ['IT', '0212345678', '+390212345678'],
  ['ES', '612345678', '+34612345678'],
  ['PT', '912345678', '+351912345678'],
  ['GR', '6912345678', '+306912345678'],
  ['DK', '20123456', '+4520123456'],
  ['PL', '512345678', '+48512345678'],
  ['CZ', '601123456', '+420601123456'],
  ['MT', '79123456', '+35679123456'],
  ['CY', '96123456', '+35796123456'],
  // al internationaal
  ['DE', '+49 151 23456789', '+4915123456789'],
  ['IT', '0039 333 1234567', '+393331234567'],
  // onbruikbaar: moet null worden, niet een ongeldig nummer dat de cart sloopt
  ['NL', 'geen idee', null],
  ['NL', '12', null],
  ['NL', '', null],
];

const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
await page.goto(`${BASE}/shop.html`, { waitUntil: 'load' });
await page.waitForTimeout(4000);

const beschikbaar = await page.evaluate(() => typeof window.HD_normalizePhone === 'function');
if (!beschikbaar) {
  console.error('FOUT: window.HD_normalizePhone bestaat niet (commerce.js niet geladen?)');
  await browser.close();
  process.exit(1);
}

let fouten = 0;
console.log(`TELEFOON-NORMALISATIE tegen ${BASE}\n${'-'.repeat(74)}`);
for (const [land, invoer, verwacht] of GEVALLEN) {
  const uit = await page.evaluate(([l, i]) => window.HD_normalizePhone(i, l), [land, invoer]);
  const ok = uit === verwacht;
  if (!ok) fouten++;
  console.log(`${land}  ${JSON.stringify(invoer).padEnd(22)} -> ${String(uit).padEnd(18)} ` +
              `${ok ? 'OK' : 'FOUT, verwacht ' + verwacht}`);
}
console.log('-'.repeat(74));
console.log(fouten === 0 ? 'Alle nummers correct genormaliseerd.' : `${fouten} geval(len) FOUT.`);
await browser.close();
process.exit(fouten ? 1 : 0);
