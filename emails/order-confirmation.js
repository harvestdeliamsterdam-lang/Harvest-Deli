/**
 * EMAIL TYPE 3, order confirmation (ARCHITECTURE ONLY, NOT ACTIVATED).
 * -----------------------------------------------------------------
 * Shopify already sends the live order confirmation from its own
 * Notifications. This template is a ready, on-brand replacement for the
 * day Harvest Deli wants to send order emails itself (e.g. via a Shopify
 * `orders/paid` webhook → /api/order-confirmation). It is exported but
 * nothing calls it yet. Do not wire it without disabling Shopify's
 * default order email first (to avoid duplicate confirmations).
 */
'use strict';
const L = require('./layout');

/** Format a money line item row. */
function lineRow(item) {
  const name = L.esc(item.name) + (item.variantTitle ? ' <span style="color:' + L.C.inkSoft + ';">· ' + L.esc(item.variantTitle) + '</span>' : '');
  return '<tr>' +
    '<td style="font-family:' + L.SANS + ';font-size:14px;color:' + L.C.ink + ';padding:10px 0;border-bottom:1px solid ' + L.C.hair + ';">' +
      name + ' <span style="color:' + L.C.inkSoft + ';">×' + L.esc(item.qty) + '</span></td>' +
    '<td align="right" style="font-family:' + L.SANS + ';font-size:14px;color:' + L.C.ink + ';padding:10px 0;border-bottom:1px solid ' + L.C.hair + ';white-space:nowrap;">' +
      L.esc(item.lineTotal) + '</td></tr>';
}

/**
 * @param {import('./index').OrderData} order
 * @returns {{ subject: string, html: string }}
 */
function orderConfirmation(order) {
  const first = (order.customerName || '').trim().split(/\s+/)[0] || '';
  const items = (order.items || []).map(lineRow).join('');
  const totals =
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 0;">' +
    (order.shipping != null ? '<tr><td style="font-family:' + L.SANS + ';font-size:13px;color:' + L.C.inkSoft + ';padding:4px 0;">Shipping</td><td align="right" style="font-family:' + L.SANS + ';font-size:13px;color:' + L.C.inkSoft + ';">' + L.esc(order.shipping) + '</td></tr>' : '') +
    '<tr><td style="font-family:' + L.SANS + ';font-size:15px;font-weight:700;color:' + L.C.ink + ';padding:8px 0 0;">Total</td>' +
    '<td align="right" style="font-family:' + L.SANS + ';font-size:15px;font-weight:700;color:' + L.C.ink + ';padding:8px 0 0;">' + L.esc(order.total) + '</td></tr></table>';

  const body =
    L.eyebrow('Order ' + L.esc(order.orderNumber)) +
    L.heading((first ? 'Thank you, ' + L.esc(first) + '.' : 'Thank you.')) +
    '<div style="height:22px;"></div>' +
    L.paragraph('Your order is confirmed and is being prepared with care. We will write again the moment it ships.') +
    '<div style="height:6px;"></div>' + L.hr() + '<div style="height:18px;"></div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + items + '</table>' +
    totals +
    '<div style="height:22px;"></div>' +
    L.kv('Shipping to', L.multiline(order.shippingAddress || '')) +
    '<div style="height:6px;"></div>' +
    L.button('View your order', order.statusUrl || 'https://harvestdeli.nl/track-order.html');

  return {
    subject: 'Your Harvest Deli order ' + L.esc(order.orderNumber) + ' is confirmed',
    html: L.shell({ preheader: 'Thank you, your Harvest Deli order is confirmed.', body: body }),
  };
}

module.exports = { orderConfirmation };
