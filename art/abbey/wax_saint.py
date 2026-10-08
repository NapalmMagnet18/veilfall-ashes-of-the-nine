# Graveyard of Wax Saints: robed stone saints drowned in candle wax. argv after --: a | b | c
#   a: hands clasped low cradling melted candles   b: right arm raised with a stone lantern of memory-light
#   c: bowed, hands pressed in prayer, a dried-blood sash across the chest
import sys; sys.path.insert(0, "art/abbey")
from saintkit import *
V = sys.argv[sys.argv.index("--") + 1]
SEED = {"a": 1, "b": 2, "c": 3}[V]
reset(); M = abbey_mats(); R = random.Random(SEED * 31)
PZ = .6  # plinth top
BOW = .32 if V == "c" else 0.0

def bow(p):
    x, y, z = p
    if BOW and z > 1.95: y -= (z - 1.95) * BOW; z -= (z - 1.95) ** 2 * .15
    return (x, y, z)

# ---- plinth with foundation, worn inscription, wax curtains
foundation(M["stone"], .62, .57)
box(M["stone"], -.6, .6, -.55, .55, 0, .17, .012, SEED)
box(M["stone"], -.5, .5, -.45, .45, .15, .53, .01, SEED + 1)
box(M["stone"], -.55, .55, -.5, .5, .51, PZ, .012, SEED + 2)
box(M["stone"], -.36, .36, -.452, -.44, .22, .46)  # sunk panel face
glyphs(M, 0, -.454, .4, 4, .6, SEED)
# ---- robe
P = [(.6, .44, .38), (.75, .42, .35), (1.1, .36, .29), (1.45, .31, .24), (1.75, .31, .23), (1.95, .34, .22), (2.05, .28, .19), (2.12, .12, .11)]
def prof(z):
    for (z0, a0, b0), (z1, a1, b1) in zip(P, P[1:]):
        if z <= z1:
            t = (z - z0) / (z1 - z0); return a0 + (a1 - a0) * t, b0 + (b1 - b0) * t
    return P[-1][1], P[-1][2]
def robe_pt(th, z, off=0.0):
    rx, ry = prof(z); t = (z - .6) / 1.52
    f = 1 + .08 * (1 - t) ** 1.4 * math.sin(9 * th + .7 * math.sin(3 * th) + SEED)
    return ((rx * f + off) * math.cos(th), (ry * f + off) * math.sin(th), z)
lathe(lambda th, t: bow(robe_pt(th, 2.12 - t * (2.12 - .58))), 32, 22, M["stone"], "robe")
# ---- wax veil poured over the head, hardened; the face smoothed away
VP = [(2.53, .0), (2.5, .09), (2.42, .155), (2.3, .172), (2.18, .158), (2.1, .215), (2.03, .335), (1.97, .375)]
def hem(th):
    front = math.exp(-((math.atan2(math.sin(th + math.pi / 2), math.cos(th + math.pi / 2))) / .7) ** 2)
    n = mnoise.noise(Vector((math.cos(th) * 2.2, math.sin(th) * 2.2, SEED * 1.7)))
    tongue = max(0, math.sin(th * 7 + SEED)) ** 6 * .28
    return 1.8 - .24 * front - .12 * n - tongue
def veil(th, t):
    zh = hem(th); n = len(VP)
    s = t * (n - 1 + 3)
    if s <= n - 1:
        i = min(int(s), n - 2); u = s - i
        z = VP[i][0] + (VP[i + 1][0] - VP[i][0]) * u; r = VP[i][1] + (VP[i + 1][1] - VP[i][1]) * u
        x, y = r * math.cos(th), r * .82 * math.sin(th)
        fr = max(0, -math.sin(th)) ** 3  # the face, a smooth wax bulge
        y -= .045 * fr * math.exp(-((z - 2.3) / .09) ** 2)
        y -= .02 * fr * math.exp(-((z - 2.18) / .05) ** 2)
    else:
        u = (s - (n - 1)) / 3; z = 1.97 + (zh - 1.97) * u
        x, y, _ = robe_pt(th, z, .035 + .012 * (1 - u))
    w = .008 * mnoise.noise(Vector((x * 9, y * 9, z * 9)))
    return bow((x + w, y + w, z))
lathe(veil, 36, 18, M["wax"], "veil", cap_top=bow((0, 0, 2.535)), cap_bot=False)
# wax runs from the hem down the robe, going amber at the tips
for i in range(14 + SEED * 2):
    th = R.uniform(0, 6.283); z0 = hem(th) + .03; L = R.uniform(.2, .75)
    pts = [bow(robe_pt(th, z0 - L * k / 4, .028 - .008 * k / 4)) for k in range(5)]
    drip(M["wax"] if L < .4 else M["amber"], pts, R.uniform(.018, .03))
# ---- arms and hands
def sleeve(pts, rads):
    o = tube([bow(p) for p in pts], rads, 10, M["stone"]); jitter(o, .01, 6, SEED)
    a, b = Vector(bow(pts[-2])), Vector(bow(pts[-1]))  # wax cuff over the sleeve end
    tube([tuple(a + (b - a) * .4), tuple(a + (b - a) * .75)], [rads[-1] * 1.15, rads[-1] * 1.12], 10, M["wax"])
def hand(p, r=.07):
    h = prim("ico", M["wax"], loc=bow(p), subdivisions=2, radius=r); jitter(h, .012, 9, SEED); return h
if V == "a":
    for s in (-1, 1):
        sleeve([(s * .3, 0, 1.93), (s * .37, -.06, 1.62), (s * .22, -.25, 1.38), (s * .06, -.31, 1.32)], [.1, .11, .12, .1])
    hand((0, -.34, 1.33), .085)
    for k, (dx, dy, h) in enumerate([(0, -.35, .16), (-.06, -.32, .1), (.06, -.33, .12)]):
        candle(M, (dx, dy, 1.39), h, .028, True, 40 + k)
    drip(M["amber"], [(0, -.42, 1.33), (.01, -.44, 1.2), (0, -.43, 1.0), (.02, -.4, .85)], .03)
elif V == "b":
    sleeve([(.3, 0, 1.93), (.45, -.06, 2.08), (.43, -.12, 2.34), (.38, -.15, 2.52)], [.1, .095, .085, .075])
    sleeve([(-.3, 0, 1.93), (-.37, -.08, 1.66), (-.17, -.27, 1.55), (-.02, -.31, 1.58)], [.1, .11, .11, .09])
    hand((.38, -.15, 2.55), .075); hand((0, -.33, 1.58), .075)
    lx, ly, lz = .38, -.15, 2.6  # stone lantern on the raised palm
    box(M["stone"], lx - .12, lx + .12, ly - .12, ly + .12, lz, lz + .05)
    for sx in (-1, 1):
        for sy in (-1, 1): box(M["stone"], lx + sx * .1 - .025, lx + sx * .1 + .025, ly + sy * .1 - .025, ly + sy * .1 + .025, lz + .05, lz + .27)
    box(M["stone"], lx - .14, lx + .14, ly - .14, ly + .14, lz + .27, lz + .31)
    prim("cone", M["stone"], loc=(lx, ly, lz + .38), vertices=4, radius1=.17, radius2=.02, depth=.14, rot=(0, 0, math.pi / 4))
    prim("ico", M["stone"], loc=(lx, ly, lz + .47), subdivisions=1, radius=.035)
    prim("ico", M["memory"], loc=(lx, ly, lz + .15), subdivisions=2, radius=.075)
    for k in range(4):
        a = k * 1.57 + .4
        drip(M["wax"], [(lx + math.cos(a) * .14, ly + math.sin(a) * .14, lz + .3), (lx + math.cos(a) * .15, ly + math.sin(a) * .15, lz + .2), (lx + math.cos(a) * .15, ly + math.sin(a) * .15, lz + .08 - k * .02)], .016)
else:
    for s in (-1, 1):
        sleeve([(s * .3, 0, 1.93), (s * .38, -.08, 1.66), (s * .17, -.27, 1.6), (s * .04, -.33, 1.7)], [.1, .11, .1, .085])
    for s in (-1, 1):  # prayer hands, pressed palm to palm
        o = box(M["wax"], s * .045 - .022, s * .045 + .022, -.4, -.31, 1.68, 1.9, .008, SEED + s)
        xform(o, Matrix.Translation(bow((0, -.35, 1.68))) @ Matrix.Rotation(math.radians(-15), 4, "X") @ Matrix.Translation(Vector(bow((0, -.35, 1.68))) * -1))
    # dried-blood sash: left shoulder over the chest to the right hip, a tail hanging
    def sash(u, v):
        z = 1.98 - u * .75; th = -math.pi / 2 + (-.9 + 1.9 * u) + (v - .5) * .5
        return bow(robe_pt(th, z + (v - .5) * .05, .045))
    sheet(sash, 18, 3, M["sash"], "sash")
    def tail(u, v):
        th = .25 - math.pi / 2 + 1.0 + (v - .5) * .3; z = 1.23 - u * .55
        x, y, z = robe_pt(th, z, .05 + u * .03); return (x, y, z)
    sheet(tail, 8, 2, M["sash"], "tail")
# ---- stub candles melted into shoulders and plinth
for s in (-1, 1):
    for k in range(5):
        th = (0 if s > 0 else math.pi) + R.uniform(-.75, .75); q = R.uniform(.23, .35)
        z = 2.1 - (q - .2) / .18 * .14 - .015
        p = bow((q * math.cos(th), q * .8 * math.sin(th), z))
        candle(M, p, R.uniform(.05, .13), R.uniform(.022, .032), R.random() > .15, SEED * 100 + s * 10 + k)
    puddle(M["wax"], *bow((s * .3, 0, 2.02))[:2], bow((s * .3, 0, 2.0))[2], .1, SEED + s, .03)
for k in range(16):
    a = k / 16 * 6.283 + R.uniform(-.15, .15); rr = R.uniform(.47, .53)
    x, y = math.cos(a) * rr * 1.0, math.sin(a) * rr * .92
    x = max(-.5, min(.5, x)); y = max(-.46, min(.46, y))
    candle(M, (x, y, PZ - .005), R.uniform(.04, .2), R.uniform(.025, .04), R.random() > .2, SEED * 200 + k)
puddle(M["wax"], 0, 0, PZ - .01, .58, SEED, .03, 20)
# wax curtains over the plinth edges down to a ground pool
for k in range(9):
    side = R.choice([(-1, 0), (1, 0), (0, -1), (0, 1)]); t = R.uniform(-.4, .4)
    x, y = (side[0] * .56, t) if side[0] else (t, side[1] * .51)
    L = R.uniform(.25, .62); ex, ey = side[0] * .02, side[1] * .02
    drip(M["wax"] if k % 2 else M["amber"], [(x - ex, y - ey, PZ + .02), (x + ex, y + ey, PZ - .04), (x + ex * 1.3, y + ey * 1.3, PZ - L * .5), (x + ex * 1.5, y + ey * 1.5, PZ - L)], R.uniform(.025, .045))
    if L > .5: puddle(M["amber"], x + side[0] * .12, y + side[1] * .12, 0, .14, k, .015)
ship(f"wax-saint-{V}", (0, 0, 1.4), 6.2, [(.8, -1.2, 2.4)])
