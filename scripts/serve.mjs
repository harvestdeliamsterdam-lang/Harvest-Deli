/* Lokale server die zich gedraagt als Vercel voor deze site.
 *
 * python3 -m http.server kent de regels uit vercel.json niet, dus
 * /products/<slug> bestaat daar niet en de productpagina's vallen terug op
 * kastanje. Deze server past redirects, rewrites en headers uit vercel.json
 * toe, comprimeert zoals Vercel (gzip) en draait de functies in api/ lokaal.
 *
 *   node scripts/serve.mjs [poort] [map]
 *   node scripts/serve.mjs 4400            # deze map
 *   node scripts/serve.mjs 4401 /pad/naar/andere/kopie
 *
 * Geen dependencies. Niet voor productie (staat in .vercelignore).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2] || 4400);
const ROOT = path.resolve(process.argv[3] || path.join(HERE, '..'));
const VERCEL = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const require = createRequire(path.join(ROOT, 'package.json'));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.pdf': 'application/pdf'
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml|manifest)|image\/svg)/;

/* Vercel-bronpatronen: letterlijk pad, of een regex zoals "/(.*)". */
function matcher(source) {
  if (!/[(*]/.test(source)) return (p) => p === source;
  const re = new RegExp('^' + source + '$');
  return (p) => re.test(p);
}
const redirects = (VERCEL.redirects || []).map(r => ({ ...r, test: matcher(r.source) }));
const rewrites = (VERCEL.rewrites || []).map(r => ({ ...r, test: matcher(r.source) }));
const headerRules = (VERCEL.headers || []).map(h => ({ ...h, test: matcher(h.source) }));

function hasMatches(rule, url) {
  if (!rule.has) return true;
  return rule.has.every(h => h.type !== 'query' || (url.searchParams.get(h.key) === h.value));
}

/* Vercel's Node-runtime-helpers die de functies in api/ gebruiken. */
function vercelRes(res) {
  res.status = (c) => { res.statusCode = c; return res; };
  res.send = (b) => { if (typeof b === 'object' && !Buffer.isBuffer(b)) { res.setHeader('Content-Type', 'application/json'); b = JSON.stringify(b); } res.end(b); return res; };
  res.json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); return res; };
  return res;
}
async function runApi(name, req, res, url) {
  const file = path.join(ROOT, 'api', name + '.js');
  if (!fs.existsSync(file)) return false;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  req.query = Object.fromEntries(url.searchParams);
  try { req.body = raw && /json/.test(req.headers['content-type'] || '') ? JSON.parse(raw) : raw; } catch { req.body = raw; }
  delete require.cache[require.resolve(file)];   // pick up edits without a restart
  const handler = require(file);
  await (handler.default || handler)(req, vercelRes(res));
  return true;
}

function send(req, res, status, headers, body) {
  const type = headers['Content-Type'] || '';
  const accepts = req.headers['accept-encoding'] || '';
  if (body.length > 1024 && COMPRESSIBLE.test(type) && /gzip/.test(accepts)) {
    body = zlib.gzipSync(body);
    headers['Content-Encoding'] = 'gzip';
    headers['Vary'] = 'Accept-Encoding';
  }
  headers['Content-Length'] = body.length;
  res.writeHead(status, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

function serveFile(req, res, pathname, status = 200) {
  let file = path.join(ROOT, decodeURIComponent(pathname));
  if (!file.startsWith(ROOT)) return false;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  const headers = { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' };
  for (const rule of headerRules) if (rule.test(pathname)) for (const h of rule.headers) headers[h.key] = h.value;
  if (!headers['Cache-Control']) headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
  const stat = fs.statSync(file);
  const range = req.headers.range;
  if (range && /^(video|audio)\//.test(headers['Content-Type'])) {
    const [a, b] = range.replace('bytes=', '').split('-');
    const start = Number(a), end = b ? Number(b) : stat.size - 1;
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
    return true;
  }
  send(req, res, status, headers, fs.readFileSync(file));
  return true;
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let p = url.pathname;
    if (p === '/') p = '/index.html';

    for (const r of redirects) {
      if (r.test(url.pathname) && hasMatches(r, url)) {
        /* Vercel keeps the query string (?variant=, gclid, utm_*) unless the destination sets its own. */
        const loc = r.destination.includes('?') ? r.destination : r.destination + url.search;
        res.writeHead(r.permanent === false ? 307 : 308, { Location: loc });
        return res.end();
      }
    }
    for (const r of rewrites) {
      if (r.test(url.pathname)) {
        const dest = new URL(r.destination, url);
        if (dest.pathname.startsWith('/api/')) {
          dest.searchParams.forEach((v, k) => url.searchParams.set(k, v));
          req.url = dest.pathname + (url.search || '');   // Vercel hands the function the rewritten URL
          if (await runApi(dest.pathname.slice(5), req, res, url)) return;
        }
        p = dest.pathname;
        break;
      }
    }
    if (p.startsWith('/api/')) {
      if (await runApi(p.slice(5).replace(/\.js$/, ''), req, res, url)) return;
    }
    if (serveFile(req, res, p)) return;
    if (!serveFile(req, res, '/404.html', 404)) { res.writeHead(404); res.end('404'); }
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(String(e && e.stack || e));
  }
}).listen(PORT, () => console.log(`honey op http://localhost:${PORT}  (map ${ROOT})`));
