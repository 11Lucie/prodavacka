# Vyrobí ikony aplikace (účtenka na oranžovém pozadí).
import sys
from PIL import Image, ImageDraw
out = sys.argv[1]
def icon(size, maskable=False):
    S = 1024
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if maskable:
        d.rectangle([0, 0, S, S], fill=(255, 122, 89))
    else:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=220, fill=(255, 122, 89))
    k = 0.78 if maskable else 1.0
    def P(x, y):
        return (S / 2 + (x - S / 2) * k, S / 2 + (y - S / 2) * k)
    # účtenka se zubatým spodkem
    left, right, top, bottom = 290, 734, 170, 800
    pts = [P(left, top), P(right, top), P(right, bottom)]
    n = 7
    w = (right - left) / n
    for i in range(n):
        x1 = right - w * (i + 0.5)
        x2 = right - w * (i + 1)
        pts += [P(x1, bottom - 50), P(x2, bottom)]
    pts.append(P(left, top))
    d.polygon(pts, fill=(255, 255, 255))
    ink = (43, 33, 64)
    for i, (a, b) in enumerate([(350, 600), (350, 520), (350, 640), (350, 560)]):
        y = 260 + i * 80
        d.rounded_rectangle([*P(a, y), *P(b, y + 30)], radius=15 * k, fill=ink)
        d.rounded_rectangle([*P(620, y), *P(674, y + 30)], radius=15 * k, fill=ink)
    d.rounded_rectangle([*P(350, 590), *P(674, 610)], radius=8, fill=ink)
    # hvězda (body)
    import math
    cx, cy, R, r = 512, 680, 70, 30
    star = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rad = R if i % 2 == 0 else r
        star.append(P(cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    d.polygon(star, fill=(255, 194, 51))
    return im.resize((size, size), Image.LANCZOS)
icon(192).save(f'{out}/icon-192.png')
icon(512).save(f'{out}/icon-512.png')
icon(512, True).save(f'{out}/icon-maskable-512.png')
print('ok')
