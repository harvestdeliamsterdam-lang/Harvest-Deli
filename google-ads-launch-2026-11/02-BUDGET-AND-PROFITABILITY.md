# 02 · Budget en winstgevendheid

## 1. Budgetverdeling (€800 voor 30 dagen)

| Campagne | 30 dagen | Dagbudget in Google Ads | Opmerking |
|---|---|---|---|
| A · Shopping | €520 | €17,33 | |
| B · Zoeken honing | €200 | €6,67 | |
| C · Zoeken olijfolie | €80 | €2,67 | **advies: niet starten**, bedrag als reserve houden |
| **Totaal** | **€800** | **€26,67** | |

Let op: Google mag op één dag tot **2× het dagbudget** uitgeven, maar rekent per kalendermaand nooit meer dan gemiddeld 30,4 × het dagbudget. Wie halverwege de maand start, ziet dus soms een dag van €35 in campagne A. Dat is normaal en blijft binnen het maandplafond.

### Waarom C niet in maand 1

- €2,67 per dag levert bij elke realistische klikprijs maar een handvol klikken per dag op; na 30 dagen is er te weinig data om iets te concluderen.
- De olijfolie kost €15. Eén order onder de €60 betaalt ook verzending (€5,95), en de marge op één fles is onbekend.
- Olijfolie staat al in campagne A (Shopping), daar wordt hij gewoon getoond.
- Search Console laat zien dat de site **organisch** al vertoningen krijgt op "olijfolie amsterdam" (62), "olijfolie kopen amsterdam" (15) en "olijfolie speciaalzaak" (10), vaak op positie 2 tot 5. Dat zijn lokale zoekers; die worden beter bediend door Google Bedrijfsprofiel dan door een webshopadvertentie.

**Advies:** de €80 niet uitgeven, of na dag 14 toevoegen aan A als A dan aantoonbaar aankopen oplevert.

## 2. Wat we wel weten

| Gegeven | Waarde | Bron |
|---|---|---|
| Gemiddelde orderwaarde laatste 10 orders | €59,48 (incl. 9% btw en verzending) | Shopify, orders #1003 t/m #1012 |
| Gratis verzending | vanaf €60, NL €5,95, BE €6,95 | shared.js HD_SHIPPING |
| Bundelkortingen (actief, automatisch) | 3 potten −€5, 6 −€10, 9 −€15, 12 −€20, 2 honing + 1 olijfolie −€5 | Shopify discounts |
| Prijzen honing 480 g | €14 (bloesem) tot €22 (vanille) | Shopify |
| Prijzen honing 950 g | €24 tot €40 | Shopify |

## 3. Wat we niet weten (en waarom er geen break-even ROAS in dit document staat)

- **Kostprijs per pot**: niet ingevuld in Shopify (veld "Kosten per artikel" is leeg bij alle 24 varianten).
- **Verzendkosten die Harvest Deli zelf betaalt** (PostNL/DHL-tarief, verpakking).
- **Transactiekosten** (Mollie/Shopify Payments per betaling).
- Of de conversiewaarde die Google Ads straks ontvangt **inclusief of exclusief btw** is (dat hangt af van de instelling in de Google & YouTube-app).

Zonder die cijfers is elke break-even ROAS een gok. Daarom alleen de formule en een rekenvoorbeeld dat duidelijk een scenario is.

### Formule

```
contributiemarge per order = omzet excl. btw
                           − inkoop van de producten
                           − eigen verzendkosten en verpakking
                           − betaalkosten
                           − kortingen

marge %          = contributiemarge / omzet excl. btw
break-even ROAS  = 1 / marge %
max. CPA         = contributiemarge per order
```

### Scenariotabel (GEEN voorspelling, alleen om de formule te laten zien)

Uitgangspunt: order van €59,48 incl. btw = €54,57 excl. 9% btw.

| Als de marge na alle kosten zou zijn | contributiemarge per order | break-even ROAS | max. kosten per aankoop |
|---|---|---|---|
| 30% | €16,37 | 3,33 | €16,37 |
| 40% | €21,83 | 2,50 | €21,83 |
| 50% | €27,29 | 2,00 | €27,29 |

Vul de echte marge in zodra die bekend is. Tot die tijd: **geen doel-ROAS instellen**, en na 30 dagen eerst vergelijken wat een aankoop via Ads kostte met wat er op die order verdiend is.

## 4. Eigenaar: wat er nodig is om dit document af te maken

1. In Shopify bij elke variant **Kosten per artikel** invullen (Producten → product → variant → Kosten per artikel). Dan kan Shopify zelf marge per order rapporteren.
2. Gemiddelde eigen verzendkost per pakket (incl. doos) doorgeven.
3. Na koppeling: in de Google & YouTube-app nakijken of de conversiewaarde incl. of excl. btw wordt doorgegeven.

## 5. Stopregels voor het budget (vastgelegd vóór de start)

- Na **€150 uitgegeven in campagne A zonder één aankoopconversie**: A pauzeren en de tracking opnieuw controleren voordat er meer geld in gaat.
- Na **€75 in campagne B zonder aankoopconversie**: B pauzeren en zoektermen bekijken.
- Totale uitgave na 30 dagen boven €800: niet mogelijk zolang de dagbudgetten in deze map worden aangehouden; controleer dit wekelijks in **Facturering → Transacties**.
