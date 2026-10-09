# Lanternmere fen hero trees: drownedcypress / fenwillow / rotlog. One run per tree name:
#   blender -b --factory-startup --python-exit-code 1 --python art/fen/build.py -- drownedcypress
# Same craft as art/bloodwoods/build.py (helpers copied below, unchanged): procedural numpy/PIL textures,
# one skinned mesh (tubes, cards, ribbons), a small wind rig, a 6 s looping "Sway" action, a 3-view Cycles
# proof (3/4, iso play camera, ground), export to /workspace/fen/<name>.glb and a glTF audit.
# fenwillow leans toward Blender +Y = glTF -Z = the engine's forward: a placement's yaw aims the lean.
import bpy, math, random, os, sys, json, struct
import numpy as np
from mathutils import Vector, noise as mnoise
from PIL import Image, ImageDraw

NAME = sys.argv[sys.argv.index("--") + 1]
H = {"drownedcypress": 8.0, "fenwillow": 6.0, "rotlog": None}[NAME]   # None = keep authored metres
SEED = {"drownedcypress": 41, "fenwillow": 53, "rotlog": 67}[NAME]
R = random.Random(SEED)
OUT = "/workspace/fen"; TMP = f"/tmp/fen/{NAME}"
os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)
UP = Vector((0, 0, 1)); FRONT = Vector((0, 1, 0))
TAU = 2 * math.pi
# ---- helpers copied from art/bloodwoods/build.py
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
    col = lerp3((6, 4, 5), np.array((24, 21, 23)) + warm, plate)
    col = lerp3(col, np.array((56, 50, 52)) + warm, np.clip((det - .45) * 2, 0, 1) * plate * .8)
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
                f = (y - ys) / (ye - ys); L = rnd.uniform(120, 180) * (1 - .3 * f); W = L * .24
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


# ================================================================ fen textures
def bark_wet(n, seed, lift=1.0, algae=.7):
    s = fnoise(n, 1.5, seed, aniso=9); s2 = fnoise(n, 1.3, seed + 1, aniso=6)
    fiss = np.minimum(np.abs(s - .5) * 2, np.abs(s2 - .5) * 2.4)
    plate = np.clip(fiss / .16, 0, 1) ** .5
    det = fnoise(n, 1.0, seed + 2); stg = fnoise(n, .9, seed + 5, aniso=20)
    h = plate * (.65 + .2 * det + .15 * stg)
    col = lerp3((7, 7, 7), np.array((30, 28, 25)) * lift, plate)
    col = lerp3(col, np.array((66, 62, 54)) * lift, np.clip((det - .5) * 2.2, 0, 1) * plate * .8)
    alg = np.clip((fnoise(n, 1.9, seed + 6, aniso=2) - .52) * 5, 0, 1)
    col = lerp3(col, (40, 54, 42), alg * algae)
    return col, h

def moss_tex(n, seed):
    a = fnoise(n, 1.4, seed); b = fnoise(n, .8, seed + 1)
    col = lerp3((26, 34, 20), (78, 92, 48), a * .7 + b * .3)
    col = lerp3(col, (112, 118, 78), np.clip((b - .72) * 4, 0, 1) * .6)
    return col, a * .6 + b * .4

def soil_tex(n, seed):
    a = fnoise(n, 1.6, seed); b = fnoise(n, .7, seed + 1)
    col = lerp3((12, 9, 7), (46, 36, 26), a * .6 + b * .4)
    peb = np.clip((b - .8) * 6, 0, 1); col = lerp3(col, (70, 66, 60), peb * .7)
    return col, a * .5 + b * .5 + peb * .3

def c8(c, f=1.0): return tuple(int(max(0, min(255, v * f))) for v in c) + (255,)

def curtain(d, x0, w, h, rnd, pal, core):
    # one hanging curtain: a solid tapered core (the mass that reads from 14 m) with strands over it
    Lp, Rp = [], []
    for k in range(17):
        t = k / 16; y = t * h * .84; hw = w * (.36 - .1 * t) + rnd.uniform(-5, 5); sw = 9 * math.sin(t * 5 + rnd.random())
        Lp.append((max(x0 + 4, x0 + w / 2 - hw + sw), y)); Rp.append((min(x0 + w - 4, x0 + w / 2 + hw + sw), y))
    bot = [(Lp[-1][0] + (Rp[-1][0] - Lp[-1][0]) * k / 8, h * rnd.uniform(.84, .97)) for k in range(9)]
    d.polygon(Lp + bot + list(reversed(Rp)), fill=c8(core))
    for k in range(260):
        t0 = rnd.random(); x = x0 + w * (.1 + .8 * rnd.random()); y = rnd.uniform(0, .08) * h
        L = h * rnd.uniform(.35, .99) * (1 - .45 * abs(x - x0 - w / 2) / w); ph = rnd.uniform(0, TAU); amp = rnd.uniform(2, 9)
        pts = [(min(x0 + w - 3, max(x0 + 3, x + amp * math.sin(s * .8 + ph))), min(h - 2, y + L * s / 10)) for s in range(11)]
        base = rnd.choice(pal); f = rnd.uniform(.6, .9) if k < 150 else rnd.uniform(.95, 1.3)
        d.line(pts, fill=c8(base, f), width=rnd.randint(2, 5))

def needle_spray(d, x0, y0, s, rnd, pal, rusty):
    cx, cy = x0 + s / 2, y0 + s / 2
    for b in range(8):
        a = rnd.uniform(0, TAU); L = rnd.uniform(.24, .38) * s; base = (118, 60, 38) if rusty and rnd.random() < .6 else rnd.choice(pal)
        stem = []
        for k in range(14):
            t = k / 13; a2 = a + .25 * math.sin(t * 3); px = cx + math.cos(a2) * L * t; py = cy + math.sin(a2) * L * t; stem.append((px, py))
            if k:
                nl = s * .075 * (1 - t * .55)
                for sg in (-1, 1):
                    na = a2 + sg * rnd.uniform(.8, 1.2)
                    d.line([(px, py), (px + math.cos(na) * nl, py + math.sin(na) * nl)], fill=c8(base, rnd.uniform(.75, 1.2)), width=3)
        d.line(stem, fill=c8(base, .45), width=3)

def leaf_clump(d, x0, y0, s, rnd, pal):
    cx, cy = x0 + s / 2, y0 + s / 2
    for k in range(150):
        r = s * .36 * math.sqrt(rnd.random()); a = rnd.uniform(0, TAU)
        L = rnd.uniform(.12, .2) * s; ang = a + rnd.uniform(-.7, .7)
        bx, by = cx + r * math.cos(a) - math.cos(ang) * L * .3, cy + r * math.sin(a) - math.sin(ang) * L * .3
        base = rnd.choice(pal); f = (.55 + .6 * k / 150) * rnd.uniform(.85, 1.1)
        d.polygon(leaf_poly(bx, by, L, L * .2, ang), fill=c8(base, f * .85))
        d.polygon(leaf_poly(bx, by, L, L * .2, ang, half=1), fill=c8(base, f * 1.1))

def leaf_strand(d, x0, w, h, rnd, pal, core):
    # a willow ribbon: narrow solid core with lanceolate leaves shingled down both sides
    Lp, Rp = [], []
    for k in range(13):
        t = k / 12; hw = w * (.2 - .08 * t); sw = 7 * math.sin(t * 4 + rnd.random())
        Lp.append((x0 + w / 2 - hw + sw, t * h * .9)); Rp.append((x0 + w / 2 + hw + sw, t * h * .9))
    d.polygon(Lp + [(x0 + w / 2, h * .97)] + list(reversed(Rp)), fill=c8(core))
    y = 6
    while y < h * .93:
        t = y / h; sx = x0 + w / 2 + 7 * math.sin(t * 4)
        for sg in (-1, 1):
            L = w * rnd.uniform(.2, .33) * (1 - .35 * t); ang = math.pi / 2 - sg * rnd.uniform(.45, 1.0)
            base = rnd.choice(pal); f = rnd.uniform(.7, 1.25)
            poly = [(min(x0 + w - 3, max(x0 + 3, px)), py) for px, py in leaf_poly(sx, y, L, L * .2, ang)]
            d.polygon(poly, fill=c8(base, f))
        y += rnd.uniform(6, 11)

def atlas(seed, kind):
    S = 1024; rnd = random.Random(seed)
    if kind == "moss":
        pal = [(66, 76, 60), (88, 98, 78), (112, 120, 96), (136, 140, 114), (74, 84, 62)]; core = (46, 54, 42)
        im = Image.new("RGBA", (S, S), (*core, 0)); d = ImageDraw.Draw(im)
        for c in range(3): curtain(d, c * 256, 256, S, rnd, pal, core)
        npal = [(38, 52, 40), (52, 66, 48), (66, 78, 56)]
        for s in range(4): needle_spray(d, 768, s * 256, 256, rnd, npal, rusty=(s == 3))
    else:
        pal = [(46, 50, 26), (62, 66, 34), (78, 80, 42), (96, 94, 52), (54, 62, 40), (124, 112, 60)]; core = (40, 44, 24)
        im = Image.new("RGBA", (S, S), (*core, 0)); d = ImageDraw.Draw(im)
        for c in range(3): leaf_strand(d, c * 256, 256, S, rnd, pal, core)
        for s in range(4): leaf_clump(d, 768, s * 256, 256, rnd, pal)
    return im

COL = [(c * .25 + .004, 0.0, (c + 1) * .25 - .004, 1.0) for c in range(3)]          # ribbon columns, v1 = top
SQ = [(.754, 1 - (s + 1) * .25 + .004, .996, 1 - s * .25 - .004) for s in range(4)]  # card squares

def frame_up(t):
    b = t.cross(UP); b = b.normalized() if b.length > 1e-4 else Vector((1, 0, 0)); return b.cross(t).normalized(), b

# ================================================================ drowned cypress
def build_cypress(mb, M):
    NT = 30; tp = []
    for k in range(NT):
        t = (k / (NT - 1)) ** 1.45; tp.append(Vector((.18 * math.sin(t * 3.2), .12 * math.sin(t * 2.1 + 1), 7.7 * t)))
    radii = [.09 + .26 * (1 - p.z / 7.7) ** 1.3 + .95 * math.exp(-p.z / .62) for p in tp]
    def rf(i, a, c):
        fl = math.exp(-c.z / .75); lobe = max(0.0, math.cos(5 * a + .6 * math.sin(2 * a))) ** 3
        return (1 - .42 * fl) + fl * 1.05 * lobe + .06 * mnoise.noise(Vector((math.cos(a) * 1.7, math.sin(a) * 1.7, c.z * 1.1)))
    tz = lambda t: blend(({"Trunk": 1}, 1 - ss(.45, .7, t)), ({"Trunk2": 1}, ss(.45, .7, t)))
    tube(mb, tp, radii, 30, M["bark"], tz, U=2, rfun=rf)
    roots(mb, M, 7, (.45, .8), (2.2, 3.6), .24, (1.9, .8), sides=8, segs=10)
    for k in range(11):   # cypress knees standing out of the water
        az = TAU * k / 11 + rr(-.3, .3); base = hvec(az) * rr(1.8, 3.8); hg = rr(.3, 1.0); r0 = .17 * rr(.8, 1.25)
        pts = [base + UP * (-.05 + hg * s / 6) + hvec(az + 1.3) * .05 * math.sin(s * 1.3) for s in range(7)]
        rad = [r0 * (1 - .5 * (s / 6) ** 1.4) for s in range(7)]; rad[-2] *= .8; rad[-1] = .015; pts[-1] = pts[-2] + UP * .05
        tube(mb, pts, rad, 7, M["bark"], lambda t: {"Trunk": 1}, U=1, rfun=gnarl_r(.15, 4.0, k))
    zi = min(range(NT), key=lambda i: abs(tp[i].z - 3.4))
    B = [("Trunk", Vector((0, 0, 0)), tp[zi], None), ("Trunk2", tp[zi], tp[-1], "Trunk")]
    NL = 9; ctr = Vector((0, 0, 5.5))
    for k in range(NL):
        f = k / (NL - 1); z = 3.9 + 3.4 * f; az = k * 2.39996 + rr(-.2, .2)
        S = min(tp, key=lambda p: abs(p.z - z)).copy(); h = hvec(az); tg = UP.cross(h)
        L = rr(2.4, 3.1) * (1 - .45 * f)
        pts = bez([S, S + h * L * .35 + UP * .35, S + h * L * .7 + UP * .2, S + h * L + UP * rr(.25, .6)], 9, .05)
        r0 = .17 * (1 - .4 * f)
        LW = lambda t, k=k: blend(({"Trunk2": 1}, 1 - ss(0, .25, t)), ({f"Limb{k}": 1}, ss(0, .25, t)))
        tube(mb, pts, taper(r0, .025, 9), 7, M["bark"], LW, rfun=gnarl_r(.1, 3.0, k))
        anchors = [(pts[i], LW(i / 8), tg) for i in range(2, 9)]
        for s in range(2):
            i = R.randint(3, 6); P = pts[i]; h2 = hvec(az + (1 if s else -1) * rr(.6, 1.1)); w = LW(i / 8)
            sp = bez([P, P + h2 * .45 + UP * .2, P + h2 * .85 + UP * .12, P + h2 * 1.2 + UP * .25], 5, .03)
            tube(mb, sp, taper(r0 * .4, .015, 5), 5, M["bark"], lambda t, w=w: w)
            anchors += [(sp[j], w, UP.cross(h2)) for j in (2, 4)]
        # flat layered needle sprays: the bald-cypress crown read from above
        for c in range(9):
            P, w, _ = R.choice(anchors[2:]); nrm = (UP + rvec() * .35).normalized()
            card(mb, P + UP * rr(.05, .25) + rvec() * .2, rr(.9, 1.35), nrm, w, SQ[R.choice((0, 1, 2, 3, 0, 1, 2))], M["curtain"], ctr, bend=.1, cnup=1.2)
        # moss curtains hung along the limb
        mid = pts[5]
        B.append((f"Limb{k}", pts[0], pts[-1], "Trunk2")); B.append((f"Curtain{k}", mid, mid - UP * 2.2, f"Limb{k}"))
        for c in range(10 if k < 7 else 6):
            A, w0, along = R.choice(anchors); A = A.copy()
            Lc = rr(1.6, min(3.6, A.z - .6)); ph = rr(0, TAU); wsc = rr(.8, 1.2)
            side = along.normalized() if R.random() < .72 else h.copy()
            out = side.cross(UP).normalized()
            ptsc = [A + out * .08 * u - UP * Lc * u + side * .06 * math.sin(u * 3 + ph) for u in [s / 6 for s in range(7)]]
            wc = {f"Curtain{k}": 1}
            ribbon(mb, ptsc, [(.95 - .35 * s / 6) * wsc for s in range(7)], side, out,
                   lambda t, w0=w0, wc=wc: blend((w0, 1 - ss(.0, .45, t)), (wc, ss(.0, .45, t))), R.choice(COL), M["curtain"], (out * .6 + UP).normalized())
    for c in range(6):   # crown top tuft
        card(mb, tp[-1] + rvec() * .35 + UP * .1, rr(.9, 1.2), (UP + rvec() * .4).normalized(), {"Trunk2": 1}, SQ[c % 4], M["curtain"], ctr, bend=.12, cnup=1.2)
    return B

# ================================================================ fen willow
def build_willow(mb, M):
    tp = bez([Vector((0, 0, 0)), Vector((0, .2, 1.5)), Vector((.25, 1.6, 2.7)), Vector((.4, 3.0, 3.25))], 20)
    radii = [.32 - .16 * (i / 19) + .3 * math.exp(-p.z / .35) for i, p in enumerate(tp)]
    trunk(mb, M, tp, radii, 20, 4, .16, .25, lambda t: blend(({"Trunk": 1}, 1 - ss(.35, .65, t)), ({"Trunk2": 1}, ss(.35, .65, t))))
    roots(mb, M, 6, (.45, .8), (1.4, 2.3), .2, (1.8, .85), sides=7, segs=9)
    lp = bez([tp[8], tp[8] + Vector((.3, -.2, 1.0)), tp[8] + Vector((.4, -.5, 2.2)), tp[8] + Vector((.6, -.4, 2.9))], 12, .03)
    tube(mb, lp, taper(.17, .07, 12), 10, M["bark"], lambda t: blend(({"Trunk": 1}, 1 - ss(0, .2, t)), ({"Lead": 1}, ss(0, .2, t))), rfun=gnarl_r(.1, 2.5, 7))
    B = [("Trunk", Vector((0, 0, 0)), tp[9], None), ("Trunk2", tp[9], tp[-1], "Trunk"), ("Lead", lp[0], lp[-1], "Trunk")]
    # a broken snag stub off the lean
    sp = bez([tp[13], tp[13] + Vector((-.5, .2, .3)), tp[13] + Vector((-.9, .4, .5)), tp[13] + Vector((-1.2, .5, .9))], 6, .03)
    tube(mb, sp, taper(.1, .04, 6), 6, M["bark"], lambda t: {"Trunk2": 1})
    crowns = [(tp[-1], "Trunk2", [0.0, .9, -.9, 1.9, -1.9]), (lp[-1], "Lead", [math.pi, math.pi + .9, math.pi - 1.1])]
    k = 0; ctr = Vector((.3, 2.0, 4.5))
    for T, par, azs in crowns:
        for a0 in azs:
            az = math.pi / 2 + a0 + rr(-.2, .2); h = hvec(az); tg = UP.cross(h)
            pts = bez([T, T + h * .5 + UP * 1.0, T + h * 1.4 + UP * 1.6, T + h * 2.3 + UP * .7], 11, .05)
            LW = lambda t, k=k, par=par: blend(({par: 1}, 1 - ss(0, .2, t)), ({f"Limb{k}": 1}, ss(0, .2, t)))
            tube(mb, pts, taper(.12, .025, 11), 6, M["bark"], LW, rfun=gnarl_r(.1, 2.3, k))
            B.append((f"Limb{k}", pts[0], pts[6], par)); B.append((f"Curtain{k}", pts[7], pts[7] - UP * 2.0, f"Limb{k}"))
            for c in range(7):   # crown mass on the crest
                i = R.randint(3, 9); card(mb, pts[i] + UP * rr(.1, .35) + rvec() * .3, rr(.9, 1.3), (UP + rvec() * .5).normalized(), LW(i / 10), SQ[R.randrange(4)], M["leaves"], ctr, bend=.15, cnup=.9)
            for c in range(17):  # solid leaf curtains falling to the water
                i = R.randint(4, 10); A = pts[i].copy(); w0 = LW(i / 10)
                endZ = rr(.2, .9) if R.random() < .7 else rr(1.2, 2.4); Lc = max(.8, A.z - endZ); ph = rr(0, TAU)
                side = tg.normalized() if R.random() < .75 else h.copy(); out = side.cross(UP).normalized()
                if out.dot(h) < 0: out = -out
                ptsc = []
                for s in range(8):
                    u = s / 7; ptsc.append(A + h * (.25 * min(1, u * 4)) - UP * Lc * u ** 1.1 + side * .08 * math.sin(u * 3 + ph))
                wc = {f"Curtain{k}": 1}; wsc = rr(.85, 1.2)
                ribbon(mb, ptsc, [(.5 - .14 * s / 7) * wsc for s in range(8)], side, out,
                       lambda t, w0=w0, wc=wc: blend((w0, 1 - ss(.0, .4, t)), (wc, ss(.0, .4, t))), R.choice(COL), M["leaves"], (h * .5 + UP).normalized())
            k += 1
    return B

# ================================================================ rot log
def build_log(mb, M):
    N = 16; NS = 18
    pts = [Vector((-3 + 6 * i / (N - 1), .08 * math.sin(i * .5), .36 + .05 * math.sin(i * .4))) for i in range(N)]
    radii = [.47 - .12 * (i / (N - 1)) + .1 * math.exp(-i / 1.5) for i in range(N)]
    def mf(i, j):
        a = TAU * (j + .5) / NS; c = pts[i]
        return M["moss"] if math.cos(a) + .55 * mnoise.noise(Vector((c.x * .8, j * .35, 1.3))) > .05 else M["bark"]
    tube(mb, pts, radii, NS, M["bark"], lambda t: {"Log": 1}, U=2, rfun=gnarl_r(.07, 2.0, 3), mfun=mf, up_frame=True)
    # the snapped end: a splinter crown around a sunken heart
    C = pts[-1]; t = (pts[-1] - pts[-2]).normalized(); n, b = frame_up(t); r = radii[-1] * .97
    ring = [mb.v(C + n * math.cos(TAU * j / NS) * r + b * math.sin(TAU * j / NS) * r, {"Log": 1}) for j in range(NS)]
    spk = [mb.v(C + t * (rr(.0, .45) if j % 2 else rr(-.04, .12)) + (n * math.cos(TAU * j / NS) + b * math.sin(TAU * j / NS)) * r * rr(.6, .9), {"Log": 1}) for j in range(NS)]
    hc = mb.v(C - t * .06, {"Log": 1})
    for j in range(NS):
        j2 = (j + 1) % NS; u0 = j / NS; u1 = (j + 1) / NS
        mb.f((ring[j], ring[j2], spk[j2], spk[j]), [(u0, 0), (u1, 0), (u1, .3), (u0, .3)], M["bark"])
        mb.f((spk[j], spk[j2], hc), [(.3, .3), (.35, .3), (.32, .4)], M["heart"])
    # the torn root plate: a soil disc standing on end, roots snapping out of it
    P0 = Vector((-3.15, 0, 1.0))
    blob(mb, P0, (.3, 1.35, 1.0), {"Log": 1}, (.5, .5), M["soil"], seg=14, rings=8)
    for k in range(16):
        th = TAU * k / 16 + rr(-.15, .15); d = Vector((-rr(.15, .5), math.cos(th), math.sin(th))).normalized()
        S = P0 + Vector((-.12, math.cos(th) * 1.05, math.sin(th) * .8)); L = rr(.5, 1.5)
        rp = [S + d * L * s / 5 + rvec() * .06 * (s > 0) - UP * (.12 * (s / 5) ** 2 * L) for s in range(6)]
        tube(mb, rp, taper(rr(.07, .12), .02, 6), 6, M["bark"], lambda t: {"Log": 1}, U=1)
    for k in range(5):  # dangling hair roots
        S = P0 + Vector((-.2, rr(-.9, .9), rr(-.2, .6))); rp = [S + Vector((-.05 * s, rvec().y * .05, -s * rr(.12, .18))) for s in range(5)]
        tube(mb, rp, taper(.035, .01, 5), 5, M["bark"], lambda t: {"Drape0": 1}, U=1)
    def surf(x, a, k=1.0):   # a point on the log's skin at x, angle a from straight up
        i = min(N - 1, max(0, int(round((x + 3) / 6 * (N - 1))))); n, b = frame_up(Vector((1, 0, 0)))
        return pts[i] + (n * math.cos(a) + b * math.sin(a)) * radii[i] * k, n * math.cos(a) + b * math.sin(a)
    for k in range(9):   # moss pillows on the top
        p, _ = surf(rr(-2.6, 2.4), rr(-.6, .6), .9)
        blob(mb, p, (rr(.25, .45), rr(.18, .3), rr(.07, .12)), {"Log": 1}, (.4, .6), M["moss"], seg=9, rings=4)
    for k in range(7):   # shelf fungus brackets, stacked
        x = rr(-2.2, 2.3); a = (1 if k % 2 else -1) * rr(1.35, 1.8)
        for s in range(R.randint(2, 3)):
            p, d = surf(x + rr(-.08, .08), a + s * .22, .98); sz = rr(.14, .24) * (1 - .2 * s)
            blob(mb, p + d * sz * .45, (sz * 1.1, sz * .8, .045), {"Log": 1}, (.5, .5), M["fungus"] if R.random() < .7 else M["fungpale"], seg=10, rings=4)
    for k in range(8):   # little lantern caps glowing in the moss
        x = rr(-2.6, 2.6); p, d = surf(x, rr(-.9, .9), .97) if k < 6 else (Vector((-2.85, rr(-.9, .9), .08)), UP)
        hgt = rr(.06, .13); st = [p, p + UP * hgt]
        tube(mb, st, [.012, .01], 5, M["fungpale"], lambda t: {"Log": 1}, U=1)
        blob(mb, p + UP * hgt, (rr(.035, .06),) * 2 + (.025,), {"Log": 1}, (.5, .5), M["glow"], seg=7, rings=3)
    for k in range(7):   # moss drapes over the flanks
        x = -2.4 + 4.6 * k / 6 + rr(-.2, .2); sg = 1 if k % 2 else -1; A, d = surf(x, sg * rr(.9, 1.2), 1.02)
        out = Vector((0, sg, 0)); ln = A.z - .03
        dp = [A + out * (.12 * math.sin(u * math.pi * .7)) - UP * ln * u for u in [s / 5 for s in range(6)]]
        wc = {f"Drape{k % 3}": 1}
        ribbon(mb, dp, [rr(.45, .7) * (1 - .3 * s / 5) for s in range(6)], Vector((1, 0, 0)), out,
               lambda t, wc=wc: blend(({"Log": 1}, 1 - ss(.0, .5, t)), (wc, ss(.0, .5, t))), R.choice(COL), M["curtain"], (out * .5 + UP).normalized())
    return [("Log", Vector((-3, 0, .4)), Vector((3, 0, .4)), None)] + [(f"Drape{i}", Vector((-1.5 + 1.5 * i, 0, .8)), Vector((-1.5 + 1.5 * i, 0, 0)), "Log") for i in range(3)]

# ================================================================ scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
mats = []
def addmat(m): mats.append(m); return len(mats) - 1
M = {}
if NAME == "drownedcypress":
    col, h = bark_wet(1024, SEED)
    M["bark"] = addmat(material("bark", save_img(col, "bark.jpg"), save_img(normal_map(h, 11), "bark_n.jpg", "Non-Color"), rough=.42, nstr=1.3))
    M["curtain"] = addmat(material("curtain", save_img(atlas(SEED, "moss"), "moss.png"), rough=.8, alpha=True))
if NAME == "fenwillow":
    col, h, _, _ = bark_pale(1024, SEED)
    M["bark"] = addmat(material("bark", save_img(col, "bark.jpg"), save_img(normal_map(h, 9), "bark_n.jpg", "Non-Color"), rough=.6, nstr=1.0))
    M["leaves"] = addmat(material("leaves", save_img(atlas(SEED, "leaf"), "leaves.png"), rough=.6, alpha=True))
if NAME == "rotlog":
    col, h = bark_wet(1024, SEED, lift=1.45, algae=.5)
    M["bark"] = addmat(material("bark", save_img(col, "bark.jpg"), save_img(normal_map(h, 11), "bark_n.jpg", "Non-Color"), rough=.55, nstr=1.3))
    col, h = moss_tex(512, SEED + 3)
    M["moss"] = addmat(material("moss", save_img(col, "moss.jpg"), save_img(normal_map(h, 14), "moss_n.jpg", "Non-Color"), rough=.9, nstr=1.4))
    col, h = soil_tex(512, SEED + 5)
    M["soil"] = addmat(material("soil", save_img(col, "soil.jpg"), save_img(normal_map(h, 12), "soil_n.jpg", "Non-Color"), rough=.95))
    M["heart"] = addmat(material("heart", color=(.2, .12, .06), rough=.9))
    M["fungus"] = addmat(material("fungus", color=(.36, .2, .08), rough=.5))
    M["fungpale"] = addmat(material("fungpale", color=(.66, .58, .42), rough=.6))
    M["glow"] = addmat(material("glow", color=(.15, .48, .53), rough=.4, emit=((.15, .55, .62), 3.0)))
    M["curtain"] = addmat(material("curtain", save_img(atlas(SEED, "moss"), "drape.png"), rough=.85, alpha=True))

mb = MB()
B = {"drownedcypress": lambda: build_cypress(mb, M), "fenwillow": lambda: build_willow(mb, M), "rotlog": lambda: build_log(mb, M)}[NAME]()

V = np.array(mb.V, np.float32); V[:, 2] = np.maximum(V[:, 2], 0)
k = (H / V[:, 2].max()) if H else 1.0; V *= k
B = [(n, hh * k, t * k, p) for n, hh, t, p in B]
HV = float(V[:, 2].max())

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
for n, hh, t, p in B:
    eb = arm.edit_bones.new(n); eb.head = hh; eb.tail = t if (t - hh).length > .05 else hh + Vector((0, 0, .3))
for n, hh, t, p in B:
    if p: arm.edit_bones[n].parent = arm.edit_bones[p]
bpy.ops.object.mode_set(mode="OBJECT")
groups = {n: ob.vertex_groups.new(name=n) for n, *_ in B}
for i, w in enumerate(mb.W):
    for bn, x in w.items(): groups[bn].add([i], x, "REPLACE")
ob.parent = ao; mod = ob.modifiers.new("skin", "ARMATURE"); mod.object = ao

# moss and leaf curtains drift; the cypress barely moves; the log lies still and only its drapes stir
AMP = {"drownedcypress": {"Trunk": .3, "Trunk2": .6, "Limb": 1.4, "Curtain": 5.0, "Lead": .8},
       "fenwillow": {"Trunk": .4, "Trunk2": .8, "Lead": 1.0, "Limb": 1.8, "Curtain": 5.5},
       "rotlog": {"Log": 0.0, "Drape": 3.5}}[NAME]
scene.render.fps = 30; scene.frame_start = 0; scene.frame_end = 180
for i, pb in enumerate(ao.pose.bones):
    pb.rotation_mode = "XYZ"
    A = math.radians(next(v for kk, v in AMP.items() if pb.name.startswith(kk) and (kk != "Trunk" or pb.name == "Trunk")))
    ph = .45 * i + (.8 if pb.name.startswith(("Curtain", "Drape")) else 0)
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
gmat = bpy.data.materials.new("gm"); gmat.use_nodes = True; gb = gmat.node_tree.nodes["Principled BSDF"]
gb.inputs["Base Color"].default_value = (.02, .025, .03, 1); gb.inputs["Roughness"].default_value = .15; gm.materials.append(gmat)   # wet fen floor
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); sun.data.energy = 1.6; sun.data.color = (.62, .72, 1.0)
sun.rotation_euler = (math.radians(45), 0, math.radians(30)); scene.collection.objects.link(sun)
fire = bpy.data.objects.new("fire", bpy.data.lights.new("fire", "POINT")); fire.data.energy = 900; fire.data.color = (1, .45, .15)
fire.location = (3.5, -4.0, 1.2); scene.collection.objects.link(fire)
def cam(name, eye, aim, fov):
    c = bpy.data.objects.new(name, bpy.data.cameras.new(name)); scene.collection.objects.link(c)
    c.data.sensor_fit = "VERTICAL"; c.data.angle = math.radians(fov); c.location = eye
    c.rotation_euler = (Vector(aim) - Vector(eye)).to_track_quat("-Z", "Y").to_euler(); return c
VH = max(HV, 4.5); cy = 1.2 if NAME == "fenwillow" else 0
views = [cam("c34", (VH * 1.25, -VH * 1.25 + cy, VH * .55), (0, cy, HV * .45), 40),
         cam("cplay", (11.1, -11.1 + cy, 20.6 + 1.0), (0, cy, 1.0), 50),
         cam("cground", (5.0, -6.5, 1.7), (0, cy, HV * .4), 60)]
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
    if m["name"] in ("leaves", "curtain"): m["alphaMode"] = "MASK"; m["alphaCutoff"] = .5; m["doubleSided"] = True
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
