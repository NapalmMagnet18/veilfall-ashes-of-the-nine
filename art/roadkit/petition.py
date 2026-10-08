# the wax-sealed petition: a rolled parchment lying on the ground, names on the loose end, red cord, blood-red seal
import sys; sys.path.insert(0, "art/roadkit")
import common
from common import *
_tex = common.tex
RES = {"parchment": 1024, "seal": 512}
common.tex = lambda kind, seed, n=256: _tex(kind, seed, RES.get(kind, n))
KINDS["ink"] = ("#100a08", "#2b1913", .55, 0, 1)
KINDS["cord"] = ("#3a0d0c", "#8e2c25", .92, 0, 3)
reset()
M = mats({"parchment": "parchment", "ink": "ink", "cord": "cord", "wax_seal": "seal"})
R = random.Random(9)
N = lambda *p: mnoise.noise(Vector(p))
L, RC = .42, .04
TH = 2 * math.pi * 2.5; US = .82; TL = .14
def tongue_z(t): return .0012 + .007 * t ** 2.6
def roll(u, v):
    if u <= US:
        th = TH * (u / US) ** .8
        r = .010 + .030 * th / TH + .0008 * N(u * 9, v * 4, 1)
        ph = -math.pi / 2 + (TH - th)
        y, z = math.cos(ph) * r, RC + math.sin(ph) * r
        shift = .005 * math.sin(th * .37)          # inner turns telescope a little
    else:
        t = (u - US) / (1 - US)
        y, z = -TL * t, tongue_z(t) + .0012 * math.sin(v * 17 + t * 5) * t
        shift = 0
    xl = -L / 2 + shift + .005 * N(u * 23, 0, 3) + .003 * N(u * 71, 0, 4)
    xr = L / 2 + shift + .005 * N(u * 23, 0, 5) + .003 * N(u * 71, 0, 6)
    x = xl + (xr - xl) * v
    if u > US:
        t = (u - US) / (1 - US)
        y += (.010 * N(x * 40, 0, 7) + .004 * N(x * 160, 0, 8)) * t ** 5   # torn leading edge
    return (x, y, z)
sheet(roll, 140, 28, M["parchment"], "roll")
# ink names on the loose end
bm = bmesh.new()
for j in range(6):
    t = .16 + j * .13
    x = -.175 + R.uniform(0, .02)
    while x < .16:
        w = R.uniform(.012, .042); hgt = R.uniform(.0028, .0042)
        if x + w > .175: break
        y0 = -TL * t + R.uniform(-.001, .001); z0 = tongue_z(t) + .0012 * math.sin(R.random() * 17 + t * 5) * t + .0012
        q = [bm.verts.new(p) for p in ((x, y0 - hgt / 2, z0), (x + w, y0 - hgt / 2 + R.uniform(-.0006, .0006), z0), (x + w, y0 + hgt / 2, z0), (x, y0 + hgt / 2, z0))]
        bm.faces.new(q); x += w + R.uniform(.005, .011)
    if j in (2, 4):  # a struck-through name
        y0 = -TL * t; z0 = tongue_z(t) + .0016
        q = [bm.verts.new(p) for p in ((-.06, y0 - .0007, z0), (.05, y0 - .0007, z0), (.05, y0 + .0007, z0), (-.06, y0 + .0007, z0))]
        bm.faces.new(q)
me = bpy.data.meshes.new("ink"); bm.to_mesh(me); bm.free(); link(me, "ink", M["ink"])
# cord: two side wraps and a centre wrap under the seal, its tails trailing to the ground and fraying
CR = .0435
def wrap(x0, seed):
    pts = [Vector((x0 + .003 * math.sin(a * 2 + seed), math.cos(a) * CR, RC + math.sin(a) * CR * (.97 if math.sin(a) < 0 else 1))) for a in [k / 24 * 6.283 for k in range(25)]]
    tube(pts, .0042, 6, M["cord"], cap=False)
for x0, s in ((-.135, 1), (.128, 2), (0, 3)): wrap(x0, s)
SA = math.radians(-50)                         # seal direction: up and toward -Y
nrm = Vector((0, math.cos(SA + math.pi), 0)); nrm = Vector((0, -math.sin(math.radians(40)), math.cos(math.radians(40))))
P = Vector((0, 0, RC)) + nrm * (CR + .001)
for side, s in ((-1, 4), (1, 5)):              # tails
    a = P + Vector((side * .02, -.004, -.004))
    pts = [a, a + Vector((side * .02, -.02, -.018)), a + Vector((side * .035, -.045, -.045)), Vector((a.x + side * .05, a.y - .07, .006)), Vector((a.x + side * .07, a.y - .1, .004))]
    tube(pts, [.0042, .0041, .004, .0038, .0035], 6, M["cord"])
    e = pts[-1]
    for k in range(5):                          # frayed strands
        d = Vector((side * R.uniform(.004, .02), R.uniform(-.03, -.015), 0))
        tube([e, e + d * .5 + Vector((0, 0, .001)), e + d + Vector((R.uniform(-.004, .004), 0, -.001))], [.0013, .001, .0005], 4, M["cord"])
# the seal: a fat lumpy blood-red disc stamped with a nine-pointed star around a lantern
q = Vector((0, 0, 1)).rotation_difference(nrm).to_matrix().to_4x4()
MS = Matrix.Translation(P) @ q @ Matrix.Rotation(math.radians(8), 4, "Z")
parts = []
blob = prim("cyl", M["wax_seal"], loc=(0, 0, .007), vertices=32, radius=.031, depth=.014)
for v in blob.data.vertices:
    rr = math.hypot(v.co.x, v.co.y)
    if rr > .02:
        a = math.atan2(v.co.y, v.co.x); k = 1 + .14 * N(math.cos(a) * 2, math.sin(a) * 2, 11) + .06 * N(math.cos(a) * 6, math.sin(a) * 6, 12)
        v.co.x *= k; v.co.y *= k
        if v.co.z > .01: v.co.x *= .93; v.co.y *= .93; v.co.z -= .002   # rounded shoulder
parts.append(blob)
pud = prim("cyl", M["wax_seal"], loc=(0, 0, .002), vertices=32, radius=.036, depth=.004)   # squeezed-out skirt
for v in pud.data.vertices:
    a = math.atan2(v.co.y, v.co.x); k = 1 + .22 * N(math.cos(a) * 3, math.sin(a) * 3, 13); v.co.x *= k; v.co.y *= k
parts.append(pud)
parts.append(prim("torus", M["wax_seal"], loc=(0, 0, .0135), major_radius=.025, minor_radius=.0022, major_segments=36, minor_segments=5))
star = [((.0205 if i % 2 == 0 else .011) * math.cos(i / 18 * 6.2832 + math.pi / 2), (.0205 if i % 2 == 0 else .011) * math.sin(i / 18 * 6.2832 + math.pi / 2)) for i in range(18)]
st = slab(star, .0022, M["wax_seal"], "star"); xform(st, Matrix.Translation((0, 0, .0125))); parts.append(st)
lan = [(-.0035, -.006), (.0035, -.006), (.0052, -.0035), (.0052, .0035), (.003, .0058), (-.003, .0058), (-.0052, .0035), (-.0052, -.0035)]
ln = slab(lan, .002, M["wax_seal"], "lantern"); xform(ln, Matrix.Translation((0, -.0005, .0145))); parts.append(ln)
parts.append(prim("cube", M["wax_seal"], loc=(0, .0063, .0155), scl=(.0045, .0012, .0012)))                     # cap
parts.append(prim("torus", M["wax_seal"], loc=(0, .0088, .0155), rot=(math.pi / 2, 0, 0), major_radius=.0022, minor_radius=.0007, major_segments=10, minor_segments=4))  # hoop
for o in parts: jitter(o, .0006, 300, R.randint(0, 99)); xform(o, MS)
# a drip run off the seal down the roll
for s, ang in ((0, 25), (1, -15)):
    a = P + Vector((math.sin(math.radians(ang)) * .028, -.012, -.012))
    tube([a, a + Vector((0, -.008, -.012)), a + Vector((0, -.013, -.024))], [.0045, .0035, .0028], 6, M["wax_seal"])
# loose curl of extra parchment behind the roll
def curl(u, v):
    a = -math.pi / 2 + u * 4.2; r = .019 - .006 * u
    x = -.05 + .1 * v + .004 * N(u * 9, 0, 21)
    if u < .25: y, z = -.06 * (.25 - u) / .25, .0008
    else: y, z = math.cos(a + math.pi / 2) * -r * 0 + math.sin(a - (-math.pi / 2)) * r * .0 , 0
    a2 = (u - .25) / .75 * 4.0 if u >= .25 else 0
    if u >= .25: y, z = math.sin(a2) * .018, .018 - math.cos(a2) * .018 + .0008
    if u < .03 or u > .97: x += .004 * N(v * 30, 0, 22)
    return (x, y, z)
c = sheet(curl, 40, 10, M["parchment"], "curl")
xform(c, Matrix.Translation((.11, .085, 0)) @ Matrix.Rotation(math.radians(-28), 4, "Z"))
# wax drops beneath
for i, (dx, dy, r) in enumerate(((.035, -.075, .008), (-.05, -.16, .006), (.09, -.15, .0095), (-.02, .06, .007), (.15, -.04, .005))):
    d = prim("sph", M["wax_seal"], loc=(dx, dy, .0), segments=10, ring_count=6, radius=1)
    xform(d, Matrix.Translation((dx, dy, 0)) @ Matrix.Diagonal((r * R.uniform(.9, 1.3), r, r * .35, 1)) @ Matrix.Translation((-dx, -dy, 0)))
    jitter(d, r * .15, 200, i)
o = finish("petition", tile=.35)
bpy.ops.export_scene.gltf(filepath=f"{OUT}/petition.glb", export_format="GLB", use_selection=True, export_apply=True, export_image_format="JPEG")
bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
print("EXT", [round(max(p[i] for p in bb) - min(p[i] for p in bb), 3) for i in range(3)])
print("FILES", proof("petition", (0, -.04, .03), .95, [(.35, -.45, .45)]))
