# Frostbitten Vale hero trees: rimepine / frostbirch / icesnag. One run per tree:
#   blender -b --factory-startup --python-exit-code 1 --python art/frost/build.py -- rimepine
# Procedural textures (numpy/PIL), solid needle tiers + snow lumps, faceted ice, a small wind rig,
# a 6 s looping "Sway" action, a 3-view Cycles proof (3/4, iso play camera, ground), export + audit.
# Craft copied from art/bloodwoods/build.py (same tube/card/rig/export path).
import bpy, math, random, os, sys, json, struct
import numpy as np
from mathutils import Vector, noise as mnoise
from PIL import Image, ImageDraw, ImageFilter

NAME = sys.argv[sys.argv.index("--") + 1]
H = {"rimepine": 9.0, "frostbirch": 7.0, "icesnag": 5.0}[NAME]
SEED = {"rimepine": 41, "frostbirch": 53, "icesnag": 67}[NAME]
R = random.Random(SEED)
OUT = "/workspace/frost"; TMP = f"/tmp/frost/{NAME}"
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

def bark_spruce(n, seed):
    s = fnoise(n, 1.5, seed, aniso=6); s2 = fnoise(n, 1.2, seed + 1, aniso=3)
    plate = np.clip(np.minimum(np.abs(s - .5) * 2, np.abs(s2 - .5) * 2.4) / .2, 0, 1) ** .6
    det = fnoise(n, 1.0, seed + 2)
    col = lerp3((8, 7, 8), (40, 32, 30), plate)
    col = lerp3(col, (78, 70, 68), np.clip((det - .5) * 2.2, 0, 1) * plate * .7)
    lich = np.clip((fnoise(n, 1.8, seed + 3) - .66) * 7, 0, 1) * plate          # pale frost lichen in patches
    col = lerp3(col, (120, 138, 146), lich * .6)
    return col, plate * (.7 + .3 * det)

def bark_birch(n, seed):
    rnd = random.Random(seed)
    grain = fnoise(n, 1.2, seed, aniso=.12); det = fnoise(n, 1.0, seed + 1)
    col = lerp3((176, 174, 168), (232, 228, 216), grain * .6 + det * .4)
    h = grain * .2 + det * .1
    im = Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(im)
    hm = Image.fromarray((h * 255).astype(np.uint8)); dh = ImageDraw.Draw(hm)
    for k in range(260):                                    # lenticels: dark horizontal dashes (u wraps round the trunk)
        x = rnd.uniform(0, n); y = rnd.uniform(0, n); L = rnd.uniform(14, 90); t = rnd.uniform(1.5, 5)
        for dx in (-n, 0, n):
            d.rectangle([x + dx, y, x + dx + L, y + t], fill=(26, 22, 22)); dh.rectangle([x + dx, y, x + dx + L, y + t], fill=0)
    for k in range(9):                                      # black scars / chevrons where branches fell
        x = rnd.uniform(0, n); y = rnd.uniform(0, n); w = rnd.uniform(40, 120); hh = rnd.uniform(30, 90)
        for dx in (-n, 0, n):
            pts = [(x + dx - w / 2, y), (x + dx, y + hh * .35), (x + dx + w / 2, y), (x + dx + w * .35, y + hh * .7), (x + dx, y + hh), (x + dx - w * .35, y + hh * .7)]
            d.polygon(pts, fill=(18, 16, 17)); dh.polygon(pts, fill=0)
    blot = fnoise(n, 1.9, seed + 4, aniso=.5); a = np.array(im).astype(np.float32)
    bm = np.clip((blot - .72) * 9, 0, 1); a = lerp3(a, (30, 27, 27), bm)
    h = np.array(hm).astype(np.float32) / 255 * (1 - bm) + bm * .05
    return a, h

def bark_dead(n, seed):
    grain = fnoise(n, 1.25, seed, aniso=12); det = fnoise(n, 1.0, seed + 1)
    crack = (np.abs(fnoise(n, 1.3, seed + 2, aniso=9) - .5) < .014).astype(np.float32)
    col = lerp3((52, 54, 60), (134, 136, 140), grain * .75 + det * .25)
    col = lerp3(col, (16, 16, 20), crack)
    frost = np.clip((fnoise(n, 1.7, seed + 3, aniso=2) - .6) * 6, 0, 1)
    col = lerp3(col, (170, 196, 210), frost * .55)
    return col, grain * .35 + det * .1 - crack * .35

def needle_tex(n, seed):
    rnd = random.Random(seed); im = Image.new("RGB", (n, n), (9, 16, 18)); d = ImageDraw.Draw(im)
    pal = [(20, 38, 36), (27, 48, 44), (15, 29, 31), (33, 56, 50), (24, 40, 46)]
    for k in range(9000):
        x = rnd.uniform(0, n); y = rnd.uniform(0, n); top = y < n / 2
        f = (1.0 if top else .5) * rnd.uniform(.7, 1.25) * (.8 + .4 * (1 - y / n))
        a = math.pi / 2 + rnd.uniform(-.55, .55); L = rnd.uniform(9, 20); c = rnd.choice(pal)
        col = tuple(int(min(255, v * f)) for v in c)
        for dx in (-n, 0, n): d.line([(x + dx, y), (x + dx + math.cos(a) * L, y + math.sin(a) * L)], fill=col, width=2)
    for k in range(700):
        x = rnd.uniform(0, n); y = rnd.uniform(0, n * .5); c = (96, 120, 136) if rnd.random() < .7 else (150, 172, 188)
        for dx in (-n, 0, n): d.ellipse([x + dx - 1.5, y - 1.5, x + dx + 1.5, y + 1.5], fill=c)
    a = np.array(im).astype(np.float32); h = np.array(im.convert("L").filter(ImageFilter.GaussianBlur(1))).astype(np.float32) / 255
    return a, h

def snow_tex(n, seed):
    a = fnoise(n, 1.7, seed); b = fnoise(n, 1.1, seed + 1); c = fnoise(n, .6, seed + 2)
    col = lerp3((150, 170, 200), (226, 234, 244), a * .7 + b * .3)
    col = lerp3(col, (250, 252, 255), (c > .93).astype(np.float32) * .8)
    return col, a * .8 + b * .2

def ice_tex(n, seed):
    rnd = random.Random(seed)
    a = fnoise(n, 1.6, seed); b = fnoise(n, 1.1, seed + 1, aniso=.3)
    col = lerp3((28, 72, 92), (109, 184, 192), a * .75 + b * .25)                 # #6DB8C0 against a deep core
    col = lerp3(col, (190, 228, 234), np.clip((b - .62) * 4, 0, 1) * .7)          # milky veils
    im = Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(im)
    hm = Image.fromarray((a * 160).astype(np.uint8)); dh = ImageDraw.Draw(hm)
    for k in range(40):                                                           # fracture planes
        x, y = rnd.uniform(0, n), rnd.uniform(0, n); ang = rnd.uniform(0, TAU); pts = [(x, y)]
        for s in range(rnd.randint(3, 7)):
            ang += rnd.uniform(-.6, .6); L = rnd.uniform(15, 60); x += math.cos(ang) * L; y += math.sin(ang) * L; pts.append((x, y))
        d.line(pts, fill=(214, 240, 244), width=rnd.choice((1, 2, 2, 3))); dh.line(pts, fill=255, width=2)
    for k in range(260):                                                          # trapped bubbles
        x, y, r = rnd.uniform(0, n), rnd.uniform(0, n), rnd.uniform(1, 3.5)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(200, 236, 240))
    return np.array(im).astype(np.float32), np.array(hm).astype(np.float32) / 255

def spray_atlas(seed):
    # 2 cells: a spruce bough spray (stem up the card), lit and underside; bottom of the card = inner end
    S = 512; atl = Image.new("RGBA", (S * 2, S), (14, 28, 28, 0))
    for cell in range(2):
        rnd = random.Random(seed * 7 + cell); im = Image.new("RGBA", (S, S), (14, 28, 28, 0)); d = ImageDraw.Draw(im)
        f0 = 1.0 if cell == 0 else .55
        def twig(x, y, ang, L, w):
            pts = [(x, y)]
            for s in range(8):
                ang += rnd.uniform(-.06, .06); x += math.cos(ang) * L / 8; y += math.sin(ang) * L / 8; pts.append((x, y))
            for i, (px, py) in enumerate(pts):
                for k in range(7):
                    side = 1 if k % 2 else -1; na = ang + side * rnd.uniform(.5, 1.1); nl = rnd.uniform(14, 26) * (1 - .4 * i / 8)
                    c = (int(rnd.uniform(18, 34) * f0 * 1.1), int(rnd.uniform(34, 56) * f0), int(rnd.uniform(32, 50) * f0), 255)
                    d.line([(px, py), (px + math.cos(na) * nl, py + math.sin(na) * nl)], fill=c, width=3)
            d.line(pts, fill=(30, 22, 20, 255), width=w)
            tx, ty = pts[-1]
            for k in range(6):
                ex, ey = tx + rnd.uniform(-16, 16), ty + rnd.uniform(-16, 16)
                d.ellipse([ex - 3, ey - 3, ex + 3, ey + 3], fill=(int(140 * f0), int(165 * f0), int(185 * f0), 255))
            return pts
        main = twig(S / 2, S * .97, -math.pi / 2, S * .86, 7)
        for i in (2, 3, 4, 5, 6):
            for sg in (-1, 1):
                if rnd.random() < .85:
                    x, y = main[i]; twig(x, y, -math.pi / 2 + sg * rnd.uniform(.6, .95), S * .34 * (1 - .1 * i), 4)
        atl.paste(im, (cell * S, 0))
    return atl, [(0, 0, .5, 1), (.5, 0, 1, 1)]

def rime_atlas(seed):
    # 2x2 cells of hoar-frosted twig fans: dark twigs furred with white-blue crystals; bottom row dimmer
    S = 512; atl = Image.new("RGBA", (S * 2, S * 2), (200, 216, 230, 0))
    for cell in range(4):
        rnd = random.Random(seed * 13 + cell); im = Image.new("RGBA", (S, S), (200, 216, 230, 0)); d = ImageDraw.Draw(im)
        dim = 1.0 if cell < 2 else .7; segs = []
        def br(x, y, ang, L, w, depth):
            pts = [(x, y)]
            for s in range(5):
                ang += rnd.uniform(-.18, .18); x += math.cos(ang) * L / 5; y += math.sin(ang) * L / 5; pts.append((x, y))
            segs.append((pts, w, ang))
            if depth > 0:
                for k in range(rnd.randint(2, 3)):
                    i = rnd.randint(2, 5); px, py = pts[i]
                    br(px, py, ang + rnd.choice((-1, 1)) * rnd.uniform(.35, .8), L * rnd.uniform(.5, .7), max(1, w - 1.5), depth - 1)
        br(S / 2, S * .98, -math.pi / 2 + rnd.uniform(-.15, .15), S * .5, 6, 4)
        for pts, w, ang in segs:                                     # frost fur under, so the twig line reads through it
            for i in range(len(pts) - 1):
                (x0, y0), (x1, y1) = pts[i], pts[i + 1]
                for k in range(4):
                    t = rnd.random(); px, py = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
                    for sg in (-1, 1):
                        a = ang + sg * rnd.uniform(.7, 1.3); L = rnd.uniform(4, 11)
                        c = tuple(int(v * dim * rnd.uniform(.9, 1.05)) for v in (222, 234, 246)) + (255,)
                        d.line([(px, py), (px + math.cos(a) * L, py + math.sin(a) * L)], fill=c, width=2)
            d.line(pts, fill=tuple(int(v * dim) for v in (190, 210, 228)) + (255,), width=int(w + 3))
        for pts, w, ang in segs:
            d.line(pts, fill=(34, 32, 36, 255), width=max(1, int(w * .6)))
        atl.paste(im, ((cell % 2) * S, (cell // 2) * S))
    cells = [((i % 2) * .5, .5 - (i // 2) * .5, (i % 2) * .5 + .5, 1 - (i // 2) * .5) for i in range(4)]
    return atl, cells

def save_img(arr_or_im, name, colorspace="sRGB"):
    path = f"{TMP}/{name}"
    im = arr_or_im if isinstance(arr_or_im, Image.Image) else Image.fromarray(np.clip(arr_or_im, 0, 255).astype(np.uint8))
    if path.endswith(".jpg"): im.convert("RGB").save(path, quality=90)
    else: im.save(path)
    img = bpy.data.images.load(path); img.pack(); img.colorspace_settings.name = colorspace
    return img

def material(name, base=None, nrm=None, color=None, rough=.8, alpha=False, emit=None, nstr=1.0, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    if base:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = base
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
        if alpha:
            mth = nt.nodes.new("ShaderNodeMath"); mth.operation = "ROUND"
            nt.links.new(t.outputs["Alpha"], mth.inputs[0]); nt.links.new(mth.outputs[0], b.inputs["Alpha"])
    if color: b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
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
        s.V.append((p.x, p.y, max(0.0, p.z))); s.W.append(w); s.CN.append(tuple(cn) if cn is not None else (0, 0, 0)); return len(s.V) - 1
    def f(s, idx, uvs, m): s.F.append(tuple(idx)); s.FUV.append(uvs); s.FM.append(m)
    def ff(s, pts, m, w, uvk=.45):  # a flat facet (ice): its own verts, the face normal as custom normal, planar UV
        n = (pts[1] - pts[0]).cross(pts[2] - pts[0])
        n = n.normalized() if n.length > 1e-9 else UP
        ids = [s.v(p, w, n) for p in pts]
        ax = Vector((1, 0, 0)) if abs(n.x) < .9 else Vector((0, 1, 0)); ux = ax.cross(n).normalized(); uy = n.cross(ux)
        s.f(ids, [(p.dot(ux) * uvk + .5, p.dot(uy) * uvk + .5) for p in pts], m)

def frames(pts):
    n = len(pts); T = [(pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized() for i in range(n)]
    N0 = T[0].cross(UP) if abs(T[0].dot(UP)) < .95 else T[0].cross(Vector((1, 0, 0)))
    Ns = [N0.normalized()]
    for i in range(1, n):
        p = Ns[-1]; nn = p - T[i] * p.dot(T[i]); Ns.append(nn.normalized() if nn.length > 1e-6 else p)
    return T, Ns

def tube(mb, pts, radii, sides, m, wfun, U=1.0, rfun=None, flat=(1, 1)):
    T, N = frames(pts); rings, vs, s = [], [], 0.0
    circ = TAU * max(radii[0], .02) / U
    for i, c in enumerate(pts):
        if i: s += (pts[i] - pts[i - 1]).length
        n = N[i]; b = T[i].cross(n).normalized(); w = wfun(i / (len(pts) - 1)); ring = []
        for j in range(sides):
            a = TAU * j / sides; r = max(.004, radii[i] * (rfun(i, a, c) if rfun else 1))
            ring.append(mb.v(c + n * (math.cos(a) * r * flat[0]) + b * (math.sin(a) * r * flat[1]), w))
        rings.append(ring); vs.append(s / circ)
    for i in range(len(pts) - 1):
        for j in range(sides):
            j2 = (j + 1) % sides; u0 = j / sides * U; u1 = (j + 1) / sides * U
            mb.f((rings[i][j], rings[i][j2], rings[i + 1][j2], rings[i + 1][j]), [(u0, vs[i]), (u1, vs[i]), (u1, vs[i + 1]), (u0, vs[i + 1])], m)

def wander(st, d, length, segs, gnarl, rise=0.0):
    pts = [st.copy()]; d = d.normalized(); p = st.copy()
    for k in range(segs):
        d = (d + rvec() * gnarl + UP * rise).normalized(); p = p + d * (length / segs); pts.append(p.copy())
    return pts

def connect(a, b, segs, wig=.12, arch=.2):
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

def roots(mb, m, n, z0r, Lr, rw, flat, sides=7, segs=8, w={"Trunk": 1}):
    for k in range(n):
        az = TAU * k / n + rr(-.25, .25); z0 = rr(*z0r); L = rr(*Lr); ph = rr(0, TAU); pts = []
        for s in range(segs + 1):
            t = s / segs; a = az + .15 * math.sin(t * 5 + ph)
            pts.append(hvec(a) * (.1 + L * t ** 1.1) + UP * (z0 * (1 - t) ** 2.3 - .1 * t))
        tube(mb, pts, taper(rw * rr(.85, 1.15), .03, segs + 1, .8), sides, m, lambda t: w, rfun=gnarl_r(.12, 3.0, k), flat=flat)

def bent_card(mb, c, size, n, up, w, uvr, m, center, segs=3, bend=.16, cnup=.55, squash=(1, 1, 1)):
    n = n.normalized(); y = up - n * up.dot(n)
    if y.length < 1e-3: y = rvec().cross(n)
    y = y.normalized(); x = y.cross(n).normalized()
    roll = rr(-.5, .5); y, x = (y * math.cos(roll) + x * math.sin(roll)).normalized(), (x * math.cos(roll) - y * math.sin(roll)).normalized()
    u0, v0, u1, v1 = uvr; wd = size * rr(.82, 1.0); rows = []
    for r in range(segs + 1):
        yy = -.5 + r / segs; row = []
        for xx in (-.5, .5):
            p = c + x * (xx * wd) + y * (yy * size) + n * (bend * size * (1 - (2 * yy) ** 2) - .06 * size * (2 * yy) ** 3)
            cn = p - center; cn = Vector((cn.x / squash[0], cn.y / squash[1], cn.z / squash[2])).normalized()
            cn = (cn + UP * cnup).normalized()
            row.append((mb.v(p, w, cn), (u0 + (xx + .5) * (u1 - u0), v0 + (yy + .5) * (v1 - v0))))
        rows.append(row)
    for r in range(segs):
        a, b, cc, d = rows[r][0], rows[r][1], rows[r + 1][1], rows[r + 1][0]
        mb.f((a[0], b[0], cc[0], d[0]), [a[1], b[1], cc[1], d[1]], m)

def foliage_mass(mb, mat, mc, Rm, nlobes, ncards, wfun, cells, twig_src=None, twig_mat=None, size=(.5, .9)):
    lobes = [(mc + Vector((0, 0, Rm.z * .2)), Vector((Rm.x * .62, Rm.y * .62, Rm.z * .66)))]
    for i in range(nlobes - 1):
        a = TAU * i / (nlobes - 1) + rr(-.35, .35); el = rr(-.2, .5)
        dv = Vector((math.cos(a) * math.cos(el), math.sin(a) * math.cos(el), math.sin(el)))
        lobes.append((mc + Vector((dv.x * Rm.x, dv.y * Rm.y, dv.z * Rm.z)) * rr(.42, .55), Rm * rr(.48, .6)))
    if twig_src:
        for lc, lr in lobes:
            st, w0, cb = twig_src(lc)
            tube(mb, connect(st, lc, 4, .1, .2), taper(.045, .012, 5), 5, twig_mat, lambda t, w0=w0, cb=cb: blend((w0, 1 - ss(0, .7, t)), (cb, ss(0, .7, t))))
    def inside(p, skip):
        return min(((p - lc).x / lr.x) ** 2 + ((p - lc).y / lr.y) ** 2 + ((p - lc).z / lr.z) ** 2 for j, (lc, lr) in enumerate(lobes) if j != skip)
    made = guard = 0
    while made < ncards and guard < ncards * 6:
        guard += 1; j = R.randrange(len(lobes)); lc, lr = lobes[j]; dv = rvec(); r = rr(.62, 1.04) ** .7
        pos = lc + Vector((dv.x * lr.x, dv.y * lr.y, dv.z * lr.z)) * r
        deep = inside(pos, j) < .6
        if deep and R.random() < .8: continue
        out = pos - mc; out = Vector((out.x / Rm.x ** 2, out.y / Rm.y ** 2, out.z / Rm.z ** 2)).normalized()
        dark = deep or dv.z < -.3 or R.random() < .12
        cell = cells[2 + R.randrange(2)] if dark else cells[R.randrange(2)]
        bent_card(mb, pos, rr(*size), out + rvec() * .5 + UP * .3, UP + out * .7, wfun(pos), cell, mat, mc, squash=(Rm.x, Rm.y, Rm.z))
        made += 1

def cone(mb, base, d, L, r, sides, m, w, rings=((0, 1), (.7, .55)), flat=True):
    # a faceted prism-spike along d: rings at fractions of L with radius scale, then the tip
    d = d.normalized(); n = d.cross(UP) if abs(d.dot(UP)) < .95 else d.cross(Vector((1, 0, 0))); n.normalize(); b = d.cross(n)
    tw = rr(0, TAU); R_ = []
    for f, sc in rings:
        R_.append([base + d * (L * f) + (n * math.cos(TAU * j / sides + tw) + b * math.sin(TAU * j / sides + tw)) * r * sc * rr(.85, 1.1) for j in range(sides)])
    tip = base + d * L
    for i in range(len(R_) - 1):
        for j in range(sides):
            j2 = (j + 1) % sides; a, bb, c, dd = R_[i][j], R_[i][j2], R_[i + 1][j2], R_[i + 1][j]
            mb.ff([a, bb, c], m, w); mb.ff([a, c, dd], m, w)
    for j in range(sides):
        mb.ff([R_[-1][j], R_[-1][(j + 1) % sides], tip], m, w)

# ---------------------------------------------------------------- rimepine
def skirt(mb, M, base, r, h, droop, nb, ph, wfun, sides=28):
    def lob(a): return .76 + .32 * (.5 + .5 * math.cos(nb * (a + ph))) ** 2 + .08 * mnoise.noise(Vector((math.cos(a) * 2.2, math.sin(a) * 2.2, base.z * 1.7)))
    def surf(t, a):  # the top needle surface
        return Vector((base.x, base.y, 0)) + hvec(a) * (r * lob(a) * t) + UP * (base.z + h * (1 - t) ** 1.25 - droop * t ** 2)
    prof = [(.04, None, 1.0), (.28, None, .88), (.52, None, .76), (.76, None, .64), (.95, None, .53),
            (1.0, -.1, .48), (.86, -.24, .36), (.45, -.3, .2), (.1, -.08, .05)]
    rows = []
    for t, dz, vv in prof:
        row = []
        for j in range(sides):
            a = TAU * j / sides
            if dz is None: p = surf(t, a)
            else:
                p = Vector((base.x, base.y, 0)) + hvec(a) * (r * lob(a) * t) + UP * (base.z - droop * min(1, t) ** 2 * (1 if t > .8 else .3) + dz)
            row.append((mb.v(p, wfun(t)), vv))
        rows.append(row)
    for i in range(len(rows) - 1):
        for j in range(sides):
            j2 = (j + 1) % sides; u0 = 5 * j / sides; u1 = 5 * (j + 1) / sides
            a, b, c, d = rows[i][j], rows[i + 1][j], rows[i + 1][j2], rows[i][j2]
            mb.f((a[0], b[0], c[0], d[0]), [(u0, a[1]), (u0, b[1]), (u1, c[1]), (u1, d[1])], M["needles"])
    # snow cap: lumps riding the lobes, tucked under the needles at its edge
    sp = [(0.0, .24), (.2, .22), (.4, .21), (.6, .19), (.74, .15), (.84, .07), (.9, -.04)]
    srows = []
    for t, th in sp:
        row = []
        for j in range(sides):
            a = TAU * j / sides; p = surf(t, a)
            peak = (.5 + .5 * math.cos(nb * (a + ph))) ** 1.5
            lump = .65 + .7 * (.5 + .5 * mnoise.noise(p * 1.9 + Vector((ph, 0, 0))))
            q = p + UP * (th * (.55 + .6 * peak) * lump if th > 0 else th)
            row.append(mb.v(q, wfun(t)))
        srows.append(row)
    for i in range(len(srows) - 1):
        for j in range(sides):
            j2 = (j + 1) % sides; ids = (srows[i][j], srows[i + 1][j], srows[i + 1][j2], srows[i][j2])
            mb.f(ids, [(mb.V[k][0] * .35, mb.V[k][1] * .35) for k in ids], M["snow"])
    return surf, lob

def build_pine(mb, M):
    tp = [Vector((.06 * math.sin(z * .7), .05 * math.sin(z * .9 + 1), z)) for z in [8.9 * k / 22 for k in range(23)]]
    radii = [max(.03, .3 * (1 - p.z / 9.2) ** .9 + .18 * math.exp(-p.z / .35)) for p in tp]
    def TW(z): return blend(({"Trunk": 1}, 1 - ss(2.5, 3.5, z)), ({"Trunk2": 1}, ss(2.5, 3.5, z) * (1 - ss(5.5, 6.5, z))), ({"Trunk3": 1}, ss(5.5, 6.5, z)))
    tube(mb, tp, radii, 12, M["bark"], lambda t: TW(t * 8.9), U=2)
    roots(mb, M["bark"], 5, (.4, .6), (.7, 1.1), .14, (1.6, .8))
    B = [("Trunk", Vector((0, 0, 0)), Vector((0, 0, 3)), None), ("Trunk2", Vector((0, 0, 3)), Vector((0, 0, 6)), "Trunk"), ("Trunk3", Vector((0, 0, 6)), Vector((0, 0, 9)), "Trunk2")]
    NT = 10
    for i in range(NT):
        f = i / (NT - 1)
        z = 1.35 + f * 6.75; r = 2.75 * (1 - f) ** 1.05 + .32; h = 1.3 - .55 * f; droop = .12 + .38 * (r / 3.0)
        nb = 7 if i < 4 else (6 if i < 7 else 5); ph = rr(0, TAU)
        c = Vector((.06 * math.sin(z * .7), .05 * math.sin(z * .9 + 1), z))
        tb = "Trunk" if z < 3 else ("Trunk2" if z < 6 else "Trunk3"); bn = f"Bough{i}"
        B.append((bn, c, c + UP * .6, tb))
        wf = lambda t, z=z, bn=bn: blend((TW(z), 1 - ss(.15, .85, t)), ({bn: 1}, ss(.15, .85, t)))
        surf, lob = skirt(mb, M, c, r, h, droop, nb, ph, wf)
        # bough sprays breaking the rim on each lobe
        for k in range(nb * 2):
            a = -ph + TAU * (k // 2) / nb + (rr(-.18, .18) if k % 2 == 0 else TAU / nb / 2 + rr(-.2, .2))
            if k % 2 and R.random() < .4: continue
            rim = surf(.93, a); out = hvec(a); sz = .45 + .5 * (r / 3.0) + rr(-.08, .08)
            bent_card(mb, rim + out * sz * .32 - UP * .04, sz, UP * .85 + out * .25 + rvec() * .15, out - UP * .25, wf(1.0),
                      M["cells"][0 if R.random() < .75 else 1], M["spray"], c, cnup=.7)
        if i < 3:  # icicles under the lowest tiers
            for k in range(14 - i * 3):
                a = rr(0, TAU); p = surf(1.0, a) - UP * .08 - hvec(a) * .05
                cone(mb, p + UP * .06, -UP, rr(.22, .62) * (1 - .2 * i), rr(.035, .065), 5, M["ice"], wf(1.0), rings=((0, 1), (.35, .7)))
    # the leader spire with its own snow nub
    top = [Vector((0, 0, 8.0)), Vector((0, 0, 8.5)), Vector((.03, 0, 9.0))]
    tube(mb, top, [.07, .045, .01], 6, M["needles"], lambda t: {"Trunk3": 1})
    return B

# ---------------------------------------------------------------- frostbirch
def build_birch(mb, M):
    tz = 3.3; tp = []
    for k in range(25):
        t = k / 24; tp.append(Vector((.28 * t ** 1.6 + .04 * math.sin(t * 7), .06 * math.sin(t * 4.5), tz * t)))
    radii = [.17 - .05 * (p.z / tz) + .14 * math.exp(-p.z / .3) for p in tp]
    def TW(t): return blend(({"Trunk": 1}, 1 - ss(.35, .7, t)), ({"Trunk2": 1}, ss(.35, .7, t)))
    tube(mb, tp, radii, 16, M["bark"], TW, U=1, rfun=gnarl_r(.05, 2.0))
    roots(mb, M["bark"], 4, (.3, .45), (.5, .8), .1, (1.5, .8), sides=6)
    T = tp[-1]
    B = [("Trunk", Vector((0, 0, 0)), tp[12], None), ("Trunk2", tp[12], T, "Trunk")]
    for s in range(4):  # dead lower stubs, black-scarred
        z = rr(1.0, 2.6); c = tp[int(z / tz * 24)]; az = rr(0, TAU)
        tube(mb, wander(c, hvec(az) + UP * .5, rr(.3, .7), 4, .1), taper(.04, .012, 5), 5, M["bark"], lambda t, z=z: {"Trunk": 1} if z < 1.6 else {"Trunk2": 1})
    leader = wander(T, UP + Vector((.08, 0, 0)), 3.5, 12, .07, rise=.02)
    tube(mb, leader, taper(.12, .025, 13), 9, M["bark"], lambda t: blend(({"Trunk2": 1}, 1 - ss(0, .4, t)), ({"Leader": 1}, ss(0, .4, t))))
    B.append(("Leader", leader[0], leader[-1], "Trunk2"))
    def LW(k, t): return blend(({"Trunk2": 1}, 1 - ss(0, .2, t)), ({f"Limb{k}": 1}, ss(0, .2, t) * (1 - ss(.5, .75, t))), ({f"Crown{k}": 1}, ss(.5, .75, t)))
    limbs = []
    for k in range(4):
        az = TAU * k / 4 + rr(-.35, .35); el = math.radians(rr(52, 66)); z0 = tz - rr(0, .7); c = tp[int(z0 / tz * 24)]
        d = hvec(az) * math.cos(el) + UP * math.sin(el)
        pts = wander(c, d, rr(2.4, 3.0), 10, .08, rise=.04)
        tube(mb, pts, taper(.09, .022, 11), 8, M["bark"], lambda t, k=k: LW(k, t))
        B += [(f"Limb{k}", pts[0], pts[5], "Trunk2"), (f"Crown{k}", pts[5], pts[10], f"Limb{k}")]
        limbs.append(pts)
        for s in range(3):
            i = R.randint(3, 8); w = LW(k, i / 10)
            sp = wander(pts[i], (d + hvec(az + rr(-1.2, 1.2)) * .6 + UP * .3), rr(.9, 1.4), 5, .1, rise=.05)
            tube(mb, sp, taper(.03, .008, 6), 5, M["bark"], lambda t, w=w: w)
    cells = M["cells"]
    for k in range(6):
        if k < 4:
            pts = limbs[k]; mc = pts[-1] + UP * .25; Rm = Vector((rr(1.05, 1.3), rr(1.05, 1.3), rr(1.0, 1.25)))
            cb = {f"Crown{k}": 1}; cand = [(i, pts[i]) for i in range(5, 11)]
            src = lambda lc, cand=cand, k=k, cb=cb: (lambda i, p: (p, LW(k, i / 10), cb))(*min(cand, key=lambda c: (c[1] - lc).length))
            wf = lambda p, cb=cb: cb
        else:
            mc = leader[-1 if k == 4 else 8] + UP * (.1 if k == 4 else 0); Rm = Vector((1.0, 1.0, 1.15)) * (.85 if k == 4 else 1.1)
            cand = [(i, leader[i]) for i in range(5, 13)]
            src = lambda lc, cand=cand: (lambda i, p: (p, {"Leader": 1}, {"Leader": 1}))(*min(cand, key=lambda c: (c[1] - lc).length))
            wf = lambda p: {"Leader": 1}
        foliage_mass(mb, M["rime"], mc, Rm, 6, BIRCH_CARDS, wf, cells, twig_src=src, twig_mat=M["bark"], size=(.55, .95))
    return B

# ---------------------------------------------------------------- icesnag
def build_snag(mb, M):
    tz = 1.7; tp = []
    for k in range(11):
        t = k / 10; tp.append(Vector((.05 * math.sin(t * 3), .04 * math.sin(t * 2.2 + 1), tz * t)))
    radii = [.4 - .05 * t / 10 + .22 * math.exp(-p.z / .3) for t, p in enumerate(tp)]
    def TW(t): return blend(({"Root": 1}, 1 - ss(.2, .8, t)), ({"Trunk": 1}, ss(.2, .8, t)))
    tube(mb, tp, radii, 18, M["bark"], TW, U=2, rfun=gnarl_r(.08, 2.5))
    roots(mb, M["bark"], 5, (.4, .6), (.8, 1.3), .16, (1.6, .8), w={"Root": 1})
    T = tp[-1]
    B = [("Root", Vector((0, 0, 0)), Vector((0, 0, .8)), None), ("Trunk", Vector((0, 0, .8)), T, "Root")]
    halves = []
    for hi, (sg, top, lean, rad) in enumerate(((-1, 5.0, .9, .27), (1, 3.5, 1.0, .25))):
        S = T + Vector((.13 * sg, 0, -.15)); hd = Vector((sg, .15 * sg, 0)).normalized()
        pts = bez([S, S + hd * .25 + UP * 1.0, S + hd * lean * .7 + UP * (top - tz) * .7, S + hd * lean + UP * (top - tz)], 12, .03)
        rs = taper(rad, rad * .55, 12, 1.0); rs[-1] = rad * .2; rs[-2] *= .8
        bn = "SplitA" if hi == 0 else "SplitB"
        tube(mb, pts, rs, 12, M["bark"], lambda t, bn=bn: blend(({"Trunk": 1}, 1 - ss(0, .25, t)), ({bn: 1}, ss(0, .25, t))), U=1, flat=(1, .62), rfun=gnarl_r(.1, 2.6, hi))
        B.append((bn, pts[0], pts[-1], "Trunk")); halves.append((pts, bn))
        tipc = pts[-2]; td = (pts[-1] - pts[-3]).normalized()
        for s in range(5):  # splintered break
            cone(mb, tipc + rvec() * rad * .35, (td + rvec() * .35).normalized(), rr(.25, .7), rr(.03, .07), 4, M["bark"], {bn: 1}, rings=((0, 1),))
        cone(mb, tipc + UP * .02, UP + rvec() * .1, .14, rad * .7, 6, M["snow"], {bn: 1}, rings=((0, 1), (.5, .8)))  # snow nub on the break
    pa, _ = halves[0]
    for s, i in enumerate((5, 8)):  # two dead limbs on the tall half, icicles under them
        az = math.atan2(pa[i].y, pa[i].x) + (1.2 if s else -1.4)
        lb = wander(pa[i], hvec(az) + UP * .5, rr(.8, 1.2), 5, .1)
        tube(mb, lb, taper(.08, .025, 6), 6, M["bark"], lambda t: {"SplitA": 1})
        for k in range(4):
            q = lb[R.randint(1, 5)]; cone(mb, q, -UP, rr(.15, .4), rr(.02, .04), 4, M["ice"], {"SplitA": 1}, rings=((0, 1),))
    # the ice mound around the base: faceted, higher on one side
    N = 13; prof = [(1.3, -.05), (1.25, .28), (1.05, .7), (.82, 1.1), (.6, 1.45), (.46, 1.72)]
    rows = []
    for i, (rad, z) in enumerate(prof):
        row = []
        for j in range(N):
            a = TAU * j / N + (j % 2) * .1 * (i % 2); side = .75 + .35 * math.cos(a - .8)
            rj = rad * (side if i else 1) * rr(.85, 1.12) + (0 if i else .1)
            zj = z * side * rr(.9, 1.1) if i else z
            row.append(Vector((math.cos(a) * max(rj, .44), math.sin(a) * max(rj, .44), zj)))
        rows.append(row)
    for i in range(len(rows) - 1):
        for j in range(N):
            j2 = (j + 1) % N; a, b, c, d = rows[i][j], rows[i][j2], rows[i + 1][j2], rows[i + 1][j]
            mb.ff([a, b, c], M["ice"], {"Root": 1}); mb.ff([a, c, d], M["ice"], {"Root": 1})
    # shards spearing up beside it
    for k in range(10):
        a = TAU * k / 10 + rr(-.25, .25); rad = rr(.75, 1.6); L = rr(.9, 2.9) * (1.15 if k % 3 == 0 else .8)
        p = hvec(a) * rad - UP * .25; d = (UP + hvec(a) * rr(.18, .55) + rvec() * .08).normalized()
        cone(mb, p, d, L, rr(.12, .26) * (.6 + .3 * L / 2.9), 6, M["ice"], {"Root": 1}, rings=((0, 1), (.62, .82)))
    for k in range(5):  # small crystals crusting the mound
        a = rr(0, TAU); p = hvec(a) * rr(.6, 1.0) + UP * rr(.3, .9)
        cone(mb, p, (hvec(a) + UP * 1.2).normalized(), rr(.3, .6), rr(.06, .1), 5, M["ice"], {"Root": 1}, rings=((0, 1),))
    # a drift of hard snow ringing the ice, fading into the ground
    NS = 22; dp = [(1.1, .2), (1.35, .3), (1.7, .18), (2.05, .07), (2.4, -.02)]; srows = []
    for rad, z in dp:
        row = []
        for j in range(NS):
            a = TAU * j / NS; l = .6 + .8 * (.5 + .5 * mnoise.noise(Vector((math.cos(a) * 1.7, math.sin(a) * 1.7, rad))))
            row.append(mb.v(hvec(a) * rad * (.9 + .2 * l) + UP * (z * l if z > 0 else z), {"Root": 1}))
        srows.append(row)
    for i in range(len(srows) - 1):
        for j in range(NS):
            j2 = (j + 1) % NS; ids = (srows[i][j], srows[i + 1][j], srows[i + 1][j2], srows[i][j2])
            mb.f(ids, [(mb.V[k][0] * .35, mb.V[k][1] * .35) for k in ids], M["snow"])
    return B

# ---------------------------------------------------------------- scene
BIRCH_CARDS = int(os.environ.get("FB_CARDS", "70"))
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
mats = []
def addmat(m): mats.append(m); return len(mats) - 1
M = {}
if NAME == "rimepine":
    col, h = bark_spruce(512, SEED)
    M["bark"] = addmat(material("bark", save_img(col, "bark.jpg"), save_img(normal_map(h, 8), "bark_n.jpg", "Non-Color"), rough=.85))
    col, h = needle_tex(512, SEED)
    M["needles"] = addmat(material("needles", save_img(col, "needles.jpg"), save_img(normal_map(h, 6), "needles_n.jpg", "Non-Color"), rough=.8, nstr=.8))
    atl, M["cells"] = spray_atlas(SEED)
    M["spray"] = addmat(material("spray", save_img(atl, "spray.png"), rough=.8, alpha=True))
if NAME == "frostbirch":
    col, h = bark_birch(1024, SEED)
    M["bark"] = addmat(material("bark", save_img(col, "bark.jpg"), save_img(normal_map(h, 5), "bark_n.jpg", "Non-Color"), rough=.7))
    atl, M["cells"] = rime_atlas(SEED)
    M["rime"] = addmat(material("rime", save_img(atl, "rime.png"), rough=.55, alpha=True))
if NAME == "icesnag":
    col, h = bark_dead(512, SEED)
    M["bark"] = addmat(material("bark", save_img(col, "bark.jpg"), save_img(normal_map(h, 8), "bark_n.jpg", "Non-Color"), rough=.8))
if NAME in ("rimepine", "icesnag"):
    col, h = snow_tex(256, SEED + 5)
    M["snow"] = addmat(material("snow", save_img(col, "snow.jpg"), save_img(normal_map(h, 4), "snow_n.jpg", "Non-Color"), rough=.75, nstr=.6))
    col, h = ice_tex(512, SEED + 9)
    M["ice"] = addmat(material("ice", save_img(col, "ice.jpg"), save_img(normal_map(h, 3), "ice_n.jpg", "Non-Color"), rough=.08, emit=((.16, .42, .46), .45), nstr=.5))

mb = MB()
B = {"rimepine": lambda: build_pine(mb, M), "frostbirch": lambda: build_birch(mb, M), "icesnag": lambda: build_snag(mb, M)}[NAME]()

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

# snow-laden trees move little: heavy, slow, the crowns a touch more
AMP = {"Root": 0.0, "Trunk": .35, "Trunk2": .6, "Trunk3": 1.1, "Bough": 1.3, "Leader": 2.2, "Limb": 1.6, "Crown": 2.8, "SplitA": .8, "SplitB": .7}
def amp(n):
    if n in AMP: return AMP[n]
    return next(v for kk, v in AMP.items() if n.startswith(kk))
scene.render.fps = 30; scene.frame_start = 0; scene.frame_end = 180
for i, pb in enumerate(ao.pose.bones):
    pb.rotation_mode = "XYZ"; A = math.radians(amp(pb.name))
    ph = .45 * i + (.8 if pb.name.startswith(("Crown", "Bough", "Leader")) else 0)
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
gmat = bpy.data.materials.new("gm"); gmat.use_nodes = True; gmat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (.22, .25, .3, 1); gm.materials.append(gmat)
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); sun.data.energy = 1.6; sun.data.color = (.62, .72, 1.0)
sun.rotation_euler = (math.radians(45), 0, math.radians(30)); scene.collection.objects.link(sun)
fire = bpy.data.objects.new("fire", bpy.data.lights.new("fire", "POINT")); fire.data.energy = 700; fire.data.color = (1, .45, .15)
fire.location = (3.5, -4.0, 1.2); scene.collection.objects.link(fire)
def cam(name, eye, aim, fov):
    c = bpy.data.objects.new(name, bpy.data.cameras.new(name)); scene.collection.objects.link(c)
    c.data.sensor_fit = "VERTICAL"; c.data.angle = math.radians(fov); c.location = eye
    c.rotation_euler = (Vector(aim) - Vector(eye)).to_track_quat("-Z", "Y").to_euler(); return c
views = [cam("c34", (H * 1.25, -H * 1.25, H * .55), (0, 0, H * .48), 40),
         cam("cplay", (9.9, -9.9, 14.0 + 1.0), (0, 0, 1.0), 50),
         cam("cground", (5.0, -6.5, 1.7), (0, 0, H * .4), 62)]
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
    if m["name"] in ("spray", "rime"): m["alphaMode"] = "MASK"; m["alphaCutoff"] = .5; m["doubleSided"] = True
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
