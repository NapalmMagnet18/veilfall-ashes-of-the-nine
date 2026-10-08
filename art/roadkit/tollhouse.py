# The Tollhouse ruin, hero building of Broken Lantern Road. Authored in GAME coordinates through G()/GR
# (x east, y up, z south; origin mid-floor), turned 180 deg about Blender Z at export so it is placed
# with model.forward "+z". Door through the WEST wall, gap z -0.6..0.6, 2.3 m high.
import sys; sys.path.insert(0, "art/roadkit")
from common import *
reset()
R = random.Random(17)
KINDS.update({
    "slate": ("#0f1117", "#3b404c", .5, 0, 3), "char": ("#060507", "#2a201a", .92, 0, 5),
    "copper": ("#3b1d10", "#b4733f", .38, .85, 1), "banner": ("#30100f", "#8c3a31", .95, 0, 2),
    "plaster": ("#3e3a33", "#7d7462", .92, 0, 2), "quoin": ("#2a2a31", "#67666a", .6, 0, 3),
    "scratch": ("#8f8672", "#c9bea2", .85, 0, 0), "leather": ("#1a0e0a", "#4a281c", .7, 0, 2),
    "gilt": ("#4e381d", "#c49c63", .55, .4, 1),
})
def MAT(name, kind, n=256, seed=1):
    tex.__defaults__ = (n,)
    try: return make_mat(name, kind, seed)
    finally: tex.__defaults__ = (256,)
M = {
    "fieldstone": MAT("fieldstone", "stone", 1024, 11), "mortar": MAT("mortar", "ash", 256, 12),
    "quoin": MAT("quoin", "quoin", 512, 13), "oak": MAT("oak", "wood", 1024, 14),
    "charred_timber": MAT("charred_timber", "char", 512, 15), "slate": MAT("slate", "slate", 1024, 16),
    "iron": MAT("iron", "iron", 512, 17), "rust": MAT("rust", "rust", 256, 18), "wax": MAT("wax", "wax", 256, 19),
    "soot": MAT("soot", "soot", 256, 20), "parchment": MAT("parchment", "parchment", 256, 21),
    "leather": MAT("leather", "leather", 256, 22), "copper": MAT("copper", "copper", 256, 23),
    "banner": MAT("banner", "banner", 512, 24), "plaster": MAT("plaster", "plaster", 256, 25),
    "scratch": MAT("scratch", "scratch", 256, 26), "gilt": MAT("gilt", "gilt", 256, 27),
    "glow": make_mat("glow", "wax", emit=(1.0, .55, .18)),
}
TILE = {"fieldstone": 1.0, "mortar": 1.0, "quoin": .8, "oak": 1.2, "charred_timber": .8, "slate": .6}

GR = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
def G(x, y=None, z=None):
    if y is None: x, y, z = x
    return Vector((x, -z, y))
def T(x, y=None, z=None):
    if y is None: x, y, z = x
    return Matrix.Translation((x, y, z))
def S(x, y, z): return Matrix.Diagonal((x, y, z, 1))
def Rx(d): return Matrix.Rotation(math.radians(d), 4, "X")
def Ry(d): return Matrix.Rotation(math.radians(d), 4, "Y")
def Rz(d): return Matrix.Rotation(math.radians(d), 4, "Z")
def basis(c0, c1, c2):
    m = Matrix.Identity(4)
    for i in range(3): m[i][0], m[i][1], m[i][2] = c0[i], c1[i], c2[i]
    return m
def beamM(p0, p1, w, h, roll=0):
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0; L = d.length; d = d / L
    side = Vector((0, 1, 0)).cross(d) if abs(d.y) < .98 else Vector((1, 0, 0)); side.normalize()
    return T((p0 + p1) / 2) @ basis(side, d.cross(side), d) @ Rz(roll) @ S(w, h, L)

class Bulk:
    def __init__(s, name, tile=.6):
        s.bm = bmesh.new(); s.uv = s.bm.loops.layers.uv.new("UVMap"); s.name = name; s.tile = tile
    def _uv(s, faces):
        ou, ov = R.random() * 4, R.random() * 4
        for f in faces:
            f.normal_update(); n = f.normal; ax = max(range(3), key=lambda i: abs(n[i]))
            for l in f.loops:
                c = l.vert.co; u, v = ((c.y, c.z), (c.x, c.z), (c.x, c.y))[ax]
                l[s.uv].uv = (u / s.tile + ou, v / s.tile + ov)
    def _fin(s, verts, bevel=0, jit=0, freq=3.0):
        faces = set(f for v in verts for f in v.link_faces)
        if bevel > 0:
            edges = list(set(e for f in faces for e in f.edges))
            res = bmesh.ops.bevel(s.bm, geom=edges, offset=bevel, offset_type="OFFSET", segments=1, profile=.5, affect="EDGES", clamp_overlap=True)
            vs = set(v for f in res["faces"] for v in f.verts)
            faces = set(f for v in vs for f in v.link_faces)
        verts = set(v for f in faces for v in f.verts)
        if jit > 0:
            off = Vector((R.random() * 90, R.random() * 90, R.random() * 90))
            for v in verts: v.co += mnoise.noise_vector(v.co * freq + off) * jit
        s._uv(faces); return verts
    def box(s, Mg, bevel=0, jit=0, freq=3.0):
        r = bmesh.ops.create_cube(s.bm, size=1.0, matrix=GR @ Mg); return s._fin(r["verts"], bevel, jit, freq)
    def cyl(s, Mg, r1=.5, r2=.5, depth=1, seg=8, jit=0):
        r = bmesh.ops.create_cone(s.bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r1, radius2=r2, depth=depth, matrix=GR @ Mg)
        return s._fin(r["verts"], 0, jit)
    def ico(s, Mg, sub=2, jit=0, freq=3.0):
        r = bmesh.ops.create_icosphere(s.bm, subdivisions=sub, radius=1.0, matrix=GR @ Mg); return s._fin(r["verts"], 0, jit, freq)
    def done(s):
        me = bpy.data.meshes.new(s.name); s.bm.to_mesh(me); s.bm.free(); return link(me, s.name, M[s.name])
B = {k: Bulk(k, TILE.get(k, .6)) for k in M if k != "glow"}

def gtube(pts, rad, segs, mat, cap=True): return tube([G(p) for p in pts], rad, segs, M[mat], cap)
def splinters(p, d, mat, n=4):
    p, d = Vector(p), Vector(d).normalized()
    for i in range(n):
        o = Vector((R.uniform(-.04, .04), R.uniform(-.05, .05), R.uniform(-.04, .04)))
        e = p + o + d * R.uniform(.08, .26) + Vector((R.uniform(-.03, .03), R.uniform(-.03, .03), R.uniform(-.03, .03)))
        gtube([p + o - d * .03, e], [.024, .002], 4, mat)

# ------------------------------------------------------------------ walls
X, Z, TH, H, RIDGE = 3.4, 3.9, .4, 3.2, 5.0
WEST = [(-3.9, 3.2), (1.8, 3.2), (2.6, 2.7), (3.1, 2.95), (3.9, 2.85)]
NORTH = [(-3.4, 3.2), (0, 5.0), (3.4, 3.2)]
SOUTH = [(-3.4, 3.2), (-2.2, 3.5), (-1.3, 2.5), (-.3, 2.9), (.8, 1.6), (2.0, 1.9), (3.4, 1.1)]
EAST = [(-3.9, 3.2), (-1.0, 3.2), (.2, 2.6), (1.5, 2.9), (2.6, 1.7), (3.9, 1.1)]
def interp(prof, s):
    for (a, ha), (b, hb) in zip(prof, prof[1:]):
        if a <= s <= b: return ha + (hb - ha) * (s - a) / (b - a)
    return prof[0][1] if s < prof[0][0] else prof[-1][1]
def wpt(axis, s, y, t): return (s, y, t) if axis == "x" else (t, y, s)
def wbox(bulk, axis, s0, s1, y0, y1, t0, t1, bevel, jit):
    c = wpt(axis, (s0 + s1) / 2, (y0 + y1) / 2, (t0 + t1) / 2); sz = wpt(axis, s1 - s0, y1 - y0, t1 - t0)
    return B[bulk].box(T(c) @ S(*sz), bevel, jit)

def wall(axis, t0, t1, s0, s1, prof, opens, out):
    blk = []
    for a0, a1, y0, y1 in opens:
        blk.append((a0 - .02, a1 + .02, y0 - (.14 if y0 > 0 else 0), y1))
        blk.append((a0 - .27, a1 + .27, y1, y1 + .3))
        if y0 > 0: blk.append((a0 - .12, a1 + .12, y0 - .14, y0))
    def free(lo, hi):
        iv = [(s0, s1)]
        for a0, a1, b0, b1 in blk:
            if b0 < hi and b1 > lo:
                nv = []
                for p, q in iv:
                    if a1 <= p or a0 >= q: nv.append((p, q)); continue
                    if a0 > p: nv.append((p, a0))
                    if a1 < q: nv.append((a1, q))
                iv = nv
        return iv
    for p, q in free(0, .32):  # footing course, proud of the face
        x = p
        while x < q - .05:
            w = R.uniform(.5, .85)
            if q - (x + w) < .25: w = q - x
            w = min(w, q - x)
            wbox("fieldstone", axis, x + .012, x + w - .012, 0, .32 + R.uniform(-.02, .02), t0 - .08, t1 + .08, .04, .02)
            x += w
    y, top_any = .32, max(h for _, h in prof)
    while y < top_any:
        h = R.uniform(.2, .3)
        for p, q in free(y, y + h):
            x, first = p, True
            while x < q - .04:
                w = R.uniform(.22, .4) if first else R.uniform(.3, .6); first = False
                if q - (x + w) < .16: w = q - x
                w = min(w, q - x)
                top = interp(prof, x + w / 2)
                if y < top - .08:
                    yt = min(y + h, top + R.uniform(-.04, .06)); d = R.uniform(-.012, .02)
                    wbox("fieldstone", axis, x + .014, x + w - .014, y + .012, yt - .012, t0 - d + R.uniform(-.01, .01), t1 + d, .035, .018)
                x += w
        y += h
    # mortar core: the dark joint behind every stone, holes left open
    cuts = [s0, s1] + [v for a0, a1, _, _ in opens for v in (a0, a1)] + [s0 + k * .3 for k in range(int((s1 - s0) / .3) + 1)]
    cuts = sorted(set(round(c, 4) for c in cuts if s0 <= c <= s1))
    for a, b in zip(cuts, cuts[1:]):
        if b - a < .01: continue
        m = (a + b) / 2; top = interp(prof, m) - .16
        if top <= .05: continue
        segs = [(0, top)]
        for a0, a1, y0, y1 in opens:
            if a0 < m < a1:
                ns = []
                for ya, yb in segs:
                    if y1 <= ya or y0 >= yb: ns.append((ya, yb)); continue
                    if y0 > ya: ns.append((ya, y0))
                    if y1 < yb: ns.append((y1, yb))
                segs = ns
        for ya, yb in segs:
            if yb - ya > .02: wbox("mortar", axis, a, b, ya, yb, t0 + .04, t1 - .04, 0, 0)
    for a0, a1, y0, y1 in opens:  # jambs, lintel, sill in dressed stone
        yy, i = y0, 0
        while yy < y1 - .05:
            hh = min(.44 if y0 == 0 else .3, y1 - yy); L = .34 if i % 2 else .22
            for p, q in ((a0 - L, a0), (a1, a1 + L)):
                wbox("quoin", axis, p, q, yy + .01, yy + hh - .01, t0 - .03, t1 + .03, .025, .006)
            yy += hh; i += 1
        wbox("quoin", axis, a0 - .25, a1 + .25, y1, y1 + .3, t0 - .04, t1 + .04, .03, .008)
        if y0 > 0:
            ts = (t0 - .08, t1 + .01) if out < 0 else (t0 - .01, t1 + .08)
            wbox("quoin", axis, a0 - .1, a1 + .1, y0 - .12, y0, ts[0], ts[1], .02, .005)

DOOR = (-.6, .6, 0, 2.3); WWIN = (-2.7, -1.95, 1.25, 2.15); EWIN = (-2.6, -1.8, 1.25, 2.15)
wall("z", -3.4, -3.0, -3.5, 3.5, WEST, [DOOR, WWIN], -1)
wall("x", -3.9, -3.5, -3.4, 3.4, NORTH, [(-.15, .15, 3.55, 4.1)], -1)
wall("x", 3.5, 3.9, -3.4, 3.4, SOUTH, [], 1)
wall("z", 3.0, 3.4, -3.5, 3.5, EAST, [EWIN], 1)
for cx, cz, dx, dz, ym in ((-3.4, -3.9, 1, 1, 3.1), (3.4, -3.9, -1, 1, 3.1), (-3.4, 3.9, 1, -1, 2.95), (3.4, 3.9, -1, -1, 1.05)):
    y, i = .32, 0
    while y < ym - .1:
        lx, lz = (.62, .42) if i % 2 else (.42, .62)
        xa, xb = sorted((cx - dx * .035, cx + dx * lx)); za, zb = sorted((cz - dz * .035, cz + dz * lz))
        B["quoin"].box(T((xa + xb) / 2, y + .18, (za + zb) / 2) @ S(xb - xa - .01, .34, zb - za - .01), .03, .008)
        y += .38; i += 1
# threshold and the outside step
B["quoin"].box(T(-3.2, .03, 0) @ S(.44, .06, 1.2), .01, .003)
for z0, z1 in ((-1.05, -.02), (.02, 1.05)):
    B["quoin"].box(T(-3.76, .08, (z0 + z1) / 2) @ Ry(R.uniform(-2, 2)) @ S(.68, .16, z1 - z0), .03, .01)
# window frames, bars
for xa, xb, (a0, a1, y0, y1) in ((-3.25, -3.15, WWIN), (3.15, 3.25, EWIN)):
    xc = (xa + xb) / 2
    for z in (a0 + .03, a1 - .03): B["oak"].box(T(xc, (y0 + y1) / 2, z) @ S(.1, y1 - y0, .06), .008, .004)
    for y in (y0 + .03, y1 - .03): B["oak"].box(T(xc, y, (a0 + a1) / 2) @ S(.1, .06, a1 - a0), .008, .004)
for i, z in enumerate((-2.51, -2.33, -2.14)):
    bend = .06 if i == 1 else 0
    gtube([(-3.3, 1.26, z), (-3.3 - bend, 1.7, z + bend * .5), (-3.3, 2.14, z)], .012, 5, "iron", False)

# ------------------------------------------------------------------ floor
B["mortar"].box(T(0, .005, 0) @ S(6.0, .01, 7.0))
x, i = -3.0, 0
while x < 2.98:
    if i != 12:
        z = -3.5
        while z < 3.49:
            zb = min(3.5, z + R.uniform(1.4, 2.6))
            if 3.5 - zb < .4: zb = 3.5
            mid = (z + zb) / 2
            if not (mid > .9 and R.random() < .14):
                bulk = "charred_timber" if mid > .6 and R.random() < .45 else "oak"
                th = R.uniform(.04, .055)
                B[bulk].box(T(x + .15, th / 2, mid) @ Ry(R.uniform(-.4, .4)) @ S(.286, th, zb - z - .012), .008, .004)
            z = zb + .004
    x += .3; i += 1

# ------------------------------------------------------------------ roof
K = (RIDGE - H) / 3.4
def roofY(ax): return 3.52 + (3.2 - abs(ax)) * K
a = math.atan(K); ca, sa = math.cos(a), math.sin(a)
def RP(u, z, s, off):
    E = Vector((s * 3.8, roofY(3.8), 0)); D = Vector((-s * ca, sa, 0)); n = Vector((s * sa, ca, 0))
    return E + D * u + Vector((0, 0, z)) + n * off, D, n
ULEN = 3.8 / ca
def edge(u, s):
    base = -.15 if s < 0 else -.55
    return base + .45 * mnoise.noise(Vector((u * .9, s * 3.1, .5))) - (.45 if u < .9 else 0) + (.3 if u > ULEN - .5 else 0)
for s, zz in ((-1, (-4.0, 3.6)), (1, (-4.0, -.9))):  # wall plates
    B["oak"].box(beamM((s * 3.2, 3.28, zz[0]), (s * 3.2, 3.28, min(zz[1], .4)), .24, .16), .015, .006)
B["charred_timber"].box(beamM((-3.2, 3.28, .4), (-3.2, 3.26, 3.6), .22, .15), .015, .01)
def rafter(z, s, frac=1., frm="eave", hang=None, mat="oak"):
    e = Vector((s * 3.78, roofY(3.78) - .09, z)); r = Vector((s * .09, roofY(.09) - .09, z))
    p, q = (e, r) if frm == "eave" else (r, e)
    p1 = p + (q - p) * frac
    B[mat].box(beamM(p, p1, .11, .16), .012, .006)
    if frac < 1: splinters(p1, q - p, mat)
    if hang:
        hp = Vector(hang); B[mat].box(beamM(p1 + Vector((0, -.06, 0)), hp, .1, .14), .012, .008); splinters(p1 + Vector((0, -.06, 0)), p1 - hp, mat, 3)
for z in (-4.0, -3.2, -2.4, -1.6, -.8):
    for s in (-1, 1): rafter(z, s)
for s in (-1, 1): rafter(0.0, s, mat="charred_timber")
rafter(.8, -1, mat="charred_timber")
rafter(.8, 1, .45, "ridge", (1.7, .1, 1.25), "charred_timber")
rafter(1.6, -1, .4, mat="charred_timber")
rafter(2.4, -1, .55, "eave", (-1.2, .1, 2.9), "charred_timber")
rafter(3.2, -1, .25, mat="charred_timber")
for z in (-3.2, -.8): B["oak"].box(T(0, 3.08, z) @ S(6.3, .2, .2), .015, .006)
B["charred_timber"].box(beamM((-3.15, 3.1, 1.6), (-.25, 2.98, 1.62), .18, .18), .015, .01)
splinters((-.25, 2.98, 1.62), (1, -.05, 0), "charred_timber")
B["charred_timber"].box(beamM((.25, .12, 1.42), (2.98, 2.72, 1.66), .18, .18), .015, .01)
splinters((.25, .12, 1.42), (-1, -.9, -.1), "charred_timber")
# ridge beam, snapped at z 1.45; the broken length crashed to the floor
B["oak"].box(beamM((0, 5.12, -4.3), (0, 5.12, 1.45), .18, .2), .015, .006)
splinters((0, 5.12, 1.45), (0, 0, 1), "oak", 5)
B["charred_timber"].box(beamM((.06, 4.95, 1.62), (.75, .12, 3.25), .17, .19), .015, .01)
splinters((.06, 4.95, 1.62), (-.14, 1, -.33), "charred_timber", 5)
# battens, slates, ridge tiles, barge boards
for s in (-1, 1):
    u = .1
    while u < ULEN - .05:
        zend = edge(u, s) + R.uniform(.2, .9)
        p0, D, n = RP(u, -4.25, s, .02); p1, _, _ = RP(u, zend, s, .02)
        B["oak"].box(beamM(p0, p1, .05, .03), .006, .004)
        u += .32
    row, u = 0, 0
    while u < ULEN - .1:
        z = -4.27 + (row % 2) * .15
        while z < 0.5:
            if z + .14 < edge(u + .2, s) and R.random() > .03:
                p, D, n = RP(u + .21, z + R.uniform(-.01, .01), s, .05)
                B["slate"].box(T(p) @ basis(Vector((0, 0, s)), n, D) @ Ry(R.uniform(-2, 2)) @ Rx(3) @ S(.28, .018, .42), .004, .003)
            z += .3
        u += .21; row += 1
    p0, _, _ = RP(0, -4.3, s, .05); p1, _, _ = RP(ULEN, -4.3, s, .05)
    B["oak"].box(beamM(p0, p1, .05, .22), .01, .005)
zr = min(edge(ULEN - .1, -1), edge(ULEN - .1, 1)); z = -4.25
while z < zr:
    B["slate"].cyl(T(0, roofY(0) + .07, z), .11, .11, .36, 8); z += .34

# ------------------------------------------------------------------ the door, half off its top hinge
def leaf(Mg, w, h, t, planks, straps, wood="oak"):
    pw = w / planks
    for k in range(planks):
        B[wood].box(Mg @ T(pw * (k + .5), h / 2 + R.uniform(-.01, .01), t / 2) @ S(pw - .012, h - R.uniform(0, .03), t), .01, .004)
    for sv in straps:
        B["iron"].box(Mg @ T(w * .5 - .04, sv, t + .006) @ S(w - .08, .07, .012), .004, .002)
        B["iron"].box(Mg @ T(.12, sv, -.006) @ S(.3, .06, .012), .004, .002)
        for uu in [k * .19 + .1 for k in range(int((w - .12) / .19))]:
            B["iron"].box(Mg @ T(uu, sv, t + .016) @ S(.025, .025, .015), .006)
BCL = basis(Vector((0, 0, 1)), Vector((0, 1, 0)), Vector((-1, 0, 0)))
DM = T(-3.47, .62, -.68) @ Ry(-105) @ BCL @ Rz(-13) @ T(0, -.35, 0)
leaf(DM, 1.2, 2.25, .09, 5, (.35, 1.12, 1.9))
p = DM @ Vector((.95, 1.15, .1)); prim("torus", M["iron"], loc=G(p), rot=(0, 0, math.radians(-15)), major_radius=.07, minor_radius=.012, major_segments=10, minor_segments=4)
B["iron"].box(T(-3.47, .62, -.66) @ S(.06, .1, .06), .01)  # bottom pintle still holding
B["iron"].box(T(-3.47, 1.92, -.66) @ S(.06, .1, .06), .01)  # top pintle, empty
gtube([(-3.47, 1.92, -.66), (-3.55, 1.9, -.75), (-3.6, 1.78, -.8)], .014, 4, "iron")  # its torn strap end
# east window shutter, also hanging
SM = T(3.46, 1.4, -1.8) @ Ry(-150) @ basis(Vector((0, 0, -1)), Vector((0, 1, 0)), Vector((1, 0, 0))) @ Rz(-20) @ T(0, -.15, 0)
leaf(SM, .4, .88, .045, 2, (.2, .7), "charred_timber")

# ------------------------------------------------------------------ the toll counter, grille, ledger, candles
for z in [-1.6 + k * .2 for k in range(14)]:
    B["oak"].box(T(.585, .5 + R.uniform(-.01, .01), z + .1) @ S(.07, 1.0 - R.uniform(0, .03), .19), .008, .004)
B["oak"].box(T(.56, .05, -.2) @ S(.08, .1, 2.86), .01, .003)
for z in (-1.565, 1.165): B["oak"].box(T(.98, .5, z) @ S(.86, 1.0, .07), .008, .004)
B["oak"].box(T(1.0, .5, -.2) @ S(.76, .04, 2.7), .006)
B["oak"].box(T(.96, 1.035, -.2) @ S(1.02, .07, 3.02), .015, .004)
TOP = 1.07
GX = .72
for y in (TOP + .025, 1.5, 2.03): B["rust"].box(T(GX, y, -.7) @ S(.05, .05 if y != 1.5 else .03, 1.62), .008, .003)
for z in (-1.5, .1): B["rust"].box(T(GX, (TOP + 2.06) / 2, z) @ S(.05, 2.06 - TOP, .05), .008, .003)
B["rust"].box(T(GX, 1.29, -.65) @ S(.04, .03, .42), .005)
zb = -1.44
while zb < .06:
    y0 = 1.3 if -.85 < zb < -.45 else TOP + .05
    gtube([(GX, y0, zb), (GX, 2.02, zb)], .011, 4, "iron", False)
    prim("cone", M["iron"], loc=G(GX, 2.1, zb), rot=(math.pi / 2, 0, 0) if False else (0, 0, 0), vertices=4, radius1=.02, depth=.08)
    zb += .085
B["iron"].box(T(.66, TOP + .015, -.65) @ S(.26, .03, .38), .006)  # coin tray
# ledger: open, chained down
B["leather"].box(T(.98, TOP + .006, .5) @ Ry(-6) @ S(.38, .012, .58), .004)
for zc in (.37, .63):
    B["parchment"].box(T(.98, TOP + .024, zc) @ Ry(-6) @ Rx(4 if zc < .5 else -4) @ S(.34, .025, .25), .003)
    for k in range(9):
        L = R.uniform(.12, .2)
        B["soot"].box(T(.86 + k * .028, TOP + .039, zc - .1 + L / 2) @ Ry(-6) @ S(.004, .002, L))
def page(u, v):
    return G(.83 + v * .3, TOP + .04 + .07 * math.sin(u * 2.4) * (1 - .3 * v), .5 - u * .24)
sheet(page, 6, 3, M["parchment"], "page")
B["iron"].box(T(.5, TOP - .02, .95) @ S(.05, .06, .05), .008)
chain([G(.82, TOP + .02, .52), G(.6, TOP + .01, .85), G(.5, TOP, .95), G(.48, .82, .98), G(.48, .58, .95)], M["iron"], .06, .02, .006)
# candles and their wax
CANDLES = [((1.02, -.15), .18, .035, True), ((1.22, .08), .3, .03, True), ((.82, .92), .13, .04, True),
           ((1.08, 1.06), .23, .03, True), ((1.28, .8), .07, .045, False), ((.95, -1.35), .05, .04, False)]
TIPS = []
for i, ((cx, cz), h, r, lit) in enumerate(CANDLES):
    candle(M, G(cx, TOP, cz), h, r, lit, i)
    pool = B["wax"].cyl(T(cx, TOP + .004, cz) @ Rx(-90), r * 2.6, r * 2.2, .008, 10, .006)
    if lit: TIPS.append((cx, TOP + h + .035, cz))
for z in (.62, .74, .88, .97, 1.1, 1.2):
    L = R.uniform(.08, .4)
    gtube([(.445, TOP - .005, z), (.44, TOP - L * .5, z + .005), (.443, TOP - L, z)], [.016, .011, .003], 5, "wax")
gtube([(.46, TOP + .005, .6), (.455, TOP + .01, .9), (.46, TOP + .006, 1.22)], .018, 5, "wax")
# shelf on the north wall: dead stubs and a jar
B["oak"].box(T(-.5, 1.7, -3.34) @ S(2.2, .05, .3), .008, .003)
for xb in (-1.4, .4): B["iron"].box(T(xb, 1.58, -3.42) @ S(.04, .2, .14), .004)
candle(M, G(-1.1, 1.725, -3.32), .09, .035, False, 11); candle(M, G(-.95, 1.725, -3.3), .05, .04, False, 12)
gtube([(.1, 1.725, -3.32), (.1, 1.78, -3.32), (.1, 1.86, -3.32), (.1, 1.93, -3.32), (.1, 1.96, -3.32)], [.07, .09, .08, .045, .05], 10, "plaster")

# ------------------------------------------------------------------ toppled strongbox, spilled copper
SB = T(-.35, .195, 1.85) @ Ry(64) @ Rz(4) @ Rx(-90)
for c, sz in (((0, .02, 0), (.56, .04, .38)), ((0, .17, .17), (.56, .3, .04)), ((0, .17, -.17), (.56, .3, .04)),
              ((.26, .17, 0), (.04, .3, .3)), ((-.26, .17, 0), (.04, .3, .3))):
    B["oak"].box(SB @ T(c) @ S(*sz), .008, .003)
for bx in (-.18, .18):
    B["iron"].box(SB @ T(bx, .02, 0) @ S(.05, .05, .4), .004)
    for zz in (-.195, .195): B["iron"].box(SB @ T(bx, .17, zz) @ S(.05, .34, .012), .004)
B["iron"].box(SB @ T(0, .26, .2) @ S(.08, .1, .02), .004)
mouth = SB @ Vector((0, .36, 0)); md = (SB.to_3x3() @ Vector((0, 1, 0))).normalized()
lp = mouth + md * .32; B["oak"].box(T(lp.x, .09, lp.z) @ Ry(64) @ Rz(8) @ S(.58, .04, .4), .008, .003)
B["iron"].box(T(lp.x, .115, lp.z) @ Ry(64) @ Rz(8) @ S(.6, .012, .05), .003)
ang0 = math.atan2(md.x, md.z)
for k in range(78):
    if k < 22:
        rr = R.uniform(0, .16); ph = R.uniform(0, 6.28); y = .056 + (k // 6) * .006 + R.uniform(0, .004)
        cp = mouth + Vector((math.cos(ph) * rr, 0, math.sin(ph) * rr)) + md * .05
    else:
        rr = .12 + (R.random() ** 1.6) * 1.5; ph = ang0 + R.gauss(0, .45); y = .056
        cp = mouth + Vector((math.sin(ph) * rr, 0, math.cos(ph) * rr))
    B["copper"].cyl(T(cp.x, y, cp.z) @ Ry(R.uniform(0, 360)) @ Rz(R.uniform(-12, 12) if k < 22 else R.uniform(-3, 3)) @ Rx(-90), .02, .02, .004, 8)

# ------------------------------------------------------------------ tally marks scratched by the door
bm = bmesh.new(); vs = []
for k in range(14):
    t = k / 14 * 6.283; rr = 1 + .18 * mnoise.noise(Vector((math.cos(t) * 2, math.sin(t) * 2, 3)))
    vs.append(bm.verts.new(G(-2.935, 1.42 + math.sin(t) * .42 * rr, 1.27 + math.cos(t) * .5 * rr)))
bm.faces.new(vs); me = bpy.data.meshes.new("plaster_patch"); bm.to_mesh(me); bm.free(); link(me, "plaster_patch", M["plaster"])
def stroke(p0, p1):
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0; L = d.length; d /= L; nrm = Vector((1, 0, 0))
    B["scratch"].box(T((p0 + p1) / 2) @ basis(nrm.cross(d), nrm, d) @ S(.009, .004, L))
for row, yb, groups in ((0, 1.56, 4), (1, 1.22, 3)):
    for gi in range(groups):
        zg = .92 + gi * .19; n = 3 if (row == 1 and gi == 2) else 4
        for k in range(n):
            lean = R.uniform(-.012, .012)
            stroke((-2.93, yb, zg + k * .03), (-2.93, yb + .15, zg + k * .03 + lean))
        if n == 4: stroke((-2.93, yb + .02, zg - .025), (-2.93, yb + .13, zg + .115))

# ------------------------------------------------------------------ soot over windows, door and the burnt south half
def soot(axis, wc, out, a0, a1, y0, y1, off=.065, seed=0):
    mid, hw = (a0 + a1) / 2, (a1 - a0) / 2
    def f(u, v):
        w = hw * (1.15 - .75 * v) * (1 + .12 * math.sin(v * 9 + seed)); s = mid + (u - .5) * 2 * w + .08 * math.sin(v * 4 + seed)
        y = y0 + v * (y1 - y0) * (1 - .12 * abs(u - .5) * 2)
        return G(*wpt(axis, s, y, wc + out * off))
    sheet(f, 4, 6, M["soot"], "soot")
soot("z", -3.4, -1, *WWIN[:2], WWIN[3], 3.12, seed=1); soot("z", -3.0, 1, *WWIN[:2], WWIN[3], 3.0, .055, 2)
soot("z", 3.4, 1, *EWIN[:2], EWIN[3], 3.12, seed=3); soot("z", 3.0, -1, *EWIN[:2], EWIN[3], 3.0, .055, 4)
soot("z", -3.4, -1, -.6, .6, 2.3, 3.15, .075, 5)
soot("x", 3.5, -1, -2.6, -.6, .6, 2.45, .055, 6); soot("z", 3.0, -1, .3, 2.1, .4, 2.35, .055, 7)
soot("z", -3.0, 1, 1.9, 3.3, .5, 2.9, .055, 8)

# ------------------------------------------------------------------ the tattered red toll banner, outside by the door
gtube([(-3.36, 2.92, 1.75), (-4.25, 2.92, 1.75), (-4.3, 2.96, 1.75), (-4.3, 3.02, 1.75)], .016, 5, "iron")
gtube([(-3.36, 2.45, 1.75), (-3.95, 2.92, 1.75)], .012, 4, "iron")
B["oak"].box(beamM((-3.5, 2.86, 1.75), (-4.24, 2.86, 1.75), .035, .035), .006)
NOTCH = [0, 2, 4, 1, 3, 0, 2, 5, 1]
def ban(u, v):
    return G(-3.52 - u * .66, 2.84 - v * 1.55 * (1 + .04 * math.sin(u * 9)), 1.75 + .014 * math.sin(v * 7 + u * 3) + .02 * v * u)
bm = bmesh.new(); NU, NV = 8, 14
g = [[bm.verts.new(ban(i / NU, j / NV)) for j in range(NV + 1)] for i in range(NU + 1)]
for i in range(NU):
    for j in range(NV):
        if j >= NV - NOTCH[i] - (1 if R.random() < .3 and j > 8 else 0): continue
        if (i, j) in ((2, 9), (5, 11), (6, 4)): continue
        bm.faces.new((g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]))
bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
me = bpy.data.meshes.new("banner"); bm.to_mesh(me); bm.free(); link(me, "banner", M["banner"])
for zo in (-.032, .032):
    prim("torus", M["gilt"], loc=G(-3.86, 2.25, 1.75 + zo), rot=(math.pi / 2, 0, 0), major_radius=.15, minor_radius=.016, major_segments=16, minor_segments=4)
    B["gilt"].box(T(-3.86, 2.25, 1.75 + zo) @ Rz(30) @ S(.03, .34, .012))

# ------------------------------------------------------------------ rubble, fallen slates, fallen timber
PILES = [(.2, 4.6, 1.5), (1.6, 4.7, 1.3), (2.8, 4.5, 1.4), (4.0, 2.8, 1.3), (4.2, 1.4, 1.0), (-1.4, 4.4, .9),
         (1.4, 2.6, 1.0), (2.3, 1.1, .85), (-.4, 3.05, .7)]
for px, pz, s in PILES:
    vs = B["mortar"].ico(T(px, 0, pz) @ S(s * .9, .34 * s, s * .7), 2, .08, 2.0)
    for v in vs:
        if v.co.z < .002: v.co.z = .002
    for k in range(int(14 * s)):
        t, rr = R.uniform(0, 6.28), math.sqrt(R.random()) * .85
        dx, dz = math.cos(t) * rr * s * .9, math.sin(t) * rr * s * .7
        hgt = .34 * s * math.sqrt(max(0, 1 - rr * rr))
        w, hh, d = R.uniform(.2, .45), R.uniform(.14, .26), R.uniform(.18, .34)
        bulk = "quoin" if k == 3 else "fieldstone"
        B[bulk].box(T(px + dx, hgt * .85 + hh * .3, pz + dz) @ Ry(R.uniform(0, 360)) @ Rx(R.uniform(-25, 25)) @ Rz(R.uniform(-25, 25)) @ S(w, hh, d), .035, .03)
    for k in range(4):
        t, rr = R.uniform(0, 6.28), R.uniform(.3, 1.0)
        dx, dz = math.cos(t) * rr * s, math.sin(t) * rr * s * .8
        hgt = .34 * s * math.sqrt(max(0, 1 - min(1, rr * rr)))
        B["slate"].box(T(px + dx, hgt + .02, pz + dz) @ Ry(R.uniform(0, 360)) @ Rx(R.uniform(-20, 20)) @ S(R.uniform(.18, .28), .016, R.uniform(.2, .4)), .003)
for k in range(26):
    px, pz = (R.uniform(-2.7, 2.7), R.uniform(.7, 3.3)) if k < 18 else (R.uniform(-3, 4.5), R.uniform(4.1, 5.0))
    if px < -2.2 and abs(pz) < 1.0: continue
    B["slate"].box(T(px, .07, pz) @ Ry(R.uniform(0, 360)) @ Rx(R.uniform(-8, 8)) @ S(R.uniform(.18, .28), .016, R.uniform(.22, .42)), .003)
for p0, p1 in (((-2.2, .1, 2.45), (.4, .4, 3.3)), ((1.0, .1, .95), (2.7, .85, 2.25)), ((3.75, .1, .3), (4.6, .45, 2.5))):
    B["charred_timber"].box(beamM(p0, p1, .13, .15), .012, .012); splinters(p1, Vector(p1) - Vector(p0), "charred_timber", 3)

for k, b in B.items(): b.done()

# ------------------------------------------------------------------ finish: uv the loose parts, join, export turned for forward "+z"
objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
for o in objs:
    me = o.data
    for v in me.vertices:
        if v.co.z < 0: v.co.z = 0
    if not me.uv_layers:
        tile = TILE.get(me.materials[0].name if me.materials else "", .6); uv = me.uv_layers.new(name="UVMap")
        ou, ov = R.random() * 4, R.random() * 4
        for pl in me.polygons:
            n = pl.normal; ax = max(range(3), key=lambda i: abs(n[i]))
            for li in pl.loop_indices:
                c = me.vertices[me.loops[li].vertex_index].co; u, v = ((c.y, c.z), (c.x, c.z), (c.x, c.y))[ax]
                uv.data[li].uv = (u / tile + ou, v / tile + ov)
bpy.ops.object.select_all(action="DESELECT")
for o in objs: o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
bpy.ops.object.join()
ob = bpy.context.active_object; ob.name = "tollhouse"
print("ZMIN", min(v.co.z for v in ob.data.vertices), "BOUNDS", [ (min(v.co[i] for v in ob.data.vertices), max(v.co[i] for v in ob.data.vertices)) for i in range(3)])
ob.data.transform(Matrix.Rotation(math.pi, 4, "Z"))
try: bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
except Exception:
    for pl in ob.data.polygons: pl.use_smooth = True
bpy.ops.export_scene.gltf(filepath=f"{OUT}/tollhouse.glb", export_format="GLB", use_selection=True, export_apply=True, export_image_format="JPEG", export_jpeg_quality=88)
dg = bpy.context.evaluated_depsgraph_get()
print("TRIS", len(ob.evaluated_get(dg).data.loop_triangles), "SLOTS", [m.name for m in ob.data.materials])
print("TIPS", ";".join("%.3f,%.3f,%.3f" % t for t in TIPS))
ob.data.transform(Matrix.Rotation(math.pi, 4, "Z"))  # back to the authoring frame for the proof

# ------------------------------------------------------------------ proof: the game's own iso angle (from the south-east) and two more
sc = bpy.context.scene
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = 20; sc.cycles.use_denoising = True
sc.render.resolution_x = sc.render.resolution_y = 720
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (.03, .04, .07, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 1.5
bpy.ops.mesh.primitive_plane_add(size=26, location=(0, 0, -.002)); bpy.context.active_object.data.materials.append(MAT("ground", "ash", 256, 99))
bpy.ops.object.light_add(type="SUN", rotation=(math.radians(45), 0, math.radians(-35))); sd = bpy.context.active_object.data; sd.energy = 1.4; sd.color = (.55, .68, 1.0)
bpy.ops.object.light_add(type="POINT", location=G(.6, 2.4, .3)); ld = bpy.context.active_object.data; ld.energy = 120; ld.color = (1, .62, .3); ld.shadow_soft_size = .2
def cam(tag, eye, tgt, lens=50):
    bpy.ops.object.camera_add(location=G(eye)); c = bpy.context.active_object
    c.rotation_mode = "QUATERNION"; c.rotation_quaternion = (G(tgt) - G(eye)).to_track_quat("-Z", "Y"); c.data.lens = lens
    sc.camera = c; sc.render.filepath = f"/tmp/roadkit/tollhouse_{tag}.png"; bpy.ops.render.render(write_still=True)
d, yaw, pit = 19, math.pi / 4, .92
cam("iso", (math.sin(yaw) * math.cos(pit) * d, 1.5 + math.sin(pit) * d, math.cos(yaw) * math.cos(pit) * d), (0, 1.5, 0))
cam("west", (-10, 3.2, 5), (-1.5, 1.6, .2))
cam("inside", (2.6, 4.6, 4.2), (.4, 1.0, .1), 32)
