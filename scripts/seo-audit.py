#!/usr/bin/env python3
"""
Harvest Deli — lightweight pre-deploy SEO validator.

Scans every *.html in the repo (plus sitemap.xml + vercel.json + robots.txt)
and reports issues that would hurt crawlability / indexation / rich results.
Pure stdlib, no dependencies.

Usage:
    python3 scripts/seo-audit.py            # static checks only
    python3 scripts/seo-audit.py --live     # also HTTP-check sitemap URLs (200)

Exit code is non-zero if any ERROR-level issue is found (safe for CI / pre-deploy).
"""
import glob, json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
LIVE = "--live" in sys.argv
BASE = "https://harvestdeli.nl"

errors, warns = [], []
def err(m): errors.append(m)
def warn(m): warns.append(m)

def rx1(pat, s, flags=re.I|re.S):
    m = re.search(pat, s, flags); return m.group(1).strip() if m else None

# Pages that are intentionally noindex / not meant to rank.
PRIVATE = {"checkout","account","account-details","account-orders","account-addresses",
           "register","forgot-password","login","invoice","track-order","returns",
           "email-preview","order-success","admin","wishlist","404"}

titles, descs, html_files = {}, {}, sorted(glob.glob("*.html"))
for f in html_files:
    name = f[:-5]
    s = open(f, encoding="utf-8").read()
    title = rx1(r"<title>(.*?)</title>", s)
    desc  = rx1(r'<meta\s+name="description"\s+content="(.*?)"', s)
    canon = rx1(r'rel="canonical"\s+href="(.*?)"', s)
    robots = (rx1(r'<meta\s+name="robots"\s+content="(.*?)"', s) or "").lower()
    h1s = re.findall(r"<h1[\s>]", s, re.I)
    is_private = name in PRIVATE

    if not is_private:
        if not title: err(f"{f}: missing <title>")
        if not desc:  err(f"{f}: missing meta description")
        if not canon: err(f"{f}: missing canonical")
        if title: titles.setdefault(title, []).append(f)
        if desc:  descs.setdefault(desc, []).append(f)
        if len(h1s) == 0: warn(f"{f}: no <h1>")
        if len(h1s) > 1:  warn(f"{f}: {len(h1s)} <h1> tags (prefer 1)")
        if title and len(title) > 65: warn(f"{f}: title >65 chars ({len(title)})")
        if desc and (len(desc) < 70 or len(desc) > 165): warn(f"{f}: description length {len(desc)} (aim 70-160)")
    else:
        if "noindex" not in robots: err(f"{f}: private page missing 'noindex'")

    # JSON-LD validity
    for i, block in enumerate(re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', s, re.S)):
        try: json.loads(block)
        except Exception as e: err(f"{f}: invalid JSON-LD block #{i+1} ({e})")

    # legacy product.html hrefs (comments allowed; live href not)
    for m in re.finditer(r'href="([^"]*product\.html[^"]*)"', s):
        err(f"{f}: legacy href to {m.group(1)}")

    # images missing alt (skip decorative inline svg/use)
    for m in re.finditer(r"<img\b(?![^>]*\balt=)[^>]*>", s, re.I):
        warn(f"{f}: <img> without alt attribute")

# duplicate titles / descriptions across indexable pages
for t, fs in titles.items():
    if len(fs) > 1: err(f"duplicate <title> {t!r} on: {', '.join(fs)}")
for d, fs in descs.items():
    if len(fs) > 1: warn(f"duplicate meta description on: {', '.join(fs)}")

# sitemap vs redirects / private / existence
sm = open("sitemap.xml", encoding="utf-8").read() if os.path.exists("sitemap.xml") else ""
locs = re.findall(r"<loc>([^<]+)</loc>", sm)
red_srcs = set()
if os.path.exists("vercel.json"):
    vj = json.load(open("vercel.json"))
    red_srcs = {r.get("source") for r in vj.get("redirects", [])}
for loc in locs:
    path = loc.replace(BASE, "") or "/"
    if path in red_srcs: err(f"sitemap URL is a redirect source: {loc}")
    if path.endswith("product.html"): err(f"sitemap contains legacy product.html: {loc}")
    fn = "index.html" if path == "/" else path.lstrip("/")
    if fn.endswith(".html") and not os.path.exists(fn):
        err(f"sitemap URL has no matching file: {loc}")
    base = os.path.basename(fn)[:-5] if fn.endswith(".html") else ""
    if base in PRIVATE: err(f"sitemap contains a noindex page: {loc}")

if LIVE:
    for loc in locs:
        try:
            req = urllib.request.Request(loc, method="HEAD", headers={"User-Agent":"seo-audit"})
            code = urllib.request.urlopen(req, timeout=15).status
            if code != 200: err(f"sitemap URL returns {code}: {loc}")
        except Exception as e:
            err(f"sitemap URL failed ({e}): {loc}")

print(f"Scanned {len(html_files)} HTML files, {len(locs)} sitemap URLs.")
for w in warns: print("  WARN ", w)
for e in errors: print("  ERROR", e)
print(f"\n{len(errors)} error(s), {len(warns)} warning(s).")
sys.exit(1 if errors else 0)
