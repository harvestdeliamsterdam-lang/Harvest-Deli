# 07 · Merchant Center-check

**Wat gecontroleerd kon worden:** de eigen feed (https://harvestdeli.nl/feeds/google-merchant.xml, live op 30-10-2026) en de productdata in Shopify.
**Wat niet gecontroleerd kon worden:** Merchant Center zelf (MC-KN68N920QL). Goedkeuringen, afkeuringen, de domeinclaim en welke databron er actief is, zijn **onbekend**. Die moet de eigenaar in Merchant Center nakijken (sectie 3).

## 1. Producten

Prijzen en voorraad uit Shopify op 30-10-2026. "Feed" = eigen feed op harvestdeli.nl. MC-goedkeuring = **onbekend** voor alle regels.

| SKU | Product | Prijs | Voorraad | GTIN | Landingspagina | Advies Shopping |
|---|---|---|---|---|---|---|
| HD-HON-THYME-480 / -950 | Tijmhoning | €19 / €34 | 16 / 20 | ja | /products/thyme-honey | **aan** |
| HD-HON-PINE-480 / -950 | Dennenhoning | €16 / €28 | 16 / 20 | ja | /products/pine-honey | **aan** |
| HD-HON-OAK-480 / -950 | Eikenhoning | €17 / €30 | 20 / 19 | ja | /products/oak-honey | **aan** |
| HD-HON-HEATHER-480 / -950 | Heidehoning | €18 / €32 | 19 / 20 | ja | /products/heather-honey | **aan** |
| HD-HON-ACACIA-480 / -950 | Acaciahoning | €17 / €30 | 20 / 18 | ja | /products/acacia-honey | **aan** |
| HD-HON-ORANGE-480 / -950 | Sinaasappelbloesemhoning | €15 / €26 | 18 / 20 | ja | /products/orange-blossom-honey | **aan** |
| HD-HON-ARBUTUS-480 / -950 | Arbutushoning | €19 / €34 | 19 / 20 | ja | /products/arbutus-honey | **aan** |
| HD-HON-FIR-480 / -950 | Sparrenhoning Vanille | €22 / €40 | 18 / 18 | ja | /products/vanilla-honey | **aan** |
| HD-HON-WILDFLOWER-480 / -950 | Bloesemhoning | €14 / €24 | 20 / 20 | 8721593944220 / 8721593944237 (sinds 31-10 bekend; **nog in Shopify zetten**) | /products/wildflower-honey | **uit tot echte foto** |
| HD-HON-CHESTNUT-480 / -950 | Kastanjehoning | €18 / €32 | 50 / 50 (sinds 31-10) | ja | /products/chestnut-honey | **aan** |
| HD-OIL-EVOO-500 | Extra vierge olijfolie 500 ml | €15 | 19 | ja | /products/extra-virgin-olive-oil | aan, laag bod |
| HD-TEA-MOUNTAIN-1 | Griekse Bergthee 25 g | €5 | 16 | ja | /products/greek-mountain-tea | **uit** (prijs te laag voor klikkosten) |
| HD-TEA-CHAMOMILE-25 | Griekse Kamillethee 25 g | €5 | 20 | ja | /products/greek-chamomile-tea | **uit** |
| HD-HERB-OREGANO-15 | Wilde oregano 15 g | €2,50 | 16 | ja | /products/wild-oregano | **uit** |

Shopify-ID's en variant-ID's staan in de feed en in shared.js (pid/vid per maat). Alle 14 landingspagina's gaven op 30-10 HTTP 200.

Overal in de feed: merk Harvest Deli, conditie new, Google-productcategorie ingevuld, Nederlandse titels met soort en gewicht.

## 2. Gevonden punten

| # | Ernst | Punt | Actie |
|---|---|---|---|
| 1 | **Hoog** | **Twee mogelijke databronnen.** De eigen feed gebruikt de SKU als id (HD-HON-…). De Google & YouTube-app van Shopify stuurt producten met id `shopify_NL_<product>_<variant>`. Staan beide in MC, dan staat elk product er dubbel in. | Eigenaar: MC → Producten → **Databronnen**. Kies er één. Advies: de Shopify-app als enige bron, want de checkoutpixel gebruikt diezelfde id's. Dan wel de verbeterde titels/beschrijvingen uit de eigen feed als aanvullende bron, of in Shopify zelf zetten. |
| 2 | **Hoog** | **Bloesemhoning: AI-productfoto's met een fout etiket** ("BIPRODUCTS" in plaats van "GREEK PRODUCTS"), honing donkerder dan het echte product. | Uitsluiten in Shopping tot er een echte foto is. |
| 3 | **Hoog** | **Productbeschrijvingen met onbevestigde feiten.** Voorbeelden in de feed: kastanje "uit de kastanjebossen op de zuidflank van Pelion", sparrenhoning "van de hellingen van de Olympus", "koud geslingerd op keldertemperatuur", "gebotteld in handgeperst glas, verzegeld in was", "ongepasteuriseerd". Ook de Sparrenhoning Vanille wordt als "dennenboshoning" beschreven. | **Eigenaar bevestigt per soort** wat waar is (herkomstregio, verwerking, verpakking). Wat niet klopt, eruit, voordat er betaald verkeer naartoe gaat. De brief verbiedt verzonnen labels, en Google keurt misleidende productinformatie af. |
| 4 | Midden | Bloesemhoning heeft geen GTIN. | Mag met identifier_exists = no, maar EAN's invullen zodra ze er zijn (Shopify barcode + catalogus + feed). |
| 5 | Midden | De feed markeert de **beschrijvingen** als door AI geschreven (structured_description, trained_algorithmic_media). Dat is correct en mag blijven. Voor **afbeeldingen** die AI zijn, geldt een aparte regel (IPTC-metadata in het beeldbestand). | Bij twijfel over een productfoto: niet gebruiken in Shopping. |
| 6 | Laag | In de bloesemhoningbeschrijving ontbreken spaties na een punt ("smaak.Geoogst", "kaas.Honing"). | Bron in api/merchant-feed.js of Shopify-beschrijving rechtzetten bij de volgende websiteronde (geen live wijziging zonder akkoord). |
| 7 | Laag | shipping_weight ontbreekt in de feed. | Niet nodig zolang verzending in MC als vaste prijs per land staat (sectie 3). |

## 3. Eigenaar: in Merchant Center nakijken vóór GO

1. **Producten → Alle producten**: hoeveel zijn goedgekeurd, beperkt, afgekeurd? Noteer de redenen.
2. **Databronnen**: welke bronnen zijn actief (zie punt 1)?
3. **Instellingen → Bedrijfsgegevens → Website**: is harvestdeli.nl **geverifieerd en geclaimd**? Zolang de checkout op su08c4-v4.myshopify.com draait, kan MC klagen over een afwijkend checkoutdomein. Oplossing staat in GOOGLE-ADS-OWNER-ACTIONS.md stap 1 en 2 (shop.harvestdeli.nl).
4. **Verzending en retour**: NL €5,95, gratis vanaf €60, BE €6,95, gratis vanaf €60, bezorgtijd 1 tot 3 werkdagen. Retourbeleid ingevuld (pagina /legal-returns.html).
5. **Gekoppelde accounts**: Google Ads-account gekoppeld en geaccepteerd.
6. **Doelland**: Nederland, taal Nederlands. België mag als extra land, maar de campagnes richten zich in maand 1 op NL.
7. Geen meldingen over **misleidende weergave** of **onvolledige bedrijfsgegevens** (adres, telefoon, KvK zichtbaar op de site).
