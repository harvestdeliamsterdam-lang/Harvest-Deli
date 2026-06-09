# Harvest Deli — Commerce architecture (Shopify-ready)

This folder is the **commerce abstraction layer**. The storefront UI (shop,
product, cart drawer, checkout, account) keeps working exactly as today; this
layer makes the **headless Shopify Storefront API** integration plug-and-play.

> Stack note: the site is **static HTML + vanilla JS** (no build / TS / framework,
> Vercel static hosting). Types are JSDoc `@typedef` (`types.js`). Nothing here
> converts the site to Next.js.

## Files
| File | Role |
|------|------|
| `config.js` | One switch: `source: 'mock' \| 'shopify'` + Shopify creds + currency/locale. **The token goes here.** |
| `types.js` | Storefront-shaped types (`Product, ProductVariant, Collection, Cart, …`). |
| `storefront.js` | **The seam.** The only file that calls Shopify. GraphQL queries/mutations + a safe (timeout + fallback) fetch. Inert until configured. |
| `commerce.js` | `window.Commerce` — the API the frontend uses: `products / collections / cart / checkout / search / filters / customer / sync`. Async, Shopify-shaped. Reads the local catalog today; flips to Shopify via config. |

---

## ⬛ Where the Shopify token must be added (the only edit to go live)

Open **`commerce/config.js`** and set two values:

```js
window.HD_COMMERCE_CONFIG = {
  source: 'shopify',                        // 1) was 'mock'
  shopify: {
    domain: 'su08c4-v4.myshopify.com',      // already set (the connected store)
    storefrontToken: 'PASTE_TOKEN_HERE',    // 2) Storefront API access token
    apiVersion: '2024-10'
  }
};
```

Get the token in Shopify admin → **Settings → Apps and sales channels → Develop apps
→ (your app) → API credentials → Storefront API access token**. It is a **public,
read-only** token, safe in client code. **Never** put the Admin API token here.

That's it — no other file changes. Because there's no build step, the value is read
directly from `config.js` at runtime.

---

## How the Shopify checkout flow works

The on-site cart UX stays local (`HD_CART` — size/bundle/offer aware). Shopify's
**hosted checkout** is used at the final step:

1. User adds items → they live in `HD_CART` (drawer, totals, the €5 offer).
2. On **Checkout**, `Commerce.checkout()` runs:
   - **Live + synced:** builds Shopify cart lines from `HD_CART` (mapping each
     `slug | sizeLabel` → Shopify `variantId` via the synced `VARIANT_MAP`),
     calls `cartCreate`, and returns Shopify's `checkoutUrl` → the browser
     redirects to **Shopify Checkout** (payments, taxes, shipping handled by Shopify).
   - **Mock / not synced / API error:** returns `checkout.html` → the existing
     local wizard (unchanged). This is the automatic, safe fallback.
3. A click interceptor on `a.cart-checkout` (and any `[data-shopify-checkout]`)
   performs the redirect — **inert while `source: 'mock'`** (the link behaves normally),
   so today's UI/flow is byte-identical.

## How storefront syncing works (real products replace mock)

`Commerce.sync.run()` (call once after going live, e.g. on shop load):

- Fetches every product via the Storefront API (`products` query).
- Caches them at `window.HD_SHOPIFY` (by handle).
- Builds `VARIANT_MAP` (`slug|sizeLabel → variantId`) in `localStorage` — this is
  what lets `Commerce.checkout()` create real Shopify carts.
- `Commerce.sync.localShape(handle)` returns a product in the **`HD_product` shape**
  (name, sizes, price, image, tags…). This is the seam to let real Shopify data
  **replace the mock catalog** in `shared.js` rendering: point `HD_product` at
  `Commerce.sync.localShape` once your Shopify products carry the needed fields
  (region/altitude/hue can be modelled as Shopify **metafields** and mapped in
  `localShape`). Until then the mock catalog renders, so nothing breaks.

Read paths that already route to Shopify when live (else mock):
`Commerce.products.get/all`, `Commerce.collections.get`, `Commerce.search.predictive`.

## Error handling (the site never breaks)

- `storefront.safeFetch()` wraps every call with a **9s timeout** + try/catch and
  returns `null` on any failure (network, 4xx/5xx, GraphQL error, abort).
- Every `Commerce` read falls back to the local mock catalog when `safeFetch`
  returns `null`.
- `Commerce.checkout()` falls back to the local `checkout.html` wizard if the
  Shopify cart can't be created.
- `useShopify()` gates everything: unless `source: 'shopify'` **and** a token is
  present, not a single Shopify call is made.

---

## Smoke test (browser console, once `source:'shopify'` + token set)
```js
await Commerce.sync.run();                 // { ok:true, count, variants }
await Commerce.products.all();             // products from Shopify (or mock fallback)
await Commerce.products.get('chestnut');
await Commerce.checkout();                 // → Shopify checkoutUrl (or 'checkout.html')
```
With the default `source:'mock'` these all resolve from the local catalog.
