# 09 · Lanceerchecklist en GO/NO-GO

## Besluit op 30-10-2026: **NO-GO · NOG NIET KLAAR OM TE ACTIVEREN**

Er is geen bewijs dat een aankoop als conversie in **Google Ads** wordt geteld, en dat kan in deze sessie ook niet worden bewezen (geen toegang tot Google Ads, GA4 of Merchant Center). Volgens de brief betekent dat: niet activeren.

Daarnaast draait de checkout nog op `su08c4-v4.myshopify.com`, een ander domein dan harvestdeli.nl. Daardoor is het niet zeker dat de klik uit een advertentie aan de latere aankoop gekoppeld wordt.

Het besluit verandert naar **GO** zodra alle punten in sectie 1 zijn afgevinkt **en** de eigenaar in sectie 3 schriftelijk akkoord geeft.

## 1. Blokkerende punten (allemaal nodig voor GO)

| # | Punt | Status 30-10 | Wie | Hoe afvinken |
|---|---|---|---|---|
| 1 | **Facturering** in Google Ads ingesteld | onbekend | eigenaar | Ads → Facturering → betaalmethode staat erin. Niet door ons gedaan (mag ook niet) |
| 2 | **Google & YouTube-app gekoppeld aan het Ads-account** 702-695-8003, conversietracking aan | **niet gedaan**: de live app-pixel stuurt purchase alleen naar GA4 en MC, zonder AW-label (gemeten 30-10, zie 11) | eigenaar | OWNER-ACTIONS stap 3 |
| 3 | **Aankoop = primaire conversie**, add_to_cart en begin_checkout secundair, GA4-purchase niet ook primair | onbekend | eigenaar | Ads → Doelen → Conversies → Overzicht |
| 4 | **Aankoopconversie bewezen**: één echte testbestelling (bijv. oregano €2,50 + verzending) via een advertentieklik of met `?gclid=TEST` in de URL, daarna de conversie zichtbaar in Ads (kan tot 24 uur duren) en de order in GA4 | **niet bewezen** | eigenaar + wij | Ads → Conversies → kolom "Alle conv." bij de aankoopactie > 0 |
| 5 | **Checkout op shop.harvestdeli.nl** (CNAME + primary domain in Shopify) | **niet gedaan** (DNS bestaat niet) | eigenaar | OWNER-ACTIONS stap 1 en 2. Controle: afrekenen op harvestdeli.nl, adresbalk begint met https://shop.harvestdeli.nl/checkouts/ |
| 6 | **Consent** werkt door in Ads: in GA4 "Consent settings" actief voor analytics en ads; in de checkout een consentsignaal (op de site al bewezen op 30-09) | deels bewezen | eigenaar | GA4 → Beheer → Weergave van gegevens → Consentinstellingen |
| 7 | **Enhanced Conversions** aan (app + Ads) en klantgegevensvoorwaarden geaccepteerd | onbekend | eigenaar | OWNER-ACTIONS stap 3.4 |
| 8 | **Merchant Center gekoppeld** aan Ads, website geclaimd, één databron | onbekend | eigenaar | 07, sectie 3 |
| 9 | **Productgoedkeuringen**: de producten die in Shopping aan staan zijn goedgekeurd | onbekend | eigenaar | MC → Producten |
| 10 | **Producttekst bevestigd**: "rauw en ongefilterd" klopt voor alle honingsoorten in de advertenties; herkomstclaims in de feed (Pelion, Olympus, verzegeld in was, koud geslingerd) kloppen of zijn verwijderd | **open** | eigenaar | 07, punt 3. Klopt "rauw en ongefilterd" niet voor een soort: die kop/beschrijving uit de RSA halen |
| 11 | **Budgetten goedgekeurd**: A €17,33/dag, B €6,67/dag, C niet starten | open | eigenaar | sectie 3 |
| 12 | **Advertentievoorbeelden bekeken**: in Editor of Ads de 4 RSA's, sitelinks en callouts gelezen | open | eigenaar | 04-SEARCH-ADS.csv |
| 13 | **Max. CPC-limieten ingevuld** (IN TE VULLEN in de importbestanden) | open | eigenaar | 08 LEESMIJ stap 1 |
| 14 | **Bundelkortingen nog actief** (3/6/9/12 potten en 2 honing + olijfolie) en prijzen gelijk aan de advertenties ("Vanaf €14", "Tijmhoning vanaf €19", "€5 korting bij 3 potten") | actief op 30-10 | wij, op de dag van start | Shopify → Kortingen. Prijs gewijzigd? Advertentietekst aanpassen vóór start |

## 2. Instellingen (bij import nakijken)

| Instelling | Waarde |
|---|---|
| Status alle campagnes | **Paused** tot sectie 3 getekend is |
| Startdatum | leeg (geen geplande activering) |
| Locatie | Nederland |
| Locatieoptie | **Aanwezigheid**: mensen in of regelmatig in de gebieden |
| Taal | Nederlands |
| Netwerken | Google Zoeken; **Zoekpartners uit; Display uit** |
| Biedstrategie | Maximale klikken met max. CPC-limiet (geen tROAS, geen tCPA in maand 1) |
| Conversiedoel | alleen de primaire aankoopactie |
| Advertentieroulatie | Optimaliseren |
| Automatisch toegepaste aanbevelingen | **uit** |
| Automatisch gemaakte assets | **uit** |
| Final URL-uitbreiding (alleen PMax) | uit |
| Auto-tagging | **aan** (Admin → Accountinstellingen) |
| Shopping-prioriteit | Laag |
| Shopping-producten | honing aan (behalve kastanje en bloesemhoning), olijfolie aan, thee en oregano uit |
| Uitsluitingen | gedeelde lijst "HD - Uitsluitingen basis" op A en B |

## 3. Akkoord eigenaar

Pas als dit is ingevuld, mag iemand een campagne op **Ingeschakeld** zetten. Wij doen dat niet zelf, en we plannen ook geen automatische start.

```
Ik heb sectie 1 nagelopen; alle punten zijn afgevinkt.
Ik geef akkoord om te activeren:
[ ] Campagne A · Shopping · €17,33 per dag
[ ] Campagne B · Zoeken honing · €6,67 per dag
[ ] Campagne C · Zoeken olijfolie · €2,67 per dag (advies: niet)
Maximaal totaal 30 dagen: €______
Startdatum: ____-11-2026
Naam: ______________________   Datum: __________
```
