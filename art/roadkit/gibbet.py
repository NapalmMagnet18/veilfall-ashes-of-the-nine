import sys; sys.path.insert(0, "art/roadkit")
from common import *
reset()
M = mats({"stone": "stone", "wood": "wood", "iron": "iron", "wax": "wax", "glow": "glow", "soot": "soot"})
R = random.Random(7)
# base stones
for i in range(8):
    a = i / 8 * 6.283 + R.uniform(-.3, .3); r = R.uniform(.3, .55)
    o = prim("ico", M["stone"], loc=(math.cos(a) * r, math.sin(a) * r, .06), scl=(R.uniform(.16, .28), R.uniform(.13, .22), R.uniform(.09, .17)), subdivisions=2)
    jitter(o, .035, 4, i)
# crooked oak post
def spine(z): return Vector((.07 * math.sin(z * 1.3) + .06 * z / 3.4, .05 * math.sin(z * 2.1 + 1), z))
zs = [i * 3.4 / 16 for i in range(17)]
post = tube([spine(z) for z in zs], [.17 - .045 * z / 3.4 + .015 * math.sin(z * 7) for z in zs], 10, M["wood"])
jitter(post, .018, 5, 3)
for zb in (.35, 2.55, 3.15):  # iron bands
    c = spine(zb); prim("torus", M["iron"], loc=c, major_radius=.165 - .045 * zb / 3.4, minor_radius=.018, major_segments=12, minor_segments=4)
top = spine(3.15); tip = Vector((1.15, 0, 3.2))
tube([top, (top + tip) / 2 + Vector((0, 0, .03)), tip, tip + Vector((.06, 0, -.03)), tip + Vector((.07, 0, -.1))], .035, 4, M["iron"])  # arm, curled tip
tube([spine(2.55), Vector((.62, 0, 3.17))], .025, 4, M["iron"])  # brace
prim("cone", M["iron"], loc=spine(3.4) + Vector((0, 0, .06)), vertices=6, radius1=.15, depth=.14)  # iron cap
# chain arm -> cage
chain([tip + Vector((.0, 0, -.06)), Vector((1.1, 0, 2.38))], M["iron"])
# cage
C = Vector((1.1, 0, 0)); zb, zt, rc = 1.15, 2.15, .38
prim("cyl", M["iron"], loc=C + Vector((0, 0, zb)), vertices=12, radius=rc, depth=.03)
NB = 12; door = {8, 9, 10}  # facing roughly -Y
def ring_pts(z, skip):
    pts = []
    for k in range(0, NB * 4 + 1):
        idx = (k // 4) % NB
        if idx in skip and k % 4 != 0 or (k // 4) in skip and (k // 4) < NB: continue
        a = k / (NB * 4) * 6.283; pts.append(C + Vector((math.cos(a) * rc, math.sin(a) * rc, z)))
    return pts
# rings with a gap at the door
def arc(z, a0, a1, n=30):
    return [C + Vector((math.cos(a0 + (a1 - a0) * i / n) * rc, math.sin(a0 + (a1 - a0) * i / n) * rc, z)) for i in range(n + 1)]
ga0 = 8 / NB * 6.283 - .1; ga1 = 10 / NB * 6.283 + .1
for z in (zb + .02, 1.65, zt):
    tube(arc(z, ga1, ga0 + 6.283), .014, 4, M["iron"], cap=True)
for k in range(NB):
    a = k / NB * 6.283
    if k in door: continue
    base = C + Vector((math.cos(a) * rc, math.sin(a) * rc, zb))
    pts = [base + Vector((0, 0, h)) for h in (0, .5, 1.0)]
    for t in (.33, .66, 1.0):  # dome
        rr = rc * math.cos(t * 1.45); pts.append(C + Vector((math.cos(a) * rr, math.sin(a) * rr, zt + .3 * math.sin(t * 1.45))))
    tube(pts, .012, 4, M["iron"], cap=False)
prim("torus", M["iron"], loc=C + Vector((0, 0, 2.43)), major_radius=.035, minor_radius=.01, major_segments=8, minor_segments=4)
# broken door, swung out and sagging off one hinge
hinge = C + Vector((math.cos(ga0) * rc, math.sin(ga0) * rc, 1.65))
D = Matrix.Translation(hinge) @ Matrix.Rotation(math.radians(-80), 4, "Z") @ Matrix.Rotation(math.radians(9), 4, "Y") @ Matrix.Translation(-hinge)
dbars = []
for k in door:
    a = k / NB * 6.283; p = C + Vector((math.cos(a) * rc, math.sin(a) * rc, 0))
    dbars.append(tube([p + Vector((0, 0, zb + .06)), p + Vector((0, 0, zt - .02))], .012, 4, M["iron"]))
for z in (zb + .1, 1.65, zt - .05):
    dbars.append(tube(arc(z, ga0, ga1, 8), .013, 4, M["iron"]))
for o in dbars: xform(o, D)
# slumped wax husk on the cage floor
hz = zb + .02
torso = prim("sph", M["wax"], loc=(0, 0, 0), segments=12, ring_count=8, radius=1)
xform(torso, Matrix.Translation(C + Vector((.08, .1, hz + .22))) @ Matrix.Rotation(math.radians(-28), 4, "X") @ Matrix.Diagonal((.16, .12, .24, 1)))
jitter(torso, .03, 6, 5, (1, 1, 1.5))
head = prim("sph", M["wax"], loc=C + Vector((.06, -.06, hz + .44)), segments=10, ring_count=6, radius=.095)
jitter(head, .02, 9, 6)
for s in (-1, 1):  # legs folded forward, an arm slack through the door
    hip = C + Vector((.08 + s * .08, .06, hz + .06))
    tube([hip, hip + Vector((s * .05, -.22, .14)), hip + Vector((s * .08, -.34, .02))], [.055, .05, .04], 7, M["wax"])
sh = C + Vector((.0, -.02, hz + .36))
tube([sh, sh + Vector((-.12, -.18, -.1)), sh + Vector((-.22, -.38, -.3)), sh + Vector((-.24, -.46, -.5))], [.04, .035, .03, .02], 6, M["wax"])
tube([sh + Vector((.18, 0, 0)), sh + Vector((.24, -.1, -.18)), sh + Vector((.22, -.18, -.3))], [.04, .035, .03], 6, M["wax"])
# wax drips under the cage and a pool on the ground
for i in range(9):
    a = R.uniform(0, 6.283); r = R.uniform(.05, rc - .02); p = C + Vector((math.cos(a) * r, math.sin(a) * r, zb - .015))
    L = R.uniform(.08, .35); tube([p, p + Vector((0, 0, -L * .6)), p + Vector((0, 0, -L))], [.018, .012, .001], 5, M["wax"])
pool = prim("cyl", M["wax"], loc=C + Vector((0, 0, .01)), vertices=16, radius=.32, depth=.02)
for v in pool.data.vertices:
    v.co.xy = C.xy + (v.co.xy - C.xy) * (1 + .35 * mnoise.noise(Vector((v.co.x * 5, v.co.y * 5, 0))))
for i, (dx, dy) in enumerate(((.22, -.12), (-.2, -.15), (.15, .22))):
    candle(M, (C.x + dx, C.y + dy, zb + .015), .05 + i * .02, .025, True, i)
# chain wrapped round the post, end dangling
hel = []
for i in range(60):
    t = i / 59; z = .7 + t * .8; c = spine(z); a = t * 3 * 6.283; r = .17 - .045 * z / 3.4 + .02
    hel.append(c + Vector((math.cos(a) * r, math.sin(a) * r, 0)))
end = hel[-1]
hel += [end + Vector((.08, -.05, -.25)), end + Vector((.12, -.08, -.7)), Vector((end.x + .22, end.y - .1, .03)), Vector((end.x + .45, end.y - .25, .03))]
chain(hel, M["iron"], link_len=.06, r=.02, wire=.006)
finish("gibbet")
print("FILES", proof("gibbet", (.5, 0, 1.5), 7.5, [(1.1, -.7, 1.6)]))
