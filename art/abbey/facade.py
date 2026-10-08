# The burned west front of the Ashen Abbey. Blender front is -Y (exports glTF +Z). Walk floor z=0, foundation to -3.
import sys; sys.path.insert(0, "art/abbey")
from kit import *
reset()
M = materials(); M["soot"] = M["sooted"]
R = random.Random(5)
WF, WB = -3.0, -1.0           # front wall faces
DOOR_W, DOOR_HS = 2.5, 4.27   # door half-width, springing height (apex 8.6)
ROSE_C, ROSE_R = (0.0, 11.4), 1.8
NICHE_X = 7.95
CANDLE_X = (-9.7, -6.2, 6.2, 9.7)

def arch_rise(w, z_spring, rise, n=14):
    r = (rise * rise + w * w) / (2 * w); cx = w - r; top = math.acos(-cx / r)
    right = [(cx + r * math.cos(t), z_spring + r * math.sin(t)) for t in np.linspace(0, top, n)]
    return right + [(-x, z) for x, z in reversed(right[:-1])]

# ---------- baked facade texture: ashlar in metres + soot plumes over every opening + wax runs + base grime ----------
FX0, FX1, FZ0, FZ1 = -12.5, 12.5, -0.5, 16.5
def facade_tex(n=2048):
    xs = np.linspace(FX0, FX1, n, endpoint=False)[None, :]; zs = np.linspace(FZ0, FZ1, n, endpoint=False)[:, None]
    X = np.broadcast_to(xs, (n, n)).astype(np.float32); Z = np.broadcast_to(zs, (n, n)).astype(np.float32)
    fr = lambda v: v - np.floor(v)
    CH = .5; c = np.floor(Z / CH); L = .75 + .6 * fr(np.sin(c * 12.9898) * 43758.5); o = fr(np.sin(c * 4.1414) * 9631.7) * 3
    bid = np.floor((X + o) / L); f = (X + o) / L - bid
    e = np.minimum(np.minimum(f, 1 - f) * L, np.minimum(Z / CH - c, 1 - (Z / CH - c)) * CH)
    edge = np.clip(e / .04, 0, 1) ** .6
    tone = fr(np.sin(c * 78.233 + bid * 37.719) * 43758.5) - .5
    g1 = fnoise(n, 1.9, 3); g2 = fnoise(n, 1.1, 4); chip = fnoise(n, 1.5, 5)
    edge = edge * (1 - .6 * (chip > .74))
    col = lerp3(hexc("#17191f"), hexc("#5d5d64"), (.45 + tone * .5 + (g1 - .5) * .6 + (g2 - .5) * .25) * (.35 + .65 * edge))
    streak = fnoise(n, 1.25, 6, aniso=10)
    soot = np.zeros((n, n), np.float32)
    plumes = [(0, 8.3, 2.6, 7.0, 1.0), (0, 13.2, 1.7, 3, .9), (-NICHE_X, 8.4, .6, 3, .8), (NICHE_X, 8.4, .6, 3, .8),
              (-NICHE_X, 5.3, .6, 2.2, .6), (NICHE_X, 5.3, .6, 2.2, .6)] + [(x, .85, .3, 1.8, .9) for x in CANDLE_X]
    for cx, z0, w0, H, k in plumes:
        dz = Z - z0; wz = w0 * (1 + .45 * np.clip(dz, 0, None))
        soot += k * np.exp(-((X - cx + (streak - .5) * .4) / wz) ** 2) * np.exp(-np.clip(dz, 0, None) / H) * np.clip((dz + .35) / .35, 0, 1)
    soot += np.clip((Z - 9.5) / 6, 0, 1) * .35        # the fire behind licked the upper wall
    soot = np.clip(soot * (.55 + .8 * streak), 0, .93)
    col = lerp3(col, hexc("#070608"), soot)
    grime = np.clip((1.3 - Z) / 1.3, 0, 1) * (.4 + .6 * g2)
    col = lerp3(col, hexc("#1e231c"), grime * .55)
    wax = np.zeros((n, n), np.float32); amber = np.zeros((n, n), np.float32); rr = random.Random(9)
    for cx in CANDLE_X:   # wax that wept out of each candle niche down the plinth
        for k in range(7):
            xk = cx + rr.uniform(-.32, .32); zend = rr.uniform(-.1, .25); wk = rr.uniform(.012, .03)
            m = np.exp(-((X - xk) / wk) ** 2) * ((Z < .32) & (Z > zend))
            wax += m; amber += m * np.clip((.32 - Z) / .4, 0, 1)
    wax = np.clip(wax, 0, 1); amber = np.clip(amber, 0, 1)
    col = lerp3(col, hexc("#e7d9b8"), wax * .9); col = lerp3(col, hexc("#b9823e"), amber * .7)
    h = edge * .65 + g1 * .25 + g2 * .1 + wax * .3
    rough = np.clip(.8 - .45 * np.clip((streak - .45) * 2.5, 0, 1) + soot * .15 - wax * .4 + (1 - edge) * .1, .22, 1)
    return col.astype(np.float32), h.astype(np.float32), rough.astype(np.float32)
c, h, r = facade_tex(); M["facade"] = __import__("kit")._wire("facade", c, h, r, 0, 6)

def jagged_top(segs, seed):
    """broken-masonry skyline: nominal (x, z) control polyline, bitten, stair-stepped to 0.5 m courses"""
    rr = random.Random(seed); xs = np.array([p[0] for p in segs]); zs = np.array([p[1] for p in segs])
    bites = [(-10.2, 3.2, 2.4), (3.6, 3.6, 2.8), (9.6, 2.2, 1.6), (-4.8, 1.6, 1.0), (.0, 1.4, 1.1), (6.4, 1.2, .9)]
    out = []; x = xs[-1]
    while x > xs[0] + 1e-6:
        L = rr.uniform(.5, 1.0); x2 = max(xs[0], x - L); xm = (x + x2) / 2
        z = np.interp(xm, xs, zs)
        for bx, bw, bd in bites:
            if abs(xm - bx) < bw / 2: z -= bd * math.cos((xm - bx) / bw * math.pi)
        z = math.floor((z - rr.uniform(0, .45)) / .5) * .5
        out += [(x, z), (x2, z)]; x = x2
    return out

# ---------- front wall with door, rose, niches, blind lancets, candle niches cut ----------
top = jagged_top([(-12, 10.2), (-7, 11.2), (0, 15.2), (7, 11.2), (12, 10.2)], 3)
wall = prism_xz([(-12, 0), (12, 0)] + top, WF, WB, M["facade"], "wall")
def cutters():
    cs = [prism_xz([(-DOOR_W, .6), (DOOR_W, .6)] + arch_rise(DOOR_W, DOOR_HS, 4.33), WF - .6, WB + .6, M["stone"]),
          prism_xz([(-2.85, .6), (2.85, .6)] + arch_rise(2.85, DOOR_HS, 4.6), WF - .6, -2.45, M["stone"]),
          prism_xz([(-3.2, .6), (3.2, .6)] + arch_rise(3.2, DOOR_HS, 4.85), WF - .6, -2.75, M["stone"])]
    cs.append(prim("cyl", M["stone"], loc=(ROSE_C[0], -2, ROSE_C[1]), rot=(math.pi / 2, 0, 0), vertices=32, radius=ROSE_R, depth=3.2))
    cs.append(prim("cyl", M["stone"], loc=(ROSE_C[0], WF - .3, ROSE_C[1]), rot=(math.pi / 2, 0, 0), vertices=32, radius=2.15, depth=1.0))
    return cs
def dark_cutters():
    cs = []
    for sx in (-1, 1):
        cs.append(prism_xz([(-.7, 2.45), (.7, 2.45)] + arch_rise(.7, 4.6, 1.15, 8), WF - .5, -2.35, M["sooted"]))
        cs.append(prism_xz([(-.55, 5.7), (.55, 5.7)] + arch_rise(.55, 7.6, .95, 8), WF - .5, -2.5, M["sooted"]))
        for c_ in cs[-2:]: xform(c_, Matrix.Translation((sx * NICHE_X, 0, 0)))
    for x in CANDLE_X:
        cs.append(prism_xz([(x - .28, .3), (x + .28, .3)] + arch_rise(.28, .62, .32, 6), WF - .6, -2.7, M["sooted"]))
    return cs
boolean(wall, cutters()); boolean(wall, dark_cutters(), transfer=True)

# plinth course and string courses
for sx in (-1, 1):
    p = prim("cube", M["stone"], loc=(sx * 7.65, WF - .15, .45), scl=(4.35, .16, .45)); jitter(p, .02, 3, 1)
    boolean(p, [c_ for c_ in dark_cutters() if True], transfer=True)
    prim("cube", M["stone"], loc=(sx * 7.65, WF - .22, .95), scl=(4.4, .12, .07))
    prim("cube", M["stone"], loc=(sx * 7.8, WF - .14, 9.05), scl=(4.2, .14, .12))
# foundation: 3 m into the bank, under steps and vestibule
prim("cube", M["stone"], loc=(0, -.3, -1.55), scl=(12.5, 4.6, 1.5))

# archivolts, jamb shafts and hood mould
for w, rise, y, rad in ((DOOR_W, 4.33, -2.4, .13), (2.85, 4.6, -2.7, .14), (3.2, 4.85, -3.0, .15), (3.45, 5.05, -3.12, .12)):
    pts = [(w, y, .6)] + [(x, y, z) for x, z in arch_rise(w, DOOR_HS, rise, 16)] + [(-w, y, .6)]
    if w > 3.4: pts = [(w + .5, y, DOOR_HS - .1), (w, y, DOOR_HS)] + pts[2:-1] + [(-w, y, DOOR_HS), (-w - .5, y, DOOR_HS - .1)]
    tube(pts, rad, 8, M["stone"], True, "arc")
    if w < 3.4:
        for sx in (-1, 1): prim("cube", M["stone"], loc=(sx * w, y, DOOR_HS + .1), scl=(.2, .2, .1))  # capitals
# statue niches: corbel, canopy, nothing standing on it
for sx in (-1, 1):
    x = sx * NICHE_X
    prim("cube", M["stone"], loc=(x, WF - .2, 2.35), scl=(.5, .28, .1)); prim("cube", M["stone"], loc=(x, WF - .1, 2.12), scl=(.3, .16, .14))
    tube([(x + .82, WF - .08, 4.5)] + [(x + px_, WF - .08, pz) for px_, pz in arch_rise(.82, 4.6, 1.3, 10)] + [(x - .82, WF - .08, 4.5)], .09, 6, M["stone"], True, "canopy")
    prim("ico", M["stone"], loc=(x, WF - .08, 6.05), subdivisions=1, radius=.16)
    tube([(x + .62, WF - .06, 5.7)] + [(x + px_, WF - .06, pz) for px_, pz in arch_rise(.62, 7.6, 1.05, 8)] + [(x - .62, WF - .06, 5.7)], .07, 6, M["stone"], True, "lancet")

# rose window: splayed frame, broken tracery, a few teal shards still caught in the lead
cx, cz = ROSE_C
def ring(r, y, rad, a0=0, a1=2 * math.pi, n=40):
    k = max(4, int(n * (a1 - a0) / (2 * math.pi)))
    return tube([(cx + r * math.cos(a), y, cz + r * math.sin(a)) for a in np.linspace(a0, a1, k)], rad, 6, M["stone"], a1 - a0 < 6.2, "ring")
ring(1.85, -2.6, .13); ring(2.2, WF - .06, .13); ring(.36, -2.0, .09, n=16)
BROKEN = {1, 2, 3}; SH = {4: .55}
for i in range(12):
    if i in BROKEN: continue
    a = i / 12 * 2 * math.pi - math.pi / 2; r1 = 1.82 * SH.get(i, 1)
    d = Vector((math.cos(a), 0, math.sin(a))); p0 = Vector((cx, -2, cz)) + d * .4; p1 = Vector((cx, -2, cz)) + d * r1
    b = prim("cube", M["stone"], scl=(.07, .12, (r1 - .4) / 2)); xform(b, Matrix.Translation((p0 + p1) / 2) @ Vector((0, 0, 1)).rotation_difference(d).to_matrix().to_4x4())
    nxt = (i + 1) % 12
    if nxt not in BROKEN and i not in SH:
        a2 = nxt / 12 * 2 * math.pi - math.pi / 2
        ring(1.15, -2.0, .06, a, a2, 40)
        am = (a + a2) / 2; tube([(cx + 1.8 * math.cos(a + .05), -2, cz + 1.8 * math.sin(a + .05)), (cx + 1.5 * math.cos(am), -2, cz + 1.5 * math.sin(am)), (cx + 1.8 * math.cos(a2 - .05), -2, cz + 1.8 * math.sin(a2 - .05))], .05, 5, M["stone"], True, "foil")
for cell, r0, r1 in ((6, .5, 1.1), (7, 1.2, 1.75), (9, .45, 1.6), (10, 1.2, 1.7), (11, .5, 1.05), (0, 1.25, 1.75), (5, 1.2, 1.7)):
    a = (cell + .5) / 12 * 2 * math.pi - math.pi / 2; bm = bmesh.new(); rr = random.Random(cell)
    pts = [(r0, -.2), (r1, -.22), (r1 * rr.uniform(.85, 1), .2), ((r0 + r1) / 2, rr.uniform(-.05, .24))]
    vs = [bm.verts.new((cx + r * math.cos(a + t), -1.98, cz + r * math.sin(a + t))) for r, t in pts]
    bm.faces.new(vs); me = bpy.data.meshes.new("shard"); bm.to_mesh(me); bm.free(); link(me, "shard", M["teal"])

# buttresses with stepped set-offs and pinnacles; the right door pinnacle snapped and lies in the yard
def pyramid(cx_, cy_, z0, half, hh, mat):
    bm = bmesh.new(); b = [bm.verts.new((cx_ + sx * half, cy_ + sy * half, z0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    ap = bm.verts.new((cx_, cy_, z0 + hh)); bm.faces.new(list(reversed(b)))
    for i in range(4): bm.faces.new((b[i], b[(i + 1) % 4], ap))
    me = bpy.data.meshes.new("pyr"); bm.to_mesh(me); bm.free(); return link(me, "pyr", mat)
def pinnacle(s, broken=False, from_z=0.0):
    parts = [prim("cube", M["stone"], loc=(0, 0, .9), scl=(s / 2, s / 2, .9))]
    if broken:
        for v in parts[0].data.vertices:
            if v.co.z > 1: v.co.z = R.uniform(.35, 1.1)
        parts += rubble(M, 2, (-s / 3, s / 3, -s / 3, s / 3, .9), 77, (.12, .2))
        return parts
    parts.append(prim("cube", M["stone"], loc=(0, 0, 1.85), scl=(s / 2 + .08, s / 2 + .08, .08)))
    parts.append(pyramid(0, 0, 1.9, s * .55, 2.7, M["stone"]))
    for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        parts.append(pyramid(sx * s * .42, sy * s * .42, 1.9, .11, .8, M["stone"]))
        for t in (.22, .45, .68):
            q = Vector((sx * s * .55 * (1 - t), sy * s * .55 * (1 - t), 1.9 + 2.7 * t)) + Vector((sx, sy, .3)) * .08
            parts.append(prim("ico", M["stone"], loc=q, subdivisions=1, radius=.1))
    parts.append(prim("ico", M["stone"], loc=(0, 0, 4.65), subdivisions=1, radius=.17))
    if from_z:
        for o in parts:
            for v in o.data.vertices: v.co.z -= from_z
    return parts
for sx in (-1, 1):
    for x0, x1, prof, ztop in ((3.9, 5.3, [(-1.5, 0), (-4.6, 0), (-4.6, 4.6), (-4.1, 5.3), (-4.1, 8.7), (-3.6, 9.4), (-3.6, 12.2), (-1.5, 12.2)], 12.2),
                                (10.5, 12.15, [(-1.5, 0), (-4.4, 0), (-4.4, 4.0), (-3.9, 4.7), (-3.9, 8.0), (-3.4, 8.7), (-3.4, 10.4), (-.2, 10.4), (-.2, 0)], 10.4)):
        a, b = (x0, x1) if sx > 0 else (-x1, -x0)
        bt = prism_yz(prof, a, b, M["stone"], "buttress"); jitter(bt, .03, 1.5, int(x0 * 10) + sx)
        snapped = sx > 0 and x0 < 6
        ycen = (prof[-2][0] + prof[-3][0]) / 2 if x0 < 6 else -2.0
        parts = pinnacle(1.0 if x0 < 6 else 1.1, broken=snapped)
        for o in parts: xform(o, Matrix.Translation(((a + b) / 2, ycen, ztop)))
# the fallen spire: lying across the flags in front of the right aisle, its break toward the buttress
fall = pinnacle(1.0, from_z=.9)
for o in fall:
    for v in o.data.vertices:
        if v.co.z < .05: v.co.z = R.uniform(-.25, .05) + 0 * v.co.z
    xform(o, Matrix.Translation((7.4, -6.3, .5)) @ Matrix.Rotation(math.radians(-62), 4, "Z") @ Matrix.Rotation(math.radians(-96), 4, "Y"))
rubble(M, 9, (5.6, 9.8, -7.2, -4.8, 0), 31, (.15, .45)); rubble(M, 6, (-11.5, -8.5, -5.4, -4.4, 0), 41, (.15, .4))

# three wide entry steps, worn
for k in range(3):
    st = prim("cube", M["stone"], loc=(0, (-4.5 + .5 * k + WF) / 2, (.2 * (k + 1) - .05) / 2), scl=(3.85, (WF - (-4.5 + .5 * k)) / 2, (.2 * (k + 1) + .05) / 2))
    jitter(st, .025, 2, k)

# vestibule behind the door: sooted walls, floor, rubble, a fallen beam; broken nave walls and charred rafters above
for sx in (-1, 1):
    prof = [(WB - .2, 0), (3.2, 0)] + [(y, z) for y, z in reversed([(-1.2 + i * .7, 10.3 - (i % 3) * .5 - (2.4 if (i > 3 and sx < 0) else 0) - R.uniform(0, .4)) for i in range(7)])]
    prof = [(WB - .2, 0), (4.0, 0)] + sorted([(min(4.0, y), z) for y, z in prof[2:]], reverse=True)
    w_ = prism_yz(prof, sx * 4.0, sx * 4.9, M["sooted"], "navewall"); jitter(w_, .03, 1.5, 50 + sx)
bk = prism_xz([(-4.9, 0), (4.9, 0)] + [(4.9 - i * .7, 5.6 - (i % 2) * .5 - (1.6 if 3 < i < 8 else 0)) for i in range(15)], 3.2, 4.0, M["sooted"], "backwall")
prim("cube", M["sooted"], loc=(0, 1.1, .3), scl=(4.0, 2.2, .3))
rubble(M, 22, (-3.6, 3.6, -.6, 3.0, .6), 61, (.18, .55), "sooted"); rubble(M, 8, (-3.5, -1.0, 2.2, 3.1, .9), 62, (.3, .6), "sooted")
def beam(a, b, w, mat, jag=0, seed=0):
    a, b = Vector(a), Vector(b); d = b - a; L = d.length; rr = random.Random(seed)
    o = prim("cube", mat, scl=(w / 2, w / 2, L / 2))
    if jag:
        for v in o.data.vertices:
            if v.co.z > 0: v.co.z += rr.uniform(-jag, 0); v.co.x *= rr.uniform(.4, 1)
    xform(o, Matrix.Translation((a + b) / 2) @ Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4())
    jitter(o, w * .1, 2, seed); return o
beam((-3.2, .2, .75), (2.6, 2.3, 1.9), .32, M["char"], seed=3)
RIDGE = 14.2
for i, y in enumerate((-.6, .5, 1.6, 2.7, 3.6)):
    for sx in (-1, 1):
        keep = R.uniform(.25, 1.0) if (i + (sx > 0)) % 3 else 0
        if keep == 0: continue
        a = Vector((sx * 4.45, y, 9.6)); b = a.lerp(Vector((0, y, RIDGE)), keep)
        beam(a, b, .26, M["char"], .35 if keep < .95 else 0, i * 7 + sx)
beam((-.2, -.9, RIDGE), (-.1, 1.2, RIDGE - .1), .3, M["char"], .3, 99)
beam((-4.4, 2.0, 9.9), (1.6, 2.4, 6.0), .28, M["char"], .3, 98)   # a tie beam fell and caught
for k, (y0, y1) in enumerate(((-.9, .9), (-.8, .2))):
    sx = -1 if k == 0 else 1
    pts = [(0, -.95, RIDGE + .25)]; sl = slab_pts = None
    a = Vector((sx * .2, y0, RIDGE - .05)); b = Vector((sx * 3.2, y0, RIDGE - .05 - 3.0 * (4 / 4.45)))
    bm = bmesh.new(); L = (b - a).length; dirv = (b - a).normalized()
    vs = [bm.verts.new(a + Vector((0, 0, .18))), bm.verts.new(b + Vector((0, 0, .18))), bm.verts.new(b + Vector((0, y1 - y0, .18))), bm.verts.new(a + dirv * L * .4 + Vector((0, y1 - y0, .18)))]
    f = bm.faces.new(vs); r_ = bmesh.ops.extrude_face_region(bm, geom=[f]); bmesh.ops.translate(bm, verts=[e for e in r_["geom"] if isinstance(e, bmesh.types.BMVert)], vec=(0, 0, .1))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); me = bpy.data.meshes.new("roof"); bm.to_mesh(me); bm.free(); link(me, "roof", M["slate"])

# charred oak door stumps still hanging on their iron hinges
def leaf(hx, sgn, ang, heights, seed):
    rr = random.Random(seed); hinge = Vector((hx, -1.65, .6)); d = Vector((sgn * math.cos(ang), math.sin(ang), 0)); nrm = Vector((-d.y, d.x, 0))
    for i, hgt in enumerate(heights):
        c0 = hinge + d * (.27 + .5 * i)
        p = prim("cube", M["char"], scl=(.24, .065, hgt / 2))
        for v in p.data.vertices:
            if v.co.z > 0: v.co.z += rr.uniform(-.3, .1) * min(1, hgt); v.co.x *= rr.uniform(.6, 1.1)
        xform(p, Matrix.Translation(c0 + Vector((0, 0, hgt / 2))) @ Matrix.Rotation(math.atan2(d.y, d.x), 4, "Z")); jitter(p, .02, 4, seed + i)
    for zs, L in ((.95, sum(1 for hh in heights if hh > .5) * .5 + .3), (2.15, sum(1 for hh in heights if hh > 1.7) * .5 + .45)):
        if L < .5: continue
        s0 = hinge + Vector((0, 0, zs - .6)) - nrm * .085 * 0
        pts = [s0 + d * t * L for t in np.linspace(0, 1, 6)]; pts[-1] = pts[-1] + Vector((0, 0, -.35))
        tube([p_ + nrm * .08 for p_ in pts], .045, 4, M["iron"], True, "strap"); tube([p_ - nrm * .08 for p_ in pts], .045, 4, M["iron"], True, "strap")
    for zs in (.95, 2.15, 3.4, 5.0):
        prim("cyl", M["iron"], loc=(hx - sgn * .08, -1.65, zs + .6 - .6), vertices=8, radius=.07, depth=.32)
    s0 = Vector((hx, -1.65, 3.4)); tube([s0, s0 + d * .3 + Vector((0, 0, -.25)), s0 + d * .45 + Vector((0, 0, -.75))], .04, 4, M["iron"], True, "strap")
leaf(-2.45, 1, math.radians(58), [2.7, 2.2, 1.5, .9, .45], 11)
leaf(2.45, -1, math.radians(24), [1.9, 1.3, .7, .35], 12)

# the wax that poured out of the dark interior and froze down the steps
els = [("ELLIPSOID", (.2, 1.9, .9), 1.9, (1.5, 1.2, .8)), ("BALL", (-1.1, 2.5, 1.0), 1.4, ()), ("BALL", (1.3, 1.3, .9), 1.2, ()), ("BALL", (-.4, 2.9, 1.8), 1.0, ())]
for t in np.linspace(0, 1, 9):
    y = .9 - t * 3.7; els.append(("ELLIPSOID", (.35 * math.sin(t * 4), y, .72), 1.0, (1.2 + t * .5, .9, .32)))
for ztop, ymid, yedge in ((.6, -3.25, -3.5), (.4, -3.75, -4.0), (.2, -4.25, -4.5)):
    for x in (-.9, .2, 1.1):
        els.append(("ELLIPSOID", (x + R.uniform(-.3, .3), ymid, ztop + .1), .75, (1.2, .55, .3)))
    for k in range(4):
        x = R.uniform(-1.6, 1.8); els.append(("BALL", (x, yedge + .05, ztop - .05), .32, ())); els.append(("BALL", (x, yedge + .02, ztop - .25), .22, ()))
for y, w, x in ((-4.9, 2.2, .3), (-5.5, 1.8, -.6), (-5.3, 1.2, 1.7), (-6.0, 1.0, -1.4)):
    els.append(("ELLIPSOID", (x, y, .08), 1.0, (w, .9, .22)))
metawax(els, M["wax"], .13, 1.0, "waxpour")
am = [("ELLIPSOID", (.5 + .3 * math.sin(t * 5), .4 - t * 4.6, .75 - max(0, t - .6) * 1.6), .7, (.8, 1.0, .3)) for t in np.linspace(0, 1, 10)] + [("ELLIPSOID", (-.9, -5.6, .1), .7, (1.2, .8, .2))]
metawax(am, M["waxamber"], .12, 1.0, "waxamber")
for o in [o for o in bpy.context.scene.objects if o.name.startswith("wax")]:
    n0 = len(o.data.polygons)
    if n0 > 3500:
        d = o.modifiers.new("dec", "DECIMATE"); d.ratio = 3500 / n0
        bpy.ops.object.select_all(action="DESELECT"); bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.modifier_apply(modifier="dec")

# candle niches along the plinth, stub candles on the top step and the plinth ledge
for i, x in enumerate(CANDLE_X):
    for k, (dx, hh) in enumerate(((-.12, .16), (.02, .26), (.15, .1))):
        candle(M, (x + dx, WF + .2, .3), hh, .055, True, i * 5 + k)
    m = prim("sph", M["wax"], loc=(x, WF - .2, .02), segments=8, ring_count=5, radius=1); xform(m, Matrix.Translation((x, WF - .25, .03)) @ Matrix.Diagonal((.5, .3, .08, 1)) @ Matrix.Translation((-x, -(WF - .25), -.03)))
for sx in (-1, 1):
    for k in range(6):
        candle(M, (sx * (3.2 - R.uniform(0, .6)), R.uniform(-3.45, -3.1), .6), R.uniform(.08, .32), R.uniform(.05, .08), True, 70 + k + sx * 10)
    for k in range(5):
        candle(M, (sx * R.uniform(5.6, 10), WF - .25, 1.02), R.uniform(.06, .2), .05, k % 2 == 0, 90 + k + sx * 10)

def planar_facade(me):
    st = next(i for i, m in enumerate(me.materials) if m.name == "stone"); fa = next(i for i, m in enumerate(me.materials) if m.name == "facade")
    uv = me.uv_layers["UVMap"]
    for p in me.polygons:
        if p.material_index != fa: continue
        if p.normal.y < -.9 and p.center.y < WF + .02:
            for li in p.loop_indices:
                co = me.vertices[me.loops[li].vertex_index].co
                uv.data[li].uv = ((co.x - FX0) / (FX1 - FX0), (co.z - FOUND - FZ0) / (FZ1 - FZ0))
        else: p.material_index = st
o = finish("abbey-facade", post=planar_facade)
print("FILES", proof("abbey-facade", (0, -2, 6.5), 42, [(0, -6, 2, 900), (3, -1, 4, 400), (-8, -6, 3, 500)]))
