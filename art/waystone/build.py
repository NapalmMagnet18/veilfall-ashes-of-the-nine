# The Waystone of the Nine: one pass, source -> proof -> GLB. Rerun whole after any edit.
import bpy, bmesh, math, random, os
import numpy as np
from mathutils import Vector, Matrix
from PIL import Image

OUT = "/workspace/waystone"; PROOF = "/tmp/waystone"
os.makedirs(OUT, exist_ok=True); os.makedirs(PROOF, exist_ok=True)
R = random.Random(9)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------------- textures (packed into the glb)
TEX = 512
def fnoise(seed, cells=(4, 8, 16, 32, 64), falloff=0.55):
    g = np.random.default_rng(seed); out = np.zeros((TEX, TEX), np.float32); amp = 1.0; tot = 0
    for c in cells:
        a = (g.random((c, c)) * 255).astype(np.uint8)
        im = Image.fromarray(np.tile(a, (3, 3))).resize((TEX * 3, TEX * 3), Image.BICUBIC)
        out += np.asarray(im, np.float32)[TEX:2 * TEX, TEX:2 * TEX] / 255 * amp; tot += amp; amp *= falloff
    out /= tot; return (out - out.min()) / (out.max() - out.min() + 1e-6)
def hexc(h): h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])
def lin(h): return tuple(float(c) ** 2.2 for c in hexc(h))
def mix(a, b, t): return hexc(a)[None, None, :] * (1 - t[..., None]) + hexc(b)[None, None, :] * t[..., None]
def img(name, arr, noncolor=False):
    p = f"{OUT}/{name}.png"
    Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8)).save(p)
    im = bpy.data.images.load(p); im.pack()
    if noncolor: im.colorspace_settings.name = "Non-Color"
    return im
def normal_from(h, s):
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * s; gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * s
    n = np.dstack([-gx, gy, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    return n * 0.5 + 0.5
g = np.random.default_rng(5)
n1 = fnoise(1); speck = g.random((TEX, TEX)); grain = fnoise(11, cells=(64, 128, 256), falloff=0.8)
stone_h = n1 * 0.6 + grain * 0.4
stone_a = mix("#24242b", "#47464d", n1 * 0.75 + grain * 0.25); stone_a[speck > 0.985] *= 1.6
stone_a *= (0.85 + 0.15 * fnoise(2, cells=(2, 4, 8)))[..., None]
bas_a = mix("#101116", "#2b2c33", fnoise(3) * 0.5 + grain * 0.5)
scar_a = mix("#4c4b50", "#77746d", fnoise(4) * 0.6 + grain * 0.4)
moss_a = mix("#18230f", "#4b5b26", fnoise(6))
rust = fnoise(7); iron_a = mix("#1a191b", "#3a3433", grain)
iron_a = iron_a * (1 - np.clip((rust - 0.55) * 3, 0, 1))[..., None] + hexc("#6a3720")[None, None, :] * np.clip((rust - 0.55) * 3, 0, 1)[..., None]
wax_a = mix("#c9b993", "#ebdfc0", fnoise(8)); waxo_a = mix("#6f6350", "#a69878", fnoise(9))
xx = np.arange(TEX)[None, :]; yy = np.arange(TEX)[:, None]
weave = 0.82 + 0.09 * np.sin(xx * 2 * np.pi / 6) + 0.09 * np.sin(yy * 2 * np.pi / 6)
cloth_a = mix("#4e1a17", "#a0463b", fnoise(10)) * weave[..., None]
bone_a = mix("#b4a88c", "#e7d9b8", fnoise(12) * 0.7 + grain * 0.3)

def mat(name, albedo=None, rgb=None, rough=0.6, metal=0.0, normal=None, nstr=1.0, emit=None, estr=0.0, double=False):
    m = bpy.data.materials.new(name)
    try: m.use_nodes = True
    except Exception: pass
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    if albedo is not None:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = albedo; nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    elif rgb: b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if normal is not None:
        t2 = nt.nodes.new("ShaderNodeTexImage"); t2.image = normal
        nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = nstr
        nt.links.new(t2.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = estr
    m.use_backface_culling = not double
    return m
M = {
    "stone": mat("stone", img("stone_albedo", stone_a), rough=0.62, normal=img("stone_normal", normal_from(stone_h, 6), True), nstr=0.8),
    "stone_basalt": mat("stone_basalt", img("basalt_albedo", bas_a), rough=0.42, normal=img("basalt_normal", normal_from(grain, 3), True), nstr=0.5),
    "stone_scar": mat("stone_scar", img("scar_albedo", scar_a), rough=0.85),
    "moss": mat("moss", img("moss_albedo", moss_a), rough=0.9),
    "iron": mat("iron", img("iron_albedo", iron_a), rough=0.58, metal=0.75),
    "wax": mat("wax", img("wax_albedo", wax_a), rough=0.42),
    "wax_old": mat("wax_old", img("wax_old_albedo", waxo_a), rough=0.5),
    "cloth": mat("cloth", img("cloth_albedo", cloth_a), rough=0.9, double=True),
    "bone": mat("bone", img("bone_albedo", bone_a), rough=0.55),
    "glow": mat("glow", rgb=lin("#6DB8C0"), rough=0.4, emit=lin("#6DB8C0"), estr=3.0),
    "glow_flame": mat("glow_flame", rgb=lin("#ffb35a"), rough=0.5, emit=lin("#ffa648"), estr=8.0, double=True),
}

# ---------------- helpers
def new_obj(name, bm, mats):
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(M[m])
    o = bpy.data.objects.new(name, me); scene.collection.objects.link(o); return o
def faces_of(verts): return {f for v in verts for f in v.link_faces}
def hull(bm, pts, mi=0, smooth=False):
    vs = [bm.verts.new(p) for p in pts]
    r = bmesh.ops.convex_hull(bm, input=vs)
    junk = [x for x in r["geom_interior"] + r["geom_unused"] if isinstance(x, bmesh.types.BMVert)]
    if junk: bmesh.ops.delete(bm, geom=junk, context="VERTS")
    for x in r["geom"]:
        if isinstance(x, bmesh.types.BMFace): x.material_index = mi; x.smooth = smooth
def blob(bm, c, sc, mi=0, u=8, v=5, rot=None, smooth=True):
    m = Matrix.Translation(c) @ (rot if rot is not None else Matrix.Identity(4)) @ Matrix.Diagonal((*sc, 1))
    r = bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=1.0, matrix=m)
    for f in faces_of(r["verts"]): f.material_index = mi; f.smooth = smooth
def prism(bm, pts, z0, z1, mi=0):
    b = [bm.verts.new((x, y, z0)) for x, y in pts]; t = [bm.verts.new((x, y, z1)) for x, y in pts]
    fs = [bm.faces.new(list(reversed(b))), bm.faces.new(t)]
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n; fs.append(bm.faces.new((b[i], b[j], t[j], t[i])))
    for f in fs: f.material_index = mi
    return fs, b + t
def apply_mods(o):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    o.modifiers.clear(); o.data = me
def boolean(target, cutter):
    md = target.modifiers.new("cut", "BOOLEAN"); md.operation = "DIFFERENCE"; md.solver = "EXACT"
    md.object = cutter; md.use_self = True; md.use_hole_tolerant = True
    try: md.material_mode = "TRANSFER"
    except Exception as e: print("matmode", e)
    apply_mods(target); bpy.data.objects.remove(cutter)
def rot_cols(t, n, up):
    m = Matrix((t, n, up)).transposed(); return m.to_4x4()
UP = Vector((0, 0, 1))

# ---------------- plinth: three octagonal ashlar courses
STEPS = [(1.30, 0.0, 0.23, "all"), (1.02, 0.23, 0.46, "mid"), (0.76, 0.46, 0.68, "corner")]
C225 = math.cos(math.radians(22.5))
def perim(Rr):
    pts = []
    for k in range(8):
        a = math.radians(22.5 + 45 * k); b = math.radians(22.5 + 45 * (k + 1))
        c1 = (Rr * math.cos(a), Rr * math.sin(a)); c2 = (Rr * math.cos(b), Rr * math.sin(b))
        pts += [c1, ((c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2)]
    return pts
def oct_r(Rr, phi):  # radius of the octagon edge at angle phi (deg)
    d = ((phi - 45) % 45) - 22.5 if False else ((phi % 45) - 0) ; d = ((phi + 22.5) % 45) - 22.5
    return Rr * C225 / math.cos(math.radians(d))
pl = bmesh.new(); moss = bmesh.new()
for (Rr, lo, hi, mode) in STEPS:
    p = perim(Rr); slices = []
    if mode == "all": slices = [[(0, 0), p[i], p[(i + 1) % 16]] for i in range(16)]
    elif mode == "mid": slices = [[(0, 0), p[(2 * k + 1) % 16], p[(2 * k + 2) % 16], p[(2 * k + 3) % 16]] for k in range(8)]
    else: slices = [[(0, 0), p[2 * k], p[(2 * k + 2) % 16]] for k in range(8)]
    for sl in slices:
        cx = sum(q[0] for q in sl) / len(sl); cy = sum(q[1] for q in sl) / len(sl)
        sh = []
        for (x, y) in sl:
            d = Vector((cx - x, cy - y)); L = d.length
            sh.append((x + d.x / L * 0.011, y + d.y / L * 0.011))
        top = hi + R.uniform(-0.012, 0.006)
        fs, vs = prism(pl, sh, lo, top, 0)
        bmesh.ops.rotate(pl, verts=vs, cent=(cx, cy, (lo + top) / 2),
                         matrix=Matrix.Rotation(R.uniform(-0.012, 0.012), 3, Vector((R.uniform(-1, 1), R.uniform(-1, 1), 0)).normalized()))
        edges = list({e for f in fs for e in f.edges})
        bmesh.ops.bevel(pl, geom=edges, offset=0.022, segments=2, profile=0.5, affect="EDGES", clamp_overlap=True)
    # moss core fills the joints
    prism(moss, perim(Rr - 0.016)[::2], lo + 0.002, hi - 0.014, 0)
# moss clumps where tread meets the next riser
for (Rr, lo, hi, _), (Rn, _, _, _) in zip(STEPS[:2], STEPS[1:]):
    for i in range(12 if Rr > 1.2 else 9):
        phi = R.uniform(0, 360); r = oct_r(Rn, phi) + R.uniform(0.0, 0.05)
        c = Vector((r * math.cos(math.radians(phi)), r * math.sin(math.radians(phi)), hi))
        blob(moss, c, (R.uniform(0.05, 0.1), R.uniform(0.04, 0.07), R.uniform(0.012, 0.022)), 0, 7, 4,
             Matrix.Rotation(math.radians(phi), 4, "Z"))
# chips + crack cutter for the plinth
pc = bmesh.new()
for (Rr, lo, hi, _) in STEPS:
    p = perim(Rr)
    for i in range(10):
        if i < 4: q = p[2 * R.randrange(8)]; t = 1.0
        else:
            k = R.randrange(16); a = p[k]; b = p[(k + 1) % 16]; t = R.random(); q = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
        zc = hi if R.random() < 0.75 else lo + R.uniform(0.03, (hi - lo) * 0.7)
        rr = R.uniform(0.03, 0.07)
        m = Matrix.Translation((q[0] * 1.01, q[1] * 1.01, zc)) @ Matrix.Diagonal((1, R.uniform(0.6, 1.2), R.uniform(0.6, 1.0), 1))
        r_ = bmesh.ops.create_icosphere(pc, subdivisions=1, radius=rr, matrix=m)
def crack(bm, pts, normals, w=0.006, dout=0.03, din=0.05, mi=0):
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]; n = (normals[i] + normals[i + 1]).normalized()
        side = (b - a).cross(n).normalized() * w
        hull(bm, [a + side + n * dout, a - side + n * dout, a + side - n * din, a - side - n * din,
                  b + side + n * dout, b - side + n * dout, b + side - n * din, b - side - n * din], mi)
phc = -52.0; u = Vector((math.cos(math.radians(phc)), math.sin(math.radians(phc)), 0)); tt = Vector((-u.y, u.x, 0))
cp, cn = [], []
def jitter(): return tt * R.uniform(-0.03, 0.03)
for r in (0.5, 0.58, 0.64): cp.append(u * r + jitter() + Vector((0, 0, 0.68))); cn.append(UP)
e3 = oct_r(0.76, phc)
for z in (0.68, 0.6, 0.52, 0.46): cp.append(u * e3 + jitter() + Vector((0, 0, z))); cn.append(u)
for r in (e3 + 0.08, e3 + 0.17): cp.append(u * r + jitter() + Vector((0, 0, 0.46))); cn.append(UP)
e2 = oct_r(1.02, phc)
for z in (0.46, 0.38, 0.3, 0.23): cp.append(u * e2 + jitter() + Vector((0, 0, z))); cn.append(u)
for r in (e2 + 0.1, e2 + 0.19): cp.append(u * r + jitter() + Vector((0, 0, 0.23))); cn.append(UP)
crack(pc, cp, cn, w=0.007, din=0.06)
plinth = new_obj("plinth", pl, ["stone"]); boolean(plinth, new_obj("plinth_cut", pc, ["stone"]))
mossobj = new_obj("moss", moss, ["moss"])

# ---------------- obelisk: nine-sided basalt shaft
Z0, Z1, ZA, RB, RT, TH0 = 0.76, 2.86, 3.2, 0.42, 0.27, -90.0
C20, S20 = math.cos(math.radians(20)), math.sin(math.radians(20))
def Rz(z): return RB + (RT - RB) * (z - Z0) / (Z1 - Z0)
def vang(k): return math.radians(TH0 - 20 + 40 * k)
def fpt(k, s, z, d):
    th = math.radians(TH0 + 40 * k); n = Vector((math.cos(th), math.sin(th), 0)); t = Vector((-math.sin(th), math.cos(th), 0))
    return n * (Rz(z) * C20 + d) + t * s + Vector((0, 0, z))
def fn(k): th = math.radians(TH0 + 40 * k); return Vector((math.cos(th), math.sin(th), 0))
ob = bmesh.new()
# socle course
soc = [((RB + 0.06) * math.cos(vang(k)), (RB + 0.06) * math.sin(vang(k))) for k in range(9)]
fs, _ = prism(ob, soc, 0.6, 0.8, 0)
bmesh.ops.bevel(ob, geom=list({e for f in fs for e in f.edges}), offset=0.02, segments=2, profile=0.5, affect="EDGES", clamp_overlap=True)
lo_ = [ob.verts.new((Rz(Z0 - 0.02) * math.cos(vang(k)), Rz(Z0 - 0.02) * math.sin(vang(k)), Z0 - 0.02)) for k in range(9)]
hi_ = [ob.verts.new((Rz(Z1) * math.cos(vang(k)), Rz(Z1) * math.sin(vang(k)), Z1)) for k in range(9)]
apex = ob.verts.new((0, 0, ZA))
sf = [ob.faces.new(list(reversed(lo_)))]
for k in range(9):
    j = (k + 1) % 9; sf.append(ob.faces.new((lo_[k], lo_[j], hi_[j], hi_[k]))); sf.append(ob.faces.new((hi_[k], hi_[j], apex)))
bmesh.ops.bevel(ob, geom=list({e for f in sf for e in f.edges}), offset=0.014, segments=2, profile=0.5, affect="EDGES", clamp_overlap=True)
oc = bmesh.new()
ZLO, ZHI, ZPK = 0.94, 1.84, 1.97
def hw(z): return 0.29 * 2 * Rz(z) * S20
def panel_pts(k, d_in):
    prof = [(-hw(ZLO), ZLO), (hw(ZLO), ZLO), (hw(ZHI), ZHI), (0, ZPK), (-hw(ZHI), ZHI)]
    return [fpt(k, s, z, d) for (s, z) in prof for d in (0.06, -d_in)]
for k in range(9):
    if k == 0:
        hull(oc, panel_pts(0, 0.022), 0)
        continue
    hull(oc, panel_pts(k, 0.024), 1)
    for i in range(8):  # chisel gouges, some spilling past the frame
        s0 = R.uniform(-1.0, 1.0) * hw(1.4); z0 = R.uniform(ZLO - 0.03, ZPK); rho = R.uniform(0.018, 0.045); dd = R.uniform(0.035, 0.06)
        pts = []
        for j in range(6):
            a = j / 6 * 2 * math.pi + R.uniform(-0.3, 0.3)
            pts.append(fpt(k, s0 + math.cos(a) * rho, z0 + math.sin(a) * rho * 1.3, 0.04))
            pts.append(fpt(k, s0 + math.cos(a) * rho * 0.45, z0 + math.sin(a) * rho * 0.6, -dd))
        hull(oc, pts, 1)
    for i in range(2):  # slashes across the erased name
        s1, z1 = -hw(1.4) * 1.1, R.uniform(ZLO, ZHI); s2, z2 = hw(1.4) * 1.1, z1 + R.uniform(-0.15, 0.15)
        a, b = Vector((s1, z1)), Vector((s2, z2)); pr = Vector((-(b - a).y, (b - a).x)).normalized() * 0.006
        pts = []
        for q in (a + pr, a - pr, b + pr, b - pr):
            pts += [fpt(k, q.x, q.y, 0.04), fpt(k, q.x, q.y, -0.045)]
        hull(oc, pts, 1)
# the crack down face 1, through the socle
zs = np.linspace(2.8, 0.62, 16); s = 0.0; cp, cn = [], []
for z in zs:
    s = max(-0.07, min(0.07, s + R.uniform(-0.035, 0.035)))
    cp.append(fpt(1, s, float(z), 0.0)); cn.append(fn(1))
crack(oc, cp, cn, w=0.006, dout=0.09, din=0.035, mi=0)
obel = new_obj("obelisk", ob, ["stone_basalt"]); boolean(obel, new_obj("obelisk_cut", oc, ["stone_basalt", "stone_scar"]))

# ---------------- the one legible name: teal glyph strokes on face 0
gl = bmesh.new()
def stroke(a, b, w=0.0045):
    a, b = Vector(a), Vector(b); d = b - a
    if d.length < 1e-4: d = Vector((0, 0.001))
    pr = Vector((-d.y, d.x)).normalized() * w; ext = d.normalized() * w
    pts = []
    for q in (a + pr - ext, a - pr - ext, b + pr + ext, b - pr + ext):
        pts += [fpt(0, q.x, q.y, -0.027), fpt(0, q.x, q.y, -0.015)]
    hull(gl, pts, 0)
stroke((0, 1.02), (0, 1.76))
for q in [((0, 1.76), (0.034, 1.82)), ((0.034, 1.82), (0, 1.88)), ((0, 1.88), (-0.034, 1.82)), ((-0.034, 1.82), (0, 1.76))]: stroke(*q)
stroke((-0.04, 1.62), (0.04, 1.64)); stroke((-0.022, 1.46), (0.05, 1.44)); stroke((-0.046, 1.27), (0.03, 1.29))
stroke((0, 1.1), (-0.042, 1.0)); stroke((0, 1.1), (0.042, 1.0))
for i in range(9): z = 1.0 + i * 0.1; sdot = -hw(z) + 0.022; stroke((sdot, z), (sdot, z + 0.012), 0.005)
glyph = new_obj("glyph", gl, ["glow"])

# ---------------- iron collar, rivets, a hanging chain
ir = bmesh.new()
def band(z0, z1, off_in, off_out):
    rings = []
    for (z, off) in ((z0, off_in), (z0, off_out), (z1, off_out), (z1, off_in)):
        rings.append([ir.verts.new(((Rz(z) + off / C20) * math.cos(vang(k)), (Rz(z) + off / C20) * math.sin(vang(k)), z)) for k in range(9)])
    for a in range(4):
        A, B = rings[a], rings[(a + 1) % 4]
        for k in range(9):
            j = (k + 1) % 9; ir.faces.new((A[k], A[j], B[j], B[k]))
band(2.06, 2.20, -0.012, 0.028); band(2.05, 2.075, -0.01, 0.04); band(2.185, 2.21, -0.01, 0.04)
for k in range(9):
    for sx in (-0.055, 0.055): blob(ir, fpt(k, sx, 2.13, 0.03), (0.012, 0.012, 0.012), 0, 6, 4)
def link(c, R1, r2, uu, vv, ww, nu=8, nv=4, el=1.5):
    grid = []
    for i in range(nu):
        a = 2 * math.pi * i / nu; row = []
        for j in range(nv):
            b = 2 * math.pi * j / nv; rr = R1 + r2 * math.cos(b)
            row.append(ir.verts.new(c + uu * (rr * math.cos(a)) + ww * (rr * math.sin(a) * el) + vv * (r2 * math.sin(b))))
        grid.append(row)
    for i in range(nu):
        for j in range(nv):
            f = ir.faces.new((grid[i][j], grid[(i + 1) % nu][j], grid[(i + 1) % nu][(j + 1) % nv], grid[i][(j + 1) % nv])); f.smooth = True
th2 = math.radians(TH0 + 80); n2 = Vector((math.cos(th2), math.sin(th2), 0)); t2 = Vector((-n2.y, n2.x, 0))
top = fpt(2, 0.0, 2.04, 0.055)
link(top + Vector((0, 0, 0.01)), 0.016, 0.005, n2, UP.cross(n2), t2, el=1.0)  # staple ring
for i in range(6):
    c = top - Vector((0, 0, 0.04 + i * 0.047)) + n2 * (0.004 * i)
    uu, vv = (n2, t2) if i % 2 == 0 else (t2, n2)
    link(c, 0.017, 0.0048, uu, vv, UP)

# ---------------- wax, candles, flames
wx = bmesh.new(); fl = bmesh.new(); bn = bmesh.new(); cl = bmesh.new()
for i in range(16):  # pooled wax round the socle
    phi = i / 16 * 360 + R.uniform(-10, 10); r = R.uniform(0.52, 0.63)
    c = Vector((r * math.cos(math.radians(phi)), r * math.sin(math.radians(phi)), 0.68))
    blob(wx, c, (R.uniform(0.07, 0.13), R.uniform(0.05, 0.09), R.uniform(0.018, 0.034)), 0, 10, 5, Matrix.Rotation(math.radians(phi), 4, "Z"))
def riser_drips(Rr, hi, n, mi=0):
    ap = Rr * C225
    for i in range(n):
        na = math.radians(R.choice([-90, -45, -135, 0, 180, -90, -45]) + 0.0)
        nn = Vector((math.cos(na), math.sin(na), 0)); tv = Vector((-nn.y, nn.x, 0)); sx = R.uniform(-0.3, 0.3) * Rr
        L = R.uniform(0.05, 0.16)
        blob(wx, nn * (ap + 0.004) + tv * sx + Vector((0, 0, hi - L / 2 + 0.006)), (R.uniform(0.012, 0.022), 0.009, L / 2), mi, 6, 5, rot_cols(tv, nn, UP))
        blob(wx, nn * (ap - 0.02) + tv * sx + Vector((0, 0, hi)), (0.045, 0.035, 0.012), mi, 8, 4, rot_cols(tv, nn, UP))
riser_drips(0.76, 0.68, 10); riser_drips(1.02, 0.46, 7, 1); riser_drips(1.30, 0.23, 4, 1)
for (Rr, hi, rmin, n) in ((1.02, 0.46, 0.76, 4), (1.30, 0.23, 0.98, 3)):
    for i in range(n):
        phi = -90 + R.gauss(0, 50); r = R.uniform(rmin + 0.03, Rr * C225 - 0.06)
        blob(wx, Vector((r * math.cos(math.radians(phi)), r * math.sin(math.radians(phi)), hi)), (R.uniform(0.06, 0.11), R.uniform(0.04, 0.08), 0.012), 0, 9, 4, Matrix.Rotation(math.radians(phi), 4, "Z"))

placed = []
def spot(rmin, rmax, z, front):
    for _ in range(200):
        phi = (-90 + R.gauss(0, 65)) if front else R.uniform(0, 360)
        r = R.uniform(rmin, rmax); rad = R.uniform(0.018, 0.04)
        x, y = r * math.cos(math.radians(phi)), r * math.sin(math.radians(phi))
        if all((x - q[0]) ** 2 + (y - q[1]) ** 2 > (rad + q[3] + 0.012) ** 2 for q in placed):
            placed.append((x, y, z, rad, phi)); return placed[-1]
    return None
cand = []
for i in range(28): s_ = spot(0.53, 0.69, 0.68, False); s_ and cand.append(s_)
for i in range(11): s_ = spot(0.77, 0.9, 0.46, True); s_ and cand.append(s_)
for i in range(6): s_ = spot(0.99, 1.15, 0.23, True); s_ and cand.append(s_)
flames = []
for ci, (x, y, z0, r, phi) in enumerate(cand):
    h = R.uniform(0.025, 0.14) if z0 > 0.6 else R.uniform(0.02, 0.09)
    mi = 0 if R.random() < 0.6 else 1
    tilt = Matrix.Rotation(R.uniform(-0.08, 0.08), 4, "X") @ Matrix.Rotation(R.uniform(-0.08, 0.08), 4, "Y")
    base = Matrix.Translation((x, y, z0)) @ tilt
    low = R.uniform(0, 2 * math.pi); depth = R.uniform(0.1, 0.35) * h; n = 10
    bot, tp, inn = [], [], []
    for i in range(n):
        a = 2 * math.pi * i / n; dz = -depth * max(0.0, math.cos(a - low)); rr = r * R.uniform(0.92, 1.05)
        bot.append(wx.verts.new(base @ Vector((r * math.cos(a), r * math.sin(a), -0.008))))
        tp.append(wx.verts.new(base @ Vector((rr * math.cos(a), rr * math.sin(a), h + dz))))
        inn.append(wx.verts.new(base @ Vector((0.55 * r * math.cos(a), 0.55 * r * math.sin(a), h + dz * 0.6 - 0.006))))
    cen = wx.verts.new(base @ Vector((0, 0, h - depth * 0.4 - 0.012)))
    fs = [wx.faces.new(list(reversed(bot)))]
    for i in range(n):
        j = (i + 1) % n
        fs += [wx.faces.new((bot[i], bot[j], tp[j], tp[i])), wx.faces.new((tp[i], tp[j], inn[j], inn[i])), wx.faces.new((inn[i], inn[j], cen))]
    for f in fs: f.material_index = mi; f.smooth = True
    blob(wx, base @ Vector((r * 0.95 * math.cos(low), r * 0.95 * math.sin(low), h * 0.55)), (0.01, 0.01, h * 0.35 + 0.005), mi, 6, 4)
    blob(wx, Vector((x, y, z0)), (r * 1.9, r * 1.7, 0.007), mi, 8, 4, Matrix.Rotation(R.uniform(0, 6), 4, "Z"))
    wt = base @ Vector((0, 0, h - depth * 0.4 - 0.012))
    hull(ir, [wt + Vector((dx, dy, dz)) for dx in (-0.0025, 0.0025) for dy in (-0.0025, 0.0025) for dz in (0, 0.016)], 0)
    flames.append((ci, h, wt, phi, z0))
lit = sorted([f for f in flames if f[4] > 0.6 and abs(((f[3] + 90 + 180) % 360) - 180) < 65], key=lambda f: -f[1])[:3]
for (_, h, wt, phi, _) in lit:
    p = wt + Vector((0, 0, 0.012)); fh = R.uniform(0.05, 0.065); fw = fh * 0.42
    prof = [(0, 0), (0.7, 0.12), (1, 0.35), (0.7, 0.62), (0, 1), (-0.7, 0.62), (-1, 0.35), (-0.7, 0.12)]
    for kk in range(2):
        ang = R.uniform(0, 3) + kk * math.pi / 2; d = Vector((math.cos(ang), math.sin(ang), 0))
        fl.faces.new([fl.verts.new(p + d * (sx * fw * 0.5) + Vector((0, 0, sz * fh))) for sx, sz in prof])
print("candles", len(cand), "lit", len(lit))

# ---------------- bone offerings
for i in range(6):
    phi = -90 + R.gauss(0, 55); onTop = i < 2
    r = R.uniform(0.6, 0.68) if onTop else R.uniform(0.78, 0.9); z = 0.68 if onTop else 0.46
    c = Vector((r * math.cos(math.radians(phi)), r * math.sin(math.radians(phi)), z + 0.004))
    m = Matrix.Translation(c) @ Matrix.Rotation(R.uniform(-0.15, 0.15), 4, "X") @ Matrix.Rotation(R.uniform(-0.15, 0.15), 4, "Y")
    rr = bmesh.ops.create_cone(bn, cap_ends=True, cap_tris=False, segments=12, radius1=0.028, radius2=0.026, depth=0.008, matrix=m)
    rr2 = bmesh.ops.create_cone(bn, cap_ends=True, cap_tris=False, segments=8, radius1=0.009, radius2=0.009, depth=0.004, matrix=m @ Matrix.Translation((0, 0, 0.005)))
for i in range(3):
    phi = -90 + R.gauss(0, 40); r = R.uniform(1.0, 1.12) if i == 2 else R.uniform(0.8, 0.9); z = 0.23 if i == 2 else 0.46
    c = Vector((r * math.cos(math.radians(phi)), r * math.sin(math.radians(phi)), z + 0.009)); yaw = R.uniform(0, 6.28)
    d = Vector((math.cos(yaw), math.sin(yaw), 0))
    m = Matrix.Translation(c) @ Matrix.Rotation(yaw, 4, "Z") @ Matrix.Rotation(math.pi / 2, 4, "Y")
    bmesh.ops.create_cone(bn, cap_ends=True, cap_tris=False, segments=6, radius1=0.0065, radius2=0.0055, depth=0.05, matrix=m)
    blob(bn, c + d * 0.026, (0.011, 0.01, 0.009), 0, 6, 4); blob(bn, c - d * 0.026, (0.01, 0.009, 0.008), 0, 6, 4)
for f in bn.faces: f.smooth = True

# ---------------- torn red cloth tied round the band, knot on face 8
def poly_r(phi, ap):
    d = ((math.degrees(phi) - TH0 + 20) % 40) - 20
    return ap / math.cos(math.radians(d))
ring_b, ring_t = [], []
N = 45
for i in range(N):
    phi = 2 * math.pi * i / N; zb = 2.095 + 0.012 * math.sin(phi * 2 + 1)
    ap = (Rz(2.13) + 0.046 / C20) * C20
    rr = poly_r(phi, ap)
    ring_b.append(cl.verts.new((rr * math.cos(phi), rr * math.sin(phi), zb)))
    ring_t.append(cl.verts.new((rr * math.cos(phi), rr * math.sin(phi), zb + 0.075)))
cf = [cl.faces.new((ring_b[i], ring_b[(i + 1) % N], ring_t[(i + 1) % N], ring_t[i])) for i in range(N)]
for (s0, L, w, sw) in ((-0.02, 0.62, 0.075, 0.02), (0.026, 0.42, 0.058, -0.015)):
    cols, rows = 4, 12; grid = []
    tear = [R.uniform(-0.07, 0.02) for _ in range(cols + 1)]; tear[R.randrange(cols + 1)] -= 0.08
    for j in range(rows + 1):
        tj = j / rows; z = 2.11 - L * tj; row = []
        width = w * (0.45 + 0.55 * min(1, tj * 3))
        for c_ in range(cols + 1):
            sc = s0 + (c_ / cols - 0.5) * width + sw * math.sin(tj * 2.5)
            zz = z + (tear[c_] if j == rows else 0) + (0.004 * math.sin(c_ * 2.1 + j) if j else 0)
            d_ = 0.05 + 0.018 * math.sin(math.pi * tj) + 0.004 * math.sin(c_ * 1.7 + j * 0.9)
            row.append(cl.verts.new(fpt(8, sc, zz, d_)))
        grid.append(row)
    for j in range(rows):
        for c_ in range(cols):
            cf.append(cl.faces.new((grid[j][c_], grid[j][c_ + 1], grid[j + 1][c_ + 1], grid[j + 1][c_])))
bmesh.ops.solidify(cl, geom=cf, thickness=0.005)
for (sx, sc_) in ((-0.016, (0.032, 0.026, 0.036)), (0.02, (0.026, 0.022, 0.03))):
    kc = fpt(8, sx, 2.13, 0.07); th8 = math.radians(TH0 + 320)
    blob(cl, kc, sc_, 0, 8, 5, Matrix.Rotation(th8, 4, "Z") @ Matrix.Rotation(R.uniform(-0.5, 0.5), 4, "X"))
for f in cl.faces: f.smooth = True

objs = [plinth, mossobj, obel, glyph, new_obj("iron", ir, ["iron"]), new_obj("wax", wx, ["wax", "wax_old"]),
        new_obj("flames", fl, ["glow_flame"]), new_obj("bone", bn, ["bone"]), new_obj("cloth", cl, ["cloth"])]

# ---------------- join, box UVs, count
for o in scene.objects: o.select_set(False)
for o in objs: o.select_set(True)
bpy.context.view_layer.objects.active = plinth
with bpy.context.temp_override(active_object=plinth, selected_editable_objects=objs, selected_objects=objs):
    bpy.ops.object.join()
ws = plinth; ws.name = "waystone"
bm = bmesh.new(); bm.from_mesh(ws.data); uv = bm.loops.layers.uv.verify()
for f in bm.faces:
    nn = f.normal; ax = max(range(3), key=lambda i: abs(nn[i]))
    for l in f.loops:
        c = l.vert.co
        u_, v_ = (c.y, c.z) if ax == 0 else (c.x, c.z) if ax == 1 else (c.x, c.y)
        l[uv].uv = (u_ * 1.6, v_ * 1.6)
bm.to_mesh(ws.data); bm.free()
ws.data.update()
tris = sum(len(p.vertices) - 2 for p in ws.data.polygons)
bb = [ws.matrix_world @ Vector(c) for c in ws.bound_box]
print("TRIS", tris, "BBOX", [round(min(v[i] for v in bb), 3) for i in range(3)], [round(max(v[i] for v in bb), 3) for i in range(3)])
print("SLOTS", [m.name for m in ws.data.materials])

# ---------------- export
for o in scene.objects: o.select_set(False)
ws.select_set(True)
bpy.ops.export_scene.gltf(filepath=f"{OUT}/waystone.glb", export_format="GLB", use_selection=True, export_apply=True)

# ---------------- proof
scene.render.engine = "CYCLES"; scene.cycles.device = "CPU"; scene.cycles.samples = 24
try: scene.cycles.use_denoising = True
except Exception: pass
scene.render.resolution_x = scene.render.resolution_y = 640
w = bpy.data.worlds.new("w"); scene.world = w
try: w.use_nodes = True
except Exception: pass
w.node_tree.nodes["Background"].inputs[0].default_value = (0.012, 0.016, 0.03, 1)
gnd = bpy.data.meshes.new("g"); gb = bmesh.new(); bmesh.ops.create_grid(gb, x_segments=1, y_segments=1, size=6); gb.to_mesh(gnd); gb.free()
go = bpy.data.objects.new("ground", gnd); scene.collection.objects.link(go); gnd.materials.append(mat("gmat", rgb=(0.02, 0.02, 0.025), rough=0.35))
def light(kind, loc, energy, color, size=0.1):
    L = bpy.data.lights.new(kind + str(loc), kind); L.energy = energy; L.color = color
    if kind == "POINT": L.shadow_soft_size = size
    o = bpy.data.objects.new(L.name, L); o.location = loc; scene.collection.objects.link(o); return o
sun = light("SUN", (0, 0, 10), 0.9, (0.55, 0.65, 1.0)); sun.rotation_euler = (math.radians(40), math.radians(-20), math.radians(30))
light("POINT", (0.3, -1.3, 1.0), 28, (1.0, 0.6, 0.3), 0.2)
light("POINT", (0, -0.75, 1.45), 6, (0.43, 0.72, 0.75))
light("POINT", (2.5, 2.0, 2.5), 40, (0.5, 0.6, 1.0), 0.5)
def cam(name, pos, tgt, lens=50):
    c = bpy.data.cameras.new(name); c.lens = lens; o = bpy.data.objects.new(name, c); o.location = pos
    o.rotation_euler = (Vector(tgt) - Vector(pos)).to_track_quat("-Z", "Y").to_euler(); scene.collection.objects.link(o); return o
for nm, pos, tgt, lens in (("iso", (0, -4.6, 5.6), (0, 0, 1.3), 42), ("glyph", (0.25, -1.55, 1.55), (0, 0, 1.35), 50), ("back", (3.4, 2.4, 2.6), (0, 0, 1.3), 42)):
    scene.camera = cam(nm, pos, tgt, lens); scene.render.filepath = f"{PROOF}/proof_{nm}.png"
    bpy.ops.render.render(write_still=True)
