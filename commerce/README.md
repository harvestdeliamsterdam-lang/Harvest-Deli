# Harvest Deli — Commerce architecture (Shopify-ready)

This folder is the **commerce abstraction layer**. The storefront UI (shop,
product, cart drawer, checkout, account) keeps working exactly as today; this
layer makes a later **headless Shopify** integration plug-and-play.

> Stack note: the site is static HTML + vanilla JS (no build/TS/framework).
> Types are expressed as **JSDoc `@typedef`** (`types.js`) — real editor/IntelliSense
> value, zero build. When/if the site moves to Next.js, these map 1:1 to TS interfaces.

## Files
| File | Role |
|------|------|
| `config.js` | One switch: `source: 'mock' | 'shopify'` + Shopify creds + currency/locale. |
| `types.js` | Storefront-shaped types: `Product, ProductVariant, Collection, Cart, CartLine, Customer, Order, Address, Inventory, ProductImage, Money`. |
| `storefront.js` | **The seam.** The only file that calls Shopify. Holds the real GraphQL queries/mutations. Inert until configured. |
| `commerce.js` | `window.Commerce` — the API the frontend should use: `products / collections / cart / customer / search / filters`. Async, Shopify-shaped. Today reads the local catalog; flips to Shopify via config. |

## Separation of concerns
- **UI** — the existing `.html` pages + `shared.css` (presentation only).
- **Data layer** — `commerce/` (this folder): shapes + fetching.
- **Commerce logic** — `HD_CART`, `HD_stock`, `HD_account` (runtime state) — bridged by `commerce.js`.
- **CMS / editorial** — `cms/` (journal, recipes, homepage copy) — kept out of commerce.

## How to connect Shopify later (no UI rewrite)
1. Create a Storefront API access token in Shopify.
2. In `config.js`: set `shopify.domain`, `shopify.storefrontToken`, then `source: 'shopify'`.
3. `commerce.js` read paths (`products.get`, `collections.get`, `search.predictive`) already
   route through `storefront.js` when configured — the GraphQL is written.
4. For cart/checkout: implement `cartCreate`/`cartLinesAdd` in `storefront.js` and return
   Shopify's `checkoutUrl` from `Commerce.cart` (marked `// SEAM`). The checkout page then
   redirects to Shopify Checkout.
5. For customers: swap `Commerce.customer` to the Shopify Customer Account API (marked `// SEAM`).

## Intended folder map for a future framework migration
`/products /collections /cart /checkout /customer /search /filters /utils` — today these are
**namespaces** inside `commerce.js` (`Commerce.products`, `Commerce.collections`, …) to avoid
a module bundler in a static site; they split cleanly into folders when the project gains a build.

## Smoke test (browser console on any page)
```js
await Commerce.products.all();            // 11 Storefront-shaped products
await Commerce.products.get('chestnut');  // single product + variant + images
await Commerce.collections.list();        // raw-honey / olive-oil / mountain-tea / limited / gift
await Commerce.search.predictive('thyme');
await Commerce.cart.get();                // Shopify-shaped cart bridged to HD_CART
```
