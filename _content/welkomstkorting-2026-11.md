# Welkomstkorting WELKOM5: prijsregels en meting (1 november 2026)

## Prijsregels (Shopify is de bron, de winkelmand rekent hetzelfde)

1. **Ritueelkorting** (automatisch, niet te combineren): 3/6/9/12 honingpotten geven €5/€10/€15/€20, of 2 honing + 1 olijfolie geeft €5. Shopify neemt er één, de hoogste.
2. **Thee 2 voor €8** (automatisch sinds 1 nov, Koop X krijg Y, de 2e met 40% korting), los voor bergthee en voor kamillethee:
   - 1/2/3/4 zakjes kosten €5/€8/€13/€16.
   - De theekortingen combineren met elkaar, maar niet met de ritueelkorting.
   - Shopify kiest de ritueelkorting óf alle theekortingen samen, wat het meeste oplevert. Bij gelijkspel kiest het de ritueelkorting.
3. **WELKOM5**: 5% op de producten, eenmalig per klant, niet te combineren. Als code en automatische korting allebei kunnen, kiest Shopify de hoogste.
4. **Beste eindprijs**: de site laat Shopify dezelfde mand twee keer rekenen, zonder en met code. Daarbij telt de site de verzendkosten op: gratis vanaf de drempel van het land, gerekend over het bedrag na korting. De code gaat alleen mee naar Shopify als het totaal inclusief verzending strikt lager is. Anders blijft hij bewaard en legt de winkelmand uit waarom.
   - Voorbeeld NL €60: met code €57 + €5,95 = €62,95. Zonder code €60, dus wordt de code niet gebruikt.
5. **Wilde oregano "2 voor €4"**: staat op de productpagina, maar bestaat nog niet in Shopify (daar €5). Openstaand.

## Meting

**Wat er wordt vastgelegd:**
- **Testgroep:** willekeurig en vast per browser, op het moment dat iemand in aanmerking komt (`holdout` 0.5): "aanbod" of "controle".
- **Bij elke bestelling** gaan drie verborgen kenmerken mee:
  - `_hd_welkom_groep`: aanbod of controle;
  - `_hd_welkom_code`: of de code is meegestuurd;
  - `_hd_welkom_meting`: of de bezoeker toestemming gaf voor analyse.
- **In GA4**, alleen met toestemming: welcome_eligible, welcome_shown, welcome_closed, welcome_accepted, welcome_code_confirmed, welcome_code_held, welcome_code_rejected en welcome_code_removed, met `ab_group`.

**Berekening per groep, over dezelfde populatie:**
- **Noemer:** het aantal unieke gebruikers in GA4 met `welcome_eligible`, per `ab_group`. Dit zijn alleen bezoekers met toestemming.
- **Teller:** bestellingen in Shopify met `_hd_welkom_groep` = die groep én `_hd_welkom_meting` = ja. Bestellingen zonder toestemming tellen niet mee, want hun bezoekers zitten ook niet in de noemer.
- **Omzet:** het Shopify-veld Subtotaal. Dat is al na alle kortingen, inclusief WELKOM5, en zonder verzending. Trek de korting er dus niet nog eens af.
- **Extra effect:**
  - bestellingen per bezoeker in "aanbod" minus die in "controle";
  - idem voor omzet per bezoeker.
  - Een positieve omzet per bezoeker is al netto na de weggegeven korting.

**Beperkingen:**
- Bezoekers zonder toestemming tellen niet mee. Door de willekeurige indeling is dat in beide groepen naar verwachting gelijk, maar de uitkomst geldt strikt alleen voor bezoekers met toestemming.
- Telling per browser: wie op twee apparaten koopt, kan in twee groepen vallen.
- Toestemming die tussen bezoek en bestelling verandert, geeft een kleine afwijking.
- "Eenmalig per klant" controleert Shopify pas bij het afrekenen, op e-mailadres.
- Bij een kleine webshop zijn enkele weken nodig voor een betrouwbaar verschil. Tot die tijd kun je het oordeel niet hard maken.
