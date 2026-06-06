/* =================================================================
   Harvest Deli, Transactional email architecture
   -----------------------------------------------------------------
   Reusable, table-based, responsive branded email templates with a
   tiny component system and dynamic variables. Pure rendering, it
   returns HTML strings. Sending is a backend concern:

   SEAM (Resend / Postmark / SendGrid):
     const html = HD_emails.render('orderConfirmation', data);
     await resend.emails.send({ from, to, subject: HD_emails.subject(type,data), html });
   Queue-ready: render is synchronous & side-effect free, so it can run
   in a worker/queue job. Errors surface as thrown TypeErrors on bad data
  , callers should try/catch and dead-letter.
   ================================================================= */
(function () {
  'use strict';

  var BRAND = {
    name: 'Harvest Deli',
    tagline: 'Premium Greek products',
    ink: '#1F1A14', cream: '#FAF6EE', bg: '#F5EFE4', gold: '#B8945A', goldDeep: '#8A6228', soft: '#5C5247',
    site: 'https://harvestdeli.gr', supportEmail: 'orders@harvestdeli.gr'
  };
  function money(n) { n = Math.round((Number(n) || 0) * 100) / 100; return Number.isInteger(n) ? '€' + n : '€' + n.toFixed(2); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  /* ---------------- components ---------------- */
  function button(label, href) {
    return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0"><tr><td style="border-radius:999px;background:' + BRAND.ink + '">' +
      '<a href="' + esc(href) + '" style="display:inline-block;padding:15px 34px;font-family:Inter,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:' + BRAND.cream + ';text-decoration:none;border-radius:999px">' + esc(label) + '</a>' +
    '</td></tr></table>';
  }
  function divider() { return '<hr style="border:none;border-top:1px solid rgba(26,22,18,0.12);margin:24px 0">'; }
  function lineItems(items) {
    if (!items || !items.length) return '';
    var rows = items.map(function (i) {
      return '<tr><td style="padding:8px 0;font-family:Inter,Arial,sans-serif;font-size:14px;color:' + BRAND.ink + '">' + esc(i.name) + ' <span style="color:' + BRAND.soft + '">× ' + (i.qty || 1) + '</span></td>' +
        '<td align="right" style="padding:8px 0;font-family:Inter,Arial,sans-serif;font-size:14px;color:' + BRAND.ink + '">' + money((i.price || 0) * (i.qty || 1)) + '</td></tr>';
    }).join('');
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + rows + '</table>';
  }
  function totals(o) {
    function row(label, val, strong) {
      return '<tr><td style="padding:5px 0;font-family:Inter,Arial,sans-serif;font-size:' + (strong ? '16px' : '13px') + ';color:' + (strong ? BRAND.ink : BRAND.soft) + '">' + esc(label) + '</td>' +
        '<td align="right" style="padding:5px 0;font-family:' + (strong ? 'Newsreader,Georgia,serif' : 'Inter,Arial,sans-serif') + ';font-size:' + (strong ? '18px' : '13px') + ';color:' + BRAND.ink + '">' + val + '</td></tr>';
    }
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px">' +
      row('Subtotal', money(o.subtotal)) +
      (o.discount > 0 ? row('Discount', '−' + money(o.discount)) : '') +
      row('Shipping', o.shipping ? money(o.shipping) : 'Free') +
      row('Total', money(o.total), true) + '</table>';
  }

  /* ---------------- base layout ---------------- */
  function layout(opts) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta name="color-scheme" content="light dark"><title>' + esc(opts.subject) + '</title></head>' +
      '<body style="margin:0;padding:0;background:' + BRAND.bg + ';">' +
      '<div style="display:none;max-height:0;overflow:hidden;opacity:0">' + esc(opts.preheader || '') + '</div>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + BRAND.bg + ';padding:32px 16px"><tr><td align="center">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:' + BRAND.cream + ';border-radius:16px;overflow:hidden;border:1px solid rgba(26,22,18,0.08)">' +
      // header
      '<tr><td style="padding:30px 36px 18px;text-align:center;border-bottom:1px solid rgba(26,22,18,0.08)">' +
        '<div style="font-family:Newsreader,Georgia,serif;font-size:24px;letter-spacing:3px;color:' + BRAND.goldDeep + '">HARVEST DELI</div>' +
        '<div style="font-family:Inter,Arial,sans-serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:' + BRAND.soft + ';margin-top:4px">' + BRAND.tagline + '</div>' +
      '</td></tr>' +
      // body
      '<tr><td style="padding:34px 36px">' + opts.body + '</td></tr>' +
      // footer
      '<tr><td style="padding:22px 36px 30px;border-top:1px solid rgba(26,22,18,0.08);text-align:center">' +
        '<div style="font-family:Inter,Arial,sans-serif;font-size:11px;line-height:1.7;color:' + BRAND.soft + '">' +
        'Questions? <a href="mailto:' + BRAND.supportEmail + '" style="color:' + BRAND.goldDeep + '">' + BRAND.supportEmail + '</a><br>' +
        '© ' + BRAND.name + ' · Pelion, Greece</div>' +
      '</td></tr>' +
      '</table></td></tr></table></body></html>';
  }
  function h(t) { return '<h1 style="font-family:Newsreader,Georgia,serif;font-weight:400;font-size:26px;line-height:1.2;color:' + BRAND.ink + ';margin:0 0 14px">' + esc(t) + '</h1>'; }
  function p(t) { return '<p style="font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.7;color:' + BRAND.soft + ';margin:0 0 14px">' + t + '</p>'; }

  /* ---------------- templates ---------------- */
  var T = {
    orderConfirmation: function (d) {
      return { subject: 'Your Harvest Deli order ' + (d.orderId || ''), preheader: 'We have your order and are wrapping it by hand.',
        body: h('Thank you, ' + (d.firstName || 'friend') + '.') + p('Your order <strong>' + esc(d.orderId) + '</strong> is confirmed. We are already wrapping it by hand and sealing it with wax.') +
          divider() + lineItems(d.items) + totals(d) + button('View your order', BRAND.site + '/account-orders.html') };
    },
    paymentConfirmation: function (d) {
      return { subject: 'Payment received · ' + (d.orderId || ''), preheader: 'Your payment was successful.',
        body: h('Payment received.') + p('We have received your payment of <strong>' + money(d.total) + '</strong> for order ' + esc(d.orderId) + ' via ' + esc(d.paymentLabel || 'your chosen method') + '.') + totals(d) };
    },
    shippingConfirmation: function (d) {
      return { subject: 'Your order has shipped · ' + (d.orderId || ''), preheader: 'On its way from the Netherlands.',
        body: h('On its way.') + p('Order <strong>' + esc(d.orderId) + '</strong> has left us, carefully packed, via ' + esc(d.carrier || 'PostNL') + '.') + button('Track & trace', d.trackUrl || (BRAND.site + '/track-order.html')) };
    },
    trackTrace: function (d) {
      return { subject: 'Track your Harvest Deli order', preheader: 'Follow your parcel.',
        body: h('Follow your parcel.') + p('Tracking is now live for order ' + esc(d.orderId) + ' (' + esc(d.carrier || 'PostNL') + ', ' + esc(d.tracking || '-') + ').') + button('Open tracking', d.trackUrl || (BRAND.site + '/track-order.html')) };
    },
    delivered: function (d) {
      return { subject: 'Delivered · ' + (d.orderId || ''), preheader: 'Your jars have arrived.',
        body: h('Delivered.') + p('Order ' + esc(d.orderId) + ' has been delivered. We hope it brings a little of the Greek sun to your table.') + button('Leave a note', BRAND.site + '/account-orders.html') };
    },
    accountCreated: function (d) {
      return { subject: 'Welcome to Harvest Deli', preheader: 'Your account is ready.',
        body: h('Welcome, ' + (d.firstName || 'friend') + '.') + p('Your account is ready. You can follow orders, save addresses and check out faster next time.') + button('Go to your account', BRAND.site + '/account.html') };
    },
    passwordReset: function (d) {
      return { subject: 'Reset your password', preheader: 'A link to set a new password.',
        body: h('Reset your password.') + p('We received a request to reset your password. This link expires in 60 minutes. If you did not ask for this, you can ignore this email.') + button('Set a new password', d.resetUrl || (BRAND.site + '/forgot-password.html')) };
    },
    abandonedCart: function (d) {
      return { subject: 'Your cellar is waiting', preheader: 'A few jars are still in your cart.',
        body: h('Still thinking it over?') + p('Your selection is held quietly in your cart. Pick up where you left off whenever you are ready.') + lineItems(d.items) + button('Return to your cart', BRAND.site + '/checkout.html') };
    },
    contactConfirmation: function (d) {
      return { subject: 'We received your message', preheader: 'Thank you for writing.',
        body: h('Thank you for writing.') + p('We have your message and will reply within two business days. For urgent matters, write to ' + BRAND.supportEmail + '.') };
    }
  };

  function render(type, data) {
    var t = T[type];
    if (!t) throw new TypeError('Unknown email template: ' + type);
    var built = t(data || {});
    return layout(built);
  }
  function subject(type, data) {
    var t = T[type]; if (!t) throw new TypeError('Unknown email template: ' + type);
    return t(data || {}).subject;
  }

  window.HD_emails = { render: render, subject: subject, types: Object.keys(T) };
})();
