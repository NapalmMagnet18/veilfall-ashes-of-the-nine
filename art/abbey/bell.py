# The Ninth Bell: cracked bronze bell (the ninth lantern glowing inside), charred oak gallows, octagonal dais.
# Blender frame: Z up, origin at the dais foot centre. The crack faces Blender +Y (glTF -Z): the row is placed
# with forward "+z", which turns the model 180 deg, so the crack faces world +Z (south, toward the camera).
import sys; sys.path.insert(0, "art/abbey")
from kit import *
import kit
kit.FOUND = 0.0
reset() if callable(globals().get("reset")) else None
R = random.Random(9)
FRONT = math.pi / 2          # +Y in Blender = south in the world once forward "+z" turns it
M = materials(5)
n = 512
a, b, c = fnoise(n, 1.7, 61), fnoise(n, 1.1, 62), fnoise(n, 1.4, 63, aniso=8)
verd = np.clip((fnoise(n, 2.1, 64) * .6 + c * .4 - .5) * 3.2, 0, 1)
col = lerp3(hexc("#14100c"), hexc("#4a3420"), .55 * a + .45 * b)
col = lerp3(col, hexc("#3b7466"), verd * .9); col = lerp3(col, hexc("#6d9e8a"), np.clip(verd - .6, 0, 1) * 1.2)
M["bellbronze"] = kit._wire("bellbronze", col, .5 * a + .3 * c + .2 * verd, np.clip(.32 + verd * .55, 0, 1), .7, 2.5)
g = fnoise(n, 1.5, 71)
M["gilt"] = kit._wire("gilt", lerp3(hexc("#6b4a22"), hexc("#c49c63"), g), g, np.clip(.28 + g * .25, 0, 1), .9, 1.5)
z16 = np.zeros((16, 16, 3), np.float32); h16 = np.zeros((16, 16), np.float32)
M["bellglow"] = kit._wire("bellglow", z16 + hexc("#ffb35a"), h16, .4, 0, 0, emit=(1.0, .62, .25), emit_s=4)
c2, h2 = tex("wood", 81, 512); M["oak"] = kit._wire("oak", lerp3(c2, hexc("#120d0a"), .55), h2, .85, 0, 3)
w1 = fnoise(512, 1.5, 91); M["waxgrey"] = kit._wire("waxgrey", lerp3(hexc("#4e4a44"), hexc("#a49c8a"), w1), w1, .42, 0, 1.2)
kit.TILE.update({"bellbronze": 1.4, "gilt": .8, "oak": 1.0, "waxgrey": 1.0})

def lathe(prof, segs, mat, closed=False, caps=False, phase=0.0, name="lathe"):
    bm = bmesh.new(); rings = []
    for r, z in prof:
        rings.append([bm.verts.new((r * math.cos(phase + 2 * math.pi * k / segs), r * math.sin(phase + 2 * math.pi * k / segs), z)) for k in range(segs)])
    m = len(rings)
    for i in range(m if closed else m - 1):
        A, B = rings[i], rings[(i + 1) % m]
        for k in range(segs): bm.faces.new((A[k], A[(k + 1) % segs], B[(k + 1) % segs], B[k]))
    if caps: bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); return link(me, name, mat)

def oak(a, b, w, mat, seed, jag=0.0, cuts=6, d=None):
    a, b = Vector(a), Vector(b); L = (b - a).length; rr = random.Random(seed); d = d or w
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    bmesh.ops.scale(bm, vec=(w, d, L), verts=bm.verts)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(w, d) * .12, segments=1, affect="EDGES")
    long_e = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > L * .5]
    bmesh.ops.subdivide_edges(bm, edges=long_e, cuts=cuts, use_grid_fill=True)
    off = Vector((seed * 3.1, seed * 1.7, 0))
    for v in bm.verts:
        t = v.co.z / L + .5
        v.co.x *= 1 - .06 * t + rr.uniform(-.03, .03); v.co.y *= 1 - .06 * t + rr.uniform(-.03, .03)
        v.co += mnoise.noise_vector(v.co * 3.5 + off) * min(w, d) * .07
        if jag and v.co.z > L / 2 - .01: v.co.z -= rr.uniform(0, jag); v.co.x *= rr.uniform(.45, 1)
    me = bpy.data.meshes.new("oak"); bm.to_mesh(me); bm.free(); o = link(me, "oak", mat)
    q = Vector((0, 0, 1)).rotation_difference((b - a).normalized())
    xform(o, Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4()); return o

def strap(a, b, at, w, d=None, seed=0):
    """an iron band wrapping the beam a→b at fraction at, with two bolt heads"""
    a, b = Vector(a), Vector(b); p = a.lerp(b, at); dirv = (b - a).normalized(); d = d or w
    o = prim("cube", M["iron"], scl=(w / 2 + .03, d / 2 + .03, .07)); q = Vector((0, 0, 1)).rotation_difference(dirv)
    xform(o, Matrix.Translation(p) @ q.to_matrix().to_4x4())
    for s in (-1, 1):
        bo = prim("cyl", M["iron"], vertices=6, radius=.035, depth=.05)
        xform(bo, Matrix.Translation(p) @ q.to_matrix().to_4x4() @ Matrix.Translation((s * w * .25, -(d / 2 + .05), 0)) @ Matrix.Rotation(math.pi / 2, 4, "X"))

# ---------- the dais: octagon, 9 m across the flats, 0.4 m high, cracked, one corner broken ----------
RA = 4.5 / math.cos(math.pi / 8)
dais = lathe([(RA, 0), (RA, .26), (RA - .06, .31), (RA - .2, .32), (RA - .2, .35), (RA - .27, .40)], 8, M["stone"], caps=True, phase=math.pi / 8, name="dais")
crack = []; x, y = 4.9, 1.0
pts = [(x, y)]
while x > .6:
    x -= R.uniform(.35, .6); y += R.uniform(-.3, .3); pts.append((x, y))
wl = [(px, py + .025 + .02 * (px / 5)) for px, py in pts]; wr = [(px, py - .025 - .02 * (px / 5)) for px, py in reversed(pts)]
bmc = bmesh.new(); vs = [bmc.verts.new((px, py, .3)) for px, py in wl + wr]; f = bmc.faces.new(vs)
r_ = bmesh.ops.extrude_face_region(bmc, geom=[f]); bmesh.ops.translate(bmc, verts=[e for e in r_["geom"] if isinstance(e, bmesh.types.BMVert)], vec=(0, 0, .3))
bmesh.ops.recalc_face_normals(bmc, faces=bmc.faces); me = bpy.data.meshes.new("cr"); bmc.to_mesh(me); bmc.free()
chip = prim("cube", M["sooted"], scl=(.6, .5, .4)); jitter(chip, .12, 2, 5)
xform(chip, Matrix.Translation((-RA * math.cos(math.pi / 8) * .98, -RA * math.sin(math.pi / 8) * 1.0, .45)) @ Matrix.Rotation(.5, 4, "Z"))
boolean(dais, [link(me, "cr", M["sooted"]), chip], transfer=True)
for k, (px, py) in enumerate(((-4.6, -1.6), (-4.8, -2.3), (-5.2, -1.2))):   # the broken corner's pieces
    s = prim("cube", M["stone"], scl=(.22, .18, .12)); jitter(s, .05, 3, 20 + k)
    xform(s, Matrix.Translation((px, py, .12)) @ Matrix.Rotation(R.uniform(0, 3), 4, "Z"))
# post plinths
for sx in (-1, 1):
    p = prim("cube", M["stone"], scl=(.48, .55, .2)); jitter(p, .02, 3, 30 + sx)
    xform(p, Matrix.Translation((sx * 3.3, 0, .58)))

# ---------- the gallows: two leaning charred oak posts, cross-beam, braces (one snapped), iron strapping ----------
FL, FR = Vector((-3.3, 0, .78)), Vector((3.3, 0, .78))
TL, TR = Vector((-2.85, .12, 8.25)), Vector((2.95, -.08, 8.2))
oak(FL, TL, .44, M["char"], 1, cuts=10); oak(FR, TR, .44, M["char"], 2, cuts=10)
BEAM_Z = 7.85
beamA, beamB = (-3.75, .02, BEAM_Z), (3.85, -.02, BEAM_Z - .05)
oak(Vector(beamA) + Vector((0, 0, 0)), Vector(beamB), .46, M["char"], 3, cuts=12, d=.5)
for at in (.08, .28, .62, .9):
    strap(FL, TL, at, .44, seed=int(at * 10)); strap(FR, TR, at, .44, seed=int(at * 10) + 7)
for at in (.07, .15, .85, .93): strap(beamA, beamB, at, .46, .5)
# corner plates where posts meet the beam
for T, s in ((TL, -1), (TR, 1)):
    pl = prim("cube", M["iron"], scl=(.55, .03, .5)); xform(pl, Matrix.Translation((T.x - s * .15, T.y - .27, BEAM_Z - .1)) @ Matrix.Rotation(s * .35, 4, "Y"))
# knee braces: left intact, right snapped with its broken half lying on the dais
oak(Vector((-3.0, .05, 6.0)), Vector((-1.55, .02, BEAM_Z - .22)), .26, M["oak"], 4, cuts=4)
strap((-3.0, .05, 6.0), (-1.55, .02, BEAM_Z - .22), .5, .26)
oak(Vector((3.1, -.06, 6.0)), Vector((2.45, -.04, 6.75)), .26, M["oak"], 5, jag=.28, cuts=3)
oak(Vector((1.62, -.02, BEAM_Z - .22)), Vector((1.95, -.03, 7.2)), .26, M["oak"], 6, jag=.25, cuts=2)
oak(Vector((2.1, 1.6, .54)), Vector((3.2, 2.5, .62)), .26, M["oak"], 7, jag=.3, cuts=3)
# raking struts front and back of each post
for sx, F, T in ((-1, FL, TL), (1, FR, TR)):
    top = F.lerp(T, .42)
    for sy in (-1, 1):
        foot = Vector((sx * 3.15, sy * 2.75, .4)); oak(foot, top + Vector((0, sy * .2, 0)), .26, M["oak"], 10 + sx * 3 + sy, cuts=5)
        sh = prim("cube", M["iron"], scl=(.18, .18, .07)); xform(sh, Matrix.Translation(foot + Vector((0, 0, .06))))
# headstock hanger: an iron stirrup around the beam's middle
for sx in (-1, 1):
    st = prim("cube", M["iron"], scl=(.04, .3, .34)); xform(st, Matrix.Translation((sx * .3, 0, BEAM_Z - .05)))
bar = prim("cube", M["iron"], scl=(.34, .3, .04)); xform(bar, Matrix.Translation((0, 0, BEAM_Z - .39)))

# ---------- the bell ----------
LIP = 3.3
OUT = [(1.60, 0.0), (1.63, .07), (1.61, .17), (1.52, .32), (1.40, .55), (1.27, .85), (1.15, 1.2), (1.06, 1.6), (1.0, 1.95), (.975, 2.25), (.955, 2.5), (.9, 2.69), (.76, 2.83), (.5, 2.92), (.2, 2.95), (.03, 2.96)]
INN = [(.03, 2.80), (.45, 2.77), (.68, 2.67), (.80, 2.5), (.83, 2.25), (.86, 1.95), (.91, 1.6), (1.0, 1.2), (1.12, .85), (1.26, .55), (1.37, .32), (1.44, .16), (1.46, .04), (1.46, 0.0)]
def r_out(z):
    for (r0, z0), (r1, z1) in zip(OUT, OUT[1:]):
        if z0 <= z <= z1: return r0 + (r1 - r0) * (z - z0) / max(z1 - z0, 1e-6)
    return OUT[-1][0]
bell = lathe([(p[0], p[1] + LIP) for p in OUT + INN], 96, M["bellbronze"], closed=True, name="bell")
def crack_cutter():
    """a jagged split up the front from the lip, tapering shut at the waist; a branch forks left"""
    rr = random.Random(77); ptsL, ptsR = [], []; x = .05; zz = -.15
    while zz < 2.15:
        t = max(zz, 0) / 2.15; w = .13 * (1 - t) ** 1.2 + .006
        ptsL.append((x - w, zz)); ptsR.append((x + w, zz)); zz += rr.uniform(.12, .22); x += rr.uniform(-.09, .09)
    poly = ptsL + [(x, 2.25)] + list(reversed(ptsR))
    o1 = prism_xz([(px, pz + LIP) for px, pz in poly], .5, 2.0, M["bellglow"], "crack")
    br = [(.0, .75), (-.12, .95), (-.2, 1.1), (-.33, 1.22), (-.42, 1.4), (-.40, 1.42), (-.30, 1.24), (-.17, 1.13), (-.08, .97), (.03, .8)]
    o2 = prism_xz([(px, pz + LIP) for px, pz in br], .5, 2.0, M["bellglow"], "crack2")
    return [o1, o2]
def face_front(o):   # rotate a cutter built facing +Y onto the crack's bearing
    return o
boolean(bell, crack_cutter(), transfer=True)
gi = list(bell.data.materials).index(M["bellglow"]) if M["bellglow"].name in [m.name for m in bell.data.materials] else None
if gi is None: bell.data.materials.append(M["bellglow"]); gi = len(bell.data.materials) - 1
bell.data.materials.append(M["gilt"]); gil = len(bell.data.materials) - 1
for p in bell.data.polygons:
    cxy = Vector((p.center.x, p.center.y, 0)); z = p.center.z - LIP
    if cxy.length > 1e-3 and p.normal.dot(cxy.normalized()) < -.25 and z < 2.79: p.material_index = gi   # the lit inside
    elif p.material_index != gi and z < .9 and p.normal.dot(cxy.normalized()) > .3:
        ang = math.atan2(p.center.y, p.center.x)
        if mnoise.noise(Vector((p.center.x * 1.6, p.center.y * 1.6, p.center.z * 2.2))) > .18 or abs(ang - FRONT) < .5 and z < .25: p.material_index = gil  # worn by hands
# relief bands (gilt beads on the bronze), cut by the same crack
for zb, hh, mat in ((.22, .05, M["gilt"]), (1.52, .045, M["bellbronze"]), (2.18, .045, M["bellbronze"]), (2.6, .035, M["gilt"])):
    rb = r_out(zb)
    band = lathe([(r_out(zb - hh) - .02, zb - hh + LIP), (rb + .02, zb - hh * .8 + LIP), (rb + .035, zb + LIP), (rb + .02, zb + hh * .8 + LIP), (r_out(zb + hh) - .02, zb + hh + LIP)], 96, mat, closed=True, name="band")
    boolean(band, crack_cutter(), transfer=True)
# nine lantern glyphs in the band between 1.52 and 2.18: eight scorched, the ninth (front-left of the crack) bright
GLY = [(-.055, 0), (.055, 0), (.055, .03), (.085, .06), (.085, .22), (.05, .26), (.1, .275), (0, .36), (-.1, .275), (-.05, .26), (-.085, .22), (-.085, .06), (-.055, .03)]
PAN = [(-.15, -.04)] + [(.15 * math.cos(t), .3 + .2 * math.sin(t)) for t in np.linspace(0, math.pi, 9)][:0] + [(.15, -.04), (.15, .3), (.1, .42), (0, .48), (-.1, .42), (-.15, .3)]
def wrap(poly, th, zc, d0, d1, mat, name):
    o = prism_xz(poly, d0, d1, mat, name)
    for v in o.data.vertices:
        u, dd, vv = v.co.x, v.co.y, v.co.z; z = zc + vv; rad = r_out(z) + dd; th2 = th + u / r_out(zc)
        v.co = Vector((rad * math.cos(th2), rad * math.sin(th2), z + LIP))
    return o
for i in range(9):
    th = FRONT - math.radians(22) + i * 2 * math.pi / 9
    wrap(PAN, th, 1.6, -.02, .018, M["bellbronze"], "panel")
    wrap(GLY, th, 1.66, .0, .05, M["bellglow"] if i == 0 else M["char"], "glyph")
# crown: boss, two crossed canon loops, the hanging ring
boss = lathe([(.42, LIP + 2.9), (.44, LIP + 2.98), (.38, LIP + 3.06), (.2, LIP + 3.1)], 24, M["bellbronze"], caps=True, name="boss")
for ang in (0, math.pi / 2):
    arc = [Vector((.24 * math.cos(t) * math.cos(ang), .24 * math.cos(t) * math.sin(ang), LIP + 3.05 + .24 * math.sin(t))) for t in np.linspace(0, math.pi, 11)]
    tube(arc, .065, 8, M["bellbronze"], True, "canon")
ring = tube([Vector((0, .1 * math.cos(t), LIP + 3.36 + .1 * math.sin(t))) for t in np.linspace(0, 2 * math.pi, 13)], .03, 6, M["iron"], False, "ring")
# chain: crown ring to the stirrup
zc0, zc1 = LIP + 3.42, BEAM_Z - .43; nl = 6
for k in range(nl):
    zc = zc0 + (k + .5) * (zc1 - zc0) / nl; ang = (k % 2) * math.pi / 2
    lk = [Vector((.055 * math.cos(t) * math.cos(ang), .055 * math.cos(t) * math.sin(ang), zc + .1 * math.sin(t))) for t in np.linspace(0, 2 * math.pi, 13)]
    tube(lk, .022, 6, M["iron"], False, "link")
# clapper below the lip
tube([Vector((0, 0, LIP + 2.78)), Vector((0, 0, LIP - .2))], .055, 8, M["iron"], True, "rod")
lathe([(.06, LIP - .12), (.15, LIP - .2), (.19, LIP - .32), (.17, LIP - .44), (.08, LIP - .52)], 16, M["iron"], caps=True, name="clapper")
# wax: a soot-grey cap over the crown and ivory runs down the shoulders, frozen
metawax([("ELLIPSOID", (R.uniform(-.25, .25), R.uniform(-.25, .25), LIP + 2.92), R.uniform(.22, .32), (1.2, 1.0, .45)) for _ in range(9)], M["waxgrey"], .07, .4, "crownwax")
for k in range(14):
    th = k * 2 * math.pi / 14 + R.uniform(-.15, .15); zend = R.uniform(.3, 2.2) if k % 3 else R.uniform(-.05, .4)
    pts, rads = [], []; zz = 2.9
    while zz > zend:
        th += R.uniform(-.03, .03); rr0 = .03 + .015 * math.sin(zz * 9 + k)
        pts.append(Vector(((r_out(zz) + rr0 * .45) * math.cos(th), (r_out(zz) + rr0 * .45) * math.sin(th), zz + LIP))); rads.append(rr0); zz -= .13
    if len(pts) < 3: continue
    mat = M["wax"] if k % 2 else M["waxgrey"]
    tube(pts, rads, 6, mat, True, "run")
    e = pts[-1]; prim("sph", mat, loc=e - Vector((0, 0, .02)), segments=7, ring_count=5, radius=rads[-1] * 1.5)
    if zend < .05:   # it ran off the lip: a stalactite
        tip = [e, e + Vector((0, 0, -.12)), e + Vector((0, 0, -.26))]; tube(tip, [rads[-1] * 1.2, rads[-1] * .7, .004], 6, mat, True, "drop")

# ---------- wax on the dais: a pool fed from the crack, candle stubs gathered at the post feet ----------
metawax([("ELLIPSOID", (R.uniform(.8, 2.8), R.uniform(.3, 1.8), .41), R.uniform(.35, .6), (1.6, 1.1, .08)) for _ in range(8)], M["wax"], .09, .35, "pool")
metawax([("ELLIPSOID", (R.uniform(-1.2, 1.2), R.uniform(-.9, .9), .41), R.uniform(.3, .5), (1.3, 1.3, .07)) for _ in range(6)], M["waxgrey"], .09, .35, "pool2")
def candle(p, h, r, lit, seed):
    rr = random.Random(seed); m = M["wax"] if seed % 3 else M["waxgrey"]
    c = lathe([(r, p[2]), (r * 1.02, p[2] + h * .7), (r * .9, p[2] + h), (r * .55, p[2] + h - .015)], 8, m, caps=True, name="candle")
    jitter(c, r * .12, 6, seed)
    tube([Vector((p[0] + r * .8, p[1], p[2] + h)), Vector((p[0] + r * 1.05, p[1] + r * .2, p[2] + h * .5)), Vector((p[0] + r * 1.0, p[1] + r * .3, p[2] + .02))], [.012, .014, .02], 5, m, True, "cdrip")
    pool = prim("sph", m, loc=(p[0], p[1], p[2]), segments=10, ring_count=4, radius=1); xform(pool, Matrix.Translation(p) @ Matrix.Diagonal((r * 2.6, r * 2.3, .025, 1)))
    if lit:
        fl = lathe([(.001, p[2] + h + .005), (.016, p[2] + h + .03), (.012, p[2] + h + .06), (.001, p[2] + h + .095)], 6, M["glow"], caps=False, name="flame")
    return c
for sx in (-1, 1):
    for k in range(9):
        a_ = R.uniform(0, 2 * math.pi); d_ = R.uniform(.62, 1.1)
        candle((sx * 3.3 + d_ * math.cos(a_), d_ * math.sin(a_) * 1.1 + (.4 if sx > 0 else 0), .4 if abs(d_ * math.cos(a_)) > .5 or abs(d_ * math.sin(a_)) > .6 else .78), R.uniform(.06, .3), R.uniform(.04, .075), R.random() < .6, 100 + k + sx * 20)
for k in range(16):   # a crescent of stubs along the front lip of the dais, facing the crypt
    a_ = FRONT + R.uniform(-1.1, 1.1); d_ = R.uniform(3.6, 4.15)
    candle((d_ * math.cos(a_), d_ * math.sin(a_), .4), R.uniform(.05, .26), R.uniform(.035, .07), R.random() < .55, 200 + k)
for k in range(6):    # and a few on the floor at the dais foot
    a_ = FRONT + R.uniform(-.9, .9); d_ = R.uniform(4.9, 5.4)
    candle((d_ * math.cos(a_), d_ * math.sin(a_), 0), R.uniform(.05, .2), R.uniform(.04, .07), k % 2 == 0, 300 + k)

o = finish("ninth-bell")
print("FILES", proof("ninth-bell", (0, 0, 3.6), 21, [(0, 0, 4.6, 260), (2.5, 4.5, 1.2, 300), (-3, 3, 1, 200)],
      views=(("iso", 225, 52), ("front", 180, 10), ("close", 200, 25))))
