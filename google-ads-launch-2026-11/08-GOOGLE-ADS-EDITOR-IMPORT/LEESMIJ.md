# 08 · Importeren in Google Ads Editor

Waarom importbestanden: in deze sessie is er geen toegang tot het Google Ads-account. Er is dus **niets** in het account aangemaakt. Met deze bestanden zet de eigenaar (of iemand met toegang) de campagnes er in een paar minuten in, **allemaal gepauzeerd**.

Alle bestanden: komma-gescheiden, UTF-8, eerste regel = kolomnamen. Elke rij heeft status **Paused**.

## Bestanden

| Bestand | Inhoud |
|---|---|
| 01-campaigns.csv | campagne A (Shopping) en B (Zoeken honing) |
| 02-ad-groups.csv | 1 Shopping-groep, 4 zoekgroepen |
| 03-keywords.csv | 28 zoekwoorden campagne B (Exact/Phrase); bij "Honingsoorten" heeft elk zoekwoord een eigen Final URL |
| 04-responsive-search-ads.csv | 4 RSA's, elk 15 koppen + 4 beschrijvingen, kop 1 vastgezet op positie 1 |
| 05-shared-negative-list.csv | gedeelde uitsluitingslijst "HD - Uitsluitingen basis" (60 termen) |
| 07-sitelinks.csv, 08-callouts.csv, 09-structured-snippets.csv | assets voor campagne B |
| optioneel-C-olijfolie/ | campagne C, **advies: niet importeren in maand 1** |

## Stappen

**Voorwaarde:** Google Ads Editor geïnstalleerd, ingelogd met het Ads-account, account gedownload (**Account → Recente wijzigingen downloaden**).

1. Open in de bestanden de cellen met **IN TE VULLEN** en vul ze in:
   - `01-campaigns.csv` · **Max CPC Bid Limit** voor A en B: kies dit na het bekijken van de biedbereiken in de Zoekwoordplanner (Extra → Zoekwoordplanner → "Zoekvolume en prognoses", locatie Nederland, taal Nederlands). Er staat bewust geen bedrag in: er zijn geen gemeten CPC's (zie 03).
   - `01-campaigns.csv` · **Shopping: Merchant Identifier**: het Merchant Center-ID (cijfers).
   - `02-ad-groups.csv` · **Max CPC** van de Shopping-groep.
2. Editor → **Account → Importeren → Uit bestand**. Kies de bestanden **in volgorde** 01 t/m 09 (06 bestaat niet meer), één per keer.
3. Editor toont na elk bestand een voorbeeld met de herkende kolommen. Controleer dat **Status = Paused** herkend wordt. Klik **Verwerken** en daarna **Wijzigingen behouden**.
4. Als Editor de gedeelde uitsluitingslijst (05) niet herkent: maak in **Gedeelde bibliotheek → Uitsluitingszoekwoorden** een lijst "HD - Uitsluitingen basis" aan, plak de kolom Keyword erin (zet Phrase-termen tussen "aanhalingstekens" en Exact tussen [haken]) en koppel de lijst aan campagne A en B.
5. **Handmatig in Editor** (gaat niet via CSV):
   - Campagne A → productgroepen: onderverdelen op **Producttype**. Honey = aan; Olive Oil = aan met lager bod; Tea en Herb = **uitgesloten**. Daarbinnen bij Honey onderverdelen op **Artikel-ID** en bloesemhoning (beide maten) uitsluiten zolang er geen echte foto is.
   - Campagne A → Instellingen: prioriteit **Laag**, lokale voorraadadvertenties uit.
   - Beide campagnes → **Advertentieplanning**: geen (de hele dag).
   - Beide campagnes → Zoekpartners **uit**, Display **uit** (staat in het bestand, toch nakijken).
6. **Niet op Posten klikken** zolang 09-LAUNCH-CHECKLIST.md niet op GO staat. Ook na posten blijft alles gepauzeerd; het geeft wel een live controle van Google op afkeuringen.
7. Na posten in de webinterface controleren: Campagnes → filter "Status: Gepauzeerd". Alles moet daar staan, niets bij "Actief".

## Wat er in de webinterface nog moet (niet in Editor)

- Account → **Automatisch toegepaste aanbevelingen**: alles uit.
- Campagne B → Instellingen → Assets → **Automatisch gemaakte assets**: uit.
- Doelen → Conversies: Aankoop primair, rest secundair (zie 09).

## Opnieuw genereren

De CSV's komen uit `_bron/build_ads.py` (controleert ook alle tekenlimieten en dat er geen em-dashes in staan):

```bash
python3 google-ads-launch-2026-11/08-GOOGLE-ADS-EDITOR-IMPORT/_bron/build_ads.py google-ads-launch-2026-11
```
