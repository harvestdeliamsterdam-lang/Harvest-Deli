/**
 * Harvest Deli — email template registry.
 * Single import surface for the API layer:
 *   const { contactInternal, contactConfirmation, orderConfirmation } = require('../emails');
 *
 * Types are expressed as JSDoc @typedefs — fully checkable by the
 * TypeScript language server (`// @ts-check`) without adding a build step
 * to this static site, matching the project's existing typing approach.
 */
'use strict';

/**
 * @typedef {Object} InquiryData
 * @property {'contact'|'partnership'} formType
 * @property {string} name        Customer full name (sanitized upstream)
 * @property {string} email       Customer email (validated upstream)
 * @property {string} message     Free-text message
 * @property {string} [company]   House / business / company name
 * @property {string} [country]   Country, if provided
 * @property {string} [businessType] Partnership only
 * @property {string} [volume]    Partnership only — estimated volume
 * @property {string} timestamp   Human-readable received time (Europe/Amsterdam)
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} name
 * @property {string} [variantTitle]
 * @property {number|string} qty
 * @property {string} lineTotal  Pre-formatted money string (e.g. "€36,00")
 */

/**
 * @typedef {Object} OrderData
 * @property {string} orderNumber
 * @property {string} [customerName]
 * @property {OrderItem[]} items
 * @property {string} [shipping]   Pre-formatted money string
 * @property {string} total        Pre-formatted money string
 * @property {string} [shippingAddress]
 * @property {string} [statusUrl]
 */

const layout = require('./layout');
const { contactInternal } = require('./contact-internal');
const { contactConfirmation } = require('./contact-confirmation');
const { orderConfirmation } = require('./order-confirmation');

module.exports = { layout, contactInternal, contactConfirmation, orderConfirmation };
