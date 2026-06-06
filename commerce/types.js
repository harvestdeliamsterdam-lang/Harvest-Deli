/* =================================================================
   Harvest Deli — Commerce types (JSDoc; the vanilla equivalent of
   TypeScript interfaces). These intentionally mirror the Shopify
   Storefront API so integration is plug-and-play. No runtime code.
   ================================================================= */

/** @typedef {{ amount: string, currencyCode: string }} Money */

/** @typedef {Object} ProductImage
 *  @property {string} id
 *  @property {string} url
 *  @property {string} altText
 *  @property {number} [width]
 *  @property {number} [height] */

/** @typedef {{ name: string, value: string }} SelectedOption */

/** @typedef {Object} ProductVariant
 *  @property {string} id                 // gid://shopify/ProductVariant/...
 *  @property {string} title              // e.g. "250 g"
 *  @property {string} [sku]
 *  @property {boolean} availableForSale
 *  @property {number} quantityAvailable
 *  @property {Money} price
 *  @property {Money} [compareAtPrice]
 *  @property {SelectedOption[]} selectedOptions
 *  @property {ProductImage} [image] */

/** @typedef {Object} SEO
 *  @property {string} title
 *  @property {string} description */

/** @typedef {Object} Product
 *  @property {string} id                 // gid://shopify/Product/...
 *  @property {string} handle             // url slug
 *  @property {string} title
 *  @property {string} descriptionHtml
 *  @property {string} productType        // 'Honey' | 'Olive Oil' | 'Tea'
 *  @property {string} vendor
 *  @property {string[]} tags
 *  @property {string[]} collections      // collection handles
 *  @property {ProductImage[]} images
 *  @property {ProductVariant[]} variants
 *  @property {{ minVariantPrice: Money, maxVariantPrice: Money }} priceRange
 *  @property {boolean} availableForSale
 *  @property {number} totalInventory
 *  @property {SEO} seo
 *  @property {Object} [metafields]       // editorial: ingredients, nutrition, origin… */

/** @typedef {Object} Collection
 *  @property {string} id
 *  @property {string} handle
 *  @property {string} title
 *  @property {string} descriptionHtml
 *  @property {ProductImage} [image]
 *  @property {SEO} seo
 *  @property {string[]} productHandles */

/** @typedef {Object} CartLine
 *  @property {string} id                 // line id
 *  @property {string} merchandiseId      // variant id
 *  @property {string} handle
 *  @property {string} title
 *  @property {string} variantTitle
 *  @property {number} quantity
 *  @property {Money} unitPrice
 *  @property {Money} lineTotal
 *  @property {ProductImage} [image] */

/** @typedef {Object} CartCost
 *  @property {Money} subtotalAmount
 *  @property {Money} totalAmount
 *  @property {Money} [totalTaxAmount] */

/** @typedef {Object} Cart
 *  @property {string} id
 *  @property {CartLine[]} lines
 *  @property {number} totalQuantity
 *  @property {CartCost} cost
 *  @property {string} [discountCode]
 *  @property {string} checkoutUrl */

/** @typedef {Object} Address
 *  @property {string} [firstName] @property {string} [lastName]
 *  @property {string} [company]   @property {string} address1
 *  @property {string} [address2]  @property {string} city
 *  @property {string} [province]  @property {string} zip
 *  @property {string} country     @property {string} [phone] */

/** @typedef {Object} Customer
 *  @property {string} id
 *  @property {string} firstName @property {string} lastName
 *  @property {string} email     @property {string} [phone]
 *  @property {Address[]} addresses
 *  @property {Order[]} orders */

/** @typedef {Object} Order
 *  @property {string} id
 *  @property {string} name               // e.g. "HD-2026-000482"
 *  @property {string} processedAt
 *  @property {string} financialStatus    // pending|paid|refunded…
 *  @property {string} fulfillmentStatus  // unfulfilled|fulfilled…
 *  @property {Money} totalPrice
 *  @property {CartLine[]} lineItems
 *  @property {Address} [shippingAddress] */

/** @typedef {Object} Inventory
 *  @property {string} variantId
 *  @property {number} available
 *  @property {'in_stock'|'low_stock'|'out_of_stock'|'backorder'} state */
