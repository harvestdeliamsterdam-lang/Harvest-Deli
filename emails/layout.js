/**
 * Harvest Deli, shared email layout + primitives.
 * -----------------------------------------------------------------
 * Email clients strip <style>, flexbox, grid and most modern CSS, so
 * every template is built from nested <table>s with INLINE styles only.
 * This module is the single source of brand truth for all emails
 * (contact, confirmation, future order confirmation) so they stay
 * visually identical, an extension of the harvestdeli.nl experience.
 *
 * Pure CommonJS, no dependencies, safe inside a Vercel Node function.
 */
'use strict';

/* Brand tokens (mirrors shared.css :root, tuned for email rendering). */
const C = {
  page: '#EDE4D2',      // soft cream rim behind the card
  card: '#F6F1E8',      // warm ivory surface (brand email background)
  ink: '#2B2118',       // espresso, primary text
  inkSoft: '#6B6051',   // muted secondary text
  gold: '#B8945A',
  goldDeep: '#8A6228',  // active/accent gold, AA on cream
  hair: '#E3D8C0',      // gold-tinted hairline
};
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Hidden preheader (inbox preview line). */
function preheader(text) {
  return (
    '<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;' +
    'font-size:1px;line-height:1px;color:' + C.card + ';opacity:0;">' +
    esc(text) +
    '&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;' +
    '</div>'
  );
}

/** Escape user-supplied text for safe HTML embedding. */
function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Preserve author line breaks in a sanitized block of prose. */
function multiline(v) {
  return esc(v).replace(/\r\n|\r|\n/g, '<br>');
}

/* ---- primitives (return inline-styled HTML strings) ---- */

function eyebrow(text) {
  return '<p style="margin:0 0 10px;font-family:' + SANS + ';font-size:10px;' +
    'letter-spacing:3px;text-transform:uppercase;color:' + C.goldDeep + ';font-weight:700;">' +
    esc(text) + '</p>';
}

function heading(text) {
  return '<h1 style="margin:0;font-family:' + SERIF + ';font-weight:400;' +
    'font-size:26px;line-height:1.25;color:' + C.ink + ';letter-spacing:-0.01em;">' +
    esc(text) + '</h1>';
}

function paragraph(html, opts) {
  opts = opts || {};
  return '<p style="margin:0 0 18px;font-family:' + SANS + ';font-size:15px;' +
    'line-height:1.75;color:' + (opts.soft ? C.inkSoft : C.ink) + ';">' + html + '</p>';
}

/** Thin gold divider rule. */
function hr() {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
    '<tr><td style="border-top:1px solid ' + C.hair + ';font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>' +
    '</table>';
}

/** Label / value row used in the internal inquiry layout. */
function kv(label, valueHtml) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px;">' +
    '<tr><td style="font-family:' + SANS + ';font-size:9.5px;letter-spacing:2px;text-transform:uppercase;' +
    'color:' + C.goldDeep + ';font-weight:700;padding:0 0 3px;">' + esc(label) + '</td></tr>' +
    '<tr><td style="font-family:' + SANS + ';font-size:15px;line-height:1.6;color:' + C.ink + ';">' +
    valueHtml + '</td></tr></table>';
}

/** Solid espresso pill button (table-based for Outlook). */
function button(label, url) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px;">' +
    '<tr><td bgcolor="' + C.ink + '" style="border-radius:999px;">' +
    '<a href="' + esc(url) + '" style="display:inline-block;padding:13px 30px;font-family:' + SANS + ';' +
    'font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#F7F2E8;text-decoration:none;font-weight:700;">' +
    esc(label) + '</a></td></tr></table>';
}

/**
 * Wrap body content in the branded shell (wordmark header + footer).
 * @param {{ preheader?: string, body: string }} opts
 * @returns {string} full email HTML document
 */
function shell(opts) {
  const pre = opts.preheader ? preheader(opts.preheader) : '';
  return (
'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
'<meta name="viewport" content="width=device-width,initial-scale=1">' +
'<meta name="x-apple-disable-message-reformatting">' +
'<title>Harvest Deli</title></head>' +
'<body style="margin:0;padding:0;background:' + C.page + ';">' +
pre +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + C.page + ';">' +
'<tr><td align="center" style="padding:32px 16px;">' +
  '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:' + C.card + ';border:1px solid ' + C.hair + ';border-radius:4px;">' +
    // header / wordmark
    '<tr><td align="center" style="padding:40px 40px 26px;">' +
      eyebrow('Premium Greek Products') +
      '<div style="font-family:' + SERIF + ';font-size:24px;letter-spacing:5px;color:' + C.ink + ';font-weight:400;">HARVEST&nbsp;&nbsp;DELI</div>' +
    '</td></tr>' +
    '<tr><td style="padding:0 40px;">' + hr() + '</td></tr>' +
    // body
    '<tr><td style="padding:34px 40px 8px;">' + opts.body + '</td></tr>' +
    // footer
    '<tr><td style="padding:8px 40px 36px;">' + hr() +
      '<p style="margin:18px 0 0;font-family:' + SANS + ';font-size:11px;line-height:1.7;color:' + C.inkSoft + ';text-align:center;">' +
        'Harvest Deli &middot; Amsterdam, Nederland<br>' +
        '<a href="https://harvestdeli.nl" style="color:' + C.goldDeep + ';text-decoration:none;">harvestdeli.nl</a> &middot; ' +
        '<a href="mailto:hello@harvestdeli.nl" style="color:' + C.goldDeep + ';text-decoration:none;">hello@harvestdeli.nl</a>' +
      '</p>' +
    '</td></tr>' +
  '</table>' +
'</td></tr></table></body></html>'
  );
}

module.exports = { C, SERIF, SANS, shell, eyebrow, heading, paragraph, hr, kv, button, esc, multiline, preheader };
