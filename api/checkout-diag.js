// =============================================================================
// Checkout-diagnose (Vercel serverless).
// De browser stuurt hier één klein JSON-record naartoe zodra het afrekenen
// mislukt, of zodra het pas na een terugvalstap lukt (commerce/commerce.js,
// noteerCheckoutDiag). Het record bevat GEEN persoonsgegevens: alleen veldnamen
// die Shopify afkeurde, foutcodes, aantallen, land en browser.
//
// Doel: de volgende storing meteen kunnen teruglezen in de Vercel runtime-logs
// (Project → Logs, filter op "checkout-diag") in plaats van te moeten gissen
// naar wat de klant zag. Er wordt niets opgeslagen; alleen gelogd.
// =============================================================================

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }

  let body = req.body;
  try {
    if (typeof body === 'string') body = JSON.parse(body);
    if (!body || typeof body !== 'object') body = await leesJson(req);
  } catch (e) { body = null; }
  if (!body) { res.statusCode = 400; return res.end(); }

  // Alleen bekende, ongevaarlijke velden doorlaten; alles wordt afgekapt.
  const rec = {
    t: String(body.t || new Date().toISOString()).slice(0, 40),
    status: String(body.status || '').slice(0, 20),
    stap: String(body.stap || '').slice(0, 30),
    userErrors: Array.isArray(body.userErrors)
      ? body.userErrors.slice(0, 6).map((e) => ({
          field: Array.isArray(e && e.field) ? e.field.join('.').slice(0, 80) : null,
          code: String((e && e.code) || '').slice(0, 30),
          message: String((e && e.message) || '').slice(0, 120),
        }))
      : null,
    fout: body.fout ? String(body.fout).slice(0, 200) : null,
    regels: Number(body.regels) || 0,
    stuks: Number(body.stuks) || 0,
    land: String(body.land || '').slice(0, 2),
    kaart: Number(body.kaart) || 0,
    versie: String(body.versie || '').slice(0, 30),
    ua: String(body.ua || '').slice(0, 120),
    ip_land: String(req.headers['x-vercel-ip-country'] || '').slice(0, 2),
  };

  console.log('checkout-diag ' + JSON.stringify(rec));
  res.statusCode = 204;
  res.end();
};

function leesJson(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 8192) { data = ''; req.destroy(); } });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : null); } catch (e) { resolve(null); } });
    req.on('error', () => resolve(null));
  });
}
