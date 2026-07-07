// @ts-check
/**
 * Harvest Deli, contact / partnership form handler (Vercel serverless).
 * -----------------------------------------------------------------
 * POST /api/contact  →  sends two transactional emails via Resend:
 *   1) internal notification to hello@harvestdeli.nl (reply-to = customer)
 *   2) warm confirmation to the customer
 *
 * Resend is the ONLY provider. No SDK, plain fetch to the REST API, so
 * this needs zero npm install and deploys on the existing static project.
 *
 * Security: same-origin gate · honeypot · time-trap · in-memory rate
 * limit · strict server-side validation · length caps · HTML-escaped
 * output (escaping happens in /emails templates).
 */
'use strict';

const { contactInternal, contactConfirmation } = require('../emails');

const TO = 'hello@harvestdeli.nl';
const FROM = 'Harvest Deli <hello@harvestdeli.nl>';
const RESEND_URL = 'https://api.resend.com/emails';

/* ---- in-memory rate limiter (best-effort; per warm instance) ---- */
const HITS = new Map(); // ip -> number[] (timestamps ms)
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
function rateLimited(ip) {
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 5000) HITS.clear(); // crude memory cap
  return arr.length > MAX_PER_WINDOW;
}

/* ---- helpers ---- */
function clean(v, max) {
  // strip control chars, collapse whitespace runs, trim, cap length
  return String(v == null ? '' : v)
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, max || 500);
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 100000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

/** Derive a readable plain-text alternative from an HTML email (better
 *  inbox placement, multipart text+html scores lower in spam filters). */
function htmlToText(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/(p|div|tr|h1|h2|h3|td|table)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&middot;/g, '·').replace(/&mdash;/g, ',')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
}

async function sendEmail(payload) {
  if (payload.html && !payload.text) payload.text = htmlToText(payload.html);
  const r = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 405; return res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
  }

  // Same-origin gate (allow prod, vercel previews, localhost).
  const origin = String(req.headers.origin || req.headers.referer || '');
  if (origin && !/(^https?:\/\/(.*\.)?harvestdeli\.nl)|(\.vercel\.app)|(localhost)|(127\.0\.0\.1)/i.test(origin)) {
    res.statusCode = 403; return res.end(JSON.stringify({ ok: false, error: 'Forbidden' }));
  }

  if (!process.env.RESEND_API_KEY) {
    res.statusCode = 500; return res.end(JSON.stringify({ ok: false, error: 'Email service not configured' }));
  }

  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) {
    res.statusCode = 429; return res.end(JSON.stringify({ ok: false, error: 'Too many requests. Please try again later.' }));
  }

  const b = await readBody(req);

  // Bot traps, silently accept (200) so bots don't learn the filter.
  const honeypot = clean(b.company_url || b.website, 200); // hidden field, must be empty
  const t = Number(b.t || 0);
  const elapsed = Date.now() - t;
  if (honeypot || !t || elapsed < 2500 || elapsed > 1000 * 60 * 60 * 6) {
    res.statusCode = 200; return res.end(JSON.stringify({ ok: true }));
  }

  // Collect + sanitize.
  const formType = b.formType === 'partnership' ? 'partnership' : 'contact';
  const name = clean(b.name, 120);
  const email = clean(b.email, 200).toLowerCase();
  const message = clean(b.message, 5000);
  const company = clean(b.company, 200);
  const country = clean(b.country, 120);
  const businessType = clean(b.businessType, 120);
  const volume = clean(b.volume, 200);

  // Server-side validation.
  const errors = {};
  if (name.length < 2) errors.name = 'Please enter your name.';
  if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';
  if (formType === 'contact' && message.length < 5) errors.message = 'Please enter a message.';
  if (Object.keys(errors).length) {
    res.statusCode = 400; return res.end(JSON.stringify({ ok: false, errors: errors }));
  }

  const timestamp = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Amsterdam',
  }).format(new Date()) + ' (CET)';

  /** @type {import('../emails').InquiryData} */
  const data = { formType, name, email, message: message || '(no message)', company, country, businessType, volume, timestamp };

  try {
    const internal = contactInternal(data);
    const sent = await sendEmail({ from: FROM, to: [TO], reply_to: email, subject: internal.subject, html: internal.html });
    if (!sent.ok) {
      console.error('Resend internal send failed', sent.status, sent.data);
      res.statusCode = 502; return res.end(JSON.stringify({ ok: false, error: 'Could not send your message. Please email us at hello@harvestdeli.nl.' }));
    }
    // Customer confirmation, best-effort (never fails the request).
    try {
      const conf = contactConfirmation(data);
      await sendEmail({ from: FROM, to: [email], reply_to: TO, subject: conf.subject, html: conf.html });
    } catch (e) { console.error('Confirmation send error', e); }

    res.statusCode = 200; return res.end(JSON.stringify({ ok: true, id: sent.data && sent.data.id }));
  } catch (err) {
    console.error('contact handler error', err);
    res.statusCode = 500; return res.end(JSON.stringify({ ok: false, error: 'Unexpected error. Please email hello@harvestdeli.nl.' }));
  }
};
