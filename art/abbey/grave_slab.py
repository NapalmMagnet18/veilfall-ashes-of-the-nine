# Abbey graves. argv after --: lancet | waxcap | broken | ledger. Front faces Blender -Y (glTF +z).
import sys; sys.path.insert(0, "art/abbey")
from saintkit import *
V = sys.argv[sys.argv.index("--") + 1]
SEED = {"lancet": 5, "waxcap": 6, "broken": 7, "ledger": 8}[V]
reset(); M = abbey_mats(); R = random.Random(SEED * 17)
T = .15  # stone thickness

def stand(poly, name):
    """poly in (x, z); extrude through y around 0"""
    o = slab(poly, T, M["stone"], name)
    xform(o, Matrix.Translation((0, T / 2, 0)) @ Matrix.Rotation(math.pi / 2, 4, "X"))
    jitter(o, .012, 4, SEED); return o
def arc(cx, cz, r, a0, a1, n):
    return [(cx + r * math.cos(a0 + (a1 - a0) * i / n), cz + r * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]
def crackline(pts, w=.006):
    tube([(x, -T / 2 - .004, z) for x, z in pts], w, 4, M["soot"])
def base():
    foundation(M["stone"], .36, .2)
    box(M["stone"], -.45, .45, -.2, .2, 0, .17, .012, SEED)
def cross(cz, h=.42, w=.26):
    box(M["stone"], -.035, .035, -T / 2 - .03, -T / 2 + .01, cz - h / 2, cz + h / 2, .004, SEED)
    box(M["stone"], -w / 2, w / 2, -T / 2 - .03, -T / 2 + .01, cz + h * .12, cz + h * .12 + .07, .004, SEED + 1)

if V == "lancet":
    base(); W = .34; S = 1.05
    poly = [(-W, .15), (W, .15), (W, S)] + arc(-W, S, 2 * W, 0, math.pi / 3, 8)[1:] + arc(W, S, 2 * W, math.pi * 2 / 3, math.pi, 8)[1:]
    stand(poly, "lancet")
    cross(1.05); glyphs(M, 0, -T / 2 - .002, .7, 4, .46, SEED)
    crackline([(.34, 1.0), (.2, .93), (.16, .8), (.05, .72), (.08, .6)])
    for k in range(4): candle(M, (R.uniform(-.38, .38), -.14, .17), R.uniform(.05, .14), .028, k != 2, SEED * 10 + k)
    puddle(M["wax"], 0, -.13, .165, .14, SEED, .02)
elif V == "waxcap":
    base(); W = .36; S = .95
    stand([(-W, .15), (W, .15)] + arc(0, S, W, 0, math.pi, 14)[0:] , "round")
    glyphs(M, 0, -T / 2 - .002, .82, 5, .5, SEED)
    # a cap of wax poured on the crown, hardened in runs down both faces
    cap = lathe(lambda th, t: ((W + .03) * math.cos(th * .5) * (1 - t * .02), (T / 2 + .03) * math.sin(th) , S + (W + .03) * math.sin(th * .5) * (1 - t) - .0), 24, 2, M["wax"], "capx", cap_bot=False)
    bpy.data.objects.remove(cap)
    def crown(u, v):
        a = u * math.pi; r = W + .025
        y = (v - .5) * (T + .05)
        return (r * math.cos(a), y, S + r * math.sin(a) + .02 * math.sin(v * math.pi))
    sheet(crown, 16, 4, M["wax"], "crown")
    for k in range(10):
        a = R.uniform(.25, 2.9); side = -1 if k % 2 else 1
        x, z = (W + .02) * math.cos(a), S + (W + .02) * math.sin(a); L = R.uniform(.2, .6)
        drip(M["wax"] if L < .4 else M["amber"], [(x, side * (T / 2 + .012), z), (x * .98, side * (T / 2 + .012), z - L * .5), (x * .97, side * (T / 2 + .01), z - L)], R.uniform(.015, .028))
    for k in range(5):
        a = .35 + k * .6; candle(M, ((W - .03) * math.cos(a), R.uniform(-.03, .03), S + (W - .03) * math.sin(a) - .01), R.uniform(.06, .13), .026, True, SEED * 10 + k)
elif V == "broken":
    base(); W = .33
    top = [(W, .78), (.2, .9), (.11, .83), (.02, 1.0), (-.08, .92), (-.2, 1.06), (-W, .98)]
    stand([(-W, .15), (W, .15)] + top, "stump")
    glyphs(M, 0, -T / 2 - .002, .62, 3, .44, SEED)
    # the snapped crown lying face-up in front
    piece = slab([(-W, 0), (W, 0), (W, .3)] + arc(0, .3, W, 0, math.pi, 10)[1:], T, M["stone"], "crown")
    jitter(piece, .01, 4, SEED + 3)
    xform(piece, Matrix.Translation((.15, -.75, .0)) @ Matrix.Rotation(math.radians(24), 4, "Z") @ Matrix.Rotation(math.radians(4), 4, "X"))
    for k in range(5): box(M["stone"], *(lambda x, y: (x, x + .07, y, y + .06, 0, .05))(R.uniform(-.5, .4), R.uniform(-.6, -.25)), .01, SEED + k)
    candle(M, (-.2, -.5, 0), .08, .03, True, SEED * 10)
else:  # ledger: flat lid on a low chest, cracked in three, one shard sunk
    foundation(M["stone"], 1.05, .5)
    box(M["stone"], -1.08, 1.08, -.52, .52, 0, .22, .015, SEED)
    cr1 = [(-.35 + R.uniform(-.06, .06), -.45 + .9 * i / 6) for i in range(7)]
    cr2 = [(.3 + .9 * i / 5 * .5 + R.uniform(-.04, .04), -.45 + .9 * i / 5) for i in range(6)]
    pieces = [[(-1.0, -.45)] + cr1 + [(-1.0, .45)],
              list(reversed(cr1)) + [(cr2[0][0], -.45)] + cr2 + [(cr1[-1][0], .45)][:0],
              [(cr2[0][0], -.45), (1.0, -.45), (1.0, .45)] + list(reversed(cr2))[:-1]]
    pieces[1] = [(cr1[0][0], -.45), (cr2[0][0], -.45)] + cr2[1:] + list(reversed(cr1))[:-1]
    for i, poly in enumerate(pieces):
        o = slab(poly, .16, M["stone"], f"lid{i}"); jitter(o, .01, 5, SEED + i)
        if i == 1: xform(o, Matrix.Translation((0, 0, .2)) @ Matrix.Rotation(math.radians(-4), 4, "Y") @ Matrix.Translation((0, 0, -.03)))
        elif i == 2: xform(o, Matrix.Translation((.03, .02, .22)) @ Matrix.Rotation(math.radians(2), 4, "X") @ Matrix.Rotation(math.radians(-2), 4, "Z"))
        else: xform(o, Matrix.Translation((-.015, 0, .22)))
    # carved border and a worn ring of nine on the lid
    for (x0, x1, y0, y1) in [(-.92, -.45, -.39, -.37), (-.92, -.45, .37, .39), (-.94, -.92, -.38, .38)]:
        box(M["soot"], x0, x1, y0, y1, .375, .385)
    glyphs(M, -.68, 0, .38, 1, .4, SEED)
    for k in range(9):
        a = k / 9 * 6.283
        if k != 4: prim("ico", M["stone"], loc=(.65 + math.cos(a) * .17, math.sin(a) * .17, .385), subdivisions=1, radius=.025)
    for k in range(6): candle(M, (R.uniform(-.9, .9), R.choice([-.44, .44]) * R.uniform(.7, 1), .37), R.uniform(.04, .12), .03, k % 3 != 0, SEED * 10 + k)
    puddle(M["wax"], .1, .1, .37, .22, SEED, .02)
    for k in range(4):
        x = R.uniform(-.9, .9)
        drip(M["amber"], [(x, -.47, .38), (x, -.54, .3), (x, -.545, .12), (x, -.55, .02)], .025)
ship(f"grave-{V}", (0, 0, .5), 4.2, [(.5, -1.2, 1.6)])
