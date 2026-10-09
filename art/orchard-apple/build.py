# Saint Corvin's black-apple orchard hero trees, one pass: geometry -> materials -> AO -> rig + "Sway" -> proof -> GLB.
# blender -b --factory-startup --python-exit-code 1 --python art/orchard-apple/build.py -- appleA|appleB|appleC
# Blender +Y is the front (exports as glTF -Z, the engine's facing). Ground at z=0, roots sink to z=-0.2.
import bpy, math, sys, os, json, struct, random
from mathutils import Vector, Matrix, noise as mnoise

NAME = sys.argv[sys.argv.index("--") + 1]
TEX = "/workspace/orchard/tex"; OUT = "/workspace/orchard/out"; PROOF = "/tmp/orchard"
os.makedirs(OUT, exist_ok=True); os.makedirs(PROOF, exist_ok=True)
UP = Vector((0, 0, 1)); FRONT = math.pi / 2
BARK, LEAF, FRUIT = 0, 1, 2
CELLS = {0: (0.0, 0.5), 1: (0.5, 0.5), 2: (0.0, 0.0), 3: (0.5, 0.0)}
# limbs: (azimuth deg, elevation deg, length m, alive)
SPECS = {
  "appleA": dict(seed=11, H=5.5, trunk_h=1.75, trunk_r=0.26, flare=0.95, lean=0, twist=1.6, lobes=0.12, burls=5, sides=26,
                 split=True, hollow=False, fallen=False, roots=8, root_len=(1.2, 1.6), root_r=0.5,
                 limbs=[(35, 50, 4.2, 1), (155, 47, 4.4, 1), (268, 53, 4.0, 1)], limb_r=0.17, droop=0.17, gnarl=0.16,
                 nsec=(5, 7), leaf=0.3, cluster=False, apples=5),
  "appleB": dict(seed=23, H=4.5, trunk_h=1.5, trunk_r=0.21, flare=0.85, lean=15, twist=1.0, lobes=0.10, burls=3, sides=22,
                 split=False, hollow=False, fallen=False, roots=7, root_len=(1.0, 1.4), root_r=0.5,
                 limbs=[(-30, 50, 3.5, 1), (45, 55, 3.2, 1), (185, 38, 2.1, 0)], limb_r=0.15, droop=0.2, gnarl=0.17,
                 nsec=(5, 6), leaf=0.0, cluster=True, apples=16),
  "appleC": dict(seed=37, H=6.0, trunk_h=2.1, trunk_r=0.40, flare=0.8, lean=0, twist=1.2, lobes=0.14, burls=6, sides=32,
                 split=False, hollow=True, fallen=True, roots=10, root_len=(1.4, 2.0), root_r=0.42,
                 limbs=[(10, 50, 4.7, 1), (130, 55, 4.5, 1), (250, 50, 4.9, 1)], limb_r=0.23, droop=0.15, gnarl=0.15,
                 nsec=(6, 8), leaf=0.25, cluster=False, apples=6),
}
sp = SPECS[NAME]; rng = random.Random(sp["seed"])

def sstep(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def angd(a, b): return (a - b + math.pi) % (2 * math.pi) - math.pi
def rvec(): return Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1)))
def taper(r0, r1, n, p=1.0): return [r1 + (r0 - r1) * (1 - i / (n - 1)) ** p for i in range(n)]
def wmix(*pairs):
    o = {}
    for w, f in pairs:
        for k, v in w.items(): o[k] = o.get(k, 0) + v * f
    return {k: v for k, v in o.items() if v > 1e-4}
def shift(w, li, amt):
    if li is None or f"Limb{li}" not in w: return dict(w)
    w = dict(w); a = w[f"Limb{li}"] * amt; w[f"Limb{li}"] -= a; w[f"Tip{li}"] = w.get(f"Tip{li}", 0) + a
    return {k: v for k, v in w.items() if v > 1e-4}

class Geo:
    def __init__(s): s.V = []; s.F = []; s.FM = []; s.FUV = []; s.W = []; s.C = []
    def v(s, p, w, c=1.0): s.V.append(Vector(p)); s.W.append(w or {"Root": 1.0}); s.C.append(c); return len(s.V) - 1
    def f(s, ids, uvs, m): s.F.append(tuple(ids)); s.FUV.append(uvs); s.FM.append(m)
G = Geo()

def frames(pts):
    n = len(pts); T = [(pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized() for i in range(n)]
    ref = UP if abs(T[0].z) < 0.9 else Vector((1, 0, 0))
    N = [T[0].cross(ref).normalized()]
    for i in range(1, n):
        nn = N[-1] - T[i] * N[-1].dot(T[i])
        N.append(nn.normalized() if nn.length > 1e-6 else T[i].orthogonal().normalized())
    return T, N, [T[i].cross(N[i]) for i in range(n)]

def tube(pts, radii, sides, prof=None, W=None, cap="point", cap0=False, mat=BARK, texm=1.2):
    n = len(pts); T, N, B = frames(pts); W = W or [{"Root": 1.0}] * n
    circ = 2 * math.pi * radii[0]; urep = max(1, round(circ / texm)); unit = circ / urep
    uo, vo = rng.random(), rng.random()
    vs = [0.0]
    for i in range(1, n): vs.append(vs[-1] + (pts[i] - pts[i - 1]).length)
    rings = []
    for i in range(n):
        ring = []
        for k in range(sides):
            th = 2 * math.pi * k / sides; d = N[i] * math.cos(th) + B[i] * math.sin(th)
            m, c = prof(th, i, d) if prof else (1.0, 1.0)
            ring.append(G.v(pts[i] + d * radii[i] * m, W[i], c))
        rings.append(ring)
    U = lambda k: k / sides * urep + uo
    Vv = lambda i: vs[i] / unit + vo
    for i in range(n - 1):
        for k in range(sides):
            k2 = (k + 1) % sides
            G.f((rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k]),
                [(U(k), Vv(i)), (U(k + 1), Vv(i)), (U(k + 1), Vv(i + 1)), (U(k), Vv(i + 1))], mat)
    r = radii[-1]
    if cap == "jag":
        for vi in rings[-1]: G.V[vi] = G.V[vi] + T[-1] * rng.uniform(-0.6, 0.9) * r
        ci = G.v(pts[-1] - T[-1] * r * 0.3, W[-1], 0.45)
    elif cap == "point":
        ci = G.v(pts[-1] + T[-1] * r * 1.4, W[-1], 1.0)
    if cap:
        vt = Vv(n - 1) + r / unit
        for k in range(sides):
            k2 = (k + 1) % sides
            G.f((rings[-1][k], rings[-1][k2], ci), [(U(k), Vv(n - 1)), (U(k + 1), Vv(n - 1)), (U(k + 0.5), vt)], mat)
    if cap == "jag":
        for q in range(rng.randint(3, 5)):
            a = rng.uniform(0, 6.283); off = (N[-1] * math.cos(a) + B[-1] * math.sin(a)) * r * rng.uniform(0.15, 0.7)
            L = r * rng.uniform(0.7, 2.0); b0 = pts[-1] + off - T[-1] * r * 0.2; dv = (T[-1] + rvec() * 0.3).normalized()
            tube([b0, b0 + dv * L * 0.5, b0 + dv * L], [r * 0.24, r * 0.15, r * 0.06], 3, None, [W[-1]] * 3, "point", False, mat)
    if cap0:
        c0 = G.v(pts[0] - T[0] * radii[0] * 0.8, W[0], 1.0)
        for k in range(sides):
            k2 = (k + 1) % sides
            G.f((rings[0][k2], rings[0][k], c0), [(U(k + 1), Vv(0)), (U(k), Vv(0)), (U(k + 0.5), Vv(0) - radii[0] / unit)], mat)
    return rings, T

def grow(start, d, length, nseg, gnarl, droop, lift=0.0):
    pts = [Vector(start)]; dd = Vector(d).normalized(); step = length / nseg
    for i in range(1, nseg + 1):
        t = i / nseg
        dd = (dd + rvec() * gnarl + Vector((0, 0, lift * (1 - t) - droop * t))).normalized()
        pts.append(pts[-1] + dd * step)
    return pts

def branch_prof(n, lobes, nb):
    lob = [(k, rng.uniform(.4, 1) * lobes / k ** .5, rng.uniform(0, 6.28)) for k in (2, 3, 5)]
    tw = rng.uniform(-1.5, 1.5)
    bur = [(rng.uniform(0, 6.28), rng.uniform(.1, .8), rng.uniform(.4, .7), rng.uniform(.1, .25)) for _ in range(nb)]
    def f(th, i, d):
        s = i / max(1, n - 1); ph = th + tw * s
        m = 1 + sum(a * math.sin(k * ph + p) for k, a, p in lob)
        for ba, bs, bw, am in bur: m += am * math.exp(-(angd(ph, ba) / bw) ** 2 - ((s - bs) / 0.07) ** 2)
        return m, 1.0
    return f

# ---------------- trunk
H = sp["trunk_h"]; lean = math.radians(sp["lean"]); ax = Vector((-math.sin(lean), 0, math.cos(lean)))
nT = max(12, int((H + 0.2) / 0.11)); Pt, zs, Rt = [], [], []
sd = rng.uniform(0, 50)
for i in range(nT + 1):
    s = i / nT; z = -0.2 + (H + 0.2) * s
    wob = Vector((mnoise.noise(Vector((s * 1.8, sd, 0.5))), mnoise.noise(Vector((sd, s * 1.8, 2.5))), 0)) * 0.22 * max(0, z) / H
    Pt.append(ax * (z / ax.z) + wob); zs.append(z)
    Rt.append(sp["trunk_r"] * (1 + sp["flare"] * math.exp(-max(z, 0) / 0.3)) * (1 - 0.12 * s))
def idx_at(z): return min(range(len(zs)), key=lambda i: abs(zs[i] - z))
lob = [(k, rng.uniform(.5, 1) * sp["lobes"] / k ** .4, rng.uniform(0, 6.28)) for k in (2, 3, 4, 6)]
bur = [(rng.uniform(0, 6.28), rng.uniform(.2, .85), rng.uniform(.3, .5), rng.uniform(.12, .24)) for _ in range(sp["burls"])]
def tprof(th, i, d):
    z = zs[i]; az = math.atan2(d.y, d.x); ph = az + sp["twist"] * max(z, 0) / H
    low = 1 + 1.2 * math.exp(-max(z, 0) / 0.4)
    m = 1 + sum(a * math.sin(k * ph + p) for k, a, p in lob) * low * 0.8
    c = 1.0
    for ba, bs, bw, am in bur: m += am * math.exp(-(angd(ph, ba) / bw) ** 2 - ((z / H - bs) / 0.08) ** 2)
    m = max(m, 0.4)
    if sp["split"]:
        win = sstep(0.15, 0.3, z / H) * (1 - sstep(0.6, 0.72, z / H))
        g = math.exp(-(angd(ph, FRONT) / 0.17) ** 2) * win
        lip = math.exp(-((abs(angd(ph, FRONT)) - 0.33) / 0.1) ** 2) * win
        m = m * (1 - 0.6 * g) + 0.1 * lip; c *= 1 - 0.85 * g
    if sp["hollow"]:
        da = abs(angd(az, FRONT)); top = 1.05 - 0.4 * (da / 0.75) ** 2
        ma = 1 - sstep(0.4, 0.78, da); mh = sstep(-0.02, 0.1, z) * (1 - sstep(top - 0.22, top, z))
        hm = ma * mh
        m = m * (1 - 0.78 * hm) + (0.14 * math.exp(-((hm - 0.1) / 0.08) ** 2) if hm > 0.005 else 0)
        c *= 1 - 0.93 * sstep(0.25, 0.85, hm)
    return m, c
Wt = []
for z in zs:
    wr = 1 - sstep(0.0, 0.45, z); w2 = sstep(0.4, 0.95, max(z, 0) / H)
    Wt.append(wmix(({"Root": 1}, wr), ({"Trunk": 1}, (1 - wr) * (1 - w2)), ({"Trunk2": 1}, (1 - wr) * w2)))
tube(Pt, Rt, sp["sides"], tprof, Wt, "point")
iz = idx_at(0.4); im_ = idx_at(H * 0.55)
BONES = [("Root", Vector((0, 0, -0.2)), Vector((0, 0, 0.4)), None), ("Trunk", Pt[iz].copy(), Pt[im_].copy(), "Root"),
         ("Trunk2", Pt[im_].copy(), Pt[-1].copy(), "Trunk")]

# ---------------- roots
for j in range(sp["roots"]):
    a = 2 * math.pi * j / sp["roots"] + rng.uniform(-0.25, 0.25); L = rng.uniform(*sp["root_len"])
    r0 = sp["trunk_r"] * sp["root_r"] * rng.uniform(0.75, 1.15) * (1.25 if math.cos(a) > 0.5 and sp["lean"] else 1)
    ph = rng.uniform(0, 6.28); ns = 12; P, Rr = [], []
    for k in range(ns + 1):
        t = k / ns; rho = sp["trunk_r"] * 0.55 + L * t; aa = a + 0.22 * math.sin(t * 5 + ph) * t
        z = 0.5 * (1 - t) ** 2.2 + 0.03 + 0.035 * math.sin(t * 14 + ph) * (1 - t) - 0.28 * sstep(0.72, 1.0, t)
        P.append(Vector((math.cos(aa) * rho, math.sin(aa) * rho, max(z, -0.19))))
        Rr.append((r0 * (1 - t) ** 1.25 + 0.022) * (1 + 0.22 * max(0, math.sin(t * 14 + ph))))
    tube(P, Rr, 9, None, [{"Root": 1}] * len(P), "point")
    if rng.random() < 0.7:
        k = rng.randint(4, 6); b = a + rng.choice([-1, 1]) * rng.uniform(0.4, 0.8); L2 = L * rng.uniform(0.4, 0.6)
        Q = [P[k] + Vector((math.cos(b), math.sin(b), 0)) * L2 * t + Vector((0, 0, -0.2 * sstep(0.6, 1, t))) for t in (0, .25, .5, .75, 1)]
        for q in Q: q.z = max(q.z, -0.19)
        tube(Q, taper(Rr[k] * 0.6, 0.02, 5), 6, None, [{"Root": 1}] * 5, "point")

# ---------------- limbs and their branching
TIPS, TWIG = [], []
def children(P, R, W, li, alive, level):
    if level == 1: n = rng.randint(*sp["nsec"]) if alive else rng.randint(2, 3); Lr = (0.9, 1.7); sides = 7; nseg = 6; rmax = 0.085
    elif level == 2: n = rng.randint(2, 3); Lr = (0.4, 0.75); sides = 5; nseg = 4; rmax = 0.04
    else: n = rng.randint(1, 2); Lr = (0.25, 0.45); sides = 4; nseg = 3; rmax = 0.022
    m = len(P)
    for j in range(n):
        t = 0.25 + 0.68 * (j + rng.random() * 0.7) / n if level == 1 else 0.35 + 0.6 * rng.random()
        idx = min(m - 2, int(t * (m - 1)))
        T = (P[idx + 1] - P[idx]).normalized()
        side = T.cross(Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.3, 1))))
        if side.length < 1e-3: continue
        d = (T * 0.55 + side.normalized() * 0.8 + UP * 0.3).normalized()
        length = rng.uniform(*Lr) * (1.15 - 0.45 * t) * (1 if alive else 0.7)
        r0 = min(R[idx] * 0.6, rmax)
        Q = grow(P[idx] - d * R[idx] * 0.2, d, length, nseg, 0.3, 0.25)
        Rq = taper(r0, max(0.008, r0 * 0.25), nseg + 1)
        Wq = [shift(W[idx], li, 0.6 * k / nseg) for k in range(nseg + 1)]
        jag = (not alive) and rng.random() < 0.5
        tube(Q, Rq, sides, branch_prof(nseg + 1, 0.06, 0) if level == 1 else None, Wq, "jag" if jag else "point")
        TWIG.append((Q[nseg // 2], Wq[nseg // 2], alive))
        if not jag: TIPS.append((Q[-1], (Q[-1] - Q[-2]).normalized(), Wq[-1], alive))
        if level < 3 and not jag: children(Q, Rq, Wq, li, alive, level + 1)

top = Pt[-1]; Ttop = (Pt[-1] - Pt[-2]).normalized()
for li, (az, el, length, alive) in enumerate(sp["limbs"], 1):
    a = math.radians(az + rng.uniform(-8, 8)); e = math.radians(el + rng.uniform(-5, 5))
    dh = Vector((math.cos(a), math.sin(a), 0)); d = dh * math.cos(e) + UP * math.sin(e)
    ns = 14 if alive else 9
    P = grow(top - Ttop * 0.45 + dh * Rt[-1] * 0.35, d, length, ns, sp["gnarl"], sp["droop"] * (1 if alive else 0.6), 0.05)
    R = taper(sp["limb_r"] * (1 if alive else 0.85), 0.035 if alive else 0.075, ns + 1, 0.85)
    W = []
    for i in range(ns + 1):
        t = i / ns; wt = sstep(0.3, 0.7, t); w0 = 1 - sstep(0, 0.15, t)
        W.append(wmix(({"Trunk2": 1}, w0 * (1 - wt)), ({f"Limb{li}": 1}, (1 - w0) * (1 - wt)), ({f"Tip{li}": 1}, wt)))
    tube(P, R, 14 if sp["limb_r"] > 0.2 else 12, branch_prof(ns + 1, 0.1, 2), W, "point" if alive else "jag")
    if alive: TIPS.append((P[-1], (P[-1] - P[-2]).normalized(), W[-1], True))
    children(P, R, W, li, bool(alive), 1)
    mid = ns // 2
    BONES += [(f"Limb{li}", P[0].copy(), P[mid].copy(), "Trunk2"), (f"Tip{li}", P[mid].copy(), P[-1].copy(), f"Limb{li}")]

# ---------------- broken stubs (all), fallen limb + hollow sap (C), split sap (A)
for q in range(2):
    i0 = idx_at(rng.uniform(0.6, 0.95) * H); a = rng.uniform(0, 6.28)
    if sp["hollow"] and abs(angd(a, FRONT)) < 0.9: a += math.pi
    dh = Vector((math.cos(a), math.sin(a), 0)); st = Pt[i0] + dh * Rt[i0] * 0.3
    P = [st + (dh * 0.9 + UP * 0.35).normalized() * (0.3 * k / 2) for k in range(3)]
    tube(P, taper(0.09, 0.075, 3), 8, None, [Wt[i0]] * 3, "jag")
def ribbon(path, outs, widths, w):
    prev = None
    for i, (p, o, wd) in enumerate(zip(path, outs, widths)):
        side = UP.cross(o).normalized(); a = G.v(p + o * 0.012 - side * wd / 2, w); b = G.v(p + o * 0.012 + side * wd / 2, w)
        v = 0.02 + 0.46 * i / (len(path) - 1)
        if prev: G.f((prev[0], prev[1], b, a), [(0.1, prev[2]), (0.9, prev[2]), (0.9, v), (0.1, v)], FRUIT)
        prev = (a, b, v)
def pool(c, r, w):
    ci = G.v(c, w); ring = []
    for k in range(9):
        th = 2 * math.pi * k / 9; rr = r * (1 + 0.3 * rng.random()); ring.append((G.v(c + Vector((math.cos(th) * rr, math.sin(th) * rr * 0.8, 0)), w), th))
    for k in range(9):
        (a, ta), (b, tb) = ring[k], ring[(k + 1) % 9]
        G.f((ci, a, b), [(0.5, 0.25), (0.5 + 0.4 * math.cos(ta), 0.25 + 0.2 * math.sin(ta)), (0.5 + 0.4 * math.cos(tb), 0.25 + 0.2 * math.sin(tb))], FRUIT)
if sp["split"]:
    path, outs, wds = [], [], []
    for i in range(len(zs) - 1, 0, -1):
        z = zs[i]
        if z > H * 0.62 or z < 0.02: continue
        azs = FRONT - sp["twist"] * z / H; o = Vector((math.cos(azs), math.sin(azs), 0))
        m, _ = tprof(None, i, o); inside = z > H * 0.17
        path.append(Pt[i] + o * Rt[i] * m); outs.append(o); wds.append(0.065 if inside else 0.03 + 0.02 * z / H)
    ribbon(path, outs, wds, {"Root": 1}); pool(path[-1] + outs[-1] * 0.22 + Vector((0, 0, -path[-1].z + 0.015)), 0.16, {"Root": 1})
if sp["hollow"]:
    pool(Vector((0, Rt[0] * 0.42, 0.05)), 0.15, {"Root": 1})
if sp["fallen"]:
    i0 = idx_at(1.85); a = math.radians(55); dh = Vector((math.cos(a), math.sin(a), 0)); st = Pt[i0] + dh * Rt[i0] * 0.4
    P = [st + (dh * 0.9 + UP * 0.45).normalized() * (0.55 * k / 3) for k in range(4)]
    tube(P, taper(0.17, 0.14, 4), 10, None, [Wt[i0]] * 4, "jag")
    Q = grow(Vector((2.7, -0.9, 0.0)), Vector((-0.6, 0.78, 0.0)), 2.7, 10, 0.1, 0.0)
    Rq = taper(0.045, 0.15, len(Q))
    for i, q in enumerate(Q): q.z = Rq[i] * 0.85 + 0.18 * sstep(0.6, 1.0, i / (len(Q) - 1))
    tube(Q, Rq, 10, branch_prof(len(Q), 0.08, 1), [{"Root": 1}] * len(Q), "jag", True)
    children(Q, Rq, [{"Root": 1}] * len(Q), None, False, 2)

# ---------------- twig cards, leaves, apples
def card(base, axv, side, L, Wd, cell, w):
    u0, v0 = CELLS[cell]; e = 0.006
    p0 = base - side * Wd / 2; p1 = base + side * Wd / 2
    ids = [G.v(p, w) for p in (p0, p1, p1 + axv * L, p0 + axv * L)]
    G.f(ids, [(u0 + e, v0 + e), (u0 + .5 - e, v0 + e), (u0 + .5 - e, v0 + .5 - e), (u0 + e, v0 + .5 - e)], LEAF)
for (p, d, w, alive) in TIPS:
    axv = (d + UP * 0.15).normalized(); s1 = axv.cross(rvec()).normalized(); s2 = axv.cross(s1).normalized()
    L = rng.uniform(0.5, 0.85); Wd = rng.uniform(0.45, 0.7)
    cell = 1 if (alive and rng.random() < sp["leaf"]) else 0
    card(p - axv * 0.12, axv, s1, L, Wd, cell, w); card(p - axv * 0.12, axv, s2, L, Wd, cell, w)
def cluster(p, d, w, cells):
    hd = Vector((d.x, d.y, 0)); hd = hd.normalized() if hd.length > 1e-3 else Vector((1, 0, 0))
    hd = Matrix.Rotation(rng.uniform(-1.2, 1.2), 3, 'Z') @ hd; dip = math.radians(rng.uniform(15, 65))
    card(p, (hd * math.cos(dip) - UP * math.sin(dip)).normalized(), UP.cross(hd).normalized(), rng.uniform(0.38, 0.55), rng.uniform(0.38, 0.5), rng.choice(cells), w)
for (p, d, w, alive) in TIPS:
    if sp["cluster"] and alive:
        for _ in range(rng.randint(2, 3)): cluster(p - d * rng.uniform(0, 0.25), d, w, [2, 2, 3])
    elif alive and rng.random() < 0.1: cluster(p, d, w, [3])
for (p, w, alive) in TWIG:
    if sp["cluster"] and alive and rng.random() < 0.4: cluster(p, rvec(), w, [2, 3])
def apple(c, r, w):
    nu, nv = 8, 6; top = G.v(c + Vector((0, 0, r * 0.8)), w); bot = G.v(c - Vector((0, 0, r * 0.9)), w); rows = []
    for j in range(1, nv):
        phi = math.pi * j / nv; rr = r * math.sin(phi); z = r * math.cos(phi) * 0.92; row = []
        for k in range(nu):
            th = 2 * math.pi * k / nu; wr = 1 + 0.14 * mnoise.noise(Vector((c.x * 9 + k, c.y * 7 + j, c.z * 5)))
            row.append(G.v(c + Vector((math.cos(th) * rr * wr, math.sin(th) * rr * wr, z)), w))
        rows.append(row)
    UV = lambda k, j: (k / nu, 0.5 + 0.5 * (1 - j / nv))
    for k in range(nu):
        k2 = (k + 1) % nu
        G.f((top, rows[0][k], rows[0][k2]), [UV(k + .5, 0), UV(k, 1), UV(k + 1, 1)], FRUIT)
        for j in range(nv - 2):
            G.f((rows[j][k], rows[j + 1][k], rows[j + 1][k2], rows[j][k2]), [UV(k, j + 1), UV(k, j + 2), UV(k + 1, j + 2), UV(k + 1, j + 1)], FRUIT)
        G.f((bot, rows[-1][k2], rows[-1][k]), [UV(k + .5, nv), UV(k + 1, nv - 1), UV(k, nv - 1)], FRUIT)
cand = [t for t in TWIG if t[2]]; rng.shuffle(cand)
for (p, w, alive) in cand[:sp["apples"]]:
    sl = rng.uniform(0.05, 0.12); r = rng.uniform(0.045, 0.06)
    tube([p, p - Vector((0, 0, sl * 0.5)), p - Vector((0, 0, sl))], [0.008, 0.007, 0.006], 3, None, [w] * 3, None)
    apple(p - Vector((0, 0, sl + r * 0.8)), r, w)

# ---------------- size to spec: uniform scale to the target height, roots clamp at -0.2
topz = max(v.z for v in G.V); S = sp["H"] / topz
G.V = [Vector((v.x * S, v.y * S, max(v.z * S, -0.2))) for v in G.V]
BONES = [(n, h * S, t * S, p) for n, h, t, p in BONES]
xs = [v.x for v in G.V]; ys = [v.y for v in G.V]
print("SIZE", NAME, "scale %.3f" % S, "x %.2f..%.2f y %.2f..%.2f" % (min(xs), max(xs), min(ys), max(ys)))

# ---------------- scene, mesh, materials
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
me = bpy.data.meshes.new(NAME); me.from_pydata([tuple(v) for v in G.V], [], G.F); me.update()
ob = bpy.data.objects.new(NAME, me); scene.collection.objects.link(ob)
def img(path, noncolor=False):
    im = bpy.data.images.load(path)
    if noncolor: im.colorspace_settings.name = "Non-Color"
    return im
def sock(node, name, typ, out=False):
    for s_ in (node.outputs if out else node.inputs):
        if s_.name == name and s_.type == typ: return s_
def mk(name):
    m = bpy.data.materials.new(name); m.use_nodes = True; return m, m.node_tree, m.node_tree.nodes["Principled BSDF"]
mb, nt, b = mk("bark")
t_alb = nt.nodes.new("ShaderNodeTexImage"); t_alb.image = img(TEX + "/bark_albedo.jpg")
t_nrm = nt.nodes.new("ShaderNodeTexImage"); t_nrm.image = img(TEX + "/bark_normal.png", True)
nmap = nt.nodes.new("ShaderNodeNormalMap"); nmap.inputs["Strength"].default_value = 1.0
nt.links.new(t_nrm.outputs["Color"], nmap.inputs["Color"]); nt.links.new(nmap.outputs["Normal"], b.inputs["Normal"])
vcn = nt.nodes.new("ShaderNodeVertexColor"); vcn.layer_name = "Col"
mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"; mix.inputs[0].default_value = 1.0
nt.links.new(t_alb.outputs["Color"], sock(mix, "A", "RGBA")); nt.links.new(vcn.outputs["Color"], sock(mix, "B", "RGBA"))
nt.links.new(sock(mix, "Result", "RGBA", True), b.inputs["Base Color"])
b.inputs["Roughness"].default_value = 0.5; b.inputs["Metallic"].default_value = 0.0; mb.use_backface_culling = True
ml, nt2, b2 = mk("leaves")
t_lf = nt2.nodes.new("ShaderNodeTexImage"); t_lf.image = img(TEX + "/leaves_atlas.png")
nt2.links.new(t_lf.outputs["Color"], b2.inputs["Base Color"]); nt2.links.new(t_lf.outputs["Alpha"], b2.inputs["Alpha"])
b2.inputs["Roughness"].default_value = 0.85; ml.use_backface_culling = False
mf, nt3, b3 = mk("fruit")
t_fr = nt3.nodes.new("ShaderNodeTexImage"); t_fr.image = img(TEX + "/fruit.png")
t_em = nt3.nodes.new("ShaderNodeTexImage"); t_em.image = img(TEX + "/fruit_emit.png")
nt3.links.new(t_fr.outputs["Color"], b3.inputs["Base Color"]); nt3.links.new(t_em.outputs["Color"], b3.inputs["Emission Color"])
b3.inputs["Emission Strength"].default_value = 1.0; b3.inputs["Roughness"].default_value = 0.28; mf.use_backface_culling = False
for m in (mb, ml, mf): me.materials.append(m)
me.polygons.foreach_set("material_index", G.FM)
me.polygons.foreach_set("use_smooth", [True] * len(G.F))
uvl = me.uv_layers.new(name="UVMap")
uvl.data.foreach_set("uv", [c for uvs in G.FUV for uv in uvs for c in uv])
ca = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT"); me.color_attributes.active_color = ca
me.update()

# ground + world for AO and the proof
w = bpy.data.worlds.new("Night"); scene.world = w
try:
    w.use_nodes = True; bg = w.node_tree.nodes["Background"]; bg.inputs[0].default_value = (0.008, 0.011, 0.024, 1); bg.inputs[1].default_value = 1.0
except Exception as e: print("world", e)
w.light_settings.distance = 0.9
bpy.ops.mesh.primitive_plane_add(size=40); ground = bpy.context.active_object
gm, gnt, gb = mk("ground"); gb.inputs["Base Color"].default_value = (0.02, 0.019, 0.022, 1); gb.inputs["Roughness"].default_value = 0.6; ground.data.materials.append(gm)
scene.render.engine = "CYCLES"; scene.cycles.device = "CPU"; scene.cycles.samples = 32
nonbark = set()
for f, m in zip(G.F, G.FM):
    if m != BARK: nonbark.update(f)
try:
    bpy.ops.object.select_all(action="DESELECT"); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.bake(type="AO", target="VERTEX_COLORS")
    ao = [d.color[0] for d in ca.data]; print("AO baked, mean %.2f" % (sum(ao) / len(ao)))
except Exception as e:
    print("AO bake failed", e); ao = [1.0] * len(G.V)
cols = []
for i, c in enumerate(G.C):
    a = max(ao[i], 0.7) if i in nonbark else (0.25 + 0.75 * ao[i]) * c
    cols += [a, a, a, 1.0]
ca.data.foreach_set("color", cols)

# ---------------- rig + Sway
arm_data = bpy.data.armatures.new("TreeRig"); arm = bpy.data.objects.new("TreeRig", arm_data); scene.collection.objects.link(arm)
bpy.ops.object.select_all(action="DESELECT"); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
for n, h, t, p in BONES:
    eb = arm_data.edit_bones.new(n); eb.head = h; eb.tail = t if (t - h).length > 0.05 else h + Vector((0, 0, 0.3))
    if p: eb.parent = arm_data.edit_bones[p]; eb.use_connect = False
bpy.ops.object.mode_set(mode="OBJECT")
for n, *_ in BONES: ob.vertex_groups.new(name=n)
for i, wd in enumerate(G.W):
    tot = sum(wd.values())
    for k, v in wd.items(): ob.vertex_groups[k].add([i], v / tot, "REPLACE")
ob.parent = arm; md = ob.modifiers.new("Armature", "ARMATURE"); md.object = arm
scene.render.fps = 30; scene.frame_start = 0; scene.frame_end = 180
AMP = {"Root": 0.0, "Trunk": 0.5, "Trunk2": 0.9}
for i in (1, 2, 3): AMP[f"Limb{i}"] = 2.0; AMP[f"Tip{i}"] = 5.0
PH = {n: rng.uniform(0, 6.283) for n in AMP}
for i in (1, 2, 3): PH[f"Tip{i}"] = PH[f"Limb{i}"] + 0.7
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode="POSE")
for pb in arm.pose.bones: pb.rotation_mode = "XYZ"
for fr in range(0, 181, 3):
    wv = 2 * math.pi * (fr / 30.0) / 6.0
    for pb in arm.pose.bones:
        A = math.radians(AMP[pb.name]); p = PH[pb.name]
        rx = A * (0.72 * math.sin(wv + p) + 0.28 * math.sin(2 * wv + 1.9 * p))
        rz = A * 0.55 * (0.7 * math.sin(wv + p + 1.4) + 0.3 * math.sin(3 * wv + p))
        pb.rotation_euler = (rx, 0.0, rz); pb.keyframe_insert("rotation_euler", frame=fr)
bpy.ops.object.mode_set(mode="OBJECT")
arm.animation_data.action.name = "Sway"
scene.frame_set(0)

# ---------------- proof: night, cold moon, one brazier
def light(name, kind, loc, energy, col, rot=None):
    l = bpy.data.lights.new(name, kind); l.energy = energy; l.color = col
    o = bpy.data.objects.new(name, l); scene.collection.objects.link(o); o.location = loc
    if rot: o.rotation_euler = rot
    return o
light("moon", "SUN", (0, 0, 10), 1.1, (0.55, 0.66, 1.0), (math.radians(40), 0, math.radians(150)))
light("brazier", "POINT", (2.8, 3.4, 1.0), 450, (1.0, 0.42, 0.12))
light("rim", "POINT", (-4, -5, 6), 900, (0.45, 0.55, 1.0))
def cam(name, loc, tgt, fov):
    c = bpy.data.cameras.new(name); c.angle = math.radians(fov); o = bpy.data.objects.new(name, c); scene.collection.objects.link(o)
    o.location = loc; o.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat("-Z", "Y").to_euler(); return o
tg = (0, 0, sp["H"] * 0.42)
VIEWS = [("play50", (0, 15.7, 20.6 + tg[2]), tg, 50), ("play18", (0, 15.7, 20.6 + tg[2]), tg, 18),
         ("ground", (3.5, 8.5, 2.0), (0, 0, sp["H"] * 0.45), 50), ("side", (11, -2, 2.5), (0, 0, sp["H"] * 0.47), 45)]
scene.render.resolution_x = scene.render.resolution_y = 480; scene.cycles.samples = 20
try: scene.cycles.use_denoising = True
except Exception: pass
scene.cycles.transparent_max_bounces = 16
for vn, loc, t, fov in VIEWS:
    scene.camera = cam(vn, loc, t, fov); scene.render.filepath = f"{PROOF}/{NAME}_{vn}.png"
    bpy.ops.render.render(write_still=True)

# ---------------- export (base colour straight from the texture; COLOR_0 carries the AO)
nt.links.new(t_alb.outputs["Color"], b.inputs["Base Color"])
bpy.ops.object.select_all(action="DESELECT"); ob.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
path = f"{OUT}/{NAME}.glb"
kw = dict(filepath=path, export_format="GLB", use_selection=True, export_apply=True, export_animations=True,
          export_animation_mode="ACTIONS", export_skins=True, export_yup=True)
try: bpy.ops.export_scene.gltf(export_vertex_color="ACTIVE", **kw)
except TypeError as e: print("no export_vertex_color:", e); bpy.ops.export_scene.gltf(**kw)

def glb_rw(path, fn):
    bb = open(path, "rb").read(); magic, ver, _ = struct.unpack("<III", bb[:12]); l0, _t = struct.unpack("<II", bb[12:20])
    js = json.loads(bb[20:20 + l0]); rest = bb[20 + l0:]
    fn(js)
    jb = json.dumps(js, separators=(",", ":")).encode(); jb += b" " * ((4 - len(jb) % 4) % 4)
    open(path, "wb").write(struct.pack("<III", magic, ver, 12 + 8 + len(jb) + len(rest)) + struct.pack("<II", len(jb), 0x4E4F534A) + jb + rest)
    return js
def fix(js):
    for m in js.get("materials", []):
        if m["name"] == "leaves": m["alphaMode"] = "MASK"; m["alphaCutoff"] = 0.5; m["doubleSided"] = True
        elif m["name"] == "fruit": m["doubleSided"] = True; m.pop("alphaMode", None)
        elif m["name"] == "bark": m.pop("doubleSided", None); m.pop("alphaMode", None)
    if len(js.get("animations", [])) == 1: js["animations"][0]["name"] = "Sway"
js = glb_rw(path, fix)
acc = js["accessors"]; tris = 0; ymin, ymax = 1e9, -1e9; attrs = set()
for mesh in js["meshes"]:
    for pr in mesh["primitives"]:
        tris += acc[pr["indices"]]["count"] // 3; attrs |= set(pr["attributes"])
        pa = acc[pr["attributes"]["POSITION"]]; ymin = min(ymin, pa["min"][1]); ymax = max(ymax, pa["max"][1])
anims = [(a["name"], len(a["channels"]), max(acc[s["input"]]["max"][0] for s in a["samplers"])) for a in js.get("animations", [])]
mats = [(m["name"], m.get("alphaMode", "OPAQUE"), m.get("doubleSided", False), "normalTexture" in m, "baseColorTexture" in m.get("pbrMetallicRoughness", {})) for m in js["materials"]]
print("AUDIT " + json.dumps(dict(name=NAME, tris=tris, ymin=round(ymin, 3), ymax=round(ymax, 3), attrs=sorted(attrs), anims=anims,
      mats=mats, joints=len(js["skins"][0]["joints"]) if js.get("skins") else 0, images=len(js.get("images", [])), bytes=os.path.getsize(path))))
