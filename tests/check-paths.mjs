/* Regressiewacht voor DE terugkerende bug van deze site.
 *
 * Sinds de overstap naar /products/<slug> lossen relatieve paden op tegen
 * /products/ in plaats van tegen de root. Dat brak al twee keer stilletjes:
 * eerst de assets (juli), daarna elke link die JavaScript injecteert (augustus),
 * waardoor "Continue to checkout" vanaf een productpagina een 404 gaf.
 *
 * Deze test faalt zodra er ergens in gedeelde of geïnjecteerde code weer een
 * relatief pad opduikt. Draaien met:  node tests/check-paths.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

/* Bestanden die op een geneste route draaien, of die door zo'n pagina worden
   geladen. Alles hierin moet absolute paden gebruiken. */
const NESTED_TEMPLATES = new Set([
  'product.html', 'product-pine.html', 'product-oak.html', 'product-arbutus.html',
  'product-fir-vanilla.html', 'product-orange-blossom.html', 'product-acacia.html',
  'product-thyme.html', 'product-heather.html', 'product-wild-oregano.html',
  'product-olive-oil.html', 'product-mountain-tea.html', 'product-chamomile-tea.html',
]);
const SHARED = new Set([
  'shared.js', 'shared.css', 'commerce.js', 'checkout.js', 'search.js',
  'product-extras.js', 'account.js', 'journal-data.js', 'cart-commerce.js',
]);
const SHARED_DIRS = ['commerce'];

const SKIP_DIRS = new Set(['.git', 'node_modules', '.vercel', 'scripts', 'emails', 'cms', 'tests', '_backup', 'assets']);

/* Bekende, gecontroleerde uitzonderingen. Elke regel hier is een bewuste keuze,
   geen ontsnappingsluik: voeg alleen toe met een reden erbij. */
const UITZONDERINGEN = [
  // loadAddons zet zelf '/' voor elke scriptnaam (shared.js: s.src = '/' + a[1])
  { bestand: 'shared.js', bevat: '?v=hd-', reden: 'loadAddons prefixt zelf een slash' },
  // pathname-vergelijkingen, geen URLs
  { bestand: 'shared.js', bevat: "'index.html'", reden: 'vergelijking met location.pathname' },
];

/* Waarden die op bouwtijd niet vaststaan (string-concatenatie of een template)
   kunnen we hier niet beoordelen: de echte waarde komt uit de catalogus, en die
   wordt door de live-crawl in tests/audit-live.mjs gecontroleerd. */
const isInterpolatie = (v) => /['"]\s*\+|\+\s*['"]|\$\{/.test(v);

const isAbsolute = (v) => {
  const s = (v || '').trim();
  if (!s) return true;
  if (isInterpolatie(s)) return true;
  return /^([/#?]|https?:|\/\/|data:|mailto:|tel:|javascript:|blob:|[{$+])/.test(s);
};

const ATTR = /\b(href|src|action|poster|data-src)\s*=\s*"([^"]*)"/gi;
const CSS_URL = /url\(\s*['"]?([^)'"]+)['"]?\s*\)/gi;
const JS_PATH = /['"]((?:[A-Za-z0-9_][\w.-]*\/)*[A-Za-z0-9_][\w.-]*\.(?:html|webp|jpg|jpeg|png|svg|mp4|webm|gif))(\?[^'"]*)?['"]/g;
const JS_LOC = /(?:location\.href|location\.assign)\s*=\s*['"]([^'"]+)['"]/g;

function isSharedFile(rel) {
  const base = basename(rel);
  return NESTED_TEMPLATES.has(base) || SHARED.has(base) ||
         SHARED_DIRS.some((d) => rel.startsWith(d + '/'));
}

function walk(dir, out = []) {
  for (const naam of readdirSync(dir)) {
    if (SKIP_DIRS.has(naam)) continue;
    const p = join(dir, naam);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(html|js|css)$/.test(naam)) out.push(p);
  }
  return out;
}

function uitgezonderd(rel, regel) {
  return UITZONDERINGEN.some((u) => basename(rel) === u.bestand && regel.includes(u.bevat));
}

const bevindingen = [];
for (const pad of walk(ROOT)) {
  const rel = relative(ROOT, pad);
  if (!isSharedFile(rel)) continue;             // root-pagina's mogen relatief blijven
  const txt = readFileSync(pad, 'utf8');
  const regels = txt.split('\n');
  const meld = (index, soort, waarde) => {
    const nr = txt.slice(0, index).split('\n').length;
    const regel = regels[nr - 1] || '';
    if (uitgezonderd(rel, regel)) return;
    // data:-URI's bevatten inline SVG met url(%23id); dat zijn fragmenten
    if (soort === 'css-url' && regel.includes('data:image')) return;
    // new URL(href, location.href) is een JS-constructor, geen CSS-url()
    if (soort === 'css-url' && /new\s+URL\s*\(/.test(regel)) return;
    bevindingen.push({ rel, nr, soort, waarde });
  };
  for (const m of txt.matchAll(ATTR)) {
    if (m[1].toLowerCase() === 'action' && /data-[\w-]*action/i.test(txt.slice(Math.max(0, m.index - 12), m.index + 8))) continue;
    if (!isAbsolute(m[2])) meld(m.index, m[1].toLowerCase(), m[2]);
  }
  for (const m of txt.matchAll(CSS_URL)) if (!isAbsolute(m[1])) meld(m.index, 'css-url', m[1]);
  for (const m of txt.matchAll(JS_LOC)) if (!isAbsolute(m[1])) meld(m.index, 'location', m[1]);
  if (/\.js$/.test(rel)) {
    for (const m of txt.matchAll(JS_PATH)) if (!isAbsolute(m[1])) meld(m.index, 'js-pad', m[1]);
  }
}

if (bevindingen.length === 0) {
  console.log('OK: geen relatieve paden in gedeelde of geneste bestanden.');
  process.exit(0);
}
console.error(`FOUT: ${bevindingen.length} relatief pad(en) die breken op /products/<slug>:\n`);
for (const b of bevindingen) {
  console.error(`  ${b.rel}:${b.nr}  ${b.soort.padEnd(10)} ${b.waarde}`);
}
console.error('\nMaak deze absoluut (begin met /), of voeg een uitzondering met reden toe in dit bestand.');
process.exit(1);
