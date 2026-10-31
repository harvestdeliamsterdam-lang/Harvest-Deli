# 01 · Campagnestrategie Harvest Deli, november 2026

Opgesteld 30-10-2026. Alles in deze map is **voorbereiding**. Er is niets in Google Ads aangemaakt: in deze sessie is er geen toegang tot het Google Ads-account, Merchant Center of GA4 (geen login, geen API-koppeling). Elke campagne in de importbestanden staat op **Paused**.

**Oordeel: NOG NIET KLAAR OM TE ACTIVEREN.** De reden staat in [09-LAUNCH-CHECKLIST.md](09-LAUNCH-CHECKLIST.md). Kort: de aankoopconversie in Google Ads is niet aantoonbaar, en de checkout draait nog op een ander domein.

---

## 1. Wat er nu echt staat (gecontroleerd op 30-10-2026)

| Onderdeel | Status | Hoe gecontroleerd |
|---|---|---|
| Website live | OK, alle 14 productpagina's geven 200 | curl op harvestdeli.nl |
| GA4 G-DH37SQEXFL op de site | Aanwezig in analytics.js, Consent Mode v2 basic | live analytics.js gelezen |
| Google Ads-tag (AW-) op de site | **Niet aanwezig** (alleen een voorbeeld in een codecommentaar) | live analytics.js |
| Aankooptracking | GA4-purchase komt van de Google & YouTube-pixel in de Shopify-checkout; in september live aangetoond (consentsignaal G111 in de echte checkout). **Een Google Ads-conversieactie is niet te controleren** zonder Ads-toegang | eerdere test 30-09 + deze sessie |
| Checkout-domein | **su08c4-v4.myshopify.com**; shop.harvestdeli.nl bestaat niet in DNS. Shopify primary domain = myshopify | Storefront cartCreate + Admin API + DNS |
| Enhanced Conversions | Onbekend (instelling in Ads en in de Shopify-app) | geen toegang |
| Merchant Center MC-KN68N920QL | Koppeling, goedkeuringen en domeinclaim **onbekend** | geen toegang |
| Eigen productfeed | Live op /feeds/google-merchant.xml: 24 items, 22 met GTIN, chestnut out_of_stock | feed gedownload en gecontroleerd |
| Orders | 12 orders totaal; laatste 10 gemiddeld **€59,48** (incl. btw en verzending), laatste op 28-10 (€77,50) | Shopify Admin API |
| Kostprijs per product | **Niet ingevuld** in Shopify (unitCost leeg bij alle varianten) | Shopify Admin API |
| Zoekvolumes | **Niet beschikbaar**: DataForSEO gaf HTTP 402 (geen tegoed). Niets verzonnen | 03-KEYWORD-RESEARCH.csv |

## 2. Doel van maand 1

Geen omzetvoorspelling (die kan niet eerlijk gemaakt worden zonder marge en zonder conversiegeschiedenis). Het doel van de eerste 30 dagen is:

1. Bewijzen dat een advertentieklik tot een **geteld aankoopconversie in Google Ads** leidt.
2. Per honingsoort leren welke zoektermen en producten kopers opleveren.
3. Binnen €800 blijven, zonder automatische uitbreiding naar Display of YouTube.

## 3. Structuur

| | Campagne | Type | Budget 30 dagen | Per dag | Advies |
|---|---|---|---|---|---|
| A | HD \| Shopping \| Alle producten \| NL | **Standaard Shopping** | €520 | €17,33 | Starten (na GO) |
| B | HD \| Search \| Griekse honing \| NL | Zoeken | €200 | €6,67 | Starten (na GO) |
| C | HD \| Search \| Griekse olijfolie \| NL | Zoeken | €80 | €2,67 | **Niet starten in maand 1**, zie 02 |

### Waarom Standaard Shopping en nog geen Performance Max

De brief noemt "Shopping/PMax". Advies voor maand 1 is Standaard Shopping:

- PMax stuurt op conversies. Er zijn 12 orders in totaal en nul gemeten Ads-conversies. Zonder die data verdeelt PMax het budget zelf over Display, YouTube, Gmail en Discover, en dat is bij €17 per dag niet te controleren.
- Standaard Shopping toont alleen productadvertenties in Google Zoeken en Shopping, met zoektermenrapport en zelf te kiezen productgroepen.
- PMax staat klaar als fase 2 (vanaf ongeveer 30 aankoopconversies, of na dag 30): zie [06-PMAX-ASSET-PLAN.md](06-PMAX-ASSET-PLAN.md).

Wil de eigenaar toch direct PMax, dan: alleen feed-assets of de assets uit 06, URL-uitbreiding uit, merkuitsluitingen niet nodig, en hetzelfde budget. Dat is een bewuste keuze met minder controle.

### Campagne A · Shopping

- Productgroepen (handmatig in Editor of de interface, niet via CSV):
  - **Honing** (product_type Honey): aan.
  - **Olive Oil** (€15): aan, laag bod.
  - **Tea** (€5) en **Herb** (oregano €2,50): **uitsluiten**. Een klik kost al snel een flink deel van de productprijs.
  - **Chestnut**: sinds 31-10 weer op voorraad (50 + 50), dus aan.
  - **Wildflower / Bloesemhoning**: advies **uitsluiten tot er een echte productfoto is**. De huidige foto's zijn AI-gegenereerd, het etiket wijkt af van de echte pot ("BIPRODUCTS" in plaats van "GREEK PRODUCTS") en de kleur klopt niet. Dat is een risico op afkeuring wegens misleidende afbeeldingen. In Search mag het product wel (de pagina zelf is in orde).
- Biedstrategie: Maximale klikken met een **max. CPC-limiet** die de eigenaar invult na het bekijken van de biedbereiken in de Zoekwoordplanner. Geen tROAS.
- Prioriteit: Laag (zodat Search-zoekwoorden voorrang krijgen op Shopping wanneer later een tweede Shopping-campagne komt).

### Campagne B · Zoeken, Griekse honing

Vier advertentiegroepen, elk met één responsieve zoekadvertentie (15 koppen, 4 beschrijvingen):

| Advertentiegroep | Voorbeeldzoekwoorden | Landingspagina |
|---|---|---|
| Griekse honing | [griekse honing kopen], "rauwe griekse honing" | /shop.html |
| Rauwe honing | "rauwe honing kopen", "ongefilterde honing kopen" | /shop.html |
| Tijmhoning | [tijmhoning], "griekse tijmhoning" | /products/thyme-honey |
| Honingsoorten | "dennenhoning kopen", "heidehoning kopen" | per zoekwoord de eigen productpagina |

Alleen Exact en Phrase, geen Broad: met €6,67 per dag is er geen ruimte voor brede matches. Dennen-, eiken- en heidehoning delen een groep omdat het budget te klein is om ze te splitsen; elk zoekwoord heeft wel zijn eigen Final URL.

### Campagne C · Olijfolie

Klaargezet in `08-GOOGLE-ADS-EDITOR-IMPORT/optioneel-C-olijfolie/`, niet in de hoofdimport. Onderbouwing in 02.

## 4. Instellingen die voor alle campagnes gelden

Volledig in [09-LAUNCH-CHECKLIST.md](09-LAUNCH-CHECKLIST.md), sectie Instellingen. De belangrijkste:

- Locatie **Nederland**, methode **Aanwezigheid** ("mensen in of regelmatig in"), niet "interesse in".
- Taal **Nederlands**.
- Netwerken: alleen Google Zoeken. **Zoekpartners uit, Display uit.**
- Doel: **Aankoop als primaire conversie**, add_to_cart en begin_checkout secundair. De GA4-import van purchase niet ook primair (dubbeltelling).
- Automatisch toegepaste aanbevelingen: **uit**. Automatisch gemaakte assets: **uit** (de brief verbiedt verzonnen claims, en Google kan zelf koppen maken).
- Geen automatische activering, geen geplande startdatum.

## 5. Wat bewust niet in dit plan zit

- Merkcampagne "harvest deli": staat organisch al op positie 2 met 56% CTR (67 klikken in 90 dagen). Niet nodig in maand 1.
- België: de shop verzendt er wel naar (€6,95, gratis vanaf €60), maar de brief zegt NL eerst. Toevoegen na maand 1.
- Remarketing: vraagt de AW-tag op de site (sectie 4.6 van GOOGLE-ADS-OWNER-ACTIONS.md) en genoeg bezoekers.
- Engelse advertenties.

## 6. Bestanden

| Bestand | Inhoud |
|---|---|
| 02-BUDGET-AND-PROFITABILITY.md | budget, break-even-formule, wat er ontbreekt |
| 03-KEYWORD-RESEARCH.csv | 32 zoekwoorden; volume, concurrentie, CPC = onbekend; GSC-vertoningen waar bekend |
| 04-SEARCH-ADS.csv | alle advertentieteksten met tekenaantal en limiet |
| 05-NEGATIVE-KEYWORDS.csv | 60 basisuitsluitingen, 5 voor olijfolie en 1 voor Shopping, elk met reden |
| 06-PMAX-ASSET-PLAN.md | fase 2: assets, formaten, bronbestanden |
| 07-MERCHANT-CENTER-CHECK.md | product voor product |
| 08-GOOGLE-ADS-EDITOR-IMPORT/ | importbestanden + LEESMIJ.md met stappen |
| 09-LAUNCH-CHECKLIST.md | GO/NO-GO en alle instellingen |
| 10-FIRST-30-DAYS-OPTIMIZATION.md | wat je wanneer bekijkt en aanpast |
| 11-PURCHASE-TRACKING-FORENSICS.md | onderzoek naar de ontbrekende aankopen in GA4 en Ads (30-10) |
