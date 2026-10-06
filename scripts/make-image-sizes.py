"""Smaller copies of the product photos for srcset.

The honey photos are 1228 x 2200. A phone shows them about 350 px wide, so
it needs roughly 640 px (x1.75 density) and at most 960 px. Writes
<name>-640.webp and <name>-960.webp next to each original; existing copies
are only rebuilt when the original is newer.

    ~/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3.12 scripts/make-image-sizes.py
    (or: uv run --no-project --with pillow python scripts/make-image-sizes.py)
"""
import os
import sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DIR = os.path.join(ROOT, 'assets', 'products-images')
HONEYS = ['chestnut', 'fir-vanilla', 'acacia', 'pine', 'orange-blossom', 'oak', 'arbutus', 'thyme', 'heather']
WIDTHS = [640, 960]
# Pantry photos: (source, base name for the WebP copies). oregano.png was a
# 2.3 MB PNG used as the page's main photo.
PANTRY = [
    ('assets/greekoliveoil.webp', 'assets/greekoliveoil'),
    ('assets/products-images/chamomile-tea.webp', 'assets/products-images/chamomile-tea'),
    ('assets/products-images/mountain-tea.webp', 'assets/products-images/mountain-tea'),
    ('assets/products-images/oregano.png', 'assets/products-images/oregano'),
]


def main():
    made = 0
    for slug in HONEYS:
        for suffix in ('', '-origin', '-serving'):
            src = os.path.join(DIR, f'{slug}{suffix}.webp')
            if not os.path.exists(src):
                print('ontbreekt', src, file=sys.stderr)
                continue
            im = Image.open(src)
            for w in WIDTHS:
                if im.width <= w:
                    continue
                dst = os.path.join(DIR, f'{slug}{suffix}-{w}.webp')
                if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
                    continue
                h = round(im.height * w / im.width)
                im.convert('RGB').resize((w, h), Image.LANCZOS).save(dst, 'WEBP', quality=80, method=6)
                made += 1
    for src_rel, base_rel in PANTRY:
        src = os.path.join(ROOT, src_rel)
        if not os.path.exists(src):
            print('ontbreekt', src, file=sys.stderr)
            continue
        im = Image.open(src).convert('RGB')
        full = os.path.join(ROOT, base_rel + '.webp')
        if not src.endswith('.webp') and (not os.path.exists(full) or os.path.getmtime(full) < os.path.getmtime(src)):
            im.save(full, 'WEBP', quality=82, method=6)
            made += 1
        for w in WIDTHS:
            if im.width <= w:
                continue
            dst = os.path.join(ROOT, f'{base_rel}-{w}.webp')
            if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
                continue
            h = round(im.height * w / im.width)
            im.resize((w, h), Image.LANCZOS).save(dst, 'WEBP', quality=80, method=6)
            made += 1
    print('gemaakt:', made)


if __name__ == '__main__':
    main()
