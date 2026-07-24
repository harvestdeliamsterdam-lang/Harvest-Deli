# Product reviews — architecture (prepared, NOT active)

Harvest Deli shows a truthful **empty state** on every product page until real,
verified webshop product reviews exist. This document specifies the review model
so a real system can be switched on later. **Nothing here is live**; no reviews
are collected, displayed, or sent to Google until the owner approves a provider
and email flow.

## Hard rules (trust / legal / platform compliance)
- A review may exist only from a real reviewer. No AI-generated or imported quotes.
- A **"verified purchase"** badge is allowed **only** when ALL are true:
  1. a real **completed** Shopify order exists,
  2. the reviewed **product** was a line item on that order,
  3. the reviewer is safely matched to that order (order-linked token, not typed-in),
  4. the order was not cancelled, refunded as fraud, or charged back.
- Google **Business** reviews are company reviews — never shown as product reviews,
  never inserted into Product JSON-LD. (They live only in the homepage
  "Google reviews / Google-beoordelingen" section, from the live Google source.)
- Product JSON-LD gets `aggregateRating` / `review` **only** from real product
  reviews for that exact product. No zero-value or placeholder schema.

## Review record (shape)
```
{
  id:            string,        // provider id
  productId:     string,        // Shopify product GID or catalog slug
  orderId:       string|null,   // Shopify order GID (verified purchases only)
  verified:      boolean,       // true only if the 4 rules above hold
  rating:        1|2|3|4|5,
  title:         string,
  body:          string,
  firstName:     string|null,   // optional public display name
  locale:        'nl'|'en'|'el',
  submittedAt:   ISO-8601,
  status:        'pending'|'approved'|'rejected'  // moderation gate before display
}
```
Only `status:'approved'` records are ever rendered or counted.

## Flow (to be built when a provider is chosen)
1. Order fulfilled/delivered → queue a **review invitation** email (per line-item product).
2. Invitation carries a signed, single-use **order-linked review token** (maps to
   orderId + productId; expires). The reviewer never types an order number.
3. Submission → `status:'pending'` → **moderation** → `approved`/`rejected`.
4. Approved reviews:
   - render in the product "reviews" section (replacing the empty state),
   - recompute that product's real `aggregateRating` (mean + count) for JSON-LD,
   - the "Be the first to review / Schrijf als eerste een review" CTA appears only
     once submission is operational.

## Provider options (owner decides — none enabled)
- Shopify Product Reviews / a Shopify review app (Judge.me, Loox, Okendo, …) — native
  order-verification + Google product-ratings feed integration.
- Google Customer Reviews (seller ratings) — separate from product ratings; do not
  conflate the two in Merchant Center.

## Do NOT
- Do not activate automated invitation emails until the owner approves the provider
  and the email flow.
- Do not show a CTA that implies a working submission form before one exists.
- Do not display 0.0 ratings, empty grey stars, placeholder names, or fake totals.
