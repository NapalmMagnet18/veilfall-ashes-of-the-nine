# Ashen Reach hero trees for Broken Lantern Road + the Penitent Climb: ashoak / lanternsnag / gravecypress.
#   blender -b --factory-startup --python-exit-code 1 --python art/ashroad/build.py -- ashoak
# Procedural 1k textures (numpy/PIL), tube/blob meshes, a small wind rig, a 6 s looping "Sway" action
# (upper limbs only; the lantern swings on its chain), a 3-view night proof, GLB export + audit.
import bpy, math, random, os, sys, json, struct
import numpy as np
from mathutils import Vector, noise as mnoise
from PIL import Image, ImageDraw

NAME = sys.argv[sys.argv.index("--") + 1]
H = {"ashoak": 8.0, "lanternsnag": 6.0, "gravecypress": 7.0}[NAME]
SEED = {"ashoak": 101, "lanternsnag": 202, "gravecypress": 303}[NAME]
R = random.Random(SEED)
OUT = "/workspace/ashroad"; TMP = f"/tmp/ash/{NAME}"
os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
UP = Vector((0, 0, 1)); TAU = 2 * math.pi

def rr(a, b): return a + (b - a) * R.random()
def ss(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def rvec():
    while True:
        v = Vector((rr(-1, 1), rr(-1, 1), rr(-1, 1)))
        if 0.05 < v.length <= 1: return v.normalized()
def hvec(az): return Vector((math.cos(az), math.sin(az), 0))
def taper(r0, r1, n, p=0.9): return [r0 + (r1 - r0) * (k / (n - 1)) ** p for k in range(n)]
def blend(*pairs):
    out = {}
    for d, f in pairs:
        if f <= 0: continue
        for k, v in d.items(): out[k] = out.get(k, 0) + v * f
    s = sum(out.values()) or 1
    return {k: v / s for k, v in out.items() if v / s > 1e-3}

# ---------------------------------------------------------------- textures
def fnoise(n, beta, seed, aniso=1.0, m=None):
    m = m or n; rng = np.random.default_rng(seed)
    f = np.fft.fft2(rng.standard_normal((m, n)))
    ky = np.fft.fftfreq(m)[:, None] * aniso; kx = np.fft.fftfreq(n)[None, :]
    k = np.sqrt(kx ** 2 + ky ** 2); k[0, 0] = 1
    r = np.real(np.fft.ifft2(f / k ** beta))
    return (r - r.min()) / (r.max() - r.min())
def lerp3(a, b, t):
    a = np.array(a, np.float32); b = np.array(b, np.float32)
    t = np.clip(t, 0, 1)[..., None]; return a * (1 - t) + b * t
def normal_map(h, s):
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5 * s
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5 * s
    n = np.dstack([-dx, dy, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    return ((n * 0.5 + 0.5) * 255).astype(np.uint8)

def bark_char(n, seed):
    # alligatored charcoal: vertical fissures crossed by short horizontal checks, ash-grey plate tops,
    # the deepest seams still holding a dim ember (returned as its own emission map)
    v = fnoise(n, 1.45, seed, aniso=6); hz = fnoise(n, 1.35, seed + 1, aniso=.18); det = fnoise(n, 1.0, seed + 2)
    fv = np.abs(v - .5) * 2; fh = np.abs(hz - .5) * 2
    fiss = np.minimum(fv, fh * 1.6)
    plate = np.clip(fiss / .16, 0, 1) ** .55
    h = plate * (.75 + .25 * det)
    col = lerp3((3, 3, 3), (20, 19, 20), plate)
    col = lerp3(col, (78, 74, 72), np.clip((det - .55) * 3, 0, 1) * plate)          # ash on the plate tops
    col = lerp3(col, (52, 30, 22), np.clip((fnoise(n, 1.6, seed + 3) - .62) * 4, 0, 1) * plate * .6)  # scorched brown
    deep = np.clip(1 - fiss / .07, 0, 1) * np.clip((fnoise(n, 1.7, seed + 4, aniso=3) - .48) * 5, 0, 1)
    col = lerp3(col, (120, 40, 14), deep * .6)
    em = lerp3((0, 0, 0), (210, 66, 14), deep ** 1.2)
    return col, h, em

def bark_ember(n, seed):
    # the inside of the fire split: cracked charcoal cubes with brighter coals in the cracks
    col, h, em = bark_char(n, seed + 50)
    c = fnoise(n, 1.2, seed + 7); cr = np.clip(1 - np.abs(c - .5) * 2 / .05, 0, 1)
    glow = np.clip(cr + np.clip(1 - h / .25, 0, 1) * .7, 0, 1) * np.clip((fnoise(n, 1.9, seed + 8) - .35) * 2.5, 0, 1)
    col = lerp3(col * .6, (170, 60, 18), glow * .7)
    em = lerp3((10, 2, 0), (235, 92, 22), glow)
    return col, h * .8, em

def bark_grey(n, seed):
    # grey-black dead bark in long peeling strips; where a strip has gone, pale weathered wood shows with dark rims
    s = fnoise(n, 1.4, seed, aniso=12); det = fnoise(n, 1.0, seed + 1)
    fiss = np.abs(s - .5) * 2; plate = np.clip(fiss / .12, 0, 1) ** .7
    col = lerp3((10, 10, 12), (44, 43, 46), plate * (.7 + .3 * det))
    peel = np.clip((fnoise(n, 1.8, seed + 2, aniso=5) - .72) * 9, 0, 1)
    rim = np.clip(1 - np.abs(fnoise(n, 1.8, seed + 2, aniso=5) - .66) / .012, 0, 1)
    wood = lerp3((58, 55, 52), (84, 80, 74), fnoise(n, 1.1, seed + 3, aniso=16))
    col = lerp3(col, wood, peel); col = lerp3(col, (6, 6, 7), rim * .9)
    h = plate * .6 * (1 - peel) + peel * .25 + det * .1 + rim * .3
    return col, h

def bark_cypress(n, seed):
    s = fnoise(n, 1.3, seed, aniso=18); det = fnoise(n, 1.0, seed + 1)
    fib = np.abs(s - .5) * 2
    col = lerp3((22, 14, 12), (74, 52, 40), np.clip(fib / .3, 0, 1) * (.7 + .3 * det))
    return col, np.clip(fib / .3, 0, 1) * .8 + det * .2

def needles_tex(S, seed):
    # a band read bottom (v=0) to top (v=1) of every clump: shadowed blue-green needles below, ash on the tips above.
    # tiles in u. image row 0 is v=1 (the clump's crown)
    rnd = random.Random(seed); im = Image.new("RGB", (S, S), (10, 18, 20)); d = ImageDraw.Draw(im)
    hm = Image.new("L", (S, S), 0); dh = ImageDraw.Draw(hm)
    pal = [(20, 40, 44), (26, 52, 54), (34, 64, 62), (22, 46, 56), (42, 74, 72)]
    for k in range(14000):
        x = rnd.uniform(0, S); y = rnd.uniform(-20, S); v = 1 - y / S
        L = rnd.uniform(8, 22); a = -math.pi / 2 + rnd.uniform(-.75, .75)
        depth = k / 14000; br = (.45 + .75 * depth) * (.55 + .5 * v)
        c = rnd.choice(pal)
        ash = v > .8 and rnd.random() < (v - .8) * 4.2 * depth
        if ash: c = rnd.choice([(118, 116, 110), (150, 146, 136), (96, 94, 92)]); br = rnd.uniform(.85, 1.1)
        col = tuple(int(min(255, ch * br)) for ch in c)
        for ox in (-S, 0, S):
            p0 = (x + ox, y); p1 = (x + ox + math.cos(a) * L, y + math.sin(a) * L)
            d.line([p0, p1], fill=col, width=2); dh.line([p0, p1], fill=int(80 + 170 * depth), width=2)
    col = np.array(im, np.float32)
    rows = np.linspace(1, 0, S)[:, None]
    dust = (np.random.default_rng(seed).random((S, S)) < np.clip((rows - .85) * 2.2, 0, .3)).astype(np.float32)
    col = lerp3(col, (170, 166, 156), dust * .85)
    return col, np.array(hm, np.float32) / 255

def rock_tex(n, seed):
    a = fnoise(n, 1.6, seed); b = fnoise(n, 1.0, seed + 1); c = np.abs(fnoise(n, 1.4, seed + 2) - .5) < .01
    col = lerp3((30, 30, 34), (82, 80, 82), a * .7 + b * .3); col = lerp3(col, (12, 12, 14), c.astype(np.float32))
    return col, a * .6 + b * .3 - c * .3

def iron_tex(n, seed):
    a = fnoise(n, 1.7, seed); b = fnoise(n, 1.0, seed + 1)
    rust = np.clip((a - .45) * 3.5, 0, 1)
    col = lerp3((26, 24, 25), (54, 50, 50), b); col = lerp3(col, lerp3((96, 40, 22), (172, 76, 66), b), rust)
    return col, rust * .5 + b * .2

def save_img(arr, name, colorspace="sRGB"):
    path = f"{TMP}/{name}"
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)); im.convert("RGB").save(path, quality=90)
    img = bpy.data.images.load(path); img.pack(); img.colorspace_settings.name = colorspace
    return img

def material(name, base=None, nrm=None, color=None, rough=.8, metal=0.0, emit_img=None, emit=None, nstr=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    if base:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = base; nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    if color: b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if nrm:
        t2 = nt.nodes.new("ShaderNodeTexImage"); t2.image = nrm
        nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = nstr
        nt.links.new(t2.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    if emit_img:
        t3 = nt.nodes.new("ShaderNodeTexImage"); t3.image = emit_img
        nt.links.new(t3.outputs["Color"], b.inputs["Emission Color"]); b.inputs["Emission Strength"].default_value = 1.0
    elif emit:
        b.inputs["Emission Color"].default_value = (*emit[0], 1); b.inputs["Emission Strength"].default_value = emit[1]
    return m

# ---------------------------------------------------------------- mesh builder
class MB:
    def __init__(s): s.V, s.W, s.F, s.FUV, s.FM = [], [], [], [], []
    def v(s, p, w): s.V.append((p.x, p.y, p.z)); s.W.append(w); return len(s.V) - 1
    def f(s, idx, uvs, m): s.F.append(tuple(idx)); s.FUV.append(uvs); s.FM.append(m)

def frames(pts):
    n = len(pts); T = [(pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized() for i in range(n)]
    N0 = T[0].cross(UP) if abs(T[0].dot(UP)) < .95 else T[0].cross(Vector((1, 0, 0)))
    Ns = [N0.normalized()]
    for i in range(1, n):
        p = Ns[-1]; nn = p - T[i] * p.dot(T[i]); Ns.append(nn.normalized() if nn.length > 1e-6 else p)
    return T, Ns

def tube(mb, pts, radii, sides, m, wfun, U=1.0, rfun=None, mfun=None, flat=(1, 1), world_rings=False, up_frame=False, cap=False):
    # a ring per point; world_rings = rings lie in the XY plane at world angle a (trunks: the scar faces a known way)
    T, N = frames(pts); rings, vs, s = [], [], 0.0
    circ = TAU * max(radii[0], .03) / U
    for i, c in enumerate(pts):
        if i: s += (pts[i] - pts[i - 1]).length
        t = T[i]
        if world_rings: n, b = Vector((1, 0, 0)), Vector((0, 1, 0))
        elif up_frame:
            b = t.cross(UP); b = b.normalized() if b.length > 1e-4 else t.cross(N[i]).normalized(); n = b.cross(t).normalized()
        else: n = N[i]; b = t.cross(n).normalized()
        w = wfun(i / (len(pts) - 1)); ring = []
        for j in range(sides):
            a = TAU * j / sides; r = max(.004, radii[i] * (rfun(i, a, c) if rfun else 1))
            p = c + n * (math.cos(a) * r * flat[0]) + b * (math.sin(a) * r * flat[1])
            if p.z < -.05: p.z = -.05
            ring.append(mb.v(p, w))
        rings.append(ring); vs.append(s / circ)
    for i in range(len(pts) - 1):
        for j in range(sides):
            j2 = (j + 1) % sides; u0 = j / sides * U; u1 = (j + 1) / sides * U
            mb.f((rings[i][j], rings[i][j2], rings[i + 1][j2], rings[i + 1][j]), [(u0, vs[i]), (u1, vs[i]), (u1, vs[i + 1]), (u0, vs[i + 1])], mfun(i, j) if mfun else m)
    if cap:  # closes the far end with a point a little beyond it
        tip = mb.v(pts[-1] + T[-1] * radii[-1] * .6, wfun(1.0))
        for j in range(sides):
            mb.f((rings[-1][j], rings[-1][(j + 1) % sides], tip), [(0, 0), (.1, 0), (.05, .1)], m)
    return rings

def blob(mb, c, rad, w, m, seg=10, rings=7, rough=.25, nseed=0.0):
    ids = []
    for i in range(rings + 1):
        th = math.pi * i / rings; row = []
        for j in range(seg):
            ph = TAU * j / seg; d = Vector((math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th)))
            k = 1 + rough * mnoise.noise(d * 1.7 + Vector((nseed, 0, 0)))
            q = c + Vector((d.x * rad[0], d.y * rad[1], d.z * rad[2])) * k; q.z = max(q.z, -.04)
            row.append(mb.v(q, w))
        ids.append(row)
    for i in range(rings):
        for j in range(seg):
            j2 = (j + 1) % seg
            mb.f((ids[i][j], ids[i + 1][j], ids[i + 1][j2], ids[i][j2]), [(j / seg, i / rings), (j / seg, (i + 1) / rings), ((j + 1) / seg, (i + 1) / rings), ((j + 1) / seg, i / rings)], m)

def wander(st, d, length, segs, gnarl, rise=0.0):
    pts = [st.copy()]; d = d.normalized(); p = st.copy()
    for k in range(segs):
        d = (d + rvec() * gnarl + UP * rise).normalized(); p = p + d * (length / segs); pts.append(p.copy())
    return pts
def bez(P, n, jit=0.0):
    out = []
    for k in range(n):
        t = k / (n - 1); a, b, c, d = P
        p = a * (1 - t) ** 3 + b * 3 * (1 - t) ** 2 * t + c * 3 * (1 - t) * t ** 2 + d * t ** 3
        if jit and 0 < k < n - 1: p = p + rvec() * jit
        out.append(p)
    return out
def gnarl_r(amt, f=2.3, off=0.0):
    return lambda i, a, c: 1 + amt * mnoise.noise(Vector((c.x * f + math.cos(a) * .8 + off, c.y * f + math.sin(a) * .8, c.z * f)))

ROCKS = []
def rock_top(p):
    z = -1.0
    for c, r in ROCKS:
        dx, dy = (p.x - c.x) / r[0], (p.y - c.y) / r[1]; q = dx * dx + dy * dy
        if q < 1: z = max(z, c.z + r[2] * math.sqrt(1 - q))
    return z
def roots(mb, M, n, z0r, Lr, rw, flat, segs=12, sides=9, w=None, aim=None):
    w = w or {"Trunk": 1}
    for k in range(n):
        az = aim[k] if aim and k < len(aim) else TAU * k / n + rr(-.25, .25)
        z0 = rr(*z0r); L = rr(*Lr); ph = rr(0, TAU); pts = []; rad = taper(rw * rr(.85, 1.15), .03, segs + 1, .8)
        for s in range(segs + 1):
            t = s / segs; a = az + .16 * math.sin(t * 5 + ph)
            p = hvec(a) * (.15 + L * t ** 1.1) + UP * (z0 * (1 - t) ** 2.3 - .12 * t)
            top = rock_top(p)
            if top > -1: p.z = max(p.z, top + rad[s] * flat[0] * .55)   # the root climbs over the boulder it grips
            pts.append(p)
        tube(mb, pts, rad, sides, M["bark"], lambda t: w, U=1, rfun=gnarl_r(.14, 3.0, k), up_frame=True, flat=flat)

# ---------------------------------------------------------------- ashoak
def build_ashoak(mb, M):
    for k in range(3):
        a = -math.pi / 2 + (k - 1) * 2.1 + rr(-.3, .3); d = rr(1.5, 2.1)
        c = Vector((math.cos(a) * d, math.sin(a) * d, -.12)); r = (rr(.6, .85), rr(.55, .8), rr(.42, .6))
        ROCKS.append((c, r)); blob(mb, c, r, {"Trunk": 1}, M["rock"], 12, 8, .22, k * 3.1)
    zs = [2.45 * (k / 19) ** 1.15 for k in range(20)]
    tp = [Vector((.08 * math.sin(z * 1.3), .05 * math.sin(z * .9 + 1), z)) for z in zs]
    radii = [.6 - .05 * p.z + .55 * math.exp(-p.z / .32) for p in tp]
    A0 = -math.pi / 2
    def scar(a, z):
        da = (a - A0 + math.pi) % TAU - math.pi
        return math.exp(-(da / .62) ** 4) * ss(.05, .4, z)
    def rf(i, a, c):
        z = c.z; ridge = .06 * math.cos(11 * a + 2.0 * mnoise.noise(Vector((math.cos(a), math.sin(a), z * .7))))
        return (1 - .82 * scar(a, z)) * (1 + ridge + .07 * mnoise.noise(Vector((math.cos(a) * 1.5, math.sin(a) * 1.5, z * 1.4))))
    sides = 32
    def mf(i, j):
        a = TAU * (j + .5) / sides; return M["ember"] if scar(a, tp[i].z) > .45 else M["bark"]
    rings = tube(mb, tp, radii, sides, M["bark"], lambda t: {"Trunk": 1}, U=2, rfun=rf, mfun=mf, world_rings=True)
    hollow = mb.v(tp[-1] - UP * .55, {"Trunk": 1})                    # the smouldering bowl where the trunk tore
    for j in range(sides): mb.f((rings[-1][j], rings[-1][(j + 1) % sides], hollow), [(0, 0), (.15, 0), (.07, .2)], M["ember"])
    roots(mb, M, 7, (.9, 1.5), (2.4, 3.4), .36, (2.2, .75), aim=[math.atan2(c.y, c.x) for c, r in ROCKS] + [A0 + 1.3, A0 - 1.35, A0 + 2.6, A0 - 2.7])
    B = [("Trunk", Vector((0, 0, 0)), Vector((0, 0, 2.2)), None)]
    stems = [(Vector((.24, .06, 1.75)), Vector((.8, .2, 3.6)), Vector((1.15, .5, 5.0)), Vector((1.25, .35, 6.5)), .42, "StemA"),
             (Vector((-.24, .12, 1.75)), Vector((-.7, .25, 3.3)), Vector((-.95, -.2, 4.6)), Vector((-1.05, -.55, 5.7)), .38, "StemB")]
    li = 0
    for p0, p1, p2, p3, r0, sn in stems:
        pts = bez((p0, p1, p2, p3), 15, .05)
        tube(mb, pts, taper(r0, .1, 15, .8), 16, M["bark"], lambda t, sn=sn: blend(({"Trunk": 1}, 1 - ss(0, .25, t)), ({sn: 1}, ss(0, .25, t))), U=2, rfun=gnarl_r(.1, 2.0, li), cap=True)
        B.append((sn, pts[0], pts[-1], "Trunk"))
        for k, tt in enumerate((.55, .75, .95) if sn == "StemA" else (.6, .9)):
            c = pts[int(tt * 14)]; out = Vector((c.x, c.y, 0)).normalized() if c.length > .1 else hvec(rr(0, TAU))
            az = math.atan2(out.y, out.x) + rr(-1.1, 1.1) + (k - 1) * .8
            d = hvec(az) * math.cos(math.radians(rr(20, 45))) + UP * math.sin(math.radians(rr(20, 45)))
            lp = wander(c, d, rr(1.9, 2.8), 10, .2, rise=.02); ln = f"Limb{li}"
            tube(mb, lp, taper(.17, .03, 11), 8, M["bark"], lambda t, sn=sn, ln=ln: blend(({sn: 1}, 1 - ss(0, .3, t)), ({ln: 1}, ss(0, .3, t))), rfun=gnarl_r(.12, 2.5, li), cap=True)
            B.append((ln, lp[0], lp[-1], sn))
            for q in range(2):
                tp2 = lp[R.randint(5, 8)]; d2 = (lp[-1] - lp[0]).normalized() + rvec() * .9 + UP * .3
                tw = wander(tp2, d2, rr(.8, 1.4), 6, .3)
                tube(mb, tw, taper(.055, .012, 7), 5, M["bark"], lambda t, ln=ln: {ln: 1}, cap=True)
            li += 1
    # a snapped low limb, the old fire's first casualty
    sp = wander(tp[15] + hvec(.9) * .4, hvec(.9) + UP * .15, 1.1, 5, .15)
    tube(mb, sp, taper(.2, .12, 6), 8, M["bark"], lambda t: {"Trunk": 1}, cap=True)
    return B

# ---------------------------------------------------------------- lanternsnag
def build_lanternsnag(mb, M):
    tp = bez((Vector((0, 0, 0)), Vector((.15, 0, 1.6)), Vector((.95, .25, 3.0)), Vector((1.25, .1, 4.7))), 22, .06)
    radii = [.3 - .14 * (k / 21) + .32 * math.exp(-tp[k].z / .3) for k in range(22)]
    tube(mb, tp, radii, 16, M["bark"], lambda t: blend(({"Trunk": 1}, 1 - ss(.4, .65, t)), ({"Trunk2": 1}, ss(.4, .65, t))), U=2, rfun=gnarl_r(.12, 2.0))
    top = wander(tp[-1], (tp[-1] - tp[-3]).normalized() + Vector((-.3, 0, .4)), 1.1, 5, .25)
    tube(mb, top, taper(.16, .04, 6), 10, M["bark"], lambda t: {"Trunk2": 1}, cap=True)
    roots(mb, M, 5, (.6, 1.0), (1.6, 2.4), .24, (1.9, .8))
    B = [("Trunk", Vector((0, 0, 0)), tp[11], None), ("Trunk2", tp[11], top[-1], "Trunk")]
    # the long arm: out from the bend, a crooked rise then a droop to its hanging point
    a0 = tp[16]; d = Vector((-.55, -.83, 0))
    arm = bez((a0, a0 + d * 1.0 + UP * .45, a0 + d * 2.2 + UP * .5, a0 + d * 3.2 + UP * .05), 16, .05)
    tube(mb, arm, taper(.15, .04, 16, .8), 10, M["bark"], lambda t: blend(({"Trunk2": 1}, 1 - ss(0, .2, t)), ({"Arm": 1}, ss(0, .2, t) * (1 - ss(.45, .7, t))), ({"ArmTip": 1}, ss(.45, .7, t))), rfun=gnarl_r(.1, 3.0, 4), cap=True)
    B += [("Arm", arm[0], arm[8], "Trunk2"), ("ArmTip", arm[8], arm[-1], "Arm")]
    # a few short dead branches
    for k, (ti, az, L) in enumerate(((19, 1.0, 1.4), (14, 2.6, 1.1), (20, -2.2, 1.0))):
        c = tp[ti]; bp = wander(c, hvec(az) + UP * .7, L, 6, .3)
        bn = f"Br{k}"; tube(mb, bp, taper(.08, .015, 7), 6, M["bark"], lambda t, bn=bn: blend(({"Trunk2": 1}, 1 - t), ({bn: 1}, t)), cap=True)
        B.append((bn, bp[0], bp[-1], "Trunk2"))
    # peeling bark: thin curling slabs lifted off the trunk
    for k in range(9):
        i = R.randint(3, 17); a = rr(0, TAU); c = tp[i]; r = radii[i]
        o = hvec(a); L = rr(.4, .8); pts = []
        for s in range(5):
            t = s / 4; pts.append(c + o * (r * 1.02 + .14 * t * t) + UP * (-L * t) + (tp[min(i + 1, 21)] - c) * 0)
        tube(mb, pts, [rr(.06, .1)] * 5, 4, M["bark"], lambda t: {"Trunk": 1}, flat=(.15, 1))
    # chain + cage lantern under the arm's tip
    hang = arm[13] - UP * .03; nL = 9; link = .12
    for k in range(nL):
        c = hang - UP * (link * .82 * k + link / 2); ring = []
        rot = k % 2
        for s in range(9):
            a = TAU * s / 8; p = Vector((math.cos(a) * .035, 0, math.sin(a) * link / 2)) if not rot else Vector((0, math.cos(a) * .035, math.sin(a) * link / 2))
            ring.append(c + p)
        tube(mb, ring, [.011] * 9, 4, M["iron"], lambda t: {"Chain": 1})
    Lt = hang - UP * (link * .82 * nL + .02)
    B += [("Chain", hang, Lt, "ArmTip")]
    LW = {"Lantern": 1}; hL = .62; rL = .2
    tube(mb, [Lt + Vector((0, -.05, 0)) + Vector((0, .05 * math.cos(TAU * s / 8), -.05 + .05 * math.sin(TAU * s / 8))) for s in range(9)], [.012] * 9, 4, M["iron"], lambda t: LW)
    cap0 = Lt - UP * .1
    tube(mb, [cap0 - UP * .02, cap0 + UP * .06, cap0 + UP * .1], [rL * 1.15, rL * .6, .03], 8, M["iron"], lambda t: LW)
    for z in (0.0, .5):
        tube(mb, [cap0 - UP * (.02 + z * hL), cap0 - UP * (.07 + z * hL)], [rL * 1.05, rL * 1.05], 8, M["iron"], lambda t: LW)
    bot = cap0 - UP * hL
    tube(mb, [bot + UP * .02, bot - UP * .04, bot - UP * .09, bot - UP * .2], [rL * 1.05, rL * .9, rL * .4, .01], 8, M["iron"], lambda t: LW, cap=True)
    for k in range(6):
        a = TAU * k / 6 + .26; o = hvec(a) * rL
        tube(mb, [cap0 + o, cap0 + o * 1.08 - UP * hL * .5, bot + o], [.016] * 3, 4, M["iron"], lambda t: LW)
    tube(mb, [bot + UP * .03, cap0 - UP * .06], [rL * .82, rL * .82], 8, M["glass"], lambda t: LW, cap=True)
    tube(mb, [bot + UP * .02, bot + UP * .15], [.045, .04], 6, M["wax"], lambda t: LW, cap=True)
    B += [("Lantern", cap0 + UP * .05, bot - UP * .2, "Chain")]
    return B

# ---------------------------------------------------------------- gravecypress
def flame_clump(mb, M, base, h, r, lean, w, seed, seg=22, rings=14):
    # one solid needle mass shaped like a licking flame: fat low, drawn to a leaning point, ridged with tufts
    ids = []; tipc = base + UP * h + lean
    for i in range(rings + 1):
        t = i / rings; c = base.lerp(tipc, t) + lean * (t * t - t) * .6
        prof = r * math.sin(math.pi * min(1, .1 + t * .93)) ** .6 * (1 - .4 * t)
        row = []
        for j in range(seg):
            a = TAU * j / seg
            lob = .07 * max(0, math.cos(4 * a + 1.5 * t + seed)) + .2 * mnoise.noise(Vector((math.cos(a) * 1.6 + seed, math.sin(a) * 1.6, t * 2.2))) + .07 * mnoise.noise(Vector((math.cos(a) * 5 + seed, math.sin(a) * 5, t * 6)))
            rr_ = prof * (1 + lob)
            p = c + Vector((math.cos(a) * rr_, math.sin(a) * rr_, lob * .25 * h * (t > .5)))
            row.append((mb.v(p, w), (j / seg * 2, t)))
        ids.append(row)
    for i in range(rings):
        for j in range(seg):
            j2 = (j + 1) % seg; a, b, c, d = ids[i][j], ids[i][j2], ids[i + 1][j2], ids[i + 1][j]
            ub = b[1][0] if j2 else 2.0
            mb.f((a[0], b[0], c[0], d[0]), [a[1], (ub, b[1][1]), (ub, c[1][1]), d[1]], M["needles"])
    tip = mb.v(tipc + UP * .05, w)
    for j in range(seg): mb.f((ids[-1][j][0], ids[-1][(j + 1) % seg][0], tip), [(j / seg * 2, .98), ((j + 1) / seg * 2, .98), (j / seg * 2, 1)], M["needles"])
    bt = mb.v(base - UP * .05, w)
    for j in range(seg): mb.f((ids[0][(j + 1) % seg][0], ids[0][j][0], bt), [(0, .02), (.1, .02), (.05, 0)], M["needles"])

def build_gravecypress(mb, M):
    tp = [Vector((.03 * math.sin(k), .02 * math.cos(k * 1.3), 4.2 * k / 12)) for k in range(13)]
    tube(mb, tp, [.2 - .11 * (k / 12) + .2 * math.exp(-tp[k].z / .25) for k in range(13)], 10, M["bark"], lambda t: {"Trunk": 1}, U=2, rfun=gnarl_r(.15, 3.0))
    roots(mb, M, 5, (.35, .6), (.9, 1.5), .14, (1.7, .8), segs=9, sides=7)
    B = [("Trunk", Vector((0, 0, 0)), Vector((0, 0, 1.0)), None)]
    spec = [(.7, 2.4, 1.0), (1.6, 2.3, .98), (2.5, 2.2, .86), (3.4, 2.0, .72), (4.2, 1.8, .56), (4.95, 1.55, .4), (5.6, 1.4, .24)]
    prev = "Trunk"
    for k, (z, h, r) in enumerate(spec):
        off = hvec(k * 2.2 + .7) * (.12 if 0 < k < 6 else 0); lean = hvec(k * 1.9 + 2) * (.15 + .05 * k)
        bn = f"C{k}"; base = Vector((off.x, off.y, z))
        flame_clump(mb, M, base, h, r, lean, {bn: 1}, k * 1.7 + SEED * .01)
        B.append((bn, base, base + UP * h * .8, prev)); prev = bn
        # side tufts break the outline into licks without cards
        for q in range(2 if k < 5 else 1):
            a = rr(0, TAU); tz = z + h * rr(.25, .5); tr = r * rr(.85, 1.0)
            flame_clump(mb, M, Vector((math.cos(a) * tr * .7 + off.x, math.sin(a) * tr * .7 + off.y, tz)), h * .55, r * .42, hvec(a) * .2, {bn: 1}, q * 3.3 + k, seg=10, rings=7)
    return B

# ---------------------------------------------------------------- scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
mats = []
def addmat(m): mats.append(m); return len(mats) - 1
M = {}
if NAME == "ashoak":
    col, h, em = bark_char(1024, SEED)
    M["bark"] = addmat(material("bark", save_img(col, "bark.jpg"), save_img(normal_map(h, 12), "bark_n.jpg", "Non-Color"), rough=.9, emit_img=save_img(em, "bark_e.jpg"), nstr=1.4))
    col, h, em = bark_ember(512, SEED)
    M["ember"] = addmat(material("ember", save_img(col, "ember.jpg"), save_img(normal_map(h, 10), "ember_n.jpg", "Non-Color"), rough=.85, emit_img=save_img(em, "ember_e.jpg"), nstr=1.2))
    col, h = rock_tex(512, SEED)
    M["rock"] = addmat(material("rock", save_img(col, "rock.jpg"), save_img(normal_map(h, 8), "rock_n.jpg", "Non-Color"), rough=.75))
if NAME == "lanternsnag":
    col, h = bark_grey(1024, SEED)
    M["bark"] = addmat(material("bark", save_img(col, "bark.jpg"), save_img(normal_map(h, 10), "bark_n.jpg", "Non-Color"), rough=.85, nstr=1.2))
    col, h = iron_tex(512, SEED)
    M["iron"] = addmat(material("iron", save_img(col, "iron.jpg"), save_img(normal_map(h, 6), "iron_n.jpg", "Non-Color"), rough=.7, metal=.6))
    M["glass"] = addmat(material("glass", color=(.5, .28, .1), rough=.3, emit=((1.0, .5, .16), 1.2)))
    M["wax"] = addmat(material("wax", color=(.9, .84, .7), rough=.5, emit=((1.0, .7, .35), .6)))
if NAME == "gravecypress":
    col, h = bark_cypress(1024, SEED)
    M["bark"] = addmat(material("bark", save_img(col, "bark.jpg"), save_img(normal_map(h, 10), "bark_n.jpg", "Non-Color"), rough=.85))
    col, h = needles_tex(1024, SEED)
    M["needles"] = addmat(material("needles", save_img(col, "needles.jpg"), save_img(normal_map(h, 6), "needles_n.jpg", "Non-Color"), rough=.88, nstr=1.5))

mb = MB()
B = {"ashoak": build_ashoak, "lanternsnag": build_lanternsnag, "gravecypress": build_gravecypress}[NAME](mb, M)

V = np.array(mb.V, np.float32); k = H / V[:, 2].max(); V *= k
B = [(n, h * k, t * k, p) for n, h, t, p in B]
me = bpy.data.meshes.new(NAME); me.from_pydata([tuple(v) for v in V], [], mb.F)
uvl = me.uv_layers.new(name="UVMap")
uvl.data.foreach_set("uv", [c for f in mb.FUV for uv in f for c in uv])
me.polygons.foreach_set("material_index", mb.FM); me.polygons.foreach_set("use_smooth", [True] * len(mb.F))
for m in mats: me.materials.append(m)
me.update()
ob = bpy.data.objects.new(NAME, me); scene.collection.objects.link(ob)

arm = bpy.data.armatures.new(NAME + "_rig"); ao = bpy.data.objects.new(NAME + "_rig", arm); scene.collection.objects.link(ao)
bpy.context.view_layer.objects.active = ao; ao.select_set(True)
bpy.ops.object.mode_set(mode="EDIT")
for n, h, t, p in B:
    eb = arm.edit_bones.new(n); eb.head = h; eb.tail = t if (t - h).length > .05 else h + Vector((0, 0, .3))
for n, h, t, p in B:
    if p: arm.edit_bones[n].parent = arm.edit_bones[p]
bpy.ops.object.mode_set(mode="OBJECT")
groups = {n: ob.vertex_groups.new(name=n) for n, *_ in B}
for i, w in enumerate(mb.W):
    for bn, x in w.items(): groups[bn].add([i], x, "REPLACE")
ob.parent = ao; mod = ob.modifiers.new("skin", "ARMATURE"); mod.object = ao

# Sway: 6 s, seamless (whole cycles in 180 frames); trunks still, upper limbs drift, the lantern swings
AMP = {"Trunk2": .35, "Trunk": 0.0, "Stem": .35, "Limb": 1.1, "ArmTip": 1.0, "Arm": .5, "Br": 1.4, "Chain": 6.5, "Lantern": 2.5}
if NAME == "gravecypress": AMP.update({f"C{k}": v for k, v in enumerate((.12, .25, .4, .55, .75, 1.0, 1.3))})
scene.render.fps = 30; scene.frame_start = 0; scene.frame_end = 180
for i, pb in enumerate(ao.pose.bones):
    pb.rotation_mode = "XYZ"
    A = math.radians(AMP.get(pb.name, next((v for kk, v in AMP.items() if pb.name.startswith(kk)), 0)))
    ph = .55 * i
    for f in range(0, 181, 3):
        tt = f / 30.0
        x = A * (.75 * math.sin(TAU * tt / 6 + ph) + .25 * math.sin(TAU * 3 * tt / 6 + ph * 1.7))
        z = A * .6 * (.7 * math.sin(TAU * tt / 6 + ph + 1.3) + .3 * math.sin(TAU * 2 * tt / 6 + ph * .6))
        if pb.name == "Chain": z = A * .5 * math.sin(TAU * tt / 6 + 1.6)   # a pendulum: mostly one plane, a little ellipse
        pb.rotation_euler = (x, 0, z); pb.keyframe_insert("rotation_euler", frame=f)
ao.animation_data.action.name = "Sway"
scene.frame_set(0)

# ---------------------------------------------------------------- proof: night, cold moon, one fire
scene.render.engine = "CYCLES"; scene.cycles.device = "CPU"; scene.cycles.samples = 16
try: scene.cycles.use_denoising = True
except Exception: pass
scene.render.resolution_x = scene.render.resolution_y = 480
w = bpy.data.worlds.new("w"); scene.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (.014, .02, .04, 1)
gm = bpy.data.meshes.new("g"); gm.from_pydata([(-30, -30, 0), (30, -30, 0), (30, 30, 0), (-30, 30, 0)], [], [(0, 1, 2, 3)])
g = bpy.data.objects.new("ground", gm); scene.collection.objects.link(g)
gmat = bpy.data.materials.new("gm"); gmat.use_nodes = True; gmat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (.04, .04, .045, 1); gm.materials.append(gmat)
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); sun.data.energy = 1.8; sun.data.color = (.55, .68, 1.0)
sun.rotation_euler = (math.radians(50), 0, math.radians(35)); scene.collection.objects.link(sun)
fire = bpy.data.objects.new("fire", bpy.data.lights.new("fire", "POINT")); fire.data.energy = 450; fire.data.color = (1, .45, .15)
fire.location = (4.5, -2.0, 1.0); scene.collection.objects.link(fire)
def cam(name, eye, aim, fov):
    c = bpy.data.objects.new(name, bpy.data.cameras.new(name)); scene.collection.objects.link(c)
    c.data.sensor_fit = "VERTICAL"; c.data.angle = math.radians(fov); c.location = eye
    c.rotation_euler = (Vector(aim) - Vector(eye)).to_track_quat("-Z", "Y").to_euler(); return c
views = [cam("c34", (H * 1.2, -H * 1.2, H * .5), (0, 0, H * .48), 42),
         cam("ciso", (9.9, -9.9, 14.0), (0, 0, 1.0), 50),
         cam("cground", (4.0, -6.0, 1.6), (0, 0, H * .45), 66)]
shots = []
for c in views:
    scene.camera = c; scene.render.filepath = f"{TMP}/{c.name}.png"; bpy.ops.render.render(write_still=True); shots.append(scene.render.filepath)
sheet = Image.new("RGB", (480 * 3 + 8, 480))
for i, s in enumerate(shots): sheet.paste(Image.open(s).convert("RGB"), (i * 484, 0))
sheet.save(f"{OUT}/{NAME}_proof.png")

# ---------------------------------------------------------------- export + audit
for o in scene.objects: o.select_set(o in (ob, ao))
glb = f"{OUT}/{NAME}.glb"
bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", use_selection=True, export_apply=True, export_animations=True,
                          export_animation_mode="ACTIONS", export_skins=True, export_yup=True, export_image_format="AUTO")
b = open(glb, "rb").read(); jl = struct.unpack("<I", b[12:16])[0]; js = json.loads(b[20:20 + jl]); rest = b[20 + jl:]
for m in js.get("materials", []): m.pop("alphaMode", None); m.pop("alphaCutoff", None); m["doubleSided"] = False
nj = json.dumps(js, separators=(",", ":")).encode(); nj += b" " * ((4 - len(nj) % 4) % 4)
open(glb, "wb").write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(nj) + len(rest)) + struct.pack("<II", len(nj), 0x4E4F534A) + nj + rest)
acc = js["accessors"]; tris = 0; ymin, ymax = 1e9, -1e9
for mesh in js["meshes"]:
    for p in mesh["primitives"]:
        tris += acc[p["indices"]]["count"] // 3; pa = acc[p["attributes"]["POSITION"]]; ymin = min(ymin, pa["min"][1]); ymax = max(ymax, pa["max"][1])
audit = {"name": NAME, "tris": tris, "height": round(ymax - ymin, 3), "ymin": round(ymin, 3),
         "animations": [{"name": a["name"], "channels": len(a["channels"]), "dur": max(acc[s["input"]]["max"][0] for s in a["samplers"])} for a in js.get("animations", [])],
         "joints": [len(s["joints"]) for s in js.get("skins", [])],
         "materials": [(m["name"], "emissiveTexture" in m or m.get("emissiveFactor")) for m in js["materials"]],
         "images": len(js.get("images", [])), "bytes": os.path.getsize(glb)}
json.dump(audit, open(f"{OUT}/{NAME}_audit.json", "w")); print("AUDIT", json.dumps(audit))
