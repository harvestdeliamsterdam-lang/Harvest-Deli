# Harvest Deli: owner actions for Google Ads

Only the steps that need your own logins (Shopify, TransIP, Google Ads, Google Analytics, Merchant Center). Everything in the website code is already done and tested locally. It goes live when you approve the deploy.

Do the sections **in this order**. Steps 1 and 2 belong together: do them in one sitting.

What you need at hand:
- Shopify admin (owner)
- TransIP (the DNS for harvestdeli.nl lives there)
- The Google account that owns Merchant Center **MC-KN68N920QL** and GA4 property **G-DH37SQEXFL**
- The Google Ads account you will advertise from

---

## 0. Before you start: approve the website update

The new site code must be live first: consent signals, correct GA4 events, the Dutch product pages and direct checkout. Tell us "deploy" and we put it live. Then continue here.

---

## 1. Give the checkout its own address: shop.harvestdeli.nl

**Why:** the checkout now runs on `su08c4-v4.myshopify.com`, a different website to Google. The visit that started from an ad is lost at the payment step, so Google can't tie a sale to the ad that brought it. Under `shop.harvestdeli.nl` the checkout counts as part of harvestdeli.nl.

**harvestdeli.nl itself does not change.** It stays on Vercel. Don't touch the existing `@` (A 76.76.21.21) and `www` (CNAME Vercel) records.

### 1a. Shopify: add the domain

1. Shopify admin → **Settings** → **Domains**.
2. **Connect existing domain**.
3. Type `shop.harvestdeli.nl` → **Next**.
4. Leave this page open. Shopify shows a CNAME record to create.

### 1b. TransIP: add one DNS record

1. transip.nl → log in → **Domeinen** → **harvestdeli.nl** → tab **DNS**.
2. **Toevoegen** / add record:
   - Naam: `shop`
   - TTL: `1 uur`
   - Type: `CNAME`
   - Waarde: `shops.myshopify.com.` (with the dot at the end)
3. **Opslaan**.
4. Change nothing else.

### 1c. Shopify: verify

1. Back in Shopify (the page from 1a) → **Verify connection**.
2. Wait until the domain shows **Connected** and the SSL certificate is active. Usually minutes; at most 48 hours.

**Don't make it the primary domain yet.** First do section 2.

---

## 2. Make Shopify's own storefront forward to harvestdeli.nl

**Why:** Shopify has its own storefront with the default "Horizon" theme ("Welcome to our store", English titles). Once `shop.harvestdeli.nl` is the primary domain, that storefront appears there. Google Shopping links also point to it. This step sends every storefront page to the matching page on harvestdeli.nl (acacia → /products/acacia-honey, and so on). The query string is kept, including the jar size, gclid and utm.

**Checkout, cart, account and policy pages are not touched.**

1. Shopify admin → **Online Store** → **Themes**.
2. On the live theme: **⋯** → **Edit code**.
3. Folder **Snippets** → **Add a new snippet** → name `hd-headless-redirect` → **Done**.
4. Paste the full contents of `shopify-theme/hd-headless-redirect.liquid` (in the project; we can send it to you) → **Save**.
5. Open **layout/theme.liquid**. Directly after the `<head>` line, add:
   ```
   {% render 'hd-headless-redirect' %}
   ```
   → **Save**.
6. **Test:** open `https://su08c4-v4.myshopify.com/products/acacia?variant=54140257304917`. You should land on `https://harvestdeli.nl/products/acacia-honey` with the 950 g jar selected.

(If you prefer, we can do steps 3 to 5 for you through the Shopify connection. Just say so.)

### 2b. Now make shop.harvestdeli.nl the primary domain

1. Shopify admin → **Settings** → **Domains** → **Change primary domain**.
2. Select `shop.harvestdeli.nl` → **Save**.
3. Make sure **Redirect all traffic to this domain** is on.

**Check:**
1. Open https://harvestdeli.nl, put a jar in the cart and click **Naar de afrekening**.
2. The address bar must now start with `https://shop.harvestdeli.nl/checkouts/`.

---

## 3. Google & YouTube app (Shopify)

Shopify admin → **Apps** → **Google & YouTube**.

1. **Markets:** check it still says **Netherlands & Belgium** only, language **Dutch**. That was set on 17 Sept; leave it.
2. **Google Ads account:**
   1. **Settings** → **Google Ads** → **Connect**. Choose your existing Ads account, or create one.
   2. Use the same Google account that owns Merchant Center MC-KN68N920QL.
3. **Conversion tracking:** in the app, turn on **Google Ads conversion tracking**. The app creates conversion actions in Google Ads (purchase, add to cart, begin checkout, page view) and sends them from the Shopify checkout.
4. **Enhanced conversions:**
   1. In the app, turn **Enhanced conversions** on.
   2. In Google Ads: **Goals** → **Conversions** → **Settings** → **Enhanced conversions for web** → on.
   3. Accept the **customer data terms**.
5. **Customer events:** Shopify admin → **Settings** → **Customer events** → tab **App pixels**. "Google & YouTube" must say **Connected**. Change nothing there.

You do **not** need to change Shopify's cookie-banner settings. The website now passes each visitor's choice to the checkout itself.

---

## 4. Google Ads

1. **Auto-tagging:** Admin → **Account settings** → **Auto-tagging** → on.
2. **Primary conversion:**
   1. **Goals** → **Conversions** → **Summary**.
   2. The purchase action created by the Google & YouTube app ("Google Shopping App Purchase" or similar) must be **Primary**.
   3. Set Add to cart and Begin checkout to **Secondary**.
   4. Do **not** also import the GA4 purchase as Primary, or every sale counts twice.
3. **Link GA4:**
   1. **Tools** → **Data manager** → **Google Analytics (GA4)** → **Link**.
   2. Choose the property with G-DH37SQEXFL.
4. **Link Merchant Center** (skip if the app already did): **Tools** → **Data manager** → **Google Merchant Center** → link **MC-KN68N920QL**.
5. **Campaign targeting** (when you build campaigns later):
   - Locations: Netherlands and Belgium, option **"Presence: people in or regularly in"**.
   - Language: Dutch.
6. **Optional, for remarketing on harvestdeli.nl:**
   1. **Tools** → **Google tag**.
   2. Copy the tag ID that starts with **AW-** and send it to us.
   3. We add it to the site (one line). The site sends it only to visitors who accepted marketing cookies.

---

## 5. Google Analytics 4 (property with G-DH37SQEXFL)

Admin (gear icon, bottom left):

1. **Data streams** → the web stream → **Configure tag settings**:
   1. **Configure your domains** → add `harvestdeli.nl`, `shop.harvestdeli.nl`, `su08c4-v4.myshopify.com` (match type "contains") → Save.
   2. **List unwanted referrals** → add `mollie.com`. Also add the other payment domains you see in reports, for example your bank's iDEAL page.
2. **Data collection and modification** → **Data retention** → **14 months** → Save.
3. **Data collection and modification** → **Data collection** → **Google signals** → turn on (EEA included).
4. **Data display** → **Events** → make sure **purchase** is marked as a **key event**. Optionally mark `add_to_cart` too.
5. **Product links** → **Google Ads links** → link your Ads account, if you didn't do it from Google Ads in step 4.3.
6. **Two or three days after launch:** **Data display** → **Consent settings**. It should report consent signals as active for analytics and ads.

---

## 6. Merchant Center (MC-KN68N920QL)

1. **Claim the whole domain:**
   1. **Settings** (gear) → **Business info** → **Website** → `https://harvestdeli.nl`.
   2. **Verify** → pick **Google Search Console**, or the DNS method. harvestdeli.nl already carries Google verification records, so this is usually instant.
   3. **Claim**.
   4. A claim on harvestdeli.nl also covers `shop.harvestdeli.nl`.
2. **Shipping:** **Settings** → **Shipping and returns** → **Shipping services**.
   - Netherlands: €5.95, free from €60, handling 1–2 business days, transit 1–2 days.
   - Belgium: €6.95, free from €60, handling 1–2 days, transit 1–3 days.
   - These must equal the Shopify delivery zones; they do today.
3. **Returns:** **Settings** → **Shipping and returns** → **Return policies** → add NL and BE:
   - 14-day return window
   - return by mail
   - return shipping paid by the customer
   - opened food items excluded
   - policy page: `https://harvestdeli.nl/legal-returns.html`
4. **Two to three days after steps 1 and 2 of this document:**
   1. **Products** → **Needs attention**.
   2. Look for "Mismatched domains" or "Landing page not working". If you see either, send us a screenshot. We'll switch Merchant Center to the site's own feed: `https://harvestdeli.nl/feeds/google-merchant.xml`. It has Dutch titles with size, harvestdeli.nl links, and 22/22 GTINs and unit prices.
   3. **Never have both sources active for the same country** (duplicate offers).
5. **Optional:** **Growth** → **Manage programs** → **Automatic item updates** (price and availability) → on.

---

## 7. Shopify product texts (13 products)

These texts live in Shopify, not in the website code. The Google & YouTube app sends them to Google.

**7a. Search descriptions.** Shopify admin → **Products** → each product → **Search engine listing** → **Edit**.
- Most descriptions end with "Gratis bezorging vanaf €65." Replace that with **"Gratis bezorging in NL en BE vanaf €60."** (the real threshold).

**7b. Product descriptions with health or nutrition wording.** Google Merchant and EU law (Reg. 1924/2006) don't allow this wording:

| Product | Replace | With |
|---|---|---|
| Oak Honey | "houtig en mineraalrijk" | "houtig en vol van smaak" |
| Greek Mountain Tea | "van nature kalmerend" | "zacht aromatisch" |
| Greek Chamomile Tea | "milde, rustgevende smaak" | "milde, ronde smaak" |

(Until you change these, the site's own feed already uses the clean texts. Want us to make the Shopify edits through the Shopify connection? Say so.)

---

## 8. Test order: proves the whole chain

After sections 1 to 6:

1. Open **https://harvestdeli.nl/products/wild-oregano** in a normal browser window → **Alles accepteren** in the cookie banner.
2. **In de winkelmand** → open the cart → **Naar de afrekening**.
   - The address bar must start with `https://shop.harvestdeli.nl/checkouts/`.
3. Pay €2.50 + shipping with iDEAL.
4. **Check:**
   - GA4 → **Reports** → **Realtime**: a **purchase** within minutes.
   - Google Ads → **Goals** → **Conversions**: after up to 3 hours, the purchase action shows **Recording conversions**.
   - Go back to harvestdeli.nl: the cart is empty.
5. Refund the order in Shopify (**Orders** → the order → **Refund**).

If one of these checks fails, tell us which one.

---

## 9. Outside Google, but worth knowing

- **Printed flyers.** The printed product flyers carry the same health claims that were removed from the site ("ondersteunt het immuunsysteem", "helpt bij een goede nachtrust", "geschikt voor kinderen"). Honey must not be given to babies under 12 months. Consider reprinting.
- **VAT for EU orders.** The German order #1004 (16 Aug) was charged no VAT. For B2C sales to other EU countries, NL VAT or OSS applies. Ask your accountant to check the VAT settings in Shopify (**Settings** → **Taxes and duties**).
- **Real product photos.** Oak, heather, olive oil, both teas and oregano still use generated images. Square real photos of the jar on a light background do noticeably better in Shopping.
