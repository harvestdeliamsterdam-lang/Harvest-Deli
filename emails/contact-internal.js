/**
 * EMAIL TYPE 1 — internal notification sent to hello@harvestdeli.nl when a
 * customer submits the contact (or partnership) form. Reads like a luxury
 * brand inquiry: structured, calm, gold-accented.
 */
'use strict';
const L = require('./layout');

/**
 * @param {import('./index').InquiryData} d
 * @returns {{ subject: string, html: string }}
 */
function contactInternal(d) {
  const isPartner = d.formType === 'partnership';
  const who = d.name || d.company || 'A visitor';
  const subject = (isPartner ? 'New partnership request — ' : 'New inquiry — ') + who;

  let rows = '';
  rows += L.kv('Name', L.esc(d.name) || '&mdash;');
  if (d.company) rows += L.kv(isPartner ? 'Company' : 'House / business', L.esc(d.company));
  rows += L.kv('Email', '<a href="mailto:' + L.esc(d.email) + '" style="color:' + L.C.goldDeep + ';text-decoration:none;">' + L.esc(d.email) + '</a>');
  rows += L.kv('Subject', isPartner ? 'Partnership request' : 'General enquiry');
  if (d.country) rows += L.kv('Country', L.esc(d.country));
  if (d.businessType) rows += L.kv('Business type', L.esc(d.businessType));
  if (d.volume) rows += L.kv('Estimated volume', L.esc(d.volume));
  rows += L.kv('Received', L.esc(d.timestamp));

  const body =
    L.eyebrow(isPartner ? 'Partnership request received' : 'Contact request received') +
    L.heading(who + ' wrote to you.') +
    '<div style="height:24px;"></div>' +
    rows +
    '<div style="height:6px;"></div>' + L.hr() + '<div style="height:22px;"></div>' +
    L.kv('Message', '<span style="font-family:' + L.SERIF + ';font-size:16px;line-height:1.8;color:' + L.C.ink + ';">' + L.multiline(d.message) + '</span>') +
    '<div style="height:20px;"></div>' +
    L.button('Reply to ' + (d.name || 'them'), 'mailto:' + L.esc(d.email)) +
    '<p style="margin:14px 0 0;font-family:' + L.SANS + ';font-size:12px;color:' + L.C.inkSoft + ';">Reply directly to this email — it goes straight to ' + L.esc(d.email) + '.</p>';

  return { subject: subject, html: L.shell({ preheader: (isPartner ? 'Partnership request from ' : 'Message from ') + who, body: body }) };
}

module.exports = { contactInternal };
