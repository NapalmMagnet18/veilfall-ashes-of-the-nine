# Blood Woods hero trees: bloodoak / weepwillow / antlersnag. One script per tree name:
#   blender -b --factory-startup --python-exit-code 1 --python art/bloodwoods/build.py -- bloodoak
# Builds procedural textures (numpy/PIL), the mesh (tubes, leaf cards, ribbons), a 10-12 bone wind rig,
# a 6 s looping "Sway" action, a 3-view Cycles proof, exports /workspace/bloodwoods/<name>.glb and audits it.
import bpy, math, random, os, sys, json, struct
import numpy as np
from mathutils import Vector, noise as mnoise
from PIL import Image, ImageDraw

NAME = sys.argv[sys.argv.index("--") + 1]
H = {"bloodoak": 9.0, "weepwillow": 7.0, "antlersnag": 6.0}[NAME]
SEED = {"bloodoak": 11, "weepwillow": 23, "antlersnag": 37}[NAME]
R = random.Random(SEED)
OUT = "/workspace/bloodwoods"; TMP = f"/tmp/bw/{NAME}"
os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
UP = Vector((0, 0, 1)); FRONT = Vector((0, 1, 0))  # Blender +Y exports as glTF -Z (the engine's facing)
TAU = 2 * math.pi

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

def bark_dark(n, seed, warm=(0, 0, 0)):
    s = fnoise(n, 1.5, seed, aniso=7); s2 = fnoise(n, 1.25, seed + 1, aniso=4)
    fiss = np.minimum(np.abs(s - .5) * 2, np.abs(s2 - .5) * 2.6)
    plate = np.clip(fiss / .2, 0, 1) ** .6
    det = fnoise(n, 1.0, seed + 2); blk = fnoise(n, 1.7, seed + 3, aniso=.4)
    h = plate * (.72 + .28 * det) - (np.abs(blk - .5) < .02) * .25 * plate
    col = lerp3((7, 5, 6), np.array((38, 32, 33)) + warm, plate)
    col = lerp3(col, np.array((82, 70, 66)) + warm, np.clip((det - .45) * 2, 0, 1) * plate * .8)
    seep = (1 - plate) * np.clip((fnoise(n, 1.8, seed + 4, aniso=3) - .5) * 4, 0, 1)
    col = lerp3(col, (96, 8, 12), seep)
    return col, h

def bark_pale(n, seed):
    grain = fnoise(n, 1.2, seed, aniso=14); det = fnoise(n, 1.0, seed + 1)
    crack = (np.abs(fnoise(n, 1.3, seed + 2, aniso=10) - .5) < .012).astype(np.float32)
    col = lerp3((122, 118, 112), (212, 204, 186), grain * .7 + det * .3)
    col = lerp3(col, (64, 58, 56), crack)
    pv = fnoise(n, 1.9, seed + 5, aniso=2); patch = np.clip((pv - .6) * 12, 0, 1)
    dcol, dh = bark_dark(n, seed + 9, warm=(6, 2, 0))
    col = lerp3(col, dcol, patch)
    h = grain * .3 + det * .1 - crack * .3
    h = h * (1 - patch) + (dh * .7 + .5) * patch
    iy, ix = np.unravel_index(np.argmax(pv), pv.shape); dark_uv = (ix / n, 1 - iy / n)
    lum = col.sum(2) * (1 - patch); iy, ix = np.unravel_index(np.argmax(lum), lum.shape); pale_uv = (ix / n, 1 - iy / n)
    return col, h, dark_uv, pale_uv

def leaf_poly(cx, cy, L, W, ang, lobes=0, half=0):
    ca, sa = math.cos(ang), math.sin(ang); side = []
    for k in range(13):
        t = k / 12; hw = W * math.sin(math.pi * min(t * 1.08, 1)) ** .8 * (1 - .35 * t)
        if lobes: hw *= .8 + .35 * abs(math.sin(t * math.pi * lobes))
        side.append((t * L, hw))
    if half == 1: poly = side + [(x, 0) for x, y in reversed(side)]
    else: poly = side + [(x, -y) for x, y in reversed(side)]
    return [(cx + x * ca - y * sa, cy + x * sa + y * ca) for x, y in poly]

def shade(c, f): return tuple(int(max(0, min(255, v * f))) for v in c) + (255,)

def draw_clump(S, seed, pal, lobes=3, Lr=(.07, .11), Wr=(.32, .42), n=320):
    rnd = random.Random(seed); im = Image.new("RGBA", (S, S), (80, 10, 16, 0)); d = ImageDraw.Draw(im)
    cx = cy = S / 2
    for k in range(8):
        a = rnd.uniform(0, TAU); pts = [(cx + rnd.uniform(-40, 40), cy + rnd.uniform(-40, 40))]; L = rnd.uniform(.25, .44) * S
        for s in range(6):
            a += rnd.uniform(-.3, .3); x, y = pts[-1]; pts.append((x + math.cos(a) * L / 6, y + math.sin(a) * L / 6))
        d.line(pts, fill=(24, 8, 9, 255), width=int(S * .007))
    for k in range(n):
        r = S * .43 * math.sqrt(rnd.random()); a = rnd.uniform(0, TAU)
        x = cx + r * math.cos(a); y = cy + r * math.sin(a)
        L = rnd.uniform(*Lr) * S; W = L * rnd.uniform(*Wr); ang = a + rnd.uniform(-.9, .9)
        bx, by = x - math.cos(ang) * L * .3, y - math.sin(ang) * L * .3
        depth = k / n; base = rnd.choice(pal); br = (.5 + .55 * depth) * rnd.uniform(.85, 1.12) * (1.05 - .25 * r / (S * .43))
        d.polygon(leaf_poly(bx, by, L, W, ang, lobes), fill=shade(base, br * .8))
        d.polygon(leaf_poly(bx, by, L, W, ang, lobes, half=1), fill=shade(base, br * 1.08))
        d.line([(bx, by), (bx + math.cos(ang) * L * .85, by + math.sin(ang) * L * .85)], fill=shade(base, br * .5), width=max(2, S // 500))
    return im

def draw_strands(cw, Hh, seed, pal, ncol=4):
    rnd = random.Random(seed); out = Image.new("RGBA", (cw * ncol, Hh), (80, 10, 16, 0))
    for c in range(ncol):
        im = Image.new("RGBA", (cw, Hh), (80, 10, 16, 0)); d = ImageDraw.Draw(im)
        for s in range(3):
            x0 = cw * (.25 + .25 * s) + rnd.uniform(-25, 25); ys = rnd.uniform(0, .05) * Hh; ye = rnd.uniform(.84, .99) * Hh
            amp = rnd.uniform(8, 26); ph = rnd.uniform(0, TAU)
            xf = lambda y: x0 + amp * math.sin(y / Hh * TAU + ph)
            d.line([(xf(y), y) for y in np.arange(ys, ye, 16)], fill=(36, 7, 9, 255), width=5)
            y = ys + 8; side = 1
            while y < ye:
                f = (y - ys) / (ye - ys); L = rnd.uniform(110, 170) * (1 - .3 * f); W = L * .17
                ang = math.pi / 2 + side * rnd.uniform(.25, .65); base = rnd.choice(pal); br = rnd.uniform(.75, 1.15) * (.85 + .25 * f)
                d.polygon(leaf_poly(xf(y), y, L, W, ang), fill=shade(base, br * .8))
                d.polygon(leaf_poly(xf(y), y, L, W, ang, half=1), fill=shade(base, br * 1.1))
                y += rnd.uniform(12, 22) * (1 + .6 * f); side = -side
        out.paste(im, (c * cw, 0))
    return out

def cloth_tex(n, seed):
    a = fnoise(n, 1.6, seed); b = fnoise(n, 1.0, seed + 1); st = fnoise(n, 2.2, seed + 2)
    col = lerp3((96, 14, 18), (176, 58, 52), a * .7 + b * .3)
    col = lerp3(col, (40, 8, 10), np.clip((st - .55) * 3, 0, 1) * .8)
    weave = ((np.arange(n)[None, :] % 4 < 2) ^ (np.arange(n)[:, None] % 4 < 2)).astype(np.float32)
    col *= (.92 + .08 * weave)[..., None]
    rnd = np.random.default_rng(seed); cut = np.zeros(n)
    x = 0
    while x < n:
        w = rnd.integers(10, 60); cut[x:x + w] = rnd.uniform(.45, .97); x += w
    cut += (fnoise(n, 1.0, seed + 3)[0] - .5) * .08
    rows = (np.arange(n) / n)[:, None]
    alpha = (rows < cut[None, :]).astype(np.float32)
    alpha *= (fnoise(n, 1.5, seed + 4) < .8)
    col = lerp3(col, (40, 8, 10), np.clip((rows - cut[None, :] + .12) / .12, 0, 1) * .7)
    return np.dstack([np.clip(col, 0, 255), alpha * 255]).astype(np.uint8)

def save_img(arr_or_im, name, colorspace="sRGB"):
    path = f"{TMP}/{name}"
    im = arr_or_im if isinstance(arr_or_im, Image.Image) else Image.fromarray(np.clip(arr_or_im, 0, 255).astype(np.uint8))
    if path.endswith(".jpg"): im.convert("RGB").save(path, quality=90)
    else: im.save(path)
    img = bpy.data.images.load(path); img.pack(); img.colorspace_settings.name = colorspace
    return img

def material(name, base=None, nrm=None, color=None, rough=.8, alpha=False, emit=None, nstr=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    if base:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = base
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
        if alpha:
            mth = nt.nodes.new("ShaderNodeMath"); mth.operation = "ROUND"
            nt.links.new(t.outputs["Alpha"], mth.inputs[0]); nt.links.new(mth.outputs[0], b.inputs["Alpha"])
    if color: b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    if nrm:
        t2 = nt.nodes.new("ShaderNodeTexImage"); t2.image = nrm
        nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = nstr
        nt.links.new(t2.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    if emit:
        b.inputs["Emission Color"].default_value = (*emit[0], 1); b.inputs["Emission Strength"].default_value = emit[1]
    m.use_backface_culling = not alpha
    return m

# ---------------------------------------------------------------- mesh builder
class MB:
    def __init__(s): s.V, s.W, s.CN, s.F, s.FUV, s.FM = [], [], [], [], [], []
    def v(s, p, w, cn=None):
        s.V.append((p.x, p.y, p.z)); s.W.append(w); s.CN.append(tuple(cn) if cn is not None else (0, 0, 0)); return len(s.V) - 1
    def f(s, idx, uvs, m): s.F.append(tuple(idx)); s.FUV.append(uvs); s.FM.append(m)

def frames(pts):
    n = len(pts); T = [(pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized() for i in range(n)]
    N0 = T[0].cross(UP) if abs(T[0].dot(UP)) < .95 else T[0].cross(Vector((1, 0, 0)))
    Ns = [N0.normalized()]
    for i in range(1, n):
        p = Ns[-1]; nn = p - T[i] * p.dot(T[i]); Ns.append(nn.normalized() if nn.length > 1e-6 else p)
    return T, Ns

def tube(mb, pts, radii, sides, m, wfun, U=1.0, rfun=None, mfun=None, up_frame=False, flat=(1, 1), uvc=None):
    T, N = frames(pts); rings, vs, s = [], [], 0.0
    circ = TAU * max(radii[0], .02) / U
    for i, c in enumerate(pts):
        if i: s += (pts[i] - pts[i - 1]).length
        t = T[i]
        if up_frame:
            b = t.cross(UP); b = b.normalized() if b.length > 1e-4 else t.cross(N[i]).normalized(); n = b.cross(t).normalized()
        else:
            n = N[i]; b = t.cross(n).normalized()
        w = wfun(i / (len(pts) - 1)); ring = []
        for j in range(sides):
            a = TAU * j / sides; r = max(.004, radii[i] * (rfun(i, a, c) if rfun else 1))
            p = c + n * (math.cos(a) * r * flat[0]) + b * (math.sin(a) * r * flat[1])
            if p.z < 0: p.z = 0
            ring.append(mb.v(p, w))
        rings.append(ring); vs.append(s / circ)
    for i in range(len(pts) - 1):
        for j in range(sides):
            j2 = (j + 1) % sides; u0 = j / sides * U; u1 = (j + 1) / sides * U
            uvs = [uvc] * 4 if uvc else [(u0, vs[i]), (u1, vs[i]), (u1, vs[i + 1]), (u0, vs[i + 1])]
            mb.f((rings[i][j], rings[i][j2], rings[i + 1][j2], rings[i + 1][j]), uvs, mfun(i, j) if mfun else m)

def card(mb, c, size, nrm, w, uvr, m, center, bend=.14, asp=1.0, cnup=.6):
    n = nrm.normalized(); x = rvec().cross(n).normalized(); y = n.cross(x)
    u0, v0, u1, v1 = uvr; ids = []
    for r, yy in enumerate((-.5, 0, .5)):
        for xx in (-.5, .5):
            p = c + x * (xx * size) + y * (yy * size * asp) + n * (bend * size * (1 - abs(yy) * 2))
            cn = (p - center); cn = (cn.normalized() + UP * cnup).normalized()
            ids.append((mb.v(p, w, cn), (u0 + (xx + .5) * (u1 - u0), v0 + (yy + .5) * (v1 - v0))))
    for r in range(2):
        a, b, cc, d = ids[r * 2], ids[r * 2 + 1], ids[r * 2 + 3], ids[r * 2 + 2]
        mb.f((a[0], b[0], cc[0], d[0]), [a[1], b[1], cc[1], d[1]], m)

def ribbon(mb, pts, widths, sides, outward, wfun, uvr, m, cn):
    u0, v0, u1, v1 = uvr; n = len(pts); L = []
    for i, p in enumerate(pts):
        sd = sides[i] if isinstance(sides, list) else sides; w = wfun(i / (n - 1)); v = v1 - (v1 - v0) * i / (n - 1)
        L.append(((mb.v(p - sd * widths[i] / 2, w, cn), (u0, v)), (mb.v(p + sd * widths[i] / 2, w, cn), (u1, v))))
    sd0 = sides[0] if isinstance(sides, list) else sides
    flip = sd0.cross(pts[1] - pts[0]).dot(outward) < 0
    for i in range(n - 1):
        a, b, c, d = L[i][0], L[i][1], L[i + 1][1], L[i + 1][0]
        q = (a, b, c, d) if not flip else (d, c, b, a)
        mb.f([x[0] for x in q], [x[1] for x in q], m)

def blob(mb, c, rad, w, uv, m, seg=8, rings=6):
    ids = []
    for i in range(rings + 1):
        th = math.pi * i / rings; row = []
        for j in range(seg):
            ph = TAU * j / seg; d = Vector((math.sin(th) * math.cos(ph), math.sin(th) * math.sin(ph), math.cos(th)))
            row.append(mb.v(c + Vector((d.x * rad[0], d.y * rad[1], d.z * rad[2])), w, d))
        ids.append(row)
    for i in range(rings):
        for j in range(seg):
            j2 = (j + 1) % seg; mb.f((ids[i][j], ids[i + 1][j], ids[i + 1][j2], ids[i][j2]), [uv] * 4, m)

def wander(st, d, length, segs, gnarl, rise=0.0):
    pts = [st.copy()]; d = d.normalized(); p = st.copy()
    for k in range(segs):
        d = (d + rvec() * gnarl + UP * rise).normalized(); p = p + d * (length / segs); pts.append(p.copy())
    return pts

def connect(a, b, segs, wig=.18, arch=.25):
    pts = []
    for k in range(segs + 1):
        t = k / segs; p = a.lerp(b, t) + UP * arch * math.sin(math.pi * t)
        if 0 < k < segs: p = p + rvec() * wig * math.sin(math.pi * t)
        pts.append(p)
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

def trunk(mb, M, tp, radii, sides, ngroove, depth, tw, wT, streaks=0):
    G = [TAU * g / ngroove + rr(-.3, .3) for g in range(ngroove)]
    def gro(a, z):
        s = 0
        for ag in G:
            da = (a - ag - tw * z + math.pi) % TAU - math.pi; s += math.exp(-(da / .17) ** 2)
        return min(s, 1)
    def rf(i, a, c):
        return (1 - depth * gro(a, c.z)) * (1 + .07 * mnoise.noise(Vector((math.cos(a) * 1.6, math.sin(a) * 1.6, c.z * 1.3))))
    st = []
    for g in R.sample(range(ngroove), streaks):
        top = rr(2.2, tp[-1].z - .1); st.append((g, top, max(.12, top - rr(1.4, 2.6))))
    def mf(i, j):
        z = tp[i].z
        for g, top, bot in st:
            if bot <= z <= top:
                ga = (G[g] + tw * z) % TAU; j0 = int(round(ga / TAU * sides)) % sides
                if j in ((j0 - 1) % sides, j0): return M["sap"]
        return M["bark"]
    tube(mb, tp, radii, sides, M["bark"], wT, U=2, rfun=rf, mfun=mf if streaks else None)

def roots(mb, M, n, z0r, Lr, rw, flat, center=Vector((0, 0, 0)), sides=9, segs=12, w={"Trunk": 1}):
    for k in range(n):
        az = TAU * k / n + rr(-.25, .25); z0 = rr(*z0r); L = rr(*Lr); ph = rr(0, TAU); pts = []
        for s in range(segs + 1):
            t = s / segs; a = az + .18 * math.sin(t * 5 + ph)
            pts.append(center + hvec(a) * (.12 + L * t ** 1.1) + UP * (z0 * (1 - t) ** 2.3 - .14 * t))
        tube(mb, pts, taper(rw * rr(.85, 1.15), .03, segs + 1, .8), sides, M["bark"], lambda t: w, U=1,
             rfun=gnarl_r(.12, 3.0, k), up_frame=True, flat=flat)

# ---------------------------------------------------------------- trees
def build_oak(mb, M):
    cz = 3.5; tp = [Vector((.13 * math.sin(z * 1.1 + .5), -.10 * math.sin(z * .8 + 2.0), z)) for z in [cz * k / 24 for k in range(25)]]
    radii = [.40 - .06 * (p.z / cz) + .30 * math.exp(-p.z / .45) for p in tp]
    trunk(mb, M, tp, radii, 28, 5, .30, .35, lambda t: blend(({"Trunk": 1}, 1 - ss(.35, .7, t)), ({"Trunk2": 1}, ss(.35, .7, t))), streaks=3)
    roots(mb, M, 7, (.9, 1.4), (2.3, 3.3), .30, (2.0, .8))
    B = [("Trunk", Vector((0, 0, 0)), tp[12], None), ("Trunk2", tp[12], tp[-1], "Trunk")]
    def LW(k, t): return blend(({"Trunk2": 1}, 1 - ss(0, .18, t)), ({f"Limb{k}": 1}, ss(0, .18, t) * (1 - ss(.42, .68, t))), ({f"Crown{k}": 1}, ss(.42, .68, t)))
    limbs, azs = [], []
    for k in range(4):
        az = math.pi / 4 + k * math.pi / 2 + rr(-.3, .3); el = math.radians(rr(32, 46)); z0 = cz - rr(0, .45)
        c = tp[int(z0 / cz * 24)]; d = hvec(az) * math.cos(el) + UP * math.sin(el)
        pts = wander(c + hvec(az) * .12, d, rr(3.9, 4.4), 12, .13, rise=.03)
        tube(mb, pts, taper(.27, .06, 13), 10, M["bark"], lambda t, k=k: LW(k, t), rfun=gnarl_r(.1, 2.3, k))
        limbs.append(pts); azs.append(az)
        B += [(f"Limb{k}", pts[0], pts[6], "Trunk2"), (f"Crown{k}", pts[6], pts[12], f"Limb{k}")]
    leader = wander(tp[-1], UP + rvec() * .2, 2.9, 9, .12)
    tube(mb, leader, taper(.26, .05, 10), 10, M["bark"], lambda t: {"Trunk2": 1}, rfun=gnarl_r(.1, 2.3, 9))
    C = Vector((0, 0, 6.1)); RX, RZ = 3.9, 2.7
    def near_crown(p):
        a = math.atan2(p.y, p.x); return min(range(4), key=lambda k: abs((a - azs[k] + math.pi) % TAU - math.pi))
    majors = []
    for tries in range(4000):
        if len(majors) >= 42: break
        d = rvec()
        if d.z < -.35: continue
        f = rr(.7, .9) * (1 + .15 * mnoise.noise(d * 2.0))
        p = C + Vector((d.x * RX, d.y * RX, d.z * RZ)) * f
        if all((p - q).length > 1.15 for q in majors): majors.append(p)
    cands = [(k, i, pt) for k, pts in enumerate(limbs) for i, pt in enumerate(pts) if i >= 4] + [("L", i, pt) for i, pt in enumerate(leader) if i >= 3]
    clumps = []
    for p in majors:
        k, i, st = min(cands, key=lambda c: (c[2] - p).length)
        kc = k if k != "L" else near_crown(p); cb = {f"Crown{kc}": 1}
        w0 = LW(k, i / 12) if k != "L" else {"Trunk2": 1}
        out = (p - C).normalized()
        tube(mb, connect(st, p - out * .15, 7), taper(.085, .02, 8), 5, M["bark"], lambda t, w0=w0, cb=cb: blend((w0, 1 - ss(0, .6, t)), (cb, ss(0, .6, t))))
        clumps.append((p, 10, cb))
        for m in range(3):
            off = rvec(); off = (off - out * off.dot(out) * .6).normalized()
            q = p + off * rr(.75, 1.25) + out * rr(-.2, .2)
            tube(mb, connect(p - out * .1, q, 3, .08, .1), taper(.028, .006, 4), 4, M["bark"], lambda t, cb=cb: cb)
            clumps.append((q, 7, cb))
    for p, n, cb in clumps:
        for c in range(n):
            pos = p + rvec() * rr(0, .55); out = pos - C; out = Vector((out.x / RX, out.y / RX, out.z / RZ)).normalized()
            v = 0 if R.random() < .58 else .5
            card(mb, pos, rr(1.05, 1.55), out + rvec() * .55 + UP * .25, cb, (v, 0, v + .5, 1), M["leaves"], C)
    for c in range(70):
        d = rvec(); pos = C + Vector((d.x * RX, d.y * RX, d.z * RZ)) * rr(.35, .6)
        card(mb, pos, rr(1.2, 1.6), d + UP * .3, {f"Crown{near_crown(pos)}": 1}, (.5, 0, 1, 1), M["leaves"], C)
    return B

def build_willow(mb, M):
    tz = 3.3; tp = []
    for k in range(23):
        t = k / 22; tp.append(Vector((.15 * math.sin(t * 4), 1.05 * math.sin(t * math.pi * .72), tz * t)))
    radii = [.46 - .12 * (p.z / tz) + .30 * math.exp(-p.z / .4) for p in tp]
    trunk(mb, M, tp, radii, 24, 4, .2, .25, lambda t: blend(({"Trunk": 1}, 1 - ss(.35, .7, t)), ({"Trunk2": 1}, ss(.35, .7, t))))
    roots(mb, M, 5, (.7, 1.1), (1.6, 2.4), .26, (1.8, .85))
    T = tp[-1]
    B = [("Trunk", Vector((0, 0, 0)), tp[11], None), ("Trunk2", tp[11], T, "Trunk")]
    def LW(k, t): return blend(({"Trunk2": 1}, 1 - ss(0, .2, t)), ({f"Limb{k}": 1}, ss(0, .2, t)))
    arches, azs = [], []
    for k in range(4):
        az = k * math.pi / 2 + math.pi / 4 + rr(-.3, .3); h = hvec(az)
        pts = bez([T, T + h * .6 + UP * 2.0, T + h * 2.0 + UP * 3.3, T + h * 3.4 + UP * 2.0], 15, .06)
        tube(mb, pts, taper(.25, .05, 15), 9, M["bark"], lambda t, k=k: LW(k, t), rfun=gnarl_r(.1, 2.3, k))
        B.append((f"Limb{k}", pts[0], pts[7], "Trunk2")); arches.append((k, pts, 0.0, 1.0)); azs.append(az)
        for s in range(3):
            i = R.randint(4, 8); S = pts[i]; h2 = hvec(az + rr(-.75, .75))
            sp = bez([S, S + h2 * .7 + UP * .9, S + h2 * 1.7 + UP * .8, S + h2 * 2.6 - UP * .4], 9, .04)
            w = LW(k, i / 14)
            tube(mb, sp, taper(.08, .02, 9), 5, M["bark"], lambda t, w=w: w)
            arches.append((k, sp, i / 14, .0))
    curt = []
    for c in range(6):
        az = TAU * c / 6 + .3; kk = min(range(4), key=lambda k: abs((az - azs[k] + math.pi) % TAU - math.pi))
        hd = Vector((T.x, T.y, 0)) + hvec(az) * 2.4 + UP * 5.6; tl = Vector((T.x, T.y, 0)) + hvec(az) * 2.6 + UP * 1.6
        B.append((f"Curtain{c}", hd, tl, f"Limb{kk}")); curt.append(az)
    Cc = Vector((T.x, T.y, 4.5)); Ch = Vector((T.x, T.y, 0))
    lens = [sum((p[i + 1] - p[i]).length for i in range(len(p) - 1)) for _, p, _, _ in arches]
    def anchor():
        while True:
            k, pts, ta, _ = R.choices(arches, weights=lens)[0]; i = R.randint(int(len(pts) * .4), len(pts) - 1)
            A = pts[i]
            if A.z > 4.0: return k, A, (i / (len(pts) - 1)) if ta == 0 else ta
    for sidx in range(440):
        k, A, ta = anchor(); hv = A - Ch; hv.z = 0
        h = hv.normalized() if hv.length > .2 else hvec(rr(0, TAU)); tg = UP.cross(h).normalized()
        endZ = rr(.3, 1.3) if R.random() < .72 else rr(1.4, 3.2); ph = rr(0, TAU); pts = []
        for s in range(10):
            t = s / 9
            if t <= .15: p = A + h * (.5 * t / .15) + UP * (.12 * math.sin(t / .15 * math.pi))
            else:
                u = (t - .15) / .85; p = A + h * (.5 + .35 * u) - UP * ((A.z - endZ) * u ** 1.15) + tg * .15 * math.sin(u * 3 + ph)
            pts.append(p)
        az = math.atan2(h.y, h.x); c = min(range(6), key=lambda c: abs((az - curt[c] + math.pi) % TAU - math.pi))
        w0 = LW(k, ta); wc = {f"Curtain{c}": 1}
        col = R.randrange(4); u0 = .5 + col * .125 + .004
        cross = sidx >= 320
        wsc = rr(.85, 1.15)
        ribbon(mb, pts, [(.55 - .25 * s / 9) * wsc for s in range(10)], (h if cross else tg), (tg if cross else h),
               lambda t, w0=w0, wc=wc: blend((w0, 1 - ss(.05, .6, t)), (wc, ss(.05, .6, t))), (u0, 0, u0 + .117, 1), M["leaves"], (h + UP * .35).normalized())
    for c in range(150):
        k, A, ta = anchor(); hv = A - Ch; hv.z = 0; h = hv.normalized() if hv.length > .2 else UP
        pos = A + UP * rr(.05, .3) + rvec() * .3
        card(mb, pos, rr(.9, 1.3), UP + h * .6 + rvec() * .4, LW(k, ta), (0, 0, .5, 1), M["leaves"], Cc)
    return B

def build_snag(mb, M, dark_uv, pale_uv):
    tz = 2.7; tp = []
    for k in range(21):
        t = k / 20; tp.append(Vector((.18 * math.sin(t * 2.5 + 1) - .15, .12 * math.sin(t * 3), tz * t)))
    radii = [.34 - .1 * (p.z / tz) + .22 * math.exp(-p.z / .4) for p in tp]
    trunk(mb, M, tp, radii, 22, 6, .14, .6, lambda t: blend(({"Trunk": 1}, 1 - ss(.35, .7, t)), ({"Trunk2": 1}, ss(.35, .7, t))))
    roots(mb, M, 6, (.6, 1.0), (1.5, 2.3), .22, (1.8, .85), sides=8, segs=10)
    T = tp[-1]; B = [("Trunk", Vector((0, 0, 0)), tp[10], None), ("Trunk2", tp[10], T, "Trunk")]
    for s in range(3):  # broken stubs
        z = rr(1.0, 2.3); c = tp[int(z / tz * 20)]; az = rr(0, TAU)
        pts = wander(c, hvec(az) + UP * .4, rr(.35, .6), 4, .1)
        tube(mb, pts, taper(.09, .035, 5), 6, M["bark"], lambda t: {"Trunk": 1} if z < 1.5 else {"Trunk2": 1})
    def BW(b, t): return blend(({"Trunk2": 1}, 1 - ss(0, .15, t)), ({f"Beam{b}": 1}, ss(0, .15, t) * (1 - ss(.45, .65, t))), ({f"Tip{b}": 1}, ss(.45, .65, t)))
    beams = []
    for b, az in enumerate([math.pi / 2 + .95, math.pi / 2 - .95, -math.pi / 2 + rr(-.3, .3)]):
        h = hvec(az); S = T + h * .08
        pts = bez([S, S + h * .8 + UP * .8, S + h * 1.7 + UP * 2.0, S + h * 1.6 + FRONT * .3 + UP * 3.2], 15, .05)
        tube(mb, pts, taper(.2, .035, 15), 9, M["bark"], lambda t, b=b: BW(b, t), rfun=gnarl_r(.1, 2.5, b))
        beams.append((h, pts))
        B += [(f"Beam{b}", pts[0], pts[7], "Trunk2"), (f"Tip{b}", pts[7], pts[14], f"Beam{b}"),
              (f"Rag{b}", pts[6] - UP * .3, pts[6] - UP * 1.8, f"Beam{b}")]
        def prong(st, d, L, w):
            tube(mb, wander(st, d, L, 4, .08, rise=.05), taper(.022, .004, 5), 4, M["bark"], lambda t: w)
        for n, i in enumerate((5, 8, 11)):
            S2 = pts[i]; d = (UP + h * .35 + FRONT * .25 + rvec() * .15).normalized(); w = BW(b, i / 14)
            tn = wander(S2, d, rr(1.0, 1.5) * (1 - .15 * n), 8, .06, rise=.06)
            tube(mb, tn, taper(.075, .016, 9), 6, M["bark"], lambda t, w=w: w)
            td = (tn[-1] - tn[-3]).normalized(); sd = td.cross(rvec()).normalized()
            for sg in (-1, 1): prong(tn[6], td + sd * sg * .8 + UP * .3, rr(.3, .5), w)
        td = (pts[-1] - pts[-3]).normalized(); sd = td.cross(UP).normalized(); w = BW(b, 1)
        for sg in (-1, 1): prong(pts[13], td + sd * sg * .7, rr(.55, .85), w)
    def hang_point():
        b = R.randrange(3); h, pts = beams[b]; i = R.randint(3, 12); return b, pts[i] - UP * .06, i / 14
    for r in range(15):
        b, A, ta = hang_point(); L = rr(.8, 1.7); yaw = rr(0, TAU); n = 7; pts, sds = [], []
        drift = rvec() * .05
        for s in range(n):
            t = s / (n - 1); pts.append(A - UP * L * t + Vector((drift.x, drift.y, 0)) * s + hvec(yaw + 1.57) * .08 * math.sin(t * math.pi))
            sds.append(hvec(yaw + .5 * t))
        u0 = rr(0, .45); w0 = BW(b, ta); wr = {f"Rag{b}": 1}
        ribbon(mb, pts, [rr(.3, .42) * (1 - .3 * s / (n - 1)) for s in range(n)], sds, hvec(yaw + math.pi / 2),
               lambda t, w0=w0, wr=wr: blend((w0, 1 - ss(0, .7, t)), (wr, ss(0, .7, t))), (u0, 0, u0 + .55, 1), M["cloth"], hvec(yaw + math.pi / 2) + UP * .2)
    for ch in range(6):
        b, A, ta = hang_point(); L = rr(.35, .8); w0 = BW(b, ta); wr = {f"Rag{b}": 1}
        tube(mb, [A - UP * L * s / 3 for s in range(4)], [.009] * 4, 3, M["bark"], lambda t, w0=w0, wr=wr: blend((w0, 1 - t), (wr, t)), uvc=dark_uv)
        Q = A - UP * (L + .07)
        blob(mb, Q, (.062, .07, .075), wr, pale_uv, M["bark"])
        for sg in (-1, 1):
            a = rr(0, TAU); d = (hvec(a) * .8 + UP * sg * .5).normalized()
            tube(mb, [Q - UP * .09 - d * .1, Q - UP * .09 + d * .1], [.013, .013], 4, M["bark"], lambda t, wr=wr: wr, uvc=pale_uv)
    return B

# ---------------------------------------------------------------- scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
mats = []
def addmat(m): mats.append(m); return len(mats) - 1
M = {}
if NAME in ("bloodoak", "weepwillow"):
    col, h = bark_dark(1024, SEED, warm=(4, 0, 0) if NAME == "bloodoak" else (8, 2, 0))
    M["bark"] = addmat(material("bark", save_img(col, "bark.jpg"), save_img(normal_map(h, 10), "bark_n.jpg", "Non-Color"), rough=.82, nstr=1.2))
if NAME == "bloodoak":
    M["sap"] = addmat(material("sap", color=(.22, .008, .01), rough=.12, emit=((.5, .025, .02), .45)))
    crim = [(150, 18, 26), (118, 12, 22), (176, 30, 32), (196, 44, 40), (134, 16, 24)]
    maro = [(98, 10, 22), (76, 6, 18), (120, 16, 30), (140, 22, 34)]
    atl = Image.new("RGBA", (2048, 1024))
    atl.paste(draw_clump(2048, SEED, crim).resize((1024, 1024), Image.LANCZOS), (0, 0))
    atl.paste(draw_clump(2048, SEED + 5, maro).resize((1024, 1024), Image.LANCZOS), (1024, 0))
    M["leaves"] = addmat(material("leaves", save_img(atl, "leaves.png"), rough=.6, alpha=True))
if NAME == "weepwillow":
    pal = [(140, 16, 26), (104, 10, 22), (168, 28, 32), (84, 8, 18), (186, 40, 38)]
    atl = Image.new("RGBA", (2048, 1024))
    atl.paste(draw_clump(2048, SEED, pal, lobes=0, Lr=(.09, .14), Wr=(.16, .22), n=420).resize((1024, 1024), Image.LANCZOS), (0, 0))
    atl.paste(draw_strands(512, 2048, SEED + 3, pal).resize((1024, 1024), Image.LANCZOS), (1024, 0))
    M["leaves"] = addmat(material("leaves", save_img(atl, "leaves.png"), rough=.6, alpha=True))
dark_uv = pale_uv = (0, 0)
if NAME == "antlersnag":
    col, h, dark_uv, pale_uv = bark_pale(1024, SEED)
    M["bark"] = addmat(material("bark", save_img(col, "bark.jpg"), save_img(normal_map(h, 9), "bark_n.jpg", "Non-Color"), rough=.75, nstr=1.0))
    M["cloth"] = addmat(material("cloth", save_img(cloth_tex(512, SEED), "cloth.png"), rough=.9, alpha=True))

mb = MB()
B = {"bloodoak": lambda: build_oak(mb, M), "weepwillow": lambda: build_willow(mb, M), "antlersnag": lambda: build_snag(mb, M, dark_uv, pale_uv)}[NAME]()

V = np.array(mb.V, np.float32); k = H / V[:, 2].max(); V *= k
B = [(n, h * k, t * k, p) for n, h, t, p in B]

me = bpy.data.meshes.new(NAME); me.from_pydata([tuple(v) for v in V], [], mb.F)
uvl = me.uv_layers.new(name="UVMap")
uvl.data.foreach_set("uv", [c for f in mb.FUV for uv in f for c in uv])
me.polygons.foreach_set("material_index", mb.FM); me.polygons.foreach_set("use_smooth", [True] * len(mb.F))
for m in mats: me.materials.append(m)
me.update()
cn = [c if any(c) else tuple(me.vertices[i].normal) for i, c in enumerate(mb.CN)]
me.normals_split_custom_set_from_vertices(cn)
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

AMP = {"Trunk": .5, "Trunk2": .9, "Limb": 1.8, "Crown": 3.2, "Curtain": 5.5, "Beam": 1.3, "Tip": 2.4, "Rag": 9.0}
scene.render.fps = 30; scene.frame_start = 0; scene.frame_end = 180
for i, pb in enumerate(ao.pose.bones):
    pb.rotation_mode = "XYZ"
    A = math.radians(next(v for kk, v in AMP.items() if pb.name.startswith(kk) and (kk != "Trunk" or pb.name == "Trunk")))
    ph = .45 * i + (.8 if pb.name.startswith(("Crown", "Curtain", "Tip", "Rag")) else 0)
    for f in range(0, 181, 3):
        tt = f / 30.0
        x = A * (.75 * math.sin(TAU * tt / 6 + ph) + .25 * math.sin(TAU * 3 * tt / 6 + ph * 1.7))
        z = A * .7 * (.7 * math.sin(TAU * 2 * tt / 6 + ph + 1.3) + .3 * math.sin(TAU * 5 * tt / 6 + ph * .6))
        pb.rotation_euler = (x, 0, z); pb.keyframe_insert("rotation_euler", frame=f)
ao.animation_data.action.name = "Sway"
scene.frame_set(0)

# ---------------------------------------------------------------- proof
scene.render.engine = "CYCLES"; scene.cycles.device = "CPU"; scene.cycles.samples = 16
scene.cycles.transparent_max_bounces = 24
try: scene.cycles.use_denoising = True
except Exception: pass
scene.render.resolution_x = scene.render.resolution_y = 480
w = bpy.data.worlds.new("w"); scene.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (.012, .017, .032, 1)
gm = bpy.data.meshes.new("g"); gm.from_pydata([(-30, -30, 0), (30, -30, 0), (30, 30, 0), (-30, 30, 0)], [], [(0, 1, 2, 3)])
g = bpy.data.objects.new("ground", gm); scene.collection.objects.link(g)
gmat = bpy.data.materials.new("gm"); gmat.use_nodes = True; gmat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (.03, .03, .035, 1); gm.materials.append(gmat)
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); sun.data.energy = 1.6; sun.data.color = (.62, .72, 1.0)
sun.rotation_euler = (math.radians(45), 0, math.radians(30)); scene.collection.objects.link(sun)
fire = bpy.data.objects.new("fire", bpy.data.lights.new("fire", "POINT")); fire.data.energy = 900; fire.data.color = (1, .45, .15)
fire.location = (3.5, -4.0, 1.2); scene.collection.objects.link(fire)
def cam(name, eye, aim, fov):
    c = bpy.data.objects.new(name, bpy.data.cameras.new(name)); scene.collection.objects.link(c)
    c.data.sensor_fit = "VERTICAL"; c.data.angle = math.radians(fov); c.location = eye
    c.rotation_euler = (Vector(aim) - Vector(eye)).to_track_quat("-Z", "Y").to_euler(); return c
views = [cam("c34", (H * 1.25, -H * 1.25, H * .55), (0, 0, H * .48), 40),
         cam("cplay", (11.1, -11.1, 20.6 + 1.0), (0, 0, 1.0), 50),
         cam("cground", (5.0, -6.5, 2.0), (0, 0, H * .38), 60)]
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
for m in js.get("materials", []):
    if m["name"] in ("leaves", "cloth"): m["alphaMode"] = "MASK"; m["alphaCutoff"] = .5; m["doubleSided"] = True
    else: m.pop("alphaMode", None); m.pop("alphaCutoff", None); m["doubleSided"] = False
nj = json.dumps(js, separators=(",", ":")).encode(); nj += b" " * ((4 - len(nj) % 4) % 4)
open(glb, "wb").write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(nj) + len(rest)) + struct.pack("<II", len(nj), 0x4E4F534A) + nj + rest)
acc = js["accessors"]; tris = 0; ymin, ymax = 1e9, -1e9
for mesh in js["meshes"]:
    for p in mesh["primitives"]:
        tris += acc[p["indices"]]["count"] // 3; pa = acc[p["attributes"]["POSITION"]]; ymin = min(ymin, pa["min"][1]); ymax = max(ymax, pa["max"][1])
audit = {"name": NAME, "tris": tris, "height": round(ymax - ymin, 3), "ymin": round(ymin, 3),
         "animations": [{"name": a["name"], "channels": len(a["channels"]), "dur": max(acc[s["input"]]["max"][0] for s in a["samplers"])} for a in js.get("animations", [])],
         "joints": [len(s["joints"]) for s in js.get("skins", [])],
         "materials": [(m["name"], m.get("alphaMode", "OPAQUE"), m.get("doubleSided")) for m in js["materials"]],
         "images": len(js.get("images", [])), "bytes": os.path.getsize(glb)}
json.dump(audit, open(f"{OUT}/{NAME}_audit.json", "w")); print("AUDIT", json.dumps(audit))
