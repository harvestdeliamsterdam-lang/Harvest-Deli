#!/usr/bin/env python3
"""Generates the CSV deliverables for google-ads-launch-2026-11.
Every campaign, ad group, keyword and ad is written with status Paused.
Search volume / competition / CPC are deliberately left as 'onbekend':
DataForSEO returned HTTP 402 on 30-10-2026 and nothing may be invented."""
import csv, os, sys

OUT = sys.argv[1]
IMP = os.path.join(OUT, '08-GOOGLE-ADS-EDITOR-IMPORT')
OPT = os.path.join(IMP, 'optioneel-C-olijfolie')
os.makedirs(OPT, exist_ok=True)
S = 'https://harvestdeli.nl'
U = {
    'shop': S + '/shop.html',
    'thyme': S + '/products/thyme-honey', 'pine': S + '/products/pine-honey',
    'oak': S + '/products/oak-honey', 'heather': S + '/products/heather-honey',
    'acacia': S + '/products/acacia-honey', 'orange': S + '/products/orange-blossom-honey',
    'arbutus': S + '/products/arbutus-honey', 'wildflower': S + '/products/wildflower-honey',
    'fir': S + '/products/vanilla-honey', 'chestnut': S + '/products/chestnut-honey',
    'oil': S + '/products/extra-virgin-olive-oil',
}
CB = 'HD | Search | Griekse honing | NL'
CC = 'HD | Search | Griekse olijfolie | NL'
CA = 'HD | Shopping | Alle producten | NL'
UNK = 'onbekend'
errors = []

def chk(text, limit, what):
    if len(text) > limit:
        errors.append(f'{what} te lang ({len(text)}>{limit}): {text}')
    if '—' in text:
        errors.append(f'{what} bevat een em-dash: {text}')
    return text

# ---------------------------------------------------------------- keywords
# (campaign, ad group, keyword, match, landing key, intent, priority, gsc_imp, gsc_pos, note)
K = [
 (CB,'Griekse honing','griekse honing kopen','Exact','shop','transactioneel','1',52,11.9,''),
 (CB,'Griekse honing','griekse honing kopen','Phrase','shop','transactioneel','1',52,11.9,''),
 (CB,'Griekse honing','griekse honing bestellen','Phrase','shop','transactioneel','1','','',''),
 (CB,'Griekse honing','griekse honing online','Phrase','shop','transactioneel','1','','',''),
 (CB,'Griekse honing','griekse honing','Exact','shop','gemengd (koop + info)','2',22,20.6,'Breed: eerst Exact, zoektermen dagelijks lezen'),
 (CB,'Griekse honing','rauwe griekse honing','Phrase','shop','transactioneel','1','','',''),
 (CB,'Griekse honing','griekse honing webshop','Phrase','shop','transactioneel','2','','',''),
 (CB,'Rauwe honing','rauwe honing kopen','Phrase','shop','transactioneel','1','','',''),
 (CB,'Rauwe honing','rauwe honing bestellen','Phrase','shop','transactioneel','2','','',''),
 (CB,'Rauwe honing','ongefilterde honing kopen','Phrase','shop','transactioneel','2',2,11,'GSC kent alleen "ongefilterde honing"'),
 (CB,'Rauwe honing','echte honing bestellen','Phrase','shop','transactioneel','2',1,7,''),
 (CB,'Rauwe honing','honing online bestellen','Phrase','shop','transactioneel','3',8,6.8,'GSC: "honing bestellen". Generiek, hoge kans op dure klikken'),
 (CB,'Tijmhoning','tijmhoning','Exact','thyme','gemengd','1','','',''),
 (CB,'Tijmhoning','tijmhoning kopen','Phrase','thyme','transactioneel','1','','',''),
 (CB,'Tijmhoning','griekse tijmhoning','Phrase','thyme','transactioneel','1','','',''),
 (CB,'Tijmhoning','tijm honing','Phrase','thyme','gemengd','2','','',''),
 (CB,'Honingsoorten','dennenhoning','Exact','pine','gemengd','2','','',''),
 (CB,'Honingsoorten','dennenhoning kopen','Phrase','pine','transactioneel','1','','',''),
 (CB,'Honingsoorten','griekse dennenhoning','Phrase','pine','transactioneel','1','','',''),
 (CB,'Honingsoorten','eikenhoning','Phrase','oak','gemengd','2','','',''),
 (CB,'Honingsoorten','heidehoning kopen','Phrase','heather','transactioneel','1','','',''),
 (CB,'Honingsoorten','acaciahoning kopen','Phrase','acacia','transactioneel','2','','',''),
 (CB,'Honingsoorten','sinaasappelbloesemhoning','Phrase','orange','gemengd','2','','',''),
 (CB,'Honingsoorten','arbutus honing','Phrase','arbutus','gemengd','3','','',''),
 (CB,'Honingsoorten','bloesemhoning kopen','Phrase','wildflower','transactioneel','2','','','Geen GTIN nog; wel Search-geschikt'),
 (CB,'Honingsoorten','vanille honing','Phrase','fir','gemengd','3',1,26,''),
 (CB,'Honingsoorten','berghoning','Phrase','shop','gemengd','3',78,45.4,'Hoogste GSC-vertoningen, maar wij verkopen geen product met die naam. Pas na review aanzetten'),
 (CB,'Honingsoorten','kastanjehoning','Phrase','chestnut','gemengd','2',3,64.3,'Weer op voorraad sinds 31-10-2026 (50 + 50)'),
 (CC,'Griekse olijfolie','griekse olijfolie kopen','Phrase','oil','transactioneel','optioneel','','','Campagne C, alleen als eigenaar besluit'),
 (CC,'Griekse olijfolie','griekse olijfolie','Exact','oil','gemengd','optioneel',1,6,'GSC: "olijfolie grieks"'),
 (CC,'Griekse olijfolie','extra vierge olijfolie griekenland','Phrase','oil','transactioneel','optioneel','','',''),
 (CC,'Griekse olijfolie','olijfolie bestellen','Phrase','oil','transactioneel','optioneel',10,7.9,'Generiek, concurrentie met supermarkten'),
]

with open(os.path.join(OUT, '03-KEYWORD-RESEARCH.csv'), 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['campagne','advertentiegroep','zoekwoord','matchtype','landingspagina','intentie','prioriteit',
                'zoekvolume_nl_maand','concurrentie','cpc_schatting',
                'gsc_vertoningen_90d_organisch','gsc_gem_positie','bron_en_opmerking'])
    for c,ag,kw,m,lp,intent,prio,imp,pos,note in K:
        src = 'GSC sc-domain:harvestdeli.nl 01-08 t/m 30-10-2026 (organische vertoningen van deze site, GEEN zoekvolume)' if imp != '' else 'Afgeleid van productcatalogus; geen gemeten data'
        w.writerow([c,ag,kw,m,U[lp],intent,prio,UNK,UNK,UNK,imp,pos,(src + ('. ' + note if note else ''))])

# ---------------------------------------------------------------- RSAs
RSA = {
 'Griekse honing': dict(url=U['shop'], p1='griekse', p2='honing', H=[
   'Rauwe Griekse Honing','Griekse Honing Online Kopen','Harvest Deli Amsterdam',
   'Tijm, Den, Eik, Heide en Meer','Gratis Verzending vanaf €60','Potten van 480 g en 950 g',
   '€5 Korting bij 3 Potten','Rauw en Ongefilterd','Honing uit Griekenland',
   'Griekse Honing Bestellen','Bloemig, Kruidig of Donker','Kies Je Favoriete Soort',
   'Bestel Vandaag Online','Combineer Soorten en Bespaar','Vanaf €14 per Pot'], D=[
   'Rauwe, ongefilterde honing uit Griekenland. Tijm, den, eik, heide en meer.',
   'Gratis verzending in Nederland en België vanaf €60. Kies 480 g of 950 g.',
   'Combineer en bespaar: €5 korting bij 3 potten, €10 bij 6. Gaat automatisch.',
   'Van Harvest Deli uit Amsterdam. Bloemige, kruidige en donkere Griekse honing.'],
   pin={'Rauwe Griekse Honing':'1'}),
 'Rauwe honing': dict(url=U['shop'], p1='rauwe', p2='honing', H=[
   'Rauwe Honing Online Kopen','Rauw en Ongefilterd','Rauwe Griekse Honing',
   'Harvest Deli Amsterdam','Gratis Verzending vanaf €60','Potten van 480 g en 950 g',
   '€5 Korting bij 3 Potten','Tijm, Den, Eik, Heide en Meer','Honing uit Griekenland',
   'Echte Honing Bestellen','Bestel Vandaag Online','Kies Je Favoriete Soort',
   'Bloemig, Kruidig of Donker','Combineer Soorten en Bespaar','Vanaf €14 per Pot'], D=[
   'Rauwe, ongefilterde honing uit Griekenland, in potten van 480 g en 950 g.',
   'Gratis verzending in Nederland en België vanaf €60. Bestel vandaag online.',
   'Combineer en bespaar: €5 korting bij 3 potten, €10 bij 6. Gaat automatisch.',
   'Harvest Deli uit Amsterdam: Griekse honing van tijm, den, eik, heide en meer.'],
   pin={'Rauwe Honing Online Kopen':'1'}),
 'Tijmhoning': dict(url=U['thyme'], p1='tijmhoning', p2='', H=[
   'Griekse Tijmhoning','Tijmhoning Online Kopen','Rauwe Tijmhoning',
   'Harvest Deli Amsterdam','Gratis Verzending vanaf €60','Potten van 480 g en 950 g',
   '€5 Korting bij 3 Potten','Rauw en Ongefilterd','Honing uit Griekenland',
   'Tijmhoning Bestellen','Bestel Vandaag Online','Kruidige Griekse Honing',
   'Tijmhoning vanaf €19','Combineer Soorten en Bespaar','Proef Echte Tijmhoning'], D=[
   'Rauwe Griekse tijmhoning, ongefilterd. In potten van 480 g en 950 g.',
   'Gratis verzending in Nederland en België vanaf €60. Bestel vandaag online.',
   'Combineer en bespaar: €5 korting bij 3 potten, €10 bij 6. Gaat automatisch.',
   'Van Harvest Deli uit Amsterdam. Bekijk ook onze andere Griekse honingsoorten.'],
   pin={'Griekse Tijmhoning':'1'}),
 'Honingsoorten': dict(url=U['shop'], p1='honing', p2='soorten', H=[
   'Griekse Honingsoorten','Dennenhoning en Eikenhoning','Heidehoning en Acaciahoning',
   'Harvest Deli Amsterdam','Gratis Verzending vanaf €60','Potten van 480 g en 950 g',
   '€5 Korting bij 3 Potten','Rauw en Ongefilterd','Honing uit Griekenland',
   'Bloemig, Kruidig of Donker','Bestel Vandaag Online','Kies Je Favoriete Soort',
   'Rauwe Griekse Honing','Combineer Soorten en Bespaar','Vanaf €14 per Pot'], D=[
   'Den, eik, heide, acacia, sinaasappelbloesem en meer. Rauw en ongefilterd.',
   'Gratis verzending in Nederland en België vanaf €60. Kies 480 g of 950 g.',
   'Combineer en bespaar: €5 korting bij 3 potten, €10 bij 6. Gaat automatisch.',
   'Van Harvest Deli uit Amsterdam. Elke soort heeft een eigen smaak en kleur.'],
   pin={'Griekse Honingsoorten':'1'}),
}
RSA_C = {'Griekse olijfolie': dict(url=U['oil'], p1='olijfolie', p2='grieks', H=[
   'Griekse Olijfolie','Extra Vierge Olijfolie','Harvest Deli Amsterdam',
   'Fles van 500 ml voor €15','Gratis Verzending vanaf €60','Olijfolie uit Griekenland',
   'Bestel Vandaag Online','Combineer met Griekse Honing','€5 Korting: 2 Honing + Olie',
   'Griekse Olijfolie Kopen'], D=[
   'Extra vierge olijfolie uit Griekenland, 500 ml. Van Harvest Deli uit Amsterdam.',
   'Gratis verzending in Nederland en België vanaf €60. Bestel vandaag online.',
   'Neem 2 potten honing en 1 olijfolie en krijg automatisch €5 korting.'],
   pin={'Griekse Olijfolie':'1'})}

def rsa_rows(camp, d):
    rows = []
    for ag, a in d.items():
        r = {'Campaign': camp, 'Ad group': ag, 'Ad type': 'Responsive search ad', 'Status': 'Paused',
             'Final URL': a['url'], 'Path 1': chk(a['p1'],15,'Path'), 'Path 2': chk(a['p2'],15,'Path')}
        for i, h in enumerate(a['H'], 1):
            r[f'Headline {i}'] = chk(h, 30, f'{ag} H{i}')
            r[f'Headline {i} position'] = a['pin'].get(h, '')
        for i, t in enumerate(a['D'], 1):
            r[f'Description {i}'] = chk(t, 90, f'{ag} D{i}')
        rows.append(r)
    return rows

RSA_HDR = ['Campaign','Ad group','Ad type','Status','Final URL','Path 1','Path 2'] + \
    [x for i in range(1,16) for x in (f'Headline {i}', f'Headline {i} position')] + \
    [f'Description {i}' for i in range(1,5)]

def write(path, hdr, rows):
    with open(path, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=hdr, extrasaction='raise')
        w.writeheader()
        for r in rows: w.writerow({k: r.get(k, '') for k in hdr})

rb = rsa_rows(CB, RSA); rc = rsa_rows(CC, RSA_C)
# 04: readable copy library, one line per asset
with open(os.path.join(OUT, '04-SEARCH-ADS.csv'), 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['campagne','advertentiegroep','soort','nr','tekst','tekens','limiet','vastgezet','final_url','status'])
    for camp, d in ((CB, RSA), (CC, RSA_C)):
        for ag, a in d.items():
            for i, h in enumerate(a['H'], 1):
                w.writerow([camp, ag, 'kop', i, h, len(h), 30, a['pin'].get(h, ''), a['url'], 'Paused'])
            for i, t in enumerate(a['D'], 1):
                w.writerow([camp, ag, 'beschrijving', i, t, len(t), 90, '', a['url'], 'Paused'])
            w.writerow([camp, ag, 'pad', 1, a['p1'], len(a['p1']), 15, '', a['url'], 'Paused'])
            if a['p2']: w.writerow([camp, ag, 'pad', 2, a['p2'], len(a['p2']), 15, '', a['url'], 'Paused'])

# ---------------------------------------------------------------- negatives
NEG = [  # (keyword, match, reason)
 ('gratis','Broad','geen koopintentie'),('recept','Broad','informatief'),('recepten','Broad','informatief'),
 ('wat is','Phrase','informatief'),('betekenis','Broad','informatief'),('wikipedia','Broad','informatief'),
 ('calorieen','Broad','informatief'),('calorieën','Broad','informatief'),('kcal','Broad','informatief'),
 ('gezond','Broad','gezondheidsvraag; wij doen geen gezondheidsclaims'),('keelpijn','Broad','gezondheidsvraag'),
 ('hoest','Broad','gezondheidsvraag'),('baby','Broad','gezondheidsvraag (honing onder 1 jaar)'),
 ('zwanger','Broad','gezondheidsvraag'),('allergie','Broad','gezondheidsvraag'),('wond','Broad','medisch gebruik'),
 ('kristalliseert','Broad','informatief (eigen journal bestaat)'),('houdbaar','Broad','informatief'),
 ('houdbaarheid','Broad','informatief'),('bewaren','Broad','informatief'),
 ('manuka','Broad','ander product, niet in assortiment'),('imker','Broad','zoekt lokale imker'),
 ('imker worden','Phrase','hobby'),('bijenkast','Broad','hobby'),('bijen houden','Phrase','hobby'),
 ('honingraat','Broad','niet in assortiment'),('vacature','Broad','werk'),('vacatures','Broad','werk'),
 ('baan','Broad','werk'),('groothandel','Broad','B2B, we verkopen per pot'),('bulk','Broad','B2B'),
 ('emmer','Broad','grootverpakking'),('5 kg','Phrase','grootverpakking'),('10 kg','Phrase','grootverpakking'),
 ('albert heijn','Phrase','supermarkt'),('ah','Exact','supermarkt'),('jumbo','Broad','supermarkt'),
 ('lidl','Broad','supermarkt'),('aldi','Broad','supermarkt'),('plus','Exact','supermarkt'),
 ('kruidvat','Broad','drogist'),('etos','Broad','drogist'),('action','Broad','discounter'),
 ('honingmosterd','Broad','ander product'),('honing mosterd','Phrase','ander product'),
 ('mede','Exact','honingwijn'),('honingwijn','Broad','ander product'),('honingdrop','Broad','ander product'),
 ('honingmeloen','Broad','ander product'),('kaars','Broad','bijenwas'),('kaarsen','Broad','bijenwas'),
 ('gezichtsmasker','Broad','cosmetica'),('shampoo','Broad','cosmetica'),('zalf','Broad','cosmetica'),
 ('nep','Broad','onderzoek/nieuws'),('test','Broad','onderzoek/nieuws'),('consumentenbond','Broad','onderzoek'),
 ('zelf maken','Phrase','DIY'),('tattoo','Broad','irrelevant'),('honey singh','Phrase','irrelevant'),
]
NEG_OIL = [('olijfolie in de buurt','Phrase','lokaal, behalve als winkels meetellen'),('frituren','Broad','ander gebruik'),
           ('olijfolie tegen','Phrase','gezondheid/cosmetica'),('haar','Broad','cosmetica'),('huid','Broad','cosmetica')]
with open(os.path.join(OUT, '05-NEGATIVE-KEYWORDS.csv'), 'w', newline='') as f:
    w = csv.writer(f); w.writerow(['lijst','niveau','zoekwoord','matchtype','reden'])
    for k,m,r in NEG: w.writerow(['HD - Uitsluitingen basis','gedeelde lijst (alle campagnes)',k,m,r])
    for k,m,r in NEG_OIL: w.writerow(['HD - Uitsluitingen olijfolie','alleen campagne C',k,m,r])

# ---------------------------------------------------------------- Editor import
BUDGET = {CB: '6.67', CC: '2.67', CA: '17.33'}
camp_hdr = ['Campaign','Campaign Type','Campaign Status','Budget','Budget type','Bid Strategy Type',
            'Max CPC Bid Limit','Networks','Languages','Location','Location targeting method','Ad rotation','Start Date','Shopping: Merchant Identifier','Shopping: Country of Sale','Comment']
def camp(c, t, net, note, mcid=''):
    return {'Campaign': c, 'Campaign Type': t, 'Campaign Status': 'Paused', 'Budget': BUDGET[c],
            'Budget type': 'Daily', 'Bid Strategy Type': 'Maximize clicks', 'Max CPC Bid Limit': 'IN TE VULLEN',
            'Networks': net, 'Languages': 'nl', 'Location': 'Netherlands',
            'Location targeting method': 'Presence', 'Ad rotation': 'Optimize', 'Start Date': '',
            'Shopping: Merchant Identifier': mcid, 'Shopping: Country of Sale': 'NL' if mcid else '', 'Comment': note}
write(os.path.join(IMP, '01-campaigns.csv'), camp_hdr, [
    camp(CA, 'Shopping', 'Google search', 'Standaard Shopping. Merchant ID invullen (alleen cijfers van MC-KN68N920QL zoals Editor die toont). Search partners uit.', mcid='IN TE VULLEN'),
    camp(CB, 'Search', 'Google search', 'Alleen Google Zoeken: Search partners en Display uit.')])
write(os.path.join(OPT, '01-campaign-C.csv'), camp_hdr, [camp(CC, 'Search', 'Google search', 'OPTIONEEL. Advies: niet starten in maand 1 (zie 02-BUDGET).')])

ag_hdr = ['Campaign','Ad group','Ad group status','Ad group type','Max CPC']
agrows = [{'Campaign': CA, 'Ad group': 'Alle producten', 'Ad group status': 'Paused', 'Ad group type': 'Standard shopping', 'Max CPC': 'IN TE VULLEN'}]
agrows += [{'Campaign': CB, 'Ad group': ag, 'Ad group status': 'Paused', 'Ad group type': 'Standard', 'Max CPC': ''} for ag in RSA]
write(os.path.join(IMP, '02-ad-groups.csv'), ag_hdr, agrows)
write(os.path.join(OPT, '02-ad-groups-C.csv'), ag_hdr, [{'Campaign': CC, 'Ad group': 'Griekse olijfolie', 'Ad group status': 'Paused', 'Ad group type': 'Standard', 'Max CPC': ''}])

kw_hdr = ['Campaign','Ad group','Keyword','Criterion Type','Status','Final URL']
def kwrows(camp):
    out = []
    for c,ag,kw,m,lp,intent,prio,imp,pos,note in K:
        if c != camp or prio == 'UIT': continue  # sold out: research only, never imported
        out.append({'Campaign': c, 'Ad group': ag, 'Keyword': kw, 'Criterion Type': m, 'Status': 'Paused',
                    'Final URL': U[lp] if ag == 'Honingsoorten' else ''})
    return out
write(os.path.join(IMP, '03-keywords.csv'), kw_hdr, kwrows(CB))
write(os.path.join(OPT, '03-keywords-C.csv'), kw_hdr, kwrows(CC))
write(os.path.join(IMP, '04-responsive-search-ads.csv'), RSA_HDR, rb)
write(os.path.join(OPT, '04-responsive-search-ads-C.csv'), RSA_HDR, rc)

neg_hdr = ['Shared set name','Keyword','Criterion Type']
mt = {'Broad': 'Negative Broad', 'Phrase': 'Negative Phrase', 'Exact': 'Negative Exact'}
write(os.path.join(IMP, '05-shared-negative-list.csv'), neg_hdr,
      [{'Shared set name': 'HD - Uitsluitingen basis', 'Keyword': k, 'Criterion Type': mt[m]} for k,m,r in NEG])
write(os.path.join(OPT, '05-negatives-C.csv'), ['Campaign','Keyword','Criterion Type'],
      [{'Campaign': CC, 'Keyword': k, 'Criterion Type': mt[m]} for k,m,r in NEG_OIL])

SL = [('Alle Griekse honing', U['shop'], 'Tijm, den, eik, heide en meer', 'Rauw en ongefilterd'),
      ('Tijmhoning', U['thyme'], 'Kruidige Griekse tijmhoning', 'Vanaf €19 voor 480 g'),
      ('Bloesemhoning', U['wildflower'], 'Mild en bloemig', 'Vanaf €14 voor 480 g'),
      ('Dennenhoning', U['pine'], 'Donker en vol van smaak', 'Vanaf €16 voor 480 g'),
      ('Verzending', S + '/legal-shipping.html', 'NL en BE gratis vanaf €60', 'Bekijk tarieven en levertijd'),
      ('Over Harvest Deli', S + '/about.html', 'Griekse delicatessen', 'Uit Amsterdam')]
sl_hdr = ['Campaign','Sitelink text','Final URL','Description line 1','Description line 2','Status']
write(os.path.join(IMP, '07-sitelinks.csv'), sl_hdr, [{'Campaign': CB, 'Sitelink text': chk(t,25,'Sitelink'), 'Final URL': u,
      'Description line 1': chk(d1,35,'SL d1'), 'Description line 2': chk(d2,35,'SL d2'), 'Status': 'Paused'} for t,u,d1,d2 in SL])
CO = ['Gratis bezorging v.a. €60','Rauw en ongefilterd','Potten van 480 en 950 g','€5 korting bij 3 potten','Betalen met iDEAL','Uit Amsterdam']
write(os.path.join(IMP, '08-callouts.csv'), ['Campaign','Callout text','Status'],
      [{'Campaign': CB, 'Callout text': chk(c,25,'Callout'), 'Status': 'Paused'} for c in CO])
write(os.path.join(IMP, '09-structured-snippets.csv'), ['Campaign','Structured snippet header','Structured snippet values','Status'],
      [{'Campaign': CB, 'Structured snippet header': 'Types',
        'Structured snippet values': ';'.join(chk(v,25,'Snippet') for v in ['Tijm','Den','Eik','Heide','Acacia','Sinaasappelbloesem','Arbutus','Bloesem']), 'Status': 'Paused'}])

if errors:
    print('\n'.join(errors)); sys.exit(1)
print('OK', len(K), 'keywords;', sum(len(a['H']) for a in RSA.values()), 'headlines B')
