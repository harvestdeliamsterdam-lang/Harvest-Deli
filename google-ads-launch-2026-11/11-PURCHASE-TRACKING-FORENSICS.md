# 11 · Forensisch onderzoek aankooptracking

Uitgevoerd 30-10-2026 op de live site (harvestdeli.nl) en de live Shopify-checkout, met Shopify Admin API-gegevens. Er is **geen bestelling geplaatst, niets betaald en geen order gewijzigd**. Elke test stopt op de checkoutpagina. Bewijs: `tests/checkout-forensics.mjs` (opnieuw te draaien) en de uitvoer hieronder.

Niet in te zien in deze sessie: de GA4-interface (property 540685217), Google Ads (702-695-8003) en de instellingen van de Google & YouTube-app in Shopify. De GA4-cijfers (2 transacties, €139,50) komen uit de brief.

---

## 1. Conclusie in drie zinnen

1. **GA4 mist 9 van de 11 echte orders, en dat heeft twee oorzaken die allebei verklaard zijn.** 8 orders vielen vóór de reparatie van 30-09, toen de checkout de cookiekeuze niet kreeg en de pixel daardoor stil bleef. 1 order (#1011) kwam van een bezoeker zonder toestemming voor analyse; die mag niet gemeten worden.
2. **Sinds 30-09 werkt de aankooptracking naar GA4 zoals het wettelijk mag:** 2 van de 3 orders gemeten. Dat zijn precies de 2 orders waarbij Shopify zelf ook toestemming registreerde.
3. **Google Ads krijgt geen enkele aankoop, omdat de Google & YouTube-app geen Ads-conversie verstuurt.** De pixelconfiguratie in de live checkout stuurt purchase alleen naar GA4 en Merchant Center, zonder AW-label. Dat is een instelling in de app, geen codefout.

---

## 2. Orders tegenover GA4

Shopify legt een *customer journey* (bezoekmomenten) alleen vast als de bezoeker toestemming gaf voor analyse. Dat maakt het een onafhankelijke controle op de consentstatus per order.

| Order | Tijd (UTC) | Tijd Amsterdam | Totaal | Test? | Journey-momenten | Periode | In GA4? |
|---|---|---|---|---|---|---|---|
| #1001 | 04-07 11:38 | 04-07 13:38 | €29,95 | **ja (testorder)** | 0 | vóór reparatie | telt niet mee |
| #1002 | 24-07 11:26 | 24-07 13:26 | €10,95 | nee | 0 | vóór reparatie | nee |
| #1003 | 26-07 14:17 | 26-07 16:17 | €23,95 | nee | 0 | vóór reparatie | nee |
| #1004 | 16-08 17:14 | 16-08 19:14 | €47,95 | nee (DE) | 0 | vóór reparatie | nee |
| #1005 | 23-08 15:58 | 23-08 17:58 | €35,95 | nee | 0 | vóór reparatie | nee |
| #1006 | 07-09 12:26 | 07-09 14:26 | €64,00 | nee | 0 | vóór reparatie | nee |
| #1007 | 15-09 14:19 | 15-09 16:19 | €70,00 | nee | 0 | vóór reparatie | nee |
| #1008 | 19-09 08:52 | 19-09 10:52 | €83,00 | nee | 0 | vóór reparatie | nee |
| #1009 | 27-09 02:50 | 27-09 04:50 | €83,00 | nee | 0 | vóór reparatie | nee |
| **#1010** | 03-10 10:04 | 03-10 12:04 | **€62,00** | nee | **1** (via harvestdeli.nl) | na reparatie | **ja** (€62, 3 okt, volgens de brief) |
| #1011 | 03-10 10:40 | 03-10 12:40 | €47,45 | nee | **0** | na reparatie | nee: geen toestemming |
| **#1012** | 28-10 09:51 | 28-10 10:51 | **€77,50** | nee | **2** (via harvestdeli.nl) | na reparatie | **ja**: de tweede GA4-transactie (€77,50) is #1012 |

- "12 betaalde orders" is inclusief testorder #1001. Echte orders: **11**.
- Tijdzones: geen enkele order ligt dicht genoeg bij middernacht om in GA4 op een andere dag te vallen, ook niet bij een property in UTC. #1012 viel na de wintertijdwissel (25-10), #1010 ervoor; beide vallen op dezelfde datum.
- €62,00 + €77,50 = €139,50, gelijk aan het GA4-totaal uit de brief. GA4 telt dus de **orderwaarde inclusief btw**. Of verzending meetelt, is hieruit niet af te leiden: bij beide orders was de verzending €0.
- **Nog door de eigenaar te bevestigen:** in GA4 de transactie-ID's van deze twee aankopen naast #1010 en #1012 leggen (Rapporten → Inkomsten genereren → Transacties). De app stuurt de Shopify-order-ID mee.

## 3. Wat de live checkout doet (gemeten)

`node tests/checkout-forensics.mjs https://harvestdeli.nl`, per cookiekeuze op de site:

| Keuze op de site | Doorgegeven aan Shopify | Tags in de checkout | Hits in de checkout | Consentsignaal |
|---|---|---|---|---|
| Alles accepteren | analytics, marketing, saleOfData = true | G-DH37SQEXFL, GT-W6NK9F5H | page_view, begin_checkout | gcs=G111 |
| Alleen analyse | analytics = true, marketing = false | G-DH37SQEXFL, GT-W6NK9F5H | page_view, begin_checkout | gcs=G101, npa=1 |
| Weigeren | alles false | geen | **geen** | geen |
| Geen keuze gemaakt | alles false | geen | **geen** | geen |

- **Consent werkt.** Shopify heeft voor NL, BE en DE "toestemming vereist" ingesteld (consentPolicy). De site geeft bij elke checkout een nieuwe cart met de keuze van dat moment mee (`@inContext visitorConsent`, parameter `_cs`). Een oude of verouderde keuze kan dus niet meereizen.
- **Bij weigeren gaat er niets naar Google**, ook geen cookieloze ping. Die aankopen zijn voor GA4 en Ads onzichtbaar en kunnen ook niet worden gemodelleerd. Dat is wettelijk correct en dat laten we zo.
- **Eventdata klopt.** begin_checkout bevat valuta EUR, value 17, item `shopify_ZZ_11364330701141_54140257272149`, naam "Harvest Deli Acaciahoning", merk, categorie, variant 480g, SKU. Dat is hetzelfde item-ID-formaat als de site gebruikt.
- **Geen dubbele events.** Per event één hit naar G-DH37SQEXFL. De site zelf stuurt geen begin_checkout of purchase (gecontroleerd in tests/tracking.mjs). De custom-pixelcontainer in Customer events is leeg (configuration null).

### Pixelconfiguratie uit de live checkout (webPixelConfigurations)

```
app-pixel 4927127893 (Google & YouTube), runtime OPEN, dataSharingState OPTIMIZED
google_tag_ids: G-DH37SQEXFL, GT-W6NK9F5H   target_country: ZZ
purchase       → G-DH37SQEXFL, MC-KN68N920QL
page_view      → G-DH37SQEXFL, MC-KN68N920QL
view_item      → G-DH37SQEXFL, MC-KN68N920QL
begin_checkout, add_to_cart, add_payment_info, add_shipping_info, … → G-DH37SQEXFL
```

**Er staat geen enkel `AW-…/label` in.** Een gekoppeld Google Ads-account met conversietracking aan zou hier een AW-label bij purchase toevoegen. Dat is de directe oorzaak dat Google Ads geen aankoopconversie heeft. De koppeling GA4 ↔ Ads (property 540685217 ↔ 702-695-8003) verandert daar niets aan, want die stuurt geen conversies zolang er geen conversieactie is ingesteld of geïmporteerd.

## 4. Cross-domain

| Meting | Uitkomst |
|---|---|
| Client-ID op de site tegenover de checkout | **verschillend** (bijv. 2054679630… → 1407185754…). De checkout begint een nieuwe gebruiker en sessie, met verwijzer harvestdeli.nl |
| `_gl`-parameter op de checkoutlink | ontbrak (codefout, nu gerepareerd, zie 5) |
| Met `_gl` op de link | client-ID **nog steeds verschillend**: de app-pixel op su08c4-v4.myshopify.com leest `_gl` niet |
| gclid bewaard op de site | ja, in cookie `_gcl_aw` op **.harvestdeli.nl**, alleen na toestemming voor advertenties |

Gevolgen zolang de checkout op myshopify.com staat:
- In GA4 krijgt de aankoop de bron van de checkoutsessie (verwijzing harvestdeli.nl of direct), niet de echte bron (Google Ads, organisch).
- Een Ads-conversie vanuit de checkout ziet de gclid-cookie van harvestdeli.nl niet, dus de koppeling aan de klik leunt op enhanced conversions.

**Oplossing (eigenaar):** checkout op **shop.harvestdeli.nl** (OWNER-ACTIONS stap 1 en 2). Dan staan site en checkout onder hetzelfde hoofddomein en kan de checkout de `_ga`- en `_gcl_aw`-cookies van .harvestdeli.nl lezen. Na de omzetting opnieuw meten met `tests/checkout-forensics.mjs`: het client-ID moet dan gelijk blijven.

## 5. Codefix (gedaan, niet gedeployed)

**analytics.js · `HD_navigate`**: de checkout werd geopend met een gesimuleerde `a.click()`. De Google-linker decoreert links op `mousedown`, en dat event kwam nooit, dus `_gl` werd nooit toegevoegd. Dat is gemeten: zonder fix geen `_gl`, met een mousedown wel. Fix: één `mousedown` vóór de klik. Werkt alleen als gtag geladen is, dus alleen na toestemming voor analyse. Gecontroleerd: bij weigeren geen `_gl`.

- Effect vandaag: klein, omdat de myshopify-checkout `_gl` negeert. Wel nodig zodra de checkout op shop.harvestdeli.nl staat, voor bezoekers die de checkout vanaf een andere host openen, en het doet nu eindelijk wat de code belooft.
- Tests: `tests/tracking.mjs` lokaal **alle controles geslaagd**, met een nieuwe controle "Google-linker zet _gl op de checkoutlink". De checkout-URL met `_gl` laadt gewoon (Shopify accepteert de parameter).
- Nieuw: `tests/checkout-forensics.mjs` (de meting uit sectie 3 en 4).
- **Niet gedeployed.** Bij deploy de cacheversie ophogen (hd-2026-06-06-221 → 222), anders blijft de oude analytics.js in browsercaches hangen.

Niet aangepast, bewust: consent (werkt correct), eventtriggers (correct), en geen "server-side" of cookieloze aankoopmeting. Die zou aankopen versturen van mensen die hebben geweigerd.

## 6. Welke aankoopconversie primair

**Advies: de aankoopconversie van de Google & YouTube-app (native Google Ads-conversie) = primair. De GA4-purchase niet importeren in Ads, of hooguit als secundair.**

- De app stuurt de aankoop rechtstreeks vanaf de bedankpagina, met order-ID (ontdubbeling), waarde, en enhanced conversions (gehashte klantgegevens, na toestemming). Dat is het beste dat haalbaar is zolang de checkout op een ander domein staat.
- De GA4-import gebruikt hetzelfde pixelevent, maar komt later binnen en hangt af van de GA4-attributie, die door de domeinbreuk de bron kwijt is (sectie 4).
- **Beide primair = elke aankoop dubbel.** Daarom maar één primaire aankoopactie.
- add_to_cart en begin_checkout van de app: secundair (alleen observatie).

## 7. Instellingen voor de eigenaar

| # | Waar | Wat | Waarom |
|---|---|---|---|
| 1 | Shopify → Apps → Google & YouTube → Instellingen | Google Ads-account **702-695-8003** koppelen (zelfde Google-login als Merchant Center), **conversiemeting aan**, **enhanced conversions aan** | sectie 3: er is nu geen AW-label |
| 2 | Google Ads → Doelen → Conversies | De door de app aangemaakte "Purchase" = **primair**; add to cart / begin checkout = secundair; **geen** GA4-purchase als primair importeren; voorwaarden klantgegevens accepteren | sectie 6 |
| 3 | Google Ads → Beheer → Accountinstellingen | **Auto-tagging aan** | gclid op landingspagina's |
| 4 | Shopify Domeinen + TransIP | **shop.harvestdeli.nl** als primair checkoutdomein (OWNER-ACTIONS 1, 2) | sectie 4 |
| 5 | GA4 → Beheer → Gegevensstreams → Tagopties | **Domeinen configureren**: harvestdeli.nl, shop.harvestdeli.nl, su08c4-v4.myshopify.com. **Ongewenste verwijzingen**: harvestdeli.nl, su08c4-v4.myshopify.com, mollie.com, ideal-betaalpagina's | sectie 4 |
| 6 | GA4 → Beheer → Property-details | Tijdzone controleren (advies Europe/Amsterdam), valuta EUR | sectie 2 |
| 7 | GA4 → Beheer → Belangrijke events | `purchase` = belangrijk event (voor rapportage; niet importeren als primaire Ads-conversie) | sectie 6 |
| 8 | Shopify → Instellingen → Klantprivacy | Laten zoals het is (toestemming vereist voor NL/BE/DE). Niet uitzetten om meer te meten | wettelijk |

## 8. End-to-end aankooptest: nog niet gedaan, akkoord nodig

Zonder echte betaling kan een purchase-event niet ontstaan, en een betaling of order mag alleen met akkoord. Mogelijke methodes:

| Methode | Kosten | Nadeel |
|---|---|---|
| **A. Echte kleine bestelling door de eigenaar** (oregano €2,50 + €5,95 verzending, iDEAL), daarna terugbetalen in Shopify | €8,45, na terugbetaling vrijwel €0 (Mollie-transactiekosten blijven) | een echte order in de administratie, gemarkeerd en terugbetaald |
| B. Kortingscode 100% + gratis verzending, 1 keer bruikbaar, daarna verwijderen | €0 | er moet tijdelijk een kortingscode in Shopify komen (instelling, akkoord nodig); orders van €0 kunnen bij sommige pixels anders verlopen |
| C. Shopify-testmodus / Bogus Gateway | €0 | zet de hele winkel in testmodus; echte klanten kunnen dan niet betalen. Afgeraden |

**Advies: A**, uitgevoerd **na** stap 1 en 2 van sectie 7, zodat in één test ook de Ads-conversie wordt bewezen. Draai daarbij vanaf een URL met `?gclid=TEST…` en "Alles accepteren". Te controleren: GA4 DebugView (purchase met transaction_id = order-ID, EUR, items), Ads → Conversies (binnen 24 uur 1 conversie), en geen dubbel event.

## 9. GO/NO-GO

**NO-GO voor Google Ads**, nu met bewijs:

- Er is geen Google Ads-aankoopconversie: de app-pixel heeft geen AW-label (gemeten).
- De aankoop is in Ads dus niet te meten. Elke uitgave zou blind zijn.

**GA4-aankooptracking zelf: werkt** binnen de grenzen van toestemming (2 van 2 orders met toestemming sinds 30-09 gemeten; de enige gemiste order had geen toestemming).

Wordt GO als: sectie 7 punt 1 t/m 3 gedaan, de testbestelling uit sectie 8 verschijnt als conversie in Ads, punt 4 en 5 gedaan of bewust uitgesteld, en de overige punten uit 09-LAUNCH-CHECKLIST.md afgevinkt.
