# abbey dressing bench: road kit helpers + wax/amber/sash surfaces, lathe, foundations, glyph rows, proof that keeps ground at z=0
import sys; sys.path.insert(0, "art/roadkit")
from common import *
import common
KINDS["veilwax"] = ("#a8987a", "#e7d9b8", .38, 0, 1)
KINDS["amber"] = ("#5e3d17", "#b27c3a", .32, 0, 1)
KINDS["sash"] = ("#4a1714", "#ac4c42", .92, 0, 2)
KINDS["brass"] = ("#3a2c18", "#c49c63", .45, .8, 2)
FOUND = 3.0  # foundation depth below the walk line

def abbey_mats():
    M = mats({"stone": "stone", "wax": "veilwax", "amber": "amber", "soot": "soot", "glow": "glow", "sash": "sash"})
    M["memory"] = make_mat("memory", None, emit=(.43, .72, .75))
    return M

def lathe(fn, segs, rings, mat, name="lathe", cap_top=None, cap_bot=True):
    """fn(theta, t) -> (x,y,z); t 0..1 top to bottom. cap_top: apex point (x,y,z) or None"""
    bm = bmesh.new()
    R = [[bm.verts.new(fn(2 * math.pi * k / segs, j / rings)) for k in range(segs)] for j in range(rings + 1)]
    for j in range(rings):
        for k in range(segs):
            bm.faces.new((R[j][k], R[j][(k + 1) % segs], R[j + 1][(k + 1) % segs], R[j + 1][k]))
    if cap_top is not None:
        a = bm.verts.new(cap_top)
        for k in range(segs): bm.faces.new((a, R[0][(k + 1) % segs], R[0][k]))
    if cap_bot: bm.faces.new(R[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    return link(me, name, mat)

def box(mat, x0, x1, y0, y1, z0, z1, j=0, seed=0):
    o = prim("cube", mat, loc=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), scl=((x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2))
    if j: jitter(o, j, 5, seed)
    return o

def foundation(mat, hx, hy):
    box(mat, -hx, hx, -hy, hy, -FOUND, 0.02)

def glyphs(M, cx, y, z0, rows, width, seed, h=.035, axis="x"):
    """worn inscription: short soot grooves, about a third chiselled away by time"""
    r = random.Random(seed)
    for i in range(rows):
        x = cx - width / 2; z = z0 - i * h * 1.9
        while x < cx + width / 2 - .02:
            w = r.uniform(.015, .05)
            if r.random() > .35:
                box(M["soot"], x, x + w, y - .004, y + .002, z, z + h * r.uniform(.5, 1))
            x += w + r.uniform(.01, .03)

def puddle(mat, cx, cy, z, r, seed, depth=.02, segs=14):
    o = prim("cyl", mat, loc=(cx, cy, z + depth / 2), vertices=segs, radius=r, depth=depth)
    for v in o.data.vertices:
        v.co.xy = Vector((cx, cy)) + (v.co.xy - Vector((cx, cy))) * (1 + .35 * mnoise.noise(Vector((v.co.x * 5 / r, v.co.y * 5 / r, seed))))
    return o

def drip(mat, pts, r0, seed=0):
    n = len(pts); rad = [r0 * (1 - .55 * i / (n - 1)) for i in range(n)]
    rad[-1] = r0 * .9  # the bead at the end of a run
    return tube(pts, rad, 6, mat)

def ship(name, center, dist, lights):
    o = finish(name)
    o.data.transform(Matrix.Translation((0, 0, -FOUND)))
    return proof(name, center, dist, lights)
