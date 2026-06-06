# Harvest Deli — CMS / editorial layer (Sanity-ready)

Editorial content is kept **separate from commerce**. Commerce (products, pricing,
inventory, cart, orders, customers) lives in `/commerce`; everything below is content.

## Editorial content (CMS)
- Journal / blog posts (`journal.html`, `article-*.html`)
- Storytelling & origin (`about.html`, product origin sections)
- Recipes / pairings
- Homepage editorial sections
- Markets / estate copy

## Why separate
Editorial changes often and is non-transactional; it should be owned by editors in a CMS,
not coupled to the Shopify catalog. This mirrors the standard headless split:
**Shopify = commerce, Sanity = content**, composed on the frontend.

## Sanity integration seam (later)
1. Define schemas: `post`, `recipe`, `homeSection`, `author`, `pageHero`.
2. Add `cms/sanity.js` exposing `getPosts()`, `getPost(slug)`, `getHomeSections()`
   (mirror the `commerce/storefront.js` pattern: one fetch seam + typed responses).
3. Product pages compose: `Commerce.products.get(handle)` (commerce) +
   `CMS.getProductStory(handle)` (editorial metafields/recipes).

Today editorial copy lives inline in the HTML + the i18n dictionary in `shared.js`;
this README marks the boundary so the migration is mechanical, not a rewrite.
