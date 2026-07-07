/**
 * EMAIL TYPE 2, warm confirmation sent back to the customer.
 * Tone: elegant, personal, premium. An extension of the website voice.
 */
'use strict';
const L = require('./layout');

/**
 * @param {import('./index').InquiryData} d
 * @returns {{ subject: string, html: string }}
 */
function contactConfirmation(d) {
  const first = (d.name || '').trim().split(/\s+/)[0] || '';
  const greeting = first ? 'Dear ' + L.esc(first) + ',' : 'Hello,';

  const body =
    L.eyebrow('Thank you') +
    L.heading('Thank you for contacting Harvest Deli.') +
    '<div style="height:26px;"></div>' +
    L.paragraph(greeting) +
    L.paragraph('Thank you for reaching out to Harvest Deli. We have received your message successfully and will personally review it.') +
    L.paragraph('Our team will get back to you shortly, usually within two business days.', { soft: true }) +
    '<div style="height:8px;"></div>' + L.hr() + '<div style="height:22px;"></div>' +
    L.paragraph('From the mountains of Greece, with care.<br><span style="font-family:' + L.SERIF + ';font-size:17px;color:' + L.C.ink + ';">Harvest Deli</span>') +
    '<div style="height:14px;"></div>' +
    L.button('Explore the collection', 'https://harvestdeli.nl/shop.html');

  return {
    subject: 'We have received your message, Harvest Deli',
    html: L.shell({ preheader: 'Thank you for writing to Harvest Deli. We will reply within two business days.', body: body }),
  };
}

module.exports = { contactConfirmation };
