# Harvest Deli, regressietests

Acht tests die bewaken wat op deze site al eens stilletjes is gebroken.
Geen testrunner, geen dependencies om te installeren: het zijn losse Node-scripts
die Playwright uit de map hierboven gebruiken.

Lokaal testen kan tegen `scripts/serve.mjs`: die past de redirects, rewrites en
headers uit vercel.json toe en draait api/ zoals Vercel. (Niet tegen
`python3 -m http.server`: die kent /products/<slug> niet.)

```bash
cd honey
node scripts/serve.mjs 4400 &                            # lokale "Vercel"

node tests/check-paths.mjs                              # statisch, seconden
node tests/product-html.mjs      http://localhost:4400  # HTML vóór JavaScript, 13 producten, ~10 s
node tests/tracking.mjs          http://localhost:4400  # consent + GA4-events, ~2 min
node tests/add-to-cart.mjs       http://localhost:4400  # 13 producten, ~3 min
node tests/gtin.mjs              http://localhost:4400 --feed # GS1-GTIN's, ~1 min
node tests/audit-live.mjs        http://localhost:4400  # crawl, ~10 min
node tests/checkout-countries.mjs http://localhost:4400 # mandje > Shopify, 9 flows, ~5 min
node tests/phone-e164.mjs        http://localhost:4400  # normalisatie, ~1 min
```

Na een deploy dezelfde tests met https://harvestdeli.nl als basis-url;
`tests/tracking.mjs https://harvestdeli.nl --checkout` loopt dan ook de echte
Shopify-checkout in en controleert dat de Google-pixel daar met consent vuurt.

**`product-html.mjs`** leest de ruwe HTML (zonder JavaScript) van alle 13
productpagina's: naam, prijs en schema tegen Shopify, maten, SKU's, GTIN's,
canonical, taal, geen tekst van een ander product, geen gezondheidsclaims.
De negen honingpagina's worden gemaakt door `scripts/build-product-pages.mjs`
uit `templates/product-honey.html`; bij een fout daar, niet in de pagina zelf.

**`tracking.mjs`** leest de echte hits naar google-analytics.com: niets vóór
een keuze, Consent Mode v2-signalen, één page_view per pagina, view_item,
add_to_cart en remove_from_cart met de juiste maat, prijs en aantal,
view_cart, view_item_list en select_item, en dat de keuze in de checkout-URL
(_cs) meereist.

Elke test eindigt met exitcode 0 als alles klopt en 1 als er iets stuk is, dus
ze zijn direct bruikbaar in een pre-deploy stap.

## Waarom deze zes

**`check-paths.mjs`** bewaakt de terugkerende bug van deze site. Sinds producten
op `/products/<slug>` staan, lost een relatief pad op tegen `/products/` in plaats
van tegen de root. Dat brak eerst de afbeeldingen en later elke link die
JavaScript injecteert, waardoor "Continue to checkout" vanaf een productpagina een
404 gaf. De test faalt zodra er in gedeelde of geneste code weer een relatief pad
opduikt. Uitzonderingen staan bovenin het bestand, elk met een reden erbij.

**`add-to-cart.mjs`** controleert dat elk product echt in het mandje gaat, in elk
formaat en in aantallen. Een hardgecodeerde voorraadtabel, nooit aan Shopify
gekoppeld, blokkeerde stil verkoopbare honing: sparrenhoning kon er helemaal niet
in, heide maximaal 2 potten, en eikenhoning stond op "pre-order". Er kwam geen
JavaScript-fout, dus geen enkele andere test zag het. De test vraagt eerst aan
Shopify wat echt te koop is en verwacht precies dat gedrag op de site.

**`gtin.mjs`** bewaakt de GS1-GTIN's. Sinds 16-09-2026 zijn alleen de officiële
nummers (8721593944...) geldig; de tijdelijke 6156...-EAN's mogen nergens meer
opduiken. De test leest per productroute de gerenderde JSON-LD en eist per variant
precies de GTIN uit de GS1-export, nooit dezelfde GTIN op 480 g en 950 g. Met
`--feed` controleert hij ook beide Merchant-feeds variant voor variant. De
GS1-tabel staat bovenin het bestand.

**`audit-live.mjs`** bezoekt elke route op mobiel, tablet en desktop en meet
404's, JS-fouten, gebroken afbeeldingen en dode links. Hij loopt bewust ook vanaf
de geneste productroutes, want daar is de root-pagina blind voor.

**`checkout-countries.mjs`** rekent Nederland, Duitsland en Italië helemaal af tot
de betaalstap, op drie schermformaten. Start telkens op een productpagina, omdat
de checkoutknop juist daar kapot was. Controleert ook dat het adresland
meebeweegt met het gedetecteerde land, want dat stond hardgecodeerd op Nederland
en blokkeerde elke niet-Nederlandse bestelling.

**`phone-e164.mjs`** controleert de telefoonnormalisatie per land. Shopify weigert
een cart volledig met "Phone is invalid" zodra het nummer geen geldig E.164 is, en
de klant ziet dan alleen "Checkout temporarily unavailable". Landen zonder
nationale trunk-0, zoals Italië, Spanje en Griekenland, gingen daar structureel op
onderuit.

## Twee dingen om te weten

**Draai `audit-live.mjs` en `checkout-countries.mjs` niet tegen de lokale
`python3 -m http.server`.** Die kent de rewrites uit `vercel.json` niet, dus
`/products/<slug>` bestaat daar niet en je krijgt 404's die live niet echt zijn.
Gebruik een Vercel preview-deploy of productie. `check-paths.mjs`,
`add-to-cart.mjs` en `phone-e164.mjs` werken wel gewoon lokaal.

**De checkouttests maken echte carts aan bij Shopify.** Dat zijn geen orders en er
wordt niets betaald, maar het zijn wel echte API-aanroepen. Draai ze niet in een
lus: de Storefront API knijpt af per IP-adres, en een afgeknepen verzoek geeft
precies dezelfde foutmelding als een echte storing.
