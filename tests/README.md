# Harvest Deli, regressietests

Zes tests die bewaken wat op deze site al eens stilletjes is gebroken.
Geen testrunner, geen dependencies om te installeren: het zijn losse Node-scripts
die Playwright uit de map hierboven gebruiken.

```bash
cd honey

node tests/check-paths.mjs                              # statisch, seconden
node tests/add-to-cart.mjs       https://harvestdeli.nl # 13 producten, ~3 min
node tests/gtin.mjs              https://harvestdeli.nl --feed # GS1-GTIN's, ~1 min
node tests/audit-live.mjs        https://harvestdeli.nl # crawl, ~10 min
node tests/checkout-countries.mjs https://harvestdeli.nl # 9 flows, ~5 min
node tests/phone-e164.mjs        https://harvestdeli.nl # normalisatie, ~1 min
```

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
